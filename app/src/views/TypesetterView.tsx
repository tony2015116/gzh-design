import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Copy,
  FileText,
  ImageDown,
  ImagePlus,
  LogOut,
  MessageSquareQuote,
  MonitorPlay,
  Settings,
  Share2,
  User as UserIcon,
  Wand2,
} from 'lucide-react';

import { getAITypesetMarkdown } from '../ai/formatter';
import { Preview } from '../components/preview/Preview';
import { CheatsheetModal } from '../components/ui/CheatsheetModal';
import { DevIdentitySwitcher } from '../components/ui/DevIdentitySwitcher';
import { HeaderMenu } from '../components/ui/HeaderMenu';
import { InputPromptModal } from '../components/ui/InputPromptModal';
import { IllustrationJobPanel } from '../components/ui/IllustrationJobPanel';
import { IllustrationPlanModal } from '../components/ui/IllustrationPlanModal';
import { PlatformExportPanel } from '../components/ui/PlatformExportPanel';
import { ImageExportPanel } from '../components/ui/ImageExportPanel';
import { ToastStack, type ToastItem, type ToastTone } from '../components/ui/ToastStack';
import { Editor } from '../components/editor/Editor';
import { DEFAULT_IMAGE_STYLE, DEFAULT_LAYOUT_STYLE, IMAGE_STYLES, LAYOUT_STYLES } from '../core/style';
import type { ImageStyle, LayoutStyle } from '../core/style';
import { DEFAULT_THEME, THEMES } from '../core/theme';
import type { Theme } from '../core/theme';
import {
  getAiTypesetAccess,
  getIllustrationAccess,
  loadDevIdentityRole,
  saveDevIdentityRole,
  shouldShowDevIdentitySwitcher,
  usesRealAuth,
  type DevIdentityRole,
} from '../services/accessControl';
import {
  changePassword,
  fetchPresets,
  getCurrentUser,
  logout,
  refreshUser,
  savePreset,
} from '../services/authService';
import type { Preset, User } from '../services/authService';
import {
  createIllustrationJob,
  getIllustrationJob,
  type IllustrationJob,
  getIllustrationPlan,
  type IllustrationPlan,
} from '../services/illustrationService';
import {
  loadCdnConfig,
  loadR2Config,
  loadUploadMode,
  saveCdnConfig,
  saveR2Config,
  saveUploadMode,
} from '../services/imageUpload';
import type { UploadMode } from '../services/imageUpload';
import {
  generateXArticleExport,
  generateXThreadExport,
  type XArticleExport,
  type XThreadExport,
} from '../services/xExportService';

const defaultMarkdown = `# 01 | 智能排版演示 | /// DEMO

在左侧输入 Markdown，右侧会实时渲染成适配公众号宽度的预览。

## STEP01 | 为什么需要自动配图

很多知识型文章只有文字，没有必要的示意图、对比图和场景图，读者会更容易疲劳。尤其是教程、方法论、流程说明和数据分析文章，适当插图会显著提升可读性。

> 智能配图不是盲目加图，而是先分析哪些段落真的值得插图，再由用户确认。

---

## STEP02 | 自动配图的两种引擎

系统规划了两类配图方式：

- HTTP 生图：适合主题图、场景图、封面图
- HTML 信息图：适合流程图、对比图、框架图、时间线

## STEP03 | 当前阶段

当前流程已经支持“建议 -> 确认 -> 后台生成 -> 手动应用到正文”。

| 能力 | 当前状态 | 权限 |
| :--- | :--- | :--- |
| AI 排版 | 已可用 | 登录用户 |
| 智能配图 | 已支持建议与异步生成 | VIP 用户 |

\`\`\`javascript
function greet() {
  console.log("Hello WeChat");
  return true;
}
\`\`\`
`;

