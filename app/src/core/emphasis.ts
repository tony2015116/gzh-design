export interface EmphasisStyleOption {
  id: EmphasisStyleId;
  name: string;
  description: string;
}

export type EmphasisStyleId =
  | 'follow-layout'
  | 'gradient'
  | 'soft-fill'
  | 'light-band'
  | 'underline'
  | 'plain-bold';

export interface EmphasisConfig {
  styleId: EmphasisStyleId;
  color: string;
}

export interface EmphasisColorOption {
  id: string;
  name: string;
  value: string;
}

export const EMPHASIS_STYLES: EmphasisStyleOption[] = [
  { id: 'follow-layout', name: '跟随版式', description: '保留当前版式的强调规则' },
  { id: 'gradient', name: '渐隐标记', description: '从强调色自然过渡到透明' },
  { id: 'soft-fill', name: '均匀浅底', description: '完整浅色背景，阅读稳定' },
  { id: 'light-band', name: '半高光带', description: '只覆盖文字下半部' },
  { id: 'underline', name: '强调色下划线', description: '使用色彩底线保持克制' },
  { id: 'plain-bold', name: '纯加粗', description: '仅提高字重，不添加颜色' },
];

export const EMPHASIS_COLORS: EmphasisColorOption[] = [
  { id: 'jade', name: '玉石绿', value: '#CBE6D8' },
  { id: 'amber', name: '琥珀黄', value: '#FDE68A' },
  { id: 'champagne', name: '香槟金', value: '#F2DFB0' },
  { id: 'mist-blue', name: '雾霾蓝', value: '#C9D9EA' },
  { id: 'apricot', name: '暖杏色', value: '#F1D2B5' },
  { id: 'slate', name: '冷灰蓝', value: '#D6DDE6' },
];

export const DEFAULT_EMPHASIS_CONFIG: EmphasisConfig = {
  styleId: 'follow-layout',
  color: '#CBE6D8',
};

const EMPHASIS_STYLE_IDS = new Set<EmphasisStyleId>(EMPHASIS_STYLES.map((style) => style.id));
const HEX_COLOR = /^#[0-9A-F]{6}$/i;

export function normalizeEmphasisConfig(
  value: Partial<EmphasisConfig> | null | undefined,
  fallbackColor = DEFAULT_EMPHASIS_CONFIG.color,
): EmphasisConfig {
  const styleId = value?.styleId && EMPHASIS_STYLE_IDS.has(value.styleId)
    ? value.styleId
    : DEFAULT_EMPHASIS_CONFIG.styleId;
  const color = value?.color && HEX_COLOR.test(value.color)
    ? value.color.toUpperCase()
    : fallbackColor.toUpperCase();

  return { styleId, color };
}
