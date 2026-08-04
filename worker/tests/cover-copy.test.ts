import { describe, expect, it } from 'vitest';
import { COVER_COLOR_LIST, COVER_COPY_PROMPT, COVER_TEMPLATE_IDS } from '../src/lib/coverCopyPrompt';

// 封面方案提示词与前端 app/src/components/ui/CoverTemplate.tsx 的模板/色板保持同步，
// 任何一侧增删模板或颜色时，这里都应该先红。
describe('AI 封面方案提示词', () => {
  it('模板枚举与前端 CoverTemplate 一致', () => {
    expect(COVER_TEMPLATE_IDS).toEqual(['poster', 'note', 'split', 'mark']);
  });

  it('色板与前端 COVER_COLORS 一致', () => {
    expect(COVER_COLOR_LIST).toEqual([
      '#FF2442',
      '#FF7A00',
      '#F5A623',
      '#059669',
      '#2563EB',
      '#7C3AED',
      '#111827',
    ]);
  });

  it('提示词包含全部模板 ID 和颜色值', () => {
    for (const id of COVER_TEMPLATE_IDS) {
      expect(COVER_COPY_PROMPT).toContain(`"${id}"`);
    }
    for (const color of COVER_COLOR_LIST) {
      expect(COVER_COPY_PROMPT).toContain(`"${color}"`);
    }
  });

  it('提示词约束了 JSON 返回结构与字数上限', () => {
    expect(COVER_COPY_PROMPT).toContain('"covers"');
    expect(COVER_COPY_PROMPT).toContain('"title"');
    expect(COVER_COPY_PROMPT).toContain('"subtitle"');
    expect(COVER_COPY_PROMPT).toContain('"template"');
    expect(COVER_COPY_PROMPT).toContain('"color"');
    expect(COVER_COPY_PROMPT).toContain('14');
    expect(COVER_COPY_PROMPT).toContain('20');
    expect(COVER_COPY_PROMPT).toContain('不要输出任何解释或代码围栏');
  });
});
