import type { Env } from '../types';
import { getBearerToken, jsonResponse } from '../lib/http';
import { extFromMime, generateKey } from '../lib/storage';

export async function handleUpload(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  if (env.UPLOAD_SECRET) {
    const token = getBearerToken(request);
    if (token !== env.UPLOAD_SECRET) {
      return jsonResponse({ error: '未授权，请检查 Upload Secret' }, 401, cors);
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: '请求体必须是 multipart/form-data' }, 400, cors);
  }

  const file: any = formData.get('file');
  if (!file || !(file instanceof File)) {
    return jsonResponse({ error: '缺少 file 字段或格式错误' }, 400, cors);
  }

  if (!file.type.startsWith('image/')) {
    return jsonResponse({ error: '只允许上传图片文件' }, 400, cors);
  }

  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return jsonResponse({ error: `文件大小超过限制（最大 ${maxSize / 1024 / 1024}MB）` }, 413, cors);
  }

  const ext = extFromMime(file.type);
  const key = generateKey(ext);

  try {
    await env.IMAGES_BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
  } catch (err) {
    console.error('R2 put error:', err);
    return jsonResponse({ error: 'R2 写入失败' }, 500, cors);
  }

  const workerUrl = new URL(request.url);
  const publicUrl = `${workerUrl.origin}/file/${key}`;

  return jsonResponse({ success: true, key, url: publicUrl }, 200, cors);
}
