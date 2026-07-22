import React, { useMemo, useRef } from 'react';
import { parseMarkdownToJSON } from '../../core/parser';
import { Title } from '../typesetter/Title';
import { Subtitle } from '../typesetter/Subtitle';
import { Paragraph } from '../typesetter/Paragraph';
import { Quote } from '../typesetter/Quote';
import { Divider } from '../typesetter/Divider';
import { ImageComponent } from '../typesetter/Image';
import { ListComponent } from '../typesetter/List';
import { InfoCard } from '../typesetter/InfoCard';
import { SummaryCard } from '../typesetter/SummaryCard';
import { CodeBlock } from '../typesetter/CodeBlock';
import { TableComponent } from '../typesetter/Table';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE, DEFAULT_IMAGE_STYLE } from '../../core/style';
import type { LayoutStyle, ImageStyle } from '../../core/style';

interface PreviewProps {
  markdown: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  imageStyle?: ImageStyle;
}

export const Preview: React.FC<PreviewProps> = ({ markdown, theme = DEFAULT_THEME, layoutStyle = DEFAULT_LAYOUT_STYLE, imageStyle = DEFAULT_IMAGE_STYLE }) => {
  const components = useMemo(() => parseMarkdownToJSON(markdown, theme, layoutStyle), [markdown, theme, layoutStyle]);
  const previewRef = useRef<HTMLDivElement>(null);

  const renderComponent = (comp: any) => {
    switch (comp.type) {
      case 'title':
        return <Title key={comp.id} content={comp.content} num={comp.metadata?.num} sub={comp.metadata?.sub} theme={theme} layoutStyle={layoutStyle} />;
      case 'subtitle':
        return <Subtitle key={comp.id} content={comp.content} step={comp.metadata?.step} theme={theme} layoutStyle={layoutStyle} />;
      case 'paragraph':
        return <Paragraph key={comp.id} content={comp.content} theme={theme} layoutStyle={layoutStyle} />;
      case 'quote':
        return <Quote key={comp.id} content={comp.content} theme={theme} layoutStyle={layoutStyle} />;
      case 'divider':
        return <Divider key={comp.id} theme={theme} layoutStyle={layoutStyle} />;
      case 'image':
        return <ImageComponent key={comp.id} src={comp.content} alt={comp.metadata?.alt} images={comp.metadata?.images} theme={theme} layoutStyle={layoutStyle} imageStyle={imageStyle} />;
      case 'list':
        try {
          const items = JSON.parse(comp.content);
          return <ListComponent key={comp.id} items={items} ordered={comp.metadata?.ordered} theme={theme} layoutStyle={layoutStyle} />;
        } catch (e) {
          return null;
        }
      case 'info_card':
        return <InfoCard key={comp.id} title={comp.metadata?.title || '提示'} content={comp.content} theme={theme} layoutStyle={layoutStyle} />;
      case 'summary_card':
        return <SummaryCard key={comp.id} title={comp.metadata?.title || '总结'} content={comp.content} items={comp.metadata?.items} theme={theme} layoutStyle={layoutStyle} />;
      case 'code_block':
        return <CodeBlock key={comp.id} content={comp.content as string} language={comp.metadata?.language} theme={theme} layoutStyle={layoutStyle} />;
      case 'table':
        return <TableComponent key={comp.id} headers={comp.metadata?.headers} rows={comp.content as string[][]} theme={theme} layoutStyle={layoutStyle} />;
      default:
        return null;
    }
  };

  const isDark = layoutStyle.id === 'dark';

  return (
    <div 
      ref={previewRef}
      id="wechat-article-preview"
      style={{
        maxWidth: '677px',
        margin: '0 auto',
        background: isDark ? '#0F172A' : '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        color: isDark ? '#CBD5E1' : '#374151',
        lineHeight: 1.75,
        letterSpacing: '0.5px',
        overflowX: 'hidden',
        padding: '24px 16px',
        minHeight: '100% '
      }}
    >
      {components.map(renderComponent)}
    </div>
  );
};
