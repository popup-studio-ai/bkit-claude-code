# CC v2.1.191 → v2.1.196 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물네 번째 정식 적용)

> 분석 일자: 2026-06-30 · 사이클 #20 · baseline v2.1.191 · 설치=latest v2.1.196
> 분석 워크플로우: `/bkit:cc-version-analysis` (Phase 0~4 + Phase 1.5 Raw Verification Gate)

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking(changelog) / CC Breaking-equivalent | **0건 / 3건** (bkit 노출 0건) |
| bkit 소스 변경 필요 | **N** (20-cycle 연속 무수정) |
| Consecutive compatible | 136 → **139 ✦** (v2.1.34~v2.1.196, +3 present[193/195/196], R-2 skip 13건 제외) |
| 신규 ENH(implement) | **0건** (20-cycle 연속, ENH-367 예약 미소비) |
| 권장 CC 액션 | **latest v2.1.196 허용/권장 (bkit dev)** · stable v2.1.185 보수 pin 가능. drift +11 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1 (6-cycle carry-forward)**: RECOMMENDED_VERSION 2.1.118 → ≥2.1.170 bump (팀 결정) |

### 1.2 성과 요약

- **헤드라인**: v2.1.195 *"Hook matchers with hyphenated identifiers ... now exact-match"* → bkit hook matcher 10개 전부 하이픈 0건(underscore/pipe 컨벤션). **bkit 구조적 면역** — 지난 사이클(v191 comma-matcher 면역)의 직접 연속. matcher 시맨틱 2연속 보정에 bkit 무노출.
- **실질 positive 헤드라인**: v2.1.196 background-agent **auto-resume + 세션 신뢰성** 개선 + `claude plugin validate` 로컬플러그인(source ".") 수정 → bkit 멀티에이전트 PDCA/Sprint 워크플로우 + 플러그인 CI 직접 수혜(auto-benefit MEDIUM).
- **3대 차별화 이슈 전부 CC-abandoned 유지**: #56293·#57317·#58904 (191→196 구간 무변동, 전부 closed `not_planned`) → moat 영구화 지속. streak +1.
- **R-2 true skip 2건**(v192/194) — npm E404 + changelog 부재 이중 확정. R-1 silent 0건.
- **Phase 1.5 게이트 정상 작동**: 메인 1차 WebFetch가 60 bullets로 over-count(cross-section 중복 환각)했으나, gh-API raw 바이트 행 단위 열거로 **54 bullets** 확정. raw wins.

### 1.3 4-Perspective 가치 평가

| 관점 | 본 사이클 가치 | 등급 |
|------|----------------|:---:|
| 🛡️ 안정성/호환 | Breaking 0, bkit 무수정 20-cycle, consecutive 139 | **A** |
| 🔒 보안/신뢰경계 | v196 `.mcp.json` 자가승인 차단·bypass 전파 수정과 bkit Defense/trust-scope 정렬, 노출 0 | **A** |
| 🔧 유지보수 | hook matcher 면역 재확인 / MF-1 6-cycle stale carry(조치 권고) | **B+** |
| 🥇 차별화 | 3대 이슈 CC-abandoned 영구화, sequential-dispatch/heredoc/PostToolUse moat intact | **A** |

---

## 2. CC v2.1.191 → v2.1.196 변경사항 (54 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw 바이트 행 단위 (model-WebFetch 우회)

| Field | Source | 값 | Verdict |
|-------|--------|:---:|:---:|
| 발행 버전 수 | `curl raw CHANGELOG.md` 헤더 grep | **3** (193/195/196) | 확정 |
| total new bullets | 행 단위 `- ` 열거 | **54** | 확정 (1차 WebFetch 60 → errata) |
| v2.1.192 / v2.1.194 | changelog 헤더 부재 + npm E404 | 미발행 | **R-2 진성 skip (2건)** |
| R-1 silent publish | npm 발행분 193/195/196 전부 changelog 존재 | 0건 | none |
| dist-tags | `npm view ... dist-tags` | stable=2.1.185 / latest=2.1.196 / next=2.1.197 | confirmed |

**버전별 bullet 분포 (heading/prefix별, raw 직접 열거)**:

| Version | bullets | Added | Security | Fixed | Improved | Other(Reduced/Changed) |
|---------|:---:|:---:|:---:|:---:|:---:|:---:|
| v2.1.196 | 27 | 3 | 1 | 16 | 3 | 4 |
| v2.1.195 | 12 | 1 | — | 8 | 3 | — |
| v2.1.193 | 15 | 6 | — | 5 | 4 | — |
| **합계** | **54** | **10** | **1** | **29** | **10** | **4** |

