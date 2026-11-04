import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';
import { DEFAULT_COMPONENT_STYLE_CONFIG, getCardStyleOverrides } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';
import { adaptCardOverrides, getLayoutTone } from './layoutTone';

export const DEFAULT_AUTHOR_CTA = '觉得有收获的话，欢迎点赞、在看、转发，我们下篇见';

interface AuthorCardProps {
  name?: string;
  avatar?: string;
  content?: string;
  cta?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  componentStyle?: ComponentStyleConfig;
}

/** 文末作者签名：头像 + 署名 + 简介，底部一行互动引导 */
export const AuthorCard: React.FC<AuthorCardProps> = ({
  name,
  avatar,
  content,
  cta = DEFAULT_AUTHOR_CTA,
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const tone = getLayoutTone(layoutStyle, theme);
  const customStyle = adaptCardOverrides(getCardStyleOverrides(componentStyle, theme.primary), layoutStyle);
  const centered = tone.align === 'center';

  const identity = (
    <section style={{ flex: 1, minWidth: 0, textAlign: centered ? 'center' : 'left' }}>
      {name && (
        <p style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, lineHeight: 1.5, color: tone.ink }}>
          <span dangerouslySetInnerHTML={{ __html: name }} />
        </p>
      )}
      {content && (
        <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.75, color: tone.muted }} dangerouslySetInnerHTML={{ __html: content }} />
      )}
    </section>
  );

  return (
    <section
      style={{
        margin: '32px 0 8px',
        padding: '20px 20px 16px',
        background: tone.surface,
        border: `1px solid ${tone.line}`,
        borderRadius: tone.radius,
        fontFamily: tone.fontFamily,
        ...customStyle,
      }}
    >
      {centered ? (
        <section style={{ textAlign: 'center' }}>
          {avatar && (
            <img src={avatar} alt="avatar" style={{ display: 'block', width: '56px', height: '56px', margin: '0 auto 10px', borderRadius: '50%', objectFit: 'cover' }} />
          )}
          {identity}
        </section>
      ) : (
        <section style={{ display: 'flex', alignItems: 'center' }}>
          {avatar && (
            <img src={avatar} alt="avatar" style={{ display: 'block', flexShrink: 0, width: '52px', height: '52px', marginRight: '14px', borderRadius: '50%', objectFit: 'cover' }} />
          )}
          {identity}
        </section>
      )}
      {cta && (
        <p
          style={{
            margin: '16px 0 0',
            paddingTop: '12px',
            borderTop: `1px solid ${tone.line}`,
            fontSize: '13px',
            lineHeight: 1.7,
            color: theme.primary,
            fontWeight: 600,
            textAlign: 'center',
            letterSpacing: '1px',
          }}
          dangerouslySetInnerHTML={{ __html: cta }}
        />
      )}
    </section>
  );
};
