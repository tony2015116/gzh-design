import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';

interface LongImageItem {
  src: string;
  alt: string;
}

interface LongImageCardProps {
  title?: string;
  images?: LongImageItem[];
  height?: number;
  copyMode?: 'scroll' | 'expand';
  hint?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

const clampHeight = (height?: number) => {
  if (!Number.isFinite(height)) return 360;
  return Math.min(720, Math.max(240, Math.round(height || 360)));
};

export const LongImageCard: React.FC<LongImageCardProps> = ({
  title,
  images = [],
  height,
  copyMode = 'expand',
  hint,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const normalizedTitle = title?.trim() || '';
  const hasTitle = normalizedTitle.length > 0;
  const resolvedHint = hint === undefined ? '上下滑动查看长图' : hint.trim();
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

  return (
    <section
      data-scroll-card="true"
      data-long-image-card="true"
      style={sectionStyle}
      aria-label={hasTitle ? normalizedTitle : '可滑动长图容器'}
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
              data-long-image-card-default-hint={hint === undefined ? 'true' : undefined}
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
        data-long-image-card-body="true"
        style={{
          maxHeight: `${safeHeight}px`,
          overflowY: 'auto',
          overflowX: 'hidden',
          overscrollBehavior: 'contain',
          touchAction: 'pan-y',
          userSelect: 'none',
          background: isDark ? '#0F172A' : '#FFFFFF',
          fontSize: 0,
          lineHeight: 0,
        }}
      >
        {images.length > 0 ? images.map((image, index) => (
          <img
            key={`${image.src}-${index}`}
            src={image.src}
            alt={image.alt || '长图'}
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              maxWidth: '100%',
              height: 'auto',
              margin: '0',
              padding: '0',
              border: '0',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          />
        )) : (
          <span
            style={{
              display: 'block',
              padding: '24px 18px',
              color: isDark ? '#94A3B8' : '#64748B',
              fontSize: '13px',
              lineHeight: 1.7,
              textAlign: 'center',
            }}
          >
            请在 LongImageCard 内放入 Markdown 图片。
          </span>
        )}
      </section>
    </section>
  );
};
