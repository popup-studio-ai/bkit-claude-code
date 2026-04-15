#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Audit Logger Full Coverage Tests ===\n');

// Stub platform to avoid real PROJECT_DIR dependency
const platformPath = require.resolve('../../lib/core/platform');
require(platformPath); // ensure loaded
const originalPlatform = require.cache[platformPath].exports;
const tmpDir = require('os').tmpdir();
const testProjectDir = path.join(tmpDir, `bkit-audit-test-${Date.now()}`);
require('fs').mkdirSync(testProjectDir, { recursive: true });
require.cache[platformPath].exports = { ...originalPlatform, PROJECT_DIR: testProjectDir };

const audit = require('../../lib/audit/audit-logger');

// === Constants Tests ===

test('C01', 'CATEGORIES is a non-empty array of strings', () => {
  assert.ok(Array.isArray(audit.CATEGORIES), 'CATEGORIES should be an array');
  assert.ok(audit.CATEGORIES.length > 0, 'CATEGORIES should not be empty');
  assert.ok(audit.CATEGORIES.includes('pdca'), 'CATEGORIES should include pdca');
  assert.ok(audit.CATEGORIES.includes('control'), 'CATEGORIES should include control');
  audit.CATEGORIES.forEach(c => assert.strictEqual(typeof c, 'string'));
});

test('C02', 'RESULTS is a non-empty array with expected values', () => {
  assert.ok(Array.isArray(audit.RESULTS));
  assert.deepStrictEqual(audit.RESULTS, ['success', 'failure', 'blocked', 'skipped']);
});

test('C03', 'ACTORS is a non-empty array with expected values', () => {
  assert.ok(Array.isArray(audit.ACTORS));
  assert.deepStrictEqual(audit.ACTORS, ['user', 'agent', 'system', 'hook']);
});

test('C04', 'TARGET_TYPES is a non-empty array with expected values', () => {
  assert.ok(Array.isArray(audit.TARGET_TYPES));
  assert.deepStrictEqual(audit.TARGET_TYPES, ['feature', 'file', 'config', 'agent', 'checkpoint']);
});

test('C05', 'BLAST_RADII is a non-empty array with expected values', () => {
  assert.ok(Array.isArray(audit.BLAST_RADII));
  assert.deepStrictEqual(audit.BLAST_RADII, ['low', 'medium', 'high', 'critical']);
});

test('C06', 'BKIT_VERSION is a valid semver string', () => {
  assert.strictEqual(typeof audit.BKIT_VERSION, 'string');
  assert.ok(/^\d+\.\d+\.\d+/.test(audit.BKIT_VERSION), `BKIT_VERSION "${audit.BKIT_VERSION}" should be semver`);
  // ENH-167 (v2.1.6): hardcoded "2.1.0" assertion 제거 — Docs=Code 원칙으로 단일 진실원(lib/core/version.js)과 일치 검증
  const { BKIT_VERSION } = require('../../lib/core/version');
  assert.strictEqual(audit.BKIT_VERSION, BKIT_VERSION, 'audit.BKIT_VERSION must match centralized version source');
});

// === Helper Function Tests ===

test('H01', 'getAuditDir returns a path ending with .bkit/audit', () => {
  const dir = audit.getAuditDir();
  assert.strictEqual(typeof dir, 'string');
  assert.ok(dir.endsWith(path.join('.bkit', 'audit')), `Expected .bkit/audit suffix, got: ${dir}`);
});

test('H02', 'getAuditFilePath returns a .jsonl path for today by default', () => {
  const fp = audit.getAuditFilePath();
  assert.ok(fp.endsWith('.jsonl'), 'Should end with .jsonl');
  const today = new Date().toISOString().slice(0, 10);
  assert.ok(fp.includes(today), `Should contain today's date ${today}`);
});

test('H03', 'getAuditFilePath accepts a Date object', () => {
  const d = new Date('2025-06-15');
  const fp = audit.getAuditFilePath(d);
  assert.ok(fp.includes('2025-06-15'), 'Should contain specified date');
});

test('H04', 'getAuditFilePath accepts a date string', () => {
  const fp = audit.getAuditFilePath('2024-01-01');
  assert.ok(fp.includes('2024-01-01'), 'Should contain specified date string');
});

// === Category-Specific Logger Tests ===

test('L01', 'logControl is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logControl, 'function');
  assert.strictEqual(audit.logControl.length, 1);
});

test('L02', 'logPermission is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logPermission, 'function');
  assert.strictEqual(audit.logPermission.length, 1);
});

test('L03', 'logCheckpoint is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logCheckpoint, 'function');
  assert.strictEqual(audit.logCheckpoint.length, 1);
});

test('L04', 'logPdca is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logPdca, 'function');
  assert.strictEqual(audit.logPdca.length, 1);
});

test('L05', 'logTrust is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logTrust, 'function');
  assert.strictEqual(audit.logTrust.length, 1);
});

test('L06', 'logSystem is a function with arity 1', () => {
  assert.strictEqual(typeof audit.logSystem, 'function');
  assert.strictEqual(audit.logSystem.length, 1);
});

test('L07', 'logControl writes an entry with category control', () => {
  audit.logControl({ action: 'config_changed', actor: 'user', target: 'test-ctrl' });
  const logs = audit.readAuditLogs();
  const entry = logs.find(e => e.target === 'test-ctrl');
  assert.ok(entry, 'Should find logged entry');
  assert.strictEqual(entry.category, 'control');
});

test('L08', 'logPdca writes an entry with category pdca', () => {
  audit.logPdca({ action: 'phase_transition', actor: 'agent', target: 'test-pdca' });
  const logs = audit.readAuditLogs();
  const entry = logs.find(e => e.target === 'test-pdca');
  assert.ok(entry, 'Should find logged entry');
  assert.strictEqual(entry.category, 'pdca');
});

// === generateWeeklySummary Tests ===

test('W01', 'generateWeeklySummary returns correct structure', () => {
  const summary = audit.generateWeeklySummary();
  assert.strictEqual(typeof summary, 'object');
  assert.ok('weekStart' in summary, 'Should have weekStart');
  assert.ok('weekEnd' in summary, 'Should have weekEnd');
  assert.ok(Array.isArray(summary.dailySummaries), 'dailySummaries should be array');
  assert.strictEqual(summary.dailySummaries.length, 7, 'Should have 7 daily summaries');
  assert.strictEqual(typeof summary.totalActions, 'number');
});

test('W02', 'generateWeeklySummary accepts weekStart parameter', () => {
  const summary = audit.generateWeeklySummary('2025-01-06');
  assert.strictEqual(summary.weekStart, '2025-01-06');
  assert.strictEqual(summary.dailySummaries.length, 7);
});

// === getSessionStats Tests ===

test('S01', 'getSessionStats returns correct structure', () => {
  const stats = audit.getSessionStats();
  assert.strictEqual(typeof stats, 'object');
  assert.strictEqual(typeof stats.totalActions, 'number');
  assert.strictEqual(typeof stats.byCategory, 'object');
  assert.strictEqual(typeof stats.byResult, 'object');
});

test('S02', 'getSessionStats reflects written entries', () => {
  // We wrote entries in L07 and L08, so stats should be non-zero
  const stats = audit.getSessionStats();
  assert.ok(stats.totalActions >= 2, `Expected at least 2 actions, got ${stats.totalActions}`);
});

// === Cleanup ===

// Remove test audit directory
const fs = require('fs');
try {
  fs.rmSync(testProjectDir, { recursive: true, force: true });
} catch (_) { /* ignore cleanup errors */ }

// Restore original platform
require.cache[platformPath].exports = originalPlatform;

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
