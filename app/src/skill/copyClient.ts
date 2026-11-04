// skill 产物页里的「复制到公众号」按钮逻辑，与网站复制走同一条管线。
// 由 `npm run build:skill` 打包成 IIFE，内联进产物 HTML。
import { buildWechatCopyRoot, copyWechatHtmlBySelection } from '../core/wechatExport';

const PREVIEW_ID = 'wechat-article-preview';

async function copyArticle(button: HTMLButtonElement) {
  const element = document.getElementById(PREVIEW_ID);
  if (!element) return;

  const { root, issues } = buildWechatCopyRoot(element);
  if (issues.length > 0) console.warn('[公众号兼容检查]', issues);

  let copied = copyWechatHtmlBySelection(root);
  if (!copied && typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      const html = root.innerHTML.replace(/[\r\n]/g, '');
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([root.innerText], { type: 'text/plain' }),
        }),
      ]);
      copied = true;
    } catch {
      copied = false;
    }
  }

  const label = button.textContent;
  button.textContent = copied ? '已复制 ✓ 去公众号粘贴' : '复制失败，请手动全选正文复制';
  button.classList.toggle('copied', copied);
  window.setTimeout(() => {
    button.textContent = label;
    button.classList.remove('copied');
  }, 2400);
}

document.querySelectorAll<HTMLButtonElement>('[data-copy-wechat]').forEach((button) => {
  button.addEventListener('click', () => { void copyArticle(button); });
});
