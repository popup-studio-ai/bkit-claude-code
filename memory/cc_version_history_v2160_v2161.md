---
name: cc-version-history-v2160-v2161
description: CC v2.1.159 → v2.1.161 영향 분석 history (ADR 0003 17번째 정식 적용, 2-version 소형 clean batch 49 bullets, Breaking 0 / Breaking-equivalent 0, 신규 ENH 0건 13-cycle 연속, 차별화 6/6 streak 갱신 #56293→18 #57317→12 #58904→8, 113 consecutive milestone, OTEL 모니터 #64436 errata-trap 회피 init-race≠shutdown-drop, R-2 skip 0건, soft-breaking 2건 실측 무효화)
metadata:
  type: project
---

# CC v2.1.159 → v2.1.161 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-03
- **분석 대상**: CC v2.1.159 → v2.1.161 (**2-version 소형 batch** — v160/v161 신규)
- **게시 버전**: 2개 (v160 2026-06-02 02:10 UTC / v161 2026-06-02 21:58 UTC, 둘 다 @ashwin-ant)
- **baseline**: v2.1.159 (internal infra only, user-facing 변경 0)
- **R-2 true skip**: 0건 (v160/v161 npm+GitHub tag+CHANGELOG triple-present)
- **Total bullets (verbatim 검증)**: 49 (v159:0 internal / v160:27 / v161:22)
- **dist-tags**: latest=2.1.161 / stable=2.1.150 / next=2.1.161 / installed=2.1.161
- **ADR 0003 적용**: **17번째 정식 적용 (17-cycle consistency milestone ✦)**
- **누적 연속 호환**: 112 → **113** (v2.1.34 ~ v2.1.161, R-2 v134/135/151/155 skip 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking**: 0건 / **Breaking-equivalent**: 0건 (soft-breaking 2건 실측 무영향)
- **auto-benefit**: 5건 (v161 mcp redaction / parallel-batch 격리 / bg subagent stdout fix / Windows hook bash fix / bg stale-model fix)
- **신규 ENH**: 0건 (**13-cycle 연속**) — ENH-329 후보 4건 전부 DROP/REJECT
- **마지막 ENH 번호**: ENH-328 (변동 없음, ENH-317 CANCELLED 유지)
- **권장 CC**: v2.1.161 즉시 격상 / 보수적 stable v2.1.150 drift +11 CRITICAL

## 3. soft-breaking 2건 실측 무효화

| 버전 | 변경 | bkit 참조 실측 | 판정 |
|------|------|:---:|------|
| v160 | `CLAUDE_CODE_OPUS_4_6_FAST_MODE_OVERRIDE` no-op | **0건** | 무영향 (정리 불필요) |
| v160 | dynamic-workflow 트리거 `workflow`→`ultracode` | **0건** (서술적 사용만) | 무영향 |

→ bkit이 CC env/trigger에 hard-coupling하지 않은 설계 정당화.

## 4. OTEL 모니터 errata-trap 회피 (핵심 학습)

| | bkit MON-CC-NEW-BG-OTEL-DROP (#64436) | v161 OTEL fix |
|--|--|--|
| 정의 | background session OTEL log **shutdown** drop (registry.js:160-169) | OTEL log **init 완료 전** emit 시 drop |
| lifecycle | shutdown-flush 실패 | init-time startup race |
| bkit flush 경로 | telemetry.js shutdown/flush/beforeExit handler **0개** | — |

→ **반대 lifecycle**. 모니터 STAYS ACTIVE (`expectedFix: null`). "동일 키워드 fix"가 모니터를 자동 해소하는 것처럼 보여도 phase 다르면 미해소 — **No Guessing 실증**, 다음 cycle fix↔monitor 매칭 시 phase 단위 대조 필수.

## 5. 차별화 6/6 streak 갱신

| Issue | ENH | v2159 base | v2161 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 | 17 | **18** | **CLOSED-not-planned** → Diff #3 유일 mitigation 격상 ★ |
| #57317 PostToolUse drop | ENH-303 | 11 | **12** | v161 parallel 격리 인접하나 plugin-loader drop root cause 미해결 |
| #58904 heredoc bypass | ENH-310 | 7 | **8** | OPEN security, v160 config-write prompt이 pipe-target gap 미커버 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js:101,160 / heredoc-detector.js

## 6. Phase 1.5 게이트 — v161 under-count 차단

- cc-version-researcher 첫 model-fetch: v161 = 21 (trailing `[VSCode]` bullet 누락)
- 메인 세션 raw CHANGELOG + GitHub release tag 이중 fetch: **22 확정** (raw wins)
- v2.1.16 / v2.1.145 under-count 패턴 3번째 재현 → 게이트 효용 재입증

## 7. R-Series Regression Tracker

| 패턴 | 본 batch 증감 | 비고 |
|------|------------|------|
| R-1 silent npm publish | +0 | v160/v161 full GitHub release notes |
| R-2 true semver skip | +0 | triple-present |
| R-3 hotfix chain | +1 | v161 forceLoginOrgUUID = v146 regression 15-version 지연 복구 (same-day chain 아님) |

## 8. 메모리 정정

- 없음 — bkit baseline 실측 일치 (v2.1.22 / agents 40 (`model:` 40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2 servers)
- 차별화 surface 3/3 code-active 확인
- **다음 baseline**: v2.1.161 (다음 분석 v2.1.162부터)
