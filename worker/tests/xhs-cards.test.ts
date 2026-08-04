import { describe, expect, it } from 'vitest';
import { XHS_CARDS_PROMPT, XHS_LAYOUT_IDS, XHS_THEME_IDS } from '../src/lib/xhsCardsPrompt';

// 图文拆条提示词与前端 app/src/components/ui/XhsCard.tsx 的版式/主题包保持同步，
// 任何一侧增删版式或主题时，这里都应该先红。
describe('AI 图文拆条提示词', () => {
  it('版式枚举与前端 XhsCard 一致', () => {
    expect(XHS_LAYOUT_IDS).toEqual(['cover', 'checklist', 'steps', 'compare', 'quote', 'data', 'summary']);
  });

  it('主题包枚举与前端 XHS_THEME_PACKS 一致', () => {
    expect(XHS_THEME_IDS).toEqual([
      'ink-classic',
      'indigo-porcelain',
      'forest-ink',
      'kraft-paper',
      'swiss-lemon',
      'midnight-ink',
    ]);
  });

  it('提示词包含全部版式与主题 ID', () => {
    for (const id of XHS_LAYOUT_IDS) {
      expect(XHS_CARDS_PROMPT).toContain(`"layout":"${id}"`);
    }
    for (const id of XHS_THEME_IDS) {
      expect(XHS_CARDS_PROMPT).toContain(`"${id}"`);
    }
  });

  it('提示词约束了 JSON 结构、页数与字数硬上限', () => {
    expect(XHS_CARDS_PROMPT).toContain('"cards"');
    expect(XHS_CARDS_PROMPT).toContain('"theme"');
    expect(XHS_CARDS_PROMPT).toContain('第一张必须是 cover');
    expect(XHS_CARDS_PROMPT).toContain('9 张以内');
    expect(XHS_CARDS_PROMPT).toContain('禁止编造数据');
    expect(XHS_CARDS_PROMPT).toContain('不要输出任何解释或代码围栏');
  });
});
