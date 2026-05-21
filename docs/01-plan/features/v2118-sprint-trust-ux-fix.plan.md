---
template: plan
version: 1.3
feature: v2118-sprint-trust-ux-fix
date: 2026-05-21
author: kay
project: bkit
version: 2.1.18
---

# v2118-sprint-trust-ux-fix — Planning Document

> **Summary**: bkit v2.1.16에서 보고된 3건의 Sprint Management Trust UX 결함(#100/#101/#102)을 단일 sprint로 처리. L1 sprint lockout 패턴(orchestrator 도구 부재 → trust mutation 부재 → trust CLI alias silent ignore)을 3-feature 통합 fix로 영구 해소.
>
> **Project**: bkit
> **Version**: 2.1.18 (target)
> **Author**: kay
> **Date**: 2026-05-21
> **Status**: Active
> **Predecessor PDCA**: v2.1.17 final (PR #99 merged 2026-05-20, 5축 매트릭스 5/5 close + 11 carryover 영구 종결)
> **GitHub Issues**: #100 (P0 sprint-orchestrator Task tool), #101 (P0 trust mutation cmd), #102 (P1 CLI --trust alias)
> **PRD**: [v2118-sprint-trust-ux-fix.prd.md](../../00-pm/features/v2118-sprint-trust-ux-fix.prd.md) (PM Team 완료: Beachhead 19/20, JTBD 6-Part, 5 User Stories, 6 Test Scenarios)
> **Design**: [v2118-sprint-trust-ux-fix.design.md](../../02-design/features/v2118-sprint-trust-ux-fix.design.md)
> **CTO Review**: APPROVE with CONCERNS (BLOCKER 3건 메인 재측정 정정 후 해소, MEDIUM 3건 design redline 반영)
> **Branch**: `feature/v2118-issue-fixes`

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.1.16 사용자(@pruge, dandi-village-ledger sprint `s1-foundation`)가 L1 trust로 sprint init 후 **3-stage trap에 갇힘**: (a) sprint-orchestrator가 Task 도구 부재로 measurement agent dispatch 실패 (#100), (b) sprint init 후 trust mutation 명령 없어 영구 preview mode lockout (#101), (c) `--trust L3` per-call override 시도해도 normalizeTrustLevel 우회 코드 경로에 의해 silent ignored (#102). P0 32/32 구현 완료 후 phase 전환 불가, re-init만이 유일 escape (phaseHistory/qualityGates/featureMap 전부 destruction). |
| **Solution** | 3 features 단일 sprint 통합 처리: **F1** sprint-* 4 agents 모두 `tools:` frontmatter 명시 (Task allowlist) — `Task(gap-detector)`, `Task(code-analyzer)`, `Task(sprint-qa-flow)`, `Task(sprint-report-writer)` 등 / **F2** `/sprint trust <id> --to <Level> [--reason "..."]` 신설 + `sprint_trust_changed` audit ACTION_TYPE + skill docs §10.x / **F3** measure/runPhaseGates 두 trust 추출 경로(line 721-723, 750-752)를 `normalizeTrustLevel(args)` 강제 + 회귀 test 신설. |
| **Function/UX Effect** | (a) L1 사용자가 sprint init 후에도 trust 정상 mutation 가능 (`/sprint trust s1-foundation --to L3 --reason "P0 32/32 ready for measurement"`) — phaseHistory/qualityGates/featureMap 보존. (b) sprint-orchestrator가 자체 dispatcher 역할 fulfill (main session pass-through workaround 폐기). (c) `--trust L3` per-call override 즉시 인식 — docs와 실행 일치. (d) audit log에 trust 변경 영속 기록 (`sprint_trust_changed` action). |
| **Core Value** | **v2.1.16에서 보고된 L1 lockout 사고 클래스 영구 종결**. 동일 root cause cluster (frontmatter inheritance + handler dispatch + arg normalization 3-layer drift) 재발 차단. 3 features hard-link 의존성으로 통합 처리 시에만 의미 있음 — 부분 fix는 다른 stage trap 존속. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.16에서 @pruge가 dandi-village-ledger sprint s1-foundation에서 **3-stage trap 보고** (P0 32/32 implementation 완료 후 phase 전환 불가, re-init 불가능). 이슈 #100/#101/#102 모두 동시 보고(2026-05-21 03:54)는 **단일 root cluster 사실 입증** = L1 trust UX 전체 chain 결함. |
| **WHO** | (1) L1 trust로 sprint를 시작하는 신중한 사용자 (Trust Level 의도적 escalation 정책 준수), (2) sprint-orchestrator의 measurement routing 책임에 의존하는 모든 sprint (M1/M2/M3/M4/M7 dispatch), (3) bkit docs §10.2를 따라 `--trust L3` per-call override를 사용하는 사용자 (intuitive shorter name). |
| **RISK** | (1) **F1 도구 추가가 다른 agent에 영향**: tools 필드 추가가 implicit allowlist 변경으로 다른 동작 변화 가능 — 보호: 4 agents 각각 격리 검증 + e2e smoke test. (2) **F2 신규 명령이 SPRINT_AUTORUN_SCOPE guardrail과 충돌**: trust mutation이 control level 정책과 일관성 무너뜨림 — 보호: trust mutation도 `/bkit:control level` 같은 audit 기록 + guardrail check 패턴 적용. (3) **F3 fix가 기존 silent fallback 의존 코드 깨뜨림**: 누군가 `--trustLevel` 미지정 시 sprint state fallback에 의존했을 수 있음 — 보호: fallback 동작 보존 + 회귀 test로 명시. (4) **F2 trust mutation이 비가역 정책 우회 수단으로 악용**: L4 → L1 downgrade 후 다시 escalate 패턴 — 보호: audit `from/to/reason` 모두 기록 + downgrade는 control score 가드 추가. |
| **SUCCESS** | (a) L1 sprint trap 시나리오(@pruge 보고)를 e2e test로 재현 후 **3 features 적용 후 정상 통과**. (b) `agents/sprint-*` 4개 모두 `tools:` 명시 + ToolSearch select:Task 매칭 PASS. (c) `/sprint trust s1-foundation --to L3 --reason "..."` 명령이 sprint.autoRun.trustLevelAtStart mutation + audit `sprint_trust_changed` 기록. (d) `--trust L3` per-call이 record mode로 작동 (preview mode 차단). (e) qa-aggregate 신규 4-6 TC 추가 후 4103 → 4107+/0 유지. |
| **SCOPE** | F1 (#100, P0 dependency) → F2 (#101, P0 main value) → F3 (#102, P1 polish) 순서. F1 이 우선이어야 F2 trust 변경 후 measurement가 실제 dispatch 가능. F3 는 사용자 docs 신뢰성을 위한 polish이나 #101 + #102 = 2-stage trap (보고자 직접 명시) 이므로 F2 와 함께 출시 필수. **3 features 함께 release 필수** (부분 release 시 다른 stage trap 존속). |

---

## 1. Overview

### 1.1 Purpose

bkit v2.1.16 GA에서 보고된 Sprint Management Trust UX 3-stage trap (#100/#101/#102)을 단일 sprint로 통합 처리하여 L1 trust 사용자가 sprint 진행 중 lockout되는 사고 클래스를 v2.1.18에서 영구 종결한다.

### 1.2 Background

**보고자 시나리오** (@pruge, 2026-05-21 03:54, dandi-village-ledger sprint `s1-foundation`):

1. **Stage 1 (#101 보고)**: `/sprint init s1-foundation --trust L1` 수행 → P0 32/32 implementation 완료 → `/sprint phase s1-foundation --to iterate --approve` 시도 → `gate_fail` (M1/M2/M7 모두 `not_measured`)
2. **Stage 2 (#102 보고, 우회 시도)**: `/sprint measure s1-foundation --gate M1 --trust L3` 우회 시도 → `mode: "preview"` (silent ignored, sprint state L1 fallback)
3. **Stage 3 (#100 보고)**: workaround로 메인 세션이 sprint-orchestrator 대신 직접 gap-detector spawn 시도 → orchestrator agent에 `Task` 도구 없어 `no_agent_runner` 반환

**Root cause cluster** (단일 sprint로 묶일 수 있는 근거):

| Stage | 결함 위치 | Type |
|-------|----------|------|
| #100 | `agents/sprint-*.md` 4개 frontmatter `tools:` 필드 누락 | Agent frontmatter inheritance |
| #101 | `scripts/sprint-handler.js` dispatch table에 `trust` 액션 부재 + `ACTION_TYPES`에 `sprint_trust_changed` 부재 | Handler API surface gap |
| #102 | `scripts/sprint-handler.js:721-723, 750-752` `normalizeTrustLevel(args)` 우회 (`args.trustLevel`만 직접 체크) | Arg normalization drift |

3개 모두 **Trust Level subsystem 내부 layer drift**: frontmatter (agent) → handler dispatch (script) → arg normalization (function). 단일 sprint로 통합 처리해야 **L1 lockout chain 완전 끊김**.

### 1.3 Related Documents

- 직전 v2.1.17 final report: `docs/04-report/features/v2117-ci-cd-hardening.report.md`
- v2.1.16 Issue #95 patterns (참조 기반): `--approve` single-use scope override
- Sprint Management guide: `docs/06-guide/sprint-management.guide.md`
- Trust Level 정책: SKILL.md §10.2 (Trust Level Acceptance) + §11.2 (SPRINT_AUTORUN_SCOPE)
- audit-logger ACTION_TYPES: `lib/audit/audit-logger.js:31-90`
- 직전 cycle 분석 (CC v2.1.146): `docs/04-report/features/cc-v2145-v2146-impact-analysis.report.md`
- GitHub PR (target): popup-studio-ai/bkit-claude-code#TBD (v2.1.18 release)

---

## 2. Scope

### 2.1 In Scope (3 Features, 단일 sprint)

#### F1 — sprint-* 4 agents Task tool allowlist (#100, P0)

- [ ] `agents/sprint-orchestrator.md` frontmatter `tools:` 필드 추가:
  - 기본 도구: Read, Write, Edit, Glob, Grep, Bash
  - Task allowlist: `Task(gap-detector)`, `Task(code-analyzer)`, `Task(sprint-qa-flow)`, `Task(sprint-report-writer)`, `Task(qa-monitor)`, `Task(pdca-iterator)`
- [ ] `agents/sprint-master-planner.md` frontmatter `tools:` 필드 추가:
  - 기본 도구 + `Task(product-manager)`, `Task(frontend-architect)`, `Task(enterprise-expert)` (master plan generation 시 sub-dispatcher)
- [ ] `agents/sprint-qa-flow.md` frontmatter `tools:` 필드 추가:
  - 기본 도구 + `Task(qa-monitor)`, `Task(gap-detector)` (7-layer dataFlowIntegrity 검증 보조)
- [ ] `agents/sprint-report-writer.md` frontmatter `tools:` 필드 추가:
  - 기본 도구 (Read/Glob/Grep + Write/Edit) — Task 불필요 (report 작성만)
- [ ] L3 contract test 추가: `test/contract/sprint-agents-tools.test.js` — 4 sprint-* agents `tools:` 필드 존재 + 핵심 Task allowlist invariant

#### F2 — /sprint trust mutation 명령 + audit + docs (#101, P0)

- [ ] `scripts/sprint-handler.js` `handleTrust(args, infra, deps)` 함수 신설:
  - signature: `{ id: string, to: 'L0'|'L1'|'L2'|'L3'|'L4', reason?: string }`
  - 로직: load sprint → validate to-level → check downgrade guardrail (L4 → ≤L2 시 control score ≥ 80 또는 explicit `--force` 요구) → mutate `sprint.autoRun.trustLevelAtStart` → save state → audit
  - return shape: `{ ok: true, sprintId, from, to, reason, mutationRecord }` 또는 `{ ok: false, reason: 'invalid_level'|'guardrail_blocked'|'sprint_not_found', error }`
- [ ] dispatch 추가: `scripts/sprint-handler.js:213` 부근 `case 'trust': return handleTrust(a, infra, d);`
- [ ] `lib/audit/audit-logger.js` ACTION_TYPES에 `sprint_trust_changed` 추가 (line 89 직후):
  - details schema: `{ sprintId, from, to, reason, trustScoreAtMutation, controlLevelAtMutation, mutatedBy: 'user'|'agent', timestamp }`
  - 카테고리: `'sprint'` + `'trust'` (multi-category 가능 시) 또는 단일 `'trust'`
- [ ] `skills/sprint/SKILL.md` §10.x (§10.1.x 직후) 신규 섹션 "10.1.3 Trust Level Mutation":
  - 명령 시그니처 + 예제
  - vs `--approve` (single-use) / vs `/bkit:control level` (global) 차이 비교 표
  - guardrail 정책 (downgrade 보호)
- [ ] sprint-handler help 텍스트 + `commands/bkit.md` help table 갱신

#### F3 — Trust 추출 경로 통일 + 회귀 test (#102, P1)

- [ ] `scripts/sprint-handler.js:721-723` (handleMeasure 내) — `const trustLevel = typeof args.trustLevel === 'string' ? args.trustLevel : ...` 를 `const trustLevel = normalizeTrustLevel(args) || (sprint.autoRun && sprint.autoRun.trustLevelAtStart);` 로 변경 (또는 normalizeTrustLevel이 fallback 통합 처리하도록 signature 확장)
- [ ] `scripts/sprint-handler.js:750-752` (runPhaseGates 내) — 동일 패턴 적용
- [ ] 옵션: `normalizeTrustLevel` signature 확장 `normalizeTrustLevel(args, sprintFallback?)` — fallback 명시
- [ ] 회귀 test: `test/unit/sprint-trust-normalization.test.js` (또는 기존 sprint-handler.test.js에 추가):
  - Case A: `args.trustLevel = 'L3'` only → 'L3'
  - Case B: `args.trust = 'L3'` only → 'L3' (✦ 본 fix 대상)
  - Case C: `args.trustLevelAtStart = 'L3'` only → 'L3'
  - Case D: `args.trust = 'L2'` + `args.trustLevel = 'L3'` → 'L3' (precedence)
  - Case E: `args.trust = 'invalid'` → 'L3' default
  - Case F: handleMeasure 통합 — `args.trust = 'L3'` + sprint L1 → record mode (not preview)
- [ ] SKILL.md §10.2 "Trust Level Acceptance" 본 fix 명시 (이미 docs 일치, 코드 fix 완료 명시만)
- [ ] PR/CHANGELOG에 "v2.1.16 #102 — trust CLI alias가 measure/phase 경로에서 silent ignored되던 결함 fix" 명시

### 2.2 Out of Scope

- Issue #95 (`--approve` 본체 로직 변경) — 이미 v2.1.16 출시, 본 sprint는 trust mutation **신규 추가**만 (기존 approve 우회와 명확히 구별)
- Trust Level 정책 자체 변경 (L0~L4 카테고리, SPRINT_AUTORUN_SCOPE 매핑) — `/bkit:control` 영역, 본 sprint는 mutation surface만 제공
- sprint-orchestrator agent 내부 로직 변경 — 본 sprint는 frontmatter tools 명시만, 로직은 무수정
- 다른 sprint 결함 (e.g., feature batch processing, fork merging) — separate sprint
- bkit-gemini fork sync — separate scope
- CC v2.1.147+ 신규 영향 분석 — separate cycle

### 2.3 Sprint 구조 결정 근거

**단일 sprint 채택 사유** (다중 sprint 대안 검토):

| 항목 | 단일 sprint (채택 ★) | 다중 sprint (대안) |
|------|---------------------|------------------|
| 도메인 일치도 | 100% (Sprint Management Trust subsystem) | — |
| 보고자/시점 동일 | YES (@pruge, 2026-05-21 03:54) | — |
| Hard-link 의존성 | F1 없으면 F2 mutation 후 dispatch 실패 / F3 없으면 F2 도입 후에도 stage 2 trap | 부분 release 시 다른 stage trap 존속 |
| 단일 PR 효율성 | 1 PR, 1 release notes, 1 CHANGELOG entry | 3 PR 분할 시 release notes 분산 + 사용자 confusion |
| QA scope | sprint-trust-ux e2e test 1세트로 통합 검증 | 각각 별도 e2e 필요 |
| 사용자 가치 | L1 lockout 사고 클래스 완전 종결 (3-stage 모두 해소) | 부분 가치만 (다른 stage 여전히 trap) |

**결론**: 단일 sprint 채택, 3 features hard-link 의존성으로 함께 release.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Feature | Priority | Status |
|----|-------------|---------|----------|--------|
| FR-01 | `agents/sprint-orchestrator.md` frontmatter `tools:` 필드에 Task(gap-detector/code-analyzer/sprint-qa-flow/sprint-report-writer/qa-monitor/pdca-iterator) 명시 | F1 | P0 | Pending |
| FR-02 | `agents/sprint-master-planner.md` frontmatter `tools:` 필드에 기본 도구 + Task(product-manager/frontend-architect/enterprise-expert) 명시 | F1 | P0 | Pending |
| FR-03 | `agents/sprint-qa-flow.md` frontmatter `tools:` 필드에 기본 도구 + Task(qa-monitor/gap-detector) 명시 | F1 | P0 | Pending |
| FR-04 | `agents/sprint-report-writer.md` frontmatter `tools:` 필드에 기본 도구 (Task 불필요) 명시 | F1 | P1 | Pending |
| FR-05 | `scripts/sprint-handler.js` `handleTrust(args, infra, deps)` 함수 신설 — mutation + validation + audit | F2 | P0 | Pending |
| FR-06 | dispatch table에 `case 'trust'` 추가 | F2 | P0 | Pending |
| FR-07 | `lib/audit/audit-logger.js` ACTION_TYPES에 `sprint_trust_changed` 추가 + details schema 명시 | F2 | P0 | Pending |
| FR-08 | downgrade guardrail — **major downgrade (≥2 levels)** 시 `trustScore >= 80` (from `.bkit/state/trust-profile.json` `trustScore` field, **trust-profile 모델 실측 확인**) 또는 `--force` 요구. **Alternative (Design §9 Q1)**: `currentLevel ≤ 1` (Manual/Read-only 모드일 때만 block) — CTO review §A5 권고, 단일 모델 단순화 선택지로 보존 | F2 | P1 | Pending |
| FR-09 | `skills/sprint/SKILL.md` §10.1.3 (또는 §10.x) "Trust Level Mutation" 섹션 신설 + 예제 + 비교 표 | F2 | P0 | Pending |
| FR-10 | sprint-handler help 텍스트 갱신 (`/sprint trust` 명령 포함) | F2 | P1 | Pending |
| FR-11 | `commands/bkit.md` help table에 `/sprint trust` 명령 추가 | F2 | P2 | Pending |
| FR-12 | `scripts/sprint-handler.js:721-723` (handleMeasure trust 추출) `normalizeTrustLevel(args)` 강제 | F3 | P0 | Pending |
| FR-13 | `scripts/sprint-handler.js:750-752` (runPhaseGates trust 추출) `normalizeTrustLevel(args)` 강제 | F3 | P0 | Pending |
| FR-14 | (옵션) `normalizeTrustLevel(args, sprintFallback)` signature 확장 — fallback 명시 | F3 | P2 | Pending |
| FR-15 | 회귀 test: `test/unit/sprint-trust-normalization.test.js` 6 cases | F3 | P0 | Pending |
| FR-16 | L3 contract test: `test/contract/sprint-agents-tools.test.js` — 4 sprint-* agents tools invariant | F1 | P0 | Pending |
| FR-17 | E2E test 통합: L1 sprint 시작 → `/sprint trust --to L3` → `/sprint measure` record mode → phase 전환 PASS | All | P0 | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| **L1 lockout 사고 차단** | @pruge 보고 시나리오를 e2e test로 재현 후 fix 적용 시 PASS, fix 미적용 시 FAIL | `test/e2e/sprint-l1-lockout-recovery.test.js` (또는 통합 시나리오 추가) |
| **차별화 6/6 정합성** | ENH-292 sequential dispatch (sprint-orchestrator → gap-detector 순차 호출 정상) | sequential dispatch L4 integration test 회귀 PASS |
| **Audit 완결성** | sprint_trust_changed 항목이 .bkit/audit/ NDJSON에 정확히 기록 (5 ACTION_TYPES 신규 추가 후에도 sanitizer 통과) | audit-logger unit test 회귀 + 신규 audit-action test |
| **Backward compat** | 기존 `--trustLevel L3` 사용 시 동일 동작, 기존 sprint state 호환 | 회귀 test + sprint state migration 불필요 (sprint.autoRun.trustLevelAtStart 기존 schema 유지) |
| **Test coverage** | 신규 14 TC 추가 (unit 9 + contract 1 + integration 2 + e2e 2, CTO §F 권고로 NDJSON injection / actor spoofing / 기존 trustLevel precedence 보호 / sub-agent-dispatcher state 천이 + E2E process restart 영속 1 case 추가), qa-aggregate **4103 → 4117+/0** 유지 | qa-aggregate 결과 |
| **Docs=Code 매치율** | docs/02-design + skill docs §10.x 갱신과 코드 변경 동시 PR (단발), 매치율 ≥ 90% 유지 | `scripts/check-docs-code-sync.js` |
| **Trust 정책 일관성** | trust mutation이 `--approve` (single-use) vs `/bkit:control level` (global)과 명확히 구별 | SKILL.md §10.1.3 비교 표 검증 |
| **Idempotency** | `/sprint trust s1 --to L3` 반복 호출 시 동일 결과 (audit는 매번 기록되나 state mutation은 no-op) | 회귀 test (`from === to` 케이스) |

### 3.3 보고자 시나리오 재현 검증 기준

**Before fix (현재 v2.1.17)**:
```
1. /sprint init s1-foundation --trust L1 --features f1
2. /sprint phase s1-foundation --to do  → OK (init→do 자동)
3. (do 단계 작업 완료)
4. /sprint measure s1-foundation --gate M1
   → { trustLevel: "L1", mode: "preview" } — qualityGates 미반영
5. /sprint phase s1-foundation --to iterate
   → { ok: false, reason: "gate_fail", M1: "not_measured" }
6. /sprint measure s1-foundation --gate M1 --trust L3
   → { trustLevel: "L1", mode: "preview" } — silent ignored (#102)
7. /sprint measure s1-foundation --gate M1 --trustLevel L3
   → { trustLevel: "L3", mode: "record" } — works but ugly
8. (workaround) main session이 gap-detector 직접 spawn
   → sprint-orchestrator는 measure-router 호출 불가 (#100)
```

**After fix (v2.1.18 target)**:
```
1. /sprint init s1-foundation --trust L1 --features f1
2. /sprint phase s1-foundation --to do  → OK
3. (do 단계 작업 완료)
4. /sprint trust s1-foundation --to L3 --reason "P0 32/32 ready"
   → { ok: true, from: "L1", to: "L3", auditId: "..." } (✦ 신규)
5. /sprint measure s1-foundation --gate M1
   → { trustLevel: "L3", mode: "record", value: 92.3 } (✦ sprint state 따라감)
6. /sprint phase s1-foundation --to iterate
   → { ok: true, phase: "iterate" } (✦ gate PASS)

OR (per-call override 패턴):
4'. /sprint measure s1-foundation --gate M1 --trust L3
    → { trustLevel: "L3", mode: "record" } (✦ #102 fix: --trust 인식)
```

---

## 4. Architecture & Design Direction

### 4.1 차별화 6/6 정합성

| 차별화 | 영향 | 정합성 |
|--------|------|--------|
| ENH-286 Memory Enforcer | 무영향 (trust mutation은 CLAUDE.md 의존 안 함) | ✅ |
| ENH-289 Defense Layer 6 | F2 `sprint_trust_changed` audit은 Layer 6 post-hoc audit 흐름과 정합 (audit-logger 동일 모듈) | ✅ 강화 |
| ENH-292 Sequential Dispatch | F1 sprint-orchestrator Task tool 활성화로 sequential dispatch 정책 실제 작동 (현재 dispatch 자체 불가) | ✅ **활성화** |
| ENH-300 Effort-aware Adaptive | 무영향 (effort.level은 agent 호출 시 부여, trust와 별개) | ✅ |
| ENH-303 PostToolUse continueOnBlock | 무영향 | ✅ |
| ENH-310 Heredoc Detector | 무영향 (trust mutation은 bash heredoc 미사용) | ✅ |

**핵심**: ENH-292 차별화 #3이 본 fix(F1) 적용 시 **실제로 작동 가능**해짐. 현재는 sprint-orchestrator가 Task tool 부재로 sequential dispatch 정책을 적용할 기회조차 없었음. 본 fix는 차별화 #3을 **선언 → 실제 작동**으로 승격.

### 4.2 ADR 0003 정합성

본 sprint는 코드 변경 후 ADR 0003 14항목 모두 PASS 유지 필수:
- agents 40개 (4 sprint-* 갱신만, 신규 추가 없음)
- hooks events 21 / blocks 24 (무영향)
- skills 44 (SKILL.md 갱신만)
- tests 4103 → **4117+** (14 TC 신규, CTO §F 권고 3 cases 추가 반영)
- audit ACTION_TYPES **29 → 30** (sprint_trust_changed 추가) — **메인 세션 재측정**: `node -e "console.log(require('./lib/audit/audit-logger').ACTION_TYPES.length)"` = 29 (runtime export 결정적, 직전 cycle "30" 표기는 errata)
- baseline v2.1.18 신규 캡처 — CTO §G G4 권고로 **본 sprint 완료 직후 mandatory 격상** (다음 cycle 격상 옵션 제거), F9-120 closure 15 → 16-cycle milestone

### 4.3 Trust Level 정책 비교 표 (SKILL.md §10.1.3 신규 섹션 예시)

| 명령 | 적용 범위 | 영속성 | 사용 시점 |
|------|----------|--------|----------|
| `/sprint phase ... --approve` | Single transition | Single-use (state 무변경) | 1회 scope boundary 우회 (#95) |
| `/sprint trust <id> --to <L>` ✦ | Sprint 전체 (이 sprint만) | Persistent (sprint.autoRun.trustLevelAtStart 변경) | 본 sprint trust 정책 영구 변경 (이 sprint scope) |
| `/bkit:control level <N>` | Global (모든 sprint + PDCA) | Persistent (~/.bkit/state/control.json) | 전역 automation 정책 변경 |
| `--trustLevel <L>` (per-call) | Single call | Volatile (state 무변경) | 1회 호출 override (debug용) |

---

## 5. Test Plan

### 5.1 Unit Tests (4 추가)

- `test/unit/sprint-trust-normalization.test.js` — 6 cases (FR-15)
- `test/unit/sprint-handler-trust-action.test.js` — handleTrust function 5+ cases (mutation success, invalid level, downgrade guardrail, audit emission, idempotent)
- `test/unit/audit-action-types.test.js` 확장 — sprint_trust_changed 검증 추가

### 5.2 Contract Tests (1 추가)

- `test/contract/sprint-agents-tools.test.js` — 4 sprint-* agents `tools:` invariant (FR-16)
  - 각 agent에 tools 필드 존재
  - Task allowlist 최소 1개 (sprint-report-writer 제외)
  - frontmatter parse 가능

### 5.3 Integration Tests (1 추가)

- `test/integration/sprint-orchestrator-dispatch.test.js` — sprint-orchestrator가 Task(gap-detector) 호출 시 measure-router가 정상 응답 (현재 `no_agent_runner` 반환, fix 후 정상 dispatch)

### 5.4 E2E Tests (1 추가)

- `test/e2e/sprint-l1-lockout-recovery.test.js` — 보고자 시나리오 전체 재현:
  - Init L1 → phase do → measure preview → trust to L3 → measure record → phase iterate PASS
  - 각 step audit log 검증

### 5.5 회귀 영향 평가

| 영역 | 영향 | 회귀 risk |
|------|------|----------|
| 4 sprint-* agents | tools 필드 신규 (frontmatter 추가만) | 기존 동작 변경 없음, 신규 도구 활성화만 |
| audit-logger | ACTION_TYPES +1 entry | 기존 30 entries 무영향, sanitizer 패턴 동일 |
| sprint-handler dispatch | case 'trust' 신규 | 기존 17 actions 무영향 |
| normalizeTrustLevel 호출 통일 | 기존 fallback 동작 보존 | F3 회귀 test 6 cases로 보장 |

---

## 6. Implementation Roadmap

### 6.1 Sprint 단계 매핑 (8-phase sprint container)

> ⚠️ **Self-Referential Meta Risk (CTO §H 권고)** — 본 sprint는 자기 자신의 fix 대상(F1 = sprint-orchestrator Task tool 부재 #100)을 다루므로 `sprint-orchestrator` 가 정상 dispatch 불가한 chicken-and-egg 상태. 본 sprint는 **sprint container를 사용하지 않고 PDCA cycle (cto-lead + pm-lead + qa-lead) 로 진행**한다. `/sprint init` 으로 sprint state는 생성하되, phase advance + measurement는 메인 세션이 dispatcher 역할로 처리 (F1 적용 직후 sprint-orchestrator가 정상화되면 그 시점부터 정식 dispatch). 아래 표는 phase 추적용 mapping이며 자동 orchestration 의도 아님.


| Sprint Phase | 작업 | Owner | 산출물 |
|-------------|------|-------|--------|
| **prd** | 본 문서 (Plan) + Design (다음 step) | kay | plan.md + design.md |
| **plan** | feature breakdown (F1/F2/F3) + 의존성 그래프 | kay | (본 plan §2.1) |
| **design** | 다음 step `/pdca design` 작성 — 코드 변경 위치, API/CLI 시그니처, hook 흐름 | kay | design.md |
| **do** | F1 → F2 → F3 순차 구현 (P0 dependency 순서) | kay | 4 agent 파일 + handleTrust + handleTrust dispatch + ACTION_TYPES + 2 normalizeTrustLevel 통일 + SKILL.md §10.1.3 + 11 TC |
| **iterate** | gap-detector M1 측정 → iterate 시 gap 발견 fix | sprint-orchestrator | gap report + fix commits |
| **qa** | sprint-qa-flow S1 dataFlowIntegrity (3 features 각각) + L1-L5 test 실행 | sprint-qa-flow | qa-report.md |
| **report** | sprint-report-writer 보고서 + KPI snapshot | sprint-report-writer | report.md |
| **archived** | docs/archive 이동 + MEMORY.md 갱신 | kay | archive timestamp + memory entry |

### 6.2 의존성 그래프

```
F1 (sprint-* tools allowlist)
  ├─ blocks → F2.handleTrust dispatch 실측 검증 (Task 호출 가능해야 e2e PASS)
  ├─ blocks → sprint-orchestrator-dispatch.test.js (integration)
  └─ blocks → E2E test step 4-5 (measure record mode)

F2 (/sprint trust mutation)
  ├─ blocks → E2E test step 4 (trust mutation)
  └─ depends → ACTION_TYPES extension (audit-logger.js)

F3 (normalizeTrustLevel 통일)
  ├─ blocks → #102 closure (--trust per-call alias)
  └─ blocks → E2E test step 4' (alternative path)

E2E test (보고자 시나리오 재현)
  ├─ depends → F1 + F2 + F3 모두 완료
  └─ blocks → release approval
```

### 6.3 Release Plan

- Target tag: `v2.1.18`
- PR title: `release(v2.1.18): Sprint Trust UX Fix (Issues #100/#101/#102)`
- 단일 PR (3 features 묶음) 또는 3 commits 1 PR
- 머지 후 `claude plugin tag v2.1.18` 또는 manual git tag
- GitHub Release notes: 본 plan §1.2 보고자 시나리오 인용

---

## 7. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| F1 tools 필드 추가가 다른 agent에 implicit 영향 | LOW | MEDIUM | 4 agents 격리 검증 + L3 contract test invariant |
| F2 trust mutation이 SPRINT_AUTORUN_SCOPE 정책 우회 | MEDIUM | HIGH | downgrade guardrail + audit `from/to/reason` 영속 기록 |
| F3 fix가 기존 fallback 의존 코드 깨뜨림 | LOW | MEDIUM | normalizeTrustLevel signature 확장 (sprintFallback 명시) + 회귀 test |
| 보고자 시나리오 외 edge case 발견 | MEDIUM | LOW | E2E test 다양화 (L0→L4 모든 path) |
| audit ACTION_TYPES 추가가 v2.1.17 baseline 깨뜨림 | LOW | MEDIUM | baseline 갱신 + backward compat (기존 30 entries 무영향) |
| sprint-orchestrator Task tool 활성화 후 무한 dispatch loop | LOW | HIGH | ENH-292 sequential dispatch 정책으로 이미 cap, integration test 검증 |

---

## 8. Acceptance Criteria

본 sprint 완료 판정:

- [ ] F1: 4 sprint-* agents `tools:` 필드 명시 + L3 contract test PASS
- [ ] F2: `/sprint trust <id> --to <Level> --reason "..."` 명령 정상 작동 + audit `sprint_trust_changed` 기록 + skill docs §10.1.3 추가
- [ ] F3: `--trust L<N>` per-call override가 measure/phase 경로에서 정상 인식 + 회귀 test 6 cases PASS
- [ ] E2E: 보고자 시나리오 (`s1-foundation` L1 lockout) 재현 후 fix 적용 시 PASS
- [ ] qa-aggregate: **4103 → 4117+/0** (FAIL 0건 유지, CTO §F 권고 3 추가 cases 반영)
- [ ] ADR 0003 14/14 PASS (15-cycle consistency 16-cycle로 갱신, baseline v2.1.18 mandatory capture)
- [ ] **CTO review BLOCKER 3건 모두 해소**: controlScore→trustScore 정정 ✅ / ACTION_TYPES 29→30 정정 ✅ / NDJSON injection 평가 (sanitizeDetails + JSON.stringify 자동 escape로 안전 확인) ✅
- [ ] **CTO review MEDIUM CONCERN 3건 처리**: idempotent no-op audit (noop:true field) / actor spoofing (handleTrust signature actor 명시) / integration test sub-agent-dispatcher state 천이 1 case
- [ ] CHANGELOG.md v2.1.18 섹션 + GitHub Release notes 작성
- [ ] Issue #100/#101/#102 모두 close (v2.1.18 release notes에 명시)
- [ ] Docs=Code 매치율 90% 유지 (단발 PR로 코드/docs 동시 갱신)

---

## 9. References

- GitHub Issues: [#100](https://github.com/popup-studio-ai/bkit-claude-code/issues/100), [#101](https://github.com/popup-studio-ai/bkit-claude-code/issues/101), [#102](https://github.com/popup-studio-ai/bkit-claude-code/issues/102)
- 보고자: @pruge (james kim)
- bkit version (current): v2.1.17 GA
- bkit version (target): v2.1.18
- Branch: `feature/v2118-issue-fixes`
- 직전 sprint pattern 참조: BKIT-178 `[bkit-claude-code v2.1.16] Quality Gates & Approval UX + Release Hardening`
