/**
 * generate-report.usecase.js — Sprint report-phase aggregator + renderer.
 *
 * Pure aggregation: walks the sprint state (phaseHistory + iterateHistory +
 * featureMap + qualityGates + kpi) to produce a markdown report + KPI snapshot
 * + carry-items list. File write is delegated to deps.fileWriter when present.
 *
 * v2.1.13 baseline.
 * v2.1.19 S3 evolution (closes #105):
 *   - F3-3: `## Quality Gates` section (KPI Snapshot 직후)
 *   - F3-3: qualityGates > featureMap > kpi SoT precedence via kpi-resolver
 *   - F3-3: divergence warning when kpi vs qualityGates inconsistent
 *   - F3-5: carry items rich rationale (featureMap.scope + details aggregated)
 *   - F3-6: lessons learned multi-aspect aggregation
 *
 * Design Ref: docs/02-design/features/v2113-sprint-2-application.design.md §8
 *             docs/02-design/features/s3-polish.design.md ADRs S3-004~S3-006
 *
 * @module lib/application/sprint-lifecycle/generate-report.usecase
 */

const path = require('path');
const { sprintPhaseDocPath } = require('../../domain/sprint');
const { resolveKpi, detectDivergences } = require('./kpi-resolver');

/**
 * Default KPI calculator — delegates to kpi-resolver (qualityGates>featureMap>kpi SoT).
 * Preserves legacy fields (sprintCycleHours, featureCompletionRate) for backward compat.
 */
function defaultKpiCalculator(sprint) {
  const resolved = resolveKpi(sprint) || {};
  const prevKpi = (sprint && sprint.kpi) || {};

  // Backward compat: keep sprintCycleHours + featureCompletionRate
  const featureCompletionRate = resolved.featuresTotal > 0
    ? (resolved.featuresCompleted / resolved.featuresTotal) * 100
    : 0;

  // qaPassRate not in resolveKpi (no qualityGates field for it yet) — preserve from prevKpi
  return {
    matchRate: resolved.matchRate,
    criticalIssues: resolved.criticalIssues,
    qaPassRate: typeof prevKpi.qaPassRate === 'number' ? prevKpi.qaPassRate : null,
    dataFlowIntegrity: resolved.dataFlowIntegrity,
    featuresTotal: resolved.featuresTotal,
    featuresCompleted: resolved.featuresCompleted,
    featureCompletionRate,
    cumulativeTokens: resolved.cumulativeTokens,
    cumulativeIterations: resolved.cumulativeIterations,
    sprintCycleHours: typeof prevKpi.sprintCycleHours === 'number' ? prevKpi.sprintCycleHours : null,
  };
}

/**
 * F3-5: Carry items rich rationale. Combines:
 *   - matchRate/s1Score thresholds (existing logic)
 *   - featureMap.<feature>.scope (P0/P1/etc.)
 *   - featureMap.<feature>.details (free-form notes)
 * into multi-line rationale instead of "s1Score <N>".
 */
function identifyCarryItems(sprint) {
  const featureMap = (sprint && sprint.featureMap) || {};
  const carry = [];
  for (const [featureName, f] of Object.entries(featureMap)) {
    if (!f) continue;
    const matchIncomplete = typeof f.matchRate === 'number' && f.matchRate < 100;
    const s1Incomplete = typeof f.s1Score === 'number' && f.s1Score < 100;
    if (!matchIncomplete && !s1Incomplete) continue;

    // Build rich rationale (F3-5 evolution)
    const rationaleParts = [];
    if (matchIncomplete) rationaleParts.push(`matchRate ${f.matchRate}`);
    if (s1Incomplete) rationaleParts.push(`s1Score ${f.s1Score}`);
    if (f.scope) rationaleParts.push(`scope: ${f.scope}`);
    if (f.details) {
      const detailsStr = typeof f.details === 'string' ? f.details : JSON.stringify(f.details);
      // Trim long details to keep markdown table cell readable
      const trimmed = detailsStr.length > 120 ? detailsStr.slice(0, 117) + '...' : detailsStr;
      rationaleParts.push(`details: ${trimmed}`);
    }
    carry.push({
      featureName,
      reason: rationaleParts.join('; '),
      currentPhase: f.pdcaPhase || 'unknown',
    });
  }
  return carry;
}

/**
 * F3-6: Lessons learned multi-aspect aggregation. Returns array of objects:
 *   [{ aspect: string, insight: string }, ...]
 * Aspects: iteration, gate_measurement, phase_duration, gate_failure_resolution, autoPause.
 * Backward compat: legacy string format also accepted (caller renders via toString).
 */
