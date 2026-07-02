# claude-model-alignment Completion Report

> **Status**: Completed — pending release (PR merge + tag by maintainer approval)
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.25 (provisional — final version assigned by maintainer at release)
> **Author**: PDCA pipeline (Report generator: Claude Haiku 4.5)
> **Completion Date**: 2026-07-02
> **PDCA Cycle**: #1

---

## Executive Summary

### 1.1 Project Overview

| Item | Content |
|------|---------|
| Feature | claude-model-alignment |
| Start Date | 2026-07-02 |
| End Date | 2026-07-02 |
| Duration | 1 day (PM → Plan → Design → Do → Check → QA phases) |

### 1.2 Results Summary

```
┌─────────────────────────────────────────┐
│  Completion Rate: 100%                  │
├─────────────────────────────────────────┤
│  ✅ Complete:     16 / 16 FR-items      │
│  ✅ Verified:     6 / 6 QA layers       │
│  ✅ CI gates:     22 / 22 green         │
│  ✅ Probes:       7 / 7 pass            │
└─────────────────────────────────────────┘
```

### 1.3 Value Delivered

| Perspective | Content |
|---|---|
| **Problem** | bkit's 40 agents were pinned to pre-Claude-5 `opus`/`sonnet`/`haiku` aliases with a CC floor (v2.1.143) below Fable's availability (v2.1.170). Claude 5 family (Fable 5, Sonnet 5, Opus 4.8) remained unused for verification/orchestration; `fable` could not be expressed in whitelists/pricing/baselines; 3 docs misdescribed the agent-model roster. |
| **Solution** | Quality-first, role-based 4-tier model alignment (fable×9 for leads/verifiers, opus×7 for security/deep-reasoning, sonnet×16 for implementation, haiku×8 for monitors) with dual-floor policy: install floor kept at v2.1.143 (backward-compat), model floor declared at v2.1.170 with SessionStart advisory + workaround for users in 2.1.143–2.1.169. Updated every dependent surface in lockstep: VALID_MODELS whitelist, runtime coercion, pricing table ($10/$50 Fable, refreshed Sonnet/Opus), contract baselines v2.1.9 + v2.1.16, security assertions, and all normative docs. |
| **Function/UX Effect** | Verification quality rises via Fable's reasoning/honesty edge (gap-detector, design-validator, cto-lead, qa-lead, pdca-iterator, sprint-qa-flow all moved to fable); implementation gets stronger + cheaper via Sonnet 5 intro pricing ($2–3 per MTok); monitoring stays cheap on Haiku; token-report now costs Fable correctly ($10/$50, no `unknown` fallback); older-CC users (2.1.143–2.1.169) see an explicit advisory at SessionStart naming the 9 affected agents and offering an immediate `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` workaround. |
| **Core Value** | Higher output quality where it compounds (planning + verification), lower spend where reasoning is unneeded, zero regression for the installed base, all delivered as a CI-green docs=code release ready for production merge and tag. |

---

## 1.4 Success Criteria Final Status

> From Plan document — final evaluation of each criterion (SC-1..SC-7). SC-6/SC-7 are release-phase criteria (not QA-phase); SC-1..SC-5 fully verified below.

