import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface DividerProps {
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const Divider: React.FC<DividerProps> = ({ theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ margin: '16px auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', width: '4px', height: '4px', background: '#D1D5DB', borderRadius: '50%', margin: '0 8px' }}></span>
          <span style={{ display: 'inline-block', width: '4px', height: '4px', background: '#D1D5DB', borderRadius: '50%', margin: '0 8px' }}></span>
          <span style={{ display: 'inline-block', width: '4px', height: '4px', background: '#D1D5DB', borderRadius: '50%', margin: '0 8px' }}></span>
        </section>
      );
    case 'tech':
      return (
        <section style={{ margin: '16px 0', borderTop: `1px dashed ${theme.primary}`, opacity: 0.5 }}></section>
      );
    case 'cute':
      return (
        <section style={{ margin: '16px auto', textAlign: 'center', color: theme.highlight, fontSize: '16px', letterSpacing: '8px' }}>
          ✿ ✿ ✿
        </section>
      );
    case 'classic':
      return (
        <section style={{ margin: '16px auto', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', width: '60px', height: '1px', background: theme.primary, verticalAlign: 'middle' }}></span>
          <span style={{ display: 'inline-block', margin: '0 12px', width: '6px', height: '6px', transform: 'rotate(45deg)', background: theme.primary, verticalAlign: 'middle' }}></span>
          <span style={{ display: 'inline-block', width: '60px', height: '1px', background: theme.primary, verticalAlign: 'middle' }}></span>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ margin: '24px auto', textAlign: 'center', color: '#9CA3AF', fontSize: '14px', letterSpacing: '4px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }}>
          · · ·
        </section>
      );
    case 'dark':
      return (
        <section style={{ margin: '24px 0', height: '1px', background: theme.gradient, opacity: 0.6 }}></section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ margin: '16px auto', width: '40px', height: '4px', background: theme.primary, borderRadius: '2px' }}></section>
      );
  }
};
