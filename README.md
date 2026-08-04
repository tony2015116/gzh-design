# 公众号 Markdown 排版系统

面向公众号文章的 Markdown 排版与智能配图系统。

项目维护两套使用方式：

- `OSS / 本地调测版`
  - 适合本地开发、开源分发、UI 调测
  - 前端可用 mock 身份模拟 `guest / free / vip / admin`
  - AI 排版默认由浏览器直连模型
  - 智能配图可本地生成信息图 PNG，用于完整调测交互链路

- `online / 正式上线版`
  - 前端通过 Cloudflare Worker 调用 AI 排版、认证、预设、智能配图
  - AI 排版需要登录
  - 智能配图仅 `vip / admin` 可用
  - 配图任务为异步 Workflow job，完成后由用户确认应用到正文

## 目录结构

- [app](./app)
  - React + TypeScript + Vite 前端
- [worker](./worker)
  - Cloudflare Worker + D1 + R2 + Workflows 后端
- [syntax_tutorial.md](./syntax_tutorial.md)
  - Markdown 语法参考素材

## 当前功能

- Markdown 编辑（带行号）+ 实时公众号预览，编辑器滚动时预览按比例跟随
- 顶栏按“外观设置 / 动作”分组：主题、版式、图片、预设在左侧；右侧为「复制到公众号」主按钮，AI 排版与智能配图收进「AI 工具」菜单，X 复制与导出图片收进「更多导出」菜单
- 右侧预览区按 Tab 切换「公众号 / X Thread / X Article」，X 输出直接在预览栏内查看与逐条复制
- 单输入、多平台导出
- 图片导出中心：完整长图、按平台比例切片多图、小红书爆款封面（多套模板 + 自定义标题/副标题/主题色 + AI 根据正文生成封面方案）
- 小红书图文生成：AI 把正文拆成封面 + 内容卡的轮播组图（7 种版式），三套视觉系统（杂志风 / 手账风 / 简约风）各 6 套主题包，支持逐张微调文案、溢出提醒与打包下载
- 主题 / 版式 / 图片风格切换
- AI 排版
- 图片上传
- 用户登录
- 云端预设保存
- 智能配图建议
- 智能配图异步生成与手动应用
- X Thread 文案导出与复制
- X Article 文案导出与复制
- X Article 现已支持富文本预览与 `text/html + text/plain` 双格式复制，标题、列表、引用、图片阴影与代码块样式会优先保留
- 对含代码的 X Article，系统会额外拆出可单独复制的代码块，便于粘贴到 X 原生的“插入代码”编辑入口

## 权限规则

`online` 模式下：

- `AI 排版`
  - 必须登录
- `AI 封面方案` / `AI 图文生成`
  - 与 AI 排版共用同一套鉴权（`AI_FORMAT_AUTH_MODE`），online 默认必须登录
- `智能配图建议`
  - 必须 `vip / admin`
- `智能配图生成`
  - 必须 `vip / admin`
- `云端预设`
  - 必须登录

`oss` 模式下：

- 默认使用 mock 身份
- 可切换 `guest / free / vip / admin`
- 用于调测权限提示、按钮显隐、生成流程
- 不依赖真实用户系统

## 运行模式

前端通过 `.env` 控制双版本。

相关文件：

- [app/.env](./app/.env)
- [app/.env.oss](./app/.env.oss)
- [app/.env.online](./app/.env.online)
- [app/.env.example](./app/.env.example)

关键前端环境变量：

- `VITE_APP_MODE`
  - `oss` 或 `online`
- `VITE_AUTH_MODE`
  - `mock` / `real` / `off`
- `VITE_ACCESS_MODE`
  - `mock` / `real` / `off`
- `VITE_DEV_USER_ROLE`
  - `guest` / `free` / `vip` / `admin`
- `VITE_WORKER_URL`
  - online 模式下 Worker 地址
- `VITE_WORKER_UPLOAD_SECRET`
  - 可选上传密钥
- `VITE_DEFAULT_UPLOAD_MODE`
  - `base64` / `r2` / `custom`
- `VITE_OSS_AI_LOG_LEVEL`
  - OSS 调测日志级别

## 快速开始

### 1. 安装依赖

```bash
cd app
npm install

cd ../worker
npm install
```

### 2. 本地开发：OSS 模式

```bash
cd app
npm run dev:oss
```

说明：

