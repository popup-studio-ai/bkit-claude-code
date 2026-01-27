# bkit-comprehensive-test Planning Document

> **Summary**: hooks-json-integration 완료 후 전체 bkit 시스템의 종합 테스트 계획
>
> **Project**: bkit-claude-code
> **Version**: 1.4.4
> **Author**: Claude
> **Date**: 2026-01-27
> **Status**: In Progress

---

## 1. Overview

### 1.1 Purpose

hooks-json-integration 기능 구현 완료 후, bkit Vibecoding Kit의 모든 구성 요소(Skills, Agents, Hooks, PDCA 사이클)가 의도대로 동작하는지 종합적으로 검증합니다.

### 1.2 Background

- **hooks-json-integration 완료**: GitHub Issue #9354 워크어라운드로 모든 hooks를 `hooks.json`으로 통합
- **통합 스크립트 생성**: `unified-stop.js`, `unified-bash-pre.js`, `unified-write-post.js`, `unified-bash-post.js`
- **검증 필요**: 22개 Skills, 11개 Agents, 6개 Hook 이벤트의 정상 동작 확인

### 1.3 Related Documents

- hooks-json-integration Plan: `docs/01-plan/features/hooks-json-integration.plan.md`
- hooks.json: `hooks/hooks.json`
- v1.4.4 Enhancement Report: `docs/04-report/features/v1.4.4-comprehensive-enhancement.report.md`

---

## 2. Scope

### 2.1 In Scope

- [x] hooks.json 통합 Hook 테스트 (6개 이벤트)
- [x] Skills 기능 테스트 (22개)
- [x] Agents 기능 테스트 (11개)
- [x] PDCA Skill 명령어 테스트 (8개)
- [x] 통합 스크립트 조건부 실행 테스트 (4개)
- [x] Task Management System 연동 테스트
- [x] End-to-End 시나리오 테스트

### 2.2 Out of Scope

- 외부 MCP 서버 연동 테스트
- 성능 벤치마킹
- GitHub Issue #9354 직접 해결

---

## 3. Test Requirements

### 3.1 Functional Requirements - Hooks

| ID | Requirement | Priority | Test Method |
|----|-------------|----------|-------------|
| TC-H01 | SessionStart hook이 세션 시작 시 1회 실행됨 | Critical | 세션 시작 후 로그 확인 |
| TC-H02 | PreToolUse(Write\|Edit)가 파일 수정 전 실행됨 | Critical | Edit 실행 후 hook 로그 확인 |
| TC-H03 | PreToolUse(Bash)가 명령 실행 전 실행됨 | High | Bash 실행 후 hook 로그 확인 |
| TC-H04 | PostToolUse(Write)가 파일 작성 후 실행됨 | Critical | Write 실행 후 .pdca-status.json 업데이트 확인 |
| TC-H05 | PostToolUse(Bash)가 명령 완료 후 실행됨 | High | Bash 실행 후 hook 로그 확인 |
| TC-H06 | PostToolUse(Skill)이 Skill 실행 후 호출됨 | High | /pdca 실행 후 확인 |
| TC-H07 | Stop hook이 세션/태스크 종료 시 실행됨 | High | 종료 시 cleanup 동작 확인 |
| TC-H08 | UserPromptSubmit이 사용자 입력 시 실행됨 | Critical | 프롬프트 입력 후 트리거 감지 확인 |
| TC-H09 | PreCompact가 컨텍스트 압축 전 실행됨 | Medium | 긴 세션 후 압축 시 확인 |

### 3.2 Functional Requirements - Skills (22개)

| ID | Skill | Priority | Test Method |
|----|-------|----------|-------------|
| TC-S01 | **pdca** | Critical | `/pdca status`, `/pdca plan`, `/pdca next` 실행 |
| TC-S02 | **bkit-rules** | Critical | 파일 수정 시 자동 규칙 적용 확인 |
| TC-S03 | **development-pipeline** | High | `/pipeline-status` 실행 |
| TC-S04 | **code-review** | High | 코드 리뷰 요청 시 동작 확인 |
| TC-S05 | **zero-script-qa** | High | QA 트리거 동작 확인 |
| TC-S06 | **claude-code-learning** | Medium | 학습 가이드 요청 시 동작 확인 |
| TC-S07 | **github-integration** | Medium | GitHub 관련 요청 시 동작 확인 |
| TC-S08 | **starter** | High | Starter 레벨 프로젝트 가이드 |
| TC-S09 | **dynamic** | High | Dynamic 레벨 프로젝트 가이드 |
| TC-S10 | **enterprise** | High | Enterprise 레벨 가이드 |
| TC-S11 | **mobile-app** | Medium | 모바일 앱 개발 가이드 |
| TC-S12 | **desktop-app** | Medium | 데스크톱 앱 개발 가이드 |
| TC-S13 | **phase-1-schema** | High | 스키마 정의 가이드 |
| TC-S14 | **phase-2-convention** | High | 컨벤션 정의 가이드 |
| TC-S15 | **phase-3-mockup** | Medium | 목업 생성 가이드 |
| TC-S16 | **phase-4-api** | High | API 설계 가이드 |
| TC-S17 | **phase-5-design-system** | Medium | 디자인 시스템 가이드 |
| TC-S18 | **phase-6-ui-integration** | Medium | UI 통합 가이드 |
| TC-S19 | **phase-7-seo-security** | Medium | SEO/보안 가이드 |
| TC-S20 | **phase-8-review** | High | 코드 리뷰 가이드 |
| TC-S21 | **phase-9-deployment** | Medium | 배포 가이드 |
| TC-S22 | **bkit-templates** | Low | 템플릿 제공 확인 |

