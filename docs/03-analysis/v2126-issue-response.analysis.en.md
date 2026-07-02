# v2126-issue-response Gap Analysis Report

> **Feature**: v2126-issue-response · **Branch**: `feat/v2.1.26-issue-response` · **Date**: 2026-07-02
> **Design SoT**: [v2126-issue-response.design.en.md](../02-design/features/v2126-issue-response.design.en.md)
> **Analyzer**: gap-detector (Claude Fable 5) · **Mode**: static content verification + orchestrator git-level guard confirmation
> **Result**: **Match Rate 100%** (99% at first pass; 1 Minor local-state finding resolved in-session; 2 iterate fixes for test-lock conflicts) — **PASS** (gate ≥90%, target 100%)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | A plugin that verifies AI code against specs must not greet developers/cloners with failed MCP servers; tooling/governance must match current CC reality. |
| **WHO** | bkit developers + cloners (MAIN); maintainers (release script); all devs (state integrity). Marketplace users unaffected. |
| **RISK** | validate-pass ≠ load-pass (packed smoke = acceptance); isolation refactor touches shared lib paths. |
| **SUCCESS** | Repo cwd clean MCP state; installed plugin:bkit:* ✔; release --dry-run green; 5 suites leave .bkit byte-identical; CI green. |
| **SCOPE** | Design I-1..I-17 + §4.1 unchanged-guards + §5 sweeps. |

## 1. Verification results (I-1..I-17)

All 17 items ✅ with file:line evidence (full table in the Check-phase agent report):

- **MAIN (I-1..I-4)**: plugin.json:20-31 inline `mcpServers` byte-matches design §3.1 (version untouched); root `.mcp.json` absent; MS suite re-pointed + NEW args-hardening (`hasPluginRootArgs`) + MS-016 no-root-file lock citing R1; smoke claims consistent (live re-run in QA).
- **F1 (I-5, I-6)**: release script step 6 = always `git tag -a` with informational pipefail-safe `plugin tag . --dry-run`; steps 1-5/gh-notes/exit codes preserved; cc-version-checker comment records the `{name}--v{version}` transition (value 2.1.118 kept — map semantics + test pin justification).
- **Governance (I-7..I-9, I-15)**: ADR 0011 Amendment 1 (subset-not-mirror policy verbatim → Plan FR-04 satisfied-by-design; whitelist frozen at 21 keys); ADR 0015 bilingual pair (4 grounding facts); eval SOP bilingual pair (zero-LLM-calls fact, freeze statement, no eval.yaml edits); 45-skills notes ×2.
- **F4 (I-10..I-14)**: additive `projectRoot` injection through batch-orchestrator (`_resolveProjectRoot` default preserved), sprint dispatcher deps-first resolution (`sprint-handler.js:213-239` — the original drop point), audit-logger `opts.projectRoot` (arity preserved) + telemetry adapter + 9 direct call sites + active-skill-marker; 5 suites tmp-rooted; guard test `bkit-state-isolation.test.js` (22 TC, unit-hash + meta child-process levels).
- **Wrap (I-16, I-17)**: CHANGELOG `[Unreleased — v2.1.26 provisional]` with ENH-369; local `.bkit` cleanup done (2 real features only; sprint registry/batch fixtures purged).

## 2. §4.1 unchanged-guards — CONFIRMED at git level (orchestrator)

| Guard | Evidence |
|---|---|
| Contract baselines byte-identical (both dirs) | `git status test/contract/baseline/` empty |
| `servers/**` untouched | `git status servers/` empty |
| `hooks/hooks.json` untouched | `git status hooks/hooks.json` empty |
| `evals/**` frozen | `git status evals/` empty |
| Version fields untouched | plugin.json / bkit.config.json / marketplace.json all 2.1.25 |

## 3. Gaps found and resolution

| # | Severity | Finding | Resolution |
|---|---|---|---|
| G1 | Regression (found via qa-aggregate diff vs main) | `v2113-sprint-3` B-02 asserted the frozen infra-bag shape; I-11 added `projectRoot`/`injectedProjectRoot` metadata | Test amended with I-11 citation (4 adapters unchanged + 2 metadata fields) → 66/66 |
| G2 | Regression (same diff) | `v2113-sprint-4` INV-03 "Sprint 3 baseline files untouched" lock conflicted with the approved I-12 telemetry-adapter change | Lock amended: telemetry adapter removed from the baseline list with governance citation (design I-12 + CHANGELOG) → 38/41 (remaining 3 = pre-existing on main: ENG-01/H-01/AUDIT-01) |
| G3 | Minor (local, non-shipped) | `test-feature` fixture re-appeared in `.bkit/state/pdca-status.json` during the full qa-aggregate run — written by a non-isolated suite OUTSIDE FR-07's designed scope (candidates inventoried in the Do report) | Removed via `deleteFeatureFromStatus`; residual isolation candidates recorded as follow-up |

## 4. Match Rate

Static formula `Overall = Structural×0.2 + Functional×0.4 + Contract×0.4`:

| Axis | First pass | Final |
|---|:--:|:--:|
| Structural | 100% | 100% |
| Functional | 98% (I-17 partial) | 100% |
| Contract | 100% | 100% |
| **Overall** | **99%** | **100%** |

## 5. Verification evidence

- 22-gate CI-mirror suite ALL GREEN (contract 222/243 assertions, L5 212/212, MS 16/16, isolation guard 22/22, security 55/55, l2-smoke 101/101, l3 92+48, full-system 36/0, docs-code-sync 0 drift, validate-plugin --strict 0/0).
- qa-aggregate: FAIL 25 / ERR 10 after G1/G2 fixes — **equal to main baseline (zero introduced failures)**; earlier +2/+1 delta fully attributed and resolved.
- Live evidence already captured in Do: repo-cwd `claude mcp list` zero bare entries/diagnostics (SC-1); `--plugin-dir .` inline-manifest tool call OK (SC-2a); clean-clone release `--dry-run` EXIT=0 (SC-3). QA re-verifies.

## 6. Verdict

**PASS at 100% — proceed to QA phase.**

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | Initial analysis (99% → 100% after G1/G2 lock amendments + G3 cleanup) | PDCA pipeline (gap-detector) |
