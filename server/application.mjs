import { createReadStream } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { openDatabase, FileBucket } from './storage.mjs';
import { IllustrationQueue } from './queue.mjs';
import { createHtmlRenderer } from './browser.mjs';
import { router, runIllustrationWorkflow } from './dist/backend.mjs';
import { createArticles } from './articles/routes.mjs';
import { initializeCredentialVault } from './credential-vault.mjs';
import { createAuthThrottle, trustedClientIp } from './auth-throttle.mjs';

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.wasm': 'application/wasm', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.webp': 'image/webp', '.mp4': 'video/mp4' };
const CONFIG_KEYS = ['OPENAI_API_KEY', 'OPENAI_API_BASE', 'OPENAI_MODEL', 'GEMINI_API_KEY', 'GEMINI_IMAGE_MODEL', 'FEISHU_APP_ID', 'FEISHU_APP_SECRET', 'AI_MAX_INPUT_CHARS', 'AI_DAILY_QUOTA_FREE', 'AI_DAILY_QUOTA_VIP', 'AI_DAILY_QUOTA_ANONYMOUS'];

export async function createApplication({ dataDir, staticDir, publicUrl, config = {}, renderHtml, queueInterval = 250, redfoxFetch }) {
  const origin = new URL(publicUrl).origin;
  if (!['http:', 'https:'].includes(new URL(publicUrl).protocol)) throw new Error('PUBLIC_URL must use HTTP or HTTPS');
  const db = openDatabase(resolve(dataDir, 'gzh.sqlite'));
  db.exec(await readFile(new URL('./dist/schema.sql', import.meta.url), 'utf8'));
  let credentialsKey;
  try { credentialsKey = await initializeCredentialVault(db, dataDir, config.CREDENTIALS_ENCRYPTION_KEY); }
  catch (error) { db.close(); throw error; }
  const throttle = createAuthThrottle(db);
  const env = {
    ...Object.fromEntries(CONFIG_KEYS.filter(key => config[key]).map(key => [key, config[key]])),
    RUNTIME: 'node', DB: db, IMAGES_BUCKET: new FileBucket(resolve(dataDir, 'objects')),
    CREDENTIALS_ENCRYPTION_KEY: credentialsKey,
    ALLOWED_ORIGINS: origin, AI_FORMAT_AUTH_MODE: 'user',
    AI_FORMAT_LOG_LEVEL: config.AI_FORMAT_LOG_LEVEL || 'basic', UPLOAD_SECRET: '',
    RENDER_HTML: renderHtml || (config.CHROMIUM_EXECUTABLE_PATH ? createHtmlRenderer(config.CHROMIUM_EXECUTABLE_PATH) : undefined),
  };
  const queue = new IllustrationQueue(db, env, runIllustrationWorkflow, { interval: queueInterval });
  env.ILLUSTRATION_WORKFLOW = queue;
  queue.start();
  const phaseTwoEnabled = config.NODE_ENV !== 'production' && config.ENABLE_PHASE2 === '1';
  const discovery = phaseTwoEnabled ? await (await import('./discovery/routes.mjs')).createDiscovery(db, env, config, redfoxFetch) : null;
  const articles = createArticles(db, env);
  const root = resolve(staticDir);
  const maxBodyBytes = 12 * 1024 * 1024;

  async function handle(req, res) {
    try {
      const url = new URL(req.url, origin);
      // Ignore client supplied Host / forwarded headers when generating public URLs.
      if (url.origin !== origin) return res.writeHead(400).end();
      const phaseTwoPath = /^\/api\/(?:discovery|topics)(?:\/|$)/.test(url.pathname);
      if (phaseTwoPath && !phaseTwoEnabled) {
        return res.writeHead(404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: '接口不存在' }));
      }
      const clientIp = trustedClientIp(req, config);
      if (req.method === 'POST' && ['/api/auth/register', '/api/auth/login', '/api/auth/change-password'].includes(url.pathname)) {
        const retry = await throttle(url.pathname, clientIp);
        if (retry) return res.writeHead(429, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Retry-After': String(retry), Connection: 'close' }).end(JSON.stringify({ error: '请求过于频繁，请稍后重试' }));
      }
      const isApi = url.pathname === '/health' || url.pathname === '/upload' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/file/');
      if (!isApi) return await serveStatic(url, req, res);
      if (url.pathname.startsWith('/file/') && !/\.(png|jpe?g|gif|webp|avif|svg)$/i.test(url.pathname)) {
        return res.writeHead(404).end();
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > (url.pathname.startsWith('/api/auth/') ? 8192 : maxBodyBytes)) {
          res.writeHead(413, { 'Content-Type': 'application/json', Connection: 'close' }).end(JSON.stringify({ error: '请求体超过大小限制' }));
          return;
        }
        chunks.push(chunk);
      }
      const headers = new Headers();
      for (const [name, value] of Object.entries(req.headers)) {
        if (value !== undefined && !['host', 'content-length', 'transfer-encoding', 'x-trusted-client-ip'].includes(name)) headers.set(name, Array.isArray(value) ? value.join(', ') : value);
      }
      headers.set('X-Trusted-Client-IP', clientIp);
      const request = new Request(url, {
        method: req.method, headers,
        ...(!['GET', 'HEAD'].includes(req.method) && size ? { body: Buffer.concat(chunks) } : {}),
      });
      const loopback = value => ['127.0.0.1', '::1', '::ffff:127.0.0.1', 'localhost', '[::1]'].includes(value);
      const requestOrigin = new URL(`http://${req.headers.host || 'invalid'}`);
      const localDebug = config.NODE_ENV === 'development' && config.LOCAL_DISCOVERY_DEBUG === '1'
        && loopback(new URL(origin).hostname) && loopback(req.socket.remoteAddress)
        && loopback(requestOrigin.hostname) && requestOrigin.port === new URL(origin).port
        && (!req.headers.origin || req.headers.origin === requestOrigin.origin)
        && (!req.headers['sec-fetch-site'] || ['same-origin', 'none'].includes(req.headers['sec-fetch-site']));
      const response = await articles.fetch(request) ?? await discovery?.fetch(request, { localDebug }) ?? await router.fetch(request, env);
      const outputHeaders = Object.fromEntries(response.headers);
      outputHeaders['X-Content-Type-Options'] = 'nosniff';
      outputHeaders['Referrer-Policy'] = 'no-referrer';
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
      'Referrer-Policy': 'no-referrer',
      ...(type.startsWith('text/html') ? { 'Content-Security-Policy': "frame-ancestors 'none'; object-src 'none'; base-uri 'self'", 'X-Frame-Options': 'DENY' } : {}),
    });
    if (req.method === 'HEAD') return res.end();
    await pipeline(createReadStream(path), res);
  }
  return { handle, db, env, queue, async close() { await discovery?.close(); await queue.close(); db.close(); } };
}
