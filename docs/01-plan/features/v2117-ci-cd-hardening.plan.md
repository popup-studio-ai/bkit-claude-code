---
template: plan
version: 1.3
feature: v2117-ci-cd-hardening
date: 2026-05-20
author: kay
project: bkit
version: 2.1.17
---

# v2117-ci-cd-hardening — Planning Document

> **Summary**: 5/12 dead code cleanup 이후 8일간 누적된 `Invocation Contract Check` red 상태를 근본 차원에서 해소. Agent deprecation governance 신설 + dual baseline (LTS + Latest) 비교 + L2 Smoke / L3 Compat workflow 통합으로 동일 패턴 재발 영구 차단.
>
> **Project**: bkit
> **Version**: 2.1.17 (target)
> **Author**: kay
> **Date**: 2026-05-20
> **Status**: Active
> **PDCA cycle parent**: post-v2116 hardening (CI/CD 성숙도 5축 중 4축 close)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 2026-05-12 commit `967cd8f` (refactor v2.1.13)에서 `agents/pdca-eval-{act,check,design,do,plan,pm}.md` 6개가 제거되었으나, baseline v2.1.9 manifest에는 여전히 등재 → 그 이후 8일간 main 푸시 4건 / PR 1건 모두 `Invocation Contract Check` workflow red. v2.1.15 + v2.1.16 GA가 red 상태 그대로 릴리스됨. CI가 게이트 역할 못 함. |
| **Solution** | (A) Agent/MCP tool용 `deprecatedIn` frontmatter governance 추가 — Skill과 동일 패턴. (B) 6개 `pdca-eval-*` deprecation stub 작성으로 5/12 의도를 명시적 무덤화. (C) v2.1.16 baseline 추가 캡처 — workflow는 v2.1.9 LTS + v2.1.16 Latest **dual 비교**. (D) baseline rollforward SOP 가이드 신설. (E) L2 Smoke / L3 Compat workflow에 통합 — 정적+런타임 두 층 검사. |
| **Function/UX Effect** | (a) `Invocation Contract Check` 즉시 green. (b) 차후 누군가 agent/MCP tool 제거 시 deprecation stub 강제 — 우연 사고 차단. (c) v2.1.9 → v2.1.16 surface drift 누적 기록 보존. (d) L2/L3 자동 검출로 런타임 회귀 즉시 가시화. |
| **Core Value** | "CI red인데 release" 라는 신뢰성 부채 종결. 거버넌스 + 윈도우 다층화 + 정적/런타임 양면 검사로 동일 사고 재발 차단. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 2026-05-12 `967cd8f`에서 6 agent 제거 → 베이스라인 contract test가 무조건 fail. 8일 누적, v2.1.15/v2.1.16 GA가 red인 채 릴리스. 근본 원인 2개: ① Agent에 `deprecatedIn` governance 부재 (Skill만 존재), ② Baseline rollforward SOP 부재 |
| **WHO** | bkit 메인테이너 (release 신뢰성), 컨트리뷰터 (CI feedback 정확성), 미래 v2.1.17+ 작업자 (deprecation governance 강제) |
| **RISK** | (1) v2.1.16 baseline 캡처 시 현재 surface가 dependency drift를 흡수 → 보호: dual 비교로 v2.1.9 LTS 보존. (2) deprecation stub 작성 시 contract test가 stub에 대해 L1 frontmatter 검사 실패 가능 → 보호: parseFrontmatter empty body 허용 검증. (3) L2/L3 workflow 통합 시 기존 L2 test가 새 회귀 노출 가능 → 보호: 로컬 dry-run 후 통합 |
| **SUCCESS** | (a) main 브랜치 `Invocation Contract Check` green. (b) `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` PASS. (c) `node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4` PASS. (d) Agent에 `deprecatedIn` 선언 시 L4 우회 동작 unit test 통과. (e) L2 Smoke / L3 Compat workflow에 통합되어 PR마다 자동 실행. (f) `docs/06-guide/contract-baseline-rollforward.guide.md` 신설. (g) CI/CD 성숙도 매트릭스 5축 중 4축 close (branch protection만 user manual). |
| **SCOPE** | Phase 1 Plan/Design → Phase 2 governance 코드 변경 (3 file) → Phase 3 deprecation stub (6 file) → Phase 4 v2.1.16 baseline 캡처 → Phase 5 SOP 가이드 → Phase 6 workflow 통합 → Phase 7 로컬 전체 검증 → Phase 8 Analysis/Report → Phase 9 PR |

