# Linux 自有服务器部署

部署方式：Node.js 单进程同时提供 React 静态页面、API、文件和配图队列。无需 Cloudflare 账号、D1、R2 或 Workflows。当前为全新部署，不包含旧数据迁移。

## 环境

- Node.js 24.13 或以上的 24 LTS 版本、npm。
- Linux、systemd、Nginx；Chromium 和中文字体用于信息图 PNG 截图。
- SQLite 使用 Node.js 内置 `node:sqlite`，无需额外数据库进程。该 API 在选定版本仍有实验提示，不应混用低版本 Node.js。
- 仅运行一个 Node.js 实例。不要使用 PM2 cluster 或启动多个服务共同消费本目录的数据。

以下示例使用 Debian 系发行版，安装路径 `/opt/gzh-typesetter`。其他发行版需调整系统包名、Chromium 路径和 Node 路径。

## 安装和构建

先按 Node.js 官方安装说明安装 Node.js 24，再检查 `node --version`。将项目复制或拉取到 `/opt/gzh-typesetter`，用部署账户执行：

```bash
cd /opt/gzh-typesetter/app
npm ci
npm run build:server

cd /opt/gzh-typesetter/server
npm ci
npm run build
cp .env.example .env
chmod 600 .env
```

`server` 构建需要仓库里的 `worker/src` 和 `worker/schema.sql`，不要只上传 `server` 后运行构建。构建后运行只需要 `server/`（包含 dist 和生产依赖）及 `app/dist/`。更新前端必须使用 `build:server`，避免使用会调用 Wrangler 的 `app` 默认 deploy 命令。

编辑 `server/.env`：

- 将 `PUBLIC_URL` 改成真实的 `https://域名`，不带子路径。图片链接使用此地址，域名之后应保持稳定。
- 配置 `OPENAI_API_KEY`、模型地址与模型名。Gemini Key 仅在需要真实图片生成时配置。
- 后端默认只监听 `127.0.0.1:3000`，由 Nginx 对外代理。
- API Key 只放后端环境变量，前端无需配置 Worker URL 或上传 Secret。

Debian 示例：

```bash
sudo apt-get update
sudo apt-get install -y nginx chromium fonts-noto-cjk sqlite3
sudo useradd --system --home /var/lib/gzh --create-home --shell /usr/sbin/nologin gzh
sudo mkdir -p /opt/gzh-typesetter/server/data
sudo chown -R gzh:gzh /opt/gzh-typesetter/server/data /var/lib/gzh
sudo chmod 700 /opt/gzh-typesetter/server/data
sudo chown root:gzh /opt/gzh-typesetter/server/.env
sudo chmod 640 /opt/gzh-typesetter/server/.env
```

应用代码和 node_modules 应允许 gzh 用户读取，配置示例只授予数据目录写权限。Chromium 保持沙箱开启，以普通用户运行。若发行版禁止非特权 user namespace，需按 Chromium 官方建议配置沙箱；不要直接以 root 加 `--no-sandbox` 运行。未配置 Chromium 时配图使用 SVG 回退，该回退不等于 PNG 截图验收通过。

## 创建管理员

先创建服务用户和数据目录，再执行以下命令。管理员创建工具只创建新账号，不覆盖已有账号密码。

```bash
cd /opt/gzh-typesetter/server
read -rsp 'Admin password: ' ADMIN_PASSWORD; echo
sudo -u gzh env ADMIN_PASSWORD="$ADMIN_PASSWORD" /usr/bin/node --env-file=.env admin.mjs admin@example.com
unset ADMIN_PASSWORD
```

请确认 `/usr/bin/node` 为 Node.js 24。如果使用其他安装位置，修改这里和 systemd 的 ExecStart。CLI 只用于新部署初始化，已有用户通过管理员界面调整角色。普通注册用户默认为 free，配图功能仍要求 vip / admin。

## 启动、代理和 HTTPS

```bash
sudo cp /opt/gzh-typesetter/deploy/gzh-typesetter.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now gzh-typesetter
curl -f http://127.0.0.1:3000/health
sudo journalctl -u gzh-typesetter -n 50 --no-pager
```

将 `deploy/nginx.conf` 的域名改成真实域名后安装至 Nginx。先执行 `sudo nginx -t`，通过后 reload。使用现有证书管理方式配置 HTTPS 和 HTTP 跳转，开放 80/443，后端端口保持仅本机监听。示例 HTTP 配置本身不生成证书。

飞书应用的网页回调地址配置为 `https://你的域名/feishu/callback`。飞书仍由各用户配置自己的应用并绑定账号。

同域构建会忽略浏览器中曾保存的旧 Worker 地址。若旧浏览器保存了 base64 上传模式，可在设置里选择“服务器图床”。上传需先登录。FFmpeg WASM 由 Node 静态服务直接提供，避免 Cloudflare 单文件限制；编码仍在浏览器进行，未改为服务器 FFmpeg。

## 数据与备份

- `server/data/gzh.sqlite`：用户、会话、预设、额度、配图任务与步骤记录。
- `server/data/objects/`：上传图片和配图源文、方案、产物，以内部对象文件保存，不能直接作为 Nginx 静态目录公开。
- API 只公开图片路径。任务原文、JSON 方案和 HTML 产物不能通过 `/file/` 下载。
- 队列单路处理，任务与完成步骤持久化。进程重启后恢复未完成任务，已记录步骤不会再次执行；如果外部模型调用已成功但步骤尚未落盘时断电，该步骤可能重新调用并计费。失败任务不会无限重试。

最简单可靠的备份方式是停服后备份整个数据目录和 `.env`，然后启动。SQLite 开启 WAL，运行时不要只复制主库文件。

```bash
sudo systemctl stop gzh-typesetter
sudo tar -czf /安全备份目录/gzh-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /opt/gzh-typesetter/server data .env
sudo systemctl start gzh-typesetter
```

恢复时先停服，将备份解压回原位置、恢复 gzh 用户权限，再启动。备份包含用户凭证和飞书 token，应只允许运维访问。原项目的飞书凭证明文存储和预览 HTML 过滤问题仍需单独加固，本次运行环境迁移不代表这些审计项已全部完成。

更新时先备份，在维护窗口停服，拉取代码并重新运行两处 `npm ci` 和构建命令，然后启动。不要删除数据目录；不要原地用空目录覆盖 `server/data`。schema 使用兼容的建表语句，后续有破坏性表结构变更时应提供专门迁移。

## 上线验收

1. `/health` 返回成功，首页和 `/login` 刷新正常。
2. 管理员可登录，预设可以保存、删除；匿名上传返回 401，登录上传返回公开 HTTPS 图片链接。
3. 配置模型后检查 AI 排版；配图生成完成后仍由用户手动应用。
4. 服务重启后用户、图片、预设仍在，未完成配图任务继续处理。
5. `/assets/*.wasm` 可下载，小视频 MP4 实际导出可播放。
6. 用真实飞书账号确认回调和图片导入，再检查公众号后台实际粘贴效果。

本地测试不能代替服务器上的域名、证书、Chromium 沙箱和真实第三方账号验收。

技术参考：[Node.js 24.13 SQLite API](https://nodejs.org/download/release/v24.13.0/docs/api/sqlite.html)、[Puppeteer 系统配置](https://pptr.dev/guides/system-configuration)。
