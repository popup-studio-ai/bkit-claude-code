#!/usr/bin/env node
'use strict';
/**
 * Performance Test: UI Render Performance (10 TC)
 * UR-001~005: Each UI component renders in <10ms
 * UR-006~010: Progress bar with full data <5ms
 *
 * @version bkit v2.0.0
 */

const { performance } = require('perf_hooks');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');

const results = { passed: 0, failed: 0, total: 0, measurements: [] };

function perfAssert(id, condition, message, durationMs) {
  results.total++;
  results.measurements.push({ id, durationMs: durationMs?.toFixed(2) });
  if (condition) {
    results.passed++;
    console.log(`  PASS: ${id} - ${message} (${durationMs?.toFixed(2)}ms)`);
  } else {
    results.failed++;
    console.error(`  FAIL: ${id} - ${message} (${durationMs?.toFixed(2)}ms)`);
  }
}

// --- Load UI modules ---
let ui;
try {
  ui = require(path.join(BASE_DIR, 'lib/ui'));
} catch (e) {
  console.error('UI module load failed:', e.message);
  process.exit(1);
}

console.log('\n=== ui-render-perf.test.js (10 TC) ===\n');

// ============================================================
// UR-001~005: Each UI component renders in <10ms
// ============================================================
console.log('--- UI Component Render (<10ms) ---');

const RENDER_THRESHOLD = 10;

// UR-001: Progress bar render
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderPdcaProgressBar === 'function') {
      ui.renderPdcaProgressBar({
        phases: [
          { name: 'pm', status: 'completed' },
          { name: 'plan', status: 'completed' },
          { name: 'design', status: 'running' },
          { name: 'do', status: 'pending' },
          { name: 'check', status: 'pending' },
          { name: 'report', status: 'pending' },
        ],
        feature: 'test-feature',
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-001', elapsed < RENDER_THRESHOLD, `renderPdcaProgressBar < ${RENDER_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-001', false, `renderPdcaProgressBar failed: ${e.message}`, elapsed);
  }
}

// UR-002: Workflow map render
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderWorkflowMap === 'function') {
      ui.renderWorkflowMap({
        workflow: 'default',
        currentPhase: 'design',
        phases: ['plan', 'design', 'do', 'check', 'report'],
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-002', elapsed < RENDER_THRESHOLD, `renderWorkflowMap < ${RENDER_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-002', false, `renderWorkflowMap failed: ${e.message}`, elapsed);
  }
}

// UR-003: Agent panel render
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderAgentPanel === 'function') {
      ui.renderAgentPanel({
        agents: [
          { name: 'cto-lead', model: 'fable', status: 'running', turns: 5 },
          { name: 'code-analyzer', model: 'opus', status: 'idle', turns: 0 },
          { name: 'pm-lead', model: 'fable', status: 'completed', turns: 12 },
        ],
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-003', elapsed < RENDER_THRESHOLD, `renderAgentPanel < ${RENDER_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-003', false, `renderAgentPanel failed: ${e.message}`, elapsed);
  }
}

// UR-004: Impact view render
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderImpactView === 'function') {
      ui.renderImpactView({
        feature: 'test-feature',
        files: ['src/index.js', 'lib/core.js', 'test/unit.test.js'],
        blastRadius: 'low',
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-004', elapsed < RENDER_THRESHOLD, `renderImpactView < ${RENDER_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-004', false, `renderImpactView failed: ${e.message}`, elapsed);
  }
}

// UR-005: Control panel render
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderControlPanel === 'function') {
      ui.renderControlPanel({
        level: 2,
        trustScore: 75,
        pendingApprovals: 0,
        automationActive: true,
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-005', elapsed < RENDER_THRESHOLD, `renderControlPanel < ${RENDER_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-005', false, `renderControlPanel failed: ${e.message}`, elapsed);
  }
}

// ============================================================
// UR-006~010: Progress bar with full data <5ms
// ============================================================
console.log('\n--- Progress Bar Stress (<5ms) ---');

const FAST_THRESHOLD = 5;

// UR-006: Progress bar - all completed
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderPdcaProgressBar === 'function') {
      ui.renderPdcaProgressBar({
        phases: [
          { name: 'pm', status: 'completed' },
          { name: 'plan', status: 'completed' },
          { name: 'design', status: 'completed' },
          { name: 'do', status: 'completed' },
          { name: 'check', status: 'completed' },
          { name: 'report', status: 'completed' },
        ],
        feature: 'completed-feature',
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-006', elapsed < FAST_THRESHOLD, `Progress bar (all completed) < ${FAST_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-006', false, `Progress bar (all completed) failed: ${e.message}`, elapsed);
  }
}

