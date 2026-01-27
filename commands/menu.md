---
name: menu
description: |
  bkit plugin hub - Single entry point for all bkit features.
  Workaround for skills autocomplete issue, providing access to 22 skills.

  Use "/bkit:menu" or "/bkit:menu help" to see available commands.

  Triggers: menu, bkit menu
argument-hint: "[category] [action] [args...]"
user-invocable: true
allowed-tools:
  - Skill
  - Read
  - Write
  - TaskCreate
  - TaskUpdate
  - TaskList
  - TaskGet
  - AskUserQuestion
---

# bkit Menu Command

> Single entry point for all bkit features (Skills autocomplete workaround)

## User Input

$ARGUMENTS

---

## Routing Logic

Analyze the first keyword of user input (`$ARGUMENTS`) and route to the appropriate Skill.

### 1. Help (no arguments or "help")

If no arguments or first argument is `help`, display the help message below:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧰 bkit - AI Native Development Toolkit v1.4.5
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PDCA (Document-Driven Development)
  /bkit:menu pdca plan <feature>     Start planning a new feature
  /bkit:menu pdca design <feature>   Create design document
  /bkit:menu pdca do <feature>       Implementation guide
  /bkit:menu pdca analyze <feature>  Gap analysis (design vs implementation)
  /bkit:menu pdca iterate <feature>  Auto-improvement iteration
  /bkit:menu pdca report <feature>   Generate completion report
  /bkit:menu pdca status             Show current PDCA status
  /bkit:menu pdca next               Guide to next step

🚀 Project Initialization
  /bkit:menu init starter <name>     Static web project (HTML/CSS/Next.js)
  /bkit:menu init dynamic <name>     Fullstack app (bkend.ai BaaS)
  /bkit:menu init enterprise <name>  Enterprise system (K8s/Terraform)

📊 Development Pipeline
  /bkit:menu pipeline start          Start pipeline
  /bkit:menu pipeline next           Proceed to next phase
  /bkit:menu pipeline status         Check current phase

🔍 Quality Management
  /bkit:menu review <path>           Code review
  /bkit:menu qa                      Start Zero Script QA

🔗 Integration
  /bkit:menu github stats            Collect GitHub statistics
  /bkit:menu github report           Generate GitHub report

📚 Learning
  /bkit:menu learn [1-5]             Learn Claude Code (by level)
  /bkit:menu learn setup             Analyze current project setup

ℹ️  Status
  /bkit:menu status                  Full status dashboard
  /bkit:menu help                    This help message

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Tip: For detailed help on each command, use /bkit:menu <category> help
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 2. PDCA Commands ("pdca ...")

When first argument is `pdca`:

**Action**: Call `bkit:pdca` skill via Skill tool
**Arguments**: Pass all arguments after `pdca`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu pdca plan login` | `Skill("bkit:pdca", "plan login")` |
| `/bkit:menu pdca design login` | `Skill("bkit:pdca", "design login")` |
| `/bkit:menu pdca do login` | `Skill("bkit:pdca", "do login")` |
| `/bkit:menu pdca analyze login` | `Skill("bkit:pdca", "analyze login")` |
| `/bkit:menu pdca iterate login` | `Skill("bkit:pdca", "iterate login")` |
| `/bkit:menu pdca report login` | `Skill("bkit:pdca", "report login")` |
| `/bkit:menu pdca status` | `Skill("bkit:pdca", "status")` |
| `/bkit:menu pdca next` | `Skill("bkit:pdca", "next")` |

---

### 3. Project Initialization ("init ...")

When first argument is `init`:

**Action**: Call different Skill based on second argument (level)
**Level-to-Skill Mapping**:

| Level | Skill | Description |
|-------|-------|-------------|
| `starter` | `bkit:starter` | HTML/CSS/JS or basic Next.js |
| `dynamic` | `bkit:dynamic` | Next.js + bkend.ai BaaS |
| `enterprise` | `bkit:enterprise` | Turborepo + K8s/Terraform |

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu init starter my-site` | `Skill("bkit:starter", "init my-site")` |
| `/bkit:menu init dynamic my-saas` | `Skill("bkit:dynamic", "init my-saas")` |
| `/bkit:menu init enterprise my-platform` | `Skill("bkit:enterprise", "init my-platform")` |

**If level not specified**: Use AskUserQuestion to request level selection
```
Which project level would you like to create?
- Starter: Static website (HTML/CSS/Next.js)
- Dynamic: Fullstack app (with auth, DB)
- Enterprise: Large-scale system (MSA, K8s)
```

---

### 4. Pipeline ("pipeline ...")

When first argument is `pipeline`:

