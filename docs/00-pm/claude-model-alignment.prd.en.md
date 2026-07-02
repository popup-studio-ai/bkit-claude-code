---
template: pm-prd
version: 1.0
description: PM PRD phase document — Context Anchor + 8-section PRD for bkit v2.1.25 claude-model-alignment
variables:
  - feature: claude-model-alignment
  - date: 2026-07-02
  - author: kay kim (bkit maintainer)
  - targetRelease: v2.1.24 → v2.1.25
---

# claude-model-alignment PRD

> **Feature**: `claude-model-alignment`
> **Phase**: PM / PRD (pre-Plan)
> **Date**: 2026-07-02
> **Author**: kay kim (bkit maintainer)
> **Target release**: v2.1.24 → v2.1.25
> **Scale**: Internal developer-tool release (bkit plugin). PM frameworks intentionally scaled down — no consumer GTM.
> **Research basis**: `.bkit/research/v2125-cc-model-web-research.md` (CC docs/CHANGELOG-confirmed), `.bkit/research/v2125-model-audit.md` (change-surface audit). This PRD is synthesis only; research is authoritative and not re-derived here.

---

## 0. Context Anchor (preserve — copy into every downstream phase)

| Key | Value |
|-----|-------|
| **WHY** | The Claude 5 family shipped. On the Anthropic API, `opus` now floats to Opus 4.8 (CC v2.1.154+) and `sonnet` floats to Sonnet 5 (CC v2.1.197+); a new `fable` alias (Fable 5, CC v2.1.170+) is the recommended model for reasoning / verification / long-horizon orchestration. bkit pins its 40 agents to `opus`(17)/`sonnet`(21)/`haiku`(2) but its documented CC floor is **v2.1.143 — BELOW the v2.1.170 Fable floor and the v2.1.197 Sonnet-5 floor**. bkit is leaving verification quality (Fable), cheaper implementation (Sonnet 5) and cheaper monitors (Haiku) on the table, while its whitelist/pricing/contract baselines have no notion of `fable` and its docs already misstate the model roster (3 pre-existing drift bugs). |
| **WHO** | bkit installers, segmented by **CC version** (`<2.1.170` / `2.1.170–2.1.196` / `≥2.1.197`) and by **model provider** (Anthropic API vs AWS Platform vs Bedrock/Vertex/Foundry — aliases resolve to *different* model versions per provider). Includes **headless/CI users** (`claude -p`) where the Fable safety-classifier can refuse a turn. Stakeholder / decision-maker: kay kim (bkit maintainer). |
| **RISK** | (a) Pre-2.1.170 behavior of an unknown `model: fable` alias is **UNVERIFIED** → backward-compat break risk. (b) Issue #44385 (frontmatter `model:` ignored) fix status unclear → reassignment may be silently inert. (c) `CLAUDE_CODE_SUBAGENT_MODEL` env override silently overrides all frontmatter pins. (d) Enterprise `availableModels` allowlists silently downgrade excluded models. (e) Fable safety-classifier reroutes/refuses on security-adjacent content → `security-architect` on Fable degrades. (f) Contract L1-AG + VALID_MODELS + runtime whitelist all fail/silently-coerce unless updated in lockstep → GitHub Actions CI red. |
| **SUCCESS** | On latest CC (Anthropic API): all 40 agents resolve to their **intended** models; **zero CI failures** (contract L1-AG + security tests green after baseline regen); **zero behavior break** on the declared floor CC version (graceful degradation below it); **docs = code, zero drift** — including the 3 pre-existing stale-doc bugs, which this release fixes; **no silent mispricing** (Fable/Sonnet-5/Opus-4.8 priced correctly, never `unknown`) and **no silent downgrade** (runtime whitelist honors `fable`). |
| **SCOPE** | **In**: CC floor policy decision; role-based model reassignment across 40 agents; `fable` added to VALID_MODELS + runtime whitelist; token-report pricing + `_modelClass` fable branch; contract baseline regen (v2.1.9 + v2.1.16); targeted security-assertion updates; fix 3 pre-existing doc-drift bugs; normative allowed-value + role-legend doc updates; Sonnet-5 vs KNOWN_REGRESSION_MODELS decision; release notes / user advisory. **Out**: rewriting the agent orchestration model; per-invocation dynamic model routing; new model-selection config keys; changing the PDCA/Sprint phase enums; provider auto-detection logic; bumping the project version number (maintainer's call). |

---

## 1. Executive Summary

| Perspective | Summary |
|-------------|---------|
| **Problem** | bkit's 40 agents are pinned to `opus`/`sonnet`/`haiku` aliases and its CC floor (v2.1.143) sits below the Fable (v2.1.170) and Sonnet-5 (v2.1.197) floors. The Claude 5 family is unused, the whitelist/pricing/contract baselines cannot represent `fable`, and the model roster is already misdocumented in 3 places. |
| **Solution** | A two-part release: (1) decide and declare a CC compatibility floor with a graceful-degradation stance for older CC; (2) execute role-based model alignment — leads/verifiers → `fable` (else `opus`), implementers → `sonnet` (Sonnet 5), monitors/PM/reporters → `haiku`, keeping `security-architect` off Fable — and update every dependent surface (whitelist, runtime coercion, pricing, contract baselines, security assertions, docs) in lockstep, fixing the 3 stale-doc bugs along the way. |
| **Function / UX effect** | bkit users on modern CC get measurably better verification (Fable honesty edge on gap-detector / design-validator), cheaper implementation (Sonnet 5 at intro $2/$10), and cheaper monitoring (Haiku), with token-report costs shown accurately. Users on older CC keep working via graceful fallback, warned by an explicit floor advisory. |
| **Core value** | Higher output quality where it compounds (planning + verification), lower spend where reasoning is not needed (implementation + monitoring), zero regression for the installed base — delivered as a docs=code, CI-green release. |

---

## 2. Problem / Opportunity

### 2.1 Current state vs desired state

| Area | Current (v2.1.24) | Desired (v2.1.25) |
|------|-------------------|-------------------|
| CC floor | README floor v2.1.143; recommends ~v2.1.150 — below Fable (v2.1.170) and Sonnet-5 (v2.1.197) floors | Explicit, documented floor policy with graceful-degradation stance below it |
| Agent model roster | 40 agents pinned opus(17)/sonnet(21)/haiku(2); no `fable` anywhere | Role-based assignment incl. `fable` for leads/verifiers; `security-architect` explicitly off Fable |
| VALID_MODELS whitelist | `['opus','sonnet','haiku']` — `fable` frontmatter would FAIL SEC-AF-051 | `fable` added; all 40 agents ∈ whitelist |
| Runtime whitelist | `scripts/subagent-start-handler.js:69` coerces non-`opus/sonnet/haiku` → `'sonnet'` — Fable **silently downgraded** in team state | `fable` honored; no silent coercion |
| Pricing | `token-report.js` prices sonnet/opus/haiku; Fable → `unknown` → mispriced | Fable priced ($10/$50); Sonnet-5/Opus-4.8 numbers refreshed; no `unknown` fallback for Claude 5 |
| Contract baselines | v2.1.9 (37) + v2.1.16 (40) freeze each agent's `model`; L1-AG fails on any change | Regenerated in lockstep for reassigned agents; L1-AG green |
| Doc accuracy | 3 pre-existing drift bugs: 36/13-opus counts (actual 40/17); pm-lead documented `sonnet` but frontmatter `opus`; PM-T10 "all 5 PM agents use sonnet" | docs = code, zero drift; all 3 bugs fixed |

### 2.2 Opportunity framing

- **Verification quality is the highest-leverage win.** Fable's honesty/self-verification edge maps directly onto bkit's Defense-Layer-6 agents (gap-detector, design-validator, code-analyzer, sprint-qa-flow). Fresh-context verifiers on a stronger model catch what self-critique misses.
- **Cost asymmetry is real.** Fable ($10/$50) is too expensive as a bulk implementer; Sonnet 5 (intro $2/$10) is the coding sweet spot at ~1/5 the cost. Monitors/reporters/PM analysts do low-reasoning, high-volume work → Haiku per Anthropic's own guidance.
- **The floor is the gate.** None of the upside can ship as default frontmatter until the floor rises to ≥ v2.1.170 (ideally ≥ v2.1.197 so `sonnet` floats to Sonnet 5). This is the one decision everything else hangs on.

---

## 3. Users & Segments

Segmented by the two axes that actually change alias resolution and failure behavior.

### 3.1 By CC version

| Segment | Behavior with new frontmatter | Priority |
|---------|-------------------------------|----------|
| **S1 — CC < 2.1.170** | Cannot select Fable; `model: fable` behavior is **UNVERIFIED** (may warn+fallback, may error). Highest backward-compat risk. | Protect (do-no-harm) |
| **S2 — CC 2.1.170–2.1.196** | Fable available; `sonnet` still floats to a pre-5 Sonnet (Sonnet 5 needs 2.1.197). `opus`→Opus 4.8 from 2.1.154. | Partial benefit |
| **S3 — CC ≥ 2.1.197** | Full benefit: `sonnet`→Sonnet 5, `opus`→Opus 4.8, `fable`→Fable 5, native 1M. Target happy path. | Optimize for |

### 3.2 By provider (aliases resolve differently)

| Provider | `opus` → | `sonnet` → | `fable` → |
|----------|----------|------------|-----------|
| Anthropic API | Opus 4.8 | Sonnet 5 | Fable 5 (safety-classifier may fall back to Opus 4.8) |
| Claude Platform on AWS | Opus 4.7 | Sonnet 4.6 | Fable 5 (fallback to Opus if flagged) |
| Bedrock / Vertex / Foundry | Opus 4.6 | Sonnet 4.5 | provider-specific full ID required |

Implication: alias-based assignment gives the *best available* model per provider automatically, but the *actual* version differs. Docs must not promise "Sonnet 5" universally.

### 3.3 By execution mode

- **Interactive** — Fable safety-classifier reroutes to Opus 4.8 silently when it flags content.
- **Headless / CI (`claude -p`, SDK)** — a flagged Fable turn can **end with a refusal** instead of rerouting. Any Fable-pinned agent that touches CLAUDE.md / git status / security content on its first request is at refusal risk in CI. This is the decisive argument for keeping `security-architect` (and arguably other security-adjacent flows) off Fable.

---

## 4. Value Proposition

**For** bkit users on modern Claude Code
**who** run multi-agent PDCA/Sprint workflows and pay per token,
**the** claude-model-alignment release **is a** model-role realignment
**that** routes planning and verification to Fable 5's stronger reasoning/honesty, implementation to Sonnet 5's cheaper coding, and monitoring to Haiku,
**unlike** the current uniform opus/sonnet pinning that neither uses Claude 5 nor prices it,
**our release** improves verification quality and cuts implementation/monitoring spend **while guaranteeing zero regression** for users on older CC through an explicit floor + graceful degradation.

| VP component | bkit-specific content |
|--------------|-----------------------|
| Gain creators | Better gap/design verification (Fable); ~5× cheaper implementation (Sonnet 5 intro); cheaper high-volume monitors (Haiku); accurate token-report costs |
| Pain relievers | No silent mispricing; no silent model downgrade; no CI breakage; no surprise cost spike from Fable-as-implementer; clear floor advisory |
| Products/services | Role-based frontmatter, updated whitelist + runtime coercion, refreshed pricing table, regenerated contract baselines, corrected docs |

---

## 5. Requirements

> FR = functional (what the release must deliver). NFR = non-functional (quality bars). Final *choices* inside FR-1/FR-2/FR-10/FR-12 are framed in §6 and settled in Design; the FR mandates that the release resolve them.

### 5.1 Functional Requirements

| ID | Requirement | Primary surface (from audit) |
|----|-------------|------------------------------|
| **FR-1** | Establish and document a CC compatibility floor for v2.1.25, resolving raise-floor vs conditional/graceful approach (see §6-a). | README.md, README-FULL.md, `lib/infra/cc-version-checker.js`, RECOMMENDED_VERSION |
| **FR-2** | Reassign the 40 agents' `model:` frontmatter by role class: leads/orchestrators → `fable` (else `opus`); implementers → `sonnet`; verifiers/reviewers → `fable` (budget) else `opus`/`sonnet`; monitors/reporters/PM analysts → `haiku`; **`security-architect` stays off `fable`** (see §6-b). | `agents/*.md` (source of truth) |
| **FR-3** | Add `fable` to the central test whitelist `VALID_MODELS`. | `test/security/agent-frontmatter.test.js:470` |
| **FR-4** | Add `fable` to the runtime whitelist so it is not silently coerced to `sonnet` in team state. | `scripts/subagent-start-handler.js:69` |
| **FR-5** | Add Fable pricing ($10/$50) to `PRICING_PER_MTOK` and a `fable` branch to `_modelClass`; refresh Sonnet/Opus pricing to Claude-5-family numbers. | `lib/pdca/token-report.js:32-36,53-57` |
| **FR-6** | Regenerate contract baselines in lockstep for every reassigned agent in **both** baseline dirs so L1-AG passes. | `test/contract/baseline/v2.1.9/agents/*.json`, `.../v2.1.16/agents/*.json`, `contract-baseline-collect.js` |
| **FR-7** | Update targeted security assertions consistent with reassignments. | SEC-AF-030 (cto-lead), SEC-AF-013 (starter-guide), SEC-AF-038 / SEC-AF-052 (opus-tier lists) |
| **FR-8** | Fix the 3 pre-existing doc-drift bugs: (i) agent count 36→40 and opus 13→17; (ii) pm-lead documented `sonnet` but frontmatter is `opus`; (iii) PM-T10 "all 5 PM agents use sonnet" is wrong (pm-lead is opus). | `commands/bkit.md:145,153-183`; `bkit-system/*` tables; `test-checklist.md:399` |
| **FR-9** | Update normative allowed-value docs and role-legend tables to include `fable`. | `CUSTOMIZATION-GUIDE.md:921,956`; `bkit-system/components/agents/_agents-overview.md:55-57` |
| **FR-10** | Resolve KNOWN_REGRESSION_MODELS handling for Sonnet 5 — decide whether the sonnet-4.x token-threshold guard extends to, or explicitly excludes, Sonnet 5 (see §6-d). | `lib/domain/guards/enh-264-token-threshold.js:20` + dependent tests |
| **FR-11** | Update eval benchmark model and example model IDs to current family. | `evals/config.json:5`; `README-FULL.md:754,757` |
| **FR-12** | Decide and apply the deprecated `pdca-eval-*` stub model (6 stubs) — candidate: move to `haiku` for cost (see §6-c). | `agents/pdca-eval-*.md` + baselines |
| **FR-13** | Update prose model references across skills/hooks to reflect new assignments and Claude 5 naming. | `skills/pdca/SKILL.md:342,383-384`; `skills/pm-discovery/SKILL.md:46`; `skills/cc-version-analysis/SKILL.md:347-350`; `hooks/startup/session-context.js:271,289` |
| **FR-14** | Publish a release-notes / user advisory covering floor change, provider-specific alias resolution, and the two footguns (`CLAUDE_CODE_SUBAGENT_MODEL`, enterprise `availableModels`). | CHANGELOG.md, README advisory block |

### 5.2 Non-Functional Requirements

| ID | Requirement | Verification |
|----|-------------|--------------|
| **NFR-1** | Zero CI failures — contract L1-AG + all security tests green on latest CC after baseline regen. | GitHub Actions run green |
| **NFR-2** | docs = code, zero drift — model-count tables, per-agent columns, and role legends all match frontmatter, including the 3 fixed bugs. | Manual + grep audit vs `agents/*.md` |
| **NFR-3** | Backward compatibility — zero behavior break on the declared floor CC version; below it, agents degrade gracefully (warn/fallback, no hard error). | Smoke test on floor CC + fallback path |
| **NFR-4** | No silent mispricing — Fable/Sonnet-5/Opus-4.8 priced correctly; no Claude-5 ID falls through to `unknown`. | `token-report.test.js` fable case |
| **NFR-5** | No silent downgrade — runtime whitelist honors `fable`; the `CLAUDE_CODE_SUBAGENT_MODEL` override footgun is documented. | Runtime coercion unit + advisory present |
| **NFR-6** | Provider-aware docs — alias resolution differences (AWS/Bedrock/Vertex) and enterprise `availableModels` silent-downgrade are documented; no universal "Sonnet 5" promise. | Doc review |
| **NFR-7** | Security posture preserved — `security-architect` not on Fable; headless/CI refusal risk for any Fable agent is documented. | Assertion + advisory |
| **NFR-8** | Traceability — a smoke test confirms frontmatter `model:` is actually honored on the floor CC (guards against #44385 regression). | New smoke test |

---

## 6. Key Decisions to be made in Design

> The PRD deliberately leaves the final pick to Design; each decision lists framed options + the deciding tension.

**(a) Floor policy — raise vs conditional/graceful.**
- Option A1: Raise floor to **≥ v2.1.170** (Fable available; `sonnet` still pre-5 on 2.1.170–196).
- Option A2: Raise floor to **≥ v2.1.197** (full Claude 5: Sonnet 5 default + native 1M) — cleanest, strictest.
- Option A3: Keep low floor + **conditional/graceful** frontmatter (no `fable` in defaults; rely on alias float + advisory).
- Deciding tension: upside (ship `fable` as default) vs installed-base breakage on S1 (pre-2.1.170 unknown-alias behavior UNVERIFIED). Recommend A2 if telemetry supports it, else A1 + advisory.

**(b) Which role classes move to Fable.**
- Conservative: only verifiers (gap-detector, design-validator, code-analyzer, sprint-qa-flow).
- Balanced: verifiers + leads/orchestrators (cto-lead, pm-lead, qa-lead, sprint-orchestrator, sprint-master-planner).
- Deciding tension: Fable-lead + Sonnet-workers is the validated cost pattern, but Fable at $10/$50 compounds fast on high-fan-out leads. `security-architect` is excluded in every option.

**(c) Deprecated `pdca-eval-*` stubs → Haiku?**
- These 6 stubs exist only to satisfy contract deprecation governance (L4). Moving them `sonnet`→`haiku` trims cost with near-zero risk, but touches 6 baselines. Decide whether the baseline-churn is worth the marginal saving.

**(d) Sonnet 5 vs KNOWN_REGRESSION_MODELS guard.**
- `enh-264-token-threshold.js` guards `claude-sonnet-4-6` / `claude-sonnet-4-5`. Decide: does the regression apply to Sonnet 5 (add its ID), or is Sonnet 5 explicitly clean (leave guard, document non-applicability)? Getting this wrong either over-throttles Sonnet 5 or misses a real regression.

---

## 7. Risks & Mitigations

| # | Risk | Severity | Mitigation |
|---|------|----------|------------|
| R1 | Pre-2.1.170 unknown `model: fable` behavior UNVERIFIED → S1 users break | High | Gate `fable` defaults behind the floor decision (§6-a); if A3, keep `fable` out of default frontmatter; smoke-test on floor CC |
| R2 | #44385 (frontmatter `model:` ignored) not fully fixed → reassignment inert | Med | NFR-8 smoke test on floor CC; if unhonored, document + hold reassignment |
| R3 | `CLAUDE_CODE_SUBAGENT_MODEL` env override silently overrides all pins | Med | FR-14 advisory; consider preflight warning in a session hook |
| R4 | Enterprise `availableModels` allowlist silently downgrades Fable→inherited | Med | FR-14 advisory (documented, not fixable in bkit); alias fallback is graceful by design |
| R5 | Fable safety-classifier reroutes/refuses on security content → security-architect degrades, CI refusals | High | Keep `security-architect` off Fable (FR-2/NFR-7); document headless refusal risk |
| R6 | Contract L1-AG / VALID_MODELS / runtime whitelist not updated in lockstep → CI red or silent coerce | High | FR-3/4/6 treated as a single atomic changeset; baseline regen in same PR |
| R7 | token-report prices Fable as `unknown` → wrong cost reports | Med | FR-5 + NFR-4 fable pricing + test |
| R8 | Provider variance mis-documented ("Sonnet 5 everywhere") | Low | NFR-6 provider-aware docs |

---

## 8. Success Criteria & GTM / Release-Notes Plan

### 8.1 Measurable success criteria

| SC | Criterion | Measure |
|----|-----------|---------|
| SC-1 | All 40 agents resolve to intended models on latest CC (Anthropic API) | Manual `/model` + spawn check per role class |
| SC-2 | Zero CI failures | Contract L1-AG + security suite green in GitHub Actions |
| SC-3 | Zero behavior break on the declared floor CC version | Smoke test passes on floor CC; graceful fallback verified below it |
| SC-4 | docs = code, zero drift, incl. all 3 pre-existing bugs fixed | grep audit: counts 40/17-opus, pm-lead=opus everywhere, PM-T10 corrected |
| SC-5 | No silent mispricing | `token-report.test.js` fable case passes; no Claude-5 ID → `unknown` |
| SC-6 | No silent downgrade | runtime whitelist unit passes for `fable`; advisory published |

### 8.2 GTM / release-notes plan (internal dev-tool scope)

- **Channel**: CHANGELOG.md entry + README advisory block + PR description. No external marketing.
- **Advisory content**: new CC floor + why; provider-specific alias resolution table; the two footguns (`CLAUDE_CODE_SUBAGENT_MODEL`, enterprise `availableModels`); Fable headless-refusal note.
- **Rollout**: single atomic PR (frontmatter + whitelist + runtime + pricing + baselines + docs) so CI never sees a partial state; version number left to maintainer per repo rule.
- **Post-release watch**: monitor issue tracker for S1 (pre-2.1.170) breakage reports and Fable CI-refusal reports; the cc-version-analysis rolling state tracks drift closure.

---

## Attribution

PM framework scaffolding (Context Anchor, JTBD-style VP, segmentation) integrates patterns from [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License), scaled down for an internal developer-tool release. All model facts are sourced from the two research files cited in the header; no facts are re-derived in this PRD.

**Next step**: `/pdca plan claude-model-alignment` (this PRD is auto-referenced by the Plan phase).
