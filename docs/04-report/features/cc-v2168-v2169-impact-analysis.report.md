# CC v2.1.168 → v2.1.169 영향 분석 및 bkit 대응 보고서 (ADR 0003 스무 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 20번째 정식 적용 ✦, 신규 ENH(implement) 0건 **16-cycle 연속**, **120 consecutive compatible milestone ✦**, **1-version delta (30 bullets, 실질 delta — placeholder 아님)**, Breaking 0건 / Breaking-equivalent 0건, auto-benefit 6건, 차별화 6/6 streak 갱신 (#56293→21 / #57317→15 / #58904→11), **OTEL 모니터 + skill_post plugin-hook-drop 모니터 둘 다 STAYS ACTIVE**, Phase 1.5 게이트 tail-total 산술오류 회피 (수동 열거 30 확정), R-2 skip 0건, MF-1 carry-forward)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (bkit.config.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-06-09
> **PDCA Cycle**: cc-version-analysis (v2.1.168 → v2.1.169, **1-version delta** — 직전 v2.1.168 분석 이후 신규 v169)
> **CC Range**: v2.1.168 (baseline) → **v2.1.169** (npm latest, 2026-06-08 21:57 UTC publish, GitHub author @ashwin-ant / npm wolffiex, installed=2.1.169)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 0건 / Breaking-equivalent 0건 / 신규 ENH(implement) 0건 16-cycle 연속 / auto-benefit 6건 / 차별화 6/6 streak 갱신 / 120 consecutive milestone / OTEL #64436 + skill_post plugin-hook-drop 모니터 STAYS ACTIVE / 권장 CC v2.1.169 즉시 격상 / MF-1 carry-forward(미해결)**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (v169 flat list 30 bullets, 제거/API 파괴 0건) |
| **Breaking-equivalent** | **0건** — soft-breaking 후보(#1 `--safe-mode`, #3 `disableBundledSkills`, #5 managed MCP 강제, #14 bg env drop, #26 CLAUDE.md threshold)는 **bkit 부착점 0건 실측 확인** |
| **bkit-friendly (auto-benefit)** | **6건** — #5 managed MCP allow/deny 강제 누락 fix(governance) / #14 pre-warmed worker가 project `env`(ANTHROPIC_MODEL) 무시하던 버그 fix(Diff#3 dispatch 결정성↑) / #16 plugin `.in_use` PID lock GC(bkit=plugin 수혜) / #17 untrusted OTEL client-cert trust fix(security) / #19 `TaskCreate` 자동복구(bkit TaskCreate 다용) / #23 managed-settings invalid-entry 부분적용(governance) |
| **out-of-scope (무영향)** | **24 bullets** — UI/렌더링, Windows/WSL, macOS stall, OAuth, statusline, promo 등 |
| **OTEL 모니터 #64436 처리** | **STAYS ACTIVE** — v169 유일 OTEL bullet은 #17(untrusted client-cert **trust** fix)로 shutdown-flush metric-drop(#64436)과 별개. `expectedFix: null` 유지 |
| **skill_post plugin-hook-drop 모니터 처리** | **STAYS ACTIVE** — 본 세션 preflight `missing=[skill_post]` 재발. v169 plugin bullet은 #15(MCPB cache)·#16(PID lock GC)뿐, **hook reachability 미해결** |
| **신규 ENH(implement) 후보** | **0건 (16-cycle 연속)** — #1 safe-mode 문서화 후보는 P3 DEFER(번호 미소비) |
| 마지막 ENH 번호 | ENH-328 (변동 없음, ENH-329 미소비 유지, ENH-317 CANCELLED 유지) |
| **차별화 6/6 streak 갱신** | **#56293 20→21 (ENH-292 P0) / #57317 14→15 (ENH-303 P1) / #58904 10→11 (ENH-310 P1)** — 30 bullets 중 3대 이슈 root cause 해결 0건 |
| **메모리 정정** | 없음 — bkit baseline 6/6 직접 재측정 일치 (v2.1.22 / agents 40 (40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (120 consecutive milestone 입증) |
| **유지보수 발견 (MF-1, carry-forward)** | ⚠️ `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION = '2.1.118'` — 현 latest 2.1.169 대비 ~51릴리스 stale. 직전 cycle flag 이후 **미해결 carry-forward**. 분석 전용 스킬이므로 미수정, 팀 결정 필요(No Guessing) |
| **연속 호환 릴리스** | **120 milestone ✦** (v2.1.34 → v2.1.169, 119 → 120, +1 — R-2 skip v134/135/151/155/164 제외) |
| ADR 0003 적용 | **YES (20번째 정식 적용 ✦)** |
| **권장 CC 버전** | **v2.1.169 즉시 격상 권고** (auto-benefit 6건, Breaking 0). **보수적 권장 stable v2.1.153 drift +16 CRITICAL band (역대 최대)** → stable 격상 결정 권고 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.168 → v2.1.169 영향 분석 (ADR 0003 20번째 ✦)      │
│  ★ 1-version 실질 delta (30 bullets, placeholder 아님)   │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 30 bullets (raw-verified)              │
│      Added 3 / Fixed 14 / Improved·Other 13              │
│  🔍 Phase 1.5 게이트: tail-total 산술오류 회피           │
│      • researcher 30 / WebFetch 자가총계 38·31 (오산)   │
│      • raw CHANGELOG = GitHub tag verbatim 리스트 동일   │
│      • 메인 세션 행 단위 수동 열거 → 30 확정             │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking: 0건 / Breaking-equivalent: 0건             │
│      • #1 safe-mode: bkit 로드 前 CC레벨 전체 차단       │
│        → bkit 저항 불가·불필요(의도된 동작), 부착점 0   │
│      • #3 disableBundledSkills: CC 내장 스킬 한정,       │
│        bkit 44 skills=plugin-provided → 무관             │
│  🟢 auto-benefit 6건 (#5/#14/#16/#17/#19/#23)           │
│  🆕 신규 ENH(implement): 0건 (16-cycle 연속)            │
│      • #1 safe-mode 문서화 → P3 DEFER(번호 미소비)      │
│  ⚠️ MF-1 carry-forward: RECOMMENDED_VERSION 2.1.118     │
│      ~51릴리스 stale (미해결, 팀 결정 필요)             │
│  📈 차별화: #56293→21 #57317→15 #58904→11               │
│  ✅ 연속 호환: 120 milestone ✦ (v2.1.34~v2.1.169)       │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | `--safe-mode` 트러블슈팅 스위치(#1), `/cd` cache-safe cwd 이동(#2), stale 권한 prompt 재출현 fix(#11), `claude -p` Windows hang(2.1.161 회귀) fix(#7), CPU 사용 감소(#21) |
| **개발자(Dev/bkit)** | ⟷ 무영향 | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 16-cycle 연속 무수정. MF-1만 별도 carry-forward |
| **보안(Security)** | ⬆ 개선 | #17 untrusted OTEL client-cert trust 강제(cert 유출 벡터 차단), #5 managed MCP allow/deny 강제 누락 fix(reconnect/IDE/first-session 경로), #23 invalid managed-entry가 전체 정책 무력화하던 버그 fix → CC governance 계층 자동 강화 |
| **운영(Ops)** | ⬆ 개선 | #14 pre-warmed worker env 누락 fix(dispatch 결정성), #16 plugin PID lock GC(자원 누수 방지), #22 Vertex/Foundry idle timeout 복원, #24 bg-session flag 보존 |

---

## 2. CC v2.1.169 변경사항 (30 bullets, raw-verified)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — tail-total 산술오류 회피

| Field | Agent 보고 | Raw 검증 | Source URL | Verdict |
|-------|:---:|:---:|------|:---:|
| Added | 3 | 3 | raw CHANGELOG (분류) | match |
| Fixed | 14 | 14 | raw CHANGELOG (분류) | match |
| Improved·Other | 13 | 13 | raw CHANGELOG (분류) | match |
| **Total bullets** | **30** | **30 (수동 열거)** | raw CHANGELOG = GitHub release tag (verbatim 리스트 byte-identical) | **match** |

- **tail-total 산술오류 회피 (핵심 학습)**: raw CHANGELOG WebFetch와 GitHub release tag WebFetch는 **verbatim 리스트가 완전 동일(30개)**이었으나, 두 응답이 자기가 나열한 리스트의 꼬리 "Total"을 각각 **38 / 31로 오산**. 메인 세션이 행 단위로 직접 열거 → **30 확정**. researcher의 30이 정확.
- **이번 cycle 교훈 (errata learning)**: 직전 cycle들은 model이 bullet을 *누락/병합*하는 **count miscount**였으나, 본 cycle은 **리스트는 정확하나 합산만 틀린 산술오류** 패턴. → "model이 보고한 Total 숫자"가 아니라 **"열거된 verbatim 리스트를 직접 카운트"** 하는 것이 게이트의 정답. 두 소스 verbatim 동일성이 신뢰의 근거.
- **구조**: v169 CHANGELOG는 sub-heading 없는 **flat list**. Added/Fixed/Improved 분류는 선행 동사 기반.
- **게시**: GitHub author @ashwin-ant / npm publisher wolffiex (양립). 2026-06-08 21:57 UTC. v169는 **실질 30-bullet 엔트리(placeholder 아님)** — 직전 v168은 placeholder였음.
- **spot-check 3건 verbatim 일치**: #5(enterprise managed MCP policies) / #14(background agents ignoring project-level env) / #17(untrusted OTEL client-certificate).

### 2.2 카테고리별 분류 요약

| 그룹 | bullets | 핵심 항목 |
|------|:---:|------|
| Added (3) | 1~3 | `--safe-mode`/`CLAUDE_CODE_SAFE_MODE`, `/cd` cache-safe cwd 이동, `disableBundledSkills`/`CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` |
| Fixed (14) | 4~17 | managed MCP 강제 누락, `claude -p` Windows hang(2.1.161 회귀), agents --json id/state/--all, **bg env(ANTHROPIC_MODEL) drop**, MCPB cache, plugin PID lock, **untrusted OTEL client-cert** |
| Improved·Other (13) | 18~30 | `/workflows` 즉시 오픈, **TaskCreate 자동복구**, Vertex/Foundry idle timeout, **managed-settings 부분적용**, bg flag 보존, **CLAUDE.md threshold context-scaling**, auto-updater |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 직접 재측정 (Numeric Correction Protocol)

| 항목 | 측정값 | 측정 명령 | 이전 메모리 | 판정 |
|------|:---:|------|:---:|:---:|
| agents | 40 | `ls agents/*.md \| wc -l` | 40 | 일치 |
| model: 커버리지 | 40/40 | `grep -l "^model:" agents/*.md` | 40/40 | 일치 |
| skills | 44 | `ls skills/*/SKILL.md \| wc -l` | 44 | 일치 |
| lib modules | 190 | `grep -rl "module.exports" lib/` | 190 | 일치 |
| lib subdirs | 22 | `ls -d lib/*/ \| wc -l` | 22 | 일치 |
| MCP servers | 2 | `ls servers/*/index.js` | 2 | 일치 |
| bkit version | 2.1.22 | `grep version bkit.config.json` | 2.1.22 | 일치 |

→ **6/6 항목 메모리 일치. 정정 제안 없음.** (SessionStart preflight "34 agents/174 lib" stale 표기 — 채택하지 않음.)

### 3.1 bkit-relevant 플래그 독립 검증 (메인 세션 + 분석가 + 메인 재검증)

| Bullet | 검증 방법 | 결과 |
|--------|-----------|------|
| **#1** `--safe-mode`/`CLAUDE_CODE_SAFE_MODE` | repo grep + 의미 분석 | bkit 코드 참조 0건. safe-mode는 **bkit 로드 이전 CC 레벨**에서 CLAUDE.md+plugins+skills+hooks+MCP 전체를 끔. bkit Memory Enforcer(Diff#1)/Defense L6(Diff#2)는 이 시점 미로드 → **저항 불가·불필요(의도된 트러블슈팅 동작)**. 부착점 0. P3 문서화 후보만 |
| **#3** `disableBundledSkills`/`CLAUDE_CODE_DISABLE_BUNDLED_SKILLS` | `skills/bkit/SKILL.md` 분류 확인 | "bundled skills"는 **CC 내장 스킬/명령** 한정. bkit 44 skills는 **plugin-provided** → **무관** |
| **#12** `claude agents --json` id/state/--all | `grep "agents --json"` lib/scripts/hooks | bkit parser **0건** (lib/scripts의 `--json`은 bkit 자체 jq/test JSON). Neutral |
| **#14** bg env(ANTHROPIC_MODEL) drop fix | sub-agent-dispatcher.js 의존성 검토 | pre-warmed worker가 project `env`를 honor → **Diff#3 sequential dispatch 결정성 향상 (auto-benefit, MEDIUM)** |
| **#16** plugin `.in_use` PID lock GC | bkit=plugin runtime | stale marker 일일 sweep → bkit 자원 누수 방지 (auto-benefit, LOW) |
| **#19** `TaskCreate` 자동복구 | `scripts/task-created-handler.js` 검토 | malformed input 자동 복구 + 방어적 read/exit-0 fallback 이미 존재 → 동작변화 위험 없음 (auto-benefit, MEDIUM) |
| **#26** CLAUDE.md too-long threshold context-scaling | `memory-enforcer.js`, 하드코딩 threshold grep | bkit는 CLAUDE.md **크기 임계값 하드코딩 없음**. `memory-enforcer.js`는 directive *추출* 경계(240/200), context-sizer는 sprint *토큰 예산*(100K) — 둘 다 CLAUDE.md 길이 gate 아님. Neutral |
| **#5/#23** managed MCP 강제 / 부분적용 | `.mcp.json` + settings 배포 여부 | bkit는 **settings.json 미배포** → 직접 부착점 없음. governance auto-benefit |
| **#17** untrusted OTEL client-cert | `grep CLIENT_CERTIFICATE lib/` + otel-env-capturer.js | lib/에 client-cert 참조 0건. `otel-env-capturer.js`는 **신뢰된 USER shell env**에서 캡처(project settings 아님) → 노출 없음. Neutral (security auto-benefit) |

### 3.2 soft-breaking 후보 → bkit 컴포넌트 매핑

| Bullet | bkit 컴포넌트 | 영향 | 근거 |
|--------|---------------|------|------|
| #1 `--safe-mode` | 없음 (CC pre-load) | Neutral | bkit 로드 전 차단, 의도된 동작 |
| #3 disableBundledSkills | 없음 | Neutral | CC 내장 스킬 한정 |
| #5 managed MCP 강제 | .mcp.json (settings 미배포) | Neutral / auto-benefit | settings.json 미배포 |
| #14 bg env drop | sub-agent-dispatcher.js | auto-benefit | env 전달 정확도↑ |
| #26 CLAUDE.md threshold | memory-enforcer.js | Neutral | 크기 gate 미하드코딩 |

**Hook 스키마 변경: 없음. PreToolUse/PostToolUse/Stop/SubagentStop 이벤트 변경: 없음. Agent/Skill frontmatter 스키마: 없음.** → `test/contract/hook-input-schema.test.js`, `hook-output-schema.test.js` 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (16-cycle 연속)**. ENH 번호 미소비(ENH-328 유지).

### 4.1 Intent Discovery
- **최대 가치**: #14(bg env drop fix)가 bkit Diff#3 sequential dispatch의 env 전달 결정성을 무수정으로 강화. #19(TaskCreate 자동복구)는 bkit의 TaskCreate 다용 패턴을 더 견고하게.
- **놓치면 안 되는 critical change**: 없음(Breaking 0). 단 #1 `--safe-mode`는 bkit 사용자가 "bkit이 동작 안 한다"고 오인할 수 있는 새 스위치 → 문서화 가치 존재(P3).
- **workaround 대체 native 기능**: 없음. bkit은 #5/#17/#23 governance 강화를 자동 수혜할 뿐 자체 workaround 보유 안 함.

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| `--safe-mode` 동작 문서화 (bkit 비활성 설명) | #1 | **P3 DEFER (번호 미소비)** | 트러블슈팅용 CC 표준 스위치. bkit이 의도적으로 우회됨은 정상. 현 사용자 혼란 보고 0건 → **YAGNI**. 향후 docs/06-guide FAQ에 1-liner면 충분. **No Guessing**: 실수요 미확인 |
| `disableBundledSkills` 영향 안내 | #3 | **DROP** | bkit skills=plugin-provided로 무관 → 작업 대상 0 |
| `agents --json` id/state 파서 추가 | #12 | **DROP** | bkit은 `claude agents --json` 미파싱 → 부착점 없음 |
| managed MCP/OTEL governance 채택 | #5/#17/#23 | **DROP** | bkit settings.json 미배포 정책 → auto-benefit으로 충분 |

→ 16-cycle 연속 무변경 = 성숙 아키텍처 신호. 추측성 ENH 거부가 No Guessing 철학에 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1, carry-forward) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `const RECOMMENDED_VERSION = '2.1.118';` (직전 cycle 이후 **변동 없음**) |
| **문제** | 현 latest 2.1.169 대비 ~51릴리스 stale. MEMORY 권장선(보수 2.1.123 / 균형 2.1.140)과도 불일치 |
| **본 cycle 조치** | **flag 유지 (미수정)** — 분석 전용 스킬(HARD-GATE) + 임의 bump은 No Guessing 위반 |
| **권고** | 별도 유지보수 작업으로 정책 갱신. 분기 로직(`:198~203`) 정상. **2-cycle 연속 carry-forward** — 다음 일반 PDCA에서 우선 처리 권고 |

---

## 5. 차별화 6/6 streak 갱신

v169 bullet 중 #56293/#57317/#58904 root cause 해결 항목 **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 (P0) | 20 | **21** | v169 #2 `/cd`는 cache **보존** 신기능, #56293 invalidation 미해결. bkit Diff#3 유일 mitigation 유지 |
| #57317 PostToolUse drop | ENH-303 (P1) | 14 | **15** | v169 PostToolUse 변경 0건. 추가로 **skill_post plugin-hook-drop reachability 미해결**(preflight 재발) |
| #58904 heredoc bypass | ENH-310 (P1) | 10 | **11** | v169 bash-parsing/heredoc 변경 0건. bkit Diff#6 독립 면역 유지 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | v169 full CHANGELOG + GitHub release 존재 |
| R-2 true semver skip | +0 | v168→v169 연속, triple-present |
| R-3 hotfix chain | +0 | 회귀 연쇄 징후 없음 (단 #7은 2.1.161 회귀 fix — 단발) |

- **release_drift_score (ENH-309)**: stable=2.1.153 / latest=2.1.169 → **drift = 16 패치 (CRITICAL band ≥8, 역대 최대 갱신)**. stable 채널 사용자 안전하나 latest 대비 +16 — stable 격상 결정 권고. (prior batch stable 2.1.153 정체)

---

## 7. Monitor 상태

| Monitor | Issue | v169 처리 | 판정 |
|---------|-------|-----------|------|
| MON-CC-NEW-BG-OTEL-DROP | #64436 | v169 유일 OTEL bullet #17은 client-cert **trust** fix(shutdown-flush metric-drop과 별개) | **STAYS ACTIVE** (expectedFix: null) |
| MON-CC-NEW-PLUGIN-HOOK-DROP | #57317 (skill_post) | 본 세션 preflight `missing=[skill_post]` 재발. v169 plugin bullet #15/#16은 cache/PID-GC뿐 hook reachability 미터치 | **STAYS ACTIVE** |

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking / Breaking-equivalent | **0건 / 0건** (soft-breaking 후보 전부 실측 no-op) |
| bkit 소스 변경 필요 | **N** (16-cycle 연속 무수정) — MF-1 별도 유지보수 권고(2-cycle carry-forward) |
| Consecutive compatible | **119 → 120 ✦** (v2.1.34~v2.1.169) |
| 신규 ENH(implement) | **0건** (16-cycle 연속, ENH 번호 미소비) |
| 권장 CC 액션 | **v2.1.169 즉시 격상 (ADOPT)** — auto-benefit 6건, Breaking 0. stable(2.1.153) drift +16 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1 (carry-forward)**: RECOMMENDED_VERSION 갱신 — 별도 작업, 팀이 지원 floor 결정 |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH(implement)-zero streak: 15 → **16**
- Consecutive compatible: 119 → **120 ✦**
- Differentiation: #56293=**21**, #57317=**15**, #58904=**11**
- R-2 skip 누적: 변동 없음 (v134/135/151/155/164)
- Architecture baseline: 6/6 재측정 일치, 정정 없음
- 마지막 ENH 번호: ENH-328 유지 (ENH-329 미소비)
- Monitor: OTEL #64436 + skill_post plugin-hook-drop 둘 다 STAYS ACTIVE
- MF-1: RECOMMENDED_VERSION stale **2-cycle carry-forward**
- 다음 baseline: **v2.1.169** (다음 분석 v2.1.170부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(30 bullets) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (tail-total 산술오류 회피, 수동 열거 30 확정)
- [x] raw CHANGELOG + GitHub release tag 이중 fetch (verbatim 리스트 byte-identical)
- [x] bullet count cross-verify (Added 3 / Fixed 14 / Improved 13 = 30)
- [x] ≥3 spot-check (#5/#14/#17) verbatim 확인
- [x] 분석가 load-bearing 클레임 직접 재검증 (otel-env-capturer.js, memory-enforcer.js, RECOMMENDED_VERSION:40, agents --json 부재)
- [x] 아키텍처 6/6 직접 재측정 (정정 없음)
- [x] ENH 우선순위 (implement 0건, P3 DEFER/DROP 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
- [x] safe-mode/disableBundledSkills scope 명시 판정
- [x] Monitor 2건(OTEL + skill_post) 상태 명시
