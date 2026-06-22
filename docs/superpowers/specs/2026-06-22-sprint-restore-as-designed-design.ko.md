# Sprint 시스템 — Restore-As-Designed 수정

**버전:** 1.0.0
**날짜:** 2026-06-22
**상태:** 승인됨 (스펙 검토 대기 중)
**목적:** bkit Sprint 시스템의 문서화된 설계(v2.1.11–v2.1.22)와 실제 구현 사이의 간극을 닫아, 전체 8단계 라이프사이클이 설계대로 종단 간 동작하도록 함 — 수동 JSON 편집이나 조용한 no-op 없이.

**관련 조사 보고서 (`work/sprint-investigation/`):**
- [gate-measurement-findings.md](../../../work/sprint-investigation/gate-measurement-findings.md) — 이슈 #1, #4, #5
- [feature-registration-and-approve-findings.md](../../../work/sprint-investigation/feature-registration-and-approve-findings.md) — 이슈 #2, #3
- [intended-design-map.md](../../../work/sprint-investigation/intended-design-map.md) — as-designed 참조
- [actual-implementation-map.md](../../../work/sprint-investigation/actual-implementation-map.md) — as-built 참조
- [cluster-f-classification.md](../../../work/sprint-investigation/cluster-f-classification.md) — designed-vs-deferred 판정
- [dead-code-and-stubs.inventory.md](../../../work/sprint-investigation/dead-code-and-stubs.inventory.md) — dead-code/stub 인벤토리
- [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md) — 명시적으로 제외된 항목

> 이 파일은 영문 버전(`...design.en.md`)의 한국어 번역이며, 내용은 동일합니다.

---

## 1. 목표, 범위, 그리고 As-Designed 계약

### 목표
Sprint 시스템을 v2.1.11–v2.1.22(ADR, 설계 문서, PRD, 템플릿, 계약 테스트)에 걸쳐 확약된 전체 설계 비전으로 완성. 이전 에이전트들이 스펙과 구현 사이에 문서화된 간극을 남겼으며, 이 작업이 그것을 닫습니다.

### 범위 원칙 (스코프 크립을 막는 선)
- **범위 내** = 설계가 확약했으나(ADR 결정, 설계 문서 섹션, PRD 요구사항, 계약 테스트 기대) 이전 에이전트가 구현하지 않은 모든 것.
- **범위 외** = 설계가 미래/선택/사용자 정의로 명시적으로 연기했거나, 라이프사이클 외 라이브러리 표면인 모든 것. [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md) 참조.

### 범위 내 — 6개 클러스터
| 클러스터 | 내용 | 출처 |
|---|---|---|
| **A. 디스패처 와이어링** | `agentTaskRunner` 생성 + 주입; measure/phase 경로로 라우팅 | 보고된 #1, #4, #5-일부 |
| **B. M8 닭과계란** | plan-exit에서 M8이 plan의 설계 섹션을 측정 | 보고된 #5 |
| **C. 기능 추적** | `featureMap` 채우기; `completion` typedef 수정; S2 계산; `feature add`가 featureMap 작성 | 보고된 #2 |
| **D. 2차 게이트 트랩** | auto-pause가 모든 게이트 점검; `defaultGapDetector`가 가짜 100 반환 중단; archive 게이트 로직 | 빅픽처 맵 |
| **E. 문서** | `--approve` 경고 노출; `gate_fail` 힌트; SCOPE/trust 테이블 조정 | 보고된 #3 |
| **F. 설계됨-미구현 완성** | 설계됐으나 건너뛴 항목 + 새로 발견된 도달 가능 결함 | "그들의 작업 완수" |

