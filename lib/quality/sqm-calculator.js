'use strict';

/**
 * lib/quality/sqm-calculator.js — Sprint Quality Maturity Index calculator
 *
 * v2.1.19 S0 simple version (CTO M-3 baseline measurement, master plan §23 step 0).
 *
 * Clean Architecture: Domain rules layer (pure compute, no I/O). All 6 component
 * measurement functions are pure (input rawData → output { value, raw }). Raw data
 * collection lives in scripts/_v2119-s0-measure.js (Infrastructure adapter).
 *
 * S5 Measurement F5-1 will evolve this with:
 *   - Full ports/adapters split (lib/infra/sqm/* adapters)
 *   - SessionStart dashboard panel (lib/ui/sqm-panel.js)
 *   - Per-release history append (.bkit/state/sqm-history.jsonl)
 *
 * Master plan ref: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §7.2
 * Design ref: docs/02-design/features/s0-sqm-baseline.design.md §2
 */

/**
 * Weighted contribution of each component to the final SQM score.
 * Sum MUST equal 1.0 (asserted at module load).
 */
const SQM_WEIGHTS = Object.freeze({
  docsCodeSyncRate: 0.30,
  sprintSelfDogfoodRunRate: 0.20,
  externalDogfooderFeedbackResponseRate: 0.20,
  sprintReportKpiConsistency: 0.15,
  subAgentDispatchSuccessRate: 0.10,
  conventionContractTestPassRate: 0.05,
});

// Invariant assertion (fail-fast at module load if weights diverge)
(function assertWeightsSumToOne() {
  const sum = Object.values(SQM_WEIGHTS).reduce((a, b) => a + b, 0);
  if (Math.abs(sum - 1.0) > 1e-9) {
    throw new Error(`SQM_WEIGHTS sum ${sum} != 1.0 — module misconfigured`);
  }
})();

/**
 * Default external dogfooder identifiers. Currently N=1 (pruge).
 * ADR S0-002 — config-driven for multi-dogfooder readiness (master plan §15.4 DA-4).
 */
const DEFAULT_DOGFOODERS = Object.freeze(['pruge']);

/** Output schema version (for future compatibility checks in S5 history append) */
const SCHEMA_VERSION = '1.0';

// ============================================================
// Helpers
// ============================================================

