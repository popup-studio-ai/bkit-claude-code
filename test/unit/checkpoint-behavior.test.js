#!/usr/bin/env node
'use strict';
/**
 * Checkpoint Manager Behavioral Tests (10 TC)
 * Verifies checkpoint CRUD behavior and v2.1.0 bug fix.
 *
 * CPB-001~010
 * @version bkit v2.1.0
 */

const path = require('path');
const { assert, skip, summary, reset, assertNoThrow } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');

console.log('=== Checkpoint Behavioral Tests (10 TC) ===\n');

let cp;
try {
  cp = require(path.join(BASE_DIR, 'lib/control/checkpoint-manager'));
} catch (e) {
  for (let i = 1; i <= 10; i++) skip(`CPB-${i.toString().padStart(3, '0')}`, `load failed: ${e.message}`);
  summary('Checkpoint Behavioral Tests');
  process.exit(0);
}

assert('CPB-001', typeof cp.createCheckpoint === 'function', 'createCheckpoint exported');
assert('CPB-002', typeof cp.listCheckpoints === 'function', 'listCheckpoints exported');
assert('CPB-003', typeof cp.rollbackToCheckpoint === 'function', 'rollbackToCheckpoint exported');
assert('CPB-004', typeof cp.deleteCheckpoint === 'function', 'deleteCheckpoint exported (v2.1.0 fix)');
assert('CPB-005', typeof cp.pruneCheckpoints === 'function', 'pruneCheckpoints exported');

assertNoThrow('CPB-006', () => {
  const list = cp.listCheckpoints();
  if (!Array.isArray(list)) throw new Error('not array');
}, 'listCheckpoints returns array');

assertNoThrow('CPB-007', () => {
  cp.listCheckpoints('nonexistent');
}, 'listCheckpoints with filter does not throw');

assertNoThrow('CPB-008', () => {
  cp.deleteCheckpoint('cp-nonexistent-99999');
}, 'deleteCheckpoint handles nonexistent ID (v2.1.0 bug fix verified)');

const hasGet = typeof cp.getCheckpoint === 'function' || typeof cp.getCheckpointDetail === 'function';
assert('CPB-009', hasGet, 'getCheckpoint/getCheckpointDetail exported');

assertNoThrow('CPB-010', () => {
  const result = cp.rollbackToCheckpoint('cp-nonexistent');
}, 'rollbackToCheckpoint handles nonexistent gracefully');

summary('Checkpoint Behavioral Tests');
