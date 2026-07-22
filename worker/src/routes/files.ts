import type { Env } from '../types';
import { jsonResponse } from '../lib/http';

export async function handleServeFile(
  key: string,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const object = await env.IMAGES_BUCKET.get(key);
  if (!object) {
    return jsonResponse({ error: '图片不存在' }, 404, cors);
  }

  const headers = new Headers(cors);
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');

  return new Response(object.body, { headers });
}
