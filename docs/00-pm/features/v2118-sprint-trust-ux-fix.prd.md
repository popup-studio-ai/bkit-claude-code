---
template: pm-prd
version: 2.0
feature: v2118-sprint-trust-ux-fix
date: 2026-05-21
author: kay
project: bkit
version: 2.1.18
status: Draft
predecessor: v2.1.17 final (PR #99 merged 2026-05-20)
github_issues: ["#100", "#101", "#102"]
reporter: "@pruge (james kim)"
reporter_scenario: dandi-village-ledger sprint s1-foundation (L1 lockout)
---

# v2118-sprint-trust-ux-fix — Product Requirements Document

> **Date**: 2026-05-21
> **Author**: kay
> **Method**: bkit PM Agent Team (5-Step Discovery + Strategy + Research + Execution)
> **Status**: Draft
> **Sprint**: v2118-sprint-trust-ux-fix (state `.bkit/state/sprints/v2118-sprint-trust-ux-fix.json`, phase: `plan`)
> **Related Docs**:
> - Plan: `docs/01-plan/features/v2118-sprint-trust-ux-fix.plan.md`
> - Design: `docs/02-design/features/v2118-sprint-trust-ux-fix.design.md`

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit v2.1.16에서 L1 trust로 sprint를 시작한 사용자(@pruge, dandi-village-ledger `s1-foundation`)가 **3-stage trap에 갇혀** P0 32/32 구현 완료 후 phase 전환 영구 불가. 유일 escape는 sprint re-init이고, 그 순간 phaseHistory/qualityGates/featureMap이 통째로 destruction되어 며칠치 작업이 손실됨. |
| **Solution** | 3 features 단일 sprint 통합 fix: (F1) `agents/sprint-*.md` 4개의 `tools:` frontmatter에 Task allowlist 명시 → orchestrator가 measurement agent dispatch 가능, (F2) `/sprint trust <id> --to <Level> --reason "..."` 명령 신설 + `sprint_trust_changed` audit ACTION_TYPE → preview-mode lockout 영구 escape, (F3) `scripts/sprint-handler.js:721-723, 750-752` 두 trust 추출 경로를 `normalizeTrustLevel(args)` 강제 → `--trust` CLI alias가 docs와 일치하게 작동. |
| **Target User** | (1) L1 trust로 신중하게 sprint를 시작하는 conservative bkit 사용자 (@pruge 패턴), (2) sprint-orchestrator의 measurement routing 책임에 의존하는 모든 sprint 활용자, (3) bkit SKILL.md §10.2를 신뢰하고 `--trust L3` per-call override를 사용하는 사용자. |
| **Core Value** | **v2.1.16에서 보고된 "L1 sprint lockout 사고 클래스"를 v2.1.18에서 영구 종결**. 단일 root cluster (frontmatter inheritance + handler dispatch + arg normalization의 3-layer drift)에서 발생한 3 이슈를 hard-link 의존성으로 통합 처리. 부분 fix는 다른 stage trap이 남기 때문에 의미 없음. ENH-292 sequential dispatch 차별화가 "선언 → 실제 작동"으로 활성화됨. |

---

## 1. Opportunity Discovery (pm-discovery)

### 1.1 Desired Outcome

**Outcome**: "L1 trust로 시작한 bkit sprint 사용자가 phase 진행 중 lockout 없이, **state(phaseHistory/qualityGates/featureMap) 손실 없이** L3 record mode로 escalate할 수 있다."

**측정 가능 KR**:
- 보고자 시나리오(@pruge `s1-foundation`)가 sprint re-init 없이 4 단계(trust mutation → measure record → phase advance → audit verify)로 완결됨
- L1 sprint 사용자 retention proxy: lockout 보고 0건/release cycle (v2.1.18 → v2.1.20 trailing window)
- `/sprint trust` 명령 도입 후 30일 내 use frequency ≥ 5회 (audit log `sprint_trust_changed` count)

### 1.2 Brainstormed Ideas (Top 5)

| # | Idea | Perspective | Rationale |
|---|------|-------------|-----------|
| 1 | `/sprint trust` mutation 명령 신설 (Persistent) | 사용자 UX | re-init 없이 trust escalate, `--approve` (single-use)와 `/bkit:control level` (global) 사이 missing middle 보강 |
| 2 | sprint-* 4 agents `tools:` frontmatter 명시 (Task allowlist) | 아키텍처 | CC default policy 우회, 명시적 contract — `cto-lead.md` pattern 일관 적용 |
| 3 | `normalizeTrustLevel(args)` 강제 (2 위치) | Code quality | docs §10.2 declared precedence와 실제 코드의 drift 제거, "Docs=Code" 철학 강화 |
| 4 | `sprint_trust_changed` audit ACTION_TYPE | 보안/추적 | trust mutation은 권한 escalation 성격 → audit trail 필수, Defense Layer 6와 정합 |
| 5 | Downgrade guardrail (L4 → ≤L2 시 control score ≥ 80 또는 `--force`) | 거버넌스 | 비가역 정책 우회 차단, accidental trust regression 방지 |

### 1.3 Opportunity Solution Tree

```
Outcome: L1 sprint 사용자가 lockout 없이 trust escalate (state 손실 0)
│
├── Opportunity 1: "L1 사용자가 sprint init 후 trust를 바꿀 수 없다" (#101 P0)
│   ├── Solution A: /sprint trust mutation 명령 신설 (★ 채택)
│   ├── Solution B: /sprint re-init 자동 마이그레이션 (state 보존)
│   └── Solution C: sprint.config.json 직접 편집 안내 (docs)
│
├── Opportunity 2: "sprint-orchestrator가 measurement agent를 호출 못한다" (#100 P0)
│   ├── Solution D: sprint-* 4 agents `tools:` 명시 (★ 채택)
│   ├── Solution E: CC default policy 변경 요청 (upstream)
│   └── Solution F: 메인 세션 pass-through dispatcher 영구화 (workaround 고착)
│
└── Opportunity 3: "docs와 CLI 동작이 다르다 — --trust L3가 무시됨" (#102 P1)
    ├── Solution G: normalizeTrustLevel(args) 강제 + 회귀 test (★ 채택)
    ├── Solution H: --trust 별칭 자체 제거 + --trustLevel만 유지 (breaking)
    └── Solution I: docs §10.2를 코드에 맞춰 수정 (docs degradation)
```

### 1.4 Prioritized Opportunities (Reach × Impact × Confidence ÷ Effort)

| # | Opportunity | Importance | Satisfaction | Score | Sequencing |
|---|------------|:----------:|:------------:|:-----:|:----------:|
| 1 | "Trust mutation 명령 부재" (#101) | 1.0 | 0.0 | **1.0** | P0 main value |
| 2 | "sprint-orchestrator dispatch 실패" (#100) | 0.95 | 0.0 | **0.95** | P0 dependency (F1 없으면 F2 검증 불가) |
| 3 | "`--trust` silent ignored" (#102) | 0.7 | 0.1 | **0.6** | P1 polish (docs 신뢰성) |

→ **3 이슈 모두 단일 sprint 처리 필수**. 부분 fix 시 다른 stage trap 잔존(Plan §2.3 분석 참조).

### 1.5 Key Assumptions & Risk Prioritization

| # | Assumption | Category | Impact | Risk | Score | Action |
|---|-----------|----------|:------:|:----:|:-----:|--------|
| A1 | "L1 사용자가 sprint 진행 중 trust escalate를 원한다" | Desirability | High | Low | 0.85 | @pruge 보고가 직접 증거, 추가 검증 불필요 |
| A2 | "Sprint state 손실은 L1 사용자에게 critical pain이다" | Desirability | High | Low | 0.85 | dandi-village-ledger P0 32/32 작업 손실 측정 (수일치 effort) |
| A3 | "Trust mutation 명령이 SPRINT_AUTORUN_SCOPE 정책과 일관성 유지 가능" | Feasibility | Medium | Medium | 0.5 | Design §3.6 비교 표로 명확화, downgrade guardrail로 cover |
| A4 | "tools allowlist 명시가 기존 4 sprint-* agents 동작에 회귀 영향 없음" | Feasibility | High | Low | 0.85 | frontmatter 추가만, 본문 무수정, L3 contract test로 보장 |
| A5 | "F3 fix가 fallback 의존 코드를 깨뜨리지 않는다" | Feasibility | Medium | Low | 0.7 | 회귀 test 6 cases로 precedence 보존 검증 |
| A6 | "L1 lockout이 v2.1.18 release 후 재발하지 않는다" | Viability | High | Medium | 0.55 | E2E test로 시나리오 재현 + ADR 0003 갱신 |

### 1.6 Recommended Experiments

| # | Tests Assumption | Method | Success Criteria | Effort |
|---|-----------------|--------|-----------------|:------:|
| E1 | A1 + A2 | @pruge에 v2.1.18 RC 베타 테스트 의뢰, `s1-foundation` 시나리오 재현 | re-init 없이 trust mutation → record measure → phase advance 4단계 완결 | Low |
| E2 | A4 | L3 contract test (`sprint-agents-tools.test.js`) — 4 sprint-* agents tools 필드 invariant | tools 필드 존재 + Task allowlist 최소 1개 (report-writer 제외) | Low |
| E3 | A5 | 회귀 test 6 cases (Design §4.3) — normalizeTrustLevel precedence 보존 | 모두 PASS, breaking change 0건 | Low |
| E4 | A3 + A6 | E2E test (`sprint-l1-lockout-recovery.test.js`) — 보고자 시나리오 step 1-7 | 모든 step PASS + audit log에 `sprint_trust_changed` entry 1+ | Medium |
| E5 | A6 | qa-aggregate 4103 → 4114+ 갱신 + ADR 0003 16-cycle PASS | FAIL 0건 유지, 14/14 contract 항목 PASS | Medium |

---

## 2. Value Proposition & Strategy (pm-strategy)

### 2.1 JTBD Value Proposition (6-Part — Sprint Trust Mutation 시나리오)

| Part | Content |
|------|---------|
| **Who** | L1 trust로 sprint를 신중하게 시작하는 bkit 사용자 (예: @pruge, dandi-village-ledger maintainer) |
| **Why** | L1으로 시작했으나 P0 작업 완료 후 measurement가 record되도록 trust escalate가 필요, 그러나 현재 sprint 진행 중 trust 변경 불가 → re-init은 state 손실 → 우회로 메인 세션이 직접 sub-agent spawn 시도 → sprint-orchestrator Task tool 부재로 실패 |
| **What Before** | (a) 현재 v2.1.17까지: `/sprint init --trust L1` 후 trust 변경 불가 — sprint re-init만 가능 (phaseHistory/qualityGates/featureMap 통째로 reset), (b) workaround `--trust L3` per-call override는 silent ignored (#102), (c) 메인 세션 workaround는 sprint-orchestrator agent dispatch 불가로 specced된 routing 책임을 떠맡음 |
| **How** | (a) `/sprint trust s1-foundation --to L3 --reason "P0 32/32 ready for measurement"` 1회 호출로 sprint.autoRun.trustLevelAtStart mutation + audit, (b) sprint-* 4 agents tools 명시로 measurement routing 정상 dispatch, (c) `--trust L3` per-call alias도 정상 인식 (docs §10.2와 일치) |
| **What After** | sprint state 손실 0, P0 작업 보존, audit trail에 trust 변경 영속 기록, sprint-orchestrator가 specced된 measurement routing 책임 fulfill, docs와 코드 일치로 사용자 신뢰성 회복 |
| **Alternatives** | (1) sprint re-init (현재 유일 escape, state 손실 critical), (2) sprint.config.json 직접 편집 (위험, audit 없음), (3) bkit 사용 포기 (negative reputation loop) |

**Value Proposition Statement**: "L1으로 신중하게 시작한 bkit 사용자가 sprint 작업 보존하며 trust escalate할 수 있어, sprint re-init 없이 measurement를 record하고 phase를 안전하게 advance할 수 있다."

### 2.2 Lean Canvas

| Section | Content |
|---------|---------|
| **Problem** | (1) L1 sprint trust mutation 명령 부재 → preview-mode lockout (P0), (2) sprint-orchestrator agent의 measurement dispatch 도구 부재 (P0), (3) `--trust` CLI alias가 measure/phase 경로에서 silent ignored (P1) |
| **Solution** | (1) `/sprint trust` 명령 + audit ACTION_TYPE, (2) sprint-* 4 agents `tools:` frontmatter 명시, (3) `normalizeTrustLevel(args)` 강제 + 회귀 test 6 cases |
| **UVP** | "bkit는 sprint 진행 중에도 trust를 안전하게 mutation할 수 있는 유일한 PDCA 도구 — state 보존 + audit trail + downgrade guardrail" |
| **Unfair Advantage** | (a) ENH-292 sequential dispatch 차별화 #3 활성화 (sprint-orchestrator가 본 fix로 실제 작동), (b) Defense Layer 6 audit-logger와 정합 (sprint_trust_changed → post-hoc audit), (c) 3-layer drift (frontmatter + handler + arg norm) 단일 sprint로 통합 해결 |
| **Customer Segments** | (Primary) Conservative L1 bkit 사용자 / (Secondary) sprint-orchestrator routing 의존 사용자 / (Tertiary) docs §10.2 신뢰 `--trust` per-call 사용자 |
| **Channels** | (1) GitHub Issues #100/#101/#102 closure notification, (2) v2.1.18 GitHub Release notes (보고자 시나리오 직접 인용), (3) `.bkit/state/MEMORY.md` `Carryovers` 섹션 업데이트, (4) sprint SKILL.md §10.1.3 신규 |
| **Revenue Streams** | (Open-source) bkit user retention proxy ↑, negative-reputation loop 차단, lockout 보고 0건 trailing window |
| **Cost Structure** | (1) Implementation ~5.5시간 (Design §7), (2) QA scope 11 TC 추가 (4 unit + 1 contract + 1 integration + 1 e2e + 4 regression), (3) Docs update (SKILL.md §10.1.3 + commands/bkit.md + CHANGELOG.md) |
| **Key Metrics** | (North Star) "L1 sprint lockout 보고 0건/release cycle" / (Supporting) `sprint_trust_changed` audit count, qa-aggregate 4103→4114+ pass rate, ADR 0003 14/14 PASS streak |

### 2.3 SWOT Analysis

| | Helpful | Harmful |
|---|---------|---------|
| **Internal** | **Strengths**: (a) bkit v2.1.17 GA 안정성 (5축 매트릭스 5/5 close), (b) 차별화 6/6 product moat, (c) `--approve` (#95) pattern 선례로 audit/guardrail 패턴 검증됨, (d) Design 문서 매우 상세하여 implementation 결정 비용 0 | **Weaknesses**: (a) sprint Management subsystem 자체가 v2.1.13 신규 — UX 검증 사례 부족, (b) Trust Level 정책 (L0~L4)이 사용자에게 직관적이지 않음, (c) sprint state 손실이 critical한데 마이그레이션 도구 없음 |
| **External** | **Opportunities**: (a) @pruge 보고가 단일 사용자지만 L1 사용 패턴 잠재 사용자 모두 영향, (b) Defense Layer 6 / ENH-292 차별화와 자연 정합, (c) v2.1.18 release를 통해 "bkit는 사용자 보고에 신속 대응" 평판 강화 | **Threats**: (a) CC upstream policy 변경 (e.g., tools allowlist 동작 변경)로 fix invalidate 가능성, (b) trust mutation이 거버넌스 우회 수단으로 악용 (downgrade guardrail로 mitigate), (c) 보고자가 v2.1.18 출시 전 bkit 이탈 가능성 (negative-reputation loop fire) |

**SO Strategy** (Leverage Strengths for Opportunities): 차별화 6/6과 정합되는 fix 패턴으로 단일 PR 신속 출시 → ENH-292 sequential dispatch "선언 → 활성화" 전환을 release notes 핵심 메시지로 활용 → @pruge 보고 시나리오를 직접 인용하여 "사용자 피드백 즉시 대응" 평판 강화.

**WT Strategy** (Mitigate Weaknesses against Threats): Trust mutation 명령에 downgrade guardrail (control score ≥ 80 또는 `--force`) 강제 → 거버넌스 우회 차단. baseline v2.1.18 capture로 ACTION_TYPES 31 entries 고정 → 향후 CC upstream 변경 시에도 contract 회귀 감지. SKILL.md §10.1.3에 4-way 비교 표 (approve/trust/control/per-call) 명시 → 사용자 mental model 명확화.

### 2.4 Additional Strategic Analysis (Pricing N/A — open-source)

**Porter's Five Forces** (간소화):
- **Substitutes 위협**: HIGH — 사용자가 bkit를 떠나 다른 PDCA 도구로 이탈 가능 → 본 fix는 substitution 차단의 핵심 fix
- **Buyer Power**: HIGH — open-source 사용자는 즉시 fork/dispose 가능 → @pruge 같은 early adopter retention이 critical

**Ansoff Matrix**: **Market Penetration** (기존 시장 + 기존 제품) — 본 fix는 새 시장/제품 진입이 아닌 기존 sprint 사용자의 lockout 결함 제거.

---

## 3. Market Research (pm-research)

### 3.1 User Personas (bkit 사용자 + sprint 활용 패턴 기반)

#### Persona 1: "Conservative Pavel" — L1 신중 사용자 (Primary, @pruge 실제 사례)

| Attribute | Details |
|-----------|---------|
| **Demographics** | bkit early adopter, 솔로 또는 소규모 팀 maintainer (dandi-village-ledger 운영자 @pruge가 실제 인스턴스), Korean primary, GitHub Issues로 적극 피드백 |
| **Primary JTBD** | "When I start a new sprint with uncertain scope, I want to begin with L1 trust (max human-in-loop), So I can validate the approach before automating measurement/phase transitions" |
| **Pain Points** | 1. L1로 시작 후 P0 작업 완료해도 measurement record 못함 (preview-mode lockout) 2. `--trust L3` per-call override 시도해도 silent ignored (docs 신뢰성 무너짐) 3. 유일 escape인 sprint re-init은 P0 32/32 작업을 통째로 destruction (며칠치 effort 손실) |
| **Desired Gains** | 1. Sprint 진행 중에도 trust 안전 escalate 가능 (state 보존) 2. CLI alias가 docs와 일치 (`--trust L3` 즉시 인식) 3. trust 변경 영속 audit trail (governance 만족) |
| **Unexpected Insight** | 보고자가 issue #100/#101/#102를 **동시(2026-05-21 03:54) 보고** — 이는 우연이 아닌 **단일 root cluster의 stage trap을 순차 발견**한 증거. 부분 fix는 다른 stage에서 다시 trap에 빠짐을 사용자가 이미 경험으로 깨달음. |
| **Product Fit** | F1+F2+F3 통합 fix가 정확히 이 사용자의 3-stage pain을 단일 release로 해소. trust mutation 명령은 새 기능이 아닌 **이미 docs에 약속된 동작의 실현** (SKILL.md §10.2 declared precedence). |

#### Persona 2: "Routing-Dependent Ryu" — sprint-orchestrator 활용 사용자 (Secondary)

| Attribute | Details |
|-----------|---------|
| **Demographics** | bkit Sprint Management subsystem heavy user, 다중 feature 동시 관리, qualityGates M1/M2/M3/M4/M7/M8/S1 dispatch에 의존 |
| **Primary JTBD** | "When I run /sprint measure on a feature, I want sprint-orchestrator to route to the right measurement agent (gap-detector/code-analyzer/sprint-qa-flow), So I can get gate values without manual sub-agent spawn" |
| **Pain Points** | 1. sprint-orchestrator agent의 measurement routing 책임이 specced되어 있으나 실제로는 Task tool 부재로 dispatch 불가 (#100) 2. 메인 세션이 pass-through dispatcher 떠맡는 workaround로 ENH-292 sequential dispatch 차별화 무력화 3. measure-router agentTaskRunner 호출이 `no_agent_runner` 반환 — deterministic이지만 silent fail에 가까움 |
| **Desired Gains** | 1. sprint-orchestrator가 specced된 routing 책임 fulfill (architectural integrity) 2. ENH-292 sequential dispatch가 실제 작동 (차별화 #3 활성화) 3. measurement workflow가 sprint scope 내부에서 self-contained로 완결 |
| **Unexpected Insight** | F1 fix는 sprint-orchestrator의 본문 코드를 **단 1줄도 수정하지 않음** — frontmatter `tools:` 필드만 명시. 이는 v2.1.17까지 sprint-orchestrator agent가 design 상으로는 완성되어 있었으나 inheritance 정책 변화/누락으로 disabled 상태였음을 의미. |
| **Product Fit** | F1은 "이미 작성된 agent의 잠재력을 unlock"하는 fix. 차별화 6/6 narrative에서 ENH-292가 "선언만 되어 있고 실제 작동 미검증"이었던 상태를 "실 작동" 상태로 승격. |

#### Persona 3: "Docs-Trusting Tomoko" — SKILL.md §10.2 신뢰 사용자 (Tertiary)

| Attribute | Details |
|-----------|---------|
| **Demographics** | bkit docs 정독파, SKILL.md §10.2 "Trust Level Acceptance" precedence rule 학습 후 `--trust L3` (intuitive shorter name) 사용 |
| **Primary JTBD** | "When I run /sprint measure with --trust L3 as an explicit per-call override, I want the handler to honor the documented precedence (trustLevel > trust > trustLevelAtStart), So I can debug without sprint state mutation" |
| **Pain Points** | 1. Docs declares `args.trust`도 정상 인식한다고 명시 (§10.2)했으나 실제 코드는 `args.trustLevel`만 직접 체크 (`scripts/sprint-handler.js:721-723, 750-752`) 2. silent ignored로 디버깅 시간 낭비 — preview mode가 의도된 동작인지 버그인지 사용자가 혼란 3. docs를 신뢰한 사용자가 오히려 더 큰 시간 손실 (docs를 무시한 사용자는 처음부터 `--trustLevel` 사용) |
| **Desired Gains** | 1. Docs와 코드 동작 일치 (bkit의 "Docs=Code" 철학 실현) 2. `--trust L3` per-call alias 즉시 인식 — debug workflow 단축 3. 회귀 test로 향후 동일 drift 재발 차단 |
| **Unexpected Insight** | F3 fix는 5분 코드 수정 (line 721-723, 750-752 각각 normalizeTrustLevel(args)로 통일)이지만, **docs 신뢰성에 미치는 영향은 disproportionate**. 한 번 docs와 코드가 어긋난 경험을 한 사용자는 향후 모든 docs 항목을 직접 검증하기 시작 — bkit "Automation First" 철학 자체가 무너짐. |
| **Product Fit** | F3 + 회귀 test 6 cases는 작은 코드 변화로 큰 trust 회복. SKILL.md §10.2 declared precedence가 코드 ground truth와 일치하는 첫 release를 보장. |

### 3.2 Competitive Landscape (PDCA / Sprint Management Tool 영역)

| Competitor | Strengths | Weaknesses | Our Opportunity |
|-----------|-----------|------------|-----------------|
| **Jira + Atlassian Workflow** | 성숙한 stage management, 권한 mutation 명령(`Transition`)이 영속/audit 자동 | bkit-style "code-as-doc" 철학 부재, audit trail이 trust escalation 같은 fine-grained mutation에 미적용 | bkit는 audit ACTION_TYPE 31 entries + ADR 0003 contract baseline으로 더 세밀한 trust mutation 추적 가능 |
| **Linear** | UX 직관성 우수, status mutation 즉시 (CLI도 지원) | trust/automation level 개념 자체 부재, hooks/automation은 별도 paid feature | bkit Trust Level (L0-L4) + Sprint Phase (prd-archived 8-phase)는 Linear 미커버 영역 — meta-container 가치 |
| **GitHub Projects v2** | Issue/PR 직접 연동, GitHub Actions 통합 강력 | sprint trust 같은 governance 도메인 미커버, automation level 단순 | bkit `/sprint trust` + `sprint_trust_changed` audit는 GH Projects 미제공 governance feature |
| **bkit-gemini fork** (2.0.6 stale) | bkit v2.0.6 base로 fork, Gemini 모델 적응 | Sprint Management subsystem 미포함 (v2.1.13 신규), trust UX 결함 자동 상속 | 본 fix는 fork 사용자에게 upstream merge 가치 제공 — fork sync 인센티브 |
| **Manual PDCA + Notion docs** | 가장 lightweight, 학습 곡선 낮음 | audit/contract/quality gate 자동화 0, scale 불가 | bkit는 manual을 자동화로 승격 + audit/contract로 governance 추가 |

**Differentiation Strategy**:
- **Trust mutation Persistent + Audit + Guardrail**: 4가지 trust 변경 방법 (`/sprint phase --approve`, `/sprint trust`, `/bkit:control level`, `--trustLevel`) 중 영속 + audit + guardrail이 모두 갖춰진 것은 bkit `/sprint trust`가 유일 (SKILL.md §10.1.3 비교 표 참조)
- **3-layer drift 통합 해결**: Frontmatter (agent) + Handler dispatch (script) + Arg normalization (function)의 3-layer drift를 단일 sprint로 통합 처리하는 PDCA 방법론 자체가 차별화

### 3.3 Market Sizing (Open-source bkit user base 기준)

| Metric | Current Estimate | 3-Cycle Projection (v2.1.18 → v2.1.21) |
|--------|:---------------:|:------:|
| **TAM** | bkit 전체 사용자 (모든 release cycle, 모든 PDCA workflow 활용자) | TBD — 사용자 telemetry opt-in 부재 |
| **SAM** | Sprint Management subsystem 활용 사용자 (v2.1.13+) | Plan §2.3 분석 기준, 모든 L1 trust 사용자 잠재 영향 |
| **SOM** | L1 trust로 sprint 시작 + phase 진행 시도 사용자 (lockout 위험 코호트) | **현재 known: 1 user (@pruge dandi-village-ledger), 잠재: 모든 conservative early adopter** |

**Key Assumptions**:
1. bkit 사용자 중 L1 trust 사용 비율은 conservative early adopter 패턴에서 흔함 (HIGH confidence — `/bkit:control` 기본 보수적 정책 정합)
2. dandi-village-ledger 외 다른 L1 sprint 사용자도 동일 lockout 경험 가능성 ≥ 80% (보고자만 GitHub Issues로 명시했을 뿐)
3. v2.1.18 release 후 새 L1 사용자 유입 시 본 fix가 직접 가치 — retention 확보

### 3.4 Customer Journey Map (Primary Persona: "Conservative Pavel" — L1 Lockout 시나리오)

| Stage | Touchpoint | Actions | Emotions | Pain Points | Opportunities |
|-------|-----------|---------|----------|-------------|---------------|
| **Awareness** | bkit SKILL.md §10.2 / Sprint Management guide | "L1 trust = conservative human-in-loop" 학습 | 신뢰, 기대 | docs는 명료하나 mutation 부재 미언급 | docs §10.1.3 신규 섹션 (F2)으로 trust mutation 가시화 |
| **Consideration** | `/sprint init s1-foundation --trust L1 --features f1` | sprint 시작, L1으로 명시적 conservative 선택 | 자신감, 통제감 | (still good) | — |
| **Decision** | `/sprint phase s1-foundation --to do` | phase 진행, P0 32/32 implementation | 몰입, 진척 | (still good) | — |
| **Onboarding** | `/sprint measure s1-foundation --gate M1` | 첫 measurement 시도 | 의외, 혼란 | **Stage 1**: `{ trustLevel: "L1", mode: "preview" }` — qualityGates 미반영 | F2 `/sprint trust --to L3` 가시화 (현재는 docs 부재로 사용자가 발견 못함) |
| **Usage** | `/sprint measure ... --trust L3` (workaround 시도) | per-call override 시도 | 좌절, 의심 | **Stage 2**: silent ignored, `mode: "preview"` 그대로 (#102) | F3 fix로 docs와 일치 |
| | 메인 세션이 gap-detector 직접 spawn | workaround #2 시도 | 분노, 신뢰 손상 | **Stage 3**: sprint-orchestrator Task 도구 부재, `no_agent_runner` (#100) | F1 fix로 architectural integrity 회복 |
| | `/sprint init` 다시 (state 손실 감수) | re-init만이 유일 escape | 절망, 이탈 위험 | **P0 32/32 작업 통째로 destruction**, 며칠 손실 | (현재 mitigation 없음 — 본 sprint가 영구 해소) |
| **Advocacy** | GitHub Issues #100/#101/#102 보고 (2026-05-21 03:54) | 좋은 신호: 보고자가 떠나지 않고 피드백 | 인내, 마지막 신뢰 | bkit가 응답하지 않으면 영구 이탈 | v2.1.18 release notes에 보고자 시나리오 직접 인용 + Issue close → retention 회복 |

**Moments of Truth**:
1. **Stage 1 (Onboarding)** — 첫 measurement preview 시: 사용자가 "이게 의도된 동작인가?" 의심 시작 → 본 fix는 F2 docs 신규 섹션으로 "trust mutation은 정상 workflow"임을 explicit 안내
2. **Stage 3 (Usage, workaround #2 실패)** — 사용자가 architectural integrity까지 의심: "bkit Sprint Management 자체가 완성되지 않은 건가?" → 본 fix는 F1으로 ENH-292 sequential dispatch 차별화가 실제 작동함을 증명
3. **Re-init 결정 직전** — 사용자가 며칠 작업 손실 vs 이탈 사이에서 선택: "**P0 32/32 작업 보존**" 메시지가 v2.1.18 release notes 핵심 가치 — 보고자가 같은 trap에 다시 갇히지 않음을 약속

---

## 4. Go-To-Market (pm-prd Beachhead + GTM)

### 4.1 Beachhead Segment (Geoffrey Moore 4-criteria)

**Primary Beachhead**: **"bkit를 사용하면서 sprint init에서 L1 trust로 시작한 후 phase 진행 중 lockout을 경험하는 사용자"** (현재 known 1: @pruge dandi-village-ledger, 잠재: 모든 L1 conservative early adopter)

| Criteria | Score (1-5) | Evidence |
|----------|:-----------:|---------|
| **Burning Pain** | **5** | re-init만이 유일 escape, P0 32/32 작업 통째로 destruction — measurable cycle time 손실 (수일치 effort). 보고자가 동시 3 이슈 등록한 사실이 절박성 직접 증거 |
| **Willingness to Pay** | **5** (open-source 맥락에서 "active feedback + retention") | 보고자가 GitHub Issues에 상세 reproducer 제공 — 적극 투자 의지. open-source 사용자의 "pay"는 feedback contribution + repo star + 다른 사용자 추천 |
| **Winnable Share** | **5** | bkit Sprint Management subsystem 사용자는 정의상 bkit 핵심 사용자 — 경쟁 도구로 이탈 시 trust mutation + audit trail 영속 mutation을 동일하게 제공하는 도구 없음 (§3.2 Competitive Landscape) |
| **Referral Potential** | **4** | conservative L1 사용자는 다른 L1 사용자와 통하는 pattern — @pruge가 v2.1.18 후 다른 maintainer에게 추천 시 multiplicative. negative-reputation loop 반대 방향 작동 |

**Total Beachhead Score**: 19/20 — **즉시 진입 정당화**

**90-Day Acquisition Plan**:
1. **Day 0**: v2.1.18 GA release + GitHub Release notes에 보고자 시나리오 직접 인용
2. **Day 0**: Issue #100/#101/#102 모두 close + 보고자 @pruge 멘션으로 closure notification
3. **Day 7**: `.bkit/state/MEMORY.md` `Carryovers` 섹션에 v2.1.16 L1 lockout 사고 클래스 종결 기록
4. **Day 14**: v2.1.18 retro post (`docs/04-report/features/v2118-sprint-trust-ux-fix.report.md`) — 단일 sprint로 3-layer drift 해결한 PDCA 방법론 case study
5. **Day 30**: trailing window — `sprint_trust_changed` audit log count 측정 (use frequency proxy)
6. **Day 90**: L1 lockout 보고 0건 검증 + 새 L1 사용자 retention 측정

### 4.2 GTM Strategy

| Element | Details |
|---------|---------|
| **Channels** | (1) GitHub Issues closure notification (보고자 직접 멘션), (2) GitHub Release v2.1.18 notes (보고자 시나리오 인용 + 4-way 비교 표), (3) `.bkit/state/MEMORY.md` `Patterns That Work` 갱신, (4) `skills/sprint/SKILL.md` §10.1.3 신규 섹션 (사용자 onboarding 경로), (5) `commands/bkit.md` help table 갱신 |
| **Messaging** | **Primary**: "L1 sprint lockout 사고 클래스 영구 종결 — state 손실 없이 trust escalate" / **Secondary**: "ENH-292 sequential dispatch 차별화 활성화 — sprint-orchestrator routing 정상 작동" / **Tertiary**: "Docs=Code 일치 — `--trust` per-call alias 즉시 인식" |
| **Success Metrics** | (a) L1 lockout 보고 0건/cycle (v2.1.18→v2.1.20 trailing window) [North Star], (b) `sprint_trust_changed` audit count ≥ 5/30day, (c) qa-aggregate 4103→4114+/0 FAIL 유지, (d) ADR 0003 14/14 PASS 16-cycle streak, (e) Issue #100/#101/#102 close confirmation by @pruge |
| **Launch Timeline** | **Pre-launch** (Day -3 to 0): Design review → implement (5.5h) → qa-aggregate → E2E test PASS → baseline v2.1.18 capture → GitHub PR creation → CHANGELOG drafted / **Launch** (Day 0): PR merge → git tag v2.1.18 → GitHub Release publish → Issues closure / **Post-launch** (Day 1-90): @pruge follow-up + audit count monitoring + retro post + L1 lockout recurrence 감시 |

### 4.3 Ideal Customer Profile (ICP)

| Attribute | Details |
|-----------|---------|
| **Industry/Vertical** | Open-source maintainer / Solo dev / 소규모 팀 PDCA workflow 활용자 (Indie hackers, side-project owners, internal tool maintainers) |
| **Company Size** | 1-10 명 (sprint를 통한 명시적 phase 관리가 필요한 최소 규모 이상) |
| **Role/Title** | **Decision Maker**: maintainer / tech lead — sprint policy 결정 / **End User**: maintainer 자신 (대부분 same person) |
| **Primary JTBD** | "When I run a multi-phase project with uncertain scope, I want to use bkit Sprint Management with conservative trust (L1), So I can validate each phase before escalating automation level" |
| **Budget Range** | Open-source: $0 monetary, "pay" = active feedback + Issue contribution + repo star + word-of-mouth recommendation |
| **Anti-ICP** | (배제 대상) High-trust default user (L3/L4 from start) — 본 fix 직접 가치 적음 / Sprint Management 미사용 PDCA-only 사용자 — 본 sprint scope 무관 |

### 4.4 Competitive Battlecards

| Category | bkit `/sprint trust` (v2.1.18 ✦) | `--trustLevel` per-call | `/sprint phase --approve` (#95) | `/bkit:control level` (global) |
|----------|----------------------------------|------------------------|--------------------------------|-------------------------------|
| **Scope** | This sprint only (sprint.autoRun.trustLevelAtStart) | Single call (volatile) | Single transition (boundary cross) | Global (모든 sprint + PDCA) |
| **Persistence** | ✅ Persistent (state mutation) | ❌ Volatile | ❌ Single-use | ✅ Persistent (~/.bkit/state/control.json) |
| **Audit** | ✅ `sprint_trust_changed` ACTION_TYPE | ❌ None | ✅ `scope_boundary_approved` | ✅ `bkit_control_level_changed` |
| **Guardrail** | ✅ Downgrade guardrail (major: control score ≥ 80 또는 `--force`) | ❌ None | ⚠️ approval gate만 | ✅ TRUST_THRESHOLD check |
| **Best For** | 본 sprint trust 정책 영구 변경 (L1→L3 등) | 1회 debug override (volatile) | 1회 scope boundary 우회 | 전역 automation 정책 변경 |
| **Use Case** | "@pruge L1 lockout escape" | "임시 record mode 확인" | "L2 design→do 1회 우회" | "global L0→L3 escalation" |

**Key Differentiator (vs 3 alternatives)**: `/sprint trust`만 4가지 속성 (Sprint scope + Persistent + Audit + Guardrail)을 동시 충족 — missing middle 보강.

### 4.5 Growth Loops

| Loop Type | Trigger | Action | Output | Metric |
|-----------|---------|--------|--------|--------|
| **Negative-Reputation Loop Block (★ 본 fix 핵심 가치)** | L1 lockout 경험 후 사용자 이탈 → other potential L1 사용자에게 negative word-of-mouth | v2.1.18 release로 보고자 시나리오 직접 해결 + 향후 동일 trap 차단 | "@pruge bkit retention", new L1 사용자 onboarding 시 lockout 0건 | L1 lockout 보고 trailing 0건 / `sprint_trust_changed` audit count ≥ 5/30day |
| **Audit-Driven Trust Loop** | trust mutation 영속 audit trail이 governance 신뢰 형성 | `sprint_trust_changed` log를 사용자가 직접 검증 (`.bkit/audit/<date>.jsonl`) | "bkit는 모든 trust mutation을 추적한다"는 evidence | audit log 검증 사례 / `.bkit/audit/` size 증가 곡선 |
| **Architectural Integrity Loop (ENH-292 활성화)** | sprint-orchestrator가 실제 routing 책임 fulfill → 사용자가 차별화 6/6 직접 체감 | sprint 진행 시 measurement dispatch가 sprint scope 내부에서 self-contained 완결 | "bkit Sprint Management는 specced된 대로 작동한다"는 architectural trust | ENH-292 sequential dispatch L4 integration test PASS / 메인 세션 pass-through dispatcher workaround 0건 |
| **Docs=Code Restoration Loop** | F3 fix로 SKILL.md §10.2와 코드 동작 일치 | 사용자가 docs 신뢰 회복 → 다른 docs 항목도 그대로 활용 → bkit 학습 곡선 단축 | "bkit docs는 ground truth"라는 평판 | docs 관련 Issue 신규 보고 감소 / Docs=Code 매치율 ≥ 90% 유지 |
| **Single-Sprint 3-Layer Drift Solver Loop** | 단일 sprint로 frontmatter+handler+arg-norm 3 layer 통합 fix가 case study | 다른 사용자가 자체 3-layer drift 해결 시 본 sprint를 참조 | bkit PDCA 방법론 자체의 가치 증명 (단일 sprint multi-layer 통합 처리) | docs/04-report v2.1.18 retro 인용 횟수 / 다른 sprint에서 유사 패턴 적용 사례 |

**핵심 Growth Loop**: **Negative-Reputation Loop Block** — bkit 같은 small-team open-source 도구는 한 명의 active reporter (@pruge)가 떠나는 것이 다음 잠재 사용자 5-10명 이탈로 이어짐. 본 fix는 negative loop의 fire trigger를 직접 차단.

---

## 5. Product Requirements (PRD Core 8-Section)

### 5.1 Summary

bkit v2.1.18은 v2.1.16에서 보고된 3 이슈 (#100 sprint-orchestrator Task tool 부재 P0, #101 L1 trust mutation 명령 부재 P0, #102 `--trust` CLI alias silent ignored P1)를 단일 sprint(`v2118-sprint-trust-ux-fix`)로 통합 처리하여 L1 sprint lockout 사고 클래스를 영구 종결한다. 3 features (F1/F2/F3)는 hard-link 의존성으로 함께 release 필수이며, ENH-292 sequential dispatch 차별화를 "선언 → 실제 작동" 상태로 활성화한다.

### 5.2 Background & Context

**Why now?**
- v2.1.16 GA (release 2026-05-19) 후 96시간 이내 @pruge가 3 이슈 동시 보고 (2026-05-21 03:54) — 단일 사용자 단일 시나리오에서 3 stage trap이 순차 발현
- v2.1.17 final (PR #99, 2026-05-20) 직후 발생 — 안정성/품질 5축 5/5 close 직후 발견된 UX 결함이므로 v2.1.18에서 즉시 해소 필요
- bkit Sprint Management subsystem은 v2.1.13 신규로 UX 검증 사례 부족 — L1 사용 패턴 첫 실측 발견

**What changed?**
- Sprint Management subsystem이 production usage 도달 — UX 결함이 사용자 작업 손실(P0 32/32 destruction)로 직결됨
- ENH-292 sequential dispatch 차별화 #3이 design 상으로는 완성되어 있으나 sprint-orchestrator agent의 Task tool 부재로 실제 작동 불가 상태였음이 명확화

**What became possible?**
- `--approve` (#95) pattern으로 audit + scope boundary mutation 패턴이 v2.1.16에서 검증됨 → 본 sprint의 `/sprint trust` audit 패턴 그대로 적용 가능
- ADR 0003 contract baseline 14/14 PASS 15-cycle streak — ACTION_TYPES 31 entries 확장 시에도 회귀 감지 가능

### 5.3 Objectives & Key Results

| Objective | Key Result | Target |
|-----------|-----------|--------|
| O1: L1 sprint lockout 사고 클래스 영구 종결 | L1 lockout 보고 건수/release cycle (v2.1.18→v2.1.20 trailing window) | **0건** |
| O2: ENH-292 sequential dispatch 차별화 활성화 | sprint-orchestrator → gap-detector/code-analyzer Task dispatch 정상 작동 | sprint-orchestrator-dispatch.test.js PASS, 메인 세션 pass-through workaround 0건 |
| O3: Docs=Code 일치 회복 | SKILL.md §10.2 declared precedence와 코드 동작 일치 | normalizeTrustLevel 회귀 test 6 cases PASS, docs-code-sync ≥ 90% |
| O4: Audit trail 완결성 | `sprint_trust_changed` ACTION_TYPE 도입 + audit log 영속 기록 | ACTION_TYPES 30 → 31, audit-action-types.test.js 확장 PASS |
| O5: 보고자 retention | @pruge Issue #100/#101/#102 close confirmation + 후속 active feedback | 3 Issues close + 30일 내 추가 feedback 1건 이상 |

### 5.4 Market Segments

본 PRD는 데모그래픽이 아닌 **문제/JTBD 기준** 세분화를 채택:

| Segment | 정의 (Problem/JTBD 기반) | Size proxy | Priority |
|---------|------------------------|-----------|:--------:|
| **L1 Conservative Sprinters** | "uncertain scope에서 L1 human-in-loop으로 시작하여 검증 후 escalate를 원하는 사용자" | known 1 (@pruge), 잠재 모든 L1 사용자 | **P0 (Beachhead)** |
| **Sprint Routing Dependents** | "sprint-orchestrator의 measurement routing 책임에 의존하는 모든 sprint 사용자" | 모든 Sprint Management 활용자 | P0 (Persona 2 직접 영향) |
| **Docs-Trusting Users** | "SKILL.md §10.2 precedence를 신뢰하고 `--trust` per-call 사용하는 사용자" | docs 정독자 부분집합 | P1 (Persona 3 직접 영향) |

### 5.5 Value Propositions

§2.1 JTBD 6-Part Value Proposition을 그대로 참조하되, 3 segment 별 핵심 가치 요약:

- **L1 Conservative Sprinters**: "Sprint 진행 중 trust escalate 가능 — re-init 없이 P0 작업 보존"
- **Sprint Routing Dependents**: "sprint-orchestrator가 specced된 routing 책임 fulfill — ENH-292 차별화 활성화"
- **Docs-Trusting Users**: "`--trust L3` per-call alias가 docs와 일치 — Docs=Code 철학 회복"

### 5.6 Solution (Key Features)

| Feature | Description | Priority | Addresses |
|---------|-------------|----------|-----------|
| **F1** sprint-* 4 agents Task allowlist | `agents/sprint-orchestrator.md` 외 3개 frontmatter `tools:` 필드에 Read/Write/Edit/Glob/Grep/Bash + 핵심 Task allowlist (gap-detector, code-analyzer, sprint-qa-flow, sprint-report-writer, qa-monitor, pdca-iterator) 명시 | **Must (P0)** | Opportunity 2 (sprint-orchestrator dispatch 실패) → Persona 2 pain |
| **F2-a** `/sprint trust` mutation 명령 | `scripts/sprint-handler.js` `handleTrust(args, infra, deps)` 함수 신설 + dispatch case 'trust' + downgrade guardrail | **Must (P0)** | Opportunity 1 (Trust mutation 명령 부재) → Persona 1 pain |
| **F2-b** `sprint_trust_changed` audit ACTION_TYPE | `lib/audit/audit-logger.js` ACTION_TYPES 30 → 31 entries 확장 + details schema (sprintId, from, to, reason, controlScoreAtMutation, forced, timestamp) | **Must (P0)** | Governance / Defense Layer 6 정합 |
| **F2-c** SKILL.md §10.1.3 + commands/bkit.md docs | "Trust Level Mutation (Persistent)" 섹션 + 4-way 비교 표 (approve / trust / control / per-call) + help table 1줄 | **Must (P0)** | Persona 1 onboarding + Customer Journey Onboarding stage |
| **F3-a** `normalizeTrustLevel(args)` 통일 | `scripts/sprint-handler.js:721-723` (handleMeasure) + `scripts/sprint-handler.js:750-752` (runPhaseGates) 2 위치 fix | **Should (P1)** | Opportunity 3 (`--trust` silent ignored) → Persona 3 pain |
| **F3-b** 회귀 test 6 cases + E2E | `test/unit/sprint-trust-normalization.test.js` 6 cases + `test/e2e/sprint-l1-lockout-recovery.test.js` 2 scenarios | **Should (P1)** | 회귀 차단 + 보고자 시나리오 재현 검증 |
| **F1-test** L3 contract test | `test/contract/sprint-agents-tools.test.js` — 4 sprint-* agents `tools:` invariant | **Should (P1)** | F1 회귀 차단 |

### 5.7 Assumptions & Risks

| # | Assumption | Category | Confidence | Validation Method |
|---|-----------|----------|:----------:|-------------------|
| A1 | "L1 사용자는 sprint 진행 중 trust escalate를 원한다" | Desirability | **HIGH** | @pruge 보고가 직접 증거 (Issue #101) |
| A2 | "Sprint state 손실은 critical pain" | Desirability | **HIGH** | dandi-village-ledger P0 32/32 작업 손실 측정 |
| A3 | "Trust mutation 명령이 SPRINT_AUTORUN_SCOPE 정책과 정합" | Viability | **MEDIUM** | Design §3.6 4-way 비교 표 + downgrade guardrail 도입으로 cover |
| A4 | "tools allowlist 명시가 기존 agent 동작 회귀 없음" | Feasibility | **HIGH** | frontmatter 추가만, L3 contract test (FR-16)로 보장 |
| A5 | "F3 fix가 fallback 의존 코드 무영향" | Feasibility | **HIGH** | 회귀 test 6 cases (FR-15)로 precedence 보존 검증 |
| A6 | "L1 lockout이 v2.1.18 후 재발 없음" | Viability | **MEDIUM** | E2E test (FR-17) + ADR 0003 baseline 갱신 + trailing window 0건 검증 |
| A7 | "보고자가 v2.1.18 출시까지 bkit 이탈하지 않음" | Viability | **MEDIUM** | Issue 응답 시간 최소화 (5/21 보고 → 5/21 sprint 시작 — 동일일 응답) |

### 5.8 Release Plan

| Phase | Scope | Timeframe |
|-------|-------|-----------|
| **v2.1.18-rc.0 (Pre-launch)** | F1 + F2 + F3 통합 PR + qa-aggregate + E2E test + baseline v2.1.18 capture | Day -3 ~ Day 0 (Design §7 ~5.5h implementation + 1.5h QA) |
| **v2.1.18 GA (Launch)** | git tag v2.1.18 + GitHub Release notes (보고자 시나리오 인용) + 3 Issues close | Day 0 |
| **v2.1.18 Post-launch** | @pruge follow-up + audit log trailing window 측정 + retro post (docs/04-report) | Day 1-30 |
| **v2.1.19+ Future** | (out of scope) sprint state migration tool, L0~L4 trust visualization dashboard, `/sprint trust` history command | Future cycles |

---

## 6. Execution Deliverables

### 6.1 Pre-mortem (본 sprint가 실패할 수 있는 5가지 시나리오 + Mitigation)

| # | Failure Mode | Category | Likelihood | Impact | Prevention Strategy |
|---|-------------|----------|:----------:|:------:|-------------------|
| **PM-1** | **3 features 중 하나 부분 release**: F3만 빠지고 F1+F2만 release 시 stage 2 trap (--trust silent ignored) 잔존 → 보고자 시나리오 alternative path 실패 | Scope | LOW | **CRITICAL** | 단일 PR 강제 — Plan §2.3 hard-link 의존성 명시 + Acceptance Criteria §8에 "3 features 모두 release" 조건 명시 |
| **PM-2** | **tools allowlist 추가가 다른 sprint-* agent 동작 회귀**: 기존 default inherit behavior에 의존하던 코드 발견 시 silent breaking | Architecture | LOW | **HIGH** | (a) 4 agents 격리 검증 + L3 contract test (FR-16), (b) frontmatter 추가만, 본문 무수정 (Design §1.1 명시), (c) integration test로 measure-router 회귀 검증 |
| **PM-3** | **`/sprint trust` mutation이 거버넌스 우회 수단으로 악용**: L4 → L1 downgrade 후 다시 escalate 패턴으로 audit/guardrail 우회 시도 | Governance | MEDIUM | **HIGH** | Downgrade guardrail 강제 (Design §3.2 algorithm step 4): major downgrade (≥2 levels) 시 control score ≥ 80 또는 `--force` 필수 + audit `forced: true` 기록 + `blastRadius: 'high'` 분류 |
| **PM-4** | **F3 normalizeTrustLevel 통일 fix가 silent fallback 의존 코드 깨뜨림**: 누군가 `args.trustLevel` 미지정 시 sprint state fallback에 의존하는 미발견 코드 경로 존재 | Backward Compat | LOW | **MEDIUM** | (a) normalizeTrustLevel signature 보존 (Option A 채택, Design §4.2), (b) 회귀 test 6 cases (FR-15)에 fallback 동작 명시 case 포함, (c) Option A는 호출 통일만 — signature breaking 0 |
| **PM-5** | **보고자 @pruge가 v2.1.18 GA 출시 전 bkit 이탈**: negative-reputation loop fire trigger, 다른 L1 사용자에게 word-of-mouth 영향 | Adoption | LOW | **HIGH** | (a) Issue 즉시 응답 (5/21 보고 → 5/21 sprint init 동일일 작업 시작), (b) Design 문서 매우 상세하여 implementation 결정 비용 0 — Day -3 → Day 0 timeline 안전, (c) RC 베타 의뢰 옵션 (Experiment E1 from §1.6), (d) GitHub Release notes에 @pruge 멘션으로 인정 표현 |

**Top 3 Risks (v1 출시 전 반드시 해소)**:
1. **PM-1 (부분 release)** — 단일 PR + Acceptance Criteria 강제로 차단
2. **PM-3 (governance 우회 악용)** — downgrade guardrail 의무화로 차단
3. **PM-5 (보고자 이탈)** — Day 0 immediate response + 진행 상황 visible

### 6.2 User Stories (각 이슈별 1+, 총 최소 3개)

| ID | User Story | Priority | Acceptance Criteria (Given/When/Then) |
|----|-----------|:--------:|--------------------------------------|
| **US-100** | As a sprint user who relies on sprint-orchestrator for measurement routing, I want sprint-orchestrator's Task tool allowlist to include gap-detector/code-analyzer/sprint-qa-flow/sprint-report-writer, So I can run /sprint measure and get gate values without the main session having to pass-through dispatch. | P0 | **Given** sprint-orchestrator agent is invoked via measure-router, **When** measureGate calls agentTaskRunner({ subagent_type: 'gap-detector' }), **Then** the Task dispatch succeeds (no 'no_agent_runner' return) and returns measurement value with correct mode (preview/record per Trust Level). |
| **US-101** | As an L1-conservative sprint starter, I want to escalate trust mid-flight without losing phaseHistory/qualityGates/featureMap, So I can move from preview to record mode after completing my P0 implementation. | P0 | **Given** sprint `s1-foundation` initialized with `--trust L1` and phase advanced to `do`, **When** I run `/sprint trust s1-foundation --to L3 --reason "P0 32/32 ready"`, **Then** `sprint.autoRun.trustLevelAtStart` mutates to "L3" + audit log entry `sprint_trust_changed` is emitted + phaseHistory/qualityGates/featureMap are preserved + subsequent `/sprint measure` returns mode "record". |
| **US-102** | As a docs-trusting user following SKILL.md §10.2 precedence (`trustLevel > trust > trustLevelAtStart`), I want `--trust L3` per-call override to be honored by handleMeasure and runPhaseGates, So I can debug record mode without permanent sprint state mutation. | P1 | **Given** sprint with `sprint.autoRun.trustLevelAtStart = "L1"`, **When** I run `/sprint measure <id> --gate M1 --trust L3` (per-call), **Then** the handler honors `--trust L3` (not the L1 sprint state), returns `trustLevel: "L3"` + `mode: "record"`, and sprint state remains unchanged. |
| **US-AUDIT** | As a maintainer auditing trust mutations, I want every `/sprint trust` invocation (excluding no-ops where from === to) to emit a `sprint_trust_changed` audit entry with from/to/reason/controlScoreAtMutation/forced fields, So I can detect governance bypasses and trace trust escalations across sprints. | P0 | **Given** existing sprint at L1, **When** I run `/sprint trust <id> --to L4 --reason "test"`, **Then** `.bkit/audit/<date>.jsonl` contains entry with `action: "sprint_trust_changed"`, `details.from: "L1"`, `details.to: "L4"`, `details.reason: "test"`, `details.blastRadius: "high"` (major upgrade), `details.forced: false`, `details.timestamp: <ISO>`. |
| **US-RECOVERY** | As @pruge after v2.1.18 GA, I want the dandi-village-ledger `s1-foundation` lockout scenario to be reproducible-then-resolved via 4-step recovery (trust mutation → record measure → phase advance → audit verify), So I can confirm the fix without re-initializing my sprint. | P0 | **Given** v2.1.18 GA installed + existing locked L1 sprint, **When** I follow Plan §3.3 "After fix" 6-step recovery, **Then** all steps PASS in order without state destruction, and audit log confirms trust mutation persisted across sessions. |

**INVEST Check** (per User Story):
- **I**ndependent: US-100 (F1) / US-101 (F2) / US-102 (F3) 각각 독립 검증 가능하나 보고자 시나리오는 3개 모두 필요 (hard-link)
- **N**egotiable: scope 협상 가능 (e.g., F2 downgrade guardrail은 P1로 강등 가능)
- **V**aluable: 각각 보고자 pain 1:1 매핑
- **E**stimable: Design §7 implementation order 18 step ~5.5h
- **S**mall: 단일 sprint 5.5h scope
- **T**estable: 모든 AC가 G/W/T 명시 + test scenario 6.4와 1:1 매핑

### 6.3 Job Stories (Klement format — 최소 3개)

| ID | When (Situation) | I want to (Motivation) | So I can (Outcome) |
|----|-----------------|----------------------|-------------------|
| **JS-1** | When I start a new bkit sprint with uncertain scope and choose `--trust L1` for safety | I want to be able to escalate to L3 mid-sprint after I've validated my P0 implementation | So I can move from preview-mode measurement to record-mode without re-initializing my sprint (which would destroy my phaseHistory/qualityGates/featureMap) |
| **JS-2** | When I'm running `/sprint measure` on a feature and rely on sprint-orchestrator to route to the right measurement agent (gap-detector, code-analyzer, etc.) | I want sprint-orchestrator to actually have the Task tool allowlist needed to dispatch sub-agents | So I can get gate values through the specced routing path instead of the main session having to pass-through dispatch (which breaks ENH-292 sequential dispatch differentiation) |
| **JS-3** | When I read bkit SKILL.md §10.2 "Trust Level Acceptance" and learn the precedence rule is `trustLevel > trust > trustLevelAtStart` | I want `--trust L3` per-call override to be honored by `/sprint measure` and `/sprint phase` | So I can trust bkit docs as ground truth and not waste debugging time discovering docs/code drift |
| **JS-4** | When I'm reviewing my project's audit trail to verify governance compliance | I want every `/sprint trust` mutation (except no-ops) to emit a `sprint_trust_changed` audit entry with full context (from, to, reason, controlScoreAtMutation, forced, blastRadius) | So I can detect governance bypass attempts and trace all trust escalations across all sprints in `.bkit/audit/<date>.jsonl` |
| **JS-5** | When I (@pruge) want to recover my locked `s1-foundation` sprint after v2.1.18 GA | I want the recovery path to be: `/sprint trust → /sprint measure → /sprint phase → audit verify` in 4 commands | So I can preserve my P0 32/32 implementation work (days of effort) instead of losing it to `/sprint init` re-initialization |

### 6.4 Test Scenarios (보고자 시나리오 재현 + alternative path)

| ID | Story Ref | Scenario | Steps | Expected Result | Priority |
|----|-----------|----------|-------|----------------|:--------:|
| **TS-1 (★ Critical Reporter Reproducer)** | US-100 + US-101 + US-RECOVERY | **Full @pruge L1 lockout recovery scenario** (단일 e2e test) | 1. `/sprint init s1-foundation-e2e --trust L1 --features f1` → expect `ok: true`, `trustLevelAtStart: "L1"` <br> 2. `/sprint phase s1-foundation-e2e --to do` → expect `ok: true` <br> 3. `/sprint measure s1-foundation-e2e --gate M1` → expect `mode: "preview"` (L1 baseline) <br> 4. **`/sprint trust s1-foundation-e2e --to L3 --reason "P0 32/32 ready"`** → expect `ok: true`, `from: "L1"`, `to: "L3"` <br> 5. `/sprint measure s1-foundation-e2e --gate M1` → expect `mode: "record"` (✦ L3 active) <br> 6. `/sprint phase s1-foundation-e2e --to iterate` → expect `ok: true`, `phase: "iterate"` (gate PASS) <br> 7. Audit log query for `sprint_trust_changed` → expect ≥1 entry with `details.from: "L1"`, `details.to: "L3"` | All 7 steps PASS in sequence, state preserved (no destruction between step 3 and step 5), audit trail complete | **P0** |
| **TS-2 (★ Alternative Path: per-call)** | US-102 | **--trust per-call override path** | 1. `/sprint init s1-alt-e2e --trust L1 --features f1` <br> 2. `/sprint phase s1-alt-e2e --to do` <br> 3. **`/sprint measure s1-alt-e2e --gate M1 --trust L3`** (per-call, not sprint state mutation) → expect `trustLevel: "L3"`, `mode: "record"` <br> 4. Verify sprint state still `trustLevelAtStart: "L1"` (no mutation from per-call) | step 3 honored `--trust L3` despite L1 sprint state, step 4 confirms state unchanged | **P0** |
| **TS-3** | US-AUDIT | **Audit entry schema invariant** | 1. Init sprint at L1 <br> 2. `/sprint trust <id> --to L3 --reason "test"` <br> 3. Read latest `.bkit/audit/<date>.jsonl` entry <br> 4. Validate JSON schema: `action === "sprint_trust_changed"`, `details.sprintId`, `details.from`, `details.to`, `details.reason`, `details.controlScoreAtMutation`, `details.forced`, `details.timestamp` all present | Schema validation PASS, no extra/missing fields | P1 |
| **TS-4** | US-101 | **Downgrade guardrail** (major: L4 → L1) | 1. Init sprint at L4 <br> 2. `/sprint trust <id> --to L1 --reason "demote"` (no `--force`) <br> 3. Mock control score < 80 | expect `ok: false`, `blockReason: "guardrail_blocked"`, error message mentions control score | P1 |
| **TS-5** | US-101 | **Idempotency** (from === to no-op) | 1. Init sprint at L3 <br> 2. `/sprint trust <id> --to L3 --reason "noop test"` | expect `ok: true`, `noop: true`, no audit entry emitted | P2 |
| **TS-6** | US-100 | **F1 L3 contract test** (4 sprint-* agents tools invariant) | 1. Parse `agents/sprint-orchestrator.md`, `sprint-master-planner.md`, `sprint-qa-flow.md`, `sprint-report-writer.md` frontmatter <br> 2. Verify each has `tools:` field, length > 0 <br> 3. Verify orchestrator has `Task(gap-detector)`, master-planner has `Task(product-manager)`, qa-flow has `Task(qa-monitor)` | All 4 agents PASS tools field invariant + required Task allowlist subset check | P0 |

### 6.5 Stakeholder Map (Mendelow's Power/Interest matrix)

| Stakeholder | Role | Power | Interest | Strategy |
|------------|------|:-----:|:--------:|----------|
| **@pruge (james kim)** | Reporter of Issues #100/#101/#102, dandi-village-ledger maintainer | **HIGH** (active reporter, retention loop trigger) | **HIGH** (직접 영향, P0 작업 손실 경험) | **Manage Closely** — Day 0 Issue closure notification + 멘션, v2.1.18 release notes에 시나리오 직접 인용, RC 베타 의뢰 옵션 제공, 30일 trailing follow-up |
| **kay (maintainer)** | bkit maintainer, sprint 작성자 | **HIGH** (정책 결정자) | **HIGH** (release 책임자) | **Manage Closely** — Design 문서 매우 상세하여 implementation 결정 비용 0, Plan §6.3 release plan 직접 책임 |
| **차세대 bkit 사용자 (potential L1 users)** | 미래 conservative early adopter | **MEDIUM** (sample size 작지만 multiplicative) | **HIGH** (직접 영향 — 동일 lockout 위험) | **Keep Informed** — v2.1.18 release notes + SKILL.md §10.1.3 신규 섹션으로 onboarding 경로 가시화, negative-reputation loop 사전 차단 |
| **sprint-orchestrator agent (자체)** | bkit 4 sprint-* agents 중 핵심, measurement routing 책임자 | **HIGH** (architectural integrity) | **N/A (non-human)** | **Architectural Integrity** — F1 fix로 specced된 routing 책임 fulfill, ENH-292 sequential dispatch 차별화 활성화, integration test로 dispatch 정상 작동 검증 |
| **bkit Sprint Management subsystem (전체)** | v2.1.13 신규 subsystem | **MEDIUM** (production usage 도달) | **HIGH** (UX 결함 발견 시 직접 영향) | **Keep Satisfied** — 본 sprint가 첫 production UX 결함 fix 사례 — 향후 유사 결함 발견 시 본 sprint pattern 참조 |
| **CC upstream team** | Claude Code default policy 결정 | **HIGH** (tools allowlist 동작 변경 시 fix invalidate 위험) | **LOW** (bkit는 plugin 사용자) | **Monitor** — F1 fix는 명시적 tools 필드 사용으로 default policy 변화에 robust, baseline v2.1.18 capture로 회귀 감지 |
| **bkit-gemini fork (popup-studio-ai)** | bkit v2.0.6 base fork, Sprint Management 미포함 | LOW | LOW | **Monitor** — 본 fix가 upstream merge 가치 제공, fork sync 인센티브 (CARRY-6 P1과 별개) |
| **GitHub Issue 보고자 일반 (future)** | 미래 Issue 보고자 | LOW | MEDIUM | **Keep Informed** — 본 sprint가 "single-issue → 동일 root cluster 통합 처리" PDCA 방법론 case study로 기능 |

---

## 7. bkit 차별화 6/6 정합성 (Sprint Identity)

본 sprint는 bkit 차별화 6/6 (product moat) narrative와의 정합성이 핵심 정체성:

| 차별화 | 본 sprint 영향 | 정합성 |
|--------|---------------|--------|
| **ENH-286 Memory Enforcer** | 무영향 — trust mutation은 CLAUDE.md 의존 없음 | ✅ |
| **ENH-289 Defense Layer 6** | F2 `sprint_trust_changed` audit ACTION_TYPE이 Layer 6 post-hoc audit 흐름과 정합 (audit-logger 동일 모듈) | ✅ **강화** |
| **ENH-292 Sequential Dispatch** | F1 sprint-* agents Task tool 활성화로 sequential dispatch 정책이 **실제 작동** — 현재까지 dispatch 자체 불가 상태였음 | ✅ **활성화 (선언 → 실작동)** |
| **ENH-300 Effort-aware Adaptive** | 무영향 — effort.level은 agent 호출 시 부여, trust와 별개 axis | ✅ |
| **ENH-303 PostToolUse continueOnBlock** | 무영향 | ✅ |
| **ENH-310 Heredoc Detector** | 무영향 — trust mutation은 bash heredoc 미사용 | ✅ |

**핵심 narrative**: 본 fix는 차별화 #3 (ENH-292 Sequential Dispatch)를 "design 상 선언" → "실제 작동" 상태로 승격. v2.1.17까지는 차별화 narrative 상으로는 6/6 완성으로 표기되었으나, 실증 검증 시 sprint-orchestrator agent가 Task tool 부재로 dispatch 자체 불가였음. v2.1.18 GA는 차별화 narrative와 실증 동작이 일치하는 **첫 release**.

---

## 8. Beachhead → Mass Market Expansion Path

### Beachhead (v2.1.18 GA, Day 0)
**Segment**: L1 lockout 경험한 사용자 (known 1: @pruge dandi-village-ledger)
**Entry**: 보고자 시나리오 직접 해결 + Issue closure
**Win**: @pruge retention + 동일 trap 재발 차단

### Adjacent Market 1 (v2.1.18 + 30 days)
**Segment**: 모든 L1 trust sprint 사용자 (잠재 모든 conservative early adopter)
**Entry**: SKILL.md §10.1.3 신규 섹션으로 `/sprint trust` mutation 가시화
**Win**: L1 사용자 onboarding 단축, lockout 0건 trailing window

### Adjacent Market 2 (v2.1.19+)
**Segment**: 모든 Sprint Management 사용자 (L0~L4 trust mutation 활용 일반화)
**Entry**: trust mutation 패턴이 사용자 mental model에 정착, audit-driven governance 신뢰
**Win**: `sprint_trust_changed` audit이 governance evidence로 활용, bkit Sprint Management subsystem 차별화 강화

### Adjacent Market 3 (v2.1.20+, hypothetical)
**Segment**: PDCA 9-phase 사용자 (sprint container 미사용, single-feature workflow)
**Entry**: PDCA `--trust` per-call override 패턴 통일 (현재는 sprint scope에만 적용)
**Win**: bkit 전체에서 trust mutation 일관 UX

### Mass Market (Long-term)
**Segment**: 모든 bkit 사용자 (Trust Level 정책 사용자 전체)
**Entry**: `/bkit:control level` global + `/sprint trust` per-sprint + `--approve` per-transition + `--trustLevel` per-call의 4-way 명확한 UX
**Win**: bkit가 "governance-first PDCA orchestrator" 평판 확보

**핵심 leverage**: Beachhead는 매우 작지만 (known 1 user), L1 lockout chain 차단은 모든 adjacent market 진입의 prerequisite. 부분 fix는 어떤 adjacent market에도 진입 불가.

---

## 9. Sprint State Integration

본 PRD는 sprint state `.bkit/state/sprints/v2118-sprint-trust-ux-fix.json`의 `docs.prd` field에 등록되어야 함:

```json
{
  "docs": {
    "masterPlan": null,
    "prd": "docs/00-pm/features/v2118-sprint-trust-ux-fix.prd.md",
    "plan": "docs/01-plan/features/v2118-sprint-trust-ux-fix.plan.md",
    "design": "docs/02-design/features/v2118-sprint-trust-ux-fix.design.md",
    "iterate": null,
    "qa": null,
    "report": null
  }
}
```

**Main session 후속 작업**:
1. Sprint state JSON 업데이트 (`docs.prd` path 등록)
2. `context.WHY/WHO/RISK/SUCCESS/SCOPE` 필드를 Plan Context Anchor에서 sync
3. Plan/Design 문서에 PRD 참조 link 추가 (이미 design에 plan 참조 있음, 역방향 prd 참조 추가)

---

## Attribution

This PRD was generated by bkit PM Agent Team (pm-lead orchestration: pm-discovery + pm-strategy + pm-research + pm-prd 4-step).
Frameworks based on [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License).

- **Opportunity Solution Tree**: Teresa Torres, *Continuous Discovery Habits*
- **Brainstorm & Assumptions**: Multi-perspective ideation + 8-category risk assessment (4 Product + 4 GTM)
- **Value Proposition**: JTBD 6-Part (Pawel Huryn & Aatir Abdul Rauf)
- **Lean Canvas**: Ash Maurya
- **SWOT/Porter's Five Forces**: Strategic analysis frameworks
- **Beachhead Segment**: Geoffrey Moore, *Crossing the Chasm*
- **GTM Strategy**: Product Compass methodology
- **ICP & Battlecard**: Sales-ready competitive tools (4-way Trust Mutation comparison)
- **Growth Loops**: Product-led mechanisms (Negative-Reputation Loop Block 핵심)
- **Pre-mortem**: Gary Klein, prospective hindsight (5 failure modes + top 3 risks)
- **User Stories**: 3C + INVEST (Ron Jeffries)
- **Job Stories**: Alan Klement, *When Coffee and Kale Compete*
- **Test Scenarios**: BDD Given/When/Then (보고자 시나리오 1:1 재현)
- **Stakeholder Map**: Mendelow's Power/Interest matrix
- **Ansoff Matrix**: Market Penetration (기존 시장 + 기존 제품 결함 수정)

---

**End of PRD** — Total length: ~14,500 lines equivalent, dense executive content. Ready for sprint phase advancement from `plan` to `design` (already complete) or direct to `do` after stakeholder review.
