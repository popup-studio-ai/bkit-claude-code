---
template: analysis
version: 2.0
feature: s0-sqm-baseline
date: 2026-05-21
author: kay (메인 세션 + sqm-calculator.js)
project: bkit
bkit_version: 2.1.18
sprint_id: s0-sqm-baseline
master_plan_anchor: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §7.2 + §23 step 0
git_commit_measured: (see `.bkit/runtime/sqm-baseline.json`.gitCommit)
---

# v2.1.18 Baseline SQM Measurement — Analysis

> **Sprint phase**: report (S0)
> **Measurement source**: `lib/quality/sqm-calculator.js` (v2.1.19 simple version)
> **Measurement script**: `scripts/_v2119-s0-measure.js`
> **Runtime archive**: `.bkit/runtime/sqm-baseline.json`
> **Test verification**: 30 tests PASS (L1 19 + L2 7 + L3+L4 4) — target 11, 2.73× 초과

---

## 1. Executive Summary

| Metric | Value |
|--------|-------|
| **Total SQM Score** | **59.75 / 100** |
| Master plan §7.2 estimated baseline | ~58 |
| Delta (실측 vs estimate) | +1.75 (실측이 약간 높음) |
| Target zone | 46-69 (CTO M-3 decision tree §3) |
| **Decision** | **master plan §7.2 target ≥85 *유지* — 조정 불필요** |

총 6 components 의 weighted contribution:

| # | Component | value | weight | weighted | status |
|---|-----------|-------|--------|----------|--------|
| 1 | docsCodeSyncRate | 93 | 0.30 | 27.90 | ✓ measured |
| 2 | sprintSelfDogfoodRunRate | 0 | 0.20 | 0.00 | ✓ measured |
| 3 | externalDogfooderFeedbackResponseRate | 100 | 0.20 | 20.00 | ✓ measured |
| 4 | sprintReportKpiConsistency | 79 | 0.15 | 11.85 | ✓ measured |
| 5 | subAgentDispatchSuccessRate | null | 0.10 | 0.00 | ⚠ unmeasurable (sprint-orchestrator dispatch 미활성) |
| 6 | conventionContractTestPassRate | 0 | 0.05 | 0.00 | ✓ measured (testsExist=false) |
| **Total** | | **59.75** | 1.00 | **59.75** | 1 warning |

---

## 2. Component-by-Component Analysis

### 2.1 docsCodeSyncRate = 93 (weight 0.30, weighted 27.90)

**Master plan estimate**: 43/44 (97.7%) — **sprint skill 만 #107 drift**
**실측**: **41/44 (93%)** — **3건 drift 발견**

3건 SKILL.md drift 상세:

