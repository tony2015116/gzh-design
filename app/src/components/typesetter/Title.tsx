import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface TitleProps {
  content: string;
  num?: string;
  sub?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const Title: React.FC<TitleProps> = ({ content, num, sub, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ marginBottom: '16px', textAlign: 'center' }}>
          {sub && <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: sub }} />}
          <span style={{ display: 'block', fontSize: '20px', fontWeight: 500, color: '#111827', letterSpacing: '2px', borderBottom: `1px solid ${theme.primary}`, paddingBottom: '12px', margin: '0 auto', maxWidth: '80%' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'tech':
      return (
        <section style={{ marginBottom: '16px', borderBottom: `2px solid ${theme.primary}`, paddingBottom: '8px', display: 'block' }}>
          {num && <span style={{ fontSize: '24px', fontFamily: 'monospace', fontWeight: 800, color: theme.primary, marginRight: '12px', verticalAlign: 'bottom' }} dangerouslySetInnerHTML={{ __html: num }} />}
          <span style={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', letterSpacing: '1px', verticalAlign: 'bottom' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'cute':
      return (
        <section style={{ marginBottom: '16px', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', background: theme.highlight, padding: '4px 16px', borderRadius: '24px', border: `2px dashed ${theme.primary}` }}>
            {num && <span style={{ fontSize: '16px', fontWeight: 900, color: theme.primary, marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: num }} />}
            <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#374151', verticalAlign: 'middle' }}>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </span>
          </span>
        </section>
      );
    case 'classic':
      return (
        <section style={{ marginBottom: '16px', textAlign: 'center', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
          <span style={{ display: 'block', fontSize: '22px', color: '#111827', fontWeight: 'bold', letterSpacing: '2px', position: 'relative' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
          {sub && <span style={{ display: 'inline-block', fontSize: '13px', color: '#FFF', background: theme.primary, padding: '2px 8px', marginTop: '12px', letterSpacing: '2px' }} dangerouslySetInnerHTML={{ __html: sub }} />}
        </section>
      );
    case 'magazine':
      return (
        <section style={{ marginBottom: '20px', textAlign: 'center', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }}>
          {num && <span style={{ display: 'block', fontSize: '40px', fontWeight: 'bold', color: theme.primary, lineHeight: 1, marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: num }} />}
          {sub && <span style={{ display: 'block', fontSize: '11px', color: '#9CA3AF', letterSpacing: '4px', textTransform: 'uppercase', marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: sub }} />}
          <span style={{ display: 'block', fontSize: '24px', fontWeight: 'bold', color: '#111827', letterSpacing: '1px' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
          <span style={{ display: 'block', maxWidth: '60%', margin: '12px auto 0', borderBottom: '1px solid #D1D5DB' }}></span>
        </section>
      );
    case 'dark':
      return (
        <section style={{ marginBottom: '20px', textAlign: 'center' }}>
          {num && <span style={{ display: 'block', fontSize: '14px', fontFamily: 'monospace', color: theme.secondary, marginBottom: '8px' }} dangerouslySetInnerHTML={{ __html: num }} />}
          <span style={{ display: 'block', fontSize: '22px', fontWeight: 'bold', color: '#F8FAFC', letterSpacing: '1px' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
          {sub && <span style={{ display: 'block', fontSize: '12px', color: '#94A3B8', marginTop: '8px', fontFamily: 'monospace' }} dangerouslySetInnerHTML={{ __html: sub }} />}
          <span style={{ display: 'block', width: '60px', height: '2px', background: theme.gradient, margin: '12px auto 0' }}></span>
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ marginBottom: '20px', display: 'block' }}>
          {num && (
            <span style={{ display: 'inline-block', verticalAlign: 'top', fontSize: '32px', fontWeight: 800, color: theme.primary, lineHeight: 1, marginRight: '16px' }}>
              <span dangerouslySetInnerHTML={{ __html: num }} />
            </span>
          )}
          <span style={{ display: 'inline-block', verticalAlign: 'top', paddingTop: num ? '2px' : '0' }}>
            <span style={{ display: 'block', fontSize: '18px', fontWeight: 'bold', color: '#111827', marginBottom: '4px', letterSpacing: '1px' }}>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </span>
            {sub && <span style={{ display: 'block', fontSize: '12px', color: '#9CA3AF', letterSpacing: '1px', textTransform: 'uppercase' }} dangerouslySetInnerHTML={{ __html: sub }} />}
          </span>
        </section>
      );
  }
};
