import type { Env } from '../types';
import { authenticate, generateSessionToken, hashPassword } from '../lib/auth';
import { jsonResponse } from '../lib/http';

export async function handleRegister(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body: any = await request.json().catch(() => ({}));
  const { email, password } = body;

  if (!email || !password || password.length < 6) {
    return jsonResponse({ error: '邮箱无效或密码过短' }, 400, cors);
  }

  const hash = await hashPassword(password);
  const userId = crypto.randomUUID();

  try {
    await env.DB.prepare('INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)')
      .bind(userId, email, hash)
      .run();

    const token = generateSessionToken();
    await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))')
      .bind(token, userId)
      .run();

    return jsonResponse({
      success: true,
      token,
      user: { id: userId, email, role: 'free' },
    }, 200, cors);
  } catch (error: any) {
    if (error.message?.includes('UNIQUE constraint failed')) {
      return jsonResponse({ error: '该邮箱已被注册' }, 409, cors);
    }

    return jsonResponse({ error: '注册失败', details: error.message }, 500, cors);
  }
}

export async function handleLogin(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body: any = await request.json().catch(() => ({}));
  const { email, password } = body;

  const hash = await hashPassword(password || '');
  const user = await env.DB.prepare('SELECT id, email, role FROM users WHERE email = ? AND password_hash = ?')
    .bind(email, hash)
    .first<{ id: string; email: string; role: string }>();

  if (!user) {
    return jsonResponse({ error: '邮箱或密码错误' }, 401, cors);
  }

  const token = generateSessionToken();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))')
    .bind(token, user.id)
    .run();

  return jsonResponse({ success: true, token, user }, 200, cors);
}

export async function handleUserInfo(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const userId = await authenticate(request, env);
  if (!userId) return jsonResponse({ error: '未登录或登录已过期' }, 401, cors);

  const user = await env.DB.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first();

  return jsonResponse({ success: true, user }, 200, cors);
}
