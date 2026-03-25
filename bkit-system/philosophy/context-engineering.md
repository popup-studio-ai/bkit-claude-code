# Context Engineering Principles

> Optimal token curation for LLM inference — bkit v2.0.0 architecture
>
> **v2.0.0**: AI Native Development OS — State machine, workflow engine, controllable AI,
> audit system, quality gates, CLI dashboard, MCP servers, 88 lib modules, ~620+ exports

## What is Context Engineering?

```
Traditional Prompt Engineering:
  "The art of writing good prompts"

Context Engineering:
  "The art of designing systems that integrate prompts, tools, and state
   to provide LLMs with optimal context for inference"
```

bkit is a **practical implementation of Context Engineering**, providing a systematic context management system for Claude Code with 37 skills, 32 agents, 18 hook events, and 2 MCP servers.

---

## v2.0.0 Context Engineering Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                    bkit v2.0.0 Context Engineering Architecture              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                 Multi-Level Context Hierarchy (FR-01)                  │  │
│  │  L1: Plugin Policy ──→ L2: User Config ──→ L3: Project ──→ L4: Session│  │
│  │     (bkit defaults)     (~/.claude/bkit/)   (.bkit/state/)  (runtime) │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│                                     ▼                                        │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │                  18-Event Hook System (6 Layers)                       │  │
│  │                                                                        │  │
│  │  L1: hooks.json ─→ SessionStart, UserPromptSubmit, PreCompact,         │  │
│  │                     PostCompact, Stop, StopFailure, TaskCompleted,     │  │
│  │                     SubagentStart/Stop, TeammateIdle, SessionEnd,      │  │
│  │                     PostToolUseFailure, InstructionsLoaded,            │  │
│  │                     ConfigChange, PermissionRequest, Notification      │  │
│  │  L2: Skill YAML ─→ PreToolUse, PostToolUse, Stop                      │  │
│  │  L3: Agent YAML ─→ PreToolUse, PostToolUse                            │  │
│  │  L4: Triggers   ─→ 8-language keyword detection (EN/KO/JA/ZH/ES/FR/  │  │
│  │                     DE/IT)                                             │  │
│  │  L5: Scripts    ─→ 21 Node.js hook scripts                            │  │
│  │  L6: Team Orch. ─→ CTO-led phase routing                             │  │
│  └────────────────────────────────────────────────────────────────────────┘  │
│                                     │                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ State Machine    │  │ Workflow Engine   │  │ Controllable AI         │   │
│  │ (NEW v2.0.0)     │  │ (NEW v2.0.0)     │  │ (NEW v2.0.0)           │   │
│  │                  │  │                  │  │                          │   │
│  │ • 20 transitions │  │ • 3 YAML presets │  │ • L0-L4 automation      │   │
│  │ • 9 guards       │  │ • Step execution │  │ • Trust Score (0-100)   │   │
│  │ • Declarative    │  │ • Parallel-check │  │ • Emergency stop        │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Quality Gates    │  │ Audit System     │  │ CLI Dashboard           │   │
│  │ (NEW v2.0.0)     │  │ (NEW v2.0.0)     │  │ (NEW v2.0.0)           │   │
│  │                  │  │                  │  │                          │   │
│  │ • 7-stage gates  │  │ • JSONL logging  │  │ • Progress bar          │   │
│  │ • Metrics M1-M10 │  │ • Decision trace │  │ • Workflow map           │   │
│  │ • Regression     │  │ • Explanation gen │  │ • Control panel         │   │
│  │   guard          │  │                  │  │ • Agent panel            │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│                                     │                                        │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────┐   │
│  │ Safety Layer     │  │ MCP Servers      │  │ Agent Teams             │   │
│  │ (NEW v2.0.0)     │  │ (NEW v2.0.0)     │  │ (Enhanced v2.0.0)      │   │
│  │                  │  │                  │  │                          │   │
│  │ • Destructive    │  │ • bkit-pdca      │  │ • 32 agents             │   │
│  │   detector (8)   │  │   (10 tools)     │  │ • effort/maxTurns      │   │
│  │ • Blast radius   │  │ • bkit-analysis  │  │ • disallowedTools      │   │
│  │ • Scope limiter  │  │   (6 tools)      │  │ • 3-tier security      │   │
│  │ • Checkpoint/    │  │                  │  │                          │   │
│  │   rollback       │  │                  │  │                          │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Library Modules (88 files across 11 subdirectories, ~620+ exports)

