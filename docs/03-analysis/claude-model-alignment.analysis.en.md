# claude-model-alignment Gap Analysis Report

> **Feature**: claude-model-alignment · **Branch**: `feat/v2.1.25-claude-model-alignment` · **Date**: 2026-07-02
> **Design SoT**: [claude-model-alignment.design.en.md](../02-design/features/claude-model-alignment.design.en.md)
> **Analyzer**: gap-detector (Claude Fable 5) · **Mode**: static analysis (no server → static-only formula)
> **Result**: **Match Rate 100%** (99.6% at first pass; 2 cosmetic gaps fixed in-session) — **PASS** (gate ≥90%, target 100%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Align bkit's 40-agent model designations with the Claude 5 family without breaking older CC. |
| **WHO** | bkit installers by CC version / provider; headless CI users. |
| **RISK** | `model: fable` hard-errors below CC 2.1.170 (R2); L1-AG baseline lockstep. |
| **SUCCESS** | 100% design-implementation match; all gates green; zero docs=code drift. |
| **SCOPE** | 4-tier matrix + whitelists + pricing + baselines + floor advisory + docs sync. |

## 1. Strategic Alignment (PRD→Plan→Design chain)

- PRD core problem (Claude 5 unused; fable inexpressible; doc drift) — **addressed** by the 4-tier matrix + whitelist/pricing/baseline lockstep + 3 doc-bug fixes.
- Plan Success Criteria SC-1..SC-7 — SC-1..SC-5 verified here and by gates (SC-2 additionally live-probed, see §5); SC-6 (CI on push) and SC-7 (release notes in CHANGELOG + draft) pending at Release step; draft exists.
- Design decisions followed: Option C dual floor ✓; Opus-preservation directive ✓ (security-architect / code-analyzer / self-healing / infra-architect / enterprise-expert / bkit-impact-analyst / cc-version-researcher all remain `opus`).

## 2. Verification results by design section

| Design section | Items | Status |
|---|---|:--:|
| §5.1 Frontmatter matrix (all 40 files individually) | 9 fable / 7 opus / 16 sonnet / 8 haiku, exact mapping | ✅ 100% |
| §4 I-1…I-15 interface changes | whitelists, pricing (opus 5/25 fix, haiku 1/5, fable 10/50), _modelClass, RECOMMENDED 2.1.198, FABLE_MODEL_FLOOR 2.1.170, ENH-368 advisory (9 agents + workaround + precedence + single-detect), enh-264 array untouched w/ No-Guessing comment, evals benchmarkModel, SEC-AF-030/013/038/052 (PREMIUM_TIER1 generalization), baselines ×2 dirs model-only | ✅ 100% |
| §3.3 team defaults | ctoAgent 'fable' ×3 sites; teammate 'sonnet' unchanged | ✅ 100% |
| §5.2 tests | token-report 24/24 incl. Claude 5 classing; no stale hardcodes on changed agents | ✅ 100% |
| §5.3 docs (17 surfaces) | counts 40=9/7/16/8 everywhere; pm-lead bug fixed; PM-T10 fixed; CUSTOMIZATION-GUIDE fable + footguns; README model floor; marketplace sentence (keys intact); CHANGELOG `[Unreleased — v2.1.25 provisional]`; release-notes draft | ✅ 100% |
| §6 advisory spec | message essence, boundaries (2.1.143≤v<2.1.170), precedence, fail-open | ✅ 100% |
| §7 security invariants | security-architect/code-analyzer/self-healing never fable | ✅ 100% |

## 3. Gaps found and resolution

| # | Severity | Location | Finding | Resolution |
|---|---|---|---|---|
| G1 | Low (cosmetic, out-of-scope) | evals/ab-tester.js:27 | JSDoc example IDs `claude-sonnet-4-6`/`claude-opus-4-6` | Fixed in-session → `claude-sonnet-5`/`claude-opus-4-8`; `node --check` OK |
| G2 | Low (cosmetic, out-of-scope) | test/performance/ui-render-perf.test.js:102,104 | Synthetic fixture pinned cto-lead/pm-lead to `'opus'` (no assertion; perf timing input only) | Fixed in-session → `'fable'`; test exit 0 |

Correctly unchanged (not gaps): `evals/**/*.yaml` `model_baseline` (historical capture records), token-meter.port.js:22 / token-accountant / cc-regression historical notes (design W-3), enh-264 array (I-9), old-ID test fixtures in regression-history tests.

## 4. Match Rate

Static-only formula `Overall = Structural×0.2 + Functional×0.4 + Contract×0.4`:

| Axis | First pass | After G1/G2 fix |
|---|:--:|:--:|
| Structural | 100% | 100% |
| Functional | ~99% | 100% |
| Contract | 100% | 100% |
| **Overall** | **99.6%** | **100%** |

## 5. Runtime verification evidence (substitutes L1 server tests — CLI plugin)

- **Live probes** (`claude -p --plugin-dir .`, CC v2.1.198, reproduction log R3): gap-detector→`claude-fable-5`, report-generator→`claude-haiku-4-5-20251001`, frontend-architect→`claude-sonnet-5`, security-architect→`claude-opus-4-8[1m]`, pdca-eval-act→haiku. **5/5 match design §8.3**; no Fable safety-classifier refusal.
- **Gate suite (CI mirror)**: domain-purity 0 violations; contract L1+L4 vs v2.1.9 (234) and v2.1.16 (255) PASS; check-guards 24 PASS; check-test-tracking PASS; docs-code-sync 0 drift; check-deadcode PASS; integration-runtime 23/23; l2-smoke 101/101; l2-hook-attribution 13/13; l3-mcp-compat 92/92; l3-mcp-runtime 48/48; L5 invocation-inventory 210/210; bkit-full-system 36/0; docs-code-sync.test 36/36; validate-plugin --strict 0/0; security 55/55; unit token-report/watch/cc-version-checker PASS; e2e cc-min-version 9/9.
- **qa-aggregate vs main baseline**: branch FAIL 26 / ERR 11 vs main FAIL 32 / ERR 13 — **zero failures introduced; net −6 FAIL / −2 ERR** (remaining failures pre-exist on main or are worktree-env artifacts).

## 6. Verdict

**PASS at 100% — proceed to QA phase.** All design promises realized: Docs=Code, dual floor with graceful ENH-368 advisory, Opus-strength preservation, lockstep whitelists/baselines/assertions, corrected Claude 5 pricing.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial analysis (99.6% → 100% after G1/G2 in-session fixes) | PDCA pipeline (gap-detector) |
