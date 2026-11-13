import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { createApplication } from './application.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || '127.0.0.1';
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid PORT');
if (process.env.NODE_ENV === 'production' && !process.env.PUBLIC_URL) throw new Error('Set PUBLIC_URL to the public HTTPS origin');
const publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
const app = await createApplication({
  dataDir: resolve(here, process.env.DATA_DIR || 'data'),
  staticDir: resolve(here, process.env.STATIC_DIR || '../app/dist'),
  publicUrl, config: process.env,
});
const server = createServer(app.handle);
server.requestTimeout = 60000;
server.headersTimeout = 15000;
server.listen(port, host, () => console.log(`Listening on http://${host}:${port}; public origin ${new URL(publicUrl).origin}`));

let stopping = false;
async function shutdown() {
  if (stopping) return;
  stopping = true;
  console.log('Stopping HTTP server and draining illustration queue');
  const deadline = setTimeout(() => process.exit(1), 25000);
  deadline.unref();
  await new Promise(resolve => server.close(resolve));
  await app.close();
  clearTimeout(deadline);
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
