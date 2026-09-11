const fs = require('fs');
const path = require('path');
const { chromium } = require('/tmp/free-browser-qa/node_modules/playwright');

(async () => {
  const target = process.env.TARGET_URL;
  if (!target || !/^https?:\/\//i.test(target)) throw new Error('TARGET_URL must be http(s)');
  const outDir = path.resolve('qa/free-browser-output');
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const failures = [];
  page.on('pageerror', e => failures.push({ type: 'pageerror', message: String(e.message || e) }));
  page.on('console', m => { if (m.type() === 'error') failures.push({ type: 'console', message: m.text() }); });
  page.on('requestfailed', r => failures.push({ type: 'requestfailed', url: r.url(), message: r.failure()?.errorText || 'failed' }));
  page.on('response', r => { if (r.status() >= 400) failures.push({ type: 'http', status: r.status(), url: r.url() }); });
  const started = Date.now();
  const response = await page.goto(target, { waitUntil: 'networkidle', timeout: 60000 });
  const title = await page.title();
  await page.screenshot({ path: path.join(outDir, 'landing.png'), fullPage: true });
  const report = {
    target,
    status: response?.status() || null,
    title,
    elapsedMs: Date.now() - started,
    failureCount: failures.length,
    failures: failures.slice(0, 50),
    engine: 'local Chromium + Playwright (no cloud API key)'
  };
  fs.writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  if (!response || response.status() >= 500) process.exitCode = 2;
})();
