# bkit v1.5.1 Comprehensive Functional Test Design

> **Design**: bkit v1.5.1 전체 기능 포괄적 테스트 상세 설계서
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: CTO Team (bkit PDCA)
> **Date**: 2026-02-06
> **Status**: Completed
> **Plan Doc**: [bkit-v1.5.1-comprehensive-functional-test.plan.md](../../01-plan/features/bkit-v1.5.1-comprehensive-functional-test.plan.md)

## 1. Overview

### 1.1 테스트 목표
bkit v1.5.1의 모든 기능(5개 Library 모듈, 8 Hook Events, 16 Agents, 21 Skills)을 Unit Test부터 종합 Integration Test까지 100% 검증하여 사용자 경험 품질을 보증한다.

### 1.2 테스트 원칙
- **Automation First**: node.js 스크립트로 자동 실행 가능한 테스트
- **No Guessing**: 실제 함수 호출, 실제 스크립트 실행으로 검증
- **Docs = Code**: 테스트 결과가 곧 품질 문서

### 1.3 CTO Team 구성
| Role | Name | Responsibility | Model |
|------|------|---------------|-------|
| CTO Lead | team-lead | 오케스트레이션, Report 작성 | Opus |
| QA Library | qa-library | lib/ 모듈 Unit Test (258 TC) | General |
| QA Hooks | qa-hooks | Hook/Script Integration Test (49 TC) | General |
| QA Integration | qa-integration | Agent/Skill/Config Test (174 TC) | General |

## 2. 테스트 아키텍처

```
┌─────────────────────────────────────────────────────┐
│                CTO Lead (Orchestrator)                │
├──────────┬──────────────┬──────────────┬────────────┤
│          │              │              │            │
│  qa-library    qa-hooks      qa-integration         │
│  (Unit)        (Hook)        (Integration)          │
│                                                      │
│  lib/core/     hooks.json    agents/ (16)           │
│  lib/pdca/     scripts/ (43) skills/ (21)           │
│  lib/intent/                  config files          │
│  lib/task/                    cross-references      │
│  lib/team/                    multi-language        │
└─────────────────────────────────────────────────────┘
```

## 3. Test Category 1: Library Unit Tests (258 TC)

### 3.1 core/ 모듈 (60 TC)

| Sub-module | Functions | TC Range | Test Method |
|------------|-----------|----------|-------------|
| platform.js | detectPlatform, isClaudeCode, PLUGIN_ROOT, PROJECT_DIR, getPluginPath, getProjectPath, getTemplatePath | TC-001~009 | typeof + 호출 검증 |
| cache.js | get, set, invalidate, clear, globalCache, DEFAULT_TTL | TC-010~017 | set→get→invalidate 시퀀스 |
| io.js | truncateContext, readStdin, readStdinSync, parseHookInput, outputAllow, outputBlock, xmlSafeOutput | TC-018~033 | stdin mock + 출력 검증 |
| debug.js | getDebugLogPath, debugLog, DEBUG_LOG_PATHS | TC-034~036 | 경로 존재 + 로그 기록 |
| config.js | loadConfig, getConfig, getConfigArray, getBkitConfig, safeJsonParse | TC-037~044 | bkit.config.json 로드 검증 |
| file.js | TIER_EXTENSIONS, isSourceFile, isCodeFile, isUiFile, isEnvFile, extractFeature | TC-045~060 | 파일 확장자별 분류 검증 |

#### 기대 Output 예시
```javascript
// TC-001: detectPlatform()
Input: (no args)
Expected: 'claude-code' | 'cursor' | 'windsurf' | 'unknown'
Actual: 'claude-code' // CLAUDE_PLUGIN_ROOT 설정 시

// TC-045: isSourceFile('app.tsx')
Input: 'app.tsx'
Expected: true
Actual: true

// TC-050: isEnvFile('.env.local')
Input: '.env.local'
Expected: true
Actual: true
```

### 3.2 pdca/ 모듈 (78 TC)

