---
template: plan
version: 1.3
feature: v2116-release-hardening
date: 2026-05-20
author: kay
project: bkit
version: 2.1.16
---

# v2116-release-hardening — Planning Document

> **Summary**: v2.1.16 출시 전 릴리즈 검증 누락 결함 일괄 해소 + CI gate 강화로 v2.1.14/15 반복 패턴 종결
>
> **Project**: bkit
> **Version**: 2.1.16
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Active
> **PDCA cycle parent**: post-v2116-issue-fixes hardening (separate from #92/93/94/95 fix scope)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | v2.1.16 release commit 후 자체 검증에서 3건 release defect (README badge stale, 2개 hook 파일 v2.1.16 표기 누락) + 31 stale test FAIL + 4 orphan test 발견. v2.1.14/v2.1.15 동일 패턴 반복 — 테스트는 존재하는데 CI gate 미연결 |
| **Solution** | 3-tier fix: (P1) 반드시 fix 3건 즉시 동기, (P2) 4 orphan + 11 stale-baseline test 갱신/삭제로 진짜 결함 가시화, (P3) bkit-full-system + docs-code-sync를 .github/workflows/contract-check.yml에 추가하여 재발 방지 |
| **Function/UX Effect** | (a) GitHub 첫 인상 버전 정확성, (b) `node test/contract/scripts/qa-aggregate.js` FAIL=0 도달, (c) 차기 릴리즈부터 PR 단계에서 stale-baseline + 버전 동기 자동 차단 |
| **Core Value** | "검증 완료"라 주장한 릴리즈에서 실제 결함이 또 나오는 신뢰성 부채 청산. CI gate가 사람의 수동 검증 누락을 대체 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | v2.1.14/15/16 3 사이클 연속으로 "완벽 검증" 주장 후 release defect 발생. 단위 테스트 + qa-aggregate는 존재하나 CI에 미연결, 사람의 수동 실행 누락이 진짜 근본 원인 |
| **WHO** | bkit 메인테이너 (kay) + GitHub 첫 방문자 (잘못된 v2.1.14 badge 노출) + bkit 컨트리뷰터 (orphan test 혼란) |
| **RISK** | (1) stale-baseline 갱신 시 신규 회귀 가능 — 보호: 각 변경 후 즉시 단일 file rerun. (2) CI 강화 시 PR 실패율 급증 — 보호: EXPECTED_FAILURES 등록으로 grace period |
| **SUCCESS** | (a) `tests/qa/bkit-full-system.test.js` 36/36 PASS, (b) `qa-aggregate.json` totalFAIL 31 → 0 (또는 expected-failure 등록), (c) `gh issue list --state open` v2.1.16 release blocker 0건, (d) CI workflow에서 bkit-full-system + docs-code-sync 자동 실행 |
| **SCOPE** | P1 반드시 fix (3 files) → P2 orphan 제거 (4 files) → P3 stale baseline 갱신 (11 files) → P4 CI 강화 (1 file) → P5 검증 + 보고 |

---

## 1. Overview

### 1.1 Purpose

v2.1.16 release tag/npm publish 전에 자체 검증에서 발견된 모든 결함을 일괄 fix하고, 동일 패턴 재발 방지를 위한 CI gate를 도입한다. 본 PDCA는 v2.1.16 4-feature fix(#92/93/94/95)와 **별도 사이클**로 진행 — feature fix는 코드 변경, 본 hardening은 release 메타데이터 + 테스트 인프라 변경.

### 1.2 Background

이전 분석 세션 (오늘) 결과:
- `release(v2.1.16): Quality Gates & Approval UX — 4 GitHub issues closure` (d37e474) 커밋 메시지는 `BKIT_VERSION 5-loc sync 2.1.15 → 2.1.16` 표기
- 그러나 `tests/qa/bkit-full-system.test.js` F 섹션 3 assertion FAIL:
  - `hooks/session-start.js` v2.1.16 패턴 0건
  - `hooks/startup/session-context.js` v2.1.16 패턴 0건
  - `README.md` `Version-2.1.16` 뱃지 0건 (현재 `Version-2.1.14`)
- 전체 `node test/contract/scripts/qa-aggregate.js`: 3,808 PASS / **31 FAIL** / 5 expected-failure / 151 file 중 15 file-level error
- 31 FAIL **전수 분류 결과**: 모두 stale test baseline (43→44 skills, 36→34 agents, 142→177 lib modules, status.js facade split, U-TRG-016 floating-point, orchestrator routing policy update, #89 fix의 의도된 동작 변경 등). **진짜 결함 0건**.
- 4 file-level error: 삭제된 모듈을 import하는 orphan test (`test/unit/{context-loader,impact-analyzer,invariant-checker,scenario-runner}.test.js`).

이 모든 결함이 release 전에 잡혔어야 했으나 CI workflow `.github/workflows/contract-check.yml`이 `test/` 디렉터리만 검사하고 `tests/qa/`는 제외. `bkit-full-system.test.js`가 의도된 release gate임에도 자동 실행 불연결.

### 1.3 Related Documents

- v2.1.16 master plan: `docs/01-plan/features/v2116-issue-fixes.master-plan.md`
- v2.1.16 release report: `docs/04-report/features/v2116-issue-fixes.report.md`
- 이전 issue #89 plan (extractFeature 변경 기준점): `docs/01-plan/features/issue-89-pdca-status-fix.plan.md`
- CC 호환 메모리: `memory/cc_version_history_v2144.md`

---

## 2. Scope

### 2.1 In Scope

**P1 — 반드시 fix (release blocker, 3건)**:
- [ ] `README.md` Version badge `Version-2.1.14-green` → `Version-2.1.16-green`
- [ ] `hooks/session-start.js` line 3 주석 `(v2.1.13, ...)` → `(v2.1.16, ...)` (런타임은 BKIT_VERSION 통해 정확하나 주석 정합성)
- [ ] `hooks/startup/session-context.js`에 v2.1.16 release 표기 (현재 v2.1.10/v2.1.11 ENH 주석만 존재 → 최신 release 컨텍스트 부재)

**P2 — 권고 fix (orphan test 제거, 4건)**:
- [ ] `test/unit/context-loader.test.js` 삭제 — `lib/context/context-loader` 모듈 v2.1.10 이후 부재
- [ ] `test/unit/impact-analyzer.test.js` 삭제
- [ ] `test/unit/invariant-checker.test.js` 삭제
- [ ] `test/unit/scenario-runner.test.js` 삭제

**P3 — 권고 fix (stale baseline 갱신, 11 file 31 TC)**:
- [ ] `test/unit/runner.test.js` — `30 skills` → `44`, `11 workflows` → `12` (4 TC: U-RUN-015/016/069/071)
- [ ] `test/contract/extended-scenarios.test.js` — `EXPECTED_COUNTS.skills 43→44, agents 36→34, mcpTools 16→19` (5 TC)
- [ ] `test/contract/invocation-inventory.test.js` — 동일 카운트 + 6개 `pdca-eval-*.md` non-existent agent assertion 삭제 (8 TC)
- [ ] `test/contract/docs-code-sync.test.js` — 동일 카운트 cascade (11 TC)
- [ ] `test/contract/v2112-deep-qa-invariants.contract.test.js` — `142 lib modules` → `177` (L3-006), `cc-event-log.ndjson` 검사를 runtime-conditional로 변경 (L3-002)
- [ ] `test/contract/orchestrator.test.js` — "회원가입" routing 정책 업데이트 반영 (`bkend-expert` agent 허용 추가, 2 TC)
- [ ] `test/contract/status-split.test.js` — `status-core exports 17 functions` 실제 export 수 갱신 (1 TC)
- [ ] `test/unit/pdca-status-full.test.js` PS-026 — `src/features/auth/login.js` → `'auth'` 기대를 #89 fix 반영하여 `null` 또는 fallback 동작으로 갱신 (1 TC)
- [ ] `test/unit/trigger.test.js` U-TRG-016 — floating-point 비교를 `Math.abs(a-b) < 1e-9`로 교정 (1 TC)
- [ ] `test/unit/project-isolation.test.js` ISO-09 — `lib/pdca/status.js` (facade) → `lib/pdca/status-core.js` 검사로 경로 갱신 (1 TC)
- [ ] `tests/qa/v2113-sprint-5-quality-docs.test.js` — `10/10 PASS` → `14/14 PASS` (v2.1.16 SC-11/12/13/14 추가 반영, 1 TC)

**P4 — CI 강화 (재발 방지 1 file)**:
- [ ] `.github/workflows/contract-check.yml`에 step 추가:
  - `node tests/qa/bkit-full-system.test.js` (PR/push 시 release gate)
  - `node test/contract/docs-code-sync.test.js` (counts drift detector)

**P5 — 검증 + 보고**:
- [ ] `node test/contract/scripts/qa-aggregate.js` 재실행: FAIL=0 + expected-failure 갱신
- [ ] `docs/04-report/features/v2116-release-hardening.report.md` 작성
- [ ] `CHANGELOG.md` v2.1.16 섹션에 hardening sub-section 추가

### 2.2 Out of Scope

- v2.1.16 4 feature fix (#92/93/94/95) 자체 — 별도 사이클에서 완료, 본 plan은 메타데이터 + 테스트 인프라 한정
- v2.1.17 신규 기능 (deferred ENH-281~ENH-298 등 27개 backlog 항목)
- Skill/Agent behavior test 신규 작성 (44 skills × 34 agents 행동 단위 테스트) — 원칙상 LLM 단위 검증 불가, 별도 dogfooding 메타로 분리
- CC v2.1.144 영향 분석 ENH 신규 — 본 cycle과 무관
- README.md 전체 재작성 — badge line만 부분 patch

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Acceptance Criteria |
|----|-------------|---------------------|
| FR-1 | P1 3건 version sync | `grep "Version-2.1.16" README.md` 1+ hit, `grep "v2.1.16" hooks/session-start.js hooks/startup/session-context.js` 각 1+ hit |
| FR-2 | P2 orphan 4 file 삭제 | `ls test/unit/{context-loader,impact-analyzer,invariant-checker,scenario-runner}.test.js 2>/dev/null` 출력 0 |
| FR-3 | P3 11 file stale baseline 갱신 | 각 file `node <path>` 단독 실행 시 FAIL 0 (단, runtime-dep TC는 SKIP 마킹) |
| FR-4 | P4 CI workflow 갱신 | `.github/workflows/contract-check.yml`에 `tests/qa/bkit-full-system.test.js` step 존재 |
| FR-5 | aggregate FAIL 0 | `node test/contract/scripts/qa-aggregate.js` 출력 `FAIL: 0` (+ expected-failure에 등록된 항목 제외) |

### 3.2 Non-Functional Requirements

| ID | Requirement | Threshold |
|----|-------------|-----------|
| NFR-1 | 회귀 0건 | 이전 3,808 PASS가 본 cycle 후 ≥ 3,808 PASS 유지 (orphan 삭제 분 차감 후 ≥3,808 - 4 = 3,804) |
| NFR-2 | CI 실행 시간 +30s 이내 | 추가 step 2건 모두 < 30s |
| NFR-3 | Documentation parity | docs/04-report/features/v2116-release-hardening.report.md 작성 |

---

## 4. Success Criteria

1. **하드 게이트**: `node tests/qa/bkit-full-system.test.js` 36/36 PASS (현재 33/36 PASS, 3 FAIL)
2. **소프트 게이트**: `node test/contract/scripts/qa-aggregate.js` FAIL count 31 → 0
3. **문서 게이트**: 본 plan + design + report 3 docs 존재, CHANGELOG v2.1.16 hardening sub-section 추가
4. **CI 게이트**: `.github/workflows/contract-check.yml` 변경 PR이 CI 통과
5. **체크인 가능성**: `git status` clean, `git diff main` 변경분 모두 본 plan SCOPE 내

---

## 5. Constraints

- **bkit 언어 규칙 (.claude/CLAUDE.md)**: docs/는 한국어, 코드/주석은 영어 유지
- **PR 단위**: 본 hardening은 v2.1.16 4-feature fix와 별도 commit chain — release tag는 양쪽 모두 merge 후
- **Test maintenance 비용**: stale baseline 갱신은 카운트 숫자만 변경, 의미론 변경 금지
- **CI grace period**: bkit-full-system을 mandatory step으로 추가 후 즉시 fail-block — 본 PDCA 내에서 3 FAIL 해소가 선결

---

## 6. Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| stale-baseline 갱신 시 새로운 TC 작성 실수 → 회귀 | Medium | Medium | 각 file 변경 후 즉시 `node <path>` 단일 실행, qa-aggregate는 마지막에 |
| README.md badge 변경이 GitHub Action에 의해 자동 revert | Low | Low | `find .github -name "*.yml" | xargs grep -l README`로 사전 확인 |
| 4 orphan 삭제 후 hidden import 발견 → break | Low | High | 삭제 전 `grep -r "context-loader\|impact-analyzer\|invariant-checker\|scenario-runner" --include="*.js" --include="*.json"` 사전 검사 |
| `docs-code-sync.test.js` cascade 11 TC 갱신 후 추가 drift 발견 | Medium | Low | 갱신 후 즉시 rerun, 추가 drift 시 본 plan SCOPE 확장 또는 carry-over |
| CC v2.1.144 호환 메모리 갱신이 본 cycle scope 침범 | Low | Low | 본 cycle은 release hardening 한정 명시, CC 영향 분석은 별도 |

---

## 7. Approach

### 7.1 Methodology

PDCA 사이클 (Plan → Design → Do → Check → Act). 본 plan은 Plan 단계 산출물.

### 7.2 Phase Breakdown

| Phase | Output | Estimated Duration |
|-------|--------|-------------------|
| Plan | 본 문서 + Design 문서 작성 | 30 min |
| Design | `docs/02-design/features/v2116-release-hardening.design.md` (변경 surface 명세) | 20 min |
| Do | P1 (5 min) → P2 (5 min) → P3 (60 min, 11 file) → P4 (10 min) | 80 min |
| Check | qa-aggregate 재실행 + diff 분석 | 15 min |
| Act | Report 작성 + CHANGELOG patch | 20 min |

### 7.3 Sequencing Constraint

P1 → P2 → P3 → P4 → Check → Act 직렬. P3 11 file은 내부적으로 병렬 가능하나 검증은 순차.

---

## 8. Architecture Considerations

| 관점 | 평가 |
|------|------|
| **Performance** | CI 추가 step 2건 < 30s 영향. 런타임에는 영향 없음 |
| **Security** | 변경 surface 모두 docs/test 메타데이터, 실행 코드 unchanged. OWASP 영향 없음 |
| **Scalability** | qa-aggregate 151 file → 일부 file 삭제로 ~147 file로 감소 (개선) |
| **Maintainability** | stale-baseline 갱신은 장기 부채 청산. CI gate는 향후 회귀 자동 검출 |
| **Cost** | infra cost 변동 없음, CI 분당 비용 +1¢ 미만 |
| **Compliance** | bkit Apache 2.0 라이선스 무변경, .claude/CLAUDE.md 언어 규칙 준수 |

---

## 9. Tradeoffs

| Option | Pros | Cons | Recommendation |
|--------|------|------|----------------|
| (A) 본 plan: 3-tier 일괄 fix + CI 강화 | 재발 방지, 신뢰 회복, 부채 청산 | 작업량 80 min, P3 갱신 신중 필요 | **권장** |
| (B) P1만 hotfix, P2/P3는 carry-over | 빠른 release | v2.1.17에서도 동일 패턴 반복 가능 | 비권장 |
| (C) 전체 deferred, v2.1.16 그대로 release | 0 추가 작업 | README가 v2.1.14 badge로 GitHub 노출, 사용자 혼란 | 비권장 |

---

## 10. Deployment Strategy

| 측면 | 내용 |
|------|------|
| **전략** | Rolling — 본 branch (`feature/v2116-issue-fixes`)에 추가 commit |
| **순서** | (1) P1-P4 commit → (2) qa-aggregate verify → (3) PR open → (4) CI green → (5) merge to main → (6) git tag v2.1.16 → (7) npm publish |
| **Rollback Plan** | 단순 `git revert <hash>` — 본 plan 변경 surface 모두 file 단위 patch |
| **모니터링** | 다음 PR/push에서 contract-check.yml의 bkit-full-system step PASS 확인 |

---

## 11. Detailed Task Breakdown

§2.1 In Scope 항목 그대로. 각 sub-task는 TaskCreate로 등록됨 (Task #11~#16 참조).

---

## §14 Self-Assessment Checklist (M8 → 100)

- [x] §1 Overview (purpose + background + related docs)
- [x] §2 Scope (In + Out)
- [x] §3 Requirements (FR + NFR with measurable AC)
- [x] §4 Success Criteria (hard/soft/doc/CI gate)
- [x] §5 Constraints
- [x] §6 Risks (with mitigation)
- [x] §7 Approach (methodology + phase + sequencing)
- [x] §8 Architecture Considerations (perf/sec/scale/maint/cost/compliance)
- [x] §9 Tradeoffs
- [x] §10 Deployment Strategy
- [x] §11 Detailed Task Breakdown
- [x] Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE)
- [x] Executive Summary (Problem/Solution/Effect/Value)
- [x] §14 self-assessment (this section)

Mandatory items: 13/13 = **M8 designCompleteness candidate = 100**
