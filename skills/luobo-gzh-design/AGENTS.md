# luobo-gzh-design（通用 Agent 入口）

这是给 Codex / Cursor / WorkBuddy / Windsurf / Cline / 自建 agent / 手动 Prompt 用的入口。Claude Code 读同目录的 [SKILL.md](SKILL.md)。**两份文档是同一套工作流、同一套脚本，产物完全一致。**

## 它做什么

把 Markdown 文章排版成微信公众号编辑器可直接粘贴的 HTML。产物是一个自包含的 HTML 页面：浏览器打开 → 点「复制到公众号」→ 在公众号编辑器粘贴，样式保留。排版引擎和「公众号排版系统」网站是同一套（已打包进 `scripts/renderer.bundle.mjs`），所以效果和网站预览一致。

## 依赖

只要 **Node.js ≥ 18**。不需要 npm install、不需要联网。整个目录拷到任何地方都能用。

如果你的环境不能执行本地 Node 脚本，这个工具用不了，请告诉用户换到能跑 Node 的环境。

## 工作流

完整说明见 [SKILL.md](SKILL.md)，这里是速览：

1. **读文章、判断类型**：教程 / 清单盘点 / 评测对比 / 观点深度 / 心得故事 / 资讯快评。
2. **轻量沟通定风格**：读 [references/style-schemes.md](references/style-schemes.md)，按 [SKILL.md 第 2 步](SKILL.md#2-轻量沟通确定风格与偏好) 执行。首次偏好未知时推荐两种方案，简述差异，集中询问最多两个关键问题，允许用户补充颜色、装饰密度或参考；已有明确选择、对话偏好、项目偏好，或用户说“你决定 / 直接出整篇”时直接做，不重复询问。沉默不表示同意；等待时可检查素材和结构。明确要求先挑风格时，用相同片段输出实际局部预览再等反馈，普通“排版，我看看效果”默认整篇。只有用户明确要求保存默认时才写入项目 `.gzh-typesetter/style-preferences.json`，重新读取核对后报告；该文件仅供 Skill 使用，不是网站预设 JSON，具体字段与加载规则见 SKILL.md。
3. **改写 Markdown**：按 [references/formatting-rules.md](references/formatting-rules.md) 的规则和配方表、[references/typesetting-syntax.md](references/typesetting-syntax.md) 的语法，自己改写（不要再调外部模型）。写到新文件，不覆盖原文。
4. **渲染**：
   ```bash
   node <skill 目录>/scripts/typeset.mjs --input <改写后.md> --scheme <方案> --title "<标题>" --out <产物.html>
   ```
   `--list-schemes` 看所有方案；`--layout` / `--theme` 单独换版式或主题色；`--scheme-file` 读网站导出的自定义预设。
5. **看校验与真实渲染**：退出码 0 = 兼容校验无 ERROR（WARNING 酌情告知用户）；退出码 2 = 有 ERROR，多半是 Markdown 里手写了 HTML，改掉再渲染。再检查实际桌面和手机渲染，发现问题先修复；无法查看或素材失效时如实说明，不能把兼容校验当作视觉验证。规则见 [references/wechat-compat.md](references/wechat-compat.md)。
6. **交付**：方案 + 理由、做了哪些排版处理（3–5 条）、产物绝对路径和"打开后点复制到公众号"。附 1–2 个具体反馈维度，如颜色是否抢眼、正文是否偏密或装饰是否偏多；完整交付后再邀请反馈，不额外设审批关卡。

## 铁律

- 必须走脚本，不要手写 HTML 交付
- 不改原文件；不编造事实、观点、数据、作者信息
- 组件按配方挑，宁少勿滥
- 不要改 `scripts/renderer.bundle.mjs`、`scripts/copy-client.js`（由网站源码生成）

## 目录

```
luobo-gzh-design/
├── SKILL.md / AGENTS.md         # 入口
├── references/
│   ├── style-schemes.md         # 风格方案、版式、主题色
│   ├── typesetting-syntax.md    # 全部可用语法
│   ├── formatting-rules.md      # 改写规则 + 按文章类型的组件配方
│   └── wechat-compat.md         # 公众号兼容规则（校验依据）
├── scripts/
│   ├── typeset.mjs              # 渲染 + 生成复制页 + 校验
│   ├── validate.mjs             # 单独校验任意 HTML
│   ├── renderer.bundle.mjs      # 网站排版引擎打包产物（生成文件）
│   └── copy-client.js           # 复制按钮逻辑（生成文件）
└── examples/                    # 样例输入与输出
```
