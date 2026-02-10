# hooks.json Compatibility Fix Plan

> **Feature**: hooks-json-compatibility-fix
> **Level**: Dynamic (Plugin)
> **Date**: 2026-02-10
> **PDCA Phase**: Plan
> **Team**: CTO Lead (orchestrator), code-analyzer, gap-detector, qa-strategist
> **Issue Reference**: https://github.com/popup-studio-ai/bkit-claude-code/issues/31
> **Status**: Draft

---

## 1. Problem Statement

### 1.1 Issue Summary

bkit v1.5.3 설치 후 `claude /installed` 확인 시 hooks.json 로딩 에러 발생:

```
1 error:
  Failed to load hooks from .../hooks/hooks.json: [
    {
      "origin": "record",
      "code": "invalid_key",
      "issues": [{
        "code": "invalid_union",
        "errors": [[{
          "code": "invalid_value",
          "values": ["PreToolUse","PostToolUse","PostToolUseFailure",
                     "Notification","UserPromptSubmit","SessionStart","SessionEnd"...]
        }]]
      }]
    }
  ]
```

### 1.2 Root Cause Analysis

**핵심 원인: Claude Code 버전별 Hook Event 지원 범위 불일치**

bkit v1.5.3의 hooks.json은 10개 이벤트를 사용하지만, Hook Event는 Claude Code 버전별로 점진적으로 추가되었다:

| Hook Event | 도입 버전 | bkit 사용 | 비고 |
|---|---|---|---|
| SessionStart | v1.0.38 | O | 초기 7개 이벤트 |
| SessionEnd | v1.0.38 | X | |
| PreToolUse | v1.0.38 | O | |
| PostToolUse | v1.0.38 | O | |
| PostToolUseFailure | v1.0.38 | X | |
| UserPromptSubmit | v1.0.38 | O | |
| Notification | v1.0.38 | X | |
| **Stop** | **v2.0.30** | **O** | 8번째 |
| **SubagentStart** | **v2.0.43** | **O** | 9번째 |
| **PermissionRequest** | **v2.0.45** | X | |
| **SubagentStop** | **v2.0.43** | **O** | |
| **PreCompact** | **~v2.0.x** | **O** | |
| Setup | v2.1.10 | X | |
| **TeammateIdle** | **v2.1.33** | **O** | 13번째 |
| **TaskCompleted** | **v2.1.33** | **O** | 14번째 |

**치명적 동작**: Claude Code의 Zod 유효성 검증은 hooks.json 전체에 대해 수행되며, 하나의 미인식 이벤트가 있으면 **전체 hooks.json이 거부**된다. 즉, TeammateIdle만 미지원해도 SessionStart를 포함한 10개 hook 모두 비활성화된다.

### 1.3 Impact Analysis

| 영향 범위 | 상세 |
|---|---|
| 영향받는 사용자 | Claude Code v2.1.33 미만 사용자 전원 |
| 증상 | bkit 모든 hook 비활성화 (plugin 에러 표시) |
| 심각도 | **Critical** - bkit 핵심 기능 완전 마비 |
| PDCA 기능 | SessionStart 초기화 실패 → PDCA 상태 추적 불가 |
| 자동화 기능 | UserPromptSubmit 비활성 → 의도 감지/에이전트 자동 트리거 불가 |
| 안전 기능 | PreToolUse(Bash) 비활성 → 위험 명령어 보호 불가 |
| 팀 기능 | SubagentStart/Stop 비활성 → Agent Teams 상태 추적 불가 |

### 1.4 Background Research

#### 1.4.1 Claude Code 공식 문서 현황

| Source | TeammateIdle | TaskCompleted | 기타 |
|---|---|---|---|
| 공식 Hooks Reference (code.claude.com) | O (14개 중 포함) | O | 최신 상태 |
| 공식 Plugins Reference | O | O | 최신 상태 |
| SchemaStore (json.schemastore.org) | **X (누락)** | **X (누락)** | 13개만 포함 |
| $schema URL (claude-code-hooks.json) | N/A | N/A | **404 Not Found** |
| Community guides (claudefa.st, dev.to) | X | X | 12개만 기술 |

