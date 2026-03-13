/**
 * Skill Quality Reporter (Enhanced)
 *
 * Collects skill usage statistics and generates quality reports.
 * Tracks: invocation count, success/failure, user satisfaction signals,
 * and /btw feedback linked to specific skills.
 *
 * Enhanced features (v2.0.0):
 *   - Trend analysis (7-day / 30-day windows)
 *   - Multi-format output (text, JSON, markdown)
 *   - A/B comparison support
 *   - Failure categorization
 *   - Session-based grouping
 *   - Cache integration
 *
 * Data stored in: .bkit/skill-usage-stats.json
 *
 * @module lib/skill-quality-reporter
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

// ─── Constants ──────────────────────────────────────────

const STATS_FILE = '.bkit/skill-usage-stats.json';
const BTW_FILE = '.bkit/btw-suggestions.json';
const TREND_WINDOW_DAYS = 7;
const MAX_HISTORY_ENTRIES = 100;

// ─── Data Access ────────────────────────────────────────

/**
 * Read or initialize skill usage stats.
 * @param {string} [projectDir=process.cwd()]
 * @returns {object}
 */
function readStats(projectDir) {
  projectDir = projectDir || process.cwd();
  const statsPath = path.join(projectDir, STATS_FILE);
  if (!fs.existsSync(statsPath)) {
    return {
      version: '2.0',
      skills: {},
      history: [],
      lastReportGenerated: null,
    };
  }
  try {
    const data = JSON.parse(fs.readFileSync(statsPath, 'utf-8'));
    // Migrate v1 → v2
    if (data.version === '1.0') {
      data.version = '2.0';
      data.history = data.history || [];
    }
    return data;
  } catch {
    return { version: '2.0', skills: {}, history: [], lastReportGenerated: null };
  }
}

/**
 * Write skill usage stats.
 * @param {object} stats
 * @param {string} [projectDir=process.cwd()]
 */
function writeStats(stats, projectDir) {
  projectDir = projectDir || process.cwd();
  const statsPath = path.join(projectDir, STATS_FILE);
  const dir = path.dirname(statsPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2), 'utf-8');
}

// ─── Tracking ───────────────────────────────────────────

/**
 * Record a skill invocation with categorization.
 * @param {string} skillName
 * @param {'success'|'failure'|'partial'} outcome
 * @param {object} [metadata] - Optional context (feature, phase, failureCategory, duration)
 * @param {string} [projectDir]
 */
function recordInvocation(skillName, outcome, metadata, projectDir) {
  const validOutcomes = ['success', 'failure', 'partial'];
  if (!validOutcomes.includes(outcome)) {
    outcome = 'failure';
  }

  const stats = readStats(projectDir);
  const now = new Date().toISOString();

  if (!stats.skills[skillName]) {
    stats.skills[skillName] = {
      invocations: 0,
      success: 0,
      failure: 0,
      partial: 0,
      firstUsed: now,
      lastUsed: null,
      btwFeedbackIds: [],
      failureCategories: {},
      avgDuration: 0,
      sessions: [],
    };
  }

  const skill = stats.skills[skillName];
  skill.invocations += 1;
  skill[outcome] = (skill[outcome] || 0) + 1;
  skill.lastUsed = now;

  // Failure categorization
  if (outcome === 'failure' && metadata?.failureCategory) {
    const cat = metadata.failureCategory;
    skill.failureCategories[cat] = (skill.failureCategories[cat] || 0) + 1;
  }

  // Duration tracking
  if (metadata?.duration) {
    const n = skill.invocations;
    skill.avgDuration = ((skill.avgDuration * (n - 1)) + metadata.duration) / n;
  }

  // Session tracking (last 10)
  if (metadata?.sessionId) {
    if (!skill.sessions.includes(metadata.sessionId)) {
      skill.sessions.push(metadata.sessionId);
      if (skill.sessions.length > 10) skill.sessions.shift();
    }
  }

  // Metadata entries
  if (metadata) {
    if (!skill.metadata) skill.metadata = [];
    skill.metadata.push({ ...metadata, timestamp: now, outcome });
    if (skill.metadata.length > 20) {
      skill.metadata = skill.metadata.slice(-20);
    }
  }

  // History (global timeline)
  stats.history.push({
    skill: skillName,
    outcome,
    timestamp: now,
    feature: metadata?.feature || null,
    phase: metadata?.phase || null,
  });
  if (stats.history.length > MAX_HISTORY_ENTRIES) {
    stats.history = stats.history.slice(-MAX_HISTORY_ENTRIES);
  }

  writeStats(stats, projectDir);
}

