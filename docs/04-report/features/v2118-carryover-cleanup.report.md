---
template: report
version: 1.2
feature: v2118-carryover-cleanup
date: 2026-05-20
author: kay
project: bkit
version: 2.1.18
---

# v2118-carryover-cleanup — Completion Report

> **Headline**: v2.1.17 6 carryover (CO-1 ~ CO-6) 단일 사이클로 일괄 close. 5/12 ~ 5/20 사고 클래스의 모든 잔여 결함 해소. CI/CD 5축 매트릭스 **5/5 close** 달성.
>
> **Project**: bkit
> **Version**: 2.1.18 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Completed (locally verified)
> **Branch**: `feature/v2118-carryover-cleanup`
> **Predecessor**: v2.1.17 PR #97 (merged 2026-05-20T10:34:25Z, `7acdd4f`)

---

## 1. Executive Summary

### 1.1 Closure Summary

v2.1.17 PR #97 완료 후 6 carryover 잔존:

| ID | Item | Pre-Priority | Closure |
|----|------|:------------:|:-------:|
| CO-1 | Branch protection | P0 | ✅ Automation script + 가이드 (user apply 대기) |
| CO-2 | MCP tool deprecation schema | P2 | ✅ `parseMCPToolBlocks` + inline annotation |
| CO-3 | L5 E2E mandatory 승격 | P2 | ✅ `continue-on-error: true` 제거 + `needs: contract-l1-l4` |
| CO-4 | Agent-deprecation isolated test | P3 | ✅ 5 scenario fixture test, 5/5 PASS |
| CO-5 | frontmatter util 추출 | P3 | ✅ `lib/util/frontmatter.js` + 5 site refactor |
| CO-6 | Tracked file policy | P1 | ✅ `.gitignore` narrow + 35+ file 추가 + 정책 가이드 |

추가로 PDCA 진행 중 발견 + 처리:
- v2.1.9 baseline orphan JSON 12 file 삭제 (manifest 비등재)
- `test/contract/baseline/tmp/` 임시 디렉터리 정리

### 1.2 5축 매트릭스 최종

| 축 | v2.1.16 GA | v2.1.17 후 | v2.1.18 후 |
|---|:---:|:---:|:---:|
| Detection | ◐ | ● | ●● |
| Enforcement | ✗ | ⚠️ | ● |
| Recovery | ✗ | ● | ●● |
| Governance | ◐ | ● | ●● |
| Evolution | ✗ | ● | ●● |

**5/5 close.**

### 1.3 정량 결과

| Metric | v2.1.16 GA | v2.1.17 후 | v2.1.18 후 |
|--------|:---:|:---:|:---:|
| qa-aggregate PASS | 3,808 | 4,103 | **4,090** |
| qa-aggregate FAIL | 31 | 0 | **0** |
| Errors (file threw) | 4 | 0 | **0** |
| Workflow steps (mandatory) | 13 | 17 | **18** (L5 mandatory) |
| Baseline snapshots | 1 | 2 | 2 |
| Active agents | 34 | 34 | **34** |
| Deprecation tombstones | 0 | 6 | 6 |
| Agent-deprecation isolated TC | 0 | 0 | **5** |
| Frontmatter parse duplication sites | 5 | 5 | **1** |
| Tracked test files | ~145 | ~149 | **~190+** |
| Branch protection 자동화 | ✗ | ✗ | **`bash scripts/setup-branch-protection.sh`** |

---

## 2. Deliverables

### 2.1 Code Changes

