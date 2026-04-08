# bkit Core Mission & Philosophy

> Core mission, 3 philosophies, and 4 controllable AI principles of bkit v2.0.0

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
│   v2.0.0: Controllable AI — visible automation, human-governed AI       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Three Core Philosophies

| Philosophy | Description | v2.0.0 Implementation |
|------------|-------------|----------------------|
| **Automation First** | Claude automatically applies PDCA even if user doesn't know commands | State machine (20 transitions, 9 guards) + Workflow Engine (3 YAML presets) + L0-L4 automation levels |
| **No Guessing** | If unsure, check docs → If not in docs, ask user (never guess) | gap-detector agent + design-validator + quality gates (7 stages) + blast radius analysis |
| **Docs = Code** | Design first, implement later (maintain design-implementation sync) | PDCA workflow + `/pdca analyze` + metrics collector (M1-M10) + regression guard |

## Four Controllable AI Principles (v2.0.0)

| Principle | Description | Implementation |
|-----------|-------------|----------------|
| **Safe Defaults** | L2 Semi-Auto by default, never starts at full automation | `DEFAULT_LEVEL = 2`, destructive ops require L3+, `git push --force` denied below L4 |
| **Progressive Trust** | Trust earned through track record, not assumed | Trust Score (0-100) from 6 weighted components, cooldown-protected level upgrades |
| **Full Visibility** | Every AI decision is traceable and auditable | Audit logger (JSONL), decision tracer, CLI dashboard (progress-bar, workflow-map, control-panel) |
| **Always Interruptible** | User can pause or stop AI at any point | Emergency stop, checkpoint/rollback per phase, `/control pause`, circuit breaker |

---

## User Journey

### Stage 1: Session Start

SessionStart hook renders CLI dashboard:

```
┌─── Control Panel ──────────────────────────────────────────────────┐
│  Automation Level   L0 ───────────●────────── L4                   │
│                     [Current: L2 Semi-Auto]                        │
│  Emergency stop: /control stop                                     │
└────────────────────────────────────────────────────────────────────┘

┌─── Workflow Map: {feature} ────────────────────────────────────────┐
│  [PM ✓]──→[PLAN ✓]──→[DESIGN ●]──→[DO]──→[CHECK]──→[REPORT]      │
└────────────────────────────────────────────────────────────────────┘

┌─── {feature} ──────────────────────────────────────────────── 40% ─┐
│  PM✓  PLAN✓  DESIGN●  DO  CHECK  REPORT  ████████░░░░░░░░░░       │
└─ in_progress • last: 1h ago • iter: 0                             ┘
```

### Stage 2: Level Detection

Claude analyzes the project and automatically detects the level:

| Level | Detection Conditions | Target Users |
|-------|---------------------|--------------|
| **Starter** | Only index.html, simple structure | Beginners, static web |
| **Dynamic** | Next.js + .mcp.json, BaaS integration | Intermediate, fullstack apps |
| **Enterprise** | services/ + infra/ folders, K8s | Advanced, MSA architecture |

### Stage 3: PDCA Auto-Apply via State Machine

When user requests "create a feature":

```
State Machine Transitions (v2.0.0):
  idle ──[START]──→ pm_analysis ──[PM_DONE]──→ plan
       ──[SKIP_PM]──→ plan ──[PLAN_DONE]──→ design
  design ──[DESIGN_DONE]──→ do ──[DO_COMPLETE]──→ check
  check ──[ITERATE]──→ act ──[ANALYZE_DONE]──→ check (loop, max 5)
  check ──[MATCH_PASS]──→ report ──[REPORT_DONE]──→ archived

Guards: matchRate >= 90% for MATCH_PASS, maxIterations for ITERATE
Checkpoint: auto-created on every phase transition
```

### Stage 4: Continuous Improvement with Quality Gates

| Gate | Phase | Threshold | Action |
|------|-------|-----------|--------|
| PM Gate | pm → plan | PRD exists | Auto or ask (L2+) |
| Plan Gate | plan → design | Plan doc validated | Auto (L2+) |
| Design Gate | design → do | Design validated | Auto (L2+) |
| Do Gate | do → check | Implementation complete | Auto (L3+) |
| Check Gate | check → report | matchRate >= 90% | Gate (all levels) |
| Check Gate | check → act | matchRate < 90% | Auto-iterate (L3+) |
| Report Gate | report → archive | Report generated | Auto (L3+) |

---

## Value by Level

### Starter Level (Beginners)