/**
 * Link a /btw suggestion to a skill.
 * @param {string} skillName
 * @param {string} btwId
 * @param {string} [projectDir]
 */
function linkBtwFeedback(skillName, btwId, projectDir) {
  const stats = readStats(projectDir);
  if (!stats.skills[skillName]) return;
  if (!stats.skills[skillName].btwFeedbackIds.includes(btwId)) {
    stats.skills[skillName].btwFeedbackIds.push(btwId);
  }
  writeStats(stats, projectDir);
}

// ─── Trend Analysis ─────────────────────────────────────

/**
 * Analyze trends for a specific skill or all skills.
 * @param {string} [skillName] - If null, analyze all
 * @param {number} [days=7]
 * @param {string} [projectDir]
 * @returns {object}
 */
function analyzeTrends(skillName, days, projectDir) {
  days = days || TREND_WINDOW_DAYS;
  const stats = readStats(projectDir);
  const cutoff = new Date(Date.now() - days * 86400000).toISOString();

  const recentHistory = stats.history.filter(h => h.timestamp >= cutoff);
  const filtered = skillName
    ? recentHistory.filter(h => h.skill === skillName)
    : recentHistory;

  // Daily aggregation
  const dailyMap = {};
  for (const entry of filtered) {
    const day = entry.timestamp.slice(0, 10);
    if (!dailyMap[day]) dailyMap[day] = { total: 0, success: 0, failure: 0, partial: 0 };
    dailyMap[day].total++;
    dailyMap[day][entry.outcome]++;
  }

  const days_data = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      ...data,
      successRate: data.total > 0 ? ((data.success / data.total) * 100).toFixed(1) : '0.0',
    }));

  // Trend direction
  let trend = 'stable';
  if (days_data.length >= 2) {
    const first = parseFloat(days_data[0].successRate);
    const last = parseFloat(days_data[days_data.length - 1].successRate);
    if (last - first > 5) trend = 'improving';
    else if (first - last > 5) trend = 'declining';
  }

  // Top failure categories
  const failureCats = {};
  for (const entry of filtered.filter(h => h.outcome === 'failure')) {
    const skill = stats.skills[entry.skill];
    if (skill?.failureCategories) {
      for (const [cat, count] of Object.entries(skill.failureCategories)) {
        failureCats[cat] = (failureCats[cat] || 0) + count;
      }
    }
  }

  return {
    period: `${days} days`,
    totalInvocations: filtered.length,
    successRate: filtered.length > 0
      ? ((filtered.filter(h => h.outcome === 'success').length / filtered.length) * 100).toFixed(1)
      : '0.0',
    trend,
    daily: days_data,
    topFailureCategories: Object.entries(failureCats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, count]) => ({ category: cat, count })),
  };
}

// ─── A/B Comparison ─────────────────────────────────────

/**
 * Compare two skills' performance metrics.
 * @param {string} skillA
 * @param {string} skillB
 * @param {string} [projectDir]
 * @returns {object}
 */
function compareSkills(skillA, skillB, projectDir) {
  const stats = readStats(projectDir);
  const a = stats.skills[skillA] || { invocations: 0, success: 0, failure: 0, partial: 0 };
  const b = stats.skills[skillB] || { invocations: 0, success: 0, failure: 0, partial: 0 };

  const rateA = a.invocations > 0 ? (a.success / a.invocations * 100) : 0;
  const rateB = b.invocations > 0 ? (b.success / b.invocations * 100) : 0;

  return {
    skillA: { name: skillA, invocations: a.invocations, successRate: rateA.toFixed(1), avgDuration: a.avgDuration || 0 },
    skillB: { name: skillB, invocations: b.invocations, successRate: rateB.toFixed(1), avgDuration: b.avgDuration || 0 },
    winner: rateA > rateB ? skillA : rateB > rateA ? skillB : 'tie',
    delta: Math.abs(rateA - rateB).toFixed(1),
  };
}

