---
template: plan
version: 2.0
feature: s0-sqm-baseline
date: 2026-05-21
author: kay (메인 세션 thinking + cto-lead 약식 redline)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: plan)
sprint_id: s0-sqm-baseline
predecessor_prd: docs/00-pm/features/s0-sqm-baseline.prd.md
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §23 step 0
---

# S0 — v2.1.18 Baseline SQM Measurement (Plan)

> **Sprint phase**: plan (PRD 후)
> **Implementation 진행 방식**: PDCA 9-phase 내부 cycle, 모든 산출물은 sprint container 8-phase 와 매핑
> **CTO redline 대상**: 본 plan 의 § 2 (Implementation Order) + § 4 (Risk + Mitigation)
> **Backward refs**: PRD § 3 FR-1 (`lib/quality/sqm-calculator.js` signature), PRD § 9.2 (Outputs)

---

## 0. Scope (PRD 압축)

| 항목 | 값 |
|------|---|
| Mission | v2.1.18 시점 sprint domain maturity 를 6-axis weighted SQM 으로 정량 측정 |
| Anti-Mission | SQM evolve / dashboard / history append (모두 S5 작업) |
| Total LOC est. | ~480 (`sqm-calculator.js` 280 + `_v2119-s0-measure.js` 80 + analysis md 120) |
| Total TC est. | 6 (TS-1~TS-6 from PRD §6) |
| Phase budget | ≤ 8h (PRD §11 metric 5) |

---

## 1. 의존성 매트릭스 (Topological order)

| # | Item | Depends on | Reason |
|---|------|-----------|--------|
| D1 | `lib/quality/` directory existence | bkit baseline structure | 이미 존재 (lib/quality/gate-manager.js + metrics-collector.js + regression-guard.js) |
| D2 | `lib/quality/sqm-calculator.js` new file | D1 | new file at existing dir |
| D3 | `scripts/_v2119-s0-measure.js` | D2 | requires sqm-calculator.js |
| D4 | `.bkit/runtime/sqm-baseline.json` | D3 run | runtime output |
| D5 | `docs/03-analysis/v2118-sqm-baseline.analysis.md` | D4 | human-readable rendering of D4 |
| D6 | master plan §7.2 patch (조정 시) | D5 결정 | manual decision |
| D7 | audit `sqm_baseline_measured` emit | D3 run | side-effect |

선형 path: D1 (이미 충족) → D2 → D3 → D4 → D5 → D6 (선택) + D7 (side-effect, D3 와 동시)

---

## 2. Implementation Order (sub-tasks within sprint do phase)

| # | Sub-task | LOC | TC | Owner | 검증 방법 |
|---|----------|-----|----|-------|----------|
| T1 | `lib/quality/sqm-calculator.js` skeleton — 6 component functions stub + computeSqm + module.exports | 120 | 0 | 메인 | `node -e "require('./lib/quality/sqm-calculator.js')"` 정상 로드 |
| T2 | `measureConventionContractTestPassRate` — fs.existsSync(`test/contract/baseline/skills-convention.json`) → true 면 100, false 면 0 | 30 | 1 | 메인 | TS-3 component independence |
| T3 | `measureSubAgentDispatchSuccessRate` — `.bkit/audit/*.jsonl` 의 sprint_event sub-agent dispatch count / success count | 60 | 1 | 메인 | replay v2.1.18 audit (실측 0) |
| T4 | `measureSprintSelfDogfoodRunRate` — 최근 5 release (v2.1.14~v2.1.18) 의 master plan + sprint state existence 체크 | 60 | 1 | 메인 | docs/01-plan/features/v211{4-8}*.master-plan.md + .bkit/state/sprints/ |
| T5 | `measureSprintReportKpiConsistency` — sprint report 의 KPI snapshot vs qualityGates divergence count | 60 | 1 | 메인 | v2.1.18 sprint report (PDCA-with-sprint-shadow 모드 → n/a 처리) |
| T6 | `measureDocsCodeSyncRate` — 44 skills × SKILL.md frontmatter / declared paths invariant | 100 | 1 | 메인 | 44/44 vs 43/44 vs 다른 |
| T7 | `measureExternalDogfooderFeedbackResponseRate` — `gh api repos/popup-studio-ai/bkit-claude-code/issues?creator=pruge` 24h fix 비율 | 80 | 1 | 메인 | gh CLI |
| T8 | `computeSqm` — 6 component 호출 + weighted sum + result schema | 80 | 0 | 메인 | T2-T7 합 |
| T9 | `scripts/_v2119-s0-measure.js` — one-shot runner + audit emit | 80 | 0 | 메인 | `node scripts/_v2119-s0-measure.js` 실행 |
| T10 | `.bkit/runtime/sqm-baseline.json` runtime output verify | 0 | 0 | 메인 | JSON validity + schema |
| T11 | `docs/03-analysis/v2118-sqm-baseline.analysis.md` 작성 (PRD §13 decision tree 반영) | 120 | 0 | 메인 | human-readable + decision recommendation |
| T12 | master plan §7.2 patch (조정 필요 시) | varies | 0 | 메인 | git diff master plan |
| T13 | audit emit verify (sqm_baseline_measured) | 0 | 1 | 메인 | TS-5 |
| **Total** | | ~480 LOC | 6 TC | | |

