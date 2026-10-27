const assert = require('node:assert/strict');
const { chromium } = require(process.argv[2] || 'playwright');
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Zr0AAAAASUVORK5CYII=', 'base64');
const frame = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.argv[3] ? { executablePath: process.argv[3] } : {}) });
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    let body = '', status = 200, hold = false, release;
    await page.route('**/api/echo', async route => {
      assert.match(route.request().postDataJSON().image, /^data:image\/png;base64,/);
      if (hold) await new Promise(r => release = r);
      try { await route.fulfill({ status, contentType: 'text/event-stream', body }); } catch { /* cancelled request */ }
    });
    await page.goto(process.argv[4] || 'http://127.0.0.1:5100');
    const upload = () => page.locator('input[type=file]').first().setInputFiles({ name: 'fixture.png', mimeType: 'image/png', buffer: png });
    const send = () => page.getByRole('button', { name: '发送共鸣' }).click();
    await upload(); body = frame('text', { content: '完整测试共鸣' }) + frame('done', {}); await send();
    await page.getByText('完整测试共鸣', { exact: true }).waitFor(); assert.equal(await page.getByAltText('预览图片').count(), 0);
    await upload(); body = frame('text', { content: '不完整' }); await send(); await page.getByText('连接提前结束，请重试', { exact: true }).waitFor();
    assert.equal(await page.getByAltText('预览图片').count(), 1);
    body = frame('image', { error: '图片生成测试失败' }); await send(); await page.getByText('图片生成测试失败', { exact: true }).waitFor();
    status = 503; await send(); await page.getByText('请求失败', { exact: true }).waitFor();
    status = 200; hold = true; await send(); await page.getByRole('button', { name: '停止接收' }).click();
    await page.getByText(/已停止接收，图片已保留/).waitFor(); assert.equal(await page.getByAltText('预览图片').count(), 1); release?.();
    hold = false; body = frame('decision', { copywriting: '重试成功' }) + frame('done', {}); await send(); await page.getByText('重试成功', { exact: true }).waitFor();
    assert.deepEqual(errors, []); console.log('PASS: upload, success, premature stream, image error, HTTP failure, cancel, preserved image and retry');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
