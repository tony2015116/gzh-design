import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';
import { adaptCardOverrides, getLayoutTone } from './layoutTone';

interface TocCardProps {
  title?: string;
  items: string[];
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

/** 导读卡：列出本文看点，未手写条目时由解析器用全文二级标题补齐 */
export const TocCard: React.FC<TocCardProps> = ({
  title,
  items,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  if (items.length === 0) return null;

  const tone = getLayoutTone(layoutStyle, theme);
  const customStyle = adaptCardOverrides(getCardStyleOverrides(componentStyle, theme.primary), layoutStyle);
  const heading = title?.trim() || '本文导读';

  return (
    <section
      style={{
        margin: '0 0 28px',
        padding: '16px 18px 6px',
        background: tone.surface,
        borderLeft: tone.align === 'center' ? 'none' : `3px solid ${theme.primary}`,
        borderRadius: tone.radius,
        fontFamily: tone.fontFamily,
        ...customStyle,
      }}
    >
      <p
        style={{
          margin: '0 0 6px',
          fontSize: '13px',
          fontWeight: 700,
          lineHeight: 1.6,
          letterSpacing: '2px',
          color: theme.primary,
          textAlign: tone.align,
          fontFamily: tone.mono ? 'monospace' : 'inherit',
        }}
      >
        {heading}
      </p>
      {items.map((item, index) => (
        <p
          key={index}
          style={{
            margin: 0,
            padding: '9px 0',
            fontSize: '14px',
            lineHeight: 1.6,
            color: tone.ink,
            borderTop: index === 0 ? 'none' : `1px solid ${tone.line}`,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              minWidth: '28px',
              marginRight: '8px',
              color: theme.primary,
              fontWeight: 800,
              fontFamily: tone.serif ? 'inherit' : 'monospace',
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </p>
      ))}
    </section>
  );
};
