---
template: analysis
version: 1.2
feature: v2117-ci-cd-hardening
date: 2026-05-20
author: kay
project: bkit
version: 2.1.17
---

# v2117-ci-cd-hardening — Analysis (Gap Detection)

> **Scope**: Plan/Design vs Implementation gap 분석. 5/12 ~ 5/20 누적 사고의 5축 매트릭스 closure 검증.
>
> **Project**: bkit
> **Version**: 2.1.17 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Final

---

## 1. Plan Functional Requirements 충족도

| ID | Requirement | Status | Evidence |
|----|-------------|:------:|----------|
| FR-01 | `runL4Deprecation` Agent 블록에 `deprecatedIn` 우회 | ✅ | `test/contract/scripts/contract-test-run.js:197-219` |
| FR-02 | L4 MCP tool 블록 동일 패턴 (장기) | ✅ | `test/contract/scripts/contract-test-run.js:220-237` (baseline JSON 기반) |
| FR-03 | collect 함수 `deprecatedIn` 캡처 | ✅ | `test/contract/scripts/contract-baseline-collect.js:115-117, 144-146` |
| FR-04 | 6개 deprecation stub MD | ✅ | `agents/pdca-eval-{act,check,design,do,plan,pm}.md` |
| FR-05 | v2.1.16 baseline 캡처 | ✅ | `test/contract/baseline/v2.1.16/` (106 files) |
| FR-06 | workflow dual baseline 비교 | ✅ | `.github/workflows/contract-check.yml` v2.1.9 + v2.1.16 step |
| FR-07 | L2 + L3 workflow 통합 | ✅ | `.github/workflows/contract-check.yml` 4 step 추가 |
| FR-08 | Baseline rollforward SOP | ✅ | `docs/06-guide/contract-baseline-rollforward.guide.md` |
| FR-09 | 로컬 v2.1.9 비교 PASS | ✅ | 252 assertions PASS |
| FR-10 | 로컬 v2.1.16 비교 PASS | ✅ | 255 assertions PASS |

**Match Rate: 10/10 = 100%**

---

## 2. 추가 발견 + 처리 (Plan 밖 — 가운데 발견)

PDCA 진행 중 발견한 결함 3건. 모두 본 PDCA scope에서 처리.

### 2.1 Framework 부작용 — collect 함수의 implicit write

**발견 시점**: stub 작성 후 첫 L4 검증 시 (Stage B 끝).

**원인**: `contract-baseline-collect.js`의 `collectAgents`/`collectSkills`/`collectMCPTools`/`collectHooks`/`collectSlashCommands` 5개 함수가 호출될 때마다 `writeJSON` 호출. `contract-test-run.js`가 module-import 방식으로 collect 함수를 호출하면 baseline 디렉터리에 매번 덮어쓰기 — "v2.1.9 baseline = 현재 surface" 로 self-test 전락.

**증거**: 첫 runner 실행 시 `git status`에 75 file modified (`test/contract/baseline/v2.1.9/agents/*.json`, `skills/*.json`).

**조치**: 5개 collect 함수에 `{ persist = true, baseDir = BASE_DIR }` 옵션 추가. `contract-test-run.js`의 5 호출 지점은 `{ persist: false }` 명시.

**파일**:
- `test/contract/scripts/contract-baseline-collect.js:96-228` — 5개 함수 시그니처 변경
- `test/contract/scripts/contract-test-run.js:137, 151, 181, 198, 205` — 호출 지점 변경

**검증**: 변경 후 `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` 실행 → `git status` 변경 0건.

### 2.2 Agent count SoT drift (active vs total)

**발견 시점**: 로컬 dry-run Stage F.

**원인**: stub 6개 추가로 `agents/`의 .md 파일 = 34 → 40. 그러나 SoT (`lib/domain/rules/docs-code-invariants.js:21`)는 `agents: 34` 기대. 5개 test/script가 raw 디렉터리 카운트로 비교 — 4 fail.

**조치**: "active agent count = `deprecatedIn` 없는 agent" 의미 재정의. SoT 34 유지, count 측정 측 5곳에서 filter 추가:
- `lib/infra/docs-code-scanner.js:countAgents` (Clean Architecture infra)
- `tests/qa/bkit-full-system.test.js:297-308`
- `tests/qa/bkit-deep-system.test.js:849-859`
- `test/contract/invocation-inventory.test.js:54-101`

