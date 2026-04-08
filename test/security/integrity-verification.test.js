#!/usr/bin/env node
'use strict';

/**
 * Integrity Verification Security Tests
 * Tests: trust-engine resetScore, audit-logger BKIT_VERSION, checkpoint integrity, guardrail disable protection.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Integrity Verification Security Tests ===\n');

// --- Trust Engine: resetScore no crash ---

test('IV-01', 'trust-engine resetScore does not crash (uses levelHistory, not profile.events)', () => {
  // Setup temp project dir so trust-engine writes to temp
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-test-'));
  const stateDir = path.join(tmpDir, '.bkit', 'state');
  fs.mkdirSync(stateDir, { recursive: true });

  const origCwd = process.cwd();
  process.chdir(tmpDir);

  try {
    // Clear require cache to get fresh module with new cwd
    const modPath = require.resolve('../../lib/control/trust-engine');
    delete require.cache[modPath];
    const trustEngine = require('../../lib/control/trust-engine');

    // resetScore should not throw
    assert.doesNotThrow(() => {
      trustEngine.resetScore(50, 'test_reset');
    }, 'resetScore should not crash');

    // Verify the profile was saved and has levelHistory (not events)
    const profilePath = path.join(stateDir, 'trust-profile.json');
    assert.ok(fs.existsSync(profilePath), 'Trust profile should be saved');
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    assert.ok(Array.isArray(profile.levelHistory), 'Profile should have levelHistory array');
    assert.ok(profile.levelHistory.length > 0, 'levelHistory should have the reset entry');
    assert.strictEqual(profile.levelHistory[profile.levelHistory.length - 1].type, 'score_reset');
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('IV-02', 'trust-engine createDefaultProfile has correct structure', () => {
  const modPath = require.resolve('../../lib/control/trust-engine');
  delete require.cache[modPath];
  const { createDefaultProfile } = require('../../lib/control/trust-engine');
  const profile = createDefaultProfile();

  assert.ok(Array.isArray(profile.levelHistory), 'Should have levelHistory array');
  assert.ok(typeof profile.components === 'object', 'Should have components');
  assert.ok(typeof profile.stats === 'object', 'Should have stats');
  assert.strictEqual(profile.currentLevel, 0, 'Default level should be 0');
  // Ensure no 'events' field exists (old broken schema)
  assert.strictEqual(profile.events, undefined, 'Should NOT have events field');
});

// --- Audit Logger: BKIT_VERSION match ---

test('IV-03', 'audit-logger BKIT_VERSION matches lib/core/version.js', () => {
  const { BKIT_VERSION: auditVersion } = require('../../lib/audit/audit-logger');
  const { BKIT_VERSION: coreVersion } = require('../../lib/core/version');
  assert.strictEqual(auditVersion, coreVersion,
    `audit-logger version "${auditVersion}" != core version "${coreVersion}"`);
});

test('IV-04', 'audit-logger BKIT_VERSION is a valid semver-like string', () => {
  const { BKIT_VERSION } = require('../../lib/audit/audit-logger');
  assert.ok(/^\d+\.\d+\.\d+/.test(BKIT_VERSION), `"${BKIT_VERSION}" is not valid semver`);
});

test('IV-05', 'audit-logger normalizeEntry includes bkitVersion field', () => {
  const { BKIT_VERSION } = require('../../lib/core/version');
  // normalizeEntry is used internally; we test via writeAuditLog + readAuditLogs
  // Instead, we verify the exported BKIT_VERSION is used in the module
  const auditSrc = fs.readFileSync(
    path.resolve(__dirname, '../../lib/audit/audit-logger.js'), 'utf8'
  );
  assert.ok(auditSrc.includes('bkitVersion: BKIT_VERSION'),
    'normalizeEntry should set bkitVersion from BKIT_VERSION constant');
});

// --- Checkpoint Manager: verifyCheckpoint field alignment ---

test('IV-06', 'checkpoint-manager verifyCheckpoint returns valid=false for missing checkpoint', () => {
  const { verifyCheckpoint } = require('../../lib/control/checkpoint-manager');
  const result = verifyCheckpoint('cp-nonexistent-9999999');
  assert.strictEqual(result.valid, false, 'Non-existent checkpoint should be invalid');
});

test('IV-07', 'checkpoint-manager sha256 produces consistent hashes', () => {
  const { sha256 } = require('../../lib/control/checkpoint-manager');
  const data = '{"test":"data","number":42}';
  const hash1 = sha256(data);
  const hash2 = sha256(data);
  assert.strictEqual(hash1, hash2, 'Same data should produce same hash');
  assert.strictEqual(hash1.length, 64, 'SHA-256 hex should be 64 chars');
});

test('IV-08', 'checkpoint-manager createCheckpoint stores pdcaStatusHash', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-cp-test-'));
  const stateDir = path.join(tmpDir, '.bkit', 'state');
  const cpDir = path.join(tmpDir, '.bkit', 'checkpoints');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.mkdirSync(cpDir, { recursive: true });

  // Write a mock pdca-status.json
  const mockStatus = { features: { test: { phase: 'plan' } } };
  fs.writeFileSync(path.join(stateDir, 'pdca-status.json'), JSON.stringify(mockStatus));

  const origCwd = process.cwd();
  process.chdir(tmpDir);

  try {
    const modPath = require.resolve('../../lib/control/checkpoint-manager');
    delete require.cache[modPath];
    const { createCheckpoint, getCheckpoint } = require('../../lib/control/checkpoint-manager');

    const { id } = createCheckpoint('test-feature', 'plan', 'manual', 'test checkpoint');
    const cp = getCheckpoint(id);

    assert.ok(cp, 'Checkpoint should exist');
    assert.ok(cp.pdcaStatusHash, 'Checkpoint should have pdcaStatusHash');
    assert.strictEqual(cp.pdcaStatusHash.length, 64, 'pdcaStatusHash should be 64-char hex');
    assert.deepStrictEqual(cp.pdcaStatus, mockStatus, 'pdcaStatus should match written status');
  } finally {
    process.chdir(origCwd);
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

// --- Guardrail: core rules cannot be disabled ---

test('IV-09', 'destructive-detector disableRule does not remove rule from detection', () => {
  const modPath = require.resolve('../../lib/control/destructive-detector');
  delete require.cache[modPath];
  const dd = require('../../lib/control/destructive-detector');

  // G-001 (Recursive delete) is critical
  const result = dd.disableRule('G-001', 'test');
  assert.strictEqual(result, true, 'disableRule should return true for existing rule');

  // The rule still exists in GUARDRAIL_RULES
  const rules = dd.getRules();
  const g001 = rules.find(r => r.id === 'G-001');
  assert.ok(g001, 'G-001 should still exist in rules list');

  // detect() still works because _disabled is not checked in detect()
  const detection = dd.detect('Bash', 'rm -rf /');
  assert.strictEqual(detection.detected, true,
    'Disabled rule should still detect (detect does not check _disabled flag)');

  // Cleanup: restore the module
  delete require.cache[modPath];
});

test('IV-10', 'destructive-detector all 8 core rules are present', () => {
  const modPath = require.resolve('../../lib/control/destructive-detector');
  delete require.cache[modPath];
  const { GUARDRAIL_RULES } = require('../../lib/control/destructive-detector');

  const expectedIds = ['G-001', 'G-002', 'G-003', 'G-004', 'G-005', 'G-006', 'G-007', 'G-008'];
  for (const id of expectedIds) {
    const found = GUARDRAIL_RULES.find(r => r.id === id);
    assert.ok(found, `Rule ${id} should exist`);
    assert.ok(found.pattern instanceof RegExp, `Rule ${id} should have a RegExp pattern`);
    assert.ok(['critical', 'high', 'medium'].includes(found.severity),
      `Rule ${id} severity should be valid`);
  }
});

test('IV-11', 'destructive-detector critical rules default to deny', () => {
  const modPath = require.resolve('../../lib/control/destructive-detector');
  delete require.cache[modPath];
  const { GUARDRAIL_RULES } = require('../../lib/control/destructive-detector');

  const criticalRules = GUARDRAIL_RULES.filter(r => r.severity === 'critical');
  assert.ok(criticalRules.length >= 2, 'Should have at least 2 critical rules');
  for (const rule of criticalRules) {
    assert.strictEqual(rule.defaultAction, 'deny',
      `Critical rule ${rule.id} should default to deny, got ${rule.defaultAction}`);
  }
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
