import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface InfoCardProps {
  title: string;
  content: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, content, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', padding: '16px 20px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 8px', letterSpacing: '2px' }}>
            <span>— {title} —</span>
          </p>
          <p style={{ fontSize: '15px', color: theme.primary, margin: 0, lineHeight: 1.6, fontWeight: 500 }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'tech':
      return (
        <section style={{ background: '#F3F4F6', borderLeft: `4px solid ${theme.primary}`, padding: '12px 16px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 800, fontFamily: 'monospace', color: theme.primary, marginRight: '8px' }}>[{title}]</span>
            <span style={{ fontWeight: 600 }} dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'cute':
      return (
        <section style={{ background: theme.highlight, borderRadius: '16px', padding: '16px', marginBottom: '24px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <p style={{ fontSize: '15px', color: '#374151', margin: 0, lineHeight: 1.6, fontWeight: 700 }}>
            <span style={{ color: theme.primary, marginRight: '4px' }}>💡 {title}:</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'classic':
      return (
        <section style={{ borderTop: `1px solid ${theme.primary}`, borderBottom: `1px solid ${theme.primary}`, padding: '16px 8px', marginBottom: '24px', textAlign: 'center', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
          <p style={{ fontSize: '15px', color: '#111827', margin: 0, lineHeight: 1.8 }}>
            <span style={{ fontWeight: 'bold', color: theme.primary }}>【{title}】</span>
            <span style={{ fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827', padding: '16px 8px', marginBottom: '24px', textAlign: 'center', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }}>
          <p style={{ fontSize: '13px', color: '#111827', margin: '0 0 8px', letterSpacing: '2px', fontWeight: 'bold' }}>
            <span>{title}</span>
          </p>
          <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.8 }}>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'dark':
      return (
        <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px' }}>
          <p style={{ fontSize: '14px', color: '#CBD5E1', margin: 0, lineHeight: 1.6 }}>
            <span style={{ fontWeight: 'bold', color: theme.primary, marginRight: '8px' }}>{title}</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </p>
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ background: '#FFF', border: '1px dashed #BBF7D0', borderRadius: '8px', padding: '14px 16px', marginBottom: '24px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.6 }}>
            <span>{title}：</span>
            <strong style={{ color: theme.primary, borderBottom: `3px solid ${theme.highlight}`, fontSize: '15px' }}>
              <span dangerouslySetInnerHTML={{ __html: content }} />
            </strong>
          </p>
        </section>
      );
  }
};
