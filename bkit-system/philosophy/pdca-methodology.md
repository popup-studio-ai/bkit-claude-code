# PDCA Methodology in bkit v2.0.0

> Declarative state machine-driven PDCA with workflow engine, quality gates, and controllable automation

## PDCA Cycle (v2.0.0 State Machine)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PDCA State Machine (v2.0.0)                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   idle ──→ PM ──→ Plan ──→ Design ──→ Do ──→ Check ──┬──→ Report       │
│    │                                          ↑       │       │         │
│    └──── (SKIP_PM) ──→ Plan                   │       ▼       ▼         │
│                                               └──── Act    Completed    │
│                                                                         │
│   20 transitions │ 9 guards │ 3 YAML presets │ Checkpoint per phase     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Document Location | Unified Command | Purpose |
|-------|-------------------|-----------------|---------|
| **PM** | PRD output | `/pdca pm {feature}` | Product discovery, PRD generation |
| **Plan** | `docs/01-plan/` | `/pdca plan {feature}` | Define goals, scope, success criteria |
| **Design** | `docs/02-design/` | `/pdca design {feature}` | Architecture, data model, API spec |
| **Do** | Code | `/pdca do {feature}` | Implement based on design |
| **Check** | `docs/03-analysis/` | `/pdca analyze {feature}` | Design-implementation gap analysis |
| **Act** | Iteration | `/pdca iterate {feature}` | Auto-fix gaps (max 5 iterations) |
| **Report** | `docs/04-report/` | `/pdca report {feature}` | Completion report, lessons learned |

### State Machine Transitions

| # | From | Event | To | Guard |
|---|------|-------|-----|-------|
| 1 | idle | START | pm_analysis | — |
| 2 | idle | SKIP_PM | plan | — |
| 3 | pm_analysis | PM_DONE | plan | prdExists |
| 4 | plan | PLAN_DONE | design | planDocValid |
| 5 | design | DESIGN_DONE | do | designDocValid |
| 6 | do | DO_DONE | check | implementationComplete |
| 7 | check | APPROVE | report | matchRate >= 90% |
| 8 | check | ITERATE | act | maxIterations < 5 |
| 9 | act | ACT_DONE | check | — |
| 10 | report | REPORT_DONE | completed | — |

### Workflow Presets (YAML DSL)

| Preset | Steps | Use Case |
|--------|-------|----------|
| **default** | 9 steps (PM → Plan → Design → Do → Check → Act → Report → Archive) | Standard feature development |
| **enterprise** | 9 steps + parallel-check | Enterprise with concurrent QA |
| **hotfix** | 7 steps (skip PM, Design) | Urgent production fixes |

---

## 9-Stage Development Pipeline

```
Phase 1: Schema       → Data modeling, terminology
Phase 2: Convention   → Coding conventions
Phase 3: Mockup       → UI/UX mockups
Phase 4: API          → API design and implementation
Phase 5: Design System → Build design system
Phase 6: UI           → UI component integration
Phase 7: SEO/Security → SEO and security checks
Phase 8: Review       → Code review
Phase 9: Deployment   → Production deployment
```

### Level-specific Flow

| Level | Phases | Notes |
|-------|--------|-------|
| **Starter** | 1 → 2 → 3 → 6 → 9 | Phase 4, 5, 7, 8 skip |
| **Dynamic** | 1 → 2 → 3 → 4 → 5 → 6 → 7 → 9 | Phase 8 optional |
| **Enterprise** | All phases | All phases required |

### PDCA within Pipeline

```
"Run PDCA cycle WITHIN each Pipeline Phase"

NOT: Pipeline as a whole = PDCA
YES: Each Phase = One PDCA cycle

Example: Phase 4 (API)
├── Plan: Define API endpoints and requirements
├── Design: Write API spec (OpenAPI/REST)
├── Do: Implement endpoints
├── Check: Zero Script QA + Gap analysis
└── Act: Document learnings, fix issues
```

---

## Quality Gates (v2.0.0)

7-stage quality gate system with configurable thresholds:

| Gate | Phase Transition | Threshold | Auto-Approve Level |
|------|-----------------|-----------|-------------------|
| PM Gate | pm → plan | PRD exists | L1+ |
| Plan Gate | plan → design | Plan doc validated | L2+ |
| Design Gate | design → do | Design doc validated | L2+ |
| Do Gate | do → check | Implementation exists | L3+ |
| Check Gate | check → report | matchRate >= 90% | All levels (gate) |
| Iterate Gate | check → act | matchRate < 90%, iterations < 5 | L2+ |
| Report Gate | report → archive | Report generated | L3+ |

