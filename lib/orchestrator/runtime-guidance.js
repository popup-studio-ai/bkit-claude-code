'use strict';
/**
 * Runtime-Phase-Aware Skill Guidance (Issue #135 — v2.1.28)
 *
 * `orchestrateSkillPost()` (lib/skill-orchestrator.js) resolves next-step
 * guidance ONLY from two STATIC SKILL.md frontmatter fields (`next-skill:`,
 * `pdca-phase:`). bkit's flagship multi-action routers — `pdca` and `sprint` —
 * declare BOTH `null` by design, because their effective phase depends on the
 * runtime `action` argument, not the skill name. Result: `suggestions = {}`,
 * `formatGuidance()` returns '', and the two most-used skills silently emit no
 * "what should I run next" guidance (issue #135, the guidance-text half left
 * open by the #132 audit/task-tagging fix).
 *
 * This module closes that gap by resolving the phase at CALL TIME from the
 * invocation `action` cross-referenced with live PDCA/Sprint state, then reusing
 * the SAME source-of-truth the MANUAL `/pdca next` / `/sprint phase` paths use —
 * so the passive-guidance path and the manual path stop being two disconnected
 * systems. No phase-transition table is duplicated here.
 *
 *   PDCA  → lib/pdca/automation.getNextPdcaActionAfterCompletion  (live-status
 *           aware: check→qa|act by matchRate, qa→report|act by qaPassRate)
 *   Sprint→ lib/sprint/executive-summary.buildNextActions          (phase → next
 *           /sprint command), phase read from the sprint index SSoT.
 *
 * CONTRACT: pure, side-effect-free, and FAIL-OPEN — any error returns `{}` so
 * the caller (runSkillInvocationEffects) never blocks or throws. Runs ONLY for
 * guidance-eligible routers and ONLY when frontmatter produced nothing.
 *
 * @module lib/orchestrator/runtime-guidance
 * @since 2.1.28
 */

// Router skills whose runtime guidance is meaningful. The other 9 both-null
// routers (audit, control, rollback, bkit-evals, bkit-explore,
// claude-code-learning, pdca-batch, pdca-fast-track, pdca-watch) are pure
// utilities with no linear "next PDCA step" — their silence is correct, not a
// bug (#135 §Impact).
const GUIDANCE_ELIGIBLE = new Set(['pdca', 'sprint']);

// PDCA action tokens that ARE phase names (current phase == action).
const PDCA_ACTION_PHASES = new Set(['pm', 'plan', 'design', 'do', 'check', 'act', 'qa', 'report']);

// suggestedAgent per phase — a SUPERSET of orchestrateSkillPost's existing
// hardcoded pair (do→gap-detector, check→pdca-iterator), preserved verbatim,
// plus two additive entries where an agent genuinely helps. Absent phases carry
// nextSkill only.
const AGENT_BY_PHASE = {
  do: 'gap-detector',
  check: 'pdca-iterator',
  design: 'design-validator',
  qa: 'qa-lead',
};

const AGENT_MSG_KEY = {
  do: '_agentDo',
  check: '_agentCheck',
  design: '_agentDesign',
  qa: '_agentQa',
};

// Language-aware guidance strings (English authored first; KO sibling for the
// `ko` locale). Lives here — NOT in assets/error-dict.*.json, which is scoped to
// error messages. Mirrors bkit's bilingual i18n convention.
const GUIDANCE_MSG = {
  en: {
    plan: 'Draft the specification.',
    design: 'Design the architecture.',
    do: 'Implement from the design.',
    check: 'Run gap analysis (design vs code).',
    act: 'Auto-repair until match rate reaches 90%.',
    qa: 'Run L1-L5 QA verification.',
    report: 'Write the completion report.',
    completed: 'Archive the feature.',
    _agentDo: 'Measure the design-code gap once implementation is done.',
    _agentCheck: 'Auto-improve if match rate is below 90%.',
    _agentDesign: 'Validate the design document for completeness.',
    _agentQa: 'Run the L1-L5 QA team.',
    _sprint: 'Advance the sprint to the next phase.',
  },
  ko: {
    plan: '명세를 작성하세요.',
    design: '아키텍처를 설계하세요.',
    do: '설계를 기반으로 구현하세요.',
    check: 'Gap 분석(설계 대 코드)을 실행하세요.',
    act: '매치율 90%에 도달할 때까지 자동 개선하세요.',
    qa: 'L1-L5 QA 검증을 실행하세요.',
    report: '완료 보고서를 작성하세요.',
    completed: '기능을 아카이브하세요.',
    _agentDo: '구현이 완료되면 설계-코드 갭을 측정하세요.',
    _agentCheck: '매치율이 90% 미만이면 자동 개선하세요.',
    _agentDesign: '설계 문서의 완결성을 검증하세요.',
    _agentQa: 'L1-L5 QA 팀을 실행하세요.',
    _sprint: '스프린트를 다음 phase로 진행하세요.',
  },
};

/**
 * Resolve the persisted user language (EN default, KO when persisted). Never
 * throws.
 * @returns {'en'|'ko'}
 */
