#!/usr/bin/env node
'use strict';
/**
 * issue-135-multiaction-guidance.test.js — Regression guard for GitHub #135.
 *
 * #132 made the audit/task-tagging half of the UserPromptExpansion mechanism
 * reachable for native slash commands. #135 is the remaining gap: the next-step
 * GUIDANCE-TEXT half never fired for multi-action router skills (pdca/sprint/+9),
 * because orchestrateSkillPost derives suggestions only from STATIC frontmatter
 * (next-skill/pdca-phase), which those routers declare null by design.
 *
 * The v2.1.28 fix resolves the phase at CALL TIME (args.action + live PDCA/Sprint
 * state) and reuses the manual-path SSoT (getNextPdcaActionAfterCompletion /
 * buildNextActions) — no duplicated phase table.
 *
 * Covers:
 *  1. Root-cause guard: pdca/sprint SKILL.md still declare next-skill & pdca-phase
 *     null (the structural condition that motivates runtime resolution).
 *  2. runtime-guidance: pdca phase actions → correct next /pdca command + agent.
 *  3. Utility routers (control/rollback) stay silent ({}) — intended, not a bug.
 *  4. Ineligible skills (deploy) are not handled by the runtime path.
 *  5. Fail-open: unresolvable phase → {} (never throws).
 *  6. SSoT reuse (no duplicated phase table) — source references the shared
 *     resolvers and defines no local phase-order array.
 *  7. i18n: GUIDANCE_MSG has EN/KO parity; new code EN-default.
 *  8. End-to-end: runSkillInvocationEffects('pdca', ...) now yields non-empty
 *     guidance on BOTH paths, while single-purpose skills (deploy) are unchanged.
 */

const fs = require('node:fs');
const path = require('node:path');

const REPO = path.resolve(__dirname, '..', '..');
process.env.CLAUDE_PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || REPO;
process.env.CLAUDE_PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || REPO;

let pass = 0, fail = 0;
const failures = [];
function tc(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`${name}${detail ? ' :: ' + detail : ''}`); }
}

// --- 1. Root-cause guard: router frontmatter is both-null ----------------------
{
  function fm(skill, key) {
    const p = path.join(REPO, 'skills', skill, 'SKILL.md');
    const src = fs.readFileSync(p, 'utf8');
    const m = src.match(new RegExp('^' + key + ':\\s*(.*)$', 'm'));
    return m ? m[1].trim() : '<absent>';
  }
  for (const s of ['pdca', 'sprint']) {
    tc(`#135 precondition: ${s} next-skill is null`, fm(s, 'next-skill') === 'null',
      `got ${fm(s, 'next-skill')}`);
    tc(`#135 precondition: ${s} pdca-phase is null`, fm(s, 'pdca-phase') === 'null',
      `got ${fm(s, 'pdca-phase')}`);
  }
}

// --- 2. runtime-guidance: pdca phase actions resolve forward -------------------
{
  const { resolveRuntimeGuidance } = require('../../lib/orchestrator/runtime-guidance');

  const plan = resolveRuntimeGuidance('pdca', { action: 'plan', feature: 'X' });
  tc('pdca plan → nextSkill points to design (command is locale-independent)',
    plan && plan.nextSkill && plan.nextSkill.name === 'pdca design X',
    JSON.stringify(plan));

  const design = resolveRuntimeGuidance('pdca', { action: 'design', feature: 'X' });
  tc('pdca design → suggestedAgent design-validator',
    design && design.suggestedAgent === 'design-validator', JSON.stringify(design));

  const doo = resolveRuntimeGuidance('pdca', { action: 'do', feature: 'X' });
  tc('pdca do → nextSkill analyze + gap-detector (existing pair preserved)',
    doo && doo.nextSkill && doo.nextSkill.name === 'pdca analyze X' &&
      doo.suggestedAgent === 'gap-detector', JSON.stringify(doo));

  const check = resolveRuntimeGuidance('pdca', { action: 'check', feature: 'X' });
  tc('pdca check → pdca-iterator (existing pair preserved)',
    check && check.suggestedAgent === 'pdca-iterator', JSON.stringify(check));
}

// --- 3. Utility routers stay silent -------------------------------------------
{
  const { resolveRuntimeGuidance } = require('../../lib/orchestrator/runtime-guidance');
  for (const s of ['control', 'rollback', 'audit', 'bkit-evals']) {
    const r = resolveRuntimeGuidance(s, { action: 'x' });
    tc(`utility router ${s} → {} (intended silence)`,
      r && typeof r === 'object' && Object.keys(r).length === 0, JSON.stringify(r));
  }
}

