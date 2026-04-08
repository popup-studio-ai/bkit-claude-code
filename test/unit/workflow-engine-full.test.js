#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
let passed = 0, failed = 0, total = 0;

function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Workflow Engine Full Coverage Tests ===\n');

// ── Setup: stub dependencies ──────────────────────────────────────────────

const projectRoot = path.resolve(__dirname, '../..');

// Stub workflow-parser to avoid file system dependencies
const parserPath = require.resolve(projectRoot + '/lib/pdca/workflow-parser');
const originalParserExports = require.cache[parserPath];
require.cache[parserPath] = {
  id: parserPath, filename: parserPath, loaded: true,
  exports: {
    parseWorkflowYaml: () => ({}),
    validateWorkflow: () => ({ valid: true }),
    loadWorkflowFile: () => ({}),
    listAvailableWorkflows: () => [],
    WORKFLOW_DIR_PROJECT: '.bkit/workflows',
  },
};

// Stub core/platform
const platformPath = require.resolve(projectRoot + '/lib/core/platform');
const originalPlatformExports = require.cache[platformPath];
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wf-test-'));
require.cache[platformPath] = {
  id: platformPath, filename: platformPath, loaded: true,
  exports: { PROJECT_DIR: tmpDir },
};

const workflowEngine = require(projectRoot + '/lib/pdca/workflow-engine');

// ── Tests: Constants ──────────────────────────────────────────────────────

// TC-01: WORKFLOW_STATE_DIR — is a string
test('TC-01', 'WORKFLOW_STATE_DIR is a non-empty string', () => {
  assert.strictEqual(typeof workflowEngine.WORKFLOW_STATE_DIR, 'string');
  assert.ok(workflowEngine.WORKFLOW_STATE_DIR.length > 0);
  assert.ok(workflowEngine.WORKFLOW_STATE_DIR.includes('workflows'));
});

// TC-02: DEFAULT_WORKFLOW_ID — is 'default'
test('TC-02', 'DEFAULT_WORKFLOW_ID is "default"', () => {
  assert.strictEqual(workflowEngine.DEFAULT_WORKFLOW_ID, 'default');
});

// TC-03: HOTFIX_WORKFLOW_ID — is 'hotfix'
test('TC-03', 'HOTFIX_WORKFLOW_ID is "hotfix"', () => {
  assert.strictEqual(workflowEngine.HOTFIX_WORKFLOW_ID, 'hotfix');
});

// TC-04: ENTERPRISE_WORKFLOW_ID — is 'enterprise'
test('TC-04', 'ENTERPRISE_WORKFLOW_ID is "enterprise"', () => {
  assert.strictEqual(workflowEngine.ENTERPRISE_WORKFLOW_ID, 'enterprise');
});

// ── Tests: _resolveVariable ───────────────────────────────────────────────

// TC-05: _resolveVariable — resolves string literals
test('TC-05', '_resolveVariable resolves quoted strings', () => {
  assert.strictEqual(workflowEngine._resolveVariable('"hello"', {}), 'hello');
  assert.strictEqual(workflowEngine._resolveVariable("'world'", {}), 'world');
});

// TC-06: _resolveVariable — resolves booleans and null
test('TC-06', '_resolveVariable resolves booleans and null', () => {
  assert.strictEqual(workflowEngine._resolveVariable('true', {}), true);
  assert.strictEqual(workflowEngine._resolveVariable('false', {}), false);
  assert.strictEqual(workflowEngine._resolveVariable('null', {}), null);
});

// TC-07: _resolveVariable — resolves numbers
test('TC-07', '_resolveVariable resolves numbers', () => {
  assert.strictEqual(workflowEngine._resolveVariable('42', {}), 42);
  assert.strictEqual(workflowEngine._resolveVariable('-3.14', {}), -3.14);
});

// TC-08: _resolveVariable — resolves variable lookup
test('TC-08', '_resolveVariable resolves variables from context', () => {
  assert.strictEqual(workflowEngine._resolveVariable('matchRate', { matchRate: 95 }), 95);
  assert.strictEqual(workflowEngine._resolveVariable('unknown', { matchRate: 95 }), 'unknown');
});

// ── Tests: _findFirstStep ─────────────────────────────────────────────────

// TC-09: _findFirstStep — finds 'start' step
test('TC-09', '_findFirstStep returns "start" when present', () => {
  const def = { steps: { start: { phase: 'idle' }, plan: { phase: 'plan' } } };
  assert.strictEqual(workflowEngine._findFirstStep(def), 'start');
});

// TC-10: _findFirstStep — falls back to idle phase step
test('TC-10', '_findFirstStep falls back to idle phase', () => {
  const def = { steps: { init: { phase: 'idle' }, plan: { phase: 'plan' } } };
  assert.strictEqual(workflowEngine._findFirstStep(def), 'init');
});

// TC-11: _findFirstStep — falls back to first key
test('TC-11', '_findFirstStep falls back to first step key', () => {
  const def = { steps: { alpha: { phase: 'plan' }, beta: { phase: 'do' } } };
  assert.strictEqual(workflowEngine._findFirstStep(def), 'alpha');
});

// ── Tests: saveWorkflowState / loadWorkflowState ──────────────────────────

// TC-12: saveWorkflowState — writes state to disk
test('TC-12', 'saveWorkflowState writes and loadWorkflowState reads', () => {
  const execution = {
    workflowId: 'test',
    feature: 'test-feat',
    currentStep: 'start',
    completedSteps: [],
    status: 'running',
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    context: {},
  };
  workflowEngine.saveWorkflowState('test-feat', execution, tmpDir);
  const loaded = workflowEngine.loadWorkflowState('test-feat', tmpDir);
  assert.ok(loaded !== null);
  assert.strictEqual(loaded.workflowId, 'test');
  assert.strictEqual(loaded.feature, 'test-feat');
});

// TC-13: loadWorkflowState — returns null for missing feature
test('TC-13', 'loadWorkflowState returns null for nonexistent feature', () => {
  const result = workflowEngine.loadWorkflowState('nonexistent-feature', tmpDir);
  assert.strictEqual(result, null);
});

// ── Tests: getWorkflowStatus ──────────────────────────────────────────────

// TC-14: getWorkflowStatus — returns status object
test('TC-14', 'getWorkflowStatus returns status for saved feature', () => {
  const execution = {
    workflowId: 'default',
    feature: 'status-feat',
    currentStep: 'plan',
    completedSteps: ['start'],
    status: 'running',
    startedAt: Date.now(),
    lastUpdated: Date.now(),
    context: { matchRate: 50 },
  };
  workflowEngine.saveWorkflowState('status-feat', execution, tmpDir);
  const status = workflowEngine.getWorkflowStatus('status-feat', tmpDir);
  assert.ok(status !== null);
  assert.strictEqual(status.currentStep, 'plan');
  assert.ok(Array.isArray(status.completedSteps));
  assert.strictEqual(typeof status.progress, 'number');
  assert.strictEqual(status.status, 'running');
});

// TC-15: getWorkflowStatus — returns null for missing feature
test('TC-15', 'getWorkflowStatus returns null for unknown feature', () => {
  const result = workflowEngine.getWorkflowStatus('no-such-feature', tmpDir);
  assert.strictEqual(result, null);
});

// ── Cleanup ───────────────────────────────────────────────────────────────

// Remove temp directory
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

// Restore original require cache
if (originalParserExports) require.cache[parserPath] = originalParserExports;
else delete require.cache[parserPath];
if (originalPlatformExports) require.cache[platformPath] = originalPlatformExports;
else delete require.cache[platformPath];

// ── Results ───────────────────────────────────────────────────────────────

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
