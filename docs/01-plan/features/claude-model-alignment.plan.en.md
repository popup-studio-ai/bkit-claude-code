# claude-model-alignment Planning Document

> **Summary**: Align every Claude model designation in bkit (40 agents, whitelists, pricing, contract baselines, docs) with the Claude 5 model family — Fable 5, Sonnet 5, Opus 4.8, Haiku 4.5 — without breaking users on older Claude Code.
>
> **Project**: bkit Vibecoding Kit (bkit-claude-code)
> **Version**: 2.1.25 (provisional — final version assigned by maintainer at release)
> **Author**: PDCA pipeline (pm-lead PRD → plan)
> **Date**: 2026-07-02
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit's 40 agents are pinned to `opus`(17)/`sonnet`(21)/`haiku`(2) aliases and its CC floor (v2.1.143) sits below the Fable floor (v2.1.170) and the Sonnet 5 alias floor (v2.1.197). The Claude 5 family is unused for verification/orchestration, the model whitelist/pricing/contract baselines cannot represent `fable`, and the agent-model roster is misdocumented in 3 places. |
| **Solution** | Quality-first, role-based model alignment: leads/orchestrators and verifiers → `fable`, implementers → `sonnet` (floats to Sonnet 5), monitors/reporters/deprecated stubs → `haiku`, `security-architect` stays on `opus` (Fable safety-classifier reroutes security work). Update every dependent surface in lockstep: VALID_MODELS whitelist, runtime coercion whitelist, pricing table, contract baselines (v2.1.9 + v2.1.16), security assertions, version-floor constants, and all normative docs — fixing the 3 pre-existing doc-drift bugs. |
| **Function/UX Effect** | Verification quality rises where bkit's differentiation lives (gap analysis, design validation, orchestration) via Fable's reasoning/honesty edge; implementation gets cheaper and stronger via Sonnet 5; monitoring stays cheap on Haiku; token-report shows accurate costs; older-CC users get an explicit advisory instead of silent breakage. |
| **Core Value** | Higher output quality where it compounds (planning + verification), lower spend where deep reasoning is unneeded, zero regression for the installed base — delivered as a docs=code, CI-green release. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkit's model designations predate the Claude 5 family; verification/orchestration agents run below the best available capability, and `fable` cannot even be expressed by bkit's whitelists/pricing/baselines. |
| **WHO** | bkit installers segmented by CC version (<2.1.170 / 2.1.170–196 / ≥2.1.197) and provider (Anthropic API vs AWS/Bedrock/Vertex — alias resolution differs); headless/CI users (`claude -p`) where Fable safety-classifier refusals matter. |
| **RISK** | `model: fable` is a HARD agent-spawn error on CC < 2.1.170 (empirically reproduced, R2) — floor policy must prevent breaking the installed base; contract L1-AG fails unless baselines regenerate in lockstep. |
| **SUCCESS** | All 40 agents resolve to intended models on CC ≥ floor (probe-verified); full CI suite green; zero docs=code drift incl. 3 legacy bugs fixed; graceful advisory below floor. |
| **SCOPE** | agents/ frontmatter ×40 · test/security whitelist+assertions · test/contract baselines ×2 dirs · scripts/subagent-start-handler.js · lib/pdca/token-report.js · lib/domain/guards/enh-264 · evals/config.json · version-floor constants · docs/skills/bkit-system prose · release advisory. |

---

## 1. Overview

### 1.1 Purpose

Realign bkit's model policy with the Claude 5 model family (released: Fable 5 on CC v2.1.170, Sonnet 5 default on v2.1.197, Opus 4.8 on v2.1.154, Haiku 4.5) so that each of the 40 agents runs on the model class best suited to its role, at the best cost, without breaking backward compatibility.

### 1.2 Background

