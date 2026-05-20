---
template: report
version: 1.2
feature: v2117-ci-cd-hardening
date: 2026-05-20
author: kay
project: bkit
version: 2.1.17
---

# v2117-ci-cd-hardening — Completion Report

> **Headline**: 5/12 commit `967cd8f` 이후 8일간 누적된 `Invocation Contract Check` red 상태 근본 해결. Agent/MCP tool deprecation governance + Dual baseline + L2/L3 workflow 통합 + Rollforward SOP. 5축 매트릭스 중 4축 close, 1축은 user manual 안내. 회귀 35건 일괄 close + 264 TC 증가.
>
> **Project**: bkit
> **Version**: 2.1.17 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Completed
> **Branch**: `feature/v2117-ci-cd-hardening`

---

## 1. Executive Summary

### 1.1 사고 요약

2026-05-12 commit `967cd8f` (refactor v2.1.13)에서 `agents/pdca-eval-{act,check,design,do,plan,pm}.md` 6 agent를 dead code cleanup으로 제거. baseline `test/contract/baseline/v2.1.9/` manifest는 갱신되지 않음. Agent에는 Skill과 달리 `deprecatedIn` governance 메커니즘 부재 → `Invocation Contract Check` workflow가 매 push마다 6 FAILURE.

8일간 누적된 red 상태에서 v2.1.15 (PR #88), v2.1.16 (PR #96), cc-version-analysis v2.1.145 push 등 4건 release 진행. CI가 게이트 기능 상실.

### 1.2 해결 요약 (5축 매트릭스)

| 축 | 적용된 조치 |
|---|------------|
| Detection | dual baseline (v2.1.9 LTS + v2.1.16 Latest) + L2 smoke + L2 hook attribution + L3 MCP compat + L3 MCP runtime 5 step 추가 |
| Enforcement | (user manual) — Branch protection 설정 가이드 안내 |
| Recovery | Baseline rollforward SOP 가이드 작성 + 의사결정 트리 |
| Governance | Agent + MCP tool에 Skill 패턴 `deprecatedIn` 우회 동등 적용 |
| Evolution | Dual baseline 정책 정착, LTS rollforward 명시적 결정으로 정형화 |

### 1.3 정량 결과

| Metric | Before (v2.1.16 GA) | After (v2.1.17 본 PDCA) | Delta |
|--------|--------------------|-----------------|-------|
| qa-aggregate PASS | 3,808 | 4,103 | +295 |
| qa-aggregate FAIL | 31 | **0** | -31 |
| qa-aggregate Errors | 4 | **0** | -4 |
| Contract L1+L4 (v2.1.9) | 6 FAIL | **252 PASS** | +252 |
| Contract L1+L4 (v2.1.16) | (없음) | **255 PASS** | +255 |
| Workflow steps | 13 | 17 | +4 |
| Active agents | 34 | 34 | 0 (stub 분리) |
| Deprecation tombstones | 0 | 6 | +6 |
| Baseline snapshots | 1 (v2.1.9) | 2 (v2.1.9 + v2.1.16) | +1 |

---

## 2. Deliverables

### 2.1 Code Changes

| File | Type | Change |
|------|------|--------|
| `test/contract/scripts/contract-test-run.js` | Modified | L4 runL4Deprecation 분기 확장 (Agent + MCP `deprecatedIn` 우회). 5개 collect 호출에 `{ persist: false }` 명시. |
| `test/contract/scripts/contract-baseline-collect.js` | Modified | 5개 collect 함수 시그니처 `{ persist, baseDir }` 옵션 추가. projected JSON에 `deprecatedIn`/`replacedBy` 필드 추가. |
| `lib/infra/docs-code-scanner.js` | Modified | `countAgents`가 `deprecatedIn` 있는 agent 제외. helper `hasDeprecatedInFrontmatter` 추가. |
| `agents/pdca-eval-act.md` | Created | Deprecation tombstone (`deprecatedIn: v2.1.13`, `replacedBy: report-generator`) |
| `agents/pdca-eval-check.md` | Created | 동일 패턴 (`replacedBy: gap-detector`) |
| `agents/pdca-eval-design.md` | Created | 동일 패턴 (`replacedBy: design-validator`) |
| `agents/pdca-eval-do.md` | Created | 동일 패턴 (`replacedBy: code-analyzer`) |
| `agents/pdca-eval-plan.md` | Created | 동일 패턴 (`replacedBy: product-manager`) |
| `agents/pdca-eval-pm.md` | Created | 동일 패턴 (`replacedBy: pm-lead`) |
| `tests/qa/bkit-full-system.test.js` | Modified | D1 active agent count filtering 추가 |
| `tests/qa/bkit-deep-system.test.js` | Modified | A9-1 active agent count filtering 추가 |
| `test/contract/invocation-inventory.test.js` | Modified | Active vs deprecated 분리. 6 deprecated stub existence assertion 추가 |

### 2.2 Baseline Snapshot

| Directory | File Count | Purpose |
|-----------|-----------|---------|
| `test/contract/baseline/v2.1.9/` | (unchanged) | LTS baseline — 누적 drift 추적 |
| `test/contract/baseline/v2.1.16/` | 106 (1 manifest + 40 agents + 44 skills + 19 mcp-tools + 1 hook-events + 1 slash-commands) | Latest baseline — noise floor |

### 2.3 CI Workflow

| File | Change |
|------|--------|
| `.github/workflows/contract-check.yml` | step 5 신규: `L1+L4 vs v2.1.16 Latest`, `L2 Smoke`, `L2 Hook Attribution`, `L3 MCP Compatibility`, `L3 MCP Runtime` |
| `.gitignore` | anchor comment 추가 (신규 baseline 디렉터리는 `git add -f` 필요 명시) |

### 2.4 Documentation

| Path | Purpose |
|------|---------|
| `docs/01-plan/features/v2117-ci-cd-hardening.plan.md` | PDCA Plan — 5축 매트릭스, 사고 타임라인, 11 FR |
| `docs/02-design/features/v2117-ci-cd-hardening.design.md` | PDCA Design — algorithm diff, frontmatter schema, 의사결정 트리 |
| `docs/03-analysis/features/v2117-ci-cd-hardening.analysis.md` | PDCA Analysis — gap detection 100% match, 3 추가 발견 처리, 5축 closure 검증 |
| `docs/04-report/features/v2117-ci-cd-hardening.report.md` | 본 문서 |
| `docs/06-guide/contract-baseline-rollforward.guide.md` | SOP — LTS/Latest 정책, 의사결정 트리, 캡처 절차, deprecation stub 작성, PR 체크리스트, 사고 기록 |

---

## 3. Verification Evidence

### 3.1 Local Dry-Run (workflow 모든 step)

| # | Step | Result | TC |
|---|------|:------:|----|
| 1 | `scripts/check-domain-purity.js` | ✅ | 18 files, 0 forbidden |
| 2 | `contract-test-run.js --compare v2.1.9 --level L1,L4` | ✅ | 252 assertions |
| 3 | `contract-test-run.js --compare v2.1.16 --level L1,L4` | ✅ | 255 assertions |
| 4 | `scripts/check-guards.js` | ✅ | 21 guards, 0 warnings |
| 5 | `scripts/docs-code-sync.js` | ✅ | All counts consistent |
| 6 | `scripts/check-deadcode.js` | ✅ | Pre-existing 3 informational |
| 7 | `test/contract/integration-runtime.test.js` | ✅ | 23/23 |
| 8 | `test/contract/l2-smoke.test.js` | ✅ | 98/98 |
| 9 | `test/contract/l2-hook-attribution.test.js` | ✅ | 13/13 |
| 10 | `test/contract/l3-mcp-compat.test.js` | ✅ | 92/92 |
| 11 | `test/contract/l3-mcp-runtime.test.js` | ✅ | 48/48 |
| 12 | `test/contract/scripts/qa-aggregate.js` | ✅ | 4103 PASS / 0 FAIL / 0 Errors |
| 13 | `tests/qa/bkit-full-system.test.js` | ✅ | 36/36 |
| 14 | `test/contract/docs-code-sync.test.js` | ✅ | 36/36 |

**14/14 PASS — 모든 게이트 통과.**

### 3.2 Baseline Mutation Test

```bash
# Before fix
node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4
git status test/contract/baseline/v2.1.9/ | wc -l
# → 75 files modified (FAIL)

# After fix (collect persist=false)
git restore test/contract/baseline/v2.1.9/
node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4
git status test/contract/baseline/v2.1.9/ | wc -l
# → 0 files modified (PASS)
```

### 3.3 Deprecation Governance Test

```bash
# 6 stub agent without deprecatedIn: removed
# Expected: L4 FAIL with original error message
# Verified: 본 PDCA 진행 전 베이스라인 git status

# 6 stub with deprecatedIn: present
# Expected: L4 PASS
# Verified: 252 assertions PASS (v2.1.9 baseline)
```

---

## 4. Maturity Matrix 최종 상태

| 축 | 적용 전 | 적용 후 |
|---|---------|---------|
| Detection | ◐ L1+L4 only | ● L1+L4 dual + L2 + L3 (4 step 통합) |
| Enforcement | ✗ no branch protection | ⚠️ user manual 안내 (CO-1) |
| Recovery | ✗ no SOP | ● Rollforward SOP guide (8 section) |
| Governance | ◐ Skill만 | ● Skill + Agent + MCP tool 대칭 |
| Evolution | ✗ no rollforward | ● Dual baseline + 의사결정 트리 |

**4/5 close, 1/5 user-action required.**

---

## 5. User Action Required

### 5.1 Branch Protection 설정 (P0)

`main` 브랜치에 Required Status Check 활성화 — `Invocation Contract Check` workflow job. 두 가지 방법.

**Option A: GitHub Web UI (권장)**

1. `https://github.com/popup-studio-ai/bkit-claude-code/settings/branches` 접속
2. `Branch protection rules` → `Add rule`
3. Branch name pattern: `main`
4. `Require status checks to pass before merging` 체크
5. `Status checks that are required`: `Contract Test (L1 Frontmatter + L4 Deprecation)` 선택
6. `Require branches to be up to date before merging` 체크
7. (선택) `Require a pull request before merging` 체크
8. Save

**Option B: `gh api`**

```bash
gh api -X PUT /repos/popup-studio-ai/bkit-claude-code/branches/main/protection \
  -F required_status_checks[strict]=true \
  -F required_status_checks[contexts][]='Contract Test (L1 Frontmatter + L4 Deprecation)' \
  -F enforce_admins=false \
  -F required_pull_request_reviews=null \
  -F restrictions=null
```

본 PDCA에서는 자동화하지 않음 (admin token 필요 + repo policy 결정 사항).

---

## 6. Carryover for Future PDCA

| ID | Item | Priority | 처리 시점 후보 |
|----|------|:--------:|---------------|
| CO-1 | Branch protection 설정 | P0 | user 직접 (본 PDCA 후 즉시) |
| CO-2 | MCP tool deprecation 실전 사용 시 schema 정형화 | P2 | 첫 deprecated MCP tool 발생 시 |
| CO-3 | L5 E2E `continue-on-error` 제거 (mandatory 승격) | P2 | v2.1.18+ 차차기 |
| CO-4 | `agent-deprecation.test.js` isolated unit test 분리 | P3 | v2.1.18 |
| CO-5 | `lib/util/frontmatter.js` 추출 (5 site duplication) | P3 | v2.1.18 cleanup PDCA |

---

## 7. Lessons Learned (Carryover for AI/CC)

1. **Surface 비대칭은 governance 사고의 가장 큰 원인** — 새 governance 메커니즘 도입 시 모든 surface 종류(Skill/Agent/MCP tool/Hook 등)에 대칭 적용 원칙 명시. design 단계 체크리스트화 권장.
2. **Pure function should stay pure** — Collector 같은 read 함수가 write 부작용 가지면 self-test로 전락. 옵션 기반 explicit write가 safe default.
3. **`.gitignore`의 directory ignore는 deep negate를 막는다** — `test/` 디렉터리 자체 ignore 후 `!test/contract/**`는 효과 없음. SOP로 `git add -f` 명문화.
4. **SoT count 의미는 명확히 정의** — Total vs Active 구분. Tombstone 도입 시 모든 count 사이트에서 의미 통일 (filter 함수 추출 권장).
5. **PDCA Plan §6 Verification 항목은 진짜 검증** — Plan §6.2의 "요검증" 항목이 dry-run에서 실현 (bkit-full-system agent count drift). PDCA 사이클이 plan의 약속을 강제.

---

## 8. CHANGELOG Entry (제안)

```markdown
## v2.1.17 — 2026-XX-XX (TBD)

### CI/CD Hardening (post-v2.1.16)

#### Added
- Agent + MCP tool deprecation governance — Skill 패턴 대칭 적용 (`deprecatedIn` frontmatter)
- 6 `pdca-eval-*` deprecation tombstones (5/12 cleanup 무덤화)
- Dual baseline — v2.1.9 LTS + v2.1.16 Latest 비교
- L2 Smoke + L2 Hook Attribution + L3 MCP Compatibility + L3 MCP Runtime → CI workflow 통합
- `docs/06-guide/contract-baseline-rollforward.guide.md` — Rollforward SOP

#### Fixed
- `contract-baseline-collect.js` collect 함수 implicit write 부작용 차단 — `{ persist }` 옵션
- v2.1.9 baseline self-mutation 사고 방지
- Active agent count filtering (`lib/infra/docs-code-scanner.js`, 3 test files)

#### Changed
- `.github/workflows/contract-check.yml` — step 13 → 17 (+4)
- qa-aggregate: 3,808 PASS / 31 FAIL → 4,103 PASS / 0 FAIL / 0 Errors
```

---

## 9. References

- Plan: `docs/01-plan/features/v2117-ci-cd-hardening.plan.md`
- Design: `docs/02-design/features/v2117-ci-cd-hardening.design.md`
- Analysis: `docs/03-analysis/features/v2117-ci-cd-hardening.analysis.md`
- SOP guide: `docs/06-guide/contract-baseline-rollforward.guide.md`
- Origin incident: commit `967cd8f` (refactor v2.1.13, 2026-05-12)
- Workflow: `.github/workflows/contract-check.yml`
- Previous PDCA (v2.1.16 release hardening): `docs/01-plan/features/v2116-release-hardening.plan.md`

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|:------:|
| Author | kay | 2026-05-20 | ✅ |
| PDCA verification | (self) | 2026-05-20 | ✅ |
| CI gate validation | GitHub Actions | TBD (PR push 시) | Pending |
| Merge approval | kay | TBD | Pending |
