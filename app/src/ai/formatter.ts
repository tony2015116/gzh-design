import { getAuthMode } from '../services/accessControl';
import { getAuthToken } from '../services/authService';
import { loadR2Config } from '../services/imageUpload';
import { FORMAT_PROMPT } from './formatPrompt';
import { buildFormatPreferencePrompt, type FormatPreferences } from './formatPreferences';
import { resolveChatEndpoint, ossChatCompletion } from './chatCompletion';
import { createOssAiTraceId, getOssAiLogPreview, logOssAiEvent } from '../services/ossAiDebugLogger';

export const getAITypesetMarkdown = async (
  apiKey: string,
  markdown: string,
  baseUrl?: string,
  model?: string,
  preferences?: FormatPreferences,
  customNote?: string,
) => {
  const isOnlineMode = import.meta.env.VITE_APP_MODE === 'online';
  const traceId = createOssAiTraceId();

  const finalBaseUrl = baseUrl || 'https://api.openai.com/v1';
  const finalModel = model || 'gpt-4o';

  if (isOnlineMode) {
    const r2Config = loadR2Config();
    const workerUrl = r2Config?.workerUrl || '';
    const secret = r2Config?.uploadSecret;
    const authMode = getAuthMode();
    const authToken = getAuthToken();
    const bearerToken = authMode === 'real' ? authToken : authToken || secret;

    if (!workerUrl) {
      throw new Error('未配置 后端地址，请先在在线模式配置可用的后端地址。');
    }

    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/api/format`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      // 上游地址与模型由 Worker 端配置决定，不再从前端传入
      body: JSON.stringify({ markdown, preferences, customNote }),
    });

    if (!response.ok) {
      const errTxt = await response.text().catch(() => '');
      console.error('Online AI format error: Status =', response.status, 'Response =', errTxt);
      let errObj: any = {};
      try {
        errObj = JSON.parse(errTxt);
      } catch {}

      const errMsg = errObj.error || `云端 AI 接口请求失败 (Status: ${response.status})`;
      const details = errObj.details || errObj.message || errTxt;
      throw new Error(`${errMsg}\n详细信息: ${details}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || markdown;
  }

  if (!apiKey) {
    await logOssAiEvent(traceId, 'request.blocked', {
      reason: 'missing_api_key',
      endpoint: finalBaseUrl,
      model: finalModel,
    });
    throw new Error('需要先配置 API Key 才能使用 AI 自动排版。');
  }

  const endpoint = resolveChatEndpoint(finalBaseUrl);

  await logOssAiEvent(traceId, 'request.prepared', {
    endpoint,
    model: finalModel,
    markdownLength: markdown.length,
    markdownPreview: getOssAiLogPreview(markdown),
    hasCustomBaseUrl: Boolean(baseUrl),
    hasCustomModel: Boolean(model),
    preferences,
    customNote,
  });

  const startedAt = Date.now();
  // 统一走 ossChatCompletion（流式请求，避免长文触发中转 524 超时；
  // 流式没有 usage/finishReason，成功日志只记录内容与耗时）
  try {
    const content = await ossChatCompletion({
      endpoint,
      apiKey,
      model: finalModel,
      systemPrompt: FORMAT_PROMPT + buildFormatPreferencePrompt(preferences, customNote),
      userContent: markdown,
      temperature: 0.7,
    });
    const durationMs = Date.now() - startedAt;

    await logOssAiEvent(traceId, 'request.succeeded', {
      endpoint,
      model: finalModel,
      durationMs,
      streamed: true,
      outputLength: typeof content === 'string' ? content.length : 0,
      outputPreview: typeof content === 'string' ? getOssAiLogPreview(content) : '',
    });

    return content;
  } catch (err: any) {
    const durationMs = Date.now() - startedAt;
    const errMsg = err?.message || 'unknown';
    console.error('OSS AI format error:', errMsg);
    await logOssAiEvent(traceId, 'request.failed', {
      endpoint,
      model: finalModel,
      durationMs,
      errorPreview: getOssAiLogPreview(errMsg),
    });
    throw err;
  }
};