각 위치에서 `hasDeprecatedInFrontmatter` 유틸 inline 또는 동일 로직 사용. 일관성을 위해 frontmatter 정규식 통일: `/^\s*deprecatedIn\s*:\s*\S+/m`.

**검증**: 4 test/script 모두 PASS 회복.

### 2.3 .gitignore directory traversal 한계

**발견 시점**: v2.1.16 baseline 캡처 후 `git status`에 untracked 0건.

**원인**: `.gitignore:22`의 `test/` 룰이 디렉터리 진입 자체를 차단. 후속 `!test/contract/**` negate는 traversal 멈춘 후라 무력. 기존 v2.1.9 디렉터리는 이미 tracked라 ignore 무시되지만, 신규 v2.1.16 디렉터리는 처음 add 시 강제 옵션 필요.

**조치**: `git add -f test/contract/baseline/v2.1.16/` 로 강제 추가. `.gitignore`에 anchor comment 추가하여 미래 작업자에게 안내. SOP 가이드 §4.3에 명시.

**대안 고려**: `.gitignore`를 `test/!(contract)/` 같은 negate 패턴으로 재작성 시도. 그러나 git glob의 `!(...)` 미지원으로 불가. `test/`를 더 narrow하게 `test/unit/`, `test/util/` 등으로 분해하는 안은 변경 범위 과대로 보류.

---

## 3. CI/CD Maturity Matrix Closure 검증

| 축 | 현재 (v2.1.16 GA) | v2.1.17 적용 후 | Close 여부 | 검증 방법 |
|---|------|------|:--------:|----------|
| Detection (검출) | L1+L4 only | L1+L4 (dual baseline) + L2 smoke (98 TC) + L2 hook attribution (13 TC) + L3 MCP compat (92 TC) + L3 MCP runtime (48 TC) | ✅ | workflow.yml step 7개 추가/확장 |
| Enforcement (강제) | Push 후 검사, branch protection 없음 | (user manual) | ⚠️ | settings UI / `gh api` admin |
| Recovery (복구) | Red 누적, SOP 없음 | rollforward SOP guide + dual baseline window | ✅ | `docs/06-guide/contract-baseline-rollforward.guide.md` 8 section |
| Governance (거버넌스) | Skill만 deprecation 메커니즘 | Skill + Agent + MCP tool (대칭 적용) | ✅ | `contract-test-run.js:178-237` 통일 |
| Evolution (진화) | Baseline rollforward 없음 | Dual baseline + 의사결정 트리 SOP | ✅ | SOP §3 의사결정 트리 |

**Close 4/5, manual 1/5** (Plan에서 명시한 비율과 일치)

---

## 4. Test 회귀 추이

| Metric | v2.1.16 GA 기준 (5/20 release 시점) | v2.1.17 적용 후 |
|--------|------------------------------------|-----------------|
| Total TC | 3,839 (= 3,808 PASS + 31 FAIL) | 4,103 |
| PASS | 3,808 | 4,103 |
| FAIL | 31 | **0** |
| Errors (file threw) | 4 | **0** |
| Expected Failures | 5 | 0 |
| TC 증가 | — | +264 (dual baseline L1+L4 + 6 stub 검증 + 6 deprecated stub assertion + 1 deprecated count) |
| Contract test (L4) | 6 FAIL | **0** |
| Workflow steps | 13 | 17 (+4: dual baseline + L2 + L3) |

**FAIL/ERROR 35건 일괄 close, TC +264** — Plan SC (Definition of Done) 모두 충족.

---

## 5. Architecture Impact 분석

### 5.1 Domain Layer

영향 없음. `scripts/check-domain-purity.js` PASS (18 files, 0 forbidden imports).

### 5.2 Infrastructure Layer

`lib/infra/docs-code-scanner.js` `countAgents` 함수 변경. `parseFrontmatter` 인라인 minimal 정규식 사용 (외부 dependency 추가 없음). docs-code-index.port 인터페이스 변경 없음 — return type `number` 유지.

### 5.3 Test Infrastructure

가장 큰 변경:
- `test/contract/scripts/contract-baseline-collect.js` — 5 함수 시그니처 확장 (옵셔널 인자)
- `test/contract/scripts/contract-test-run.js` — runL4Deprecation 로직 확장 (Agent + MCP에 deprecation 우회)
- `test/contract/baseline/v2.1.16/` — 106 신규 파일 (baseline snapshot)

### 5.4 Agent Definitions

