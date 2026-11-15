# Node.js 22.22.2 兼容性验证

日期：2026-11-14。用户服务器已安装Node 22.22.2，决定先用现有版本试运行，不升级全局Node。

原先24.13为首轮验证基线；项目实际使用的DatabaseSync、同步SQL、WebCrypto及File等接口在本次22.22.2测试中可用。已调整server的engines为 `^22.22.2 || >=24.13.0`，构建目标为 `node22.22`，不将所有更早的Node 22版本视为已验证。

## 亲手验证

在Windows独立下载并使用Node 22.22.2，原全局Node 24.13.0及用户5173开发服务未替换或停止。复用当前已安装依赖，通过22.22.2实际执行：

- server/build.mjs：通过。
- 服务端全部37项测试：通过，包含SQLite、账号、上传权限、文章、采集模拟、凭证加密及重启持久化。
- 前端TypeScript和Vite server模式构建：通过；保留punycode弃用和主包大小提示。
- 文章管理与图片浏览器流程：通过，临时SQLite及Chrome，包含刷新保留修改、保存冲突、上传原字节、替换及撤销、失败保留正文。截图仍在对应功能的output目录。

没有调用真实RedFox、模型或飞书，测试服务与浏览器均已关闭。服务器数据未参与测试。

## 服务器试运行

在gzh已可读取.env、写入data的前提下，root终端执行：

```bash
runuser -u gzh -- bash -c 'cd /home/gzh/gongzhonghao/server && /usr/bin/node --env-file=.env index.mjs'
```

另开终端检查：

```bash
curl -f http://127.0.0.1:3000/health
```

前台试运行成功后Ctrl+C退出，再交给systemd单实例启动，ExecStart使用 `/usr/bin/node index.mjs`。若3000已由本项目systemd占用，先停该服务，不启动第二实例。不因EBADENGINE提示使用force修改依赖。

本轮不等于目标Ubuntu系统已验收：Linux权限、实际npm ci安装、Chromium沙箱、域名/HTTPS及第三方接口仍需现场验证。SQLite仍可能输出实验性提示，提示本身不等于失败。本地版本声明更新尚需提交推送，服务器拉到的旧代码可能继续提示原24.13版本要求。

参考：[Node 22.22.2官方SQLite文档](https://github.com/nodejs/node/blob/v22.22.2/doc/api/sqlite.md)。
