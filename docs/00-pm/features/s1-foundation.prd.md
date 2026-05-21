---
template: pm-prd
version: 2.0
feature: s1-foundation
date: 2026-05-21
author: kay (메인 세션, control level 4 full-auto, Bootstrap Exception until F1-1 landing)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: prd)
sprint_id: s1-foundation
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.1 + §5 (Level 0)
predecessor_sprint: s0-sqm-baseline (archived, SQM baseline 59.75)
blocks: ['s2-defense', 's3-polish', 's4-proactive', 's5-measurement']
absorbed_carryovers: ['CO-S0-6 (sprint-handler --approve semantic)']
deferred_carryovers_to: { 'CO-S0-5 (findFirstMatching pattern)': 's5-measurement', 'CO-S0-1 (sqm-calculator evolve)': 's5-measurement' }
---

# S1 — Self-Dogfooding Enablement (Product Requirements Document)

> **Sprint ID**: `s1-foundation`
> **Date**: 2026-05-21
> **Author**: kay (메인 세션, Bootstrap Exception 모드 — F1-1 landing 시점까지 PDCA-with-sprint-shadow)
> **Method**: bkit PDCA full cycle (9-phase) 운영 + 5 features 통합 design + 실 환경 동작 검증 (`--plugin-dir .`)
> **Status**: Draft (sprint phase = `prd`)
> **Master Plan reference**: `docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md` §4.1 (S1 Foundation features), §5 (Level 0 root), §19.5 (Bootstrap Exception)
> **Predecessor**: S0 archived (SQM baseline 59.75, master plan §7.2 target ≥85 유지 결정)

---

## Executive Summary

