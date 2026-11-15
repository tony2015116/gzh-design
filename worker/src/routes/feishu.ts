import type { Env } from '../types';
import { createTraceId, jsonResponse } from '../lib/http';
import { authenticateUser } from '../lib/auth';
import { logFormatEvent } from '../lib/logging';
import { exchangeCodeForToken, feishuGet, getValidAccessToken, resolveFeishuCredentials, saveFeishuAppCredentials, FeishuAuthError } from '../lib/feishuAuth';
import type { FeishuCredentials } from '../lib/feishuAuth';
import { convertFeishuDocToMarkdown, parseFeishuDocUrl } from '../lib/feishuDocx';
import {validFeishuRedirect,issueFeishuState,consumeFeishuState} from '../lib/feishuState';
import {decryptSecret,SecretVaultError} from '../lib/secretVault';

const API_BASE = 'https://open.feishu.cn/open-apis';
const MAX_IMAGES = 20;
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type FeishuHandler = (
  request: Request,
  env: Env,
  cors: Record<string, string>,
) => Promise<Response>;

/** 错误兜底：飞书 API 异常统一转成可读响应 */
const feishuErrorResponse = (
  env: Env,
  traceId: string,
  feature: string,
  err: any,
  cors: Record<string, string>,
): Response => {
  if (err instanceof SecretVaultError) return jsonResponse({error:err.message},503,cors);
  if (err instanceof FeishuAuthError) {
    logFormatEvent(env, traceId, 'feishu.api.failed', { feature, code: err.code });
    if (err.code === 401 || err.code === 99991663 || err.code === 99991661) {
      return jsonResponse({ error: '飞书授权已失效，请重新绑定', needRebind: true }, 401, cors);
    }
    return jsonResponse({ error: '飞书请求失败，请检查授权和应用配置' }, 502, cors);
  }
  logFormatEvent(env, traceId, 'worker.exception', { feature, message: 'unexpected_feishu_error' });
  return jsonResponse({ error: '飞书功能暂时不可用' }, 500, cors);
};

/** 仅登录校验（状态/配置类接口用，不要求已配置凭证） */
const withFeishuLogin = (
  feature: string,
  handler: (request: Request, env: Env, cors: Record<string, string>, userId: string) => Promise<Response>,
): FeishuHandler => {
  return async (request, env, cors) => {
    const traceId = createTraceId(request);
    const user = await authenticateUser(request, env);
    if (!user) {
      return jsonResponse({ error: '飞书功能需要先登录' }, 401, cors);
    }
    try {
      return await handler(request, env, cors, user.id);
    } catch (err: any) {
      return feishuErrorResponse(env, traceId, feature, err, cors);
    }
  };
};

/** 登录 + 凭证解析（用户自配优先，环境变量兜底）+ 错误兜底 */
const withFeishuAuth = (
  feature: string,
  handler: (request: Request, env: Env, cors: Record<string, string>, userId: string, creds: FeishuCredentials) => Promise<Response>,
): FeishuHandler => {
  return async (request, env, cors) => {
    const traceId = createTraceId(request);
    const user = await authenticateUser(request, env);
    if (!user) {
      return jsonResponse({ error: '飞书功能需要先登录' }, 401, cors);
    }
    try {
      const creds = await resolveFeishuCredentials(env, user.id);
      if (!creds) return jsonResponse({ error: '请先配置你的飞书应用凭证（App ID / Secret）' }, 400, cors);
      return await handler(request, env, cors, user.id, creds);
    } catch (err: any) {
      return feishuErrorResponse(env, traceId, feature, err, cors);
    }
  };
};

