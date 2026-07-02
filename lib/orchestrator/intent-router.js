/**
 * Intent Router — priority-resolved intent detection with structured output.
 *
 * Sprint 7c (v2.1.10): user-prompt-handler가 3종 힌트(feature / agent / skill)를
 * 독립 주입하던 경쟁 해결 부재 문제(G-J-04)를 해결.
 *
 * Priority rule:
 *   (1) Feature intent (≥0.7) with or without featureName → /pdca pm 제안 (최우선)
 *   (2) Skill trigger (≥0.75) → skill 호출 제안
 *   (3) Agent trigger (≥0.8) → agent 호출 제안
 *   (4) 결과는 primary + alternatives 구조로 반환
 *
 * Design Ref: bkit-v2110-orchestration-integrity.design.md §3.3.2
 * Plan SC: G-J-01/03/04/09
 *
 * @module lib/orchestrator/intent-router
 *
 * @version 2.1.12
 */

/**
 * @typedef {Object} Suggestion
 * @property {'skill'|'agent'|'command'} type
 * @property {string} name          e.g. 'bkit:pdca', 'bkit:pm-lead'
 * @property {string|null} [args]   e.g. 'pm login-feature'
 * @property {number} confidence
 * @property {string} rationale
 */

/**
 * @typedef {Object} RouteResult
 * @property {Suggestion|null} primary
 * @property {Suggestion[]} suggestions   (primary + alternatives, max 5)
 * @property {number} ambiguity           0.0~1.0
 * @property {string[]} ambiguityFactors
 * @property {boolean} shouldClarify
 */

/**
 * Route a user prompt to a prioritized suggestion set.
 * @param {string} prompt
 * @param {object} [context]
 * @returns {RouteResult}
 */
function route(prompt, context = {}) {
  const suggestions = [];
  let primary = null;

  // v2.1.12 Sprint E-2 (defect #23 fix): explicit slash-command syntax
  // (e.g. `/pdca status`, `/bkit-evals run pdca`). Surface as a high-confidence
  // suggestion of type 'command' so downstream consumers (CC harness or the
  // user-prompt-handler) can dispatch directly. Actual dispatch still happens
  // outside this module.
  if (typeof prompt === 'string') {
    // #132 (free win A): accept the `:` namespace so bkit's own namespaced
    // commands `/bkit:pdca do login` are recognized (previously `[\w-]+`
    // excluded the `:` and the command branch silently skipped them). Widening
    // to `[\w:-]+` only broadens the captured NAME — non-bkit commands like
    // `/simplify` still match unchanged and are not misrouted.
    const slashMatch = prompt.match(/^\s*\/([\w:-]+)(?:\s+(.+))?$/);
    if (slashMatch) {
      const cmdName = slashMatch[1];
      const cmdArgs = slashMatch[2] ? slashMatch[2].trim() : null;
      const s = {
        type: 'command',
        name: `/${cmdName}`,
        args: cmdArgs,
        confidence: 0.95,
        rationale: 'explicit slash-command syntax',
      };
      suggestions.push(s);
      primary = s;
      // Short-circuit: skip downstream pattern matching for explicit slash
      // commands so the slash always wins.
      return {
        primary,
        suggestions,
        ambiguity: 0,
        ambiguityFactors: [],
        shouldClarify: false,
      };
    }
  }

  // 1. Feature intent (loose threshold 0.7 — v2.1.10 G-J-03)
  try {
    const trigger = require('../intent/trigger');
    if (typeof trigger.detectNewFeatureIntent === 'function') {
      const feat = trigger.detectNewFeatureIntent(prompt);
      if (feat && feat.confidence >= 0.7) {
        const args = feat.featureName ? `pm ${feat.featureName}` : 'pm';
        const s = {
          type: 'skill',
          name: 'bkit:pdca',
          args,
          confidence: feat.confidence,
          rationale: feat.featureName
            ? `new feature "${feat.featureName}" detected`
            : 'feature intent detected (name uncertain)',
        };
        suggestions.push(s);
        primary = s;
      }
    }
  } catch (_e) { /* fail-open */ }

  // 2. Skill trigger (standalone patterns; confidence ≥0.75)
  try {
    const trigger = require('../intent/trigger');
    if (typeof trigger.matchImplicitSkillTrigger === 'function') {
      const sk = trigger.matchImplicitSkillTrigger(prompt);
      if (sk && sk.confidence > 0.75) {
        // skip if primary already points to pdca and sk.skill is a competing pdca-like
        const exists = suggestions.some((x) => x.name === sk.skill);
        if (!exists) {
          const s = {
            type: 'skill',
            name: sk.skill,
            args: null,
            confidence: sk.confidence,
            rationale: 'skill trigger matched',
          };
          suggestions.push(s);
          if (!primary) primary = s;
        }
      }
    }
  } catch (_e) { /* fail-open */ }

  // 3. Agent trigger (confidence ≥0.8)
  try {
    const trigger = require('../intent/trigger');
    if (typeof trigger.matchImplicitAgentTrigger === 'function') {
      const ag = trigger.matchImplicitAgentTrigger(prompt);
      if (ag && ag.confidence >= 0.8) {
        const s = {
          type: 'agent',
          name: ag.agent,
          args: null,
          confidence: ag.confidence,
          rationale: 'agent trigger matched',
        };
        suggestions.push(s);
        if (!primary) primary = s;
      }
    }
  } catch (_e) { /* fail-open */ }

  // 4. Ambiguity — config-connected threshold (v2.1.10 G-J-10)
  let ambiguity = 0;
  let factors = [];
  let shouldClarify = false;
  try {
    const amb = require('../intent/ambiguity');
    if (typeof amb.calculateAmbiguityScore === 'function') {
      const result = amb.calculateAmbiguityScore(prompt, context);
      ambiguity = result.score || 0;
      factors = result.factors || [];
      let threshold = 0.7;
      try {
        const cfg = require('../core/config');
        if (typeof cfg.getConfig === 'function') {
          threshold = cfg.getConfig('ui.contextInjection.ambiguityThreshold', 0.7);
        }
      } catch (_e) { /* fail-open */ }
      shouldClarify = ambiguity >= threshold && factors.length >= 2;
    }
  } catch (_e) { /* fail-open */ }

  return {
    primary,
    suggestions: suggestions.slice(0, 5),
    ambiguity,
    ambiguityFactors: factors,
    shouldClarify,
  };
}

/**
 * Format a Suggestion for human-readable `additionalContext` string.
 *
 * v2.1.12 Sprint E-2 (defect #22 fix): when called with a falsy / partial
 * suggestion (e.g. `route().primary === null`) returns `''` instead of the
 * previous `'undefined: undefined —'` user-facing string.
 *
 * @param {Suggestion} s
 * @returns {string}
 */
function formatSuggestion(s) {
  if (!s || typeof s !== 'object') return '';
  if (typeof s.type !== 'string' || typeof s.name !== 'string') return '';
  const confStr = typeof s.confidence === 'number' ? ` (${Math.round(s.confidence * 100)}%)` : '';
  const argsStr = s.args ? ` ${s.args}` : '';
  return `${s.type}: ${s.name}${argsStr}${confStr} — ${s.rationale || ''}`.trim();
}

module.exports = { route, formatSuggestion };
