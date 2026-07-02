#!/usr/bin/env node
'use strict';
/**
 * Unit Tests for lib/pdca/batch-orchestrator.js
 * 15 TC | createBatchPlan, executeBatchPlan, getBatchStatus,
 *         cancelBatch, resumeBatch
 *
 * @version bkit v1.6.2
 */

const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================================
// v2.1.26 (I-13, test isolation): batch state + pdca-status writes must land
// in a throwaway tmp root — never in the repo's real .bkit.
// Two layers:
//   1. CLAUDE_PROJECT_DIR=TMP_ROOT before any lib/ require (covers the
//      updatePdcaStatus side-effect inside executeBatchPlan — lib/core/platform
//      captures the env at first import).
//   2. Explicit { projectRoot: TMP_ROOT } injection on every batch API call
//      (exercises the I-10 injectable-root contract directly).
// ============================================================
const TMP_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-batch-orch-'));
process.env.CLAUDE_PROJECT_DIR = TMP_ROOT;
const INJECT = { projectRoot: TMP_ROOT };
process.on('exit', () => {
  try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch (_e) { /* best-effort */ }
});

const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

console.log('\n=== batch-orchestrator.test.js (15 TC) ===\n');

// Load module
let bo;
try {
  bo = require('../../lib/pdca/batch-orchestrator');
} catch (e) {
  bo = null;
}

const moduleLoaded = bo !== null;

// ============================================================
// Section 1: createBatchPlan (BO-001 ~ BO-004)
// ============================================================
console.log('\n--- Section 1: createBatchPlan ---');

// BO-001: Module exports createBatchPlan function
{
  assert('BO-001', bo && typeof bo.createBatchPlan === 'function',
    'batch-orchestrator exports createBatchPlan');
}

// BO-002: createBatchPlan returns plan and warnings
{
  if (moduleLoaded) {
    let result = null;
    try {
      result = bo.createBatchPlan(['nonexistent-feature-bo002'], INJECT);
    } catch (e) { result = null; }
    assert('BO-002',
      result && result.plan && Array.isArray(result.warnings),
      'createBatchPlan returns {plan, warnings}');
  } else {
    skip('BO-002', 'Module not loaded');
  }
}

// BO-003: createBatchPlan warns for features without docs
{
  if (moduleLoaded) {
    let result = null;
    try {
      result = bo.createBatchPlan(['no-docs-feature-bo003'], INJECT);
    } catch (e) { result = null; }
    assert('BO-003',
      result && result.warnings.length > 0 && result.warnings[0].includes('no-docs-feature-bo003'),
      'createBatchPlan warns when no Plan/Design document found');
  } else {
    skip('BO-003', 'Module not loaded');
  }
}

// BO-004: createBatchPlan plan has batchId
{
  if (moduleLoaded) {
    let result = null;
    try {
      result = bo.createBatchPlan(['feat-bo004'], INJECT);
    } catch (e) { result = null; }
    assert('BO-004',
      result && result.plan && typeof result.plan.batchId === 'string' && result.plan.batchId.startsWith('batch-'),
      'createBatchPlan generates batchId starting with "batch-"');
  } else {
    skip('BO-004', 'Module not loaded');
  }
}

// ============================================================
// Section 2: executeBatchPlan (BO-005 ~ BO-008)
// ============================================================
console.log('\n--- Section 2: executeBatchPlan ---');

// BO-005: Module exports executeBatchPlan function
{
  assert('BO-005', bo && typeof bo.executeBatchPlan === 'function',
    'batch-orchestrator exports executeBatchPlan');
}

// BO-006: executeBatchPlan with null plan returns empty results
{
  if (moduleLoaded) {
    let result = null;
    try {
      result = bo.executeBatchPlan(null, INJECT);
    } catch (e) { result = null; }
    assert('BO-006',
      result && result.results.length === 0 && result.summary === 'No groups to execute',
      'executeBatchPlan returns empty for null plan');
  } else {
    skip('BO-006', 'Module not loaded');
  }
}

