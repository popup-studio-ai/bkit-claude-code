#!/usr/bin/env node
/**
 * Skill Post-execution Hook (v1.4.4)
 *
 * Called from PostToolUse(Skill) hook.
 * Uses skill-orchestrator to suggest next steps.
 *
 * @version 2.1.10
 * @module scripts/skill-post
 */

const path = require('path');
const { readStdinSync } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
// C2 fix (audit): write the active-skill marker to a file (atomic, TTL-bounded)
// instead of an in-memory var. Each Claude Code hook is a separate node process,
// so the in-memory setActiveSkill never crossed process boundaries — every
// unified-* reader's getActiveSkill() returned null and every per-skill PostToolUse
// branch was dead code. The file marker survives across processes.
const { writeActiveSkill } = require('../lib/core/active-skill-marker');
const { getPdcaStatusFull, updatePdcaStatus } = require('../lib/pdca/status');
// C7/C8 (audit): atomic+locked reachability ping via the shared state-store, and
// a single BKIT_VERSION source so all three reachability writers stamp the same value.
const { lockedUpdate } = require('../lib/core/state-store');
const { BKIT_VERSION } = require('../lib/core/version');
// #125: CC passes the `plugin:skill` form (e.g. `bkit:pdca`) in tool_input.skill.
// Canonicalize once at the hook boundary so every downstream consumer — config
// lookup, the CODE_GENERATION_SKILLS list, the active-skill marker, audit target
// and PDCA status — sees the bare folder name.
const { normalizeSkillName } = require('../lib/core/skill-name');

// Lazy load modules
let orchestrator = null;

function getOrchestrator() {
  if (!orchestrator) {
    orchestrator = require('../lib/skill-orchestrator.js');
  }
  return orchestrator;
}

/**
 * Parse skill invocation from tool input
 * @param {Object} toolInput - Tool input from hook context
 * @returns {{ skillName: string, args: Object }}
 */
function parseSkillInvocation(toolInput) {
  try {
    // #125: strip the `plugin:` namespace so `bkit:pdca` resolves as `pdca`.
    const skillName = normalizeSkillName(toolInput?.skill || '');
    const argsStr = toolInput?.args || '';

    // Parse args string into structured format
    const args = {};
    if (argsStr) {
      const parts = argsStr.split(/\s+/);
      if (parts.length > 0) {
        args.action = parts[0];
      }
      if (parts.length > 1) {
        args.feature = parts.slice(1).join(' ');
      }
    }

    return { skillName, args };
  } catch (e) {
    return { skillName: '', args: {} };
  }
}

// formatNextStepMessage removed: dead function (defined but never called anywhere
// in the repo — verified via repo-wide grep before removal).

/**
 * v1.5.6: Determine if a skill generates code.
 * List of skills eligible for /copy command guidance.
 * @param {string} skillName - Skill name
 * @returns {boolean}
 */
const CODE_GENERATION_SKILLS = [
  'phase-4-api',
  'phase-5-design-system',
  'phase-6-ui-integration',
  'code-review',
  'starter',
  'dynamic',
  'enterprise',
  'mobile-app',
  'desktop-app'
];

function shouldSuggestCopy(skillName) {
  return CODE_GENERATION_SKILLS.includes(skillName);
}

/**
 * Generate JSON output for Claude Code
 * @param {Object} suggestions - Suggestions from orchestrator
 * @param {string} skillName - Current skill name
 * @returns {Object} JSON output
 */
function generateJsonOutput(suggestions, skillName) {
  const output = {
    skillCompleted: skillName,
    timestamp: new Date().toISOString()
  };

  if (suggestions.nextSkill) {
    output.nextSkill = suggestions.nextSkill.name;
    output.nextSkillMessage = suggestions.nextSkill.message;
  }

  if (suggestions.suggestedAgent) {
    output.suggestedAgent = suggestions.suggestedAgent;
    output.suggestedAgentMessage = suggestions.suggestedMessage;
  }

  // v1.5.6: /copy command guidance (on code generation skill completion)
  if (shouldSuggestCopy(skillName)) {
    output.copyHint = 'Use /copy to select and copy code blocks to clipboard';
  }

  return output;
}

/**
 * Main execution
 */
