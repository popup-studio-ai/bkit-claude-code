---
name: bkit
description: |
  bkit plugin help - Show all available bkit functions.
  Workaround for skills autocomplete issue.

  Use "/bkit" or just type "bkit help" to see available functions list.

  Triggers: bkit, bkit help, bkit functions, show bkit commands,
  도움말, 기능 목록, ヘルプ, 機能一覧, 帮助, 功能列表,
  ayuda, lista de funciones, aide, liste des fonctions,
  Hilfe, Funktionsliste, aiuto, elenco funzioni
user-invocable: true
allowed-tools:
  - Read
  - Skill
---

# bkit Functions

> Show all available bkit functions (Skills autocomplete workaround)

Display the following help message:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  bkit - AI Native Development Toolkit (Claude Code Edition)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PDCA (Document-Driven Development)
  /pdca plan <feature>       Start planning a new feature
  /pdca design <feature>     Create design document
  /pdca do <feature>         Implementation guide
  /pdca analyze <feature>    Gap analysis (design vs implementation)
  /pdca iterate <feature>    Auto-improvement iteration
  /pdca report <feature>     Generate completion report
  /pdca archive <feature>    Archive completed PDCA documents
  /pdca cleanup              Cleanup archived features from status
  /pdca team <feature>       Start PDCA Team Mode (Agent Teams)
  /pdca team status          Show Team status
  /pdca team cleanup         Cleanup Team resources
  /pdca status               Show current PDCA status
  /pdca next                 Guide to next step

Project Initialization
  /starter init <name>       Static web project (HTML/CSS/Next.js)
  /dynamic init <name>       Fullstack app (bkend.ai BaaS)
  /enterprise init <name>    Enterprise system (K8s/Terraform)

Development Pipeline
  /development-pipeline start    Start pipeline
  /development-pipeline next     Proceed to next phase
  /development-pipeline status   Check current phase

Quality Management
  /code-review <path>        Code review
  /zero-script-qa            Start Zero Script QA

Learning
  /claude-code-learning          Learn Claude Code
  /claude-code-learning setup    Analyze current project setup

Memory & Clipboard (v1.5.6)
  /memory                    Manage Claude auto-memory (view/edit entries)
  /copy                      Copy code blocks to clipboard (interactive picker)

Output Styles (v1.5.3)
  /output-style              Select response style
  /output-style-setup        Install bkit styles to .claude/
  Available: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Note: These functions don't have autocomplete in CLI.
  Type the command directly (e.g., /pdca plan login)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Functions Reference

### User-Invocable Skills (12)

| Function | Description |
|----------|-------------|
| `/pdca` | PDCA cycle management (plan, design, do, analyze, iterate, report, archive, cleanup, team, status, next) |
| `/starter` | Starter project (HTML/CSS/Next.js) |
| `/dynamic` | Dynamic project (bkend.ai BaaS) |
| `/enterprise` | Enterprise project (K8s/Terraform) |
| `/development-pipeline` | 9-phase development pipeline |
| `/code-review` | Code quality analysis |
| `/zero-script-qa` | Log-based QA |
| `/claude-code-learning` | Claude Code learning |
| `/mobile-app` | Mobile app development (React Native/Flutter/Expo) |
| `/desktop-app` | Desktop app development (Electron/Tauri) |
| `/bkit-rules` | Core rules (auto-applied) |
| `/bkit-templates` | PDCA document templates |

### Phase Skills (9, auto-invoked by pipeline)

| Function | Description |
|----------|-------------|
| `/phase-1-schema` | Terminology and data structure definition |
| `/phase-2-convention` | Coding rules and conventions |
| `/phase-3-mockup` | UI/UX mockup creation |
| `/phase-4-api` | Backend API design and implementation |
| `/phase-5-design-system` | Design system and component library |
| `/phase-6-ui-integration` | UI implementation and API integration |
| `/phase-7-seo-security` | SEO optimization and security hardening |
| `/phase-8-review` | Code review and gap analysis |
| `/phase-9-deployment` | Production deployment (CI/CD, K8s) |

### Agents (16, auto-triggered by keywords)

#### Core Agents (16)

| Agent | Trigger Keywords | Model |
|-------|-----------------|-------|
| gap-detector | verify, check, gap | opus |
| pdca-iterator | improve, iterate, fix | sonnet |
| code-analyzer | analyze, quality, review | opus |
| report-generator | report, summary, complete | haiku |
| starter-guide | beginner, help, learn | sonnet |
| bkend-expert | login, auth, database | sonnet |
| enterprise-expert | microservices, k8s, architecture | opus |
| design-validator | validate design, spec check | opus |
| qa-monitor | QA, docker logs, testing | haiku |
| pipeline-guide | where to start, what first | sonnet |
| infra-architect | AWS, terraform, infrastructure | opus |

#### CTO-Led Team Agents (5, v1.5.1)

| Agent | Trigger Keywords | Model | Role |
|-------|-----------------|-------|------|
| cto-lead | team, project lead, CTO | opus | Team orchestration, PDCA workflow management |
| frontend-architect | frontend, UI architecture, component | sonnet | UI/UX design, component structure, Design System |
| product-manager | requirements, feature spec, priority | sonnet | Requirements analysis, feature prioritization |
| qa-strategist | test strategy, QA plan, quality metrics | sonnet | Test strategy, quality metrics coordination |
| security-architect | security, vulnerability, OWASP | opus | Vulnerability analysis, authentication design review |

**How to Use CTO-Led Agent Teams:**
```bash
# 1. Set environment variable
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# 2. Start CTO Team for a feature
/pdca team {feature}

# 3. CTO lead orchestrates: team composition → task assignment → execution → quality gates

# 4. Monitor progress
/pdca team status

# 5. Cleanup when done
/pdca team cleanup
```

### Output Styles (4, select via /output-style)

| Style | Best For | Description |
|-------|----------|-------------|
| bkit-learning | Starter projects | Learning points, educational insights |
| bkit-pdca-guide | Dynamic projects | PDCA badges, checklists, phase tracking |
| bkit-enterprise | Enterprise projects | Architecture tradeoffs, cost analysis |
| bkit-pdca-enterprise | Enterprise projects | PDCA + CTO combined perspective |

### v1.5.1 Features

| Feature | Activation | Description |
|---------|-----------|-------------|
| Agent Teams | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Multi-agent parallel PDCA execution |
| Agent Memory | Automatic | Agents remember context across sessions |
| Output Styles | `/output-style` | Custom response formatting |
| TaskCompleted Hook | Automatic | Auto-advance PDCA phases on task completion |
| TeammateIdle Hook | Automatic | Assign work to idle teammates |

### v1.5.3 Features

| Feature | Activation | Description |
|---------|-----------|-------------|
| Output Style Setup | `/output-style-setup` | Install bkit output styles to .claude/ |
| bkend Docs Reference | Automatic | bkend-expert fetches latest docs via WebFetch |
| SubagentStart/Stop | Automatic | Track team agent spawn/stop events |
| Team State Writer | Automatic | Write agent state to .bkit/agent-state.json |

### CLAUDE.md and bkit

bkit does NOT provide a CLAUDE.md file. Reasons:
- bkit provides dynamic context via Hooks, Skills, Agents, and Output Styles
- CLAUDE.md is for project-specific rules that the project owner writes
- bkit's SessionStart hook injects PDCA state, level detection, and trigger tables
- This is more token-efficient than static CLAUDE.md (injected once vs every turn)

If you need help writing your project's CLAUDE.md, use `/claude-code-learning`.
