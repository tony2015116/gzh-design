import { describe, expect, it } from 'vitest';
import { readSseContent, toChatCompletionResponse, UpstreamChatError } from '../src/lib/upstreamChat';

// 构造一个 SSE 流式响应
function sseResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { 'content-type': 'text/event-stream' },
  });
}

const delta = (content: string) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;

describe('流式上游调用（524 超时规避）', () => {
  it('拼接多个 SSE 分片为完整内容', async () => {
    const res = sseResponse([delta('你好'), delta('，世界'), 'data: [DONE]\n\n']);
    expect(await readSseContent(res)).toBe('你好，世界');
  });

  it('忽略跨分片的不完整行和非 data 行', async () => {
    const res = sseResponse([
      ': comment\n\n',
      delta('第一段'),
      'data: {不完整的JSON\n\n',
      delta('第二段'),
      'data: [DONE]\n\n',
    ]);
    expect(await readSseContent(res)).toBe('第一段第二段');
  });

  it('忽略没有 delta.content 的分片（如 role 初始化帧）', async () => {
    const res = sseResponse([
      `data: ${JSON.stringify({ choices: [{ delta: { role: 'assistant' } }] })}\n\n`,
      delta('正文'),
      'data: [DONE]\n\n',
    ]);
    expect(await readSseContent(res)).toBe('正文');
  });

  it('包装后的响应保持 OpenAI 返回契约', () => {
    const raw = toChatCompletionResponse('结果文本');
    expect(raw.choices[0].message.content).toBe('结果文本');
    expect(raw.choices[0].finish_reason).toBe('stop');
  });

  it('UpstreamChatError 携带状态码与详情', () => {
    const err = new UpstreamChatError(524, '<html>timeout</html>');
    expect(err.status).toBe(524);
    expect(err.details).toContain('timeout');
    expect(err.message).toContain('524');
  });
});
