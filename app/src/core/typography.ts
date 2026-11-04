export type FontFamilyId = 'follow-layout' | 'system-sans' | 'modern-sans' | 'reading-serif';
export type HeadingWeight = 'follow-layout' | 500 | 600 | 700 | 800 | 900;

export interface TypographyConfig {
  fontFamilyId: FontFamilyId;
  bodySize: number;
  lineHeight: number;
  paragraphSpacing: number;
  headingWeight: HeadingWeight;
  contentPaddingX: number;
}

export interface FontFamilyOption {
  id: FontFamilyId;
  name: string;
  stack?: string;
}

export const FONT_FAMILIES: FontFamilyOption[] = [
  { id: 'follow-layout', name: '跟随版式' },
  {
    id: 'system-sans',
    name: '系统黑体',
    stack: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'modern-sans',
    name: '现代黑体',
    stack: '"HarmonyOS Sans SC", "Source Han Sans SC", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'reading-serif',
    name: '阅读宋体',
    stack: '"Source Han Serif SC", "Songti SC", "SimSun", STSong, serif',
  },
];

const SYSTEM_SANS_STACK = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
const READING_SERIF_STACK = '"Source Han Serif SC", "Songti SC", "SimSun", STSong, serif';
const MAGAZINE_STACK = 'Georgia, "Times New Roman", "Songti SC", serif';

const LAYOUT_DEFAULTS: Record<string, Pick<TypographyConfig, 'bodySize' | 'lineHeight' | 'paragraphSpacing'>> = {
  minimalist: { bodySize: 15, lineHeight: 1.9, paragraphSpacing: 16 },
  literary: { bodySize: 14, lineHeight: 2.2, paragraphSpacing: 20 },
  tech: { bodySize: 14, lineHeight: 1.8, paragraphSpacing: 16 },
  cute: { bodySize: 15, lineHeight: 2, paragraphSpacing: 16 },
  classic: { bodySize: 15, lineHeight: 2, paragraphSpacing: 20 },
  magazine: { bodySize: 15, lineHeight: 1.9, paragraphSpacing: 24 },
  dark: { bodySize: 15, lineHeight: 1.8, paragraphSpacing: 16 },
};

const FONT_FAMILY_IDS = new Set<FontFamilyId>(FONT_FAMILIES.map((font) => font.id));
const HEADING_WEIGHTS = new Set<HeadingWeight>(['follow-layout', 500, 600, 700, 800, 900]);

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function createTypographyConfigForLayout(layoutId: string): TypographyConfig {
  const defaults = LAYOUT_DEFAULTS[layoutId] || LAYOUT_DEFAULTS.minimalist;
  return {
    fontFamilyId: 'follow-layout',
    bodySize: defaults.bodySize,
    lineHeight: defaults.lineHeight,
    paragraphSpacing: defaults.paragraphSpacing,
    headingWeight: 'follow-layout',
    contentPaddingX: 16,
  };
}

export const DEFAULT_TYPOGRAPHY_CONFIG = createTypographyConfigForLayout('minimalist');

export function normalizeTypographyConfig(
  value: Partial<TypographyConfig> | null | undefined,
  layoutId: string,
): TypographyConfig {
  const fallback = createTypographyConfigForLayout(layoutId);
  const fontFamilyId = value?.fontFamilyId && FONT_FAMILY_IDS.has(value.fontFamilyId)
    ? value.fontFamilyId
    : fallback.fontFamilyId;
  const headingWeight = value?.headingWeight && HEADING_WEIGHTS.has(value.headingWeight)
    ? value.headingWeight
    : fallback.headingWeight;

  return {
    fontFamilyId,
    bodySize: clamp(Number(value?.bodySize) || fallback.bodySize, 13, 18),
    lineHeight: clamp(Number(value?.lineHeight) || fallback.lineHeight, 1.6, 2.3),
    paragraphSpacing: clamp(Number(value?.paragraphSpacing) || fallback.paragraphSpacing, 8, 28),
    headingWeight,
    contentPaddingX: clamp(Number(value?.contentPaddingX) || fallback.contentPaddingX, 12, 32),
  };
}

export function getFontFamilyStack(fontFamilyId: FontFamilyId): string | undefined {
  return FONT_FAMILIES.find((font) => font.id === fontFamilyId)?.stack;
}

export function resolveTypographyFontStack(fontFamilyId: FontFamilyId, layoutId: string): string {
  const selectedStack = getFontFamilyStack(fontFamilyId);
  if (selectedStack) return selectedStack;
  if (layoutId === 'classic') return READING_SERIF_STACK;
  if (layoutId === 'magazine') return MAGAZINE_STACK;
  return SYSTEM_SANS_STACK;
}
