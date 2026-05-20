---
template: sprint-master-plan
version: 1.0
description: Sprint Master Plan template — overall sprint orchestration map
variables:
  - feature: v2116-issue-fixes
  - displayName: bkit v2.1.16 — Quality Gates & Approval UX
  - date: 2026-05-20
  - author: bkit user
  - trustLevel: L3
  - duration: 5-7 days
---

# bkit v2.1.16 — Quality Gates & Approval UX — Sprint Master Plan

> **Sprint ID**: `v2116-issue-fixes`
> **Date**: 2026-05-20
> **Author**: bkit user
> **Trust Level (시작)**: L3 (auto-run to report)
> **예상 기간**: 5-7 days
> **Master Plan template**: bkit v2.1.13 (Sprint 4 Presentation 산출)
> **Release Target**: bkit v2.1.16 (from main `b65d336`, branch `feature/v2116-issue-fixes`)
> **Issue Source**: GitHub #92, #93, #94, #95 (reporter @pruge, CC v2.1.140, L2 trust)

---

## 0. Executive Summary

| 항목 | 내용 |
|------|------|
| **Mission** | L2 기본 사용자가 sprint 진행 중 quality gate 에 의해 발생하는 **deadlock 4 종**을 사용자 명시 명령으로 해소할 수 있도록 한다. |
| **Anti-Mission** | (a) Trust Level 자동화 정책 변경 X — L0~L4 정의 그대로 유지. (b) Quality Gate 매트릭스 (M1~M10, S1~S4) 자체 재정의 X — 측정/회복 UX 만 추가. (c) sprint-lifecycle frozen 8-phase enum 변경 X — ADR 0005 invariant 준수. |
| **Core Primitives** | 4 features (sprint-orchestrator-m4-fix / gate-fail-report / sprint-measure-command / sprint-phase-approve) × 8 phases × L3 auto-run × ~600-900 LOC 신규 + ~200 LOC 수정 |
| **Trust Level** | L3 — `stopAfter=report`, archive 만 사용자 명시 필요. design→do 경계는 본 sprint 의 신규 `--approve` 적용 대상 (자기 적용 dogfooding) |
| **Auto-pause 조건** | 4 triggers 활성 (QUALITY_GATE_FAIL / ITERATION_EXHAUSTED / BUDGET_EXCEEDED / PHASE_TIMEOUT) — 본 sprint 는 특히 QUALITY_GATE_FAIL 자기 발생 후 복구 흐름을 dogfooding 으로 검증 |
| **Success Criteria** | 5건 (매트릭스 § 5 참고) — L2 사용자 design→do 진입 성공 + gate_fail 마크다운 자동 생성 + `/sprint measure` 호출 가능 + sprint-orchestrator M4+M8 동시 기록 + zero regression on 117+ tests |

### Mission 한 줄 요약

> **bkit 의 "halt-on-gate, no-recovery" tension 을 사용자 명시 escape hatch (4 종) 으로 해소하면서, Trust Level 자동화 모델의 안전성 invariant 는 그대로 유지한다.**

### 4-Perspective Value

| 관점 | Value |
|------|-------|
| **사용자** | L2 기본 사용자가 trust escalation 없이 sprint 완주 가능 (`--approve`, `/sprint measure`, gate-fail report) |
| **개발자** | quality-gates / sprint-lifecycle 모듈 책임 경계 명확화, 신규 `measure-router` + `failure-reporter` 모듈로 향후 gate 추가 용이 |
| **제품** | bkit v2.1.14 차별화 6/6 + v2.1.15 PostToolUse defense 위에 **"recovery-friendly automation"** 차별화 #7 신규 |
| **운영** | 모든 gate event (passed/failed/measured/scope-bypassed) audit-logger 정규 기록 → 향후 metrics/observability dashboard 데이터 소스 안정화 |

---

## 1. Context Anchor (Plan → Design → Do 전파)

