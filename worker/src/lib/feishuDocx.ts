// 飞书 docx 块结构 → Markdown 转换层（纯函数，可单测）。
// 块类型枚举与文本结构以飞书开放平台 docx v1 文档为准。
// 输出对齐本工具的排版语法：标题最多四级（更多层级降级为四级），
// callout/引用转 blockquote，图片先占位 feishu-media:{token} 由路由层替换。

export interface FeishuConvertResult {
  markdown: string;
  /** 文档中出现的图片 token，需要路由层下载并替换 feishu-media: 占位 */
  mediaTokens: string[];
}

type Block = {
  block_id: string;
  block_type: number;
  children?: string[];
  [key: string]: any;
};

// 飞书代码块语言枚举（docx v1 code.style.language）
const CODE_LANGUAGES: Record<number, string> = {
  1: '', 7: 'bash', 12: 'css', 22: 'go', 24: 'html', 26: 'http', 28: 'json',
  29: 'java', 30: 'javascript', 32: 'kotlin', 36: 'lua', 39: 'markdown',
  43: 'php', 46: 'powershell', 49: 'python', 52: 'ruby', 53: 'rust',
  56: 'sql', 60: 'shell', 61: 'swift', 63: 'typescript', 66: 'xml', 67: 'yaml',
  69: 'diff', 71: 'graphql', 75: 'toml',
};

const escapeLinkUrl = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

/** 渲染一段 text_run 元素数组为 Markdown 行内文本 */
const renderElements = (elements: any[] | undefined): string => {
  if (!Array.isArray(elements)) return '';
  return elements
    .map((el) => {
      if (el.text_run) {
        const style = el.text_run.text_element_style || {};
        let text: string = el.text_run.content ?? '';
        if (!text) return '';
        if (style.inline_code) text = `\`${text}\``;
        if (style.bold) text = `**${text}**`;
        if (style.italic) text = `*${text}*`;
        if (style.strikethrough) text = `~~${text}~~`;
        if (style.link?.url) text = `[${text}](${escapeLinkUrl(style.link.url)})`;
        return text;
      }
      if (el.mention_doc) {
        const title = el.mention_doc.title || '文档';
        const url = el.mention_doc.url ? escapeLinkUrl(el.mention_doc.url) : '';
        return url ? `[${title}](${url})` : title;
      }
      if (el.equation) {
        return `$${el.equation.content ?? ''}$`;
      }
      return '';
    })
    .join('');
};

/** 取出块内联文本：不同块类型字段名不同（text / heading1..9 / bullet / ordered / quote / todo / callout） */
const blockInlineText = (block: Block): string => {
  for (const key of Object.keys(block)) {
    const value = block[key];
    if (value && typeof value === 'object' && Array.isArray(value.elements)) {
      return renderElements(value.elements);
    }
  }
  return '';
};

const blockStyle = (block: Block, key: string): any => block[key]?.style ?? {};

