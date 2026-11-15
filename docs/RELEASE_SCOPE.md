# 一期生产发布范围

更新：2026-11-15。

一期优先开放文章排版、主题和皮肤、全屏、Markdown导入、个人API、复制及导出、图片管理和现有视频对比工具。登录和用户中心入口保留，账号功能继续完善。

“我的文章、爆文发现、我的选题”均属于后续开放功能。三个入口在生产中保留并标注“后续实现”，点击显示规划说明，不能进入实际管理页面；文章管理等待账号体系完善后开放。RedFox采集、AI选题简报及会员平台API继续保留为后续开发能力。

## 前端隔离

releaseScope.ts仅在DEV且VITE_ENABLE_PHASE2=true时启用二期。所有生产构建都关闭，即使错误传入true也不开放。app/.env.server、.env.online显式false；.env.oss的true仅供npm run dev。

- 侧栏与手机导航保留三个入口，并展示“后续实现”。底部不推荐未开放的内容库。
- /articles、/discovery、/topics及/topics/:id在生产展示规划页，游客和管理员看到相同的开放状态。
- ResearchView和ArticlesView只在二期开启时加载真实页面；生产不挂载ArticleControls云端保存组件。
- 正文保留本浏览器自动保存、复制和本地导出。登录和用户中心文案不再承诺文章已跨设备保存。
- 一期不自动请求/api/articles或二期数据，不探测/api/discovery/local-session。

## Node隔离

仅NODE_ENV不为production且ENABLE_PHASE2=1时初始化二期模块。默认关闭；production下即使ENABLE_PHASE2=1也关闭。

未启用时/api/articles、/api/discovery及/api/topics整组接口返回404，管理员也不例外；不初始化文章管理和二期表，不恢复采集任务。已有文章、二期表和内容保留，不删除。账号、图片及基础健康检查接口继续运行。

server/.env.example默认ENABLE_PHASE2=0。不要在生产服务器通过切换NODE_ENV绕过发布范围。

## 本地二期开发

先完成server依赖安装和构建，再在app目录执行npm run dev。OSS开发配置VITE_ENABLE_PHASE2=true，Vite本地插件按该开关启动二期后端，仅限回环访问。真实付费采集仍要求登录管理员，免登录调测不能调用供应商付费服务。

单独npm run dev:local仅启动开发后端，需要搭配开发前端才能看见二期；它不会使已构建的一期前端开放二期。可通过LOCAL_DEBUG_PORT和DATA_DIR指定独立端口及测试库。

## 验证

release-scope.test.mjs覆盖生产标志不可绕过、游客与管理员接口404、账号API继续工作以及关闭时不建二期表。release-scope-browser.mjs检查桌面、手机、游客、管理员、三个规划入口及直接路由、登录/用户中心文案。浏览器测试使用临时数据库，无真实供应商调用。

生产构建执行app中的npm run build:server，后端在server中npm run build。完整命令和执行用户见[部署指南](SELF_HOSTED.md)。构建与本地测试不代表服务器已更新，公网部署后仍须验收。

规划展示调整后须使用对应新浏览器报告验收，不沿用之前“隐藏入口、直接路由重定向”的断言。开发模式保留真实文章管理与二期流程，生产仅显示规划，既有数据不删除。

本次修正已通过生产构建、42项服务端测试、目标文件lint和Chrome验收：游客与管理员在桌面及手机均看到三个规划入口，直接URL展示规划页，不自动请求文章管理或二期接口；个人API仍可使用。开发模式文章管理回归通过，付费调用为0。
