# claude-model-alignment Design Document

> **Summary**: Dual-floor Claude 5 model alignment — 4-tier role-based model matrix (fable×9 / opus×7 / sonnet×16 / haiku×8) with install floor kept at CC v2.1.143 and a new model floor (v2.1.170) surfaced as a SessionStart advisory with a documented workaround.
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.25 (provisional)
> **Author**: PDCA pipeline
> **Date**: 2026-07-02
> **Status**: Approved (Checkpoint 3: Option C + matrix approved by user, 2026-07-02)
> **Planning Doc**: [claude-model-alignment.plan.en.md](../../01-plan/features/claude-model-alignment.plan.en.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkit's model designations predate the Claude 5 family; verification/orchestration agents run below the best available capability, and `fable` cannot even be expressed by bkit's whitelists/pricing/baselines. |
| **WHO** | bkit installers segmented by CC version (<2.1.170 / 2.1.170–196 / ≥2.1.197) and provider (Anthropic API vs AWS/Bedrock/Vertex); headless/CI users (`claude -p`). |
| **RISK** | `model: fable` is a HARD agent-spawn error on CC < 2.1.170 (reproduced, R2); contract L1-AG fails unless baselines regenerate in lockstep. |
| **SUCCESS** | All 40 agents resolve to intended models on CC ≥ floor (probe-verified); full CI suite green; zero docs=code drift incl. 3 legacy bugs fixed; graceful advisory below model floor. |
| **SCOPE** | agents/ frontmatter ×16 changed · security whitelist+assertions · contract baselines ×2 dirs · subagent-start-handler · token-report · enh-264 comment · evals config · floor constants + advisory · docs/skills/bkit-system prose. |

---

## 1. Overview

### 1.1 Design Goals

1. Every one of the 40 agents runs on the model class that best fits its role (quality-first for verification/orchestration, Opus preserved where Opus is strongest, cost-lean elsewhere).
2. Zero hard breakage for the installed base: install floor unchanged (v2.1.143); users on 2.1.143–2.1.169 get an explicit, actionable advisory instead of mystery spawn errors.
3. Every dependent surface moves in one lockstep commit: whitelists, runtime coercion, pricing, contract baselines, security assertions, docs.
4. Docs = Code: model counts/tables/legends are correct everywhere, including 3 pre-existing drift bugs.

### 1.2 Design Principles

- **No Guessing**: every tier assignment argued per-agent; KNOWN_REGRESSION_MODELS not extended without evidence; pricing verified against published numbers during Do.
- **Graceful degradation**: advisory + documented workaround (`CLAUDE_CODE_SUBAGENT_MODEL=sonnet`) below the model floor; never a silent failure.
- **Single Source of Truth**: `agents/*.md` frontmatter is the model SoT; tests/baselines/docs derive from it. `token-report.js` is the pricing SoT.

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Full floor raise | **Option C: Dual floor** |
|----------|:-:|:-:|:-:|
| **Approach** | Future-proof whitelists/pricing/docs only; 0 fable pins | Declare CC ≥ 2.1.170 required; full matrix | Install floor 2.1.143 kept + model floor 2.1.170 advisory; full matrix |
| **fable pins** | 0 | 9 | 9 |
| **New Files** | 0 | 0 | 0 |
| **Modified Files** | ~15 | ~45 | ~46 (adds advisory block) |
| **Complexity** | Low | Medium | Medium |
| **Maintainability** | Medium (policy debt) | High | High |
| **Effort** | Low | Medium | Medium |
| **Risk** | None (but no quality gain) | Installed-base churn | Low (graceful advisory) |
| **Recommendation** | Fallback | Clean but exclusionary | **Selected** |

**Selected**: **Option C** — **Rationale**: preserves installability for the entire existing base (the 2.1.143 floor exists for an unrelated reason — plugin-manifest `displayName` — and should not be conflated with model capability), while modern-CC users get the full quality benefit. The 9 fable-pinned agents hard-fail only on 2.1.143–2.1.169, and those users get a SessionStart advisory naming the agents, the required CC version, and an immediate workaround. (User-approved at Checkpoint 3, 2026-07-02.)

### 2.1 Component Diagram — model resolution & bkit touch points

```
CC subagent model resolution (per official docs, v2.1.196+ semantics):
  1. CLAUDE_CODE_SUBAGENT_MODEL (env)      ← footgun: overrides everything (docs only)
  2. Agent-tool per-invocation `model` param
  3. agents/<name>.md frontmatter `model:`  ← bkit SoT (this design changes 16 files)
  4. main conversation model

bkit surfaces reading/asserting the model value:
  frontmatter ──▶ contract-test-run.js L1-AG  ⇄  baselines v2.1.9 + v2.1.16 (regen)
             ──▶ agent-frontmatter.test.js (VALID_MODELS + SEC-AF-*)
  runtime hook: subagent-start-handler.js (whitelist coercion) ──▶ team state
  token ledger: unified-stop.js (model string) ──▶ token-report.js (_modelClass + pricing) ──▶ dashboards
  session start: session-context.js (CC version detect) ──▶ NEW model-floor advisory
  team defaults: state-writer.js / session-start.js (ctoAgent)
```

### 2.2 Data Flow

```
SessionStart → detect CC version
  ├─ < 2.1.143            → existing install-floor advisory (unchanged)
  ├─ ≥ 2.1.143 & < 2.1.170 → NEW model-floor advisory (9 fable agents named + workaround)
  └─ ≥ 2.1.170            → no advisory (fable OK; sonnet floats to Sonnet 5 from 2.1.197)
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| model-floor advisory (session-context.js) | `FABLE_MODEL_FLOOR` const (cc-version-checker.js) | Single floor constant, infra layer |
| contract L1-AG | baselines v2.1.9 + v2.1.16 | Regenerated via `contract-baseline-collect.js` (SOP: docs/06-guide/contract-baseline-rollforward.guide.md) |
| token-report pricing tests | PRICING_PER_MTOK | Updated in same commit |

---

## 3. Model Matrix (Data Model)

### 3.1 Tier Legend (4-tier taxonomy)

| Tier | Alias | Resolves to (Anthropic API) | Cost /MTok | Role class |
|------|-------|------------------------------|-----------|------------|
| Verification & Orchestration Core | `fable` | Claude Fable 5 (CC ≥ 2.1.170) | $10 / $50 | Long-horizon leads + design/gap verifiers — bkit's differentiation |
| Deep Reasoning & Security | `opus` | Opus 4.8 (CC ≥ 2.1.154) | $5 / $25 | Cybersecurity, refusal-sensitive headless paths, deep single-shot analysis at half Fable cost |
| Implementation | `sonnet` | Sonnet 5 (CC ≥ 2.1.197) | $3 / $15 (intro $2/$10) | Coding, analysis, synthesis workers |
| Monitor & Report | `haiku` | Haiku 4.5 | low | High-volume, low-reasoning + deprecated tombstones |

### 3.2 Full 40-Agent Matrix

**fable ×9** (changed from opus ×9):

| Agent | Old → New | Rationale |
|---|---|---|
| cto-lead | opus → **fable** | Long-horizon PDCA orchestration + delegation + self-checking = Fable's exact positioning |
| sprint-orchestrator | opus → **fable** | Multi-phase sprint lifecycle, longest-horizon agent in bkit |
| sprint-master-planner | opus → **fable** | Deep investigation + context-budgeted planning (master plan = highest-leverage artifact) |
| pm-lead | opus → **fable** | Orchestrates 4 PM agents; synthesis quality compounds downstream |
| qa-lead | opus → **fable** | Orchestrates 4-agent QA; verification judgment |
| gap-detector | opus → **fable** | THE verification core (match rate SSoT); Fable honesty/verification edge |
| design-validator | opus → **fable** | Spec verification; fresh-context verifier pattern |
| pdca-iterator | opus → **fable** | Evaluator-Optimizer long-horizon self-repair loop |
| sprint-qa-flow | opus → **fable** | 7-layer S1 dataFlow hop verification |

**opus ×7** (unchanged — Opus strengths preserved, user directive):

| Agent | Model | Rationale |
|---|---|---|
| security-architect | opus | Opus 4.8 strongest on cybersecurity; Fable safety-classifier reroutes/refuses security-adjacent work |
| code-analyzer | opus | Verifier BUT includes security scanning (refusal-sensitive) + deep single-shot analysis at half Fable cost |
| self-healing | opus | Headless-triggered (Sentry/Slack) — Fable non-interactive refusal risk unacceptable in auto-repair |
| infra-architect | opus | Deep single-shot infra reasoning; security-adjacent (IAM, network policy) |
| enterprise-expert | opus | CTO-level strategic single-shot depth; no long-horizon loop |
| bkit-impact-analyst | opus | Deep architecture impact analysis, single-shot |
| cc-version-researcher | opus | Deep research synthesis, single-shot |

**sonnet ×16** (1 changed):

| Agent | Old → New | Note |
|---|---|---|
| sprint-report-writer | opus → **sonnet** | KPI aggregation/report synthesis = implementation-class work; Sonnet 5 near-Opus at lower cost |
| bkend-expert, frontend-architect, pipeline-guide, pm-discovery, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-strategist, qa-test-generator, qa-test-planner, skill-needs-extractor, starter-guide | sonnet (unchanged) | Implementation/analysis workers; alias floats to Sonnet 5 on CC ≥ 2.1.197 |

**haiku ×8** (6 changed):

| Agent | Old → New | Note |
|---|---|---|
| pdca-eval-act, pdca-eval-check, pdca-eval-design, pdca-eval-do, pdca-eval-plan, pdca-eval-pm | sonnet → **haiku** | DEPRECATED tombstones (never spawned by design); minimum cost if accidentally spawned (user-decided) |
| qa-monitor, report-generator | haiku (unchanged) | Monitors/reporters per Anthropic cost guidance |

**Distribution**: total 40 = fable 9 / opus 7 / sonnet 16 / haiku 8. Active 34 (excl. 6 deprecated stubs) = fable 9 / opus 7 / sonnet 16 / haiku 2.

### 3.3 Derived defaults (team plumbing)

| Location | Old | New | Reason |
|---|---|---|---|
| lib/team/state-writer.js:46,173 (+ JSDoc 161,191) | `ctoAgent: 'opus'` | `'fable'` | Follows cto-lead frontmatter |
| hooks/session-start.js:155 | `'opus'` | `'fable'` | Same default, same reason |
| scripts/subagent-start-handler.js:83 | `'opus'` | `'fable'` | Same default, same reason |
| lib/team/state-writer.js:210 | teammate `'sonnet'` | unchanged | Workers stay sonnet |

---

## 4. Interface Changes (constants, whitelists, pricing)

### 4.1 Whitelists

| # | File:line | Old | New |
|---|---|---|---|
| I-1 | test/security/agent-frontmatter.test.js:470 | `VALID_MODELS = ['opus','sonnet','haiku']` | `['opus','sonnet','haiku','fable']` |
| I-2 | scripts/subagent-start-handler.js:69 | `['opus','sonnet','haiku'].includes(modelRaw)` | `['opus','sonnet','haiku','fable'].includes(modelRaw)` |

### 4.2 Pricing & model classing — lib/pdca/token-report.js

| # | Change | Detail |
|---|---|---|
| I-3 | `PRICING_PER_MTOK` | add `fable: { input: 10, output: 50 }`; **fix `opus: 15/75 → 5/25`** (Opus 4.8 published); verify `haiku` row against published Haiku 4.5 pricing during Do (update if confirmed different); `sonnet: 3/15` stays (list price); `unknown: 3/15` stays |
| I-4 | `_modelClass()` (:53-57) | add `includes('fable') → 'fable'` branch |

### 4.3 Version floor constants & advisory

| # | File | Change |
|---|---|---|
| I-5 | lib/infra/cc-version-checker.js:42 | `RECOMMENDED_VERSION '2.1.150' → '2.1.198'` (+ comment) |
| I-6 | lib/infra/cc-version-checker.js | add exported `FABLE_MODEL_FLOOR = '2.1.170'` (single const, infra layer) |
| I-7 | hooks/startup/session-context.js | NEW model-floor advisory: if `2.1.143 ≤ CC < 2.1.170`, emit warning naming the 9 fable agents, required CC ≥ 2.1.170, and workaround `export CLAUDE_CODE_SUBAGENT_MODEL=sonnet` (forces ALL subagents to sonnet — temporary). Reuses existing version-detection plumbing (detect once; no extra process spawn) |
| I-8 | hooks/startup/session-context.js:443 | stale "v2.1.123+/v2.1.140/v2.1.34~141" prose → current recommendation (v2.1.170 model floor, v2.1.198 recommended) |
| I-9 | lib/domain/guards/enh-264-token-threshold.js:20 | KEEP `['claude-sonnet-4-6','claude-sonnet-4-5']`; add comment: "Sonnet 5 intentionally excluded — ENH-264 regression was sonnet-4.x-specific; extend only with observed evidence (No Guessing)" |
| I-10 | evals/config.json:5 | `benchmarkModel: 'claude-sonnet-4-6' → 'claude-sonnet-5'` |

### 4.4 Security assertions — test/security/agent-frontmatter.test.js

| # | Assertion | Change |
|---|---|---|
| I-11 | SEC-AF-030 (:221-224) | `cto-lead.model === 'opus'` → `'fable'` |
| I-12 | SEC-AF-013 (:149-152) | `starter-guide.model === 'sonnet'` — unchanged (matrix keeps sonnet) |
| I-13 | SEC-AF-038 (:324-333) | OPUS_TIER1 concept generalizes to PREMIUM tier (opus|fable); update list/logic so fable-pinned verification-core agents are legitimate — preserve the test's intent (no accidental premium+high-effort on read-only agents) while allowlisting the approved matrix. Exact edit shaped by reading the test body during Do (Do MUST read full test first) |
| I-14 | SEC-AF-052 (:483-489) | read-only Tier-1 exceptions `['security-architect','design-validator']` → premium-model exceptions per matrix: `['security-architect' (opus), 'design-validator' (fable), 'gap-detector' (fable)]` (+ any other read-only fable agent found when reading the test) |

### 4.5 Contract baselines

| # | Change |
|---|---|
| I-15 | Regenerate `test/contract/baseline/v2.1.9/agents/*.json` AND `v2.1.16/agents/*.json` model fields for the 16 changed agents via `test/contract/scripts/contract-baseline-collect.js`, following `docs/06-guide/contract-baseline-rollforward.guide.md`. ONLY the `model` field may drift in this regen — diff must show no other field churn. Same commit as agent edits (L1-AG lockstep) |

---

## 5. Verification Checklist (gap-detector target — replaces UI checklist)

> Every item below is independently verifiable. Gap analysis measures this list.

### 5.1 Frontmatter (16 files changed, 24 unchanged)

- [ ] 9 agents `model: fable`: cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, gap-detector, design-validator, pdca-iterator, sprint-qa-flow
- [ ] 1 agent `model: sonnet`: sprint-report-writer
- [ ] 6 agents `model: haiku`: pdca-eval-{act,check,design,do,plan,pm}
- [ ] 7 opus agents UNCHANGED: security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher
- [ ] 15 sonnet + 2 haiku agents UNCHANGED (bkend-expert, frontend-architect, pipeline-guide, pm-discovery, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-strategist, qa-test-generator, qa-test-planner, skill-needs-extractor, starter-guide; qa-monitor, report-generator)

### 5.2 Code & tests

- [ ] I-1 … I-15 above (each individually checkable)
- [ ] test/unit/token-report.test.js: opus pricing assertion 15/75 → 5/25; NEW fable pricing test ($10/$50); NEW classing tests: `claude-fable-5`→fable, `claude-sonnet-5`→sonnet, `claude-opus-4-8`→opus; unknown-fallback test still passes
- [ ] No other test hardcodes broken (grep sweep for `'opus'`/`'sonnet'` assertions on changed agents — related+similar code rule)

### 5.3 Docs (normative surfaces)

- [ ] commands/bkit.md:145 header → "40 total (9 fable / 7 opus / 16 sonnet / 8 haiku)"; per-agent model column synced; pm-lead row bug fixed (was `sonnet`, actual now `fable`)
- [ ] bkit-system/components/agents/_agents-overview.md: role legend gains fable tier (:55-57); count table (:67-69) → 9/7/16/8; per-agent table (:92-122) synced incl. pm-lead fix
- [ ] bkit-system/README.md:214,375 counts → 40 total, 9/7/16/8 (34 active = 9/7/16/2)
- [ ] bkit-system/philosophy/context-engineering.md:159-161,168 + ai-native-principles.md:53,132-134 tables synced (cto-lead → fable)
- [ ] bkit-system/testing/test-checklist.md:399 PM-T10 → "pm-lead uses fable; 4 PM analysts use sonnet"
- [ ] bkit-system/scenarios/scenario-new-feature.md:210 "CTO Lead (opus)" → "(fable)"
- [ ] skills/pdca/SKILL.md:342,383-384 cto-lead (opus) → (fable); skills/pm-discovery/SKILL.md:46 PM Lead (opus) → (fable); skills/cc-version-analysis/SKILL.md:347-350 cto-lead row → fable (researcher/impact-analyst stay opus, report-generator stays haiku)
- [ ] hooks/startup/session-context.js:271,289 prose cto-lead (opus) → (fable)
- [ ] CUSTOMIZATION-GUIDE.md:921 `# or opus, haiku` → `# or opus, haiku, fable`; :956 allowed-values table += fable (with CC ≥ 2.1.170 note)
- [ ] README-FULL.md:595-598,610 mermaid pm-lead/cto-lead → (fable); :754,757 example IDs → `claude-opus-4-8`, `--modelA claude-sonnet-5 --modelB claude-opus-4-8`
- [ ] README.md:185 recommended → v2.1.198 + model-floor sentence (fable agents need CC ≥ 2.1.170; below that, advisory + workaround). Badge/requirement v2.1.143+ UNCHANGED
- [ ] .claude-plugin/marketplace.json descriptions: one added sentence re Claude 5 model matrix + model floor (keys untouched — ADR 0011 21-key whitelist)
- [ ] CHANGELOG.md: new provisional `[2.1.25]` entry (matrix, dual floor, pricing fix, footguns, 3 doc-bug fixes)
- [ ] skills/pdca-watch/SKILL.md:61 pricing prose consistent with token-report ($3/$15 sonnet — verify)

### 5.4 Reproduction / probe evidence (QA)

- [ ] `claude -p --plugin-dir .` probe: bkit gap-detector-class agent reports `claude-fable-5`; report-generator-class reports `claude-haiku-4-5-*`; frontend-architect-class reports Sonnet 5; security-architect-class reports Opus 4.8 (innocuous prompts to avoid classifier)
- [ ] R1/R2 logs retained in `.bkit/research/v2125-reproduction-log.md`

---

## 6. Error Handling (advisory & degradation spec)

| Condition | Behavior | Message essence (English) |
|---|---|---|
| CC < 2.1.143 | existing install-floor advisory (unchanged) | displayName schema requirement |
| 2.1.143 ≤ CC < 2.1.170 | NEW model-floor advisory at SessionStart | "bkit v2.1.25 pins 9 agents to Claude Fable 5, which requires CC ≥ v2.1.170. On this version those agents fail to spawn. Upgrade (`npm i -g @anthropic-ai/claude-code@latest`) or temporarily `export CLAUDE_CODE_SUBAGENT_MODEL=sonnet` (forces ALL subagents to sonnet)." |
| 2.1.170 ≤ CC < 2.1.197 | no advisory (fable OK; note: `sonnet` still resolves to Sonnet 4.6-era on those binaries) | optional info line in advisory only if trivially cheap |
| enterprise `availableModels` excludes fable/opus | CC-native graceful fallback to inherit (documented, no bkit code) | docs note |
| `CLAUDE_CODE_SUBAGENT_MODEL` set | overrides ALL pins (documented footgun) | docs note (CUSTOMIZATION-GUIDE + CHANGELOG) |

---

## 7. Security Considerations

- [ ] security-architect stays `opus` — never fable (safety-classifier reroute/refusal on security content; Opus 4.8 strongest cybersecurity)
- [ ] code-analyzer + self-healing stay `opus` for the same refusal-sensitivity reason (headless paths)
- [ ] QA probes use innocuous prompts (avoid first-request CLAUDE.md/git-heavy context for fable agents in headless mode)
- [ ] No permission/auth surface touched; plugin.json keys untouched (ADR 0011)

---

## 8. Test Plan

### 8.1 Test Scope (mapped to bkit gates)

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1 | Frontmatter vs baselines (both dirs) + security suite + unit (token-report) | contract-test-run.js, node test runner | Do |
| L2 | Hook smoke + attribution (subagent-start-handler change) | l2-smoke, l2-hook-attribution | Do |
| L3 | MCP static + runtime (regression only) | l3-mcp-*.test.js | Do |
| L4 | Deprecation governance (pdca-eval-* stubs model change) | agent-deprecation.test.js | Do |
| L5 | Invocation inventory | invocation-inventory.test.js | Do |
| Release gates | docs-code-sync, check-deadcode, check-domain-purity, bkit-full-system, validate-plugin --strict, qa-aggregate | scripts | Do/Check |
| Probe smoke | live model resolution via `claude -p --plugin-dir .` | headless CC v2.1.198 | QA |

### 8.2 L1 scenarios

| # | Test | Expected |
|---|------|----------|
| 1 | contract-test-run --compare v2.1.9 --level L1,L4 | PASS after baseline regen |
| 2 | contract-test-run --compare v2.1.16 --level L1,L4 | PASS after baseline regen |
| 3 | agent-frontmatter.test.js full suite | PASS with VALID_MODELS+fable & updated SEC-AF-030/038/052 |
| 4 | token-report.test.js | PASS incl. new fable/claude-5 cases + corrected opus 5/25 |
| 5 | Negative: an agent with `model: fable5` (typo) | SEC-AF-051 FAILS (whitelist still strict) |

### 8.3 Probe scenarios (QA phase)

| # | Agent (via --plugin-dir .) | Expected model report |
|---|---|---|
| 1 | gap-detector | claude-fable-5 |
| 2 | report-generator | claude-haiku-4-5-* |
| 3 | frontend-architect | Sonnet 5 ID |
| 4 | security-architect | claude-opus-4-8* |
| 5 | pdca-eval-act (tombstone) | claude-haiku-4-5-* |

### 8.4 Seed Data — N/A (no DB). Baseline JSONs are the "fixtures"; regen via collector script only.

---

## 9. Clean Architecture

### 9.1 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| Agent model pins | Config/Presentation | `agents/*.md` |
| FABLE_MODEL_FLOOR + RECOMMENDED_VERSION | Infrastructure | `lib/infra/cc-version-checker.js` |
| Model-floor advisory | Adapter (hook) | `hooks/startup/session-context.js` |
| Pricing/classing | Application | `lib/pdca/token-report.js` |
| Regression guard comment | Domain | `lib/domain/guards/enh-264-token-threshold.js` |
| Runtime whitelist | Adapter (hook script) | `scripts/subagent-start-handler.js` |
| Team defaults | Application | `lib/team/state-writer.js` |

### 9.2 Dependency Rules

`session-context.js` (adapter) may import `lib/infra/cc-version-checker.js` (already does for CC_MIN advisory pattern). Domain guard gets a comment only — no new imports. check-domain-purity must stay green.

---

## 10. Coding Convention Reference

- English-only code/comments/docs (docs/ bilingual pairs excepted); no version bump in `.claude-plugin/plugin.json`.
- Comment style: follow existing ENH-XXX annotation convention (e.g., tag advisory block `ENH-33x (v2.1.25)` — pick next free ENH number by checking CHANGELOG during Do; do not guess).
- Baseline regen: ONLY via collector script; hand-editing baseline JSONs is forbidden (SOP).

---

## 11. Implementation Guide

### 11.1 File Structure (no new runtime files; 1 advisory block added to existing hook)

### 11.2 Implementation Order

1. [ ] Module 1 — agents + gates (SoT first)
2. [ ] Module 2 — runtime/lib plumbing
3. [ ] Module 3 — floor constants + advisory
4. [ ] Module 4 — docs sync + CHANGELOG
5. [ ] Full local gate suite → Check (gap analysis) → QA probes

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Agents & CI gates | `module-1` | 16 frontmatter edits + VALID_MODELS + SEC-AF-030/038/052 + baseline regen ×2 dirs | 15-20 |
| Runtime & lib | `module-2` | subagent-start-handler (I-2, :83), state-writer, session-start.js:155, token-report + unit tests, enh-264 comment, evals config | 10-15 |
| Floor & advisory | `module-3` | cc-version-checker (I-5, I-6), session-context advisory (I-7, I-8) + prose :271,289 | 10-15 |
| Docs sync | `module-4` | commands/bkit.md, bkit-system ×6 files, skills ×4, CUSTOMIZATION-GUIDE, README, README-FULL, marketplace.json, CHANGELOG | 15-20 |

#### Recommended Session Plan

Single session via `/pdca team` (4 modules parallelizable by specialist agents; sequential dispatch). If context runs low, split after module-2 (state persisted in Task Management + memory + this doc).

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial draft — Option C + full matrix approved (Checkpoint 3) | PDCA pipeline |