export const convertFeishuDocToMarkdown = (blocks: Block[]): FeishuConvertResult => {
  const byId = new Map<string, Block>();
  for (const block of blocks) byId.set(block.block_id, block);

  const page = blocks.find((b) => b.block_type === 1) ?? blocks[0];
  const mediaTokens: string[] = [];
  const lines: string[] = [];

  const push = (line: string) => {
    lines.push(line);
  };
  const blank = () => {
    if (lines.length > 0 && lines[lines.length - 1] !== '') lines.push('');
  };

  const walk = (blockId: string, depth: number, quoted: boolean) => {
    const block = byId.get(blockId);
    if (!block) return;
    const prefix = quoted ? '> ' : '';
    const indent = '  '.repeat(depth);

    switch (block.block_type) {
      case 1: // page 根节点
      case 24: // grid 分栏：直接顺序展开
      case 25: { // grid_column
        for (const child of block.children ?? []) walk(child, depth, quoted);
        return;
      }
      case 34: { // quote_container：子块整体进引用
        blank();
        for (const child of block.children ?? []) walk(child, depth, true);
        blank();
        return;
      }
      case 2: { // 普通文本
        const text = blockInlineText(block);
        if (text.trim()) {
          blank();
          push(`${prefix}${indent}${text}`);
          blank();
        }
        break;
      }
      case 3: case 4: case 5: case 6:
      case 7: case 8: case 9: case 10: case 11: { // heading1-9，最多四级
        const level = Math.min(block.block_type - 2, 4);
        const text = blockInlineText(block);
        if (text.trim()) {
          blank();
          push(`${prefix}${'#'.repeat(level)} ${text}`);
          blank();
        }
        break;
      }
      case 12: { // 无序列表
        push(`${prefix}${indent}- ${blockInlineText(block)}`);
        for (const child of block.children ?? []) walk(child, depth + 1, quoted);
        return;
      }
      case 13: { // 有序列表
        push(`${prefix}${indent}1. ${blockInlineText(block)}`);
        for (const child of block.children ?? []) walk(child, depth + 1, quoted);
        return;
      }
      case 17: { // 待办
        const done = Boolean(blockStyle(block, 'todo').done);
        push(`${prefix}${indent}- [${done ? 'x' : ' '}] ${blockInlineText(block)}`);
        for (const child of block.children ?? []) walk(child, depth + 1, quoted);
        return;
      }
      case 14: { // 代码块
        const lang = CODE_LANGUAGES[blockStyle(block, 'code').language as number] ?? '';
        const code = (block.code?.elements ?? [])
          .map((el: any) => el.text_run?.content ?? '')
          .join('')
          .replace(/\n$/, '');
        blank();
        push(`${prefix}\`\`\`${lang}`);
        for (const line of code.split('\n')) push(`${prefix}${line}`);
        push(`${prefix}\`\`\``);
        blank();
        return;
      }
      case 15: { // 单行引用
        const text = blockInlineText(block);
        if (text.trim()) {
          blank();
          push(`${prefix}> ${text}`);
          blank();
        }
        break;
      }
      case 19: { // callout：用引用承接
        blank();
        push(`${prefix}> `);
        for (const child of block.children ?? []) walk(child, depth, true);
        blank();
        return;
      }
      case 22: { // 分割线
        blank();
        push(`${prefix}---`);
        blank();
        return;
      }
      case 27: { // 图片
        const token = block.image?.token;
        if (token) {
          mediaTokens.push(token);
          blank();
          push(`${prefix}![图片](feishu-media:${token})`);
          blank();
        }
        return;
      }
      case 31: { // 表格
        const rows = block.table?.property?.row_size ?? 0;
        const cols = block.table?.property?.column_size ?? 0;
        const cells = (block.children ?? [])
          .map((cellId) => byId.get(cellId))
          .filter(Boolean) as Block[];
        if (rows > 0 && cols > 0 && cells.length >= rows * cols) {
          blank();
          for (let r = 0; r < rows; r++) {
            const rowCells = cells.slice(r * cols, (r + 1) * cols).map((cell) => {
              const text = (cell.children ?? [])
                .map((childId) => {
                  const child = byId.get(childId);
                  return child ? blockInlineText(child) : '';
                })
                .join(' ')
                .replace(/\|/g, '\\|')
                .trim();
              return text || ' ';
            });
            push(`${prefix}| ${rowCells.join(' | ')} |`);
            if (r === 0) {
              push(`${prefix}| ${rowCells.map(() => '---').join(' | ')} |`);
            }
          }
          blank();
        }
        return;
      }
      case 32: // table_cell：由 table 分支处理
        return;
      default: {
        // 未识别的块：有文本就按段落兜底，没文本跳过
        const text = blockInlineText(block);
        if (text.trim()) {
          blank();
          push(`${prefix}${indent}${text}`);
          blank();
        }
        for (const child of block.children ?? []) walk(child, depth, quoted);
        return;
      }
    }

    // 有子块的容器类（页面/列表已 return）：继续下钻
    for (const child of block.children ?? []) walk(child, depth, quoted);
  };

  for (const child of page.children ?? []) walk(child, 0, false);

  // 清理：折叠 3 个以上连续空行，去首尾空行
  const cleaned = lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^(> \n)+/g, '')
    .trim();

  return { markdown: cleaned, mediaTokens };
};

/** 从飞书文档链接解析 docToken 与类型（docx / wiki / docs） */
export const parseFeishuDocUrl = (
  input: string,
): { docToken: string; docType: 'docx' | 'wiki' | 'docs' } | null => {
  const trimmed = input.trim();
  const match = trimmed.match(/(?:feishu|larksuite)\.[a-z.]+\/(docx|wiki|docs)\/([A-Za-z0-9]+)/);
  if (match) {
    return { docType: match[1] as 'docx' | 'wiki' | 'docs', docToken: match[2] };
  }
  // 裸 token 兜底
  if (/^[A-Za-z0-9]{12,}$/.test(trimmed)) {
    return { docType: 'docx', docToken: trimmed };
  }
  return null;
};
