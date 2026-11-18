// 编辑器草稿的本地持久化，以及"被整篇覆盖前"的一份快照（用于撤销 AI 排版、导入覆盖、应用配图）。
// localStorage 可能不可用或写满（base64 图片很占空间），所有读写都要兜底。

import { draftKeys } from './draftScope';

export interface UndoSnapshot {
  label: string;
  markdown: string;
  savedAt: number;
}

export function loadDraft(): string | null {
  try {
    return localStorage.getItem(draftKeys().draft);
  } catch {
    return null;
  }
}

/** 返回是否写入成功；失败通常是存储配额已满 */
export function saveDraft(markdown: string): boolean {
  try {
    localStorage.setItem(draftKeys().draft, markdown);
    return true;
  } catch {
    return false;
  }
}

export function loadUndoSnapshot(): UndoSnapshot | null {
  try {
    const raw = localStorage.getItem(draftKeys().undo);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.markdown === 'string' && typeof parsed?.label === 'string' ? parsed : null;
  } catch {
    return null;
  }
}

export function saveUndoSnapshot(snapshot: UndoSnapshot | null): void {
  try {
    if (snapshot) {
      localStorage.setItem(draftKeys().undo, JSON.stringify(snapshot));
    } else {
      localStorage.removeItem(draftKeys().undo);
    }
  } catch {
    /* 存不下时快照只保留在内存里，刷新后不可撤销 */
  }
}
