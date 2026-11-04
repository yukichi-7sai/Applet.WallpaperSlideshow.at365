const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async function checkNavigation({
  instance,
  ui,
  ready,
  until,
  profile,
  id,
  checks,
}) {
  const cards = ui.locator(".ad-gallery-card");
  const selected = ui.locator('.ad-gallery-card[aria-current="true"]');
  const preview = ui.locator("#preview");
  const title = ui.locator("#preview-title");
  const source = ui.locator("#preview-content img");
  const position = (value) =>
    until(
      () =>
        ui
          .locator("#preview-position")
          .textContent()
          .then((text) => text === value),
      value,
    );
  const decoded = () =>
    until(
      () =>
        source.evaluate(
          (image) =>
            image.complete &&
            image.naturalWidth > 0 &&
            image.hasAttribute("src"),
        ),
      "preview image decoded",
    );
  const selection = (file) =>
    until(
      async () =>
        (await selected.count()) === 1 &&
        (await selected.getAttribute("title")) === file,
      "last viewed card stays selected",
    );
  const closed = () =>
    until(() => preview.isVisible().then((value) => !value), "preview closed");
  const selectedInView = () =>
    until(
      () =>
        selected.evaluate((card) => {
          const bounds = card.getBoundingClientRect();
          return bounds.top >= -1 && bounds.bottom <= innerHeight + 1;
        }),
      "selected card stays within the viewport",
    );
  await instance.save({
    host: { overlayBackground: "translucent" },
    extensionId: id,
    settings: { historyPageSize: 3 },
  });
  await ready(3);
  const firstPath = await cards.first().getAttribute("title");
  const folder = path.dirname(firstPath);
  assert(path.basename(folder).startsWith("WallpaperFixture-"));
  const file = (number) => path.join(folder, `image${number}.png`);
  await cards.nth(2).locator("h3").click();
  await selection(file(4));
  await ui.getByRole("checkbox", { name: "自動更新", exact: true }).focus();
  await selection(file(4));
  assert(
    await selected.evaluate((card) => !card.contains(document.activeElement)),
    "selection survives focus leaving the card",
  );
  await ui.screenshot({
    path: path.join(profile, "history-card-selected.png"),
  });
  await cards
    .nth(2)
    .getByRole("button", { name: /を拡大$/ })
    .click();
  await position("3 / 7");
  await decoded();

  // Hold one real decode to verify that a later navigation wins over stale replies.
  await ui.evaluate(() => {
    const original = Image.prototype.decode;
    window.restorePreviewDecode = () => {
      Image.prototype.decode = original;
    };
    let hold = true;
    Image.prototype.decode = async function () {
      await original.call(this);
      if (hold) {
        hold = false;
        await new Promise((resolve) => {
          window.releasePreviewDecode = resolve;
        });
      }
    };
  });
  try {
    await ui.keyboard.press("ArrowRight");
    await position("4 / 7");
    await until(
      () =>
        ui.evaluate(() => typeof window.releasePreviewDecode === "function"),
      "delayed preview decode",
    );
    await ui.keyboard.press("ArrowRight");
    await position("5 / 7");
    await decoded();
    const current = await source.getAttribute("src");
    await ui.evaluate(async () => {
      window.releasePreviewDecode();
      await new Promise((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(resolve)),
      );
    });
    assert.equal(await title.textContent(), "image2.png");
    assert.equal(await source.getAttribute("src"), current);
  } finally {
    await ui.evaluate(() => {
      window.releasePreviewDecode?.();
      window.restorePreviewDecode?.();
    });
  }
  await ui.screenshot({
    path: path.join(profile, "history-preview-navigation.png"),
  });
  await selection(file(2));
  assert.equal(await ui.locator("#page-number").textContent(), "2 / 3");
  await selectedInView();
  assert(
    await preview.evaluate((dialog) => dialog.contains(document.activeElement)),
    "following the background list must not take focus from the preview",
  );
  await ui.mouse.click(8, 8);
  await closed();
  await ready(3);
  await selection(file(2));
  assert.equal(await ui.locator("#page-number").textContent(), "2 / 3");
  await until(
    () => selected.evaluate((card) => card.contains(document.activeElement)),
    "last viewed card receives keyboard focus",
  );
  await ui.getByRole("checkbox", { name: "自動更新", exact: true }).focus();
  await selection(file(2));
  await selected.getByRole("button", { name: /を拡大$/ }).click();
  await ui.keyboard.press("ArrowRight");
  await ui.keyboard.press("ArrowRight");
  await position("7 / 7");
  await decoded();
  await ui.keyboard.press("ArrowRight");
  await position("7 / 7");
  assert.equal(
    await preview
      .getByRole("button", { name: "次の画像", includeHidden: true })
      .isDisabled(),
    true,
  );
  for (let i = 0; i < 6; i++) await ui.keyboard.press("ArrowLeft");
  await position("1 / 7");
  await ui.keyboard.press("ArrowLeft");
  await position("1 / 7");
  assert.equal(
    await preview
      .getByRole("button", { name: "前の画像", includeHidden: true })
      .isDisabled(),
    true,
  );
  await preview.getByRole("button", { name: "次の画像", exact: true }).click();
  await position("2 / 7");
  await decoded();
  const imageBounds = await source.boundingBox();
  const nextBounds = await preview
    .getByRole("button", { name: "次の画像", exact: true })
    .boundingBox();
  await ui.mouse.move(
    imageBounds.x + imageBounds.width / 2,
    imageBounds.y + imageBounds.height / 2,
  );
  await ui.mouse.down();
  await ui.mouse.move(
    nextBounds.x + nextBounds.width / 2,
    nextBounds.y + nextBounds.height / 2,
  );
  await ui.mouse.up();
  await position("2 / 7");
  assert.equal(
    await preview.isVisible(),
    true,
    "dragging onto a navigation edge does not navigate or close",
  );
  await preview.getByRole("button", { name: "前の画像", exact: true }).click();
  await position("1 / 7");
  await ui.keyboard.press("Escape");
  await closed();
  await ready(3);
  await selection(file(6));
  assert.equal(await ui.locator("#page-number").textContent(), "1 / 3");
  checks.push(
    "preview keyboard and edge navigation crosses pages, stops at endpoints, rejects stale decode and retains last-viewed selection after backdrop/Escape",
  );

  await cards
    .first()
    .getByRole("button", { name: /を拡大$/ })
    .click();
  for (let i = 0; i < 4; i++) await ui.keyboard.press("ArrowRight");
  await position("5 / 7");
  await instance.save({ extensionId: id, settings: { historyPageSize: 2 } });
  await position("5 / 7");
  await preview.getByRole("button", { name: "閉じる", exact: true }).click();
  await closed();
  await ready(2);
  await selection(file(2));
  assert.equal(await ui.locator("#page-number").textContent(), "3 / 4");
  await until(
    () => selected.evaluate((card) => card.contains(document.activeElement)),
    "close button restores last-viewed focus after page-size change",
  );

  const missing = file(0),
    moved = missing + ".preview-test";
  fs.renameSync(missing, moved);
  try {
    await selected.getByRole("button", { name: /を拡大$/ }).click();
    await ui.keyboard.press("ArrowRight");
    await ui.keyboard.press("ArrowRight");
    await position("7 / 7");
    await until(
      () =>
        preview
          .locator(".ad-gallery-preview-status")
          .textContent()
          .then((text) => text === "画像を読み込めません"),
      "missing original does not show stale pixels",
    );
    assert.equal(await source.getAttribute("src"), null);
    await ui.keyboard.press("ArrowLeft");
    await position("6 / 7");
    await decoded();
    await ui.keyboard.press("Escape");
    await closed();
    await ready(2);
    await selection(file(1));
  } finally {
    fs.renameSync(moved, missing);
  }
  await ui.getByRole("tab", { name: "モニター2", exact: true }).click();
  await ready(1);
  await cards
    .first()
    .getByRole("button", { name: /を拡大$/ })
    .click();
  await position("1 / 1");
  await ui.keyboard.press("ArrowLeft");
  await ui.keyboard.press("ArrowRight");
  await position("1 / 1");
  await ui.keyboard.press("Escape");
  await closed();
  await selection(file(3));
  checks.push(
    "preview returns to the selected card after deferred page-size changes; missing images keep navigation; one-image monitor stays isolated",
  );
  await instance.save({
    host: { overlayBackground: "transparent" },
    extensionId: id,
    settings: { historyPageSize: 7 },
  });
  await ui.getByRole("tab", { name: "モニター1", exact: true }).click();
  await ready(7);

  await instance.resize(900, 920);
  await until(
    () =>
      cards
        .last()
        .evaluate((card) => card.getBoundingClientRect().bottom > innerHeight),
    "narrow history list extends below the viewport",
  );
  const partial = cards.nth(4);
  await partial.locator("h3").evaluate((label) => {
    window.scrollBy(0, label.getBoundingClientRect().bottom - innerHeight + 16);
  });
  assert(
    await partial.evaluate(
      (card) => card.getBoundingClientRect().bottom > innerHeight,
    ),
  );
  await partial.locator("h3").click();
  await selection(file(2));
  await selectedInView();
  await cards
    .first()
    .getByRole("button", { name: /を拡大$/ })
    .click();
  await position("1 / 7");
  await selectedInView();
  const firstScroll = await ui.evaluate(() => scrollY);
  for (let i = 0; i < 6; i++) await ui.keyboard.press("ArrowRight");
  await position("7 / 7");
  await selection(file(0));
  await selectedInView();
  assert((await ui.evaluate(() => scrollY)) > firstScroll);
  await ui.keyboard.press("ArrowLeft");
  await position("6 / 7");
  await selectedInView();
  await ui.keyboard.press("Escape");
  await closed();
  await selection(file(1));
  await selectedInView();
  await ui.screenshot({
    path: path.join(profile, "history-selection-scroll.png"),
  });
  await ui.evaluate(async () => {
    window.scrollTo(0, 0);
    await new Promise((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(resolve)),
    );
  });
  assert.equal(
    await ui.evaluate(() => scrollY),
    0,
    "manual scrolling stays free until selection changes",
  );
  await selection(file(1));
  await instance.resize(1320, 920);
  checks.push(
    "selection reveals partially visible cards and follows preview navigation within/across pages without stealing dialog focus or undoing manual scrolling",
  );
};
