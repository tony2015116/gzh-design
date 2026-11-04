import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';

interface SummaryCardProps {
  title?: string;
  content: string;
  items?: string[];
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  content,
  items,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const normalizedTitle = title?.trim() || '';
  const hasTitle = normalizedTitle.length > 0;
  const customStyle = getCardStyleOverrides(componentStyle, theme.primary);
  const customBodyStyle: React.CSSProperties = componentStyle.cardStyle === 'follow-layout'
    ? {}
    : { color: '#374151', fontFamily: 'var(--body-font-family)' };

  const renderItems = (bulletColor: string, bulletShape = 'circle') => {
    if (!items || items.length === 0) return null;
    return (
      <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: '#4B5563', fontSize: '14px', lineHeight: 1.9, textAlign: 'left', display: 'inline-block' }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: '8px' }}>
            <span style={{
              display: 'inline-block',
              width: bulletShape === 'circle' ? '6px' : bulletShape === 'square' ? '6px' : 'auto',
              height: bulletShape === 'circle' ? '6px' : bulletShape === 'square' ? '6px' : 'auto',
              background: bulletShape !== 'text' ? bulletColor : 'transparent',
              color: bulletColor,
              borderRadius: bulletShape === 'circle' ? '50%' : '0',
              marginRight: '8px',
              verticalAlign: 'middle',
              fontSize: '12px'
            }}>
              {bulletShape === 'text' ? '❖' : ''}
            </span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    );
  };

  const renderMinimalistItems = () => {
    if (!items || items.length === 0) return null;
    return (
      <ul style={{ margin: '0 auto', padding: 0, listStyleType: 'none', color: '#374151', fontSize: '14px', lineHeight: 1.7, textAlign: 'left', display: 'inline-block', maxWidth: '100%' }}>
        {items.map((item, index) => (
          <li key={index} style={{ marginBottom: index === items.length - 1 ? 0 : '10px', display: 'flex', alignItems: 'flex-start' }}>
            <span style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: theme.primary,
              marginTop: '9px',
              marginRight: '10px',
              flexShrink: 0,
            }} />
            <span style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: item }} />
          </li>
        ))}
      </ul>
    );
  };

  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ borderTop: 'double 3px #E5E7EB', borderBottom: 'double 3px #E5E7EB', padding: '24px 16px', textAlign: 'center', margin: '0 0 24px', ...customStyle }}>
          {hasTitle && (
            <p style={{ fontSize: '15px', margin: '0 0 16px', color: '#111827', fontWeight: 500, letterSpacing: '2px' }}>
              『 {normalizedTitle} 』
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px', lineHeight: 1.8, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.primary, 'circle')}
        </section>
      );
    case 'tech':
      return (
        <section style={{ background: '#1F2937', borderTop: `4px solid ${theme.primary}`, borderRadius: '4px', padding: '24px 20px', margin: '0 0 24px', ...customStyle }}>
          {hasTitle && (
            <p style={{ fontSize: '14px', margin: '0 0 16px', color: theme.primary, fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>
              &gt; {normalizedTitle.toUpperCase()}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#E5E7EB', marginBottom: '20px', lineHeight: 1.8, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {items && items.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: '#D1D5DB', fontSize: '14px', lineHeight: 1.9, ...customBodyStyle }}>
              {items.map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <span style={{ color: theme.primary, marginRight: '8px', fontFamily: 'monospace' }}>[{index + 1}]</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    case 'cute':
      return (
        <section style={{ background: '#FFF', border: `2px dashed ${theme.primary}`, borderRadius: '24px', padding: '24px 20px', textAlign: 'center', margin: '0 0 24px', boxShadow: `0 8px 0 ${theme.highlight}`, ...customStyle }}>
          {hasTitle && (
            <p style={{ display: 'inline-block', fontSize: '15px', margin: '0 auto 16px', color: '#FFF', background: theme.primary, padding: '4px 16px', borderRadius: '16px', fontWeight: 700, letterSpacing: '1px' }}>
              {normalizedTitle}
            </p>
          )}
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#4B5563', marginBottom: '20px', lineHeight: 1.7, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.secondary, 'circle')}
        </section>
      );
    case 'classic':
      return (
        <section style={{ border: `1px solid ${theme.primary}`, padding: '4px', margin: '0 0 24px', ...customStyle }}>
          <section style={{ border: `1px solid ${theme.primary}`, padding: '24px 16px', textAlign: 'center', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
            {hasTitle && (
              <p style={{ fontSize: '16px', margin: '0 0 16px', color: theme.primary, fontWeight: 'bold', letterSpacing: '4px' }}>
                【 {normalizedTitle} 】
              </p>
            )}
            <p style={{ fontSize: '14px', color: '#111827', marginBottom: '20px', lineHeight: 1.8, fontWeight: 'bold', ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
            {renderItems(theme.primary, 'text')}
          </section>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827', padding: '24px 16px', textAlign: 'center', margin: '0 0 24px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif", ...customStyle }}>
          {hasTitle && (
            <p style={{ fontSize: '15px', margin: '0 0 16px', color: '#111827', fontWeight: 'bold', letterSpacing: '2px' }}>
              {normalizedTitle}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '20px', lineHeight: 1.9, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.primary, 'circle')}
        </section>
      );
    case 'dark':
      return (
        <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '24px 20px', margin: '0 0 24px', ...customStyle }}>
          {hasTitle && (
            <p style={{ fontSize: '14px', margin: '0 0 16px', color: theme.primary, fontWeight: 700, letterSpacing: '1px' }}>
              {normalizedTitle}
            </p>
          )}
          <p style={{ fontSize: '14px', color: '#CBD5E1', marginBottom: '20px', lineHeight: 1.8, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          {items && items.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: '#94A3B8', fontSize: '14px', lineHeight: 1.9, ...customBodyStyle }}>
              {items.map((item, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <span style={{ color: theme.secondary, marginRight: '8px', fontWeight: 'bold' }}>•</span>
                  <span dangerouslySetInnerHTML={{ __html: item }} />
                </li>
              ))}
            </ul>
          )}
        </section>
      );
    case 'minimalist':
    default: {
      const hasContent = content && content.replace(/<[^>]*>/g, '').trim().length > 0;
      return (
        <section style={{ background: '#FFFFFF', border: '1px solid #EEF0F3', borderRadius: '14px', padding: '28px 24px 26px', textAlign: 'center', boxShadow: '0 6px 20px rgba(17,24,39,0.05)', margin: '0 0 24px', ...customStyle }}>
          {/* 顶边居中的短色条：用负边距压到边框上（公众号不支持 position:absolute） */}
          <section style={{ width: '44px', height: '3px', margin: '-29.5px auto 26.5px', borderRadius: '3px', background: theme.primary }} />
          {hasTitle && (
            <p style={{ fontSize: '17px', margin: '0 0 18px', color: '#111827', fontWeight: 700, letterSpacing: '1px', lineHeight: 1.5 }}>
              <span>{normalizedTitle}</span>
            </p>
          )}
          {hasContent && (
            <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '18px', lineHeight: 1.75, ...customBodyStyle }} dangerouslySetInnerHTML={{ __html: content }} />
          )}
          {renderMinimalistItems()}
        </section>
      );
    }
  }
};
