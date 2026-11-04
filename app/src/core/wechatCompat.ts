// 公众号编辑器兼容层：把预览 HTML 规整成粘贴后不丢样式的形态，并给出合规检查。
// 纯字符串实现，不依赖 DOM —— 网站复制、skill 渲染脚本（Node）共用。

export type WechatIssueLevel = 'error' | 'warning';

export interface WechatIssue {
  level: WechatIssueLevel;
  rule: string;
  message: string;
  sample?: string;
}

const VOID_TAGS = new Set(['br', 'img', 'hr', 'input', 'meta', 'link', 'col', 'wbr']);
const KEPT_ATTRS = new Set([
  'style', 'src', 'alt', 'href', 'leaf',
  'width', 'height', 'cellpadding', 'cellspacing', 'bgcolor', 'border', 'colspan', 'rowspan',
]);
// strong 上带这些样式时，微信会把 strong 的样式"纠正"掉，需要挪到外层 span
const STRONG_BOX_STYLE = /(^|;)\s*(background|border|padding|font-size|font-family|border-radius|box-shadow)[\w-]*\s*:/i;

type Token =
  | { kind: 'open'; name: string; attrs: Array<[string, string | null]>; selfClosing: boolean }
  | { kind: 'close'; name: string }
  | { kind: 'text'; text: string }
  | { kind: 'other'; raw: string };

const TOKEN_REGEX = /<!--[\s\S]*?-->|<![^>]*>|<\/?[a-zA-Z][^>]*>|[^<]+|</g;
const ATTR_REGEX = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function tokenize(html: string): Token[] {
  const tokens: Token[] = [];
  for (const match of html.matchAll(TOKEN_REGEX)) {
    const raw = match[0];
    if (raw.startsWith('<!')) {
      tokens.push({ kind: 'other', raw });
    } else if (raw.startsWith('</')) {
      tokens.push({ kind: 'close', name: raw.slice(2, -1).trim().toLowerCase() });
    } else if (raw.startsWith('<') && raw.length > 1) {
      const body = raw.slice(1, -1);
      const nameMatch = body.match(/^[a-zA-Z][\w-]*/);
      const name = (nameMatch?.[0] || '').toLowerCase();
      const attrText = body.slice(name.length).replace(/\/\s*$/, '');
      const attrs: Array<[string, string | null]> = [];
      for (const attr of attrText.matchAll(ATTR_REGEX)) {
        const value = attr[2] ?? attr[3] ?? attr[4];
        attrs.push([attr[1].toLowerCase(), value === undefined ? null : value]);
      }
      tokens.push({ kind: 'open', name, attrs, selfClosing: /\/\s*>$/.test(raw) || VOID_TAGS.has(name) });
    } else {
      tokens.push({ kind: 'text', text: raw });
    }
  }
  return tokens;
}

const escapeAttr = (value: string) => value.replace(/&(?!(#\d+|#x[\da-f]+|\w+);)/gi, '&amp;').replace(/"/g, '&quot;');

function serializeOpen(name: string, attrs: Array<[string, string | null]>, selfClosing: boolean) {
  const attrText = attrs
    .map(([key, value]) => (value === null || (key === 'leaf' && value === '') ? ` ${key}${key === 'leaf' ? '=""' : ''}` : ` ${key}="${escapeAttr(value)}"`))
    .join('');
  return `<${name}${attrText}${selfClosing && !VOID_TAGS.has(name) ? '></' + name : ''}>`;
}

const decodeAttr = (value: string) => value.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

/** 把 style 里的 var(--x, fallback) 换成具体值，并去掉自定义属性声明 */
export function resolveCssVariables(style: string, variables: Record<string, string>): string {
  let resolved = style;
  // 嵌套 var 逐层展开，最多 5 层防死循环
  for (let depth = 0; depth < 5 && /var\(\s*--/.test(resolved); depth++) {
    resolved = resolved.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*(?:\([^()]*\)[^()]*)*))?\)/g, (_, name: string, fallback?: string) => (
      variables[name] ?? (fallback !== undefined ? fallback.trim() : '')
    ));
  }
  return resolved
    .split(';')
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration && !declaration.startsWith('--') && !/:\s*$/.test(declaration))
    .join('; ');
}

/** 从 style 字符串里取出 CSS 自定义属性（--x: value） */
export function extractCssVariables(style: string): Record<string, string> {
  const variables: Record<string, string> = {};
  for (const declaration of style.split(';')) {
    const index = declaration.indexOf(':');
    if (index < 0) continue;
    const key = declaration.slice(0, index).trim();
    if (key.startsWith('--')) variables[key] = declaration.slice(index + 1).trim();
  }
  return variables;
}

