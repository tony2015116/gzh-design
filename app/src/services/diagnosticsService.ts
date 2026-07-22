import { getAuthToken, getCurrentUser, type User } from './authService';
import { getAccessMode, getAuthMode, getEffectiveUser, loadDevIdentityRole } from './accessControl';
import { loadCdnConfig, loadR2Config, loadUploadMode } from './imageUpload';

export interface WorkerDiagnostics {
  checkedAt: string;
  viewer: {
    id: string;
    email: string;
    role: string;
  };
  runtime: {
    authMode: string;
    logLevel: string;
    previewChars: number;
    allowedOrigins: string;
  };
  bindings: {
    db: boolean;
    imagesBucket: boolean;
    workflow: boolean;
    browser: boolean;
  };
  secrets: {
    openAiConfigured: boolean;
    openAiBaseConfigured: boolean;
    openAiModel: string;
    geminiConfigured: boolean;
    geminiImageModel: string;
    uploadSecretConfigured: boolean;
  };
  database: {
    ok: boolean;
    error: string | null;
    schema: Record<string, boolean>;
    counts: {
      users: number;
      sessions: number;
      presets: number;
      illustrationJobs: number;
      runningIllustrationJobs: number;
    };
    recentJobs: Array<{
      id: string;
      status: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

export interface LocalDiagnostics {
  checkedAt: string;
  mode: 'oss' | 'online';
  authMode: string;
  accessMode: string;
  effectiveUser: User | null;
  devRole: string;
  uploadMode: string;
  workerUrlConfigured: boolean;
  workerUrl: string;
  uploadSecretConfigured: boolean;
  customUploadConfigured: boolean;
  localAiConfigured: boolean;
  localAiBaseConfigured: boolean;
  localAiModel: string;
}

function getWorkerUrl(): string {
  const r2Config = loadR2Config();
  return (r2Config?.workerUrl || '').replace(/\/$/, '');
}

export function buildLocalDiagnostics(): LocalDiagnostics {
  const workerUrl = getWorkerUrl();
  const r2Config = loadR2Config();
  const cdnConfig = loadCdnConfig();
  const realUser = getCurrentUser();

  return {
    checkedAt: new Date().toISOString(),
    mode: import.meta.env.VITE_APP_MODE === 'online' ? 'online' : 'oss',
    authMode: getAuthMode(),
    accessMode: getAccessMode(),
    effectiveUser: getEffectiveUser(realUser, loadDevIdentityRole()),
    devRole: loadDevIdentityRole(),
    uploadMode: loadUploadMode(),
    workerUrlConfigured: Boolean(workerUrl),
    workerUrl,
    uploadSecretConfigured: Boolean((r2Config?.uploadSecret || '').trim()),
    customUploadConfigured: Boolean((cdnConfig?.uploadUrl || '').trim()),
    localAiConfigured: Boolean((localStorage.getItem('openai_api_key') || '').trim()),
    localAiBaseConfigured: Boolean((localStorage.getItem('openai_api_base') || '').trim()),
    localAiModel: (localStorage.getItem('openai_model') || 'gpt-4o').trim() || 'gpt-4o',
  };
}

export async function fetchWorkerDiagnostics(): Promise<WorkerDiagnostics> {
  const workerUrl = getWorkerUrl();
  const token = getAuthToken();

  if (!workerUrl) {
    throw new Error('未配置 Worker URL，无法拉取线上诊断信息。');
  }

  if (!token) {
    throw new Error('当前没有登录态，无法拉取线上诊断信息。');
  }

  const response = await fetch(`${workerUrl}/api/admin/diagnostics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `线上诊断请求失败 (${response.status})`);
  }

  return data.diagnostics as WorkerDiagnostics;
}
