# Claude Code Hooks Lifecycle Analysis

> **Analysis Type**: Investigation Analysis (Hooks Lifecycle + Dead Code Detection)
>
> **Project**: bkit Vibecoding Kit
> **Version**: 1.5.9
> **Analyst**: Claude Opus 4.6 (manual investigation)
> **Date**: 2026-03-04
> **Scope**: Claude Code Hook Events Lifecycle + bkit hooks.json Audit

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

1. **InstructionsLoaded** 이벤트의 정체 파악 — CC v2.1.66에서 추가된 것으로 기록되었으나 사실 여부 검증
2. Claude Code 공식 Hook Events의 완전한 라이프사이클 정리 (17개 이벤트)
3. bkit hooks.json 등록 이벤트 감사 — 실제 활성 vs Dead Code 식별
4. v2.1.64~v2.1.66 임팩트 분석 문서의 정확성 검증

### 1.2 Investigation Sources

| Source | Method | Result |
|--------|--------|--------|
| Claude Code 공식 Hooks Reference | WebFetch (code.claude.com/docs/en/hooks) | 17 events, InstructionsLoaded 없음 |
| CC CHANGELOG (GitHub) | WebFetch (v2.1.63~v2.1.68) | v2.1.64/v2.1.65 SKIPPED, v2.1.66 로그 축소만 |
| bkit hooks.json | 코드 직접 확인 | 11 events 등록, 1 dead |
| scripts/instructions-loaded-handler.js | 코드 직접 확인 | 92줄, 실행 불가(dead code) |
| bkit MEMORY.md | 기존 기록 확인 | v2.1.55 기준 17 events 기록 |

---

## 2. Critical Finding: InstructionsLoaded는 존재하지 않는 이벤트

### 2.1 결론

**InstructionsLoaded는 Claude Code의 공식 Hook Event가 아니다.**

- CC v2.1.64는 **SKIPPED 릴리스** (npm 미게시, CHANGELOG 없음)
- CC v2.1.65도 **SKIPPED 릴리스**
- CC v2.1.66의 유일한 변경: "Reduced spurious error logging"
- 공식 Hooks Reference에 InstructionsLoaded 미등재
- **bkit v1.5.9의 InstructionsLoaded 관련 코드는 전부 Dead Code**

### 2.2 Root Cause

`docs/01-plan/features/claude-code-v2166-enhancement.plan.md` Section 1.2에서:

> "CC v2.1.64: 21 Features + 22 Bug Fixes (CHANGELOG 의도적 삭제)"

이 정보는 **환각(hallucination) 기반**이다. CC v2.1.64는 게시된 적 없으며, 21개 기능이 추가된 사실도 없다. 이 잘못된 정보를 바탕으로 ENH-60(InstructionsLoaded hook handler)이 계획되고 구현되었다.

### 2.3 영향 범위

| 항목 | 파일/위치 | 영향 |
|------|-----------|------|
| Handler 스크립트 | `scripts/instructions-loaded-handler.js` (92줄) | Dead Code — 실행 안됨 |
| hooks.json 등록 | `hooks/hooks.json` lines 149-159 | 무시됨 — CC가 알 수 없는 이벤트 무시 |
| session-start.js 안내문 | `hooks/session-start.js` lines 718-729 | 거짓 정보 출력 |
| Plan 문서 ENH-60 | `docs/01-plan/features/claude-code-v2166-enhancement.plan.md` | 잘못된 기반 |
| Analysis 문서 FR-01 | `docs/03-analysis/claude-code-v2166-enhancement.analysis.md` | 100% PASS 판정 (기술적으로 코드는 존재하므로) |
| Report 문서 | `docs/04-report/features/claude-code-v2166-enhancement.report.md` | 25/25 FR PASS (dead code 포함) |
| MEMORY.md | `hooks 10개 활성` 기록 | 실제 10개 맞음 (InstructionsLoaded 제외) |

