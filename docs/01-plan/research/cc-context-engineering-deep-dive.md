# Claude Code Context Engineering Deep Dive

> Research Document for bkit v1.5.8 Customization Abstraction Layer
> Researcher: cc-researcher | Date: 2026-03-01
> Sources: Official Anthropic Docs (code.claude.com), Claude Code GitHub, CHANGELOG

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Skills System](#2-skills-system)
3. [Agents (Subagents) System](#3-agents-subagents-system)
4. [Hooks System](#4-hooks-system)
5. [Commands System](#5-commands-system)
6. [Memory System](#6-memory-system)
7. [CLAUDE.md System](#7-claudemd-system)
8. [Configuration Hierarchy](#8-configuration-hierarchy)
9. [Plugin System](#9-plugin-system)
10. [Feature Stability Matrix](#10-feature-stability-matrix)
11. [Implications for bkit Customization](#11-implications-for-bkit-customization)

---

## 1. Executive Summary

Claude Code provides **8 primary context engineering surfaces** that collectively form the customization layer:

| Surface | Config Path | Stable API | bkit Usage |
|---------|-------------|------------|------------|
| Skills | `.claude/skills/*/SKILL.md` | Stable (v2.1.45+) | 22 + 5 bkend |
| Agents | `.claude/agents/*.md` | Stable (v2.1.49+) | 16 agents |
| Hooks | `settings.json → hooks` | Stable (v2.1.38+) | 10/17 events |
| Commands | `.claude/commands/*.md` | Legacy (merged into Skills) | Migrated |
| Auto-Memory | `~/.claude/projects/*/memory/` | Stable (v2.1.59+) | Separate |
| CLAUDE.md | `CLAUDE.md`, `.claude/CLAUDE.md` | Stable (v1.0+) | Active |
| Rules | `.claude/rules/*.md` | Stable | Not used |
| Plugin | `.claude-plugin/plugin.json` | Stable (v2.1.45+) | Active |

**Key Finding**: All 8 surfaces are now stable API. The last significant addition was HTTP hooks (v2.1.63). No breaking changes across 30 consecutive releases (v2.1.34~v2.1.63).

---

## 2. Skills System

### 2.1 Overview

Skills are **filesystem-based reusable resources** that provide Claude with domain-specific expertise. They follow the [Agent Skills](https://agentskills.io) open standard.

**Key Concept**: Custom slash commands have been **merged into skills**. A file at `.claude/commands/review.md` and a skill at `.claude/skills/review/SKILL.md` both create `/review` and work identically.

### 2.2 SKILL.md Format

Every skill requires a `SKILL.md` file with two parts:

```yaml
---
# YAML Frontmatter (between --- markers)
name: my-skill
description: What this skill does and when to use it
---

# Markdown Content (instructions Claude follows)
Your skill instructions here...
```

### 2.3 Complete Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | No | string | Display name (lowercase, hyphens, max 64 chars). Defaults to directory name |
| `description` | Recommended | string | What the skill does. Claude uses this for auto-invocation. Defaults to first paragraph |
| `argument-hint` | No | string | Hint shown during autocomplete. E.g., `[issue-number]` |
| `disable-model-invocation` | No | boolean | `true` = only user can invoke. Default: `false` |
| `user-invocable` | No | boolean | `false` = hidden from `/` menu. Default: `true` |
| `allowed-tools` | No | string/list | Tools Claude can use without permission when skill is active |
| `model` | No | string | Model to use when skill is active |
| `context` | No | string | `fork` = run in forked subagent context |
| `agent` | No | string | Which subagent type when `context: fork`. Options: `Explore`, `Plan`, `general-purpose`, or custom |
| `hooks` | No | object | Hooks scoped to skill lifecycle |

### 2.4 Invocation Control Matrix

| Frontmatter | User can invoke | Claude can invoke | Context loading |
|-------------|-----------------|-------------------|-----------------|
| (default) | Yes | Yes | Description always in context; full skill on invocation |
| `disable-model-invocation: true` | Yes | No | Not in context; loads when user invokes |
| `user-invocable: false` | No | Yes | Description always in context; full skill on invocation |

### 2.5 Skill Discovery Paths (Priority Order)

| Location | Path | Scope |
|----------|------|-------|
| Enterprise | Managed settings | All users in org |
| Personal | `~/.claude/skills/<name>/SKILL.md` | All your projects |
| Project | `.claude/skills/<name>/SKILL.md` | This project only |
| Plugin | `<plugin>/skills/<name>/SKILL.md` | Where plugin enabled |
| Nested | `packages/*/. claude/skills/` | Monorepo support |
| Additional dirs | `--add-dir` skills | Live change detection |

**Conflict Resolution**: Enterprise > Personal > Project. Plugin skills use `plugin-name:skill-name` namespace (no conflict).

### 2.6 String Substitutions

| Variable | Description |
|----------|-------------|
| `$ARGUMENTS` | All arguments passed when invoking |
| `$ARGUMENTS[N]` or `$N` | Specific argument by 0-based index |
| `${CLAUDE_SESSION_ID}` | Current session ID |

### 2.7 Dynamic Context Injection

The `` !`command` `` syntax runs shell commands **before** content is sent to Claude:

```yaml
---
name: pr-summary
context: fork
agent: Explore
---
## Pull request context
- PR diff: !`gh pr diff`
- Changed files: !`gh pr diff --name-only`
```

### 2.8 Supporting Files

Skills can include multiple files in their directory:

```
my-skill/
├── SKILL.md           # Main instructions (required)
├── template.md        # Template for Claude to fill
├── examples/
│   └── sample.md      # Example output
└── scripts/
    └── validate.sh    # Script Claude can execute
```

**Recommendation**: Keep `SKILL.md` under 500 lines. Move detailed reference to separate files.

### 2.9 Skill Budget

Skill descriptions are loaded into context up to **2% of context window** (fallback: 16,000 characters). Override with `SLASH_COMMAND_TOOL_CHAR_BUDGET` env var.

### 2.10 Permission Control

```text
# Allow specific skills
Skill(commit)
Skill(review-pr *)

# Deny specific skills
Skill(deploy *)

# Deny all skills
Skill
```

---

## 3. Agents (Subagents) System

### 3.1 Overview

Subagents are **specialized AI assistants** with their own context window, custom system prompt, specific tool access, and independent permissions.

### 3.2 Built-in Subagents

| Agent | Model | Tools | Purpose |
|-------|-------|-------|---------|
| **Explore** | Haiku (fast) | Read-only (no Write/Edit) | File discovery, code search, codebase exploration |
| **Plan** | Inherit | Read-only | Codebase research for planning |
| **general-purpose** | Inherit | All tools | Complex multi-step tasks |
| **Bash** | Inherit | Terminal only | Running commands in separate context |
| **statusline-setup** | Sonnet | - | `/statusline` configuration |
| **Claude Code Guide** | Haiku | - | Claude Code feature questions |

### 3.3 Agent Discovery (Priority Order)

| Location | Scope | Priority |
|----------|-------|----------|
| `--agents` CLI flag (JSON) | Current session only | 1 (highest) |
| `.claude/agents/` | Current project | 2 |
| `~/.claude/agents/` | All your projects | 3 |
| Plugin `agents/` | Where plugin enabled | 4 (lowest) |

### 3.4 Complete Frontmatter Fields

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `name` | Yes | string | Unique identifier (lowercase, hyphens) |
| `description` | Yes | string | When Claude should delegate to this subagent |
| `tools` | No | string/list | Tools the subagent can use. Inherits all if omitted |
| `disallowedTools` | No | string/list | Tools to deny (removed from inherited) |
| `model` | No | string | `sonnet`, `opus`, `haiku`, or `inherit` (default: `inherit`) |
| `permissionMode` | No | string | `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |
| `maxTurns` | No | number | Maximum agentic turns before stopping |
| `skills` | No | list | Skills preloaded into subagent context at startup |
| `mcpServers` | No | list/object | MCP servers available to this subagent |
| `hooks` | No | object | Lifecycle hooks scoped to this subagent |
| `memory` | No | string | Persistent memory scope: `user`, `project`, `local` |
| `background` | No | boolean | `true` = always run as background task. Default: `false` |
| `isolation` | No | string | `worktree` = run in temporary git worktree |

### 3.5 Task(agent_type) Syntax

Used to restrict which subagent types can be spawned:

```yaml
# Only allow spawning worker and researcher
tools: Task(worker, researcher), Read, Bash

# Allow spawning any subagent
tools: Task, Read, Bash

# Deny specific subagents in settings
{ "permissions": { "deny": ["Task(Explore)", "Task(my-agent)"] } }
```

### 3.6 Permission Modes

| Mode | Behavior |
|------|----------|
| `default` | Standard permission checking with prompts |
| `acceptEdits` | Auto-accept file edits |
| `dontAsk` | Auto-deny permission prompts (allowed tools still work) |
| `bypassPermissions` | Skip all permission checks |
| `plan` | Plan mode (read-only exploration) |

### 3.7 Agent Memory System

| Scope | Location | Use When |
|-------|----------|----------|
| `user` | `~/.claude/agent-memory/<name>/` | Learnings across all projects (recommended) |
| `project` | `.claude/agent-memory/<name>/` | Project-specific, shareable via VCS |
| `local` | `.claude/agent-memory-local/<name>/` | Project-specific, not in VCS |

When enabled:
- System prompt includes read/write instructions for memory directory
- First 200 lines of `MEMORY.md` in memory dir are included
- Read, Write, Edit tools auto-enabled

### 3.8 Foreground vs Background Subagents

- **Foreground**: Blocks main conversation; permission prompts passed through
- **Background**: Runs concurrently; permissions pre-approved upfront; `AskUserQuestion` fails but continues
- **Controls**: Ask Claude to "run in background", press `Ctrl+B`, or set `background: true` in frontmatter
- **Disable**: `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS=1`

### 3.9 CLI-Defined Subagents

```bash
claude --agents '{
  "code-reviewer": {
    "description": "Expert code reviewer",
    "prompt": "You are a senior code reviewer...",
    "tools": ["Read", "Grep", "Glob", "Bash"],
    "model": "sonnet"
  }
}'
```

### 3.10 `claude agents` CLI Command (v2.1.50+)

Lists all configured subagents from command line without interactive session. Shows agents grouped by source with override indicators.

---

## 4. Hooks System

### 4.1 Overview

Hooks are **user-defined shell commands, HTTP endpoints, or LLM prompts** that execute automatically at specific lifecycle points. They provide **deterministic control** over Claude Code's behavior.

### 4.2 Complete Hook Events Reference (17 Events)

| # | Event | When Fires | Matcher Input | Can Block? | Hook Types |
|---|-------|-----------|---------------|------------|------------|
| 1 | `SessionStart` | Session begins/resumes | `startup`, `resume`, `clear`, `compact` | No | command |
| 2 | `UserPromptSubmit` | User submits prompt | (none) | Yes | command, prompt, agent |
| 3 | `PreToolUse` | Before tool executes | Tool name | Yes | command, prompt, agent |
| 4 | `PermissionRequest` | Permission dialog shown | Tool name | Yes | command, prompt, agent |
| 5 | `PostToolUse` | After tool succeeds | Tool name | No* | command, prompt, agent |
| 6 | `PostToolUseFailure` | After tool fails | Tool name | No | command, prompt, agent |
| 7 | `Notification` | Claude sends notification | `permission_prompt`, `idle_prompt`, `auth_success`, `elicitation_dialog` | No | command |
| 8 | `SubagentStart` | Subagent spawned | Agent type name | No | command |
| 9 | `SubagentStop` | Subagent finishes | Agent type name | Yes | command, prompt, agent |
| 10 | `Stop` | Claude finishes responding | (none) | Yes | command, prompt, agent |
| 11 | `TeammateIdle` | Agent team teammate going idle | (none) | Yes | command |
| 12 | `TaskCompleted` | Task marked completed | (none) | Yes | command, prompt, agent |
| 13 | `ConfigChange` | Config file changes | `user_settings`, `project_settings`, `local_settings`, `policy_settings`, `skills` | Yes* | command |
| 14 | `WorktreeCreate` | Worktree being created | (none) | Yes** | command |
| 15 | `WorktreeRemove` | Worktree being removed | (none) | No | command |
| 16 | `PreCompact` | Before context compaction | `manual`, `auto` | No | command |
| 17 | `SessionEnd` | Session terminates | `clear`, `logout`, `prompt_input_exit`, `bypass_permissions_disabled`, `other` | No | command |

\* PostToolUse can show feedback to Claude but can't undo the action
\* ConfigChange can't block `policy_settings`
\** WorktreeCreate: non-zero exit = creation fails

### 4.3 Four Hook Types

| Type | Description | Key Fields | Default Timeout |
|------|-------------|------------|-----------------|
| `command` | Shell command execution | `command`, `async` | 600s (10 min) |
| `http` (v2.1.63) | HTTP POST to URL | `url`, `headers`, `allowedEnvVars` | 30s |
| `prompt` | Single-turn LLM evaluation | `prompt`, `model` | 30s |
| `agent` | Multi-turn subagent with tools | `prompt`, `model` | 60s |

### 4.4 Hook Configuration Format

```json
{
  "hooks": {
    "EventName": [
      {
        "matcher": "regex-pattern",
        "hooks": [
          {
            "type": "command",
            "command": "path/to/script.sh",
            "timeout": 30,
            "statusMessage": "Running validation...",
            "async": false,
            "once": false
          }
        ]
      }
    ]
  }
}
```

### 4.5 Common Handler Fields

| Field | Required | All Types | Description |
|-------|----------|-----------|-------------|
| `type` | Yes | Yes | `command`, `http`, `prompt`, `agent` |
| `timeout` | No | Yes | Seconds before canceling |
| `statusMessage` | No | Yes | Custom spinner message |
| `once` | No | Skills only | Run once per session then removed |

#### Command-Specific Fields

| Field | Description |
|-------|-------------|
| `command` | Shell command to execute |
| `async` | If `true`, runs in background without blocking |

#### HTTP-Specific Fields (v2.1.63+)

| Field | Description |
|-------|-------------|
| `url` | URL to send POST request to |
| `headers` | HTTP headers (key-value pairs, supports `$VAR` interpolation) |
| `allowedEnvVars` | Env var names allowed for interpolation |

#### Prompt/Agent-Specific Fields

| Field | Description |
|-------|-------------|
| `prompt` | Prompt text. `$ARGUMENTS` placeholder for hook input JSON |
| `model` | Model for evaluation. Default: fast model |

### 4.6 Common Input Fields (All Events)

| Field | Description |
|-------|-------------|
| `session_id` | Current session identifier |
| `transcript_path` | Path to conversation JSON |
| `cwd` | Current working directory |
| `permission_mode` | Current permission mode |
| `hook_event_name` | Name of the event that fired |

### 4.7 Exit Code Semantics

| Exit Code | Meaning | Behavior |
|-----------|---------|----------|
| **0** | Success | Action proceeds; stdout parsed for JSON |
| **2** | Blocking error | Action blocked; stderr fed back to Claude |
| **Other** | Non-blocking error | Action proceeds; stderr logged in verbose mode |

### 4.8 Decision Control Patterns

| Events | Decision Pattern | Key Fields |
|--------|-----------------|------------|
| UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop, ConfigChange | Top-level `decision` | `decision: "block"`, `reason` |
| TeammateIdle, TaskCompleted | Exit code only | Exit 2 blocks; stderr = feedback |
| PreToolUse | `hookSpecificOutput` | `permissionDecision` (allow/deny/ask), `permissionDecisionReason`, `updatedInput`, `additionalContext` |
| PermissionRequest | `hookSpecificOutput` | `decision.behavior` (allow/deny), `updatedInput`, `updatedPermissions`, `message`, `interrupt` |
| WorktreeCreate | stdout path | Print absolute path; non-zero = fail |
| WorktreeRemove, Notification, SessionEnd, PreCompact | None | Side effects only |

### 4.9 Hook Locations (Priority/Scope)

| Location | Scope | Shareable |
|----------|-------|-----------|
| `~/.claude/settings.json` | All projects | No |
| `.claude/settings.json` | Single project | Yes (git) |
| `.claude/settings.local.json` | Single project | No (gitignored) |
| Managed policy settings | Organization-wide | Yes (admin) |
| Plugin `hooks/hooks.json` | When plugin enabled | Yes |
| Skill/Agent frontmatter | While component active | Yes |

### 4.10 Environment Variables for Hooks

| Variable | Description | Availability |
|----------|-------------|-------------|
| `$CLAUDE_PROJECT_DIR` | Project root directory | All hooks |
| `${CLAUDE_PLUGIN_ROOT}` | Plugin root directory | Plugin hooks |
| `$CLAUDE_ENV_FILE` | File path for persisting env vars | SessionStart only |
| `$CLAUDE_CODE_REMOTE` | `"true"` in remote web environments | All hooks |

### 4.11 Special Behaviors

- **Parallel execution**: All matching hooks run in parallel
- **Deduplication**: Identical handlers automatically deduplicated (by command string or URL)
- **Snapshot model**: Hooks captured at startup; external edits require `/hooks` review or restart
- **disableAllHooks**: Respects managed settings hierarchy (admin hooks can't be disabled by user)

---

## 5. Commands System

### 5.1 Current Status: Merged into Skills

Custom slash commands have been **merged into skills**. Both paths work identically:
- `.claude/commands/review.md` → creates `/review`
- `.claude/skills/review/SKILL.md` → creates `/review`

If a skill and command share the same name, **the skill takes precedence**.

### 5.2 Command Format

Simple markdown files with optional YAML frontmatter:

```yaml
---
description: Review code changes
disable-model-invocation: true
---

Review the following code changes: $ARGUMENTS
```

### 5.3 Command Locations

| Location | Path | Scope |
|----------|------|-------|
| Personal | `~/.claude/commands/*.md` | All projects |
| Project | `.claude/commands/*.md` | This project |
| Plugin | `<plugin>/commands/*.md` | Where plugin enabled |

### 5.4 Bundled Commands (v2.1.63+)

- `/simplify` - Simplify complex code
- `/batch` - Batch operations

---

## 6. Memory System

### 6.1 Memory Types Overview

| Memory Type | Location | Purpose | Shared With | Loaded |
|-------------|----------|---------|-------------|--------|
| **Managed policy** | OS-specific paths | Org-wide instructions | All users in org | Full at launch |
| **Project memory** | `./CLAUDE.md` or `./.claude/CLAUDE.md` | Team-shared project instructions | Team via VCS | Full at launch |
| **Project rules** | `./.claude/rules/*.md` | Modular topic-specific rules | Team via VCS | Full at launch |
| **User memory** | `~/.claude/CLAUDE.md` | Personal preferences | Just you (all projects) | Full at launch |
| **Project local** | `./CLAUDE.local.md` | Personal project-specific | Just you (gitignored) | Full at launch |
| **Auto memory** | `~/.claude/projects/<project>/memory/` | Claude's automatic notes | Just you (per project) | First 200 lines of MEMORY.md |
| **Agent memory** | Various (see 6.5) | Per-agent persistent knowledge | Configurable | First 200 lines of MEMORY.md |

### 6.2 Auto-Memory (v2.1.59+)

**Storage**: `~/.claude/projects/<project>/memory/`
- `<project>` derived from git repo root
- All subdirectories within same repo share one memory directory
- Git worktrees get separate directories

**Structure**:
```
~/.claude/projects/<project>/memory/
├── MEMORY.md          # Concise index, loaded into every session
├── debugging.md       # Topic files (loaded on demand)
├── api-conventions.md
└── ...
```

**Behavior**:
- First 200 lines of `MEMORY.md` loaded into system prompt at startup
- Content beyond 200 lines NOT automatically loaded
- Topic files loaded on demand via standard file tools
- Claude reads and writes memory files during session

**Management**:
- `/memory` command opens file selector
- Direct: "remember that we use pnpm, not npm"
- `autoMemoryEnabled: false` in settings.json
- `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` env var (overrides all)

### 6.3 CLAUDE.md Imports

```markdown
See @README for project overview and @package.json for available commands.

# Additional Instructions
- git workflow @docs/git-instructions.md
```

- Relative and absolute paths supported
- Max depth: 5 hops (recursive imports)
- Not evaluated inside code spans/blocks
- First-time approval dialog per project

### 6.4 Rules System (`.claude/rules/`)

```
.claude/rules/
├── frontend/
│   ├── react.md
│   └── styles.md
├── backend/
│   ├── api.md
│   └── database.md
└── general.md
```

**Path-specific rules** with YAML frontmatter:

```yaml
---
paths:
  - "src/api/**/*.ts"
  - "lib/**/*.ts"
---

# API Development Rules
- Use RESTful naming conventions
- Include request validation
```

**Features**:
- All `.md` files discovered recursively
- Supports subdirectories for organization
- Symlinks supported (resolved and loaded normally)
- User-level rules at `~/.claude/rules/` (lower priority than project)
- Standard glob patterns with brace expansion

### 6.5 Agent Memory Scopes

| Scope | Location | Use Case |
|-------|----------|----------|
| `user` | `~/.claude/agent-memory/<agent>/` | Global learnings (recommended) |
| `project` | `.claude/agent-memory/<agent>/` | Project-specific, VCS shareable |
| `local` | `.claude/agent-memory-local/<agent>/` | Project-specific, not in VCS |

### 6.6 Memory Loading Order

1. `~/.claude/CLAUDE.md` (user)
2. `CLAUDE.md` (project root)
3. `.claude/CLAUDE.md` (project hidden)
4. `.claude/CLAUDE.local.md` (personal project, gitignored)
5. `.claude/rules/*.md` (same priority as `.claude/CLAUDE.md`)
6. Auto-memory `MEMORY.md` (first 200 lines)
7. Child directory CLAUDE.md files (on-demand, when Claude reads files there)

More specific instructions take precedence over broader ones.

---

## 7. CLAUDE.md System

### 7.1 Hierarchy

| Level | File | Priority | Shared |
|-------|------|----------|--------|
| Managed policy | OS-specific CLAUDE.md | Highest | Org-wide |
| User | `~/.claude/CLAUDE.md` | Low | Personal |
| Project root | `CLAUDE.md` | Medium | Team |
| Project hidden | `.claude/CLAUDE.md` | Medium | Team |
| Project local | `.claude/CLAUDE.local.md` | High (local) | Personal (gitignored) |
| Subdirectory | `subdir/CLAUDE.md` | On-demand | Team |

### 7.2 Managed Policy Locations

| OS | Path |
|----|------|
| macOS | `/Library/Application Support/ClaudeCode/CLAUDE.md` |
| Linux/WSL | `/etc/claude-code/CLAUDE.md` |
| Windows | `C:\Program Files\ClaudeCode\CLAUDE.md` |

### 7.3 Best Practices

- Keep under 200 lines for >92% rule application rate
- Beyond 400 lines: ~71% application rate
- Use `.claude/rules/` for modular organization
- Use `@path` imports for external references
- `CLAUDE.local.md` auto-added to `.gitignore`

---

## 8. Configuration Hierarchy

### 8.1 Four-Tier Scope System

| Scope | Location | Override Priority | Shared |
|-------|----------|-------------------|--------|
| **Managed** | Server, plist/registry, `managed-settings.json` | 1 (Highest) | Yes (IT) |
| **Local** | `.claude/*.local.*` files | 2 | No (gitignored) |
| **Project** | `.claude/` in repository | 3 | Yes (git) |
| **User** | `~/.claude/` directory | 4 (Lowest) | No |

**CLI arguments** temporarily override all scopes (between Managed and Local).

### 8.2 Settings Files

```
User Level:
  ~/.claude/settings.json          # User settings
  ~/.claude/CLAUDE.md              # User instructions
  ~/.claude/agents/                # User subagents
  ~/.claude/skills/                # User skills
  ~/.claude/rules/                 # User rules
  ~/.claude.json                   # Preferences, OAuth, MCP servers

Project Level:
  .claude/settings.json            # Shared project settings
  .claude/settings.local.json      # Personal project overrides
  .claude/CLAUDE.md                # Project instructions
  CLAUDE.md                        # Alt project instructions
  .claude/CLAUDE.local.md          # Personal project instructions
  .claude/agents/                  # Project subagents
  .claude/skills/                  # Project skills
  .claude/rules/                   # Project rules
  .mcp.json                        # Project MCP servers

Managed Level:
  macOS:  /Library/Application Support/ClaudeCode/
  Linux:  /etc/claude-code/
  Windows: C:\Program Files\ClaudeCode\
  Files: managed-settings.json, managed-mcp.json
```

### 8.3 Key Settings Fields

#### Permissions
```json
{
  "permissions": {
    "allow": ["Bash(npm run lint)", "Read(~/.zshrc)"],
    "ask": ["Bash(git push *)"],
    "deny": ["Read(./.env)", "WebFetch"],
    "additionalDirectories": ["../docs/"],
    "defaultMode": "acceptEdits",
    "disableBypassPermissionsMode": "disable"
  }
}
```

**Evaluation order**: Deny -> Ask -> Allow (first match wins)

#### Core Settings

| Key | Type | Description |
|-----|------|-------------|
| `model` | string | Override default model |
| `availableModels` | array | Restrict selectable models |
| `env` | object | Env vars per session |
| `language` | string | Preferred response language |
| `outputStyle` | string | System prompt tone |
| `plansDirectory` | string | Custom plans storage |
| `autoMemoryEnabled` | boolean | Toggle auto-memory |

#### Hook Configuration

| Key | Type | Description |
|-----|------|-------------|
| `disableAllHooks` | boolean | Disable all hooks |
| `allowManagedHooksOnly` | boolean | Block user/project/plugin hooks |
| `allowedHttpHookUrls` | array | URL allowlist for HTTP hooks |
| `httpHookAllowedEnvVars` | array | Env vars for HTTP hook headers |

### 8.4 Key Environment Variables

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_MODEL` | Model name to use |
| `CLAUDE_CODE_MAX_OUTPUT_TOKENS` | Max output tokens (default 32k, max 64k) |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Enable agent teams |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable auto memory |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable background execution |
| `CLAUDE_CODE_EFFORT_LEVEL` | Effort level: low/medium/high |
| `CLAUDE_CODE_SIMPLE` | Minimal mode (Bash + file tools only) |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Require plan approval |
| `CLAUDE_CODE_AUTOCOMPACT_PCT_OVERRIDE` | Auto-compaction trigger % |
| `CLAUDE_CODE_SHELL` | Override shell detection |
| `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS` | Git timeout (default 120000) |
| `ENABLE_TOOL_SEARCH` | MCP tool search mode |
| `BASH_DEFAULT_TIMEOUT_MS` | Default bash command timeout |
| `BASH_MAX_TIMEOUT_MS` | Maximum bash timeout |

### 8.5 Array Settings Behavior

**Array settings merge across scopes** - concatenated and deduplicated, not replaced. Lower-priority scopes add entries without overriding higher-priority ones.

---

## 9. Plugin System

### 9.1 Plugin Directory Structure

```
my-plugin/
├── .claude-plugin/           # Metadata directory (optional)
│   └── plugin.json           # Plugin manifest
├── commands/                 # Legacy skills (Markdown files)
├── agents/                   # Subagent definitions
├── skills/                   # Agent Skills with SKILL.md
├── hooks/                    # Hook configurations
│   └── hooks.json            # Main hook config
├── settings.json             # Default plugin settings
├── .mcp.json                 # MCP server definitions
├── .lsp.json                 # LSP server configurations
├── scripts/                  # Hook and utility scripts
└── output-styles/            # Custom output styles (if declared)
```

**CRITICAL**: `.claude-plugin/` contains ONLY `plugin.json`. All other directories at plugin root.

### 9.2 plugin.json Complete Schema

```json
{
  "name": "plugin-name",
  "version": "1.2.0",
  "description": "Brief plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com",
    "url": "https://github.com/author"
  },
  "homepage": "https://docs.example.com/plugin",
  "repository": "https://github.com/author/plugin",
  "license": "MIT",
  "keywords": ["keyword1", "keyword2"],
  "commands": ["./custom/commands/special.md"],
  "agents": "./custom/agents/",
  "skills": "./custom/skills/",
  "hooks": "./config/hooks.json",
  "mcpServers": "./mcp-config.json",
  "outputStyles": "./styles/",
  "lspServers": "./.lsp.json"
}
```

### 9.3 Required vs Optional Fields

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes (if manifest exists) | Unique identifier (kebab-case). Used as namespace |
| `version` | No | Semantic versioning |
| `description` | No | Brief explanation |
| `author` | No | Author info (name, email, url) |
| `homepage` | No | Documentation URL |
| `repository` | No | Source code URL |
| `license` | No | License identifier |
| `keywords` | No | Discovery tags |
| `commands` | No | Additional command files/dirs |
| `agents` | No | Additional agent files |
| `skills` | No | Additional skill directories |
| `hooks` | No | Hook config paths or inline |
| `mcpServers` | No | MCP config paths or inline |
| `outputStyles` | No | Output style files/dirs |
| `lspServers` | No | LSP config paths or inline |

### 9.4 Plugin Installation Scopes

| Scope | Settings File | Use Case |
|-------|---------------|----------|
| `user` | `~/.claude/settings.json` | Personal (default) |
| `project` | `.claude/settings.json` | Team (VCS) |
| `local` | `.claude/settings.local.json` | Project-specific (gitignored) |
| `managed` | Managed settings | Enterprise (read-only) |

### 9.5 Plugin settings.json

Currently only supports `agent` key:
```json
{
  "agent": "security-reviewer"
}
```

Activates a plugin agent as main thread when plugin enabled.

### 9.6 Output Styles in Plugins

**IMPORTANT**: Must declare `"outputStyles": "./output-styles/"` in plugin.json. No default location auto-discovered.

### 9.7 Plugin Caching

- Marketplace plugins copied to `~/.claude/plugins/cache`
- Path traversal (`../`) not allowed
- Symlinks honored during copy
- `--plugin-dir` flag for local development (no caching)

### 9.8 Plugin Hot Reload (v2.1.45+)

Changes to plugins detected automatically. Restart may still be needed for some components.

### 9.9 Plugin Marketplace Configuration

```json
{
  "enabledPlugins": {
    "formatter@acme-tools": true,
    "analyzer@security-plugins": false
  },
  "extraKnownMarketplaces": {
    "acme-tools": {
      "source": {
        "source": "github",
        "repo": "acme-corp/claude-plugins",
        "ref": "v2.0",
        "path": "marketplace"
      }
    }
  },
  "strictKnownMarketplaces": [...],
  "blockedMarketplaces": [...]
}
```

**Source types**: `github`, `git`, `url`, `npm`, `file`, `directory`, `hostPattern`

---

## 10. Feature Stability Matrix

### 10.1 Stable Features (Safe for bkit Dependency)

| Feature | Stable Since | Breaking Risk | Notes |
|---------|-------------|---------------|-------|
| SKILL.md format | v2.1.45 | Very Low | Agent Skills open standard |
| Skill frontmatter (all fields) | v2.1.45 | Very Low | `context`, `agent`, `hooks` fields added progressively |
| Agent .md format | v2.1.49 | Very Low | All frontmatter fields stable |
| Agent memory scopes | v2.1.49 | Very Low | user/project/local |
| Hook events (17) | v2.1.50 | Low | Events only added, never removed |
| Hook command type | v2.1.38 | Very Low | Core feature since early versions |
| CLAUDE.md hierarchy | v1.0 | Very Low | Foundation feature |
| Rules system | v2.1.47 | Very Low | Path-scoped rules |
| Plugin system | v2.1.45 | Low | Schema still evolving |
| settings.json schema | v2.1.38 | Low | Fields only added |
| Auto-memory | v2.1.59 | Low | Enabled by default |
| Output styles | v2.0.32 | Very Low | Stable after v2.0.30 deprecation |

### 10.2 Experimental Features (Monitor but Don't Hard-Depend)

| Feature | Status | Risk | Notes |
|---------|--------|------|-------|
| Agent Teams | Experimental | Medium | Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` |
| HTTP hooks | New (v2.1.63) | Medium | Interface may evolve |
| Prompt/Agent hooks | Newer | Medium | `ok`/`reason` schema may change |
| `isolation: "worktree"` | v2.1.49 | Medium | WorktreeCreate/Remove hooks |
| `remote-control` | Research Preview | High | Slash commands unsupported (#28379) |
| LSP servers in plugins | v2.1.63 | Medium | Newer feature |

### 10.3 Deprecated Features

| Feature | Status | Replacement |
|---------|--------|-------------|
| `.claude/commands/` | Legacy (works) | `.claude/skills/` |
| `includeCoAuthoredBy` | Deprecated | `attribution` object |
| PreToolUse top-level `decision`/`reason` | Deprecated | `hookSpecificOutput.permissionDecision` |
| `ANTHROPIC_SMALL_FAST_MODEL` | Deprecated | `ANTHROPIC_DEFAULT_HAIKU_MODEL` |
| Delegate mode prompts | Removed v2.1.47 | Subagent frontmatter |

---

## 11. Implications for bkit Customization

### 11.1 Key Architectural Insights

1. **Filesystem-based configuration**: All customization surfaces are file-based (Markdown + YAML + JSON). No database, no API calls. This is a deliberate design choice for VCS compatibility.

2. **Convention over configuration**: Default paths (`skills/`, `agents/`, `hooks/`) are auto-discovered. Custom paths supplement but don't replace defaults.

3. **Namespace isolation**: Plugins use `plugin-name:component-name` namespacing. This prevents conflicts but requires awareness in skill invocation.

4. **Memory hierarchy**: 7 levels of memory with clear precedence. More specific always wins. Array settings merge rather than override.

5. **Hook-driven extensibility**: 17 lifecycle hooks cover the entire session lifecycle. The `hookSpecificOutput` pattern enables rich, event-specific control.

### 11.2 Stable Surfaces for bkit Abstraction

The following surfaces are safe for bkit to build abstractions on:

- **Skills YAML frontmatter**: All 10 fields are stable. `context: fork` and `agent` field enable delegation patterns.
- **Agent frontmatter**: All 14 fields are stable. `memory`, `background`, `isolation` are power features.
- **Hook events**: 17 events with well-defined input/output schemas. New events only added, never removed.
- **CLAUDE.md + Rules**: Foundation features. `@import` syntax and path-scoped rules enable modular configuration.
- **Plugin manifest**: `plugin.json` schema is extensible. Custom paths supplement defaults.

### 11.3 Opportunities for bkit v1.5.8

1. **`.bkit/` as unified config directory**: Mirror Claude Code's `.claude/` pattern but with bkit-specific semantics (PDCA, pipeline phases, learning outputs).

2. **Customization abstraction layer**: Wrap Skills + Agents + Hooks into a coherent bkit configuration that generates proper Claude Code files.

3. **Rules system adoption**: bkit currently uses CLAUDE.md but not `.claude/rules/`. Path-scoped rules could enable per-module bkit behaviors.

4. **Agent memory integration**: bkit's 16 agents could benefit from persistent memory scopes. Currently bkit uses custom `docs/.bkit-memory.json`.

5. **Hook consolidation**: bkit uses 10/17 hook events. The remaining 7 (PermissionRequest, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact) offer enhancement opportunities.

6. **HTTP hooks**: New in v2.1.63. Could enable bkit Studio integration without shell command overhead.

7. **Plugin settings.json**: Supports `agent` key. Could enable bkit to set a default agent mode when plugin is enabled.

### 11.4 Risk Factors

1. **Agent Teams still experimental**: bkit CTO Team depends on `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`. No graduation timeline.

2. **Known regressions in v2.1.63**: #29548 (ExitPlanMode skips approval), #29547 (AskUserQuestion empty in plugin skills). Both affect bkit.

3. **Skill budget limit**: 2% of context window for skill descriptions. bkit with 27 skills may approach this limit.

4. **SIMPLE mode incompatibility**: `CLAUDE_CODE_SIMPLE=1` disables hooks/MCP/CLAUDE.md. bkit is incompatible in SIMPLE mode.

---

## Appendix A: Configuration Path Quick Reference

```
Claude Code Configuration Paths
================================

SKILLS
  ~/.claude/skills/<name>/SKILL.md          (personal)
  .claude/skills/<name>/SKILL.md            (project)
  <plugin>/skills/<name>/SKILL.md           (plugin)

AGENTS
  ~/.claude/agents/<name>.md                (personal)
  .claude/agents/<name>.md                  (project)
  <plugin>/agents/<name>.md                 (plugin)

HOOKS
  ~/.claude/settings.json → hooks           (user)
  .claude/settings.json → hooks             (project)
  .claude/settings.local.json → hooks       (local)
  <plugin>/hooks/hooks.json                 (plugin)
  SKILL.md/Agent.md frontmatter → hooks     (component)

MEMORY
  ~/.claude/CLAUDE.md                       (user)
  CLAUDE.md                                 (project root)
  .claude/CLAUDE.md                         (project hidden)
  .claude/CLAUDE.local.md                   (local, gitignored)
  .claude/rules/*.md                        (modular rules)
  ~/.claude/rules/*.md                      (user rules)
  ~/.claude/projects/<p>/memory/MEMORY.md   (auto-memory)
  ~/.claude/agent-memory/<agent>/           (agent user)
  .claude/agent-memory/<agent>/             (agent project)
  .claude/agent-memory-local/<agent>/       (agent local)

SETTINGS
  ~/.claude/settings.json                   (user)
  .claude/settings.json                     (project)
  .claude/settings.local.json               (local)
  managed-settings.json                     (managed)
  <plugin>/settings.json                    (plugin)

PLUGIN
  <plugin>/.claude-plugin/plugin.json       (manifest)
  <plugin>/skills/                          (skills)
  <plugin>/agents/                          (agents)
  <plugin>/commands/                        (legacy skills)
  <plugin>/hooks/hooks.json                 (hooks)
  <plugin>/.mcp.json                        (MCP servers)
  <plugin>/.lsp.json                        (LSP servers)
  <plugin>/settings.json                    (default settings)
```

---

## Appendix B: Sources

- [Claude Code Skills](https://code.claude.com/docs/en/skills) - Official skills documentation
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - Complete hooks reference
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide) - Practical hooks examples
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents) - Agent system documentation
- [Claude Code Memory](https://code.claude.com/docs/en/memory) - Memory system documentation
- [Claude Code Settings](https://code.claude.com/docs/en/settings) - Configuration reference
- [Claude Code Plugins](https://code.claude.com/docs/en/plugins) - Plugin creation guide
- [Claude Code Plugins Reference](https://code.claude.com/docs/en/plugins-reference) - Plugin technical specs
- [Claude Code CHANGELOG](https://docs.anthropic.com/en/release-notes/claude-code) - Version history
- [MEMORY.md](../../../.claude/projects/-Users-popup-kay-Documents-GitHub-popup-bkit-claude-code/memory/MEMORY.md) - bkit project memory
