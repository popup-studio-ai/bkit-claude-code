#!/usr/bin/env node
/**
 * L1 Unit Tests — sprint-handler.js annotate action (F1-5 v2.1.19 S1)
 *
 * @module test/unit/sprint-handler/annotate-action.test
 */
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const HANDLER = path.join(PROJECT_ROOT, 'scripts/sprint-handler.js');

let passed = 0, failed = 0;
const failures = [];

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✓ ${name}`); }
  catch (e) { failed++; failures.push({ name, err: e.message }); console.log(`  ✗ ${name} — ${e.message}`); }
}

function cleanupSprint(id) {
  const f = path.join(PROJECT_ROOT, '.bkit/state/sprints', id + '.json');
  if (fs.existsSync(f)) fs.unlinkSync(f);
}

console.log('L1 F1-5 annotate action tests');

// ============================================================

test('TC-F1-5-U1: handleAnnotate on archived sprint → annotation appended + phase preserved', () => {
  cleanupSprint('test-f1-5-archive');
  // Set up: create an archived sprint by manual state file write
  const statePath = path.join(PROJECT_ROOT, '.bkit/state/sprints/test-f1-5-archive.json');
  fs.writeFileSync(statePath, JSON.stringify({
    id: 'test-f1-5-archive', name: 'Test', version: '1.1',
    phase: 'archived', status: 'archived',
    context: {}, features: [], config: {}, autoRun: {}, autoPause: { armed: [] },
    phaseHistory: [], iterateHistory: [], docs: {}, featureMap: {},
    qualityGates: {}, annotations: [],
    kpi: {}, createdAt: new Date().toISOString(), archivedAt: new Date().toISOString(),
  }));
  const out = execSync(
    `node "${HANDLER}" annotate test-f1-5-archive --reason "retrospective note 1"`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const result = JSON.parse(out);
  assert.equal(result.ok, true);
  assert.equal(result.totalAnnotations, 1);
  assert.equal(result.phase, 'archived'); // forward-only preserved
  // Verify on disk
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.annotations.length, 1);
  assert.equal(state.annotations[0].reason, 'retrospective note 1');
  assert.equal(state.phase, 'archived');
  cleanupSprint('test-f1-5-archive');
});

test('TC-F1-5-U2: handleAnnotate without --reason → error', () => {
  let exitCode = 0, out = '';
  try {
    out = execSync(`node "${HANDLER}" annotate some-id`, {
      encoding: 'utf8', cwd: PROJECT_ROOT, stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) { exitCode = e.status; out = e.stdout && e.stdout.toString(); }
  assert.equal(exitCode, 1);
  const result = JSON.parse(out);
  assert.equal(result.ok, false);
  assert.match(result.error, /reason/);
});

test('TC-F1-5-CLI: full CLI invocation appends + audit emit', () => {
  cleanupSprint('test-f1-5-cli');
  fs.writeFileSync(
    path.join(PROJECT_ROOT, '.bkit/state/sprints/test-f1-5-cli.json'),
    JSON.stringify({
      id: 'test-f1-5-cli', name: 'Test', version: '1.1', phase: 'do', status: 'active',
      context: {}, features: [], config: {}, autoRun: {}, autoPause: { armed: [] },
      phaseHistory: [], iterateHistory: [], docs: {}, featureMap: {}, qualityGates: {},
      annotations: [], kpi: {}, createdAt: new Date().toISOString(),
    })
  );
  execSync(
    `node "${HANDLER}" annotate test-f1-5-cli --reason "cli test annotation"`,
    { encoding: 'utf8', cwd: PROJECT_ROOT }
  );
  const today = new Date().toISOString().split('T')[0];
  const auditPath = path.join(PROJECT_ROOT, `.bkit/audit/${today}.jsonl`);
  const lines = fs.readFileSync(auditPath, 'utf8').trim().split('\n');
  const events = lines
    .map(l => { try { return JSON.parse(l); } catch (_) { return null; } })
    .filter(e => e && e.action === 'sprint_annotated' && e.target === 'test-f1-5-cli');
  assert.ok(events.length >= 1, 'sprint_annotated not emitted');
  cleanupSprint('test-f1-5-cli');
});

console.log(`\n${passed} passed, ${failed} failed (total ${passed + failed})`);
if (failed > 0) {
  failures.forEach(f => console.error(`  - ${f.name}: ${f.err}`));
  process.exit(1);
}
process.exit(0);
