import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { openDatabase, FileBucket } from './storage.mjs';
import { IllustrationQueue } from './queue.mjs';
import { createHtmlRenderer } from './browser.mjs';
import { router, runIllustrationWorkflow } from './dist/backend.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const CONFIG_KEYS = ['OPENAI_API_KEY', 'OPENAI_API_BASE', 'OPENAI_MODEL', 'GEMINI_API_KEY', 'GEMINI_IMAGE_MODEL', 'FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'AI_MAX_INPUT_CHARS', 'AI_DAILY_QUOTA_FREE', 'AI_DAILY_QUOTA_VIP', 'AI_DAILY_QUOTA_ANONYMOUS'];

export async function createApplication({ dataDir, staticDir, publicUrl, config = {}, renderHtml, queueInterval = 250 }) {
  const origin = new URL(publicUrl).origin;
  if (!['http:', 'https:'].includes(new URL(publicUrl).protocol)) throw new Error('PUBLIC_URL must use HTTP or HTTPS');
  const db = openDatabase(resolve(dataDir, 'gzh.sqlite'));
  db.exec(await readFile(new URL('./dist/schema.sql', import.meta.url), 'utf8'));
  const env = {
    ...Object.fromEntries(CONFIG_KEYS.filter(key => config[key]).map(key => [key, config[key]])),
    RUNTIME: 'node', DB: db, IMAGES_BUCKET: new FileBucket(resolve(dataDir, 'objects')),
    ALLOWED_ORIGINS: origin, AI_FORMAT_AUTH_MODE: 'user',
    AI_FORMAT_LOG_LEVEL: config.AI_FORMAT_LOG_LEVEL || 'basic', UPLOAD_SECRET: '',
    RENDER_HTML: renderHtml || (config.CHROMIUM_EXECUTABLE_PATH ? createHtmlRenderer(config.CHROMIUM_EXECUTABLE_PATH) : undefined),
  };
  const queue = new IllustrationQueue(db, env, runIllustrationWorkflow, { interval: queueInterval });
  env.ILLUSTRATION_WORKFLOW = queue;
  queue.start();
  const root = resolve(staticDir);
  const maxBodyBytes = 12 * 1024 * 1024;

  async function handle(req, res) {
    try {
      const url = new URL(req.url, origin);
      // Ignore client supplied Host / forwarded headers when generating public URLs.
      if (url.origin !== origin) return res.writeHead(400).end();
      const isApi = url.pathname === '/health' || url.pathname === '/upload' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/file/');
      if (!isApi) return await serveStatic(url, req, res);
      if (url.pathname.startsWith('/file/') && !/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) {
        return res.writeHead(404).end();
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > maxBodyBytes) {
          res.writeHead(413, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ error: '请求体超过 12 MB 限制' }));
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined && !['host', 'content-length', 'transfer-encoding'].includes(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      const request = new Request(url, {
        method: req.method, headers,
        ...(!['GET', 'HEAD'].includes(req.method) && size ? { body: Buffer.concat(chunks) } : {}),
      });
      const response = await router.fetch(request, env);
      const outputHeaders = Object.fromEntries(response.headers);
      outputHeaders['X-Content-Type-Options'] = 'nosniff';
      if (url.pathname.startsWith('/file/')) outputHeaders['Content-Security-Policy'] = "sandbox; default-src 'none'; style-src 'unsafe-inline'";
      res.writeHead(response.status, outputHeaders);
      if (response.body) await pipeline(Readable.fromWeb(response.body), res);
      else res.end();
    } catch (error) {
      console.error('[http]', error.message);
      if (!res.headersSent) res.writeHead(error instanceof URIError ? 400 : 500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: '请求处理失败' }));
      else res.destroy();
    }
  }

  async function serveStatic(url, req, res) {
    if (!['GET', 'HEAD'].includes(req.method)) return res.writeHead(405).end();
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\\') || pathname.split('/').some(part => part.startsWith('.'))) return res.writeHead(404).end();
    let path = resolve(root, '.' + pathname);
    if (path !== root && !path.startsWith(root + sep)) return res.writeHead(404).end();
    let info;
    try { info = await stat(path); } catch { /* SPA fallback below */ }
    if (!info?.isFile()) {
      if (extname(pathname)) return res.writeHead(404).end();
      path = resolve(root, 'index.html');
      try { info = await stat(path); } catch { return res.writeHead(503).end('Build frontend first: cd app && npm run build:server'); }
    }
    const type = TYPES[extname(path)] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': type, 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff',
      'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
    });
    if (req.method === 'HEAD') return res.end();
    await pipeline(createReadStream(path), res);
  }
  return { handle, db, env, queue, async close() { await queue.close(); db.close(); } };
}
