# 导出小红书图片功能实现计划

该计划旨在为当前系统添加“导出为图片”的功能，以便用户可以一键将渲染好的排版内容导出为适合在小红书等平台发布的长图或多张切图。

## 背景与可行性

当前的排版内容是在 `<Preview />` 组件（ID: `wechat-article-preview`）中以 HTML/CSS 形式渲染的。前端完全可以通过 DOM 截图库（如 `html-to-image` 或 `html2canvas`）将该 DOM 节点转换为 Canvas，进而导出为 PNG 或 JPEG 图片。

**对于小红书的场景：**
1. **长图**：适合在单张图片中展示所有内容（不过小红书对极长的图会压缩）。
2. **多图切片（3:4 比例）**：小红书的最佳展示比例是 3:4（例如 677px 宽对应约 902px 高）。我们可以将整个生成的长 Canvas 按照这个高度切分为多张图片，非常适合小红书的滑动阅读体验。

## User Review Required

> [!IMPORTANT]
> **关于多图下载的交互方式**
> 浏览器有时会拦截一次性触发多个文件的下载。为了提供最佳用户体验，我建议在截图完成后，弹出一个类似于“导出面板”的模态框，将生成的图片展示出来。用户可以在面板中分别点击下载，或者直接右键/长按保存。您是否同意采用这种交互方式？

> [!WARNING]
> **外部图片跨域问题 (CORS)**
> DOM 截图工具依赖 Canvas 渲染。如果文章中包含跨域的外部图片（且该服务器未配置 `Access-Control-Allow-Origin: *`），截图可能会因为画布被污染（Tainted Canvas）而失败或图片变空白。当前系统的图床（R2/自定义 CDN）配置可能需要确保支持跨域访问。

## Open Questions

1. 需要引入一个新的依赖库 `html-to-image` 来进行 DOM 截图。是否允许安装此依赖？
2. 切图的边缘可能会刚好切断一行文字或一张图片。由于简单的等高切片无法理解 DOM 结构，这是一个已知局限。是否接受这种简单的等高切分？（完美避开文字切断需要极其复杂的 DOM 计算，通常不在此类工具的 V1 版本考虑范围内）

## Proposed Changes

### 依赖项
引入 `html-to-image` 库用于 DOM 转换。
#### [MODIFY] package.json
增加 `html-to-image` 依赖。

---

### UI 组件：图片导出面板

#### [NEW] app/src/components/ui/ImageExportPanel.tsx
新建一个导出面板组件，包含以下功能：
- 接收生成的图片（Base64 URL 列表）。
- 提供两个 Tab：“长图”与“切片（多图）”。
- 当选择“切片”时，提供一个下拉菜单供用户选择切图比例（例如：1:1 正方形、3:4 小红书最佳、4:3、16:9 横屏等）。
- 展示生成的图片预览。
- 提供“下载单张图片”和“下载全部”按钮。

---

### 截图与切片逻辑服务

#### [NEW] app/src/services/imageExportService.ts
封装基于 `html-to-image` 的截图与切片逻辑：
- `generateLongImage(elementId: string)`: 抓取指定 DOM 为单张 Base64 格式的图片。
- `generateSlicedImages(elementId: string, sliceRatio: number)`: 抓取长图后，根据 DOM 宽度计算切片高度（高度 = 宽度 * sliceRatio），并利用 Canvas `drawImage` 将原图切分成多张 Base64 图片返回。

---

### 主视图更新

#### [MODIFY] app/src/views/TypesetterView.tsx
- 引入新的 `ImageExportPanel` 组件。
- 在右上角的“操作按钮区”或中间标题栏“预览效果”右侧增加两个按钮：“生成长图”与“生成小红书切片”。
- 增加处理截图生成的 state（如 `isExportingImages`, `exportedImages`, `exportImageType`）并连接对应的 service 方法。

## Verification Plan

### Manual Verification
1. 在编辑器中输入一段包含文本、标题和配图的 Markdown。
2. 点击“生成长图”，验证是否能正确弹出面板并显示完整的长截图。
3. 点击“生成小红书切片”，验证是否能根据 3:4 比例生成多张切好的图片，且内容不丢失（首尾相接）。
4. 测试下载按钮是否能正常触发浏览器下载，保存到本地的图片格式和清晰度是否达标。
