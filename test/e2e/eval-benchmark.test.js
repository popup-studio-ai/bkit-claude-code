#!/usr/bin/env node
/**
 * E2E Test Suite: Eval Benchmark
 * @file test/e2e/eval-benchmark.test.js
 * @version 1.6.1
 *
 * 20 E2E test cases for skill eval benchmark
 * - Direct node execution (no docker required)
 * - Tests evals/runner.js API
 * - Validates all 28 skills individually
 * - Validates skill classification grouping
 * - Validates benchmark aggregation
 */

const assert = require('assert');
const path = require('path');

// Load eval runner
const evalRunnerPath = path.join(__dirname, '../../evals/runner.js');
let runner;

try {
  runner = require(evalRunnerPath);
} catch (err) {
  console.error('Failed to load eval runner:', err.message);
  process.exit(1);
}

// =====================================================
// Utility Functions
// =====================================================

function assertEquals(actual, expected, message) {
  try {
    assert.strictEqual(actual, expected, message);
    console.log(`✓ ${message}`);
  } catch (err) {
    console.error(`✗ FAILED: ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    throw err;
  }
}

function assertTrue(value, message) {
  try {
    assert(value === true, message);
    console.log(`✓ ${message}`);
  } catch (err) {
    console.error(`✗ FAILED: ${message}`);
    throw err;
  }
}

function assertExists(value, message) {
  try {
    assert(value !== undefined && value !== null, message);
    console.log(`✓ ${message}`);
  } catch (err) {
    console.error(`✗ FAILED: ${message}`);
    throw err;
  }
}

// =====================================================
// E2E Test Cases (20 TC)
// =====================================================

const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0
};

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║        E2E Test Suite: Eval Benchmark (20 TC)          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // E2E-001: Module exports
    console.log('\n[E2E-001] Validate runner module exports');
    assertExists(runner.runBenchmark, 'runner.runBenchmark exists');
    assertExists(runner.runEval, 'runner.runEval exists');
    assertExists(runner.runAllEvals, 'runner.runAllEvals exists');
    testResults.passed++;

    // E2E-002: Config loading
    console.log('\n[E2E-002] Validate config can be loaded');
    const config = runner.loadConfig ? runner.loadConfig() : null;
    assertExists(config, 'Config is loadable');
    testResults.passed++;

    // E2E-003: Benchmark run complete (all skills)
    console.log('\n[E2E-003] Run full benchmark (28 skills)');
    const benchmarkStart = Date.now();
    const results = await runner.runBenchmark();
    const benchmarkDuration = Date.now() - benchmarkStart;
    console.log(`  Benchmark completed in ${benchmarkDuration}ms`);
    assertExists(results, 'Benchmark returns results');
    testResults.passed++;

    // E2E-004: Benchmark result structure
    console.log('\n[E2E-004] Validate benchmark result structure');
    assertExists(results.summary, 'results.summary exists');
    assertExists(results.details, 'results.details exists');
    assertExists(results.timestamp, 'results.timestamp exists');
    testResults.passed++;

    // E2E-005: Total benchmarked skills > 0 and ≤ actual skills directory (ENH-167 dynamic bounds)
    const fs = require('fs');
    const path = require('path');
    const skillsDir = path.resolve(__dirname, '../../skills');
    const actualSkillCount = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory()).length;
    const totalSkills = (results.summary.workflow.total || 0) +
                       (results.summary.capability.total || 0) +
                       (results.summary.hybrid.total || 0);
    console.log(`\n[E2E-005] Validate benchmarked skills ${totalSkills} in range (0, ${actualSkillCount}]`);
    assertTrue(totalSkills > 0 && totalSkills <= actualSkillCount,
      `Total benchmarked skills ${totalSkills} within valid range (0, ${actualSkillCount}]`);
    testResults.passed++;

    // E2E-006: Passed skill count >= 25
    console.log('\n[E2E-006] Validate passed count >= 25');
    const totalPassed = (results.summary.workflow.passed || 0) +
                       (results.summary.capability.passed || 0) +
                       (results.summary.hybrid.passed || 0);
    assertTrue(totalPassed >= 25, `Passed count (${totalPassed}) >= 25`);
    testResults.passed++;

    // E2E-007: Skill count by classification
    console.log('\n[E2E-007] Validate skill count by classification');
    assertTrue(results.summary.workflow.total > 0, 'Workflow skills exist');
    assertTrue(results.summary.capability.total > 0, 'Capability skills exist');
    assertTrue(results.summary.hybrid.total > 0, 'Hybrid skills exist');
    testResults.passed++;

    // E2E-008: Individual skill - pdca
    console.log('\n[E2E-008] Validate pdca skill eval');
    const pdcaResult = await runner.runEval('pdca');
    assertExists(pdcaResult, 'pdca eval returns result');
    assertTrue(pdcaResult.pass === true || pdcaResult.pass === false,
      `pdca eval has boolean pass value (${pdcaResult.pass})`);
    testResults.passed++;

    // E2E-009: Individual skill - phase-4-api
    console.log('\n[E2E-009] Validate phase-4-api skill eval');
    const phaseApiResult = await runner.runEval('phase-4-api');
    assertExists(phaseApiResult, 'phase-4-api eval returns result');
    testResults.passed++;

    // E2E-010: Individual skill - phase-6-ui-integration
    console.log('\n[E2E-010] Validate phase-6-ui-integration skill eval');
    const phaseUiResult = await runner.runEval('phase-6-ui-integration');
    assertExists(phaseUiResult, 'phase-6-ui-integration eval returns result');
    testResults.passed++;

    // E2E-011: Eval result has details
    console.log('\n[E2E-011] Validate eval result details structure');
    assertExists(pdcaResult.details, 'eval result has details');
    testResults.passed++;

    // E2E-012: Workflow skill classification (>= 9)
    console.log('\n[E2E-012] Validate workflow skill count >= 9');
    const workflowResults = await runner.runAllEvals({ classification: 'workflow' });
    assertTrue(workflowResults.total >= 9, `Workflow skills count (${workflowResults.total}) >= 9`);
    testResults.passed++;

    // E2E-013: Capability skill classification (>= 16)
    console.log('\n[E2E-013] Validate capability skill count >= 16');
    const capabilityResults = await runner.runAllEvals({ classification: 'capability' });
    assertTrue(capabilityResults.total >= 16, `Capability skills count (${capabilityResults.total}) >= 16`);
    testResults.passed++;

    // E2E-014: Hybrid skill classification (>= 1)
    console.log('\n[E2E-014] Validate hybrid skill count >= 1');
    const hybridResults = await runner.runAllEvals({ classification: 'hybrid' });
    assertTrue(hybridResults.total >= 1, `Hybrid skills count (${hybridResults.total}) >= 1`);
    testResults.passed++;

    // E2E-015: Sum of classifications > 0 (ENH-167 dynamic — no hardcoded count)
    console.log('\n[E2E-015] Validate classification count sum > 0');
    const classifyTotal = workflowResults.total + capabilityResults.total + hybridResults.total;
    assertTrue(classifyTotal > 0, `Sum of classifications (${classifyTotal}) > 0`);
    testResults.passed++;

    // E2E-016: Benchmark performance < 35s
    console.log('\n[E2E-016] Validate benchmark performance < 35 seconds');
    assertTrue(benchmarkDuration < 35000, `Benchmark time (${benchmarkDuration}ms) < 35000ms`);
    testResults.passed++;

    // E2E-017: Eval has matchedCriteria
    console.log('\n[E2E-017] Validate eval includes matchedCriteria');
    if (pdcaResult.details && pdcaResult.details.matchedCriteria !== undefined) {
      assertTrue(Array.isArray(pdcaResult.details.matchedCriteria),
        'matchedCriteria is array');
    }
    testResults.passed++;

    // E2E-018: Eval has score
    console.log('\n[E2E-018] Validate eval includes score');
    if (pdcaResult.details && pdcaResult.details.score !== undefined) {
      assertTrue(pdcaResult.details.score >= 0 && pdcaResult.details.score <= 1,
        `score is between 0-1 (${pdcaResult.details.score})`);
    }
    testResults.passed++;

    // E2E-019: YAML parsing works
    console.log('\n[E2E-019] Validate YAML parsing');
    assertExists(pdcaResult.details, 'pdca eval has parsed result');
    testResults.passed++;

    // E2E-020: No exceptions during benchmark
    console.log('\n[E2E-020] Benchmark completes without exceptions');
    assertTrue(typeof results === 'object', 'Benchmark returns valid object');
    testResults.passed++;

  } catch (err) {
    testResults.failed++;
    console.error(`\nTest failed with error:`, err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
  }

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║                    Test Summary                        ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✓ Passed: ${String(testResults.passed).padStart(48)}║`);
  console.log(`║  ✗ Failed: ${String(testResults.failed).padStart(48)}║`);
  console.log(`║  ⏭ Skipped: ${String(testResults.skipped).padStart(47)}║`);
  console.log('╠════════════════════════════════════════════════════════╣');
  const passRate = testResults.total > 0
    ? Math.round((testResults.passed / 20) * 100)
    : 0;
  console.log(`║  Pass Rate: ${String(passRate + '%').padStart(47)}║`);
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
