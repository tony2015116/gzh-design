import type { CSSProperties } from 'react';

export type QuoteStyleId = 'follow-layout' | 'accent-line' | 'soft-card' | 'editorial' | 'spotlight';
export type CardStyleId = 'follow-layout' | 'outline' | 'soft-fill' | 'accent-top';
export type CodeStyleId = 'follow-layout' | 'light' | 'dark' | 'terminal';
export type RadiusStyleId = 'follow-layout' | 'square' | 'subtle' | 'rounded' | 'soft' | 'large';
export type BorderStyleId = 'follow-layout' | 'none' | 'hairline' | 'accent';
export type ShadowStyleId = 'follow-layout' | 'none' | 'soft' | 'floating';

export interface ComponentStyleConfig {
  quoteStyle: QuoteStyleId;
  cardStyle: CardStyleId;
  codeStyle: CodeStyleId;
  componentRadius: RadiusStyleId;
  imageRadius: RadiusStyleId;
  borderStyle: BorderStyleId;
  shadowStyle: ShadowStyleId;
}

export const QUOTE_STYLE_OPTIONS: Array<{ id: QuoteStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'accent-line', name: '强调竖线' },
  { id: 'soft-card', name: '柔和浅卡' },
  { id: 'editorial', name: '杂志引语' },
  { id: 'spotlight', name: '金句大字' },
];

export const CARD_STYLE_OPTIONS: Array<{ id: CardStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'outline', name: '细线卡片' },
  { id: 'soft-fill', name: '淡色填充' },
  { id: 'accent-top', name: '顶部强调' },
];

export const CODE_STYLE_OPTIONS: Array<{ id: CodeStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'light', name: '明亮代码' },
  { id: 'dark', name: '深色代码' },
  { id: 'terminal', name: '终端窗口' },
];

export const RADIUS_STYLE_OPTIONS: Array<{ id: RadiusStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'square', name: '直角' },
  { id: 'subtle', name: '轻微 4px' },
  { id: 'rounded', name: '圆润 8px' },
  { id: 'soft', name: '柔和 12px' },
  { id: 'large', name: '大圆角 20px' },
];

export const BORDER_STYLE_OPTIONS: Array<{ id: BorderStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'none', name: '无边框' },
  { id: 'hairline', name: '浅灰细线' },
  { id: 'accent', name: '主题色细线' },
];

export const SHADOW_STYLE_OPTIONS: Array<{ id: ShadowStyleId; name: string }> = [
  { id: 'follow-layout', name: '跟随版式' },
  { id: 'none', name: '无阴影' },
  { id: 'soft', name: '柔和阴影' },
  { id: 'floating', name: '悬浮阴影' },
];

const QUOTE_STYLE_IDS = new Set<QuoteStyleId>(QUOTE_STYLE_OPTIONS.map((item) => item.id));
const CARD_STYLE_IDS = new Set<CardStyleId>(CARD_STYLE_OPTIONS.map((item) => item.id));
const CODE_STYLE_IDS = new Set<CodeStyleId>(CODE_STYLE_OPTIONS.map((item) => item.id));
const RADIUS_STYLE_IDS = new Set<RadiusStyleId>(RADIUS_STYLE_OPTIONS.map((item) => item.id));
const BORDER_STYLE_IDS = new Set<BorderStyleId>(BORDER_STYLE_OPTIONS.map((item) => item.id));
const SHADOW_STYLE_IDS = new Set<ShadowStyleId>(SHADOW_STYLE_OPTIONS.map((item) => item.id));

export const DEFAULT_COMPONENT_STYLE_CONFIG: ComponentStyleConfig = {
  quoteStyle: 'follow-layout',
  cardStyle: 'follow-layout',
  codeStyle: 'follow-layout',
  componentRadius: 'follow-layout',
  imageRadius: 'follow-layout',
  borderStyle: 'follow-layout',
  shadowStyle: 'follow-layout',
};

export function normalizeComponentStyleConfig(
  value: Partial<ComponentStyleConfig> | null | undefined,
): ComponentStyleConfig {
  return {
    quoteStyle: value?.quoteStyle && QUOTE_STYLE_IDS.has(value.quoteStyle)
      ? value.quoteStyle
      : DEFAULT_COMPONENT_STYLE_CONFIG.quoteStyle,
    cardStyle: value?.cardStyle && CARD_STYLE_IDS.has(value.cardStyle)
      ? value.cardStyle
      : DEFAULT_COMPONENT_STYLE_CONFIG.cardStyle,
    codeStyle: value?.codeStyle && CODE_STYLE_IDS.has(value.codeStyle)
      ? value.codeStyle
      : DEFAULT_COMPONENT_STYLE_CONFIG.codeStyle,
    componentRadius: value?.componentRadius && RADIUS_STYLE_IDS.has(value.componentRadius)
      ? value.componentRadius
      : DEFAULT_COMPONENT_STYLE_CONFIG.componentRadius,
    imageRadius: value?.imageRadius && RADIUS_STYLE_IDS.has(value.imageRadius)
      ? value.imageRadius
      : DEFAULT_COMPONENT_STYLE_CONFIG.imageRadius,
    borderStyle: value?.borderStyle && BORDER_STYLE_IDS.has(value.borderStyle)
      ? value.borderStyle
      : DEFAULT_COMPONENT_STYLE_CONFIG.borderStyle,
    shadowStyle: value?.shadowStyle && SHADOW_STYLE_IDS.has(value.shadowStyle)
      ? value.shadowStyle
      : DEFAULT_COMPONENT_STYLE_CONFIG.shadowStyle,
  };
}