`agents/pdca-eval-*.md` 6 stub 신규. 기존 34 agent 영향 없음.

### 5.5 CI Workflow

`.github/workflows/contract-check.yml` step 5개 추가 (1 dual baseline + 4 L2/L3). 기존 step 0개 변경/삭제.

---

## 6. Risk Resolution

Plan §5에서 식별한 6 risk 추적.

| Risk | 실현 여부 | 조치 결과 |
|------|:--------:|----------|
| R1: stub L1 frontmatter fail | 실현 | stub에 model/tools/description 명시 포함 → PASS |
| R2: v2.1.16 baseline surface drift 흡수 | 부분 실현 | git diff visual review 통과, dual 비교로 v2.1.9 LTS drift 보존 |
| R3: L2/L3 통합 시 회귀 노출 | 미실현 | 4 layer 모두 첫 dry-run에서 PASS (L2 smoke 98 + hook 13 + L3 compat 92 + runtime 48) |
| R4: deprecation 우회로 거버넌스 약화 | 미실현 | `deprecatedReason` + `replacedBy` + `deprecationCommit` 필수화 |
| R5: baseline v2.1.16에 stub 포함 → 미래 fail | 잠재 | SOP §5.5 Tombstone Removal 절차 명시 |
| R6: parseFrontmatter multi-line 한계 | 미실현 | 모든 stub에서 단일 string 값 사용 |

**모든 risk close 또는 mitigation 정착.**

---

## 7. Carryover (다음 PDCA 후보)

- **CO-1**: Branch protection 자동화 — `gh api` 또는 GitHub Web UI 수동 설정. user manual 안내로 처리. 차후 `bkit:phase-9-deployment` skill에 통합 후보.
- **CO-2**: MCP tool deprecation 우회의 실전 사용 — 현재 코드 변경만, 실제 deprecated MCP tool 발생 시점에 stub schema 정형화 필요.
- **CO-3**: L5 E2E의 mandatory 승격 — 현재 `continue-on-error: true` 관찰 모드. invocation-inventory.test.js가 견고해진 후(현재 203 PASS) 다음 minor에서 승격 검토.
- **CO-4**: `test/contract/agent-deprecation.test.js` unit test 별도 추가 — Plan FR-09/10가 통합 검증으로 대체했으나 isolated unit test 분리 가능 (장기 governance 강화).
- **CO-5**: `tests/qa/bkit-full-system.test.js` 등 4개 test의 active count filtering 로직 통일 — 현재 각 파일에 별도 inline. `lib/util/frontmatter.js` 같은 util 추출 후보.

---

## 8. Lesson Learned

1. **Surface 비대칭은 governance 사고를 낳는다** — Skill에 있던 `deprecatedIn` 메커니즘이 Agent에 없었던 점이 5/12 사고의 직접 원인. 새 governance 메커니즘 도입 시 모든 surface 종류에 대칭 적용 원칙 명시.
2. **collect 함수의 implicit side effect는 self-test를 만든다** — Pure function이어야 할 collector가 write 부작용. 옵션화로 backward-compat + read-only 분기 동시 확보.
3. **`.gitignore`의 directory ignore는 negate를 막는다** — git glob 한계. 신규 baseline 디렉터리는 SOP로 `-f` 강제 추가 명문화.
4. **SoT count는 의미를 명확히 — "total" vs "active"** — tombstone 도입 시 모든 count 사이트에서 의미 재정의 필요. 본 PDCA에서 5곳 일괄 수정.
5. **Plan에서 발견하지 못한 결함은 PDCA Check에서 잡힌다** — Plan §6.2의 "요검증" 항목 (bkit-full-system agent count 영향)이 실제 dry-run에서 실현. PDCA 사이클의 가치 재확인.

---

## 9. References

- Plan: `docs/01-plan/features/v2117-ci-cd-hardening.plan.md`
- Design: `docs/02-design/features/v2117-ci-cd-hardening.design.md`
- SOP guide: `docs/06-guide/contract-baseline-rollforward.guide.md`
- Workflow: `.github/workflows/contract-check.yml`
- Contract runner: `test/contract/scripts/contract-test-run.js`
- Baseline collector: `test/contract/scripts/contract-baseline-collect.js`
- Origin incident commit: `967cd8f` (refactor v2.1.13, 2026-05-12)
- Memory snapshot: `~/.claude/projects/.../memory/MEMORY.md`
