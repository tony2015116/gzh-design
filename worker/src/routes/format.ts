import type { Env } from '../types';
import { createTraceId, getBearerToken, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { getAiFormatAuthMode } from '../lib/permissions';
import { getFormatPreviewChars, logFormatEvent, truncateForLog } from '../lib/logging';

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

  const defaultAIPrompt = `
你是一个专业的微信公众号排版助手。请在不改变原意的前提下，对用户提供的 Markdown 做结构化优化。

你的目标：
1. 补全必要的标题层级。
2. 强调重点句和结论句。
3. 适度插入引用、分割线、总结卡片和信息卡片。
4. 保持输出仍然是可被排版系统解析的 Markdown。

输出规则：
- 只返回改写后的 Markdown。
- 不要输出解释、前言或代码围栏。
- 如需总结卡片，可输出 <SummaryCard title="摘要">内容</SummaryCard>
- 如需信息卡片，可输出 <InfoCard title="提示">内容</InfoCard>
- 一级标题支持：# 序号 | 主标题 | 副标题
- 二级标题支持：## STEP01 | 小节标题
`;

  const baseUrl = body.baseUrl || env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const modelName = body.model || env.OPENAI_MODEL || 'gpt-4o';
  let endpoint = baseUrl;
  if (!endpoint.endsWith('chat/completions')) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
  }

  logFormatEvent(env, traceId, 'request.parsed', {
    markdownLength: markdown.length,
    markdownPreview: truncateForLog(markdown, previewChars),
    requestedBaseUrl: body.baseUrl || '',
    resolvedEndpoint: endpoint,
    requestedModel: body.model || '',
    resolvedModel: modelName,
    hasCustomBaseUrl: Boolean(body.baseUrl),
    hasCustomModel: Boolean(body.model),
    userId: authenticatedUser?.id || '',
    userRole: authenticatedUser?.role || '',
  });

  try {
    const upstreamStartedAt = Date.now();
    logFormatEvent(env, traceId, 'upstream.request.started', {
      endpoint,
      model: modelName,
      temperature: 0.7,
      promptChars: defaultAIPrompt.length,
      markdownChars: markdown.length,
    }, 'verbose');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: defaultAIPrompt },
          { role: 'user', content: markdown },
        ],
        temperature: 0.7,
      }),
    });

    const upstreamDurationMs = Date.now() - upstreamStartedAt;
    const upstreamRequestId = response.headers.get('x-request-id')
      ?? response.headers.get('openai-request-id')
      ?? response.headers.get('cf-ray')
      ?? '';

    if (!response.ok) {
      const errorText = await response.text();
      logFormatEvent(env, traceId, 'upstream.request.failed', {
        status: response.status,
        statusText: response.statusText,
        durationMs: upstreamDurationMs,
        upstreamRequestId,
        errorPreview: truncateForLog(errorText, previewChars),
      });
      return jsonResponse({ error: '上游 AI 请求失败', details: errorText }, response.status, cors);
    }

    const data: any = await response.json();
    const content = data?.choices?.[0]?.message?.content || '';
    const finishReason = data?.choices?.[0]?.finish_reason || '';
    const usage = data?.usage || null;

    logFormatEvent(env, traceId, 'upstream.request.succeeded', {
      status: response.status,
      durationMs: upstreamDurationMs,
      upstreamRequestId,
      finishReason,
      outputChars: typeof content === 'string' ? content.length : 0,
      usage,
    });
    logFormatEvent(env, traceId, 'request.completed', {
      totalDurationMs: Date.now() - startedAt,
      outputPreview: typeof content === 'string' ? truncateForLog(content, previewChars) : '',
    }, 'verbose');

    return jsonResponse(data, 200, cors);
  } catch (err: any) {
    logFormatEvent(env, traceId, 'worker.exception', {
      totalDurationMs: Date.now() - startedAt,
      message: err?.message || 'unknown',
      stack: err?.stack ? truncateForLog(err.stack, previewChars * 2) : '',
    });
    return jsonResponse({ error: 'Worker 请求大模型失败', message: err?.message || 'unknown' }, 500, cors);
  }
}
