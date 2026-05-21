---
template: plan
version: 2.0
feature: s4-proactive
date: 2026-05-21
author: kay (메인 세션, 약식 cto-lead redline)
project: bkit
bkit_version: 2.1.18
sprint_id: s4-proactive
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.4 + §15.4
---

# S4 — External Dogfooder Lifecycle (Plan)

## 0. Scope (PRD 압축)
- 4 features × 1,580 LOC × 12 TC × ENH-318 정식 편입
- Budget ≤8h (master plan §14, 450K tokens)
- Closes: (no GitHub issues — proactive/governance work)
- carry CO-S0-4 absorption (response rate 100% evidence inline)

## 1. Implementation Order (Topological)

| # | Sub-task | LOC | TC |
|---|----------|-----|----|
| T1 | `lib/audit/audit-logger.js` ACTION_TYPES +1 (`external_feedback_tracked`) + JSDoc | 15 | 0 |
| T2 | `lib/control/external-feedback-tracker.js` (NEW — pure compute + gh wrapper) | 320 | 0 |
| T3 | `scripts/_v2119-s4-feedback-refresh.js` CLI runner (manual refresh + audit emit) | 70 | 0 |
| T4 | `.bkit/state/external-feedback-tracker.json` initial schema + write smoke | 0 | 0 |
| T5 | `test/unit/control/external-feedback-tracker.test.js` 3 TC | 130 | 3 |
| T6 | `lib/control/trust-engine.js` 7-component 확장 — 기존 components 0.95 비례 + externalDogfoodFeedbackResponseRate 0.05 | 100 | 0 |
| T7 | `test/unit/control/trust-engine-7component.test.js` 5 TC (worked example + Δ ≤5% verify + AC-1/AC-2) | 180 | 5 |
| T8 | `docs/external-dogfooders/_README.md` (NEW — lifecycle + benefits + 5-stage diagram) | 80 | 0 |
| T9 | `docs/external-dogfooders/pruge.md` (NEW — contribution history + 10 issues × evidence + Hall of Fame entry) | 120 | 0 |
| T10 | `README.md` "Real User Hall of Fame" + "bkit Early Adopter Program" sections (APPEND) | 50 | 0 |
| T11 | `.claude-plugin/marketplace.json` description dogfooder narrative APPEND (DA-2) | 20 | 0 |
| T12 | `CHANGELOG.md` "External Dogfooder Contributions" appendix template (future hook) | 30 | 0 |
| T13 | F4-3 docs verification | 0 | 2 (TC-F4-3-D1/D2 — README + pruge.md grep) |
| T14 | `test/e2e/external-dogfood/dandi-100-orchestrator-task-tool.test.js` | 100 | (1 TC, part of 2) |
| T15 | `test/e2e/external-dogfood/dandi-101-trust-mutation.test.js` | 100 | (1 TC) |
| T16 | `test/e2e/external-dogfood/dandi-102-trust-alias.test.js` | 100 | (1 TC) |
| T17 | `test/e2e/external-dogfood/dandi-107-skill-md-path.test.js` | 130 | (1 TC) |
| T18 | `test/e2e/external-dogfood/dandi-general-l1-workflow.test.js` | 150 | (1 TC, F4-4 의 5번째 — combined 2 TC for F4-4) |
| **Total** | | **~1,595** | **12** (3+5+2+2) |

LOC 합계 ~1,595 (estimate 1,580 + 15) — 정직한 gross.

## 2. Test Plan

L1 unit: 8 (T5 + T7) — trust-engine + external-feedback-tracker
L2 contract: 0 (no schema invariant beyond TS-7)
L3+L4 E2E: 4-5 (T13~T18 — docs verify + dandi scenarios)

Total: 12 TC (PRD §10 AC-8 5 + AC-9 mandatory 1 audit + AC-1/AC-2 worked example 등 cumulative).

## 3. Risk Register

| # | Risk | Mit |
|---|------|-----|
| R-1 | gh API rate limit during T2 — sample query 시점 | NFR-4 partial failure path; warn + continue |
| R-2 | Trust 7-comp 정규화의 Δ >5% surprise | T7 worked example verify; CO-B v2.1.20+ recalibration |
| R-3 | pruge dandi e2e tests need real CC nested Task | --skip-on-no-cc fallback (S1 F1-1 패턴) |
| R-4 | README markdown 충돌 (existing structure) | T10 append-only, no existing section replace |
| R-5 | marketplace.json description char limit | T11 trim if needed; verify after edit |

## 4. Quality Bar
M1≥90, M2≥80, M3≤0, M4≥95, M5≤1, M7≥90, M8≥85 (이미 93), M10≤8, S1=100 (architectural noop), S2=100 (4/4), S4=true.

## 5. CTO Redline (약식)
- BLOCKER 0
- MEDIUM 1: T6 의 weight 정규화가 *기존 사용자 가산 점수* 변동 — 모든 사용자 surprise Δ ≤5% 보장 필요 (TC-F4-1-U3)
- MINOR 1: T11 marketplace.json description 의 backward compat — JSON schema 검증
- APPROVAL: APPROVE with CONCERNS

## 6. Next phase
M4 measure (PRD ↔ Plan signature 일치) + advance plan → design.

---

**문서 끝.**
