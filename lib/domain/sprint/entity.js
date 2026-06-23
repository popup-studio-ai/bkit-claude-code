/**
 * Sprint Entity — Pure domain object factory + immutable update helpers.
 *
 * Defines the Sprint JSDoc type (state schema v1.1) and provides
 * factory functions for construction and cloning. No I/O, no external
 * dependencies — pure domain module.
 *
 * Design Ref: docs/02-design/features/v2113-sprint-1-domain.design.md §4.4
 * ADR Ref: 0007 (Sprint as Meta Container), 0009 (Auto-Run + Auto-Pause schema)
 *
 * Pure domain module — no FS access.
 *
 * @module lib/domain/sprint/entity
 * @version 2.1.13
 * @since 2.1.13
 */

/**
 * @typedef {Object} SprintContext
 * @property {string} WHY     - Motivation / problem statement
 * @property {string} WHO     - Target users / stakeholders
 * @property {string} RISK    - Failure impact + mitigation
 * @property {string} SUCCESS - Success criteria (5W1H)
 * @property {string} SCOPE   - Quantitative scope (features, LOC, duration)
 */

/**
 * @typedef {Object} SprintConfig
 * @property {number} budget                  - Token budget (default 1_000_000)
 * @property {number} phaseTimeoutHours       - Phase auto-pause timeout (default 4)
 * @property {number} maxIterations           - Max iterate cycles (default 5)
 * @property {number} matchRateTarget         - Target matchRate (default 100)
 * @property {number} matchRateMinAcceptable  - Min acceptable after max iter (default 90)
 * @property {string} dashboardMode           - 'session-start' | 'watch' | 'both'
 * @property {boolean} manual                 - true = each phase user-approved
 */

/**
 * @typedef {Object} SprintAutoRun
 * @property {boolean} enabled                - Auto-run mode on?
 * @property {string|null} scope              - Target phase (last auto-advanced)
 * @property {string} trustLevelAtStart       - L0~L4 at sprint start
 * @property {string|null} startedAt          - ISO 8601
 * @property {string|null} lastAutoAdvanceAt  - ISO 8601
 */

/**
 * @typedef {Object} SprintAutoPause
 * @property {string[]} armed                 - Active trigger names
 * @property {string|null} lastTrigger        - Most recent trigger
 * @property {Array<Object>} pauseHistory     - Pause event audit trail
 */

/**
 * @typedef {Object} SprintPhaseHistory
 * @property {string} phase
 * @property {string} enteredAt               - ISO 8601
 * @property {string|null} exitedAt           - ISO 8601 or null if active
 * @property {number|null} durationMs         - Computed on exit
 */

/**
 * @typedef {Object} SprintIterationHistory
 * @property {number} iteration               - 1-indexed
 * @property {number|null} matchRate          - 0-100
 * @property {string[]} fixedTaskIds          - Task IDs touched
 * @property {number|null} durationMs
 */

/**
 * @typedef {Object} SprintDocs
 * @property {string|null} masterPlan
 * @property {string|null} prd
 * @property {string|null} plan
 * @property {string|null} design
 * @property {string|null} iterate
 * @property {string|null} qa
 * @property {string|null} report
 */

/**
 * @typedef {Object} SprintFeatureMapEntry
 * @property {string} pdcaPhase               - Feature's current PDCA phase
 * @property {number|null} matchRate          - 0-100
 * @property {string} qa                      - 'pending' | 'in_progress' | 'pass' | 'fail'
 * @property {number} completion              - 0-100 completion percentage
 */

/**
 * @typedef {Object<string, SprintFeatureMapEntry>} SprintFeatureMap
 */

/**
 * @typedef {Object} SprintQualityGateValue
 * @property {number|boolean|null} current
 * @property {number|boolean} threshold
 * @property {boolean|null} passed
 */

