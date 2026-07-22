import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';

interface HighlightProps {
  content: string;
  theme?: Theme;
}

export const Highlight: React.FC<HighlightProps> = ({ content, theme = DEFAULT_THEME }) => {
  return (
    <span style={{ 
      background: `linear-gradient(120deg, ${theme.highlight} 0%, rgba(255,255,255,0) 100%)`, 
      padding: '0 4px', 
      borderRadius: '2px', 
      fontWeight: 600, 
      color: '#111827' 
    }}>
      <span>{content}</span>
    </span>
  );
};
