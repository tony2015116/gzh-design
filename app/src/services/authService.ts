/**
 * Auth Service — User authentication state management.
 * Handles login, register, logout and current user session via localStorage.
 */

import { loadR2Config } from './imageUpload';
import { isLocalOssDevelopment } from './localDevelopment';
import {notifyDraftOwnerChanged} from './draftScope.ts';
import {accountsEnabled} from './releaseScope';

export interface User {
  id: string;
  email: string;
  role: 'free' | 'vip' | 'admin';
  created_at?: string;
}

export interface Preset {
  id: string;
  user_id: string;
  name: string;
  theme: string;
  layout_style: string;
  image_style: string;
  created_at: string;
}

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

/** Get the worker URL from saved config */
function getWorkerUrl(): string {
  if (isLocalOssDevelopment()) return location.origin;
  const r2Config = loadR2Config();
  return (r2Config?.workerUrl || '').replace(/\/$/, '');
}

/** Get auth headers for requests */
function authHeaders(): HeadersInit {
  const token = localStorage.getItem(TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Save auth state to localStorage */
function saveAuthState(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  notifyDraftOwnerChanged();
}

/** Clear local state immediately, then revoke the server session. */
export async function logout(): Promise<void> {
  const workerUrl = getWorkerUrl();
  const headers = authHeaders();
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyDraftOwnerChanged();
  if (isLocalOssDevelopment()) localStorage.setItem('dev_identity_role', 'guest');
  if (workerUrl) {
    try {
      await fetch(`${workerUrl}/api/auth/logout`, {
        method: 'POST',
        headers,
      });
    } catch {
      // 容错：网络或 Worker 异常不阻塞本地登出
    }
  }
}

/** Change the current user's password */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) throw new Error('未配置 后端地址，请在系统设置中配置 后端地址');

  const res = await fetch(`${workerUrl}/api/auth/change-password`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ oldPassword, newPassword }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || '修改密码失败');
}

/** Get currently logged in user */
export function getCurrentUser(): User | null {
  if (!accountsEnabled) return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

/** Check if user is logged in (has a token) */
export function isLoggedIn(): boolean {
  return accountsEnabled && !!localStorage.getItem(TOKEN_KEY);
}

/** Get the raw auth token for authenticated worker requests */
export function getAuthToken(): string {
  return accountsEnabled ? localStorage.getItem(TOKEN_KEY) || '' : '';
}

/** Register a new user */
export async function register(email: string, password: string): Promise<User> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) throw new Error('未配置 后端地址，请在系统设置中配置 后端地址');

  const res = await fetch(`${workerUrl}/api/auth/register`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '注册失败');

  saveAuthState(data.token, data.user);
  return data.user as User;
}

/** Login an existing user */
export async function login(email: string, password: string): Promise<User> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) throw new Error('未配置 后端地址，请在系统设置中配置 后端地址');

  const res = await fetch(`${workerUrl}/api/auth/login`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '登录失败');

  saveAuthState(data.token, data.user);
  return data.user as User;
}

/** Refresh user info from server */
export async function refreshUser(): Promise<User | null> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl || !isLoggedIn()) return null;
  const requestedToken=getAuthToken();

  const res = await fetch(`${workerUrl}/api/user/info`, {
    headers: authHeaders(),
  });
  if(getAuthToken()!==requestedToken)return getCurrentUser();
  if (res.status === 401) { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); notifyDraftOwnerChanged(); return null; }
  if (!res.ok) throw new Error('暂时无法验证登录状态，请稍后重试');
  const data = await res.json();
  if(getAuthToken()!==requestedToken)return getCurrentUser();
  if (data.user) {
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }
  return data.user as User;
}

/** Fetch saved presets */
export async function fetchPresets(): Promise<Preset[]> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl || !isLoggedIn()) return [];

  const res = await fetch(`${workerUrl}/api/user/presets`, {
    headers: authHeaders(),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.presets || []).map((p: any) => ({
    ...p,
    theme: typeof p.theme === 'string' ? JSON.parse(p.theme) : p.theme,
    layout_style: typeof p.layout_style === 'string' ? JSON.parse(p.layout_style) : p.layout_style,
    image_style: typeof p.image_style === 'string' ? JSON.parse(p.image_style) : p.image_style,
  }));
}

/** Save a new preset */
export async function savePreset(name: string, theme: any, layoutStyle: any, imageStyle: any): Promise<string> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) throw new Error('未配置 后端地址');

  const res = await fetch(`${workerUrl}/api/user/presets`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ name, theme, layout_style: layoutStyle, image_style: imageStyle }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || '保存预设失败');
  return data.id;
}

/** Delete a preset */
export async function deletePreset(presetId: string): Promise<void> {
  const workerUrl = getWorkerUrl();
  if (!workerUrl) throw new Error('未配置 后端地址');

  const res = await fetch(`${workerUrl}/api/user/presets/${encodeURIComponent(presetId)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || `删除预设失败（Status: ${res.status}）`);
  }
}
