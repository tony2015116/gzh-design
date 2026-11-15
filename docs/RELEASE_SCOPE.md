# 一期生产发布范围

更新：2026-11-15。

一期保留文章排版、主题和皮肤、全屏、Markdown导入、个人API、复制及导出、登录注册、用户中心、我的文章、图片管理和现有视频对比工具。

二期包含爆文发现、我的选题、RedFox采集、采集历史与日期覆盖、AI选题简报以及后续会员平台API。二期源代码保留，但不作为当前生产产品展示。

## 前端隔离

releaseScope.ts仅在DEV且VITE_ENABLE_PHASE2=true时启用二期。所有生产构建都关闭，即使错误传入true也不开放。app/.env.server、.env.online显式false；.env.oss的true仅供npm run dev。

- 侧栏、手机导航、底部推荐、登录和用户中心不展示二期入口或宣传。
- /discovery、/topics及/topics/:id不注册，直接访问返回文章排版页。
- ResearchView仅在二期开启时懒加载；一期公共弹窗独立于discovery目录。
- 一期不自动探测/api/discovery/local-session，不发二期数据请求。

## Node隔离

仅NODE_ENV不为production且ENABLE_PHASE2=1时初始化二期模块。默认关闭；production下即使ENABLE_PHASE2=1也关闭。

未启用时/api/discovery及/api/topics整组接口返回404，管理员也不例外；不初始化二期表，不恢复二期采集任务。已有二期数据库表和内容保留，不删除。原一期文章、账号、图片接口正常运行。

server/.env.example默认ENABLE_PHASE2=0。不要在生产服务器通过切换NODE_ENV绕过发布范围。

## 本地二期开发

先完成server依赖安装和构建，再在app目录执行npm run dev。OSS开发配置VITE_ENABLE_PHASE2=true，Vite本地插件按该开关启动二期后端，仅限回环访问。真实付费采集仍要求登录管理员，免登录调测不能调用供应商付费服务。

单独npm run dev:local仅启动开发后端，需要搭配开发前端才能看见二期；它不会使已构建的一期前端开放二期。可通过LOCAL_DEBUG_PORT和DATA_DIR指定独立端口及测试库。

## 验证

release-scope.test.mjs覆盖生产标志不可绕过、游客与管理员接口404、一期API继续工作以及关闭时不建二期表。release-scope-browser.mjs检查桌面、手机、游客、管理员、直接路由和登录/用户中心文案。浏览器测试使用临时数据库，无真实供应商调用。

生产构建执行app中的npm run build:server，后端在server中npm run build。完整命令和执行用户见[部署指南](SELF_HOSTED.md)。构建与本地测试不代表服务器已更新，公网部署后仍须验收。

本次本地验证：前后端构建通过，Node22.22.2下42项服务端测试通过；生产隔离、个人API、文章管理及图片管理的Chrome验收通过，OSS开发模式注册登录与图片上传通过。生产JS产物未匹配到爆文发现、我的选题或RedFox文案。测试服务使用临时数据库并关闭，不产生真实供应商调用。
