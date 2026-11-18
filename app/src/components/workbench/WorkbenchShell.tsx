import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { BookOpen, Check, Maximize2, Minimize2, PenTool, Settings } from 'lucide-react';
import './workbench.css';

interface WorkbenchShellProps {
  children: ReactNode;
  toolbar: ReactNode;
  actions: ReactNode;
  draftState: 'saving' | 'saved' | 'error';
  onSettings: () => void;
  onHelp: () => void;
}

export function WorkbenchShell({ children, toolbar, actions, draftState, onSettings, onHelp }: WorkbenchShellProps) {
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
  const draftLabel = draftState === 'saving' ? '正在保存草稿' : draftState === 'saved' ? '草稿已保存到本机' : '草稿保存失败';
  return (
    <div className={`workbench-shell${focusMode ? ' is-focus-mode' : ''}`}>
      <div className="wb-content">
        <header className="wb-topbar">
          <div className="wb-breadcrumb"><PenTool size={18} /><strong>公众号工作台</strong></div>
          <div className="wb-top-tools">
            <button onClick={onHelp}><BookOpen size={15} /><span>使用指南</span></button>
            <button onClick={onSettings} aria-label="工作台设置"><Settings size={16} /><span>工作台设置</span></button>
          </div>
        </header>
        <div className="wb-workspace">
          <div className="wb-heading"><div><h1>文章排版</h1><p className="wb-subtitle">编辑 Markdown，实时预览公众号排版。</p></div><div className="wb-heading-right"><span className={`wb-draft-state ${draftState === 'error' ? 'is-error' : ''}`} role="status">{draftState === 'saved' ? <Check size={12} /> : <span className="wb-status-dot"></span>}{draftLabel}</span><div className="wb-actions">{actions}{focusMode && <button className="wb-focus-settings" onClick={onSettings} aria-label="工作台设置" title="工作台设置"><Settings size={15} /></button>}<button className="wb-focus-toggle" onClick={() => void (focusMode ? leaveFocus() : enterFocus())} disabled={focusBusy} aria-label={focusMode ? '退出专注全屏' : '进入专注全屏'} aria-pressed={focusMode} title={focusMode ? '退出专注全屏（Esc）' : '收起外围界面，进入专注全屏'}>{focusMode ? <Minimize2 size={15} /> : <Maximize2 size={15} />}<span>{focusMode ? '退出全屏' : '专注全屏'}</span>{focusMode && <kbd>Esc</kbd>}</button></div></div></div>
          {toolbar && <div className="wb-toolbar" aria-label="文章外观设置">{toolbar}</div>}
          {children}
        </div>
      </div>
    </div>
  );
}