---

## 1. Overview

### 1.1 Purpose

5/12부터 누적된 `Invocation Contract Check` workflow red 상태를 **거버넌스, 윈도우, 검사 층** 세 차원에서 근본 해결한다. 동일 패턴(agent/MCP tool을 baseline 등재 상태로 제거)이 다시 발생해도 자동 검출되도록 contract framework를 완성한다.

### 1.2 Background

#### 1.2.1 사고 타임라인

| 날짜 | 커밋/PR | 사건 |
|------|---------|------|
| 2026-04-22 | (baseline collected) | `_MANIFEST.json.collectedAt` — v2.1.9 baseline 캡처. 6개 `pdca-eval-*` agent 등재 |
| 2026-05-12 | `967cd8f` | refactor(v2.1.13): sprint integration gaps + dead code cleanup. **6개 agent 파일 삭제, baseline 미갱신, deprecation 메커니즘 부재** |
| 2026-05-12 ~ 2026-05-20 | (8일) | `Invocation Contract Check` 매 push마다 6 FAILURE. main 빨강. release 4건 진행 |
| 2026-05-18 | PR #88 / push | v2.1.15 issue #89 fix — red 상태에서 머지 |
| 2026-05-20 | PR #96 / push | v2.1.16 GA — red 상태에서 머지 (`d37e474`, `4b78045`) |
| 2026-05-20 | `762b870` (latest main) | cc-version-analysis v2.1.145 — 동일 fail |
| 2026-05-20 | (현재) | 사용자가 처음 인지 |

#### 1.2.2 코드 레벨 근본 원인

**File**: `test/contract/scripts/contract-test-run.js:197-203`

```javascript
// Agents
const currentAgents = collectAgents();
for (const agentName of manifest.agents.names) {
  if (!currentAgents.names.includes(agentName)) {
    assert(false, `L4 FAIL agent '${agentName}' removed (check deprecation)`);
  }
}
```

대조: `:181-196` Skills 블록은 `fm.deprecatedIn` frontmatter 우회 메커니즘 존재.

**비대칭의 영향**:
- Skill 제거: stub MD에 `deprecatedIn: vX.X.X` 명시하면 통과
- Agent 제거: **우회 메커니즘 없음** — baseline 갱신 외 해결 불가
- MCP tool 제거: Agent와 동일 (`:204-213`)

#### 1.2.3 운영 레벨 근본 원인

| # | 결함 | 증거 |
|---|------|------|
| 1 | Baseline 비교 기준 v2.1.9 하드코딩, rollforward SOP 없음 | `.github/workflows/contract-check.yml:32` |
| 2 | Branch protection 없음 (main에 red 푸시 가능) | release 4건이 red 상태로 통과 |
| 3 | L2 Smoke / L3 Compat workflow 미통합 | workflow 주석 `"out of scope for this minimal runner"` (`contract-test-run.js:6-7`) |
| 4 | L5 E2E는 `continue-on-error: true` (observational only) | `contract-check.yml:` `contract-l5-e2e` job |
| 5 | Agent deprecation governance 부재 | 위 1.2.2 |

### 1.3 Related Documents

- 원인 커밋: `git show 967cd8f --stat` (6 agents/pdca-eval-*.md deleted)
- Baseline manifest: `test/contract/baseline/v2.1.9/_MANIFEST.json`
- Workflow: `.github/workflows/contract-check.yml`
- 이전 contract 도입 plan: `docs/archive/2026-05/01-plan/features/bkit-v2110-invocation-contract-addendum.plan.md`
- 이전 PDCA (v2.1.16 hardening): `docs/01-plan/features/v2116-release-hardening.plan.md`
- 사용자 피드백: `memory/feedback_thorough_complete.md`, `memory/feedback_thorough_qa.md`

