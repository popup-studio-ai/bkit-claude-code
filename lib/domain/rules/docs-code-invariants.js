/**
 * Docs=Code Invariants — single source of truth for inventory counts.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §3.1.6
 * Plan SC: ENH-241 cross-check prevents drift across README/MEMORY/plugin.json/audit-logger.
 *
 * When bkit adds/removes a Skill/Agent/Hook/MCP tool, update HERE first
 * and let CI verify that README.md, MEMORY.md, plugin.json, audit-logger.js
 * all reflect the same numbers.
 *
 * Pure domain module — no FS access.
 *
 * @module lib/domain/rules/docs-code-invariants
 *
 * @version 2.1.13
 */

/** @type {Readonly<{skills: number, agents: number, hookEvents: number, hookBlocks: number, mcpServers: number, mcpTools: number}>} */
const EXPECTED_COUNTS = Object.freeze({
  skills: 44,    // v2.1.13: 43 + 1 new (sprint) — Sprint Management major feature
  agents: 34,    // v2.1.13: 30 baseline + 4 new sprint agents (master-planner/orchestrator/qa-flow/report-writer). Prior memory of 36 was a miscount; actual v2.1.12 baseline was 30.
  hookEvents: 21, // unique event names (invariant maintained)
  hookBlocks: 24, // matcher-separated blocks (PreToolUse: 2 + PostToolUse: 3 + rest: 1 each, invariant maintained)
  mcpServers: 2,
  mcpTools: 19, // v2.1.13: 13 (bkit-pdca: 10 + 3 new sprint: bkit_sprint_list/bkit_sprint_status/bkit_master_plan_read) + 6 (bkit-analysis)
});

/**
 * v2.1.17 (CO-3.1): canonical names lists — single source of truth.
 *
 * Previously each *.test.js (e.g., invocation-inventory.test.js) maintained
 * its own hardcoded EXPECTED_AGENTS / EXPECTED_SKILLS / EXPECTED_HOOKS list.
 * When a new agent/skill/hook was added, multiple files needed coordinated
 * updates — a stale-baseline source class observed in v2.1.13~v2.1.16.
 *
 * Now: tests import from this module; updates happen in ONE place.
 *
 * Derivation: extracted from test/contract/baseline/v2.1.16/_MANIFEST.json
 * + per-agent JSONs (deprecatedIn field) on 2026-05-20.
 *
 * Invariants:
 *   - Active + Deprecated agent names count === EXPECTED_COUNTS.agents + 6
 *   - Skill names count === EXPECTED_COUNTS.skills
 *   - Hook event names count === EXPECTED_COUNTS.hookEvents
 *   - PDCA + Analysis MCP tools count === EXPECTED_COUNTS.mcpTools
 */
/** @type {ReadonlyArray<string>} */
const EXPECTED_ACTIVE_AGENT_NAMES = Object.freeze([
  'bkend-expert', 'bkit-impact-analyst', 'cc-version-researcher', 'code-analyzer', 'cto-lead',
  'design-validator', 'enterprise-expert', 'frontend-architect', 'gap-detector',
  'infra-architect', 'pdca-iterator', 'pipeline-guide', 'pm-discovery', 'pm-lead',
  'pm-lead-skill-patch', 'pm-prd', 'pm-research', 'pm-strategy', 'product-manager',
  'qa-debug-analyst', 'qa-lead', 'qa-monitor', 'qa-strategist', 'qa-test-generator',
  'qa-test-planner', 'report-generator', 'security-architect', 'self-healing',
  'skill-needs-extractor', 'sprint-master-planner', 'sprint-orchestrator', 'sprint-qa-flow',
  'sprint-report-writer', 'starter-guide',
]);

/** @type {ReadonlyArray<string>} */
const EXPECTED_DEPRECATED_AGENT_NAMES = Object.freeze([
  'pdca-eval-act', 'pdca-eval-check', 'pdca-eval-design',
  'pdca-eval-do', 'pdca-eval-plan', 'pdca-eval-pm',
]);

