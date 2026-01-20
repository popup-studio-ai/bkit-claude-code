# Hooks Overview

> Hook events triggered during Claude Code operations (v1.2.0)

## What are Hooks?

Hooks are **scripts that automatically execute on specific Claude Code events**.
- Defined in `hooks/hooks.json`
- Execute shell scripts on event triggers
- Return allow/block decisions with additional context

## Hook Configuration

All hooks are defined in `hooks/hooks.json`:

```json
{
  "hooks": [
    {
      "event": "SessionStart",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
        "timeout": 5000
      }],
      "once": true
    },
    {
      "event": "PreToolUse",
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh",
        "timeout": 5000
      }]
    },
    {
      "event": "PostToolUse",
      "matcher": "Write",
      "hooks": [{
        "type": "command",
        "command": "${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh",
        "timeout": 5000
      }]
    }
  ]
}
```

## Hook Events (3 Active)

### 1. SessionStart

**Trigger**: Once when bkit plugin loads

| Script | Purpose |
|--------|---------|
| `hooks/session-start.sh` | Initialize session, load bkit.config.json |

**Usage**:
- Initial environment setup
- User greeting and options
- Project level detection

### 2. PreToolUse

**Trigger**: Before Write/Edit tool operations

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write\|Edit` | `scripts/pre-write.sh` | PDCA check, task classification, convention hints |

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

### 3. PostToolUse

**Trigger**: After Write tool operations complete

| Matcher | Script | Purpose |
|---------|--------|---------|
| `Write` | `scripts/pdca-post-write.sh` | Guide next steps after file write |

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
    ├─ pre-write.sh
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
    └─ pdca-post-write.sh
        ├─ Extract feature name
        └─ Suggest gap analysis
```

## Script Dependencies

| Hook | Script | Dependencies |
|------|--------|--------------|
| SessionStart | `session-start.sh` | `lib/common.sh`, `bkit.config.json` |
| PreToolUse | `pre-write.sh` | `lib/common.sh`, `bkit.config.json` |
| PostToolUse | `pdca-post-write.sh` | `lib/common.sh` |

## Additional Scripts (Not in hooks.json)

These scripts are available for skill frontmatter hooks or manual use:

### Phase Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `phase2-convention-pre.sh` | PreToolUse | Convention check |
| `phase4-api-stop.sh` | Stop | Zero Script QA guidance |
| `phase5-design-post.sh` | PostToolUse | Design token verification |
| `phase6-ui-post.sh` | PostToolUse | Layer separation check |
| `phase8-review-stop.sh` | Stop | Review summary |
| `phase9-deploy-pre.sh` | PreToolUse | Environment validation |

### QA Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `qa-pre-bash.sh` | PreToolUse | QA setup before Bash |
| `qa-monitor-post.sh` | PostToolUse | QA completion guidance |
| `qa-stop.sh` | Stop | QA session cleanup |

### Agent Scripts

| Script | Event | Purpose |
|--------|-------|---------|
| `design-validator-pre.sh` | PreToolUse | Design document validation |
| `gap-detector-post.sh` | PostToolUse | Gap analysis guidance |
| `analysis-stop.sh` | Stop | Analysis completion |

## Hook Script Writing Rules

### Standard Structure

```bash
#!/bin/bash
set -e

# Source common utilities
source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"

# Read JSON input from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Condition check
if [[ condition ]]; then
    output_block "Block reason"
else
    output_allow "Guidance message"
fi
```

### Output Rules

1. Must output **valid JSON**
2. `decision`: `"allow"` or `"block"`
3. `reason` required when `block`
4. `additionalContext` is passed to Claude

### Helper Functions (lib/common.sh)

```bash
output_allow "message"   # Allow with context
output_block "reason"    # Block with reason
output_empty            # Allow without context
```

## Related Documents

- [[../scripts/_scripts-overview]] - Script details
- [[../skills/_skills-overview]] - Skill details
- [[../../triggers/trigger-matrix]] - Trigger matrix