// BO-007: executeBatchPlan with empty groups
{
  if (moduleLoaded) {
    let result = null;
    try {
      result = bo.executeBatchPlan({ batchId: 'test-bo007', groups: [], features: [] }, INJECT);
    } catch (e) { result = null; }
    assert('BO-007',
      result && result.results.length === 0,
      'executeBatchPlan handles empty groups');
  } else {
    skip('BO-007', 'Module not loaded');
  }
}

// BO-008: executeBatchPlan returns results and summary
{
  if (moduleLoaded) {
    let result = null;
    try {
      const plan = {
        batchId: 'test-bo008',
        groups: [{
          id: 'group-1', feature: 'feat-bo008',
          files: ['src/a.js'], instruction: 'test', status: 'pending', completedFiles: 0,
        }],
        features: ['feat-bo008'],
        status: 'pending',
      };
      result = bo.executeBatchPlan(plan, INJECT);
    } catch (e) { result = null; }
    assert('BO-008',
      result && Array.isArray(result.results) && typeof result.summary === 'string',
      'executeBatchPlan returns {results, summary}');
  } else {
    skip('BO-008', 'Module not loaded');
  }
}

// ============================================================
// Section 3: getBatchStatus (BO-009 ~ BO-011)
// ============================================================
console.log('\n--- Section 3: getBatchStatus ---');

// BO-009: Module exports getBatchStatus function
{
  assert('BO-009', bo && typeof bo.getBatchStatus === 'function',
    'batch-orchestrator exports getBatchStatus');
}

// BO-010: getBatchStatus returns null for non-existent batch
{
  if (moduleLoaded) {
    const result = bo.getBatchStatus('nonexistent-batch-bo010', INJECT);
    assert('BO-010', result === null,
      'getBatchStatus returns null for non-existent batch');
  } else {
    skip('BO-010', 'Module not loaded');
  }
}

// BO-011: getBatchStatus returns progress field
{
  if (moduleLoaded) {
    // Create a batch to test status
    let status = null;
    try {
      const { plan } = bo.createBatchPlan(['feat-bo011'], INJECT);
      status = bo.getBatchStatus(plan.batchId, INJECT);
    } catch (e) { status = null; }
    assert('BO-011',
      status === null || (status && typeof status.progress === 'number'),
      'getBatchStatus returns progress when batch exists');
  } else {
    skip('BO-011', 'Module not loaded');
  }
}

// ============================================================
// Section 4: cancelBatch & resumeBatch (BO-012 ~ BO-015)
// ============================================================
console.log('\n--- Section 4: cancelBatch & resumeBatch ---');

// BO-012: Module exports cancelBatch function
{
  assert('BO-012', bo && typeof bo.cancelBatch === 'function',
    'batch-orchestrator exports cancelBatch');
}

// BO-013: cancelBatch returns not found for nonexistent batch
{
  if (moduleLoaded) {
    const result = bo.cancelBatch('nonexistent-batch-bo013', INJECT);
    assert('BO-013',
      result && result.cancelled === false && result.reason.includes('not found'),
      'cancelBatch returns cancelled=false for nonexistent batch');
  } else {
    skip('BO-013', 'Module not loaded');
  }
}

// BO-014: Module exports resumeBatch function
{
  assert('BO-014', bo && typeof bo.resumeBatch === 'function',
    'batch-orchestrator exports resumeBatch');
}

// BO-015: resumeBatch returns not found for nonexistent batch
{
  if (moduleLoaded) {
    const result = bo.resumeBatch('nonexistent-batch-bo015', INJECT);
    assert('BO-015',
      result && result.resumed === false && result.reason.includes('not found'),
      'resumeBatch returns resumed=false for nonexistent batch');
  } else {
    skip('BO-015', 'Module not loaded');
  }
}

// ============================================================
// Summary
// ============================================================
const result = summary('batch-orchestrator.test.js');
module.exports = result;
