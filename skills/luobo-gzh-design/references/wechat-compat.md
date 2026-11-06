# 公众号兼容规则

公众号编辑器粘贴富文本时会清洗 HTML：不认识的标签、属性、样式会被删掉或改写。网站「复制到公众号」和本 skill 的复制按钮在复制前都会自动做一遍规整，`typeset.mjs` / `validate.mjs` 再按下面的规则校验。

> 这些规则来自公众号编辑器的已知限制和社区经验，个别条目（标 ⚠）尚未在本项目里逐条实测，遇到粘贴效果不符时以实际为准，并更新这里和 `app/src/core/wechatCompat.ts`。

## 复制前自动规整（不需要手动处理）

| 处理 | 原因 |
|---|---|
| `<div>` → `<section>` | 编辑器会把 div 改写成段落，结构和样式会乱 |
| 删除 `class`、`id`、`data-*` 等属性 | 会被剥离，样式必须全部内联在 `style` |
| 展开 CSS 变量 `var(--x)` 为具体值 | 编辑器不支持 CSS 变量，字号、行距、段距会丢 |
| 文字节点包进 `<span leaf="">` ⚠ | 公众号编辑器自己的文本节点结构，包好后粘贴样式更稳定 |
| 空的装饰元素（色条、圆点）里塞零高占位 ⚠ | 空节点会被当成无用内容删掉 |
| 带底色/边框的 `<strong>` 把盒样式挪到外层 `<span>` ⚠ | 编辑器会重写 strong 上的样式 |
| 正文外包一层带字体、底色的 `<section>` | 暗黑版式粘贴后不丢深色背景 |

## 校验规则

**ERROR**（粘贴后大概率出问题，必须处理）

- `<style>`、`<script>`、`<link>` 外部资源
- 残留的 `<div>`、`class`、`id`
- CSS 变量 `var(--…)`
- `position: fixed / absolute / sticky`
- `@media`、`@keyframes`、`@import`、`@font-face`
- `display: grid`
- 中文文字没有包在 `<span leaf="">` 里

**WARNING**（能用，但交付时告知用户）

- `float`：表现不稳定（目前滑动卡标题右侧的提示文字用到）
- 渐变背景 ⚠：可能触发公众号的深色模式适配检测。"玉石商务"的渐隐标记、"紫电科技"的半高光带加粗会命中；介意的话在网站上把强调样式改成"均匀浅底"或"强调色下划线"
- `white-space: pre`：会把源码缩进渲染成大块空白（本项目代码块已改为逐行 + 不折叠空格，不再使用）
- 中文后面紧跟半角标点 `, ; ! ? :`：建议改全角

## 排版组件写法约定（给开发者）

新增或修改 `app/src/components/typesetter/` 下的组件时：

- 不用 `position: absolute`：需要"压在边框上"的装饰用负边距实现（参考 SummaryCard 顶部色条、古典版引用的『』）
- 不用 `float`：左右布局用 `display: flex`
- 不用 `<div>`：用 `<section>` / `<p>` / `<span>`
- 图片用 `max-width: 100%`，不要 `width: 100%`（多图横排除外）
- 改完执行 `npm run build:skill`，再用 `node skills/luobo-gzh-design/scripts/typeset.mjs --input <样例>` 看校验结果
