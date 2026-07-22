import type { Env } from '../types';

export function extFromMime(mime: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'image/avif': 'avif',
  };

  return map[mime] ?? 'jpg';
}

export function generateKey(ext: string): string {
  const now = new Date();
  const datePrefix = now.toISOString().slice(0, 10).replace(/-/g, '');
  const ts = now.getTime();
  const rand = Math.random().toString(36).slice(2, 8);
  return `${datePrefix}/${ts}-${rand}.${ext}`;
}

export function sanitizeFileSegment(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'item';
}

export function buildPublicFileUrl(requestOrigin: string, key: string): string {
  return `${requestOrigin.replace(/\/$/, '')}/file/${key}`;
}

export async function saveTextArtifact(
  env: Env,
  key: string,
  value: string,
  contentType: string,
): Promise<void> {
  await env.IMAGES_BUCKET.put(key, value, {
    httpMetadata: { contentType },
  });
}

export async function loadTextArtifact(env: Env, key: string): Promise<string> {
  const object = await env.IMAGES_BUCKET.get(key);
  if (!object) {
    throw new Error(`missing_artifact:${key}`);
  }
  return await object.text();
}

export async function saveIllustrationArtifact(
  env: Env,
  jobId: string,
  kind: string,
  r2Key: string,
  meta: Record<string, unknown>,
  artifactId?: string,
): Promise<void> {
  await env.DB.prepare(`
    INSERT OR REPLACE INTO illustration_artifacts (id, job_id, kind, r2_key, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    artifactId || crypto.randomUUID(),
    jobId,
    kind,
    r2Key,
    JSON.stringify(meta),
  ).run();
}
