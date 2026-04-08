---
name: pm-discovery
classification: workflow
classification-reason: PM process orchestration independent of model capability evolution
deprecation-risk: none
effort: high
description: |
  PM Agent Team — automated product discovery, strategy, and PRD generation with 4 PM agents.
  Triggers: pm, PRD, product discovery, PM 분석, 제품 기획, PM analysis.
argument-hint: "[feature]"
user-invocable: true
agents:
  default: bkit:pm-lead
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - AskUserQuestion
imports:
  - ${PLUGIN_ROOT}/templates/pm-prd.template.md
next-skill: pdca plan
pdca-phase: pm
task-template: "[PM] {feature}"
---

# PM Agent Team - Product Discovery & Strategy

> Automated PM analysis pipeline: Discovery + Strategy + Research -> PRD
> Based on [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License)

## Overview

PM Agent Team provides AI-powered product management analysis for solo developers
and small teams without a dedicated PM. It runs before the PDCA Plan phase to ensure
you're building the right thing.

## How It Works

```
/pdca pm {feature}
     |
     v
PM Lead (opus) - orchestrates
     |
     +-- pm-discovery  --> Opportunity Solution Tree
     +-- pm-strategy   --> Value Proposition + Lean Canvas     [parallel]
     +-- pm-research   --> Personas + Competitors + Market
     |
     v
pm-prd --> Beachhead + GTM + PRD (8-section)
     |
     v
docs/00-pm/{feature}.prd.md
     |
     v
Next: /pdca plan {feature} (PRD auto-referenced)
```

## Included PM Frameworks (8)

| Framework | Agent | Origin |
|-----------|-------|--------|
| Opportunity Solution Tree | pm-discovery | Teresa Torres |
| Value Proposition (JTBD 6-Part) | pm-strategy | Huryn & Abdul Rauf |
| Lean Canvas | pm-strategy | Ash Maurya |
| User Personas (JTBD) | pm-research | JTBD-based |
| Competitor Analysis | pm-research | Strategic positioning |
| Market Sizing (TAM/SAM/SOM) | pm-research | Dual-method |
| Beachhead Segment | pm-prd | Geoffrey Moore |
| GTM Strategy | pm-prd | Product Compass |

## Usage

```bash
# Run PM analysis
/pdca pm my-saas-app

# After PM analysis, continue with PDCA
/pdca plan my-saas-app    # PRD auto-referenced
/pdca design my-saas-app
/pdca do my-saas-app
```

## Requirements

- Agent Teams enabled: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- Project level: Dynamic or Enterprise (Starter not supported)

## PDCA Integration

```
[PM] --> [Plan] --> [Design] --> [Do] --> [Check] --> [Act] --> [Report]
 ^        ^
 new      PRD auto-referenced in Plan
```

When `/pdca plan {feature}` runs after PM analysis:
1. Checks for `docs/00-pm/{feature}.prd.md`
2. If found, reads PRD and uses as context for Plan document
3. Plan document quality is significantly improved with PM-backed data

## Output

PRD document saved to `docs/00-pm/{feature}.prd.md` containing:
- Executive Summary (4-perspective)
- Opportunity Solution Tree
- Value Proposition + Lean Canvas
- User Personas (3) + Competitor Analysis (5) + Market Sizing
- Beachhead Segment + GTM Strategy
- Product Requirements (8-section PRD)
