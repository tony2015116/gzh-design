import MarkdownIt from 'markdown-it';
import type { BlockComponent } from './types';
import type { Theme } from './theme';
import type { LayoutStyle } from './style';

const md = new MarkdownIt({
  html: true,
  breaks: true,
  linkify: true,
});

// override strong token to add WeChat inline styles based on layoutStyle
md.renderer.rules.strong_open = (_tokens, _idx, _options, env, _self) => {
  const highlight = env.theme?.highlight || '#FDE68A';
  const primary = env.theme?.primary || '#059669';
  const layoutStyleId = env.layoutStyle?.id || 'minimalist';
  
  if (layoutStyleId === 'literary') {
    return `<strong style="border-bottom: 0.5px solid ${primary}; padding-bottom: 2px; font-weight: 400; color: #374151;">`;
  }
  if (layoutStyleId === 'tech') {
    return `<strong style="background: ${primary}; color: #FFF; padding: 2px 6px; border-radius: 2px; font-weight: 800; font-family: monospace;">`;
  }
  if (layoutStyleId === 'cute') {
    return `<strong style="background: ${highlight}; color: ${primary}; padding: 2px 10px; border-radius: 12px; font-weight: 800;">`;
  }
  if (layoutStyleId === 'classic') {
    return `<strong style="border-bottom: 3px double ${primary}; padding-bottom: 1px; font-weight: bold; color: #111827; font-family: 'Songti SC', 'SimSun', STSong, serif;">`;
  }
  if (layoutStyleId === 'magazine') {
    return `<strong style="font-weight: 600; color: #111827; border-bottom: 2px solid ${primary}; font-family: Georgia, 'Times New Roman', 'Songti SC', serif;">`;
  }
  if (layoutStyleId === 'dark') {
    return `<strong style="background: ${primary}; color: #FFF; padding: 2px 6px; border-radius: 4px; font-weight: 700;">`;
  }
  
  // Minimalist (default)
  return `<strong style="background: linear-gradient(120deg, ${highlight} 0%, rgba(255,255,255,0) 100%); padding: 0 4px; border-radius: 2px; font-weight: 600; color: #111827;">`;
};
md.renderer.rules.strong_close = () => {
  return '</strong>';
};

md.renderer.rules.code_inline = (tokens, idx, _options, env, _self) => {
  const primary = env.theme?.primary || '#059669';
  const content = tokens[idx].content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  if (env.layoutStyle?.id === 'dark') {
    return `<code style="background: #1E293B; color: #7DD3FC; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; margin: 0 2px;">${content}</code>`;
  }
  return `<code style="background: #efefef; color: ${primary}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; margin: 0 2px;">${content}</code>`;
};

md.renderer.rules.link_open = (_tokens, _idx, _options, env, _self) => {
  const primary = env.theme?.primary || '#059669';
  return `<a style="color: ${primary}; text-decoration: none; border-bottom: 1px dashed ${primary}; outline: none; cursor: default;">`;
};
md.renderer.rules.link_close = () => {
  return `</a>`;
};

md.renderer.rules.em_open = (_tokens, _idx, _options, env, _self) => {
  const primary = env.theme?.primary || '#059669';
  return `<em style="color: ${primary}; font-style: italic; font-weight: 300;">`;
};
md.renderer.rules.em_close = () => {
  return `</em>`;
};

md.renderer.rules.s_open = () => {
  return `<span style="text-decoration: line-through; color: #9CA3AF;">`;
};
md.renderer.rules.s_close = () => {
  return `</span>`;
};

type ParserEnv = {
  theme?: Theme;
  layoutStyle?: LayoutStyle;
};

const CUSTOM_COMPONENT_REGEX = /^<(SummaryCard|InfoCard)\b([^>]*)>([\s\S]*?)<\/\1>$/i;
const TITLE_ATTR_REGEX = /\btitle=(?:"([^"]*)"|'([^']*)')/i;
const LIST_MARKER_REGEX = /^(?:[-*+]\s+|\d+\.\s+)/;

function renderInlineLines(content: string, env: ParserEnv): string {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => md.renderInline(line, env))
    .join('<br/>');
}

function parseCustomComponent(content: string, env: ParserEnv): BlockComponent | null {
  const match = content.trim().match(CUSTOM_COMPONENT_REGEX);
  if (!match) return null;

  const [, componentName, rawAttrs, rawBody] = match;
  const titleMatch = rawAttrs.match(TITLE_ATTR_REGEX);
  const title = (titleMatch?.[1] ?? titleMatch?.[2] ?? '').trim();
  const body = rawBody.trim();

  if (componentName === 'InfoCard') {
    return {
      id: Math.random().toString(36).substring(7),
      type: 'info_card',
      content: renderInlineLines(body, env),
      metadata: { title },
    };
  }

  const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const items = lines
    .filter((line) => LIST_MARKER_REGEX.test(line))
    .map((line) => md.renderInline(line.replace(LIST_MARKER_REGEX, ''), env));
  const contentLines = lines.filter((line) => !LIST_MARKER_REGEX.test(line));

  return {
    id: Math.random().toString(36).substring(7),
    type: 'summary_card',
    content: renderInlineLines(contentLines.join('\n'), env),
    metadata: {
      title,
      items: items.length > 0 ? items : undefined,
    },
  };
}

