#!/usr/bin/env node
// luobo-gzh-design 主渲染脚本：调用网站同一套排版渲染器（renderer.bundle.mjs），
// 产出带「复制到公众号」按钮的预览页，并做公众号兼容校验。
//
// Usage:
//   node typeset.mjs --input <md> [--scheme <id|中文名>] [--layout <版式id>] [--theme <主题色id>]
//                    [--scheme-file <json>] [--title <t>] [--out <html>]
//   node typeset.mjs --list-schemes [--scheme-file <json>]
//
// 退出码：0 = 成功；1 = 参数/输入错误；2 = 已生成产物，但兼容校验有 ERROR

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderArticle, resolveScheme, listSchemes, loadCustomSchemes, withOverrides } from './renderer.bundle.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const getArg = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
};

const schemeFile = getArg('--scheme-file');
const customSchemes = schemeFile
  ? loadCustomSchemes(readFileSync(resolve(process.cwd(), schemeFile), 'utf-8'))
  : [];

if (args.includes('--list-schemes')) {
  for (const scheme of [...customSchemes, ...listSchemes()]) {
    console.log(`${scheme.id}\t${scheme.name}\t${scheme.description || ''}`);
  }
  process.exit(0);
}

const inputPath = getArg('--input');
if (!inputPath) {
  console.error('缺少 --input <markdown 文件>。可用 --list-schemes 查看风格方案。');
  process.exit(1);
}

let scheme;
try {
  scheme = withOverrides(
    resolveScheme(getArg('--scheme') || 'jade-business', customSchemes),
    { layoutId: getArg('--layout'), themeId: getArg('--theme') },
  );
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

const resolvedInput = resolve(process.cwd(), inputPath);
const outPath = getArg('--out')
  ? resolve(process.cwd(), getArg('--out'))
  : resolve(dirname(resolvedInput), `${basename(resolvedInput).replace(/\.[^.]+$/, '')}.html`);
const title = getArg('--title') || basename(resolvedInput).replace(/\.[^.]+$/, '');

const markdown = readFileSync(resolvedInput, 'utf-8');
const { previewHtml, issues } = renderArticle(markdown, scheme);
const copyClient = readFileSync(resolve(scriptDir, 'copy-client.js'), 'utf-8');

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const isDark = scheme.layoutId === 'dark';

const page = `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(title)} · 公众号排版</title>
<style>
  html,body{margin:0;background:#EEF1F4;color:#111;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC','Microsoft YaHei',sans-serif}
  .topbar{position:sticky;top:0;z-index:10;display:flex;align-items:center;gap:12px;background:#0F172A;color:#F1F5F9;padding:12px 20px;box-shadow:0 4px 20px rgba(15,23,42,.14)}
  .topbar .name{font-size:14px;font-weight:600;letter-spacing:.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .topbar .scheme{font-size:12px;opacity:.7;white-space:nowrap}
  .topbar .grow{flex:1}
  .btn{appearance:none;border:0;padding:10px 22px;border-radius:999px;background:#10B981;color:#052E1D;font-weight:700;font-size:14px;cursor:pointer;white-space:nowrap;transition:transform .12s ease,background .12s ease}
  .btn:hover{background:#0EA36F}
  .btn:active{transform:scale(.97)}
  .btn.copied{background:#F1F5F9;color:#059669}
  .canvas{padding:28px 12px 80px}
  .phone{max-width:677px;margin:0 auto;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(15,23,42,.08);background:${isDark ? '#0F172A' : '#fff'}}
  .tips{max-width:677px;margin:18px auto 0;font-size:12px;color:#64748B;padding:0 4px;line-height:1.8}
</style>
</head>
<body>
<div class="topbar">
  <span class="name">${esc(title)}</span>
  <span class="scheme">· ${esc(scheme.name)}</span>
  <div class="grow"></div>
  <button class="btn" data-copy-wechat>复制到公众号</button>
</div>
<div class="canvas">
  <div class="phone">
${previewHtml}
  </div>
  <div class="tips">点「复制到公众号」→ 打开公众号编辑器 → <b>Ctrl/⌘ + V</b> 粘贴。排版和网站「公众号排版系统」预览完全一致。</div>
</div>
<script>${copyClient}</script>
</body>
</html>
`;

writeFileSync(outPath, page, 'utf-8');
console.log(`[luobo-gzh-design] 已生成: ${outPath}`);
console.log(`[luobo-gzh-design] 风格方案: ${scheme.id}（${scheme.name}）`);

const errors = issues.filter((issue) => issue.level === 'error');
const warnings = issues.filter((issue) => issue.level === 'warning');
if (issues.length === 0) {
  console.log('[luobo-gzh-design] 公众号兼容校验: 通过');
} else {
  for (const issue of issues) {
    console.log(`[${issue.level.toUpperCase()}] ${issue.rule}: ${issue.message}${issue.sample ? `\n    例: ${issue.sample}` : ''}`);
  }
  console.log(`[luobo-gzh-design] 公众号兼容校验: ${errors.length} 个 ERROR，${warnings.length} 个 WARNING`);
}

process.exit(errors.length > 0 ? 2 : 0);