- 不依赖 Cloudflare Worker 即可调 UI 和大部分前端行为
- 页面调试身份切换器收在设置面板里（仅 mock 模式显示）
- OSS 下 AI 排版需要在前端设置里配置模型 API Key
- OSS 下智能配图可以完整走“建议 -> 确认 -> 生成 -> 应用”流程
- OSS 和 online 现在都支持从同一份 Markdown 直接导出 X Thread / X Article 文案，不会覆盖公众号正文
- X Article 导出会优先写入富文本剪贴板，便于手动粘贴到 X Articles 编辑器；最终保真度仍取决于 X 自身的粘贴处理

### 3. 联调 / 线上前端：online 模式

先配置 [app/.env.online](./app/.env.online)：

```env
VITE_APP_MODE=online
VITE_AUTH_MODE=real
VITE_ACCESS_MODE=real
VITE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
VITE_WORKER_UPLOAD_SECRET=
VITE_DEFAULT_UPLOAD_MODE=r2
```

然后启动：

```bash
cd app
npm run dev:online
```

## Cloudflare 后端部署

核心配置文件：

- [worker/wrangler.toml](./worker/wrangler.toml)
- [worker/schema.sql](./worker/schema.sql)

当前后端绑定：

- `DB`
  - D1 数据库
- `IMAGES_BUCKET`
  - R2 图片与产物存储
- `ILLUSTRATION_WORKFLOW`
  - 智能配图异步任务 Workflow
- `BROWSER`
  - Browser Rendering，用于将 HTML 信息图截图成 PNG

### 1. 准备 D1 / R2 / Workflow / Browser Rendering

你需要在 Cloudflare 侧准备：

- 一个 D1 数据库
- 一个 R2 bucket
- Worker 已启用 Workflows
- 如需 HTML 信息图截图，需启用 Browser Rendering

然后把 `database_id` 填入 [worker/wrangler.toml](./worker/wrangler.toml)。

### 2. 配置 secrets

必需：

```bash
cd worker
npx wrangler secret put OPENAI_API_KEY
```

可选：

```bash
npx wrangler secret put GEMINI_API_KEY
npx wrangler secret put UPLOAD_SECRET
```

说明：

- `OPENAI_API_KEY`
  - 用于 AI 排版和智能配图建议模型分析
- `GEMINI_API_KEY`
  - 用于 `http_image` 真实生图
- `UPLOAD_SECRET`
  - 兼容旧上传或混合鉴权场景

### 3. 初始化数据库

```bash
cd worker
npx wrangler d1 execute gzh-typesetter-db --file=./schema.sql
```

### 4. 部署 Worker

```bash
cd worker
npm run deploy
```

本地校验：

```bash
cd worker
npm run deploy -- --dry-run
```

## 智能配图说明

### 使用流程

1. 用户点击“智能配图建议”
2. 系统返回建议插图位置、图类型、用途、风格
3. 用户勾选要保留的建议
4. 用户点击生成
5. online 模式下：
   - 创建异步 Workflow job
   - 前端轮询任务状态
   - 完成后在右下角任务面板里手动应用结果
6. oss 模式下：
   - 本地直接生成结果并应用

### 引擎规则

- `http_image`
  - 适合场景图、封面图
  - 需要 `GEMINI_API_KEY`
  - 若未配置或生成失败，会自动回退到 `html_infographic`

- `html_infographic`
  - 适合流程图、对比图、框架图、时间线、信息图
  - 若配置了 `BROWSER`，走 HTML/CSS -> Browser Rendering -> PNG
  - 若未配置 `BROWSER`，回退为结构化 SVG 信息图
  - 当前 `infographic / comparison / flowchart / framework / timeline` 已升级为“结构化内容 -> 模板渲染”，不再直接把原文句子平铺成图
  - online：若 Worker 配置了 `OPENAI_API_KEY`，会先做段落结构化总结，再渲染信息图
  - oss：若本地已配置 `openai_api_key / openai_api_base / openai_model`，也会先做结构化总结；未配置时才退回启发式摘要
  - 结构化总结现在带质量门槛：若结果过于偏“信息图/可视化/扫读/阅读效率”这类元信息，会拒绝并回退到更贴正文的摘要

### 当前行为

- online 模式下，配图任务是异步的，不会在点击后立刻覆盖正文
- 必须等任务完成，再由用户点击“将结果应用到正文”
- 这是有意设计，避免后台任务完成时覆盖用户正在编辑的内容
- 当前 `html_infographic` 的质量优化已覆盖 `infographic / comparison / flowchart / framework / timeline`
  - `infographic` 不再只走“概览卡片”兜底，会先判断更适合 `bridge / linear-progression / overview` 哪种布局
  - online：优先使用模型生成结构化信息与布局，再渲染为 HTML 信息图
  - oss：优先使用本地模型生成结构化信息与布局；未配置模型时才退回启发式结构化摘要

