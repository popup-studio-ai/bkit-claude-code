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
  /pdca pm <feature>         PM Agent Team analysis (43 frameworks, v2.0.3)
  /pdca plan <feature>       Plan with Checkpoints 1-2 (requirements + questions)
  /pdca design <feature>     Design with Checkpoint 3 (3 architecture options)
  /pdca do <feature>         Implement with Checkpoint 4 (scope approval)
  /pdca do <feature> --scope module-N   Multi-session incremental (v2.0.5)
  /pdca analyze <feature>    Gap analysis with Checkpoint 5 (fix strategy)
  /pdca qa <feature>         QA phase testing (L1-L5 test levels, v2.1.1)
  /pdca iterate <feature>    Auto-improvement iteration
  /pdca report <feature>     Generate completion report
  /pdca archive <feature>    Archive completed PDCA documents
  /pdca cleanup              Cleanup archived features from status
  /pdca team <feature>       Start PDCA Team Mode (Agent Teams)
  /pdca team status          Show Team status
  /pdca team cleanup         Cleanup Team resources
  /pdca status               Show current PDCA status
  /pdca next                 Guide to next step

Sprint Management (v2.1.13 — meta-container for 1+ features)
  /sprint init <id> [--name <name>] [--features a,b] [--trust L0-L4]
                             Create sprint (8-phase: prd→plan→design→do→iterate→qa→report→archived)
  /sprint start <id> [--trust L0-L4]   Auto-run up to Trust Level scope (L4=full-auto)
  /sprint status <id>        Current phase + status + auto-pause triggers
  /sprint list               All sprints overview
  /sprint watch <id>         Live snapshot + 4 triggers + 3 matrices (dataFlow/cumulative/feature-phase)
  /sprint phase <id> --to <phase>      Manual phase transition
  /sprint iterate <id>       matchRate 100% loop (max 5 iterations)
  /sprint qa <id> [--feature <name>]   7-Layer S1 dataFlow integrity check
  /sprint report <id>        Generate sprint completion report
  /sprint archive <id>       Move to archived (terminal state)
  /sprint pause <id>         Stop auto-run (4 triggers also auto-pause)
  /sprint resume <id>        Resume from paused state
  /sprint fork <id> --new <newId>      Carry incomplete features → new sprint
  /sprint feature <id> --action list|add|remove --feature <name>
  /sprint trust <id> --to <L0-L4> [--reason "..."] [--force]
                             Mutate sprint trust level (persistent, audit-logged) — v2.1.18 (Issue #101)
  /sprint help               Sprint Management help
  Korean guide: docs/06-guide/sprint-management.guide.md
  Migration:    docs/06-guide/sprint-migration.guide.md (PDCA↔Sprint, orthogonal coexistence)

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
  /qa-phase <feature>        QA phase testing (L1-L5 test levels)
  /zero-script-qa            Start Zero Script QA

Learning
  /claude-code-learning          Learn Claude Code
  /claude-code-learning setup    Analyze current project setup

Code Quality (v1.6.0)
  /simplify                  Review changed code for reuse, quality, efficiency
  /batch                     Process multiple features in batch mode

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

### User-Invocable Skills (14)

| Function | Description |
|----------|-------------|
| `/pdca` | PDCA cycle management (pm, plan, design, do, analyze, iterate, report, archive, cleanup, team, status, next) |
| `/sprint` | **Sprint Management (v2.1.13)** — meta-container grouping 1+ features (**18 sub-actions** v2.1.18: init/start/status/list/watch/phase/iterate/qa/report/archive/pause/resume/fork/feature/help/master-plan/**measure** (v2.1.16 #94)/**trust** (v2.1.18 #101 — persistent trust mutation, audit-logged)). Orthogonal coexistence with PDCA |
| `/starter` | Starter project (HTML/CSS/Next.js) |
| `/dynamic` | Dynamic project (bkend.ai BaaS) |
| `/enterprise` | Enterprise project (K8s/Terraform) |
| `/development-pipeline` | 9-phase development pipeline |
| `/code-review` | Code quality analysis |
| `/qa-phase` | QA phase testing with L1-L5 test levels |
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

### Agents (40 total, auto-triggered by keywords — 9 fable / 7 opus / 16 sonnet / 8 haiku)

> Full agent list at [bkit-system/components/agents/_agents-overview.md](../bkit-system/components/agents/_agents-overview.md). Models and constraints enforced by v2.1.10 3-Tier Agent Security Model + Sprint 7 `cto-lead` body (5 Task spawn examples + `Task(pm-lead)`/`Task(qa-lead)`/`Task(pdca-iterator)` frontmatter).

#### Core Agents (11 — excerpt)

| Agent | Trigger Keywords | Model |
|-------|-----------------|-------|
| gap-detector | verify, check, gap | fable |
| pdca-iterator | improve, iterate, fix | fable |
| code-analyzer | analyze, quality, review | opus |
| report-generator | report, summary, complete | haiku |
| starter-guide | beginner, help, learn | sonnet |
| bkend-expert | login, auth, database | sonnet |
| enterprise-expert | microservices, k8s, architecture | opus |
| design-validator | validate design, spec check | fable |
| qa-monitor | QA, docker logs, testing | haiku |
| pipeline-guide | where to start, what first | sonnet |
| infra-architect | AWS, terraform, infrastructure | opus |

#### CTO-Led Team Agents (5, v1.5.1)

| Agent | Trigger Keywords | Model | Role |
|-------|-----------------|-------|------|
| cto-lead | team, project lead, CTO | fable | Team orchestration, PDCA workflow management |
| frontend-architect | frontend, UI architecture, component | sonnet | UI/UX design, component structure, Design System |
| product-manager | requirements, feature spec, priority | sonnet | Requirements analysis, feature prioritization |
| qa-strategist | test strategy, QA plan, quality metrics | sonnet | Test strategy, quality metrics coordination |
| security-architect | security, vulnerability, OWASP | opus | Vulnerability analysis, authentication design review |

#### PM Agent Team (5, v2.0.3 — 43 frameworks)

| Agent | Trigger Keywords | Model | Frameworks |
|-------|-----------------|-------|------------|
| pm-lead | pm team, product discovery, PM analysis | fable | Team orchestration, 4-phase workflow |
| pm-discovery | market research, user research | sonnet | OST, Brainstorm, Assumption Risk Assessment |
| pm-strategy | product strategy, positioning | sonnet | JTBD, Lean Canvas, SWOT, PESTLE, Porter's, Growth Loops |
| pm-research | competitive analysis, trend research | sonnet | Personas, Competitors, TAM/SAM/SOM, Customer Journey, ICP |
| pm-prd | PRD, product requirements document | sonnet | PRD v2.0 + Execution Deliverables (Pre-mortem, User/Job Stories, Test Scenarios, Stakeholder Map, Battlecards) |

Based on [pm-skills](https://github.com/phuryn/pm-skills) by Pawel Huryn (MIT License).

**How to Use PM Agent Team (v2.0.3):**
```bash
# Run PM analysis with 43 frameworks (recommended)
/pdca pm {feature}

# PM Team produces PRD v2.0 → docs/00-pm/{feature}.prd.md
# Then Plan with Interactive Checkpoints (PRD auto-referenced)
/pdca plan {feature}
```

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

### v2.1.13 Features (Sprint Management — work in progress)

| Feature | Activation | Description |
|---------|-----------|-------------|
| Sprint Management | `/sprint <action>` | Meta-container grouping 1+ features under shared scope/budget/timeline. 8-phase lifecycle (prd→plan→design→do→iterate→qa→report→archived). 16 sub-actions. Orthogonal to PDCA 9-phase (both may coexist) |
| Trust Level Scope L0-L4 | `--trust L0-L4` flag | `SPRINT_AUTORUN_SCOPE` controls auto-run boundary (L0/L1 stop-after-prd manual / L2 stop-after-design / L3 stop-after-report / L4 stop-after-archived = full-auto). `--approve` is the Trust-Level scope escape hatch ONLY — it does NOT bypass Quality Gate failures (run `/sprint measure` first). |
| 4 Auto-Pause Triggers | Automatic during auto-run | QUALITY_GATE_FAIL / ITERATION_EXHAUSTED / BUDGET_EXCEEDED / PHASE_TIMEOUT — instant pause on detection |
| 7-Layer S1 dataFlow QA | `/sprint qa <id>` | H1-H7 hops (UI→Client→API→Validation→DB→Response→Client→UI) integrity check |
| L3 Contract Test (tracked CI gate) | `tests/contract/v2113-sprint-contracts.test.js` | 8 cross-sprint contracts (SC-01~08): entity shape / deps interface / infra adapters / handler signature / 4-layer chain / ACTION_TYPES 18 / SPRINT_AUTORUN_SCOPE mirror / hooks 21:24 |
| 3 Production Adapter Scaffolds | Sprint 2 deps injection | `createGapDetector` / `createAutoFixer` / `createDataFlowValidator` — no-op baseline + agentTaskRunner-injected real impl path |
| Korean User Guide | `docs/06-guide/` | sprint-management.guide.md (~330 lines, 8 sections) + sprint-migration.guide.md (~200 lines, PDCA↔Sprint mapping) |
| Sprint Phase Enum | `lib/application/sprint-lifecycle/phases.js` | `SPRINT_PHASES` frozen Object + `SPRINT_PHASE_ORDER` 8 strings + `isValidSprintPhase` / `nextSprintPhase` helpers |

### v2.1.10 Features (current — Sprint 0~7 Integrated Enhancement)

| Feature | Activation | Description |
|---------|-----------|-------------|
| Clean Architecture 4-Layer | Automatic (CI-enforced) | `lib/domain/` 11 modules (6 ports + 4 guards + 1 rules) / `lib/infra/` adapters / `lib/cc-regression/` application / hooks+scripts presentation. `scripts/check-domain-purity.js` enforces 0 forbidden imports (fs/child_process/net/http/https/os). |
| Defense-in-Depth 4-Layer | Automatic (runtime + CI) | Layer 1 CC Built-in sandbox → Layer 2 bkit PreToolUse (`pre-write.js` + `unified-bash-pre.js` + defense-coordinator) → Layer 3 audit-logger OWASP A03/A08 sanitizer (PII 7-key) → Layer 4 Token Ledger NDJSON |
| Invocation Contract L1~L5 | CI gate `contract-check.yml` | 226 assertions (L1 contract baseline 94 JSON + L4 CI gate) + L2 smoke 98 TC + L3 MCP stdio 42 TC (real spawn) + L5 E2E shell 5 scenarios |
| 3-Layer Orchestration (Sprint 7) | Automatic | `lib/orchestrator/` 5 modules: intent-router (feature>skill>agent priority) + next-action-engine (Stop-family) + team-protocol (PM/CTO/QA Lead Task spawn) + workflow-state-machine (matchRate SSoT 90) + index (19 exports) |
| Guard Registry 21 | Daily cron | `lib/cc-regression/registry.js` — 21 guards (MON-CC-02, MON-CC-06 17 items, ENH-262/263/264, ENH-214) + `expectedFix` seed × 4 auto-release via `lifecycle.reconcile()` |
| SKILL_TRIGGER_PATTERNS 15 | Automatic (Sprint 7 G-J-01) | `lib/intent/language.js` — expanded from 4 to 15 skills (pdca, pm-discovery, plan-plus, qa-phase, code-review, deploy, rollback, skill-create, control, audit, phase-4-api, ...) |
| matchRate SSoT 90 | `bkit.config.json:pdca.matchRateThreshold` | Sprint 7 G-P-01: threshold default changed 100→90 across `lib/pdca/state-machine.js` + `lib/pdca/automation.js` |
| Enterprise Teammates 6 | `/pdca team {feature}` on Enterprise | Sprint 7 G-T-03: 5→6 (strategy.js + `skills/pdca/SKILL.md:384` synchronized) |
| Trust Score Level Auto-Reflect | Automatic | Sprint 7 G-C-01/02: `lib/control/trust-engine.js:syncToControlState` restored (autoEscalation/autoDowngrade flags wired) |
| BKIT_VERSION 5-Location Invariant | `scripts/docs-code-sync.js scanVersions()` | `bkit.config.json` canonical → `plugin.json` + `hooks.json` + `session-start.js` + `README.md` + `CHANGELOG.md`, 0 drift enforced |
| Docs=Code CI | `scripts/docs-code-sync.js` | 8 counts (skills/agents/hookEvents/hookBlocks/mcpServers/mcpTools/libModules/scripts) + version, 0 drift required |
| 6 Validator CLIs | Manual + CI | `check-guards` (21) / `docs-code-sync` (0 drift) / `check-deadcode` (Live/Exempt/Legacy) / `check-domain-purity` (11 files, 0 violations) / `l3-mcp-runtime` (42/42) / `test/e2e/run-all.sh` (5/5) |
| Hook Attribution (3 sites) | Automatic | Stop + SessionEnd + SubagentStop hooks emit cc-regression `recordEvent` + `recordPrecompactEvent` via `lib/cc-regression/event-recorder.js` |
| @version Refresh (79 files) | Sprint 7e | 66 lib + 13 scripts `@version 2.0.0 → 2.1.10` bulk update (legacy 2.0.0 = 0 matches) |

### v2.0.5 Features

| Feature | Activation | Description |
|---------|-----------|-------------|
| Context Anchor | Automatic in `/pdca plan` | WHY/WHO/RISK/SUCCESS/SCOPE 5-line summary propagated across Plan→Design→Do→Analysis |
| Session Guide | Automatic in `/pdca design` | Module Map + Recommended Session Plan for multi-session implementation |
| Multi-Session Scope | `/pdca do {feature} --scope module-N` | Implement specific modules per session to reduce context loss |
| Upstream Cross-Reading | Automatic in `/pdca do`, `/pdca analyze` | Do reads Plan Context Anchor; Analyze references Plan Success Criteria |

### v2.0.3 Features

| Feature | Activation | Description |
|---------|-----------|-------------|
| PM Frameworks 43 | `/pdca pm {feature}` | pm-skills MIT integration (9→43 frameworks) |
| Interactive Checkpoints | Automatic in `/pdca` | 5 AskUserQuestion gates across PDCA phases |
| Confidence Filtering | Automatic in code-analyzer | Only ≥80% confidence issues reported |
| 3 Architecture Options | `/pdca design {feature}` | Minimal / Clean / Pragmatic comparison |
| btw Team Integration | `/btw` in CTO Team | teamContext tracking, phase transition summaries |
| PRD v2.0 Template | `/pdca pm {feature}` | Execution Deliverables (Pre-mortem, Stories, etc.) |

### v1.6.0 Features

| Feature | Activation | Description |
|---------|-----------|-------------|
| PM Agent Team | `/pdca pm {feature}` | 5 PM agents for pre-Plan product discovery |
| Skill Classification | Automatic | 10 Workflow / 16 Capability / 2 Hybrid |
| Skill Evals | `evals/` directory | 28 eval definitions for skill quality measurement |
| Skill Hot Reload | `/reload-plugins` | Apply skill changes without session restart |

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