### 명시적 범위 외 (설계가 연기한 것, 미완성이 아님)
- **S3_velocity** — 스펙이 사용자 정의/선택으로 표시 (Master Plan §3.7/§12.1; v2113-Sprint-2 §3.3:349).
- **M6/M9** — 명시적 제외 ("미포함... deferred", v2113-Sprint-2 §3.3:349). 스프린트 템플릿에 0회 등장 (`lib/quality/metrics-collector.js` 스펙에만).
- **고아 라이브러리 표면** — `recommendSprintSplit`, `contextSizer`, `syncApiContract`, `syncTestCoverage`, `MatrixSync.clear`, `DocScanner.hasPhaseDoc`. 라이프사이클 외; 별도 위생 패스 후보.
- **죽은 자리표시자 상태 필드** — `dashboardMode`, `manual`, `qaPassRate` (레거시 폴백만), `sprintCycleHours`, `sprint.docs.*`. 채우라고 확약한 설계 없음.
- **테스트 전용 스캐폴딩** — `inMemoryStore`, `noopEmitter`. 올바른 테스트 폴백, 결함 아님.

전체 증거: [out-of-scope.md](../../../work/sprint-investigation/out-of-scope.md).

### 타협 불가 성공 기준
CLI만으로 실행되는 실제 스프린트 — `init → start → 8단계 모두 phase 진행 → measure → iterate → qa → report → archive` — 가 모든 활성 게이트를 실제 산출물에 대해 측정하고, 실제 기능 완료를 추적하고, 실제 보고서 파일을 작성하고, 모든 게이트 점수를 상태에 영속하고, 실제 실패에 일시정지하며, **수동 JSON 편집이 전혀 필요 없음**. 활성 매트릭스의 모든 게이트는 측정 가능하거나 설계에 의해 명시적으로 면제되어야 함.

---

## 2. 아키텍처 & 의존성 주입 수정 (클러스터 A)

코드베이스는 이미 헥사고날 아키텍처를 올바르게 따름. 버그는 순수하게 합성 루트에 있음.

### 현재 (깨진) 흐름
```
CLI → handleSprintAction(action, flags, {})        ← scripts/sprint-handler.js:252에서 리터럴 {}
     → wireAgentAdapters({})                        ← runner 없음 → 어댑터 자동 생성 안 됨
       → handleMeasure가 infra만 받음, agentTaskRunner 없음
         → measure-router가 deps.agentTaskRunner undefined 감지
           → { reason: 'no_agent_runner' } 반환
```

### 수정된 흐름
```
CLI → agentTaskRunner 생성 = ({ subagent_type, prompt }) => <Task 툴 래퍼>
     → handleSprintAction(action, flags, { agentTaskRunner })
       → wireAgentAdapters가 runner 감지 → gapDetector, autoFixer, dataFlowValidator 자동 생성
       → handleMeasure 와 handlePhase 가 runner 받음 (현재 iterate/qa만 받음)
         → measure-router가 sub-agent 디스패치 → 실제 측정
```

### 변경사항 (합성/와이어링 계층만)
1. **CLI 경계에서 runner 생성** (`scripts/sprint-handler.js`). 호스트의 Task-툴 능력을 도메인이 기대하는 `({ subagent_type, prompt }) => Promise<{ output }>` 형태로 래핑. 호스트 환경을 아는 유일한 장소 — 도메인 순수성 보존.
2. **`wireAgentAdapters` 확장** — runner를 measure와 phase 경로로 라우팅 (현재 iterate/qa만).
3. **계약 테스트 업데이트** ([tests/qa/v2116-sprint-measure-command.test.js:242](../../../tests/qa/v2116-sprint-measure-command.test.js)) — 주입된 runner가 실제 측정을 생성한다고 단정. empty-deps → `no_agent_runner` 가드는 별도 단정으로 유지 (해당 조건에서 여전히 올바름), 단 주 계약은 "runner 주입됨 → 측정 성공"이 됨.

### 설계 제약
도메인은 순수하게 유지: `measure-router.js`, 유스케이스, 엔티티는 호스트 특정 코드를 임포트하지 않음. runner는 항상 `deps`로 주입; 합성 루트가 이제 실제로 생성하고 전달. deps를 직접 주입하는 단위 테스트는 변경 없이 통과 — CLI 통합 경로와 계약 테스트만 변경.