---

## 2. Scope

### 2.1 In Scope

**P1 — 거버넌스 (governance)**

- [ ] `test/contract/scripts/contract-test-run.js` L4 Agents 분기에 `deprecatedIn` 우회 추가 (Skills 패턴 동일)
- [ ] L4 MCP tools 분기에도 동일 패턴 적용 (장기 일관성)
- [ ] `test/contract/scripts/contract-baseline-collect.js` `collectAgents` / `collectMCPTools`에서 `deprecatedIn` 필드 캡처 (baseline JSON에 보존)

**P2 — Deprecation stub (6 agent 무덤화)**

- [ ] `agents/pdca-eval-act.md` (stub with `deprecatedIn: v2.1.13`)
- [ ] `agents/pdca-eval-check.md`
- [ ] `agents/pdca-eval-design.md`
- [ ] `agents/pdca-eval-do.md`
- [ ] `agents/pdca-eval-plan.md`
- [ ] `agents/pdca-eval-pm.md`

**P3 — Dual baseline**

- [ ] `test/contract/baseline/v2.1.16/_MANIFEST.json` + `agents/`, `skills/`, `mcp-tools/`, `hook-events.json`, `slash-commands.json` 캡처
- [ ] `.github/workflows/contract-check.yml`에 v2.1.16 비교 step 추가 (v2.1.9 step과 병행)

**P4 — Baseline rollforward SOP**

- [ ] `docs/06-guide/contract-baseline-rollforward.guide.md` (Korean) — 언제/왜/누가/어떻게 + LTS 정책

**P5 — L2/L3 workflow 통합**

- [ ] `.github/workflows/contract-check.yml`에 L2 step (l2-smoke.test.js, l2-hook-attribution.test.js) 추가
- [ ] L3 step (l3-mcp-compat.test.js, l3-mcp-runtime.test.js) 추가 (기존 integration-runtime은 이미 통합됨, 보완)

**P6 — 검증 + 문서**

- [ ] 로컬에서 workflow 모든 step 순차 실행 (green 확인)
- [ ] `docs/02-design/features/v2117-ci-cd-hardening.design.md`
- [ ] `docs/03-analysis/features/v2117-ci-cd-hardening.gap.md`
- [ ] `docs/04-report/features/v2117-ci-cd-hardening.report.md`
- [ ] PR 작성 (`feature/v2117-ci-cd-hardening`)

### 2.2 Out of Scope

