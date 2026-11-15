import type { Env } from '../types';
import {encryptSecret,decryptSecret} from './secretVault';

// 飞书 OAuth user_access_token 管理：授权码换 token、过期自动刷新。
// 端点以飞书开放平台「身份验证 v2」文档为准。

const TOKEN_ENDPOINT = 'https://open.feishu.cn/open-apis/authen/v2/oauth/token';

export interface FeishuCredentials {
  appId: string;
  appSecret: string;
}

/**
 * 解析飞书应用凭证（BYO App 模式）：
 * 1. 用户在侧边栏保存的自己创建的自建应用（D1 feishu_apps 表）
 * 2. 部署者配置的 Worker 环境变量兜底（同企业内使用的场景）
 */
export const resolveFeishuCredentials = async (env: Env, userId: string): Promise<FeishuCredentials | null> => {
  const row = await env.DB.prepare('SELECT app_id, app_secret FROM feishu_apps WHERE user_id = ?')
    .bind(userId)
    .first<{ app_id: string; app_secret: string }>();
  if (row?.app_id && row?.app_secret) {
    return { appId: row.app_id, appSecret: await decryptSecret(env,row.app_secret,`${userId}:app_secret`) };
  }
  if (env.FEISHU_APP_ID && env.FEISHU_APP_SECRET) {
    return { appId: env.FEISHU_APP_ID, appSecret: env.FEISHU_APP_SECRET };
  }
  return null;
};

/** 保存/更新用户自己的飞书应用凭证；凭证变化时作废旧授权 */
export const saveFeishuAppCredentials = async (
  env: Env,
  userId: string,
  appId: string,
  appSecret: string,
): Promise<void> => {
  const existing = await env.DB.prepare('SELECT app_id,app_secret FROM feishu_apps WHERE user_id = ?')
    .bind(userId)
    .first<{ app_id: string;app_secret:string }>();

  const encrypted = await encryptSecret(env,appSecret,`${userId}:app_secret`);
  const changed = existing && (existing.app_id !== appId || await decryptSecret(env,existing.app_secret,`${userId}:app_secret`) !== appSecret);

  const writes = [env.DB.prepare(
    `INSERT INTO feishu_apps (user_id, app_id, app_secret, updated_at)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       app_id = excluded.app_id,
       app_secret = excluded.app_secret,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(userId, appId, encrypted)];

  // 换了应用后，旧应用签发的 token 必然失效，直接作废要求重新绑定
  if (changed) {
    writes.push(env.DB.prepare('DELETE FROM feishu_tokens WHERE user_id = ?').bind(userId));
    writes.push(env.DB.prepare('DELETE FROM feishu_oauth_states WHERE user_id = ?').bind(userId));
  }
  await env.DB.batch(writes);
};

export class FeishuAuthError extends Error {
  code: number;
  details: string;

  constructor(message: string, code = -1, details = '') {
    super(message);
    this.code = code;
    this.details = details;
  }
}

const postToken = async (body: Record<string, string>): Promise<any> => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const data: any = await response.json().catch(() => null);
  if (!response.ok || !data || (data.code !== undefined && data.code !== 0)) {
    throw new FeishuAuthError(
      data?.error_description || data?.msg || `飞书 token 接口请求失败 (Status: ${response.status})`,
      data?.code ?? response.status,
      '',
    );
  }
  return data;
};

/** 授权码换 user_access_token，并落库 */
export const exchangeCodeForToken = async (
  env: Env,
  creds: FeishuCredentials,
  userId: string,
  code: string,
  redirectUri: string,
): Promise<{ feishuUserName: string }> => {
  const data = await postToken({
    grant_type: 'authorization_code',
    client_id: creds.appId,
    client_secret: creds.appSecret,
    code,
    redirect_uri: redirectUri,
  });

  const accessToken = data.access_token ?? data.data?.access_token;
  const refreshToken = data.refresh_token ?? data.data?.refresh_token;
  const expiresIn = data.expires_in ?? data.data?.expires_in ?? 7200;
  if (!accessToken || !refreshToken) {
    throw new FeishuAuthError('飞书 token 接口返回缺少 access_token/refresh_token');
  }

  const feishuUserName = data.name ?? data.data?.name ?? '';
  const expiresAt = Date.now() + expiresIn * 1000;

  await env.DB.prepare(
    `INSERT INTO feishu_tokens (user_id, access_token, refresh_token, expires_at, feishu_user_name, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id) DO UPDATE SET
       access_token = excluded.access_token,
       refresh_token = excluded.refresh_token,
       expires_at = excluded.expires_at,
       feishu_user_name = excluded.feishu_user_name,
       updated_at = CURRENT_TIMESTAMP`,
  )
    .bind(userId, await encryptSecret(env,accessToken,`${userId}:access_token`), await encryptSecret(env,refreshToken,`${userId}:refresh_token`), expiresAt, feishuUserName)
    .run();

  return { feishuUserName };
};

/** 取当前用户可用的 user_access_token；过期前 5 分钟自动刷新 */
export const getValidAccessToken = async (env: Env, creds: FeishuCredentials, userId: string): Promise<string | null> => {
  const row = await env.DB.prepare(
    'SELECT access_token, refresh_token, expires_at FROM feishu_tokens WHERE user_id = ?',
  )
    .bind(userId)
    .first<{ access_token: string; refresh_token: string; expires_at: number }>();

  if (!row) return null;

  const refreshSkew = 5 * 60 * 1000;
  if (row.expires_at - refreshSkew > Date.now()) {
    return decryptSecret(env,row.access_token,`${userId}:access_token`);
  }

  const data = await postToken({
    grant_type: 'refresh_token',
    client_id: creds.appId,
    client_secret: creds.appSecret,
    refresh_token: await decryptSecret(env,row.refresh_token,`${userId}:refresh_token`),
  });

  const accessToken = data.access_token ?? data.data?.access_token;
  const refreshToken = data.refresh_token ?? data.data?.refresh_token ?? await decryptSecret(env,row.refresh_token,`${userId}:refresh_token`);
  const expiresIn = data.expires_in ?? data.data?.expires_in ?? 7200;
  if (!accessToken) {
    throw new FeishuAuthError('飞书刷新 token 返回缺少 access_token');
  }

  await env.DB.prepare(
    'UPDATE feishu_tokens SET access_token = ?, refresh_token = ?, expires_at = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
  )
    .bind(await encryptSecret(env,accessToken,`${userId}:access_token`), await encryptSecret(env,refreshToken,`${userId}:refresh_token`), Date.now() + expiresIn * 1000, userId)
    .run();

  return accessToken;
};

/** 飞书 OpenAPI 通用 GET（带用户 token，统一错误） */
export const feishuGet = async (url: string, accessToken: string): Promise<any> => {
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data: any = await response.json().catch(() => null);
  if (!response.ok || !data || (data.code !== undefined && data.code !== 0)) {
    throw new FeishuAuthError(
      data?.msg || `飞书接口请求失败 (Status: ${response.status})`,
      data?.code ?? response.status,
      JSON.stringify(data ?? {}).slice(0, 300),
    );
  }
  return data;
};
