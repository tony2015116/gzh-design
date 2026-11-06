# 风格方案

风格方案 = 版式 + 主题色 + 强调样式 + 字体字号 + 组件样式 的整套预设，和网站顶栏「风格方案」下拉里的完全一样。`--scheme` 只能用下面的 id 或中文名（或 `--scheme-file` 里的自定义方案）。

## 六套方案

| id | 中文名 | 版式 | 主题色 | 气质 | 适合 |
|---|---|---|---|---|---|
| `jade-business` | 玉石商务 | 商务极简 | 翠绿 | 克制清晰，大号章节序号，终端风代码块 | 方法论、工作复盘、AI 观点、工具测评（**万能兜底**） |
| `ocean-editorial` | 海盐杂志 | 杂志风 | 海蓝 | 衬线字体、居中标题、留白舒展、引语上下细线 | 观点长文、品牌内容、访谈、书评 |
| `amber-report` | 暖橙报告 | 商务极简 | 日落橙 | 温暖醒目，均匀浅底强调，柔和卡片 | 案例拆解、数据解读、运营复盘 |
| `violet-tech` | 紫电科技 | 科技未来 | 皇家紫 | 等宽元素、深色引用、终端代码块 | 技术教程、产品发布、开发工具 |
| `cherry-friendly` | 樱桃轻盈 | 活泼可爱 | 樱桃红 | 圆角、花朵符号、拍立得图片 | 清单好物、生活分享、亲子、轻松话题 |
| `jade-classic` | 墨玉宋韵 | 古典中式 | 翠绿 | 宋体、居中标题、双线装饰 | 人文随笔、读书笔记、深度长文 |

## 按文章类型推荐

| 文章类型 | 首选 | 备选 | 反差款 |
|---|---|---|---|
| 教程 / 操作指南 | `violet-tech` | `jade-business` | `cherry-friendly` |
| 清单 / 工具盘点 | `jade-business` | `cherry-friendly` | `ocean-editorial` |
| 评测 / 对比 | `jade-business` | `amber-report` | `violet-tech` |
| 观点 / 深度分析 | `ocean-editorial` | `jade-business` | `jade-classic` |
| 心得 / 复盘 / 故事 | `jade-classic` | `ocean-editorial` | `amber-report` |
| 资讯 / 快评 | `amber-report` | `jade-business` | `ocean-editorial` |

拿不准就用 `jade-business`。

## 单独换版式 / 主题色

在方案基础上加 `--layout` 或 `--theme`，等同于在网站上选了方案后再改版式或主题色：

**版式 `--layout`**

| id | 名称 | 特点 |
|---|---|---|
| `minimalist` | 商务极简 | 大号序号标题、药丸标签小节、渐隐强调 |
| `literary` | 文艺清新 | 居中、细线、字距宽、圆点分隔 |
| `tech` | 科技未来 | 等宽字体元素、深色引用、Mac 窗口代码块 |
| `cute` | 活泼可爱 | 圆角、虚线、✿ 符号 |
| `classic` | 古典中式 | 宋体、居中、菱形分隔、双线强调 |
| `magazine` | 杂志风 | 衬线、大号序号、上下细线引语 |
| `dark` | 暗黑风 | 深色底、浅色字、渐变分隔（适合夜读/科技感，但部分读者在浅色模式下会觉得重） |

**主题色 `--theme`**：`emerald` 翠绿 · `ocean` 海蓝 · `sunset` 日落橙 · `royal` 皇家紫 · `cherry` 樱桃红

例：`--scheme ocean-editorial --theme sunset`（海盐杂志的版式配橙色）、`--scheme jade-business --layout dark`（暗黑版）。

## 用户自己的预设

网站顶栏「我的预设」可以导出 JSON。拿到这个文件后：

```bash
node scripts/typeset.mjs --scheme-file my-presets.json --list-schemes   # 看里面有哪些
node scripts/typeset.mjs --input a.md --scheme-file my-presets.json --scheme "我的方案名"
```
