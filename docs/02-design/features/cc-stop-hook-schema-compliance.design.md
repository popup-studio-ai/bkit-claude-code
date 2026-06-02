# S6 — CC Stop Hook Output Schema Compliance 설계서

> **Sprint**: `cc-stop-hook-schema-compliance` (S6) · **Trust**: L4 · **ENH**: ENH-361~366
> **Date**: 2026-06-01 · **선행**: plan + `docs/03-analysis/features/cc-stop-hook-schema-compliance.analysis.md`

---

## 1. 설계 원칙

1. **단일 SoT 헬퍼**: 모든 Stop 출력은 `lib/core/io.js`의 신규 헬퍼를 경유 → 5 emitter 직접 JSON 조립 제거(이원화·재발 차단).
2. **의도 보존 > 필드 보존**: `additionalContext`/`userPrompt`(비표준)를 버리되 그 기능(요약 노출 + next-step 선택)은 `decision:"block"`+`reason`으로 보존.
3. **무회귀**: emitter의 side-effect(state machine/metrics/audit)는 불변, 출력 객체만 교체.
4. **진단 보존**: 구조화 데이터(skillResult/iterationResult/analysisResult/autoTrigger)는 삭제가 아니라 `debugLog`로 이동.

## 2. 신규 공유 헬퍼 (ENH-364, `lib/core/io.js`)

```js
/** CC Stop hook: surface content and force Claude to continue (render summary + next-step). */
function outputStopSurface(reason) {
  console.log(JSON.stringify({ decision: 'block', reason: String(reason || '').trim() }));
}
/** CC Stop hook: allow clean stop (no forced continuation). */
function outputStopAllow() {
  console.log(JSON.stringify({}));
}
```
- `decision:'block'`은 Stop을 차단 → Claude가 `reason`을 다음 턴 컨텍스트로 받아 요약 렌더 + options를 AskUserQuestion으로 제시.
- `outputStopAllow`는 빈 객체 → CC가 정상 stop 허용(스키마상 모든 필드 optional).

## 3. Fix Manifest (site별)

| # | 파일 | before | after |
|---|------|--------|-------|
| F-PORT | `lib/domain/ports/cc-payload.port.js:26` | `decision: 'allow'\|'deny'\|'ask'\|'defer'` | `decision: 'approve'\|'block'` (Stop) + `permissionDecision: 'allow'\|'deny'\|'ask'\|'defer'` 유지/명시 |
| F-IO | `lib/core/io.js` | `outputAllow` Stop 분기 plain text | `outputStopSurface`/`outputStopAllow` 신설 export |
| F-SPRINT | `sprint-skill-stop.js:158-212,226` | `{decision:'allow',hookSpecificOutput,skillResult}` | no-surface→`outputStopAllow()`; surface→`outputStopSurface(summaryText + '\n\n---\n\nSelect next step:\n' + options)`. skillResult→debugLog |
| F-PDCA | `pdca-skill-stop.js:356-381,390-405` | 2 site, +autoTrigger | 동일 전환. autoTrigger/skillResult→debugLog |
| F-PLAN | `plan-plus-stop.js:82-101` | `{decision:'allow',hookSpecificOutput}` | `outputStopSurface(...)` |
| F-ITER | `iterator-stop.js:338-364` | +iterationResult | `outputStopSurface(...)`. iterationResult→debugLog |
| F-GAP | `gap-detector-stop.js:561-585` | +analysisResult,autoTrigger | `outputStopSurface(...)`. 구조화→debugLog |

> **options 직렬화(ENH-363)**: 기존 `formatAskUserQuestion(payload)`의 옵션을 `reason` 말미에 `- {label}: {command}` 텍스트로 첨부. Claude가 이를 보고 AskUserQuestion 호출. `userPrompt` 필드 제거.

## 4. sessionTitle 처리

- Stop 출력에서 `sessionTitle` 제거(스키마 미지원). 창 제목은 `hooks/session-start.js`(F1/ENH-326 공식 지원)에서 SessionStart·resume 시 설정으로 일원화.
- **carry/한계**: per-phase Stop 시점의 title 갱신(#111 Phase B 일부)은 상실. session-start 시점 tag 격리(#111의 sessionId tag)는 유지. 영향 LOW(제목은 세션 단위로 안정).

## 5. CC 버전 핀포인트 + Monitor (ENH-366)

- design phase 조사: CC가 hook 출력 JSON schema strict validation을 도입/강화한 버전(plugin manifest 강화 ADR 0011 v2.1.142 인접 추정). WebSearch/changelog로 확인 가능 시 기록, 불가 시 "v2.1.159 installed에서 confirmed, 도입 버전 미상" 명시.
- `MON-CC-NEW-STOP-SCHEMA-STRICT`(P0) registry 등록 — displayName monitor(registry:127) 형식 미러.

## 6. Test Plan (L1-L5)

| Level | 항목 | 방법 |
|-------|------|------|
| L1 | `outputStopSurface`/`outputStopAllow` 출력이 CC Stop 스키마 준수 | 단위: 출력 JSON 키 집합 ⊆ {decision,reason,continue,...}, decision∈{block} or {} |
| L2 | 5 emitter 출력이 스키마 통과 | 각 emitter를 mock stdin으로 실행 → stdout JSON 검증 |
| L3 회귀 | 변경 전/후 test 수트 동일 | `comm` 비교, 0 신규 fail |
| L4 정적 | 잔존 `decision: 'allow'`(Stop emitter) 0, `skillResult`/`autoTrigger` root 0 | grep |
| L5 런타임 | 실 `claude -p`로 `/sprint list` Stop 출력 무에러 | `--plugin-dir .` 또는 `-p` 세션 |

## 7. API Contract (M4)

emitter export(run 등) 시그니처 불변. `io.js`는 **신규 export 추가**(기존 불변) → 하위호환. port typedef는 타입 정정(런타임 no-op). **M4 = 100**.

## 8. Self-Assessment (M8)

Context Anchor ✅ / 실측 manifest(7 site) ✅ / 헬퍼 설계 ✅ / test L1-L5 ✅ / 무회귀·하위호환 논증 ✅ / carry 명시(sessionTitle) ✅. **M8 = 90**.

> **Status**: Design 완료 — do phase.
