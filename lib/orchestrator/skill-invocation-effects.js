/**
 * Skill Invocation Effects (Issue #132 — v2.1.27)
 *
 * Shared orchestrator side-effect glue for BOTH skill invocation paths:
 *   - MODEL path:  PostToolUse(Skill) → scripts/skill-post.js  (source: 'skill-tool')
 *   - SLASH path:  UserPromptExpansion → scripts/user-prompt-expansion-handler.js
 *                                                              (source: 'slash-command')
 *
 * Before #132 the 4+1 orchestrator side-effects lived inline in skill-post.js
 * (lines 175-230). The native slash-command path silently bypassed all of them,
 * so bkit's advertised audit trail / decision trace / next-skill guidance was
 * empty for real users typing `/bkit:<skill>`. This module lifts that glue
 * VERBATIM (behavior-preserving for the Skill-tool path) and exposes it as a
 * single composition so both hook scripts fire the identical effects.
 *
 * Effects, in order:
 *   1. dedup guard (content-derived key, same-session) — I-10
 *   2. writeActiveSkill({skill})                        — repairs Stop dispatch (free win B, I-9)
 *   3. orchestrateSkillPost → suggestions
 *   4. writeAuditLog (action varies by source: skill_invoked | skill_executed) — I-7
 *   5. if pdca-phase: recordDecision(phase_transition) + updatePdcaStatus
 *
 * Pure composition of existing lib primitives (audit / decision / status /
 * core). Lives in lib/orchestrator (same tier as intent-router), not lib/domain,
 * so it may use fs directly — check-domain-purity only scans lib/domain/**.
 *
 * @module lib/orchestrator/skill-invocation-effects
 * @version 2.1.27
 * @since 2.1.27
 */

'use strict';

const fs = require('fs');
const path = require('path');

const orch = require('../skill-orchestrator');
const { writeActiveSkill } = require('../core/active-skill-marker');
const { getPdcaStatusFull, updatePdcaStatus } = require('../pdca/status');

/**
 * Resolve the `.bkit/runtime/last-invocation-key` marker path.
 * Mirrors the reachability-ping / active-skill-marker root resolution.
 * @param {string} [projectRoot]
 * @returns {string}
 */
function lastInvocationKeyPath(projectRoot) {
  const root = (typeof projectRoot === 'string' && projectRoot.length > 0)
    ? projectRoot
    : (process.env.CLAUDE_PROJECT_DIR || process.cwd());
  return path.join(root, '.bkit', 'runtime', 'last-invocation-key');
}

/**
 * Dedup guard (I-10). Content-derived key (session_id:skill:action:feature) is
 * comparable across BOTH payloads. Returns true when the key is identical to
 * the last processed key within the same session (→ caller should skip). When
 * the key is new (or dedup disabled), records it and returns false.
 *
 * Best-effort: any FS error falls through to "not a duplicate" so a marker
 * failure never suppresses the real effects.
 *
 * @param {string} dedupeKey
 * @param {string} [projectRoot]
 * @returns {boolean} true if this key was already processed (skip)
 */
function isDuplicateInvocation(dedupeKey, projectRoot) {
  if (!dedupeKey) return false;
  try {
    const p = lastInvocationKeyPath(projectRoot);
    let last = null;
    try {
      last = fs.readFileSync(p, 'utf8').trim();
    } catch (_e) { /* no prior marker */ }
    if (last === dedupeKey) return true;
    // Record the new key (atomic write).
    fs.mkdirSync(path.dirname(p), { recursive: true });
    const tmp = `${p}.${process.pid}.${Date.now()}.tmp`;
    fs.writeFileSync(tmp, dedupeKey);
    fs.renameSync(tmp, p);
    return false;
  } catch (_e) {
    // Non-fatal — proceed with effects rather than risk suppressing them.
    return false;
  }
}

/**
 * Run the shared skill-invocation side-effects.
 *
 * @param {string} skillName - Canonical (bare) skill name — callers normalize
 *   the `plugin:skill` form before passing.
 * @param {{action?: string, feature?: string}} args - Parsed invocation args.
 * @param {{source: 'slash-command'|'skill-tool', dedupeKey?: string, projectRoot?: string}} opts
 * @returns {Promise<{suggestions: Object, deduped?: boolean}>}
 */
