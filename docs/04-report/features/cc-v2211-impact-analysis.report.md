# CC v2.1.210 → v2.1.211 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물아홉 번째 정식 적용)

> 작성일: 2026-07-16 · 사이클 #25 · 분석 범위 v2.1.211 (단일 버전)
> 방법론: `/bkit:cc-version-analysis` (Phase 0~4 + Phase 1.5 Raw Verification Gate)
> 정본 소스: raw `CHANGELOG.md` (gh raw 바이트, model-WebFetch 우회) — raw-wins

---

## 1. Executive Summary

### 1.1 최종 판정

**호환 (0 Breaking / 0 ENH) — 즉시 흡수 권장.** 설치본 = latest = **v2.1.211** 수렴.
단일 릴리스 37 bullets 중 24건(65%)이 Fixed 중심. bkit 관련 항목은 전부 코드검증으로
**native 수혜 또는 면역**으로 판정됨. 특히 **v211 L7 (auto mode의 PreToolUse `ask` 오버라이드
fix)** 가 bkit **Layer 6 Defense**의 `ask` 결정을 auto mode에서 보장하는 직접 수혜.

### 1.2 성과 요약

- **누적 연속 호환: 153 → 154** (v2.1.34 ~ v2.1.211, R-2 skip 제외)
- **신규 ENH streak: 25-cycle 연속 0건** (전역 마지막 ENH-366, ENH-367 예약 유지·미소비, CC-cycle 마지막 ENH-328)
- **native 수혜 8건** — 헤드라인은 L7 defense `ask`-floor + L11 subagent model override 지속 + L9 plugin MCP 재연결
- **면역/Neutral 4건** — 전부 grep 코드검증으로 확정

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **안정성(Stability)** | ★★★★☆ | L9 plugin MCP idle-wake 재연결·L27 killed bg-agent stale-prompt 억제·L31 honest bg-agent 보고 → 장기 L4 auto-run 세션 견고화 |
| **보안(Security)** | ★★★★★ | **L7 auto mode가 PreToolUse hook `ask`를 오버라이드하던 unsandboxed Bash 경로 차단(ask floors at prompt)** → bkit destructive-detector `ask` 5+패턴이 auto mode에서 보장. L6 permission preview bidi/zero-width/look-alike 중화 → shell-escape scanner 수렴 |
| **DX/자동화(Automation)** | ★★★★★ | **L11 subagent explicit model override가 resume/follow-up에서 부모 모델로 되돌아가던 버그 fix** → bkit 34-agent model pin(6 Fable, FABLE_MODEL_FLOOR) + Agent-Team dispatch 정합(v2.1.25 정렬작업 native 보강) |
| **비용/리스크(Cost/Risk)** | ★★★★★ | 0 breaking · 0 코드변경 · 0 ENH. L41 prompt-caching 회귀 fix(Bedrock/Vertex/Mantle/Foundry)로 해당 게이트웨이 사용자 과금 정상화 |

---

## 2. CC v2.1.210 → v2.1.211 변경사항 (37 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

| 버전 | Total | Added | Fixed | 기타 | 정본 행범위 |
|------|-------|-------|-------|------|-------------|
| v2.1.211 | **37** | 1 | 24 | Hardened 1, Improved 3, Updated 2, Changed 3, VSCode 1, Chrome 2 | L5–L41 |

- **검증 방법**: `curl raw CHANGELOG.md` → 헤더 grep(`^## `) → 행범위 `sed 5,41` → `grep -c '^- '`. 카운트 raw 바이트 직행 확정.
- **Breaking heading: 0건**. Errata: 없음 (agent 미개입, 카운트 직접 측정).

### 2.2 bkit 관련 HIGH 항목 (3건, 전부 native 수혜)

| # | 항목 | bkit 매핑 | 판정 | 코드검증 |
|---|------|-----------|------|----------|
| L7 | auto mode가 unsandboxed Bash에 대해 PreToolUse hook의 `ask` 결정 오버라이드 → 이제 `ask`가 prompt로 floor | Layer 6 Defense / Trust Engine | **native 수혜(핵심)** | `hooks/hooks.json:17` PreToolUse 등록 확인 + `lib/control/destructive-detector.js` `defaultAction:'ask'` 5+ 패턴 → auto mode 우회 경로 CC가 차단 |
| L11 | explicit model override subagent가 resume/follow-up 시 부모 모델로 되돌아감 → fix | 34 agents (6 fable·10 opus·16 sonnet·2 haiku) | **native 수혜** | `grep '^model:' agents/*.md` 확인 → model-pin 정합, v2.1.25 정렬작업·Agent-Team dispatch 보강 |
| L9 | plugin MCP 서버가 idle web 세션 wake 후 재연결 실패 → fix | 2 MCP Servers (`bkit-pdca`·`bkit-analysis`) | **native 수혜** | `plugin.json` mcpServers 2개 → idle-wake 재연결 안정 (v210 L15 teardown fix 연장선) |