- **Branch protection 설정**: GitHub repository settings 변경 필요. 사용자 직접 처리 (admin token 보유자). 본 PDCA는 manual 안내만 제공.
- **CI red 알림 (Slack/이메일)**: 사용자 명시적 거부 — "깃액션 모니터링 할거야".
- **L5 E2E 실제 구현**: 현재 `continue-on-error: true` observational 모드 유지. invocation-inventory.test.js로 충분.
- **삭제된 6 agent 기능 복구**: 5/12 cleanup 의도 존중.
- **bkit-gemini fork 동기**: 별개 fork, 본 PDCA 범위 외.

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | `runL4Deprecation` Agent 블록은 `deprecatedIn` frontmatter 존재 시 통과 | High | Pending |
| FR-02 | `runL4Deprecation` MCP tool 블록도 stub MD 기반 `deprecatedIn` 우회 (장기) | Medium | Pending |
| FR-03 | `collectAgents`/`collectMCPTools`/`collectSkills` JSON 출력에 `deprecatedIn` 필드 포함 | High | Pending |
| FR-04 | 6개 `pdca-eval-*.md` stub 작성: `deprecatedIn`, `deprecatedReason`, `replacedBy` frontmatter | High | Pending |
| FR-05 | `test/contract/baseline/v2.1.16/` 전체 캡처 (manifest + agents + skills + mcp-tools + hook-events + slash-commands) | High | Pending |
| FR-06 | `.github/workflows/contract-check.yml`에 v2.1.16 비교 step 추가 (v2.1.9와 병행) | High | Pending |
| FR-07 | `.github/workflows/contract-check.yml`에 L2 Smoke + L2 Hook Attribution + L3 MCP Compat + L3 MCP Runtime step 추가 | High | Pending |
| FR-08 | `docs/06-guide/contract-baseline-rollforward.guide.md` 작성 — LTS 정책, rollforward 절차, 의사결정 트리 | Medium | Pending |
| FR-09 | 모든 변경 후 로컬 dry-run: `node test/contract/scripts/contract-test-run.js --compare v2.1.9 --level L1,L4` PASS | High | Pending |
| FR-10 | 모든 변경 후 로컬 dry-run: `node test/contract/scripts/contract-test-run.js --compare v2.1.16 --level L1,L4` PASS | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Determinism | Baseline JSON sort된 키, 줄 끝 LF — 동일 입력 동일 출력 | `sortKeysDeep` (`contract-baseline-collect.js:74`) — 기존 메커니즘 활용 |
| Backward compatibility | v2.1.9 baseline 형식 그대로 유지, `deprecatedIn` 필드는 옵셔널 | parseFrontmatter는 missing key를 `undefined` 처리 (기존 동작) |
| Workflow cost | 추가 step 5개. 각 < 5s. Total CI 시간 증가 < 30s | GitHub Actions duration metric |
| Documentation language | docs/ 한국어 유지, code/workflow/stub 영어 (CLAUDE.md 규칙) | grep 수동 검증 |
| Test coverage | 새 분기에 contract test 자체 추가 (deprecatedIn 우회 동작 검증) | `test/contract/agent-deprecation.test.js` 신설 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] FR-01 ~ FR-10 모두 구현
- [ ] `.github/workflows/contract-check.yml`이 `feature/v2117-ci-cd-hardening` 브랜치에서 green
- [ ] 로컬 dry-run 4종 PASS:
  - [ ] `contract-test-run.js --compare v2.1.9 --level L1,L4`
  - [ ] `contract-test-run.js --compare v2.1.16 --level L1,L4`
  - [ ] L2: `node test/contract/l2-smoke.test.js`
  - [ ] L3: `node test/contract/l3-mcp-compat.test.js`
- [ ] PR 작성, description에 root cause + 5축 매트릭스 + verification 포함
- [ ] PDCA Plan/Design/Analysis/Report 4문서 모두 작성

### 4.2 Quality Criteria

