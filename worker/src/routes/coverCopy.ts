import type { Env } from '../types';
import { createTraceId, getBearerToken, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { getAiFormatAuthMode } from '../lib/permissions';
import { getFormatPreviewChars, logFormatEvent, truncateForLog } from '../lib/logging';
import { COVER_COPY_PROMPT } from '../lib/coverCopyPrompt';

// 鉴权规则与 /api/format（AI 排版）一致：online 模式下默认需要登录或有效 Secret。
export async function handleCoverCopy(
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
    feature: 'cover-copy',
  });

  const bearerToken = getBearerToken(request);
  const authenticatedUser = await authenticateUser(request, env);

  if (authMode === 'user') {
    if (!authenticatedUser) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_required', feature: 'cover-copy' });
      return jsonResponse({ error: 'AI 封面方案需要先登录' }, 401, cors);
    }
  } else if (authMode === 'secret') {
    if (!env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'config.error', { reason: 'missing_upload_secret', feature: 'cover-copy' });
      return jsonResponse({ error: '服务端未配置 Upload Secret' }, 500, cors);
    }
    if (bearerToken !== env.UPLOAD_SECRET) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'invalid_upload_secret', feature: 'cover-copy' });
      return jsonResponse({ error: '未授权，请检查 Secret' }, 401, cors);
    }
  } else if (authMode === 'either') {
    const secretValid = Boolean(env.UPLOAD_SECRET) && bearerToken === env.UPLOAD_SECRET;
    if (!authenticatedUser && !secretValid) {
      logFormatEvent(env, traceId, 'auth.failed', { reason: 'login_or_secret_required', feature: 'cover-copy' });
      return jsonResponse({ error: '需要登录或有效 Secret 才能使用 AI 封面方案' }, 401, cors);
    }
  }

  if (!env.OPENAI_API_KEY) {
    logFormatEvent(env, traceId, 'config.error', { reason: 'missing_openai_api_key', feature: 'cover-copy' });
    return jsonResponse({ error: '服务端未配置 OPENAI_API_KEY' }, 500, cors);
  }

  let body: any;
  try {
    body = await request.json();
  } catch (err: any) {
    return jsonResponse({ error: '请求体必须是 JSON' }, 400, cors);
  }

  const markdown = typeof body?.markdown === 'string' ? body.markdown : '';
  if (!markdown) {
    return jsonResponse({ error: '缺少 markdown 字段' }, 400, cors);
  }

  const baseUrl = body.baseUrl || env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const modelName = body.model || env.OPENAI_MODEL || 'gpt-4o';
  let endpoint = baseUrl;
  if (!endpoint.endsWith('chat/completions')) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
  }

  logFormatEvent(env, traceId, 'request.parsed', {
    markdownLength: markdown.length,
    markdownPreview: truncateForLog(markdown, previewChars),
    resolvedEndpoint: endpoint,
    resolvedModel: modelName,
    userId: authenticatedUser?.id || '',
    feature: 'cover-copy',
  });

  try {
    const upstreamStartedAt = Date.now();
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: 'system', content: COVER_COPY_PROMPT },
          { role: 'user', content: markdown },
        ],
        temperature: 0.8,
      }),
    });

    const upstreamDurationMs = Date.now() - upstreamStartedAt;

    if (!response.ok) {
      const errorText = await response.text();
      logFormatEvent(env, traceId, 'upstream.request.failed', {
        status: response.status,
        durationMs: upstreamDurationMs,
        errorPreview: truncateForLog(errorText, previewChars),
        feature: 'cover-copy',
      });
      return jsonResponse({ error: '上游 AI 请求失败', details: errorText }, response.status, cors);
    }

    const data: any = await response.json();

    logFormatEvent(env, traceId, 'request.completed', {
      totalDurationMs: Date.now() - startedAt,
      outputChars: typeof data?.choices?.[0]?.message?.content === 'string' ? data.choices[0].message.content.length : 0,
      feature: 'cover-copy',
    });

    return jsonResponse(data, 200, cors);
  } catch (err: any) {
    logFormatEvent(env, traceId, 'worker.exception', {
      totalDurationMs: Date.now() - startedAt,
      message: err?.message || 'unknown',
      feature: 'cover-copy',
    });
    return jsonResponse({ error: 'Worker 请求大模型失败', message: err?.message || 'unknown' }, 500, cors);
  }
}
