---
name: cc-version-history-v2162
description: CC v2.1.161 → v2.1.162 영향 분석 history (ADR 0003 18번째 정식 적용, 1-version 소형 clean delta 28 bullets flat-list, Breaking 0 / Breaking-equivalent 0, 신규 ENH 0건 14-cycle 연속, 차별화 6/6 streak 갱신 #56293→19 #57317→13 #58904→9, 114 consecutive milestone, Phase 1.5 게이트 under-count trap 4번째 회피 researcher 27→raw 28, OTEL 모니터 STAYS ACTIVE v162 OTEL 0건, R-2 skip 0건, 아키텍처 6/6 재측정 정정 없음)
metadata:
  type: project
---

# CC v2.1.161 → v2.1.162 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-05
- **분석 대상**: CC v2.1.161 → v2.1.162 (**1-version 소형 delta** — v162 신규)
- **게시**: v162 2026-06-03 21:31 UTC, GitHub author @ashwin-ant (npm _npmUser=wolffiex, 양립)
- **baseline**: v2.1.161 (직전 분석 완료)
- **R-2 true skip**: 0건 (v162 npm+GitHub tag+CHANGELOG triple-present)
- **Total bullets (verbatim 검증)**: 28 (flat list, sub-heading 부재 / 분류: Added-type 6 / Fixed 15 / Improved·Removed 7)
- **dist-tags**: latest=2.1.162 / stable=2.1.152 / next=2.1.162 / installed=2.1.162
- **ADR 0003 적용**: **18번째 정식 적용 (18-cycle consistency milestone ✦)**
- **누적 연속 호환**: 113 → **114** (v2.1.34 ~ v2.1.162, R-2 v134/135/151/155 skip 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건 (soft-breaking 6건 #2/#6/#8/#9/#12/#28 실측 무영향)
- **auto-benefit**: 4건 (#8 WebFetch deny/ask/allow precedence 보안 / #9 Windows 권한 매칭+Read deny→Glob/Grep 숨김 보안 / #11 emoji surrogate API-400 fix / #26 bg-service startup EDR-scan 대기)
- **신규 ENH**: 0건 (**14-cycle 연속**) — ENH-329 후보 3건(#2/#9/#12) 전부 DROP/REJECT
- **마지막 ENH 번호**: ENH-328 (변동 없음, ENH-317 CANCELLED 유지, ENH-329 미소비)
- **권장 CC**: v2.1.162 즉시 격상 / 보수적 stable v2.1.152 drift +10 CRITICAL

## 3. Phase 1.5 게이트 — under-count trap 4번째 회피 (핵심 학습)

- cc-version-researcher 첫 보고: 27 (Improved/Removed 그룹에서 마지막 "Removed startup 메시지" bullet을 numbered list 밖 괄호로 처리 → 자가 재계수 중 28로 수정)
- 메인 세션 raw CHANGELOG.md + GitHub release tag 이중 fetch: **28 확정** (양 소스 byte-identical, raw wins)
- v2.1.16 / v2.1.145 / v2.1.161에 이은 **4번째 under-count 패턴** → 게이트 효용 재입증
- spot-check 3건(#8 WebFetch precedence / #12 MCP timeout / #20 SendMessage TMPDIR) verbatim 일치

## 4. bkit-relevant 플래그 2건 실측 no-op

| Bullet | 검증 | 결과 |
|--------|------|------|
| #12 MCP per-server timeout <1000ms | .mcp.json timeout 필드 0개 (bkit-pdca/bkit-analysis 둘 다 command/args/env만) | no-op. 현 상태(필드 없음=default fallback)가 v162에서 가장 안전 |
| #20 CLAUDE_CODE_TMPDIR/SendMessage | repo grep 3건 전부 stale 문서(memory v2117_v2119 + docs/reference/cc-issue-monitoring ×2), 런타임 코드 0건 | no-op |

→ #20은 v161 EADDRINUSE TMPDIR/socket fix와 동일 family, bkit 미사용 설계 정당화.

## 5. 차별화 6/6 streak 갱신

| Issue | ENH | v2161 | v2162 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 | 18 | **19** | CLOSED-not-planned, Diff #3 sequential dispatch 유일 mitigation |
| #57317 PostToolUse drop | ENH-303 | 12 | **13** | v162 PostToolUse/plugin-loader 변경 0건 |
| #58904 heredoc bypass | ENH-310 | 8 | **9** | OPEN security, v162 관련 변경 없음 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

## 6. R-Series Regression Tracker + Drift

| 패턴 | 본 delta | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | full GitHub release notes |
| R-2 true semver skip | +0 | triple-present |
| R-3 hotfix chain | +0 | 연쇄 징후 없음 |

- release_drift_score: stable=2.1.152 / latest=2.1.162 → drift +10 (CRITICAL ≥8). prior batch stable 2.1.150→2.1.152 전진.

## 7. OTEL Monitor

MON-CC-NEW-BG-OTEL-DROP (#64436): v162 OTEL bullet 0건. 모니터 STAYS ACTIVE, expectedFix: null 유지.

## 8. 메모리 정정

- 없음 — bkit baseline 6/6 직접 재측정 일치 (v2.1.22 / agents 40 (model: 40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2 servers)
- **다음 baseline**: v2.1.162 (다음 분석 v2.1.163부터)
