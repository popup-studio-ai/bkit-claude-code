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
 * @version 2.1.20
 */

/** @type {Readonly<{skills: number, agents: number, hookEvents: number, hookBlocks: number, mcpServers: number, mcpTools: number}>} */
const EXPECTED_COUNTS = Object.freeze({
  skills: 44,    // v2.1.13: 43 + 1 new (sprint) — Sprint Management major feature
  agents: 34,    // v2.1.13: 30 baseline + 4 new sprint agents (master-planner/orchestrator/qa-flow/report-writer). Prior memory of 36 was a miscount; actual v2.1.12 baseline was 30.
  hookEvents: 22, // v2.1.27 (#132): 21 + 1 (UserPromptExpansion — native slash-command side-effect wiring)
  hookBlocks: 25, // v2.1.27 (#132): 24 + 1 (PreToolUse: 2 + PostToolUse: 3 + rest: 1 each × 20 events = 25)
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

/**
 * GOVERNANCE LOCK (v2.1.25 #128, ADR 0014 — stub files REMOVED, registry rules).
 *
 * These 6 `pdca-eval-*` agents are DEPRECATED (v2.1.13). Their live stub .md
 * tombstones were deleted in v2.1.25 (issue #128, ADR 0014 "Deprecation
 * Registry — tombstones off the prompt surface"):
 *   1. Deprecation governance now lives in the machine-readable registry at
 *      test/contract/deprecation-registry.json (agents/skills/mcpTools maps).
 *   2. contract-test-run.js runL4Deprecation() accepts a registry tombstone
 *      carrying `deprecatedIn` as equivalent to a live stub, so L4 stays green
 *      against both immutable baselines (v2.1.9 LTS AND v2.1.16 Latest) with
 *      the stub files gone. Baseline JSONs remain untouched.
 *   3. This list is the SoT mirror of the registry's agent keys —
 *      invocation-inventory.test.js deep-equals registry ⇔ this list.
 * ADR 0014 supersedes the ENH-336 (v2.1.22 S4) permanent-retention decision:
 * both of its premises (L4 requires a live stub file; baselines would need
 * mutation) were dissolved by the registry path. EXPECTED_COUNTS.agents stays
 * 34 (active only). See docs/adr/0014-deprecation-registry.en.md and
 * docs/06-guide/contract-baseline-rollforward.guide.md §5.6.
 */
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
  'UserPromptExpansion', 'UserPromptSubmit',
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
 * v2.1.20 (F9 + ENH-322): Plugin manifest 21-key whitelist SoT.
 *
 * Derivation: Anthropic official plugin manifest schema (docs.claude.com).
 * Source: cc-version-researcher 88% confidence conclusion
 * (docs/03-analysis/cc-v2146-v2150-strict-manifest-validation.analysis.md).
 *
 * Trigger: 외부 dogfooder 정병진 (@bj) 2026-05-26 install 실패
 * (`Validation errors: : Unrecognized key: "displayName"` — CC ≤ v2.1.142
 * strict reject of the v2.1.143+ official displayName key).
 *
 * Invariants:
 *   - EXPECTED_PLUGIN_JSON_KEYS.length === 21
 *   - bkit's .claude-plugin/plugin.json keys ⊂ EXPECTED_PLUGIN_JSON_KEYS
 *     (current bkit uses 9 keys; remaining 12 are optional but accepted)
 *   - Object.freeze applied (immutability invariant — pure domain)
 */
/** @type {ReadonlyArray<string>} */
const EXPECTED_PLUGIN_JSON_KEYS = Object.freeze([
  '$schema',         // JSON schema reference
  'name',            // Required (existing validate-plugin.js check)
  'displayName',     // v2.1.143+ — UI picker label (Anti-Mission: never remove)
  'version',         // Required (existing validate-plugin.js check)
  'description',     // Standard
  'author',          // Standard
  'homepage',        // Optional
  'repository',      // Standard
  'license',         // Standard (SPDX)
  'keywords',        // Standard
  'skills',          // Plugin component
  'commands',        // Plugin component
  'agents',          // Plugin component
  'hooks',           // Plugin component
  'mcpServers',      // Plugin component
  'outputStyles',    // Plugin component (bkit uses string path)
  'lspServers',      // Plugin component
  'experimental',    // Anthropic experimental flags
  'dependencies',    // Plugin dependencies
  'userConfig',      // User config schema
  'channels',        // Release channel
]); // 21 keys total

/**
 * Compare plugin.json keys against EXPECTED_PLUGIN_JSON_KEYS whitelist.
 *
 * Note: only "extra" status is returned. "missing" is intentionally
 * informational-only — bkit's plugin.json uses 9 keys (subset of 21),
 * which is valid. The strict CI gate (validate-plugin.js --strict / F5)
 * fails only on "extra" status (key not in the whitelist).
 *
 * @param {Object} actual - parsed plugin.json object (may be null/undefined)
 * @returns {Array<{ key: string, status: "extra" }>}
 *
 * @example
 *   diffPluginJsonKeys({ name: 'bkit', version: '2.1.20' })  // []
 *   diffPluginJsonKeys({ foo: 1, name: 'x' })                // [{key:'foo',status:'extra'}]
 *   diffPluginJsonKeys(null)                                 // [{key:'<invalid>',status:'extra'}]
 */
function diffPluginJsonKeys(actual) {
  if (!actual || typeof actual !== 'object' || Array.isArray(actual)) {
    return [{ key: '<invalid>', status: 'extra' }];
  }
  const result = [];
  const expectedKeys = new Set(EXPECTED_PLUGIN_JSON_KEYS);
  for (const k of Object.keys(actual)) {
    if (!expectedKeys.has(k)) result.push({ key: k, status: 'extra' });
  }
  return result;
}

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
  // v2.1.20 (F9 + ENH-322): plugin manifest 21-key whitelist SoT.
  EXPECTED_PLUGIN_JSON_KEYS,
  diffPluginJsonKeys,
};
