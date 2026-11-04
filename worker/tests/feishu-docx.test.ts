import { describe, expect, it } from 'vitest';
import { convertFeishuDocToMarkdown, parseFeishuDocUrl } from '../src/lib/feishuDocx';

// 构造飞书 docx block 的辅助函数
const textRun = (content: string, style: Record<string, unknown> = {}) => ({
  text_run: { content, text_element_style: style },
});

const textBlock = (id: string, type: number, elements: any[], extra: Record<string, unknown> = {}) => ({
  block_id: id,
  block_type: type,
  text: { elements },
  ...extra,
});

const headingBlock = (id: string, level: number, elements: any[]) => ({
  block_id: id,
  block_type: 2 + level, // heading1=3 ... heading9=11
  [`heading${level}`]: { elements },
});

const page = (children: string[]) => ({ block_id: 'page', block_type: 1, children });

describe('飞书文档块 → Markdown 转换', () => {
  it('标题最多四级，更深的层级降级为四级', () => {
    const { markdown } = convertFeishuDocToMarkdown([
      page(['h1', 'h2', 'h4', 'h6']),
      headingBlock('h1', 1, [textRun('主标题')]),
      headingBlock('h2', 2, [textRun('章节')]),
      headingBlock('h4', 4, [textRun('小标题')]),
      headingBlock('h6', 6, [textRun('六级标题')]),
    ]);
    expect(markdown).toContain('# 主标题');
    expect(markdown).toContain('## 章节');
    expect(markdown).toContain('#### 小标题');
    expect(markdown).toContain('#### 六级标题');
    expect(markdown).not.toContain('######');
  });

  it('行内样式：加粗/斜体/删除线/行内代码/链接', () => {
    const { markdown } = convertFeishuDocToMarkdown([
      page(['p']),
      textBlock('p', 2, [
        textRun('普通'),
        textRun('加粗', { bold: true }),
        textRun('斜体', { italic: true }),
        textRun('删除', { strikethrough: true }),
        textRun('code', { inline_code: true }),
        textRun('链接', { link: { url: 'https%3A%2F%2Fexample.com' } }),
      ]),
    ]);
    expect(markdown).toContain('普通**加粗***斜体*~~删除~~`code`[链接](https://example.com)');
  });

  it('无序/有序/待办列表与嵌套缩进', () => {
    const { markdown } = convertFeishuDocToMarkdown([
      page(['a', 'b', 't']),
      { block_id: 'a', block_type: 12, bullet: { elements: [textRun('一级')] }, children: ['a1'] },
      { block_id: 'a1', block_type: 12, bullet: { elements: [textRun('二级')] } },
      { block_id: 'b', block_type: 13, ordered: { elements: [textRun('步骤一')] } },
      { block_id: 't', block_type: 17, todo: { elements: [textRun('已完成')], style: { done: true } } },
    ]);
    expect(markdown).toContain('- 一级');
    expect(markdown).toContain('  - 二级');
    expect(markdown).toContain('1. 步骤一');
    expect(markdown).toContain('- [x] 已完成');
  });

  it('代码块带语言标识', () => {
    const { markdown } = convertFeishuDocToMarkdown([
      page(['c']),
      {
        block_id: 'c',
        block_type: 14,
        code: { elements: [textRun('print(1)\n')], style: { language: 49 } },
      },
    ]);
    expect(markdown).toContain('```python\nprint(1)\n```');
  });

  it('引用、分割线与图片占位', () => {
    const { markdown, mediaTokens } = convertFeishuDocToMarkdown([
      page(['q', 'd', 'img']),
      textBlock('q', 15, [textRun('引用内容')], { quote: { elements: [textRun('引用内容')] } }),
      { block_id: 'd', block_type: 22 },
      { block_id: 'img', block_type: 27, image: { token: 'imgtoken123' } },
    ]);
    expect(markdown).toContain('> 引用内容');
    expect(markdown).toContain('---');
    expect(markdown).toContain('![图片](feishu-media:imgtoken123)');
    expect(mediaTokens).toEqual(['imgtoken123']);
  });

  it('表格转为 Markdown 表格，首行为表头', () => {
    const cell = (id: string, text: string) => ({
      block_id: id,
      block_type: 32,
      children: [`${id}t`],
    });
    const cellText = (id: string, text: string) => textBlock(`${id}t`, 2, [textRun(text)]);
    const { markdown } = convertFeishuDocToMarkdown([
      page(['tb']),
      {
        block_id: 'tb',
        block_type: 31,
        table: { property: { row_size: 2, column_size: 2 } },
        children: ['c1', 'c2', 'c3', 'c4'],
      },
      cell('c1', '名'), cell('c2', '值'), cell('c3', '甲'), cell('c4', '1'),
      cellText('c1', '名'), cellText('c2', '值'), cellText('c3', '甲'), cellText('c4', '1'),
    ]);
    expect(markdown).toContain('| 名 | 值 |');
    expect(markdown).toContain('| --- | --- |');
    expect(markdown).toContain('| 甲 | 1 |');
  });

  it('未知块类型有文本时按段落兜底', () => {
    const { markdown } = convertFeishuDocToMarkdown([
      page(['x']),
      { block_id: 'x', block_type: 99, custom: { elements: [textRun('兜底文本')] } },
    ]);
    expect(markdown).toContain('兜底文本');
  });
});

describe('飞书文档链接解析', () => {
  it('识别 docx / wiki / docs 链接', () => {
    expect(parseFeishuDocUrl('https://xxx.feishu.cn/docx/AbCdEf1234567890')).toEqual({
      docType: 'docx',
      docToken: 'AbCdEf1234567890',
    });
    expect(parseFeishuDocUrl('https://xxx.feishu.cn/wiki/WikiToken12345678?from=copy')).toEqual({
      docType: 'wiki',
      docToken: 'WikiToken12345678',
    });
    expect(parseFeishuDocUrl('https://xxx.feishu.cn/docs/OldDocToken12345')).toEqual({
      docType: 'docs',
      docToken: 'OldDocToken12345',
    });
  });

  it('裸 token 按 docx 兜底，乱输入返回 null', () => {
    expect(parseFeishuDocUrl('AbCdEf1234567890XyZ')).toEqual({
      docType: 'docx',
      docToken: 'AbCdEf1234567890XyZ',
    });
    expect(parseFeishuDocUrl('https://example.com/foo')).toBeNull();
    expect(parseFeishuDocUrl('不是链接')).toBeNull();
  });
});
