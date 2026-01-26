# bkit System Architecture

> Architecture guide documenting bkit plugin's internal structure and trigger system
>
> **v1.4.0**: Dual Platform Support (Claude Code + Gemini CLI)
>
> **v1.4.1**: Context Engineering perspective added - Optimal token curation for LLM reasoning
>
> **v1.4.2**: Context Engineering modules + Task Management integration + UserPromptSubmit/PreCompact hooks
>
> **v1.4.3**: Gemini CLI v0.25+ compatibility - `xmlSafeOutput()` for XML wrapping, engines version update

## Purpose of This Document

1. **Predictability**: Understand what features trigger based on user actions
2. **Testability**: Verify expected behavior per scenario
3. **Contributor Guide**: Understand relationships when adding new features

## Quick Links

- [[_GRAPH-INDEX]] - Obsidian graph hub (visualize all relationships)
- [[philosophy/core-mission]] - Core mission & 3 philosophies
- [[philosophy/context-engineering]] - Context Engineering principles ⭐ NEW
- [[triggers/trigger-matrix]] - Trigger matrix (core reference)
- [[scenarios/scenario-write-code]] - Code write flow

## Context Engineering Overview (v1.4.1)

bkit is a practical implementation of **Context Engineering**. Context Engineering is the discipline of optimally curating context tokens for LLM reasoning.

