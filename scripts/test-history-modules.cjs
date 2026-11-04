const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const moduleAt = async (file) =>
  import(
    "data:text/javascript;base64," +
      fs.readFileSync(path.join(__dirname, "../web", file)).toString("base64")
  );

test("preview visits the whole monitor history without wrapping or merging repeated paths", async () => {
  const { HistoryNavigation, historyEntries } = await moduleAt(
    "history-navigation.js",
  );
  const snapshot = {
    monitors: [{ entries: ["a", "b", "a"].map((path) => ({ path })) }],
  };
  const items = historyEntries(snapshot, 0);
  assert.notEqual(items[0].id, items[2].id);
  const navigation = new HistoryNavigation();
  assert.equal(navigation.open(0, items, "absent"), false);
  assert.equal(navigation.open(0, items, items[0].id), true);
  assert.equal(navigation.move(-1), false);
  assert.equal(navigation.move(1), true);
  assert.equal(navigation.move(1), true);
  assert.equal(navigation.current.id, items[2].id);
  assert.equal(navigation.move(1), false);
  const selected = navigation.close();
  assert.equal(selected.id, items[2].id);
  assert.equal(navigation.selected, selected);
  assert.equal(navigation.move(-1), false);
});

test("preview keeps its opened order and selection follows surviving entries after refresh", async () => {
  const { HistoryNavigation, historyEntries } = await moduleAt(
    "history-navigation.js",
  );
  const snapshot = {
    monitors: [{ entries: ["a", "b"].map((path) => ({ path })) }],
  };
  const items = historyEntries(snapshot, 0);
  const navigation = new HistoryNavigation();
  navigation.open(0, items, items[0].id);
  items.reverse();
  navigation.move(1);
  assert.equal(navigation.current.path, "b");
  navigation.close();
  snapshot.monitors[0].entries.unshift({ path: "new" });
  navigation.reconcile(snapshot);
  assert.equal(navigation.selected.index, 2);
  snapshot.monitors[0].entries.pop();
  navigation.reconcile(snapshot);
  assert.equal(
    navigation.selected,
    null,
    "a removed image must not select an unseen replacement",
  );
});

