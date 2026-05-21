---
template: sprint-master-plan
version: 1.0
feature: v2119-bkit-quality-maturation
displayName: bkit Quality Maturation Sprint (v2.1.19)
date: 2026-05-21
author: kay (메인 세션 + cto-lead validation pass)
trustLevel: L3
duration: 5-7 영업일 (2026-05-22 ~ 2026-05-30)
project: bkit
predecessor: v2.1.18 GA (PR #106, 2026-05-21 06:37Z)
github_issues_open: ["#103", "#104", "#105", "#107"]
github_issues_closed_recent: ["#100", "#101", "#102"]
reporter: "@pruge (james kim)"
external_dogfood_case: dandi-village-ledger (s1-foundation + s2-core-accounting)
status: master-plan drafted (PM/CTO/QA validation pending)
---

# bkit Quality Maturation Sprint — v2.1.19 Master Plan

> **Mission**: pruge가 제기한 10건의 sprint domain 결함을 **단일 reactive cluster** 가 아니라 **bkit-system 철학·사상의 깊은 위반** 으로 진단하고, **5 sub-sprint 통합 master plan** 으로 sprint domain 의 maturity 를 PDCA core 수준으로 끌어올린다. pruge 의 의구심을 **신뢰** 로 전환하고, **외부 dogfooder feedback** 을 bkit 의 영구적 quality 자산으로 흡수한다.

> **Anti-Mission**: 새 기능 추가 X. v2.1.19 는 **maturity sprint** — 기존 sprint domain 의 완성도 격차를 메우고 self-dogfooding 을 정착시키는 것이 전부.

---

## 0. Executive Summary

### 0.1 4-Perspective 요약 (Problem / Solution / Function / Core Value)

| Perspective | Content |
|-------------|---------|
| **Problem** | @pruge (외부 dogfooder, dandi-village-ledger 프로젝트 운영자) 가 **1.5 일 / 10 GitHub Issues** 의 정밀한 결함 cluster 를 보고했다. v2.1.16 (#92~#95 4건, 5/20) → v2.1.17 close 후 v2.1.16 base 에서 #100/#101/#102 3건 (5/21 03:54) → v2.1.18 close 후 동일 base 에서 #103/#104/#105 3건 (5/21 05:04, deferred) → **v2.1.18 GA 약 2시간 후 #107 신규** (5/21 08:40, `s2-core-accounting` sprint 에서 SKILL.md path mismatch 발견). 모든 결함이 sprint domain 단일 표면에 집중되어 있고, **매 release 가 동일 base 의 새 결함을 노출** 하는 reactive fix loop 가 형성됨. **근본 진단**: bkit-system 의 3 Core Philosophies (Automation First / No Guessing / **Docs=Code**) 중 **Docs=Code** 가 sprint skill 에서 체계적으로 위반되고 있고, 4 Controllable AI Principles 중 **Full Visibility** (audit trail) + **Always Interruptible** (recovery primitive) 가 sprint domain 에 부분 적용되어 있으며, bkit 이 **자기 자신을 dogfood 하지 않아** 외부 사용자가 매일 새 결함의 단면을 발견하고 있다. v2.1.18 sprint 자체가 "self-referential meta risk" 라며 sprint container 를 우회한 것이 이를 직접 입증한다. |
| **Solution** | **5 sub-sprint master plan** 으로 sprint domain 의 maturity gap 을 통합 해소한다. **S1 Self-Dogfooding Enablement** (chicken-and-egg 영구 제거 + sprint-orchestrator full live + bkit 자기 sprint 로 자기 release 운영 CI gate), **S2 Convention Restoration** (#107 즉시 fix + 44 skills × convention contract test + Docs=Code drift 차단 layer), **S3 Sprint Report Maturity** (#103/#104/#105 통합 + generateReport SoT 재설계 + pruge dandi 시나리오 E2E regression lock), **S4 External Dogfooder Lifecycle** (User-Feedback Lifecycle 도입 + Trust Score 7-Component 확장 + Real User Hall of Fame), **S5 Sprint Maturity Index** (SQM 정량 측정 + 매 release SQM 공개 + pruge 이슈 → SQM axis 매핑). |
| **Function/UX Effect** | (a) 외부 사용자가 `/sprint init` 부터 `/sprint archive` 까지 full lifecycle 을 **manual workaround 없이** 완주 가능 — sprint-orchestrator 가 sub-agent dispatch full live, generate-report 가 qualityGates SoT 기반 완전한 보고서 emit, sprint init 이 master-plan/PRD context 자동 import, failure-reporter 가 resolution marker 자동 prepend. (b) 매 future release 가 bkit sprint 기능으로 자기 sprint 를 운영해야만 release 가능 — sprint domain regression 즉시 발견. (c) pruge 의 dandi-village-ledger 시나리오가 bkit upstream 의 official regression test suite 로 흡수 — 동일 결함의 영구 차단. (d) 외부 dogfooder feedback 이 Trust Score 7번째 component 로 정량화 — bkit governance 의 일부. (e) Sprint domain maturity 가 SQM (Sprint Quality Maturity) 지수로 정량 공개 — 매 release 의 sprint domain 건강도 transparency. |
| **Core Value** | **v2.1.18 의 turnaround promise ("24h 이내 fix")** 를 **v2.1.19 의 maturity guarantee** 로 격상한다. Reactive fix loop 를 systemic improvement loop 로 전환하고, 외부 dogfooder feedback 을 bkit 의 **영구적 차별화 자산** 으로 흡수한다. **차별화 6/6 → 7/7 확장**: 신규 ENH-318 **External Dogfooder Feedback Trust Integration** 을 정식 편입. pruge 같은 외부 dogfooder 가 bkit 의 "외부 quality auditor" 로서 신뢰 받는 partner 가 되도록 lifecycle 을 제도화. |

### 0.2 핵심 결정 요약

| 항목 | 값 | Evidence / Rationale |
|------|-----|----------|
| **Master Plan trigger** | 사용자 (kay) 의 "pruge 의구심 우려" 명시 + #107 신규 이슈 발생 | 2026-05-21 conversation log |
| **Sprint type** | Multi-feature meta-container (Sprint Management v2.1.13 GA 원형 사용) | `bkit-system/scenarios/scenario-sprint.md` |
| **Sub-sprint count** | 5 (S1 Foundation / S2 Defense / S3 Polish / S4 Proactive / S5 Measurement) | Kahn topological + 의존성 분석 § 5 |
| **Total feature count** | 22 (S1: 5 / S2: 5 / S3: 6 / S4: 4 / S5: 3) — F1-5 rescope 반영 후 S1 도 5 features 유지 | § 4 features 표 |
| **Trust Level (시작)** | L3 — Auto-Pause Triggers full active, qa phase 후 사용자 명시 archive | v2.1.18 self-referential meta risk 학습 |
| **예상 LOC delta** | **+5,600 gross / -600 conservative removal = +5,000 net** (CTO B-3 정정: honest gross 채택, post-hoc reconciliation 폐기. § 4.6 + § 15.4 dogfooder acquisition 추가 250 포함) | 22 features × 평균 245 LOC + 신규 test 1,200 LOC + § 15.4 dogfooder acquisition 250 LOC |
| **예상 Test 추가** | **120 TC** (S1 28 + S2 35 + S3 40 + S4 12 + S5 5) — CTO B-3 정정 후 정확한 합계 | qa-strategist projection |
| **Budget (cumulativeTokens)** | 3M (default 1M × 3 — multi-sprint scope) | budget bin-packing § 14 |
| **차별화 신규 편입** | ENH-318 External Dogfooder Feedback Trust Integration | § 17 차별화 7/7 확장 |
| **CI Gate 신설** | `scripts/check-self-dogfood.sh` (bkit release 직전 sprint container live run 강제) | § 19 Self-Dogfooding CI Gate |
| **Real User Hall of Fame** | README + CHANGELOG 영구 섹션 | § 16 |

---

## 1. Context Anchor (Plan → Design → Do 전파)

| Key | Value |
|-----|-------|
| **WHY** | (1) @pruge 가 1.5 일 / 10 issues 의 정밀한 결함 cluster 를 보고, 매 release 가 fix → 2-4시간 후 새 결함 노출의 reactive loop 형성. (2) bkit-system 의 3 Core Philosophies 중 **Docs=Code** 가 sprint skill 에서 체계적 위반 (#102 docs §10.2 vs code, #107 SKILL.md path vs file). (3) bkit 이 자기 자신의 sprint 기능을 dogfood 하지 않아 외부 사용자가 매일 새 결함을 발견 (v2.1.18 self-referential meta risk 가 직접 증명). (4) pruge 의 신뢰 손상 risk → 외부 dogfooder 가 bkit 품질에 의구심을 가지기 시작하면 bkit-claude-code 의 marketplace credibility 직격타. |
| **WHO** | **Primary stakeholder**: @pruge (외부 dogfooder, dandi-village-ledger 운영자) — 신뢰 회복 + 영구 partner 화 대상. **Secondary**: bkit 의 차후 sprint domain 사용자 (현재 외부 sprint 사용자 매우 적음, pruge 가 first deep adopter). **Tertiary**: bkit 의 internal devs (kay) — sprint domain 의 maturity 격차를 명확히 인지하고 systemic fix 운영. |
| **WHAT (도메인)** | (1) Sprint skill 의 Docs=Code drift 영구 차단 + convention compliance. (2) Sprint domain 의 self-dogfooding 정착 — bkit 이 자기 sprint 로 자기 release 운영. (3) generateReport / failure-reporter / sprint init context import 등 sprint lifecycle 의 missing primitive 통합 완성. (4) External Dogfooder Lifecycle 제도화 — User-Feedback Lifecycle + Trust Score 7-Component + Real User Hall of Fame. (5) Sprint Maturity Index (SQM) 정량 측정 도입. |
| **WHAT NOT** | (1) 새 sprint 기능 추가 X (예: sprint fork, sprint clone, sprint dependency graph 등 — 모두 v2.1.20+ 이관). (2) PDCA core 의 lifecycle 변경 X (PDCA 9-phase + Sprint 8-phase 직교성 유지). (3) Sprint terminal state 변경 X (`archived` forward-only 유지). (4) Trust Score 의 기존 6 components 가중치 변경 X (신규 7번째만 추가). (5) M1-M10 + S1-S4 catalog 의 기존 정의 변경 X. (6) CC plugin manifest schema 변경 X (v2.1.13 GA 호환성 유지). |
| **RISK** | (1) **Self-Dogfooding 도입 실패 risk** — bkit 이 자기 sprint 로 자기 release 운영을 시도하다 CI gate 가 stuck 되면 release 자체가 막힘 → 사용자에게 더 큰 신뢰 손상. (2) **Convention contract test false positive** — 44 skills 의 convention test 가 너무 strict 하면 정당한 변형을 block 할 수 있음. (3) **External Dogfooder Trust component 산정 편향** — 외부 dogfooder 1명 (현재 pruge) 의 issue 수가 trust score 에 과도하게 영향 미칠 수 있음. (4) **SQM 지수 over-engineering** — sprint domain maturity 를 정량화하려다 metric gaming 발생. (5) **5 sub-sprint scope creep** — multi-sprint 작업의 budget overrun 위험. (6) **pruge 의 추가 이슈 등록 가속화** — v2.1.19 작업 중 pruge 가 dandi 운영에서 더 깊은 결함을 발견하면 sprint scope 가 흔들림. (7) **Sub-agent dispatch 의 효율성 문제** — 5 sub-sprint 를 sequential 로 운영하면 시간이 길어짐. (8) **재현 환경 격차** — pruge 의 dandi-village-ledger 코드베이스 일부가 bkit team 에 비공개이므로 일부 시나리오는 직접 재현 불가. |
| **SUCCESS** | (1) **#103/#104/#105/#107 모두 close** + sprint domain 의 모든 docs/code drift 0건 (CI invariant 강제). (2) **v2.1.19 자체가 bkit sprint 로 운영됨** — `/sprint init v2119-bkit-quality-maturation --features s1,s2,s3,s4,s5` 후 archive 까지 manual workaround 없이 완주. (3) **pruge 의 신규 issue 등록 rate** 가 v2.1.18 → v2.1.19 사이에 **50% 감소** 또는 동일 결함 영역 0건 (regression lock evidence). (4) **Trust Score 7-Component 도입** + externalDogfoodFeedbackResponseRate ≥ 0.8 (24h 이내 fix 비율). (5) **SQM 지수 ≥ 85** (sprint domain maturity 정량 평가). (6) **차별화 7/7 정식 편입** + Real User Hall of Fame 첫 entry 등록 (@pruge). (7) **40 TC live PASS + 120 TC 추가 (총 4,300+ TC)** + pruge dandi 시나리오 E2E test 5건 흡수. |
| **SCOPE (정량)** | **5 sub-sprint** × 평균 4-6 features = **22 features 총괄**. 예상 +3,700 net LOC + ~120 TC 추가 + ~6 신규 templates + 3M token budget + 5-7 영업일 (2026-05-22 ~ 2026-05-30). |
| **OUT-OF-SCOPE** | (1) Sprint fork / clone / dependency graph 등 신규 기능. (2) PDCA core 의 9-phase enum 변경. (3) Master plan template 의 schema breaking change. (4) bkend.ai / Vercel / Atlassian MCP 통합 기능. (5) v2.1.20+ 의 SQM Phase 2 (industry benchmark) 통합. |

---

## 2. Meta-Analysis — pruge Issue Cluster 근본 원인 (Hegelian Dialectic)

### 2.1 결함 timeline 재구성

| Date | Time | Issue | Type | 발견 위치 | bkit base | v2.1.18 처리 |
|------|------|-------|------|----------|-----------|--------------|
| 2026-05-20 | 00:40-01:03 | #92/#93/#94/#95 (4건) | bug/enhancement | dandi `s1-foundation` 시작 단계 | v2.1.16 | v2.1.17 GA close |
| 2026-05-21 | 03:54 | #100/#101/#102 (3건) | P0/P0/P1 | dandi `s1-foundation` `do` phase | v2.1.16 | v2.1.18 GA close ✅ |
| 2026-05-21 | 05:04 | #103/#104/#105 (3건) | enhancement | dandi `s1-foundation` archive 단계 | v2.1.16 | v2.1.18 deferred → v2.1.19 |
| 2026-05-21 | 06:37 | v2.1.18 GA published | release | bkit upstream | — | — |
| 2026-05-21 | **08:40** | **#107** (1건) | docs drift | dandi `s2-core-accounting` 시작 | v2.1.16 | **v2.1.18 GA 직후 noticed** |

### 2.2 양측 진단의 대립 (Dialectic)

| 측면 (Thesis) | bkit-team 자체 평가 (v2.1.18 report) | pruge 의 implicit 평가 (#107 등록) |
|---|---|---|
| **Fix 완료성** | "Closes #100/#101/#102 영구 종결" (v2.1.18 PR description) | v2.1.18 GA 약 2시간 후 sprint domain 의 *다른* 표면 (#107 SKILL.md path) 결함 등록 |
| **차별화 ENH-292** | "Sequential Dispatch 활성화 milestone, declared → live 승격" | sprint-* agents 의 `tools:` 명시는 OK 이지만, **SKILL.md path 가 actual file 과 불일치** → docs 가 다시 drift |
| **40 TC PASS** | "목표 14 TC 대비 2.86× 초과 달성" | Test 가 추가됐어도 **SKILL.md path mismatch 같은 documentation invariant test 부재** — 더 깊은 영역의 결함 노출 |
| **Self-Referential Meta Risk** | "Chicken-and-egg 회피 패턴 확립, Plan §6.1 noteline" | bkit 이 자기 sprint 기능을 안 쓰니까 외부 사용자가 매일 새 결함을 발견 — 이것은 *회피* 가 아니라 *방치* |
| **Reporter scenario 1:1 재현** | "E2E test 8 steps 로 보고자 시나리오 흡수" | `s1-foundation` 시나리오만 흡수, `s2-core-accounting` 시나리오는 미흡수 → 다음 sprint 에서 또 결함 발견 |

### 2.3 Synthesis (변증법적 통합)

두 측면이 모두 부분적으로 옳다. **bkit-team 평가** 는 *직접 보고된 cluster* 를 잘 해결했지만, **pruge 의 implicit 평가** 는 *cluster 의 boundary 밖* 에 더 깊은 결함이 있음을 행동으로 입증한다. 두 측면의 변증법적 통합:

> **새 진리**: "Reactive fix 의 cluster boundary 는 사용자의 *직접 보고* 가 아니라 *사용자의 다음 시나리오 surface* 까지 확장되어야 한다. bkit-team 의 fix 가 'pruge 가 보고한 것' 을 영구 종결하는 것이 아니라, 'pruge 의 다음 시나리오에서 또 결함이 노출될 가능성' 을 영구 차단해야 진정한 root cause 해결이다."

이는 **MS Research 2025 Hegelian Self-reflecting LLMs** (GSM-Symbolic +6.4pp) 의 prompt 패턴과 동일 구조 — 두 contradicting source 를 synthesize 해 새 진리를 도출.

### 2.4 메타인지 (Metacognition)

| 시도 (v2.1.16 → v2.1.18) | 패턴 | 결과 |
|--------------------------|------|------|
| v2.1.17: #92~#95 4건 fix (gate measurement / approval / failure-report) | Reactive fix, 차별화 강조 | 익일 #100/#101/#102 등록 |
| v2.1.18: #100~#102 3건 fix (Task tool / trust mutation / normalize) | Reactive fix, "영구 종결" 선언 | 2시간 후 #107 등록 |
| ?: v2.1.19 (계획) | Reactive fix 가 또 #103/#104/#105/#107 close 만 한다면? | 익일 #108~#110 등록 위험 |

**Think2 (2026) 메타인지 패턴**: "3+ similar attempts fail, stop and reassess the approach itself, not just retry." — 이게 정확히 현재 상황. v2.1.17 + v2.1.18 모두 같은 reactive fix 패턴이고 같은 결과 (새 결함 발생). **v2.1.19 는 approach 자체를 reassess** 해야 한다. 그래서 master plan 의 mission 자체가 "fix issues" 가 아니라 "**maturity sprint**" 로 격상되어 있다.

### 2.5 5-axis 결함 매핑 (pruge 10건 + v2.1.19 대응)

| Axis | pruge issues | bkit-system 위반 철학 | v2.1.19 sub-sprint 대응 |
|------|--------------|----------------------|-------------------------|
| **A1 Sprint Agent Dispatch** | #92 (M4/M8 미측정), #100 (Task tool 부재) | Automation First (state machine 이 sub-agent dispatch 못함) | **S1 Foundation** F1-3 |
| **A2 Trust Level UX** | #94 (measure 명령 부재), #95 (approval deadlock), #101 (mutation 부재), #102 (--trust silent ignore) | Always Interruptible (recovery primitive 부재) + Full Visibility (audit drift) | v2.1.17/v2.1.18 close (regression lock 강화) |
| **A3 Failure Reporter** | #93 (gate_fail report 부재), #103 (resolution marker 부재) | Full Visibility (resolved 상태가 file 에 안 보임) | **S3 Polish** F3-1 |
| **A4 Report SoT (Source of Truth)** | #104 (context auto-import 부재), #105 (qualityGates section + KPI source unify) | Docs=Code (sprint state 와 report 산출물의 단일 source 부재) | **S3 Polish** F3-2/F3-3 |
| **A5 Skill Convention Compliance** | #107 (SKILL.md path mismatch) | **Docs=Code** (sprint skill 만 다른 패턴, 15 skills 와 drift) | **S2 Defense** F2-1/F2-2 |

5 axes 중 A2 는 v2.1.17/v2.1.18 에서 close 했고, 나머지 4 axes (A1, A3, A4, A5) 가 v2.1.19 의 핵심 작업 영역이다.

---

## 3. bkit-system 철학·사상 매핑 (위반 → 회복)

### 3.1 3 Core Philosophies × Sprint Domain Audit

| Philosophy | bkit-system 정의 | v2.1.18 시점 sprint domain 위반 사례 | v2.1.19 회복 design |
|------------|-----------------|------------------------------|-----------------------|
| **Automation First** (Claude 가 user 가 명령 몰라도 PDCA 자동 적용) | "State machine (20 transitions, 9 guards) + Workflow Engine (3 YAML presets) + L0-L4 automation levels" (`philosophy/core-mission.md`) | **#100**: sprint-orchestrator 가 sub-agent dispatch 실패 (Task tool 부재) → state machine 자동 advance 가 main session pass-through 로 우회됨. **#107**: SKILL.md path 가 actual file 과 불일치 → LLM dispatcher 가 path 를 자동 resolve 못해 `MODULE_NOT_FOUND` round-trip 발생 (context-window 낭비). | **S1 Foundation**: sprint-orchestrator full live, chicken-and-egg 영구 제거. **S2 Defense**: SKILL.md path invariant + 44 skills × convention contract test (CI gate). |
| **No Guessing** (불확실하면 docs 확인 → docs 에 없으면 사용자 질문, **never guess**) | "gap-detector agent + design-validator + quality gates (7 stages) + blast radius analysis" (`philosophy/core-mission.md`) | **#103**: failure-reporter 가 resolved 상태를 guess 못해 file 에 stale "BLOCKED" 잔존 → 새 contributor 가 docs/03-analysis/ 를 보고 sprint 상태를 *추측* 해야 함 (No Guessing 위반). **#104**: sprint init 이 master-plan/PRD 의 context 를 도입하지 않아 "(not set)" 으로 *guess* 처리. | **S3 Polish**: failure-reporter resolution marker (A+C) + sprint init context-importer (master-plan → PRD fallback chain) — *guess* 영역을 system 이 검증된 source 로 채움. |
| **Docs = Code** (design first, implement later, design-implementation sync 유지) | "PDCA workflow + `/pdca analyze` + metrics collector (M1-M10) + regression guard" (`philosophy/core-mission.md`) | **#102**: skill docs §10.2 가 `trustLevel > trust > trustLevelAtStart` precedence 를 declared 하지만 code 가 우회 (silent drift). **#105**: sprint state `qualityGates` 와 `kpi` 와 `featureMap` 3개 source 가 generateReport 에서 inconsistent 하게 mix → 보고서가 "matchRate --" "features 0/4" 표시 (state 에는 100). **#107**: SKILL.md 에 `scripts/sprint-handler.js` 라고 적혀있지만 actual file 은 `<bkit-root>/scripts/sprint-handler.js` (path drift). | **S2 Defense**: 44 skills × Docs=Code contract test (SKILL.md 의 declared path, behavior, frontmatter 가 actual code 와 일치하는지 CI invariant). **S3 Polish**: generateReport SoT 통일 (`qualityGates > featureMap > kpi` precedence + divergence warning emit). |

### 3.2 4 Controllable AI Principles × Sprint Domain Audit

| Principle | bkit-system 정의 | v2.1.18 시점 sprint domain 위반 사례 | v2.1.19 회복 design |
|-----------|-----------------|------------------------------|-----------------------|
| **Safe Defaults** (L2 Semi-Auto default, 절대 full automation 으로 시작 X) | "DEFAULT_LEVEL = 2, destructive ops require L3+, git push --force denied below L4" | sprint domain 에서는 sprint init 시 `--trust L1` 같은 unsafe boundary 가 진입 가능했고 escape primitive 가 없었음 (#101 lockout). → v2.1.18 에서 `/sprint trust` 로 fix 했지만 *default* L1 진입 자체가 safe 하지 않음. | **S1 Foundation** F1-4: sprint init default 가 L1 → L2 로 격상 (L1 은 explicit `--trust L1` 만 허용) + lockout 진입 시점에 자동 warning emit. |
| **Progressive Trust** (track record 로 trust earn, 가정 X) | "Trust Score (0-100) from 6 weighted components, cooldown-protected level upgrades" | 현재 trust score 6 components 모두 **internal metric** (pdcaCompletionRate, gatePassRate, rollbackFrequency, destructiveBlockRate, iterationEfficiency, userOverrideRate). **외부 dogfooder feedback 이 trust score 에 반영 안됨**. pruge 가 매 1-2일 새 issue 등록해도 trust score 는 자동으로 안 떨어지고, 24h fix 했어도 trust score 는 자동으로 안 오름. | **S4 Proactive** F4-1: Trust Score 7-Component 확장 — **externalDogfoodFeedbackResponseRate** (외부 dogfooder issue 등록 → fix release 까지 평균 시간 의 inverse) 신규 component, weight **0.05** (보수적, CTO M-2 + R-3 응답 — N=1 한정 편향 완화). 기존 6 components 의 *상대 weight 비율 유지* + 7 components 합 1.00 정규화. **Worked Example** (CTO M-2 응답): 사용자 X 가 v2.1.18 시점 component 가중 점수 [pdcaCompletionRate=80×0.25, gatePassRate=85×0.20, rollbackFrequency=90×0.15, destructiveBlockRate=95×0.15, iterationEfficiency=75×0.15, userOverrideRate=70×0.10] = trustScore **80.75**. v2.1.19 도입 후 동일 사용자 (externalDogfoodFeedbackResponseRate=0, 외부 dogfooder 활동 무) → 기존 6 components weight 비례 0.95 축소 (1.00→0.95 정규화) + 신규 0.05×0 = trustScore **76.71** → **Δ -4.04 (5.0%)**. 5% 한계선 정확히 일치. externalDogfoodFeedbackResponseRate=0.5 인 경우 → 79.21 (Δ -1.54, 1.9%). externalDogfoodFeedbackResponseRate=1.0 → 81.71 (Δ +0.96, +1.2% gain). **계측 가능 conservative roll-out**: 첫 30 일 weight 0.05 monitoring, 데이터 축적 후 v2.1.21+ 에서 0.10 로 재조정 (CO-B carry). |
| **Full Visibility** (모든 AI 결정 추적/감사 가능) | "Audit logger (JSONL), decision tracer, CLI dashboard" | #93/#103: gate_fail 보고서가 docs/03-analysis/ 에 생성되지만 resolved 상태가 안 보임 → audit log 에는 있어도 *file 단위 visibility* 가 부분적. #105: sprint report 가 qualityGates 11건 정보를 가지고 있지만 markdown 산출물에서 누락. | **S3 Polish** F3-1/F3-2: failure-reporter resolution marker prepend + sprint state `lastGateFailure.resolvedAt`/`resolvedBy`/`resolutionReason` 추가. **S3 Polish** F3-3: generateReport 가 `## Quality Gates (N gates, M passed)` 섹션을 KPI Snapshot 직후 emit. |
| **Always Interruptible** (사용자가 어떤 시점에도 pause/stop 가능) | "Emergency stop, checkpoint/rollback per phase, /control pause, circuit breaker" | sprint domain 에서는 **terminal state archived 가 forward-only** (rollback X) — 이게 design choice 이지만 외부 사용자에게는 "lockout" 처럼 느껴짐 (#101 의 implicit ergonomic cost). v2.1.18 의 `/sprint trust` 가 부분 회복했지만, **archived 직전 단계의 mutation primitive** 가 여전히 부족. | **S1 Foundation** F1-5: `/sprint amend <id> --reason "..."` 명령 신설 — archived 직전 phase 에서 단일 field mutation 허용 (audit emit 강제). archived state 자체는 여전히 forward-only. |

### 3.3 차별화 6/6 → 7/7 확장

bkit-system 의 차별화 6 (`MEMORY.md` 명시) 와 v2.1.18 의 ENH-292 활성화 milestone 에 더해, v2.1.19 는 7번째 차별화를 정식 편입한다.

| # | 차별화 | 현재 상태 | v2.1.19 변화 |
|---|--------|----------|-------------|
| #1 | ENH-286 Memory Enforcer (CLAUDE.md 의무 적용) | 7-streak | (변화 없음, 무영향) |
| #2 | ENH-289 Defense Layer 6 (post-hoc audit alarm) | 23 + sub-cluster | **강화** — externalDogfoodFeedbackResponseRate component 가 audit pipeline 에 자연 합류 |
| #3 | ENH-292 Sequential Dispatch (sub-agent caching 우회) | v2.1.18 활성화 milestone | **확장** — bkit self-dogfooding CI gate 가 sequential dispatch pattern 의 stress test 역할 |
| #4 | ENH-300 Effort-aware Adaptive Defense | F1-146 follow | (변화 없음, 무영향) |
| #5 | ENH-303 PostToolUse continueOnBlock | 10-streak milestone | (변화 없음, 무영향) |
| #6 | ENH-310 Heredoc Detector | 6-streak OPEN | (변화 없음, 무영향 — 본 sprint 도 heredoc 미사용) |
| **#7** | **ENH-318 External Dogfooder Feedback Trust Integration** ★ NEW | — | **신규 편입** — Trust Score 7-Component + User-Feedback Lifecycle + Real User Hall of Fame |

ENH-318 의 핵심 가치 명제: "bkit 은 *외부 dogfooder 의 issue 등록 → fix release → regression lock → public acknowledgment → trust score 반영* 의 lifecycle 을 제도화한 첫 CC plugin." → marketplace 차별화 narrative.

---

## 4. Features (22 features × 5 sub-sprints)

### 4.1 Sub-Sprint S1 — Self-Dogfooding Enablement (Foundation)

| # | Feature | 우선순위 | 상태 | Closes | LOC est. | TC est. |
|---|---------|---------|------|--------|----------|---------|
| F1-1 | sprint-orchestrator full live integration test | P0 | pending | — | 250 | 8 |
| F1-2 | sprint-handler `case 'dogfood'` (bkit self-dogfood mode) | P0 | pending | — | 180 | 6 |
| F1-3 | `scripts/check-self-dogfood.sh` CI gate (release pre-check) | P0 | pending | — | 220 | 7 |
| F1-4 | sprint init default L1 → L2 + L1 explicit warning | P1 | pending | (related #101) | 80 | 4 |
| F1-5 | `/sprint annotate <id> --reason "..."` archived-state annotation only (CTO B-2 rescope: 일반 mutation API 폐기, 닫힌 enum 단일 field — anti-mission 준수) | P2 | pending | — | 80 | 3 |

**S1 Subtotal**: 5 features, ~810 LOC (F1-5 rescope 후 1,050 → 810), 28 TC. **Mission**: bkit 이 자기 sprint 로 자기 release 운영할 수 있게 만든다. **Exit criteria**: `/sprint init v2119 --features s1,s2,s3,s4,s5 --trust L3` → archive 까지 manual workaround 없이 완주.

### 4.2 Sub-Sprint S2 — Convention Restoration (Defense)

| # | Feature | 우선순위 | 상태 | Closes | LOC est. | TC est. |
|---|---------|---------|------|--------|----------|---------|
| F2-1 | `skills/sprint/scripts/` symlink + SKILL.md path 정정 | P0 | pending | **#107** | 60 | 4 |
| F2-2 | `scripts/check-skills-docs-code-sync.js` 44 skills × SKILL.md invariant CI | P0 | pending | — | 380 | 17 |
| F2-3 | Sprint skill 의 모든 declared path/handler/frontmatter audit + 정정 | P1 | pending | — | 150 | 6 |
| F2-4 | Convention contract baseline `test/contract/baseline/skills-convention.json` (44 entries) | P1 | pending | — | 280 | 5 |
| F2-5 | SKILL.md authoring linter `scripts/lint-skill-md.js` (PreCommit hook) | P2 | pending | — | 200 | 3 |

**S2 Subtotal**: 5 features, ~1,070 LOC, 35 TC. **Mission**: 44 skills 의 Docs=Code drift 영구 차단, sprint skill 만 다른 패턴을 다른 15 skills 와 정렬. **Exit criteria**: `node scripts/check-skills-docs-code-sync.js` 가 44/44 PASS + CI gate 통합.

### 4.3 Sub-Sprint S3 — Sprint Report Maturity (Polish)

| # | Feature | 우선순위 | 상태 | Closes | LOC est. | TC est. |
|---|---------|---------|------|--------|----------|---------|
| F3-1 | failure-reporter resolution marker (A+C 통합: file header prepend + state.resolvedAt/resolvedBy/resolutionReason) | P0 | pending | **#103** | 220 | 8 |
| F3-2 | sprint init context-importer (`lib/application/sprint-lifecycle/context-importer.js`) + master-plan/PRD parser | P0 | pending | **#104** | 380 | 10 |
| F3-3 | generateReport `## Quality Gates` section + qualityGates SoT 통일 + divergence warning | P0 | pending | **#105** | 350 | 9 |
| F3-4 | KPI Snapshot resolver `lib/application/sprint-lifecycle/kpi-resolver.js` (precedence chain) | P1 | pending | (#105 sub) | 180 | 5 |
| F3-5 | Carry items rich rationale (featureMap.scope + details 통합) | P2 | pending | (#105 out-of-scope) | 120 | 4 |
| F3-6 | Lessons Learned auto-extraction (iterateHistory.attempts + gate source distribution + resolution reason aggregate) | P2 | pending | (#105 out-of-scope) | 250 | 4 |

**S3 Subtotal**: 6 features, ~1,500 LOC, 40 TC. **Mission**: pruge 가 v2.1.19 deferred 로 분류한 #103/#104/#105 통합 + sprint report 가 archived sprint 의 단일 사실원천 산출물이 되도록 maturity 격상. **Exit criteria**: pruge dandi `s1-foundation.report.md` 와 동일 sprint state 를 bkit 에서 generate 했을 때 KPI/Quality Gates/Context 모두 일치.

### 4.4 Sub-Sprint S4 — External Dogfooder Lifecycle (Proactive Defense)

| # | Feature | 우선순위 | 상태 | Closes | LOC est. | TC est. |
|---|---------|---------|------|--------|----------|---------|
| F4-1 | Trust Score 7-Component 확장 + externalDogfoodFeedbackResponseRate (`lib/control/trust-engine.js`) | P0 | pending | — | 280 | 5 |
| F4-2 | `lib/control/external-feedback-tracker.js` (GitHub issue → fix release 시간 측정) | P1 | pending | — | 320 | 3 |
| F4-3 | Real User Hall of Fame 섹션 (README + CHANGELOG appendix + `docs/external-dogfooders/`) | P1 | pending | — | 150 | 2 |
| F4-4 | pruge dandi-village-ledger 시나리오 5건 E2E regression test 흡수 (`test/e2e/external-dogfood/dandi-*.test.js`) | P0 | pending | — | 580 | 2 |

**S4 Subtotal**: 4 features, ~1,330 LOC, 12 TC. **Mission**: 외부 dogfooder feedback 을 bkit governance 의 정량적 자산으로 흡수. **Exit criteria**: Trust Score 7-Component PASS + Hall of Fame 첫 entry (@pruge) 등록 + dandi 시나리오 5건 PASS.

### 4.5 Sub-Sprint S5 — Sprint Maturity Index (Measurement)

| # | Feature | 우선순위 | 상태 | Closes | LOC est. | TC est. |
|---|---------|---------|------|--------|----------|---------|
| F5-1 | SQM (Sprint Quality Maturity Index) 정의 + `lib/quality/sqm-calculator.js` | P1 | pending | — | 320 | 2 |
| F5-2 | SQM dashboard panel (`lib/ui/sqm-panel.js`) + SessionStart 표시 | P2 | pending | — | 180 | 2 |
| F5-3 | SQM history `.bkit/state/sqm-history.jsonl` + 매 release 기록 | P1 | pending | — | 140 | 1 |

**S5 Subtotal**: 3 features, ~640 LOC, 5 TC. **Mission**: sprint domain maturity 를 SQM 지수로 정량 측정 + 매 release 공개. **Exit criteria**: SQM ≥ 85 + 매 release `.bkit/state/sqm-history.jsonl` append.

### 4.6 Sprint 전체 합계 (CTO B-3 정정 후)

| Sub-Sprint | Features | LOC (gross) | TC | 비고 |
|------------|----------|------------|----|------|
| S1 Foundation | 5 | 810 | 28 | F1-5 rescope: 1,050 → 810 |
| S2 Defense | 5 | 1,070 | 35 | |
| S3 Polish | 6 | 1,500 | 40 | |
| S4 Proactive | 4 | 1,330 | 12 | |
| S5 Measurement | 3 | 640 | 5 | |
| **Total (gross)** | **22** | **5,350** | **120** | F1-5 rescope 반영 |

**LOC removal (정직한 평가)**: 본 sprint 는 *maturity sprint* 로 기존 stub 코드 일부 정리 가능하나, 정확한 removal 영역은 sub-sprint design phase 에서 식별. 현 시점 conservative estimate: ~600 LOC removal (S2 의 sprint skill convention drift cleanup + S3 의 kpi field deprecation). **Net LOC delta: +4,750** (gross 5,350 - conservative removal 600). § 0.2 의 "+3,700 net" 표기는 본 정정으로 **+4,750 net** 으로 갱신 (post-hoc reconciliation 폐기, honest gross 채택). 실제 removal 은 design phase 에서 확정 후 본 표 갱신.

| TC 합계 검증 | 33 → 28 (S1 F1-5 rescope) | 35 + 40 + 12 + 5 = 92 | **합계 120 TC** (§ 0.2 의 "~120 TC" 와 정확히 일치) |

---

## 5. Sub-Sprint Sequencing (Kahn Topological + 의존성 그래프)

### 5.1 의존성 매트릭스

| Sub-Sprint | Depends on | Blocks | Rationale |
|------------|-----------|--------|-----------|
| S1 Foundation | (root) | S2, S3, S4, S5 | self-dogfooding 이 활성화되어야 다른 sub-sprint 가 sprint container 로 운영 가능 |
| S2 Defense | S1 (의 F1-1/F1-2) | S3 (의 generateReport) | Docs=Code drift 가 차단되어야 generateReport 변경이 SKILL.md 와 sync 가능 |
| S3 Polish | S1, S2 | S5 (의 SQM source data) | generateReport SoT 가 통일되어야 SQM 의 source data 가 신뢰할 수 있음 |
| S4 Proactive | S1 | (parallel with S3, S5) | Trust Score 확장은 self-dogfooding 만 의존 (S2/S3 와 independent) |
| S5 Measurement | S1, S2, S3 | (terminal) | SQM 측정은 S2 convention + S3 report SoT 가 안정된 후에만 의미 있음 |

### 5.2 Kahn Topological Sort

```
Level 0 (root): S1 Foundation
Level 1: S2 Defense + S4 Proactive (parallel, S1 의존)
Level 2: S3 Polish (S1+S2 의존)
Level 3: S5 Measurement (S1+S2+S3 의존)
```

### 5.3 Greedy Bin-Packing 일정 (5-7 영업일)

| Day | Sub-Sprint(s) | Phases | Activity |
|-----|---------------|--------|----------|
| Day 1 (5/22) | S1 Foundation | prd → plan → design → do (시작) | F1-1 + F1-2 구현 시작 |
| Day 2 (5/23) | S1 Foundation | do → iterate → qa → report | F1-3/F1-4/F1-5 + S1 exit criteria |
| Day 3 (5/26) | **S4 Proactive (sequential warmup) → S2 Defense (parallel post-warmup)** | S4: prd → design → do (오전) + S2: prd → design → do (오후 parallel) | CTO M-5: ENH-292 #56293 cache cascade 회피 — S4 (450K, 최소 budget) 가 morning warmup 으로 sequential, S2 는 cache warm 후 background `claude -p` parallel. S4: F4-1/F4-4 + S2: F2-1/F2-2 시작 |
| Day 4 (5/27) | S2 Defense + S4 Proactive | each: do → iterate → qa | S2: F2-3/F2-4/F2-5 + S4: F4-2/F4-3 완료 |
| Day 5 (5/28) | S3 Polish | prd → plan → design → do | F3-1/F3-2/F3-3 (P0 3건) 구현 |
| Day 6 (5/29) | S3 Polish | do → iterate → qa → report | F3-4/F3-5/F3-6 + S3 exit criteria |
| Day 7 (5/30) | **S5 Measurement + 통합 QA + Release** | S5: prd → archive | F5-1/F5-2/F5-3 + 5 sub-sprint 통합 QA + v2.1.19 GA |

Buffer: Day 7 의 8h 중 4h 가 SQM dashboard 통합 + 4h 가 release prep (CHANGELOG/README/issue 답글/Hall of Fame).

---

## 6. Sprint Phase Roadmap

### 6.1 5 Sub-Sprint × 8-Phase 매트릭스

각 sub-sprint 는 sprint 8-phase lifecycle (`prd → plan → design → do → iterate → qa → report → archived`) 를 독립적으로 수행한다. 그리고 5 sub-sprint 가 모두 archived 된 후 outer master sprint v2119 가 archived 된다.

| Phase | 각 sub-sprint 산출물 | Quality Gates | 활성 Agents |
|-------|------------------|-------------|------------|
| prd | `docs/00-pm/features/v2119-{sub}.prd.md` (pm-lead 4-agent orchestrate) | M8 | pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd |
| plan | `docs/01-plan/features/v2119-{sub}.plan.md` (cto-lead redline) | M8 | cto-lead, product-manager |
| design | `docs/02-design/features/v2119-{sub}.design.md` (frontend-architect / enterprise-expert) | M4, M8 | cto-lead, frontend-architect (S3 의 UI 부분), enterprise-expert (S4 Trust 부분), gap-detector (preview) |
| do | 구현 코드 + PR | M2, M3, M5, M7 | (메인 세션 + 필요 시 specialist agent spot) |
| iterate | matchRate < 100 시 pdca-iterator + gap-detector loop (max 5) | M1 (100%) | gap-detector, pdca-iterator |
| qa | qa-lead L1-L5 통합 + sprint-qa-flow 7-Layer S1 | M3 (=0), S1 (=100) | qa-lead, qa-test-planner, qa-test-generator, qa-debug-analyst, qa-monitor, sprint-qa-flow |
| report | sprint-report-writer (cumulative KPI) + report-generator (PDCA report) | M10, S2, S4 | sprint-report-writer, report-generator |
| archived | terminal — `docs/04-report/features/v2119-{sub}.report.md` archived 처리 | — | — |

### 6.2 Outer Master Sprint v2119 의 phase 매핑

```
v2119 outer (이 master plan)
├── prd (= 이 master-plan.md + 별도 `docs/00-pm/features/v2119-bkit-quality-maturation.prd.md`)
├── plan (sub-sprint 5건 의 master plan + Kahn sequencing 가 곧 outer plan)
├── design (각 sub-sprint design 의 합)
├── do (5 sub-sprint 의 do phase 의 합 — S1 → (S2 ∥ S4) → S3 → S5)
├── iterate (각 sub-sprint 가 자체 iterate 수행, outer 는 cumulative metric 만 track)
├── qa (outer QA: 5 sub-sprint 통합 regression + pruge dandi 시나리오 5건 PASS verify)
├── report (outer report: 5 sub-sprint 의 cumulative KPI + 차별화 7/7 확장 narrative + pruge Hall of Fame entry)
└── archived (v2.1.19 GA release tag + GitHub Release + 모든 issue close)
```

---

## 7. Quality Gates 활성화 매트릭스

### 7.1 기존 M1-M10 + S1-S4 (변경 없음)

| Gate | Threshold | 측정 source | 본 sprint 활성 phase |
|------|-----------|-------------|---------------------|
| M1 matchRate | ≥90 (per feature), 100 (iterate exit) | gap-detector | iterate, qa |
| M2 codeQualityScore | ≥80 | code-analyzer | do, qa |
| M3 criticalIssueCount | ≤0 | gap-detector | do, qa |
| M4 apiComplianceRate | ≥95 | gap-detector | design, qa |
| M5 runtimeErrorRate | ≤1 | qa-monitor (or stub) | qa |
| M7 conventionCompliance | ≥90 | code-analyzer | do, qa |
| M8 designCompleteness | ≥85 | sprint-orchestrator | design, qa |
| M10 pdcaCycleTimeHours | ≤40 | system-computed | report |
| S1 dataFlowIntegrity | =100 | sprint-qa-flow | qa |
| S2 featureCompletion | =100 | featureMap | qa, report |
| S4 archiveReadiness | =true | system | report → archived |

### 7.2 신규 SQM (Sprint Quality Maturity Index)

| Component | Weight | 측정 방법 | v2.1.18 baseline | v2.1.19 target |
|-----------|--------|----------|------------------|----------------|
| Docs=Code Sync Rate (44 skills × SKILL.md invariant) | 0.30 | `scripts/check-skills-docs-code-sync.js` | 43/44 (97.7%) — sprint skill drift | 44/44 (100%) |
| Sprint Self-Dogfood Run Rate (recent 5 releases 가 sprint 로 운영된 비율) | 0.20 | `.bkit/state/sqm-history.jsonl` lookup | 0/5 (0%) — v2.1.13~v2.1.18 모두 PDCA cycle | 1/1 (100%) — v2.1.19 가 sprint 로 운영 |
| External Dogfooder Feedback Response Rate (24h fix 비율) | 0.20 | `lib/control/external-feedback-tracker.js` | 7/10 (70%) — v2.1.18 close 7건 / pruge 총 10건 | ≥8/10 (80%) |
| Sprint Report KPI Consistency (qualityGates vs kpi divergence count) | 0.15 | generateReport validator | unknown — never measured | ≤0 |
| Sub-Agent Dispatch Success Rate (sprint-* agents 의 Task dispatch 성공 비율) | 0.10 | sprint-orchestrator audit | unknown — never measured | ≥0.95 |
| Convention Contract Test Pass Rate | 0.05 | `test/contract/baseline/skills-convention.json` | (test 없음) | ≥0.99 |
| **SQM Total** | 1.00 | weighted sum × 100 | **59.75 (실측 v2.1.18 baseline — S0 measurement 2026-05-21, CTO M-3 응답)** | **≥85** (decision tree §13 46-69 zone → 유지) |

> **S0 measurement findings** (`docs/03-analysis/v2118-sqm-baseline.analysis.md`):
> - docsCodeSyncRate 실측 93 (master plan estimate 98) — **★ S2 evolution 정정 (CO-S2-3)**: S0 measurement script 의 *code-block parsing bug* 로 인한 false positive 2 건 (phase-3-mockup `// scripts/app.js` + phase-9-deployment `// scripts/check-env.js` — 둘 다 fenced JavaScript/YAML 예제 코드). **실제 drift = 1 skill (sprint #107)**. F2-2 의 stripCodeBlocks evolution 후 정확한 측정: **docsCodeSyncRate 98 (43/44)** + SQM total 정정 ~61.25.
> - externalDogfooderFeedbackResponseRate 실측 **100** (closed-only metric, master plan estimate 70) — S4 F4-3 Hall of Fame narrative 강력 evidence
> - sprintReportKpiConsistency 실측 79 (master plan estimate null) — 14 reports 중 12 divergence, S3 F3-3 정확한 정량 evidence

SQM ≥ 85 가 v2.1.19 의 6번째 success criterion (§1 SUCCESS).

---

## 8. Success Metrics (7건)

| # | Metric | Target | 측정 방법 | Owner |
|---|--------|--------|----------|-------|
| 1 | matchRate (Design ↔ Code) per sub-sprint | 100% | gap-detector | each sub-sprint |
| 2 | criticalIssueCount across all sub-sprints | 0 | code-analyzer (aggregate) | qa-lead |
| 3 | dataFlowIntegrity (7-Layer S1) for S3 (report flow) | 100% | sprint-qa-flow | sprint-qa-flow agent |
| 4 | featureCompletion (22/22) | 100% | featureMap | sprint-orchestrator |
| 5 | Outer sprint cycle time | ≤56h (7 영업일 × 8h) | M10 | system-computed |
| 6 | **SQM Index** (Sprint Quality Maturity) | ≥85 | `lib/quality/sqm-calculator.js` | F5-1 owner |
| 7 | **Sprint domain regression coverage (outcome-based)** — (a) pruge dandi 5 시나리오 모두 E2E test PASS, (b) v2.1.19 → v2.1.20 사이 axes A1/A3/A4/A5 (§2.5) 에서 신규 sprint domain issue 0건 | (a) 5/5 PASS + (b) A1/A3/A4/A5 0건 | E2E test suite + GitHub issues monitor | external-feedback-tracker + qa-lead | CTO M-4: pruge N=1 한정 단일 dogfooder rate metric 대신 *outcome-based* coverage 측정 — vacation 등으로 trivially passing 회피 |

#6, #7 이 v2.1.19 의 mission-critical metric (success criteria § 1 SUCCESS 와 align).

---

## 9. Auto-Pause Triggers (4 기존 + 1 신규)

| # | Trigger | 조건 | 사용자 결정 옵션 |
|---|---------|------|----------------|
| 1 | QUALITY_GATE_FAIL | M3 > 0 OR S1 < 100 OR M1 < 90 (post-iterate) | fix & resume / forward fix / abort |
| 2 | ITERATION_EXHAUSTED | iter ≥ 5 AND matchRate < 90 | forward fix / carry / abort |
| 3 | BUDGET_EXCEEDED | cumulativeTokens > 3M (multi-sprint adjusted) | budget 증액 / 일부 sub-sprint 이월 / abort |
| 4 | PHASE_TIMEOUT | phase > 8h (multi-sprint adjusted from 4h) | timeout 연장 / force-advance / abort |
| 5 ★ | **USER_FEEDBACK_SURGE** (NEW) | 본 sprint 진행 중 pruge (또는 외부 dogfooder) 가 신규 sprint domain issue ≥ 3건 등록 | (a) 본 sprint 후속 sub-sprint 으로 이월 / (b) v2.1.20+ 으로 carry — **option "본 sprint scope 확장" 명시 금지** (CTO M-1: anti-mission 위반 회피) |

신규 trigger #5 의 정당성: v2.1.18 GA 약 2시간 후 #107 발생 사례 처럼, sprint 운영 중 pruge dandi 의 다음 phase 에서 새 결함이 노출될 가능성이 높다. 이를 *trigger* 로 인식해 sprint scope 의 dynamic adjustment 를 가능하게 한다. **Implementation**: `lib/control/external-feedback-tracker.js` (F4-2) 가 GitHub API polling 으로 새 issue 감지 → sprint state 의 autoPause trigger 발화.

---

## 10. Cross-Sprint Dependency (v2.1.18 ← v2.1.19 ← v2.1.20)

### 10.1 v2.1.18 → v2.1.19 carry items (from v2.1.18 sprint report)

| CO | 내용 | v2.1.19 흡수 sub-sprint |
|----|-----|----------------------|
| CO-1 | baseline v2.1.18 capture script | S1 F1-3 의 일부 (release pre-check) |
| CO-2 | qa-aggregate script | S5 F5-2 (SQM dashboard 의 일부) |
| CO-3 | sprint-orchestrator 자동 phase-advance live test | S1 F1-1 |
| CO-4 | sub-agent-dispatcher state transition test | S1 F1-1 |
| CO-5 | L0 Manual mode escalate path E2E | (out-of-scope, v2.1.20+ 이관) |
| CO-6 | sprint-report-writer agent timeout fallback | S3 F3-3 (out-of-scope 보강) |

### 10.2 v2.1.19 → v2.1.20+ carry items (예상)

| CO | 내용 | 사유 |
|----|-----|------|
| CO-A | SQM Phase 2 (industry benchmark 통합) | v2.1.19 는 SQM 기본 도입만, benchmark 비교는 다음 cycle |
| CO-B | Trust Score 7-Component 의 weight 재조정 (사용 데이터 축적 후) | externalDogfoodFeedbackResponseRate 의 적절한 weight 는 6개월 데이터 후 calibrate |
| CO-C | Hall of Fame 다국어 (KO/JA/ZH) | v2.1.19 는 영어만 |
| CO-D | Sprint fork / clone / dependency graph | 신규 기능, v2.1.19 anti-mission |

---

## 11. Risk Register (10건)

| # | Risk | 확률 | 영향 | Mitigation |
|---|------|------|------|------------|
| R-1 | Self-Dogfooding 도입 실패로 release CI gate stuck | M | H | S1 F1-3 의 fallback: dogfood 실패 시 emergency override flag (audit 강제) — release 진행 가능, 다만 SQM 점수 감점 |
| R-2 | 44 skills × convention contract test false positive | H | M | S2 F2-2 의 baseline JSON 을 점진적으로 빌드 (먼저 manual audit 후 frozen baseline) |
| R-3 | externalDogfoodFeedbackResponseRate 가 pruge 1명에 편향 | H | M | F4-2 의 weighted average — dogfooder 다수 등록 시 자동 평균화. 현재는 pruge 1명만이므로 component weight 를 0.05 로 보수적 시작, 데이터 축적 후 0.10 로 증가 |
| R-4 | SQM 지수 over-engineering / metric gaming | M | M | F5-1 의 6 components 가 모두 *external observable* (file existence, audit log, GitHub API) 으로 한정 — internal subjective 평가 배제 |
| R-5 | 5 sub-sprint scope creep | M | H | budget bin-packing 강제 + Day 7 의 buffer 4h 가 over-run 시 일부 P2 feature (F3-5/F3-6/F4-3/F5-2) 를 v2.1.20+ 이월 |
| R-6 | pruge 의 추가 issue 등록 가속화 | H | M | USER_FEEDBACK_SURGE trigger (§9) 가 dynamic scope adjustment 활성화 — pause 후 사용자 결정 |
| R-7 | Sequential dispatch 의 5 sub-sprint 시간 over-run | M | M | S2 + S4 의 parallel run (Day 3-4) 으로 시간 압축 + `claude -p` background dispatch 활용 |
| R-8 | pruge dandi-village-ledger 일부 비공개로 시나리오 재현 불가 | M | M | F4-4 의 5건 시나리오는 pruge 가 issue 에 제공한 reproduction script 만으로 흡수 (private 코드 의존성 0) |
| R-9 | v2.1.19 sprint 자체가 master plan 의 self-referential meta risk 재발 | L | H | S1 F1-1 의 sprint-orchestrator full live 가 chicken-and-egg 영구 제거 — v2.1.19 부터는 sprint 가 sprint 로 운영됨 |
| R-10 | Trust Score 7-Component 가 기존 사용자 weight 재계산으로 surprise downgrade | L | M | F4-1 의 weight 재조정은 새 component 만 추가하고 기존 6 components 절대 가중치 유지 (정규화만 1.00 / 1.10 → 0.91 등 비례 축소) — 기존 trust score 영향 ≤5% |

---

## 12. Resume / Abort 흐름

### 12.1 표준 흐름

| 상황 | 절차 |
|------|------|
| Auto-pause 후 resume | `/sprint resume v2119-{sub}` — 사유 해소 검증 후 phase 자동 advance |
| Outer master sprint 결정 | `/sprint status v2119-bkit-quality-maturation` 으로 5 sub-sprint 진행 통합 view |
| 사용자 abort (sub-sprint) | `/sprint archive v2119-{sub} --reason "..."` — terminal, dependency 끊김 |
| 사용자 abort (outer) | 모든 archived sub-sprint 유지 + outer master sprint archive |
| USER_FEEDBACK_SURGE trigger | pause + AskUserQuestion (3 option: scope expand / 후속 이월 / v2.1.20+ carry) |

### 12.2 비상 시나리오

| 시나리오 | 대응 |
|---------|------|
| S1 F1-1 (sprint-orchestrator full live) 실패 — chicken-and-egg 재발 | v2.1.19 outer 가 PDCA cycle 로 강등 (sub-sprint 5건은 sprint 로 운영 시도). audit 강제. SQM 점수 감점 -10. |
| S2 F2-2 (44 skills CI gate) 가 정당한 변형을 block | baseline JSON 을 update + 사유 명시 audit. v2.1.19 GA 진행. |
| S4 F4-4 (pruge 시나리오 흡수) 일부 시나리오 재현 실패 | reproduction 가능한 4건만 흡수 + 1건은 v2.1.20+ 이월 + pruge 에게 reproduction script 요청 issue 등록 |

---

## 13. Sprint 추적 (Living document)

본 master plan 은 v2.1.19 진행 중 다음과 같이 업데이트된다:

- 매 sub-sprint phase 전이 시: § 4 의 Features 표 상태 컬럼 갱신
- 매 quality gate 측정 시: § 7 의 SQM table 의 baseline → current 컬럼 갱신
- USER_FEEDBACK_SURGE 발생 시: § 9 의 trigger 표에 history append + § 11 의 risk register update
- 매 sub-sprint archived 시: outer master sprint 의 cumulative KPI 갱신
- v2.1.19 GA 시: 본 문서는 readonly 전환 + `docs/04-report/features/v2119-bkit-quality-maturation.report.md` 가 산출

---

## 14. Budget Bin-Packing (3M tokens / 56h)

### 14.1 Budget 분배

| Sub-Sprint | Budget (tokens) | Time (h) | LOC | TC |
|------------|----------------|----------|-----|----|
| S1 Foundation | 800K | 16 | 1,050 | 33 |
| S2 Defense | 500K | 12 | 1,070 | 35 |
| S3 Polish | 700K | 16 | 1,500 | 40 |
| S4 Proactive | 450K | 8 | 1,330 | 12 |
| S5 Measurement | 250K | 4 | 640 | 5 |
| Outer master (이 master plan + report + integration QA) | 300K | (별도) | — | — |
| **Total** | **3,000K** | **56h** | **5,590** | **125** |

### 14.2 Token 사용 패턴

- PM Team (pm-lead 4-agent): 각 sub-sprint 의 PRD 단계 — 평균 100K tokens × 5 = 500K
- CTO Team (cto-lead): 각 sub-sprint 의 plan/design redline — 평균 80K × 5 = 400K
- QA Team (qa-lead L1-L5): 각 sub-sprint 의 qa phase — 평균 60K × 5 = 300K
- Specialist agents (sprint-master-planner / sprint-orchestrator / sprint-qa-flow / sprint-report-writer / gap-detector / code-analyzer / pdca-iterator 등): 매 phase 평균 30K × 8 phases × 5 sub-sprint = 1,200K
- 메인 세션 (이 master plan + integration + commit + PR + release): 600K

---

## 15. Stakeholder Map

### 15.1 Primary External Stakeholder

| Stakeholder | Role | Interaction model | 신뢰 회복 metric |
|-------------|------|------------------|-----------------|
| **@pruge (james kim)** | bkit external dogfooder, dandi-village-ledger 운영자 | GitHub issue 등록 → bkit fix release → reproduction test 흡수 → Hall of Fame 등록 → trust score component 반영 | (1) v2.1.19 → v2.1.20 사이 pruge 신규 issue rate 50% 감소 OR 동일 영역 0건. (2) pruge dandi 시나리오 5건 E2E test 흡수 완료. (3) Hall of Fame 첫 entry. (4) Trust Score component externalDogfoodFeedbackResponseRate ≥0.8. |

### 15.2 Internal Stakeholders

| Stakeholder | Role | v2.1.19 책임 |
|-------------|------|------------|
| **kay (project owner)** | 의사결정, 우선순위, sprint 운영 | 본 master plan validation + 5 sub-sprint 진행 점검 + USER_FEEDBACK_SURGE 시 의사결정 |
| **bkit Agent Teams (PM/CTO/QA)** | 각 sub-sprint 의 PRD/Plan/Design/QA 산출 | sub-sprint 별 native orchestration (F4 v2.1.18 활성화 활용) |
| **CC plugin marketplace 사용자** | bkit 신뢰성 평가 | v2.1.19 GA 의 Hall of Fame + SQM 공개 narrative 가 marketplace credibility 형성 |

### 15.3 Tertiary Stakeholders

| Stakeholder | Role | v2.1.19 영향 |
|-------------|------|------------|
| 향후 외부 dogfooder | pruge 외 다른 dogfooder 추가 등록 가능성 | F4-2 의 external-feedback-tracker 가 N명 dogfooder weighted avg 지원 |
| Anthropic / CC team | CC plugin ecosystem 의 quality 표준 | v2.1.19 가 첫 plugin level external dogfooder lifecycle 도입 narrative 형성 |

### 15.4 ★ Dogfooder Acquisition Objective (CTO Strategic Insight 응답)

**CTO 가 지적한 깊은 systemic risk**: bkit 의 dogfooder population 이 **N=1** (pruge 만). 만약 pruge 가 churns 하면 replacement 없음. 만약 pruge 가 stay 하지만 60일 내 2번째 dogfooder 가 안 오면, externalDogfoodFeedbackResponseRate trust component 는 영원히 single-user instrument — § 11 R-3 (bias) 가 permanent condition 으로 고착. ENH-318 은 "one-tenant framework" 가 되어버린다.

→ **v2.1.19 는 *N→N+1 step* 을 명시적으로 포함한다**. 다음 actions:

| # | Action | Owner | Sub-sprint 흡수 | Exit |
|---|--------|-------|-----------------|------|
| DA-1 | README 의 "Real User Hall of Fame" 섹션 (§ 16.1) 옆에 **"bkit Early Adopter Program"** narrative 추가 — "If you're running bkit on a non-trivial production project and willing to file detailed bug reports with reproduction, we'll make you part of bkit's quality system" | S4 F4-3 (Hall of Fame) 의 sibling section | README PR merged |
| DA-2 | CC plugin marketplace 의 v2.1.19 release narrative 에 **dogfooder acquisition CTA** — "First 3 external dogfooders get featured + their reproduction scenarios become bkit's E2E suite" | S4 F4-3 의 marketplace surface | marketplace v2.1.19 description 갱신 |
| DA-3 | `docs/external-dogfooders/_README.md` 작성 — dogfooder 가 어떻게 contribution 하는지 + 어떤 benefit 받는지 명시 + 5-stage User-Feedback Lifecycle 시각화 | S4 F4-3 의 sibling doc | doc committed |
| DA-4 | v2.1.19 GA 후 30 일 시점에 **dogfooder population 측정** — N=1 유지 시 v2.1.20 plan 에 "active outreach" sub-goal 추가, N≥2 진입 시 externalDogfoodFeedbackResponseRate weight 0.05 → 0.08 상향 review | (carry to v2.1.20+ measurement) | metric 측정 + decision recorded |

이 4개 action 이 ENH-318 을 "1-tenant case study" 에서 "multi-tenant system" 으로 진화시키는 첫 step. 본 master plan 의 § 0 Mission 에 추가: "pruge 의 신뢰 회복 + ENH-318 multi-tenant 진화 첫 step (DA-1~DA-4)". **DA actions 모두 S4 sub-sprint 의 F4-3 (Hall of Fame) sibling 으로 통합** — 별도 sub-sprint 신설 없이 (anti-mission 준수). 추가 LOC est. ~250 (README + 2 docs + marketplace narrative). § 4.6 Total LOC 갱신: 5,350 + 250 = 5,600.

---

## 16. Real User Hall of Fame (S4 F4-3 산출물 design)

### 16.1 README appendix 섹션 (영어)

```markdown
## 🌟 Real User Hall of Fame

bkit's quality is measured by how well it responds to real users running bkit
in production on their own projects. This section recognizes external dogfooders
whose precise bug reports + reproduction scripts have been absorbed directly
into bkit's regression test suite.

### v2.1.19 (2026-05-30)

- **[@pruge (james kim)](https://github.com/pruge)** — `dandi-village-ledger`
  project. 10 GitHub issues over 1.5 days (#92~#107) leading to bkit v2.1.17,
  v2.1.18 fixes and the v2.1.19 Quality Maturation Sprint. 5 reproduction
  scenarios absorbed as E2E tests at `test/e2e/external-dogfood/dandi-*.test.js`.
  Thank you for trusting bkit with your production sprint.
```

### 16.2 CHANGELOG appendix 섹션

각 release 의 CHANGELOG 마지막에 "External Dogfooder Contributions" 섹션 추가:

```markdown
## External Dogfooder Contributions (v2.1.19)

- @pruge — 10 issues filed in v2.1.16~v2.1.18 cycle, 5 scenarios absorbed
  as regression tests in v2.1.19. See `docs/external-dogfooders/pruge.md`
  for the full contribution history.
```

### 16.3 `docs/external-dogfooders/<handle>.md` schema

각 외부 dogfooder 의 contribution timeline + issue list + 흡수된 regression test + 신뢰 회복 evidence 를 단일 문서로 영구 보관.

---

## 17. Methodology — bkit + Claude Code 고급 기능 활용 전략

### 17.1 사용자 명시 요청 mapping

| 사용자 요청 키워드 | v2.1.19 활용 방식 |
|------------------|-----------------|
| "에이전트 팀과 고급기능 충분히 활용" | 각 sub-sprint 의 PRD/Plan/Design 단계에서 PM Team (pm-lead orchestrate 4 agents) + CTO Team (cto-lead) + QA Team (qa-lead L1-L5) **native parallel orchestration** — v2.1.18 F4 sprint-master-planner Task allowlist 확장의 첫 본격 활용. |
| "bkit 품질과 완성도" | SQM 지수 (§ 7.2) 가 정량 metric, ≥85 가 success criterion. 매 release 공개. |

### 17.2 Claude Code 고급 기능 활용

| CC 기능 | v2.1.19 활용 |
|---------|------------|
| **Sub-Agent dispatch (Task tool)** | 5 sub-sprint × 8 phase × 평균 2-3 agent = ~100회 sub-agent dispatch. ENH-292 Sequential Dispatch 패턴 stress test. |
| **`claude -p "..."` background** | S2/S4 parallel run (Day 3-4) 시 S2 는 main, S4 는 background `claude -p` 로 동시 진행. |
| **MCP servers (bkit-pdca, bkit-analysis)** | 19 MCP tools 활용 — 특히 `bkit_sprint_status`, `bkit_gap_analysis`, `bkit_metrics_get` 가 각 sub-sprint 의 status query 에 직접 사용. |
| **Plan Plus (brainstorming-enhanced PDCA planning)** | S1 F1-3 (release CI gate design) 같은 brainstorm 영역에서 `/plan-plus` 활용. |
| **Memory systems (`~/.claude/projects/.../memory/MEMORY.md`)** | v2.1.19 진행 중 발견된 learning 을 매 sub-sprint archived 시점에 memory append — 차후 session 에서 context 자동 inject. |
| **Hook conditional `if` (CC v2.1.85+)** | F2-5 의 SKILL.md authoring linter 가 PreToolUse hook 에서 `if: "Write(skills/*/SKILL.md)"` 조건부 발화 — 다른 file write 에 영향 없음. |
| **Prompt cache 1H (`ENABLE_PROMPT_CACHING_1H=1`)** | 5 sub-sprint × 평균 8 phase 의 긴 session 진행 → 1H prompt cache 활성화 시 30-40% token saving (memory 의 SessionStart 안내 항목). |

### 17.3 사용자 요청 "bkit의 모든 기능" 활용 mapping

| bkit 기능 | v2.1.19 활용 |
|----------|------------|
| 44 Skills | sprint, plan-plus, pdca, code-review, control, rollback, audit, deploy, qa-phase 등 직접 활용 |
| 34 Agents | 위 § 17.1 의 PM/CTO/QA Team 모두 활용 + sprint-* 4 agents + gap-detector / code-analyzer / pdca-iterator / report-generator / design-validator |
| 21 Hook Events | SessionStart (live dashboard), PreToolUse (F2-5 linter), PostToolUse (gap-detector trigger), Stop (sub-sprint phase transition) 등 직접 활용 |
| 174 Lib Modules | 본 sprint 가 새 module 신설 (sprint-lifecycle/context-importer, sprint-lifecycle/kpi-resolver, quality/sqm-calculator, control/external-feedback-tracker 등) — 9 신설 modules |
| 2 MCP Servers (19 tools) | bkit_sprint_* / bkit_metrics_* / bkit_gap_analysis 직접 query |
| Sprint Management (v2.1.13 GA) | 본 master plan + 5 sub-sprint = sprint 기능의 **첫 self-dogfood** |
| L0-L4 Trust Level | outer master sprint L3 시작 + 각 sub-sprint 도 L3 (full auto-pause active) |
| Quality Gates M1-M10 + S1-S4 + SQM | § 7 의 전체 매트릭스 활성 |
| Defense-in-Depth 6-Layer | 본 sprint 의 `--force` flag (F1-5 의 amend command) 사용 시 Layer 6 alarm 자연 발화 |
| Memory Enforcer (ENH-286) | CLAUDE.md 의 `Korean primary, code English` 규칙 자동 적용 (본 master plan 자체가 한국어 — 규칙 준수) |

### 17.4 사용자 요청 "@bkit-system/ 의 철학과 사상 심층 분석" mapping

§ 3 (bkit-system 철학·사상 매핑) 의 두 표 (3 Core Philosophies × Sprint Domain Audit + 4 Controllable AI Principles × Sprint Domain Audit) 가 직접 응답. § 17.5 의 추가 분석:

### 17.5 bkit-system Context Engineering 관점에서의 v2.1.19 정당성

bkit 은 "**Context Engineering 의 실용적 구현**" (`philosophy/context-engineering.md`). v2.1.19 는 다음 layer 에서 Context Engineering 향상:

| CE Layer | v2.1.18 시점 격차 | v2.1.19 회복 |
|----------|------------------|-------------|
| **Multi-Level Context Hierarchy** (Plugin → User → Project → Session) | sprint context 가 Session level 에만 존재 — Project level 의 master-plan/PRD 와 단절 (#104) | F3-2 context-importer 가 Project → Session level 으로 자동 propagate |
| **Behavioral Rules Layer (34 Agents)** | sprint-orchestrator 가 declared 만 되어 있고 actual Task dispatch 못함 (#100) | F1-1/F1-2 sprint-orchestrator full live |
| **Hook System (21 events)** | sprint domain 의 PreToolUse hook 이 SKILL.md write 시 invariant check 안함 (#107 류 결함의 source) | F2-5 SKILL.md authoring linter hook |
| **Audit System** | sprint domain 의 resolved 상태 가 file 단위 visibility 부족 (#103) | F3-1 resolution marker prepend + state field |
| **Quality Gates** | sprint domain 의 SQM 미정의 | F5-1 SQM calculator |
| **Trust Engine** | 외부 dogfooder feedback 이 trust score 에 미반영 | F4-1 Trust Score 7-Component |

v2.1.19 는 CE-7 (Context Engineering Level 7) 의 maturity 를 보강하는 sprint 이며, 이는 단순 bug fix 가 아니라 bkit-system 의 6 CE layers 의 균일한 maturity 회복 작업이다.

---

## 18. Anti-Patterns to Avoid (이전 cycle 학습)

| Anti-Pattern | v2.1.17/v2.1.18 사례 | v2.1.19 회피 design |
|--------------|---------------------|-------------------|
| **"영구 종결" 선언 후 2시간 내 새 결함** | v2.1.18 의 "Closes #100/#101/#102 영구 종결" → #107 발생 | v2.1.19 의 release notes 는 "Closes #103/#104/#105/#107" 만 명시, "영구 종결" 표현 회피. 대신 SQM 지수 + Hall of Fame + Trust Score 7-Component 의 정량 evidence 로 신뢰 회복. |
| **Reactive cluster boundary 가 사용자 직접 보고에 한정** | v2.1.17 fix → v2.1.18 fix → v2.1.18 GA 후 #107 (사용자의 *다음 시나리오* 가 cluster boundary 밖) | § 2.3 synthesis 의 새 진리 적용 — F4-4 가 pruge dandi 의 5 시나리오 (보고된 것뿐 아니라 *다음 시나리오 surface*) 를 흡수 |
| **Self-Referential Meta Risk 라며 sprint container 우회** | v2.1.18 sprint 가 sprint-orchestrator 의 fix 대상이므로 PDCA cycle 로 진행 (Plan §6.1 noteline) | S1 Foundation F1-1 의 sprint-orchestrator full live 가 첫 번째 작업 — v2.1.19 *자체* 가 sprint container 로 운영됨. 이 양상 자체가 self-dogfooding 의 evidence. |
| **40 TC 추가 = 2.86× 초과 달성 narrative** | v2.1.18 의 "목표 14 TC 대비 2.86× 초과 달성" — TC 수 자체가 성공 metric 처럼 사용됨 | v2.1.19 는 TC 수가 아닌 **regression coverage** (pruge 시나리오 5건 중 흡수 비율) + **convention contract coverage** (44 skills 중 PASS 비율) 로 측정 |
| **차별화 "활성화 milestone" 선언 후 다음 cycle 에서 또 milestone 선언** | v2.1.17 → v2.1.18 모두 차별화 6/6 milestone narrative | v2.1.19 는 7번째 차별화 (ENH-318) 정식 편입 — milestone 이 아닌 **차별화 carry-forward** 로 positioning |

---

## 19. Self-Dogfooding CI Gate Design (S1 F1-3 상세)

### 19.1 Gate 정의

`scripts/check-self-dogfood.sh` — bkit release tag 직전에 강제 실행. 다음 invariant 검증:

1. **최근 1 release 가 sprint container 로 운영되었는가** — `.bkit/state/sqm-history.jsonl` 의 last entry 에 `sprintRunRate: true` 가 있어야 함
2. **sprint state file 이 정상 archived 인가** — `.bkit/state/sprints/v211x-*.json` 의 `phase: "archived"` 확인
3. **sprint report 가 generate 되었는가** — `docs/04-report/features/v211x-*.report.md` 존재 + Quality Gates 섹션 포함 (F3-3 invariant)
4. **outer sprint 의 5 sub-sprint 모두 archived 인가** — multi-sub-sprint 의 경우

### 19.2 Failure 시 동작

- **Hard fail** (default): release tag 생성 block. CI exit 1.
- **Soft fail** (override): `--emergency-override <reason>` flag → audit emit + SQM 점수 감점 -10 + release 진행

### 19.3 CI 통합

```yaml
# .github/workflows/release.yml (excerpt)
jobs:
  release-precheck:
    steps:
      - name: Self-dogfood gate
        run: |
          ./scripts/check-self-dogfood.sh
          # exit 1 if failed
```

### 19.4 v2.1.19 자체에 대한 적용

v2.1.19 는 master sprint v2119-bkit-quality-maturation 으로 운영된다. **그러나** § 19.5 의 Bootstrap Exception 가 적용된다 — v2.1.19 자체는 self-dogfood gate 의 *첫 PASS 대상* 이 아니라 *PASS 자격 갖춤 첫 cycle* (v2.1.20 부터 gate hard fail).

### 19.5 ★ Bootstrap Exception (CTO B-1 응답 — chicken-and-egg 영구 해소)

**문제 (CTO B-1 지적)**: § 19.1 의 invariant #1 은 "최근 1 release 가 sprint container 로 운영" 을 요구. 그러나 v2.1.18 = PDCA cycle (sprint container 아님). 즉 v2.1.19 release 시점에 gate 를 활성화하면:
- v2.1.19 자체가 sprint container 로 운영되었더라도, *이전* v2.1.18 가 sprint container 아니므로 first activation 이 self-skipping.
- F1-1 (sprint-orchestrator full live) 가 Day 2 EOD landing → 그 *전* Day 1-2 의 outer sprint dispatch 가 chicken-and-egg.

**해결 — Bootstrap Exception 명시**:

| 단계 | Mode | Gate 발화 | Sprint state |
|------|------|----------|-------------|
| Day 1 (5/22) 시작 시점 | **PDCA-with-sprint-shadow** | Gate 비활성 (bootstrap) | `/sprint init v2119` 실행 → state file 생성. 단 sprint-orchestrator 의 sub-agent dispatch 는 main session 이 manual proxy (v2.1.18 패턴) |
| Day 1-2 (F1-1 진행 중) | PDCA-with-sprint-shadow 유지 | Gate 비활성 | F1-1 구현 + Day 2 EOD 에 sprint-orchestrator 정상 sub-agent dispatch 첫 PASS |
| Day 3-7 (F1-1 landing 후) | **Full sprint mode** | Gate 비활성 (v2.1.19 는 boot) | 모든 sub-sprint S2-S5 가 sprint-orchestrator 의 정상 dispatch 로 진행 — *이 자체가 self-dogfood evidence* |
| v2.1.19 GA 직전 | Pre-release validation | Gate `--bootstrap-mode` flag 활성 | `check-self-dogfood.sh --bootstrap-mode` → invariant #1 skip (이유 audit 강제), invariant #2/#3/#4 가 강제. PASS 시 release 진행 |
| v2.1.20+ | **First true gate** | Gate hard fail mode | v2.1.19 가 직전 release → invariant #1 (sprint container) 정상 PASS → gate first true activation |

**Bootstrap audit emit** (Day 1 sprint init 시점):

```json
{
  "type": "sprint_bootstrap_mode_activated",
  "ts": "2026-05-22T...",
  "details": {
    "sprintId": "v2119-bkit-quality-maturation",
    "predecessorRelease": "v2.1.18",
    "predecessorMode": "pdca_cycle",
    "reason": "first-cycle bootstrap, F1-1 enables sprint-orchestrator full live by Day 2 EOD",
    "gateActivationTarget": "v2.1.20"
  }
}
```

이로써 v2.1.18 의 Self-Referential Meta Risk 가 **정확히 한 번** 의 명시적 exception 으로 영구 해소되고, v2.1.20 부터는 gate 가 first true activation. § 11 R-9 (chicken-and-egg 재발) 의 mitigation 이 Bootstrap Exception 으로 구체화된다.

---

## 20. Appendix A — pruge 10 issues × 5-axis Mapping

| Issue | Title (요약) | Axis (§2.5) | 처리 release | sub-sprint 흡수 |
|-------|-------------|------------|------------|-----------------|
| #92 | sprint-orchestrator M4/M8 미측정 | A1 Sprint Agent Dispatch | v2.1.17 | (closed) — S1 regression lock |
| #93 | gate_fail human-readable report 부재 | A3 Failure Reporter | v2.1.17 | S3 F3-1 (resolution marker 보강) |
| #94 | single quality gate measure 명령 부재 | A2 Trust Level UX | v2.1.17 | (closed) |
| #95 | L2 approval deadlock | A2 Trust Level UX | v2.1.17 | (closed) |
| #100 | sprint-orchestrator Task tool 부재 | A1 Sprint Agent Dispatch | v2.1.18 | S1 F1-1 (full live integration test) |
| #101 | L1 trust mutation 부재 | A2 Trust Level UX | v2.1.18 | (closed) — S1 F1-4 default 격상 |
| #102 | --trust silent ignored | A2 Trust Level UX | v2.1.18 | (closed) |
| **#103** | failure-reporter resolved 표시 부재 | A3 Failure Reporter | **v2.1.19** | **S3 F3-1** |
| **#104** | sprint init context auto-import | A4 Report SoT | **v2.1.19** | **S3 F3-2** |
| **#105** | generateReport qualityGates section + KPI unify | A4 Report SoT | **v2.1.19** | **S3 F3-3 / F3-4** |
| **#107** | SKILL.md path mismatch | A5 Skill Convention Compliance | **v2.1.19** | **S2 F2-1 / F2-2 / F2-3** |

v2.1.19 close 대상: 4건 (#103/#104/#105/#107). 모두 P0/P1, sub-sprint S2/S3 흡수.

---

## 21. Appendix B — bkit Differentiation 7/7 narrative (v2.1.19 GA release notes 초안)

```markdown
## bkit Differentiation 7/7 (v2.1.19)

bkit's differentiation set evolves from 6 → 7 with this release.

### Carry-forward (6)

- **ENH-286 Memory Enforcer** — CLAUDE.md auto-applies to every agent
- **ENH-289 Defense Layer 6** — post-hoc audit alarm pipeline
- **ENH-292 Sequential Dispatch** — sub-agent caching mitigation
- **ENH-300 Effort-aware Adaptive Defense** — effort.level-aware throttling
- **ENH-303 PostToolUse continueOnBlock** — non-blocking PostToolUse alarms
- **ENH-310 Heredoc Detector** — heredoc-bypass guard

### NEW (1)

- **ENH-318 External Dogfooder Feedback Trust Integration** —
  bkit is the first Claude Code plugin to institutionalize the lifecycle
  *external dogfooder issue → fix release → regression test absorption →
  public acknowledgment → trust score component*. External dogfooders
  become trusted partners in bkit's quality system, not just bug reporters.

  Components:
  - Trust Score 7th component: externalDogfoodFeedbackResponseRate (weight 0.05-0.10)
  - `lib/control/external-feedback-tracker.js` — GitHub API polling +
    issue → fix release time tracker
  - `docs/external-dogfooders/<handle>.md` — per-dogfooder contribution
    history archive
  - Real User Hall of Fame — README + CHANGELOG + per-release
    acknowledgment section
  - User-Feedback Lifecycle 5-stage: Issue → Repro Test → Fix →
    Regression Lock → Public Acknowledgment → Trust Reward
  - First entry: @pruge (james kim) — 10 issues / 5 scenarios absorbed
```

---

## 22. 최종 결정 사항 요약

| 결정 | 값 |
|------|-----|
| **v2.1.19 master sprint id** | `v2119-bkit-quality-maturation` |
| **Sub-sprint count** | 5 (S1 Foundation / S2 Defense / S3 Polish / S4 Proactive / S5 Measurement) |
| **Feature count** | 22 |
| **Closes GitHub issues** | #103, #104, #105, #107 |
| **Trust Level (시작)** | L3 |
| **Auto-pause triggers** | 4 기존 + 1 신규 (USER_FEEDBACK_SURGE) |
| **Quality gates** | M1-M10 + S1-S4 + **SQM** (신규) |
| **Success metrics** | 7건 (matchRate / criticalIssue / dataFlow / featureCompletion / cycle time / SQM≥85 / pruge re-occurrence rate) |
| **Trust Score 확장** | 6 → 7 components (외부 dogfooder feedback) |
| **차별화 확장** | 6 → 7 (ENH-318 정식 편입) |
| **CI gate 신설** | `scripts/check-self-dogfood.sh` |
| **Real User Hall of Fame 첫 entry** | @pruge (james kim) |
| **예상 LOC delta** | **+5,000 net** (+5,600 gross / -600 conservative removal, CTO B-3 정정 — 정확한 removal 영역은 design phase 에 확정) |
| **예상 TC 추가** | **120 TC** (총 4,295+ TC) |
| **Budget** | 3M tokens / 56h / 5-7 영업일 (2026-05-22 ~ 2026-05-30) |
| **Predecessor** | v2.1.18 GA (PR #106) |
| **CTO Redline applied** | B-1 (§19.5 Bootstrap Exception) + B-2 (F1-5 → annotate rescope) + B-3 (LOC honest accounting) + M-1 (§9 trigger #5 option (a) 제거) + M-2 (§3.2 worked example) + M-3 (§23 step 0 baseline 측정) + M-4 (§1 SUCCESS #7 outcome-based) + M-5 (§5.3 sequential warmup) + Strategic Insight (§15.4 Dogfooder Acquisition Objective DA-1~DA-4) |
| **Carry-forward to v2.1.20+** | CO-A SQM Phase 2 / CO-B Trust weight recalibration / CO-C Hall of Fame i18n / CO-D Sprint fork/clone/dependency graph / CO-E F1-5 일반 mutation API (B-2 deferred) / CO-F dogfooder population N≥2 active outreach |

---

## 23. 다음 단계 (Immediate Next Actions)

**Step 0 ★ (CTO M-3 요구): v2.1.18 baseline SQM 측정** — sprint kickoff 직전, `lib/quality/sqm-calculator.js` 의 stub 버전을 임시 작성하여 v2.1.18 시점 SQM 점수를 측정. baseline 이 ~70 이상이면 target ≥85 가 trivial → § 7.2 의 target 을 ≥90 로 상향 조정. baseline 이 ~45 이하이면 target ≥85 가 unattainable → target 을 baseline + 25 (예: 70) 로 조정. **이 단계가 끝나야 § 1 의 SUCCESS #5 (SQM ≥85) 가 정량적으로 의미 있다.**

1. **이 master plan 의 PM/CTO/QA validation pass** — `cto-lead` 가 redline 완료 (B-1/B-2/B-3 + M-1~M-5 + Strategic Insight 반영됨, 2026-05-21)
2. **`/sprint init v2119-bkit-quality-maturation --features s1-foundation,s2-defense,s3-polish,s4-proactive,s5-measurement --trust L3 --context-from-master-plan`** — sprint state 초기화 (F3-2 가 아직 없으므로 manual `--context` JSON 으로 시작). **CTO B-1 응답: 본 sprint 는 § 19.5 Bootstrap Exception 모드 — PDCA-with-sprint-shadow 로 운영. F1-1 landing (Day 2 EOD) 후 sprint-orchestrator 정상화 → 그 이후 phase 는 sprint 가 sprint 로 정상 운영.**
3. **S1 Foundation F1-1 시작** — `sprint-orchestrator full live integration test` 구현 (Day 1-2)
4. **pruge 에게 v2.1.19 master plan 공유** — GitHub issues #103/#104/#105/#107 에 link + 진행 update 약속 + 본 master plan 의 dialectical analysis (§ 2) 명시적 공개
5. **`/sprint phase v2119-bkit-quality-maturation --to prd`** 로 outer master sprint 의 prd phase 시작
6. **dogfooder acquisition narrative draft 시작** (§ 15.4) — README + marketplace badge + 2nd dogfooder invitation 시각화

---

**문서 끝.** 본 master plan 은 v2.1.19 진행 중 §13 의 Living document 규칙에 따라 갱신된다. v2.1.19 GA 시점에 readonly 전환되고 `docs/04-report/features/v2119-bkit-quality-maturation.report.md` 가 산출된다.
