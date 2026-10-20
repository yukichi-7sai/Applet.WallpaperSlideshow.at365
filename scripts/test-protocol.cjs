const {
  getPublishDirectory,
} = require("../../AppDock.at365/scripts/publish-paths.cjs");
const { spawn, execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const host = path.resolve(root, "../AppDock.at365");
const { JsonLinePeer } = require(path.join(host, "out/main/main/core/rpc.js"));
const fixture = path.join(
  root,
  "Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows/Applet.WallpaperSlideshow.RegressionTests.exe",
);

(async () => {
  const settings = {};
  const setPause = async (value) => {
    settings.paused = value;
    await peer.request("settings.changed", { ...settings });
  };
  const imageDirectory = fs.mkdtempSync(
    path.join(
      root,
      ".artifacts",
      "protocol-images-" +
        (process.argv.includes("--long-cache") ? "x".repeat(100) + "-" : ""),
    ),
  );
  if (process.argv.includes("--long-cache"))
    assert(
      path.join(imageDirectory, ...Array(3).fill("x".repeat(32))).length > 260,
    );
  let panel,
    diagnostics = "",
    pageOpened = false,
    detailsOpened = false,
    rejectImages = false,
    rejectedRegistrations = 0;
  const registered = new Map();
  const storage = new Map();
  const logs = [];
  const child = spawn(fixture, ["--protocol-fixture"], {
    windowsHide: true,
    stdio: ["pipe", "pipe", "pipe"],
  });
  child.stderr.on("data", (data) => {
    diagnostics += data;
  });
  const peer = new JsonLinePeer(
    child.stdout,
    child.stdin,
    async (method, params) => {
      if (method === "host.ui.panel") {
        panel = params;
        return null;
      }
      if (method === "host.ui.imageDirectory") return imageDirectory;
      if (method === "host.pages.open") {
        assert.equal(params.id, "history");
        pageOpened = true;
        return null;
      }
      if (method === "host.ui.openDetails") {
        detailsOpened = true;
        return null;
      }
      if (method === "host.pages.dispose") {
        registered.clear();
        return null;
      }
      if (method === "host.pages.changed")
        return { accepted: true, delivered: true };
      if (method === "host.pages.images.register" && rejectImages) {
        rejectedRegistrations++;
        throw Error("Fixture View disposed");
      }
      if (method === "host.pages.images.register")
        return {
          images: params.files.map((item) => {
            assert(!path.relative(imageDirectory, item.file).startsWith(".."));
            assert(fs.existsSync(item.file));
            const id = require("node:crypto").randomUUID();
            registered.set(id, item.file);
            return { key: item.key, id, url: "appdock://page-images/" + id };
          }),
        };
      if (method === "host.pages.images.release") {
        params.imageIds.forEach((id) => registered.delete(id));
        return null;
      }
      if (method === "host.settings.set") {
        settings[params.key] = params.value;
        return null;
      }
      if (method === "host.storage.get") return storage.get(params.key) ?? null;
      if (method === "host.storage.set") {
        storage.set(params.key, params.value);
        return null;
      }
      if (method === "host.log") {
        logs.push(params);
        return null;
      }
      throw new Error("Unexpected API " + method);
    },
  );
  const exited = new Promise((resolve, reject) => {
    child.on("error", reject);
    child.on("exit", (code) => resolve(code));
  });
  let deactivated = false;
  const pageAction = (id, input = {}) =>
    peer.request("page.action", { id, input, pageId: "history" });
  const readyPage = async (monitor, page) => {
    let value = await pageAction("history.read", {
      monitor,
      page,
      offset: 0,
      limit: 32,
      generation: "",
    });
    const until = Date.now() + 10000;
    while (value.loading && Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 15));
      value = await pageAction("history.read", {
        monitor,
        page,
        offset: 0,
        limit: 32,
        generation: value.generation,
      });
    }
    assert.equal(value.loading, false, "thumbnail worker completed");
    return value;
  };
  const imageFiles = (value) =>
    value.items
      .filter((item) => item.image)
      .map((item) => registered.get(item.image.split("/").at(-1)));
  try {
    const result = await peer.request("activate", {
      id: "at365.wallpaper-slideshow",
      settings,
    });
    assert.equal(result.tray.length, 0);
    assert.equal(result.commands.length, 5);
    assert(
      !result.commands.some((c) => /\.(start|stop|toggle|resume)$/.test(c.id)),
    );
    assert.equal(
      result.commands.some((command) => command.id.endsWith(".resume")),
      false,
    );
    assert(
      result.commands.some((c) => c.id === "at365.wallpaper-slideshow.next"),
    );
    assert.deepEqual(
      panel.actions.slice(0, 3).map((a) => a.command),
      ["off", "on", "toggle"].map(
        (a) => "at365.wallpaper-slideshow.settings.paused." + a,
      ),
    );
    assert.deepEqual(
      panel.actions.slice(0, 4).map((action) => action.title),
      ["開始／再開", "停止", "開始／停止を切り替え", "次の壁紙に更新"],
    );
    assert.equal(
      panel.facts.find((fact) => fact.label === "状態").value,
      "表示中",
    );
    await setPause(true);
    assert.equal(settings.paused, true);
    assert(
      !result.commands.some((c) => c.id.endsWith(".prepare-background")),
      "wallpaper-changing command removed",
    );
    await assert.rejects(
      peer.request("command.execute", {
        id: "at365.wallpaper-slideshow.prepare-background",
      }),
    );
    assert.equal(
      settings.paused,
      true,
      "obsolete command cannot affect playback",
    );
    await peer.request("command.execute", {
      id: "at365.wallpaper-slideshow.background-settings",
    });
    assert.equal(settings.paused, true);
    await peer.request("command.execute", {
      id: "at365.wallpaper-slideshow.next",
    });
    assert.equal(diagnostics.includes("FIXTURE_NEXT_WALLPAPER"), false);
    await setPause(false);
    assert.equal(settings.paused, false);
    await peer.request("command.execute", {
      id: "at365.wallpaper-slideshow.next",
    });
    for (
      let attempt = 0;
      attempt < 50 && !diagnostics.includes("FIXTURE_NEXT_WALLPAPER");
      attempt++
    )
      await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(diagnostics.split("FIXTURE_NEXT_WALLPAPER").length - 1, 1);
    await setPause(!settings.paused);
    assert.equal(settings.paused, true);
    await setPause(!settings.paused);
    assert.equal(settings.paused, false);
    await setPause(true);
    assert.equal(settings.paused, true);
    assert.match(
      panel.facts.find((fact) => fact.label === "状態").value,
      /停止中/,
    );
    await setPause(false);
    assert.equal(settings.paused, false);
    await peer.request("settings.changed", { intervalSeconds: 7 });
    assert.equal(
      panel.facts.find((fact) => fact.label === "更新間隔").value,
      "7 秒",
    );
    settings.intervalSeconds = 0;
    await peer.request("settings.changed", { ...settings });
    assert.match(panel.description, /設定エラー/);
    assert.equal(
      panel.facts.find((fact) => fact.label === "更新間隔").value,
      "7 秒",
    );
    await setPause(true);
    assert.equal(settings.paused, true);
    assert.match(
      panel.facts.find((fact) => fact.label === "状態").value,
      /停止中/,
    );
    await setPause(false);
    assert.equal(settings.paused, false);
    assert.equal(
      panel.facts.find((fact) => fact.label === "状態").value,
      "表示中",
    );
    await peer.request("command.execute", {
      id: "at365.wallpaper-slideshow.history",
    });
    assert.equal(pageOpened, true);
    assert.equal((await pageAction("history.state")).gallery.cardWidth, 260);
    assert.equal(
      storage.size,
      0,
      "opening history does not create preference data",
    );
    const settingsBeforeSize = structuredClone(settings);
    await pageAction("history.gallery-size", { cardWidth: 340 });
    assert.equal((await pageAction("history.state")).gallery.cardWidth, 340);
    assert.deepEqual(storage.get("gallery-view"), {
      schemaVersion: 1,
      cardWidth: 340,
    });
    for (const cardWidth of [0, 181, 380])
      await assert.rejects(pageAction("history.gallery-size", { cardWidth }));
    assert.deepEqual(
      settings,
      settingsBeforeSize,
      "display size is independent from thumbnail and slideshow settings",
    );
    assert.equal(panel.images, null);
    assert.equal(panel.tabs, null);
    assert(!panel.actions.some((item) => item.command.endsWith(".history")));
    for (const suffix of ["history.previous", "history.next"])
      await assert.rejects(
        peer.request("command.execute", {
          id: "at365.wallpaper-slideshow." + suffix,
        }),
        /Unknown command/,
      );
    let first = await readyPage(0, 0);
    assert(
      first.items.every((item) => item.status === "ready" && item.image),
      "thumbnail generation failed: " +
        JSON.stringify(
          logs.filter((entry) => entry.message.includes("履歴画像")),
        ),
    );
    assert.equal(first.items.length, 4);
    assert.match(first.items[0].title, /image6/);
    const firstFiles = imageFiles(first);
    assert.equal(firstFiles.length, 4);
    let second = await readyPage(1, 0);
    assert.equal(second.items.length, 1);
    assert.match(second.items[0].title, /image3/);
    await pageAction("history.release", { generation: first.generation });
    assert(
      firstFiles.every((file) => !fs.existsSync(file)),
      "retired thumbnails released",
    );
    await assert.rejects(
      pageAction("history.delete-request", {
        generation: first.generation,
        slot: 0,
      }),
      /更新/,
    );
    let page = await readyPage(0, 1);
    await pageAction("history.release", { generation: second.generation });
    assert.equal(page.items.length, 3);
    assert.match(page.items[0].title, /image2/);
    assert(
      fs.statSync(imageFiles(page).at(-1)).size > 200000,
      "PNG quality has no RPC byte cap",
    );
    await pageAction("history.open", { generation: page.generation, slot: 0 });
    let pending = await pageAction("history.delete-request", {
      generation: page.generation,
      slot: 0,
    });
    const victim = pending.path;
    assert(fs.existsSync(victim));
    await pageAction("history.delete-cancel", {
      confirmationToken: pending.confirmationToken,
    });
    assert(fs.existsSync(victim));
    pending = await pageAction("history.delete-request", {
      generation: page.generation,
      slot: 0,
    });
    await pageAction("history.delete-confirm", {
      confirmationToken: pending.confirmationToken,
    });
    assert.equal(fs.existsSync(victim), false);
    await assert.rejects(
      pageAction("history.delete-confirm", {
        confirmationToken: pending.confirmationToken,
      }),
      /選び直/,
    );
    page = await readyPage(0, 1);
    assert.equal(page.items.length, 2);
    assert.match(page.items[0].title, /image1/);
    settings.intervalSeconds = 7;
    settings.historyPageSize = 2;
    await peer.request("settings.changed", { ...settings });
    page = await readyPage(0, 0);
    assert.equal(page.items.length, 2);
    settings.historyPageSize = 16;
    await peer.request("settings.changed", { ...settings });
    page = await readyPage(0, 0);
    assert.equal(page.items.length, 6);
    const shared = page.items.find((item) => /image3/.test(item.title));
    pending = await pageAction("history.delete-request", {
      generation: page.generation,
      slot: shared.slot,
    });
    await pageAction("history.delete-confirm", {
      confirmationToken: pending.confirmationToken,
    });
    second = await readyPage(1, 0);
    assert.equal(second.total, 0, "deleted path removed from every monitor");
    rejectImages = true;
    page = await readyPage(0, 0);
    assert.equal(
      rejectedRegistrations,
      1,
      "a closed View stops the worker after the first rejected registration",
    );
    assert(page.items.every((item) => item.status === "error"));
    await peer.request("command.execute", {
      id: "at365.wallpaper-slideshow.home",
    });
    assert.equal(detailsOpened, true);
    assert.equal(registered.size, 0);
    assert.equal(
      fs
        .readdirSync(imageDirectory, { recursive: true })
        .filter((name) => name.endsWith(".png")).length,
      0,
    );
    assert.equal(panel.images, null);
    await peer.request("deactivate");
    deactivated = true;
    assert.equal(
      logs.filter((entry) => entry.message.includes("[画像サイズ:")).length,
      1,
      "engine errors use host logging with duplicate suppression",
    );
    assert(
      !logs.some((entry) => entry.message.includes("[Windowsの背景設定]")),
      "obsolete background mutation is not executed",
    );
    assert.equal(
      logs.filter((entry) => entry.message.includes("[AppDock設定の反映]"))
        .length,
      1,
      "settings error has one common log entry",
    );
    assert(
      logs.some((entry) => entry.message.includes("[fixture shutdown]")),
      "cleanup logs flushed before deactivation completes",
    );
    assert(logs.every((entry) => entry.level === "error"));
    child.stdin.end();
    assert.equal(await exited, 0, diagnostics);
    console.log(
      JSON.stringify(
        {
          ok: true,
          checks: [
            "activation / no tray / unified start / command registration",
            "start / stop / toggle / next",
            "playback with invalid image settings",
            "live settings / invalid rollback",
            "independent page / removed previous-next commands / 2-4-16 items / thumbnail URLs and release",
            "delete confirmation / cancel / exact fixture file removed / repeat rejected",
            "engine / command / settings / shutdown errors use common host logging",
            "deactivate / EOF",
          ],
        },
        null,
        2,
      ),
    );
  } finally {
    if (!deactivated && !peer.closed)
      await peer.request("deactivate").catch(() => {});
    child.stdin.end();
    peer.close();
    if (child.exitCode === null) child.kill();
    fs.rmSync(imageDirectory, { recursive: true, force: true });
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
