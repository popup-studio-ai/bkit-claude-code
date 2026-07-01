/**
 * Skill Name Canonicalizer (Issue #125 — v2.1.24)
 *
 * Claude Code invokes plugin skills via the fully-qualified `plugin:skill`
 * form (e.g. `bkit:pdca`, `bkit:code-review`). bkit, however, resolves every
 * skill by its on-disk folder name (`skills/pdca/`, `skills/code-review/`) and
 * matches skill names against bare-name registries (SKILL_HANDLERS,
 * CODE_GENERATION_SKILLS, next-action-engine, …).
 *
 * Passing the namespaced form straight through silently broke:
 *   - `getSkillConfig('bkit:pdca')` → `skills/bkit:pdca/SKILL.md` (ENOENT) → null
 *     → next-skill / pdca-phase suggestions never fired (#125)
 *   - implicit-trigger template injection (user-prompt-handler) resolving
 *     `skills/bkit:<skill>/SKILL.md` (always ENOENT)
 *   - Stop-handler dispatch (`SKILL_HANDLERS[activeSkill]`) when the active-skill
 *     marker held the namespaced form
 *
 * This module is the single source of truth that maps any skill identifier —
 * bare or namespaced — to its canonical bare folder name. A bare name passes
 * through unchanged; a namespaced name yields its final `:`-delimited segment.
 *
 * Sibling to lib/core/name-validator.js: that module *rejects* unsafe names;
 * this one *canonicalizes* CC-namespaced names. The canonical output is always
 * path-safe (no `:`), so it composes cleanly with validateName downstream.
 *
 * @module lib/core/skill-name
 * @version 2.1.24
 * @since 2.1.24
 */

'use strict';

/**
 * Canonicalize a Claude Code skill identifier to its bare folder name.
 *
 * Strips everything up to and including the last ':' — so `bkit:pdca` → `pdca`,
 * `pdca` → `pdca`, and a hypothetical multi-segment `a:b:skill` → `skill`.
 * Non-string input is returned unchanged so callers that receive `null` from a
 * detection helper stay null-safe (e.g. `normalizeSkillName(null) === null`).
 *
 * @param {string} skillName - Skill identifier, bare or `plugin:skill` form.
 * @returns {string} The canonical bare skill/folder name.
 */
function normalizeSkillName(skillName) {
  if (typeof skillName !== 'string') return skillName;
  const idx = skillName.lastIndexOf(':');
  return idx === -1 ? skillName : skillName.slice(idx + 1);
}

module.exports = { normalizeSkillName };
