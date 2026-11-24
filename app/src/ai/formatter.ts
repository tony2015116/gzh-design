import { FORMAT_PROMPT } from './formatPrompt';
import { buildFormatPreferencePrompt, type FormatPreferences } from './formatPreferences';
import { resolveChatEndpoint, ossChatCompletion } from './chatCompletion';

export const getAITypesetMarkdown = async (
  apiKey: string,
  markdown: string,
  baseUrl?: string,
  model?: string,
  preferences?: FormatPreferences,
  customNote?: string,
) => {
  if (!apiKey) {
    throw new Error('需要先配置 API Key 才能使用 AI 自动排版。');
  }

  // 流式请求，避免长文触发中转服务 524 超时
  return await ossChatCompletion({
    endpoint: resolveChatEndpoint(baseUrl || 'https://api.openai.com/v1'),
    apiKey,
    model: model || 'gpt-4o',
    systemPrompt: FORMAT_PROMPT + buildFormatPreferencePrompt(preferences, customNote),
    userContent: markdown,
    temperature: 0.7,
  });
};
