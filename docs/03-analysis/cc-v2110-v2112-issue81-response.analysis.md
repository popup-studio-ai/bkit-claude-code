# v2.1.8 Hotfix Gap Analysis — cc-v2110-v2112-issue81-response

> **분석 일자**: 2026-04-17
> **브랜치**: `feat/v218-issue-81-hotfix`
> **Plan 문서**: `docs/01-plan/features/cc-v2110-v2112-issue81-response.plan.md`
> **Design 문서**: `docs/02-design/features/cc-v2110-v2112-issue81-response.design.md`

---

## Executive Summary

**Match Rate: 100%** — Plan의 모든 요구사항과 Design의 모든 구현 명세가 코드로 반영되었으며, 12+13 개의 TC 모두 통과(총 68 PASS / 0 FAIL).

| 축 | 결과 |
|----|------|
| Structural Match | **100%** (11/11 파일 매핑 충족) |
| Functional Depth | **100%** (4 ENH 실구현 완료) |
| Contract Match | **100%** (config 스키마 ↔ getUIConfig ↔ session-context.js 3-way 일치) |
| Test Coverage | **25 TC 실측 / 12 계획** (208%) |
| Regression | **0건** (기존 5개 QA 스캐너 43 PASS) |

---

## 1. Plan 요구사항 매핑 (11/11 ✅)

### 1.1 ENH-238 (P0) — session-context.js Docs=Code 가드 복원

| Plan 요구 | Design 명세 | 구현 위치 | 상태 |
|----------|------------|----------|:----:|
| 진입부 가드 삽입 | build() line 346 전면 재작성 | `hooks/startup/session-context.js:346~414` | ✅ |
| `contextInjection.enabled !== false` 체크 | line 348~354 | `session-context.js:362~369` | ✅ |
| `sections[]` 배열 기반 per-section opt-in | 8 섹션 if 체인 | `session-context.js:384~391` | ✅ |
| Dashboard 가드 패턴 동형 재사용 | session-start.js:89-104 참조 | `session-context.js:354~376` | ✅ |
| fail-open try/catch | `_e` silent fail | `session-context.js:373~375` | ✅ |

### 1.2 ENH-239 (P0) — Compaction Fingerprint Dedup

| Plan 요구 | Design 명세 | 구현 위치 | 상태 |
|----------|------------|----------|:----:|
| SHA-256 fingerprint 모듈 신규 | `lib/core/session-ctx-fp.js` (~75 LOC) | `lib/core/session-ctx-fp.js` (115 LOC) | ✅ |
| session-start.js 통합 | response 생성 직전 체크 | `hooks/session-start.js:230~245` | ✅ |
| TTL 1시간 | STALE_MS 상수 | `session-ctx-fp.js:17` | ✅ |
| `CLAUDE_SESSION_ID` 기반 격리 | env var + 'default' fallback | `session-start.js:220` | ✅ |
| atomic write (tmp+rename) | session-title-cache.js 컨벤션 | `session-ctx-fp.js:56~60` | ✅ |
| GC (30일 + LRU 100) | inline GC 함수 | `session-ctx-fp.js:64~87` | ✅ |
| fail-open | try/catch 전역 | `session-start.js:231~246` | ✅ |

### 1.3 ENH-240 (P1) — PersistedOutputGuard 8,000자 하드 캡

| Plan 요구 | Design 명세 | 구현 위치 | 상태 |
|----------|------------|----------|:----:|
| `lib/core/context-budget.js` 신규 | ~85 LOC | `lib/core/context-budget.js` (95 LOC) | ✅ |
| 기본 maxChars 8,000 | DEFAULT_MAX_CHARS | `context-budget.js:18` | ✅ |
| priority-preserved 축약 | DEFAULT_PRIORITY_KEYS | `context-budget.js:19~24` | ✅ |
| stripAnsi 기반 측정 | lib/ui/ansi.js 재사용 | `context-budget.js:13, 45` | ✅ |
| session-context.js build() 말미 호출 | applyBudget 래핑 | `session-context.js:404~413` | ✅ |
| `bkit.config.json` maxChars/priorityPreserve 노출 | getUIConfig 확장 | `lib/core/config.js:192~201` | ✅ |
| 경고 로그 | debugLog('ContextBudget', ...) | `context-budget.js:52~56` | ✅ |

### 1.4 ENH-244 (P3) — `once: true` 기술 부채 문서화

| Plan 요구 | Design 명세 | 구현 위치 | 상태 |
|----------|------------|----------|:----:|
| 외부 문서화 (JSON 주석 한계) | `docs/context-engineering.md` 섹션 | `docs/context-engineering.md:43~90` | ✅ |
| 공식 문서 근거 인용 | code.claude.com/docs/en/hooks | `context-engineering.md:48~54` | ✅ |
| Issue #14281 등 cross-reference | 4 이슈 링크 | `context-engineering.md:72~76` | ✅ |

### 1.5 버전 bump (6곳)

| 위치 | Before | After | 상태 |
|------|--------|-------|:----:|
| `.claude-plugin/plugin.json:3` | 2.1.7 | 2.1.8 | ✅ |
| `bkit.config.json:2` | 2.1.7 | 2.1.8 | ✅ |
| `hooks/session-start.js:3` | (v2.1.7) | (v2.1.8) | ✅ |
| `hooks/session-start.js:236` | v2.1.7 activated | v2.1.8 activated | ✅ |
| `hooks/startup/session-context.js:378` | v2.1.7 Session Startup | v2.1.8 Session Startup | ✅ |
| `hooks/startup/session-context.js:231~232` | v2.1.1 / v2.1.96+ / 62 | v2.1.8 / v2.1.111+ / 72 | ✅ |

---

## 2. Design 아키텍처 결정 매핑 (12/12 ✅)

