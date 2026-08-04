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

    const data = await parseJsonBody(response);
    return data?.choices?.[0]?.message?.content || '';
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

  const data = await parseJsonBody(response);
  return data?.choices?.[0]?.message?.content || '';
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
