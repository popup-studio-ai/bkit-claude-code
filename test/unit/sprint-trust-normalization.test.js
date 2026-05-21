#!/usr/bin/env node
/**
 * F3 Unit Test — normalizeTrustLevel precedence + `--trust` alias (v2.1.18 #102).
 *
 * Validates that `args.trust` (CLI `--trust L3` natural mapping per skill
 * docs §10.2) is honored alongside `args.trustLevel` and
 * `args.trustLevelAtStart`, with the documented precedence:
 *
 *     trustLevel > trust > trustLevelAtStart > DEFAULT_TRUST_LEVEL ('L3')
 *
 * Plan SC: F3 — scripts/sprint-handler.js:721 + 750 normalize unification
 * Design Ref: docs/02-design/features/v2118-sprint-trust-ux-fix.design.md §4.3
 *
 * Cases A-G (CTO §F 권고 추가 case G: 기존 사용자 protection)
 *
 * @module test/unit/sprint-trust-normalization.test
 */

'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

// Inject normalizeTrustLevel via require — exported from sprint-handler indirectly via patching
// Direct test: monkey-patch require cache and dynamically import internal function.
// Cleaner approach: spawnSync into a node -e eval that resolves normalizeTrustLevel.
const { spawnSync } = require('node:child_process');

/**
 * Run normalizeTrustLevel(args) in a fresh node process and parse JSON result.
 * (Avoids polluting the parent process require cache + mirrors how the handler
 * is invoked in production CLI mode.)
 * @param {Object|null} args
 * @returns {string} normalized trust level
 */
function normalize(args) {
  // The sprint-handler module does not re-export normalizeTrustLevel; we tap
  // into the closure by monkey-patching via require and reading the function
  // body directly. Simpler: use spawnSync with a small eval script.
  const argsJson = JSON.stringify(args);
  const code = `
    const h = require('${path.join(PROJECT_ROOT, 'scripts/sprint-handler.js').replace(/\\/g, '\\\\')}');
    // sprint-handler does not export normalizeTrustLevel directly. We test via
    // its observable side-effect: handleSprintAction('trust', ...) reads through
    // the same chain. Use 'init' to verify normalizeTrustLevel propagation.
    // For unit-level assertion, parse the source file directly:
    const fs = require('fs');
    const src = fs.readFileSync('${path.join(PROJECT_ROOT, 'scripts/sprint-handler.js').replace(/\\/g, '\\\\')}', 'utf8');
    // Extract & eval normalizeTrustLevel (closure-safe within this child process)
    const fnMatch = src.match(/function normalizeTrustLevel\\(args\\)[\\s\\S]*?\\n\\}/);
    if (!fnMatch) { console.log('ERROR_FN_NOT_FOUND'); process.exit(2); }
    const VALID = ['L0','L1','L2','L3','L4'];
    const DEFAULT_TRUST_LEVEL = 'L3';
    const VALID_TRUST_LEVELS = VALID;
    eval(fnMatch[0]);
    const args = ${argsJson};
    console.log(normalizeTrustLevel(args));
  `;
  const r = spawnSync('node', ['-e', code], { encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`normalize spawn failed: ${r.stderr || r.stdout}`);
  }
  return r.stdout.trim();
}

let pass = 0;
let fail = 0;
const fails = [];

function test(name, fn) {
  try {
    fn();
    pass++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    fail++;
    fails.push({ name, err });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

console.log('F3 Unit — normalizeTrustLevel precedence chain (v2.1.18 #102)\n');

test('Case A: args.trustLevel only', () => {
  assert.strictEqual(normalize({ trustLevel: 'L3' }), 'L3');
});
test('Case B (★ F3 fix target): args.trust only — was silently ignored', () => {
  assert.strictEqual(normalize({ trust: 'L3' }), 'L3');
});
test('Case C: args.trustLevelAtStart only', () => {
  assert.strictEqual(normalize({ trustLevelAtStart: 'L3' }), 'L3');
});
test('Case D: precedence trustLevel > trust', () => {
  assert.strictEqual(normalize({ trust: 'L2', trustLevel: 'L3' }), 'L3');
});
test('Case E: invalid value falls back to L3 default', () => {
  assert.strictEqual(normalize({ trust: 'invalid' }), 'L3');
});
test('Case F: case-insensitive', () => {
  assert.strictEqual(normalize({ trust: 'l2' }), 'L2');
});
test('Case G (★ CTO §F protection): existing --trustLevel user precedence preserved', () => {
  // Triple-source: trustLevel wins, trust + trustLevelAtStart ignored (regression-protect)
  assert.strictEqual(normalize({ trustLevel: 'L4', trust: 'L1', trustLevelAtStart: 'L0' }), 'L4');
});

console.log(`\nResults: ${pass} pass / ${fail} fail`);
if (fail > 0) {
  console.log('\nFailures:');
  for (const f of fails) console.log(`  ${f.name}: ${f.err.message}`);
  process.exit(1);
}
process.exit(0);