**A가 근석(keystone)인 이유:** 다른 모든 클러스터가 동작하는 측정 경로에 의존. D의 auto-pause 수정, F의 M5/M10 라우트, S1 영속 — runner가 종단 간 흐르기 전엔 아무것도 검증 불가.

---

## 3. 게이트 측정 완전성 (클러스터 B, D, F-gates)

게이트 매트릭스를 실제로 측정 가능하고 설계대로 강제하게 만듦.

### 핵심 문제
오늘날 `ACTIVE_GATES_BY_PHASE`는 측정 라우트가 없는 게이트(M5, M10, S2, S4)를 요구하고, auto-pause는 ~10개 게이트 중 2개만 점검. runner를 고쳐도 phase exit이 잘못된 이유로 실패하거나 조용히 통과함.

### 변경사항
**3.1 — M8 닭과계란 (클러스터 B).** plan-exit에서 M8은 아직 존재하지 않는 설계 문서가 아닌 **plan 문서의** 설계-완전성(plan 단계가 생성한 설계 섹션)을 측정. `measure-router.js`의 M8 소스-산출물 해상도와 프롬프트 템플릿 변경. phase 재정렬 없음; 선형 `plan→design` 유지.

**3.2 — M5와 M10 측정 라우트 (클러스터 F-gates).** 출시되지 않은 설계된 라우트를 가진 활성 게이트:
- **M5_runtimeErrorRate** — 설계된 라우트는 qa-monitor live-log 프로브. M5를 `DEFAULT_QUALITY_GATES`에 추가 (현재 부재 → `gate_slot_missing`), 프로젝트 로그에 대해 qa-monitor를 디스패치하는 라우트 추가. **로그 소스가 없으면(라이브러리, 정적 사이트) M5는 `not_applicable`(면제/통과) 반환.** 로그가 있으면 프로브 실행.
- **M10** — 설계된 라우트는 phaseHistory 합. 스프린트 상태에서 파생된 계산 게이트로 와이어링 (sub-agent 없음).

**3.3 — S2 계산 경로.** S2(기능 완료)는 measure-router 코멘트에 따라 "계산됨"이지만 계산 경로가 없음. `featureMap` 완료 상태에서 파생: `S2 = count(completion >= 임계값인 기능) / 전체 기능 * 100` (비율 형태; 임계값 기본 100).

**3.4 — S1 영속 (클러스터 F, 신규 발견).** `handleQA`([sprint-handlers-core.js:318](../../../scripts/lib/sprint-handlers-core.js))가 데이터플로우 검증을 실행하고 디스크 매트릭스를 작성하지만 `sprint.qualityGates.S1_dataFlowIntegrity`는 작성 안 함. 수정: 계산된 `s1Score`를 S1 슬롯에 영속.

**3.5 — Auto-pause 트리거 범위 (클러스터 D).** `auto-pause.js:39-40`이 M3와 S1만 점검. `QUALITY_GATE_FAIL`은 현재 phase의 활성 매트릭스의 **모든** 게이트를 점검해야 함 — `passed === false`인 게이트가 일시정지 발생, 실패한 게이트를 이름 짓는 reason 문자열과 함께.

**3.6 — S4_archiveReadiness (신규, "게이트 없는 공백 없음" 완성).** archive 시점에 계산된 체크리스트-파생 점수로 정의: 보고서-완전성 + 모든 phase 게이트 통과 + carry-item 해결.

### 설계 제약
이 섹션 후, `ACTIVE_GATES_BY_PHASE`의 모든 게이트는 정확히 하나: (a) sub-agent 측정 라우트, (b) 계산/파생 게이트(M10, S2, S4), 또는 (c) 소스 부재 시 `not_applicable`(M5 no-logs). `UNSUPPORTED`이면서 경로 없는 것은 없음. 게이트 임계값, 정의, phase 순서, phase 멤버십은 변경 없음 — 오직 각 게이트가 *어떻게* 측정되는지와 *어떤* 게이트가 auto-pause를 트리거하는지만.

