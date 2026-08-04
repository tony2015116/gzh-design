import type { Env } from '../types';
import {
  authenticate,
  clearLoginAttempts,
  generateSessionToken,
  hashPassword,
  isLoginRateLimited,
  normalizeEmail,
  recordLoginFailure,
  requireAuthenticatedUser,
  validatePasswordStrength,
  verifyPassword,
} from '../lib/auth';
import { getBearerToken, jsonResponse } from '../lib/http';

export async function handleRegister(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const body: any = await request.json().catch(() => ({}));
  const email = normalizeEmail(String(body?.email || ''));
  const { password } = body;

  if (!email || !password) {
    return jsonResponse({ error: '邮箱或密码无效' }, 400, cors);
  }

  const passwordError = validatePasswordStrength(String(password));
  if (passwordError) {
    return jsonResponse({ error: passwordError }, 400, cors);
  }

  const hash = await hashPassword(String(password));
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
  const email = normalizeEmail(String(body?.email || ''));
  const password = String(body?.password || '');

  if (await isLoginRateLimited(env, email)) {
    return jsonResponse({ error: '登录失败次数过多，请 10 分钟后再试' }, 429, cors);
  }

  const user = await env.DB.prepare('SELECT id, email, role, password_hash FROM users WHERE email = ?')
    .bind(email)
    .first<{ id: string; email: string; role: string; password_hash: string }>();

  const verification = user
    ? await verifyPassword(password, user.password_hash)
    : { ok: false, needsRehash: false };

  if (!user || !verification.ok) {
    await recordLoginFailure(env, email);
    return jsonResponse({ error: '邮箱或密码错误' }, 401, cors);
  }

  if (verification.needsRehash) {
    const upgradedHash = await hashPassword(password);
    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
      .bind(upgradedHash, user.id)
      .run();
  }

  await clearLoginAttempts(env, email);
  await env.DB.prepare(`DELETE FROM sessions WHERE expires_at <= datetime('now')`).run();

  const token = generateSessionToken();
  await env.DB.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, datetime("now", "+7 days"))')
    .bind(token, user.id)
    .run();

  return jsonResponse({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role },
  }, 200, cors);
}

export async function handleLogout(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const token = getBearerToken(request);
  if (token) {
    await env.DB.prepare('DELETE FROM sessions WHERE token = ?')
      .bind(token)
      .run()
      .catch(() => undefined);
  }

  return jsonResponse({ success: true }, 200, cors);
}

export async function handleChangePassword(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const user = await requireAuthenticatedUser(request, env, cors);
  if (user instanceof Response) return user;

  const body: any = await request.json().catch(() => ({}));
  const oldPassword = String(body?.oldPassword || '');
  const newPassword = String(body?.newPassword || '');

  if (!oldPassword || !newPassword) {
    return jsonResponse({ error: '缺少旧密码或新密码' }, 400, cors);
  }

  const row = await env.DB.prepare('SELECT password_hash FROM users WHERE id = ?')
    .bind(user.id)
    .first<{ password_hash: string }>();
  if (!row) {
    return jsonResponse({ error: '用户不存在' }, 404, cors);
  }

  const verification = await verifyPassword(oldPassword, row.password_hash);
  if (!verification.ok) {
    return jsonResponse({ error: '旧密码不正确' }, 401, cors);
  }

  const passwordError = validatePasswordStrength(newPassword);
  if (passwordError) {
    return jsonResponse({ error: passwordError }, 400, cors);
  }

  const hash = await hashPassword(newPassword);
  await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    .bind(hash, user.id)
    .run();

  const currentToken = getBearerToken(request);
  await env.DB.prepare('DELETE FROM sessions WHERE user_id = ? AND token != ?')
    .bind(user.id, currentToken)
    .run();

  return jsonResponse({ success: true }, 200, cors);
}

export async function handleUserInfo(request: Request, env: Env, cors: Record<string, string>): Promise<Response> {
  const userId = await authenticate(request, env);
  if (!userId) return jsonResponse({ error: '未登录或登录已过期' }, 401, cors);

  const user = await env.DB.prepare('SELECT id, email, role, created_at FROM users WHERE id = ?')
    .bind(userId)
    .first();

  return jsonResponse({ success: true, user }, 200, cors);
}
