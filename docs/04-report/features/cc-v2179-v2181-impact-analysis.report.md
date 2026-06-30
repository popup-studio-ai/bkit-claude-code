# CC v2.1.179 → v2.1.181 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물두 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 22번째 정식 적용 ✦, 신규 ENH(implement) 0건 **18-cycle 연속**, **129 consecutive compatible milestone ✦**, **v181만 present 39 bullets / v180 R-2 진성 skip(npm 404)**, Breaking 0건 / Breaking-equivalent 0건, auto-benefit 6건(헤드라인 #34 AskUserQuestion Other-drop fix MEDIUM), 차별화 6/6 streak 갱신 (#56293→23 / #57317→17 / #58904→13), **#56293·#57317 not_planned 종료 신호(moat 강화)**, monitor 4건 전부 유지 (CHOICE-LOOP=#64447 STAYS ACTIVE — #34는 별개 버그), Phase 1.5 gh-API base64 authoritative 39 확정, R-2 skip +1(v180), R-3 hotfix #14(2.1.169 회귀), MF-1 4-cycle carry-forward)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (plugin.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-06-18
> **PDCA Cycle**: cc-version-analysis (v2.1.179 → v2.1.181)
> **CC Range**: v2.1.179 (baseline) → **v2.1.181** (npm latest=next=installed=2.1.181, stable=2.1.170, v2.1.180 미발행 R-2 skip)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 0건 / Breaking-equivalent 0건 / 신규 ENH(implement) 0건 18-cycle 연속 / auto-benefit 6건 / 헤드라인 #34 AskUserQuestion Other-drop fix(MEDIUM) — CHOICE-LOOP(#64447)와는 별개 버그 / 차별화 6/6 streak 갱신 / 129 consecutive milestone / monitor 4건 전부 유지 / 권장 CC stable v2.1.170 pin / MF-1 4-cycle carry-forward**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (v181 39 bullets, Added/Improved/Changed/Fixed — 제거/API 파괴 0건) |
| **Breaking-equivalent** | **0건** — 동작 변경 후보(#9 fullscreen URL Cmd+click, #10 "Improved N memories" 라인)는 **bkit 부착점 0건** |
| **bkit-friendly (auto-benefit)** | **6건** — **[헤드라인] #34 AskUserQuestion multi-select "Other" free-text drop fix(MEDIUM, bkit가 AskUserQuestion 의무 사용)** / #33 AskUserQuestion preview word-wrap(LOW) / #7 subagent 패널 idle auto-hide(LOW) / #21 subagent Thinking 시간 표시 fix(LOW) / #22 subagent waiting 표시 fix(LOW) / #11 Foundry·base_url prompt caching fix(LOW) |
| **Neutral (무영향)** | **33건** — `/config`·allowAppleEvents·presence-file 설정(settings.json 미배포), Bun 1.4·스트리밍·auto-retry·startup fix, #14 startup(no-MCP 조건 — bkit는 MCP 2개 보유), #19 subagent 5단계 depth limit(bkit 1-level dispatch) 등 |
| **헤드라인 판정 (#34 ↔ MON-CC-NEW-CHOICE-LOOP)** | **CHOICE-LOOP 모니터 STAYS ACTIVE** — `registry.js:151-158` 정독 결과 CHOICE-LOOP가 추적하는 것은 **#64447(liveness/무한루프)**. v181 #34는 **별개**의 AskUserQuestion 버그(multi-select "Other" free-text drop = **correctness**, liveness 아님)를 수정. 리서처 추론 #68235와도 다른 이슈 → 모니터 미해결 |
| **신규 ENH(implement) 후보** | **0건 (18-cycle 연속)** — 모든 후보 YAGNI 탈락 |
| 마지막 ENH 번호 | ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 유지(미소비)** |
| **차별화 6/6 streak 갱신** | **#56293 22→23 (ENH-292 P0) / #57317 16→17 (ENH-303 P1) / #58904 12→13 (ENH-310 P1)** — v181 39 bullets 중 3대 이슈 root cause 직접 해결 0건 |
| **⚠️ 신규 신호 (moat 강화)** | **#56293(06-02)·#57317(06-06) 모두 `not_planned` 종료** — 코드 fix 아닌 housekeeping 종료. streak break 아님(닫힘 ≠ 고침). Anthropic 미수정 의사 표명 → **bkit workaround 가치 영구화**. #58904는 여전히 OPEN(security label) |
| **메모리 정정** | 없음 — bkit baseline 재측정 일치 (v2.1.22 / agents 40 / skills 44 / lib 190 modules 22 subdirs / MCP 2) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (129 consecutive milestone 입증) |
| **유지보수 발견 (MF-1, carry-forward)** | ⚠️ `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION = '2.1.118'` — stable 2.1.170 대비 ~52릴리스 stale. **4-cycle 연속 carry-forward**. 분석 전용이라 미수정, 팀 결정 필요(No Guessing) |
| **연속 호환 릴리스** | **129 milestone ✦** (v2.1.34 → v2.1.181, 128 → 129, +1 present — R-2 skip v134/135/151/155/164/171/177/**180** 제외) |
| ADR 0003 적용 | **YES (22번째 정식 적용 ✦)** |
| **권장 CC 버전** | **stable v2.1.170 pin 권고** — v181은 Breaking 0이나 11-bullet runtime/startup churn(Bun 1.4, 스트리밍, startup 회귀 fix). bkit-relevant win(#34/#33/#11)은 QoL로 긴급도 낮음. latest 2.1.181 허용 가능하나 stable 권고 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.179 → v2.1.181 영향 분석 (ADR 0003 22번째 ✦)      │
│  ★ v181만 present (39 bullets) / v180 R-2 진성 skip      │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 39 bullets (v181, gh-API authoritative)│
│      v180 = npm 404 → R-2 진성 skip (silent publish 아님)│
│  🔍 Phase 1.5 게이트: gh-API base64 디코딩 직행          │
│      • model-WebFetch 우회 → count 불일치 0             │
│      • v181 = 39 bullets 행 단위 확정                    │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking: 0건 / Breaking-equivalent: 0건             │
│  🟢 auto-benefit 6건 / Neutral 33건                      │
│      • [헤드라인] #34 AskUserQuestion Other-drop fix     │
│        (MEDIUM) — bkit AskUserQuestion 의무 사용 수혜    │
│      • #33 preview wrap / #7·#21·#22 subagent 패널       │
│      • #11 Foundry·base_url prompt caching fix           │
│  🎯 CHOICE-LOOP(#64447) STAYS ACTIVE                     │
│      • #34는 별개 버그(correctness≠liveness)             │
│  🆕 신규 ENH(implement): 0건 (18-cycle 연속)            │
│      • ENH-367 예약 유지                                 │
│  📈 차별화: #56293→23 #57317→17 #58904→13               │
│  ⚠️ moat 강화: #56293·#57317 not_planned 종료           │
│      (코드 fix 아님 → workaround 가치 영구화)            │
│  ⚠️ MF-1 carry: RECOMMENDED_VERSION 2.1.118 (4-cycle)   │
│  ✅ 연속 호환: 129 milestone ✦ (v2.1.34~v2.1.181)       │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | mid-thinking 연결끊김 auto-retry(#6), 긴 문단 line-by-line 스트리밍(#5), `/config key=value` 즉시 설정(#1), startup 지연·crash 다수 fix(#14~#17), AskUserQuestion preview 줄바꿈(#33) |
| **개발자(Dev/bkit)** | ⟷ 무영향 (소폭 ⬆) | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 18-cycle 연속 무수정. **#34 AskUserQuestion Other-drop fix로 bkit 의무 질문 플로우 신뢰성↑(auto-benefit)**. MF-1만 별도 carry |
| **보안(Security)** | ⟷ 무영향 | v181 보안 관련 직접 변경 없음. #2 `sandbox.allowAppleEvents`는 opt-in(기본 비활성). bkit 방어 계층(Diff#1/#2/#6) 무영향 |
| **운영(Ops)** | ⬆ 개선 | startup 회귀 ~120ms fix(#14, no-MCP 조건), Write/Edit 네트워크 드라이브 0-byte fix(#12), AWS credential 갱신 폭주 fix(#24), `claude mcp get/list` 오탐 fix(#25) |

---

## 2. CC v2.1.181 변경사항 (39 bullets, raw gh-API authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh-API 직행 (model-WebFetch 우회)

| Field | Source | 값 | Verdict |
|-------|--------|:---:|:---:|
| v2.1.181 total bullets | `gh api contents/CHANGELOG.md \| base64 -d` 행 단위 열거 | **39** | 확정 |
| v2.1.180 존재 여부 | `npm view @anthropic-ai/claude-code@2.1.180` → **E404** | 미발행 | **R-2 진성 skip** |
| v2.1.181 존재 | `npm view @...@2.1.181` → 2.1.181 (publisher wolffiex) | 존재 | confirmed |
| dist-tags | npm | latest=next=2.1.181 / stable=2.1.170 | confirmed |

- **핵심 학습**: 직전 cycle(v170-179)에서 model-processed WebFetch가 긴 fix 리스트를 under/over-count한 교훈을 반영, 본 cycle은 **처음부터 gh-API base64 디코딩 raw 파일을 행 단위로 직접 열거** → count 불일치 0건.
- **v180 R-2 진성 skip 이중 확인**: (1) changelog floor(v132) 위 retained 범위에서 부재 + (2) npm registry E404 → silent publish(R-1) 아닌 genuine semver skip.
- **spot-check 3건 verbatim**: #19 `"Fixed foreground subagents spawning unbounded nested chains; they now respect the same 5-level depth limit..."` / #34 `"Fixed AskUserQuestion multi-select questions silently dropping a typed Other free-text answer..."` / #11 `"Fixed prompt caching not reading on custom ANTHROPIC_BASE_URL and on Foundry..."`.

### 2.2 카테고리별 분류 (39 bullets)

| 그룹 | 건수 | 핵심 항목 |
|------|:---:|------|
| Added | 4 | `/config key=value`(#1), `sandbox.allowAppleEvents`(#2), `CLAUDE_CLIENT_PRESENCE_FILE`(#3), Bun 1.4(#4) |
| Improved | 5 | 긴 문단 스트리밍(#5), mid-thinking auto-retry(#6), subagent 패널(#7), MCP OAuth 페이지(#8) |
| Changed | 2 | fullscreen URL Cmd+click(#9), "Improved N memories" 라인(#10) |
| Fixed | 28 | prompt caching base_url(#11), Write/Edit 네트워크 드라이브(#12), startup 회귀·crash(#14~#17), **subagent depth limit(#19)**, subagent 표시(#21·#22), **AskUserQuestion(#33·#34)**, AWS credential(#24), `claude mcp` 오탐(#25) 등 |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 재측정 (Numeric Correction Protocol)

| 항목 | 측정값 | 이전 메모리 | 판정 |
|------|:---:|:---:|:---:|
| bkit version | 2.1.22 | 2.1.22 | 일치 |
| agents | 40 | 40 | 일치 |
| skills | 44 | 44 | 일치 |
| lib modules | 190 | 190 | 일치 |
| lib subdirs | 22 | 22 | 일치 |
| MCP servers | 2 (.mcp.json) | 2 | 일치 |

→ **재측정 일치. 정정 제안 없음.**

### 3.1 헤드라인 심층 검증 — #34 ↔ MON-CC-NEW-CHOICE-LOOP

| 항목 | 내용 |
|------|------|
| **CC bullet (verbatim)** | "Fixed AskUserQuestion multi-select questions silently dropping a typed Other free-text answer when submitting" |
| **GitHub 이슈 (리서처)** | #68235 "AskUserQuestion (multiSelect): typed free-text answer silently dropped" 2026-06-16 종료 (high-confidence-inferred) |
| **CHOICE-LOOP 모니터 실측** | `lib/cc-regression/registry.js:151-158` 정독 → **MON-CC-NEW-CHOICE-LOOP = #64447 (liveness/무한루프)** |
| **판정** | **CHOICE-LOOP STAYS ACTIVE** — #34/#68235는 multi-select "Other" drop = **correctness** 버그로, CHOICE-LOOP가 추적하는 #64447 **liveness/무한루프**와 별개. v181은 #64447을 미해결 |
| **bkit 영향** | #34는 bkit이 **의무 사용하는 AskUserQuestion**(SessionStart + 다수 스킬)의 multi-select 신뢰성을 향상 → **auto-benefit MEDIUM**. 인접 미해결 이슈 #62006/#68417는 향후 모니터 후보 |

### 3.2 bkit-relevant 플래그 독립 검증

| Bullet | 검증 (파일) | 결과 |
|--------|-----------|------|
| **#34** AskUserQuestion Other-drop fix | registry.js:151-158 (CHOICE-LOOP=#64447) | **auto-benefit MEDIUM** (§3.1) — CHOICE-LOOP와 별개 |
| **#33** AskUserQuestion preview word-wrap | bkit AskUserQuestion preview 사용 | auto-benefit LOW (UX) |
| **#19** foreground subagent 5단계 depth limit | sub-agent-dispatcher.js (중첩 spawn 없음, strategy-only) + team-protocol.js:6-7 (1-level spawn) | bkit는 1-level만 dispatch → 5단계 cap 도달 불가. Neutral |
| **#11** Foundry·base_url prompt caching fix | docs/03-analysis/prompt-caching-optimization.md:6 | per-request attestation token 축으로 #56293(parallel-prefix cache-miss)과 직교. bkit caching 가이드 무영향. Neutral (Foundry 사용자만 LOW 수혜) |
| **#14** startup 회귀 ~120ms (2.1.169 도입) | .mcp.json (MCP 2개) | fix 조건="no MCP servers configured" — bkit는 MCP 2개 보유 → 조건 불충족. Neutral (R-3 hotfix 신호) |
| **#7/#21/#22** subagent 패널·표시 fix | bkit Task spawn 다용 | DX 관찰성 향상 auto-benefit LOW |
| **#1/#2/#3** `/config`·allowAppleEvents·presence-file | settings.json 미배포 | Neutral (no-settings-json-defense 일관) |
| **#4~#6, #12, #15~#17, #24, #25** runtime/startup/credential fix | — | Neutral (런타임·UX) |

**Hook 스키마 변경: 없음. PreToolUse/PostToolUse/Stop/SubagentStop 이벤트 변경: 없음. Agent/Skill frontmatter: 변경 없음.** → contract test 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (18-cycle 연속)**. ENH-367 예약 유지(미소비).

### 4.1 Intent Discovery
- **최대 가치**: #34 AskUserQuestion Other-drop fix가 bkit의 의무 질문 플로우(SessionStart + 스킬) 신뢰성을 무수정으로 향상.
- **놓치면 안 되는 critical change**: 없음(Breaking 0). #19 subagent depth limit은 bkit 1-level dispatch라 무관.
- **workaround 대체 native 기능**: 없음. 오히려 #56293·#57317이 `not_planned` 종료되어 bkit의 3대 moat workaround 가치가 영구화.

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| AskUserQuestion Other-drop 회피 로직 | #34 | **DROP** | CC가 native 수정 → bkit 측 작업 불요. auto-benefit으로 충분 |
| subagent 5단계 depth 대응 (dispatcher) | #19 | **DROP** | bkit 1-level dispatch, cap 도달 불가 → 작업 대상 0 |
| `/config key=value` 통합 | #1 | **DROP** | bkit settings.json 미배포 정책 → No Guessing |
| 인접 AskUserQuestion 이슈(#62006/#68417) 모니터 추가 | 리서처 | **P3 DEFER (번호 미소비)** | 현 미해결이나 bkit 영향 미확인. 향후 재발 시 모니터 등재 검토 |

→ 18-cycle 연속 무변경 = 성숙 아키텍처 신호. No Guessing 철학 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1, carry-forward) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `const RECOMMENDED_VERSION = '2.1.118';` (4-cycle 변동 없음). 참고: `MIN_VERSION = '2.1.78'`(:34) |
| **문제** | stable 2.1.170 대비 ~52릴리스 stale |
| **본 cycle 조치** | **flag 유지 (미수정)** — 분석 전용 + No Guessing |
| **권고** | 다음 일반 PDCA/하드닝 스프린트에서 team-set floor ≥2.1.170으로 bump. **4-cycle 연속 carry-forward** |

---

## 5. 차별화 6/6 streak 갱신

v181 39 bullets 중 #56293/#57317/#58904 root cause 직접 해결(code fix) **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 이슈 상태 | 비고 |
|-------|-----|:---:|:---:|------|------|
| #56293 caching 10x | ENH-292 (P0) | 22 | **23** | **CLOSED `not_planned` (06-02)** | #19 depth-limit·#11 base_url caching은 parallel-prefix cache-miss와 직교. moat intact |
| #57317 PostToolUse drop | ENH-303 (P1) | 16 | **17** | **CLOSED `not_planned` (06-06)** | v181에 plugin-hook reachability bullet 0건. moat intact |
| #58904 heredoc bypass | ENH-310 (P1) | 12 | **13** | **OPEN** (security label, 06-05) | v181에 heredoc/bash-parsing bullet 0건. Diff#6 독립 면역 |

**⚠️ 신규 패턴 — `not_planned` housekeeping 종료**: #56293·#57317이 며칠 간격(06-02/06-06)으로 코드 fix 없이 `not_planned` 종료. **streak break 아님**("닫힘 ≠ 고침"). Anthropic 미수정 의사 → bkit workaround **가치 영구화**(moat 강화 신호). 향후 streak break 판정은 **code-fix bullet에만** 의존, 이슈 종료 상태에 의존 금지.

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | v181 full CHANGELOG entry, v180은 미발행(R-1 아님) |
| R-2 true semver skip | **+1** | **v180** (npm E404 + changelog floor 위 부재). 누적: v134/135/151/155/164/171/177/180 (8건) |
| R-3 hotfix chain | **+1** | **#14** startup 회귀 ~120ms (2.1.169 도입 → 2.1.181 fix). 그 외 version-attributed 회귀 hotfix 없음 |

- **release_drift_score (ENH-309)**: stable=2.1.170 / latest=2.1.181 → **drift = 11 패치 (CRITICAL band ≥8)**. 직전 +10(stable 2.1.169)과 유사. stable 채널 안전.

---

## 7. Monitor 상태 (4건 전부 유지)

| Monitor | Issue/근거 | v181 처리 | 판정 |
|---------|-------|-----------|------|
| MON-CC-NEW-BG-OTEL-DROP | #64436 | v181 OTEL 관련 bullet 0건 | **STAYS ACTIVE** (expectedFix: null) |
| MON-CC-NEW-PLUGIN-HOOK-DROP | #57317 (skill_post) | v181 plugin-hook reachability bullet 0건. 이슈는 not_planned 종료(코드 fix 아님) | **STAYS ACTIVE** |
| MON-CC-NEW-CHOICE-LOOP | **#64447 (liveness/무한루프)** registry.js:151-158 | v181 #34는 별개 버그(Other-drop=correctness), #64447 미해결 | **STAYS ACTIVE** |
| MON-CC-NEW-STOP-SCHEMA-STRICT | ENH-366 (P0) | v181 Stop hook 출력 스키마 변경 0건 | **STAYS RESOLVED** |

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking / Breaking-equivalent | **0건 / 0건** |
| bkit 소스 변경 필요 | **N** (18-cycle 연속 무수정) — MF-1 별도 유지보수 권고(4-cycle carry-forward) |
| Consecutive compatible | **128 → 129 ✦** (v2.1.34~v2.1.181, +1 present, R-2 skip 8건 제외) |
| 신규 ENH(implement) | **0건** (18-cycle 연속, ENH-367 예약 미소비) |
| 권장 CC 액션 | **stable v2.1.170 pin 권고** (latest 2.1.181 허용 가능, Breaking 0). drift +11 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1 (4-cycle carry-forward)**: RECOMMENDED_VERSION → ≥2.1.170 bump, 팀이 floor 결정 |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH(implement)-zero streak: 17 → **18**
- Consecutive compatible: 128 → **129 ✦** (+1 present)
- Differentiation: #56293=**23**, #57317=**17**, #58904=**13**
- **신규: #56293·#57317 `not_planned` 종료 신호** (moat 강화, streak break 아님) → differentiator-streaks 메모리 반영
- R-2 skip 누적: +1 (v180) → v134/135/151/155/164/171/177/180 (8건)
- R-3 hotfix: #14 (2.1.169→2.1.181)
- Architecture baseline: 재측정 일치, 정정 없음 (40/44/190/22/MCP 2)
- 마지막 ENH 번호: ENH-328(CC-cycle) / 전역 ENH-366, ENH-367 예약 미소비
- Monitor: BG-OTEL-DROP / PLUGIN-HOOK-DROP / CHOICE-LOOP(#64447) STAYS ACTIVE, STOP-SCHEMA-STRICT STAYS RESOLVED
- MF-1: RECOMMENDED_VERSION stale **4-cycle carry-forward**
- 다음 baseline: **v2.1.181** (다음 분석 v2.1.182부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(v181 39 bullets) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (gh-API base64 디코딩 39 확정, model-WebFetch 우회)
- [x] v180 R-2 진성 skip 이중 확인 (npm E404 + changelog floor)
- [x] ≥3 spot-check (#19/#34/#11) verbatim 확인
- [x] 헤드라인(#34↔CHOICE-LOOP) registry.js:151-158 정독 → #64447 별개 판정
- [x] 아키텍처 재측정 (정정 없음, 40/44/190/22/MCP 2)
- [x] ENH 우선순위 (implement 0건, DROP/P3 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 차별화 3 streak 갱신 (23/17/13) + not_planned 종료 신호 기록
- [x] R-2 skip(v180) / R-3 hotfix(#14) 판정
- [x] Monitor 4건 상태 명시 (CHOICE-LOOP=#64447 STAYS ACTIVE)
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
