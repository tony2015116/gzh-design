import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, chmodSync } from 'node:fs';
import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { serialize, deserialize } from 'node:v8';
import { createHash, randomUUID } from 'node:crypto';

export function openDatabase(path) {
  mkdirSync(dirname(resolve(path)), { recursive: true, mode: 0o700 });
  const sqlite = new DatabaseSync(path);
  chmodSync(path, 0o600);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;');
  const prepare = (sql, values = []) => ({
    bind(...args) { return prepare(sql, args); },
    async first(column) {
      const row = sqlite.prepare(sql).get(...values) ?? null;
      return column && row ? row[column] : row;
    },
    async all() { return { success: true, results: sqlite.prepare(sql).all(...values) }; },
    execute() {
      const result = sqlite.prepare(sql).run(...values);
      return { success: true, meta: { changes: Number(result.changes), last_row_id: Number(result.lastInsertRowid) } };
    },
    async run() { return this.execute(); },
  });
  return {
    prepare,
    exec(sql) { sqlite.exec(sql); },
    async batch(statements) {
      sqlite.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        // DatabaseSync transactions must never yield to unrelated HTTP requests.
        for (const statement of statements) results.push(statement.execute());
        sqlite.exec('COMMIT');
        return results;
      } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
    close() { sqlite.close(); },
  };
}

// One atomic object contains both bytes and metadata. Never serve this directory as static files.
export class FileBucket {
  constructor(root) { this.root = resolve(root); }
  path(key) {
    if (!key || key.includes('\\') || key.includes('\0') || key.startsWith('/') || key.split('/').some(p => !p || p === '.' || p === '..' || p.includes(':'))) {
      throw new Error('invalid_storage_key');
    }
    const path = resolve(this.root, `${key}.object`);
    if (!path.startsWith(this.root + sep)) throw new Error('invalid_storage_key');
    return path;
  }
  async put(key, value, options = {}) {
    const path = this.path(key);
    let body;
    if (typeof value === 'string') body = Buffer.from(value);
    else if (value instanceof ArrayBuffer) body = Buffer.from(value);
    else if (ArrayBuffer.isView(value)) body = Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    else body = Buffer.from(await new Response(value).arrayBuffer());
    const record = { body, metadata: options.httpMetadata ?? {}, etag: createHash('sha256').update(body).digest('hex') };
    await mkdir(dirname(path), { recursive: true, mode: 0o700 });
    const temporary = `${path}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, serialize(record), { mode: 0o600 });
      await rename(temporary, path);
    } finally { await rm(temporary, { force: true }); }
  }
  async get(key) {
    let record;
    try { record = deserialize(await readFile(this.path(key))); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
    return {
      body: new Blob([record.body]).stream(),
      httpEtag: `"${record.etag}"`,
      async text() { return record.body.toString('utf8'); },
      async arrayBuffer() { return Uint8Array.from(record.body).buffer; },
      writeHttpMetadata(headers) { headers.set('Content-Type', record.metadata.contentType || 'application/octet-stream'); },
    };
  }
}