- [ ] Agent deprecation 동작 unit test 추가 (positive: deprecated 통과, negative: 미선언 fail)
- [ ] `parseFrontmatter` empty body / stub MD에 대해 robust한지 확인
- [ ] Baseline v2.1.16 캡처본을 git diff로 visual review (예상치 못한 surface change 없는지)
- [ ] `node test/contract/scripts/qa-aggregate.js` 회귀 0건

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| R1: deprecation stub의 L1 frontmatter 검사 실패 (예: 필수 필드 누락) | High | Medium | stub에도 v2.1.9 baseline 형식 따르는 최소 필드 포함 (name, description). L1-AG가 model 필드를 baseline에서 검사하므로 stub에 model 명시 |
| R2: v2.1.16 baseline 캡처 시 의도치 않은 surface 흡수 | Medium | Low | git diff로 변경 파일 일일 검토. baseline = 현재 상태 snapshot이지만 dual 비교로 v2.1.9 drift 보존 |
| R3: L2/L3 workflow 통합 시 기존 L2 테스트가 새 회귀 노출 | High | Medium | 로컬 사전 dry-run 필수. 회귀 발견 시 별도 fix PDCA로 분리 |
| R4: Agent deprecation 우회로 거버넌스 약화 | Medium | Low | `replacedBy` 필드 강제 (FR-04). 차후 deprecated stub 50% 초과 시 alert (별도 PDCA) |
| R5: baseline v2.1.16에 자기 자신 (deprecation stub 6개) 포함 → 미래 비교에서 stub 제거 시 또 fail | Medium | High | rollforward SOP에 "deprecation stub은 baseline 캡처에서 제외" 규칙 명시. 또는 stub에 `deprecatedIn` 캡처되도록 보장 (FR-03) |
| R6: parseFrontmatter가 multi-line 값 (예: `replacedBy: [a, b]`) 처리 부족 | Low | Medium | 단일 string `replacedBy: report-generator` 형태로 통일. multi-replacedBy는 description body에 기술 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `test/contract/scripts/contract-test-run.js` | Script | runL4Deprecation Agents/MCP 분기에 `deprecatedIn` 우회 추가 |
| `test/contract/scripts/contract-baseline-collect.js` | Script | collectAgents/MCPTools/Skills JSON에 `deprecatedIn` 필드 포함 |
| `agents/pdca-eval-{act,check,design,do,plan,pm}.md` | Agent stub (신규 6 file) | deprecation tombstone — frontmatter only, body 1-line |
| `test/contract/baseline/v2.1.16/` | Baseline (신규) | v2.1.16 시점 invocation surface snapshot |
| `.github/workflows/contract-check.yml` | CI config | v2.1.16 비교 step + L2/L3 step 추가 |
| `docs/06-guide/contract-baseline-rollforward.guide.md` | Doc (신규) | SOP — LTS 정책, rollforward 절차, 의사결정 트리 |
| `test/contract/agent-deprecation.test.js` | Unit test (신규) | deprecatedIn 우회 동작 검증 |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `contract-test-run.js` | EXECUTE | `.github/workflows/contract-check.yml:32` | green 전환 |
| `contract-test-run.js` | EXECUTE | `test/contract/scripts/qa-aggregate.js:134` | aggregate 결과 변경 (FAIL 6 → 0) |
| `contract-test-run.js` | IMPORT | `test/contract/integration-runtime.test.js` (간접) | 동일 모듈 require, 영향 없음 |
| `contract-baseline-collect.js` | EXECUTE | `contract-test-run.js:20` (require) | 출력 schema에 옵셔널 필드 추가, parsing 영향 없음 |
| `agents/` (디렉터리) | SCAN | `collectAgents` (`contract-baseline-collect.js:122`) | 6 stub 추가, deprecatedIn 캡처로 baseline에 보존 |
| `agents/` | SCAN | `tests/qa/bkit-full-system.test.js` agent count check | **요검증** — agent count assertion 영향 가능 |
| `.github/workflows/contract-check.yml` | TRIGGER | push, pull_request | step 추가, 기존 step 영향 없음 |

### 6.3 Verification

- [ ] `tests/qa/bkit-full-system.test.js` agent count 영향 확인 — 34 agent 기대값이라면 6 stub 추가 시 40 또는 stub 제외 카운트 정책 확인
- [ ] `lib/domain/rules/docs-code-invariants.js` agent count SoT 영향 확인
- [ ] `scripts/docs-code-sync.js` 영향 확인
- [ ] L1 Frontmatter Schema 가 stub의 (name, description 외 필드 부재) 통과하는지 확인
- [ ] `scripts/check-domain-purity.js` 영향 없음 (agents/ 폴더는 domain 아님)

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| Starter | Simple structure | Static sites | ☐ |
| Dynamic | Feature-based | Web apps with BaaS | ☐ |
| **Enterprise** | Strict layer separation, DI, contract tests | bkit (self) | ☑ |