export const parseMarkdownToJSON = (markdown: string, theme?: Theme, layoutStyle?: LayoutStyle): BlockComponent[] => {
  const env = { theme, layoutStyle };
  const tokens = md.parse(markdown, env);
  const components: BlockComponent[] = [];
  
  // We'll process the flat token array into our Component structure
  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];

    if (token.type === 'heading_open') {
      const isH1 = token.tag === 'h1';
      const contentToken = tokens[i + 1];
      const rawText = contentToken.content;
      const parts = rawText.split('|').map(p => p.trim());
      
      let props: any = {};
      let mainContent = rawText;

      if (parts.length > 1) {
        if (isH1) {
          if (parts.length >= 3) {
            props = { num: parts[0], sub: parts[2] };
            mainContent = parts[1];
          } else if (parts.length === 2) {
            props = { num: parts[0] };
            mainContent = parts[1];
          }
        } else {
          props = { step: parts[0] };
          mainContent = parts.slice(1).join(' | ');
        }
      }

      components.push({
        id: Math.random().toString(36).substring(7),
        type: isH1 ? 'title' : 'subtitle',
        content: md.renderInline(mainContent, env),
        metadata: {
          num: props.num ? md.renderInline(props.num, env) : undefined,
          sub: props.sub ? md.renderInline(props.sub, env) : undefined,
          step: props.step ? md.renderInline(props.step, env) : undefined,
        }
      });
      i += 3; // heading_open, inline, heading_close
      continue;
    }

    if (token.type === 'html_block' || token.type === 'html_inline') {
      const customComponent = parseCustomComponent(token.content, env);
      if (customComponent) {
        components.push(customComponent);
        i++;
        continue;
      }
    }

    if (token.type === 'paragraph_open') {
      const contentToken = tokens[i + 1];

      const customComponent = parseCustomComponent(contentToken.content, env);
      if (customComponent) {
        components.push(customComponent);
        i += 3;
        continue;
      }
      
      // Check if paragraph contains image(s)
      const imageTokens = contentToken.children?.filter(t => t.type === 'image') || [];
      if (imageTokens.length > 0) {
        const images = imageTokens.map(img => ({
          src: img.attrGet('src') || '',
          alt: img.content || ''
        }));
        components.push({
          id: Math.random().toString(36).substring(7),
          type: 'image',
          content: images[0].src,
          metadata: { alt: images[0].alt, images: images.length > 1 ? images : undefined }
        });
        i += 3;
        continue;
      }
      
      if (contentToken.content.trim() === '---') {
         components.push({
          id: Math.random().toString(36).substring(7),
          type: 'divider',
          content: '',
        });
      } else {
        // Here we could handle strong/highlight individually, but for standard paragraphs we can parse the inline tokens
        // For simplicity right now, we just pass the RAW content containing markdown or parse the inline text
        // If contentToken has bold (`**`), we might want to flag it or extract it.
        // Or we can let paragraph render inline HTML safely. Let's pass the raw text and parse later, or process children.
        
        components.push({
          id: Math.random().toString(36).substring(7),
          type: 'paragraph',
          content: md.renderInline(contentToken.content, env), 
        });
      }
      i += 3;
      continue;
    }

    if (token.type === 'blockquote_open') {
      // Find the closing blockquote
      let blockquoteContent = '';
      i++;
      while (i < tokens.length && tokens[i].type !== 'blockquote_close') {
         if (tokens[i].type === 'inline') {
             blockquoteContent += md.renderInline(tokens[i].content, env) + '<br/>';
         }
         i++;
      }
      // Remove trailing <br/>
      if (blockquoteContent.endsWith('<br/>')) {
        blockquoteContent = blockquoteContent.slice(0, -5);
      }
      components.push({
        id: Math.random().toString(36).substring(7),
        type: 'quote',
        content: blockquoteContent.trim(),
      });
      i++;
      continue;
    }

    if (token.type === 'bullet_list_open' || token.type === 'ordered_list_open') {
      const isOrdered = token.type === 'ordered_list_open';
      const listItems: string[] = [];
      i++;
      while (i < tokens.length && !tokens[i].type.endsWith('list_close')) {
         if (tokens[i].type === 'inline') {
             listItems.push(md.renderInline(tokens[i].content, env));
         }
         i++;
      }
      // Combine into a JSON structure for lists
      components.push({
        id: Math.random().toString(36).substring(7),
        type: 'list',
        content: JSON.stringify(listItems),
        metadata: { ordered: isOrdered },
      });
      i++;
      continue;
    }

    if (token.type === 'fence' || token.type === 'code_block') {
      components.push({
        id: Math.random().toString(36).substring(7),
        type: 'code_block',
        content: token.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>'),
        metadata: { language: token.info }
      });
      i++;
      continue;
    }

    if (token.type === 'table_open') {
       let headers: string[] = [];
       let rows: string[][] = [];
       i++;
       while (i < tokens.length && tokens[i].type !== 'table_close') {
          if (tokens[i].type === 'tr_open') {
             let isHeader = false;
             let rowData: string[] = [];
             i++;
             while (i < tokens.length && tokens[i].type !== 'tr_close') {
                if (tokens[i].type === 'th_open') isHeader = true;
                if (tokens[i].type === 'inline') {
                   rowData.push(md.renderInline(tokens[i].content, env));
                }
                i++;
             }
             if (isHeader) headers = rowData;
             else rows.push(rowData);
          }
          i++;
       }
       components.push({
          id: Math.random().toString(36).substring(7),
          type: 'table',
          content: rows,
          metadata: { headers }
       });
       i++;
       continue;
    }
    
    i++;
  }

  return components;
};