### 2.4 Graceful Degradation

**런타임 에러 없음.** Claude Code는 hooks.json에 알 수 없는 이벤트가 등록되어 있어도 에러를 발생시키지 않고 무시한다. `instructions-loaded-handler.js`는 한 번도 실행된 적 없지만 시스템 안정성에 영향 없음.

---

## 3. Claude Code 공식 Hook Events — 완전한 라이프사이클

### 3.1 전체 이벤트 목록 (17개)

Claude Code v2.1.68 기준, 공식적으로 지원되는 Hook Event는 **정확히 17개**:

| # | Event | Category | Timing | Description |
|---|-------|----------|--------|-------------|
| 1 | **SessionStart** | Session | 세션 시작 시 1회 | 세션 초기화, 환경 설정 |
| 2 | **UserPromptSubmit** | Agentic Loop | 사용자 입력 직후 | 프롬프트 전처리, 변환, 차단 가능 |
| 3 | **PreToolUse** | Agentic Loop | 도구 실행 전 | 허용/차단/수정 결정, matcher 지원 |
| 4 | **PermissionRequest** | Agentic Loop | 권한 요청 시 | 자동 승인/거부, PreToolUse의 보완 |
| 5 | **PostToolUse** | Agentic Loop | 도구 실행 후 | 결과 후처리, 추가 컨텍스트 주입 |
| 6 | **PostToolUseFailure** | Agentic Loop | 도구 실행 실패 후 | 실패 처리, 에러 로깅 |
| 7 | **Notification** | Agentic Loop | 알림 발생 시 | 사용자 알림 가로채기 |
| 8 | **SubagentStart** | Agent Teams | 서브에이전트 시작 | 에이전트 추적, 상태 기록 |
| 9 | **SubagentStop** | Agent Teams | 서브에이전트 종료 | 에이전트 정리, 결과 수집 |
| 10 | **TeammateIdle** | Agent Teams | 팀원 유휴 상태 | 팀 조율, 작업 재배분 |
| 11 | **TaskCompleted** | Agent Teams | 태스크 완료 시 | 진행 추적, 다음 작업 트리거 |
| 12 | **Stop** | Session | 응답 완료/중단 시 | 세션 정리, 상태 저장 |
| 13 | **SessionEnd** | Session | 세션 종료 시 | 최종 정리 |
| 14 | **ConfigChange** | Standalone | 설정 변경 시 | 보안 감사, 변경 차단 (v2.1.49+) |
| 15 | **PreCompact** | Standalone | 컨텍스트 압축 전 | 압축 전 상태 보존, matcher: auto\|manual |
| 16 | **WorktreeCreate** | Standalone | Worktree 생성 시 | VCS 연동 (v2.1.50+) |
| 17 | **WorktreeRemove** | Standalone | Worktree 삭제 시 | VCS 정리 (v2.1.50+) |

