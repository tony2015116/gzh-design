# 公众号 Markdown 排版系统：项目分析

> 分析日期：2026-10-02
> 范围：`app/`（前端）、`worker/`（后端）及仓库根目录。`skills/` 下的 skill 只做了简要说明。
> 本文只做分析，没有改动任何代码。

---

## 一、项目概览

这是一个面向公众号作者的 Markdown 排版工具。核心流程是：在左栏写 Markdown，右栏实时预览公众号效果，一键复制成公众号编辑器能直接粘贴的富文本。在这个核心之上，项目又叠加了 AI 排版、智能配图、小红书图文、封面生成、X 平台导出、飞书文档导入等功能。

### 1.1 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 19 + TypeScript + Vite 7 + Tailwind 4 + markdown-it，部署在 Cloudflare（`@cloudflare/vite-plugin`） |
| 后端 | Cloudflare Worker，D1 存用户和任务数据，R2 存图片，Workflows 跑异步配图任务，Browser Rendering（Puppeteer）渲染信息图 |
| AI | 任何 OpenAI 兼容的 chat/completions 接口（流式），图片生成用 Gemini |
| 其他 | `html-to-image` 导出图片，`@ffmpeg/ffmpeg`（wasm）导出视频 |

### 1.2 双模式设计

| 模式 | 用途 | AI 调用方式 | 身份 |
|---|---|---|---|
| OSS / 本地 | 开发调试、开源分发 | 浏览器直连模型，用户自己填 API Key | mock 身份，可以切换 guest / free / vip / admin |
| online | 正式上线 | 经 Worker 转发，使用服务端的 Key | 真实注册登录，按角色控制权限 |

### 1.3 代码规模

约 2.6 万行。体量最大的几个文件：

| 文件 | 行数 | 说明 |
|---|---|---|
| [TypesetterView.tsx](app/src/views/TypesetterView.tsx) | 1967 | 主界面，46 个 `useState` |
| [templates.ts](worker/src/illustration/templates.ts) | 1942 | 信息图模板 |
| [illustrationService.ts](app/src/services/illustrationService.ts) | 1783 | 前端配图服务（含 OSS 本地生成） |
| [ImageExportPanel.tsx](app/src/components/ui/ImageExportPanel.tsx) | 907 | 图片导出中心 |
| [structured.ts](worker/src/illustration/structured.ts) | 733 | 结构化配图 |
| [VideoCompareView.tsx](app/src/views/VideoCompareView.tsx) | 726 | 视频对比页 |

---

## 二、功能清单

### 2.1 编辑与排版（核心）

- Markdown 编辑器带行号，编辑区和预览区按比例同步滚动。
- 自定义解析器 [parser.ts](app/src/core/parser.ts)：把 Markdown 转成组件 JSON 再渲染。支持的组件有：
  - 四级标题，标题可以用 `|` 拆出序号、主标题、副标题或标签。
  - 段落、引用、分割线、列表、表格、代码块、图片（含多图）。
  - 四个卡片组件：SummaryCard、InfoCard、ScrollCard（长文滑动）、LongImageCard（超长图滚动）。
- 样式体系可以分层组合：
  - 主题色：5 套，见 [theme.ts](app/src/core/theme.ts)。
  - 版式和图片风格：见 [style.ts](app/src/core/style.ts)。
  - 强调样式、字体排印、组件样式。
  - 风格方案（Style Scheme）：精选方案之外还能自定义，支持编辑、复制、排序、导入导出。
- 复制到公众号：先走浏览器选区复制；不行就写 `text/html` 剪贴板；再不行就复制纯文本。
- 语法速查弹窗（CheatsheetModal）。

### 2.2 AI 能力

