#!/usr/bin/env node
'use strict';

const assert = require('assert');
let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Automation Full Coverage Tests ===\n');

// ── Setup: stub dependencies ──────────────────────────────────────────────

// Stub lib/core before requiring automation
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;
const projectRoot = require('path').resolve(__dirname, '../..');

// Create stubs
const coreStub = {
  getConfig: (key, defaultVal) => defaultVal,
  debugLog: () => {},
  BKIT_PLATFORM: 'darwin',
  PROJECT_DIR: '/tmp/test-project',
  PLUGIN_ROOT: '/tmp/test-plugin',
};

const statusStub = {
  getPdcaStatusFull: () => ({ activeFeatures: ['feat-a', 'feat-b'], features: {} }),
  updatePdcaStatus: () => {},
};

Module._resolveFilename = function (request, parent, ...rest) {
  if (request.endsWith('lib/core') || request === '../core') {
    // Return a fake path; we'll intercept require
  }
  return originalResolveFilename.call(this, request, parent, ...rest);
};

// Patch require cache with stubs
const corePath = require.resolve(projectRoot + '/lib/core');
const statusPath = require.resolve(projectRoot + '/lib/pdca/status');
const originalCoreExports = require.cache[corePath];
const originalStatusExports = require.cache[statusPath];

require.cache[corePath] = { id: corePath, filename: corePath, loaded: true, exports: coreStub };
require.cache[statusPath] = { id: statusPath, filename: statusPath, loaded: true, exports: statusStub };

const automation = require(projectRoot + '/lib/pdca/automation');

// ── Tests ─────────────────────────────────────────────────────────────────

// TC-01: getAutomationLevel — export exists and is a function
test('TC-01', 'getAutomationLevel is a function', () => {
  assert.strictEqual(typeof automation.getAutomationLevel, 'function');
});

// TC-02: getAutomationLevel — returns default 'semi-auto'
test('TC-02', 'getAutomationLevel returns semi-auto by default', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.getAutomationLevel();
  assert.strictEqual(result, 'semi-auto');
});

// TC-03: getAutomationLevel — respects env override
test('TC-03', 'getAutomationLevel respects BKIT_PDCA_AUTOMATION env', () => {
  process.env.BKIT_PDCA_AUTOMATION = 'full-auto';
  const result = automation.getAutomationLevel();
  assert.strictEqual(result, 'full-auto');
  delete process.env.BKIT_PDCA_AUTOMATION;
});

// TC-04: isFullAutoMode — returns boolean
test('TC-04', 'isFullAutoMode returns boolean', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.isFullAutoMode();
  assert.strictEqual(typeof result, 'boolean');
  assert.strictEqual(result, false); // default semi-auto
});

// TC-05: shouldAutoAdvance — returns boolean for semi-auto
test('TC-05', 'shouldAutoAdvance returns boolean', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.shouldAutoAdvance('check');
  assert.strictEqual(typeof result, 'boolean');
  assert.strictEqual(result, true); // semi-auto: check -> true
});

// TC-06: shouldAutoAdvance — returns false for manual
test('TC-06', 'shouldAutoAdvance returns false when manual', () => {
  process.env.BKIT_PDCA_AUTOMATION = 'manual';
  const result = automation.shouldAutoAdvance('check');
  assert.strictEqual(result, false);
  delete process.env.BKIT_PDCA_AUTOMATION;
});

// TC-07: generateAutoTrigger — returns object or null
test('TC-07', 'generateAutoTrigger returns object for auto-advanceable phase', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  // semi-auto: only check auto-advances
  const result = automation.generateAutoTrigger('check', { feature: 'my-feat', matchRate: 50 });
  assert.ok(result !== null);
  assert.strictEqual(result.skill, 'pdca');
});

// TC-08: generateAutoTrigger — v2.1.5 #74 fix: 'plan' phase는 이제 design으로 auto-advance 트리거 가능.
// 진정한 non-advanceable phase('archived')로 검증 변경.
test('TC-08', 'generateAutoTrigger returns null for non-advanceable (terminal) phase', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.generateAutoTrigger('archived', { feature: 'my-feat' });
  assert.strictEqual(result, null);
});

// TC-09: shouldSuggestBatch — returns boolean
test('TC-09', 'shouldSuggestBatch returns boolean based on active features', () => {
  const result = automation.shouldSuggestBatch();
  assert.strictEqual(typeof result, 'boolean');
  assert.strictEqual(result, true); // stub has 2 active features
});

// TC-10: shouldAutoStartPdca — returns boolean
test('TC-10', 'shouldAutoStartPdca returns boolean', () => {
  const result = automation.shouldAutoStartPdca('new-feat', { lines: 200 });
  assert.strictEqual(typeof result, 'boolean');
  assert.strictEqual(result, true); // 200 >= 100 threshold, feature not in status
});

// TC-11: autoAdvancePdcaPhase — v2.1.5 #74 fix: 'plan' is now advanceable to 'design' in semi-auto.
// Use terminal 'archived' phase (no successor) for the null-return contract.
test('TC-11', 'autoAdvancePdcaPhase returns null for terminal (archived) phase', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.autoAdvancePdcaPhase('my-feat', 'archived', {});
  assert.strictEqual(result, null);
});

// TC-12: getHookContext — returns object with expected keys
test('TC-12', 'getHookContext returns object with platform info', () => {
  const ctx = automation.getHookContext();
  assert.strictEqual(typeof ctx, 'object');
  assert.ok('platform' in ctx);
  assert.ok('projectDir' in ctx);
  assert.ok('pluginRoot' in ctx);
  assert.ok('automationLevel' in ctx);
  assert.ok('isFullAuto' in ctx);
  assert.strictEqual(ctx.platform, 'darwin');
});

// TC-13: getNextPdcaActionAfterCompletion — returns object with nextPhase
test('TC-13', 'getNextPdcaActionAfterCompletion returns next action', () => {
  delete process.env.BKIT_PDCA_AUTOMATION;
  const result = automation.getNextPdcaActionAfterCompletion('plan', 'my-feat');
  assert.ok(result !== null);
  assert.strictEqual(result.nextPhase, 'design');
  assert.strictEqual(typeof result.command, 'string');
  assert.strictEqual(typeof result.autoExecute, 'boolean');
});

// TC-14: getNextPdcaActionAfterCompletion — returns null for invalid input
test('TC-14', 'getNextPdcaActionAfterCompletion returns null for missing args', () => {
  const result = automation.getNextPdcaActionAfterCompletion(null, null);
  assert.strictEqual(result, null);
});

// ── Cleanup ───────────────────────────────────────────────────────────────

// Restore original require cache
if (originalCoreExports) require.cache[corePath] = originalCoreExports;
else delete require.cache[corePath];
if (originalStatusExports) require.cache[statusPath] = originalStatusExports;
else delete require.cache[statusPath];
Module._resolveFilename = originalResolveFilename;

// ── Results ───────────────────────────────────────────────────────────────

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