---

## 4. 기능 추적 & 상태 영속 (클러스터 C + F-state)

`featureMap`을 실제로 만들고 계산된 결과를 조용히 버린 상태-작성 간극을 수정.

### 종단 간 유지되어야 할 체인
`features[]` → `featureMap` 채워짐 → 기능별 `completion` → S2 계산 → KPI `featuresCompleted` 정확 → 보고서가 실제 완료 표시. 오늘날 모든 연결이 깨짐.

### 변경사항
**4.1 — init 시와 `feature add` 시 `featureMap` 채우기.** `featureMap`이 `entity.js:243`에서 `{}`로 초기화, 아무것도 작성 안 함. 수정: `createSprint`와 `handleFeature add`가 각각 `features[]` 항목에서 `featureMap[name]` 작성; `feature remove`가 항목 삭제. 두 구조가 구조에 의해 동기화 유지.

**4.2 — `completion` typedef 간극 수정.** `kpi-resolver.js:29`가 `f.completion`을 읽지만, `entity.js:83-85`의 typedef는 `pdcaPhase/matchRate/qa`를 선언. `completion`이 as-designed 형태(s3-polish ADR S3-004, PRD line 68, test TC-F3-4-K3). `completion`을 `SprintFeatureMapEntry`에 추가.

**4.3 — 기능 진행에 따라 `completion` 작성.** 등록 시 `0`으로 초기화, 기능의 PDCA phase 진행에 따라 전진, QA 통과 시 `100`으로 설정. 설계 모호성 폐쇄(S2가 완료 상태에 의존; 작성자가 명시 안 됨).

**4.4 — S2 계산 경로 (3.3과 연결).** 비율 형태: `count(completion >= 임계값) / 전체 * 100`, 임계값 기본 100.

**4.5 — 계산-됨-버려진 결과 영속 (클러스터 F-state).** qa phase 기능별 점수가 `featureMap[name]`으로 환류(`completion` 전진 / `qa: 'pass'` 설정). `handleReport`가 계산한 `featureCompletionRate`가 보고서와 스프린트 KPI 상태 모두에 작성.

**4.6 — `handleReport` 파일 영속 (클러스터 F).** `handleReport`가 `reportDeps={}` 전달 — `fileWriter` 없음 — 으로 `/sprint report`가 렌더링된 마크다운을 버림. 파일 라이터를 주입해 보고서가 `docs/04-report/`에 작성되게 함.

### 설계 제약
`featureMap`과 `features[]`가 쌍둥이 진실의 원천. `features[]` = 선언적 목록(등록됨); `featureMap` = 라이브 상태(진행/완료). 등록과 변이 지점에서 동기화. 완료 로직을 위해 `features[]`를 읽는 것은 없음 — `featureMap`만.

---

## 5. F-나머지, 상태 정확성, 문서 (클러스터 F-remaining + E)

### F-나머지 (이전 에이전트 작업 완수)
**5.1 — `dataFlow` 필드 (Tier-2 검증기).** v2113-Sprint-5 설계 + SC-01 계약 테스트에서 12개 Sprint 엔티티 키 중 하나로 확약. `sprint.dataFlow`를 typedef와 작성자에 추가(qa phase가 `dataFlow[feature]`를 7-layer hop 결과로 채움). `no_matrix_for_feature` 반환 대신 `--static-matrix` 모드가 동작하게 함.

**5.2 — `annotations` 필드.** v2.1.19 s1-foundation에서 확약(PRD FR-5, plan D6/T2). 팩토리가 이미 작성(`entity.js:248`); typedef 누락. `annotations`를 `Sprint` typedef에 추가. 순수 typedef 완성.

