# bkit v1.5.1 Comprehensive Functional Test Plan

> **Plan**: bkit v1.5.1 전체 기능 포괄적 테스트
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: CTO Team (bkit PDCA)
> **Date**: 2026-02-06
> **Status**: Completed
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, claude --plugin-dir .

## 1. Background

bkit v1.5.1은 다음을 포함하는 대규모 릴리스입니다:
- 21 Skills, 16 Agents, 8 Hook Events, 141+ Library Functions
- CTO-Led Agent Teams, Output Styles, Agent Memory
- 8개 언어 지원 (en, ko, ja, zh, es, fr, de, it)
- PDCA 방법론 전체 사이클 자동화

모든 기능이 설계 의도대로 동작하는지 100% 검증이 필요합니다.

## 2. Goals

### Must (필수)
| ID | Goal | Description |
|:--:|------|-------------|
| G-01 | Library Unit Test | 141+ functions의 개별 동작 검증 |
| G-02 | Hook Integration Test | 8개 Hook Event의 스크립트 실행 검증 |
| G-03 | Agent Trigger Test | 16개 Agent의 트리거 패턴 매칭 검증 |
| G-04 | Skill Activation Test | 21개 Skill의 로드 및 실행 검증 |
| G-05 | PDCA Cycle Test | Plan→Design→Do→Check→Act→Report 전체 흐름 |
| G-06 | Multi-Language Test | 8개 언어의 의도 감지 및 트리거 동작 |
| G-07 | Team Orchestration Test | Agent Teams 팀 구성, 전략, 통신 검증 |
| G-08 | Configuration Test | bkit.config.json 설정값 적용 검증 |

### Should (권장)
| ID | Goal | Description |
|:--:|------|-------------|
| G-09 | Error Handling Test | 엣지 케이스 및 에러 상황 처리 |
| G-10 | Performance Test | 함수 실행 시간 및 메모리 사용량 |
| G-11 | User Experience Test | 사용자 시나리오 기반 종합 테스트 |

## 3. Scope

### 3.1 Library Modules (5 Modules, 141+ Functions)

| Module | Files | Functions | Test Cases |
|--------|-------|-----------|------------|
| core/ | 7 | 37 | 45 |
| pdca/ | 6 | 50 | 55 |
| intent/ | 2+ | 19 | 30 |
| task/ | 5 | 26 | 30 |
| team/ | 8 | 31 | 40 |
| **Total** | **28+** | **163** | **200** |

### 3.2 Hook Scripts (8 Events, 43 Scripts)

| Hook Event | Script | Test Cases |
|------------|--------|------------|
| SessionStart | session-start.js | 8 |
| PreToolUse(Write\|Edit) | pre-write.js | 5 |
| PreToolUse(Bash) | unified-bash-pre.js | 5 |
| PostToolUse(Write) | unified-write-post.js | 5 |
| PostToolUse(Bash) | unified-bash-post.js | 5 |
| PostToolUse(Skill) | skill-post.js | 5 |
| Stop | unified-stop.js | 5 |
| UserPromptSubmit | user-prompt-handler.js | 8 |
| PreCompact | context-compaction.js | 3 |
| TaskCompleted | pdca-task-completed.js | 5 |
| TeammateIdle | team-idle-handler.js | 5 |
| **Total** | **11** | **64** |

### 3.3 Agents (16 Agents)

| Agent | Trigger Keywords | Test Cases |
|-------|-----------------|------------|
| cto-lead | team, CTO, project lead | 3 |
| gap-detector | verify, check, gap | 3 |
| pdca-iterator | improve, iterate, fix | 3 |
| code-analyzer | analyze, quality, security | 3 |
| report-generator | report, summary, progress | 3 |
| starter-guide | help, beginner, first time | 3 |
| pipeline-guide | pipeline, phase, where to start | 3 |
| bkend-expert | backend, login, database | 3 |
| enterprise-expert | microservices, kubernetes | 3 |
| frontend-architect | frontend, UI, component | 3 |
| infra-architect | AWS, terraform, infrastructure | 3 |
| product-manager | requirements, feature spec | 3 |
| qa-strategist | test strategy, QA plan | 3 |
| qa-monitor | docker logs, log analysis | 3 |
| security-architect | security, OWASP, vulnerability | 3 |
| design-validator | design review, spec check | 3 |
| **Total** | | **48** |

### 3.4 Skills (21 Skills)

| Skill | Trigger | Test Cases |
|-------|---------|------------|
| pdca | /pdca plan\|design\|do\|analyze\|iterate\|report\|status\|next | 10 |
| starter | static website, portfolio | 2 |
| dynamic | fullstack, BaaS | 2 |
| enterprise | microservices, k8s | 2 |
| development-pipeline | pipeline, phase | 2 |
| phase-1-schema ~ phase-9-deployment | 9 phases | 9 |
| code-review | code review | 2 |
| zero-script-qa | log-based testing | 2 |
| claude-code-learning | learn, setup | 2 |
| desktop-app | Electron, Tauri | 2 |
| mobile-app | React Native, Flutter | 2 |
| bkit-templates | template | 2 |
| bkit-rules | (auto-applied) | 2 |
| **Total** | | **41** |

### 3.5 Configuration & Integration

| Category | Test Cases |
|----------|------------|
| bkit.config.json validation | 5 |
| .bkit-memory.json state management | 5 |
| .pdca-status.json tracking | 5 |
| Plugin metadata (plugin.json) | 3 |
| Output Styles (3 styles) | 3 |
| Templates (13 templates) | 5 |
| Philosophy docs (4 docs) | 4 |
| **Total** | **30** |

## 4. Test Case Summary

| Category | TC Count |
|----------|----------|
| Library Unit Tests | 200 |
| Hook Integration Tests | 64 |
| Agent Trigger Tests | 48 |
| Skill Activation Tests | 41 |
| Configuration & Integration Tests | 30 |
| **Grand Total** | **383** |

## 5. Success Criteria

| Criteria | Target | Measurement |
|----------|--------|-------------|
| TC Pass Rate | >= 95% | Passed / Total TCs |
| Critical TC Pass | 100% | All Must-level TCs pass |
| Library Function Coverage | 100% | All exported functions tested |
| Hook Script Coverage | 100% | All hook scripts executed |
| Multi-Language Coverage | 100% | All 8 languages tested |
| Error Handling | >= 90% | Edge cases handled |

## 6. Timeline

| Phase | Content | PDCA Phase |
|-------|---------|------------|
| Plan | Test plan creation | Plan |
| Design | Detailed TC specification | Design |
| Execute | Test execution with CTO Team | Do |
| Report | Result analysis and report | Report |

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-06 | 1.0 | Initial comprehensive test plan |