### 3.3 Functional Requirements - Agents (11개)

| ID | Agent | Priority | Test Method |
|----|-------|----------|-------------|
| TC-A01 | **gap-detector** | Critical | `/pdca analyze` 실행 후 Gap 분석 결과 확인 |
| TC-A02 | **pdca-iterator** | Critical | `/pdca iterate` 실행 후 자동 개선 확인 |
| TC-A03 | **report-generator** | High | `/pdca report` 실행 후 보고서 생성 확인 |
| TC-A04 | **code-analyzer** | High | 코드 품질 분석 요청 시 동작 확인 |
| TC-A05 | **design-validator** | High | 설계 문서 검증 요청 시 동작 확인 |
| TC-A06 | **qa-monitor** | Medium | QA 모니터링 요청 시 동작 확인 |
| TC-A07 | **starter-guide** | Medium | 초보자 가이드 요청 시 동작 확인 |
| TC-A08 | **pipeline-guide** | Medium | 파이프라인 가이드 요청 시 동작 확인 |
| TC-A09 | **bkend-expert** | Medium | bkend.ai 관련 요청 시 동작 확인 |
| TC-A10 | **enterprise-expert** | Medium | 엔터프라이즈 아키텍처 요청 시 동작 확인 |
| TC-A11 | **infra-architect** | Low | 인프라 설계 요청 시 동작 확인 |

### 3.4 Functional Requirements - PDCA Skill Commands

| ID | Command | Priority | Expected Result |
|----|---------|----------|-----------------|
| TC-P01 | `/pdca plan [feature]` | Critical | Plan 문서 생성, .pdca-status.json 업데이트 |
| TC-P02 | `/pdca design [feature]` | Critical | Design 문서 생성, Plan 참조 |
| TC-P03 | `/pdca do [feature]` | High | 구현 가이드 제공 |
| TC-P04 | `/pdca analyze [feature]` | Critical | gap-detector 호출, 분석 결과 생성 |
| TC-P05 | `/pdca iterate [feature]` | High | pdca-iterator 호출, 자동 개선 |
| TC-P06 | `/pdca report [feature]` | High | report-generator 호출, 보고서 생성 |
| TC-P07 | `/pdca status` | Critical | 현재 PDCA 상태 표시 |
| TC-P08 | `/pdca next` | High | 다음 단계 가이드 제공 |

### 3.5 Functional Requirements - Unified Scripts

| ID | Script | Priority | Test Condition |
|----|--------|----------|----------------|
| TC-U01 | `unified-stop.js` | Critical | 각 Skill/Agent 종료 시 적절한 핸들러 실행 |
| TC-U02 | `unified-bash-pre.js` | High | phase-9, zero-script-qa, qa-monitor 활성 시 조건부 실행 |
| TC-U03 | `unified-write-post.js` | Critical | Write 후 PDCA 상태 업데이트, phase-5/6, qa-monitor 조건부 실행 |
| TC-U04 | `unified-bash-post.js` | Medium | Bash 완료 후 조건부 로직 실행 |

---

## 4. Test Plan