function extractLessons(sprint) {
  const lessons = [];

  // Aspect 1: iteration patterns
  const iterations = (sprint && sprint.iterateHistory) || [];
  if (iterations.length > 0) {
    const failed = iterations.filter((i) => typeof i.matchRate === 'number' && i.matchRate < 90);
    if (failed.length > 0) {
      lessons.push({
        aspect: 'iteration',
        insight: `${failed.length} iteration cycle(s) below 90% — review gap-detector accuracy`,
      });
    }
    const finalIter = iterations[iterations.length - 1];
    if (finalIter && typeof finalIter.matchRate === 'number' && finalIter.matchRate >= 100) {
      lessons.push({
        aspect: 'iteration',
        insight: `Final iteration #${finalIter.iteration} reached ${finalIter.matchRate}% — clean exit`,
      });
    }
  }

  // Aspect 2: autoPause history
  const pauseHistory = (sprint && sprint.autoPause && sprint.autoPause.pauseHistory) || [];
  if (pauseHistory.length > 0) {
    const triggers = pauseHistory.map((p) => p && p.trigger).filter(Boolean);
    lessons.push({
      aspect: 'autoPause',
      insight: `Paused ${triggers.length} time(s): ${triggers.join(', ')}`,
    });
  }

  // Aspect 3: phase duration (4h+ phases)
  const phaseHistory = (sprint && sprint.phaseHistory) || [];
  const slowPhases = phaseHistory.filter((h) => {
    return typeof h.durationMs === 'number' && h.durationMs > 4 * 3600 * 1000;
  });
  if (slowPhases.length > 0) {
    const slowNames = slowPhases.map(h => h.phase).join(', ');
    lessons.push({
      aspect: 'phase_duration',
      insight: `${slowPhases.length} phase(s) exceeded 4h: ${slowNames} — review phaseTimeoutHours`,
    });
  }

  // Aspect 4: gate measurement source distribution (which agents most active)
  const qg = (sprint && sprint.qualityGates) || {};
  const sourceCounts = {};
  for (const gate of Object.values(qg)) {
    if (gate && gate.source) {
      const src = typeof gate.source === 'string' ? gate.source.split(' ')[0] : 'unknown';
      sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    }
  }
  const sources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]);
  if (sources.length > 1) {
    const top = sources.slice(0, 3).map(([s, c]) => `${s}=${c}`).join(', ');
    lessons.push({
      aspect: 'gate_measurement',
      insight: `Gate measurement source distribution: ${top}`,
    });
  }

  // Aspect 5: gate failure resolution
  const lgf = sprint && sprint.lastGateFailure;
  if (lgf && lgf.resolvedAt && lgf.resolutionReason) {
    lessons.push({
      aspect: 'gate_failure_resolution',
      insight: `Gate failure (${lgf.phase} → ${lgf.toPhase || '?'}) resolved at ${lgf.resolvedAt}: ${lgf.resolutionReason}`,
    });
  }

  return lessons;
}

/**
 * F3-3: Render Quality Gates section. Lists 11 gates (or whatever was measured)
 * as a markdown table per master plan §7.2 expected output.
 *
 * Includes only gates with non-null current value (gates may be n/a for
 * architectural noop sprints).
 */
function renderQualityGatesSection(sprint) {
  const qg = (sprint && sprint.qualityGates) || {};
  const rows = [];
  let passedCount = 0;
  for (const [key, gate] of Object.entries(qg)) {
    if (!gate || gate.current === null || gate.current === undefined) continue;
    const gateName = key.split('_')[0];
    const passed = gate.passed ? '✓' : '✗';
    if (gate.passed) passedCount++;
    const lastMeasured = gate.lastMeasuredAt || '—';
    const source = gate.source || gate.measuredBy || '—';
    rows.push(`| ${gateName} | ${gate.current} | ${gate.threshold} | ${passed} | ${lastMeasured} | ${source} |`);
  }
  if (rows.length === 0) return null; // skip section entirely if no measured gates
  return [
    `## Quality Gates (${rows.length} gates, ${passedCount} passed)`,
    '',
    '| Gate | current | threshold | passed | lastMeasuredAt | source |',
    '|------|---------|-----------|--------|----------------|--------|',
    ...rows,
    '',
  ];
}