#### 1.4.2 관련 GitHub Issues (anthropics/claude-code)

| Issue | 제목 | 관련성 |
|---|---|---|
| #23545 | Docs missing TeammateIdle and TaskCompleted | CLOSED - 문서 업데이트됨 |
| #24175 | Hooks fire inconsistently between in-process and pane-based teammates | OPEN - TeammateIdle/TaskCompleted은 in-process 모드에서만 동작 |
| #16954 | Hook command dedup ignores env expansion | OPEN - 플러그인 hook 중복 제거 버그 |
| #19170 | Missing SubagentStart input schema in docs | OPEN - SubagentStart 입력 스키마 미문서화 |
| #19220 | Agent Stop hook receives "SubagentStop" instead of "Stop" | OPEN - 이벤트명 불일치 |
| #21460 | PreToolUse hooks not enforced on subagent tool calls | OPEN - 보안 우회 가능 |
| #15926 | PermissionRequest missing from SchemaStore schema | 선례 - 동일 패턴 (스키마 지연) |

#### 1.4.3 hooks.json `$schema` 문제

현재 hooks.json의 `$schema`가 존재하지 않는 URL을 참조:
```json
"$schema": "https://json.schemastore.org/claude-code-hooks.json"  // 404!
```
이는 IDE 유효성 검증에만 영향 (Runtime에는 무영향). 하지만 올바른 참조로 변경하거나 제거해야 함.

---

## 2. Scope & Goals

### 2.1 In Scope

| # | 항목 | Priority | Description |
|---|------|:--------:|-------------|
| S-01 | hooks.json 호환성 수정 | **Critical** | v2.0.30+ 모든 버전에서 로딩 가능하도록 |
| S-02 | TeammateIdle/TaskCompleted 대체 구현 | High | 제거된 hook 기능을 대체 메커니즘으로 |
| S-03 | $schema URL 수정 | Medium | 404 URL → 유효한 참조 또는 제거 |
| S-04 | 최소 버전 문서화 | Medium | README/docs에 권장 버전 명시 |
| S-05 | SessionStart 버전 감지 | Medium | 기능 제약 시 사용자 안내 |
| S-06 | SchemaStore PR 기여 | Low | TeammateIdle/TaskCompleted 추가 요청 |

### 2.2 Out of Scope

| 항목 | 사유 |
|------|------|
| Claude Code 자체 수정 (Zod 유효성 완화) | Anthropic측 결정 사항, issue 제출만 |
| 전체 hook 아키텍처 리팩토링 | v1.6.0 이후 |
| 버전별 hooks.json 자동 생성 | 플러그인 시스템이 지원하지 않음 |

---

## 3. Fix Strategy

### 3.1 Strategy Overview

**3-Layer 호환성 전략**:

```
┌─────────────────────────────────────────────────────┐
│ Layer 1: hooks.json 호환성 보장 (즉시 수정)         │
│   → v2.0.30+ 지원 이벤트만 포함 (8개)               │
│   → TeammateIdle, TaskCompleted 제거                 │
├─────────────────────────────────────────────────────┤
│ Layer 2: 제거된 기능의 대체 구현                     │
│   → TaskCompleted → PostToolUse(TaskUpdate) 감지     │
│   → TeammateIdle → SubagentStop + Stop 활용          │
├─────────────────────────────────────────────────────┤
│ Layer 3: 런타임 버전 감지 + 사용자 안내              │
│   → SessionStart에서 버전/기능 가용성 확인           │
│   → 제한 사항 투명하게 안내                          │
└─────────────────────────────────────────────────────┘
```

### 3.2 Hook Event 분류 및 결정

