import { build } from 'esbuild';
import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
await mkdir(new URL('./dist/', import.meta.url), { recursive: true });
await build({
  entryPoints: [fileURLToPath(new URL('./backend.ts', import.meta.url))],
  outfile: fileURLToPath(new URL('./dist/backend.mjs', import.meta.url)),
  platform: 'node', target: 'node22.22', format: 'esm', bundle: true,
  external: ['@cloudflare/puppeteer'],
});
await copyFile(new URL('../worker/schema.sql', import.meta.url), new URL('./dist/schema.sql', import.meta.url));
