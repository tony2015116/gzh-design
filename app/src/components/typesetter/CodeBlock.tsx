import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface CodeBlockProps {
  content: string;
  language?: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ content, language, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  const getStyle = () => {
    switch (layoutStyle.id) {
      case 'literary':
        return { container: { border: '1px solid #E5E7EB', background: '#FFF', padding: '16px' }, text: { color: '#374151', fontSize: '12px' } };
      case 'tech':
        return { container: { background: '#1E1E1E', borderRadius: '8px', padding: '0', overflow: 'hidden' }, text: { color: '#D4D4D4', fontSize: '13px', padding: '16px' }, macBar: true };
      case 'cute':
        return { container: { background: '#F8FAFC', border: `2px dashed ${theme.primary}`, borderRadius: '24px', padding: '0', overflow: 'hidden' }, text: { color: '#475569', fontSize: '13px', padding: '16px' }, macBar: true };
      case 'classic':
        return { container: { borderTop: 'double 3px #9CA3AF', borderBottom: 'double 3px #9CA3AF', background: '#F9FAFB', padding: '16px' }, text: { color: '#111827', fontSize: '13px' } };
      case 'magazine':
        return { container: { background: '#F7F5F0', border: '1px solid #E5E0D8', padding: '16px' }, text: { color: '#374151', fontSize: '13px' } };
      case 'dark':
        return { container: { background: '#020617', border: '1px solid #1E293B', borderRadius: '8px', padding: '16px' }, text: { color: '#7DD3FC', fontSize: '13px' } };
      case 'minimalist':
      default:
        return { container: { background: '#F3F4F6', borderRadius: '4px', padding: '16px' }, text: { color: '#1F2937', fontSize: '13px' } };
    }
  };

  const style = getStyle();

  return (
    <section style={{ marginBottom: '16px', ...style.container }}>
      {style.macBar && (
        <div style={{ background: layoutStyle.id === 'tech' ? '#2D2D2D' : '#E2E8F0', padding: '8px 16px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#EF4444', marginRight: '6px', verticalAlign: 'middle' }}></span>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#F59E0B', marginRight: '6px', verticalAlign: 'middle' }}></span>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: '#10B981', verticalAlign: 'middle' }}></span>
          {language && <span style={{ float: 'right', fontSize: '10px', color: layoutStyle.id === 'tech' ? '#9CA3AF' : '#64748B', fontFamily: 'monospace', verticalAlign: 'middle', marginTop: '2px' }}>{language}</span>}
        </div>
      )}
      <section style={{ margin: 0, overflowX: 'auto', wordBreak: 'break-all', fontFamily: '"Fira Code", "Courier New", Courier, monospace', ...style.text }}>
        <span dangerouslySetInnerHTML={{ __html: content }} />
      </section>
    </section>
  );
};
