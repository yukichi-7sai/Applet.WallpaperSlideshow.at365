const assert = require("node:assert/strict");
const { until } = require("../../AppDock.at365/scripts/page-test-host.cjs");
const {
  barPage,
} = require("../../AppDock.at365/scripts/shell-bars-helper.cjs");
const {
  overlayPage,
} = require("../../AppDock.at365/scripts/shell-overlay-helper.cjs");

module.exports = async ({ instance, ui, owner, ready, checks }) => {
  const main = instance.main;
  const title = await barPage(main, "titlebar");
  const back = title.getByRole("button", { name: "戻る", exact: true });
  const forward = title.getByRole("button", { name: "進む", exact: true });
  const command = `appdock.settings.applet.${owner}.open`;
  const route = `page:${owner}:history`;
  const before = (await main.evaluate(() => window.dock.snapshot())).settings
    .value;
  const settings = async () => {
    await until(async () => {
      const state = await main.evaluate(() => window.dock.snapshot());
      return (
        state.navigation.route === "settings" &&
        (await main.evaluate(() => window.dock.settingsEditing())).pageId ===
          `applet:${owner}`
      );
    }, "own settings destination");
  };
  const history = async () => {
    await until(
      async () =>
        (await main.evaluate(() => window.dock.snapshot())).navigation.route ===
        route,
      "one Back returns directly to wallpaper history",
    );
    assert.equal(ui.isClosed(), false);
    await ready();
  };
  const released = async () => {
    assert.equal(ui.isClosed(), false);
    await until(
      () =>
        ui.evaluate(
          async () =>
            !(await window.appletPage.snapshot()).visible &&
            window.historyLiveUrls.size === 0 &&
            document.querySelectorAll(".ad-gallery-card").length === 0 &&
            (await window.appletPage.call("storage.get", {
              key: "history-snapshot",
              scope: "memory",
            })) == null,
        ),
      "hidden history releases images and snapshot lease",
    );
  };
  for (const entry of ["button", "palette"]) {
    if (entry === "palette") {
      await back.click();
      await history();
      await title.locator(".titlebar-search").click();
      const palette = await overlayPage(main);
      await palette.getByRole("combobox").fill(command);
      await palette
        .locator(`[data-command-id="${command}"] .palette-command-text`)
        .click();
    } else {
      await ui.getByRole("button", { name: "設定を開く", exact: true }).click();
    }
    await settings();
    await back.click();
    await history();
    await forward.click();
    await settings();
    await released();
    assert.deepEqual(
      (await main.evaluate(() => window.dock.snapshot())).settings.value,
      before,
    );
    checks.push(
      `${entry}: own settings / one Back and Forward / retained View / hidden images and lease released / settings unchanged`,
    );
  }
};
