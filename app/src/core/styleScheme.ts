import { normalizeComponentStyleConfig, type ComponentStyleConfig } from './componentStyle';
import { normalizeEmphasisConfig, type EmphasisConfig } from './emphasis';
import { IMAGE_STYLES, LAYOUT_STYLES } from './style';
import { THEMES } from './theme';
import { normalizeTypographyConfig, type TypographyConfig } from './typography';

export interface StyleSchemePreview {
  paper: string;
  ink: string;
  accent: string;
  soft: string;
}

export interface StyleScheme {
  id: string;
  name: string;
  description: string;
  themeId: string;
  layoutId: string;
  imageStyleId: string;
  emphasis: EmphasisConfig;
  typography: TypographyConfig;
  componentStyle: ComponentStyleConfig;
  preview: StyleSchemePreview;
  custom?: boolean;
  updatedAt?: string;
}

export interface CurrentStyleSelection {
  themeId: string;
  layoutId: string;
  imageStyleId: string;
  emphasis: EmphasisConfig;
  typography: TypographyConfig;
  componentStyle: ComponentStyleConfig;
}

export const STYLE_SCHEMES: StyleScheme[] = [
  {
    id: 'jade-business',
    name: '玉石商务',
    description: '克制清晰，适合方法论与工作复盘',
    themeId: 'emerald',
    layoutId: 'minimalist',
    imageStyleId: 'default',
    emphasis: { styleId: 'gradient', color: '#CBE6D8' },
    typography: {
      fontFamilyId: 'modern-sans',
      bodySize: 15,
      lineHeight: 1.9,
      paragraphSpacing: 16,
      headingWeight: 800,
      contentPaddingX: 16,
    },
    componentStyle: {
      quoteStyle: 'accent-line',
      cardStyle: 'accent-top',
      codeStyle: 'terminal',
      componentRadius: 'soft',
      imageRadius: 'soft',
      borderStyle: 'hairline',
      shadowStyle: 'soft',
    },
    preview: { paper: '#FFFFFF', ink: '#17211C', accent: '#059669', soft: '#CBE6D8' },
  },
  {
    id: 'ocean-editorial',
    name: '海盐杂志',
    description: '留白舒展，适合观点与品牌内容',
    themeId: 'ocean',
    layoutId: 'magazine',
    imageStyleId: 'card',
    emphasis: { styleId: 'underline', color: '#C9D9EA' },
    typography: {
      fontFamilyId: 'reading-serif',
      bodySize: 15,
      lineHeight: 2,
      paragraphSpacing: 22,
      headingWeight: 700,
      contentPaddingX: 20,
    },
    componentStyle: {
      quoteStyle: 'editorial',
      cardStyle: 'outline',
      codeStyle: 'light',
      componentRadius: 'square',
      imageRadius: 'subtle',
      borderStyle: 'hairline',
      shadowStyle: 'none',
    },
    preview: { paper: '#FCFCFA', ink: '#1F2937', accent: '#2563EB', soft: '#C9D9EA' },
  },
  {
    id: 'amber-report',
    name: '暖橙报告',
    description: '温暖醒目，适合案例与数据解读',
    themeId: 'sunset',
    layoutId: 'minimalist',
    imageStyleId: 'card',
    emphasis: { styleId: 'soft-fill', color: '#F1D2B5' },
    typography: {
      fontFamilyId: 'system-sans',
      bodySize: 15,
      lineHeight: 1.9,
      paragraphSpacing: 18,
      headingWeight: 800,
      contentPaddingX: 18,
    },
    componentStyle: {
      quoteStyle: 'soft-card',
      cardStyle: 'soft-fill',
      codeStyle: 'light',
      componentRadius: 'rounded',
      imageRadius: 'rounded',
      borderStyle: 'accent',
      shadowStyle: 'none',
    },
    preview: { paper: '#FFFCF8', ink: '#38251A', accent: '#EA580C', soft: '#F1D2B5' },
  },
  {
    id: 'violet-tech',
    name: '紫电科技',
    description: '锐利理性，适合产品与技术教程',
    themeId: 'royal',
    layoutId: 'tech',
    imageStyleId: 'floating',
    emphasis: { styleId: 'light-band', color: '#DDD6FE' },
    typography: {
      fontFamilyId: 'modern-sans',
      bodySize: 14,
      lineHeight: 1.8,
      paragraphSpacing: 16,
      headingWeight: 800,
      contentPaddingX: 16,
    },
    componentStyle: {
      quoteStyle: 'accent-line',
      cardStyle: 'accent-top',
      codeStyle: 'terminal',
      componentRadius: 'subtle',
      imageRadius: 'rounded',
      borderStyle: 'accent',
      shadowStyle: 'soft',
    },
    preview: { paper: '#F8F7FC', ink: '#191529', accent: '#7C3AED', soft: '#DDD6FE' },
  },
  {
    id: 'cherry-friendly',
    name: '樱桃轻盈',
    description: '亲切活泼，适合清单与生活分享',
    themeId: 'cherry',
    layoutId: 'cute',
    imageStyleId: 'polaroid',
    emphasis: { styleId: 'soft-fill', color: '#FECDD3' },
    typography: {
      fontFamilyId: 'system-sans',
      bodySize: 15,
      lineHeight: 2,
      paragraphSpacing: 18,
      headingWeight: 700,
      contentPaddingX: 18,
    },
    componentStyle: {
      quoteStyle: 'soft-card',
      cardStyle: 'soft-fill',
      codeStyle: 'light',
      componentRadius: 'large',
      imageRadius: 'large',
      borderStyle: 'none',
      shadowStyle: 'soft',
    },
    preview: { paper: '#FFF9FA', ink: '#42232C', accent: '#E11D48', soft: '#FECDD3' },
  },
  {
    id: 'jade-classic',
    name: '墨玉宋韵',
    description: '端正雅致，适合人文与深度长文',
    themeId: 'emerald',
    layoutId: 'classic',
    imageStyleId: 'card',
    emphasis: { styleId: 'underline', color: '#CBE6D8' },
    typography: {
      fontFamilyId: 'reading-serif',
      bodySize: 15,
      lineHeight: 2.1,
      paragraphSpacing: 22,
      headingWeight: 700,
      contentPaddingX: 20,
    },
    componentStyle: {
      quoteStyle: 'editorial',
      cardStyle: 'outline',
      codeStyle: 'light',
      componentRadius: 'square',
      imageRadius: 'subtle',
      borderStyle: 'accent',
      shadowStyle: 'none',
    },
    preview: { paper: '#FBFAF6', ink: '#27251F', accent: '#047857', soft: '#D8E6DD' },
  },
  // 营销向方案：按读者情绪目标设计（高唤醒 / 建立信任 / 共情沉浸），都使用「金句大字」引用和纯色强调
  {
    id: 'marketing-pop',
    name: '爆款种草',
    description: '高唤醒、好扫读：荧光笔划重点 + 金句大字，适合清单、干货、种草',
    themeId: 'sunset',
    layoutId: 'minimalist',
    imageStyleId: 'default',
    emphasis: { styleId: 'soft-fill', color: '#FDE68A' },
    typography: {
      fontFamilyId: 'system-sans',
      bodySize: 16,
      lineHeight: 1.85,
      paragraphSpacing: 20,
      headingWeight: 900,
      contentPaddingX: 12,
    },
    componentStyle: {
      quoteStyle: 'spotlight',
      cardStyle: 'soft-fill',
      codeStyle: 'light',
      componentRadius: 'rounded',
      imageRadius: 'rounded',
      borderStyle: 'none',
      shadowStyle: 'none',
    },
    preview: { paper: '#FFFFFF', ink: '#1C1917', accent: '#EA580C', soft: '#FDE68A' },
  },
  {
    id: 'marketing-trust',
    name: '专业信赖',
    description: '降低防御、建立权威：冷静蓝 + 实色强调，适合行业分析、案例、方法论',
    themeId: 'ocean',
    layoutId: 'minimalist',
    imageStyleId: 'card',
    emphasis: { styleId: 'soft-fill', color: '#D6E4F5' },
    typography: {
      fontFamilyId: 'modern-sans',
      bodySize: 16,
      lineHeight: 1.9,
      paragraphSpacing: 20,
      headingWeight: 800,
      contentPaddingX: 12,
    },
    componentStyle: {
      quoteStyle: 'spotlight',
      cardStyle: 'accent-top',
      codeStyle: 'light',
      componentRadius: 'subtle',
      imageRadius: 'subtle',
      borderStyle: 'hairline',
      shadowStyle: 'none',
    },
    preview: { paper: '#FFFFFF', ink: '#0F172A', accent: '#2563EB', soft: '#D6E4F5' },
  },
  {
    id: 'marketing-story',
    name: '走心故事',
    description: '共情、沉浸：宋体长读 + 宽留白，适合个人经历、品牌故事、情感文',
    themeId: 'cherry',
    layoutId: 'magazine',
    imageStyleId: 'card',
    emphasis: { styleId: 'underline', color: '#FDA4AF' },
    typography: {
      fontFamilyId: 'reading-serif',
      bodySize: 16,
      lineHeight: 2,
      paragraphSpacing: 24,
      headingWeight: 700,
      contentPaddingX: 16,
    },
    componentStyle: {
      quoteStyle: 'spotlight',
      cardStyle: 'outline',
      codeStyle: 'light',
      componentRadius: 'square',
      imageRadius: 'subtle',
      borderStyle: 'hairline',
      shadowStyle: 'none',
    },
    preview: { paper: '#FFFCFC', ink: '#3F1D2B', accent: '#E11D48', soft: '#FDA4AF' },
  },
];

