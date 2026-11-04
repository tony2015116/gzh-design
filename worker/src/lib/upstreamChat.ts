// 上游大模型调用（流式）。
// 长文生成时必须用 stream：非流式请求会让中转/网关的 Cloudflare 边缘
// 等待源站超过 100 秒，直接返回 524 超时错误页；流式请求首字节立即返回，
// 字节持续流动就不会触发该超时。

export class UpstreamChatError extends Error {
  status: number;
  details: string;

  constructor(status: number, details: string) {
    super(`上游 AI 请求失败 (Status: ${status})`);
    this.status = status;
    this.details = details;
  }
}

export interface UpstreamChatParams {
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userContent: string;
  temperature: number;
}

/** 读取 SSE 流式响应并拼接完整内容（导出以便测试） */
export const readSseContent = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('上游响应不支持流式读取');
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;
      const data = trimmed.slice(5).trim();
      if (data === '[DONE]') continue;
      try {
        const json = JSON.parse(data);
        const delta = json?.choices?.[0]?.delta?.content;
        if (typeof delta === 'string') content += delta;
      } catch {
        /* 忽略跨分片的不完整 JSON 行 */
      }
    }
  }
  return content;
};

/** 调用 OpenAI 兼容 chat/completions（流式），返回拼接后的完整文本 */
export const callUpstreamChat = async ({
  endpoint,
  apiKey,
  model,
  systemPrompt,
  userContent,
  temperature,
}: UpstreamChatParams): Promise<string> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new UpstreamChatError(response.status, errorText);
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    return readSseContent(response);
  }

  const data: any = await response.json();
  return data?.choices?.[0]?.message?.content || '';
};

/** 把拼接好的文本包装成 OpenAI 响应结构，保持各路由对前端的返回契约不变 */
export const toChatCompletionResponse = (content: string) => ({
  choices: [{ message: { role: 'assistant', content }, finish_reason: 'stop' }],
});
