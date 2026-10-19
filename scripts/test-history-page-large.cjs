const { spawn } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'), host = path.resolve(root, '../AppDock.at365');
const { JsonLinePeer } = require(path.join(host, 'out/main/main/core/rpc.js'));
const fixture = path.join(root, 'Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows/Applet.WallpaperSlideshow.RegressionTests.exe');
const imageDirectory = fs.mkdtempSync(path.join(root, '.artifacts', 'history-large-'));
const child = spawn(fixture, ['--protocol-fixture'], { windowsHide: true, stdio: ['pipe','pipe','pipe'], env: { ...process.env, APPDOCK_WALLPAPER_LARGE_HISTORY: '1' } });
let diagnostics = ''; child.stderr.on('data', data => diagnostics += data);
const peer = new JsonLinePeer(child.stdout, child.stdin, async (method) => {
  if (method === 'host.ui.imageDirectory') return imageDirectory;
  if (method === 'host.pages.changed') return { accepted: true, delivered: false };
  if (['host.ui.panel','host.log','host.pages.images.release'].includes(method)) return null;
  throw Error('Unexpected API ' + method);
});
const exited = new Promise((resolve, reject) => { child.on('error', reject); child.on('exit', resolve); });
const action = (input) => peer.request('page.action', { id: 'history.read', input, pageId: 'history' });
(async () => {
  try {
    await peer.request('activate', { id: 'at365.wallpaper-slideshow', settings: { paused: true, historyLimit: 1000, historyPageSize: 1000 } });
    let generation = '', offset = 0, batches = 0; const slots = [];
    do {
      const result = await action({ monitor: 0, page: 0, offset, limit: 32, generation });
      assert.equal(result.total, 1000); assert.equal(result.pageSize, 1000);
      assert(result.items.length > 0 && result.items.length <= 32);
      assert(Buffer.byteLength(JSON.stringify(result)) < 256 * 1024);
      assert(result.items.every(item => item.tooltip.length > 400));
      slots.push(...result.items.map(item => item.slot));
      generation = result.generation; offset = result.nextOffset; batches++;
    } while (offset !== null);
    assert.deepEqual(slots, Array.from({ length: 1000 }, (_, i) => i));
    assert.equal(batches, 32);
    await assert.rejects(action({ monitor: 0, page: 0, offset: 0, limit: 33, generation }));
    await peer.request('page.action', { id: 'history.release', input: { generation }, pageId: 'history' });
    await peer.request('deactivate'); child.stdin.end(); assert.equal(await exited, 0, diagnostics);
    assert.equal(fs.readdirSync(imageDirectory, { recursive: true }).filter(name => name.endsWith('.png')).length, 0);
    console.log(JSON.stringify({ ok: true, checks: ['1000 entries and paths over 400 chars / stable slots / 32 metadata batches below 256KiB / limit rejection / cancel and cleanup'] }));
  } finally {
    child.stdin.end(); peer.close(); if (child.exitCode === null) child.kill();
    assert.equal(path.dirname(imageDirectory), path.join(root, '.artifacts')); fs.rmSync(imageDirectory, { recursive: true, force: true });
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