| 功能 | 前端 | 后端 | 权限（online） |
|---|---|---|---|
| AI 一键排版 | [formatter.ts](app/src/ai/formatter.ts) | [format.ts](worker/src/routes/format.ts) + [formatPrompt.ts](worker/src/lib/formatPrompt.ts) | 登录 |
| AI 封面文案 | [coverCopy.ts](app/src/ai/coverCopy.ts) | [coverCopy.ts](worker/src/routes/coverCopy.ts) | 登录 |
| 小红书图文拆条 | [xhsCards.ts](app/src/ai/xhsCards.ts) | [xhsCards.ts](worker/src/routes/xhsCards.ts) | 登录 |
| 智能配图建议 | illustrationService | [illustration.ts](worker/src/routes/illustration.ts) / [plan.ts](worker/src/illustration/plan.ts) | VIP / admin |
| 智能配图生成 | IllustrationJobPanel | [workflow.ts](worker/src/workflow.ts)，Gemini 生图或 Puppeteer 渲染信息图 | VIP / admin |

配图是异步任务：先出建议，用户确认后生成，前端每 3 秒轮询一次，完成后由用户决定是否应用到正文。

### 2.3 导出

- **图片导出中心**：可以导出完整长图，也可以按平台比例切成多张图。
- **小红书封面**：4 套模板、7 种主题色，文案可以由 AI 生成。
- **小红书图文**：
  - 7 种版式。
  - 视觉系统包括杂志风、手账风、简约风，另有 Poster、Pulse、Workbench 三类卡片。
  - 支持逐张修改文案，有文字溢出提醒，可以打包下载。
- **X 平台**：
  - X Thread 文案可以逐条复制。
  - X Article 富文本复制同时写入 html 和纯文本两种格式，代码块可以单独拆出来复制。
- **视频对比**（`/video-compare`）：用 ffmpeg.wasm 把两段视频左右或上下拼接后导出。

### 2.4 账号与云端

- 注册和登录：
  - 密码用 PBKDF2 哈希，迭代 10 万次；老的 SHA-256 哈希会在用户登录时自动升级。
  - 登录失败按邮箱限流：10 分钟内最多失败 5 次。
  - 修改密码后，除当前会话外的其他会话全部下线。
- 云端预设：保存主题、版式和图片风格的组合。
- 管理后台（`/admin`）：查看诊断信息、修改用户角色、重置密码。
- 飞书文档同步：
  - 每个用户填写自己的飞书自建应用凭证，再通过 OAuth 绑定飞书账号。
  - 可以浏览最近文档，也可以粘贴文档链接，直接导入编辑器。
  - 文档里的图片会自动搬到 R2，单篇最多 20 张，每张不超过 10MB。
- 图片上传有三种模式：base64 内联、R2 图床、自定义 CDN 接口。

### 2.5 仓库里的其他内容

- `skills/luobo-gzh-design`：一个独立的排版 skill。它和网页版的排版能力是两套实现。
- 根目录散落着一些素材和临时文件，详见 4.5 节。

---

## 三、当前健康状况