### 4.1 Test Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                    bkit Comprehensive Test Plan                  │
├─────────────────────────────────────────────────────────────────┤
│  Category 1: Hook Events (9 tests)                              │
│    ├─ SessionStart                                              │
│    ├─ PreToolUse (Write|Edit, Bash)                            │
│    ├─ PostToolUse (Write, Bash, Skill)                         │
│    ├─ Stop                                                      │
│    ├─ UserPromptSubmit                                          │
│    └─ PreCompact                                                │
├─────────────────────────────────────────────────────────────────┤
│  Category 2: Skills (22 tests)                                  │
│    ├─ Core: pdca, bkit-rules, development-pipeline             │
│    ├─ Level: starter, dynamic, enterprise                       │
│    ├─ Pipeline Phases: phase-1 ~ phase-9                       │
│    └─ Utility: code-review, zero-script-qa, etc.               │
├─────────────────────────────────────────────────────────────────┤
│  Category 3: Agents (11 tests)                                  │
│    ├─ PDCA: gap-detector, pdca-iterator, report-generator      │
│    ├─ Analysis: code-analyzer, design-validator, qa-monitor    │
│    └─ Guide: starter-guide, pipeline-guide, experts            │
├─────────────────────────────────────────────────────────────────┤
│  Category 4: PDCA Commands (8 tests)                            │
│    └─ plan, design, do, analyze, iterate, report, status, next │
├─────────────────────────────────────────────────────────────────┤
│  Category 5: Unified Scripts (4 tests)                          │
│    └─ unified-stop, unified-bash-pre, unified-write-post, etc. │
├─────────────────────────────────────────────────────────────────┤
│  Category 6: End-to-End Scenarios (3 tests)                     │
│    ├─ E2E-01: Full PDCA Cycle                                  │
│    ├─ E2E-02: Pipeline Phase Progression                       │
│    └─ E2E-03: Hook Chain Verification                          │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Test Execution Order

| Phase | Category | Tests | Dependency |
|:-----:|----------|:-----:|------------|
| 1 | Hook Events | 9 | None |
| 2 | Unified Scripts | 4 | Phase 1 |
| 3 | PDCA Commands | 8 | Phase 2 |
| 4 | Skills | 22 | Phase 3 |
| 5 | Agents | 11 | Phase 4 |
| 6 | E2E Scenarios | 3 | Phase 5 |

**Total: 57 Test Cases**

---

## 5. End-to-End Test Scenarios

### 5.1 E2E-01: Full PDCA Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario: Complete PDCA cycle for a test feature                │
├─────────────────────────────────────────────────────────────────┤
│ 1. /pdca plan test-feature                                      │
│    Expected: Plan 문서 생성, Task 생성                           │
│                                                                 │
│ 2. /pdca design test-feature                                    │
│    Expected: Design 문서 생성, Plan 참조                         │
│                                                                 │
│ 3. /pdca do test-feature                                        │
│    Expected: 구현 가이드, Do 단계 전환                           │
│                                                                 │
│ 4. (Implementation - 테스트 파일 생성)                           │
│    Expected: unified-write-post 실행, 상태 업데이트              │
│                                                                 │
│ 5. /pdca analyze test-feature                                   │
│    Expected: gap-detector Agent 호출, 분석 결과 생성             │
│                                                                 │
│ 6. /pdca iterate test-feature (if matchRate < 90%)              │
│    Expected: pdca-iterator Agent 호출, 자동 개선                 │
│                                                                 │
│ 7. /pdca report test-feature                                    │
│    Expected: report-generator Agent 호출, 완료 보고서            │
│                                                                 │
│ 8. Verify .pdca-status.json                                     │
│    Expected: phase: "completed", matchRate: >= 90%              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.2 E2E-02: Pipeline Phase Progression

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario: Progress through Development Pipeline phases          │
├─────────────────────────────────────────────────────────────────┤
│ 1. /pipeline-status                                             │
│    Expected: 현재 파이프라인 상태 표시                            │
│                                                                 │
│ 2. Invoke phase-1-schema skill                                  │
│    Expected: 스키마 정의 가이드 제공                             │
│                                                                 │
│ 3. /pipeline-next                                               │
│    Expected: Phase 2 안내                                       │
│                                                                 │
│ 4. Invoke phase-2-convention skill                              │
│    Expected: 컨벤션 정의 가이드 제공                             │
│                                                                 │
│ 5. Verify pipeline progression                                  │
│    Expected: .pdca-status.json pipeline.currentPhase 업데이트   │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 E2E-03: Hook Chain Verification

