#!/usr/bin/env node
/**
 * Performance Test Suite: Core Functions
 * @file test/performance/core-function-perf.test.js
 * @version 1.6.1
 *
 * 25 Performance test cases for core library functions
 * - Measures execution time using performance.now()
 * - Validates function performance against baselines
 * - Tests: intent, PDCA, task, team, and core modules
 */

const assert = require('assert');
const { performance } = require('perf_hooks');

// Load modules
const common = require('../../lib/core');
const intent = require('../../lib/intent');
const pdca = require('../../lib/pdca');

// =====================================================
// Configuration
// =====================================================

const PERFORMANCE_THRESHOLDS = {
  calculateAmbiguityScore: 10,      // < 10ms
  detectLanguage: 5,                 // < 5ms
  selectOrchestrationPattern: 5,    // < 5ms
  getTierFromPath: 5,                // < 5ms
  getLevelFromConfig: 5,             // < 5ms
  matchFeaturePattern: 5,             // < 5ms
  parseHookInput: 10,                // < 10ms
  getConfig: 5,                      // < 5ms
  loadConfig: 50,                    // < 50ms
  safeJsonParse: 5,                  // < 5ms
  getAllTierExtensions: 5,           // < 5ms
  truncateContext: 10,               // < 10ms (context truncation)
  getDebugLogPath: 5,                // < 5ms
  getPdcaStatusFull: 20,             // < 20ms
  evaluateAgainstCriteria: 20,       // < 20ms (eval)
  buildAgentTeamPlan: 100,           // < 100ms (team orchestration)
};

const ITERATIONS = {
  calculateAmbiguityScore: 100,
  detectLanguage: 100,
  selectOrchestrationPattern: 100,
  getTierFromPath: 100,
  getLevelFromConfig: 100,
  matchFeaturePattern: 100,
  parseHookInput: 50,
  getConfig: 100,
  loadConfig: 10,
  safeJsonParse: 100,
  getAllTierExtensions: 50,
  truncateContext: 50,
  getDebugLogPath: 100,
  getPdcaStatusFull: 10,
  evaluateAgainstCriteria: 20,
  buildAgentTeamPlan: 5,
};

// =====================================================
// Test Results
// =====================================================

const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  measurements: []
};

// =====================================================
// Utility Functions
// =====================================================

function measureFunction(fn, iterations = 100) {
  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance.now();
  return (end - start) / iterations;
}

function assertPerformance(testName, fn, threshold, iterations) {
  const avgTime = measureFunction(fn, iterations);
  const pass = avgTime < threshold;

  const measurement = {
    name: testName,
    duration: avgTime.toFixed(2),
    threshold: threshold,
    unit: 'ms',
    pass: pass
  };
  results.measurements.push(measurement);

  if (pass) {
    console.log(`✓ PRF-${String(Object.keys(results.measurements).length).padStart(3, '0')}: ${testName}`);
    console.log(`  Duration: ${avgTime.toFixed(2)}ms / Threshold: ${threshold}ms`);
    results.passed++;
  } else {
    console.log(`✗ PRF-${String(Object.keys(results.measurements).length).padStart(3, '0')}: ${testName}`);
    console.log(`  Duration: ${avgTime.toFixed(2)}ms / Threshold: ${threshold}ms (EXCEEDED by ${(avgTime - threshold).toFixed(2)}ms)`);
    results.failed++;
  }
}

// =====================================================
// Performance Test Cases (25 TC)
// =====================================================

