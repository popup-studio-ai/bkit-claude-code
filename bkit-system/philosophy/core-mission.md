# bkit Core Mission & Philosophy

> Core mission and 3 philosophies of bkit

## Core Mission

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         bkit's Core Mission                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   "Enable all developers using Claude Code to naturally adopt           │
│    'document-driven development' and 'continuous improvement'           │
│    even without knowing commands or PDCA methodology"                   │
│                                                                         │
│   In essence: AI guides humans toward good development practices        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Three Core Philosophies

| Philosophy | Description | Implementation |
|------------|-------------|----------------|
| **Automation First** | Claude automatically applies PDCA even if user doesn't know commands | `bkit-rules` skill + PreToolUse hooks |
| **No Guessing** | If unsure, check docs → If not in docs, ask user (never guess) | Design-first workflow, gap-detector agent |
| **Docs = Code** | Design first, implement later (maintain design-implementation sync) | PDCA workflow + `/pdca-analyze` command |

---

## User Journey

### Stage 1: Session Start

SessionStart Hook automatically displays welcome message:

```
User Options:
1. First Project → /first-claude-code
2. Learn Claude Code → /learn-claude-code
3. Project Setup → /setup-claude-code
4. Upgrade Settings → /upgrade-claude-code
```

### Stage 2: Level Detection

Claude analyzes the project and automatically detects the level:

| Level | Detection Conditions | Target Users |
|-------|---------------------|--------------|
| **Starter** | Only index.html, simple structure | Beginners, static web |
| **Dynamic** | Next.js + .mcp.json, BaaS integration | Intermediate, fullstack apps |
| **Enterprise** | services/ + infra/ folders, K8s | Advanced, MSA architecture |

### Stage 3: PDCA Auto-Apply

When user requests "create a feature":

```
1. Check Plan → Does docs/01-plan/features/{feature}.plan.md exist?
2. Check Design → Does docs/02-design/features/{feature}.design.md exist?
3. If not exists → Suggest creation | If exists → Reference and implement
4. After implementation → Suggest Gap Analysis
```

### Stage 4: Continuous Improvement

Based on Gap Analysis results:

| Match Rate | Next Action |
|------------|-------------|
| >= 90% | "PDCA complete, shall I generate a report?" |
| < 70% | "Shall I run auto-fix (iterate)?" |

---

## Value by Level

### Starter Level (Beginners)

```
Before: "I don't know where to start"
After:  4 options at session start → Natural beginning

Before: "Just write code, docs later..."
After:  Auto-generate simple plan/design docs → Habit formation

Before: "I keep making the same mistakes"
After:  Rules accumulate in CLAUDE.md → Cross-session learning
```

### Dynamic Level (Intermediate)

```
Before: "Setting up config files is tedious"
After:  /setup-claude-code → Auto-generation

Before: "Writing design docs is annoying"
After:  Templates + auto-generation → Design doc in 5 minutes

Before: "Code and docs don't match"
After:  /pdca-analyze → Auto gap analysis and sync suggestions
```

### Enterprise Level (Advanced)

```
Before: "Each team member uses Claude differently"
After:  Share plugin → Standardize entire team

Before: "Knowledge is volatile"
After:  PDCA docs + Git management → Permanent accumulation

Before: "Onboarding takes too long"
After:  /learn-claude-code → Systematic training
```

---

## Current Implementation (v1.6.1)

> **v1.5.3**: CTO-Led Agent Teams + Team Visibility + Claude Code Exclusive
> **v1.5.4**: bkend MCP Accuracy Fix - embodying "No Guessing" philosophy through exact MCP tool names (19→28+)
> **v1.5.5**: Plan Plus - Brainstorming-enhanced PDCA planning
> **v1.5.6**: Auto-Memory Integration - CC v2.1.59 auto-memory, ENH-48~51, 182 exports
> **v1.5.7**: /simplify + /batch PDCA Integration - CC v2.1.63 HTTP hooks, CC_COMMAND_PATTERNS, English conversion
> **v1.5.8**: Studio Support - Path Registry (centralized state paths), state directory migration, auto-migration, 186 exports
> **v1.5.9**: Executive Summary module, AskUserQuestion Preview UX, ENH-74~81, 199 exports
> **v1.6.0**: Skills 2.0 - Skill Classification (9W/18C/1H), PM Agent Team (5 agents), Skill Evals (28 defs)
> **v1.6.1**: CTO Orchestration Redesign, P0 Bug Fixes (4), Config-Code Sync, 3-Tier Agent Security, 1073 TC, CE-5 (88/100), 208 exports