**Action**: Call `bkit:development-pipeline` skill via Skill tool
**Arguments**: Pass all arguments after `pipeline`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu pipeline start` | `Skill("bkit:development-pipeline", "start")` |
| `/bkit:menu pipeline next` | `Skill("bkit:development-pipeline", "next")` |
| `/bkit:menu pipeline status` | `Skill("bkit:development-pipeline", "status")` |

---

### 5. Code Review ("review ...")

When first argument is `review`:

**Action**: Call `bkit:code-review` skill via Skill tool
**Arguments**: Pass all arguments after `review`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu review src/` | `Skill("bkit:code-review", "src/")` |
| `/bkit:menu review src/lib/auth.ts` | `Skill("bkit:code-review", "src/lib/auth.ts")` |
| `/bkit:menu review pr 123` | `Skill("bkit:code-review", "pr 123")` |

---

### 6. QA ("qa")

When first argument is `qa`:

**Action**: Call `bkit:zero-script-qa` skill via Skill tool
**Arguments**: Pass all arguments after `qa`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu qa` | `Skill("bkit:zero-script-qa", "")` |
| `/bkit:menu qa start` | `Skill("bkit:zero-script-qa", "start")` |

---

### 7. GitHub ("github ...")

When first argument is `github`:

**Action**: Call `bkit:github-integration` skill via Skill tool
**Arguments**: Pass all arguments after `github`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu github stats` | `Skill("bkit:github-integration", "stats")` |
| `/bkit:menu github report` | `Skill("bkit:github-integration", "report")` |
| `/bkit:menu github setup` | `Skill("bkit:github-integration", "setup")` |

---

### 8. Learning ("learn ...")

When first argument is `learn`:

**Action**: Call `bkit:claude-code-learning` skill via Skill tool
**Arguments**: Pass all arguments after `learn`

**Examples**:
| Input | Skill Call |
|-------|-----------|
| `/bkit:menu learn` | `Skill("bkit:claude-code-learning", "")` |
| `/bkit:menu learn 1` | `Skill("bkit:claude-code-learning", "learn 1")` |
| `/bkit:menu learn setup` | `Skill("bkit:claude-code-learning", "setup")` |

---

### 9. Status ("status")

When first argument is `status`:

**Action**: Display integrated status dashboard

**Steps**:
1. Read `docs/.bkit-memory.json` → current feature, PDCA phase, level
2. Read `docs/.pdca-status.json` → detailed PDCA status
3. Call TaskList → list of in-progress tasks

**Output Format**:
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 bkit Status Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 Current Work
  Feature: {feature}
  Level: {level}
  PDCA Phase: {phase}

📈 PDCA Progress
  [Plan] ✅ → [Design] ✅ → [Do] 🔄 → [Check] ⏳ → [Report] ⏳

📋 In-Progress Tasks
  - [Do] {feature} (in_progress)
  - [Design] {feature} (completed)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💡 Next step: /bkit:menu pdca do {feature}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

### 10. Unknown Command

If input doesn't match any category above:

**Action**:
1. Display help message
2. Use AskUserQuestion to clarify user intent

```
Could not recognize the command you entered.

What were you trying to do?
- PDCA cycle management
- Project initialization
- Code review
- Other
```

---

## Skills Inventory (Reference)

### User-Invocable Skills (11)

| Skill | Description | Associated Agent |
|-------|-------------|------------------|
| `bkit:pdca` | PDCA cycle management | gap-detector, pdca-iterator, report-generator |
| `bkit:starter` | Starter project initialization | starter-guide |
| `bkit:dynamic` | Dynamic project initialization | bkend-expert |
| `bkit:enterprise` | Enterprise project initialization | enterprise-expert, infra-architect |
| `bkit:development-pipeline` | 9-phase development pipeline | pipeline-guide |
| `bkit:code-review` | Code quality analysis | code-analyzer |
| `bkit:zero-script-qa` | Log-based QA | qa-monitor |
| `bkit:github-integration` | GitHub statistics/reports | - |
| `bkit:claude-code-learning` | Claude Code learning | claude-code-guide |
| `bkit:bkit-rules` | Core rules (auto-applied) | - |
| `bkit:bkit-templates` | PDCA document templates | - |

### Claude-Only Skills (11)

| Skill | Description |
|-------|-------------|
| `bkit:phase-1-schema` ~ `bkit:phase-9-deployment` | 9-phase Pipeline detailed knowledge |
| `bkit:mobile-app` | Mobile app development knowledge |
| `bkit:desktop-app` | Desktop app development knowledge |

---

## Important Notes

1. **On Skill call failure**: Show error message with alternative suggestions
2. **Always guide next step**: Show recommended next command after task completion
3. **Maintain context**: Track current work state via `.bkit-memory.json`
