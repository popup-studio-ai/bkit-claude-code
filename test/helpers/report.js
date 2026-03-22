'use strict';

const fs = require('fs');
const path = require('path');

const CATEGORY_NAMES = {
  unit: 'Unit Tests',
  integration: 'Integration Tests',
  security: 'Security Tests',
  regression: 'Regression Tests',
  performance: 'Performance Tests',
  philosophy: 'Philosophy Tests',
  ux: 'UX Tests',
  e2e: 'E2E Tests (Node)',
  architecture: 'Architecture Tests',
  'controllable-ai': 'Controllable AI Tests',
};

// v1.6.2 baseline for comparison
const V162_BASELINE = {
  categories: 8,
  totalTC: 1151,
  unit: 450,
  integration: 130,
  security: 80,
  regression: 200,
  performance: 76,
  philosophy: 60,
  ux: 60,
  e2e: 20,
};

function generateReport(allResults) {
  const categories = Object.keys(allResults);
  let totalPassed = 0, totalFailed = 0, totalSkipped = 0, totalTC = 0;

  categories.forEach(cat => {
    const r = allResults[cat];
    totalPassed += r.passed || 0;
    totalFailed += r.failed || 0;
    totalSkipped += r.skipped || 0;
    totalTC += r.total || 0;
  });

  const passRate = totalTC > 0 ? ((totalPassed / totalTC) * 100).toFixed(1) : '0.0';
  const timestamp = new Date().toISOString();

  let report = `# bkit v2.0.3 Comprehensive Test Report\n\n`;
  report += `> Generated: ${timestamp}\n`;
  report += `> Total: ${totalTC} TC, ${totalPassed} PASS, ${totalFailed} FAIL, ${totalSkipped} SKIP\n`;
  report += `> Pass Rate: ${passRate}%\n\n`;
  report += `---\n\n`;

  report += `## Summary\n\n`;
  report += `| Category | Total | Passed | Failed | Skipped | Rate |\n`;
  report += `|----------|:-----:|:------:|:------:|:-------:|:----:|\n`;

  categories.forEach(cat => {
    const r = allResults[cat];
    const rate = r.total > 0 ? ((r.passed / r.total) * 100).toFixed(1) : '0.0';
    const status = r.failed === 0 ? 'PASS' : 'FAIL';
    const displayName = CATEGORY_NAMES[cat] || cat;
    report += `| ${displayName} | ${r.total} | ${r.passed} | ${r.failed} | ${r.skipped || 0} | ${rate}% ${status} |\n`;
  });

  report += `| **Total** | **${totalTC}** | **${totalPassed}** | **${totalFailed}** | **${totalSkipped}** | **${passRate}%** |\n\n`;

  // v1.6.2 -> v2.0.0 comparison
  report += `## Version Comparison: v1.6.2 → v2.0.0\n\n`;
  report += `| Metric | v1.6.2 | v2.0.0 | Delta |\n`;
  report += `|--------|:------:|:------:|:-----:|\n`;
  report += `| Categories | ${V162_BASELINE.categories} | ${categories.length} | +${categories.length - V162_BASELINE.categories} |\n`;
  report += `| Total TC | ${V162_BASELINE.totalTC} | ${totalTC} | +${totalTC - V162_BASELINE.totalTC} |\n`;

  // Per-category comparison
  categories.forEach(cat => {
    const r = allResults[cat];
    const baseline = V162_BASELINE[cat] || 0;
    const delta = r.total - baseline;
    const deltaStr = delta >= 0 ? `+${delta}` : `${delta}`;
    const displayName = CATEGORY_NAMES[cat] || cat;
    report += `| ${displayName} | ${baseline || 'N/A'} | ${r.total} | ${baseline ? deltaStr : 'NEW'} |\n`;
  });

  report += `\n`;

  if (totalFailed > 0) {
    report += `## Failures\n\n`;
    categories.forEach(cat => {
      const r = allResults[cat];
      if (r.failures && r.failures.length > 0) {
        const displayName = CATEGORY_NAMES[cat] || cat;
        report += `### ${displayName}\n\n`;
        r.failures.forEach(f => {
          report += `- **${f.id}**: ${f.message}\n`;
        });
        report += `\n`;
      }
    });
  }

  report += `## Verdict\n\n`;
  if (totalFailed === 0) {
    report += `**ALL TESTS PASSED** - bkit v2.0.3 is ready for release.\n`;
  } else {
    report += `**${totalFailed} TESTS FAILED** - Issues must be resolved before release.\n`;
  }

  return report;
}

function saveReport(report, outputPath) {
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outputPath, report, 'utf8');
  console.log(`Report saved to: ${outputPath}`);
}

module.exports = { generateReport, saveReport };