Implementation 순서: T1 → T2 (가장 단순) → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13

각 sub-task 완료 시 `git status` 확인 + 다음 sub-task 진입.

---

## 3. Test Plan

### 3.1 L1-L5 Test Matrix

| Layer | Tests | Coverage |
|-------|-------|----------|
| L1 Unit | T2~T7 각각의 component function 단독 호출 (input → expected output) | 6 functions |
| L2 Contract | computeSqm result schema (PRD §3 FR-1) | 1 |
| L3 Integration | `scripts/_v2119-s0-measure.js` run → JSON + analysis md + audit emit | 1 |
| L4 E2E | TS-1 (reproducibility) + TS-2 (read-only) + TS-3 (component independence) | 3 |
| L5 Regression | 본 S0 자체가 S5 의 first regression test (sqm-calculator evolve 가 backward compat) | 1 (future) |

### 3.2 Test files

- `test/unit/quality/sqm-calculator.test.js` — L1 Unit (6 tests)
- `test/contract/baseline/sqm-result-schema.test.js` — L2 Contract (1 test)
- `test/e2e/sqm-baseline/measure.test.js` — L3 + L4 E2E (4 tests, TS-1~TS-3 + TS-5)

총 11 test cases. PRD §11 metric 의 "≥90% matchRate" 충족 목표.

### 3.3 Test invocation

```bash
node test/unit/quality/sqm-calculator.test.js
node test/contract/baseline/sqm-result-schema.test.js
node test/e2e/sqm-baseline/measure.test.js
# Expected: all PASS
```

---

## 4. Risk & Mitigation (PRD §7 Pre-mortem 보강)

### 4.1 Updated Risk Register

| # | Risk | 확률 | 영향 | Mitigation | Owner |
|---|------|------|------|------------|-------|
| R-1 (PM-1) | baseline 부정확 (inflated) | M | H | TS-3 + raw data 명시 + cto-lead redline | 메인 |
| R-2 (PM-2) | GitHub API rate limit | M | M | partial failure handling (NFR-4) + token 사전 verify | T7 owner |
| R-3 (PM-3) | sqm-calculator design 이 S5 evolve incompatible | L | M | FR-1 signature future-proof + S5 F5-1 design 명시 | 메인 + S5 F5-1 design 시점 |
| R-4 NEW | M8 designCompleteness gate 가 design phase 에서 fail (PRD/Plan 만 작성, design.md 미완료 시점) | M | M | design phase 도 정성스럽게 작성 + measure-gate UC stub mode 활용 | 메인 |
| R-5 NEW | Audit emit `sqm_baseline_measured` action type 가 ACTION_TYPES 에 미등록 → audit-logger reject | H | L | T9 시점 ACTION_TYPES 확인 + 필요 시 추가 (v2.1.19 S3 audit completeness 와 일관) | 메인 |
| R-6 NEW | `node scripts/_v2119-s0-measure.js` 가 sprint state 에 phaseHistory 변경 없이 archive 됨 → PDCA 9-phase 의 archive phase 미진입 | L | L | S0 archive 시 명시적 sprint-handler archive 명령 | 메인 |

### 4.2 Mitigation 검증 시점

R-5 (audit ACTION_TYPES) — T9 작성 직전 `grep "ACTION_TYPES" lib/audit/audit-logger.js` 로 사전 검증.

---

## 5. Quality Bar (sprint M-series + S-series)

