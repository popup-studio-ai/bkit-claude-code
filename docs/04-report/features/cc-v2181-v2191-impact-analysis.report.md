# CC v2.1.181 → v2.1.191 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물세 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 23번째 정식 적용 ✦, 신규 ENH(implement) 0건 **19-cycle 연속**, **136 consecutive compatible milestone ✦**, **6 문서화 버전 present(183/185/186/187/190/191) 93 bullets / v182 R-1 silent publish / v184·188·189 R-2 진성 skip**, **Breaking(changelog) 0건 / CC-level Breaking-equivalent 2건이나 bkit 노출 0건**, auto-benefit 4건, comma-matcher 헤드라인 = **bkit 구조적 면역(pipe 컨벤션)**, 차별화 6/6 streak 갱신(#56293→24 / #57317→18 / #58904→14, **3대 이슈 전부 CC-abandoned: not_planned/duplicate 종료**), monitor 4건 전부 유지(CHOICE-LOOP=#64447 closed-as-dup이나 liveness 미수정 STAYS ACTIVE), Phase 1.5 gh-API base64 authoritative 93 확정, R-1 silent +1(v182) / R-2 skip +3(v184/188/189) / R-3 hotfix #7(v187 2.7s 회귀), MF-1 RECOMMENDED_VERSION 2.1.118 **5-cycle carry-forward**)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (plugin.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst + 메인 세션 직접 측정
> **Date**: 2026-06-26
> **PDCA Cycle**: cc-version-analysis (v2.1.181 → v2.1.191)
> **CC Range**: v2.1.181 (baseline) → **v2.1.191** (npm latest=next=installed=2.1.191, stable=2.1.179, present 7 버전 / R-2 skip 3 버전)
> **Verdict**: **크리티컬 회귀 0건 / Breaking(changelog) 0건 / CC Breaking-equivalent 2건(respondToBashCommands·MAX_RETRIES cap)이나 bkit 노출 0건 / 신규 ENH(implement) 0건 19-cycle 연속 / auto-benefit 4건 / 헤드라인 = comma-matcher 버그(v191) bkit 구조적 면역 / 차별화 6/6 streak 갱신 / 136 consecutive milestone / monitor 4건 전부 유지 / 권장 CC stable v2.1.179 pin / MF-1 5-cycle carry-forward**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (6 문서화 버전 93 bullets — API 파괴/제거형 breaking 0건) |
| **CC-level Breaking-equivalent** | **2건** — (1) v186 `respondToBashCommands` 기본값 변경(HIGH), (2) v186 `CLAUDE_CODE_MAX_RETRIES` 15 cap(MED). **단, bkit attachment surface 노출 0건** (§3.3 실증) → bkit 무영향 |
| **bkit-friendly (auto-benefit)** | **5건** — **[실질 헤드라인] #v183 WebSearch-empty-in-subagents fix(MEDIUM — cc-version-researcher/pm-research 직접 수혜)** / #v191 comma-matcher fix(**bkit 면역 검증**, validation) / #v186 Agent(type) 강제 복원(LOW, #1/#4 보강) / #v186 skill frontmatter case-tolerant + malformed YAML 관용(LOW, robustness) / #v183 auto-mode destructive-git block(LOW, Defense Layer 6 수렴/보강) |
| **Neutral (무영향)** | **나머지 ~85건** — runtime/UX/MCP-retry/startup/subagent-display fix 등. bkit 부착점 0건 |
| **헤드라인 판정 (comma-matcher hook fix, v191)** | **bkit 구조적 면역** — `hooks/hooks.json` 전수 감사 결과 comma-separated matcher **0건**, 다중-tool matcher는 전부 pipe(`\|`) 구분자(`Write\|Edit`, `Bash\|Write\|Edit` 등 6건). v191이 수정한 `"Bash,PowerShell"` silently-never-firing 버그에 bkit은 처음부터 비노출. **convention validation auto-benefit** |
| **신규 ENH(implement) 후보** | **0건 (19-cycle 연속)** — 모든 후보 YAGNI 탈락 |
| 마지막 ENH 번호 | ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 유지(미소비)** |
| **차별화 6/6 streak 갱신** | **#56293 23→24 / #57317 17→18 / #58904 13→14** — 93 bullets 중 3대 이슈 root cause 직접 해결 0건. **3대 이슈 전부 CC-abandoned 전환(not_planned/duplicate)** |
| **⚠️ 신규 신호 (moat 영구화)** | **#58904(heredoc-bypass)가 OPEN → `not_planned` 종료** — 직전 cycle OPEN(security label)에서 CC 미수정 종료. #56293·#57317에 이어 3대 이슈 전부 "CC-abandoned, bkit-covered" 전환. bkit 차별화 가치 **영구화** |
| **메모리 정정** | 없음 — baseline 재측정 일치 (v2.1.22 / agents 40 / skills 44 / lib 190 modules / 22 subdirs / MCP 2) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (136 consecutive milestone 입증) |
| **유지보수 발견 (MF-1, carry-forward)** | ⚠️ `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION = '2.1.118'` — stable 2.1.179 대비 ~61릴리스 stale. **5-cycle 연속 carry-forward**. 분석 전용이라 미수정, 팀 결정 필요(No Guessing) |
| **연속 호환 릴리스** | **136 milestone ✦** (v2.1.34 → v2.1.191, 129 → 136, +7 present — R-2 skip v184/188/189 제외) |
| ADR 0003 적용 | **YES (23번째 정식 적용 ✦)** |
| **권장 CC 버전** | **stable v2.1.179 pin 권고** — 93 bullets는 Breaking 0이나 v186 2건 Breaking-equivalent + runtime churn. bkit 무영향이나 보수적 stable pin 권고. latest 2.1.191 허용 가능(drift +12 CRITICAL advisory) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.181 → v2.1.191 영향 분석 (ADR 0003 23번째 ✦)      │
│  ★ 6 문서화 버전 present (93 bullets) / 큰 범위 cycle     │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 93 bullets (gh-API authoritative)      │
│      183(17)/185(1)/186(33)/187(21)/190(1)/191(20)      │
│      v182 = R-1 silent publish (npm O / changelog X)     │
│      v184/188/189 = npm E404 → R-2 진성 skip (3건)       │
│  🔍 Phase 1.5 게이트: gh-API base64 디코딩 직행          │
│      • model-WebFetch 우회 → count 불일치 0             │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking(changelog): 0건                             │
│  🟡 CC Breaking-equivalent: 2건 — 단 bkit 노출 0건       │
│      • respondToBashCommands 기본값(HIGH) → 미사용       │
│      • MAX_RETRIES 15 cap(MED) → 미설정                  │
│  🟢 auto-benefit 4건 / Neutral ~85건                     │
│  🎯 [헤드라인] comma-matcher hook fix (v191)             │
│      • bkit 구조적 면역 — pipe(|) 컨벤션 전수 확인       │
│  🎯 CHOICE-LOOP(#64447) closed-as-dup이나 liveness 미수정│
│      • STAYS ACTIVE                                      │
│  🆕 신규 ENH(implement): 0건 (19-cycle 연속)            │
│      • ENH-367 예약 유지                                 │
│  📈 차별화: #56293→24 #57317→18 #58904→14               │
│  ⚠️ moat 영구화: 3대 이슈 전부 CC-abandoned             │
│      (#58904 OPEN→not_planned, bkit #6 독점 면역)        │
│  ⚠️ MF-1 carry: RECOMMENDED_VERSION 2.1.118 (5-cycle)   │
│  ✅ 연속 호환: 136 milestone ✦ (v2.1.34~v2.1.191)       │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | `/rewind` clear 이전 복원(v191), 스트리밍 CPU ~37%↓·스크롤 점프 fix(v191), CJK 붙여넣기 mojibake fix(v187), `! bash` 자동 응답(v186, opt-out 가능), MCP OAuth/404/retry 안정화(v191) |
| **개발자(Dev/bkit)** | ⟷ 무영향 | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 19-cycle 연속 무수정. **comma-matcher 버그 면역(pipe 컨벤션) + 2 breaking-equiv 노출 0건**. MF-1만 별도 carry(5-cycle) |
| **보안(Security)** | ⬆ 소폭 개선 | v187 `sandbox.credentials`(credential 파일·secret env 차단), v183 auto-mode destructive-git/IaC block, v186 `Agent(type)` 강제 복원 — 모두 bkit 방어 계층(Diff#1/#2/#4/#6)과 **수렴/보강**. bkit heredoc-bypass(#6/#58904) 독점 면역 유지 |
| **운영(Ops)** | ⬆ 개선 | MCP capability-discovery retry·OAuth headless·404 메시지 개선(v191), remote MCP 5분 hang→abort(v187), worktree leak cleanup(v187), managed settings refresh(v191) |

---

## 2. CC v2.1.181 → v2.1.191 변경사항 (93 bullets, raw gh-API authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh-API 직행 (model-WebFetch 우회)

| Field | Source | 값 | Verdict |
|-------|--------|:---:|:---:|
| 문서화 버전 수 | `gh api contents/CHANGELOG.md \| base64 -d` | **6** (183/185/186/187/190/191) | 확정 |
| total new bullets | 행 단위 열거 | **93** | 확정 |
| v2.1.182 | npm O / changelog X | 존재(미문서) | **R-1 silent publish** |
| v2.1.184 / 188 / 189 | `npm view @...@v` → **E404** | 미발행 | **R-2 진성 skip (3건)** |
| dist-tags | npm | latest=next=2.1.191 / stable=2.1.179 | confirmed |

**버전별 bullet 분포 (heading별)**:

| Version | bullets | Added | Improved | Changed | Removed | Fixed | Reduced |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| v2.1.191 | 20 | 1 | 5 | — | — | 12 | 2 |
| v2.1.190 | 1 | — | — | — | — | — | — (generic "bug fixes") |
| v2.1.187 | 21 | 3 | 3 | — | — | 14+1(VSCode) | — |
| v2.1.186 | 33 | 6 | 4 | 3 | — | 20 | — |
| v2.1.185 | 1 | — | 1 | — | — | — | — |
| v2.1.183 | 17 | 3 | 1 | 1 | 1 | 11 | — |
| **합계** | **93** | 13 | 14 | 4 | 1 | 58+ | 2 |

- **핵심 학습 계승**: model-processed WebFetch의 under/over-count 리스크를 피해 **처음부터 gh-API base64 디코딩 raw 파일을 행 단위로 직접 열거** → count 불일치 0건.
- **spot-check 3건 verbatim**: ① v191 `"Fixed hooks with comma-separated matchers (e.g. \"Bash,PowerShell\") silently never firing"` / ② v186 `"! bash commands now trigger Claude to respond to the output automatically; set \"respondToBashCommands\": false ..."` / ③ v183 `"... destructive git commands (git reset --hard, git checkout -- ., git clean -fd, git stash drop) are now blocked when you didn't ask to discard local work ..."`.

### 2.2 헤드라인 후보 3종 (bkit relevance HIGH)

| # | Version | Bullet (verbatim 요지) | 1차 판정 |
|---|---------|------------------------|----------|
| H1 | v191 | hooks comma-separated matchers(`Bash,PowerShell`) silently never firing fix | **bkit 면역(pipe)** → validation |
| H2 | v186 | `! bash` 자동 응답 default 변경(`respondToBashCommands`) | **CC Breaking-equiv HIGH / bkit 미사용** |
| H3 | v183 | auto-mode destructive-git/IaC blocking | Defense Layer 6 **수렴/보강** |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 재측정 (Numeric Correction Protocol — 메인 세션 직접 측정)

| 항목 | 측정값 | 이전 메모리 | 판정 |
|------|:---:|:---:|:---:|
| bkit version | 2.1.22 | 2.1.22 | 일치 |
| agents | 40 | 40 | 일치 |
| skills (SKILL.md) | 44 | 44 | 일치 |
| lib modules (*.js) | 190 | 190 | 일치 |
| lib subdirs | 22 | 22 | 일치 |
| MCP servers (.mcp.json) | 2 | 2 | 일치 |

→ **재측정 일치. 정정 제안 없음.** (측정 명령: `ls agents/*.md`, `find skills -name SKILL.md`, `find lib -name '*.js'`)

### 3.1 헤드라인 H1 심층 검증 — comma-matcher hook fix (v191)

| 항목 | 내용 |
|------|------|
| **CC bullet (verbatim)** | "Fixed hooks with comma-separated matchers (e.g. `\"Bash,PowerShell\"`) silently never firing" |
| **GitHub 이슈 (리서처)** | 전용 이슈 미표면. 인접 #57137(`if` 필드 matcher 파싱) OPEN. docs가 "comma separator는 v2.1.191+ 필요" 명시. **1:1 매핑 단정 회피**(community context) |
| **bkit 실측 (메인 세션 직접)** | `hooks/hooks.json` 전수 grep → comma-separated matcher **0건**. 다중-tool matcher 6건 전부 pipe: `Write\|Edit`(L19), `auto\|manual`(L112), `Bash\|Write\|Edit`(L190), `project_settings\|skills`(L213), `Write\|Edit\|Bash`(L225), `permission_prompt\|idle_prompt`(L237) |
| **판정** | **bkit 구조적 면역** — v191 버그(comma matcher silently-never-firing)는 bkit hook을 한 번도 침범하지 못함. bkit이 일관되게 pipe(`\|`) 컨벤션을 사용한 결과. **auto-benefit = convention validation**(silent bkit 버그 fix 아님 → HIGH가 아닌 면역 검증) |

### 3.2 헤드라인 H2/H3 — Breaking-equivalent & Defense 수렴

| 항목 | H2 `respondToBashCommands` (v186) | H3 auto-mode destructive-git (v183) |
|------|------|------|
| **성격** | CC Breaking-equivalent (HIGH) — `!` bash 출력에 Claude 자동 응답(기본 true), opt-out `false` | 동작 변경(safety-positive) — auto mode에서 `git reset --hard`/`clean -fd`/`stash drop`/non-agent `commit --amend`/`terraform·pulumi·cdk destroy` 차단 |
| **bkit 노출 실측** | `!` prefix(CC 대화형 affordance) bkit 미사용. 유일 매치 `scripts/release-plugin-tag.sh:67`은 shell 부정 연산자(`! grep`)로 무관 → **노출 0건** | bkit `lib/control/destructive-detector.js` + `lib/defense/layer-6-audit.js`가 이미 trust-scope(L0-L4)·audit(decision-tracer)로 차단 |
| **판정** | **Neutral (bkit 미사용)** — 단 user-UX 노트: 세션 가이드가 사용자에게 `! <command>` 권유 → 사용자 환경에서 자동 응답 발생 가능(bkit 자동화와 무관) | **auto-benefit LOW (수렴/보강)** — CC native가 bkit가 선도한 destructive-block의 subset(auto-mode git/IaC)을 흡수. bkit은 trust-scope + audit + **heredoc-detector.js(#6, #58904 CC 미커버)**로 차별화 유지. **대체 아님** |

### 3.3 bkit-relevant 플래그 독립 검증 (메인 세션 직접 측정)

| Bullet | 검증 (파일/명령) | 결과 |
|--------|-----------|------|
| **v191** comma-matcher fix | `hooks/hooks.json` 전수 (comma 0 / pipe 6) | **auto-benefit(validation)** — §3.1 |
| **v186** respondToBashCommands | `grep -rn '!' hooks/ skills/ agents/ scripts/` | Neutral — bkit `!` prefix 미사용 (§3.2) |
| **v186** MAX_RETRIES 15 cap | `grep -rn CLAUDE_CODE_MAX_RETRIES` → 0건 | Neutral — bkit 미설정 |
| **v186** Agent(type) 강제 복원 | settings*.json 미배포(no-settings-json-defense) | Neutral-positive — bkit는 config 의존 안 함, #1/#4 보강 |
| **v186** skill frontmatter case + malformed YAML | bkit 커스텀 kebab 키(`classification-reason`/`deprecation-risk`/`next-skill`) 유효 | auto-benefit LOW (robustness/defense-in-depth) |
| **v186** agent teams `--effort` 상속 | Diff#4 effort-aware (실험 기능, Agent Teams inactive) | Neutral (현 세션 Agent Teams off) |
| **v186** memory MEMORY.md compact reminder | Diff#1 Memory Enforcer | Neutral-positive (CC native가 bkit memory 규율 보강) |
| **v187** subagent depth 추적(resumed/forked count toward cap) | `lib/*/sub-agent-dispatcher.js` 1-level dispatch | Neutral — bkit 1-level, 5단계 cap 도달 불가 |
| **v183** WebSearch empty in subagents fix | cc-version-researcher/pm-research가 subagent WebSearch 사용 | **auto-benefit MEDIUM — bkit 리서치 에이전트 직접 수혜(실질 헤드라인)**. 본 cycle Phase 1 리서치 신뢰성에도 직결 |
| **v183** thinking.disabled.display 400 on subagent spawns | bkit agent spawn 다용 | auto-benefit LOW — 영향받는 config에서 spawn 안정성↑ |
| **v183** scheduled task/webhook → task notification 분류 | bkit cron/schedule 미배포 | Neutral |
| **v183** user-level skills 중복 autocomplete fix | bkit 44 skills(plugin scope) | auto-benefit LOW — 다중 plugin 사용자 UX↑ |
| **v187** sandbox.credentials / remote MCP idle-timeout / worktree leak | bkit 2 MCP servers | Neutral-positive (Ops 안정성) |

**Hook 스키마 변경: 없음. PreToolUse/PostToolUse/Stop/SubagentStop 이벤트 변경: 없음. Agent/Skill frontmatter 필수 키 변경: 없음.** → contract test 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (19-cycle 연속)**. ENH-367 예약 유지(미소비).

### 4.1 Intent Discovery
- **최대 가치**: comma-matcher 버그(v191) 면역 검증 — bkit의 pipe(`\|`) hook 컨벤션이 CC 회귀를 구조적으로 회피했음을 실증. 더불어 2건 CC Breaking-equivalent에 노출 0건 → 19-cycle 무수정 streak 유지.
- **놓치면 안 되는 critical change**: 없음(Breaking 0, bkit attachment surface 0). 2 Breaking-equivalent는 CC 차원이며 bkit 미노출.
- **workaround 대체 native 기능**: 없음. v183 auto-mode git block이 bkit destructive-detector와 부분 수렴하나 trust-scope·audit·heredoc 미커버 → 대체 아님. 오히려 #58904가 `not_planned` 종료되어 3대 이슈 전부 CC-abandoned → bkit moat 영구화.

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| comma→pipe matcher 마이그레이션 | v191 | **DROP** | bkit 이미 pipe 100%. 작업 대상 0 |
| respondToBashCommands 기본값 대응(pin false) | v186 | **DROP** | bkit `!` prefix 미사용. 노출 0 → No Guessing |
| MAX_RETRIES → RETRY_WATCHDOG 마이그레이션 | v186 | **DROP** | bkit 미설정. 작업 대상 0 |
| Agent(type) deny rule 활용 | v186 | **DROP** | settings.json 미배포 정책 일관 |
| skill frontmatter 정규화 | v186 | **DROP** | 현 frontmatter 유효 로드(44 skills). 불요 |
| 인접 OPEN 이슈 #68417(AskUserQuestion Windows ConPTY) 모니터 추가 | 리서처 | **P3 DEFER (번호 미소비)** | Windows-specific, bkit 영향 미확인. 재발 시 등재 검토 |

→ 19-cycle 연속 무변경 = 성숙 아키텍처 신호. No Guessing 철학 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1, carry-forward) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `const RECOMMENDED_VERSION = '2.1.118';` (5-cycle 변동 없음). 참고: `MIN_VERSION = '2.1.78'`(:34) |
| **문제** | stable 2.1.179 대비 ~61릴리스 stale |
| **본 cycle 조치** | **flag 유지 (미수정)** — 분석 전용 + No Guessing |
| **권고** | 다음 일반 PDCA/하드닝 스프린트에서 team-set floor ≥2.1.170으로 bump. **5-cycle 연속 carry-forward** |

---

## 5. 차별화 6/6 streak 갱신

93 bullets 중 #56293/#57317/#58904 root cause 직접 해결(code fix) **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 이슈 상태 (본 cycle) | 비고 |
|-------|-----|:---:|:---:|------|------|
| #56293 caching 10x | ENH-292 (P0) | 23 | **24** | **CLOSED `not_planned`** | parallel-prefix cache-miss 미수정. sequential dispatch(Diff#3) moat intact |
| #57317 PostToolUse drop | ENH-303 (P1) | 17 | **18** | **CLOSED `not_planned`** | plugin-hook reachability bullet 0건. settings.json 등록 workaround 유효 |
| #58904 heredoc bypass | ENH-310 (P1) | 13 | **14** | **OPEN → CLOSED `not_planned` ✦** | 직전 OPEN(security label) → CC 미수정 종료. heredoc-detector.js(Diff#6) 독점 면역 |

**⚠️ 신규 패턴 — 3대 이슈 전부 CC-abandoned 전환**: 직전 cycle까지 #58904만 OPEN이었으나 본 cycle `not_planned` 종료 → **3대 차별화 이슈 전부 CC가 수정 포기**(#56293·#57317 not_planned, #58904 not_planned, #64447 duplicate). **streak break 아님**("닫힘 ≠ 고침"). Anthropic 미수정 의사 확정 → bkit workaround **가치 영구화**(moat 최대 강화 신호). 향후 streak break 판정은 **code-fix bullet에만** 의존.

surface 3/3 code-active: `lib/*/sub-agent-dispatcher.js` / destructive-detector·layer-6-audit / `lib/defense/heredoc-detector.js`

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | **+1** | **v182** (npm 존재 / changelog 미문서). 본 cycle 1건 |
| R-2 true semver skip | **+3** | **v184/188/189** (npm E404 + changelog 부재). 누적: v134/135/151/155/164/171/177/180 + v184/188/189 = **11건** |
| R-3 hotfix chain | **+1** | **v187 #7** "Remote sessions ~2.7s longer to start after the agent proxy CA system-trust install was added" — version-attributed 회귀 hotfix |

- **release_drift_score (ENH-309)**: stable=2.1.179 / latest=2.1.191 → **drift = 12 패치 (CRITICAL band ≥8)**. 직전 +11 대비 +1. stable 채널 안전.
- **⚠️ Numeric Correction Protocol 적용**: bkit-impact-analyst는 stale 가정(stable=2.1.170 / drift +21 / consecutive ~135)을 보고하며 "authoritative dist-tags 미확보(No Guessing)"를 명시적으로 flag했음. 메인 세션이 `npm view @anthropic-ai/claude-code dist-tags`로 직접 측정 → **stable=2.1.179 / latest=2.1.191 / drift=12 / consecutive=136** 확정. **직접 측정이 우선**(raw wins) → 본 보고서 수치 채택, analyst 추정치 기각. (v2.1.16 errata 학습 절차 정상 작동 사례)
- **CC-abandoned 마이그레이션 신호**: #56293·#57317·#58904 전부 closed-not-planned → "open upstream"에서 "**permanently bkit-owned mitigation**"으로 전환. R-Series tracker에 "CC-abandoned, bkit-covered" 플래그 기록.

---

## 7. Monitor 상태 (4건 전부 유지)

| Monitor | Issue/근거 | v183~191 처리 | 판정 |
|---------|-------|-----------|------|
| MON-CC-NEW-BG-OTEL-DROP | #64436 | 범위 내 OTEL 관련 bullet 0건 | **STAYS ACTIVE** (expectedFix: null) |
| MON-CC-NEW-PLUGIN-HOOK-DROP | #57317 (skill_post) | plugin-hook reachability bullet 0건. 이슈 not_planned 종료(코드 fix 아님) | **STAYS ACTIVE** |
| MON-CC-NEW-CHOICE-LOOP | **#64447 (liveness/무한루프)** registry.js:151-158 | 이슈 **closed-as-duplicate**(orig v2.1.154)이나 liveness 패턴 source-fix 부재 | **STAYS ACTIVE** (closed ≠ fixed) |
| MON-CC-NEW-STOP-SCHEMA-STRICT | ENH-366 (P0) | 범위 내 Stop hook 출력 스키마 변경 0건 | **STAYS RESOLVED** |

신규 모니터 등재: **0건**. #68417(AskUserQuestion Windows ConPTY, OPEN)은 Windows-specific·bkit 영향 미확인 → P3 defer(번호 미소비).

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking(changelog) / CC Breaking-equivalent | **0건 / 2건(bkit 노출 0건)** |
| bkit 소스 변경 필요 | **N** (19-cycle 연속 무수정) — MF-1 별도 유지보수 권고(5-cycle carry-forward) |
| Consecutive compatible | **129 → 136 ✦** (v2.1.34~v2.1.191, +7 present, R-2 skip 11건 제외) |
| 신규 ENH(implement) | **0건** (19-cycle 연속, ENH-367 예약 미소비) |
| 권장 CC 액션 | **stable v2.1.179 pin 권고** (latest 2.1.191 허용 가능, Breaking 0이나 v186 2-Breaking-equiv). drift +12 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1 (5-cycle carry-forward)**: RECOMMENDED_VERSION → ≥2.1.170 bump, 팀이 floor 결정 |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH(implement)-zero streak: 18 → **19**
- Consecutive compatible: 129 → **136 ✦** (+7 present: v182 R-1 + v183/185/186/187/190/191)
- Differentiation: #56293=**24**, #57317=**18**, #58904=**14**
- **신규: 3대 이슈 전부 CC-abandoned 전환** (#58904 OPEN→not_planned 포함) → moat 영구화, streak break 아님
- R-1 silent: +1(v182) / R-2 skip 누적: +3(v184/188/189) → **11건** / R-3 hotfix: #7(v187 2.7s 회귀)
- Architecture baseline: 재측정 일치, 정정 없음 (40/44/190/22/MCP 2)
- 마지막 ENH 번호: ENH-328(CC-cycle) / 전역 ENH-366, ENH-367 예약 미소비
- Monitor: BG-OTEL-DROP / PLUGIN-HOOK-DROP / CHOICE-LOOP(#64447 closed-as-dup이나 liveness 미수정) STAYS ACTIVE, STOP-SCHEMA-STRICT STAYS RESOLVED
- MF-1: RECOMMENDED_VERSION stale **5-cycle carry-forward**
- 다음 baseline: **v2.1.191** (다음 분석 v2.1.192부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(6 버전 93 bullets) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (gh-API base64 디코딩 93 확정, model-WebFetch 우회)
- [x] v182 R-1 silent / v184·188·189 R-2 진성 skip 이중 확인 (npm + changelog)
- [x] ≥3 spot-check (comma-matcher/respondToBashCommands/destructive-git) verbatim 확인
- [x] 헤드라인(comma-matcher) `hooks/hooks.json` 전수 감사 → bkit 면역 판정
- [x] CC Breaking-equivalent 2건 → bkit attachment surface 노출 0건 실증
- [x] 아키텍처 재측정 (정정 없음, 40/44/190/22/MCP 2)
- [x] ENH 우선순위 (implement 0건, DROP/P3 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 차별화 3 streak 갱신 (24/18/14) + 3대 이슈 CC-abandoned 신호 기록
- [x] R-1 silent(v182) / R-2 skip(v184/188/189) / R-3 hotfix(#7) 판정
- [x] Monitor 4건 상태 명시 (CHOICE-LOOP=#64447 STAYS ACTIVE)
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
