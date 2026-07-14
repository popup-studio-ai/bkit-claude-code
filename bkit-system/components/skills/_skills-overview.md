# Skills Overview

> 44 Skills defined in bkit (v2.1.13)
>
> **Counting note**: CC's `/plugin` Skills count = `skills/` + `commands/` entries (same-name dedup); bkit's 44 skills + `commands/output-style-setup.md` display as **45** — expected, not a drift.
>
> **v2.1.30**: Stop-hook stdin-block hardening (#139) — skills unchanged (44); a runtime-reliability fix in `lib/core/io.js` / `scripts/unified-stop.js` (bounded stdin read so the Stop hook cannot stall on a held-open pipe). No SKILL.md or count change.
> **v2.1.26**: MCP manifest relocation + Fable cost retune — skills unchanged (44; CC `/plugin` displays 45 = 44 skills + `commands/output-style-setup.md`, per the counting note below). Skill prose model references unchanged (cto-lead/pm-lead stay fable); the retuned verifiers (gap-detector/design-validator/pdca-iterator → opus) are agents, not skills. CC recommended: v2.1.198.
> **v2.1.25**: Claude 5 Model Alignment — skills unchanged (44); model references in `pdca`, `pm-discovery`, `cc-version-analysis` SKILL.md synced to the 4-tier matrix (cto-lead/pm-lead → fable). CC recommended: v2.1.198.
> **v2.1.24**: Skill namespace hardening (#125/#126) — skills unchanged (44); namespaced invocation (`bkit:pdca`) now resolves next-skill / pdca-phase guidance and Stop-handler dispatch correctly.
> **v2.1.13**: Sprint Management — added `sprint` skill with 16 sub-actions (init, start, status, pause, resume, phase, feature, fork, list, archive, qa, report, iterate, watch, help, master-plan). Total 43 → 44. Added sprint cross-references to `bkit`, `pdca`, `control`, `plan-plus`, `audit`, `qa-phase`, `pm-discovery`, `pdca-batch`, `bkit-rules`, `bkit-templates`, `enterprise`, `development-pipeline`, `rollback`, `deploy` (관점 1-1 sprint integration sweep).
> **v2.1.11**: 4 Sprints × 20 FRs — added 4 skills: `bkit-evals` (β2 eval runner), `bkit-explore` (β1 5-category tree), `pdca-watch` (β4 read-only state tap), `pdca-fast-track` (β5 Daniel-mode auto-approve). Total 39 → 43. CC recommended: v2.1.118+ (79 consecutive compatible releases).
> **v2.1.10**: Sprint 5a~7 complete — SKILL_TRIGGER_PATTERNS expanded 4→15 (G-J-01), matchRate SSoT changed 100→90 (G-P-01), ENH-202 `context: fork` expanded 1→9 skills (phase-1 ~ phase-8 + qa-phase + zero-script-qa). Skills 39. CC recommended: v2.1.117+.
> **v2.1.9**: CC v2.1.116 response — ENH-253/254/259/263 (4 ENH shipping) + Docs=Code 100% sync. Skills unchanged (39, `zero-script-qa` retains sole `context: fork`). CC recommended: v2.1.116+ (74 consecutive compatible, v2.1.115 skipped).
> **v2.1.8**: Issue #81 hotfix - Docs=Code philosophy restored. Skills unchanged (cc-version-analysis, qa-phase retained). Focus was hook/lib layer (`lib/core/context-budget.js`, `session-ctx-fp.js`).
> **v2.1.7**: Issue #79 hotfix, 38 skills.
>
> **v1.4.1**: Added Context Engineering perspective - Domain Knowledge Layer
> **v1.5.0**: Claude Code Exclusive
> **v1.5.7**: /simplify, /batch CC command awareness in skills, CC_COMMAND_PATTERNS integration
> **v1.5.8**: Studio Support - state file path references updated in PDCA skills
> **v1.5.9**: Executive Summary module, AskUserQuestion Preview UX, ENH-74~81, 199 exports
> **v1.6.0**: Skills 2.0 - Skill Classification (9W/18C/1H), pm-discovery skill, Skill Evals (28 defs)
> **v1.6.1**: CTO Orchestration Redesign, P0 Bug Fixes (4), 3-Tier Agent Security, Skill Evals 28/28 full implementation, 1073 TC, 208 exports
> **v1.6.2**: 31 skills (9 Workflow / 20 Capability / 2 Hybrid), 210 exports, CC v2.1.78
> **v2.0.3**: 36 skills (17 Workflow / 18 Capability / 1 Hybrid), ~580+ exports, CC v2.1.81+
> **v2.0.6**: 37 skills (18 Workflow / 18 Capability / 1 Hybrid), ~620+ exports — +deploy skill
> **v1.6.2+**: cc-version-analysis skill (32 skills, 10 Workflow / 20 Capability / 2 Hybrid)

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
│  │  PDCA (2)     → pdca + plan-plus (brainstorming)         │   │
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

## Skill Classification (v1.6.0)

All 43 skills are classified into three categories based on CC 2.1.0 Skills 2.0 (per `evals/config.json` SSOT):

### Workflow Skills (18) — Permanent Core Value

Process automation skills that remain valuable regardless of model advancement:

| Skill | Purpose |
|-------|---------|
| pdca | Unified PDCA cycle management (8 actions) |
| plan-plus | Brainstorming-enhanced PDCA planning |
| pm-discovery | Product discovery and market research |
| development-pipeline | 9-stage pipeline overview |
| bkit-rules | PDCA rules + auto-triggering + code quality standards |
| bkit-templates | Template references + document standards |
| phase-2-convention | Coding conventions |
| phase-8-review | Code review + gap analysis |
| code-review | Code review and quality analysis |
| zero-script-qa | Log-based QA |

### Capability Skills (18) — Model-Dependent Guidance

Domain knowledge that may become redundant as models improve:

| Skill | Deprecation Risk |
|-------|:---:|
| starter | low |
| dynamic | low |
| enterprise | low |
| phase-1-schema | medium |
| phase-3-mockup | high |
| phase-4-api | medium |
| phase-5-design-system | medium |
| phase-6-ui-integration | medium |
| phase-7-seo-security | medium |
| phase-9-deployment | medium |
| claude-code-learning | high |
| mobile-app | low |
| desktop-app | low |
| bkend-quickstart | medium |
| bkend-data | medium |
| bkend-auth | medium |
| bkend-cookbook | medium |
| bkend-storage | medium |

### Hybrid Skills (1)

Skills combining workflow and capability characteristics:

| Skill | Workflow Aspect | Capability Aspect |
|-------|----------------|-------------------|
| plan-plus | PDCA planning process | Brainstorming methodology guidance |

---

## Skill Evals (28 definitions) (v1.6.0)

Each skill has a paired eval definition for data-driven quality measurement:
- Evals measure skill output quality against ground truth
- 3 consecutive parity passes trigger deprecation candidate status
- Supports A/B testing of skill variants via Skill Creator

## Skill Creator (v1.6.0)

Integrated workflow for creating new skills following bkit conventions:
- Generates SKILL.md with proper frontmatter structure
- Creates paired eval definition automatically
- Supports A/B testing to compare skill variants

---

## Skill List (36)

### New Skills (v1.6.0)
| Skill | Purpose | Hooks | Classification |
|-------|---------|-------|:---:|
| [[../../../skills/pm-discovery/SKILL|pm-discovery]] | Product discovery and market research | - | Workflow |

### New Skills (v1.5.5)
| Skill | Purpose | Hooks |
|-------|---------|-------|
| [[../../../skills/plan-plus/SKILL|plan-plus]] | Brainstorming-enhanced PDCA planning (6-phase process) | Stop |

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

### bkend Specialist Skills (v1.5.4)

| Skill | Level | Description |
|-------|-------|-------------|
| bkend-quickstart | Dynamic | Platform onboarding, MCP setup, resource hierarchy |
| bkend-data | Dynamic | Database expert (CRUD, column types, filtering) |
| bkend-auth | Dynamic | Authentication (email/social, JWT, RBAC, RLS) |
| bkend-storage | Dynamic | File storage (Presigned URL, visibility levels) |
| bkend-cookbook | Dynamic | Practical tutorials and troubleshooting |

#### v1.5.4 bkend Skill Changes
- **Numbered tools → Named tools**: All MCP tool references changed from numbered list to exact tool names (e.g., `bkend_create_item`, `bkend_get_tables`)
- **MCP 4 categories**: Fixed 3 + Project 9 + Table 11 + Data CRUD 5 = 28+ tools
- **Live Reference paths**: All skills reference `en/` endpoint paths for accuracy
- **Dynamic Base URL**: `{BASE_URL}` pattern replaces hardcoded URLs
- **bkend-patterns.md SSOT**: Shared template expanded 85 → 140 lines

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
    ├── desktop-app/SKILL.md
    └── pm-discovery/SKILL.md
```

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../hooks/_hooks-overview]] - Hook event details
- [[../scripts/_scripts-overview]] - Script details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix

---

## v1.5.1 Skill Enhancements

### Output Style Integration

Level skills now suggest appropriate output styles:

| Skill | Suggested Style |
|-------|----------------|
| `/starter` | `bkit-learning` |
| `/dynamic` | `bkit-pdca-guide` |
| `/enterprise` | `bkit-enterprise` |
| `/pdca` | `bkit-pdca-guide` |

### Agent Teams Integration

`/pdca team {feature}` enables parallel PDCA execution:
- Dynamic: 3 teammates (developer, frontend, qa) + CTO Lead
- Enterprise: 5 teammates (architect, developer, qa, reviewer, security) + CTO Lead

### Learning Skill Enhancement

`/claude-code-learning` now includes Level 6: Advanced Features covering:
- Output Styles configuration and usage
- Agent Memory scopes and behavior
- Agent Teams setup and team composition

### Output Styles (4)

| Style | File | Best For |
|-------|------|----------|
| `bkit-learning` | `output-styles/bkit-learning.md` | Beginners, learning |
| `bkit-pdca-guide` | `output-styles/bkit-pdca-guide.md` | PDCA workflows |
| `bkit-enterprise` | `output-styles/bkit-enterprise.md` | Architecture decisions |
| `bkit-pdca-enterprise` | `output-styles/bkit-pdca-enterprise.md` | Enterprise PDCA (v1.5.3) |
