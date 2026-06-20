/**
 * QA Test Runner — L1-L5 test execution engine
 * @module lib/qa/test-runner
 * @version 2.1.1
 *
 * Executes tests at 5 levels with Chrome MCP fallback.
 */

// C1 fix (audit): use execFileSync (no shell) so testDir can never reach a shell.
// The previous execSync built a shell string by interpolating ${testDir}, which
// allowed a malicious feature/testDir to inject commands. execFileSync passes the
// binary and its args as a real argv array — no shell parsing, no injection vector.
const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Lazy require to avoid circular deps
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

/**
 * @typedef {'L1'|'L2'|'L3'|'L4'|'L5'} TestLevel
 */

/** @type {Record<TestLevel, {name: string, requiresChrome: boolean, dir: string}>} */
const TEST_LEVELS = {
  L1: { name: 'Unit Test', requiresChrome: false, dir: 'tests/unit' },
  L2: { name: 'API Test', requiresChrome: false, dir: 'tests/api' },
  L3: { name: 'E2E Test', requiresChrome: true, dir: 'tests/e2e' },
  L4: { name: 'UX Flow Test', requiresChrome: true, dir: 'tests/ux' },
  L5: { name: 'Data Flow Test', requiresChrome: true, dir: 'tests/flow' },
};

/**
 * @typedef {Object} TestResult
 * @property {TestLevel} level
 * @property {string} name
 * @property {number} total - Total test count
 * @property {number} passed - Passed test count
 * @property {number} failed - Failed test count
 * @property {number} skipped - Skipped test count
 * @property {Array<{test: string, error: string}>} failures - Failed test details
 * @property {number} duration - Duration in ms
 * @property {boolean} chromeRequired
 * @property {boolean} executed
 */

/**
 * @typedef {Object} QaRunResult
 * @property {string} feature
 * @property {TestResult[]} results
 * @property {number} passRate - Overall pass rate (0-100)
 * @property {number} criticalCount - Critical failure count
 * @property {number} totalTests
 * @property {number} totalPassed
 * @property {number} totalFailed
 * @property {number} duration - Total duration in ms
 * @property {boolean} chromeAvailable
 * @property {string[]} skippedLevels
 */

/**
 * Run all test levels for a feature
 * @param {string} feature - Feature name
 * @param {Object} [options]
 * @param {boolean} [options.chromeAvailable=false]
 * @param {string[]} [options.levels=['L1','L2','L3','L4','L5']]
 * @returns {QaRunResult}
 */
function runTests(feature, options = {}) {
  const { debugLog, PROJECT_DIR } = getCore();
  const chromeAvailable = options.chromeAvailable || false;
  const levels = options.levels || ['L1', 'L2', 'L3', 'L4', 'L5'];

  const results = [];
  const skippedLevels = [];
  const startTime = Date.now();

  for (const level of levels) {
    const spec = TEST_LEVELS[level];
    if (!spec) continue;

    if (spec.requiresChrome && !chromeAvailable) {
      skippedLevels.push(level);
      results.push({
        level,
        name: spec.name,
        total: 0, passed: 0, failed: 0, skipped: 0,
        failures: [],
        duration: 0,
        chromeRequired: true,
        executed: false,
      });
      continue;
    }

    const testDir = path.join(PROJECT_DIR, spec.dir, feature);
    if (!fs.existsSync(testDir)) {
      debugLog('QA', `Test directory not found: ${testDir}`, { level });
      results.push({
        level,
        name: spec.name,
        total: 0, passed: 0, failed: 0, skipped: 0,
        failures: [],
        duration: 0,
        chromeRequired: spec.requiresChrome,
        executed: false,
      });
      continue;
    }

    const result = runTestLevel(level, testDir);
    results.push(result);
  }

  // Calculate summary
  const totalTests = results.reduce((s, r) => s + r.total, 0);
  const totalPassed = results.reduce((s, r) => s + r.passed, 0);
  const totalFailed = results.reduce((s, r) => s + r.failed, 0);
  const passRate = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

  // Critical = any L1 failure or L2 auth/data failure
  const criticalCount = _countCriticalFailures(results);

  return {
    feature,
    results,
    passRate,
    criticalCount,
    totalTests,
    totalPassed,
    totalFailed,
    duration: Date.now() - startTime,
    chromeAvailable,
    skippedLevels,
  };
}

/**
 * Run tests for a single level
 * @param {TestLevel} level
 * @param {string} testDir - Absolute path to test directory
 * @returns {TestResult}
 */