const pickDeclarations = (style: string, props: string[]) => style
  .split(';')
  .map((declaration) => declaration.trim())
  .filter((declaration) => props.some((prop) => declaration.toLowerCase().startsWith(`${prop}:`)))
  .join('; ');

const appendStyle = (style: string, extra: string) => (style.trim() ? `${style.replace(/;\s*$/, '')}; ${extra}` : extra);

export interface WechatCompatOptions {
  /** 预览根节点上的 CSS 变量；不传则 var() 退回 fallback */
  cssVariables?: Record<string, string>;
}

/**
 * 规整成公众号兼容 HTML：
 * - div → section；去掉 class / id / data-* 等会被剥离的属性
 * - 展开 CSS 变量
 * - 文字节点包 <span leaf="">，空装饰元素塞占位，避免粘贴后样式被丢
 * - 带底色/边框的 strong 把盒样式挪到外层 span
 */
export function toWechatCompatibleHtml(html: string, options: WechatCompatOptions = {}): string {
  const variables = options.cssVariables || {};
  const tokens = tokenize(html);
  const out: string[] = [];
  // 每层记录：输出时用的标签名、是否 leaf、闭合时需要追加的尾巴
  const stack: Array<{ name: string; outName: string; leaf: boolean; closeSuffix: string }> = [];
  const leafDepth = () => stack.filter((frame) => frame.leaf).length;

  tokens.forEach((token, index) => {
    if (token.kind === 'other') return;

    if (token.kind === 'text') {
      const parent = stack[stack.length - 1]?.name;
      if (parent === 'style' || parent === 'script') return;
      if (!token.text.trim()) {
        // 块之间的换行缩进丢掉；行内的单个空格保留
        if (/\n/.test(token.text)) return;
        out.push(leafDepth() > 0 ? token.text : `<span leaf="">${token.text}</span>`);
        return;
      }
      out.push(leafDepth() > 0 ? token.text : `<span leaf="">${token.text}</span>`);
      return;
    }

    if (token.kind === 'close') {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name !== token.name) continue;
        const closed = stack.splice(i);
        closed.reverse().forEach((frame) => out.push(`</${frame.outName}>${frame.closeSuffix}`));
        break;
      }
      return;
    }

    const { name } = token;
    if (name === 'style' || name === 'script') {
      if (!token.selfClosing) stack.push({ name, outName: name, leaf: false, closeSuffix: '' });
      out.push('');
      return;
    }

    const outName = name === 'div' ? 'section' : name;
    const isLeaf = name === 'span' && token.attrs.some(([key]) => key === 'leaf');
    let style = '';
    const attrs: Array<[string, string | null]> = [];
    token.attrs.forEach(([key, value]) => {
      if (key === 'style') style = resolveCssVariables(decodeAttr(value || ''), variables);
      else if (KEPT_ATTRS.has(key)) attrs.push([key, value]);
    });

    const next = tokens[index + 1];
    const isEmpty = !token.selfClosing && next?.kind === 'close' && next.name === name;

    if (name === 'strong' && STRONG_BOX_STYLE.test(style) && !token.selfClosing) {
      const textStyle = pickDeclarations(style, ['font-weight', 'color']);
      out.push(`<span style="${escapeAttr(style)}">`);
      out.push(serializeOpen('strong', textStyle ? [['style', textStyle]] : [], false));
      stack.push({ name, outName: 'strong', leaf: false, closeSuffix: '</span>' });
      return;
    }

    if (isEmpty && style && (outName === 'section' || outName === 'span' || outName === 'p')) {
      // 空的装饰元素（圆点、短横、色条）会被编辑器当空节点删掉，塞一个零高占位
      style = appendStyle(style, 'font-size: 0; line-height: 0');
      out.push(serializeOpen(outName, [['style', style], ...attrs], false));
      out.push('<span leaf=""><br></span>');
      stack.push({ name, outName, leaf: false, closeSuffix: '' });
      return;
    }

    const finalAttrs: Array<[string, string | null]> = style ? [['style', style], ...attrs] : attrs;
    out.push(serializeOpen(outName, finalAttrs, token.selfClosing));
    if (!token.selfClosing) stack.push({ name, outName, leaf: isLeaf, closeSuffix: '' });
  });

  stack.reverse().forEach((frame) => out.push(`</${frame.outName}>${frame.closeSuffix}`));
  return out.join('');
}

const CJK = /[㐀-䶿一-鿿]/;
const HALF_WIDTH_AFTER_CJK = /[㐀-䶿一-鿿][,;!?:]/;
const CODE_STYLE = /monospace|courier|consolas|menlo|white-space\s*:\s*pre/i;

