# CC v2.1.218 영향 분석 보고서 (사이클 #29)

> **범위**: Claude Code CLI **v2.1.218** 단일 릴리스 (baseline v2.1.217 → v2.1.218)
> **분석일**: 2026-07-23 · **분석 대상**: bkit Vibecoding Kit v2.1.30
> **설치 CC**: 2.1.218 · **latest**: 2.1.218 · **dist-tag latest**: 2.1.218
> **직전 사이클**: #28 (v2.1.216+217, 0-ENH) · **누적 연속호환**: 160 → **161**

---

## Executive Summary

CC v2.1.218은 **37개 bullet**(Fixed 23 / Changed 6 / Added 4 / Improved 4)로 구성된 **Fix 중심 대형 릴리스**입니다. 대부분 CC 내부(접근성·터미널 렌더링·MCP·Bedrock·세션 복원)에 국한되어 bkit에 직교하지만, **`Changed` 항목 2건이 bkit 컴포넌트 표면과 직접 교차**합니다.

**헤드라인 = 상반된 2건의 교차:**

1. **`context: fork` 스킬 기본 백그라운드화 (Changed)** — bkit **9개 fork 스킬**이 CC 218에서 opt-out 없이 백그라운드 실행 기본값을 상속. 특히 `qa-phase`(대화형 `AskUserQuestion` 선언)와 순차 파이프라인 phase 스킬의 실행 semantics가 조용히 변경됨. → **유일한 ENH 후보 (ENH-367, P1)**, 28-cycle 0-ENH streak 종료. **단, 본 스킬은 analysis-only이므로 제안만 하며 미구현.**
2. **agent name `:` 거부 (Changed)** — CC가 agent `name:` 필드에서 콜론을 플러그인 네임스페이싱 예약으로 거부. bkit **34개 에이전트 전원 `name:` 필드에 콜론 미포함**(`bkit:` 프리픽스는 CC가 로드 시 부여). → **IMMUNE / 설계 재확인(vindication)**, #28의 216 name-prefix 수정에 이은 **MF-3 CC-native 흐름 연장**.