/** @type {ReadonlyArray<string>} */
const EXPECTED_SKILL_NAMES = Object.freeze([
  'audit', 'bkend-auth', 'bkend-cookbook', 'bkend-data', 'bkend-quickstart', 'bkend-storage',
  'bkit', 'bkit-evals', 'bkit-explore', 'bkit-rules', 'bkit-templates', 'btw',
  'cc-version-analysis', 'claude-code-learning', 'code-review', 'control', 'deploy',
  'desktop-app', 'development-pipeline', 'dynamic', 'enterprise', 'mobile-app',
  'pdca', 'pdca-batch', 'pdca-fast-track', 'pdca-watch', 'phase-1-schema', 'phase-2-convention',
  'phase-3-mockup', 'phase-4-api', 'phase-5-design-system', 'phase-6-ui-integration',
  'phase-7-seo-security', 'phase-8-review', 'phase-9-deployment', 'plan-plus', 'pm-discovery',
  'qa-phase', 'rollback', 'skill-create', 'skill-status', 'sprint', 'starter', 'zero-script-qa',
]);

/** @type {ReadonlyArray<string>} */
const EXPECTED_HOOK_EVENT_NAMES = Object.freeze([
  'ConfigChange', 'CwdChanged', 'FileChanged', 'InstructionsLoaded', 'Notification',
  'PermissionRequest', 'PostCompact', 'PostToolUse', 'PostToolUseFailure', 'PreCompact',
  'PreToolUse', 'SessionEnd', 'SessionStart', 'Stop', 'StopFailure',
  'SubagentStart', 'SubagentStop', 'TaskCompleted', 'TaskCreated', 'TeammateIdle',
  'UserPromptSubmit',
]);

/** @type {ReadonlyArray<string>} */
const EXPECTED_PDCA_MCP_TOOLS = Object.freeze([
  'bkit_analysis_read', 'bkit_design_read', 'bkit_feature_detail', 'bkit_feature_list',
  'bkit_master_plan_read', 'bkit_metrics_get', 'bkit_metrics_history', 'bkit_pdca_history',
  'bkit_pdca_status', 'bkit_plan_read', 'bkit_report_read', 'bkit_sprint_list',
  'bkit_sprint_status',
]);

/** @type {ReadonlyArray<string>} */
const EXPECTED_ANALYSIS_MCP_TOOLS = Object.freeze([
  'bkit_audit_search', 'bkit_checkpoint_detail', 'bkit_checkpoint_list',
  'bkit_code_quality', 'bkit_gap_analysis', 'bkit_regression_rules',
]);

/**
 * Compare a measured inventory against EXPECTED_COUNTS.
 *
 * @param {Object} measured
 * @returns {Array<{ field: string, expected: number, actual: number }>}
 */
function diffCounts(measured) {
  if (!measured || typeof measured !== 'object') return Object.keys(EXPECTED_COUNTS).map((field) => ({
    field,
    expected: EXPECTED_COUNTS[field],
    actual: 0,
  }));
  const diffs = [];
  for (const field of Object.keys(EXPECTED_COUNTS)) {
    const actual = measured[field];
    if (actual !== EXPECTED_COUNTS[field]) {
      diffs.push({ field, expected: EXPECTED_COUNTS[field], actual: actual || 0 });
    }
  }
  return diffs;
}

module.exports = {
  EXPECTED_COUNTS,
  diffCounts,
  // v2.1.17 (CO-3.1): canonical names lists for downstream tests.
  EXPECTED_ACTIVE_AGENT_NAMES,
  EXPECTED_DEPRECATED_AGENT_NAMES,
  EXPECTED_SKILL_NAMES,
  EXPECTED_HOOK_EVENT_NAMES,
  EXPECTED_PDCA_MCP_TOOLS,
  EXPECTED_ANALYSIS_MCP_TOOLS,
};
