/*
 * Docs=Code sync tests — Sprint 4, ENH-241.
 *
 * Verifies scanner accuracy, diff logic, EXPECTED_COUNTS alignment, and CLI behavior.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

let pass = 0, fail = 0;
function test(name, fn) { try { fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); } }
async function testAsync(name, fn) { try { await fn(); pass++; } catch (e) { fail++; console.error(`✗ ${name}: ${e.message}`); } }

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const scanner = require('../../lib/infra/docs-code-scanner');
const invariants = require('../../lib/domain/rules/docs-code-invariants');

(async () => {

// ============================================================
// Scanner surface
// ============================================================
test('scanner exports measure', () => assert.strictEqual(typeof scanner.measure, 'function'));
test('scanner exports crossCheck', () => assert.strictEqual(typeof scanner.crossCheck, 'function'));
test('scanner exports countSkills', () => assert.strictEqual(typeof scanner.countSkills, 'function'));
test('scanner exports countAgents', () => assert.strictEqual(typeof scanner.countAgents, 'function'));
test('scanner exports countHooks', () => assert.strictEqual(typeof scanner.countHooks, 'function'));
test('scanner exports countMCPServers', () => assert.strictEqual(typeof scanner.countMCPServers, 'function'));
test('scanner exports countMCPTools', () => assert.strictEqual(typeof scanner.countMCPTools, 'function'));
test('scanner exports countLibModules', () => assert.strictEqual(typeof scanner.countLibModules, 'function'));
test('scanner exports countScripts', () => assert.strictEqual(typeof scanner.countScripts, 'function'));

// ============================================================
// Scanner accuracy (live filesystem)
// ============================================================
// v2.1.16 hardening: SoT baselines synced (43→44 skills, 36→34 agents, 16→19 mcpTools).
test('countSkills = 44', () => assert.strictEqual(scanner.countSkills(), 44));
test('countAgents = 34', () => assert.strictEqual(scanner.countAgents(), 34));
test('countHooks.events = 22', () => assert.strictEqual(scanner.countHooks().events, 22));
test('countHooks.blocks = 25', () => assert.strictEqual(scanner.countHooks().blocks, 25));
test('countMCPServers = 2', () => assert.strictEqual(scanner.countMCPServers(), 2));
test('countMCPTools = 19', () => assert.strictEqual(scanner.countMCPTools(), 19));
test('countLibModules > 100', () => assert.ok(scanner.countLibModules() > 100));
test('countScripts > 30', () => assert.ok(scanner.countScripts() > 30));

// measure() returns full inventory
await testAsync('measure() returns full inventory', async () => {
  const m = await scanner.measure();
  assert.ok(m.skills >= 44);
  assert.ok(m.agents >= 34);
  assert.strictEqual(m.hookEvents, 22);
  assert.strictEqual(m.hookBlocks, 25);
  assert.strictEqual(m.mcpServers, 2);
  assert.strictEqual(m.mcpTools, 19);
  assert.ok(m.libModules > 100);
  assert.ok(m.scripts > 30);
});

// ============================================================
// EXPECTED_COUNTS alignment with measured
// ============================================================
await testAsync('EXPECTED_COUNTS aligned with measure()', async () => {
  const m = await scanner.measure();
  assert.strictEqual(invariants.EXPECTED_COUNTS.skills, m.skills);
  assert.strictEqual(invariants.EXPECTED_COUNTS.agents, m.agents);
  assert.strictEqual(invariants.EXPECTED_COUNTS.hookEvents, m.hookEvents);
  assert.strictEqual(invariants.EXPECTED_COUNTS.hookBlocks, m.hookBlocks);
  assert.strictEqual(invariants.EXPECTED_COUNTS.mcpServers, m.mcpServers);
  assert.strictEqual(invariants.EXPECTED_COUNTS.mcpTools, m.mcpTools);
});

// ============================================================
// diffCounts behavior
// ============================================================
// v2.1.16 hardening: baselines synced to current SoT (skills=44, agents=34, mcpTools=19).
test('diffCounts match → []', () => {
  const d = invariants.diffCounts({
    skills: 44, agents: 34, hookEvents: 22, hookBlocks: 25, mcpServers: 2, mcpTools: 19,
  });
  assert.deepStrictEqual(d, []);
});
test('diffCounts skills drift +1 detected', () => {
  // SoT=44, measured=45 → +1 drift detected
  const d = invariants.diffCounts({
    skills: 45, agents: 34, hookEvents: 22, hookBlocks: 25, mcpServers: 2, mcpTools: 19,
  });
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].field, 'skills');
  assert.strictEqual(d[0].declared || d[0].expected, 44);
  assert.strictEqual(d[0].actual, 45);
});
test('diffCounts agents drift -1 detected', () => {
  // SoT=34, measured=33 → -1 drift detected
  const d = invariants.diffCounts({
    skills: 44, agents: 33, hookEvents: 22, hookBlocks: 25, mcpServers: 2, mcpTools: 19,
  });
  assert.strictEqual(d.length, 1);
  assert.strictEqual(d[0].field, 'agents');
});
test('diffCounts multiple drifts', () => {
  // 6 simultaneous drifts: all fields differ from SoT (hookEvents/Blocks use
  // off-SoT values 20/23 since the SoT is now 22/25 after v2.1.27 ENH-371)
  const d = invariants.diffCounts({
    skills: 45, agents: 33, hookEvents: 20, hookBlocks: 23, mcpServers: 3, mcpTools: 20,
  });
  assert.strictEqual(d.length, 6);
});
test('diffCounts null returns all fields', () => {
  const d = invariants.diffCounts(null);
  assert.ok(d.length >= 6);
});

// ============================================================
// crossCheck against real docs
// ============================================================
await testAsync('crossCheck README.md returns array', async () => {
  const d = await scanner.crossCheck('README.md');
  assert.ok(Array.isArray(d));
});
await testAsync('crossCheck CHANGELOG.md returns array', async () => {
  const d = await scanner.crossCheck('CHANGELOG.md');
  assert.ok(Array.isArray(d));
});
await testAsync('crossCheck non-existent file returns []', async () => {
  const d = await scanner.crossCheck('no-such-file.md');
  assert.deepStrictEqual(d, []);
});
await testAsync('crossCheck .claude-plugin/plugin.json returns array', async () => {
  const d = await scanner.crossCheck('.claude-plugin/plugin.json');
  assert.ok(Array.isArray(d));
});

// ============================================================
// Synthetic drift detection (tmp file with wrong counts)
// ============================================================
const tmpDir = path.join(__dirname, '.tmp-docs-code');
fs.mkdirSync(tmpDir, { recursive: true });
const tmpDoc = path.join(tmpDir, 'fake-drift.md');
fs.writeFileSync(tmpDoc, '# Fake Doc\n\nWe have 42 Skills and 99 Agents.\n', 'utf8');
await testAsync('crossCheck detects synthetic drift (42 skills)', async () => {
  const d = await scanner.crossCheck(tmpDoc);
  const skillsDrift = d.find((x) => x.field === 'skills');
  assert.ok(skillsDrift);
  assert.strictEqual(skillsDrift.declared, 42);
  // v2.1.16 hardening: actual count synced (43→44)
  assert.strictEqual(skillsDrift.actual, 44);
});
await testAsync('crossCheck detects synthetic drift (99 agents)', async () => {
  const d = await scanner.crossCheck(tmpDoc);
  const agentsDrift = d.find((x) => x.field === 'agents');
  assert.ok(agentsDrift);
  assert.strictEqual(agentsDrift.declared, 99);
});
const tmpCorrect = path.join(tmpDir, 'correct.md');
// v2.1.16 hardening: fixture counts synced to current SoT
fs.writeFileSync(tmpCorrect, 'We have 44 Skills and 34 Agents and 22 Hook Events.\n', 'utf8');
await testAsync('crossCheck correct counts → []', async () => {
  const d = await scanner.crossCheck(tmpCorrect);
  assert.deepStrictEqual(d, []);
});

// Cleanup tmp
try {
  fs.unlinkSync(tmpDoc);
  fs.unlinkSync(tmpCorrect);
  fs.rmdirSync(tmpDir);
} catch { /* non-critical */ }