| File | Type | Change |
|------|------|--------|
| `lib/util/frontmatter.js` | Module (NEW) | Pure util: `parseFrontmatter`, `parseFrontmatterFile`, `hasDeprecatedInFrontmatter`, `hasDeprecatedInFrontmatterFile`, `coerce` |
| `lib/infra/docs-code-scanner.js` | Modified | util require, inline 정의 제거 |
| `test/contract/scripts/contract-baseline-collect.js` | Modified | util require + `projectRoot` 옵션 + `parseMCPToolBlocks` (CO-2 MCP schema) |
| `test/contract/scripts/contract-test-run.js` | Modified | `--project-root` flag + projectRoot 전달 |
| `test/contract/invocation-inventory.test.js` | Modified | util `hasDeprecatedInFrontmatterFile` require |
| `tests/qa/bkit-full-system.test.js` | Modified | util `parseFrontmatter` require |
| `tests/qa/bkit-deep-system.test.js` | Modified | util `parseFrontmatterFile` require |
| `test/contract/agent-deprecation.test.js` | Test (NEW) | 5 scenario isolated test |
| `test/contract/fixtures/agent-deprecation/` | Fixture (NEW) | 4 fixtures (positive, missing-stub, no-deprecated-in, model-mismatch) |
| `scripts/setup-branch-protection.sh` | Script (NEW) | gh CLI wrapper, idempotent dry-run + apply |

### 2.2 CI/CD

| File | Change |
|------|--------|
| `.github/workflows/contract-check.yml` | L5 mandatory 승격 — `continue-on-error: true` 제거 + `needs: contract-l1-l4` 추가 + job name "관찰 전용" 표기 제거 |
| `.gitignore` | 큰 폭 재구성 — `test/`, `tests/*` blanket ignore 제거 + production test 디렉터리 default tracked + 명시적 local-only 패턴만 ignore |

### 2.3 Documentation

| Path | Purpose |
|------|---------|
| `docs/01-plan/features/v2118-carryover-cleanup.plan.md` | PDCA Plan — 6 CO scope, 5축 close 추적 |
| `docs/02-design/features/v2118-carryover-cleanup.design.md` | PDCA Design — 각 CO의 algorithm + diff + edge case |
| `docs/03-analysis/features/v2118-carryover-cleanup.analysis.md` | PDCA Analysis — gap detection 100% + 2 추가 발견 |
| `docs/04-report/features/v2118-carryover-cleanup.report.md` | 본 문서 |
| `docs/06-guide/branch-protection-setup.guide.md` | SOP — script 사용법, idempotency, admin override |
| `docs/06-guide/test-file-tracking-policy.guide.md` | SOP — `.gitignore` policy, PR checklist, 사고 기록 |

### 2.4 Force-Tracked Test Files (35+ files)

기존 `.gitignore` 룰로 위장되어 있던 production test 파일들을 `git add -f` 후 narrow .gitignore로 영구 tracked:

- `tests/qa/` 29 file (bug-fixes-v218, completeness, config-audit, context-budget, dead-code, round4-runtime-matrix, scanner-base, session-ctx-fingerprint, shell-escape, ui-opt-out-matrix, v2112-evals-wrapper, v2113-sprint-1~5, v2114-* 10개, v2116-* 3개)
- `test/contract/` 6 file (agent-deprecation, aggregate-scope, cc-bridge, context-fork-l1, orchestrator, registry-expected-fix)
- `test/e2e/` 6 .sh file
- `test/integration/` 3 .test.js file
- `test/unit/` 2 .test.js file
- `test/v2110-qa/` 2 .test.js file

### 2.5 Hygiene Cleanup

- `test/contract/baseline/v2.1.9/agents/sprint-*.json` 4 file 삭제 (orphan, manifest 미등재)
- `test/contract/baseline/v2.1.9/mcp-tools/bkit-pdca-server/bkit_sprint_*.json + bkit_master_plan_read.json` 3 file 삭제
- `test/contract/baseline/v2.1.9/skills/{bkit-evals,bkit-explore,pdca-fast-track,pdca-watch,sprint}.json` 5 file 삭제
- `test/contract/baseline/tmp/` 임시 디렉터리 정리

---

## 3. Verification Evidence

### 3.1 로컬 dry-run 17/17 PASS

