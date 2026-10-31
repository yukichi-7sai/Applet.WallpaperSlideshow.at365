const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const moduleAt = async (file) =>
  import(
    "data:text/javascript;base64," +
      fs.readFileSync(path.join(__dirname, "../web", file)).toString("base64")
  );

test("history card size retains explicit save, retry, device scope and corrupt-data protection", async () => {
  const { HistoryPreferences } = await moduleAt("history-preferences.js");
  let saved = null,
    fail = false;
  const calls = [];
  const preferences = new HistoryPreferences(async (operation, input) => {
    calls.push({ operation, input });
    assert.equal(input.scope, "device");
    assert.equal(input.key, "gallery-view");
    if (operation === "storage.get") return saved;
    if (fail) throw Error("disk unavailable");
    saved = input.value;
  });
  assert.deepEqual(await preferences.read(), { cardWidth: 260, error: "" });
  assert.equal(saved, null);
  await preferences.save(340);
  assert.deepEqual(saved, { schemaVersion: 1, cardWidth: 340 });
  fail = true;
  await assert.rejects(preferences.save(320), /保存できません/);
  assert.equal(preferences.width, 340);
  assert.equal(saved.cardWidth, 340);
  fail = false;
  await preferences.save(320);
  assert.equal(preferences.error, "");
  for (const value of [0, 181, 380, NaN])
    await assert.rejects(preferences.save(value));
  for (const data of [
    { schemaVersion: 99, cardWidth: 260 },
    { schemaVersion: 1, cardWidth: -1 },
    "bad",
  ]) {
    let writes = 0;
    const corrupt = new HistoryPreferences(async (operation) => {
      if (operation === "storage.set") writes++;
      return data;
    });
    assert.match((await corrupt.read()).error, /読み取れません/);
    await assert.rejects(corrupt.save(260));
    assert.equal(writes, 0);
  }
});
test("closing history rejects pending sources and never recreates a released image", async () => {
  const { MemoryImages } = await moduleAt("memory-images.js");
  let complete,
    visible = true;
  const released = [];
  const images = new MemoryImages(
    async (operation, input) => {
      if (operation === "sourceImages.register")
        return new Promise((resolve) => (complete = resolve));
      released.push(...input.ids);
    },
    () => visible,
    () => assert.fail("closed requester was updated"),
  );
  const pending = images.source({
    path: "original.png",
    storageKey: "paths",
    pointer: "/0",
  });
  visible = false;
  images.clear();
  complete({ id: "old-source" });
  await assert.rejects(pending, /Page closed/);
  assert.equal(images.entries.size, 0);
  assert.equal(images.sources.size, 0);
  assert(released.includes("old-source"));
});
test("an image decode finishing after history closes releases its bitmap without creating a URL", async (t) => {
  const { MemoryImages } = await moduleAt("memory-images.js");
  const originalFetch = globalThis.fetch,
    originalDecode = globalThis.createImageBitmap;
  t.after(() => {
    globalThis.fetch = originalFetch;
    globalThis.createImageBitmap = originalDecode;
  });
  let finish,
    started,
    visible = true,
    closed = 0;
  const decoding = new Promise((resolve) => (started = resolve));
  globalThis.fetch = async () => ({
    ok: true,
    blob: async () => new Blob(["image"]),
  });
  globalThis.createImageBitmap = () => {
    started();
    return new Promise((resolve) => (finish = resolve));
  };
  const images = new MemoryImages(
    async (operation) =>
      operation === "sourceImages.register"
        ? { id: "one", url: "appdock://source-images/one" }
        : undefined,
    () => visible,
    () => assert.fail("closed image was retained"),
  );
  const pending = images.image(
    { path: "one.png", storageKey: "paths", pointer: "/0" },
    480,
    360,
  );
  await decoding;
  visible = false;
  images.clear();
  finish({ width: 2, height: 2, close: () => closed++ });
  await assert.rejects(pending, /Page closed/);
  assert.equal(closed, 1);
  assert.equal(images.entries.size, 0);
});

test("duplicate history entries share their pixels while each retains image information", async (t) => {
  const { MemoryImages } = await moduleAt("memory-images.js");
  const original = {
    fetch: globalThis.fetch,
    decode: globalThis.createImageBitmap,
    document: globalThis.document,
  };
  t.after(() => {
    globalThis.fetch = original.fetch;
    globalThis.createImageBitmap = original.decode;
    globalThis.document = original.document;
  });
  let decoded = 0;
  globalThis.fetch = async () => ({
    ok: true,
    blob: async () => new Blob(["original"]),
  });
  globalThis.createImageBitmap = async () => {
    decoded++;
    return { width: 80, height: 60, close() {} };
  };
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({ drawImage() {} }),
      toBlob: (callback) => callback(new Blob(["thumbnail"])),
    }),
  };
  const images = new MemoryImages(
    async (operation) =>
      operation === "sourceImages.register"
        ? { id: "one", url: "appdock://source-images/one" }
        : undefined,
    () => true,
    () => {},
  );
  const first = { path: "same.png", storageKey: "paths", pointer: "/0" },
    second = { ...first, pointer: "/1" };
  const [a, b] = await Promise.all([
    images.image(first, 32, 24),
    images.image(second, 32, 24),
  ]);
  assert.equal(a, b);
  assert.equal(decoded, 1);
  assert.equal(first.resolution, "80×60");
  assert.equal(second.resolution, "80×60");
  assert.equal(first.sizeText, second.sizeText);
  images.clear();
});
