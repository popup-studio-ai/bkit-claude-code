# CC v2.1.162 → v2.1.168 영향 분석 및 bkit 대응 보고서 (ADR 0003 열아홉 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 19번째 정식 적용, 신규 ENH(implement) 0건 **15-cycle 연속**, **119 consecutive compatible milestone**, **6-version multi-delta (46 bullets, v164 true skip)**, Breaking 0건 / Breaking-equivalent 0건, 차별화 6/6 streak 갱신 (#56293→20 / #57317→14 / #58904→10), **OTEL 모니터 STAYS ACTIVE (v163~168 OTEL bullet 0건)**, Phase 1.5 게이트 **over-count trap 회피** (researcher 47 → raw 46), R-2 skip 1건(v164))
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (bkit.config.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-06-08
> **PDCA Cycle**: cc-version-analysis (v2.1.162 → v2.1.168, **6-version multi-delta** — 직전 v2.1.162 분석 이후 신규 v163/165/166/167/168, v164 결번)
> **CC Range**: v2.1.162 (baseline) → **v2.1.168** (npm latest, installed=2.1.168, 게시자 wolffiex)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 0건 / Breaking-equivalent 0건 / 신규 ENH(implement) 0건 15-cycle 연속 / 차별화 6/6 streak 갱신 / 119 consecutive milestone / OTEL 모니터 #64436 STAYS ACTIVE / 권장 CC v2.1.168 즉시 격상 / ⚠️ 유지보수 발견 1건(MF-1) — cc-version-checker RECOMMENDED_VERSION ~50릴리스 stale, 팀 결정 필요**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (v163/v166 Breaking 섹션 부재, flat list) |
| **Breaking-equivalent** | **0건** — soft-breaking 후보(v163 #1 managed version-gate / #16 hook `if:` 매칭 / #17 deny `$HOME` / v166 #2 deny glob / #3 SendMessage authority / #16 MCP `${VAR}` predicate)는 **bkit 부착점 0건 실측 확인**되어 무영향. 핵심 근거: **bkit는 `settings.json`을 전혀 배포하지 않음** + **dispatcher는 SendMessage가 아닌 Task spawn 사용** |
| **bkit-friendly (auto-benefit)** | **3건** — v163 #4 Stop/SubagentStop `additionalContext`가 hook-error로 분류되지 않고 턴 지속(**bkit가 이미 사용 중** → native 강화) / v163 #16 hook `if:` subshell·backtick 매칭(Diff#6 자동 강화) / v163 #9 `$TMPDIR` 전역 override 회귀(2.1.154) 복구(robustness) |
| **out-of-scope (무영향)** | **다수** — JetBrains 렌더링, Kitty 키보드, voice mode, `claude agents` UI, PowerShell/Windows, bg-pty-host 등 ~35 bullets |
| **OTEL 모니터 #64436 처리** | **STAYS ACTIVE** — v163~v168에 OTEL/telemetry/metrics shutdown-flush 관련 bullet **0건**. `expectedFix: null` / `resolvedAt: null` 유지 |
| **신규 ENH(implement) 후보** | **0건 (15-cycle 연속)** — fallbackModel 가이드/version-pin 문서 후보 2건 모두 **Deferred(doc-only)**, ENH 번호 미소비 |
| 마지막 ENH 번호 | ENH-328 (변동 없음, ENH-329 미소비 유지, ENH-317 CANCELLED 유지) |
| **차별화 6/6 streak 갱신** | **#56293 19→20 (ENH-292 P0) / #57317 13→14 (ENH-303 P1) / #58904 9→10 (ENH-310 P1)** — 46 bullets 중 3대 이슈 root cause 해결 0건, streak 연장 |
| **메모리 정정** | 없음 — bkit baseline 6/6 항목 직접 재측정 일치 (v2.1.22 / agents 40 (model 40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (현재 main GA 안정, 119 consecutive milestone 입증) |
| **유지보수 발견 (MF-1)** | ⚠️ `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION = '2.1.118'` — 현 latest/installed(2.1.168) 대비 ~50릴리스 stale. **분석 전용 스킬이므로 본 cycle에서 수정하지 않고 flag만** — 지원 floor 정책은 팀 결정 필요 (No Guessing) |
| **연속 호환 릴리스** | **119 milestone** (v2.1.34 → v2.1.168, 114 → 119, +5 게시 — v163/165/166/167/168, R-2 skip v134/135/151/155/164 제외) |
| ADR 0003 적용 | **YES (19번째 정식 적용)** |
| **권장 CC 버전** | **v2.1.168 즉시 격상 권고** (auto-benefit 3건, Breaking 0, clean delta). **보수적 권장 stable v2.1.153 drift +15 CRITICAL band** → stable 격상 결정 권고 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.162 → v2.1.168 영향 분석 (ADR 0003 19번째)        │
│  ★ 6-version multi-delta (46 bullets, v164 true skip)    │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 46 bullets (raw-verified)              │
│      v163: 22 / v166: 21 / v165·167·168: 1 each (3)     │
│      v164: 결번 (R-2 true skip, 3-source 확인)          │
│  🔍 Phase 1.5 게이트: researcher 47 → raw 46            │
│      (over-count trap 회피 — v166 22→21,               │
│       raw CHANGELOG = GitHub tag byte-identical)         │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking: 0건 / Breaking-equivalent: 0건             │
│      • bkit는 settings.json 미배포 → deny/managed       │
│        설정 변경(v163#17, v166#2/#16) 전부 Neutral      │
│      • dispatcher = Task spawn (≠ SendMessage)          │
│        → v166#3 cross-session authority 무관             │
│  🟢 auto-benefit 3건                                     │
│      • v163#4 Stop/SubagentStop additionalContext       │
│        (bkit 이미 사용 → native 강화, Diff#1/#5)        │
│      • v163#16 hook if: subshell·backtick 매칭(Diff#6)  │
│      • v163#9 $TMPDIR 전역 override 회귀 복구(robust)   │
│  🆕 신규 ENH(implement): 0건 (15-cycle 연속)            │
│  ⚠️ 유지보수 발견 MF-1: RECOMMENDED_VERSION 2.1.118     │
│      ~50릴리스 stale (flag only, 팀 결정 필요)          │
│  📈 차별화 6/6 streak: #56293→20 #57317→14 #58904→10   │
│  ✅ 연속 호환: 119 milestone (v2.1.34~v2.1.168)         │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | `claude -p` 무한 hang fix(v163 #7), org-managed 권한 startup race fix(v163 #11), bg-task 손실 fix(v163 #12), 모델 overload 시 fallbackModel 복원력(v166 #1), image-processing 에러+토큰낭비 fix(v166 #8) |
| **개발자(Dev/bkit)** | ⟷ 무영향 | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 15-cycle 연속 무수정. 단 내부 유지보수 발견 MF-1 별도 |
| **보안(Security)** | ⬆ 개선 | v166 #3 SendMessage relayed-permission authority 박탈(cross-session 권한 우회 클래스 하드닝), v163 #17 deny `$HOME` 우회 fix, v166 #2 deny-rule glob 문법 강화, v166 #15 invalid managed-entry가 나머지 정책 무력화하던 버그 fix → CC 권한 계층 전반 자동 강화 (bkit Defense layer 하부) |
| **운영(Ops)** | ⬆ 개선 | v163 #9 `$TMPDIR` bazel/EDR 회귀 복구, v163 #19 bg-session 백그라운드 업데이트, v166 #5 fallback 모델 1회 재시도, v166 #13 orphaned bg-pty-host 100% CPU fix → CI/원격/EDR 환경 안정성 |

---

## 2. CC v2.1.163~v2.1.168 변경사항 (46 bullets, raw-verified)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — over-count trap 회피

| Field | Agent 보고 | Raw 검증 | Source URL | Verdict |
|-------|:---:|:---:|------|:---:|
| v163 | 22 | **22** | raw CHANGELOG.md | match |
| v165 | 1 | 1 | raw CHANGELOG (placeholder) | match |
| v166 | 22 | **21** | raw CHANGELOG = GitHub release tag (byte-identical) | **errata (raw wins, −1)** |
| v167 | 1 | 1 | raw CHANGELOG (placeholder) | match |
| v168 | 1 | 1 | raw CHANGELOG (placeholder) | match |
| v164 | skip | **skip (헤더 부재)** | npm 404 + GitHub 404 + CHANGELOG 헤더 부재 (3-source) | match |
| **Total bullets** | **47** | **46** | sum | **errata (raw wins, −1)** |

- **over-count trap 회피 (핵심 학습)**: cc-version-researcher가 v166을 22로 보고(자가 caveat에서 "model-parsed boundary, not byte-exact" 명시) → 메인 세션 raw CHANGELOG.md + GitHub release tag 이중 fetch 결과 **둘 다 21 (byte-identical)** → raw 채택 **21**. 직전 4개 cycle(v2.1.16/145/161/162)이 모두 **under-count** 패턴이었던 반면, 본 cycle은 **첫 over-count 패턴** → 게이트가 양방향 오차를 모두 포착함을 입증.
- **구조**: v163/v166 CHANGELOG는 sub-heading 없는 **flat list**. Added/Fixed/Improved 분류는 선행 동사 기반이며 소스 명시값 아님.
- **v164 true skip**: npm(404) + GitHub release(404) + CHANGELOG(헤더 부재) 3-source 교차 확인. R-2 패턴.
- **spot-check 3건 verbatim 일치**: v166 #2(deny glob `"*"`) / v166 #3(SendMessage authority) / v163 #17(`Read(~/Desktop/**)` `$HOME` deny) — raw 양 소스 일치.

### 2.2 버전별 분류 요약

| 버전 | bullets | 핵심 항목 | 게시자 |
|------|:---:|------|------|
| v2.1.163 | 22 | managed version-gate, `/plugin list`, Stop/SubagentStop `additionalContext`, Skills `\$` escape, MCP `CLAUDE_CODE_SESSION_ID` on resume, `$TMPDIR` 회귀 복구, hook `if:` subshell 매칭, deny `$HOME` fix | wolffiex |
| v2.1.164 | — | **결번 (R-2 true skip)** | — |
| v2.1.165 | 1 | "Bug fixes and reliability improvements" (placeholder) | wolffiex |
| v2.1.166 | 21 | `fallbackModel` setting, deny-rule glob, SendMessage authority 하드닝, thinking-disable 의미, managed `${VAR}` predicate fix, JetBrains/Kitty/PowerShell fixes | wolffiex |
| v2.1.167 | 1 | "Bug fixes and reliability improvements" (placeholder) | wolffiex |
| v2.1.168 | 1 | "Bug fixes and reliability improvements" (placeholder) | wolffiex |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 직접 재측정 (Numeric Correction Protocol)

| 항목 | 측정값 | 측정 명령 | 이전 메모리 | 판정 |
|------|:---:|------|:---:|:---:|
| agents | 40 | `ls agents/*.md \| wc -l` | 40 | 일치 |
| model: 커버리지 | 40/40 | `grep -l "^model:" agents/*.md \| wc -l` | 40/40 | 일치 |
| skills | 44 | `ls skills/*/SKILL.md \| wc -l` | 44 | 일치 |
| lib modules | 190 | `grep -rl "module.exports" lib/ \| wc -l` | 190 | 일치 |
| lib subdirs | 22 | `ls -d lib/*/ \| wc -l` | 22 | 일치 |
| MCP servers | 2 | `ls servers/*/index.js \| wc -l` | 2 | 일치 |
| bkit version | 2.1.22 | `grep version bkit.config.json` | 2.1.22 | 일치 |

→ **6/6 항목 메모리 일치. 정정 제안 없음.** (참고: SessionStart preflight 표기 "34 agents / 174 lib"는 **stale 표기**이며, 실측·직전 메모리 모두 40/190으로 일치. preflight 수치는 채택하지 않음.)

### 3.1 bkit-relevant 플래그 독립 검증 (메인 세션 spot-check 포함)

| Bullet | 검증 방법 | 결과 |
|--------|-----------|------|
| **v163 #4** Stop/SubagentStop `additionalContext` | `grep additionalContext scripts/subagent-stop-handler.js` | **이미 구현 확인** — `scripts/subagent-stop-handler.js:124-131`이 `hookSpecificOutput.additionalContext`(nextActionHint)를 방출 중. v163부터 이 출력이 hook-error로 분류되지 않고 턴을 지속 → **auto-benefit** (Diff#1 Memory Enforcer / Diff#5 continueOnBlock 패턴 native 강화). 메인 세션 직접 재확인 완료 |
| **v163 #16** hook `if:"Bash(...)"` subshell·backtick 매칭 | `heredoc-detector.js` 검토 + 게이트 의미 분석 | CC predicate 매칭 변경일 뿐, **CC 권한시스템의 heredoc-body 사각지대는 그대로** → Diff#6(#58904) **약화시키지 않음**. `lib/defense/heredoc-detector.js` 수정 불필요 |
| **v163 #17 / v166 #2** deny rules `$HOME` / glob tool-position | repo 전체 `settings.json` 배포 여부 grep | **bkit는 `settings.json`을 배포하지 않음** → deny rule 변경 부착점 0건. Neutral |
| **v166 #3** SendMessage relayed-permission authority | dispatcher 구현 검토 | dispatcher는 **Task spawn 사용 (≠ SendMessage)** → cross-session authority 변경 무관. Diff#3 sequential dispatch 영향 0건 |
| **v163 #5** Skills `\$` escape (digit 앞 literal `$`) | `grep '\$[0-9]'` skills command body | 유일 매치는 prose(`$3/Mtok` 등 가격 표기)이며 **command body 아님** → 무관 |
| **v163 #6 / v166 #16** MCP `CLAUDE_CODE_SESSION_ID` / `${VAR}` predicate | `Read .mcp.json` | 두 서버(bkit-pdca, bkit-analysis) `command`/`args`/`env`만, predicate·`${VAR}`·timeout 필드 0개 → no-op |
| **v166 #1** `fallbackModel` setting | agents frontmatter (40/40 `model:`) | per-agent `model:`은 frontmatter 고정값. `fallbackModel`은 CC 세션 레벨 설정 → agent 스키마 무관. Neutral |
| **v163 #1** `requiredMinimumVersion`/`requiredMaximumVersion` managed settings | bkit 배포 모델 | bkit는 **plugin**이며 managed settings 소유 주체 아님 → 직접 부착점 없음. (단 enterprise 사용자 대상 문서화 후보 — §4 참조) |

### 3.2 soft-breaking 후보 → bkit 컴포넌트 매핑

| Bullet | bkit 컴포넌트 | 영향 | 근거 |
|--------|---------------|------|------|
| v163 #1 managed version-gate | 없음 | Neutral | bkit는 managed settings 미소유 |
| v163 #16 hook `if:` 매칭 | hooks/ (Bash-guard) | Neutral / auto-benefit | CC predicate 정확도 향상, bypass surface 축소 |
| v163 #17 deny `$HOME` | 없음 (settings 미배포) | Neutral | deny 규칙 미배포 |
| v166 #2 deny glob | 없음 (settings 미배포) | Neutral | deny 규칙 미배포 |
| v166 #3 SendMessage authority | sub-agent-dispatcher.js | Neutral | Task spawn 사용, SendMessage 미사용 |
| v166 #16 MCP `${VAR}` predicate | .mcp.json | Neutral | predicate 필드 0개 |

**Hook 스키마 변경: 없음. PreToolUse/PostToolUse: 없음. Agent/Skill frontmatter 스키마: 없음.** → `test/contract/hook-input-schema.test.js`, `hook-output-schema.test.js` 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (15-cycle 연속)**. ENH 번호 미소비(ENH-328 유지, ENH-329 미소비).

### 4.1 Intent Discovery
- **이 업그레이드의 최대 가치**: v163 #4가 bkit의 기존 `additionalContext` 방출 패턴을 first-class로 격상 — bkit가 이미 쓰던 패턴이 native 지원으로 바뀌어 추가 작업 없이 견고성 상승.
- **놓치면 안 되는 critical change**: 없음(Breaking 0). 단 **내부적으로** RECOMMENDED_VERSION stale(MF-1)은 사용자에게 잘못된 warn을 띄울 수 있어 별도 추적 필요.
- **workaround 대체 native 기능**: v163 #4 (additionalContext가 더 이상 hook-error 아님).

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| fallbackModel 사용 가이드 문서 | v166 #1 | **Deferred (doc-only, 번호 미소비)** | bkit agent는 per-agent `model:` 고정. fallbackModel은 세션 설정으로 bkit 코드 부착점 없음. 실사용 수요 미확인 → **No Guessing**. 향후 enterprise 가이드에 1-liner로 충분 |
| version-pin 문서화 (requiredMin/Max) | v163 #1 | **Deferred (doc-only, 번호 미소비)** | bkit는 managed settings 미소유. enterprise 사용자가 CC 버전 floor를 강제하려는 경우 docs/06-guide에 참조 추가 가능하나 현 수요 없음 → **YAGNI** |
| Stop/SubagentStop additionalContext 활용 | v163 #4 | **DROP** | 이미 구현됨(`subagent-stop-handler.js:124-131`). 추가 작업 불필요 → auto-benefit으로 분류 |
| native deny-glob/managed 설정 채택 | v166 #2/#16 | **DROP** | bkit settings.json 미배포 정책 → 작업 대상 0 |

→ 15-cycle 연속 무변경 = 성숙 아키텍처 신호. 추측성 ENH 거부가 No Guessing 철학에 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `const RECOMMENDED_VERSION = '2.1.118';` |
| **문제** | 현 latest/installed = 2.1.168. 권장값이 ~50릴리스 stale → 2.1.118 미만 사용자에게만 warn이 떠야 하나, 실질 권장 라인(MEMORY: 보수 v2.1.123 / 균형 v2.1.140)과도 불일치 |
| **본 cycle 조치** | **flag만 (수정 안 함)** — 본 스킬은 분석 전용(HARD-GATE). 또한 임의 bump은 **No Guessing** 위반: 팀이 "지원 floor"(어느 버전을 최소 권장으로 강제할지)를 결정해야 함 |
| **권고** | 별도 PDCA/유지보수 작업으로 RECOMMENDED_VERSION 정책 갱신 (후보: 마지막 fully-analyzed v2.1.168, 또는 MEMORY 균형선 v2.1.140). `lib/infra/cc-version-checker.js:198~203` 분기 로직은 정상 |

---

## 5. 차별화 6/6 streak 갱신

v163~v168 bullet 중 #56293/#57317/#58904 root cause 해결 항목 **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 (P0) | 19 | **20** | CLOSED-not-planned, bkit Diff#3 sequential dispatch 유일 mitigation 유지. v163~168 caching bullet 0건 |
| #57317 PostToolUse drop | ENH-303 (P1) | 13 | **14** | v163 #4는 Stop/SubagentStop additionalContext일 뿐 PostToolUse drop/ordering 무관. root cause 미해결 |
| #58904 heredoc bypass | ENH-310 (P1) | 9 | **10** (✦ 10 milestone) | OPEN security. **v163 #16(hook `if:` subshell 매칭)은 predicate 매칭 변경일 뿐 heredoc-body 사각지대 미해결** → Diff#6 약화 없음 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

**핵심 구분 (메모리 반영)**: v163 #16과 #58904는 별개 — #16은 CC가 사용자 정의 hook `if:` 조건을 평가할 때 subshell/backtick 내부 명령까지 매칭하도록 한 fix이고, #58904(Diff#6)는 CC **권한 시스템**이 heredoc body 내 위험 명령을 검사하지 못하는 사각지대. bkit `heredoc-detector.js`는 후자를 보강하므로 v163 #16과 무관하게 유효.

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | v165/167/168 placeholder note이나 CHANGELOG+GitHub release 존재 (silent 아님) |
| R-2 true semver skip | **+1 (v164)** | npm 404 + GitHub 404 + CHANGELOG 헤더 부재 3-source 확정. 누적 skip: v134/135/151/155/**164** |
| R-3 hotfix chain | +0 | v167/v168 연속 placeholder이나 회귀 연쇄 징후 없음 |

- **release_drift_score (ENH-309)**: stable=2.1.153 / latest=2.1.168 → **drift = 15 패치 (CRITICAL band ≥8)**. stable 채널 사용자는 안전하나 latest 대비 +15 — 역대 최대 격차. stable 격상 결정 권고. (prior batch stable 2.1.152 → 2.1.153 전진)

---

## 7. OTEL Monitor

MON-CC-NEW-BG-OTEL-DROP (#64436): v163~v168에 OTEL/telemetry/metrics shutdown-flush 관련 bullet **0건**. 모니터 **STAYS ACTIVE**, `expectedFix: null` / `resolvedAt: null` 그대로.

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking / Breaking-equivalent | **0건 / 0건** (soft-breaking 후보 전부 실측 no-op — settings.json 미배포 + Task spawn dispatch) |
| bkit 소스 변경 필요 | **N** (15-cycle 연속 무수정) — 단 MF-1 별도 유지보수 권고 |
| Consecutive compatible | **114 → 119** (v2.1.34~v2.1.168, R-2 v164 제외) |
| 신규 ENH(implement) | **0건** (15-cycle 연속, ENH 번호 미소비) |
| 권장 CC 액션 | **v2.1.168 즉시 격상 (ADOPT)** — auto-benefit 3건, Breaking 0. stable(2.1.153) drift +15 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1**: cc-version-checker RECOMMENDED_VERSION(2.1.118) 갱신 — 별도 작업, 팀이 지원 floor 결정 |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH(implement)-zero streak: 14 → **15**
- Consecutive compatible: 114 → **119**
- Differentiation: #56293=**20**, #57317=**14**, #58904=**10** (✦ 10 milestone)
- R-2 skip 누적: v134/135/151/155 → **+v164**
- Architecture baseline: 6/6 재측정 일치, 정정 없음
- 마지막 ENH 번호: ENH-328 유지 (ENH-329 미소비)
- 신규 메모리: "no settings.json — hook-based defense" 판정 근거 (향후 deny/allow/managed-settings 변경 = Neutral 자동 판정)
- 유지보수 추적: **MF-1** RECOMMENDED_VERSION stale
- 다음 baseline: **v2.1.168** (다음 분석 v2.1.169부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(46 bullets, v164 skip 포함) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (researcher 47 → raw 46, over-count trap 회피)
- [x] raw CHANGELOG + GitHub release tag 이중 fetch (v166 byte-identical 21)
- [x] bullet count cross-verify (v163=22 / v166=21 / placeholder 3 / v164 skip)
- [x] v164 true skip 3-source 확인 (npm+GitHub+CHANGELOG)
- [x] ≥3 spot-check (v166 #2/#3, v163 #17) verbatim 확인
- [x] 메인 세션 actionable 클레임 직접 재검증 (RECOMMENDED_VERSION:40, subagent-stop-handler:124-131)
- [x] 아키텍처 6/6 직접 재측정 (정정 없음)
- [x] ENH 우선순위 (implement 0건, Deferred/DROP 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
- [x] 유지보수 발견(MF-1) flag (분석 전용 — 미수정)
