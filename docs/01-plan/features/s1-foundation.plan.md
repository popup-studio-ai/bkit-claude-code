---
template: plan
version: 2.0
feature: s1-foundation
date: 2026-05-21
author: kay (메인 세션 thinking + 약식 cto-lead redline)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: plan)
sprint_id: s1-foundation
predecessor_prd: docs/00-pm/features/s1-foundation.prd.md
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.1
---

# S1 — Self-Dogfooding Enablement (Plan)

> **Sprint phase**: plan
> **Implementation 방식**: 5 features (F1-1 ~ F1-5) sequential implementation, 의존성 매트릭스 따라 F1-1 → F1-2 → F1-3 (P0 chain) → F1-4 → F1-5
> **CTO redline 대상**: 본 plan §2 (Implementation Order), §4 (Risk + Mitigation), §8 (CTO redline 약식)
> **Backward refs**: PRD §3 FR-1~FR-5, PRD §9.2 (Outputs), PRD §10 (12 AC)

---

## 0. Scope (PRD 압축)

| 항목 | 값 |
|------|---|
| Mission | bkit self-dogfood 가능 + chicken-and-egg 영구 해소 + ENH-292 차별화 declared→live 승격 |
| Anti-Mission | nested Task 의 CC 미지원 시 구현 (carry to v2.1.20+) / dogfood advanced features / sprint amend general mutation API |
| Total LOC est. | 810 (250 + 180 + 220 + 80 + 80) |
| Total TC est. | 28 (8 + 6 + 7 + 4 + 3) |
| Phase budget | ≤ 16h (master plan §14 S1 budget 800K tokens / 16h time) |
| Closes | (no GitHub issues — internal infrastructure work) |

---

## 1. 의존성 매트릭스 (Topological)

