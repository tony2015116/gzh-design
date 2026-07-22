import type { Env } from '../types';
import { authenticate } from '../lib/auth';
import { jsonResponse } from '../lib/http';

export async function handleGetPresets(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const userId = await authenticate(request, env);
  if (!userId) return jsonResponse({ error: '未登录' }, 401, cors);

  const { results } = await env.DB.prepare('SELECT * FROM presets WHERE user_id = ? ORDER BY created_at DESC')
    .bind(userId)
    .all();

  return jsonResponse({ success: true, presets: results }, 200, cors);
}

export async function handleSavePreset(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const userId = await authenticate(request, env);
  if (!userId) return jsonResponse({ error: '未登录' }, 401, cors);

  const body: any = await request.json().catch(() => ({}));
  const { name, theme, layout_style, image_style } = body;

  if (!name) {
    return jsonResponse({ error: '配置名称不能为空' }, 400, cors);
  }

  const presetId = crypto.randomUUID();
  await env.DB.prepare(`
    INSERT INTO presets (id, user_id, name, theme, layout_style, image_style)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    presetId,
    userId,
    name,
    JSON.stringify(theme),
    JSON.stringify(layout_style),
    JSON.stringify(image_style),
  ).run();

  return jsonResponse({ success: true, id: presetId }, 200, cors);
}

export async function handleDeletePreset(
  presetId: string,
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<Response> {
  const userId = await authenticate(request, env);
  if (!userId) return jsonResponse({ error: '未登录' }, 401, cors);

  await env.DB.prepare('DELETE FROM presets WHERE id = ? AND user_id = ?')
    .bind(presetId, userId)
    .run();

  return jsonResponse({ success: true }, 200, cors);
}
