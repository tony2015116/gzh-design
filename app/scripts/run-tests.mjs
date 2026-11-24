// 用已有的 esbuild 把 tests/*.test.ts 打包后交给 Node 自带的 node:test 运行，不引入额外测试框架。
import { build } from 'esbuild';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = resolve(import.meta.dirname, '..');
const testDir = join(root, 'tests');
const entries = (await readdir(testDir)).filter((name) => name.endsWith('.test.ts')).map((name) => join(testDir, name));
if (entries.length === 0) throw new Error('No tests found in tests/');

const outdir = await mkdtemp(join(tmpdir(), 'luobo-tests-'));
try {
  await build({
    entryPoints: entries,
    outdir,
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outExtension: { '.js': '.cjs' },
    target: 'node22',
    logLevel: 'error',
    define: { 'import.meta.env': '{"DEV":false}' },
  });
  const files = (await readdir(outdir)).filter((name) => name.endsWith('.cjs')).map((name) => join(outdir, name));
  const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(outdir, { recursive: true, force: true });
}
