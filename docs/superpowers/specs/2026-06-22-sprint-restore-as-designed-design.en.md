# Sprint System — Restore-As-Designed Fix

**Version:** 1.0.0
**Date:** 2026-06-22
**Status:** Approved (pending spec review)
**Purpose:** Close the gap between the bkit Sprint system's documented design (v2.1.11–v2.1.22) and its actual implementation, so the full 8-phase lifecycle operates end-to-end as designed — with no manual JSON editing and no silent no-ops.

**Companion investigation reports (in `work/sprint-investigation/`):**
- [gate-measurement-findings.md](../../../work/sprint-investigation/gate-measurement-findings.md) — Issues #1, #4, #5
- [feature-registration-and-approve-findings.md](../../../work/sprint-investigation/feature-registration-and-approve-findings.md) — Issues #2, #3
- [intended-design-map.md](../../../work/sprint-investigation/intended-design-map.md) — as-designed reference
- [actual-implementation-map.md](../../../work/sprint-investigation/actual-implementation-map.md) — as-built reference
- [cluster-f-classification.md](../../../work/sprint-investigation/cluster-f-classification.md) — designed-vs-deferred verdicts
- [dead-code-and-stubs.inventory.md](../../../work/sprint-investigation/dead-code-and-stubs.inventory.md) — dead-code/stub inventory
- [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md) — explicitly excluded items

---

## 1. Goal, Scope, and the As-Designed Contract

### Goal
Complete the Sprint system to the full design vision committed to across v2.1.11–v2.1.22 (ADRs, design docs, PRDs, templates, contract tests). Prior agents left a documented gap between spec and implementation; this effort closes it.

### Scope principle (the line that prevents scope creep)
- **IN scope** = anything the design committed to (ADR decision, design-doc section, PRD requirement, contract test expectation) but a prior agent never implemented.
- **OUT of scope** = anything the design explicitly deferred as future/optional/user-defined, or non-lifecycle library surface. See [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md).

### In scope — six clusters
| Cluster | What | Source |
|---|---|---|
| **A. Dispatcher wiring** | Construct + inject `agentTaskRunner`; route into measure/phase paths | Reported #1, #4, #5-partial |
| **B. M8 chicken-and-egg** | M8 measures plan's design section at plan-exit | Reported #5 |
| **C. Feature tracking** | Populate `featureMap`; fix `completion` typedef; S2 compute; `feature add` writes featureMap | Reported #2 |
| **D. Second-order gate traps** | auto-pause inspects all gates; `defaultGapDetector` no longer fakes 100; archive gate logic | Big-picture map |
| **E. Docs** | `--approve` warning surfaced; `gate_fail` hint; reconcile SCOPE/trust tables | Reported #3 |
| **F. Designed-but-unimplemented completion** | The designed-but-skipped items + newly-discovered reachable defects | "Complete their job" |

### Explicitly OUT of scope (design-deferred, not incomplete)
- **S3_velocity** — spec marks user-defined/optional (Master Plan §3.7/§12.1; v2113-Sprint-2 §3.3:349).
- **M6/M9** — explicitly excluded ("미포함... deferred", v2113-Sprint-2 §3.3:349). Appear in zero sprint templates (only in `lib/quality/metrics-collector.js` specs).
- **Orphaned library surface** — `recommendSprintSplit`, `contextSizer`, `syncApiContract`, `syncTestCoverage`, `MatrixSync.clear`, `DocScanner.hasPhaseDoc`. Non-lifecycle; candidates for a separate hygiene pass.
- **Dead placeholder state fields** — `dashboardMode`, `manual`, `qaPassRate` (legacy fallback only), `sprintCycleHours`, `sprint.docs.*`. No design commits to populating them.
- **Test-only scaffolding** — `inMemoryStore`, `noopEmitter`. Correct test fallbacks, not defects.

Full evidence: [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md).

### Non-negotiable success criterion
A real sprint run entirely via the CLI — `init → start → phase advances through all 8 → measure → iterate → qa → report → archive` — measures every active gate against a real artifact, tracks real feature completion, writes a real report file, persists all gate scores to state, pauses on real failures, and requires **zero manual JSON editing**. Every gate in the active matrix must be either measurable or explicitly exempted by design.

---

## 2. Architecture & the Dependency-Injection Fix (Cluster A)

The codebase already follows hexagonal architecture correctly. The bug is purely at the composition root.

