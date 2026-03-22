#!/usr/bin/env node
'use strict';

/**
 * bkit v2.0.3 Comprehensive Test Runner
 * ~3100+ TC across 10 perspectives
 *
 * Usage:
 *   node test/run-all.js                    # Run all tests (Node layer only, ~1850 TC)
 *   node test/run-all.js --unit             # Run unit tests only (~850 TC)
 *   node test/run-all.js --integration      # Run integration tests only (~200 TC)
 *   node test/run-all.js --security         # Run security tests only (~130 TC)
 *   node test/run-all.js --regression       # Run regression tests only (~260 TC)
 *   node test/run-all.js --performance      # Run performance tests only (~126 TC)
 *   node test/run-all.js --philosophy       # Run philosophy tests only (60 TC)
 *   node test/run-all.js --ux              # Run UX tests only (60 TC)
 *   node test/run-all.js --e2e             # Run E2E tests (node portion, 20 TC)
 *   node test/run-all.js --architecture    # Run architecture tests only (~100 TC)
 *   node test/run-all.js --controllable-ai # Run controllable AI tests only (~80 TC)
 *
 * For full E2E including claude -p (80 TC):
 *   bash test/e2e/run-e2e.sh
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { generateReport, saveReport } = require('./helpers/report');

const ROOT = path.resolve(__dirname, '..');
const TEST_DIR = __dirname;

const CATEGORIES = {
  unit: {
    name: 'Unit Tests',
    files: [
      'unit/ambiguity.test.js',
      'unit/trigger.test.js',
      'unit/creator.test.js',
      'unit/orchestrator.test.js',
      'unit/coordinator.test.js',
      'unit/runner.test.js',
      'unit/reporter.test.js',
      'unit/other-modules.test.js',
      'unit/post-compaction.test.js',
      'unit/stop-failure.test.js',
      'unit/plugin-data.test.js',
      'unit/constants.test.js',
      'unit/errors.test.js',
      'unit/state-store.test.js',
      'unit/hook-io.test.js',
      'unit/backup-scheduler.test.js',
      'unit/state-machine.test.js',
      'unit/automation-controller.test.js',
      'unit/workflow-parser.test.js',
      'unit/workflow-engine.test.js',
      'unit/do-detector.test.js',
      'unit/circuit-breaker.test.js',
      'unit/resume.test.js',
      'unit/lifecycle.test.js',
      'unit/full-auto-do.test.js',
      'unit/feature-manager.test.js',
      'unit/batch-orchestrator.test.js',
      'unit/destructive-detector.test.js',
      'unit/checkpoint-manager.test.js',
      'unit/loop-breaker.test.js',
      'unit/blast-radius.test.js',
      'unit/trust-engine.test.js',
      'unit/scope-limiter.test.js',
      'unit/audit-logger.test.js',
      'unit/decision-tracer.test.js',
      'unit/explanation-gen.test.js',
      'unit/gate-manager.test.js',
      'unit/metrics-collector.test.js',
      'unit/regression-guard.test.js',
      'unit/ansi.test.js',
      'unit/progress-bar.test.js',
      'unit/workflow-map.test.js',
      'unit/agent-panel.test.js',
      'unit/impact-view.test.js',
      'unit/control-panel.test.js',
      'unit/core-modules.test.js',
      'unit/task-modules.test.js',
      'unit/team-modules.test.js',
      'unit/pdca-modules.test.js',
      'unit/root-modules.test.js',
      'unit/index-modules.test.js',
      'unit/v200-skills.test.js',
      'unit/v200-mcp-servers.test.js',
      'unit/v200-workflows.test.js',
    ],
    expected: 1403,
  },
  integration: {
    name: 'Integration Tests',
    files: [
      'integration/config-sync.test.js',
      'integration/module-chain.test.js',
      'integration/hook-chain.test.js',
      'integration/export-compat.test.js',
      'integration/session-restore.test.js',
      'integration/hook-wiring.test.js',
      'integration/state-machine-flow.test.js',
      'integration/audit-pipeline.test.js',
      'integration/quality-pipeline.test.js',
      'integration/control-pipeline.test.js',
      'integration/common-removal.test.js',
      'integration/mcp-server.test.js',
      'integration/v200-wiring.test.js',
      'integration/v200-dashboard.test.js',
      'integration/v200-common-bridge.test.js',
      'integration/pm-skills-integration.test.js',
      'integration/impact-analysis-section.test.js',
    ],
    expected: 479,
  },
  security: {
    name: 'Security Tests',
    files: [
      'security/agent-frontmatter.test.js',
      'security/config-permissions.test.js',
      'security/runtime-security.test.js',
      'security/destructive-prevention.test.js',
      'security/destructive-rules.test.js',
      'security/automation-levels.test.js',
      'security/checkpoint-integrity.test.js',
      'security/scope-limiter.test.js',
      'security/trust-score-safety.test.js',
    ],
    expected: 205,
  },
  regression: {
    name: 'Regression Tests',
    files: [
      'regression/pdca-core.test.js',
      'regression/skills-28.test.js',
      'regression/agents-21.test.js',
      'regression/hooks-10.test.js',
      'regression/cc-compat.test.js',
      'regression/agents-effort.test.js',
      'regression/v162-compat.test.js',
      'regression/common-removal.test.js',
      'regression/hooks-22.test.js',
      'regression/skills-35.test.js',
      'regression/agents-29.test.js',
      'regression/status-v3-migration.test.js',
      'regression/skills-36.test.js',
      'regression/agents-31.test.js',
    ],
    expected: 416,
  },
  performance: {
    name: 'Performance Tests',
    files: [
      'performance/hook-perf.test.js',
      'performance/core-function-perf.test.js',
      'performance/benchmark-perf.test.js',
      'performance/module-load-perf.test.js',
      'performance/plugin-data-perf.test.js',
      'performance/hook-cold-start.test.js',
      'performance/direct-import.test.js',
      'performance/state-store-perf.test.js',
      'performance/audit-write-perf.test.js',
      'performance/ui-render-perf.test.js',
    ],
    expected: 160,
  },
  philosophy: {
    name: 'Philosophy Tests',
    files: [
      'philosophy/no-guessing.test.js',
      'philosophy/automation-first.test.js',
      'philosophy/docs-equals-code.test.js',
      'philosophy/security-by-default.test.js',
      'philosophy/no-guessing-v2.test.js',
      'philosophy/automation-first-v2.test.js',
      'philosophy/docs-equals-code-v2.test.js',
      'philosophy/security-by-default-v2.test.js',
    ],
    expected: 138,
  },
  ux: {
    name: 'UX Tests',
    files: [
      'ux/clarification-flow.test.js',
      'ux/team-mode-ux.test.js',
      'ux/pdca-status-ux.test.js',
      'ux/language-support.test.js',
      'ux/executive-summary.test.js',
      'ux/pdca-dashboard.test.js',
      'ux/workflow-map-ux.test.js',
      'ux/impact-view-ux.test.js',
      'ux/agent-panel-ux.test.js',
      'ux/control-panel-ux.test.js',
      'ux/skill-commands.test.js',
    ],
    expected: 160,
  },
  e2e: {
    name: 'E2E Tests (Node)',
    files: [
      'e2e/eval-benchmark.test.js',
      'e2e/checkpoint-rollback.test.js',
      'e2e/pdca-auto-cycle.test.js',
      'e2e/error-recovery.test.js',
    ],
    expected: 61,
  },
  architecture: {
    name: 'Architecture Tests',
    files: [
      'architecture/state-machine.test.js',
      'architecture/module-dependencies.test.js',
      'architecture/hook-flow.test.js',
      'architecture/data-schema.test.js',
      'architecture/export-completeness.test.js',
    ],
    expected: 100,
  },
  'controllable-ai': {
    name: 'Controllable AI Tests',
    files: [
      'controllable-ai/safe-defaults.test.js',
      'controllable-ai/progressive-trust.test.js',
      'controllable-ai/full-visibility.test.js',
      'controllable-ai/always-interruptible.test.js',
    ],
    expected: 80,
  },
};

function parseTestOutput(output, filePath) {
  const lines = output.split('\n');
  let passed = 0, failed = 0, skipped = 0;
  const failures = [];

  // Strategy 1: Look for summary line (most reliable)
  // Formats: "Total: 35 | Pass: 35 | Fail: 0", "Total: 30 | PASS: 30 | FAIL: 0"
  const summaryMatch = output.match(/Total:\s*(\d+)\s*\|\s*Pass(?:ed)?:\s*(\d+)\s*\|\s*Fail(?:ed)?:\s*(\d+)/i);
  if (summaryMatch) {
    const total = parseInt(summaryMatch[1]);
    passed = parseInt(summaryMatch[2]);
    failed = parseInt(summaryMatch[3]);
    skipped = total - passed - failed;
  } else {
    // Strategy 2: Count individual lines with various formats
    lines.forEach(line => {
      // Format: "  PASS: ID - message" or "  PASS  SEC-AF-001:" or "[PASS]" or "✓"
      if (/^\s*(PASS:|PASS\s{2,}\S)/.test(line) || /\[PASS\]/.test(line)) passed++;
      else if (/✓/.test(line) && !/Summary|Total|Pass Rate|Passed:/.test(line)) passed++;

      if (/^\s*(FAIL:|FAIL\s{2,}\S)/.test(line) || /\[FAIL\]/.test(line)) {
        failed++;
        const match = line.match(/(?:FAIL:|FAIL\s+|\[FAIL\]\s*)(\S+?)[\s:]*-?\s*(.*)/);
        if (match) failures.push({ id: match[1], message: match[2] });
      } else if (/✗/.test(line) && !/Summary|Total|Failed:/.test(line)) {
        failed++;
      }

      if (/SKIP:|\[SKIP\]|⏭/.test(line) && !/Skipped:/.test(line)) skipped++;
    });
  }

  // Strategy 2b: Extract failures from summary sections
  if (failures.length === 0 && failed > 0) {
    lines.forEach(line => {
      const fMatch = line.match(/\[FAIL\]\s*(\S+?):\s*(.*)/);
      if (fMatch) failures.push({ id: fMatch[1], message: fMatch[2] });
      const fMatch2 = line.match(/Assertion failed:\s*(\S+?):\s*(.*)/);
      if (fMatch2 && !failures.find(f => f.id === fMatch2[1])) {
        failures.push({ id: fMatch2[1], message: fMatch2[2] });
      }
    });
  }

  // Strategy 3: Check for box-drawing summary (performance/e2e tests)
  const passedBoxMatch = output.match(/Passed:\s*(\d+)/);
  const failedBoxMatch = output.match(/Failed:\s*(\d+)/);
  const skippedBoxMatch = output.match(/Skipped:\s*(\d+)/);
  if (passedBoxMatch && passed === 0 && failed === 0) {
    passed = parseInt(passedBoxMatch[1]);
    failed = failedBoxMatch ? parseInt(failedBoxMatch[1]) : 0;
    skipped = skippedBoxMatch ? parseInt(skippedBoxMatch[1]) : 0;
  }

  const total = passed + failed + skipped;
  return { passed, failed, total, skipped, failures };
}

function runTestFile(filePath) {
  const fullPath = path.join(TEST_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    return { passed: 0, failed: 0, total: 0, skipped: 1, failures: [{ id: filePath, message: 'File not found' }] };
  }

  try {
    const output = execSync(`node "${fullPath}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: 120000,
      env: { ...process.env, NODE_PATH: ROOT },
    });

    return parseTestOutput(output, filePath);
  } catch (e) {
    const output = (e.stdout || '') + (e.stderr || '');
    const result = parseTestOutput(output, filePath);

    if (result.passed === 0 && result.failed === 0) {
      result.failed = 1;
      result.total = 1;
      result.failures.push({ id: filePath, message: `Execution error: ${e.message}` });
    }

    return result;
  }
}

function runCategory(category) {
  const config = CATEGORIES[category];
  if (!config) {
    console.error(`Unknown category: ${category}`);
    return { passed: 0, failed: 0, total: 0, skipped: 0, failures: [] };
  }

  console.log(`\n${'#'.repeat(60)}`);
  console.log(`# ${config.name} (Expected: ~${config.expected} TC)`);
  console.log(`${'#'.repeat(60)}\n`);

  let totalPassed = 0, totalFailed = 0, totalTC = 0, totalSkipped = 0;
  const allFailures = [];

  config.files.forEach(file => {
    console.log(`--- ${file} ---`);
    const result = runTestFile(file);
    totalPassed += result.passed;
    totalFailed += result.failed;
    totalTC += result.total;
    totalSkipped += result.skipped;
    allFailures.push(...result.failures);
    console.log(`  Subtotal: ${result.passed}/${result.total} PASS\n`);
  });

  const rate = totalTC > 0 ? ((totalPassed / totalTC) * 100).toFixed(1) : '0.0';
  console.log(`${config.name} Total: ${totalPassed}/${totalTC} PASS (${rate}%), ${totalFailed} FAIL, ${totalSkipped} SKIP`);

  return { passed: totalPassed, failed: totalFailed, total: totalTC, skipped: totalSkipped, failures: allFailures };
}

async function main() {
  const args = process.argv.slice(2);
  const startTime = Date.now();

  console.log('='.repeat(60));
  console.log('bkit v2.0.3 Comprehensive Test Runner');
  console.log(`Date: ${new Date().toISOString()}`);
  console.log('='.repeat(60));

  const allResults = {};
  const categoriesToRun = args.length > 0
    ? args.map(a => a.replace('--', '')).filter(c => CATEGORIES[c])
    : Object.keys(CATEGORIES);

  for (const cat of categoriesToRun) {
    allResults[cat] = runCategory(cat);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nTotal execution time: ${elapsed}s`);

  const report = generateReport(allResults);
  const reportPath = path.join(ROOT, 'docs/04-report/features/bkit-v200-test.report.md');
  saveReport(report, reportPath);

  console.log(report);

  const totalFailed = Object.values(allResults).reduce((sum, r) => sum + r.failed, 0);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('Test runner error:', e);
  process.exit(1);
});
