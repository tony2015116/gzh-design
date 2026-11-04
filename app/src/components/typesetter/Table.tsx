import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

export interface TableComponentProps {
  headers: string[];
  rows: string[][];
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const TableComponent: React.FC<TableComponentProps> = ({ headers, rows, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  if (!headers || !rows) return null;

  const getStyle = () => {
    switch (layoutStyle.id) {
      case 'literary':
        return { table: { borderTop: '2px solid #374151', borderBottom: '2px solid #374151' }, th: { borderBottom: '1px solid #E5E7EB', fontWeight: 500 }, td: { borderBottom: '1px dashed #E5E7EB' } };
      case 'tech':
        return { table: { border: `1px solid ${theme.primary}` }, th: { background: theme.primary, color: '#FFF' }, td: { border: '1px solid #E5E7EB' } };
      case 'cute':
        return { table: { border: `2px dashed ${theme.primary}`, borderRadius: '12px', overflow: 'hidden' }, th: { background: theme.highlight, color: theme.primary }, td: { borderBottom: `1px dashed ${theme.highlight}` } };
      case 'classic':
        return { table: { border: '3px double #374151' }, th: { borderBottom: '1px solid #374151', fontFamily: '"Songti SC", "SimSun", STSong, serif', fontWeight: 'bold' }, td: { borderBottom: '1px solid #E5E7EB', fontFamily: '"Songti SC", "SimSun", STSong, serif' } };
      case 'magazine':
        return { table: { borderTop: '2px solid #111827', borderBottom: '2px solid #111827', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" }, th: { borderBottom: '1px solid #D1D5DB', color: '#111827', fontWeight: 'bold' }, td: { borderBottom: 'none', color: '#374151' } };
      case 'dark':
        return { table: { borderTop: '1px solid #334155', borderBottom: '1px solid #334155' }, th: { background: '#1E293B', color: '#F8FAFC', fontWeight: 600 }, td: { borderBottom: '1px solid #334155', color: '#CBD5E1' } };
      case 'minimalist':
      default:
        return { table: { width: '100%', borderCollapse: 'collapse' as const }, th: { background: '#F9FAFB', borderBottom: '2px solid #E5E7EB', color: '#374151', fontWeight: 600 }, td: { borderBottom: '1px solid #E5E7EB', color: '#4B5563' } };
    }
  };

  const s = getStyle();

  return (
    <table style={{ 
      width: '100%', 
      borderCollapse: layoutStyle.id === 'cute' ? 'separate' : 'collapse',
      borderSpacing: 0,
      textAlign: 'left', 
      fontSize: 'var(--body-font-size)',
      lineHeight: 'var(--body-line-height)',
      marginBottom: 'var(--paragraph-spacing)',
      fontFamily: 'var(--body-font-family)',
      borderRadius: layoutStyle.id === 'cute' ? '12px' : '0',
      overflow: 'hidden',
      ...s.table 
    }}>
      <thead>
        <tr>
          {headers.map((hc, i) => (
            <th key={i} style={{ padding: '10px 12px', ...s.th }} dangerouslySetInnerHTML={{ __html: hc }} />
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} style={{ background: layoutStyle.id === 'minimalist' && i % 2 !== 0 ? '#F9FAFB' : 'transparent' }}>
            {row.map((cell, j) => (
              <td key={j} style={{ padding: '10px 12px', ...s.td }} dangerouslySetInnerHTML={{ __html: cell }} />
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