function runTestLevel(level, testDir) {
  const { debugLog } = getCore();
  const spec = TEST_LEVELS[level];
  const startTime = Date.now();

  try {
    // Detect test framework from package.json
    const framework = _detectTestFramework();
    const cmd = _buildTestCommand(framework, testDir);

    // C1 fix: reconstruct a human-readable command for the debug log only; the
    // actual execution below uses execFileSync with the argv array, so testDir
    // is never parsed by a shell.
    debugLog('QA', `Running ${level}: ${[cmd.bin, ...cmd.args].join(' ')}`, { testDir });

    const output = execFileSync(cmd.bin, cmd.args, {
      cwd: testDir,
      timeout: 120000, // 2 min per level
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false,
    });

    const parsed = _parseTestOutput(output, framework);

    return {
      level,
      name: spec.name,
      ...parsed,
      duration: Date.now() - startTime,
      chromeRequired: spec.requiresChrome,
      executed: true,
    };
  } catch (err) {
    // Test command failed (non-zero exit = some tests failed)
    const output = (err.stdout || '') + (err.stderr || '');
    const parsed = _parseTestOutput(output, 'unknown');

    return {
      level,
      name: spec.name,
      total: parsed.total || 1,
      passed: parsed.passed || 0,
      failed: parsed.failed || 1,
      skipped: parsed.skipped || 0,
      failures: parsed.failures || [{ test: 'unknown', error: err.message }],
      duration: Date.now() - startTime,
      chromeRequired: spec.requiresChrome,
      executed: true,
    };
  }
}

/**
 * Get test summary for QA report
 * @param {QaRunResult} runResult
 * @returns {Object} Summary object
 */
function getTestSummary(runResult) {
  return {
    feature: runResult.feature,
    passRate: runResult.passRate,
    criticalCount: runResult.criticalCount,
    verdict: runResult.passRate >= 95 && runResult.criticalCount === 0 ? 'PASS' : 'FAIL',
    totalTests: runResult.totalTests,
    totalPassed: runResult.totalPassed,
    totalFailed: runResult.totalFailed,
    skippedLevels: runResult.skippedLevels,
    duration: runResult.duration,
    chromeAvailable: runResult.chromeAvailable,
    levels: runResult.results.map(r => ({
      level: r.level,
      name: r.name,
      executed: r.executed,
      passRate: r.total > 0 ? Math.round((r.passed / r.total) * 100) : null,
      failCount: r.failed,
    })),
  };
}

// ── Private Helpers ──

function _detectTestFramework() {
  const { PROJECT_DIR } = getCore();
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(PROJECT_DIR, 'package.json'), 'utf8'));
    const devDeps = pkg.devDependencies || {};
    const deps = pkg.dependencies || {};
    const allDeps = { ...deps, ...devDeps };

    if (allDeps.vitest) return 'vitest';
    if (allDeps.jest) return 'jest';
    if (allDeps.mocha) return 'mocha';
    return 'node'; // Node.js built-in test runner
  } catch (_) {
    return 'node';
  }
}

// C1 fix (audit): returns {bin, args} so the caller can invoke via execFileSync
// (no shell) instead of execSync with an interpolated shell string. Each testDir
// is now an isolated argv element — shell metacharacters in testDir are inert.
function _buildTestCommand(framework, testDir) {
  switch (framework) {
    case 'vitest': return { bin: 'npx', args: ['vitest', 'run', '--reporter=json', testDir] };
    case 'jest': return { bin: 'npx', args: ['jest', '--json', `--testPathPattern=${testDir}`] };
    case 'mocha': return { bin: 'npx', args: ['mocha', `${testDir}/**/*.test.{js,ts}`, '--reporter', 'json'] };
    default: return { bin: 'node', args: ['--test', testDir] };
  }
}

function _parseTestOutput(output, framework) {
  // Framework-agnostic parsing — tries JSON first, then regex
  try {
    const json = JSON.parse(output);
    // Jest/Vitest JSON format
    if (json.numTotalTests != null) {
      return {
        total: json.numTotalTests,
        passed: json.numPassedTests || 0,
        failed: json.numFailedTests || 0,
        skipped: json.numPendingTests || 0,
        failures: (json.testResults || [])
          .flatMap(r => (r.assertionResults || [])
            .filter(a => a.status === 'failed')
            .map(a => ({ test: a.fullName, error: (a.failureMessages || []).join('\n') }))
          ),
      };
    }
  } catch (_) {}

  // Regex fallback for Node.js test runner or text output
  const passMatch = output.match(/(\d+)\s*pass/i);
  const failMatch = output.match(/(\d+)\s*fail/i);
  const totalMatch = output.match(/(\d+)\s*(test|spec)/i);

  return {
    total: totalMatch ? parseInt(totalMatch[1]) : 0,
    passed: passMatch ? parseInt(passMatch[1]) : 0,
    failed: failMatch ? parseInt(failMatch[1]) : 0,
    skipped: 0,
    failures: [],
  };
}

function _countCriticalFailures(results) {
  let count = 0;
  for (const r of results) {
    if (!r.executed) continue;
    // L1 failures are always critical
    if (r.level === 'L1' && r.failed > 0) count += r.failed;
    // L2 auth/data failures are critical
    if (r.level === 'L2') {
      count += r.failures.filter(f =>
        /auth|token|permission|data.*integrit/i.test(f.test + f.error)
      ).length;
    }
  }
  return count;
}

module.exports = {
  TEST_LEVELS,
  runTests,
  runTestLevel,
  getTestSummary,
};