**5.3 — skip-iterate `do→qa` 경로.** ADR 0008 Decision 2 + Master Plan §3.2: do-exit에서 `matchRate >= 목표`일 때 iterate 건너뛰고 qa로 감. `computeNextPhase('do')`가 `→ iterate`로 하드코드; matchRate를 존중하도록 수정 — do-exit M1이 목표 충족 시 `qa` 반환, 아니면 `iterate`. 합법적 전환은 이미 `transitions.js`에 존재.

**5.4 — Watch 핸들러 고스트 매트릭스 타입 (클러스터 F, 신규 발견).** `sprint-handlers-core.js:469`가 `MATRIX_TYPES`에 없는 `'cumulative-state'`/`'feature-phase'`를 읽어 `/sprint watch`가 항상 null 보고. **설계를 먼저 점검해 해결**(사용자 결정): 설계된 경우 `MATRIX_TYPES`에 타입 추가, 아니면 핸들러를 실제 타입 읽도록 수정. 구현 계획이 결정 예정.

**5.5 — `handleMasterPlan` 누락된 `taskCreator` + `EventEmitter.flush` (클러스터 F).** `handleMasterPlan`이 `taskCreator` 주입 안 함; CLI 경로가 `EventEmitter.flush` 호출 안 함 — 종료 시 원격측정/이벤트 손실 가능. 의존성 주입; CLI 종료 시 flush.

### 문서 (클러스터 E)
**5.6 — `--approve` 경고 노출.** §10.1.1.1 명확화를 가장 훑어보는 표면으로 이동: §10.1 테이블 행([SKILL.md:173](../../../skills/sprint/SKILL.md))에 한정어 추가("scope only; does NOT bypass gate failures"); 도움말 텍스트([sprint-handlers-admin.js:359](../../../scripts/lib/sprint-handlers-admin.js))가 3-레벨 들여쓰기 하위글머리에서 경로를 끌어올림.

**5.7 — `gate_fail` 힌트 필드.** `gate_fail` 반환 경로(`advance-phase.usecase.js:169`)가 수정 힌트 없이 방출. `/sprint measure <id> --gate <실패-키>`를 가리키는 `hint` 필드 추가.

**5.8 — 충돌하는 테이블 조정.** 세 SPRINT_AUTORUN_SCOPE 테이블이 충돌(코드 vs SKILL.md vs guide/CHANGELOG); `commands/bkit.md:238` Trust Level 테이블이 코드와 다름. **코드가 진실의 원천**; 문서를 맞추도록 업데이트. `skills/sprint/examples/multi-feature-sprint.md:11`의 거짓 `featureMap` 주장 수정.

### 설계 제약
문서가 코드를 따름. 충돌 시 코드가 이김; 문서가 맞추도록 수정. 문서를 만족시키기 위한 행동 변경은 없음.

---

## 6. 슬라이스 순서, 테스트, 롤아웃

### 슬라이스 순서 (각각 독립 검증 가능, 자체 계약 테스트)
| # | 슬라이스 | 의존 | 검증 방법 |
|---|---|---|---|
| 1 | **클러스터 A — 디스패처 와이어링** | 없음 | `/sprint measure <id> --gate M3`이 실제 측정 반환 |
| 2 | **섹션 3 — 게이트 측정 완전성** | 슬라이스 1 | 모든 활성 게이트가 실제 점수 또는 `not_applicable` 반환; auto-pause가 실패 게이트에 발생 |
| 3 | **섹션 4 — 기능 추적 & 상태 영속** | 슬라이스 2 | 3-기능 스프린트가 실제 S2/KPI 숫자 표시, 실제 보고서 파일 작성 |
| 4 | **섹션 5 F-나머지** | 슬라이스 3 | `--static-matrix` 동작; do→qa skip 도달 가능; typedef 완전 |
| 5 | **섹션 5 문서 (클러스터 E)** | 슬라이스 1-4 | 문서가 코드와 일치; `gate_fail`이 힌트 반환 |

