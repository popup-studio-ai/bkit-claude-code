# CC v2.1.212 → v2.1.214 영향 분석 및 bkit 대응 보고서 (ADR 0003 서른 번째 정식 적용)

> 작성일: 2026-07-18 · 사이클 #26 · 분석 범위 v2.1.212 · **v2.1.213 (R-1 silent publish)** · v2.1.214
> 방법론: `/bkit:cc-version-analysis` (Phase 0~4 + Phase 1.5 Raw Verification Gate)
> 정본 소스: raw `CHANGELOG.md` (gh raw 바이트, model-WebFetch 우회) — raw-wins

---

## 1. Executive Summary

### 1.1 최종 판정

**호환 (0 Breaking / 0 ENH) — 즉시 흡수 권장.** 설치본 v2.1.212, latest = **v2.1.214**.
범위 95 bullets(214=47, 212=48, **213=changelog-less**) 중 67건(70%)이 Fixed 중심.
bkit 관련 항목은 전부 코드검증으로 **native 수혜 또는 면역**으로 판정됨. 이번 사이클의
헤드라인은 **v214 "hooks exit code 2 + stdout JSON schema 검증 실패 시 미차단" fix**로,
이는 bkit의 prior **STOP-SCHEMA-STRICT(ENH-366)** · **#139 Stop-hook** 우려 영역과 정확히
동일하다. bkit `lib/core/io.js` block/stop 출력 경로가 **전부 schema-valid JSON + exit 0**
(exit 2 아님)임을 코드검증으로 확인 → CC의 신규 차단이 bkit을 새로 막을 수 없음(**면역**).

### 1.2 성과 요약

