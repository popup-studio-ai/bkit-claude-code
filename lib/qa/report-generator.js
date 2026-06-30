/**
 * QA Report Generator — Produces QA report documents
 * @module lib/qa/report-generator
 * @version 2.1.1
 */

const fs = require('fs');
const path = require('path');

let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

/**
 * @typedef {Object} QaReportData
 * @property {string} feature
 * @property {import('./test-runner').QaRunResult} runResult
 * @property {string} testPlanPath - Path to test plan document
 * @property {string} designDocPath - Path to design document
 * @property {Object} debugAnalysis - Debug analyst output
 */

/**
 * Generate QA report and write to docs/05-qa/
 * @param {QaReportData} data
 * @returns {{path: string, content: string}}
 */
function generateQaReport(data) {
  const { PROJECT_DIR } = getCore();
  const { feature } = data;

  const qaDir = path.join(PROJECT_DIR, 'docs', '05-qa');
  if (!fs.existsSync(qaDir)) {
    fs.mkdirSync(qaDir, { recursive: true });
  }

  const content = formatQaReportMd(data);
  const reportPath = path.join(qaDir, `${feature}.qa-report.md`);
  // H1 fix (audit): atomic tmp+rename for the QA report (content is Markdown, not
  // JSON, so it can't go through stateStore.write which JSON.stringifies — but the
  // same tmp+rename pattern still applies). A SIGKILL mid-write now leaves either
  // the old report or the complete new one, never a truncated half-file.
  const tmpPath = `${reportPath}.tmp.${process.pid}`;
  try {
    fs.writeFileSync(tmpPath, content, 'utf8');
    fs.renameSync(tmpPath, reportPath);
  } catch (e) {
    try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore stale tmp */ }
    throw e;
  }

  return { path: reportPath, content };
}

/**
 * Format QA report as Markdown
 * @param {QaReportData} data
 * @returns {string}
 */
function formatQaReportMd(data) {
  const { feature, runResult } = data;
  const summary = require('./test-runner').getTestSummary(runResult);
  const now = new Date().toISOString().slice(0, 10);

  let md = `# QA Report: ${feature}\n\n`;
  md += `> **Date**: ${now}\n`;
  md += `> **Verdict**: ${summary.verdict}\n`;
  md += `> **Pass Rate**: ${summary.passRate}%\n`;
  md += `> **Critical Issues**: ${summary.criticalCount}\n\n`;
  md += `---\n\n`;

  // Summary table
  md += `## Test Summary\n\n`;
  md += `| Level | Name | Executed | Pass Rate | Failed |\n`;
  md += `|-------|------|:--------:|:---------:|:------:|\n`;
  for (const level of summary.levels) {
    const exec = level.executed ? 'Yes' : 'Skipped';
    const rate = level.passRate != null ? `${level.passRate}%` : 'N/A';
    md += `| ${level.level} | ${level.name} | ${exec} | ${rate} | ${level.failCount} |\n`;
  }
  md += `\n`;

  // Skipped levels note
  if (summary.skippedLevels.length > 0) {
    md += `> **Note**: ${summary.skippedLevels.join(', ')} skipped — `;
    md += summary.chromeAvailable
      ? 'no test files found\n\n'
      : 'Chrome MCP unavailable\n\n';
  }

  // Failed tests detail
  const failures = runResult.results.flatMap(r =>
    r.failures.map(f => ({ level: r.level, ...f }))
  );
  if (failures.length > 0) {
    md += `## Failed Tests\n\n`;
    for (const f of failures) {
      md += `### ${f.level}: ${f.test}\n\n`;
      md += `\`\`\`\n${f.error}\n\`\`\`\n\n`;
    }
  }

  // Metrics
  md += `## Metrics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${summary.totalTests} |\n`;
  md += `| Passed | ${summary.totalPassed} |\n`;
  md += `| Failed | ${summary.totalFailed} |\n`;
  md += `| Duration | ${summary.duration}ms |\n`;
  md += `| Chrome Available | ${summary.chromeAvailable ? 'Yes' : 'No'} |\n`;

  return md;
}

module.exports = {
  generateQaReport,
  formatQaReportMd,
};