**이 순서인 이유:** 슬라이스 1이 근석. 슬라이스 2가 바로 뒤따름 — runner가 동작하는 순간 측정-불가 게이트 벽과 auto-pause 갭이 보이므로. 슬라이스 3은 S2 검증에 게이트 필요. 슬라이스 4는 라이프사이클이 typedef/상태 표면을 사용하므로 이를 완성. 문서가 마지막 — 최종 동작을 설명.

### 테스트 전략
- **계약 테스트 업데이트 (사용자 결정):** 깨진 동작을 잠그는 모든 테스트(`no_agent_runner` 단정, S2=0, featureMap={})가 올바른 as-designed 동정을 단정하도록 업데이트.
- **각 슬라이스가 CLI 경로가 동작함을 증명하는 종단 간 테스트 하나 추가.**
- **끝에 마스터 E2E 테스트 하나:** 수동 JSON 편집 없이 CLI로 실제 스프린트 `init → start → … → archive` — 문자 그대로의 성공 기준.

### 검증 기준
모든 슬라이스 후, 마스터 E2E 테스트가 deps를 직접 주입하는 테스트 없이, `.bkit/state/sprints/<id>.json`을 손편집하는 테스트 없이 통과. CLI 경로만이 모든 것을 구동.

### 롤아웃 / 위험
- 각 슬라이스는 별도의 커밋/PR-크기 변경 — 개별 검토 가능.
- 슬라이스 1-2 최고 위험(합성 루트 + 게이트 모델); 슬라이스 3-5 점진적 저위험.
- 계약-테스트 업데이트는 의도적(사용자 결정)이며 커밋 메시지에 명시.
- 아키텍처 변경 없음 — 헥사고날 계층화 보존. 모든 수정은 설계가 이미 명시한 seam에 존재.

### 이 계획이 하지 않는 것
새 phase 없음, 설계된 것 이상의 새 게이트 없음, 새 에이전트 없음, typedef 완성 이상의 도메인-엔티티 리팩터 없음, 게이트 임계값이나 phase 순서 변경 없음. 오직 v2.1.11–v2.1.22 설계와 그 구현 사이의 간극을 닫을 뿐.

---

## 결정 로그

| # | 결정 | 근거 |
|---|---|---|
| 1 | 범위 = restore as-designed (강화 아님, 게이트-모델 재고 아님) | 아키텍처 발명 없이 의도-대-현실 간극 폐쇄 |
| 2 | 계약 테스트를 의도에 맞게 업데이트 | 테스트가 버그를 잠그고 있었음; 의도는 항상 측정이 동작하는 것 |
| 3 | M8이 plan-exit에서 plan의 설계 섹션 측정 | 선형 plan→design 전환과 일치; phase 재정렬 없음 |
| 4 | 클러스터별 수직 슬라이스 (큰 PR 아님, 최소 #1-#5 아님) | 각 슬라이스가 완전한 실패 모드 폐쇄; whack-a-mole 회피 |
| 5 | 클러스터 F(설계됨-미구현) 범위 내 | 사용자: 이전 에이전트의 미완성 작업 완수 |
| 6 | M5는 로그 없을 시 `not_applicable` 반환 | 범용 도구; 라이브러리/정적 사이트는 로그 소스 없음 |
| 7 | 지금 S4 측정 정의 | "게이트 없는 공백 없음" 보장 완성 |
| 8 | S2 = 비율(완료/전체), 임계값 기본 100 | "기능 완료율" = 기능은 완료되거나 아님 |
| 9 | Watch 고스트 매트릭스 타입: 설계 먼저 점검 | 맹목적 삭제 금지; 설계 의도에 대해 해결 |
| 10 | 문서가 코드를 따름 (코드 = 진실의 원천) | 코드가 동작하는 것; 문서가 맞추도록 수정 |
