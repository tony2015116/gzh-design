// luobo-gzh-design skill 的渲染入口：在 Node 里用网站同一套 parser + 组件把 Markdown 渲染成 HTML。
// 由 `npm run build:skill` 打包进 .claude/skills/luobo-gzh-design/scripts/renderer.bundle.mjs。
import { renderToStaticMarkup } from 'react-dom/server';
import { Preview } from '../components/preview/Preview';
import { THEMES } from '../core/theme';
import { IMAGE_STYLES, LAYOUT_STYLES } from '../core/style';
import { STYLE_SCHEMES, parseImportedStyleSchemes, type StyleScheme } from '../core/styleScheme';
import { extractCssVariables, toWechatCompatibleHtml, validateWechatHtml, type WechatIssue } from '../core/wechatCompat';
import { pickArticleStyle } from '../core/wechatExport';

export { toWechatCompatibleHtml, validateWechatHtml };

export const PREVIEW_ELEMENT_ID = 'wechat-article-preview';

export interface RenderResult {
  scheme: StyleScheme;
  /** 和网站预览完全一致的 HTML（含 CSS 变量，供浏览器预览、复制时再规整） */
  previewHtml: string;
  /** 已规整的公众号兼容 HTML，用于校验和手动粘贴兜底 */
  wechatHtml: string;
  issues: WechatIssue[];
}

export function listSchemes(): Array<Pick<StyleScheme, 'id' | 'name' | 'description'>> {
  return STYLE_SCHEMES.map(({ id, name, description }) => ({ id, name, description }));
}

/** 读取网站「我的预设」导出的 JSON，返回其中的自定义方案 */
export function loadCustomSchemes(json: string): StyleScheme[] {
  return parseImportedStyleSchemes(json);
}

export function resolveScheme(schemeId: string, customSchemes: StyleScheme[] = []): StyleScheme {
  const all = [...customSchemes, ...STYLE_SCHEMES];
  const scheme = all.find((item) => item.id === schemeId || item.name === schemeId);
  if (!scheme) {
    throw new Error(`未知风格方案: ${schemeId}。可用: ${all.map((item) => `${item.id}(${item.name})`).join(', ')}`);
  }
  return scheme;
}

/** 在方案基础上单独换版式或主题色（网站上就是先选方案、再改版式/主题色） */
export function withOverrides(scheme: StyleScheme, overrides: { layoutId?: string; themeId?: string }): StyleScheme {
  const { layoutId, themeId } = overrides;
  if (layoutId && !LAYOUT_STYLES[layoutId]) {
    throw new Error(`未知版式: ${layoutId}。可用: ${Object.values(LAYOUT_STYLES).map((item) => `${item.id}(${item.name})`).join(', ')}`);
  }
  if (themeId && !THEMES[themeId]) {
    throw new Error(`未知主题色: ${themeId}。可用: ${Object.values(THEMES).map((item) => `${item.id}(${item.name})`).join(', ')}`);
  }
  if (!layoutId && !themeId) return scheme;
  return {
    ...scheme,
    name: [scheme.name, layoutId && LAYOUT_STYLES[layoutId].name, themeId && THEMES[themeId].name].filter(Boolean).join(' · '),
    layoutId: layoutId || scheme.layoutId,
    themeId: themeId || scheme.themeId,
  };
}

export function renderArticle(markdown: string, scheme: StyleScheme): RenderResult {
  const theme = THEMES[scheme.themeId] || THEMES.emerald;
  const rendered = renderToStaticMarkup(
    <Preview
      markdown={markdown}
      elementId={PREVIEW_ELEMENT_ID}
      theme={theme}
      layoutStyle={LAYOUT_STYLES[scheme.layoutId] || LAYOUT_STYLES.minimalist}
      imageStyle={IMAGE_STYLES[scheme.imageStyleId] || IMAGE_STYLES.default}
      emphasis={scheme.emphasis}
      typography={scheme.typography}
      componentStyle={scheme.componentStyle}
    />,
  );
  // React 19 服务端渲染会给图片补 <link rel="preload">，正文里用不到
  const previewHtml = rendered.replace(/<link\b[^>]*>/g, '');

  // 取出根节点的 style / 内容，按网站复制时的同一规则规整
  const rootMatch = previewHtml.match(/^<div[^>]*style="([^"]*)"[^>]*>([\s\S]*)<\/div>$/);
  const rootStyle = (rootMatch?.[1] || '').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&amp;/g, '&');
  const inner = rootMatch?.[2] || previewHtml;
  const cssVariables = extractCssVariables(rootStyle);
  const articleStyle = pickArticleStyle(rootStyle, cssVariables).replace(/"/g, '&quot;');
  const wechatHtml = toWechatCompatibleHtml(`<section style="${articleStyle}">${inner}</section>`, { cssVariables });

  return { scheme, previewHtml, wechatHtml, issues: validateWechatHtml(wechatHtml) };
}