### 4-Perspective

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit v2.1.18 이후에도 **chicken-and-egg paradox 가 영구 해소되지 않음**: (a) sprint-orchestrator agent 가 `tools: [Task]` allowlist 가 명시되어 있어도 *integration test 가 부재* — Task dispatch 가 실제로 작동하는지 *live evidence* 없음. (b) bkit 자체가 자기 sprint 기능으로 자기 release 운영하지 않음 (v2.1.14~v2.1.18 모두 sprint 0/5, S0 measurement evidence). (c) `/sprint init` default trust level (현재 sprint-handler.js 의 normalizeTrustLevel default 가 L3) 의 명시적 정책 부재 + L1 진입 시 lockout 위험에 대한 사용자 명시적 warning 없음 (#101 의 잠재적 재발). (d) v2.1.18 의 `/sprint trust` 명령이 trust mutation 을 cover 했지만, **archived sprint 에 대한 annotation primitive 부재** — sprint 완료 후 post-hoc 정보 추가 (예: release tag, retrospective note) 불가능. (e) self-dogfood CI gate 부재 — 차후 release 가 sprint container 로 운영되었는지 *강제 verify* 메커니즘 없음. |
| **Solution** | **5 features 통합 implementation** (hard-link 의존성): **F1-1** `agents/sprint-orchestrator.md` 의 Task allowlist 가 실제 작동하는지 verify 하는 integration test (contract baseline + 실 dispatch evidence). **F1-2** sprint-handler 에 `case 'dogfood'` action 추가 — bkit 자체 release 의 self-dogfood sprint 운영 mode (master plan §19 Self-Dogfooding CI Gate 의 callee). **F1-3** `scripts/check-self-dogfood.sh` CI gate — 직전 release 가 sprint container 로 운영되었는지 release tag 직전 강제 verify (`--bootstrap-mode` flag 로 v2.1.19 자체는 first activation 의 exception 처리). **F1-4** `sprint-handler.js handleInit` 의 default trust level 을 L1 → L2 로 격상 + `--trust L1` 명시적 사용 시 audit warning emit (lockout 위험 사전 안내). **F1-5** `/sprint annotate <id> --reason "..."` 신규 action — archived sprint 의 post-hoc annotation (single field 만 mutation, anti-mission 준수 closed enum). |
| **Function/UX Effect** | (a) `node test/contract/agents/sprint-orchestrator-task-dispatch.test.js` 실행 시 sprint-orchestrator agent definition + 실 sub-agent dispatch sample 모두 verify (Task dispatch 가 *declared* → *live* 승격 첫 release). (b) `/sprint dogfood v2.1.20-release --release-tag v2.1.20` 명령으로 bkit release 가 자기 sprint container 운영 가능. (c) `./scripts/check-self-dogfood.sh` (또는 `--bootstrap-mode`) 가 v2.1.20 release tag 직전 강제 실행 — fail 시 release block. (d) `/sprint init my-sprint --trust L1` 시 stderr 에 명시적 warning + audit log 의 `sprint_trust_warning` event. (e) `/sprint annotate s0-sqm-baseline --reason "v2.1.19 GA reference baseline"` 명령으로 archived sprint 에 retrospective note 추가 (sprint state `annotations: []` field append). |
| **Core Value** | **v2.1.18 self-referential meta risk 의 패턴이 v2.1.19 부터 영구 해소** — bkit 이 *진짜로* 자기 sprint 기능으로 자기 release 를 운영. 차후 모든 sub-sprint (S2/S3/S4/S5) 가 Bootstrap Exception 모드 종료 후 Full sprint mode 진입. Master plan §19.5 의 Bootstrap Exception → v2.1.20+ first true gate activation 의 transition 완료. ENH-292 Sequential Dispatch 차별화의 "declared → live" 가 **integration test PASS evidence** 로 입증됨. |

### Key Decisions

| 항목 | 값 |
|------|-----|
| Total features | 5 (F1-1 ~ F1-5) |
| Total LOC est. | ~810 (250 + 180 + 220 + 80 + 80) |
| Total TC est. | 28 (8 + 6 + 7 + 4 + 3) |
| Trust Level | L4 (S0 와 동일, full-auto) |
| Bootstrap Exception mode | 적용 — F1-1 landing 시점까지 main session manual proxy |
| Self-dogfood CI gate activation target | v2.1.20 (master plan §19.5) |
| Carry-over absorbed | CO-S0-6 (sprint-handler --approve semantic) — §3.6 doc patch |
| Carry-over deferred | CO-S0-5 (findFirstMatching), CO-S0-1 (sqm-calculator evolve) → S5 |

---

## 1. Opportunity Discovery (pm-discovery 관점)

### 1.1 Desired Outcome

**Outcome**: "bkit team 이 자신의 sprint 기능으로 자신의 release 를 운영하고, sprint-orchestrator 의 Task dispatch 가 *live integration test* 로 검증되며, 차후 release 가 sprint container 로 운영되었는지 CI gate 가 강제 verify 한다."

**측정 가능 KR**:
- KR1: `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` 가 PASS (5 sprint-* agents 의 frontmatter `tools:` 명시 + Task allowlist 7개 명시 + sub-agent dispatch sample evidence)
- KR2: `node scripts/sprint-handler.js dogfood v2.1.20 --release-tag v2.1.20 --dry-run` 정상 동작 (state file 생성 + sprint container ready)
- KR3: `./scripts/check-self-dogfood.sh --bootstrap-mode` exit 0 (v2.1.19 자체 release 시) + `./scripts/check-self-dogfood.sh` 가 v2.1.18 시점에는 fail (v2.1.20+ 이상에서는 직전 release 가 sprint container 였는지 verify)
- KR4: `/sprint init` default 에서 trust level 누락 시 L2 적용 (이전 L3 default 의 안전성 제고) + L1 명시 시 warning audit
- KR5: `/sprint annotate s0-sqm-baseline --reason "..."` 가 sprint state `annotations: []` 에 entry append + audit `sprint_annotated` emit

### 1.2 Brainstorm — Implementation 방식 options

| Option | F1-1 Integration Test 방식 | Pros | Cons | 채택 |
|--------|---------------------------|------|------|------|
| A | Static contract check 만 (frontmatter `tools:` invariant) | 빠름, 재현 가능, V2.1.18 패턴과 동일 | "live dispatch evidence" 부재 — declared → live 검증 부족 | ✗ (insufficient) |
| B | Static + live dispatch (main session 이 Task 로 sprint-orchestrator spawn, dispatch evidence audit log 확인) | live evidence ✓, nested Task verification | bkit Bootstrap Exception 시점에는 cyclic risk + Task 호출 시 토큰 비용 | ✓ (primary) |
| C | Static + mocked dispatch (stub agentTaskRunner) | live-like 검증 + isolated | 실제 CC Task tool 동작과 격차 가능 | ✓ (secondary, fallback for B) |

**Decision**: B (live) + C (fallback) — B 가 정상 작동하면 evidence 캡처, fail 시 C 적용 + warning audit.

| Option | F1-3 CI gate Bootstrap Exception | Pros | Cons | 채택 |
|--------|----------------------------------|------|------|------|
| A | `--bootstrap-mode` flag (invariant #1 skip) | 명시적 + audit trail | 매 v2.1.19 release 마다 explicit flag 필요 | ✓ |
| B | release version check (v2.1.19 자동 bootstrap) | 자동 + 사용자 부담 0 | implicit logic — debugging 어려움 | ✗ |
| C | First-run env var (BKIT_SELF_DOGFOOD_BOOTSTRAP=1) | env 가 audit log 에 자연 합류 | env var 누수 위험 | ✗ |

**Decision**: A — explicit flag, master plan §19.5 와 일관.

### 1.3 Prioritize

작업 우선순위:
1. **F1-1 (P0)** — chicken-and-egg 의 core verification, 모든 다른 feature 의 prerequisite
2. **F1-2 (P0)** — F1-3 의 callee (dogfood action) — F1-3 가 호출
3. **F1-3 (P0)** — CI gate, v2.1.20+ first true activation 의 enabler
4. **F1-4 (P1)** — UX 안전성 (L1 lockout warning) — 별도 path
5. **F1-5 (P2)** — annotate primitive, archived sprint 에 post-hoc note (lowest 우선순위, rescope 후 80 LOC closed enum)

Implementation order: **F1-1 → F1-2 → F1-3** (P0 chain) → F1-4 → F1-5 (independent).

### 1.4 Experiments

각 feature 의 실증 test:

- **Exp F1-1**: main session 이 `Task(subagent_type='sprint-orchestrator', prompt='...')` 호출 → output 캡처 → `sprint-orchestrator` 가 *내부적으로* `Task(subagent_type='gap-detector')` 등을 호출했는지 audit log + tool_use trace 로 확인
- **Exp F1-2**: `node scripts/sprint-handler.js dogfood --help` 가 새 action 표시 + dry-run 정상
- **Exp F1-3**: `./scripts/check-self-dogfood.sh` v2.1.18 시점 → exit 1 (fail), `./scripts/check-self-dogfood.sh --bootstrap-mode` → exit 0 (PASS with audit emit)
- **Exp F1-4**: `node scripts/sprint-handler.js init test-warn --name "..."` (trust 미명시) → L2 default. `--trust L1` 명시 → stderr 에 warning + audit
- **Exp F1-5**: `/sprint annotate s0-sqm-baseline --reason "..."` → sprint state `annotations: [{ at, reason }]` append + audit

### 1.5 Opportunity Solution Tree

```
Outcome: bkit self-dogfooding 가능 + chicken-and-egg 영구 해소
├── O1: sprint-orchestrator Task dispatch live verify
│   └── F1-1 integration test (contract + live + mocked fallback)
├── O2: bkit 자체 release 의 sprint mode 운영
│   ├── F1-2 sprint-handler dogfood action
│   └── F1-3 CI gate (check-self-dogfood.sh)
├── O3: sprint init UX safety
│   └── F1-4 default L2 + L1 warning
└── O4: archived sprint annotation primitive
    └── F1-5 /sprint annotate (closed enum, anti-mission 준수)
```

---

## 2. Strategy (pm-strategy 관점)

### 2.1 JTBD 6-Part

| Part | Content |
|------|---------|
| **When** | bkit team 이 v2.1.19 이후 모든 release 의 quality 를 sprint-container-driven 운영으로 보장해야 할 때 |
| **I want to** | (1) sprint-orchestrator Task dispatch 가 실제로 작동함을 integration test 로 verify, (2) bkit release 의 self-dogfood sprint 운영 mode 도입, (3) CI gate 로 release 가 sprint 운영 안되었으면 차단 |
| **So I can** | (a) chicken-and-egg paradox 영구 해소 — Bootstrap Exception 모드 의 종료 path 확보. (b) v2.1.20+ 가 자기 sprint 로 자기 release 운영. (c) pruge 같은 외부 dogfooder 가 검증 시 "bkit 자체가 본인 sprint 기능을 안 쓴다" 비판 회피. |
| **Without** | (1) sprint-orchestrator dispatch 가 declared 만 되어 있고 live evidence 부재 → ENH-292 narrative 약화. (2) release 가 sprint container 로 운영 안되어도 release 가능 → recent 5 releases 0/5 sprint runs (S0 measurement evidence) 가 계속 0% 유지. (3) `/sprint init` L1 사용자 lockout 잠재 재발 risk (v2.1.18 #101 의 partial fix). |
| **Because of** | (1) v2.1.18 PR description 에 "sprint-orchestrator full live integration test" 작업 carry-over (CO-3). (2) master plan §19 의 Self-Dogfooding CI Gate 의 callee 부재. (3) S0 measurement 의 sprintSelfDogfoodRunRate=0 (0/5 sprint runs) 정량 evidence. |
| **Therefore** | F1-1~F1-5 5 features 통합 implementation + 28 TC + Bootstrap Exception 모드 종료 path + audit completeness 확보 |

### 2.2 Lean Canvas (internal infrastructure 압축)

| Block | Content |
|-------|---------|
| Problem | bkit self-dogfooding 부재 + Bootstrap Exception 모드 영구화 risk |
| Customer | bkit core team (kay) + 차후 모든 release CI workflow + 외부 dogfooder (pruge) |
| Value Prop | "bkit 이 자기 sprint 로 자기 release 운영" — 차별화 narrative + CI gate evidence |
| Solution | F1-1~F1-5 통합 + integration test + CI gate + UX safety + annotate primitive |
| Channels | scripts/sprint-handler.js (CLI) + scripts/check-self-dogfood.sh (CI) + test/* (verification) + agents/* (declaration) |
| Revenue | (internal infrastructure, N/A) |
| Cost | ~16h main session + ~800K tokens (master plan §14 budget 일치) |
| Key Metrics | KR1~KR5 (§1.1) |
| Unfair Advantage | bkit 자체가 sprint mgmt 의 primary platform — first plugin to dogfood its own sprint capability |

---

## 3. Functional Requirements (Per Feature)

### 3.1 FR-1: sprint-orchestrator Full Live Integration Test (P0)

**Goal**: sprint-orchestrator agent 의 Task dispatch 가 실제 작동함을 contract + live + mocked fallback test 로 verify.

**Deliverable**:
- `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` (NEW, ~150 LOC, 5 contract tests)
- `test/e2e/sprint-orchestrator/live-dispatch.test.js` (NEW, ~100 LOC, 3 e2e tests with --skip-on-no-cc flag)
- 총 250 LOC, 8 TC

**Test cases**:

1. **TC-F1-1-C1** (Contract): `agents/sprint-orchestrator.md` 의 frontmatter `tools:` 가 declared (yaml parse). 6 base tools (Read/Write/Edit/Glob/Grep/Bash) + 7 Task allowlist (gap-detector, code-analyzer, sprint-qa-flow, sprint-report-writer, qa-monitor, pdca-iterator, Explore) 포함.
2. **TC-F1-1-C2** (Contract): `agents/sprint-master-planner.md` 의 frontmatter `tools:` 가 declared. PM/CTO/QA 3 leads + 3 specialists + Explore (총 7 Task).
3. **TC-F1-1-C3** (Contract): `agents/sprint-qa-flow.md` 의 frontmatter `tools:` 가 declared. qa-monitor + gap-detector (2 Task) + 6 base.
4. **TC-F1-1-C4** (Contract): `agents/sprint-report-writer.md` 의 frontmatter `tools:` 가 declared. 5 base (Task 없음 — report aggregation only).
5. **TC-F1-1-C5** (Contract): 4 sprint-* agents 의 `model: opus` 명시 (high-effort orchestration agent 들).
6. **TC-F1-1-E1** (E2E): live dispatch dry-run — `Task(subagent_type='sprint-orchestrator', prompt='dry-run')` 실행 시 result.tool_uses 가 sprint-orchestrator 의 expected Task allowlist tool 만 포함 (또는 mocked: --skip-on-no-cc).
7. **TC-F1-1-E2** (E2E): mocked dispatch fallback — agentTaskRunner stub 으로 measure-router 호출 시 routed agent 가 정확 (M1 → gap-detector, M2 → code-analyzer, M8 → sprint-orchestrator, S1 → sprint-qa-flow).
8. **TC-F1-1-E3** (E2E): no_agent_runner branch 가 v2.1.18 부터 production code path 에서 *발화 안 함* — measure-router 호출 시 항상 routed agent 가 resolved.

### 3.2 FR-2: sprint-handler `case 'dogfood'` Action (P0)

**Goal**: bkit 자체 release 의 self-dogfood sprint container 운영 mode.

**Deliverable**:
- `scripts/sprint-handler.js` `case 'dogfood'` (라인 ~280 부근 dispatch table 에 추가)
- `handleDogfood(args, infra, deps)` 함수 (~120 LOC)
- VALID_ACTIONS 18 → 19
- 총 180 LOC, 6 TC

**Signature**: `/sprint dogfood <release-version> --release-tag <tag> [--dry-run]`

**Behavior**:
- `args = { id: 'self-dogfood-v2.1.20', releaseTag, releaseVersion, dryRun }`
- Create sprint with name=`bkit self-dogfood ${releaseVersion}`, features=[`release-${releaseVersion}`], context auto-derived from current bkit.config.json
- If `--dry-run`: print preview, no state mutation, no audit
- Else: stateStore.save + audit emit `sprint_dogfood_started` (NEW ACTION_TYPE)
- Returns `{ ok, sprintId, releaseVersion, releaseTag }`

**Test cases**:
1. TC-F1-2-U1: handleDogfood with valid args → sprint state created
2. TC-F1-2-U2: handleDogfood --dry-run → no state mutation, no audit emit
3. TC-F1-2-U3: handleDogfood without --release-tag → error
4. TC-F1-2-U4: handleDogfood with non-semver release-version → error
5. TC-F1-2-U5: handleDogfood emits `sprint_dogfood_started` audit (when not dry-run)
6. TC-F1-2-CLI: `node scripts/sprint-handler.js dogfood v2.1.20-rc.0 --release-tag v2.1.20-rc.0 --dry-run` → exit 0 + preview JSON

### 3.3 FR-3: `scripts/check-self-dogfood.sh` CI Gate (P0)

**Goal**: release tag 직전 강제 실행 — 직전 release 가 sprint container 로 운영되었는지 verify.

**Deliverable**:
- `scripts/check-self-dogfood.sh` (NEW, ~150 LOC bash)
- `scripts/_check-self-dogfood-helper.js` (NEW Node helper, ~70 LOC, JSON output)
- 총 220 LOC, 7 TC

**Invariants** (master plan §19.1):
1. Recent N releases (default N=1, configurable via `--check-last <N>`) 가 sprint container 운영 — `docs/01-plan/features/<prefix>-*.master-plan.md` + `.bkit/state/sprints/<prefix>-*.json` archived
2. Sprint state file phase=`archived`
3. Sprint report file 존재
4. Quality Gates section 포함 (S3 F3-3 의 invariant precursor)

**Flags**:
- `--bootstrap-mode` — invariant #1 skip + audit emit `sprint_bootstrap_mode_activated` + exit 0 with warning
- `--emergency-override <reason>` — all invariants skip + audit emit + SQM penalty -10
- `--check-last <N>` — N consecutive releases verify (default 1)

**Behavior**:
- Iterate from current bkit version backward N steps
- For each, check 4 invariants
- Exit 0 if all PASS or `--bootstrap-mode` activated
- Exit 1 if invariant fail without override

**Test cases**:
1. TC-F1-3-S1: v2.1.18 시점 (no sprint runs) → exit 1
2. TC-F1-3-S2: v2.1.18 시점 + `--bootstrap-mode` → exit 0 with audit + warning to stderr
3. TC-F1-3-S3: `--emergency-override "test"` → exit 0 + audit emit `self_dogfood_emergency_override`
4. TC-F1-3-S4: `--check-last 5` → 5 release backward check
5. TC-F1-3-S5: helper.js JSON output schema verify
6. TC-F1-3-S6: bash script invocation from CI workflow (GitHub Actions style) — exit code + output stream verify
7. TC-F1-3-S7: simulated v2.1.20 with archived s1-foundation → exit 0 (true first activation)

### 3.4 FR-4: sprint init Default L2 + L1 Warning (P1)

**Goal**: `/sprint init` 의 default trust level 을 L1 → L2 로 격상 + L1 명시 시 lockout 위험 warning (v2.1.18 #101 의 deeper UX safety).

**Deliverable**:
- `scripts/sprint-handler.js handleInit` 의 default trust level path 수정 (~30 LOC)
- L1 명시 시 stderr warning + audit emit `sprint_trust_warning` (NEW ACTION_TYPE) (~30 LOC)
- 문서 update (skills/sprint/SKILL.md §10.2 default 명시) (~20 LOC)
- 총 80 LOC, 4 TC

**Behavior**:
- `/sprint init <id> --name "..."` (trust 미명시) → L2 default (현재 normalizeTrustLevel default 가 L3, 코드 확인 후 정확 변경)
- `/sprint init <id> --trust L1` → 추가 stderr warning: "L1 sprint may enter preview-mode lockout. Consider /sprint trust <id> --to L3 to escalate if needed."
- Audit emit `sprint_trust_warning` with `{ sprintId, attemptedLevel: 'L1', recommendedAction: '/sprint trust ...' }`

**Test cases**:
1. TC-F1-4-U1: handleInit without --trust → trustLevelAtStart='L2'
2. TC-F1-4-U2: handleInit --trust L1 → trustLevelAtStart='L1' AND stderr warning emit
3. TC-F1-4-U3: handleInit --trust L1 → audit `sprint_trust_warning` emit
4. TC-F1-4-CLI: `node scripts/sprint-handler.js init test-l1 --name "T" --trust L1` → exit 0 + stderr 에 warning text

### 3.5 FR-5: `/sprint annotate` Action (P2, rescope)

**Goal**: archived sprint 의 post-hoc annotation (CTO B-2 rescope 응답 — closed enum, anti-mission 준수).

**Deliverable**:
- `scripts/sprint-handler.js` `case 'annotate'` (~30 LOC)
- `handleAnnotate(args, infra)` (~30 LOC) — `args.reason` 만 받는 closed enum, sprint state `annotations: []` field append
- Domain entity 확장 — `annotations: { at: ISO, reason: string, addedBy: actor }[]` (~10 LOC)
- 총 80 LOC, 3 TC

**Signature**: `/sprint annotate <id> --reason "<text>"`

**Behavior**:
- Sprint state load → annotations array (or [] if missing) push `{ at: now, reason, addedBy: resolveActor() }` → save
- Audit emit `sprint_annotated` (NEW ACTION_TYPE)
- Allowed phase: ANY (including archived)
- Single field only (no general mutation API — anti-mission 준수)

**Test cases**:
1. TC-F1-5-U1: handleAnnotate on archived sprint → annotations[0] populated
2. TC-F1-5-U2: handleAnnotate without --reason → error (closed enum)
3. TC-F1-5-CLI: `node scripts/sprint-handler.js annotate s0-sqm-baseline --reason "..."` → exit 0 + state mutation verified

### 3.6 Carry-over CO-S0-6 absorption — sprint-handler `--approve` semantic 명확화

**Goal**: S0 에서 발견된 `--approve` semantic 의 ambiguity 해소 — *trust scope-boundary escape* (#95 v2.1.16) vs *gate fail override* 의 차이를 docs 에 명시.

**Deliverable** (no LOC change, docs only):
- `scripts/sprint-handler.js` help text (`case 'help'`) 의 `--approve` 설명 line 보강
- `skills/sprint/SKILL.md` §10 의 `--approve` semantic 명확화 paragraph 추가

**Spec**:
- `--approve` ONLY bypasses Trust Level scope-boundary (e.g., L3 stopAfter=qa 인데 qa 이후 phase advance 요청)
- `--approve` does NOT bypass Quality Gate failures (gate measurement 부재 또는 threshold 미달)
- Gate override 가 필요한 경우: (a) measure-gate UC 호출로 gate 측정 후 retry, (b) `--allowGateOverride` flag (v2.1.20+ 신설 — 본 S1 scope 외)

---

## 4. Non-Functional Requirements

| # | NFR | Target | 검증 방법 |
|---|-----|--------|----------|
| NFR-1 | Backward compatibility | 기존 sprint-handler action 17개 모두 정상 + 동일 signature | regression test: 기존 actions 7개 (init/start/status/phase/qa/report/archive) smoke run |
| NFR-2 | Audit completeness | 신규 4 ACTION_TYPES (sprint_dogfood_started + sprint_bootstrap_mode_activated + sprint_trust_warning + sprint_annotated + self_dogfood_emergency_override) 모두 audit-logger.js enum 등록 | grep ACTION_TYPES |
| NFR-3 | CLI parsing 일관성 | 기존 `parseFlags` 함수 활용 (no parser fork) | code review |
| NFR-4 | Bash script portability | `check-self-dogfood.sh` 가 bash 4+ + node 16+ 호환 | bash --version + node --version 사전 verify |
| NFR-5 | Idempotency | `dogfood` action 동일 release-tag 두 번 호출 시 sprint state 중복 생성 안함 (graceful skip 또는 audit warning) | TC-F1-2-U6 (별도 추가) |
| NFR-6 | Performance | 모든 action 응답 < 3s (CI gate < 5s including bash overhead) | `time node scripts/sprint-handler.js ...` |
| NFR-7 | Side-effect 보호 | F1-4 의 default 변경이 기존 sprint state file (`.bkit/state/sprints/*.json`) 의 trustLevelAtStart 값 변경 안함 (forward-only 변경) | TC-F1-4-S1 (idempotency) |

---

## 5. User Stories

### US-1 — bkit maintainer (kay) 가 v2.1.20 release 를 sprint container 로 운영

```
GIVEN v2.1.19 GA 완료 + S1-S5 모든 sub-sprint archived
WHEN bkit maintainer 가 `node scripts/sprint-handler.js dogfood v2.1.20 --release-tag v2.1.20` 실행
THEN sprint `self-dogfood-v2.1.20` 가 생성됨
AND sprint state 가 phase=prd + features=['release-v2.1.20'] + context auto-derived
AND audit log 에 sprint_dogfood_started event emit
```

### US-2 — CI workflow 가 release tag 전 sprint-container 운영 verify

```
GIVEN .github/workflows/release.yml 에 self-dogfood gate job 추가됨
WHEN PR merge 후 release tag 생성 시도
THEN scripts/check-self-dogfood.sh 가 자동 실행
AND v2.1.18 (이전 release) sprint-container 미운영 → exit 1
BUT v2.1.19 이후에는 v2.1.19 자체가 sprint container 운영 (sprint state archived 5/5) → exit 0
```

### US-3 — bkit maintainer 가 v2.1.19 GA 시 Bootstrap Exception 모드 활성화

```
GIVEN v2.1.19 GA 직전 (직전 release v2.1.18 PDCA-with-sprint-shadow 모드)
WHEN scripts/check-self-dogfood.sh --bootstrap-mode 실행
THEN exit 0
AND stderr 에 "[Bootstrap Exception] v2.1.18 was PDCA-with-sprint-shadow ..." 메시지
AND audit log 에 sprint_bootstrap_mode_activated event emit (predecessorVersion='v2.1.18', target='v2.1.20')
```

### US-4 — 외부 dogfooder (pruge) 가 conservative L1 trust 로 sprint 시작 시도

```
GIVEN pruge 가 dandi-village-ledger 에서 `/sprint init dandi-q2-launch --trust L1` 실행
WHEN sprint init 처리
THEN sprint state trustLevelAtStart='L1' 정상 생성
AND stderr 에 명시적 warning: "L1 sprint may enter preview-mode lockout. ..."
AND audit log 에 sprint_trust_warning event emit
AND pruge 가 이후 `/sprint trust dandi-q2-launch --to L3 --reason "ready to record"` 실행 가능 (v2.1.18 의 #101 fix 활용)
```

### US-5 — bkit team 이 S0 archived sprint 에 retrospective note 추가

```
GIVEN s0-sqm-baseline sprint 가 archived (phase='archived')
AND v2.1.19 GA 후 작성된 retrospective 가 본 sprint 의 baseline 결정 reference 임
WHEN `/sprint annotate s0-sqm-baseline --reason "v2.1.19 GA reference baseline — SQM 59.75"` 실행
THEN sprint state annotations array 에 entry append: [{ at: '2026-05-30...', reason: '...', addedBy: 'user' }]
AND audit log 에 sprint_annotated event emit
AND archived sprint state phase 는 변경 없음 (forward-only invariant 유지)
```

---

## 6. Test Scenarios

### TS-1 — F1-1 Contract + Live (5 + 3 = 8 tests, see §3.1)

### TS-2 — F1-2 dogfood action (6 tests, see §3.2)

### TS-3 — F1-3 CI gate (7 tests, see §3.3)

### TS-4 — F1-4 default L2 + L1 warning (4 tests, see §3.4)

### TS-5 — F1-5 annotate (3 tests, see §3.5)

### TS-6 — Backward compat regression (NFR-1)

```bash
# 기존 7개 actions 가 모두 정상 작동 verify
for action in init start status phase qa report archive; do
  node scripts/sprint-handler.js $action --help 2>&1 | grep -q "$action"
done
```

### TS-7 — Audit completeness (NFR-2)

```bash
# 신규 5 ACTION_TYPES 모두 audit-logger 에 등록됨
for action in sprint_dogfood_started sprint_bootstrap_mode_activated sprint_trust_warning sprint_annotated self_dogfood_emergency_override; do
  grep -q "$action" lib/audit/audit-logger.js
done
```

---

## 7. Pre-mortem (Top 5 Risks)

### PM-1 — F1-1 live dispatch test 가 nested Task 미지원으로 fail

**Risk**: main session 이 `Task(subagent_type='sprint-orchestrator')` 호출 → sprint-orchestrator 가 *내부* Task 호출 시 CC 가 nested Task 지원 안하면 fail.

**Mitigation**: 
- Option B (live) 우선 시도, fail 시 Option C (mocked agentTaskRunner stub) 자동 fallback + warning audit
- F1-1 의 E2E test 가 `--skip-on-no-cc` 또는 `--no-live-dispatch` flag 로 mocked-only 가능
- 차후 v2.1.20+ 에서 CC nested Task 지원 시 e2e test 활성화 plan (carry-over)

### PM-2 — F1-3 CI gate 가 v2.1.19 자체 release 를 block

**Risk**: `check-self-dogfood.sh` 가 v2.1.19 release 시점에 invariant #1 (직전 v2.1.18 = sprint container) fail → release 영구 block.

**Mitigation**:
- `--bootstrap-mode` flag (master plan §19.5 의 명시적 escape) — F1-3 의 design 요구사항
- v2.1.19 release workflow 에 `bash scripts/check-self-dogfood.sh --bootstrap-mode` 명시
- 차후 v2.1.20+ 부터 flag 없이 first true activation

### PM-3 — F1-4 의 default L2 변경이 기존 sprint state file 의 trustLevelAtStart 값을 retro mutation

**Risk**: code 변경이 backward retro 적용 시 기존 v2.1.18 의 sprint state file (s0-sqm-baseline 등) 의 trustLevelAtStart 가 L2 로 변경됨.

**Mitigation**:
- F1-4 변경은 `handleInit` 의 신규 sprint 생성 path 만 — 기존 file load + save 에는 영향 없음
- TC-F1-4-S1 idempotency test: 기존 sprint state file 로드 후 save → trustLevelAtStart 변경 0 확인
- forward-only 변경 명시 audit emit

### PM-4 — F1-2 dogfood action 이 기존 init action 과 conflict

**Risk**: dogfood 가 사실상 "specialized init" 인데, sprint id naming convention 또는 features auto-derive 시 conflict 발생.

**Mitigation**:
- dogfood 는 명시적 prefix `self-dogfood-<release>` 사용 — 사용자 명시 init 과 namespace 분리
- features auto-derive 도 명시적 `release-<version>` — 충돌 회피
- TC-F1-2-U7 (별도 추가): dogfood 와 init 의 동일 id 호출 시 idempotency check

### PM-5 — Carry-over CO-S0-6 docs 변경이 기존 사용자 flow 혼란

**Risk**: `--approve` semantic 명확화가 사용자가 이전 잘못 이해 (gate override 가능) 한 사용 pattern 을 *명시적으로 deprecate*. 갑작스러운 docs 변경으로 사용자 혼란.

**Mitigation**:
- v2.1.19 GA release notes 에 명시적 noteline ("`--approve` clarified, NOT a gate fail override — use measure-gate first")
- Migration path 명시: 기존 사용자가 gate override 필요 시 `/sprint measure <id> --gate <key>` 우선 수행 후 retry
- Linear narrative 가 아니라 retrofit doc — 기존 behavior 변경 없음, 단지 spec 명확화

---

## 8. Out-of-Scope

- **F1-1**: nested Task 가 CC 에서 미지원 시 *implementation* (carry to v2.1.20+) — 본 S1 는 test 만, CC 지원 시 evidence 캡처
- **F1-2 advanced features**: dogfood --auto-bump (version 자동 증가), --auto-trust-from-prev (이전 release trust 자동 적용) — v2.1.20+ carry
- **F1-3 multi-release**: `--check-last 5` 외 advanced (commit history walking 등) — v2.1.20+ carry
- **F1-4 dynamic default**: trust default 가 user trust score 기반 dynamic — v2.1.20+ carry (CO-B trust weight recalibration 시 통합)
- **F1-5 general mutation API**: `/sprint amend` general primitive (CTO B-2 deferred to v2.1.20+ CO-E)
- `--allowGateOverride` flag (CO-S0-6 spec) — v2.1.20+ S2 또는 별도 carry

---

## 9. Dependencies

### 9.1 Inputs (S1 시작 전 충족)

- ✓ S0 archived (sprint state phase='archived', SQM baseline 59.75)
- ✓ control level 4 (sustained from S0)
- ✓ master plan §4.1 + §19.5 + §17.3 (Bootstrap Exception, F1-1 Sequential Dispatch differentiation)
- ✓ bkit v2.1.18 base (agents/sprint-*.md frontmatter 의 tools: Task allowlist 명시 — v2.1.18 PR #106 F1 변경)

### 9.2 Outputs (S1 archive 시 산출)

| Output | 위치 |
|--------|------|
| `agents/sprint-orchestrator.md` (verified, no change) | (existing) |
| `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` | NEW |
| `test/e2e/sprint-orchestrator/live-dispatch.test.js` | NEW |
| `scripts/sprint-handler.js` (case 'dogfood', 'annotate' 추가 + handleInit default 수정) | MODIFIED |
| `scripts/check-self-dogfood.sh` + `scripts/_check-self-dogfood-helper.js` | NEW |
| `lib/audit/audit-logger.js` (ACTION_TYPES +5) | MODIFIED |
| `lib/domain/sprint/entity.js` (annotations field 추가) | MODIFIED |
| `skills/sprint/SKILL.md` (§10 --approve 명확화 + §10.2 default level 명시) | MODIFIED |
| `docs/00-pm/features/s1-foundation.prd.md` | (본 문서) |
| `docs/01-plan/features/s1-foundation.plan.md` | next phase |
| `docs/02-design/features/s1-foundation.design.md` | next phase |
| `docs/04-report/features/s1-foundation.report.md` | next phase |
| 28 test cases across L1/L2/L3/L4 | NEW |
| audit events | sprint_dogfood_started + sprint_bootstrap_mode_activated + sprint_trust_warning + sprint_annotated + self_dogfood_emergency_override |

### 9.3 Downstream (S1 archive 후)

- **S2 Defense**: F2-2 의 `check-skills-docs-code-sync.js` 가 본 F1-3 의 CI gate pattern 을 reference (bash + node helper)
- **S3 Polish**: F3-1 의 failure-reporter resolution marker 도 본 F1-3 의 `--bootstrap-mode` audit emit pattern 활용
- **S4 Proactive**: F4-1 의 Trust Score 7-Component 이 본 F1-4 의 default L2 변경과 호환성 verify
- **S5 Measurement**: F5-1 의 sqm-calculator evolve 가 본 S1 의 self-dogfood evidence 를 sprintSelfDogfoodRunRate component 의 100 evidence 로 활용

---

## 10. Acceptance Criteria (12)

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` 5/5 contract tests PASS | `node test/contract/...` |
| AC-2 | `test/e2e/sprint-orchestrator/live-dispatch.test.js` 3/3 e2e tests PASS (mocked fallback OK) | `node test/e2e/...` |
| AC-3 | `node scripts/sprint-handler.js dogfood --help` 가 새 action 표시 | help output grep |
| AC-4 | `node scripts/sprint-handler.js dogfood v2.1.20-test --release-tag v2.1.20-test --dry-run` exit 0 | exit code |
| AC-5 | `./scripts/check-self-dogfood.sh --bootstrap-mode` exit 0 with audit emit | exit + audit grep |
| AC-6 | `./scripts/check-self-dogfood.sh` (no flag, v2.1.18 base) exit 1 | exit code |
| AC-7 | `node scripts/sprint-handler.js init test-l1 --name "T" --trust L1` → stderr warning + audit `sprint_trust_warning` emit | stderr + audit grep |
| AC-8 | `node scripts/sprint-handler.js init test-default --name "T"` (no --trust) → state.autoRun.trustLevelAtStart='L2' | jq |
| AC-9 | `node scripts/sprint-handler.js annotate s0-sqm-baseline --reason "test"` → state.annotations[0] populated | jq |
| AC-10 | 신규 5 ACTION_TYPES audit-logger.js 에 추가 | grep ACTION_TYPES |
| AC-11 | matchRate (gap-detector) ≥ 90% | PDCA check phase |
| AC-12 | sprint phase=archived (terminal) | state file inspection |

---

## 11. Success Metrics

| # | Metric | Target | 측정 시점 |
|---|--------|--------|----------|
| 1 | 28 TC PASS | 28/28 | QA phase |
| 2 | matchRate | ≥90% (iterate 후 100%) | Check phase |
| 3 | criticalIssueCount | 0 | Do/QA |
| 4 | S0→S1 SQM impact | sprintSelfDogfoodRunRate 0 → estimated 50 (v2.1.19 가 partial run 인정 시) or 100 (S1 자체가 sprint) | report phase |
| 5 | Cycle time | ≤16h (master plan §14 budget) | M10 |
| 6 | Backward compat | 0 regression (NFR-1) | TS-6 |
| 7 | Audit completeness | 5 신규 ACTION_TYPES enum 추가 + 모두 emit verified | TS-7 |

---

## 12. Stakeholder Map

| Role | Stakeholder | Interest | 본 PRD 응답 |
|------|------------|----------|------------|
| Direct user (mission-critical) | v2.1.20+ release workflow | check-self-dogfood.sh CI gate 의 first true activation | §3.3 F1-3 + §10 AC-5/AC-6 |
| Direct user | bkit core team (kay) | sprint-orchestrator dispatch live evidence 확보 | §3.1 F1-1 + §10 AC-1/AC-2 |
| Indirect user | S2/S3/S4/S5 sub-sprint | Bootstrap Exception 모드 종료, Full sprint mode 진입 | §9.3 downstream + Methodology |
| External validator | @pruge | "bkit 자체가 sprint 안 쓴다" 비판 회피 — self-dogfood evidence | §1.1 KR2/KR3 + ENH-318 narrative |
| Master plan author | CTO redline (§17.3 ENH-292) | "declared → live" 차별화 승격 evidence | §3.1 F1-1 E2E live dispatch |

---

## 13. 다음 phase advance

본 PRD 완료 시:
1. M8 designCompleteness measure (Bootstrap Exception 모드 main session proxy, S0 패턴)
2. sprint phase prd → plan
3. `docs/01-plan/features/s1-foundation.plan.md` 작성 (5 features 의 implementation order + test plan + cto-lead redline 약식)

---

**문서 끝.** S1 PRD complete (13 sections, ~700 lines). Plan phase 진입 준비.
