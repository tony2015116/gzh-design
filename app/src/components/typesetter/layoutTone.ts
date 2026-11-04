import type { CSSProperties } from 'react';
import type { Theme } from '../../core/theme';
import type { LayoutStyle } from '../../core/style';

/** 整篇级组件（封面、导读、签名）共用的版式基调：字体、文字色、底色、对齐 */
export interface LayoutTone {
  fontFamily: string;
  ink: string;
  muted: string;
  faint: string;
  surface: string;
  line: string;
  align: 'left' | 'center';
  radius: string;
  serif: boolean;
  mono: boolean;
}

const SERIF = '"Songti SC", "SimSun", STSong, serif';
const MAGAZINE = "Georgia, 'Times New Roman', 'Songti SC', serif";

/** 暗黑版式下，方案里的卡片样式（白底、浅灰边）会和深色正文冲突，只保留圆角和阴影 */
export function adaptCardOverrides(style: CSSProperties, layoutStyle: LayoutStyle): CSSProperties {
  if (layoutStyle.id !== 'dark') return style;
  const rest = { ...style };
  delete rest.background;
  delete rest.border;
  delete rest.borderTop;
  return rest;
}

export function getLayoutTone(layoutStyle: LayoutStyle, theme: Theme): LayoutTone {
  const base: LayoutTone = {
    fontFamily: 'var(--body-font-family)',
    ink: '#111827',
    muted: '#4B5563',
    faint: '#9CA3AF',
    surface: '#F9FAFB',
    line: '#E5E7EB',
    align: 'left',
    radius: '12px',
    serif: false,
    mono: false,
  };

  switch (layoutStyle.id) {
    case 'literary':
      return { ...base, muted: '#6B7280', align: 'center', radius: '2px' };
    case 'tech':
      return { ...base, surface: '#F3F4F6', radius: '4px', mono: true };
    case 'cute':
      return { ...base, surface: theme.highlight, line: theme.highlight, radius: '20px' };
    case 'classic':
      return { ...base, fontFamily: SERIF, ink: '#1F2937', surface: '#FBFAF7', line: theme.primary, align: 'center', radius: '0', serif: true };
    case 'magazine':
      return { ...base, fontFamily: MAGAZINE, surface: '#F7F5F0', line: '#D1D5DB', align: 'center', radius: '0', serif: true };
    case 'dark':
      return { ...base, ink: '#F8FAFC', muted: '#CBD5E1', faint: '#64748B', surface: '#1E293B', line: '#334155', radius: '8px', mono: true };
    case 'minimalist':
    default:
      return base;
  }
}
