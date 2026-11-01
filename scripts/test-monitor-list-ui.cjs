const { getPublishDirectory } = require('../../AppDock.at365/scripts/publish-paths.cjs');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { spawn } = require('node:child_process');
const net = require('node:net');
const root = path.resolve(__dirname, '..'), hostRoot = path.resolve(root, '../AppDock.at365');
const { _electron: electron, chromium } = require(path.join(hostRoot, 'node_modules/playwright'));
const { settingsPage, waitForHost } = require(path.join(hostRoot, 'scripts/settings-host-helper.cjs'));
const hash = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const profile = path.join(root, '.artifacts', `monitor-list-ui-${Date.now()}`);
const applet = path.join(profile, 'extensions/wallpaper');
fs.mkdirSync(applet, { recursive: true });
fs.cpSync(path.join(getPublishDirectory(root), 'Applet.WallpaperSlideshow.at365'), applet, { recursive: true });
if (!process.argv[2]) fs.copyFileSync(path.join(root, 'extension.json'), path.join(applet, 'extension.json'));
const manifest = JSON.parse(fs.readFileSync(path.join(applet, 'extension.json'))), owner = manifest.id;
const settings = require(path.join(hostRoot, 'out/main/shared/settings-schema')).createDefaultSettings();
settings.host.notifications = false;
settings.host.hardwareAcceleration = false;
settings.globalShortcutCommands = [];
const legacy = JSON.stringify([
  { Folder: 'C:/Example/A', Mode: 4, TileCount: 13, PaddingLeft: 1, PaddingRight: 2, PaddingTop: 3, PaddingBottom: 40, private: 'retained' },
  { Folder: 'C:/Example/C', Mode: 1, PaddingBottom: 5 },
]);
settings.extensions[owner] = { enabled: false, settings: { monitors: legacy, intervalSeconds: 60, tileMargin: 300 } };
const settingsFile = require(path.join(hostRoot, 'scripts/test-settings.cjs')).file(profile);
fs.writeFileSync(settingsFile, JSON.stringify(settings));
const executable = process.argv[2] ? path.join(profile, 'AppDock.at365.exe') : require(path.join(hostRoot, 'node_modules/electron'));
if (process.argv[2]) require(path.join(hostRoot, 'scripts/copy-host.cjs')).copyHost(path.resolve(process.argv[2]), executable);
const env = { ...process.env }; delete env.ELECTRON_RUN_AS_NODE;
let app, host, page, browser, child;
const checks = [], errors = [];
async function until(fn, label) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await fn()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw Error(label);
}
const own = () => host.evaluate(id => window.dock.snapshot().then(s => s.settings.value.extensions[id].settings), owner);
const dialog = () => page.getByRole('dialog');
const cancel = () => dialog().getByRole('button', { name: 'キャンセル', exact: true }).click();
const ok = () => dialog().getByRole('button', { name: 'OK', exact: true }).click();
const edit = number => page.getByRole('button', { name: `モニター${number}を編集`, exact: true }).click();
(async () => {
  try {
    if (process.argv[2]) {
      const probe = net.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
      const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
      child = spawn(executable, [`--test-profile=${profile}`, `--remote-debugging-port=${port}`], { cwd: profile, env, windowsHide: true, stdio: 'ignore' });
      await until(async () => {
        try { browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`, { timeout: 1000 }); return true; } catch { return false; }
      }, 'portable CDP');
      await until(() => { host = browser.contexts().flatMap(context => context.pages()).find(p => p.url().startsWith('appdock://host/')); return !!host; }, 'host');
    } else {
      app = await electron.launch({ executablePath: executable, args: [hostRoot, `--test-profile=${profile}`], env, timeout: 45000 });
      host = await app.firstWindow();
    }
    await waitForHost(host, async () => (await window.dock?.snapshot())?.startupReady);
    host.context().on('page', p => p.on('pageerror', error => errors.push(error.message)));
    await host.evaluate(() => window.dock.executeCommand('appdock.settings.open'));
    page = await settingsPage(host);
    await page.getByTestId('settings-nav:applet:' + owner).click();
    const table = () => page.getByRole('table', { name: 'モニターごとの画像設定', exact: true });
    await table().waitFor();
    assert.equal(await table().locator('tbody tr').count(), 2);
    assert.equal(await table().locator('input,select,textarea').count(), 0);
    assert.match(await table().innerText(), /Tile（複数画像を並べる）/);
    assert.equal((await own()).monitors, legacy);
    await edit(1);
    const tileCount = () => dialog().getByLabel('タイル枚数', { exact: true });
    const tileMargin = () => dialog().getByLabel('タイル間の余白（px）', { exact: true });
    assert.equal(await tileMargin().inputValue(), '10');
    assert.equal(await tileMargin().isEnabled(), true);
    await tileMargin().fill('24');
    await dialog().getByLabel('表示モード', { exact: true }).selectOption('Fit');
    assert.equal(await tileCount().isDisabled(), true);
    assert.equal(await tileMargin().isDisabled(), true);
    assert.equal(await tileMargin().inputValue(), '24');
    await dialog().getByLabel('表示モード', { exact: true }).selectOption('Tile');
    assert.equal(await tileCount().isEnabled(), true);
    assert.equal(await tileMargin().inputValue(), '24');
    await cancel();
    assert.equal((await own()).monitors, legacy);
    await edit(2);
    assert.equal(await tileCount().isDisabled(), true);
    assert.equal(await tileMargin().isDisabled(), true);
    await dialog().screenshot({ path: path.join(profile, 'tile-controls-disabled.png') });
    await cancel();
    checks.push('monitor default 10 ignores common margin; Tile-only inputs retain values; cancellation does not save');
    await edit(1);
    assert.equal(await dialog().getByLabel('画像ソースフォルダー 1', { exact: true }).inputValue(), 'C:/Example/A');
    assert.equal(await dialog().getByLabel('表示モード', { exact: true }).inputValue(), 'Tile');
    assert.equal(await dialog().getByLabel('下のPadding（px）', { exact: true }).inputValue(), '40');
    await dialog().getByLabel('下のPadding（px）', { exact: true }).fill('12');
    await cancel();
    assert.equal((await own()).monitors, legacy);
    assert(await page.getByRole('button', { name: 'モニター1を編集', exact: true }).evaluate(el => el === document.activeElement));
    checks.push('legacy JSON / Folder aliases / numeric Mode labels; cancel preserves bytes and focus');
    await edit(1);
    await dialog().getByRole('button', { name: '画像ソースフォルダーを追加', exact: true }).click();
    if (app) {
      await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: false, filePaths: ['C:/Example/Chosen'] }); });
      await dialog().getByRole('button', { name: '画像ソースフォルダー 2を選ぶ', exact: true }).click();
      await until(async () => await dialog().getByLabel('画像ソースフォルダー 2', { exact: true }).inputValue() === 'C:/Example/Chosen', 'picker');
      await app.evaluate(({ dialog }) => { dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] }); });
      await dialog().getByRole('button', { name: '画像ソースフォルダー 1を選ぶ', exact: true }).click();
      assert.equal(await dialog().getByLabel('画像ソースフォルダー 1', { exact: true }).inputValue(), 'C:/Example/A');
    } else {
      assert(await dialog().getByRole('button', { name: '画像ソースフォルダー 2を選ぶ', exact: true }).isVisible());
      await dialog().getByLabel('画像ソースフォルダー 2', { exact: true }).fill('C:/Example/Chosen');
    }
    await dialog().getByLabel('タイル枚数', { exact: true }).fill('0');
    await ok(); await dialog().getByRole('alert').waitFor();
    assert.equal((await own()).monitors, legacy);
    await dialog().getByLabel('タイル枚数', { exact: true }).fill('13');
    await tileMargin().fill('24');
    await ok();
    await until(async () => Array.isArray((await own()).monitors), 'legacy save');
    const migrated = (await own()).monitors;
    assert.deepEqual(migrated[0].Folders, ['C:/Example/A', 'C:/Example/Chosen']);
    assert.equal(migrated[0].Folder, undefined); assert.equal(migrated[0].Mode, 'Tile');
    assert.equal(migrated[0].PaddingBottom, 40); assert.equal(migrated[0].private, 'retained');
    assert.equal(migrated[0].TileMargin, 24);
    assert.equal((await own()).tileMargin, 300);
    assert.equal(migrated[1].Folder, 'C:/Example/C'); assert.equal(migrated[1].Mode, 1);
    checks.push(`${app ? 'stubbed native directory picker and cancellation' : 'manual directory entry; picker bridge covered by source test'}; validation retains input; atomic migration edits only one monitor`);
    await edit(2);
    await dialog().getByLabel('表示モード', { exact: true }).selectOption('Tile');
    await tileMargin().fill('48');
    await dialog().getByLabel('表示モード', { exact: true }).selectOption('Fit');
    await ok();
    await until(async () => (await own()).monitors[1].TileMargin === 48, 'second monitor margin');
    await edit(2);
    assert.equal(await tileMargin().isDisabled(), true);
    assert.equal(await tileMargin().inputValue(), '48');
    assert.equal((await own()).monitors[0].TileMargin, 24);
    await cancel();
    checks.push('independent monitor margins persist through mode changes and reopen');
    await page.getByRole('button', { name: 'モニターを追加', exact: true }).click();
    await cancel(); assert.equal((await own()).monitors.length, 2);
    await page.getByRole('button', { name: 'モニターを追加', exact: true }).click();
    await dialog().getByRole('button', { name: '画像ソースフォルダーを追加', exact: true }).click();
    await dialog().getByLabel('画像ソースフォルダー 1', { exact: true }).fill('C:/Example/New');
    await dialog().getByLabel('下のPadding（px）', { exact: true }).fill('9');
    await ok(); await until(async () => (await own()).monitors.length === 3, 'add');
    const openOrder = () => page.getByRole('button', { name: 'モニターごとの画像設定を並べ替え', exact: true }).click();
    await openOrder();
    await dialog().getByTestId('settings-order-handle:2').press('ArrowUp');
    assert.equal((await own()).monitors[2].PaddingBottom, 9);
    await cancel();
    await openOrder();
    await dialog().getByTestId('settings-order-handle:2').press('ArrowUp');
    await dialog().screenshot({ path: path.join(profile, 'monitor-order.png') });
    await ok(); await until(async () => (await own()).monitors[1].PaddingBottom === 9, 'order');
    await page.getByRole('button', { name: 'モニター2を削除', exact: true }).click();
    await cancel(); assert.equal((await own()).monitors.length, 3);
    await page.getByRole('button', { name: 'モニター2を削除', exact: true }).click();
    await dialog().getByRole('button', { name: '削除', exact: true }).click();
    await until(async () => (await own()).monitors.length === 2, 'delete');
    assert.equal((await own()).monitors[1].PaddingBottom, 5);
    checks.push('add/cancel; numbered reorder/apply/cancel; deletion confirmation and monitor assignment preserved');
    await edit(1); await dialog().getByLabel('下のPadding（px）', { exact: true }).fill('23');
    await host.evaluate(async owner => {
      const s = await window.dock.snapshot(); s.settings.value.extensions[owner].settings.monitors[0].PaddingBottom = 41;
      await window.dock.saveSettings(s.settings.value, s.settings.revision);
    }, owner);
    await ok(); await dialog().getByRole('alert').waitFor();
    assert.equal(await dialog().getByLabel('下のPadding（px）', { exact: true }).inputValue(), '23');
    assert.equal((await own()).monitors[0].PaddingBottom, 41); await cancel();
    checks.push('concurrent external change rejected with local draft retained');
    const cdp = await page.context().newCDPSession(page);
    for (const theme of ['dark', 'light']) {
      await host.evaluate(async theme => {
        const s = await window.dock.snapshot(); s.settings.value.host.theme = theme;
        await window.dock.saveSettings(s.settings.value, s.settings.revision);
      }, theme);
      await until(() => page.evaluate(theme => document.documentElement.dataset.theme === theme, theme), 'theme');
      for (const width of [1280, 700]) {
        await cdp.send('Emulation.setDeviceMetricsOverride', { width, height: 840, deviceScaleFactor: 1, mobile: false });
        await table().screenshot({ path: path.join(profile, `list-${theme}-${width}.png`) });
        await edit(1);
        const focused = dialog().getByLabel('タイル枚数', { exact: true });
        await focused.focus();
        assert(await focused.evaluate(el => {
          const clip = el.closest('.settings-dialog-body').getBoundingClientRect();
          const rect = el.getBoundingClientRect(), style = getComputedStyle(el);
          const ring = parseFloat(style.outlineWidth) + parseFloat(style.outlineOffset);
          return ring > 0 && rect.left - ring >= clip.left && rect.right + ring <= clip.right;
        }), 'focused input outline must fit inside the scroll viewport');
        assert(await dialog().evaluate(el => el.scrollWidth <= el.clientWidth));
        const bounds = await dialog().boundingBox(); assert(bounds.x >= 0 && bounds.x + bounds.width <= width);
        await dialog().screenshot({ path: path.join(profile, `edit-${theme}-${width}.png`) });
        await cancel();
      }
    }
    await cdp.send('Emulation.clearDeviceMetricsOverride'); await cdp.detach();
    const beforeLimit = (await own()).monitors;
    await host.evaluate(async owner => {
      const s = await window.dock.snapshot();
      s.settings.value.extensions[owner].settings.monitors[0].Folders = Array.from({ length: 64 }, (_, i) => `C:/Example/Folder${i + 1}`);
      await window.dock.saveSettings(s.settings.value, s.settings.revision);
    }, owner);
    await until(async () => (await table().innerText()).includes('C:/Example/Folder64'), '64 folders rendered');
    await edit(1);
    assert.equal(await dialog().getByLabel('画像ソースフォルダー 64', { exact: true }).inputValue(), 'C:/Example/Folder64');
    assert(await dialog().locator('.settings-dialog-body').evaluate(el => el.scrollHeight > el.clientHeight));
    const longFooter = await dialog().locator('footer').boundingBox();
    const longBody = await dialog().locator('.settings-dialog-body').boundingBox();
    assert(longBody.y + longBody.height <= longFooter.y, 'scroll body must end before footer');
    assert(longFooter.y + longFooter.height <= await page.evaluate(() => innerHeight));
    await dialog().screenshot({ path: path.join(profile, 'edit-64-folders.png') });
    await cancel();
    await host.evaluate(async ({ owner, rows }) => {
      const s = await window.dock.snapshot(); s.settings.value.extensions[owner].settings.monitors = rows;
      await window.dock.saveSettings(s.settings.value, s.settings.revision);
    }, { owner, rows: beforeLimit });
    checks.push('64-folder dialog; long dialog scrolls while footer stays visible');
    await page.getByTestId('settings-nav:about').click();
    await page.getByTestId('settings-nav:applet:' + owner).click(); page = await settingsPage(host);
    await table().waitFor(); await edit(1);
    assert.equal(await dialog().getByLabel('下のPadding（px）', { exact: true }).inputValue(), '41');
    await dialog().getByRole('button', { name: '画像ソースフォルダー 2を削除', exact: true }).click();
    await ok(); await until(async () => (await own()).monitors[0].Folders.length === 1, 'detail save');
    checks.push('dark/light at 1280/700; settings navigation reopens dialog and directory removal');
    // Settings now live in the host renderer; reload also recreates its detail tab.
    await page.reload();
    await waitForHost(host, async () => (await window.dock?.snapshot())?.startupReady);
    await host.evaluate(() => window.dock.executeCommand('appdock.settings.open'));
    page = await settingsPage(host);
    await page.getByTestId('settings-nav:applet:' + owner).click();
    await table().waitFor();
    assert.equal((await own()).intervalSeconds ?? manifest.settings.find(field => field.key === 'intervalSeconds').default, 60);
    const disk = JSON.parse(fs.readFileSync(settingsFile));
    assert.deepEqual(disk.extensions[owner].settings, await own());
    const state = await host.evaluate(owner => window.dock.snapshot().then(s => s.extensions.find(e => e.id === owner)), owner);
    assert.equal(state.state, 'stopped'); assert.deepEqual(errors, []);
    checks.push('saved settings survive reload; real Applet stays disabled; no wallpaper or user image changes');
    const result = { ok: true, profile, checks, host: process.argv[2] ? { sha256: hash(executable) } : 'source', applet: Object.fromEntries(fs.readdirSync(applet).filter(f => fs.statSync(path.join(applet, f)).isFile()).map(f => [f, hash(path.join(applet, f))])) };
    fs.writeFileSync(path.join(profile, 'result.json'), JSON.stringify(result, null, 2)); console.log(JSON.stringify(result));
  } catch (error) {
    fs.writeFileSync(path.join(profile, 'failure.txt'), String(error.stack));
    throw error;
  } finally {
    if (browser) {
      if (host) await host.evaluate(() => { void window.dock.executeCommand('appdock.quit'); }).catch(() => {});
      if (child) await until(() => child.exitCode !== null, 'shutdown');
      await browser.close();
    }
    if (app) await app.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
