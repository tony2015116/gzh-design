# 自托管改造验证记录

日期：2026-11-13。验证环境：Windows，本地 Node.js 24.13.0、Chrome。目标部署环境：Linux 单实例 Node.js。两者的验证边界分开记录。

2026-11-14补充：按用户决定增加Node 22.22.2试运行支持，前后端构建、37项测试及文章/图片浏览器流程本地通过，详见 [Node 22兼容性记录](NODE22_VALIDATION.md)。下文首轮24.13记录作为历史保留，不再表示只有24可用。

## 已通过

- `app/npm run build:server`：前端服务器模式构建成功，不调用 Cloudflare 构建插件。
- `server/npm run build`：共用后端路由与任务执行逻辑打包成功。
- `server/npm test`：5 个测试通过，涵盖 SQLite 持久化与事务回滚、文件字节与元数据持久化、路径穿越拒绝、管理员初始化及防覆盖、真实 HTTP 注册登录/预设隔离/图片权限/异步配图/重启恢复，以及已记录付费步骤恢复时不重复执行。
- 真实 HTTP 超过 12 MiB 的请求返回 413。
- `worker/npm test`：原后端 10 个文件、102 个用例通过；Worker TypeScript 检查和旧入口 dry-run 通过。
- `server/npm audit --omit=dev`：生产依赖未报告已知漏洞。
- 实际 Chrome 注册进入编辑器、设置页加载成功，无页面 JavaScript 错误；预先设置的旧 Cloudflare 地址被服务器同域模式忽略。
- Node 静态服务成功返回 32,232,419 字节的 WASM，MIME 为 `application/wasm`，文件头正确。
- Chromium 适配实际输出中文 PNG，已查看实际图片及编辑器、设置页截图。
- 本任务浏览器和本地测试服务已关闭，未修改用户已有的 `.env.online`，未连接或部署到云服务器。

截图保存在当前工作目录 `output/self-hosted-qa/`。该目录属于忽略的本地产物，不随 Git 自动发布。

## 尚待目标服务器验收

- Linux systemd 与 Nginx 的实际启动、发行版 Chromium 沙箱和中文字体。
- 真实域名、HTTPS、备份恢复及服务重启演练。
- 用户配置的模型服务、Gemini 图片生成、飞书真实授权与文档导入。
- 完整 MP4 编码及播放；本次只验证了 WASM 的服务分发，没有重跑视频成品验收。

2026-11-14补充：HTML过滤、Node账号限流、飞书凭证加密及一次性OAuth state已实施并本地验证，见 [安全加固说明](SECURITY_HARDENING.md)。前端既有ESLint问题及主包大小提示仍在。当前持久化队列只支持单进程，不承诺外部模型调用严格恰好一次执行。
