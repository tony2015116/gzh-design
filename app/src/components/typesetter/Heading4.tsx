import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface Heading4Props {
  content: string;
  /** 4/5/6，对应 #### / ##### / ######；不传按 4 处理 */
  level?: number;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

/**
 * H4/H5/H6：三档不同的视觉装置，梯度清晰、且都在公众号复制安全区。
 *  - H4：底部 2px accent 横线 + 粗黑
 *  - H5：accent 色实体字符 `◆ ` 前缀 + 粗深灰
 *  - H6：灰色小字 + `— ` 前缀，不加粗（备注型）
 * 全部使用块容器 + 老 CSS（border / color / font），不用 flex / 空 span / 8 位 hex。
 */
export const Heading4: React.FC<Heading4Props> = ({ content, level = 4, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  const isDark = layoutStyle.id === 'dark';

  if (level >= 6) {
    // H6 —— 备注型
    return (
      <section style={{ margin: '16px 0 8px', fontSize: '12px', color: isDark ? '#94A3B8' : '#9CA3AF', letterSpacing: '0.5px', lineHeight: 1.5 }}>
        <span style={{ marginRight: '6px' }}>—</span>
        <span dangerouslySetInnerHTML={{ __html: content }} />
      </section>
    );
  }

  if (level === 5) {
    // H5 —— 实体字符前缀
    return (
      <section style={{ margin: '18px 0 8px', fontSize: '13px', fontWeight: 'var(--heading-font-weight, 700)', color: isDark ? '#CBD5E1' : '#374151', letterSpacing: '0.5px', lineHeight: 1.5 }}>
        <span style={{ color: theme.primary, marginRight: '8px', fontSize: '11px' }}>◆</span>
        <span dangerouslySetInnerHTML={{ __html: content }} />
      </section>
    );
  }

  // H4 —— 文字下方跟随宽度的短下划线
  return (
    <section
      style={{
        margin: '20px 0 10px',
        paddingLeft: '2px',
        fontSize: '14px',
        fontWeight: 'var(--heading-font-weight, 700)',
        color: isDark ? '#E2E8F0' : '#1F2937',
        letterSpacing: '0.5px',
        lineHeight: 1.6,
      }}
    >
      <span
        style={{
          borderBottom: `2px solid ${theme.primary}`,
          paddingBottom: '3px',
        }}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </section>
  );
};
