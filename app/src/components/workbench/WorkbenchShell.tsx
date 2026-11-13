import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Bookmark, Check, CircleHelp, FileText, FolderOpen, LogOut, Maximize2, Menu, Minimize2, MonitorPlay, PenTool, Radar, Settings, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HeaderMenu } from '../ui/HeaderMenu';
import './workbench.css';

interface WorkbenchShellProps {
  children: ReactNode;
  toolbar: ReactNode;
  actions: ReactNode;
  userName?: string;
  userRole?: string;
  realAuth: boolean;
  draftState: 'saving' | 'saved' | 'error';
  onLogin: () => void;
  onLogout: () => void;
  onSettings: () => void;
  onConsole: () => void;
  onHelp: () => void;
  onVideo: () => void;
}

export function WorkbenchShell({ children, toolbar, actions, userName, userRole, realAuth, draftState, onLogin, onLogout, onSettings, onConsole, onHelp, onVideo }: WorkbenchShellProps) {

  const [roadmapOpen, setRoadmapOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [focusBusy, setFocusBusy] = useState(false);
  const focusRequestedRef = useRef(false);
  const ownsFullscreenRef = useRef(false);
  const leaveFocus = useCallback(async () => {
    focusRequestedRef.current = false;
    if (ownsFullscreenRef.current && document.fullscreenElement === document.documentElement) {
      try { await document.exitFullscreen(); }
      catch { if (document.fullscreenElement === document.documentElement) { focusRequestedRef.current = true; return; } }
    }
    setFocusMode(false);
  }, []);
  const enterFocus = async () => {
    focusRequestedRef.current = true;
    setFocusMode(true);
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      setFocusBusy(true);
      ownsFullscreenRef.current = true;
      try {
        // Keep sibling export, AI and notification layers inside the native fullscreen root.
        await document.documentElement.requestFullscreen();
        if (!focusRequestedRef.current && document.fullscreenElement === document.documentElement) await document.exitFullscreen();
      } catch {
        ownsFullscreenRef.current = false;
        // The page-level focus layout also works when native fullscreen is unavailable.
      } finally { setFocusBusy(false); }
    }
  };
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (ownsFullscreenRef.current && document.fullscreenElement !== document.documentElement) {
        ownsFullscreenRef.current = false;
        focusRequestedRef.current = false;
        setFocusMode(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || !focusRequestedRef.current) return;
      if (document.querySelector('dialog[open], .wb-control-popover, .wb-actions [aria-expanded="true"]')) return;
      void leaveFocus();
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleEscape);
      focusRequestedRef.current = false;
      if (ownsFullscreenRef.current && document.fullscreenElement === document.documentElement) void document.exitFullscreen().catch(() => undefined);
    };
  }, [leaveFocus]);
  useEffect(() => { if (roadmapOpen) dialogRef.current?.showModal(); }, [roadmapOpen]);
  const openRoadmap = () => setRoadmapOpen(true);
  const draftLabel = draftState === 'saving' ? '正在保存草稿' : draftState === 'saved' ? '草稿已保存到本机' : '草稿保存失败';
  return (
    <div className={`workbench-shell${focusMode ? ' is-focus-mode' : ''}`}>
      <aside className="wb-sidebar" aria-label="工作台导航">
        <Link className="wb-brand" to="/" aria-label="公众号工作台首页"><span className="wb-brand-mark"><PenTool size={21} /></span><span><strong>公众号工作台</strong><small>CREATOR WORKSPACE</small></span></Link>
        <p className="wb-nav-label">创作空间</p>
        <Link to="/" className="wb-nav-item is-active" aria-current="page"><FileText size={18} /><span>文章排版</span><small className="wb-tag green">一期</small></Link>
        <button className="wb-nav-item" disabled title="文章管理稍后提供，当前正文会自动保存到本机"><FolderOpen size={18} /><span>我的文章</span><small className="wb-tag">规划中</small></button>
        <p className="wb-nav-label wb-nav-section">选题与灵感</p>
        <button className="wb-nav-item" onClick={openRoadmap} aria-label="爆文发现，二期规划"><Radar size={18} /><span>爆文发现</span><small className="wb-tag">二期</small></button>
        <button className="wb-nav-item" onClick={openRoadmap}><Bookmark size={18} /><span>我的选题</span><small className="wb-tag">规划中</small></button>
        <p className="wb-nav-label wb-nav-section">更多工具</p>
        <button className="wb-nav-item" onClick={onVideo}><MonitorPlay size={18} /><span>视频对比</span></button>
        <div className="wb-sidebar-bottom">
          <div className="wb-phase"><small>当前上线重点</small><strong>先把每一篇文章排好</strong><p>一期聚焦排版、预览与复制。<br />选题发现作为二期扩展。</p><span className="wb-phase-line"></span><footer><span>排版与导出</span><span>PHASE 01</span></footer></div>
          <button className="wb-nav-item" onClick={onSettings} aria-label="工作台设置"><Settings size={18} /><span>工作台设置</span></button>
          <button className="wb-nav-item" onClick={onConsole}><CircleHelp size={18} /><span>配置与诊断</span></button>
          <div className="wb-account"><span className="wb-avatar">{userName?.slice(0, 1).toUpperCase() || 'L'}</span><div><strong>{userName || (realAuth ? '访客工作台' : '本地工作台')}</strong><small>{userRole ? `${userRole.toUpperCase()} · 个人创作空间` : '登录后同步云端预设'}</small></div>{userName ? <button onClick={onLogout} aria-label="退出登录" title="退出登录"><LogOut size={16} /></button> : realAuth && <button onClick={onLogin}>登录</button>}</div>
        </div>
      </aside>
      <div className="wb-content">
        <header className="wb-topbar"><div className="wb-breadcrumb"><span className="wb-mobile-brand"><PenTool size={18} />公众号工作台</span><span className="wb-desktop-crumb">创作空间</span><span className="wb-divider">/</span><strong>文章排版</strong></div><div className="wb-top-tools"><button onClick={onHelp}><BookOpen size={15} /><span>使用指南</span></button><button className="wb-mobile-settings" onClick={onSettings} aria-label="工作台设置"><Settings size={18} /></button><div className="wb-mobile-navigation"><HeaderMenu label="导航" icon={<Menu size={16} />} buttonClassName="wb-mobile-menu-button" items={[
          { key: 'video', label: '视频对比', icon: <MonitorPlay size={15} className="mr-2" />, onSelect: onVideo },
          { key: 'console', label: '配置与诊断', icon: <Settings size={15} className="mr-2" />, onSelect: onConsole },
          { key: 'roadmap', label: '爆文发现 · 二期规划', icon: <Radar size={15} className="mr-2" />, onSelect: openRoadmap },
          ...(userName ? [{ key: 'logout', label: '退出登录', icon: <LogOut size={15} className="mr-2" />, onSelect: onLogout }] : []),
        ]} /></div>{realAuth && !userName && <button className="wb-login" onClick={onLogin}>登录 / 注册</button>}<span className="wb-top-role">{userName || (realAuth ? '访客' : '本地模式')}</span></div></header>
        <div className="wb-workspace">
          <div className="wb-heading"><div><p className="wb-eyebrow">WRITE WITH CLARITY</p><h1>把内容写好，把样子交给这里。</h1><p className="wb-subtitle">专注写作，实时预览，复制到公众号。</p></div><div className="wb-heading-right"><span className={`wb-draft-state ${draftState === 'error' ? 'is-error' : ''}`} role="status">{draftState === 'saved' ? <Check size={12} /> : <span className="wb-status-dot"></span>}{draftLabel}</span><div className="wb-actions">{actions}{focusMode && <button className="wb-focus-settings" onClick={onSettings} aria-label="工作台设置" title="工作台设置"><Settings size={15} /></button>}<button className="wb-focus-toggle" onClick={() => void (focusMode ? leaveFocus() : enterFocus())} disabled={focusBusy} aria-label={focusMode ? '退出专注全屏' : '进入专注全屏'} aria-pressed={focusMode} title={focusMode ? '退出专注全屏（Esc）' : '收起外围界面，进入专注全屏'}>{focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}<span>{focusMode ? '退出全屏' : '专注全屏'}</span>{focusMode && <kbd>Esc</kbd>}</button></div></div></div>
          <div className="wb-toolbar" aria-label="文章外观设置">{toolbar}</div>
          {children}
          <div className="wb-next"><span><strong>下一步，让好选题也来到这里。</strong> <span className="wb-next-description">二期计划接入爆文发现，让选题与写作衔接。</span></span><button onClick={openRoadmap}>了解二期规划 <ArrowRight size={13} /></button></div>
        </div>
      </div>
      {roadmapOpen && <dialog ref={dialogRef} className="wb-roadmap" aria-labelledby="roadmap-title" onClose={() => setRoadmapOpen(false)} onClick={event => { if (event.target === event.currentTarget) dialogRef.current?.close(); }}><div className="wb-roadmap-body"><header><span className="wb-tag green">二期规划</span><button onClick={() => dialogRef.current?.close()} aria-label="关闭二期规划"><X size={20} /></button></header><Radar size={32} className="wb-roadmap-icon" /><h2 id="roadmap-title">先把文章排好，再发现下一篇。</h2><p>爆文发现与我的选题将在后续接入。当前版本聚焦文章编辑、排版、预览与导出。</p><div className="wb-roadmap-flow"><span>发现文章</span><ArrowRight size={13} /><span>原创简报</span><ArrowRight size={13} /><span>进入排版</span></div><p className="wb-roadmap-note">后续接入次幂数据。粉丝数和账号阅读基线尚需补充，暂不提供低粉或爆发倍率判断。</p><button className="wb-roadmap-close" onClick={() => dialogRef.current?.close()}>继续排版</button></div></dialog>}
    </div>
  );
}
