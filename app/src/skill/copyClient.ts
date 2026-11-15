// skill 产物页里的「复制到公众号」按钮逻辑，与网站复制走同一条管线。
// 由 `npm run build:skill` 打包成 IIFE，内联进产物 HTML。
import { buildWechatCopyRoot, copyWechatArticle } from '../core/wechatExport';

const PREVIEW_ID = 'wechat-article-preview';

async function copyArticle(button: HTMLButtonElement) {
  const element = document.getElementById(PREVIEW_ID);
  if (!element) return;

  const { root, issues } = buildWechatCopyRoot(element);
  if (issues.length > 0) console.warn('[公众号兼容检查]', issues);

  const method = await copyWechatArticle(root);
  const copied = method !== 'failed';

  const label = button.textContent;
  button.textContent = method === 'text' ? '已复制纯文本（无排版）' : copied ? '已复制 ✓ 去公众号粘贴' : '复制失败，请手动全选正文复制';
  button.classList.toggle('copied', copied);
  window.setTimeout(() => {
    button.textContent = label;
    button.classList.remove('copied');
  }, 2400);
}

document.querySelectorAll<HTMLButtonElement>('[data-copy-wechat]').forEach((button) => {
  button.addEventListener('click', () => { void copyArticle(button); });
});