test("failed images remain navigable and a one-image monitor has no neighbours", async () => {
  const { HistoryNavigation, historyEntries } = await moduleAt(
    "history-navigation.js",
  );
  const snapshot = {
    monitors: [
      { entries: [{ path: "a" }, { path: "missing" }] },
      { entries: [{ path: "a" }] },
    ],
  };
  const navigation = new HistoryNavigation();
  const items = historyEntries(snapshot, 0);
  items[1].status = "error";
  navigation.open(0, items, items[1].id);
  assert.equal(navigation.move(-1), true);
  const one = historyEntries(snapshot, 1);
  navigation.open(1, one, one[0].id);
  assert.equal(navigation.canMove(-1), false);
  assert.equal(navigation.canMove(1), false);
  assert.notEqual(navigation.selected.id, items[0].id);
});

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
  assert.deepEqual(await preferences.read(), {
    cardWidth: 260,
    autoRefresh: false,
    error: "",
  });
  assert.equal(saved, null);
  await preferences.save(340);
  assert.deepEqual(saved, {
    schemaVersion: 1,
    cardWidth: 340,
    autoRefresh: false,
  });
  fail = true;
  await assert.rejects(preferences.save(320), /保存できません/);
  assert.equal(preferences.width, 340);
  assert.equal(saved.cardWidth, 340);
  fail = false;
  await preferences.save(320);
  assert.equal(preferences.error, "");
  await preferences.save(320, true);
  assert.equal(saved.autoRefresh, true);
  const restored = new HistoryPreferences(async () => saved);
  assert.deepEqual(await restored.read(), {
    cardWidth: 320,
    autoRefresh: true,
    error: "",
  });
  const legacy = new HistoryPreferences(async () => ({
    schemaVersion: 1,
    cardWidth: 300,
  }));
  assert.deepEqual(await legacy.read(), {
    cardWidth: 300,
    autoRefresh: false,
    error: "",
  });
  for (const value of [0, 181, 380, NaN])
    await assert.rejects(preferences.save(value));
  for (const data of [
    { schemaVersion: 99, cardWidth: 260 },
    { schemaVersion: 1, cardWidth: -1 },
    { schemaVersion: 1, cardWidth: 260, autoRefresh: "true" },
    { schemaVersion: 1, cardWidth: 260, extra: 1 },
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

function snapshotStorage() {
  const values = new Map(),
    calls = [];
  let serial = 0;
  const fixture = {
    values,
    calls,
    get index() {
      return values.get("history");
    },
    publish(monitors) {
      const generation = (++serial).toString(16).padStart(32, "0");
      const index = {
        generation,
        monitors: monitors.map((paths, monitor) => {
          const key = `history-${generation}-${monitor}`;
          values.set(key, [...paths]);
          return { count: paths.length, chunks: [key] };
        }),
      };
      values.set("history", index);
      const pinned = new Set(values.get("history-snapshot")?.generations ?? []);
      pinned.add(generation);
      for (const key of values.keys()) {
        const match = /^history-([a-f0-9]{32})-/.exec(key);
        if (match && !pinned.has(match[1])) values.delete(key);
      }
      return index;
    },
    async call(operation, input) {
      calls.push([operation, input]);
      assert.equal(input.scope, "memory");
      if (operation === "storage.get")
        return structuredClone(values.get(input.key) ?? null);
      assert.equal(operation, "storage.set");
      assert.equal(input.key, "history-snapshot");
      if (fixture.failBefore) {
        fixture.failBefore = false;
        throw Error("lease rejected");
      }
      if (input.value == null) values.delete(input.key);
      else values.set(input.key, structuredClone(input.value));
      if (fixture.afterLease) {
        const callback = fixture.afterLease;
        fixture.afterLease = null;
        callback();
      }
      if (fixture.failAfter) {
        fixture.failAfter = false;
        throw Error("lease receipt lost");
      }
      return null;
    },
  };
  fixture.call = fixture.call.bind(fixture);
  return fixture;
}

test("manual history keeps every page readable across publications, removes explicit targets, and releases its generation", async () => {
  const { HistorySnapshot } = await moduleAt("history-snapshot.js");
  const storage = snapshotStorage();
  const original = storage.publish([["A.png", "B.png", "A.png"], ["A.png"]]);
  const view = new HistorySnapshot(storage.call);
  await view.capture(original, () => true);
  storage.publish([["C.png"]]);
  assert.equal(view.current.generation, original.generation);
  const latePage = view.current.monitors[0].entries[1];
  assert.equal(
    storage.values.get(latePage.storageKey)[Number(latePage.pointer.slice(1))],
    "B.png",
  );
  view.remove("a.png");
  assert.deepEqual(
    view.current.monitors.map((m) => m.count),
    [1, 0],
  );
  assert.equal(storage.values.get(original.monitors[0].chunks[0]).length, 3);
  await view.capture(storage.index, () => true);
  assert.equal(view.current.monitors[0].entries[0].path, "C.png");
  await view.pendingLease;
  storage.publish([["D.png"]]);
  assert(!storage.values.has(original.monitors[0].chunks[0]));
  const held = view.current.monitors[0].entries[0].storageKey;
  view.close();
  await view.pendingLease;
  storage.publish([["E.png"]]);
  assert(!storage.values.has(held));
  assert.equal(view.current, null);
});

test("a rejected or uncertain refresh keeps the previously displayed generation readable", async () => {
  const { HistorySnapshot } = await moduleAt("history-snapshot.js");
  for (const failure of ["failBefore", "failAfter"]) {
    const storage = snapshotStorage();
    const original = storage.publish([["original.png"]]);
    const view = new HistorySnapshot(storage.call);
    await view.capture(original, () => true);
    await view.pendingLease;
    storage.publish([["replacement.png"]]);
    storage[failure] = true;
    await assert.rejects(view.capture(storage.index, () => true));
    storage.publish([["newest.png"]]);
    assert.equal(view.current.generation, original.generation);
    assert(storage.values.has(original.monitors[0].chunks[0]));
    view.close();
    await view.pendingLease;
  }
});

test("a publication racing snapshot acquisition never mixes history generations", async () => {
  const { HistorySnapshot } = await moduleAt("history-snapshot.js");
  const storage = snapshotStorage();
  const original = storage.publish([["old.png"]]);
  storage.afterLease = () => storage.publish([["new.png", "next.png"]]);
  const view = new HistorySnapshot(storage.call);
  await view.capture(original, () => true);
  assert.equal(view.current.generation, storage.index.generation);
  assert.deepEqual(
    view.current.monitors[0].entries.map((entry) => entry.path),
    ["new.png", "next.png"],
  );
  view.close();
  await view.pendingLease;
});

test("closing history during a metadata read cannot publish a late snapshot or restore its lease", async () => {
  const { HistorySnapshot } = await moduleAt("history-snapshot.js");
  const storage = snapshotStorage();
  const index = storage.publish([["late.png"]]);
  let entered,
    finish,
    visible = true;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  const view = new HistorySnapshot((operation, input) => {
    if (
      operation === "storage.get" &&
      input.key === index.monitors[0].chunks[0]
    ) {
      entered();
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return storage.call(operation, input);
  });
  const pending = view.capture(index, () => visible);
  await started;
  visible = false;
  view.close();
  finish(["late.png"]);
  await assert.rejects(pending, { name: "AbortError" });
  await view.pendingLease;
  assert.equal(view.current, null);
  assert(!storage.values.has("history-snapshot"));
});

test("toggling automatic refresh before preferences load preserves the saved card size", async () => {
  const { HistoryPreferences } = await moduleAt("history-preferences.js");
  let saved = { schemaVersion: 1, cardWidth: 340 };
  const preferences = new HistoryPreferences(async (operation, input) => {
    assert.equal(input.scope, "device");
    if (operation === "storage.get") return saved;
    saved = input.value;
  });
  await preferences.save(undefined, true);
  assert.deepEqual(saved, {
    schemaVersion: 1,
    cardWidth: 340,
    autoRefresh: true,
  });
  await assert.rejects(preferences.save(340, null));
});

test("initial preference reads are shared when a toggle is saved during loading", async () => {
  const { HistoryPreferences } = await moduleAt("history-preferences.js");
  let release,
    reads = 0,
    saved;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  const preferences = new HistoryPreferences(async (operation, input) => {
    if (operation === "storage.get") {
      reads++;
      await barrier;
      return { schemaVersion: 1, cardWidth: 340 };
    }
    saved = input.value;
  });
  const read = preferences.read();
  const save = preferences.save(undefined, true);
  release();
  await Promise.all([read, save]);
  assert.equal(reads, 1);
  assert.deepEqual(saved, {
    schemaVersion: 1,
    cardWidth: 340,
    autoRefresh: true,
  });
});

test("turning automatic refresh off during a read keeps the displayed snapshot and its grants", async () => {
  const { HistorySnapshot } = await moduleAt("history-snapshot.js");
  const storage = snapshotStorage();
  const original = storage.publish([["visible.png"]]);
  let valid = true,
    entered,
    finish;
  const started = new Promise((resolve) => {
    entered = resolve;
  });
  let blockedKey;
  const view = new HistorySnapshot((operation, input) => {
    if (operation === "storage.get" && input.key === blockedKey) {
      entered();
      return new Promise((resolve) => {
        finish = resolve;
      });
    }
    return storage.call(operation, input);
  });
  await view.capture(original, () => true);
  const newer = storage.publish([["background.png"]]);
  blockedKey = newer.monitors[0].chunks[0];
  const pending = view.capture(newer, () => valid);
  await started;
  valid = false;
  finish(["background.png"]);
  await assert.rejects(pending, { name: "AbortError" });
  await view.pendingLease;
  storage.publish([["newest.png"]]);
  assert.equal(view.current.generation, original.generation);
  assert(storage.values.has(original.monitors[0].chunks[0]));
  view.close();
  await view.pendingLease;
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
