import React from 'react';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE } from '../../core/style';
import type { LayoutStyle } from '../../core/style';

interface ParagraphProps {
  content: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
}

export const Paragraph: React.FC<ParagraphProps> = ({ content, layoutStyle = DEFAULT_LAYOUT_STYLE }) => {
  const getStyle = () => {
    switch(layoutStyle.id) {
      case 'literary':
        return { marginBottom: '20px', fontSize: '14px', lineHeight: 2.2, textAlign: 'justify' as const, color: '#4B5563', letterSpacing: '1px' };
      case 'tech':
        return { marginBottom: '16px', fontSize: '14px', lineHeight: 1.8, textAlign: 'left' as const, color: '#374151', letterSpacing: '0.5px' };
      case 'cute':
        return { marginBottom: '16px', fontSize: '15px', lineHeight: 2, textAlign: 'justify' as const, color: '#4B5563', letterSpacing: '0.8px' };
      case 'classic':
        return { marginBottom: '20px', fontSize: '15px', lineHeight: 2, textAlign: 'justify' as const, color: '#374151', letterSpacing: '1px', fontFamily: '"Songti SC", "SimSun", STSong, serif' };
      case 'magazine':
        return { marginBottom: '24px', fontSize: '15px', lineHeight: 1.9, textAlign: 'justify' as const, color: '#374151', fontFamily: "Georgia, 'Times New Roman', 'Songti SC', serif" };
      case 'dark':
        return { marginBottom: '16px', fontSize: '15px', lineHeight: 1.8, textAlign: 'justify' as const, color: '#CBD5E1', letterSpacing: '0.5px' };
      case 'minimalist':
      default:
        return { marginBottom: '16px', fontSize: '15px', lineHeight: 1.9, textAlign: 'justify' as const, color: '#4B5563', letterSpacing: '0.8px' };
    }
  };

  return (
    <p
      style={{
        ...getStyle(),
        marginBottom: 'var(--paragraph-spacing)',
        fontSize: 'var(--body-font-size)',
        lineHeight: 'var(--body-line-height)',
        fontFamily: 'var(--body-font-family)',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};