### 3.2 라이프사이클 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Code Session                          │
│                                                                 │
│  ① SessionStart (once)                                          │
│       │                                                         │
│       ▼                                                         │
│  ┌─────────────── Agentic Loop (반복) ──────────────────┐       │
│  │                                                       │       │
│  │  ② UserPromptSubmit                                   │       │
│  │       │                                               │       │
│  │       ▼                                               │       │
│  │  ┌─── Tool Execution Cycle (반복) ───┐               │       │
│  │  │                                    │               │       │
│  │  │  ③ PreToolUse [matcher]            │               │       │
│  │  │       │                            │               │       │
│  │  │       ├─ (권한 필요 시)             │               │       │
│  │  │       │  ④ PermissionRequest       │               │       │
│  │  │       │                            │               │       │
│  │  │       ▼                            │               │       │
│  │  │  [Tool Execution]                  │               │       │
│  │  │       │                            │               │       │
│  │  │       ├─ (성공)                     │               │       │
│  │  │       │  ⑤ PostToolUse [matcher]   │               │       │
│  │  │       │                            │               │       │
│  │  │       └─ (실패)                     │               │       │
│  │  │          ⑥ PostToolUseFailure      │               │       │
│  │  │                                    │               │       │
│  │  └────────────────────────────────────┘               │       │
│  │                                                       │       │
│  │  ⑦ Notification (비동기)                               │       │
│  │                                                       │       │
│  │  ┌─── Agent Teams Events ────────────┐               │       │
│  │  │  ⑧ SubagentStart                  │               │       │
│  │  │  ⑨ SubagentStop                   │               │       │
│  │  │  ⑩ TeammateIdle                   │               │       │
│  │  │  ⑪ TaskCompleted                  │               │       │
│  │  └───────────────────────────────────┘               │       │
│  │                                                       │       │
│  │  ⑫ Stop (응답 종료/사용자 중단)                         │       │
│  │                                                       │       │
│  └───────────────────────────────────────────────────────┘       │
│                                                                 │
│  ⑬ SessionEnd                                                   │
│                                                                 │
│  ┌─── Standalone Events (독립 발생) ──────────────────┐         │
│  │  ⑭ ConfigChange        (설정 변경 시)               │         │
│  │  ⑮ PreCompact          (컨텍스트 압축 전)            │         │
│  │  ⑯ WorktreeCreate      (worktree 생성 시)           │         │
│  │  ⑰ WorktreeRemove      (worktree 삭제 시)           │         │
│  └─────────────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 이벤트별 Hook Input/Output Schema

#### Category A: Session Events

| Event | Input Fields | Output Capabilities |
|-------|-------------|-------------------|
| SessionStart | `session_id`, `cwd` | `systemMessage` (context injection) |
| SessionEnd | `session_id`, `transcript_summary` | Logging only |

#### Category B: Agentic Loop Events

| Event | Input Fields | Output Capabilities |
|-------|-------------|-------------------|
| UserPromptSubmit | `prompt`, `session_id` | `systemMessage`, content modification |
| PreToolUse | `tool_name`, `tool_input`, matcher | `decision` (allow/block/modify), `reason` |
| PermissionRequest | `tool_name`, `tool_input` | `decision` (allow/deny) |
| PostToolUse | `tool_name`, `tool_input`, `tool_result`, matcher | `systemMessage` |
| PostToolUseFailure | `tool_name`, `error` | `systemMessage` |
| Notification | `message`, `level` | Intercept/suppress |
| Stop | `stop_reason` | Cleanup actions |

#### Category C: Agent Teams Events

| Event | Input Fields | Output Capabilities |
|-------|-------------|-------------------|
| SubagentStart | `agent_id`, `agent_type`, `parent_id` | `systemMessage` |
| SubagentStop | `agent_id`, `agent_type`, `result` | Logging/state cleanup |
| TeammateIdle | `agent_id`, `agent_name` | Logging/coordination |
| TaskCompleted | `task_id`, `task_subject` | Next task trigger |

#### Category D: Standalone Events

| Event | Input Fields | Output Capabilities |
|-------|-------------|-------------------|
| ConfigChange | `setting_path`, `old_value`, `new_value` | `decision` (allow/block) |
| PreCompact | `trigger` (auto\|manual), matcher | `systemMessage` (preserved context) |
| WorktreeCreate | `worktree_path`, `branch` | Post-creation setup |
| WorktreeRemove | `worktree_path` | Cleanup actions |

---

## 4. bkit hooks.json Audit

### 4.1 등록된 이벤트 (11개)

