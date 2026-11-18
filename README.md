# 公众号排版工作台 · Windows 桌面版

编辑或导入 Markdown / TXT，实时预览公众号排版。支持本机草稿、主题与风格方案、字号和间距、图片链接管理、公众号富文本复制、X 文案导出、文章长图、图片切片和小红书封面制作。

基础排版使用本机数据。远程图片、自定义图床和个人 AI API 需要联网。AI 排版、封面方案和小红书图文使用工作台设置中的 OpenAI 兼容接口，服务商需允许跨域访问。个人配置保存在桌面应用的用户数据目录。

## Windows 安装

本地已生成 `app/release/LuoboGzh-Setup-0.1.0-x64.exe`（约 115 MiB）。GitHub Releases 的 `desktop-v0.1.0` 目前是草稿，附件上传返回 HTTP 401，暂无公开下载地址。

取得安装包后，在 Windows x64 上双击运行，按向导选择安装目录，然后从开始菜单打开「公众号排版工作台」。安装包自带 Electron 运行时，无需另外安装 Node.js。安装包未签名，已通过归档完整性检查。核心功能已在 Linux Electron 桌面环境测试，Windows 实装仍待验证。

## 仓库中的 Skill

仓库保留独立的 [排版 Skill](skills/luobo-gzh-design/SKILL.md)，包含使用说明、参考资料和可独立运行的渲染脚本。Skill 与工作台源自同一套排版引擎，其使用方法见 Skill 文档。当前 EXE 包含工作台的排版代码与界面，未包含独立 Skill 目录，也不会为 Agent 安装 Skill。

## 安装包大小

当前 EXE 为 120,616,876 字节（约 115 MiB）。解包后整个应用约 358 MiB，其中工作台自身的 `resources/app.asar` 约 0.92 MiB，体积主要来自 Electron 自带的 Chromium 及其资源。

可以优先测试仅保留必要的 Chromium 语言资源。当前语言资源解包后约 49 MiB，安装包实际能节省多少，需用重新打包的结果衡量。如果目标是显著缩小下载体积，可评估使用 Windows WebView2 的方案，例如 Tauri 2。这需要迁移桌面壳，并在 Windows 上复测富文本剪贴板、PNG 下载和个人 API。使用联网引导安装时，缺少 WebView2 的机器需要额外下载运行时。

## 开发与打包

使用 Node.js 22.22.2 或 24 LTS，在仓库中运行：

```bash
cd app
npm ci
npm run dev
```

运行桌面版：

```bash
npm run build
npm run start:desktop
```

在 Windows 的 `app/` 目录运行 `npm run package:win` 重建 x64 安装包。产物位于 `app/release/`。首次构建需要联网下载 Electron 和 NSIS 工具。

[Markdown 语法参考](docs/syntax_tutorial.md) · [上游仓库](https://github.com/zhouwei713/luobo-gzh-design)
