import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { openDatabase } from './storage.mjs';
import { hashPassword, normalizeEmail, validatePasswordStrength } from './dist/backend.mjs';

const email = normalizeEmail(process.argv[2] || '');
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) throw new Error('Usage: ADMIN_PASSWORD=... npm run admin -- admin@example.com');
const issue = validatePasswordStrength(password);
if (issue) throw new Error(issue);
const here = fileURLToPath(new URL('.', import.meta.url));
const db = openDatabase(resolve(here, process.env.DATA_DIR || 'data', 'gzh.sqlite'));
try {
  db.exec(await readFile(new URL('./dist/schema.sql', import.meta.url), 'utf8'));
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
  if (existing) throw new Error('User already exists; use an existing administrator to change its role. No password was overwritten.');
  await db.prepare("INSERT INTO users (id, email, password_hash, role) VALUES (?, ?, ?, 'admin')").bind(crypto.randomUUID(), email, await hashPassword(password)).run();
  console.log(`Administrator created: ${email}`);
} finally { db.close(); }