```
Before: "I don't know where to start"
After:  CLI dashboard + pipeline guide at session start → Natural beginning

Before: "Just write code, docs later..."
After:  State machine enforces Plan → Design → Do → Habit formation

Before: "I keep making the same mistakes"
After:  Regression guard + metrics collector → Cross-session learning
```

### Dynamic Level (Intermediate)

```
Before: "Setting up config files is tedious"
After:  38 skills auto-detected by keywords → Zero config needed

Before: "Writing design docs is annoying"
After:  Templates + PM Agent Team → Design doc in 5 minutes

Before: "Code and docs don't match"
After:  gap-detector + pdca-iterator → Auto gap analysis and fix
```

### Enterprise Level (Advanced)

```
Before: "Each team member uses Claude differently"
After:  CTO-led Agent Teams (36 agents) → Standardized PDCA workflow

Before: "AI decisions are opaque"
After:  Audit logger + decision tracer → Full visibility and traceability

Before: "Automation feels risky"
After:  L0-L4 levels + trust score + emergency stop → Controllable AI
```

---

## Current Implementation (v2.0.0)

> **v2.1.1**: AI Native Development OS — Declarative PDCA state machine, YAML workflow DSL,
> L0-L4 controllable AI, CLI dashboard, audit logging, quality gates, MCP servers,
> checkpoint/rollback, destructive operation detection, 38 Skills, 36 Agents, 21 Hook Events

### Component Counts

| Component | Count | Location |
|-----------|-------|----------|
| Skills | 38 (18 Workflow / 18 Capability / 1 Hybrid) | `skills/*/SKILL.md` |
| Agents | 36 | `agents/*.md` |
| Hook Events | 21 | `hooks/hooks.json` |
| Hook Scripts | 42 | `hooks/`, `scripts/` |
| lib/ Modules | 84 files across 12 subdirs (607 exports) | `lib/` |
| MCP Servers | 2 (16 tools) | `servers/` |
| Workflow Presets | 3 (default, enterprise, hotfix) | `.bkit/workflows/` |
| Output Styles | 4 | `output-styles/` |
| Tests | 194 files (~4,028 TC) | `test/` |

### v2.0.0 Architecture (New Modules)

| Area | Modules | Key Capability |
|------|---------|----------------|
| **Workflow Engine** | state-machine, workflow-engine, workflow-parser, lifecycle | Declarative PDCA with 20 transitions, 9 guards, 3 YAML presets |
| **Controllable AI** | automation-controller, trust-engine, do-detector, full-auto-do | L0-L4 levels, Trust Score (6 components), phase auto-advance |
| **Safety** | destructive-detector, blast-radius, scope-limiter, checkpoint-manager, circuit-breaker, loop-breaker | 8 detection rules, blast radius analysis, checkpoint/rollback |
| **Quality** | gate-manager, metrics-collector, regression-guard | 7 quality gates, 10 metrics (M1-M10), regression rules |
| **Audit** | audit-logger, decision-tracer, explanation-gen | JSONL audit trail, decision trace, human-readable explanations |
| **CLI Dashboard** | progress-bar, workflow-map, control-panel, agent-panel, impact-view | Real-time PDCA visualization on SessionStart |
| **Multi-Feature** | batch-orchestrator, feature-manager | Parallel PDCA (max 3 concurrent features) |
| **Resilience** | resume, backup-scheduler | Session resume, automatic backup scheduling |

### Key Features

- **Declarative State Machine**: 20 transitions, 9 guards, YAML-defined workflows
- **5-Level Automation (L0-L4)**: Manual → Guided → Semi-Auto → Auto → Full-Auto
- **Trust Score Engine**: 6 weighted components, cooldown-protected escalation, immediate downgrade
- **CLI Dashboard**: progress-bar, workflow-map, control-panel rendered on every SessionStart
- **Audit Trail**: JSONL logging with decision traces for full AI transparency
- **Quality Gates**: 7-stage gates with configurable thresholds per project level
- **Checkpoint/Rollback**: Automatic checkpoint on phase transitions, manual rollback support
- **Destructive Detection**: 8 rules (rm -rf, git push --force, etc.) with blast radius analysis
- **MCP Servers**: bkit-pdca (10 tools) + bkit-analysis (6 tools) for external integration
- **Multi-Language Support**: 8 languages (EN, KO, JA, ZH, ES, FR, DE, IT)

---

## Related Documents

- [[ai-native-principles]] - AI-Native core competencies
- [[pdca-methodology]] - PDCA methodology details
- [[context-engineering]] - Context Engineering architecture
