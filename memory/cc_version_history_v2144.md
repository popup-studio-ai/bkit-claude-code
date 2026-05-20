---
name: cc-version-history-v2144
description: CC v2.1.143 → v2.1.144 영향 분석 history (ADR 0003 13번째 정식 적용, single+bumper-twin scenario 신규, 52 bullets bumper, HIGH 3건 모두 bkit-friendly, 신규 ENH 0건, 차별화 6/6 코드 활성 구현 완료 확정)
metadata:
  type: project
---

# CC v2.1.144 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-05-19
- **분석 대상**: CC v2.1.143 → v2.1.144 (single-version increment **6번째 발생** + bumper 2번째 = **single+bumper-twin scenario 신규 첫 사례**)
- **출시일**: 2026-05-19 00:48 UTC
- **간격**: v2.1.143 (2026-05-15 22:28) → v2.1.144 약 3일 5시간
- **Total bullets**: 52 (Added/Improvements 8 + Renamed 1 + Behavior 2 + Fixed 41)
- **4-Source verification**: PASS (github tags + releases + CHANGELOG.md + npm 4/4 일치)
- **ADR 0003 적용**: **열세 번째 정식 적용 (13-사이클 일관성 입증)**
- **누적 연속 호환**: 98 → **99** (v2.1.34 ~ v2.1.144, R-2 v2.1.134/135 skip 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건
- **Breaking**: 2건 — B1-144 HIGH `/model` session-only (bkit `/model` auto-call 0건 무영향) / B2-144 LOW 리네이밍 alias 유지
- **HIGH bkit-friendly**: 3건 — X1-144 (75s hang fix) / X4-144 (MCP paginated tools/list, bkit cursor 미구현 자동 회피 부수 차별화) / X6-144 (FD exhaustion in skills/ build, bkit 빌드 surface 0건 자동 safe)
- **HIGH 위협**: 0건 (**10-cycle streak 유지**)
- **자동수혜 MEDIUM**: 9건 — F4 (WorktreeCreate + non-git VCS, ENH-286 후속) / F9 (MCP startup -2s, bkit 19 tools 직접 수혜) / X2 (skill headless v2.1.141 regression fix) / X3 / X5 / X7 / X8 / X12 / X25 (skill truncation startup 제거, ENH-291 surface)
- **자동수혜 LOW**: 25+건
- **신규 ENH**: 0건 (**8-cycle 연속**)
- **Monitor only P3**: 3건 (X4 / X6 / X25)
- **신규 모니터 (인접)**: 3건 — MON-CC-NEW-RESUME-PHANTOM (#60390) / MON-CC-NEW-PLUGIN-URL-DROP (#60380) / MON-CC-NEW-DSP-BYPASS (#60374, P2 ENH-286 강화)
- **차별화 6/6 상태**: **코드 활성 구현 완료 확정 cycle** (모두 결정적 강화)

## 3. ADR 0003 사후 검증 (12/12 PASS)

| # | invariant | 결과 |
|---|---|---|
| 1 | `claude --version` = 2.1.144 | PASS |
| 2 | `claude plugin validate .` Exit 0 | PASS (**F9-120 closure 13-cycle**) |
| 3 | hooks events:21 blocks:24 | PASS |
| 4 | `updatedToolOutput` 코드 0건 | PASS (**5-cycle invariant**) |
| 5 | OTEL_* lib/infra/telemetry.js | PASS (**16 위치 활성**) |
| 6 | effort.level / CLAUDE_EFFORT | PASS (**16 위치 활성 운영**) |
| 7 | CLAUDE_CODE_PLUGIN_PREFER_HTTPS | PASS (0건) |
| 8 | WorktreeCreate hook | PASS (0건) |
| 9 | /model auto-call | PASS (0건) |
| 10 | command field 누락 hook | PASS (0건) |
| 11 | .mcp.json mcpServers 키 | PASS |
| 12 | MCP cursor/pagination 0건 | PASS (**X4-144 자동 회피**) |

## 4. 차별화 6/6 코드 활성 구현 완료 (Phase 2 grep 확정)

| # | 차별화 | 코드 활성 파일 | 본 cycle 영향 |
|---|---|---|---|
| 1 | ENH-286 Memory Enforcer | `lib/defense/memory-enforcer.js` | **결정적 강화** (R-3 cluster 5/18 +4, #60374 DSP bypass 신규) |
| 2 | ENH-289 Defense Layer 6 | `lib/defense/layer-6-audit.js` + `push-event-guard.js` | 강화 (누적 18, dup +1 #60346) |
| 3 | ENH-292 Sequential dispatch | `lib/orchestrator/sub-agent-dispatcher.js` + `cache-cost-analyzer.js` | **결정적 강화** (#56293 14-streak) |
| 4 | ENH-300 Effort-aware | `lib/domain/guards/invariant-10-effort-aware.js` (16 위치) | 활성 입증 (baseline 정정) |
| 5 | ENH-303 PostToolUse continueOnBlock | 19 파일 surface | **결정적 강화** (#57317 8-streak) |
| 6 | ENH-310 Heredoc defense | `lib/defense/heredoc-detector.js` + `scripts/unified-bash-pre.js:257-298` | **결정적 강화** (#58904 4-streak OPEN) |

**핵심**: 메모리의 "deferred 6건" 표현은 계획 단계 표현이었으며, Phase 2 grep으로 **6/6 모두 실제 코드 구현 운영 중** 확정. 본 cycle = "**차별화 코드 활성 구현 완료 cycle**".

## 5. GitHub Issues streak

| Issue | 누적 streak | 본 cycle | bkit ENH |
|-------|------------|---------|----------|
| #56293 sub-agent caching 10x | 13 → **14** | OPEN | ENH-292 P0 **결정적** |
| #57317 plugin PostToolUse silent drop | 7 → **8** | OPEN | ENH-303 P1 **결정적** |
| #58904 Heredoc bypass | 3 → **4** | OPEN | ENH-310 P1 **결정적** |
| #47855 /compact block | 31 → **32** | OPEN | MON-CC-02 |
| #56448 skill validator | 12 → **13** | OPEN | ENH-291 P2 |
| #47482 output styles | 34 → **35** | OPEN | ENH-214 defense |
| R-3 evolved | 14 → **18 (+4)** | 5/18 cluster | ENH-289 |
| R-3 dup-closure | 5 → **6 (+1)** | #60346 | ENH-289 |
| R-3 numbered #145 | +0 in 24d | 정체 | ENH-289 |
| #58909 permission_prompt | 메모리 정정 | **OPEN 재확인** | MON-CC-NEW-NOTIFICATION |
| #60374 DSP bypass project rules | 신규 | OPEN | **ENH-286 강화 surface** |

**누적 streak 합**: 100 → **107 (+7 milestone)**

## 6. R-Series Regression Tracker

| 패턴 | 본 cycle 증감 | 누적 |
|------|------------|------|
| R-1 silent npm publish | +0 | 6건 (v2.1.115/120/124/125/127/129) |
| R-2 true semver skip | +0 | 2 occurrences / 3 versions (v2.1.130 + v2.1.134/135) |
| R-3 numbered #145 | +0 in 24d | 정체 |
| R-3 dup-closure | +1 (#60346) | 6건 |
| R-3 evolved form | **+4** (cluster 5/18) | **18건 누적** |
| N-streak (#56293) | +1 | **14-streak (1-month+5d)** |

## 7. npm dist-tags (2026-05-19)

| 채널 | 버전 | 변동 |
|------|------|------|
| stable | **2.1.138** | **+5 promotion** (이전 133) |
| latest | 2.1.144 | +1 |
| next | 2.1.144 | +1 (latest=next **통합 3-cycle**) |

**drift 갱신**:
- bkit 권장 (보수적) v2.1.123 vs stable v2.1.138 = **+15 (악화 +5, critical zone ×2 격화)**
- bkit 권장 (보수적) v2.1.123 vs latest v2.1.144 = +21
- 임계 조치: **README/CHANGELOG advisory 1-line 즉시 강화 + 보수적 권장 v2.1.140+ 격상 검토**

## 8. 메모리 정정 (8건 필수)

| # | 항목 | 기존 | 정정 |
|---|---|---|---|
| 1 | bkit 버전 | v2.1.14 | **v2.1.15** (plugin.json/bkit.config.json 실측) |
| 2 | MCP tools 합계 | 16 | **19** (bkit-pdca 13 + bkit-analysis 6) |
| 3 | OTEL count (telemetry.js) | 4 | **16** |
| 4 | #58909 MON-CC-NEW-NOTIFICATION | silent CLOSED 2-cycle | **OPEN 재확인** |
| 5 | stable | 133 | **138 (+5 promotion)** |
| 6 | drift critical zone | +10 | **+15 (×2 격화)** |
| 7 | 누적 streak 합 | 100 | **107 (+7 milestone)** |
| 8 | 연속 호환 | 98 | **99** |

## 9. single+bumper-twin scenario 신규

- single-version increment 발생 5번째까지: v2.1.140 (13) / v2.1.141 (60) / v2.1.142 (25) / v2.1.143 (25) — 5번째까지 single-version 패턴 입증
- v2.1.144 (52) = **6번째 single-version + bumper 2번째 결합 = single+bumper-twin scenario 신규 첫 사례**
- bumper batch 첫 사례 v2.1.141 (60) 이후 약 4일 만에 두 번째 bumper (52) 등장
- **ADR 0003 13-사이클 robust 작동 입증**

## 10. 권장 CC 버전

| 분류 | 버전 | 변동 |
|------|------|------|
| **균형** | **v2.1.144 즉시 격상 권고** | 이전 v2.1.142 → v2.1.144 (HIGH 3건 모두 bkit-friendly + 차별화 6/6 결정적 강화) |
| **보수적** | **v2.1.123 유지 위험 격화** | drift +15 critical zone ×2 격화, **v2.1.140+ 격상 검토 필요** |

## 11. 차후 cycle 트리거

- v2.1.145 출시 시
- npm stable v2.1.140+ 진입 시
- #56293/57317/58904 streak 해소 또는 fix bullet 등장 시
- R-3 evolved form 폭증 (cluster 추가) 시
- bkit MCP tools 19 → 50+ 증가 시 (MON-X4 격상 trigger)

## 12. 분석 보고서

**위치**: `docs/04-report/features/cc-v2143-v2144-impact-analysis.report.md`

## 13. Related memories

- [[cc-version-history-v2143]] — 직전 cycle (single-version 5번째, mid-batch-twin, ADR 0003 12번째)
- [[cc-version-history-v2142]] — single-version 4번째 (mid-batch)
- [[cc-version-history-v2141]] — single-version 3번째 (60 bullets bumper 1번째)
- [[cc-version-history-v2140]] — single-version 2번째 (13 bullets)
- [[memory-correction-bkit-version]] — bkit v2.1.14 → v2.1.15 정정 (본 cycle 발견)
