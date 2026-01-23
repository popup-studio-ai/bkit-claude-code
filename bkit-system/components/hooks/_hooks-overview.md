# Hooks Overview

> Hook events triggered during Claude Code operations (v1.3.1)
>
> **v1.3.1**: All hooks converted from Bash (.sh) to Node.js (.js) for cross-platform compatibility

## What are Hooks?

Hooks are **scripts that automatically execute on specific Claude Code events**.

**Two Hook Sources:**
1. **Global Hooks** (`hooks/hooks.json`) - Apply to all sessions
2. **Skill Frontmatter Hooks** - Defined in SKILL.md/AGENT.md YAML frontmatter

## Hook Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Hook Sources                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  hooks/hooks.json (Global)     skills/*/SKILL.md (Local)    │
│  ┌─────────────────────┐       ┌─────────────────────┐      │
│  │ SessionStart        │       │ PreToolUse          │      │
│  │ └─ session-start.js │       │ PostToolUse         │      │
│  └─────────────────────┘       │ Stop                │      │
│                                └─────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Global Hooks Configuration

Global hooks are defined in `hooks/hooks.json`:

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
    ]
  }
}
```

> **Note**: `SessionStart`, `PreToolUse`, and `PostToolUse` are all defined in `hooks/hooks.json` for global PDCA enforcement. Skill frontmatter can define additional hooks for contextual features.

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

### 2. PreToolUse (Global + Skill Frontmatter)

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

### 3. PostToolUse (Global + Skill Frontmatter)

**Trigger**: After Write tool operations complete
**Defined in**: `hooks/hooks.json` (global) + Skill YAML frontmatter (contextual)

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write` | `scripts/pdca-post-write.js` | Guide next steps after file write |

**Usage**:
- Post-operation guidance
- Next step suggestions
- Issue detection and notification

## Hook Flow Diagram

```
SessionStart (once)
    │
    ▼
┌─────────────────────────────────────────┐
│            User Action                   │
└─────────────────────────────────────────┘
    │
    ▼
PreToolUse (Write|Edit)
    ├─ pre-write.js
    │   ├─ Task classification (Quick Fix → Major Feature)
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
```

## Script Dependencies

| Hook | Script | Dependencies |
|------|--------|--------------|
| SessionStart | `session-start.js` | `lib/common.js`, `bkit.config.json` |
| PreToolUse | `pre-write.js` | `lib/common.js`, `bkit.config.json` |
| PostToolUse | `pdca-post-write.js` | `lib/common.js` |

## Additional Scripts (Not in hooks.json)

These scripts are available for skill frontmatter hooks or manual use:

### Phase Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `phase2-convention-pre.js` | PreToolUse | Convention check |
| `phase4-api-stop.js` | Stop | Zero Script QA guidance |
| `phase5-design-post.js` | PostToolUse | Design token verification |
| `phase6-ui-post.js` | PostToolUse | Layer separation check |
| `phase8-review-stop.js` | Stop | Review summary |
| `phase9-deploy-pre.js` | PreToolUse | Environment validation |

### QA Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `qa-pre-bash.js` | PreToolUse | QA setup before Bash |
| `qa-monitor-post.js` | PostToolUse | QA completion guidance |
| `qa-stop.js` | Stop | QA session cleanup |

### Agent Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `design-validator-pre.js` | PreToolUse | Design document validation |
| `gap-detector-post.js` | PostToolUse | Gap analysis guidance |
| `gap-detector-stop.js` | Stop | Gap detector completion |
| `iterator-stop.js` | Stop | Iterator completion |
| `analysis-stop.js` | Stop | Analysis completion |

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

- [[../scripts/_scripts-overview]] - Script details
- [[../skills/_skills-overview]] - Skill details
- [[../../triggers/trigger-matrix]] - Trigger matrix
