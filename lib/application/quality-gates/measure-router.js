'use strict';

// Slice 2 Task 2.6: eager import of the S4 readiness helper. quality-gates.js
// is a leaf module (no requires of its own), so there is no circular import;
// the eager form is preferred over a lazy in-compute require().
const { computeArchiveReadiness } = require('../sprint-lifecycle/quality-gates');

/**
 * measure-router.js — gateKey → measurement agent dispatch (v2.1.16, Issue #94 F3).
 *
 * Single source of truth for measurement routing across:
 *   - /sprint phase auto-advance (sprint-orchestrator self-assessment)
 *   - /sprint measure manual invocation (handleMeasure)
 *
 * Pure module — no I/O, no FS. Caller injects `deps.agentTaskRunner` for
 * agent invocation (matches lib/infra/sprint/gap-detector.adapter pattern).
 *
 * Architecture:
 *   - GATE_MEASUREMENT_ROUTES: frozen mapping per Master Plan §11.3 AC4
 *     (M1/M3 → gap-detector, M2/M7 → code-analyzer, M4 → gap-detector vs §9,
 *      M8 → sprint-orchestrator, S1 → sprint-qa-flow)
 *   - measureGate(): dispatches one gate → returns raw measurement result.
 *     Caller (measure-gate.usecase) is responsible for persisting to
 *     sprint.qualityGates and emitting audit.
 *   - parseAgentOutput(): balanced-brace JSON extraction, mirrors
 *     lib/infra/sprint/gap-detector.adapter parseGapDetectorOutput.
 *
 * Gates outside the 10 explicitly routed (S2 only as of Slice 2 Task 2.6)
 * return `{ ok: false, reason: 'unsupported_gate' }` — S2 carried to Slice 3.
 *
 * Design Ref: docs/01-plan/features/v2116-issue-fixes.master-plan.md §11.3 AC4
 * Related Adapter: lib/infra/sprint/gap-detector.adapter.js (same 3-tier pattern)
 *
 * @module lib/application/quality-gates/measure-router
 * @version 2.1.16
 * @since 2.1.16
 */

/**
 * @typedef {Object} GateRoute
 * @property {('gap-detector'|'code-analyzer'|'sprint-orchestrator'|'sprint-qa-flow')} agent
 * @property {string} field          - Sprint entity field name (e.g. 'M4_apiComplianceRate')
 * @property {('percent'|'count'|'boolean')} valueShape
 * @property {string} sourceArtifact - Human-readable description of input artifact
 * @property {string} [sourceArtifactPlanPhase] - Override artifact cited when
 *           the measured sprint is still at the plan phase (M8 only — the
 *           design doc does not exist at plan-exit, so M8 cites the plan
 *           doc's design section instead).
 * @property {boolean} [exemptible] - When true, the gate may be exempted if its
 *           source is unavailable (M5 only — runtime logs may not exist for
 *           libraries/static sites). Caller signals absence via
 *           deps.logSourceAvailable=false; the router then returns
 *           not_applicable (counted as passed) without dispatching an agent.
 * @property {'computed'} [gateType] - When 'computed', the gate derives its
 *           value from sprint state via route.compute(sprint); no sub-agent
 *           is dispatched and no agentTaskRunner is required (M10 only).
 * @property {(sprint: object) => number|boolean} [compute] - For gateType='computed'
 *           gates: pure function deriving the value from sprint state. Numeric
 *           for M10 (cycle-time hours); boolean for S4 (archiveReadiness, op '===').
 */

/**
 * Master Plan §11.3 AC4 routing table — 7 gates × 4 agents.
 * Single SoT for both /sprint phase orchestrator self-assessment and
 * /sprint measure manual invocation (Master Plan AC7 code-sharing).
 *
 * @type {Readonly<Object<string, GateRoute>>}
 */
