import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';
import { adaptCardOverrides, getLayoutTone } from './layoutTone';

interface CoverCardProps {
  title?: string;
  subtitle?: string;
  kicker?: string;
  date?: string;
  content?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

/** 文章开篇封面：栏目标签 + 日期、主标题、副标题、导语 */
export const CoverCard: React.FC<CoverCardProps> = ({
  title,
  subtitle,
  kicker,
  date,
  content,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const tone = getLayoutTone(layoutStyle, theme);
  const isDark = layoutStyle.id === 'dark';
  const centered = tone.align === 'center';
  const customStyle = adaptCardOverrides(getCardStyleOverrides(componentStyle, theme.primary), layoutStyle);

  return (
    <section
      style={{
        margin: '0 0 32px',
        padding: '24px 22px 22px',
        background: isDark ? tone.surface : '#FFFFFF',
        border: `1px solid ${tone.line}`,
        borderTop: tone.serif ? `3px double ${theme.primary}` : `4px solid ${theme.primary}`,
        borderRadius: tone.radius,
        textAlign: tone.align,
        fontFamily: tone.fontFamily,
        ...customStyle,
      }}
    >
      {(kicker || date) && (
        <p style={{ margin: '0 0 18px', fontSize: '12px', lineHeight: 1.6, letterSpacing: '1px' }}>
          {kicker && (
            <span
              style={{
                display: 'inline-block',
                padding: '2px 10px',
                background: theme.primary,
                color: '#FFFFFF',
                fontWeight: 700,
                borderRadius: tone.radius === '0' ? '0' : '999px',
                fontFamily: tone.mono ? 'monospace' : 'inherit',
                verticalAlign: 'middle',
              }}
              dangerouslySetInnerHTML={{ __html: kicker }}
            />
          )}
          {date && (
            <span
              style={{ display: 'inline-block', marginLeft: kicker ? '10px' : '0', color: tone.faint, fontFamily: tone.mono ? 'monospace' : 'inherit', verticalAlign: 'middle' }}
              dangerouslySetInnerHTML={{ __html: date }}
            />
          )}
        </p>
      )}
      {title && (
        <p
          style={{ margin: '0 0 10px', fontSize: '24px', lineHeight: 1.35, fontWeight: 'var(--heading-font-weight, 800)', color: tone.ink, letterSpacing: '1px' }}
          dangerouslySetInnerHTML={{ __html: title }}
        />
      )}
      {subtitle && (
        <p style={{ margin: '0 0 16px', fontSize: '14px', lineHeight: 1.7, color: tone.muted }} dangerouslySetInnerHTML={{ __html: subtitle }} />
      )}
      <section
        style={{
          width: '36px',
          height: '3px',
          margin: centered ? '0 auto' : '0',
          background: theme.primary,
          borderRadius: '2px',
        }}
      />
      {content && (
        <p
          style={{ margin: '16px 0 0', fontSize: '14px', lineHeight: 1.85, color: tone.muted, textAlign: centered ? 'center' : 'justify' }}
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </section>
  );
};
