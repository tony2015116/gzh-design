import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from '../storage.mjs';

test('administrator CLI creates a hashed administrator and never overwrites an existing user', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gzh-admin-'));
  const run = promisify(execFile);
  const script = fileURLToPath(new URL('../admin.mjs', import.meta.url));
  try {
    const options = { env: { ...process.env, DATA_DIR: dir, ADMIN_PASSWORD: 'Admin-test-12345' } };
    await run(process.execPath, [script, 'ADMIN@example.test'], options);
    let db = openDatabase(join(dir, 'gzh.sqlite'));
    const before = await db.prepare('SELECT * FROM users').first();
    db.close();
    assert.equal(before.role, 'admin');
    assert.equal(before.email, 'admin@example.test');
    assert.notEqual(before.password_hash, options.env.ADMIN_PASSWORD);
    await assert.rejects(run(process.execPath, [script, 'admin@example.test'], options), /already exists/);
    db = openDatabase(join(dir, 'gzh.sqlite'));
    const after = await db.prepare('SELECT * FROM users').first();
    db.close();
    assert.equal(after.password_hash, before.password_hash);
  } finally { await rm(dir, { recursive: true, force: true }); }
});
