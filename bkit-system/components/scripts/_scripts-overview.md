# Scripts Overview

> 19 Shell Scripts used by bkit hooks (v1.2.0)

## What are Scripts?

Scripts are **the actual logic executed by Hooks**.
- Referenced from hooks/hooks.json and skill frontmatter
- Receive JSON input via stdin, output JSON via stdout
- Provide allow/block decisions and additionalContext

## Source Location

All scripts are at root level (not in .claude/):

```
bkit-claude-code/
├── lib/
│   └── common.sh              # Shared utility library
├── scripts/
│   ├── pre-write.sh           # Core: Unified PreToolUse hook
│   ├── pdca-post-write.sh     # Core: PostToolUse guidance
│   ├── task-classify.sh       # Core: Task classification
│   ├── select-template.sh     # Core: Template selection
│   │
│   ├── phase2-convention-pre.sh   # Phase: Convention check
│   ├── phase4-api-stop.sh         # Phase: Zero Script QA
│   ├── phase5-design-post.sh      # Phase: Design token verify
│   ├── phase6-ui-post.sh          # Phase: Layer separation
│   ├── phase8-review-stop.sh      # Phase: Review summary
│   ├── phase9-deploy-pre.sh       # Phase: Deploy validation
│   │
│   ├── qa-pre-bash.sh             # QA: Bash setup
│   ├── qa-monitor-post.sh         # QA: Completion guidance
│   ├── qa-stop.sh                 # QA: Session cleanup
│   │
│   ├── design-validator-pre.sh    # Agent: Design validation
│   ├── gap-detector-post.sh       # Agent: Gap analysis guidance
│   ├── analysis-stop.sh           # Agent: Analysis completion
│   │
│   ├── pdca-pre-write.sh          # Legacy (use pre-write.sh)
│   ├── sync-folders.sh            # Utility: Folder sync
│   └── validate-plugin.sh         # Utility: Plugin validation
└── bkit.config.json           # Centralized configuration
```

## Script Categories

### Core Scripts (4)

| Script | Hook | Purpose |
|--------|------|---------|
| **pre-write.sh** | PreToolUse (Write\|Edit) | Unified hook: PDCA check + task classification + convention hints |
| **pdca-post-write.sh** | PostToolUse (Write) | Guide next steps, suggest gap analysis |
| **task-classify.sh** | - | Classify task size (Quick Fix → Major Feature) |
| **select-template.sh** | - | Select template based on level and document type |

### Phase Scripts (6)

| Script | Hook | Phase | Purpose |
|--------|------|-------|---------|
| phase2-convention-pre.sh | PreToolUse | Phase 2 | Convention check before write |
| phase4-api-stop.sh | Stop | Phase 4 | Zero Script QA guidance after API |
| phase5-design-post.sh | PostToolUse | Phase 5 | Design token verification |
| phase6-ui-post.sh | PostToolUse | Phase 6 | UI layer separation check |
| phase8-review-stop.sh | Stop | Phase 8 | Review completion summary |
| phase9-deploy-pre.sh | PreToolUse | Phase 9 | Deployment environment validation |

### QA Scripts (3)

| Script | Hook | Purpose |
|--------|------|---------|
| qa-pre-bash.sh | PreToolUse (Bash) | Block destructive commands during QA |
| qa-monitor-post.sh | PostToolUse | Critical issue notification |
| qa-stop.sh | Stop | QA session cleanup |

### Agent Scripts (3)

| Script | Hook | Agent | Purpose |
|--------|------|-------|---------|
| design-validator-pre.sh | PreToolUse | design-validator | Design document checklist |
| gap-detector-post.sh | PostToolUse | gap-detector | Post-analysis iteration guidance |
| analysis-stop.sh | Stop | code-analyzer | Analysis completion guidance |

### Utility Scripts (3)

| Script | Purpose | Usage |
|--------|---------|-------|
| pdca-pre-write.sh | Legacy script | Superseded by pre-write.sh |
| sync-folders.sh | Folder synchronization | Manual maintenance |
| validate-plugin.sh | Plugin validation | CI/CD or manual |

## Shared Library: lib/common.sh

All scripts can source common utilities:

```bash
source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"

# Configuration
get_config ".pdca.thresholds.quickFix" "50"   # Read config value
get_config_array ".sourceDirectories"          # Read array value

# File Classification
is_source_file "/path/to/file"                 # Check if source directory
is_code_file "/path/to/file.ts"                # Check code extension
is_env_file "/path/to/.env.local"              # Check env file

# Feature Detection
extract_feature "/src/features/auth/login.ts"  # Extract feature name
find_design_doc "auth"                         # Find design document
find_plan_doc "auth"                           # Find plan document

# Task Classification
classify_task "$content"                       # Classify by size
get_pdca_guidance "feature"                    # Get PDCA guidance

# Level Detection
detect_level                                   # Starter/Dynamic/Enterprise

# JSON Output
output_allow "context message"                 # Allow with context
output_block "block reason"                    # Block with reason
output_empty                                   # Empty response {}
```

## Script Input/Output

### Input (stdin)

JSON from PreToolUse/PostToolUse:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  }
}
```

### Output (stdout)

**Allow with context**:
```json
{
  "decision": "allow",
  "hookSpecificOutput": {
    "additionalContext": "Message passed to Claude"
  }
}
```

**Block**:
```json
{
  "decision": "block",
  "reason": "Block reason"
}
```

**No action**:
```json
{}
```

## Key Script Details

### pre-write.sh (Unified Hook)

```
Trigger: Write|Edit on source files

Actions (3 stages):

1. Task Classification
   - Measure content size
   - Reference bkit.config.json thresholds
   - < 50 chars → Quick Fix
   - < 200 chars → Minor Change
   - < 1000 chars → Feature (PDCA recommended)
   - >= 1000 chars → Major Feature (PDCA required)

2. PDCA Document Check
   - Extract feature name from file path
   - Check for design doc existence
   - If exists → "Reference design doc" guidance
   - If only plan → "Create design first" warning

3. Convention Hints
   - Code files → "Components=PascalCase, Functions=camelCase..."
   - Env files → "NEXT_PUBLIC_* (client), DB_* (database)..."

Output: All context combined into single JSON response
```

### qa-pre-bash.sh

```
Trigger: Bash commands during zero-script-qa

Actions:
1. Search for destructive patterns
   - rm -rf, DROP TABLE, DELETE FROM, etc.
2. If found → block
3. If safe → allow with "Safe in QA environment"
```

### phase5-design-post.sh

```
Trigger: Write on component files (components/, ui/)

Actions:
1. Search for hardcoded colors in content
   - #[0-9a-fA-F]{3,6}
   - rgb(, rgba(
2. If found → "Use design tokens" warning
3. If clean → "Design tokens correctly used" confirmation
```

## Script Writing Guide

### Required Elements

```bash
#!/bin/bash
set -e  # Exit on error

# Source common utilities
source "${CLAUDE_PLUGIN_ROOT}/lib/common.sh"

# Read JSON from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Logic...

# Must output JSON
output_allow "Guidance message"
```

### Best Practices

1. **Early exit**: Return `{}` quickly for irrelevant files
2. **Use jq**: Parse JSON with jq
3. **Minimize blocks**: Allow is default, block only when truly dangerous
4. **Concise messages**: Keep additionalContext brief

## Related Documents

- [[../hooks/_hooks-overview]] - Hook event details
- [[../skills/_skills-overview]] - Skill details
- [[../../triggers/trigger-matrix]] - Trigger matrix
