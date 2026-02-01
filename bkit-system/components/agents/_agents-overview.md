# Agents Overview

> List of 11 Agents defined in bkit and their roles (v1.4.1)
>
> **v1.4.1**: Added Context Engineering perspective - Role-based Behavioral Rules Layer
> **v1.5.0**: Claude Code Exclusive

## What are Agents?

Agents are **AI sub-agents specialized for specific tasks**.
- Invoked via Task tool to perform work independently
- Each has its own allowed-tools and specialized prompts
- Frontmatter hooks trigger specific behaviors

## Context Engineering Perspective (v1.4.1)

Agents form bkit's **Behavioral Rules Layer**, designed according to [[../../philosophy/context-engineering|Context Engineering]] principles.

### Agent Context Engineering Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    Agent Context Engineering                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │   Role Definition    │  │   Constraint Spec    │             │
│  │                      │  │                      │             │
│  │ • Expert in X        │  │ • Permission Mode    │             │
│  │ • Responsible for Y  │  │ • Allowed Tools      │             │
│  │ • Level (CTO/Entry)  │  │ • Score Thresholds   │             │
│  │ • Case Study Ref     │  │ • Workflow Rules     │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Model Selection Strategy                     │   │
│  │                                                          │   │
│  │  opus   → Complex analysis, strategic decisions          │   │
│  │  sonnet → Execution, guidance, iterative tasks           │   │
│  │  haiku  → Fast monitoring, document generation           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Model Selection Strategy by Agent

| Model | Agents | Characteristics |
|-------|--------|-----------------|
| **opus** | code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect | Complex analysis, strategic decisions |
| **sonnet** | bkend-expert, pdca-iterator, pipeline-guide, starter-guide | Execution, guidance, iteration |
| **haiku** | qa-monitor, report-generator | Fast monitoring, document generation |

## Full List

### Level-Based Agents (4)

Agents auto-recommended based on project level:

| Agent | Target Level | Role | Hooks |
|-------|--------------|------|-------|
| [[../../../agents/starter-guide|starter-guide]] | Starter | Beginner-friendly guide | - |
| [[../../../agents/bkend-expert|bkend-expert]] | Dynamic | BaaS/Fullstack expert | - |
| [[../../../agents/enterprise-expert|enterprise-expert]] | Enterprise | CTO-level architecture guide | - |
| [[../../../agents/infra-architect|infra-architect]] | Enterprise | AWS/K8s/Terraform expert | - |

### Task-Based Agents (7)

Agents auto-invoked based on specific tasks:

| Agent | Trigger Conditions | Role | Hooks |
|-------|-------------------|------|-------|
| [[../../../agents/pipeline-guide|pipeline-guide]] | "where to start", "what first" | 9-stage pipeline guidance | - |
| [[../../../agents/gap-detector|gap-detector]] | "gap analysis", "design-implementation compare" | Design vs Implementation gap analysis | Stop |
| [[../../../agents/design-validator|design-validator]] | "design validation", "spec check" | Design document validation | PreToolUse |
| [[../../../agents/code-analyzer|code-analyzer]] | "code analysis", "quality check" | Code quality/security analysis | PreToolUse (block), Stop |
| [[../../../agents/qa-monitor|qa-monitor]] | "QA", "test", "log analysis" | Zero Script QA execution | PreToolUse, PostToolUse, Stop |
| [[../../../agents/pdca-iterator|pdca-iterator]] | "fix it", "improve it", "iterate" | Auto iterative improvement | Stop |
| [[../../../agents/report-generator|report-generator]] | "report", "summary", "complete" | PDCA report generation | - |

---

## Agent Auto-Invoke Rules

Rules defined in `auto-trigger-agents.md` instruction:

### Rule 1: Level-Based Selection

```
When user requests feature development:
1. Detect project level
2. Prepare matching Agent
   - Starter → starter-guide
   - Dynamic → bkend-expert
   - Enterprise → enterprise-expert or infra-architect
```

### Rule 2: Task-Based Selection

```
Keyword matching:
- "code review", "security scan" → code-analyzer
- "gap analysis" → gap-detector
- "QA", "test", "log analysis" → qa-monitor
- "report", "summary" → report-generator
```

### Rule 3: Proactive Suggestions

```
After code implementation → "Run code quality analysis? (code-analyzer)"
After design document creation → "Validate design? (design-validator)"
After feature completion → "Run gap analysis? (gap-detector)"
After PDCA cycle → "Generate completion report? (report-generator)"
```

---

## Agent Frontmatter Structure

```yaml
---
name: agent-name
description: |
  Agent description.

  Use proactively when user...

  Triggers: keyword1, keyword2, 한글키워드, キーワード, 关键词

  Do NOT use for: exclusion conditions
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - LSP
  - TodoWrite
hooks:
  PreToolUse:
    - matcher: "Write"
      script: "./scripts/script-name.js"
  PostToolUse:
    - matcher: "Write"
      script: "./scripts/script-name.js"
---
```

---

## Agent Hooks

| Agent | PreToolUse | PostToolUse | Stop |
|-------|-----------|-------------|------|
| [[../../../agents/gap-detector|gap-detector]] | - | - | `gap-detector-stop.js` |
| [[../../../agents/design-validator|design-validator]] | `design-validator-pre.js` | - | - |
| [[../../../agents/code-analyzer|code-analyzer]] | Block (read-only) | - | `analysis-stop.js` |
| [[../../../agents/qa-monitor|qa-monitor]] | `qa-pre-bash.js` | `qa-monitor-post.js` | `qa-stop.js` |
| [[../../../agents/pdca-iterator|pdca-iterator]] | - | - | `iterator-stop.js` |

---

## Agent vs Skill Differences

| Aspect | Skill | Agent |
|--------|-------|-------|
| Role | Provide knowledge/context | Perform independent tasks |
| Invocation | Auto-activation | Explicit invocation via Task tool |
| Scope | Add context to current conversation | Work in separate conversation, return results |
| Example | phase-4-api → API design knowledge | qa-monitor → Actual QA execution |

---

## Skill → Agent Connections

| Skill | Connected Agent |
|-------|-----------------|
| starter | starter-guide |
| dynamic | bkend-expert |
| enterprise | enterprise-expert, infra-architect |
| development-pipeline | pipeline-guide |
| zero-script-qa | qa-monitor |
| bkit-rules | pdca-iterator (via /pdca-iterate) |
| bkit-templates | design-validator, code-analyzer, gap-detector |

---

## Agent Source Location

Agents are at root level (not in .claude/):

```
bkit-claude-code/
└── agents/
    ├── starter-guide.md
    ├── bkend-expert.md
    ├── enterprise-expert.md
    ├── infra-architect.md
    ├── pipeline-guide.md
    ├── gap-detector.md
    ├── design-validator.md
    ├── code-analyzer.md
    ├── qa-monitor.md
    ├── pdca-iterator.md
    └── report-generator.md
```

---

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../skills/_skills-overview]] - Skill Details
- [[../hooks/_hooks-overview]] - Hook Event Details
- [[../scripts/_scripts-overview]] - Script Details
- [[../../triggers/trigger-matrix]] - Trigger Matrix