| 检查项 | 结果 |
|---|---|
| Worker 单元测试 | 9 个文件、86 个用例，全部通过 |
| 前端类型检查 `tsc -b` | **失败**，1 个错误，位置在 [xhsCards.ts:217](app/src/ai/xhsCards.ts#L217)，参数 `r` 隐式为 `any`。所以 `npm run build` 现在会失败 |
| 前端 ESLint | 63 个问题。其中 `no-explicit-any` 36 个、`react-refresh/only-export-components` 14 个、未使用变量 5 个、`exhaustive-deps` 3 个，其余是零散小问题 |
| 前端测试 | 没有。解析器、复制逻辑、导出逻辑都没有测试覆盖 |
| 前端打包 | 主 JS 只有一个 chunk，约 690KB，没有按路由拆分。另外 ffmpeg 的 wasm 文件约 32MB |
| Git 状态 | 最近一次提交之后，有 40 多个修改文件和大量新文件没有提交 |

---

## 四、问题与优化建议

优先级说明：
- **P0**：会造成实际损失，或者功能已经坏了，建议尽快处理。
- **P1**：明显影响体验或稳定性。
- **P2**：工程质量和长期可维护性。

### 4.1 安全（P0 / P1）

#### P0-1：客户端可以指定 AI 接口地址，服务端的 API Key 会被偷走

[format.ts:97](worker/src/routes/format.ts#L97)、[coverCopy.ts:71](worker/src/routes/coverCopy.ts#L71)、[xhsCards.ts:71](worker/src/routes/xhsCards.ts#L71) 都是这样写的：

```ts
const baseUrl = body.baseUrl || env.OPENAI_API_BASE || ...
```

Worker 随后带着 `Authorization: Bearer ${env.OPENAI_API_KEY}` 去请求这个地址。任何能通过鉴权的用户都可以把 `baseUrl` 改成自己的服务器，从而直接拿到服务端的 Key。online 模式下注册是免费的，没有任何门槛，所以这等于把 Key 公开了。`body.model` 也能被客户端改掉，可以用来强制调用更贵的模型。

**建议**：
- Worker 忽略客户端传来的 `baseUrl` 和 `model`，只用环境变量里的配置。
- 如果确实需要选模型，就在服务端维护一个白名单。
- 前端 online 模式也不要再发送这两个字段。

#### P0-2：图片上传接口实际上是对外开放的

[upload.ts](worker/src/routes/upload.ts) 只校验 `UPLOAD_SECRET`，不认登录态：

- 服务端没配 `UPLOAD_SECRET` 时，任何人都能往 R2 传图，等于一个公开图床。
- 配了之后，前端只能把 Secret 写进 `VITE_WORKER_UPLOAD_SECRET`，或者让用户自己填。写进前端环境变量，就会被打包进 JS，人人可见。

另外，上传接口允许 `image/svg+xml`。SVG 由 Worker 域名直接返回，能在这个域名下执行脚本，存在存储型 XSS 的风险。

**建议**：
- 上传改成必须登录，并按用户限制频率和容量。
- `UPLOAD_SECRET` 只留给 OSS 或自部署场景使用。
- 拒绝 SVG，或者返回时加上 `Content-Disposition: attachment` 和 `Content-Security-Policy: sandbox`。

#### P0-3：AI 接口没有任何用量限制

AI 排版、封面、图文这三个接口：
- 不限制输入长度；
- 不按用户限制频率或次数；
- 注册不需要验证邮箱，也没有人机验证。

脚本批量注册后就可以无限消耗模型额度。

**建议**：
- 限制输入长度，例如 3 万字。
- 在 D1 里记录每个用户每天的调用次数，按角色设置额度。
- 注册接口加限流，或者加上 Cloudflare Turnstile 人机验证。

#### P1-1：预览会直接渲染原始 HTML，没有做任何过滤

markdown-it 开启了 `html: true`，见 [parser.ts:8](app/src/core/parser.ts#L8)，渲染结果又通过大量 `dangerouslySetInnerHTML` 插进页面。以下几类内容都可能把 `<img onerror>` 这类代码带进预览：

- AI 返回的结果（文章里如果藏了提示词注入）；
- 从飞书导入的文档；
- 用户粘贴的第三方文章。

这些代码执行后，可以读取 localStorage 里的登录 token 和用户自己的 API Key。

**建议**：用 DOMPurify 之类的库过滤渲染结果，只放行排版需要的标签和 `style` 属性，并去掉所有 `on*` 事件属性和 `javascript:` 链接。

#### P1-2：其他安全细节

- [wrangler.toml](worker/wrangler.toml) 的默认配置是 `ALLOWED_ORIGINS="*"`、`AI_FORMAT_LOG_LEVEL="verbose"`：
  - CORS 对所有来源开放；
  - 生产日志会记录文章内容的预览。
  - 建议上线配置收紧，日志默认用精简级别。
- 飞书 App Secret 和用户的 access/refresh token 都以明文存在 D1 里。建议用 Worker Secret 派生一个密钥，做 AES-GCM 加密后再存。
- 飞书 OAuth 的 `state` 只校验了前缀是不是 `userId.`，没有存到服务端做一次性校验，见 [feishu.ts:108](worker/src/routes/feishu.ts#L108)。建议存到 D1 或 KV，设一个短期过期时间。
- 登录限流只按邮箱计数，别人可以故意输错密码，把某个用户锁在外面。建议改成邮箱和 IP 组合计数。
- 注册失败时，接口会把数据库的 `error.message` 原样返回给前端，见 [auth.ts](worker/src/routes/auth.ts)。
- 密码哈希用 `===` 比较，不是常量时间比较。风险很低，但顺手就能改。
- Gemini 的 Key 放在 URL 的查询参数里，见 [render.ts:26](worker/src/illustration/render.ts#L26)。改用 `x-goog-api-key` 请求头更好。

### 4.2 已有的功能缺陷（P0 / P1）

| # | 问题 | 位置 | 说明 |
|---|---|---|---|
| B1 | 前端构建失败 | [xhsCards.ts:217](app/src/ai/xhsCards.ts#L217) | 有一处 TS 错误，`npm run build` 和 `deploy` 都跑不过 |
| B2 | online 模式下删除云端预设实际上会失败 | [http.ts](worker/src/lib/http.ts) `Access-Control-Allow-Methods` | CORS 只允许 `POST, GET, OPTIONS`，没有 `DELETE`。前端和 Worker 不在同一个域名，浏览器预检会被拦下 |
| B3 | 删除预设失败时没有任何提示 | [authService.ts:187](app/src/services/authService.ts#L187) | 没有检查 `response.ok`，和 B2 叠加后，用户点了删除，预设却一直还在 |
| B4 | ffmpeg wasm 约 32MB，可能超过 Cloudflare 静态资源的单文件上限 | `app/dist/assets/ffmpeg-core-*.wasm` | 需要核实：Workers Static Assets 单文件上限大约是 25 MiB。如果超了，前端部署会失败，或者这个文件根本发布不上去。建议改成从 CDN 按需加载 |
| B5 | 云端预设只存了主题、版式和图片风格 | 预设表结构 | 强调、字体、组件样式虽然塞进了 theme 的 JSON 里，但结构很随意；自定义风格方案只存在 localStorage，换设备就没了 |

### 4.3 产品体验（P1）

1. **刷新页面会丢失正在写的文章**。`markdown` 的初始值是写死的示例文本，没有任何自动保存。这是目前影响最大的体验问题。
   - 建议：防抖后自动存到 localStorage 或 IndexedDB，登录用户可以同步到云端。
   - 进一步可以做多文档管理，例如"我的文章"列表。
2. **AI 排版会直接覆盖原文，无法撤销**。`setMarkdown(nextMarkdown)` 会把 textarea 的撤销记录一起清掉。长文章还可能超出模型的输出长度，返回被截断的文本，然后悄悄替换掉原文。
   - 建议：AI 返回后先展示对比（diff）或预览，让用户选"接受"还是"放弃"，并保留一份历史快照。
   - 前端可以检测截断：比较输出和原文的长度、看结尾是否完整、看 `finish_reason`。
   - 去掉模型可能套在整篇外面的 ``` 代码围栏。
3. **AI 处理过程看不到进度**。Worker 虽然用流式方式请求模型，但要等全部生成完才返回给前端，用户只能看着加载动画干等，也没法取消。
   - 建议：把 SSE 流直接转给前端，边生成边显示；加一个"取消"按钮，用 `AbortController` 实现。
   - 也可以把长文按章节拆开，分段排版。
4. **AI 排版不考虑用户当前的样式**。成功提示写的是"已按当前主题和版式完成优化"，但请求里并没有带上主题和版式信息，这句提示不准确。可以考虑把当前风格方案的偏好一起传给模型，比如这个方案适合多用卡片还是少用。
5. **base64 图片模式不适合粘贴到公众号**。这是 OSS 模式的默认上传方式。公众号编辑器对 `data:` 格式的图片支持不好（需要实测确认）。建议复制时检测到 base64 图片就提醒用户，或者引导用户配置图床。
6. **主界面信息太密**。功能越加越多，入口都挤在顶栏和弹窗里。可以考虑：
   - 首次使用时给一个引导；
   - 设置项按"常用 / 高级"分开；
   - 视频对比这类和排版关系不大的工具单独放，或者挪到"工具"子菜单里。
7. **复制前不做检查**。公众号对外链、某些 CSS（如 `position`、`flex` 的部分写法）、`<span>` 嵌套有清洗规则。可以在复制前做一次兼容性检查，比如外链数量、图片是否可以公开访问、有没有不支持的标签。

### 4.4 工程质量（P2）

1. **主视图过于臃肿**。[TypesetterView.tsx](app/src/views/TypesetterView.tsx) 有近 2000 行、46 个状态。建议：
   - 按功能拆成自定义 hook，例如 `useStyleSelection`、`useIllustrationJob`、`useAuthState`、`useApiSettings`；
   - 跨组件共享的状态，可以考虑用 Context 或 Zustand。
2. **前后端重复的代码靠手工同步**。AI 调用逻辑、Prompt、封面和图文的枚举，在 `app/` 和 `worker/` 各有一份，现在靠测试来校验是否一致。可以把纯逻辑（Prompt、枚举、`chatCompletion`、输出解析）抽到一个 `shared/` 包，两边都引用它。
3. **三个 AI 路由几乎是同一份代码**。format、coverCopy、xhsCards 三个路由的鉴权、参数解析、调用模型、记日志、处理错误这段流程基本一致。可以抽成一个 `handleAiRoute({ prompt, parse, validate })` 公共函数，P0-1 和 P0-3 的修复也只需要改这一处。
4. **前端没有测试**。至少应该给这几块补上 Vitest 测试：
   - 解析器 `parseMarkdownToJSON`，可以用快照测试覆盖各种组件和边界情况；
   - 公众号复制时的 DOM 转换 `createWechatCopyRoot`；
   - X 导出 [xExportService.ts](app/src/services/xExportService.ts)；
   - 小红书卡片的输出解析 `sanitizeCard`。
5. **打包没有按路由拆分**。`/admin`、`/video-compare`、`/feishu/callback` 以及图片导出面板可以用 `React.lazy` 按需加载，首屏 JS 能小很多。
6. **TypeScript 和 ESLint 问题需要清理**。36 处 `any` 主要集中在接口响应和错误处理上，补上类型后，后端返回结构变了也能在编译时发现。另外建议在 CI 里加上 `tsc -b`、`eslint` 和 `vitest`，避免 B1 这种构建失败再次出现。
7. **解析器会生成随机的 `id`**。解析器用 `Math.random()` 给每个组件生成 id，React 用它作 key，所以每打一个字，整个预览都会重新挂载。改成按组件顺序和内容生成稳定的 key，可以减少长文预览时的卡顿。
8. **D1 表结构没有迁移机制**。现在只有一个 `schema.sql`，全部使用 `CREATE TABLE IF NOT EXISTS`，所以后续改字段很难管理。建议改用 `wrangler d1 migrations`。另外，过期会话只在有人登录时顺带清理，配图任务和 R2 产物也没有清理机制，可以加一个定时任务（Cron Trigger）。
9. **配图轮询每 3 秒一次，并且没有上限**。如果任务卡住，前端会一直轮询下去。建议加指数退避和最长等待时间。

### 4.5 仓库整理（P2）

- 根目录有很多和代码无关的文件，例如 `1.jpg`、多张预览 png、`luobo-gzh-design.zip`、测试文章 md、`tishici.txt`、`排版.txt`、`LongImageCard.txt`、`.gzh-typesetter/` 等。建议移到 `docs/` 或 `samples/`，或者加进 `.gitignore`。
- `task.md`、`implementation_plan.md`、`video_compare_mp4_export_plan.md` 这些过程文档，可以统一放到 `docs/` 下面。
- 大量改动还没有提交，存在丢失的风险。建议按功能分批提交，例如组件样式体系、小红书图文、飞书同步、视频对比各一批。
- 网页版排版和 `skills/luobo-gzh-design` 是两套排版实现。如果两边都要长期维护，最好让它们共用一套语法规范，以 [syntax_tutorial.md](syntax_tutorial.md) 为准。

---

## 五、功能优化建议

第四章主要讲问题修复，这一章讲功能上还能往哪里扩展。每条建议都对照过现有代码。

### 5.1 公众号排版本身（核心场景，优先做）

| # | 建议 | 现状 | 说明 |
|---|---|---|---|
| F1 | **外链转脚注** | [parser.ts:72](app/src/core/parser.ts#L72) 渲染链接时丢掉了 `href`，只保留带下划线的文字 | 公众号正文不允许放外链。把链接自动转成文末的"参考资料 [1] [2]"，是写技术文和测评文最常用的功能之一 |
| F2 | **代码高亮** | [CodeBlock.tsx](app/src/components/typesetter/CodeBlock.tsx) 只显示语言名，代码没有着色 | 用 highlight.js 或 Shiki 生成带内联样式的高亮，粘贴到公众号后颜色也能保留；可以再加 Mac 窗口风格的标题栏和行号开关 |
| F3 | **文章头尾模板** | 没有 | 把开头导语、结尾"写在最后"、关注引导、往期推荐、二维码图存成可复用片段，按风格方案各存一套，排版时自动拼进去 |
| F4 | **公众号兼容性检查** | 没有 | 复制前扫描 base64 图片、无法公开访问的图片地址、会被公众号清洗掉的 CSS、超过 10MB 的图片，每一项都能一键修复 |
| F5 | **手机宽度预览** | 预览宽度固定为 677px（[Preview.tsx:114](app/src/components/preview/Preview.tsx#L114)），是公众号后台编辑器的宽度 | 读者大多用手机看，宽度约 375px。加一个切换，能提前发现标题换行难看、表格溢出等问题 |
| F6 | **字数和阅读时长** | 没有 | 编辑器底部显示字数、预计阅读时长和图片数量，可以选择在文首插入"全文 xxxx 字，阅读约 x 分钟" |

### 5.2 编辑体验

| # | 建议 | 说明 |
|---|---|---|
| F7 | **编辑器增强** | 现在只是一个 textarea 加行号。至少补上加粗、标题、插入组件的快捷键，以及查找替换；选中文字后可以右键"包成 InfoCard"或"包成 ScrollCard"。想做得彻底，可以换成 CodeMirror 6 |
| F8 | **组件插入面板** | 四个卡片组件的属性（height、hint、copy）需要记忆。做一个下拉面板，选好参数后自动生成标签 |
| F9 | **点击预览定位到源码** | 现在只有按比例同步滚动。解析器生成组件时带上 `token.map` 行号，点击预览里的块，编辑器就能跳到对应行 |
| F10 | **导入更多格式** | 现在能导入本地 md 和飞书文档。可以再支持粘贴网页或公众号文章自动转成 Markdown，以及导入 Word（.docx）和 Notion |

### 5.3 AI 能力

| # | 建议 | 说明 |
|---|---|---|
| F11 | **局部 AI 操作** | 选中一段文字后，可以"改成卡片""提炼成金句引用""拆成列表""去 AI 味"。只改选中的部分，风险小，也不会遇到长文被截断的问题 |
| F12 | **AI 起标题和摘要** | 生成 5 个候选标题，以及 120 字以内的公众号摘要，和现有的封面文案生成联动 |
| F13 | **排版强度可选** | 一键排版时可以选"轻度 / 标准 / 重度"，分别对应只加标题加粗、加少量卡片、充分使用组件，Prompt 按档位切换 |
| F14 | **AI 结果按段落采纳** | 在 4.3 第 2 条"先对比再确认"的基础上更进一步，按段落逐块接受或拒绝 |

### 5.4 多平台分发

| # | 建议 | 说明 |
|---|---|---|
| F15 | **一次排版，多处发布** | 把公众号（富文本、封面、摘要）、小红书（组图和配文）、X Thread 串成一个发布清单，最后打包下载。现在这三块是分散的入口 |
| F16 | **小红书配文** | 现在只生成图片卡片，发布时还需要正文文案和 #话题标签，AI 拆卡片时可以顺带生成 |
| F17 | **知乎和掘金导出** | 这两个平台都支持 Markdown，但各有方言，比如公式写法和图片处理方式不同，做格式转换成本很低 |

### 5.5 风格与资产管理

| # | 建议 | 说明 |
|---|---|---|
| F18 | **风格方案云同步和分享** | task.md 里还没完成的几项（重命名、云同步、拖拽排序、分享链接）一起做；通过链接分享风格方案，还能起到传播作用 |
| F19 | **图片素材库** | 传到 R2 的图片目前只是一个个 URL，没有地方管理。做一个"我的图片"面板，可以复用历史图片、查看占用空间，也和 P0-2"上传改成必须登录"的修复对得上 |
| F20 | **文章历史版本** | 在"自动保存草稿"的基础上保存多个版本，比如 AI 排版前后、手动保存时各存一份，可以回到任意一个版本 |

### 5.6 功能优先级

如果只挑三项，建议先做：

1. **F1 外链转脚注**：几乎每篇都用得上，改动集中在解析器，成本低。
2. **F2 代码高亮**：和以 AI 工具、教程为主的内容类型最贴合，效果明显。
3. **F11 局部 AI 操作**：比整篇一键排版更可控，也绕开了长文被截断的问题。

再加上 4.3 第 1 条的**草稿自动保存**，这四项做完，日常写作体验会有明显提升。

---

## 六、建议的推进顺序

| 阶段 | 内容 | 预计工作量 |
|---|---|---|
| 第一步：止血 | P0-1（服务端忽略客户端的 baseUrl 和 model）、B1（修复构建）、B2 和 B3（CORS 加 DELETE，前端检查返回结果）、P0-3（输入长度限制和每日额度） | 半天到 1 天 |
| 第二步：保住用户内容 | 自动保存草稿；AI 排版先对比再确认，支持撤销；检测输出被截断 | 1 到 2 天 |
| 第三步：安全加固 | HTML 过滤（DOMPurify）、上传改成必须登录并禁止 SVG、飞书凭证加密、OAuth state 存到服务端、收紧上线配置 | 1 到 2 天 |
| 第四步：体验提升 | AI 流式输出和取消、复制前兼容性检查、风格方案云同步、按路由懒加载、ffmpeg 改从 CDN 加载 | 2 到 4 天 |
| 功能迭代（可以和第三、四步并行） | 先做 F1 外链转脚注、F2 代码高亮、F11 局部 AI 操作；再做 F3 头尾模板、F5 手机预览、F8 组件插入面板、F12 标题和摘要；F15 多平台发布清单作为中期目标 | 第一批 2 到 3 天，之后按需推进 |
| 第五步：工程重构 | 拆分 TypesetterView、抽出 shared 包、合并 AI 路由公共流程、补前端测试、接入 CI、D1 迁移、定时清理 | 持续进行 |

---

## 附：本次分析实际执行的检查

- `worker`：`npx vitest run`，9 个文件、86 个用例全部通过。
- `app`：`npx tsc -b`，失败，1 个错误。
- `app`：`npx eslint .`，63 个问题（60 个 error、3 个 warning）。
- `app/dist`：查看了现有构建产物的文件大小。这份产物是之前构建留下的，本次没有重新构建。
- 其余结论来自阅读源码。B4（Cloudflare 单文件大小上限）和 4.3 第 5 条（公众号对 base64 图片的支持情况）需要实际验证。