- **⚠️ 본 사이클 errata (Phase 1.5가 차단)**: 메인 세션 1차 model-WebFetch가 (a) v193의 backgrounding/pinned/phantom/agent-panel **5개 Fixed 불릿을 v195 섹션에 중복 복제**, (b) v196 Improved/Changed를 오분류 → 60 over-count. 동시에 연구 에이전트의 1차 fetch는 **존재하지 않는 `## 2.1.192` 섹션을 196 내용으로 환각**. **두 errata 모두 동일 클래스(WebFetch cross-section 복제)** — gh raw 바이트 행 열거로 양측 모두 54로 수렴. (v2.1.145 errata-learning 절차 2회 연속 정상 작동)
- **spot-check 3건 verbatim**: ① v195 `"Fixed hook matchers with hyphenated identifiers (e.g. \`code-reviewer\`, \`mcp__brave-search\`) accidentally substring-matching — they now exact-match."` / ② v196 `"Security: \`claude mcp list\`/\`get\` no longer spawn \`.mcp.json\` servers that a repo self-approved via a committed \`.claude/settings.json\`; untrusted workspaces show \`⏸ Pending approval\`"` / ③ v193 `"Added \`claude_code.assistant_response\` OpenTelemetry log event ... set \`OTEL_LOG_ASSISTANT_RESPONSES=0\` to keep prompts-only."`

### 2.2 헤드라인 후보 3종 (bkit relevance HIGH)

| # | Version | Bullet (verbatim 요지) | 1차 판정 |
|---|---------|------------------------|----------|
| H1 | v195 | hook matchers 하이픈 식별자 substring → **exact-match** | **bkit 면역(no-hyphen)** → validation |
| H2 | v196 | `.mcp.json` 자가승인 차단 / `--dangerously-skip-permissions` bypass 전파 수정 (Security) | **신뢰경계 정렬 / bkit 노출 0** |
| H3 | v193 | `OTEL_LOG_ASSISTANT_RESPONSES` 기본동작(업그레이드 시 응답본문 로깅) | **CC Breaking-equiv HIGH / bkit 미설정** |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 재측정 (Numeric Correction Protocol — 메인 세션 직접 측정)

| 항목 | 측정값 | 측정 명령 | 판정 |
|------|:---:|------|:---:|
| bkit version | 2.1.23 | `plugin.json` | 일치 |
| agents (*.md) | 40 (canonical 34, deprecated 6 stub 제외) | `ls agents/*.md` | 일치 |
| skills (dir) | 44 | `ls -d skills/*/` | 일치 |
| lib modules (*.js) | 191 | `find lib -name '*.js'` | 측정 |
| hook event types | 9 (PreToolUse/PostToolUse/UserPromptSubmit/SessionStart/SessionEnd/Stop/SubagentStop/Notification/PreCompact) | `hooks.json` | 측정 |
| MCP servers (.mcp.json) | 2 (bkit-pdca, bkit-analysis) | `.mcp.json` | 일치 |

→ **재측정 일치. 정정 제안 없음.**

### 3.1 헤드라인 H1 심층 검증 — hook matcher hyphen exact-match (v195)

| 항목 | 내용 |
|------|------|
| **CC bullet (verbatim)** | "Fixed hook matchers with hyphenated identifiers (e.g. `code-reviewer`, `mcp__brave-search`) accidentally substring-matching — they now exact-match. Use `mcp__brave-search__.*` to match all tools from a hyphenated MCP server." |
| **성격** | hook matcher 시맨틱 변경 — 하이픈 포함 식별자가 substring → exact-match. 기존 substring 의존 matcher는 깨질 수 있음 (CC-level Breaking-equivalent HIGH) |
| **bkit 실측 (메인 직접)** | `hooks/hooks.json` 전수 → matcher 10건 전부 단일/pipe/underscore: `Write\|Edit`(L19), `Bash`(L35/57), `Write`(L47), `Skill`(L67), `auto\|manual`(L112), `Bash\|Write\|Edit`(L190), `project_settings\|skills`(L213), `Write\|Edit\|Bash`(L225), `permission_prompt\|idle_prompt`(L237). **하이픈 식별자 0건** |
| **forward-exposure** | bkit MCP 서버명(`bkit-pdca`/`bkit-analysis`)에 하이픈 존재하나, **어떤 hook도 `mcp__` 도구를 matcher로 참조하지 않음**(`grep mcp__ hooks.json` → 0). 현재·미래 노출 0 |
| **판정** | **bkit 구조적 면역** — v195 버그(하이픈 substring)는 bkit hook을 침범 불가. **auto-benefit = convention validation**. v191 comma-matcher 면역에 이은 **matcher 시맨틱 2연속 무노출**. → 메모리 `hook-matcher-pipe-convention`을 **"no-comma + no-hyphen + pipe/underscore"**로 확장 |