function safeReadLanguage() {
  try {
    const det = require('../i18n/detector');
    const rec = typeof det.readLanguage === 'function' ? det.readLanguage() : null;
    return rec && rec.lang === 'ko' ? 'ko' : 'en';
  } catch (_) {
    return 'en';
  }
}

/**
 * Look up a language-aware guidance string, falling back to English then ''.
 * @param {'en'|'ko'} lang
 * @param {string} key
 * @returns {string}
 */
function msg(lang, key) {
  return (GUIDANCE_MSG[lang] && GUIDANCE_MSG[lang][key]) || GUIDANCE_MSG.en[key] || '';
}

/**
 * Resolve the effective PDCA phase for this invocation.
 *   - action IS a phase name  → that phase
 *   - action is next/status/iterate/analyze/absent → live feature phase
 * @returns {{phase: string|null, feature: string}}
 */
function resolvePdcaPhase(args) {
  let status = null;
  try {
    const { getPdcaStatusFull } = require('../pdca/status');
    status = getPdcaStatusFull();
  } catch (_) { /* fail-open */ }

  const action = (args && args.action) || '';
  const feature = (args && args.feature) || (status && status.currentFeature) || '';

  if (PDCA_ACTION_PHASES.has(action)) {
    return { phase: action, feature };
  }
  const fp = feature && status && status.features && status.features[feature];
  return { phase: fp && fp.phase ? fp.phase : null, feature };
}

/**
 * PDCA runtime guidance — reuses the manual `/pdca next` SSoT.
 * @returns {Object} suggestions ({} when nothing to suggest)
 */
function resolvePdca(args, lang) {
  const { phase, feature } = resolvePdcaPhase(args);
  if (!phase) return {};

  const suggestions = {};

  // nextSkill via the live-status-aware SSoT (needs a concrete feature).
  if (feature) {
    let next = null;
    try {
      const { getNextPdcaActionAfterCompletion } = require('../pdca/automation');
      next = getNextPdcaActionAfterCompletion(phase, feature);
    } catch (_) { /* fail-open */ }
    if (next && next.command) {
      suggestions.nextSkill = {
        name: String(next.command).replace(/^\//, ''),
        message: msg(lang, next.nextPhase),
      };
    }
  }

  // suggestedAgent is phase-based (feature-independent) — offer it even when no
  // concrete feature is known, so guidance is never fully empty for a real phase.
  const agent = AGENT_BY_PHASE[phase];
  if (agent) {
    suggestions.suggestedAgent = agent;
    suggestions.suggestedMessage = msg(lang, AGENT_MSG_KEY[phase]);
  }

  return suggestions;
}

/**
 * Pick the most-recently-updated non-archived sprint from the index.
 * @returns {Object|null}
 */
function mostRecentActiveSprint(entries) {
  const list = Object.values(entries).filter(e => e && e.status !== 'archived');
  if (!list.length) return null;
  list.sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  return list[0];
}

/**
 * Sprint runtime guidance — reuses buildNextActions (phase → /sprint command),
 * phase read from the sprint index SSoT.
 * @returns {Object} suggestions ({} when nothing to suggest)
 */
function resolveSprint(args, lang) {
  const requestedId = (args && args.feature) || '';

  let entry = null;
  try {
    const { getSprintIndexFile } = require('../infra/sprint/sprint-paths');
    const { safeReadJson } = require('../infra/sprint/sprint-state-store.adapter');
    const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const idx = safeReadJson(getSprintIndexFile(root));
    const entries = idx && idx.entries;
    if (entries && typeof entries === 'object') {
      entry = (requestedId && entries[requestedId]) || mostRecentActiveSprint(entries);
    }
  } catch (_) { /* fail-open */ }

  const phase = entry && entry.phase;
  const sprintId = (entry && entry.id) || requestedId;
  if (!phase) return {};

  let actions = null;
  try {
    const { buildNextActions } = require('../sprint/executive-summary');
    actions = buildNextActions(phase, sprintId || '<id>');
  } catch (_) { /* fail-open */ }

  const first = Array.isArray(actions) && actions[0];
  if (!first || !first.command) return {};

  return {
    nextSkill: {
      name: String(first.command).replace(/^\//, ''),
      message: msg(lang, '_sprint'),
    },
  };
}

/**
 * Resolve runtime-phase-aware next-step guidance for a multi-action router skill.
 * Returns `{}` for ineligible skills or when nothing can be resolved. Never
 * throws (fail-open).
 *
 * @param {string} skillName - Canonical (bare) skill name.
 * @param {{action?: string, feature?: string}} args - Parsed invocation args.
 * @returns {Object} suggestions object consumable by formatGuidance().
 */
function resolveRuntimeGuidance(skillName, args) {
  try {
    if (!GUIDANCE_ELIGIBLE.has(skillName)) return {};
    const lang = safeReadLanguage();
    const a = args || {};
    if (skillName === 'pdca') return resolvePdca(a, lang);
    if (skillName === 'sprint') return resolveSprint(a, lang);
    return {};
  } catch (_) {
    return {};
  }
}

module.exports = {
  resolveRuntimeGuidance,
  // Exported for tests / white-box inspection.
  GUIDANCE_ELIGIBLE,
  AGENT_BY_PHASE,
  GUIDANCE_MSG,
  PDCA_ACTION_PHASES,
};
