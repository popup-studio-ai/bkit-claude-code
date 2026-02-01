# Hooks Overview

> Hook events triggered during Claude Code operations
>
> **v1.5.0**: Claude Code Exclusive - Gemini CLI support removed
> **v1.4.7**: Task Management Integration - triggerNextPdcaAction, Task Chain Auto-Creation
> **v1.4.6**: Sub-agent call stability with `bkit:` prefix
> **v1.4.5**: Archive action support, 8-language trigger system
> **v1.4.4**: hooks-json-integration - all hooks centralized in hooks.json with unified handlers
> **v1.4.2**: Added UserPromptSubmit (FR-04) and PreCompact (FR-07) hook events
> **v1.4.1**: Added Context Engineering perspective - 5-Layer Hook System
> **v1.3.1**: All hooks converted from Bash (.sh) to Node.js (.js) for cross-platform compatibility

## What are Hooks?

Hooks are **scripts that automatically execute on specific Claude Code events**.

**Two Hook Sources:**
1. **Global Hooks** (`hooks/hooks.json`) - Apply to all sessions
2. **Skill Frontmatter Hooks** - Defined in SKILL.md/AGENT.md YAML frontmatter

## Context Engineering Perspective (v1.4.1)

Hooks are the core of bkit's **context injection system**, organized into 5 layers according to [[../../philosophy/context-engineering|Context Engineering]] principles.

### 5-Layer Hook System

```
┌─────────────────────────────────────────────────────────────────┐
│                    5-Layer Hook System (v1.4.2)                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: hooks.json (Global)                                   │
│           └── SessionStart, UserPromptSubmit, PreCompact        │
│               PreToolUse (Write|Edit), PostToolUse (Write)      │
│                                                                  │
│  Layer 2: Skill Frontmatter                                     │
│           └── hooks: { PreToolUse, PostToolUse, Stop }          │
│                                                                  │
│  Layer 3: Agent Frontmatter                                     │
│           └── hooks: { PreToolUse, PostToolUse, Stop }          │
│                                                                  │
│  Layer 4: Description Triggers                                  │
│           └── "Triggers:" keyword matching (8 languages)        │
│                                                                  │
│  Layer 5: Scripts (28 modules)                                  │
│           └── Actual Node.js logic execution                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Injection by Hook Event

| Event | Timing | Injection Type |
|-------|--------|----------------|
| **SessionStart** | Session start | Onboarding, PDCA status, trigger table |
| **UserPromptSubmit** | Before AI processing (v1.4.2) | Intent detection, agent/skill triggers, ambiguity score |
| **PreToolUse** | Before tool execution | Validation checklist, convention hints, permission check |
| **PostToolUse** | After tool execution | Next step guide, analysis suggestions |
| **PreCompact** | Before context compaction (v1.4.2) | PDCA state snapshot, context preservation |
| **Stop** | Agent termination | State transition, user choice prompt |

## Hook Events (v1.5.0 - Claude Code Exclusive)

| Hook Event | Description | Added |
|------------|-------------|:-----:|
| `SessionStart` | Session initialization | v1.0 |
| `UserPromptSubmit` | User input preprocessing | v1.4.2 |
| `PreToolUse` | Before tool execution | v1.0 |
| `PostToolUse` | After tool execution | v1.0 |
| `PreCompact` | Before context compaction | v1.4.2 |
| `Stop` | Agent completion | v1.0 |

## Hook Architecture (v1.4.2)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Hook Sources                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  hooks/hooks.json (Global)              skills/*/SKILL.md (Local)   │
│  ┌───────────────────────────────┐      ┌─────────────────────┐     │
│  │ SessionStart                  │      │ PreToolUse          │     │
│  │   └─ session-start.js         │      │ PostToolUse         │     │
│  │ UserPromptSubmit (v1.4.2)     │      │ Stop                │     │
│  │   └─ user-prompt-handler.js   │      └─────────────────────┘     │
│  │ PreToolUse (Write|Edit)       │                                  │
│  │   └─ pre-write.js             │      agents/*.md (Local)         │
│  │ PostToolUse (Write)           │      ┌─────────────────────┐     │
│  │   └─ pdca-post-write.js       │      │ PreToolUse          │     │
│  │ PreCompact (v1.4.2)           │      │ PostToolUse         │     │
│  │   └─ context-compaction.js    │      │ context: fork       │     │
│  └───────────────────────────────┘      └─────────────────────┘     │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Global Hooks Configuration

Global hooks are defined in `hooks/hooks.json` (v1.4.4 includes 6 hook events with unified handlers):

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "bkit Vibecoding Kit - Global hooks for PDCA workflow enforcement",
  "hooks": {
    "SessionStart": [
      {
        "once": true,
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js", "timeout": 5000 }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-handler.js", "timeout": 3000 }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js", "timeout": 5000 }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.js", "timeout": 5000 }
        ]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [
          { "type": "command", "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js", "timeout": 5000 }
        ]
      }
    ]
  }
}
```

