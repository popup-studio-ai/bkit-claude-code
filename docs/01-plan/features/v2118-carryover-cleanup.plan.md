---
template: plan
version: 1.3
feature: v2118-carryover-cleanup
date: 2026-05-20
author: kay
project: bkit
version: 2.1.18
---

# v2118-carryover-cleanup — Planning Document

> **Summary**: v2.1.17 PDCA에서 식별된 6 carryover (CO-1 ~ CO-6) 일괄 처리. Contract framework 심화 + tracked file policy 명문화 + branch protection 자동화. 5/12 ~ 5/20 사고의 마지막 잔여 결함 해소.
>
> **Project**: bkit
> **Version**: 2.1.18 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Active
> **Predecessor PDCA**: v2.1.17 ci-cd-hardening (PR #97 merged 2026-05-20T10:34:25Z, commit `7acdd4f`)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.1.17 PR #97 머지로 5축 매트릭스 4/5 close 했으나, 6 carryover (P0 1건, P1 1건, P2 2건, P3 2건) 잔존. 특히 P0 branch protection 미설정 + P1 untracked test 정책 미명문화는 동일 사고 패턴 재발 가능. |
| **Solution** | Single PDCA cycle로 6 CO 일괄 처리. 5축 매트릭스 100% close + 부수 framework 심화 (frontmatter util 추출, agent deprecation isolated test, MCP deprecation schema, L5 mandatory 승격). |
| **Function/UX Effect** | (a) main branch protection 자동 설정 가능 (`gh api` script). (b) 신규 test 파일 추가 시 PR template 자가검증으로 untracked 위장 차단. (c) MCP tool 제거 시 자동 무덤화. (d) L5 invocation surface 회귀가 PR gate에 포함. |
| **Core Value** | 5/12 ~ 5/20 사고 클래스의 영구 종결. 차후 동일 root cause로는 더 이상 release red 불가. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.17이 5축 4/5 close했으나 1축 (Enforcement) + 잔여 framework 결함 6건 carryover. P0 branch protection 미설정 시 CI red 상태로 또 release 가능. |
| **WHO** | bkit 메인테이너 (release 신뢰성), 컨트리뷰터 (PR 셀프 검증), 미래 v2.1.19+ 작업자 (MCP/agent 삭제 시 자동 안내) |
| **RISK** | (1) `lib/util/frontmatter.js` 추출 시 5 site의 호출 signature mismatch — 보호: 통합 verification. (2) L5 mandatory 승격이 새 회귀 검출 — 보호: 사전 dry-run. (3) `.gitignore` narrow화가 의도치 않은 file 노출 — 보호: 변경 전후 `git ls-files diff` 검증. (4) MCP deprecation schema가 기존 baseline format 깨뜨림 — 보호: backward-compat 우선. |
| **SUCCESS** | (a) 6 CO 모두 close (1 user manual → 1 자동화 가능). (b) v2117 + v2118 종합 5축 매트릭스 5/5 close. (c) v2.1.17 PR #97의 verify-all.sh 결과 4103/0 유지 또는 증가. (d) L5 mandatory 모드에서도 green. |
| **SCOPE** | P0 (CO-1) → P1 (CO-6) → P2 (CO-2, CO-3) → P3 (CO-4, CO-5). 순서는 의존성 기반 (CO-5 utility는 CO-4 isolated test에서 사용). |

---

## 1. Overview

### 1.1 Purpose

v2.1.17 PDCA의 carryover 6건을 단일 사이클로 일괄 처리하여 contract framework의 모든 known gap을 close한다.

### 1.2 Background

v2.1.17 PR #97 merged 2026-05-20T10:34:25Z (`7acdd4f`):
- qa-aggregate 3,808 PASS / 31 FAIL → 4,103 / 0
- 5축 4/5 close (Detection/Recovery/Governance/Evolution)
- 1축 carryover: Enforcement (branch protection, P0)

이외 5개 결함 carryover (analysis 문서 §7 정리):
- CO-2 P2: MCP tool deprecation schema 정형화
- CO-3 P2: L5 E2E `continue-on-error` 제거
- CO-4 P3: `agent-deprecation.test.js` isolated unit test
- CO-5 P3: `lib/util/frontmatter.js` 추출 (5 site duplication)
- CO-6 P1: tracked file policy 명문화 (잔여 untracked 30+ file)

### 1.3 Related Documents

- v2117 Plan: `docs/01-plan/features/v2117-ci-cd-hardening.plan.md`
- v2117 Analysis (carryover §7): `docs/03-analysis/features/v2117-ci-cd-hardening.analysis.md`
- v2117 Report (CO list §6): `docs/04-report/features/v2117-ci-cd-hardening.report.md`
- v2117 SOP: `docs/06-guide/contract-baseline-rollforward.guide.md`
- PR #97: https://github.com/popup-studio-ai/bkit-claude-code/pull/97
- 메모리: `memory/project_v2117_ci_cd_hardening.md`

---

## 2. Scope

### 2.1 In Scope (6 CO)

**P0 — CO-1: Branch protection 자동화**

- [ ] `scripts/setup-branch-protection.sh` — `gh api -X PUT /repos/{owner}/{repo}/branches/main/protection` 호출. idempotent + dry-run 모드.
- [ ] `docs/06-guide/branch-protection-setup.guide.md` — script 사용법 + Required Status Checks 목록 + 회피 패턴 (admin override 정책)
- [ ] (옵션) user 직접 실행 — `bash scripts/setup-branch-protection.sh`

**P1 — CO-6: Tracked file policy 명문화**

- [ ] `.gitignore` narrow화 — `test/` → `test/manual-only/` 등 specific subdir만 ignore
- [ ] 잔여 30+ untracked file 일괄 git add (force) — `tests/qa/`의 30개, `test/contract/`의 5개
- [ ] `docs/06-guide/test-file-tracking-policy.guide.md` — 신규 test 파일 추가 시 PR self-review 체크리스트
- [ ] (옵션) PR template `.github/pull_request_template.md` 갱신 — "test 파일 추가 시 `git ls-files | grep <file>` 검증" 항목

**P2 — CO-2: MCP tool deprecation schema**

- [ ] `contract-baseline-collect.js` `collectMCPTools` — server `index.js` 파싱에서 deprecation 주석 (`// @deprecated since vX.X.X`) 인식
- [ ] baseline JSON `deprecatedIn`, `replacedBy` 필드 캡처
- [ ] `contract-test-run.js` L4 MCP 분기 — 이미 v2117에서 baseline JSON 기반 우회 구현됨, schema validation 추가

**P2 — CO-3: L5 E2E mandatory 승격**

- [ ] `.github/workflows/contract-check.yml` `contract-l5-e2e` job — `continue-on-error: true` 제거
- [ ] L5 invocation-inventory.test.js의 robustness 사전 검증 (현재 203/203 PASS)
- [ ] job dependency 추가 — L1+L4 통과 후 L5 실행

**P3 — CO-4: agent-deprecation isolated unit test**

- [ ] `test/contract/agent-deprecation.test.js` — fixture 기반 격리 test
- [ ] Positive: stub MD에 `deprecatedIn` 있으면 통과
- [ ] Negative: stub 미존재 / `deprecatedIn` 미선언 fail
- [ ] Edge: model mismatch, hasTools mismatch, fileName mismatch
- [ ] qa-aggregate에 자동 포함

**P3 — CO-5: lib/util/frontmatter.js 추출**

- [ ] `lib/util/frontmatter.js` — `parseFrontmatter`, `hasDeprecatedInFrontmatter`, `coerce` export
- [ ] 5 site duplication 제거:
  - `test/contract/scripts/contract-baseline-collect.js` (정의)
  - `test/contract/invocation-inventory.test.js` (inline)
  - `tests/qa/bkit-full-system.test.js` (parseFm)
  - `tests/qa/bkit-deep-system.test.js` (parseFm)
  - `lib/infra/docs-code-scanner.js` (hasDeprecatedInFrontmatter)
- [ ] Clean Architecture util layer (`lib/util/`) 검증
- [ ] domain-purity check 통과 보장

### 2.2 Out of Scope

- **Test/contract 외 lib/** dead code 정리: 5/12 cleanup의 의도 존중, sprint barrel만 EXEMPT 처리 완료
- **Node 24 migration**: GitHub Actions 경고 (`actions/checkout@v4`, `setup-node@v4`)는 별도 PDCA
- **PR template overhaul**: tracked file 항목만 추가 (전면 개편 X)
- **Branch protection의 review 정책**: status check만 추가, required reviewers는 user 정책 결정

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|:--------:|:------:|
| FR-01 | `scripts/setup-branch-protection.sh` 작동 (dry-run + apply) | P0 | Pending |
| FR-02 | `docs/06-guide/branch-protection-setup.guide.md` 작성 | P0 | Pending |
| FR-03 | `.gitignore` narrow화로 신규 test 파일 자동 tracked | P1 | Pending |
| FR-04 | 잔여 untracked test 파일 30+ 일괄 추가 + 검증 | P1 | Pending |
| FR-05 | `docs/06-guide/test-file-tracking-policy.guide.md` 작성 | P1 | Pending |
| FR-06 | MCP tool deprecation 주석 파싱 + baseline JSON 캡처 | P2 | Pending |
| FR-07 | `.github/workflows/contract-check.yml` L5 mandatory 승격 | P2 | Pending |
| FR-08 | `test/contract/agent-deprecation.test.js` 격리 unit test (positive + negative + edge) | P3 | Pending |
| FR-09 | `lib/util/frontmatter.js` 추출 + 5 site refactor | P3 | Pending |
| FR-10 | 로컬 dry-run: v2117 verify-all.sh 모든 step PASS + 신규 step 통과 | P0 | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement |
|----------|----------|-------------|
| Backward compat | 기존 baseline JSON 형식 유지, MCP `deprecatedIn` 옵셔널 | parseFrontmatter 동작 검증 |
| Clean Architecture | `lib/util/frontmatter.js`는 외부 의존성 없음 (pure) | domain-purity check |
| Determinism | `git ls-files` 결과가 caller-independent | macOS/Linux 양쪽 검증 |
| Idempotency | branch protection script 재실행 시 동일 결과 | dry-run 2회 비교 |
| Test coverage | agent-deprecation isolated test +10 TC 이상 | qa-aggregate 증가량 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-10 모두 구현
- [ ] PR `feature/v2118-carryover-cleanup` → main, CI workflow green
- [ ] 로컬 dry-run 모든 step PASS (16 step + L5 mandatory):
  - [ ] v2117의 14 step
  - [ ] contract-l5-e2e (continue-on-error 제거 후)
  - [ ] agent-deprecation isolated test
- [ ] `gh api /repos/{owner}/{repo}/branches/main/protection` 확인 (script 실행 후)
- [ ] 5축 매트릭스 5/5 close (Enforcement까지)

### 4.2 Quality Criteria

- [ ] `parseFrontmatter` extract로 인한 회귀 0건
- [ ] 잔여 untracked file force-add 시 surface 변화 visual review (manifest count drift 없음)
- [ ] MCP deprecation schema의 backward-compat (기존 baseline 영향 없음)
- [ ] L5 mandatory 승격 후 false positive 0건

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|:----------:|------------|
| R1: `lib/util/frontmatter.js` 추출이 5 site signature mismatch | High | Medium | 각 site별 호출 signature 사전 정리, util은 다양한 호출 시그니처 지원 (`parseFrontmatter(content)`, `hasDeprecatedInFrontmatter(content or filePath)`) |
| R2: L5 mandatory 후 invocation-inventory 새 회귀 | Medium | Low | 사전 로컬 dry-run, robustness 검증 (203 TC 기준) |
| R3: `.gitignore` narrow화로 의도치 않은 build artifact 노출 | Medium | Medium | `tests/qa/`, `test/contract/` 만 narrow, 다른 디렉터리 (e.g., `test-scripts/`) 영향 없음 |
| R4: MCP deprecation 주석 파싱이 기존 tool definition 깨뜨림 | High | Low | regex가 deprecation 주석만 잡고 tool definition은 영향 없음. test fixture로 검증 |
| R5: branch protection script가 기존 정책 overwrite | Medium | Low | dry-run mode + diff 출력 후 user 확인 단계 |
| R6: untracked file force-add 시 sensitive content 포함 | High | Low | 파일별 head 5 lines visual review |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change |
|----------|------|--------|
| `scripts/setup-branch-protection.sh` | Script (NEW) | gh api wrapper |
| `docs/06-guide/branch-protection-setup.guide.md` | Doc (NEW) | 가이드 |
| `.gitignore` | Modified | `test/` → narrow patterns |
| `tests/qa/*.test.js` 30+ files | Force-tracked | 새로 git에 추가 |
| `test/contract/*.test.js` 5 files | Force-tracked | 새로 git에 추가 |
| `docs/06-guide/test-file-tracking-policy.guide.md` | Doc (NEW) | 정책 |
| `test/contract/scripts/contract-baseline-collect.js` | Modified | MCP deprecation 주석 파싱 |
| `test/contract/scripts/contract-test-run.js` | Modified | MCP deprecation schema 검증 |
| `.github/workflows/contract-check.yml` | Modified | L5 mandatory 승격 |
| `test/contract/agent-deprecation.test.js` | Test (NEW) | isolated unit test |
| `lib/util/frontmatter.js` | Module (NEW) | util 추출 |
| `test/contract/invocation-inventory.test.js` | Modified | util require |
| `tests/qa/bkit-full-system.test.js` | Modified | util require |
| `tests/qa/bkit-deep-system.test.js` | Modified | util require |
| `lib/infra/docs-code-scanner.js` | Modified | util require |
| `test/contract/scripts/contract-baseline-collect.js` | Modified | util require (duplicate 제거) |

### 6.2 Current Consumers

| Resource | Consumer | Impact |
|----------|----------|--------|
| `lib/util/frontmatter.js` | 5 site (CO-5 list) | require path만 변경, 호출 signature 유지 |
| `tests/qa/*` force-tracked | qa-aggregate scanner | CI runner에서 fetch 가능, file count 증가 |
| L5 mandatory | workflow CI | gate fail 시 merge 차단 |
| MCP deprecation schema | baseline manifest | 기존 baseline 형식 변경 없음 (필드 추가만) |

### 6.3 Verification

- [ ] `lib/util/frontmatter.js` 추출 후 5 site 모두 PASS
- [ ] `.gitignore` 변경 후 `git status` clean (예상치 않은 untracked 0)
- [ ] L5 mandatory 후 invocation-inventory 203 PASS 유지
- [ ] qa-aggregate 4103 → 4103+ TC
- [ ] domain-purity 18 → 19 (lib/util/frontmatter.js 1 추가)

---

## 7. Architecture Considerations

### 7.1 Project Level

bkit Enterprise — contract framework + Clean Architecture.

### 7.2 Key Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| util 추출 위치 | `lib/util/` / `lib/infra/` / `test/util/` | `lib/util/frontmatter.js` | 5 site 중 lib/infra와 test/ 양쪽 사용 — common util layer |
| util signature | overloaded (content + filePath) / 분리된 함수 | 분리된 함수 (`parseFrontmatter(content)`, `parseFrontmatterFile(filePath)`) | 명시성 + IDE 자동완성 |
| branch protection script | `gh api` curl wrapper / `gh api` 단일 호출 | `gh api` 단일 호출 with `--input` | gh 표준 패턴 |
| `.gitignore` 전략 | narrow patterns / 명시적 whitelist | narrow patterns (`tests/qa-manual/` 만 ignore) | 최소 변경 |
| L5 dependency | sequential (L1+L4 → L5) / parallel | sequential | L5 fail은 L1+L4 통과 시에만 의미 있음 |
| MCP deprecation 주석 형식 | `// @deprecated since vX.X.X` / `// DEPRECATED:` | `// @deprecated since vX.X.X replacedBy=Y` | JSDoc 표준 + 파싱 안정성 |

### 7.3 Clean Architecture

본 PDCA는 **Test Infrastructure + Utility Layer + CI/CD** 변경.

```
영향 받는 Layer:
├── Utility (NEW)
│   └── lib/util/frontmatter.js                    [NEW]
├── Infrastructure
│   └── lib/infra/docs-code-scanner.js             [require util]
├── Test Infrastructure
│   ├── test/contract/scripts/contract-baseline-collect.js  [util refactor + MCP schema]
│   ├── test/contract/scripts/contract-test-run.js          [MCP schema validation]
│   ├── test/contract/agent-deprecation.test.js             [NEW]
│   ├── test/contract/invocation-inventory.test.js          [util require]
│   ├── tests/qa/bkit-full-system.test.js                   [util require]
│   ├── tests/qa/bkit-deep-system.test.js                   [util require]
│   └── tests/qa/* + test/contract/* (30+ force-tracked)
├── Presentation (CI/CD)
│   ├── .github/workflows/contract-check.yml       [L5 mandatory]
│   ├── .gitignore                                 [narrow]
│   └── scripts/setup-branch-protection.sh         [NEW]
└── Documentation
    ├── docs/01-plan/.../v2118-carryover-cleanup.plan.md
    ├── docs/02-design/.../v2118-carryover-cleanup.design.md
    ├── docs/03-analysis/.../v2118-carryover-cleanup.analysis.md
    ├── docs/04-report/.../v2118-carryover-cleanup.report.md
    ├── docs/06-guide/branch-protection-setup.guide.md
    └── docs/06-guide/test-file-tracking-policy.guide.md
```

domain-purity 영향 — `lib/util/frontmatter.js`는 pure (no FS access in core API).

---

## 8. CI/CD Maturity Matrix — 5/5 Close 추적

| 축 | v2.1.17 후 | v2.1.18 후 | Close |
|---|------|------|:-----:|
| Detection | ● L1+L4 dual + L2 + L3 | ● + L5 mandatory + MCP deprecation schema 강화 | ✅ |
| Enforcement | ⚠️ user manual | ● `scripts/setup-branch-protection.sh` 자동화 | ✅ |
| Recovery | ● SOP guide | ● + tracked file policy guide | ✅ |
| Governance | ● Skill + Agent + MCP tool | ● + agent-deprecation isolated test + MCP schema 정형 | ✅ |
| Evolution | ● Dual baseline | ● + frontmatter util 통일 | ✅ |

**5/5 close** (v2.1.17 carryover 항목 모두 처리).

---

## 9. Next Steps

1. [ ] Design 문서 작성
2. [ ] CO-5 frontmatter util 추출 (먼저 — CO-4가 의존)
3. [ ] CO-4 agent-deprecation isolated test (CO-5 util 사용)
4. [ ] CO-2 MCP deprecation schema
5. [ ] CO-3 L5 mandatory 승격
6. [ ] CO-6 tracked file policy
7. [ ] CO-1 branch protection script + 가이드
8. [ ] 로컬 dry-run 전체 검증
9. [ ] Analysis + Report
10. [ ] PR feature/v2118-carryover-cleanup

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial draft (v2117 carryover § §7 + §6 통합) | kay |
