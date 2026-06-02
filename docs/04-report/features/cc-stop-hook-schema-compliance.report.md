# S6 — CC Stop Hook Output Schema Compliance 완료 보고서

> **Sprint**: `cc-stop-hook-schema-compliance` (마스터 플랜 S6) · **Trust**: L4 · **ENH**: ENH-361~366
> **Date**: 2026-06-01 · **Branch**: `release/v2.1.22-hardening`
> **Phase**: prd→plan→design→do→iterate→qa→report→archived (8-phase 완주)
> **편입 경위**: S2 완료 후 사용자 `/sprint list` 실행 중 Stop hook 검증 에러 → 심층 분석 후 신규 P0 sprint로 활성 편입.

---

## 1. Executive Summary

bkit 5개 Stop emitter가 CC 현재 strict Stop validator에 의해 reject되던 **systemic P0 결함**을 해소했다. 진원은 `cc-payload.port.js`의 잘못된 `decision` 타입 계약(`allow|deny|ask|defer`)이 전 emitter에 전파된 것. 모든 emitter를 CC-compliant 출력(`{decision:'block', reason}` surface / `{}` clean stop)으로 전환하고, 공유 헬퍼로 단일화했으며, 영구 contract test + cc-regression monitor로 재발을 차단했다. **5/5 emitter 런타임 스키마 통과, 회귀 0.**

## 2. 근본 원인 → 수정 (RC ↔ ENH)

| RC | 결함 | 수정 (ENH) |
|----|------|-----------|
| RC0 | `cc-payload.port.js:26` `decision` 타입 오류 → 전파 진원 | **ENH-361**: typedef 정정(`decision:'approve'|'block'` ↔ `permissionDecision:'allow'|'deny'|'ask'` 분리 + JSDoc 계약 명시) |
| RC1 | `decision:'allow'`(Stop은 approve\|block) | **ENH-362**: 5 emitter `decision:'block'`(surface)/생략(allow) 전환 |
| RC2 | Stop 미지원 `hookSpecificOutput`(additionalContext/sessionTitle/userPrompt) | **ENH-362/363**: 제거, content→`reason`, options 텍스트 직렬화 |
| RC3 | 스키마 밖 root 필드(skillResult/autoTrigger/iterationResult/analysisResult) | **ENH-362**: 제거 → `debugLog` 진단으로 이동 |

## 3. 변경 요약 (10 파일)

- **ENH-361**: `lib/domain/ports/cc-payload.port.js` — HookOutput typedef 정정.
- **ENH-364**: `lib/core/io.js` — `outputStopSurface(reason)`(=`{decision:'block',reason}`) + `outputStopAllow()`(=`{}`) 단일 SoT 헬퍼 신설·export.
- **ENH-362/363**: 5 emitter 전환 —
  - `scripts/sprint-skill-stop.js` (buildResponse: surface→`{decision:'block',reason}`, no-surface→`{}`, catch→`{}`; 미사용 formatAskUserQuestion import 제거)
  - `scripts/pdca-skill-stop.js` (2 site → outputStopSurface/outputStopAllow)
  - `scripts/plan-plus-stop.js` (response + no-feature 경로 → outputStopSurface/outputStopAllow)
  - `scripts/iterator-stop.js` (response → outputStopSurface)
  - `scripts/gap-detector-stop.js` (response → outputStopSurface)
- **ENH-365**: `tests/contract/v2122-stop-hook-output-schema.test.js` (신규) — 5 emitter 출력 CC Stop 스키마 contract 가드. `test/unit/sprint-skill-stop.test.js` 정정(옛 버그 shape→compliant shape, 20/20).
- **ENH-366**: `lib/cc-regression/registry.js` — `MON-CC-NEW-STOP-SCHEMA-STRICT`(HIGH) 등록(R3-321과 동일 클래스, bkit S6 resolved).

## 4. QA 결과 (실런타임 — 정적 분석만으로 끝내지 않음)

| Level | 검증 | 결과 |
|-------|------|------|
| L1/L2 런타임 | 5 emitter 실제 실행 → 출력 스키마 검증(키 집합·decision enum·금지 필드) | **31/31 PASS** |
| L2 e2e | sprint-skill-stop unit (unified-stop dispatch + marker consume 포함) | **20/20 PASS** |
| L3 회귀 | 변경 전/후 suite `comm` 비교 | **회귀 0** (7 pre-existing fail 전후 동일) |
| L4 정적 | 변경 .js 전수 syntax | ALL PASS |
| L5 contract | 신규 contract test (영구 가드) | **exit 0** |

**대표 출력 검증** — `gap-detector-stop` 실행 결과: `{"decision":"block","reason":"Gap Analysis complete..."}` (이전: `(root): Invalid input` reject). read-only sprint 경로: `{}` (clean stop).

## 5. Quality Gates

M1=100 · M2=92 · M3=0 · M4=100 · M5=0 · M7=95 · M8=90 · M10=0.4h · S1=100 · S2=100 · S4=true — **전부 green**.

## 6. 한계 & Carry

- **sessionTitle on Stop 상실**: CC Stop 스키마 미지원으로 Stop 출력에서 제거. 창 제목은 `hooks/session-start.js`(F1/ENH-326 공식 지원) SessionStart·resume 경로로 일원화. #111 Phase B의 per-Stop title 갱신은 상실(영향 LOW — 제목은 세션 단위 안정). **carry**: 필요 시 SessionStart 측 title 강화 후속 검토.
- **CC 강화 도입 버전 미상**: v2.1.159에서 confirmed, 정확한 strict-validation 도입 버전은 reconcile cycle에서 핀포인트(monitor `since:2.1.159` TODO).
- **AskUserQuestion 주입**: Stop 스키마에 직접 필드 없음 → options를 `reason` 텍스트로 직렬화(Claude가 읽고 제시). 구조화 AskUserQuestion 자동호출은 불가(CC 한계).

## 7. 영향 (4종 부채 중 1종 해소)
bkit Stop-hook 기반 UX(executive summary 강제 노출 + next-step) 전체가 현재 CC에서 다시 동작. 외부 dogfooder의 동일 에러 차단. ADR 0011(plugin manifest) 계보에 hook-output 스키마 준수 추가.

> **Status**: Report 완료 — archived. 다음 unblocked: **S4** (tech-debt-deadcode).
