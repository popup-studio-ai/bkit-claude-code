# S6 — CC Stop Hook Output Schema Compliance 계획서 (PRD + Plan)

> **Sprint**: `cc-stop-hook-schema-compliance` (마스터 플랜 S6) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 · **Scope**: P0 (활성 breakage) · **ENH**: ENH-361 ~ ENH-366
> **dependsOn**: — (독립) · **estTokens**: ~55K
> **Date**: 2026-06-01 · **Author**: kay kim
> **입력 근거**: `docs/03-analysis/features/cc-stop-hook-schema-compliance.analysis.md`

---

## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | CC 현재 strict Stop validator가 bkit 5 Stop emitter 출력을 reject(`(root): Invalid input`). 사용자 `/sprint list` 실행 중 실제 발생. systemic root는 `cc-payload.port.js:26`의 잘못된 `decision` 타입(`allow|deny|ask|defer`)이 5 emitter에 전파 → `decision:'allow'`(Stop은 `approve|block`) + Stop 미지원 `hookSpecificOutput` + 스키마 밖 root 필드(`skillResult`/`autoTrigger`/`iterationResult`/`analysisResult`). |
| **WHO** | 전체 bkit 사용자(Stop hook 기반 executive summary·next-step UX 의존), 외부 dogfooder. |
| **WHAT** | ENH-361 port typedef 정정 / ENH-362 5 emitter compliant 전환 / ENH-363 AskUserQuestion 주입(block+reason) / ENH-364 io.js 공유 헬퍼 / ENH-365 contract test / ENH-366 monitor 등록. |
| **WHAT NOT** | executive summary 포맷 재설계 · Stop hook 동작 의미 변경(여전히 surface) · sessionTitle 신규 메커니즘 발명(SessionStart 일원화) · unified-stop dispatch 구조 개편(출력 계약만 수정). |
| **RISK** | (a) 5 emitter 동시 변경 회귀 → 공유 헬퍼 단일화 + emitter별 contract test + 실런타임. (b) `decision:'block'` 전환이 continuation loop → 기존 consume-once 마커(sprint) + READONLY guard + iteration 한도로 완화. (c) sessionTitle on Stop 상실 → SessionStart로 일원화(carry). |
| **SUCCESS** | 5 emitter 출력이 CC Stop 스키마 통과(실 `claude -p`) · UX 보존(요약+next-step) · port 정정 · 헬퍼 단일화 · contract test green · monitor 등록 · 회귀 0. |
| **SCOPE** | ENH-361~366, ~55K. gate M2/M3/M5/M7 + 실런타임 Stop 검증. |

---

## 2. CC Stop Hook 출력 계약 (정정 기준)

CC Stop hook 유효 top-level 필드: `continue`, `suppressOutput`, `stopReason`, **`decision: "approve"|"block"`**, `reason`, `systemMessage`, `terminalSequence`, `permissionDecision`. **`hookSpecificOutput`은 Stop 변형 미정의** → Stop에서 사용 불가. 임의 root 필드 = `(root): Invalid input`.

**bkit 의도 보존 매핑**:
- **surface(요약+next-step 강제 노출)** = `{ "decision": "block", "reason": "<exec summary + Select next step + options>" }` — Stop을 block하여 Claude가 reason을 받아 요약 렌더 + AskUserQuestion 제시. **#113 enforcement 의도를 더 정확히 구현.**
- **no-surface(read-only / sprint 미해결 / error fallback)** = `{}` (clean allow-stop, 강제 continuation 없음).

---

## 3. ENH 상세

- **ENH-361**: `lib/domain/ports/cc-payload.port.js` HookOutput typedef 정정 — `decision: 'approve'|'block'`(Stop), `permissionDecision: 'allow'|'deny'|'ask'`(PreToolUse) 분리. JSDoc에 Stop/PreToolUse 계약 명시.
- **ENH-362**: 5 emitter(`sprint-skill-stop`/`pdca-skill-stop`/`plan-plus-stop`/`iterator-stop`/`gap-detector-stop`) compliant 전환 — `decision:'allow'`+`hookSpecificOutput`+root 필드 제거, 공유 헬퍼(ENH-364) 사용. 구조화 데이터(skillResult 등)는 `debugLog`로 이동(진단 보존).
- **ENH-363**: surface 시 AskUserQuestion options를 `reason` 텍스트로 직렬화(Claude가 읽고 제시). `userPrompt` 비표준 필드 제거.
- **ENH-364**: `lib/core/io.js`에 `outputStopSurface(content)` / `outputStopAllow()` 단일 SoT 헬퍼 신설. 5 emitter + 기존 `outputAllow` Stop 이원화 통합.
- **ENH-365**: `test/contract/stop-hook-output-schema.test.js` — 5 emitter 출력을 CC Stop 스키마로 검증(회귀 재발 방지).
- **ENH-366**: `lib/cc-regression/registry.js`에 `MON-CC-NEW-STOP-SCHEMA-STRICT`(P0) 등록 + 강화 도입 CC 버전 핀포인트(design phase 조사).

---

## 4. Phase 로드맵 / 위험은 분석 문서 §5·§6 참조.

> **Status**: Plan 완료 — design phase.
