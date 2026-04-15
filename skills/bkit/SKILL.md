---
name: bkit
classification: workflow
classification-reason: Plugin self-documentation independent of model capability
deprecation-risk: none
effort: low
description: |
  bkit plugin help - list available functions. Use "/bkit" or "bkit help".
  Triggers: bkit, help, functions, 도움말, 기능, ヘルプ, 帮助, ayuda, aide, Hilfe, aiuto.
argument-hint: "[help]"
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
---

# bkit — AI Native Development OS

**Version**: 2.1.5 | **38 Skills** | **36 Agents** | **2 MCP Servers** | **4 Output Styles**

## Quick Start

Type `/bkit` or `bkit help` to see this guide.

---

## Available Skills by Category

### PDCA Lifecycle (Core)
| Skill | Description |
|-------|-------------|
| `/pdca [action] [feature]` | Unified PDCA cycle — plan, design, do, analyze, iterate, report |
| `/pdca-batch` | Manage multiple PDCA features and batch operations |
| `/plan-plus [feature]` | Brainstorming-enhanced planning with intent discovery and YAGNI review |
| `/rollback` | PDCA checkpoints — create, list, restore for safe recovery |

### Development Pipeline (9 Phases)
| Phase | Skill | Description |
|-------|-------|-------------|
| 1 | `/phase-1-schema` | Define terminology, data structures, entities |
| 2 | `/phase-2-convention` | Coding rules, conventions, standards |
| 3 | `/phase-3-mockup` | UI/UX mockups and HTML/CSS/JS prototypes |
| 4 | `/phase-4-api` | Backend API design and implementation |
| 5 | `/phase-5-design-system` | Platform-independent design systems |
| 6 | `/phase-6-ui-integration` | Frontend UI and backend API integration |
| 7 | `/phase-7-seo-security` | SEO and security hardening |
| 8 | `/phase-8-review` | Architecture consistency and quality verification |
| 9 | `/phase-9-deployment` | CI/CD pipelines, deployment strategies |
| — | `/development-pipeline` | Complete pipeline guide (all 9 phases) |

### Quality & Review
| Skill | Description |
|-------|-------------|
| `/code-review` | Code quality analysis, bug detection, best practices |
| `/qa-phase` | QA test planning, generation, execution (L1-L5) |
| `/zero-script-qa` | Test without scripts using JSON logging + Docker |
| `/audit` | Audit logs, decision traces, session history |

### Project Initialization
| Skill | Description |
|-------|-------------|
| `/starter` | Static web (HTML/CSS/JS, Next.js App Router) — beginners |
| `/dynamic` | Fullstack with bkend.ai BaaS — auth, DB, API |
| `/enterprise` | Microservices, K8s, Terraform, AI Native methodology |

### Backend Integration (bkend.ai)
| Skill | Description |
|-------|-------------|
| `/bkend-quickstart` | MCP setup, resource hierarchy, first project |
| `/bkend-data` | CRUD, column types, filtering, sorting, relations |
| `/bkend-auth` | Email/social login, JWT, RBAC, session management |
| `/bkend-storage` | File upload (presigned URL), download (CDN), buckets |
| `/bkend-cookbook` | Project tutorials and error troubleshooting |

### Advanced Features
| Skill | Description |
|-------|-------------|
| `/control` | Automation level (L0-L4), trust score, guardrails |
| `/deploy` | Deploy feature to dev/staging/prod with level-based strategy |
| `/btw` | Collect improvement suggestions during work |
| `/skill-create` | Create project-local skills interactively |
| `/skill-status` | Show loaded skill inventory and conflicts |

### Platform Skills
| Skill | Description |
|-------|-------------|
| `/desktop-app` | Electron and Tauri cross-platform desktop apps |
| `/mobile-app` | React Native, Flutter, Expo cross-platform mobile |

### PM & Team
| Skill | Description |
|-------|-------------|
| `/pm-discovery` | PM Agent Team — product discovery, strategy, PRD |
| `/cc-version-analysis` | CC CLI version upgrade impact analysis |

### Learning & Reference
| Skill | Description |
|-------|-------------|
| `/claude-code-learning` | Claude Code configuration, tips, workflows |
| `/bkit-rules` | Core PDCA methodology, quality standards |
| `/bkit-templates` | PDCA document templates |
| `/bkit` | This help guide |

---

## MCP Servers

| Server | Tools | Description |
|--------|-------|-------------|
| `bkit-pdca` | 8 tools | PDCA status, feature CRUD, metrics, document read |
| `bkit-analysis` | 5 tools | Audit search, checkpoint management, code quality, gap analysis |

---

## Output Styles

| Style | Best For |
|-------|----------|
| `bkit-concise` | Quick tasks, minimal output |
| `bkit-standard` | Default balanced output |
| `bkit-detailed` | Complex features, full context |
| `bkit-report` | PDCA reports, formal documentation |

Use `/config output-style [style]` to switch.

---

## Agent Teams

- **CTO Team**: Led by `cto-lead` agent with specialized sub-agents
- **PM Team**: Led by `pm-discovery` with 4 PM analysis agents
- Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## Quick Commands

```
/pdca plan my-feature       # Start planning
/pdca design my-feature     # Create design doc
/pdca do my-feature         # Implementation phase
/pdca analyze my-feature    # Gap analysis
/pdca report my-feature     # Generate report
/control status             # Check automation level
/audit recent               # View recent audit logs
/btw "improvement idea"     # Capture suggestion
```
