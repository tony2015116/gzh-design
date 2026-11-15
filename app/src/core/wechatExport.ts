// 公众号复制前的 DOM 预处理：网站「复制到公众号」和 skill 产物页共用这一份逻辑。
import {
  extractCssVariables,
  resolveCssVariables,
  toWechatCompatibleHtml,
  validateWechatHtml,
  type WechatIssue,
} from './wechatCompat';

const makeOpaqueColor = (foreground: string, background: string) => {
  const foregroundChannels = foreground.match(/[\d.]+/g)?.map(Number);
  const backgroundChannels = background.match(/[\d.]+/g)?.map(Number);

  if (!foregroundChannels || foregroundChannels.length < 3) return foreground;

  const alpha = foregroundChannels[3] ?? 1;
  if (alpha >= 1) {
    return `rgb(${Math.round(foregroundChannels[0])}, ${Math.round(foregroundChannels[1])}, ${Math.round(foregroundChannels[2])})`;
  }

  const base = backgroundChannels && backgroundChannels.length >= 3
    ? backgroundChannels
    : [255, 255, 255];
  const channels = [0, 1, 2].map((index) => (
    Math.round(foregroundChannels[index] * alpha + base[index] * (1 - alpha))
  ));

  return `rgb(${channels[0]}, ${channels[1]}, ${channels[2]})`;
};

const toHexColor = (color: string) => {
  const channels = color.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  if (!channels || channels.length < 3) return color;

  return `#${channels.map((channel) => (
    Math.max(0, Math.min(255, Math.round(channel))).toString(16).padStart(2, '0')
  )).join('')}`;
};