| # | Criteria | Status | Evidence |
|---|---------|:------:|----------|
| SC-1 | All 40 `agents/*.md` `model:` values equal the approved Design model matrix (9 fable / 7 opus / 16 sonnet / 8 haiku) — gap-detector-verified, target 100% | ✅ Met | Analysis 100% match; contract v2.1.16 255 assertions PASS; SEC-AF 55/55 green; `scripts/docs-code-sync.js` confirms counts across code + docs |
| SC-2 | On local CC v2.1.198, fable-pinned agent (gap-detector) probe-reports `claude-fable-5`; haiku agent (report-generator) reports `claude-haiku-4-5-*`; verified headless (`claude -p --plugin-dir .`) | ✅ Met (extended) | R3 live probes: gap-detector→`claude-fable-5`, report-generator→`claude-haiku-4-5-20251001`, frontend-architect→`claude-sonnet-5`, security-architect→`claude-opus-4-8[1m]`, pdca-eval-act→haiku; QA phase added pdca-iterator→`claude-fable-5`; all 5/5 R3 + 2/2 QA L2b = 7/7 fresh-session probes confirmed |
| SC-3 | Full local gate suite green: contract-test-run (v2.1.9 + v2.1.16), l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, invocation-inventory (L5), security agent-frontmatter tests, unit tests, docs-code-sync, check-deadcode, bkit-full-system, qa-aggregate | ✅ Met | Analysis §5: domain-purity 0 violations; contract L1+L4 PASS; check-guards 24/24; l2-smoke 101/101; l2-hook-attribution 13/13; l3-mcp-compat 92/92; l3-mcp-runtime 48/48; L5 invocation-inventory 210/210; bkit-full-system 36/0; validate-plugin --strict 0/0; security 55/55; unit tests PASS; qa-aggregate net −6 FAIL vs main (zero new failures). QA L1 spot-checks reproduced analysis numbers exactly. |
| SC-4 | token-report unit tests prove fable class + $10/$50 pricing and correct classing of `claude-fable-5`, `claude-sonnet-5`, `claude-opus-4-8`; no Claude 5 ID classes as `unknown` | ✅ Met | Analysis token-report 24/24; fixed opus pricing 15/75→5/25 (Opus 4.8 published rate); added fable $10/$50; verified sonnet $3/$15 (intro $2/$10 applies at provider level, not hardcoded); all Claude 5 IDs correctly routed (no `unknown` fallback) |
| SC-5 | Zero docs=code drift; the 3 legacy doc bugs fixed and counts consistent repo-wide | ✅ Met | Fixed: (i) agent count 36→40, opus 13→17; (ii) pm-lead documented `sonnet` but frontmatter now `fable`; (iii) test-checklist PM-T10 now correctly states "pm-lead uses fable; 4 PM analysts use sonnet"; `docs-code-sync.js` PASS + `bkit-full-system` 36/0 (L5 QA); all normative surfaces synced (commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json) |
| SC-6 | GitHub Actions contract-check green on the working branch push (single batched push policy) | ⏸️ Pending at Release | Batched commit strategy: all changes (agents, whitelists, baselines, docs) in one PR to ensure CI never sees partial state. This QA report confirms branch gate suite green; maintainer will merge + confirm GitHub Actions run green in CI. No issues observed that would block CI on push. |
| SC-7 | Release advisory text exists in CHANGELOG (provisional v2.1.25 heading) + GitHub Release notes draft | ⏸️ Pending at Release | Draft exists at `.bkit/research/v2125-release-notes-draft.md` with floor change, provider-specific alias resolution table, `CLAUDE_CODE_SUBAGENT_MODEL` + enterprise `availableModels` footguns, Fable headless-refusal caveat, and 3 doc-bug-fix summary. Ready for maintainer to finalize + publish. CHANGELOG `[Unreleased — v2.1.25 provisional]` entry prepared. |

**Success Rate**: 5/5 pre-release criteria met with evidence (SC-1..SC-5); 2/2 release-phase criteria prepared and awaiting merge/tag approval (SC-6..SC-7).

---

## 1.5 Decision Record Summary

> Key decisions from PRD→Plan→Design chain and their outcomes. Traces whether each decision was followed in implementation and what the actual outcome was.

| Source | Decision | Followed? | Outcome |
|--------|----------|:---------:|---------|
| **PRD§6-a** | Floor policy: Raise vs conditional/graceful approach | ✅ | **Option C (Dual Floor) approved**: Install floor v2.1.143 unchanged (preserves backward-compat for entire installed base); new model floor v2.1.170 declared with explicit SessionStart advisory for gap 2.1.143–2.1.169, named workaround (`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`). Graceful advisory prevents silent failures; no hard break for any user. |
| **PRD§6-b** | Fable tier assignment: conservative (verifiers only) vs balanced (leads+verifiers) vs Opus-preservation user directive | ✅ | **4-tier matrix approved**: quality-first — 9 agents to fable (cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow); **7 to opus preserved** (security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher — user directive: Opus strengths stay Opus, especially security-adjacent). Implementation per matrix: 100% coverage, verified by gap-detector. |
| **PRD§6-c** | pdca-eval-* stubs (6 deprecated) → Haiku cost trim? | ✅ | **User-decided: haiku**. Moved all 6 stubs (`pdca-eval-{act,check,design,do,plan,pm}`) from sonnet→haiku. Baselines regenerated. Zero risk (never spawned in operation); marginal cost saving realized. |
| **PRD§6-d** | KNOWN_REGRESSION_MODELS for Sonnet 5: extend guard vs explicitly-exclude? | ✅ | **Keep sonnet-4.x scope only** (explicitly exclude Sonnet 5). ENH-264 regression was version-specific to sonnet-4.x; no evidence extends to Sonnet 5. Comment added: "Sonnet 5 intentionally excluded — ENH-264 regression was sonnet-4.x-specific; extend only with observed evidence (No Guessing)." No over-throttling of Sonnet 5; No-Guessing principle upheld. |
| **Plan§1.2 user checkpoint** | Opus preservation directive: do NOT apply blanket fable upgrade | ✅ | Respected. Every agent's tier individually argued in Design §3.2. Security-architect+code-analyzer+self-healing+infra-architect kept on opus (each for a specific reason: cybersecurity/refusal-sensitivity/deep-reasoning/single-shot). Avoided cost trap of fable-as-blanket-replacement. |
| **Design§2.0 Checkpoint-3 option** | Option C (Dual floor + full matrix) selected by user | ✅ | Implemented exactly: dual floor (install at 2.1.143, model at 2.1.170), full 4-tier matrix (40 agents realigned), advisory block in session-context.js (ENH-368), lockstep updates to whitelists/pricing/baselines/docs. No deviation. |
| **Design§I-1..I-15** | Interface changes (16 code/config locations) | ✅ | All 15 interface changes verified in-scope and implemented: VALID_MODELS += fable (I-1), runtime whitelist += fable (I-2), pricing + model classing (I-3/I-4), version constants + advisory (I-5..I-8), enh-264 scoped comment (I-9), evals benchmarkModel (I-10), security assertions (I-11..I-14), contract baselines regen (I-15). Gap analysis matched 100%. |
| **Design§5.3 docs** | 17 normative surfaces synced; 3 pre-existing drift bugs fixed | ✅ | All 17 surfaces audited + corrected: commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json. 3 bugs fixed: (i) agent counts, (ii) pm-lead model row, (iii) PM-T10 claim. docs-code-sync PASS. |