const radiusValues: Partial<Record<RadiusStyleId, string>> = {
  square: '0',
  subtle: '4px',
  rounded: '8px',
  soft: '12px',
  large: '20px',
};

export function getFrameStyleOverrides(
  config: ComponentStyleConfig,
  themeColor: string,
  target: 'component' | 'image' = 'component',
): CSSProperties {
  const style: CSSProperties = {};
  const radius = radiusValues[target === 'image' ? config.imageRadius : config.componentRadius];

  if (radius !== undefined) style.borderRadius = radius;

  if (config.borderStyle === 'none') style.border = 'none';
  if (config.borderStyle === 'hairline') style.border = '1px solid #E5E7EB';
  if (config.borderStyle === 'accent') style.border = `1px solid ${themeColor}`;

  if (config.shadowStyle === 'none') style.boxShadow = 'none';
  if (config.shadowStyle === 'soft') style.boxShadow = '0 6px 18px rgba(15, 23, 42, 0.07)';
  if (config.shadowStyle === 'floating') style.boxShadow = '0 14px 32px rgba(15, 23, 42, 0.14)';

  return style;
}

export function getQuoteStyleOverrides(config: ComponentStyleConfig, themeColor: string): CSSProperties {
  const frame = getFrameStyleOverrides(config, themeColor);

  if (config.quoteStyle === 'accent-line') {
    return {
      margin: '0 0 24px',
      padding: '14px 18px',
      background: '#F8FAF9',
      border: 'none',
      borderLeft: `4px solid ${themeColor}`,
      textAlign: 'left',
      ...frame,
    };
  }

  if (config.quoteStyle === 'soft-card') {
    return {
      margin: '0 0 24px',
      padding: '18px 20px',
      background: `${themeColor}0D`,
      border: `1px solid ${themeColor}26`,
      borderRadius: '12px',
      textAlign: 'left',
      ...frame,
    };
  }

  if (config.quoteStyle === 'editorial') {
    return {
      margin: '28px 12px',
      padding: '18px 8px',
      background: 'transparent',
      border: 'none',
      borderTop: '1px solid #D1D5DB',
      borderBottom: '1px solid #D1D5DB',
      borderRadius: '0',
      textAlign: 'center',
      boxShadow: 'none',
      ...frame,
    };
  }

  return frame;
}

export function getCardStyleOverrides(config: ComponentStyleConfig, themeColor: string): CSSProperties {
  const frame = getFrameStyleOverrides(config, themeColor);

  if (config.cardStyle === 'outline') {
    return {
      background: '#FFFFFF',
      border: '1px solid #DDE3E0',
      borderRadius: '8px',
      boxShadow: 'none',
      ...frame,
    };
  }

  if (config.cardStyle === 'soft-fill') {
    return {
      background: `${themeColor}0D`,
      border: 'none',
      borderRadius: '12px',
      boxShadow: 'none',
      ...frame,
    };
  }

  if (config.cardStyle === 'accent-top') {
    return {
      background: '#FFFFFF',
      border: '1px solid #E5E7EB',
      borderTop: `4px solid ${themeColor}`,
      borderRadius: '8px',
      ...frame,
    };
  }

  return frame;
}

export interface CodeStyleOverrides {
  container: CSSProperties;
  text: CSSProperties;
  macBar?: boolean;
  macBarBackground?: string;
}

export function getCodeStyleOverrides(
  config: ComponentStyleConfig,
  themeColor: string,
): CodeStyleOverrides {
  const frame = getFrameStyleOverrides(config, themeColor);

  if (config.codeStyle === 'light') {
    return {
      container: { background: '#F7F8FA', border: '1px solid #E5E7EB', padding: '16px', ...frame },
      text: { color: '#1F2937', fontSize: '13px', padding: 0 },
      macBar: false,
    };
  }

  if (config.codeStyle === 'dark') {
    return {
      container: { background: '#111827', border: '1px solid #1F2937', padding: '16px', ...frame },
      text: { color: '#E5E7EB', fontSize: '13px', padding: 0 },
      macBar: false,
    };
  }

  if (config.codeStyle === 'terminal') {
    return {
      container: { background: '#071510', border: `1px solid ${themeColor}`, padding: 0, overflow: 'hidden', ...frame },
      text: { color: '#B7F7D8', fontSize: '13px', padding: '16px' },
      macBar: true,
      macBarBackground: '#10231B',
    };
  }

  return { container: frame, text: {} };
}
