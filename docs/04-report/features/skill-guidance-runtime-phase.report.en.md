# Completion Report — Runtime-Phase-Aware Skill Guidance (Issue #135, v2.1.28)

> Feature: `skill-guidance-runtime-phase` · Branch: `feat/v2.1.28-issue-135`
> Reporter: @hslee-cmyk · PDCA: pm → plan → design → do → check → qa → report

## 1. What shipped

The next-step **guidance-text** half of the `UserPromptExpansion` mechanism —
left unreachable for multi-action router skills by the #132 fix — now works.
`pdca` and `sprint` emit runtime-phase-aware "what to run next" guidance on both
the native slash path and the model Skill-tool path, by reusing bkit's existing
phase-transition SSoT (no duplicated logic).

## 2. Root cause (confirmed, not assumed)

`orchestrateSkillPost()` derived `suggestions` only from static SKILL.md
frontmatter (`next-skill`, `pdca-phase`). The 11 router skills declare both
`null` by design (phase depends on the runtime `action`, not the skill name), so
`suggestions = {}` → `formatGuidance()` returned `''` → no guidance. Verified at
code + runtime level and against a main-baseline regression diff.

## 3. Implementation

| File | Change |
|---|---|
| `lib/orchestrator/runtime-guidance.js` | **NEW** — `resolveRuntimeGuidance`; PDCA via `getNextPdcaActionAfterCompletion`, Sprint via `buildNextActions`; fail-open; EN/KO strings |
| `lib/orchestrator/skill-invocation-effects.js` | enrich empty `suggestions` at the shared chokepoint (both paths); guarded, fail-open |
| `lib/skill-orchestrator.js` | existing Korean guidance strings → EN-default + KO via i18n detector |
| `test/regression/issue-135-multiaction-guidance.test.js` | **NEW** — 23 TC |
| `test/unit/skill-orchestrator.test.js` | SO-023..028 KO→EN (46/46) |

Design principles honored: **No Guessing** (root cause reproduced), **SSoT reuse**
(no duplicated phase table), **fail-open** (never blocks a command), **judicious
scope** (only pdca/sprint eligible; 9 utilities intentionally silent).

## 4. Verification

- Design↔code match: **100%** (10/10 design items).
- New regression 23/23; unit 46/46; non-regression #132 7/7, effects 5/5.
- Real production-entrypoint QA (`--plugin-dir .`): guidance confirmed on both
  SLASH and MODEL paths for pdca/sprint; utilities silent; single-purpose skills
  unchanged (now English).
- All 13 CI gates green (domain-purity, deadcode 195, guards, validate-plugin
  --strict 0 err, docs-code-sync, integration-runtime 23, l2-smoke 105,
  invocation-inventory 213, docs-code-sync.test 36, bkit-full-system 36).
- Main-baseline regression diff: **0 regressions** (40 pre-existing, unrelated,
  non-CI failures unchanged — reported as-is).

## 5. Docs = Code

Version bumped 2.1.27 → **2.1.28** across the 7 gated files + CHANGELOG entry +
marketplace description. Architecture prose synced to 195 lib modules
(README, README-FULL, AI-NATIVE, CUSTOMIZATION-GUIDE, session-context). Bilingual
PDCA docs (plan/design/analysis/qa/report `.en`+`.ko`).

## 6. Lessons learned

- The #132 fix and #135 are the same mechanism split in half (audit vs guidance);
  a "fix" that only wires one output surface can leave the other silently dead.
- Passive guidance and manual `/pdca next` were two disconnected systems; the
  durable fix was to make the passive path reuse the manual path's SSoT, not to
  add a third parallel resolver.
- Ambient-locale-independent assertions (command text) make guidance tests robust;
  message text belongs in i18n-map assertions.

## 7. Follow-ups (out of scope)

- The `run-all.js` suite carries 40 pre-existing failures from stale test-file
  registrations (`context-loader`, `impact-analyzer`, `invariant-checker`,
  `scenario-runner`, …). Not part of the CI gate suite; candidate for a separate
  housekeeping pass.
- Consider @hslee-cmyk (3rd issue: #125/#126, #132, #135) for Hall of Fame +
  external-dogfood E2E absorption per the README program.