```
┌─────────────────────────────────────────────────────────────────┐
│ Scenario: Verify hook execution chain                           │
├─────────────────────────────────────────────────────────────────┤
│ 1. Start new session                                            │
│    Expected: SessionStart hook 실행                              │
│                                                                 │
│ 2. Submit user prompt with "검증" keyword                       │
│    Expected: UserPromptSubmit → gap-detector agent 제안          │
│                                                                 │
│ 3. Edit a file                                                  │
│    Expected: PreToolUse(Write|Edit) → PostToolUse(Write)        │
│                                                                 │
│ 4. Execute Bash command                                         │
│    Expected: PreToolUse(Bash) → PostToolUse(Bash)               │
│                                                                 │
│ 5. Run /pdca skill                                              │
│    Expected: PostToolUse(Skill) → skill-post.js                 │
│                                                                 │
│ 6. End session / task                                           │
│    Expected: Stop hook → unified-stop.js                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] 모든 Hook 이벤트 테스트 통과 (9/9)
- [ ] 모든 Unified Script 테스트 통과 (4/4)
- [ ] 모든 PDCA Command 테스트 통과 (8/8)
- [ ] Critical/High Priority Skills 테스트 통과 (14/22)
- [ ] Critical/High Priority Agents 테스트 통과 (7/11)
- [ ] 모든 E2E 시나리오 통과 (3/3)

### 6.2 Quality Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Critical Tests Pass Rate | 100% | (Passed Critical Tests / Total Critical Tests) |
| High Priority Tests Pass Rate | 95%+ | (Passed High Tests / Total High Tests) |
| Overall Tests Pass Rate | 90%+ | (Passed Tests / Total Tests) |
| No Regression | 0 | Previously working features still work |

### 6.3 Pass/Fail Criteria

| Result | Criteria |
|--------|----------|
| **PASS** | All Critical tests pass AND High priority pass rate >= 95% |
| **CONDITIONAL PASS** | All Critical tests pass AND High priority pass rate >= 80% |
| **FAIL** | Any Critical test fails OR High priority pass rate < 80% |

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Hook 실행 순서 불일치 | High | Medium | 로그 타임스탬프로 순서 검증 |
| 조건부 실행 로직 오류 | High | Medium | 각 조건별 개별 테스트 |
| Agent 호출 실패 | Medium | Low | 에러 핸들링 검증, fallback 확인 |
| .pdca-status.json 동시성 문제 | Medium | Low | 순차 테스트 실행 |
| 긴 테스트 시간 | Low | High | 병렬 테스트 가능한 항목 분류 |

---

## 8. Test Environment

### 8.1 Prerequisites

```yaml
Required:
  - Claude Code v2.1.20+
  - Node.js v18+
  - bkit-claude-code plugin installed
  - hooks.json configured

Test Data:
  - Test feature name: "test-comprehensive-001"
  - Test files in: tests/ directory

Environment Variables:
  - CLAUDE_PLUGIN_ROOT: auto-detected
  - DEBUG: true (for verbose logging)
```

### 8.2 Test Artifacts

| Artifact | Location | Purpose |
|----------|----------|---------|
| Test Plan | `docs/01-plan/features/bkit-comprehensive-test.plan.md` | 테스트 계획 |
| Test Results | `docs/03-analysis/bkit-comprehensive-test.analysis.md` | 테스트 결과 |
| Test Report | `docs/04-report/features/bkit-comprehensive-test.report.md` | 최종 보고서 |
| Test Logs | Console output | 실행 로그 |

---

## 9. Task Breakdown

### 9.1 Test Tasks

| Task ID | Subject | Priority | Dependency |
|:-------:|---------|:--------:|:----------:|
| T-01 | Hook Events 테스트 (9 cases) | Critical | - |
| T-02 | Unified Scripts 테스트 (4 cases) | Critical | T-01 |
| T-03 | PDCA Commands 테스트 (8 cases) | Critical | T-02 |
| T-04 | Core Skills 테스트 (pdca, bkit-rules, pipeline) | High | T-03 |
| T-05 | Level Skills 테스트 (starter, dynamic, enterprise) | High | T-04 |
| T-06 | Phase Skills 테스트 (phase-1 ~ phase-9) | Medium | T-05 |
| T-07 | Utility Skills 테스트 (code-review, etc.) | Medium | T-05 |
| T-08 | PDCA Agents 테스트 (gap-detector, iterator, report) | Critical | T-03 |
| T-09 | Analysis Agents 테스트 (code-analyzer, etc.) | High | T-08 |
| T-10 | Guide Agents 테스트 (starter-guide, etc.) | Medium | T-08 |
| T-11 | E2E-01: Full PDCA Cycle | Critical | T-08 |
| T-12 | E2E-02: Pipeline Phase Progression | High | T-06 |
| T-13 | E2E-03: Hook Chain Verification | High | T-02 |
| T-14 | 결과 분석 및 보고서 작성 | High | T-11, T-12, T-13 |

### 9.2 Estimated Effort

| Category | Tests | Est. Time |
|----------|:-----:|-----------|
| Hook Events | 9 | ~15 min |
| Unified Scripts | 4 | ~10 min |
| PDCA Commands | 8 | ~20 min |
| Skills | 22 | ~45 min |
| Agents | 11 | ~30 min |
| E2E Scenarios | 3 | ~30 min |
| **Total** | **57** | **~2.5 hours** |

---

## 10. Next Steps

1. [x] 테스트 계획서 작성 완료
2. [ ] Task Management System에 테스트 Task 생성
3. [ ] Phase 1: Hook Events 테스트 시작
4. [ ] 각 Phase 완료 후 결과 기록
5. [ ] 전체 테스트 완료 후 분석 문서 작성
6. [ ] 최종 보고서 생성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial comprehensive test plan | Claude |
