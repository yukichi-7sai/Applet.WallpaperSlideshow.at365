const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const root = path.resolve(__dirname, ".."),
  host = path.resolve(root, "../AppDock.at365");
const { launch, until } = require(
  path.join(host, "scripts/page-test-host.cjs"),
);
const portable =
  process.argv[2] && !process.argv[2].startsWith("--")
    ? path.resolve(process.argv[2])
    : null;
const longCache = process.argv.includes("--long-cache");
const profile = path.join(
  root,
  ".artifacts",
  "history-page-ui-" +
    (longCache ? "long-cache-" + "x".repeat(32) + "-" : "") +
    Date.now(),
);
const extension = path.join(profile, "extensions/wallpaper");
fs.mkdirSync(extension, { recursive: true });
fs.cpSync(
  path.join(
    root,
    "Applet.WallpaperSlideshow.RegressionTests/bin/Release/net10.0-windows",
  ),
  extension,
  { recursive: true },
);
const publishedAssets = process.argv.includes("--published-assets");
const assets = publishedAssets
  ? path.join(
      require("../../AppDock.at365/scripts/publish-paths.cjs").getPublishDirectory(
        root,
      ),
      "Applet.WallpaperSlideshow.at365/web",
    )
  : path.join(root, "web");
fs.cpSync(assets, path.join(extension, "web"), { recursive: true });
const manifest = JSON.parse(fs.readFileSync(path.join(root, "extension.json")));
manifest.entry = "Applet.WallpaperSlideshow.RegressionTests.exe";
manifest.startupDelaySeconds = 0;
fs.writeFileSync(
  path.join(extension, "extension.json"),
  JSON.stringify(manifest),
);
const settings = require(
  path.join(host, "out/main/shared/settings-schema"),
).createDefaultSettings();
settings.host.hardwareAcceleration = false;
settings.host.closeToTray = false;
settings.host.theme = "light";
settings.globalShortcutCommands = [];
settings.gestures.enabled = false;
settings.updates.checkHostOnStartup = false;
settings.updates.checkAppletsOnStartup = false;
settings.extensions[manifest.id] = {
  enabled: true,
  settings: {
    paused: true,
    thumbnailWidth: 1000,
    thumbnailHeight: 1000,
    historyPageSize: 7,
  },
};
settings.keybindings = [];
settings.keybindings.push({
  id: "retained-history-previous",
  command: manifest.id + ".history.previous",
  key: "Ctrl+Alt+F11",
  enabled: false,
  global: false,
  when: { scope: "owner", appletIds: [] },
});
fs.writeFileSync(path.join(profile, "settings.json"), JSON.stringify(settings));
const checks = [],
  errors = [];