export const CUSTOM_STYLE_SCHEMES_KEY = 'wechat_custom_style_schemes_v1';
const MAX_CUSTOM_STYLE_SCHEMES = 30;
const HEX_COLOR = /^#[0-9A-F]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

const createCustomSchemeId = () => (
  `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
);

const normalizePreviewColor = (value: unknown, fallback: string) => (
  typeof value === 'string' && HEX_COLOR.test(value) ? value.toUpperCase() : fallback
);

function normalizeCustomStyleScheme(value: unknown, preserveId: boolean): StyleScheme | null {
  if (!isRecord(value)) return null;

  const name = typeof value.name === 'string' ? value.name.trim().slice(0, 40) : '';
  if (!name) return null;

  const themeId = typeof value.themeId === 'string' && THEMES[value.themeId]
    ? value.themeId
    : 'emerald';
  const layoutId = typeof value.layoutId === 'string' && LAYOUT_STYLES[value.layoutId]
    ? value.layoutId
    : 'minimalist';
  const imageStyleId = typeof value.imageStyleId === 'string' && IMAGE_STYLES[value.imageStyleId]
    ? value.imageStyleId
    : 'default';
  const theme = THEMES[themeId];
  const previewValue = isRecord(value.preview) ? value.preview : {};
  const emphasis = normalizeEmphasisConfig(
    isRecord(value.emphasis) ? value.emphasis as Partial<EmphasisConfig> : undefined,
    theme.emphasis || theme.highlight,
  );

  return {
    id: preserveId && typeof value.id === 'string' && value.id.startsWith('custom-')
      ? value.id
      : createCustomSchemeId(),
    name,
    description: typeof value.description === 'string'
      ? value.description.trim().slice(0, 80)
      : '我的自定义风格方案',
    themeId,
    layoutId,
    imageStyleId,
    emphasis,
    typography: normalizeTypographyConfig(
      isRecord(value.typography) ? value.typography as Partial<TypographyConfig> : undefined,
      layoutId,
    ),
    componentStyle: normalizeComponentStyleConfig(
      isRecord(value.componentStyle) ? value.componentStyle as Partial<ComponentStyleConfig> : undefined,
    ),
    preview: {
      paper: normalizePreviewColor(previewValue.paper, layoutId === 'dark' ? '#0F172A' : '#FFFFFF'),
      ink: normalizePreviewColor(previewValue.ink, layoutId === 'dark' ? '#E2E8F0' : '#1F2937'),
      accent: normalizePreviewColor(previewValue.accent, theme.primary),
      soft: normalizePreviewColor(previewValue.soft, emphasis.color),
    },
    custom: true,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : undefined,
  };
}

export function loadCustomStyleSchemes(): StyleScheme[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = JSON.parse(window.localStorage.getItem(CUSTOM_STYLE_SCHEMES_KEY) || '[]');
    if (!Array.isArray(stored)) return [];
    return stored
      .map((item) => normalizeCustomStyleScheme(item, true))
      .filter((item): item is StyleScheme => Boolean(item))
      .slice(0, MAX_CUSTOM_STYLE_SCHEMES);
  } catch {
    return [];
  }
}

export function saveCustomStyleSchemes(schemes: StyleScheme[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    CUSTOM_STYLE_SCHEMES_KEY,
    JSON.stringify(schemes.slice(0, MAX_CUSTOM_STYLE_SCHEMES)),
  );
}

export function createCustomStyleScheme(
  name: string,
  current: CurrentStyleSelection,
  preview: StyleSchemePreview,
): StyleScheme {
  return {
    id: createCustomSchemeId(),
    name: name.trim().slice(0, 40),
    description: '我的自定义风格方案',
    themeId: current.themeId,
    layoutId: current.layoutId,
    imageStyleId: current.imageStyleId,
    emphasis: { ...current.emphasis },
    typography: { ...current.typography },
    componentStyle: { ...current.componentStyle },
    preview: { ...preview },
    custom: true,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateAsCustomStyleScheme(scheme: StyleScheme): StyleScheme {
  return {
    ...scheme,
    id: createCustomSchemeId(),
    name: `${scheme.name} 副本`.slice(0, 40),
    description: '从现有方案复制，可继续自由调整',
    emphasis: { ...scheme.emphasis },
    typography: { ...scheme.typography },
    componentStyle: { ...scheme.componentStyle },
    preview: { ...scheme.preview },
    custom: true,
    updatedAt: new Date().toISOString(),
  };
}

export function serializeCustomStyleSchemes(schemes: StyleScheme[]): string {
  return JSON.stringify({
    version: 1,
    exportedAt: new Date().toISOString(),
    schemes,
  }, null, 2);
}

export function parseImportedStyleSchemes(raw: string): StyleScheme[] {
  const parsed = JSON.parse(raw) as unknown;
  const candidates = Array.isArray(parsed)
    ? parsed
    : isRecord(parsed) && Array.isArray(parsed.schemes)
      ? parsed.schemes
      : [];

  return candidates
    .map((item) => normalizeCustomStyleScheme(item, false))
    .filter((item): item is StyleScheme => Boolean(item))
    .slice(0, MAX_CUSTOM_STYLE_SCHEMES);
}

const objectsEqual = (left: object, right: object) => JSON.stringify(left) === JSON.stringify(right);

export function styleSchemeMatchesSelection(
  scheme: StyleScheme,
  current: CurrentStyleSelection,
): boolean {
  return (
    scheme.themeId === current.themeId
    && scheme.layoutId === current.layoutId
    && scheme.imageStyleId === current.imageStyleId
    && scheme.emphasis.styleId === current.emphasis.styleId
    && scheme.emphasis.color.toUpperCase() === current.emphasis.color.toUpperCase()
    && objectsEqual(scheme.typography, current.typography)
    && objectsEqual(scheme.componentStyle, current.componentStyle)
  );
}

export function updateCustomStyleScheme(
  scheme: StyleScheme,
  current: CurrentStyleSelection,
  preview: StyleSchemePreview,
): StyleScheme {
  return {
    ...scheme,
    themeId: current.themeId,
    layoutId: current.layoutId,
    imageStyleId: current.imageStyleId,
    emphasis: { ...current.emphasis },
    typography: { ...current.typography },
    componentStyle: { ...current.componentStyle },
    preview: { ...preview },
    custom: true,
    updatedAt: new Date().toISOString(),
  };
}

export function findActiveStyleScheme(
  current: CurrentStyleSelection,
  schemes: StyleScheme[] = STYLE_SCHEMES,
): StyleScheme | undefined {
  return schemes.find((scheme) => styleSchemeMatchesSelection(scheme, current));
}
