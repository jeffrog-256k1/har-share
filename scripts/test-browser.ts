import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { sample } from '../src/sample.ts';
await mkdir('test-results', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 0, open: false } });
const base = server.resolvedUrls!.local[0];
const browser = await chromium.launch({
  channel: process.env.HAR_SHARE_BROWSER_CHANNEL || undefined,
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } }),
    page = await context.newPage(),
    errors: string[] = [],
    requests: { url: string; method: string }[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  context.on('request', (req) => requests.push({ url: req.url(), method: req.method() }));
  await page.goto(base);
  await page.click('#sample');
  await page.waitForFunction(() => document.getElementById('state')?.dataset.state === 'ready');
  assert.equal(await page.locator('#rows tr').count(), 8);
  for (const lang of ['en', 'ko', 'zh-CN', 'ja', 'es']) {
    await page.selectOption('#language', lang);
    assert.equal(await page.locator('html').getAttribute('lang'), lang);
  }
  await page.selectOption('#language', 'en');
  assert.doesNotMatch(await page.locator('body').innerText(), /FICTIONAL_CANARY|studio\.example/);
  let d = page.waitForEvent('download');
  await page.click('#download');
  await (await d).saveAs('test-results/minimized.har');
  const output = await readFile('test-results/minimized.har', 'utf8');
  assert.doesNotMatch(output, /FICTIONAL_CANARY|private-/);
  d = page.waitForEvent('download');
  await page.click('#report');
  await (await d).saveAs('test-results/report.html');
  assert.doesNotMatch(await readFile('test-results/report.html', 'utf8'), /FICTIONAL_CANARY/);
  await page.screenshot({ path: 'test-results/desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: 'test-results/mobile.png', fullPage: true });
  await page.locator('#file').setInputFiles({
    name: 'CANARY_PRIVATE_FILENAME.har',
    mimeType: 'application/json',
    buffer: Buffer.from(sample()),
  });
  await page.waitForFunction(() => document.getElementById('state')?.dataset.state === 'ready');
  assert.doesNotMatch(await page.locator('body').innerText(), /CANARY/);
  await page.locator('#file').setInputFiles({
    name: 'CANARY_BAD_FILENAME.har',
    mimeType: 'application/json',
    buffer: Buffer.from('{CANARY_BAD_JSON'),
  });
  await page.locator('#error').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#result').isVisible(), false);
  assert.doesNotMatch(await page.locator('body').innerText(), /CANARY/);
  assert.equal(await page.evaluate(() => localStorage.length + sessionStorage.length), 0);
  assert.ok(requests.every((req) => req.url.startsWith(base) && req.method === 'GET'));
  const offline = await context.newPage();
  await offline.goto(pathToFileURL(resolve('test-results/report.html')).href);
  assert.equal(await offline.locator('tbody tr').count(), 8);
  const viewer = await browser.newContext();
  await viewer.routeFromHAR(resolve('test-results/minimized.har'), { notFound: 'abort' });
  const vpage = await viewer.newPage(),
    url = JSON.parse(output).log.entries[0].request.url;
  const response = await vpage.goto(url);
  assert.equal(response?.status(), 200);
  assert.equal((await response!.body()).length, 0);
  await viewer.close();
  assert.deepEqual(errors, []);
  await writeFile(
    'test-results/verification.json',
    JSON.stringify(
      {
        languages: 5,
        worker: true,
        harDownload: true,
        htmlDownload: true,
        mobile: true,
        noCanaries: true,
        noStorage: true,
        noUploads: true,
        playwrightHarImport: true,
        errors,
      },
      null,
      2,
    ),
  );
  console.log('Browser checks passed, including offline report and HAR import.');
} finally {
  await browser.close();
  await new Promise<void>((resolve) => server.httpServer.close(() => resolve()));
}
