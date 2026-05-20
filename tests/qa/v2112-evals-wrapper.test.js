#!/usr/bin/env node
/**
 * bkit v2.1.12 — evals/runner-wrapper hotfix verification suite.
 *
 * Covers:
 *   - L1 unit (6 TC): isValidSkillName regex, _extractTrailingJson fallback,
 *     invokeEvals defense paths (Usage banner, parsed null, invalid name).
 *   - L2 integration (3 TC): real evals/runner.js subprocess against three
 *     known skills (pdca, gap-detector, qa-phase).
 *   - L3 contract (2 TC): argv form lock (`['--skill', skill]`) + runner.js
 *     Usage banner spec lock.
 *
 * Run:
 *   node tests/qa/v2112-evals-wrapper.test.js
 *
 * Prereq: evals/runner.js + evals/{cls}/{skill}/eval.yaml present.
 *
 * Design Ref: docs/02-design/features/bkit-v2112-evals-wrapper-hotfix.design.md §8
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
process.env.CLAUDE_PLUGIN_ROOT = ROOT;

let pass = 0;
let fail = 0;
const failures = [];
function tc(id, fn) {
  try { fn(); console.log(`✅ ${id}`); pass++; }
  catch (e) { console.error(`❌ ${id} — ${e.message.slice(0, 250)}`); failures.push({ id, error: e.message }); fail++; }
}
function purge(re) { Object.keys(require.cache).forEach(k => { if (re.test(k)) delete require.cache[k]; }); }

// Helper to create a one-shot fake runner script that prints fixed stdout.
function makeFakeRunner(stdoutPayload, exitCode = 0) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-fake-runner-'));
  const file = path.join(dir, 'fake-runner.js');
  const escaped = JSON.stringify(stdoutPayload);
  fs.writeFileSync(file, `#!/usr/bin/env node\nprocess.stdout.write(${escaped});\nprocess.exit(${exitCode});\n`);
  return { file, dir };
}

function rmDir(dir) { try { fs.rmSync(dir, { recursive: true, force: true }); } catch { /* ignore */ } }

// ===========================================================================
// L1 UNIT: isValidSkillName regex
// ===========================================================================
console.log('\n=== L1: isValidSkillName regex ===');

tc('L1-00 isValidSkillName covers boundary cases', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { isValidSkillName } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));

  // Valid
  assert.strictEqual(isValidSkillName('pdca'), true, 'simple lowercase');
  assert.strictEqual(isValidSkillName('gap-detector'), true, 'with hyphen');
  assert.strictEqual(isValidSkillName('a'), true, 'single char');
  assert.strictEqual(isValidSkillName('a'.repeat(64)), true, 'max length 64');

  // Invalid
  assert.strictEqual(isValidSkillName('a'.repeat(65)), false, 'over-length rejected');
  assert.strictEqual(isValidSkillName('Pdca'), false, 'uppercase rejected');
  assert.strictEqual(isValidSkillName('pdca/x'), false, 'slash rejected');
  assert.strictEqual(isValidSkillName('../etc/passwd'), false, 'traversal rejected');
  assert.strictEqual(isValidSkillName('pdca; rm -rf'), false, 'shell metachar rejected');
  assert.strictEqual(isValidSkillName('1pdca'), false, 'leading digit rejected');
  assert.strictEqual(isValidSkillName(''), false, 'empty rejected');
  assert.strictEqual(isValidSkillName(null), false, 'null rejected');
  assert.strictEqual(isValidSkillName(undefined), false, 'undefined rejected');
  assert.strictEqual(isValidSkillName(123), false, 'number rejected');
});

// ===========================================================================
// L1 UNIT: _extractTrailingJson balanced-brace fallback
// ===========================================================================
console.log('\n=== L1: _extractTrailingJson balanced-brace ===');

tc('L1-01 _extractTrailingJson parses nested object correctly', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { _extractTrailingJson } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const stdout = '{\n  "pass": true,\n  "details": {\n    "skill": "pdca",\n    "score": 1\n  }\n}\n';
  const parsed = _extractTrailingJson(stdout);
  assert.ok(parsed, 'must return non-null');
  assert.strictEqual(parsed.pass, true, 'pass field preserved');
  assert.strictEqual(parsed.details.skill, 'pdca', 'nested skill preserved');
  assert.strictEqual(parsed.details.score, 1, 'nested score preserved');
});

tc('L1-02 _extractTrailingJson handles preceding logs', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { _extractTrailingJson } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const stdout = '[INFO] Loading skill\n[INFO] Running eval\n{\n  "pass": false,\n  "score": 0\n}\n';
  const parsed = _extractTrailingJson(stdout);
  assert.ok(parsed, 'must extract trailing JSON despite log noise');
  assert.strictEqual(parsed.pass, false, 'pass extracted');
  assert.strictEqual(parsed.score, 0, 'score extracted');
});