// ─── Reporting ──────────────────────────────────────────

/**
 * Generate a quality report for all tracked skills.
 * @param {string} [projectDir]
 * @returns {object} report
 */
function generateReport(projectDir) {
  const stats = readStats(projectDir);
  const btw = readBtwSuggestions(projectDir);

  const skillReports = [];

  for (const [name, data] of Object.entries(stats.skills)) {
    const successRate = data.invocations > 0
      ? ((data.success / data.invocations) * 100).toFixed(1)
      : '0.0';

    const feedbackCount = data.btwFeedbackIds.length;
    const btwDetails = data.btwFeedbackIds
      .map(id => btw.suggestions.find(s => s.id === id))
      .filter(Boolean);

    let healthScore = 'healthy';
    if (parseFloat(successRate) < 50) healthScore = 'critical';
    else if (parseFloat(successRate) < 80) healthScore = 'needs-attention';
    else if (feedbackCount > 3) healthScore = 'needs-attention';

    skillReports.push({
      name,
      invocations: data.invocations,
      successRate: parseFloat(successRate),
      failureCount: data.failure,
      partialCount: data.partial || 0,
      feedbackCount,
      healthScore,
      lastUsed: data.lastUsed,
      firstUsed: data.firstUsed,
      avgDuration: data.avgDuration || 0,
      failureCategories: data.failureCategories || {},
      sessionCount: (data.sessions || []).length,
      improvementSuggestions: btwDetails
        .filter(b => b.status === 'pending')
        .map(b => b.suggestion),
    });
  }

  // Sort by health (critical first, then invocation count)
  const healthOrder = { critical: 0, 'needs-attention': 1, healthy: 2 };
  skillReports.sort((a, b) => {
    const hDiff = (healthOrder[a.healthScore] || 2) - (healthOrder[b.healthScore] || 2);
    if (hDiff !== 0) return hDiff;
    return b.invocations - a.invocations;
  });

  const totalInvocations = skillReports.reduce((s, r) => s + r.invocations, 0);
  const trends = analyzeTrends(null, TREND_WINDOW_DAYS, projectDir);

  const report = {
    generatedAt: new Date().toISOString(),
    totalSkillsTracked: Object.keys(stats.skills).length,
    totalInvocations,
    overallSuccessRate: calculateOverallRate(stats),
    criticalSkills: skillReports.filter(r => r.healthScore === 'critical').length,
    trend: trends.trend,
    skills: skillReports,
    trendSummary: {
      period: trends.period,
      recentInvocations: trends.totalInvocations,
      recentSuccessRate: trends.successRate,
      direction: trends.trend,
      topFailures: trends.topFailureCategories,
    },
  };

  stats.lastReportGenerated = report.generatedAt;
  writeStats(stats, projectDir);

  return report;
}

/**
 * Format quality report.
 * @param {object} report - Output from generateReport()
 * @param {'text'|'json'|'markdown'} [format='text']
 * @returns {string}
 */
function formatReport(report, format) {
  format = format || 'text';

  if (format === 'json') return JSON.stringify(report, null, 2);
  if (format === 'markdown') return formatReportMarkdown(report);
  return formatReportText(report);
}