> **Note**: v1.4.2 adds `UserPromptSubmit` (FR-04) for user input preprocessing and `PreCompact` (FR-07) for PDCA state preservation during context compaction. Skill/Agent frontmatter can define additional hooks for contextual features.

## Hook Events

### 1. SessionStart (Global - hooks.json)

**Trigger**: Once when bkit plugin loads

| Script | Purpose |
|--------|---------|
| `hooks/session-start.js` | Initialize session, detect project level, guide user with AskUserQuestion |

**Features**:
- Project level detection (Starter/Dynamic/Enterprise)
- PDCA phase detection from `docs/.pdca-status.json`
- Environment persistence via `CLAUDE_ENV_FILE`
- AskUserQuestion guidance with 4 options:
  1. Learn bkit - Introduction and 9-stage pipeline
  2. Learn Claude Code - Setup and usage guide
  3. Continue Previous Work - Resume from PDCA status
  4. Start New Project - Initialize new project

**Output**:
```json
{
  "systemMessage": "bkit Vibecoding Kit activated",
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "# bkit Vibecoding Kit - Required Startup Procedure..."
  }
}
```

### 2. UserPromptSubmit (Global - hooks.json) (v1.4.2)

**Trigger**: When user submits a prompt, before AI processing
**Defined in**: `hooks/hooks.json` (global)

| Script | Purpose |
|--------|---------|
| `scripts/user-prompt-handler.js` | Intent detection, agent/skill triggers, ambiguity scoring |

**Features** (FR-04):
- Feature intent detection from user message
- Implicit agent trigger matching (8 languages)
- Implicit skill trigger matching
- Ambiguity score calculation

**Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Detected intent: new feature 'auth-system'. Suggested: pdca-plan"
  }
}
```

### 3. PreToolUse (Global + Skill Frontmatter)

**Trigger**: Before Write/Edit tool operations
**Defined in**: `hooks/hooks.json` (global) + Skill YAML frontmatter (contextual)

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write\|Edit` | `scripts/pre-write.js` | PDCA check, task classification, convention hints |

**Input (stdin JSON)**:
```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  }
}
```

**Output (stdout JSON)**:
```json
{
  "decision": "allow|block",
  "reason": "Block reason (if blocked)",
  "hookSpecificOutput": {
    "additionalContext": "Context passed to Claude"
  }
}
```

### 4. PostToolUse (Global + Skill Frontmatter)

**Trigger**: After Write tool operations complete
**Defined in**: `hooks/hooks.json` (global) + Skill YAML frontmatter (contextual)

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write` | `scripts/pdca-post-write.js` | Guide next steps after file write |

**Usage**:
- Post-operation guidance
- Next step suggestions
- Issue detection and notification

### 5. PreCompact (Global - hooks.json) (v1.4.2)

**Trigger**: Before context compaction (auto or manual)
**Defined in**: `hooks/hooks.json` (global)

| Matcher | Script | Purpose |
|---------|--------|---------|
| `auto\|manual` | `scripts/context-compaction.js` | PDCA state snapshot and preservation |

**Features** (FR-07):
- Creates PDCA state snapshot to `docs/.pdca-snapshots/`
- Automatic cleanup (keeps 10 most recent snapshots)
- Outputs state summary for context restoration

**Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreCompact",
    "additionalContext": "PDCA state preserved. Active: auth-system (design phase)"
  }
}
```

## Hook Flow Diagram (v1.4.2)

```
SessionStart (once)
    │
    ├─ session-start.js
    │   ├─ Context hierarchy loading (FR-01)
    │   ├─ Import resolution (FR-02)
    │   ├─ Stale fork cleanup (FR-03)
    │   └─ Memory initialization (FR-08)
    │
    ▼
┌─────────────────────────────────────────┐
│            User Message                  │
└─────────────────────────────────────────┘
    │
    ▼
UserPromptSubmit (v1.4.2)
    ├─ user-prompt-handler.js
    │   ├─ Feature intent detection
    │   ├─ Agent/Skill trigger matching
    │   └─ Ambiguity scoring
    │
    ▼
PreToolUse (Write|Edit)
    ├─ pre-write.js
    │   ├─ Permission check (FR-05)
    │   ├─ Task classification
    │   ├─ PDCA phase detection
    │   └─ Convention hints
    │
    ▼
┌─────────────────────────────────────────┐
│         Tool Execution                   │
│    (Write, Edit, Bash, etc.)            │
└─────────────────────────────────────────┘
    │
    ▼
PostToolUse (Write)
    └─ pdca-post-write.js
        ├─ Extract feature name
        └─ Suggest gap analysis
    │
    ▼
PreCompact (when context limit reached) (v1.4.2)
    └─ context-compaction.js
        ├─ PDCA state snapshot
        └─ Auto-cleanup (10 recent)
```