## 认证与角色维护

数据库用户表定义见 [worker/schema.sql](./worker/schema.sql)。

角色：

- `free`
- `vip`
- `admin`

角色变更优先使用 admin API（用 admin 账号的 Bearer token 调用）：

```bash
curl -X POST "https://your-worker.workers.dev/api/admin/users/role" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-account@example.com", "role": "vip"}'
```

忘记密码时可由 admin 重置（重置后该用户所有会话失效，需重新登录）：

```bash
curl -X POST "https://your-worker.workers.dev/api/admin/users/reset-password" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "your-test-account@example.com", "newPassword": "newpass123"}'
```

联调阶段也可以直接在 D1 中手工升级测试账号为 VIP（备选方式）：

```sql
UPDATE users
SET role = 'vip'
WHERE email = 'your-test-account@example.com';
```

说明：

- 目前还没有独立的 VIP 运营后台
- 线上 VIP 管理优先走 admin API，数据库直改为备选
- 登出：`POST /api/auth/logout` 会在服务端删除当前会话
- 改密：`POST /api/auth/change-password`（需登录），修改后其他设备强制下线
- 登录限流：同一邮箱 10 分钟内失败 5 次后返回 429，登录成功自动清零
- 密码使用 PBKDF2 存储，旧 SHA-256 账号在下次登录时自动迁移

## 日志与排障

### Worker 日志

```bash
cd worker
npx wrangler tail
```

适用：

- online 模式 AI 排版
- online 模式智能配图建议
- online 模式智能配图任务
- online 模式智能配图的结构化总结、引擎回退、任务编排

### OSS 模式日志

```bash
cd app
npm run dev:oss
```

然后看前端 dev server 终端输出。

说明：

- OSS 模式不会经过 Worker，所以 `wrangler tail` 看不到前端直连模型的日志
- 可通过 `VITE_OSS_AI_LOG_LEVEL` 控制本地日志详细程度
- OSS 模式下，智能配图也会输出本地日志，前缀为 `[oss-illustration]`
- 控制台页面现在自带“本地环境诊断”面板；online 模式下管理员还可以在同一页面查看 Worker 诊断结果

### 常见问题

1. `wrangler tail` 没日志
- 很可能当前跑的是 `oss` 模式
- 或 `online` 模式下 `VITE_WORKER_URL` 没配对

2. 图片上传成功但打不开
- 检查 Worker `/file/*` 路由是否部署成功
- 检查 `VITE_WORKER_URL` 是否指向当前 Worker

3. online 智能配图一直不完成
- 先看 `wrangler tail`
- 再看 D1 是否已应用最新 schema
- 再检查 `BROWSER` / `GEMINI_API_KEY` 是否已配置

4. 配图创建后正文没有立刻变化
- 这是当前设计
- online 模式下需要等待异步任务完成后手动应用结果

5. online 配置看起来没问题，但还是不确定 Worker 是否真的配全
- 先用管理员账号打开控制台页面
- 查看“线上 Worker 诊断”里的 bindings、secrets、schema 和最近任务

## 日常维护清单

每次上线前至少检查：

- 前端环境变量是否对应当前模式
- `VITE_WORKER_URL` 是否正确
- D1 是否已执行最新 [schema.sql](./worker/schema.sql)
- Worker secrets 是否齐全
- `wrangler.toml` 绑定是否与 Cloudflare 控制台一致
- `npm run build:oss`
- `npm run build:online`
- `cd worker && npm run deploy -- --dry-run`

## 文档维护约定

这份 [README.md](./README.md) 作为项目整体的主说明文档。

后续凡是出现以下行为变动，都必须同步更新本文件：

- 权限规则变化
- AI 排版调用方式变化
- 智能配图流程变化
- Cloudflare 绑定变化
- 环境变量变化
- 部署步骤变化
- 线上运维方式变化
- 用户可见交互变化

建议把这条作为提交前检查项：

- “如果这次改动改变了系统行为，README 是否已同步更新？”

## 子文档

- 部署上线见 [DEPLOYMENT.md](./DEPLOYMENT.md)
- 前端说明见 [app/README.md](./app/README.md)
- Worker 说明见 [worker/README.md](./worker/README.md)
