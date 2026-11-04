export interface OssChatCompletionParams {
  /** 完整的 chat/completions 端点 */
  endpoint: string;
  apiKey: string;
  model: string;
  systemPrompt: string;
  userContent: string;
  temperature: number;
}

const parseErrorResponse = async (response: Response, fallback: string): Promise<never> => {
  const errTxt = await response.text().catch(() => '');
  let errMsg = `${fallback} (Status: ${response.status})`;
  try {
    const data = JSON.parse(errTxt);
    if (data.error?.message) errMsg = data.error.message;
    else if (typeof data.error === 'string') errMsg = data.error;
    else if (data.message) errMsg = data.message;
  } catch { /* 响应体不是 JSON，走兜底错误提示 */ }
  throw new Error(`${errMsg}\n详细信息: ${errTxt.slice(0, 200)}`);
};

/** 上游可能返回 200 + HTML（地址配错时中正常的兜底页），这里给出可读的错误提示 */
const parseJsonBody = async (response: Response): Promise<any> => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `接口返回的不是 JSON，多半是接口地址配错了（最常见：Base URL 漏了 /v1）。\n返回内容: ${text.slice(0, 120)}`
    );
  }
};

/**
 * 读取 SSE 流式响应并拼接完整内容。
 * 长文生成时流式是必须的：非流式请求会让中转的 Cloudflare 边缘
 * 等待源站超过 100 秒，直接返回 524 超时错误页。
 */
const parseSseStream = async (response: Response): Promise<string> => {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('当前环境不支持流式读取，请升级浏览器。');
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

/** 统一读取响应：流式走 SSE 拼接，非流式按 JSON 解析 */
const readCompletionContent = async (response: Response): Promise<string> => {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('text/event-stream')) {
    const content = await parseSseStream(response);
    if (!content) {
      throw new Error('AI 返回了空内容，请重试。');
    }
    return content;
  }
  const data = await parseJsonBody(response);
  return data?.choices?.[0]?.message?.content || '';
};

/**
 * OSS 模式下调用 OpenAI 兼容 chat/completions，返回 message content。
 * 开发环境走 vite dev server 的同源代理 /__ai-proxy（部分第三方中转没有
 * CORS 头，浏览器直连会被拦截）；生产构建只能直连，要求中转支持跨域。
 */
export const ossChatCompletion = async ({
  endpoint,
  apiKey,
  model,
  systemPrompt,
  userContent,
  temperature,
}: OssChatCompletionParams): Promise<string> => {
  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ],
    temperature,
    // 流式：避免长文生成时中转的 Cloudflare 边缘 100 秒无响应超时（524）
    stream: true,
  };

  if (import.meta.env.DEV) {
    const response = await fetch('/__ai-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint,
        headers: { Authorization: `Bearer ${apiKey}` },
        payload,
      }),
    });

    if (!response.ok) {
      await parseErrorResponse(response, 'AI 请求失败（dev 代理）');
    }

    return readCompletionContent(response);
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await parseErrorResponse(response, 'AI 请求失败');
  }

  return readCompletionContent(response);
};

/** 把用户配置的 base URL 归一化成 chat/completions 端点 */
export const resolveChatEndpoint = (baseUrl: string): string => {
  const raw = (baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  if (raw.endsWith('chat/completions')) return raw;
  // 已带版本号路径（/v1、/v1beta 等之外的显式 /vN 结尾）
  if (/\/v\d+$/.test(raw)) return `${raw}/chat/completions`;
  // 裸域名（无路径）按 OpenAI 惯例补 /v1，这是最常见的配置遗漏
  try {
    const url = new URL(raw);
    if (url.pathname === '' || url.pathname === '/') {
      return `${raw}/v1/chat/completions`;
    }
  } catch { /* 响应体不是 JSON，走兜底错误提示 */ }
  return `${raw}/chat/completions`;
};
