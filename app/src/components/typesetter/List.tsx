import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface ListProps {
  items: string[];
  ordered?: boolean;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const ListComponent: React.FC<ListProps> = ({ items, ordered = false, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  if (layoutStyle.id === 'magazine') {
    return (
      <section style={{ marginBottom: '24px', paddingLeft: '8px', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }}>
        {items.map((item, index) => (
          <p key={index} style={{ margin: '0 0 8px 0', color: '#374151', fontSize: '15px', lineHeight: 1.9, textAlign: 'justify' }}>
            <span style={{ color: theme.primary, marginRight: '8px', fontWeight: ordered ? 'normal' : 'bold' }}>
              {ordered ? `${index + 1}.` : '—'}
            </span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </p>
        ))}
      </section>
    );
  }

  if (layoutStyle.id === 'dark') {
    return (
      <section style={{ marginBottom: '24px', paddingLeft: '8px' }}>
        {items.map((item, index) => (
          <p key={index} style={{ margin: '0 0 8px 0', color: '#CBD5E1', fontSize: '14px', lineHeight: 1.8, textAlign: 'justify' }}>
            <span style={{ color: theme.secondary, marginRight: '8px', fontWeight: 'bold' }}>
              {ordered ? `${index + 1}.` : '•'}
            </span>
            <span dangerouslySetInnerHTML={{ __html: item }} />
          </p>
        ))}
      </section>
    );
  }

  const getBullet = () => {
    switch (layoutStyle.id) {
      case 'literary': return '-';
      case 'tech': return '>';
      case 'cute': return '✿';
      case 'classic': return '❖';
      case 'minimalist':
      default: return '•';
    }
  };

  const bullet = getBullet();

  return (
    <section style={{ marginBottom: '24px', paddingLeft: layoutStyle.id === 'tech' ? '0' : '8px', fontFamily: layoutStyle.id === 'classic' ? '"Songti SC", "SimSun", STSong, serif' : 'inherit' }}>
      {items.map((item, index) => (
        <p key={index} style={{ margin: '0 0 8px 0', color: '#4B5563', fontSize: '14px', lineHeight: 1.9, textAlign: 'justify' }}>
          <span style={{ 
            color: theme.primary, 
            marginRight: '8px', 
            fontWeight: 'bold',
            fontFamily: layoutStyle.id === 'tech' ? 'monospace' : 'inherit'
          }}>{bullet}</span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </p>
      ))}
    </section>
  );
};
