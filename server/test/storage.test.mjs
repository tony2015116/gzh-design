import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { openDatabase, FileBucket } from '../storage.mjs';

test('SQLite persists bound statements, RETURNING and rolls back a failed batch', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gzh-db-'));
  const path = join(dir, 'test.sqlite');
  let db;
  try {
    db = openDatabase(path);
    db.exec('CREATE TABLE sample (id TEXT PRIMARY KEY, count INTEGER)');
    assert.equal((await db.prepare('INSERT INTO sample VALUES (?, ?) RETURNING count').bind('a', 1).first()).count, 1);
    await assert.rejects(db.batch([
      db.prepare('UPDATE sample SET count = 2'),
      db.prepare('INSERT INTO sample VALUES (?, ?)').bind('a', 3),
    ]));
    assert.equal(await db.prepare('SELECT count FROM sample').first('count'), 1);
    db.close();
    db = openDatabase(path);
    assert.equal((await db.prepare('SELECT * FROM sample').all()).results.length, 1);
  } finally {
    db?.close();
    await rm(dir, { recursive: true, force: true });
  }
});

test('file bucket persists bytes and metadata and rejects path traversal', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gzh-files-'));
  try {
    const bucket = new FileBucket(dir);
    await bucket.put('nested/image.png', new Uint8Array([1, 2, 3]), { httpMetadata: { contentType: 'image/png' } });
    const object = await new FileBucket(dir).get('nested/image.png');
    assert.deepEqual(new Uint8Array(await object.arrayBuffer()), new Uint8Array([1, 2, 3]));
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    assert.equal(headers.get('content-type'), 'image/png');
    assert.equal(await bucket.get('missing'), null);
    for (const key of ['../escape', '/absolute', 'a/../../escape', 'a\\..\\escape']) {
      await assert.rejects(bucket.put(key, 'bad'));
    }
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