/** 生成飞书 OAuth 授权链接。state 绑定当前用户，回调时校验 */
export const handleFeishuOauthUrl = withFeishuAuth('oauth-url', async (request, env, cors, userId, creds) => {
  const url = new URL(request.url);
  const redirectUri = url.searchParams.get('redirectUri') || '';
  if (!validFeishuRedirect(request,env,redirectUri)) {
    return jsonResponse({ error: '缺少合法的 redirectUri' }, 400, cors);
  }

  const state = await issueFeishuState(request,env,userId,creds.appId,redirectUri);
  const authorizeUrl =
    `https://accounts.feishu.cn/open-apis/authen/v1/authorize` +
    `?client_id=${encodeURIComponent(creds.appId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return jsonResponse({ authorizeUrl }, 200, cors);
});

/** 授权回调：code 换 token 并落库 */
export const handleFeishuOauthCallback = withFeishuAuth('oauth-callback', async (request, env, cors, userId, creds) => {
  const body: any = await request.json().catch(() => null);
  const code = typeof body?.code === 'string' ? body.code : '';
  const state = typeof body?.state === 'string' ? body.state : '';
  const redirectUri = typeof body?.redirectUri === 'string' ? body.redirectUri : '';

  if (!code || !redirectUri) {
    return jsonResponse({ error: '缺少 code 或 redirectUri' }, 400, cors);
  }
  if (!(await consumeFeishuState(request,env,userId,creds.appId,state,redirectUri))) {
    return jsonResponse({ error: 'state 校验失败，请重新发起绑定' }, 403, cors);
  }

  const { feishuUserName } = await exchangeCodeForToken(env, creds, userId, code, redirectUri);
  return jsonResponse({ ok: true, feishuUserName }, 200, cors);
});

/** 绑定状态（含是否已配置应用凭证） */
export const handleFeishuStatus = withFeishuLogin('status', async (_request, env, cors, userId) => {
  const [tokenRow, appRow] = await Promise.all([
    env.DB.prepare('SELECT feishu_user_name FROM feishu_tokens WHERE user_id = ?')
      .bind(userId)
      .first<{ feishu_user_name: string | null }>(),
    env.DB.prepare('SELECT app_id FROM feishu_apps WHERE user_id = ?')
      .bind(userId)
      .first<{ app_id: string }>(),
  ]);
  return jsonResponse(
    {
      bound: Boolean(tokenRow),
      feishuUserName: tokenRow?.feishu_user_name || '',
      appConfigured: Boolean(appRow),
    },
    200,
    cors,
  );
});

/** 读取用户自己的飞书应用凭证（secret 只回掩码） */
export const handleFeishuAppConfigGet = withFeishuLogin('app-config-get', async (_request, env, cors, userId) => {
  const row = await env.DB.prepare('SELECT app_id, app_secret FROM feishu_apps WHERE user_id = ?')
    .bind(userId)
    .first<{ app_id: string; app_secret: string }>();
  const secret = row?.app_secret ? await decryptSecret(env,row.app_secret,`${userId}:app_secret`) : '';
  return jsonResponse(
    {
      configured: Boolean(row),
      appId: row?.app_id || '',
      secretPreview: secret ? `****${secret.slice(-4)}` : '',
    },
    200,
    cors,
  );
});

/** 保存用户自己的飞书应用凭证；secret 留空表示不修改 */
export const handleFeishuAppConfigSave = withFeishuLogin('app-config-save', async (request, env, cors, userId) => {
  const body: any = await request.json().catch(() => null);
  const appId = typeof body?.appId === 'string' ? body.appId.trim() : '';
  const appSecret = typeof body?.appSecret === 'string' ? body.appSecret.trim() : '';

  if (!appId || appId.length > 200 || appSecret.length > 4096) {
    return jsonResponse({ error: 'App ID 或 App Secret 长度无效' }, 400, cors);
  }

  if (appSecret) {
    await saveFeishuAppCredentials(env, userId, appId, appSecret);
  } else {
    const existing = await env.DB.prepare('SELECT app_secret FROM feishu_apps WHERE user_id = ?')
      .bind(userId)
      .first<{ app_secret: string }>();
    if (!existing) {
      return jsonResponse({ error: '首次配置必须填写 App Secret' }, 400, cors);
    }
    await saveFeishuAppCredentials(env, userId, appId, await decryptSecret(env,existing.app_secret,`${userId}:app_secret`));
  }

  return jsonResponse({ ok: true }, 200, cors);
});

/** 解绑 */
export const handleFeishuDisconnect = withFeishuLogin('disconnect', async (_request, env, cors, userId) => {
  await env.DB.batch([env.DB.prepare('DELETE FROM feishu_tokens WHERE user_id = ?').bind(userId),env.DB.prepare('DELETE FROM feishu_oauth_states WHERE user_id = ?').bind(userId)]);
  return jsonResponse({ ok: true }, 200, cors);
});

/** 最近文档列表（云空间根目录文件，仅 docx） */
export const handleFeishuDocs = withFeishuAuth('docs', async (_request, env, cors, userId, creds) => {
  const accessToken = await getValidAccessToken(env, creds, userId);
  if (!accessToken) {
    return jsonResponse({ error: '尚未绑定飞书账号', needBind: true }, 401, cors);
  }

  const data = await feishuGet(`${API_BASE}/drive/v1/files?page_size=50&order_by=EditedTime&direction=DESC`, accessToken);
  const files = (data?.data?.files ?? [])
    .filter((f: any) => f.type === 'docx')
    .map((f: any) => ({
      token: f.token,
      name: f.name,
      type: f.type,
      modifiedTime: Number(f.modified_time) * 1000 || 0,
      url: f.url || '',
    }));

  return jsonResponse({ docs: files }, 200, cors);
});

const EXT_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
};

/** 下载文档内图片到 R2，返回可公开访问的 /file/ URL */
const migrateImage = async (
  env: Env,
  accessToken: string,
  requestOrigin: string,
  userId: string,
  docToken: string,
  fileToken: string,
): Promise<string | null> => {
  const response = await fetch(`${API_BASE}/drive/v1/medias/${fileToken}/download`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) return null;

  const mime = response.headers.get('content-type')?.split(';')[0] || 'image/png';
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength === 0 || buffer.byteLength > MAX_IMAGE_BYTES) return null;

  const ext = EXT_BY_MIME[mime] || 'png';
  const key = `feishu/${userId}/${docToken}/${fileToken}.${ext}`;
  await env.IMAGES_BUCKET.put(key, buffer, { httpMetadata: { contentType: mime } });
  return `${requestOrigin}/file/${key}`;
};

/** 导入文档：拉取全部 block → 转 Markdown → 图片迁移到 R2 */
export const handleFeishuDocContent = withFeishuAuth('doc-content', async (request, env, cors, userId, creds) => {
  const body: any = await request.json().catch(() => null);
  const input = typeof body?.input === 'string' ? body.input : '';
  const parsed = parseFeishuDocUrl(input);
  if (!parsed) {
    return jsonResponse({ error: '无法识别的飞书文档链接，请粘贴完整链接' }, 400, cors);
  }

  const accessToken = await getValidAccessToken(env, creds, userId);
  if (!accessToken) {
    return jsonResponse({ error: '尚未绑定飞书账号', needBind: true }, 401, cors);
  }

  let { docToken } = parsed;
  if (parsed.docType === 'wiki') {
    const node = await feishuGet(`${API_BASE}/wiki/v2/spaces/get_node?token=${docToken}`, accessToken);
    if (node?.data?.node?.obj_type !== 'docx' || !node?.data?.node?.obj_token) {
      return jsonResponse({ error: '该飞书 Wiki 节点不是新版文档（docx），暂不支持' }, 400, cors);
    }
    docToken = node.data.node.obj_token;
  } else if (parsed.docType === 'docs') {
    return jsonResponse({ error: '旧版飞书文档（docs）暂不支持，请另存为新版文档（docx）后重试' }, 400, cors);
  }

  const [docInfo, blocks] = await Promise.all([
    feishuGet(`${API_BASE}/docx/v1/documents/${docToken}`, accessToken),
    (async () => {
      const all: any[] = [];
      let pageToken = '';
      do {
        const data = await feishuGet(
          `${API_BASE}/docx/v1/documents/${docToken}/blocks?page_size=500${pageToken ? `&page_token=${pageToken}` : ''}`,
          accessToken,
        );
        all.push(...(data?.data?.items ?? []));
        pageToken = data?.data?.has_more ? data?.data?.page_token ?? '' : '';
      } while (pageToken);
      return all;
    })(),
  ]);

  if (blocks.length === 0) {
    return jsonResponse({ error: '文档内容为空，或没有读取权限' }, 400, cors);
  }

  const { markdown, mediaTokens } = convertFeishuDocToMarkdown(blocks);

  // 图片迁移到 R2 并替换占位
  let finalMarkdown = markdown;
  let migratedCount = 0;
  const requestOrigin = new URL(request.url).origin;
  const uniqueTokens = Array.from(new Set(mediaTokens)).slice(0, MAX_IMAGES);
  for (const token of uniqueTokens) {
    const url = await migrateImage(env, accessToken, requestOrigin, userId, docToken, token);
    if (url) {
      finalMarkdown = finalMarkdown.replaceAll(`feishu-media:${token}`, url);
      migratedCount++;
    } else {
      finalMarkdown = finalMarkdown.replaceAll(`![图片](feishu-media:${token})`, '> （图片迁移失败，请手动补充）');
    }
  }

  return jsonResponse(
    {
      title: docInfo?.data?.document?.title || '飞书文档',
      markdown: finalMarkdown,
      imageCount: migratedCount,
    },
    200,
    cors,
  );
});
