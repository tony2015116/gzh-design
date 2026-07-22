export interface LayoutStyle {
  id: string;
  name: string;
}

export const LAYOUT_STYLES: Record<string, LayoutStyle> = {
  minimalist: { id: 'minimalist', name: '商务极简' },
  literary: { id: 'literary', name: '文艺清新' },
  tech: { id: 'tech', name: '科技未来' },
  cute: { id: 'cute', name: '活泼可爱' },
  classic: { id: 'classic', name: '古典中式' },
  magazine: { id: 'magazine', name: '杂志风' },
  dark: { id: 'dark', name: '暗黑风' }
};

export const DEFAULT_LAYOUT_STYLE = LAYOUT_STYLES.minimalist;

export interface ImageStyle {
  id: string;
  name: string;
}

export const IMAGE_STYLES: Record<string, ImageStyle> = {
  default: { id: 'default', name: '跟随版式' },
  card: { id: 'card', name: '内边距画框' },
  floating: { id: 'floating', name: '立体阴影悬浮' },
  polaroid: { id: 'polaroid', name: '复古拍立得' }
};

export const DEFAULT_IMAGE_STYLE = IMAGE_STYLES.default;
