import { getAuthMode } from '../services/accessControl';
import { getAuthToken } from '../services/authService';
import { loadR2Config } from '../services/imageUpload';
import { createOssAiTraceId, getOssAiLogPreview, logOssAiEvent } from '../services/ossAiDebugLogger';

export const defaultAIPrompt = `
你是一个专业的微信公众号排版助手。
你的目标是分析给定的 Markdown 文章，自动识别导语、重点句、总结段落，并推荐插入强调组件、引用组件、总结卡片、信息卡片、分割线等。

由于排版系统是基于组件的，请直接返回修改后的 Markdown。
例如：
- 如果某句话要强调，把它变成 **这段文字**
- 如果是引用语，变成 > 引用
- 如果是总结卡片，可以插入 <SummaryCard title="摘要">内容</SummaryCard>
- 如果是信息卡片，可以插入 <InfoCard title="提示">内容</InfoCard>

对于标题，请使用 | 做高级自定义：
- 一级标题支持：# 序号 | 主标题 | 小字副标题
- 二级标题支持：## 序号标签 | 主标题
- 如需局部颜色强调，可直接嵌入 HTML，例如：
  ## STEP02 | <span style="color:#059669">深度解析</span>

最简策略是直接将原 Markdown 按下面规则改写并返回：
- 加上必要的带序号的 # 或 ## 标题
- 重点加粗 **内容**
- 适当添加 --- 分割线

只返回改写后的 Markdown 文本，不要输出任何解释。
`;

export const getAITypesetMarkdown = async (
  apiKey: string,
  markdown: string,
  baseUrl?: string,
  model?: string,
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
      throw new Error('未配置 Worker URL，请先在在线模式配置可用的 Worker 地址。');
    }

    const response = await fetch(`${workerUrl.replace(/\/$/, '')}/api/format`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
      },
      body: JSON.stringify({ markdown, baseUrl: finalBaseUrl, model: finalModel }),
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

  let endpoint = finalBaseUrl;
  if (!endpoint.endsWith('chat/completions')) {
    endpoint = endpoint.endsWith('/') ? `${endpoint}chat/completions` : `${endpoint}/chat/completions`;
  }

  await logOssAiEvent(traceId, 'request.prepared', {
    endpoint,
    model: finalModel,
    markdownLength: markdown.length,
    markdownPreview: getOssAiLogPreview(markdown),
    hasCustomBaseUrl: Boolean(baseUrl),
    hasCustomModel: Boolean(model),
  });

  const startedAt = Date.now();
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: finalModel,
      messages: [
        { role: 'system', content: defaultAIPrompt },
        { role: 'user', content: markdown },
      ],
      temperature: 0.7,
    }),
  });
  const durationMs = Date.now() - startedAt;

  if (!response.ok) {
    const errTxt = await response.text().catch(() => '');
    console.error('OSS AI format error: Status =', response.status, 'Response =', errTxt);
    await logOssAiEvent(traceId, 'request.failed', {
      endpoint,
      model: finalModel,
      status: response.status,
      statusText: response.statusText,
      durationMs,
      errorPreview: getOssAiLogPreview(errTxt),
    });

    let errMsg = `AI 排版请求失败 (Status: ${response.status})`;
    try {
      const data = JSON.parse(errTxt);
      if (data.error?.message) errMsg = data.error.message;
    } catch {}

    throw new Error(`${errMsg}\n详细信息: ${errTxt.slice(0, 200)}...`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || markdown;

  await logOssAiEvent(traceId, 'request.succeeded', {
    endpoint,
    model: finalModel,
    durationMs,
    outputLength: typeof content === 'string' ? content.length : 0,
    outputPreview: typeof content === 'string' ? getOssAiLogPreview(content) : '',
    finishReason: data.choices?.[0]?.finish_reason || '',
    usage: data.usage || null,
  });

  return content;
};
