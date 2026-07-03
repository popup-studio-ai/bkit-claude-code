# Plan — Runtime-Phase-Aware Skill Guidance (Issue #135, v2.1.28)

> Feature: `skill-guidance-runtime-phase` · Target: bkit v2.1.28 · Branch: `feat/v2.1.28-issue-135`
> Reporter: @hslee-cmyk (external dogfooder) · Precedes: #132 (v2.1.27)

## 1. Problem (confirmed, not assumed)

The #132 fix (v2.1.27) made the `skill_invoked` audit / task-tagging half of the
`UserPromptExpansion` mechanism reachable for native slash commands. But the
**next-step guidance-text half** of the same mechanism never fires for
multi-action router skills, because `orchestrateSkillPost()`
(`lib/skill-orchestrator.js:472-506`) derives `suggestions` **only** from two
static SKILL.md frontmatter fields — `next-skill:` and `pdca-phase:` — and
11 router skills declare both `null` by design (their phase depends on the
runtime `action` argument, not the skill name).

### Verified evidence

- **Code**: `orchestrateSkillPost` reads only `config['next-skill']` /
  `config['pdca-phase']`; the runtime `context.args.action` is passed in but
  ignored.
- **Frontmatter survey (11 both-null skills, exhaustive match with report)**:
  `audit, bkit-evals, bkit-explore, claude-code-learning, control, pdca-batch,
  pdca-fast-track, pdca-watch, pdca, rollback, sprint`.
- **Runtime reproduction**: `orchestrateSkillPost('pdca', {}, {args:{action:'plan'}})`
  returns `{}` → `formatGuidance()` returns `''` → nothing written to stdout.
  `deploy` / `code-review` / `plan-plus` / `cc-version-analysis` resolve correctly.
- **Both invocation paths** (`skill-post.js:167` MODEL, `user-prompt-expansion-handler.js:78`
  SLASH) share `runSkillInvocationEffects`, which calls `orchestrateSkillPost` once
  (effects.js:114) → a single fix covers both.

### Impact

`pdca` and `sprint` — bkit's two flagship orchestrators, the skills where
"what should I run next" guidance is most valuable — are the ones structurally
excluded. No error, no log signal; indistinguishable from "nothing to suggest".

## 2. Goal

Make passive next-step guidance reachable for multi-action router skills by
resolving the **runtime** phase (from `args.action` + live PDCA/Sprint status)
and reusing bkit's existing phase-transition SSoT — **not** a parallel bolt-on.
This closes the issue's deeper complaint that the passive-guidance path and the
manual `/pdca next` path are two disconnected systems.

## 3. Scope

**In scope**
- Runtime phase resolution inside the `orchestrateSkillPost` → `runSkillInvocationEffects`
  guidance path for `pdca` (and, where the SSoT exists, `sprint`).
- Reuse `lib/pdca/automation.js#getNextPdcaActionAfterCompletion` (the manual
  `/pdca next` SSoT) and `lib/pdca/phase.js#getNextPdcaPhase` — no duplicated
  phase tables.
- Language-aware guidance strings (EN default / KO) via `lib/i18n/detector.readLanguage()`;
  new code English-first per CLAUDE.md.
- Judicious application: pure utility skills (`audit`, `control`, `rollback`,
  `bkit-evals`, `bkit-explore`, `claude-code-learning`) get guidance only where a
  meaningful next step exists; silence there is correct, not a bug.
- Regression tests for both paths + single-purpose non-regression.

**Out of scope**
- Rewriting the error-dict i18n system (it is error-focused; guidance uses the
  detector + a co-located bilingual map).
- Changing frontmatter schema (option 2 rejected — cannot express live-status
  cases like `pdca next`/`pdca status`).

## 4. Approach (chosen at Design checkpoint)

**Runtime phase resolution (fundamental, SSoT-unified).** For a router skill
whose `pdca-phase` frontmatter is `null`, resolve the effective phase from the
invocation `action` cross-referenced with live `.bkit/state/pdca-status.json`,
then produce guidance via the existing manual-path resolver so both systems
share one source of truth.

## 5. Acceptance criteria

1. `/bkit:pdca plan <feat>` (and other phase actions) emit next-step guidance on
   the native slash path.
2. `sprint` emits phase-aware guidance where the sprint SSoT provides a next step.
3. `deploy`, `code-review`, `plan-plus`, `cc-version-analysis` guidance unchanged.
4. No duplicated phase-transition table introduced; `getNextPdcaActionAfterCompletion`
   / `getNextPdcaPhase` reused.
5. Guidance strings language-aware (EN/KO), new code English.
6. Fail-open preserved: any resolution error → no guidance, never a block/throw.
7. Full test suite green; new regression tests cover multi-action + both paths.

## 6. Risks

- **Over-triggering** guidance on utility skills → mitigate with an allow-set of
  guidance-eligible router skills (pdca, sprint) + null-return default.
- **Live-status absence** (feature not in pdca-status) → fail-open to no guidance.
- **Double-emission** across MODEL+SLASH → already guarded by the dedup key in
  `runSkillInvocationEffects`.
