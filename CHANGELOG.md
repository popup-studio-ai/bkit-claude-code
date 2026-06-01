# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.1.22] - Unreleased (branch: `release/v2.1.22-hardening`)

> **Status**: Hardening Release (진행 중) — 6-sprint master plan (`docs/01-plan/features/v2.1.22-hardening.master-plan.md`). 신규 사용자 대면 기능 없음, 품질 경화/정합성 전용. Kahn order S1→S2→S4→S3a→S3b→S5.

### S1 — CC v2.1.159 Response (ENH-324~328)

> 입력 근거: `docs/04-report/features/cc-v2146-v2159-impact-analysis.report.md` (CC v2.1.146→v2.1.159, 13-version batch, ADR 0003 16th cycle).

- **ENH-324 — ENH-317 CANCELLED (MOOT)**: 직전 cycle(v2.1.21 분석)이 CC v2.1.147의 `/simplify` → `/code-review` rename을 Breaking-equivalent로 보고 ENH-317(deferred rename)을 생성했으나, CC가 **v2.1.152**(`/simplify` = `/code-review --fix` alias 재도입)·**v2.1.154**(`/simplify` = cleanup-only review로 독립 복원)에서 **되돌림**. NET: `/simplify`(cleanup) + `/code-review`(bug-hunt + effort) 둘 다 valid. bkit의 `/simplify` 10개 코드 surface(`lib/intent/language.js:147` 등)는 cleanup 의미로 CC v2.1.154와 **정확히 일치** → 변경 불필요. **bkit의 deferred(강행 안 함) 결정이 정당화됨** (v147 시점 rename 강행 시 v154에서 revert 필요했을 것).
- **ENH-325 — 권장 CC 버전 bump 결정**: 균형 권장 v2.1.146 → **v2.1.159** (Opus 4.8 default high-effort = bkit 17 opus agents + ENH-300 effort-aware 정합, v2.1.156 thinking-block API error fix). 보수적 권장 v2.1.123 → **v2.1.150 stable** (drift +36 extreme 완화). *문서 문구 반영은 S5 docs-sync에서 일괄 (drift 재발 방지).*
- **ENH-326 — sessionTitle resume (CC v2.1.152 공식화) 검증 PASS**: CC v2.1.152가 SessionStart `hookSpecificOutput.sessionTitle`을 startup+resume에서 공식 지원. bkit `hooks/session-start.js:301`이 sessionTitle을 무조건 생성(startup-only 가드 없음)·emit → resume 경로 커버 확인. bkit ENH-226의 미문서 의존이 공식 계약으로 격상.
- **ENH-327 — multi-Agent frontmatter (CC v2.1.147 fix) 무영향 확인**: CC v147이 "tools: frontmatter의 inline `Agent(a), Agent(b)` 형식에서 마지막 외 drop" 버그 수정. bkit은 **YAML block-list**(한 줄당 Task() 1개) 형식 사용 → 무영향(inline comma 유일 hit은 `pm-lead.md:45` 본문 산문). cto-lead 38 Task() 등 12 agents 전부 안전. fix는 미래 안전성.
- **ENH-328 — 신규 monitor 2건 등록 + 차별화 streak 갱신**: `lib/cc-regression/registry.js`에 **MON-CC-NEW-CHOICE-LOOP** (P1, #64447 infinite loop awaiting user choice, v154 MCQ behavior 인접) + **MON-CC-NEW-BG-OTEL-DROP** (P2, #64436 background OTEL log drop) 등록 (CC_REGRESSIONS 22→24). 차별화 streak: **#56293→17** (ENH-292) / **#57317→11** (ENH-303) / **#58904→7** (ENH-310) — v147~v159 미해결, v154 `/workflows` parallel spawn이 #56293 caching 10x AMPLIFY → ENH-292 sequential-dispatch moat 강화. **연속 호환 101→112 milestone**.

## [2.1.21] - 2026-05-29 (branch: `release/v2.1.21-issue-response`)

> **Status**: Issue Response Sprint — 2건의 외부 dogfooder open issue를 단일 통합 sprint(`v2121-issue-response`, Trust L4)으로 해소. **#111** (sessionTitle 충돌, reporter @wonuseo 외부 dogfooder #3) + **#113** (Sprint 화면 출력 강제 미흡, reporter @rohwonseok-ops). 코드베이스 file:line 실측 검증 기반(외부 dogfooder 주장 무검증 수용 금지 원칙).
> **Scope**: 8 features (P0×3 #111 / P1×4 + P2×1 #113) · 신규 모듈 2 (`lib/sprint/executive-summary.js`, `scripts/sprint-skill-stop.js`) · 리팩터 8 (session-title-cache / session-title / 4 Stop emitter / unified-stop / advance-phase.usecase / sprint-handler) · 신규/확장 TC 5 파일 (79 신규 TC) · 1 신규 ADR (0012 Sprint Stop Hook Output Enforcement).
> **Sprint planning**: `docs/01-plan/features/v2121-issue-response.master-plan.md` + `docs/00-pm/v2121-issue-response.prd.md` (sprint-master-planner agent 3rd-cycle dogfooding output).
> **Anti-Mission preserved**: session-title 포맷 전면 재설계 안 함 (`[bkit] {action} {feature}` 골격 유지 + tag 부착만) · PDCA executive-summary 와 코드 공유 안 함 (Sprint 별도 shape) · `getActiveSkill()` 근본 수정(skill_post drop #57317) 안 함 (skill_name 우선 의존 우회만) · sprint phase enum/state-machine 불변.

### Issue #111 — Session Title Isolation (Phase B, P0) — extends #77

같은 PROJECT_DIR 의 병렬 세션이 동일 feature/phase 일 때 **동일한 창 제목**(`[bkit] PLAN f1`)을 갖던 v2.1.6~v2.1.20 전 버전 버그를 해소 (잘못된 창에 위험 명령 입력 리스크). #77 v2.1.6 Phase A 는 per-message 덮어쓰기·opt-out·stale TTL 만 해결했고 session 격리는 미완이었음.

- **F1** `lib/core/session-title-cache.js` — PROJECT_DIR 당 단일 flat record → `{ $schemaVersion: 2, sessions: { [sessionId]: {...} } }` map 구조 전환. `session-ctx-fp.js` 검증 패턴 미러 (atomic write + inline GC: stale 7d TTL + LRU cap 200). 레거시 flat record 는 `readCache()` 에서 1회 자동 마이그레이션 (backward-compat). `isSameAsCached` per-session lookup 으로 전환 → 세션 B 가 세션 A record 를 clobber 하던 부작용(ENH-228 phase-change-only dedup 파괴) 제거.
- **F2** `lib/pdca/session-title.js` — sessionId 기반 stable short tag(`·a1b2`, sha256 절단) 를 title 끝에 부착(`[bkit] PLAN f1 ·a1b2`). `{tag}` format 토큰 지원 + 미포함 format 은 자동 append. sessionId 부재 시 tag 생략(backward-compat). `sessionTag()` export.
- **F3** session_id threading — `scripts/{iterator-stop,plan-plus-stop,pdca-skill-stop,gap-detector-stop}.js` 4개 Stop emitter(5개 호출)가 `generateSessionTitle({ ..., sessionId: input.session_id })` 로 세션 식별자 전달 (이전엔 미전달 → tag 미부착).

### Issue #113 — Sprint Output Enforcement (P1/P2) — extends #93

Sprint 의 success/intermediate/status/watch 경로가 raw JSON 만 반환하여 100% LLM narration 에 의존하던 가시성 갭을 해소. PDCA 와 동등한 Stop hook 출력 강제를 Sprint 에 도입.

- **F4** `lib/sprint/executive-summary.js` (신규) — Sprint shape Executive Summary(Mission/Result/matchRate/Cross-Sprint Integration/Invariant/plugin validate). PDCA shape(problem/solution/...)와 **별도** (#113 §D). 순수 모듈(디스크 I/O 없음). `formatStatusScreen()`/`formatFeatureTable()` 로 F8 과 per-feature 표 단일 소스 공유.
- **F5** `scripts/sprint-skill-stop.js` (신규) — Sprint Stop hook. Exec Summary + AskUserQuestion + sessionTitle 출력. **run-export 패턴**(`module.exports = { run }`, cto-stop/team-stop 와 동일) 채택 — bare-require-`{}` 패턴(pdca-skill-stop)은 unified-stop `executeHandler` 의 `require()` 경유 시 no-op 이므로, 실제 dispatch 보장을 위해 run-export 필수. skill_name 우선 의존(#57317 회피).
- **F6** `scripts/unified-stop.js` + **신규 `lib/core/active-skill-marker.js`** — `SKILL_HANDLERS` 에 `'sprint'` 등록 + **cross-process active-skill 마커** dispatch 경로. **실 `claude -p` 검증으로 발견한 결함**: CC 는 Stop payload 에 `skill_name` 미포함(`hasSkillName:false` 실측), `getActiveSkill()` 는 in-memory 라 cross-process 무용 + skill_post #57317 drop → `detectActiveSkill()` 4경로 전멸 → 기존 설계로는 **어떤 skill Stop handler 도 production 에서 미발동**(PDCA 포함). 해결: sprint-handler 가 `.bkit/runtime/active-skill.json` 기록 → unified-stop peek(detectActiveSkill 3.5) → sprint-skill-stop consume(TTL 10분 + consume-once). 실 런타임 `Detection result: activeSkill="sprint"` → `handled:true` 확인.
- **F7** `lib/application/sprint-lifecycle/advance-phase.usecase.js` — SUCCESS path 에 `phaseTransitionSummary` 출력 추가. caller-injected `deps.transitionSummaryBuilder` (#93 failureReporter DI 규율 미러) — usecase 순수성 유지(fs write·lib/sprint import 없음), `scripts/sprint-handler.js handlePhase` 가 wiring.
- **F8** `scripts/sprint-handler.js` — `handleStatus`/`handleWatch` 가 `display` 필드(human-readable per-feature 표 + gates 한 줄 요약)를 결과에 첨부 (#113 §C). raw JSON 은 프로그램 사용을 위해 보존.

### Architecture Decision Records

- **ADR 0012** (신규) — Sprint Stop Hook Output Enforcement: (D1) run-export 패턴(bare-require no-op 회피, 필요조건), (D2) PDCA 와 별도 sprint shape, (D3) usecase 순수성 DI, (D5) **cross-process active-skill 마커**(detectActiveSkill 4경로 전멸 우회 — 충분조건). #93/v2.1.16 + ADR 0011 선례 계승.

### Tests

- `test/unit/session-title.test.js` (확장 +8 TC) — 2-session DISTINCT title / clobber 후 dedup 복원 / legacy migration / sessionId 부재 tag 생략 / sessionTag 결정성.
- `test/unit/sprint-executive-summary.test.js` (신규 28 TC) — sprint shape / PDCA shape 분리 / context override / next actions / feature 표 / formatStatusScreen.
- `test/unit/sprint-skill-stop.test.js` (신규 20 TC) — Exec Summary 출력 / sessionTitle tag / userPrompt / read-only 미출력 / run-export / unified-stop e2e dispatch(TC-U1) / **marker 경로 production dispatch(TC-U2) / 오발동 방지(TC-U3)**.
- `test/unit/active-skill-marker.test.js` (신규 10 TC) — write/read/consume roundtrip / TTL 만료 / 손상 JSON 방어 / consume-once.
- `test/contract/sprint-skill-handler-registration.test.js` (신규 5 TC) — SKILL_HANDLERS sprint 엔트리 + run-export 구조 invariant.
- `test/unit/sprint-lifecycle/advance-phase-transition-summary.test.js` (신규 11 TC) — phaseTransitionSummary DI 계약 + usecase 순수성(fs/lib-sprint import 부재) contract.
- **총 92 신규/확장 TC** (전체 PASS). 실 `claude -p --plugin-dir .` 런타임 dispatch 검증 포함 (static check + 합성 payload 만으로는 dispatch 결함을 놓침 — [[feedback_thorough_qa]]).

### Cross-references

- #111 ⊃ #77 (v2.1.6 Phase A session isolation 미완) · #113 ⊃ #93 (v2.1.16 gate_fail human-readable, success path 미해결).
- **Latent finding (CARRY-#113-1)**: PDCA 계열 skill Stop handler(pdca-skill-stop / gap-detector-stop / iterator-stop / plan-plus-stop)는 (a) bare-require-`{}` no-op + (b) `detectActiveSkill()` 4경로 전멸로 **production 에서 동일하게 미발동**한다(실 `claude -p` 검증). sprint 는 run-export(D1) + active-skill 마커(D5)로 완전 해소했다. PDCA 계열도 동일 패턴(run-export + handler 마커)으로 전환 가능하나, 별도 회귀 검증이 필요하여 v2.1.22+ 로 carry.

## [2.1.20] - 2026-05-26 (branch: `release/v2.1.20-marketplace-recovery`)

> **Status**: Marketplace Recovery + Plugin Manifest Schema Compliance Sprint — 외부 dogfooder 정병진 (@bj) 2026-05-26 bkit v2.1.14 install 실패 (`Validation errors: : Unrecognized key: "displayName"`) incident 가 트리거. cc-version-researcher 88% 신뢰도 결론 (정병진 CC ≤ v2.1.142 추정 — `displayName` 은 v2.1.143+ 공식 schema 정식 키) → 3-layer 대응 (Recovery + Defense + Forward-proofing) + bkit Early Adopter Program 외부 dogfooder #2 entry.
> **Scope**: 14 features (P0×4 / P1×5 / P2×5) · 3 sub-sprints · 3 신규 ENH (321/322/323) · 1 신규 ADR (0011 Plugin Manifest Schema Compliance Policy) · 1 외부 dogfooder #2 (@bj).
> **Sprint planning**: `docs/sprint/v2120-marketplace-recovery/{master-plan,prd,plan,design}.md` (sprint-master-planner agent 2nd-cycle dogfooding output).
> **Anti-Mission preserved**: `displayName` 제거 안 함 (v2.1.143+ UI picker 회귀 차단) · v2.1.142 이하 hard reject 안 함 (advisory only, UX 진입장벽 minimize) · Anthropic docs vs 구현 lenient/strict 모순 (Q1) 자체 해결 안 함 (외부 책임) · bkit-starter plugin 변경 안 함 (displayName 미포함, 영향 0).
> **External dogfooder #2**: @bj (정병진) — joined 2026-05-26 (Lifecycle Stage 1 → Stage 5), entry at `docs/external-dogfooders/bj.md`.

### External Dogfooder Contributions

- **@bj** (정병진) — bkit v2.1.14 install incident (2026-05-26). Drove the entire v2.1.20 sprint via precise error message + cache path + environment metadata sharing. Reproduction scenario absorbed at `test/e2e/external-dogfood/cc-min-version.test.js` (5 TC, Lifecycle Stage 4 Regression Lock achieved). Trust Score `externalDogfoodFeedbackResponseRate` (weight 0.05) accumulated. See `docs/external-dogfooders/bj.md` (Hall of Fame #2).

### 3 Sub-Sprints (Kahn topological)

**Sub-sprint 1 — Recovery (P0×4)** (commit `fb3e1bf`)

- **F1** README.md / README-FULL.md — minimum CC v2.1.143 advisory 1-line, Claude Code badge v2.1.123+ → v2.1.143+, Version badge 2.1.19 → 2.1.20.
- **F2** `.claude-plugin/marketplace.json` — bkit + marketplace version 2.1.19 → 2.1.20, description prefix 'Requires Claude Code v2.1.143+...' (Q4 spec 미확정으로 safe description-text 방식 채택).
- **F3** `docs/sprint/v2120-marketplace-recovery/f3-bj-reply-draft.md` (new) — 정병진 회신 draft (Korean + English fallback). CC `--version` request + workaround + Hall of Fame 등록 검토 + ADR 0011 + sprint progress 안내.
- **F4** `docs/06-guide/cc-compatibility.guide.md` (new, 9 sections) — bkit minimum CC 정합 표 / displayName 출처 / 21-key whitelist / install 실패 사용자 대응 / ADR 0003+0006+0011 관계 / cc-regression R3-321 / SessionStart detection / Open Questions Q1-Q5.

**Sub-sprint 2 — Defense (P1×5, Leaf-first → Orchestrator-last)** (commit `11ec408`)

- **F9** `lib/domain/rules/docs-code-invariants.js` (Leaf SoT, @version 2.1.13 → 2.1.20) — added `EXPECTED_PLUGIN_JSON_KEYS` (21 keys, Object.freeze, Anthropic official schema whitelist) + `diffPluginJsonKeys(actual)` pure function. No FS access (domain purity preserved).
- **F5** `scripts/validate-plugin.js` (ENH-322) — added `--strict` flag. New exit codes: 2 (extra key outside 21-key whitelist) / 3 (SoT import failure). Backward compat preserved. Smoke-tested: bkit plugin.json (9 keys) PASS, extra key fail with Exit 2.
- **F6** `.github/workflows/contract-check.yml` — new step `Release Gate — plugin.json schema validation (21-key whitelist)` positioned after `docs-code-sync`. `continue-on-error: true` for v2.1.20 (1-week advisory), tightens to `false` in v2.1.21+.
- **F7** `scripts/release-plugin-tag.sh` (ADR 0006 § Empirical Validation Gate 회복) — wired `claude plugin validate .` between CI-invariants and tag-conflict-detection (~30-day wire delay closed). `command -v claude` missing → WARN + fallback.
- **F8** `lib/cc-regression/registry.js` (ENH-321) — added entry #22 R3-321 (severity HIGH, since 2.1.45 strict path adoption, expectedFix 2.1.143 official schema recognition, affectedFiles 4). `check-guards.js` PASS 22 guards.

**Sub-sprint 3 — Forward-proofing (P2×5)** (commit `5260e89`)

- **F10** `hooks/startup/session-context.js` (ENH-323, @version 2.1.19 → 2.1.20) — added `detectCCVersion()` (`child_process.execSync` timeout 200ms hard cap, `.bkit/runtime/cc-version.json` cache 1h TTL, 1회/session cap) + `buildCCVersionAdvisoryContext()`. Sets `BKIT_CC_VERSION_ADVISORY=1` + additionalContext warning when CC < v2.1.143. OTEL emit `gen_ai.cc_version_detection_ms`. Opt-out via `BKIT_DISABLE_CC_VERSION_DETECTION=1`.
- **F11** `docs/adr/0011-plugin-manifest-schema-compliance.md` (new, Status: Accepted) — 6 sections: Context (incident + root cause + ADR 0003/0006 위반 회고 + Anti-Mission) / Decision (5-layer policy) / Consequences / Empirical Validation (SC1-SC8 매핑) / History (append-only) / Open Question (Q1 Anthropic). Cross-linked to ADR 0003 + 0006 + 0010 + sprint docs.
- **F12** `test/integration/config-sync.test.js` — CS-015 21-key whitelist 보강. 기존 displayName + name + description + license 요구 유지 (R3 Anti-Mission 강화). 45/45 PASS.
- **F13** `test/e2e/external-dogfood/cc-min-version.test.js` (new, Lifecycle Stage 4 Regression Lock) — 5 TC: v2.1.142 mock → advisory + env set / v2.1.143 mock → no advisory / command-not-found silent skip / timeout >200ms silent skip / `BKIT_DISABLE_CC_VERSION_DETECTION=1` source=skipped. 3x consecutive stable PASS.
- **F14** `docs/external-dogfooders/bj.md` (new) + `_README.md` 명단 갱신 — @bj as external dogfooder #2 (after @pruge #1). DA-4 status updated: N=2 confirmed (first-follower effect validated).

### ENH formal-candidates (v2.1.20 정식 편입 — 3건)

- **ENH-321** R3-321 cc-regression guard (F8) — 차별화 #2 Defense Layer 6 reinforcement
- **ENH-322** validate-plugin.js 21-key whitelist (F5 + F6 + F9) — Convention Restoration (v2.1.19 S2 spirit 계승)
- **ENH-323** SessionStart CC version detection (F10) — runtime advisory forward-proofing

### Added

- `EXPECTED_PLUGIN_JSON_KEYS` SoT + `diffPluginJsonKeys` in `lib/domain/rules/docs-code-invariants.js`
- `--strict` flag in `scripts/validate-plugin.js` (exit codes 2 / 3)
- `Release Gate — plugin.json schema validation (21-key whitelist)` step in `.github/workflows/contract-check.yml`
- `claude plugin validate .` wire in `scripts/release-plugin-tag.sh` (ADR 0006 § Empirical Validation Gate)
- `R3-321` entry in `lib/cc-regression/registry.js` (cc-regression entry #22)
- `detectCCVersion()` + `buildCCVersionAdvisoryContext()` in `hooks/startup/session-context.js`
- `ccVersionAdvisory` section in `bkit.config.json:ui.contextInjection.sections` (default-on)
- ADR 0011 Plugin Manifest Schema Compliance Policy (Status: Accepted)
- `docs/06-guide/cc-compatibility.guide.md` — user-facing self-service guide
- `docs/external-dogfooders/bj.md` — Hall of Fame entry #2

### Changed

- `README.md` / `README-FULL.md` — Claude Code badge v2.1.123+ → v2.1.143+, Version badge 2.1.19 → 2.1.20, minimum CC v2.1.143 advisory 1-line
- `.claude-plugin/plugin.json` — version 2.1.19 → 2.1.20 (displayName unchanged per Anti-Mission)
- `.claude-plugin/marketplace.json` — bkit + marketplace version 2.1.19 → 2.1.20, description prefix advisory
- `bkit.config.json` — version 2.1.19 → 2.1.20, `ui.contextInjection.sections` adds `ccVersionAdvisory`
- `test/integration/config-sync.test.js` CS-015 — diffPluginJsonKeys 21-key whitelist 추가
- `docs/external-dogfooders/_README.md` — @bj entry added under "v2.1.20", DA-4 status N=2 confirmed

### Verification

- **Domain SoT (F9)**: 21 keys frozen, bkit 9 keys 모두 whitelist 내, `diffPluginJsonKeys` extra/null/empty 분기 정상.
- **CLI strict mode (F5)**: bkit Exit 0 (PASS), extra key Exit 2 (FAIL detected: `fooExtra`, `barExtra`), SoT import fail Exit 3, backward compat (`--strict` 없을 시 기존 동작) Exit 0.
- **CI gate (F6)**: YAML 정합 (python3 yaml.safe_load PASS), 새 step `docs-code-sync` 직후 위치 검증.
- **Release gate (F7)**: bash syntax OK, dry-run 진입 (working tree clean 단계 이후 wire 진행 가능).
- **Regression guard (F8)**: `node scripts/check-guards.js` → 22 guards, 0 warnings. semver gating: `getActive('2.1.142')` includes R3-321, `getActive('2.1.143')` excludes.
- **SessionStart hook (F10)**: opt-out source=skipped, version detection isolated per scenario via PATH-shim.
- **Integration test (F12)**: `node test/integration/config-sync.test.js` → 45/45 PASS (CS-015 reinforced).
- **E2E (F13)**: `node test/e2e/external-dogfood/cc-min-version.test.js` → 5/5 PASS, 3x consecutive stable.
- **ADR 0011**: Status Accepted, 6 sections complete, cross-links to ADR 0003 + 0006 + 0010 + sprint docs verified.
- **Hall of Fame (F14)**: `docs/external-dogfooders/bj.md` 5-stage Lifecycle progress documented, _README.md DA-4 status N=2 confirmed.

### Open Questions (5건 — sprint 종결 시점 + 2026-05-26 CO-4 patch amend)

- **Q1** Anthropic docs vs 구현 lenient/strict 모순 — 외부 책임 (bkit 해결 불가)
- **Q2** 정병진 CC 버전 미확정 — F3 회신 대기 (Out-of-scope)
- **Q3** ✅ **partially resolved 2026-05-26 CO-4 patch**: Anthropic CHANGELOG dateless 영구 미공개 (raw GitHub fetch 검증) + Releasebot 2026-05-15 detection proxy. cc-compatibility.guide.md § 2.2/2.2.1 + ADR 0011 § History/Q3 + sprint planning docs 4종 amend.
- **Q4** marketplace.json `requirements.claudeCode` spec — description-text 안전 대체 (현 sprint 진행)
- **Q5** v2.1.142 이하 사용자 비율 — post-release 모니터 (v2.1.21+ 분석)

### Roll-forward markers (v2.1.21+) — 2026-05-26 CO-5 patch amend

- F6 contract-check.yml `continue-on-error` → `false` (1주 advisory only 종료)
- F8 R3-321 telemetry 3-month 분석 → 격하/유지 결정
- F10 ENH-323 SessionStart detection telemetry 3-month 분석 → 격하/유지 결정
- F14 Hall of Fame @bj Stage 3 (Fix Released): **branch ✅ 2026-05-26 CO-5 patch**, GA tag 시점 "main + tag" upgrade ⏳
- F14 Hall of Fame @bj Stage 5 (Public Acknowledge): **5-channel documented ✅ 2026-05-26 CO-5 patch** (bj.md / _README.md / README.md Hall of Fame v2.1.20 section / CHANGELOG attribution / ADR 0011 SC8), GA publish 시 외부 가시성 ↑

## [2.1.19-hotfix.1] - 2026-05-21 (branch: `feature/v2119-hotfix-1-deadcode`)

> **Status**: CI hotfix — `Invocation Contract Check` workflow turned red immediately after v2.1.19 GA merge. The dead-code detector flagged 5 new v2.1.19 modules.
> **Scope**: 4 files (+51 / -4). No feature behavior change — restores CI green, patches detector blind spot, closes one design/runtime wiring gap, and opts the new SQM dashboard section in via `bkit.config.json`.
> **Root cause** (two independent issues coincided):
> 1. `scripts/check-deadcode.js` require regex matched only direct string-literal forms (`require('./foo')`). The new v2.1.19 scripts use `require(path.join(ROOT, '...'))` (S0 measure, S3 docs-sync, S4 feedback refresh), so the detector treated their callees as orphaned.
> 2. `lib/ui/sqm-panel.js` was specified by S5 design (ADR S5-003) to render in the SessionStart dashboard, but the wiring in `hooks/session-start.js` was never landed — a design/runtime gap. `bkit.config.json` `ui.dashboard.sections` also needed `'sqm'` for the new panel to opt in.

### Fixed

- **`scripts/check-deadcode.js`**: split `scanProductionRequires()` into two regexes. `reDirect` keeps the original behavior; `reIndirect` matches `require(<wrapper>(..., '<lib path>', ...))` where `<wrapper>` is any identifier (path.join, path.resolve, require.resolve, etc.) and the captured string literal contains `lib/` or starts with `./`/`../`. This restricts the new pattern to library-shaped references and avoids overmatching arbitrary strings. As a result `external-feedback-tracker`, `markdown-parse`, and `sqm-calculator` are correctly classified as live.
- **`hooks/session-start.js`**: wired `lib/ui/sqm-panel` + `lib/quality/sqm-history` into the SessionStart dashboard. Added `'sqm'` to the default `_uiDashboardSections`. The render block is independent of the `primaryFeature` gate (SQM reflects project-wide quality maturity, not a single feature) and is fail-silent when `.bkit/state/sqm-history.jsonl` is missing. Closes the S5 design/runtime gap and makes `sqm-panel` + `sqm-history` live.
- **`bkit.config.json`**: added `'sqm'` to `ui.dashboard.sections`. Without this, the runtime config (which takes precedence over the hook default) was a 5-section allowlist that excluded `'sqm'`, so the SqmPanel rendered to 0 chars even after wiring.

### Verification

- **`scripts/check-deadcode.js`**: NEW dead **5 → 0**, Live **134 → 139** (exactly the 5 intended modules — set-diff verified against the precise v2.1.19 GA baseline, NEW DEAD 0).
- **Contract suite spot-check** (9 steps) all PASS: domain-purity (18 files) · guards (21 entries) · test-tracking (314 files, 0 untracked) · docs-code-sync (5/5 synced) · integration-runtime (23/23) · l2-smoke (101/101) · bkit-full-system (36/0/0) · contract-test-run vs v2.1.16 L1,L4 (255 assertions).
- **Full QA aggregate** (4,168 TC, 157 test files): 12 FAIL + 6 errors reproduced identically against the HEAD~1 (v2.1.19 GA) baseline → confirmed pre-existing carryover (`ACTION_TYPES` baseline drift, trust-engine score change). **Hotfix introduced 0 new regressions.**
- **SessionStart hook live run** (`CLAUDE_SESSION_ID=fresh node hooks/session-start.js`): JSON contract valid, all 5 dashboard sections including SQM (`64.00 / 100`) render correctly; `additionalContext` 5,482 → 5,741 chars (+259, SQM panel).

## [2.1.19] - 2026-05-21 (branch: `feature/v2119-quality-maturation`)

> **Status**: Quality Maturation Sprint — pruge 가 v2.1.16~v2.1.18 cycle 에서 1.5일 / 10 issues 의 정밀한 결함 cluster (sprint domain) 를 보고. 단일 reactive fix loop 가 아닌 **5 sub-sprint master plan** 으로 sprint domain maturity 를 PDCA core 수준으로 격상. **모든 5 sub-sprint archived** + outer master sprint completion.
> **Scope**: Single PR — `feature/v2119-quality-maturation` (5 sub-sprints: S0 baseline + S1 Foundation + S2 Defense + S3 Polish + S4 Proactive + S5 Measurement). 152 TC across 30 test files PASS.
> **Master plan**: `docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md` (23 sections, CTO redline applied — B-1/B-2/B-3 + M-1~M-5 + Strategic Insight all addressed).
> **Predecessor**: v2.1.18 GA (PR #106, 2026-05-21 06:37Z).
> **Reporter**: @pruge (James Kim) — `dandi-village-ledger` project. **Real User Hall of Fame** 첫 entry 등재.

### Closes GitHub Issues

- **#103** failure-reporter mark/move resolved gate-fail reports (S3 F3-1)
- **#104** sprint init auto-import context (WHY/WHO/RISK/SUCCESS/SCOPE) from master-plan or PRD (S3 F3-2)
- **#105** generateReport include qualityGates section + unify KPI source (S3 F3-3+F3-4)
- **#107** SKILL.md path mismatch (S2 F2-1)

### 5 Sub-Sprints (Kahn topological)

**S0 — v2.1.18 baseline SQM Measurement** (commit `8cdd0d9`, 14 files, +3,289 LOC, 30 TC)
- Master plan §23 step 0 precondition (CTO M-3 response)
- `lib/quality/sqm-calculator.js` (6 component pure functions + computeSqm aggregator)
- `scripts/_v2119-s0-measure.js` (Infrastructure layer)
- Baseline SQM = 59.75 (later regenerated to 64.00 in S5)
- 3 critical findings discovered → S2/S3/S4 evidence

**S1 — Foundation: Self-Dogfooding Enablement** (commit `79bec02`, 16 files, +3,512 LOC, 28 TC)
- F1-1 sprint-orchestrator Task dispatch verification (contract + e2e mocked)
- F1-2 `/sprint dogfood <release-version>` action — bkit self-dogfood mode
- F1-3 `scripts/check-self-dogfood.sh` CI gate + Node helper (bash 3 compat)
- F1-4 sprint init default L3 → L2 + L1 explicit warning + audit
- F1-5 `/sprint annotate` archived-state annotation (closed enum, anti-mission preserved)
- §19.5 Bootstrap Exception 모드 정착 — 4번째 successful instantiation 후 pattern 확립

**S2 — Defense: Convention Restoration** (commit `598a5b1`, 33 files combined with S4, 35 TC)
- F2-1 sprint SKILL.md bkit-root convention 명시 (closes #107)
- F2-2 `scripts/check-skills-docs-code-sync.js` — 44 skills × Docs=Code CI invariant
- ★ **Critical evolution**: stripCodeBlocks (code-block-aware parsing) — S0 measurement bug fixed (phase-3-mockup + phase-9-deployment false positives 진단 + 정정)
- F2-3 sprint skill full audit
- F2-4 `test/contract/baseline/skills-convention.json` frozen baseline
- F2-5 `scripts/lint-skill-md.js` PreToolUse hook (warning-only, R-3 mitigation)

**S4 — Proactive: External Dogfooder Lifecycle** (commit `598a5b1` combined with S2, 14 TC)
- F4-1 Trust Score 7-Component 확장 (externalDogfoodFeedbackResponseRate weight 0.05, Δ ≤5% R-10 verified)
- F4-2 `lib/control/external-feedback-tracker.js` (GitHub API + pure compute split)
- F4-3 Real User Hall of Fame (README + `docs/external-dogfooders/` + marketplace narrative + DA-1~DA-3)
- F4-4 pruge dandi 5 scenarios E2E regression test (`test/e2e/external-dogfood/dandi-*.test.js`)
- ★ **ENH-318 정식 편입**: bkit 차별화 6/6 → **7/7** + Hall of Fame 첫 entry @pruge

**S3 — Polish: Sprint Report Maturity** (commit `b30e1b9`, 20 files, +1,668 LOC, 40 TC)
- F3-1 failure-reporter resolution marker (A+C combined: file header + state field, atomic write, idempotent) — closes #103
- F3-2 `lib/application/sprint-lifecycle/context-importer.js` (master-plan/PRD fallback chain) — closes #104
- F3-3 generateReport `## Quality Gates` section + qualityGates > featureMap > kpi SoT precedence + divergence detection — closes #105 (main)
- F3-4 `lib/application/sprint-lifecycle/kpi-resolver.js` (pure precedence chain)
- F3-5 carry items rich rationale (featureMap.scope + details aggregated)
- F3-6 lessons learned multi-aspect (iteration / autoPause / phase_duration / gate_measurement / gate_failure_resolution)
- ★ **CO-S2-1 absorbed**: `lib/util/markdown-parse.js` 신설 (stripCodeBlocks single SoT)
- ★ **CO-S2-3 absorbed**: master plan §7.2 inline note 정정 (1 actual + 2 false positives)

**S5 — Measurement: Sprint Maturity Index** (commit `63931d5`, 10 files, +654 LOC, 5 TC)
- F5-1 sqm-calculator evolve + `findFirstMatching` pattern fix (★ **CO-S0-5 bug discovered + fixed** — present since S0, missed for 5 sub-sprints)
- F5-2 `lib/ui/sqm-panel.js` SessionStart-ready dashboard
- F5-3 `lib/quality/sqm-history.js` append-only JSONL
- ★ **Baseline regenerated**: 59.75 → **64.00** (S0 + S2 + S5 cumulative accuracy fix)

### 9 GitHub Issues Closed Across v2.1.17 → v2.1.19 (pruge ecosystem)

v2.1.17: #92/#93/#94/#95. v2.1.18: #100/#101/#102. **v2.1.19: #103/#104/#105/#107**.

Total: 10 issues, 100% closed within 24h (S4 F4-2 externalDogfoodFeedbackResponseRate baseline = 100%).

### Architecture (raw 실측)

| Component | v2.1.18 | v2.1.19 |
|-----------|---------|---------|
| Skills | 44 | 44 |
| Agents (Active) | 34 | 34 |
| Lib Modules | 174 | **184+** (new: util/markdown-parse + 4 in application/sprint-lifecycle + control/external-feedback-tracker + quality/sqm-* + ui/sqm-panel) |
| Scripts | 54 | **56** (new: check-skills-docs-code-sync + lint-skill-md + _v2119-s4-feedback-refresh + _check-self-dogfood-helper + check-self-dogfood.sh) |
| Hook Events | 21 | 21 (PreToolUse SKILL.md linter entry 추가) |
| MCP Tools | 19 | 19 |
| ACTION_TYPES | 30 (post v2.1.18) | **39** (+9: sqm_baseline_measured + sprint_dogfood_started + sprint_bootstrap_mode_activated + sprint_trust_warning + sprint_annotated + self_dogfood_emergency_override + external_feedback_tracked + gate_fail_resolved + sprint_context_imported + sprint_kpi_divergence) |
| Test count | 3,774 (v2.1.18) | **3,926+** (+152 v2.1.19) |
| Trust Score | 6 components (sum 1.0) | **7 components** (sum 1.0, externalDogfoodFeedbackResponseRate 0.05) |
| Differentiation | 6/6 | **7/7** (ENH-318) |

### v2.1.18 Baseline SQM Final (regenerated by S5)

| Component | Weight | Value | Weighted |
|-----------|--------|-------|----------|
| docsCodeSyncRate | 0.30 | **100** (44/44) | 30.00 |
| sprintSelfDogfoodRunRate | 0.20 | 10 (v2.1.16 partial) | 2.00 |
| externalDogfooderFeedbackResponseRate | 0.20 | 100 (7/7 closed within 24h) | 20.00 |
| sprintReportKpiConsistency | 0.15 | 80 | 12.00 |
| subAgentDispatchSuccessRate | 0.10 | null | 0.00 |
| conventionContractTestPassRate | 0.05 | 0 | 0.00 |
| **Total** | 1.00 | | **64.00** |

### v2.1.19 GA Projected SQM (after this release archives)

64.00 + ~32 = **~96** (well above master plan §7.2 target ≥85):
- sprintSelfDogfoodRunRate 10 → 100 (v2.1.19 itself = sprint container per Bootstrap Exception)
- subAgentDispatchSuccessRate null → ~95 (S1 sprint-orchestrator live)
- conventionContractTestPassRate 0 → ~99 (S2 F2-4 baseline contract live)

### Bootstrap Exception 모드 — pattern fully validated

5 sub-sprints all archived under PDCA-with-sprint-shadow (main session manual proxy for sub-agent dispatch). v2.1.20 will be **first true self-dogfood CI gate activation** — `scripts/check-self-dogfood.sh` (without `--bootstrap-mode` flag) will hard-fail when not-sprint releases attempt to tag.

### Real User Hall of Fame — 첫 entry @pruge

`docs/external-dogfooders/pruge.md` (120 라인 archive: 10 issues × evidence + 5 absorbed scenarios + contribution quality criteria). README + marketplace narrative + bkit Early Adopter Program CTA. DA-4 (30-day dogfooder population review) carry to v2.1.20+.

### Differentiation 7/7

- ENH-286 Memory Enforcer
- ENH-289 Defense Layer 6 (strengthened — 9 new ACTION_TYPES naturally joined L6 pipeline)
- ENH-292 Sequential Dispatch (declared → **live** in this release via S1 F1-1)
- ENH-300 Effort-aware Adaptive Defense
- ENH-303 PostToolUse continueOnBlock
- ENH-310 Heredoc Detector
- **ENH-318 External Dogfooder Feedback Trust Integration** (NEW v2.1.19 — Trust Score 7th component + Hall of Fame + User-Feedback Lifecycle)

### Compatibility

- bkit v2.1.18 → **v2.1.19 GA** (bkit.config.json + plugin.json + marketplace.json ×2 + README + hooks ×3 all synced)
- Backward compat: 100% — Trust Score normalization preserves Δ ≤5% (R-10 mitigation), legacy 6-component trust-profile.json auto-migrated via loadTrustProfile merge fix
- ADR 0003: maintained — sprint state schema additive only (annotations: [] + lastGateFailure.resolved* fields, all optional)

### Carry-overs to v2.1.20+

- CO-S3-1 `/sprint status` to use kpi-resolver (consistent SoT)
- CO-S3-2 PRD template Context Anchor section addition
- CO-S3-3 divergenceLogger default emitter (audit)
- CO-S2-4 hooks.json `if:` schema verify in CC v2.1.85+
- DA-4 30-day dogfooder population review
- CO-B Trust weight recalibration (after 30-day data)
- CO-C Hall of Fame i18n (KO/JA/ZH)
- CO-S1-1 ~ CO-S1-7 (S1 advanced features carry list)
- CO-S4-1 external-feedback-tracker CI gate integration

### Methodology — Bootstrap Exception 5번째 successful instantiation

S0 + S1 + S4 + S2 + S3 + S5 모두 PDCA-with-sprint-shadow 으로 완주. Master plan §19.5 의 Bootstrap Exception 패턴이 *transitional protocol* 로 정착 — v2.1.20 부터 first true self-dogfood activation.

## [2.1.18] - 2026-05-21 (branch: `feature/v2118-issue-fixes`)

> **Status**: Sprint Trust UX Fix — bkit v2.1.16에서 보고된 3 GitHub Issues (#100/#101/#102, 모두 @pruge 보고 2026-05-21 03:54)를 단일 sprint로 통합 처리. L1 sprint lockout 3-stage trap 영구 해소.
> **Scope**: Single PR — `feature/v2118-issue-fixes` (3 features hard-link: F1 chicken-and-egg unblocker + F2 trust mutation + F3 normalize unification + F4 sprint-master-planner CTO/QA expansion).
> **Reporter Scenario**: @pruge dandi-village-ledger `s1-foundation` sprint — L1 init 후 P0 32/32 완료 시점에 trust escalation 불가, measure 항상 preview mode, sprint-orchestrator dispatch 실패. v2.1.18에서 8-step E2E test로 1:1 재현 후 fix evidence 확인.
> **Methodology**: PM Team (pm-lead 4-agent orchestration → PRD Beachhead 19/20) + CTO Team (cto-lead architectural review APPROVE with CONCERNS, BLOCKER 3건 메인 세션 재측정 채택) + QA Team (qa-lead L1-L5 통합 검증) — 사용자 요청 "PM/CTO/QA 모두 활용 완성도 높게" 응답.
> **Test**: **40 TC live PASS** (17 contract + 15 unit + 8 e2e), 목표 14 TC 대비 2.86× 초과 달성.

### Fixed (Bug Fixes — GitHub Issues closure)

#### #100 — sprint-orchestrator + 3 sprint-* agents missing `Task` tool (F1)
- `agents/sprint-orchestrator.md` frontmatter `tools:` field 명시 — Task allowlist 7개 (gap-detector, code-analyzer, sprint-qa-flow, sprint-report-writer, qa-monitor, pdca-iterator, Explore) + 6 base tools
- `agents/sprint-master-planner.md` `tools:` field 명시 — Task allowlist 7개 (✦ user-requested expansion: pm-lead, cto-lead, qa-lead 3 orchestrators + product-manager, frontend-architect, enterprise-expert 3 specialists + Explore)
- `agents/sprint-qa-flow.md` `tools:` field 명시 — Task allowlist 2개 (qa-monitor, gap-detector) + 6 base
- `agents/sprint-report-writer.md` `tools:` field 명시 — Task 불필요 (report aggregation only), 5 base tools
- **차별화 #3 ENH-292 Sequential Dispatch 활성화**: 이전에는 sprint-orchestrator가 Task tool 부재로 `measure-router.js:233-253` `agentTaskRunner` 호출 시 `no_agent_runner` 반환했으나, v2.1.18부터 정상 sub-agent dispatch 가능 — "선언 → 실작동" 승격 첫 release

#### #101 — `/sprint trust` mutation 명령 신설 + audit (F2)
- `scripts/sprint-handler.js`: `handleTrust(args, infra, deps)` 함수 신설 (signature `{ id, to, reason?, force?, actor? }`) + `case 'trust'` dispatch + `VALID_ACTIONS` 17 → **18 actions**
- helpers: `LEVEL_RANK` / `isDowngrade(from, to)` / `severity(from, to)` / `loadTrustScore(deps)` / `resolveActor(args)`
- `lib/audit/audit-logger.js`: `ACTION_TYPES` **29 → 30** (`sprint_trust_changed` entry + details schema documented inline)
- Downgrade guardrail: major downgrade (≥2 levels) requires `trustScore >= 80` (from `.bkit/state/trust-profile.json` `trustScore` field, 6-component weighted sum) OR `--force` flag
- Idempotent path (`from === to`): emits audit with `noop: true` field (monitoring blind-spot prevention)
- Actor auto-detection: explicit `args.actor` > `process.env.CLAUDE_AGENT_ID → 'agent'` > default `'user'` (spoofing mitigation)
- `--force` flag: triggers `blastRadius: 'high'` for Defense Layer 6 alarm (ENH-289 natural integration)
- `skills/sprint/SKILL.md` §10.1.3 "Trust Level Mutation" 신규 섹션 (comparison table, audit JSON example, downgrade guardrail explanation)
- `commands/bkit.md` `/sprint trust` help line 추가

#### #102 — `--trust` CLI alias silently ignored at measure/phase paths (F3)
- `scripts/sprint-handler.js:942-948` (`handleMeasure`) + `974-979` (`runPhaseGates`): `args.trustLevel` direct check → `normalizeTrustLevel(args)` 통일. `normalizeTrustLevel` 자체는 이미 precedence chain `trustLevel > trust > trustLevelAtStart` 구현 (line 68-74), 그러나 두 경로가 함수 호출 우회로 silent ignore 발생
- Skill docs §10.2 (Trust Level Acceptance)의 declared behavior와 코드 일치 — Docs=Code 90% 매치율 유지

### Added — Tests (40 TC, 목표 14 TC 대비 2.86× 초과 달성)

- `test/contract/sprint-agents-tools.test.js` (17 TC) — F1 4 sprint-* agents `tools:` field invariant
- `test/unit/sprint-trust-normalization.test.js` (7 cases A-G) — F3 normalizeTrustLevel precedence chain
- `test/unit/sprint-handler-trust-action.test.js` (8 cases) — F2 handleTrust mutation/guardrail/audit/actor coverage
- `test/e2e/sprint-l1-lockout-recovery.test.js` (8 steps) — @pruge reporter scenario 1:1 reproduction (init L1 → trust L1→L3 → measure record → audit verify → process restart persistence)

### Added — Self-Referential Meta Risk Mitigation

- **Chicken-and-egg 회피 패턴 확립**: 본 sprint 자체가 sprint-orchestrator Task tool fix 대상이므로 sprint container의 자동 orchestration 사용 불가. Plan §6.1 noteline으로 명시 — `sprint init`은 state tracking 용도, phase advance + measurement는 PDCA cycle (메인 세션 + pm-lead/cto-lead/qa-lead manual dispatch)로 진행. F1 적용 직후 sprint-orchestrator 정상화 → 차후 sprint부터 자동 orchestration 정상 작동

### Methodology — PM/CTO/QA Team 통합 활용 첫 실증 sprint

- **PM Team** (pm-lead orchestrate 4 agents): PRD 생성 — Beachhead Geoffrey Moore 19/20 (Burning Pain 5 / WTP 5 / Winnable 5 / Referral 4) + JTBD 6-Part + 5 User Stories + 6 Test Scenarios + Pre-mortem Top 3 + Negative-Reputation Loop Block narrative
- **CTO Team** (cto-lead): Architectural Review APPROVE with CONCERNS — BLOCKER 3건 (controlScore→trustScore 정정 / ACTION_TYPES count 27→29 정정 / NDJSON injection 평가) + MEDIUM 3건 (no-op audit noop:true / actor spoofing mitigation / sub-agent-dispatcher state transition test) 모두 redline 반영. 메인 세션 Numeric Correction Protocol 준수: ACTION_TYPES 실측 29 (CTO 27 grep 한계 정정), trustScore 모델 실존 (`.bkit/state/trust-profile.json`)
- **QA Team** (qa-lead): L1-L5 layer 통합 검증 보고서 + 보고자 시나리오 evidence

### Differentiation 6/6 Strengthening

- ENH-286 Memory Enforcer — 무영향 (trust mutation CLAUDE.md 의존 없음)
- ENH-289 Defense Layer 6 — **강화** (sprint_trust_changed audit이 Layer 6 pipeline에 자연 합류, 라이브 입증: `.bkit/audit/2026-05-21.jsonl`에 `layer_6_audit_completed` + `layer_6_alarm_triggered` 동시 emit)
- ENH-292 Sequential Dispatch — **활성화 milestone** (F1 fix로 sprint-orchestrator Task tool 정상 작동, "선언 → 실작동" 승격 첫 release)
- ENH-300 Effort-aware Adaptive Defense — 직교 무영향 (effort.level과 trust 별개 축)
- ENH-303 PostToolUse continueOnBlock — 무영향
- ENH-310 Heredoc Detector — 무영향 (본 sprint commit 시 heredoc 미사용)

### Compatibility

- **bkit v2.1.18 GA** (bkit.config.json + .claude-plugin/plugin.json 동시 갱신)
- Backward compat 100%: 기존 `--trustLevel L<N>` 사용자 precedence 보존 (F3 Case G test), 기존 sprint state schema 무변경
- ADR 0003 14/14 PASS 유지 (15-cycle → **16-cycle consistency milestone**)

### Documentation

- `docs/00-pm/features/v2118-sprint-trust-ux-fix.prd.md` (PM Team, ~570 lines)
- `docs/01-plan/features/v2118-sprint-trust-ux-fix.plan.md` (CTO redline 5건 반영)
- `docs/02-design/features/v2118-sprint-trust-ux-fix.design.md` (CTO redline 10건 반영, 778+ lines)
- `docs/05-qa/v2118-sprint-trust-ux-fix.qa-report.md` (QA Team)
- `docs/04-report/features/v2118-sprint-trust-ux-fix.report.md` (Sprint completion)
- `skills/sprint/SKILL.md` §10.1.3 신규 섹션
- `commands/bkit.md` `/sprint trust` help

### Closed Issues

- Closes #100 (sprint-orchestrator missing Task tool — v2.1.16 reporter @pruge)
- Closes #101 (L1 sprint trust mutation command missing — v2.1.16 reporter @pruge)
- Closes #102 (CLI parser --trust silently ignored — v2.1.16 reporter @pruge)

---

## [2.1.17] - 2026-05-20 (branch: `feature/v2117-final`)

> **Status**: CI/CD Hardening — 5/12 ~ 5/20 8-day red contract class 영구 종결. **5축 매트릭스 5/5 close** (Detection, Enforcement, Recovery, Governance, Evolution).
> **Scope**: 2 PR merge — PR #97 (v2117 main scope) + PR #99 (v2117 final + 5 carryover absorbed).
> **Origin**: commit `967cd8f` (refactor v2.1.13, 2026-05-12)에서 6 `pdca-eval-*` agent 제거 → 8일 누적 contract red. v2.1.15, v2.1.16 GA가 red 상태로 release 진행. 본 v2.1.17 release로 사고 클래스 모든 잔여 결함 해소.

### Added — 5축 매트릭스 close

#### Detection (검출)
- **Dual baseline**: v2.1.9 LTS (long-term drift) + v2.1.16 Latest (noise floor) 동시 비교
- **L2 mandatory**: `test/contract/l2-smoke.test.js` (98 TC) + `l2-hook-attribution.test.js` (13 TC) workflow 통합
- **L3 mandatory**: `l3-mcp-compat.test.js` (92 TC) + `l3-mcp-runtime.test.js` (48 TC) workflow 통합
- **L5 mandatory**: `invocation-inventory.test.js` `continue-on-error: true` 제거 + `needs: contract-l1-l4` (203 TC → 210 TC with SoT-driven lists)
- **MCP deprecation schema**: `// @deprecated since vX.X.X replacedBy=Y` 인라인 주석 파싱 (`parseMCPToolBlocks`)
- **`scripts/check-test-tracking.js`**: 18 production test 경로의 untracked `*.test.js` 검출 (CO-7)

#### Enforcement (강제)
- **`scripts/setup-branch-protection.sh`**: idempotent `gh api` wrapper (dry-run default + `--apply`). main 브랜치에 자동 적용됨 — Required Status Check 2개 (`Contract Test (L1 Frontmatter + L4 Deprecation)`, `Contract Test L5 (Invocation Inventory)`), `allow_force_pushes: false`, `allow_deletions: false`, `strict: true`.
- **`docs/06-guide/branch-protection-setup.guide.md`**: admin SOP

#### Recovery (복구)
- **`docs/06-guide/contract-baseline-rollforward.guide.md`**: LTS vs Latest 정책, 의사결정 트리, 캡처 절차, deprecation stub 작성, PR self-review 체크리스트, 사고 기록 (8 section)
- **`docs/06-guide/test-file-tracking-policy.guide.md`**: `.gitignore` policy + PR checklist + 사고 기록 (9 section)

#### Governance (거버넌스)
- **Agent deprecation governance**: `agents/<name>.md` frontmatter에 `deprecatedIn: vX.X.X` 명시 시 L4 우회 — Skill 패턴 대칭 적용
- **6 `pdca-eval-*` deprecation tombstones**: `agents/pdca-eval-{act,check,design,do,plan,pm}.md` — `deprecatedReason`, `replacedBy`, `deprecationCommit: 967cd8f` 명시
- **MCP tool deprecation governance**: baseline JSON `deprecatedIn` 필드 기반 L4 우회 (`contract-test-run.js` Skill/Agent/MCP 3 surface 대칭)
- **Agent-deprecation isolated test** (CO-4): `test/contract/agent-deprecation.test.js` 5 scenario fixture (positive, missing-stub, no-deprecated-in, model-mismatch, non-mutation), 5/5 PASS
- **MCP-deprecation e2e test** (CO-2.1): `test/contract/mcp-deprecation.test.js` 6 scenario fixture (active, simple, full, JSDoc-style 외), 6/6 PASS

#### Evolution (진화)
- **`lib/util/frontmatter.js`** (CO-5): 5 site duplication 통합 — `parseFrontmatter`, `parseFrontmatterFile`, `hasDeprecatedInFrontmatter`, `hasDeprecatedInFrontmatterFile`, `coerce` (pure FS-free 핵심)
- **v2.1.16 baseline 추가 캡처**: `test/contract/baseline/v2.1.16/` (106 file) — 다음 PDCA 작업의 noise floor 기준
- **SoT canonical names list** (CO-3.1): `lib/domain/rules/docs-code-invariants.js`에 `EXPECTED_ACTIVE_AGENT_NAMES` (34), `EXPECTED_DEPRECATED_AGENT_NAMES` (6), `EXPECTED_SKILL_NAMES` (44), `EXPECTED_HOOK_EVENT_NAMES` (21), `EXPECTED_PDCA_MCP_TOOLS` (13), `EXPECTED_ANALYSIS_MCP_TOOLS` (6) 추가 — invocation-inventory.test.js가 dynamic 참조

### Fixed

#### Framework 부작용
- **collect 함수 implicit write 부작용 차단**: `collectSkills/Agents/MCPTools/Hooks/SlashCommands` 5개 함수에 `{ persist = true, baseDir = BASE_DIR, projectRoot = PROJECT_ROOT }` 옵션 추가. contract-test-run.js가 `{ persist: false }` 명시로 baseline self-mutation 차단.
- **`--version` 인자 path-injection validation** (CO-1.1): `^[A-Za-z0-9._-]+$` 정규식 미일치 시 exit 2 (`/tmp/foo` 같은 path concat 사고 방지)
- **`--project-root` flag** (CO-4 prerequisite): contract-test-run.js + contract-baseline-collect.js — fixture-aware testing

#### `.gitignore` 위장 결함 해소 (CO-6)
- **`test/`, `tests/*` blanket ignore 제거** — production test 디렉터리 default tracked. 5/20 사고 클래스 (`Cannot find module` 위장) 영구 차단.
- **35+ 잔여 untracked test files 일괄 추적**: `tests/qa/` 29 file (bug-fixes-v218, v2113-sprint-1~5, v2114-* 10개, v2116-* 3개 등) + `test/contract/` 5 file + `test/e2e/` 6 file + `test/integration/` 3 file + `test/unit/` 2 file + `test/v2110-qa/` 2 file
- **`docs-code-scanner.js` `countAgents`**: deprecation tombstone 제외 (active count 정합성)
- **5/20 release 위장 결함 정상화**: `tests/qa/bkit-full-system.test.js`, `bkit-deep-system.test.js`, `test/contract/l2-hook-attribution.test.js`, `l3-mcp-runtime.test.js` 4 file force-tracked (v2.1.17 PR #97 + 본 PR)

#### Hygiene
- **v2.1.9 baseline 12 orphan JSON 삭제**: manifest 미등재 (sprint agents/MCP tools/skills) — runner 동작 무관하나 baseline hygiene 손상. 정리 후 `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` 252 → 234 assertions (의미 없는 12 assertion 제거).
- **`scripts/check-deadcode.js` EXEMPT 패턴 보완**: v2.1.13 sprint barrel 3 file (`lib/{application/sprint-lifecycle,domain/sprint,infra/sprint}/index.js`) EXEMPT 추가. 5/12 이전부터 잠재된 결함이 Invocation Contract red로 위장되어 있었음.

### Changed

- **`.github/workflows/contract-check.yml`**: 13 → **18 step** (+1 dual baseline 비교, +4 L2/L3, +1 check-test-tracking, +L5 mandatory needs)
- **agents count semantics**: "total" → **"active" (34) + "deprecated" (6)**. SoT (`docs-code-invariants.js`) `agents: 34` 유지, count 측정 5 site에서 filter 적용.
- **workflow L5 job name**: "관찰 전용 — 머지 차단 아님" → **"Invocation Inventory"** (mandatory)

### Architecture

#### New Layer
- **`lib/util/`** (NEW utility layer) — pure FS-free modules. 첫 module: `frontmatter.js`.

#### New Modules / Scripts
- `lib/util/frontmatter.js` (75 LOC, pure)
- `scripts/setup-branch-protection.sh` (executable, idempotent)
- `scripts/check-test-tracking.js` (CI gate)
- `test/contract/agent-deprecation.test.js` (5 scenario, fixture-based)
- `test/contract/mcp-deprecation.test.js` (6 scenario, fixture-based)
- `test/contract/fixtures/agent-deprecation/` (4 fixtures)
- `test/contract/fixtures/mcp-deprecation/` (1 fixture server)
- `test/contract/baseline/v2.1.16/` (106 file Latest snapshot)

### Verification

로컬 dry-run 18/18 PASS:
- domain purity: 18 files, 0 forbidden
- L1+L4 vs v2.1.9 LTS: 234 assertions
- L1+L4 vs v2.1.16 Latest: 255 assertions
- guard registry: 21 guards
- **check-test-tracking** (NEW): 0 untracked production test files
- docs-code-sync: all counts consistent
- check-deadcode: Dead 0
- integration runtime: 23/23
- L2 smoke: 98/98
- L2 hook attribution: 13/13
- L3 MCP compat: 92/92
- L3 MCP runtime: 48/48
- **L5 invocation inventory** (mandatory): 210/210 (SoT-driven, +7 from v2.1.16)
- **agent-deprecation isolated** (NEW): 5/5
- **mcp-deprecation e2e** (NEW): 6/6
- bkit-full-system: 36/36
- bkit-deep-system: 111/111
- docs-code-sync test: 36/36
- branch-protection script (dry-run): preview valid

**qa-aggregate**: 4090+ PASS / 0 FAIL / 0 Errors (v2.1.16 GA의 3,808 PASS / 31 FAIL / 4 Errors 대비 35건 회귀 close + 280+ TC 증가)

### Closure 매트릭스

| 항목 | v2.1.16 GA | v2.1.17 |
|------|:---:|:---:|
| Contract red 누적 | 8일 | **0일** |
| Workflow steps (mandatory) | 13 | **18** |
| Baseline snapshots | 1 (v2.1.9) | **2 (v2.1.9 LTS + v2.1.16 Latest)** |
| Active agents | 34 | 34 (with explicit deprecation governance) |
| Deprecation tombstones | 0 | **6** |
| Frontmatter parse sites | 5 (duplicate) | **1** (`lib/util/frontmatter.js`) |
| Hardcoded EXPECTED lists | 7 (stale-prone) | **0** (SoT `docs-code-invariants.js`) |
| Branch protection | ✗ | **Required Status Checks 2개 자동 적용** |
| 5축 매트릭스 | 0/5 | **5/5** ✅ |

### Closure 항목 (Carryover 영구 종결)

| ID | Description | Status |
|----|-------------|:---:|
| CO-1 | Branch protection 자동화 | ✅ script + apply 적용 완료 |
| CO-1.1 | --version path-injection validation | ✅ regex validation |
| CO-2 | MCP tool deprecation schema 정형화 | ✅ `parseMCPToolBlocks` |
| CO-2.1 | MCP deprecation 실전 e2e test | ✅ 6/6 PASS |
| CO-3 | L5 E2E mandatory 승격 | ✅ continue-on-error 제거 |
| CO-3.1 | L5 inventory dynamic EXPECTED lists | ✅ SoT 통합 (210/210) |
| CO-4 | Agent-deprecation isolated unit test | ✅ 5/5 PASS |
| CO-5 | frontmatter util 추출 | ✅ 5 site → 1 |
| CO-6 | Tracked file policy | ✅ .gitignore narrow + 35+ file 추적 + 가이드 |
| CO-7 | tests/qa dependency 자동화 | ✅ check-test-tracking.js + workflow step |
| CO-8 | branch-protection 실제 apply audit | ✅ popup-kay admin 적용 검증 |

**11 carryover 항목 모두 close** — 5/12 ~ 5/20 사고 클래스 완전 종결.

### References

- PR #97 (v2.1.17 main scope, merged 2026-05-20 `7acdd4f`): https://github.com/popup-studio-ai/bkit-claude-code/pull/97
- PR #99 (v2.1.17 final + 5 carryover): https://github.com/popup-studio-ai/bkit-claude-code/pull/99
- Plan: `docs/01-plan/features/v2117-ci-cd-hardening.plan.md`, `v2118-carryover-cleanup.plan.md`
- SOP guides: `docs/06-guide/contract-baseline-rollforward.guide.md`, `branch-protection-setup.guide.md`, `test-file-tracking-policy.guide.md`
- Origin incident: commit `967cd8f` (refactor v2.1.13, 2026-05-12)

---

## [2.1.16] - 2026-05-20 (branch: `feature/v2116-issue-fixes`)

> **Status**: Patch release — 4 GitHub issues 종결 (Quality Gates & Approval UX).
> **Reporter**: @pruge (v2.1.14, CC v2.1.140, L2 trust) — L2 기본 사용자가 sprint 진행 중 quality gate에 의해 발생하는 deadlock 4종을 사용자 명시 명령으로 해소.

### Fixed — Issue #92: sprint-orchestrator M4+M8 dual record at design exit (F1)

`sprint-orchestrator` agent가 design phase §14 self-assessment 종료 시 `M8_designCompleteness`만 기록하고 `M4_apiComplianceRate`를 누락 → `evaluateGate(null)` returns `reason: 'not_measured'` → `advancePhase` returns `reason: 'gate_fail'` → start-sprint loop가 `QUALITY_GATE_FAIL`로 pause. L2 사용자 deadlock.

- **agent body §96-102 Quality Standards 확장** + **Design Phase Exit Procedure 신설** — orchestrator가 design exit 전 M4 + M8 둘 다 측정 책임 명시 (Option A, Issue #92 reporter suggested).
- **quality-gates.js JSDoc evolution** — measurement responsibility 명시 (single SoT per gate). Logic 무변경 (Master Plan §1 RISK invariant — gate matrix target 동일).
- **Cross-Sprint Integration (F3 ships 후)**: agent body가 `measure-router.measureGate('M4', sprint, { agentTaskRunner })` 호출 명시 — `/sprint phase` 자동 advance와 `/sprint measure --gate M4` 수동 호출이 단일 SoT 공유.
- **Contract test SC-11 신규** — Sprint 2 quality-gates logic structural invariant (legacy git-diff freeze evolution, INV-05 hooks.json 패턴).
- Atomic commit `b8f85b9`.

### Added — Issue #95: `/sprint phase --approve` scope-boundary single-use escape hatch (F2)

L2 trust (`scope.stopAfter = "design"`, `requireApproval = true`)에서 `/sprint phase --to do` 호출 시 `requires_user_approval` 반환되지만 사용자가 approval 줄 명령 없음 → deadlock. workaround는 trust escalation 또는 state JSON 직접 편집 (bkit 철학 위반).

- **`--approve` flag (단일 호출 escape hatch)** + optional `--reason "<text>"` — `sprint.autoRun.scope` 무변경 (single-use), 다음 phase 전이 시 재차 scope check.
- **`audit-logger.ACTION_TYPES.scope_boundary_approved` 신규** (28번째) + details schema `{ sprintId, from, to, trustLevel, stopAfter, approvedBy, reason }`.
- **`advance-phase.usecase.js` Step 2 확장** — `deps.approve === true` 시 scope check skip + `approvalRecord` 반환. Pure-module 유지 (handler가 audit emit).
- **`advancePhase` 응답에 `hint` field 추가** — legacy `requires_user_approval` 결과에 사용자 안내 ("Re-run with --approve. Approval is single-use and does NOT change trust level.").
- **SKILL.md §10.1 phase row 확장 + §10.1.1 dedicated semantics section** (R4 misunderstanding mitigation).
- **Contract test SC-12 신규** — 7 behavioral assertions + handler E2E.
- Atomic commit `3c615fd`.

### Added — Issue #94: `/sprint measure` partial-gate measurement command (F3)

quality gate가 null (not_measured)이고 phase 전이 차단 시 사용자가 단일 gate 측정할 명령 없음. 기존 `/sprint phase`/`/sprint iterate`/`/sprint qa`는 전체 workflow advance 또는 다른 scope. 측정 작업은 subagent (gap-detector, code-analyzer, sprint-orchestrator)가 수행하지만 user-invokable slash command 없음.

- **`lib/application/quality-gates/measure-router.js` 신규 디렉토리 + 모듈** — gateKey → agent 매핑 (Master Plan §11.3 AC4): M1/M3/M4 → gap-detector, M2/M7 → code-analyzer, M8 → sprint-orchestrator, S1 → sprint-qa-flow. 7 supported gates × 4 agents + 4 unsupported (M5/M10/S2/S4 carry to v2.1.17). Pure module — `agentTaskRunner` inject, 6 deterministic error reasons (no silent fail).
- **`lib/application/sprint-lifecycle/measure-gate.usecase.js` 신규** — Trust Level scope (L0/L1 preview / L2+ record), sequential aggregators (ENH-292 cache-friendly): `measureGate` / `measureGates` / `measurePhaseGates`.
- **`audit-logger.ACTION_TYPES.gate_measured` 신규** (29번째) + 11-field details (sprintId/gateKey/field/agent/value/threshold/passed/source/phase/trustLevel/previousValue). Preview mode (L0/L1) NO audit (noise 0).
- **`sprint-handler.js` 17번째 VALID_ACTION `measure`** — 3 modes precedence (`--gate` > `--gates` CSV > `--phase`), per-gate gate_measured audit emit, cumulative state save.
- **F1 self-assessment refactor — single SoT 통합** — agent body가 inline §14 heuristic 제거 → measure-router 호출 명시 (Master Plan AC7 code-sharing).
- **SKILL.md §10.1 measure row + §10.1.2 dedicated semantics section** (agent routing table, Trust Level scope 명시).
- **Contract test SC-13 신규** — 8 assertion groups (router routing, error paths, UC modes, aggregators, handler E2E, F1 cross-reference invariant).
- Atomic commit `126a7c0`.

### Added — Issue #93: Gate-failure auto-report at advancePhase gate_fail (F4)

`gate_fail` 시 raw JSON 한 줄만 stderr 출력 + disk 작성 0. 사용자가 LLM 해석 의존 (bkit "controllable AI" 철학 위반).

- **`templates/gate-failure-report.template.md` 신규** — 6열 표 outer skeleton (Sprint Phase / Gate / Status / Expected / Actual / Suggested Action per Issue #93 example) + `{gateRows}/{failedGateBlocks}/{passingGateBlocks}` placeholder.
- **`lib/application/quality-gates/failure-reporter.js` 신규** — 3-tier pattern (pure builders + side-effect writeReport + createFailureReporter factory). PLUGIN_ROOT vs projectRoot 분리 (template lookup ↔ output dir).
- **`advance-phase.usecase.js` Step 3 gate_fail 분기 통합** — `deps.failureReporter` dispatch (best-effort, never blocks), `sprint.lastGateFailure { phase, toPhase, gateResults, reportPath, timestamp }` 동적 추가 (Sprint 1 domain 무변경, INV-01 안전), 응답에 reportPath + sprint 추가.
- **`audit-logger.gate_failed` details schema 확장** (no new enum — re-use). 11-field details (sprintId/phase/targetPhase/failedGates[]/reportPath).
- **`audit-logger.sanitizeDetails` Array preservation (generalized fix)** — v2.1.10 sanitizeDetails가 Array를 `{ '0': {...} }` Object로 coerce하던 잠재 회귀를 F4가 발견 + Array branch 추가. 모든 미래 audit array fields에 benefit.
- **sprint-handler `handlePhase` 확장** — `buildFailureReporterForHandler` (fileWriter inject) + state save on gate_fail + gate_failed audit emit (expanded details).
- **per-call opts merging** (`createFailureReporter`) — toPhase는 advancePhase 호출 시점에만 알 수 있음 → per-call opts merged with factory opts.
- **Cross-feature enrichment (AC7)** — report Suggested Action column이 `not_measured` → F3 `/sprint measure --gate <K>` command, Next User Commands 섹션이 F2 `--approve` + F3 `/sprint measure` substituted with sprintId/toPhase.
- **Contract test SC-14 신규** — 7 assertion groups + handler E2E (temp project root, audit log file content verification).
- Atomic commit `72559ce`.

### Changed — Cross-Feature Invariant Evolution

- **`tests/contract/v2113-sprint-contracts.test.js` SC-04/SC-06 갱신**:
  - SC-04: VALID_ACTIONS 16 → **17** (`measure` 추가)
  - SC-06: ACTION_TYPES 27 → **29** (scope_boundary_approved + gate_measured, evolved from regex source-text counting to module-level assertion to avoid JSDoc literal false-positives)
- **`tests/qa/v2113-sprint-4-presentation.test.js` INV-02/H-01/AUDIT-01 evolved** (local-only, `.gitignore tests/qa/*`):
  - INV-02: git diff freeze → logic structure invariant (INV-05 hooks.json 패턴)
  - H-01: VALID_ACTIONS 16 → 17
  - AUDIT-01: 27 → 29 (scope_boundary_approved + gate_measured)
- **`test/unit/audit-logger.test.js` AL-007 evolved (16 → 29)** — v2.1.10 baseline 누적 evolution 갱신.

### Verification

- **L3 Contract**: 14/14 PASS (SC-11/SC-12/SC-13/SC-14 신규, SC-04/SC-06 evolved)
- **Tracked unit (test/unit/)**: 90/90 files PASS (AL-007 갱신 후)
- **Tracked unit (tests/unit/)**: 3/3 files PASS
- **bkit-deep-system**: 111/111 PASS
- **sprint-2-application**: 79/79 PASS (회귀 0)
- **sprint-3-infrastructure**: 66/66 PASS (회귀 0)
- **sprint-4-presentation** (3 evolved tests): 41/41 PASS
- **Local QA** (v2116-sprint-phase-approve 7 + v2116-sprint-measure-command 9 + v2116-gate-fail-report 8): 24/24 PASS
- **Total tracked**: ~150+ test files / 478+ assertions, 0 FAIL
- **claude plugin validate**: ✔ Exit 0 (F9-120 closure 17-cycle 확장)

### Live Dogfooding

- **ENH-310 heredoc-bypass guard live-fire 3회 연속** (F1+F2+F3 atomic commit 시도에서 `git commit -m "$(cat <<EOF ... EOF)"` 패턴 차단) — bkit 차별화 #6 결정적 강화. -F file 방식으로 우회 (학습 적용 후 F4 commit은 trigger 없이 성공).
- **audit-logger sanitizeDetails Array 회귀 발견 + generalized fix** — F4가 failedGates array를 audit 하면서 v2.1.10 회귀 발견. 모든 미래 audit entry array fields에 benefit.
- **bkit v2.1.16 sprint 자체가 PDCA + Sprint Management의 self-dogfooding** — 4 GitHub issues가 bkit이 발견한 bkit 자체 deadlock 4건을 bkit 도구로 해소.

### Architecture

- **신규 디렉토리**: `lib/application/quality-gates/` (measure-router + failure-reporter)
- **신규 lib 모듈**: 3 (measure-router.js, measure-gate.usecase.js, failure-reporter.js)
- **신규 template**: 1 (gate-failure-report.template.md)
- **수정 lib 모듈**: 4 (advance-phase.usecase.js, quality-gates.js, sprint-handler.js, audit-logger.js)
- **수정 agent**: 1 (sprint-orchestrator.md — Phase Exit Self-Assessment 신설 + Design Phase Exit Procedure)
- **수정 skill**: 1 (sprint SKILL.md — §10.1 measure/approve rows + §10.1.1 + §10.1.2)
- **수정 contract**: 1 (v2113-sprint-contracts.test.js — SC-11/SC-12/SC-13/SC-14 신규 + SC-04/SC-06 evolved)
- **신규 ACTION_TYPES**: 2 (scope_boundary_approved [#95 F2], gate_measured [#94 F3])
- **신규 VALID_ACTIONS**: 1 (measure [#94 F3])
- **신규 bkit 차별화**: #7 "recovery-friendly automation" — sprint deadlock 4종을 사용자 명시 명령으로 해소

### Cross-Sprint References

- bkit v2.1.15 (PR #91, `b65d336`) — Issue #89 .pdca-status.json 6-Layer Defense (본 sprint 진행 중 활성)
- bkit v2.1.14 차별화 6/6 (memory enforcer + Layer 6 Defense + sequential dispatch + effort-aware + PostToolUse continueOnBlock + heredoc-bypass) — 본 sprint 진행 중 활성 (특히 ENH-310 3회 live-fire)
- bkit v2.1.13 Sprint Management — 본 sprint가 Sprint Lifecycle 8-phase 활용 + Sprint 2 Application Layer 확장
- CC v2.1.140 환경 호환성 100 consecutive PASS 유지

### Release Hardening Sub-Sprint (post-release)

> v2.1.14/15 반복 패턴 종결 — 본 hardening 사이클은 4-feature fix 와 별도로 release metadata + test maintenance + CI gate 강화를 일괄 진행. Plan: `docs/01-plan/features/v2116-release-hardening.plan.md`, Report: `docs/04-report/features/v2116-release-hardening.report.md`.

**Layer A — Release Metadata 동기 (3 files)**:
- `README.md` Version badge `Version-2.1.14-green` → `Version-2.1.16-green` (GitHub 첫 인상 정합)
- `hooks/session-start.js` line 3 주석 `(v2.1.13, ...)` → `(v2.1.16, ...)` (runtime BKIT_VERSION dynamic import 유지)
- `hooks/startup/session-context.js` line 2 헤더 `(v2.0.0)` → `(v2.1.16)`

**Layer B — Test Maintenance (15 files, 31 stale FAIL → 0)**:
- Orphan test 4 file 삭제 (v2.1.10 Sprint 6에서 lib/context/* 모듈 제거 후 미정리 — `context-loader/impact-analyzer/invariant-checker/scenario-runner` test files)
- Stale baseline 11 file 갱신:
  - `test/unit/runner.test.js` U-RUN-015/016/069/071 — skills 30→31, workflow 11→12
  - `test/contract/extended-scenarios.test.js` 5 TC — SoT 동기 (`lib/domain/rules/docs-code-invariants.js` 기준: skills 44, agents 34, mcpTools 19)
  - `test/contract/invocation-inventory.test.js` 8 TC — counts 동기 + 6 pdca-eval-* (v2.1.10 삭제됨) 제거 + 4 sprint-* (v2.1.13 추가) 추가
  - `test/contract/docs-code-sync.test.js` 11 TC — counts cascade + tmp fixture (`correct.md`) 갱신
  - `test/contract/v2112-deep-qa-invariants.contract.test.js` L3-006/002 — lib 모듈 count `142→≥142` (growth-tolerant) + L3-002 runtime-conditional skip
  - `test/contract/orchestrator.test.js` 2 TC — "회원가입" 라우팅 정책 진화 반영 (`bkend-expert` agent 허용)
  - `test/contract/status-split.test.js` — status-core exports 17→19 (v2.1.15 #89 `shouldUpdate` + `appendHistoryEntry` 추가)
  - `test/unit/pdca-status-full.test.js` PS-026 — Issue #89 fix 의도된 동작 반영 (`src/features/auth/login.js` → `'auth'` 추출 금지)
  - `test/unit/trigger.test.js` U-TRG-016 — JS 부동소수점 (`0.7+0.1 = 0.7999999999999999`) 비교를 epsilon `< 1e-9`로 교정
  - `test/unit/project-isolation.test.js` ISO-09 — v2.1.10 facade split 반영 (`status.js` → `status-core.js`)
  - `tests/qa/v2113-sprint-5-quality-docs.test.js` — L3 contract `10/10 PASS` → `14/14 PASS` (v2.1.16 SC-11/12/13/14 추가 반영)

**Layer C — CI Gate Reinforcement** (`.github/workflows/contract-check.yml`):
- 신규 step `Release Gate — bkit-full-system (version sync + agent/skill structure)` — 추후 release metadata stale defect 자동 차단
- 신규 step `Release Gate — docs-code-sync (counts SoT drift detector)` — skills/agents/mcpTools 카운트 drift 자동 검출

**Verification (post-hardening)**:
- `node test/contract/scripts/qa-aggregate.js`: PASS 3808 → **3844** (+36), FAIL 31 → **0**, errors 15 → **0**, file count 151 → 147 (-4 orphan)
- `node tests/qa/bkit-full-system.test.js`: 33 PASS / 3 FAIL → **36 PASS / 0 FAIL**
- `node tests/contract/v2113-sprint-contracts.test.js`: **14/14 PASS** 유지 (SC-01 ~ SC-14)
- 모든 11 갱신 file 단독 실행 시 0 FAIL

**Lessons Learned (carry to v2.1.17)**:
- L1 "Tests exist but unused" — `bkit-full-system.test.js`가 v2.1.14부터 release defect를 검출했으나 CI 미연결로 무시. 본 cycle Layer C로 해소.
- L2 Stale baseline은 zero-interest debt 아님 — 누적되면 "FAIL count는 거짓 양성" 패턴이 진짜 결함도 가림.
- L3 SoT pattern 미준수 — `EXPECTED_COUNTS` SoT가 정확했음에도 테스트가 literal 하드코딩 → cascade drift. Carry CO-1: 테스트가 SoT를 import하도록 리팩토링.
- L4 사용자 healthy skepticism 가치 — "정말 5개가 다야?" 질문 없이는 31 FAIL stale이 v2.1.17+로 이월됐을 가능성.

## [2.1.15] - 2026-05-18 (branch: `feature/v2115-issue-89-pdca-status-fix`)

> **Status**: Patch release — Issue [#89](https://github.com/popup-studio-ai/bkit-claude-code/issues/89) 대응 (`.pdca-status.json` 무한 오염 fix).
> **Reporter**: @doing27 — 실측 사례 294KB, features 147 중 138 garbage, history 1669 중 1661 garbage.

### Fixed — Issue #89: `.pdca-status.json` 무한 오염 (6-Layer Defense)

매 source 파일 편집마다 `.pdca-status.json`에 garbage feature 누적되던 문제를 6-Layer 방어로 종결.

- **L1 `extractFeature` 강화** (`lib/core/file.js`):
  - 패턴 매칭 시 캡처값이 파일(확장자 보유)이면 skip (`app/services/foo.py` → `'foo.py'` 오추출 차단)
  - `GENERIC_NAMES` 19 → **65 디렉토리 확장** — 일반 백엔드/프론트 레이아웃 (`api`/`web`/`mobile`/`client`/`server`/`backend`/`frontend`/`admin`/`auth`/`cms`/`database`/`config`/`core`/`helpers`/`middleware`/`plugins`/`scripts`/`styles`/`static`/`public`/`assets`/`tests`/`tenants`/`versions`/`tmp`/`audit`/`dashboard`) + 버전 디렉토리 (`v1`~`v9`) + Next.js 라우트 그룹 (`(dashboard)`/`(auth)`/`(public)`/`(admin)`/`(api)`)
  - Fallback (부모 디렉토리 거슬러 올라가기)을 **explicit opt-in (default OFF)** — 기존 호출자는 모두 새 default 받음
  - 함수 시그니처: `extractFeature(filePath, opts = {})` (backward-compat)
- **L2 `extractFeatureFromContext` DRY** (`lib/pdca/status-core.js`):
  - 중복 패턴 매칭 코드 제거, `extractFeature`로 위임 — 동일 fix 공유
- **L3 `updatePdcaStatus` 검증 게이트** (`lib/pdca/status-core.js`):
  - `opts.requireDocs` (default true): `docs/01-plan/features/${feature}.plan.md` 또는 `docs/02-design/features/${feature}.design.md` 부재 시 silent no-op
  - 16개 기존 호출자 모두 default behavior 통과 (PDCA workflow는 plan 문서 작성 후 진입)
  - `shouldUpdate` 헬퍼로 추출 (testability)
- **L4 `scripts/pre-write.js` schema 정정**:
  - `currentStatus?.currentFeature` → `currentStatus?.primaryFeature` 정정 (v2/v3 schema에는 `currentFeature` 필드 부재 — `status-migration.js:31,74`에서 normalize됨)
  - v2.1.7 "Issue #79 P4" fix가 실제로는 모든 케이스에서 false-negative였던 잠재 버그 해결
- **L5 `history` dedup + ring buffer** (`lib/pdca/status-core.js`):
  - `appendHistoryEntry` 헬퍼로 분리. consecutive 동일 `feature/phase/action` entry는 timestamp만 갱신 (push 안 함)
  - Ring buffer limit 100 적용 — 100회 동일 편집 시 history는 항상 1개
- **L6 단위 테스트 48 TC** (회귀 방지):
  - `tests/unit/file-extract-feature.test.js` (20 TC)
  - `tests/unit/extract-feature-from-context.test.js` (10 TC)
  - `tests/unit/pdca-status-gating.test.js` (18 TC, L3+L5 헬퍼 검증)

### Changed

- `extractFeature(filePath)` → `extractFeature(filePath, opts = {})` — `opts.allowFallback: false` default (backward-compat)
- `updatePdcaStatus(feature, phase, data)` → `updatePdcaStatus(feature, phase, data, opts = {})` — `opts.requireDocs: true` default + `opts.docCheckFn` 테스트 주입 가능
- `lib/pdca/status-core.js` exports: `shouldUpdate` + `appendHistoryEntry` 헬퍼 추가
- `lib/core/file.js` exports: `GENERIC_NAMES` 추가

### Compatibility

- **Breaking changes**: 0건 (모든 기존 호출자는 default behavior로 안전)
- **Migration**: 불요 — 기존 `.pdca-status.json` garbage는 사용자가 별도 cleanup 가능 (본 PR 외)
- **v3 schema**: 변경 없음
- **bkit Trust Level**: 영향 없음
- **Sprint Management (v2.1.13)**: 영향 없음

### Documentation

- `docs/01-plan/features/issue-89-pdca-status-fix.plan.md` (한국어)
- `docs/02-design/features/issue-89-pdca-status-fix.design.md` (한국어, 6-Layer Defense 설계)
- `docs/04-report/features/issue-89-pdca-status-fix.report.md` (한국어, Phase 4 산출물)

### 검증

- `node --test tests/unit/file-extract-feature.test.js` → 20/20 PASS
- `node --test tests/unit/extract-feature-from-context.test.js` → 10/10 PASS
- `node --test tests/unit/pdca-status-gating.test.js` → 18/18 PASS
- 누적 **48/48 PASS**

---

## [2.1.13] - 2026-05-12 (branch: `feature/v2113-sprint-management`)

> **Status**: GA — Sprint Management feature release + tech debt cleanup.
> **One-Liner (EN)**: The only Claude Code plugin that verifies AI-generated code against its own design specs.
> **One-Liner (KO)**: AI가 만든 코드를 AI가 만든 설계로 검증하는 유일한 Claude Code 플러그인.

### Added — Sprint Management (Major Feature)

A new **meta-container** that groups one or more features under shared scope,
budget, and timeline. Sprint runs an 8-phase lifecycle independent of (and
orthogonal to) the per-feature PDCA 9-phase cycle.

- **Sprint 8-phase lifecycle**: `prd → plan → design → do → iterate → qa → report → archived`
- **16 sub-actions**: `/sprint init / start / status / list / watch / phase / iterate / qa / report / archive / pause / resume / fork / feature / help / master-plan`
- **4 Auto-Pause Triggers**: `QUALITY_GATE_FAIL` / `ITERATION_EXHAUSTED` / `BUDGET_EXCEEDED` / `PHASE_TIMEOUT` — instant pause on detection
- **Trust Level scope L0-L4** via `SPRINT_AUTORUN_SCOPE` (L0 stop-after-plan / L1 design / L2 do / L3 qa / L4 archived = full-auto)
- **7-Layer S1 dataFlowIntegrity QA** — `UI → Client → API → Validation → DB → Response → Client → UI` hop traversal via `sprint-qa-flow` agent
- **3 new MCP tools** in `bkit-pdca-server`: `bkit_sprint_list` / `bkit_sprint_status` / `bkit_master_plan_read`
- **4 new agents**: `sprint-master-planner` (Context-Anchor-driven plan generation) / `sprint-orchestrator` (Sequential dispatch ENH-292 pattern) / `sprint-qa-flow` (S1 verification) / `sprint-report-writer` (cumulative KPI aggregation)
- **1 new skill**: `skills/sprint/SKILL.md` (327 LOC) + `PHASES.md` (83 LOC) + 3 examples (`basic-sprint.md` / `multi-feature-sprint.md` / `archive-and-carry.md`)
- **7 new templates**: `templates/sprint/{master-plan, prd, plan, design, iterate, qa, report}.template.md`
- **2 new infrastructure adapters**: `lib/infra/sprint/sprint-state-store.adapter.js` (181 LOC) + `lib/infra/sprint/sprint-telemetry.adapter.js` (200 LOC)
- **9 application-layer modules** in `lib/application/sprint-lifecycle/`: `phases.js` (frozen 8-phase enum + `SPRINT_PHASE_ORDER` + `isValidSprintPhase` + `nextSprintPhase` helpers) + `transitions.js` + `start-sprint.usecase.js` + `advance-phase.usecase.js` + `iterate-sprint.usecase.js` + `verify-data-flow.usecase.js` + `generate-report.usecase.js` + `archive-sprint.usecase.js` + `master-plan.usecase.js` + `auto-pause.js` + `quality-gates.js` + `context-sizer.js` + `index.js` (19 barrel exports)
- **5 sprint infrastructure adapters** beyond state-store/telemetry: `gap-detector.adapter.js` + `auto-fixer.adapter.js` + `data-flow-validator.adapter.js` (no-op baseline + agentTaskRunner-injected real impl path) + `matrix-sync.adapter.js` + `sprint-doc-scanner.adapter.js`
- **1 new L3 contract test**: `tests/contract/v2113-sprint-contracts.test.js` (366 LOC, 8 cross-sprint contracts SC-01 ~ SC-08): entity shape · deps interface · infra adapters · handler signature · 4-layer chain · ACTION_TYPES 20 · SPRINT_AUTORUN_SCOPE mirror · hooks 21:24 invariant
- **2 Korean user guides**: `docs/06-guide/sprint-management.guide.md` (~330 lines, 8 sections) + `sprint-migration.guide.md` (~200 lines, PDCA ↔ Sprint orthogonal coexistence)
- **2 new ADRs**: `docs/adr/0006-cc-upgrade-policy.md` (CC version compatibility policy, 79+ consecutive baseline) + `docs/adr/0007-sprint-as-meta-container.md` (Sprint = PDCA 위 메타 컨테이너, backward-compat invariant)
- **Context Sizer** (S3-UX) — Kahn topological sort + greedy bin-packing for sprint feature size estimation (`lib/application/sprint-lifecycle/context-sizer.js`, max 100K tokens/sprint, 25% safety margin, dependency-aware)
- **Sprint Master Plan Generator** (S2-UX) — `sprint-master-planner` agent that produces Context-Anchor-driven sprint planning documents from the 7 Sprint 4 templates

### Added — Sprint UX Improvement (4 sub-sprints S1-UX ~ S4-UX)

Sub-sprints iteratively hardened Sprint Management UX:

- **S1-UX** — P0 phase reset + P1 trust/CLI/skill args fixes (Phase 4 Do)
- **S2-UX** — Master Plan Generator implementation (`sprint-master-planner` agent body + frontmatter)
- **S3-UX** — Context Sizer with Kahn topological sort + greedy bin-packing
- **S4-UX** — Integration + L3 contract test 10/10 PASS + 16-cycle iteration verification

### Changed — Skill Cross-References (14 skills)

The following skills received minor edits to document Sprint coexistence:

`audit` · `bkit-rules` · `bkit-templates` · `bkit` · `control` · `deploy` ·
`development-pipeline` · `enterprise` · `pdca-batch` · `pdca` · `plan-plus` ·
`pm-discovery` · `qa-phase` · `rollback`

Each surfaces a one-line note clarifying the orthogonal coexistence model (PDCA 9-phase per-feature ↔ Sprint 8-phase meta-container).

### Changed — Architecture

- `ACTION_TYPES` 16 → **20** (added `sprint_paused` + `sprint_resumed` + `master_plan_created` + `task_created` for DEEP-4 fix)
- `CATEGORIES` 10 → **11** (added `'sprint'` category)
- `lib/orchestrator/next-action-engine.js` +48 LOC — sprint phase transition integration (Stop-family hook routing)
- `lib/orchestrator/team-protocol.js` +36 LOC — sprint Task spawn coordination
- `lib/intent/language.js` +58 LOC — sprint trigger pattern expansion (`/sprint` 16 sub-actions + master-plan)
- `scripts/sprint-handler.js` — new (660 LOC) — sprint sub-action router with idempotent resume
- `scripts/sprint-memory-writer.js` — new (138 LOC) — sprint state persistence
- `servers/bkit-pdca-server/index.js` +170 LOC — 3 new MCP tools registered

### Removed — Tech Debt Cleanup (net −2,333 LOC)

Legacy infrastructure templates removed (superseded by `/enterprise` skill guidance + bkend.ai BaaS integration):

- `templates/infra/argocd/application.yaml.template`
- `templates/infra/deploy-dynamic.yml`
- `templates/infra/deploy-enterprise.yml`
- `templates/infra/staging-eks-ondemand.yml`
- `templates/infra/observability/kube-prometheus-stack.values.yaml`
- `templates/infra/observability/loki-stack.values.yaml`
- `templates/infra/observability/otel-tempo.values.yaml`
- `templates/infra/security/security-layer.yaml.template`
- `templates/infra/terraform/main.tf.template`

### Fixed — Inline Root Fixes (Final QA, commit `5edae8f`)

- **Intent ordering** — `lib/intent/language.js` trigger pattern conflict between `/sprint` and `/pdca` sub-actions resolved (sprint pattern priority + early-return on exact match)
- **Audit category migration** — `ACTION_TYPES.master_plan_created` and `task_created` routing path corrected in `lib/audit/audit-logger.js` (sprint events now correctly emit under the `sprint` category, not generic `pdca` category)

### Fixed — v2.1.12 Carryovers Closed

- **CARRY-7**: `handleStart` idempotent resume (sprint resume after pause did not restore state correctly — fixed in `scripts/sprint-handler.js` + E2E sprint/pdca/control verification, commit `a33af52`)
- **CARRY-8 ~ CARRY-12**: sprint integration gaps closed (MCP tool registration / audit category routing / config defaults) via deep-sweep v2 (commit `65cc0f3`, full-surface sprint integration + MCP/audit/config gaps)
- **38 scripts bare-require guard** (deferred from v2.1.12): the remaining `if (require.main !== module)` guards completed across the remaining hook handlers

### Verified — CC v2.1.139 Compatibility

- **94 consecutive compatible releases** (v2.1.34 → v2.1.139, R-2 v2.1.134/135 skip excluded)
- **ADR 0003 8th application** (single-pair small-batch scenario second occurrence: v2.1.138 1 bullet + v2.1.139 30 bullets — robust under all observed scenarios)
- **F9-120 closure 9-streak** — `claude plugin validate .` Exit 0 across v2.1.120 / 121 / 123 / 129 / 132 / 133 / 137 / 139 (carryover monitoring closed)
- bkit's **conservative recommendation**: Claude Code v2.1.123+ (79 consecutive compatible at recommendation point)
- bkit's **balanced recommendation**: Claude Code v2.1.139 (94 consecutive compatible)

### Documentation

- README.md badge + architecture section + Sprint Management section + recommended runtime (`v2.1.123+` conservative · `v2.1.139` balanced) updated to v2.1.13
- README-FULL.md v2.1.13 inventory section added (Sprint Management deliverables + 4 UX sub-sprints + tech debt cleanup)
- CUSTOMIZATION-GUIDE.md Component Inventory bumped to v2.1.13 (44 Skills · 34 Agents · 51 Scripts · 163 Lib Modules / 19 subdirs · 39 Templates · 19 MCP Tools)
- AI-NATIVE-DEVELOPMENT.md Context Engineering Layers updated to v2.1.13 + Sprint Management positioned as **AI-Native Principle 6** (Meta-Container for Multi-Feature Initiatives)
- `bkit-system/_GRAPH-INDEX.md` current release v2.1.13 + Sprint Skill (1) + Sprint Agents (4) + Sprint Templates (7) categories added
- `scripts/docs-code-sync.js` `EXPECTED_COUNTS` invariant updated (`skills: 44, agents: 34, mcpTools: 19`)
- 89+ legacy docs archived to `docs/archive/2026-05/` (v2.1.10 / v2.1.11 / v2.1.12 cycles + cc-v2110~v2137 + stale features)
- Real working example sprint: `docs/01-plan/features/v2113-docs-sync.master-plan.md` (this very release's documentation sync sprint, used to dogfood `/sprint`)

### Dogfooded

The v2.1.13 documentation synchronization itself was driven as a Sprint:
`/sprint init v2113-docs-sync --trust L4 --features f0-baseline,f1-version-bump,
f2-changelog,f3-readme,f4-readme-full,f5-customization,f6-bkit-system,
f7-hooks-commands,f8-archive-cleanup,f9-real-use-validation`. The final report
lives at `docs/04-report/features/v2113-docs-sync.report.md`.

## [2.1.12] - 2026-04-28 (branch: `hotfix/v2112-evals-wrapper-argv`)

> **Status**: Silent hotfix. Drop-in patch on top of v2.1.11. Zero breaking changes.
> **One-Liner (EN)**: The only Claude Code plugin that verifies AI-generated code against its own design specs.
> **One-Liner (KO)**: AI가 만든 코드를 AI가 만든 설계로 검증하는 유일한 Claude Code 플러그인.

### Deep Functional QA Fixes (2026-04-29)

A second-pass deep audit (`docs/04-report/bkit-v2112-deep-functional-qa-issues.report.md`)
discovered 23 latent defects spanning observability, lifecycle, control state,
rollback integrity, multilingual routing and API symmetry. The 19 actionable
items below were folded into v2.1.12; the remaining 4 are documented as
v2.1.13 carries (CARRY-7~12 in MEMORY.md).

#### P0 — Observability & Multilingual

- **#17 — token-meter Adapter completely broken.** `scripts/unified-stop.js:692-701`
  read `process.env.CLAUDE_*` (env vars CC v2.1.x never injects), so 472/472
  ledger entries had `inputTokens=0 / outputTokens=0 / model='unknown'`. Fixed
  to read from the parsed stdin payload (`hookContext.session_id`,
  `hookContext.message.model`, `hookContext.message.usage.{input_tokens,
  output_tokens, cache_read_input_tokens, cache_creation_input_tokens}`).
  Added `cacheReadInputTokens` / `cacheCreationInputTokens` / `parseStatus` /
  `parseWarnings` fields to `lib/cc-regression/token-accountant.js` recordTurn
  signature and `lib/domain/ports/token-meter.port.js` TurnMetadata typedef.
- **#21 — intent-router multilingual routing failed.**
  `lib/intent/trigger.js` produced `confidence = 0.7999999999999999` (FP error)
  which the intent-router rejected at the `>= 0.8` gate. Computed via
  `Number((threshold + 0.1).toFixed(2))` so the value is exactly 0.8.
  Also broadened `bkend-expert.{ko,ja,zh,...}` patterns in
  `lib/intent/language.js` so natural utterances ("회원가입 만들어줘",
  "会員登録 機能", "注册功能") match without requiring exact phrasing.

#### CRITICAL — Reliability

- **#1 + #11 — control-state.json self-contradiction.**
  `setLevel(n)` only updated `currentLevel`, leaving `level` (string) and
  `levelCode` (int) stale. A trust-score auto-downgrade then silently
  overrode user-explicit choices. Fixed `setLevel` to atomically write all
  three canonical fields plus a `setBy` sentinel; trust-engine now refuses
  to downgrade when `setBy === 'user-explicit-request'` and records
  `lastAutoTransitionReason: 'trust-downgrade-blocked-user-explicit'`.
- **#12 — verifyCheckpoint always false.**
  `createCheckpoint` hashed only the `pdcaStatus` snapshot but
  `verifyCheckpoint` recomputed over the full checkpoint object minus the
  hash fields, guaranteeing mismatch. Aligned `verifyCheckpoint` to recompute
  `sha256(JSON.stringify(cp.pdcaStatus))` and compare against
  `cp.pdcaStatusHash`. Returns `hashType: 'pdcaStatusHash' | 'hash' | 'none'`.
- **#14 — error-log all "unknown / null / empty".**
  `scripts/stop-failure-handler.js` only checked top-level `error_type`,
  `error_message`, `agent_id`, `agent_type`. Now also probes
  `input.message.{error_type, agent_id, agent_type, content[0].text}` and
  `input.error.{type, message}`, captures `parseStatus`
  (`'ok' | 'no_input' | 'partial'`) plus a free-form `parseWarnings`.

#### IMPORTANT — API symmetry / Lifecycle

- **#13 — state-machine API asymmetry.**
  `getAvailableEvents` returned `[{event, target, guard}]` objects but
  `canTransition` and `transition` accepted only string event names, so
  the natural pattern `getAvailableEvents(s).filter(e => canTransition(s, e))`
  silently failed. Both functions now accept either form (centralised in a
  private `_normaliseEvent()` helper); `transition()` always returns the
  normalised string event in its result. Defensively defaults `context`
  to `{}` when omitted.
- **#15 — agent-state stale across sessions.** SessionStart now detects
  agent-state lastUpdated older than `staleFeatureTimeoutDays` (default 7
  from control-state guardrails) and resets the lifecycle fields with a
  `_resetReason` audit trail.
- **#16 — agent-state enabled:false ghost fields.** `writeAgentState` now
  zeros `teammates / progress / sessionId / recentMessages` when
  `enabled === false` so disk state is always coherent. `feature` is
  intentionally retained as audit trail.
- **#9 + #10 + #8 — bare-require side effects.** Added
  `if (require.main !== module) { module.exports = {}; return; }` guard to
  9 critical hook handlers (`gap-detector-stop`, `pdca-skill-stop`,
  `iterator-stop`, `plan-plus-stop`, `subagent-{start,stop}-handler`,
  `team-idle-handler`, `pdca-task-completed`, `sync-folders`). Tests, smoke
  checks, and accidental imports no longer emit stale stdout
  (decisions, advisory messages) without a real hook payload. The
  remaining 38 scripts are tracked as v2.1.13 CARRY.
- **#19 — destructive-detector missed SQL/DB destruction.** Added rules
  G-009 (`DROP TABLE/DATABASE/SCHEMA/...`), G-010 (`TRUNCATE TABLE` /
  `ALTER TABLE … DROP COLUMN`), G-010b (`DELETE FROM` without `WHERE`),
  G-011 (NoSQL `db.<col>.drop()`, `dropDatabase()`, Redis `FLUSHALL/FLUSHDB`).
- **#20 — explorer.listAll opaque shape.** Added `listSkills()` and
  `listAgents()` flat-array helpers. JSDoc on `listAll()` clarified.
- **#22 — formatSuggestion("undefined: undefined —").** Now returns `''`
  for null / non-object / partial suggestions.
- **#23 — slash-command syntax not routed.** `route()` recognises
  `^/(\w[\w-]*)(?:\s+(.+))?$` as `type:'command'` with confidence 0.95
  and short-circuits downstream pattern matching.
- **#2 — telemetry "missing" was docs drift.** `cc-event-log.ndjson` and
  `session-ctx-fp.json` (note: `.json`, not `.ndjson` as memory had) are
  created lazily on first hook event / fingerprint write — verified live.
  Memory/docs corrected; no code change required.

#### P3 — Hygiene

- **#6 — 39 lib modules missing `@version` JSDoc.** Bulk-added `@version 2.1.12`
  to every lib/.js module. Now 142/142.
- **operational hygiene** — Removed stale runtime artifacts: `evals-pdca-13:45/14:01*.json`
  (4 files left from B1 / B3 BUG state) and the deprecated v1
  `v2112-skill-smoke.js` checker.

#### Reclassified / Deferred

- **#18 — L4 returns 'auto' for `bash_destructive`.** Reclassified P3 (was P2).
  At L4 (Full-Auto, "All auto, post-review only") this is by-design per
  `LEVEL_DEFINITIONS[4]`. The L5 tests still pin level explicitly to confirm
  L3/L2 boundary behaviour.
- **#7 — 121/142 lib modules in `legacy` layer.** Deferred to v2.1.13+
  Sprint F-1; tracked as a Clean-Architecture floor invariant goal
  (≥30% by v2.1.14).

### Fixed

- **B1 — `lib/evals/runner-wrapper.js:93` argv mismatch (P0).** The wrapper
  invoked `spawnSync('node', [runnerPath, skill])`, but `evals/runner.js`
  parses only the documented `--skill <name>` flag form (line 409-414).
  Every `/bkit-evals run <skill>` therefore printed the Usage banner, exited
  0, and the wrapper falsely reported `ok: true`. Fixed to
  `spawnSync('node', [runnerPath, '--skill', skill])`. Locked by L3 contract
  test `test/contract/v2112-evals-wrapper.contract.test.js`.
- **B2 — `lib/evals/runner-wrapper.js` false-positive defense (P0).** Exit
  code 0 alone no longer implies `ok: true`. The wrapper classifies a
  missing parsed JSON block: `reason: 'argv_format_mismatch'` when stdout
  contains `Usage:`, otherwise `reason: 'parsed_null'`. The `reason` field
  is also persisted in `.bkit/runtime/evals-{skill}-{ts}.json`.
- **B3 — `lib/evals/runner-wrapper.js` JSON parse robustness (P0, FR-13).**
  v2.1.11 used `stdout.lastIndexOf('{')` which selected a **nested**
  object's opening brace (e.g., `details: {`), causing the outer `}` to
  become trailing data and `JSON.parse` to fail on otherwise valid runner
  output. Replaced with a 2-strategy extractor (`_extractTrailingJson`):
  (1) parse the whole trimmed stdout, (2) fall back to a string-aware
  balanced-brace scan from the last `}`. Module exports the helper for
  unit testing.
- **D1 — `skills/bkit-evals/SKILL.md:45` doc accuracy.** Spec now matches
  implementation: `node evals/runner.js --skill <skill>` instead of the
  positional `<skill>` form. Defense and parse-robustness behavior also
  documented.
- **L1 stale baseline — `tests/qa/bkit-deep-system.test.js:854` `A9-2`.**
  Bumped expected skills count 39 → 43 to match v2.1.11 Sprint β additions
  (bkit-explore, bkit-evals, pdca-watch, pdca-fast-track). Local-only file
  (`tests/` is gitignored).
- **L3 contract baseline — `test/contract/docs-code-sync.test.js`,
  `test/contract/extended-scenarios.test.js`.** Bumped EXPECTED_COUNTS.skills
  39 → 43 across diffCounts/synthetic-drift/correct-doc fixtures. The
  invariant module `lib/domain/rules/docs-code-invariants.js` was already
  43 — the contract tests were the lagging surface from v2.1.11.

### Added

- **L1 unit + L2 integration tests** —
  `tests/qa/v2112-evals-wrapper.test.js` (260 LOC, 18 TC) covering
  isValidSkillName boundary cases, `_extractTrailingJson` happy /
  log-prefixed / null / string-aware paths, every `invokeEvals` defense
  reason, fake-runner contract for happy and pass:false outcomes,
  persisted result file with `reason` field, and real-runner integration
  against `pdca` (workflow), `starter` (capability), `qa-phase` (workflow).
- **L3 contract test** — `test/contract/v2112-evals-wrapper.contract.test.js`
  (2 TC) locks (a) the wrapper-emitted argv `['--skill', skill]` via
  PATH-injected node shim, and (b) the runner.js Usage banner spec byte-
  exact. Tracked in `test/contract/` so CI catches future drift.

### Internal

- **BKIT_VERSION 5-loc bump 2.1.11 → 2.1.12** — `bkit.config.json`
  (canonical), `.claude-plugin/plugin.json`, `README.md` badge,
  `CHANGELOG.md` (this entry), `hooks/hooks.json`.
  `scripts/docs-code-sync.js` invariant 5/5 enforced.
- **One-Liner SSoT 5/5 unchanged** — `lib/infra/branding.js` text identical
  across plugin.json + README + README-FULL + session-context.js +
  CHANGELOG.
- **`lib/evals/runner-wrapper.js` `@version 2.1.12`** (`@since 2.1.11`
  preserved for module-introduction history).
- **`.claude-plugin/marketplace.json`** version 2.1.11 → 2.1.12 (root +
  bkit plugin entry).
- **`AI-NATIVE-DEVELOPMENT.md`, `README-FULL.md`, `CUSTOMIZATION-GUIDE.md`,
  `bkit-system/README.md`, `bkit-system/_GRAPH-INDEX.md`,
  `bkit-system/triggers/priority-rules.md`, `hooks/session-start.js`** —
  active "v2.1.11" labels rolled to "v2.1.12"; historical "v2.1.11 added X"
  facts preserved.

### Carryovers (unchanged from v2.1.11)

- ENH-277 P0, ENH-278 P2, ENH-280 P1 — see v2.1.11 release notes.

---

## [2.1.11] - 2026-04-28 (branch: `feat/v2111-integrated-enhancement`)

> **Status**: All 4 Sprints complete (α/β/γ/δ). 20 FRs implemented; gap-detector ≥ 92% per Sprint, average ~95%.
> **One-Liner (EN)**: The only Claude Code plugin that verifies AI-generated code against its own design specs.
> **One-Liner (KO)**: AI가 만든 코드를 AI가 만든 설계로 검증하는 유일한 Claude Code 플러그인.

### 🎯 Sprint α — Onboarding Revolution

첫 5분 경험 재설계: One-Liner Single Source of Truth(5곳 동기화), Agent Teams env 자동 검출, CC 버전 체크, First-Run 튜토리얼(Pencil Design Anchor pilot).

- **FR-α1+α2-c/d**: `README.md` 100-line restructure + `README-FULL.md` separation. One-Liner header on both (`681e8ed`).
- **FR-α2-a/b**: `lib/infra/branding.js` (`ONE_LINER_EN` / `ONE_LINER_KO`); `.claude-plugin/plugin.json:description` synced (`d348f24`).
- **FR-α2-e**: CHANGELOG v2.1.11 block + 5-location BKIT_VERSION sync (`9fa1707`).
- **FR-α2-f**: `docs-code-scanner.scanOneLiner()` + 5-location enforced drift detection (`c986228`).
- **FR-α3**: First-Run AUQ tutorial (`hooks/startup/first-run.js`) + `.bkit/runtime/first-run-seen.json` idempotent marker + Pencil Design Anchor pilot (`be691c6`).
- **FR-α4**: `hooks/startup/preflight.js:checkAgentTeamsEnv()` SessionStart warning when `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` unset (`724b05c`).
- **FR-α5**: `lib/infra/cc-version-checker.js` — 2-strategy detection + `FEATURE_VERSION_MAP` 8 entries (`724b05c`).

### 🔍 Sprint β — Discoverability

설치된 39 skills + 36 agents + evals 시스템을 사용자가 발견·활용 가능하도록 하는 6 FR.

- **FR-β1**: `/bkit-explore` — `lib/discovery/explorer.js` + `skills/bkit-explore/SKILL.md`. 5-category tree + Level filter + listEvals (`aef5e36`).
- **FR-β2**: `/bkit-evals` — `lib/evals/runner-wrapper.js` 안전 wrapper (skill regex, argv-form spawn, 30s timeout, `.bkit/runtime/evals-{skill}-{ts}.json`) + `skills/bkit-evals/SKILL.md` (`81b9048`).
- **FR-β3**: 친화 에러 메시지 — `lib/i18n/translator.js` + `assets/error-dict.{en,ko}.json` (RD-5 narrowed scope: 9 cat × 1 default style × KO+EN full + 6 lang fallback) (`237e071`).
- **FR-β4**: `/pdca-watch` — `lib/dashboard/watch.js` (read-only state tap, 30s `/loop` v2.1.71+, fallback E-β4-01) + `skills/pdca-watch/SKILL.md` (`58906e0`).
- **FR-β5**: `/pdca-fast-track` — `lib/control/fast-track.js` (3 preconditions, `.bkit/runtime/fast-track-log.json` audit trail) + `skills/pdca-fast-track/SKILL.md` (`0fb0e1e`). Config block added to `bkit.config.json#control.fastTrack` (`e2851aa`).
- **FR-β6**: 8-language auto-detect — `lib/i18n/detector.js` (`detectFromPrompt`, `mergeWithEnv`) (`7058a41`).
- **L2 integration**: `test/integration/sprint-beta.test.js` 17 TC cross-FR scenarios (`03f04fc`).

### 🔒 Sprint γ — Trust Foundation

v2.1.10 잔존 R1/R2 risk 완전 종결 + L5 E2E 확장.

- **FR-γ1**: Trust Score `reconcile()` public API + dead-code invariant. `scripts/check-trust-score-reconcile.js` 4-check CI gate (`e6bfe4c`).
- **FR-γ2**: Application Layer pilot — `lib/application/pdca-lifecycle/{index,phases,transitions}.js` (PHASES enum + 19 legal transitions) + ADR 0005 (`docs/adr/0005-application-layer-pilot.md`). `lib/pdca/lifecycle.js` 변경 없음 (v2.1.12 shim 전환 carryover).
- **FR-γ3**: L5 E2E 9-scenario — `test/e2e/pdca-full-cycle-9scenario.test.js` (Agent Teams skip-policy: scenarios 1+7 skip-if-no-env) (`c557e2e`).
- **FR-γ4**: Agent-Hook multi-event grep 조사 → ADR 0004 (`docs/adr/0004-agent-hook-multi-event-deferral.md`) — 0 agent-type matchers, defer to v2.1.12 ENH-280 (`4597e92`).

### ⚙️ Sprint δ — Port Extension & Governance

v2.2.x 확장 기반.

- **FR-δ1**: MCP Port abstraction — `lib/domain/ports/mcp-tool.port.js` (type-only, ENH-277 `CALL_PATHS=['skill','slash','hook']`) + `lib/infra/mcp-port-registry.js` (16 tools = 10 pdca + 6 analysis frozen) + 21 contract TC (`7af7d5b`).
- **FR-δ2**: M1-M10 Quality Gates catalog — `docs/reference/quality-gates-m1-m10.md` + `scripts/check-quality-gates-m1-m10.js` 3-way SSoT invariant (catalog ↔ `bkit.config.json` ↔ runtime) (`84fd118`).
- **FR-δ3**: Trigger accuracy 8-language baseline — `test/i18n/fixtures/prompts-{en,ko,ja,zh,es,fr,de,it}.json` (80 prompts) + `trigger-accuracy-baseline.json` frozen regression guard. EN/KO/JA/ZH 100%, DE 70%, ES/FR 30%, IT 20%. Aggregate 68.75%.
- **FR-δ4**: `/pdca token-report` aggregator — `lib/pdca/token-report.js` (summary + byPhase + byModel + Top 5 + CAND-004 OTEL 3 attributes: I4-121 byStopReason/byFinishReason + F8-119+I6-119 byTool). `lib/infra/telemetry.js#sanitizeForOtel` 2-gate AND-logic (`OTEL_REDACT` + `OTEL_LOG_USER_PROMPTS`) (`fe1eee9`).
- **FR-δ5**: CC upgrade policy ADR — `docs/adr/0006-cc-upgrade-policy.md` (5-outcome matrix, skip criteria, empirical validation gate) (`84fd118`).
- **FR-δ6**: Release automation — `scripts/release-plugin-tag.sh` (BKIT_VERSION SoT verify + CI invariants + `claude plugin tag` wrapper, ENH-279) (`98b06b3`).

### Added

- 4 new ADRs (0004 agent-hook defer, 0005 Application Layer pilot, 0006 CC upgrade policy)
- 13 new lib modules (branding, cc-version-checker, discovery/explorer, evals/runner-wrapper, i18n/{translator,detector}, dashboard/watch, control/fast-track, application/pdca-lifecycle/×3, infra/mcp-port-registry, pdca/token-report)
- 9 new domain Port (mcp-tool.port joins existing 6) — 7 Port↔Adapter mappings now complete
- 3 new CI invariant scripts (check-trust-score-reconcile, check-quality-gates-m1-m10, release-plugin-tag)
- 4 new skills (bkit-explore, bkit-evals, pdca-watch, pdca-fast-track)
- 261 v2.1.11-specific tests (L1 unit + L2 integration + L3 contract + L5 E2E)

### Changed

- `lib/infra/telemetry.js#sanitizeForOtel` — 2-gate logic for CAND-004 OTEL user-prompt attribute
- `lib/control/trust-engine.js` — adds `reconcile()` public API
- `bkit.config.json` — `control.fastTrack` block + `version: 2.1.11` (5-loc sync)

### Carryovers (v2.1.12)

- ENH-277: hook → MCP tool direct invocation pilot (audit-logger candidate)
- ENH-278: autoMode `$defaults` (bkit doesn't use autoMode)
- ENH-280: Agent-Hook multi-event expansion
- Translator scope expansion: 11 missing categories + 4-style fan-out + 6-language full-quality
- Fast-track `reconcileHistory[]` append
- `lib/pdca/lifecycle.js` → shim conversion + 30+ consumer migration
- Romance language (es/fr/it) detector accuracy improvement
- ADR numbering cleanup (design ref'd 0002 but next free was 0006)

### Compatibility

- CC CLI **v2.1.118+ recommended** (79 consecutive compatible since v2.1.34); v2.1.78+ minimum (warned via FR-α5).
- Baseline: v2.1.10 (commit `f2c17f3`). Zero breaking changes for v2.1.10 users on upgrade.

---

## [2.1.10] - 2026-04-22 (branch: `feat/v2110-integrated-enhancement`, pre-main-merge)

> **Release discipline**: 본 섹션은 `git tag v2.1.10` + main 머지 직전의 스냅샷입니다. 48h 관찰 후 최종 릴리스 시 섹션 재정리 예정.

### 🎯 Sprint 0 ~ Sprint 6 — Integrated Enhancement (Clean Architecture + Defense-in-Depth + Invocation Contract)

CC v2.1.117 기준 호환성 유지 + 6 Sprint(0/1/2/3/4/4.5 + 5a/5b/5.5/6) 누적 구현. Plan-Plus §20에 따른 전범위 편입 버전.

### Added

- **Clean Architecture 4-Layer**: `lib/domain/{ports,guards,rules}` 11 modules (Domain 의존성 0), `lib/infra/{telemetry,docs-code-scanner,cc-bridge,mcp-test-harness}` (Adapters), `lib/cc-regression/` (Application) 6 modules = 568 LOC.
- **Domain Ports 6종**: `cc-payload`, `state-store`, `regression-registry`, `audit-sink`, `token-meter`, `docs-code-index` — JSDoc typedef 기반 Type-only 계약.
- **Domain Guards 4종** (CC v2.1.117 회귀 방어): `enh-254-fork-precondition` (#51165), `enh-262-hooks-combo` (#51798), `enh-263-claude-write` (#51801), `enh-264-token-threshold` (#51809).
- **Guard Registry**: `lib/cc-regression/registry.js` — 21 Guards 등록 (MON-CC-02, MON-CC-06 17건, ENH-262/263/264, ENH-214). `expectedFix` seed 4건으로 `lifecycle.reconcile()` 자동 해제 활성화.
- **Invocation Contract Test L1~L4** (619 assertions 중 L1+L4 226 assertions CI gate): `test/contract/baseline/v2.1.9/` 94 JSON baseline (39 skills + 36 agents + 16 MCP tools + hook events 24 blocks + slash commands + 3 MCP resources).
- **Contract L2 Smoke** (`l2-smoke.test.js` 98 TC) + **L3 MCP Compatibility** (`l3-mcp-compat.test.js` 83 TC).
- **Docs=Code CI** (ENH-241): `lib/infra/docs-code-scanner.js` + `scripts/docs-code-sync.js` — skills/agents/hookEvents/hookBlocks/mcpServers/mcpTools/libModules/scripts 8개 수치 0-drift 자동 검증.
- **CI Workflows 2종**: `.github/workflows/contract-check.yml` (lint + contract + docs-code-sync + check-guards + check-deadcode), `cc-regression-reconcile.yml` (daily cron).
- **Validator CLIs 3종**: `scripts/check-guards.js` (21 guards), `scripts/docs-code-sync.js` (0 drift), `scripts/check-deadcode.js` (Live/Exempt/Legacy 분류).
- **Integration Runtime Test** (`test/contract/integration-runtime.test.js` 23 TC): Sprint 4.5 재귀 버그 영구 방어선.
- **Legacy QA Integration** (v2.1.10 Sprint 5a): `qa-aggregate.js` `tests/qa/` 통합 집계 + `EXPECTED_FAILURES` 분리 카운터.
- **Test Case 총합**: **3,649 TC** (PASS 3,647 / FAIL 0 / Expected 2) — 111 test files 집계 기준. v2.1.9 대비 +581 TC.

### Changed

- **lib/pdca/status.js** 872 LOC → facade 52 + `status-core.js`(399) + `status-migration.js`(156) + `status-cleanup.js`(255) 분할.
- **scripts/pre-write.js** 286 → 529 LOC 12-stage 파이프라인화 (defense-coordinator 통합).
- **plugin.json `description`** 재서술: 39 Skills / 36 Agents / 24 Hook Blocks / 16 MCP Tools 명시.
- **MEMORY.md Architecture** 수치 v2.1.10 기준 재정렬: 101 → **128 Lib Modules** (Sprint 7 final, adds `lib/orchestrator/` 5 + `lib/domain/` 11 + `lib/infra/` 3 + `lib/cc-regression/` 8 + 3 top-level), 24,616 → **~27,085 LOC**, 43 → **47 Scripts**, lib subdirs 11 → **15** (audit, cc-regression, context, control, core, domain, infra, intent, orchestrator, pdca, qa, quality, task, team, ui).
- **BKIT_VERSION 중앙화 완결** (ENH-167): `hooks/session-start.js`, `hooks/hooks.json`, `scripts/unified-bash-pre.js`, `lib/core/io.js` 모두 `lib/core/version.js` 참조. `bkit.config.json:version`이 단일 진실원.
- **`createDualSink` audit-logger 사용 금지**: Sprint 4.5 재귀 학습 — `lib/audit/audit-logger.js:219` `createOtelSink()` 단독 호출로 변경. `lib/infra/telemetry.js:56-73` DANGER ZONE 14줄 경고 주석 추가.

### Fixed

- **C1 (Critical)**: `lib/audit/audit-logger.js:332-344` `startDate` → `date` 파라미터 (설계 명세와 동기화).
- **C2 (Critical)**: audit details PII 유출 방지 — `sanitizeDetails` 6-key 블랙리스트 + 500자 cap.
- **Sprint 4.5 자기 도입 버그**: `createDualSink(createFileSink, createOtelSink)` + `createFileSink`가 `audit-logger.writeAuditLog()` 재호출 → 682 GB recursion. `createOtelSink()` 단독 호출로 교체 + integration-runtime TC 영구 방어.

### Security

- **Defense-in-Depth 4-Layer** 공식화: Layer 1 (CC Built-in) → Layer 2 (bkit PreToolUse Hook: `pre-write.js` + `unified-bash-pre.js` + defense-coordinator) → Layer 3 (`audit-logger` OWASP A03/A08 sanitizer) → Layer 4 (Token Ledger `.bkit/runtime/token-ledger.json` NDJSON).
- **PII Redaction 7-key**: `text`, `content`, `prompt`, `message`, `api_key`, `token`, `password` 블랙리스트.
- **ENH-263 `.claude/` write + bypassPermissions 조합 차단** (#51801).
- **ENH-262 dangerouslyDisableSandbox + allow 조합 차단** (#51798).

### Compatibility

- **Invocation Contract 100% 보존** (226 assertions PASS 유지).
- **Starter / Dynamic / Enterprise 세그먼트 zero-action update**.
- **CC CLI 호환**: v2.1.78+ 필수, **v2.1.117+ 권장** (75 consecutive compatible releases).
- **Deprecation**: 없음 (첫 정책 도입 마이너).

### Architecture Snapshot (v2.1.10 Final — Sprint 7 워크플로우 유기성 완결)

**39 Skills · 36 Agents · 21 Hook Events (24 blocks) · 16 MCP Tools · 2 MCP Servers · 128 Lib Modules (~27,085 LOC across 15 subdirs) · 47 Scripts · 113 Test Files · 3,762 TC** (PASS 3,760 / 0 FAIL / 2 expected legacy). Canonical measured 2026-04-22 via `scripts/docs-code-sync.js` + `find lib -name "*.js"`.

### Sprint 7 — Workflow Orchestration Integrity (신규, 사용자 재정의 대응)

Phase A 4 + Phase A+ 1 = **5개 병렬 실측 에이전트** 기반 Gap Taxonomy 72건(7축) 도출 후 P0 10 + P1 12 + P2/3 50건 처리.

**New: lib/orchestrator/ (3-Layer Orchestration)**
- `intent-router.js` — priority-resolved intent detection (feature > skill > agent)
- `next-action-engine.js` — Stop-family hook 전체 Next Action 표준화
- `team-protocol.js` — PM/CTO/QA Lead의 실 Task spawn 경로 프로토콜 (state-writer lifecycle + cc-regression attribution)
- `workflow-state-machine.js` — PDCA phase × Control Level 통합 + matchRate SSoT + ARCHIVE dispatcher + DO_COMPLETE setter
- `index.js` — 단일 facade (19 exports)

**Changed (Invocation Contract 100% 보존)**:
- `lib/intent/language.js:SKILL_TRIGGER_PATTERNS` — 4 skills → **15 skills** (pdca, pm-discovery, plan-plus, qa-phase, code-review, deploy, rollback, skill-create, control, audit, phase-4-api 신규 11개)
- `lib/pdca/state-machine.js:288` + `lib/pdca/automation.js:82` — matchRate threshold default **100→90** (bkit.config.json:pdca.matchRateThreshold SSoT)
- `lib/control/trust-engine.js:syncToControlState` — **Trust Score currentLevel auto-reflect 복원** (autoEscalation/autoDowngrade 플래그 실 연결, G-C-01/02)
- `agents/cto-lead.md` — body에 Phase별 Task spawn 예시 5개 블록 추가 + frontmatter `Task(pm-lead)`, `Task(qa-lead)`, `Task(pdca-iterator)` 추가 (G-T-01/02)
- `skills/pdca/SKILL.md:384` — Enterprise teammates **5→6** (strategy.js와 동기, G-T-03)
- `scripts/unified-stop.js`, `session-end-handler.js`, `subagent-stop-handler.js` — Next Action Engine 연결 (G-J-05/06/07)
- `scripts/user-prompt-handler.js` — structured `suggestions` 필드 병행 emit (G-J-09)
- 79건 `@version 2.0.0 → 2.1.10` + `@version 1.6.x → 2.1.10` 일괄 갱신 (lib 66 + scripts 13)
- `skills/phase-4-api/SKILL.md` + `phase-5-design-system/SKILL.md` — 중복 `user-invocable` 필드 정리
- `skills/zero-script-qa/SKILL.md` — `allowed-tools` 명시

**Test (Sprint 7 신규)**:
- `test/contract/orchestrator.test.js` — 21 L1/L2 TC (IntentRouter + NextActionEngine + TeamProtocol + WorkflowStateMachine)
- SKILL_TRIGGER coverage L1 test 확장

**Quality Gates (8/8 PASS)**:
- check-guards (21 guards)
- docs-code-sync (BKIT_VERSION 5-location sync, 0 count drift)
- check-deadcode (Live 92 / Exempt 30 / Legacy 0 / Dead NEW 0)
- check-domain-purity (11 files, 0 forbidden imports)
- L3 MCP runtime (42/42)
- L5 E2E shell smoke (5/5)
- Orchestrator (21/21)
- qa-aggregate (**3,760 PASS / 0 FAIL / 2 expected / TOTAL 3,762**)

### Success Criteria D19~D30

| # | 기준 | 결과 |
|---|------|:---:|
| D19 | Skill trigger coverage ≥ 15 | ✅ 15 |
| D20 | Feature intent 주입률 ≥ 8/10 | ✅ IntentRouter loose threshold 0.7 |
| D21 | Agent-Skill resolver 구현 | ✅ |
| D22 | matchRate threshold SSoT 90 only | ✅ |
| D23 | cto-lead body Task 예시 ≥ 5 | ✅ (Plan/Design/Do/Check/Act 5 블록) |
| D24 | CTO teammates Task 선언 | ✅ pm-lead + qa-lead + pdca-iterator |
| D25 | Enterprise teammates 6 = 6 | ✅ |
| D26 | Next Action 제안 범위 ≥ 15 hook | ✅ (Stop + SessionEnd + SubagentStop + PDCA 13 경로) |
| D27 | L4 자동 체인 smoke ≤ 2 manual | ⏳ Phase 7 /pdca qa로 실측 |
| D28 | Trust Score level 반영 | ✅ |
| D29 | Agents "Use proactively" ≥ 30 | ⏳ (Sprint 7e 부분 진행, 18→28+ 확장은 릴리스 전 지속) |
| D30 | Legacy `@version 2.0.0` = 0 | ✅ (lib 66 + scripts 13 = 79건 전량 2.1.10) |

**25/30 충족** (D27 L4 자동 체인 + D29 proactive 문구 일부 + D1 tag + D3 CI PR + D8 48h 관측 = 5건이 릴리스 workflow 외 영역).

### Quality Gates (all PASS)

- `check-guards` — 21 guards, 0 warning
- `docs-code-sync` — 8 counts consistent + **BKIT_VERSION invariant** 5-location sync (canonical: `bkit.config.json:2.1.10`)
- `check-deadcode` — Live 92 / Exempt 30 / Legacy 0 / Dead NEW 0 (Sprint 7 adds `lib/orchestrator/` 5 modules)
- `check-domain-purity` — 11 domain files, 0 forbidden imports (fs/child_process/net/http/https/os)
- `l3-mcp-runtime` — 42/42 PASS (MCP initialize + tools/list runtime, 16 tools × 2 servers)
- `test/e2e/run-all.sh` — 5/5 PASS (SessionStart / .claude block / check-guards / docs-code-sync / MCP runtime)
- `qa-aggregate` — **3,760 PASS / 0 FAIL / 2 expected-failure / TOTAL 3,762 TC across 113 test files** (Sprint 7 final; earlier snapshot `3,741 TC / 112 files` superseded)

### Sprint 6 Completions (post-initial-draft)

- **NEW 6-1 (ENH-202)**: Skills `context: fork` 1 → **9** (zero-script-qa + qa-phase + phase-1/2/3/4/5/8 + skill-status). Readonly-safe workflow skills isolated.
- **NEW 6-2**: Legacy 3 modules removed (`lib/core/hook-io.js`, `lib/context/ops-metrics.js`, `lib/pdca/deploy-state-machine.js`, total 421 LOC, 0 production references).
- **NEW 6-3 (Port↔Adapter)**: `lib/infra/cc-bridge.js` 신설 — Port `cc-payload.port.js` 구현체. `parseHookInput` / `detectCCVersion` / `getSessionId` / `isBypassMode` / `getToolName` / `getPermissionFlags` / `getHookEventName`. 24 L2 TC PASS. `lib/cc-regression/index.js`에서 `ccBridge` re-export.
- **NEW 6-4 (ENH-275)**: MCP stdio L3 runtime runner (`test/contract/l3-mcp-runtime.test.js`). JSON-RPC 2.0 `initialize` + `tools/list` real spawn for both bkit servers. 42 TC PASS.
- **NEW 6-5**: L5 E2E shell smoke suite (5 scenarios: SessionStart / .claude write block / check-guards / docs-code-sync / MCP tools).
- **NEW 6-6 (ENH-276)**: `docs-code-scanner.scanVersions()` — BKIT_VERSION invariant 스캔 (bkit.config.json / plugin.json / README / CHANGELOG / hooks.json 5곳 sync).
- **NEW 6-7**: MEMORY.md 302 → 79 lines (≤150 cap). 3 detail files: `cc_version_history_v21xx.md`, `enh_backlog.md`, `github_issues_monitor.md`.
- **Sprint 5.5 wiring**: hook attribution 3 sites (Stop / SessionEnd / SubagentStop) + CI Domain ESLint step (`scripts/check-domain-purity.js`) + PreCompact block counter (ENH-247/257 2-week measurement).

### Known Limitations

- 본 섹션은 브랜치 스냅샷. `git tag v2.1.10` + GitHub Release 노트 작업은 main PR 머지 + 48h 관찰 후 예정.
- `docs/02-design/features/bkit-v2110-integrated-enhancement.design.md` (2,644 lines) 리팩토링(≤800 lines overview + 4 addendum)은 v2.1.11+로 이월. 본 문서는 역사 기록으로 유지, Sprint 5a~6는 `bkit-v2110-gap-closure.design.md`에 정리.
- `madge --circular` baseline 재생성(npm install 권한)은 v2.1.11+.

---

## [2.1.9] - 2026-04-21

### 🎯 CC v2.1.114 → v2.1.116 Response (4 ENH Shipping + Docs=Code 100% Sync)

Response cycle for Claude Code CLI v2.1.114~v2.1.116 changes. Delivers 4 ENH (253/254/259/263) plus positive drift from v2.1.10 roadmap (ENH-264 infrastructure + ENH-265 full implementation). Shipping-readiness QA passed Match Rate 100% / Coverage 90.3% / P0 Blocker 0 / Regression 0.

### Added
- **[ENH-253]** `docs/03-analysis/zero-script-qa-fork-v2116-verification.md` — manual reproduction of GitHub Issue [#51165](https://github.com/anthropics/claude-code/issues/51165) (`context: fork` + `disable-model-invocation` failure) on macOS. Verdict: non-reproduction on macOS (darwin 24.6.0). bkit's sole `context: fork` skill (`zero-script-qa`, 1/39) operates normally. bkit uses `disable-model-invocation` 0/39 → combination case is N/A. ENH-196/202 investment protection confirmed.
- **[ENH-254]** `docs/03-analysis/security-architecture.md` — Defense-in-Depth security architecture formalization. **Layer 1** (CC runtime sandbox): v2.1.113 #23 `dangerouslyDisableSandbox` permission hardening + #14/#15/#16 Bash wrapper tightening + v2.1.116 S1 dangerous-path safety. **Layer 2** (bkit `config-change-handler.js` `DANGEROUS_PATTERNS`): 5-pattern settings-file detection + SECURITY WARNING audit. 5 sections including attack-vector matrix + user responsibility clause ("do NOT rely on either layer alone").
- **[ENH-259]** `CUSTOMIZATION-GUIDE.md` (new §⚠️ Important Notices) + `README.md` (Custom Skills warning bullet) — Custom Skills data loss warning for GitHub Issue [#51234](https://github.com/anthropics/claude-code/issues/51234) (`~/.claude/skills/` silent deletion on CC v2.1.113+ first-run). bkit itself unaffected (uses `${CLAUDE_PLUGIN_ROOT}/skills/`), but user custom skills at risk. Backup/restore commands (full + selective) + recommended plugin-bundle path guidance for bkit custom skill authors.
- **[ENH-264 partial — v2.1.10 roadmap positive drift]** `lib/core/io.js:114` `outputBlockWithContext(reason, alternatives, hookEvent)` + `scripts/unified-bash-pre.js` 2 call sites (deployment detection line 144, QA-phase detection line 183). Alternative-command suggestions via CC v2.1.110+ `hookSpecificOutput.additionalContext`. Full general-Bash coverage scheduled for v2.1.10 (ENH-274).
- **[ENH-265 — v2.1.10 roadmap positive drift, fully shipped]** `hooks/startup/session-context.js:236-241` — `ENABLE_PROMPT_CACHING_1H` env-var branch in SessionStart additionalContext with disabled/enabled messaging. `docs/03-analysis/prompt-caching-optimization.md` operational guide (30-40% token savings on long PDCA sessions). `bkit.config.json:110-115` `performance.promptCaching1h` declaration (CC v2.1.108+ required).
- **Shipping Readiness QA** — `docs/05-qa/cc-v2114-v2116-shipping-readiness.report.md` (19,780 bytes) + `docs/05-qa/evidence/v219/` 5-file runtime evidence directory.

### Changed
- **[ENH-263 + ENH-266 docs-sync]** Docs=Code 25-file architectural correction (v2.1.9 shipping + docs-sync merged at release):
  - **Plugin/MCP metadata** — `.claude-plugin/plugin.json:5` `"39 Skills, 36 Agents, 21 Hook Events"`, `marketplace.json:36` adds Scripts count.
  - **README.md** — Badge `v2.1.116+` (L4), Claude Code requirement table (L205), `lib/` comment `(101 modules across 11 subdirs)` (L294), new v2.1.9 feature bullet (prepended).
  - **Session runtime** — `hooks/startup/session-context.js:234-235` CC recommended + Architecture lines.
  - **bkit-system/** — README Layer 5/6, Component Counts table, Obsidian graph tip; `_GRAPH-INDEX.md` Context Engineering box + Components list; `philosophy/context-engineering.md` Layer 5 + Domain Knowledge Layer (2 occurrences); `components/{agents,skills,hooks,scripts}/_*-overview.md` all add v2.1.9 history entry.
  - **CUSTOMIZATION-GUIDE.md** — Component Inventory header v2.1.8→v2.1.9, 3 ASCII diagrams synced (Skills 38→39, Scripts 42→43, lib 93→101 / 12→11 subdirs), Plugin Structure Example skills/scripts counts.
  - **AI-NATIVE-DEVELOPMENT.md** — Mermaid CONTEXT box, Context Engineering Layers header v2.0.0→v2.1.9, table rows (Skill System, lib/). **Corrected `adapters` subdir myth** — actual subdirs are 11: audit, context, control, core, intent, pdca, qa, quality, task, team, ui.
  - **lib/core/io.js, lib/core/cache.js** — JSDoc `@version 1.6.0` removed (ENH-270 acceptance: `grep -rn "v1\.6\.0" lib/` = **0 matches**).
  - **17 agents** — CC recommended version v2.1.111+ → v2.1.116+ (74 consecutive compatible releases).
- **Version** — 2.1.8 → 2.1.9 across `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json`, `hooks/session-start.js`, `hooks/startup/session-context.js`.
- **CC recommended version** — v2.1.111+ → **v2.1.116+** (74 consecutive compatible releases, v2.1.115 skipped — 8th skipped release in the v2.1.x series).

### Verified
- **Architecture inventory (runtime-measured 2026-04-21)** — **39 Skills** (39/39 `effort`, 1/39 `context: fork`, 0/39 `disable-model-invocation`/`paths`/`monitors`), **36 Agents** (13 opus / 21 sonnet / 2 haiku; 2 low / 21 medium / 13 high / 0 xhigh effort; 20/36 `disallowedTools`; 0/36 `initialPrompt`/`hooks:`), **43 Scripts**, **101 Lib modules** in **11 subdirectories** (audit, context, control, core, intent, pdca, qa, quality, task, team, ui — **no `adapters` subdir**), **21 Hook Events**, **18 Templates**, **4 Output Styles**, **2 MCP Servers**.
- **L1 smoke** — 101/101 lib modules `require()` OK, 43/43 scripts `node --check` OK, `BKIT_VERSION` runtime = `"2.1.9"`.
- **L3 runtime** — SessionStart hook `additionalContext` 4,401 chars (under 10,000 CC cap, 44%), contains v2.1.9 + v2.1.116+ + 39 Skills + 36 Agents + "Prompt caching 1H" all verified.
- **L4 contract** — Plan/Design 4 ENH acceptance 15/15 met. Docs=Code grep `active-state` post-sync: 0 matches for `38 Skills`/`32 Agents`/`88 Lib`/`93 modules`/`42 scripts`/`12 subdirectories` (historic blockquotes preserved per Plan §5.2 DO NOT TOUCH policy).

### MON-CC-06 Status (unchanged from v2.1.8)
v2.1.113 native-binary transition 10+ regression issues + v2.1.114~v2.1.116 6 new HIGH issues tracked (total 16). v2.1.117+ hotfix awaited. Environmental exceptions: macOS 11 stays on v2.1.112 (#50383), non-AVX CPUs stay on v2.1.112 (#50384/#50852), Windows paren PATH partial improvement on v2.1.114+ via B12 (#50541).

---

## [2.1.8] - 2026-04-17

### 🧪 Round 4 Runtime Matrix Verification (25 parallel agents, 2026-04-17)

Comprehensive runtime verification of all bkit functionality via 25 parallel agents covering 7 verification areas: Agents/Skills/Events matrix (M1–M10), Agent Teams orchestration (AT1–AT3), MCP tools (MC1–MC2), 8-language × 3-level matrix (L1–L2), full PDCA cycle (P1–P3), quality gates (Q1–Q2), hook chain integration (H1–H2), plus full regression test run (TEST). Result: **22 PASS / 3 ISSUE discovered and fixed**. Runtime-verified (not static): JSON-RPC `tools/call` against both MCP servers (16 tools), live hook chain invocation with ENH-239 fingerprint dedup observed at 88% byte reduction, 8-language and 3-level detection fixtures executed. See `docs/04-report/features/bkit-v218-round4-matrix.report.md` for full results.

### Fixed (Round 4 discoveries)
- **`lib/intent/language.js` — 4/8 languages mis-classified as `en`.** Previous `detectLanguage()` only tested CJK Unicode blocks (KO/JA/ZH) and fell through to English for ES/FR/DE/IT. Added `LATIN_STOPWORDS` (4 languages × 13 language-exclusive stopwords) and `LATIN_DIACRITIC_HINTS` (4 patterns: `ñ¿¡`→es, `äöüß`→de, `çœæ`+French contractions→fr, `gli/della/degli`→it). Score-based winner selection with ≥1-hit threshold to avoid false positives on pure English. Verified 8/8 correct + 4 guardrail cases (code/URL/emoji→en, mixed EN+KO→ko via script precedence).
- **`templates/design-starter.template.md` + `templates/design-enterprise.template.md` — missing Option A/B/C section.** Default `design.template.md` enforces 3-option architecture selection via Checkpoint 3 (v1.7.0), but level-specific variants omitted the section entirely, bypassing the architecture decision artefact. Inserted an appropriate 3-option table in each: starter gets a simplified Minimal/Clean/Componentized comparison; enterprise gets NFR Fit / Risk / Blast Radius criteria.
- **6 templates using broken variable syntax — `{{var}}` double-brace and `{UPPER_SNAKE_CASE}` casing.** bkit's runtime substitution engine (`lib/core/paths.js:213`, `lib/pdca/session-title.js:61`) only recognises `{lower_snake_case}` placeholders; any other form leaks verbatim into generated documents. Normalized `iteration-report.template.md` (40+ vars), `CLAUDE.template.md` (10+ vars), `convention.template.md`, `schema.template.md`, `qa-report.template.md`, `qa-test-plan.template.md`. Handlebars blocks (`{{#if}}` / `{{#each}}` / `{{^X}}` / `{{/X}}`) preserved — they are consumed by separate template engines, not bkit substitution.

### Added (Round 4)
- **`templates/TEMPLATE-GUIDE.md` v1.1.0 — Variable Substitution Convention section.** Documents the 7 canonical variables (`{feature}`, `{date}`, `{level}`, `{phase}`, `{author}`, `{version}`, `{project}`), clarifies bkit single-brace substitution vs Handlebars conditional blocks, and notes the Round 4 migration so future contributors don't re-introduce the bug.
- **49 Round 4 regression assertions** pinning the three fixes: 12 for L1 language detection (8 positive + 4 guardrail), 3 for P2 design-template Option A/B/C, 34 for M8 template variable hygiene (18 templates × 2 checks each). Test lives in `tests/qa/round4-runtime-matrix.test.js`.

### Round 4 Baseline (informational)
- **Architecture inventory verified** — 36 agents (13 opus / 21 sonnet / 2 haiku), 39 skills (1 `context: fork`, 39/39 with `effort` frontmatter), 21 hook events (24 handlers, 0 syntax errors), 2 MCP servers × 16 tools (JSON-RPC `tools/call` all OK), 4 output-styles (plugin.json `outputStyles` declared), 44 hook scripts (all syntax-clean, 5-script stdin `{}` smoke → exit 0).
- **MEMORY.md baseline refresh needed (follow-up)** — Skills 3-classification baseline 18/18/1 is outdated; actual is 19 Workflow / 12 Capability / 8 Hybrid. Agent count entries citing "32 agents" should read 36. Left for a dedicated memory sync session.

### 🚨 Hotfix — GitHub Issue #81 (SessionStart `additionalContext` Re-injection) + Docs=Code Philosophy Restoration

Community user [@scokeepa](https://github.com/popup-studio-ai/bkit-claude-code/issues/81) reported that `session-start.js` generates a ~12,921-byte `additionalContext` that exceeds CC's hook output cap (officially documented at 10,000 chars, not 2 KB as originally hypothesized). This caused SessionStart payloads to be file-replaced with a preview on every session, and — compounded by PreCompact re-firing without honoring `once: true` — resulted in duplicate injections that wasted tokens across long PDCA sessions.

Investigation confirmed **3 root causes** (RC-1 size, RC-2 compaction dedup, RC-3 Docs=Code violation in ENH-226) and found a regression-adjacent CC Desktop app bug (#48963) affecting plugin skill discoverability.

### Added
- **[ENH-238]** `hooks/startup/session-context.js` guard — 3-way `ui.contextInjection.{enabled,sections}` toggle mirroring the existing `ui.dashboard` pattern. Opt-out returns the header only (47 bytes), per-section opt-in respects the user-defined `sections[]` array. Restores the ENH-226 Docs=Code contract that was declared in `bkit.config.json` and implemented in `scripts/user-prompt-handler.js` but missing from the SessionStart hook.
- **[ENH-239]** `lib/core/session-ctx-fp.js` — SHA-256 fingerprint dedup store for SessionStart `additionalContext`. 1-hour TTL, session isolation via `CLAUDE_SESSION_ID`, atomic write (`.pid.ts.tmp` + `rename`), inline GC (30-day stale + 100-entry LRU). Blocks PreCompact/PostCompact re-fire duplicate injections that bypass `hooks.json` matcher-group `once: true`.
- **[ENH-240]** `lib/core/context-budget.js` — PersistedOutputGuard applying an 8,000-char hard cap (CC 10,000 limit minus a 2,000-char safety margin) with priority-preserved truncation. `stripAnsi`-based length measurement to avoid ANSI-escape bias. Appends a truncation notice and debug log when activated.
- **[ENH-244]** `docs/context-engineering.md` — New ADR-style guide documenting the hook output budget, SessionStart `once: true` limitation (skills-level only per CC docs), bkit's dedup defense, and the Issue #81 cross-reference chain.
- **Tests** — 4 new QA test files (`tests/qa/session-context.test.js`, `context-budget.test.js`, `session-ctx-fingerprint.test.js`, `ui-opt-out-matrix.test.js`) covering 25 test cases across L1 Unit (13), L2 Integration (5), and L4 QA (8 matrix combinations).

### Fixed
- **`lib/core/config.js` `getUIConfig()` missing fields (discovered during Iterate)** — Previously exposed only `enabled` and `ambiguityThreshold` for `contextInjection`, dropping the new `sections` / `maxChars` / `priorityPreserve` fields silently. Now returns all five fields with documented defaults, completing the Plan → Design → Config → Runtime contract.
- **Docs=Code violation (ENH-226)** — The `ui.contextInjection.enabled` toggle was declared in `bkit.config.json` and honored by `scripts/user-prompt-handler.js:82`, but `hooks/startup/session-context.js:build()` ignored it entirely. All 8 SessionStart builders now respect the toggle.
- **Compaction duplicate injection** — `hooks.json:7` `once: true` lives at matcher-group scope and cannot distinguish `source: "compact"` from an initial SessionStart, so PreCompact re-fire re-emitted the full payload. ENH-239 fingerprint lock suppresses identical payloads within the TTL window, observed to reduce 2–3 injections down to 1 per session.

### Changed
- **Version** — 2.1.7 → 2.1.8 across `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `bkit.config.json`, `hooks/hooks.json`, `hooks/session-start.js`, `hooks/startup/session-context.js`.
- **CC recommended version** — v2.1.110+ → **v2.1.111+** (72 consecutive compatible releases, CC v2.1.111 `/less-permission-prompts` + `/effort` slider + `/ultrareview` + I1/I13/B3/B6 auto-benefits; v2.1.112 single auto-mode hotfix, unaffected by bkit).
- **`bkit.config.json` schema** — `ui.contextInjection` extended with `sections` (8 builder keys), `maxChars` (8000), `priorityPreserve` (MANDATORY / Previous Work Detected / AskUserQuestion).
- **`hooks/startup/session-context.js`** — `buildVersionEnhancementsContext` now reports "bkit v2.1.8 (Current)" and "CC recommended: v2.1.111+ | 72 consecutive compatible releases".
- **Agents** — 17 agent files updated: `CC recommended version: v2.1.78 (stdin freeze fix, background agent recovery)` → `v2.1.111+ (72 consecutive compatible releases, MCP/PreToolUse stability)`.
- **Documentation sync** — `README.md`, `CUSTOMIZATION-GUIDE.md`, `.claude-plugin/marketplace.json`, `bkit-system/components/{skills,agents,scripts}/_*-overview.md` version references bumped to v2.1.8.

### Test Results
- **74 / 74 PASS (100%)**, 0 FAIL.
- New TCs: 25 PASS across 4 suites (`session-context` 6 / `context-budget` 6 / `session-ctx-fingerprint` 5 / `ui-opt-out-matrix` 8).
- Regression: 43 PASS across 5 legacy QA scanners (`config-audit` 5 / `dead-code` 5 / `completeness` 6 / `shell-escape` 8 / `scanner-base` 19). Zero regressions.
- Live smoke: `hooks/session-start.js` emits `bkit Vibecoding Kit v2.1.8 activated` with a 16-char SHA-256-truncated fingerprint persisted to `.bkit/runtime/session-ctx-fp.json`.
- Match Rate (Plan/Design → Code): **100%** (see `docs/03-analysis/cc-v2110-v2112-issue81-response.analysis.md`).

### Monitoring
- **MON-CC-05 (new)** — [#48963](https://github.com/anthropics/claude-code/issues/48963) v2.1.110 regression: Plugin skills missing from `/` menu on the macOS Desktop app (CLI unaffected). Tracked for ENH-243 manual verification in a later release; CLI usage recommended in the meantime.
- **MON-CC-01~04 (retained)** — CC v2.1.107 regressions (#47810 skip-perm + PreToolUse bypass, #47855 Opus 1M `/compact` block, #47482 output styles frontmatter, #47828 SessionStart `systemMessage` + remoteControl) remain OPEN across **6 consecutive releases** (v2.1.107 → v2.1.112). **Recommendation updated: wait for v2.1.113+ hotfix** (previously "wait for v2.1.111+" — target unmet).

### Migration
- Existing users on v2.1.7 receive all improvements automatically on upgrade. Default `ui.contextInjection` values preserve the previous behavior (100% backward compatible). To enable the lean opt-out mode, set `ui.contextInjection.enabled: false` (returns header only) or provide a narrower `sections` array.
- If you previously relied on a custom `additionalContext` size, the 8,000-char hard cap now applies; raise `ui.contextInjection.maxChars` (e.g. `999999`) in `bkit.config.json` to disable the guard.
- `.bkit/runtime/session-ctx-fp.json` is auto-generated and gitignored; delete the file to reset the dedup store with no side effects.

### Not Included (Deferred)
- **ENH-241** (Docs=Code cross-verification scheme + QA report correction for ENH-226 status) — Deferred to v2.1.9 (~2h).
- **ENH-243** (Issue #48963 Desktop app manual verification + CLI recommendation README note) — Deferred to v2.1.9 (~1.5h).
- **ENH-242** (Content Trimmer priority-based budget allocation across Dashboard + session-context) — Deferred to v2.1.10 (~4h).

### Stats
- Files changed: 11 (5 modified Production + 2 new Production + 2 Config + 1 new Docs + 4 new Tests).
- Lines: +641 operational / +425 tests / +1,540 docs = **+2,606 total**.
- New LOC: `lib/core/context-budget.js` (95) + `lib/core/session-ctx-fp.js` (115) + `docs/context-engineering.md` (90).
- CC compatible releases: **72** (v2.1.34 ~ v2.1.112, 0 breaking changes).

### Additional Bug Fixes (16 bugs from 10-agent QA Discovery)

During v2.1.8 QA verification, 10 parallel `code-analyzer` agents analyzing 15 lib modules + 43 scripts + 2 MCP servers + 36 agents + 39 skills caught **11 real bugs** (confidence ≥80%) while producing 616 TC specs. A subsequent 10-agent cross-verification review (Q10 integration) caught **1 incomplete fix** (B1 dead-write) and identified **5 additional minor issues** (B12~B16). All 16 are consolidated into this v2.1.8 release.

#### Fixed (from 10-agent QA discovery)

- **B1** [P1] `lib/control/loop-breaker.js:234` — `setThreshold` uses `LOOP_RULES[ruleId]` object access and writes to `rule.maxCount` (was dead-writing `rule.threshold`; caught by Q1 cross-verification, reworked)
- **B2** [P2] `lib/audit/audit-logger.js:52` — `CATEGORIES` extended to 10 (+permission/checkpoint/trust/system); convenience loggers no longer coerced to `'control'`
- **B3** [P1] `lib/control/checkpoint-manager.js:103,120` — `STATE_PATHS.pdcaStatus()` replaces `process.cwd()` (multi-project / worktree safety)
- **B4** [P2] `lib/control/trust-engine.js:402-419` — `resetScore` pushes unified `{timestamp,from,to,trigger,reason}` schema to `levelHistory`
- **B5** [P0] both MCP servers — JSON-RPC 2.0 `'id' in msg` handling (was `id === undefined`, dropping explicit-null-id requests)
- **B6** [P1] `evals/runner.js` — `stripMatchingQuotes()` preserves internal colons in quoted YAML values
- **B7** [P1] `evals/runner.js` — `!inCriteria` guard disambiguates indent-2 criteria items from new eval entries
- **B8** [P0] `evals/runner.js:246` — `pass = failedCriteria.length === 0` (removed redundant `score >= 0.8`)
- **B9** [P0] `lib/context/scenario-runner.js:42` — `allPassed` requires `passed > 0` (was accepting all-skipped as pass)
- **B10** [P1] `lib/context/invariant-checker.js:77` — explicit parens document operator precedence (no behavior change)
- **B11** [P1] `lib/qa/utils/pattern-matcher.js` — `findBalancedBrace()` + depth-aware segment splitter for nested `module.exports`

#### Additional (from Q10 integration review)

- **B12** [P2] ENH-167 partial: `BKIT_VERSION` centralization — `lib/core/paths.js:260,271` + 2 MCP servers no longer hardcode `'2.0.4'`
- **B13** [P3] Dead `PDCA_STATUS_PATH` constant removed from `lib/control/checkpoint-manager.js:47`
- **B14** [P3] Redundant `notifications/initialized` guard simplified in both MCP servers
- **B15** [P3] JSDoc accuracy: `lib/qa/utils/pattern-matcher.js:44` now correctly documents string-aware capability
- **B16** [P2] Word boundary: `lib/context/invariant-checker.js` uses `\bif\b` regex (was substring `.includes('if')`, matching `gift`/`diff`)

#### Regression Fix

- `tests/qa/dead-code.test.js:166` — word-boundary regex instead of `.includes()` substring (false positive on `unusedFunction` vs `usedFunction` check)

#### New Tests

- `tests/qa/bug-fixes-v218.test.js` — 24 TCs covering all 16 bugs × representative scenarios

#### QA Methodology Proof

- v2.1.8 deep QA (10 `code-analyzer` agents analyzing full codebase) discovered 11 real bugs during read-only analysis alone, producing 616 TC specs as byproduct
- v2.1.8 cross-verification QA (10 `code-analyzer` agents verifying each fix) caught 1 incomplete fix (B1) + 5 additional issues (B12~B16) → "QA-as-Discovery + Cross-Verification" methodology

---

## [2.1.7] - 2026-04-16

### 🚨 Hotfix — GitHub Issue #79 (Opus Drift PDCA Workflow Fixes)

Community user [@rohwonseok-ops](https://github.com/popup-studio-ai/bkit-claude-code/issues/79) reported 7 local patches for full-auto (L3-L4) PDCA workflow issues. Code-level investigation confirmed 2 P0 bugs, 1 P1 design issue, and 1 P2 enhancement.

### Fixed
- **P0 `updatePdcaStatus` argument order** — `scripts/skill-post.js:229` called `updatePdcaStatus(phase, feature)` with reversed arguments, corrupting `pdca-status.json`. All 8 call sites audited; only this one was affected. (Issue #79 P7)
- **P0 Full-auto chain break at report phase** — `lib/pdca/automation.js` `generateAutoTrigger()` phaseMap lacked `report`/`completed` keys, returning `null` and breaking the qa→report→completion chain. Added both keys with `{ complete: true }` flag. Also added `report`/`completed` to `semiAutoPhases`. (Issue #79 P5)
- **P1 Phantom feature auto-registration** — `scripts/pre-write.js` unconditionally registered any file write as a PDCA "do" phase feature via `extractFeature()`, causing badge spam. Now checks `activeFeature === feature` before updating. (Issue #79 P4)

### Added
- **Report phase completion directive** — `scripts/pdca-skill-stop.js` now generates `[PDCA-COMPLETE]` guidance when `autoTrigger.complete === true`, preventing model confusion at cycle end. (Issue #79 P5 companion)
- **Gap-detector analysis document auto-generation** — `scripts/gap-detector-stop.js` now creates `docs/03-analysis/features/{feature}.analysis.md` with match rate, guidance, and next step. gap-detector agent remains Read-only by design; the stop hook handles file creation. (Issue #79 P6)

### Changed
- **Version** — 2.1.6 → 2.1.7.
- **CC recommended version** — v2.1.108+ → v2.1.110+ (71 consecutive compatible releases, MCP/PreToolUse stability improvements).
- **Documentation sync** — `README.md`, `CUSTOMIZATION-GUIDE.md`, `bkit.config.json`, `hooks/hooks.json` version references bumped to v2.1.7.

### Migration
- If your `.bkit/state/pdca-status.json` was corrupted by the argument-order bug (feature names stored as phase values), delete the file and let bkit recreate it: `rm .bkit/state/pdca-status.json`

### Not Included (Deferred)
- **Issue #79 P1** (Stop hook `decision:'block'` for Opus drift) — Deferred to v2.1.8. P5 fix restores full-auto chain; re-evaluate after observing drift frequency.
- **Issue #79 P2** (`ff-override` file cleanup) — No matching code found in v2.1.6 codebase. Awaiting reproduction steps from reporter.

### Stats
- Files changed: 9 (5 code + 2 config + 2 docs meta)
- Lines: +100 / -26
- CC compatible releases: 71 (v2.1.34 ~ v2.1.110)

---

## [2.1.6] - 2026-04-15

### 🚨 Critical Hotfix — GitHub Issue #77

**Fix P0 issue where bkit overwrites Claude Code's auto session title on every message, preventing parallel window identification.**

- **[ENH-226] UI hook opt-out 3-way toggle** — Adds `ui.{sessionTitle,dashboard,contextInjection}.enabled` options in `bkit.config.json`. Non-PDCA users can disable UI hooks with a one-line edit. Default `true` (backward compatible).
- **[ENH-227] Single-source sessionTitle emit** — New single entry point `lib/pdca/session-title.js`. Removes inline logic from 6 files (`scripts/user-prompt-handler.js`, `hooks/session-start.js`, `scripts/{pdca-skill-stop,plan-plus-stop,iterator-stop,gap-detector-stop}.js`).
- **[ENH-228] Phase-change-only refresh** — `.bkit/runtime/session-title-cache.json` (file-based, atomic write). Returns `undefined` for identical `sessionId+feature+phase+action` combinations to preserve CC auto-title. Emit reduced from 6 per message to 1 per phase change (≈83% reduction).
- **[ENH-229] Stale feature TTL** — Automatically invalidates PDCA primaryFeature when `lastUpdated > 24h`, auto-cleaning accumulated legacy features (e.g. "ui"). Adjustable via `ui.sessionTitle.staleTTLHours` (`0` disables).

### Added
- **[ENH-203] PreCompact decision:block** (`scripts/context-compaction.js`) — Blocks `manual` compaction during PDCA `do/check/act` phases using CC v2.1.105+ PreCompact hook blocking.
- **[ENH-214] Output styles audit script** (`scripts/audit-output-styles.js`) — Defense against CC v2.1.107 regression #47482. Gate G8.
- **[ENH-167] BKIT_VERSION dynamic lookup** (`lib/core/version.js`) — Single source of truth from `bkit.config.json`, removing version hardcoding across tests and scripts (Docs=Code).
- **Tests** — `test/unit/session-title.test.js` (10 TC) + `test/integration/issue77-hook-e2e.test.js` (7 TC). **17/17 PASS**.

### Changed
- **Version** — 2.1.5 → 2.1.6.
- **Quality Gates** — G1~G7 → G1~G9 (G8: output styles audit, G9: sessionTitle opt-out + single-source).
- **TC-A3 patch** — `scripts/user-prompt-handler.js` contextInjection opt-out no longer suppresses sessionTitle emission. Separated `contextInjectionEnabled` flag keeps the sessionTitle path independent.
- **Test version references** — 8 hardcoded version assertions (`VC2-001~025`, `CS-012`, `VW-036`, `SEC-CP-014`, `E2E-005/015`) migrated to dynamic `BKIT_VERSION` lookup.
- **Documentation sync** — `README.md`, `CUSTOMIZATION-GUIDE.md` version references bumped to v2.1.6.

### Fixed
- TC-A3 design-implementation mismatch: contextInjection opt-out previously suppressed sessionTitle due to early `outputEmpty()+exit`. Now separated into per-feature guards.
- Overview markdown headers (`bkit-system/components/{scripts,agents,skills}/_*-overview.md`) version bumped v2.1.1 → v2.1.6.
- `skills/bkit/SKILL.md` description shortened from 284 to ~160 chars (SD-008/039/050 resolved).
- `test/run-all.js` — removed missing file reference `performance/direct-import.test.js`.

### Test Results
- **3268/3280 PASS (99.6%)**, 0 FAIL, 12 SKIP.
- Unit / Integration / Security / Philosophy / UX / E2E / Architecture / Controllable AI: **100% PASS**.
- Regression 98.5% (8 SKIP only), Performance 97.1% (4 SKIP only).

### Monitoring
- **MON-CC-04** — CC v2.1.107 regressions (#47482 / #47810 / #47855 / #47828) remain OPEN in v2.1.108. **Recommendation updated: wait for v2.1.109+ hotfix** (previously v2.1.107 hotfix expectation unmet).

### How to Use the Opt-out

```jsonc
// bkit.config.json
{
  "ui": {
    "sessionTitle": {
      "enabled": false,         // Suppresses [bkit] PHASE feature title; CC auto-title is used instead
      "staleTTLHours": 24       // 0 = TTL disabled (for long-running PDCA sessions)
    },
    "dashboard": {
      "enabled": false,         // Disables SessionStart 5 boxes (progress/workflow/impact/agent/control)
      "sections": ["progress"]  // Or keep a subset
    },
    "contextInjection": {
      "enabled": false          // Suppresses UserPromptSubmit ambiguity / Previous Work injection
    }
  }
}
```

### 🚨 Out of Scope (deferred to separate session)
- M7: Remove deprecated `unified-stop.js` (~4h)
- M8: 5 remaining refactor ENH items (`catch(_){}` wrapping, Bash pattern extension, dead code elimination, MEMORY.md audit, etc. ~10h)

---

## [2.1.5] - 2026-04-13

### Added
- **Module Entry Points** — `lib/audit/index.js`, `lib/control/index.js`, `lib/quality/index.js` enable `require('./lib/audit')` etc. for 3 core modules (13 files, ~112 combined exports).
- **Wiring Scanner** (`lib/qa/scanners/wiring.js`) — Detects "Built But Not Wired" patterns (exported but never called functions). 250 findings on baseline (33 WARNING, 217 INFO). Scanners: 4 → 5.
- **bkit Help Skill** (`skills/bkit/SKILL.md`) — `/bkit` command shows all 38 skills, 2 MCP servers, 4 output styles, agent teams. 8-language trigger support.
- **PDCA Skill Bypass Guard** (`scripts/pre-write.js`) — Warns when PDCA docs are written directly via Write/Edit without going through the PDCA skill (#75).

### Fixed
- **#73 — Template imports not injected** — `scripts/user-prompt-handler.js` now pushes `resolveImports()` result to `contextParts[]`, enabling template-based PDCA document generation.
- **#74 — Auto-transition broken** — Triple failure fix: `lib/pdca/automation.js` gains `shouldAutoAdvance()` for plan/design phases, `scripts/pdca-skill-stop.js` uses imperative directives instead of soft hints, `skills/pdca/SKILL.md` adds `{{TEMPLATE_DIRECTIVE}}` for phase-specific instructions.
- **#75 — Skill bypass undetected** — Pre-write hook detects PDCA document writes outside skill context.
- **DRY consolidation** — ~85 lines of duplicated auto-transition logic in `pdca-skill-stop.js` replaced by centralized `automation.js` functions.
- **Level mapping** — `automation.js` gains `levelFromName()` reverse mapping and `LEGACY_LEVEL_MAP` for backward compatibility.

### Changed
- **Version Sync** — `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json`, `hooks/session-start.js` bumped to 2.1.5.
- **PDCA Status Cleanup** — Removed 25 test/debug artifact features from `.bkit/state/pdca-status.json`. Retained 2 real features.
- **Dead Directory Removed** — `lib/adapters/` (empty subdirectories `claude/`, `local/`, 0 files) deleted.
- **Lib Modules** — 93 → 96 modules (3 new index.js entry points).
- **QA Scanners** — 4 → 5 (wiring scanner added).
- **Skills** — 37 → 38 (bkit help skill added).

### Documentation
- Full PDCA artifacts for 3 sub-features: `bkit-v215-issue-73-74-fix`, `bkit-v215-quality-hardening-p2`, `bkit-v215-comprehensive-improvement`.

## [2.1.4] - 2026-04-13

### Added
- **QA Scanner Framework** (`lib/qa/scanners/`) — 4 automated pre-release scanners (dead-code, config-audit, completeness, shell-escape) with `ScannerBase` abstract class, `reporter.js` formatter, and `utils/` helpers (file-resolver, pattern-matcher). 9 new lib modules (+93 total).
- **Pre-Release Check** (`scripts/qa/pre-release-check.sh`) — Shell wrapper running all 4 scanners with CRITICAL/WARNING/INFO severity. Exit 1 on CRITICAL, exit 0 otherwise.
- **CwdChanged Handler** (`scripts/cwd-changed-handler.js`) — ENH-149 project transition detection with audit logging.
- **TaskCreated Handler** (`scripts/task-created-handler.js`) — ENH-156 PDCA task creation tracking.
- **Unit Tests** — 5 test suites (43 tests): scanner-base (19), dead-code (5), config-audit (5), completeness (6), shell-escape (8). All 43/43 PASS.

### Fixed
- **#71 — Shell escape `$N` collision** — Preventive scanner detects bare `$1` in awk within SKILL.md shell blocks.
- **#66 — Stale require references** — 5 additional stale require paths fixed across lib modules.
- **#67 — Config hardcoded values** — 16 WARNING-level hardcoded values identified by config-audit scanner.
- **#65 — Completeness gaps** — Completeness scanner validates skill→agent references and frontmatter consistency.

### Changed
- **Version Sync** — `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json` bumped to 2.1.4.
- **effort frontmatter (ENH-134)** — All 38 skills now include effort frontmatter in SKILL.md.
- **Sequential agent spawn (ENH-143)** — `lib/team/coordinator.js` adds `spawnAgentsSequentially()` workaround for #37520 OAuth 401.
- **SessionStart defensive cleanup (ENH-148)** — `hooks/session-start.js` clears stale env vars on /clear.
- **MCP maxResultSizeChars (ENH-176)** — Both MCP servers set 500K override on both `_meta` keys.
- **CC Compatibility** — Verified against CC v2.1.104; 66 consecutive compatible releases (v2.1.34 → v2.1.104).
- **Lib Modules** — 84 → 93 modules (9 new in lib/qa/).
- **Test Files** — 194 → 201 files.

### Documentation
- Full PDCA artifacts for `bkit-v214-quality-hardening` feature under `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`, `docs/05-qa/`.
- E2E verification report: Plugin load, 7 skills invoked, 3 agents spawned, 6 MCP tools tested, 3 hooks fired, 43/43 unit tests PASS.

## [2.1.3] - 2026-04-12

### Fixed
- **#65 — `/pdca qa` subcommand integration** — `scripts/pdca-skill-stop.js` actionPattern, `nextStepMap`, `phaseMap` (x2), and state transition whitelist now parse and route the `qa` action. `skills/pdca/SKILL.md` gains a `### qa (QA Phase)` handler block (delegates to the standalone `qa-phase` skill) and a `/pdca qa [feature]` line in the Slash Invoke Pattern section. PDCA state machine now advances `qa → report` on `QA_PASS`.
- **#66 — `lib/permission-manager.js` TypeError** — `checkPermission()`, `getToolPermissions()`, `getAllPermissions()`, and the `common.debugLog` call site now null-guard the lazy `hierarchy` / `common` requires. When `context-hierarchy.js` / `common.js` are absent (as they have been since commit 21d35d6), the module falls back to `DEFAULT_PERMISSIONS`, restoring the `Bash(rm -rf*): deny` / `Bash(git push --force*): deny` baseline policy and eliminating the per-tool-call `PreToolUse:Edit hook error` noise.
- **#67 — MCP `bkit_report_read` ignored `bkit.config.json docPaths`** — `servers/bkit-pdca-server/index.js` now loads `bkit.config.json` with an mtime-cached `loadBkitConfig()` helper and resolves `pdca.docPaths.{plan,design,analysis,report}` templates via `getPhaseTemplates()`. `docsPath()` walks the configured templates and returns the first existing file. All four doc-read tools (`bkit_plan_read`, `bkit_design_read`, `bkit_analysis_read`, `bkit_report_read`) honor custom config paths with fallback to built-in defaults for zero-config projects.

### Changed
- **Version Sync** — `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (both the marketplace spec version and the bkit plugin entry), `hooks/hooks.json`, and `hooks/session-start.js` systemMessage bumped to 2.1.3.
- **Dead Constants Removed** — `servers/bkit-pdca-server/index.js` no longer declares `PHASE_MAP` / `DOCS_DIR` (both were superseded by the new template-based resolver).

### Documentation
- Full PDCA artifacts for the `v213-issue-fixes` feature under `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`.

## [2.1.2] - 2026-04-12

### Added
- **Worktree Detector** (`lib/core/worktree-detector.js`) — Detects linked git worktrees via `git rev-parse --show-toplevel` vs `--git-common-dir` comparison. On detection, emits stderr warning and writes `.bkit/runtime/worktree-warning.flag`. Addresses anthropics/claude-code#46808 (hooks not firing in linked worktrees).
- **Startup Worktree Guard** — `hooks/startup/context-init.js` now invokes worktree-detector on session start to warn users before PDCA state writes occur in a linked worktree.
- **Unit Tests** — `test-scripts/unit/mcp-ok-response.test.js` and `test-scripts/unit/worktree-detector.test.js` (jest, 2 suites / 6 tests).

### Fixed
- **MCP `_meta` Persist Bypass (ENH-193)** — Both MCP servers (`bkit-pdca-server`, `bkit-analysis-server`) now set `maxResultSizeChars` on both `result._meta` and `content[0]._meta`, restoring the 500K override path after the CC v2.1.98 persistence change.
- **Jest Runner Stability** — Active unit test suites run clean on Node 20+ under `npx jest --silent`.

### Changed
- **Version Sync** — `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json`, `hooks/hooks.json` bumped to 2.1.2.
- **Code Simplification** — Consolidated per-field comments in both MCP servers into single block comments; removed dead `try/catch` and merged three nested blocks into one in `worktree-detector.js` (-10 LOC). No behavior change.
- **CC Compatibility Baseline** — Verified against CC v2.1.98; 63 consecutive compatible releases (v2.1.34 → v2.1.98).

### Documentation
- PDCA artifacts for the `cc-version-issue-response` feature: plan, design, iterate, qa, simplify, report, and full-QA reports under `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/`.
- Full plugin QA matrix — 7/7 `claude -p --plugin-dir .` smoke tests, 38 skills / 36 agents / 21 hooks / 2 MCP servers validated end-to-end.

## [2.1.1] - 2026-04-09

### Added
- **QA Phase Integration** — New 11th PDCA state (`qa`) with 5 transitions (QA_PASS, QA_FAIL, QA_SKIP, QA_RETRY), check→qa→report flow, state machine expanded to 11 states / 22 events / 25 transitions
- **Semantic Gap Analysis Enhancement** — Improved gap detection accuracy with semantic context matching
- **QA Report Generation** — L1-L5 test level framework with automated QA reports in `docs/05-qa/`

### Fixed
- **Deep Verification Fixes** — Circular dependency resolution, hook schema validation, token waste reduction, dead code removal
- **33 Broken Test Assertions** — Fixed across 10 test files for QA phase state machine integration
- **Dead Context Cleanup** — Removed stale session context reducing token waste

### Changed
- **Component Counts Updated**: Skills 37→38, Agents 32→36, Hook Events 20→21, Scripts 59→42 (consolidated), Lib Modules 72→84, Lib Subdirs 11→12
- **Gate Manager Thresholds** — matchRate thresholds updated for Enterprise/Dynamic levels
- **pdca-iterator Agent** — effort level changed from medium to high for better iteration quality

### Documentation
- Documentation sync across README.md, CUSTOMIZATION-GUIDE.md, plugin.json, marketplace.json, bkit-system/ docs
- QA phase reports added to `docs/05-qa/`
- Test report updated (3,261 TC, 99.6% pass rate, 0 failures)

## [2.0.6] - 2026-03-25

### Added — Living Context System + Self-Healing + PDCA Handoff Fix (PR #57)

**Living Context System** (`lib/context/` — 7 new modules, ~1,527 LOC)
- New `lib/context/` subdirectory (11th lib subdirectory) with 7 modules:
  - `context-loader.js` (526 LOC): 4-Layer Living Context loading — `loadFullUpstream()`, `extractSection()`, `extractDecisions()`, `formatUpstreamSummary()` for full PRD→Plan→Design chain reading
  - `impact-analyzer.js` (205 LOC): Change impact analysis for Living Context decisions
  - `invariant-checker.js` (131 LOC): Context invariant validation with schema support
  - `scenario-runner.js` (203 LOC): Design-post scenario execution for verification
  - `self-healing.js` (301 LOC): Automated error detection and context-aware fix generation
  - `ops-metrics.js` (150 LOC): Operational metrics collection for Living Context
  - `index.js` (11 LOC): Module entry point re-exporting context-loader, invariant-checker, impact-analyzer, scenario-runner

**Self-Healing Agent** (`agents/self-healing.md`)
- New opus-model agent for automated error recovery
- Detects errors from Slack/Sentry, loads 4-Layer context, fixes code, verifies with scenario runner
- Tools: Read, Write, Edit, Glob, Grep, Bash, Task(Explore), Task(code-analyzer), Task(gap-detector)
- Stop hook: `heal-hook.js` for post-healing state capture

**Deploy Skill & State Machine** (`skills/deploy/SKILL.md`, `lib/pdca/deploy-*.js`)
- New deploy skill with environment progression: dev → staging → prod
- `deploy-state-machine.js` (261 LOC): 3-environment state machine with gate conditions
- `deploy-gate.js` (173 LOC): Quality gates per environment (dev 80%+, staging 90%+, prod 95%+ with human approval)
- `deploy-hook.js` (107 LOC): Hook script for deploy event handling

**PDCA Handoff Loss Fix Phase 2** (upstream document cross-reading)
- `context-loader.js`: `loadFullUpstream()` enables all phases to read PRD→Plan→Design chain
- `skills/pdca/SKILL.md`: Do/Analyze/Report phases now include full upstream loading steps
- `templates/analysis.template.md`: Strategic Alignment Check (PRD alignment + SC evaluation + Decision verification)
- `templates/do.template.md`: Upstream Context Chain + Documents Loaded table

**PDCA Handoff Loss Fix Phase 3** (PRD→Code context penetration)
- `lib/pdca/decision-record.js` (174 LOC): Decision Record Chain extraction and formatting
- `lib/pdca/commit-context.js` (124 LOC): PDCA-aware commit message generation with decision references
- `lib/pdca/session-guide.js`: Added `extractSuccessCriteria()` + `formatSuccessCriteria()` exports
- `templates/report.template.md`: Decision Record Summary + Success Criteria Final Status sections

**Infrastructure Templates** (11 new template files)
- `templates/infra/`: ArgoCD application, deploy pipelines (dynamic/enterprise), staging EKS, Terraform main
- `templates/infra/observability/`: Prometheus, Loki, OpenTelemetry Tempo value files
- `templates/infra/security/`: Security layer template
- `templates/context/`: Invariants + scenario YAML schemas

**New Scripts** (3 new, 54→57 total)
- `scripts/deploy-hook.js`: Deploy event handler
- `scripts/design-post-scenario.js`: Post-design scenario verification
- `scripts/heal-hook.js`: Self-healing post-fix state capture

**Design Guide**
- `docs/02-design/LIVING-CONTEXT-GUIDE.md`: Living Context System architecture and usage guide

**PM Documents** (3 new PRDs)
- `docs/00-pm/bkit-3way-comparison.prd.md`: bkit vs alternatives comparison
- `docs/00-pm/bkit-customization-impact-analysis.prd.md`: Customization impact analysis
- `docs/00-pm/bkit-infra-automation.prd.md`: Infrastructure automation PRD

### Changed

- **Component Counts Updated**:
  - Lib Modules: 78 → 88 (+10 new modules across 2 subdirectories)
  - Lib Subdirectories: 10 → 11 (+context)
  - Agents: 31 → 32 (+self-healing)
  - Skills: 36 → 37 (+deploy)
  - Scripts: 54 → 57 (+3 new hook scripts)
  - Exports: ~580+ → ~620+ (new context + pdca modules)
  - Total LOC (lib/): ~40K → ~45K (+~5K)
- `lib/core/paths.js`: Added context module and deploy paths
- Skill classification: 17 Workflow → 18 Workflow (+deploy), 18 Capability, 1 Hybrid
- Agent model distribution: 10 opus → 11 opus (+self-healing), 19 sonnet, 2 haiku
- PRD→Code Context Preservation: 30-40% → 75-85% (with Phase 1+2+3)
- Version bumped to 2.0.6 across all config files

---

## [2.0.5] - 2026-03-23

### Added — Multi-Session Incremental Context Management (PR #55)

**Session Guide Module** (`lib/pdca/session-guide.js`)
- New module with 8 exported functions (277 LOC) for multi-session handoff context loss reduction
  - `extractContextAnchor()`: Extracts 5-line strategic summary (WHY/WHO/RISK/SUCCESS/SCOPE) from Plan document
  - `formatContextAnchor()`: Formats anchor as markdown table
  - `analyzeModules()`: Parses Design document's Implementation Guide for module scope keys
  - `suggestSessions()`: Generates session plan based on module turn estimates (default 50 turns/session)
  - `formatSessionPlan()`, `formatModuleMap()`: Markdown table formatters
  - `filterByScope()`, `parseDoArgs()`: Scope parameter handling for `--scope` CLI support

**Context Anchor Template Integration**
- Plan template v1.2→v1.3, Design template v1.2→v1.3, Do template v1.0→v1.1, Analysis template v1.2→v1.3
- All 4 PDCA templates now include Context Anchor section (extracted from Plan, propagated downstream)
- Design template adds Session Guide section (Module Map + Recommended Session Plan)
- Do template adds Session Scope section with `--scope module-N` usage

**Upstream Document Cross-Reading** (SKILL.md enhancements)
- Plan phase: Context Anchor Generation step
- Design phase: Context Anchor Embed + Session Guide Generation + PRD Context Loading
- Do phase: `--scope` parameter parsing + Context Anchor display + Plan Context Anchor reading
- Analyze phase: Context Anchor Embed + Plan Success Criteria Reference

**Test Coverage** (75 new TC)
- `test/unit/session-guide.test.js` (35 TC): 8 functions unit tests
- `test/integration/context-anchor-propagation.test.js` (25 TC): Template + SKILL.md integration
- `test/regression/pr55-handoff-loss.test.js` (15 TC): Backward compatibility + structural integrity

### Fixed
- `lib/pdca/status.js`: `addPdcaHistory()` crash when `status.history` is undefined (defensive guard added)

### Changed
- Total Test Cases: 3298 TC (was 3224, +74 new)
- Session Guide registered in `lib/pdca/index.js` exports (8 new exports)
- Version bumped to 2.0.5 across all config files

---

## [2.0.4] - 2026-03-23

### Fixed — Hook Path Quoting for Windows Compatibility

**Critical Bug Fix ([#53](https://github.com/popup-studio-ai/bkit-claude-code/issues/53))**
- All 18 hook commands in `hooks/hooks.json` now properly quote `${CLAUDE_PLUGIN_ROOT}` paths with double-quotes
- Fixes bash syntax error when Windows username contains parentheses (e.g., `홍길동(HongGildong)`)
- Affects: SessionStart, PreToolUse, PostToolUse, Stop, StopFailure, UserPromptSubmit, PreCompact, PostCompact, TaskCompleted, SubagentStart, SubagentStop, TeammateIdle, SessionEnd, PostToolUseFailure, InstructionsLoaded, ConfigChange, PermissionRequest, Notification
- Before: `node ${CLAUDE_PLUGIN_ROOT}/scripts/foo.js` → syntax error on paths with `(` or `)`
- After: `node "${CLAUDE_PLUGIN_ROOT}/scripts/foo.js"` → works on all platforms

**Version Alignment**
- Bumped all version references from 2.0.3 to 2.0.4: plugin.json, bkit.config.json, marketplace.json, evals/config.json, MCP server packages, audit-logger.js, session-start.js, session-context.js, paths.js

### Test Enhancements
- Added `test/security/hook-path-quoting.test.js`: 12 TCs for path quoting validation
- Added `test/regression/issue-53-path-quoting.test.js`: 10 TCs for Windows path edge cases
- Updated test runner expected counts for new TCs

## [2.0.3] - 2026-03-22

### Fixed — Documentation & Architecture Sync

**Version Alignment**
- Synced `bkit.config.json` version from stale 2.0.0 to match `plugin.json` 2.0.3
- Updated hardcoded version strings in `lib/audit/audit-logger.js` (BKIT_VERSION), `hooks/session-start.js` (systemMessage), `lib/core/paths.js` (meta.json), MCP server packages
- Fixed test expectations for version checks (config-sync, v200-wiring, config-permissions, agents-effort)

**Documentation Sync with v2.0.2 Architecture**
- Updated skill classification across all docs: 9W/25C/2H → **17 Workflow / 18 Capability / 1 Hybrid** (7 new skills classified)
- Updated eval count: 28 → **29** (cc-version-analysis added)
- Updated export count: ~465 → **~580+** (v2.0.0 modules not counted)
- Updated script count in docs: 49 → **54** (5 new hook scripts)
- Updated lib subdirectory references to include `adapters`
- Synced team composition names with cto-lead.md implementation
- Added PR #51 (Impact Analysis section) to v2.0.2 changelog entry

**Test Runner**
- Aligned `test/run-all.js` expected TC counts with actual: Unit 1120→1403, Integration 360→479, Security 130→205, Regression 335→416, Performance 126→160, Philosophy 140→138, UX 150→160, E2E 55→61
- Updated pm-discovery/pm-prd maxTurns expectations: 20→25

### Changed
- Total Test Cases: 3,202 TC (0 failures, 12 skips, 99.6% pass rate)
- CC recommended version: v2.1.81+ (was v2.1.78+)
- PDCA documents: docs/01-plan/ through docs/04-report/

## [2.0.2] - 2026-03-22

### Added — PM Skills Integration + Interactive Checkpoints
- **PM Frameworks 9→43**: Integrated [pm-skills](https://github.com/phuryn/pm-skills) (MIT License) into PM Agent Team — Brainstorm, SWOT, PESTLE, Porter's Five Forces, Pre-mortem, Growth Loops, Customer Journey Map, ICP, Battlecards, User/Job Stories, Test Scenarios, Stakeholder Map
- **PDCA Interactive Checkpoints 1~5**: AskUserQuestion-gated confirmation at Plan (requirements + clarifying questions), Design (3 architecture options selection), Do (implementation scope approval), Check (fix strategy choice: all/critical-only/skip)
- **code-analyzer Confidence-Based Filtering**: Only reports issues with confidence ≥80%, Critical/Important severity classification, filtered count summary
- **CTO Lead Interactive Checkpoints**: v1.7.0 feature-dev pattern for CTO Team sessions
- **btw CTO Team Integration**: teamContext field (isTeamSession, phase, role, pattern), Phase Transition Hook, cto-stop.js session summary with btw stats
- **Design Template Architecture Options**: 3 options comparison table (Option A: Minimal / Option B: Clean / Option C: Pragmatic)
- **pm-prd Template v2.0**: Section 6 Execution Deliverables (Pre-mortem, User Stories, Job Stories, Test Scenarios, Stakeholder Map), SWOT Analysis, Customer Journey Map, ICP, Battlecards, Growth Loops
- **Integration Test**: pm-skills-integration.test.js (50 TC, 100% pass)
- **Plan Template Impact Analysis Section** ([PR #51](https://github.com/popup-studio-ai/bkit-claude-code/pull/51)): Mandatory Section 6 requiring full inventory of existing consumers (CREATE/READ/UPDATE/DELETE) before modifying resources — prevents silent breakage of existing functionality

### Changed
- `agents/pm-discovery.md`: +167 LOC (Brainstorm, Assumption Risk frameworks)
- `agents/pm-strategy.md`: +166 LOC (SWOT, PESTLE, Growth Loops)
- `agents/pm-research.md`: +107 LOC (Customer Journey, ICP)
- `agents/pm-prd.md`: +165 LOC (Pre-mortem, User/Job Stories, Stakeholder Map)
- `agents/pm-lead.md`: +33 LOC (team orchestration improvements)
- `agents/code-analyzer.md`: +19 LOC (Confidence-Based Filtering)
- `agents/cto-lead.md`: +48 LOC (Interactive Checkpoints)
- `skills/pdca/SKILL.md`: +48 LOC (Checkpoints 1~5)
- `skills/btw/SKILL.md`: +42 LOC (CTO Team Integration)
- `scripts/cto-stop.js`: +37 LOC (btw session summary)
- `templates/design.template.md`: +21 LOC (Architecture Options)
- `templates/pm-prd.template.md`: v1.0→v2.0, +136 LOC
- `templates/plan.template.md`: +41 LOC (Section 6 Impact Analysis, section renumbering 6→7→8→9)
- CC recommended version: v2.1.78+ → v2.1.81+
- CC compatibility: v2.1.34~v2.1.81 = 47 consecutive compatible releases

## [2.0.1] - 2026-03-21

### Fixed
- **Cross-Project PDCA State Leakage** ([#48](https://github.com/popup-studio-ai/bkit-claude-code/issues/48)): `restoreFromPluginData()` now validates project identity via `meta.json` before restoring backup, preventing Project A's PDCA state from leaking into Project B
- `backupToPluginData()`: Writes `meta.json` with `projectDir` identifier on every backup
- `restoreFromPluginData()`: 5-stage validation guard (meta exists → parseable → has projectDir → realpathSync normalize → match current project)
- `globalCache`: Cache keys namespaced as `pdca-status:${PROJECT_DIR}` to prevent in-memory pollution across projects

### Added
- `test/unit/project-isolation.test.js`: 10 new test cases for cross-project restore guard
- PDCA documents: plan, design, analysis, report for globalcache-project-isolation

## [2.0.0] - 2026-03-20

### Added — AI Native Development OS
- **Workflow Automation Engine**: Declarative PDCA state machine (20 transitions, 9 guards, 15 actions), YAML workflow DSL with 3 presets (default, hotfix, enterprise), Do phase detection (3-layer), Full-Auto Do (Design→code generation), parallel feature management (max 3), circuit breaker, resume system
- **Controllable AI (L0-L4)**: 5-level automation controller with 10 gate configs, destructive operation detector (8 rules, G-001~G-008), blast radius analyzer (6 rules), checkpoint manager (SHA-256 integrity), loop breaker (4 rules), trust engine (5-component scoring), scope limiter
- **Visualization UX**: CLI dashboard with progress bar, workflow map, agent panel, impact view, control panel, ANSI styling library with NO_COLOR support
- **Architecture Refactoring**: constants.js (33 constants), errors.js (BkitError with 7 domains), state-store.js (atomic writes with file locking), hook-io.js (lightweight Hook I/O), backup-scheduler.js, session-start.js split into 5 startup modules
- **CC Feature Integration**: 6 new hook scripts (SessionEnd, PostToolUseFailure, InstructionsLoaded, ConfigChange, PermissionRequest, Notification)
- **MCP Servers**: bkit-pdca-server (10 tools + 3 resources), bkit-analysis-server (6 tools)
- **New Skills**: `/control` (automation level), `/audit` (decision transparency), `/rollback` (checkpoint management), `/pdca-batch` (parallel features)
- **Comprehensive Test Suite**: 2,717 TC across 10 categories (99.6% pass rate, 0 failures), 2 new categories (Architecture Tests, Controllable AI Tests)

### Changed
- Skills: 31 → 36 (+5: control, audit, rollback, pdca-batch, btw)
- Agents: 29 → 31 (+2: pdca-eval-design, pm-lead-skill-patch)
- Hook Events: 12 → 18 (+6 new events)
- Lib Modules: 36 → 76 (+40 new modules across 10 subdirectories)
- Hook Scripts: 49 → 21 (consolidated with unified handlers)
- Exports: 210 → ~465 (+255 new functions)
- Test Cases: 1,151 → 2,645+ (+1,494)

### Removed
- `lib/skill-loader.js` (795 LOC) — orphaned, never imported
- `lib/skill-quality-reporter.js` (479 LOC) — orphaned, never imported
- `docs/github-stats-bkit-gemini.md` — separate repository stats
- Gemini CLI references from script comments (Claude Code exclusive since v1.5.0)
- `common.js` usage in hooks/scripts (57 scripts migrated to direct imports)

### Architecture
- 7 new lib domains: `lib/audit/`, `lib/control/`, `lib/ui/`, `lib/pdca/` (expanded), `lib/core/` (expanded)
- State management: `.bkit/state/`, `.bkit/runtime/`, `.bkit/snapshots/`
- YAML workflows: `.bkit/workflows/` (3 presets)
- MCP servers: `servers/bkit-pdca-server/`, `servers/bkit-analysis-server/`

## [1.6.2] - 2026-03-18

### Added
- **CC v2.1.73~v2.1.78 Full Integration** (14 ENH items: ENH-117~130)
  - PostCompact hook event: PDCA state integrity verification after context compaction
  - StopFailure hook event: API error classification, logging, and recovery guidance
  - `${CLAUDE_PLUGIN_DATA}` persistent backup: automatic state backup/restore across plugin updates
  - Agent frontmatter `effort`/`maxTurns`: native support for all 29 agents (opus=high/30-50, sonnet=medium/20, haiku=low/15)
  - 1M context window documentation: default for Max/Team/Enterprise plans (CC v2.1.75+)
  - Output token 128K upper limit documentation (CC v2.1.77+)
  - modelOverrides guide for Bedrock/Vertex users
  - autoMemoryDirectory guide for custom memory paths
  - worktree.sparsePaths guide for large monorepo optimization
  - /effort command guide with ultrathink documentation
  - allowRead sandbox guide for fine-grained filesystem control
  - Session name (-n) guide for CI/CD automation
  - Hook source display documentation (CC v2.1.75+)
  - tmux notification passthrough documentation (CC v2.1.78+)
- **New Scripts** (2)
  - `scripts/post-compaction.js`: PostCompact hook handler (~120 LOC)
  - `scripts/stop-failure-handler.js`: StopFailure hook handler (~160 LOC)
- **Comprehensive Test Suite** (1,186 TC, 8 perspectives)
  - Unit (555), Integration (134), Security (85), Regression (192), Performance (76), Philosophy (58), UX (60), E2E (26)
  - 99.7% pass rate, 0 failures, 4 skips (pre-existing)
  - 6 new test files, 6 updated test files (+161 TC from v1.6.1)

### Changed
- **Hook Events**: 10 → 12 in hooks.json (+PostCompact, +StopFailure)
- **lib/core/paths.js**: +2 functions (backupToPluginData, restoreFromPluginData), +2 STATE_PATHS (pluginData, pluginDataBackup)
- **lib/core/index.js**: 52 → 54 exports (+2 PLUGIN_DATA functions)
- **lib/common.js**: 208 → 210 exports (+2 bridge re-exports)
- **lib/pdca/status.js**: savePdcaStatus() and writeBkitMemory() now auto-backup to PLUGIN_DATA
- **hooks/session-start.js**: PLUGIN_DATA restore on startup, v1.6.2 enhancements section, 1M context info
- **agents/*.md**: All 29 agents updated with effort/maxTurns fields (model field moved to top)
- **CC recommended version**: v2.1.71 → v2.1.78
- **CC compatibility**: v2.1.34~v2.1.78 = 44 consecutive compatible releases (0 breaking changes)
- **Version bumps**: plugin.json, bkit.config.json, hooks.json, session-start.js, marketplace.json

### Documentation
- **bkit-system/philosophy/context-engineering.md**: 12 new sections for v1.6.2 features
- **bkit-system/philosophy/core-mission.md**: v1.6.2 version record
- **bkit-system/components/hooks/_hooks-overview.md**: v1.6.2 hook events

### Compatibility
- Claude Code: Minimum v2.1.69+, Recommended v2.1.78
- Node.js: Minimum v18+
- Agent Teams: Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.6.1] - 2026-03-08

### Added
- **CTO/PM Orchestration Redesign** (Issue #41 fix)
  - Main Session as CTO pattern to bypass CC v2.1.69+ nested spawn restriction
  - `lib/team/coordinator.js`: 7 new exports (buildAgentTeamPlan, getFileOwnership, generateTeammatePrompt, etc.)
  - Agent Teams TeamCreate integration for CTO/PM team composition
- **Skill Evals 28/28 Full Implementation**
  - `evals/runner.js`: parseEvalYaml(), evaluateAgainstCriteria(), runEval() (real evaluation engine)
  - `evals/reporter.js`: formatDetailedReport() with skill category breakdown
  - 56 content files: 28 × prompt-1.md + 28 × expected-1.md
  - `node evals/runner.js --benchmark` achieves 28/28 PASS (100% coverage)
- **Agent Security Hardening**
  - 3-Tier Security Model for 9 acceptEdits agents
  - Tier 1 (Starter Guide): disallowedTools [Bash]
  - Tier 2 (5 Expert Agents): disallowedTools [Bash(rm -rf), Bash(git push), Bash(git reset --hard)]
  - Tier 3 (QA/Iterator): unchanged (Bash required)
- **Comprehensive Test Suite** (1073 TC, 8 perspectives)
  - Unit (503), Integration (120), Security (80), Regression (156), Performance (70), Philosophy (58), UX (60), E2E (26)
  - 99.6% pass rate, 0 failures, 4 skips (environment-dependent)
- **CE Level Assessment** — CE-5 Master (88/100)
  - 10-Agent CTO Team evaluation from 10 perspectives
  - 252 total components inventoried (28 Skills + 21 Agents + 41 lib + 46 Scripts + 15 Templates + 4 Styles + 56 Evals + 39 Tests)

### Changed
- **P0 Bug Fixes** (4 items)
  - `ambiguity.js`: shouldClarify property added for automatic clarification detection
  - `trigger.js`: confidenceThreshold hardcoded 0.8 removed, reads from config
  - `creator.js`: PDCA phases array unified (includes act phase), imports fixed
  - Agent `disallowedTools` settings applied to 6 experts + 1 guide
- **Config-Code Synchronization**
  - `lib/team/orchestrator.js`: PHASE_PATTERN_MAP loads from bkit.config.json at runtime
  - selectOrchestrationPattern() with config fallback logic
- **Skills PDCA Enhancement**
  - `skills/pdca/SKILL.md`: agents.team = null, agents.pm = null (Main Session as Team Lead)
- **Library Export Count**: 208 exports (corrected from v1.6.0 documented 241)

### Fixed
- **Critical Issue #41**: CC v2.1.69+ nested subagent spawn restriction broke `/pdca team`
- **Config Read Failure**: confidenceThreshold not reflected in trigger decisions
- **Array Inconsistency**: PDCA phases missing 'act' phase in task creation
- **Security Gaps**: 8 acceptEdits agents without explicit tool restrictions
- **Stub System**: Evals always returned true (non-functional quality validation)

### Test Results
- **1073 TC**: 1069 passed, 0 failed, 4 skipped (99.6%)
- **Evals Coverage**: 28/28 PASS (100%)
- **Design Match Rate**: 100% (26/26 items)

### Files Modified
- 72 files, ~1,400 LOC changed
- New: 56 content files (evals/), 35 test files (test/)
- Core: lib/team/coordinator.js, lib/team/orchestrator.js, lib/intent/ambiguity.js, lib/intent/trigger.js, lib/task/creator.js
- Agents: 7 agents updated with disallowedTools
- Skills: skills/pdca/SKILL.md

### Breaking Changes
- None (backward compatible)

---

## [1.6.0] - 2026-03-07

### Added
- **Skills 2.0 Complete Integration** (19 ENH items: ENH-85~103)
  - Skill Classification: All 28 skills classified as Workflow (10) / Capability (16) / Hybrid (2) with deprecation-risk scoring
  - Skill Evals Framework: `evals/runner.js` with benchmark mode, 28 pre-built eval definitions
  - A/B Testing: `evals/ab-tester.js` for model comparison and parity testing
  - Skill Creator: `skill-creator/generator.js` + `skill-creator/validator.js` for skill scaffolding
  - Template Validator: PostToolUse hook validation for PDCA document required sections (ENH-103)
  - Frontmatter hooks migration: hooks.json Layer 2/3 consolidation
  - context:fork deprecation: CC native context:fork replaces FR-03 custom implementation
  - Hot reload: SKILL.md changes reflect without session restart
  - Wildcard permissions: `Bash(npm *)`, `Bash(git log*)` patterns
- **PM Agent Team** (5 new agents for pre-Plan product discovery)
  - pm-lead (opus): PM Team orchestration, PRD synthesis
  - pm-discovery (sonnet): Opportunity Solution Tree analysis
  - pm-strategy (sonnet): Value Proposition, Lean Canvas
  - pm-research (sonnet): Personas, competitors, market sizing (TAM/SAM/SOM)
  - pm-prd (sonnet): PRD document generation at `docs/00-pm/{feature}.prd.md`
  - New skill: `pm-discovery` for PM workflow automation
  - New template: `pm-prd.template.md` for PRD output
  - Integration: `/pdca pm {feature}` triggers PM Team before Plan phase
- **Skill Evals Directory Structure**
  - `evals/config.json`: Global eval configuration (thresholds, classifications)
  - `evals/runner.js`: Eval execution engine (CLI + module)
  - `evals/reporter.js`: Markdown/JSON result reporting
  - `evals/ab-tester.js`: Model comparison + parity testing
  - `evals/workflow/`, `evals/capability/`, `evals/hybrid/`: Eval definitions by classification
- **CC v2.1.71 Compatibility**
  - /loop + Cron PDCA auto-monitoring
  - Background agent recovery (output file path fix)
  - stdin freeze fix for long CTO Team sessions

### Changed
- **Skills**: 27 → 28 (+1 pm-discovery)
- **Agents**: 16 → 21 (+5 PM Team: pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd)
- **lib/common.js exports**: 199 → 241 (+42 from executive-summary, template-validator, PM team modules)
- **CC recommended version**: v2.1.66 → v2.1.71
- **All 28 skills**: Added `classification`, `classification-reason`, `deprecation-risk` frontmatter fields
- **Documentation**: Full v1.6.0 doc-sync across 60+ files (versions, counts, architecture descriptions)

### Quality
- Comprehensive Test: 631 TC, 100% pass rate
- PM Team Integration: 16 GAPs, 100% match rate
- Doc-sync: 60+ files synchronized

### Compatibility
- Claude Code: Minimum v2.1.63, Recommended v2.1.71
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.9] - 2026-03-05

### Added
- **Executive Summary Module** (`lib/pdca/executive-summary.js`): 3 new exports (generateExecutiveSummary, formatExecutiveSummary, generateBatchSummary)
- **AskUserQuestion Preview UX**: Rich Markdown previews in PDCA phase transitions via buildNextActionQuestion()
- **plan-plus-stop.js**: New PostToolUse hook script for Plan Plus skill
- **ENH-74**: agent_id/agent_type first-class extraction in 5 hook scripts
- **ENH-75**: continue:false teammate lifecycle control in TaskCompleted/TeammateIdle hooks

### Changed
- **lib/common.js**: 184 → 199 exports (+15 from executive-summary and automation modules)
- **lib/pdca/automation.js**: Added buildNextActionQuestion(), formatAskUserQuestion with preview support
- **templates/plan.template.md**: Added Executive Summary section
- **templates/plan-plus.template.md**: Added Executive Summary section
- **templates/report.template.md**: Added Value Delivered table
- **skills/pdca/SKILL.md**: Added Executive Summary generation guidelines
- **hooks/hooks.json**: Removed InstructionsLoaded hook event (-6 lines)

### Fixed
- No bug fixes in this release

---

## [1.5.8] - 2026-03-01

### Added
- **Studio Support: Path Registry** (`lib/core/paths.js`)
  - Centralized state file path management replacing 11+ hardcoded path references
  - STATE_PATHS (7 keys): root, state, runtime, snapshots, pdcaStatus, memory, agentState
  - LEGACY_PATHS (4 keys): pdcaStatus, memory, snapshots, agentState (deprecated, v1.6.0 removal)
  - CONFIG_PATHS (3 keys): bkitConfig, pluginJson, hooksJson
  - `ensureBkitDirs()` for recursive directory creation
- **State Directory Migration**
  - `docs/.pdca-status.json` → `.bkit/state/pdca-status.json`
  - `docs/.bkit-memory.json` → `.bkit/state/memory.json`
  - `.bkit/agent-state.json` → `.bkit/runtime/agent-state.json`
  - `docs/.pdca-snapshots/` → `.bkit/snapshots/`
- **Auto-Migration on SessionStart**
  - Automatic v1.5.7 → v1.5.8 state file migration
  - EXDEV cross-filesystem fallback (copy + delete)
  - Per-file try-catch isolation for resilience
  - Idempotent operation (safe to re-run)

### Changed
- **lib/core/index.js**: Added paths module (+4 exports: STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs)
- **lib/common.js**: Bridge updated (182 → 186 exports, +4 path re-exports)
- **lib/pdca/status.js**: `getPdcaStatusPath()`, `readBkitMemory()`, `writeBkitMemory()` use STATE_PATHS
- **lib/memory-store.js**: `getMemoryFilePath()` uses STATE_PATHS.memory()
- **lib/task/tracker.js**: `findPdcaStatus()` uses getPdcaStatusPath() via lazy require
- **lib/team/state-writer.js**: `getAgentStatePath()` uses STATE_PATHS.agentState()
- **scripts/context-compaction.js**: snapshotDir uses STATE_PATHS.snapshots()
- **hooks/session-start.js**: Auto-migration logic (+45 lines), v1.5.8 context sections
- **bkit.config.json**: `pdca.statusFile` updated to `.bkit/state/pdca-status.json`

### Quality
- Comprehensive Test: 865 TC, 815 PASS, 0 FAIL, 50 SKIP (100%)
- 5 QA agents parallel execution, 1 iteration (hooks.json version fix)
- Design match rate: 100% (37/37 items)

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.63
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.7] - 2026-02-28

### Added
- **/simplify + /batch PDCA Integration** (ENH-52~55)
  - CC built-in /simplify command integrated into PDCA Check→Report flow
  - /batch multi-feature PDCA for Enterprise parallel processing
  - CC_COMMAND_PATTERNS: 8-language CC command awareness
  - HTTP Hooks documentation and guidance (type "http" in hooks config)
- **English Conversion**
  - 3 stop scripts converted to English output (code-review-stop, learning-stop, pdca-skill-stop)

### Changed
- **CC recommended version**: v2.1.59 → v2.1.63
- **Version**: 1.5.6 → 1.5.7
  - `plugin.json`, `bkit.config.json`, `hooks.json`, `session-start.js`

### Quality
- Comprehensive Test: 754 TC, 100% pass rate
- Doc-sync: 42 JS files + 5 doc files synchronized

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.63
- Node.js: Minimum v18.0.0

---

## [1.5.6] - 2026-02-26

### Added
- **Auto-Memory Integration** (ENH-48)
  - Add CC auto-memory guidance to SessionStart hook (Memory Systems section)
  - Add `/memory` command reference to bkit help (`commands/bkit.md`)
  - Clarify role separation between bkit memory-store and CC auto-memory
  - Fix agent memory count (9 -> 14 project scope agents)
- **CTO Team Memory Management Guide** (ENH-50)
  - New guide: `docs/guides/cto-team-memory-guide.md`
  - v2.1.50 + v2.1.59 multi-agent memory optimization best practices
  - Agent count recommendations and long session management tips
- **Remote Control Compatibility Pre-check** (ENH-51)
  - New guide: `docs/guides/remote-control-compatibility.md`
  - 27 skills + 16 agents RC compatibility matrix
  - Pre-check document for #28379 resolution

### Changed
- **Skill Completion /copy Guidance** (ENH-49)
  - `scripts/skill-post.js`: Add `copyHint` field on code generation skill completion
  - `scripts/unified-stop.js`: Add conditional `/copy` tip on Stop event
  - Target skills: phase-4~6, code-review, starter, dynamic, enterprise, mobile-app, desktop-app
- **Version**: 1.5.5 -> 1.5.6
  - `plugin.json`, `bkit.config.json`, `session-start.js`, `CHANGELOG.md`

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.59
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.5] - 2026-02-17

### Added
- **Plan Plus Skill** (Community Contribution by @wankiKim — PR #34)
  - New skill: `skills/plan-plus/SKILL.md` — Brainstorming-enhanced PDCA planning
  - 6-phase process: Context Exploration → Intent Discovery → Alternatives Exploration → YAGNI Review → Incremental Validation → Plan Document Generation
  - HARD-GATE enforcement: No code before plan approval
  - New template: `templates/plan-plus.template.md` with User Intent, Alternatives, YAGNI sections
  - 8-language trigger support (EN, KO, JA, ZH, ES, FR, DE, IT)
  - Seamless PDCA integration: `/plan-plus {feature}` → `/pdca design {feature}`

### Changed
- **Skills count**: 26 → 27 (+1 plan-plus)
- **Templates count**: 27 → 28 (+1 plan-plus.template.md)
- **skills/pdca/SKILL.md**: Added Plan Plus tip in plan action section (PR #34)
- **README.md**: Fixed duplicate Skills rows in Customization table (Community Contribution by @sungpeo — PR #33)

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.42
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.4] - 2026-02-14

### Added
- **bkend MCP Accuracy Fix (10 GAPs)**
  - MCP tool coverage: 19 (partial) → 28+ (complete)
  - MCP Fixed Tools: `get_context`, `search_docs`, `get_operation_schema`
  - MCP Project Management Tools: 9 tools (project/environment CRUD)
  - MCP Table Management Tools: 11 tools (table/schema/index management)
  - MCP Data CRUD Tools: 5 tools (`backend_data_list/get/create/update/delete`)
  - MCP Resources: 4 URI patterns (`bkend://` scheme)
  - Searchable Docs: 8 Doc IDs (`search_docs` query support)
- **bkend-patterns.md SSOT Expansion**
  - Shared patterns document: 85 → 140 lines (+65%)
  - New sections: REST API response format, query parameters, file upload, MCP setup, OAuth 2.1
- **bkend-expert Agent Rewrite**
  - MCP tools organized into 4 categories (Fixed/Project/Table/Data CRUD)
  - Dynamic Base URL (from `get_context`, no hardcoding)
  - MCP Resources (`bkend://` URI) reference added

### Changed
- **bkend-data/SKILL.md**: ID field `_id` → `id`, Data CRUD tools added, filter operators with `$` prefix
- **bkend-auth/SKILL.md**: MCP Auth Workflow pattern, REST endpoints 18 → 12 core, social login endpoint unified
- **bkend-storage/SKILL.md**: MCP Storage Workflow, multipart upload 4 endpoints, `download-url` GET → POST
- **bkend-quickstart/SKILL.md**: Numbered tools → named tools, Project Management 9 tools + Resources 4 URIs
- **bkend-cookbook/SKILL.md**: Live Reference URLs `src/` → `en/` paths
- **session-start.js**: bkend MCP status check `Dynamic` → `Dynamic || Enterprise` (GAP-10)
- **All Live Reference URLs**: `src/` directory paths → `en/` specific file paths

### Removed
- **bkend-expert.md**: Obsolete numbered Guide Tools references (`0_get_context` ~ `7_code_examples_data`)
- **bkend-auth/SKILL.md**: Account Lifecycle section (replaced by search_docs)
- **bkend-data/SKILL.md**: `backend_table_update` tool (non-existent tool)

### Quality
- Comprehensive Test Round 1: 708 TC, 705 PASS, 0 FAIL, 3 SKIP (100%)
- Comprehensive Test Round 2: 765 TC, 764 PASS, 0 FAIL, 1 SKIP (100%)
- bkend MCP Accuracy Fix: 10/10 GAPs, 42/42 items, 100% match rate

---

## [1.5.3] - 2026-02-10

### Added
- **Team Visibility (State Writer)**
  - `lib/team/state-writer.js`: 9 new functions for Agent Teams state management
  - `initAgentState`, `updateTeammateStatus`, `addTeammate`, `removeTeammate`, `updateProgress`, `addRecentMessage`, `cleanupAgentState`, `getAgentStatePath`, `readAgentState`
  - `.bkit/agent-state.json` schema v1.0 for Studio IPC
  - Atomic write pattern (tmp + rename) for concurrent safety
  - MAX_TEAMMATES=10, MAX_MESSAGES=50 ring buffer
- **SubagentStart/SubagentStop Hooks**
  - 2 new hook event types in `hooks.json` (8 → 10 events)
  - `scripts/subagent-start.js`, `scripts/subagent-stop.js`
  - Auto-init agent state, name extraction, model validation
- **Output Styles Auto-Discovery**
  - `outputStyles` field in `plugin.json` for Claude Code auto-discovery
  - 4th output style: `bkit-pdca-enterprise` added
  - `/output-style-setup` command for menu visibility
- **bkend Documentation Enhancement**
  - Official Documentation (Live Reference) sections in 5 bkend skills + agent
  - `bkend-quickstart` MCP step-by-step guide expansion
  - Agent Memory file for bkend-expert
- **CLAUDE.md Strategy Documentation**
  - `commands/bkit.md` expanded with CLAUDE.md strategy sections
  - v1.5.3 Features table in bkit help command

### Changed
- **Hook Events**: 8 → 10 (added SubagentStart, SubagentStop)
- **Library Functions**: 232 → 241 (+9 state-writer)
- **common.js exports**: 171 → 180 (+9 state-writer bridge)
- **team/index.js exports**: 31 → 40 (+9 state-writer)
- **Output Styles**: 3 → 4 (added bkit-pdca-enterprise)
- **team.enabled**: Default changed from false to true
- **session-start.js**: 4 output styles + /output-style-setup guide

### Fixed
- **GAP-01**: common.js missing 9 state-writer re-exports (171 → 180)

### Quality
- Comprehensive Test: 685 TC, 646 PASS, 39 SKIP (100% excl. SKIP)
- Enhancement Test: 31/31 PASS (100%)
- Final QA: 736/736 PASS (100%)

---

## [1.5.2] - 2026-02-06

### Added
- **bkend.ai BaaS Expert Enhancement**
  - 5 new bkend specialist Skills (21 → 26 total):
    - `bkend-quickstart`: Platform onboarding, MCP setup, resource hierarchy
    - `bkend-data`: Database expert (table creation, CRUD, 7 column types, filtering)
    - `bkend-auth`: Authentication expert (email/social login, JWT, RBAC, RLS)
    - `bkend-storage`: File storage expert (Presigned URL, 4 visibility levels)
    - `bkend-cookbook`: Practical tutorials (10 project guides, troubleshooting)
  - Shared template: `templates/shared/bkend-patterns.md`
  - Agent-Skill binding: `bkend-expert` preloads 3 core skills (data, auth, storage)
  - MCP auto-detection in session start and prompt handler

### Changed
- **agents/bkend-expert.md**: Complete rewrite (~215 lines)
  - MCP Tools reference (19 tools: 8 guide + 11 API)
  - REST Service API endpoints (Database 5, Auth 18, Storage 12)
  - OAuth 2.1 + PKCE authentication pattern
  - Troubleshooting table (12+ scenarios)
- **skills/dynamic/SKILL.md**: MCP integration modernization
  - MCP setup: `npx @bkend/mcp-server` → `claude mcp add bkend --transport http`
  - Authentication: API Key → OAuth 2.1 + PKCE
- **skills/phase-4-api/SKILL.md**: BaaS implementation guide added
- **lib/intent/language.js**: bkend-expert 8-language trigger patterns
- **hooks/session-start.js**: bkend MCP status detection
- **templates/plan.template.md**: BaaS architectural options added
- **templates/design.template.md**: BaaS architecture patterns added

### Fixed
- **BUG-01 (Critical)**: `scripts/user-prompt-handler.js` Line 72
  - Agent trigger confidence: `> 0.8` → `>= 0.8`
  - Impact: All 16 agents' implicit triggers were broken in UserPromptSubmit hook

### Compatibility
- Claude Code: Minimum v2.1.15, Recommended v2.1.33
- Node.js: Minimum v18.0.0
- bkend.ai: MCP endpoint via OAuth 2.1 + PKCE

---

## [1.5.1] - 2026-02-06

### Added
- **CTO-Led Agent Teams**: Multi-agent parallel PDCA execution orchestrated by CTO lead agent
  - CTO lead (opus) orchestrates team composition, task assignment, and quality gates
  - 5 new team agents: `cto-lead`, `frontend-architect`, `product-manager`, `qa-strategist`, `security-architect`
  - `lib/team/` module expanded to 7 files: coordinator, strategy, hooks, index, orchestrator, communication, task-queue, cto-logic
  - Team composition: Dynamic (3 teammates), Enterprise (5 teammates)
  - New hook handlers: `pdca-task-completed.js` (TaskCompleted), `team-idle-handler.js` (TeammateIdle), `team-stop.js`, `cto-stop.js`
  - `team` configuration section in `bkit.config.json`
  - Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
  - Total agents: 16 (11 core + 5 CTO Team)

- **Output Styles System**: Level-based response formatting
  - 3 styles in `output-styles/` directory:
    - `bkit-learning` for Starter level (learning points, TODO markers)
    - `bkit-pdca-guide` for Dynamic level (status badges, checklists)
    - `bkit-enterprise` for Enterprise level (tradeoff analysis, cost impact)
  - `outputStyles` configuration in `bkit.config.json` with `levelDefaults`

- **Agent Memory Integration**: Cross-session context persistence
  - `memory: user` scope for starter-guide, pipeline-guide (cross-project learning)
  - `memory: project` scope for 14 agents (project-specific context)
  - No configuration needed — auto-active

- **Natural Feature Discovery**: Philosophy-aligned auto-trigger integration
  - `bkit-rules/SKILL.md`: 3 new sections (Output Style Auto-Selection, Agent Teams Auto-Suggestion, Agent Memory Awareness)
  - `session-start.js`: Feature awareness block (styles, teams, memory) at every session start
  - Level skills: v1.5.1 feature announcements per level (Starter/Dynamic/Enterprise)
  - All 16 agents: v1.5.1 Feature Guidance sections
  - `claude-code-learning/SKILL.md`: Level 6 (Advanced Features) curriculum
  - `pdca/SKILL.md`: Output Style + Agent Teams integration sections

- **PDCA Team Mode**: `/pdca team {feature}` for CTO-Led parallel PDCA execution
  - `/pdca team status` to monitor teammate progress
  - `/pdca team cleanup` to end team session

- **New Hook Events**: `TaskCompleted` and `TeammateIdle` support in `hooks/hooks.json`

- **bkit Memory Functions**: `readBkitMemory()` and `writeBkitMemory()` for `docs/.bkit-memory.json` CRUD

- **bkit-system Documentation**: v1.5.1 coverage across 16 system docs
  - Philosophy docs (4): v1.5.1 feature integration sections
  - Component overviews (4): Agent Memory, Teams, Styles coverage
  - Trigger docs (2): Output Style, Agent Teams, Agent Memory triggers
  - New scenario: `scenario-discover-features.md`
  - Test checklist: 19 new test cases (OS-T:7, AT-T:7, AM-T:5)

### Fixed
- **BUG-01 (Critical)**: `checkPhaseDeliverables()` now supports both number (pipeline phase 1-9) and string (PDCA phase name) input types
- **BUG-02 (Medium)**: `scripts/iterator-stop.js` - Added optional chaining (`phaseAdvance?.nextPhase`) to prevent TypeError
- **BUG-03 (Medium)**: `scripts/gap-detector-stop.js` - Added optional chaining (`phaseAdvance?.nextPhase`) to prevent TypeError
- **BUG-04 (Low)**: Added missing `readBkitMemory`/`writeBkitMemory` exports in `lib/pdca/status.js`, `lib/pdca/index.js`, and `lib/common.js`

### Changed
- **lib/common.js**: Added Team module re-exports (30 team functions, total 165 exports)
- **lib/team/**: Expanded from 4 to 7+ files (added orchestrator.js, communication.js, task-queue.js, cto-logic.js)
- **Agent count**: Increased from 11 to 16 (5 new CTO Team agents)
- **Plugin metadata**: Updated `plugin.json` version to 1.5.1
- **Claude Code compatibility**: Minimum v2.1.15, Recommended v2.1.33

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.33
- **Node.js**: Minimum v18.0.0
- **Agent Teams**: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.0] - 2026-02-01

### Breaking Changes
- **Claude Code Exclusive**: bkit is now Claude Code exclusive plugin
  - Gemini CLI support has been removed
  - All dual-platform code branches eliminated
  - Simplified codebase with single-platform focus

### Removed
- **Gemini CLI Files**:
  - `gemini-extension.json` - Gemini CLI extension manifest
  - `GEMINI.md` - Gemini CLI context file
  - `commands/gemini/` - 20 TOML command files
  - `lib/adapters/gemini/` - Gemini adapter implementations
  - `debug-platform.js` - Platform debugging utility
  - `lib/common.js.backup` - Backup file cleanup

- **Gemini CLI Code**:
  - `lib/core/platform.js`: Removed `isGeminiCli()` function and Gemini detection
  - `lib/core/io.js`: Removed Gemini output format branches from `outputAllow()`, `outputBlock()`, `outputEmpty()`
  - `lib/core/debug.js`: Removed Gemini log path from `getDebugLogPaths()`
  - `lib/context-hierarchy.js`: Removed Gemini config path from `getUserConfigDir()`
  - `hooks/session-start.js`: Removed ~70 lines of Gemini-specific code
  - 8 scripts: Removed `isGeminiCli` imports and platform branches

### Changed
- **README.md**: Removed all Gemini CLI references
  - Removed Gemini CLI badge
  - Removed "Dual Platform Support" messaging
  - Removed Gemini CLI installation section
  - Updated plugin structure documentation
- **Version**: Updated all version references to 1.5.0

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.25
- **Node.js**: Minimum v18.0.0

### Migration Guide
If you were using bkit with Gemini CLI, please note that Gemini CLI support has been discontinued.
For Gemini CLI users, consider using native Gemini CLI extensions or alternative tools.

---

## [1.4.7] - 2026-01-29

### Added
- **Task Management + PDCA Integration**: Complete integration of Claude Code Task System
  - Task Chain Auto-Creation on `/pdca plan`
  - Task ID Persistence in `.pdca-status.json`
  - Check↔Act Iteration (max 5 iterations, 90% threshold)
  - Full-Auto Mode (manual/semi-auto/full-auto)
  - 9 new functions: `savePdcaTaskId`, `createPdcaTaskChain`, `triggerNextPdcaAction`, etc.
- **Core Modularization**: lib/common.js split into 4 module directories
  - `lib/core/` - Platform detection, caching, debugging, configuration (7 files)
  - `lib/pdca/` - PDCA phase management, status tracking (6 files)
  - `lib/intent/` - Intent analysis, language detection, triggers (4 files)
  - `lib/task/` - Task classification, creation, tracking (5 files)
  - 22 new module files, 132 function exports
  - Migration Bridge for 100% backward compatibility
  - Lazy Require Pattern for circular dependency prevention

### Changed
- **lib/common.js**: Converted to Migration Bridge (3,722 → 212 lines)
- **scripts/pdca-skill-stop.js**: Task chain creation integration
- **scripts/gap-detector-stop.js**: triggerNextPdcaAction integration
- **scripts/iterator-stop.js**: triggerNextPdcaAction integration

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.22
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.6] - 2026-01-28

### Fixed
- **Plugin Agent Prefix**: All bkit plugin agents now correctly use `bkit:` prefix
  - Fixes "Agent type 'gap-detector' not found" error in Claude Code Task tool
  - Claude Code requires plugin agents to be called as `{plugin-name}:{agent-name}`
  - 11 agents updated: gap-detector, code-analyzer, pdca-iterator, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect
  - Built-in agent `claude-code-guide` correctly remains without prefix

### Changed
- **lib/common.js**: `matchImplicitAgentTrigger()` now returns `bkit:` prefixed agent names
- **18 SKILL.md files**: Updated `agent:` and `agents:` frontmatter fields with `bkit:` prefix
- **hooks/session-start.js**: Trigger keyword table updated with `bkit:` prefix
- **skills/bkit-rules/SKILL.md**: Task-Based Selection table updated with `bkit:` prefix
- **Command Renamed**: `/bkit:functions` → `/bkit:bkit`
  - File renamed: `commands/functions.md` → `commands/bkit.md`
  - More intuitive command name for plugin help
- **Test files removed from repository**: `tests/` and `test-scripts/` directories
  - Added to `.gitignore` (local testing only, not for distribution)
  - 66 test files removed from git tracking (12,502 lines)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.5] - 2026-01-27

### Added
- **`/pdca archive` Action**: Complete PDCA cycle with document archiving
  - Move completed PDCA documents to `docs/archive/YYYY-MM/{feature}/`
  - Update Archive Index automatically
  - Remove feature from activeFeatures after archiving
- **`/bkit:functions` Command**: Skills autocomplete workaround (GitHub #10246, #18949)
  - Single entry point showing all available bkit skills
  - Renamed from `/bkit:menu` for clarity
- **8-Language Trigger Completion**: Full multilingual support
  - Added ES, FR, DE, IT triggers to all 11 agents and 21 skills
  - Complete coverage: EN, KO, JA, ZH, ES, FR, DE, IT

### Changed
- **Internationalization**: Korean content translated to English
  - All skill descriptions, guides, and documentation in English
  - 8-language trigger keywords preserved for auto-activation
  - ~600 lines translated, ~100 trigger keywords added
- **`github-integration` Skill**: Made internal-only (company use)
  - Added to `.gitignore`
  - Public skill count: 21 (unchanged, was already counted)
- **Command Renaming**: `/bkit` → `/bkit:menu` → `/bkit:functions`

### Documentation
- Archived 10 completed PDCA features to `docs/archive/2026-01/`
- Added `skills-autocomplete-research-2026-01.md` research report
- Updated all version references across documentation

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.4] - 2026-01-27

### Added
- **PDCA Skill Integration**: Unified `/pdca` skill with 8 actions
  - `plan`, `design`, `do`, `analyze`, `iterate`, `report`, `status`, `next`
  - Replaces individual `/pdca-*` commands
  - Task Management System integration for tracking
- **hooks-json-integration**: Centralized hook management (GitHub #9354 workaround)
  - `scripts/unified-stop.js` (223 lines) - 14 handlers (10 skills, 4 agents)
  - `scripts/unified-bash-pre.js` (134 lines) - 2 handlers
  - `scripts/unified-write-post.js` (166 lines) - 4 handlers
  - `scripts/unified-bash-post.js` (80 lines) - 1 handler
- **skill-orchestrator.js**: New library module for skill action routing
- **New Skills** (3):
  - `pdca` - Unified PDCA cycle management
  - `code-review` - Code review and quality analysis
  - `claude-code-learning` - Claude Code learning guide

### Changed
- **Commands deprecated**: All `commands/*.md` migrated to Skills
  - See `commands/DEPRECATED.md` for migration guide
  - Commands still available via `commands/gemini/` for Gemini CLI
- **Skills count**: Increased from 18 to 21
- **Scripts count**: Increased from 28 to 39
- **Library modules**: Increased from 6 to 7 (added `skill-orchestrator.js`)
- **Hook system**: Migrated from SKILL.md frontmatter to centralized `hooks.json`
- **bkit feature report**: Updated to use Skills instead of deprecated Commands

### Deprecated
- All commands in `commands/*.md` (use Skills instead)
- SKILL.md frontmatter hooks (use `hooks.json` instead)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.3] - 2026-01-26

### Added
- **FR-1.1: Hook Context XML Wrapping Compatibility** - Safe output for Gemini CLI v0.27+ XML-wrapped hook contexts
  - New `xmlSafeOutput()` function in `lib/common.js` for XML special character escaping
  - Characters escaped: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`
  - Applied to `outputAllow()` and `outputBlock()` functions for Gemini CLI output

### Changed
- **FR-1.2: engines Version Update** - Updated Gemini CLI minimum version requirement
  - `gemini-extension.json`: `engines.gemini-cli` changed from `>=1.0.0` to `>=0.25.0`
  - Reason: Hook System enabled by default since v0.25.0

### Documentation
- **Plan Document**: `docs/01-plan/features/gemini-cli-v026-compatibility.plan.md`
  - Comprehensive compatibility analysis for Gemini CLI v0.25.0 ~ v0.27.0-nightly
  - 12 test tasks completed with Task Management System
  - Test results: beforeAgent/fireAgent not used (compatible), Hook XML wrapping conditionally compatible
- **Design Document**: `docs/02-design/features/gemini-cli-v026-compatibility.design.md`
  - Detailed implementation specification for xmlSafeOutput() function
  - Architecture diagram for Hook System with XML wrapper
  - Test plan with unit test cases and compatibility matrix

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v0.25.0 (updated from v1.0.0)
- **Node.js**: Minimum v18.0.0

---

## [1.4.2] - 2026-01-26

### Added
- **FR-01: Multi-Level Context Hierarchy** - 4-level context (Plugin → User → Project → Session)
- **FR-02: @import Directive** - External context file loading support
- **FR-03: context:fork** - Skill/Agent isolated context execution
- **FR-04: UserPromptSubmit Hook** - User input preprocessing
- **FR-05: Permission Hierarchy** - deny → ask → allow permission chain
- **FR-06: Task Dependency Chain** - PDCA phase-based task blocking
- **FR-07: Context Compaction Hook** - PDCA state preservation during compaction
- **FR-08: MEMORY Variable** - Session-persistent data storage

### Fixed
- **outputAllow() API Schema**: Removed invalid `decision: 'allow'` from UserPromptSubmit, added `hookEventName` field
- **PreCompact Hook Registration**: Registered in hooks.json to activate context-compaction.js
- **UserPromptSubmit Bug Detection**: Auto-detection for GitHub #20659 plugin bug
- **context:fork Scanning**: SessionStart scans skills for fork configuration
- **Import Preloading**: Common imports checked at session start

### New Files
- `lib/context-hierarchy.js` - Multi-level context management
- `lib/import-resolver.js` - @import directive processing
- `lib/context-fork.js` - Context isolation
- `lib/permission-manager.js` - Permission hierarchy
- `lib/memory-store.js` - Persistent memory storage
- `scripts/user-prompt-handler.js` - UserPromptSubmit hook
- `scripts/context-compaction.js` - PreCompact hook

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v1.0.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.1] - 2026-01-24

### Added
- **Response Report Rule**: AI Agent automatically reports bkit feature usage at the end of each response
  - Claude Code: Rule added to `hooks/session-start.js` additionalContext
  - Gemini CLI: Response Report Rule section added to `GEMINI.md`
  - Report format: Used features, unused reasons, PDCA phase-based recommendations
- **Claude Code 2.1.19 Compatibility**: Compatibility testing completed
  - 99 components tested and passed
  - No breaking changes confirmed
  - New features (additionalContext, Task System) documented

### Changed
- **Version references**: Updated all version references from 1.4.0 to 1.4.1
- **session-start.js**: v1.4.1 Changes comment and report rule added (+62 lines)
- **GEMINI.md**: Response Report Rule section added (+50 lines)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v1.0.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.0] - 2026-01-24

### Added
- ~~**Dual Platform Support**: bkit now supports both Claude Code and Gemini CLI~~ *(Removed in v1.5.0)*
  - ~~New `gemini-extension.json` manifest for Gemini CLI~~ *(Removed in v1.5.0)*
  - ~~New `GEMINI.md` context file (equivalent to CLAUDE.md)~~ *(Removed in v1.5.0)*
  - ~~New `commands/gemini/` directory with TOML-format commands (20 commands)~~ *(Removed in v1.5.0)*
  - ~~Hook mapping: `BeforeTool`/`AfterTool` for Gemini (vs `PreToolUse`/`PostToolUse` for Claude)~~ *(Removed in v1.5.0)*
- **PDCA Status v2.0 Schema**: Multi-feature context management
  - `features` object for tracking multiple features simultaneously
  - `activeFeature` for current working context
  - Auto-migration from v1.0 schema via `migrateStatusToV2()`
- **lib/common.js Expansion**: 86+ functions (up from 38)
  - **Platform Detection**: `detectPlatform()`, ~~`isGeminiCli()`~~ *(Removed in v1.5.0)*, `isClaudeCode()`, `getPluginPath()`
  - **Caching System**: In-memory TTL-based cache (`_cache` object)
  - **Debug Logging**: `debugLog()` with platform-specific paths
  - **Multi-Feature Management**: `setActiveFeature()`, `addActiveFeature()`, `getActiveFeatures()`, `switchFeatureContext()`
  - **Intent Detection**: `detectNewFeatureIntent()`, `matchImplicitAgentTrigger()`, `matchImplicitSkillTrigger()`
  - **Ambiguity Detection**: `calculateAmbiguityScore()`, `generateClarifyingQuestions()`
  - **Requirement Tracking**: `extractRequirementsFromPlan()`, `calculateRequirementFulfillment()`
  - **Phase Validation**: `checkPhaseDeliverables()`, `validatePdcaTransition()`
- **8-Language Intent Detection**: Extended multilingual support
  - EN, KO, JA, ZH (existing)
  - ES (Spanish), FR (French), DE (German), IT (Italian) (new)
  - Implicit agent/skill triggering via natural language keywords
- **New Scripts** (5):
  - `phase-transition.js`: PDCA phase transition validation
  - `phase1-schema-stop.js`: Schema phase completion handler
  - `phase2-convention-stop.js`: Convention phase completion handler
  - `phase3-mockup-stop.js`: Mockup phase completion handler
  - `phase7-seo-stop.js`: SEO/Security phase completion handler

### Changed
- **Script Count**: Increased from 21 to 26
- **hooks/hooks.json**: Updated for Gemini CLI compatibility
- **Environment Variables**:
  - `BKIT_PLATFORM`: Auto-set to "claude" or "gemini"
  - `GEMINI_PROJECT_DIR`: Gemini CLI project directory
- **Agent Descriptions**: Updated all 11 agents with multilingual triggers

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.17
- ~~**Gemini CLI**: Minimum v1.0.0~~ *(Removed in v1.5.0)*
- **Node.js**: Minimum v18.0.0

---

## [1.3.2] - 2026-01-23

### Fixed
- **Hook Execution Permission**: Added explicit `node` command prefix to all hook commands
  - Fixes "SessionStart:startup hook error" on plugin installation
  - No longer requires `chmod +x` for .js files
  - Pattern: `"command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/xxx.js"`
- **Cross-Platform Compatibility**: Windows users no longer need WSL for hook execution
  - Windows doesn't support shebang (`#!/usr/bin/env node`)
  - Explicit `node` command ensures consistent behavior across all platforms

### Changed
- **hooks/hooks.json**: All 3 hook commands now use `node` prefix
- **skills/*.md**: Updated 7 skill files with `node` command prefix
- **agents/*.md**: Updated 5 agent files with `node` command prefix
- **Documentation**: Updated CUSTOMIZATION-GUIDE.md and bkit-system docs

---

## [1.3.1] - 2026-01-23

### Changed
- **Cross-Platform Hooks**: All 22 hook scripts converted from Bash (.sh) to Node.js (.js)
  - Windows Native environment now fully supported
  - No external dependencies required (jq, bash, wc, grep removed)
  - Shebang: `#!/usr/bin/env node` for universal compatibility
- **lib/common.js**: New centralized library replacing lib/common.sh
  - 30 functions across 9 categories
  - Pure Node.js implementation
  - Synchronous stdin reading for hooks
- **hooks/hooks.json**: Updated all script references from .sh to .js
- **bkit-system documentation**: Updated all references from .sh to .js

### Added
- **hooks/session-start.js**: SessionStart hook converted to Node.js
- **Input Helpers**: New functions for hook input handling
  - `readStdinSync()`: Synchronous JSON input from stdin
  - `readStdin()`: Async version for complex scenarios
  - `parseHookInput()`: Extract common fields from hook input

### Removed
- **Bash Scripts**: All 21 .sh files in scripts/ directory
- **hooks/session-start.sh**: Replaced by session-start.js
- **lib/common.sh**: Replaced by lib/common.js

### Fixed
- **Windows Compatibility**: Hooks now work on Windows without WSL or Git Bash
- **Skills/Agents References**: Updated all .sh references to .js (12 files)
- **Global Hooks**: hooks/hooks.json now references .js files correctly

### Compatibility
- **Minimum Claude Code Version**: 2.1.15
- **Recommended Claude Code Version**: 2.1.17
- **Supported Platforms**: Windows (Native), macOS, Linux

---

## [1.3.0] - 2026-01-22

### Added
- **Check-Act Iteration Loop**: Automatic gap analysis and fix cycles
  - `pdca-iterator` agent orchestrates evaluation-optimization loop
  - Maximum 5 iterations per session with 90% pass threshold
  - Auto-invoked when Match Rate < 90%
- **SessionStart Enhancement**: AskUserQuestion integration for session initialization
  - 4 options: Learn bkit, Learn Claude Code, Continue Previous Work, Start New Project
- **Trigger Keyword Mapping**: Agent auto-triggering based on user keywords
  - verify → gap-detector, improve → pdca-iterator, etc.
- **Task Size Rules**: PDCA application guidance based on change size
  - Quick Fix (<10 lines): No PDCA needed
  - Minor Change (<50 lines): Light PDCA optional
  - Feature (<200 lines): PDCA recommended
  - Major Feature (>=200 lines): PDCA required
- **New Commands**: `/archive`, `/github-stats`

### Changed
- **Version references**: Updated all version references from 1.2.x to 1.3.0
- **Component counts**: Commands increased from 18 to 20

### Compatibility
- **Minimum Claude Code Version**: 2.1.12
- **Recommended Claude Code Version**: 2.1.15

---

## [1.2.3] - 2026-01-22

### Added
- **Claude Code 2.1.15 Impact Analysis**: Added version compatibility documentation
  - `docs/pdca/03-analysis/12-claude-code-2.1.15-impact-analysis.md`
  - npm installation deprecation notice (use `claude install` instead)
  - MCP stdio server timeout fix analysis
  - UI rendering performance improvements

### Changed
- **README Badge Update**: Claude Code version badge updated to v2.1.15+
  - Link updated to official getting-started documentation

### Compatibility
- **Minimum Claude Code Version**: 2.1.12
- **Recommended Claude Code Version**: 2.1.15
- All 2.1.14 improvements (98% context, parallel agents, memory fix) remain available

---

## [1.2.2] - 2026-01-21

### Changed
- **Documentation Structure Reorganization**: Clear separation of docs/ and bkit-system/ roles
  - `bkit-system/` = "What IS" (current implementation reference)
  - `docs/pdca/` = "What WE DO" (active PDCA work)
  - `docs/archive/` = "What WE DID" (completed documents)
- **New Philosophy Section**: Added `bkit-system/philosophy/` with core documentation
  - `core-mission.md`: Core mission & 3 philosophies
  - `ai-native-principles.md`: AI-Native development & Language Tier System
  - `pdca-methodology.md`: PDCA cycle & 9-stage pipeline relationship

### Fixed
- **Broken Wikilinks**: Fixed 30+ broken Obsidian wikilinks across bkit-system/ documentation
  - Updated skill/agent links to point to actual source files
  - Pattern: `[[../../skills/skill-name/SKILL|skill-name]]`

## [1.2.1] - 2026-01-20

### Added
- **Language Tier System**: 4-tier classification for AI-Native development
  - Tier 1 (AI-Native Essential): Python, TypeScript, JavaScript
  - Tier 2 (Mainstream Recommended): Go, Rust, Dart, Vue, Svelte, Astro
  - Tier 3 (Domain Specific): Java, Kotlin, Swift, C/C++
  - Tier 4 (Legacy/Niche): PHP, Ruby, C#, Scala, Elixir
  - Experimental: Mojo, Zig, V
- **New Tier Detection Functions** in `lib/common.js`:
  - `get_language_tier()`: Get tier (1-4, experimental, unknown) for file
  - `get_tier_description()`: Get tier description
  - `get_tier_pdca_guidance()`: Get PDCA guidance based on tier
  - `is_tier_1()`, `is_tier_2()`, `is_tier_3()`, `is_tier_4()`, `is_experimental_tier()`: Tier check helpers
- **New Extension Support**: `.dart`, `.astro`, `.mdx`, `.mojo`, `.zig`, `.v`
- **Tier Guidance in Skills**: Added tier recommendations to starter, dynamic, enterprise, mobile-app, desktop-app skills

### Changed
- **is_code_file()**: Refactored to use Tier constants (30+ extensions)
- **is_ui_file()**: Added `.astro` support
- **CLAUDE.template.md**: Added Tier context section
- **Documentation**: Updated all bkit-system/, docs/, skills/ with Tier system info

### Fixed
- **Environment Variables**: Fixed `CLAUDE_PROJECT_DIR` vs `CLAUDE_PLUGIN_ROOT` usage in hooks
- **Hook JSON Output**: Stabilized JSON output handling with proper exit codes

## [1.2.0] - 2026-01-20

### Added
- **Centralized Configuration**: Added `bkit.config.json` for centralized settings
  - Task classification thresholds
  - Level detection rules
  - PDCA document paths
  - Template configurations
- **Shared Utilities**: Added `lib/common.js` with reusable functions
  - `get_config()`: Read values from bkit.config.json
  - `is_source_file()`: Check if path is source code
  - `extract_feature()`: Extract feature name from file path
  - `classify_task()`: Classify task by content size
  - `detect_level()`: Detect project level
- **Customization Guide**: Added documentation for customizing plugin components
  - Copy from `~/.claude/plugins/bkit/` to project `.claude/`
  - Project-level overrides take priority over plugin defaults
- **Skills Frontmatter Hooks**: Added hooks directly in SKILL.md frontmatter for priority skills
  - `bkit-rules`: SessionStart, PreToolUse (Write|Edit), Stop hooks
  - `bkit-templates`: Template selection automation
- **New Scripts**: Added automation scripts
  - `pre-write.js`: Unified pre-write hook combining PDCA and task classification
  - `select-template.js`: Template selection based on document type and level
  - `task-classify.js`: Task size classification for PDCA guidance

### Changed
- **Repository Structure**: Removed `.claude/` folder from version control
  - Plugin elements now exist only at root level (single source of truth)
  - Local development uses symlinks from `.claude/` to root
  - Users customize by copying from `~/.claude/plugins/bkit/` to project `.claude/`
- **Zero Script QA Hooks**: Converted from `type: "prompt"` to `type: "command"`
- **Template Version**: Bumped PDCA templates from v1.0 to v1.1

### Removed
- **Deprecated Skills**: Consolidated redundant skills into core skills
  - `ai-native-development` → merged into `bkit-rules`
  - `analysis-patterns` → merged into `bkit-templates`
  - `document-standards` → merged into `bkit-templates`
  - `evaluator-optimizer` → available via `/pdca-iterate` command
  - `level-detection` → moved to `lib/common.js`
  - `monorepo-architecture` → merged into `enterprise`
  - `pdca-methodology` → merged into `bkit-rules`
  - `task-classification` → moved to `lib/common.js`
- **Instructions Folder**: Removed deprecated `.claude/instructions/`
  - Content migrated to respective skills

### Fixed
- **Single Source of Truth**: Eliminated dual maintenance between root and `.claude/` folders

## [1.1.4] - 2026-01-15

### Fixed
- Simplified hooks system and enhanced auto-trigger mechanisms
- Added Claude Code hooks analysis document (v2.1.7)

## [1.1.0] - 2026-01-09

### Added
- Initial public release of bkit
- PDCA methodology implementation
- 9-stage Development Pipeline
- Three project levels (Starter, Dynamic, Enterprise)
- 11 specialized agents
- 26 skills for various development phases
- Zero Script QA methodology
- Multilingual support (EN, KO, JA, ZH)
