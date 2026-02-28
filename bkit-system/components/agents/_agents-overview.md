# Agents Overview

> List of 16 Agents defined in bkit and their roles (v1.5.7)
>
> **v1.4.1**: Added Context Engineering perspective - Role-based Behavioral Rules Layer
> **v1.5.0**: Claude Code Exclusive
> **v1.5.4**: Model distribution verified: 7 opus / 7 sonnet / 2 haiku, 9 acceptEdits / 7 plan
> **v1.5.6**: Auto-memory integration, multi-agent memory optimization (CC v2.1.59)
> **v1.5.7**: /simplify + /batch PDCA flow integration, English conversion for stop script outputs

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
| **opus** (7) | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect | Complex analysis, strategic decisions |
| **sonnet** (7) | bkend-expert, pdca-iterator, pipeline-guide, starter-guide, product-manager, frontend-architect, qa-strategist | Execution, guidance, iteration |
| **haiku** (2) | qa-monitor, report-generator | Fast monitoring, document generation |

**Distribution**: 7 opus / 7 sonnet / 2 haiku, 9 acceptEdits / 7 plan

## Full List

### Level-Based Agents (4)

Agents auto-recommended based on project level:

| Agent | Target Level | Role | Hooks |
|-------|--------------|------|-------|
| [[../../../agents/starter-guide|starter-guide]] | Starter | Beginner-friendly guide | - |
| [[../../../agents/bkend-expert|bkend-expert]] | Dynamic | BaaS/Fullstack expert (v1.5.3 Enhanced) | - |
| [[../../../agents/enterprise-expert|enterprise-expert]] | Enterprise | CTO-level architecture guide | - |
| [[../../../agents/infra-architect|infra-architect]] | Enterprise | AWS/K8s/Terraform expert | - |

### CTO Team Agents (5) (v1.5.3)

Agents for CTO-Led Agent Teams orchestration:

| Agent | Model | Permission Mode | Role | Hooks |
|-------|-------|-----------------|------|-------|
| [[../../../agents/cto-lead|cto-lead]] | opus | acceptEdits | CTO Team orchestration, PDCA coordination | - |
| [[../../../agents/frontend-architect|frontend-architect]] | sonnet | plan | UI/UX design, frontend architecture | - |
| [[../../../agents/product-manager|product-manager]] | sonnet | plan | Requirements analysis, scope management | - |
| [[../../../agents/qa-strategist|qa-strategist]] | sonnet | plan | Test strategy, quality planning | - |
| [[../../../agents/security-architect|security-architect]] | opus | plan | Vulnerability analysis, security review | - |

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
    ├── report-generator.md
    ├── cto-lead.md
    ├── frontend-architect.md
    ├── product-manager.md
    ├── qa-strategist.md
    └── security-architect.md
```

---

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../skills/_skills-overview]] - Skill Details
- [[../hooks/_hooks-overview]] - Hook Event Details
- [[../scripts/_scripts-overview]] - Script Details
- [[../../triggers/trigger-matrix]] - Trigger Matrix

---

## v1.5.1 Agent Enhancements

### Agent Memory

All 16 agents have `memory:` frontmatter for cross-session context persistence:

| Scope | Agents |
|-------|--------|
| `project` | code-analyzer, gap-detector, pdca-iterator, report-generator, bkend-expert, enterprise-expert, infra-architect, design-validator, qa-monitor |
| `user` | starter-guide, pipeline-guide |

### Agent Feature Guidance

Each agent now includes contextual suggestions for:
- **Output Styles**: Recommends appropriate style based on task context
- **Agent Teams**: Suggests team mode when beneficial (Dynamic/Enterprise only)

### Agent Teams Integration

Agents map to team roles:

| Role | Agents | Phases |
|------|--------|--------|
| architect | enterprise-expert, infra-architect | Design |
| developer | bkend-expert | Do, Act |
| qa | qa-monitor, gap-detector | Check |
| reviewer | code-analyzer, design-validator | Check, Act |
