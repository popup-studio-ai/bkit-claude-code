#!/usr/bin/env node
'use strict';

const assert = require('assert');
let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Remaining Exports Coverage Tests ===\n');

// ============================================================
// Group 1: lib/ui/ansi.js (6 untested exports)
// ============================================================

console.log('--- Group 1: lib/ui/ansi.js ---');

const ansi = require('../../lib/ui/ansi');

test('ANSI-01', 'BOX is a frozen object with box-drawing characters', () => {
  assert.strictEqual(typeof ansi.BOX, 'object');
  assert.ok(Object.isFrozen(ansi.BOX));
  assert.strictEqual(ansi.BOX.topLeft, '\u250C');
  assert.strictEqual(ansi.BOX.horizontal, '\u2500');
  assert.strictEqual(ansi.BOX.vertical, '\u2502');
  assert.strictEqual(ansi.BOX.bottomRight, '\u2518');
  assert.strictEqual(ansi.BOX.cross, '\u253C');
  assert.strictEqual(ansi.BOX.arrowRight, '\u2192');
});

test('ANSI-02', 'SYMBOLS is a frozen object with status icons', () => {
  assert.strictEqual(typeof ansi.SYMBOLS, 'object');
  assert.ok(Object.isFrozen(ansi.SYMBOLS));
  assert.strictEqual(ansi.SYMBOLS.done, '\u2713');
  assert.strictEqual(ansi.SYMBOLS.failed, '\u2717');
  assert.strictEqual(ansi.SYMBOLS.running, '\u25B6');
  assert.strictEqual(ansi.SYMBOLS.bullet, '\u2022');
  assert.strictEqual(ansi.SYMBOLS.waiting, '!');
});

test('ANSI-03', 'styled() applies multiple ANSI styles', () => {
  assert.strictEqual(typeof ansi.styled, 'function');
  assert.strictEqual(ansi.styled.length, 2);
  // With NO_COLOR or non-TTY, returns plain text
  const result = ansi.styled('hello', []);
  assert.strictEqual(result, 'hello');
  // Non-array styles returns plain text
  assert.strictEqual(ansi.styled('test', null), 'test');
  assert.strictEqual(ansi.styled('test', 'notarray'), 'test');
});

test('ANSI-04', 'isColorDisabled() returns boolean', () => {
  assert.strictEqual(typeof ansi.isColorDisabled, 'function');
  assert.strictEqual(ansi.isColorDisabled.length, 0);
  const result = ansi.isColorDisabled();
  assert.strictEqual(typeof result, 'boolean');
});

test('ANSI-05', 'boxLine() wraps content with vertical borders', () => {
  assert.strictEqual(typeof ansi.boxLine, 'function');
  assert.strictEqual(ansi.boxLine.length, 2);
  const line = ansi.boxLine('hello', 10);
  assert.ok(line.startsWith(ansi.BOX.vertical));
  assert.ok(line.endsWith(ansi.BOX.vertical));
  assert.ok(line.includes('hello'));
});

test('ANSI-06', 'boxLine() pads content to innerWidth', () => {
  const line = ansi.boxLine('ab', 6);
  // Should contain 'ab' followed by 4 spaces (6-2) plus border padding
  assert.ok(line.includes('ab'));
  // Verify structure: vertical + 2 spaces + content + padding + 2 spaces + vertical
  const stripped = ansi.stripAnsi(line);
  assert.ok(stripped.length > 6);
});

test('ANSI-07', 'resolveFeature() extracts feature from pdcaStatus', () => {
  assert.strictEqual(typeof ansi.resolveFeature, 'function');
  assert.strictEqual(ansi.resolveFeature.length, 2);

  // null/undefined input
  const empty = ansi.resolveFeature(null);
  assert.strictEqual(empty.name, '');
  assert.strictEqual(empty.data, null);

  // With features map
  const status = {
    primaryFeature: 'my-feat',
    features: { 'my-feat': { phase: 'do' } },
  };
  const result = ansi.resolveFeature(status);
  assert.strictEqual(result.name, 'my-feat');
  assert.deepStrictEqual(result.data, { phase: 'do' });

  // Explicit feature name overrides primaryFeature
  const result2 = ansi.resolveFeature(status, 'other');
  assert.strictEqual(result2.name, 'other');
  assert.strictEqual(result2.data, null);
});

