# bkit v1.5.1 Comprehensive Test Plan

> **Summary**: bkit v1.5.1의 전체 기능(21 Skills, 11 Agents, 8 Hook Events, 143 Library Functions, 3 Output Styles, Team Module)과 Claude Code v2.1.33 신기능 호환성을 종합 검증하는 상세 테스트 계획서
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: bkit Team
> **Date**: 2026-02-06
> **Status**: Draft
> **Claude Code Version**: v2.1.33 (from v2.1.31)
> **Previous Test Cycle**: bkit-v1.5.0-claude-code-v2.1.31-compatibility-test (101 TC, 99%+ pass)

---

## 1. Overview

### 1.1 Purpose

bkit v1.5.1에서 구현된 6가지 신기능(Agent Teams 통합, Output Styles, Memory Frontmatter, TaskCompleted/TeammateIdle Hook Events, Sub-agent 제한)과 기존 전체 기능이 Claude Code v2.1.33에서 정상 작동하는지 종합 검증합니다.

### 1.2 Background

**bkit v1.5.1 변경사항** (6 Phases):
- Phase 1: 버전 업데이트 (1.5.0 → 1.5.1, 5개 파일)
- Phase 2: Agent Teams PDCA 통합 (lib/team/ 모듈 4파일 + 5개 기존 파일 수정)
- Phase 3: bkit Output Styles 3종 개발
- Phase 4: Memory Frontmatter (11개 Agent에 memory scope 적용)
- Phase 5: New Hook Events (TaskCompleted, TeammateIdle)
- Phase 6: Sub-agent 제한 (4개 Agent에 Task(agent_type) 적용)

