---
name: cc-version-history-v2163-v2168
description: CC v2.1.162 → v2.1.168 영향 분석 history (ADR 0003 19번째 정식 적용, 6-version multi-delta 46 bullets, v164 true skip R-2, Breaking 0 / Breaking-equivalent 0, 신규 ENH(implement) 0건 15-cycle 연속, 차별화 6/6 streak 갱신 #56293→20 #57317→14 #58904→10(✦10 milestone), 119 consecutive milestone, Phase 1.5 게이트 첫 over-count trap 회피 researcher 47→raw 46 v166 22→21, OTEL 모니터 STAYS ACTIVE v163~168 OTEL 0건, 아키텍처 6/6 재측정 정정 없음, 유지보수 발견 MF-1 cc-version-checker RECOMMENDED_VERSION 2.1.118 ~50릴리스 stale flag-only)
metadata:
  type: project
---

# CC v2.1.162 → v2.1.168 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-08
- **분석 대상**: CC v2.1.162 → v2.1.168 (**6-version multi-delta** — v163/165/166/167/168 신규, v164 결번)
- **게시**: 전부 npm 게시자 wolffiex, installed=2.1.168
- **baseline**: v2.1.162 (직전 분석 완료)
- **R-2 true skip**: **1건 (v164)** — npm 404 + GitHub release 404 + CHANGELOG 헤더 부재 3-source 확정. 누적 skip: v134/135/151/155/164
- **Total bullets (raw 검증)**: 46 (v163=22 / v166=21 / v165·167·168 placeholder 1 each = 3)
- **dist-tags**: latest=2.1.168 / stable=2.1.153 / next=2.1.168 / installed=2.1.168
- **ADR 0003 적용**: **19번째 정식 적용**
- **누적 연속 호환**: 114 → **119** (v2.1.34 ~ v2.1.168, R-2 v134/135/151/155/164 skip 미포함, +5 게시)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건
- **auto-benefit**: 3건 (v163 #4 Stop/SubagentStop additionalContext가 hook-error 아닌 턴 지속 — bkit 이미 사용 / v163 #16 hook `if:` subshell·backtick 매칭 / v163 #9 `$TMPDIR` 전역 override 회귀(2.1.154) 복구)
- **신규 ENH(implement)**: 0건 (**15-cycle 연속**) — fallbackModel 가이드 / version-pin 문서 후보 둘 다 Deferred(doc-only, 번호 미소비)
- **마지막 ENH 번호**: ENH-328 (변동 없음, ENH-329 미소비 유지, ENH-317 CANCELLED 유지)
- **권장 CC**: v2.1.168 즉시 격상 / 보수적 stable v2.1.153 drift +15 CRITICAL

## 3. Phase 1.5 게이트 — 첫 over-count trap 회피 (핵심 학습)

- cc-version-researcher 보고: v166=22 (자가 caveat: "model-parsed boundary, not byte-exact")
- 메인 세션 raw CHANGELOG.md + GitHub release tag 이중 fetch: **v166=21 (양 소스 byte-identical)** → raw 채택
- 직전 4개 cycle(v2.1.16/145/161/162)은 전부 **under-count** 패턴 → 본 cycle은 **첫 over-count 패턴**. 게이트가 양방향 오차 모두 포착 입증
- Total: researcher 47 → raw **46** (errata −1)
- spot-check 3건 verbatim 일치: v166 #2(deny glob `"*"`) / v166 #3(SendMessage authority) / v163 #17(`Read(~/Desktop/**)` `$HOME`)

## 4. bkit-relevant 플래그 실측 (전부 Neutral/auto-benefit, 0 부착)

| Bullet | 검증 | 결과 |
|--------|------|------|
| v163 #4 Stop/SubagentStop additionalContext | `subagent-stop-handler.js:124-131` grep | 이미 구현(nextActionHint) → auto-benefit (Diff#1/#5 native 강화). 메인 세션 직접 재확인 |
| v163 #16 hook `if:` subshell 매칭 | heredoc-detector 의미 분석 | predicate 매칭 변경뿐, heredoc-body 사각지대 그대로 → Diff#6 약화 없음, 수정 불필요 |
| v163 #17 / v166 #2 deny `$HOME` / glob | settings.json 배포 grep | **bkit settings.json 미배포** → Neutral |
| v166 #3 SendMessage authority | dispatcher 검토 | **Task spawn 사용(≠SendMessage)** → Diff#3 무관 |
| v163 #5 Skills `\$` escape | command body grep | 유일 매치는 prose(`$3/Mtok`) → 무관 |
| v163 #6 / v166 #16 MCP env/`${VAR}` | .mcp.json | predicate/timeout 필드 0개 → no-op |
| v166 #1 fallbackModel | agents frontmatter | per-agent `model:` 고정, 세션 설정 무관 → Neutral |
| v163 #1 managed version-gate | bkit 배포 모델 | plugin은 managed settings 미소유 → 부착점 없음 |

## 5. 차별화 6/6 streak 갱신

| Issue | ENH | v2162 | v2168 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 P0 | 19 | **20** | v163~168 caching bullet 0건 |
| #57317 PostToolUse drop | ENH-303 P1 | 13 | **14** | v163 #4는 Stop/SubagentStop, PostToolUse drop 무관 |
| #58904 heredoc bypass | ENH-310 P1 | 9 | **10 ✦** | v163 #16과 별개(권한시스템 heredoc-body 사각지대 미해결) |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

**핵심 구분**: v163 #16 = CC가 사용자 hook `if:` 평가 시 subshell/backtick 매칭하는 fix. #58904(Diff#6) = CC **권한 시스템**이 heredoc body 위험명령 미검사하는 사각지대. 별개 layer → bkit heredoc-detector.js 유효.

## 6. R-Series + Drift

| 패턴 | 본 delta | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | placeholder note이나 CHANGELOG+release 존재 |
| R-2 true semver skip | **+1 (v164)** | 3-source 확정 |
| R-3 hotfix chain | +0 | 연쇄 징후 없음 |

- release_drift_score: stable=2.1.153 / latest=2.1.168 → drift +15 (CRITICAL ≥8, 역대 최대). prior batch stable 2.1.152→2.1.153 전진.

## 7. OTEL Monitor

MON-CC-NEW-BG-OTEL-DROP (#64436): v163~168 OTEL bullet 0건. STAYS ACTIVE, expectedFix: null 유지.

## 8. 유지보수 발견 (MF-1) — ENH와 별개

- **위치**: `lib/infra/cc-version-checker.js:40` `const RECOMMENDED_VERSION = '2.1.118';`
- **문제**: 현 latest/installed 2.1.168 대비 ~50릴리스 stale (MEMORY 권장선 보수 2.1.123 / 균형 2.1.140과도 불일치)
- **조치**: 본 cycle은 **flag만** (분석 전용 스킬 + No Guessing — 팀이 지원 floor 결정 필요)
- **권고**: 별도 작업으로 정책 갱신. 분기 로직(`:198~203`)은 정상

## 9. 메모리 정정

- 없음 — bkit baseline 6/6 직접 재측정 일치 (v2.1.22 / agents 40 (model 40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2)
- 신규 판정 근거: **"no settings.json — hook-based defense"** → 향후 CC의 deny/allow/managed-settings 변경은 bkit 부착점 0으로 자동 Neutral 판정
- SessionStart preflight "34 agents/174 lib"는 stale 표기 — 채택하지 않음 (실측 40/190)
- **다음 baseline**: v2.1.168 (다음 분석 v2.1.169부터)