function round(n, decimals = 2) {
  if (typeof n !== 'number' || !isFinite(n)) return n;
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

// ============================================================
// Pure component measurement functions
// ============================================================

/**
 * M-A: Docs=Code Sync Rate (weight 0.30)
 *
 * Measures whether SKILL.md declared paths/handlers/frontmatter match actual files.
 * Score = (passed / total) × 100, normalized 0-100.
 *
 * @param {{ skills: Array<{ name: string, skillMdPath: string, invariantPass: boolean, failures: string[] }> }} rawData
 * @returns {{ value: number|null, raw: object }}
 */
function measureDocsCodeSyncRate(rawData) {
  const skills = rawData && rawData.skills;
  if (!Array.isArray(skills)) {
    return { value: null, raw: { error: 'no skills array', received: typeof rawData } };
  }
  if (skills.length === 0) {
    return { value: null, raw: { error: 'empty skills array' } };
  }
  const total = skills.length;
  const passed = skills.filter(s => s && s.invariantPass === true).length;
  const failures = skills
    .filter(s => s && s.invariantPass !== true)
    .map(s => ({ name: s.name, failures: s.failures || [] }));
  return {
    value: Math.round((passed / total) * 100),
    raw: { passed, total, failures },
  };
}

/**
 * M-B: Sprint Self-Dogfood Run Rate (weight 0.20)
 *
 * Measures fraction of recent N releases that ran as a sprint container
 * (master-plan exists + sprint state archived). Partial runs count 0.5.
 *
 * @param {{ releases: Array<{ version: string, runAsSprint: boolean|'partial', ... }> }} rawData
 * @returns {{ value: number|null, raw: object }}
 */
function measureSprintSelfDogfoodRunRate(rawData) {
  const releases = rawData && rawData.releases;
  if (!Array.isArray(releases)) {
    return { value: null, raw: { error: 'no releases array' } };
  }
  if (releases.length === 0) {
    return { value: null, raw: { error: 'empty releases array' } };
  }
  const total = releases.length;
  const sprintRuns = releases.filter(r => r && r.runAsSprint === true).length;
  const partial = releases.filter(r => r && r.runAsSprint === 'partial').length;
  const score = (sprintRuns + partial * 0.5) / total;
  return {
    value: Math.round(score * 100),
    raw: {
      sprintRuns,
      partial,
      total,
      releases: releases.map(r => ({
        version: r.version,
        runAsSprint: r.runAsSprint,
        masterPlanExists: r.masterPlanExists,
        sprintStateArchived: r.sprintStateArchived,
      })),
    },
  };
}

/**
 * M-C: External Dogfooder Feedback Response Rate (weight 0.20)
 *
 * Measures fraction of external dogfooder issues closed within 24h.
 * Window-based (default trailing 30d, ADR S0-003).
 * When no issues in window → value=null (NFR-4 partial failure pattern).
 *
 * @param {{ issues: Array<{ number, createdAt, closedAt, hoursToClose, within24h }>, dogfooders, windowStart, windowEnd }} rawData
 * @returns {{ value: number|null, raw: object }}
 */
function measureExternalDogfooderFeedbackResponseRate(rawData) {
  if (!rawData) {
    return { value: null, raw: { error: 'no rawData' } };
  }
  const { issues, dogfooders, windowStart, windowEnd } = rawData;
  if (!Array.isArray(issues)) {
    return { value: null, raw: { error: 'no issues array', dogfooders, windowStart, windowEnd } };
  }
  if (issues.length === 0) {
    return {
      value: null,
      raw: { error: 'no dogfooder issues in window', dogfooders, windowStart, windowEnd, total: 0 },
    };
  }
  // Only count issues that are CLOSED (closedAt !== null). Open issues don't count
  // for response rate — they belong to "still pending" bucket.
  const closed = issues.filter(i => i && i.closedAt);
  if (closed.length === 0) {
    return {
      value: null,
      raw: { error: 'no closed issues in window', dogfooders, windowStart, windowEnd, openCount: issues.length },
    };
  }
  const within24h = closed.filter(i => i.within24h === true).length;
  return {
    value: Math.round((within24h / closed.length) * 100),
    raw: { within24h, closed: closed.length, openInWindow: issues.length - closed.length, dogfooders, windowStart, windowEnd, issues },
  };
}

/**
 * M-D: Sprint Report KPI Consistency (weight 0.15)
 *
 * Measures whether sprint report KPI snapshot matches the underlying qualityGates.
 * Divergence count per report — lower is better. consistencyRate = 1 - (divergences / checks).
 *
 * @param {{ reports: Array<{ feature, divergenceCount, ... }> }} rawData
 * @returns {{ value: number|null, raw: object }}
 */
function measureSprintReportKpiConsistency(rawData) {
  const reports = rawData && rawData.reports;
  if (!Array.isArray(reports)) {
    return { value: null, raw: { error: 'no reports array' } };
  }
  if (reports.length === 0) {
    return { value: null, raw: { error: 'no sprint reports available' } };
  }
  const KPI_CHECKS_PER_REPORT = 4; // matchRate, criticalIssues, dataFlowIntegrity, featuresCompleted
  const totalDivergences = reports.reduce((sum, r) => sum + (r && typeof r.divergenceCount === 'number' ? r.divergenceCount : 0), 0);
  const totalChecks = reports.length * KPI_CHECKS_PER_REPORT;
  if (totalChecks === 0) {
    return { value: null, raw: { error: 'no KPI checks' } };
  }
  const consistencyRate = 1 - (totalDivergences / totalChecks);
  return {
    value: Math.max(0, Math.min(100, Math.round(consistencyRate * 100))),
    raw: { totalDivergences, totalChecks, reports },
  };
}

/**
 * M-E: Sub-Agent Dispatch Success Rate (weight 0.10)
 *
 * Measures fraction of sprint-orchestrator (or sub-agent) Task dispatches that
 * succeeded. window-based. Zero dispatches in window → value=null
 * (sprint-orchestrator never activated → cannot judge maturity).
 *
 * @param {{ dispatches: Array<{ actorId, timestamp, success }>, windowStart, windowEnd }} rawData
 * @returns {{ value: number|null, raw: object }}
 */
function measureSubAgentDispatchSuccessRate(rawData) {
  if (!rawData) {
    return { value: null, raw: { error: 'no rawData' } };
  }
  const { dispatches, windowStart, windowEnd } = rawData;
  if (!Array.isArray(dispatches)) {
    return { value: null, raw: { error: 'no dispatches array', windowStart, windowEnd } };
  }
  if (dispatches.length === 0) {
    return {
      value: null,
      raw: { error: 'no dispatches in window', windowStart, windowEnd, windowEmpty: true },
    };
  }
  const success = dispatches.filter(d => d && d.success === true).length;
  return {
    value: Math.round((success / dispatches.length) * 100),
    raw: { success, total: dispatches.length, windowStart, windowEnd },
  };
}

/**
 * M-F: Convention Contract Test Pass Rate (weight 0.05)
 *
 * Measures fraction of convention contract tests passing. When the contract
 * baseline file does NOT exist (testsExist=false), value=0 (deliberate — coverage
 * starts at 0 until S2 F2-4 creates the baseline).
 *
 * @param {{ testsExist: boolean, passed: number, total: number }} rawData
 * @returns {{ value: number, raw: object }}
 */
function measureConventionContractTestPassRate(rawData) {
  if (!rawData) {
    return { value: 0, raw: { exists: false, passed: 0, total: 0, error: 'no rawData' } };
  }
  const { testsExist, passed = 0, total = 0 } = rawData;
  if (!testsExist) {
    return { value: 0, raw: { exists: false, passed: 0, total: 0 } };
  }
  if (typeof total !== 'number' || total === 0) {
    return { value: 0, raw: { exists: true, passed, total: 0 } };
  }
  return {
    value: Math.round((passed / total) * 100),
    raw: { exists: true, passed, total },
  };
}

// ============================================================
// Aggregator (pure)
// ============================================================

/**
 * Aggregate 6 component results into a single SQM total (0-100).
 *
 * Components with value=null contribute 0 to the total (conservative — unmeasurable
 * components depress the score). Warnings are emitted for each null component.
 *
 * @param {object} params
 * @param {object} params.rawData - 6 keys: docsCode, sprintRuns, dogfooderIssues, sprintReports, dispatchAudit, conventionTests
 * @param {string} [params.asOf] - As-of timestamp (ISO)
 * @param {string} [params.gitCommit] - HEAD commit at measurement time
 * @param {string} [params.bkitVersion] - bkit version at measurement time
 * @returns {object} SqmResult
 */
function computeSqm({ rawData = {}, asOf = null, gitCommit = null, bkitVersion = null } = {}) {
  const components = {
    docsCodeSyncRate: measureDocsCodeSyncRate(rawData.docsCode),
    sprintSelfDogfoodRunRate: measureSprintSelfDogfoodRunRate(rawData.sprintRuns),
    externalDogfooderFeedbackResponseRate: measureExternalDogfooderFeedbackResponseRate(rawData.dogfooderIssues),
    sprintReportKpiConsistency: measureSprintReportKpiConsistency(rawData.sprintReports),
    subAgentDispatchSuccessRate: measureSubAgentDispatchSuccessRate(rawData.dispatchAudit),
    conventionContractTestPassRate: measureConventionContractTestPassRate(rawData.conventionTests),
  };

  let total = 0;
  const warnings = [];
  for (const [key, weight] of Object.entries(SQM_WEIGHTS)) {
    const c = components[key];
    c.weight = weight;
    if (c.value === null) {
      c.weighted = 0;
      warnings.push(`${key}: unmeasurable (${(c.raw && c.raw.error) || 'unknown reason'})`);
    } else {
      c.weighted = round(c.value * weight, 4);
      total += c.weighted;
    }
  }

  return {
    total: round(total, 2),
    components,
    measuredAt: new Date().toISOString(),
    asOf,
    gitCommit,
    bkitVersion,
    warnings,
    schemaVersion: SCHEMA_VERSION,
  };
}

module.exports = {
  SQM_WEIGHTS,
  DEFAULT_DOGFOODERS,
  SCHEMA_VERSION,
  computeSqm,
  measureDocsCodeSyncRate,
  measureSprintSelfDogfoodRunRate,
  measureExternalDogfooderFeedbackResponseRate,
  measureSprintReportKpiConsistency,
  measureSubAgentDispatchSuccessRate,
  measureConventionContractTestPassRate,
  // Internal helper exported for test introspection
  _round: round,
};