### Component Counts

| Component | Count | Location |
|-----------|-------|----------|
| Skills | 28 (9 Workflow / 18 Capability / 1 Hybrid) | `skills/*/SKILL.md` |
| Agents | 21 (16 core + 5 PM Team) | `agents/*.md` |
| Commands | DEPRECATED | Migrated to Skills |
| Scripts | 45 | `scripts/*.js` |
| Templates | 28 | `templates/*.md` |
| lib/ | 5 modules (208 functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` |
| Evals | 28 definitions (56 content files) | Skill quality measurement |
| Tests | 39 files (1073 TC) | 8 perspectives, 99.6% pass |

### Key Features

- **Language Tier System**: 4-tier classification (AI-Native, Mainstream, Domain, Legacy)
- **Unified Hook System**: PreToolUse/PostToolUse hooks in skill frontmatter
- **Task Classification**: Quick Fix/Minor Change/Feature/Major Feature
- **Multi-Language Support**: 30+ file extensions supported

---

---

## v1.5.3 Features

### Natural Discovery Through Automation First

Three features introduced in v1.5.1 that align with the core mission:

| Feature | Philosophy Alignment | Discovery Mechanism |
|---------|---------------------|---------------------|
| **Output Styles** | Automation First | Auto-suggested based on detected level |
| **CTO-Led Agent Teams** | Automation First | Auto-suggested for major features; CTO orchestrates PDCA phases |
| **Agent Memory** | Automation First | Fully automatic, no user action needed |

### Output Styles

Response formatting optimized per project level:
- Starter → `bkit-learning` (learning points, concept explanations)
- Dynamic → `bkit-pdca-guide` (PDCA status badges, checklists)
- Enterprise → `bkit-enterprise` (tradeoff analysis, cost impact)

### CTO-Led Agent Teams

CTO Lead (opus) orchestrates specialized teams for PDCA execution:
- Dynamic: 3 teammates (developer, frontend, qa) + CTO Lead
- Enterprise: 5 teammates (architect, developer, qa, reviewer, security) + CTO Lead
- 5 orchestration patterns: Leader, Council, Swarm, Pipeline, Watchdog
- Auto-suggested for Major Features (Automation First)
- Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

### Agent Memory

Automatic cross-session context persistence for all 21 agents.
Scopes: `project` (14 agents), `user` (2 agents: starter-guide, pipeline-guide)

---

## v1.6.0 Features

### Skills 2.0 Integration

bkit v1.6.0 integrates CC 2.1.0 Skills 2.0 with three major capabilities:

| Feature | Philosophy Alignment | Impact |
|---------|---------------------|--------|
| **Skill Classification** | Automation First | 9 Workflow skills = permanent core; 18 Capability skills = data-driven lifecycle |
| **Skill Evals** | No Guessing | 28 eval definitions measure skill quality objectively |
| **PM Agent Team** | Docs = Code | 5 PM agents ensure product discovery documents before Plan |

### PM Agent Team (pre-Plan Product Discovery)

PM Team embodies "Direction Setting" by ensuring structured product discovery before PDCA:
- pm-lead orchestrates the discovery workflow
- pm-discovery conducts market and user research
- pm-strategy defines product positioning
- pm-research gathers competitive intelligence
- pm-prd generates PRD documents

### Skill Classification

| Classification | Count | Core Philosophy |
|:---:|:---:|---|
| **Workflow** | 9 | Automation First — permanent value regardless of model advancement |
| **Capability** | 18 | No Guessing — guidance that models may eventually internalize |
| **Hybrid** | 1 | Both workflow and capability characteristics |

---

## Related Documents

- [[ai-native-principles]] - AI-Native core competencies
- [[pdca-methodology]] - PDCA methodology details
- [[../README]] - System overview
- [[../_GRAPH-INDEX]] - Obsidian graph hub