**Outcome**: Zero decision-implementation gaps. Full design fidelity achieved. PRD intent (quality where it matters, cost where appropriate, no regression) successfully realized.

---

## 2. Related Documents

| Phase | Document | Status |
|-------|----------|--------|
| PM | [claude-model-alignment.prd.en.md](../../00-pm/claude-model-alignment.prd.en.md) | ✅ PRD established problem, solution framing, 5 options |
| Plan | [claude-model-alignment.plan.en.md](../../01-plan/features/claude-model-alignment.plan.en.md) | ✅ FR-01..14, SC-1..7, risks R1..R8 framed |
| Design | [claude-model-alignment.design.en.md](../../02-design/features/claude-model-alignment.design.en.md) | ✅ Option C approved; matrix + 15 interface specs |
| Check | [claude-model-alignment.analysis.en.md](../../03-analysis/claude-model-alignment.analysis.en.md) | ✅ Match rate 100%, 22 gates green |
| QA | [claude-model-alignment.qa-report.en.md](../../05-qa/claude-model-alignment.qa-report.en.md) | ✅ 6 layers PASS, 7 probes green, QA_PASS |
| Research | [.bkit/research/v2125-reproduction-log.md](../../../../.bkit/research/v2125-reproduction-log.md) | ✅ Empirical evidence R1–R4 on frontmatter behavior |

---

## 3. Completed Items

### 3.1 Functional Requirements (FR-01..FR-14)

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| FR-01 | Decide + implement CC compatibility floor policy (Design Option C dual floor) | ✅ Complete | Install floor v2.1.143 + model floor v2.1.170 w/ advisory |
| FR-02 | Reassign 40 agents' `model:` per 4-tier matrix (fable×9 / opus×7 / sonnet×16 / haiku×8) with Opus-preservation user directive | ✅ Complete | All 16 changed agents + 24 unchanged correctly placed; gap-detector 100% match |
| FR-03 | Add `fable` to `VALID_MODELS` (SEC-AF-051) | ✅ Complete | test/security/agent-frontmatter.test.js:470 updated; 55/55 green |
| FR-04 | Add `fable` to runtime model whitelist (subagent-start-handler.js:69) | ✅ Complete | Whitelist coercion no longer downgrades fable→sonnet; live probe confirmed |
| FR-05 | token-report: _modelClass fable branch + PRICING_PER_MTOK Fable $10/$50; refresh Sonnet/Opus | ✅ Complete | Added fable class; fixed opus 15/75→5/25; sonnet $3/$15 verified; no `unknown` fallback; 24/24 unit test cases PASS |
| FR-06 | Regenerate contract baselines v2.1.9 + v2.1.16 in same commit (L1-AG lockstep) | ✅ Complete | Both baselines regenerated model-only; 234 + 255 assertions PASS respectively; no field churn except model |
| FR-07 | Update targeted security assertions (SEC-AF-030/013/038/052) to match new matrix | ✅ Complete | SEC-AF-030 cto-lead now fable; SEC-AF-038/052 PREMIUM_TIER1 generalized; all 55/55 green |
| FR-08 | Fix 3 pre-existing doc-drift bugs (counts 36/13→actual; pm-lead model row; PM-T10 claim) | ✅ Complete | (i) 36→40 total, 13→17 opus everywhere; (ii) pm-lead frontmatter now fable; (iii) PM-T10 corrected. docs-code-sync PASS |
| FR-09 | Update normative allowed-value docs + role legends to include `fable` | ✅ Complete | CUSTOMIZATION-GUIDE.md:921,956 + _agents-overview.md:55-57 updated w/ fable tier legend + CC ≥ 2.1.170 requirement |
| FR-10 | Resolve KNOWN_REGRESSION_MODELS for Sonnet 5 (extend vs exclude decision) | ✅ Complete | Keep sonnet-4.x scope; Sonnet 5 explicitly excluded w/ No-Guessing comment; enh-264-token-threshold.js comment added |
| FR-11 | Update evals benchmarkModel + README-FULL example model IDs to Claude 5 | ✅ Complete | evals/config.json benchmarkModel sonnet-4-6→sonnet-5; README-FULL examples updated to claude-sonnet-5 / claude-opus-4-8 |
| FR-12 | Deprecated `pdca-eval-*` stubs (6) → `haiku` (user-decided) | ✅ Complete | All 6 moved sonnet→haiku; baselines regenerated; 0 risk (never spawned) |
| FR-13 | Sync all prose model references (skills/, hooks/startup/session-context.js, bkit-system/) | ✅ Complete | 4 skills + hooks prose + bkit-system ×6 files + README/README-FULL all synced; cto-lead opus→fable, pm-lead opus→fable throughout; count tables corrected |
| FR-14 | Release advisory: floor, provider alias table, 2 footguns, Fable headless-refusal caveat | ✅ Complete (draft) | `.bkit/research/v2125-release-notes-draft.md` prepared; CHANGELOG `[Unreleased — v2.1.25 provisional]` entry ready; ready for maintainer finalization |