- **Web research (CONFIRMED, official docs/CHANGELOG)**: agent frontmatter `model:` accepts `sonnet|opus|haiku|fable|<full-id>|inherit`; aliases float (Anthropic API: `opus`→Opus 4.8, `sonnet`→Sonnet 5, `haiku`→Haiku 4.5); Fable 5 = reasoning/verification/long-horizon orchestration ($10/$50 MTok); Sonnet 5 = strongest coding at $2/$10 intro; Opus 4.8 = $5/$25, strongest cybersecurity; Fable safety-classifier reroutes/refuses security-adjacent work (critical for security-architect and headless QA).
- **Empirical reproductions** (`.bkit/research/v2125-reproduction-log.md`): R1 — CC v2.1.198 honors frontmatter `model: fable` → `claude-fable-5` (regression #44385 absent). R2 — CC v2.1.150 hard-errors on `model: fable` agent spawn (NOT graceful fallback).
- **Codebase audit** (`.bkit/research/v2125-model-audit.md`): complete change surface incl. blocking CI gates (SEC-AF-051 VALID_MODELS, contract L1-AG baseline equality) and silent hazards (runtime whitelist coerces unknown → `sonnet`; pricing table classes unknown IDs as `unknown`).
- **User decisions (Plan checkpoint, 2026-07-02)**: full FR-1..14 scope; quality-first — adopt `fable` for leads + verifiers; deprecated `pdca-eval-*` stubs → `haiku`; **and preserve Opus where its strengths apply** — Opus 4.8 remains the right model for cybersecurity, refusal-sensitive headless paths, and deep-reasoning roles where Fable's 2× cost isn't justified. The Design matrix must argue each agent's tier individually (4-tier: fable/opus/sonnet/haiku), not apply a blanket fable upgrade.

### 1.3 Related Documents

- PRD: `docs/00-pm/claude-model-alignment.prd.en.md` / `.ko.md`
- Research: `.bkit/research/v2125-cc-model-web-research.md`, `.bkit/research/v2125-model-audit.md`, `.bkit/research/v2125-reproduction-log.md`
- Baseline SOP: `docs/06-guide/contract-baseline-rollforward.guide.md`

---

## 2. Scope

### 2.1 In Scope

- [ ] Role-based `model:` reassignment across `agents/*.md` (40 files) per the Design §model matrix
- [ ] `fable` added to `VALID_MODELS` (`test/security/agent-frontmatter.test.js:470`) + targeted assertion updates (SEC-AF-013/030/038/052)
- [ ] `fable` added to runtime whitelist (`scripts/subagent-start-handler.js:69`) — eliminate silent coercion to `sonnet`
- [ ] Fable pricing + model-class branch in `lib/pdca/token-report.js` (+ refreshed Claude 5 pricing accuracy) + unit tests
- [ ] Contract baselines regenerated in BOTH `test/contract/baseline/v2.1.9/` and `v2.1.16/` (L1-AG lockstep)
- [ ] `KNOWN_REGRESSION_MODELS` decision applied (`lib/domain/guards/enh-264-token-threshold.js`) — Sonnet 5 handling
- [ ] `evals/config.json` benchmarkModel + README-FULL example model IDs updated
- [ ] CC version floor policy applied (Design decision): `cc-version-checker.js` MIN/RECOMMENDED, `session-context.js` CC_MIN_VERSION + stale prose (line 443), README badge/requirement/recommended, marketplace.json descriptions
- [ ] 3 pre-existing doc-drift bugs fixed: (i) "36 total / 13 opus" stale counts, (ii) pm-lead documented `sonnet` but is `opus`, (iii) test-checklist PM-T10 "all 5 PM agents use sonnet"
- [ ] All normative model prose synced: commands/bkit.md, bkit-system tables, skills (pdca, pm-discovery, cc-version-analysis, pdca-watch), hooks/startup/session-context.js, CUSTOMIZATION-GUIDE allowed-values, README-FULL diagrams
- [ ] Release advisory content: floor change, provider alias differences, `CLAUDE_CODE_SUBAGENT_MODEL` + enterprise `availableModels` footguns, Fable headless-refusal caveat
- [ ] Frontmatter-honored smoke evidence retained (R1/R2 reproduction log) + QA re-verification via `claude -p`

### 2.2 Out of Scope

- Bumping `.claude-plugin/plugin.json` `version` (maintainer-only release decision; CHANGELOG heading v2.1.25 is provisional labeling)
- Changing bkit's main-session default model (CC decides; bkit only pins subagents)
- Automated per-provider alias pinning (AWS/Bedrock users documented, not automated)
- Implementing a `CLAUDE_CODE_SUBAGENT_MODEL` preflight blocker (documented as footgun only; a warning check may be a stretch goal in Design)
- Retroactive translation/renaming of existing docs (bilingual rule applies to new files only)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Decide + implement CC compatibility floor policy (Design options; must neutralize R2 hard-error risk) | High | Pending |
| FR-02 | Reassign 40 agents' `model:` role-based across a genuine 4-tier taxonomy: long-horizon orchestration + verification core → `fable`; **Opus-strength roles stay `opus`** (cybersecurity, deep single-shot reasoning at half Fable cost, headless/refusal-sensitive contexts — e.g., security-architect, infra-adjacent deep analysis); implementers → `sonnet`; monitors/reporters → `haiku`. Every tier must be justified per-agent in the Design matrix — fable is NOT a blanket replacement for opus (user directive 2026-07-02). | High | Pending |
| FR-03 | Add `fable` to `VALID_MODELS` (SEC-AF-051) | High | Pending |
| FR-04 | Add `fable` to runtime model whitelist (subagent-start-handler.js:69) | High | Pending |
| FR-05 | token-report: `_modelClass` fable branch + `PRICING_PER_MTOK` fable $10/$50; verify sonnet/opus rows against current published pricing | High | Pending |
| FR-06 | Regenerate contract baselines v2.1.9 + v2.1.16 in the same commit as agent changes (L1-AG green) | High | Pending |
| FR-07 | Update targeted security assertions: SEC-AF-013 (starter-guide), SEC-AF-030 (cto-lead), SEC-AF-038/052 (opus-tier lists) to match the new matrix | High | Pending |
| FR-08 | Fix 3 pre-existing doc-drift bugs (counts 36/13-opus → actual; pm-lead sonnet↔opus; PM-T10 claim) | High | Pending |
| FR-09 | Update normative allowed-value docs + role legends to include `fable` (CUSTOMIZATION-GUIDE.md:921,956; _agents-overview.md:55-57) | Medium | Pending |
| FR-10 | Resolve KNOWN_REGRESSION_MODELS for Sonnet 5 (extend vs explicitly-exclude; Design decision d) | Medium | Pending |
| FR-11 | Update evals benchmarkModel + README-FULL example model IDs to Claude 5 IDs | Medium | Pending |
| FR-12 | Deprecated `pdca-eval-*` stubs (6) → `haiku` (user-decided) | Medium | Pending |
| FR-13 | Sync all prose model references (skills/, hooks/startup/session-context.js:271,289,443, bkit-system/, README-FULL diagrams) | Medium | Pending |
| FR-14 | Release advisory: floor, provider alias table, 2 footguns, Fable headless-refusal caveat (CHANGELOG + release notes draft) | Medium | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| CI Integrity | Zero failures across contract L1/L2/L3/L4/L5 + security + unit + release gates | Local full run + GitHub Actions on push |
| Docs=Code | Zero drift (counts, per-agent model columns, role legends) | `scripts/docs-code-sync.js` + `tests/qa/bkit-full-system.test.js` + manual matrix diff |
| Backward Compat | No hard error for any bkit agent on the declared floor CC; advisory below floor | Probe agents via old CC (`npx @anthropic-ai/claude-code@<floor>`) |
| Cost Accuracy | Claude 5 IDs never classed `unknown`; fable priced $10/$50 | `test/unit/token-report.test.js` extended |
| No Silent Downgrade | `fable` survives subagent-start-handler coercion | Unit/integration assertion on handler |
| Security Posture | security-architect ≠ fable; headless Fable-refusal caveat documented | SEC-AF assertion + docs review |
| Traceability | Frontmatter-honored evidence on current CC retained (R1) and re-verified in QA | `claude -p` probe in QA phase |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] SC-1: All 40 `agents/*.md` `model:` values equal the approved Design model matrix (gap-detector-verifiable, target 100%)
- [ ] SC-2: On local CC v2.1.198, a fable-pinned bkit agent (e.g., gap-detector) probe-reports `claude-fable-5`; a haiku-pinned agent reports `claude-haiku-4-5-*` (headless `claude -p --plugin-dir .`)
- [ ] SC-3: Full local gate suite green: contract-test-run (v2.1.9 + v2.1.16), l2-smoke, l2-hook-attribution, l3-mcp-compat, l3-mcp-runtime, invocation-inventory (L5), security agent-frontmatter tests, unit tests, docs-code-sync, check-deadcode, bkit-full-system, qa-aggregate
- [ ] SC-4: token-report unit tests prove fable class + $10/$50 pricing and correct classing of `claude-fable-5`, `claude-sonnet-5`, `claude-opus-4-8`
- [ ] SC-5: Zero docs=code drift; the 3 legacy doc bugs are fixed and counts are consistent repo-wide
- [ ] SC-6: GitHub Actions contract-check green on the working branch push (single batched push policy)
- [ ] SC-7: Release advisory text exists in CHANGELOG (provisional v2.1.25 heading) + GitHub Release notes draft