// UR-007: Progress bar - mixed status
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderPdcaProgressBar === 'function') {
      ui.renderPdcaProgressBar({
        phases: [
          { name: 'pm', status: 'completed' },
          { name: 'plan', status: 'completed' },
          { name: 'design', status: 'failed' },
          { name: 'do', status: 'pending' },
          { name: 'check', status: 'pending' },
          { name: 'report', status: 'pending' },
        ],
        feature: 'failed-feature',
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-007', elapsed < FAST_THRESHOLD, `Progress bar (mixed status) < ${FAST_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-007', false, `Progress bar (mixed status) failed: ${e.message}`, elapsed);
  }
}

// UR-008: 10 consecutive renders
{
  let elapsed = 0;
  try {
    const start = performance.now();
    for (let i = 0; i < 10; i++) {
      if (typeof ui.renderPdcaProgressBar === 'function') {
        ui.renderPdcaProgressBar({
          phases: [
            { name: 'pm', status: i < 1 ? 'running' : 'completed' },
            { name: 'plan', status: i < 2 ? 'pending' : 'completed' },
            { name: 'design', status: i < 3 ? 'pending' : 'completed' },
            { name: 'do', status: i < 4 ? 'pending' : 'running' },
            { name: 'check', status: 'pending' },
            { name: 'report', status: 'pending' },
          ],
          feature: `iter-${i}`,
        });
      }
    }
    elapsed = performance.now() - start;
    const perRender = elapsed / 10;
    perfAssert('UR-008', perRender < FAST_THRESHOLD,
      `10 consecutive renders avg ${perRender.toFixed(2)}ms < ${FAST_THRESHOLD}ms`, perRender);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-008', false, `10 consecutive renders failed: ${e.message}`, elapsed);
  }
}

// UR-009: Progress bar with long feature name
{
  let elapsed = 0;
  try {
    const longName = 'very-long-feature-name-that-might-cause-rendering-issues-in-narrow-terminals-test';
    const start = performance.now();
    if (typeof ui.renderPdcaProgressBar === 'function') {
      ui.renderPdcaProgressBar({
        phases: [
          { name: 'pm', status: 'completed' },
          { name: 'plan', status: 'running' },
          { name: 'design', status: 'pending' },
          { name: 'do', status: 'pending' },
          { name: 'check', status: 'pending' },
          { name: 'report', status: 'pending' },
        ],
        feature: longName,
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-009', elapsed < FAST_THRESHOLD,
      `Progress bar (long name ${longName.length}ch) < ${FAST_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-009', false, `Progress bar (long name) failed: ${e.message}`, elapsed);
  }
}

// UR-010: Progress bar with approval_waiting status
{
  let elapsed = 0;
  try {
    const start = performance.now();
    if (typeof ui.renderPdcaProgressBar === 'function') {
      ui.renderPdcaProgressBar({
        phases: [
          { name: 'pm', status: 'completed' },
          { name: 'plan', status: 'completed' },
          { name: 'design', status: 'completed' },
          { name: 'do', status: 'approval_waiting' },
          { name: 'check', status: 'pending' },
          { name: 'report', status: 'pending' },
        ],
        feature: 'approval-feature',
      });
    }
    elapsed = performance.now() - start;
    perfAssert('UR-010', elapsed < FAST_THRESHOLD,
      `Progress bar (approval_waiting) < ${FAST_THRESHOLD}ms`, elapsed);
  } catch (e) {
    elapsed = 0;
    perfAssert('UR-010', false, `Progress bar (approval_waiting) failed: ${e.message}`, elapsed);
  }
}

// ============================================================
// Summary
// ============================================================
console.log(`\n=== Results: ${results.passed}/${results.total} passed, ${results.failed} failed ===`);

const sorted = results.measurements
  .filter(m => m.durationMs)
  .sort((a, b) => parseFloat(b.durationMs) - parseFloat(a.durationMs));
if (sorted.length > 0) {
  console.log('\n--- Slowest Renders ---');
  sorted.slice(0, 5).forEach((m, i) => {
    console.log(`  ${i + 1}. ${m.id}: ${m.durationMs}ms`);
  });
}

if (results.failed > 0) process.exit(1);