/**
 * @typedef {Object} SprintQualityGates
 * @property {SprintQualityGateValue} M1_matchRate
 * @property {SprintQualityGateValue} M2_codeQualityScore
 * @property {SprintQualityGateValue} M3_criticalIssueCount
 * @property {SprintQualityGateValue} M4_apiComplianceRate
 * @property {SprintQualityGateValue} M5_runtimeErrorRate
 * @property {SprintQualityGateValue} M7_conventionCompliance
 * @property {SprintQualityGateValue} M8_designCompleteness
 * @property {SprintQualityGateValue} M10_pdcaCycleTimeHours
 * @property {SprintQualityGateValue} S1_dataFlowIntegrity
 * @property {SprintQualityGateValue} S2_featureCompletion
 * @property {SprintQualityGateValue} S3_velocity
 * @property {SprintQualityGateValue} S4_archiveReadiness
 */

/**
 * @typedef {Object} SprintKPI
 * @property {number|null} matchRate
 * @property {number} criticalIssues
 * @property {number|null} qaPassRate
 * @property {number|null} dataFlowIntegrity
 * @property {number} featuresTotal
 * @property {number} featuresCompleted
 * @property {number} featureCompletionRate
 * @property {number} cumulativeTokens
 * @property {number} cumulativeIterations
 * @property {number|null} sprintCycleHours
 */

/**
 * @typedef {Object} Sprint
 * @property {string} id                            - kebab-case unique
 * @property {string} name                          - Human-readable
 * @property {string} version                       - schema version (e.g., "1.1")
 * @property {string} phase                         - SPRINT_PHASES value
 * @property {string} status                        - 'active'|'paused'|'completed'|'archived'
 * @property {SprintContext} context
 * @property {string[]} features
 * @property {SprintConfig} config
 * @property {SprintAutoRun} autoRun
 * @property {SprintAutoPause} autoPause
 * @property {SprintPhaseHistory[]} phaseHistory
 * @property {SprintIterationHistory[]} iterateHistory
 * @property {SprintDocs} docs
 * @property {SprintFeatureMap} featureMap
 * @property {Object<string, Object>} dataFlow   - Per-feature data-flow hop results (populated by handleQA)
 * @property {SprintQualityGates} qualityGates
 * @property {SprintKPI} kpi
 * @property {Array<Object>} annotations          - Post-hoc annotations (append-only, F1-5)
 * @property {string} createdAt                     - ISO 8601
 * @property {string|null} startedAt
 * @property {string|null} archivedAt
 */

/**
 * @typedef {Object} SprintInput
 * @property {string} id                            - required (kebab-case)
 * @property {string} name                          - required
 * @property {string} [phase]                       - default 'prd'
 * @property {SprintContext} [context]              - default empty
 * @property {string[]} [features]                  - default []
 * @property {Partial<SprintConfig>} [config]       - merged with defaults
 * @property {string} [trustLevelAtStart]           - default 'L2'
 */

const DEFAULT_CONFIG = Object.freeze({
  budget: 1_000_000,
  phaseTimeoutHours: 4,
  maxIterations: 5,
  matchRateTarget: 100,
  matchRateMinAcceptable: 90,
  dashboardMode: 'session-start',
  manual: false,
});

const DEFAULT_QUALITY_GATES = Object.freeze({
  M1_matchRate:           Object.freeze({ current: null, threshold: 90,  passed: null }),
  M2_codeQualityScore:    Object.freeze({ current: null, threshold: 80,  passed: null }),
  M3_criticalIssueCount:  Object.freeze({ current: 0,    threshold: 0,   passed: true }),
  M4_apiComplianceRate:   Object.freeze({ current: null, threshold: 95,  passed: null }),
  M5_runtimeErrorRate:    Object.freeze({ current: null, threshold: 1,   passed: null }),
  M7_conventionCompliance:Object.freeze({ current: null, threshold: 90,  passed: null }),
  M8_designCompleteness:  Object.freeze({ current: null, threshold: 85,  passed: null }),
  M10_pdcaCycleTimeHours: Object.freeze({ current: null, threshold: 40,  passed: null }),
  S1_dataFlowIntegrity:   Object.freeze({ current: null, threshold: 100, passed: null }),
  S2_featureCompletion:   Object.freeze({ current: 0,    threshold: 100, passed: false }),
  S3_velocity:            Object.freeze({ current: null, threshold: null, passed: null }),
  S4_archiveReadiness:    Object.freeze({ current: false, threshold: true, passed: false }),
});

