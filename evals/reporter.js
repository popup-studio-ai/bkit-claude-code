#!/usr/bin/env node
/**
 * Skill Eval Reporter
 * @module evals/reporter
 * @version 1.6.1
 *
 * Generates formatted reports from eval results.
 * v1.6.1: Enhanced with detailed criteria breakdown and category statistics.
 */

/**
 * Format eval results as markdown report
 * @param {Object} benchmarkResult - Result from runBenchmark()
 * @returns {string} Markdown formatted report
 */
function formatMarkdownReport(benchmarkResult) {
  const { timestamp, version, model, summary, details } = benchmarkResult;

  const lines = [
    `# bkit Skill Evals Report`,
    ``,
    `> Generated: ${timestamp}`,
    `> Version: ${version}`,
    `> Model: ${model}`,
    ``,
    `## Summary`,
    ``,
    `| Classification | Total | Passed | Rate |`,
    `|:---:|:---:|:---:|:---:|`,
    `| Workflow | ${summary.workflow.total} | ${summary.workflow.passed} | ${pct(summary.workflow)} |`,
    `| Capability | ${summary.capability.total} | ${summary.capability.passed} | ${pct(summary.capability)} |`,
    `| Hybrid | ${summary.hybrid.total} | ${summary.hybrid.passed} | ${pct(summary.hybrid)} |`,
  ];

  for (const [cls, results] of Object.entries(details)) {
    lines.push(``, `## ${cls.charAt(0).toUpperCase() + cls.slice(1)} Skills`, ``);
    lines.push(`| Skill | Pass | Details |`);
    lines.push(`|-------|:----:|---------|`);
    for (const r of results) {
      const detail = r.details?.error || r.details?.message || '';
      lines.push(`| ${r.skill} | ${r.pass ? 'PASS' : 'FAIL'} | ${detail} |`);
    }
  }

  return lines.join('\n');
}

/**
 * Format eval results with detailed criteria breakdown
 * @param {Object} benchmarkResult - Result from runBenchmark()
 * @returns {string} Enhanced markdown report
 */
function formatDetailedReport(benchmarkResult) {
  const { timestamp, version, model, summary, details } = benchmarkResult;
  const allResults = [
    ...(details.workflow || []),
    ...(details.capability || []),
    ...(details.hybrid || []),
  ];

  const totalSkills = allResults.length;
  const passedSkills = allResults.filter(r => r.pass).length;
  const failedSkills = totalSkills - passedSkills;

  // Placeholder vs real content statistics
  let placeholderCount = 0;
  let realContentCount = 0;
  for (const r of allResults) {
    if (r.details?.failedCriteria?.some(c => c.includes('placeholder'))) {
      placeholderCount++;
    } else {
      realContentCount++;
    }
  }

  const lines = [
    `# bkit Skill Evals Detailed Report`,
    ``,
    `> Generated: ${timestamp}`,
    `> Version: ${version}`,
    `> Model: ${model}`,
    ``,
    `## Overall Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Skills | ${totalSkills} |`,
    `| Passed | ${passedSkills} |`,
    `| Failed | ${failedSkills} |`,
    `| Pass Rate | ${totalSkills ? Math.round((passedSkills / totalSkills) * 100) : 0}% |`,
    `| Real Content | ${realContentCount} |`,
    `| Placeholder | ${placeholderCount} |`,
    ``,
    `## Category Breakdown`,
    ``,
    `| Classification | Total | Passed | Rate |`,
    `|:---:|:---:|:---:|:---:|`,
    `| Workflow | ${summary.workflow.total} | ${summary.workflow.passed} | ${pct(summary.workflow)} |`,
    `| Capability | ${summary.capability.total} | ${summary.capability.passed} | ${pct(summary.capability)} |`,
    `| Hybrid | ${summary.hybrid.total} | ${summary.hybrid.passed} | ${pct(summary.hybrid)} |`,
  ];

  // Failed skills detail
  const failedResults = allResults.filter(r => !r.pass);
  if (failedResults.length > 0) {
    lines.push(``, `## Failed Skills Detail`, ``);
    for (const r of failedResults) {
      lines.push(`### ${r.skill} (${r.classification})`);
      if (r.details?.error) {
        lines.push(`- **Error**: ${r.details.error}`);
      }
      if (r.details?.failedCriteria?.length > 0) {
        lines.push(`- **Failed Criteria**:`);
        for (const c of r.details.failedCriteria) {
          lines.push(`  - ${c}`);
        }
      }
      if (r.details?.score !== undefined) {
        lines.push(`- **Score**: ${Math.round(r.details.score * 100)}%`);
      }
      lines.push(``);
    }
  }

  // Score distribution
  const scores = allResults
    .filter(r => r.details?.score !== undefined)
    .map(r => r.details.score);

  if (scores.length > 0) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    lines.push(`## Score Distribution`, ``);
    lines.push(`| Metric | Value |`);
    lines.push(`|--------|-------|`);
    lines.push(`| Average Score | ${Math.round(avg * 100)}% |`);
    lines.push(`| Min Score | ${Math.round(Math.min(...scores) * 100)}% |`);
    lines.push(`| Max Score | ${Math.round(Math.max(...scores) * 100)}% |`);
  }

  return lines.join('\n');
}

function pct(s) {
  if (!s.total) return 'N/A';
  return `${Math.round((s.passed / s.total) * 100)}%`;
}

/**
 * Format eval results as JSON summary
 * @param {Object} benchmarkResult - Result from runBenchmark()
 * @returns {Object} Compact summary
 */
function formatJsonSummary(benchmarkResult) {
  const { timestamp, summary } = benchmarkResult;
  const total = summary.workflow.total + summary.capability.total + summary.hybrid.total;
  const passed = summary.workflow.passed + summary.capability.passed + summary.hybrid.passed;
  return { timestamp, total, passed, rate: total ? Math.round((passed / total) * 100) : 0 };
}

module.exports = { formatMarkdownReport, formatDetailedReport, formatJsonSummary };