### Current (broken) flow
```
CLI → handleSprintAction(action, flags, {})        ← literal {} at scripts/sprint-handler.js:252
     → wireAgentAdapters({})                        ← no runner → no adapters auto-created
       → handleMeasure receives infra only, no agentTaskRunner
         → measure-router sees deps.agentTaskRunner undefined
           → returns { reason: 'no_agent_runner' }
```

### Fixed flow
```
CLI → construct agentTaskRunner = ({ subagent_type, prompt }) => <Task tool wrapper>
     → handleSprintAction(action, flags, { agentTaskRunner })
       → wireAgentAdapters sees runner → auto-creates gapDetector, autoFixer, dataFlowValidator
       → handleMeasure AND handlePhase receive the runner (currently only iterate/qa do)
         → measure-router dispatches the sub-agent → real measurement
```

### Changes (composition/wiring layer only)
1. **Construct the runner at the CLI boundary** (`scripts/sprint-handler.js`). Wraps the host's Task-tool capability into the `({ subagent_type, prompt }) => Promise<{ output }>` shape the domain expects. The only place that knows about the host environment — preserves domain purity.
2. **Extend `wireAgentAdapters` to route the runner into the measure and phase paths**, not just iterate/qa.
3. **Update the contract test** ([tests/qa/v2116-sprint-measure-command.test.js:242](../../../tests/qa/v2116-sprint-measure-command.test.js)) to assert that an injected runner produces a real measurement. The empty-deps → `no_agent_runner` guard stays as a separate assertion (still correct under that condition), but the primary contract becomes "runner injected → measurement succeeds."

### Design constraint
The domain stays pure: `measure-router.js`, use cases, and the entity never import host-specific code. The runner is always injected via `deps`; the composition root now actually constructs and passes it. Unit tests that inject deps directly continue to pass unchanged — only the CLI integration path and the contract test change.

**Why A is the keystone:** every other cluster depends on a working measurement path. D's auto-pause fix, F's M5/M10 routes, S1 persistence — none verifiable until the runner flows end-to-end.

---

## 3. Gate Measurement Completeness (Clusters B, D, F-gates)

Makes the gate matrix actually measurable and enforced as designed.

### Core problem
Today `ACTIVE_GATES_BY_PHASE` requires gates with no measurement route (M5, M10, S2, S4), and auto-pause inspects only 2 of ~10 gates. Even with the runner fixed, phase exits would fail or silently pass for the wrong reasons.

### Changes
**3.1 — M8 chicken-and-egg (Cluster B).** At plan-exit, M8 measures the **plan document's** design-completeness (the design section the plan phase produces), not the not-yet-existing design doc. Change to M8's source-artifact resolution in `measure-router.js` and its prompt template. No phase reordering; linear `plan→design` stays.

**3.2 — M5 and M10 measurement routes (Cluster F-gates).** Active gates with designed routes never shipped:
- **M5_runtimeErrorRate** — designed route is qa-monitor live-log probe. Add M5 to `DEFAULT_QUALITY_GATES` (currently absent → `gate_slot_missing`), add a route dispatching qa-monitor against project logs. **When no log source exists (libraries, static sites), M5 returns `not_applicable` (exempted/passed).** When logs exist, the probe runs.
- **M10** — designed route is phaseHistory sum. Wire as a computed gate derived from sprint state (no sub-agent).

**3.3 — S2 compute path.** S2 (feature completion) is "computed" per the measure-router comment but the compute path doesn't exist. Derive from `featureMap` completion states: `S2 = count(features with completion >= threshold) / total features * 100` (ratio form; threshold defaults to 100).

**3.4 — S1 persistence (Cluster F, newly discovered).** `handleQA` ([sprint-handlers-core.js:318](../../../scripts/lib/sprint-handlers-core.js)) runs data-flow validation and writes the disk matrix but never writes `sprint.qualityGates.S1_dataFlowIntegrity`. Fix: persist the computed `s1Score` to the S1 slot.

**3.5 — Auto-pause trigger scope (Cluster D).** `auto-pause.js:39-40` inspects only M3 and S1. `QUALITY_GATE_FAIL` must inspect **all** gates in the current phase's active matrix — any `passed === false` fires the pause, with a reason string naming the failing gate(s).

**3.6 — S4_archiveReadiness (new, completes "no gate in limbo").** Defined as a checklist-derived score computed at archive time: report-completeness + all phase gates passed + carry-items resolved.

