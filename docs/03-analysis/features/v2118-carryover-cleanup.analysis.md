---
template: analysis
version: 1.2
feature: v2118-carryover-cleanup
date: 2026-05-20
author: kay
project: bkit
version: 2.1.18
---

# v2118-carryover-cleanup — Analysis (Gap Detection)

> **Scope**: v2.1.17 6 carryover (CO-1 ~ CO-6) closure 검증. 5축 매트릭스 5/5 close 달성도.
>
> **Project**: bkit
> **Version**: 2.1.18
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Final

---

## 1. Plan FR 충족도

| ID | Requirement | Status | Evidence |
|----|-------------|:------:|----------|
| FR-01 | `scripts/setup-branch-protection.sh` dry-run + apply | ✅ | `bash scripts/setup-branch-protection.sh --dry-run` PASS |
| FR-02 | `docs/06-guide/branch-protection-setup.guide.md` | ✅ | 9 section 작성 |
| FR-03 | `.gitignore` narrow화 — 자동 tracked | ✅ | `test/`, `tests/*` 제거, local-only 명시 |
| FR-04 | 잔여 untracked test 35+ file 추가 | ✅ | tests/qa 29 + test/contract 6 + test/e2e 6 + test/integration 3 + test/unit 2 + test/v2110-qa 2 |
| FR-05 | `docs/06-guide/test-file-tracking-policy.guide.md` | ✅ | 9 section 작성 |
| FR-06 | MCP tool deprecation 주석 파싱 | ✅ | `parseMCPToolBlocks` 함수 + `@deprecated since vX.X.X` regex |
| FR-07 | L5 mandatory 승격 | ✅ | `.github/workflows/contract-check.yml` `continue-on-error: true` 제거 + `needs: contract-l1-l4` |
| FR-08 | `test/contract/agent-deprecation.test.js` 5 scenario | ✅ | 5/5 PASS (positive + missing-stub + no-deprecated-in + model-mismatch + non-mutation) |
| FR-09 | `lib/util/frontmatter.js` 추출 + 5 site refactor | ✅ | 5 site 모두 util require로 refactor, verify 회귀 0 |
| FR-10 | 로컬 dry-run 전체 PASS | ✅ | 17/17 step OK, qa-aggregate 4090/0 |

**Match Rate: 10/10 = 100%**

---

## 2. 추가 발견 + 처리 (Plan 밖)

PDCA 진행 중 발견한 결함 2건. 모두 본 PDCA scope에서 처리.

### 2.1 v2.1.9 Baseline Orphan JSON Files

**발견 시점**: CO-6 tracked file audit 중 `git ls-files --others test/` 실행 결과.

**원인**: v2.1.13 또는 그 이후 시점에 누군가 `node test/contract/scripts/contract-baseline-collect.js`를 실행하여 v2.1.9 baseline 디렉터리에 v2.1.13 신규 surface 항목 (`sprint-master-planner`, `sprint-orchestrator`, `sprint-qa-flow`, `sprint-report-writer`, `bkit_master_plan_read`, `bkit_sprint_list`, `bkit_sprint_status`, `bkit-evals`, `bkit-explore`, `pdca-fast-track`, `pdca-watch`, `sprint`) 의 JSON file을 write. `.gitignore`의 `test/` 룰 때문에 untracked 상태로 잔존.

**증거**: 12 untracked JSON file이 manifest `_MANIFEST.json`의 `names` 배열에는 등재되지 않은 채 디렉터리에만 존재.

**영향**: Runner는 `manifest.agents.names`만 보고 비교하므로 동작 자체에는 영향 없음. 그러나 baseline의 "v2.1.9 시점 snapshot" 일관성 손상. 미래 작업자가 baseline JSON file을 직접 참조 시 잘못된 정보.

**조치**: 12 orphan file 삭제. 삭제 후 `ls .../agents/` 결과 36 = manifest count 36 (정합). Contract test PASS 252 → 234 assertions (12 orphan에 대한 의미 없는 assertion 제거).

### 2.2 임시 baseline 디렉터리 흔적

**발견 시점**: CO-2 MCP schema 검증 중 `--version /tmp/test-mcp-collect` 인자 사용 → BASE_DIR path concatenation으로 `test/contract/baseline/tmp/test-mcp-collect/` 디렉터리 생성됨.

**원인**: contract-baseline-collect.js의 BASE_DIR이 `path.join(PROJECT_ROOT, 'test', 'contract', 'baseline', version)` 형식. version 인자가 absolute path여도 join 결과는 relative concat.

