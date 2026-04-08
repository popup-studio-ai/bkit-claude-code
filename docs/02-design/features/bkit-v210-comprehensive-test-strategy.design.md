# bkit v2.1.0 종합 테스트 전략 설계서

> **Summary**: 10-Agent 분석 기반 12-관점 종합 테스트 아키텍처 설계
>
> **Project**: bkit — AI Native Development OS
> **Version**: 2.1.0
> **Author**: kay kim (10-Agent CTO Team)
> **Date**: 2026-04-08
> **Status**: Approved
> **Planning Doc**: [bkit-v210-comprehensive-test-strategy.plan.md](../01-plan/features/bkit-v210-comprehensive-test-strategy.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 기존 3,370 TC가 structural 검증에 편중, behavioral/functional 테스트 부재. 97개 export(13 모듈) test 0건 |
| **WHO** | bkit 개발팀, plugin 사용자, 기여자 |
| **RISK** | Critical 보안 취약점 3건, checkpoint/trust-engine 버그 2건 |
| **SUCCESS** | 커버리지 45%→70%, Critical 보안 0건, MCP functional 100%, hook behavioral 80%, PDCA 전이 100% |
| **SCOPE** | 5 세션: S1(Unit) → S2(Hook/Integration) → S3(E2E/Behavioral) → S4(Security/Performance) → S5(UX/MCP/Contract) |

---

## 1. Overview

### 1.1 Design Goals

1. **Behavioral-first**: 구조적 검증을 넘어 실제 동작(stdin→stdout, state transition, API response) 검증
2. **Isolation**: 각 test가 독립 실행 가능, 임시 디렉토리로 상태 격리
3. **Incremental**: 기존 3,370 TC 체계(assert 패턴, run-all.js)와 완전 호환
4. **Security-embedded**: 보안 테스트가 일반 테스트와 분리되지 않고 각 모듈에 내장

### 1.2 Design Principles

- **Test = Specification**: 테스트 코드가 곧 동작 사양서 역할
- **Real I/O**: mock 최소화, 실제 파일 I/O와 child process 통신 우선
- **Fail-fast**: Critical 테스트 실패 시 즉시 중단 (`process.exit(1)`)
- **Zero Dependencies**: 외부 테스트 프레임워크 없이 Node.js built-in만 사용

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 기존 구조에 파일만 추가 | 테스트 헬퍼 레이어 구축 후 추가 | 핵심 헬퍼만 추가 + 파일 추가 |
| **New Files** | 45 | 55 | 50 |
| **Modified Files** | 3 | 8 | 5 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | TC 중복, 일관성 낮음 | 오버엔지니어링 | 균형 |
| **Recommendation** | 소규모 패치 | 대규모 리팩토링 | **Default** |

**Selected**: Option C: Pragmatic — **Rationale**: 기존 테스트 패턴과의 호환성을 유지하면서 핵심 헬퍼(hook runner, MCP client, temp dir)만 추가하여 behavioral test 작성을 지원

---

## 3. Test Architecture

### 3.1 12-Category Test Framework

```
test/
├── unit/                  # L1: 함수 단위 (기존 54 + 신규 13 = 67 파일)
├── integration/           # L2: 모듈 간 협업 (기존 21 + 신규 10 = 31 파일)
├── e2e/                   # L3: 전체 워크플로우 (기존 4 + 신규 6 = 10 파일)
├── security/              # L4: 보안 검증 (기존 10 + 신규 5 = 15 파일)
├── performance/           # L5: 성능 budget (기존 9 + 신규 3 = 12 파일)
├── regression/            # L6: 버전 회귀 (기존 18 + 신규 3 = 21 파일)
├── philosophy/            # L7: 설계 원칙 (기존 8, 변경 없음)
├── ux/                    # L8: 사용자 경험 (기존 11 + 신규 3 = 14 파일)
├── architecture/          # L9: 구조적 무결성 (기존 5, 변경 없음)
├── controllable-ai/       # L10: 제어 가능성 (기존 4, 변경 없음)
├── behavioral/            # L11: 에이전트/스킬 동작 (신규 6 파일) ★NEW
├── contract/              # L12: Hook/MCP 계약 (신규 4 파일) ★NEW
├── helpers/               # 공통 유틸리티 (기존 3 + 신규 3 = 6 파일)
│   ├── assert.js          # (기존) 커스텀 assert
│   ├── report.js          # (기존) 리포트 생성
│   ├── timer.js           # (기존) 타이밍 유틸
│   ├── hook-runner.js     # (신규) Hook script 실행기 ★
│   ├── mcp-client.js      # (신규) MCP JSON-RPC 클라이언트 ★
│   └── temp-dir.js        # (신규) 임시 디렉토리 관리 ★
├── fixtures/              # 테스트 데이터
└── run-all.js             # 테스트 러너 (12 카테고리 지원)
```

### 3.2 Core Test Helpers Design

#### 3.2.1 hook-runner.js — Hook Script 실행기

```javascript
/**
 * Hook script를 child process로 실행하고 stdin→stdout JSON I/O를 검증
 *
 * Usage:
 *   const { runHook } = require('../helpers/hook-runner');
 *   const result = await runHook('scripts/unified-stop.js', {
 *     hook_event_name: 'Stop',
 *     tool_name: null,
 *     tool_input: {},
 *     // ... CC hook stdin schema
 *   }, {
 *     env: { CLAUDE_PLUGIN_ROOT: '/path/to/bkit', CLAUDE_PLUGIN_DATA: tmpDir },
 *     timeout: 5000
 *   });
 *   assert.strictEqual(result.exitCode, 0);
 *   assert.ok(result.stdout.description);
 */

// Interface:
// runHook(scriptPath, stdinPayload, options?) → Promise<{ exitCode, stdout, stderr, duration }>
// - scriptPath: relative to project root
// - stdinPayload: object → JSON.stringify → pipe to stdin
// - options.env: environment variables (merged with process.env)
// - options.timeout: ms (default: 5000)
// - stdout: parsed JSON if valid, raw string otherwise
```

#### 3.2.2 mcp-client.js — MCP JSON-RPC Client

```javascript
/**
 * MCP 서버를 child process로 spawn하고 JSON-RPC 통신
 *
 * Usage:
 *   const { createMcpClient } = require('../helpers/mcp-client');
 *   const client = await createMcpClient('servers/bkit-pdca-server/index.js');
 *   const initResult = await client.send('initialize', {
 *     protocolVersion: '2025-03-26',
 *     capabilities: {}
 *   });
 *   const tools = await client.send('tools/list', {});
 *   const result = await client.send('tools/call', {
 *     name: 'bkit_pdca_status',
 *     arguments: {}
 *   });
 *   await client.close();
 */

// Interface:
// createMcpClient(serverPath, options?) → Promise<McpClient>
// McpClient.send(method, params) → Promise<result>
// McpClient.close() → Promise<void>
// - Spawns server as child process with stdio pipes
// - Sends JSON-RPC 2.0 messages with auto-incrementing ID
// - Parses responses, handles errors
```

#### 3.2.3 temp-dir.js — 임시 디렉토리 관리

```javascript
/**
 * 테스트용 임시 디렉토리 생성/정리
 *
 * Usage:
 *   const { withTempDir } = require('../helpers/temp-dir');
 *   await withTempDir(async (tmpDir) => {
 *     // tmpDir에 .bkit/state/ 구조 생성
 *     // 테스트 실행
 *   }); // 자동 정리
 */

// Interface:
// withTempDir(fn) → Promise<void>
// createBkitStateDir(tmpDir) → void (creates .bkit/state/, .bkit/runtime/, .bkit/checkpoints/)
// copyFixture(name, destDir) → void
```

---

## 4. Detailed Test Specifications

### 4.1 Unit Tests — 미테스트 13 모듈 (P0, +120 TC)

#### 4.1.1 test/unit/skill-orchestrator.test.js (+40 TC)

| TC ID | Function | Test Description | Expected |
|-------|----------|-----------------|----------|
| UT-SO-001 | parseSkillFrontmatter | 유효한 SKILL.md 파싱 | name, description, triggers 반환 |
| UT-SO-002 | parseSkillFrontmatter | frontmatter 없는 파일 | null 반환, 에러 없음 |
| UT-SO-003 | parseSkillFrontmatter | 잘못된 YAML | null 반환 |
| UT-SO-004 | getSkillConfig | 캐시 miss (첫 호출) | 파싱 후 캐시에 저장 |
| UT-SO-005 | getSkillConfig | 캐시 hit (30초 이내) | 파싱 없이 캐시 반환 |
| UT-SO-006 | getSkillConfig | 캐시 TTL 만료 (30초 후) | 재파싱 |
| UT-SO-007 | getSkillConfig | 존재하지 않는 스킬 | null 반환 |
| UT-SO-008 | orchestrateSkillPre | 유효한 스킬 로딩 | imports 해석, context 반환 |
| UT-SO-009 | orchestrateSkillPre | import-resolver 통합 | 중첩 import 해결 |
| UT-SO-010 | orchestrateSkillPost | PDCA phase 스킬 | 다음 phase 제안 반환 |
| UT-SO-011 | orchestrateSkillPost | next-skill 있는 스킬 | next-skill 이름 반환 |
| UT-SO-012 | orchestrateSkillPost | next-skill 없는 스킬 | null 반환 |
| UT-SO-013 | parseAgentsField | 단일 agent 문자열 | [agentName] 배열 |
| UT-SO-014 | parseAgentsField | 다중 agent (enterprise) | 5개 agent 배열 |
| UT-SO-015 | parseAgentsField | action→agent 매핑 | { analyze: 'gap-detector' } |
| UT-SO-016 | getAgentForAction | pdca + analyze | 'gap-detector' 반환 |
| UT-SO-017 | getAgentForAction | pdca + unknown | null 반환 |
| UT-SO-018 | getSkillsByClassification | workflow | 10개 스킬 |
| UT-SO-019 | getSkillsByClassification | unknown category | 빈 배열 |
| UT-SO-020~040 | (나머지 export) | 경계값, 에러 경로, 엣지 케이스 | 각 함수별 |

#### 4.1.2 test/unit/permission-manager.test.js (+25 TC)

| TC ID | Function | Test Description | Expected |
|-------|----------|-----------------|----------|
| UT-PM-001 | checkPermission | 허용된 도구 | { allowed: true } |
| UT-PM-002 | checkPermission | 차단된 도구 | { allowed: false, reason } |
| UT-PM-003 | checkPermission | regex 패턴 매칭 | 패턴에 따라 결과 |
| UT-PM-004 | checkPermission | **ReDoS 공격 패턴** | timeout 없이 완료 |
| UT-PM-005 | getPermissionLevel | L0-L4 각 레벨 | 올바른 레벨 반환 |
| UT-PM-006 | shouldAutoApprove | L2 + 안전한 Bash | true |
| UT-PM-007 | shouldAutoApprove | L2 + 위험한 Bash | false |
| UT-PM-008 | shouldAutoApprove | L0 (모든 도구) | false |
| UT-PM-009~025 | (나머지 export) | 경계값, 에러 경로 | 각 함수별 |

#### 4.1.3 test/unit/context-loader.test.js (+30 TC)

| TC ID | Function | Test Description | Expected |
|-------|----------|-----------------|----------|
| UT-CL-001 | loadUpstreamContext | PRD + Plan + Design 존재 | 3개 문서 로드 |
| UT-CL-002 | loadUpstreamContext | PRD 없음 | Plan + Design만 로드 |
| UT-CL-003 | loadUpstreamContext | 문서 전부 없음 | 빈 context, 에러 없음 |
| UT-CL-004 | extractContextAnchor | Context Anchor 있는 Plan | WHY/WHO/RISK/SUCCESS/SCOPE |
| UT-CL-005 | extractContextAnchor | Context Anchor 없는 Plan (legacy) | null, 에러 없음 |
| UT-CL-006 | loadScenarios | 시나리오 파일 존재 | 파싱된 시나리오 배열 |
| UT-CL-007~030 | (나머지 export) | impact-analyzer, invariant-checker, ops-metrics, scenario-runner | 각 함수별 |

#### 4.1.4 test/unit/paths.test.js (+20 TC)

| TC ID | Function | Test Description | Expected |
|-------|----------|-----------------|----------|
| UT-PA-001 | resolveProjectRoot | 프로젝트 내 경로 | 프로젝트 루트 |
| UT-PA-002 | resolveProjectRoot | 프로젝트 외 경로 | cwd 반환 |
| UT-PA-003 | getBkitStateDir | 정상 | .bkit/state/ 경로 |
| UT-PA-004 | getPluginDataDir | CLAUDE_PLUGIN_DATA 설정 | 환경변수 경로 |
| UT-PA-005 | getPluginDataDir | CLAUDE_PLUGIN_DATA 미설정 | 기본 경로 |
| UT-PA-006~020 | (나머지 10 export) | 각 경로 함수 + 경계값 | 각 함수별 |

#### 4.1.5~4.1.13 나머지 모듈 (각 10-25 TC)

| 파일 | 모듈 | 예상 TC |
|------|------|---------|
| test/unit/import-resolver.test.js | import-resolver | 25 TC |
| test/unit/deploy-state-machine.test.js | deploy-state-machine | 20 TC |
| test/unit/strategy.test.js | team/strategy | 10 TC |
| test/unit/impact-analyzer.test.js | context/impact-analyzer | 15 TC |
| test/unit/invariant-checker.test.js | context/invariant-checker | 10 TC |
| test/unit/ops-metrics.test.js | context/ops-metrics | 10 TC |
| test/unit/scenario-runner.test.js | context/scenario-runner | 10 TC |
| test/unit/cto-logic.test.js | team/cto-logic | 15 TC |
| test/unit/task-queue.test.js | team/task-queue | 10 TC |

---

### 4.2 Hook Behavioral Integration Tests (P0, +60 TC)

#### 4.2.1 test/integration/hook-behavioral-stop.test.js (+15 TC)

**대상**: scripts/unified-stop.js (575 LOC, 가장 복잡한 hook)

| TC ID | Scenario | stdin | Expected stdout |
|-------|----------|-------|-----------------|
| HB-ST-001 | PDCA skill 완료 후 Stop | `{hook_event_name:"Stop"}` + activeSkill="pdca" | checkpoint 생성, state machine 전이 |
| HB-ST-002 | Agent 완료 후 Stop | activeAgent="gap-detector" | quality gate 평가, match rate 기록 |
| HB-ST-003 | 일반 Stop (skill/agent 없음) | 기본 context | audit log 기록만 |
| HB-ST-004 | Circuit breaker OPEN 상태 | feature에 5회 연속 실패 | circuit OPEN, 복구 가이드 |
| HB-ST-005 | Trust engine 점수 변화 | 성공적 작업 완료 | trust score +1 |
| HB-ST-006~015 | 각 SKILL_HANDLER 분기 | phase별 skill context | 올바른 handler 호출 |

#### 4.2.2 test/integration/hook-behavioral-user-prompt.test.js (+10 TC)

**대상**: scripts/user-prompt-handler.js (7-stage pipeline)

| TC ID | Stage | stdin | Expected |
|-------|-------|-------|----------|
| HB-UP-001 | 1. newFeatureIntent | "plan user-auth" | `suggestedSkill: "pdca"` |
| HB-UP-002 | 2. implicitAgentTrigger | "보안 검토 해줘" | `suggestedAgent: "security-architect"` |
| HB-UP-003 | 3. implicitSkillTrigger | "코드 리뷰" | `suggestedSkill: "code-review"` |
| HB-UP-004 | 4. ccCommandDetect | "/batch plan" | CC batch 감지 |
| HB-UP-005 | 5. ambiguityScore | 모호한 입력 | score 0.0~1.0 범위 |
| HB-UP-006 | 6. teamModeSuggest | Major Feature 입력 | team mode 제안 |
| HB-UP-007 | 7. importResolver | import 참조 있는 경우 | import 해석 결과 |
| HB-UP-008 | 한국어 입력 | "사용자 인증 기능 만들어줘" | 한국어 intent 감지 |
| HB-UP-009 | 일본어 입력 | "ユーザー認証機能を作って" | 일본어 intent 감지 |
| HB-UP-010 | 빈 입력 | "" | 에러 없이 빈 결과 |

#### 4.2.3 test/integration/hook-behavioral-pre-write.test.js (+8 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| HB-PW-001 | .env 파일 쓰기 시도 | exit 2 (차단) |
| HB-PW-002 | 일반 .js 파일 쓰기 | 통과 |
| HB-PW-003 | PDCA 문서 쓰기 (docs/) | PDCA 상태 업데이트 |
| HB-PW-004 | 경로 순회 시도 (`../../../etc/passwd`) | 차단 |
| HB-PW-005~008 | 각 scope 조건 | 올바른 허용/차단 |

#### 4.2.4~4.2.10 나머지 hook behavioral tests

| 파일 | 대상 Script | TC |
|------|------------|-----|
| hook-behavioral-bash-pre.test.js | unified-bash-pre.js | 8 TC |
| hook-behavioral-session-start.test.js | session-start.js | 5 TC |
| hook-behavioral-task-completed.test.js | pdca-task-completed.js | 5 TC |
| hook-behavioral-subagent.test.js | subagent-start/stop-handler.js | 4 TC |
| hook-behavioral-session-end.test.js | session-end-handler.js | 3 TC |
| hook-behavioral-compaction.test.js | context-compaction.js + post-compaction.js | 4 TC |

---

### 4.3 PDCA E2E Tests (P1, +40 TC)

#### 4.3.1 test/e2e/pdca-lifecycle.test.js (+20 TC)

| TC ID | Scenario | Steps | Expected |
|-------|----------|-------|----------|
| E2E-LC-001 | Full happy path | idle→pm→plan→design→do→check(pass)→report→archive | phase="archived", 문서 이동 완료 |
| E2E-LC-002 | Skip PM path | idle→plan→design→do→check→report | phase="report" |
| E2E-LC-003 | Iteration loop | check(70%)→act→check(85%)→act→check(92%)→report | 3회 iteration, matchRate=92 |
| E2E-LC-004 | Max iteration force | 5회 iteration 모두 <90% | forceReport 실행 |
| E2E-LC-005 | Error → Recovery | do→ERROR→saveResume→RECOVER→do | 이전 상태 복원 |
| E2E-LC-006 | Rollback | design→do, ROLLBACK→design | checkpoint 복원 |
| E2E-LC-007 | Reject backward | plan→REJECT→pm→REJECT→idle | 역방향 전이 |
| E2E-LC-008 | Stale detection | 7일 미활동 feature | TIMEOUT→archived |
| E2E-LC-009 | Abandon | 임의 phase→ABANDON | archived + reason 기록 |
| E2E-LC-010 | Multi-feature | 3개 feature 동시 관리 | 각각 독립 상태 유지 |

**모든 TC는 임시 디렉토리에서 실제 파일 I/O로 실행**

#### 4.3.2 test/e2e/pdca-status-persistence.test.js (+10 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| E2E-SP-001 | Status write → read roundtrip | 동일 데이터 |
| E2E-SP-002 | v1.0 → v3.0 schema migration | 자동 마이그레이션 |
| E2E-SP-003 | v2.0 → v3.0 schema migration | 자동 마이그레이션 |
| E2E-SP-004 | 50 features enforce limit | 오래된 것 아카이브 |
| E2E-SP-005 | archiveFeatureToSummary | 70% 크기 축소 |
| E2E-SP-006~010 | cleanupArchivedFeatures, deleteFeature | 각 함수 |

#### 4.3.3 test/e2e/pdca-resume.test.js (+10 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| E2E-RS-001 | createResumePoint → resumeSession | 상태 복원 |
| E2E-RS-002 | Resume point 만료 | cleanupExpired |
| E2E-RS-003 | 없는 resume point | graceful fallback |
| E2E-RS-004~010 | batch orchestrator, workflow engine | 각 기능 |

---

### 4.4 Security Tests (P0, +30 TC)

#### 4.4.1 test/security/path-traversal.test.js (+10 TC) ★CRITICAL

| TC ID | Attack Vector | Expected |
|-------|--------------|----------|
| SEC-PT-001 | `docs/../../.env` | 차단 |
| SEC-PT-002 | `docs/../../../../etc/passwd` | 차단 |
| SEC-PT-003 | symlink → /etc/passwd | 차단 |
| SEC-PT-004 | `file.js%00.env` (null byte) | 차단 |
| SEC-PT-005 | `docs/./../../.env` (dot segment) | 차단 |
| SEC-PT-006 | Unicode normalization bypass | 차단 |
| SEC-PT-007 | 정상 경로 `docs/01-plan/test.md` | 허용 |
| SEC-PT-008 | 정상 경로 `lib/core/config.js` | 허용 |
| SEC-PT-009~010 | 경계값 케이스 | 각각 |

#### 4.4.2 test/security/integrity-verification.test.js (+10 TC)

| TC ID | Target | Expected |
|-------|--------|----------|
| SEC-IV-001 | checkpoint verifyCheckpoint 필드 일치 | hash 필드 정상 검증 |
| SEC-IV-002 | 변조된 checkpoint | { valid: false } |
| SEC-IV-003 | trust-engine resetScore | crash 없이 정상 완료 |
| SEC-IV-004 | trust profile 파일 변조 | 이상 탐지 또는 무시 |
| SEC-IV-005 | audit-logger 버전 일치 | BKIT_VERSION === package version |
| SEC-IV-006 | audit log injection (개행 문자) | 이스케이프 처리 |
| SEC-IV-007 | disableRule(G-001) 후 rm -rf | 여전히 감지 (core rule 보호) |
| SEC-IV-008~010 | regex evasion, ReDoS 방어 | 각각 |

#### 4.4.3 test/security/hook-security.test.js (+10 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| SEC-HS-001 | 초대형 JSON stdin (1MB) | 에러 처리, crash 없음 |
| SEC-HS-002 | 잘못된 JSON stdin | 에러 처리, crash 없음 |
| SEC-HS-003 | 빈 stdin | 기본값 처리 |
| SEC-HS-004 | 환경변수 BKIT_AUTOMATION_LEVEL 스푸핑 | trust-engine 검증 우선 |
| SEC-HS-005 | script timeout 준수 | timeout 내 완료 |
| SEC-HS-006~010 | concurrent access, error swallow 검증 | 각각 |

---

### 4.5 MCP Functional API Tests (P1, +30 TC)

#### 4.5.1 test/integration/mcp-pdca-functional.test.js (+18 TC)

| TC ID | Tool | Test | Expected |
|-------|------|------|----------|
| MCP-PD-001 | (handshake) | initialize | protocolVersion, capabilities |
| MCP-PD-002 | (discovery) | tools/list | 10개 tool 목록 |
| MCP-PD-003 | bkit_pdca_status | 전체 상태 조회 | JSON 응답 |
| MCP-PD-004 | bkit_pdca_status | feature 필터 | 특정 feature 상태 |
| MCP-PD-005 | bkit_feature_list | 전체 목록 | 배열 응답 |
| MCP-PD-006 | bkit_feature_list | phase 필터 | 필터된 목록 |
| MCP-PD-007 | bkit_feature_detail | 존재하는 feature | 상세 데이터 |
| MCP-PD-008 | bkit_feature_detail | 없는 feature | NOT_FOUND 에러 |
| MCP-PD-009 | bkit_plan_read | 문서 존재 | 문서 내용 |
| MCP-PD-010 | bkit_plan_read | 문서 없음 | NOT_FOUND 에러 |
| MCP-PD-011 | bkit_design_read | 문서 존재 | 문서 내용 |
| MCP-PD-012 | bkit_analysis_read | 문서 없음 | NOT_FOUND 에러 |
| MCP-PD-013 | bkit_metrics_get | 전체 메트릭 | JSON 응답 |
| MCP-PD-014 | bkit_pdca_history | limit 파라미터 | 제한된 결과 |
| MCP-PD-015 | (resources) | resources/list | 3개 리소스 |
| MCP-PD-016 | (resources) | resources/read | 리소스 내용 |
| MCP-PD-017 | (error) | unknown tool | NOT_FOUND |
| MCP-PD-018 | (error) | malformed JSON | 서버 crash 없음 |

#### 4.5.2 test/integration/mcp-analysis-functional.test.js (+12 TC)

| TC ID | Tool | Test | Expected |
|-------|------|------|----------|
| MCP-AN-001 | (handshake) | initialize | 정상 응답 |
| MCP-AN-002 | (discovery) | tools/list | 6개 tool 목록 |
| MCP-AN-003 | bkit_code_quality | 기본 호출 | 품질 데이터 |
| MCP-AN-004 | bkit_gap_analysis | 기본 호출 | 갭 데이터 |
| MCP-AN-005 | bkit_regression_rules | list | 규칙 목록 |
| MCP-AN-006 | bkit_regression_rules | add → list | 추가된 규칙 확인 |
| MCP-AN-007 | bkit_regression_rules | 중복 ID 추가 | INVALID_ARGS 에러 |
| MCP-AN-008 | bkit_checkpoint_list | 기본 호출 | 체크포인트 목록 |
| MCP-AN-009 | bkit_checkpoint_detail | 없는 ID | NOT_FOUND |
| MCP-AN-010 | bkit_audit_search | date 필터 | 필터된 결과 |
| MCP-AN-011 | (error) | unknown method | -32601 에러 |
| MCP-AN-012 | (error) | missing required param | INVALID_ARGS |

---

### 4.6 Behavioral Tests — Agents & Skills (P1, +70 TC)

#### 4.6.1 test/behavioral/agent-triggers.test.js (+20 TC)

| TC ID | Input | Expected Agent | Rationale |
|-------|-------|---------------|-----------|
| BH-AT-001 | "security review" | security-architect | 보안 키워드 |
| BH-AT-002 | "코드 분석 해줘" | code-analyzer | 한국어 트리거 |
| BH-AT-003 | "gap analysis" | gap-detector | 정확 매칭 |
| BH-AT-004 | "프론트엔드 아키텍처" | frontend-architect | 도메인 매칭 |
| BH-AT-005 | "bkit impact" | bkit-impact-analyst | 정확 매칭 |
| BH-AT-006 | "CC version check" | cc-version-researcher | 정확 매칭 |
| BH-AT-007 | "팀 구성해줘" | cto-lead | 팀 키워드 |
| BH-AT-008 | "beginner help" | starter-guide | 초보자 키워드 |
| BH-AT-009 | "deploy" | (disambiguation) | deploy ≠ infra-architect |
| BH-AT-010~020 | 각 agent 트리거 | 올바른 agent | 모호성 해소 |

#### 4.6.2 test/behavioral/cto-logic.test.js (+15 TC)

| TC ID | Function | Input | Expected |
|-------|----------|-------|----------|
| BH-CL-001 | decidePdcaPhase | matchRate=92 | 'report' |
| BH-CL-002 | decidePdcaPhase | matchRate=70 | 'iterate' |
| BH-CL-003 | decidePdcaPhase | matchRate=40 | 'redesign' |
| BH-CL-004 | evaluateCheckResults | 5회 iteration | 'forceReport' |
| BH-CL-005 | recommendTeamComposition | Dynamic level | 3 teammates |
| BH-CL-006 | recommendTeamComposition | Enterprise level | 5-6 teammates |
| BH-CL-007 | recommendTeamComposition | Starter level | null (no team) |
| BH-CL-008~015 | 나머지 decision functions | 경계값 | 각 함수별 |

#### 4.6.3 test/behavioral/skill-orchestration.test.js (+20 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| BH-SK-001 | phase 1→9 체인 완전성 | 끊김 없는 9단계 |
| BH-SK-002 | pdca skill → analyze action | gap-detector agent 바인딩 |
| BH-SK-003 | pdca skill → iterate action | pdca-iterator agent 바인딩 |
| BH-SK-004 | pdca skill → report action | report-generator agent 바인딩 |
| BH-SK-005 | enterprise skill → agents | 5-way agent 바인딩 |
| BH-SK-006 | skill-post arg parsing | "plan user-auth" → action=plan, feature=user-auth |
| BH-SK-007 | skill-post arg parsing | "status" → action=status, feature=null |
| BH-SK-008 | skill-post arg parsing | "" → action=null, feature=null |
| BH-SK-009 | deploy skill 존재 검증 | skills-37 (36 아님) |
| BH-SK-010~020 | 나머지 skill 기능 | 각 skill별 |

#### 4.6.4 test/behavioral/team-coordination.test.js (+15 TC)

| TC ID | Scenario | Expected |
|-------|----------|----------|
| BH-TC-001 | PM Team 4-agent pipeline | pm-discovery→pm-strategy→pm-research→pm-prd |
| BH-TC-002 | Phase transition recompose | do→check 시 team 구성 변경 |
| BH-TC-003 | Idle teammate reassignment | task-queue에서 다음 작업 할당 |
| BH-TC-004 | Team mode disabled | handleTeammateIdle → null |
| BH-TC-005 | shouldRecomposeTeam | phase 변경 시 true |
| BH-TC-006~015 | 통신, 상태 기록, 에러 | 각 team 함수별 |

---

### 4.7 Performance Tests (P2, +25 TC)

#### 4.7.1 test/performance/mcp-response-perf.test.js (+10 TC)

| TC ID | MCP Tool | Budget | Test |
|-------|----------|--------|------|
| PF-MR-001 | bkit_pdca_status | <500ms | 10회 평균 |
| PF-MR-002 | bkit_feature_list | <500ms | 10회 평균 |
| PF-MR-003 | bkit_code_quality | <500ms | 10회 평균 |
| PF-MR-004~010 | 나머지 tool | <500ms | 각 tool |

#### 4.7.2 test/performance/hook-real-execution.test.js (+10 TC)

| TC ID | Script | Timeout Budget | Test |
|-------|--------|---------------|------|
| PF-HR-001 | session-end-handler.js | <1000ms (1500ms의 66%) | 실제 실행 |
| PF-HR-002 | user-prompt-handler.js | <1500ms (3000ms의 50%) | 실제 실행 |
| PF-HR-003 | notification-handler.js | <1000ms (2000ms의 50%) | 실제 실행 |
| PF-HR-004 | unified-stop.js | <5000ms (10000ms의 50%) | 실제 실행 |
| PF-HR-005~010 | 나머지 scripts | <50% of timeout | 각 script |

#### 4.7.3 test/performance/memory-leak.test.js (+5 TC)

| TC ID | Scenario | Budget |
|-------|----------|--------|
| PF-ML-001 | Cache Map 1000 entries 후 size | 제한 내 |
| PF-ML-002 | Circuit breaker 100 features | Map 크기 제한 |
| PF-ML-003 | 100회 hook 실행 후 heap growth | <10MB |
| PF-ML-004 | State store tmp 파일 정리 | 0개 잔존 |
| PF-ML-005 | require.cache 크기 | 안정화 |

---

### 4.8 UX Tests (P2, +25 TC)

#### 4.8.1 test/ux/accessibility.test.js (+10 TC) ★NEW

| TC ID | Scenario | Expected |
|-------|----------|----------|
| UX-AC-001 | NO_COLOR=1 환경 | ANSI 코드 0개 |
| UX-AC-002 | stdout.isTTY=false | 깨끗한 텍스트 출력 |
| UX-AC-003 | 80 column 터미널 | 줄바꿈 없이 렌더링 |
| UX-AC-004~010 | 각 UI 컴포넌트 NO_COLOR | 각 컴포넌트별 |

#### 4.8.2 test/ux/cjk-rendering.test.js (+8 TC) ★NEW

| TC ID | Scenario | Expected |
|-------|----------|----------|
| UX-CJ-001 | 한국어 제목 truncate | 올바른 display width |
| UX-CJ-002 | 일본어 feature name | 박스 경계 내 |
| UX-CJ-003 | 중국어 + 영어 혼합 | 정확한 열 계산 |
| UX-CJ-004 | 한국어 progress bar | 정렬 유지 |
| UX-CJ-005~008 | 각 UI 컴포넌트 CJK | 각 컴포넌트별 |

#### 4.8.3 test/ux/language-detection-full.test.js (+7 TC) ★NEW

| TC ID | Language | Input | Expected |
|-------|----------|-------|----------|
| UX-LD-001 | Spanish | "crear una función" | 'es' |
| UX-LD-002 | French | "créer une fonction" | 'fr' |
| UX-LD-003 | German | "eine Funktion erstellen" | 'de' |
| UX-LD-004 | Italian | "creare una funzione" | 'it' |
| UX-LD-005 | Korean | "함수 만들어줘" | 'ko' |
| UX-LD-006 | Japanese | "関数を作って" | 'ja' |
| UX-LD-007 | Chinese | "创建一个函数" | 'zh' |

---

### 4.9 Contract Tests (P2, +50 TC) ★NEW CATEGORY

#### 4.9.1 test/contract/hook-input-schema.test.js (+25 TC)

**목적**: CC가 hook에 보내는 stdin JSON 스키마를 검증하여 CC 업그레이드 시 호환성 보호

| TC ID | Hook Event | Required Fields | Validation |
|-------|-----------|----------------|------------|
| CT-HI-001 | SessionStart | hook_event_name | === 'SessionStart' |
| CT-HI-002 | PreToolUse | tool_name, tool_input | string, object |
| CT-HI-003 | PostToolUse | tool_name, tool_result | string, string/object |
| CT-HI-004 | Stop | hook_event_name | === 'Stop' |
| CT-HI-005 | UserPromptSubmit | user_prompt | string |
| CT-HI-006~025 | 나머지 hook events | 각 스키마 | 필수 필드 존재 |

#### 4.9.2 test/contract/hook-output-schema.test.js (+15 TC)

**목적**: bkit hook이 CC에 반환하는 stdout JSON 스키마 검증

| TC ID | Hook | Output Fields | Validation |
|-------|------|--------------|------------|
| CT-HO-001 | PreToolUse:Write | decision, reason | 'allow'/'block'/'approve', string |
| CT-HO-002 | PreToolUse:Bash | decision | 'allow'/'block' |
| CT-HO-003 | UserPromptSubmit | description, additionalContext | string (optional) |
| CT-HO-004 | Stop | description | string |
| CT-HO-005~015 | 나머지 | 각 스키마 | CC 기대값 충족 |

#### 4.9.3 test/contract/mcp-protocol.test.js (+10 TC)

| TC ID | Protocol | Test | Expected |
|-------|----------|------|----------|
| CT-MP-001 | initialize | protocolVersion | '2025-03-26' 호환 |
| CT-MP-002 | tools/list | response schema | { tools: [...] } |
| CT-MP-003 | tools/call | okResponse | { content: [{type:'text'}] } |
| CT-MP-004 | tools/call | errResponse | { isError: true } |
| CT-MP-005~010 | resources, errors | 각 프로토콜 | JSON-RPC 2.0 준수 |

---

### 4.10 Regression Test Updates (P3, +20 TC)

| 파일 | 수정 | TC |
|------|------|-----|
| test/regression/agents-32.test.js | 31→32 agents (self-healing 추가) | 5 TC |
| test/regression/skills-37.test.js | 36→37 skills (deploy 추가) | 5 TC |
| test/regression/hooks-22.test.js | 18→22 events (CwdChanged, TaskCreated 등 추가) | 5 TC |
| test/regression/agents-effort-32.test.js | 29→32 agents effort (3개 누락 추가) | 5 TC |

---

### 4.11 Source Code Fixes (P0, 보안 버그)

#### 4.11.1 lib/control/scope-limiter.js — 경로 정규화

```javascript
// Before (취약):
// _globMatch(filePath, pattern) — filePath를 그대로 사용

// After (수정):
// path.resolve()로 정규화 후 매칭
// symlink는 fs.realpathSync()로 해결
// null byte (\0) 포함 경로 즉시 거부
```

#### 4.11.2 lib/control/trust-engine.js — resetScore 버그

```javascript
// Before (line ~405):
// profile.events.push({ type: 'reset', ... })  ← events 필드 없음, crash

// After:
// profile.levelHistory.push({ type: 'reset', ... })  ← 올바른 필드
```

#### 4.11.3 lib/control/checkpoint-manager.js — 무결성 필드

```javascript
// Before:
// createCheckpoint: stores as pdcaStatusHash
// verifyCheckpoint: checks cp.hash (항상 undefined → always valid)

// After:
// verifyCheckpoint: checks cp.pdcaStatusHash (실제 검증)
```

#### 4.11.4 lib/audit/audit-logger.js — 버전 하드코딩

```javascript
// Before (line ~27):
// const BKIT_VERSION = '2.0.6';

// After:
// const { BKIT_VERSION } = require('../core/version');
```

---

## 5. Implementation Guide

### 5.1 File Structure (신규/수정 파일)

```
test/
├── helpers/
│   ├── hook-runner.js          ★ NEW
│   ├── mcp-client.js           ★ NEW
│   └── temp-dir.js             ★ NEW
├── unit/
│   ├── skill-orchestrator.test.js   ★ NEW (+40 TC)
│   ├── permission-manager.test.js   ★ NEW (+25 TC)
│   ├── context-loader.test.js       ★ NEW (+30 TC)
│   ├── paths.test.js                ★ NEW (+20 TC)
│   ├── import-resolver.test.js      ★ NEW (+25 TC)
│   ├── deploy-state-machine.test.js ★ NEW (+20 TC)
│   ├── strategy.test.js             ★ NEW (+10 TC)
│   ├── impact-analyzer.test.js      ★ NEW (+15 TC)
│   ├── invariant-checker.test.js    ★ NEW (+10 TC)
│   ├── ops-metrics.test.js          ★ NEW (+10 TC)
│   ├── scenario-runner.test.js      ★ NEW (+10 TC)
│   ├── cto-logic.test.js            ★ NEW (+15 TC)
│   └── task-queue.test.js           ★ NEW (+10 TC)
├── integration/
│   ├── hook-behavioral-stop.test.js       ★ NEW (+15 TC)
│   ├── hook-behavioral-user-prompt.test.js ★ NEW (+10 TC)
│   ├── hook-behavioral-pre-write.test.js   ★ NEW (+8 TC)
│   ├── hook-behavioral-bash-pre.test.js    ★ NEW (+8 TC)
│   ├── hook-behavioral-session.test.js     ★ NEW (+8 TC)
│   ├── hook-behavioral-task.test.js        ★ NEW (+5 TC)
│   ├── hook-behavioral-compaction.test.js  ★ NEW (+4 TC)
│   ├── mcp-pdca-functional.test.js         ★ NEW (+18 TC)
│   └── mcp-analysis-functional.test.js     ★ NEW (+12 TC)
├── e2e/
│   ├── pdca-lifecycle.test.js        ★ NEW (+20 TC)
│   ├── pdca-status-persistence.test.js ★ NEW (+10 TC)
│   └── pdca-resume.test.js           ★ NEW (+10 TC)
├── security/
│   ├── path-traversal.test.js        ★ NEW (+10 TC)
│   ├── integrity-verification.test.js ★ NEW (+10 TC)
│   └── hook-security.test.js         ★ NEW (+10 TC)
├── performance/
│   ├── mcp-response-perf.test.js     ★ NEW (+10 TC)
│   ├── hook-real-execution.test.js   ★ NEW (+10 TC)
│   └── memory-leak.test.js           ★ NEW (+5 TC)
├── behavioral/                       ★ NEW CATEGORY
│   ├── agent-triggers.test.js        ★ NEW (+20 TC)
│   ├── cto-logic.test.js             ★ NEW (+15 TC)
│   ├── skill-orchestration.test.js   ★ NEW (+20 TC)
│   └── team-coordination.test.js     ★ NEW (+15 TC)
├── contract/                         ★ NEW CATEGORY
│   ├── hook-input-schema.test.js     ★ NEW (+25 TC)
│   ├── hook-output-schema.test.js    ★ NEW (+15 TC)
│   └── mcp-protocol.test.js          ★ NEW (+10 TC)
├── ux/
│   ├── accessibility.test.js         ★ NEW (+10 TC)
│   ├── cjk-rendering.test.js         ★ NEW (+8 TC)
│   └── language-detection-full.test.js ★ NEW (+7 TC)
├── regression/
│   ├── agents-32.test.js             ★ NEW (+5 TC)
│   ├── skills-37.test.js             ★ NEW (+5 TC)
│   ├── hooks-22.test.js              MODIFY (+5 TC)
│   └── agents-effort-32.test.js      ★ NEW (+5 TC)
└── run-all.js                        MODIFY (12 카테고리)

lib/control/
├── scope-limiter.js                  MODIFY (경로 정규화)
├── trust-engine.js                   MODIFY (resetScore fix)
└── checkpoint-manager.js             MODIFY (필드 불일치 fix)

lib/audit/
└── audit-logger.js                   MODIFY (버전 중앙화)
```

### 5.2 Implementation Order

| Session | Phase | Files | TC | Priority |
|---------|-------|-------|-----|----------|
| **S1** | Helpers + Unit gaps | 3 helpers + 13 unit tests | ~243 TC | P0 |
| **S2** | Hook behavioral + Source fixes | 7 integration + 4 source fixes | ~62 TC | P0 |
| **S3** | E2E + Behavioral | 3 e2e + 4 behavioral | ~110 TC | P1 |
| **S4** | Security + Performance | 3 security + 3 performance | ~55 TC | P0/P2 |
| **S5** | UX + MCP + Contract + Regression | 3 ux + 2 mcp + 3 contract + 4 regression | ~80 TC | P1/P2/P3 |
| | **Total** | **~50 신규 파일** | **~550 TC** | |

### 5.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated TC |
|--------|-----------|-------------|:------------:|
| Test Helpers | `module-0` | hook-runner, mcp-client, temp-dir | 0 (infra) |
| Unit Gaps | `module-1` | 13 untested lib modules | 243 |
| Hook Behavioral | `module-2` | 7 hook behavioral integration tests | 62 |
| Source Fixes | `module-3` | 4 security/bug source fixes | 0 (code fix) |
| PDCA E2E | `module-4` | 3 PDCA lifecycle E2E tests | 40 |
| Agent/Skill Behavioral | `module-5` | 4 behavioral test files | 70 |
| Security Tests | `module-6` | 3 security test files | 30 |
| Performance Tests | `module-7` | 3 performance test files | 25 |
| UX Tests | `module-8` | 3 UX test files | 25 |
| MCP Functional | `module-9` | 2 MCP functional test files | 30 |
| Contract Tests | `module-10` | 3 contract test files | 50 |
| Regression Updates | `module-11` | 4 regression update files | 20 |

#### Recommended Session Plan

| Session | Scope | Modules | Turns |
|---------|-------|---------|:-----:|
| Session 1 | `--scope module-0,module-1` | Helpers + Unit gaps | 50-60 |
| Session 2 | `--scope module-2,module-3` | Hook behavioral + Source fixes | 40-50 |
| Session 3 | `--scope module-4,module-5` | E2E + Behavioral | 40-50 |
| Session 4 | `--scope module-6,module-7` | Security + Performance | 30-40 |
| Session 5 | `--scope module-8,module-9,module-10,module-11` | UX + MCP + Contract + Regression | 40-50 |
| Final | Check + Report | 전체 검증 | 20-30 |

---

## 6. Test Execution Strategy

### 6.1 Run Commands

```bash
# 전체 실행 (12 카테고리)
node test/run-all.js

# 카테고리별 실행
node test/run-all.js --unit          # ~1,680 TC
node test/run-all.js --integration   # ~570 TC
node test/run-all.js --e2e           # ~100 TC
node test/run-all.js --security      # ~250 TC
node test/run-all.js --performance   # ~185 TC
node test/run-all.js --regression    # ~536 TC
node test/run-all.js --philosophy    # ~138 TC
node test/run-all.js --ux            # ~185 TC
node test/run-all.js --architecture  # ~100 TC
node test/run-all.js --controllable-ai # ~80 TC
node test/run-all.js --behavioral    # ~70 TC  ★NEW
node test/run-all.js --contract      # ~50 TC  ★NEW

# 개별 파일 실행
node test/unit/skill-orchestrator.test.js
node test/integration/mcp-pdca-functional.test.js
```

### 6.2 Expected Results

| Metric | Before | After | Delta |
|--------|--------|-------|-------|
| Test files | 144 | ~194 | +50 |
| Total TC | ~3,370 | ~3,920 | +550 |
| Categories | 10 | 12 | +2 |
| Coverage | ~45% | ~70% | +25% |
| Critical security issues | 3 | 0 | -3 |
| Known bugs | 2 | 0 | -2 |
| MCP functional coverage | 0% | 100% | +100% |
| Hook behavioral coverage | 0% | ~80% | +80% |
| PDCA transition coverage | 35% | 100% | +65% |

---

## 7. Quality Gates

| Gate | Condition | Action if Fail |
|------|-----------|---------------|
| G1: Unit pass | 모든 unit test 통과 | S2 진행 불가 |
| G2: Security pass | 모든 security test 통과 | 보안 수정 우선 |
| G3: Integration pass | 모든 hook behavioral test 통과 | 원인 분석 후 재시도 |
| G4: E2E pass | PDCA lifecycle 100% 전이 | state machine 수정 |
| G5: Contract pass | 모든 contract test 통과 | CC 호환성 확인 |
| G6: Performance budget | 모든 hook < 50% timeout | 최적화 |
| G7: Final | 전체 suite 통과 | Report 진행 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-04-08 | 10-Agent 분석 기반 초안 작성 | kay kim (CTO Team) |
