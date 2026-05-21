---
template: pm-prd
version: 2.0
feature: s4-proactive
date: 2026-05-21
author: kay (메인 세션, control L4, Bootstrap Exception 모드)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: prd)
sprint_id: s4-proactive
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §4.4 + §15.4
predecessor_sprint: s1-foundation (archived)
absorbed_carryovers: ['CO-S0-4 (pruge response rate 100% evidence)']
---

# S4 — External Dogfooder Lifecycle (PRD)

> **Mission**: 외부 dogfooder feedback 을 bkit governance 의 정량적 자산으로 흡수. ENH-318 정식 편입 + 차별화 6/6 → 7/7 + Real User Hall of Fame 첫 entry @pruge + CTO Strategic Insight (§15.4 DA-1~DA-4) Dogfooder Acquisition Objective 첫 실증.

## Executive Summary (4-Perspective)

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit 의 Trust Score 6 components 모두 internal metric (pdcaCompletionRate / gatePassRate / rollbackFrequency / destructiveBlockRate / iterationEfficiency / userOverrideRate). 외부 dogfooder feedback (issue 등록 → fix release 시간) 이 trust score 에 *영구* 반영 안됨. pruge 가 매 1-2일 새 issue 등록해도 trust 자동 감점 없고, 24h 내 fix 해도 trust 자동 가점 없음. **Master Plan §3.2 + ENH-318 응답 필요**. 또한 §15.4 의 dogfooder population N=1 문제 — pruge 1명 churns 시 ENH-318 framework 가 one-tenant case study 가 됨. |
| **Solution** | **4 features 통합**: F4-1 trust-engine.js 의 components 7개로 확장 (`externalDogfoodFeedbackResponseRate` weight 0.05 conservative, 기존 6 components 비례 0.95 정규화). F4-2 `lib/control/external-feedback-tracker.js` 신설 — GitHub API polling 기반 dogfooder issue → fix release 시간 측정 + audit emit `external_feedback_tracked`. F4-3 Hall of Fame 섹션 (README appendix + `docs/external-dogfooders/_README.md` + `docs/external-dogfooders/pruge.md` 첫 entry) + DA-1~DA-4 Dogfooder Acquisition Objective narrative. F4-4 pruge dandi-village-ledger 시나리오 5건 E2E regression test (#100/#101/#102/#107 + general sprint flow). |
| **Function/UX Effect** | (a) `lib/control/trust-engine.js` 의 `loadTrustScore()` 가 7번째 component 값 포함 — trust profile 변동. (b) `node lib/control/external-feedback-tracker.js --refresh` 명령으로 GitHub API query → tracked issues update. (c) README 의 "Real User Hall of Fame" 섹션 + "bkit Early Adopter Program" CTA narrative 등재. (d) `docs/external-dogfooders/pruge.md` 가 pruge contribution history archive — v2.1.19 의 ENH-318 narrative 의 evidence. (e) `test/e2e/external-dogfood/dandi-*.test.js` 5건 — pruge dandi 시나리오의 영구 regression lock. |
| **Core Value** | **ENH-318 차별화 6/6 → 7/7 확장 정식 편입**. v2.1.18 의 turnaround promise ("24h 이내 fix") → v2.1.19 의 *measured guarantee* (externalDogfoodFeedbackResponseRate trust component + Hall of Fame public acknowledgment). pruge 가 v2.1.19 GA 후 본인 issue 가 bkit 의 영구 regression test 가 된 것 확인 가능 → bkit 의 외부 dogfooder partner narrative 가 marketing 이 아닌 *evidence-driven*. §15.4 DA-1~DA-4 첫 실증으로 N=1 → N≥2 acquisition narrative 시작. |

## Functional Requirements

### FR-1: Trust Score 7-Component 확장 (F4-1, 280 LOC, 5 TC)

- `lib/control/trust-engine.js` 의 components object 에 7번째 component 추가:
  ```js
  externalDogfoodFeedbackResponseRate: { weight: 0.05, value: 0 }
  ```
- 기존 6 components 의 *상대 weight 비율 유지* + 7 components 합 1.00 정규화:
  - 기존: pdcaCompletionRate 0.25 / gatePassRate 0.20 / rollbackFrequency 0.15 / destructiveBlockRate 0.15 / iterationEfficiency 0.15 / userOverrideRate 0.10 (합 1.00)
  - 신규 (relative 유지, 0.95 정규화): 0.2375 / 0.19 / 0.1425 / 0.1425 / 0.1425 / 0.095 + externalDogfoodFeedbackResponseRate 0.05 (합 1.00)
- `loadTrustScore(deps)` 가 7번째 component 의 value 를 `.bkit/state/external-feedback-tracker.json` 에서 load
- `reconcile()` 가 7 components 모두 update

**Worked Example** (CTO M-2 응답 + S4 PRD 정식 명시):
- 사용자 X v2.1.18 시점: [0.25×80, 0.20×85, 0.15×90, 0.15×95, 0.15×75, 0.10×70] = 80.75
- v2.1.19 도입 직후 (externalDogfoodFeedbackResponseRate=0): 기존 6 weight 0.95 비례 + 7번째 0 = 76.71
- Δ = -4.04 (-5.0%), 한계선 정확히 일치
- 30일 후 externalDogfoodFeedbackResponseRate=100 진입 시: 76.71 + 5.0 = 81.71 (Δ +0.96)

### FR-2: external-feedback-tracker (F4-2, 320 LOC, 3 TC)

- `lib/control/external-feedback-tracker.js` 신설:
  - `trackIssue({ owner, repo, dogfooders, since, until })` — GitHub API query
  - `computeResponseRate({ issues, dogfooders })` — closed/closed within 24h ratio
  - `persistToFile(result, filePath)` — `.bkit/state/external-feedback-tracker.json` write
- `scripts/_v2119-s4-feedback-refresh.js` CLI runner — manual refresh
- audit emit `external_feedback_tracked` (NEW ACTION_TYPE)
- Trust component 7 의 source data 제공

### FR-3: Hall of Fame + DA-1~DA-4 (F4-3, 400 LOC, 2 TC)

- `docs/external-dogfooders/_README.md` (NEW, ~80 LOC) — dogfooder lifecycle + benefits + CTA
- `docs/external-dogfooders/pruge.md` (NEW, ~120 LOC) — pruge contribution history archive (10 issues × evidence + 5 absorbed scenarios + Hall of Fame entry)
- `README.md` 의 "Real User Hall of Fame" + "bkit Early Adopter Program" sections (NEW append, ~50 LOC)
- `CHANGELOG.md` 의 "External Dogfooder Contributions" appendix template (NEW, ~30 LOC future template, 실제 entries 는 v2.1.19 GA 시점)
- DA-1: README narrative + CTA
- DA-2: `.claude-plugin/marketplace.json` 의 description 에 dogfooder acquisition narrative 추가 (~20 LOC)
- DA-3: `docs/external-dogfooders/_README.md` 의 5-stage User-Feedback Lifecycle 시각화 (위 file 의 일부)
- DA-4: carry to v2.1.20+ (30일 후 dogfooder population 측정 — v2.1.19 scope 외)

### FR-4: pruge dandi 시나리오 5건 E2E (F4-4, 580 LOC, 2 TC)

- `test/e2e/external-dogfood/` 디렉토리 신설
- 5 시나리오 E2E test files (each ~100 LOC):
  - `dandi-100-orchestrator-task-tool.test.js` — #100 sprint-orchestrator Task dispatch 검증 (F1-1 의 e2e 확장)
  - `dandi-101-trust-mutation.test.js` — #101 L1 lockout escape (v2.1.18 `/sprint trust` evidence)
  - `dandi-102-trust-alias.test.js` — #102 `--trust` alias acceptance (v2.1.18 normalizeTrustLevel evidence)
  - `dandi-107-skill-md-path.test.js` — #107 SKILL.md path drift detection (v2.1.19 S2 F2-1 prerequisite — sprint-handler.js 가 bkit-root scripts 사용 verify)
  - `dandi-general-l1-workflow.test.js` — L1 sprint full lifecycle 시나리오 (init L1 → warning → trust escalate → measure → archive)

## Out-of-Scope

- Multi-dogfooder weighted avg (DA-4 — v2.1.20+ 30일 후 첫 측정)
- Hall of Fame i18n (KO/JA/ZH — CO-C v2.1.20+)
- Trust Score weight 재조정 (CO-B v2.1.20+, 30일 데이터 축적 후)
- external-feedback-tracker CI gate 통합 (v2.1.20+, 별도 sub-sprint)

## Acceptance Criteria

| # | AC | Verification |
|---|----|--------------|
| AC-1 | trust-engine.js exports 7 components | grep `externalDogfoodFeedbackResponseRate` |
| AC-2 | worked example test — Δ ≤5% 한계선 | TC-F4-1-U3 |
| AC-3 | external-feedback-tracker.js trackIssue → JSON output | TC-F4-2-U1 |
| AC-4 | gh API fail → graceful warning, no crash | TC-F4-2-U2 (NFR-4 partial failure) |
| AC-5 | README "Real User Hall of Fame" + "Early Adopter Program" sections | grep |
| AC-6 | docs/external-dogfooders/pruge.md exists + valid markdown | file check |
| AC-7 | marketplace.json dogfooder narrative | grep |
| AC-8 | 5 pruge scenarios E2E PASS (or mocked-pass with --skip-on-no-cc) | TC-F4-4-* |
| AC-9 | 5 신규 ACTION_TYPES audit (external_feedback_tracked + hall_of_fame_entry_added + dogfooder_contribution_recorded + trust_component_updated + dandi_scenario_replayed) — only `external_feedback_tracked` mandatory; others optional verification audit | grep |
| AC-10 | matchRate ≥90 | PDCA check |
| AC-11 | criticalIssueCount=0 | code-analyzer |
| AC-12 | sprint phase=archived | state |

## Dependencies

- ✓ S1 archived (sprint-orchestrator dispatch baseline)
- ✓ S0 baseline SQM measurement (externalDogfooderFeedbackResponseRate=100 measured)
- gh CLI authenticated (pruge issues query)

## CO-S0-4 absorption

S0 measurement evidence (closed-only metric 100% response rate, 7/7 within 24h) 는 F4-3 narrative + F4-4 e2e tests 의 *정량 baseline*. README + pruge.md + marketplace narrative 모두 본 evidence 인용.

---

**문서 끝.** PRD complete. Plan phase 진입.
