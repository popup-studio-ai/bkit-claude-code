# Gemini CLI Agent Schema Compatibility Design

> **Project**: bkit-claude-code
> **Feature**: gemini-agent-schema-compatibility
> **Version**: v1.4.3
> **Date**: 2026-01-26
> **Status**: Completed

---

## 1. Executive Summary

bkit v1.4.3에서 Gemini CLI v0.25.2 실행 시 발생하는 agent 스키마 호환성 오류를 해결하기 위한 설계 문서입니다.

### 1.1 Problem Statement

```
[ExtensionManager] Error loading agent from bkit:
Failed to load agent from /Users/.../.gemini/extensions/bkit/agents/gap-detector.md:
Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
...
: Unrecognized key(s) in object: 'permissionMode', 'skills', 'hooks'
```

### 1.2 Root Cause Analysis

| 문제 | 원인 | 영향 |
|------|------|------|
| Invalid tool name | Claude Code 도구명(Read, Glob) vs Gemini 도구명(read_file, glob) | 11개 agent 로딩 실패 |
| Unrecognized keys | Claude Code 전용 필드 사용 | 스키마 검증 실패 |

---

## 2. Research Findings

### 2.1 Tool Name Mapping

| Claude Code | Gemini CLI | 비고 |
|-------------|------------|------|
| Read | read_file | 파일 읽기 |
| Write | write_file | 파일 쓰기 |
| Edit | replace | 파일 편집 (⚠️ "edit" 아님) |
| Glob | glob | 파일 검색 |
| Grep | search_file_content | 패턴 검색 (⚠️ "grep" 아님) |
| Bash | run_shell_command | 쉘 명령 (⚠️ "shell" 아님) |
| Task | ❌ 없음 | Gemini에서 미지원 |
| LSP | ❌ 없음 | Gemini에서 미지원 |
| TodoWrite | ❌ 없음 | Gemini에서 미지원 |
| WebFetch | web_fetch | 웹 가져오기 |
| WebSearch | google_web_search | 웹 검색 (⚠️ "web_search" 아님) |