### Metrics (M1-M10)

| Metric | Description | Target |
|--------|-------------|--------|
| M1 | Plan accuracy (predicted vs actual changes) | > 80% |
| M2 | Design coverage (designed vs implemented) | > 90% |
| M3 | Implementation match rate | > 90% |
| M4 | Test pass rate | 100% |
| M5 | Code quality score | > 70/100 |
| M6 | Convention compliance | > 90% |
| M7 | Critical issue count | 0 |
| M8 | PDCA cycle duration | Trending down |
| M9 | Iteration count | < 3 average |
| M10 | Regression rate | 0% |

---

## Automation Levels for PDCA

| Level | Phase Transitions | Destructive Ops | Trust Score Required |
|:-----:|------------------|-----------------|---------------------|
| L0 | All manual | All denied/ask | 0+ |
| L1 | idle→pm, idle→plan auto | Read auto | 20+ |
| L2 | Most transitions auto | Non-destructive auto | 40+ |
| L3 | All except report→archive | Most auto, high-risk ask | 65+ |
| L4 | Fully automatic | All auto, post-review only | 85+ |

### Trust Score Components

| Component | Weight | Description |
|-----------|--------|-------------|
| pdcaCompletionRate | 0.25 | % of PDCA cycles completed |
| gatePassRate | 0.20 | % of quality gates passed |
| rollbackFrequency | 0.15 | Inverse of rollback rate |
| destructiveBlockRate | 0.15 | % of destructive ops blocked |
| iterationEfficiency | 0.15 | Based on consecutive successes |
| userOverrideRate | 0.10 | Inverse of user override frequency |

---

## Check-Act Iteration Loop

```
gap-detector Agent (Check)
    ↓
    ├── >= 90% Match Rate → Suggest report-generator → /pdca report
    ├── 70-89% Match Rate → Options (manual/auto)
    └── < 70% Match Rate  → Auto-trigger pdca-iterator
                               ↓
                          pdca-iterator Agent (Act)
                               ↓
                          Re-run gap-detector (Check)
                               ↓
                          Repeat (max 5 iterations via guard)
```

---

## Checkpoint & Rollback

| Trigger | Action |
|---------|--------|
| Phase transition | Auto-create checkpoint (if `checkpointOnPhaseTransition: true`) |
| Destructive operation detected | Auto-create checkpoint (if `checkpointOnDestructive: true`) |
| User request | `/rollback` to list and restore checkpoints |

---

## Unified Command Reference

| Command | Function |
|---------|----------|
| `/pdca status` | Current PDCA progress dashboard |
| `/pdca plan {feature}` | Write plan document |
| `/pdca design {feature}` | Write design document |
| `/pdca do {feature}` | Implementation guidance |
| `/pdca analyze {feature}` | Gap analysis (design vs implementation) |
| `/pdca iterate {feature}` | Auto-fix with Evaluator-Optimizer pattern |
| `/pdca report {feature}` | Generate completion report |
| `/pdca next` | Suggest next action based on state machine |
| `/pdca pm {feature}` | PM Agent Team product discovery |

---

## Zero Script QA

| Aspect | Traditional QA | Zero Script QA |
|--------|---------------|----------------|
| Setup | Write test scripts | Build log infrastructure (one-time) |
| Execution | Run scripts | Manual UX testing |
| Analysis | Check results | AI real-time log analysis |
| Maintenance | Update scripts per change | No maintenance needed |

Core Principles:
1. Log everything (including 200 OK)
2. Structured JSON logs
3. Track entire flow with Request ID
4. AI monitors real-time and documents issues

---

## PM Agent Team (pre-Plan Phase)

```
PM Discovery ──► Plan ──► Design ──► Do ──► Check ──► Act ──► Report
     │
     ├── pm-lead: Orchestrates discovery workflow
     ├── pm-discovery: Market research, user needs (OST framework)
     ├── pm-strategy: Product positioning (JTBD + Lean Canvas)
     ├── pm-research: Competitive analysis, market sizing
     └── pm-prd: PRD generation → feeds into /pdca plan
```

---

## Related Documents

- [[core-mission]] - Core mission and philosophies
- [[ai-native-principles]] - AI-Native principles
- [[context-engineering]] - Context Engineering architecture
