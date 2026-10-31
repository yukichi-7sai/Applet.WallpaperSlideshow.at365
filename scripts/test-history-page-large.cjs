const { spawn } = require("node:child_process");
const path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."),
  host = path.resolve(root, "../AppDock.at365");
const { JsonLinePeer } = require(path.join(host, "out/main/main/core/rpc.js"));
const fixture = path.join(
  root,
  "Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows/Applet.WallpaperSlideshow.RegressionTests.exe",
);
const values = new Map();
let writes = 0,
  diagnostics = "";
const child = spawn(fixture, ["--protocol-fixture"], {
  windowsHide: true,
  stdio: ["pipe", "pipe", "pipe"],
  env: { ...process.env, APPDOCK_WALLPAPER_LARGE_HISTORY: "1" },
});
child.stderr.on("data", (data) => (diagnostics += data));
const peer = new JsonLinePeer(
  child.stdout,
  child.stdin,
  async (method, params) => {
    if (["host.ui.panel", "host.log"].includes(method)) return null;
    assert.equal(method, "host.storage.set");
    assert.equal(params.scope, "memory");
    assert(Buffer.byteLength(JSON.stringify(params)) < 256 * 1024);
    writes++;
    if (params.value == null) values.delete(params.key);
    else values.set(params.key, params.value);
    return null;
  },
);
const exited = new Promise((resolve, reject) => {
  child.on("error", reject);
  child.on("exit", resolve);
});
(async () => {
  try {
    await peer.request("activate", {
      id: "at365.wallpaper-slideshow",
      settings: { paused: true, historyLimit: 1000, historyPageSize: 1000 },
    });
    const index = values.get("history"),
      monitor = index.monitors[0];
    assert.equal(monitor.count, 1000);
    assert(monitor.chunks.length > 1);
    const paths = monitor.chunks.flatMap((key) => values.get(key));
    assert.equal(paths.length, 1000);
    assert(paths.every((file) => file.length > 400));
    assert.match(paths[0], /999\.png$/);
    assert.match(paths.at(-1), /0\.png$/);
    const previousKeys = [...values.keys()];
    await peer.request("settings.changed", { paused: true, historyLimit: 30 });
    assert.equal(values.get("history").monitors[0].count, 30);
    assert(
      previousKeys
        .filter((key) => key !== "history")
        .every((key) => !values.has(key)),
    );
    await peer.request("deactivate");
    child.stdin.end();
    assert.equal(await exited, 0, diagnostics);
    console.log(
      JSON.stringify({
        ok: true,
        writes,
        checks: [
          "1000 paths over 400 chars / immutable metadata chunks below RPC limits / newest-first / trimmed history reclaims old chunks / no image API",
        ],
      }),
    );
  } finally {
    child.stdin.end();
    peer.close();
    if (child.exitCode === null) child.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