**Claude Code v2.1.32~v2.1.33 주요 변경사항**:
- Agent Teams Research Preview (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
- Memory Frontmatter (user/project/local scope)
- Sub-agent 제한 (Task(agent_type) syntax)
- TaskCompleted/TeammateIdle Hook Events
- Output Styles (custom system prompt)
- Claude Opus 4.6 모델 지원
- Skill Character Budget Scaling (2% context window)
- 자동 Skill 로딩 (.claude/skills/ auto-load)

### 1.3 Related Documents

- Plan: [bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.plan.md](./bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.plan.md)
- Design: [bkit-v1.5.1-...enhancement.design.md](../../02-design/features/bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.design.md)
- Report: [bkit-v1.5.1-...enhancement.report.md](../../04-report/features/bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.report.md)
- Previous Test: [bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.plan.md](./bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.plan.md)

---

## 2. Scope

### 2.1 In Scope

- [ ] **Skills 테스트**: 21개 전체 Skills + PDCA team 신규 subcommand
- [ ] **Agents 테스트**: 11개 Agents (memory frontmatter + sub-agent 제한 포함)
- [ ] **Hooks 테스트**: 8개 Hook Events (기존 6 + TaskCompleted + TeammateIdle)
- [ ] **Library 테스트**: 5개 모듈 143개 함수 (core 41 + pdca 50 + intent 19 + task 26 + team 6 + common.js bridge)
- [ ] **Output Styles 테스트**: 3개 스타일 (bkit-pdca-guide, bkit-learning, bkit-enterprise)
- [ ] **Team Module 테스트**: lib/team/ 전체 (coordinator, strategy, hooks)
- [ ] **Configuration 테스트**: bkit.config.json 신규 섹션 (team, outputStyles, hooks)
- [ ] **PDCA 워크플로우 테스트**: Plan→Design→Do→Check→Act 전체 사이클 + Team Mode
- [ ] **v2.1.33 신기능 연동**: Agent Teams, Memory, Output Styles, Hook Events
- [ ] **다국어 지원 테스트**: 8개 언어 트리거 매칭
- [ ] **Backward Compatibility**: v1.5.0 기존 기능 회귀 테스트

### 2.2 Out of Scope

- Claude Code 내부 구현 테스트 (Anthropic 책임)
- Agent Teams 분산 실행 환경 E2E (tmux 세션 생성/관리)
- Memory 파일 시스템 레벨 I/O 검증 (Claude Code 내부)
- 네트워크 환경별 테스트 (VPN, 프록시)
- 타사 MCP 서버 심층 테스트

---

## 3. Test Environment

### 3.1 Required Environment

| Component | Version | Status |
|-----------|---------|--------|
| Claude Code CLI | v2.1.33 | Required |
| bkit Plugin | v1.5.1 | Required |
| Node.js | v18+ | Required |
| Git | 2.x | Required |
| OS | macOS/Linux/Windows | Any |
| Agent Teams Env | CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 | For Team tests |

### 3.2 Pre-Test Checklist

```bash
# Claude Code 버전 확인
claude --version  # Expected: 2.1.33

# bkit 플러그인 버전 확인
cat ~/.claude/plugins/bkit-claude-code/bkit.config.json | grep version  # Expected: 1.5.1

# plugin.json 확인
cat ~/.claude/plugins/bkit-claude-code/.claude-plugin/plugin.json | grep version  # Expected: 1.5.1

# Agent Teams 환경 변수 설정 (Team tests)
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 테스트 프로젝트 준비
mkdir test-bkit-v151 && cd test-bkit-v151
git init && npm init -y
```

---

## 4. Test Categories

### 4.1 Test Category Overview

| Category | Name | Test Cases | Priority | Estimated Time |
|----------|------|-----------|----------|----------------|
| A | Skills (21 Skills) | 78 | Critical | 2.5h |
| B | Agents (11 Agents) | 55 | Critical | 2h |
| C | Hooks (8 Events) | 38 | High | 1.5h |
| D | Library Functions (5 Modules) | 42 | Medium | 1.5h |
| E | PDCA Workflow | 16 | Critical | 1h |
| F | v1.5.1 New Features | 48 | Critical | 2h |
| G | v2.1.33 Specific Features | 18 | High | 1h |
| H | Multi-language Support | 8 | Medium | 30m |
| I | Configuration & Metadata | 12 | High | 30m |
| J | Backward Compatibility | 20 | Critical | 1h |
| **Total** | | **335** | - | **12.5h** |

---

## 5. Category A: Skills Test Cases (21 Skills, 78 Cases)

### A.1 Project Level Skills (3 Skills, 9 Cases)

#### A.1.1 /starter Skill

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A1-01 | Skill 호출 | `/starter` | starter guide 표시, next-skill: phase-1-schema | Critical |
| A1-02 | 초기화 명령 | `init starter` | 프로젝트 초기화 안내 | High |
| A1-03 | 트리거 매칭 | "정적 웹사이트 만들고 싶어" | starter skill 자동 제안 | Medium |

#### A.1.2 /dynamic Skill

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A2-01 | Skill 호출 | `/dynamic` | dynamic guide 표시, bkend.ai 안내 | Critical |
| A2-02 | 초기화 명령 | `init dynamic` | BaaS 프로젝트 초기화 안내 | High |
| A2-03 | 트리거 매칭 | "로그인 기능 추가해줘" | dynamic skill 자동 제안 | Medium |

#### A.1.3 /enterprise Skill

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A3-01 | Skill 호출 | `/enterprise` | enterprise guide 표시, K8s/Terraform 안내 | Critical |
| A3-02 | 초기화 명령 | `init enterprise` | Monorepo 설정 안내 | High |
| A3-03 | 트리거 매칭 | "마이크로서비스 아키텍처 설계" | enterprise skill 자동 제안 | Medium |

---

### A.2 PDCA Skill (1 Skill, 14 Actions)

#### A.2.1 기존 PDCA Actions (8 Actions)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A4-01 | Plan action | `/pdca plan test-feature` | Plan 문서 생성 가이드, Task 생성 | Critical |
| A4-02 | Design action | `/pdca design test-feature` | Design 문서 생성, Plan 존재 확인 | Critical |
| A4-03 | Do action | `/pdca do test-feature` | 구현 가이드 표시, Design 존재 확인 | High |
| A4-04 | Analyze action | `/pdca analyze test-feature` | gap-detector Agent 호출 | Critical |
| A4-05 | Iterate action | `/pdca iterate test-feature` | pdca-iterator Agent 호출 | High |
| A4-06 | Report action | `/pdca report test-feature` | report-generator Agent 호출 | High |
| A4-07 | Status action | `/pdca status` | 현재 PDCA 상태 표시 (phase, matchRate, feature) | Medium |
| A4-08 | Next action | `/pdca next` | 다음 단계 안내 + AskUserQuestion | Medium |

#### A.2.2 Archive/Cleanup Actions (2 Actions)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A4-09 | Archive action | `/pdca archive test-feature` | 문서 아카이브, docs/archive/ 이동 | High |
| A4-10 | Archive --summary | `/pdca archive test-feature --summary` | 아카이브 + 요약 보존 (.pdca-status.json) | Medium |
| A4-11 | Cleanup action | `/pdca cleanup` | 아카이브 목록 표시 + 정리 | Medium |

#### A.2.3 [NEW] Team Subcommands (3 Actions)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A4-12 | Team 시작 | `/pdca team test-feature` | Agent Teams 확인, 전략 생성, AskUserQuestion | Critical |
| A4-13 | Team Status | `/pdca team status` | 팀 상태 표시 (available, enabled, display mode) | High |
| A4-14 | Team Cleanup | `/pdca team cleanup` | 팀 리소스 정리, 단일 세션 전환 | High |

---

### A.3 Pipeline Phase Skills (9 Skills, 18 Cases)

#### A.3.1 Phase Skills

| TC-ID | Skill | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| A5-01 | /phase-1-schema | `/phase-1-schema` | 스키마 설계 가이드, 템플릿 제공 | High |
| A5-02 | /phase-2-convention | `/phase-2-convention` | 컨벤션 정의 가이드 | High |
| A5-03 | /phase-3-mockup | `/phase-3-mockup` | 목업 생성 가이드 (HTML/CSS/JS) | High |
| A5-04 | /phase-4-api | `/phase-4-api` | API 설계 가이드, Zero Script QA 연동 | High |
| A5-05 | /phase-5-design-system | `/phase-5-design-system` | 디자인 시스템 가이드 | High |
| A5-06 | /phase-6-ui-integration | `/phase-6-ui-integration` | UI 통합 가이드, API 연동 | High |
| A5-07 | /phase-7-seo-security | `/phase-7-seo-security` | SEO/보안 가이드 (OWASP Top 10) | High |
| A5-08 | /phase-8-review | `/phase-8-review` | 코드 리뷰 가이드, Gap 분석 | High |
| A5-09 | /phase-9-deployment | `/phase-9-deployment` | 배포 가이드 (CI/CD, K8s) | High |

#### A.3.2 Phase Skill Transitions

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| A6-01 | Phase 1→2 전환 | Phase 1 완료 후 | Phase 2 자동 제안, next-skill 동작 | Medium |
| A6-02 | Phase 2→3 전환 | Phase 2 완료 후 | Phase 3 자동 제안 | Medium |
| A6-03 | Starter 레벨 스킵 | Phase 4 (API) 시도 | Dynamic 전용 안내, Starter 불가 | Medium |
| A6-04 | Phase Template 로딩 | 각 Phase 실행 | imports에 정의된 템플릿 정상 로드 | High |
| A6-05 | Phase Agent 연동 | Phase 4 (API) | qa-monitor Agent 정상 연결 | High |
| A6-06 | Phase Stop Hook | Phase 완료 | unified-stop.js → 해당 phase stop 핸들러 | High |
| A6-07 | Phase Skill context:fork | zero-script-qa | fork 컨텍스트 분리, mergeResult | Medium |
| A6-08 | Phase Stop 기록 | Phase 완료 후 | PDCA 상태 업데이트, 다음 Phase 안내 | Medium |
| A6-09 | Phase 1-9 순차 전환 | 전체 파이프라인 | 1→2→...→9 순서대로 전환 | High |

---

### A.4 Utility Skills (6 Skills, 12 Cases)

| TC-ID | Skill | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| A7-01 | /code-review | `/code-review` | 코드 품질 분석 시작, code-analyzer 호출 | High |
| A7-02 | /code-review LSP | 코드 리뷰 중 LSP | LSP 도구 접근 정상 | Medium |
| A7-03 | /zero-script-qa | `/zero-script-qa` | QA 가이드 표시, Docker 로그 모니터링 안내 | Medium |
| A7-04 | /claude-code-learning | `/claude-code-learning` | Claude Code 학습 시작, 설정 안내 | Medium |
| A7-05 | /claude-code-learning learn | `learn` 키워드 | 학습 모드 진입 | Medium |
| A7-06 | /mobile-app | `/mobile-app` | React Native/Flutter/Expo 가이드 | Medium |
| A7-07 | /desktop-app | `/desktop-app` | Electron/Tauri 가이드 | Medium |
| A7-08 | /development-pipeline | `/development-pipeline` | 9단계 파이프라인 전체 안내 | High |
| A7-09 | /development-pipeline start | 시작 명령 | Phase 1부터 순차 가이드 | High |
| A7-10 | /development-pipeline next | 다음 명령 | 현재 Phase 다음으로 이동 | High |
| A7-11 | /development-pipeline status | 상태 확인 | 전체 파이프라인 진행률 | Medium |
| A7-12 | /bkit | `/bkit` 또는 `bkit help` | bkit 기능 목록 표시 | Medium |

### A.5 System Skills (2 Skills, 4 Cases)

| TC-ID | Skill | Input | Expected Output | Priority |
|-------|-------|-------|-----------------|----------|
| A8-01 | bkit-rules | 자동 적용 | PDCA 규칙 컨텍스트 포함, 코드 품질 기준 | Critical |
| A8-02 | bkit-rules imports | naming-conventions 로딩 | 네이밍 컨벤션 템플릿 로드 | High |
| A8-03 | bkit-templates | 템플릿 요청 | 6종 PDCA 템플릿 목록 및 사용법 | Medium |
| A8-04 | bkit-templates 자동 적용 | Agent에서 참조 | design-validator, gap-detector에서 정상 참조 | High |

---

## 6. Category B: Agents Test Cases (11 Agents, 55 Cases)

### B.1 Level-Based Agents (3 Agents, 15 Cases)

#### B.1.1 starter-guide Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B1-01 | 자동 트리거 | "초보자인데 웹사이트 만들고 싶어요" | starter-guide 자동 호출 | High |
| B1-02 | 수동 호출 | Task tool로 직접 호출 | 친화적 가이드 제공 | Medium |
| B1-03 | 다국어 트리거 | "beginner" / "初心者" / "principiante" | 언어별 트리거 작동 | Medium |
| B1-04 | [NEW] memory: user | 세션 간 재호출 | 이전 세션 사용자 선호도 기억 | High |
| B1-05 | permissionMode | acceptEdits 확인 | Write/Edit 허용, 위험 Bash 차단 | Medium |

#### B.1.2 bkend-expert Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B2-01 | Dynamic 레벨 감지 | .mcp.json 존재 프로젝트 | bkend-expert 자동 제안 | High |
| B2-02 | 인증 구현 요청 | "로그인 기능 구현해줘" | bkend.ai 인증 가이드 | High |
| B2-03 | MCP 도구 접근 | mcp__bkend__* 호출 | MCP 도구 정상 접근 | Critical |
| B2-04 | [NEW] memory: project | 세션 간 재호출 | 프로젝트별 BaaS 패턴 기억 | High |
| B2-05 | WebFetch 도구 | bkend.ai docs 참조 | WebFetch 정상 작동 | Medium |

#### B.1.3 enterprise-expert Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B3-01 | Enterprise 레벨 감지 | kubernetes/ 디렉토리 존재 | enterprise-expert 자동 제안 | High |
| B3-02 | 아키텍처 설계 | "마이크로서비스 아키텍처 설계" | 전략적 아키텍처 가이드 | High |
| B3-03 | [NEW] Task(infra-architect) | sub-agent 호출 | infra-architect만 spawn 가능 | Critical |
| B3-04 | [NEW] Task(Explore) | sub-agent 호출 | Explore만 spawn 가능 | Critical |
| B3-05 | [NEW] memory: project | 세션 간 재호출 | 프로젝트 아키텍처 결정 기억 | High |

---

### B.2 PDCA Agents (4 Agents, 24 Cases)

#### B.2.1 gap-detector Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B4-01 | Gap 분석 실행 | `/pdca analyze feature` | 설계-구현 Gap 분석 결과 | Critical |
| B4-02 | Match Rate 계산 | 설계문서 + 구현코드 | Match Rate % 반환 | Critical |
| B4-03 | 90% 이상 결과 | Match Rate >= 90% | Report 단계 제안 | High |
| B4-04 | 90% 미만 결과 | Match Rate < 90% | Act 단계 제안 (iterate) | High |
| B4-05 | [NEW] Task(Explore) 제한 | sub-agent 호출 시도 | Explore만 허용, 다른 agent 차단 | Critical |
| B4-06 | [NEW] memory: project | 다회 분석 | 이전 Gap 패턴 학습, 정확도 향상 | High |
| B4-07 | context: fork | 분석 실행 | 메인 컨텍스트와 분리, mergeResult: false | Medium |
| B4-08 | imports 검증 | api-patterns.md | 템플릿 정상 로드 | Medium |

#### B.2.2 pdca-iterator Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B5-01 | 자동 개선 실행 | `/pdca iterate feature` | 코드 자동 개선 | High |
| B5-02 | 반복 제한 | 5회 반복 후 | 최대 반복 횟수 도달 알림 | Medium |
| B5-03 | 재분석 트리거 | 개선 완료 후 | gap-detector 재호출 제안 | High |
| B5-04 | [NEW] Task(Explore) 제한 | Explore 호출 | 정상 작동 | Critical |
| B5-05 | [NEW] Task(gap-detector) 제한 | gap-detector 호출 | 정상 작동 | Critical |
| B5-06 | [NEW] 다른 Agent 차단 | enterprise-expert 호출 시도 | 차단됨 | Critical |
| B5-07 | [NEW] memory: project | 다회 반복 | 이전 수정 패턴 학습 | High |

#### B.2.3 report-generator Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B6-01 | 보고서 생성 | `/pdca report feature` | 완료 보고서 생성 (report.template.md 기반) | High |
| B6-02 | 메트릭 포함 | Plan+Design+Check 데이터 | 모든 PDCA 메트릭 통합 | High |
| B6-03 | [NEW] memory: project | 다회 보고서 | 이전 보고서 패턴 학습 | Medium |
| B6-04 | Bash 차단 | Bash 도구 시도 | 명시적 Bash disallowed | Medium |

#### B.2.4 pipeline-guide Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B7-01 | 파이프라인 안내 | "어디서 시작해야 해?" | 현재 위치 + 다음 단계 | High |
| B7-02 | 레벨별 가이드 | Starter/Dynamic/Enterprise | 레벨별 필수/선택 단계 | Medium |
| B7-03 | [NEW] memory: user | 세션 간 | 사용자 진행 상황 기억 | High |

---

### B.3 Quality Agents (4 Agents, 16 Cases)

#### B.3.1 code-analyzer Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B8-01 | 코드 품질 분석 | 코드 파일 제공 | 품질/보안/성능 이슈 목록 | High |
| B8-02 | LSP 도구 사용 | LSP 기반 분석 | 타입 오류 감지 | Medium |
| B8-03 | 트리거 매칭 | "코드 리뷰 해줘" | code-analyzer 자동 제안 | Medium |
| B8-04 | [NEW] memory: project | 다회 분석 | 프로젝트 코드 패턴 학습 | High |
| B8-05 | Task 도구 (제한 없음) | 다양한 sub-agent | Task 제한 없이 자유 호출 (설계 의도) | Medium |

#### B.3.2 design-validator Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B9-01 | 설계 문서 검증 | 설계 문서 경로 | 완성도/일관성 분석 결과 | High |
| B9-02 | API 패턴 검증 | API 스펙 문서 | api-patterns.md 기준 검증 | Medium |
| B9-03 | Write/Edit 차단 | Write/Edit 시도 | 명시적 disallowed (read-only) | High |
| B9-04 | [NEW] memory: project | 다회 검증 | 설계 패턴 학습 | Medium |

#### B.3.3 qa-monitor Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B10-01 | Docker 로그 모니터링 | `docker logs` 출력 | 에러 감지 및 문서화 | High |
| B10-02 | Bash 명령 실행 | QA 관련 bash 명령 | 정상 실행 | High |
| B10-03 | [NEW] Task(Explore) 제한 | sub-agent 호출 | Explore만 허용 | Critical |
| B10-04 | [NEW] memory: project | 다회 QA | QA 패턴 학습 | Medium |

#### B.3.4 infra-architect Agent

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| B11-01 | 인프라 설계 | K8s/Terraform 요청 | 인프라 아키텍처 가이드 | High |
| B11-02 | CI/CD 파이프라인 | 배포 파이프라인 요청 | CI/CD 설정 가이드 | Medium |
| B11-03 | [NEW] memory: project | 다회 설계 | 인프라 결정 기억 | High |

---

## 7. Category C: Hooks Test Cases (8 Events, 38 Cases)

### C.1 SessionStart Hook (6 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C1-01 | 세션 시작 초기화 | 새 세션 시작 | PDCA 상태 초기화, 온보딩 표시, v1.5.1 버전 | Critical |
| C1-02 | 기존 작업 감지 | PDCA 진행 중 세션 | "Previous Work Detected" + AskUserQuestion | Critical |
| C1-03 | AskUserQuestion | 세션 시작 시 | 옵션 질문 표시 (Continue/New/Status) | High |
| C1-04 | 자동 트리거 테이블 | 세션 시작 시 | 8개 언어 트리거 테이블 표시 | Medium |
| C1-05 | Feature Usage Report | 세션 시작 시 | v1.5.1 리포팅 규칙 포함 | High |
| C1-06 | [NEW] Agent Teams 감지 | AGENT_TEAMS=1 설정 | "Agent Teams Detected" 섹션 표시 | Critical |

### C.2 PreToolUse Hook (6 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C2-01 | Write 권한 검사 | 소스 파일 Write | PDCA 가이드 표시 | High |
| C2-02 | Edit 권한 검사 | 소스 파일 Edit | 컨벤션 힌트 표시 | High |
| C2-03 | Bash 안전 검사 (위험) | `rm -rf /` | 차단 메시지 | Critical |
| C2-04 | Bash 안전 검사 (안전) | `ls -la` | 허용 | High |
| C2-05 | Phase 9 Bash 제한 | `kubectl delete` | 차단 메시지 | High |
| C2-06 | QA Bash 검사 | QA 관련 명령 | qa-pre-bash.js 필터 | Medium |

### C.3 PostToolUse Hook (6 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C3-01 | Write 후 PDCA 가이드 | 소스 파일 Write 완료 | Gap 분석 제안, Phase 추적 | High |
| C3-02 | Write 후 컴포넌트 추적 | components/ 파일 Write | Phase 5 추적 기록 | Medium |
| C3-03 | Bash 후 QA 추적 | docker/curl 명령 | QA 로그 기록 | Medium |
| C3-04 | Skill 후 다음 단계 | Skill 완료 | 다음 Skill/Agent 제안, context 저장 | High |
| C3-05 | Bash 후 Phase 전환 | 배포 관련 bash | Phase 9 추적 | Medium |
| C3-06 | Write 후 PDCA 문서 | docs/ 파일 Write | PDCA 문서 추적 | Medium |

### C.4 Stop Hook (6 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C4-01 | PDCA Skill Stop | /pdca plan 완료 | Phase 전환 기록 | Critical |
| C4-02 | Gap Detector Stop | gap-detector 완료 | Check→Act 또는 Check→Report | Critical |
| C4-03 | Iterator Stop | pdca-iterator 완료 | 재분석 제안 | High |
| C4-04 | Code Review Stop | code-review 완료 | 다음 Phase 제안 | Medium |
| C4-05 | [NEW] Team Coordinator Stop | team-coordinator 종료 | team-stop.js 실행, PDCA history 기록 | Critical |
| C4-06 | Active Context 정리 | 모든 Stop 후 | clearActiveContext() 호출 | High |

### C.5 UserPromptSubmit Hook (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C5-01 | 신규 기능 감지 | "새 기능 추가" | /pdca plan 제안 | High |
| C5-02 | Agent 트리거 | "검증해줘" | gap-detector 제안 | High |
| C5-03 | Skill 트리거 | "static site" | starter 제안 | Medium |
| C5-04 | 모호성 감지 | 모호한 요청 | 명확화 질문 생성 (ambiguityScore >= 50) | Medium |

### C.6 PreCompact Hook (2 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C6-01 | 컨텍스트 압축 | 자동 압축 트리거 | PDCA 스냅샷 저장, 필수 정보 보존 | High |
| C6-02 | 스냅샷 정리 | 10개 초과 스냅샷 | 오래된 것 자동 삭제 | Medium |

### C.7 [NEW] TaskCompleted Hook (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C7-01 | [Plan] Task 완료 | Task "[Plan] login-feature" 완료 | phase=plan 감지, Design 자동 제안 | Critical |
| C7-02 | [Check] Task 완료 (>=90%) | Task "[Check] login-feature" 완료 | matchRate>=90 감지, Report 제안 | Critical |
| C7-03 | [Check] Task 완료 (<90%) | Task "[Check] login-feature" 완료 | matchRate<90 감지, Iterate 제안 | Critical |
| C7-04 | Auto-advance 비활성 | autoAdvance: false | 제안만 표시, 자동 실행 안 함 | High |

### C.8 [NEW] TeammateIdle Hook (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| C8-01 | Team Mode 활성 시 | teammate 대기 | "Check TaskList" 가이드 | Critical |
| C8-02 | Team Mode 비활성 시 | teammate 대기 | 기본 Allow 응답 (graceful degradation) | High |
| C8-03 | PDCA Feature 있을 때 | 진행 중 feature | feature 관련 다음 작업 제안 | High |
| C8-04 | PDCA Feature 없을 때 | feature 없음 | 일반 대기 메시지 | Medium |

---

## 8. Category D: Library Functions Test Cases (5 Modules, 42 Cases)

### D.1 Core Module (lib/core/, 8 Cases)

| TC-ID | Module | Test Case | Expected Output | Priority |
|-------|--------|-----------|-----------------|----------|
| D1-01 | platform.js | detectPlatform() | 'claude' 반환 | High |
| D1-02 | platform.js | PLUGIN_ROOT/PROJECT_DIR | 올바른 경로 반환 | High |
| D1-03 | cache.js | get/set/invalidate/clear | TTL 기반 캐싱 정상 | Medium |
| D1-04 | config.js | loadConfig/getConfig | bkit.config.json 정상 로드 | High |
| D1-05 | config.js | getConfigArray() | 배열 설정값 반환 | Medium |
| D1-06 | debug.js | debugLog() | BKIT_DEBUG=true 시 로그 파일 기록 | Medium |
| D1-07 | io.js | parseHookInput() | toolName, filePath 추출 | High |
| D1-08 | file.js | isSourceFile/isCodeFile/isUiFile | Tier별 파일 분류 정확 | High |

### D.2 PDCA Module (lib/pdca/, 12 Cases)

| TC-ID | Module | Test Case | Expected Output | Priority |
|-------|--------|-----------|-----------------|----------|
| D2-01 | status.js | getPdcaStatusFull() | 전체 상태 JSON 반환 (v2 format) | Critical |
| D2-02 | status.js | updatePdcaStatus() | 상태 업데이트 성공 | Critical |
| D2-03 | status.js | addActiveFeature/removeActiveFeature | Feature 관리 | High |
| D2-04 | status.js | switchFeatureContext() | 활성 Feature 전환 | High |
| D2-05 | phase.js | getNextPdcaPhase() | 다음 단계 반환 (plan→design→do→check→act→report) | High |
| D2-06 | phase.js | findDesignDoc/findPlanDoc | 문서 경로 찾기 | High |
| D2-07 | phase.js | validatePdcaTransition() | 유효한 전환인지 검증 | Medium |
| D2-08 | level.js | detectLevel() | Starter/Dynamic/Enterprise 정확 감지 | High |
| D2-09 | tier.js | getLanguageTier() | Tier 1-4 반환 | Medium |
| D2-10 | automation.js | shouldAutoAdvance() | 자동 진행 여부 | High |
| D2-11 | [NEW] automation.js | detectPdcaFromTaskSubject() | "[Plan] feature" → {phase: 'plan', feature} | Critical |
| D2-12 | [NEW] automation.js | getNextPdcaActionAfterCompletion() | phase별 다음 액션 + autoExecute | Critical |

### D.3 Intent Module (lib/intent/, 6 Cases)

| TC-ID | Module | Test Case | Expected Output | Priority |
|-------|--------|-----------|-----------------|----------|
| D3-01 | language.js | detectLanguage() | 8개 언어 정확 감지 | High |
| D3-02 | language.js | matchMultiLangPattern() | 다국어 패턴 매칭 | High |
| D3-03 | trigger.js | matchImplicitAgentTrigger() | Agent + confidence score | High |
| D3-04 | trigger.js | matchImplicitSkillTrigger() | Skill + level 매칭 | High |
| D3-05 | ambiguity.js | calculateAmbiguityScore() | 0-100 점수 반환 | Medium |
| D3-06 | ambiguity.js | generateClarifyingQuestions() | 질문 배열 생성 | Medium |

### D.4 Task Module (lib/task/, 10 Cases)

| TC-ID | Module | Test Case | Expected Output | Priority |
|-------|--------|-----------|-----------------|----------|
| D4-01 | classification.js | classifyTask() | trivial/minor/feature/major | High |
| D4-02 | classification.js | getPdcaLevel() | none/light/standard/full | High |
| D4-03 | classification.js | getPdcaGuidanceByLevel() | 레벨별 가이드 텍스트 | Medium |
| D4-04 | context.js | setActiveSkill/getActiveSkill | Skill 컨텍스트 저장/조회 | High |
| D4-05 | context.js | setActiveAgent/getActiveAgent | Agent 컨텍스트 저장/조회 | High |
| D4-06 | context.js | clearActiveContext | 컨텍스트 초기화 | Medium |
| D4-07 | creator.js | createPdcaTaskChain() | Task 체인 객체 (Plan→Design→...→Report) | Critical |
| D4-08 | creator.js | autoCreatePdcaTask() | Task 자동 생성 객체 | High |
| D4-09 | tracker.js | savePdcaTaskId/getPdcaTaskId | Task ID 저장/조회 | High |
| D4-10 | tracker.js | triggerNextPdcaAction() | 다음 PDCA 액션 트리거 | High |

### D.5 [NEW] Team Module (lib/team/, 6 Cases)

| TC-ID | Module | Test Case | Expected Output | Priority |
|-------|--------|-----------|-----------------|----------|
| D5-01 | coordinator.js | isTeamModeAvailable() | env var 확인, true/false | Critical |
| D5-02 | coordinator.js | getTeamConfig() | {enabled, displayMode, maxTeammates, delegateMode} | High |
| D5-03 | coordinator.js | generateTeamStrategy() | 레벨별 전략 반환 (Starter=null, Dynamic/Enterprise) | High |
| D5-04 | coordinator.js | formatTeamStatus() | 포맷된 상태 문자열 (Markdown) | Medium |
| D5-05 | strategy.js | TEAM_STRATEGIES | Starter: null, Dynamic: 2 teammates, Enterprise: 4 teammates | Critical |
| D5-06 | strategy.js | getTeammateRoles() | 레벨별 역할 배열 반환 | High |

---

## 9. Category E: PDCA Workflow Test Cases (16 Cases)

### E.1 Full PDCA Cycle

| TC-ID | Test Case | Input Sequence | Expected Output | Priority |
|-------|-----------|----------------|-----------------|----------|
| E1-01 | Plan 시작 | `/pdca plan test-feature` | Plan 문서 생성, Task 생성 | Critical |
| E1-02 | Plan→Design 전환 | Plan 완료 | Design 단계 자동 제안 | Critical |
| E1-03 | Design 시작 | `/pdca design test-feature` | Design 문서 생성, Plan 참조 | Critical |
| E1-04 | Design→Do 전환 | Design 완료 | 구현 시작 안내 | High |
| E1-05 | Do 단계 | 코드 구현 | Write/Edit Hook 가이드 | High |
| E1-06 | Do→Check 전환 | 구현 완료 | Analyze 제안 | High |
| E1-07 | Check (분석) | `/pdca analyze test-feature` | gap-detector 실행, Match Rate 산출 | Critical |
| E1-08 | Check>=90%→Report | Match Rate >= 90% | Report 제안 | High |
| E1-09 | Check<90%→Act | Match Rate < 90% | Iterate 제안 | High |
| E1-10 | Act (개선) | `/pdca iterate test-feature` | 코드 자동 개선, 최대 5회 | High |
| E1-11 | Act→Check 재분석 | 개선 완료 | 재분석 트리거 | High |
| E1-12 | Report 생성 | `/pdca report test-feature` | 완료 보고서 생성 | High |
| E1-13 | Archive | `/pdca archive test-feature` | 문서 아카이브, 상태 정리 | High |
| E1-14 | .bkit-memory.json | 전체 사이클 | phase 업데이트 추적 (plan→design→do→check→act→completed) | Critical |

### E.2 PDCA Task System Integration

| TC-ID | Test Case | Input Sequence | Expected Output | Priority |
|-------|-----------|----------------|-----------------|----------|
| E2-01 | Task Chain 생성 | Plan 시작 시 | [Plan]→[Design]→[Do]→[Check] Task 체인 | Critical |
| E2-02 | Task Dependencies | 각 Phase Task | blockedBy 의존성 정확 | High |

---

## 10. Category F: v1.5.1 New Features Test Cases (48 Cases)

### F.1 Agent Teams Integration (12 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| F1-01 | isTeamModeAvailable (활성) | AGENT_TEAMS=1 | true 반환 | Critical |
| F1-02 | isTeamModeAvailable (비활성) | env var 없음 | false 반환 | Critical |
| F1-03 | /pdca team (활성) | `/pdca team feat` + AGENT_TEAMS=1 | 전략 생성, AskUserQuestion 확인 | Critical |
| F1-04 | /pdca team (비활성) | `/pdca team feat` + env var 없음 | "Agent Teams 비활성" 안내 | High |
| F1-05 | Starter 레벨 team | `/pdca team feat` + Starter | "Dynamic/Enterprise 전용" 안내 | High |
| F1-06 | Dynamic 전략 | generateTeamStrategy('Dynamic') | 2 teammates (developer, qa) | Critical |
| F1-07 | Enterprise 전략 | generateTeamStrategy('Enterprise') | 4 teammates (architect, developer, qa, reviewer) | Critical |
| F1-08 | Team Status 포맷 | formatTeamStatus() | Markdown 포맷 출력 (available, enabled, display) | High |
| F1-09 | assignNextTeammateWork | completedPhase='do' | nextPhase='check', parallel mode | High |
| F1-10 | handleTeammateIdle | teammateId + pdcaStatus | feature/phase/suggestion 반환 | High |
| F1-11 | Team Stop cleanup | team-coordinator Stop | history 기록, "Returning to single-session" | High |
| F1-12 | session-start Teams 감지 | AGENT_TEAMS=1 | additionalContext에 "Agent Teams Detected" | Critical |

### F.2 Output Styles (9 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| F2-01 | bkit-pdca-guide 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | Critical |
| F2-02 | bkit-pdca-guide 동작 | Dynamic 프로젝트 | PDCA 배지, Gap 분석 제안, 체크리스트 | High |
| F2-03 | bkit-learning 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | Critical |
| F2-04 | bkit-learning 동작 | Starter 프로젝트 | Learning Point, TODO(learner) 마커 | High |
| F2-05 | bkit-enterprise 로딩 | Output Style 선택 | 정상 로드, frontmatter 파싱 | Critical |
| F2-06 | bkit-enterprise 동작 | Enterprise 프로젝트 | 아키텍처 tradeoff, 비용 분석 | High |
| F2-07 | keep-coding-instructions | 모든 스타일 | true (보안 코딩 지시 유지) | High |
| F2-08 | config levelDefaults | detectLevel() 결과 | Starter→learning, Dynamic→pdca-guide, Enterprise→enterprise | High |
| F2-09 | config available 목록 | bkit.config.json 확인 | 3개 스타일 목록 일치 | Medium |

### F.3 Memory Frontmatter (11 Cases)

| TC-ID | Test Case | Agent | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| F3-01 | project scope 확인 | gap-detector | memory: project frontmatter 존재 | High |
| F3-02 | project scope 확인 | pdca-iterator | memory: project frontmatter 존재 | High |
| F3-03 | project scope 확인 | code-analyzer | memory: project frontmatter 존재 | High |
| F3-04 | project scope 확인 | report-generator | memory: project frontmatter 존재 | High |
| F3-05 | user scope 확인 | starter-guide | memory: user frontmatter 존재 | High |
| F3-06 | project scope 확인 | bkend-expert | memory: project frontmatter 존재 | High |
| F3-07 | project scope 확인 | enterprise-expert | memory: project frontmatter 존재 | High |
| F3-08 | project scope 확인 | design-validator | memory: project frontmatter 존재 | High |
| F3-09 | project scope 확인 | qa-monitor | memory: project frontmatter 존재 | High |
| F3-10 | user scope 확인 | pipeline-guide | memory: user frontmatter 존재 | High |
| F3-11 | project scope 확인 | infra-architect | memory: project frontmatter 존재 | High |

### F.4 Sub-agent Restriction (8 Cases)

| TC-ID | Test Case | Agent | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| F4-01 | gap-detector 제한 | Task(Explore) 호출 | 허용 | Critical |
| F4-02 | gap-detector 차단 | Task(pdca-iterator) 호출 | 차단됨 | Critical |
| F4-03 | pdca-iterator 허용 | Task(Explore) 호출 | 허용 | Critical |
| F4-04 | pdca-iterator 허용 | Task(gap-detector) 호출 | 허용 | Critical |
| F4-05 | pdca-iterator 차단 | Task(enterprise-expert) 호출 | 차단됨 | Critical |
| F4-06 | enterprise-expert 허용 | Task(infra-architect) 호출 | 허용 | Critical |
| F4-07 | enterprise-expert 차단 | Task(bkend-expert) 호출 | 차단됨 | Critical |
| F4-08 | qa-monitor 제한 | Task(Explore) 호출 | 허용, 다른 agent 차단 | Critical |

### F.5 New Hook Scripts (8 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| F5-01 | pdca-task-completed 패턴 | "[Plan] my-feature" | phase='plan', feature='my-feature' | Critical |
| F5-02 | pdca-task-completed 패턴 | "[Act-3] my-feature" | phase='act', feature='my-feature' (Act-N 지원) | High |
| F5-03 | pdca-task-completed 패턴 | "[Report] my-feature" | phase='report', feature='my-feature' | High |
| F5-04 | pdca-task-completed 비매칭 | "일반 task 제목" | null 반환 (PDCA 아닌 Task) | High |
| F5-05 | pdca-task-completed autoAdvance | shouldAutoAdvance=true | 자동 Phase 전환 | High |
| F5-06 | team-idle-handler Teams 활성 | AGENT_TEAMS=1 | PDCA 가이드 출력 | High |
| F5-07 | team-idle-handler Teams 비활성 | env var 없음 | 기본 Allow 응답 | High |
| F5-08 | team-stop cleanup | 팀 종료 | PDCA history에 team_session_ended 기록 | High |

---

## 11. Category G: v2.1.33 Specific Features (18 Cases)

### G.1 Agent Teams Platform (6 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| G1-01 | AGENT_TEAMS env var | 환경변수 설정 | Team Mode 활성화 | Critical |
| G1-02 | Team Mode 진입 | 다수 teammate 설정 | teammate 생성 확인 | High |
| G1-03 | Task List 공유 | Team Lead + Teammates | Task List 공유 정상 | High |
| G1-04 | Mailbox 통신 | 팀원 간 메시지 | 메시지 전달 확인 | Medium |
| G1-05 | Display Mode | in-process / split-pane | 표시 모드 전환 | Medium |
| G1-06 | Delegate Mode | delegateMode: true | AI 리드 자동 작업 분배 | Medium |

### G.2 Memory System Platform (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| G2-01 | project scope 저장 | Agent 세션 종료 | .claude/agent-memory/ 파일 생성 | High |
| G2-02 | project scope 로드 | Agent 세션 시작 | 이전 memory 로드 | High |
| G2-03 | user scope 저장 | starter-guide 세션 종료 | ~/.claude/agent-memory/ 파일 생성 | High |
| G2-04 | user scope 로드 | starter-guide 재시작 | 이전 user memory 로드 | High |

### G.3 Output Styles Platform (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| G3-01 | Output Style 활성화 | /output-style 명령 | 스타일 목록 표시 | High |
| G3-02 | 커스텀 스타일 로드 | output-styles/ 디렉토리 | bkit 스타일 3종 인식 | Critical |
| G3-03 | keep-coding-instructions | 스타일 적용 | 기존 코딩 지시 보존 | High |
| G3-04 | Skill Budget Scaling | 스타일 + Skill 동시 | context window 2% 내에서 정상 | Medium |

### G.4 Claude Opus 4.6 Compatibility (4 Cases)

| TC-ID | Test Case | Input | Expected Output | Priority |
|-------|-----------|-------|-----------------|----------|
| G4-01 | Opus 4.6 Agent 호출 | model: opus Agent | Opus 4.6 모델 사용 | High |
| G4-02 | Sonnet Agent 호출 | model: sonnet Agent | Sonnet 4.5 모델 사용 | High |
| G4-03 | Haiku Agent 호출 | model: haiku Agent | Haiku 4.5 모델 사용 | High |
| G4-04 | Agent 모델 할당 | gap-detector (opus), qa-monitor (haiku) | 정확한 모델 매핑 | High |

---

## 12. Category H: Multi-language Test Cases (8 Cases)

### H.1 Language Detection & Triggers

| TC-ID | Language | Trigger Input | Expected Agent/Skill | Priority |
|-------|----------|---------------|----------------------|----------|
| H1-01 | English | "verify implementation" | gap-detector | High |
| H1-02 | Korean | "검증해줘" | gap-detector | High |
| H1-03 | Japanese | "確認して" | gap-detector | Medium |
| H1-04 | Chinese | "验证一下" | gap-detector | Medium |
| H1-05 | Spanish | "verificar" | gap-detector | Medium |
| H1-06 | French | "vérifier" | gap-detector | Medium |
| H1-07 | German | "prüfen" | gap-detector | Medium |
| H1-08 | Italian | "verificare" | gap-detector | Medium |

---

## 13. Category I: Configuration & Metadata Test Cases (12 Cases)

### I.1 bkit.config.json Validation

| TC-ID | Test Case | Config Section | Expected Output | Priority |
|-------|-----------|----------------|-----------------|----------|
| I1-01 | 버전 확인 | version | "1.5.1" | Critical |
| I1-02 | PDCA 설정 | pdca | matchRateThreshold: 90, maxIterations: 5 | High |
| I1-03 | Level Detection | levelDetection | enterprise/dynamic/default 규칙 정확 | High |
| I1-04 | Agent 매핑 | agents.levelBased | Starter→starter-guide, Dynamic→bkend-expert, Enterprise→enterprise-expert | High |
| I1-05 | 권한 설정 | permissions | Write/Edit/Read/Bash 허용, rm -rf 차단 | Critical |
| I1-06 | 자동화 설정 | automation | 8개 언어 지원 목록 | Medium |
| I1-07 | [NEW] Team 설정 | team | enabled: false, displayMode, maxTeammates: 4 | Critical |
| I1-08 | [NEW] Team levelOverrides | team.levelOverrides | Dynamic: 2, Enterprise: 4 | High |
| I1-09 | [NEW] OutputStyles 설정 | outputStyles | directory, available 3종, levelDefaults | Critical |
| I1-10 | [NEW] Hooks 설정 | hooks.taskCompleted | enabled: true, autoAdvance: true | Critical |
| I1-11 | [NEW] Hooks 설정 | hooks.teammateIdle | enabled: true | High |
| I1-12 | plugin.json 메타데이터 | plugin.json | version 1.5.1, name bkit | High |

---

## 14. Category J: Backward Compatibility Test Cases (20 Cases)

### J.1 v1.5.0 기능 회귀 테스트

| TC-ID | Test Case | Feature | Expected Output | Priority |
|-------|-----------|---------|-----------------|----------|
| J1-01 | 기존 Skills 정상 | 21개 전체 | 기존 동작 변화 없음 | Critical |
| J1-02 | 기존 Agents 정상 | 11개 전체 | 기존 동작 변화 없음 | Critical |
| J1-03 | 기존 Hooks 정상 | 6개 기존 이벤트 | 기존 동작 변화 없음 | Critical |
| J1-04 | lib/common.js bridge | 기존 132 exports | 모든 기존 함수 접근 가능 | Critical |
| J1-05 | lib/core/ 모듈 | 기존 37 exports | 정상 동작 | High |
| J1-06 | lib/pdca/ 모듈 | 기존 48 exports | 정상 동작 (+ 2 new) | High |
| J1-07 | lib/intent/ 모듈 | 기존 19 exports | 정상 동작 | High |
| J1-08 | lib/task/ 모듈 | 기존 26 exports | 정상 동작 | High |
| J1-09 | PDCA 사이클 정상 | Plan→Design→Do→Check→Act | 기존 워크플로우 변화 없음 | Critical |
| J1-10 | 다국어 트리거 | 8개 언어 | 기존 매칭 정확도 유지 | High |

### J.2 Team Mode 비활성 시 호환성

| TC-ID | Test Case | Condition | Expected Output | Priority |
|-------|-----------|-----------|-----------------|----------|
| J2-01 | Team 없이 PDCA | AGENT_TEAMS 미설정 | 기존 PDCA 완벽 동작 | Critical |
| J2-02 | Team 없이 Stop | team-coordinator 아닌 Stop | 기존 Stop 핸들러 동작 | High |
| J2-03 | Team 없이 SessionStart | AGENT_TEAMS 미설정 | Teams 섹션 없이 정상 시작 | Critical |
| J2-04 | lib/team require 실패 | team 모듈 미설치 | graceful degradation, 에러 없음 | High |
| J2-05 | Team config 기본값 | team.enabled: false | 모든 team 함수 안전 반환 | High |

### J.3 Output Styles 비활성 시 호환성

| TC-ID | Test Case | Condition | Expected Output | Priority |
|-------|-----------|-----------|-----------------|----------|
| J3-01 | Output Styles 미설정 | 스타일 선택 안 함 | 기본 Claude Code 출력 | Critical |
| J3-02 | output-styles/ 부재 | 디렉토리 없음 | 에러 없이 정상 동작 | High |
| J3-03 | 잘못된 스타일 이름 | 존재하지 않는 스타일 | 기본 동작 유지 | Medium |

### J.4 Memory 비지원 환경

| TC-ID | Test Case | Condition | Expected Output | Priority |
|-------|-----------|-----------|-----------------|----------|
| J4-01 | v2.1.31에서 memory | 구버전 Claude Code | memory frontmatter 무시, 정상 동작 | Critical |
| J4-02 | Memory 디렉토리 부재 | .claude/agent-memory/ 없음 | Agent 정상 실행, memory 없이 | High |

---

## 15. Test Execution Plan

### 15.1 Test Phases

| Phase | Duration | Categories | Priority | Tester |
|-------|----------|------------|----------|--------|
| Phase 1: Critical Core | 3h | E (PDCA), J1 (Backward), I (Config) | Critical | Manual |
| Phase 2: New Features | 3h | F (v1.5.1 Features), G (v2.1.33) | Critical | Manual |
| Phase 3: Skills & Agents | 3h | A (Skills), B (Agents) | Critical/High | Manual |
| Phase 4: Hooks & Library | 2h | C (Hooks), D (Library) | High/Medium | Manual |
| Phase 5: Compatibility | 1.5h | J2-J4 (Compat), H (Multi-lang) | High/Medium | Manual |

### 15.2 Test Execution Checklist

```markdown
## Pre-Test
- [ ] Claude Code v2.1.33 설치 확인
- [ ] bkit v1.5.1 플러그인 활성화 확인
- [ ] CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 설정
- [ ] 테스트 프로젝트 준비
- [ ] PDCA 상태 초기화
- [ ] 이전 테스트 데이터 정리

## Phase 1: Critical Core (3h)
- [ ] E1-01 ~ E2-02: PDCA 전체 사이클 + Task 체인
- [ ] J1-01 ~ J1-10: v1.5.0 회귀 테스트
- [ ] I1-01 ~ I1-12: Configuration 검증

## Phase 2: New Features (3h)
- [ ] F1-01 ~ F1-12: Agent Teams 통합
- [ ] F2-01 ~ F2-09: Output Styles
- [ ] F3-01 ~ F3-11: Memory Frontmatter
- [ ] F4-01 ~ F4-08: Sub-agent Restriction
- [ ] F5-01 ~ F5-08: New Hook Scripts
- [ ] G1-01 ~ G4-04: v2.1.33 Platform Features

## Phase 3: Skills & Agents (3h)
- [ ] A1-01 ~ A8-04: 21개 Skills 전체 (78 Cases)
- [ ] B1-01 ~ B11-03: 11개 Agents 전체 (55 Cases)

## Phase 4: Hooks & Library (2h)
- [ ] C1-01 ~ C8-04: 8개 Hook Events (38 Cases)
- [ ] D1-01 ~ D5-06: 5개 Library Modules (42 Cases)

## Phase 5: Compatibility (1.5h)
- [ ] J2-01 ~ J4-02: Team/Styles/Memory 비활성 호환
- [ ] H1-01 ~ H1-08: 8개 언어 트리거
```

---

## 16. Success Criteria

### 16.1 Definition of Done

- [ ] 모든 Critical 테스트 케이스 통과 (100%)
- [ ] High 테스트 케이스 통과 (95%+)
- [ ] Medium 테스트 케이스 통과 (90%+)
- [ ] v1.5.1 신기능 전체 통과
- [ ] v1.5.0 회귀 버그 0건
- [ ] Backward Compatibility 전체 통과

### 16.2 Quality Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Critical Pass Rate | 100% | Critical TC 통과율 |
| Overall Pass Rate | 95%+ | 전체 335 TC 통과율 |
| Regression Bugs | 0 | 기존 기능 장애 수 |
| New Feature Pass Rate | 100% | F 카테고리 48 TC 통과율 |
| Performance | No degradation | Hook 실행 시간 < 5s |
| Graceful Degradation | 100% | Team/Memory/Styles 비활성 시 정상 |

---

## 17. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Agent Teams Research Preview 불안정 | Medium | Medium | graceful degradation 검증, Team 비활성 호환 |
| Claude Code v2.1.33 롤백 | High | Very Low | v2.1.31 백업 환경 |
| Memory 파일 손상 | Medium | Low | Agent 정상 동작 검증 (memory 없이) |
| Output Styles 렌더링 오류 | Low | Medium | keep-coding-instructions 보험 |
| Sub-agent 제한 누락 | High | Low | 명시적 차단 테스트 (F4-02, F4-05, F4-07) |
| Hook timeout 초과 | Medium | Low | 5000ms 제한 시간 모니터링 |
| 환경 차이 (OS별) | Medium | Low | macOS/Linux/Windows 각 1회 |

---

## 18. Test Report Template

```markdown
# bkit v1.5.1 + Claude Code v2.1.33 Comprehensive Test Report

## Summary
- Test Date: YYYY-MM-DD
- Tester: [Name]
- Duration: [Hours]
- bkit Version: 1.5.1
- Claude Code Version: v2.1.33

## Results

| Category | Total | Pass | Fail | Skip | Pass Rate |
|----------|-------|------|------|------|-----------|
| A. Skills (21) | 78 | | | | |
| B. Agents (11) | 55 | | | | |
| C. Hooks (8) | 38 | | | | |
| D. Library (5 modules) | 42 | | | | |
| E. PDCA Workflow | 16 | | | | |
| F. v1.5.1 New Features | 48 | | | | |
| G. v2.1.33 Specific | 18 | | | | |
| H. Multi-language | 8 | | | | |
| I. Configuration | 12 | | | | |
| J. Backward Compat | 20 | | | | |
| **Total** | **335** | | | | |

## Failed Tests
| TC-ID | Issue | Severity | Notes |
|-------|-------|----------|-------|

## Certification
┌──────────────────────────────────────────────────┐
│  bkit v1.5.1 + Claude Code v2.1.33               │
│  Certification Level: [CERTIFIED / NOT CERTIFIED] │
│  Pass Rate: [XX%] ([N]/335 items)                 │
│  Regression Bugs: [N]                              │
└──────────────────────────────────────────────────┘
```

---

## 19. Next Steps

1. [ ] 테스트 계획서 리뷰 및 승인
2. [ ] 테스트 환경 구축 (Claude Code v2.1.33 + bkit v1.5.1)
3. [ ] Phase 1 (Critical Core) 테스트 실행
4. [ ] Phase 2 (New Features) 테스트 실행
5. [ ] Phase 3-5 순차 실행
6. [ ] 테스트 결과 분석 및 리포트 (`/pdca report bkit-v1.5.1-comprehensive-test`)
7. [ ] 필요시 bkit 수정 및 재테스트

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-06 | Initial draft - 335 TC across 10 categories | bkit Team |

---

*Generated by bkit PDCA Skill | 2026-02-06*