export const createWechatCopyRoot = (element: HTMLElement): HTMLElement => {
  const copyRoot = element.cloneNode(true) as HTMLElement;
  copyRoot.querySelectorAll<HTMLElement>('img[src], a[href]').forEach(node => {
    const attribute = node.tagName === 'IMG' ? 'src' : 'href';
    const value = node.getAttribute(attribute);
    if (!value || value.startsWith('#')) return;
    try { node.setAttribute(attribute, new URL(value, element.baseURI).href); } catch { /* Keep invalid sources visible for the compatibility check. */ }
  });
  const sourceScrollCards = Array.from(
    element.querySelectorAll<HTMLElement>('[data-scroll-card]'),
  );

  copyRoot.querySelectorAll<HTMLElement>('[data-scroll-card]').forEach((card, index) => {
    const sourceCard = sourceScrollCards[index];
    const isLongImageCard = card.hasAttribute('data-long-image-card');
    const sourceStyle = sourceCard ? getComputedStyle(sourceCard) : card.style;
    const backgroundColor = sourceStyle.backgroundColor || '#F8FAFC';
    const accentColor = sourceStyle.borderTopColor || '#059669';
    const sideColor = makeOpaqueColor(
      sourceStyle.borderRightColor || accentColor,
      backgroundColor,
    );
    const frame = document.createElement('table');
    const frameBody = document.createElement('tbody');
    const frameRow = document.createElement('tr');
    const frameCell = document.createElement('td');

    if (isLongImageCard) {
      const longImageFrame = document.createElement('section');
      const accentBar = document.createElement('section');
      const longImageContent = document.createElement('section');
      longImageFrame.setAttribute('data-long-image-card', 'true');
      longImageFrame.setAttribute('data-long-image-border-frame', 'true');
      accentBar.setAttribute('data-long-image-accent-bar', 'true');
      longImageContent.setAttribute('data-long-image-border-content', 'true');
      Object.assign(longImageFrame.style, {
        display: 'block',
        width: '100%',
        margin: sourceStyle.margin || '0 0 24px',
        padding: '0 1px 1px',
        backgroundColor: sideColor,
        borderRadius: sourceStyle.borderRadius || '12px',
        overflow: 'hidden',
        textAlign: 'center',
        boxSizing: 'border-box',
        visibility: 'visible',
      });
      Object.assign(accentBar.style, {
        display: 'block',
        height: '3px',
        margin: '0 -1px',
        padding: '0',
        backgroundColor: accentColor,
        fontSize: '0',
        lineHeight: '0',
        boxSizing: 'border-box',
        visibility: 'visible',
      });
      Object.assign(longImageContent.style, {
        display: 'block',
        width: '100%',
        margin: '0',
        padding: '0',
        backgroundColor,
        borderRadius: '0 0 11px 11px',
        overflow: 'hidden',
        boxSizing: 'border-box',
        visibility: 'visible',
      });
      longImageContent.append(...Array.from(card.childNodes));
      longImageFrame.append(accentBar, longImageContent);
      card.replaceWith(longImageFrame);
      return;
    }

    frame.setAttribute('width', '100%');
    frame.setAttribute('cellpadding', '0');
    frame.setAttribute('cellspacing', '0');
    frame.setAttribute('role', 'presentation');
    Object.assign(frame.style, {
      display: 'table',
      width: '100%',
      margin: sourceStyle.margin || '0 0 24px',
      padding: '0',
      border: '0',
      borderCollapse: 'separate',
      borderSpacing: '0',
      tableLayout: 'fixed',
    });
    Object.assign(frameCell.style, {
      margin: '0',
      padding: '0',
      backgroundColor,
      borderTop: `3px solid ${accentColor}`,
      borderRight: `1px solid ${sideColor}`,
      borderBottom: `1px solid ${sideColor}`,
      borderLeft: `1px solid ${sideColor}`,
      borderRadius: sourceStyle.borderRadius || '12px',
      overflow: 'hidden',
    });
    frameCell.setAttribute('bgcolor', toHexColor(backgroundColor));

    frameCell.append(...Array.from(card.childNodes));
    frameRow.appendChild(frameCell);
    frameBody.appendChild(frameRow);
    frame.appendChild(frameBody);
    card.replaceWith(frame);
  });

  copyRoot.querySelectorAll<HTMLElement>(
    '[data-long-image-card-body][data-scroll-card-copy-mode="expand"]',
  ).forEach((body) => {
    const defaultHint = body.parentElement?.querySelector<HTMLElement>(
      '[data-long-image-card-default-hint]',
    );
    if (defaultHint) defaultHint.textContent = '完整长图';
  });

  copyRoot.querySelectorAll<HTMLElement>('[data-scroll-card-title]').forEach((title) => {
    const titleText = title.querySelector<HTMLElement>('[data-scroll-card-title-text]');
    const hint = title.querySelector<HTMLElement>('[data-scroll-card-hint]');
    const hintText = hint?.textContent?.trim() || '';
    const longImageCard = title.closest<HTMLElement>('[data-long-image-card]');
    const exportedTitle = document.createElement('section');
    const exportedText = document.createElement('strong');

    Object.assign(exportedTitle.style, {
      display: 'block',
      margin: '0',
      padding: title.style.padding || '12px 16px 10px',
      color: title.style.color || '#0F172A',
      fontSize: title.style.fontSize || '14px',
      lineHeight: '1.5',
      letterSpacing: title.style.letterSpacing || '0.5px',
    });
    Object.assign(exportedText.style, {
      display: 'inline',
      margin: '0',
      padding: '0',
      color: 'inherit',
      fontSize: 'inherit',
      lineHeight: 'inherit',
      fontWeight: title.style.fontWeight || '700',
      letterSpacing: 'inherit',
    });
    exportedText.textContent = titleText?.textContent?.trim() || title.textContent?.trim() || '';
    exportedTitle.appendChild(exportedText);

    if (hintText && !longImageCard) {
      const exportedHint = document.createElement('strong');
      Object.assign(exportedHint.style, {
        display: 'inline',
        float: 'right',
        margin: '0 0 0 12px',
        padding: '0',
        color: hint?.style.color || '#059669',
        fontSize: '11px',
        lineHeight: '1.9',
        fontWeight: hint?.style.fontWeight || '600',
        letterSpacing: hint?.style.letterSpacing || '0.5px',
        textAlign: 'right',
        whiteSpace: 'nowrap',
      });
      exportedHint.textContent = hintText;
      exportedTitle.appendChild(exportedHint);
    }

    title.replaceWith(exportedTitle);

    if (hintText && longImageCard) {
      const body = longImageCard.querySelector<HTMLElement>('[data-long-image-card-body]');
      const exportedHint = document.createElement('p');
      const exportedHintText = document.createElement('span');

      Object.assign(exportedHint.style, {
        margin: '0 8px',
        padding: '0',
        textAlign: 'center',
        whiteSpace: 'normal',
        lineHeight: '1.75',
        boxSizing: 'border-box',
        visibility: 'visible',
      });
      Object.assign(exportedHintText.style, {
        color: '#A0A0A0',
        fontSize: '14px',
        lineHeight: '1.75',
        letterSpacing: '1px',
        visibility: 'visible',
      });
      exportedHintText.textContent = `（↕️${hintText}）`;
      exportedHint.appendChild(exportedHintText);
      body?.insertAdjacentElement('afterend', exportedHint);
    }
  });

  copyRoot.querySelectorAll<HTMLElement>('[data-scroll-card-body]').forEach((body) => {
    const isLongImageBody = body.hasAttribute('data-long-image-card-body');

    if (body.dataset.scrollCardCopyMode === 'expand') {
      body.style.maxHeight = 'none';
      body.style.height = 'auto';
      body.style.overflow = 'visible';
      body.style.overflowY = 'visible';
      body.style.overflowX = 'visible';
      body.style.overscrollBehavior = 'auto';
    } else if (body.style.maxHeight && isLongImageBody) {
      const scrollHeight = body.style.maxHeight;
      const inner = document.createElement('section');
      Object.assign(inner.style, {
        display: 'block',
        width: '100%',
        margin: '0',
        padding: '0',
        overflow: 'hidden',
        boxSizing: 'border-box',
        visibility: 'visible',
      });
      inner.append(...Array.from(body.childNodes));
      body.appendChild(inner);
      body.style.display = 'inline-block';
      body.style.verticalAlign = 'top';
      body.style.width = '100%';
      body.style.height = scrollHeight;
      body.style.maxHeight = '';
      body.style.overflow = '';
      body.style.overflowX = 'hidden';
      body.style.overflowY = 'auto';
      body.style.boxSizing = 'border-box';
      body.style.visibility = 'visible';
      body.style.setProperty('-webkit-overflow-scrolling', 'touch');
    } else if (body.style.maxHeight) {
      // Match the section based structure used by existing WeChat formatters.
      const scrollHeight = body.style.maxHeight;
      body.style.height = '';
      body.style.maxHeight = scrollHeight;
      body.style.overflow = '';
      body.style.overflowX = '';
      body.style.overflowY = 'auto';
      body.style.setProperty('-webkit-overflow-scrolling', 'touch');
    }

    if (isLongImageBody) {
      body.style.removeProperty('touch-action');
      body.style.removeProperty('user-select');
      body.style.removeProperty('-webkit-user-select');

      body.querySelectorAll<HTMLImageElement>('img').forEach((image) => {
        image.setAttribute('draggable', 'false');
        image.style.removeProperty('pointer-events');
        image.style.removeProperty('user-select');
        image.style.removeProperty('-webkit-user-select');
        image.style.removeProperty('-webkit-user-drag');
      });
    }

    body.removeAttribute('data-scroll-card-body');
    body.removeAttribute('data-scroll-card-copy-mode');
  });

  return copyRoot;
};

