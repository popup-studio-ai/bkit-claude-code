/**
 * QA Module — Test execution, Chrome bridge, report generation, quality scanners
 * @module lib/qa
 * @version 2.1.4
 */

const testRunner = require('./test-runner');
const chromeBridge = require('./chrome-bridge');
const reportGenerator = require('./report-generator');
const testPlanBuilder = require('./test-plan-builder');

// Scanner Framework
const DeadCodeScanner = require('./scanners/dead-code');
const ConfigAuditScanner = require('./scanners/config-audit');
const CompletenessScanner = require('./scanners/completeness');
const ShellEscapeScanner = require('./scanners/shell-escape');
const reporter = require('./reporter');

/** Available scanner classes by name */
const SCANNERS = {
  'dead-code': DeadCodeScanner,
  'config-audit': ConfigAuditScanner,
  'completeness': CompletenessScanner,
  'shell-escape': ShellEscapeScanner
};

/**
 * Run all scanners and return aggregated results
 * @param {Object} [options] - Scanner options (rootDir, verbose)
 * @returns {Promise<{ scanners: Object, summary: Object, hasCritical: boolean }>}
 */
async function runAllScanners(options = {}) {
  const results = {};
  let totalCritical = 0;

  for (const [name, ScannerClass] of Object.entries(SCANNERS)) {
    const scanner = new ScannerClass(options);
    const issues = await scanner.scan();
    const summary = scanner.getSummary();
    results[name] = { issues, summary };
    totalCritical += summary.critical;
  }

  return {
    scanners: results,
    summary: {
      totalScanners: Object.keys(SCANNERS).length,
      totalIssues: Object.values(results).reduce((sum, r) => sum + r.issues.length, 0),
      totalCritical
    },
    hasCritical: totalCritical > 0
  };
}

/**
 * Run a single scanner by name
 * @param {string} name - Scanner name ('dead-code', 'config-audit', etc.)
 * @param {Object} [options]
 * @returns {Promise<{ issues: import('./scanner-base').Issue[], summary: Object }>}
 */
async function runScanner(name, options = {}) {
  const ScannerClass = SCANNERS[name];
  if (!ScannerClass) throw new Error(`Unknown scanner: ${name}`);
  const scanner = new ScannerClass(options);
  const issues = await scanner.scan();
  return { issues, summary: scanner.getSummary() };
}

/**
 * Get available scanner names
 * @returns {string[]}
 */
function getScannerNames() {
  return Object.keys(SCANNERS);
}

module.exports = {
  // Test Runner
  runTests: testRunner.runTests,
  runTestLevel: testRunner.runTestLevel,
  getTestSummary: testRunner.getTestSummary,
  TEST_LEVELS: testRunner.TEST_LEVELS,

  // Chrome Bridge
  checkChromeAvailable: chromeBridge.checkChromeAvailable,
  createChromeBridge: chromeBridge.createChromeBridge,

  // Report Generator
  generateQaReport: reportGenerator.generateQaReport,
  formatQaReportMd: reportGenerator.formatQaReportMd,

  // Test Plan Builder
  buildTestPlan: testPlanBuilder.buildTestPlan,
  parseDesignDoc: testPlanBuilder.parseDesignDoc,

  // Scanner Framework
  runAllScanners,
  runScanner,
  getScannerNames,
  SCANNERS,

  // Scanner Reporter
  formatScannerReport: reporter.formatScannerReport,
  formatSummaryReport: reporter.formatSummaryReport
};
