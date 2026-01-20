# Trigger Matrix

> Core matrix showing which components trigger on each event (v1.2.0)

## Hook Event Matrix

### hooks.json (Global Hooks)

These hooks are defined in `hooks/hooks.json` and apply to all sessions:

| Event | Matcher | Script | Action |
|-------|---------|--------|--------|
| SessionStart | - | `session-start.sh` | Initialize session, greet user, detect level |
| PreToolUse | `Write\|Edit` | `pre-write.sh` | PDCA check + task classification + convention hints |
| PostToolUse | `Write` | `pdca-post-write.sh` | Suggest gap analysis |

### Skill Frontmatter Hooks

These hooks are defined in skill YAML frontmatter:

#### PreToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[components/agents/design-validator]] | `design-validator-pre.sh` | Design document checklist |
| `Write\|Edit` | [[components/agents/code-analyzer]] | (block) | Code analyzer is read-only |
| `Bash` | [[components/skills/zero-script-qa]] | `qa-pre-bash.sh` | Block destructive commands |
| `Bash` | [[components/skills/phase-9-deployment]] | `phase9-deploy-pre.sh` | Environment validation |

#### PostToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[components/skills/phase-5-design-system]] | `phase5-design-post.sh` | Design token verification |
| `Write` | [[components/skills/phase-6-ui-integration]] | `phase6-ui-post.sh` | UI layer separation check |
| `Write` | [[components/agents/gap-detector]] | `gap-detector-post.sh` | Post-analysis iteration guidance |
| `Write` | [[components/agents/qa-monitor]] | `qa-monitor-post.sh` | Critical issue notification |

#### Stop

| Skill | Script | Action |
|-------|--------|--------|
| [[components/skills/phase-4-api]] | `phase4-api-stop.sh` | Zero Script QA guidance |
| [[components/skills/phase-8-review]] | `phase8-review-stop.sh` | Review summary + gap analysis |
| [[components/skills/zero-script-qa]] | `qa-stop.sh` | QA session cleanup |
| [[components/skills/development-pipeline]] | `echo` | Pipeline completion |

---

## Write/Edit Flow (v1.2.0)

When user writes/edits source code files:

```
1. PreToolUse Stage
   └── hooks.json (pre-write.sh) ← Unified hook
       ├── 1. Task classification (Quick Fix → Major Feature)
       ├── 2. PDCA document check (design doc exists?)
       └── 3. Convention hints (by file type)

2. Actual Write/Edit Execution

3. PostToolUse Stage
   ├── hooks.json (pdca-post-write.sh)
   │   └── Suggest gap analysis (if design doc exists)
   ├── phase-5-design-system (phase5-design-post.sh)
   │   └── Verify design tokens (if component file)
   └── phase-6-ui-integration (phase6-ui-post.sh)
       └── Verify layer separation (if UI file)
```

**v1.2.0 Improvement**: 3 separate PreToolUse hooks merged into 1 unified hook for better performance.

---

## Skill Description Triggers (Keyword-Based)

Skills and Agents are activated by "Triggers:" keywords in their description.

### Level Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[components/skills/starter]] | static website, portfolio, landing page, beginner, HTML CSS |
| [[components/skills/dynamic]] | fullstack, BaaS, bkend, authentication, login, signup, database |
| [[components/skills/enterprise]] | microservices, kubernetes, terraform, k8s, AWS, CTO, AI Native |

### Phase Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[components/skills/phase-1-schema]] | schema, terminology, data model, entity |
| [[components/skills/phase-2-convention]] | convention, coding style, naming rules |
| [[components/skills/phase-3-mockup]] | mockup, prototype, wireframe, UI design |
| [[components/skills/phase-4-api]] | API design, REST API, backend, endpoint |
| [[components/skills/phase-5-design-system]] | design system, component library, design tokens, shadcn |
| [[components/skills/phase-6-ui-integration]] | UI implementation, API integration, state management |
| [[components/skills/phase-7-seo-security]] | SEO, security, meta tags, XSS, CSRF |
| [[components/skills/phase-8-review]] | code review, architecture review, quality check, refactoring |
| [[components/skills/phase-9-deployment]] | deployment, CI/CD, production, Vercel, Kubernetes, Docker |

### Core/Specialized Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[components/skills/bkit-rules]] | bkit, PDCA, develop, implement, feature, bug, code, design |
| [[components/skills/bkit-templates]] | template, plan document, design document, analysis document, report |
| [[components/skills/zero-script-qa]] | zero script qa, log-based testing, docker logs, QA, testing |
| [[components/skills/development-pipeline]] | development pipeline, phase, where to start, new project |
| [[components/skills/mobile-app]] | mobile app, React Native, Flutter, Expo, iOS, Android |
| [[components/skills/desktop-app]] | desktop app, Electron, Tauri, mac app, windows app |

---

## Agent Auto-Trigger (Keyword-Based)

| Agent | Trigger Keywords |
|-------|------------------|
| [[components/agents/starter-guide]] | beginner, first project, learn to code, simple website, portfolio |
| [[components/agents/bkend-expert]] | bkend, BaaS, login, signup, database, fullstack, backend |
| [[components/agents/enterprise-expert]] | CTO, AI Native, microservices, architecture decision |
| [[components/agents/infra-architect]] | AWS, Kubernetes, Terraform, CI/CD, EKS, RDS, cloud |
| [[components/agents/pipeline-guide]] | development pipeline, phase, where to start, how to begin |
| [[components/agents/gap-detector]] | gap analysis, design-implementation check, compare design |
| [[components/agents/design-validator]] | design validation, document review, spec check |
| [[components/agents/code-analyzer]] | code analysis, quality check, security scan, code review |
| [[components/agents/qa-monitor]] | zero script qa, QA, testing, log analysis, docker logs |
| [[components/agents/pdca-iterator]] | iterate, optimize, auto-fix, automatically fix |
| [[components/agents/report-generator]] | PDCA report, completion report, summary, progress report |

---

## Skill → Agent Connections (v1.2.0)

Each Skill is connected to specific Agents:

| Skill | Connected Agent | Note |
|-------|-----------------|------|
| `starter` | [[components/agents/starter-guide]] | |
| `dynamic` | [[components/agents/bkend-expert]] | |
| `enterprise` | [[components/agents/enterprise-expert]] | Includes AI Native, monorepo |
| `enterprise` | [[components/agents/infra-architect]] | |
| `development-pipeline` | [[components/agents/pipeline-guide]] | |
| `zero-script-qa` | [[components/agents/qa-monitor]] | |
| `phase-8-review` | [[components/agents/code-analyzer]] | analysis-patterns merged |
| `bkit-templates` | [[components/agents/design-validator]] | document-standards merged |
| `mobile-app` | [[components/agents/pipeline-guide]] | |
| `desktop-app` | [[components/agents/pipeline-guide]] | |

**Removed Connections (v1.2.0)**:
- `evaluator-optimizer` → Removed (merged into pdca-iterator agent description)
- `analysis-patterns` → Merged into phase-8-review
- `pdca-methodology` → Removed (merged into bkit-rules)
- `document-standards` → Merged into bkit-templates

---

## Related Documents

- [[triggers/priority-rules]] - Priority rules for conflicts
- [[scenarios/scenario-write-code]] - Write/Edit scenario details
- [[_GRAPH-INDEX]] - Full index
