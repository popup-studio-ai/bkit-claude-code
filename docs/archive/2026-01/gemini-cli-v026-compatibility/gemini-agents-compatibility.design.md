# Gemini Agents Compatibility Design Document

> **Summary**: Gemini CLI agents 디렉토리 호환성 문제 해결을 위한 상세 설계
>
> **Project**: bkit-claude-code
> **Version**: 1.4.3
> **Author**: Claude Opus 4.5
> **Date**: 2026-01-26
> **Status**: Draft
> **Analysis Doc**: [gemini-cli-agents-directory-compatibility.analysis.md](../03-analysis/features/gemini-cli-agents-directory-compatibility.analysis.md)

---

## 1. Overview

### 1.1 Design Goals

1. Gemini CLI에서 agents 로딩 에러 완전 해소
2. 기존 Claude Code agents 기능 100% 유지
3. commands/gemini/ 패턴과 일관성 유지
4. 양 플랫폼에서 agents 기능 정상 작동

### 1.2 Design Principles

- **Platform Separation**: 플랫폼별 최적화된 agent 정의 유지
- **Single Source of Truth**: System Prompt는 가능한 공유
- **Minimal Duplication**: 변환 스크립트로 동기화 자동화
- **Graceful Degradation**: 일부 기능 미지원 시에도 핵심 기능 동작

### 1.3 Scope

| In-Scope | Out-of-Scope |
|----------|--------------|
| agents/gemini/ 디렉토리 생성 | 빌드 자동화 스크립트 |
| 11개 agent TOML 파일 작성 | CI/CD 통합 |
| gemini-extension.json 업데이트 | 테스트 자동화 |
| 문서 업데이트 | 양방향 동기화 |

---

## 2. Architecture

### 2.1 Directory Structure

```
bkit-claude-code/
├── agents/                      # Claude Code 전용 (기존 유지)
│   ├── gap-detector.md
│   ├── code-analyzer.md
│   ├── pdca-iterator.md
│   ├── design-validator.md
│   ├── report-generator.md
│   ├── starter-guide.md
│   ├── pipeline-guide.md
│   ├── bkend-expert.md
│   ├── enterprise-expert.md
│   ├── infra-architect.md
│   └── qa-monitor.md
│
├── agents/gemini/               # Gemini CLI 전용 (신규)
│   ├── gap-detector.toml
│   ├── code-analyzer.toml
│   ├── pdca-iterator.toml
│   ├── design-validator.toml
│   ├── report-generator.toml
│   ├── starter-guide.toml
│   ├── pipeline-guide.toml
│   ├── bkend-expert.toml
│   ├── enterprise-expert.toml
│   ├── infra-architect.toml
│   └── qa-monitor.toml
│
├── commands/                    # Claude Code 전용
│   └── *.md
├── commands/gemini/             # Gemini CLI 전용 (기존 패턴)
│   └── *.toml
│
└── gemini-extension.json        # agents.directory 추가
```