| # | Event | Handler | Timeout | Status |
|---|-------|---------|---------|--------|
| 1 | SessionStart | `hooks/session-start.js` | 5000ms | **ACTIVE** |
| 2 | PreToolUse (Write\|Edit) | `scripts/pre-write.js` | 5000ms | **ACTIVE** |
| 3 | PreToolUse (Bash) | `scripts/unified-bash-pre.js` | 5000ms | **ACTIVE** |
| 4 | PostToolUse (Write) | `scripts/unified-write-post.js` | 5000ms | **ACTIVE** |
| 5 | PostToolUse (Bash) | `scripts/unified-bash-post.js` | 5000ms | **ACTIVE** |
| 6 | PostToolUse (Skill) | `scripts/skill-post.js` | 5000ms | **ACTIVE** |
| 7 | Stop | `scripts/unified-stop.js` | 10000ms | **ACTIVE** |
| 8 | UserPromptSubmit | `scripts/user-prompt-handler.js` | 3000ms | **ACTIVE** |
| 9 | PreCompact | `scripts/context-compaction.js` | 5000ms | **ACTIVE** |
| 10 | TaskCompleted | `scripts/pdca-task-completed.js` | 5000ms | **ACTIVE** |
| 11 | SubagentStart | `scripts/subagent-start-handler.js` | 5000ms | **ACTIVE** |
| 12 | SubagentStop | `scripts/subagent-stop-handler.js` | 5000ms | **ACTIVE** |
| 13 | TeammateIdle | `scripts/team-idle-handler.js` | 5000ms | **ACTIVE** |
| 14 | **InstructionsLoaded** | `scripts/instructions-loaded-handler.js` | 3000ms | **DEAD CODE** |

### 4.2 Summary

| Metric | Count |
|--------|:-----:|
| hooks.json 등록 이벤트 | 11 (unique event names) |
| 실제 활성 이벤트 | **10** |
| Dead Code 이벤트 | **1** (InstructionsLoaded) |
| Hook handler 파일 수 | 14 (matcher별 별도 handler) |
| CC 공식 17개 중 사용 | **10/17 (58.8%)** |
| 미사용 공식 이벤트 | 7개 (PermissionRequest, PostToolUseFailure, Notification, SessionEnd, ConfigChange, WorktreeCreate, WorktreeRemove) |

### 4.3 미사용 공식 이벤트 활용 가능성

| Event | 활용 가능성 | 잠재 용도 |
|-------|:-----------:|-----------|
| PermissionRequest | Medium | 자동 승인 정책 (bkit 관련 도구) |
| PostToolUseFailure | High | 실패 로깅, 에러 패턴 분석 |
| Notification | Low | 알림 커스터마이징 |
| SessionEnd | Medium | 세션 통계, 최종 상태 저장 |
| ConfigChange | High | 보안 감사, 설정 변경 추적 (ENH-32) |
| WorktreeCreate | Low | Worktree PDCA 연동 (ENH-39) |
| WorktreeRemove | Low | Worktree 정리 |

---

## 5. v2.1.64~v2.1.66 Impact Analysis 검증

### 5.1 실제 릴리스 상태

| Version | CHANGELOG | npm | Status |
|---------|:---------:|:---:|--------|
| v2.1.63 | O | O | **정상 릴리스** — HTTP hooks, /simplify, /batch, 13 memory fixes |
| v2.1.64 | X | X | **SKIPPED** — 미게시 |
| v2.1.65 | X | X | **SKIPPED** — 미게시 |
| v2.1.66 | O | O | **정상** — "Reduced spurious error logging" 단 1건 |
| v2.1.67 | X | X | **SKIPPED** — 미게시 |
| v2.1.68 | O | O | **정상** — Opus 4.6 defaults, ultrathink keyword |

### 5.2 기존 문서 vs 실제

| Claim | Source | Reality |
|-------|--------|---------|
| "CC v2.1.64: 21 Features + 22 Bug Fixes" | plan.md Section 1.2 | **거짓** — v2.1.64는 미게시 |
| "InstructionsLoaded hook: CC v2.1.64+" | plan.md ENH-60 | **거짓** — 이 이벤트 자체가 존재하지 않음 |
| "CHANGELOG 의도적 삭제" | plan.md Section 1.2 | **거짓** — CHANGELOG가 없는 건 릴리스 자체가 없기 때문 |
| "Match Rate: 100% (25/25 FR)" | analysis.md | **기술적 사실** — 코드는 존재하지만 1개 FR은 Dead Code |
| "bkit hooks 10개 활성" | MEMORY.md | **정확** — InstructionsLoaded 제외 시 10개 맞음 |

