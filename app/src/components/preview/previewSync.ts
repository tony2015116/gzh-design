// 预览用 useDeferredValue 延迟渲染；复制和导出前要等 DOM 跟上最新正文，否则可能拿到上一版内容。
export const PREVIEW_PENDING_ATTR = 'data-preview-pending';

export async function waitForPreviewSettled(element: HTMLElement, timeoutMs = 2000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (element.hasAttribute(PREVIEW_PENDING_ATTR) && Date.now() < deadline) {
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  }
}
