// Explicit real-desktop test. Uses only the isolated child process's surfaces and HWND.
const { spawn, execFileSync } = require('node:child_process');
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..'), host = path.resolve(root, '../AppDock.at365');
const { JsonLinePeer } = require(path.join(host, 'out/main/main/core/rpc.js'));
const helper = path.join(root, 'Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows/Applet.WallpaperSlideshow.RegressionTests.exe');
const exe = path.resolve(process.argv[2] || path.join(root, 'Applet.WallpaperSlideshow/bin/Release/net10.0-windows/win-x64/Applet.WallpaperSlideshow.at365.exe'));
const output = path.join(root, '.artifacts', `memory-native-${Date.now()}`);
fs.mkdirSync(output, { recursive: true });
const copy = path.join(output, 'native');
fs.cpSync(path.dirname(exe), copy, { recursive: true });
const fixed = path.join(copy, path.basename(exe));
const hash = p => createHash('sha256').update(fs.readFileSync(p)).digest('hex');
assert.equal(hash(exe), hash(fixed));
// A generated source image belongs to this test. The renderer must only read it.
const source = path.join(output, 'sources'); fs.mkdirSync(source);
execFileSync(helper, ['--create-memory-source', path.join(source, 'fixture.png')], { windowsHide: true });
const inspect = () => JSON.parse(execFileSync(helper, ['--inspect-desktop'], { encoding: 'utf8', windowsHide: true }).trim());
const surfaces = pid => JSON.parse(execFileSync(helper, ['--inspect-surfaces', String(pid)], { encoding: 'utf8', windowsHide: true }).trim());
const snapshot = () => JSON.parse(execFileSync(helper, ['--snapshot-background'], { encoding: 'utf8', windowsHide: true }).trim());
const settings = { intervalSeconds: 1, historyLimit: 30, paused: false,
  monitors: inspect().monitors.map(() => ({ Folders: [source], Mode: 'Fill' })) };
const before = snapshot();
const child = spawn(fixed, [], { windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'] });
let panel, diagnostics = '', events = 0;
child.stderr.on('data', data => { diagnostics += data; });
const themes = path.join(process.env.APPDATA, 'Microsoft/Windows/Themes');
const watcher = fs.existsSync(themes) ? fs.watch(themes, (_, file) => { if (String(file).startsWith('TranscodedWallpaper')) events++; }) : null;
const logs = [], checks = [], resourceSamples = [];
const peer = new JsonLinePeer(child.stdout, child.stdin, async (method, params) => {
  if (method === 'host.ui.imageDirectory') return path.join(output, 'panel-images');
  if (method === 'host.ui.panel') { panel = params; return null; }
  if (method === 'host.log') { logs.push(params); return null; }
  throw Error('Unexpected host API: ' + method);
});
const exited = new Promise((resolve, reject) => { child.on('exit', resolve); child.on('error', reject); });
async function until(fn, label) {
  const end = Date.now() + 20000;
  while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 100)); }
  throw Error('Timed out: ' + label + '\n' + diagnostics + '\n' + JSON.stringify(panel));
}
(async () => {
  try {
    const activated = await peer.request('activate', { id: 'at365.wallpaper-slideshow', settings });
    assert(!activated.commands.some(c => c.id.endsWith('.prepare-background')));
    await until(() => panel?.facts.some(f => f.label === '状態' && f.value === '表示中'), 'initial memory display');
    let live = surfaces(child.pid);
    resourceSamples.push(live);
    assert.equal(live.windows.length, settings.monitors.length);
    for (let i = 0; i < live.windows.length; i++) {
      const pixels = JSON.parse(execFileSync(helper, ['--capture-surface', String(child.pid), String(live.windows[i].handle), path.join(output, `surface-${i}.png`)], { encoding: 'utf8', windowsHide: true }).trim());
      assert(pixels.R > 240 && pixels.G < 10 && pixels.B < 10, 'Desktop surface did not render the fixture pixels');
    }
    checks.push('fixed native EXE / real Explorer surfaces / visible state');
    for (let i = 0; i < 8; i++) {
      await peer.request('command.execute', { id: 'at365.wallpaper-slideshow.next' });
      await new Promise(r => setTimeout(r, 350));
      const sample = surfaces(child.pid);
      assert.deepEqual(sample.windows, live.windows, 'Image replacement recreated or moved the desktop surfaces');
      resourceSamples.push(sample);
    }
    await until(() => surfaces(child.pid).windows.length === settings.monitors.length, 'frame replacements');
    checks.push('frame replacements preserve desktop HWNDs / placement / input styles');
    // Destroy only an HWND proven to belong to this isolated process; Explorer itself stays running.
    execFileSync(helper, ['--destroy-surface', String(child.pid), String(live.windows[0].handle)], { windowsHide: true });
    await until(() => panel?.facts.some(f => f.label === '状態' && f.value.includes('再接続待ち')), 'surface loss');
    await until(() => panel?.facts.some(f => f.label === '状態' && f.value === '表示中'), 'surface recovery');
    checks.push('actual owned HWND destruction / reconnect / retained frame');
    await peer.request('settings.changed', { ...settings, paused: true });
    await until(() => surfaces(child.pid).windows.length === 0, 'manual pause');
    await new Promise(r => setTimeout(r, 1200));
    assert.equal(surfaces(child.pid).windows.length, 0);
    await peer.request('settings.changed', settings);
    await until(() => panel?.facts.some(f => f.label === '状態' && f.value === '表示中'), 'resume');
    checks.push('pause releases surfaces / no late display / resume');
    const window = execFileSync(helper, ['--find-session-window', String(child.pid)], { encoding: 'utf8', windowsHide: true }).trim();
    for (const action of ['query', 'cancel']) execFileSync(helper, ['--send-session-message', String(child.pid), window, action], { windowsHide: true });
    assert.equal(surfaces(child.pid).windows.length, settings.monitors.length);
    execFileSync(helper, ['--send-session-message', String(child.pid), window, 'end'], { windowsHide: true });
    assert.equal(surfaces(child.pid).windows.length, 0);
    await peer.request('deactivate'); child.stdin.end();
    assert.equal(await exited, 0, diagnostics);
    checks.push('targeted session query/cancel/end / synchronous release / clean EOF exit');
    const after = snapshot();
    assert.deepEqual(after, before, 'wallpaper registry or TranscodedWallpaper changed during isolated test');
    assert.equal(events, 0, 'TranscodedWallpaper change notification observed');
    assert.equal(logs.filter(l => l.level === 'error').length, 0, JSON.stringify(logs));
    const legacy = path.join(process.env.LOCALAPPDATA, 'at365/Applets/WallpaperSlideshow');
    const result = { ok: true, checks, executable: exe, sha256: hash(fixed),
      backgroundSnapshotPreserved: true, themesChangeNotifications: events,
      helper: hash(helper), geometry: inspect().monitors, legacyDirectory: legacy, resourceSamples,
      limits: ['No physical input, OS lock, RDP, actual Explorer restart, virtual-desktop switch, or mixed-DPI change was performed.'] };
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ output, ...result }));
  } catch (error) {
    fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify({ ok: false, checks, error: error.stack }, null, 2));
    throw error;
  } finally {
    watcher?.close(); child.stdin.end(); peer.close();
    if (child.exitCode === null) child.kill();
    fs.writeFileSync(path.join(output, 'diagnostics.log'), diagnostics);
    fs.writeFileSync(path.join(output, 'host-logs.json'), JSON.stringify(logs, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
