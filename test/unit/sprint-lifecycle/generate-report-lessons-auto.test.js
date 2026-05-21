#!/usr/bin/env node
/** L1 — lessons learned multi-aspect aggregation (F3-6 v2.1.19 S3, 4 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const gr = require(path.join(PROJECT_ROOT, 'lib/application/sprint-lifecycle/generate-report.usecase.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F3-6 lessons multi-aspect tests');

test('TC-F3-6-L1: empty sprint → empty lessons', () => {
  const lessons = gr.extractLessons({});
  assert.deepEqual(lessons, []);
});

test('TC-F3-6-L2: iteration aspect — failed iter triggers insight', () => {
  const sprint = { iterateHistory: [{ iteration: 1, matchRate: 70 }, { iteration: 2, matchRate: 100 }] };
  const lessons = gr.extractLessons(sprint);
  const iter = lessons.find(l => l.aspect === 'iteration');
  assert.ok(iter);
  assert.match(iter.insight, /1 iteration/);
});

test('TC-F3-6-L3: phase_duration aspect — slow phase identified', () => {
  const sprint = { phaseHistory: [{ phase: 'do', durationMs: 5 * 3600 * 1000 }] };
  const lessons = gr.extractLessons(sprint);
  const dur = lessons.find(l => l.aspect === 'phase_duration');
  assert.ok(dur);
  assert.match(dur.insight, /do/);
});

test('TC-F3-6-L4: gate_failure_resolution aspect — resolved field present', () => {
  const sprint = {
    lastGateFailure: { phase: 'plan', toPhase: 'design', resolvedAt: '2026-05-21T10:00:00Z', resolutionReason: 'gates measured' },
  };
  const lessons = gr.extractLessons(sprint);
  const gfr = lessons.find(l => l.aspect === 'gate_failure_resolution');
  assert.ok(gfr);
  assert.match(gfr.insight, /gates measured/);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
