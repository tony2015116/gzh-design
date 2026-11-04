/**
 * Feishu Service — 飞书文档同步前端封装。
 * 走 Worker /api/feishu/* 接口，需要登录态 Bearer token。
 * 仅在 online 模式可用（OSS 模式不调 API）。
 */

import { getAuthToken } from './authService';
import { loadR2Config } from './imageUpload';

export interface FeishuDocItem {
  token: string;
  name: string;
  type: string;
  modifiedTime: number; // ms
  url: string;
}

export interface FeishuStatus {
  bound: boolean;
  feishuUserName: string;
  appConfigured: boolean;
}

export interface FeishuAppConfig {
  configured: boolean;
  appId: string;
  secretPreview: string;
}

export interface FeishuDocContent {
  title: string;
  markdown: string;
  imageCount: number;
}

/** 带绑定状态标记的错误，UI 据此提示「去绑定 / 重新绑定」 */
export interface FeishuApiError extends Error {
  needBind?: boolean;
  needRebind?: boolean;
}

interface FeishuErrorBody {
  error?: string;
  needBind?: boolean;
  needRebind?: boolean;
}

/** 把 catch 到的 unknown 归一化成 FeishuApiError，保留 needBind / needRebind 标记 */
export function asFeishuError(err: unknown): FeishuApiError {
  if (err instanceof Error) return err as FeishuApiError;
  return new Error(String(err));
}

async function feishuRequest<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const workerUrl = (loadR2Config()?.workerUrl || '').replace(/\/+$/, '');
  if (!workerUrl) {
    throw new Error('未配置 Worker URL');
  }

  const token = getAuthToken();
  const response = await fetch(`${workerUrl}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const data = await response.json().catch(() => ({} as FeishuErrorBody));
  if (!response.ok) {
    const err = new Error(data.error || `请求失败 (HTTP ${response.status})`) as FeishuApiError;
    if (response.status === 401) {
      if (data.needBind) err.needBind = true;
      if (data.needRebind) err.needRebind = true;
    }
    throw err;
  }

  return data as T;
}

/** 获取飞书 OAuth 授权链接（前端拿到后整页跳转） */
export async function getOauthUrl(redirectUri: string): Promise<string> {
  const data = await feishuRequest<{ authorizeUrl: string }>(
    `/api/feishu/oauth/url?redirectUri=${encodeURIComponent(redirectUri)}`,
  );
  return data.authorizeUrl;
}

/** OAuth 回调：用 code + state 换取绑定 */
export async function exchangeCode(
  code: string,
  state: string,
  redirectUri: string,
): Promise<{ ok: boolean; feishuUserName: string }> {
  return feishuRequest('/api/feishu/oauth/callback', {
    method: 'POST',
    body: { code, state, redirectUri },
  });
}

/** 查询当前用户的飞书绑定状态 */
export async function getStatus(): Promise<FeishuStatus> {
  return feishuRequest('/api/feishu/status');
}

/** 读取用户自己的飞书应用凭证配置（secret 只有掩码） */
export async function getAppConfig(): Promise<FeishuAppConfig> {
  return feishuRequest('/api/feishu/app-config');
}

/** 保存用户自己的飞书应用凭证；secret 传空字符串表示不修改 */
export async function saveAppConfig(appId: string, appSecret: string): Promise<void> {
  await feishuRequest('/api/feishu/app-config', {
    method: 'POST',
    body: { appId, appSecret },
  });
}

/** 解绑飞书账号 */
export async function disconnect(): Promise<void> {
  await feishuRequest('/api/feishu/disconnect', { method: 'POST' });
}

/** 拉取飞书最近文档列表（仅 docx 类型） */
export async function listDocs(): Promise<FeishuDocItem[]> {
  const data = await feishuRequest<{ docs: FeishuDocItem[] }>('/api/feishu/docs');
  return data.docs || [];
}

/** 导入飞书文档内容（input 为文档链接或裸 token），返回 Markdown */
export async function importDoc(input: string): Promise<FeishuDocContent> {
  return feishuRequest('/api/feishu/doc-content', {
    method: 'POST',
    body: { input },
  });
}