function formatReportText(report) {
  const lines = [];
  lines.push('Skill Quality Report');
  lines.push('=====================');
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push(`Skills tracked: ${report.totalSkillsTracked}`);
  lines.push(`Total invocations: ${report.totalInvocations}`);
  lines.push(`Overall success rate: ${report.overallSuccessRate}%`);
  lines.push(`Trend (${report.trendSummary.period}): ${report.trendSummary.direction} (${report.trendSummary.recentSuccessRate}%)`);
  if (report.criticalSkills > 0) {
    lines.push(`[!] Critical skills: ${report.criticalSkills}`);
  }
  lines.push('');

  for (const skill of report.skills) {
    const badge = skill.healthScore === 'critical' ? '[!!]'
      : skill.healthScore === 'needs-attention' ? '[!]' : '[OK]';
    lines.push(`${badge} ${skill.name}`);
    lines.push(`    Invocations: ${skill.invocations} | Success: ${skill.successRate}% | Failures: ${skill.failureCount} | Feedback: ${skill.feedbackCount}`);
    if (skill.avgDuration > 0) {
      lines.push(`    Avg Duration: ${skill.avgDuration.toFixed(0)}ms | Sessions: ${skill.sessionCount}`);
    }
    if (Object.keys(skill.failureCategories).length > 0) {
      const cats = Object.entries(skill.failureCategories)
        .sort(([, a], [, b]) => b - a)
        .map(([c, n]) => `${c}(${n})`)
        .join(', ');
      lines.push(`    Failure Categories: ${cats}`);
    }
    if (skill.improvementSuggestions.length > 0) {
      lines.push(`    Pending improvements:`);
      for (const s of skill.improvementSuggestions.slice(0, 3)) {
        lines.push(`      - ${s.slice(0, 80)}`);
      }
    }
  }

  return lines.join('\n');
}

function formatReportMarkdown(report) {
  const lines = [];
  lines.push('# Skill Quality Report\n');
  lines.push(`> Generated: ${report.generatedAt}\n`);

  lines.push('## Overview\n');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Skills Tracked | ${report.totalSkillsTracked} |`);
  lines.push(`| Total Invocations | ${report.totalInvocations} |`);
  lines.push(`| Success Rate | ${report.overallSuccessRate}% |`);
  lines.push(`| Trend | ${report.trendSummary.direction} |`);
  lines.push(`| Critical Skills | ${report.criticalSkills} |`);
  lines.push('');

  if (report.trendSummary.topFailures.length > 0) {
    lines.push('## Top Failure Categories\n');
    lines.push('| Category | Count |');
    lines.push('|----------|-------|');
    for (const f of report.trendSummary.topFailures) {
      lines.push(`| ${f.category} | ${f.count} |`);
    }
    lines.push('');
  }

  lines.push('## Skills Detail\n');
  lines.push('| Status | Name | Invocations | Success Rate | Failures | Feedback |');
  lines.push('|--------|------|-------------|-------------|----------|----------|');
  for (const skill of report.skills) {
    const badge = skill.healthScore === 'critical' ? '🔴'
      : skill.healthScore === 'needs-attention' ? '🟡' : '🟢';
    lines.push(`| ${badge} | ${skill.name} | ${skill.invocations} | ${skill.successRate}% | ${skill.failureCount} | ${skill.feedbackCount} |`);
  }

  return lines.join('\n');
}

// ─── Helpers ────────────────────────────────────────────

function readBtwSuggestions(projectDir) {
  projectDir = projectDir || process.cwd();
  const btwPath = path.join(projectDir, BTW_FILE);
  if (!fs.existsSync(btwPath)) return { suggestions: [] };
  try {
    return JSON.parse(fs.readFileSync(btwPath, 'utf-8'));
  } catch {
    return { suggestions: [] };
  }
}

function calculateOverallRate(stats) {
  let totalInv = 0, totalSuc = 0;
  for (const data of Object.values(stats.skills)) {
    totalInv += data.invocations;
    totalSuc += data.success;
  }
  return totalInv > 0 ? ((totalSuc / totalInv) * 100).toFixed(1) : '0.0';
}

// ─── Exports ───────────────────────────────────────────

module.exports = {
  // Core (v1.0)
  readStats,
  writeStats,
  recordInvocation,
  linkBtwFeedback,
  generateReport,
  formatReport,
  STATS_FILE,
  // Enhanced (v2.0)
  analyzeTrends,
  compareSkills,
  MAX_HISTORY_ENTRIES,
  TREND_WINDOW_DAYS,
};
