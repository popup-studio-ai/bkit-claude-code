# bkit Hooks & Components Implementation Guide

> **Purpose**: Comprehensive guide for implementing stable and effective hooks, agents, skills, and commands in bkit plugin
>
> **Last Updated**: 2026-01-20
> **Claude Code Version Reference**: v1.0.89+

---

## Table of Contents

1. [bkit User Experience Goals](#1-bkit-user-experience-goals)
2. [Claude Code Official Component Reference](#2-claude-code-official-component-reference)
3. [Hooks System Deep Dive](#3-hooks-system-deep-dive)
4. [Skills Frontmatter Reference](#4-skills-frontmatter-reference)
5. [Agents Frontmatter Reference](#5-agents-frontmatter-reference)
6. [Known Issues & Workarounds](#6-known-issues--workarounds)
7. [bkit Implementation Strategy](#7-bkit-implementation-strategy)
8. [Testing & Debugging](#8-testing--debugging)

---

## 1. bkit User Experience Goals

### 1.1 Core Philosophy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         bkit's Core Mission                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   "Enable developers to naturally adopt document-driven development     │
│    and continuous improvement without knowing commands or methodology"  │
│                                                                         │
│   Key principle: AI guides humans toward good practices automatically   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Desired User Experience Flow

| Stage | User Action | bkit Behavior | Result |
|-------|-------------|---------------|--------|
| **Session Start** | Opens Claude Code | Welcome + options via AskUserQuestion | Guided onboarding |
| **Feature Request** | "Create login feature" | Auto-check design docs → Guide if missing | Design-first development |
| **Implementation** | Writes code | PreToolUse validates, PostToolUse suggests next steps | Quality assurance |
| **Completion** | Finishes task | Suggest Gap analysis | Continuous improvement |

### 1.3 Balance: Automation vs. User Freedom

```
Too Aggressive                          Too Passive
────────────────────────────────────────────────────────────
❌ Blocks every action                  ❌ No guidance at all
❌ Infinite Stop hook loops             ❌ User must know all commands
❌ Conversation becomes impossible      ❌ PDCA not applied automatically

                    ✅ OPTIMAL BALANCE
                    ────────────────────
                    • SessionStart: Welcome + options
                    • PreToolUse: Context hints (not blocking for minor changes)
                    • PostToolUse: Gentle next-step suggestions
                    • Stop: Only for critical completion checks (use sparingly)
                    • Skills/Agents: Auto-activate based on context
```

---

## 2. Claude Code Official Component Reference

### 2.1 Component Overview

| Component | Purpose | Trigger Method | File Location |
|-----------|---------|----------------|---------------|
| **Hooks** | Lifecycle automation | Automatic on events | `hooks/hooks.json` |
| **Skills** | Domain knowledge injection | Semantic matching on description | `skills/*/SKILL.md` |
| **Agents** | Specialized task delegation | Semantic matching or explicit | `agents/*.md` |
| **Commands** | User-invoked shortcuts | `/plugin:command-name` | `commands/*.md` |

### 2.2 Execution Priority

```
Plugin Installation Priority (highest to lowest):
1. Enterprise managed policies
2. User settings (~/.claude/settings.json)
3. Project settings (.claude/settings.json)
4. Plugin settings (hooks/hooks.json)

Component Discovery:
- Hooks: Loaded at session start (snapshot taken)
- Skills: Names/descriptions loaded at startup, full content on activation
- Agents: Definitions loaded at startup, invoked on match
- Commands: Available immediately after plugin installation
```

---

## 3. Hooks System Deep Dive

### 3.1 Supported Hook Events

| Event | Can Block | Trigger | Best Use Case |
|-------|:---------:|---------|---------------|
| `SessionStart` | ❌ | Session begins | Environment setup, welcome messages |
| `SessionEnd` | ❌ | Session ends | Cleanup, state persistence |
| `PreToolUse` | ✅ | Before tool execution | Validation, context injection |
| `PostToolUse` | ❌ | After tool completes | Suggestions, logging |
| `PermissionRequest` | ✅ | Permission dialog shown | Auto-approve/deny |
| `UserPromptSubmit` | ✅ | User submits prompt | Input validation, context addition |
| `Stop` | ✅ | Claude attempts to stop | Completion verification |
| `SubagentStop` | ✅ | Subagent finishes | Task completion check |
| `PreCompact` | ✅ | Before context compaction | Custom compaction logic |
| `Notification` | ❌ | Notification occurs | React to events |

### 3.2 Hook Types

#### Command-Based Hooks (Recommended for Stability)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

#### Prompt-Based Hooks (Stop/SubagentStop Only)

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "prompt",
            "prompt": "Evaluate completion status...",
            "model": "sonnet",
            "timeout": 30000
          }
        ]
      }
    ]
  }
}
```

> **WARNING**: Prompt-based hooks are only supported for `Stop` and `SubagentStop` events. Using them elsewhere will fail silently.

### 3.3 Hook Input Schema

All hooks receive JSON via stdin:

```json
{
  "session_id": "string",
  "transcript_path": "/path/to/conversation.jsonl",
  "cwd": "/current/working/directory",
  "permission_mode": "default|plan|acceptEdits|dontAsk|bypassPermissions",
  "hook_event_name": "EventName",
  "tool_name": "ToolName",
  "tool_input": { /* tool-specific */ },
  "tool_response": { /* for PostToolUse only */ }
}
```

#### Tool-Specific Input Examples

**Write Tool**:
```json
{
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "content": "file content"
  }
}
```

**Edit Tool**:
```json
{
  "tool_input": {
    "file_path": "/path/to/file.txt",
    "old_string": "original",
    "new_string": "replacement",
    "replace_all": false
  }
}
```

### 3.4 Hook Output Schema

#### Exit Codes (Critical!)

| Exit Code | Behavior | Use Case |
|:---------:|----------|----------|
| `0` | Success, parse JSON output | Normal operation |
| `2` | **Block operation**, show stderr as error | Validation failure |
| Other | Non-blocking error, log stderr | Warnings |

#### JSON Output Fields

**PreToolUse Output**:
```json
{
  "continue": true,
  "decision": "allow|block",
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "Reason message",
    "updatedInput": { "field": "new_value" },
    "additionalContext": "Context for Claude"
  }
}
```

**PostToolUse Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "Suggestion or next step"
  }
}
```

