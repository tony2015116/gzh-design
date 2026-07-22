import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface SummaryCardProps {
  title: string;
  content: string;
  items?: string[];
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({ title, content, items, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
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

  switch (layoutStyle.id) {
    case 'literary':
      return (
        <section style={{ borderTop: 'double 3px #E5E7EB', borderBottom: 'double 3px #E5E7EB', padding: '24px 16px', textAlign: 'center', margin: '0 0 24px' }}>
          <p style={{ fontSize: '15px', margin: '0 0 16px', color: '#111827', fontWeight: 500, letterSpacing: '2px' }}>
            『 {title} 』
          </p>
          <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '20px', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.primary, 'circle')}
        </section>
      );
    case 'tech':
      return (
        <section style={{ background: '#1F2937', borderTop: `4px solid ${theme.primary}`, borderRadius: '4px', padding: '24px 20px', margin: '0 0 24px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 16px', color: theme.primary, fontWeight: 800, letterSpacing: '1px', fontFamily: 'monospace' }}>
            &gt; {title.toUpperCase()}
          </p>
          <p style={{ fontSize: '14px', color: '#E5E7EB', marginBottom: '20px', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content }} />
          {items && items.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: '#D1D5DB', fontSize: '14px', lineHeight: 1.9 }}>
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
        <section style={{ background: '#FFF', border: `2px dashed ${theme.primary}`, borderRadius: '24px', padding: '24px 20px', textAlign: 'center', margin: '0 0 24px', boxShadow: `0 8px 0 ${theme.highlight}` }}>
          <p style={{ display: 'inline-block', fontSize: '15px', margin: '0 auto 16px', color: '#FFF', background: theme.primary, padding: '4px 16px', borderRadius: '16px', fontWeight: 700, letterSpacing: '1px' }}>
            {title}
          </p>
          <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#4B5563', marginBottom: '20px', lineHeight: 1.7 }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.secondary, 'circle')}
        </section>
      );
    case 'classic':
      return (
        <section style={{ border: `1px solid ${theme.primary}`, padding: '4px', margin: '0 0 24px' }}>
          <section style={{ border: `1px solid ${theme.primary}`, padding: '24px 16px', textAlign: 'center', fontFamily: '"Songti SC", "SimSun", STSong, serif' }}>
            <p style={{ fontSize: '16px', margin: '0 0 16px', color: theme.primary, fontWeight: 'bold', letterSpacing: '4px' }}>
              【 {title} 】
            </p>
            <p style={{ fontSize: '14px', color: '#111827', marginBottom: '20px', lineHeight: 1.8, fontWeight: 'bold' }} dangerouslySetInnerHTML={{ __html: content }} />
            {renderItems(theme.primary, 'text')}
          </section>
        </section>
      );
    case 'magazine':
      return (
        <section style={{ borderTop: '2px solid #111827', borderBottom: '2px solid #111827', padding: '24px 16px', textAlign: 'center', margin: '0 0 24px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }}>
          <p style={{ fontSize: '15px', margin: '0 0 16px', color: '#111827', fontWeight: 'bold', letterSpacing: '2px' }}>
            {title}
          </p>
          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '20px', lineHeight: 1.9 }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.primary, 'circle')}
        </section>
      );
    case 'dark':
      return (
        <section style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: '8px', padding: '24px 20px', margin: '0 0 24px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 16px', color: theme.primary, fontWeight: 700, letterSpacing: '1px' }}>
            {title}
          </p>
          <p style={{ fontSize: '14px', color: '#CBD5E1', marginBottom: '20px', lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: content }} />
          {items && items.length > 0 && (
            <ul style={{ margin: 0, padding: 0, listStyleType: 'none', color: '#94A3B8', fontSize: '14px', lineHeight: 1.9 }}>
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
    default:
      return (
        <section style={{ background: 'radial-gradient(circle at center, #F9FAFB 0%, #FFFFFF 100%)', border: '1px solid #E5E7EB', borderRadius: '16px', padding: '32px 20px', textAlign: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', margin: '0 0 24px' }}>
          <p style={{ fontSize: '14px', margin: '0 0 16px', color: theme.primary, fontWeight: 700, letterSpacing: '1px' }}>
            <span>{title}</span>
          </p>
          <p style={{ fontSize: '13px', fontWeight: 'bold', color: '#111827', marginBottom: '20px', lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: content }} />
          {renderItems(theme.primary, 'circle')}
        </section>
      );
  }
};