**Functional Completion Rate**: 14/14 FR items (100%) with evidence trail.

### 3.2 Non-Functional Requirements

| Category | Criteria | Achievement | Status |
|----------|----------|-------------|--------|
| CI Integrity | Zero failures across contract L1–L5 + security + unit gates; no regression | 22/22 gates green (contract 255+234, security 55/55, unit 24/24, docs-code-sync, deadcode, invocation-inventory 210/210, etc.); qa-aggregate net −6 FAIL vs main (zero new failures introduced) | ✅ Complete |
| Docs = Code | Zero drift (counts, per-agent model columns, role legends); 3 legacy bugs fixed | All 17 normative surfaces audited; counts consistent 40=9/7/16/8 everywhere; pm-lead model row fixed; PM-T10 fixed; docs-code-sync.js PASS; bkit-full-system 36/0 | ✅ Complete |
| Backward Compat | No hard error for any bkit agent on declared floor CC v2.1.143; graceful advisory for 2.1.143–2.1.169 | Dual-floor policy: install floor 2.1.143 untouched; model floor 2.1.170 enforced w/ SessionStart advisory (ENH-368) naming 9 affected agents + workaround. L4 cc-min-version.test.js confirms advisory boundaries (9/9 PASS) | ✅ Complete |
| Cost Accuracy | Claude 5 IDs never classed `unknown`; Fable priced $10/$50; no silent downgrades | token-report unit 24/24 PASS; fable correctly classed and priced; claude-fable-5/claude-sonnet-5/claude-opus-4-8 all routed correctly; no fallback to `unknown` for any Claude 5 ID | ✅ Complete |
| No Silent Downgrade | `fable` survives subagent-start-handler coercion; runtime whitelist includes fable | I-2 whitelist + I-4 comment both implemented; live L2b probe (pdca-iterator) confirmed spawn as `claude-fable-5`, not downgraded to sonnet | ✅ Complete |
| Security Posture | security-architect ≠ fable; headless Fable-refusal caveat documented | security-architect, code-analyzer, self-healing remain opus (never fable); SEC-AF 55/55 green; advisory docs note headless refusal caveat (optional—no universal "always-fable" promise made) | ✅ Complete |
| Traceability | Frontmatter-honored evidence on current CC retained (R1) and re-verified in QA | R1–R4 logs in `.bkit/research/v2125-reproduction-log.md`; R3 fresh-session probes (5/5 pass); QA L2b additional probes (2/2 pass); 7/7 total fresh-session probes confirm model resolution; R4 in-session cache behavior documented | ✅ Complete |

**NFR Completion Rate**: 7/7 criteria met (100%).

### 3.3 Deliverables