**SessionStart Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Welcome message and initial context"
  }
}
```

### 3.5 Matcher Patterns

| Pattern | Example | Matches |
|---------|---------|---------|
| Exact | `"Write"` | Write tool only |
| Regex | `"Write\|Edit"` | Write or Edit |
| Wildcard | `"*"` or `""` | All tools |
| MCP | `"mcp__memory__.*"` | All memory MCP tools |

### 3.6 Environment Variables

| Variable | Availability | Description |
|----------|--------------|-------------|
| `CLAUDE_PROJECT_DIR` | All hooks | Project root absolute path |
| `CLAUDE_PLUGIN_ROOT` | Plugin hooks | Plugin installation directory |
| `CLAUDE_ENV_FILE` | SessionStart only | File path for env persistence |
| `CLAUDE_CODE_REMOTE` | All hooks | "true" for web, empty for CLI |

---

## 4. Skills Frontmatter Reference

### 4.1 Complete Frontmatter Schema

```yaml
---
# REQUIRED
name: skill-name                    # Max 64 chars, lowercase + hyphens only
description: |                      # Max 1024 chars
  What this skill does.
  Include trigger keywords for semantic matching.

  Triggers: keyword1, keyword2, 한국어, 日本語

# OPTIONAL
allowed-tools: Read, Grep, Glob     # Restrict available tools
model: claude-sonnet-4-20250514     # Override model
context: fork                       # Run in isolated sub-agent
agent: general-purpose              # Agent type when context: fork
user-invocable: true                # Show in slash menu (default: true)
disable-model-invocation: false     # Block programmatic invocation
hooks:                              # Skill-scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/check.sh"
          once: true                # Run only once per session
