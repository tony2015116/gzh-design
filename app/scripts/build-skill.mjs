// 把网站的排版渲染器打包进 luobo-gzh-design skill，让 skill 只依赖 Node 就能产出和网站一致的排版。
// 网站排版样式有改动后执行：npm run build:skill
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skillScripts = resolve(appRoot, '../.claude/skills/luobo-gzh-design/scripts');
const banner = '// 由 app/scripts/build-skill.mjs 生成，请勿手改。源码在 app/src/skill/ 与网站排版组件。';

await build({
  entryPoints: [resolve(appRoot, 'src/skill/renderArticle.tsx')],
  outfile: resolve(skillScripts, 'renderer.bundle.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  jsx: 'automatic',
  minify: true,
  legalComments: 'none',
  define: { 'process.env.NODE_ENV': '"production"' },
  // react-dom/server 是 CJS，内部 require 了 node 内置模块，ESM 产物里需要补一个 require
  banner: { js: `${banner}\nimport { createRequire as __createRequire } from 'node:module';\nconst require = __createRequire(import.meta.url);` },
  logLevel: 'info',
});

await build({
  entryPoints: [resolve(appRoot, 'src/skill/copyClient.ts')],
  outfile: resolve(skillScripts, 'copy-client.js'),
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: 'es2019',
  minify: true,
  legalComments: 'none',
  banner: { js: banner },
  logLevel: 'info',
});