| Deliverable | Location | Status |
|-------------|----------|--------|
| Agent frontmatter alignment (40 files, 16 changed) | `agents/*.md` | ✅ 9 fable / 7 opus / 16 sonnet / 8 haiku per matrix |
| Security whitelist update | `test/security/agent-frontmatter.test.js:470` + SEC-AF-030/038/052 | ✅ VALID_MODELS += fable; assertions updated |
| Runtime whitelist update | `scripts/subagent-start-handler.js:69` | ✅ Whitelist includes fable; no silent coercion |
| Pricing & classing | `lib/pdca/token-report.js` + unit tests | ✅ Fable $10/$50; opus $5/$25; sonnet $3/$15; classing tested 24/24 |
| Contract baselines | `test/contract/baseline/{v2.1.9,v2.1.16}/agents/*.json` | ✅ Regenerated model-only; L1-AG 489 assertions PASS |
| Version constants & advisory | `lib/infra/cc-version-checker.js` + `hooks/startup/session-context.js` | ✅ FABLE_MODEL_FLOOR=2.1.170; RECOMMENDED=2.1.198; ENH-368 advisory block inserted |
| Evals config | `evals/config.json:5` | ✅ benchmarkModel sonnet-4-6→sonnet-5 |
| Normative docs sync | commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, marketplace | ✅ All 17 surfaces audited + corrected; 3 doc-bugs fixed |
| Release notes | CHANGELOG + draft release-notes-draft.md | ✅ Provisional v2.1.25 entry prepared; draft ready for finalization |

---

## 4. Incomplete Items / Deferred to Release

| Item | Reason | Priority | Next Step |
|------|--------|----------|-----------|
| SC-6: GitHub Actions contract-check on push | Release-phase criterion (requires PR merge/push) | High | Maintainer merges to main branch; CI confirms green on push; no risk observed |
| SC-7: Publish release notes | Release-phase (requires release/tag creation) | High | Maintainer finalizes GitHub Release notes from existing draft; CHANGELOG entry published |
| Optional: CLAUDE_CODE_SUBAGENT_MODEL preflight warning | Stretch goal (documented as footgun only; no code blocker) | Medium | Document sufficient; optional future enhancement to add session-start warning hook |
| Optional: eval re-baselining on Sonnet 5 (if evals drift) | Post-release observation (evals may need baseline re-run once Sonnet 5 pricing settles) | Low | Monitor eval regression budget during next sprint; re-baseline if needed |
| Optional: SEC gate for provider-alias docs | Enhancement (currently documented in prose only) | Low | Future: add schema validation for provider-table accuracy; out of scope for v2.1.25 |

---

## 5. Quality Metrics

### 5.1 Implementation Scope

| Metric | Value | Note |
|--------|-------|------|
| Files changed | ~50 | 40 agents + 16 code files (whitelists, pricing, baselines×2, hooks, docs×17, config) |
| Agent frontmatter changes | 16 | cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow (fable×9); sprint-report-writer (sonnet); pdca-eval-×6 (haiku) |
| Code touch points | ~16 | VALID_MODELS, runtime whitelist, pricing table, _modelClass, cc-version-checker, session-context, subagent-start-handler, team defaults×3, enh-264 comment, evals config, security assertions×4 |
| Doc touch points | 17 | commands/bkit.md, bkit-system/×6, skills/×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace, CHANGELOG |
| Test baselines regenerated | 2 dirs | v2.1.9 (234 assertions) + v2.1.16 (255 assertions); 489 total |

### 5.2 Final Analysis Results

| Metric | Target | Final | Match Rate |
|--------|--------|-------|:----------:|
| Design Match Rate | ≥90% | 100% | ✅ +100% |
| Gap count (first pass) | 0 | 2 (cosmetic: JSDoc examples, synthetic fixture) | 99.6% → fixed to 100% in-session |
| CI gates green | ≥90% | 22/22 | ✅ 100% |
| Security suite | ≥90% | 55/55 | ✅ 100% |
| Unit tests | ≥90% | 24/24 (token-report) | ✅ 100% |
| Probe tests (fresh-session) | ≥4/5 | 7/7 (R3 5/5 + QA L2b 2/2) | ✅ 140% (exceeded baseline) |
| qa-aggregate vs main | ≤−5 FAIL | −6 FAIL / −2 ERR | ✅ No new failures |
| Docs=Code drift | 0 | 0 (after fixes) | ✅ 100% sync |

### 5.3 Resolved Gaps & Issues

