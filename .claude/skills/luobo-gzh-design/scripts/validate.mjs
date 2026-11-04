#!/usr/bin/env node
// 公众号 HTML 兼容校验：可以校验 typeset.mjs 的产物页，也可以校验任何手写/第三方的公众号 HTML。
// Usage: node validate.mjs <file.html> [--raw]
//   默认先按网站复制规则规整（展开 CSS 变量、leaf 包裹等）再校验，等价于"复制到公众号后的样子"；
//   --raw 表示不规整、直接校验原文件（适合检查手写 HTML）。
// 退出码：0 = 无 ERROR；1 = 参数错误；2 = 有 ERROR

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { toWechatCompatibleHtml, validateWechatHtml } from './renderer.bundle.mjs';

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith('--'));
if (!file) {
  console.error('用法: node validate.mjs <file.html> [--raw]');
  process.exit(1);
}

let html = readFileSync(resolve(process.cwd(), file), 'utf-8');

// typeset.mjs 产物页：只取正文预览节点
const start = html.indexOf('<div id="wechat-article-preview"');
if (start >= 0) {
  const end = html.indexOf('<div class="tips">', start);
  html = html.slice(start, end > start ? html.lastIndexOf('</div>', end) : undefined);
}
html = html.replace(/<link\b[^>]*>/g, '');

if (!args.includes('--raw')) {
  const rootStyle = html.match(/^<div[^>]*style="([^"]*)"/)?.[1] || '';
  const cssVariables = {};
  for (const declaration of rootStyle.replace(/&quot;/g, '"').split(';')) {
    const index = declaration.indexOf(':');
    const key = declaration.slice(0, index).trim();
    if (index > 0 && key.startsWith('--')) cssVariables[key] = declaration.slice(index + 1).trim();
  }
  html = toWechatCompatibleHtml(html, { cssVariables });
}

const issues = validateWechatHtml(html);
for (const issue of issues) {
  console.log(`[${issue.level.toUpperCase()}] ${issue.rule}: ${issue.message}${issue.sample ? `\n    例: ${issue.sample}` : ''}`);
}
const errors = issues.filter((issue) => issue.level === 'error').length;
console.log(issues.length === 0 ? '通过：未发现兼容问题' : `共 ${errors} 个 ERROR，${issues.length - errors} 个 WARNING`);
process.exit(errors > 0 ? 2 : 0);
