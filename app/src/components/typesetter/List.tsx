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
      <section style={{ marginBottom: 'var(--paragraph-spacing)', paddingLeft: '8px', fontFamily: 'var(--body-font-family)' }}>
        {items.map((item, index) => (
          <p key={index} style={{ margin: '0 0 8px 0', color: '#374151', fontSize: 'var(--body-font-size)', lineHeight: 'var(--body-line-height)', textAlign: 'justify' }}>
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
      <section style={{ marginBottom: 'var(--paragraph-spacing)', paddingLeft: '8px' }}>
        {items.map((item, index) => (
          <p key={index} style={{ margin: '0 0 8px 0', color: '#CBD5E1', fontSize: 'var(--body-font-size)', lineHeight: 'var(--body-line-height)', textAlign: 'justify' }}>
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
    <section style={{ marginBottom: 'var(--paragraph-spacing)', paddingLeft: layoutStyle.id === 'tech' ? '0' : '8px', fontFamily: 'var(--body-font-family)' }}>
      {items.map((item, index) => (
        <p key={index} style={{ margin: '0 0 8px 0', color: '#4B5563', fontSize: 'var(--body-font-size)', lineHeight: 'var(--body-line-height)', textAlign: 'justify' }}>
          <span style={{ 
            color: theme.primary, 
            marginRight: '8px', 
            fontWeight: 'bold',
            fontFamily: layoutStyle.id === 'tech' ? 'monospace' : 'inherit'
          }}>{ordered ? `${index + 1}.` : bullet}</span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </p>
      ))}
    </section>
  );
};