### Design constraint
After this section, every gate in `ACTIVE_GATES_BY_PHASE` is exactly one of: (a) sub-agent measurement route, (b) computed/derived gate (M10, S2, S4), or (c) `not_applicable` when its source is absent (M5 no-logs). Nothing is `UNSUPPORTED` with no path. Gate thresholds, definitions, phase ordering, and phase membership are unchanged — only *how* each gate gets measured and *which* gates trigger auto-pause.

---

## 4. Feature Tracking & State Persistence (Clusters C + F-state)

Makes `featureMap` real and fixes state-write gaps that silently dropped computed results.

### The chain that must hold end-to-end
`features[]` → `featureMap` populated → `completion` per feature → S2 computed → KPI `featuresCompleted` correct → report shows real completion. Today every link is broken.

### Changes
**4.1 — Populate `featureMap` on init and on `feature add`.** `featureMap` initialized `{}` at `entity.js:243`, nothing writes. Fix: `createSprint` and `handleFeature add` each write `featureMap[name]` from the `features[]` entry; `feature remove` deletes it. The two structures stay in sync by construction.

**4.2 — Fix the `completion` typedef gap.** `kpi-resolver.js:29` reads `f.completion`, but the typedef at `entity.js:83-85` declares `pdcaPhase/matchRate/qa`. `completion` is the as-designed shape (s3-polish ADR S3-004, PRD line 68, test TC-F3-4-K3). Add `completion` to `SprintFeatureMapEntry`.

**4.3 — Write `completion` as features progress.** Initialized `0` on registration, advanced as the feature's PDCA phase advances, set to `100` when its QA passes. Closes the design ambiguity (S2 depends on completion states; no writer was specified).

**4.4 — S2 compute path (ties to 3.3).** Ratio form: `count(completion >= threshold) / total * 100`, threshold default 100.

**4.5 — Persist computed-but-discarded results (Cluster F-state).** qa phase per-feature scores feed back into `featureMap[name]` (advances `completion` / sets `qa: 'pass'`). `handleReport`-computed `featureCompletionRate` writes to both the report and sprint KPI state.

**4.6 — `handleReport` file persistence (Cluster F).** `handleReport` passes `reportDeps={}` — no `fileWriter` — so `/sprint report` discards the rendered markdown. Inject the file writer so the report is written under `docs/04-report/`.

### Design constraint
`featureMap` and `features[]` are the twin sources of truth. `features[]` = declarative list (registered); `featureMap` = live state (progress/completion). They synchronize at registration and mutation. Nothing reads `features[]` for completion logic — only `featureMap`.

---

## 5. F-Remaining, State Correctness, and Docs (Clusters F-remaining + E)

### F-remaining (complete the prior agent's job)
**5.1 — `dataFlow` field (Tier-2 validator).** Committed in v2113-Sprint-5 design + SC-01 contract test as one of 12 Sprint entity keys. Add `sprint.dataFlow` to the typedef and a writer (qa phase populates `dataFlow[feature]` with 7-layer hop results). Makes `--static-matrix` mode work instead of returning `no_matrix_for_feature`.

**5.2 — `annotations` field.** Committed in v2.1.19 s1-foundation (PRD FR-5, plan D6/T2). Factory already writes it (`entity.js:248`); typedef missing. Add `annotations` to the `Sprint` typedef. Pure typedef completion.

**5.3 — skip-iterate `do→qa` path.** ADR 0008 Decision 2 + Master Plan §3.2: when `matchRate >= target` at do-exit, skip iterate and go to qa. `computeNextPhase('do')` hardcodes `→ iterate`; fix to honor matchRate — returns `qa` when do-exit M1 meets target, else `iterate`. The legal transition already exists in `transitions.js`.

**5.4 — Watch handler ghost matrix types (Cluster F, newly discovered).** `sprint-handlers-core.js:469` reads `'cumulative-state'`/`'feature-phase'` not in `MATRIX_TYPES`, so `/sprint watch` always reports null. **Resolve by checking the design first** (per user decision): add those types to `MATRIX_TYPES` if designed, or correct the handler to read real types. Implementation plan will determine which.

**5.5 — `handleMasterPlan` missing `taskCreator` + `EventEmitter.flush` (Cluster F).** `handleMasterPlan` never injects `taskCreator`; no CLI path calls `EventEmitter.flush` — telemetry/events may be lost on process exit. Inject the dependency; flush on CLI exit.

### Docs (Cluster E)
**5.6 — `--approve` warning surfaced.** Move the §10.1.1.1 clarification to the most-skimmed surfaces: §10.1 table row ([SKILL.md:173](../../../skills/sprint/SKILL.md)) gets a qualifier ("scope only; does NOT bypass gate failures"); help text ([sprint-handlers-admin.js:359](../../../scripts/lib/sprint-handlers-admin.js)) promotes the warning out of the 3-level-indented sub-bullet.