| Key | Value |
|-----|-------|
| **WHY** | 4 open GitHub issues (#92~#95) 모두 동일한 root tension — bkit quality gate 시스템이 워크플로우를 halt 시키지만 사용자가 호출 가능한 회복 경로가 없다. v2.1.14 L2 사용자는 모든 sprint 에서 deadlock 에 도달 (기본 trust level). @pruge (v2.1.14 reporter) 가 trust escalation 우회 / state JSON 직접 편집 등 **bkit 철학을 위반하는 workaround** 만 가능한 상태로 보고. |
| **WHO** | (1) L2 기본 사용자 (대부분의 신규 bkit 사용자, default trust level), 특히 multi-feature sprint 운영자. (2) @pruge (v2.1.14 사용자, CC v2.1.140 환경, L2 trust). (3) bkit core developer (sprint-orchestrator / measure-router / failure-reporter 모듈 유지보수). |
| **WHAT (도메인)** | sprint-lifecycle quality-gate 측정 & 회복 UX. 구체적으로: (a) sprint-orchestrator agent self-assessment 결과 정확한 기록 (#92), (b) gate_fail 시 사용자 가독 가능 마크다운 자동 생성 (#93), (c) 단일 gate 사용자 명령 측정 (#94), (d) L2 scope 경계 사용자 명시 우회 (#95). |
| **WHAT NOT** | Trust Level (L0~L4) 정책 자체 변경 X. Quality Gate 매트릭스 (M1-M10, S1-S4) target 변경 X. 8-phase enum 변경 X (ADR 0005). PDCA 9-phase 영향 X (sprint-lifecycle 단독 변경). CC version 영향 X (CC v2.1.140 환경 무수정 호환 유지). |
| **RISK** | (a) 4 features 모두 `lib/application/sprint-lifecycle/advance-phase.usecase.js` 또는 `lib/application/sprint-lifecycle/quality-gates.js` 를 수정 — 동시 편집 충돌 가능성. (b) `lib/audit/audit-logger.js` ACTION_TYPES enum 확장 — 117+ test files 영향 평가 필요. (c) sprint-orchestrator agent body 수정 → 기존 design-phase 워크플로우 회귀 risk. (d) `--approve` 의미론 오해 (영구 trust escalation 으로 착각) → 문서/CLI UX 명확화 필수. |
| **SUCCESS** | (a) L2 사용자가 `/sprint phase v2116-issue-fixes --approve` 한 줄로 design→do 진입 성공 (no trust escalation). (b) advance-phase.usecase.js 의 `gate_fail` 경로가 호출되면 항상 `docs/03-analysis/<id>-gate-fail-<phase>-<ts>.md` 파일이 작성됨. (c) `/sprint measure v2116-issue-fixes --gate M4` 가 단독 측정 후 sprint.qualityGates 에 정확히 기록. (d) sprint-orchestrator agent 가 design 단계 종료 시 M4+M8 두 게이트 동시 기록. (e) 117+ baseline tests + 신규 18+ tests 전부 PASS. |
| **SCOPE (정량)** | Features 4 / 신규 모듈 3 (failure-reporter / measure-router / measure-gate.usecase) + 수정 모듈 4 (advance-phase / quality-gates / sprint-handler / audit-logger) + 신규 템플릿 1 + agent body 1 + SKILL.md §10.1 / 예상 신규 LOC ~600-900, 수정 LOC ~200, 신규 tests 18+, 기간 5-7 일 (L3 auto-run), 예상 토큰 ~150K |
| **OUT-OF-SCOPE** | (1) `/sprint measure --batch` (다중 gate 일괄 측정) → v2.1.17 carry. (2) gate-fail report HTML/diagram 시각화 → v2.1.17 carry. (3) Issue #94 의 dependency graph 자동 추론 → v2.1.17. (4) `--approve` 이후 audit dashboard UI → v2.1.18. (5) `/control` 명령에 SPRINT_AUTORUN_SCOPE 동적 변경 UX → 별도 sprint. |

---

## 2. Features (sprint 구성 작업 묶음)

| # | Feature | 우선순위 | 상태 | GitHub Issue | 담당 |
|---|---------|--------|------|-------------|------|
| 1 | `sprint-orchestrator-m4-fix` | P0 | pending | [#92](https://github.com/popup-studio-ai/bkit-claude-code/issues/92) | sprint-orchestrator agent + design phase exit hook |
| 2 | `sprint-phase-approve` | P0 | pending | [#95](https://github.com/popup-studio-ai/bkit-claude-code/issues/95) | advance-phase.usecase + sprint-handler CLI |
| 3 | `sprint-measure-command` | P1 | pending | [#94](https://github.com/popup-studio-ai/bkit-claude-code/issues/94) | measure-router + measure-gate.usecase + sprint-handler |
| 4 | `gate-fail-report` | P1 | pending | [#93](https://github.com/popup-studio-ai/bkit-claude-code/issues/93) | failure-reporter + advance-phase 통합 + 템플릿 |

### 2.1 Feature → 파일 영향 → Implementation Notes

#### F1 — `sprint-orchestrator-m4-fix` (P0, Issue #92)

| 항목 | 내용 |
|------|------|
| **변경 파일** | `agents/sprint-orchestrator.md` (lines 96-102, Quality Standards 섹션), `lib/application/sprint-lifecycle/quality-gates.js` (lines 23-32, ACTIVE_GATES_BY_PHASE 주석 보강 — table 자체는 유지) |
| **신규 파일** | 없음 |
| **Implementation 방식** | **Option A 채택 (orchestrator writes both M4+M8)** + Option C 부분 채택 (F3 measure command 으로 외부 보강) |
| **핵심 로직** | design 단계 §14 self-assessment 시 sprint-orchestrator agent 가 (a) M8 designCompleteness §14 체크리스트 기반, (b) M4 designAlignment Design §9 API Contract ↔ 실제 모듈 인터페이스 cross-reference 기반 — **두 값 모두 sprint.qualityGates 에 기록**. |
| **Option B 거부 이유** | "M4 를 design phase gate list 에서 제거" 옵션은 단기 우회책이지만 quality gate 매트릭스의 일관성 (Master Plan §12.1) 을 깬다. M4 = "Design ↔ Implementation alignment" 인데 design phase exit 시 측정 안 하면 의미가 없어진다. |

#### F2 — `sprint-phase-approve` (P0, Issue #95)

| 항목 | 내용 |
|------|------|
| **변경 파일** | `lib/application/sprint-lifecycle/advance-phase.usecase.js` (lines 68-76, Step 2 scope check), `scripts/sprint-handler.js` (lines 319-330, handlePhase + 553 help text), `skills/sprint/SKILL.md` (§10.1 phase row 확장), `lib/audit/audit-logger.js` (ACTION_TYPES 확장) |
| **신규 파일** | 없음 (advance-phase.usecase.js 의 args 시그니처만 확장) |
| **Implementation 방식** | **Option A 채택 (`--approve` flag + 선택적 `--reason`)** |
| **핵심 로직** | (1) handlePhase 가 argv 에서 `--approve` / `--reason` 추출 → advance-phase.usecase 에 args 전달. (2) advance-phase Step 2 에서 `args.approve === true` 면 scope boundary check skip + ACTION_TYPES.scope_boundary_approved audit 기록. (3) approve 는 단일 호출 한정 (persistent state 변경 없음, sprint.trustLevel 무변경). (4) `--reason` 은 audit details 에만 기록. |
| **Option B/C/D 거부 이유** | B (`/sprint approve` 별도 command) 는 두 단계 호출 (approve → phase) 강제로 UX 악화. C (single-step advance implicit approval) 는 명시성 부족 — 위험. D (`--reason` 만) 는 의도 분리 안 됨. A 만이 "단일 호출 + 명시적 의도 + audit 추적" 3 조건 동시 충족. |

#### F3 — `sprint-measure-command` (P1, Issue #94)

| 항목 | 내용 |
|------|------|
| **변경 파일** | `scripts/sprint-handler.js` (switch 209-224 + help 553), `skills/sprint/SKILL.md` (§10.1 신규 row), `lib/audit/audit-logger.js` (ACTION_TYPES 추가) |
| **신규 파일** | `lib/application/quality-gates/measure-router.js`, `lib/application/sprint-lifecycle/measure-gate.usecase.js` |
| **핵심 로직** | measure-router 가 gateKey → 책임 agent 매핑 (M1/M3 → gap-detector, M2/M7 → code-analyzer, M4 → gap-detector against §9 API Contract, M8 → sprint-orchestrator, S1 → sprint-qa-flow). measure-gate.usecase 는 라우팅 + sprint.qualityGates 기록 + ACTION_TYPES.gate_measured audit. CLI 인자: `--gate <key>` / `--gates M4,M8` / `--phase design`. |
| **Trust Level 통합** | L0/L1 에서는 측정 결과 미리보기만 (state 미변경) + 사용자 확인 후 기록. L2+ 자동 기록. |
| **F1 과의 공유** | measure-router 는 F1 의 sprint-orchestrator self-assessment 와 동일한 측정 로직을 외부 호출 형태로 노출. **F1 이 먼저 measure-router 의 M4/M8 분기를 implementation → F3 가 외부 entry point 만 추가** (no duplication). |

#### F4 — `gate-fail-report` (P1, Issue #93)

| 항목 | 내용 |
|------|------|
| **변경 파일** | `lib/application/sprint-lifecycle/advance-phase.usecase.js` (lines 83-85, gate_fail return 직전 failure-reporter 호출 삽입), `lib/audit/audit-logger.js` (gate_failed 재사용, details schema 확장) |
| **신규 파일** | `lib/application/quality-gates/failure-reporter.js`, `templates/gate-failure-report.template.md` |
| **핵심 로직** | failure-reporter 가 (sprint, phase, gateResults, timestamp) 입력 → 마크다운 빌드 → `docs/03-analysis/<sprint-id>-gate-fail-<phase>-<ISO_ts>.md` 작성 → 경로 반환. advance-phase.usecase 는 gate_fail return 객체에 `reportPath` 추가 + sprint.lastGateFailure state 필드 set + ACTION_TYPES.gate_failed audit (`details: { reportPath, gateResults }`). |
| **템플릿 내용** | Issue #93 의 expected behavior 예시 그대로 — Sprint Phase | Gate | Status | Expected | Actual | Suggested Action 6열 표. |
| **F1/F2/F3 의존성** | F4 는 마지막 — F1+F2+F3 완료 후 gate event 데이터가 풍부한 상태 (M4 정확 기록, --approve 시 scope_boundary_approved 별도 기록, gate_measured 시 measurement source 별도 기록) 에서 fail report 가 정확해진다. |

---

## 3. Sprint Phase Roadmap

본 sprint 가 8-phase 를 어떻게 통과하는지 구체화 (frozen enum 준수).

| Phase | 활성 시점 | 본 sprint 산출물 (구체) | Quality Gates |
|-------|---------|------------------------|-------------|
| **prd** | sprint init 직후 | `docs/01-plan/features/v2116-issue-fixes.prd.md` — **Audience**: L2 default-trust bkit 사용자 + bkit core developer. **Job Stories**: "L2 사용자로서 design→do 진입 시 `--approve` 를 사용해 trust escalation 없이 한 줄로 통과하고 싶다" 외 3건. **Pre-mortem**: --approve 의미 오해 / advance-phase 동시 편집 / audit enum 호환성 / 117+ test 회귀. | M8 ≥ 85 |
| **plan** | PRD 후 | `docs/01-plan/features/v2116-issue-fixes.plan.md` — Requirements (FR 12 / NFR 4) + Quality Gates 활성화 명시 + Implementation Order (§12) 반영 + 4 features 의존성 그래프 | M8 ≥ 85 |
| **design** | Plan 후 | `docs/02-design/features/v2116-issue-fixes.design.md` — §9 API Contract (advance-phase 시그니처 확장 / measure-router / failure-reporter 인터페이스) + 코드베이스 분석 (advance-phase.usecase 현 구조 + quality-gates 현 매트릭스) + Test Plan Matrix L1-L5 (18+ TC 정의). **본 sprint 의 dogfooding 핵심**: design→do 전이 시 sprint-orchestrator 가 M4+M8 모두 기록하는지 첫 검증 + `--approve` 자체 적용. | **M4 ≥ 85** + **M8 ≥ 85** |
| **do** | Design 후 | 구현 코드 — 병행 작업 가능 그룹화 (§12 참고): **Layer 1** F1 + F2 (parallel, 다른 파일), **Layer 2** F3 (F1 의 measure-router 재사용), **Layer 3** F4 (F1+F2+F3 enriched data 소비). 117+ baseline test + 18+ 신규 test. | M2 0 critical / M3 0 / M5 ≥ 70 / M7 ≥ 70 |
| **iterate** | matchRate < 100 시 | gap-detector 가 Design §9 API Contract ↔ 실제 모듈 alignment 측정. 본 sprint 는 **matchRate 100% 목표** (4 features 모두 design 명시 인터페이스 그대로 구현). max 5 iterations, 4번째 iteration 이후 forward-fix 결정. | M1 = 100 |
| **qa** | iterate 후 | sprint-qa-flow agent 가 7-Layer S1 dataFlowIntegrity 검증. **본 sprint 핵심 시나리오**: (1) L2 user invokes `/sprint phase --approve` → state 통과 → audit 기록 (Layer 1-7 모두). (2) gate_fail 발생 → markdown report 파일 존재 + sprint.lastGateFailure set + audit. (3) `/sprint measure --gate M4` → sprint.qualityGates 기록 + audit. (4) sprint-orchestrator design exit → M4+M8 모두 기록. | M3 = 0 / S1 = 100 |
| **report** | qa 후 | `docs/04-report/features/v2116-issue-fixes.report.md` — KPI: cycle time / token cost / matchRate / S1 / 117+18 test pass rate / 4 issues closure status. Carry items 명시 (§OUT-OF-SCOPE 5건). L3 stopAfter=report 이므로 사용자 명시 archive 대기. | M10 / S2 / S4 |
| **archived** | 사용자 명시 (`/sprint archive`) | readonly transition. v2.1.16 release tag (`git tag v2.1.16`) + npm publish + GitHub Release notes. PR merge to main. | — |

### 3.1 L3 Trust Level Auto-Run 정책

- `SPRINT_AUTORUN_SCOPE=L3`, `stopAfter=report`
- prd → plan → design → do → iterate → qa → report 전부 auto-advance
- design→do 경계는 **본 sprint 가 만들고 있는 `--approve` flag 의 dogfooding 대상**: design 단계 마지막에 `--approve` 가 구현되지 않은 상태로 진입하면 L2 deadlock 재현. L3 trust 이므로 이 boundary 는 자동 통과 (Step 2 가 L3 에서 trigger 안 됨). **단** 동일한 코드 경로를 L2 시뮬레이션 (`SPRINT_AUTORUN_SCOPE=L2` 임시 set) 으로 do phase 의 manual test 단계에서 검증.
- archive 만 사용자 명시 필요

---

## 4. Quality Gates 활성화 매트릭스

본 sprint 가 직접 stress test 하는 gate 표시 (★).

| Gate | 설명 | Target | prd | plan | design | do | iterate | qa | report | 본 sprint 강조 |
|------|------|--------|-----|------|--------|-----|---------|-----|--------|--------------|
| M1 | matchRate (Design ↔ Code) | =100 | | | | | ✓ | | | |
| M2 | criticalIssueCount | =0 | | | | ✓ | | ✓ | | |
| M3 | securityIssueCount | =0 | | | | ✓ | | ✓ | | |
| M4 | designAlignment | ≥85 | | | **✓★** | | | | | **★ F1 핵심 — orchestrator 가 정확히 기록하는지** |
| M5 | testCoverage | ≥70 | | | | ✓ | | | | |
| M7 | conventionCompliance | ≥70 | | | | ✓ | | | | |
| M8 | designCompleteness | ≥85 | ✓ | ✓ | **✓★** | | | | | **★ F1 — M4 와 동시 기록 검증** |
| M10 | reportQuality | ≥85 | | | | | | | ✓ | |
| S1 | dataFlowIntegrity (7-Layer) | =100 | | | | | | **✓★** | | **★ F2/F3/F4 신규 audit event 의 7-Layer 통과** |
| S2 | sprintCompletion | =100 | | | | | | | ✓ | |
| S4 | crossFeatureConsistency | ≥85 | | | | | | | ✓ | |

### 4.1 핵심 검증 시나리오 (qa phase)

| 시나리오 | 입력 | 기대 출력 | 검증 gate |
|---------|------|----------|----------|
| L2 deadlock 회복 (F2) | `/sprint phase v2116-... --approve --reason "Test"` (L2) | phase 전이 성공 + audit `scope_boundary_approved` 기록 | S1 |
| Gate fail report 자동 생성 (F4) | (강제 M3>0 시나리오) `/sprint phase advance` | gate_fail 반환 + `docs/03-analysis/...md` 파일 존재 + `sprint.lastGateFailure` set | S1 + M3=0 dogfooding |
| Single gate measure (F3) | `/sprint measure v2116-... --gate M4` | sprint.qualityGates.M4 갱신 + audit `gate_measured` | S1 |
| Orchestrator M4+M8 기록 (F1) | design phase 종료 시 self-assessment | sprint.qualityGates.M4 + M8 둘 다 numeric | M4 + M8 |

---

## 5. Success Metrics (5건)

| # | Metric | Target | 측정 방법 |
|---|--------|--------|----------|
| 1 | matchRate (Design ↔ Code) | 100% | gap-detector — Design §9 API Contract 의 4 features 인터페이스 ↔ 실제 모듈 export |
| 2 | criticalIssueCount | 0 | code-analyzer — 신규/수정 ~1100 LOC 대상 |
| 3 | dataFlowIntegrity (7-Layer S1) | 100% | sprint-qa-flow agent — F2/F3/F4 신규 audit events 의 Layer 1-7 (User → CLI → Use Case → Domain → Adapter → State → Audit) 정합 |
| 4 | Test pass rate | 117 baseline + 18 신규 / 135 total = 100% | qa-aggregate scope (lib/application/sprint-lifecycle + lib/application/quality-gates + lib/audit) |
| 5 | 4 GitHub issues closure | 4/4 closed by release | issue body 의 Acceptance Criteria § 11 만족 + PR merge + release tag |

### 5.1 부수 metrics (참고용)

- 신규 LOC: 600-900 (3 신규 모듈 + 1 템플릿)
- 수정 LOC: ~200 (4 기존 모듈)
- 토큰 예상: ~150K (sprint 전체)
- Cycle time: 5-7 일 (L3 auto-run 가정)

---

## 6. Auto-Pause Triggers (4 활성) — Sprint-Specific 임계값

| Trigger | 조건 (본 sprint 설정) | 사용자 결정 옵션 |
|---------|---------------------|----------------|
| QUALITY_GATE_FAIL | M3 > 0 OR S1 < 100 OR M4 < 85 OR M8 < 85 | fix & resume (default) / forward fix / abort |
| ITERATION_EXHAUSTED | iter ≥ 5 AND matchRate < 90 | forward fix / carry to v2.1.17 / abort |
| BUDGET_EXCEEDED | cumulativeTokens > 200K (예상 150K 의 1.33x) | budget 증액 to 250K & resume / abort / archive partial |
| PHASE_TIMEOUT | phase 진행 시간 > 24 시간 (config.phaseTimeoutHours = 24) | timeout 연장 to 48h / force-advance / abort |

### 6.1 본 sprint 의 dogfooding 시나리오

design→do 전이 시 sprint 자신의 `--approve` 가 아직 구현 안 됨 → L3 이므로 Step 2 trigger X (정상 통과). 단 qa phase 에서 L2 시뮬레이션 시나리오 검증 시 의도적으로 QUALITY_GATE_FAIL 또는 scope boundary halt 를 발생시켜 회복 흐름 검증.

---

## 7. Cross-Sprint Dependency

### 7.1 본 sprint 가 받는 의존성

- **bkit v2.1.15 (just released, `b65d336`)**: PostToolUse continueOnBlock + Heredoc-bypass detector + Memory Enforcer Layer 6 — 본 sprint 진행 중 모두 활성 (방어막). 본 sprint 가 audit-logger ACTION_TYPES 확장 시 v2.1.15 Layer 6 audit 와 호환성 유지 필수.
- **bkit v2.1.14 차별화 6/6**: ENH-286 (memory enforcer) / ENH-289 (Defense Layer 6) / ENH-292 (sequential dispatch) / ENH-300 (16 위치 활성) / ENH-303 (PostToolUse continueOnBlock) / ENH-310 (heredoc bypass) — 본 sprint 는 이들을 변경하지 않음.
- **bkit v2.1.13 sprint-lifecycle (frozen)**: 8-phase enum + ADR 0005 + ACTIVE_GATES_BY_PHASE — 본 sprint 가 quality-gates.js 의 매트릭스를 변경하지 않음 (orchestrator 기록 책임만 명확화).
- **CC v2.1.140 환경 호환성**: 99 consecutive PASS — 본 sprint 가 이 호환성을 유지.

### 7.2 본 sprint 가 발생시키는 의존성 (downstream)

- **v2.1.16 release artifact** (git tag + npm publish + GitHub Release)
- **차별화 #7 신규**: "recovery-friendly automation" — 향후 v2.1.17 ~ v2.1.18 에서 batch measure / approval audit dashboard / control 동적 scope 변경 등으로 확장
- **Carry to v2.1.17** (§ 1 OUT-OF-SCOPE 5건): batch measure / HTML report / dependency graph 자동 추론 / approval dashboard / control 동적 scope

### 7.3 Carry from previous sprints

- **v2.1.14 Carry-5** (OTEL Subprocess Env Propagation, ENH-293) — 본 sprint 가 OTEL 환경 손실 영향 받지 않는지 확인 (sprint-handler.js subprocess invocation 시점)
- **v2.1.14 Carry-12** (CTO Team Coordination, ENH-287) — 본 sprint 는 cto-lead 미사용 (단일 sprint-orchestrator dispatch 만)

---

## 8. Risks & Mitigation

| # | 시나리오 | 가능성 | 영향도 | 사전 대응 + 사후 대응 |
|---|---------|-------|-------|----------------------|
| R1 | F2 와 F4 가 `advance-phase.usecase.js` 동시 편집 (lines 68-76 vs 83-85) | 중 | 중 (merge conflict) | **사전**: §12 Implementation Order 에서 F2 먼저 → 머지 → F4 진행 (sequential, NO parallel commits). **사후**: 충돌 시 advance-phase 의 final shape 을 한 commit 에 통합 (atomic). |
| R2 | `audit-logger.js` ACTION_TYPES enum 확장이 117+ test files 회귀 발생 | 중 | 고 (sprint 중단) | **사전**: enum 추가만 (제거/이름변경 X), 기존 16개 type 그대로 유지. 신규 type 추가 시 default fallback 로직 검증 (entry.action). **사후**: qa-aggregate 즉시 실행, 회귀 발견 시 rollback checkpoint 사용. |
| R3 | sprint-orchestrator agent body 수정 → 기존 design-phase 워크플로우 회귀 | 중 | 중 (재실행 비용) | **사전**: §96-102 Quality Standards 섹션만 명세 추가, body Working Pattern 무변경. agent body 변경 후 sample design 1건 dry-run. **사후**: agent 변경 commit revert + 재시도. |
| R4 | `--approve` 의미 오해 (영구 trust escalation 으로 착각) | 중 | 중 (사용자 신뢰 손상) | **사전**: SKILL.md §10.1 + help text 에 "single-use, does not modify trust level or persistent scope" 명시. PRD §Anti-Mission 에도 기술. **사후**: README What's New + 릴리스 노트 강조. |
| R5 | `gate-fail-report` 마크다운이 `docs/03-analysis/` 에 무한 누적 | 저 | 저 (디스크 사용량) | **사전**: 파일명 prefix sprint-id + ISO timestamp → grep/clean 용이. archive 시 readonly 전환 정책 유지. **사후**: v2.1.17 carry 로 retention policy (90d) 검토. |
| R6 | measure-router 가 잘못된 agent 호출 (gateKey → agent 매핑 오류) | 중 | 중 (틀린 측정값 기록) | **사전**: 매핑 테이블을 measure-router.js 상수로 명시 + 18+ tests 중 매핑 테이블 단위 테스트 포함. **사후**: state 무결성 검증 (sprint.qualityGates 의 비정상 값 발견 시 rollback). |
| R7 | L3 auto-run 중 본 sprint 의 design→do 전이가 stuck (자신의 `--approve` 가 아직 구현 안 됨) | 저 | 고 (deadlock) | **사전**: L3 SPRINT_AUTORUN_SCOPE 에서는 Step 2 trigger X (이미 검증). 본 sprint 는 시작부터 L3 으로 시작. **사후**: 만약 L2 로 시작했다면 임시 SPRINT_AUTORUN_SCOPE=L3 escalation 후 진행 (메모 + 종료 후 복귀). |
| R8 | CC v2.1.140 호환성 99 consecutive PASS 깨짐 (본 sprint 가 깨는 변경 도입) | 저 | 고 (regression) | **사전**: 본 sprint 변경 모두 lib/application/sprint-lifecycle 한정, CC 인터페이스 무수정. **사후**: claude plugin validate Exit 0 + hooks.json 21 events 24 blocks 검증 추가. |
| R9 | npm dist-tag drift 영향 (stable v2.1.138 vs latest) — v2.1.16 publish 시점 | 저 | 저 (정보) | **사전**: ADR 0003 적용 14번째 cycle, 절차 안정. **사후**: ENH-290 framework follow-up. |
| R10 | @pruge (issue reporter) 의 v2.1.14 환경에서 v2.1.16 적용 실패 | 저 | 중 (사용자 피드백) | **사전**: PR description 에 upgrade path 명시 (v2.1.14 → v2.1.15 → v2.1.16). 통합 시나리오 테스트 포함. **사후**: GitHub Release notes 에 reproduction steps 추가, follow-up issue 응대. |

---

## 9. Resume / Abort 흐름

| 상황 | 절차 | 본 sprint 적용 메모 |
|------|------|-------------------|
| Auto-pause 후 resume (gate fail) | `/sprint resume v2116-issue-fixes` — 사유 해소 검증 | F4 신규 gate-fail report 파일이 있으면 사용자가 read → fix → `/sprint phase --approve` (해당 시) → resume |
| Auto-pause 후 resume (budget exceeded) | `/sprint resume v2116-issue-fixes --budget 250000` | 200K → 250K 증액 |
| Auto-pause 후 resume (iteration exhausted) | `/sprint iterate v2116-issue-fixes --forward-fix` | 4 features 의 잔존 gap 을 v2.1.17 carry |
| Auto-pause 후 resume (scope boundary, L2 시나리오) | `/sprint phase v2116-issue-fixes --approve --reason "<reason>"` | **본 sprint 의 신규 mechanism 자체** — dogfooding |
| 사용자 abort | `/sprint archive v2116-issue-fixes` — terminal state | report phase 통과 후에만 (L3 stopAfter=report) |
| 부분 abort (1-2 features only) | `/sprint archive v2116-issue-fixes --partial` | OUT-OF-SCOPE → v2.1.17 (현재 미지원 — carry) |

---

## 10. Sprint 추적 (Living document)

본 master plan 은 sprint 진행 중 cumulative KPI 갱신 + phase 전이 시 history append. archived 시 readonly 전환.

### 10.1 갱신 트리거

| 트리거 | 갱신 섹션 |
|--------|----------|
| `/sprint phase advance` 성공 | §3 phase 진행 상태 + §10.2 history |
| `/sprint measure` 호출 | §4 quality gate 측정값 + §10.2 history |
| Auto-pause | §6 trigger 발생 시간 + §10.2 history |
| Resume | §9 resume 사유 해소 기록 |
| Archive | readonly 전환 + §10.2 final history entry |

### 10.2 Sprint History (시작 시점 기준 — 갱신 예정)

```
2026-05-20T00:00:00Z | master-plan created | author=bkit user
2026-05-20T00:00:00Z | branch=feature/v2116-issue-fixes from main b65d336
(...)
```

---

## 11. Acceptance Criteria (per feature)

각 feature 의 closure 조건. GitHub issue 의 Acceptance Criteria / Expected Behavior 섹션을 source of truth 로 한다.

### 11.1 F1 — `sprint-orchestrator-m4-fix` (Issue #92)

| AC | 검증 방법 |
|----|---------|
| AC1 | sprint-orchestrator agent 가 design phase §14 self-assessment 종료 시 sprint.qualityGates 에 **M4 (numeric) + M8 (numeric)** 두 값을 동시에 기록 |
| AC2 | M4 값은 Design §9 API Contract ↔ 실제 모듈 인터페이스 cross-reference 기반 (M8 §14 체크리스트와 별개 측정) |
| AC3 | `advancePhase('design' → 'do')` 호출 시 두 gate 모두 `passed` 상태 → 정상 advance |
| AC4 | quality-gates.js 의 ACTIVE_GATES_BY_PHASE['design'] = ['M4', 'M8'] **무변경** (Option B 거부 확정) |
| AC5 | agent body 변경이 기존 design-phase 워크플로우 회귀 없음 (sample design 1건 dry-run PASS) |

### 11.2 F2 — `sprint-phase-approve` (Issue #95)

| AC | 검증 방법 |
|----|---------|
| AC1 | `/sprint phase v2116-issue-fixes --approve` 명령이 L2 trust level 에서 scope boundary 를 단일 호출로 통과 |
| AC2 | `--reason "<text>"` 선택 인자가 audit details 에 기록 (필수 아님) |
| AC3 | `--approve` 적용은 **단일 호출 한정** — sprint.trustLevel / SPRINT_AUTORUN_SCOPE 변경 없음, 다음 phase 전이는 다시 scope check 발생 |
| AC4 | audit-logger 에 ACTION_TYPES.scope_boundary_approved 신규 추가 + 호출 시 entry 생성 (`details: { fromPhase, toPhase, reason }`) |
| AC5 | SKILL.md §10.1 phase row 에 `--approve` / `--reason` 인자 명시 + help text 업데이트 |
| AC6 | `--approve` 미사용 시 기존 L2 deadlock 동작 그대로 유지 (회귀 없음) |

### 11.3 F3 — `sprint-measure-command` (Issue #94)

| AC | 검증 방법 |
|----|---------|
| AC1 | `/sprint measure v2116-issue-fixes --gate M4` 단일 gate 측정 → sprint.qualityGates.M4 기록 + audit ACTION_TYPES.gate_measured |
| AC2 | `--gates M4,M8` 다중 gate (CSV) 측정 — 본 sprint 범위 내 최소한의 batch (full batch 는 carry) |
| AC3 | `--phase design` phase 활성 gate 일괄 측정 (ACTIVE_GATES_BY_PHASE['design'] 참조) |
| AC4 | gateKey → agent 매핑 (measure-router.js 상수): M1/M3=gap-detector, M2/M7=code-analyzer, M4=gap-detector (vs §9 API), M8=sprint-orchestrator, S1=sprint-qa-flow |
| AC5 | Trust Level 통합: L0/L1 미리보기 모드 (state 미변경), L2+ 자동 기록 |
| AC6 | SKILL.md §10.1 에 `measure` 신규 row + sprint-handler help text 갱신 |
| AC7 | F1 의 M4/M8 측정 로직과 코드 공유 (measure-router.js 단일 SoT) |

### 11.4 F4 — `gate-fail-report` (Issue #93)

| AC | 검증 방법 |
|----|---------|
| AC1 | advance-phase.usecase.js 의 `gate_fail` 분기 진입 시 `docs/03-analysis/<sprint-id>-gate-fail-<phase>-<ISO_ts>.md` 파일 자동 작성 |
| AC2 | 마크다운 내용: Sprint Phase / Gate / Status / Expected / Actual / Suggested Action 6열 표 (Issue #93 example 준수) |
| AC3 | sprint state 에 `lastGateFailure: { phase, gateResults, reportPath, timestamp }` 필드 갱신 |
| AC4 | ACTION_TYPES.gate_failed 기존 enum 재사용 + `details: { reportPath, gateResults }` schema 확장 |
| AC5 | `templates/gate-failure-report.template.md` 신규 템플릿 추가 (실제 데이터 substitution) |
| AC6 | advance-phase return 객체에 `reportPath` 추가 (`{ ok: false, reason: 'gate_fail', gateResults, reportPath }`) |
| AC7 | F1/F2/F3 의 enriched data (M4+M8 정확값, scope_boundary_approved 별도 분리, gate_measured 별도 분리) 가 report 본문에 정확히 표시 |

### 11.5 Cross-feature AC

| AC | 검증 방법 |
|----|---------|
| AC-X1 | 117 baseline test + 18 신규 test 모두 PASS (0 FAIL) |
| AC-X2 | matchRate = 100% (gap-detector) |
| AC-X3 | S1 dataFlowIntegrity = 100% (7-Layer, F2/F3/F4 신규 audit event 포함) |
| AC-X4 | CC v2.1.140 호환성 100 consecutive PASS 유지 (claude plugin validate Exit 0) |
| AC-X5 | bkit v2.1.14 차별화 6/6 무영향 + v2.1.15 PostToolUse defense 무영향 |
| AC-X6 | 4 GitHub issues (#92~#95) closed by PR merge + release tag v2.1.16 |

---

## 12. Implementation Order (PDCA Do-phase 작업 분해)

§ 8 R1 (advance-phase 동시 편집 충돌 위험) 회피를 위한 sequential 실행 순서.

### 12.1 Layer 1 — 병행 가능 (F1 + F2)

**병행 조건**: F1 은 `agents/sprint-orchestrator.md` + `lib/application/sprint-lifecycle/quality-gates.js`. F2 는 `lib/application/sprint-lifecycle/advance-phase.usecase.js` + `scripts/sprint-handler.js` + `lib/audit/audit-logger.js`. **서로 다른 파일 → 병행 안전**.

| Step | Feature | 작업 | 산출물 |
|------|---------|------|-------|
| 1.1 | F1 | sprint-orchestrator agent §96-102 에 "design exit 시 M4+M8 동시 기록" 책임 명세 추가 | agents/sprint-orchestrator.md diff |
| 1.2 | F1 | quality-gates.js 주석 보강 (ACTIVE_GATES_BY_PHASE['design'] 의 M4 측정 책임 명확화) | quality-gates.js diff (logic 무변경) |
| 1.3 | F1 | M4 측정 로직 prototype (sprint-orchestrator self-assessment) | (F3 로 모듈화 예정) |
| 2.1 | F2 | audit-logger ACTION_TYPES.scope_boundary_approved 추가 | audit-logger.js diff |
| 2.2 | F2 | advance-phase.usecase.js Step 2 에 `args.approve` 처리 추가 | advance-phase.usecase.js diff |
| 2.3 | F2 | sprint-handler.js handlePhase 에 `--approve` / `--reason` argv 파싱 추가 | sprint-handler.js diff |
| 2.4 | F2 | SKILL.md §10.1 phase row 에 새 인자 추가 + help text | SKILL.md + help text diff |
| 2.5 | F2 | F2 단위 테스트 (5+ TC): --approve 동작, audit 기록, single-use 보장, --reason 옵션, regression (없을 시 기존 deadlock 유지) | tests/qa/sprint-phase-approve.test.js |
| **M1** | — | **Layer 1 머지 (atomic commit per feature, 두 commit)** | git commit ×2 |

### 12.2 Layer 2 — 순차 (F3)

**의존**: F1 의 M4/M8 측정 로직 prototype 을 measure-router 로 추출 (단일 SoT).

| Step | Feature | 작업 | 산출물 |
|------|---------|------|-------|
| 3.1 | F3 | `lib/application/quality-gates/measure-router.js` 신규 — gateKey → agent 매핑 상수 + dispatch | measure-router.js (신규) |
| 3.2 | F3 | `lib/application/sprint-lifecycle/measure-gate.usecase.js` 신규 — measure-router 호출 + sprint.qualityGates 기록 + audit | measure-gate.usecase.js (신규) |
| 3.3 | F3 | audit-logger ACTION_TYPES.gate_measured 추가 | audit-logger.js diff |
| 3.4 | F3 | sprint-handler.js switch 에 `case 'measure'` + handleMeasure + help text 추가 | sprint-handler.js diff |
| 3.5 | F3 | SKILL.md §10.1 신규 `measure` row 추가 | SKILL.md diff |
| 3.6 | F3 | F1 의 sprint-orchestrator self-assessment 가 measure-router 를 호출하도록 refactor (단일 SoT) | sprint-orchestrator agent + measure-router 통합 |
| 3.7 | F3 | F3 단위 테스트 (8+ TC): gateKey 매핑 정확성, --gate / --gates / --phase 변형, L0/L1 미리보기, L2+ 기록, audit 기록 | tests/qa/sprint-measure.test.js |
| **M2** | — | **Layer 2 머지** | git commit (1-3 atomic) |

### 12.3 Layer 3 — 순차 (F4)

**의존**: F1+F2+F3 완료 후, advance-phase 의 gate_fail 분기에 failure-reporter 통합.

| Step | Feature | 작업 | 산출물 |
|------|---------|------|-------|
| 4.1 | F4 | `templates/gate-failure-report.template.md` 신규 (Issue #93 example 표 구조) | template (신규) |
| 4.2 | F4 | `lib/application/quality-gates/failure-reporter.js` 신규 — 마크다운 빌드 + 파일 작성 + 경로 반환 | failure-reporter.js (신규) |
| 4.3 | F4 | advance-phase.usecase.js line 83-85 에 failure-reporter 호출 통합 (의존성 주입 형태) | advance-phase.usecase.js diff |
| 4.4 | F4 | sprint state 에 `lastGateFailure` 필드 schema 추가 (state-store adapter) | state-store schema diff |
| 4.5 | F4 | audit-logger gate_failed `details` schema 확장 (reportPath 포함) | audit-logger.js diff |
| 4.6 | F4 | F4 단위 테스트 (5+ TC): gate_fail 시 파일 작성, 마크다운 schema, lastGateFailure 갱신, audit details, 템플릿 substitution | tests/qa/gate-fail-report.test.js |
| **M3** | — | **Layer 3 머지** | git commit (atomic) |

### 12.4 Final — Cross-feature qa + release

| Step | 작업 | 산출물 |
|------|------|-------|
| 5.1 | qa-aggregate scope 실행 (117 baseline + 18 신규 = 135 total) | qa report |
| 5.2 | sprint-qa-flow 7-Layer S1 검증 (4 시나리오, §4.1) | qa report |
| 5.3 | `claude plugin validate .` Exit 0 검증 (F9-120 closure 14-cycle) | log |
| 5.4 | bkit.config.json / plugin.json version 2.1.15 → 2.1.16 bump (BKIT_VERSION 5-loc sync) | diff |
| 5.5 | CHANGELOG.md v2.1.16 섹션 추가 (4 issues closure 명시) | CHANGELOG diff |
| 5.6 | README.md What's New v2.1.16 (3-bullet summary) | README diff |
| 5.7 | PR merge to main + `git tag v2.1.16` + GitHub Release notes | release artifact |

### 12.5 Acceptance Gate

§ 11 의 AC-X1 ~ AC-X6 cross-feature acceptance 가 모두 PASS 해야 release.

---

## 13. References

- **GitHub Issues**: [#92](https://github.com/popup-studio-ai/bkit-claude-code/issues/92), [#93](https://github.com/popup-studio-ai/bkit-claude-code/issues/93), [#94](https://github.com/popup-studio-ai/bkit-claude-code/issues/94), [#95](https://github.com/popup-studio-ai/bkit-claude-code/issues/95)
- **Branch**: `feature/v2116-issue-fixes` (from main `b65d336`)
- **Sprint Management Guide**: `docs/06-guide/sprint-management.guide.md`
- **Quality Gates SoT**: `lib/application/sprint-lifecycle/quality-gates.js`
- **Advance Phase Use Case**: `lib/application/sprint-lifecycle/advance-phase.usecase.js`
- **Audit Logger Enum**: `lib/audit/audit-logger.js:31-65`
- **Sprint Handler CLI**: `scripts/sprint-handler.js`
- **Sprint Orchestrator Agent**: `agents/sprint-orchestrator.md`
- **Master Plan Template**: `templates/sprint/master-plan.template.md`
- **Reporter Context**: @pruge (v2.1.14, CC v2.1.140, L2 trust)
- **Previous Sprint**: v2.1.15 PostToolUse defense (PR #91, commit `b65d336`)

---

> **Status**: Draft v1.0 — pending review.