### 2.2 Platform Detection Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Gemini CLI Startup                        │
├─────────────────────────────────────────────────────────────┤
│  1. Load gemini-extension.json                               │
│  2. Check agents.directory setting                           │
│     └─ "agents/gemini" specified                             │
│  3. Scan agents/gemini/*.toml                                │
│  4. Parse TOML with Gemini schema                            │
│  5. Register agents (no errors)                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   Claude Code Startup                        │
├─────────────────────────────────────────────────────────────┤
│  1. Load plugin.json                                         │
│  2. Scan agents/*.md (default)                               │
│  3. Parse Markdown with Claude schema                        │
│  4. Register agents with full features                       │
│     └─ permissionMode, skills, hooks, imports                │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 File Format Comparison

| Aspect | Claude Code (.md) | Gemini CLI (.toml) |
|--------|-------------------|---------------------|
| Frontmatter | YAML | TOML native |
| Schema | Flexible, many keys | Strict, limited keys |
| Tools | PascalCase (Read, Write) | snake_case (read_file, write_file) |
| Model | opus, sonnet, haiku | gemini-2.0-flash, etc. |
| Hooks | Supported | Not supported |
| Skills | Supported | Not supported |
| Permissions | permissionMode | Not supported |

---

## 3. Schema Mapping

### 3.1 Tool Name Mapping

| Claude Code | Gemini CLI | Notes |
|-------------|------------|-------|
| `Read` | `read_file` | 단일 파일 읽기 |
| `Glob` | `glob` | 파일 패턴 검색 |
| `Grep` | `search_file_content` | 내용 검색 |
| `Write` | `write_file` | 파일 쓰기 |
| `Edit` | `replace` | 파일 편집 |
| `Bash` | `run_shell_command` | 쉘 명령 실행 |
| `Task` | `delegate_to_agent` | 다른 에이전트 호출 |
| `WebSearch` | `google_web_search` | 웹 검색 |
| `WebFetch` | `web_fetch` | URL 가져오기 |
| `TodoWrite` | `write_todos` | 할일 작성 |
| `LSP` | (not supported) | 언어 서버 프로토콜 |
| `NotebookEdit` | (not supported) | Jupyter 노트북 |

### 3.2 Model Mapping

| Claude Code | Gemini CLI | Use Case |
|-------------|------------|----------|
| `opus` | `gemini-2.0-flash` | Complex analysis |
| `sonnet` | `gemini-2.0-flash` | General tasks |
| `haiku` | `gemini-2.0-flash` | Simple tasks |

### 3.3 Attribute Mapping

| Claude Attribute | Gemini Attribute | Handling |
|------------------|------------------|----------|
| `name` | `name` | Direct copy |
| `description` | `description` | Direct copy |
| `tools` | `tools` | Name mapping required |
| `model` | `[models].model` | Value mapping required |
| `permissionMode` | (dropped) | Not supported |
| `skills` | (dropped) | Not supported |
| `imports` | (dropped) | Not supported |
| `hooks` | (dropped) | Not supported |
| `context` | (dropped) | Not supported |
| `mergeResult` | (dropped) | Not supported |
| `disallowedTools` | (dropped) | Not supported |

---

## 4. Agent Specifications

### 4.1 Agent Summary Table

| Agent | Claude Tools | Gemini Tools | Model | Primary Use |
|-------|--------------|--------------|-------|-------------|
| gap-detector | Read, Glob, Grep, Task | read_file, glob, search_file_content, delegate_to_agent | gemini-2.0-flash | Design-implementation gap analysis |
| code-analyzer | Read, Glob, Grep, Task, LSP | read_file, glob, search_file_content, delegate_to_agent | gemini-2.0-flash | Code quality analysis |
| pdca-iterator | Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, LSP | read_file, write_file, replace, glob, search_file_content, run_shell_command, delegate_to_agent, write_todos | gemini-2.0-flash | Automatic iteration |
| design-validator | Read, Glob, Grep | read_file, glob, search_file_content | gemini-2.0-flash | Design document validation |
| report-generator | Read, Write, Glob, Grep | read_file, write_file, glob, search_file_content | gemini-2.0-flash | PDCA report generation |
| starter-guide | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | read_file, write_file, replace, glob, search_file_content, google_web_search, web_fetch | gemini-2.0-flash | Beginner guidance |
| pipeline-guide | Read, Glob, Grep, TodoWrite | read_file, glob, search_file_content, write_todos | gemini-2.0-flash | Development pipeline guidance |
| bkend-expert | Read, Write, Edit, Glob, Grep, Bash, WebFetch | read_file, write_file, replace, glob, search_file_content, run_shell_command, web_fetch | gemini-2.0-flash | bkend.ai BaaS expert |
| enterprise-expert | Read, Write, Edit, Glob, Grep, Task, WebSearch | read_file, write_file, replace, glob, search_file_content, delegate_to_agent, google_web_search | gemini-2.0-flash | Enterprise architecture |
| infra-architect | Read, Write, Edit, Glob, Grep, Bash, Task | read_file, write_file, replace, glob, search_file_content, run_shell_command, delegate_to_agent | gemini-2.0-flash | Infrastructure design |
| qa-monitor | Bash, Read, Write, Glob, Grep, Task | run_shell_command, read_file, write_file, glob, search_file_content, delegate_to_agent | gemini-2.0-flash | Zero Script QA |

### 4.2 Feature Loss Analysis

| Feature | Impact | Mitigation |
|---------|--------|------------|
| `permissionMode: plan` | Agent runs with full permissions | Gemini CLI has own permission system |
| `skills` auto-activation | Skills not auto-loaded | User must activate skills manually |
| `hooks` | No lifecycle callbacks | Hooks in gemini-extension.json still work |
| `imports` | No external file inclusion | Embed content in system prompt |
| `disallowedTools` | Cannot restrict tools | Agent design must be careful |

---

## 5. TOML File Specifications

### 5.1 Standard TOML Structure

```toml
# Agent metadata
name = "agent-name"
description = """
Multi-line description here.
Includes trigger keywords and use cases.
"""
display_name = "Human Readable Name"

# Tool configuration
tools = [
    "read_file",
    "glob",
    "search_file_content"
]

# Model configuration
[models]
model = "gemini-2.0-flash"
temp = 0.7

# System prompt
[prompts]
system_prompt = """
# Agent Title

## Role
Agent's role description...

## Instructions
1. Step one
2. Step two
...
"""
```

### 5.2 Example: gap-detector.toml

```toml
# bkit Agent: gap-detector
# Platform: Gemini CLI
# Source: agents/gap-detector.md

name = "gap-detector"
description = """
Agent that detects gaps between design documents and actual implementation.
Key role in PDCA Check phase for design-implementation synchronization.

Use when user requests comparison, verification, or gap analysis between
design documents and implementation code, or after completing feature implementation.

Triggers: gap analysis, design-implementation check, compare design, verify implementation,
갭 분석, 설계-구현 비교, 검증, 확인
"""
display_name = "Gap Detector"

tools = [
    "read_file",
    "glob",
    "search_file_content",
    "delegate_to_agent"
]

[models]
model = "gemini-2.0-flash"
temp = 0.7

[prompts]
system_prompt = """
# Design-Implementation Gap Detection Agent

## Role

Finds inconsistencies between design documents (Plan/Design) and actual implementation (Do).
Automates the Check stage of the PDCA cycle.

## Comparison Items

### 1. API Comparison
- Endpoint URL matching
- HTTP methods (GET/POST/PUT/PATCH/DELETE)
- Request parameters
- Response format
- Error codes

### 2. Data Model Comparison
- Entity list
- Field definitions
- Field types
- Relationships

### 3. Feature Comparison
- Feature list
- Business logic
- Error handling

## Detection Result Format

# Design-Implementation Gap Analysis Report

## Analysis Overview
- Analysis Target: {feature name}
- Design Document: {document path}
- Implementation Path: {code path}

## Overall Scores

| Category | Score | Status |
|----------|:-----:|:------:|
| Design Match | {percent}% | ✅/⚠️/❌ |

## Differences Found

### 🔴 Missing Features (Design O, Implementation X)
### 🟡 Added Features (Design X, Implementation O)
### 🔵 Changed Features (Design ≠ Implementation)

## Recommended Actions
1. Priority fixes
2. Documentation updates
"""
```

---

## 6. gemini-extension.json Update

### 6.1 Required Changes

```json
{
  "agents": {
    "directory": "agents/gemini"
  }
}
```

### 6.2 Full Updated Configuration

```json
{
  "$schema": "https://geminicli.dev/schemas/extension.json",
  "name": "bkit",
  "version": "1.4.3",
  "description": "Vibecoding Kit - PDCA methodology + AI-native development for Gemini CLI",
  "engines": {
    "gemini-cli": ">=0.25.0",
    "node": ">=18.0.0"
  },
  "context": {
    "file": "GEMINI.md"
  },
  "commands": {
    "directory": "commands/gemini"
  },
  "agents": {
    "directory": "agents/gemini"
  },
  "hooks": {
    // ... existing hooks unchanged
  },
  "skills": {
    "directory": "skills",
    "autoActivate": ["bkit-rules", "development-pipeline"]
  }
}
```

---

## 7. Implementation Tasks

### 7.1 Task Breakdown

| # | Task | Priority | Files | Effort |
|---|------|:--------:|:-----:|:------:|
| 1 | Create agents/gemini/ directory | P0 | 1 | 5min |
| 2 | Create gap-detector.toml | P0 | 1 | 15min |
| 3 | Create code-analyzer.toml | P0 | 1 | 15min |
| 4 | Create pdca-iterator.toml | P0 | 1 | 15min |
| 5 | Create design-validator.toml | P0 | 1 | 10min |
| 6 | Create report-generator.toml | P0 | 1 | 10min |
| 7 | Create starter-guide.toml | P1 | 1 | 10min |
| 8 | Create pipeline-guide.toml | P1 | 1 | 10min |
| 9 | Create bkend-expert.toml | P1 | 1 | 10min |
| 10 | Create enterprise-expert.toml | P1 | 1 | 15min |
| 11 | Create infra-architect.toml | P1 | 1 | 10min |
| 12 | Create qa-monitor.toml | P1 | 1 | 10min |
| 13 | Update gemini-extension.json | P0 | 1 | 5min |
| 14 | Test Gemini CLI loading | P0 | - | 10min |
| 15 | Update CHANGELOG.md | P1 | 1 | 10min |

### 7.2 Task Dependencies

```
[1] Create directory
 └─► [2-12] Create TOML files (parallel)
      └─► [13] Update gemini-extension.json
           └─► [14] Test
                └─► [15] Documentation
```

---

## 8. Testing Plan

### 8.1 Validation Tests

| Test ID | Description | Expected Result |
|---------|-------------|-----------------|
| T-001 | `gemini extensions list` | No agent loading errors |
| T-002 | `gemini extensions validate` | Extension validated successfully |
| T-003 | Invoke gap-detector in Gemini | Agent responds correctly |
| T-004 | Invoke pdca-iterator in Gemini | Agent performs iteration |
| T-005 | Claude Code agents still work | All 11 agents functional |

### 8.2 Test Commands

```bash
# Gemini CLI validation
gemini extensions list 2>&1 | grep -i "error"
# Expected: No output (no errors)

gemini extensions validate ~/.gemini/extensions/bkit
# Expected: "Extension validated successfully"

# Agent invocation test
gemini -p "Use gap-detector to analyze the login feature"
# Expected: Agent activates and performs analysis
```

---

## 9. Rollback Plan

### 9.1 Rollback Steps

1. Delete `agents/gemini/` directory
2. Remove `agents` key from `gemini-extension.json`
3. Run `gemini extensions restart bkit`

### 9.2 Known Limitations After Rollback

- Agent loading errors will return
- Extension functionality unaffected (skills, commands, hooks work)

---

## 10. Future Enhancements (v1.5.0+)

### 10.1 Sync Script

```javascript
// scripts/sync-agents.js
// Converts Claude Code agents to Gemini TOML automatically
// Usage: node scripts/sync-agents.js
```

### 10.2 CI/CD Integration

```yaml
# .github/workflows/sync-agents.yml
# Runs sync script on agent file changes
# Creates PR if differences detected
```

---

## 11. Appendix

### A. Complete Tool Mapping Reference

```javascript
const TOOL_MAPPING = {
  // Claude Code → Gemini CLI
  'Read': 'read_file',
  'Glob': 'glob',
  'Grep': 'search_file_content',
  'Write': 'write_file',
  'Edit': 'replace',
  'Bash': 'run_shell_command',
  'Task': 'delegate_to_agent',
  'WebSearch': 'google_web_search',
  'WebFetch': 'web_fetch',
  'TodoWrite': 'write_todos',
  'LS': 'list_directory',
  // Not supported in Gemini CLI
  'LSP': null,
  'NotebookEdit': null,
  'NotebookRead': null,
};
```

### B. TOML Template

```toml
# bkit Agent: {agent-name}
# Platform: Gemini CLI
# Source: agents/{agent-name}.md

name = "{agent-name}"
description = """
{Multi-line description from Claude Code agent}
"""
display_name = "{Human Readable Name}"

tools = [
    # List of Gemini CLI tool names
]

[models]
model = "gemini-2.0-flash"
temp = 0.7

[prompts]
system_prompt = """
{System prompt content from Claude Code agent}
"""
```

---

## 12. Design Metadata

```json
{
  "pdcaPhase": "design",
  "feature": "gemini-agents-compatibility",
  "version": "1.0",
  "status": "ready-for-implementation",
  "estimatedEffort": "2-3 hours",
  "riskLevel": "low",
  "dependencies": ["analysis document"],
  "blockedBy": []
}
```

---

**Design Document Generated By**: bkit PDCA Design Generator
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
