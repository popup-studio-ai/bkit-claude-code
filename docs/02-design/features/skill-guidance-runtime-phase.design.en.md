# Design — Runtime-Phase-Aware Skill Guidance (Issue #135, v2.1.28)

> Feature: `skill-guidance-runtime-phase` · Chosen approach: runtime phase
> resolution (fundamental, SSoT-unified) · New code English, guidance strings
> language-aware (EN/KO).

## 1. Architecture decision

Keep `orchestrateSkillPost()` a **pure frontmatter resolver** (its documented
role). Add runtime-state resolution one tier up, in the orchestrator glue
`lib/orchestrator/skill-invocation-effects.js#runSkillInvocationEffects` — the
single chokepoint both invocation paths already share, which already imports
`getPdcaStatusFull`. This is exactly where the issue's suggested fix #1 points.

```
runSkillInvocationEffects (effects.js)
  ├─ orchestrateSkillPost(name, {}, {args})  → suggestions (frontmatter)   [unchanged]
  ├─ if suggestions is EMPTY and name is a guidance-eligible router:
  │     suggestions = resolveRuntimeGuidance(name, args)   ← NEW           [runtime]
  └─ formatGuidance(suggestions) → stdout                                   [unchanged]
```

**Why not inside `orchestrateSkillPost`**: that module is a low-tier frontmatter
loader with no dependency on live PDCA/Sprint state. Pulling `lib/pdca/automation`
+ status into it would invert the layering and risk a require cycle. The
orchestrator tier is the correct home for state-aware enrichment.

## 2. New module: `lib/orchestrator/runtime-guidance.js`

Single export `resolveRuntimeGuidance(skillName, args)` → `suggestions` object
(`{}` when nothing to suggest). Pure composition over existing SSoT; fail-open.

### 2.1 Guidance-eligible set

```js
const GUIDANCE_ELIGIBLE = new Set(['pdca', 'sprint']);
```

Only bkit's two flagship orchestrators. The other 9 both-null router skills
(`audit, control, rollback, bkit-evals, bkit-explore, claude-code-learning,
pdca-batch, pdca-fast-track, pdca-watch`) are pure utilities with no linear
"next PDCA step"; silence there is correct behavior, not a bug (documented).

### 2.2 PDCA resolution (reuses the manual `/pdca next` SSoT)

```
phase =
  args.action ∈ {pm,plan,design,do,check,act,qa,report}  → args.action
  args.action ∈ {next,status,iterate,analyze} or absent   → live status phase
feature = args.feature || getPdcaStatusFull().currentFeature
next   = getNextPdcaActionAfterCompletion(phase, feature)   // automation.js SSoT
         → { nextPhase, command }                            // e.g. "/pdca design login"
suggestions.nextSkill      = { name: strip('/', command), message: L(nextPhase) }
suggestions.suggestedAgent = AGENT_BY_PHASE[phase]           // superset of existing
```

`getNextPdcaActionAfterCompletion` already encodes the conditional branches
(`check → qa` when matchRate ≥ 100 else `act`; `qa → report` when qaPassRate ≥ 95
else `act`) against live status — reused verbatim, no duplication.

`AGENT_BY_PHASE` extends the existing hardcoded pair without changing it:
`{ do: 'gap-detector', check: 'pdca-iterator' }` (unchanged) `+ { design:
'design-validator', qa: 'qa-lead' }` (additive, only where an agent genuinely
helps). Absent phases → no agent (guidance still carries the `nextSkill`).

### 2.3 Sprint resolution

Resolve current sprint phase from the Sprint SSoT (`lib/sprint` phase order /
`sprint-status.json`); suggest the next phase's `/sprint <phase>` command.
When no active sprint or no next phase → `{}` (fail-open).

### 2.4 Language-aware strings

```js
const lang = safeReadLanguage();           // lib/i18n/detector.readLanguage(), 'en' default
const L = (phaseKey) => GUIDANCE_MSG[lang]?.[phaseKey] ?? GUIDANCE_MSG.en[phaseKey];
```

`GUIDANCE_MSG` is a co-located `{ en: {...}, ko: {...} }` map (English authored
first). This satisfies "new code English + existing strings language-aware"
without polluting the error-focused `assets/error-dict.*.json`.

## 3. Touch points

| File | Change |
|---|---|
| `lib/orchestrator/runtime-guidance.js` | **NEW** — `resolveRuntimeGuidance` + maps |
| `lib/orchestrator/skill-invocation-effects.js` | after line 115, enrich empty `suggestions` via runtime-guidance (guarded, fail-open) |
| `lib/skill-orchestrator.js` | **unchanged** (frontmatter role preserved) |
| `lib/pdca/automation.js`, `lib/pdca/phase.js` | **reused**, not modified |
| existing Korean strings (`getNextStepMessage`, `suggestedMessage`) | migrate to language-aware via same `GUIDANCE_MSG`/detector (related-area sweep, Task #4) |

## 4. Invariants / non-regression

1. `orchestrateSkillPost` behavior byte-identical for all frontmatter-resolving
   skills (deploy/code-review/plan-plus/cc-version-analysis/dynamic/...).
2. Runtime path runs **only** when frontmatter produced nothing (`suggestions`
   empty) AND skill ∈ `GUIDANCE_ELIGIBLE`.
3. Any error in resolution → caught → `{}` → no guidance (fail-open contract of
   both hook handlers preserved).
4. No new phase-order/transition table — SSoT reuse only.
5. Dedup key in `runSkillInvocationEffects` still prevents MODEL+SLASH double-emit.

## 5. Test plan (Check phase)

- Unit: `resolveRuntimeGuidance('pdca', {action:'plan',feature:'x'})` → nextSkill
  points to design; `check` branches on matchRate; `sprint` next-phase; utility
  skill → `{}`; missing status → `{}`.
- Integration: `runSkillInvocationEffects('pdca', {action:'plan'}, ...)` returns
  non-empty suggestions; `deploy` unchanged.
- Regression: full `test/run-all.js` green.
- Language: EN default, KO when persisted language is `ko`.
