// Verify the retained settings launcher and removal of wallpaper-changing actions with a fake engine.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { spawn } = require('node:child_process'), net = require('node:net');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..'), hostRoot = path.resolve(root, '../AppDock.at365');
const { chromium } = require(path.join(hostRoot, 'node_modules/playwright'));
const { settingsPage } = require(path.join(hostRoot, 'scripts/settings-shell-helper.cjs'));
const { getPublishDirectory } = require(path.join(hostRoot, 'scripts/publish-paths.cjs'));
const profile = path.join(root, '.artifacts', `memory-settings-ui-${Date.now()}`);
const folder = path.join(profile, 'extensions/wallpaper'); fs.mkdirSync(folder, { recursive: true });
fs.cpSync(path.join(root, 'Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows'), folder, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'extension.json')));
manifest.entry = 'Applet.WallpaperSlideshow.RegressionTests.exe'; manifest.startupDelaySeconds = 0;
fs.writeFileSync(path.join(folder, 'extension.json'), JSON.stringify(manifest));
const settings = require(path.join(hostRoot, 'out/main/shared/settings-schema')).createDefaultSettings();
settings.host.hardwareAcceleration = false; settings.globalShortcutCommands = [];
settings.extensions[manifest.id] = { enabled: true, settings: { paused: true } };
fs.writeFileSync(path.join(profile, 'settings.json'), JSON.stringify(settings));
const original = path.resolve(process.argv[2] || path.join(getPublishDirectory(hostRoot), 'AppDock.at365.exe'));
const executable = path.join(profile, 'AppDock.at365.exe'); fs.copyFileSync(original, executable);
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(hash(original), hash(executable));
const env = { ...process.env, APPDOCK_WALLPAPER_FIXTURE: '1' }; delete env.ELECTRON_RUN_AS_NODE;
let child, browser;
async function until(fn, label) {
  const end = Date.now() + 20000;
  while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 50)); }
  throw Error(label);
}
(async () => {
  try {
    const probe = net.createServer(); await new Promise(r => probe.listen(0, '127.0.0.1', r));
    const port = probe.address().port; await new Promise(r => probe.close(r));
    child = spawn(executable, [`--test-profile=${profile}`, `--remote-debugging-port=${port}`], { cwd: profile, env, windowsHide: true, stdio: 'ignore' });
    await until(async () => { try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 1000 }); return true; } catch { return false; } }, 'portable CDP');
    let host;
    await until(() => { host = browser.contexts().flatMap(c => c.pages()).find(p => p.url().startsWith('appdock://host/')); return !!host; }, 'host page');
    await host.waitForFunction(async () => (await window.dock?.snapshot())?.startupReady);
    await host.evaluate(() => window.dock.executeCommand('appdock.settings.open'));
    const page = await settingsPage(host);
    await page.getByRole('button', { name: 'WallpaperSlideshow.at365', exact: true }).click();
    await page.locator('summary').filter({ hasText: 'Windowsの背景' }).click();
    const open = page.getByRole('button', { name: 'Windowsの背景設定を開く', exact: true });
    await open.waitFor();
    assert.equal(await page.getByRole('button', { name: /画像・スパン/ }).count(), 0);
    assert.equal(manifest.commands.some(c => c.id.endsWith('.prepare-background')), false);
    assert.match(await page.locator('body').innerText(), /停止中に見えるWindows側の背景/);
    await page.getByLabel('壁紙の更新間隔（秒）', { exact: true }).fill('77');
    await page.getByLabel('壁紙の更新間隔（秒）', { exact: true }).blur();
    const own = () => host.evaluate(id => window.dock.snapshot().then(s => s.settings.value.extensions[id].settings), manifest.id);
    await until(async () => (await own()).intervalSeconds === 77, 'immediate saved setting');
    await open.click();
    await page.getByRole('status').filter({ hasText: 'Windowsの背景設定を開きました。' }).waitFor();
    assert.equal((await own()).paused, true);
    assert.equal((await own()).intervalSeconds, 77);
    await page.screenshot({ path: path.join(profile, 'settings.png') });
    await page.setViewportSize({ width: 900, height: 760 });
    assert(await page.locator('.settings-surface').evaluate(el => el.scrollWidth <= el.clientWidth + 1));
    await page.screenshot({ path: path.join(profile, 'narrow.png') });
    const result = { ok: true, hostSha256: hash(executable), checks: [
      'wallpaper-changing action removed', 'retained launcher executes via native fixture',
      'immediate save and manual pause preserved', 'normal and narrow settings layouts',
    ] };
    fs.writeFileSync(path.join(profile, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ profile, ...result }));
    await host.evaluate(() => window.dock.executeCommand('appdock.quit'));
    await until(() => child.exitCode !== null, 'host exit');
  } catch (error) {
    for (const page of browser?.contexts().flatMap(c => c.pages()) || []) {
      if (page.url().endsWith('/settings.html')) {
        fs.writeFileSync(path.join(profile, 'settings-failure.txt'), await page.locator('body').innerText().catch(() => 'unavailable'));
        await page.screenshot({ path: path.join(profile, 'settings-failure.png') }).catch(() => {});
      }
    }
    fs.writeFileSync(path.join(profile, 'result.json'), JSON.stringify({ ok: false, error: error.stack }, null, 2));
    throw error;
  } finally { await browser?.close(); if (child && child.exitCode === null) child.kill(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
