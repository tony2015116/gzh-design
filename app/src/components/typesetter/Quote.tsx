import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getQuoteStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';

interface QuoteProps {
  content: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

export const Quote: React.FC<QuoteProps> = ({
  content,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  // 金句大字：不装框、字号大于正文，做成读者愿意截图转发的视觉停顿点
  if (componentStyle.quoteStyle === 'spotlight') {
    const isDark = layoutStyle.id === 'dark';
    return (
      <section style={{ margin: '36px 8px 32px', textAlign: 'center' }}>
        <section style={{ margin: '0 0 6px', fontSize: '44px', lineHeight: 1, height: '28px', color: theme.primary, fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700 }}>“</section>
        <section
          style={{ margin: 0, fontSize: '18px', lineHeight: 1.7, fontWeight: 700, letterSpacing: '0.5px', color: isDark ? '#F1F5F9' : '#111827', fontFamily: 'var(--body-font-family)' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
        <section style={{ width: '32px', height: '3px', margin: '16px auto 0', borderRadius: '2px', background: theme.primary }} />
      </section>
    );
  }

  const customStyle = getQuoteStyleOverrides(componentStyle, theme.primary);
  const customTextStyle: React.CSSProperties = componentStyle.quoteStyle === 'follow-layout'
    ? {}
    : {
        color: '#4B5563',
        fontFamily: 'var(--body-font-family)',
        fontStyle: componentStyle.quoteStyle === 'editorial' ? 'italic' : 'normal',
      };

  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ margin: '32px 16px', textAlign: 'center', ...customStyle }}>
          <section style={{ fontSize: '32px', color: '#D1D5DB', margin: '0 0 -16px', lineHeight: 1, fontFamily: 'serif' }}>“</section>
          <section style={{ fontSize: '14px', color: '#4B5563', margin: 0, lineHeight: 2, fontStyle: 'italic', letterSpacing: '2px', ...customTextStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          <section style={{ fontSize: '32px', color: '#D1D5DB', margin: '-8px 0 0', lineHeight: 1, fontFamily: 'serif' }}>”</section>
        </section>
      );
    case 'tech':
      return (
        <section style={{ background: '#111827', padding: '16px 20px', borderRadius: '4px', borderLeft: `2px solid ${theme.primary}`, marginBottom: '24px', ...customStyle }}>
          <section style={{ fontSize: '13px', color: '#9CA3AF', margin: 0, lineHeight: 1.8, fontFamily: 'monospace', ...customTextStyle }}>
            <span style={{ color: theme.primary, marginRight: '8px' }}>&gt;</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </section>
        </section>
      );
    case 'cute':
      return (
        <section style={{ background: theme.highlight, padding: '16px 20px', borderRadius: '24px', borderTopLeftRadius: '4px', marginBottom: '24px', boxShadow: '2px 4px 12px rgba(0,0,0,0.04)', ...customStyle }}>
          <section style={{ fontSize: '14px', color: '#374151', margin: 0, lineHeight: 1.8, ...customTextStyle }}>
            <span style={{ marginRight: '6px' }}>💬</span>
            <span dangerouslySetInnerHTML={{ __html: content }} />
          </section>
        </section>
      );
    case 'classic':
      return (
        <section style={{ padding: '16px 24px', marginBottom: '24px', border: `1px solid ${theme.primary}`, fontFamily: '"Songti SC", "SimSun", STSong, serif', textAlign: 'center', ...customStyle }}>
          {/* 『』压在边框上：用负边距代替 position:absolute（公众号不支持）。
              负边距按本版式的内边距算，换了引用样式就不画角标 */}
          {componentStyle.quoteStyle === 'follow-layout' && (
            <section style={{ margin: '-22px -8px 4px', textAlign: 'left', lineHeight: 1 }}>
              <span style={{ background: '#FFF', padding: '0 8px', color: theme.primary, fontSize: '18px' }}>『</span>
            </section>
          )}
          <section style={{ fontSize: '15px', color: '#374151', margin: 0, lineHeight: 2, letterSpacing: '1px', ...customTextStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {componentStyle.quoteStyle === 'follow-layout' && (
            <section style={{ margin: '4px -8px -26px', textAlign: 'right', lineHeight: 1 }}>
              <span style={{ background: '#FFF', padding: '0 8px', color: theme.primary, fontSize: '18px' }}>』</span>
            </section>
          )}
        </section>
      );
    case 'magazine':
      return (
        <section style={{ margin: '32px 16px', textAlign: 'center', borderTop: '1px solid #D1D5DB', borderBottom: '1px solid #D1D5DB', padding: '16px 0', ...customStyle }}>
          <section style={{ fontSize: '16px', color: '#374151', margin: 0, lineHeight: 1.9, fontStyle: 'italic', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif", ...customTextStyle }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
    case 'dark':
      return (
        <section style={{ background: '#1E293B', padding: '16px 20px', borderRadius: '4px', borderLeft: `4px solid ${theme.primary}`, marginBottom: '24px', ...customStyle }}>
          <section style={{ fontSize: '14px', color: '#94A3B8', margin: 0, lineHeight: 1.8, ...customTextStyle }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
    case 'minimalist':
    default:
      return (
        <section style={{ background: '#F9FAFB', padding: '12px 16px', borderRadius: '0 8px 8px 0', borderLeft: `4px solid ${theme.primary}`, marginBottom: '24px', ...customStyle }}>
          <section style={{ fontSize: '13px', color: '#6B7280', margin: 0, lineHeight: 1.8, textAlign: 'justify', ...customTextStyle }} dangerouslySetInnerHTML={{ __html: content }} />
        </section>
      );
  }
};
