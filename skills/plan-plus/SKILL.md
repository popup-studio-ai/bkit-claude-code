---
name: plan-plus
description: |
  Plan Plus — Brainstorming-Enhanced PDCA Planning.
  Combines intent discovery from brainstorming methodology with bkit PDCA's structured planning.
  Produces higher-quality Plan documents by exploring user intent, comparing alternatives,
  and applying YAGNI review before document generation.

  Use proactively when user mentions planning with brainstorming, intent discovery,
  exploring alternatives, or wants a more thorough planning process.

  Triggers: plan-plus, plan plus, brainstorming plan, enhanced plan, deep plan,
  플랜 플러스, 브레인스토밍, 기획, 의도 탐색, 대안 탐색,
  プランプラス, ブレインストーミング, 企画, 意図探索,
  计划加强, 头脑风暴, 深度规划, 意图探索,
  plan mejorado, lluvia de ideas, planificación profunda,
  plan amélioré, remue-méninges, planification approfondie,
  erweiterter Plan, Brainstorming, vertiefte Planung,
  piano migliorato, brainstorming, pianificazione approfondita

  Do NOT use for: simple tasks that don't need planning, code-only changes.
argument-hint: "[feature]"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TaskCreate
  - TaskUpdate
  - TaskList
  - AskUserQuestion
imports:
  - ${PLUGIN_ROOT}/templates/plan-plus.template.md
next-skill: pdca design
pdca-phase: plan
task-template: "[Plan Plus] {feature}"
---

# Plan Plus — Brainstorming-Enhanced PDCA Planning

> Combines brainstorming's intent discovery with bkit PDCA's structured planning to produce
> higher-quality Plan documents through collaborative dialogue.

## Overview

Plan Plus enhances the standard `/pdca plan` by adding 4 brainstorming phases before document
generation. This ensures that user intent is fully understood, alternatives are explored,
and unnecessary features are removed before any implementation begins.

**When to use Plan Plus instead of `/pdca plan`:**
- The feature has ambiguous or complex requirements
- Multiple implementation approaches are possible
- You want to ensure YAGNI compliance from the start
- The feature involves significant architectural decisions

## HARD-GATE

<HARD-GATE>
Do NOT write any code, scaffold any project, or invoke any implementation skill
until this entire process is complete and the user has approved the Plan document.
This applies to EVERY feature regardless of perceived simplicity.
A "simple" feature still goes through this process — the design can be short,
but you MUST present it and get approval.
</HARD-GATE>

## Process Flow

```
Phase 0: Context Exploration (automatic)
    ↓
Phase 1: Intent Discovery (1 question at a time)
    ↓
Phase 2: Alternatives Exploration (2-3 approaches)
    ↓
Phase 3: YAGNI Review (multiSelect verification)
    ↓
Phase 4: Incremental Design Validation (section-by-section)
    ↓
Phase 5: Plan Document Generation (plan-plus.template.md)
    ↓
Phase 6: Next Steps → /pdca design {feature}
```

## Phase Details

### Phase 0: Project Context Exploration (Automatic)

Before asking any questions, explore the current project state:

1. Read CLAUDE.md, package.json, pom.xml, etc. for project information
2. Check recent 5 git commits (understand current work direction)
3. Check existing `docs/01-plan/` documents (prevent duplication)
4. Check `.bkit-memory.json` (check ongoing PDCA status)

> Share exploration results briefly: "I've reviewed the current project state: ..."

### Phase 1: Intent Discovery (Brainstorming Style)

**Principle: One question at a time, prefer multiple choice**

Use `AskUserQuestion` tool to discover the following in order:

#### Q1. Core Purpose
"What is the core problem this feature solves?"
- Provide 3-4 choices (inferred from project context)
- Always include a custom input option

#### Q2. Target Users
"Who will primarily use this feature?"
- Admin / End user / Developer / External system

#### Q3. Success Criteria
"What criteria would indicate this feature is successful?"
- Derive specific, measurable criteria

#### Q4. Constraints (only when needed)
Conflicts with existing systems, performance requirements, technical constraints, etc.

> **Important**: Minimize questions. Clear features need only Q1-Q2.
> Only proceed to Q3-Q4 for ambiguous features.

### Phase 2: Alternatives Exploration (Brainstorming Core)

**Always propose 2-3 approaches** with trade-offs for each.

Format:
```
### Approach A: {name} — Recommended
- Pros: ...
- Cons: ...
- Best for: ...

### Approach B: {name}
- Pros: ...
- Cons: ...
- Best for: ...

### Approach C: {name} (optional)
- Pros: ...
- Cons: ...
```

> Present the recommended approach first with clear reasoning.
> Use AskUserQuestion to let the user choose.

### Phase 3: YAGNI Review (Brainstorming Core)

Perform a YAGNI (You Ain't Gonna Need It) review on the selected approach:

Use AskUserQuestion with `multiSelect: true`:
"Select only what is essential for the first version:"

List all features and move unselected items to Out of Scope.

**Principle**: Don't abstract what can be done in 3 lines.
Don't design for hypothetical future requirements.

### Phase 4: Incremental Design Validation (Brainstorming Style)

Present the design section by section, getting approval after each:

1. Architecture overview → "Does this direction look right?"
2. Key components/modules → "Does this structure look right?"
3. Data flow → "Does this flow look right?"

> If the user says "no" to any section, revise only that section and re-present.

### Phase 5: Plan Document Generation

Generate the Plan document using `plan-plus.template.md` with results from Phases 0-4.

**Additional sections** (not in standard plan.template.md):
- **User Intent Discovery** — Core problem, target users, success criteria from Phase 1
- **Alternatives Explored** — Approaches compared in Phase 2
- **YAGNI Review** — Included/deferred/removed items from Phase 3
- **Brainstorming Log** — Key decisions from Phases 1-4

**Output Path**: `docs/01-plan/features/{feature}.plan.md`

After document generation, update PDCA status:
- Create Task: `[Plan] {feature}`
- Update .bkit-memory.json: phase = "plan"

### Phase 6: Next Steps

After Plan document generation:
```
Plan Plus completed
Document: docs/01-plan/features/{feature}.plan.md
Next step: /pdca design {feature}
```

## Key Principles

| Principle | Origin | Application |
|-----------|--------|-------------|
| One question at a time | Brainstorming | Sequential questions via AskUserQuestion |
| Explore alternatives | Brainstorming | Mandatory 2-3 approaches in Phase 2 |
| YAGNI ruthlessly | Brainstorming | multiSelect verification in Phase 3 |
| Incremental validation | Brainstorming | Section-by-section approval in Phase 4 |
| HARD-GATE | Brainstorming | No code before approval (entire process) |
| Context first | Brainstorming | Automatic exploration in Phase 0 |

## Integration with PDCA

Plan Plus produces the same output as `/pdca plan` and feeds seamlessly into the
standard PDCA cycle:

```
/plan-plus {feature}     ← Enhanced planning with brainstorming
    ↓
/pdca design {feature}   ← Standard PDCA continues
    ↓
/pdca do {feature}
    ↓
/pdca analyze {feature}
    ↓
/pdca report {feature}
```

## Usage Examples

```bash
# Start brainstorming-enhanced planning
/plan-plus user-authentication

# After Plan Plus completes, continue with standard PDCA
/pdca design user-authentication
/pdca do user-authentication
```