const DEFAULT_AUTO_PAUSE_ARMED = Object.freeze([
  'QUALITY_GATE_FAIL',
  'ITERATION_EXHAUSTED',
  'BUDGET_EXCEEDED',
  'PHASE_TIMEOUT',
]);

/**
 * Factory for a new Sprint entity with defaults applied.
 *
 * @param {SprintInput} input
 * @returns {Sprint}
 * @throws {TypeError} when input or required fields are invalid
 */
function createSprint(input) {
  if (!input || typeof input !== 'object') {
    throw new TypeError('createSprint: input must be an object');
  }
  if (typeof input.id !== 'string' || input.id.length === 0) {
    throw new TypeError('createSprint: input.id must be non-empty string');
  }
  if (typeof input.name !== 'string' || input.name.length === 0) {
    throw new TypeError('createSprint: input.name must be non-empty string');
  }
  const now = new Date().toISOString();
  return {
    id: input.id,
    name: input.name,
    version: '1.1',
    phase: input.phase || 'prd',
    status: 'active',
    context: input.context || { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' },
    features: Array.isArray(input.features) ? [...input.features] : [],
    config: { ...DEFAULT_CONFIG, ...(input.config || {}) },
    autoRun: {
      enabled: true,
      scope: null,
      trustLevelAtStart: input.trustLevelAtStart || 'L2',
      startedAt: null,
      lastAutoAdvanceAt: null,
    },
    autoPause: {
      armed: [...DEFAULT_AUTO_PAUSE_ARMED],
      lastTrigger: null,
      pauseHistory: [],
    },
    phaseHistory: [],
    iterateHistory: [],
    docs: {
      masterPlan: null,
      prd: null,
      plan: null,
      design: null,
      iterate: null,
      qa: null,
      report: null,
    },
    featureMap: Array.isArray(input.features)
      ? Object.fromEntries(input.features.map((f) => [
          f,
          { pdcaPhase: 'pm', matchRate: null, qa: 'pending', completion: 0 },
        ]))
      : {},
    // v2.1.19 s1-foundation FR-5 / v2113-Sprint-5 SC-01: per-feature data-flow
    // hop results. Populated by handleQA during the QA phase (Slice 4 task 4.2).
    // Keyed by feature name; shape documented in design ref §4.4.
    dataFlow: {},
    qualityGates: JSON.parse(JSON.stringify(DEFAULT_QUALITY_GATES)),
    // v2.1.19 S1 F1-5: post-hoc annotations on any sprint (incl. archived).
    // Append-only array (no edit/delete). Forward-only invariant: appending
    // does NOT mutate sprint.phase. See sprint-handler.handleAnnotate.
    annotations: [],
    kpi: {
      matchRate: null,
      criticalIssues: 0,
      qaPassRate: null,
      dataFlowIntegrity: null,
      featuresTotal: Array.isArray(input.features) ? input.features.length : 0,
      featuresCompleted: 0,
      featureCompletionRate: 0,
      cumulativeTokens: 0,
      cumulativeIterations: 0,
      sprintCycleHours: null,
    },
    createdAt: now,
    startedAt: null,
    archivedAt: null,
  };
}

/**
 * Immutable update helper: returns a new Sprint with updates applied.
 * Shallow merge — for nested updates, caller should spread inner objects.
 *
 * @param {Sprint} sprint
 * @param {Partial<Sprint>} updates
 * @returns {Sprint}
 * @throws {TypeError} when sprint is not an object
 */
function cloneSprint(sprint, updates) {
  if (!sprint || typeof sprint !== 'object') {
    throw new TypeError('cloneSprint: sprint must be an object');
  }
  return { ...sprint, ...(updates || {}) };
}

module.exports = {
  createSprint,
  cloneSprint,
  DEFAULT_CONFIG,
  DEFAULT_QUALITY_GATES,
  DEFAULT_AUTO_PAUSE_ARMED,
};
