import React from 'react';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE, DEFAULT_IMAGE_STYLE } from '../../core/style';
import type { LayoutStyle, ImageStyle } from '../../core/style';

interface ImageItem {
  src: string;
  alt: string;
}

interface ImageProps {
  src: string;
  alt?: string;
  images?: ImageItem[];
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  imageStyle?: ImageStyle;
}

export const ImageComponent: React.FC<ImageProps> = ({ src, alt, images, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE, imageStyle = DEFAULT_IMAGE_STYLE }) => {
  const getStyle = (): React.CSSProperties => {
    switch (imageStyle.id) {
      case 'card':
        return { borderRadius: '12px', padding: '8px', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', border: '1px solid #F3F4F6' };
      case 'floating':
        return { borderRadius: '16px', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)', overflow: 'hidden' };
      case 'polaroid':
        return { borderRadius: '4px', padding: '8px 8px 32px 8px', background: '#FFFFFF', boxShadow: '0 6px 16px rgba(0, 0, 0, 0.12)', border: '1px solid #E5E7EB' };
      case 'default':
      default:
        switch (layoutStyle.id) {
          case 'cute':
            return { borderRadius: '24px', border: `4px solid ${theme.highlight}`, boxShadow: '0 8px 16px rgba(0,0,0,0.1)' };
          case 'tech':
            return { borderRadius: '0', borderLeft: `8px solid ${theme.primary}` };
          case 'literary':
            return { borderRadius: '2px', padding: '6px', background: '#FFF', border: '1px solid #E5E7EB' };
          case 'classic':
            return { borderRadius: '2px', padding: '8px', background: '#F9FAFB', border: `1px solid ${theme.primary}` };
          case 'magazine':
            return { borderRadius: '2px', padding: '6px', background: '#FFF', border: '1px solid #E5E0D8' };
          case 'dark':
            return { borderRadius: '8px', border: '1px solid #334155' };
          case 'minimalist':
          default:
            return { borderRadius: '12px' };
        }
    }
  };

  // Multi-image horizontal gallery
  if (images && images.length > 1) {
    const count = images.length;
    // WeChat's editor strips `calc()`, so we must pre-calculate precise percentages
    // and use flexbox to ensure it stays in one row.
    const gapPx = 4;
    
    return (
      <section style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        flexDirection: 'row', 
        justifyContent: 'flex-start',
        alignItems: 'stretch'
      }}>
        {images.map((img, idx) => (
          <section
            key={idx}
            style={{
              flex: 1,
              width: `${(100 / count).toFixed(2)}%`,
              marginLeft: idx === 0 ? '0' : `${gapPx}px`,
              boxSizing: 'border-box',
              overflow: 'hidden',
              ...getStyle()
            }}
          >
            <img
              src={img.src}
              alt={img.alt || 'image'}
              style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'inherit' }}
            />
          </section>
        ))}
      </section>
    );
  }

  // Single image (default)
  return (
    <section style={{ textAlign: 'center', marginBottom: '16px', overflow: 'hidden', ...getStyle() }}>
      <img src={src} alt={alt || 'image'} style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 'inherit' }} />
    </section>
  );
};