const GATE_MEASUREMENT_ROUTES = Object.freeze({
  M1: Object.freeze({
    agent: 'gap-detector',
    field: 'M1_matchRate',
    valueShape: 'percent',
    sourceArtifact: 'Design §9 API Contract ↔ shipped implementation cross-reference',
  }),
  M2: Object.freeze({
    agent: 'code-analyzer',
    field: 'M2_codeQualityScore',
    valueShape: 'percent',
    sourceArtifact: 'lib/ + tests/ code quality scan (lint + complexity + duplication)',
  }),
  M3: Object.freeze({
    agent: 'gap-detector',
    field: 'M3_criticalIssueCount',
    valueShape: 'count',
    sourceArtifact: 'critical severity issue scan vs design',
  }),
  M4: Object.freeze({
    agent: 'gap-detector',
    field: 'M4_apiComplianceRate',
    valueShape: 'percent',
    sourceArtifact: 'Design §9 API Contract ↔ committed module boundaries (Issue #92)',
  }),
  M7: Object.freeze({
    agent: 'code-analyzer',
    field: 'M7_conventionCompliance',
    valueShape: 'percent',
    sourceArtifact: 'lib/ + tests/ style + naming convention scan',
  }),
  M8: Object.freeze({
    agent: 'sprint-orchestrator',
    field: 'M8_designCompleteness',
    valueShape: 'percent',
    // Slice 2 (Cluster B, Issue #5 — M8 chicken-and-egg): at plan-exit the
    // design doc does not yet exist, so M8 measures the PLAN doc's design
    // section (the design completeness produced during planning). At design
    // phase and later, the design doc exists and M8 measures its §14
    // self-assessment checklist. buildPrompt() resolves which artifact to
    // cite based on sprint.phase.
    sourceArtifact: 'Design doc §14 self-assessment checklist',
    sourceArtifactPlanPhase: 'Plan doc design section (design completeness produced during the plan phase; the dedicated design doc does not yet exist at plan-exit)',
  }),
  S1: Object.freeze({
    agent: 'sprint-qa-flow',
    field: 'S1_dataFlowIntegrity',
    valueShape: 'percent',
    sourceArtifact: '7-Layer hop traversal (UI → Client → API → Validation → DB → Response → Client → UI)',
  }),
  // Slice 2 (Cluster F-gates): M5 runtime error rate via qa-monitor live-log
  // probe. Exemptible: when the project has no running service (libraries,
  // static sites — no logs), the caller passes deps.logSourceAvailable=false
  // and the router returns not_applicable (counted as passed) instead of
  // failing the gate.
  M5: Object.freeze({
    agent: 'qa-monitor',
    field: 'M5_runtimeErrorRate',
    valueShape: 'percent',
    sourceArtifact: 'Runtime error rate from qa-monitor live log probe (docker/service logs)',
    exemptible: true,
  }),
  // Slice 2 (Cluster F-gates): M10 PDCA cycle time — computed gate, no agent.
  // Sum of phaseHistory durations (hours). Lower is better (count shape).
  M10: Object.freeze({
    agent: null,
    field: 'M10_pdcaCycleTimeHours',
    valueShape: 'count',
    sourceArtifact: 'Sum of sprint.phaseHistory durations (hours)',
    gateType: 'computed',
    compute: (sprint) => {
      const history = (sprint && Array.isArray(sprint.phaseHistory)) ? sprint.phaseHistory : [];
      let sum = 0;
      for (const entry of history) {
        if (entry && typeof entry.durationHours === 'number' && Number.isFinite(entry.durationHours)) {
          sum += entry.durationHours;
        }
      }
      return sum;
    },
  }),
  // Slice 2 (Task 2.6 — no gate in limbo): S4 archiveReadiness — computed gate.
  // Boolean: ready iff every measurable report-phase gate has passed AND a
  // report doc exists. Shares computeArchiveReadiness with archiveSprint (the
  // archive path populates the S4 slot from the same helper before its gate
  // check, because evaluateGate reads slot values, not compute fns). No agent.
  // NOTE: unlike M10 (numeric), S4's compute returns a boolean to match its
  // GATE_DEFINITION op '===' with threshold `true`. The router passes the
  // computed value through unchanged; callers persisting to the slot should
  // store { current: <boolean>, threshold: true, passed: <same boolean> }.
  S4: Object.freeze({
    agent: null,
    field: 'S4_archiveReadiness',
    valueShape: 'boolean',
    sourceArtifact: 'Computed: all measurable report-phase gates passed AND sprint.docs.report present',
    gateType: 'computed',
    // Eager top-level import (quality-gates.js is a leaf module with no requires,
    // so there is no circular dependency). Kept inline as a closure so the route
    // object stays self-describing; the helper is the single source of truth
    // shared with archiveSprint.
    compute: (sprint) => computeArchiveReadiness(sprint),
  }),
});

