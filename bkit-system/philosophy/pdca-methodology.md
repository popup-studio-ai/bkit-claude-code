# PDCA Methodology in bkit

> Relationship between PDCA cycle and 9-stage pipeline

## PDCA Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                      PDCA Cycle                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Plan ──────► Design ──────► Do ──────► Check ──────► Act     │
│     │                                                    │      │
│     └────────────────── Improvement Cycle ◄──────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Phases

| Phase | Document Location | Command | Purpose |
|-------|-------------------|---------|---------|
| **Plan** | `docs/01-plan/` | `/pdca-plan` | Define goals, scope, success criteria |
| **Design** | `docs/02-design/` | `/pdca-design` | Architecture, data model, API spec |
| **Do** | Code | - | Implement based on design |
| **Check** | `docs/03-analysis/` | `/pdca-analyze` | Design-implementation gap analysis |
| **Act** | `docs/04-report/` | `/pdca-report` | Completion report, lessons learned |

---

## 9-Stage Development Pipeline

A 9-stage pipeline for full project development:

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

---

## PDCA vs Pipeline: The Key Relationship

### Core Concept

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   "Run PDCA cycle WITHIN each Pipeline Phase"                   │
│                                                                 │
│   NOT: Pipeline as a whole = PDCA                               │
│   YES: Each Phase = One PDCA cycle                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Example: Phase 4 (API)

```
Phase 4: API Implementation

├── Plan: Define API endpoints and requirements
├── Design: Write API spec (OpenAPI/REST)
├── Do: Implement endpoints
├── Check: Zero Script QA + Gap analysis
└── Act: Document learnings, fix issues
```

---

## Auto-Apply Rules

`bkit-rules` skill automatically applies PDCA:

### 1. Task Classification

```
Auto-classification on code changes:

Quick Fix      (< 10 lines)   → PDCA optional
Minor Change   (< 50 lines)   → PDCA recommended
Feature        (< 200 lines)  → PDCA required
Major Feature  (>= 200 lines) → PDCA + split recommended
```

### 2. Design Document Check

```
On Write/Edit (PreToolUse hook):

1. Check if design doc exists for the feature
2. If not exists → Suggest "Shall I write the design first?"
3. If exists → Reference design during implementation
```

### 3. Gap Analysis Suggestion

```
After implementation (PostToolUse hook):

1. Detect changed files
2. Analyze feature size
3. Suggest "Shall I run Gap Analysis?"
```

### 4. Check-Act Iteration Loop (v1.3.0)

```
gap-detector Agent (Check)
    ↓ (Stop hook)
gap-detector-stop.js
    ├── >= 90% Match Rate → Suggest report-generator → Enable /archive
    ├── 70-89% Match Rate → Provide options (manual/auto)
    └── < 70% Match Rate  → Strongly recommend pdca-iterator
                               ↓
                          pdca-iterator Agent (Act)
                               ↓ (Stop hook)
                          iterator-stop.js
                               ├── Complete → Suggest report-generator
                               └── In progress → Guide to re-run gap-detector
                                    ↓
                               Repeat (max 5 times)
```

**v1.3.0 Key Improvement**: Check-Act iteration automated through Stop hooks.

---

## Document Templates

| Template | Purpose | Key Sections |
|----------|---------|--------------|
| `plan.template.md` | Plan document | Goals, Scope, Success Criteria, Schedule |
| `design.template.md` | Design document | Architecture, Data Model, API Spec, Test Plan |
| `design-starter.template.md` | Simplified design for Starter | Goals, User Flow, Components |
| `design-enterprise.template.md` | Detailed design for Enterprise | Service Architecture, Infrastructure |
| `analysis.template.md` | Gap analysis document | Match Rate, Missing/Added/Changed, Recommendations |
| `report.template.md` | Completion report | Completed Items, Learnings, Improvements |

---

## Archive Rules

Move to archive after PDCA cycle completion:

### Archive Trigger

| Condition | Action |
|-----------|--------|
| Gap Analysis >= 90% match | Archive enabled |
| Report generation complete | Archive recommended |
| User explicit completion declaration | Execute archive |

### Archive Process

```
1. Verify completion conditions
   └── docs/03-analysis/{feature}.analysis.md exists
   └── match rate >= 90% or user approval

2. Create archive folder
   └── docs/archive/YYYY-MM/{feature}/

3. Move related documents
   ├── docs/pdca/01-plan/features/{feature}.plan.md → archive
   ├── docs/pdca/02-design/features/{feature}.design.md → archive
   └── docs/pdca/03-analysis/{feature}.analysis.md → archive

4. Update index
   └── Add to docs/archive/YYYY-MM/_INDEX.md
```

---

## Zero Script QA

A methodology for performing QA without traditional test scripts:

### Traditional vs Zero Script

| Aspect | Traditional QA | Zero Script QA |
|--------|---------------|----------------|
| Setup | Write test scripts | Build log infrastructure (one-time) |
| Execution | Run scripts | Manual UX testing |
| Analysis | Check results | AI real-time log analysis |
| Maintenance | Update scripts per change | No maintenance needed |

### Core Principles

```
1. Log everything (including 200 OK)
2. Structured JSON logs
3. Track entire flow with Request ID
4. AI monitors real-time and documents issues
```

---

## Commands Reference

### PDCA Workflow

| Command | Function |
|---------|----------|
| `/pdca-status` | Current PDCA progress dashboard |
| `/pdca-plan [feature]` | Write plan document |
| `/pdca-design [feature]` | Write design document |
| `/pdca-analyze [feature]` | Gap analysis (design vs implementation) |
| `/pdca-iterate [feature]` | Auto-fix with Evaluator-Optimizer pattern |
| `/pdca-report` | Generate completion report |
| `/pdca-next` | Suggest next action |
| `/archive [feature]` | Archive completed PDCA documents (v1.3.0) |

### Pipeline Management

| Command | Function |
|---------|----------|
| `/pipeline-start` | Start full development pipeline |
| `/pipeline-status` | Check pipeline status |
| `/pipeline-next` | Next pipeline phase |

---

---

## v1.5.1 PDCA Enhancements

### Output Styles for PDCA Phases

`bkit-pdca-guide` output style enhances PDCA visibility:
- Phase status badges: `[Plan] -> [Design] -> [Do] -> [Check] -> [Act]`
- Auto-suggested gap analysis after code changes
- Next-phase checklists and guidance

### Agent Teams for Parallel PDCA

PDCA phases can execute in parallel using Agent Teams:

| Role | Phase Coverage | Level |
|------|---------------|-------|
| architect | Design | Enterprise only |
| developer | Do, Act | Dynamic + Enterprise |
| qa | Check | Dynamic + Enterprise |
| reviewer | Check, Act | Enterprise only |

Command: `/pdca team {feature}`

### Agent Memory for PDCA Context

All PDCA-related agents use `memory: project` scope:
- gap-detector remembers previous analysis patterns
- pdca-iterator remembers fix patterns and iteration history
- report-generator remembers PDCA metrics across cycles

---

## Related Documents

- [[core-mission]] - Core mission and philosophies
- [[ai-native-principles]] - AI-Native principles
- [[../components/skills/_skills-overview]] - Skill details
- [[../scenarios/scenario-new-feature]] - New feature scenario
- [[../../skills/development-pipeline/SKILL]] - Pipeline skill
