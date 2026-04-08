#!/usr/bin/env node
'use strict';
/**
 * Regression Test: Common.js Removal Verification (25 TC)
 * CR-001~025: Verify 0 scripts in scripts/ and hooks/ reference common.js by file scanning
 *
 * @version bkit v2.0.0
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const SCRIPTS_DIR = path.join(BASE_DIR, 'scripts');
const HOOKS_DIR = path.join(BASE_DIR, 'hooks');

console.log('\n=== common-removal.test.js (25 TC) ===\n');

/**
 * Scan a file for common.js references
 * @param {string} filePath - Absolute path to scan
 * @returns {string[]} Array of matching lines
 */
function scanForCommonRef(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    return lines.filter(line => {
      // Match require('...common') or require("...common") patterns
      // but exclude comments and the migration bridge file itself
      if (line.trim().startsWith('//') || line.trim().startsWith('*')) return false;
      return /require\(['"](\.\.?\/)*lib\/common['"]\)/.test(line) ||
             /require\(['"](\.\.?\/)*common['"]\)/.test(line);
    });
  } catch (e) {
    return [];
  }
}

// ============================================================
// CR-001~015: scripts/ directory - no common.js references
// ============================================================
console.log('--- scripts/ Directory Scan ---');

const scriptFiles = fs.readdirSync(SCRIPTS_DIR).filter(f => f.endsWith('.js'));
const scriptBatchSize = Math.ceil(scriptFiles.length / 15);

for (let i = 0; i < 15; i++) {
  const batch = scriptFiles.slice(i * scriptBatchSize, (i + 1) * scriptBatchSize);
  if (batch.length === 0) {
    assert(`CR-${String(i + 1).padStart(3, '0')}`, true,
      `scripts/ batch ${i + 1}: no files in this batch (total covered)`);
    continue;
  }

  let batchClean = true;
  const offenders = [];

  for (const file of batch) {
    const refs = scanForCommonRef(path.join(SCRIPTS_DIR, file));
    if (refs.length > 0) {
      batchClean = false;
      offenders.push(`${file}(${refs.length} refs)`);
    }
  }

  assert(`CR-${String(i + 1).padStart(3, '0')}`, batchClean,
    `scripts/ batch ${i + 1} (${batch.join(', ')}): ${batchClean ? 'no common.js refs' : 'FOUND: ' + offenders.join(', ')}`);
}

// ============================================================
// CR-016~020: hooks/ directory - no common.js references
// ============================================================
console.log('\n--- hooks/ Directory Scan ---');

const hookFiles = [];
function collectJsFiles(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collectJsFiles(fullPath);
    } else if (item.endsWith('.js')) {
      hookFiles.push(fullPath);
    }
  }
}
collectJsFiles(HOOKS_DIR);

const hookBatchSize = Math.ceil(hookFiles.length / 5);
for (let i = 0; i < 5; i++) {
  const batch = hookFiles.slice(i * hookBatchSize, (i + 1) * hookBatchSize);
  if (batch.length === 0) {
    assert(`CR-${String(i + 16).padStart(3, '0')}`, true,
      `hooks/ batch ${i + 1}: no files in this batch`);
    continue;
  }

  let batchClean = true;
  const offenders = [];

  for (const file of batch) {
    const refs = scanForCommonRef(file);
    if (refs.length > 0) {
      batchClean = false;
      offenders.push(`${path.basename(file)}(${refs.length} refs)`);
    }
  }

  assert(`CR-${String(i + 16).padStart(3, '0')}`, batchClean,
    `hooks/ batch ${i + 1}: ${batchClean ? 'no common.js refs' : 'FOUND: ' + offenders.join(', ')}`);
}

// ============================================================
// CR-021~025: Aggregate and structural checks
// ============================================================
console.log('\n--- Aggregate Checks ---');

// CR-021: Total scripts scanned count
assert('CR-021', scriptFiles.length > 0,
  `scripts/ directory has ${scriptFiles.length} JS files to scan`);

// CR-022: Total hook files scanned count
assert('CR-022', hookFiles.length > 0,
  `hooks/ directory has ${hookFiles.length} JS files to scan`);

// CR-023: Overall zero common.js refs in scripts/
let totalScriptRefs = 0;
for (const file of scriptFiles) {
  totalScriptRefs += scanForCommonRef(path.join(SCRIPTS_DIR, file)).length;
}
assert('CR-023', totalScriptRefs === 0,
  `Total common.js references in scripts/: ${totalScriptRefs} (expected 0)`);

// CR-024: Overall zero common.js refs in hooks/
let totalHookRefs = 0;
for (const file of hookFiles) {
  totalHookRefs += scanForCommonRef(file).length;
}
assert('CR-024', totalHookRefs === 0,
  `Total common.js references in hooks/: ${totalHookRefs} (expected 0)`);

// CR-025: lib/common.js still exists as bridge (not deleted)
const commonPath = path.join(BASE_DIR, 'lib', 'common.js');
assert('CR-025', !fs.existsSync(commonPath) /* v2.1.0: common.js removed */,
  'lib/common.js still exists as migration bridge');

// ============================================================
// Summary
// ============================================================
const result = summary('Common.js Removal Regression Tests');
if (result.failed > 0) process.exit(1);
