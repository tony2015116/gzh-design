# Antigravity Typesetter 完整语法教程

本系统支持常用 Markdown 语法，并提供适合公众号排版的信息卡片、总结卡片和横排图组。

## 一、标题体系

### 一级标题

推荐格式为“编号、主标题、副标题”三段结构。

```markdown
# 01 | 完整排版指南 | /// MARKDOWN GUIDE
```

只写普通一级标题也可以正常渲染。

```markdown
# 普通一级标题
```

### 二级标题

竖线前可以放步骤标签或章节编号。

```markdown
## STEP01 | 开始准备内容
```

### 三级标题

三级标题支持可选标签。

```markdown
### 准备工作 | 环境检查清单
### 没有标签的三级标题
```

### 四级到六级标题

四级、五级和六级标题统一使用轻量段落标题样式。

```markdown
#### 注意事项
##### 补充说明
###### 细节备注
```

## 二、行内文字效果

### 加粗

加粗内容会使用“排版”面板中选择的文字强调样式和颜色。

```markdown
这是一段 **需要重点阅读** 的内容。
```

### 斜体

```markdown
这是 *轻量补充信息*。
```

### 删除线

```markdown
原价 ~~199 元~~，现价 99 元。
```

### 行内代码

```markdown
运行 `npm run build` 完成构建。
```

### 文字链接

```markdown
[点击查看资料](https://mp.weixin.qq.com)
```

### 段内换行

编辑器会保留同一段中的换行。

```markdown
第一行文字
第二行文字
```

### 转义字符

在语法符号前添加反斜杠，可以按普通文字显示。

```markdown
\*这里不会变成斜体\*
```

## 三、列表与内容块

### 无序列表

```markdown
- 第一项
- 第二项
- 第三项
```

也可以使用星号或加号作为列表标记。

### 有序列表

```markdown
1. 准备内容
2. 选择风格方案
3. 复制到公众号
```

### 引用

```markdown
> 引用适合展示结论、观点和引导语。
```

### 分割线

```markdown
---
```

### 代码块

代码围栏后可以填写语言名称。

````markdown
```javascript
function greet() {
  console.log('Hello WeChat');
}
```
````

### 表格

第二行中的冒号可以控制列对齐方式。

```markdown
| 项目 | 状态 | 备注 |
| :--- | :---: | ---: |
| 标题 | 已完成 | 左对齐 |
| 表格 | 已完成 | 右对齐 |
```

## 四、图片与图组

### 单张图片

```markdown
![图片说明](https://example.com/image.jpg)
```

### 横排图组

将多张图片写在同一行，中间保留空格，系统会自动组成横排图组。

```markdown
![插图一](https://example.com/1.jpg) ![插图二](https://example.com/2.jpg)
```

## 五、高级排版组件

### 信息卡片

信息卡片适合展示提醒、背景信息和单段重点。

```markdown
<InfoCard title="关键提示">
卡片正文支持 **加粗**、*斜体* 和 `行内代码`。
</InfoCard>
```

### 总结卡片

总结卡片可以包含说明文字和列表项。

```markdown
<SummaryCard title="本节总结">
这是一段总结说明。
- 结论一
- 结论二
- 结论三
</SummaryCard>
```

### 长文滑动容器

长文滑动容器适合放置日志、代码、接口返回、数据说明和资料摘录。预览时限制容器高度，内容可以在容器内部滑动。`height` 支持数字或带 `px` 的高度，系统会限制在 140 到 360 像素之间。右侧提示词可通过 `hint` 自定义，使用 `hint=""` 可以隐藏提示词。

```markdown
<ScrollCard title="接口返回" height="220" hint="滑动查看">
这里放很长的内容，预览时可以在容器内部滑动查看更多。
</ScrollCard>
```

复制到公众号时会使用浏览器选区生成公众号兼容的富文本剪贴板，并输出 `section`、固定 `max-height` 与 `overflow-y: auto`，默认保留内部滚动。如果需要复制后展开全文，可以使用 `copy="expand"`：

```markdown
<ScrollCard title="接口返回" height="220" copy="expand">
这里放很长的内容，复制后会展开全文。
</ScrollCard>
```

### 超长图滚动容器

超长图滚动容器适合展示完整截图、长图表和纵向海报。预览时图片会按容器宽度自适应，并在固定高度内上下滑动。`height` 支持数字或带 `px` 的高度，系统会限制在 240 到 720 像素之间。

```markdown
<LongImageCard title="完整长图" height="360" hint="上下滑动查看长图">
![长图说明](https://example.com/long-image.jpg)
</LongImageCard>
```

复制到公众号时默认展开完整图片，避免公众号清洗滚动样式后裁掉内容。如果已经在目标公众号环境中完成安卓端和 iOS 端验证，可以显式使用 `copy="scroll"` 保留固定高度与内部滚动：

```markdown
<LongImageCard title="完整长图" height="360" copy="scroll">
![长图说明](https://example.com/long-image.jpg)
</LongImageCard>
```

使用 `copy="scroll"` 时，复制结果会输出公众号兼容的纯 `section` 结构，并保留与长文滑动容器一致的顶部主题色边框、浅色外边框和圆角。滚动区域使用固定高度，提示词显示在长图下方。图片会关闭原生拖拽，只保留滚轮和触摸纵向滚动。

容器支持多张图片，多张图片会按照书写顺序纵向连续排列。右侧提示词可通过 `hint` 自定义，使用 `hint=""` 可以隐藏提示词。

## 六、当前边界

当前预览会将四级到六级标题统一为轻量标题样式。嵌套列表会按单层列表呈现。原始 HTML 仅开放 `InfoCard`、`SummaryCard`、`ScrollCard` 和 `LongImageCard` 四个排版组件。
