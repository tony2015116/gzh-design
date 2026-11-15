# 完整部署指南：本地运行与Linux公网服务器

更新日期：2026-11-15。

当前发布为一期：排版、个人API、账号、文章管理及已有导出工具。生产环境不展示爆文发现、选题库和采集；二期源码保留供本地开发，详见[发布范围](RELEASE_SCOPE.md)。

- 下载ZIP后在Windows、Linux、macOS本机运行：见[本地部署指南](LOCAL_DEPLOYMENT.md)。
- Ubuntu公网服务器部署：按本文操作，支持Git克隆、下载ZIP、迁移旧项目。
- 已有项目在`/home/gzh/gongzhonghao`：跳过首次下载和迁移，按实际进度核对构建、环境、服务和代理。

GitHub只能下载已推送代码。旧下载包中的模板可能仍有`/opt/gzh-typesetter`路径，安装服务时按本文完整配置核对。

## 1. 最终方案与执行用户

| 项目 | 当前方案 |
| --- | --- |
| 运行用户、家目录 | gzh、/home/gzh |
| 项目目录 | /home/gzh/gongzhonghao |
| Node | 现有22.22.2可先试运行；也支持24.13+ |
| Node路径 | /usr/bin/node，必须以实际检查结果为准 |
| 监听地址 | 127.0.0.1:3100 |
| 数据 | server/data，SQLite、objects图片目录、.credentials-key |
| 进程管理 | systemd单实例 |
| 入口 | 现有Nginx、sites-available和sites-enabled、HTTPS |
| 示例域名 | paiban.example.com，全文替换为真实域名 |

3000已被服务器的next-server使用，保留现有服务。本项目3100无需对公网开放。原aipath、default、palmistry站点继续保留。整个网站由Node提供，Nginx代理所有路径，无需另装数据库或部署Cloudflare。

| 执行用户 | 操作 |
| --- | --- |
| root | 用户、权限、.env、软件安装、systemd、Nginx、证书、备份 |
| gzh | Git、下载解压源码、npm安装依赖、构建、手动运行 |
| root发起，程序以gzh运行 | runuser形式的管理员初始化 |

每个命令块均标明执行身份；配置内容只写入对应文件。逐步操作，任何一步失败先解决，不把全文一次粘贴执行。

**执行用户：有sudo权限的原登录用户。已是root则跳过。**

```bash
sudo -i
```

**执行用户：root。切换到gzh后再执行标为gzh的命令。**

```bash
su - gzh
whoami
```

**执行用户：gzh。仅在通过su进入时，用exit返回原root终端。**

```bash
exit
whoami
```

后续可使用两个终端，分别保持root和gzh。随时用whoami确认身份。gzh无需sudo权限或SSH密码登录。

## 2. 环境检查与创建用户

**执行用户：root。**

```bash
node --version
npm --version
command -v node
ss -lntp 'sport = :3100'
getent passwd gzh
```

3100应无LISTEN记录；若占用先识别程序，不停止其他项目。另选端口时同步.env、Nginx和本文健康检查地址。不要为本项目覆盖其他服务使用的Node。

**执行用户：root。仅用于本项目专用gzh用户；已有同名用户另有用途时停止并核对。**

```bash
getent group gzh >/dev/null || groupadd --system gzh
if ! id gzh >/dev/null 2>&1; then
  useradd --system --gid gzh --create-home --home-dir /home/gzh --shell /bin/bash gzh
fi
usermod -s /bin/bash gzh
getent passwd gzh
```

Shell使用/bin/bash，解决早期nologin导致“This account is currently not available”的问题。家目录应是/home/gzh。若旧专用用户记录使用其他家目录，先停本项目及该用户的相关会话，再由root修正；不要在gzh会话中修改其用户记录。

**执行用户：root。仅在需要修正旧家目录时执行，不会自动迁移旧文件。**