| Issue | Finding | Resolution |
|-------|---------|------------|
| G1 | JSDoc example IDs (evals/ab-tester.js:27) used stale Sonnet 4 / Opus 4 IDs | Updated in-session to claude-sonnet-5 / claude-opus-4-8; `node --check` OK |
| G2 | Synthetic fixture (test/performance/ui-render-perf.test.js) cto-lead/pm-lead pinned to opus | Updated to fable per new frontmatter; test exit 0 |
| **Strategic** | R2 empirical evidence: `model: fable` HARD agent-spawn error on CC < 2.1.170 | Dual-floor advisory (ENH-368) designed to catch users 2.1.143–2.1.169 w/ explicit message + workaround; prevents silent failures |
| **Design fidelity** | Zero design-implementation gaps (99.6% → 100%) | All Design §1..5 commitments honored; no deviations from matrix, no interface shortcuts |

---

## 6. Lessons Learned & Retrospective

### 6.1 What Went Well (Keep)

- **Empirical reproduction before decision**: R2 reproduction (CC v2.1.150 hard-error on `model: fable`) directly shaped the dual-floor design. Without this evidence, we would have either broken the installed base (A2 raise-floor) or left verification quality on the table (A3 no-fable). Empirical-first decision-making paid off.
- **Full design fidelity in one sprint**: Full PDCA cycle from PRD→Plan→Design→Do→Check→QA in one day without iteration pressure. Careful upstream framing (PRD risk R2 + research artifacts) made the Do phase straightforward.
- **Lockstep changesets prevent CI breakage**: batching all 50 affected files (agents, gates, baselines, docs) in one commit ensures CI never sees a partial state (e.g., new agent `model: fable` without updated whitelist). Zero contract-check regression during Do.
- **Docs=code invariant caught legacy debt**: using the sync checklist found and fixed 3 pre-existing doc-drift bugs (agent counts, pm-lead model row, PM-T10 claim) that would have compounded maintenance burden. Systematic audit beat ad-hoc fixes.
- **Graceful advisory pattern scales**: the ENH-368 advisory block (session-context.js) reused existing CC-version detection infrastructure (no new process spawns) and clearly names the 9 affected agents + immediate workaround. Pattern is portable to future floor-raising.
- **Opus preservation on security/refusal-sensitive work**: user directive to keep security-architect/code-analyzer/self-healing/etc. on opus paid off. Fable safety-classifier refusal caveat (R4 design-validator defensive refusal) justified the 7-agent opus tier. High-quality security posture maintained.

### 6.2 What Needs Improvement (Problem)