### 5.3 영향 받는 FR 목록

`claude-code-v2166-enhancement` 25개 FR 중 InstructionsLoaded 직접 관련:

| FR | Description | Status | Corrected Status |
|----|-------------|--------|-----------------|
| FR-01 | InstructionsLoaded hook handler 생성 | PASS | **DEAD CODE** — handler 존재하나 실행 불가 |
| FR-02 | hooks.json에 InstructionsLoaded 등록 | PASS | **DEAD CODE** — 등록되었으나 CC가 무시 |

나머지 23개 FR (FR-03~FR-25)은 InstructionsLoaded와 무관하며 정상 동작.

---

## 6. Recommendations

### 6.1 즉시 조치 (Priority: HIGH)

| # | Action | Files | Description |
|---|--------|-------|-------------|
| R-01 | Dead Code 제거 | `hooks/hooks.json` | InstructionsLoaded 블록 삭제 (lines 149-159) |
| R-02 | Dead Code 제거 | `scripts/instructions-loaded-handler.js` | 파일 전체 삭제 (92줄) |
| R-03 | session-start.js 수정 | `hooks/session-start.js` | ENH-60 관련 안내 문구 제거/수정 |

### 6.2 문서 보정 (Priority: MEDIUM)

| # | Action | Description |
|---|--------|-------------|
| R-04 | MEMORY.md 보정 | v2.1.64~v2.1.66 관련 기록 정정 (SKIPPED 릴리스 명시) |
| R-05 | plan.md 정정 주석 | Section 1.2 "21 Features + 22 Bug Fixes" 환각 기반 명시 |
| R-06 | analysis.md 보정 | FR-01, FR-02를 DEAD CODE로 재분류 |

### 6.3 향후 개선 (Priority: LOW)

| # | Action | Description |
|---|--------|-------------|
| R-07 | 환각 방지 프로세스 | Impact Analysis 시 반드시 CHANGELOG + npm 게시 여부 교차 검증 |
| R-08 | hooks.json 자동 검증 | CI/CD에서 등록된 이벤트가 공식 17개에 포함되는지 확인 |
| R-09 | 미사용 이벤트 활용 검토 | ConfigChange, PostToolUseFailure 등 High 가치 이벤트 도입 검토 |

---

## 7. 분석 요약

### Match Rate 재산정

| Category | Original | Corrected |
|----------|:--------:|:---------:|
| v2166 FR Match Rate | 100% (25/25) | **92% (23/25)** — 2 FR Dead Code |
| hooks.json Active Events | 11 | **10** — 1 Dead Code |
| CC Hook Coverage | 11/17 (64.7%) | **10/17 (58.8%)** |

### Key Takeaways

1. **InstructionsLoaded는 존재하지 않는 CC Hook Event** — Claude Code 어떤 버전에서도 지원하지 않음
2. **v2.1.64/v2.1.65는 SKIPPED 릴리스** — npm에 게시된 적 없으며 CHANGELOG도 없음
3. **bkit에 미치는 실질적 영향은 없음** — Dead Code가 존재하지만 Graceful Degradation으로 에러 없음
4. **Dead Code 정리 권장** — 2개 파일 삭제 + hooks.json 수정으로 깔끔히 정리 가능
5. **환각 기반 Impact Analysis 재발 방지** 필요 — 릴리스 존재 여부를 CHANGELOG + npm 교차 검증

---

*Analysis completed: 2026-03-04*
*Analyst: Claude Opus 4.6 (manual multi-source investigation)*
*Confidence: HIGH (official docs + CHANGELOG + npm + codebase 교차 검증)*
