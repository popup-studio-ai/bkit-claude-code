/**
 * Scanner Reporter — format scan results for console, JSON, and markdown
 * @module lib/qa/reporter
 * @version 2.1.4
 */

/** Severity icons for console output */
const SEVERITY_ICONS = {
  CRITICAL: '\x1b[31m✖\x1b[0m',  // Red
  WARNING: '\x1b[33m⚠\x1b[0m',   // Yellow
  INFO: '\x1b[36mℹ\x1b[0m'       // Cyan
};

/** Severity labels with color for console output */
const SEVERITY_LABELS = {
  CRITICAL: '\x1b[31mCRITICAL\x1b[0m',
  WARNING: '\x1b[33mWARNING\x1b[0m',
  INFO: '\x1b[36mINFO\x1b[0m'
};

/**
 * Format a single scanner's report
 * @param {string} name - Scanner name
 * @param {Array<import('./scanner-base').Issue>} issues - Array of issues
 * @param {'console'|'json'|'markdown'} format - Output format
 * @returns {string}
 */
function formatScannerReport(name, issues, format = 'console') {
  switch (format) {
    case 'json':
      return formatJson(name, issues);
    case 'markdown':
      return formatMarkdown(name, issues);
    case 'console':
    default:
      return formatConsole(name, issues);
  }
}

/**
 * Format a summary report of all scanner results
 * @param {Object} allResults - Results from runAllScanners()
 * @param {'console'|'json'|'markdown'} format - Output format
 * @returns {string}
 */
function formatSummaryReport(allResults, format = 'console') {
  switch (format) {
    case 'json':
      return JSON.stringify(allResults, null, 2);
    case 'markdown':
      return formatSummaryMarkdown(allResults);
    case 'console':
    default:
      return formatSummaryConsole(allResults);
  }
}

/**
 * Format issues as console output with colors
 * @param {string} name - Scanner name
 * @param {Array} issues - Issues array
 * @returns {string}
 */
function formatConsole(name, issues) {
  const lines = [];
  const critical = issues.filter(i => i.severity === 'CRITICAL').length;
  const warning = issues.filter(i => i.severity === 'WARNING').length;
  const info = issues.filter(i => i.severity === 'INFO').length;

  lines.push('');
  lines.push(`\x1b[1m--- ${name} ---\x1b[0m`);
  lines.push(`  Found ${issues.length} issue(s): ${critical} critical, ${warning} warning, ${info} info`);

  if (issues.length === 0) {
    lines.push('  \x1b[32mNo issues found.\x1b[0m');
    return lines.join('\n');
  }

  lines.push('');

  for (const issue of issues) {
    const icon = SEVERITY_ICONS[issue.severity] || '?';
    const label = SEVERITY_LABELS[issue.severity] || issue.severity;
    const location = issue.line > 0 ? `${issue.file}:${issue.line}` : issue.file;
    lines.push(`  ${icon} ${label}  ${location}`);
    lines.push(`    ${issue.message}`);
    if (issue.fix) {
      lines.push(`    \x1b[90mFix: ${issue.fix}\x1b[0m`);
    }
  }

  return lines.join('\n');
}

/**
 * Format issues as JSON string
 * @param {string} name - Scanner name
 * @param {Array} issues - Issues array
 * @returns {string}
 */
function formatJson(name, issues) {
  return JSON.stringify({
    scanner: name,
    issues,
    summary: {
      critical: issues.filter(i => i.severity === 'CRITICAL').length,
      warning: issues.filter(i => i.severity === 'WARNING').length,
      info: issues.filter(i => i.severity === 'INFO').length,
      total: issues.length
    }
  }, null, 2);
}

/**
 * Format issues as markdown table
 * @param {string} name - Scanner name
 * @param {Array} issues - Issues array
 * @returns {string}
 */
function formatMarkdown(name, issues) {
  const lines = [];
  lines.push(`### ${name}`);
  lines.push('');

  if (issues.length === 0) {
    lines.push('No issues found.');
    return lines.join('\n');
  }

  lines.push('| Severity | File | Line | Message | Fix |');
  lines.push('|----------|------|------|---------|-----|');

  for (const issue of issues) {
    const fix = issue.fix || '-';
    lines.push(`| ${issue.severity} | ${issue.file} | ${issue.line} | ${issue.message} | ${fix} |`);
  }

  return lines.join('\n');
}

/**
 * Format summary of all results for console
 * @param {Object} allResults
 * @returns {string}
 */
function formatSummaryConsole(allResults) {
  const lines = [];
  lines.push('');
  lines.push('\x1b[1m=== bkit Pre-Release Quality Scan ===\x1b[0m');
  lines.push(`Scanners: ${allResults.summary.totalScanners}`);
  lines.push(`Total Issues: ${allResults.summary.totalIssues}`);
  lines.push(`Critical: ${allResults.summary.totalCritical}`);
  lines.push('');

  for (const [name, result] of Object.entries(allResults.scanners)) {
    const s = result.summary;
    const status = s.critical > 0 ? '\x1b[31mFAIL\x1b[0m' : '\x1b[32mPASS\x1b[0m';
    lines.push(`  ${status} ${name}: ${s.total} issues (${s.critical}C/${s.warning}W/${s.info}I)`);
  }

  lines.push('');
  const overall = allResults.hasCritical
    ? '\x1b[31mRESULT: BLOCKED — fix critical issues before release\x1b[0m'
    : '\x1b[32mRESULT: PASS\x1b[0m';
  lines.push(overall);

  return lines.join('\n');
}

/**
 * Format summary of all results as markdown
 * @param {Object} allResults
 * @returns {string}
 */
function formatSummaryMarkdown(allResults) {
  const lines = [];
  lines.push('## Pre-Release Quality Scan');
  lines.push('');
  lines.push(`| Scanner | Total | Critical | Warning | Info | Status |`);
  lines.push(`|---------|-------|----------|---------|------|--------|`);

  for (const [name, result] of Object.entries(allResults.scanners)) {
    const s = result.summary;
    const status = s.critical > 0 ? 'FAIL' : 'PASS';
    lines.push(`| ${name} | ${s.total} | ${s.critical} | ${s.warning} | ${s.info} | ${status} |`);
  }

  lines.push('');
  lines.push(`**Total Issues**: ${allResults.summary.totalIssues}`);
  lines.push(`**Critical**: ${allResults.summary.totalCritical}`);
  lines.push(`**Result**: ${allResults.hasCritical ? 'BLOCKED' : 'PASS'}`);

  return lines.join('\n');
}

module.exports = {
  formatScannerReport,
  formatSummaryReport
};