| Module | Files | Exports | Purpose |
|--------|:-----:|:-------:|---------|
| `lib/core/` | 13 | 61 | Platform, cache, I/O, debug, config, file, paths, constants, errors, state-store, ansi, hook-io |
| `lib/pdca/` | 18 | 116 | State machine, workflow engine/parser, status, automation, tier, level, phase, lifecycle, resume, batch-orchestrator, feature-manager, backup-scheduler, do-detector, full-auto-do, template-validator |
| `lib/intent/` | 4 | 19 | 8-language detection, trigger matching, ambiguity analysis |
| `lib/task/` | 5 | 26 | Task classification, context, creation, tracking |
| `lib/team/` | 9 | 40 | Coordinator, strategy, CTO logic, state-writer, communication, task-queue, orchestrator, hooks |
| `lib/ui/` | 7 | 23 | Progress bar, workflow map, control panel, agent panel, impact view |
| `lib/audit/` | 3 | 35+ | Audit logger (JSONL), decision tracer, explanation generator |
| `lib/control/` | 7 | 62+ | Automation controller (L0-L4), trust engine, destructive detector, blast radius, checkpoint manager, scope limiter |
| `lib/quality/` | 3 | 20+ | Gate manager (7 gates), metrics collector (M1-M10), regression guard |
| `lib/adapters/` | 0 | 0 | Reserved for future platform adapters |
| **Top-level** | 7 | 63 | context-fork, context-hierarchy, import-resolver, memory-store, permission-manager, skill-orchestrator, common (bridge) |
| `lib/context/` | 7 | 30+ | Living Context loader, invariant checker, impact analyzer, scenario runner, self-healing, ops metrics |
| **Total** | **88** | **~620+** | |

### v2.0.0 New Modules (vs v1.6.x)

| Category | New Modules | Count |
|----------|------------|-------|
| **Workflow** | state-machine, workflow-engine, workflow-parser, lifecycle, resume | 5 |
| **Automation** | automation-controller, trust-engine, do-detector, full-auto-do | 4 |
| **Safety** | destructive-detector, blast-radius, scope-limiter, checkpoint-manager, circuit-breaker, loop-breaker | 6 |
| **Quality** | gate-manager, metrics-collector, regression-guard | 3 |
| **Audit** | audit-logger, decision-tracer, explanation-gen | 3 |
| **UI** | progress-bar, workflow-map, control-panel, agent-panel, impact-view | 5 |
| **Multi-feature** | batch-orchestrator, feature-manager, backup-scheduler | 3 |
| **Core** | constants, errors, state-store, ansi, hook-io | 5 |
| **Total new** | | **34** |

---

## Domain Knowledge Layer (37 Skills)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Domain Knowledge Layer (37 Skills)                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ Core (4)    │  │ Level (3)   │  │ Pipeline (10)│  │ PDCA (5)    │  │
│  │ bkit-rules  │  │ starter     │  │ phase-1~9    │  │ pdca        │  │
│  │ bkit-templ  │  │ dynamic     │  │ development  │  │ pdca-batch  │  │
│  │ bkit (help) │  │ enterprise  │  │ -pipeline    │  │ plan-plus   │  │
│  │ btw         │  │             │  │              │  │ rollback    │  │
│  │             │  │             │  │              │  │ audit       │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  └─────────────┘  │
│                                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │ Control (2) │  │ BaaS (5)     │  │ Platform (3)│  │ Utility (4) │  │
│  │ control     │  │ bkend-quick  │  │ mobile-app  │  │ code-review │  │
│  │ skill-status│  │ bkend-auth   │  │ desktop-app │  │ zero-qa     │  │
│  │             │  │ bkend-data   │  │ cc-learning │  │ skill-create│  │
│  │             │  │ bkend-storage│  │             │  │ cc-version  │  │
│  │             │  │ bkend-cook   │  │             │  │             │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  └─────────────┘  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Behavioral Rules Layer (32 Agents)

### Model Selection Strategy

| Model | Count | Agents | Characteristics |
|-------|:-----:|--------|-----------------|
| **opus** | 11 | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect, pm-lead, bkit-impact-analyst, cc-version-researcher, self-healing | Strategic leadership, complex analysis, 1M context |
| **sonnet** | 19 | bkend-expert, pdca-iterator, pipeline-guide, starter-guide, product-manager, frontend-architect, qa-strategist, pm-discovery, pm-strategy, pm-research, pm-prd, pm-lead-skill-patch, skill-needs-extractor, 6 pdca-eval-* agents | Execution, guidance, iteration |
| **haiku** | 2 | qa-monitor, report-generator | Fast monitoring, document generation |

### Agent Frontmatter (v2.0.0 native)

```yaml
---
name: gap-detector
model: opus
effort: high          # reasoning effort
maxTurns: 20          # execution budget
memory: project       # cross-session persistence
disallowedTools:      # restricted tools
  - Edit
  - Write
---
```

---

## State Management Layer (v2.0.0)