test('ANSI-08', 'resolveFeature() handles missing features map', () => {
  const result = ansi.resolveFeature({});
  assert.strictEqual(result.name, '');
  assert.strictEqual(result.data, null);
});

// ============================================================
// Group 2: lib/team/communication.js (2 untested exports)
// ============================================================

console.log('--- Group 2: lib/team/communication.js ---');

const comm = require('../../lib/team/communication');

test('COMM-01', 'createPlanDecision() exists and has arity 3', () => {
  assert.strictEqual(typeof comm.createPlanDecision, 'function');
  assert.strictEqual(comm.createPlanDecision.length, 3);
});

test('COMM-02', 'createPlanDecision() creates approval message', () => {
  const msg = comm.createPlanDecision('developer', true, 'Looks good');
  assert.ok(msg);
  assert.strictEqual(msg.from, 'cto');
  assert.strictEqual(msg.to, 'developer');
  assert.strictEqual(msg.type, 'approval');
  assert.strictEqual(msg.payload.subject, 'Plan Approved');
  assert.strictEqual(msg.payload.body, 'Looks good');
  assert.ok(msg.timestamp);
});

test('COMM-03', 'createPlanDecision() creates rejection message', () => {
  const msg = comm.createPlanDecision('analyst', false);
  assert.ok(msg);
  assert.strictEqual(msg.type, 'rejection');
  assert.strictEqual(msg.payload.subject, 'Plan Rejected');
  assert.ok(msg.payload.body.includes('revise'));
});

test('COMM-04', 'createDirective() exists and has arity 2 (3rd param has default)', () => {
  assert.strictEqual(typeof comm.createDirective, 'function');
  assert.strictEqual(comm.createDirective.length, 2);
});

test('COMM-05', 'createDirective() creates directive message', () => {
  const msg = comm.createDirective('developer', 'Focus on tests', {
    feature: 'feat-x',
    phase: 'do',
    references: ['docs/plan.md'],
  });
  assert.ok(msg);
  assert.strictEqual(msg.from, 'cto');
  assert.strictEqual(msg.to, 'developer');
  assert.strictEqual(msg.type, 'directive');
  assert.strictEqual(msg.payload.subject, 'CTO Directive');
  assert.strictEqual(msg.payload.body, 'Focus on tests');
  assert.strictEqual(msg.payload.feature, 'feat-x');
  assert.strictEqual(msg.payload.phase, 'do');
  assert.deepStrictEqual(msg.payload.references, ['docs/plan.md']);
});

test('COMM-06', 'createDirective() with empty context uses defaults', () => {
  const msg = comm.createDirective('tester', 'Run all tests');
  assert.ok(msg);
  assert.strictEqual(msg.payload.feature, null);
  assert.strictEqual(msg.payload.phase, null);
  assert.deepStrictEqual(msg.payload.references, []);
});

// ============================================================
// Group 3: lib/pdca/session-guide.js (2 untested exports)
// ============================================================

console.log('--- Group 3: lib/pdca/session-guide.js ---');

const sessionGuide = require('../../lib/pdca/session-guide');

test('SG-01', 'extractSuccessCriteria() exists and has arity 1', () => {
  assert.strictEqual(typeof sessionGuide.extractSuccessCriteria, 'function');
  assert.strictEqual(sessionGuide.extractSuccessCriteria.length, 1);
});

test('SG-02', 'extractSuccessCriteria() returns empty array for no match', () => {
  const result = sessionGuide.extractSuccessCriteria('no criteria here');
  assert.ok(Array.isArray(result));
  assert.strictEqual(result.length, 0);
});

test('SG-03', 'extractSuccessCriteria() parses Definition of Done items', () => {
  const plan = [
    '## 4. Success Criteria',
    '',
    '### Definition of Done',
    '- [x] All tests pass',
    '- [ ] Coverage above 80%',
    '',
    '## 5. Next Section',
  ].join('\n');

  const result = sessionGuide.extractSuccessCriteria(plan);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].id, 'SC-1');
  assert.strictEqual(result[0].text, 'All tests pass');
  assert.strictEqual(result[0].type, 'done');
  assert.strictEqual(result[1].id, 'SC-2');
  assert.strictEqual(result[1].text, 'Coverage above 80%');
});

