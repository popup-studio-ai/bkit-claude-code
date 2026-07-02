# Scenario: New Feature Request

> bkit's PDCA flow when user requests a new feature

## Scenario Overview

```
User: "Create a login feature"
→ Check if PDCA documents exist
→ If not, create Plan/Design first
→ Implement
→ Suggest Gap Analysis
```

## Trigger Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  1. User Request: "Create a login feature"                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. Skills Activation (Keyword Matching)                         │
│                                                                 │
│  [[../../skills/bkit-rules/SKILL|bkit-rules]] activated                  │
│  • Keywords "feature", "create" matched                         │
│                                                                 │
│  [[../../skills/dynamic/SKILL|dynamic]] activated (if Level=Dynamic)   │
│  • Keyword "login" matched                                      │
│                                                                 │
│  [[../../skills/phase-4-api/SKILL|phase-4-api]] activated                 │
│  • API-related skill activated for backend feature              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. PDCA Document Check (pdca-rules instruction)                 │
│                                                                 │
│  Claude checks:                                                 │
│  • Does docs/01-plan/features/login.plan.md exist?             │
│  • Does docs/02-design/features/login.design.md exist?         │
│                                                                 │
│  If not → Suggest creating Design first                         │
│  If yes → Start implementation immediately                      │
└─────────────────────────────────────────────────────────────────┘
                              │
            ┌─────────────────┴─────────────────┐
            ▼                                   ▼
   ┌─────────────────┐                 ┌─────────────────┐
   │ No Document     │                 │ Document Exists │
   └─────────────────┘                 └─────────────────┘
            │                                   │
            ▼                                   ▼
┌─────────────────────────┐       ┌─────────────────────────┐
│ 4a. Create Design Doc   │       │ 4b. Start Implementation│
│                         │       │                         │
│ AskUserQuestion:        │       │ Reference existing      │
│ "Create design first?"  │       │ design doc for impl     │
│                         │       │                         │
│ Yes → /pdca-design      │       │                         │
│ No → Implement directly │       │                         │
└─────────────────────────┘       └─────────────────────────┘
            │                                   │
            └─────────────────┬─────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. Hooks Fire on Write/Edit (See [[scenario-write-code]])       │
│                                                                 │
│  PreToolUse: pre-write.js (unified hook v1.2.0)                │
│  PostToolUse: pdca-post-write.js, phase6-ui-post.js            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. After Implementation Completion                              │
│                                                                 │
│  Claude suggests (auto-trigger-agents instruction):             │
│  "Implementation complete. Run Gap Analysis?"                   │
│  • Yes → Invoke gap-detector agent                              │
│  • No → Exit                                                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. Based on Gap Analysis Results                                │
│                                                                 │
│  Match Rate >= 90% → "PDCA complete, generate report?"          │
│  Match Rate < 70% → "Run auto-fix (iterate)?"                   │
└─────────────────────────────────────────────────────────────────┘
```

## Example: "Create a login feature"

### Case 1: No Design Document

```
User: "Create a login feature"

Claude: I'll implement the login feature.

First, it seems there's no design document.
Following PDCA methodology, creating a design document first
enables Gap Analysis verification later.

Would you like to create a design document first?
1. Yes, design first (/pdca-design login)
2. No, implement directly

[User selects 1]

Claude: Creating the login feature design document.
[Applies design template to create docs/02-design/features/login.design.md]

Design is complete. Would you like to start implementation now?
```

### Case 2: Design Document Exists

```
User: "Create a login feature"

Claude: I'll implement the login feature.

Referencing existing design document:
- docs/02-design/features/login.design.md

[Design document summary]
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me

I'll implement according to this design.

[Implementation in progress...]

Implementation complete.
Would you like to run Gap Analysis to verify design-implementation alignment?
```

---

## Behavior Differences by Level

### Starter Level

```
Characteristics:
- No BaaS (static web)
- Login feature itself exceeds level

Behavior:
Claude: "Login feature requires Dynamic level.
Level upgrade is needed. /upgrade-level dynamic"
```

### Dynamic Level

```
Characteristics:
- Uses bkend.ai BaaS
- Login = bkend.ai authentication API integration

Behavior:
Claude: bkend-expert agent can be activated
Design includes bkend.ai collection structure
```

### Enterprise Level

```
Characteristics:
- Custom backend
- Microservices possible

Behavior:
Claude: enterprise-expert or infra-architect can be activated
Design considers service separation, K8s deployment
```

---

## Agent Auto-Invoke Timing

| Timing | Available Agents |
|--------|-----------------|
| Initial feature request | starter-guide, bkend-expert, enterprise-expert (by Level) |
| After design document creation | design-validator |
| After implementation completion | gap-detector, code-analyzer |
| After gap analysis (< 70%) | pdca-iterator |
| After PDCA completion | report-generator |

---

## Test Checklist

- [ ] Verify bkit-rules skill activation on "create feature" request
- [ ] Verify creation suggestion when design doc doesn't exist
- [ ] Verify immediate implementation start when design doc exists
- [ ] Verify Gap Analysis suggestion after implementation completion
- [ ] Verify appropriate agent suggestions by Level

---

## v1.5.4 Note

For major features at Dynamic/Enterprise level, CTO-Led Agent Teams can parallelize PDCA execution:
- `/pdca team {feature}` spawns specialized teammates (Dynamic: 3+CTO, Enterprise: 5+CTO)
- CTO Lead (fable) orchestrates Plan → Design → Do → Check → Act phases across teammates

---

## Related Documents

- [[scenario-write-code]] - Write code scenario
- [[scenario-qa]] - QA execution scenario
- [[../triggers/trigger-matrix]] - Trigger matrix
- [[../components/agents/_agents-overview]] - Agent auto-invoke rules
