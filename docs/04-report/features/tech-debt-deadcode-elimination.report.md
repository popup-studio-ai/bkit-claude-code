# S4 — Tech-Debt & Dead-Code Elimination 완료 보고서

> **Sprint**: `tech-debt-deadcode-elimination` (마스터 플랜 S4) · **Trust**: L4 · **ENH**: ENH-336~342
> **Date**: 2026-06-01 · **Branch**: `release/v2.1.22-hardening`
> **Phase**: prd→plan→design→do→iterate→qa→report→archived (8-phase 완주)

---

## 1. Executive Summary

S4는 bkit의 데드코드를 **전수 실측**으로 검증했고, 그 결과 **제거할 dead code가 0건**임을 확정했다. 마스터 플랜의 추정(pdca-eval 6 stub / test skip 19~491 / TODO 5 / dead module / orphan script)은 모두 raw-match 과대집계였다. 모든 후보가 live(계약 요구 / CI 호출 / test 의존 / CLI 진입점 / 문서화 도구)였다. 핵심 산출물은 삭제가 아니라 **pdca-eval 6 stub 영구 유지 거버넌스 결정 + 향후 오삭제 방지 lock 주석**이다. 회귀 0.

## 2. 전수 실측 결과 (추정 교정)

| ENH | 추정 | 실측 (도구/근거) | 판정 |
|-----|------|-----------------|------|
| 336 pdca-eval 6 stub | 제거 검토 | v2.1.9+v2.1.16 baseline 등재 + L4 규칙 + `deprecatedIn:v2.1.13`. 제거=L4 FAIL+immutable baseline 훼손 | **유지 확정** |
| 337 test skip | 19/491 | `\b\.skip\b`=0, `.only`=0, `xit(`=0(412는 `process.exit(` 오매칭) | dead 0 |
| 338 TODO | 5 | 1건(S6 의도적 forward-TODO) | 유지 |
| 339 dead lib module | 검토 | check-deadcode Dead=0 (188: 141 live/47 exempt) | dead 0 |
| 340 orphan script | 검토 | 7후보 전부 CI(.github)/CLI/test/docs 참조 | orphan 0 |
| 340 stale state | 검토 | .bkit/state gitignored 로컬 전용 | 릴리스 무관 |

## 3. ENH-336 거버넌스 결정 (핵심 산출물)

**pdca-eval-* 6 stub 영구 유지 확정.** 근거 체인:
1. `contract-test-run.js runL4Deprecation()`: baselined agent가 `agents/`에 없고 `deprecatedIn` stub도 없으면 `L4 FAIL`.
2. v2.1.9 + v2.1.16 `_MANIFEST.json` 모두 6 등재(grep 확인), 현재 L4 PASS(exit 0 양 baseline).
3. 제거 = 역사 immutable baseline 2개 훼손(금지) + `Active+Deprecated===agents+6` 불변식 파괴.

**구현**: `lib/domain/rules/docs-code-invariants.js`의 `EXPECTED_DEPRECATED_AGENT_NAMES`에 **거버넌스 lock 주석** 추가 — baseline/L4 근거 + "S4 제거 검토 → 유지 확정" 명시로 향후 유지보수자 오삭제 방지. (유일한 코드 변경, 값/export 불변.)

## 4. Removal Manifest (ENH-341)

**총 안전 제거: 0건.** 후보별 live 근거는 design §2 manifest 참조. bkit 코드베이스는 이미 청결(141 live module + 47 exempt + 0 dead, 0 disabled test, 0 orphan, contract green).

## 5. QA 결과 (실런타임 검증)

| Level | 검증 | 결과 |
|-------|------|------|
| L1 | docs-code-invariants 값 불변(6 deprecated/34 active, 불변식 true) | PASS |
| L4 contract | L4 deprecation governance(v2.1.9+v2.1.16) | **exit 0** (both) |
| L4 deadcode | check-deadcode Dead(NEW)=0 | PASS |
| L3 회귀 | suite 변경 전/후 `comm` | **회귀 0** (7 pre-existing 동일) |
| L5 | 변경 모듈 syntax + require 로드 | PASS |

## 6. Quality Gates
M1=100 · M2=95 · M3=0 · M4=100 · M5=0 · M7=95 · M8=90 · M10=0.5h · S1=100 · S2=100 · S4=true — **전부 green**.

## 7. 한계 & Carry
- `scripts/sync-folders.js`: `.claude/`→root 동기화 도구(test 의존+문서화). 현 dual-folder 아키텍처에서 사용 여부의 deprecation 판단은 dead-code 제거가 아닌 **tooling 정책 결정** → S4 범위 밖(별도 검토 가능, 현재는 live/tested로 유지).
- export-level dead code(live 모듈 내 미사용 export): bkit `check-deadcode`는 module-level. export-level 정밀 분석은 `test/architecture/export-completeness.test.js`가 일부 커버. 심층 export 감사는 후속 가능(현 도구상 0 dead).
- 로컬 scratch `.bkit/state/sprints/sc05-test.json`: gitignored, 릴리스 무관. housekeeping 선택.
- pdca-eval stub의 최종 retirement(역사 baseline까지 정리)는 **별도 ADR + 새 baseline 스냅샷 cut 시점**에만 가능(v2.1.22 범위 아님).

> **Status**: Report 완료 — archived. 다음 unblocked: **S3a** (god-file split, L2 수동).
