import type { FormatPreferenceKey, FormatPreferenceLevel, FormatPreferences } from './formatPreferences';

// 把用户自由输入的排版要求整理成结构化偏好：能识别的分句转成选项，识别不了的原样留作补充要求交给 AI。

const KEY_PATTERNS: [FormatPreferenceKey, RegExp][] = [
  ['divider', /分割线|分隔线|分隔符|分割符|分隔|分割|横线/],
  ['emphasis', /加粗|粗体|高亮|标亮|强调|重点/],
  ['headings', /小标题|标题|层级|分节|章节/],
  ['quotes', /引用|金句/],
  ['cards', /卡片|总结框|摘要框|SummaryCard|InfoCard/i],
];

const LESS_PATTERN = /不要|不用|不加|别加|别用|别|去掉|取消|无需|不需要|少|克制|减少|简洁|沿用|保持原/;
const MORE_PATTERN = /多|加|增加|丰富|密|细|明显|突出|醒目/;

export interface ParsedFormatRequest {
  preferences: Partial<FormatPreferences>;
  rest: string;
}

const detectLevel = (clause: string): Exclude<FormatPreferenceLevel, 'default'> | null => {
  if (LESS_PATTERN.test(clause)) return 'less';
  if (MORE_PATTERN.test(clause)) return 'more';
  return null;
};

export const parseFormatRequest = (text: string): ParsedFormatRequest => {
  const preferences: Partial<FormatPreferences> = {};
  const rest: string[] = [];

  // 按句号、逗号、分号、换行切分；顿号不切，"分割线、高亮多一点"整句共用一个方向
  for (const raw of text.split(/[，,。.；;！!？?\n]+/)) {
    const clause = raw.trim();
    if (!clause) continue;

    const keys = KEY_PATTERNS.filter(([, pattern]) => pattern.test(clause)).map(([key]) => key);
    const level = keys.length > 0 ? detectLevel(clause) : null;
    if (!level) {
      rest.push(clause);
      continue;
    }
    for (const key of keys) preferences[key] = level;
  }

  return { preferences, rest: rest.join('，') };
};
