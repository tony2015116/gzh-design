import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface SubtitleProps {
  content: string;
  step?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const Subtitle: React.FC<SubtitleProps> = ({ content, step, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ marginBottom: '16px', borderLeft: `3px solid ${theme.primary}`, paddingLeft: '12px' }}>
          <span style={{ fontSize: '15px', fontWeight: 500, color: '#374151', letterSpacing: '1px' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'tech':
      return (
        <section style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', background: '#1F2937', color: theme.highlight, fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', marginRight: '8px', verticalAlign: 'middle', fontFamily: 'monospace' }}>
            {step || '>_'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: theme.primary, letterSpacing: '1px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'cute':
      return (
        <section style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', color: theme.primary, fontSize: '16px', marginRight: '6px', verticalAlign: 'middle' }}>✿</span>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#4B5563', letterSpacing: '0.5px', verticalAlign: 'middle', borderBottom: `2px dashed ${theme.highlight}`, paddingBottom: '2px' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'classic':
      return (
        <section style={{ marginBottom: '16px', textAlign: 'center', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
          <span style={{ display: 'inline-block', fontSize: '16px', fontWeight: 'bold', color: theme.primary, borderBottom: `1px solid ${theme.primary}`, paddingBottom: '4px' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ marginBottom: '16px', borderLeft: `3px solid ${theme.primary}`, paddingLeft: '12px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif", textAlign: 'left' }}>
          {step && <span style={{ display: 'inline-block', fontSize: '13px', fontStyle: 'italic', color: '#9CA3AF', marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: step }} />}
          <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#111827', letterSpacing: '1px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'dark':
      return (
        <section style={{ marginBottom: '16px', fontFamily: 'monospace' }}>
          <span style={{ display: 'inline-block', color: theme.primary, fontSize: '13px', fontWeight: 'bold', marginRight: '8px', verticalAlign: 'middle' }}>
            {'//'} {step || 'step'}
          </span>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#E2E8F0', letterSpacing: '0.5px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ marginBottom: '16px' }}>
          <span style={{ display: 'inline-block', background: '#111827', color: '#FFF', fontSize: '12px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '12px', marginRight: '8px', verticalAlign: 'middle' }}>
            {step || 'STEP'}
          </span>
          <span style={{ fontSize: '15px', fontWeight: 'bold', color: '#111827', borderBottom: `4px solid ${theme.highlight}`, display: 'inline-block', lineHeight: 1.2, verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
  }
};