---
```

### 4.2 Field Details

| Field | Type | Required | Constraints | Description |
|-------|------|:--------:|-------------|-------------|
| `name` | string | ✅ | Max 64 chars, `[a-z0-9-]` | Unique identifier |
| `description` | string | ✅ | Max 1024 chars | Trigger keywords + explanation |
| `allowed-tools` | string/list | ❌ | Valid tool names | Allowlist for tools |
| `model` | string | ❌ | Valid model ID | Override default model |
| `context` | string | ❌ | `"fork"` only | Run in isolated context |
| `agent` | string | ❌ | Agent name | Agent type for forked context |
| `user-invocable` | boolean | ❌ | Default: true | Show in `/skill` menu |
| `hooks` | object | ❌ | Valid hook config | Skill-scoped lifecycle hooks |

### 4.3 Skill Activation Mechanisms

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill Activation Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AUTOMATIC DISCOVERY (Primary)                                │
│     User request → Claude reads descriptions → Match found       │
│     → Claude asks permission → Full SKILL.md loaded              │
│                                                                  │
│  2. MANUAL INVOCATION                                            │
│     User types /skill-name → Immediate activation                │
│     (Blocked if user-invocable: false)                           │
│                                                                  │
│  3. PROGRAMMATIC (via Skill tool)                                │
│     Claude calls Skill tool → Activation                         │
│     (Blocked if disable-model-invocation: true)                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.4 Best Practices for Skills

**DO**:
- Include multilingual trigger keywords in description
- Keep SKILL.md under 500 lines (use supporting files)
- Use `once: true` for initialization hooks
- Restrict tools with `allowed-tools` when possible

**DON'T**:
- Use vague descriptions ("helps with code")
- Put entire documentation in SKILL.md (use progressive disclosure)
- Define hooks that conflict with global hooks

### 4.5 Example: bkit-rules Skill

```yaml
---
name: bkit-rules
description: |
  Core rules for bkit plugin. PDCA methodology, level detection,
  agent auto-triggering, and code quality standards.

  Triggers: bkit, PDCA, develop, implement, feature, bug, code,
  개발, 기능, 버그, 開発, 機能, 开发, 功能
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
---
```

---

## 5. Agents Frontmatter Reference

### 5.1 Complete Frontmatter Schema

```yaml
---
# REQUIRED
name: agent-name                    # Unique identifier
description: |                      # When to delegate to this agent
  Agent purpose and capabilities.
  Include "use proactively" for auto-delegation.

  Triggers: keyword1, keyword2, 키워드

# OPTIONAL
tools: Read, Glob, Grep             # Allowed tools (allowlist)
disallowedTools: Write, Edit        # Denied tools (denylist)
model: sonnet                       # sonnet|opus|haiku|inherit
permissionMode: default             # Permission handling mode
skills: skill1, skill2              # Skills to inject
hooks:                              # Agent-scoped hooks
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "./scripts/validate.sh"
  Stop:
    - hooks:
        - type: prompt
          prompt: "Evaluate if task is complete..."
---
```

### 5.2 Field Details

| Field | Type | Required | Options | Description |
|-------|------|:--------:|---------|-------------|
| `name` | string | ✅ | `[a-z-]+` | Unique identifier |
| `description` | string | ✅ | Free text | Delegation trigger + purpose |
| `tools` | string/list | ❌ | Tool names | Allowed tools only |
| `disallowedTools` | string/list | ❌ | Tool names | Denied tools |
| `model` | string | ❌ | `sonnet\|opus\|haiku\|inherit` | AI model selection |
| `permissionMode` | string | ❌ | See below | Permission handling |
| `skills` | string/list | ❌ | Skill names | Auto-load skills |
| `hooks` | object | ❌ | Hook config | Agent-scoped hooks |

### 5.3 Permission Modes

| Mode | Behavior | Use Case |
|------|----------|----------|
| `default` | Standard permission prompts | Normal interactive agents |
| `plan` | Read-only exploration | Analysis agents (gap-detector) |
| `acceptEdits` | Auto-accept file edits | Automated refactoring |
| `dontAsk` | Auto-deny all prompts | Background tasks |
| `bypassPermissions` | Skip all checks | **Use with extreme caution** |

### 5.4 Model Selection Guide

| Model | Speed | Capability | Cost | Best For |
|-------|:-----:|:----------:|:----:|----------|
| `haiku` | Fast | Basic | Low | Read-only exploration |
| `sonnet` | Balanced | Good | Medium | Most agents (default) |
| `opus` | Slow | Best | High | Complex analysis, architecture |
| `inherit` | Parent | Parent | Parent | Match conversation model |

### 5.5 Agent Triggering

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Delegation Flow                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  AUTOMATIC (based on description matching):                      │
│  User: "Analyze design-implementation gap"                       │
│  Claude: Matches "gap-detector" description → Delegates          │
│                                                                  │
│  EXPLICIT:                                                       │
│  User: "Use the code-analyzer agent to review this"              │
│  Claude: Direct delegation to named agent                        │
│                                                                  │
│  PROGRAMMATIC:                                                   │
│  Claude decides Task tool delegation based on task type          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 5.6 Example: gap-detector Agent

```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents and implementation.
  Key role in PDCA Check phase.

  Use proactively when user requests comparison or gap analysis.

  Triggers: gap analysis, design-implementation check, 갭 분석, ギャップ分析
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
  - phase-2-convention