**Source**: [Gemini CLI tool-names.ts](https://github.com/nicholasgriffintn/gemini-cli/blob/main/packages/core/src/tools/tool-names.ts)

> ⚠️ **Important**: 초기 조사에서 tools-api.md 문서의 예시만 참고하여 잘못된 도구명을 사용했으나,
> 실제 tool-names.ts 소스 코드 확인 결과 올바른 도구명이 발견됨.

### 2.2 Supported vs Unsupported Fields

| 필드 | Claude Code | Gemini CLI | 조치 |
|------|:-----------:|:----------:|------|
| name | ✅ | ✅ | 유지 |
| description | ✅ | ✅ | 유지 |
| model | ✅ | ✅ (modelConfig) | 형식 변환 |
| tools | ✅ | ✅ | 도구명 변환 |
| imports | ✅ | ❌ | 제거 또는 context로 대체 |
| permissionMode | ✅ | ❌ | 제거 |
| context | ✅ (fork) | ❌ | 제거 |
| mergeResult | ✅ | ❌ | 제거 |
| disallowedTools | ✅ | ❌ | 제거 |
| skills | ✅ | ❌ | 제거 |
| hooks | ✅ | ❌ | gemini-extension.json으로 이동 |

**Source**: [Gemini CLI types.ts](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/agents/types.ts)

### 2.3 Gemini AgentDefinition Schema

```typescript
interface BaseAgentDefinition {
  name: string;                    // Required
  displayName?: string;            // Optional
  description: string;             // Required
  experimental?: boolean;          // Optional
}

interface LocalAgentDefinition extends BaseAgentDefinition {
  kind: 'local';
  toolConfig?: {
    tools: (string | FunctionDeclaration)[];  // Tool names in snake_case
  };
  modelConfig?: ModelConfig;
  runConfig?: RunConfig;
}
```

---

## 3. Solution Design

### 3.1 Architecture Decision

**Option A**: 플랫폼별 별도 agent 파일 유지
- `agents/claude/gap-detector.md`
- `agents/gemini/gap-detector.md`
- ❌ 중복 유지 관리 부담

**Option B**: 단일 agent 파일 + 동적 변환 (선택)
- 단일 소스 유지
- 빌드/설치 시 변환
- ✅ 유지 관리 용이

**Option C**: Claude Code 전용 필드를 YAML 주석으로 처리
- Gemini에서 무시되도록 주석 처리
- ❌ 일부 Gemini 버전에서 파싱 오류 가능

### 3.2 Selected Solution: Claude Code Primary Format

> ⚠️ **결정 변경 (2026-01-26)**: 초기 설계에서는 Gemini 형식을 기본으로 하고
> Claude 설정을 별도 파일로 분리하려 했으나, Claude Code가 `agents.json`을
> 지원하지 않아 **Claude Code 형식을 유지**하기로 결정.

```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents and actual implementation.
tools:
  - Read      # Claude Code 형식 유지
  - Glob
  - Grep
---
```

**Gemini CLI 호환성**: Agent 파일의 `tools` 필드가 Gemini에서 인식되지 않지만,
agent 자체는 로딩됨 (도구 제한 없이 동작).

### 3.3 Implementation Strategy

#### Step 1: Agent 파일 정리 (공통 필드만 유지)

```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents...
---

# Agent instructions (Markdown body)
```

#### Step 2: Claude Code 전용 설정을 .claude-plugin/agents.json으로 분리

```json
{
  "agents": {
    "gap-detector": {
      "imports": ["${PLUGIN_ROOT}/templates/shared/api-patterns.md"],
      "permissionMode": "plan",
      "context": "fork",
      "mergeResult": false,
      "disallowedTools": ["Write", "Edit"],
      "tools": ["Read", "Glob", "Grep", "Task"],
      "skills": ["bkit-templates", "phase-2-convention"],
      "hooks": {
        "Stop": [...]
      }
    }
  }
}
```

#### Step 3: Gemini 전용 설정을 gemini-extension.json에 통합

```json
{
  "agents": {
    "directory": "agents",
    "definitions": {
      "gap-detector": {
        "tools": ["read_file", "glob", "grep"]
      }
    }
  }
}
```

---

## 4. Detailed Changes

### 4.1 Agent Files (agents/*.md)

**Before (Current)**:
```yaml
---
name: gap-detector
description: |
  Agent that detects gaps...
imports:
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
context: fork
mergeResult: false
permissionMode: plan
disallowedTools:
  - Write
  - Edit
model: opus
tools:
  - Read
  - Glob
  - Grep
  - Task
skills:
  - bkit-templates
hooks:
  Stop:
    - hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-stop.js"
---
```

**After (Gemini-Compatible)**:
```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents and actual implementation.
  Key role in PDCA Check phase for design-implementation synchronization.
---

# Design-Implementation Gap Detection Agent
...
```

### 4.2 New File: .claude-plugin/agents.json

Claude Code 전용 agent 확장 설정:

```json
{
  "$schema": "https://claude.ai/schemas/agents.json",
  "version": "1.0.0",
  "agents": {
    "gap-detector": {
      "model": "opus",
      "permissionMode": "plan",
      "context": "fork",
      "mergeResult": false,
      "imports": [
        "${PLUGIN_ROOT}/templates/shared/api-patterns.md"
      ],
      "tools": ["Read", "Glob", "Grep", "Task"],
      "disallowedTools": ["Write", "Edit"],
      "skills": ["bkit-templates", "phase-2-convention"],
      "hooks": {
        "Stop": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-stop.js",
          "timeout": 5000
        }]
      }
    }
    // ... other agents
  }
}
```

### 4.3 gemini-extension.json Updates

```json
{
  "agents": {
    "directory": "agents",
    "overrides": {
      "gap-detector": {
        "toolConfig": {
          "tools": ["read_file", "glob", "grep"]
        }
      },
      "code-analyzer": {
        "toolConfig": {
          "tools": ["read_file", "glob", "grep"]
        }
      }
    }
  }
}
```

---

## 5. Migration Plan

### 5.1 Phase 1: Immediate Fix (v1.4.3)

1. Agent 파일에서 Gemini 미지원 필드 제거
2. Tool 이름을 Gemini 형식으로 변경
3. Claude Code 전용 설정은 별도 파일로 분리

### 5.2 Phase 2: Long-term Solution (v1.5.0)

1. 빌드 스크립트로 플랫폼별 변환 자동화
2. 단일 소스에서 양 플랫폼 지원

---

## 6. Files to Modify

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| agents/gap-detector.md | Modify | Claude 전용 필드 제거 |
| agents/code-analyzer.md | Modify | Claude 전용 필드 제거 |
| agents/design-validator.md | Modify | Claude 전용 필드 제거 |
| agents/pdca-iterator.md | Modify | Claude 전용 필드 제거 |
| agents/report-generator.md | Modify | Claude 전용 필드 제거 |
| agents/starter-guide.md | Modify | Claude 전용 필드 제거 |
| agents/pipeline-guide.md | Modify | Claude 전용 필드 제거 |
| agents/bkend-expert.md | Modify | Claude 전용 필드 제거 |
| agents/enterprise-expert.md | Modify | Claude 전용 필드 제거 |
| agents/infra-architect.md | Modify | Claude 전용 필드 제거 |
| agents/qa-monitor.md | Modify | Claude 전용 필드 제거 |
| .claude-plugin/agents.json | Create | Claude 전용 agent 설정 |
| gemini-extension.json | Modify | agents 섹션 추가 |

---

## 7. Tool Name Conversion Table (Verified)

| Agent | Claude Tools | Gemini Tools |
|-------|--------------|--------------|
| gap-detector | Read, Glob, Grep, Task | read_file, glob, search_file_content |
| code-analyzer | Read, Glob, Grep, Task, LSP | read_file, glob, search_file_content |
| design-validator | Read, Glob, Grep | read_file, glob, search_file_content |
| pdca-iterator | Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, LSP | read_file, write_file, replace, glob, search_file_content, run_shell_command |
| report-generator | Read, Write, Glob, Grep | read_file, write_file, glob, search_file_content |
| starter-guide | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | read_file, write_file, replace, glob, search_file_content, google_web_search, web_fetch |
| pipeline-guide | Read, Glob, Grep, TodoWrite | read_file, glob, search_file_content |
| bkend-expert | Read, Write, Edit, Glob, Grep, Bash, WebFetch | read_file, write_file, replace, glob, search_file_content, run_shell_command, web_fetch |
| enterprise-expert | Read, Write, Edit, Glob, Grep, Task, WebSearch | read_file, write_file, replace, glob, search_file_content, google_web_search |
| infra-architect | Read, Write, Edit, Glob, Grep, Bash, Task | read_file, write_file, replace, glob, search_file_content, run_shell_command |
| qa-monitor | Bash, Read, Write, Glob, Grep, Task | run_shell_command, read_file, write_file, glob, search_file_content |

**Note**: `Task`, `LSP`, `TodoWrite`는 Gemini CLI에서 미지원되므로 제외

### 7.1 검증 완료 (2026-01-26)

실제 Gemini CLI v0.25.2 테스트 결과:
- ✅ 모든 11개 agent 파일 로딩 성공
- ✅ 스키마 검증 오류 없음
- ✅ Claude Code에서도 정상 동작 확인

---

## 8. Validation Checklist

- [x] 모든 agent 파일이 Gemini 스키마 검증 통과 ✅
- [x] Claude Code에서 기존 기능 정상 동작 ✅
- [x] Gemini CLI에서 agent 로딩 성공 ✅
- [x] Tool 이름 매핑 정확성 확인 ✅

---

## 9. Related Documents

| 문서 유형 | 경로 |
|----------|------|
| Parent Feature Plan | docs/01-plan/features/gemini-cli-v026-compatibility.plan.md |
| Parent Feature Design | docs/02-design/features/gemini-cli-v026-compatibility.design.md |
| Test Plan | docs/01-plan/features/gemini-cli-v026-compatibility-test.plan.md |

---

## 10. References

- [Gemini CLI GitHub Repository](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI Tools API](https://github.com/google-gemini/gemini-cli/blob/main/docs/core/tools-api.md)
- [Gemini CLI Agent Types](https://github.com/google-gemini/gemini-cli/blob/main/packages/core/src/agents/types.ts)
- [Invalid tool name regex issue](https://gist.github.com/tanaikech/346eea6b858e3368d9b34475d1b70e54)

---

**Design Generated By**: bkit PDCA Design Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
