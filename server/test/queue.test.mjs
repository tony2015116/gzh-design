import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { openDatabase } from '../storage.mjs';
import { IllustrationQueue } from '../queue.mjs';

test('interrupted jobs resume from a durable checkpoint after reopening the database', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gzh-queue-'));
  let db;
  try {
    const path = join(dir, 'queue.sqlite');
    db = openDatabase(path);
    db.exec("CREATE TABLE illustration_jobs (id TEXT PRIMARY KEY, status TEXT, error TEXT, updated_at TEXT); INSERT INTO illustration_jobs VALUES ('one', 'running', NULL, NULL)");
    const queue = new IllustrationQueue(db, {}, async () => {});
    await queue.create({ id: 'one', params: { jobId: 'one' } });
    await db.prepare("UPDATE server_jobs SET status = 'running'").run();
    await db.prepare('INSERT INTO server_job_steps VALUES (?, ?, ?)').bind('one', 'paid-step', JSON.stringify({ output: 42 })).run();
    db.close();
    db = openDatabase(path);
    let calls = 0;
    const resumed = new IllustrationQueue(db, {}, async (_env, params, step) => {
      assert.equal(params.jobId, 'one');
      const result = await step.do('paid-step', async () => { calls++; return {}; });
      assert.equal(result.output, 42);
      await step.do('remaining-step', async () => { calls++; return { done: true }; });
    });
    await resumed.tick();
    assert.equal(calls, 1);
    assert.equal((await (await resumed.get('one')).status()).status, 'completed');
    assert.equal(await db.prepare('SELECT status FROM illustration_jobs').first('status'), 'completed');
    await resumed.close();
  } finally { db?.close(); await rm(dir, { recursive: true, force: true }); }
});