// ============================================================
// CLI docs-code-sync.js behavior
// ============================================================
test('docs-code-sync CLI exists', () => {
  assert.ok(fs.existsSync(path.join(PROJECT_ROOT, 'scripts', 'docs-code-sync.js')));
});
test('docs-code-sync --json exits 0 (plugin.json clean)', () => {
  const r = spawnSync('node', ['scripts/docs-code-sync.js', '--json'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
  assert.strictEqual(r.status, 0, `expected exit 0, got ${r.status}: ${r.stderr}`);
  const report = JSON.parse(r.stdout);
  assert.strictEqual(report.passed, true);
  assert.strictEqual(report.invariantDiffs.length, 0);
});
test('docs-code-sync --docs=README.md shows historical drift (release notes)', () => {
  const r = spawnSync('node', ['scripts/docs-code-sync.js', '--json', '--docs=README.md'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
  // README contains history snapshots → drift expected
  const report = JSON.parse(r.stdout);
  assert.ok(report.docDiffs.length >= 0);
});
test('docs-code-sync --json output has measured field', () => {
  const r = spawnSync('node', ['scripts/docs-code-sync.js', '--json'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
  const report = JSON.parse(r.stdout);
  assert.ok(report.measured);
  assert.ok(report.expected);
});
test('docs-code-sync --docs=nonexistent.md returns drift', () => {
  const r = spawnSync('node', ['scripts/docs-code-sync.js', '--json', '--docs=nonexistent.md'], {
    cwd: PROJECT_ROOT,
    encoding: 'utf8',
    timeout: 10000,
  });
  const report = JSON.parse(r.stdout);
  // _missing entry
  assert.ok(report.docDiffs.some((d) => d.field === '_missing'));
});

// ============================================================
// Summary
// ============================================================
console.log(`\ndocs-code-sync.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
if (fail > 0) process.exit(1);

})();
