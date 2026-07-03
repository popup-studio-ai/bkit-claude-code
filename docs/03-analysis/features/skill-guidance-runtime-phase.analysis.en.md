# Gap Analysis — Runtime-Phase-Aware Skill Guidance (Issue #135, v2.1.28)

> Phase: Check · Design ↔ Implementation match

## 1. Design → implementation match

| Design item (design.en §) | Implemented | Evidence |
|---|---|---|
| Keep `orchestrateSkillPost` pure frontmatter (§1) | ✅ | `lib/skill-orchestrator.js` guidance logic unchanged except EN i18n of its own strings |
| Enrichment in `runSkillInvocationEffects` after frontmatter, guarded on empty (§1) | ✅ | `skill-invocation-effects.js` step 3b: runs only when `suggestions` empty; fail-open try/catch |
| New module `runtime-guidance.js` w/ `resolveRuntimeGuidance` (§2) | ✅ | file created; single primary export |
| `GUIDANCE_ELIGIBLE = {pdca, sprint}` (§2.1) | ✅ | verified `size===2`; utilities → `{}` |
| PDCA reuse `getNextPdcaActionAfterCompletion` (§2.2) | ✅ | source references it; test IG "SSoT reuse" |
| `AGENT_BY_PHASE` superset of existing pair (§2.2) | ✅ | do→gap-detector, check→pdca-iterator preserved; +design→design-validator, qa→qa-lead |
| Sprint reuse `buildNextActions` + sprint index SSoT (§2.3) | ✅ | `resolveSprint` reads index via `getSprintIndexFile`+`safeReadJson` |
| Language-aware via `detector.readLanguage` (§2.4) | ✅ | `safeReadLanguage`; `GUIDANCE_MSG {en,ko}` |
| Existing Korean strings → language-aware (§3 sweep) | ✅ | `skill-orchestrator.js` `GUIDANCE_STRINGS` + `_guidanceLang` |
| Fail-open, no dup phase table, dedup preserved (§4) | ✅ | all `try/catch → {}`; no transition map duplicated; dedup key untouched |

**Match rate: 100%** (10/10 design items implemented as specified). No scope drift,
no items added beyond design.

## 2. Empirical behavior (runtime reproduction, before → after)

| Invocation | Before (#135 bug) | After (fix) |
|---|---|---|
| `pdca plan X` | `{}` (no guidance) | `Next: /pdca design X — Design the architecture.` |
| `pdca do X` | `{}` | `Next: /pdca analyze X` + `Suggested agent: gap-detector` |
| `pdca status <feat>` | `{}` | resolves live phase → next command + agent |
| `sprint status` | `{}` | `Next: /sprint phase <id> --to <next>` |
| `control level` | `{}` | `{}` (intended silence — utility) |
| `deploy` / `code-review` | frontmatter (KO) | frontmatter (EN) — unchanged path, i18n'd |

## 3. Test & quality-gate results

- New: `test/regression/issue-135-multiaction-guidance.test.js` — **23/23 PASS**
  (root-cause guard, pdca resolution, utility silence, ineligible skip, fail-open,
  SSoT-reuse guard, EN/KO parity, e2e both-path).
- Updated: `test/unit/skill-orchestrator.test.js` SO-023..028 KO→EN — **46/46 PASS**.
- Non-regression: `issue-132-slash-reach` **7/7**, `skill-invocation-effects` **5/5**.
- CI gates (local): domain-purity ✓, deadcode ✓ (195 modules, 0 dead),
  docs-code-sync ✓, guards ✓, validate-plugin --strict ✓ (0 errors),
  integration-runtime 23/23, l2-smoke 105/105, invocation-inventory 213/213,
  docs-code-sync.test 36/36, bkit-full-system 36 (version pending bump).

## 4. Verdict

Check gate M1 (matchRate ≥ 90) satisfied at 100%. No critical issues (M3=0).
Ready for QA phase (live `claude -p` / `--plugin-dir .`) then Docs=Code sync +
version bump to v2.1.28.