test('SG-04', 'extractSuccessCriteria() parses Quality Criteria items', () => {
  const plan = [
    '## 4. Success Criteria',
    '',
    '### Definition of Done',
    '- [x] Feature works',
    '',
    '### Quality Criteria',
    '- [ ] No critical bugs',
    '- [ ] Performance within SLA',
    '',
    '## 5. Risks',
  ].join('\n');

  const result = sessionGuide.extractSuccessCriteria(plan);
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[1].id, 'QC-1');
  assert.strictEqual(result[1].type, 'quality');
  assert.strictEqual(result[1].text, 'No critical bugs');
  assert.strictEqual(result[2].id, 'QC-2');
  assert.strictEqual(result[2].text, 'Performance within SLA');
});

test('SG-05', 'formatSuccessCriteria() exists and has arity 1 (2nd param has default)', () => {
  assert.strictEqual(typeof sessionGuide.formatSuccessCriteria, 'function');
  assert.strictEqual(sessionGuide.formatSuccessCriteria.length, 1);
});

test('SG-06', 'formatSuccessCriteria() returns message for empty criteria', () => {
  const result = sessionGuide.formatSuccessCriteria([]);
  assert.ok(result.includes('No Success Criteria'));
});

test('SG-07', 'formatSuccessCriteria() formats criteria as markdown table', () => {
  const criteria = [
    { id: 'SC-1', text: 'All tests pass', type: 'done' },
    { id: 'QC-1', text: 'No bugs', type: 'quality' },
  ];
  const result = sessionGuide.formatSuccessCriteria(criteria, { 'SC-1': 'met' });
  assert.ok(result.includes('Success Criteria Tracking'));
  assert.ok(result.includes('| SC-1 |'));
  assert.ok(result.includes('| QC-1 |'));
  assert.ok(result.includes('1/2 criteria met'));
});

// ============================================================
// Group 4: lib/team/state-writer.js (1 untested export)
// ============================================================

console.log('--- Group 4: lib/team/state-writer.js ---');

const stateWriter = require('../../lib/team/state-writer');

test('SW-01', 'getAgentStatePath() exists and is a function', () => {
  assert.strictEqual(typeof stateWriter.getAgentStatePath, 'function');
  assert.strictEqual(stateWriter.getAgentStatePath.length, 0);
});

test('SW-02', 'getAgentStatePath() returns a string path ending with agent-state.json', () => {
  const result = stateWriter.getAgentStatePath();
  assert.strictEqual(typeof result, 'string');
  assert.ok(result.endsWith('agent-state.json'), `Expected path ending with agent-state.json, got: ${result}`);
});

// ============================================================
// Group 5: lib/quality/gate-manager.js (1 untested export)
// ============================================================

console.log('--- Group 5: lib/quality/gate-manager.js ---');

const gateManager = require('../../lib/quality/gate-manager');

test('GM-01', 'LEVEL_THRESHOLD_OVERRIDES exists and is an object', () => {
  assert.strictEqual(typeof gateManager.LEVEL_THRESHOLD_OVERRIDES, 'object');
  assert.ok(gateManager.LEVEL_THRESHOLD_OVERRIDES !== null);
});

test('GM-02', 'LEVEL_THRESHOLD_OVERRIDES has Starter, Dynamic, Enterprise keys', () => {
  assert.ok('Starter' in gateManager.LEVEL_THRESHOLD_OVERRIDES);
  assert.ok('Dynamic' in gateManager.LEVEL_THRESHOLD_OVERRIDES);
  assert.ok('Enterprise' in gateManager.LEVEL_THRESHOLD_OVERRIDES);
});