---
```

---

## 6. Known Issues & Workarounds

### 6.1 Critical Issues Summary

| Issue | Severity | Status | Workaround |
|-------|:--------:|:------:|------------|
| Hooks not loading | High | Open | Configure before session start |
| Infinite loop with Stop hooks | Critical | Closed (dup) | Avoid aggressive Stop hooks |
| PreToolUse not firing | High | Partial fix | Use skill-scoped hooks |
| Template variables not interpolating | Medium | Known | Use stdin JSON instead |
| Hooks fail after `cd` | Medium | Open | Use absolute paths |

### 6.2 Issue Details & Solutions

#### Issue 1: Hooks Not Loading ([#11544](https://github.com/anthropics/claude-code/issues/11544))

**Symptom**: `/hooks` shows "No hooks configured" despite valid configuration

**Root Cause**: Claude Code takes a snapshot of hooks at session start. Changes during session are not reflected.

**Solution**:
```bash
# Configure hooks BEFORE starting session
# OR use /hooks command to reload during session
```

#### Issue 2: Infinite Loop with Stop Hooks ([#10205](https://github.com/anthropics/claude-code/issues/10205))

**Symptom**: Claude enters infinite loop when Stop hooks are enabled

**Root Cause**: Stop hook evaluation can trigger more Stop events

**Solution**:
```json
// AVOID aggressive Stop hooks
// Instead, use PostToolUse for suggestions

// ❌ BAD: Blocking Stop hook
{
  "Stop": [{
    "hooks": [{
      "type": "prompt",
      "prompt": "You must verify all tasks are complete..."
    }]
  }]
}

// ✅ GOOD: Non-blocking PostToolUse suggestion
{
  "PostToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/scripts/suggest-next.sh"
    }]
  }]
}
```

#### Issue 3: PreToolUse/PostToolUse Not Executing ([#6305](https://github.com/anthropics/claude-code/issues/6305))

**Symptom**: Tool hooks never fire despite correct configuration

**Root Cause**: Hook infrastructure exists but trigger mechanism can fail

**Solution**:
```yaml
# Use skill-scoped hooks instead of global hooks
# In skills/bkit-rules/SKILL.md:
---
name: bkit-rules
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
---
```

#### Issue 4: Exit Code 2 Not Blocking ([#2814](https://github.com/anthropics/claude-code/issues/2814))

**Symptom**: Non-zero exit codes don't block tool execution

**Root Cause**: Must use exit code `2` specifically, or JSON output with `decision: "block"`

**Solution**:
```bash
#!/bin/bash
# Exit code 2 = block
if [ some_condition ]; then
    echo "Validation failed: reason" >&2
    exit 2  # MUST be 2 to block
fi

# OR use JSON output
echo '{"decision": "block", "reason": "Validation failed"}'
exit 0
```

#### Issue 5: Hooks Fail After `cd` Commands ([#5176](https://github.com/anthropics/claude-code/issues/5176))

**Symptom**: Relative paths in hooks break after directory change

**Solution**:
```bash
# Always use absolute paths or environment variables
# ❌ BAD
"command": "./scripts/check.sh"

# ✅ GOOD
"command": "${CLAUDE_PLUGIN_ROOT}/scripts/check.sh"
```

### 6.3 Stability Recommendations

```
┌─────────────────────────────────────────────────────────────────┐
│                  Hook Stability Matrix                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ✅ STABLE (Recommended)                                         │
│  ├── SessionStart (command type)                                 │
│  ├── PreToolUse (command type, skill-scoped)                     │
│  └── PostToolUse (command type, non-blocking)                    │
│                                                                  │
│  ⚠️ USE WITH CAUTION                                             │
│  ├── Stop (prompt type) - Can cause loops                        │
│  ├── SubagentStop (prompt type) - Similar risks                  │
│  └── UserPromptSubmit - Path issues in subdirectories            │
│                                                                  │
│  ❌ AVOID                                                         │
│  ├── Aggressive blocking in Stop hooks                           │
│  ├── Prompt-type hooks for PreToolUse/PostToolUse                │
│  └── Complex chained hook dependencies                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. bkit Implementation Strategy

### 7.1 Recommended Architecture

