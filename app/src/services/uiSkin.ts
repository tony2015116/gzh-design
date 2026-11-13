import { useSyncExternalStore } from 'react';

export type UiSkin = 'light' | 'dark';
const STORAGE_KEY = 'gzh_ui_skin';
const listeners = new Set<() => void>();
let activeSkin: UiSkin = 'light';

function storedSkin(): UiSkin {
  try { return localStorage.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}

function applySkin(skin: UiSkin) {
  activeSkin = skin;
  document.documentElement.dataset.appSkin = skin;
  listeners.forEach(listener => listener());
}

export function initializeUiSkin() {
  applySkin(storedSkin());
  window.addEventListener('storage', event => {
    if (event.key === STORAGE_KEY || event.key === null) applySkin(storedSkin());
  });
}

export function setUiSkin(skin: UiSkin) {
  applySkin(skin);
  try { localStorage.setItem(STORAGE_KEY, skin); }
  catch { /* The current page can still change skin when browser storage is unavailable. */ }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

export function useUiSkin() {
  return useSyncExternalStore(subscribe, () => activeSkin, () => 'light' as const);
}