const RAW_RULES: Array<{ level: WechatIssueLevel; rule: string; regex: RegExp; message: string }> = [
  { level: 'error', rule: 'no-style-tag', regex: /<style[\s>]/i, message: '<style> 会被公众号过滤，样式必须内联' },
  { level: 'error', rule: 'no-script', regex: /<script[\s>]/i, message: '<script> 会被公众号过滤' },
  { level: 'error', rule: 'no-link', regex: /<link[\s>]/i, message: '外部 <link>（样式表/字体）会被过滤' },
  { level: 'error', rule: 'no-div', regex: /<\/?div[\s>]/i, message: '<div> 会被编辑器改写，用 <section>' },
  { level: 'error', rule: 'no-class-id', regex: /\s(class|id)\s*=/i, message: 'class / id 会被剥离，样式要写在 style 里' },
  { level: 'error', rule: 'no-css-var', regex: /var\(\s*--/i, message: 'CSS 变量不被支持，需要写成具体值' },
  { level: 'error', rule: 'no-position', regex: /position\s*:\s*(fixed|absolute|sticky)/i, message: 'position fixed/absolute/sticky 会失效' },
  { level: 'error', rule: 'no-at-rule', regex: /@(media|keyframes|import|font-face)/i, message: '@ 规则（媒体查询/动画/外部字体）不被支持' },
  { level: 'error', rule: 'no-grid', regex: /display\s*:\s*grid/i, message: 'display:grid 不被支持，用 flex 或表格' },
  { level: 'warning', rule: 'float', regex: /float\s*:\s*(left|right)/i, message: 'float 在公众号里表现不稳定' },
  { level: 'warning', rule: 'gradient-background', regex: /background(-image)?\s*:[^;"]*gradient\(/i, message: '渐变背景可能触发公众号深色模式检测（darkmode-no-gradient），文字底色建议用纯色' },
  { level: 'warning', rule: 'white-space-pre', regex: /white-space\s*:\s*pre/i, message: 'white-space:pre 会把源码缩进和换行原样渲染成大块空白' },
];

/** 合规检查：对 toWechatCompatibleHtml 的产物跑，ERROR 表示粘贴后大概率出问题 */
export function validateWechatHtml(html: string): WechatIssue[] {
  const issues: WechatIssue[] = [];

  RAW_RULES.forEach(({ level, rule, regex, message }) => {
    const global = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : `${regex.flags}g`);
    const hits = [...html.matchAll(global)];
    if (hits.length === 0) return;
    const sample = html.slice(Math.max(0, hits[0].index! - 30), hits[0].index! + 50).replace(/\s+/g, ' ');
    issues.push({ level, rule, message: `${message}（${hits.length} 处）`, sample });
  });

  const stack: Array<{ name: string; leaf: boolean; code: boolean }> = [];
  let unwrapped = 0;
  let unwrappedSample = '';
  let halfWidth = 0;
  let halfWidthSample = '';

  tokenize(html).forEach((token) => {
    if (token.kind === 'open' && !token.selfClosing) {
      const style = token.attrs.find(([key]) => key === 'style')?.[1] || '';
      stack.push({
        name: token.name,
        leaf: token.name === 'span' && token.attrs.some(([key]) => key === 'leaf'),
        code: token.name === 'code' || token.name === 'pre' || CODE_STYLE.test(style),
      });
    } else if (token.kind === 'close') {
      const index = stack.map((frame) => frame.name).lastIndexOf(token.name);
      if (index >= 0) stack.splice(index);
    } else if (token.kind === 'text' && token.text.trim()) {
      if (!stack.some((frame) => frame.leaf) && CJK.test(token.text)) {
        unwrapped++;
        unwrappedSample ||= token.text.trim().slice(0, 30);
      }
      if (!stack.some((frame) => frame.code) && HALF_WIDTH_AFTER_CJK.test(token.text)) {
        halfWidth++;
        halfWidthSample ||= token.text.trim().slice(0, 30);
      }
    }
  });

  if (unwrapped > 0) {
    issues.push({ level: 'error', rule: 'leaf-wrap', message: `有 ${unwrapped} 段文字没有包在 <span leaf=""> 里，粘贴后样式可能丢失`, sample: unwrappedSample });
  }
  if (halfWidth > 0) {
    issues.push({ level: 'warning', rule: 'half-width-punct', message: `正文里有 ${halfWidth} 处中文后接半角标点（, ; ! ? :），建议改全角`, sample: halfWidthSample });
  }

  return issues;
}
