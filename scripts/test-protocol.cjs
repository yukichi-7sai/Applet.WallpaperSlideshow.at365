const {
  getPublishDirectory,
} = require("../../AppDock.at365/scripts/publish-paths.cjs");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."),
  host = path.resolve(root, "../AppDock.at365");
const { JsonLinePeer } = require(path.join(host, "out/main/main/core/rpc.js"));
const fixture = path.join(
  root,
  "Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows/Applet.WallpaperSlideshow.RegressionTests.exe",
);
(async () => {
  const values = new Map(),
    logs = [],
    calls = [];
  let panel,
    pageOpened = false,
    detailsOpened = false,
    diagnostics = "",
    stopped = false,
    failHistoryIndex = null;
  const child = spawn(fixture, ["--protocol-fixture"], {
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.on("data", (data) => (diagnostics += data));
  const exited = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", resolve);
  });
  const peer = new JsonLinePeer(
    child.stdout,
    child.stdin,
    async (method, params) => {
      calls.push(method);
      if (method === "host.ui.panel") {
        panel = params;
        return null;
      }
      if (method === "host.log") {
        logs.push(params);
        return null;
      }
      if (method === "host.pages.open") {
        assert.equal(params.id, "history");
        pageOpened = true;
        return null;
      }
      if (method === "host.ui.openDetails") {
        detailsOpened = true;
        return null;
      }
      if (method === "host.pages.dispose") return null;
      if (method === "host.storage.set") {
        assert.equal(
          params.scope,
          "memory",
          "native history writes only memory Storage",
        );
        assert(Buffer.byteLength(JSON.stringify(params)) < 256 * 1024);
        if (params.key === "history" && failHistoryIndex === "before") {
          failHistoryIndex = null;
          throw Error("fixture publication rejected");
        }
        if (params.value == null) values.delete(params.key);
        else values.set(params.key, params.value);
        if (params.key === "history" && failHistoryIndex === "after") {
          failHistoryIndex = null;
          throw Error("fixture publication receipt lost");
        }
        return null;
      }
      throw Error("Unexpected native API " + method);
    },
  );
  const settings = {};
  const configure = async (change) => {
    Object.assign(settings, change);
    await peer.request("settings.changed", settings);
  };
  const paths = (monitor) =>
    values
      .get("history")
      .monitors[monitor].chunks.flatMap((key) => values.get(key));
  const command = (suffix) =>
    peer.request("command.execute", {
      id: "at365.wallpaper-slideshow." + suffix,
    });
  try {
    const result = await peer.request("activate", {
      id: "at365.wallpaper-slideshow",
      settings,
    });
    assert.equal(result.tray.length, 0);
    assert.equal(result.commands.length, 5);
    assert(
      !result.commands.some((command) =>
        /\.(resume|history\.previous|history\.next)$/.test(command.id),
      ),
    );
    assert.deepEqual(
      panel.actions.slice(0, 3).map((action) => action.command),
      ["off", "on", "toggle"].map(
        (value) => "at365.wallpaper-slideshow.settings.paused." + value,
      ),
    );
    assert.equal(
      panel.facts.find((fact) => fact.label === "状態").value,
      "表示中",
    );
    await configure({ paused: true });
    await command("next");
    assert(!diagnostics.includes("FIXTURE_NEXT_WALLPAPER"));
    await configure({ paused: false });
    await command("next");
    await configure({ paused: true });
    assert.match(
      panel.facts.find((fact) => fact.label === "状態").value,
      /停止中/,
    );
    await configure({ intervalSeconds: 7 });
    assert.equal(
      panel.facts.find((fact) => fact.label === "更新間隔").value,
      "7 秒",
    );
    await configure({ intervalSeconds: 0 });
    assert.match(panel.description, /設定エラー/);
    assert.equal(
      panel.facts.find((fact) => fact.label === "更新間隔").value,
      "7 秒",
    );
    await configure({ intervalSeconds: 7 });
    await assert.rejects(command("prepare-background"));
    await command("background-settings");
    await command("history");
    assert(pageOpened);
    assert.equal(panel.images, null);
    assert.equal(panel.tabs, null);
    assert.equal(values.get("history").schemaVersion, 1);
    assert.equal(paths(0).length, 7);
    assert.equal(paths(1).length, 1);
    assert.match(paths(0)[0], /image6\.png$/);
    assert(
      paths(0).every((file) => typeof file === "string" && fs.existsSync(file)),
    );
    assert(
      !calls.some((method) =>
        /imageDirectory|images\.register|images\.release/.test(method),
      ),
      "native never loads or saves history pixels",
    );
    await assert.rejects(
      peer.request("page.action", {
        id: "history.read",
        input: {},
        pageId: "history",
      }),
      /提供されていません/,
    );
    const shared = paths(1)[0];
    fs.unlinkSync(shared);
    await peer.request("page.fileRemoved", { pageId: "history", file: shared });
    assert.equal(paths(1).length, 0);
    assert(!paths(0).includes(shared));
    const beforeFailure = structuredClone(values.get("history"));
    failHistoryIndex = "before";
    await configure({ historyLimit: 5 });
    assert.deepEqual(
      values.get("history"),
      beforeFailure,
      "a rejected publication preserves the previous index",
    );
    await configure({ historyLimit: 30 });
    assert.equal(paths(0).length, 5);
    failHistoryIndex = "after";
    await configure({ historyLimit: 4 });
    assert.equal(
      paths(0).length,
      4,
      "an uncertain receipt does not delete a possibly committed generation",
    );
    await configure({ historyLimit: 30 });
    const current = values.get("history");
    const liveKeys = new Set([
      "history",
      ...current.monitors.flatMap((monitor) => monitor.chunks),
    ]);
    assert.deepEqual(
      new Set(values.keys()),
      liveKeys,
      "old metadata generations are reclaimed",
    );
    await command("home");
    assert(detailsOpened);
    await peer.request("deactivate");
    stopped = true;
    child.stdin.end();
    assert.equal(await exited, 0, diagnostics);
    assert(logs.some((entry) => entry.message.includes("[fixture shutdown]")));
    assert(
      !calls.some(
        (method) =>
          method.startsWith("host.storage.") && method !== "host.storage.set",
      ),
    );
    console.log(
      JSON.stringify({
        ok: true,
        checks: [
          "activation / 5 commands / no tray",
          "start-stop-next / valid settings / invalid rollback",
          "memory Storage path publication / no pixel API or history file",
          "native source deletion event removes every monitor / retired memory chunks reclaimed",
          "rejected and uncertain publications retain readable metadata / next success releases old and unacknowledged chunks",
          "home / shutdown logging / clean EOF",
        ],
      }),
    );
  } finally {
    if (!stopped && !peer.closed)
      await peer.request("deactivate").catch(() => {});
    child.stdin.end();
    peer.close();
    if (child.exitCode === null) child.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// Exercise the published native entry point, but reject settings before any desktop mutation.
if (!process.argv.includes("--fixture-only"))
  (async () => {
    const exe = path.join(
      getPublishDirectory(root),
      "Applet.WallpaperSlideshow.at365/Applet.WallpaperSlideshow.at365.exe",
    );
    if (!fs.existsSync(exe))
      throw new Error("Publish the Applet before the native startup smoke.");
    const child = spawn(exe, [], {
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    let diagnostics = "";
    child.stderr.on("data", (data) => {
      diagnostics += data;
    });
    const logs = [];
    const peer = new JsonLinePeer(
      child.stdout,
      child.stdin,
      async (method, params) => {
        if (method === "host.log") logs.push(params);
        return null;
      },
    );
    const exited = new Promise((resolve, reject) => {
      child.on("error", reject);
      child.on("exit", resolve);
    });
    try {
      await assert.rejects(
        peer.request("activate", {
          id: "at365.wallpaper-slideshow",
          settings: { monitors: "{" },
        }),
        /JSON|depth|Depth|invalid|Invalid|expected|Expected/i,
      );
      const window = execFileSync(
        fixture,
        ["--find-session-window", String(child.pid)],
        { windowsHide: true, encoding: "utf8" },
      ).trim();
      for (const [action, result] of [
        ["query", "1"],
        ["cancel", "0"],
        ["end", "0"],
      ]) {
        assert.equal(
          execFileSync(
            fixture,
            ["--send-session-message", String(child.pid), window, action],
            { windowsHide: true, encoding: "utf8" },
          ).trim(),
          result,
          "published native HWND handles " + action,
        );
      }
      await peer.request("deactivate");
      child.stdin.end();
      assert.equal(await exited, 0, diagnostics);
      assert(
        logs.some(
          (entry) =>
            entry.level === "error" && entry.message.includes("[Appletの開始]"),
        ),
        "published entry point sends activation errors via common logging",
      );
      console.log(
        "PASS published native startup / invalid settings rejected before desktop access / common error logging / real HWND query-cancel-end / clean exit",
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
