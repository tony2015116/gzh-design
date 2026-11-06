---
name: luobo-gzh-design
display_name: 公众号排版（萝卜哥）
display_name_en: Luobo WeChat Article Typesetter
description: 把 Markdown 文章排版成公众号可粘贴的 HTML，效果与「公众号排版系统」网站预览完全一致。触发关键词：公众号排版、微信排版、gzh 排版、typeset for wechat。产物是一个带"复制到公众号"按钮的 HTML 页面，用户在浏览器打开点一下按钮，粘贴到公众号编辑器就是排好版的效果。
description_zh: 把 Markdown 一键排版成公众号编辑器可直接粘贴的 HTML，自带 6 套风格方案、封面/导读/签名组件和兼容校验。
description_en: Turn a Markdown article into HTML ready to paste into the WeChat Official Account editor. Ships 6 style schemes, cover/TOC/signature components, and a built-in compatibility checker.
examples_zh:
  - "把这篇 Markdown 排成公众号可粘贴的 HTML"
  - "用玉石商务风格排版，加上封面和文末签名"
  - "按工具盘点的套路，帮我把这份清单排一下"
examples_en:
  - "Typeset this Markdown into HTML I can paste into my WeChat article"
  - "Use the jade-business scheme, add a cover card and author signature"
  - "Format this tool roundup following the listicle recipe"
version: 1.1.0
author: 萝卜哥
---

# 公众号排版 (luobo-gzh-design)

把一篇 Markdown 文章排成微信公众号编辑器可直接粘贴的 HTML。

渲染用的是**网站同一套排版引擎**（解析器 + 全部排版组件 + 风格方案），打包成了 [scripts/renderer.bundle.mjs](scripts/renderer.bundle.mjs)。所以 skill 排出来的样子 = 网站预览的样子，网站支持的语法 skill 全都支持。运行只需要 Node.js（≥18），不用 npm install。

> 其他 agent（Codex / Cursor / WorkBuddy 等）走同目录的 [AGENTS.md](AGENTS.md)，工作流和产物一致。

## 什么时候用

- "帮我排版这篇文章"（上下文里有 Markdown）
- "公众号排版" / "微信排版"
- "把 xxx.md 排成公众号能贴的样式"

不适用：只改文字不改格式；做小红书图文（用网站的图片导出中心）。

## 工作流（六步，不要跳）

### 1. 读文章，判断类型

读用户给的 Markdown（或粘贴的正文）。判断主导类型，后面选风格和组件配方都靠它：

教程 / 操作指南 · 清单 / 工具盘点 · 评测 / 对比 · 观点 / 深度分析 · 心得 / 复盘 / 故事 · 资讯 / 快评

### 2. 确认风格方案（默认要问）

读 [references/style-schemes.md](references/style-schemes.md)，按文章类型给出：**首选**（说明理由）、**备选**、**反差款**（气质明显不同的一套，让用户能跳出你的判断）。用 `AskUserQuestion` 问，首选加"(推荐)"。

不用问的情况：
- 用户已点名方案 / 版式 / 主题色（"用墨玉宋韵"、"暗黑风"、"蓝色"）→ 直接用
- 用户说"你定 / 自动 / 一键 / 不用问" → 按类型选首选，交付时说明理由
- 用户给了网站导出的「我的预设」JSON → 用 `--scheme-file`

### 3. 改写 Markdown（你自己改，不调外部模型）

读 [references/formatting-rules.md](references/formatting-rules.md)（改写规则 + 按文章类型的组件配方）和 [references/typesetting-syntax.md](references/typesetting-syntax.md)（全部可用语法）。核心动作：

- 标题加 kicker：`# 01 | 主标题 | 副标题`、`## STEP 01 | 小节`。**二级标题一定带标签**，kicker 要匹配段落语义（STEP 只用于顺序步骤）
- 按配方表决定用哪些组件：封面 `CoverCard`、导读 `TocCard`、提示 `InfoCard`、总结 `SummaryCard`、签名 `AuthorCard`、表格、多图并排……
- 关键短语 `**加粗**`，独立成立的判断句拆成 `> 引用`
- 中文正文用全角标点（代码里的不动）

改写结果写到新文件（如 `<原名>.typeset.md`），**原文件不动**。

### 4. 渲染

```bash
node <skill 目录>/scripts/typeset.mjs --input <改写后.md> --scheme <方案id或中文名> --title "<文章标题>" --out <产物.html>
```

| 参数 | 说明 |
|---|---|
| `--input` | 改写后的 Markdown（必填） |
| `--scheme` | 方案 id 或中文名，默认 `jade-business` |
| `--layout` / `--theme` | 在方案基础上单独换版式 / 主题色（id 见 style-schemes.md） |
| `--scheme-file` | 网站「我的预设」导出的 JSON，里面的自定义方案可直接用 id 或名字选 |
| `--title` | 产物页顶栏显示的标题 |
| `--out` | 产物路径，默认与输入同目录同名 `.html` |
| `--list-schemes` | 列出所有可用方案 |

### 5. 看校验结果

脚本最后会跑公众号兼容校验（规则说明见 [references/wechat-compat.md](references/wechat-compat.md)）：

- `通过` / 只有 WARNING → 可以交付，WARNING 里有渐变底色提示的，交付时提一句"加粗用了渐变底色，个别情况下公众号会提示深色模式适配"，用户介意可换方案或让网站上把强调样式改成"均匀浅底"
- 退出码 2（有 ERROR）→ 通常是 Markdown 里手写了 HTML（`<div>`、`class`、`<style>` 等），回到第 3 步改成标准语法再渲染
- 想单独检查某个 HTML：`node <skill 目录>/scripts/validate.mjs <file.html>`

### 6. 交付

告诉用户三件事：
1. 用了哪个方案（一句话理由）
2. 对原文做了哪些排版处理（3–5 条：标题、加了哪些组件、加粗/引用大概几处）
3. 产物的绝对路径 + "浏览器打开，点右上角「复制到公众号」，到公众号编辑器粘贴"

如果用了 `AuthorCard` 但用户没给署名，提醒用户替换占位署名。

## 常见误区

- **不要**手写 HTML 交付 —— 必须走脚本，排版才和网站一致、才有复制按钮和校验
- **不要**改原始 Markdown 文件
- **不要**编造原文没有的事实、观点、数据；**不要**编造作者名、头像、日期（用户没给就不写或留占位）
- **不要**每种组件都堆一遍 —— 按配方表挑，宁少勿滥
- **不要**修改 `scripts/renderer.bundle.mjs` / `copy-client.js`，它们是从网站源码生成的

## 维护说明（给开发者）

`renderer.bundle.mjs` 和 `copy-client.js` 由网站源码生成：网站排版组件、解析器或风格方案有改动后，在 `app/` 下执行 `npm run build:skill` 重新打包。入口源码在 `app/src/skill/`。
