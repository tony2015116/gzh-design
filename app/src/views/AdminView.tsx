import { useEffect, useState } from 'react';
import { Activity, ArrowLeft, RefreshCw, Save, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ToastStack, type ToastItem, type ToastTone } from '../components/ui/ToastStack';
import { loadCdnConfig, loadR2Config, loadUploadMode, saveCdnConfig, saveR2Config, saveUploadMode } from '../services/imageUpload';
import type { UploadMode } from '../services/imageUpload';
import { buildLocalDiagnostics, fetchWorkerDiagnostics, type LocalDiagnostics, type WorkerDiagnostics } from '../services/diagnosticsService';

function statusChip(ok: boolean, text: string) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      {text}
    </span>
  );
}

export default function AdminView() {
  const navigate = useNavigate();
  const isOnlineMode = import.meta.env.VITE_APP_MODE === 'online';

  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [apiBaseUrl, setApiBaseUrl] = useState(localStorage.getItem('openai_api_base') || '');
  const [apiModel, setApiModel] = useState(localStorage.getItem('openai_model') || '');
  const [uploadMode, setUploadModeState] = useState<UploadMode>(loadUploadMode());
  const [r2Config, setR2ConfigState] = useState(loadR2Config() || { workerUrl: '', uploadSecret: '' });
  const [cdnConfig, setCdnConfigState] = useState(loadCdnConfig() || { uploadUrl: '', fieldName: 'file', headers: '', responsePath: 'data.url' });
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const [localDiagnostics, setLocalDiagnostics] = useState<LocalDiagnostics>(() => buildLocalDiagnostics());
  const [workerDiagnostics, setWorkerDiagnostics] = useState<WorkerDiagnostics | null>(null);
  const [workerDiagnosticsError, setWorkerDiagnosticsError] = useState('');
  const [isCheckingWorker, setIsCheckingWorker] = useState(false);

  const dismissToast = (id: string) => {
    setToastItems((current) => current.filter((item) => item.id !== id));
  };

  const pushToast = (tone: ToastTone, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToastItems((current) => [...current, { id, tone, title, message }]);
    window.setTimeout(() => {
      setToastItems((current) => current.filter((item) => item.id !== id));
    }, 3200);
  };

  const refreshLocalDiagnostics = () => {
    setLocalDiagnostics(buildLocalDiagnostics());
  };

  const canCheckWorkerDiagnostics = isOnlineMode && localDiagnostics.effectiveUser?.role === 'admin';

  const loadWorkerDiagnostics = async (showToast = false) => {
    if (!canCheckWorkerDiagnostics) return;

    try {
      setIsCheckingWorker(true);
      setWorkerDiagnosticsError('');
      const diagnostics = await fetchWorkerDiagnostics();
      setWorkerDiagnostics(diagnostics);
      if (showToast) {
        pushToast('success', '线上诊断已刷新', '后端服务、密钥配置 和数据库状态已更新。');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '线上诊断请求失败';
      setWorkerDiagnostics(null);
      setWorkerDiagnosticsError(message);
      pushToast('error', '线上诊断失败', message);
    } finally {
      setIsCheckingWorker(false);
    }
  };

  useEffect(() => {
    refreshLocalDiagnostics();
  }, []);

  useEffect(() => {
    if (canCheckWorkerDiagnostics) {
      void loadWorkerDiagnostics();
    } else {
      setWorkerDiagnostics(null);
      setWorkerDiagnosticsError('');
    }
  }, [canCheckWorkerDiagnostics]);

  const handleSave = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_api_base', apiBaseUrl);
    localStorage.setItem('openai_model', apiModel);
    saveUploadMode(uploadMode);
    if (uploadMode === 'r2') saveR2Config(r2Config);
    if (uploadMode === 'custom') saveCdnConfig(cdnConfig);
    refreshLocalDiagnostics();
    pushToast('success', '配置已保存', '本地配置已更新，诊断面板也已同步刷新。');
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#ecfeff_0%,#f8fafc_38%,#eef2ff_100%)] px-6 py-8">
      <ToastStack items={toastItems} onDismiss={dismissToast} />

      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="rounded-full border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition-colors hover:bg-white hover:text-slate-900">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Shield className="h-6 w-6 text-emerald-600" />
              控制台
            </h1>
            <p className="mt-1 text-sm text-slate-500">统一维护本地配置、当前环境状态和线上后端自检结果。</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
            <div className="border-b border-slate-100 px-6 py-6">
              <h2 className="text-lg font-semibold text-slate-900">大模型配置</h2>
              <p className="mt-1 text-sm text-slate-500">{isOnlineMode ? '模型由服务器管理员统一配置，个人无需填写 API Key。' : '兼容 OpenAI 格式接口，使用你自己的模型配置。'}</p>
            </div>

            <div className="space-y-6 px-6 py-6">
              {!isOnlineMode && <>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">API Key</label>
                <input
                  type="password"
                  placeholder="sk-..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">API Base URL</label>
                  <input
                    type="text"
                    placeholder="https://api.openai.com/v1"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    value={apiBaseUrl}
                    onChange={(e) => setApiBaseUrl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">模型名称</label>
                  <input
                    type="text"
                    placeholder="gpt-4o"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition-all focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    value={apiModel}
                    onChange={(e) => setApiModel(e.target.value)}
                  />
                </div>
              </div>

              </>}
              <div className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5">
                <h3 className="text-sm font-semibold text-slate-900">图片上传与分发</h3>
                <p className="mt-1 text-sm text-slate-500">维护当前环境默认使用的图床模式和回源地址。</p>

                <div className="mt-4 flex flex-wrap gap-4">
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    <input type="radio" name="uploadMode" value="r2" checked={uploadMode === 'r2'} onChange={() => setUploadModeState('r2')} className="text-emerald-600 focus:ring-emerald-500" />
                    服务器图床
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    <input type="radio" name="uploadMode" value="custom" checked={uploadMode === 'custom'} onChange={() => setUploadModeState('custom')} className="text-emerald-600 focus:ring-emerald-500" />
                    自定义 CDN
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700">
                    <input type="radio" name="uploadMode" value="base64" checked={uploadMode === 'base64'} onChange={() => setUploadModeState('base64')} className="text-emerald-600 focus:ring-emerald-500" />
                    Base64
                  </label>
                </div>

                {uploadMode === 'r2' && import.meta.env.VITE_API_SAME_ORIGIN === 'true' && (
                  <p className="mt-4 text-sm text-slate-500">图片保存到当前服务器，登录后即可上传。</p>
                )}
                {uploadMode === 'r2' && import.meta.env.VITE_API_SAME_ORIGIN !== 'true' && (
                  <div className="mt-4 space-y-4 rounded-[20px] border border-sky-100 bg-sky-50/70 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">后端地址</label>
                      <input
                        type="text"
                        placeholder="https://gzh-image-worker..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                        value={r2Config.workerUrl}
                        onChange={(e) => setR2ConfigState((prev) => ({ ...prev, workerUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">Upload Secret</label>
                      <input
                        type="password"
                        placeholder="可选，用于兼容旧的 Secret 模式"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-sky-400 focus:ring-4 focus:ring-sky-500/10"
                        value={r2Config.uploadSecret}
                        onChange={(e) => setR2ConfigState((prev) => ({ ...prev, uploadSecret: e.target.value }))}
                      />
                    </div>
                  </div>
                )}

                {uploadMode === 'custom' && (
                  <div className="mt-4 space-y-4 rounded-[20px] border border-orange-100 bg-orange-50/70 p-4">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">POST 接口 URL</label>
                      <input
                        type="text"
                        placeholder="https://upload.example.com/v1/image"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                        value={cdnConfig.uploadUrl}
                        onChange={(e) => setCdnConfigState((prev) => ({ ...prev, uploadUrl: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-slate-700">图片字段路径</label>
                      <input
                        type="text"
                        placeholder="data.url"
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                        value={cdnConfig.responsePath}
                        onChange={(e) => setCdnConfigState((prev) => ({ ...prev, responsePath: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all hover:bg-slate-800 active:scale-[0.98]"
                >
                  <Save className="h-4 w-4" />
                  保存全局配置
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="border-b border-slate-100 px-6 py-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                  <Activity className="h-5 w-5 text-sky-600" />
                  本地环境诊断
                </h2>
                <p className="mt-1 text-sm text-slate-500">不用请求后端，直接显示当前浏览器和模式配置。</p>
              </div>

              <div className="space-y-4 px-6 py-6 text-sm text-slate-600">
                <div className="flex flex-wrap gap-2">
                  {statusChip(localDiagnostics.mode === 'online', `模式：${localDiagnostics.mode}`)}
                  {statusChip(localDiagnostics.localAiConfigured, localDiagnostics.localAiConfigured ? '本地 API Key 已配置' : '本地 API Key 未配置')}
                  {statusChip(localDiagnostics.workerUrlConfigured, localDiagnostics.workerUrlConfigured ? '后端地址 已配置' : '后端地址 未配置')}
                </div>

                <div className="grid gap-3 rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">鉴权模式</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.authMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">访问控制模式</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.accessMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">当前有效身份</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.effectiveUser ? `${localDiagnostics.effectiveUser.email} (${localDiagnostics.effectiveUser.role})` : '未登录 / guest'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">开发角色</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.devRole}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">上传模式</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.uploadMode}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-500">本地模型</span>
                    <span className="font-medium text-slate-900">{localDiagnostics.localAiModel}</span>
                  </div>
                </div>

                {localDiagnostics.workerUrlConfigured && (
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">后端地址</div>
                    <div className="mt-2 break-all text-sm text-slate-700">{localDiagnostics.workerUrl}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[0_28px_80px_rgba(15,23,42,0.08)] backdrop-blur-xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-6">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">线上后端诊断</h2>
                  <p className="mt-1 text-sm text-slate-500">管理员登录后可检查 bindings、secrets、数据库 schema 和最近任务。</p>
                </div>
                <button
                  onClick={() => void loadWorkerDiagnostics(true)}
                  disabled={!canCheckWorkerDiagnostics || isCheckingWorker}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isCheckingWorker ? 'animate-spin' : ''}`} />
                  刷新诊断
                </button>
              </div>

              <div className="space-y-4 px-6 py-6 text-sm text-slate-600">
                {!isOnlineMode && (
                  <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4 text-slate-600">
                    当前是 `oss` 模式。线上诊断接口不会自动调用，你可以先用本地诊断确认调测配置。
                  </div>
                )}

                {isOnlineMode && !canCheckWorkerDiagnostics && (
                  <div className="rounded-[20px] border border-amber-100 bg-amber-50/80 p-4 text-amber-800">
                    当前身份不是 `admin`，或尚未建立真实登录态，因此不能读取 后端诊断接口。
                  </div>
                )}

                {workerDiagnosticsError && (
                  <div className="rounded-[20px] border border-rose-100 bg-rose-50/80 p-4 text-rose-700">
                    {workerDiagnosticsError}
                  </div>
                )}

                {workerDiagnostics && (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {statusChip(workerDiagnostics.bindings.db, '数据库')}
                      {statusChip(workerDiagnostics.bindings.imagesBucket, '图片存储')}
                      {statusChip(workerDiagnostics.bindings.workflow, '配图队列')}
                      {statusChip(workerDiagnostics.bindings.browser, workerDiagnostics.bindings.browser ? '浏览器截图已启用' : '浏览器截图未启用')}
                    </div>

                    <div className="grid gap-3 rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">AI 鉴权模式</span>
                        <span className="font-medium text-slate-900">{workerDiagnostics.runtime.authMode}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">日志等级</span>
                        <span className="font-medium text-slate-900">{workerDiagnostics.runtime.logLevel}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">OpenAI Key</span>
                        <span className="font-medium text-slate-900">{workerDiagnostics.secrets.openAiConfigured ? '已配置' : '未配置'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Gemini Key</span>
                        <span className="font-medium text-slate-900">{workerDiagnostics.secrets.geminiConfigured ? '已配置' : '未配置'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-500">Upload Secret</span>
                        <span className="font-medium text-slate-900">{workerDiagnostics.secrets.uploadSecretConfigured ? '已配置' : '未配置'}</span>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">数据库 Schema</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(workerDiagnostics.database.schema).map(([name, ok]) => (
                          <span key={name} className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                            <span className={`h-2 w-2 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            {name}
                          </span>
                        ))}
                      </div>
                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <div className="flex items-center justify-between gap-4">
                          <span>用户数</span>
                          <span className="font-medium text-slate-900">{workerDiagnostics.database.counts.users}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>会话数</span>
                          <span className="font-medium text-slate-900">{workerDiagnostics.database.counts.sessions}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>预设数</span>
                          <span className="font-medium text-slate-900">{workerDiagnostics.database.counts.presets}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>配图任务数</span>
                          <span className="font-medium text-slate-900">{workerDiagnostics.database.counts.illustrationJobs}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span>运行中配图任务</span>
                          <span className="font-medium text-slate-900">{workerDiagnostics.database.counts.runningIllustrationJobs}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-100 bg-slate-50/80 p-4">
                      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">最近配图任务</div>
                      {workerDiagnostics.database.recentJobs.length === 0 ? (
                        <div className="text-sm text-slate-500">当前还没有配图任务记录。</div>
                      ) : (
                        <div className="space-y-3">
                          {workerDiagnostics.database.recentJobs.map((job) => (
                            <div key={job.id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                              <div className="flex items-center justify-between gap-4">
                                <div className="min-w-0">
                                  <div className="truncate font-medium text-slate-900">{job.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">updated: {job.updatedAt || job.createdAt}</div>
                                </div>
                                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">{job.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
