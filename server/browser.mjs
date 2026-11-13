import puppeteer from 'puppeteer-core';

export function createHtmlRenderer(executablePath) {
  return async html => {
    const browser = await puppeteer.launch({
      executablePath, headless: true, timeout: 30000,
      // Chromium sandbox stays enabled. Run the service as an unprivileged user.
      args: ['--disable-dev-shm-usage'],
    });
    try {
      const page = await browser.newPage();
      await page.setJavaScriptEnabled(false);
      await page.setRequestInterception(true);
      page.on('request', request => {
        if (request.url().startsWith('data:')) void request.continue();
        else void request.abort();
      });
      await page.setViewport({ width: 1200, height: 675, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      return await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: 1200, height: 675 } });
    } finally { await browser.close(); }
  };
}
