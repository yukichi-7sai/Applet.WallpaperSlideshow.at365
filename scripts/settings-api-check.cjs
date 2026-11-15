const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
// Isolated common API caller; no user configuration, MCP registration or external service.
const caller = "test.wallpaper-settings-api";
const files = (profile) => ({
  request: path.join(profile, "settings-api-request.json"),
  answer: path.join(profile, "settings-api-answer.json"),
});

module.exports = async function checkSettings({
  host,
  profile,
  page,
  id,
  keys,
  changes,
  invalid,
  hidden,
  switches = [],
}) {
  const exchange = files(profile);
  const { until } = require(path.join(host, "scripts/page-test-host.cjs"));
  await until(
    async () =>
      (await page.evaluate(() => window.dock.snapshot())).extensions.find(
        (item) => item.id === caller,
      )?.state === "running",
    "shared API caller running",
  );
  const request = async (method, params = {}) => {
    fs.writeFileSync(exchange.request, JSON.stringify({ method, params }));
    if (fs.existsSync(exchange.answer)) fs.unlinkSync(exchange.answer);
    await page.evaluate(
      (command) => window.dock.executeCommand(command),
      caller + ".call",
    );
    return JSON.parse(fs.readFileSync(exchange.answer));
  };
  const call = async (method, params) => {
    const reply = await request(method, params);
    assert.equal(reply.ok, true, JSON.stringify(reply));
    return reply.value;
  };
  const get = () => call("settings.get", { appletId: id });
  const before = await get();
  assert.deepEqual(Object.keys(before.values).sort(), [...keys].sort());
  const schema = await call("settings.getSchema", { appletId: id });
  assert.deepEqual(Object.keys(schema.fields).sort(), [...keys].sort());
  const catalog = (await call("commands.list")).commands.filter(
    (command) => command.appletId === id,
  );
  const update = catalog.find(
    (command) => command.id === id + ".settings.update",
  );
  assert(update?.available);
  assert.deepEqual(
    Object.keys(update.inputSchema.properties.changes.properties).sort(),
    [...keys].sort(),
  );
  for (const key of hidden)
    assert(!JSON.stringify(catalog).includes('"' + key + '"'));
  const run = (args) => call("commands.execute", { id: update.id, args });
  assert.equal(
    (await run({ changes, expectedRevision: before.revision, dryRun: true }))
      .completion,
    "validated",
  );
  assert.deepEqual(await get(), before, "dryRun changed state");
  for (const bad of invalid) {
    assert.equal(
      (
        await request("commands.execute", {
          id: update.id,
          args: { changes: bad, expectedRevision: before.revision },
        })
      ).ok,
      false,
    );
    assert.deepEqual(await get(), before, "invalid patch changed state");
  }
  assert.equal(
    (await run({ changes, expectedRevision: before.revision })).completion,
    "settingsSaved",
  );
  const after = await get();
  for (const [key, value] of Object.entries(changes))
    assert.deepEqual(after.values[key], value);
  assert.notEqual(after.revision, before.revision);
  assert.equal(
    (
      await request("commands.execute", {
        id: update.id,
        args: { changes: before.values, expectedRevision: before.revision },
      })
    ).ok,
    false,
  );
  assert.deepEqual(await get(), after);
  for (const key of switches) {
    for (const [action, expected] of [
      ["off", false],
      ["on", true],
      ["toggle", false],
    ]) {
      const command = id + ".settings." + key + "." + action;
      assert(catalog.some((entry) => entry.id === command));
      if (key === "slideshowEnabled")
        assert.equal(
          catalog.find((entry) => entry.id === command).title,
          "壁紙のスライドショーを" +
            { on: "ONにする", off: "OFFにする", toggle: "切り替える" }[action],
        );
      await call("commands.execute", { id: command });
      assert.equal((await get()).values[key], expected);
    }
  }
  const { readLogs } = require(path.join(host, "scripts/test-logs.cjs"));
  await until(
    () =>
      readLogs(profile).some(
        (row) =>
          row.audit?.operation?.name === "commands.execute" &&
          JSON.stringify(row.audit).includes(update.id),
      ),
    "settings command audit log is persisted",
  );
  return get();
};

module.exports.prepare = ({ profile, settings }) => {
  const exchange = files(profile),
    folder = path.join(profile, "extensions", caller);
  fs.mkdirSync(folder, { recursive: true });
  fs.writeFileSync(
    path.join(folder, "extension.json"),
    JSON.stringify({
      apiVersion: 1,
      id: caller,
      name: "Settings API fixture",
      version: "1.0.0",
      runtime: "node",
      entry: "index.cjs",
      capabilities: ["appdock-api"],
      commands: [{ id: caller + ".call", title: "Call shared settings API" }],
    }),
  );
  fs.writeFileSync(
    path.join(folder, "index.cjs"),
    `const fs = require('node:fs');
exports.activate = async context => context.commands.register('${caller}.call', 'Call shared settings API', async () => {
  const request = JSON.parse(fs.readFileSync(${JSON.stringify(exchange.request)}, 'utf8'));
  let answer;
  try { answer = {ok:true,value:await context.appdock.call(request.method, request.params)}; }
  catch (error) { answer = {ok:false,code:error.code,message:error.message}; }
  fs.writeFileSync(${JSON.stringify(exchange.answer)}, JSON.stringify(answer));
});`,
  );
  settings.extensions[caller] = { enabled: true, settings: {} };
};