```
bkit/
├── hooks/
│   └── hooks.json              # Minimal: SessionStart only
│
├── skills/
│   └── bkit-rules/
│       └── SKILL.md            # Contains PreToolUse/PostToolUse hooks
│
├── agents/
│   └── *.md                    # Agent-specific hooks in frontmatter
│
├── scripts/
│   ├── session-start.sh        # Welcome + env setup
│   ├── pre-write.sh            # PDCA check (non-blocking for minor)
│   └── pdca-post-write.sh      # Next step suggestions
│
└── lib/
    └── common.sh               # Shared utilities
```

### 7.2 Hook Strategy by Event

#### SessionStart (Global - hooks.json)

**Purpose**: Welcome message, environment detection, AskUserQuestion prompt

```json
{
  "SessionStart": [{
    "once": true,
    "hooks": [{
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
      "timeout": 5000
    }]
  }]
}
```

**Script Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "Welcome to bkit!\n\nUse AskUserQuestion to ask: 'What kind of help do you need?'"
  }
}
```

#### PreToolUse (Skill-Scoped - bkit-rules)

**Purpose**: PDCA document check, task classification, convention hints

**Strategy**:
- Block only for `major_feature` without design doc
- Provide context hints for everything else

```bash
#!/bin/bash
# Classify by content size
if [ "$content_length" -gt 1000 ] && [ -z "$design_doc" ]; then
    # Block major features without design
    echo '{"decision": "block", "reason": "Design document required..."}'
    exit 0
fi

# Otherwise, provide helpful context
echo '{"hookSpecificOutput": {"additionalContext": "PDCA hint: ..."}}'
exit 0
```

#### PostToolUse (Skill-Scoped - bkit-rules)

**Purpose**: Suggest next steps after implementation

**Strategy**: Non-blocking suggestions only

```bash
#!/bin/bash
# Check if design doc exists for gap analysis suggestion
if [ -f "$design_doc" ]; then
    echo '{"hookSpecificOutput": {"additionalContext": "Consider running /pdca-analyze when done."}}'
fi
exit 0
```

#### Stop (Agent-Scoped Only - If Needed)

**Purpose**: Critical completion verification for specific agents

**Strategy**: Use sparingly, only for specific agents like `gap-detector`

```yaml
# In agents/gap-detector.md
hooks:
  Stop:
    - hooks:
        - type: prompt
          model: sonnet
          prompt: "Verify analysis is complete with match percentage calculated."
```

### 7.3 PDCA Enforcement Levels

```
┌─────────────────────────────────────────────────────────────────┐
│                  PDCA Enforcement by Task Size                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Quick Fix (< 50 chars)                                          │
│  └── No PDCA required, execute immediately                       │
│                                                                  │
│  Minor Change (50-200 chars)                                     │
│  └── PDCA Lite: Show summary, proceed automatically              │
│                                                                  │
│  Feature (200-1000 chars)                                        │
│  └── Standard PDCA: Check design doc, suggest if missing         │
│                                                                  │
│  Major Feature (> 1000 chars)                                    │
│  └── Strict PDCA: Require design doc, block if missing           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.4 Skill Auto-Activation Strategy

**Key Principle**: Broad trigger keywords enable automatic skill activation without user commands

```yaml
# In skills/bkit-rules/SKILL.md
description: |
  Core rules for bkit plugin...

  Triggers: bkit, PDCA, develop, implement, feature, bug, code, design,
  개발, 기능, 버그, 코드, 設計, 機能, 开发, 功能
```

**Trigger Keyword Categories**:
- Development actions: develop, implement, create, build, fix
- PDCA terms: plan, design, analyze, check, report
- Code terms: code, function, component, API, feature
- Multilingual: 개발, 기능, 開発, 机能, desarrollo, développement

### 7.5 Agent Auto-Invocation Strategy

**Key Principle**: Include "use proactively" in description for auto-delegation

```yaml
# In agents/gap-detector.md
description: |
  Agent that detects gaps between design and implementation.

  Use proactively when user requests gap analysis or after implementation.

  Triggers: gap analysis, compare design, verify implementation, 갭 분석
```

---

## 8. Testing & Debugging

### 8.1 Pre-Deployment Checklist

