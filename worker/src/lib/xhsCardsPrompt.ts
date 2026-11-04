// 与前端 app/src/components/ui/XhsCard.tsx 的主题包/版式枚举保持一致。
// 修改任一侧时，另一侧与 worker/tests/xhs-cards.test.ts 都需要同步。
export const XHS_THEME_IDS = [
  'ink-classic',
  'indigo-porcelain',
  'forest-ink',
  'kraft-paper',
  'swiss-lemon',
  'midnight-ink',
] as const;

export const XHS_STICKER_THEME_IDS = [
  'sticker-butter',
  'sticker-sea',
  'sticker-peach',
  'sticker-mint',
  'sticker-grape',
  'sticker-carbon',
] as const;

export const XHS_MINIMAL_THEME_IDS = [
  'minimal-pure',
  'minimal-caramel',
  'minimal-cobalt',
  'minimal-coral',
  'minimal-pine',
  'minimal-graphite',
] as const;

export const XHS_WORKBENCH_THEME_IDS = [
  'workbench-oak',
  'workbench-walnut',
  'workbench-linen',
] as const;

export const XHS_PULSE_THEME_IDS = [
  'pulse-copper',
  'pulse-cyan',
  'pulse-jade',
  'pulse-alert',
] as const;

export const XHS_POSTER_THEME_IDS = [
  'poster-neon',
  'poster-hot',
  'poster-electric',
  'poster-ice',
  'poster-void',
  'poster-cream',
] as const;

export const XHS_SYSTEM_IDS = ['editorial', 'sticker', 'minimal', 'workbench', 'pulse', 'poster'] as const;

export const XHS_LAYOUT_IDS = [
  'cover',
  'checklist',
  'steps',
  'compare',
  'quote',
  'data',
  'summary',
] as const;

