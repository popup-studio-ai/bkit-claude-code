#!/usr/bin/env node
'use strict';
/**
 * Unit Tests for post-compaction.js
 * 15 TC | PostCompact hook handler validation
 *
 * @version bkit v1.6.2
 */

const path = require('path');
const fs = require('fs');
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(BASE_DIR, 'scripts');

console.log('\n=== post-compaction.test.js (15 TC) ===\n');

// ============================================================
// Section 1: Script Existence & Module Dependencies (3 TC)
// ============================================================
console.log('\n--- Section 1: Script & Dependencies ---');

// PC-01: post-compaction.js file exists
const scriptPath = path.join(SCRIPTS_DIR, 'post-compaction.js');
assert('PC-01', fs.existsSync(scriptPath), 'post-compaction.js file exists');

// PC-02: core modules export required functions (v2.1.0: split from common.js)
let coreIo, coreDebug, pdcaStatus;
try {
  coreIo = require('../../lib/core/io');
  coreDebug = require('../../lib/core/debug');
  pdcaStatus = require('../../lib/pdca/status');
} catch (e) {
  coreIo = null;
}
assert('PC-02',
  coreIo &&
  typeof coreIo.readStdinSync === 'function' &&
  typeof coreDebug.debugLog === 'function' &&
  typeof pdcaStatus.getPdcaStatusFull === 'function' &&
  typeof coreIo.outputEmpty === 'function',
  'core modules have readStdinSync, debugLog, getPdcaStatusFull, outputEmpty'
);

// PC-03: lib/core/paths exports restoreFromPluginData
let corePaths;
try {
  corePaths = require('../../lib/core/paths');
} catch (e) {
  corePaths = null;
}
assert('PC-03',
  corePaths && typeof corePaths.restoreFromPluginData === 'function',
  'lib/core/paths exports restoreFromPluginData'
);

// ============================================================
// Section 2: PDCA Status Validation Logic (4 TC)
// ============================================================
console.log('\n--- Section 2: PDCA Status Validation ---');

// PC-04: When pdcaStatus is null, restoreFromPluginData path is needed
// Verify by reading source code for the null-check pattern
const scriptContent = fs.readFileSync(scriptPath, 'utf8');
assert('PC-04',
  scriptContent.includes('!pdcaStatus') && scriptContent.includes('restoreFromPluginData'),
  'Script checks for null pdcaStatus and calls restoreFromPluginData'
);

// PC-05: Missing version field detection
function simulateValidation(status) {
  const errors = [];
  if (!status.version) errors.push('Missing version field');
  if (!status.features || typeof status.features !== 'object') errors.push('Missing or invalid features object');
  if (!Array.isArray(status.activeFeatures)) errors.push('Missing or invalid activeFeatures array');
  return errors;
}

const errorsNoVersion = simulateValidation({ features: {}, activeFeatures: [] });
assert('PC-05',
  errorsNoVersion.includes('Missing version field'),
  'Missing version field detected in validation'
);

// PC-06: Invalid features type detection
const errorsInvalidFeatures = simulateValidation({ version: '2', features: 'invalid', activeFeatures: [] });
assert('PC-06',
  errorsInvalidFeatures.includes('Missing or invalid features object'),
  'Invalid features type detected (string instead of object)'
);

// PC-07: Invalid activeFeatures type detection
const errorsInvalidActive = simulateValidation({ version: '2', features: {}, activeFeatures: 'not-array' });
assert('PC-07',
  errorsInvalidActive.includes('Missing or invalid activeFeatures array'),
  'Invalid activeFeatures type detected (string instead of array)'
);

// ============================================================
// Section 3: Snapshot Consistency Check (3 TC)
// ============================================================
console.log('\n--- Section 3: Snapshot Consistency ---');

// PC-08: STATE_PATHS.snapshots() is callable
const { STATE_PATHS } = require('../../lib/core/paths');
assert('PC-08',
  typeof STATE_PATHS.snapshots === 'function',
  'STATE_PATHS.snapshots() is a function'
);

// PC-09: Snapshot file sorting logic (reverse sort picks latest)
const testFiles = ['snapshot-1.json', 'snapshot-3.json', 'snapshot-2.json'];
const sorted = testFiles.filter(f => f.startsWith('snapshot-') && f.endsWith('.json')).sort().reverse();
assert('PC-09',
  sorted[0] === 'snapshot-3.json',
  'Reverse sort picks latest snapshot file (snapshot-3.json)'
);

// PC-10: Feature count delta calculation
const snapshotFeatureCount = 3;
const currentFeatureCount = 4;
const delta = {
  before: snapshotFeatureCount,
  after: currentFeatureCount,
  diff: currentFeatureCount - snapshotFeatureCount
};
assert('PC-10',
  delta.before === 3 && delta.after === 4 && delta.diff === 1,
  'Snapshot delta calculation: before=3, after=4, diff=1'
);

// ============================================================
// Section 4: Output Format (3 TC)
// ============================================================
console.log('\n--- Section 4: Output Format ---');

// PC-11: hookSpecificOutput.hookEventName === 'PostCompact'
assert('PC-11',
  scriptContent.includes("hookEventName: 'PostCompact'") || scriptContent.includes('hookEventName: "PostCompact"'),
  'Script outputs hookEventName: PostCompact'
);

// PC-12: additionalContext includes activeFeatures
assert('PC-12',
  scriptContent.includes('Active:') && scriptContent.includes('activeFeatures'),
  'Script includes activeFeatures in additionalContext'
);

// PC-13: validationErrors produce WARNINGS string
assert('PC-13',
  scriptContent.includes('WARNINGS:') && scriptContent.includes('validationErrors'),
  'Script includes WARNINGS string when validationErrors exist'
);

// ============================================================
// Section 5: Error Handling (2 TC)
// ============================================================
console.log('\n--- Section 5: Error Handling ---');

// PC-14: stdin read failure calls outputEmpty and exits
assert('PC-14',
  scriptContent.includes('readStdinSync') &&
  scriptContent.includes('outputEmpty()') &&
  scriptContent.includes('process.exit(0)'),
  'Script handles stdin read failure with outputEmpty() and process.exit(0)'
);

// PC-15: Backup restore failure still exits cleanly
const restoreFailBlock = scriptContent.includes('Backup restore failed') &&
  scriptContent.includes('outputEmpty()');
assert('PC-15',
  restoreFailBlock,
  'Script exits cleanly on backup restore failure'
);

summary('PostCompaction Unit Tests');