```
┌─────────────────────────────────────────────────────────────────┐
│              bkit Context Engineering Architecture              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Domain Knowledge │  │ Behavioral Rules │  │ State Mgmt   │  │
│  │    (18 Skills)   │  │   (11 Agents)    │  │(lib/common)  │  │
│  │                  │  │                  │  │              │  │
│  │ • 9-Phase Guide  │  │ • Role Def.      │  │ • PDCA v2.0  │  │
│  │ • 3 Levels       │  │ • Constraints    │  │ • Multi-Feat │  │
│  │ • 8 Languages    │  │ • Few-shot       │  │ • Caching    │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
│           └─────────────────────┼────────────────────┘          │
│                                 ▼                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                5-Layer Hook System                        │  │
│  │  L1: hooks.json (SessionStart)                           │  │
│  │  L2: Skill Frontmatter (PreToolUse/PostToolUse/Stop)     │  │
│  │  L3: Agent Frontmatter (PreToolUse/PostToolUse)          │  │
│  │  L4: Description Triggers (keyword matching)             │  │
│  │  L5: Scripts (28 Node.js modules)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                 │                               │
│                                 ▼                               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Dynamic Context Injection                         │  │
│  │  • Task Size → PDCA Level                                │  │
│  │  • User Intent → Agent/Skill Auto-Trigger                │  │
│  │  • Ambiguity Score → Clarifying Questions                │  │
│  │  • Match Rate → Check-Act Iteration                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Core Context Engineering Patterns

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Role Definition** | Agent frontmatter | Specify expertise, responsibility scope, level |
| **Structured Instructions** | Skill SKILL.md | Structure knowledge with checklists, tables, diagrams |
| **Few-shot Examples** | Agent/Skill prompts | Code patterns, output templates, conversation examples |
| **Constraint Specification** | Hook + Permission Mode | Tool restrictions, score thresholds, workflow rules |
| **State Injection** | SessionStart + Scripts | PDCA state, feature context, iteration counters |
| **Adaptive Guidance** | lib/common.js | Level-based branching, language-specific triggers, ambiguity handling |

Details: [[philosophy/context-engineering]]

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                bkit Trigger System (v1.4.2)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Skills     │───▶│   Agents     │───▶│   Scripts    │      │
│  │  (18)        │    │  (11)        │    │  (28)        │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    Hooks Layer (5 events)             │      │
│  │  SessionStart │ UserPromptSubmit │ PreToolUse │       │      │
│  │  PostToolUse  │ PreCompact       │ (+ Stop)           │      │
│  └──────────────────────────────────────────────────────┘      │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │         Claude Code / Gemini CLI Runtime              │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Summary

| Component | Count | Role | Details |
|-----------|-------|------|---------|
| Skills | 18 | Domain knowledge | [[components/skills/_skills-overview]] |
| Agents | 11 | Specialized task execution | [[components/agents/_agents-overview]] |
| Commands | 20 (×2) | Slash commands | Claude: `commands/*.md`, Gemini: `commands/gemini/*.toml` |
| Hooks | 5 events | Event-based triggers | [[components/hooks/_hooks-overview]] |
| Scripts | 28 | Actual logic execution | [[components/scripts/_scripts-overview]] |
| Lib | 6 | Shared utilities | `lib/*.js` (86+ functions) |
| Config | 1 | Centralized settings | `bkit.config.json` |
| Templates | 23 | Document templates | PDCA + Pipeline + Shared |

## Trigger Layers

bkit triggers occur across 5 layers:

```
Layer 1: hooks.json (Global) → SessionStart, UserPromptSubmit, PreCompact (v1.4.2)
Layer 2: Skill Frontmatter   → hooks: PreToolUse, PostToolUse, Stop
Layer 3: Agent Frontmatter   → hooks: PreToolUse, PostToolUse
Layer 4: Description Triggers → "Triggers:" keyword matching
Layer 5: Scripts             → Actual Node.js logic execution (28 modules)
```

> **Note**: Global hooks.json contains 5 hook events. PreToolUse/PostToolUse hooks are also defined in skill/agent frontmatter for contextual activation.

Details: [[triggers/trigger-matrix]]

## Key Scenarios

| Scenario | Triggered Components | Details |
|----------|---------------------|---------|
| Code Write (Write/Edit) | 2-3 hooks + scripts | [[scenarios/scenario-write-code]] |
| New Feature Request | PDCA flow + agents | [[scenarios/scenario-new-feature]] |
| QA Execution | qa-monitor + scripts | [[scenarios/scenario-qa]] |

## Folder Structure

```
bkit-system/
├── README.md                  # This file
├── _GRAPH-INDEX.md            # Obsidian graph hub
├── philosophy/                # Design philosophy
│   ├── core-mission.md        # Core mission & 3 philosophies
│   ├── ai-native-principles.md # AI-Native development principles
│   └── pdca-methodology.md    # PDCA & Pipeline methodology
├── components/
│   ├── skills/                # Skill details
│   ├── agents/                # Agent details
│   ├── hooks/                 # Hook event reference
│   └── scripts/               # Script details
├── triggers/
│   ├── trigger-matrix.md      # Trigger matrix
│   └── priority-rules.md      # Priority rules
├── scenarios/                 # User scenario flows
└── testing/
    └── test-checklist.md      # Test checklist
```

## Source Locations

| Item | Claude Code | Gemini CLI |
|------|-------------|------------|
| Skills | `skills/*/SKILL.md` | (shared) |
| Agents | `agents/*.md` | (shared) |
| Scripts | `scripts/*.js` | (shared) |
| Commands | `commands/*.md` | `commands/gemini/*.toml` |
| Templates | `templates/*.md` | (shared) |
| Hooks | `hooks/hooks.json` | `gemini-extension.json` |
| Lib | `lib/common.js` | (shared) |
| Config | `bkit.config.json` | (shared) |
| Context | `CLAUDE.md` | `GEMINI.md` |
| Manifest | `.claude-plugin/plugin.json` | `gemini-extension.json` |

> **Note**: The `.claude/` folder is not in version control. All plugin elements are at root level.
> **v1.4.0**: Skills, Agents, Scripts, Templates, Lib, and Config are shared between both platforms.

---

## Viewing with Obsidian

The bkit-system documentation is optimized for [Obsidian](https://obsidian.md/)'s Graph View, allowing you to visualize component relationships interactively.

### Option 1: Open bkit-system as a Vault (Recommended)

1. Open Obsidian
2. Click "Open folder as vault"
3. Select the `bkit-system/` folder
4. Press `Ctrl/Cmd + G` to open Graph View
5. Start from `_GRAPH-INDEX.md` to explore all connections

### Option 2: Open Project Root as a Vault

1. Open Obsidian
2. Click "Open folder as vault"
3. Select the project root folder
4. Navigate to `bkit-system/` in the file explorer
5. Open `_GRAPH-INDEX.md` and use Graph View

### Pre-configured Settings

The `bkit-system/.obsidian/` folder includes shared settings:

| File | Purpose | Shared |
|------|---------|:------:|
| `graph.json` | Optimized graph view layout | Yes |
| `core-plugins.json` | Required Obsidian plugins | Yes |
| `workspace.json` | Personal workspace state | No |
| `app.json` | Personal app settings | No |

> **Tip**: The graph settings are pre-configured for optimal visualization of bkit's 18 skills, 11 agents, 28 scripts, and their relationships.
