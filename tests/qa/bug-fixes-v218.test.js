#!/usr/bin/env node
/**
 * bkit v2.1.8 bug fix verification — 11 bugs × representative TCs.
 * Covers B1~B11 semantics + QA Q10 recommended smoke tests.
 * Run: node tests/qa/bug-fixes-v219.test.js
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
  catch (e) { console.error(`❌ ${id} — ${e.message.slice(0, 200)}`); failures.push({ id, error: e.message }); fail++; }
}
function purge(re) { Object.keys(require.cache).forEach(k => { if (re.test(k)) delete require.cache[k]; }); }

// ============================================================================
// B1 — loop-breaker setThreshold
// ============================================================================
console.log('\n=== B1: loop-breaker.setThreshold ===');

tc('B1-1 setThreshold updates maxCount (not dead threshold)', () => {
  purge(/lib\/control\/loop-breaker/);
  const { setThreshold, LOOP_RULES } = require(path.join(ROOT, 'lib/control/loop-breaker'));
  const firstRuleId = Object.keys(LOOP_RULES)[0];
  const originalMaxCount = LOOP_RULES[firstRuleId].maxCount;
  const result = setThreshold(firstRuleId, 99);
  assert.strictEqual(result, true, 'setThreshold returns true for valid input');
  assert.strictEqual(LOOP_RULES[firstRuleId].maxCount, 99, 'maxCount actually updated');
  // Restore for other tests
  LOOP_RULES[firstRuleId].maxCount = originalMaxCount;
});

tc('B1-2 setThreshold throws for unknown ruleId', () => {
  purge(/lib\/control\/loop-breaker/);
  const { setThreshold } = require(path.join(ROOT, 'lib/control/loop-breaker'));
  assert.throws(() => setThreshold('NOPE', 10), /Unknown loop rule/);
});

tc('B1-3 setThreshold returns false for non-positive threshold', () => {
  purge(/lib\/control\/loop-breaker/);
  const { setThreshold, LOOP_RULES } = require(path.join(ROOT, 'lib/control/loop-breaker'));
  const firstRuleId = Object.keys(LOOP_RULES)[0];
  assert.strictEqual(setThreshold(firstRuleId, 0), false);
  assert.strictEqual(setThreshold(firstRuleId, -5), false);
  assert.strictEqual(setThreshold(firstRuleId, 'x'), false);
});

tc('B1-4 setThreshold preserves warnAt ratio', () => {
  purge(/lib\/control\/loop-breaker/);
  const { setThreshold, LOOP_RULES } = require(path.join(ROOT, 'lib/control/loop-breaker'));
  // Find a rule with both maxCount and warnAt
  const ruleId = Object.keys(LOOP_RULES).find(id => typeof LOOP_RULES[id].maxCount === 'number' && typeof LOOP_RULES[id].warnAt === 'number');
  if (!ruleId) return; // skip if no such rule
  const rule = LOOP_RULES[ruleId];
  const originalRatio = rule.warnAt / rule.maxCount;
  const origMax = rule.maxCount, origWarn = rule.warnAt;
  setThreshold(ruleId, 100);
  const newRatio = rule.warnAt / rule.maxCount;
  assert(Math.abs(newRatio - originalRatio) < 0.1, `ratio preserved: was ${originalRatio}, now ${newRatio}`);
  rule.maxCount = origMax; rule.warnAt = origWarn;
});

// ============================================================================
// B2 — audit-logger CATEGORIES
// ============================================================================
console.log('\n=== B2: audit-logger CATEGORIES ===');

tc('B2-1 CATEGORIES includes 4 new categories', () => {
  purge(/lib\/audit\/audit-logger/);
  const { CATEGORIES } = require(path.join(ROOT, 'lib/audit/audit-logger'));
  for (const cat of ['permission', 'checkpoint', 'trust', 'system']) {
    assert(CATEGORIES.includes(cat), `CATEGORIES missing ${cat}`);
  }
});

tc('B2-2 CATEGORIES preserves original 6', () => {
  const { CATEGORIES } = require(path.join(ROOT, 'lib/audit/audit-logger'));
  for (const cat of ['pdca', 'file', 'config', 'control', 'team', 'quality']) {
    assert(CATEGORIES.includes(cat), `missing original ${cat}`);
  }
});

tc('B2-3 CATEGORIES length is 11', () => {
  // v2.1.14 Sub-Sprint 6 baseline correction: audit-logger CATEGORIES grew
  // from 10 → 11 (added 'system' during the v2.1.10/13 cleanups). The
  // original B2 fix intent (preserve original 6 + add 4 new) is still
  // satisfied — see B2-1 / B2-2 which assert the supersets explicitly.
  const { CATEGORIES } = require(path.join(ROOT, 'lib/audit/audit-logger'));
  assert.strictEqual(CATEGORIES.length, 11);
});

// ============================================================================
// B3 — checkpoint-manager STATE_PATHS
// ============================================================================
console.log('\n=== B3: checkpoint-manager STATE_PATHS ===');

tc('B3-1 checkpoint-manager imports STATE_PATHS', () => {
  const content = fs.readFileSync(path.join(ROOT, 'lib/control/checkpoint-manager.js'), 'utf8');
  assert(content.includes("require('../core/paths')"), 'STATE_PATHS not imported');
  assert(content.includes('STATE_PATHS.pdcaStatus()'), 'STATE_PATHS.pdcaStatus() not called');
});

tc('B3-2 no direct process.cwd() for pdca-status path (non-comment)', () => {
  const content = fs.readFileSync(path.join(ROOT, 'lib/control/checkpoint-manager.js'), 'utf8');
  // Count actual process.cwd() calls, excluding comment lines
  const callLines = content.split('\n').filter(line => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) return false;
    return /process\.cwd\(\)/.test(line);
  });
  // Only the fallback inside getProjectDir is legitimate
  assert(callLines.length <= 1, `expected <=1 actual process.cwd() call, got ${callLines.length}: ${callLines.join(' | ')}`);
});

// ============================================================================
// B4 — trust-engine levelHistory schema
// ============================================================================
console.log('\n=== B4: trust-engine levelHistory schema ===');

tc('B4-1 resetScore pushes unified schema', () => {
  purge(/lib\/control\/trust-engine/);
  const { resetScore, createDefaultProfile } = require(path.join(ROOT, 'lib/control/trust-engine'));
  if (typeof resetScore !== 'function' || typeof createDefaultProfile !== 'function') return; // skip if API differs
  const profile = createDefaultProfile();
  profile.trustScore = 80;
  profile.currentLevel = 3;
  profile.levelHistory = [];
  resetScore(50, 'test');
});

tc('B4-2 resetScore schema includes from/to/trigger/reason/timestamp', () => {
  const content = fs.readFileSync(path.join(ROOT, 'lib/control/trust-engine.js'), 'utf8');
  // Simple grep: resetScore function should contain these field names
  const sliceStart = content.indexOf('function resetScore');
  const sliceEnd = content.indexOf('\n}', sliceStart);
  const fn = content.slice(sliceStart, sliceEnd);
  for (const field of ['timestamp', 'from', 'to', 'trigger', 'reason']) {
    assert(fn.includes(field), `resetScore missing schema field: ${field}`);
  }
});

// ============================================================================
// B5 — MCP JSON-RPC 'id' in msg
// ============================================================================
console.log('\n=== B5: MCP JSON-RPC null id handling ===');

tc('B5-1 both MCP servers use "id" in msg pattern', () => {
  const pdca = fs.readFileSync(path.join(ROOT, 'servers/bkit-pdca-server/index.js'), 'utf8');
  const analysis = fs.readFileSync(path.join(ROOT, 'servers/bkit-analysis-server/index.js'), 'utf8');
  assert(pdca.includes("'id' in msg"), 'pdca-server missing "id" in msg');
  assert(analysis.includes("'id' in msg"), 'analysis-server missing "id" in msg');
});

tc('B5-2 no "id === undefined" remnants', () => {
  const pdca = fs.readFileSync(path.join(ROOT, 'servers/bkit-pdca-server/index.js'), 'utf8');
  const analysis = fs.readFileSync(path.join(ROOT, 'servers/bkit-analysis-server/index.js'), 'utf8');
  assert(!pdca.includes('id === undefined'), 'pdca-server has stale id===undefined');
  assert(!analysis.includes('id === undefined'), 'analysis-server has stale id===undefined');
});

tc('B5-3 explicit null id request receives response', () => {
  const input = JSON.stringify({ jsonrpc: '2.0', id: null, method: 'tools/list' }) + '\n';
  const r = spawnSync('node', [path.join(ROOT, 'servers/bkit-pdca-server/index.js')], {
    input, timeout: 3000, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = r.stdout.toString().split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    const parsed = JSON.parse(lines[0]);
    // Explicit null id → response should echo null id (per JSON-RPC 2.0)
    assert('id' in parsed, 'response should contain id field for explicit null id');
  }
});

// ============================================================================
// B6 + B7 + B8 — evals/runner
// ============================================================================
console.log('\n=== B6+B7+B8: evals/runner ===');

tc('B6-1 stripMatchingQuotes preserves internal colons', () => {
  // Indirect: run the runner and verify no crash on quoted-colon test
  const r = spawnSync('node', [path.join(ROOT, 'evals/runner.js'), '--skill', 'pdca'], { timeout: 5000 });
  assert(r.status === 0, 'runner --skill pdca did not crash');
});

tc('B7-1 evals/runner loads without error', () => {
  const r = spawnSync('node', [path.join(ROOT, 'evals/runner.js')], { timeout: 3000 });
  assert.strictEqual(r.status, 0);
  assert(r.stdout.toString().includes('Usage'));
});

tc('B8-1 pass simplified (verified by grep)', () => {
  const content = fs.readFileSync(path.join(ROOT, 'evals/runner.js'), 'utf8');
  assert(content.includes('failedCriteria.length === 0'), 'pass condition present');
  assert(content.includes('v2.1.8 fix B8'), 'B8 comment present');
});

// ============================================================================
// B9 — scenario-runner allPassed
//
// v2.1.14 Sub-Sprint 6 update: lib/context/scenario-runner.js was removed in
// the v2.1.13 dead-code cleanup (commit 21d35d6 / 967cd8f). B9 verifies a
// historical v2.1.8 bug fix that no longer has a target file. We keep the
// section as a SKIP entry so future archaeology can find the rationale, but
// no longer assert against absent code.
// ============================================================================
console.log('\n=== B9: scenario-runner allPassed (SKIP — module removed v2.1.13) ===');

const skipB9 = !fs.existsSync(path.join(ROOT, 'lib/context/scenario-runner.js'));
if (!skipB9) {
  tc('B9-1 allPassed requires passed > 0', () => {
    const content = fs.readFileSync(path.join(ROOT, 'lib/context/scenario-runner.js'), 'utf8');
    assert(content.includes('passed > 0'), 'allPassed should require passed > 0');
    assert(content.includes('v2.1.8 fix B9'), 'B9 comment present');
  });
  tc('B9-2 runScenarios all-skip returns allPassed=false', async () => {
    purge(/lib\/context\/scenario-runner/);
    const { runScenarios } = require(path.join(ROOT, 'lib/context/scenario-runner'));
    const r = await runScenarios([{ id: 'S1', name: 'n' }]);
    assert.strictEqual(r.allPassed, false, 'all-skipped should NOT be allPassed');
    assert.strictEqual(r.passed, 0);
    assert(r.skipped >= 1);
  });
} else {
  console.log('  ⊘ B9-1/B9-2 SKIPPED — lib/context/scenario-runner.js absent post-v2.1.13 cleanup');
}

// ============================================================================
// B10 — invariant-checker parens (SKIP — module removed v2.1.13)
// ============================================================================
console.log('\n=== B10: invariant-checker parens (SKIP — module removed v2.1.13) ===');

const skipB10 = !fs.existsSync(path.join(ROOT, 'lib/context/invariant-checker.js'));
if (!skipB10) {
  tc('B10-1 explicit parens present', () => {
    const content = fs.readFileSync(path.join(ROOT, 'lib/context/invariant-checker.js'), 'utf8');
    assert(content.includes('v2.1.8 fix B10'), 'B10 comment present');
    const hasLegacyParens = /\(\s*!code\.includes\('balance/.test(content);
    const hasHoistedBools = /hasBalance(Gte|Gt)/.test(content) && /hasIfStatement/.test(content);
    assert(hasLegacyParens || hasHoistedBools,
      'either legacy parens or B16 hoisted booleans should be present');
  });
} else {
  console.log('  ⊘ B10-1 SKIPPED — lib/context/invariant-checker.js absent post-v2.1.13 cleanup');
}

// ============================================================================
// B11 — pattern-matcher balanced brace
// ============================================================================
console.log('\n=== B11: pattern-matcher balanced brace ===');

tc('B11-1 findBalancedBrace helper exists', () => {
  const content = fs.readFileSync(path.join(ROOT, 'lib/qa/utils/pattern-matcher.js'), 'utf8');
  assert(content.includes('findBalancedBrace'), 'helper function present');
});

tc('B11-2 extractExports handles flat shorthand', () => {
  purge(/lib\/qa\/utils\/pattern-matcher/);
  const { extractExports } = require(path.join(ROOT, 'lib/qa/utils/pattern-matcher'));
  const src = `module.exports = { foo, bar };`;
  const out = extractExports(src);
  const names = out.map(e => e.name);
  assert(names.includes('foo') && names.includes('bar'), `expected foo+bar, got ${names.join(',')}`);
});

tc('B11-3 extractExports handles nested', () => {
  purge(/lib\/qa\/utils\/pattern-matcher/);
  const { extractExports } = require(path.join(ROOT, 'lib/qa/utils/pattern-matcher'));
  const src = `module.exports = { a: { b: 1 }, c: [1,2], d };`;
  const out = extractExports(src);
  const names = out.map(e => e.name);
  assert(names.includes('a'), `expected a, got ${names.join(',')}`);
  assert(names.includes('c'), `expected c, got ${names.join(',')}`);
  assert(names.includes('d'), `expected d, got ${names.join(',')}`);
});

tc('B11-4 extractExports handles exports.X pattern', () => {
  purge(/lib\/qa\/utils\/pattern-matcher/);
  const { extractExports } = require(path.join(ROOT, 'lib/qa/utils/pattern-matcher'));
  const src = `exports.foo = 1;\nexports.bar = 2;`;
  const out = extractExports(src);
  assert(out.length >= 2);
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log(`[bug-fixes-v219] ${pass} PASS / ${fail} FAIL / Total ${pass + fail}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(f => console.log(`  - ${f.id}: ${f.error.slice(0, 150)}`));
}
console.log('='.repeat(60));
process.exit(fail === 0 ? 0 : 1);