async function main() {
  const orch = getOrchestrator();

  try {
    // Read hook input from stdin via the shared, reliable reader (lib/core/io).
    // Do NOT hand-roll a `process.stdin.isTTY === false` guard: Node sets isTTY
    // to `undefined` (not `false`) for piped stdin, so that guard silently skips
    // the read, leaving hookContext empty and skillName always '' — which made
    // this hook always skip and never run its orchestration/audit logic. This is
    // the same readStdinSync() every sibling hook (unified-*-post/pre) uses.
    const hookContext = readStdinSync();

    // Extract skill info from tool_input
    const toolInput = hookContext.tool_input || {};
    const { skillName, args } = parseSkillInvocation(toolInput);

    // v2.1.14 Sub-Sprint 2: Reachability ping (MON-CC-NEW-PLUGIN-HOOK-DROP)
    // SessionStart compares the ts of each PostToolUse stamp to detect silent
    // CC plugin-hook drops (#57317 5-streak surface).
    // MUST fire on EVERY invocation (before any early return) so the ping proves
    // the hook loader reached us. If this lived below the `!skillName` skip path,
    // a benign skip would record no heartbeat and look identical to a dropped
    // hook — defeating the monitor. skillName is '' on a skip, which lets the
    // monitor distinguish "alive but idle" from "real skill ran".
    try {
      // C7: lockedUpdate serializes concurrent fires so no hook's stamp is lost;
      // C8: BKIT_VERSION replaces the stale hardcoded '2.1.14'.
      const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
      const file = path.join(root, '.bkit', 'runtime', 'hook-reachability.json');
      lockedUpdate(file, (state) => {
        const next = state && typeof state === 'object' ? state : {};
        next.skill_post = { ts: new Date().toISOString(), version: BKIT_VERSION, skillName };
        return next;
      });
    } catch (_) { /* graceful — reachability ping is best-effort */ }

    if (!skillName) {
      debugLog('SkillPost', 'No skill name found in context');
      console.log(JSON.stringify({ status: 'skip', reason: 'no skill name' }));
      return;
    }

    debugLog('SkillPost', 'Processing skill post-execution', { skillName, args });

    // v1.4.4: Set active skill for unified hooks (GitHub #9354 workaround)
    // C2 fix: write to the file marker so cross-process unified-* readers see it.
    writeActiveSkill({ skill: skillName });
    debugLog('SkillPost', 'Active skill marker written for unified hooks', { skillName });

    // Get orchestration result
    const result = await orch.orchestrateSkillPost(skillName, {}, { args });
    const suggestions = result.suggestions || {};

    // Claude Code: JSON output
    const output = generateJsonOutput(suggestions, skillName);
    output.status = 'success';
    console.log(JSON.stringify(output, null, 2));

    // v2.0.0: Audit logging for skill execution
    try {
      const audit = require('../lib/audit/audit-logger');
      audit.writeAuditLog({
        actor: 'system', actorId: 'skill-post',
        action: 'skill_executed',
        category: 'skill',
        target: skillName, targetType: 'skill',
        result: 'success', destructiveOperation: false
      });
    } catch (_) {}

    // v2.0.0: Decision tracing when skills make PDCA phase decisions
    try {
      const skillCfg = orch.getSkillConfig(skillName);
      if (skillCfg && skillCfg['pdca-phase']) {
        const dt = require('../lib/audit/decision-tracer');
        const feature = args.feature || getPdcaStatusFull()?.currentFeature || '';
        dt.recordDecision({
          feature,
          phase: skillCfg['pdca-phase'],
          decisionType: 'phase_transition',
          question: `Skill ${skillName} completed - advance PDCA phase?`,
          chosenOption: `Advance to ${skillCfg['pdca-phase']}`,
          rationale: `Skill ${skillName} maps to pdca-phase ${skillCfg['pdca-phase']}`,
          confidence: 0.9,
          impact: 'medium',
          affectedFiles: [],
          reversible: true
        });
      }
    } catch (_) {}

    // Update PDCA status if skill has pdca-phase
    const skillConfig = orch.getSkillConfig(skillName);
    if (skillConfig && skillConfig['pdca-phase']) {
      const phase = skillConfig['pdca-phase'];
      const feature = args.feature || getPdcaStatusFull()?.currentFeature;

      if (feature) {
        updatePdcaStatus(feature, phase);
        debugLog('SkillPost', 'PDCA status updated', { feature, phase });
      }
    }

  } catch (e) {
    debugLog('SkillPost', 'Error in post-execution', { error: e.message });
    console.log(JSON.stringify({
      status: 'error',
      error: e.message
    }));
  }
}

// Run main
main().catch(e => {
  console.error('skill-post.js fatal error:', e.message);
  process.exit(1);
});