**5.7 — `gate_fail` hint field.** `gate_fail` return path (`advance-phase.usecase.js:169`) emits no remediation hint. Add a `hint` field pointing to `/sprint measure <id> --gate <failing-key>`.

**5.8 — Reconcile conflicting tables.** Three SPRINT_AUTORUN_SCOPE tables disagree (code vs SKILL.md vs guide/CHANGELOG); `commands/bkit.md:238` Trust Level table is wrong vs code. **Code is source of truth**; update docs to match. Fix the false `featureMap` claim in `skills/sprint/examples/multi-feature-sprint.md:11`.

### Design constraint
Docs follow code. Where they conflict, code wins; docs corrected to match. No behavioral changes just to satisfy a doc.

---

## 6. Slice Ordering, Testing, and Rollout

### Slice order (each independently-verifiable, own contract test)
| # | Slice | Depends on | Verifiable by |
|---|---|---|---|
| 1 | **Cluster A — dispatcher wiring** | nothing | `/sprint measure <id> --gate M3` returns a real measurement |
| 2 | **Section 3 — gate measurement completeness** | Slice 1 | every active gate returns a real score or `not_applicable`; auto-pause fires on any failing gate |
| 3 | **Section 4 — feature tracking & state persistence** | Slice 2 | a 3-feature sprint shows real S2/KPI numbers and writes a real report file |
| 4 | **Section 5 F-remaining** | Slice 3 | `--static-matrix` works; do→qa skip reachable; typedef complete |
| 5 | **Section 5 Docs (Cluster E)** | Slices 1-4 | docs match code; `gate_fail` returns a hint |

**Why this order:** Slice 1 is the keystone. Slice 2 immediately follows because unmeasurable-gate wall and auto-pause gaps become visible the moment the runner works. Slice 3 needs gates working to verify S2. Slice 4 completes the typedef/state surface now that the lifecycle exercises it. Docs last — they describe final behavior.

### Testing strategy
- **Contract tests updated (per user decision):** every test locking in broken behavior (the `no_agent_runner` assertion, S2=0, featureMap={}) gets updated to assert correct as-designed behavior.
- **Each slice adds one end-to-end test** proving the CLI path works.
- **One master E2E test** at the end: a real sprint `init → start → … → archive` via the CLI with zero manual JSON editing — the literal success criterion.

### Verification bar
After all slices, the master E2E test passes with no test injecting deps directly and no test hand-editing `.bkit/state/sprints/<id>.json`. The CLI path alone drives everything.

### Rollout / risk
- Each slice is a separate commit/PR-sized change — reviewable in isolation.
- Slices 1-2 highest-risk (composition root + gate model); Slices 3-5 progressively lower-risk.
- Contract-test updates are intentional (per user decision) and called out in commit messages.
- No architectural changes — hexagonal layering preserved. Every fix lives at the seam the design already specified.

### What this plan does NOT do
No new phases, no new gates beyond completing designed ones, no new agents, no domain-entity refactor beyond typedef completion, no changes to gate thresholds or phase ordering. It only closes the gap between the v2.1.11–v2.1.22 design and its implementation.

---

## Decisions Log

| # | Decision | Rationale |
|---|---|---|
| 1 | Scope = restore as-designed (not hardening, not gate-model rethink) | Close intent-vs-reality gap without inventing architecture |
| 2 | Update contract tests to match intent | Tests locked in bugs; intent was always that measurement works |
| 3 | M8 measures plan's design section at plan-exit | Matches linear plan→design transition; no phase reordering |
| 4 | Vertical slices per cluster (not one big PR, not minimal #1-#5) | Each slice closes a complete failure mode; avoids whack-a-mole |
| 5 | Cluster F (designed-but-unimplemented) IN scope | Per user: complete the prior agent's unfinished job |
| 6 | M5 returns `not_applicable` when no logs | General-purpose tool; libraries/static sites have no log source |
| 7 | Define S4 measurement now | Completes "no gate in limbo" guarantee |
| 8 | S2 = ratio (done/total), threshold default 100 | "Feature completion rate" = a feature is complete or it isn't |
| 9 | Watch ghost matrix types: check design first | Don't blindly drop; resolve against design intent |
| 10 | Docs follow code (code = source of truth) | Code is what runs; docs corrected to match |
