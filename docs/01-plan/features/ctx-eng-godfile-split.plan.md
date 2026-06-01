# S3a — Context-Eng Simplification: God-File Split 계획서 (PRD + Plan)

> **Sprint**: `ctx-eng-godfile-split` (마스터 플랜 S3a) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 (사용자 지시; master plan 권고 L2 — simplicity invariant gate로 안전 강제)
> **Scope**: P1 · **ENH**: ENH-343 ~ ENH-348 · **dependsOn**: S4(완료) · **estTokens**: ~75K
> **Date**: 2026-06-02 · **Author**: kay kim · **실행방식**: god-file 1개씩 commit 체크포인트(반파 금지)

---

## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Context Engineering 과복잡 — god-file(>700 LOC) 4개가 진입장벽·디버깅 비용·유지보수성을 악화. 분할로 단순화하되 **capability·계약 100% 보존**. |
| **WHO** | bkit 컨트리뷰터(god-file 유지보수자), 유지보수성. |
| **WHAT** | 4 god-file을 cohesive 모듈로 분할: sprint-handler 1509 / state-machine 985 / automation 770 / unified-stop 751. (audit-logger 689·gap-detector-stop 602·trust-engine 577은 <700, monitor only.) |
| **WHAT NOT** | capability 제거형 축소 · 226 contract assertion baseline 변경 · export/시그니처 변경 · 동작 변경 · lib subdir 증가(>22). |
| **RISK** | **최고위험** — god-file 분할이 226 assertion 또는 M1-M10/S1-S4 gate 파괴. 완화: (1) simplicity invariant(§8) gate, (2) 매 분할마다 contract-test-run L1+L4 + check-deadcode + 전 test suite comm(회귀 0), (3) 1개씩 commit 체크포인트, (4) behavior-preserving 추출(함수 이동 + re-export, 로직 불변). |
| **SUCCESS** | god-file(>700) **0개** · 최대 단일 ≤700(가급 ≤500) · 226 assertion **= 226** · 전 gate green · lib subdir ≤22 · capability 보존 · 회귀 0. |
| **SCOPE** | ENH-343~348, ~75K. gate M1,M3,M4,S1 + simplicity invariant. |

---

## 2. 실측 기준선 (2026-06-02)

- god-file(>700): **4개** — `scripts/sprint-handler.js`(1509), `lib/pdca/state-machine.js`(985), `lib/pdca/automation.js`(770), `scripts/unified-stop.js`(751).
- lib subdirs: **22** (증가 금지), lib modules: **188** (S3a 분할로 ↑, S3b 통합으로 상쇄 — 순증 ≤+10 목표는 S3a+S3b 합산).
- contract assertion baseline: **226** (불변).

## 3. ENH 상세
- **ENH-343**: `scripts/sprint-handler.js`(1509) 분할 — 38 함수를 cohesive 모듈로(trust/gates/dogfood/lifecycle handlers/helpers). **최고위험, 마지막 실행.**
- **ENH-344**: `lib/pdca/state-machine.js`(985) 분할 — STATE_TRANSITIONS 정의 테이블 추출.
- **ENH-345**: `lib/pdca/automation.js`(770) 분할 — `buildNextActionQuestion`(~245줄) 등 question 빌더 추출.
- **ENH-346**: `scripts/unified-stop.js`(751) 분할 — lazy-require dep getter 추출. **최저위험, 첫 실행.**
- **ENH-347**: audit-logger/gap-detector-stop/trust-engine(<700) 모니터 — 분할 강제 아님(이미 ≤700). 기록만.
- **ENH-348**: simplicity invariant 최종 검증(§8 전 지표).

## 4. 실행 순서 (위험 오름차순, 각 commit 체크포인트)
1. unified-stop.js (751, 최저위험) → 검증+commit
2. automation.js (770) → 검증+commit
3. state-machine.js (985) → 검증+commit
4. sprint-handler.js (1509, 최고위험) → 검증+commit
각 단계: 분할 → `node --check` → contract-test-run L1+L4(226) → check-deadcode → 전 test comm(회귀 0) → 해당 god-file ≤700 확인 → commit.

> **Status**: Plan 완료 — design phase.