| Sub-module | Functions | TC Range | Test Method |
|------------|-----------|----------|-------------|
| tier.js | getLanguageTier, getTierDescription, isTier1~4, isExperimentalTier | TC-061~075 | 언어별 Tier 분류 검증 |
| level.js | detectLevel, LEVEL_PHASE_MAP, getPhaseGuidance, getLevelDescription | TC-076~086 | 디렉토리 기반 레벨 감지 |
| phase.js | getPhase, setPhase, validatePhase, PHASE_SEQUENCE, PHASE_MAP | TC-087~103 | 페이즈 순서 + 전환 검증 |
| status.js | getPdcaStatus, updatePdcaStatus, getPdcaHistory, getFeatureList 등 | TC-104~120 | .pdca-status.json CRUD |
| automation.js | shouldAutoInitialize, analyzeFileChanges, calculateMatchRate 등 | TC-121~138 | 자동화 임계값 검증 |

#### 기대 Output 예시
```javascript
// TC-061: getLanguageTier('typescript')
Expected: 1 (AI-Native Tier)
Actual: 1

// TC-076: detectLevel() with .mcp.json present
Expected: 'Dynamic'
Actual: 'Dynamic'

// TC-087: PHASE_SEQUENCE
Expected: ['plan', 'design', 'do', 'check', 'act', 'report', 'completed']
Actual: ['plan', 'design', 'do', 'check', 'act', 'report', 'completed']
```

### 3.3 intent/ 모듈 (27 TC)

| Sub-module | Functions | TC Range | Test Method |
|------------|-----------|----------|-------------|
| language.js | detectLanguage, getAllPatterns, matchMultiLangPattern | TC-139~149 | 8개 언어 감지 |
| trigger.js | detectAgentIntent, findMatchingAgent 등 | TC-150~158 | 키워드→에이전트 매칭 |
| ambiguity.js | analyzeAmbiguity, calculateAmbiguityScore 등 | TC-159~174 | 모호성 점수 계산 |

#### 기대 Output 예시
```javascript
// TC-139: detectLanguage('코드 검증해줘')
Expected: 'ko'
Actual: 'ko'

// TC-143: detectLanguage('Verificar el codigo')
Expected: 'en' (fallback - Unicode 범위 없음)
Actual: 'en'

// TC-150: matchMultiLangPattern('verify code', AGENT_TRIGGER_PATTERNS['gap-detector'])
Expected: true
Actual: true
```

### 3.4 task/ 모듈 (33 TC)

| Sub-module | Functions | TC Range | Test Method |
|------------|-----------|----------|-------------|
| classification.js | classifyTask, getTaskSize, estimateComplexity | TC-175~186 | 태스크 크기 분류 |
| context.js | getTaskContext, createTaskContext | TC-187~192 | 컨텍스트 생성 |
| creator.js | createTask, createTaskChain | TC-193~200 | 태스크 생성 |
| tracker.js | trackTaskProgress, getTaskStatus | TC-201~207 | 진행 추적 |

### 3.5 team/ 모듈 (54 TC)

| Sub-module | Functions | TC Range | Test Method |
|------------|-----------|----------|-------------|
| coordinator.js | isTeamModeAvailable, getTeamConfig, suggestTeamMode | TC-208~213 | 환경변수 + 설정 검증 |
| strategy.js | TEAM_STRATEGIES, getTeammateRoles | TC-214~216 | 레벨별 전략 |
| hooks.js | assignNextTeammateWork, handleTeammateIdle | TC-217~219 | 페이즈 전환 |
| orchestrator.js | selectOrchestrationPattern, composeTeamForPhase 등 | TC-220~228 | 팀 구성 검증 |
| communication.js | createMessage, createBroadcast 등 | TC-229~237 | 메시지 포맷 |
| task-queue.js | createTeamTasks, assignTaskToRole 등 | TC-238~243 | 태스크 큐 |
| cto-logic.js | decidePdcaPhase, evaluateCheckResults 등 | TC-244~252 | CTO 결정 로직 |

#### 기대 Output 예시
```javascript
// TC-244: evaluateCheckResults(95, 0, 90)
Expected: { decision: 'report', reason: 'Match rate 95% meets threshold...', nextAction: '/pdca report' }

// TC-246: evaluateCheckResults(60, 0, 50)
Expected: { decision: 'redesign', reason: 'Match rate 60% is critically low...', nextAction: '/pdca design' }
```

### 3.6 common.js Bridge (6 TC)
| TC Range | Test Method |
|----------|-------------|
| TC-253~258 | 모든 re-export가 원본 모듈과 동일한 참조인지 === 비교 |