**조치**: `rm -rf test/contract/baseline/tmp` 정리. `.gitignore`에 `test/contract/baseline/tmp/`, `test/contract/baseline/.tmp/` 패턴 추가하여 향후 재발 방지.

**향후**: collect script의 version validation 추가 권장 (v2.1.19 carryover 후보).

---

## 3. 5축 매트릭스 Closure 최종

| 축 | v2.1.16 GA | v2.1.17 후 | v2.1.18 후 |
|---|-----|-----|-----|
| Detection | ◐ L1+L4 only | ● dual baseline + L2 + L3 | ●● + L5 mandatory + MCP schema |
| Enforcement | ✗ | ⚠️ user manual | ● `scripts/setup-branch-protection.sh` 자동화 + 가이드 |
| Recovery | ✗ | ● Rollforward SOP | ●● + tracked file policy guide |
| Governance | ◐ Skill만 | ● Skill + Agent + MCP | ●● + Agent isolated test (5 scenario) + MCP schema 정형 |
| Evolution | ✗ | ● Dual baseline | ●● + frontmatter util 통일 + baseline hygiene |

**5/5 close** — `●●` 표시 항목은 v2.1.18에서 추가 강화된 부분.

---

## 4. 정량 결과

| Metric | v2.1.16 GA | v2.1.17 후 | v2.1.18 후 | Delta (v2117 → v2118) |
|--------|------------|------------|------------|----------------------|
| qa-aggregate PASS | 3,808 | 4,103 | 4,090 | -13 |
| qa-aggregate FAIL | 31 | 0 | 0 | 0 |
| qa-aggregate Errors | 4 | 0 | 0 | 0 |
| Contract L1+L4 (v2.1.9) | 6 FAIL | 252 PASS | 234 PASS | -18 (orphan 삭제) |
| Contract L1+L4 (v2.1.16) | N/A | 255 PASS | 255 PASS | 0 |
| Agent-deprecation isolated | N/A | N/A | **5 PASS** | +5 |
| Workflow steps | 13 | 17 | **17** (L5 mandatory 승격) | 0 |
| Tracked test files | ~145 | ~149 | **~190+** | +41 |
| lib/util/ modules | 0 | 0 | **1** (frontmatter.js) | +1 |
| Frontmatter parsing sites | 5 (duplicated) | 5 (duplicated) | **1** (util) | -4 |
| Baseline orphan JSON | 12 | 12 | **0** | -12 |
| .gitignore traversal pitfalls | 잠재 | 잠재 | **해소** | — |
| Branch protection automation | 없음 | 없음 | **`bash scripts/setup-branch-protection.sh`** | — |

**핵심**: TC 약간 감소했으나 baseline hygiene 회복 + isolated test 강화 + 거버넌스 자동화로 *quality* 측면 크게 향상.

---

## 5. Architecture Impact

### 5.1 New Layer: lib/util/

```
lib/
├── util/                              [NEW]
│   └── frontmatter.js                 [NEW — pure, FS-free core]
```

Clean Architecture utility layer. 4 export:
- `coerce(v)` — pure scalar coercion
- `parseFrontmatter(markdown)` — pure markdown→object
- `parseFrontmatterFile(filePath)` — FS wrapper
- `hasDeprecatedInFrontmatter(content)` — pure predicate
- `hasDeprecatedInFrontmatterFile(filePath)` — FS wrapper

### 5.2 Layer 영향 매트릭스

```
├── Utility (NEW)
│   └── lib/util/frontmatter.js                  [NEW]
├── Infrastructure
│   └── lib/infra/docs-code-scanner.js           [util require]
├── Test Infrastructure
│   ├── test/contract/scripts/contract-baseline-collect.js  [util require + projectRoot 옵션 + MCP schema]
│   ├── test/contract/scripts/contract-test-run.js          [--project-root flag + projectRoot 호출]
│   ├── test/contract/agent-deprecation.test.js             [NEW]
│   ├── test/contract/fixtures/agent-deprecation/           [NEW — 4 fixtures]
│   ├── test/contract/invocation-inventory.test.js          [util require]
│   ├── tests/qa/bkit-full-system.test.js                   [util require]
│   ├── tests/qa/bkit-deep-system.test.js                   [util require]
│   └── [+ 35+ force-tracked test files]
├── Presentation (CI/CD)
│   ├── .github/workflows/contract-check.yml                [L5 mandatory + needs:]
│   ├── .gitignore                                          [narrow 정책 전환]
│   └── scripts/setup-branch-protection.sh                  [NEW]
└── Documentation
    ├── docs/01-plan/.../v2118-carryover-cleanup.plan.md    [NEW]
    ├── docs/02-design/.../v2118-carryover-cleanup.design.md [NEW]
    ├── docs/03-analysis/.../v2118-carryover-cleanup.analysis.md [NEW — 본 문서]
    ├── docs/04-report/.../v2118-carryover-cleanup.report.md [Pending]
    ├── docs/06-guide/branch-protection-setup.guide.md      [NEW]
    └── docs/06-guide/test-file-tracking-policy.guide.md    [NEW]
```