async function runSkillInvocationEffects(skillName, args, opts) {
  const options = opts || {};
  const source = options.source;
  const invocationArgs = args || {};

  // 1. Dedup guard (I-10). Skip everything if the identical key was already
  //    processed this session (defensive: slash & Skill-tool are normally
  //    mutually exclusive per logical invocation).
  if (isDuplicateInvocation(options.dedupeKey, options.projectRoot)) {
    return { suggestions: {}, deduped: true };
  }

  // 2. Active-skill marker (free win B, I-9): written on BOTH paths → repairs
  //    the Stop SKILL_HANDLERS dispatch for non-sprint slash skills.
  writeActiveSkill({ skill: skillName });

  // 3. Orchestration → next-step suggestions (STATIC frontmatter resolution).
  const result = await orch.orchestrateSkillPost(skillName, {}, { args: invocationArgs });
  let suggestions = (result && result.suggestions) || {};

  // 3b. #135 — runtime-phase-aware guidance for multi-action router skills.
  //     orchestrateSkillPost resolves ONLY the static frontmatter fields
  //     (next-skill/pdca-phase); the flagship routers pdca/sprint declare both
  //     null by design, so `suggestions` is empty here and no guidance ever
  //     reaches the user. Enrich from LIVE PDCA/Sprint state, reusing the same
  //     SSoT the manual /pdca next & /sprint phase paths use (no duplicated
  //     phase table). Guarded: only when frontmatter produced nothing, so
  //     single-purpose skills (deploy/code-review/plan-plus/...) are untouched.
  //     Fail-open: any error leaves `suggestions` as-is.
  if (!suggestions || Object.keys(suggestions).length === 0) {
    try {
      const { resolveRuntimeGuidance } = require('./runtime-guidance');
      const runtime = resolveRuntimeGuidance(skillName, invocationArgs);
      if (runtime && Object.keys(runtime).length > 0) {
        suggestions = runtime;
      }
    } catch (_) { /* fail-open — never block a slash command */ }
  }

  // 4. Audit logging. Action string varies by invocation source (I-7):
  //    slash-command → 'skill_invoked'; skill-tool → 'skill_executed'.
  //    Both flow through the audit-logger pass-through path (neither is in
  //    ACTION_TYPES; category 'skill' normalizes to 'control'). Rest of the
  //    fields match skill-post.js verbatim.
  try {
    const audit = require('../audit/audit-logger');
    audit.writeAuditLog({
      actor: 'system', actorId: 'skill-post',
      action: source === 'slash-command' ? 'skill_invoked' : 'skill_executed',
      category: 'skill',
      target: skillName, targetType: 'skill',
      result: 'success', destructiveOperation: false
    });
  } catch (_) {}

  // 5. PDCA phase effects (gated on the skill declaring a pdca-phase).
  try {
    const skillCfg = orch.getSkillConfig(skillName);
    if (skillCfg && skillCfg['pdca-phase']) {
      const phase = skillCfg['pdca-phase'];

      // 5a. Decision trace — phase transition.
      try {
        const dt = require('../audit/decision-tracer');
        const feature = invocationArgs.feature || getPdcaStatusFull()?.currentFeature || '';
        dt.recordDecision({
          feature,
          phase,
          decisionType: 'phase_transition',
          question: `Skill ${skillName} completed - advance PDCA phase?`,
          chosenOption: `Advance to ${phase}`,
          rationale: `Skill ${skillName} maps to pdca-phase ${phase}`,
          confidence: 0.9,
          impact: 'medium',
          affectedFiles: [],
          reversible: true
        });
      } catch (_) {}

      // 5b. PDCA status update (requireDocs-gated inside updatePdcaStatus).
      const feature = invocationArgs.feature || getPdcaStatusFull()?.currentFeature;
      if (feature) {
        updatePdcaStatus(feature, phase);
      }
    }
  } catch (_) {}

  return { suggestions };
}

module.exports = {
  runSkillInvocationEffects,
  // Exported for tests / white-box inspection.
  lastInvocationKeyPath,
  isDuplicateInvocation,
};
