import type { AuthenticatedUser, Env } from '../types';
import { getBearerToken, jsonResponse } from './http';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_SALT_BYTES = 16;
const LEGACY_PASSWORD_SALT = 'SaaS_SALT_2026';
const LEGACY_HASH_PATTERN = /^[0-9a-f]{64}$/;
const LOGIN_ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_FAILURES = 5;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function derivePbkdf2Hex(password: string, saltHex: string, iterations: number): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const saltBytes = new Uint8Array(saltHex.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations },
    keyMaterial,
    256,
  );
  return bytesToHex(new Uint8Array(bits));
}

async function legacyHashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(`${password}${LEGACY_PASSWORD_SALT}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
  const saltHex = bytesToHex(salt);
  const hashHex = await derivePbkdf2Hex(password, saltHex, PBKDF2_ITERATIONS);
  return `pbkdf2:${PBKDF2_ITERATIONS}:${saltHex}:${hashHex}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<{ ok: boolean; needsRehash: boolean }> {
  if (storedHash.startsWith('pbkdf2:')) {
    const [, iterationsRaw, saltHex, expectedHex] = storedHash.split(':');
    const iterations = Number.parseInt(iterationsRaw || '', 10);
    if (!Number.isFinite(iterations) || iterations <= 0 || !saltHex || !expectedHex) {
      return { ok: false, needsRehash: false };
    }
    const actualHex = await derivePbkdf2Hex(password, saltHex, iterations);
    return { ok: actualHex === expectedHex, needsRehash: false };
  }

  if (LEGACY_HASH_PATTERN.test(storedHash)) {
    const legacyHash = await legacyHashPassword(password);
    return { ok: legacyHash === storedHash, needsRehash: legacyHash === storedHash };
  }

  return { ok: false, needsRehash: false };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return '密码长度至少 8 位';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) return '密码需同时包含字母和数字';
  return null;
}

type LoginAttemptRow = {
  email: string;
  failures: number;
  window_start: string | null;
};

async function loadLoginAttempt(env: Env, email: string): Promise<LoginAttemptRow | null> {
  return await env.DB.prepare('SELECT email, failures, window_start FROM login_attempts WHERE email = ?')
    .bind(email)
    .first<LoginAttemptRow>();
}

function isAttemptWindowExpired(row: LoginAttemptRow, nowMs: number): boolean {
  const windowStartMs = row.window_start ? Date.parse(row.window_start) : Number.NaN;
  return !Number.isFinite(windowStartMs) || nowMs - windowStartMs > LOGIN_ATTEMPT_WINDOW_MS;
}

export async function isLoginRateLimited(env: Env, email: string): Promise<boolean> {
  const row = await loadLoginAttempt(env, email);
  if (!row) return false;
  if (isAttemptWindowExpired(row, Date.now())) return false;
  return row.failures >= LOGIN_MAX_FAILURES;
}

export async function recordLoginFailure(env: Env, email: string): Promise<void> {
  const row = await loadLoginAttempt(env, email);
  if (!row || isAttemptWindowExpired(row, Date.now())) {
    await env.DB.prepare('INSERT OR REPLACE INTO login_attempts (email, failures, window_start) VALUES (?, 1, ?)')
      .bind(email, new Date().toISOString())
      .run();
    return;
  }
  await env.DB.prepare('UPDATE login_attempts SET failures = failures + 1 WHERE email = ?')
    .bind(email)
    .run();
}

export async function clearLoginAttempts(env: Env, email: string): Promise<void> {
  await env.DB.prepare('DELETE FROM login_attempts WHERE email = ?').bind(email).run();
}

export async function authenticateUser(request: Request, env: Env): Promise<AuthenticatedUser | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  try {
    const user = await env.DB.prepare(`
      SELECT users.id AS id, users.email AS email, users.role AS role
      FROM sessions
      INNER JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ? AND sessions.expires_at > datetime('now')
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
