import type { Env } from '../types';
import { createTraceId, getBearerToken, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { getAiFormatAuthMode } from '../lib/permissions';
import { getFormatPreviewChars, logFormatEvent, truncateForLog } from '../lib/logging';
import { FORMAT_PROMPT } from '../lib/formatPrompt';
import { buildFormatPreferencePrompt, normalizeFormatPreferences, sanitizeFormatCustomNote } from '../lib/formatPreferences';
import { checkInputLength, consumeDailyQuota, refundDailyQuota, resolveQuotaSubject, resolveUpstreamConfig } from '../lib/aiGuard';
import { callUpstreamChat, toChatCompletionResponse, UpstreamChatError } from '../lib/upstreamChat';

export async function handleFormat(
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
    userAgent: request.headers.get('User-Agent') ?? '',
    contentLength: request.headers.get('Content-Length') ?? 'unknown',
    hasAuthHeader: Boolean(request.headers.get('Authorization')),
    usingWorkerSecret: Boolean(env.UPLOAD_SECRET),
    authMode,
  });

  const bearerToken = getBearerToken(request);
  const authenticatedUser = await authenticateUser(request, env);

  if (authMode === 'user') {
    if (!authenticatedUser) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_required' });
      return jsonResponse({ error: 'AI 排版需要先登录' }, 401, cors);
    }

    logFormatEvent(env, traceId, 'auth.passed', {
      mode: 'session_user',
      userId: authenticatedUser.id,
      userRole: authenticatedUser.role,
    }, 'verbose');
  } else if (authMode === 'secret') {
    if (!env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'config.error', { reason: 'missing_upload_secret' });
      return jsonResponse({ error: '服务端未配置 Upload Secret' }, 500, cors);
    }

    if (bearerToken !== env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'invalid_upload_secret' });
      return jsonResponse({ error: '未授权，请检查 Secret' }, 401, cors);
    }

    logFormatEvent(env, traceId, 'auth.passed', { mode: 'upload_secret' }, 'verbose');
  } else if (authMode === 'either') {
    if (authenticatedUser) {
      logFormatEvent(env, traceId, 'auth.passed', {
        mode: 'session_user',
        userId: authenticatedUser.id,
        userRole: authenticatedUser.role,
      }, 'verbose');
    } else if (env.UPLOAD_SECRET && bearerToken === env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'auth.passed', { mode: 'upload_secret' }, 'verbose');
    } else {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_or_secret_required' });
      return jsonResponse({ error: '需要登录或有效 Secret 才能使用 AI 排版' }, 401, cors);
    }
  } else {
    logFormatEvent(env, traceId, 'auth.skipped', { reason: 'auth_mode_off' }, 'verbose');
  }

  if (!env.OPENAI_API_KEY) {
    logFormatEvent(env, traceId, 'config.error', { reason: 'missing_openai_api_key' });
    return jsonResponse({ error: '服务端未配置 OPENAI_API_KEY' }, 500, cors);
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err: any) {
    logFormatEvent(env, traceId, 'request.invalid_json', {
      message: err?.message || 'unknown',
    });
    return jsonResponse({ error: '请求体必须是 JSON' }, 400, cors);
  }

  const markdown = typeof body?.markdown === 'string' ? body.markdown : '';
  if (!markdown) {
    logFormatEvent(env, traceId, 'request.invalid_payload', {
      reason: 'missing_markdown',
      bodyKeys: typeof body === 'object' && body ? Object.keys(body) : [],
    });
    return jsonResponse({ error: '缺少 markdown 字段' }, 400, cors);
  }

  const preferences = normalizeFormatPreferences(body?.preferences);
  const customNote = sanitizeFormatCustomNote(body?.customNote);
  const systemPrompt = FORMAT_PROMPT + buildFormatPreferencePrompt(preferences, customNote);

  const inputError = checkInputLength(env, markdown);
  if (inputError) {
    logFormatEvent(env, traceId, 'request.too_large', { markdownLength: markdown.length });
    return jsonResponse({ error: inputError }, 413, cors);
  }

  // 客户端传来的 baseUrl / model 一律忽略，只用服务端配置（防止 OPENAI_API_KEY 被转发到第三方地址）
  const { endpoint, model: modelName } = resolveUpstreamConfig(env);

  const usedSecret = !authenticatedUser && Boolean(env.UPLOAD_SECRET) && bearerToken === env.UPLOAD_SECRET;
  const quotaSubject = resolveQuotaSubject(request, authenticatedUser, usedSecret);
  try {
    const quota = await consumeDailyQuota(env, quotaSubject);
    if (!quota.ok) {
      logFormatEvent(env, traceId, 'quota.exceeded', { subject: quotaSubject?.key || '', limit: quota.limit });
      return jsonResponse({ error: `今日 AI 调用次数已用完（每日 ${quota.limit} 次），请明天再试` }, 429, cors);
    }
  } catch (err: any) {
    logFormatEvent(env, traceId, 'quota.error', { message: err?.message || 'unknown' });
    return jsonResponse({ error: '服务端额度表未初始化，请执行 schema.sql 中的 ai_usage 建表语句' }, 500, cors);
  }

  logFormatEvent(env, traceId, 'request.parsed', {
    markdownLength: markdown.length,
    markdownPreview: truncateForLog(markdown, previewChars),
    resolvedEndpoint: endpoint,
    resolvedModel: modelName,
    userId: authenticatedUser?.id || '',
    userRole: authenticatedUser?.role || '',
    preferences,
    customNote: truncateForLog(customNote, previewChars),
  });

  try {
    const upstreamStartedAt = Date.now();
    logFormatEvent(env, traceId, 'upstream.request.started', {
      endpoint,
      model: modelName,
      temperature: 0.7,
      streamed: true,
      promptChars: systemPrompt.length,
      markdownChars: markdown.length,
    }, 'verbose');

    // 流式请求：避免长文生成时中转的 Cloudflare 边缘 100 秒无响应超时（524）
    const content = await callUpstreamChat({
      endpoint,
      apiKey: env.OPENAI_API_KEY,
      model: modelName,
      systemPrompt,
      userContent: markdown,
      temperature: 0.7,
    });

    const upstreamDurationMs = Date.now() - upstreamStartedAt;

    logFormatEvent(env, traceId, 'upstream.request.succeeded', {
      durationMs: upstreamDurationMs,
      streamed: true,
      outputChars: content.length,
    });
    logFormatEvent(env, traceId, 'request.completed', {
      totalDurationMs: Date.now() - startedAt,
      outputPreview: truncateForLog(content, previewChars),
    }, 'verbose');

    return jsonResponse(toChatCompletionResponse(content), 200, cors);
  } catch (err: any) {
    await refundDailyQuota(env, quotaSubject);
    if (err instanceof UpstreamChatError) {
      logFormatEvent(env, traceId, 'upstream.request.failed', {
        status: err.status,
        errorPreview: truncateForLog(err.details, previewChars),
      });
      return jsonResponse({ error: '上游 AI 请求失败', details: err.details }, err.status, cors);
    }
    logFormatEvent(env, traceId, 'worker.exception', {
      totalDurationMs: Date.now() - startedAt,
      message: err?.message || 'unknown',
      stack: err?.stack ? truncateForLog(err.stack, previewChars * 2) : '',
    });
    return jsonResponse({ error: 'Worker 请求大模型失败', message: err?.message || 'unknown' }, 500, cors);
  }
}
