import type { AuthenticatedUser, Env } from '../types';
import { getBearerToken, jsonResponse } from './http';

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(`${password}SaaS_SALT_2026`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function authenticateUser(request: Request, env: Env): Promise<AuthenticatedUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const user = await env.DB.prepare(`
      SELECT users.id AS id, users.email AS email, users.role AS role
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ? AND sessions.expires_at > datetime("now")
    `).bind(token).first<AuthenticatedUser>();

    return user ?? null;
  } catch (err) {
    console.error('Auth DB Error:', err);
    return null;
  }
}

export async function authenticate(request: Request, env: Env): Promise<string | null> {
  const user = await authenticateUser(request, env);
  return user ? user.id : null;
}

export async function requireAuthenticatedUser(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<AuthenticatedUser | Response> {
  const user = await authenticateUser(request, env);
  if (!user) {
    return jsonResponse({ error: '未登录' }, 401, cors);
  }
  return user;
}

export async function requireAdminUser(
  request: Request,
  env: Env,
  cors: Record<string, string>,
): Promise<AuthenticatedUser | Response> {
  const user = await requireAuthenticatedUser(request, env, cors);
  if (user instanceof Response) return user;
  if (user.role !== 'admin') {
    return jsonResponse({ error: '仅管理员可查看诊断信息' }, 403, cors);
  }
  return user;
}

export function generateSessionToken(): string {
  return crypto.randomUUID();
}
