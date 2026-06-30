# CC v2.1.161 → v2.1.162 영향 분석 및 bkit 대응 보고서 (ADR 0003 열여덟 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 18번째 정식 적용, **18-cycle consistency milestone ✦**, 신규 ENH 0건 **14-cycle 연속**, **114 consecutive compatible milestone**, **1-version 소형 clean delta (28 bullets)**, Breaking 0건 / Breaking-equivalent 0건, 차별화 6/6 streak 갱신 (#56293→19 / #57317→13 / #58904→9), **OTEL 모니터 STAYS ACTIVE (v162 OTEL bullet 0건)**, Phase 1.5 게이트 under-count trap 회피 (researcher 27 → raw 28), R-2 skip 0건)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (bkit.config.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-06-05
> **PDCA Cycle**: cc-version-analysis (v2.1.161 → v2.1.162, **1-version 소형 delta** — 직전 v2.1.161 분석 이후 신규 v162)
> **CC Range**: v2.1.161 (baseline) → **v2.1.162** (npm latest, 2026-06-03 21:31 UTC publish @ashwin-ant, installed=2.1.162)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 0건 / Breaking-equivalent 0건 / 신규 ENH 0건 14-cycle 연속 / 차별화 6/6 streak 갱신 (#56293→19 / #57317→13 / #58904→9) / 114 consecutive milestone / OTEL 모니터 #64436 STAYS ACTIVE / 권장 CC v2.1.162 즉시 격상**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (v162 Breaking 섹션 부재, flat list 28 bullets) |
| **Breaking-equivalent** | **0건** — soft-breaking 후보 6건(#2 `--tools` Grep/Glob native / #6 Windsurf→Devin rename / #8 WebFetch 도메인 규칙 precedence / #9 Windows 권한·Read deny / #12 MCP timeout <1000ms / #28 startup 메시지 제거)은 **bkit 부착점 0건 실측 확인**되어 무영향 |
| **bkit-friendly (auto-benefit)** | **4건** — #8 WebFetch deny/ask/allow precedence(보안) / #9 Windows 권한 매칭 + Read deny→Glob/Grep 숨김(보안) / #11 emoji/surrogate API-400 fix(MCP desc) / #26 bg-service startup + `claude update` EDR-scan 대기(robustness) |
| **out-of-scope (무영향)** | **다수** — `claude agents` TUI / startup 메시지 / autocomplete / LSP 등 ~15 bullets |
| **OTEL 모니터 #64436 처리** | **STAYS ACTIVE** — v162 OTEL 관련 bullet **0건**. `expectedFix: null` / `resolvedAt: null` 유지 (v161 init-race fix와 무관, shutdown-flush drop 모니터 그대로) |
| **신규 ENH 후보** | **0건 (14-cycle 연속)** — ENH-329 후보 3건(#2/#9/#12) 모두 YAGNI DROP/REJECT |
| 마지막 ENH 번호 | ENH-328 (DROP) — 본 cycle 신규 0건이므로 변동 없음, ENH-329 미소비 |
| **차별화 6/6 streak 갱신** | **#56293 18→19 (ENH-292 P0) / #57317 12→13 (ENH-303 P1) / #58904 8→9 (ENH-310 P1)** — 28 bullets 중 3대 이슈 root cause 해결 0건, streak 연장 |
| **메모리 정정** | 없음 — bkit baseline 6/6 항목 직접 재측정 일치 (v2.1.22 / agents 40 (model: 40/40) / skills 44 / lib 190 modules 22 subdirs / MCP 2 servers) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (현재 main GA 안정, 114 consecutive milestone 입증) |
| **연속 호환 릴리스** | **114 milestone** (v2.1.34 → v2.1.162, 113 → 114, +1 게시 — v162 1버전, R-2 skip v134/135/151/155 제외) |
| ADR 0003 적용 | **YES (18번째 정식 적용 — 18-cycle consistency milestone ✦)** |
| **권장 CC 버전** | **v2.1.162 즉시 격상 권고** (보안 positive: WebFetch precedence + Windows 권한 정확성 / robustness positive: bg-service startup + read-only config 복원력 / clean 28 bullets). **보수적 권장 stable v2.1.152 drift +10 CRITICAL band** → stable 격상 결정 권고 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.161 → v2.1.162 영향 분석 (ADR 0003 18번째 ✦)      │
│  ★ 1-version 소형 clean delta (28 bullets)               │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 28 bullets (verbatim 검증, flat list)  │
│      Added-type 6 / Fixed 15 / Improved·Removed 7        │
│  🔍 Phase 1.5 게이트: researcher 27 → raw 28 (under-     │
│      count trap 회피, raw CHANGELOG=GitHub tag identical) │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking: 0건 / Breaking-equivalent: 0건             │
│      • soft-breaking 6건 모두 bkit 부착점 0건 실측        │
│        - #2 --tools Grep/Glob native (agent tools 무관)  │
│        - #6 Windsurf → Devin Desktop rename             │
│        - #8 WebFetch domain rule precedence             │
│        - #9 Windows 권한 + Read deny                     │
│        - #12 MCP per-server timeout <1000ms             │
│        - #28 startup 메시지 제거                          │
│  🟢 auto-benefit 4건                                     │
│      • #8 WebFetch deny/ask/allow precedence (보안)     │
│      • #9 Windows 권한 매칭 + Read deny 숨김 (보안)      │
│      • #11 emoji/surrogate API-400 fix (MCP desc)       │
│      • #26 bg-service startup EDR-scan 대기 (robust)    │
│  🆕 신규 ENH 후보: 0건 (14-cycle 연속)                  │
│  📈 차별화 6/6 streak: #56293→19 #57317→13 #58904→9    │
│  ✅ 연속 호환: 114 milestone (v2.1.34~v2.1.162)         │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | bg-session 데이터 손실 fix(#18/#19), read-only config startup 복원(#7), startup 노이즈 감소(#22~25,#28) → 안정성·가독성 향상 |
| **개발자(Dev/bkit)** | ⟷ 무영향 | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 14-cycle 연속 무수정 |
| **보안(Security)** | ⬆ 개선 | #8 WebFetch 권한 precedence(권한 우회 클래스 하드닝), #9 Windows deny-rule 회피 fix → bkit Defense layer 하부 권한 계층 자동 강화 |
| **운영(Ops)** | ⬆ 개선 | #26 EDR-scan 대기로 `claude update` 실패 감소, #20 TMPDIR deep-path SendMessage fix → CI/원격 환경 안정성 |

---

## 2. CC v2.1.162 변경사항 (28 bullets, raw-verified)

### 2.1 Phase 1.5 Raw Verification Gate 결과

| Field | Agent 보고 | Raw 검증 | Source URL | Verdict |
|-------|:---:|:---:|------|:---:|
| Added-type | 6 | 6 | 분류(소스 sub-heading 부재) | match |
| Fixed | 15 | 15 | 분류 | match |
| Improved·Removed | 7 (자가수정) | 7 | 분류 | match |
| **Total bullets** | **27 → 28** | **28** | raw CHANGELOG = GitHub tag (byte-identical) | **errata 회피 (raw wins)** |

- **under-count trap 회피**: cc-version-researcher 초기 27 miscount → 메인 세션 raw CHANGELOG.md + GitHub release tag 이중 fetch로 **28 확정**. v2.1.16/v2.1.145/v2.1.161에 이은 4번째 under-count 패턴 재현 → 게이트 효용 재입증.
- **구조**: v162 CHANGELOG는 sub-heading 없는 **flat list**. Added/Fixed/Improved 분류는 선행 동사 기반 분류이며 소스 명시값 아님.
- **게시자 정정**: npm `_npmUser`=wolffiex / GitHub release author=**@ashwin-ant** — 양립(npm publish ≠ GitHub author). 게시 2026-06-03 21:31 UTC.
- **spot-check 3건**(#8/#12/#20) raw 양 소스 verbatim 일치 확인.

### 2.2 카테고리별 분류

| 그룹 | bullets | 핵심 항목 |
|------|:---:|------|
| Added-type (6) | 1~6 | `claude agents --json waitingFor`, `--tools` Grep/Glob native, `/effort` persist 확인, slash autocomplete fill, Remote Control footer pill, Windsurf→Devin rename |
| Fixed (15) | 7~21 | read-only config startup hang, WebFetch 권한 precedence, Windows 권한·Read deny, Esc interrupt drop, emoji surrogate API-400, MCP timeout <1000ms, LSP workspaceSymbol, `claude agents` TUI 다수, bg-session 손실/큐잉, SendMessage TMPDIR, bg 5s stall |
| Improved·Removed (7) | 22~28 | quieter startup, warnings 재작성/pinned, compact 실패 turn, bg-service EDR-scan 대기, dispatch spawn error-class, startup 메시지 제거 |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 직접 재측정 (Numeric Correction Protocol)

| 항목 | 측정값 | 측정 명령 | 이전 메모리 | 판정 |
|------|:---:|------|:---:|:---:|
| agents | 40 | `Glob agents/*.md` | 40 | 일치 |
| model: 커버리지 | 40/40 | `Grep "^model:" agents/` | 40/40 | 일치 |
| skills | 44 | `Glob skills/*/SKILL.md` | 44 | 일치 |
| lib modules | 190 | `Grep "module.exports" lib/` | 190 | 일치 |
| lib subdirs | 22 | 경로 distinct top-level 추출 | 22 | 일치 |
| MCP servers | 2 | `Glob servers/**/index.js` | 2 | 일치 |
| bkit version | 2.1.22 | `Read bkit.config.json` | 2.1.22 | 일치 |

→ **6/6 항목 메모리 일치. 정정 제안 없음** (직접 측정이 메모리와 동일하므로 정정 불필요).

### 3.1 bkit-relevant 플래그 독립 검증 (2건 → 둘 다 no-op)

| Bullet | 검증 방법 | 결과 |
|--------|-----------|------|
| #12 MCP per-server timeout <1000ms | `Read .mcp.json` + `Grep "timeout" .mcp.json` | 두 서버(bkit-pdca, bkit-analysis) `command`/`args`/`env`만, **timeout 필드 0개** → no-op 확정. 현 상태(필드 없음=default fallback)가 v162에서 가장 안전 |
| #20 CLAUDE_CODE_TMPDIR/SendMessage | `Grep "TMPDIR\|SendMessage\|CLAUDE_CODE_TMPDIR"` 전체 repo | 3건 모두 stale 문서 참조(memory/cc_version_history_v2117_v2119.md, docs/reference/cc-issue-monitoring.md ×2). **hooks/lib/scripts 런타임 코드 참조 0건** → no-op 확정 |

### 3.2 soft-breaking 후보 → bkit 컴포넌트 매핑

| Bullet | bkit 컴포넌트 | 영향 | 근거 |
|--------|---------------|------|------|
| #2 `--tools` Grep/Glob native | agents/*.md (tools frontmatter) | Neutral / 잠재 auto-benefit | bkit agent가 tools에 Grep/Glob 명시하지 않음. 동작 개선 방향, breaking 아님 |
| #6 Windsurf→Devin rename | 없음 | Neutral | bkit는 `/ide`/`/terminal-setup`/`/scroll-speed` 미사용 |
| #8 WebFetch domain precedence | 없음 (permissions) | Neutral (auto-benefit) | bkit는 `WebFetch(domain:...)` 규칙 미배포 |
| #9 Windows 권한 + Read deny | lib/permission, scripts/ | Neutral (auto-benefit) | bkit는 Read deny 규칙 미배포, 권한 정확성 자동 수혜 |
| #12 MCP timeout <1000ms | .mcp.json | Neutral (검증 no-op) | timeout 필드 0개 |
| #28 startup 메시지 제거 | 없음 | Neutral | bkit는 startup 메시지 파싱 안 함 |

**Hook 스키마 변경: 없음. PreToolUse/PostToolUse: 없음. Agent/Skill frontmatter 스키마: 없음.** → `test/contract/hook-input-schema.test.js`, `hook-output-schema.test.js` 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH **0건 (14-cycle 연속)**. ENH-329 미소비.

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| native 검색도구 마이그레이션 | #2 | **DROP** | 현 agent tools 정의는 CC가 이미 자동 처리. 명시적 Grep/Glob 추가는 동작 변화 없이 토큰만 소비. **No Guessing**: 실측 동작 개선 미확인 상태 40개 agent 일괄 수정 근거 부족 |
| Windows 권한 정확성 활용 | #9 | **DROP** | bkit 부착점(Read deny 규칙) 없음 → 작업 대상 0 |
| MCP timeout 명시 | #12 | **REJECT** | timeout 추가 시 v162 <1000ms 무시·watchdog 변경에 오히려 노출. 현 상태(필드 없음)가 최선. **Docs=Code**: 불필요 필드 추가 안 함 |

→ 13-cycle 연속 무변경 = 성숙 아키텍처 신호. 추측성 ENH 거부가 No Guessing 철학에 부합.

---

## 5. 차별화 6/6 streak 갱신

v162 bullet 중 #56293/#57317/#58904 root cause 해결 항목 **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 (P0) | 18 | **19** | CLOSED-not-planned, bkit Diff #3 sequential dispatch 유일 mitigation 유지 |
| #57317 PostToolUse drop | ENH-303 (P1) | 12 | **13** | v162 PostToolUse/plugin-loader 변경 0건, root cause 미해결 |
| #58904 heredoc bypass | ENH-310 (P1) | 8 | **9** | OPEN security, v162 config-write 관련 변경 없음 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | v162 full GitHub release notes 존재 |
| R-2 true semver skip | +0 | v161→v162 연속, triple-present (npm+GitHub tag+CHANGELOG) |
| R-3 hotfix chain | +0 | v162 hotfix 연쇄 징후 없음 |

- **release_drift_score**: stable=2.1.152 / latest=2.1.162 → **drift = 10 패치 (CRITICAL band ≥8)**. stable 채널 사용자는 안전하나, latest 대비 +10 격차 — stable 격상 결정 권고. (prior batch stable 2.1.150 → 2.1.152 전진)

---

## 7. OTEL Monitor

MON-CC-NEW-BG-OTEL-DROP (#64436): v162 OTEL 관련 bullet **0건**. 모니터 **STAYS ACTIVE**, `expectedFix: null` 그대로. (v161 init-race fix는 shutdown-flush drop 모니터와 반대 lifecycle — phase 단위 대조 원칙 유지)

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking / Breaking-equivalent | **0건 / 0건** (soft-breaking 6건 전부 실측 no-op) |
| bkit 소스 변경 필요 | **N** (14-cycle 연속 무수정) |
| Consecutive compatible | **113 → 114** (v2.1.34~v2.1.162) |
| 신규 ENH | **0건** (14-cycle 연속, ENH-329 미소비) |
| 권장 CC 액션 | **v2.1.162 즉시 격상 (ADOPT)** — auto-benefit 4건(보안 2 + robustness 2), Breaking 0. stable(2.1.152) drift +10 advisory |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH-zero streak: 13 → **14**
- Consecutive compatible: 113 → **114**
- Differentiation: #56293=**19**, #57317=**13**, #58904=**9**
- Architecture baseline: 6/6 재측정 일치, 정정 없음
- 마지막 ENH 번호: ENH-328 유지 (ENH-329 미소비)
- 다음 baseline: **v2.1.162** (다음 분석 v2.1.163부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(28 bullets) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (researcher 27 → raw 28, errata 회피)
- [x] raw CHANGELOG + GitHub release tag 이중 fetch
- [x] bullet count cross-verify (양 소스 28 identical)
- [x] ≥3 spot-check (#8/#12/#20) verbatim 확인
- [x] 아키텍처 6/6 직접 재측정 (정정 없음)
- [x] ENH 우선순위 (0건, YAGNI DROP/REJECT 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
