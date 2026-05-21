---
template: pm-prd
version: 2.0
feature: s0-sqm-baseline
date: 2026-05-21
author: kay (메인 세션, control level 4 full-auto)
project: bkit
bkit_version: 2.1.18
status: Draft (sprint phase: prd)
sprint_id: s0-sqm-baseline
master_plan: docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md §23 step 0
predecessor: v2.1.18 GA (PR #106, 2026-05-21 06:37Z)
predecessor_sprint: v2118-sprint-trust-ux-fix (PDCA-with-sprint-shadow, archived)
related_master_plan_section: §7.2 (SQM components), §23 (Next Actions step 0)
cto_redline_origin: M-3 (SQM baseline ~58 estimated → 측정 필요)
---

# S0 — v2.1.18 Baseline SQM Measurement (Product Requirements Document)

> **Sprint ID**: `s0-sqm-baseline`
> **Date**: 2026-05-21
> **Author**: kay (메인 세션, control level 4 full-auto 진입 직후)
> **Method**: bkit PDCA full cycle (9-phase: pm→plan→design→do→check→act→qa→report→archive) 운영, sprint 8-phase container 내부 처리
> **Status**: Draft (sprint phase = `prd`)
> **Master Plan reference**: `docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md` §23 step 0 (CTO M-3 응답)
> **Predecessor**: v2.1.18 GA (5 sub-sprint S1~S5 의 모든 precondition)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.1.19 master plan §7.2 의 SQM (Sprint Quality Maturity Index) target ≥85 가 **v2.1.18 시점 baseline 측정 없이는 정량적 의미를 잃는다**. CTO M-3 redline 이 직접 지적: "estimated ~58 추정치에서 ≥85 target 은 baseline ~70+ 이면 trivial, ~45- 이면 unattainable. Day 1 morning 에 v2.1.18 SQM 을 측정해야 정량성이 확보된다." Baseline 부재 상태로 S1~S5 sub-sprint 진행 시 (a) S5 Measurement 의 target 설정이 임의적이 됨, (b) v2.1.19 GA report 가 SQM 점수의 신뢰성을 잃음, (c) pruge 가 본 sprint 결과를 검증할 때 발견 가능한 결함이 됨. |
| **Solution** | `lib/quality/sqm-calculator.js` 의 simple version (stub 아닌 functional) 작성 — 6 component 측정 함수 + weighted sum + 결과 archive. v2.1.18 시점 (master HEAD = e726f15) 의 실측 baseline 산출. 결과에 따라 master plan §7.2 의 target (≥85) 동적 조정: baseline ≥70 → target ≥90 상향, ≤45 → target = baseline + 25 하향, 45-70 → target ≥85 유지. 결과는 `docs/03-analysis/v2118-sqm-baseline.analysis.md` 에 영구 archive + audit log 에 `sqm_baseline_measured` event emit. |
| **Target User** | **Primary**: S5 Measurement sub-sprint (Direct user — S5 의 `lib/quality/sqm-calculator.js` 가 본 S0 의 simple version 을 evolve + dashboard panel + history append). **Secondary**: S1~S4 sub-sprint 의 quality bar 결정자 (S1 의 Self-Dogfood Run Rate target 정량성 + S2 의 Docs=Code Sync Rate target 정량성 + S3 의 Sprint Report KPI Consistency target 정량성 + S4 의 External Dogfooder Feedback Response Rate target 정량성). **Tertiary**: v2.1.19 GA 의 release notes 독자 (Real User Hall of Fame 의 baseline → after 비교 narrative 정량 evidence). |
| **Core Value** | **v2.1.19 의 모든 sub-sprint 가 *정량적 target 정성성* 위에서 운영되도록 한다.** S0 가 없으면 v2.1.19 의 SQM 점수가 fictional. S0 가 있으면 v2.1.18 → v2.1.19 SQM 변화량이 *implementation evidence* 가 된다. ENH-318 External Dogfooder Trust Integration 의 narrative 도 baseline 측정 evidence 위에서만 신뢰 회복. |

---

## 1. Opportunity Discovery (pm-discovery 관점)

### 1.1 Desired Outcome

**Outcome**: "bkit team 이 v2.1.18 시점 sprint domain maturity 를 6-axis weighted SQM 점수로 정량 측정하고, 결과를 v2.1.19 master plan target 결정 + S1~S5 모든 sub-sprint 의 quality bar 설정에 활용한다."

**측정 가능 KR (Key Result)**:
- KR1: v2.1.18 baseline SQM total score 가 0-100 범위 내 정량값으로 산출됨 (`.bkit/runtime/sqm-baseline.json` 영구 archive)
- KR2: 6 component 각각의 실측값이 component-by-component 표로 record (Docs=Code Sync Rate / Sprint Self-Dogfood Run Rate / External Dogfooder Feedback Response Rate / Sprint Report KPI Consistency / Sub-Agent Dispatch Success Rate / Convention Contract Test Pass Rate)
- KR3: master plan §7.2 의 target ≥85 가 baseline 결과에 따라 동적 조정 결정됨 (조정 시 v2119 master plan §7.2 patch + 이유 audit emit)
- KR4: 본 S0 자체가 `lib/quality/sqm-calculator.js` 의 첫 caller — S5 Measurement 가 이 stub 을 evolve 할 baseline reference 확보

### 1.2 Brainstorm — 측정 method options

| Method | Pros | Cons | 채택 |
|--------|------|------|------|
| Static file analysis | 빠름, 재현 가능, baseline 비교에 적합 | 일부 runtime metric 측정 불가 (예: Sub-Agent Dispatch Success Rate 는 audit log 필요) | ✓ (primary) |
| Audit log replay | runtime evidence, 정확 | 과거 audit retention 부족 시 부정확 | ✓ (External Dogfooder + Sub-Agent Dispatch 한정) |
| External API (GitHub) | 정확 (issue created → closed 시간) | rate limit, network 의존 | ✓ (External Dogfooder Feedback Response Rate 한정) |
| Manual estimation | 빠름 | 정량성 부재, CTO M-3 redline 정면 위반 | ✗ |

### 1.3 Prioritize

Method 채택 기준:
1. **Reproducibility**: 동일 input (현재 HEAD git commit) → 동일 output (SQM score)
2. **No external state mutation**: baseline 측정은 read-only, sprint state 변경 없음
3. **Transparent**: 6 component 각각의 raw value 도 영구 record
4. **Conservative**: 부정확한 measurement 보다 차라리 `unknown` 표기 (CTO M-3 의 정량성 요구와 일관)

### 1.4 Experiments

먼저 sqm-calculator.js 의 simple version 작성 후 다음 experiments:
- Exp 1: 44 skills × SKILL.md invariant 측정 → 43/44 vs 44/44 vs 다른 결과?
- Exp 2: 최근 5 release 의 sprint container run rate → master plan 의 "0/5" 추정 vs 실제 record?
- Exp 3: pruge 10 issues 의 24h close rate → master plan 의 "7/10 (70%)" 추정 vs 실제 GitHub timeline?
- Exp 4: v2.1.18 sprint report (PDCA-with-sprint-shadow 모드였으므로 sprint state 없음) → "n/a" 처리 vs 부분 측정?

### 1.5 Opportunity Solution Tree

```
Outcome: v2.1.18 baseline SQM 정량 측정
├── Opportunity O1: 6 component 각각 측정 방법 명확화
│   ├── Solution S1: file system static analysis (44 skills SKILL.md)
│   ├── Solution S2: audit log replay (.bkit/audit/*.jsonl)
│   └── Solution S3: GitHub API query (pruge issues timeline)
├── Opportunity O2: baseline 결과 archive 영구화
│   ├── Solution S4: .bkit/runtime/sqm-baseline.json + sqm-history.jsonl
│   └── Solution S5: docs/03-analysis/v2118-sqm-baseline.analysis.md (human-readable)
└── Opportunity O3: master plan target 동적 조정 의사결정
    ├── Solution S6: baseline 결과 따라 §7.2 target 갱신 (audit emit)
    └── Solution S7: 결과를 S5 Measurement sub-sprint 의 첫 reference 로 전파
```

---

## 2. Strategy (pm-strategy 관점)

### 2.1 Value Proposition (JTBD 6-Part)

| Part | Content |
|------|---------|
| **When** (situation) | bkit team 이 v2.1.19 quality maturation sprint 의 §7.2 SQM target 정량성을 확보해야 할 때 |
| **I want to** (motivation) | v2.1.18 시점 sprint domain maturity 를 6-axis weighted score 로 측정하고 결과를 영구 archive |
| **So I can** (expected outcome) | (a) S1~S5 sub-sprint 의 quality bar 를 정량 baseline 위에서 결정, (b) v2.1.19 GA report 에 baseline→after 변화량을 evidence 로 제시, (c) ENH-318 narrative 의 신뢰성 확보 |
| **Without** (current pain) | 현재 master plan §7.2 의 "estimated ~58" 추정치만 있음. baseline 부재 상태로 v2.1.19 진행 시 SQM 점수가 fictional 이 되고, CTO M-3 redline (정량성 부재) 가 v2.1.19 GA 에 carry-over |
| **Because of** (constraint) | (1) bkit 의 sprint domain 은 v2.1.13 GA 이후 정량 측정 기준이 없었음 (Sprint Report KPI Consistency 같은 자체 진단 metric 미존재), (2) CTO M-3 가 명시적으로 "Day 1 morning baseline 측정" 요구, (3) 본 S0 가 끝나야 S1~S5 의 모든 quality target 이 의미 있는 정량값 |
| **Therefore** (call to action) | `lib/quality/sqm-calculator.js` simple version 작성 + 6 component 측정 + baseline archive + master plan target 동적 조정 |

### 2.2 Lean Canvas (압축 버전 — internal infrastructure 작업이므로 market 부분 생략)

| Block | Content |
|-------|---------|
| Problem | v2.1.18 SQM baseline 부재로 v2.1.19 target 정량성 손상 |
| Customer | S5 Measurement (direct) + S1~S4 sub-sprint (indirect) + v2.1.19 GA report 독자 |
| Value Proposition | "baseline 측정 없이는 maturity target 이 fictional, 측정 후엔 evidence" |
| Solution | sqm-calculator.js simple + 6 component fns + archive + master plan target 조정 |
| Channels | docs/03-analysis/v2118-sqm-baseline.analysis.md + audit log + master plan §7.2 patch |
| Revenue Streams | (internal infrastructure, N/A) |
| Cost Structure | ~4h main session + ~50K tokens |
| Key Metrics | KR1~KR4 (§1.1) |
| Unfair Advantage | bkit 자체가 측정 source 모두 보유 (audit log + GitHub API + file system) — 외부 dependency 없음 |

---

## 3. Functional Requirements

### FR-1 — `lib/quality/sqm-calculator.js` simple version 작성

**Signature**:
```js
// 단일 진입점
async function computeSqm({ projectRoot, asOf? }): Promise<SqmResult>;

// 6 component functions (모두 0-100 정규화된 number 반환)
async function measureDocsCodeSyncRate({ projectRoot }): Promise<{ value: number, raw: { passed: number, total: number, failures: string[] } }>;
async function measureSprintSelfDogfoodRunRate({ projectRoot, recentN = 5 }): Promise<{ value: number, raw: { sprintRuns: Array<{ version, hasMasterPlan, hasSprintState, archived }> } }>;
async function measureExternalDogfooderFeedbackResponseRate({ projectRoot, since, until }): Promise<{ value: number, raw: { issues: Array<{ number, createdAt, closedAt, hoursToClose, within24h }> } }>;
async function measureSprintReportKpiConsistency({ projectRoot }): Promise<{ value: number, raw: { reports: Array<{ feature, divergenceCount }> } }>;
async function measureSubAgentDispatchSuccessRate({ projectRoot, since }): Promise<{ value: number, raw: { dispatches: number, successes: number } }>;
async function measureConventionContractTestPassRate({ projectRoot }): Promise<{ value: number, raw: { tests: number, passed: number, exists: boolean } }>;

// Result schema
type SqmResult = {
  total: number;          // 0-100 weighted sum
  components: {
    docsCodeSyncRate: { value: number, weight: 0.30, weighted: number, raw: object };
    sprintSelfDogfoodRunRate: { value: number, weight: 0.20, weighted: number, raw: object };
    externalDogfooderFeedbackResponseRate: { value: number, weight: 0.20, weighted: number, raw: object };
    sprintReportKpiConsistency: { value: number, weight: 0.15, weighted: number, raw: object };
    subAgentDispatchSuccessRate: { value: number, weight: 0.10, weighted: number, raw: object };
    conventionContractTestPassRate: { value: number, weight: 0.05, weighted: number, raw: object };
  };
  measuredAt: string;     // ISO timestamp
  bkitVersion: string;    // 측정 시점 BKIT_VERSION
  gitCommit: string;      // 측정 시점 HEAD commit (재현성)
  warnings: string[];     // 측정 실패 / 부분 측정 시 warning
};
```

**Implementation order**:
1. `measureConventionContractTestPassRate` (가장 단순 — test 미존재 → value=0)
2. `measureSubAgentDispatchSuccessRate` (audit log replay)
3. `measureSprintSelfDogfoodRunRate` (master plan/state file existence 체크)
4. `measureSprintReportKpiConsistency` (sprint report 파일 parsing)
5. `measureDocsCodeSyncRate` (44 skills × SKILL.md invariant check)
6. `measureExternalDogfooderFeedbackResponseRate` (GitHub API query — `gh` CLI 활용)

### FR-2 — Baseline 측정 + archive

```js
// scripts/_v2119-s0-measure.js (one-shot 후 S5 에서 cron 으로 evolve)
const result = await computeSqm({ projectRoot: ROOT, asOf: 'v2.1.18-HEAD' });
fs.writeFileSync('.bkit/runtime/sqm-baseline.json', JSON.stringify(result, null, 2));
// + audit emit 'sqm_baseline_measured'
```

### FR-3 — `docs/03-analysis/v2118-sqm-baseline.analysis.md` 작성

Human-readable analysis 문서:
- Total SQM score
- 6 component 각각의 실측값 + raw evidence
- v2119 master plan §7.2 의 estimated baseline (`~58`) 와 실측 비교
- target ≥85 의 정량적 정당성 평가
- master plan §7.2 target 조정 권고 (≥85 유지 / ≥90 상향 / baseline+25 하향)

### FR-4 — master plan §7.2 target 동적 조정 (조정 필요 시)

조정 rule:
- baseline ≥70 → target ≥90 으로 상향 (master plan §7.2 patch + audit emit)
- baseline ≤45 → target = baseline + 25 (예: 30 baseline → 55 target)
- 46 ≤ baseline ≤ 69 → target ≥85 유지 (조정 불필요)

조정 시 master plan §7.2 patch + audit emit `master_plan_patched`.

### FR-5 — Audit log emit

다음 event emit:
- `sqm_baseline_measured`: result.total + 6 component 값 + measuredAt + gitCommit
- `master_plan_patched` (조정 시): from_target / to_target / reason / baseline_score

---

## 4. Non-Functional Requirements

| # | NFR | Target | 검증 방법 |
|---|-----|--------|----------|
| NFR-1 | Reproducibility | 동일 git commit + 동일 audit log → 동일 SQM score (±0) | computeSqm 두 번 호출 비교 |
| NFR-2 | Read-only | sprint state, source code, master plan 등 *측정 자체* 는 mutation 없음 (archive 만 별도) | `git status` 측정 전후 비교 |
| NFR-3 | Performance | 측정 전체 1회 호출 < 30초 (GitHub API rate limit 회피) | `time node ...` 측정 |
| NFR-4 | Robustness | partial failure (예: GitHub API down) 시 `warnings[]` 에 명시 + 가능한 component 만 측정 | network down simulation |
| NFR-5 | Transparency | 모든 component value 는 weighted=value×weight 로 명시적 contribution 추적 가능 | result JSON inspection |
| NFR-6 | Audit completeness | sqm_baseline_measured event 가 .bkit/audit/<date>.jsonl 에 정상 emit | `grep sqm_baseline_measured` |

---

## 5. User Stories

### US-1 — bkit maintainer (kay) 가 v2.1.18 baseline SQM 을 측정한다

```
GIVEN bkit-claude-code 가 v2.1.18 GA 시점 (HEAD=e726f15)
AND control level 4 (full-auto) 설정됨
AND sprint s0-sqm-baseline 가 phase=prd 로 init 됨
WHEN bkit maintainer 가 `node scripts/_v2119-s0-measure.js` 실행
THEN .bkit/runtime/sqm-baseline.json 가 생성됨
AND docs/03-analysis/v2118-sqm-baseline.analysis.md 가 작성됨
AND audit log 에 sqm_baseline_measured event 가 emit됨
AND result.total 이 0-100 범위 내 정량값
```

### US-2 — S5 Measurement sub-sprint 가 본 baseline 을 reference 로 활용

```
GIVEN S5 Measurement sub-sprint 가 시작됨
AND .bkit/runtime/sqm-baseline.json 가 존재함
WHEN S5 F5-1 (sqm-calculator evolve) 가 본 simple version 을 starting point 로 사용
THEN S5 의 SQM dashboard panel + sqm-history.jsonl 가 첫 번째 entry 로 v2.1.18 baseline 을 표시
AND v2.1.19 GA 시점 측정값과 baseline 의 delta 가 release notes 에 명시됨
```

### US-3 — v2.1.19 GA 의 release notes 독자가 SQM 변화 evidence 를 확인

```
GIVEN v2.1.19 GA published
AND release notes 에 SQM 섹션 포함됨
WHEN 사용자 (특히 pruge) 가 release notes 를 읽음
THEN v2.1.18 baseline SQM 점수와 v2.1.19 시점 SQM 점수가 모두 명시되어 있음
AND 6 component 각각의 변화 (예: Docs=Code Sync Rate 43/44 → 44/44) 가 component-by-component 표로 표시됨
AND baseline 측정의 evidence (gitCommit, measuredAt) 가 archive 에 있음
```

### US-4 — pruge 가 baseline 측정 결과를 검증

```
GIVEN pruge 가 v2.1.19 release notes 를 receive
AND .bkit/runtime/sqm-baseline.json 가 public commit 됨
WHEN pruge 가 본인의 dandi-village-ledger 에서 동일 6 component 를 측정 (replay)
THEN 동일 git commit 기준 동일 SQM score 가 산출됨 (reproducibility)
AND pruge 가 측정 method 자체에 신뢰 가짐 (ENH-318 narrative 의 evidence)
```

### US-5 — master plan §7.2 target 의 정량적 정당성 확보

```
GIVEN v2.1.18 baseline SQM score 가 측정됨
WHEN bkit team 이 master plan §7.2 의 target ≥85 의 정당성을 평가
THEN baseline 값 따라 (a) ≥85 유지 (46≤baseline≤69), (b) ≥90 상향 (baseline≥70), (c) baseline+25 (baseline≤45) 의사결정이 가능
AND master plan §7.2 patch + audit emit 으로 결정 기록
```

---

## 6. Test Scenarios

### TS-1 — Reproducibility (NFR-1)

```bash
# 동일 git commit 에서 computeSqm 두 번 호출 → 동일 결과
git checkout e726f15
node scripts/_v2119-s0-measure.js > /tmp/sqm-1.json
node scripts/_v2119-s0-measure.js > /tmp/sqm-2.json
diff /tmp/sqm-1.json /tmp/sqm-2.json
# Expected: 0 difference (measuredAt 만 다름)
```

### TS-2 — Read-only invariant (NFR-2)

```bash
git status --short > /tmp/git-status-before.txt
node scripts/_v2119-s0-measure.js
git status --short > /tmp/git-status-after.txt
diff /tmp/git-status-before.txt /tmp/git-status-after.txt
# Expected: 측정 산출물 (.bkit/runtime/sqm-baseline.json + docs/03-analysis/v2118-*.md) 만 추가, 기존 source 변경 없음
```

### TS-3 — Component independence

각 component 함수 독립 호출 → 다른 component 의 raw data 미오염
```js
const docsCodeSync = await measureDocsCodeSyncRate({ projectRoot });
const sprintReport = await measureSprintReportKpiConsistency({ projectRoot });
assert.equal(docsCodeSync.raw.failures, ...); // 독립 정의
```

### TS-4 — Partial failure handling (NFR-4)

```bash
# GitHub API 응답 실패 시 (token invalid 등)
unset GH_TOKEN
node scripts/_v2119-s0-measure.js
# Expected: External Dogfooder Feedback Response Rate component 만 value=null, warnings=['github_api_failure'], 나머지 component 정상 측정
```

### TS-5 — Audit emit verification

```bash
node scripts/_v2119-s0-measure.js
grep "sqm_baseline_measured" .bkit/audit/$(date +%Y-%m-%d).jsonl
# Expected: action=sqm_baseline_measured, target=v2.1.18-baseline, details.total=<number>, details.gitCommit=e726f15
```

### TS-6 — master plan target 조정 evidence

baseline 결과에 따라 master plan §7.2 표 column 갱신 (`target ≥85` → 실측값에 따라 조정). git diff 로 확인.

---

## 7. Pre-mortem (Top 3 위험 시나리오)

### PM-1 — baseline 측정값이 부정확 (예: 90으로 측정되어 거의 변화 여지 없음)

**Risk**: 6 component 측정 중 일부가 너무 관대 (예: Sub-Agent Dispatch Success Rate 가 모든 audit 을 success 로 카운트) → SQM total 이 inflated.

**Mitigation**:
- TS-3 Component independence + raw data inspection 강제
- 각 component 의 raw value 를 docs/03-analysis/v2118-sqm-baseline.analysis.md 에 명시 → 측정 method 자체를 reviewable
- CTO redline pass — 본 PRD 직후 cto-lead 가 component 정의 검증

### PM-2 — GitHub API rate limit 으로 측정 실패

**Risk**: External Dogfooder Feedback Response Rate 측정 시 `gh api` rate limit (60/hour for unauthenticated) hit → component value=null → SQM total 부정확.

**Mitigation**:
- NFR-4 partial failure handling: 측정 실패 component 는 `value=null`, weighted=0, warnings 명시 (CTO 가 본인 redline 에서 conservative 권고)
- `gh auth status` 사전 확인 + token expiry 30 일 이상 남았는지 verify (현재 token 다 valid 확인됨)

### PM-3 — sqm-calculator.js 의 simple version 이 S5 evolve 와 incompatible

**Risk**: 본 S0 가 작성한 lib/quality/sqm-calculator.js 가 너무 ad-hoc 이라 S5 Measurement 에서 reuse 안되고 재작성 → S0 작업의 가치 손실.

**Mitigation**:
- FR-1 의 signature design 이 S5 의 evolve 가능하도록 future-proof (component 함수가 명확히 분리, weighted sum 은 단일 함수, 결과 schema 는 stable)
- 본 PRD § 3 의 FR-1 schema 를 cto-lead 가 redline pass 에서 검증
- S5 F5-1 design phase 에서 본 simple version 을 그대로 evolve 하는 것이 기본 path 임을 명시

---

## 8. Out-of-Scope

- SQM Phase 2 (industry benchmark 통합) — v2.1.20+ CO-A carry
- SQM dashboard panel (F5-2 작업) — S5 Measurement
- SQM history append on every release — F5-3 작업 (S5 가 본 baseline 을 first entry 로 활용)
- Trust Score 7-Component 통합 — S4 Proactive F4-1 작업 (S0 는 trust score 변경 없음)
- 다른 sub-sprint (S1~S5) 의 직접 작업 — S0 는 *precondition only*
- 6 component 의 weight 재조정 (master plan §7.2 의 weight 가 baseline 의 정량성 결정과 무관) — v2.1.20+ CO-B carry

---

## 9. Dependencies

### 9.1 Inputs (S0 시작 전 만족되어야 함)

- ✓ master plan committed (e700d4b, feature/v2119-quality-maturation 브랜치)
- ✓ control level 4 설정 (full-auto, setBy=user-explicit-request)
- ✓ sprint s0-sqm-baseline init (phase=prd, context anchors 5/5 채워짐)
- ✓ 6 component 측정 source 모두 접근 가능 (file system + audit log + GitHub API)

### 9.2 Outputs (S0 archive 시 산출되어야 함)

| Output | 위치 |
|--------|------|
| `lib/quality/sqm-calculator.js` | new file (simple functional, S5 가 evolve) |
| `scripts/_v2119-s0-measure.js` | new file (one-shot measurement script) |
| `.bkit/runtime/sqm-baseline.json` | new file (machine-readable result) |
| `docs/03-analysis/v2118-sqm-baseline.analysis.md` | new file (human-readable analysis) |
| `docs/01-plan/features/s0-sqm-baseline.plan.md` | new file (PDCA plan phase) |
| `docs/02-design/features/s0-sqm-baseline.design.md` | new file (PDCA design phase) |
| `docs/04-report/features/s0-sqm-baseline.report.md` | new file (PDCA report phase) |
| master plan §7.2 patch (조정 필요 시) | docs/01-plan/features/v2119-bkit-quality-maturation.master-plan.md inline patch |
| audit events | `sqm_baseline_measured` + (선택) `master_plan_patched` |

### 9.3 Downstream consumers

- **S5 Measurement** F5-1: 본 simple version 을 evolve (full functionality + dashboard 통합)
- **S5 Measurement** F5-3: 본 baseline 을 sqm-history.jsonl 의 first entry 로 활용
- **S1~S4 sub-sprint**: 각각의 quality bar 결정 시 본 baseline 의 component 별 raw value 를 reference
- **v2.1.19 GA release notes**: baseline → after delta narrative

---

## 10. Acceptance Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| AC-1 | `lib/quality/sqm-calculator.js` 가 6 component 함수 + computeSqm entry point 모두 export | `node -e "Object.keys(require('./lib/quality/sqm-calculator.js'))"` |
| AC-2 | `node scripts/_v2119-s0-measure.js` 실행 시 .bkit/runtime/sqm-baseline.json 생성 | `ls -la .bkit/runtime/sqm-baseline.json` |
| AC-3 | result.total 이 0-100 범위 내 정량값 | JSON.parse + numeric check |
| AC-4 | result.components 가 6 components 모두 weighted contribution + raw data 포함 | result schema validation |
| AC-5 | result.gitCommit 가 HEAD commit hash | `git rev-parse HEAD` 와 일치 |
| AC-6 | docs/03-analysis/v2118-sqm-baseline.analysis.md 가 6 component table + total score + master plan target 조정 권고 포함 | manual inspection |
| AC-7 | audit log 에 `sqm_baseline_measured` event emit (action / target / details.total / details.gitCommit) | `grep sqm_baseline_measured .bkit/audit/*.jsonl` |
| AC-8 | TS-1 (Reproducibility) PASS | TS-1 실행 + diff 0 |
| AC-9 | TS-2 (Read-only) PASS | TS-2 실행 + diff 0 |
| AC-10 | matchRate (PDCA Check phase) ≥ 90% (gap-detector design vs implementation) | `/pdca analyze s0-sqm-baseline` |
| AC-11 | master plan §7.2 target 조정 결정 record (유지 / 상향 / 하향) | master plan diff + audit emit |
| AC-12 | sprint state 가 archived (terminal) | `cat .bkit/state/sprints/s0-sqm-baseline.json | jq .phase` = "archived" |

---

## 11. Success Metrics (PRD-level)

| # | Metric | Target | 측정 시점 |
|---|--------|--------|----------|
| 1 | SQM baseline total score 산출 | 0-100 범위 정량값 | AC-3 verification |
| 2 | 6 component raw value capture | 6/6 | AC-4 verification |
| 3 | matchRate (Design ↔ Code) | ≥ 90% (iterate 후 100%) | PDCA Check phase |
| 4 | criticalIssueCount | 0 | code-analyzer (PDCA Do phase) |
| 5 | S0 sprint cycle time | ≤ 8h | sprint state `phaseHistory` 의 prd → archived 시간 |
| 6 | Reproducibility (NFR-1) | 동일 input → 동일 output (±0) | TS-1 |
| 7 | Audit completeness (NFR-6) | sqm_baseline_measured event emit | TS-5 |

---

## 12. Stakeholder Map

| Role | Stakeholder | Interest | 본 PRD 의 응답 |
|------|------------|----------|---------------|
| Direct user | S5 Measurement sub-sprint | sqm-calculator.js evolve 시 본 simple version 을 starting point | §3 FR-1 의 future-proof signature design |
| Indirect user | S1~S4 sub-sprint | 각각의 quality bar 결정 시 baseline component raw value reference | §1.1 KR3 + §10 AC-11 |
| External validator | @pruge (외부 dogfooder) | 측정 method 자체의 신뢰성 + reproducibility | §6 TS-1 + ENH-318 narrative |
| Internal team | kay (project owner) | baseline → after evidence 가 v2.1.19 quality 의 정량 narrative | §11 metric 1-7 |
| CTO redline source | (cto-lead M-3) | "Day 1 morning baseline 측정" 요구의 실행 | §0 Executive Summary Problem |

---

## 13. Master Plan §7.2 Patch Decision Tree

baseline 측정 결과에 따른 master plan §7.2 의 SQM target 동적 조정:

```
result.total < 30  → 측정 자체 의심, cto-lead re-review (S0 abort 가능성)
result.total 30-45 → master plan §7.2 target 하향: ≥85 → ≥(baseline+25) (예: 40 → 65)
result.total 46-69 → master plan §7.2 target 유지: ≥85
result.total 70-84 → master plan §7.2 target 상향: ≥85 → ≥90
result.total 85+   → master plan §7.2 target 추가 상향: ≥85 → ≥(baseline+8) (예: 90 → ≥98)
                     + Mission 재조정 ("maturity sprint" 가 의미 약화 — v2.1.20+ scope 재고)
```

각 결정 path 마다 audit emit `master_plan_patched` + reason 명시.

---

## 14. 다음 phase (sprint advance)

본 PRD 완료 시:
1. sprint phase: `prd` → `plan` 자동 advance (L4 full-auto, M8 designCompleteness gate 통과)
2. `docs/01-plan/features/s0-sqm-baseline.plan.md` 작성 (cto-lead architectural redline 포함)
3. sprint state 갱신 + audit emit `phase_transition`

---

**문서 끝.** 본 PRD 는 v2.1.19 master plan §23 step 0 의 precondition 충족 목적. S0 archive 후 master plan target 동적 조정 + S1~S5 sub-sprint 의 quality bar 정량성 확보.