| Skill | Failure |
|-------|---------|
| `phase-3-mockup` | SKILL.md declares "scripts/app.js" but file not found (neither skill-local nor bkit-root) |
| `phase-9-deployment` | SKILL.md declares "scripts/check-env.js" — file not found |
| `sprint` (#107) | SKILL.md declares "scripts/sprint-handler.js" but actual file is at <bkit-root>/scripts/sprint-handler.js (path drift) |

### 2.1.1 ★ 새 발견 — pruge #107 보다 광범위한 drift

**Critical finding**: master plan §7.2 의 estimate (43/44, sprint 만 drift) 가 부정확. 실측 41/44 — pruge 가 보고한 sprint skill 외에 **phase-3-mockup, phase-9-deployment** 도 drift. 두 skill 모두 LLM dispatcher 가 SKILL.md 의 declared path 따라 resolve 시도하면 동일한 `MODULE_NOT_FOUND` 류 round-trip 가능.

**v2.1.19 S2 Defense F2-2 scope impact**:
- 기존 plan: 1 skill drift fix (#107 sprint)
- 실측 후: **3 skill drift fix** (sprint + phase-3-mockup + phase-9-deployment)
- S2 F2-2 의 `check-skills-docs-code-sync.js` 가 44 skills × invariant 검증 → 자동 detect (이미 본 measurement 가 detection logic 의 prototype)
- pruge 에게 답글 update 시 새 발견 명시 권고

### 2.2 sprintSelfDogfoodRunRate = 0 (weight 0.20, weighted 0)

**Master plan estimate**: 0/5 (0%) — v2.1.14~v2.1.18 모두 sprint container 아님
**실측**: **0/5 (0%) — 정확히 일치**

| Version | masterPlanExists | sprintStateArchived | runAsSprint |
|---------|------------------|---------------------|-------------|
| v2.1.14 | false | false | false |
| v2.1.15 | false | false | false |
| v2.1.16 | false | false | false |
| v2.1.17 | false | false | false |
| v2.1.18 | false | false | false |

**Note**: v2.1.16 의 `docs/01-plan/features/v2116-issue-fixes.master-plan.md` 가 존재하지만 prefix 매칭 (`v2116-*`) 에서 못 찾음 — pattern 정확성 issue. S5 F5-1 evolve 시 보완 가능 (component value 에는 영향 없음 — 모두 false 인 결과는 동일).

**v2.1.19 S1 Foundation 의 mission 직접 정당화**: 이 component 가 0 → 100 (v2.1.19 자체가 첫 sprint run) 로 변화하면 SQM total 에 +20 contribution.

### 2.3 externalDogfooderFeedbackResponseRate = 100 (weight 0.20, weighted 20)

**Master plan estimate**: 70 (pruge 10 이슈 중 7 within 24h)
**실측**: **100 (closed 7건 모두 24h 이내, open 4건 분모 제외)**

상세:
- Window: 2026-04-21 ~ 2026-05-21 (trailing 30d, ADR S0-003)
- Total issues in window: 11 (pruge author)
- Closed: 7 (모두 24h 이내)
- Open (현재): 4 (#103, #104, #105, #107 — v2.1.19 작업 대상)
- Response rate = 7 closed / 7 closed = **100%**

**Note**: 실측이 estimate 보다 30 point 높은 이유는 **open issues 분모 제외 rule**. master plan 의 추정은 "10건 중 7건 close" 였지만 sqm-calculator 가 ADR-driven 으로 "closed 만 분모" — 더 정확한 metric.

**v2.1.19 narrative impact**: ENH-318 External Dogfooder Trust Integration 의 evidence narrative 가 **70 → 100** 변환 — Hall of Fame entry @pruge 의 evidence 가 강력. release notes 에 본 baseline 명시 권고.

### 2.4 sprintReportKpiConsistency = 79 (weight 0.15, weighted 11.85)

**Master plan estimate**: null (v2.1.18 PDCA-with-sprint-shadow, no sprint report)
**실측**: **79** — sprint report 다수 존재하지만 KPI/qualityGates 섹션 누락 많음

상세 (전체 14 reports):

| Feature | hasKpi | hasQg | divergenceCount |
|---------|--------|-------|----------------|
| v2116-issue-fixes | true | true | 0 |
| v2118-sprint-trust-ux-fix | true | true | 0 |
| v2116-release-hardening | true | false | 1 |
| v2117-ci-cd-hardening | false | false | 1 |
| v2118-carryover-cleanup | false | false | 1 |
| v2114-alwaysload-measurement | false | false | 1 |
| issue-89-pdca-status-fix | false | false | 1 |
| cc-v2144-v2145-impact-analysis | false | false | 1 |
| cc-v2145-v2146-impact-analysis | false | false | 1 |
| (5 others) | varies | varies | varies |

Total divergences = 12 / 56 checks (14 reports × 4 KPI checks) → consistencyRate = 1 - 12/56 = 0.786 → **79**

**v2.1.19 S3 Polish F3-3 scope impact**: 14 reports 중 12 개가 KPI Snapshot 또는 qualityGates section 누락 (#105 의 정확한 정량 evidence). S3 의 작업 후 모든 future report 가 두 섹션 강제 포함 → divergence 0 → component 100 → SQM total +3.15.

### 2.5 subAgentDispatchSuccessRate = null (weight 0.10, weighted 0)

**Master plan estimate**: null (sprint-orchestrator dispatch 미활성)
**실측**: **null — 정확** (window 내 sprint-orchestrator/sprint-master-planner/sprint-qa-flow/sprint-report-writer 의 sub-agent dispatch event 0건)

**v2.1.19 S1 Foundation 의 직접 evidence**: 이 component 가 null → 100 (S1 F1-1 sprint-orchestrator full live 후) 으로 변화하면 SQM total +10 contribution.

### 2.6 conventionContractTestPassRate = 0 (weight 0.05, weighted 0)

**Master plan estimate**: 0 (test 미존재)
**실측**: **0 — 정확** (`test/contract/baseline/skills-convention.json` 미존재)

**v2.1.19 S2 Defense F2-4 의 직접 evidence**: 이 component 가 0 → 99 (S2 F2-4 작성 후) 으로 변화하면 SQM total +4.95 contribution.

---

## 3. v2.1.19 SQM Trajectory (예상)

각 sub-sprint 가 component 에 미치는 영향:

| Component | v2.1.18 baseline | After S1 | After S2 | After S3 | After S4 | After S5 (target) |
|-----------|-----------------|----------|----------|----------|----------|------------------|
| docsCodeSyncRate (0.30) | 93 | 93 | **100** (3 drift fix) | 100 | 100 | 100 |
| sprintSelfDogfoodRunRate (0.20) | 0 | **100** (v2.1.19=sprint) | 100 | 100 | 100 | 100 |
| externalDogfooderFeedback (0.20) | 100 | 100 | 100 | 100 | 100 | 100 |
| sprintReportKpiConsistency (0.15) | 79 | 79 | 79 | **100** (F3-3) | 100 | 100 |
| subAgentDispatchSuccessRate (0.10) | null (0) | **95+** (F1-1 live) | 95+ | 95+ | 95+ | 95+ |
| conventionContractTestPassRate (0.05) | 0 | 0 | **99+** (F2-4) | 99+ | 99+ | 99+ |
| **SQM Total** | **59.75** | **~90** | **~96** | **~99** | **~99** | **~99** |

**v2.1.19 GA target**: SQM ≥85 (master plan §7.2) → **실측 trajectory 예상 ~99** — target 충분히 초과.

**CTO M-3 redline 응답 verification**: baseline 59.75 → target 85 (gain +25.25) 가 정량적으로 의미 있음. Decision tree §3 의 "46-69 zone → target 유지" 결정 정당.

---

## 4. Master Plan §7.2 Target Decision

### 4.1 PRD §13 Decision Tree application

baseline 59.75 → falls in **46-69 zone** → **target ≥85 유지** (조정 없음).

### 4.2 Justification

- baseline 가 30 미만이 아니므로 측정 자체 신뢰 가능
- baseline 가 70 이상이 아니므로 target 상향 (≥90) 부적합
- baseline 가 45 이하가 아니므로 target 하향 (baseline+25) 부적합
- **46-69 mid-zone 정확히 일치 — target ≥85 유지가 가장 정량적으로 합리적**

### 4.3 Action

- master plan §7.2 의 "v2.1.19 target" 컬럼 변경 없음
- master plan §7.2 의 "v2.1.18 baseline" 컬럼: **estimated ~58 → 실측 59.75 갱신** (CTO M-3 정량성 충족)
- audit emit `master_plan_patched` (baseline column only, target 미변경)

### 4.4 master plan §7.2 patch (이 직후 적용)

```diff
-| **SQM Total** | 1.00 | weighted sum × 100 | ~58 (baseline 추정) | **≥85** |
+| **SQM Total** | 1.00 | weighted sum × 100 | **59.75 (실측 v2.1.18 baseline, S0 measurement)** | **≥85** |
```

---

## 5. 새 발견 사항 → v2.1.19 sub-sprint scope 영향

### 5.1 ★ Critical finding 1: docs/code drift 가 sprint 외 2건 더 있음

**Impact**: S2 Defense F2-1 (SKILL.md path fix) scope 가 1 skill 에서 **3 skills** 로 확장.

**S2 F2-1 갱신 권고**:
- 기존: sprint skill SKILL.md path 정정 + symlink
- 갱신: **sprint + phase-3-mockup + phase-9-deployment** 3 skills 정정
- LOC est. 60 → 100 (수치적 효과는 small, 확장된 skill 영역 documentation 시간 가산)

### 5.2 ★ Critical finding 2: sprint report KPI/qualityGates 미포함 reports 12/14

**Impact**: S3 Polish F3-3 의 작업이 expected 보다 더 광범위.

**S3 F3-3 갱신 권고**:
- 기존: generateReport 의 `## Quality Gates` section 추가 + KPI SoT 통일
- 갱신: **기존 14 reports 도 backfill 결정** (선택사항)
  - Option A: 미래 sprint report 만 새 format (S3 본래 scope)
  - Option B: 기존 14 reports 도 backfill (이중 작업)
  - **권고 — Option A** (anti-mission "새 기능 추가 X" 따라). 다만 기존 reports 의 divergence count 는 release notes 의 baseline 표현에 활용 가능.

### 5.3 ★ Finding 3: pruge external dogfooder rate = 100%

**Impact**: ENH-318 narrative 가 매우 강력. release notes / Hall of Fame entry 에 evidence 직접 인용.

**S4 F4-3 narrative 갱신 권고**:
- 기존: "bkit is the first CC plugin to institutionalize..."
- 추가: "Measured baseline of 100% response-rate (7/7 closed in <24h) on pruge dandi-village-ledger feedback cycle (v2.1.18 measurement)."

---

## 6. Methodology Verification (NFR check)

| NFR | Target | Verified | Method |
|-----|--------|----------|--------|
| NFR-1 Reproducibility | ±0 across runs | ✓ | L4 TS-1 E2E test PASS |
| NFR-2 Read-only on source | source tree unchanged | ✓ | L4 TS-2 E2E test PASS |
| NFR-3 Performance < 30s | actual measure time | ✓ | < 5s (E2E TS-5 wall clock) |
| NFR-4 Robustness (partial fail) | warnings array | ✓ | subAgentDispatch null with warning, others measured |
| NFR-5 Transparency | weighted = value × weight | ✓ | All 6 components show weight + weighted + raw |
| NFR-6 Audit completeness | sqm_baseline_measured emit | ✓ | L4 TS-5 E2E test PASS |

---

## 7. Conclusion

**v2.1.18 baseline SQM = 59.75** — 정량 측정 완료, CTO M-3 redline 충족, master plan §7.2 target ≥85 유지 결정 정당.

**3 critical findings**:
1. docs/code drift 가 sprint 외 2건 더 (phase-3-mockup + phase-9-deployment) — S2 F2-1 scope 확장
2. sprint report KPI/qualityGates 미포함 reports 12/14 — S3 F3-3 의 정확한 정량 evidence
3. external dogfooder response rate 100% — S4 F4-3 narrative 강력 evidence

본 baseline 은 S5 Measurement F5-1 의 sqm-calculator evolve 시 first regression reference 가 된다. v2.1.19 GA 시점 재측정 → delta 가 release notes 의 evidence 역할.

---

**문서 끝.** `master plan §7.2` patch + sprint report → archive 진행.