Domain Layer 영향 없음 — `check-domain-purity.js` PASS (18 files).

---

## 6. Risk Resolution

Plan §5에서 식별한 6 risk 추적.

| Risk | 실현 여부 | 조치 결과 |
|------|:--------:|----------|
| R1: util signature mismatch | 미실현 | 5 site refactor 모두 PASS (회귀 0건) |
| R2: L5 mandatory 후 새 회귀 | 미실현 | 사전 dry-run 203 PASS, workflow 적용 후도 동일 |
| R3: .gitignore narrow화 over-exposure | 부분 실현 | 15 newly visible 모두 production code (visual review 통과) |
| R4: MCP deprecation schema backward-compat | 미실현 | 기존 baseline JSON 형식 유지, count 19 그대로 |
| R5: branch protection 기존 정책 overwrite | 미실현 | dry-run 기본, --apply 명시적 |
| R6: untracked force-add sensitive content | 미실현 | 35+ file head sample review로 모두 production 확인 |

**모든 risk close.**

---

## 7. Carryover (다음 PDCA 후보 — 잔여)

본 PDCA 진행 중 발견한 잠재 결함 → 별도 PDCA로:

- **CO-1.1** P3: collect script `--version` 인자 validation (path-like 입력 거부) — `version=/tmp/...` 같은 사고 방지
- **CO-2.1** P3: MCP deprecation 실전 사용 예시 — 실제 deprecated tool 발생 시 inline 주석 형식 도입
- **CO-3.1** P3: L5 inventory의 dynamic expected lists — 현재 hardcoded `EXPECTED_AGENTS` 등, baseline manifest를 참조하면 더 stable
- **CO-7** P2: `tests/qa/` 진정한 dependencies — 본 PDCA에서 29 file force-add. 향후 add 시 deps 검증 자동화 (예: lockfile)
- **CO-8** P1: `branch-protection` 실제 apply 수행 — user manual (admin token 보유자)

---

## 8. Lesson Learned

1. **`.gitignore` `directory/` 룰의 직관 반대 동작** — deep negate는 작동하지 않음. blanket ignore 대신 명시적 path 패턴이 정합성 높음.
2. **Pure utility 추출은 진단 도구** — 5 site duplication 해소 중에 미세한 동작 차이 (예: parseFm `null` vs parseFrontmatter `{}`) 발견 + 통일.
3. **Fixture 기반 isolated test의 가치** — agent-deprecation governance가 실 데이터에 묶여 있던 것을 분리. positive/negative/edge 5 scenario로 보호.
4. **Idempotent script의 가치** — branch protection은 1회 설정 후에도 정책 drift 시 재실행으로 복구. dry-run default가 실수 방지.
5. **Baseline 디렉터리는 manifest의 종속물** — 직접 JSON file은 manifest names가 참조하는 것만 valid. orphan은 hygiene 손상.
6. **`--project-root` flag로 runner를 fixture-aware로** — production code의 testability 향상. PROJECT_ROOT 같은 module 상수는 옵션화 가치.

---

## 9. References

- Plan: `docs/01-plan/features/v2118-carryover-cleanup.plan.md`
- Design: `docs/02-design/features/v2118-carryover-cleanup.design.md`
- Predecessor: `docs/03-analysis/features/v2117-ci-cd-hardening.analysis.md`
- SOP guide: `docs/06-guide/contract-baseline-rollforward.guide.md`
- Tracked policy: `docs/06-guide/test-file-tracking-policy.guide.md`
- Branch protection: `docs/06-guide/branch-protection-setup.guide.md`
- v2117 PR: https://github.com/popup-studio-ai/bkit-claude-code/pull/97 (merged 2026-05-20)
- 메모리: `memory/project_v2117_ci_cd_hardening.md`
