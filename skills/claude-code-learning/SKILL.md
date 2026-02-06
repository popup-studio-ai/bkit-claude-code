---
name: claude-code-learning
description: |
  Claude Code learning and education skill.
  Teaches users how to configure and optimize Claude Code settings.
  Works across any project and any language.

  Start learning/setup with "learn" or "setup".

  Use proactively when user is new to Claude Code, asks about configuration,
  or wants to improve their Claude Code setup.

  Triggers: learn claude code, claude code setup, CLAUDE.md, hooks, commands, skills,
  how to configure, 클로드 코드 배우기, 설정 방법, Claude Code 학습,
  クロードコード学習, 设置方法, how do I use claude code,
  aprender claude code, configuración, cómo configurar,
  apprendre claude code, configuration, comment configurer,
  Claude Code lernen, Konfiguration, wie konfigurieren,
  imparare claude code, configurazione, come configurare

  Do NOT use for: actual coding tasks, debugging, or feature implementation.
argument-hint: "[learn|setup|upgrade] [level]"
agent: claude-code-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/shared/naming-conventions.md
next-skill: null
pdca-phase: null
task-template: "[Learn] Claude Code {level}"
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
---

# Claude Code Learning Skill

> Master Claude Code configuration and optimization

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `learn` | Start learning guide | `/claude-code-learning learn 1` |
| `setup` | Auto-generate settings | `/claude-code-learning setup` |
| `upgrade` | Latest features guide | `/claude-code-learning upgrade` |

### learn [level]

Learning content by level:
- **Level 1**: Basics - Writing CLAUDE.md, Using Plan Mode
- **Level 2**: Automation - Commands, Hooks, Permission management
- **Level 3**: Specialization - Agents, Skills, MCP integration
- **Level 4**: Team Optimization - GitHub Action, Team rule standardization
- **Level 5**: PDCA Methodology - bkit methodology learning

### setup

Auto-generate appropriate settings after analyzing current project:
1. Analyze/generate CLAUDE.md
2. Check .claude/ folder structure
3. Suggest required configuration files

### upgrade

Guide to latest Claude Code features and best practices.

## Learning Levels

### Level 1: Basics (15 min)

```markdown
## What is CLAUDE.md?

A shared knowledge repository for the team. When Claude makes mistakes,
add rules to prevent the same mistakes from recurring.

## Example

# Development Workflow

## Package Management
- **Always use `pnpm`** (`npm`, `yarn` prohibited)

## Coding Conventions
- Prefer `type`, avoid `interface`
- **Never use `enum`** → Use string literal unions

## Prohibited
- ❌ No console.log (use logger)
- ❌ No any type
```

### Level 2: Automation (30 min)

```markdown
## What are Slash Commands?

Execute repetitive daily tasks with `/command-name`.

## Command Location

.claude/commands/{command-name}.md

## PostToolUse Hook

Auto-formatting after code modification:

// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "pnpm format || true"
      }]
    }]
  }
}
```

### Level 3: Specialization (45 min)

```markdown
## What are Sub-agents?

AI agents specialized for specific tasks.

## What are Skills?

Domain-specific expert context. Claude auto-references when working on related tasks.

## MCP Integration

Connect external tools (Slack, GitHub, Jira, etc.) via .mcp.json.
```

### Level 4: Team Optimization (1 hour)

```markdown
## PR Automation with GitHub Action

Mention @claude in PR comments to auto-update documentation.

## Team Rule Standardization

1. Manage CLAUDE.md with Git
2. Add rules during PR review
3. Gradually accumulate team knowledge

## Agent Teams (v1.5.1)

Parallel PDCA execution with multiple AI agents working simultaneously.

Requirements:
  CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

Usage:
  /pdca team {feature}     Start team mode
  /pdca team status        Check teammate progress
  /pdca team cleanup       End team session

Team composition by level:
  Dynamic:    2 teammates (developer, qa)
  Enterprise: 4 teammates (architect, developer, qa, reviewer)
```

### Level 5: PDCA Methodology

```markdown
## What is PDCA?

Document-driven development methodology.

Plan → Design → Do → Check → Act

## Folder Structure

docs/
├── 01-plan/      # Planning
├── 02-design/    # Design
├── 03-analysis/  # Analysis
└── 04-report/    # Reports

## Learn More

Use /pdca skill to learn PDCA methodology.
```

### Level 6: Advanced Features (v1.5.1)

```markdown
## Output Styles

Customize how Claude responds based on your project level.

Available styles:
  bkit-learning     Best for beginners (learning points, TODO markers)
  bkit-pdca-guide   Best for PDCA workflows (status badges, checklists)
  bkit-enterprise   Best for architects (tradeoff analysis, cost impact)

Usage:
  /output-style              Select interactively
  /output-style bkit-learning  Apply directly

Auto-recommendation:
  Starter → bkit-learning
  Dynamic → bkit-pdca-guide
  Enterprise → bkit-enterprise

## Agent Memory

All bkit agents automatically remember context across sessions.
No configuration needed.

Memory scopes:
  project   9 agents remember per-project context (.claude/agent-memory/)
  user      2 agents remember cross-project learning (~/.claude/agent-memory/)

Agents with user-scope memory:
  starter-guide     Remembers your learning progress across projects
  pipeline-guide    Remembers your pipeline preferences globally

## Agent Teams

Parallel PDCA execution for Dynamic and Enterprise projects.
See Level 4 for details.
```

## Output Format

```
📚 Claude Code Learning Complete!

**Current Level**: {level}
**Learned**: {summary}

🎯 Next Steps:
- Continue learning with /claude-code-learning learn {next_level}
- Auto-generate settings with /claude-code-learning setup
- Check latest trends with /claude-code-learning upgrade
```

## Current Settings Analysis

Files to analyze:
- CLAUDE.md (root)
- .claude/settings.local.json
- .claude/commands/
- .claude/agents/
- .claude/skills/
- .mcp.json
