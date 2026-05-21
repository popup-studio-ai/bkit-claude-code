#!/usr/bin/env node
/** L1 — sqm-panel render (F5-2 v2.1.19 S5, 2 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const panel = require(path.join(PROJECT_ROOT, 'lib/ui/sqm-panel.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F5-2 sqm-panel render tests');

const baseline = {
  total: 61.25,
  bkitVersion: '2.1.18',
  components: {
    docsCodeSyncRate: { value: 98 },
    sprintSelfDogfoodRunRate: { value: 10 },
    externalDogfooderFeedbackResponseRate: { value: 100 },
    sprintReportKpiConsistency: { value: 79 },
    subAgentDispatchSuccessRate: { value: null },
    conventionContractTestPassRate: { value: 0 },
  },
};

test('TC-F5-2-P1: renderSqmPanel returns multi-line string with components', () => {
  const out = panel.renderSqmPanel({ baseline });
  assert.ok(out.length > 0);
  assert.match(out, /SQM/);
  assert.match(out, /61\.25/);
  assert.match(out, /Docs=Code/);
  assert.match(out, /98/);
});

test('TC-F5-2-P2: renderSqmSummary one-liner format', () => {
  const out = panel.renderSqmSummary(baseline);
  assert.equal(out, 'SQM 61.25 / 100 (v2.1.18)');
  // Missing baseline returns empty
  assert.equal(panel.renderSqmPanel({}), '');
  assert.equal(panel.renderSqmSummary(null), '');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