```
□ Hook Configuration
  □ hooks.json is valid JSON
  □ All script paths use ${CLAUDE_PLUGIN_ROOT}
  □ Scripts have execute permissions (chmod +x)
  □ Exit codes are correct (0=success, 2=block)

□ Skills
  □ SKILL.md exists in each skill directory
  □ name field is <= 64 characters, lowercase + hyphens
  □ description field is <= 1024 characters
  □ Trigger keywords are multilingual

□ Agents
  □ Frontmatter is valid YAML
  □ tools/disallowedTools are valid tool names
  □ permissionMode is valid
  □ skills reference existing skills

□ Scripts
  □ Read stdin (cat) even if not using input
  □ Output valid JSON
  □ Handle missing dependencies gracefully
```

### 8.2 Debug Mode

```bash
# Start Claude Code with debug logging
claude --debug

# Check hook registration
/hooks

# Verbose mode for hook execution
# Press Ctrl+O during session
```

### 8.3 Manual Script Testing

```bash
# Test hook script manually
echo '{"tool_name":"Write","tool_input":{"file_path":"test.ts","content":"..."}}' | ./scripts/pre-write.sh

# Check exit code
echo $?

# Validate JSON output
echo '{"tool_name":"Write"...}' | ./scripts/pre-write.sh | jq .
```

### 8.4 Common Debug Scenarios

| Symptom | Check | Solution |
|---------|-------|----------|
| Hook not firing | `/hooks` command | Restart session or use `/hooks` to reload |
| Script error | `chmod +x script.sh` | Add execute permission |
| JSON parse error | `jq .` on output | Fix JSON escaping |
| Path not found | Use absolute paths | Replace `./` with `${CLAUDE_PLUGIN_ROOT}/` |
| Infinite loop | Check Stop hooks | Remove or simplify Stop hooks |

---

## Appendix A: Quick Reference Cards

### Hook Output Templates

```bash
# Allow with context
echo '{"hookSpecificOutput":{"additionalContext":"Your message"}}'
exit 0

# Block with reason
echo '{"decision":"block","reason":"Why blocked"}'
exit 0

# Block via exit code (stderr shown as error)
echo "Error message" >&2
exit 2

# Empty response (allow, no context)
echo '{}'
exit 0
```

### Skill Frontmatter Template

```yaml
---
name: skill-name
description: |
  Brief description of skill purpose.

  Triggers: keyword1, keyword2, 한국어, 日本語, 中文
allowed-tools: Read, Grep, Glob
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/check.sh"
          once: true
---
```

### Agent Frontmatter Template

```yaml
---
name: agent-name
description: |
  Agent purpose and when to use.

  Use proactively when user requests X or Y.

  Triggers: trigger1, trigger2, 트리거, トリガー
model: sonnet
permissionMode: default
tools:
  - Read
  - Glob
  - Grep
disallowedTools:
  - Write
  - Edit
skills:
  - related-skill
---
```

---

## Appendix B: GitHub Issue References

| Issue | Title | Status | Key Insight |
|-------|-------|--------|-------------|
| [#11544](https://github.com/anthropics/claude-code/issues/11544) | Hooks not loading from settings.json | Open | Configure before session start |
| [#16326](https://github.com/anthropics/claude-code/issues/16326) | Claude doesn't acknowledge hooks | Open | Hooks execute but not internalized |
| [#2814](https://github.com/anthropics/claude-code/issues/2814) | Hooks System Issues | Closed | Exit code 2 for blocking |
| [#10205](https://github.com/anthropics/claude-code/issues/10205) | Infinite loop with hooks | Closed (dup) | Avoid aggressive Stop hooks |
| [#6305](https://github.com/anthropics/claude-code/issues/6305) | PreToolUse/PostToolUse not executing | Partial | Use skill-scoped hooks |
| [#5176](https://github.com/anthropics/claude-code/issues/5176) | Hooks fail after cd | Open | Use absolute paths |
| [#8810](https://github.com/anthropics/claude-code/issues/8810) | UserPromptSubmit from subdirectories | Open | Use project-level config |

---

## Appendix C: Version Compatibility Notes

| Claude Code Version | Hook Support | Notes |
|---------------------|--------------|-------|
| v1.0.89+ | Full | Current reference version |
| < v1.0.80 | Partial | PreToolUse may not fire |
| Plugin Beta (Oct 2025+) | Full | Plugin hooks supported |

---

## Changelog

### v1.0.0 (2026-01-20)
- Initial comprehensive guide
- Covers hooks, skills, agents, commands
- Documents known issues and workarounds
- Provides bkit implementation strategy

---

> **Note**: Claude Code is actively developed. This guide should be updated when new versions introduce changes to the hooks or plugin system.
>
> **Maintenance Recommendation**: Check GitHub issues monthly for new bug reports and solutions.
