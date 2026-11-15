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
  const traceId = createOssAiTraceId();

  const finalBaseUrl = baseUrl || 'https://api.openai.com/v1';
  const finalModel = model || 'gpt-4o';

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
  } catch (err: unknown) {
    const durationMs = Date.now() - startedAt;
    const errMsg = err instanceof Error ? err.message : 'unknown';
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