| Gate | Threshold | Source | 본 sprint 적용 |
|------|-----------|--------|---------------|
| M1 matchRate | ≥90 (iterate exit: 100) | gap-detector | Check phase |
| M2 codeQualityScore | ≥80 | code-analyzer | Do/QA phase |
| M3 criticalIssueCount | ≤0 | code-analyzer | Do/QA phase |
| M4 apiComplianceRate | ≥95 | gap-detector | design phase (PRD §3 schema vs implementation) |
| M5 runtimeErrorRate | ≤1 | qa-monitor (stub) | QA phase |
| M7 conventionCompliance | ≥90 | code-analyzer | Do phase |
| M8 designCompleteness | ≥85 | sprint-orchestrator | design phase |
| M10 pdcaCycleTimeHours | ≤8 (S0 의 자체 target) | system | report phase |
| S1 dataFlowIntegrity | =100 | sprint-qa-flow | QA phase (단, S0 가 stateless infra 작업이므로 N/A 처리 가능) |
| S2 featureCompletion | =100 | featureMap | QA/report |
| S4 archiveReadiness | =true | system | report → archived |

### 5.1 S1 dataFlowIntegrity 적용 가능성

S0 는 `lib/quality/sqm-calculator.js` + measure script + analysis md 작업 — UI → API → DB hop 이 없음. S1 7-Layer 측정 부적합. **N/A 처리** (sprint-qa-flow가 7-Layer hop 부재 인식 시 0 hops measured 로 보고).

---

## 6. Deliverable Mapping (PRD §9.2 cross-ref)

| PRD §9.2 Output | Plan sub-task | Phase |
|----------------|---------------|-------|
| `lib/quality/sqm-calculator.js` | T1-T8 | do |
| `scripts/_v2119-s0-measure.js` | T9 | do |
| `.bkit/runtime/sqm-baseline.json` | T10 | do (runtime output) |
| `docs/03-analysis/v2118-sqm-baseline.analysis.md` | T11 | report |
| master plan §7.2 patch (조정 시) | T12 | report |
| `docs/01-plan/features/s0-sqm-baseline.plan.md` | (본 문서) | plan |
| `docs/02-design/features/s0-sqm-baseline.design.md` | (다음 phase) | design |
| `docs/04-report/features/s0-sqm-baseline.report.md` | (다음 phase) | report |
| audit `sqm_baseline_measured` | T13 | side-effect of T9 |

---

## 7. 다음 phase advance 조건

본 plan 완료 시:
1. Plan PASS — M8 designCompleteness 측정 (design phase 도 함께 작성 후 한 번에 측정 가능)
2. sprint phase: `plan` → `design` 자동 advance (L4 full-auto)
3. `docs/02-design/features/s0-sqm-baseline.design.md` 작성 (FR-1 signature 의 detailed schema + 6 component 의 implementation pseudocode)

---

## 8. CTO Redline (약식, 본 S0 가 작은 작업이므로 cto-lead invoke 생략, 메인 thinking 으로 redline)

### 8.1 BLOCKER (0건)

해당 없음.

### 8.2 MEDIUM (2건)

- **CR-M-1**: PRD §3 FR-1 의 `measureSubAgentDispatchSuccessRate` 가 .bkit/audit/*.jsonl 의 어떤 event type 을 success/failure 로 카운트할지 불명확. → **Resolution**: T3 작성 시 `category=sprint AND action LIKE '%dispatch%'` 또는 `actorId LIKE 'sprint-orchestrator%'` 기준 정의 (design phase 에서 명시).
- **CR-M-2**: PRD §3 FR-1 의 `measureExternalDogfooderFeedbackResponseRate` 가 "pruge" hardcoded — multi-dogfooder 확장 시 generic 화 필요. → **Resolution**: S0 단계는 pruge 만 측정 (현재 N=1, master plan §15.4 DA-4 에서 N≥2 시점 generic 화 carry).

### 8.3 MINOR (1건)

- **CR-N-1**: Plan §2 의 implementation order 가 component dependency 가 아닌 difficulty 순서 — 동등한 dependency 라 OK 이지만 design phase 에서 dependency 명시 권장.

### 8.4 APPROVAL

**APPROVE** — BLOCKER 0건. MEDIUM 2건 모두 design phase 에서 resolution. Plan 충분.

---

## 9. Living document

본 plan 은 design phase 에서 §1 Topological order 의 D2 (sqm-calculator.js) 의 detailed structure 가 명시되면 갱신. Do phase 진행 중 sub-task 별 실측 LOC/TC 가 estimate 와 ±20% 이상 격차 시 본 plan 갱신.

---

**문서 끝.** Plan complete. Design phase 진입 준비.
