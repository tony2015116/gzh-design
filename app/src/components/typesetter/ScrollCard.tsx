import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';

interface ScrollCardProps {
  title?: string;
  content: string;
  height?: number;
  copyMode?: 'scroll' | 'expand';
  hint?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

const clampHeight = (height?: number) => {
  if (!Number.isFinite(height)) return 220;
  return Math.min(360, Math.max(140, Math.round(height || 220)));
};

export const ScrollCard: React.FC<ScrollCardProps> = ({
  title,
  content,
  height,
  copyMode = 'scroll',
  hint,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const normalizedTitle = title?.trim() || '';
  const hasTitle = normalizedTitle.length > 0;
  const resolvedHint = hint === undefined
    ? (copyMode === 'expand' ? '复制时展开' : '内部滑动')
    : hint.trim();
  const safeHeight = clampHeight(height);
  const isDark = layoutStyle.id === 'dark';
  const customStyle = getCardStyleOverrides(componentStyle, theme.primary);
  const sectionStyle: React.CSSProperties = {
    background: isDark ? '#111827' : '#F8FAFC',
    border: isDark ? '1px solid #334155' : `1px solid ${theme.primary}26`,
    borderTop: `3px solid ${theme.primary}`,
    borderRadius: '12px',
    margin: '0 0 24px',
    overflow: 'hidden',
    ...customStyle,
  };
  const bodyStyle: React.CSSProperties = {
    maxHeight: `${safeHeight}px`,
    overflowY: 'auto',
    overflowX: 'hidden',
    padding: hasTitle ? '14px 18px 16px' : '18px',
    color: isDark ? '#CBD5E1' : '#334155',
    fontSize: '14px',
    lineHeight: 1.8,
    wordBreak: 'break-word',
    overscrollBehavior: 'contain',
  };

  return (
    <section
      data-scroll-card="true"
      style={sectionStyle}
      aria-label={hasTitle ? normalizedTitle : '可滑动长文容器'}
    >
      {hasTitle && (
        <div
          data-scroll-card-title="true"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '12px 16px 10px',
            color: isDark ? '#E2E8F0' : '#0F172A',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '0.5px',
          }}
          >
          <span data-scroll-card-title-text="true">{normalizedTitle}</span>
          {resolvedHint && (
            <span
              data-scroll-card-hint="true"
              aria-hidden="true"
              style={{
                flexShrink: 0,
                color: theme.primary,
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                opacity: 0.82,
              }}
            >
              {resolvedHint}
            </span>
          )}
        </div>
      )}
      <section
        data-scroll-card-body="true"
        data-scroll-card-copy-mode={copyMode}
        style={bodyStyle}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};