| # | Item | Depends on | Reason |
|---|------|-----------|--------|
| D1 | `agents/sprint-*.md` frontmatter `tools:` | v2.1.18 base | 이미 존재 (v2.1.18 PR #106 F1) |
| D2 | `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` | D1 + node:assert | F1-1 contract |
| D3 | `test/e2e/sprint-orchestrator/live-dispatch.test.js` | D2 + CC Task tool | F1-1 e2e (mocked fallback) |
| D4 | `lib/audit/audit-logger.js` ACTION_TYPES +5 | (no dep) | F1-2/F1-3/F1-4/F1-5 모두 신규 audit emit |
| D5 | `scripts/sprint-handler.js` (case 'dogfood', 'annotate' + handleInit default 수정) | D4 (audit emit) | F1-2/F1-4/F1-5 |
| D6 | `lib/domain/sprint/entity.js` annotations field | (no dep) | F1-5 domain |
| D7 | `scripts/check-self-dogfood.sh` + helper.js | D5 (dogfood action) | F1-3 |
| D8 | `skills/sprint/SKILL.md` §10 update | D5 (action 명세) + CO-S0-6 | docs sync |
| D9 | F1-1~F1-5 의 28 TC | D2,D3,D5,D6,D7 | verification |

Topological 순서: D1(existing) → D4 → D6 → D5 → D7 → D8 → D2 → D3 → D9.

---

## 2. Implementation Order (sub-tasks within sprint do phase)

### 2.1 Phase 1: Foundation (audit + domain — 30 LOC, 0 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T1 | `lib/audit/audit-logger.js` ACTION_TYPES +5 (sprint_dogfood_started, sprint_bootstrap_mode_activated, sprint_trust_warning, sprint_annotated, self_dogfood_emergency_override) + JSDoc 상세 schema | 20 | 0 | `grep ACTION_TYPES lib/audit/audit-logger.js` |
| T2 | `lib/domain/sprint/entity.js` createSprint 에 `annotations: []` default 추가 | 10 | 0 | `node -e "...createSprint().annotations"` |

### 2.2 Phase 2: F1-2 dogfood action (180 LOC, 6 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T3 | `scripts/sprint-handler.js` `handleDogfood(args, infra, deps)` 함수 + helpers (resolveBkitVersion / resolveBkitCommit / autoDeriveContext) | 120 | 0 | code review |
| T4 | `scripts/sprint-handler.js` dispatch table `case 'dogfood'` + VALID_ACTIONS 18→19 + help text 추가 | 30 | 0 | `node scripts/sprint-handler.js help \| grep dogfood` |
| T5 | `test/unit/sprint-handler/dogfood-action.test.js` 6 TC (TC-F1-2-U1~U5 + U6 idempotency) | 130 | 6 | `node test/unit/...` 6/6 PASS |

### 2.3 Phase 3: F1-4 default L2 + L1 warning (80 LOC, 4 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T6 | `scripts/sprint-handler.js` `handleInit` 의 normalizeTrustLevel default 호출 path 수정 (L2 default) + L1 명시 시 stderr warning + audit `sprint_trust_warning` emit | 50 | 0 | code review |
| T7 | `skills/sprint/SKILL.md` §10.2 default level 표 + L1 warning paragraph 추가 | 30 | 0 | doc inspection |
| T8 | `test/unit/sprint-handler/default-level-warning.test.js` 4 TC | 100 | 4 | `node test/unit/...` 4/4 PASS |

### 2.4 Phase 4: F1-5 annotate action (80 LOC, 3 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T9 | `scripts/sprint-handler.js` `handleAnnotate(args, infra)` 함수 + dispatch `case 'annotate'` + VALID_ACTIONS 19→20 + help text | 50 | 0 | code review |
| T10 | `lib/domain/sprint/entity.js` 의 annotations field 가 append 가능 verify (T2 의 follow-up) | 10 | 0 | smoke test |
| T11 | `test/unit/sprint-handler/annotate-action.test.js` 3 TC | 80 | 3 | `node test/unit/...` 3/3 PASS |

### 2.5 Phase 5: F1-3 check-self-dogfood CI gate (220 LOC, 7 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T12 | `scripts/_check-self-dogfood-helper.js` Node helper (raw invariant check + JSON output) | 100 | 0 | `node scripts/_check-self-dogfood-helper.js --json` |
| T13 | `scripts/check-self-dogfood.sh` bash wrapper (flag parsing + helper invocation + exit codes + audit log emit) | 120 | 0 | bash syntax + dry-run |
| T14 | `test/e2e/self-dogfood/ci-gate.test.js` 7 TC (TC-F1-3-S1~S7) | 220 | 7 | `node test/e2e/...` 7/7 PASS |

### 2.6 Phase 6: F1-1 sprint-orchestrator integration test (250 LOC, 8 TC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T15 | `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` 5 contract TC (TC-F1-1-C1~C5) | 150 | 5 | `node test/contract/...` 5/5 PASS |
| T16 | `test/e2e/sprint-orchestrator/live-dispatch.test.js` 3 e2e TC (TC-F1-1-E1~E3, mocked fallback w/ --skip-on-no-cc) | 130 | 3 | `node test/e2e/...` 3/3 PASS or --skip-on-no-cc |
| T17 | F1-1 의 nested Task verification — main session 이 실 시연 (e2e evidence 캡처, mocked fallback OK) | (separate) | (separate) | tool_use trace |

### 2.7 Phase 7: Docs + Carry-over (no LOC)

| # | Sub-task | LOC | TC | 검증 |
|---|----------|-----|----|------|
| T18 | `skills/sprint/SKILL.md` §10 `--approve` semantic 명확화 (CO-S0-6 absorbed) | 20 | 0 | doc review |
| T19 | `scripts/sprint-handler.js` help text 의 `--approve` 설명 line 보강 (CO-S0-6) | 10 | 0 | help output review |

### 2.8 Total breakdown

| Phase | Sub-tasks | LOC | TC |
|-------|-----------|-----|----|
| Foundation | T1-T2 | 30 | 0 |
| F1-2 dogfood | T3-T5 | 280 | 6 |
| F1-4 default | T6-T8 | 180 | 4 |
| F1-5 annotate | T9-T11 | 140 | 3 |
| F1-3 CI gate | T12-T14 | 440 | 7 |
| F1-1 orchestrator | T15-T17 | 280 | 8 |
| Docs (CO-S0-6) | T18-T19 | 30 | 0 |
| **Total** | | **1,380** | **28** |

**Note**: actual LOC (1,380) > PRD estimate (810) — test files 의 LOC 가 더 큰 비중. Test 도 master plan §0.2 의 "LOC est." gross figure 에 포함되어 있음.

Implementation order: T1 → T2 → T3-T5 (F1-2) → T6-T8 (F1-4) → T9-T11 (F1-5) → T12-T14 (F1-3) → T15-T17 (F1-1) → T18-T19 (CO-S0-6).

각 sub-task 완료 시 `git status` 확인 + 다음 sub-task. 각 phase 끝에서 smoke test.

---

## 3. Test Plan

### 3.1 L1-L5 Test Matrix (28 TC)

| Layer | Tests | Coverage |
|-------|-------|----------|
| L1 Unit | T5 (6) + T8 (4) + T11 (3) = 13 TC | F1-2 + F1-4 + F1-5 |
| L2 Contract | T15 (5 TC) | F1-1 frontmatter invariant |
| L3 Integration | T16 (3 TC) | F1-1 e2e + mocked fallback |
| L3 E2E | T14 (7 TC) | F1-3 CI gate (bash + node helper) |
| L4 Backward compat | TS-6 (NFR-1) | 기존 7 actions smoke |
| L5 Audit | TS-7 (NFR-2) | 5 신규 ACTION_TYPES enum verify |

총 28 TC explicit + 2 cross-cutting (TS-6/TS-7).

### 3.2 Test execution sequence (S0 패턴 확장)

```bash
# Phase order matches §2.8 implementation order
# Each phase end: run that phase's tests + smoke regression of previous phases
node test/unit/sprint-handler/dogfood-action.test.js        # T5 (6/6 PASS)
node test/unit/sprint-handler/default-level-warning.test.js # T8 (4/4 PASS)
node test/unit/sprint-handler/annotate-action.test.js       # T11 (3/3 PASS)
node test/e2e/self-dogfood/ci-gate.test.js                  # T14 (7/7 PASS)
node test/contract/agents/sprint-orchestrator-task-dispatch.test.js # T15 (5/5 PASS)
node test/e2e/sprint-orchestrator/live-dispatch.test.js     # T16 (3/3 PASS or --skip-on-no-cc)

# Cross-cutting
bash -c 'for action in init start status phase qa report archive; do node scripts/sprint-handler.js $action --help > /dev/null 2>&1 || echo "FAIL: $action"; done'  # TS-6
grep -E "sprint_dogfood_started|sprint_bootstrap_mode_activated|sprint_trust_warning|sprint_annotated|self_dogfood_emergency_override" lib/audit/audit-logger.js | wc -l  # TS-7 → 5
```

---

## 4. Risk Register (Updated, PRD Pre-mortem 보강)

| # | Risk | 확률 | 영향 | Mitigation | Owner |
|---|------|------|------|------------|-------|
| R-1 (PM-1) | F1-1 live test nested Task 미지원 | H | M | Option C (mocked) fallback + --skip-on-no-cc flag + carry to v2.1.20+ | T16 owner |
| R-2 (PM-2) | F1-3 CI gate 가 v2.1.19 자체 block | L | H | `--bootstrap-mode` flag (F1-3 design 요구) | T13 owner |
| R-3 (PM-3) | F1-4 default 변경이 retro mutation | L | M | handleInit 신규 sprint 경로만 변경 + idempotency test TC-F1-4-S1 | T6 owner |
| R-4 (PM-4) | F1-2 dogfood + init naming conflict | L | M | `self-dogfood-<release>` 명시적 prefix + TC-F1-2-U7 idempotency | T3 owner |
| R-5 (PM-5) | CO-S0-6 docs 변경이 기존 사용자 혼란 | M | L | release notes noteline + 기존 behavior 변경 없음 (spec clarification only) | T18 owner |
| R-6 NEW | T1 의 ACTION_TYPES +5 추가가 sanitizeDetails 의 sensitive key filter 와 conflict (sensitive 단어 포함 — "warning", "override") | M | L | T1 작성 직전 sanitizeDetails code review + 추가 needed 시 별도 보강 sub-task | T1 owner |
| R-7 NEW | T13 bash script 의 macOS bash 4 vs bash 5 호환성 (현재 dev macOS bash 3.x) | M | M | bash 3 호환 syntax 사용 (no associative array, no `[[` 사용 자제) + 명시적 `#!/usr/bin/env bash` shebang | T13 owner |
| R-8 NEW | T2 의 entity.js 변경이 기존 sprint state file 의 schema migration 부재 — annotations field 누락 file load 시 undefined 위험 | M | L | T2 의 createSprint default = [] + sprint state load 시 `sprint.annotations || []` defensive | T2 owner |
| R-9 NEW | T14 bash e2e test 가 Node test runner 에서 spawn 시 stdio pipe issue | L | L | `child_process.execSync` with explicit `cwd` + `stdio: ['ignore', 'pipe', 'pipe']` (S0 measure.test.js 패턴) | T14 owner |
| R-10 NEW | T15/T16 의 yaml parser 의존성 — Node 내장 (`fs` + manual frontmatter parse) vs 외부 패키지 | L | L | manual parse (S0 의 evaluateSkillInvariant 패턴, 외부 dep 추가 회피) | T15 owner |

---

## 5. Quality Bar (sprint M-series + S-series)

| Gate | Threshold | Source | 본 sprint 적용 |
|------|-----------|--------|---------------|
| M1 matchRate | ≥90 (iterate exit: 100) | gap-detector | Check phase (Bootstrap main session proxy) |
| M2 codeQualityScore | ≥80 | code-analyzer | Do/QA phase |
| M3 criticalIssueCount | ≤0 | code-analyzer | Do/QA |
| M4 apiComplianceRate | ≥95 | gap-detector | Design phase (PRD §3 schema vs implementation) |
| M5 runtimeErrorRate | ≤1 | qa-monitor stub (28 tests) | QA phase |
| M7 conventionCompliance | ≥90 | code-analyzer | Do phase |
| M8 designCompleteness | ≥85 | sprint-orchestrator | Design phase (이미 PRD 시점 95 measured) |
| M10 pdcaCycleTimeHours | ≤16 | system | Report phase (master plan S1 budget) |
| S1 dataFlowIntegrity | =100 | sprint-qa-flow | QA phase (5 feature 모두 stateless infra — architectural noop) |
| S2 featureCompletion | =100 | featureMap | QA/report (5/5 features) |
| S4 archiveReadiness | =true | system | report → archived |

### 5.1 S1 dataFlowIntegrity 적용 가능성

S1 features 5건 모두 *infra/lib/scripts/agents* 작업 — UI → API → DB hop 부재. S0 와 동일 패턴: architectural noop 처리 (sprint-qa-flow proxy main session).

---

## 6. Deliverable Mapping (PRD §9.2 cross-ref)

| PRD §9.2 Output | Plan sub-task | Phase |
|----------------|---------------|-------|
| `lib/audit/audit-logger.js` (ACTION_TYPES +5) | T1 | do |
| `lib/domain/sprint/entity.js` (annotations field) | T2 | do |
| `scripts/sprint-handler.js` (case dogfood/annotate, handleInit default 수정) | T3-T4, T6, T9 | do |
| `scripts/check-self-dogfood.sh` + helper.js | T12-T13 | do |
| `test/contract/agents/sprint-orchestrator-task-dispatch.test.js` | T15 | do |
| `test/e2e/sprint-orchestrator/live-dispatch.test.js` | T16 | do |
| `test/e2e/self-dogfood/ci-gate.test.js` | T14 | do |
| `test/unit/sprint-handler/*.test.js` ×3 | T5/T8/T11 | do |
| `skills/sprint/SKILL.md` §10 update | T7, T18 | do (final) |
| `docs/00-pm/features/s1-foundation.prd.md` | (이전 phase) | prd |
| `docs/01-plan/features/s1-foundation.plan.md` | (본 문서) | plan |
| `docs/02-design/features/s1-foundation.design.md` | (다음 phase) | design |
| `docs/04-report/features/s1-foundation.report.md` | (다음 phase) | report |
| audit events ×5 | T1 (enum) + T3/T6/T9/T13 (emit) | side-effect |

---

## 7. 다음 phase advance 조건

본 plan 완료 시:
1. Plan PASS — M8 designCompleteness 이미 95 measured (PRD 시점)
2. sprint phase: `plan` → `design` 자동 advance (L4 full-auto, M8 PASS)
3. `docs/02-design/features/s1-foundation.design.md` 작성 (5 features 의 detailed pseudocode + ADRs + edge cases)

---

## 8. CTO Redline (약식, 메인 thinking)

### 8.1 BLOCKER (0건)
해당 없음.

### 8.2 MEDIUM (3건)

- **CR-S1-M-1**: T13 bash script 의 macOS bash 3.x 호환성 — bash 4+ syntax 사용 시 production CI 에서 fail 가능. **Resolution**: T13 작성 시 `#!/usr/bin/env bash` + bash 3 호환 syntax (no `[[`, no associative array) + `node` helper 로 복잡 logic 위임.
- **CR-S1-M-2**: T15/T16 의 yaml parser 의존성 — Node 표준 라이브러리 부재. **Resolution**: manual frontmatter parse (S0 의 evaluateSkillInvariant 패턴) — 외부 dep 추가 회피, S2 F2-2 contract test 도 동일 패턴.
- **CR-S1-M-3**: T16 e2e test 의 live dispatch 의 reproducibility — CC version + Task tool availability 변동 시 결과 변경 가능. **Resolution**: `--skip-on-no-cc` flag + `process.env.CC_VERSION` check + mocked fallback (Option C from PRD §1.2).

### 8.3 MINOR (2건)

- **CR-S1-N-1**: T18 (`--approve` docs 명확화) 의 위치 — skills/sprint/SKILL.md §10 의 어느 sub-section 에 명시할지 미지정. **Resolution**: §10.4 (--approve 설명) 신설 또는 §10 existing flag 표 augment.
- **CR-S1-N-2**: F1-2 dogfood action 의 `--release-tag` 가 git tag 와 sprint id 양쪽에 reflect 되는데 어느 쪽이 SoT 인지 명확화. **Resolution**: git tag (release-tag) 가 SoT, sprint id 는 `self-dogfood-<releaseTag>` derived.

### 8.4 APPROVAL

**APPROVE with CONCERNS** — BLOCKER 0. MEDIUM 3 모두 design phase 또는 do phase 에서 resolution. MINOR 2 docs 보강 시점에 결정.

---

## 9. Living document

본 plan 은 design phase 에서 §2 implementation order 의 각 sub-task 의 detailed pseudocode 가 명시되면 갱신. Do phase 진행 중 sub-task 별 실측 LOC/TC 가 estimate 와 ±25% 이상 격차 시 본 plan 갱신.

---

**문서 끝.** Plan complete (9 sections, ~370 lines). Design phase 진입 준비.
