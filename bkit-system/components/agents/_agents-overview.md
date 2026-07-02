# Agents Overview

> List of 34 Agents defined in bkit and their roles (v2.1.13)
>
> **v2.1.26**: Fable cost retune — the 3 high-frequency PDCA verifiers (gap-detector, design-validator, pdca-iterator) move fable→opus (they run in the repeated Check/iterate loop; Opus 4.8 is strong at verification at half Fable's $10/$50 cost). Matrix now: 6 fable (leads + sprint verifier) / 10 opus / 16 sonnet / 2 haiku. Fable stays on the long-horizon orchestrators where its planning/delegation edge compounds.
> **v2.1.25**: Claude 5 Model Alignment + Issue Response — 4-tier role-based model matrix: 9 fable (verification & orchestration core) / 7 opus (deep reasoning & security) / 16 sonnet (implementers) / 2 haiku (monitors). 16 reassignments (9 opus→fable, 1 opus→sonnet sprint-report-writer, 6 sonnet→haiku pdca-eval-* — subsequently REMOVED from agents/ per #128/ADR 0014, deprecation registry at test/contract/deprecation-registry.json). Descriptions compacted −44% per #129 (compact 8-language triggers; "Do NOT use for" moved to body). Model floor: `fable` requires CC ≥ v2.1.170 (SessionStart advisory ENH-368 below it). CC recommended: v2.1.198.
> **v2.1.24**: Skill namespace hardening (#125/#126) — agents unchanged (40 agent files: 34 active + 6 deprecated pdca-eval-* tombstones).
> **v2.1.13**: Sprint Management agents — added 4 sprint agents (`sprint-orchestrator`, `sprint-master-planner`, `sprint-qa-flow`, `sprint-report-writer`). Removed 6 pdca-eval-* agents (Korean-only frontmatter + v1.6.1 stale baseline + 0 spawn sites). Total 36 → 34. cto-lead/pm-lead/qa-lead extended with sprint Task spawn patterns + body sections. pdca-iterator/product-manager/gap-detector/self-healing/pipeline-guide/qa-monitor descriptions extended for sprint awareness (관점 1-1).
> **v2.1.11**: 4 Sprints × 20 FRs Integrated Enhancement — Agents unchanged (36); Sprint γ adds `lib/application/pdca-lifecycle/` pilot referenced by `pdca-iterator` and `gap-detector` workflows. CC recommended: v2.1.118+ (79 consecutive compatible releases).
> **v2.1.10**: Sprint 5a~7 complete — `cto-lead` body expanded (5 Task spawn blocks + `Task(pm-lead)` / `Task(qa-lead)` / `Task(pdca-iterator)` added to frontmatter, G-T-01/02). Enterprise teammates 5→6 (G-T-03). Bulk `@version 2.0.0 → 2.1.10` refresh across 79 files (66 lib + 13 scripts). CC recommended: v2.1.117+ (75 consecutive compatible releases).
> **v2.1.9**: CC v2.1.116 response — ENH-253/254/259/263 (zero-script-qa fork verification, defense-in-depth security docs, custom skill warning, Docs=Code 15-file correction). CC recommended: v2.1.116+ (74 consecutive compatible, v2.1.115 skipped).
> **v2.1.8**: Issue #81 hotfix - agents unchanged. Hook/lib layer focus (`lib/core/context-budget.js`, `session-ctx-fp.js`). CC recommended: v2.1.111+ (72 consecutive compatible).
> **v2.1.7**: Issue #79 hotfix, PDCA workflow stabilization.
>
> **v1.4.1**: Added Context Engineering perspective - Role-based Behavioral Rules Layer
> **v1.5.0**: Claude Code Exclusive
> **v1.5.4**: Model distribution verified: 7 opus / 7 sonnet / 2 haiku, 9 acceptEdits / 7 plan
> **v1.5.6**: Auto-memory integration, multi-agent memory optimization (CC v2.1.59)
> **v1.5.7**: /simplify + /batch PDCA flow integration, English conversion for stop script outputs
> **v1.5.8**: Studio Support awareness - Path Registry, state directory migration, 186 exports
> **v1.5.9**: Executive Summary module, AskUserQuestion Preview UX, ENH-74~81, 199 exports
> **v1.6.0**: PM Agent Team (5 agents), 21 total agents
> **v1.6.1**: 3-Tier Agent Security Model (9 acceptEdits agents with tiered disallowedTools), CTO Orchestration Redesign, 208 exports, CC v2.1.71
> **v1.6.2**: Agent frontmatter effort/maxTurns native support (29 agents), CC v2.1.78
> **v1.6.2+**: cc-version-researcher + bkit-impact-analyst agents (31 agents), CC version analysis workflow
> **v2.0.6**: self-healing agent (opus) added (32 agents, 11 opus / 19 sonnet / 2 haiku)

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
│  │  fable  → Verification & orchestration core              │   │
│  │           (long-horizon leads + verifiers)                │   │
│  │  opus   → Deep reasoning & security                      │   │
│  │  sonnet → Execution, guidance, iterative tasks           │   │
│  │  haiku  → Fast monitoring, document generation           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Model Selection Strategy by Agent

| Model | Agents | Characteristics |
|-------|--------|-----------------|
| **fable** (6) | cto-lead, sprint-orchestrator, sprint-master-planner, pm-lead, qa-lead, sprint-qa-flow | Long-horizon orchestration (leads) + sprint dataFlow verifier — requires CC ≥ v2.1.170 |
| **opus** (10) | security-architect, code-analyzer, self-healing, infra-architect, enterprise-expert, bkit-impact-analyst, cc-version-researcher, gap-detector, design-validator, pdca-iterator | Deep reasoning & security + high-frequency PDCA verifiers (v2.1.26 cost retune: gap-detector/design-validator/pdca-iterator fable→opus — half the cost per run, strong verification) |
| **sonnet** (16) | bkend-expert, frontend-architect, pipeline-guide, pm-discovery, pm-lead-skill-patch, pm-prd, pm-research, pm-strategy, product-manager, qa-debug-analyst, qa-strategist, qa-test-generator, qa-test-planner, skill-needs-extractor, sprint-report-writer, starter-guide | Execution, guidance, iteration |
| **haiku** (2) | qa-monitor, report-generator | Fast monitoring, document generation |

**Distribution**: 34 total agents = 6 fable / 10 opus / 16 sonnet / 2 haiku (v2.1.26: high-frequency verifiers gap-detector/design-validator/pdca-iterator retuned fable→opus for cost; 6 deprecated pdca-eval-* registry-tombstoned per ADR 0014 — no stub files remain in agents/)

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
| [[../../../agents/cto-lead|cto-lead]] | fable | acceptEdits | CTO Team orchestration, PDCA coordination | - |
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

### PM Team Agents (5) (v1.6.0)

Agents for pre-Plan product discovery:

| Agent | Model | Permission Mode | Role | Hooks |
|-------|-------|-----------------|------|-------|
| [[../../../agents/pm-lead|pm-lead]] | fable | plan | PM Team orchestrator, discovery workflow coordination | - |
| [[../../../agents/pm-discovery|pm-discovery]] | sonnet | plan | Market research, user interviews, pain point analysis | - |
| [[../../../agents/pm-strategy|pm-strategy]] | sonnet | plan | Product positioning, go-to-market strategy | - |
| [[../../../agents/pm-research|pm-research]] | sonnet | plan | Competitive analysis, trend research, data gathering | - |
| [[../../../agents/pm-prd|pm-prd]] | sonnet | plan | PRD document generation with user stories | - |

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
  1-2 role sentences (distinctive capability words = CC semantic-delegation signal).
  Use proactively when user...
  Triggers: full EN keyword list, full KO keyword list, then EXACTLY ONE anchor
  keyword per other language in order JA, ZH, ES, FR, DE, IT (compact 8-language
  encoding, issue #129 / v2.1.25 — budget: <= 700 bytes UTF-8, locked by
  test/regression/issue-129-description-budget.test.js)
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
# NOTE (v2.1.25, #129): "Do NOT use for" exclusions and version/auto-invoke notes
# live in the agent BODY ("## When NOT to use this agent" / "## Delegation notes"),
# loaded only on invocation — never in the always-resident description.
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
    ├── security-architect.md
    ├── pm-lead.md
    ├── pm-discovery.md
    ├── pm-strategy.md
    ├── pm-research.md
    └── pm-prd.md
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

All 36 agents have `memory:` frontmatter for cross-session context persistence:

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
