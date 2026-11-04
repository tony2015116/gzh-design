import type { Env } from './types';
import { corsHeaders, jsonResponse } from './lib/http';
import { handleServeFile } from './routes/files';
import { handleUpload } from './routes/upload';
import { handleFormat } from './routes/format';
import { handleCoverCopy } from './routes/coverCopy';
import { handleXhsCards } from './routes/xhsCards';
import {
  handleFeishuAppConfigGet,
  handleFeishuAppConfigSave,
  handleFeishuDisconnect,
  handleFeishuDocContent,
  handleFeishuDocs,
  handleFeishuOauthCallback,
  handleFeishuOauthUrl,
  handleFeishuStatus,
} from './routes/feishu';
import { handleIllustrationJobCreate, handleIllustrationJobGet, handleIllustrationPlan } from './routes/illustration';
import { handleChangePassword, handleLogin, handleLogout, handleRegister, handleUserInfo } from './routes/auth';
import { handleDeletePreset, handleGetPresets, handleSavePreset } from './routes/presets';
import { handleAdminDiagnostics, handleAdminResetPassword, handleAdminUpdateUserRole } from './routes/admin';

export { IllustrationWorkflow } from './workflow';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') ?? '';
    const cors = corsHeaders(origin, env.ALLOWED_ORIGINS);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return jsonResponse({ status: 'ok' }, 200, cors);
    }

    if (url.pathname.startsWith('/file/') && request.method === 'GET') {
      return handleServeFile(decodeURIComponent(url.pathname.slice('/file/'.length)), env, cors);
    }

    if (url.pathname === '/upload' && request.method === 'POST') {
      return handleUpload(request, env, cors);
    }

    if (url.pathname === '/api/format' && request.method === 'POST') {
      return handleFormat(request, env, cors);
    }

    if (url.pathname === '/api/cover-copy' && request.method === 'POST') {
      return handleCoverCopy(request, env, cors);
    }

    if (url.pathname === '/api/xhs-cards' && request.method === 'POST') {
      return handleXhsCards(request, env, cors);
    }

    if (url.pathname === '/api/feishu/oauth/url' && request.method === 'GET') {
      return handleFeishuOauthUrl(request, env, cors);
    }

    if (url.pathname === '/api/feishu/oauth/callback' && request.method === 'POST') {
      return handleFeishuOauthCallback(request, env, cors);
    }

    if (url.pathname === '/api/feishu/status' && request.method === 'GET') {
      return handleFeishuStatus(request, env, cors);
    }

    if (url.pathname === '/api/feishu/app-config' && request.method === 'GET') {
      return handleFeishuAppConfigGet(request, env, cors);
    }

    if (url.pathname === '/api/feishu/app-config' && request.method === 'POST') {
      return handleFeishuAppConfigSave(request, env, cors);
    }

    if (url.pathname === '/api/feishu/disconnect' && request.method === 'POST') {
      return handleFeishuDisconnect(request, env, cors);
    }

    if (url.pathname === '/api/feishu/docs' && request.method === 'GET') {
      return handleFeishuDocs(request, env, cors);
    }

    if (url.pathname === '/api/feishu/doc-content' && request.method === 'POST') {
      return handleFeishuDocContent(request, env, cors);
    }

    if (url.pathname === '/api/illustration/plan' && request.method === 'POST') {
      return handleIllustrationPlan(request, env, cors);
    }

    if (url.pathname === '/api/illustration/jobs' && request.method === 'POST') {
      return handleIllustrationJobCreate(request, env, cors);
    }

    if (url.pathname.startsWith('/api/illustration/jobs/') && request.method === 'GET') {
      return handleIllustrationJobGet(
        decodeURIComponent(url.pathname.slice('/api/illustration/jobs/'.length)),
        request,
        env,
        cors,
      );
    }

    if (url.pathname === '/api/auth/register' && request.method === 'POST') {
      return handleRegister(request, env, cors);
    }

    if (url.pathname === '/api/auth/login' && request.method === 'POST') {
      return handleLogin(request, env, cors);
    }

    if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
      return handleLogout(request, env, cors);
    }

    if (url.pathname === '/api/auth/change-password' && request.method === 'POST') {
      return handleChangePassword(request, env, cors);
    }

    if (url.pathname === '/api/user/info' && request.method === 'GET') {
      return handleUserInfo(request, env, cors);
    }

    if (url.pathname === '/api/admin/diagnostics' && request.method === 'GET') {
      return handleAdminDiagnostics(request, env, cors);
    }

    if (url.pathname === '/api/admin/users/role' && request.method === 'POST') {
      return handleAdminUpdateUserRole(request, env, cors);
    }

    if (url.pathname === '/api/admin/users/reset-password' && request.method === 'POST') {
      return handleAdminResetPassword(request, env, cors);
    }

    if (url.pathname === '/api/user/presets' && request.method === 'GET') {
      return handleGetPresets(request, env, cors);
    }

    if (url.pathname === '/api/user/presets' && request.method === 'POST') {
      return handleSavePreset(request, env, cors);
    }

    if (url.pathname.startsWith('/api/user/presets/') && request.method === 'DELETE') {
      return handleDeletePreset(url.pathname.slice(18), request, env, cors);
    }

    return jsonResponse({ error: 'Not Found' }, 404, cors);
  },
};