function renderReport(sprint, kpi, carryItems, lessons, generatedAt) {
  const lines = [];
  lines.push(`# Sprint Report — ${sprint.name || sprint.id}`);
  lines.push('');
  lines.push(`> Sprint ID: \`${sprint.id}\``);
  lines.push(`> Generated at: ${generatedAt}`);
  lines.push(`> Final phase: \`${sprint.phase}\``);
  lines.push(`> Status: \`${sprint.status}\``);
  lines.push('');

  lines.push('## 1. Context');
  const ctx = (sprint && sprint.context) || {};
  lines.push(`- **WHY**: ${ctx.WHY || '(not set)'}`);
  lines.push(`- **WHO**: ${ctx.WHO || '(not set)'}`);
  lines.push(`- **RISK**: ${ctx.RISK || '(not set)'}`);
  lines.push(`- **SUCCESS**: ${ctx.SUCCESS || '(not set)'}`);
  lines.push(`- **SCOPE**: ${ctx.SCOPE || '(not set)'}`);
  lines.push('');

  lines.push('## 2. KPI Snapshot');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| matchRate | ${kpi.matchRate === null ? '--' : `${kpi.matchRate}%`} |`);
  lines.push(`| criticalIssues | ${kpi.criticalIssues} |`);
  lines.push(`| dataFlowIntegrity (S1) | ${kpi.dataFlowIntegrity === null ? '--' : `${typeof kpi.dataFlowIntegrity === 'number' ? kpi.dataFlowIntegrity.toFixed(2) : kpi.dataFlowIntegrity}%`} |`);
  lines.push(`| features (completed/total) | ${kpi.featuresCompleted}/${kpi.featuresTotal} (${kpi.featureCompletionRate.toFixed(1)}%) |`);
  lines.push(`| cumulativeTokens | ${kpi.cumulativeTokens} |`);
  lines.push(`| cumulativeIterations | ${kpi.cumulativeIterations} |`);
  lines.push('');

  // F3-3: Quality Gates section (KPI 직후)
  const qgSection = renderQualityGatesSection(sprint);
  if (qgSection) {
    for (const line of qgSection) lines.push(line);
  }

  lines.push('## 3. Phase History');
  const phaseHistory = (sprint && sprint.phaseHistory) || [];
  if (phaseHistory.length === 0) {
    lines.push('_No phase history recorded._');
  } else {
    lines.push('| Phase | Entered | Exited | Duration (ms) |');
    lines.push('|-------|---------|--------|---------------|');
    for (const h of phaseHistory) {
      lines.push(`| ${h.phase} | ${h.enteredAt || '--'} | ${h.exitedAt || '--'} | ${h.durationMs === null || typeof h.durationMs === 'undefined' ? '--' : h.durationMs} |`);
    }
  }
  lines.push('');

  lines.push('## 4. Iteration History');
  const iterations = (sprint && sprint.iterateHistory) || [];
  if (iterations.length === 0) {
    lines.push('_No iterations executed._');
  } else {
    lines.push('| # | matchRate | fixedTaskIds | durationMs |');
    lines.push('|---|-----------|--------------|-----------|');
    for (const it of iterations) {
      const ids = Array.isArray(it.fixedTaskIds) ? it.fixedTaskIds.join(',') : '';
      lines.push(`| ${it.iteration} | ${it.matchRate === null ? '--' : `${it.matchRate}%`} | ${ids} | ${it.durationMs === null ? '--' : it.durationMs} |`);
    }
  }
  lines.push('');

  lines.push('## 5. Carry Items (next sprint candidates)');
  if (carryItems.length === 0) {
    lines.push('_No carry items — all features completed._');
  } else {
    lines.push('| Feature | Reason | Current Phase |');
    lines.push('|---------|--------|---------------|');
    for (const c of carryItems) {
      lines.push(`| ${c.featureName} | ${c.reason} | ${c.currentPhase} |`);
    }
  }
  lines.push('');

  // F3-6: Lessons learned multi-aspect (backward compat: also accepts legacy string array)
  lines.push('## 6. Lessons Learned');
  if (!lessons || lessons.length === 0) {
    lines.push('_No notable lessons recorded._');
  } else {
    for (const l of lessons) {
      if (typeof l === 'string') lines.push(`- ${l}`);
      else if (l && l.aspect && l.insight) lines.push(`- **[${l.aspect}]** ${l.insight}`);
    }
  }
  lines.push('');

  return lines.join('\n');
}

/**
 * @param {import('../../domain/sprint/entity').Sprint} sprint
 * @param {{ docPathResolver?: function, fileWriter?: function, kpiCalculator?: function, clock?: () => string, divergenceLogger?: function }} [deps]
 * @returns {Promise<{ ok: boolean, reportContent: string, kpiSnapshot: Object, carryItems: Array, reportPath: string|null, divergences: Array }>}
 */
async function generateReport(sprint, deps) {
  const resolvePath = (deps && typeof deps.docPathResolver === 'function')
    ? deps.docPathResolver
    : sprintPhaseDocPath;
  const writer = (deps && typeof deps.fileWriter === 'function') ? deps.fileWriter : null;
  const kpiCalc = (deps && typeof deps.kpiCalculator === 'function') ? deps.kpiCalculator : defaultKpiCalculator;
  const clock = (deps && typeof deps.clock === 'function')
    ? deps.clock
    : () => new Date().toISOString();
  const divergenceLogger = (deps && typeof deps.divergenceLogger === 'function') ? deps.divergenceLogger : null;

  const kpiSnapshot = kpiCalc(sprint);
  const divergences = detectDivergences(sprint);
  if (divergences.length > 0 && divergenceLogger) {
    divergenceLogger({ sprintId: sprint.id, divergences, precedenceApplied: 'qualityGates' });
  }
  const carryItems = identifyCarryItems(sprint);
  const lessons = extractLessons(sprint);
  const generatedAt = clock();
  const reportContent = renderReport(sprint, kpiSnapshot, carryItems, lessons, generatedAt);
  const reportPath = resolvePath(sprint.id, 'report');

  if (writer && reportPath) {
    await writer(reportPath, reportContent);
  }

  return { ok: true, reportContent, kpiSnapshot, carryItems, lessons, divergences, reportPath };
}

module.exports = {
  generateReport,
  // exported for testing + future composition
  defaultKpiCalculator,
  identifyCarryItems,
  extractLessons,
  renderReport,
  renderQualityGatesSection,
};