```
OK   [0] domain purity
OK   [0] L1+L4 vs v2.1.9 LTS               (234 assertions)
OK   [0] L1+L4 vs v2.1.16 Latest           (255 assertions)
OK   [0] guard registry                    (21 guards)
OK   [0] docs-code-sync (script)           (all counts consistent)
OK   [0] check-deadcode                    (Dead 0)
OK   [0] integration runtime               (23/23)
OK   [0] L2 smoke                          (98/98)
OK   [0] L2 hook attribution               (13/13)
OK   [0] L3 MCP compat                     (92/92)
OK   [0] L3 MCP runtime                    (48/48)
OK   [0] L5 invocation inventory           (203/203)
OK   [0] agent-deprecation (CO-4)          (5/5)
OK   [0] bkit-full-system                  (36/36)
OK   [0] bkit-deep-system                  (111/111)
OK   [0] docs-code-sync (test)             (36/36)
OK   [0] branch-protection (dry-run)       (preview valid)

qa-aggregate: 4090 PASS / 0 FAIL / 0 Errors
```

### 3.2 Util refactor 회귀 0건

5 site (`contract-baseline-collect.js`, `invocation-inventory.test.js`, `bkit-full-system.test.js`, `bkit-deep-system.test.js`, `docs-code-scanner.js`) 모두 PASS 유지. 기존 inline 구현과 util 구현 동일 동작 확인.

### 3.3 Agent-deprecation isolated test 5 시나리오

```
  ✓ L4 passes when deprecation stub has deprecatedIn frontmatter
  ✓ L4 fails when baseline agent removed without any stub
  ✓ L1+L4 with stub missing deprecatedIn but present in agents/ — runner stable
  ✓ L1 fails when stub model differs from baseline model
  ✓ Runner does not mutate baseline JSON files (persist=false guarantee)
```

### 3.4 Branch protection script idempotency

`bash scripts/setup-branch-protection.sh --dry-run` 2회 실행 결과 동일 payload 출력. 정책 drift 시 재실행으로 복구 가능 검증.

---

## 4. User Action Required (P0)

본 PDCA 완료 후 user 직접 실행:

### 4.1 PR merge

```bash
gh pr merge <pr-num> --squash --admin --delete-branch
```

(branch protection 미설정 상태에서는 admin override 필요)

### 4.2 Branch protection 설정

```bash
# 1. dry-run으로 preview
bash scripts/setup-branch-protection.sh --dry-run

# 2. 실제 적용
bash scripts/setup-branch-protection.sh --apply

# 3. 검증
gh api /repos/popup-studio-ai/bkit-claude-code/branches/main/protection \
  --jq '.required_status_checks'
```

자세한 절차는 `docs/06-guide/branch-protection-setup.guide.md` 참조.

---

## 5. Carryover for v2.1.19+

본 PDCA 진행 중 발견한 잠재 결함 (별도 PDCA 후보):

| ID | Item | Priority | 처리 시점 |
|----|------|:--------:|----------|
| CO-1.1 | collect script `--version` path-like 입력 validation | P3 | v2.1.19 cleanup PDCA |
| CO-2.1 | MCP deprecation 실전 사용 예시 + e2e test | P3 | 첫 deprecated MCP tool 발생 시 |
| CO-3.1 | L5 inventory의 dynamic EXPECTED_AGENTS — baseline manifest 참조 | P3 | v2.1.19 |
| CO-7 | tests/qa lockfile / dependency 자동화 | P2 | v2.1.19 |
| CO-8 | branch-protection 실제 apply 실행 결과 audit | P0 | post-merge (본 PDCA 후 user) |

---

## 6. Lessons Learned

1. **`.gitignore` `directory/` 룰의 직관 반대 동작** — git의 directory traversal halt 메커니즘 때문에 deep `!negate` 패턴이 적용되지 않음. `directory/` blanket ignore 대신 명시적 path-level 패턴 사용 권장.

2. **Pure utility 추출은 진단 도구** — duplication 해소 중 미세한 동작 차이 (parseFm null vs {}, descriptionLength 등) 발견 + 통일. utility 추출은 단순 DRY가 아니라 semantic 일관성 도구.

