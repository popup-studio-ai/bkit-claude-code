#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// TC counter
let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try {
    fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

async function testAsync(id, description, fn) {
  total++;
  try {
    await fn();
    passed++;
  } catch (err) {
    failed++;
    console.error(`  FAIL ${id}: ${description}`);
    console.error(`    ${err.message}`);
  }
}

console.log('\n=== ops-metrics.js Unit Tests ===\n');

const {
  collectOpsMetrics, evaluateOpsMetrics, calculateOpsScore,
  mergeMatchRate, formatOpsReport,
} = require('../../lib/context/ops-metrics');

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-ops-test-'));

(async () => {

// --- collectOpsMetrics ---

await testAsync('UT-OM-001', 'collectOpsMetrics returns defaults when no file', async () => {
  const metrics = await collectOpsMetrics('test-feature', { metricsFile: '/nonexistent/file.json' });
  assert.strictEqual(metrics.error_rate, null);
  assert.strictEqual(metrics.p99_latency_ms, null);
  assert.strictEqual(metrics.source, 'none');
});

await testAsync('UT-OM-002', 'collectOpsMetrics reads from file', async () => {
  const fp = path.join(tmpDir, 'ops.json');
  fs.writeFileSync(fp, JSON.stringify({ error_rate: 0.5, p99_latency_ms: 200 }));
  const metrics = await collectOpsMetrics('test-feature', { metricsFile: fp });
  assert.strictEqual(metrics.error_rate, 0.5);
  assert.strictEqual(metrics.p99_latency_ms, 200);
  assert.strictEqual(metrics.source, 'file');
});

await testAsync('UT-OM-003', 'collectOpsMetrics handles malformed JSON', async () => {
  const fp = path.join(tmpDir, 'bad.json');
  fs.writeFileSync(fp, 'not json{{{');
  const metrics = await collectOpsMetrics('test-feature', { metricsFile: fp });
  assert.strictEqual(metrics.source, 'none');
});

// --- evaluateOpsMetrics ---

test('UT-OM-004', 'evaluateOpsMetrics all pass for healthy metrics', () => {
  const metrics = { error_rate: 0.1, p99_latency_ms: 100, uptime_percent: 99.9, log_anomaly_count: 2 };
  const result = evaluateOpsMetrics(metrics);
  assert.strictEqual(result.hasCritical, false);
  assert.strictEqual(result.hasWarning, false);
  assert.strictEqual(result.opsScore, 100);
});

test('UT-OM-005', 'evaluateOpsMetrics detects critical error rate', () => {
  const metrics = { error_rate: 6.0, p99_latency_ms: 100, uptime_percent: 99.9, log_anomaly_count: 0 };
  const result = evaluateOpsMetrics(metrics);
  assert.strictEqual(result.hasCritical, true);
  assert.ok(result.results.find(r => r.metric === 'error_rate').status === 'critical');
});

test('UT-OM-006', 'evaluateOpsMetrics detects warning latency', () => {
  const metrics = { error_rate: 0.1, p99_latency_ms: 600, uptime_percent: 99.9, log_anomaly_count: 0 };
  const result = evaluateOpsMetrics(metrics);
  assert.strictEqual(result.hasWarning, true);
  assert.ok(result.results.find(r => r.metric === 'p99_latency_ms').status === 'warning');
});

test('UT-OM-007', 'evaluateOpsMetrics handles inverted uptime threshold', () => {
  const metrics = { error_rate: 0, p99_latency_ms: 10, uptime_percent: 98.0, log_anomaly_count: 0 };
  const result = evaluateOpsMetrics(metrics);
  assert.strictEqual(result.hasCritical, true);
  assert.ok(result.results.find(r => r.metric === 'uptime_percent').status === 'critical');
});

test('UT-OM-008', 'evaluateOpsMetrics handles null/no-data metrics', () => {
  const metrics = { error_rate: null, p99_latency_ms: null, uptime_percent: null, log_anomaly_count: null };
  const result = evaluateOpsMetrics(metrics);
  assert.strictEqual(result.opsScore, null);
  assert.ok(result.results.every(r => r.status === 'no-data'));
});

// --- calculateOpsScore ---

test('UT-OM-009', 'calculateOpsScore returns 100 for all pass', () => {
  const results = [
    { status: 'pass' }, { status: 'pass' }, { status: 'pass' },
  ];
  assert.strictEqual(calculateOpsScore(results), 100);
});

test('UT-OM-010', 'calculateOpsScore returns null for all no-data', () => {
  const results = [{ status: 'no-data' }, { status: 'no-data' }];
  assert.strictEqual(calculateOpsScore(results), null);
});

test('UT-OM-011', 'calculateOpsScore mixes pass/warning/critical', () => {
  const results = [{ status: 'pass' }, { status: 'warning' }, { status: 'critical' }];
  const score = calculateOpsScore(results);
  assert.strictEqual(score, 60); // (100+60+20)/3
});

// --- mergeMatchRate ---

test('UT-OM-012', 'mergeMatchRate returns code rate when ops is null', () => {
  assert.strictEqual(mergeMatchRate(85, null), 85);
});

test('UT-OM-013', 'mergeMatchRate applies 80/20 weighting', () => {
  // 100 * 0.8 + 100 * 0.2 = 100
  assert.strictEqual(mergeMatchRate(100, 100), 100);
  // 80 * 0.8 + 60 * 0.2 = 64 + 12 = 76
  assert.strictEqual(mergeMatchRate(80, 60), 76);
});

test('UT-OM-014', 'mergeMatchRate rounds to integer', () => {
  const result = mergeMatchRate(73, 51);
  assert.strictEqual(result, Math.round(73 * 0.8 + 51 * 0.2));
  assert.strictEqual(typeof result, 'number');
  assert.strictEqual(result, result | 0); // integer check
});

// --- formatOpsReport ---

test('UT-OM-015', 'formatOpsReport includes score and results', () => {
  const results = [
    { metric: 'error_rate', status: 'pass', value: 0.1 },
    { metric: 'p99_latency_ms', status: 'warning', value: 600 },
  ];
  const report = formatOpsReport(results, 80);
  assert.ok(report.includes('80/100'));
  assert.ok(report.includes('error_rate'));
  assert.ok(report.includes('600'));
});

test('UT-OM-016', 'formatOpsReport handles null score', () => {
  const results = [{ metric: 'error_rate', status: 'no-data', value: null }];
  const report = formatOpsReport(results, null);
  assert.ok(report.includes('Operational Metrics'));
  assert.ok(!report.includes('/100'));
});

// Cleanup
try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

// Summary
console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);

})();
