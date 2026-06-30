---
name: cc-version-history-v2170-v2179
description: CC v2.1.169 → v2.1.179 영향 분석 history (ADR 0003 21번째 정식 적용 ✦, 10-version delta 102 bullets gh-API authoritative, Breaking 0 / Breaking-equivalent 0, auto-benefit 4건 헤드라인=v176 hook `if` Read/Edit/Write 매칭 fix MEDIUM, 신규 ENH(implement) 0건 17-cycle 연속, ENH-367 예약 미소비, 차별화 6/6 streak 갱신 #56293→22 #57317→16 #58904→12, 128 consecutive milestone ✦, Phase 1.5 게이트 model-WebFetch under/over-count 회피 gh-API base64 디코딩 102 확정, CHANGELOG floor v132 발견, R-2 skip +2 v171/v177, monitor 4건 전부 유지 BG-OTEL-DROP/PLUGIN-HOOK-DROP/CHOICE-LOOP ACTIVE + STOP-SCHEMA-STRICT RESOLVED, dist-tags stable 2.1.153→2.1.169 따라잡음 drift +16→+10, MF-1 RECOMMENDED_VERSION 2.1.118 3-cycle carry-forward)
metadata:
  type: project
---

# CC v2.1.169 → v2.1.179 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-17
- **분석 대상**: CC v2.1.169 → v2.1.179 (**10-version delta**)
- **baseline**: v2.1.169 (직전 분석 완료)
- **present 8버전**: v170(2) v172(30) v173(2) v174(13) v175(1) v176(22) v178(23) v179(9) = **102 bullets**
- **R-2 true skip**: **+2건 (v171, v177)** — changelog floor v132 위 retained 범위 내 부재 = 진성 semver skip. 누적: v134/135/151/155/164/171/177
- **dist-tags**: latest=2.1.179 / stable=2.1.169 / next=2.1.179 / installed=2.1.179
- **ADR 0003 적용**: **21번째 정식 적용 ✦**
- **누적 연속 호환**: 120 → **128 ✦** (v2.1.34 ~ v2.1.179, +8 present, R-2 skip 7건 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건
- **auto-benefit**: 4건 — **[헤드라인] v176 hook `if` Read/Edit/Write 매칭 fix(MEDIUM)** / v179 plugin 로딩 성능 remote(LOW) / v178 subagent transcript·메시지·backgrounding fix(DX LOW) / v178 auto-mode subagent classifier 사전평가(security LOW)
- **신규 ENH(implement)**: 0건 (**17-cycle 연속**) — 모든 후보 YAGNI 탈락(DROP/P3)
- **마지막 ENH 번호**: ENH-328(CC-cycle) / 전역 ENH-366(내부 하드닝 소비), **ENH-367 예약 미소비**
- **권장 CC**: v2.1.179 즉시 격상 / stable 2.1.169 drift +10 CRITICAL band (직전 +16에서 개선)

## 3. 헤드라인 — v2.1.176 hook `if` 매칭 수정 (auto-benefit MEDIUM, 핵심 학습)

- **CC bullet**: "Fixed hook `if` conditions for Read/Edit/Write tool paths: documented patterns like `Edit(src/**)`, `Read(~/.ssh/**)`, `Read(.env)` now match correctly"
- **bkit 부착점 실측**: `hooks/hooks.json:30` `"if": "Write(skills/**/SKILL.md)"` / `hooks/hooks.json:275` `"if": "Write|Edit(docs/**/*.md)"` — bkit는 if-gated 훅 **실제 2건 사용**
- **판정**: bkit 패턴은 이미 수정된 documented syntax 사용 + 두 핸들러가 경로 **자체 가드(self-guard)** → pre-2.1.176 매칭 갭에서도 오발화/누락 무해. 2.1.176은 silent-gap 신뢰성 위험 제거의 순수 이득, breakage·조치·테스트 불필요
- **신규 패턴**: 직전 cycle들은 bkit이 settings/CLAUDE.md/managed-MCP에 부착점 0(Neutral)이었으나, 본 cycle은 **bkit이 CC 수정 대상 기능(hook `if:`)을 실제 사용 중이면서도 self-guard로 회귀 면역**인 첫 auto-benefit 케이스

## 4. Phase 1.5 게이트 — model-WebFetch under/over-count 회피 (gh-API 디코딩)

- 1차 model-processed WebFetch: 179=11 178=16 176=13 174=11 172=27 (대부분 과소, v179만 과다)
- ground truth: `gh api repos/anthropics/claude-code/contents/CHANGELOG.md --jq .content | base64 -d` → 179=9 178=23 176=22 174=13 172=30 → **Total 102 확정**
- **게이트 정답**: model 응답이 아니라 **gh-API base64 디코딩 raw 파일 행 단위 직접 열거**
- **CHANGELOG floor 발견 (researcher)**: rolling CHANGELOG.md@main 하한 = **v2.1.132**. v69~v131은 prune(존재했으나 제거, R-2 skip과 구별). 본 범위 v170~v179는 floor 위 retained → R-2 판정 신뢰 가능
- spot-check 3건 verbatim: v176(hook if) / v172(sub-agent 5단계) / v178(Tool(param:value))

## 5. bkit-relevant 플래그 실측

| Bullet | 검증 | 결과 |
|--------|------|------|
| v176 hook `if` 매칭 fix | hooks.json 2개 if 블록 + self-guard | **auto-benefit MEDIUM** (헤드라인) |
| v172 sub-agents 5단계 중첩 | sub-agent-dispatcher.js / team-protocol.js | sequential dispatch 자체 오케스트레이션, CC 중첩과 직교, #56293 무영향 → Neutral |
| v172 availableModels subagent override fix | settings.json 미배포 | Neutral governance |
| v178 Tool(param:value) 권한 문법 | hook 기반 방어, settings 룰 아님 | Neutral (향후 옵션이나 YAGNI) |
| v178 nested .claude/skills + precedence | bkit=plugin-provided skills/output-styles | Neutral (사용자 override 가능성 note) |
| v178 subagent transcript/backgrounding fix | bkit Task spawn 다용 | DX auto-benefit LOW |
| v178 MCP spec subagent disallowedTools fix | bkit agents disallowedTools mcp__* 미사용 | Neutral |
| v178 auto-mode subagent classifier 사전평가 | auto-mode | security governance auto-benefit LOW |
| v172 model attr OTEL lines_of_code.count | MON-CC-NEW-BG-OTEL-DROP | additive 속성, shutdown-flush와 별개 → 미해결 |
| v175/v176 managed setting | settings.json 미배포 | Neutral (no-settings-json-defense 일관) |
| v179 plugin 로딩 성능 remote | bkit=plugin | auto-benefit LOW |

- **Hook 스키마 변경 0건** (additionalContext=v163, terminalSequence=v141, background_tasks=v145 전부 baseline 이하). PreToolUse/PostToolUse/Stop/SubagentStop 입출력 스키마 본 범위 변경 0 → contract test 갱신 불필요

## 6. 차별화 6/6 streak 갱신

| Issue | ENH | v169 | v179 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 P0 | 21 | **22** | v172 5단계 중첩=depth 기능, parallel-spawn cache invalidation 미해결(오히려 cache-cost 표면 확대) |
| #57317 PostToolUse drop | ENH-303 P1 | 15 | **16** | v178 MCP disallowedTools fix는 인접 표면(hook drop 아님), skill_post reachability 미해결 |
| #58904 heredoc bypass | ENH-310 P1 | 11 | **12** | 102 bullets 중 heredoc 0건, v178 Tool(param:value)은 heredoc-body 맹점 무관 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

## 7. R-Series + Drift

| 패턴 | 본 delta | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | 전 present 버전 full CHANGELOG entry |
| R-2 true semver skip | **+2** | v171, v177 (floor 위 retained 부재). 누적 7건 |
| R-3 hotfix chain | +0 | v179 mid-stream fix 단발 |

- release_drift_score: stable=2.1.169 / latest=2.1.179 → **drift +10 (CRITICAL ≥8, 직전 +16에서 개선)**. stable 2.1.153→2.1.169로 16릴리스 따라잡음

## 8. Monitor 상태 (4건 전부 유지)

- **MON-CC-NEW-BG-OTEL-DROP (#64436)**: v172 OTEL `model` attr는 additive, shutdown-flush metric-drop과 별개. STAYS ACTIVE, expectedFix: null
- **MON-CC-NEW-PLUGIN-HOOK-DROP (#57317 skill_post)**: v178 plugin/subagent fix는 disallowedTools·transcript 표면뿐 hook reachability 미터치. STAYS ACTIVE
- **MON-CC-NEW-CHOICE-LOOP**: 본 범위 관련 bullet 0건. STAYS ACTIVE
- **MON-CC-NEW-STOP-SCHEMA-STRICT (ENH-366 P0)**: 본 범위 Stop hook 출력 스키마 변경 0건. STAYS RESOLVED

## 9. 유지보수 발견 (MF-1) — 3-cycle carry-forward

- **위치**: `lib/infra/cc-version-checker.js:40` `const RECOMMENDED_VERSION = '2.1.118';` (3-cycle 변동 없음)
- **문제**: 현 latest 2.1.179 대비 ~61릴리스 stale
- **조치**: flag 유지(미수정) — 분석 전용 + No Guessing(팀이 지원 floor 결정)
- **권고**: 다음 일반 PDCA에서 우선 처리

## 10. 메모리 정정

- 없음 — bkit baseline 재측정 일치 (v2.1.22 / agents 40 / skills 44 / lib 190 modules 22 subdirs)
- SessionStart preflight "34 agents/174 lib" stale 표기 — 채택하지 않음 (실측 40/190)
- **다음 baseline**: v2.1.179 (다음 분석 v2.1.180부터)
