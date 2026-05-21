---
template: plan
version: 2.0
feature: s3-polish
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s3-polish
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.3
---

# S3 — Sprint Report Maturity (Plan)

## 0. Scope
- 6 features × 1,500 LOC × 40 TC
- Closes #103/#104/#105
- Absorbed CO-S2-1 (markdown-parse util) + CO-S2-3 (master plan §7.2 정정)

## 1. Implementation Order (Topological)

| # | Sub-task | LOC | TC | Feature |
|---|----------|-----|----|---------|
| T1 | `lib/util/markdown-parse.js` NEW (stripCodeBlocks + extractFrontmatter + parseFrontmatterField) | 90 | 0 | CO-S2-1 |
| T2 | `scripts/check-skills-docs-code-sync.js` use lib/util/markdown-parse.js | 30 | 0 | CO-S2-1 |
| T3 | `lib/audit/audit-logger.js` ACTION_TYPES +3 (gate_fail_resolved, sprint_context_imported, sprint_kpi_divergence) | 30 | 0 | F3-1/F3-2/F3-3 |
| T4 | `lib/application/sprint-lifecycle/context-importer.js` NEW (parse + try chain) | 280 | 0 | F3-2 |
| T5 | `test/unit/sprint-lifecycle/context-importer.test.js` (10 TC) | 200 | 10 | F3-2 |
| T6 | `lib/application/sprint-lifecycle/kpi-resolver.js` NEW (pure precedence chain) | 120 | 0 | F3-4 |
| T7 | `test/unit/sprint-lifecycle/kpi-resolver.test.js` (5 TC) | 110 | 5 | F3-4 |
| T8 | `lib/application/sprint-lifecycle/generate-report.usecase.js` MODIFIED (renderReport + identifyCarryItems + extractLessons + use kpi-resolver) | 350 | 0 | F3-3/F3-5/F3-6 |
| T9 | `test/unit/sprint-lifecycle/generate-report-sot.test.js` (9 TC) | 220 | 9 | F3-3 |
| T10 | `lib/application/quality-gates/failure-reporter.js` MODIFIED (resolveOnSuccess) OR new lib/application/sprint-lifecycle/resolve-gate-fail.js | 180 | 0 | F3-1 |
| T11 | `lib/application/sprint-lifecycle/advance-phase.usecase.js` MODIFIED (call resolveOnSuccess after successful transition) | 50 | 0 | F3-1 |
| T12 | `test/unit/quality-gates/failure-reporter-resolution.test.js` (8 TC) | 160 | 8 | F3-1 |
| T13 | `test/unit/sprint-lifecycle/generate-report-carry-rationale.test.js` (4 TC, F3-5) | 100 | 4 | F3-5 |
| T14 | `test/unit/sprint-lifecycle/generate-report-lessons-auto.test.js` (4 TC, F3-6) | 100 | 4 | F3-6 |
| T15 | `scripts/sprint-handler.js handleInit` use context-importer | 30 | 0 | F3-2 |
| T16 | master plan §7.2 inline note 정정 | 10 | 0 | CO-S2-3 |
| **Total** | | **~2,060** | **40** | |

Topological 순서: T1 → T2 → T3 → (T4,T6 parallel) → (T5,T7) → T8 → T9 → T10 → T11 → T12 → (T13,T14) → T15 → T16.

## 2. Quality Bar
M1≥90, M2≥80, M3≤0, M4≥95, M5≤1, M7≥90, M8≥85, M10≤16h, S1=100, S2=100, S4=true.

## 3. Risk Register

| # | Risk | Mit |
|---|------|-----|
| R-1 | F3-2 master-plan parser regex breaking on edge templates | sprint-master-planner template 의 stable schema 의존; multiple regex 시도 fallback |
| R-2 | F3-3 generateReport 변경이 기존 14 reports format 의 backward compat | renderReport 의 새 section 은 *append only* (기존 sections 위치 변경 안함) |
| R-3 | F3-1 file mutation race (concurrent advancePhase + report generation) | atomic write (tempfile + rename) |
| R-4 | F3-4 KPI resolver 의 SoT precedence 가 사용자 override 차단 | precedence는 *default*, 사용자 explicit override flag 미지원 (out-of-scope) |
| R-5 | T1 markdown-parse.js 가 다른 곳에서 차후 동일 logic 중복 작성될 위험 | T2 에서 즉시 check-skills-docs-code-sync.js 가 활용 verify |

## 4. CTO Redline (약식)
- BLOCKER 0
- MEDIUM 2:
  - T8 generateReport 변경이 sprint state schema 추가 (lastGateFailure.resolvedAt 등) — entity.js 의 default 도 사전 update (T8 시작 직전 entity.js patch)
  - T10 의 failure-reporter location: 기존 `lib/application/quality-gates/failure-reporter.js` 가 *없을 수도* (코드 확인 필요). 만약 없으면 sprint-lifecycle 에 new module.
- MINOR 1: T15 handleInit 의 context-importer call 시 async 동기화 — 기존 handleInit 가 이미 async 이므로 OK.
- APPROVAL: APPROVE.

---

**문서 끝.**
