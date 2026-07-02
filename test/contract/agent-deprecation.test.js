#!/usr/bin/env node
/**
 * Agent Deprecation Governance — Isolated Unit Test (v2.1.18, CO-4).
 *
 * Verifies the L1/L4 contract runner's agent deprecation behavior using
 * fixture-based isolated repos. Each fixture is a minimal directory
 * containing only the files needed to drive a specific scenario.
 *
 * Fixtures live under test/contract/fixtures/agent-deprecation/.
 * Each fixture provides:
 *   - agents/<name>.md         (current state — present or absent)
 *   - test/contract/baseline/fixture/_MANIFEST.json
 *   - test/contract/baseline/fixture/agents/<name>.json
 *
 * Runner CLI: node test/contract/scripts/contract-test-run.js
 *   --project-root <fixture-path> --compare fixture --level L1,L4
 *
 * Design Ref: docs/02-design/features/v2118-carryover-cleanup.design.md §3
 * Plan SC: CO-4 — L4 governance regression protection.
 *
 * @module test/contract/agent-deprecation.test
 */

const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const RUNNER = path.join(PROJECT_ROOT, 'test/contract/scripts/contract-test-run.js');
const FIXTURES = path.join(PROJECT_ROOT, 'test/contract/fixtures/agent-deprecation');

let pass = 0;
let fail = 0;

function test(name, fn) {
  try {
    fn();
    pass++;
    // eslint-disable-next-line no-console
    console.log(`  ✓ ${name}`);
  } catch (e) {
    fail++;
    // eslint-disable-next-line no-console
    console.error(`  ✗ ${name}: ${e.message}`);
  }
}

function runRunner(fixtureName, levels = 'L4') {
  const fixture = path.join(FIXTURES, fixtureName);
  const r = spawnSync(
    'node',
    [RUNNER, '--project-root', fixture, '--compare', 'fixture', '--level', levels],
    { cwd: fixture, encoding: 'utf8' }
  );
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

// eslint-disable-next-line no-console
console.log('[agent-deprecation] Isolated L4 governance tests (v2.1.18 CO-4)');

// === Scenario 1: positive — stub with deprecatedIn passes L4 ===
test('L4 passes when deprecation stub has deprecatedIn frontmatter', () => {
  const r = runRunner('positive', 'L4');
  assert.equal(r.code, 0, `expected exit 0, got ${r.code}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
});

// === Scenario 2: missing-stub — baseline says agent existed, stub absent ===
test('L4 fails when baseline agent removed without any stub', () => {
  const r = runRunner('missing-stub', 'L4');
  assert.notEqual(r.code, 0, 'expected non-zero exit');
  assert.match(
    r.stderr,
    /L4 FAIL agent 'old-agent'/,
    'expected L4 fail message for old-agent'
  );
});

// === Scenario 3: no-deprecated-in — stub exists but lacks deprecatedIn ===
// Note: in this scenario the stub IS present, so collectAgents includes
// 'old-agent' in current.names → the L4 check skips (agent is "present"),
// but our governance intent is that L1 should still apply. We assert that
// at minimum the runner does not crash and L1 still runs without error.
test('L1+L4 with stub missing deprecatedIn but present in agents/ — runner stable', () => {
  const r = runRunner('no-deprecated-in', 'L1,L4');
  // Either passes (stub satisfies L1 fields) or fails on L1, but should not crash.
  assert.notEqual(r.code, 2, `runner internal error (exit 2)\nstderr: ${r.stderr}`);
});

// === Scenario 4: model-mismatch — stub has deprecatedIn but L1-AG model differs ===
test('L1 fails when stub model differs from baseline model', () => {
  const r = runRunner('model-mismatch', 'L1,L4');
  assert.notEqual(r.code, 0, 'expected non-zero exit (L1 model mismatch)');
  assert.match(
    r.stderr,
    /L1-AG FAIL.*model/i,
    'expected L1-AG model mismatch error'
  );
});

// === Scenario 5: baseline file integrity — non-mutation guarantee ===
// Runner must NOT modify the fixture's baseline JSON files when running L4.
// This guards against the v2.1.17 collect persist=true regression.
test('Runner does not mutate baseline JSON files (persist=false guarantee)', () => {
  const fs = require('node:fs');
  const baselineFile = path.join(
    FIXTURES, 'positive',
    'test/contract/baseline/fixture/agents/old-agent.json'
  );
  const before = fs.readFileSync(baselineFile, 'utf8');
  runRunner('positive', 'L1,L4');
  const after = fs.readFileSync(baselineFile, 'utf8');
  assert.equal(before, after, 'baseline JSON was mutated by runner');
});

// === Scenario 6: registry-tombstone — baseline agent removed, NO stub file,
// but test/contract/deprecation-registry.json carries a deprecatedIn entry.
// v2.1.25 (#128, ADR 0014): registry tombstone is equivalent to a live stub.
test('L4 passes when removed agent has a deprecation-registry tombstone (no stub)', () => {
  const r = runRunner('registry-tombstone', 'L4');
  assert.equal(r.code, 0, `expected exit 0, got ${r.code}\nstdout: ${r.stdout}\nstderr: ${r.stderr}`);
});

// === Summary ===
// eslint-disable-next-line no-console
console.log(`\nagent-deprecation.test.js: ${pass}/${pass + fail} PASS, ${fail} FAIL, 0 SKIP`);
process.exit(fail === 0 ? 0 : 1);