async function runTests() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║   Performance Test Suite: Core Functions (25 TC)       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // =====================================================
    // Intent Module Tests (PRF-001 ~ PRF-005)
    // =====================================================

    console.log('\n--- Intent Module Tests ---\n');

    // PRF-001: calculateAmbiguityScore
    if (intent.calculateAmbiguityScore) {
      console.log('[PRF-001] calculateAmbiguityScore');
      assertPerformance(
        'calculateAmbiguityScore',
        () => {
          intent.calculateAmbiguityScore('test feature implementation', {});
        },
        PERFORMANCE_THRESHOLDS.calculateAmbiguityScore,
        ITERATIONS.calculateAmbiguityScore
      );
    } else {
      console.log('⏭ PRF-001: calculateAmbiguityScore not available');
      results.skipped++;
    }

    // PRF-002: detectLanguage
    if (intent.detectLanguage) {
      console.log('[PRF-002] detectLanguage');
      assertPerformance(
        'detectLanguage',
        () => {
          intent.detectLanguage('Hello world, this is a test message');
        },
        PERFORMANCE_THRESHOLDS.detectLanguage,
        ITERATIONS.detectLanguage
      );
    } else {
      console.log('⏭ PRF-002: detectLanguage not available');
      results.skipped++;
    }

    // PRF-003: selectOrchestrationPattern
    if (intent.selectOrchestrationPattern) {
      console.log('[PRF-003] selectOrchestrationPattern');
      assertPerformance(
        'selectOrchestrationPattern',
        () => {
          intent.selectOrchestrationPattern('design', 'Dynamic', {});
        },
        PERFORMANCE_THRESHOLDS.selectOrchestrationPattern,
        ITERATIONS.selectOrchestrationPattern
      );
    } else {
      console.log('⏭ PRF-003: selectOrchestrationPattern not available');
      results.skipped++;
    }

    // PRF-004: parseHookInput
    if (common.parseHookInput) {
      console.log('[PRF-004] parseHookInput');
      assertPerformance(
        'parseHookInput',
        () => {
          common.parseHookInput('test input data');
        },
        PERFORMANCE_THRESHOLDS.parseHookInput,
        ITERATIONS.parseHookInput
      );
    } else {
      console.log('⏭ PRF-004: parseHookInput not available');
      results.skipped++;
    }

    // PRF-005: truncateContext
    if (common.truncateContext) {
      console.log('[PRF-005] truncateContext');
      const longText = 'a'.repeat(10000);
      assertPerformance(
        'truncateContext',
        () => {
          common.truncateContext(longText, 5000);
        },
        PERFORMANCE_THRESHOLDS.truncateContext,
        ITERATIONS.truncateContext
      );
    } else {
      console.log('⏭ PRF-005: truncateContext not available');
      results.skipped++;
    }

    // =====================================================
    // PDCA Module Tests (PRF-006 ~ PRF-010)
    // =====================================================

    console.log('\n--- PDCA Module Tests ---\n');

    // PRF-006: getTierFromPath
    if (pdca.getTierFromPath) {
      console.log('[PRF-006] getTierFromPath');
      assertPerformance(
        'getTierFromPath',
        () => {
          pdca.getTierFromPath('docs/01-plan/features/test.plan.md');
        },
        PERFORMANCE_THRESHOLDS.getTierFromPath,
        ITERATIONS.getTierFromPath
      );
    } else {
      console.log('⏭ PRF-006: getTierFromPath not available');
      results.skipped++;
    }

    // PRF-007: getLevelFromConfig
    if (pdca.getLevelFromConfig) {
      console.log('[PRF-007] getLevelFromConfig');
      assertPerformance(
        'getLevelFromConfig',
        () => {
          pdca.getLevelFromConfig('test-feature', { automation: 'semi-auto' });
        },
        PERFORMANCE_THRESHOLDS.getLevelFromConfig,
        ITERATIONS.getLevelFromConfig
      );
    } else {
      console.log('⏭ PRF-007: getLevelFromConfig not available');
      results.skipped++;
    }

    // PRF-008: matchFeaturePattern
    if (pdca.matchFeaturePattern) {
      console.log('[PRF-008] matchFeaturePattern');
      assertPerformance(
        'matchFeaturePattern',
        () => {
          pdca.matchFeaturePattern('test-feature', ['features', 'modules', 'packages']);
        },
        PERFORMANCE_THRESHOLDS.matchFeaturePattern,
        ITERATIONS.matchFeaturePattern
      );
    } else {
      console.log('⏭ PRF-008: matchFeaturePattern not available');
      results.skipped++;
    }

    // PRF-009: getPdcaStatusFull
    if (pdca.getPdcaStatusFull) {
      console.log('[PRF-009] getPdcaStatusFull');
      assertPerformance(
        'getPdcaStatusFull',
        () => {
          pdca.getPdcaStatusFull('test-feature', {}, {});
        },
        PERFORMANCE_THRESHOLDS.getPdcaStatusFull,
        ITERATIONS.getPdcaStatusFull
      );
    } else {
      console.log('⏭ PRF-009: getPdcaStatusFull not available');
      results.skipped++;
    }

    // PRF-010: getAllTierExtensions
    if (common.TIER_EXTENSIONS) {
      console.log('[PRF-010] getAllTierExtensions');
      assertPerformance(
        'getAllTierExtensions',
        () => {
          Object.keys(common.TIER_EXTENSIONS);
        },
        PERFORMANCE_THRESHOLDS.getAllTierExtensions,
        ITERATIONS.getAllTierExtensions
      );
    } else {
      console.log('⏭ PRF-010: getAllTierExtensions not available');
      results.skipped++;
    }

    // =====================================================
    // Config Module Tests (PRF-011 ~ PRF-015)
    // =====================================================

    console.log('\n--- Config Module Tests ---\n');

    // PRF-011: getConfig
    if (common.getConfig) {
      console.log('[PRF-011] getConfig');
      assertPerformance(
        'getConfig',
        () => {
          common.getConfig('pdca');
        },
        PERFORMANCE_THRESHOLDS.getConfig,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-011: getConfig not available');
      results.skipped++;
    }

    // PRF-012: loadConfig
    if (common.loadConfig) {
      console.log('[PRF-012] loadConfig');
      assertPerformance(
        'loadConfig',
        () => {
          common.loadConfig('bkit.config.json');
        },
        PERFORMANCE_THRESHOLDS.loadConfig,
        ITERATIONS.loadConfig
      );
    } else {
      console.log('⏭ PRF-012: loadConfig not available');
      results.skipped++;
    }

    // PRF-013: safeJsonParse
    if (common.safeJsonParse) {
      console.log('[PRF-013] safeJsonParse');
      assertPerformance(
        'safeJsonParse',
        () => {
          common.safeJsonParse('{"key": "value", "number": 42}');
        },
        PERFORMANCE_THRESHOLDS.safeJsonParse,
        ITERATIONS.safeJsonParse
      );
    } else {
      console.log('⏭ PRF-013: safeJsonParse not available');
      results.skipped++;
    }

    // PRF-014: getDebugLogPath
    if (common.getDebugLogPath) {
      console.log('[PRF-014] getDebugLogPath');
      assertPerformance(
        'getDebugLogPath',
        () => {
          common.getDebugLogPath('test', 'hook');
        },
        PERFORMANCE_THRESHOLDS.getDebugLogPath,
        ITERATIONS.getDebugLogPath
      );
    } else {
      console.log('⏭ PRF-014: getDebugLogPath not available');
      results.skipped++;
    }

    // PRF-015: Cache get/set
    if (common.get && common.set) {
      console.log('[PRF-015] Cache operations (get/set)');
      assertPerformance(
        'Cache get/set',
        () => {
          common.set('test-key', { data: 'test' });
          common.get('test-key');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-015: Cache operations not available');
      results.skipped++;
    }

    // =====================================================
    // Utility Functions Tests (PRF-016 ~ PRF-020)
    // =====================================================

    console.log('\n--- Utility Functions Tests ---\n');

    // PRF-016: Platform detection
    if (common.detectPlatform) {
      console.log('[PRF-016] detectPlatform');
      assertPerformance(
        'detectPlatform',
        () => {
          common.detectPlatform();
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-016: detectPlatform not available');
      results.skipped++;
    }

    // PRF-017: getPluginPath
    if (common.getPluginPath) {
      console.log('[PRF-017] getPluginPath');
      assertPerformance(
        'getPluginPath',
        () => {
          common.getPluginPath('test.js');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-017: getPluginPath not available');
      results.skipped++;
    }

    // PRF-018: getProjectPath
    if (common.getProjectPath) {
      console.log('[PRF-018] getProjectPath');
      assertPerformance(
        'getProjectPath',
        () => {
          common.getProjectPath('test.js');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-018: getProjectPath not available');
      results.skipped++;
    }

    // PRF-019: outputAllow
    if (common.outputAllow) {
      console.log('[PRF-019] outputAllow');
      assertPerformance(
        'outputAllow',
        () => {
          common.outputAllow('test', 'info');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-019: outputAllow not available');
      results.skipped++;
    }

    // PRF-020: xmlSafeOutput
    if (common.xmlSafeOutput) {
      console.log('[PRF-020] xmlSafeOutput');
      assertPerformance(
        'xmlSafeOutput',
        () => {
          common.xmlSafeOutput('<test>value</test>');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-020: xmlSafeOutput not available');
      results.skipped++;
    }

    // =====================================================
    // Advanced Operations Tests (PRF-021 ~ PRF-025)
    // =====================================================

    console.log('\n--- Advanced Operations Tests ---\n');

    // PRF-021: Multiple getConfig calls
    if (common.getConfig) {
      console.log('[PRF-021] Multiple getConfig calls');
      assertPerformance(
        'getConfig x 3',
        () => {
          common.getConfig('pdca');
          common.getConfig('team');
          common.getConfig('triggers');
        },
        15,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-021: Multiple getConfig not available');
      results.skipped++;
    }

    // PRF-022: Cache invalidation
    if (common.invalidate) {
      console.log('[PRF-022] Cache invalidation');
      assertPerformance(
        'Cache invalidate',
        () => {
          common.set('test-key', { data: 'test' });
          common.invalidate('test-key');
        },
        5,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-022: Cache invalidation not available');
      results.skipped++;
    }

    // PRF-023: Large object JSON parsing
    if (common.safeJsonParse) {
      console.log('[PRF-023] Large object JSON parsing');
      const largeObject = JSON.stringify(
        Array(100).fill().reduce((acc, _, i) => {
          acc[`key${i}`] = `value${i}`;
          return acc;
        }, {})
      );
      assertPerformance(
        'safeJsonParse (large)',
        () => {
          common.safeJsonParse(largeObject);
        },
        10,
        ITERATIONS.safeJsonParse
      );
    } else {
      console.log('⏭ PRF-023: Large JSON parsing not available');
      results.skipped++;
    }

    // PRF-024: Context truncation large text
    if (common.truncateContext) {
      console.log('[PRF-024] Context truncation (large text)');
      const veryLongText = 'a'.repeat(100000);
      assertPerformance(
        'truncateContext (large)',
        () => {
          common.truncateContext(veryLongText, 50000);
        },
        50,
        ITERATIONS.truncateContext
      );
    } else {
      console.log('⏭ PRF-024: Context truncation not available');
      results.skipped++;
    }

    // PRF-025: Multiple cache operations
    if (common.get && common.set && common.invalidate) {
      console.log('[PRF-025] Multiple cache operations');
      assertPerformance(
        'Cache multi-op',
        () => {
          for (let i = 0; i < 5; i++) {
            common.set(`key${i}`, { data: i });
            common.get(`key${i}`);
            common.invalidate(`key${i}`);
          }
        },
        20,
        ITERATIONS.getConfig
      );
    } else {
      console.log('⏭ PRF-025: Multiple cache operations not available');
      results.skipped++;
    }

  } catch (err) {
    console.error('\nTest error:', err.message);
    if (process.env.DEBUG) {
      console.error(err.stack);
    }
  }

  // =====================================================
  // Print Summary
  // =====================================================

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║            Performance Test Summary                    ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  ✓ Passed: ${String(results.passed).padStart(48)}║`);
  console.log(`║  ✗ Failed: ${String(results.failed).padStart(48)}║`);
  console.log(`║  ⏭ Skipped: ${String(results.skipped).padStart(47)}║`);
  console.log('╠════════════════════════════════════════════════════════╣');

  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? Math.round((results.passed / total) * 100) : 0;
  console.log(`║  Pass Rate: ${String(passRate + '%').padStart(47)}║`);

  // Show slowest functions
  if (results.measurements.length > 0) {
    console.log('╠════════════════════════════════════════════════════════╣');
    console.log('║  Top 5 Slowest Functions:                            ║');
    const sorted = results.measurements
      .sort((a, b) => parseFloat(b.duration) - parseFloat(a.duration))
      .slice(0, 5);
    sorted.forEach((m, i) => {
      const name = m.name.substring(0, 30).padEnd(30);
      const duration = `${m.duration}ms`.padStart(8);
      const icon = m.pass ? '✓' : '✗';
      console.log(`║  ${i + 1}. ${name} ${duration} ${icon}     ║`);
    });
  }

  console.log('╚════════════════════════════════════════════════════════╝\n');

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