// 根节点上只有这些样式需要带进公众号（其余如 min-height、max-width 是预览壳子用的）
const ARTICLE_STYLE_PROPS = ['background', 'font-family', 'color', 'line-height', 'letter-spacing', 'padding'];

/** 把预览根节点的排版底色、字体等提取成正文外层 section 的样式 */
export const pickArticleStyle = (rootStyle: string, cssVariables: Record<string, string>) => resolveCssVariables(
  rootStyle
    .split(';')
    .filter((declaration) => ARTICLE_STYLE_PROPS.includes(declaration.split(':')[0].trim().toLowerCase()))
    .join(';'),
  cssVariables,
);

/**
 * 生成最终粘贴进公众号的节点：DOM 预处理 + 兼容规整（展开 CSS 变量、leaf 包裹等），
 * 内容外包一层带底色和字体的 section，深色版式粘贴后不会丢背景。
 */
export const buildWechatCopyRoot = (element: HTMLElement): { root: HTMLElement; issues: WechatIssue[] } => {
  const copyRoot = createWechatCopyRoot(element);
  const rootStyle = element.getAttribute('style') || '';
  const cssVariables = extractCssVariables(rootStyle);
  const articleStyle = pickArticleStyle(rootStyle, cssVariables);
  const html = toWechatCompatibleHtml(`<section style="${articleStyle.replace(/"/g, '&quot;')}">${copyRoot.innerHTML}</section>`, { cssVariables });
  copyRoot.innerHTML = html;
  const issues = validateWechatHtml(html);
  const localImages = [...copyRoot.querySelectorAll<HTMLImageElement>('img')].filter(image => {
    try {
      const url = new URL(image.src);
      return ['blob:', 'file:'].includes(url.protocol)
        || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
        || /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(url.hostname);
    } catch { return true; }
  });
  if (localImages.length) issues.push({
    level: 'warning', rule: 'local-image-source',
    message: `有${localImages.length}张图片使用本机或临时地址，粘贴到其他平台后可能无法访问，请先上传可访问的图床。`,
  });
  const failedImages = [...element.querySelectorAll<HTMLImageElement>('img')]
    .filter(image => image.hasAttribute('src') && image.complete && image.naturalWidth === 0);
  if (failedImages.length) issues.push({
    level: 'warning', rule: 'failed-image-source',
    message: `预览中有${failedImages.length}张图片加载失败，请检查图片链接或重新上传后再粘贴。`,
  });
  return { root: copyRoot, issues };
};

