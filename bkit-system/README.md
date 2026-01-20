# bkit System Architecture

> Architecture guide documenting bkit plugin's internal structure and trigger system

## Purpose of This Document

1. **Predictability**: Understand what features trigger based on user actions
2. **Testability**: Verify expected behavior per scenario
3. **Contributor Guide**: Understand relationships when adding new features

## Quick Links

- [[_GRAPH-INDEX]] - Obsidian graph hub (visualize all relationships)
- [[triggers/trigger-matrix]] - Trigger matrix (core reference)
- [[scenarios/scenario-write-code]] - Code write flow

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     bkit Trigger System                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Skills     │───▶│   Agents     │───▶│   Scripts    │      │
│  │  (18)        │    │  (11)        │    │  (19)        │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                   │                   │               │
│         ▼                   ▼                   ▼               │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                    Hooks Layer                        │      │
│  │  PreToolUse │ PostToolUse │ Stop │ SessionStart      │      │
│  └──────────────────────────────────────────────────────┘      │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────┐      │
│  │                  Claude Code Runtime                  │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Component Summary

| Component | Count | Role | Details |
|-----------|-------|------|---------|
| Skills | 18 | Domain knowledge | [[components/skills/_skills-overview]] |
| Agents | 11 | Specialized task execution | [[components/agents/_agents-overview]] |
| Commands | 18 | Slash commands | `/pdca-*`, `/init-*`, etc. |
| Hooks | 3 events | Event-based triggers | [[components/hooks/_hooks-overview]] |
| Scripts | 19 | Actual logic execution | [[components/scripts/_scripts-overview]] |
| Lib | 1 | Shared utilities | `lib/common.sh` |
| Config | 1 | Centralized settings | `bkit.config.json` |
| Templates | 20 | Document templates | PDCA + Pipeline phases |

## Trigger Layers

bkit triggers occur across 5 layers:

```
Layer 1: hooks.json          → SessionStart, PreToolUse, PostToolUse hooks
Layer 2: Skill Frontmatter   → hooks: PreToolUse, PostToolUse, Stop
Layer 3: Agent Frontmatter   → hooks: PreToolUse, PostToolUse
Layer 4: Description Triggers → "Triggers:" keyword matching
Layer 5: Scripts             → Actual bash logic execution
```

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

| Item | Path |
|------|------|
| Skills | `skills/*/SKILL.md` |
| Agents | `agents/*.md` |
| Scripts | `scripts/*.sh` |
| Commands | `commands/*.md` |
| Templates | `templates/*.md` |
| Hooks | `hooks/hooks.json` |
| Lib | `lib/common.sh` |
| Config | `bkit.config.json` |

> **Note**: The `.claude/` folder is not in version control. All plugin elements are at root level.