### 2.3 bkit passive 수혜 (native 개선, 워크어라운드 불필요) — 8건

1. **L7** PreToolUse `ask`-floor → **bkit Layer 6 destructive `ask` auto mode 보장 (#2 차별화 native 보강)**
2. **L11** subagent model override 지속 → bkit model-pin/Fable-floor 정합 (**v2.1.25 정렬작업과 시너지**)
3. **L9** plugin MCP idle-wake 재연결 fix → bkit 2 MCP 서버 안정
4. **L6** permission preview가 bidirectional-override·zero-width·look-alike quote 중화 → bkit `lib/qa/scanners/shell-escape.js` 방어와 native 수렴
5. **L31** honest background agent 보고 (still-running 상태 명시, 결과 조작 안 함) → bkit Agent-Team/bg dispatch 정직성
6. **L32** memory index over-limit 경고가 frontmatter·HTML 주석 제외하고 loaded content만 측정 → **v210 L33 후속**, bkit MEMORY.md(frontmatter+주석 다수) 경고 정확도 개선
7. **L27** 사용자가 kill한 background agent의 auto-respawn·stale-prompt 재실행 억제 → bkit bg 안정
8. **L41** Bedrock/Vertex/Mantle/Foundry prompt-caching 회귀 fix (trailing system block 매요청 fresh 과금) → 해당 게이트웨이 사용자 과금 정상화

### 2.4 면역/Neutral 검증 (전부 grep 확정)

| 항목 | 표면 relevance | 판정 | 근거 |
|------|----------------|------|------|
| L12 nested `.claude/rules/*.md`가 project-settings 제외 시에도 로드 → fix | rules 로딩 | **면역** | bkit `.claude/rules/` 디렉터리 부재 (`bkit-system/triggers/priority-rules.md`·`skills/bkit-rules/`는 별개 경로) |
| L33 정수 env var가 `1e6`·`64_000` 등 과학표기·자릿수구분 허용 | env 파싱 | **Neutral** | bkit env를 과학표기로 미설정 (bkit `1e6`=JS 산술). v208 L55(mantissa 거부)에서 방향 역전된 CC 진화 — bkit 어느 쪽이든 무영향 |
| L35 "always allow" 규칙을 repo root에 저장 (worktree 간 persist) | permission 규칙 | **Neutral** | bkit 자체 Trust Engine과 직교 |
| L10 Vertex/Bedrock startup 시 default Opus 시도·spurious fallback notice fix | 모델 startup | **Neutral** | bkit model-pin으로 무관 |

---

## 3. bkit 영향 매트릭스

| 컴포넌트 | 변경 필요 | 영향 | 비고 |
|----------|-----------|------|------|
| 34 Agents | ❌ | **native 수혜(L11)** | model override resume/follow-up 지속, 무변경 |
| Layer 6 Defense | ❌ | **native 수혜(L7·L6)** | destructive `ask`가 auto mode에서 floor 보장 — bkit 코드 무변경으로 방어 강화 |
| 36 Hooks / 22 Events | ❌ | native 수혜(L7 PreToolUse) | `ask` 결정 CC가 존중 |
| 2 MCP Servers | ❌ | native 수혜(L9) | idle-wake 재연결 fix |
| MEMORY.md 운영 | ❌ | native 수혜(L32) | over-limit 경고 정확도 개선 |
| 44 Skills | ❌ | 면역(L12 rules 미사용) | 무변경 |
| 195 Lib Modules | ❌ | Neutral(L33 env) | `1e6` 산술 무영향 |
| 50 Scripts | ❌ | 무영향 | stdin/stdout 프로토콜 무변경 |

**철학 준수**: Automation First / No Guessing / Docs=Code 전부 유지. 코드변경 0.

---

## 4. Phase 3 브레인스토밍 (Plan Plus) — ENH 도출

### 4.1 Intent Discovery
- **최대 가치**: L7 defense `ask`-floor + L11 model-override 지속으로 bkit **핵심 차별화(#2 Layer 6, model-pin)를 native가 무료 보강**.
- **놓치면 안 되는 critical**: 없음 (0 breaking).
- **워크어라운드 대체**: L7이 auto mode `ask` 우회 gap을 CC가 native 차단 — bkit destructive-detector는 여전히 탐지 소스로 필수(대체 아님, 상호보완).

### 4.2 YAGNI Review
- 도출 후보 전부 native 선결 → 신규 구현 불필요.
- L7/L11은 bkit 기존 방어·정렬 로직의 상위 보증을 CC가 흡수 → 추가 bkit 코드 **YAGNI fail (구현 불요)**.

### 4.3 우선순위
- **신규 ENH: 0건.** ENH-367 예약 유지(미소비). 25-cycle 연속 0-ENH.
- **유일 maintainer 액션(비-ENH)**: MF-2 — `RECOMMENDED_VERSION` bump (아래 §5).

---

## 5. Carry / Monitor 상태 (사이클 #25 종료 시점)

- **MF-2 OPEN 지속(격상)**: `lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION = '2.1.198'` — 이제 latest 대비 **13 릴리스 뒤처짐**. **2.1.211로 bump 권장(maintainer, 미구현)**. `MIN_VERSION='2.1.78'`·`FABLE_MODEL_FLOOR='2.1.170'` 유지 적정.
- **차별화 streak intact**: 3대 abandoned 이슈(#56293·#57317 PLUGIN-HOOK-DROP·#58904) 전부 유지. v211 L9는 plugin **MCP** 재연결 fix로 #57317 plugin **hook** drop과 **인접하나 동일 아님** → streak 계속("닫힘 ≠ 고침", code-fix bullet 미관측).
- **Monitor 상태**: BG-OTEL-DROP(#64436)·PLUGIN-HOOK-DROP(#57317)·CHOICE-LOOP(#64447) 전부 **ACTIVE 유지** (v211 verbatim code-fix bullet 미관측). STOP-SCHEMA-STRICT(ENH-366)·NOTIFY-BGAGENT RESOLVED 유지 (L31 honest bg-report가 NOTIFY-BGAGENT 계열 native 재보강).
- **hook-matcher 컨벤션 면역 유지**: bkit matcher는 no-comma + no-hyphen + pipe/underscore → matcher-syntax 회귀 계속 면역.
- **신규 관측(강화)**: L7이 PreToolUse `ask`-floor를 CC가 보장 → bkit Layer 6 auto-mode 우회 우려 **native 해소**. env sci-notation은 v208 L55 → v211 L33에서 CC 정책 역전(거부→허용) 확인, bkit 무영향으로 추적 종료.

---

## 6. Quality Checklist

- [x] 범위 37 bullets 전부 캡처 (v211 단일)
- [x] Phase 1.5 raw 검증 (curl raw CHANGELOG + 행범위 sed + grep -c), raw-wins, Errata 0
- [x] HIGH 항목 전부 impact 분류 + 코드검증 (L7 PreToolUse+ask 확인, L11 model grep, L9 MCP 2개)
- [x] ENH 우선순위 배정 (0건 — YAGNI 통과)
- [x] 철학 준수 검증 (변경 0)
- [x] 파일 영향 매트릭스 완성
- [x] 4-Perspective 가치 표 포함
- [x] 한국어 작성
- [x] MEMORY.md 업데이트 (별도)

---

## 7. 결론

CC v2.1.211은 **단일 안정화 릴리스(Fixed 65%)** 로, bkit에 대해 **0 breaking · 0 코드변경 · 0 신규 ENH**. 이번 사이클의 헤드라인은 **L7 (auto mode의 PreToolUse `ask` 오버라이드 fix)** 로, bkit **Layer 6 destructive-detector의 `ask` 결정이 auto mode에서도 prompt로 floor** 되도록 CC가 native 보장하며 #2 차별화를 무료로 강화한다. 더불어 **L11 subagent model-override 지속 fix**가 bkit의 34-agent model-pin(6 Fable)과 v2.1.25 정렬작업을 native로 보강한다. 유일한 후속은 비-ENH maintainer 액션인 **MF-2 RECOMMENDED_VERSION → 2.1.211 bump**이다. 누적 연속 호환은 **154**(v2.1.34~v2.1.211)로 갱신된다.

> 즉시 흡수 권장. bkit 코드/문서/에이전트/훅 변경 불요.
</content>
