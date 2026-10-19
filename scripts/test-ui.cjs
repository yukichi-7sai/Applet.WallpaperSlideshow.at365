// Keep GUI suites serial: source builds and native Views share the same host output.
const { spawnSync } = require('node:child_process');
const path = require('node:path');
for (const script of ['test-monitor-list-ui.cjs', 'test-history-page-ui.cjs']) {
  const result = spawnSync(process.execPath, [path.join(__dirname, script), ...process.argv.slice(2)], { stdio: 'inherit', windowsHide: true });
  if (result.error) throw result.error;
  if (result.status !== 0) { process.exitCode = result.status || 1; break; }
}