```bash
usermod --home /home/gzh --gid gzh gzh
install -d -o gzh -g gzh -m 0750 /home/gzh
```

## 3. 获取项目，三选一

目标目录已存在时跳过首次安装。始终保留完整app、server、worker目录，后端构建会读取worker/src与worker/schema.sql。

### A. Git克隆

服务器需要Git。若未安装，由root执行`apt-get install -y git`。

**执行用户：gzh。先由root执行su - gzh。**

```bash
git clone https://github.com/zhouwei713/luobo-gzh-design.git /home/gzh/gongzhonghao
```

### B. 下载ZIP，无需Git

可在[GitHub仓库](https://github.com/zhouwei713/luobo-gzh-design)点击Code → Download ZIP，再上传到/home/gzh。也可直接在服务器下载。

**执行用户：root。安装工具。**

```bash
apt-get update
apt-get install -y curl unzip
```

**执行用户：gzh。仅用于首次安装。**

```bash
cd /home/gzh
curl -fL --retry 3 -o luobo-gzh-design-master.zip https://github.com/zhouwei713/luobo-gzh-design/archive/refs/heads/master.zip
```

**执行用户：gzh。下载成功后执行；任一目录已存在时停止，不覆盖。**

```bash
if [ -e /home/gzh/gongzhonghao ] || [ -e /home/gzh/luobo-gzh-design-master ]; then
  echo '目标目录已存在，请核对已有项目，停止首次安装。'
else
  unzip -q /home/gzh/luobo-gzh-design-master.zip -d /home/gzh &&
    mv /home/gzh/luobo-gzh-design-master /home/gzh/gongzhonghao
fi
```

ZIP只有源码快照，没有.git，不能git pull。解压后仍需npm安装及构建。真实.env、用户库和图片不会随源码下载，勿将它们公开提交。[GitHub源码包说明](https://docs.github.com/en/repositories/working-with-files/using-files/downloading-source-code-archives)

### C. 从/home/ubuntu/gzh迁移已有项目

若已经完成迁移，跳过本节。默认数据位于旧项目server/data；自定义DATA_DIR先定位真实数据库、图片和加密密钥，另行复制，不能用空库代替旧库。

**执行用户：root。已安装本项目服务时先停止。**

```bash
systemctl stop gzh-typesetter
```

从未安装服务时跳过。手动运行的本项目在原终端Ctrl+C停止。不要停其他项目的Node进程。确认旧实例退出后备份。

**执行用户：root。备份失败时停止，不继续迁移。**

```bash
umask 077
mkdir -p /root/gzh-backups
chmod 700 /root/gzh-backups
tar --exclude=server/node_modules --exclude=server/dist \
  -czf "/root/gzh-backups/before-move-$(date +%Y%m%d-%H%M%S).tar.gz" \
  -C /home/ubuntu/gzh server
apt-get update
apt-get install -y rsync
```

**执行用户：root。保留原目录，不使用--delete。**

```bash
if [ -e /home/gzh/gongzhonghao ]; then
  echo '目标目录已存在，停止迁移。'
else
  install -d -o gzh -g gzh -m 0750 /home/gzh/gongzhonghao &&
  rsync -a --exclude='node_modules/' --exclude='/app/dist/' --exclude='/server/dist/' \
    /home/ubuntu/gzh/ /home/gzh/gongzhonghao/ &&
  chown -R gzh:gzh /home/gzh/gongzhonghao
fi
```

复制保留.env、SQLite及WAL、objects和.credentials-key。只有原库确实存在且已停服时，才比较两个库文件的SHA256；新实例启动后文件变化属于正常情况。旧目录等完整验收后再决定保留时间。

## 4. 以gzh安装依赖并构建

此前root执行过npm或上传源码导致归属不一致时先修正。此步骤会改变.env归属，第5节必须单独收紧。

**执行用户：root。仅针对本项目。**

```bash
chown -R gzh:gzh /home/gzh/gongzhonghao
```

**执行用户：gzh。root先su - gzh，逐条执行；任一步失败先解决。**

```bash
whoami
command -v node
node --version
npm --version
cd /home/gzh/gongzhonghao/app
npm ci
npm run build:server
cd /home/gzh/gongzhonghao/server
npm ci
npm run build
```

现有22.22.2可试运行；最低依据以当前server/package.json的engines为准。不要改用npm run deploy或普通npm run build来构建前端自托管版，前端必须build:server。原/root/.nvm下的Node通常不能供gzh使用，应使用gzh可访问的安装路径，不放开/root权限。

## 5. 配置.env与数据权限

**执行用户：root。从gzh终端exit返回或使用独立root终端。**

```bash
cd /home/gzh/gongzhonghao/server
test -f .env || cp .env.example .env
mkdir -p data
chown -R gzh:gzh data
chmod 700 data
chown root:gzh .env
chmod 640 .env
nano .env
```

保留已有值，不用模板覆盖旧.env。以下是配置内容，写入.env并将示例域名换成真实域名；同名键只保留一项。

```dotenv
NODE_ENV=production
LOCAL_DISCOVERY_DEBUG=0
ENABLE_PHASE2=0
HOST=127.0.0.1
PORT=3100
PUBLIC_URL=https://paiban.example.com
DATA_DIR=./data
STATIC_DIR=../app/dist
TRUST_PROXY_LOOPBACK=1
CREDENTIALS_ENCRYPTION_KEY=
CHROMIUM_EXECUTABLE_PATH=
OPENAI_API_KEY=
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=填写实际模型名
GEMINI_API_KEY=
REDFOX_API_KEY=
REDFOX_DAILY_REQUEST_LIMIT=20
REDFOX_SYNC_COOLDOWN_SECONDS=60
REDFOX_MAX_BATCH_REQUESTS=7
REDFOX_BATCH_INTERVAL_MS=1000
```

PUBLIC_URL是用户访问的公网HTTPS源，不带路径、3100端口或/api。TRUST_PROXY_LOOPBACK=1只用于本方案的自管Nginx覆盖X-Real-IP且Node仅监听本机。密钥仅放后端，不填入VITE变量或上传GitHub。

原CREDENTIALS_ENCRYPTION_KEY非空则保留原值；留空则首次启动生成data/.credentials-key。迁移、恢复时必须保留配套密钥，不能随意重建。缺少AI或RedFox密钥仍可验证基础排版、账号和文章。

排版工作台的AI排版、封面与图文生成统一使用用户在“工作台设置”填写的个人API，游客和登录用户均可设置，配置仅存当前浏览器并直接请求服务商。接口须支持浏览器跨域访问，HTTPS站点须使用HTTPS接口；请求失败不自动改用平台API。服务器.env中的OPENAI配置不作为这些个人功能的默认来源，原后端选题简报等接口仍使用服务器配置和既有权限。会员平台API的来源选择、服务端权益及额度另见[待办](TODO.md)，本轮未开放会员平台入口。

CHROMIUM_EXECUTABLE_PATH可先留空，采用已有SVG回退。需要服务端浏览器截图时，安装适配Ubuntu的Chrome/Chromium和中文字体，并以gzh测试真实PNG。非root不代表沙箱和AppArmor一定可用，不默认关闭沙箱。

### 先在前台试运行

**执行用户：root。已安装systemd服务时先停本项目，再查3100。未安装时跳过stop。**

```bash
systemctl stop gzh-typesetter
ss -lntp 'sport = :3100'
```

端口空闲后继续。

**执行用户：gzh。root先su - gzh。**

```bash
cd /home/gzh/gongzhonghao/server
/usr/bin/node --env-file=.env index.mjs
```

**执行用户：root，另开终端检查。**

```bash
curl -f http://127.0.0.1:3100/health
```

成功后回到gzh前台终端Ctrl+C停止，并确认3100不再监听，再启用systemd。公网.env使用HTTPS域名，直接HTTP访问本机health仅用于排查，正式登录在HTTPS完成后验收。

## 6. systemd托管

**执行用户：root。已有配置先备份。**

```bash
if [ -f /etc/systemd/system/gzh-typesetter.service ]; then
  cp /etc/systemd/system/gzh-typesetter.service "/etc/systemd/system/gzh-typesetter.service.bak-$(date +%Y%m%d-%H%M%S)"
fi
nano /etc/systemd/system/gzh-typesetter.service
```

将以下完整配置写入并保存，避免继续沿用下载包中的旧/opt路径。Node若不在/usr/bin/node，修改ExecStart为实际绝对路径。

```ini
[Unit]
Description=GZH Typesetter Node Server
After=network.target

[Service]
Type=simple
User=gzh
Group=gzh
WorkingDirectory=/home/gzh/gongzhonghao/server
Environment=NODE_ENV=production
EnvironmentFile=/home/gzh/gongzhonghao/server/.env
ExecStart=/usr/bin/node index.mjs
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/gzh/gongzhonghao/server/data /var/lib/gzh /var/cache/gzh
StateDirectory=gzh
StateDirectoryMode=0700
CacheDirectory=gzh
CacheDirectoryMode=0700
Environment=HOME=/home/gzh
Environment=XDG_CONFIG_HOME=/var/lib/gzh
Environment=XDG_CACHE_HOME=/var/cache/gzh

[Install]
WantedBy=multi-user.target
```

ProtectHome=read-only允许读取家目录中的代码，ReadWritePaths单独允许data写入。不要沿用ProtectHome=true。自定义DATA_DIR时同步ReadWritePaths，并先创建实际目录。StateDirectory、CacheDirectory由systemd创建供运行时使用。

**执行用户：root。先核对路径。**

```bash
grep -E '^(User|Group|WorkingDirectory|EnvironmentFile|ExecStart|ProtectHome|ReadWritePaths)=' /etc/systemd/system/gzh-typesetter.service
ls -l /home/gzh/gongzhonghao/server/.env
ls -l /home/gzh/gongzhonghao/server/index.mjs
ls -l /home/gzh/gongzhonghao/server/dist/backend.mjs
systemd-analyze verify /etc/systemd/system/gzh-typesetter.service
```

存在本服务的配置错误或文件缺失时先修复。其他服务的警告需按服务名区分。

**执行用户：root。核对通过后启动。**

```bash
systemctl daemon-reload
systemctl enable gzh-typesetter
systemctl reset-failed gzh-typesetter
systemctl restart gzh-typesetter
systemctl status gzh-typesetter --no-pager -l
curl -f http://127.0.0.1:3100/health
```

应显示active (running)，health返回成功。修改.service后必须daemon-reload再重启；只改.env时重启即可。ExecStart不能只剩index.mjs，不依赖其他终端的GZH_NODE_BIN变量。[systemctl说明](https://www.freedesktop.org/software/systemd/man/latest/systemctl.html)

只运行单实例，不同时开npm start或PM2集群。

## 7. 创建管理员

**执行用户：root发起，初始化程序通过runuser以gzh运行。将邮箱换成尚未注册的自己的邮箱。**

```bash
cd /home/gzh/gongzhonghao/server
read -rsp '设置管理员密码：' ADMIN_PASSWORD
printf '\n'
runuser -u gzh -- env ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  /usr/bin/node --env-file=.env admin.mjs admin@example.com
unset ADMIN_PASSWORD
```

密码8至128位且含字母和数字。看到Administrator created后可登录，无需重启。脚本不覆盖已存在的账号；普通注册默认free，首个注册用户不会自动成为管理员。已有账号需通过现有管理员修改角色。

## 8. Nginx和HTTPS

沿用现有sites-available、sites-enabled和Certbot管理方式。新域名配置独立站点，不修改原aipath等站点。示例paiban.example.com必须统一替换；不要复制其他域名的证书路径。

**执行用户：root。已有站点先备份。**

```bash
if [ -f /etc/nginx/sites-available/gzh ]; then
  cp /etc/nginx/sites-available/gzh "/etc/nginx/sites-available/gzh.bak-$(date +%Y%m%d-%H%M%S)"
fi
nano /etc/nginx/sites-available/gzh
```

写入以下配置，先开HTTP让Certbot验证域名：

```nginx
server {
    listen 80;
    server_name paiban.example.com;
    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_read_timeout 330s;
        proxy_send_timeout 330s;
    }
}
```

12m支持图片上传请求，后端仍限制文件10MB及类型。另一个项目的64k限制、/static缓存和/admin规则不直接搬入。不设置Nginx静态root指向项目或server/data。[Nginx代理说明](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)

**执行用户：root。仅缺少链接时创建，已有链接须确认指向正确文件。**

```bash
if [ ! -e /etc/nginx/sites-enabled/gzh ] && [ ! -L /etc/nginx/sites-enabled/gzh ]; then
  ln -s /etc/nginx/sites-available/gzh /etc/nginx/sites-enabled/gzh
fi
ls -l /etc/nginx/sites-enabled/gzh
nginx -t && systemctl reload nginx
curl -f -H 'Host: paiban.example.com' http://127.0.0.1/health
```

将真实域名DNS解析到公网IP，开放80和443。若配置AAAA，IPv6地址和监听也须可达。HTTP成功后沿用服务器已有Certbot；已有该域名证书或其他管理工具时不重复签发。

**执行用户：root。仅在尚未安装Certbot且决定使用它时执行。**

```bash
apt-get update
apt-get install -y certbot python3-certbot-nginx
```

**执行用户：root。先替换真实域名，确认DNS和公网80可达。**

```bash
certbot --nginx -d paiban.example.com --redirect
nginx -t && systemctl reload nginx
curl -f https://paiban.example.com/health
```

Certbot自动补充443证书配置和HTTP跳转，不能提前引用尚不存在的证书文件。续期按当前服务器已有证书管理方式检查。[Certbot说明](https://certbot.eff.org/instructions)

如果.env的PUBLIC_URL刚改成最终HTTPS域名，由root执行`systemctl restart gzh-typesetter`。飞书回调使用`https://你的域名/feishu/callback`。

## 9. 一期上线验收

- 原有其他站点继续可访问，本项目health、首页和登录正常。
- 注册、登录、用户中心可用，管理员角色正确。
- 保存文章、刷新、再次修改保存，以及另一个浏览器读取已保存文章正常。
- 登录后上传图片返回最终HTTPS地址，其他设备可打开；未登录上传被拒绝。
- 游客和登录用户均能在工作台设置配置个人API，AI排版不要求会员；测试真实模型前自行核对调用费用。
- 侧栏和手机导航无爆文发现、选题入口，直接访问/discovery和/topics回到排版；对应API返回404，管理员也无法绕过。
- 生产关闭二期，不需要填写REDFOX_API_KEY，也不会启动采集；已有二期表与数据保留。RedFox参数仅为后续开发配置参考。
- 服务重启后账号、文章、图片及原密钥仍在，进程实际用户为gzh。
- 如启用Chrome/Chromium，验收实际PNG与中文字体；模型、飞书和公众号后台粘贴分别验收。

**执行用户：root。检查运行用户和日志。**

```bash
systemctl show gzh-typesetter -p User -p Group -p MainPID
journalctl -u gzh-typesetter -n 60 --no-pager
```

## 10. 备份、更新和恢复

### 更新前备份

默认data含SQLite及WAL、objects和.credentials-key，.env也须配套保存。自定义DATA_DIR改用真实数据目录。

**执行用户：root。停止本项目后备份，确认成功再更新。**

```bash
umask 077
mkdir -p /root/gzh-backups
chmod 700 /root/gzh-backups
systemctl stop gzh-typesetter
tar -czf "/root/gzh-backups/gzh-$(date +%Y%m%d-%H%M%S).tar.gz" \
  -C /home/gzh/gongzhonghao/server data .env
```

备份包含密钥和个人数据，限制访问并加密保存到独立位置。SQLite运行时不要只复制主库。

### Git安装的更新

**执行用户：gzh。root先su - gzh；逐条执行，任一步失败先解决。**

```bash
git -C /home/gzh/gongzhonghao status --short
git -C /home/gzh/gongzhonghao pull --ff-only
cd /home/gzh/gongzhonghao/app
npm ci
npm run build:server
cd /home/gzh/gongzhonghao/server
npm ci
npm run build
```

status存在本地修改时先核对保留，不强制reset或覆盖。

**执行用户：root。构建成功后，gzh终端exit返回。**

```bash
systemctl start gzh-typesetter
curl -f http://127.0.0.1:3100/health
```

### ZIP安装的更新

ZIP没有.git，不执行git pull。由root按上文停服备份；以gzh将新包解压到独立目录，如/home/gzh/gongzhonghao-next，在新目录按第4节构建。由root复制原.env及完整data到新目录，保留原密钥，恢复.env为root:gzh、640，data为gzh:gzh、700；自定义DATA_DIR单独核对。

核对成功后，在停服状态由root将旧项目改名保留，再将新目录改名为/home/gzh/gongzhonghao；目标备份目录须不存在，不覆盖。服务路径不变，启动并检查旧账号、文章、图片。不能同时运行两份实例。源码包更新不覆盖原.env，不删除原数据。

### 恢复

停服务后恢复更新前的代码及配套data、.env和密钥，再恢复权限并启动。新版本写过数据后不要直接混用旧代码与新库。旧目录和备份也含密钥，不放在公开可访问位置。

## 11. 已遇到的故障

| 现象 | 处理 |
| --- | --- |
| su提示account is currently not available | root执行usermod -s /bin/bash gzh，再su - gzh |
| Command index.mjs is not executable | ExecStart补全/usr/bin/node index.mjs，再daemon-reload |
| Failed to load environment files | EnvironmentFile改到/home/gzh/gongzhonghao/server/.env，并确认文件存在 |
| Result: resources | journalctl查看具体缺项，核对.env、工作目录、ReadWritePaths目录 |
| Unit file changed on disk | root执行systemctl daemon-reload后重启 |
| EADDRINUSE或health返回意外404 | ss检查3100占用者，避免请求到其他项目 |
| EACCES | 核对代码可读、data归属gzh和.env权限 |
| Nginx 502 | 先检查127.0.0.1:3100/health，再核对proxy_pass |
| 图片上传413 | client_max_body_size设为12m，后端仍限制大小和类型 |
| npm EBADENGINE | 核对gzh终端实际Node版本与server/package.json，不只看root版本 |

**执行用户：root。只读诊断，不输出.env密钥。**

```bash
systemctl cat gzh-typesetter
journalctl -u gzh-typesetter -n 60 --no-pager
ss -lntp 'sport = :3100'
curl -f http://127.0.0.1:3100/health
```

## 验证范围

本指南依据当前源码和用户提供的服务器截图更新。此前Node22.22.2兼容性记录见[NODE22_VALIDATION.md](NODE22_VALIDATION.md)，发布隔离见[RELEASE_SCOPE.md](RELEASE_SCOPE.md)。未直接连接服务器，Linux权限、systemd、证书和域名仍需现场验收。

另见[安全与密钥](SECURITY_HARDENING.md)、[RedFox](VIRAL_DISCOVERY.md)、[图片管理](ARTICLE_IMAGES.md)、[systemd权限说明](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)、[Puppeteer](https://pptr.dev/troubleshooting)。