### 3.2 헤드라인 H2/H3 — Security 정렬 & Breaking-equivalent

| 항목 | H2 `.mcp.json` 자가승인 차단 (v196) | H3 `OTEL_LOG_ASSISTANT_RESPONSES` (v193) |
|------|------|------|
| **성격** | Security — committed `.claude/settings.json` 경유 `.mcp.json` 서버 자가승인 차단, untrusted는 `⏸ Pending approval` | CC Breaking-equivalent (HIGH) — 이미 prompt 로깅 중인 OTEL 배포는 업그레이드 시 **응답 본문 로깅 자동 활성** |
| **bkit 노출 실측** | bkit `.claude/settings.json`에 `enabledMcpjsonServers`/`enableAllProjectMcpServers` **키 0건** → bkit는 자가승인한 적 없음. untrusted에서 bkit 2 MCP는 정상적으로 "Pending approval" 표시(기대 동작) | `grep OTEL_LOG_ASSISTANT_RESPONSES lib/ hooks/ skills/ scripts/` → **0건**. bkit는 OTEL 로깅 미설정 |
| **판정** | **Neutral-positive** — bkit Defense/trust-boundary 철학과 정렬. 회귀 0. bonus: `--dangerously-skip-permissions` bypass 전파 수정도 bkit 무사용(trust-scope L0-L4 사용)이라 Neutral | **Neutral** — bkit 미설정으로 노출 0. MON-CC-NEW-BG-OTEL-DROP(#64436)은 *드롭된* 이벤트 추적이며 본 건은 *추가* 이벤트 → 모니터 무관, STAYS ACTIVE |

### 3.3 bkit-relevant 플래그 독립 검증 (메인 세션 직접 측정)

| Bullet | Ver | 검증 | 결과 |
|--------|:---:|------|------|
| hook matcher hyphen exact-match | 195 | `hooks.json` 전수 (hyphen 0 / mcp__ 0) | **auto-benefit(validation)** — §3.1 |
| `.mcp.json` 자가승인 차단 | 196 | `.claude/settings.json` self-approve 키 0 | Neutral-positive (§3.2) |
| `claude plugin validate` 로컬플러그인 수정 | 196 | bkit = 로컬 플러그인(`name:"bkit"`) | **auto-benefit MEDIUM** — bkit CI에서 plugin validate 사용 가능 (P3 기회, §4.2) |
| background session 신뢰성 + worker auto-resume | 196 | bkit 멀티에이전트 spawn 다용(본 워크플로우 포함) | **auto-benefit MEDIUM** — PDCA/Sprint 백그라운드 에이전트 crash-recovery 수혜 |
| phantom "general-purpose (resumed)" subagent fix | 193 | bkit turn/agent backgrounding | auto-benefit MEDIUM — subagent 복제 버그 제거 |
| launch result no "end your response" | 193 | Sequential dispatch (Diff#3/ENH-292) | Neutral-positive — CC native가 launch 후 계속 작동(부분 수렴, 대체 아님: bkit은 cache-miss #56293 회피 목적) |
| streaming idle watchdog default-ON | 196 | bkit 장시간 에이전트 spawn | Neutral-positive (신뢰성↑, MEDIUM Breaking-equiv). 초장시간 에이전트는 `CLAUDE_ENABLE_STREAM_WATCHDOG` 인지 |
| autoMode.classifyAllShell + denial reasons | 193 | bkit destructive-detector / Layer-6 audit | Neutral-positive — denial-to-transcript가 bkit decision-tracer와 수렴(Layer-6 + heredoc-detector가 초과 커버, 대체 아님) |
| external plugins consent / `/plugin` name-mismatch | 195 | bkit `plugin.json name:"bkit"` 일관 | auto-benefit LOW (보안 하드닝/robustness) |
| PowerShell git exit-1 fix | 196 | bkit scripts git 사용(주로 mac dev) | LOW — Windows 사용자 수혜 |
| `/deep-research` verifier 오보고 fix | 196 | bkit deep-research skill + research 에이전트 | auto-benefit LOW |
| `/code-review` ~25% token cut | 196 | CC 내장(bkit 자체 code-review 보유) | LOW informational |
| MCP OAuth invalid_scope / headersHelper 401/403 | 196/193 | bkit 2 MCP는 로컬 node(OAuth 미사용) | Neutral |

**Hook 스키마 변경: 없음(신규 이벤트 0, matcher 시맨틱 변경에 bkit 무노출). Agent/Skill frontmatter 필수 키 변경: 없음.** → **contract test 갱신 불필요.**

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (20-cycle 연속)**. ENH-367 예약 유지(미소비).

### 4.1 Intent Discovery
- **최대 가치**: v195 hook matcher hyphen-exact 변경에 bkit이 **구조적 면역**(no-hyphen 컨벤션). v191 comma-matcher에 이어 matcher 시맨틱 2연속 무노출 → 컨벤션 일관성의 복리(複利) 가치 실증.
- **놓치면 안 되는 critical change**: 없음(Breaking 0, attachment surface 0). 3건 Breaking-equivalent(v193 OTEL / v195 hook-exact / v196 watchdog) 전부 bkit 미노출.
- **workaround 대체 native 기능**: 없음. v193 autoMode.classifyAllShell·denial이 bkit destructive-detector와 부분 수렴하나 trust-scope·Layer-6 audit·heredoc 미커버 → 대체 아님. 3대 이슈 전부 CC-abandoned 유지 → moat 영구화.

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| hook matcher hyphen→exact 마이그레이션 | v195 | **DROP** | bkit 하이픈 matcher 0, mcp__ 참조 0. 작업 대상 0 |
| OTEL_LOG_ASSISTANT_RESPONSES pin | v193 | **DROP** | bkit OTEL 미설정. 노출 0 → No Guessing |
| autoMode.classifyAllShell 통합 | v193 | **DROP** | bkit Layer-6 + heredoc-detector가 이미 초과 커버 |
| streaming watchdog env 명시 | v196 | **DROP** | 기본 ON이 bkit에 안전-positive. 강제 설정 불요 |
| **`claude plugin validate`를 bkit CI에 추가** | v196 | **P3 DEFER** | 로컬플러그인(source ".") 수정으로 이제 동작 가능. **실효 CI 하드닝 기회**이나 분석-전용 사이클 → 차기 일반 PDCA/하드닝 스프린트 후보로 기록(번호 미소비) |

→ 20-cycle 연속 무변경 = 성숙 아키텍처 신호. No Guessing 철학 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1, carry-forward) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `RECOMMENDED_VERSION = '2.1.118'` (6-cycle 변동 없음). `MIN_VERSION = '2.1.78'`(:34) |
| **문제** | stable 2.1.185 대비 ~67릴리스 stale |
| **본 cycle 조치** | **flag 유지 (미수정)** — 분석 전용 + No Guessing |
| **권고** | 다음 일반 PDCA/하드닝 스프린트에서 team-set floor ≥2.1.170으로 bump. **6-cycle 연속 carry-forward** |

---

## 5. 차별화 streak 갱신

54 bullets 중 #56293/#57317/#58904 root cause 직접 해결(code fix) **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 이슈 상태 (본 cycle) | 비고 |
|-------|-----|:---:|:---:|------|------|
| #56293 caching 10x | ENH-292 (P0) | 24 | **25** | CLOSED `not_planned` (upd 06-02) | parallel-prefix cache-miss 미수정. sequential dispatch(Diff#3) moat intact |
| #57317 PostToolUse drop | ENH-303 (P1) | 18 | **19** | CLOSED `not_planned` (upd 06-06) | plugin-hook reachability bullet 0. settings.json workaround 유효 |
| #58904 heredoc bypass | ENH-310 (P1) | 14 | **15** | CLOSED `not_planned` (upd 06-20) | heredoc-detector.js(Diff#6) 독점 면역 |

**3대 이슈 전부 CC-abandoned 유지** — 191→196 구간 4개 이슈 해결 bullet 0건. "닫힘 ≠ 고침" → bkit workaround 가치 영구화. streak break 판정은 **code-fix bullet에만** 의존.

surface 3/3 code-active: `lib/*/sub-agent-dispatcher.js` / destructive-detector·layer-6-audit / `lib/defense/heredoc-detector.js`

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | **0** | npm 발행분(193/195/196) 전부 changelog 존재 |
| R-2 true semver skip | **+2** | **v192/194** (npm E404 + changelog 부재). 누적: 11 + 2 = **13건** |
| R-3 hotfix chain | **0** | 범위 내 version-attributed 회귀 hotfix bullet 부재 |

- **release_drift_score (ENH-309)**: stable=2.1.185 / latest=2.1.196 → **drift = 11 패치 (CRITICAL band ≥8)**. 직전 +12 대비 **-1 개선**. stable 채널 안전(2.1.185).
- **CC-abandoned 마이그레이션 신호**: #56293·#57317·#58904 전부 closed-not-planned 유지 → "permanently bkit-owned mitigation". R-Series tracker "CC-abandoned, bkit-covered" 플래그 지속.

---

## 7. Monitor 상태 (4건)

| Monitor | Issue/근거 | v193~196 처리 | 판정 |
|---------|-------|-----------|------|
| MON-CC-NEW-BG-OTEL-DROP | #64436 | v193 `claude_code.assistant_response`는 *추가* 이벤트(드롭 아님) | **STAYS ACTIVE** (expectedFix: null) |
| MON-CC-NEW-PLUGIN-HOOK-DROP | #57317 (skill_post) | reachability bullet 0. 이슈 not_planned | **STAYS ACTIVE** |
| MON-CC-NEW-CHOICE-LOOP | #64447 (liveness/무한루프) | 이슈 closed-as-duplicate이나 liveness source-fix 부재 | **STAYS ACTIVE** (closed ≠ fixed) |
| MON-CC-NEW-STOP-SCHEMA-STRICT | ENH-366 (P0) | 범위 내 Stop hook 스키마 변경 0 | **STAYS RESOLVED** |

신규 모니터 등재: **0건**.

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking(changelog) / CC Breaking-equivalent | **0건 / 3건(bkit 노출 0건)** |
| bkit 소스 변경 필요 | **N** (20-cycle 연속 무수정) — MF-1 별도 유지보수 권고(6-cycle carry) |
| Consecutive compatible | 136 → **139 ✦** (v2.1.34~v2.1.196, +3 present, R-2 skip 13건 제외) |
| 신규 ENH(implement) | **0건** (20-cycle 연속, ENH-367 예약 미소비) |
| 권장 CC 액션 | **latest v2.1.196 허용/권장(bkit dev)** — Breaking 0, bkit 면역, plugin-validate+bg-resume 직접 수혜. 보수 운영은 stable v2.1.185 pin. drift +11 CRITICAL advisory |
| ⚠️ 유지보수 권고 | **MF-1 (6-cycle carry)**: RECOMMENDED_VERSION → ≥2.1.170 bump, 팀이 floor 결정 |

### 8.1 메모리 갱신 사항
- New-ENH(implement)-zero streak: 19 → **20**
- Consecutive compatible: 136 → **139 ✦** (+3 present: v193/195/196)
- Differentiation: #56293=**25**, #57317=**19**, #58904=**15** (3대 전부 CC-abandoned 유지)
- R-1 silent: 0 / R-2 skip 누적: +2(v192/194) → **13건** / R-3: 0
- dist-tags: stable=2.1.185 / latest=2.1.196 / next=2.1.197, **drift 11**(−1 개선)
- Architecture baseline: 재측정 일치 (40/44/191/MCP 2)
- 마지막 ENH 번호: ENH-328(CC-cycle) / 전역 ENH-366, ENH-367 예약 미소비
- Monitor: BG-OTEL-DROP / PLUGIN-HOOK-DROP / CHOICE-LOOP STAYS ACTIVE, STOP-SCHEMA-STRICT STAYS RESOLVED
- MF-1: RECOMMENDED_VERSION stale **6-cycle carry-forward**
- 메모리 `hook-matcher-pipe-convention` 확장: no-comma + **no-hyphen** + pipe/underscore
- 다음 baseline: **v2.1.196** (다음 분석 v2.1.197부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(3 발행 버전 54 bullets) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 — gh raw 바이트 54 확정, model-WebFetch over-count(60) errata 차단
- [x] v192·194 R-2 진성 skip 이중 확인 (npm E404 + changelog 부재) / R-1 silent 0
- [x] ≥3 spot-check (hook-exact / mcp-self-approve / OTEL-response) verbatim 확인
- [x] 헤드라인(hook hyphen-exact) `hooks/hooks.json` 전수 감사 → bkit 면역 + forward-exposure 0
- [x] CC Breaking-equivalent 3건 → bkit attachment surface 노출 0건 실증
- [x] 아키텍처 재측정 (정정 없음, 40/44/191/MCP 2)
- [x] ENH 우선순위 (implement 0건, DROP/P3 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건, contract test 불요)
- [x] 차별화 3 streak 갱신 (25/19/15) + CC-abandoned 영구화 기록
- [x] R-2 skip(v192/194) / drift 11(−1) 판정
- [x] Monitor 4건 상태 명시
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