/** Gates the router does NOT yet support — carried to v2.1.17 / Slice 3. */
const UNSUPPORTED_GATES = Object.freeze([
  // M5 promoted to GATE_MEASUREMENT_ROUTES in Slice 2 (qa-monitor probe,
  // exemptible via deps.logSourceAvailable=false).
  // M10 promoted to GATE_MEASUREMENT_ROUTES in Slice 2 (computed: phaseHistory sum).
  // S4 promoted to GATE_MEASUREMENT_ROUTES in Slice 2 Task 2.6 (computed:
  // all measurable report-phase gates passed AND report exists).
  'S2',  // featureCompletion — computed (featureMap completion) (Slice 3)
]);

const SUPPORTED_GATES = Object.freeze(Object.keys(GATE_MEASUREMENT_ROUTES));

/**
 * @param {string} gateKey
 * @returns {boolean}
 */
function isSupportedGate(gateKey) {
  return SUPPORTED_GATES.includes(gateKey);
}

/**
 * Build the agent prompt for measuring a single gate. Output is a literal
 * string the caller passes to agentTaskRunner. Includes the JSON schema the
 * agent is required to return so the parser can extract a numeric value.
 *
 * @param {string} gateKey
 * @param {{ id?: string, phase?: string }} sprint
 * @returns {string}
 */
function buildPrompt(gateKey, sprint) {
  const route = GATE_MEASUREMENT_ROUTES[gateKey];
  const sprintId = (sprint && sprint.id) || 'unknown';
  const phase = (sprint && sprint.phase) || 'unknown';
  // Slice 2 (Cluster B, Issue #5): resolve a phase-specific source artifact
  // when the route declares one (M8 at plan-exit cites the plan doc's design
  // section because the dedicated design doc does not yet exist).
  const sourceArtifact = (phase === 'plan' && route.sourceArtifactPlanPhase)
    ? route.sourceArtifactPlanPhase
    : route.sourceArtifact;
  const valueDescription = route.valueShape === 'percent'
    ? '<number 0-100 representing percentage>'
    : '<integer count, lower is typically better>';
  return [
    'Measure bkit Sprint quality gate ' + gateKey + ' (' + route.field + ')',
    'for sprint "' + sprintId + '" at phase "' + phase + '".',
    '',
    'Source artifact: ' + sourceArtifact,
    '',
    'Return ONLY a single JSON object with this shape:',
    '  {',
    '    "value": ' + valueDescription + ',',
    '    "details": "<short text rationale, 1-2 sentences>"',
    '  }',
    '',
    'Do not include any other prose, markdown headers, or code fences.',
  ].join('\n');
}

/**
 * Extract the first balanced JSON object from a string (string-aware).
 * Mirror of lib/infra/sprint/gap-detector.adapter.extractBalancedJson — kept
 * inline so this module has zero cross-layer imports (Application layer stays
 * pure relative to Infra).
 *
 * @param {string} text
 * @returns {string|null}
 */
