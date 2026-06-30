---
name: cc-version-history-v2180-v2181
description: CC v2.1.179 → v2.1.181 영향 분석 history (ADR 0003 22번째 정식 적용 ✦, v181만 present 39 bullets / v180 R-2 진성 skip npm404, Breaking 0 / Breaking-equivalent 0, auto-benefit 6건 헤드라인=#34 AskUserQuestion multi-select Other-drop fix MEDIUM, 신규 ENH(implement) 0건 18-cycle 연속 ENH-367 예약 유지, 차별화 streak #56293→23 #57317→17 #58904→13, ⚠️신규신호 #56293·#57317 not_planned 종료=moat강화 streak break아님, MON-CC-NEW-CHOICE-LOOP=#64447 liveness STAYS ACTIVE #34는 별개버그, monitor 4건 전부 유지, Phase 1.5 gh-API base64 직행 39확정 model-WebFetch우회, R-2 skip+1 v180, R-3 hotfix #14 2.1.169회귀, 129 consecutive milestone, dist-tags stable2.1.170/latest2.1.181 drift+11, MF-1 RECOMMENDED_VERSION 2.1.118 4-cycle carry)
metadata:
  type: project
---

# CC v2.1.179 → v2.1.181 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-18
- **분석 대상**: CC v2.1.179 → v2.1.181 (**v181만 present 39 bullets**)
- **baseline**: v2.1.179
- **R-2 true skip**: **+1건 (v180)** — npm E404 + changelog floor(v132) 위 부재 이중 확인. 누적: v134/135/151/155/164/171/177/180 (8건)
- **dist-tags**: latest=next=2.1.181 / stable=2.1.170 / installed=2.1.181
- **ADR 0003 적용**: **22번째 정식 적용 ✦**
- **누적 연속 호환**: 128 → **129 ✦** (v2.1.34 ~ v2.1.181, +1 present, R-2 skip 8건 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건
- **auto-benefit**: 6건 — **[헤드라인] #34 AskUserQuestion multi-select Other-drop fix(MEDIUM, bkit AskUserQuestion 의무 사용)** / #33 preview word-wrap(LOW) / #7 subagent 패널(LOW) / #21 subagent Thinking 표시(LOW) / #22 subagent waiting 표시(LOW) / #11 Foundry·base_url prompt caching(LOW)
- **Neutral**: 33건
- **신규 ENH(implement)**: 0건 (**18-cycle 연속**) — 모든 후보 YAGNI 탈락
- **마지막 ENH 번호**: ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 유지(미소비)**
- **권장 CC**: **stable v2.1.170 pin** (latest 2.1.181 허용 가능, Breaking 0이나 11-bullet runtime/startup churn). drift +11 CRITICAL

## 3. 헤드라인 — #34 ↔ MON-CC-NEW-CHOICE-LOOP (핵심 판정)

- **#34 verbatim**: "Fixed AskUserQuestion multi-select questions silently dropping a typed Other free-text answer when submitting"
- **GitHub 이슈(리서처)**: #68235 2026-06-16 종료 (high-confidence-inferred)
- **CHOICE-LOOP 실측**: `lib/cc-regression/registry.js:151-158` → **MON-CC-NEW-CHOICE-LOOP = #64447 (liveness/무한루프)**
- **판정**: **CHOICE-LOOP STAYS ACTIVE** — #34/#68235는 multi-select Other-drop = **correctness** 버그로 #64447 **liveness**와 별개. 리서처 추론 이슈번호와 모니터 추적 이슈가 다름을 분석가가 정독으로 확정 (엄밀 판정 사례)
- **bkit 영향**: #34는 bkit 의무 AskUserQuestion(SessionStart+스킬) 신뢰성↑ auto-benefit MEDIUM. 인접 미해결 #62006/#68417는 향후 모니터 후보(P3)

## 4. Phase 1.5 게이트 — gh-API 직행 (model-WebFetch 우회)

- 직전 cycle(v170-179) model-WebFetch under/over-count 교훈 반영 → **처음부터 `gh api contents/CHANGELOG.md | base64 -d` 행 단위 열거** → count 불일치 0
- v181 = **39 bullets** 확정 (Added 4 / Improved 5 / Changed 2 / Fixed 28)
- v180 R-2 진성 skip 이중 확인: npm E404 + changelog floor 위 부재 (R-1 silent publish 아님)
- spot-check 3건: #19(subagent depth) / #34(AskUserQuestion Other) / #11(Foundry caching)

## 5. bkit-relevant 플래그 실측

| Bullet | 검증 (파일) | 결과 |
|--------|-----------|------|
| #34 AskUserQuestion Other-drop fix | registry.js:151-158 (CHOICE-LOOP=#64447) | auto-benefit MEDIUM (헤드라인, CHOICE-LOOP 별개) |
| #33 AskUserQuestion preview wrap | bkit preview 사용 | auto-benefit LOW |
| #19 foreground subagent 5단계 depth limit | sub-agent-dispatcher.js(중첩 spawn 없음)+team-protocol.js:6-7(1-level) | bkit 1-level dispatch → cap 도달 불가. Neutral |
| #11 Foundry·base_url prompt caching | docs/03-analysis/prompt-caching-optimization.md:6 | attestation token 축, #56293과 직교. Neutral(Foundry만 LOW) |
| #14 startup 회귀 ~120ms (2.1.169 도입) | .mcp.json (MCP 2개) | fix 조건=no-MCP, bkit는 MCP 2개 → Neutral (R-3 신호) |
| #7/#21/#22 subagent 패널·표시 | bkit Task spawn | DX auto-benefit LOW |
| #1/#2/#3 /config·allowAppleEvents·presence-file | settings.json 미배포 | Neutral |

- **Hook 스키마 변경 0건**. PreToolUse/PostToolUse/Stop/SubagentStop 변경 0 → contract test 불필요

## 6. 차별화 streak 갱신 + ⚠️ not_planned 종료 신호

| Issue | ENH | v179 | v181 | 이슈 상태 | 비고 |
|-------|-----|:---:|:---:|------|------|
| #56293 caching 10x | ENH-292 P0 | 22 | **23** | **CLOSED not_planned (06-02)** | #19·#11은 직교축. moat intact |
| #57317 PostToolUse drop | ENH-303 P1 | 16 | **17** | **CLOSED not_planned (06-06)** | plugin-hook reachability bullet 0건 |
| #58904 heredoc bypass | ENH-310 P1 | 12 | **13** | **OPEN** (security, 06-05) | heredoc bullet 0건 |

- **⚠️ 신규 패턴 — not_planned housekeeping 종료**: #56293·#57317이 며칠 간격 코드 fix 없이 not_planned 종료. **streak break 아님**("닫힘≠고침"). Anthropic 미수정 의사 → bkit workaround 가치 영구화(moat 강화). **향후 streak break 판정은 code-fix bullet에만 의존, 이슈 종료 상태 무시**. (differentiator-streaks 에이전트 메모리 반영 완료)
- surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

## 7. R-Series + Drift

| 패턴 | 본 delta | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | v181 full entry, v180 미발행(R-1 아님) |
| R-2 true semver skip | **+1** | v180 (npm E404). 누적 8건 |
| R-3 hotfix chain | **+1** | #14 startup 회귀(2.1.169 도입→2.1.181 fix) |

- release_drift_score: stable=2.1.170 / latest=2.1.181 → **drift +11 (CRITICAL ≥8)**. 직전 +10과 유사

## 8. Monitor 상태 (4건 전부 유지)

- **MON-CC-NEW-BG-OTEL-DROP (#64436)**: v181 OTEL bullet 0건. STAYS ACTIVE
- **MON-CC-NEW-PLUGIN-HOOK-DROP (#57317)**: v181 reachability bullet 0건, 이슈 not_planned 종료(코드 fix 아님). STAYS ACTIVE
- **MON-CC-NEW-CHOICE-LOOP (#64447 liveness)**: v181 #34는 별개 correctness 버그, #64447 미해결. STAYS ACTIVE
- **MON-CC-NEW-STOP-SCHEMA-STRICT (ENH-366 P0)**: v181 Stop hook 출력 스키마 변경 0건. STAYS RESOLVED

## 9. 유지보수 발견 (MF-1) — 4-cycle carry-forward

- **위치**: `lib/infra/cc-version-checker.js:40` `const RECOMMENDED_VERSION = '2.1.118';` (4-cycle 변동 없음). MIN_VERSION='2.1.78'(:34)
- **문제**: stable 2.1.170 대비 ~52릴리스 stale
- **조치**: flag 유지(미수정) — 분석 전용 + No Guessing
- **권고**: 다음 하드닝 스프린트에서 team-set floor ≥2.1.170 bump

## 10. 메모리 정정

- 없음 — bkit baseline 재측정 일치 (v2.1.22 / agents 40 / skills 44 / lib 190 modules 22 subdirs / MCP 2)
- **다음 baseline**: v2.1.181 (다음 분석 v2.1.182부터)