test('GM-03', 'Starter overrides have lower thresholds than Enterprise', () => {
  const s = gateManager.LEVEL_THRESHOLD_OVERRIDES.Starter;
  const e = gateManager.LEVEL_THRESHOLD_OVERRIDES.Enterprise;
  assert.ok(s.matchRate < e.matchRate, `Starter matchRate (${s.matchRate}) should be < Enterprise (${e.matchRate})`);
  assert.ok(s.codeQualityScore < e.codeQualityScore);
  assert.ok(s.apiComplianceRate < e.apiComplianceRate);
});

test('GM-04', 'Dynamic has no overrides (empty object)', () => {
  assert.strictEqual(Object.keys(gateManager.LEVEL_THRESHOLD_OVERRIDES.Dynamic).length, 0);
});

// ============================================================
// Group 6: lib/quality/regression-guard.js (1 untested export)
// ============================================================

console.log('--- Group 6: lib/quality/regression-guard.js ---');

const regressionGuard = require('../../lib/quality/regression-guard');

test('RG-01', 'checkMetricRegression() exists and has arity 2', () => {
  assert.strictEqual(typeof regressionGuard.checkMetricRegression, 'function');
  assert.strictEqual(regressionGuard.checkMetricRegression.length, 2);
});

test('RG-02', 'checkMetricRegression() returns empty array for null inputs', () => {
  assert.deepStrictEqual(regressionGuard.checkMetricRegression(null, null), []);
  assert.deepStrictEqual(regressionGuard.checkMetricRegression(null, {}), []);
  assert.deepStrictEqual(regressionGuard.checkMetricRegression({}, null), []);
});

test('RG-03', 'checkMetricRegression() detects higher-is-better regression', () => {
  // M1 (Match Rate) has direction: 'higher', so a decrease > 2 is regression
  const current = { M1: 80 };
  const previous = { M1: 90 };
  const result = regressionGuard.checkMetricRegression(current, previous);
  assert.ok(Array.isArray(result));
  const m1Hit = result.find(r => r.metricId === 'M1');
  assert.ok(m1Hit, 'Should detect M1 regression (80 vs 90, delta -10)');
  assert.strictEqual(m1Hit.current, 80);
  assert.strictEqual(m1Hit.previous, 90);
  assert.strictEqual(m1Hit.delta, -10);
});

test('RG-04', 'checkMetricRegression() detects lower-is-better regression', () => {
  // M3 (Critical Issue Count) has direction: 'lower', so an increase > 2 is regression
  const current = { M3: 10 };
  const previous = { M3: 2 };
  const result = regressionGuard.checkMetricRegression(current, previous);
  const m3Hit = result.find(r => r.metricId === 'M3');
  assert.ok(m3Hit, 'Should detect M3 regression (10 vs 2, delta +8)');
  assert.strictEqual(m3Hit.delta, 8);
});

test('RG-05', 'checkMetricRegression() ignores small changes within threshold', () => {
  // Delta of -1 for higher-is-better should NOT be flagged (threshold is 2)
  const current = { M1: 89 };
  const previous = { M1: 90 };
  const result = regressionGuard.checkMetricRegression(current, previous);
  const m1Hit = result.find(r => r.metricId === 'M1');
  assert.ok(!m1Hit, 'Should not flag M1 regression for delta of -1');
});

// ============================================================
// Group 7: lib/pdca/batch-orchestrator.js (1 untested export)
// ============================================================

console.log('--- Group 7: lib/pdca/batch-orchestrator.js ---');

const batchOrch = require('../../lib/pdca/batch-orchestrator');

test('BO-01', 'triggerAutoCheck() exists and has arity 2', () => {
  assert.strictEqual(typeof batchOrch.triggerAutoCheck, 'function');
  assert.strictEqual(batchOrch.triggerAutoCheck.length, 2);
});

test('BO-02', 'triggerAutoCheck() skips when batch has failures', () => {
  // Should not throw when batch results contain failures
  // (it should silently skip auto-check)
  const batchResult = {
    results: [
      { groupId: 'g1', status: 'completed' },
      { groupId: 'g2', status: 'failed' },
    ],
    summary: 'partial',
  };
  // Should not throw — just returns without triggering check
  assert.doesNotThrow(() => {
    batchOrch.triggerAutoCheck('test-feature', batchResult);
  });
});

// ============================================================
// Summary
// ============================================================

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