tc('L1-03 _extractTrailingJson returns null for non-JSON', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { _extractTrailingJson } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  assert.strictEqual(_extractTrailingJson(''), null, 'empty stdout');
  assert.strictEqual(_extractTrailingJson('Usage: foo'), null, 'usage banner');
  assert.strictEqual(_extractTrailingJson('plain text'), null, 'plain text');
  assert.strictEqual(_extractTrailingJson(null), null, 'null input');
  assert.strictEqual(_extractTrailingJson(undefined), null, 'undefined input');
});

tc('L1-04 _extractTrailingJson handles strings with braces inside', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { _extractTrailingJson } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  // Brace inside a JSON string value MUST NOT confuse the brace counter.
  const stdout = '{\n  "msg": "value with { brace inside }",\n  "ok": true\n}\n';
  const parsed = _extractTrailingJson(stdout);
  assert.ok(parsed, 'must parse string-aware');
  assert.strictEqual(parsed.ok, true);
  assert.strictEqual(parsed.msg, 'value with { brace inside }');
});

// ===========================================================================
// L1 UNIT: invokeEvals defense paths via fake runners
// ===========================================================================
console.log('\n=== L1: invokeEvals defense paths ===');

tc('L1-05 invokeEvals — invalid skill name short-circuits before spawn', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const r = invokeEvals('../etc/passwd', { persist: false });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'invalid_skill_name');
  // No code/stdout fields populated when short-circuited
  assert.strictEqual(r.code, undefined, 'code absent on short-circuit');
});

tc('L1-06 invokeEvals — Usage banner triggers argv_format_mismatch', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('Usage: node runner.js --skill <name>\n', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file, persist: false });
    assert.strictEqual(r.ok, false, 'must be false despite exit 0');
    assert.strictEqual(r.reason, 'argv_format_mismatch', 'reason locked');
    assert.strictEqual(r.code, 0, 'exit code surfaced');
  } finally { rmDir(fake.dir); }
});

tc('L1-07 invokeEvals — empty stdout triggers parsed_null', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file, persist: false });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'parsed_null');
  } finally { rmDir(fake.dir); }
});

tc('L1-08 invokeEvals — plain text stdout triggers parsed_null', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('Some plain text without JSON\n', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file, persist: false });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.reason, 'parsed_null');
  } finally { rmDir(fake.dir); }
});

tc('L1-09 invokeEvals — runner_missing returned for absent runner', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const r = invokeEvals('pdca', { runnerPath: '/nonexistent/path.js', persist: false });
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, 'runner_missing');
});

tc('L1-10 invokeEvals — happy path with fake runner returning JSON', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('{"pass":true,"details":{"skill":"pdca","score":1}}\n', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file, persist: false });
    assert.strictEqual(r.ok, true, 'ok must be true on JSON pass');
    assert.strictEqual(r.reason, undefined, 'no reason on success');
    assert.strictEqual(r.parsed?.pass, true);
    assert.strictEqual(r.parsed?.details?.skill, 'pdca');
  } finally { rmDir(fake.dir); }
});

tc('L1-11 invokeEvals — JSON pass:false must yield ok:false', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('{"pass":false,"details":{"skill":"pdca","score":0}}\n', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file, persist: false });
    assert.strictEqual(r.ok, false, 'ok must be false when eval failed');
    assert.strictEqual(r.parsed?.pass, false);
    // reason should NOT be set — the eval ran, it just failed
    assert.strictEqual(r.reason, undefined, 'no reason on legitimate fail');
  } finally { rmDir(fake.dir); }
});

tc('L1-12 invokeEvals — persist:true writes resultFile with reason field', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const fake = makeFakeRunner('Usage: node runner.js --skill <name>\n', 0);
  try {
    const r = invokeEvals('pdca', { runnerPath: fake.file });
    assert.ok(r.resultFile, 'resultFile path must be returned');
    assert.ok(fs.existsSync(r.resultFile), 'resultFile must exist on disk');
    const persisted = JSON.parse(fs.readFileSync(r.resultFile, 'utf8'));
    assert.strictEqual(persisted.reason, 'argv_format_mismatch', 'reason persisted');
    assert.strictEqual(persisted.parsed, null, 'parsed null persisted');
    assert.strictEqual(persisted.skill, 'pdca');
    // Cleanup the persisted file
    try { fs.unlinkSync(r.resultFile); } catch { /* ignore */ }
  } finally { rmDir(fake.dir); }
});