| Hook Event | 분류 | hooks.json 유지 | 대체 방안 |
|---|---|---|---|
| SessionStart | Core | **유지** | - |
| PreToolUse (Write\|Edit) | Core | **유지** | - |
| PreToolUse (Bash) | Core | **유지** | - |
| PostToolUse (Write) | Core | **유지** | - |
| PostToolUse (Bash) | Core | **유지** | - |
| PostToolUse (Skill) | Core | **유지** | - |
| Stop | Core | **유지** (v2.0.30+) | - |
| UserPromptSubmit | Core | **유지** | - |
| PreCompact | Enhancement | **유지** (~v2.0.x+) | - |
| **TaskCompleted** | Team | **제거** | PostToolUse(TaskUpdate) 감지로 대체 |
| **SubagentStart** | Team | **유지** (v2.0.43+) | - |
| **SubagentStop** | Team | **유지** (v2.0.43+) | - |
| **TeammateIdle** | Team | **제거** | SubagentStop + Stop에서 idle 감지로 대체 |

**결정 근거**:
- `TaskCompleted`와 `TeammateIdle`은 **v2.1.33에서 추가된 가장 최신 이벤트**
- 두 이벤트 모두 Agent Teams 전용 기능 (팀 미사용 시 무관)
- Agent Teams 자체가 아직 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 필요 (실험적)
- in-process 모드에서만 동작 (pane-based 미지원, Issue #24175)
- 기존 SubagentStop + Stop hooks로 핵심 기능 대체 가능

### 3.3 대체 구현 상세

#### 3.3.1 TaskCompleted 대체

**현재 동작** (pdca-task-completed.js):
- Task 완료 시 PDCA 단계 자동 전진
- [Plan], [Design], [Do], [Check], [Act], [Report] 태그 감지
- Team 진행률 업데이트

**대체 방안**: PostToolUse(TaskUpdate) 감지
```
PostToolUse matcher에 "TaskUpdate" 추가
→ unified-write-post.js에서 TaskUpdate 감지 시
  → task status가 "completed"이면 pdca-task-completed 로직 실행
```

**구현**:
1. PostToolUse에 새 matcher 추가: `"matcher": "TaskUpdate"`
2. 새 handler: `scripts/task-completed-post.js`
3. 기존 `pdca-task-completed.js`의 로직을 PostToolUse 컨텍스트에 맞게 리팩토링
4. PostToolUse input에서 task subject/status 추출하여 PDCA 단계 감지

**대체 정확도**: ~95% (PostToolUse에서 TaskUpdate 호출 정보 접근 가능)

#### 3.3.2 TeammateIdle 대체

**현재 동작** (team-idle-handler.js):
- Teammate idle 시 대기 중인 작업 할당
- 팀 모드 상태 업데이트

**대체 방안**: SubagentStop + Stop에서 idle 상태 감지
```
SubagentStop handler에서:
→ teammate 완료 후 다음 작업 확인 로직 추가
→ 기존 subagent-stop-handler.js 확장

Stop handler에서:
→ Team 모드 활성 시 idle 상태 업데이트
→ 기존 unified-stop.js의 팀 에이전트 핸들링 확장
```

**구현**:
1. `subagent-stop-handler.js`에 idle 감지 + 작업 배분 로직 추가
2. `unified-stop.js`의 팀 에이전트 핸들러에 idle 상태 업데이트 추가
3. agent-state.json 업데이트 로직 통합

**대체 정확도**: ~85% (SubagentStop이 모든 idle 케이스를 커버하지 못할 수 있으나, 핵심 시나리오는 커버)

---

## 4. Implementation Plan

### Unit 1: hooks.json 호환성 수정 (S-01) - Critical

**Target File**: `hooks/hooks.json`

**변경 사항**:
1. `TeammateIdle` 이벤트 블록 제거 (line 138-148)
2. `TaskCompleted` 이벤트 블록 제거 (line 105-115)
3. `$schema` URL 수정 또는 제거 (S-03)
4. 결과: 10개 → 8개 이벤트

**변경 후 hooks.json 이벤트 목록** (8개):
```
SessionStart, PreToolUse(Write|Edit), PreToolUse(Bash),
PostToolUse(Write), PostToolUse(Bash), PostToolUse(Skill),
Stop, UserPromptSubmit, PreCompact,
SubagentStart, SubagentStop
```

참고: matcher별로 분리하면 11개 handler이지만, 이벤트 종류는 8개 (PreToolUse 2개, PostToolUse 3개는 같은 이벤트)

**$schema 수정**:
```json
// Before
"$schema": "https://json.schemastore.org/claude-code-hooks.json"

// After (Option A - 유효한 URL로 변경)
"$schema": "https://json.schemastore.org/claude-code-settings.json"

// After (Option B - 제거, 권장)
// $schema 라인 삭제 (Claude Code Runtime에 무영향, 404 해소)
```

**권장: Option B** - $schema를 제거. 이유:
- claude-code-hooks.json은 존재하지 않는 URL (404)
- claude-code-settings.json도 TeammateIdle/TaskCompleted 누락 (SchemaStore 지연)
- Claude Code Runtime은 $schema를 무시 (Zod 내부 스키마 사용)
- IDE 유효성 검증이 필요하면 사용자가 직접 추가 가능

### Unit 2: TaskCompleted 대체 구현 (S-02a)

**변경 파일**:
1. `hooks/hooks.json` - PostToolUse에 TaskUpdate matcher 추가
2. `scripts/task-completed-post.js` (신규) - PostToolUse 기반 TaskCompleted 대체
3. `scripts/pdca-task-completed.js` - 기존 로직을 공통 모듈로 리팩토링

**hooks.json 변경**:
```json
// PostToolUse 섹션에 추가
{
  "matcher": "TaskUpdate",
  "hooks": [
    {
      "type": "command",
      "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/task-completed-post.js",
      "timeout": 5000
    }
  ]
}
```

**task-completed-post.js 로직**:
```
1. stdin에서 PostToolUse input 파싱
2. tool_input에서 status === "completed" 확인
3. task subject에서 PDCA 태그 감지 ([Plan], [Design], etc.)
4. 기존 pdca-task-completed.js의 core 로직 호출
5. PDCA 자동 전진 + team 진행률 업데이트
```

### Unit 3: TeammateIdle 대체 구현 (S-02b)

**변경 파일**:
1. `scripts/subagent-stop-handler.js` - idle 감지 + 작업 배분 로직 추가
2. `scripts/unified-stop.js` - 팀 에이전트 idle 상태 업데이트 추가

**subagent-stop-handler.js 확장**:
```
기존 로직 후에 추가:
1. Team 모드 확인 (isTeamModeAvailable)
2. 완료된 teammate의 다음 작업 확인
3. 대기 중인 작업이 있으면 할당 정보 반환
4. agent-state.json에 idle 상태 기록
```

**unified-stop.js 확장**:
```
팀 에이전트 핸들러에 추가:
1. 현재 에이전트가 팀 멤버인지 확인
2. 팀 멤버이면 idle 상태로 전환
3. 다음 작업 큐 확인
```

### Unit 4: 최소 버전 문서화 (S-04)

**변경 파일**:
1. `README.md` (또는 plugin 설명) - 최소 버전 권장 추가
2. `commands/bkit.md` - 버전 호환성 섹션 추가

**추가 내용**:
```markdown
## Compatibility

| Claude Code Version | bkit Support | Notes |
|---|---|---|
| v2.1.33+ | Full | 모든 기능 지원 (권장) |
| v2.0.43 ~ v2.1.32 | Core + Team | 핵심 기능 + 팀 기능 (일부 제한) |
| v2.0.30 ~ v2.0.42 | Core Only | 핵심 기능만 (팀 기능 미지원) |
| < v2.0.30 | Not Supported | Stop hook 미지원 |
```

### Unit 5: SessionStart 버전 감지 (S-05)

**변경 파일**: `hooks/session-start.js`

**추가 로직**:
```
1. Claude Code 버전 감지 시도:
   - process.env에서 CLAUDE_CODE_VERSION 확인 (있는 경우)
   - 또는 `claude --version` 출력 파싱
   - 또는 기능 가용성으로 간접 감지
2. 버전이 감지되면:
   - v2.1.33 미만: "팀 기능 일부 제한" 안내
   - v2.0.43 미만: "에이전트 팀 기능 미지원" 안내
3. 안내 메시지를 additionalContext에 포함
```

**주의**: 버전 감지가 실패해도 (환경 변수 미제공 등) 정상 동작에 영향 없도록 방어적 코딩.

### Unit 6: Claude Code GitHub Issue 제출 (S-06)

**제출할 이슈 2건**:

**Issue A: hooks.json 유효성 검증 완화 요청**
```
Title: [Feature] Lenient hooks.json validation - warn on unknown events instead of reject

Body:
- 현재: 미인식 hook event가 하나라도 있으면 전체 hooks.json 거부
- 제안: 미인식 event는 경고(warning)로 처리하고, 인식 가능한 event는 정상 로딩
- 이유: 플러그인이 최신 event를 사용하면 구버전에서 전체 hook 비활성화
- 영향: 플러그인 생태계의 하위 호환성 크게 개선
```

**Issue B: SchemaStore claude-code-hooks.json 생성 또는 settings 스키마 업데이트**
```
Title: [Docs] SchemaStore schema missing TeammateIdle and TaskCompleted events

Body:
- claude-code-hooks.json URL 404 (json.schemastore.org)
- claude-code-settings.json에 TeammateIdle, TaskCompleted 누락
- 선례: Issue #15926 (PermissionRequest 누락 → 수정됨)
```

---

## 5. File Change Summary

### 5.1 수정 파일 (5개)

| # | File | Change Type | Description |
|---|------|:-----------:|-------------|
| 1 | `hooks/hooks.json` | **Edit** | TeammateIdle/TaskCompleted 제거, PostToolUse(TaskUpdate) 추가, $schema 제거 |
| 2 | `scripts/subagent-stop-handler.js` | **Edit** | idle 감지 + 작업 배분 로직 추가 |
| 3 | `scripts/unified-stop.js` | **Edit** | 팀 에이전트 idle 상태 업데이트 추가 |
| 4 | `hooks/session-start.js` | **Edit** | 버전 감지 + 호환성 안내 추가 |
| 5 | `commands/bkit.md` | **Edit** | 버전 호환성 섹션 추가 |

### 5.2 신규 파일 (1개)

| # | File | Description |
|---|------|-------------|
| 6 | `scripts/task-completed-post.js` | PostToolUse 기반 TaskCompleted 대체 핸들러 |

### 5.3 삭제 파일 (0개)

기존 `scripts/pdca-task-completed.js`와 `scripts/team-idle-handler.js`는 삭제하지 않음.
→ lib/common.js 등에서 참조할 수 있으므로 유지하되, hooks.json에서만 연결 해제.
→ 향후 Claude Code v2.1.33+가 보편화되면 재연결 가능.

### 5.4 변경 영향 범위

```
hooks/hooks.json (Entry Point)
├── [제거] TaskCompleted → scripts/pdca-task-completed.js
├── [제거] TeammateIdle → scripts/team-idle-handler.js
├── [추가] PostToolUse(TaskUpdate) → scripts/task-completed-post.js (NEW)
├── [수정] SubagentStop → scripts/subagent-stop-handler.js (+idle logic)
└── [수정] Stop → scripts/unified-stop.js (+team idle update)
```

---

## 6. Test Plan

### 6.1 Core Compatibility Tests

| TC ID | Test Case | Expected | Priority |
|---|---|---|---|
| COMPAT-01 | hooks.json에 TeammateIdle 키 없음 | PASS | Critical |
| COMPAT-02 | hooks.json에 TaskCompleted 키 없음 | PASS | Critical |
| COMPAT-03 | hooks.json에 $schema 라인 없음 | PASS | Critical |
| COMPAT-04 | hooks.json 이벤트 수 = 8종 (matcher별 11 handler) | 8 events | Critical |
| COMPAT-05 | hooks.json JSON 유효성 검증 통과 | valid JSON | Critical |
| COMPAT-06 | hooks.json의 모든 이벤트가 v2.0.30+ 지원 목록에 포함 | PASS | Critical |
| COMPAT-07 | 모든 hook script 경로가 유효한 파일을 참조 | PASS | Critical |

### 6.2 Alternative Implementation Tests

| TC ID | Test Case | Expected | Priority |
|---|---|---|---|
| ALT-01 | PostToolUse에 TaskUpdate matcher 존재 | PASS | High |
| ALT-02 | task-completed-post.js 파일 존재 | PASS | High |
| ALT-03 | task-completed-post.js가 PDCA 태그 감지 로직 포함 | PASS | High |
| ALT-04 | subagent-stop-handler.js에 idle 감지 로직 포함 | PASS | High |
| ALT-05 | unified-stop.js에 팀 idle 업데이트 로직 포함 | PASS | High |
| ALT-06 | pdca-task-completed.js 파일 유지 (삭제되지 않음) | PASS | Medium |
| ALT-07 | team-idle-handler.js 파일 유지 (삭제되지 않음) | PASS | Medium |

### 6.3 Version Detection Tests

| TC ID | Test Case | Expected | Priority |
|---|---|---|---|
| VER-01 | session-start.js에 버전 감지 로직 존재 | PASS | Medium |
| VER-02 | 버전 감지 실패 시 정상 동작 (방어적 코딩) | PASS | Medium |
| VER-03 | commands/bkit.md에 호환성 테이블 포함 | PASS | Medium |

### 6.4 Regression Tests

| TC ID | Test Case | Expected | Priority |
|---|---|---|---|
| REG-01 | SessionStart hook 정상 실행 | PASS | Critical |
| REG-02 | PreToolUse(Write\|Edit) hook 정상 실행 | PASS | High |
| REG-03 | PreToolUse(Bash) hook 정상 실행 | PASS | High |
| REG-04 | PostToolUse(Write) hook 정상 실행 | PASS | High |
| REG-05 | PostToolUse(Bash) hook 정상 실행 | PASS | High |
| REG-06 | PostToolUse(Skill) hook 정상 실행 | PASS | High |
| REG-07 | Stop hook 정상 실행 | PASS | High |
| REG-08 | UserPromptSubmit hook 정상 실행 | PASS | High |
| REG-09 | PreCompact hook 정상 실행 | PASS | Medium |
| REG-10 | SubagentStart hook 정상 실행 | PASS | Medium |
| REG-11 | SubagentStop hook 정상 실행 | PASS | Medium |
| REG-12 | common.js exports >= 180 | PASS | High |
| REG-13 | 26 skills 존재 | PASS | Medium |
| REG-14 | 16 agents 존재 | PASS | Medium |

### 6.5 TC Summary

| Category | Count |
|---|---|
| Core Compatibility | 7 |
| Alternative Implementation | 7 |
| Version Detection | 3 |
| Regression | 14 |
| **Total** | **31** |
| 목표 Pass Rate | >= 100% |

---

## 7. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|---|---|---|---|
| PostToolUse(TaskUpdate)가 task 정보를 충분히 제공하지 않을 수 있음 | Medium | Medium | PostToolUse input 구조를 사전 검증, 부족하면 agent-state.json 직접 읽기 |
| SubagentStop에서 idle 상태를 모든 케이스에서 감지 못할 수 있음 | Medium | Medium | Stop hook에서 보조 감지, 85% 이상 커버리지 목표 |
| PreCompact가 일부 버전에서 미지원될 수 있음 (~v2.0.x 도입, 정확한 버전 불명) | Low | Low | PreCompact는 NICE-TO-HAVE, 없어도 핵심 기능 무영향 |
| $schema 제거 시 IDE 유효성 검증 상실 | Low | Low | 사용자 IDE 설정으로 대체 가능, Claude Code Runtime 무영향 |
| Claude Code가 PostToolUse matcher로 "TaskUpdate"를 지원하지 않을 수 있음 | High | Low | "TaskUpdate"는 내부 도구명이므로 매칭 가능해야 하나, 사전 검증 필수 |
| 기존 pdca-task-completed.js, team-idle-handler.js를 참조하는 코드가 있을 수 있음 | Medium | Low | common.js, lib/ 전체 grep으로 참조 확인 |

---

## 8. Dependencies & Execution Order

```
Unit 1 (hooks.json 수정)       ← 최우선, 독립 실행 가능
  ↓
Unit 2 (TaskCompleted 대체)    ← Unit 1 완료 후 (hooks.json에 추가)
Unit 3 (TeammateIdle 대체)     ← Unit 1과 병렬 가능 (기존 파일 수정)
  ↓
Unit 4 (버전 문서화)           ← 독립, 아무 때나
Unit 5 (SessionStart 버전감지) ← 독립, 아무 때나
  ↓
Unit 6 (GitHub Issue 제출)     ← 모든 수정 완료 후
```

**병렬 실행 가능**:
- Phase 1: Unit 1 + Unit 3 + Unit 4 (병렬)
- Phase 2: Unit 2 + Unit 5 (Phase 1 완료 후 병렬)
- Phase 3: Unit 6 (최종)

---

## 9. Success Criteria

### 9.1 Definition of Done

- [ ] hooks.json이 Claude Code v2.0.30+에서 에러 없이 로딩됨
- [ ] 제거된 TeammateIdle/TaskCompleted 기능이 대체 구현으로 동작함
- [ ] 기존 8개 hook의 회귀 테스트 통과
- [ ] 31개 TC 전체 PASS
- [ ] GitHub Issue #31에 해결 방안 답변 게시

### 9.2 Quality Criteria

- [ ] hooks.json 이벤트가 모두 v2.0.30+ 지원 목록에 포함
- [ ] 대체 구현의 기능 커버리지 >= 85%
- [ ] 방어적 코딩 (버전 감지 실패 시에도 정상 동작)
- [ ] 기존 코드의 불필요한 삭제 없음 (향후 복원 가능)

---

## 10. Future Considerations (v1.6.0+)

| 항목 | 조건 | 작업 |
|---|---|---|
| TeammateIdle 복원 | Claude Code v2.1.33+가 주류 (90%+) | hooks.json에 재추가 |
| TaskCompleted 복원 | Claude Code v2.1.33+가 주류 (90%+) | hooks.json에 재추가, PostToolUse(TaskUpdate) 제거 |
| Zod 유효성 완화 | Claude Code에서 수용 시 | 모든 이벤트 즉시 복원 가능 |
| 동적 hooks.json | 플러그인 시스템 지원 시 | 버전별 자동 생성 |
| hooks.json 분할 | 플러그인이 다중 hooks.json 지원 시 | core.hooks.json + team.hooks.json |

---

## 11. CTO Team Assignment

| Role | Agent | Responsibility |
|---|---|---|
| CTO Lead | cto-lead | 전체 오케스트레이션, 품질 게이트 관리 |
| Code Analyzer | code-analyzer | 기존 hook 참조 분석, 영향 범위 파악 |
| Gap Detector | gap-detector | Design vs Implementation 일치율 검증 |
| QA Strategist | qa-strategist | 31개 TC 설계 및 실행 관리 |
| Frontend Architect | frontend-architect | hooks.json 구조 설계, 대체 구현 리뷰 |

---

## Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 0.1 | 2026-02-10 | Initial plan - Issue #31 analysis, 6 units, 31 TC | CTO Lead (Claude Opus 4.6) |