bkit은 Enterprise — contract framework, Clean Architecture, 6-Layer Defense 보유.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Baseline 정책 | LTS 고정 / Rolling / Dual | **Dual (v2.1.9 LTS + v2.1.16 Latest)** | LTS는 drift 누적 추적, Latest는 노이즈 플로어 — 둘 다 보존 |
| Agent deprecation 메커니즘 | tombstone MD / 별도 registry JSON / git tag | **tombstone MD with `deprecatedIn` frontmatter** | Skill 패턴 일관성, `parseFrontmatter` 재사용 |
| Workflow 통합 시점 | 별도 PDCA / 본 PDCA에 포함 | **본 PDCA에 포함** | "꼼꼼하고 완벽하게" 사용자 요청, 5축 매트릭스 한 번에 close |
| L2/L3 통합 위치 | 새 job / 기존 contract-l1-l4 job 확장 | **기존 job 확장** | dependency setup 재사용, 비용 절감 |
| Stub MD body 내용 | 1줄 placeholder / 상세 deprecation rationale | **상세 rationale (replacedBy + reason + reference commit)** | 미래 archeology를 위함 |

### 7.3 Clean Architecture Approach

본 PDCA는 **Presentation Layer (CI/CD) + Test Infrastructure** 변경. Domain/Application/Infrastructure Layer 변경 없음.

```
영향 받는 Layer:
├── Presentation
│   └── .github/workflows/contract-check.yml         [변경]
├── Test Infrastructure
│   ├── test/contract/scripts/contract-test-run.js   [변경]
│   ├── test/contract/scripts/contract-baseline-collect.js [변경]
│   ├── test/contract/baseline/v2.1.16/              [신규]
│   └── test/contract/agent-deprecation.test.js      [신규]
├── Agent Definitions
│   └── agents/pdca-eval-*.md (6 stub)               [신규]
└── Documentation
    └── docs/06-guide/contract-baseline-rollforward.guide.md [신규]
```

Domain Layer purity (`scripts/check-domain-purity.js`) 영향 없음 (agents/ 는 domain 아님).

---

## 8. CI/CD Maturity Matrix (5-Axis Close 추적)

본 PDCA는 5축 중 4축 close, 1축은 user manual 안내.

| 축 | 현재 | v2117 적용 후 | Close 여부 |
|---|------|--------------|----------|
| **Detection (검출)** | L1+L4 static OK, L2/L3 미통합 | L1+L4 (Dual baseline) + L2 Smoke + L2 Hook Attribution + L3 MCP Compat + L3 MCP Runtime | ✅ close |
| **Enforcement (강제)** | Push 후 검사, branch protection 없음 | Required check 후보 (user manual로 설정) | ⚠️ user manual |
| **Recovery (복구)** | red 누적, SOP 없음 | rollforward SOP + dual baseline window | ✅ close |
| **Governance (거버넌스)** | Skill만 deprecation 메커니즘 | Agent + MCP tool도 동일 패턴 | ✅ close |
| **Evolution (진화)** | Baseline rollforward 없음 | Dual baseline + 명시적 LTS 정책 | ✅ close |

---

## 9. Convention Prerequisites

bkit project — 기존 컨벤션 준수.

- `CLAUDE.md` 한국어/영어 분리 규칙 — docs/ 한국어, code/workflow/stub 영어
- ESLint, Prettier 기존 설정 사용 — 신규 script 추가 없음
- baseline JSON: `sortKeysDeep` + LF 줄 끝 (deterministic)
- Agent frontmatter: name, description, model, effort (기존 schema)
- 추가 필드: `deprecatedIn`, `deprecatedReason`, `replacedBy` (옵셔널)

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`v2117-ci-cd-hardening.design.md`) — 상세 algorithm, schema, workflow diff
2. [ ] P1 거버넌스 코드 변경 (`contract-test-run.js`, `contract-baseline-collect.js`)
3. [ ] P2 deprecation stub 6 file 작성
4. [ ] P3 v2.1.16 baseline 캡처 + workflow dual 비교 추가
5. [ ] P4 rollforward SOP 가이드 작성
6. [ ] P5 L2/L3 workflow 통합
7. [ ] P6 로컬 dry-run + Analysis + Report
8. [ ] PR 작성 (`feature/v2117-ci-cd-hardening`)
9. [ ] (user) main branch protection 설정 (gh repo edit / settings UI)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-05-20 | Initial draft after 5-axis maturity analysis | kay |
