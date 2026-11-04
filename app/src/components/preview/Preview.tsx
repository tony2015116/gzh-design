import React, { useMemo, useRef } from 'react';
import { parseMarkdownToJSON } from '../../core/parser';
import { Title } from '../typesetter/Title';
import { Subtitle } from '../typesetter/Subtitle';
import { Heading3 } from '../typesetter/Heading3';
import { Heading4 } from '../typesetter/Heading4';
import { Paragraph } from '../typesetter/Paragraph';
import { Quote } from '../typesetter/Quote';
import { Divider } from '../typesetter/Divider';
import { ImageComponent } from '../typesetter/Image';
import { ListComponent } from '../typesetter/List';
import { InfoCard } from '../typesetter/InfoCard';
import { SummaryCard } from '../typesetter/SummaryCard';
import { ScrollCard } from '../typesetter/ScrollCard';
import { LongImageCard } from '../typesetter/LongImageCard';
import { CodeBlock } from '../typesetter/CodeBlock';
import { TableComponent } from '../typesetter/Table';
import { CoverCard } from '../typesetter/CoverCard';
import { TocCard } from '../typesetter/TocCard';
import { AuthorCard } from '../typesetter/AuthorCard';
import { DEFAULT_THEME } from '../../core/theme';
import type { Theme } from '../../core/theme';
import { DEFAULT_LAYOUT_STYLE, DEFAULT_IMAGE_STYLE } from '../../core/style';
import type { LayoutStyle, ImageStyle } from '../../core/style';
import { DEFAULT_EMPHASIS_CONFIG } from '../../core/emphasis';
import type { EmphasisConfig } from '../../core/emphasis';
import { DEFAULT_TYPOGRAPHY_CONFIG, resolveTypographyFontStack } from '../../core/typography';
import type { TypographyConfig } from '../../core/typography';
import { DEFAULT_COMPONENT_STYLE_CONFIG } from '../../core/componentStyle';
import type { ComponentStyleConfig } from '../../core/componentStyle';
import type { BlockComponent } from '../../core/types';

interface PreviewProps {
  markdown: string;
  theme?: Theme;
  layoutStyle?: LayoutStyle;
  imageStyle?: ImageStyle;
  emphasis?: EmphasisConfig;
  typography?: TypographyConfig;
  componentStyle?: ComponentStyleConfig;
  /** 复制与导出依赖默认 id 定位正文；额外渲染的预览（如 AI 结果确认）需换一个 id */
  elementId?: string;
}

export const Preview: React.FC<PreviewProps> = ({
  markdown,
  elementId = 'wechat-article-preview',
  theme = DEFAULT_THEME,
  layoutStyle = DEFAULT_LAYOUT_STYLE,
  imageStyle = DEFAULT_IMAGE_STYLE,
  emphasis = DEFAULT_EMPHASIS_CONFIG,
  typography = DEFAULT_TYPOGRAPHY_CONFIG,
  componentStyle = DEFAULT_COMPONENT_STYLE_CONFIG,
}) => {
  const components = useMemo(
    () => parseMarkdownToJSON(markdown, theme, layoutStyle, emphasis),
    [markdown, theme, layoutStyle, emphasis],
  );
  const previewRef = useRef<HTMLDivElement>(null);

  const renderComponent = (comp: BlockComponent) => {
    switch (comp.type) {
      case 'title':
        return <Title key={comp.id} content={comp.content} num={comp.metadata?.num} sub={comp.metadata?.sub} theme={theme} layoutStyle={layoutStyle} />;
      case 'subtitle':
        return <Subtitle key={comp.id} content={comp.content} step={comp.metadata?.step} theme={theme} layoutStyle={layoutStyle} />;
      case 'heading3':
        return <Heading3 key={comp.id} content={comp.content} label={comp.metadata?.label} theme={theme} layoutStyle={layoutStyle} />;
      case 'heading4':
        return <Heading4 key={comp.id} content={comp.content} level={comp.metadata?.level} theme={theme} layoutStyle={layoutStyle} />;
      case 'paragraph':
        return <Paragraph key={comp.id} content={comp.content} theme={theme} layoutStyle={layoutStyle} />;
      case 'quote':
        return <Quote key={comp.id} content={comp.content} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'divider':
        return <Divider key={comp.id} theme={theme} layoutStyle={layoutStyle} />;
      case 'image':
        return <ImageComponent key={comp.id} src={comp.content} alt={comp.metadata?.alt} images={comp.metadata?.images} theme={theme} layoutStyle={layoutStyle} imageStyle={imageStyle} componentStyle={componentStyle} />;
      case 'list':
        try {
          const items = JSON.parse(comp.content);
          return <ListComponent key={comp.id} items={items} ordered={comp.metadata?.ordered} theme={theme} layoutStyle={layoutStyle} />;
        } catch {
          return null;
        }
      case 'info_card':
        return <InfoCard key={comp.id} title={comp.metadata?.title} content={comp.content} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'summary_card':
        return <SummaryCard key={comp.id} title={comp.metadata?.title} content={comp.content} items={comp.metadata?.items} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'scroll_card':
        return <ScrollCard key={comp.id} title={comp.metadata?.title} height={comp.metadata?.height} copyMode={comp.metadata?.copyMode} hint={comp.metadata?.hint} content={comp.content} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'long_image_card':
        return <LongImageCard key={comp.id} title={comp.metadata?.title} height={comp.metadata?.height} copyMode={comp.metadata?.copyMode} hint={comp.metadata?.hint} images={comp.metadata?.images} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'code_block':
        return <CodeBlock key={comp.id} content={comp.content as string} language={comp.metadata?.language} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'table':
        return <TableComponent key={comp.id} headers={comp.metadata?.headers} rows={comp.content as string[][]} theme={theme} layoutStyle={layoutStyle} />;
      case 'cover_card':
        return <CoverCard key={comp.id} title={comp.metadata?.title} subtitle={comp.metadata?.subtitle} kicker={comp.metadata?.kicker} date={comp.metadata?.date} content={comp.content} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'toc_card':
        return <TocCard key={comp.id} title={comp.metadata?.title} items={comp.metadata?.items || []} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      case 'author_card':
        return <AuthorCard key={comp.id} name={comp.metadata?.name} avatar={comp.metadata?.avatar} content={comp.content} cta={comp.metadata?.cta} theme={theme} layoutStyle={layoutStyle} componentStyle={componentStyle} />;
      default:
        return null;
    }
  };

  const isDark = layoutStyle.id === 'dark';
  const resolvedFontFamily = resolveTypographyFontStack(typography.fontFamilyId, layoutStyle.id);
  const typographyVariables = {
    '--body-font-size': `${typography.bodySize}px`,
    '--body-line-height': typography.lineHeight,
    '--paragraph-spacing': `${typography.paragraphSpacing}px`,
    '--body-font-family': resolvedFontFamily,
    ...(typography.headingWeight !== 'follow-layout'
      ? { '--heading-font-weight': typography.headingWeight }
      : {}),
  } as React.CSSProperties;

  return (
    <div 
      ref={previewRef}
      id={elementId}
      style={{
        maxWidth: '677px',
        margin: '0 auto',
        background: isDark ? '#0F172A' : '#ffffff',
        fontFamily: resolvedFontFamily,
        color: isDark ? '#CBD5E1' : '#374151',
        lineHeight: 1.75,
        letterSpacing: '0.5px',
        overflowX: 'hidden',
        padding: `24px ${typography.contentPaddingX}px`,
        minHeight: '100%',
        ...typographyVariables,
      }}
    >
      {components.map(renderComponent)}
    </div>
  );
};
