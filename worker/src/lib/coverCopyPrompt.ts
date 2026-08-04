// 与前端 app/src/components/ui/CoverTemplate.tsx 的模板/色板保持一致。
// 修改任一侧时，另一侧与 worker/tests/cover-copy.test.ts 都需要同步。
export const COVER_TEMPLATE_IDS = ['poster', 'note', 'split', 'mark'] as const;

export const COVER_COLOR_LIST = [
  '#FF2442',
  '#FF7A00',
  '#F5A623',
  '#059669',
  '#2563EB',
  '#7C3AED',
  '#111827',
] as const;

export const COVER_COPY_PROMPT = `
你是一位资深的小红书内容策划，擅长写高点击率的爆款封面文案。

请通读用户给出的 Markdown 文章，为它设计 3 套风格不同的小红书封面方案。

要求：
- 每套方案包含：主标题 title、副标题 subtitle、模板 template、主题色 color。
- 主标题：不超过 14 个字，要有钩子感（数字、痛点、结果承诺、反差），禁止使用"震惊""不看后悔"等低质标题党词汇。
- 副标题：不超过 20 个字，补充信息量或点明受众，可以为空字符串。
- template 只能从 [${COVER_TEMPLATE_IDS.map((t) => `"${t}"`).join(', ')}] 中选择，含义分别是：大字报、便签纸、撞色分割、荧光笔记。
- color 只能从 [${COVER_COLOR_LIST.map((c) => `"${c}"`).join(', ')}] 中选择，需与文案情绪匹配。
- 3 套方案的文案角度和模板选择要互相错开。

只返回一个 JSON 对象，不要输出任何解释或代码围栏：
{"covers": [{"title": "...", "subtitle": "...", "template": "poster", "color": "#FF2442"}]}
`;
