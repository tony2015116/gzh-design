# 部署文档

本文档描述如何把「公众号 Markdown 排版系统」从零部署到线上。

目标架构：

- **前端**：`app/` 构建为静态文件（Vite），托管在 Cloudflare Pages（或其他任意静态托管）
- **后端**：`worker/` 部署为 Cloudflare Worker
- **存储**：D1（用户/会话/预设/配图任务）、R2（图片与配图产物）
- **计算**：Workflows（配图异步任务）、Browser Rendering（HTML 信息图截图成 PNG）

费用说明（以 Cloudflare 官方定价页为准）：

- Workflows：Free 和 Paid 套餐都包含（[Workflows Pricing](https://developers.cloudflare.com/workflows/reference/pricing/)）
- Browser Rendering：Free 套餐每天 10 分钟浏览器时长，Paid 每月 10 小时（[Browser Rendering Pricing](https://developers.cloudflare.com/browser-rendering/platform/pricing/)）
- 也就是说**免费套餐即可完整跑通**，只有用量大时才需要升级 Workers Paid（$5/月起）

---

## 0. 前置准备

本地需要：

- Node.js 18+ 和 npm
- 一个 Cloudflare 账号（[dash.cloudflare.com](https://dash.cloudflare.com) 免费注册）
- 一个 OpenAI 兼容 API Key（必需，用于 AI 排版和配图建议）
- 一个 Gemini API Key（可选，用于 `http_image` 真实生图；不配则自动回退到 HTML 信息图）

安装依赖（如果还没装过）：

```bash
cd app && npm install
cd ../worker && npm install
```

登录 Cloudflare（会打开浏览器完成授权，只需做一次）：

```bash
cd worker
npx wrangler login
```

验证登录态：

```bash
npx wrangler whoami
```

记下输出里的 **Account ID** 和你的 **账号子域**（`<subdomain>.workers.dev` 的前缀）。

---

## 1. 创建 Cloudflare 资源

### 1.1 创建 D1 数据库

```bash
cd worker
npx wrangler d1 create gzh-typesetter-db
```

输出示例：

```
✅ Successfully created DB 'gzh-typesetter-db'

[[d1_databases]]
binding = "DB"
database_name = "gzh-typesetter-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**把 `database_id` 复制下来**，填进 `worker/wrangler.toml`：

```toml
[[d1_databases]]
binding = "DB"
database_name = "gzh-typesetter-db"
database_id = "粘贴你的 database_id"   # 替换 YOUR_D1_DATABASE_ID_HERE
```

### 1.2 创建 R2 Bucket

```bash
npx wrangler r2 bucket create gzh-images
```

bucket 名必须和 `wrangler.toml` 里的 `bucket_name = "gzh-images"` 一致。

说明：**不需要**给 R2 开公开访问。图片是通过 Worker 的 `/file/*` 路由读出来的，R2 只作为私有存储。

### 1.3 Workflows 与 Browser Rendering

无需手动创建资源：

- `wrangler.toml` 里的 `[[workflows]]` 段会在部署时自动注册 `gzh-illustration-workflow`
- `[browser]` 绑定部署后自动可用（免费套餐每天 10 分钟额度）

---

## 2. 配置 Worker 密钥（secrets）

在 `worker/` 目录下执行：

```bash
# 必需：AI 排版 + 配图建议的结构化分析
npx wrangler secret put OPENAI_API_KEY

# 可选：http_image 真实生图（不配则自动回退 HTML 信息图，不影响主流程）
npx wrangler secret put GEMINI_API_KEY

# 可选：旧上传接口兼容鉴权，一般不需要
npx wrangler secret put UPLOAD_SECRET

# 可选：飞书文档同步的部署者兜底凭证（见下方说明，多数情况不需要）
npx wrangler secret put FEISHU_APP_ID
npx wrangler secret put FEISHU_APP_SECRET
```

每条命令会提示你粘贴密钥值（输入不回显）。

飞书文档同步采用「用户自带应用凭证」模式：**普通用户在前端侧边栏自行创建并保存自己的飞书自建应用**（App ID / Secret 存 D1 的 `feishu_apps` 表），无需部署者配置。上面的 `FEISHU_APP_ID/SECRET` 只在你希望同企业用户免配置直接绑定时才需要（此时需在飞书开放平台把重定向 URL 配为 `https://<你的域名>/feishu/callback`）。

如果你的 OpenAI Key 走第三方中转/自托管网关，在 `wrangler.toml` 的 `[vars]` 里设置 `OPENAI_API_BASE`（例如 `https://your-relay.example.com/v1`），需要换模型时设置 `OPENAI_MODEL`。这两个值只在服务端生效，前端设置面板里的 API Base / 模型仅用于 OSS 本地模式。

---

## 3. 收紧 CORS（上线前强烈建议）

`worker/wrangler.toml` 当前是：

```toml
[vars]
ALLOWED_ORIGINS = "*"
```

上线时改成你的前端实际域名，例如：

```toml
ALLOWED_ORIGINS = "https://gzh-typesetter.pages.dev"
```

多个来源用逗号分隔。本地联调阶段可以暂时保留 `*` 或加上 `http://localhost:5173`。

---

## 4. 初始化数据库表结构

对**远程** D1 执行 schema：

```bash
cd worker
npx wrangler d1 execute gzh-typesetter-db --remote --file=./schema.sql
```

验证表已创建：

```bash
npx wrangler d1 execute gzh-typesetter-db --remote --command="SELECT name FROM sqlite_master WHERE type='table'"
```

应看到：`users`、`sessions`、`login_attempts`、`ai_usage`、`presets`、`illustration_jobs`、`illustration_items`、`illustration_artifacts`、`feishu_tokens`、`feishu_apps`。

`schema.sql` 全部使用 `CREATE TABLE IF NOT EXISTS`，**已部署过的库重复执行也是安全的**，升级版本后重跑一次即可补齐新表。

> 升级提示：`ai_usage` 表用于 AI 每日额度统计。未建这张表时，AI 排版 / 封面文案 / 图文生成会返回 500「服务端额度表未初始化」。

### 4.1 AI 用量控制（可选调整）

AI 排版、封面文案、图文生成三个接口统一受以下限制，默认值可在 `wrangler.toml` 的 `[vars]` 中覆盖：

| 变量 | 默认值 | 说明 |
|---|---|---|
| `AI_MAX_INPUT_CHARS` | `30000` | 单次请求的 Markdown 最大字符数，超出返回 413 |
| `AI_DAILY_QUOTA_FREE` | `20` | free 用户每日调用次数（三个接口合计） |
| `AI_DAILY_QUOTA_VIP` | `200` | vip 用户每日调用次数 |
| `AI_DAILY_QUOTA_ANONYMOUS` | `5` | 鉴权关闭（`AI_FORMAT_AUTH_MODE=off`）时，按 IP 计的匿名额度 |

admin 和持有 `UPLOAD_SECRET` 的调用方不计额度。额度按 UTC 日期重置；上游调用失败时自动退回本次计数。

上游地址和模型**只读取** `OPENAI_API_BASE` / `OPENAI_MODEL`，前端无法再指定，避免服务端 Key 被转发到第三方地址。

---

## 5. 部署 Worker

```bash
cd worker

# 先做干跑校验（不真正发布）
npm run deploy -- --dry-run

# 正式部署
npm run deploy
```

部署成功后输出类似：

```
Uploaded gzh-image-worker
Published gzh-image-worker
  https://gzh-image-worker.<你的子域>.workers.dev
```

验证：

```bash
curl https://gzh-image-worker.<你的子域>.workers.dev/health
```

返回 200 即成功。这个 `https://gzh-image-worker.<你的子域>.workers.dev` 就是下一步前端要用的 `VITE_WORKER_URL`。

---

## 6. 构建并部署前端

### 6.1 配置 online 环境变量

编辑 `app/.env.online`：

```env
VITE_APP_MODE=online
VITE_AUTH_MODE=real
VITE_ACCESS_MODE=real
VITE_WORKER_URL=https://gzh-image-worker.<你的子域>.workers.dev
VITE_WORKER_UPLOAD_SECRET=
VITE_DEFAULT_UPLOAD_MODE=r2
```

注意 `VITE_WORKER_URL` **不要带结尾斜杠**。

### 6.2 构建

```bash
cd app
npm run build:online
```

产物在 `app/dist/`。

### 6.3 部署到 Cloudflare Pages（推荐）

首次部署（会提示创建项目）：

```bash
cd app
npx wrangler pages deploy dist --project-name=gzh-typesetter
```

成功后得到 `https://gzh-typesetter.pages.dev`。

之后每次更新就是重复 `npm run build:online && npx wrangler pages deploy dist --project-name=gzh-typesetter`。

### 6.4 部署到其他静态托管（可选）

`app/dist/` 是纯静态文件，也可以放到 Vercel / Netlify / Nginx / OSS 静态网站。只有两条注意：

- 该托管站的访问域名要加进 Worker 的 `ALLOWED_ORIGINS`
- 前端是纯 SPA 单页，`react-router` 路由需要把 404 回退到 `index.html`（Pages 默认支持；Nginx 需配 `try_files $uri /index.html;`）

---

## 7. 部署后初始化

### 7.1 注册第一个账号

打开前端地址，走正常注册流程注册你的管理账号。

### 7.2 升级为 admin

第一个 admin 账号需要直接改库（此时还没有任何 admin 可以调用 API）：

```bash
cd worker
npx wrangler d1 execute gzh-typesetter-db --remote \
  --command="UPDATE users SET role='admin' WHERE email='你的邮箱@example.com'"
```

刷新页面重新登录后生效。

已有 admin 之后，后续的角色调整（含 VIP）优先走 admin API，不必再直连数据库：

```bash
curl -X POST "https://your-worker.workers.dev/api/admin/users/role" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"email": "你的邮箱@example.com", "role": "vip"}'
```

### 7.3 跑一遍线上诊断

用 admin 账号登录，打开控制台页面，查看「线上 Worker 诊断」：

- bindings：DB / IMAGES_BUCKET / ILLUSTRATION_WORKFLOW / BROWSER 应全部就绪
- secrets：OPENAI_API_KEY（及可选的 GEMINI_API_KEY）应显示已配置
- schema 检查应通过

---

## 8. 端到端验证清单

部署完成后按顺序过一遍：

- [ ] `/health` 返回 200
- [ ] 注册 / 登录 / 退出登录正常
- [ ] AI 一键排版可用（登录用户）
- [ ] 智能配图建议可用（vip/admin），能出建议列表
- [ ] 勾选建议 → 生成 → 任务面板出现异步任务 → 完成后「应用到正文」成功，图片能正常显示
- [ ] 编辑器里粘贴/上传图片成功，预览能打开
- [ ] 「复制到公众号」粘贴进公众号编辑器样式正常
- [ ] 保存云端预设、刷新后预设还在
- [ ] 游客访问时 AI 排版提示需要登录（权限拦截生效）

---

## 9. 日常运维

### 查看线上日志

```bash
cd worker
npx wrangler tail
```

### 更新部署

```bash
# 后端有改动
cd worker && npm run deploy

# 前端有改动
cd app && npm run build:online && npx wrangler pages deploy dist --project-name=gzh-typesetter
```

### 回滚 Worker

```bash
cd worker
npx wrangler deployments list      # 查看历史版本
npx wrangler rollback <版本ID>      # 回滚到指定版本
```

### 密钥轮换

重新执行 `npx wrangler secret put OPENAI_API_KEY` 覆盖即可，Worker 会自动用新值发布一个新版本。

### 数据库变更

如果 `schema.sql` 有更新，重新执行第 4 节的命令（schema 全部是 `CREATE TABLE IF NOT EXISTS`，可重复执行，不会清数据）。

---

## 10. 故障排查

| 现象 | 排查 |
| --- | --- |
| 前端调 API 报 CORS | `ALLOWED_ORIGINS` 是否包含前端域名（协议也要一致，http/https 不同源） |
| AI 排版 500 | `wrangler tail` 看错误；多半是 `OPENAI_API_KEY` 没配或余额不足 |
| 配图任务一直不完成 | `wrangler tail`；确认 D1 已执行最新 schema；免费套餐 Browser Rendering 每天只有 10 分钟额度，超额会自动回退 SVG |
| 图片上传成功但打不开 | 确认前端 `VITE_WORKER_URL` 指向当前 Worker；直接访问 `https://<worker>/file/<key>` 测试 |
| 登录后立刻掉线 | 检查 D1 `sessions` 表是否存在（schema 未执行） |
| `wrangler deploy` 报 binding 错误 | `wrangler.toml` 的 `database_id` 是否还是占位符；R2 bucket 名是否拼错 |
| Pages 刷新 404 | 自定义托管需要 SPA 回退配置（见 6.4） |