function extractBalancedJson(text) {
  if (typeof text !== 'string') return null;
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (escape) { escape = false; continue; }
    if (c === '\\' && inString) { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Parse agent output into a measurement result. Returns `{ ok, value, details }`
 * or `{ ok: false, reason, error? }`.
 *
 * @param {{ output?: string }} agentResult
 * @returns {{ ok: boolean, value?: number, details?: string, reason?: string, error?: string }}
 */
function parseAgentOutput(agentResult) {
  if (!agentResult || typeof agentResult.output !== 'string') {
    return { ok: false, reason: 'no_output' };
  }
  const block = extractBalancedJson(agentResult.output);
  if (!block) {
    return { ok: false, reason: 'no_json', error: 'no balanced JSON object found in agent output' };
  }
  let parsed;
  try { parsed = JSON.parse(block); } catch (e) {
    return { ok: false, reason: 'json_invalid', error: 'JSON parse fail: ' + e.message };
  }
  if (typeof parsed.value !== 'number' || !Number.isFinite(parsed.value)) {
    return { ok: false, reason: 'invalid_value', error: 'agent did not return a finite numeric value' };
  }
  return {
    ok: true,
    value: parsed.value,
    details: typeof parsed.details === 'string' ? parsed.details : null,
  };
}

/**
 * @typedef {Object} MeasureGateDeps
 * @property {(req:{subagent_type:string, prompt:string}) => Promise<{output:string}>} agentTaskRunner
 *           - Required. Same shape as lib/infra/sprint/gap-detector.adapter.
 * @property {(prompt:string, route:GateRoute) => Promise<{output:string}>} [agentTaskRunnerOverride]
 *           - Optional test override (used by SC-13 to inject fake agent).
 * @property {boolean} [logSourceAvailable] - For exemptible gates (M5): when
 *           false, the project has no runtime logs (library/static site) and
 *           the router returns not_applicable instead of dispatching a probe.
 */

/**
 * @typedef {Object} MeasureGateResult
 * @property {boolean} ok
 * @property {string} gateKey
 * @property {string} [field]
 * @property {string} [agent]
 * @property {number} [value]
 * @property {string|null} [details]
 * @property {string} [reason]      - When ok=false: 'unsupported_gate', 'no_agent_runner', 'no_output', 'no_json', 'json_invalid', 'invalid_value', 'agent_error'. When ok=true & exempted: 'not_applicable'.
 * @property {string} [error]
 * @property {string[]} [supportedGates]
 */

/**
 * Measure a single gate by dispatching to the routed agent.
 *
 * @param {string} gateKey
 * @param {{ id?: string, phase?: string }} sprint
 * @param {MeasureGateDeps} deps
 * @returns {Promise<MeasureGateResult>}
 */
async function measureGate(gateKey, sprint, deps) {
  const route = GATE_MEASUREMENT_ROUTES[gateKey];
  if (!route) {
    return {
      ok: false,
      gateKey,
      reason: 'unsupported_gate',
      supportedGates: SUPPORTED_GATES.slice(),
    };
  }
  // Slice 2 (Cluster F-gates): exemptible gates (M5) short-circuit when the
  // caller signals their source is unavailable (no runtime logs). The gate is
  // counted as passed — exempted, not failed — so a library/static-site sprint
  // can advance without a live service.
  if (route.exemptible && deps && deps.logSourceAvailable === false) {
    return {
      ok: true,
      gateKey,
      field: route.field,
      agent: route.agent,
      value: null,
      reason: 'not_applicable',
      details: 'source unavailable for this project type (no runtime logs)',
      passed: true,
    };
  }
  // Slice 2 (Cluster F-gates): computed gates (M10) derive their value from
  // sprint state — no sub-agent dispatch, no agentTaskRunner required.
  if (route.gateType === 'computed' && typeof route.compute === 'function') {
    const value = route.compute(sprint);
    return {
      ok: true,
      gateKey,
      field: route.field,
      agent: null,
      value,
      details: 'computed from ' + route.sourceArtifact,
    };
  }
  const runner = (deps && typeof deps.agentTaskRunner === 'function') ? deps.agentTaskRunner : null;
  if (!runner) {
    return {
      ok: false,
      gateKey,
      field: route.field,
      agent: route.agent,
      reason: 'no_agent_runner',
      error: 'deps.agentTaskRunner is required (function injecting Claude Code Task tool)',
    };
  }
  const prompt = buildPrompt(gateKey, sprint);
  let agentResult;
  try {
    agentResult = await runner({ subagent_type: route.agent, prompt: prompt });
  } catch (e) {
    return {
      ok: false,
      gateKey,
      field: route.field,
      agent: route.agent,
      reason: 'agent_error',
      error: String(e && e.message ? e.message : e),
    };
  }
  const parsed = parseAgentOutput(agentResult);
  if (!parsed.ok) {
    return {
      ok: false,
      gateKey,
      field: route.field,
      agent: route.agent,
      reason: parsed.reason,
      error: parsed.error,
    };
  }
  return {
    ok: true,
    gateKey,
    field: route.field,
    agent: route.agent,
    value: parsed.value,
    details: parsed.details,
  };
}

module.exports = {
  GATE_MEASUREMENT_ROUTES,
  SUPPORTED_GATES,
  UNSUPPORTED_GATES,
  isSupportedGate,
  buildPrompt,
  parseAgentOutput,
  extractBalancedJson,
  measureGate,
};
