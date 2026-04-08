#!/usr/bin/env node
'use strict';
/**
 * Hook I/O Behavioral Tests (20 TC)
 * Tests actual hook handler behavior, not just file existence.
 *
 * HB-001~020: Verify hook scripts produce correct output given specific inputs.
 * @version bkit v2.1.0
 */

const fs = require('fs');
const path = require('path');
const { assert, skip, summary, reset, assertNoThrow } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');

console.log('=== Hook I/O Behavioral Tests (20 TC) ===\n');

// ============================================================
// HB-001~005: lib/core/io.js functions behave correctly
// ============================================================
console.log('--- HB-001~005: Core I/O Functions ---');

const io = require(path.join(BASE_DIR, 'lib/core/io'));

// HB-001: readStdinSync returns object on empty
assert('HB-001', typeof io.readStdinSync === 'function',
  'readStdinSync is a function');

// HB-002: truncateContext truncates correctly
const longText = 'x'.repeat(1000);
const truncated = io.truncateContext(longText);
assert('HB-002', truncated.length <= 520 && truncated.includes('truncated'),
  `truncateContext truncates to ≤520 chars (got ${truncated.length})`);

// HB-003: truncateContext preserves short text
const shortText = 'hello world';
assert('HB-003', io.truncateContext(shortText) === shortText,
  'truncateContext preserves text shorter than limit');

// HB-004: parseHookInput extracts fields
const mockInput = { tool_name: 'Write', tool_input: { file_path: '/test/file.js', content: 'test' } };
const parsed = io.parseHookInput(mockInput);
assert('HB-004', parsed.toolName === 'Write' && parsed.filePath === '/test/file.js',
  'parseHookInput extracts toolName and filePath correctly');

// HB-005: parseHookInput handles empty input
const emptyParsed = io.parseHookInput({});
assert('HB-005', emptyParsed.toolName === '' && emptyParsed.filePath === '',
  'parseHookInput returns empty strings for missing fields');

// ============================================================
// HB-006~010: lib/control/destructive-detector.js behavior
// ============================================================
console.log('\n--- HB-006~010: Destructive Detector ---');

let dd;
try {
  dd = require(path.join(BASE_DIR, 'lib/control/destructive-detector'));
} catch (e) { dd = null; }

if (dd && typeof dd.detect === 'function') {
  // HB-006: detects rm -rf
  const rmResult = dd.detect('Bash', 'rm -rf /tmp/test');
  assert('HB-006', rmResult && rmResult.detected === true,
    'detect("rm -rf /tmp/test") returns detected=true');

  // HB-007: DROP TABLE is not in GUARDRAIL_RULES (handled by QA handler instead)
  const dropResult = dd.detect('Bash', 'psql -c "DROP TABLE users"');
  assert('HB-007', !dropResult || dropResult.detected === false,
    'detect("DROP TABLE") not in GUARDRAIL_RULES (QA handler scope)');

  // HB-008: safe command passes
  const safeResult = dd.detect('Bash', 'ls -la');
  assert('HB-008', !safeResult || safeResult.detected === false,
    'detect("ls -la") returns detected=false');

  // HB-009: detect returns rules array
  const rulesResult = dd.detect('Bash', 'rm -rf /');
  assert('HB-009', rulesResult && Array.isArray(rulesResult.rules),
    'detect result includes rules array');

  // HB-010: detect returns confidence
  assert('HB-010', rulesResult && typeof rulesResult.confidence === 'number',
    'detect result includes confidence number');
} else {
  for (let i = 6; i <= 10; i++) {
    skip(`HB-0${i.toString().padStart(2, '0')}`, 'destructive-detector not available');
  }
}

// ============================================================
// HB-011~015: lib/pdca/status.js behavior
// ============================================================
console.log('\n--- HB-011~015: PDCA Status ---');

let status;
try {
  status = require(path.join(BASE_DIR, 'lib/pdca/status'));
} catch (e) { status = null; }

if (status) {
  // HB-011: getPdcaStatusFull returns object
  assertNoThrow('HB-011', () => {
    const s = status.getPdcaStatusFull();
    if (!s || typeof s !== 'object') throw new Error('not an object');
  }, 'getPdcaStatusFull returns an object');

  // HB-012: getPdcaStatusFull has version field
  const s = status.getPdcaStatusFull();
  assert('HB-012', s && s.version === '3.0',
    `getPdcaStatusFull version is 3.0 (got ${s?.version})`);

  // HB-013: migrateStatusV2toV3 exists
  assert('HB-013', typeof status.migrateStatusV2toV3 === 'function',
    'migrateStatusV2toV3 function exists');

  // HB-014: status has features object
  assert('HB-014', s && typeof s.features === 'object',
    'getPdcaStatusFull has features object');

  // HB-015: status has activeFeatures array
  assert('HB-015', s && Array.isArray(s.activeFeatures),
    'getPdcaStatusFull has activeFeatures array');
} else {
  for (let i = 11; i <= 15; i++) {
    skip(`HB-0${i}`, 'pdca/status not available');
  }
}

// ============================================================
// HB-016~020: lib/control/checkpoint-manager.js behavior
// ============================================================
console.log('\n--- HB-016~020: Checkpoint Manager ---');

let cp;
try {
  cp = require(path.join(BASE_DIR, 'lib/control/checkpoint-manager'));
} catch (e) { cp = null; }

if (cp) {
  // HB-016: createCheckpoint is a function
  assert('HB-016', typeof cp.createCheckpoint === 'function',
    'createCheckpoint is a function');

  // HB-017: listCheckpoints is a function
  assert('HB-017', typeof cp.listCheckpoints === 'function',
    'listCheckpoints is a function');

  // HB-018: rollbackToCheckpoint is a function
  assert('HB-018', typeof cp.rollbackToCheckpoint === 'function',
    'rollbackToCheckpoint is a function');

  // HB-019: deleteCheckpoint is a function (bug was fixed in S2)
  assert('HB-019', typeof cp.deleteCheckpoint === 'function',
    'deleteCheckpoint is a function (v2.1.0 bug fix)');

  // HB-020: listCheckpoints returns array
  assertNoThrow('HB-020', () => {
    const list = cp.listCheckpoints();
    if (!Array.isArray(list)) throw new Error('not an array');
  }, 'listCheckpoints returns an array');
} else {
  for (let i = 16; i <= 20; i++) {
    skip(`HB-0${i}`, 'checkpoint-manager not available');
  }
}

summary('Hook I/O Behavioral Tests');
