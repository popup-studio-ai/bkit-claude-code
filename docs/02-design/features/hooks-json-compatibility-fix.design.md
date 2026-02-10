# hooks.json Compatibility Fix Design Document

> **Summary**: hooks.json 유효성 검증 에러 수정 - Claude Code 버전 호환성 보장
>
> **Project**: bkit Vibecoding Kit
> **Version**: 1.5.3 (hotfix)
> **Author**: CTO Lead (Claude Opus 4.6)
> **Date**: 2026-02-10
> **Status**: Final
> **Planning Doc**: [hooks-json-compatibility-fix.plan.md](../01-plan/features/hooks-json-compatibility-fix.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. hooks.json이 Claude Code v2.0.30+ 모든 버전에서 에러 없이 로딩되도록 수정
2. 제거되는 hook 이벤트(TeammateIdle, TaskCompleted)의 기능을 기존 hook으로 대체
3. bkit 3대 철학 준수: Automation First, No Guessing, Docs = Code

### 1.2 Design Principles

- **최소 변경 원칙**: 문제의 원인만 정확히 수정, 불필요한 리팩토링 없음
- **하위 호환성**: 구버전 Claude Code에서도 핵심 기능 동작 보장
- **방어적 코딩**: 모든 외부 의존성 접근은 try/catch로 보호
- **무삭제 정책**: 기존 스크립트 파일은 삭제하지 않음 (향후 복원 가능)

### 1.3 Philosophy Compliance

| 철학 | 준수 방안 |
|------|-----------|
| **Automation First** | PostToolUse(TaskUpdate) 대체로 PDCA 자동 전진 기능 유지 |
| **No Guessing** | Claude Code 공식 문서 + GitHub issue 기반 분석, 추측 없음 |
| **Docs = Code** | 이 설계서 대로 구현, gap-detector로 100% 일치 검증 |

---

## 2. Architecture

### 2.1 Before (현재 - 에러 발생)

```
hooks/hooks.json (10 event types, 13 handlers)
├── SessionStart → session-start.js
├── PreToolUse(Write|Edit) → pre-write.js
├── PreToolUse(Bash) → unified-bash-pre.js
├── PostToolUse(Write) → unified-write-post.js
├── PostToolUse(Bash) → unified-bash-post.js
├── PostToolUse(Skill) → skill-post.js
├── Stop → unified-stop.js
├── UserPromptSubmit → user-prompt-handler.js
├── PreCompact → context-compaction.js
├── TaskCompleted → pdca-task-completed.js          ← v2.1.33 전용
├── SubagentStart → subagent-start-handler.js
├── SubagentStop → subagent-stop-handler.js
└── TeammateIdle → team-idle-handler.js             ← v2.1.33 전용
```

### 2.2 After (수정 후 - 호환성 보장)

```
hooks/hooks.json (8 event types, 12 handlers)
├── SessionStart → session-start.js
├── PreToolUse(Write|Edit) → pre-write.js
├── PreToolUse(Bash) → unified-bash-pre.js
├── PostToolUse(Write) → unified-write-post.js
├── PostToolUse(Bash) → unified-bash-post.js
├── PostToolUse(Skill) → skill-post.js
├── PostToolUse(TaskUpdate) → task-completed-post.js  ← NEW (대체)
├── Stop → unified-stop.js                            ← MODIFIED (+idle)
├── UserPromptSubmit → user-prompt-handler.js
├── PreCompact → context-compaction.js
├── SubagentStart → subagent-start-handler.js
└── SubagentStop → subagent-stop-handler.js            ← MODIFIED (+idle)

보존된 파일 (hooks.json에서 연결 해제, 파일은 유지):
├── scripts/pdca-task-completed.js    (core logic 재사용)
└── scripts/team-idle-handler.js      (향후 복원 대비)
```

### 2.3 Data Flow: TaskCompleted 대체

```
Before:
  TaskUpdate tool 호출 → Claude Code → TaskCompleted event
    → pdca-task-completed.js → PDCA auto-advance

After:
  TaskUpdate tool 호출 → Claude Code → PostToolUse event (matcher: TaskUpdate)
    → task-completed-post.js → PDCA auto-advance (동일 로직)
```

### 2.4 Data Flow: TeammateIdle 대체

```
Before:
  Teammate idle → Claude Code → TeammateIdle event
    → team-idle-handler.js → task assignment

After (2경로):
  경로 1: SubagentStop event → subagent-stop-handler.js
    → idle 감지 + task assignment 로직 추가

  경로 2: Stop event → unified-stop.js
    → 팀 에이전트 idle 상태 업데이트
```

---

## 3. Detailed Design

### 3.1 hooks.json 변경 (Unit 1)

**제거 항목**:
```json
// 삭제: line 2 ($schema - 404 URL)
"$schema": "https://json.schemastore.org/claude-code-hooks.json",

// 삭제: lines 105-115 (TaskCompleted 블록)
"TaskCompleted": [{ ... }],

// 삭제: lines 138-148 (TeammateIdle 블록)
"TeammateIdle": [{ ... }]
```

**추가 항목**:
```json
// PostToolUse 섹션에 TaskUpdate matcher 추가
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

**최종 hooks.json 구조**:
```json
{
  "description": "bkit Vibecoding Kit v1.5.3 - Claude Code",
  "hooks": {
    "SessionStart": [1 handler],
    "PreToolUse": [2 handlers - Write|Edit, Bash],
    "PostToolUse": [4 handlers - Write, Bash, Skill, TaskUpdate],
    "Stop": [1 handler],
    "UserPromptSubmit": [1 handler],
    "PreCompact": [1 handler],
    "SubagentStart": [1 handler],
    "SubagentStop": [1 handler]
  }
}
```

### 3.2 task-completed-post.js (Unit 2) - 신규 파일

**위치**: `scripts/task-completed-post.js`
**역할**: PostToolUse(TaskUpdate)에서 TaskCompleted 기능 대체

**Input**: PostToolUse의 stdin JSON
```json
{
  "hook_event_name": "PostToolUse",
  "tool_name": "TaskUpdate",
  "tool_input": {
    "taskId": "123",
    "status": "completed",
    "subject": "[Design] hooks-json-compatibility-fix"
  },
  "tool_output": "..."
}
```

**Logic**:
```
1. stdin 파싱 (PostToolUse input 형식)
2. tool_input.status === "completed" 확인
   → "completed"가 아니면 즉시 return (allow)
3. task subject에서 PDCA 태그 감지 ([Plan], [Design], etc.)
   → pdca-task-completed.js의 PDCA_TASK_PATTERNS 재사용
4. feature name 추출
5. shouldAutoAdvance() 확인
6. 자동 전진 시 autoAdvancePdcaPhase() 호출
7. Team Mode 활성 시 team assignment 생성
8. State writer: 진행률 업데이트
9. 결과 JSON 출력
```

**핵심 코드 구조**:
```javascript
#!/usr/bin/env node
/**
 * task-completed-post.js - PostToolUse(TaskUpdate) Handler (v1.5.3 hotfix)
 *
 * TaskCompleted hook 대체:
 * PostToolUse에서 TaskUpdate 도구 호출을 감지하여
 * PDCA 태그가 있는 task가 completed 상태로 변경되면
 * 기존 pdca-task-completed.js와 동일한 PDCA 자동 전진 로직 실행.
 */

const {
  readStdinSync, debugLog, outputAllow,
  getPdcaStatusFull, autoAdvancePdcaPhase,
  shouldAutoAdvance, getAutomationLevel,
} = require('../lib/common.js');

// pdca-task-completed.js의 PDCA_TASK_PATTERNS 재사용
const PDCA_TASK_PATTERNS = {
  plan:   /\[Plan\]\s+(.+)/,
  design: /\[Design\]\s+(.+)/,
  do:     /\[Do\]\s+(.+)/,
  check:  /\[Check\]\s+(.+)/,
  act:    /\[Act(?:-\d+)?\]\s+(.+)/,
  report: /\[Report\]\s+(.+)/,
};

function main() {
  // 1. PostToolUse input 파싱
  // 2. status === "completed" 확인
  // 3. PDCA 태그 감지
  // 4. 기존 pdca-task-completed.js 로직 실행
}
```

### 3.3 subagent-stop-handler.js 변경 (Unit 3a)

**추가 로직** (기존 코드 이후에 삽입):

```javascript
// === TeammateIdle 대체: idle 감지 + 작업 배분 ===
// SubagentStop 후 teammate가 idle 상태가 될 수 있으므로
// handleTeammateIdle을 호출하여 다음 작업 할당 시도

if (teamModule.isTeamModeAvailable()) {
  try {
    // idle 상태 업데이트
    teamModule.updateTeammateStatus(agentName, 'idle', null);

    // 다음 작업 확인 및 할당
    const pdcaStatus = getPdcaStatusFull();
    const idleResult = teamModule.handleTeammateIdle(agentName, pdcaStatus);

    if (idleResult && idleResult.nextTask) {
      response.hookSpecificOutput.nextTask = idleResult.nextTask;
      response.hookSpecificOutput.additionalContext =
        `\n## Next Task Available\n` +
        `Assigned: ${idleResult.nextTask.subject}\n`;
    }
  } catch (e) {
    debugLog('SubagentStop', 'Idle handling failed (non-fatal)', { error: e.message });
  }
}
```

**삽입 위치**: 기존 진행률 업데이트 (line 57-66) 이후, response 생성 (line 68) 이전

### 3.4 unified-stop.js 변경 (Unit 3b)

**추가 로직** (fallback 블록 확장):

기존 fallback 블록 (line 215-226)을 확장하여 팀 에이전트 idle 상태 업데이트:

```javascript
// Fallback: agent state cleanup + idle status update (v1.5.3 hotfix)
if (!handled) {
  try {
    const teamModule = require('../lib/team');
    const state = teamModule.readAgentState ? teamModule.readAgentState() : null;
    if (state && state.enabled) {
      teamModule.cleanupAgentState();

      // TeammateIdle 대체: Stop 시 idle 상태로 전환
      if (teamModule.isTeamModeAvailable()) {
        const agentName = detectActiveAgent(hookContext) || 'unknown';
        try {
          teamModule.updateTeammateStatus(agentName, 'idle', null);
        } catch (e) {
          // Non-fatal
        }
      }

      debugLog('UnifiedStop', 'Fallback agent state cleanup + idle update');
    }
  } catch (e) {
    // Silent
  }
}
```

### 3.5 session-start.js 변경 (Unit 5)

**추가 위치**: 기존 초기화 로직 내, Team Mode 감지 섹션 근처

```javascript
// v1.5.3 hotfix: 호환성 안내
// TeammateIdle/TaskCompleted는 PostToolUse(TaskUpdate) + SubagentStop으로 대체됨
// Claude Code v2.1.33+ 사용자는 추가 기능 없이 동일 경험 제공
```

**참고**: session-start.js의 실제 변경은 최소화. 주석 추가 수준.

---

## 4. File Changes Summary

### 4.1 수정 파일 상세

| # | File | Lines Changed | Change Description |
|---|------|:---:|---|
| 1 | `hooks/hooks.json` | ~30줄 | $schema 제거, TaskCompleted/TeammateIdle 제거, PostToolUse(TaskUpdate) 추가 |
| 2 | `scripts/subagent-stop-handler.js` | ~20줄 추가 | idle 감지 + 작업 배분 로직 |
| 3 | `scripts/unified-stop.js` | ~10줄 추가 | 팀 에이전트 idle 상태 업데이트 |

### 4.2 신규 파일 상세

| # | File | Lines | Description |
|---|------|:---:|---|
| 4 | `scripts/task-completed-post.js` | ~120줄 | PostToolUse(TaskUpdate) 기반 PDCA 자동 전진 |

### 4.3 미변경 파일 (보존)

| File | Status | Reason |
|---|---|---|
| `scripts/pdca-task-completed.js` | 유지 (연결 해제) | core 로직 참조, 향후 복원 |
| `scripts/team-idle-handler.js` | 유지 (연결 해제) | 향후 복원 대비 |
| `hooks/session-start.js` | 미변경 | 주석만 추가할 수 있으나 최소 변경 원칙 |

---

## 5. Implementation Order

```
Step 1: hooks/hooks.json 수정 (핵심 수정)
  → $schema 제거
  → TaskCompleted 블록 제거
  → TeammateIdle 블록 제거
  → PostToolUse에 TaskUpdate matcher 추가

Step 2: scripts/task-completed-post.js 생성 (대체 구현)
  → pdca-task-completed.js 기반으로 PostToolUse용 재구현
  → PostToolUse input 형식에 맞게 파싱 로직 변경

Step 3: scripts/subagent-stop-handler.js 수정 (idle 대체)
  → idle 감지 + handleTeammateIdle 호출 추가
  → getPdcaStatusFull import 추가

Step 4: scripts/unified-stop.js 수정 (idle 보조)
  → fallback 블록에 idle 상태 업데이트 추가
```

---

## 6. Test Plan

### 6.1 Compatibility Tests (COMPAT-01~07)

| TC ID | Verification | Method |
|---|---|---|
| COMPAT-01 | hooks.json에 "TeammateIdle" 문자열 없음 | grep |
| COMPAT-02 | hooks.json에 "TaskCompleted" 문자열 없음 | grep |
| COMPAT-03 | hooks.json에 "$schema" 문자열 없음 | grep |
| COMPAT-04 | hooks.json 이벤트 키 = 8종 | JSON parse + Object.keys |
| COMPAT-05 | hooks.json JSON 유효성 | JSON.parse 성공 |
| COMPAT-06 | 모든 이벤트가 v2.0.30+ 지원 목록에 포함 | whitelist 검증 |
| COMPAT-07 | 모든 hook script 경로 파일 존재 | fs.existsSync |

### 6.2 Alternative Implementation Tests (ALT-01~07)

| TC ID | Verification | Method |
|---|---|---|
| ALT-01 | PostToolUse에 "TaskUpdate" matcher 존재 | JSON 검증 |
| ALT-02 | task-completed-post.js 파일 존재 | fs.existsSync |
| ALT-03 | task-completed-post.js에 PDCA_TASK_PATTERNS 포함 | grep |
| ALT-04 | subagent-stop-handler.js에 handleTeammateIdle 호출 포함 | grep |
| ALT-05 | unified-stop.js에 updateTeammateStatus 호출 포함 | grep |
| ALT-06 | pdca-task-completed.js 파일 존재 (삭제되지 않음) | fs.existsSync |
| ALT-07 | team-idle-handler.js 파일 존재 (삭제되지 않음) | fs.existsSync |

### 6.3 Regression Tests (REG-01~14)

| TC ID | Verification | Method |
|---|---|---|
| REG-01 | SessionStart handler 구문 검증 | node -c |
| REG-02~06 | PreToolUse/PostToolUse handlers 구문 검증 | node -c |
| REG-07 | Stop handler 구문 검증 | node -c |
| REG-08 | UserPromptSubmit handler 구문 검증 | node -c |
| REG-09 | PreCompact handler 구문 검증 | node -c |
| REG-10 | SubagentStart handler 구문 검증 | node -c |
| REG-11 | SubagentStop handler 구문 검증 (수정 후) | node -c |
| REG-12 | common.js exports >= 180 | require + Object.keys |
| REG-13 | 26 skills 존재 | glob count |
| REG-14 | 16 agents 존재 | glob count |

### 6.4 Summary

| Category | Count | Target |
|---|---|---|
| Compatibility | 7 | 100% |
| Alternative | 7 | 100% |
| Regression | 14 | 100% |
| **Total** | **28** | **100%** |

---

## Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-02-10 | Final design - 4 files, 28 TC | CTO Lead (Claude Opus 4.6) |
