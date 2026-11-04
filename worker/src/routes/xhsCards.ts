import type { Env } from '../types';
import { createTraceId, getBearerToken, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { getAiFormatAuthMode } from '../lib/permissions';
import { getFormatPreviewChars, logFormatEvent, truncateForLog } from '../lib/logging';
import { XHS_CARDS_PROMPT } from '../lib/xhsCardsPrompt';
import { checkInputLength, consumeDailyQuota, refundDailyQuota, resolveQuotaSubject, resolveUpstreamConfig } from '../lib/aiGuard';
import { callUpstreamChat, toChatCompletionResponse, UpstreamChatError } from '../lib/upstreamChat';

// 鉴权规则与 /api/format（AI 排版）一致：online 模式下默认需要登录或有效 Secret。
export async function handleXhsCards(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const traceId = createTraceId(request);
  const startedAt = Date.now();
  const previewChars = getFormatPreviewChars(env);
  const authMode = getAiFormatAuthMode(env);

  logFormatEvent(env, traceId, 'request.received', {
    method: request.method,
    path: new URL(request.url).pathname,
    origin: request.headers.get('Origin') ?? '',
    hasAuthHeader: Boolean(request.headers.get('Authorization')),
    authMode,
    feature: 'xhs-cards',
  });

  const bearerToken = getBearerToken(request);
  const authenticatedUser = await authenticateUser(request, env);

  if (authMode === 'user') {
    if (!authenticatedUser) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_required', feature: 'xhs-cards' });
      return jsonResponse({ error: 'AI 图文生成需要先登录' }, 401, cors);
    }
  } else if (authMode === 'secret') {
    if (!env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'config.error', { reason: 'missing_upload_secret', feature: 'xhs-cards' });
      return jsonResponse({ error: '服务端未配置 Upload Secret' }, 500, cors);
    }
    if (bearerToken !== env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'invalid_upload_secret', feature: 'xhs-cards' });
      return jsonResponse({ error: '未授权，请检查 Secret' }, 401, cors);
    }
  } else if (authMode === 'either') {
    const secretValid = Boolean(env.UPLOAD_SECRET) && bearerToken === env.UPLOAD_SECRET;
    if (!authenticatedUser && !secretValid) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_or_secret_required', feature: 'xhs-cards' });
      return jsonResponse({ error: '需要登录或有效 Secret 才能使用 AI 图文生成' }, 401, cors);
    }
  }

  if (!env.OPENAI_API_KEY) {
    logFormatEvent(env, traceId, 'config.error', { reason: 'missing_openai_api_key', feature: 'xhs-cards' });
    return jsonResponse({ error: '服务端未配置 OPENAI_API_KEY' }, 500, cors);
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: '请求体必须是 JSON' }, 400, cors);
  }

  const markdown = typeof body?.markdown === 'string' ? body.markdown : '';
  if (!markdown) {
    return jsonResponse({ error: '缺少 markdown 字段' }, 400, cors);
  }

  const inputError = checkInputLength(env, markdown);
  if (inputError) {
    logFormatEvent(env, traceId, 'request.too_large', { markdownLength: markdown.length, feature: 'xhs-cards' });
    return jsonResponse({ error: inputError }, 413, cors);
  }

  // 客户端传来的 baseUrl / model 一律忽略，只用服务端配置（防止 OPENAI_API_KEY 被转发到第三方地址）
  const { endpoint, model: modelName } = resolveUpstreamConfig(env);

  const usedSecret = !authenticatedUser && Boolean(env.UPLOAD_SECRET) && bearerToken === env.UPLOAD_SECRET;
  const quotaSubject = resolveQuotaSubject(request, authenticatedUser, usedSecret);
  try {
    const quota = await consumeDailyQuota(env, quotaSubject);
    if (!quota.ok) {
      logFormatEvent(env, traceId, 'quota.exceeded', { subject: quotaSubject?.key || '', limit: quota.limit, feature: 'xhs-cards' });
      return jsonResponse({ error: `今日 AI 调用次数已用完（每日 ${quota.limit} 次），请明天再试` }, 429, cors);
    }
  } catch (err: any) {
    logFormatEvent(env, traceId, 'quota.error', { message: err?.message || 'unknown', feature: 'xhs-cards' });
    return jsonResponse({ error: '服务端额度表未初始化，请执行 schema.sql 中的 ai_usage 建表语句' }, 500, cors);
  }

  logFormatEvent(env, traceId, 'request.parsed', {
    markdownLength: markdown.length,
    markdownPreview: truncateForLog(markdown, previewChars),
    resolvedEndpoint: endpoint,
    resolvedModel: modelName,
    userId: authenticatedUser?.id || '',
    feature: 'xhs-cards',
  });

  try {
    const upstreamStartedAt = Date.now();
    // 流式请求：避免长文生成时中转的 Cloudflare 边缘 100 秒无响应超时（524）
    const content = await callUpstreamChat({
      endpoint,
      apiKey: env.OPENAI_API_KEY,
      model: modelName,
      systemPrompt: XHS_CARDS_PROMPT,
      userContent: markdown,
      temperature: 0.7,
    });

    const upstreamDurationMs = Date.now() - upstreamStartedAt;

    logFormatEvent(env, traceId, 'request.completed', {
      totalDurationMs: Date.now() - startedAt,
      upstreamDurationMs,
      streamed: true,
      outputChars: content.length,
      feature: 'xhs-cards',
    });

    return jsonResponse(toChatCompletionResponse(content), 200, cors);
  } catch (err: any) {
    await refundDailyQuota(env, quotaSubject);
    if (err instanceof UpstreamChatError) {
      logFormatEvent(env, traceId, 'upstream.request.failed', {
        status: err.status,
        errorPreview: truncateForLog(err.details, previewChars),
        feature: 'xhs-cards',
      });
      return jsonResponse({ error: '上游 AI 请求失败', details: err.details }, err.status, cors);
    }
    logFormatEvent(env, traceId, 'worker.exception', {
      totalDurationMs: Date.now() - startedAt,
      message: err?.message || 'unknown',
      feature: 'xhs-cards',
    });
    return jsonResponse({ error: 'Worker 请求大模型失败', message: err?.message || 'unknown' }, 500, cors);
  }
}