```
┌─────────────────────────────────────────────────────────────────────────┐
│               State Management Layer (v2.0.6 — 11 subdirs)              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  lib/core/       │  │  lib/pdca/       │  │  lib/intent/     │      │
│  │  13 files, 61 exp│  │  18 files,116 exp│  │  4 files, 19 exp │      │
│  │  Platform, State │  │  State Machine   │  │  Language (8)    │      │
│  │  Store, Paths    │  │  Workflow Engine  │  │  Trigger match   │      │
│  │  Constants, I/O  │  │  Lifecycle, Batch│  │  Ambiguity       │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  lib/team/       │  │  lib/ui/         │  │  lib/audit/      │      │
│  │  9 files, 40 exp │  │  7 files, 23 exp │  │  3 files, 35+ exp│      │
│  │  CTO orchestr.   │  │  Dashboard       │  │  JSONL Logger    │      │
│  │  Communication   │  │  Progress bar    │  │  Decision trace  │      │
│  │  State-writer    │  │  Workflow map     │  │  Explanation gen │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  lib/control/    │  │  lib/quality/    │  │  lib/task/       │      │
│  │  7 files, 62+ exp│  │  3 files, 20+ exp│  │  5 files, 26 exp │      │
│  │  L0-L4 Levels    │  │  Quality Gates   │  │  Classification  │      │
│  │  Trust Engine    │  │  Metrics M1-M10  │  │  Context         │      │
│  │  Safety (blast,  │  │  Regression      │  │  Creator         │      │
│  │  checkpoint,     │  │  Guard           │  │  Tracker         │      │
│  │  scope, destruct)│  │                  │  │                  │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## MCP Servers (v2.0.0)

External tool integration via Model Context Protocol:

| Server | Tools | Purpose |
|--------|:-----:|---------|
| **bkit-pdca** | 10 | bkit_pdca_status, bkit_pdca_history, bkit_feature_list, bkit_feature_detail, bkit_plan_read, bkit_design_read, bkit_analysis_read, bkit_report_read, bkit_metrics_get, bkit_metrics_history |
| **bkit-analysis** | 6 | bkit_code_quality, bkit_gap_analysis, bkit_regression_rules, bkit_checkpoint_list, bkit_checkpoint_detail, bkit_audit_search |

---

## State File Architecture

| Category | Path | Format | Purpose |
|----------|------|--------|---------|
| PDCA Status | `.bkit/state/pdca-status.json` | JSON (v3.0) | Feature states, phase tracking |
| Trust Profile | `.bkit/state/trust-profile.json` | JSON | Trust score components, level history |
| Memory Store | `.bkit/state/memory.json` | JSON | Cross-session bkit memory |
| Control State | `.bkit/runtime/control-state.json` | JSON | Automation level, session stats |
| Agent State | `.bkit/runtime/agent-state.json` | JSON | Agent Teams runtime state |
| Agent Events | `.bkit/runtime/agent-events.jsonl` | JSONL | Agent team event log |
| Audit Logs | `.bkit/audit/YYYY-MM-DD.jsonl` | JSONL | Daily audit trail |
| Workflows | `.bkit/workflows/*.workflow.yaml` | YAML | PDCA workflow presets |
| Config | `bkit.config.json` | JSON | Project-level configuration |
| Plugin | `.claude-plugin/plugin.json` | JSON | Plugin manifest |

---

## Context Engineering Level (CE-7)

| Level | Version | Capabilities |
|:-----:|---------|-------------|
| CE-1 | v1.0 | Basic skills and hooks |
| CE-2 | v1.2 | Multi-language support, pipeline |
| CE-3 | v1.3 | Agent Teams, iteration loop |
| CE-4 | v1.4 | 8-language triggers, Skills 2.0 |
| CE-5 | v1.5 | Modular lib architecture, PM Team |
| CE-6 | v1.6 | 1M context, PLUGIN_DATA, 210 exports |
| **CE-7** | **v2.0** | **State machine, workflow engine, controllable AI (L0-L4), audit system, quality gates, CLI dashboard, MCP servers, 76 modules, ~465 exports** |

### CE-7 Criteria

- Declarative state machine with guards (not imperative phase management)
- YAML-defined workflows (not hardcoded phase sequences)
- 5-level controllable automation with trust score (not binary on/off)
- Full audit trail with decision tracing (not opaque AI)
- Quality gates with configurable thresholds (not manual checks)
- Real-time CLI dashboard (not text-only status)
- MCP server integration for external tools (not plugin-only)
- Checkpoint/rollback for safe experimentation (not irreversible changes)

---

## Memory Systems (No Collision)

| System | Path | Format |
|--------|------|--------|
| CC auto-memory | `~/.claude/projects/{path}/memory/MEMORY.md` | Markdown |
| bkit memory-store | `.bkit/state/memory.json` | JSON |
| bkit agent-memory | `.claude/agent-memory/{agent}/MEMORY.md` | Markdown |
| PLUGIN_DATA backup | `${CLAUDE_PLUGIN_DATA}/backup/` | JSON |

---

## Related Documents

- [[core-mission]] - Core mission and philosophies
- [[ai-native-principles]] - AI-Native principles
- [[pdca-methodology]] - PDCA methodology