/** Read rendered text without writing to the operating-system clipboard. */
export function getWechatPlainText(root: HTMLElement): string {
  const host = document.createElement('div');
  host.setAttribute('aria-hidden', 'true');
  Object.assign(host.style, { position: 'fixed', left: '-10000px', top: '0', width: '677px', opacity: '0', pointerEvents: 'none' });
  const content = root.cloneNode(true) as HTMLElement;
  content.removeAttribute('id');
  Object.assign(content.style, { position: 'static', opacity: '1', visibility: 'visible' });
  host.append(content);
  document.body.append(host);
  try { return content.innerText; } finally { host.remove(); }
}

export type WechatCopyMethod = 'selection' | 'html' | 'text' | 'failed';
export async function copyWechatArticle(root: HTMLElement): Promise<WechatCopyMethod> {
  if (copyWechatHtmlBySelection(root)) return 'selection';
  const plain = getWechatPlainText(root);
  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([root.innerHTML], { type: 'text/html' }),
        'text/plain': new Blob([plain], { type: 'text/plain' }),
      })]);
      return 'html';
    } catch { /* Use an explicitly labelled plain-text fallback. */ }
  }
  try {
    await navigator.clipboard.writeText(plain);
    return 'text';
  } catch { return 'failed'; }
}

/** 用选区 + execCommand 复制：浏览器会按渲染结果生成富文本，公众号粘贴最稳 */
export const copyWechatHtmlBySelection = (copyRoot: HTMLElement) => {
  const selection = window.getSelection();
  if (!selection) return false;

  const previousRanges = Array.from(
    { length: selection.rangeCount },
    (_, index) => selection.getRangeAt(index).cloneRange(),
  );

  copyRoot.removeAttribute('id');
  copyRoot.setAttribute('aria-hidden', 'true');
  Object.assign(copyRoot.style, {
    position: 'fixed',
    left: '0',
    top: '0',
    width: '677px',
    opacity: '0.01',
    pointerEvents: 'none',
    zIndex: '-1',
    visibility: 'visible',
  });
  document.body.appendChild(copyRoot);

  try {
    const range = document.createRange();
    range.selectNodeContents(copyRoot);
    selection.removeAllRanges();
    selection.addRange(range);
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    selection.removeAllRanges();
    previousRanges.forEach((range) => selection.addRange(range));
    copyRoot.remove();
  }
};
