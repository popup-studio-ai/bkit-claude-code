---
template: pm-prd
version: 2.0
feature: s3-polish
date: 2026-05-21
author: kay (메인 세션)
project: bkit
bkit_version: 2.1.18
sprint_id: s3-polish
status: Draft (sprint phase: prd)
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.3
github_issues: ["#103", "#104", "#105"]
absorbed_carryovers: ['CO-S2-1 (lib/util/markdown-parse.js)', 'CO-S2-3 (master plan §7.2 정정)']
---

# S3 — Sprint Report Maturity (PRD)

> **Mission**: pruge 가 v2.1.18 deferred 로 분류한 3 issues (#103/#104/#105) 통합 + sprint report 가 archived sprint 의 *단일 사실원천 (Single Source of Truth)* 산출물이 되도록 maturity 격상.

## Executive Summary (4-Perspective)

| Perspective | Content |
|-------------|---------|
| **Problem** | pruge 가 v2.1.18 sprint 운영 후 발견한 sprint report 의 3가지 maturity 결함: (#103) failure-reporter 가 docs/03-analysis/ 에 gate-fail 보고서를 생성하지만 *resolved 표시* 안함 → archived sprint 후에도 stale "BLOCKED" 잔존. (#104) `/sprint init` 이 master-plan/PRD 의 Context Anchor 를 자동 import 안함 → "(not set)" 으로 reported. (#105) `generateReport` 가 `qualityGates` data 가지고 있어도 KPI Snapshot 만 emit, `## Quality Gates` section 누락 + qualityGates/featureMap/kpi 3개 source 의 SoT 부재 → matchRate `--` 같은 stale data 발생. **결과**: 14 sprint reports 중 12 가 KPI/qualityGates section 누락 (S0 measurement evidence). **S2 의 S0 measurement code-block bug 발견과 같은 layer 의 문제** — instrument (sprint report) 자체가 정확하지 않음. |
| **Solution** | **6 features 통합**: F3-1 failure-reporter resolution marker (A+C 통합: file header prepend + `lastGateFailure.resolvedAt`/`resolvedBy`/`resolutionReason` state field). F3-2 `lib/application/sprint-lifecycle/context-importer.js` — master-plan.md / PRD.md 의 Context Anchor 자동 parse + handleInit 의 fallback chain. F3-3 `generateReport` 의 `## Quality Gates` section + qualityGates SoT precedence (qualityGates > featureMap > kpi) + divergence warning. F3-4 `lib/application/sprint-lifecycle/kpi-resolver.js` (precedence chain pure function). F3-5 carry items rich rationale (featureMap.scope + details 통합). F3-6 lessons learned auto-extraction (iterateHistory.attempts + gate source distribution + lastGateFailure.resolutionReason aggregate). + CO-S2-1: `lib/util/markdown-parse.js` 신설 + stripCodeBlocks 이동. + CO-S2-3: master plan §7.2 inline note 정정. |
| **Function/UX Effect** | (a) 사용자가 archived sprint 의 `docs/03-analysis/<sprint>-gate-fail-*.md` 를 봤을 때 *RESOLVED* header + 해결 timestamp 명시. (b) `/sprint init <id>` 시 master-plan.md / PRD.md 가 있으면 Context Anchor 5 fields 자동 채움 — "(not set)" 회피. (c) `node scripts/sprint-handler.js report <id>` 결과 markdown 에 `## Quality Gates (N gates, M passed)` table + lastMeasuredAt + source 명시. (d) KPI Snapshot 의 matchRate 등 모든 field 가 qualityGates 우선 (kpi field 가 stale 시 자동 정정). (e) carry items 가 "s1Score <N>" 단순 reason 이 아닌 featureMap.<feature>.scope + details aggregated rationale. (f) lessons learned 가 1-liner ("phase exceeded 4h") 가 아닌 multi-aspect aggregated insight. |
| **Core Value** | **sprint report = archived sprint 의 단일 사실원천** 정착. 외부 dogfooder (pruge) 가 archived sprint report 를 봤을 때 sprint state 의 모든 정보가 markdown 으로 *consistent + comprehensive + traceable*. v2.1.18 SQM baseline 측정 시 sprintReportKpiConsistency = 79 (14 reports 중 12 divergence) → v2.1.19 S3 후 *100% target* (모든 report 가 KPI + qualityGates section 포함). bkit-system 의 Docs=Code + Full Visibility 철학의 sprint report 영역 final maturity. |

## Functional Requirements

### FR-1: failure-reporter resolution marker (F3-1, 220 LOC, 8 TC) — Closes #103

- `lib/application/quality-gates/failure-reporter.js` 또는 `lib/application/sprint-lifecycle/advance-phase.usecase.js` 에 resolution marker logic 추가
- **Option A** (file header prepend): advancePhase 성공 후 `sprint.lastGateFailure.reportPath` 가 가리키는 file 의 head 에 `> **STATUS: RESOLVED** at <ISO>` prepend
- **Option C** (state field): sprint.lastGateFailure 에 `resolvedAt`, `resolvedBy`, `resolutionReason` fields 추가
- 두 가지 mechanism A + C **통합** (pruge §Expected suggested fix 와 일치)
- audit emit `gate_fail_resolved` (NEW ACTION_TYPE)

### FR-2: sprint init context-importer (F3-2, 380 LOC, 10 TC) — Closes #104

- `lib/application/sprint-lifecycle/context-importer.js` NEW:
  - `tryImportFromMasterPlan(sprintId, infra)` — 우선 `docs/01-plan/features/<projectId>-*.master-plan.md` 의 "Context Anchor" 섹션 parse
  - `tryImportFromPrd(sprintId, infra)` — fallback to `docs/01-plan/features/<sprintId>.prd.md` / `docs/00-pm/features/<sprintId>.prd.md`
  - `parseContextAnchor(markdownContent)` — regex-based (sprint-master-planner template format 의존)
- `scripts/sprint-handler.js handleInit` 의 context resolution chain 갱신:
  ```
  args.context || tryImportFromMasterPlan || tryImportFromPrd || defaultContext
  ```
- audit emit `sprint_context_imported` (NEW ACTION_TYPE)

### FR-3: generateReport SoT + Quality Gates section (F3-3, 350 LOC, 9 TC) — Closes #105 (main)

- `lib/application/sprint-lifecycle/generate-report.usecase.js`:
  - **renderReport** 에 `## Quality Gates (N gates, M passed)` section 신설 (KPI Snapshot 직후)
  - 11 gates × 6 columns (gate / current / threshold / passed / lastMeasuredAt / source)
  - **defaultKpiCalculator** 의 source precedence: `qualityGates > featureMap > kpi`
  - **divergence warning**: KPI value 와 qualityGates value 가 different 시 console.warn (audit emit `sprint_kpi_divergence`)

### FR-4: KPI Snapshot resolver (F3-4, 180 LOC, 5 TC) — Closes #105 (sub)

- `lib/application/sprint-lifecycle/kpi-resolver.js` NEW (pure function):
  ```js
  function resolveKpi(sprint) {
    return {
      matchRate: sprint.qualityGates.M1_matchRate?.current ?? sprint.kpi.matchRate ?? null,
      criticalIssues: sprint.qualityGates.M3_criticalIssueCount?.current ?? sprint.kpi.criticalIssues ?? 0,
      dataFlowIntegrity: sprint.qualityGates.S1_dataFlowIntegrity?.current ?? null,
      featuresCompleted: Object.values(sprint.featureMap || {}).filter(f => f.completion).length || sprint.kpi.featuresCompleted || 0,
      featuresTotal: (sprint.features || []).length,
      ...
    };
  }
  ```
- Both `generateReport` and `/sprint status` use this resolver — SSoT.

### FR-5: Carry items rich rationale (F3-5, 120 LOC, 4 TC) — Closes #105 (OoS but absorbed)

- `identifyCarryItems` evolution: featureMap.<feature>.scope + featureMap.<feature>.details 통합 → multi-line rationale
- Backward compat: 기존 simple "s1Score <N>" reason 도 fallback

### FR-6: Lessons Learned auto-extraction (F3-6, 250 LOC, 4 TC) — Closes #105 (OoS but absorbed)

- `extractLessons` evolution: aggregate from
  - iterateHistory.attempts (iteration patterns)
  - gate measurement source distribution (어느 agent 가 가장 active)
  - lastGateFailure.resolutionReason (의도된 fix 패턴)
  - phaseHistory durationMs (긴 phase 식별)
- Output: multi-section markdown (lessons by aspect)

### Carry-over absorption

- **CO-S2-1**: `lib/util/markdown-parse.js` 신설, `stripCodeBlocks` + `extractFrontmatter` move (from scripts/check-skills-docs-code-sync.js). F3-2 context-importer 가 본 utility 활용.
- **CO-S2-3**: master plan §7.2 의 inline note 정정 — "3 skills drift" → "1 actual + 2 false positives (S2 F2-2 evolution 으로 진단)". F3-3 작업 후 적용.

## Acceptance Criteria

| # | AC |
|---|-----|
| AC-1 | F3-1 file header prepend verify on test fixture |
| AC-2 | F3-1 sprint.lastGateFailure resolvedAt/resolvedBy/resolutionReason populated |
| AC-3 | F3-2 master-plan.md context import: 5 anchors populated |
| AC-4 | F3-2 PRD fallback: 5 anchors populated |
| AC-5 | F3-2 neither file: defaultContext returned |
| AC-6 | F3-3 generated report has `## Quality Gates` section |
| AC-7 | F3-3 SoT precedence: qualityGates wins when both present |
| AC-8 | F3-4 resolver returns correct schema (5 fields) |
| AC-9 | F3-5 carry items show featureMap context |
| AC-10 | F3-6 lessons multi-section |
| AC-11 | lib/util/markdown-parse.js exports stripCodeBlocks + extractFrontmatter (CO-S2-1) |
| AC-12 | master plan §7.2 patch verified (CO-S2-3) |
| AC-13 | matchRate ≥90, criticalIssueCount=0, sprint archived |
| AC-14 | Closes #103, #104, #105 |

## Dependencies
- ✓ S1 archived (sub-agent dispatch baseline)
- ✓ S2 archived (Docs=Code CI gate enabled, stripCodeBlocks ready for extraction)
- ✓ S4 archived (Hall of Fame committed — pruge expects archived sprint reproducibility)

---

**문서 끝.** PRD complete (~350 lines).