## Script Dependencies (v1.4.7)

| Hook | Script | Dependencies |
|------|--------|--------------|
| SessionStart | `session-start.js` | `lib/common.js` (→ `lib/core/`, `lib/pdca/`, `lib/intent/`) |
| UserPromptSubmit | `user-prompt-handler.js` | `lib/common.js` (→ `lib/intent/`) |
| PreToolUse | `pre-write.js` | `lib/common.js` (→ `lib/pdca/`, `lib/task/`) |
| PostToolUse | `pdca-post-write.js` | `lib/common.js` (→ `lib/pdca/`) |
| PreCompact | `context-compaction.js` | `lib/common.js` (→ `lib/pdca/`) |
| Stop (gap-detector) | `gap-detector-stop.js` | `lib/common.js` (→ `lib/task/`) |
| Stop (iterator) | `iterator-stop.js` | `lib/common.js` (→ `lib/task/`) |
| Stop (pdca-skill) | `pdca-skill-stop.js` | `lib/common.js` (→ `lib/task/`) |

**Note (v1.4.7)**: `lib/common.js` acts as Migration Bridge, re-exporting all modules for backward compatibility.

## Additional Scripts (Not in hooks.json)

These scripts are available for skill frontmatter hooks or manual use:

### Phase Scripts (11)

| Script | Event | Purpose |
|--------|-------|---------|
| `phase-transition.js` | - | PDCA phase transition validation (v1.4.0) |
| `phase1-schema-stop.js` | Stop | Schema phase completion (v1.4.0) |
| `phase2-convention-pre.js` | PreToolUse | Convention check |
| `phase2-convention-stop.js` | Stop | Convention phase completion (v1.4.0) |
| `phase3-mockup-stop.js` | Stop | Mockup phase completion (v1.4.0) |
| `phase4-api-stop.js` | Stop | Zero Script QA guidance |
| `phase5-design-post.js` | PostToolUse | Design token verification |
| `phase6-ui-post.js` | PostToolUse | Layer separation check |
| `phase7-seo-stop.js` | Stop | SEO/Security phase completion (v1.4.0) |
| `phase8-review-stop.js` | Stop | Review summary |
| `phase9-deploy-pre.js` | PreToolUse | Environment validation |

### QA Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `qa-pre-bash.js` | PreToolUse | QA setup before Bash |
| `qa-monitor-post.js` | PostToolUse | QA completion guidance |
| `qa-stop.js` | Stop | QA session cleanup |

### Agent Scripts (v1.4.7)

| Script | Event | Agent | Purpose |
|--------|-------|-------|---------|
| `design-validator-pre.js` | PreToolUse | design-validator | Design document validation |
| `gap-detector-stop.js` | Stop | gap-detector | Check-Act iteration: triggerNextPdcaAction (v1.4.7) |
| `iterator-stop.js` | Stop | pdca-iterator | Check-Act iteration: triggerNextPdcaAction (v1.4.7) |
| `pdca-skill-stop.js` | Stop | pdca skill | Task Chain Auto-Creation (v1.4.7) |
| `analysis-stop.js` | Stop | code-analyzer | Analysis completion guidance |
| `qa-pre-bash.js` | PreToolUse | qa-monitor | Block destructive commands |
| `qa-monitor-post.js` | PostToolUse | qa-monitor | Critical issue notification |
| `qa-stop.js` | Stop | qa-monitor | QA session cleanup |

> **Note**: `gap-detector-post.js` exists but is **not used** by gap-detector agent (only Stop hook is active).

## Hook Script Writing Rules

### Standard Structure (Node.js)

```javascript
#!/usr/bin/env node
const { readStdinSync, parseHookInput, outputAllow, outputBlock } = require('../lib/common.js');

// Read JSON input from stdin
const input = readStdinSync();
const { filePath, content } = parseHookInput(input);

// Condition check
if (condition) {
    outputBlock("Block reason");
} else {
    outputAllow("Guidance message");
}
```

### Output Rules

1. Must output **valid JSON**
2. `decision`: `"allow"` or `"block"`
3. `reason` required when `block`
4. `additionalContext` is passed to Claude

### Helper Functions (lib/common.js)

```javascript
outputAllow("message")   // Allow with context
outputBlock("reason")    // Block with reason (exits with code 2)
outputEmpty()            // Allow without context
```

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../scripts/_scripts-overview]] - Script details
- [[../skills/_skills-overview]] - Skill details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix
