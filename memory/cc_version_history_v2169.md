---
name: cc-version-history-v2169
description: CC v2.1.168 → v2.1.169 영향 분석 history (ADR 0003 20번째 정식 적용 ✦, 1-version 실질 delta 30 bullets placeholder 아님, Breaking 0 / Breaking-equivalent 0, auto-benefit 6건, 신규 ENH(implement) 0건 16-cycle 연속, 차별화 6/6 streak 갱신 #56293→21 #57317→15 #58904→11, 120 consecutive milestone ✦, Phase 1.5 게이트 tail-total 산술오류 회피 researcher 30 / WebFetch 자가총계 38·31 오산 / 메인 수동열거 30 확정, OTEL 모니터 #64436 + skill_post plugin-hook-drop 모니터 둘 다 STAYS ACTIVE, 아키텍처 6/6 재측정 정정 없음, MF-1 RECOMMENDED_VERSION 2.1.118 stale 2-cycle carry-forward)
metadata:
  type: project
---

# CC v2.1.168 → v2.1.169 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-09
- **분석 대상**: CC v2.1.168 → v2.1.169 (**1-version delta**, v169 신규 실질 30-bullet 엔트리 — placeholder 아님)
- **게시**: 2026-06-08 21:57 UTC, GitHub author @ashwin-ant / npm publisher wolffiex (양립)
- **baseline**: v2.1.168 (직전 분석 완료)
- **R-2 true skip**: 0건 (v168→v169 연속, triple-present). 누적 skip 변동 없음: v134/135/151/155/164
- **Total bullets (raw 검증)**: 30 (Added 3 / Fixed 14 / Improved·Other 13, flat list)
- **dist-tags**: latest=2.1.169 / stable=2.1.153 / next=2.1.169 / installed=2.1.169
- **ADR 0003 적용**: **20번째 정식 적용 ✦**
- **누적 연속 호환**: 119 → **120 ✦** (v2.1.34 ~ v2.1.169, R-2 v134/135/151/155/164 skip 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건
- **auto-benefit**: 6건 (#5 managed MCP allow/deny 강제 누락 fix / #14 pre-warmed worker project env(ANTHROPIC_MODEL) drop fix → Diff#3 dispatch 결정성 / #16 plugin .in_use PID lock GC → bkit=plugin 수혜 / #17 untrusted OTEL client-cert trust fix / #19 TaskCreate 자동복구 / #23 managed-settings invalid-entry 부분적용)
- **신규 ENH(implement)**: 0건 (**16-cycle 연속**) — #1 safe-mode 문서화 후보 P3 DEFER(번호 미소비)
- **마지막 ENH 번호**: ENH-328 (변동 없음, ENH-329 미소비 유지, ENH-317 CANCELLED 유지)
- **권장 CC**: v2.1.169 즉시 격상 / 보수적 stable v2.1.153 drift +16 CRITICAL (역대 최대)

## 3. Phase 1.5 게이트 — tail-total 산술오류 회피 (핵심 학습, 신규 패턴)

- cc-version-researcher 보고: 30 (정확)
- 메인 세션 raw CHANGELOG.md + GitHub release tag 이중 fetch: **verbatim 리스트 완전 동일(30개)**, 그러나 두 WebFetch가 자기 리스트 꼬리 "Total"을 각각 **38 / 31로 오산**
- 메인 세션 행 단위 직접 열거 → **30 확정**
- **신규 errata 패턴**: 직전 cycle들은 model이 bullet *누락/병합*하는 miscount(under/over-count)였으나, 본 cycle은 **리스트는 정확·합산만 틀린 산술오류**. → 게이트 정답은 "model이 보고한 Total"이 아니라 **"열거된 verbatim 리스트 직접 카운트"**. 두 소스 verbatim 동일성이 신뢰 근거
- spot-check 3건 verbatim 일치: #5(managed MCP) / #14(bg env) / #17(OTEL client-cert)

## 4. bkit-relevant 플래그 실측 (priority deep-dive)

| Bullet | 검증 | 결과 |
|--------|------|------|
| #1 `--safe-mode`/CLAUDE_CODE_SAFE_MODE | repo grep 0건 + 의미분석 | bkit 로드 前 CC레벨 전체 차단(CLAUDE.md+plugins+skills+hooks+MCP). bkit 저항 불가·불필요(의도된 동작). 부착점 0. P3 doc 후보만 |
| #3 disableBundledSkills/CLAUDE_CODE_DISABLE_BUNDLED_SKILLS | skills/bkit/SKILL.md 분류 | "bundled"=CC 내장 한정. bkit 44 skills=plugin-provided → 무관 |
| #12 `claude agents --json` id/state/--all | grep "agents --json" lib/scripts/hooks | bkit parser 0건 → Neutral |
| #14 bg env(ANTHROPIC_MODEL) drop fix | sub-agent-dispatcher.js | Diff#3 sequential dispatch 결정성↑ → auto-benefit MEDIUM |
| #16 plugin .in_use PID lock GC | bkit=plugin runtime | stale marker 일일 sweep → 자원누수 방지 auto-benefit LOW |
| #19 TaskCreate 자동복구 | scripts/task-created-handler.js | 방어적 read+exit-0 fallback 이미 존재 → 위험 없음 auto-benefit MEDIUM |
| #26 CLAUDE.md threshold context-scaling | memory-enforcer.js + 하드코딩 grep | bkit CLAUDE.md 크기 gate 미하드코딩(memory-enforcer 240/200=directive 추출, context-sizer 100K=토큰예산) → Neutral |
| #5/#23 managed MCP/부분적용 | .mcp.json + settings 배포 | bkit settings.json 미배포 → governance auto-benefit |
| #17 untrusted OTEL client-cert | grep CLIENT_CERTIFICATE lib/ 0건 + otel-env-capturer.js | 신뢰된 USER shell env 캡처(project settings 아님) → 노출 없음 Neutral |

## 5. 차별화 6/6 streak 갱신

| Issue | ENH | v2168 | v2169 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 P0 | 20 | **21** | v169 #2 `/cd`는 cache 보존 신기능, invalidation 미해결 |
| #57317 PostToolUse drop | ENH-303 P1 | 14 | **15** | PostToolUse 변경 0건 + skill_post plugin-hook-drop reachability 미해결 |
| #58904 heredoc bypass | ENH-310 P1 | 10 | **11** | bash-parsing 변경 0건, Diff#6 독립 면역 유지 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

## 6. R-Series + Drift

| 패턴 | 본 delta | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | full CHANGELOG + release |
| R-2 true semver skip | +0 | 연속, triple-present |
| R-3 hotfix chain | +0 | #7은 2.1.161 회귀 단발 fix |

- release_drift_score: stable=2.1.153 / latest=2.1.169 → drift +16 (CRITICAL ≥8, 역대 최대). stable 정체(2.1.153).

## 7. Monitor 상태 (2건 모두 STAYS ACTIVE)

- **MON-CC-NEW-BG-OTEL-DROP (#64436)**: v169 유일 OTEL bullet #17은 client-cert **trust** fix로 shutdown-flush metric-drop과 별개. STAYS ACTIVE, expectedFix: null.
- **MON-CC-NEW-PLUGIN-HOOK-DROP (#57317, skill_post)**: 본 세션 preflight `missing=[skill_post]` 재발. v169 plugin bullet #15(MCPB cache)/#16(PID lock GC)은 hook reachability 미터치. STAYS ACTIVE.

## 8. 유지보수 발견 (MF-1) — 2-cycle carry-forward

- **위치**: `lib/infra/cc-version-checker.js:40` `const RECOMMENDED_VERSION = '2.1.118';` (직전 cycle 이후 변동 없음, Read 재확인)
- **문제**: 현 latest 2.1.169 대비 ~51릴리스 stale (MEMORY 권장선 보수 2.1.123 / 균형 2.1.140과도 불일치)
- **조치**: flag 유지(미수정) — 분석 전용 + No Guessing(팀이 지원 floor 결정)
- **권고**: 다음 일반 PDCA에서 우선 처리. 분기 로직(:198~203) 정상

## 9. 메모리 정정

- 없음 — bkit baseline 6/6 직접 재측정 일치 (v2.1.22 / agents 40 (40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2)
- "no settings.json — hook-based defense" 판정 근거 재확인: #5/#17/#23 managed/OTEL governance 변경 = bkit 부착점 0 자동 Neutral
- SessionStart preflight "34 agents/174 lib" stale 표기 — 채택하지 않음 (실측 40/190)
- **다음 baseline**: v2.1.169 (다음 분석 v2.1.170부터)