function TypesetterView() {
  const isOnlineMode = import.meta.env.VITE_APP_MODE === 'online';
  const isRealAuth = usesRealAuth();
  const showDevIdentity = shouldShowDevIdentitySwitcher();
  const navigate = useNavigate();

  const [markdown, setMarkdown] = useState(defaultMarkdown);
  const [isTypesetting, setIsTypesetting] = useState(false);
  const [isPlanningIllustration, setIsPlanningIllustration] = useState(false);
  const [isApplyingIllustration, setIsApplyingIllustration] = useState(false);
  const [isApplyingIllustrationResult, setIsApplyingIllustrationResult] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [apiBaseUrl, setApiBaseUrl] = useState(localStorage.getItem('openai_api_base') || '');
  const [apiModel, setApiModel] = useState(localStorage.getItem('openai_model') || '');
  const [showSettings, setShowSettings] = useState(false);
  const [showCheatsheet, setShowCheatsheet] = useState(false);
  const [activeTheme, setActiveTheme] = useState<Theme>(DEFAULT_THEME);
  const [activeLayoutStyle, setActiveLayoutStyle] = useState<LayoutStyle>(DEFAULT_LAYOUT_STYLE);
  const [activeImageStyle, setActiveImageStyle] = useState<ImageStyle>(DEFAULT_IMAGE_STYLE);
  const [settingsTab, setSettingsTab] = useState<'ai' | 'cdn'>('ai');

  const [uploadMode, setUploadMode] = useState<UploadMode>(loadUploadMode());
  const savedR2 = loadR2Config();
  const [r2WorkerUrl, setR2WorkerUrl] = useState(savedR2?.workerUrl || '');
  const [r2UploadSecret, setR2UploadSecret] = useState(savedR2?.uploadSecret || '');
  const savedCdn = loadCdnConfig();
  const [cdnUploadUrl, setCdnUploadUrl] = useState(savedCdn?.uploadUrl || '');
  const [cdnFieldName, setCdnFieldName] = useState(savedCdn?.fieldName || 'file');
  const [cdnHeaders, setCdnHeaders] = useState(savedCdn?.headers || '');
  const [cdnResponsePath, setCdnResponsePath] = useState(savedCdn?.responsePath || 'data.url');

  const [authUser, setAuthUser] = useState<User | null>(getCurrentUser());
  const [devIdentityRole, setDevIdentityRole] = useState<DevIdentityRole>(loadDevIdentityRole());
  const [presets, setPresets] = useState<Preset[]>([]);
  const [illustrationPlan, setIllustrationPlan] = useState<IllustrationPlan | null>(null);
  const [lastIllustrationJob, setLastIllustrationJob] = useState<IllustrationJob | null>(null);
  const [selectedIllustrationIds, setSelectedIllustrationIds] = useState<string[]>([]);
  const [toastItems, setToastItems] = useState<ToastItem[]>([]);
  const [showPresetNameModal, setShowPresetNameModal] = useState(false);
  const [presetNameInput, setPresetNameInput] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [previewTab, setPreviewTab] = useState<'wechat' | 'xThread' | 'xArticle'>('wechat');
  const [xThreadExport, setXThreadExport] = useState<XThreadExport | null>(null);
  const [xArticleExport, setXArticleExport] = useState<XArticleExport | null>(null);
  const [showImageExportPanel, setShowImageExportPanel] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const canUseCloudPresets = isRealAuth && Boolean(authUser);
  const canChangePassword = isRealAuth && Boolean(authUser);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const isSyncingLeft = useRef(false);
  const isSyncingRight = useRef(false);
  const scrollSyncRafRef = useRef<number | null>(null);
  const notifiedIllustrationJobsRef = useRef<Record<string, IllustrationJob['status']>>({});

  useEffect(() => {
    if (!isRealAuth) return;

    refreshUser().then(setAuthUser).catch(() => setAuthUser(getCurrentUser()));
  }, [isRealAuth]);

  useEffect(() => {
    if (!canUseCloudPresets) {
      setPresets([]);
      return;
    }

    fetchPresets().then(setPresets).catch(console.error);
  }, [canUseCloudPresets]);

  useEffect(() => {
    if (!isOnlineMode || !lastIllustrationJob) return;
    if (!['queued', 'running', 'waiting'].includes(lastIllustrationJob.status)) return;

    let cancelled = false;
    const jobId = lastIllustrationJob.id;

    const pollJob = async () => {
      try {
        const nextJob = await getIllustrationJob(jobId);
        if (cancelled) return;

        setLastIllustrationJob((current) => (
          current?.id === jobId ? nextJob : current
        ));

        if (
          (nextJob.status === 'completed' || nextJob.status === 'failed')
          && notifiedIllustrationJobsRef.current[jobId] !== nextJob.status
        ) {
          notifiedIllustrationJobsRef.current[jobId] = nextJob.status;
          if (nextJob.status === 'completed') {
            pushToast('success', '配图任务已完成', '结果已经生成，可在右下角面板中决定是否应用到正文。');
          } else {
            pushToast('error', '配图任务失败', nextJob.error || '后台生成失败，请稍后重试。');
          }
        }
      } catch (error) {
        if (!cancelled) {
          console.error('轮询配图任务失败:', error);
        }
      }
    };

    void pollJob();
    const timer = window.setInterval(() => {
      void pollJob();
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isOnlineMode, lastIllustrationJob?.id, lastIllustrationJob?.status]);

  const handleDevIdentityChange = (role: DevIdentityRole) => {
    saveDevIdentityRole(role);
    setDevIdentityRole(role);
  };

  const dismissToast = (id: string) => {
    setToastItems((current) => current.filter((item) => item.id !== id));
  };

  const pushToast = (tone: ToastTone, title: string, message?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToastItems((current) => [...current, { id, tone, title, message }]);
    window.setTimeout(() => {
      setToastItems((current) => current.filter((item) => item.id !== id));
    }, 3600);
  };

  const handleSavePreset = () => {
    if (!isRealAuth) {
      pushToast('info', '当前模式不支持', 'OSS 调试模式下不启用云端预设保存。');
      return;
    }

    if (!authUser) {
      pushToast('info', '需要先登录', '登录后才能保存云端预设。');
      navigate('/login', { state: { from: '/' } });
      return;
    }

    setPresetNameInput('');
    setShowPresetNameModal(true);
  };

  const handleConfirmSavePreset = async () => {
    const name = presetNameInput.trim();
    if (!name) return;

    setIsSavingPreset(true);
    try {
      await savePreset(name, activeTheme, activeLayoutStyle, activeImageStyle);
      const nextPresets = await fetchPresets();
      setPresets(nextPresets);
      setShowPresetNameModal(false);
      setPresetNameInput('');
      pushToast('success', '预设已保存', `“${name}” 已加入你的云端预设。`);
    } catch (error: any) {
      pushToast('error', '保存失败', error.message || '保存预设失败');
    } finally {
      setIsSavingPreset(false);
    }
  };

  useEffect(() => () => {
    if (scrollSyncRafRef.current !== null) {
      window.cancelAnimationFrame(scrollSyncRafRef.current);
    }
  }, []);

  const handleEditorScroll = () => {
    // rAF 节流：一次滚动事件帧内只同步一次预览滚动位置
    if (scrollSyncRafRef.current !== null) return;

    scrollSyncRafRef.current = window.requestAnimationFrame(() => {
      scrollSyncRafRef.current = null;

      if (isSyncingLeft.current) {
        isSyncingLeft.current = false;
        return;
      }

      const editor = editorRef.current;
      const preview = previewScrollRef.current;
      if (!editor || !preview) return;

      const editorScrollableHeight = editor.scrollHeight - editor.clientHeight;
      if (editorScrollableHeight <= 0) return;

      const percentage = editor.scrollTop / editorScrollableHeight;
      const previewScrollableHeight = preview.scrollHeight - preview.clientHeight;

      isSyncingRight.current = true;
      preview.scrollTop = percentage * previewScrollableHeight;
    });
  };

  const handlePreviewScroll = () => {
    if (isSyncingRight.current) {
      isSyncingRight.current = false;
      return;
    }

    const editor = editorRef.current;
    const preview = previewScrollRef.current;
    if (!editor || !preview) return;

    const previewScrollableHeight = preview.scrollHeight - preview.clientHeight;
    if (previewScrollableHeight <= 0) return;

    const percentage = preview.scrollTop / previewScrollableHeight;
    const editorScrollableHeight = editor.scrollHeight - editor.clientHeight;

    isSyncingLeft.current = true;
    editor.scrollTop = percentage * editorScrollableHeight;
  };

  const handleCopy = async () => {
    const element = document.getElementById('wechat-article-preview');
    if (!element) return;

    try {
      let htmlContent = element.innerHTML || '';
      const textContent = element.innerText;

      htmlContent = htmlContent.replace(/\n/g, '').replace(/\r/g, '');

      const clipboardItem = new ClipboardItem({
        'text/html': new Blob([htmlContent], { type: 'text/html' }),
        'text/plain': new Blob([textContent], { type: 'text/plain' }),
      });

      await navigator.clipboard.write([clipboardItem]);
      pushToast('success', '复制成功', '公众号兼容 HTML 已复制到剪贴板。');
    } catch {
      try {
        await navigator.clipboard.writeText(element.outerHTML);
        pushToast('success', '复制成功', '公众号兼容 HTML 已复制到剪贴板。');
      } catch {
        pushToast('error', '复制失败', '请重试，或检查浏览器剪贴板权限。');
      }
    }
  };

  const copyPlainText = async (content: string, successTitle: string, successMessage: string) => {
    try {
      await navigator.clipboard.writeText(content);
      pushToast('success', successTitle, successMessage);
    } catch {
      pushToast('error', '复制失败', '请重试，或检查浏览器剪贴板权限。');
    }
  };

  const copyRichText = async (
    html: string,
    plain: string,
    successTitle: string,
    successMessage: string,
  ) => {
    try {
      if (typeof ClipboardItem !== 'undefined' && navigator.clipboard.write) {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        });
        await navigator.clipboard.write([clipboardItem]);
      } else {
        await navigator.clipboard.writeText(plain);
      }

      pushToast('success', successTitle, successMessage);
    } catch {
      try {
        await navigator.clipboard.writeText(plain);
        pushToast('success', successTitle, `${successMessage}（已使用纯文本兼容模式）`);
      } catch {
        pushToast('error', '复制失败', '请重试，或检查浏览器剪贴板权限。');
      }
    }
  };

  const handleCopyXThread = async () => {
    const nextExport = generateXThreadExport(markdown);
    setXThreadExport(nextExport);
    setPreviewTab('xThread');
    await copyPlainText(nextExport.combinedText, '复制成功', `X Thread 文案已复制，共 ${nextExport.posts.length} 条。`);
  };

  const handleCopyXArticle = async () => {
    const nextExport = generateXArticleExport(markdown);
    setXArticleExport(nextExport);
    setPreviewTab('xArticle');
    await copyRichText(
      nextExport.combinedHtml,
      nextExport.combinedText,
      '复制成功',
      'X Article 富文本草稿已复制，可直接手动粘贴到 X。',
    );
  };

  const handleAITypeset = async () => {
    const access = getAiTypesetAccess(authUser, devIdentityRole);
    if (!access.allowed) {
      pushToast('info', '暂不可用', access.message);
      if (access.reason === 'login_required' && isRealAuth) {
        navigate('/login', { state: { from: '/' } });
      }
      return;
    }

    if (!isOnlineMode && !apiKey) {
      pushToast('info', '需要配置 API Key', 'OSS 模式下请先配置 OpenAI API Key。');
      setShowSettings(true);
      return;
    }

    setIsTypesetting(true);
    try {
      const nextMarkdown = await getAITypesetMarkdown(apiKey, markdown, apiBaseUrl, apiModel);
      setMarkdown(nextMarkdown);
      pushToast('success', 'AI 排版完成', '文章内容已按当前主题和版式完成优化。');
    } catch (error: any) {
      console.error('AI 排版失败:', error);
      pushToast('error', 'AI 排版失败', error.message || '请稍后重试。');
    } finally {
      setIsTypesetting(false);
    }
  };

  const handleIllustrationPlan = async () => {
    const access = getIllustrationAccess(authUser, devIdentityRole);
    if (!access.allowed) {
      pushToast('info', '暂不可用', access.message);
      if (access.reason === 'login_required' && isRealAuth) {
        navigate('/login', { state: { from: '/' } });
      }
      return;
    }

    setIsPlanningIllustration(true);
    try {
      const plan = await getIllustrationPlan({
        markdown,
        density: 'balanced',
        preferredStyle: 'auto',
        maxImages: 3,
        layoutStyleId: activeLayoutStyle.id,
        themeId: activeTheme.id,
      });

      setIllustrationPlan(plan);
      setSelectedIllustrationIds(plan.items.map((item) => item.id));
    } catch (error: any) {
      console.error('智能配图建议失败:', error);
      pushToast('error', '配图建议失败', error.message || '请稍后重试。');
    } finally {
      setIsPlanningIllustration(false);
    }
  };

  const handlePresetSelect = (value: string) => {
    if (!value) return;

    if (value === 'save') {
      handleSavePreset();
      return;
    }

    if (value === 'login') {
      navigate('/login', { state: { from: '/' } });
      return;
    }

    if (value === 'mock-disabled') {
      pushToast('info', '当前模式不支持', 'OSS 调试模式下不启用云端预设。');
      return;
    }

    const preset = presets.find((item) => item.id === value);
    if (!preset) return;

    setActiveTheme(preset.theme as any);
    setActiveLayoutStyle(preset.layout_style as any);
    setActiveImageStyle(preset.image_style as any);
  };

  const handleToggleIllustrationItem = (id: string) => {
    setSelectedIllustrationIds((current) => (
      current.includes(id)
        ? current.filter((itemId) => itemId !== id)
        : [...current, id]
    ));
  };

  const handleCloseIllustrationPlan = () => {
    if (isApplyingIllustration) return;
    setIllustrationPlan(null);
    setSelectedIllustrationIds([]);
  };

  const handleApplyIllustrationPlan = async () => {
    if (!illustrationPlan) return;

    const access = getIllustrationAccess(authUser, devIdentityRole);
    if (!access.allowed) {
      pushToast('info', '暂不可用', access.message);
      if (access.reason === 'login_required' && isRealAuth) {
        navigate('/login', { state: { from: '/' } });
      }
      return;
    }

    if (selectedIllustrationIds.length === 0) {
      pushToast('info', '请选择建议', '请至少保留一条配图建议。');
      return;
    }

    setIsApplyingIllustration(true);
    try {
      const job = await createIllustrationJob({
        markdown,
        plan: illustrationPlan,
        selectedIds: selectedIllustrationIds,
      });

      if (job.status === 'completed' && job.resultMarkdown) {
        setMarkdown(job.resultMarkdown);
      }
      setLastIllustrationJob(job);
      setIllustrationPlan(null);
      setSelectedIllustrationIds([]);
      if (job.status !== 'completed' || !job.resultMarkdown) {
        pushToast('success', '配图任务已提交', '后台正在生成配图，完成后可在右下角面板中决定是否应用结果。');
        return;
      }
      const sourceLabel = job.source === 'generated'
        ? '真实生成'
        : job.source === 'hybrid'
          ? '混合生成'
          : '占位回退';
      pushToast('success', '配图已应用', `已应用 ${job.insertedCount} 张配图，当前结果为${sourceLabel}。`);
    } catch (error: any) {
      console.error('智能配图应用失败:', error);
      pushToast('error', '配图应用失败', error.message || '请稍后重试。');
    } finally {
      setIsApplyingIllustration(false);
    }
  };

  const handleLogout = () => {
    logout();
    setAuthUser(null);
    setPresets([]);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword) {
      pushToast('error', '修改密码失败', '请填写旧密码和新密码。');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      pushToast('error', '修改密码失败', '两次输入的新密码不一致。');
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(oldPassword, newPassword);
      pushToast('success', '密码已修改', '其他设备的登录状态已失效，本设备保持登录。');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      pushToast('error', '修改密码失败', error.message || '请稍后重试。');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleRefreshIllustrationJob = async () => {
    if (!lastIllustrationJob || import.meta.env.VITE_APP_MODE !== 'online') return;

    try {
      const nextJob = await getIllustrationJob(lastIllustrationJob.id);
      setLastIllustrationJob(nextJob);
    } catch (error) {
      console.error('刷新配图任务失败:', error);
    }
  };

  const handleApplyIllustrationResult = () => {
    if (!lastIllustrationJob?.resultMarkdown) return;

    setIsApplyingIllustrationResult(true);
    try {
      setMarkdown(lastIllustrationJob.resultMarkdown);
      pushToast('success', '结果已应用', `已将 ${lastIllustrationJob.insertedCount} 张配图写回正文。`);
    } finally {
      window.setTimeout(() => {
        setIsApplyingIllustrationResult(false);
      }, 160);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('openai_api_base', apiBaseUrl);
    localStorage.setItem('openai_model', apiModel);

    saveUploadMode(uploadMode);
    saveR2Config({
      workerUrl: r2WorkerUrl,
      uploadSecret: r2UploadSecret,
    });
    saveCdnConfig({
      uploadUrl: cdnUploadUrl,
      fieldName: cdnFieldName || 'file',
      headers: cdnHeaders,
      responsePath: cdnResponsePath || 'data.url',
    });

    setShowSettings(false);
  };

  const handleSelectPreviewTab = (tab: 'wechat' | 'xThread' | 'xArticle') => {
    if (tab === 'xThread') {
      setXThreadExport((current) => current || generateXThreadExport(markdown));
    }
    if (tab === 'xArticle') {
      setXArticleExport((current) => current || generateXArticleExport(markdown));
    }
    setPreviewTab(tab);
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <ToastStack items={toastItems} onDismiss={dismissToast} />

      <header className="z-20 flex h-14 flex-none items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <MonitorPlay className="h-5 w-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-gray-800">公众号排版系统</h1>
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
            <span className="mr-1 text-xs font-medium text-gray-400">主题</span>
            {Object.values(THEMES).map((theme) => (
              <button
                key={theme.id}
                onClick={() => setActiveTheme(theme)}
                className={`h-4 w-4 rounded-full ring-offset-1 transition-all ${
                  activeTheme.id === theme.id
                    ? 'scale-110 shadow-sm ring-2 ring-gray-400'
                    : 'opacity-70 hover:scale-110 hover:opacity-100'
                }`}
                style={{ background: theme.primary }}
                title={theme.name}
              />
            ))}
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
            <span className="mr-1 text-xs font-medium text-gray-400">版式</span>
            <select
              value={activeLayoutStyle.id}
              onChange={(event) => setActiveLayoutStyle(LAYOUT_STYLES[event.target.value])}
              className="cursor-pointer rounded-md border-none bg-gray-50 px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {Object.values(LAYOUT_STYLES).map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
            <span className="mr-1 text-xs font-medium text-gray-400">图片</span>
            <select
              value={activeImageStyle.id}
              onChange={(event) => setActiveImageStyle(IMAGE_STYLES[event.target.value])}
              className="cursor-pointer rounded-md border-none bg-gray-50 px-2 py-1 text-sm text-gray-700 outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {Object.values(IMAGE_STYLES).map((style) => (
                <option key={style.id} value={style.id}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 border-l border-gray-200 pl-4">
            <select
              className="w-36 cursor-pointer rounded-md border-none bg-gray-50 px-2 py-1 text-sm font-medium text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-500"
              defaultValue=""
              onChange={(event) => {
                handlePresetSelect(event.target.value);
                event.target.value = '';
              }}
            >
              <option value="">我的预设</option>
              {canUseCloudPresets ? (
                <>
                  <option value="save">保存当前组合...</option>
                  {presets.length > 0 && (
                    <optgroup label="已保存预设">
                      {[...presets].reverse().map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </>
              ) : isRealAuth ? (
                <option value="login">登录后使用云端预设</option>
              ) : (
                <option value="mock-disabled">OSS 调试模式不启用云端预设</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {authUser ? (
            <div className="mr-2 flex items-center space-x-2 rounded-full border border-gray-100 bg-gray-50 px-3 py-1">
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                {authUser.role.toUpperCase()}
              </span>
              <span className="text-sm font-medium text-gray-600">{authUser.email.split('@')[0]}</span>
              <button
                onClick={handleLogout}
                className="ml-1 text-gray-400 transition-colors hover:text-red-500"
                title="退出登录"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : isRealAuth ? (
            <button
              onClick={() => navigate('/login', { state: { from: '/' } })}
              className="mr-2 flex items-center space-x-1 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-100"
              title="登录或注册"
            >
              <UserIcon className="h-4 w-4" />
              <span>登录</span>
            </button>
          ) : null}

          <HeaderMenu
            label="AI 工具"
            icon={<Wand2 className="mr-1.5 h-4 w-4" />}
            buttonClassName="flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-1.5 text-sm font-medium text-amber-700 transition-colors hover:bg-amber-100"
            items={[
              {
                key: 'ai-typeset',
                label: isTypesetting ? 'AI 排版中...' : 'AI 一键排版',
                icon: <Wand2 className={`mr-2 h-4 w-4 text-amber-600 ${isTypesetting ? 'animate-spin' : ''}`} />,
                disabled: isTypesetting,
                onSelect: () => void handleAITypeset(),
              },
              {
                key: 'illustration-plan',
                label: isPlanningIllustration ? '分析配图中...' : '智能配图建议',
                icon: <ImagePlus className={`mr-2 h-4 w-4 text-sky-600 ${isPlanningIllustration ? 'animate-pulse' : ''}`} />,
                disabled: isPlanningIllustration,
                onSelect: () => void handleIllustrationPlan(),
              },
            ]}
          />

          <HeaderMenu
            label="更多导出"
            icon={<Share2 className="mr-1.5 h-4 w-4" />}
            buttonClassName="flex items-center rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
            items={[
              {
                key: 'copy-x-thread',
                label: '复制 X Thread',
                icon: <MessageSquareQuote className="mr-2 h-4 w-4 text-sky-600" />,
                onSelect: () => void handleCopyXThread(),
              },
              {
                key: 'copy-x-article',
                label: '复制 X Article',
                icon: <FileText className="mr-2 h-4 w-4 text-violet-600" />,
                onSelect: () => void handleCopyXArticle(),
              },
              {
                key: 'export-image',
                label: '导出图片',
                icon: <ImageDown className="mr-2 h-4 w-4 text-pink-600" />,
                onSelect: () => setShowImageExportPanel(true),
              },
            ]}
          />

          {!isOnlineMode && (
            <button
              onClick={() => setShowSettings(true)}
              className="rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              title="设置 API Key"
            >
              <Settings className="h-5 w-5" />
            </button>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center rounded-full bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700"
          >
            <Copy className="mr-1.5 h-4 w-4" />
            复制到公众号
          </button>
        </div>
      </header>

      <main className="flex flex-1 overflow-hidden">
        <section className="flex h-full w-1/2 flex-col border-r border-gray-200 bg-white">
          <div className="flex h-10 flex-none items-center justify-between border-b border-gray-200 bg-white px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <span>Markdown 输入</span>
            <button
              onClick={() => setShowCheatsheet(true)}
              className="flex items-center rounded-md bg-emerald-50 px-2.5 py-1 text-emerald-600 transition-colors hover:bg-emerald-100 hover:text-emerald-700"
            >
              <BookOpen className="mr-1 h-3.5 w-3.5" />
              语法参考
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <Editor
              value={markdown}
              onChange={setMarkdown}
              editorRef={editorRef}
              onScroll={handleEditorScroll}
            />
          </div>
        </section>

        <section className="flex h-full w-1/2 flex-col bg-gray-100">
          <div className="z-10 flex h-10 flex-none items-center justify-between border-b border-transparent bg-white px-4 shadow-sm">
            <div className="flex items-center gap-1">
              {([
                { key: 'wechat' as const, label: '公众号' },
                { key: 'xThread' as const, label: 'X Thread' },
                { key: 'xArticle' as const, label: 'X Article' },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => handleSelectPreviewTab(tab.key)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                    previewTab === tab.key
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            {previewTab === 'wechat' && (
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                宽度 677px
              </span>
            )}
          </div>

          {previewTab === 'wechat' ? (
            <div
              ref={previewScrollRef}
              onScroll={handlePreviewScroll}
              className="flex-1 overflow-auto p-4 md:p-8"
            >
              <div
                style={{ width: '677px', margin: '0 auto' }}
                className="min-h-[800px] flex-shrink-0 overflow-hidden rounded-xl bg-white shadow-xl outline outline-1 outline-gray-200/50"
              >
                <Preview
                  markdown={markdown}
                  theme={activeTheme}
                  layoutStyle={activeLayoutStyle}
                  imageStyle={activeImageStyle}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden">
              <PlatformExportPanel
                threadExport={xThreadExport}
                articleExport={xArticleExport}
                activePlatform={previewTab}
                onCopyThreadAll={() => {
                  if (!xThreadExport) return;
                  void copyPlainText(xThreadExport.combinedText, '复制成功', `X Thread 文案已复制，共 ${xThreadExport.posts.length} 条。`);
                }}
                onCopyThreadPost={(content, index) => {
                  void copyPlainText(content, '复制成功', `第 ${index} 条 Thread 已复制。`);
                }}
                onCopyArticleTitle={() => {
                  if (!xArticleExport) return;
                  void copyPlainText(xArticleExport.title, '复制成功', 'X Article 标题已复制。');
                }}
                onCopyArticleBody={() => {
                  if (!xArticleExport) return;
                  void copyRichText(
                    xArticleExport.bodyRichHtml,
                    xArticleExport.body,
                    '复制成功',
                    'X Article 正文已以富文本形式复制。',
                  );
                }}
                onCopyArticleAll={() => {
                  if (!xArticleExport) return;
                  void copyRichText(
                    xArticleExport.combinedHtml,
                    xArticleExport.combinedText,
                    '复制成功',
                    'X Article 全文已以富文本形式复制。',
                  );
                }}
                onCopyArticleCodeBlock={(content, language, index) => {
                  void copyPlainText(
                    content,
                    '复制成功',
                    `第 ${index} 段 ${language || 'text'} 代码已复制，可直接粘贴到 X 的“插入代码”块。`,
                  );
                }}
              />
            </div>
          )}
        </section>
      </main>

      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-md animate-in fade-in duration-200">
          <div className="m-4 w-[480px] max-w-full rounded-[20px] bg-white/95 p-8 shadow-2xl ring-1 ring-black/5 animate-in zoom-in-95 duration-200">
            <h3 className="mb-6 text-xl font-bold text-gray-900">系统设置</h3>

            {showDevIdentity && (
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">调试身份</label>
                <DevIdentitySwitcher value={devIdentityRole} onChange={handleDevIdentityChange} />
              </div>
            )}

            {canChangePassword && (
              <div className="mb-5">
                <label className="mb-1.5 block text-sm font-medium text-gray-700">修改密码</label>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(event) => setOldPassword(event.target.value)}
                    placeholder="旧密码"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="新密码（至少 8 位，需包含字母和数字）"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(event) => setConfirmNewPassword(event.target.value)}
                    placeholder="确认新密码"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleChangePassword}
                      disabled={isChangingPassword}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isChangingPassword ? '提交中…' : '确认修改'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-5 flex space-x-1 rounded-lg bg-gray-100 p-1">
              <button
                onClick={() => setSettingsTab('ai')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  settingsTab === 'ai'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                AI 排版
              </button>
              <button
                onClick={() => setSettingsTab('cdn')}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
                  settingsTab === 'cdn'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                图片上传
              </button>
            </div>

            {settingsTab === 'ai' && (
              <div className="mb-4 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">OpenAI 兼容 API Key</label>
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(event) => setApiKey(event.target.value)}
                    placeholder="sk-..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">接口地址（Base URL）</label>
                  <input
                    type="text"
                    value={apiBaseUrl}
                    onChange={(event) => setApiBaseUrl(event.target.value)}
                    placeholder="默认: https://api.openai.com/v1"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">模型名称（Model）</label>
                  <input
                    type="text"
                    value={apiModel}
                    onChange={(event) => setApiModel(event.target.value)}
                    placeholder="默认: gpt-4o"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {settingsTab === 'cdn' && (
              <div className="mb-4 space-y-3">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">上传模式</label>
                  <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                    {([
                      { key: 'r2' as UploadMode, label: 'Cloudflare R2' },
                      { key: 'custom' as UploadMode, label: '自定义 CDN' },
                      { key: 'base64' as UploadMode, label: 'Base64' },
                    ]).map((mode) => (
                      <button
                        key={mode.key}
                        onClick={() => setUploadMode(mode.key)}
                        className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                          uploadMode === mode.key
                            ? 'bg-white text-gray-800 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {mode.label}
                      </button>
                    ))}
                  </div>
                </div>

                {uploadMode === 'r2' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        Worker URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={r2WorkerUrl}
                        onChange={(event) => setR2WorkerUrl(event.target.value)}
                        placeholder="https://your-worker.workers.dev"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">Upload Secret</label>
                      <input
                        type="password"
                        value={r2UploadSecret}
                        onChange={(event) => setR2UploadSecret(event.target.value)}
                        placeholder="可选，用于兼容旧的 Secret 模式"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                {uploadMode === 'custom' && (
                  <>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">
                        上传接口 URL <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={cdnUploadUrl}
                        onChange={(event) => setCdnUploadUrl(event.target.value)}
                        placeholder="https://upload.example.com/v1/image"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">图片字段名</label>
                      <input
                        type="text"
                        value={cdnFieldName}
                        onChange={(event) => setCdnFieldName(event.target.value)}
                        placeholder="file"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">额外请求头（JSON）</label>
                      <input
                        type="text"
                        value={cdnHeaders}
                        onChange={(event) => setCdnHeaders(event.target.value)}
                        placeholder='{"Authorization":"Bearer xxx"}'
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700">URL 提取路径</label>
                      <input
                        type="text"
                        value={cdnResponsePath}
                        onChange={(event) => setCdnResponsePath(event.target.value)}
                        placeholder="data.url"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm outline-none transition-all focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </>
                )}

                {uploadMode === 'base64' && (
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs text-amber-700">
                      Base64 模式无需任何上传配置，但会显著增大文章体积。
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-all hover:bg-gray-100/80 hover:text-gray-900"
              >
                取消
              </button>
              <button
                onClick={saveSettings}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:bg-emerald-700 hover:shadow-lg"
              >
                保存设置
              </button>
            </div>
          </div>
        </div>
      )}

      {showCheatsheet && <CheatsheetModal onClose={() => setShowCheatsheet(false)} />}
      {showPresetNameModal && (
        <InputPromptModal
          title="保存云端预设"
          description="给当前主题、版式和图片风格组合起一个容易辨认的名字。"
          value={presetNameInput}
          placeholder="例如：科技蓝图 / 阅读版"
          confirmLabel="保存预设"
          isSubmitting={isSavingPreset}
          onChange={setPresetNameInput}
          onConfirm={handleConfirmSavePreset}
          onClose={() => {
            if (isSavingPreset) return;
            setShowPresetNameModal(false);
            setPresetNameInput('');
          }}
        />
      )}
      {illustrationPlan && (
        <IllustrationPlanModal
          plan={illustrationPlan}
          selectedIds={selectedIllustrationIds}
          isSubmitting={isApplyingIllustration}
          onToggle={handleToggleIllustrationItem}
          onConfirm={handleApplyIllustrationPlan}
          onClose={handleCloseIllustrationPlan}
        />
      )}
      {lastIllustrationJob && (
        <IllustrationJobPanel
          job={lastIllustrationJob}
          onRefresh={import.meta.env.VITE_APP_MODE === 'online' ? handleRefreshIllustrationJob : undefined}
          onApply={handleApplyIllustrationResult}
          isApplying={isApplyingIllustrationResult}
          onClose={() => setLastIllustrationJob(null)}
        />
      )}
      {showImageExportPanel && (
        <ImageExportPanel
          elementId="wechat-article-preview"
          markdown={markdown}
          onClose={() => setShowImageExportPanel(false)}
        />
      )}
    </div>
  );
}

export default TypesetterView;
