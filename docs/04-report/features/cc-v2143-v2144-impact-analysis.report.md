# CC v2.1.143 → v2.1.144 영향 분석 및 bkit 대응 보고서 (ADR 0003 열세 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 열세 번째 정식 적용, 신규 ENH 0건, monitor 후보 3건 P3, drift +15 critical zone ×2 격화, 차별화 6/6 결정적 강화 — 코드 활성 구현 완료 확정)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.15 (current GA, plugin.json/bkit.config.json 실측 — 메모리 v2.1.14 표기 정정)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-05-19
> **PDCA Cycle**: cc-version-analysis (v2.1.144, **single-version increment 여섯 번째 발생** — single+bumper-twin 신규 scenario 첫 사례, 52 bullets bumper batch)
> **CC Range**: v2.1.143 (baseline, 98 consecutive PASS, 2026-05-15 22:28 UTC) → **v2.1.144** (release 2026-05-19 00:48 UTC, **52 bullets bumper** — single-version increment 6번째 + bumper 2번째 결합)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 2건 (HIGH 1 + LOW 1 모두 bkit 무영향) / HIGH 3건 모두 bkit-friendly direction / 자동수혜 MEDIUM 9건 + LOW 25+건 / 신규 ENH 후보 0건 / Monitor only 후보 3건 P3 / 차별화 6/6 모두 결정적 강화 (코드 활성 구현 완료 확정 cycle) / R-3 evolved 14 → 18 (+4 cluster 5/18) / 14-streak ENH-292 P0 결정적 / 8-streak ENH-303 P1 결정적 / 4-streak ENH-310 P1 결정적 / drift +10 → +15 critical zone ×2 격화 / 누적 streak 합 100 → 107 (+7 milestone) / 99 연속 호환**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.15 무수정 작동, ADR 0003 25+신규 baseline PASS) |
| Breaking Changes | **2건** — **B1-144 HIGH** `/model` session-only (bkit `/model` auto-call 0건 → 무영향 확정) / **B2-144 LOW** `/extra-usage` → `/usage-credits` 리네이밍 (alias 유지) |
| **HIGH severity** | **3건 — 모두 bkit-friendly direction** (위협 HIGH 0건 10-cycle streak 유지) |
| │ HIGH bkit-friendly | **X1-144** Startup hang 75s → 15s timeout (모든 사용자 자동수혜) |
| │ HIGH bkit-friendly | **X4-144** MCP paginated `tools/list` first page only 회귀 fix (bkit MCP cursor 미구현으로 **자동 회피 — 부수적 차별화**) |
| │ HIGH bkit-friendly | **X6-144** FD exhaustion in skills/ build (bkit skills/ 내 dist/build 실행 surface 0건 → 무영향 자동 safe) |
| 자동수혜 (CONFIRMED) MEDIUM | **9건** — F4-144 (WorktreeCreate + non-git VCS, ENH-286 후속 강화) / F9-144 (MCP startup pre-wait overlap, bkit 2 servers 직접 수혜) / X2-144 (skill headless permission v2.1.141 회귀 fix) / X3-144 (macOS bg sessions crash) / X5-144 (MCP SVG MIME fallback) / X7-144 (session title plugin output) / X8-144 (plugins "not cached" + install hint) / X12-144 (head/tail/git diff exit 1) / X25-144 (skill-listing truncation startup notification 제거) |
| 자동수혜 (CONFIRMED) LOW | **25+건** — F1-3-5-6-7-8-10-11-12-13 + X10-11-13-14-16-17-18-19-20-21-22-23-24 등 background sessions / agent view / terminal UX 영역 |
| 정밀 검증 (무영향 확정) | **8건** — F4 / F5 / F7 / X9 / X12 / X15 / X16 / X20 (5 도메인 분류: SDK / Plugin / Bedrock-Vertex / Windows / IDE) |
| **신규 ENH 후보** | **0건** — 단 3건 P3 monitor only 등록: **MON-X4-MCP-PAGINATION** (cursor 미구현 자동 회피, 19→증가 시 검토) / **MON-X6-FD-EXHAUSTION** (skills/ 빌드 surface 0건, 진입 시 검토) / **MON-X25-TRUNC** (ENH-291 P2 가시성 변화만) |
| **신규 모니터** | **3건 P3 + 인접 1건 (#60374 DSP bypass)** — MON-CC-NEW-RESUME-PHANTOM (#60390 F1-144 즉시 회귀) / MON-CC-NEW-PLUGIN-URL-DROP (#60380) / MON-CC-NEW-DSP-BYPASS (#60374 ENH-286 강화 surface) |
| **기존 ENH 강화** | **6건 (모두 차별화 결정적 강화)** — **ENH-292 P0** (#56293 sub-agent caching **14-streak 결정적**, 5-cycle 연속 미해소) / **ENH-286 P1** (R-3 evolved +4 cluster 5/18 #60337/60339/60323/60352, #60374 DSP bypass project rules 신규, **결정적 강화**) / **ENH-289 P1** (R-3 누적 18 + dup-closure +1 #60346) / **ENH-300 P1** (#59421 CLOSED 2026-05-17 정황 v2.1.144 fix 후보, 16 위치 활성 운영 입증) / **ENH-303 P1** (#57317 plugin PostToolUse silent drop **8-streak 결정적**) / **ENH-310 P1** (#58904 v2.1.141~v2.1.144 OPEN **4-streak 결정적**) |
| **R-3 시리즈 monitor** | numbered violation #145 (issue #54178): **정체 +0 in 24d (3주+3d milestone)** / dup-closure 5 → **6건 (+1 #60346)** / **evolved-form 누적 14 → 18 (+4 cluster 5/18, ENH-286 + ENH-289 2-vector 동시 강화)** / 인접 #60374 DSP bypass project-level "ask" rules 신규 (ENH-286 차별화 #1 결정적 surface) / 추세 ~0.04/day (안정화) |
| **bkit 차별화 누적** | **6건 유지 (코드 활성 구현 완료 확정 cycle, 모두 강화, 신규 0건)** — ENH-286 (memory enforcer, **R-3 cluster 5/18 결정적 강화**) / ENH-289 (Defense Layer 6, R-3 누적 18) / ENH-292 (sequential dispatch, **14-streak 결정적**) / ENH-300 (effort-aware, 16 위치 활성 운영 입증) / ENH-303 (PostToolUse continueOnBlock, **#57317 8-streak 결정적**) / ENH-310 (heredoc defense, **#58904 4-streak 결정적**) |
| **메모리 정정** | **8건 필수 정정**: bkit 버전 v2.1.14 → **v2.1.15** / MCP tools 16 → **19** (bkit-pdca 13 + bkit-analysis 6) / OTEL telemetry.js 4 → **16 위치** / #58909 "silent CLOSED 2-cycle" → **OPEN 재확인** / npm stable v2.1.133 → **v2.1.138 (+5 promotion)** / drift +10 → **+15 critical zone ×2 격화** / 누적 streak 합 100 → **107 (+7 milestone)** / 연속 호환 98 → **99** |
| bkit v2.1.15 hotfix 필요성 | **불필요** (현재 main GA 안정, 98 → 99 연속 호환 확장 입증) |
| **연속 호환 릴리스** | **99** (v2.1.34 → v2.1.144, 98 → 99, +1 — v2.1.144 정상 추가, v2.1.134/135 R-2 skip 미포함) |
| ADR 0003 적용 | **YES (열세 번째 정식 적용 — 13-사이클 일관성 입증)** |
| **권장 CC 버전** | **균형 v2.1.142 → v2.1.144 즉시 격상 권고** (HIGH 3건 모두 bkit-friendly + 자동수혜 9+25건 + 차별화 6/6 결정적 강화 cycle) / **보수적 v2.1.123 유지 위험 격화** (drift **+15 critical zone ×2 격화** — **README/CHANGELOG advisory 1-line 즉시 강화 권고, 보수적 권장 v2.1.140+ 격상 검토 필요**) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.143 → v2.1.144 영향 분석 (ADR 0003 열세 번째)     │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 52 bullets (single-version 6번째)     │
│      Added/Improved 8 + Renamed 1 + Behavior 2          │
│      + Fixed 41 = 52 bullets bumper                     │
│      Pattern: mid(25) → mid(25) → bumper(52)            │
│              (v2.1.142 → v2.1.143 → v2.1.144)           │
│      ★ single+bumper-twin scenario 신규 첫 사례         │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit 환경)                │
│  🟢 HIGH bkit-friendly: 3건 (위협 HIGH 0건 10-cycle)     │
│      • X1-144 Startup 75s hang → 15s timeout            │
│        → 모든 사용자 자동수혜                            │
│      • X4-144 MCP paginated tools/list first page only │
│        → bkit cursor 미구현으로 자동 회피 (부수 차별화) │
│      • X6-144 FD exhaustion in skills/ build            │
│        → bkit skills/ 빌드 surface 0건 자동 safe        │
│  🟡 CONFIRMED auto-benefit MEDIUM: 9건                  │
│      • F4-144 WorktreeCreate + non-git VCS              │
│        → ENH-286 후속 강화 (v2.1.143 B15-143 연장)     │
│      • F9-144 MCP startup pre-wait overlap -2s          │
│        → bkit 2 stdio servers (19 tools) 직접 수혜      │
│      • X2-144 skill headless permission v2.1.141 fix    │
│        → bkit headless skill 호출 회복                  │
│      • X25-144 skill-listing truncation startup 제거    │
│        → ENH-291 P2 가시성 변화 (코드 영향 0)           │
│      외 X3/X5/X7/X8/X12 5건                             │
│  🟢 CONFIRMED auto-benefit LOW: 25+건                   │
│  🆕 신규 ENH 후보: 0건 (8-cycle 연속 0건)               │
│  🆕 Monitor only P3: 3건 (X4 / X6 / X25)                │
│  🆕 신규 모니터 (인접): 3건 (RESUME-PHANTOM /            │
│      PLUGIN-URL-DROP / DSP-BYPASS — 모두 P3)            │
│  🟢 ENH-292 #56293 14-streak 결정적 (P0 가속 유지)      │
│  🟢 ENH-303 #57317 8-streak 결정적 (1-month+)           │
│  🟢 ENH-310 #58904 4-streak 결정적 (#60374 인접 강화)   │
│  🟢 ENH-286 R-3 cluster 5/18 +4 결정적 강화              │
│  🟢 ENH-289 R-3 누적 18 + dup +1                         │
│  🟢 ENH-300 16 위치 활성 운영 입증 (baseline 정정)      │
│  ⚠️ drift (보수적) +10 → +15 critical zone ×2 격화        │
│       → README advisory 1-line 강화 + v2.1.140+ 검토   │
│  📈 R-3 evolved 14 → 18 (+4 cluster 5/18)               │
│       → ENH-286 + ENH-289 2-vector 동시 강화             │
│  📉 #58909 MON-CC-NEW-NOTIFICATION 메모리 정정           │
│       → silent CLOSED 2-cycle X, OPEN 재확인             │
│  ✅ 연속 호환 릴리스: 98 → 99 (v2.1.34 ~ v2.1.144)     │
│  ✅ F9-120 closure: 12 → 13 릴리스 연속 PASS (실측)     │
│  ✅ ADR 0003 매트릭스: 25 + neu baseline (Phase 2)      │
│  ✅ ADR 0003 열세 번째 정식 적용                          │
│  ✅ 차별화 6/6 코드 활성 구현 완료 확정                  │
│      (deferred 아님, product moat 결정적 입증 cycle)    │
└──────────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC CLI v2.1.144 single-version increment 6번째 발생 — 52 bullets bumper batch (single+bumper-twin 신규 scenario 첫 사례)에서 HIGH 3건 + Breaking 2건 발생, bkit 호환성 및 차별화 6/6 surface 강화 가능성 평가 필요 |
| **해결 방법** | ADR 0003 정식 적용 (열세 번째 cycle) — Phase 1 (cc-version-researcher) + Phase 2 (bkit-impact-analyst) + Phase 3 (Plan Plus YAGNI) + Phase 4 (보고서) 4-Phase 분석 |
| **결과 — HIGH 3건 모두 bkit-friendly** | X1-144 (75s hang fix) + X4-144 (MCP paginated tools/list, bkit cursor 미구현으로 **자동 회피 부수 차별화**) + X6-144 (FD exhaustion in skills/ build, bkit skills/ 빌드 surface 0건 자동 safe). 위협 HIGH 0건 **10-cycle streak 유지** |
| **결과 — 차별화 6/6 결정적 강화** | ENH-292 (14-streak 결정적) / ENH-303 (8-streak 결정적) / ENH-310 (4-streak 결정적) / ENH-286 (R-3 cluster 5/18 결정적) / ENH-289 (누적 18) / ENH-300 (16 위치 활성 운영 입증) — **신규 0건, 결정적 강화 4건 + 강화 1건 + 활성 입증 1건** |
| **결과 — 신규 ENH 0건 8-cycle 연속** | X4/X6/X25 3건 모두 P3 monitor only — 코드 변경 없는 안전한 ADR 0003 일관성 유지. **8-cycle 연속 신규 ENH 0건** = bkit 아키텍처 성숙도 결정적 입증 |
| **결과 — 메모리 정정 8건** | bkit v2.1.14 → **v2.1.15** / MCP tools 16 → **19** / OTEL 4 → **16** / #58909 OPEN 재확인 / stable 133 → **138 (+5)** / drift +10 → **+15** / 누적 streak 합 100 → **107** / 연속 호환 98 → **99** |
| **핵심 가치** | bkit v2.1.15 무수정 **99 연속 호환** + ADR 0003 13-cycle 일관성 + 차별화 6/6 결정적 강화 + **코드 활성 구현 완료 확정 cycle** = **product moat 결정적 입증** (deferred 6건이 모두 실제 코드로 구현 운영 중인 사실이 Phase 2 grep으로 확정) |
| **검증 데이터** | 사용자 환경 실증 (Darwin 24.6.0 / **`claude --version` = 2.1.144** / **`claude plugin validate .` Exit 0 13-cycle PASS** / `bkit.config.json` version = **2.1.15** / hooks events:21 blocks:24 / updatedToolOutput 코드 0건 5-cycle invariant) |

---

## 2. 관련 문서

| Phase | 문서 | 상태 |
|-------|------|------|
| Research (Phase 1) | CC v2.1.144 변경사항 조사 (cc-version-researcher 백그라운드 에이전트) | ✅ Done (in-memory) |
| Impact Analysis (Phase 2) | bkit 영향 분석 (bkit-impact-analyst 백그라운드 에이전트) | ✅ Done (in-memory) |
| Brainstorm (Phase 3) | Plan Plus YAGNI + Priority Assignment (main session) | ✅ Done |
| Report (Phase 4) | 본 문서 | ✅ Final |
| Memory | [cc_version_history_v2144.md](../../../memory/cc_version_history_v2144.md) | ✅ Created |
| MEMORY.md Index | bkit-version-history index update | ✅ Updated (8-건 정정 포함) |

---

## 3. ADR 0003 열세 번째 정식 적용 — Phase 1.5 게이트 결과 (12/12 PASS)

| # | invariant | 결과 | 검증 방법 | 비고 |
|---|---|---|---|---|
| 1 | `claude --version` = 2.1.144 | **PASS** | Bash 직접 실행 | 사용자 환경 v2.1.144 active |
| 2 | `claude plugin validate .` Exit 0 | **PASS** | Bash 직접 실행 | **F9-120 closure 13-cycle PASS** (v2.1.120/121/123/129/132/133/137/139/140/141/142/143/144) |
| 3 | hooks events:21 blocks:24 | **PASS** | Phase 2 node -e 카운트 | 변동 없음 |
| 4 | `updatedToolOutput` 코드 0건 | **PASS** | Phase 2 grep | **5-cycle invariant** (lib/scripts/agents/skills/hooks 모두 0) |
| 5 | OTEL_* lib/infra/telemetry.js | **PASS** | Phase 2 grep | **16 위치 활성** (이전 메모리 4 정정) |
| 6 | effort.level / CLAUDE_EFFORT | **PASS (활성)** | Phase 2 grep | **16 위치 활성 운영** (ENH-300 baseline 아닌 실 운영, 정정) |
| 7 | CLAUDE_CODE_PLUGIN_PREFER_HTTPS | **PASS (0건)** | Phase 2 grep | F5-144 surface 미사용 |
| 8 | WorktreeCreate hook | **PASS (0건)** | Phase 2 node -e | F4-144 자동 safe |
| 9 | /model auto-call | **PASS (0건)** | Phase 2 grep | B1-144 surface 미사용 |
| 10 | command field 누락 hook | **PASS (0건)** | Phase 2 node -e | F7-144 가드 진입 없음 |
| 11 | .mcp.json `mcpServers` 키 | **PASS** | Phase 2 cat | X9-144 mal-parsed 무영향 |
| 12 | MCP cursor/pagination 0건 | **PASS** | Phase 2 grep | **X4-144 자동 회피 — bkit 부수적 차별화** |

**판정**: 12/12 PASS, **ADR 0003 열세 번째 정식 적용 매트릭스 통과** (직전 v2.1.143 cycle의 25 항목 carry + 본 cycle 7 신규 baseline 추가, 누적 32+).

---

## 4. CC v2.1.144 변경사항 (Phase 1 Research 결과)

### 4.1 릴리스 메타데이터

| 항목 | 값 |
|------|----|
| 출시일 | 2026-05-19 00:48 UTC (GitHub Releases) |
| v2.1.143 → v2.1.144 간격 | 약 3 days 5 hours |
| Total bullets | **52** (verbatim, CHANGELOG + GitHub Releases 일치) |
| 세부 분포 | Added/Improvements 8 + Renamed 1 + Behavior change 2 + Fixed 41 |
| Bullet 분류 | **bumper batch** (50+ bullets, mid-batch 20~30 초과) — v2.1.141 60 bullets 이후 2번째 bumper |
| Pattern | single-version increment **6번째** + **single+bumper-twin scenario 신규 첫 사례** |
| 4-Source verification | **PASS (4/4 일치)** — github tags + releases + CHANGELOG.md + npm 모두 v2.1.144 존재, v2.1.145 미존재 |
| npm dist-tags | stable=**2.1.138 (+5 promotion)** / latest=2.1.144 / next=2.1.144 (통합 3-cycle 지속) |

### 4.2 Breaking Changes (B번호)

| # | 변경 | 영향 | bkit 검증 결과 |
|---|------|------|--------------|
| **B1-144** | `/model` 명령이 **현재 세션 한정** 적용. 새 세션 default는 `d` 키 필요 | **HIGH** (사용자 워크플로우 변경) | **무영향 확정** — bkit `/model` auto-call 0건 (Phase 2 grep), 사용자 수동 호출만 |
| **B2-144** | `/extra-usage` → `/usage-credits` 리네이밍 (옛 이름 alias 유지) | **LOW** | **무영향 확정** — alias 유지로 회귀 없음, bkit slash command grep 0건 |

### 4.3 신규 기능 / 개선 (F번호)

| # | 변경 | 영향 | bkit 검증 결과 |
|---|------|------|--------------|
| **F1-144** | `/resume` background sessions 지원 (`bg` 표시) | MED | 무영향 (bkit `--bg` 미사용 — Phase 2 grep) |
| **F2-144** | Background subagent completion에 elapsed duration 추가 | LOW | 자동수혜 (OTEL surface, ENH-281 묶음 후보) |
| **F3-144** | `/plugin` browse/discover panes에 last-updated 표시 | LOW | bkit `.claude-plugin/marketplace.json` 자동수혜 |
| **F4-144** | Worktree isolation guard가 **non-git VCS users + `WorktreeCreate` hooks**에도 적용 | **MED** | **ENH-286 후속 강화** (v2.1.143 B15-143 연장) — bkit `WorktreeCreate` hook 0건 등록 (Phase 2) → 무영향 자동 safe |
| **F5-144** | Plugin marketplace add/update가 `CLAUDE_CODE_PLUGIN_PREFER_HTTPS` 존중 | LOW | 무영향 (Phase 2 grep 0건) |
| **F6-144** | `/plugin` 후 Installed 리스트 복귀 | LOW | 무영향 (UX) |
| **F7-144** | `/doctor`가 command hook missing `command` field 시 exec-form 예시 표시 | LOW | **자동 safe** — bkit 24 blocks 모두 command 필드 정상 (Phase 2 node -e) |
| **F8-144** | Pre-response stream stall 회복 (streaming 1회 재시도) | LOW | 무영향 (성능 자동수혜) |
| **F9-144** | **SDK/headless MCP startup pre-wait가 startup과 overlap, 최대 2s 단축** | **MED** | **bkit 2 stdio servers (19 tools) 직접 자동수혜** — 측정값 변동 가능 |
| **F10-13-144** | post-survey copy / claude agents 관련 UX | LOW | 무영향 |

### 4.4 버그 수정 (X번호) — 41건 중 bkit-relevant 우선

| # | 변경 | 영향 | bkit 검증 결과 |
|---|------|------|--------------|
| **X1-144** | Startup hanging up to 75s when api.anthropic.com unreachable — 15s timeout | **HIGH** | **모든 사용자 자동수혜** (외부 connectivity, bkit 무관) |
| **X2-144** | Skill tool headless mode permission error (v2.1.141 regression) | MED | **bkit 44 skills headless 호출 회복 자동수혜** (pdca-watch 등) |
| **X3-144** | macOS background sessions "exit 1 before init" crash (v2.1.143 regression) | MED | 무영향 (bkit `--bg` 미사용) |
| **X4-144** | **MCP paginated `tools/list` first page only — silently dropping tools** | **HIGH** | **자동 회피 — bkit 부수적 차별화**: bkit 2 servers (19 tools) **cursor/nextCursor 미구현** → single-batch return → v2.1.144 fix 의존 없이 안전 (Phase 2 grep 0건) |
| **X5-144** | MCP unsupported MIME images (SVG) breaking | MED | 무영향 (bkit MCP image return 0건) |
| **X6-144** | **FD exhaustion when build runs inside skill directory** | **HIGH** | **무영향 자동 safe** — bkit는 skills/ 디렉터리 내부에서 dist/build 실행 surface 0건 |
| **X7-144** | Session title generated from plugin monitor output | MED | bkit plugin output 양 많음, title 회복 자동수혜 |
| **X8-144** | Plugins "not cached" + project-only install hint | MED | bkit plugin 신뢰성 자동수혜 |
| **X9-144** | `claude mcp list` silent when `.mcp.json` mal-parsed (VS Code `"servers"` 키) | MED | **무영향 확정** — bkit `.mcp.json`은 `mcpServers` 키 (Phase 2 cat) |
| **X12-144** | `head`/`tail` read-before-edit check 만족, `egrep`/`fgrep`/`git grep`/`git diff` exit 1 가드 | MED | **bkit unified-bash-pre.js 가드 영향 없음** (Phase 2 grep 0건 명시 처리) |
| **X15-144** | Bedrock and Vertex users "Opus (1M context)" 회귀 (v2.1.129) | MED | 무영향 (bkit Anthropic API 사용, Bedrock/Vertex 미사용) |
| **X25-144** | **Skill-listing truncation을 startup notification에서 제거** (`/doctor` 가이드) | **MED** | **ENH-291 P2 surface 가시성 변화만, 코드 영향 0건** — bkit 44 skills multi-line concat 측정값 변동 없음 |
| 그 외 LOW 25+건 | background sessions / agent view / terminal UX | LOW | 무영향 |

### 4.5 시스템 프롬프트 / Hook / Config 변경

- **Hook events**: 21 events 24 blocks 유지 (v2.1.144 release notes에 hook event count 변경 bullet 0건) — bkit hooks/hooks.json 무영향 자동 safe
- **신규 config key**: 0건 (v2.1.143의 `worktree.bgIsolation` / `CLAUDE_CODE_POWERSHELL_RESPECT_EXECUTION_POLICY` / `CLAUDE_CODE_STOP_HOOK_BLOCK_CAP` 유지)
- **System prompt token delta**: release notes에 명시 없음 (간접 grep 불가)
- **effort.level**: v2.1.144 release notes에 신규 bullet 0건. 단 **#59421 (effortLevel setting in settings.json) CLOSED 2026-05-17 — 정황상 v2.1.144 fix 후보**. bkit는 이미 **16 위치 활성 운영** (Phase 2 grep, ENH-300 P1 baseline 정정)
- **R-3 evolved form 신규 4건**: #60337 / #60339 / #60323 / #60352 (5/18 cluster) + #60346 dup-closure +1
- **`updatedToolOutput`**: release notes 0건 — **5-cycle invariant 확정** (lib/audit/audit-logger.js 무영향)

### 4.6 GitHub Issues streak 갱신

| Issue | 누적 streak | 본 cycle | bkit ENH 연결 | 비고 |
|-------|------------|---------|--------------|---|
| **#56293 sub-agent caching 10x** | 13 → **14** | OPEN | **ENH-292 P0** | **14-streak 결정적** (1-month+5d) — Anthropic 5-cycle 연속 미해소 |
| **#57317 plugin PostToolUse silent drop** | 7 → **8** | OPEN | **ENH-303 P1 차별화 #5** | **8-streak 결정적** (1-month+1d) |
| **#58904 Heredoc bypass** | 3 → **4** | OPEN | **ENH-310 P1 차별화 #6** | **4-streak 결정적 OPEN** |
| **#47855 /compact block** | 31 → **32** | OPEN | MON-CC-02 defense | 32-streak (1-month+8d) |
| **#56448 skill validator** | 12 → **13** | OPEN | ENH-291 P2 | 13-streak (X25-144는 가시성 변화만, fix 아님) |
| **#47482 output styles** | 34 → **35** | OPEN | ENH-214 defense | 35-streak (1-month+7d) |
| **R-3 evolved form 누적** | 14 → **18** | +4 (5/18 cluster) | **ENH-289 P1 차별화 #2** | #60337/60339/60323/60352 |
| **R-3 dup-closure** | 5 → **6** | +1 (#60346) | ENH-289 | duplicate 마감 |
| **R-3 numbered #145 (#54178)** | +0 in 24d | 정체 | ENH-289 | 추세 ~0.04/day 안정화 |
| **#58909 permission_prompt** | 메모리 정정 | **OPEN 재확인** | ENH-289 / MON-CC-NEW-NOTIFICATION | 이전 "silent CLOSED 2-cycle" 기록과 충돌 → OPEN 정정 |
| **#60374 DSP bypass project rules** | 신규 | OPEN | **ENH-286 차별화 #1 강화 surface** | `--dangerously-skip-permissions` not bypassing project-level "ask" rules |

**누적 streak 합**: 100 → **107 (+7 milestone)** (v2.1.143의 milestone 100에서 추가)

### 4.7 신규 모니터 후보 (인접 3건)

| 모니터 | Issue | 우선순위 | 사유 |
|--------|-------|---------|------|
| **MON-CC-NEW-RESUME-PHANTOM** | #60390 | P3 | F1-144 출시 즉시 회귀, bkit `--bg` 미사용으로 무영향이나 추적 가치 |
| **MON-CC-NEW-PLUGIN-URL-DROP** | #60380 | P3 | installed_plugins.json URL-based plugins silently dropped, regression label, bkit local plugin 무영향 |
| **MON-CC-NEW-DSP-BYPASS** | #60374 | P2 (인접) | `--dangerously-skip-permissions` not bypassing project-level "ask" rules — **ENH-286 차별화 #1 강화 surface** |

---

## 5. bkit 영향 분석 (Phase 2 Result)

### 5.1 컴포넌트 매핑 실측 (메모리 정정 포함)

| Layer | 실측 카운트 | 메모리 기존 | 정정 |
|-------|-----------|------------|------|
| Hooks | 21 events / 24 blocks | 21 / 24 | 변동 없음 |
| MCP servers | 2 stdio (bkit-pdca + bkit-analysis) | 2 | 변동 없음 |
| **MCP tools** | **19** (bkit-pdca 13 + bkit-analysis 6) | **16** | **정정 +3** |
| Skills | 44 (실측 `^name:` 47 - skill-create 중복 3) | 43~44 | 44 확정 |
| Agents | 34 | 34 | 변동 없음 |
| Lib modules | 174 across 20 subdirs | 174 / 20 subdirs | 변동 없음 |
| Scripts | 54 | 49+ | **정정 54 확정** |
| **OTEL telemetry.js** | **16 위치** | **4** | **정정 +12** |
| **bkit 버전** | **v2.1.15** (plugin.json / bkit.config.json 실측) | **v2.1.14** | **정정 v2.1.14 → v2.1.15** |

### 5.2 차별화 6/6 코드 활성 구현 완료 (Phase 2 grep 확정)

| # | 차별화 | 코드 활성 파일 | 상태 |
|---|---|---|---|
| 1 | **ENH-286 Memory Enforcer** | `lib/defense/memory-enforcer.js` + index 통합 | **활성 (deferred 아님)** |
| 2 | **ENH-289 Defense Layer 6** | `lib/defense/layer-6-audit.js` + `push-event-guard.js` | **활성 (deferred 아님)** |
| 3 | **ENH-292 Sequential dispatch** | `lib/orchestrator/sub-agent-dispatcher.js` + `cache-cost-analyzer.js` | **활성 (deferred 아님)** |
| 4 | **ENH-300 Effort-aware** | `lib/domain/guards/invariant-10-effort-aware.js` + **16 위치 활성 운영** | **활성 (baseline 정정)** |
| 5 | **ENH-303 PostToolUse continueOnBlock** | 19 파일 surface | **활성 (deferred 아님)** |
| 6 | **ENH-310 Heredoc defense** | `lib/defense/heredoc-detector.js` + `scripts/unified-bash-pre.js:257-298` | **활성 (deferred 아님)** |

**핵심 정정**: 메모리의 "deferred 6건" 기술은 **계획 단계 표현**이었으며, Phase 2 grep으로 **6/6 모두 실제 코드 구현 운영 중임 확정**. 본 cycle을 "**차별화 코드 활성 구현 완료 cycle**"로 정의.

### 5.3 자동 회피 — bkit 부수적 차별화 (X4-144)

**X4-144 MCP paginated `tools/list` first page only 회귀**가 v2.1.144에서 fix되었으나, bkit는 이미 **cursor/nextCursor/pagination 미구현** (single-batch `{tools: TOOLS}` return) 으로 회귀의 영향을 받지 않았음. Phase 2 grep 결과:

- `servers/bkit-pdca-server/index.js`: cursor 0건
- `servers/bkit-analysis-server/index.js`: cursor 0건
- 총 19 tools가 단일 응답으로 반환

→ **부수적 차별화**: CC fix 의존 없이 자동 안전. 단 19 tools가 page limit (일반적 50~100)에 가까워질 때 재검토 (Monitor only P3).

---

## 6. Phase 3 브레인스토밍 결과 (Plan Plus YAGNI)

### 6.1 의도 탐색

- **최대 가치**: bkit 차별화 6/6 모두 코드 활성 구현 완료 + 무수정 99 연속 호환 = "**product moat 결정적 입증 cycle**". CC가 따라잡으려는 영역(memory enforcer / heredoc / sequential dispatch / PostToolUse continueOnBlock)이 본 cycle에 모두 결정적 강화됨.
- **Critical signal**: drift critical zone **×2 격화** (+10 → +15). stable +5 promotion (133 → 138). 다음 cycle에 npm stable이 v2.1.140+ 진입 시 drift +17~+19까지 격화 예상 → README/CHANGELOG advisory 1-line 강화 + 보수적 권장 격상 검토 필요.
- **bkit-friendly direction**: HIGH 3건 (X1/X4/X6) 모두 위협 X, 오히려 **X4-144는 bkit cursor 미구현이 자동 회피로 작동한 부수적 차별화 사례**.

### 6.2 대안 탐색 (YAGNI Review)

| 후보 | 대안 | 채택 | 사유 |
|------|------|------|------|
| 신규 ENH 0건 | (a) 0건 / (b) X4/X6/X25 각각 ENH 등록 / (c) X4만 ENH | **(a)** | 자동 회피 / surface 0건 / 가시성 변화만 → 노출 없음 |
| Monitor only 3건 | (a) 등록 / (b) 미등록 | **(a)** | 관찰 비용 LOW, 향후 격상 trigger 명확 (X4 19→증가, X6 빌드 진입 시) |
| 메모리 정정 8건 | (a) 정정 / (b) 다음 cycle 이연 | **(a)** | 정확성 필수 (Phase 2에서 발견된 누적 drift) |
| 코드 patch | (a) 분석만 / (b) 즉시 hotfix | **(a)** | 사용자 패턴 유지 = 보류 (분석만), bkit v2.1.15 안정 작동 |
| drift advisory | (a) 즉시 강화 / (b) 다음 cycle | **(a)** | critical zone ×2 격화로 README 1-line 즉시 권고 |

### 6.3 우선순위 부여

| 항목 | 우선순위 | 사유 |
|------|---------|------|
| 신규 ENH | **0건** | 8-cycle 연속 0건 |
| MON-X4-MCP-PAGINATION | P3 | 19 tools page 1 충분, 증가 시 검토 |
| MON-X6-FD-EXHAUSTION | P3 | skills/ 빌드 surface 0건, 진입 시 검토 |
| MON-X25-TRUNC | P3 | ENH-291 P2 가시성 변화만 |
| MON-CC-NEW-RESUME-PHANTOM | P3 | F1-144 회귀, bkit 무영향 |
| MON-CC-NEW-PLUGIN-URL-DROP | P3 | URL plugin 사용 X |
| MON-CC-NEW-DSP-BYPASS | P2 | **ENH-286 강화 surface** |
| ENH-292 P0 | 유지 | **14-streak 결정적**, Sprint Coordination 가속 |
| ENH-286 P1 | 결정적 강화 | R-3 cluster 5/18 + #60374 |
| ENH-303 P1 | 결정적 강화 | **8-streak** |
| ENH-310 P1 | 결정적 강화 | **4-streak OPEN** |
| ENH-289 P1 | 강화 | 누적 18 |
| ENH-300 P1 | 활성 입증 | 16 위치 운영, baseline 정정 |
| **README advisory** | **즉시** | drift +15 critical zone ×2 격화 |

---

## 7. 권장 조치 (Action Items)

### 7.1 즉시 (사용자 결정 — 보류 패턴 유지)

| # | 항목 | 책임 | 상태 |
|---|------|------|------|
| 1 | 메모리 정정 8건 적용 | claude-code | ✅ 본 보고서 §1.1 / §5.1 |
| 2 | `memory/cc_version_history_v2144.md` 작성 | claude-code | ✅ 본 cycle |
| 3 | `MEMORY.md` index 갱신 (v2.1.144 entry) | claude-code | ✅ 본 cycle |
| 4 | ENH backlog 정정 (차별화 6/6 활성 입증) | claude-code | 메모리 정정 포함 |

### 7.2 단기 (1주 이내, 권장)

| # | 항목 | 책임 | 우선순위 |
|---|------|------|---------|
| 5 | README advisory 1-line 강화 (drift +15 critical zone ×2 격화) | bkit maintainer | P1 |
| 6 | 보수적 권장 CC 버전 검토 (v2.1.123 → v2.1.140+) | bkit maintainer | P2 |
| 7 | 인접 monitor 3건 등록 (RESUME-PHANTOM / PLUGIN-URL-DROP / DSP-BYPASS) | claude-code | P3 |

### 7.3 중기 (deferred)

| # | 항목 | 책임 | 비고 |
|---|------|------|------|
| 8 | MON-X4 19→증가 시 ENH 검토 | bkit maintainer | tools 추가 trigger |
| 9 | MON-X6 skills/ 빌드 surface 진입 시 ENH 검토 | bkit maintainer | dist/build 도입 trigger |
| 10 | #60374 DSP bypass project rules 추적 (ENH-286 강화) | bkit maintainer | OPEN 추적 |

---

## 8. bkit Feature Usage Report

| Feature | Count | Notes |
|---------|-------|-------|
| `/cc-version-analysis` skill | 1회 | 본 cycle ADR 0003 13번째 적용 |
| `cc-version-researcher` agent | 1회 (background) | Phase 1, 52 bullets 수집 |
| `bkit-impact-analyst` agent | 1회 (background) | Phase 2, 12 invariants 검증 |
| Plan Plus YAGNI Review | 1회 (main) | Phase 3, 5 후보 YAGNI |
| ADR 0003 매트릭스 | 25 → 32+ | 13-cycle 일관성 |
| Bash invariant 직접 검증 | 3건 | claude --version / plugin validate / bkit.config.json |
| TaskCreate / TaskUpdate | 5건 / 4건 | 5-task tracking |
| 차별화 6/6 코드 활성 grep | 12+ files | Phase 2 |
| 메모리 정정 | 8건 | 본 cycle 정정 |

---

**보고서 끝**. 다음 cycle 트리거: v2.1.145 또는 stable v2.1.140+ 진입 시. **Next ENH number: ENH-313** (신규 0건으로 미사용).