// ===========================================================================
// L2 INTEGRATION: real runner.js + real eval.yaml
// ===========================================================================
console.log('\n=== L2: integration with real runner.js ===');

tc('L2-01 real runner — pdca workflow eval', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const r = invokeEvals('pdca', { persist: false });
  assert.strictEqual(r.ok, true, 'pdca eval must pass');
  assert.strictEqual(r.reason, undefined, 'no failure reason');
  assert.ok(r.parsed, 'parsed JSON present');
  assert.strictEqual(r.parsed.details.skill, 'pdca');
  assert.strictEqual(r.parsed.details.classification, 'workflow');
  assert.strictEqual(r.stdout.includes('Usage:'), false, 'no usage banner leak');
});

tc('L2-02 real runner — starter capability eval', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  // starter is registered under evals/capability/starter/ — exercises the
  // capability classification path (gap-detector is an agent, not a skill
  // eval, so it is intentionally absent from evals/config.json).
  const r = invokeEvals('starter', { persist: false });
  assert.ok(r.parsed, 'parsed JSON present for starter');
  assert.strictEqual(r.parsed.details.classification, 'capability',
    `expected capability classification, got ${r.parsed.details.classification}`);
  assert.strictEqual(r.parsed.details.skill, 'starter');
});

tc('L2-03 real runner — qa-phase workflow eval', () => {
  purge(/lib\/evals\/runner-wrapper/);
  const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
  const r = invokeEvals('qa-phase', { persist: false });
  assert.ok(r.parsed, 'parsed JSON present for qa-phase');
  assert.strictEqual(r.parsed.details.skill, 'qa-phase');
});

// ===========================================================================
// L3 CONTRACT: argv form + Usage banner spec
// ===========================================================================
console.log('\n=== L3: wrapper↔runner argv contract ===');

tc('L3-01 contract — wrapper emits ["--skill", skill] argv', () => {
  // Spy via PATH-injected node shim. We replace the spawned binary with a
  // tiny script that records its argv to a temp file then exits 0.
  // Then we point invokeEvals at this shim by overriding runnerPath.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-argv-spy-'));
  const captureFile = path.join(dir, 'captured-argv.json');
  const shim = path.join(dir, 'argv-shim.js');
  // The shim script runs as the runner. invokeEvals calls
  // spawnSync('node', [runnerPath, '--skill', 'pdca']). Inside the shim,
  // process.argv = ['node', '<shim>', '--skill', 'pdca']. We slice(2) to
  // capture just the wrapper-supplied tail.
  fs.writeFileSync(shim, `#!/usr/bin/env node
const fs = require('fs');
fs.writeFileSync(${JSON.stringify(captureFile)}, JSON.stringify(process.argv.slice(2)));
process.stdout.write('{"pass":true,"details":{"skill":"pdca","classification":"workflow"}}');
process.exit(0);
`);
  try {
    purge(/lib\/evals\/runner-wrapper/);
    const { invokeEvals } = require(path.join(ROOT, 'lib/evals/runner-wrapper.js'));
    const r = invokeEvals('pdca', { runnerPath: shim, persist: false });
    assert.strictEqual(r.ok, true, 'shim must succeed');
    const captured = JSON.parse(fs.readFileSync(captureFile, 'utf8'));
    assert.deepStrictEqual(captured, ['--skill', 'pdca'],
      `argv contract violated: expected ['--skill', 'pdca'], got ${JSON.stringify(captured)}`);
  } finally { rmDir(dir); }
});

tc('L3-02 contract — runner.js Usage banner spec lock', () => {
  // Direct invocation of runner.js with no args MUST emit the documented
  // Usage banner. If the banner text changes, the wrapper's
  // includes('Usage:') sentinel must be re-evaluated.
  const result = spawnSync('node', [path.join(ROOT, 'evals/runner.js')], {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 10_000,
  });
  assert.strictEqual(result.status, 0, 'runner.js no-args must exit 0');
  const expected = 'Usage: node runner.js --skill <name> | --classification <type> | --benchmark | --parity <name>\n';
  assert.strictEqual(result.stdout, expected,
    `runner.js Usage banner spec drift detected. Expected exact match.\nGot: ${JSON.stringify(result.stdout)}`);
});

// ===========================================================================
// Summary
// ===========================================================================
console.log('');
console.log('═══════════════════════════════════════════════════════════');
console.log(`v2.1.12 evals-wrapper hotfix tests: ${pass} passed / ${fail} failed`);
console.log('═══════════════════════════════════════════════════════════');
if (failures.length) {
  console.error('\nFailures:');
  for (const f of failures) console.error(`  - ${f.id}: ${f.error.slice(0, 200)}`);
}
process.exit(fail === 0 ? 0 : 1);
