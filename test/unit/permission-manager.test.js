#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== Permission Manager Unit Tests ===\n');

const {
  checkPermission,
  getToolPermissions,
  isValidPermission,
  getPermissionLevel,
  isMoreRestrictive,
  getAllPermissions,
  shouldBlock,
  requiresConfirmation,
  PERMISSION_LEVELS,
  DEFAULT_PERMISSIONS
} = require('../../lib/permission-manager.js');

// ── PERMISSION_LEVELS ──

test('PM-001', 'PERMISSION_LEVELS: deny is 0', () => {
  assert.strictEqual(PERMISSION_LEVELS.deny, 0);
});

test('PM-002', 'PERMISSION_LEVELS: ask is 1', () => {
  assert.strictEqual(PERMISSION_LEVELS.ask, 1);
});

test('PM-003', 'PERMISSION_LEVELS: allow is 2', () => {
  assert.strictEqual(PERMISSION_LEVELS.allow, 2);
});

test('PM-004', 'PERMISSION_LEVELS: deny < ask < allow ordering', () => {
  assert.ok(PERMISSION_LEVELS.deny < PERMISSION_LEVELS.ask);
  assert.ok(PERMISSION_LEVELS.ask < PERMISSION_LEVELS.allow);
});

// ── DEFAULT_PERMISSIONS ──

test('PM-005', 'DEFAULT_PERMISSIONS: Write is allow', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS.Write, 'allow');
});

test('PM-006', 'DEFAULT_PERMISSIONS: Edit is allow', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS.Edit, 'allow');
});

test('PM-007', 'DEFAULT_PERMISSIONS: Read is allow', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS.Read, 'allow');
});

test('PM-008', 'DEFAULT_PERMISSIONS: Bash is allow', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS.Bash, 'allow');
});

test('PM-009', 'DEFAULT_PERMISSIONS: rm -rf is deny', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS['Bash(rm -rf*)'], 'deny');
});

test('PM-010', 'DEFAULT_PERMISSIONS: rm -r is ask', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS['Bash(rm -r*)'], 'ask');
});

test('PM-011', 'DEFAULT_PERMISSIONS: git push --force is deny', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS['Bash(git push --force*)'], 'deny');
});

test('PM-012', 'DEFAULT_PERMISSIONS: git reset --hard is ask', () => {
  assert.strictEqual(DEFAULT_PERMISSIONS['Bash(git reset --hard*)'], 'ask');
});

// ── isValidPermission ──

test('PM-013', 'isValidPermission: deny is valid', () => {
  assert.strictEqual(isValidPermission('deny'), true);
});

test('PM-014', 'isValidPermission: ask is valid', () => {
  assert.strictEqual(isValidPermission('ask'), true);
});

test('PM-015', 'isValidPermission: allow is valid', () => {
  assert.strictEqual(isValidPermission('allow'), true);
});

test('PM-016', 'isValidPermission: unknown is invalid', () => {
  assert.strictEqual(isValidPermission('block'), false);
});

test('PM-017', 'isValidPermission: empty string is invalid', () => {
  assert.strictEqual(isValidPermission(''), false);
});

// ── getPermissionLevel ──

test('PM-018', 'getPermissionLevel: deny returns 0', () => {
  assert.strictEqual(getPermissionLevel('deny'), 0);
});

test('PM-019', 'getPermissionLevel: ask returns 1', () => {
  assert.strictEqual(getPermissionLevel('ask'), 1);
});

test('PM-020', 'getPermissionLevel: allow returns 2', () => {
  assert.strictEqual(getPermissionLevel('allow'), 2);
});

test('PM-021', 'getPermissionLevel: unknown defaults to allow (2)', () => {
  assert.strictEqual(getPermissionLevel('unknown'), 2);
});

// ── isMoreRestrictive ──

test('PM-022', 'isMoreRestrictive: deny is more restrictive than allow', () => {
  assert.strictEqual(isMoreRestrictive('deny', 'allow'), true);
});

test('PM-023', 'isMoreRestrictive: deny is more restrictive than ask', () => {
  assert.strictEqual(isMoreRestrictive('deny', 'ask'), true);
});

test('PM-024', 'isMoreRestrictive: ask is more restrictive than allow', () => {
  assert.strictEqual(isMoreRestrictive('ask', 'allow'), true);
});

test('PM-025', 'isMoreRestrictive: allow is NOT more restrictive than deny', () => {
  assert.strictEqual(isMoreRestrictive('allow', 'deny'), false);
});

test('PM-026', 'isMoreRestrictive: same permission is NOT more restrictive', () => {
  assert.strictEqual(isMoreRestrictive('ask', 'ask'), false);
});

// ── Exports verification ──

test('PM-027', 'All 10 exports exist', () => {
  assert.strictEqual(typeof checkPermission, 'function');
  assert.strictEqual(typeof getToolPermissions, 'function');
  assert.strictEqual(typeof isValidPermission, 'function');
  assert.strictEqual(typeof getPermissionLevel, 'function');
  assert.strictEqual(typeof isMoreRestrictive, 'function');
  assert.strictEqual(typeof getAllPermissions, 'function');
  assert.strictEqual(typeof shouldBlock, 'function');
  assert.strictEqual(typeof requiresConfirmation, 'function');
  assert.ok(PERMISSION_LEVELS);
  assert.ok(DEFAULT_PERMISSIONS);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