## 4. Test Category 2: Hook Integration Tests (49 TC)

### 4.1 hooks.json Events (11 TC)

| TC | Hook Event | Script | Input Format | Expected Output |
|---|---|---|---|---|
| H01 | SessionStart | session-start.js | `{}` | JSON: hookEventName, onboardingType, additionalContext |
| H02 | PreToolUse(Write) | pre-write.js | `{tool_name,tool_input}` | 빈 출력 또는 PDCA context |
| H03 | PreToolUse(Bash) | unified-bash-pre.js | `{tool_name,tool_input}` | "Bash command validated." |
| H04 | PostToolUse(Write) | unified-write-post.js | `{tool_name,tool_output}` | 빈 출력 (상태 업데이트) |
| H05 | PostToolUse(Bash) | unified-bash-post.js | `{tool_name,tool_output}` | 빈 출력 |
| H06 | PostToolUse(Skill) | skill-post.js | `{tool_name,tool_input}` | JSON: skill info |
| H07 | Stop | unified-stop.js | `{}` | "Stop event processed." |
| H08 | UserPromptSubmit | user-prompt-handler.js | `{prompt}` | 트리거 매칭 결과 |
| H09 | PreCompact | context-compaction.js | `{reason}` | JSON: PDCA snapshot |
| H10 | TaskCompleted | pdca-task-completed.js | `{task_subject}` | PDCA phase 감지 메시지 |
| H11 | TeammateIdle | team-idle-handler.js | `{teammate_id}` | JSON: nextTask 할당 |

### 4.2 Phase Scripts (12 TC: H12~H23)
Phase 1~9의 Stop/Pre/Post 스크립트 실행 검증

### 4.3 Agent Scripts (10 TC: H24~H33)
code-analyzer, code-review, design-validator, gap-detector, qa-monitor, iterator 등

### 4.4 PDCA/Utility Scripts (16 TC: H34~H49)
learning-stop, analysis-stop, pdca-skill-stop, archive-feature, validate-plugin 등

## 5. Test Category 3: Agent & Skill Integration Tests (174 TC)

### 5.1 Agent 구조 검증 (96 TC)
16개 Agent x 6개 필드 (frontmatter, name, description, tools, model, triggers)

### 5.2 Skill 구조 검증 (63 TC)
21개 Skill x 3개 필드 (파일 존재, 이름, 설명)

### 5.3 다언어 트리거 매칭 (30 TC)
- detectLanguage: 8 TC (en, ko, ja, zh, es, fr, de, it)
- Agent Trigger Pattern: 18 TC (6 agents x 3 languages)
- Skill Trigger Pattern: 4 TC

### 5.4 PDCA 사이클 흐름 (12 TC)
Phase 시퀀스, 전환 규칙, Status CRUD

### 5.5 Team Orchestration (21 TC)
Dynamic/Enterprise 전략, CTO Logic, Communication

### 5.6 Configuration (25 TC)
bkit.config.json, .bkit-memory.json, .pdca-status.json, plugin.json, Output Styles, Templates, Philosophy docs

### 5.7 Cross-Reference 무결성 (52 TC)
Config→Agent, hooks.json→scripts, Agent→Agent 참조, Output Styles, Templates, Philosophy docs

## 6. 검증 기준

| # | 검증 항목 | 검증 방법 | 통과 기준 |
|:---:|---------|----------|----------|
| V-01 | Library Unit Test | node.js require + 호출 | Pass Rate >= 95% |
| V-02 | Hook Script Execution | stdin pipe + exit code | 모든 핵심 Hook PASS |
| V-03 | Agent Structure | .md 파일 필수 필드 존재 | 16/16 PASS |
| V-04 | Skill Structure | SKILL.md 필수 필드 존재 | 21/21 PASS |
| V-05 | Multi-Language | 8 languages x triggers | >= 90% PASS |
| V-06 | PDCA Cycle | Phase 시퀀스 검증 | 100% PASS |
| V-07 | Team Orchestration | Strategy + CTO Logic | 100% PASS |
| V-08 | Configuration | JSON validity + cross-ref | 100% PASS |
| V-09 | Cross-Reference | 파일 존재 + 매칭 | 100% PASS |
| V-10 | Error Handling | Edge cases | >= 90% PASS |

## Version History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-06 | 1.0 | Initial comprehensive test design |