// 内容规划方法论参考 zhouwei713/article-visual-director 的公开策略文档
// (references/xiaohongshu-carousel-structures.md 与 xiaohongshu-strategies.md)：
// 每页只承担一个阅读任务、按内容类型走模板结构、四至八字视觉短标题、
// 动作优先、拒绝空泛承诺。此处为重新表述，未复制其原文。
export const XHS_CARDS_PROMPT = `
你是一位资深的小红书图文策划。请通读用户的 Markdown 文章，把它改写成一套小红书轮播图文卡片。

【每页契约】
- 每张卡片只承担一个主阅读任务：一个论点、一段流程、一份清单，或一次对比。
- 先用一句话锁定文章的核心动作："谁、对什么、做什么、交付什么"，再围绕这条主线选卡片。
- 图集是视觉大纲，不是全文誊写；一页塞不下就拆成两页，不要压缩字号。

【结构模板（先判断文章类型，选一个作为骨架，可 ±1 页）】
- 教程类（tutorial，约 8 页）：钩子封面 → 常见误区 → 核心原理 → 关键步骤 A → 关键步骤 B → 结果验证 → 适用边界 → 行动清单
- 观点类（opinion，约 7 页）：观点冲突封面 → 常见现象 → 反直觉判断 → 支撑论据 → 具体案例 → 反例边界 → 行动建议
- 工具/评测类（review，约 8 页）：结论封面 → 适用场景 → 输入/操作 → 输出效果 → 优点 → 局限与成本 → 目标读者 → 收尾判断
- 复盘类（story，约 8 页）：转折点封面 → 起点 → 失败尝试 → 关键发现 → 采取行动 → 结果变化 → 保留边界 → 给读者的建议

【页面角色映射到 layout】
- 钩子/冲突/结论封面 → cover
- 现象/清单/边界/行动清单 → checklist
- 步骤/流程/操作 → steps
- 误区 vs 正解、前 vs 后、优点 vs 限制 → compare
- 反直觉金句、关键判断 → quote（整套图最多 1 张）
- 真实存在的数据、比例、指标 → data（禁止编造数据）
- 收尾/带走清单 → summary（末页）

【硬约束】
- 第一张必须是 cover，最后一张必须是 summary。
- 至少覆盖 3 种不同的 layout，不要 5 张都是 checklist。
- kicker：每页一个分类小标签，如 "教程 · 新手向"、"AI TOOL · 2026"，≤16 字。
- 文案：口语、动词、结果；禁止 "必看" "震撼" "干货满满" 这类空泛承诺；封面用 "我替你踩过 3 个坑" "先看这 5 步" 这种具体承诺。
- 视角：作者第一人称（我做了什么、我看到什么），第三方素材保留归因。

【版式与字数硬上限（中文以汉字计；1080×1440 画布能塞下的实测容量，超限必须砍文案不允许堆砌）】
- cover: {"layout":"cover","kicker","title","subtitle","points":[]}
  - title：**必须 4-8 个汉字**的视觉短标题（缩略图能一眼读到），最多 10 字
  - subtitle：一句具体承诺，≤18 字
  - points：**0-3 条**钩子小标签，每条 ≤8 字
- checklist: {"layout":"checklist","kicker","heading","items":[{"label","detail"}]}
  - heading ≤14 字，**3-4 条**，label ≤8 字，detail ≤16 字（label 用短语、detail 用一句解释）
- steps: {"layout":"steps","kicker","heading","steps":[{"title","desc"}]}
  - heading ≤14 字，**3 步为佳，最多 3 步**（超过请拆两页），title ≤8 字，desc ≤16 字
- compare: {"layout":"compare","kicker","heading","before":{"label","points":[]},"after":{"label","points":[]}}
  - heading ≤14 字，每侧 label ≤5 字，每侧 **2 条**，每条 ≤12 字
- quote: {"layout":"quote","kicker","quote","source"}
  - quote ≤30 字（短更有力），source ≤12 字
- data: {"layout":"data","kicker","heading","rows":[{"label","value","pct"}]}
  - 仅当文中有真实数字时使用；**3-4 行**，label ≤5 字，value ≤6 字
  - pct 是 0-100 的相对比例：同组数据里最大值对应 100，其他按比例缩放；不是原始百分号数字
- summary: {"layout":"summary","kicker","heading","items":[{"label","detail"}],"closing"}
  - heading ≤14 字，**3 条**，label ≤8 字，detail ≤16 字，closing 一句 ≤18 字的收尾判断

【文字规则再强调】
- label / heading / title 都是"短语级"：3-8 个汉字，动词开头，禁止"的"字连词、禁止解释性描述。
- detail / desc 是一句话补充，不是段落，禁止逗号连接多个短句。
- 无法压缩就删条不删字数：宁可 3 条 checklist，也不要 5 条被截断成"…"。

【视觉系统 system（六选一。先按文章调性挑一套，再从这套里挑 theme）】
- "editorial"（杂志风：衬线大标 + mono 小标签 + 发丝分栏）
  → 深度观点 / 评测 / 长文导读 / AI 方法论等"偏读"的内容
- "sticker"（手账笔记风：纸纹 + 淡网格 + 和纸胶带 + 荧光笔）
  → 心得 / 清单 / 生活攻略 / 学习记录等"偏记"的内容
- "minimal"（简约风：大量留白 + 极细字重 + 单点强调色）
  → 复盘 / 极简理念 / 高端产品 / 年终总结等"偏净"的内容
- "workbench"（工作台风：木桌面 + 便签卡 + 荧光笔 + 手绘箭头）  ★ 教程首选
  → 手把手教程 / 工作流拆解 / 工具使用手册 / 项目搭建等"偏做"的内容
- "pulse"（深色系统风：近黑底 + 扫描线 + 铜色 LED + mono 数字）  ★ 技术首选
  → 基础设施 / 后端架构 / 监控与性能 / 工程复盘 / 命令行工具等"偏系统"的内容
- "poster"（高概念海报：单一强饱和色 + 巨型粗黑体 + 极简装饰）  ★ 观点首选
  → 观点宣言 / 反直觉判断 / 金句合集 / 立场型内容等"偏喊"的内容

【主题 theme 只能落在所选 system 的主题列表里】
- editorial → [${XHS_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  科技/AI/方法论 → "indigo-porcelain"，通用/文字向 → "ink-classic"，自然/户外/生活 → "forest-ink"，
  人文/阅读/复盘 → "kraft-paper"，年轻/消费/工具 → "swiss-lemon"，游戏/影视/夜间 → "midnight-ink"
- sticker → [${XHS_STICKER_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  暖调通用 → "sticker-butter"，冷静/职场 → "sticker-sea"，情感/穿搭 → "sticker-peach"，
  自然/健康 → "sticker-mint"，创意/文艺 → "sticker-grape"，夜间/深色 → "sticker-carbon"
- minimal → [${XHS_MINIMAL_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  极简黑白 → "minimal-pure"，米灰暖色 → "minimal-caramel"，商务冷蓝 → "minimal-cobalt"，
  柔和粉色 → "minimal-coral"，自然森绿 → "minimal-pine"，暗色高级 → "minimal-graphite"
- workbench → [${XHS_WORKBENCH_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  橡木暖色/日常教程 → "workbench-oak"，胡桃暗桌/深度技艺 → "workbench-walnut"，亚麻粗纸/文艺手作 → "workbench-linen"
- pulse → [${XHS_PULSE_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  基础设施/复古 → "pulse-copper"，数据/前端 → "pulse-cyan"，绿色终端/命令行 → "pulse-jade"，警报/事故复盘 → "pulse-alert"
- poster → [${XHS_POSTER_THEME_IDS.map((t) => `"${t}"`).join(', ')}]
  锋利宣言 → "poster-neon"，情绪冲击 → "poster-hot"，警示/热点 → "poster-electric"，
  冷静立场 → "poster-ice"，反主流/极客 → "poster-void"，克制文艺 → "poster-cream"

只返回一个 JSON 对象，不要输出任何解释或代码围栏：
{"system": "editorial", "theme": "ink-classic", "cards": [{"layout": "cover", ...}]}
`;
