# Skills Overview

> 18 Skills defined in bkit (v1.2.0)

## What are Skills?

Skills are **domain-specific expert knowledge** components.
- Context that Claude references during specific tasks
- Automated behavior via frontmatter hooks
- Auto-activation via "Triggers:" keywords in description

## Skill List (18)

### Core Skills (2)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[bkit-rules]] | PDCA rules + auto-triggering + code quality standards | PreToolUse, PostToolUse | - |
| [[bkit-templates]] | Template references + document standards | - | - |

### Level Skills (3)

| Skill | Target | Agent |
|-------|--------|-------|
| [[starter]] | Static web, beginners | [[../agents/starter-guide]] |
| [[dynamic]] | BaaS fullstack | [[../agents/bkend-expert]] |
| [[enterprise]] | MSA/K8s + AI Native | [[../agents/enterprise-expert]], [[../agents/infra-architect]] |

### Pipeline Phase Skills (10)

| Skill | Phase | Hooks | Content |
|-------|-------|-------|---------|
| [[development-pipeline]] | Overview | Stop | 9-stage pipeline overview |
| [[phase-1-schema]] | 1 | - | Schema/terminology definition |
| [[phase-2-convention]] | 2 | - | Coding conventions |
| [[phase-3-mockup]] | 3 | - | Mockup development |
| [[phase-4-api]] | 4 | Stop | API design/implementation |
| [[phase-5-design-system]] | 5 | PostToolUse | Design system |
| [[phase-6-ui-integration]] | 6 | PostToolUse | UI + API integration |
| [[phase-7-seo-security]] | 7 | - | SEO/Security |
| [[phase-8-review]] | 8 | Stop | Code review + gap analysis |
| [[phase-9-deployment]] | 9 | PreToolUse | Deployment |

### Specialized Skills (3)

| Skill | Purpose | Hooks | Agent |
|-------|---------|-------|-------|
| [[zero-script-qa]] | Log-based QA | PreToolUse, Stop | [[../agents/qa-monitor]] |
| [[mobile-app]] | Mobile app dev | - | [[../agents/pipeline-guide]] |
| [[desktop-app]] | Desktop app dev | - | [[../agents/pipeline-guide]] |

## Removed Skills (v1.2.0)

The following skills were consolidated:

| Removed Skill | Merged Into |
|---------------|-------------|
| `task-classification` | `lib/common.sh` |
| `level-detection` | `lib/common.sh` |
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

  Triggers: keyword1, keyword2, keyword3

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
      script: "${CLAUDE_PLUGIN_ROOT}/scripts/script-name.sh"
  PostToolUse:
    - matcher: "Write"
      script: "${CLAUDE_PLUGIN_ROOT}/scripts/script-name.sh"
  Stop:
    - script: "${CLAUDE_PLUGIN_ROOT}/scripts/script-name.sh"
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
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
```

### PostToolUse
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh"
```

### Stop
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
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

- [[../hooks/_hooks-overview]] - Hook event details
- [[../scripts/_scripts-overview]] - Script details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix
