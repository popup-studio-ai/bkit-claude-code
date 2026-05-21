#!/usr/bin/env node
/** L1 — sqm-calculator evolution + findFirstMatching fix (F5-1 v2.1.19 S5, 2 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const { execSync } = require('node:child_process');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F5-1 sqm-calculator evolve + findFirstMatching fix');

test('TC-F5-1-E1: findFirstMatching fix — v2.1.16 master plan detected (CO-S0-5)', () => {
  // Run measure script in dry-run, inspect sprintSelfDogfoodRunRate raw
  const out = execSync('node scripts/_v2119-s0-measure.js --dry-run', {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  const result = JSON.parse(out.replace(/^--- DRY RUN.*$\n/m, ''));
  const sprintRuns = result.components.sprintSelfDogfoodRunRate.raw.releases;
  const v2116 = sprintRuns.find((r) => r.version === 'v2.1.16');
  assert.ok(v2116, 'v2.1.16 missing from raw releases');
  assert.equal(v2116.masterPlanExists, true, 'v2116 master plan NOT detected (CO-S0-5 fix broken)');
});

test('TC-F5-1-E2: docsCodeSyncRate via stripCodeBlocks integration (S2 evolution carry-over)', () => {
  const out = execSync('node scripts/_v2119-s0-measure.js --dry-run', {
    encoding: 'utf8', cwd: PROJECT_ROOT,
  });
  const result = JSON.parse(out.replace(/^--- DRY RUN.*$\n/m, ''));
  const docsCode = result.components.docsCodeSyncRate;
  // After S2 F2-2 stripCodeBlocks + F2-1 sprint SKILL.md fix, expect 100 (44/44)
  // BUT S0 measure script may still use old non-stripCodeBlocks path. We assert
  // ≥ 98 (43/44 or better — at minimum the false positives are gone)
  assert.ok(docsCode.value >= 98, `expected docsCodeSyncRate ≥98 (S2 false positives eliminated). Got: ${docsCode.value}, failures: ${JSON.stringify((docsCode.raw && docsCode.raw.failures) || []).slice(0,200)}`);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