// --- 4. Ineligible (single-purpose) skills are not handled here ----------------
{
  const { resolveRuntimeGuidance } = require('../../lib/orchestrator/runtime-guidance');
  const r = resolveRuntimeGuidance('deploy', {});
  tc('deploy not eligible for runtime path (resolves via frontmatter elsewhere)',
    r && Object.keys(r).length === 0, JSON.stringify(r));
}

// --- 5. Fail-open: unresolvable phase → {} ------------------------------------
{
  const { resolveRuntimeGuidance } = require('../../lib/orchestrator/runtime-guidance');
  const r = resolveRuntimeGuidance('pdca', { action: 'bogus', feature: '___no_such_feature___' });
  tc('pdca with unresolvable phase → {} (fail-open, no throw)',
    r && Object.keys(r).length === 0, JSON.stringify(r));
}

// --- 6. SSoT reuse: no duplicated phase table ---------------------------------
{
  const src = fs.readFileSync(path.join(REPO, 'lib', 'orchestrator', 'runtime-guidance.js'), 'utf8');
  tc('reuses getNextPdcaActionAfterCompletion (PDCA SSoT)',
    src.includes('getNextPdcaActionAfterCompletion'), 'missing reference');
  tc('reuses buildNextActions (Sprint SSoT)',
    src.includes('buildNextActions'), 'missing reference');
  // Must not re-implement the phase-TRANSITION map (the thing
  // getNextPdcaActionAfterCompletion owns), e.g. `nextPhaseMap` or a
  // `plan: 'design'` key→next-phase literal. A membership Set of phase-typed
  // action tokens is NOT a transition table and is allowed.
  tc('does not duplicate a phase-transition map',
    !src.includes('nextPhaseMap') && !/['"]?plan['"]?\s*:\s*['"]design['"]/.test(src),
    'found a duplicated phase-transition literal');
}

// --- 7. i18n parity: EN/KO maps ------------------------------------------------
{
  const { GUIDANCE_MSG, GUIDANCE_ELIGIBLE } = require('../../lib/orchestrator/runtime-guidance');
  const enKeys = Object.keys(GUIDANCE_MSG.en).sort();
  const koKeys = Object.keys(GUIDANCE_MSG.ko).sort();
  tc('GUIDANCE_MSG EN/KO key parity', JSON.stringify(enKeys) === JSON.stringify(koKeys),
    `en=${enKeys.length} ko=${koKeys.length}`);
  tc('KO map carries Korean (design ≠ en, contains 아키텍처)',
    GUIDANCE_MSG.ko.design !== GUIDANCE_MSG.en.design && GUIDANCE_MSG.ko.design.includes('아키텍처'),
    GUIDANCE_MSG.ko.design);
  tc('EN map is English (design has no Hangul)',
    !/[가-힣]/.test(GUIDANCE_MSG.en.design), GUIDANCE_MSG.en.design);
  tc('GUIDANCE_ELIGIBLE is exactly {pdca, sprint}',
    GUIDANCE_ELIGIBLE.has('pdca') && GUIDANCE_ELIGIBLE.has('sprint') &&
      GUIDANCE_ELIGIBLE.size === 2, [...GUIDANCE_ELIGIBLE].join(','));
}

// --- 8. End-to-end through the shared effects glue -----------------------------
{
  const { runSkillInvocationEffects } = require('../../lib/orchestrator/skill-invocation-effects');
  (async () => {
    const r1 = await runSkillInvocationEffects('pdca', { action: 'plan', feature: 'ZfeatA' },
      { source: 'slash-command', dedupeKey: 'ig135-1', projectRoot: REPO });
    tc('effects: pdca plan yields non-empty guidance (both-path glue)',
      r1 && r1.suggestions && r1.suggestions.nextSkill &&
        r1.suggestions.nextSkill.name === 'pdca design ZfeatA', JSON.stringify(r1 && r1.suggestions));

    const r2 = await runSkillInvocationEffects('deploy', {},
      { source: 'skill-tool', dedupeKey: 'ig135-2', projectRoot: REPO });
    tc('effects: single-purpose deploy unchanged (frontmatter path intact)',
      r2 && r2.suggestions && r2.suggestions.suggestedAgent === 'gap-detector',
      JSON.stringify(r2 && r2.suggestions));

    console.log(`\nissue-135-multiaction-guidance.test.js: ${pass} passed, ${fail} failed`);
    if (failures.length) {
      console.error('FAILURES:');
      for (const f of failures) console.error(`  - ${f}`);
      process.exit(1);
    }
  })();
}
