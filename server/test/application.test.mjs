import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApplication } from '../application.mjs';

test('HTTP accounts, isolated presets, upload permissions, SPA, async job and restart persistence', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'gzh-http-'));
  await writeFile(join(dir, 'index.html'), '<!doctype html><h1>Test frontend</h1>');
  const options = { dataDir: join(dir, 'data'), staticDir: dir, publicUrl: 'https://editor.example.test', config: { AI_FORMAT_LOG_LEVEL: 'off' }, queueInterval: 20 };
  let app, server, base;
  const start = async () => {
    app = await createApplication(options);
    server = createServer(app.handle);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
  };
  const stop = async () => { await new Promise(resolve => server.close(resolve)); await app.close(); };
  const api = async (path, token, body, method = 'POST') => {
    const response = await fetch(base + path, {
      method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return { response, data: await response.json() };
  };
  try {
    await start();
    assert.equal((await fetch(base + '/health')).status, 200);
    const oversized = await fetch(base + '/api/format', { method: 'POST', body: Buffer.alloc(13 * 1024 * 1024) });
    assert.equal(oversized.status, 413);
    assert.match(await (await fetch(base + '/video-compare')).text(), /Test frontend/);
    assert.equal((await fetch(base + '/missing.js')).status, 404);
    assert.equal((await fetch(base + '/.env')).status, 404);
    assert.equal((await fetch(base + '/file/illustration-jobs/secret/plan.json')).status, 404);
    const registration = await api('/api/auth/register', null, { email: 'first@example.test', password: 'S3cure-test-1234' });
    assert.equal(registration.response.status, 200, JSON.stringify(registration.data));
    const { token, user } = registration.data;
    const login = await api('/api/auth/login', null, { email: 'first@example.test', password: 'S3cure-test-1234' });
    assert.equal(login.response.status, 200);
    assert.ok(login.data.token);
    const second = await api('/api/auth/register', null, { email: 'second@example.test', password: 'S3cure-test-5678' });
    const preset = await api('/api/user/presets', token, { name: 'Persistent', theme: {}, layout_style: {}, image_style: {} });
    assert.equal(preset.response.status, 200);
    assert.equal((await api('/api/user/presets', second.data.token, null, 'GET')).data.presets.length, 0);
    const form = () => {
      const value = new FormData();
      value.append('file', new Blob([new Uint8Array([137, 80, 78, 71])], { type: 'image/png' }), 'a.png');
      return value;
    };
    assert.equal((await fetch(base + '/upload', { method: 'POST', body: form() })).status, 401);
    const upload = await fetch(base + '/upload', { method: 'POST', body: form(), headers: { Authorization: `Bearer ${token}` } });
    assert.equal(upload.status, 200);
    const image = await upload.json();
    assert.equal(new URL(image.url).origin, options.publicUrl);
    const imagePath = new URL(image.url).pathname;
    assert.equal((await fetch(base + imagePath)).headers.get('content-type'), 'image/png');
    const svg = new FormData();
    svg.append('file', new Blob(['<svg/>'], { type: 'image/svg+xml' }), 'a.svg');
    assert.equal((await fetch(base + '/upload', { method: 'POST', body: svg, headers: { Authorization: `Bearer ${token}` } })).status, 400);
    assert.equal((await api('/api/illustration/plan', token, { markdown: '# Test\n\nA sufficiently long paragraph for generating an illustration about planning and execution.' })).response.status, 403);
    await app.db.prepare("UPDATE users SET role = 'admin' WHERE id = ?").bind(user.id).run();
    const markdown = '# Planning\n\n' + 'Step one: collect inputs. Step two: execute the task. Step three: verify the result. '.repeat(8) + '\n\n# Delivery\n\n' + 'Save the output and share the finished work. '.repeat(8);
    const plan = await api('/api/illustration/plan', token, { markdown });
    assert.equal(plan.response.status, 200);
    const created = await api('/api/illustration/jobs', token, { markdown, plan: plan.data.plan, selectedIds: plan.data.plan.items.map(item => item.id) });
    assert.equal(created.response.status, 202, JSON.stringify(created.data));
    const id = created.data.job.id;
    let job;
    for (let i = 0; i < 150; i++) {
      job = (await api(`/api/illustration/jobs/${id}`, token, null, 'GET')).data.job;
      if (job.status === 'completed' || job.status === 'failed') break;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.equal(job.status, 'completed', job.error);
    assert.ok(job.items.length > 0);
    assert.match(job.resultMarkdown, /https:\/\/editor.example.test\/file\//);
    assert.equal((await api(`/api/illustration/jobs/${id}`, second.data.token, null, 'GET')).response.status, 404);
    await stop();
    await start();
    assert.equal((await api('/api/user/presets', token, null, 'GET')).data.presets[0].id, preset.data.id);
    assert.equal((await fetch(base + imagePath)).status, 200);
    assert.equal((await api(`/api/illustration/jobs/${id}`, token, null, 'GET')).data.job.status, 'completed');
    assert.equal((await api(`/api/user/presets/${preset.data.id}`, token, null, 'DELETE')).response.status, 200);
    assert.equal((await api('/api/user/presets', token, null, 'GET')).data.presets.length, 0);
    assert.equal((await api('/api/auth/logout', token)).response.status, 200);
    assert.equal((await api('/api/user/presets', token, null, 'GET')).response.status, 401);
  } finally {
    if (server?.listening) await stop();
    await rm(dir, { recursive: true, force: true });
  }
});
