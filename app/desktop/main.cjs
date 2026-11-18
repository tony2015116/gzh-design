const { app, BrowserWindow, net, protocol, shell } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const scheme = 'luobo';
const entry = `${scheme}://workbench/index.html`;
const assets = path.join(__dirname, '..', 'dist');

protocol.registerSchemesAsPrivileged([{
  scheme,
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true },
}]);

async function serveAsset(request) {
  const url = new URL(request.url);
  if (url.host !== 'workbench' || request.method !== 'GET') return new Response(null, { status: 404 });

  let filename;
  try {
    filename = path.resolve(assets, '.' + decodeURIComponent(url.pathname));
    const relative = path.relative(assets, filename);
    if (!relative || relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
      return new Response(null, { status: 404 });
    }
  } catch {
    return new Response(null, { status: 400 });
  }

  try {
    return await net.fetch(pathToFileURL(filename).href);
  } catch {
    return new Response(null, { status: 404 });
  }
}

function openExternal(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') {
      void shell.openExternal(url.href).catch(console.error);
    }
  } catch {
    // Ignore malformed article links.
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 700,
    minHeight: 560,
    autoHideMenuBar: true,
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false },
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    openExternal(url);
    return { action: 'deny' };
  });
  window.webContents.on('will-navigate', (event, url) => {
    if (url === entry) return;
    event.preventDefault();
    openExternal(url);
  });
  void window.loadURL(entry);
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const [window] = BrowserWindow.getAllWindows();
    if (window?.isMinimized()) window.restore();
    window?.focus();
  });
  app.whenReady().then(() => {
    protocol.handle(scheme, serveAsset);
    createWindow();
  });
  app.on('window-all-closed', () => app.quit());
}