3. **Fixture 기반 isolated test의 가치** — production 데이터에 묶인 governance 검사를 fixture로 분리하면 positive/negative/edge 시나리오 다양화. 5 scenario test로 회귀 즉시 검출.

4. **Idempotent automation script** — branch protection 같은 일회성 설정도 script화하면 정책 drift 복구 가능. dry-run default + apply 명시적 flag로 실수 방지.

5. **Baseline 디렉터리는 manifest의 종속물** — JSON file 자체보다 manifest names가 single source. orphan은 hygiene 손상 + 미래 archeology 혼란. 정기 hygiene 점검 필요.

6. **module-scope constant의 testability 한계** — PROJECT_ROOT가 hard-coded면 fixture test 불가. `--project-root` flag 옵션화로 testability 극적 향상.

7. **`.gitignore` 변경 시 visual review 필수** — narrow화로 newly visible 파일이 발생. 모두 production code인지 head sample로 확인 후 commit.

---

## 7. CHANGELOG Entry (제안)

```markdown
## v2.1.18 — 2026-XX-XX (TBD)

### v2.1.17 Carryover Closure

#### Added
- `lib/util/frontmatter.js` — pure utility for frontmatter parsing (CO-5)
- `test/contract/agent-deprecation.test.js` — 5-scenario isolated governance test (CO-4)
- `test/contract/fixtures/agent-deprecation/` — fixture-based test infrastructure
- `scripts/setup-branch-protection.sh` — idempotent gh CLI wrapper (CO-1)
- `docs/06-guide/branch-protection-setup.guide.md` — admin SOP
- `docs/06-guide/test-file-tracking-policy.guide.md` — `.gitignore` policy SOP
- MCP tool deprecation inline annotation parsing (`@deprecated since vX.X.X`) (CO-2)

#### Changed
- `.github/workflows/contract-check.yml` — L5 mandatory 승격 (`continue-on-error: true` 제거) (CO-3)
- `.gitignore` — `test/` + `tests/*` blanket ignore 제거 → production test default tracked (CO-6)
- 5 site frontmatter parsing duplication → single util require
- `contract-test-run.js` — `--project-root` flag 추가 (fixture support)
- `contract-baseline-collect.js` — `projectRoot` 옵션 + `parseMCPToolBlocks` 도입

#### Fixed
- v2.1.9 baseline 12 orphan JSON files 삭제 (manifest 미등재)
- 35+ production test files force-tracked (5/20 위장 결함 잔여)

#### Tracking
- qa-aggregate: 4,103 → 4,090 (12 orphan assertion 제거)
- Agent-deprecation isolated test +5 TC
- 5축 매트릭스: 4/5 → **5/5 close**
```

---

## 8. References

- Plan: `docs/01-plan/features/v2118-carryover-cleanup.plan.md`
- Design: `docs/02-design/features/v2118-carryover-cleanup.design.md`
- Analysis: `docs/03-analysis/features/v2118-carryover-cleanup.analysis.md`
- Branch protection guide: `docs/06-guide/branch-protection-setup.guide.md`
- Tracked policy guide: `docs/06-guide/test-file-tracking-policy.guide.md`
- Predecessor (v2.1.17): `docs/04-report/features/v2117-ci-cd-hardening.report.md`
- PR #97 (v2.1.17 merged): https://github.com/popup-studio-ai/bkit-claude-code/pull/97 (`7acdd4f`)
- 메모리: `memory/project_v2117_ci_cd_hardening.md`

---

## Sign-off

| Role | Name | Date | Status |
|------|------|------|:------:|
| Author | kay | 2026-05-20 | ✅ |
| PDCA verification | (self, 17/17 OK) | 2026-05-20 | ✅ |
| CI gate validation | GitHub Actions | TBD (PR push) | Pending |
| Branch protection apply | kay | TBD (post-merge) | Pending |
| Merge approval | kay | TBD | Pending |