### 4.2 Quality Criteria

- [ ] No new dead code (check-deadcode green); no domain-purity violations
- [ ] English-only implementation (docs/ bilingual pairs + 8-language trigger lists excepted)
- [ ] No `.claude-plugin/plugin.json` version change in this branch

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `model: fable` hard-errors on CC < 2.1.170 (R2, reproduced) | High | High (installed base below floor) | Floor policy decision in Design (raise floor / advisory gating); release advisory; keep non-fable agents working everywhere |
| Contract L1-AG red if baselines lag agent edits | High | Certain without lockstep | Regenerate v2.1.9 + v2.1.16 baselines in the same commit; follow rollforward SOP |
| Runtime whitelist silently coerces `fable`→`sonnet` in team state | Medium | Certain if missed | FR-04 + explicit test |
| Sonnet 5 vs KNOWN_REGRESSION_MODELS guard misfire/miss | Medium | Medium | Design decision (d): keep guard scoped to sonnet-4.x IDs (regression was version-specific) or extend after evidence; document rationale |
| Fable safety-classifier refusals in headless QA (`claude -p`) | Medium | Medium | Keep security-architect on opus; QA probes use innocuous prompts; document caveat |
| `CLAUDE_CODE_SUBAGENT_MODEL` env overrides all pins | Medium | Low | Document footgun (FR-14); optional stretch: session-start warning |
| AWS/Bedrock/Vertex users don't get Claude 5 from aliases | Low | Medium | Provider table in docs; no universal "Sonnet 5" promise (NFR-6) |
| GitHub Actions free-tier burn from frequent pushes | Low | Medium | Single-branch, batched commits; push only at milestone points |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `agents/*.md` ×40 | Agent frontmatter | `model:` reassignment per matrix |
| `test/security/agent-frontmatter.test.js` | CI whitelist + assertions | VALID_MODELS += fable; SEC-AF-013/030/038/052 matrix sync |
| `test/contract/baseline/{v2.1.9,v2.1.16}/agents/*.json` | Contract baselines | Regenerated model fields |
| `scripts/subagent-start-handler.js` | Runtime hook | whitelist += fable |
| `lib/pdca/token-report.js` (+ unit tests) | Pricing/classing | fable class + pricing |
| `lib/domain/guards/enh-264-token-threshold.js` | Regression guard | Sonnet 5 decision |
| `lib/infra/cc-version-checker.js`, `hooks/startup/session-context.js` | Version floor | Floor policy constants + advisory prose |
| `evals/config.json` | Eval config | benchmarkModel → Claude 5 ID |
| Docs: README.md, README-FULL.md, CUSTOMIZATION-GUIDE.md, CHANGELOG.md, commands/bkit.md, skills/*, bkit-system/*, .claude-plugin/marketplace.json | Normative docs | Model matrix, counts, allowed values, floor, advisory |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| agent frontmatter `model` | READ | CC Task spawn (resolution: env → param → frontmatter → main) | Needs verification (R1 probe re-run in QA) |
| agent frontmatter `model` | ASSERT | contract-test-run.js L1-AG vs baselines | Breaking unless baselines regen (FR-06) |
| agent frontmatter `model` | ASSERT | agent-frontmatter.test.js SEC-AF-051/013/030/038/052 | Breaking unless updated (FR-03/07) |
| resolved model string | WRITE | subagent-start-handler.js → team state | Breaking (silent) unless FR-04 |
| model ID string | READ | token-report.js `_modelClass`/pricing → dashboards, pdca-watch | Silent mispricing unless FR-05 |
| model ID string | READ | enh-264 guard `.includes(metrics.model)` | No-op for Claude 5 IDs unless FR-10 decision |
| model prose | READ | session-context.js SessionStart injection; skills; commands/bkit.md | Doc drift unless FR-08/13 |
| `ctoAgent`/teammate defaults | READ | lib/team/state-writer.js:46,173,210; hooks/session-start.js:155; subagent-start-handler.js:83 | Needs Design decision (keep `opus` default vs `fable`) |
| benchmarkModel | READ | evals/runner.js:390 | Stale benchmark unless FR-11 |

### 6.3 Verification

- [ ] All consumers above re-verified after implementation (Check phase sweep includes "related + similar code" per work rules)
- [ ] No auth/permission surface touched
- [ ] No schema/manifest key additions (plugin.json untouched → ADR 0011 21-key whitelist unaffected)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

Not a web-app feature — bkit plugin internal. Level: **Enterprise-grade repo conventions apply** (Clean Architecture 4-Layer in lib/, CI contract gates L1–L5).

### 7.2 Key Architectural Decisions (deferred to Design — Checkpoint 3)

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| (a) CC floor policy | A1: raise hard floor to 2.1.170+ / A2: keep floor, RECOMMENDED→2.1.170+, fable with advisory / A3: no fable (rejected by user) | Design | R2 hard-error vs installed-base reach |
| (b) Fable/Opus split | leads+verifiers lean `fable` (user: quality-first) BUT Opus-strength roles stay `opus` (user directive) — exact per-agent list with rationale | Design matrix | Cost/quality/safety-classifier per agent role; fable ≠ blanket opus replacement |
| (c) pdca-eval-* stubs | haiku (decided) | ✅ haiku | Tombstones; min cost |
| (d) KNOWN_REGRESSION_MODELS | keep sonnet-4.x scoped vs extend to Sonnet 5 | Design | ENH-264 regression was version-specific; extending without evidence violates No-Guessing |
| (e) team default model (`state-writer.js`, `ctoAgent: 'opus'`) | keep opus vs fable | Design | CTO default follows cto-lead frontmatter decision |

### 7.3 Clean Architecture Approach

Existing structure retained. Changes stay within: `agents/` (presentation-ish config), `scripts/` (adapters), `lib/pdca` + `lib/domain/guards` (domain/application), `test/` (contract). No new modules expected; no layer violations (check-domain-purity gate).

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `.claude/CLAUDE.md` — language rules (English implementation; docs/ bilingual pairs; 8-lang triggers exception), versioning rule (no version bumps by agent)
- [x] Contract baseline rollforward SOP — `docs/06-guide/contract-baseline-rollforward.guide.md`
- [x] CI gates — `.github/workflows/contract-check.yml` (push: main, feat/**)
- [x] Docs=Code invariants — `lib/domain/rules/docs-code-invariants.js`

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| Model role taxonomy | implicit (opus=lead/verify, sonnet=work, haiku=monitor) | Explicit 4-tier legend incl. fable (docs FR-09) | High |
| Floor declaration | 3 constants + prose scattered (audit §C) | Single-story floor narrative across README/hooks/marketplace | High |
| Pricing SoT | token-report.js literals + pdca-watch prose | Keep token-report as SoT; prose points to it | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `CLAUDE_CODE_SUBAGENT_MODEL` | (existing CC var) overrides ALL frontmatter pins — document footgun | User env | ☐ (docs only) |
| `CLAUDE_MODEL` | (existing) ledger model attribution fallback | Runtime | ☐ (no change) |

### 8.4 Pipeline Integration

N/A — PDCA single-feature flow (this document), Sprint wrapper not required (single cohesive feature; user may still invoke /sprint if scope grows).

---

## 9. Next Steps

1. [ ] Write design document (`docs/02-design/features/claude-model-alignment.design.{en,ko}.md`) — 3 options for floor policy + full 40-agent model matrix
2. [ ] User selects architecture option (Checkpoint 3)
3. [ ] Implementation via `/pdca team` (Do), then analyze → iterate → qa → report

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial draft from PRD + research + user checkpoint decisions | PDCA pipeline |
