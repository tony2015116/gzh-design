import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface Heading3Props {
  content: string;
  label?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

/** 三级标题（小节标题）：视觉上从属于二级标题，每种版式一套弱化设计 */
export const Heading3: React.FC<Heading3Props> = ({ content, label, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ marginBottom: '14px', paddingLeft: '12px' }}>
          {label && (
            <span style={{ fontSize: '12px', color: theme.primary, marginRight: '8px', letterSpacing: '1px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: 'var(--heading-font-weight, 500)', color: '#4B5563', letterSpacing: '1px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'tech':
      return (
        <section style={{ marginBottom: '14px', fontFamily: 'monospace' }}>
          <span style={{ color: theme.primary, fontSize: '13px', fontWeight: 'bold', marginRight: '8px', verticalAlign: 'middle' }}>##</span>
          {label && (
            <span style={{ fontSize: '12px', color: '#6B7280', marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '13px', fontWeight: 'var(--heading-font-weight, 600)', color: '#374151', letterSpacing: '0.5px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'cute':
      return (
        <section style={{ marginBottom: '14px' }}>
          <span style={{ display: 'inline-block', color: theme.primary, fontSize: '13px', marginRight: '6px', verticalAlign: 'middle' }}>❀</span>
          {label && (
            <span style={{ fontSize: '12px', color: theme.primary, marginRight: '6px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '14px', fontWeight: 'var(--heading-font-weight, 700)', color: theme.primary, letterSpacing: '0.5px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'classic':
      return (
        <section style={{ marginBottom: '14px', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
          {label && (
            <span style={{ fontSize: '12px', color: '#9CA3AF', marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '15px', fontWeight: 'var(--heading-font-weight, 700)', color: theme.primary, verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
          <span style={{ display: 'block', width: '40px', borderBottom: `1px solid ${theme.primary}`, marginTop: '4px' }} />
        </section>
      );
    case 'magazine':
      return (
        <section style={{ marginBottom: '14px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif", textAlign: 'left' }}>
          <span style={{ color: theme.primary, marginRight: '8px', verticalAlign: 'middle' }}>—</span>
          {label && (
            <span style={{ display: 'inline-block', fontSize: '12px', fontStyle: 'italic', color: '#9CA3AF', marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '14px', fontStyle: 'italic', fontWeight: 'var(--heading-font-weight, 700)', color: '#374151', letterSpacing: '0.5px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'dark':
      return (
        <section style={{ marginBottom: '14px', fontFamily: 'monospace' }}>
          <span style={{ display: 'inline-block', color: theme.primary, fontSize: '12px', fontWeight: 'bold', marginRight: '8px', verticalAlign: 'middle' }}>
            {'###'}
          </span>
          {label && (
            <span style={{ fontSize: '12px', color: '#64748B', marginRight: '8px', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '13px', fontWeight: 'var(--heading-font-weight, 600)', color: '#CBD5E1', letterSpacing: '0.5px', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ margin: '24px 0 12px', paddingLeft: '14px', borderLeft: `3px solid ${theme.primary}`, lineHeight: 1.4 }}>
          {label && (
            <span style={{ color: theme.primary, fontSize: '12px', fontWeight: 'bold', marginRight: '10px', letterSpacing: '0.1em', verticalAlign: 'middle' }} dangerouslySetInnerHTML={{ __html: label }} />
          )}
          <span style={{ fontSize: '15px', fontWeight: 'var(--heading-font-weight, 700)', color: '#1F2937', verticalAlign: 'middle' }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </span>
        </section>
      );
  }
};