| 설계 결정 (Design 섹션) | 구현 증거 | 상태 |
|----------------------|----------|:----:|
| Alt C — 3-way 토글 + sections[] | `session-context.js:348~391` | ✅ |
| Alt B — SHA-256 fingerprint dedup | `session-ctx-fp.js` + `session-start.js:230~245` | ✅ |
| Alt B — 8,000자 하드 캡 | `context-budget.js:18` | ✅ |
| priority-preserved 축약 알고리즘 | `context-budget.js:60~87` | ✅ |
| stripAnsi 기반 길이 계산 | `context-budget.js:45, 66, 78` | ✅ |
| session-title-cache.js 컨벤션 재사용 | `session-ctx-fp.js:54~61` | ✅ |
| fail-open 전략 (3 위치) | session-context.js, session-start.js, context-budget.js 각 try/catch | ✅ |
| sessionTitle 보존 경로 | `session-start.js:222~226` (enabled=false에서도 emit) | ✅ |
| dashboard gate 동형 재사용 | `session-context.js:348~376` ↔ `session-start.js:91~104` 동형 확인 | ✅ |
| `<persisted-output>` ADR 외부화 | `docs/context-engineering.md` | ✅ |
| 12 TC 설계 | 25 TC 실구현 (208%) | ✅ (초과 달성) |
| 버전 매핑 6곳 | 6/6 동기화 | ✅ |

---

## 3. 정량 지표

### 3.1 파일 매트릭스 실측

| 구분 | 계획 | 실구현 | Δ |
|------|------|--------|---|
| Production 수정 | 4 | **4** (plugin.json, bkit.config.json, session-context.js, session-start.js) | 0 |
| Production 신규 | 2 | **3** (context-budget.js, session-ctx-fp.js, **+ config.js 수정**) | **+1 버그 발견/수정** |
| Docs 추가 | 1 (섹션 추가) | **1** (파일 전체 신규, 90 lines — 기존 파일 부재) | 0 |
| Tests 신규 | 4 | **4** | 0 |
| **TC 수** | 12 | **25** (TC-B1~B4 6개 + B5~B7 5개 + B8~B10 6개 + B11 8개) | **+13 초과달성** |

### 3.2 테스트 결과 (68 PASS / 0 FAIL)

| Suite | PASS | FAIL | 세부 |
|-------|:----:|:----:|------|
| TC-B1~B4 (ENH-238, L1) | 6 | 0 | session-context.test.js |
| TC-B5~B7 (ENH-239, L2) | 5 | 0 | session-ctx-fingerprint.test.js |
| TC-B8~B10 (ENH-240, L1) | 6 | 0 | context-budget.test.js |
| TC-B11 (Matrix, L4) | 8 | 0 | ui-opt-out-matrix.test.js (3-way × 8 조합) |
| 기존 config-audit | 5 | 0 | 회귀 없음 |
| 기존 dead-code | 5 | 0 | 회귀 없음 |
| 기존 completeness | 6 | 0 | 회귀 없음 |
| 기존 shell-escape | 8 | 0 | 회귀 없음 |
| 기존 scanner-base | 19 | 0 | 회귀 없음 |
| **합계** | **68** | **0** | - |

### 3.3 Smoke Test (실 hook 동작)

```
$ echo '{"hook_event_name":"SessionStart"}' | CLAUDE_PLUGIN_ROOT=... node hooks/session-start.js
{"systemMessage":"bkit Vibecoding Kit v2.1.8 activated (Claude Code)","hookSpecificOutput":{"hookEventName":"SessionStart",...}}
```

- ✅ 버전 문자열 v2.1.8 반영
- ✅ JSON 응답 구조 유효
- ✅ fingerprint 64-bit truncated 생성 (`563d4c01b104a1b7`)
- ✅ 모든 신규 모듈 syntax check 통과

---

## 4. 예상 외 발견 (Iterate 단계)

| # | 발견 | 조치 |
|---|------|------|
| 1 | `lib/core/config.js` `getUIConfig()`가 `sections`/`maxChars`/`priorityPreserve` 신규 필드를 **반환하지 않는 버그** | `config.js:192~201` 에 3 필드 추가 → Plan/Design의 contract을 완성 |
| 2 | `docs/context-engineering.md` 파일 자체가 부재 (Plan에 "섹션 추가"로 명시) | 파일 전체 신규 생성 (90 lines) |
| 3 | session-context.js unit test가 module cache 간섭으로 3개 fail | child_process spawn으로 격리 재작성 (matrix test와 동일 패턴) |
| 4 | `CLAUDE_PROJECT_DIR` env var 미오버라이드 시 parent process의 값이 상속 | spawn env에 명시 override |

**모두 Iterate 사이클에서 해결 (100% Match Rate 달성)**.

---

## 5. Success Criteria 최종 상태

| Plan §9.1 KPI | 목표 | 실측 | 상태 |
|---------------|------|------|:----:|
| `additionalContext` bytes (opt-out) | ≤ 500 | **47** (헤더만) | ✅ 초과 달성 |
| `additionalContext` bytes (기본) | ≤ 8,000 | 가드 활성 (TC-B9) | ✅ |
| Docs=Code 위반 (ENH-226) | 🟢 PASS | 🟢 | ✅ |
| compaction 중복 주입 | 1회 | dedup (TC-B5 확증) | ✅ |
| 신규 TC 커버리지 | 12 | **25** (208%) | ✅ 초과 달성 |
| Breaking changes | 0 | **0** | ✅ |

---

## 6. 결론

**Match Rate: 100% — Plan/Design의 모든 요구사항이 코드로 반영 완료**.

Iterate 단계에서 드러난 예상 외 버그(`getUIConfig` 누락) 포함 4건 모두 해결. 다음 단계: Report 작성.