### 4-관점 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **호환성(Compatibility)** | 🟡 조건부 유지 | 0 breaking. 단 `context: fork` 기본값 변경이 9개 스킬의 실행 모드를 CC≥218에서 조용히 전환 — 명시적 `background:` 고정 필요 |
| **기능성(Capability)** | 🟢 순증 | boolean 파서 확장(yes/no/on/off/1/0)으로 `background: false` opt-out이 견고. `/code-review` 백그라운드화는 bkit `code-review`(네임스페이스)와 무충돌 |
| **안정성(Stability)** | 🟢 향상 | 23개 Fix 중 세션 복원·PR 이벤트 유실·prompt history race·context-overflow 재시도 루프 등 bkit 세션 신뢰성에 간접 이득 |
| **차별화(Differentiation)** | 🟢 유지 | heredoc-pipe(#58904) 미수정 확인 — 218 auto-mode 개선은 dangerous-rm/background-&/Windows-path 한정, heredoc 별개. **streak INTACT (+1)** |

---

## §1. 버전 범위 및 조사 방법

- **분석 범위**: v2.1.217(직전 baseline, 분석 완료) 이후 유일 신규 릴리스 = **v2.1.218**.
- **소스**: raw `CHANGELOG.md`(authoritative) + `gh api repos/anthropics/claude-code/releases/tags/v2.1.218`.
- **Phase 1.5 교훈 준수**: model-WebFetch cross-section 환각 회피 위해 `curl raw CHANGELOG` awk 섹션 추출 + `grep -cE "^- "` 직행 카운트로 확정.

---

## §2. CC v2.1.218 변경 카탈로그 (37 bullets)

### 2.1 bkit 교차 항목 (HIGH/MEDIUM relevance)

| # | 유형 | 변경 (verbatim 요약) | bkit relevance | 판정 |
|---|------|------|------|------|
| C1 | Changed | `context: fork` 스킬 기본 백그라운드 실행, `background: false`로 opt-out | **HIGH** — 9개 fork 스킬 | **ENH-367 (P1)** |
| C2 | Changed | agent md 파일에서 `name:`에 `:` 포함 거부 (플러그인 네임스페이싱 예약) | **MEDIUM** — 34개 에이전트 | **IMMUNE/vindication** |
| C3 | Added | skill/plugin frontmatter boolean에 `yes/no/on/off/1/0`(대소문자 무관) 허용 | **LOW** — synergy | IMMUNE/synergy |
| C4 | Fixed | agent frontmatter hooks가 미신뢰 폴더에서 실행되던 문제 — 이제 agent 파일 폴더의 workspace trust 요구 | **LOW** — bkit agent frontmatter hooks 0건 | IMMUNE |
| C5 | Changed | `/code-review`를 백그라운드 서브에이전트로 실행 | **LOW** — bkit `code-review`(네임스페이스) 별개 | IMMUNE |
| C6 | Improved | auto mode: dangerous-rm·background-`&`·suspicious-Windows-path 체크가 permission dialog 대신 auto-mode classifier로 판정 | **LOW** — heredoc 별개, Layer-6 훅 직교 | IMMUNE/synergy |

### 2.2 IMMUNE/직교 항목 (LOW relevance, 대표)

- **세션/엔진 신뢰성 Fix** (bkit 세션에 간접 이득): fork-session lineage 복원, resumed session malformed delta 크래시, engine teardown race(phantom turn), context-overflow 재시도 루프, PR 이벤트 유실, prompt history race, remote heartbeat 무한 재시도.
- **접근성/터미널 렌더링** (직교): screen-reader 삭제 announce, VoiceOver space echo, plugin/settings 패널 커서 추적, mojibake(IDE selection 절단), multi-line paste `j` 붕괴, deeply-nested UI/watched-dir 크래시.
- **플랫폼/인프라** (직교): Windows `\u` 경로 CJK 손상, Bedrock assume-role 프로파일 검증, gateway spend metering(application-inference-profile ARN), monotonic clock turn duration, MCP auth 과다카운트, `/context` stale 토큰, `/deep-research` 수동 전용, `/mcp` HTTP status 노출, server-managed settings 승인 프롬프트 완화, IDE sandbox 제한, trust dialog repo-root 명시, fast-mode 전환 announce, left-arrow 대화 폐기 확인.

### 2.3 카테고리 분포

```
Fixed    ███████████████████████  23   (62%)
Changed  ██████                    6   (16%)
Added    ████                      4   (11%)
Improved ████                      4   (11%)
                                  ─────
                                   37 bullets
```

---

## §3.0 원본 검증 게이트 (Phase 1.5 — MANDATORY)

| Field | Agent/직접 카운트 | Raw 검증 | 소스 | Verdict |
|-------|------|------|------|---------|
| Added | 4 | 4 | raw CHANGELOG grep | **match** |
| Fixed | 23 | 23 | raw CHANGELOG grep | **match** |
| Changed | 6 | 6 | raw CHANGELOG grep | **match** |
| Improved | 4 | 4 | raw CHANGELOG grep | **match** |
| **Total bullets** | **37** | **37** | raw + `gh api releases/tags` (2소스 일치) | **match** |

- **Errata: 0.** 2소스(raw.githubusercontent CHANGELOG.md 헤더 awk 추출 + GitHub releases/tags API body) 완전 일치.
- **Spot-check (≥3 verbatim 확인)**: C1 `"Changed skills with context: fork to run in the background by default; opt out per skill with background: false"` / C2 `"Changed agent markdown files to reject agent names containing :, which is reserved for plugin namespacing"` / C6 `"the dangerous-rm, background-& , and suspicious-Windows-path checks no longer open permission dialogs; the auto-mode classifier adjudicates them instead"` — 3건 모두 원본 verbatim 일치.
- **아키텍처 재실측 (Bash 이중측정)**: **34 Agents / 44 Skills / 22 hook events** — 메모리 일치, 보정 불요.

---

## §3. bkit 영향 분석 (컴포넌트 매핑)

### 3.1 C1 — `context: fork` 기본 백그라운드화 (유일한 실질 노출)

**노출 컴포넌트: 9개 fork 스킬**

| 스킬 | user-invocable | pdca-phase | 대화형 리스크 | 판정 |
|------|:--:|------|------|------|
| `qa-phase` | ✅ true | qa | **`AskUserQuestion` 선언** — 백그라운드 시 대화형 프롬프트 표면화 불가 | **HIGH** |
| `phase-1-schema` | false | plan | 순차 guided 파이프라인(next-skill 체인), 라이브 가시성 손실 | MEDIUM |
| `phase-2-convention` | false | plan | 동상 | MEDIUM |
| `phase-3-mockup` | false | design | 동상 | MEDIUM |
| `phase-4-api` | false | do | 동상 | MEDIUM |
| `phase-5-design-system` | false | do | 동상 | MEDIUM |
| `phase-8-review` | false | check | gap 분석 결과 사용자 확인 필요 | MEDIUM |
| `zero-script-qa` | ✅ true | — | Docker 실시간 로그 감시가 스킬 본질 — 백그라운드 시 라이브 관측 UX 손상 | MEDIUM |
| `skill-status` | ✅ true | — | 빠른 read-only 상태 리포트 — 백그라운드 시 알림 소음/지연만 추가 | LOW |

**분석**: CC 218은 `background:` 미선언 fork 스킬을 **조용히 백그라운드 기본값**으로 전환합니다. bkit **9개 스킬 전원 `background:` 미선언**(실측 확인)이므로 CC≥218 사용자에게 실행 semantics가 무통보 변경됩니다.

- **구체적 기능 회귀**: `qa-phase`는 `AskUserQuestion`을 allowed-tools로 선언 — 백그라운드 실행 시 대화형 QA 프롬프트가 포그라운드로 표면화되지 못해 **실제 기능 손상** 가능.
- **철학 위반**: bkit "No Guessing / 명시적 의도" 원칙상 실행 모드를 CC 기본값 변경에 위임하지 않고 **명시 선언**해야 함.
- **backward-safe 확인**: `background: false`는 (a) 218 미만 CC가 미지 frontmatter 키로 무시, (b) 218 boolean 파서(C3)가 견고 파싱 → **하위/상위 호환 모두 안전**.

### 3.2 C2 — agent name `:` 거부 → vindication

- bkit 34개 에이전트 `name:` 필드 실측: **콜론 포함 0건**. 전원 순수 slug(`cc-version-researcher`, `pm-lead`, `sprint-orchestrator` …).
- `bkit:` 프리픽스는 **CC 플러그인 로더가 런타임 부여** — 파일에 저장되지 않음. Agent 목록의 `bkit:cc-version-researcher` 표기는 로드 시 네임스페이싱 결과.
- → CC 218의 `:` 거부는 bkit이 **v2.1.69부터 준수해온 컨벤션의 상류 재확인**. #28의 216 plugin name-prefix 수정에 이어 **MF-3(#125) CC-native 해소 흐름 연장**. 제거/수정할 코드 없음.

### 3.3 나머지 컴포넌트: IMMUNE

- **Agent frontmatter hooks (C4)**: bkit agent 파일에 `hooks:` 선언 0건(실측). bkit 훅은 `hooks/hooks.json`(플러그인 레벨) — agent-frontmatter 훅 미신뢰-폴더 수정과 직교. **IMMUNE.**
- **`/code-review` 백그라운드화 (C5)**: bkit `code-review`는 네임스페이스 스킬(`bkit:code-review`, user-invocable). CC 내장 `/code-review`와 별개 커맨드 — 무충돌. bkit이 CC `/code-review`/`/deep-research`를 프로그램적으로 호출하는 경로 0건. **IMMUNE.**
- **auto-mode classifier 이관 (C6)**: dangerous-rm/background-`&`/Windows-path 한정. bkit Layer-6 방어(#2 차별화)는 독립 PostToolUse 훅으로 CC permission-dialog/classifier 경로와 직교 — 무관하게 발화. **IMMUNE/synergy.**

---

## §4. ENH 로드맵 (Phase 3 브레인스토밍)

### 4.1 Intent Discovery

- **최대 가치**: CC 218의 `context: fork` 기본값 변경으로부터 bkit 파이프라인/QA 스킬의 **의도된 실행 UX를 보존**하고, 실행 모드를 **명시적으로 소유**(No Guessing).
- **놓치면 안 되는 것**: `qa-phase` 대화형 프롬프트 회귀 — 사용자 대면 기능 손상.
- **native 대체 기회**: 없음(오히려 native 기본값이 bkit 의도와 어긋남).

### 4.2 Alternative Exploration

| 대안 | 내용 | Trade-off |
|------|------|-----------|
| **A** | 9개 fork 스킬 전원 `background: false` 고정 | 현 UX 완전 보존, backward-safe. skill-status/zero-script-qa의 잠재적 백그라운드 이점 포기 |
| **B** | 대화형/순차(qa-phase + 6 phase 스킬)만 `false`, 리포터형(skill-status·zero-script-qa·phase-8-review)은 백그라운드 허용 | 세분화되나 각 스킬 이점을 **추정**(guessing) — skill-status 백그라운드는 오히려 알림 소음, zero-script-qa 라이브 로그 관측 손상 |
| **C** | 무조치 (CC 기본값 수용) | qa-phase 대화형 회귀 + 라이브 가시성 손실 + No Guessing 위반 |

### 4.3 YAGNI 검토

- ✅ **현재 필요한가**: CC≥218 사용자에게 qa-phase 대화형 회귀는 **구체적 기능 손상** → YAGNI 통과.
- ✅ **미구현 시 문제**: 실행 모드가 CC 버전에 따라 무통보 분기 → 재현 불가 버그 리포트 위험.
- ⚠️ **다음 CC 버전에서 더 나은 방법?**: fork-skill의 background 상호작용 semantics가 오케스트레이션 내 호출 시 다를 수 있어 **경험적 검증(218에서 실측) 선행 권장** → 구현 전 P2 검증 게이트.
- → 대안 **A 채택**(전원 `false`), 단 zero-script-qa/phase-8-review는 검증 후 재고 여지.

### 4.4 우선순위 배정

| ID | 항목 | 우선순위 | 상태 |
|----|------|:--:|------|
| **ENH-367** | 9개 `context: fork` 스킬에 `background: false` 명시 고정 (qa-phase 대화형 보호 + 명시적 의도 원칙). backward-safe. | **P1** | **제안(analysis-only, 미구현)** |
| ENH-367-verify | 구현 전 CC 218에서 orchestration 내 fork-skill background 호출 semantics 경험적 검증 (zero-script-qa 라이브 로그/phase-8 가시성) | **P2** | 검증 게이트 |

> **HARD-GATE 준수**: 본 스킬은 analysis-only. ENH-367은 **제안 단계**이며 구현하지 않음. 전역 마지막 ENH-366, **ENH-367 예약분 소비 제안** — 28-cycle 0-ENH streak을 종료하는 첫 후보(구현은 별도 PDCA 사이클 필요).

---

## §5. 상시 추적 항목 (Always-Tracked)

| 항목 | 직전(#28) | 현재(#29) | 변화 |
|------|------|------|------|
| **누적 연속호환** | 160 | **161** (v2.1.34~v2.1.218) | +1 |
| **차별화 streak (heredoc #58904)** | intact | **intact (+1 연장)** | 218 auto-mode는 dangerous-rm/background-&/Windows-path 한정, heredoc-pipe 미수정 — streak break 미발생 |
| **MF-2 (cc-version-checker RECOMMENDED_VERSION)** | CRITICAL, '2.1.198' 19-stale | **CRITICAL 악화, '2.1.198' 20-stale** | latest 218 대비 20-release drift(≥8=CRITICAL). **2.1.218 bump 권장(maintainer, 미구현)**. MIN='2.1.78', FABLE_MODEL_FLOOR='2.1.170' 유지 |
| **MF-3 (#125 plugin name-prefix)** | RESOLVED(CC-native, 216) | **RESOLVED 재확인 (218 name `:` 거부로 컨벤션 상류 강제)** | CLOSE 정리 유지 |
| **BG-OTEL-DROP (#64436)** | OPEN+watch | **OPEN+watch** | 218 세션 신뢰성 Fix 다수이나 work-phase OTEL log-drop 직접 해소 아님. bkit 자체 file-ledger라 미노출 |
| **hook-matcher 컨벤션 면역** | 면역 | **면역** | matcher-syntax 회귀 계속 무관 |

### 신규 감시 항목

- **FORK-SKILL-BG-DEFAULT (신규, C1발)**: CC 218부터 `context: fork` 스킬 background 기본값. bkit 9개 스킬 노출. ENH-367 구현 전까지 **CC≥218 사용자 실행 모드 무통보 분기** 상태 — ENH 처리 시 해소. `lib/infra/cc-version-checker.js:62` `contextFork: '2.1.113'` gate는 존재하나 218의 *기본값 변경*은 미추적 — 버전 checker 주석 갱신 후보(P3).

---

## §6. 결론

CC v2.1.218은 **37 bullet Fix 중심 릴리스**로, bkit에 **0 breaking**이나 **`context: fork` 기본 백그라운드화(C1)** 1건이 **9개 스킬 실행 semantics를 조용히 변경**하는 실질 노출을 발생시킵니다. 이는 **28-cycle 연속 0-ENH streak을 종료하는 첫 ENH 후보(ENH-367, P1)** — 단 analysis-only 원칙상 제안에 그치며 별도 PDCA 사이클에서 구현되어야 합니다.

동시에 **agent name `:` 거부(C2)**는 bkit이 이미 준수해온 네임스페이싱 컨벤션의 상류 재확인으로, #28의 216 name-prefix 수정에 이어 **MF-3 CC-native 해소 흐름을 강화**합니다. 나머지 35개 bullet은 IMMUNE/직교이며, **heredoc 차별화 streak은 intact(+1)**, **누적 연속호환은 161**로 연장됩니다.

**최우선 후속(maintainer)**: MF-2 — `lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION` '2.1.198' → '2.1.218' bump (20-release stale, CRITICAL).

---

*Generated by `/bkit:cc-version-analysis` · 사이클 #29 · Phase 1.5 검증 완료(errata 0) · analysis-only*