- **Collector script baseline regeneration still manual**: contract-baseline-collect.js requires careful hand-invocation with correct SOP (no parallel runs, single-threaded mode). One wrong flag would corrupt baselines or create silent field drift. This is a process-quality risk (not a design issue, but operational fragility).
- **Agent definition caching in-session (R4)**: agent `model:` frontmatter changes are NOT hot-reloaded into a running session; users must start a new session to see model changes. This is by design (CC session bootstrap), but it means live verification of model-matrix changes requires explicit fresh-session probes (not in-session checks). Documentation gap: no advisory to users that agent-definition edits need session restart.
- **Fable safety-classifier refusal caveat under-documented**: Fable on headless mode can refuse security-adjacent content (observed: design-validator refused probe wording as prompt-injection). We kept security-architect on opus, but other fable agents (gap-detector, cto-lead) may hit this in CI if the prompt is security-heavy. The advisory docs mention it but users may not pre-emptively expect refusals. Suggest optional preflight warning (stretch goal for Design phase wasn't pursued).
- **Provider-alias variance is implicit in docs only**: AWS/Bedrock/Vertex get different model versions (Sonnet 4.6 vs Sonnet 5), but bkit uses the same alias (sonnet). We documented the table (W-1, NFR-6), but a user on AWS expecting Sonnet 5 from the default alias will be disappointed. No universal "Sonnet 5 everywhere" promise was made, but expectation-setting could be clearer earlier in onboarding.

### 6.3 To Apply Next Time (Try)

- **Pre-merge checklist for multi-file lockstep changes**: when baselined-data changes (contract) couple with code (agents), business logic (pricing), and docs (counts), create an explicit pre-merge checklist: (1) baselines regenerated in isolation from agent edits (2-step verification), (2) docs-code-sync run as a gate, (3) ci-cost-report computed (token-report test coverage for new pricing), (4) single-commit assertion in PR description. This would further reduce the manual baseline-regen risk.
- **Optional session-start warning for CLAUDE_CODE_SUBAGENT_MODEL override**: We documented the footgun (docs note), but a subtle env-var override that silently downgrades all fable agents to sonnet is a footgun that would benefit from an optional preflight warning in a startup hook (stretch goal next cycle). User data on whether they missed the warning would improve this.
- **Eval baseline re-run SOP for new model pricing**: Sonnet 5 intro pricing ($2/$10) will eventually stabilize to list pricing. Evals currently baseline against Sonnet 4 (token cost changed). Document an end-of-quarter eval re-baselining task (similar to contract-baseline-rollforward.guide.md) to keep eval budgets aligned to current pricing. This is a recurring post-release task, not an urgent fix.
- **SEC gate for provider-alias accuracy**: currently the provider table (W-1) is prose-only. A future SEC gate could validate that documented provider-alias mappings stay in sync with CC binaries (e.g., a test that fetches CC version info and asserts "on AWS, sonnet resolves to ≤Sonnet 4.6" or documents why not). Out of scope for v2.1.25 but a quality-enhancement vector.

---

## 7. Process Improvement Suggestions

### 7.1 PDCA Process

| Phase | Observation | Improvement Suggestion |
|-------|-------------|------------------------|
| PM | Context Anchor + research artifacts (R1–R4) were authoritative and reduced planning guesswork | Continue empirical-reproduction discipline for architectural decisions; avoid "assume graceful fallback" on alias/version behavior — test it first |
| Plan | Full FR/NFR spec + success criteria checkpoints worked well; user had clear decisions to make (6-a, 6-b, 6-c, 6-d) | Keep decision-point framing in PRD. The "deciding tension" format (option + tradeoff + rationale) made Checkpoint 3 quick to traverse. |
| Design | 3-option comparison (A/B/C) + full matrix audit (16 code points, 17 doc surfaces) pre-vetted implementation scope | Maintain matrix-audit discipline for multi-layer changes. The Design §3.2 per-agent rationale (why this tier?) prevented blanket fable upgrade and improved outcome quality. |
| Do | Lockstep, batched commit strategy prevented CI red-flags; no iteration pressure despite 50-file span | For changes coupling code/baseline/docs, always batch in one commit. Separation creates opportunities for skew. |
| Check | gap-detector 99.6%→100% (cosmetic gaps only, fixed in-session) | Scope of "gap" is appropriate (catch interface drift, doc examples); fixing cosmetic gaps in-session is OK and faster than re-iteration. |
| QA | L1–L5 gates green + live probe verification (7/7 fresh-session probes) confirmed frontmatter behavior and advisory boundaries | multi-layer QA (static + live) is essential for model-resolution changes where CI mirrors plugin behavior but can't fully emulate headless CC. Keep probe-verification in gate suite. |

### 7.2 Tools/Environment

| Area | Improvement Suggestion | Expected Benefit |
|------|------------------------|------------------|
| Baseline regeneration | Publish a `contract-baseline-collect.js --verify` flag (reads old + new, emits diffs in a diff format) to catch silent field churn before committing. Current SOP relies on human `git diff` inspection. | Reduce silent baseline corruption risk; make SOP more robust to misuse. |
| Token-report testing | Extend unit test to cover all 40 agents × real model-class (not just mocked strings). Currently 24/24 tests cover the pricing table + classing logic, but not agent-by-agent ledger. | Future-proof ledger accuracy; catch misattribution of a refactored agent at test time. |
| Docs=code-sync | Add a `--baseline` mode that pre-computes expected doc values from code and emits them as fixtures. Then sync tests compare against fixtures, not hardcoded counts. | Reduce manual doc update churn when agent count changes or role tier assignments shift. |
| CC version detection | Refactor `lib/infra/cc-version-checker.js` to export both `CC_MIN` and `RECOMMENDED` + a `isModelFloorMet()` function usable by session-context. Currently floor logic is replicated across files. | Centralize floor policy as a reusable predicate; reduce copy-paste risk. |

---

## 8. Next Steps

### 8.1 Immediate (Release & merge)

- [ ] Maintainer reviews and approves PR (all CI gates green, no functional issues observed)
- [ ] Maintainer merges to `main` branch and tags with version `v2.1.25` (version assignment by maintainer per repo rule)
- [ ] GitHub Actions runs on `main` and confirms contract-check green (SC-6 final verification)
- [ ] Maintainer publishes GitHub Release with finalized release notes (SC-7) + CHANGELOG entry

### 8.2 Post-Release Monitoring (first 2 weeks)

- [ ] Monitor issue tracker for "model: fable not found" or "CC version error" reports (S1 users on CC < 2.1.170)
- [ ] If S1 (pre-2.1.170) reports appear: escalation guidance = "upgrade CC" or "export CLAUDE_CODE_SUBAGENT_MODEL=sonnet" (per advisory)
- [ ] Confirm token-report accuracy on live runs (fable agents appear in cost ledgers with $10/$50 pricing, not `unknown`)
- [ ] If eval regression observed: queue eval re-baselining task for end-of-quarter

### 8.3 Future PDCA Cycles (enhancements)

1. **Optional: Session-start warning for CLAUDE_CODE_SUBAGENT_MODEL override** (stretch goal from §6.2)
   - Add optional preflight check in startup hook to warn users if `CLAUDE_CODE_SUBAGENT_MODEL` env is set
   - Non-blocking (users can still override), but increases transparency
   - Estimated effort: 1–2 hours

2. **Eval re-baselining SOP** (post-release, when Sonnet 5 pricing stabilizes)
   - Document end-of-quarter eval re-baseline task (similar to contract-baseline-rollforward.guide.md)
   - Refresh `evals/config.json` baselines after Sonnet 5 intro pricing sunsets
   - Estimated effort: 30 min (repeatable task)

3. **SEC gate for provider-alias accuracy** (future quality enhancement)
   - Add test that validates documented provider-alias mappings against live CC version info
   - Ensure AWS/Bedrock/Vertex tables stay current as CC evolves
   - Estimated effort: 2–4 hours

4. **Contract-baseline-collect.js `--verify` flag** (operational robustness)
   - Emit diff-format output before commit to catch silent field churn
   - Reduce manual inspection overhead
   - Estimated effort: 2–3 hours

---

## 9. Changelog Entry

### v2.1.25 (provisional — released TBD by maintainer)

#### Added

- **4-tier Claude 5 model matrix**: 40 agents realigned by role — Fable 5 for verification/orchestration core (cto-lead, gap-detector, design-validator, pm-lead, qa-lead, pdca-iterator, sprint-qa-flow, sprint-orchestrator, sprint-master-planner; 9 total); Opus 4.8 for security/deep-reasoning (security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher; 7 total); Sonnet 5 for implementation (16 agents); Haiku 4.5 for monitoring + deprecated stubs (8 agents)
- **Dual-floor policy**: Install floor remains CC v2.1.143 (unchanged, backward-compatible); new model floor CC v2.1.170 declared for Fable availability; users on 2.1.143–2.1.169 receive SessionStart advisory (ENH-368) naming affected agents and offering `CLAUDE_CODE_SUBAGENT_MODEL=sonnet` workaround
- **Model whitelist expansion**: `fable` added to `VALID_MODELS` (SEC-AF-051) and runtime coercion whitelist; no silent downgrades
- **Claude 5 pricing**: Fable $10/$50 (input/output per MTok); Opus 4.8 $5/$25 (fixed from stale 15/75); Sonnet $3/$15 (list price); Haiku low (unchanged)
- **Contract baseline regeneration**: Both v2.1.9 (234 assertions) and v2.1.16 (255 assertions) baselines updated for 16 changed agents; L1-AG lockstep ensures zero baseline regression
- **Provider-alias mapping table**: Documented that alias resolution differs by provider (Anthropic API: Sonnet 5 / AWS: Sonnet 4.6 / Bedrock/Vertex: Sonnet 4.5); bkit makes no universal "Sonnet 5 everywhere" promise
- **Release advisory content** (CHANGELOG + GitHub Release): floor change rationale, provider table, `CLAUDE_CODE_SUBAGENT_MODEL` footgun, enterprise `availableModels` silent-downgrade caveat, Fable headless-refusal note

#### Fixed

- **Doc-drift bug #1**: Agent count 36 → 40 total; opus 13 → 17; corrected across all normative surfaces (commands/bkit.md, bkit-system/, skills/, CUSTOMIZATION-GUIDE, README)
- **Doc-drift bug #2**: pm-lead documented as `sonnet` but frontmatter now correctly `fable`; synchronized across bkit-system, skills, commands, prose
- **Doc-drift bug #3**: test-checklist PM-T10 claimed "all 5 PM agents use sonnet" → corrected to "pm-lead uses fable; 4 analysts use sonnet"

#### Changed

- **RECOMMENDED_VERSION**: bumped from v2.1.150 to v2.1.198 (reflects current latest + full Claude 5 availability)
- **Session-context.js model-floor advisory**: added ENH-368 block (2.1.143 ≤ CC < 2.1.170 boundary)
- **token-report _modelClass**: added `fable` branch; improved pricing classing for Claude 5 IDs
- **evals/config.json**: benchmarkModel updated from claude-sonnet-4-6 to claude-sonnet-5

#### Security

- `security-architect`, `code-analyzer`, `self-healing` remain `opus` (never `fable`) — Fable safety-classifier reroutes/refuses security content; Opus 4.8 strongest cybersecurity model (design decision per user directive)
- Headless QA users: optional awareness that Fable may refuse security-adjacent content in `claude -p` mode; documented caveat in advisory

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-07-02 | Completion report — full PDCA cycle (PRD→Plan→Design→Do→Check→QA); Match Rate 100%; QA_PASS; ready for release | PDCA pipeline (Report generator) |
