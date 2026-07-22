import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface QuoteProps {
  content: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const Quote: React.FC<QuoteProps> = ({ content, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ margin: '32px 16px', textAlign: 'center' }}>
          <section style={{ fontSize: '32px', color: '#D1D5DB', margin: '0 0 -16px', lineHeight: 1, fontFamily: 'serif' }}>“</section>
          <section style={{ fontSize: '14px', color: '#4B5563', margin: 0, lineHeight: 2, fontStyle: 'italic', letterSpacing: '2px' }} dangerouslySetInnerHTML={{ __html: content }} />
          <section style={{ fontSize: '32px', color: '#D1D5DB', margin: '-8px 0 0', lineHeight: 1, fontFamily: 'serif' }}>”</section>
        </section>
      );
    case 'tech':
      return (
        <section style={{ background: '#111827', padding: '16px 20px', borderRadius: '4px', borderLeft: `2px solid ${theme.primary}`, marginBottom: '24px' }}>
          <section style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, lineHeight: 1.8, fontFamily: 'monospace' }}>
            <span style={{ color: theme.primary, marginRight: '8px' }}>&gt;</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </section>
        </section>
      );
    case 'cute':
      return (
        <section style={{ background: theme.highlight, padding: '16px 20px', borderRadius: '24px', borderTopLeftRadius: '4px', marginBottom: '24px', boxShadow: '2px 4px 12px rgba(0,0,0,0.04)' }}>
          <section style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.8 }}>
            <span style={{ marginRight: '6px' }}>💬</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </section>
        </section>
      );
    case 'classic':
      return (
        <section style={{ padding: '16px 24px', marginBottom: '24px', border: `1px solid ${theme.primary}`, position: 'relative', fontFamily: '"Songti SC", "SimSun", STSong, serif', textAlign: 'center' }}>
          <span style={{ position: 'absolute', top: '-6px', left: '16px', background: '#FFF', padding: '0 8px', color: theme.primary, fontSize: '18px' }}>『</span>
          <section style={{ fontSize: '15px', color: '#374151', margin: 0, lineHeight: 2, letterSpacing: '1px' }} dangerouslySetInnerHTML={{ __html: content }} />
          <span style={{ position: 'absolute', bottom: '-10px', right: '16px', background: '#FFF', padding: '0 8px', color: theme.primary, fontSize: '18px' }}>』</span>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ margin: '32px 16px', textAlign: 'center', borderTop: '1px solid #D1D5DB', borderBottom: '1px solid #D1D5DB', padding: '16px 0' }}>
          <section style={{ fontSize: '16px', color: '#374151', margin: 0, lineHeight: 1.9, fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
    case 'dark':
      return (
        <section style={{ background: '#1E293B', padding: '16px 20px', borderRadius: '4px', borderLeft: `4px solid ${theme.primary}`, marginBottom: '24px' }}>
          <section style={{ fontSize: '14px', color: '#94A3B8', margin: 0, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '0 8px 8px 0', borderLeft: `4px solid ${theme.primary}`, marginBottom: '24px' }}>
          <section style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.8, textAlign: 'justify' }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
  }
};