let instance, ui, hostHash;
function observeThumbnails() {
  const probe = (window.thumbnailStability = { phase: "loading", results: {} }),
    nodes = new Map();
  const sample = () => {
    if (!probe.phase) return;
    const result = (probe.results[probe.phase] ??= {
      samples: 0,
      disabledSamples: 0,
      minOpacity: 1,
      changedImages: 0,
    });
    for (const image of document.querySelectorAll(
      ".ad-gallery-image img[src]",
    )) {
      if (image.hidden || !image.complete || !image.naturalWidth) continue;
      const key =
          probe.phase + ":" + image.closest(".ad-gallery-card").dataset.imageId,
        previous = nodes.get(key);
      if (previous && (previous.image !== image || previous.src !== image.src))
        result.changedImages++;
      nodes.set(key, { image, src: image.src });
      let opacity = 1;
      for (let node = image; node; node = node.parentElement)
        opacity *= Number(getComputedStyle(node).opacity);
      result.samples++;
      result.minOpacity = Math.min(result.minOpacity, opacity);
      if (image.closest("button").disabled) result.disabledSamples++;
    }
  };
  new MutationObserver(sample).observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "disabled",
      "src",
      "hidden",
      "class",
      "style",
      "aria-busy",
    ],
  });
  const frame = () => {
    sample();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
const ready = async (count) => {
  await until(
    async () =>
      (await ui.locator(".ad-gallery-card").count()) === count &&
      (await ui.locator("#cards").getAttribute("aria-busy")) === "false",
    "ready cards " + count,
  );
  for (const card of await ui.locator(".ad-gallery-card").all()) {
    await card.scrollIntoViewIfNeeded();
    await until(
      () =>
        card
          .locator("img")
          .evaluate((image) => image.complete && image.naturalWidth > 0),
      "decoded visible image",
    );
  }
  await ui.evaluate(() => window.scrollTo(0, 0));
};
const previewSize = async () => {
  const geometry = await ui.evaluate(() => {
    const dialog = document.querySelector("#preview"),
      bounds = dialog.getBoundingClientRect();
    const stage = document
      .querySelector(".ad-gallery-preview-stage")
      .getBoundingClientRect();
    return {
      width: bounds.width,
      height: bounds.height,
      viewportWidth: innerWidth,
      viewportHeight: innerHeight,
      contained:
        stage.left >= bounds.left &&
        stage.right <= bounds.right &&
        stage.top >= bounds.top &&
        stage.bottom <= bounds.bottom,
      imageReady:
        document.querySelector("#preview-content img").complete &&
        document.querySelector("#preview-content img").naturalWidth > 0,
    };
  });
  assert(
    Math.abs(geometry.width - geometry.viewportWidth * 0.6) <= 1,
    JSON.stringify(geometry),
  );
  assert(
    Math.abs(geometry.height - geometry.viewportHeight * 0.6) <= 1,
    JSON.stringify(geometry),
  );
  assert(geometry.contained);
  await until(
    () =>
      ui
        .locator("#preview-content img")
        .evaluate((image) => image.complete && image.naturalWidth > 0),
    "preview decode",
  );
};
(async () => {
  try {
    instance = await launch(profile, portable, {
      APPDOCK_WALLPAPER_FIXTURE: "1",
    });
    hostHash = instance.hash;
    await instance.app.context().addInitScript(observeThumbnails);
    const main = instance.main;
    instance.app
      .context()
      .on("page", (page) =>
        page.on("pageerror", (error) => errors.push(error.message)),
      );
    await until(
      async () =>
        (await main.evaluate(() => window.dock.snapshot())).extensions.find(
          (e) => e.id === manifest.id,
        )?.state === "running",
      "fixture running",
    );
    const initial = await main.evaluate(() => window.dock.snapshot());
    const applet = initial.extensions.find((e) => e.id === manifest.id);
    assert.equal(applet.panel.images, null);
    assert.equal(applet.panel.tabs, null);
    assert(!applet.panel.actions.some((a) => a.command.endsWith(".history")));
    assert(
      !applet.commands.some((c) => /\.history\.(previous|next)$/.test(c.id)),
    );
    await main.evaluate(
      (id) => window.dock.executeCommand(id + ".history"),
      manifest.id,
    );
    ui = await instance.page("/web/history.html");
    ui.setDefaultTimeout(15000);
    ui.on("pageerror", (error) => errors.push(error.message));
    await ui
      .getByRole("heading", { name: "最近使った壁紙", exact: true })
      .waitFor();
    await ready(7);
    await ui.evaluate(() => {
      window.thumbnailStability.phase = null;
    });
    await instance.save({
      extensionId: manifest.id,
      settings: { historyPageSize: 4 },
    });
    await ready(4);
    if (longCache) {
      const cache = path.join(profile, "data/cache/panel-images", manifest.id);
      const files = fs
        .readdirSync(cache, { recursive: true })
        .filter((file) => file.endsWith(".png"))
        .map((file) => path.join(cache, file));
      assert(
        files.length >= 4 && files.every((file) => file.length > 260),
        "actual decoded PNGs are stored beyond MAX_PATH",
      );
      checks.push(
        "PNG cache paths beyond 260 chars / native stream encoding / real browser decode",
      );
    }
    assert.equal(
      await ui
        .getByRole("button", { name: "前のページ", exact: true })
        .isDisabled(),
      true,
    );
    assert.equal(await ui.locator("#page-number").textContent(), "1 / 2");
    await instance.resize(1320, 920);
    await ui.screenshot({ path: path.join(profile, "history-light.png") });
    const beforeSize = JSON.stringify(
      (await main.evaluate(() => window.dock.snapshot())).settings.value,
    );
    const firstCard = ui.locator(".ad-gallery-card").first();
    await firstCard.evaluate((node) => {
      window.retainedCard = node;
    });
    await ui.getByRole("slider", { name: "画像サイズ" }).press("End");
    await ui.getByRole("slider", { name: "画像サイズ" }).press("ArrowLeft");
    await until(
      async () =>
        (
          await ui.evaluate(() =>
            window.appletPage.call("actions.invoke", {
              id: "history.state",
              input: {},
            }),
          )
        ).gallery.cardWidth === 340,
      "history size persisted",
    );
    assert(await firstCard.evaluate((node) => node === window.retainedCard));
    assert.equal(
      JSON.stringify(
        (await main.evaluate(() => window.dock.snapshot())).settings.value,
      ),
      beforeSize,
      "card size does not change slideshow settings",
    );
    assert(
      !fs.existsSync(path.join(profile, "data/image-gallery-state.json")),
      "host picker/library sizes stay untouched",
    );
    checks.push(
      "shared cards and size control preserve DOM and slideshow settings with independent PC-local size",
    );
    checks.push(
      "independent native page / no history in description / old commands absent / images decoded without panel",
    );
    await ui.getByRole("tab", { name: "モニター2", exact: true }).click();
    await ready(1);
    await ui.getByRole("tab", { name: "モニター1", exact: true }).click();
    await ready(4);
    await ui.getByRole("button", { name: "次のページ", exact: true }).click();
    await ready(3);
    assert.equal(
      await ui
        .getByRole("button", { name: "次のページ", exact: true })
        .isDisabled(),
      true,
    );
    const original = await ui
      .locator(".ad-gallery-card")
      .first()
      .getAttribute("title");
    assert(
      path.basename(path.dirname(original)).startsWith("WallpaperFixture-"),
      "only test images can be deleted",
    );
    await ui
      .getByRole("button", { name: /を拡大$/ })
      .first()
      .click();
    await ui.getByRole("dialog", { name: "壁紙のプレビュー" }).waitFor();
    await previewSize();
    await ui.locator("#preview-content img").click();
    assert.equal(await ui.locator("#preview").isVisible(), true);
    const previewImage = await ui.locator("#preview-content img").boundingBox();
    await ui.mouse.move(
      previewImage.x + previewImage.width / 2,
      previewImage.y + previewImage.height / 2,
    );
    await ui.mouse.down();
    await ui.mouse.move(8, 8);
    await ui.mouse.up();
    assert.equal(
      await ui.locator("#preview").isVisible(),
      true,
      "dragging from the image onto the backdrop does not close",
    );
    await ui.screenshot({ path: path.join(profile, "history-preview.png") });
    await ui.mouse.click(8, 8);
    assert.equal(await ui.locator("#preview").isVisible(), false);
    assert(
      await ui
        .getByRole("button", { name: /を拡大$/ })
        .first()
        .evaluate((button) => button === document.activeElement),
    );
    await ui
      .getByRole("button", { name: /を拡大$/ })
      .first()
      .click();
    await ui.keyboard.press("Escape");
    assert.equal(await ui.locator("#preview").isVisible(), false);
    checks.push(
      "preview 60vw/60vh / image click and drag stay open / backdrop and Esc close / focus restored",
    );
    await ui.evaluate(() => {
      window.thumbnailStability.phase = "open";
    });
    await ui.getByRole("button", { name: "開く", exact: true }).first().click();
    await until(
      () =>
        ui
          .getByRole("button", { name: "開く", exact: true })
          .first()
          .isEnabled(),
      "image open completed",
    );
    const stability = await ui.evaluate(() => {
      window.thumbnailStability.phase = null;
      return window.thumbnailStability.results;
    });
    fs.writeFileSync(
      path.join(profile, "thumbnail-stability.json"),
      JSON.stringify(stability, null, 2),
    );
    for (const phase of ["loading", "open"]) {
      assert(
        stability[phase].samples > 0 && stability[phase].disabledSamples > 0,
        phase + " samples include real in-flight processing",
      );
      assert.equal(
        stability[phase].minOpacity,
        1,
        phase + " keeps decoded thumbnails fully visible",
      );
      assert.equal(
        stability[phase].changedImages,
        0,
        phase + " retains decoded image nodes and URLs",
      );
    }
    checks.push(
      "decoded thumbnails retain opacity, DOM and URLs during progressive loading and real open action",
    );
    await ui.getByRole("button", { name: "削除", exact: true }).first().click();
    await ui.getByRole("dialog", { name: "画像を削除" }).waitFor();
    assert.equal(await ui.locator("#delete-path").textContent(), original);
    await ui.getByRole("button", { name: "キャンセル", exact: true }).click();
    assert(fs.existsSync(original));
    await ui.getByRole("button", { name: "削除", exact: true }).first().click();
    await ui.screenshot({ path: path.join(profile, "history-delete.png") });
    await ui.getByRole("button", { name: "ごみ箱へ移す", exact: true }).click();
    await ready(2);
    assert(!fs.existsSync(original));
    checks.push(
      "monitor positions / page boundaries / preview and Esc / open routed to fake / delete confirmation-cancel-success",
    );
    await instance.save({
      host: { theme: "dark" },
      extensionId: manifest.id,
      settings: { historyPageSize: 2 },
    });
    await until(
      () =>
        ui
          .locator("html")
          .getAttribute("class")
          .then((value) => value?.includes("dark")),
      "dark theme",
    );
    await ready(2);
    await instance.resize(900, 820);
    await ui.screenshot({
      path: path.join(profile, "history-dark-narrow.png"),
    });
    assert(
      await ui
        .locator("main")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
    );
    await ui
      .getByRole("button", { name: /を拡大$/ })
      .first()
      .click();
    await previewSize();
    await ui.screenshot({
      path: path.join(profile, "history-preview-dark.png"),
    });
    await ui.getByRole("button", { name: "閉じる", exact: true }).click();
    assert.equal(await ui.locator("#preview").isVisible(), false);
    const marker = "same-view-" + Date.now();
    await ui.evaluate(
      (value) => (document.querySelector("main").dataset.marker = value),
      marker,
    );
    await instance.save({
      extensionId: manifest.id,
      pages: { history: { display: "window" } },
    });
    await until(
      () => ui.evaluate(() => window.innerWidth >= 900),
      "standalone width",
    );
    assert.equal(await ui.locator("main").getAttribute("data-marker"), marker);
    await instance.save({
      extensionId: manifest.id,
      pages: { history: { display: "page" } },
    });
    await until(
      async () =>
        (await main.evaluate(() => window.dock.snapshot())).navigation.route ===
        "page:" + manifest.id + ":history",
      "return to main page",
    );
    assert.equal(await ui.locator("main").getAttribute("data-marker"), marker);
    checks.push(
      "live settings and theme / real 900px host / same View survives page-window-page",
    );
    // CSS viewport check is emulated, separate from the actual native Window resize above.
    await ui.setViewportSize({ width: 360, height: 780 });
    assert(
      await ui
        .locator("main")
        .evaluate((node) => node.scrollWidth <= node.clientWidth),
    );
    await ui
      .getByRole("button", { name: /を拡大$/ })
      .first()
      .click();
    await previewSize();
    await ui.mouse.click(8, 8);
    assert.equal(await ui.locator("#preview").isVisible(), false);
    const session = await instance.app.context().newCDPSession(ui);
    await session.send("Emulation.clearDeviceMetricsOverride");
    await session.detach();
    await ui
      .getByRole("button", { name: "壁紙の操作に戻る", exact: true })
      .click()
      .catch((error) => {
        if (!ui.isClosed()) throw error;
      });
    await until(() => ui.isClosed(), "history View disposed on home");
    await until(
      async () =>
        (await main.evaluate(() => window.dock.snapshot())).navigation.route ===
        "settings",
      "Applet management route",
    );
    await main
      .getByRole("heading", { name: "Applet管理", exact: true })
      .waitFor();
    assert.equal(
      (await main.evaluate(() => window.dock.snapshot())).navigation.appletId,
      manifest.id,
    );
    await main.evaluate(
      (id) => window.dock.executeCommand(id + ".history"),
      manifest.id,
    );
    ui = await instance.page("/web/history.html");
    await ready(2);
    assert.equal(
      await ui.getByRole("slider", { name: "画像サイズ" }).inputValue(),
      "340",
    );
    assert.equal(await ui.locator("main").getAttribute("data-marker"), null);
    const saved = await main.evaluate(() => window.dock.snapshot());
    assert(
      saved.settings.value.keybindings.some(
        (binding) => binding.id === "retained-history-previous",
      ),
    );
    await require("./settings-mcp-check.cjs")({
      host,
      profile,
      page: main,
      id: manifest.id,
      keys: [
        "paused",
        "intervalSeconds",
        "tileMargin",
        "historyLimit",
        "thumbnailWidth",
        "thumbnailHeight",
        "maxFileNameLength",
        "historyPageSize",
      ],
      changes: {
        tileMargin: 12,
        historyLimit: 25,
        thumbnailWidth: 32,
        thumbnailHeight: 24,
        maxFileNameLength: 24,
        historyPageSize: 2,
      },
      invalid: [
        { thumbnailWidth: 0, tileMargin: 13 },
        { historyPageSize: 1001 },
        { monitors: [] },
      ],
      hidden: ["monitors"],
    });
    await ready(2);
    await until(
      () =>
        ui
          .locator(".ad-gallery-image img")
          .evaluateAll((images) =>
            images.every(
              (image) => image.naturalWidth <= 32 && image.naturalHeight <= 24,
            ),
          ),
      "native thumbnail settings from MCP",
    );
    checks.push(
      "MCP eight settings / invalid and private values rejected / live native thumbnail dimensions",
    );
    await main.evaluate(
      (id) => window.dock.toggleExtension(id, false),
      manifest.id,
    );
    await until(() => ui.isClosed(), "disabled Applet disposes View");
    await main.evaluate(
      (id) => window.dock.toggleExtension(id, true),
      manifest.id,
    );
    await until(
      async () =>
        (await main.evaluate(() => window.dock.snapshot())).extensions.find(
          (e) => e.id === manifest.id,
        )?.state === "running",
      "restarted native Applet",
    );
    await main.evaluate(
      (id) => window.dock.executeCommand(id + ".history"),
      manifest.id,
    );
    ui = await instance.page("/web/history.html");
    await ready(2);
    assert.equal(
      await ui.getByRole("slider", { name: "画像サイズ" }).inputValue(),
      "340",
    );
    await main.evaluate(
      (id) => window.dock.toggleExtension(id, false),
      manifest.id,
    );
    await until(() => ui.isClosed(), "restarted Applet stopped");
    checks.push(
      "card size survives View recreation and native Applet process restart",
    );
    assert.equal(errors.length, 0, errors.join("\n"));
    checks.push(
      "CSS 360px layout / home destroys and recreates View / removed binding preserved / stop disposes page",
    );
    await instance.close();
    instance = undefined;
    fs.writeFileSync(
      path.join(profile, "result.json"),
      JSON.stringify(
        {
          ok: true,
          checks,
          portable: portable || null,
          hostSha256: hostHash,
          publishedAssets,
          errors,
        },
        null,
        2,
      ),
    );
    console.log(JSON.stringify({ ok: true, profile, checks }));
  } catch (error) {
    if (ui && !ui.isClosed())
      await ui
        .screenshot({ path: path.join(profile, "failure.png") })
        .catch(() => {});
    fs.writeFileSync(
      path.join(profile, "result.json"),
      JSON.stringify(
        { ok: false, checks, errors, error: error.stack },
        null,
        2,
      ),
    );
    throw error;
  } finally {
    if (instance) await instance.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
