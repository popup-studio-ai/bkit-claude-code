# Skills Overview

> 21 Skills defined in bkit (v1.4.5)
>
> **v1.4.1**: Added Context Engineering perspective - Domain Knowledge Layer
> **v1.5.0**: Claude Code Exclusive

## What are Skills?

Skills are **domain-specific expert knowledge** components.
- Context that Claude references during specific tasks
- Automated behavior via frontmatter hooks
- Auto-activation via "Triggers:" keywords in description

## Context Engineering Perspective (v1.4.1)

Skills form bkit's **Domain Knowledge Layer**, designed according to [[../../philosophy/context-engineering|Context Engineering]] principles.

### Skill Context Engineering Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    Skill Context Engineering                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │ Structured Knowledge │  │ Conditional Select   │             │
│  │                      │  │                      │             │
│  │ • Hierarchical Tables│  │ • Level Branching    │             │
│  │ • ASCII Diagrams     │  │ • Phase Branching    │             │
│  │ • Checklists         │  │ • 8-Language Triggers│             │
│  │ • Code Examples      │  │ • Magic Word Bypass  │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Skill Classification                         │   │
│  │                                                          │   │
│  │  Core (2)     → Global rules, template standards         │   │
│  │  Level (3)    → Starter/Dynamic/Enterprise               │   │
│  │  Pipeline(10) → 9-Phase step-by-step guides              │   │
│  │  Specialized(3) → QA, Mobile, Desktop special domains    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Engineering Techniques Applied

| Technique | Skill Implementation | Effect |
|-----------|---------------------|--------|
| **Hierarchical Tables** | Level/Phase-specific methods | Conditional knowledge selection |
| **ASCII Diagrams** | Architecture visualization | Structural understanding |
| **Checklists** | Clear completion criteria | Enables automation |
| **Code Examples** | Ready-to-apply references | Consistent implementation |
| **Few-shot Examples** | Conversation/output patterns | Predictable responses |

## Skill List (22)

### New Skills (v1.4.4)
| Skill | Purpose | Hooks |
|-------|---------|-------|
| [[../../../skills/pdca/SKILL|pdca]] | Unified PDCA cycle management (8 actions) | Stop |
| [[../../../skills/code-review/SKILL|code-review]] | Code review and quality analysis | Stop |
| [[../../../skills/claude-code-learning/SKILL|claude-code-learning]] | Claude Code learning guide | Stop |

### Core Skills (2)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[../../../skills/bkit-rules/SKILL|bkit-rules]] | PDCA rules + auto-triggering + code quality standards | PreToolUse, PostToolUse | - |
| [[../../../skills/bkit-templates/SKILL|bkit-templates]] | Template references + document standards | - | - |

### Level Skills (3)

| Skill | Target | Agent |
|-------|--------|-------|
| [[../../../skills/starter/SKILL|starter]] | Static web, beginners | [[../../../agents/starter-guide|starter-guide]] |
| [[../../../skills/dynamic/SKILL|dynamic]] | BaaS fullstack | [[../../../agents/bkend-expert|bkend-expert]] |
| [[../../../skills/enterprise/SKILL|enterprise]] | MSA/K8s + AI Native | [[../../../agents/enterprise-expert|enterprise-expert]], [[../../../agents/infra-architect|infra-architect]] |

### Pipeline Phase Skills (10)

| Skill | Phase | Hooks | Content |
|-------|-------|-------|---------|
| [[../../../skills/development-pipeline/SKILL|development-pipeline]] | Overview | Stop | 9-stage pipeline overview |
| [[../../../skills/phase-1-schema/SKILL|phase-1-schema]] | 1 | - | Schema/terminology definition |
| [[../../../skills/phase-2-convention/SKILL|phase-2-convention]] | 2 | - | Coding conventions |
| [[../../../skills/phase-3-mockup/SKILL|phase-3-mockup]] | 3 | - | Mockup development |
| [[../../../skills/phase-4-api/SKILL|phase-4-api]] | 4 | Stop | API design/implementation |
| [[../../../skills/phase-5-design-system/SKILL|phase-5-design-system]] | 5 | PostToolUse | Design system |
| [[../../../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] | 6 | PostToolUse | UI + API integration |
| [[../../../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] | 7 | - | SEO/Security |
| [[../../../skills/phase-8-review/SKILL|phase-8-review]] | 8 | Stop | Code review + gap analysis |
| [[../../../skills/phase-9-deployment/SKILL|phase-9-deployment]] | 9 | PreToolUse | Deployment |

### Specialized Skills (3)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[../../../skills/zero-script-qa/SKILL|zero-script-qa]] | Log-based QA | PreToolUse, Stop | [[../../../agents/qa-monitor|qa-monitor]] |
| [[../../../skills/mobile-app/SKILL|mobile-app]] | Mobile app dev | - | [[../../../agents/pipeline-guide|pipeline-guide]] |
| [[../../../skills/desktop-app/SKILL|desktop-app]] | Desktop app dev | - | [[../../../agents/pipeline-guide|pipeline-guide]] |

## Removed Skills (v1.2.0)

The following skills were consolidated:

| Removed Skill | Merged Into |
|---------------|-------------|
| `task-classification` | `lib/common.js` |
| `level-detection` | `lib/common.js` |
| `pdca-methodology` | `bkit-rules` |
| `document-standards` | `bkit-templates` |
| `evaluator-optimizer` | `/pdca-iterate` command |
| `analysis-patterns` | `bkit-templates` |
| `ai-native-development` | `enterprise` |
| `monorepo-architecture` | `enterprise` |

## Skill Frontmatter Structure

```yaml
---
name: skill-name
description: |
  Skill description.

  Use proactively when user...

  Triggers: keyword1, keyword2, keyword3, 한글키워드, キーワード, 关键词

  Do NOT use for: exclusion conditions
agent: connected-agent-name
allowed-tools:
  - Read
  - Write
  - Edit
  - ...
user-invocable: true|false
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  PostToolUse:
    - matcher: "Write"
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
  Stop:
    - command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/script-name.js"
---
```

## Hooks Definition

### PreToolUse (command type - recommended)
```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js"
```

### PostToolUse
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.js"
```

### Stop
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.js"
```

## Source Location

Skills are at root level (not in .claude/):

```
bkit-claude-code/
└── skills/
    ├── bkit-rules/SKILL.md
    ├── bkit-templates/SKILL.md
    ├── starter/SKILL.md
    ├── dynamic/SKILL.md
    ├── enterprise/SKILL.md
    ├── development-pipeline/SKILL.md
    ├── phase-1-schema/SKILL.md
    ├── phase-2-convention/SKILL.md
    ├── phase-3-mockup/SKILL.md
    ├── phase-4-api/SKILL.md
    ├── phase-5-design-system/SKILL.md
    ├── phase-6-ui-integration/SKILL.md
    ├── phase-7-seo-security/SKILL.md
    ├── phase-8-review/SKILL.md
    ├── phase-9-deployment/SKILL.md
    ├── zero-script-qa/SKILL.md
    ├── mobile-app/SKILL.md
    └── desktop-app/SKILL.md
```

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../hooks/_hooks-overview]] - Hook event details
- [[../scripts/_scripts-overview]] - Script details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix
