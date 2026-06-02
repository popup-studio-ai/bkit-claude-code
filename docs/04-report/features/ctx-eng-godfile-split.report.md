# S3a — Context-Eng Simplification: God-File Split 완료 보고서

> **Sprint**: `ctx-eng-godfile-split` (마스터 플랜 S3a) · **Trust**: L4 · **ENH**: ENH-343~348
> **Date**: 2026-06-02 · **Branch**: `release/v2.1.22-hardening`
> **Phase**: prd→plan→design→do→iterate→qa→report→archived (8-phase 완주, 체크포인트 4분할)

---

## 1. Executive Summary

bkit의 god-file(>700 LOC) **4개를 0개로** 분할했다. 모두 **behavior-preserving 추출**(함수/데이터 verbatim 이동 + re-export, 로직 1바이트 불변)으로, 공개 API·226(실측 255) contract assertion·전 quality gate를 100% 보존했다. 1개씩 commit 체크포인트로 진행해 반파 상태를 남기지 않았고, 매 분할마다 contract L1+L4 + check-deadcode + 전 회귀를 통과(회귀 0)했다.

## 2. 분할 결과 (god-file 4 → 0)

| god-file | before | after | 추출 대상 → 신규 모듈 | 커밋 |
|----------|--------|-------|----------------------|------|
| `scripts/unified-stop.js` | 751 | **693** | lazy-dep getter 10 → `scripts/lib/unified-stop-deps.js` | `2c49218` |
| `lib/pdca/automation.js` | 770 | **451** | AskUserQuestion 빌더 3 → `lib/pdca/automation-questions.js` | `e43bb0f` |
| `lib/pdca/state-machine.js` | 985 | **406** | STATES/EVENTS/TRANSITIONS/GUARDS/ACTIONS → `lib/pdca/state-transitions.js` | `43d47a2` |
| `scripts/sprint-handler.js` | 1509 | **271** | helpers→shared, 14 core handlers, 6 admin handlers (4-모듈 분해) | `cec28c4` |

**신규 모듈(6)**: unified-stop-deps / automation-questions / state-transitions / sprint-handler-shared / sprint-handlers-core / sprint-handlers-admin. 모두 ≤700(최대 sprint-handlers-admin 541).

## 3. Simplicity Invariant (§8) 최종 검증 — 전부 충족

| 지표 | Baseline | Target | 결과 |
|------|----------|--------|------|
| god-file (>700 LOC) | 4 | **0** | ✅ **0** |
| 최대 단일 파일 LOC | 1509 | ≤700 | ✅ **541** |
| lib subdir | 22 | ≤22 | ✅ **22** (신규는 scripts/lib/·lib/pdca/, subdir 무증가) |
| lib module 순증 | 188 | ≤+10 | ✅ **190** (+2: automation-questions, state-transitions; sprint-handler 분할은 scripts/lib/) |
| contract assertion | 255/234 | 불변 | ✅ **255(v2.1.16)/234(v2.1.9)** 전 단계 PASS |
| quality gates | 전부 | green | ✅ 전부 |

## 4. 핵심 기법 & 안전장치

- **문자열-마커/함수명 기반 verbatim 추출**(node 스크립트) → 수작업 복사 오류 0. dry-run으로 cut 지점·LOC·"39함수 정확히 1회 배정"을 사전 검증 후 기록.
- **자기완결성 sanity check**: split#3에서 `_checkChromeMcpAvailable` 누락을 sanity가 사전 차단 → 함께 이동으로 수정.
- **inline require 경로 rebase**: scripts/lib/로 이동 시 함수 본문의 lazy `require('../lib/...')` 14곳을 `../../lib/...`로 교정(누락 시 런타임 `Cannot find module` → trust action 검증에서 포착·수정).
- **순환참조 회피**: shared ← handlers ← dispatcher (단방향). 핸들러 상호 무호출 확인으로 모듈 경계 안전.
- **체크포인트**: 4분할 각각 독립 commit(반파 미커밋).

## 5. QA 결과 (실런타임 — 정적 분석만으로 끝내지 않음)

| 항목 | 결과 |
|------|------|
| 4분할 각 contract L1+L4 | **255/234 PASS** 전 단계 |
| dispatcher 실동작 | help/list/status/measure/trust(idempotent noop) 정상 |
| sprint-handler 전용 test | **6/6 PASS** (trust/dogfood/annotate/registration/default-level/agents-tools) |
| state-machine 전용 test | **4/4 PASS** |
| CRLF/parser(자동) | — |
| check-deadcode | **Dead(NEW)=0** 전 단계 |
| verify-full-system | module **190/190**, hook syntax **73/73**, agent **40/40**, hooks.json **25/25** PASS |
| 회귀 | **0** (4분할 각 baseline 7 동일) |

> verify-full-system OVERALL FAIL은 F(7 pre-existing test fail) + K(v2114 sprint state missing)뿐 — S2 때와 동일한 **pre-existing**, 본 분할과 무관.

## 6. Quality Gates
M1=100 · M2=92 · M3=0 · M4=100 · M5=0 · M7=95 · M8=90 · M10=1.0h · S1=100 · S2=100 · S4=true + **simplicity invariant 충족** — 전부 green.

## 7. 한계 & Carry
- 신규 6 모듈은 `scripts/lib/`·`lib/pdca/` 기존 디렉터리에 배치(subdir 무증가). S3b에서 추가 통합·재배치 검토 가능.
- audit-logger(689)/gap-detector-stop(602)/trust-engine(577)은 <700이라 god-file 아님(ENH-347 monitor only, 분할 안 함).

> **Status**: Report 완료 — archived. 다음 unblocked: **S3b** (layer/pipeline consolidation, L2 권고).