- **누적 연속 호환: 154 → 157** (v2.1.34 ~ v2.1.214, R-2 skip 제외 / v213은 R-1 zero-change 흡수)
- **신규 ENH streak: 26-cycle 연속 0건** (전역 마지막 ENH-366, ENH-367 예약 유지·미소비, CC-cycle 마지막 ENH-328 — 이번 사이클 미소비)
- **native 수혜 3건** — (b) exit-2 JSON-schema 차단 면역 + (a) permission-analyzer hardening + (c) continue:false halt 신뢰성
- **면역/Neutral 9건** — 전부 grep/Read 코드검증으로 확정 (아키텍처 실측: 34 Agents / 44 Skills / 22 events)

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **안정성(Stability)** | ★★★★★ | **(c) 212 `continue:false` halt가 tool 실패/mid-stream 완료 시 dropped되던 버그 + hook infra 오류를 user rejection으로 오보고하던 문제 fix** → bkit continueOnBlock(#5 차별화) block/halt 시맨틱 native 경화. 다수 background-daemon 소켓/idle 정리 fix로 장기 L4 세션 견고화 |
| **보안(Security)** | ★★★★★ | **(a) 214 Bash permission-analyzer 7건 hardening** (fd-redirect fail-closed·>10k char·zsh subscript·help/man·PowerShell 5.1 bypass) → CC 자체 auto-approve를 조임 → bkit Layer6 `ask`-floor 자세를 **defense-in-depth로 보강**(CC가 덜 승인, 더 승인 안 함). **(d) 212 plan-mode 파일수정 Bash 무프롬프트 실행 fix**도 CC-side 보안 강화 |
| **DX/자동화(Automation)** | ★★★★★ | **(g) 214 subagentStatusLine에 reasoning effort 추가 + 212 transcript가 assistant 메시지별 effort 기록** → bkit effort-aware(#4 차별화)를 CC가 native 렌더 = 무료 보강. 212 subagent/WebSearch cap 200은 bkit sequential-dispatch 범위 밖 |
| **비용/리스크(Cost/Risk)** | ★★★★★ | 0 breaking · 0 코드변경 · 0 ENH. 212 prompt-caching mid-conversation system block이 LLM gateway/custom base URL(Bedrock·Vertex·1P)에서 동작 개선 + web search/fetch 529 재시도로 안정화 |

---

## 2. CC v2.1.212 → v2.1.214 변경사항 (95 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

| 버전 | Total | Added | Fixed | Improved | Changed | 기타(feature) | 정본 행범위 |
|------|-------|-------|-------|----------|---------|---------------|-------------|
| v2.1.214 | **47** | 7 | 35 | 1 | 4 | 0 | L3–L52 |
| **v2.1.213** | **0** | — | — | — | — | — | **섹션 부재 (R-1)** |
| v2.1.212 | **48** | 3 | 28 | 3 | 7 | 7 | L53–L103 |
| **합계** | **95** | 10 | 63 | 4 | 11 | 7 | — |

- **검증 방법**: `curl raw CHANGELOG.md` → 헤더 grep(`^## `) → `awk` per-version prefix 카운트. 카운트 raw 바이트 직행 확정.
- **Breaking heading: 0건**. Errata: 없음 (카운트 직접 측정, agent 미개입).
- **v2.1.213 = R-1 (silent publish)**: npm에 **실제 발행됨**(`registry.npmjs.org/@anthropic-ai/claude-code/2.1.213` tarball 유효), 그러나 CHANGELOG 섹션 없음(214 헤더가 212로 직행). ≥2 소스 확인: raw CHANGELOG 부재 + releasebot 미표기 + npm 아티팩트 존재. **R-2 skip 아님** — zero-change 릴리스로 흡수(214 노트에 folded 추정). dist-tags: `latest=2.1.214`, `stable=2.1.205`, `next=2.1.214`.

### 2.2 bkit 관련 native 수혜 항목 (3건, 전부 코드검증)

| # | 항목 | bkit 매핑 | 판정 | 코드검증 |
|---|------|-----------|------|----------|
| **214-b (헤드라인)** | hooks exit code 2가 stdout JSON schema 검증 실패 시 문서대로 차단 안 되던 버그 → fix | `lib/core/io.js` block/stop 출력 + exit code | **면역 (핵심)** | `outputBlock`(:306)·`outputBlockWithContext`(:334)·`outputStopSurface`(:390) 전부 **schema-valid `{decision:'block',...}` + exit 0**. 실 exit-2 site 2곳(`context-compaction.js:67` valid PreCompact block·`pre-write.js:351` **dead code**, 선행 `outputBlock()`가 이미 exit 0)도 valid JSON. exit-2+malformed 커플링 부재 → CC 신규 차단 무영향. io.js:377–386 주석이 ENH-364/366 계보의 CC-schema-strict 방어 명시 |
| **214-a** | Bash permission-analyzer 7건 hardening (fd-redirect fail-closed·>10,000 char always-prompt·zsh `[[ ]]` subscript·help/man 안전화·PowerShell 5.1 bypass·remote 세션 순서) | Layer6 destructive-detector + PreToolUse ask-floor | **native 수혜** | bkit는 `settings.json` 부재, 방어가 전적으로 hook 기반(`unified-bash-pre` → `lib/control/destructive-detector.js` + PreToolUse `ask`-floor). CC의 fail-closed는 CC 자체 auto-approve만 조임 → bkit `ask` 자세 **보강**(덜 승인) |
| **212-c** | `continue:false` hook의 halt가 tool 실패/mid-stream 완료 시 dropped + hook infra 오류가 user rejection으로 오보고 → fix | continueOnBlock #5 차별화 (PostToolUse) | **native 수혜** | bkit continueOnBlock은 `unified-write-post`·`unified-bash-post`(PostToolUse). CC가 halt를 tool 실패 시에도 신뢰성 있게 처리 + infra 오류 오보고 제거 → bkit block/halt 시맨틱 무료 경화 |

### 2.3 bkit passive 수혜 (native 개선, 워크어라운드 불필요)

1. **214-a** permission fail-closed → bkit Layer6 `ask`-floor defense-in-depth (**#2 차별화 native 보강**)
2. **214-b** exit-2 JSON-schema 차단 → bkit io.js block 경로 valid-JSON+exit0 면역 (prior ENH-366 방어가 CC 진화 선반영)
3. **212-c** continue:false halt 신뢰성 → bkit continueOnBlock(#5) 경화
4. **214-g / 212** subagentStatusLine effort + transcript effort 기록 → bkit effort-aware(#4) native 렌더
5. **212 prompt-caching** mid-conversation system block이 gateway/custom base URL(Bedrock·Vertex·1P)서 동작 → 해당 사용자 caching 정상화
6. **212 web search/fetch** 529·rate-limit bounded backoff 재시도 → pm-research·cc-version-researcher 조사 안정성
7. **212 SendMessage** inter-agent 메시지 body 중복 제거(replayed history/tool result) → Agent-Team 토큰 절감
8. **214** background-daemon 소켓/idle worker 정리 fix 다수 → 장기 L4 auto-run bg dispatch 안정
9. **212 plan-mode** 파일수정 Bash 무프롬프트 실행 fix (d) → CC-side 보안, bkit 상호보완

### 2.4 면역/Neutral 검증 (전부 grep/Read 확정)

| 항목 | 표면 relevance | 판정 | 근거 |
|------|----------------|------|------|
| 214 `dir/**` hook `if:` 조건을 `<cwd>/dir`로 재-scoping (any-depth엔 `**/dir/**` 명시) | hook `if:` 매칭 | **Neutral(수혜)** | bkit `if:` 2건(`Write(skills/**/SKILL.md)`·`Write\|Edit(docs/**/*.md)`)은 cwd-rooted 정확 경로 → 조임이 bkit 실제 레이아웃과 일치, `**/dir/**` 재작성 불요 |
| 214 SessionStart hook source `"fork"` 보고 (resume 대신) | SessionStart 분기 | **면역** | `session-start.js`가 `input.source` 미분기(무관한 `source:'CLAUDE.md'` 태그만) + `once:true` → "fork" 값 inert |
| 214 memory frontmatter ISO `modified` 추가 + inline-`#` 절삭 fix | memory 저장 | **면역** | bkit 런타임 memory는 `.bkit/state/memory.json`(순수 JSON, frontmatter 없음). agent-memory `.md`는 CC-native memory 아닌 별도 시스템 소비 |
| 212 Task tool `mode` 파라미터 deprecated (부모 permission mode 상속) | Task 디스패치 | **면역** | `agents/` frontmatter에 `mode:` 부재. `lib/`의 `mode` hit은 전부 bkit 내부(`advanceMode`·`phaseMode`·trust `mode`), CC Task-param 아님. bkit는 YAML-list `Task(x)` 사용 |
| 212 subagent cap 200 + WebSearch cap 200/session | 멀티에이전트 오케스트레이션 | **Neutral(LOW watch)** | cto-lead ~19 Task 순차 디스패치(#56293 완화, sequential-first), pdca-iterator bounded(match≥90%/exhaustion). 현실 세션 수십 spawn, 200 미도달. `/clear`가 예산 리셋 |
| 212 MCP >2min auto-background | 2 MCP 서버 | **면역** | `bkit-pdca`·`bkit-analysis`는 빠른 로컬 state/analysis, 2분 threshold 미도달 |
| 214 OTel 속성 추가(`message.uuid`·`client_request_id`·`tool_source`) + `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH` | 관측성 | **면역** | bkit는 자체 파일 기반 `token-ledger.ndjson`/caching-cost ledger, OpenTelemetry 의존 없음 → 직교 |

---

## 3. bkit 영향 매트릭스

| 컴포넌트 | 실측 | 변경 필요 | 영향 | 비고 |
|----------|------|-----------|------|------|
| 34 Agents | `ls agents/*.md` | ❌ | native 수혜(effort·model-pin) | 무변경 |
| Layer 6 Defense | destructive-detector.js | ❌ | **native 수혜(214-a)** | permission fail-closed로 `ask`-floor 보강 |
| `lib/core/io.js` block/stop | :306·:334·:390 | ❌ | **면역(214-b 헤드라인)** | valid-JSON+exit0 → exit-2 schema 차단 무영향 |
| 22 Hook Events | hooks.json | ❌ | native 수혜(212-c continue:false) | continueOnBlock 경화, `if:` 조임 정합 |
| 2 MCP Servers | bkit-pdca·bkit-analysis | ❌ | 면역(212 >2min) | 빠른 로컬 op |
| `.bkit/state/memory.json` | JSON | ❌ | 면역(214 frontmatter) | frontmatter 없음 |
| 44 Skills | `ls skills/*/SKILL.md` | ❌ | 면역(Task mode) | 무변경 |
| 195 Lib Modules | — | ❌ | Neutral(OTel 직교) | 자체 ledger |
| 50 Scripts | exit-2 site 2곳 | ❌ | 면역(214-b) | valid JSON, pre-write:351 dead code |

**철학 준수**: Automation First / No Guessing / Docs=Code 전부 유지. 코드변경 0.

---

## 4. Phase 3 브레인스토밍 (Plan Plus) — ENH 도출

### 4.1 Intent Discovery
- **최대 가치**: 214-b(exit-2 JSON-schema fix)가 bkit의 prior STOP-SCHEMA-STRICT/ENH-366 방어를 CC가 진화로 선반영 확인 — bkit이 이미 CC-schema-strict(valid JSON + exit 0)이라 **무료 면역**. 214-a·212-c가 Layer6/continueOnBlock 차별화를 native 보강.
- **놓치면 안 되는 critical**: 없음 (0 breaking).
- **워크어라운드 대체**: 없음. bkit 방어(destructive-detector·continueOnBlock)는 여전히 탐지·차단 소스로 필수(상호보완, 대체 아님).

### 4.2 Alternative Exploration
- **214-g effort statusline**: bkit이 custom statusline으로 effort payload 소비하는 옵션 존재하나 speculative → **YAGNI fail**.
- **214-k CC OTel 소비**: bkit token-ledger를 CC OTel로 이관 옵션 존재하나 OTel-enabled 전제 의존은 bkit 의도적 회피 → **YAGNI fail**.

### 4.3 YAGNI Review
- 도출 후보 전부 native 선결 또는 speculative → 신규 구현 불필요.
- 214-b/a, 212-c는 bkit 기존 로직의 상위 보증을 CC가 흡수 → 추가 bkit 코드 **YAGNI fail**.

### 4.4 우선순위
- **신규 ENH: 0건.** ENH-367 예약 유지(미소비). CC-cycle 마지막 ENH-328 미소비. 26-cycle 연속 0-ENH.
- **유일 maintainer 액션(비-ENH)**: MF-2 — `RECOMMENDED_VERSION` bump (아래 §5).

---

## 5. Carry / Monitor 상태 (사이클 #26 종료 시점)

- **MF-2 OPEN 지속(재격상)**: `lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION = '2.1.198'` — 이제 latest 대비 **16 릴리스 뒤처짐**(v211 시점 13 → 악화). **2.1.214로 bump 권장(maintainer, 미구현)**. `MIN_VERSION='2.1.78'`·`FABLE_MODEL_FLOOR='2.1.170'` 유지 적정. (버전 상수 advancement은 CLAUDE.md versioning 정책상 maintainer 릴리스 결정 → analysis-only HARD-GATE로 미구현.)
- **차별화 streak intact(+3)**: 3대 abandoned 이슈(#56293 sub-agent caching·#57317 PLUGIN-HOOK-DROP·#58904 heredoc bypass) 전부 closed-not-planned 유지, **v212–214 code-fix bullet 미관측**. 214 Bash-parsing hardening은 heredoc-bypass fix가 아닌 **인접**이라 #58904 intact("닫힘 ≠ 고침"). streak +3 릴리스 연장.
- **Monitor 상태**:
  - **BG-OTEL-DROP(#64436) OPEN 유지 + 관측 강화**: 212가 background 세션 표면 확장(background `/fork`, `/resume` picker→bg, `/background` 흐름) → work-phase OTEL log-drop gap을 **좁히기보다 넓힐 가능성** → watch 격상. bkit은 자체 file-ledger라 직접 노출 없으나 CC OTel 사용자 대상 모니터.
  - **CHOICE-LOOP(#64447)**: **closed as duplicate**(코드-fix 아닌 parent 이관) → 여전히 미해결 추적, 상태 변경(ACTIVE→DUP-TRACKED).
  - **STOP-SCHEMA-STRICT(ENH-366)·NOTIFY-BGAGENT RESOLVED 유지**: 214-b가 exit-2 JSON-schema 영역을 CC가 native 강화 → bkit valid-JSON 방어가 선반영으로 확인, RESOLVED 재확증.
- **신규 watch (LOW)**: 212 subagent/WebSearch cap 200 — bkit sequential-dispatch는 현재 200 미도달이나 오케스트레이션 depth 증가 시 ceiling. cto-lead/sprint-orchestrator 확장 시 재평가.
- **hook-matcher 컨벤션 면역 유지**: bkit matcher는 no-comma + no-hyphen + pipe/underscore + cwd-rooted `if:` → matcher-syntax·`dir/**` 재-scoping 회귀 계속 면역.

### Phase 1.5 교훈 재확인
model-WebFetch는 cross-section 복제 환각 위험 → bullet count는 `curl raw CHANGELOG` + 헤더 grep + `awk` per-version prefix로 직행 확정. **raw-wins.** 이번 사이클 researcher가 언급한 `duration_ms` PostToolUse 필드는 model-processed 소스 기반이라 raw 212/214 bullet에 부재 → **채택 보류**(raw 미검증).

---

## 6. Quality Checklist

- [x] 범위 95 bullets 전부 캡처 (214=47 / 213=0 R-1 / 212=48)
- [x] Phase 1.5 raw 검증 (curl raw CHANGELOG + awk prefix count), raw-wins, Errata 0
- [x] v2.1.213 R-1 판정 ≥2 소스 (raw 부재 + releasebot 미표기 + npm 아티팩트 존재)
- [x] native/면역 항목 전부 impact 분류 + 코드검증 (io.js:306/334/390, exit-2 site 2곳, hooks.json `if:`, agents/lib mode grep)
- [x] 아키텍처 실측 34 Agents / 44 Skills / 22 events (메모리 일치, 보정 불요)
- [x] ENH 우선순위 배정 (0건 — YAGNI 통과)
- [x] 철학 준수 검증 (변경 0)
- [x] 파일 영향 매트릭스 완성
- [x] 4-Perspective 가치 표 포함
- [x] 한국어 작성
- [x] MEMORY.md 업데이트 (별도)

---

## 7. 결론

CC v2.1.212–v2.1.214는 **안정화 3-릴리스 묶음(Fixed 70%, 213은 R-1 silent publish)** 으로,
bkit에 대해 **0 breaking · 0 코드변경 · 0 신규 ENH**. 이번 사이클의 헤드라인은 **v214의
"hooks exit code 2 + stdout JSON schema 검증 실패 시 미차단" fix**로, bkit의 prior
**STOP-SCHEMA-STRICT(ENH-366)·#139 Stop-hook** 우려 영역과 정확히 동일하다. bkit
`lib/core/io.js`의 block/stop 출력 경로가 **전부 schema-valid JSON + exit 0**(exit 2 아님)임을
코드검증으로 확인하여, CC의 신규 차단이 bkit을 새로 막을 수 없음(**면역**) — bkit이 이미
CC-schema-strict였던 ENH-366 방어가 CC 진화로 선반영되었음을 재확증한다. 더불어 **214-a
Bash permission-analyzer 7건 hardening**이 bkit Layer6 `ask`-floor를 defense-in-depth로,
**212-c continue:false halt 신뢰성 fix**가 continueOnBlock(#5)을 native 보강한다. 유일한
후속은 비-ENH maintainer 액션인 **MF-2 RECOMMENDED_VERSION → 2.1.214 bump**(16 릴리스
stale)이다. 누적 연속 호환은 **157**(v2.1.34~v2.1.214)로 갱신된다.

> 즉시 흡수 권장 (v2.1.214). bkit 코드/문서/에이전트/훅 변경 불요.
