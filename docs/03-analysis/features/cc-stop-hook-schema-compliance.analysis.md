# 심층 분석 — CC Stop Hook Output Schema 위반 (systemic)

> **분류**: CC-version-driven regression (P0, 활성 — 현재 사용자 세션에서 발생 중)
> **Date**: 2026-06-01 · **Author**: kay kim · **Sprint 편입**: v2.1.22 마스터 플랜 **S6** (신규)
> **증상**: `Stop hook error: Hook JSON output validation failed — (root): Invalid input`

---

## 1. 증상 (실제 발생)

`/sprint list` 실행 후 Stop hook이 다음 JSON을 출력 → CC 검증기 reject:
```json
{
  "decision": "allow",
  "hookSpecificOutput": { "hookEventName": "Skill:sprint:Stop" },
  "skillResult": { "skill": "sprint", "action": "list", "sprintId": "tech-debt-deadcode-elimination" }
}
```
CC가 제시한 정상 스키마(Stop)에는 `decision: "approve"|"block"`만 있고, `hookSpecificOutput`의 Stop 변형이 **없으며**, `skillResult` 루트 필드가 **허용되지 않음**.

## 2. 근본 원인 (3중 결함)

| # | 결함 | 위치 | 설명 |
|---|------|------|------|
| RC1 | **잘못된 `decision` enum** | 5 Stop emitter | `decision: 'allow'` 출력. CC Stop의 `decision`은 `"approve"\|"block"` 전용. `'allow'`는 PreToolUse `permissionDecision` 값. → enum 위반 |
| RC2 | **Stop 미지원 `hookSpecificOutput`** | 5 Stop emitter | `hookSpecificOutput.hookEventName: 'Skill:sprint:Stop'`(비표준 enum) + `additionalContext`/`sessionTitle`/`userPrompt`(Stop 미지원 필드). CC 스키마는 hookSpecificOutput을 PreToolUse/UserPromptSubmit/PostToolUse/PostToolBatch에만 정의 |
| RC3 | **스키마 밖 루트 필드** | 5 Stop emitter | `skillResult` 루트 필드 → strict validator의 `(root): Invalid input` 직접 원인 |
| **RC0** | **타입 계약이 결함을 박제** | `lib/domain/ports/cc-payload.port.js:26` | `@property {'allow'\|'deny'\|'ask'\|'defer'} [decision]` — `decision`을 permissionDecision 값으로 **잘못 정의**. 이 잘못된 Port 타입이 모든 emitter에 전파된 systemic 진원 |

## 3. 영향 표면 (전수)

| 파일 | 라인 | hookEventName | 비고 |
|------|------|--------------|------|
| `scripts/sprint-skill-stop.js` | 160, 190, 226 | `Skill:sprint:Stop` | 본 에러 발생원. additionalContext+userPrompt+sessionTitle+skillResult |
| `scripts/pdca-skill-stop.js` | 357, 391 | `Skill:pdca:Stop` | PDCA Exec Summary 주입 |
| `scripts/plan-plus-stop.js` | 83 | `Skill:plan-plus:Stop` | (단, line 43 `outputAllow` 경로는 plain text라 compliant) |
| `scripts/iterator-stop.js` | 339 | `Agent:pdca-iterator:Stop` | iteration 한도 안내 |
| `scripts/gap-detector-stop.js` | 561 | `Agent:gap-detector:Stop` | matchRate 안내 |
| `lib/core/io.js` | 76 `outputAllow` | — | Stop 경로는 plain text(compliant) — 단 JSON 응답 경로와 이원화되어 혼란 |
| `lib/domain/ports/cc-payload.port.js` | 26 | — | RC0 타입 계약 |

→ **5 Stop/Agent-Stop emitter + 1 Port 타입 + io 헬퍼 이원화** = bkit Stop-hook 기반 UX 전체(executive summary 주입·AskUserQuestion·sessionTitle)가 현재 CC에서 reject 위험.

## 4. CC 버전 회귀 성격

- bkit의 Stop hook 출력은 과거 CC(느슨한 검증)에서 무시·통과되던 비표준 필드에 의존. CC가 **plugin manifest 스키마 강화**(displayName v2.1.142 strict reject, ADR 0011 / `registry.js:127`)와 **동일 클래스**로 **hook 출력 스키마 검증을 강화** → 비표준 필드 reject.
- **신규 cc-regression monitor 필요**: `MON-CC-NEW-STOP-SCHEMA-STRICT` (P0) — CC가 Stop/Agent Stop 출력의 비스키마 필드를 strict reject. (S1 ENH-328이 monitor 2건 등록한 것과 동일 절차.)
- 정확한 강화 도입 버전은 design phase에서 CC changelog/docs 조사로 핀포인트(추정: hook 출력 JSON schema validation 도입 버전).

## 5. 수정 방향 (S6 design phase에서 확정)

1. **RC0 우선 수정**: `cc-payload.port.js` HookOutput typedef를 CC 실제 계약으로 정정 — `decision: 'approve'|'block'`(Stop) 와 `permissionDecision: 'allow'|'deny'|'ask'`(PreToolUse) 분리.
2. **Stop emitter 5종 compliant 전환**:
   - `decision:'allow'` 제거 → stop 허용은 **필드 생략** 또는 `{continue:true}`. 차단만 `decision:'block'`+`reason`.
   - executive summary 주입 → 루트 `systemMessage`(string) 또는 plain stdout 텍스트.
   - `skillResult` 루트 필드 제거(또는 디버그 로그로 이동).
   - `hookSpecificOutput`(Stop) 제거.
3. **AskUserQuestion 주입 한계 (핵심 design 결정)**: `userPrompt`는 Stop 스키마에 없음 → (a) options를 `systemMessage` 텍스트로 직렬화해 Claude가 읽고 제시 / (b) CC가 Stop에서 지원하는 메커니즘 확인 후 채택. **CC 문서 조사 필요**.
4. **sessionTitle**: Stop에선 미지원(SessionStart만 공식 — F1/ENH-326). Stop 출력에서 제거, 창 제목은 SessionStart 경로로 일원화.
5. **공유 emitter 단일화**: `lib/core/io.js`에 compliant Stop 출력 헬퍼 단일 SoT 신설 → 5 emitter가 공유(이원화 제거). 회귀 재발 방지.
6. **회귀 테스트**: 각 emitter 출력을 CC Stop 스키마(JSON schema)로 검증하는 contract test 추가.

## 6. 위험

| 위험 | 완화 |
|------|------|
| systemMessage 전환 시 executive summary 가독성 저하 | 포맷 유지 + 실 `claude -p` 런타임 검증 |
| AskUserQuestion UX 상실 | design에서 CC 지원 메커니즘 조사 후 best-effort 대체(텍스트 옵션) |
| 5 emitter 동시 변경 회귀 | 공유 헬퍼 단일화 + emitter별 contract test + 실런타임 QA |
| 다른 Stop 의존(unified-stop dispatch) 깨짐 | unified-stop ↔ sub-handler 출력 계약 재검증 |

## 7. Sprint 편입 결정

- **신규 sprint S6** `cc-stop-hook-schema-compliance`, **P0**, dependsOn: — (독립), Trust L4.
- **Kahn 순서**: S1→S2→**S6**→S4→S3a→S3b→S5. (S6는 활성 P0 breaking이라 S4보다 우선.)
- **S5 dependsOn에 S6 추가** (최종 QA가 수정된 hook을 검증해야 함).
- **ENH-361~366** 신규 예약(enhReserved ENH-324~366으로 확장).
