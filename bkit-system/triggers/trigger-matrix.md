# Trigger Matrix

> Core matrix showing which components trigger on each event (v1.5.0)
>
> **v1.5.0**: Claude Code Exclusive

## Hook Event Reference (v1.5.0)

| Hook Event | Description |
|------------|-------------|
| `SessionStart` | Session initialization |
| `PreToolUse` | Before tool execution |
| `PostToolUse` | After tool execution |
| `Stop` | Agent completion |
| `UserPromptSubmit` | User prompt submitted |
| `PreCompact` | Before context compaction |

---

## Hook Event Matrix

### hooks.json (Global Hooks)

These hooks are defined in `hooks/hooks.json` and apply to **all sessions regardless of skill/agent activation**:

| Event | Matcher | Script | Action |
|-------|---------|--------|--------|
| SessionStart | - | `session-start.js` | Initialize session, detect level, guide user via AskUserQuestion |
| PreToolUse | `Write\|Edit` | `pre-write.js` | PDCA doc check, task classification, convention hints, block major features without design |
| PostToolUse | `Write` | `pdca-post-write.js` | Suggest gap analysis after implementation |

> **Note**: Global hooks ensure PDCA guidance is available. Skill-specific hooks provide additional contextual features when skills are activated.

### Skill Frontmatter Hooks (PreToolUse/PostToolUse)

These hooks are defined in skill YAML frontmatter:

#### PreToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[../agents/design-validator|design-validator]] | `design-validator-pre.js` | Design document checklist |
| `Write\|Edit` | [[../agents/code-analyzer|code-analyzer]] | (block) | Code analyzer is read-only |
| `Bash` | [[../../skills/zero-script-qa/SKILL|zero-script-qa]] | `qa-pre-bash.js` | Block destructive commands |
| `Bash` | [[../../skills/phase-9-deployment/SKILL|phase-9-deployment]] | `phase9-deploy-pre.js` | Environment validation |

#### PostToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[../../skills/phase-5-design-system/SKILL|phase-5-design-system]] | `phase5-design-post.js` | Design token verification |
| `Write` | [[../../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] | `phase6-ui-post.js` | UI layer separation check |
| `Write` | [[../agents/qa-monitor|qa-monitor]] | `qa-monitor-post.js` | Critical issue notification |

#### Stop

**Active Stop Hooks** (Defined in SKILL.md frontmatter):

| Skill/Agent | Script | Action |
|-------------|--------|--------|
| [[../../skills/phase-4-api/SKILL|phase-4-api]] | `phase4-api-stop.js` | Zero Script QA guidance |
| [[../../skills/phase-8-review/SKILL|phase-8-review]] | `phase8-review-stop.js` | Review summary + gap analysis |
| [[../../skills/zero-script-qa/SKILL|zero-script-qa]] | `qa-stop.js` | QA session cleanup |
| [[../../skills/development-pipeline/SKILL|development-pipeline]] | `echo` | Pipeline completion |
| [[../agents/gap-detector|gap-detector]] | `gap-detector-stop.js` | Check-Act iteration: Match Rate based branching (v1.3.0) |
| [[../agents/pdca-iterator|pdca-iterator]] | `iterator-stop.js` | Check-Act iteration: Complete/Continue guidance (v1.3.0) |
| [[../agents/code-analyzer|code-analyzer]] | `analysis-stop.js` | Issue summary and next action guidance on analysis completion |
| [[../agents/qa-monitor|qa-monitor]] | `qa-stop.js` | Result summary and cleanup on QA session end |

**Prepared Scripts** (Script exists but not connected in SKILL.md hooks):

| Skill | Script | Status |
|-------|--------|--------|
| [[../../skills/phase-1-schema/SKILL|phase-1-schema]] | `phase1-schema-stop.js` | Script ready, hook not connected |
| [[../../skills/phase-2-convention/SKILL|phase-2-convention]] | `phase2-convention-stop.js` | Script ready, hook not connected |
| [[../../skills/phase-3-mockup/SKILL|phase-3-mockup]] | `phase3-mockup-stop.js` | Script ready, hook not connected |
| [[../../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] | `phase7-seo-stop.js` | Script ready, hook not connected |

> **Note**: Scripts added in v1.4.0, but hooks frontmatter not yet added to corresponding SKILL.md files.

---

## Write/Edit Flow (v1.4.0)

When user writes/edits source code files:

```
1. PreToolUse Stage (Skill Frontmatter)
   └── pre-write.js ← Unified hook
       ├── 1. Task classification (Quick Fix → Major Feature)
       ├── 2. PDCA document check (design doc exists?)
       └── 3. Convention hints (by file type)

2. Actual Write/Edit Execution

3. PostToolUse Stage (Skill Frontmatter)
   ├── pdca-post-write.js
   │   └── Suggest gap analysis (if design doc exists)
   ├── phase-5-design-system (phase5-design-post.js)
   │   └── Verify design tokens (if UI file: .tsx, .jsx, .vue, .svelte)
   └── phase-6-ui-integration (phase6-ui-post.js)
       └── Verify layer separation (if UI file or pages/components/features path)
```

**v1.2.0 Improvement**: 3 separate PreToolUse hooks merged into 1 unified hook for better performance.

**v1.2.1 Improvement**: Extension-based file detection replaces path-based detection for multi-language support.

**v1.2.3 Improvement**: SessionStart hook now guides users with AskUserQuestion (4 options).

**v1.3.0 Improvement**: Check-Act iteration loop with Stop hooks on gap-detector and pdca-iterator agents.

---

## Check-Act Iteration Loop (v1.3.0)

Automatic iteration cycle for quality improvement:

```
gap-detector Agent (Check)
    ↓ (Stop hook)
gap-detector-stop.js
    ├── >= 90% Match Rate → Suggest report-generator
    ├── 70-89% Match Rate → Provide options (manual/auto)
    └── < 70% Match Rate  → Strongly recommend pdca-iterator
                               ↓
                          pdca-iterator Agent (Act)
                               ↓ (Stop hook)
                          iterator-stop.js
                               ├── Completion detected → Suggest report-generator
                               └── In progress → Guide to re-run gap-detector
```

### Stop Hook Flow

| Agent | Condition | Action |
|-------|-----------|--------|
| gap-detector | Match Rate >= 90% | Suggest `/pdca-report` → Enable `/archive` |
| gap-detector | Match Rate 70-89% | Manual fix or pdca-iterator choice |
| gap-detector | Match Rate < 70% | Strongly recommend pdca-iterator |
| pdca-iterator | Completion message detected | Re-run gap-detector or completion guidance |
| pdca-iterator | In progress | Guide to Check with gap-detector |

---

## Skill Description Triggers (Semantic Matching)

> **Note**: The "Triggers:" keyword in description is a **bkit convention**, not an official Claude Code feature. Claude uses **semantic matching** on the entire description field to decide when to auto-invoke skills/agents. The "Triggers:" section helps Claude understand activation contexts through natural language.

Skills and Agents are activated by semantic matching on their description field.

### Level Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[../../skills/starter/SKILL|starter]] | static website, portfolio, landing page, beginner, HTML CSS |
| [[../../skills/dynamic/SKILL|dynamic]] | fullstack, BaaS, bkend, authentication, login, signup, database |
| [[../../skills/enterprise/SKILL|enterprise]] | microservices, kubernetes, terraform, k8s, AWS, CTO, AI Native |

### Phase Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[../../skills/phase-1-schema/SKILL|phase-1-schema]] | schema, terminology, data model, entity |
| [[../../skills/phase-2-convention/SKILL|phase-2-convention]] | convention, coding style, naming rules |
| [[../../skills/phase-3-mockup/SKILL|phase-3-mockup]] | mockup, prototype, wireframe, UI design |
| [[../../skills/phase-4-api/SKILL|phase-4-api]] | API design, REST API, backend, endpoint |
| [[../../skills/phase-5-design-system/SKILL|phase-5-design-system]] | design system, component library, design tokens, shadcn |
| [[../../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] | UI implementation, API integration, state management |
| [[../../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] | SEO, security, meta tags, XSS, CSRF |
| [[../../skills/phase-8-review/SKILL|phase-8-review]] | code review, architecture review, quality check, refactoring |
| [[../../skills/phase-9-deployment/SKILL|phase-9-deployment]] | deployment, CI/CD, production, Vercel, Kubernetes, Docker |

### Core/Specialized Skills

| Skill | Trigger Keywords |
|-------|------------------|
| [[../../skills/bkit-rules/SKILL|bkit-rules]] | bkit, PDCA, develop, implement, feature, bug, code, design |
| [[../../skills/bkit-templates/SKILL|bkit-templates]] | template, plan document, design document, analysis document, report |
| [[../../skills/zero-script-qa/SKILL|zero-script-qa]] | zero script qa, log-based testing, docker logs, QA, testing |
| [[../../skills/development-pipeline/SKILL|development-pipeline]] | development pipeline, phase, where to start, new project |
| [[../../skills/mobile-app/SKILL|mobile-app]] | mobile app, React Native, Flutter, Expo, iOS, Android |
| [[../../skills/desktop-app/SKILL|desktop-app]] | desktop app, Electron, Tauri, mac app, windows app |

---

## Agent Auto-Trigger (Semantic Matching)

> Same semantic matching applies to agents. Claude decides to delegate based on the description's meaning.

| Agent | Trigger Keywords |
|-------|------------------|
| [[../agents/starter-guide|starter-guide]] | beginner, first project, learn to code, simple website, portfolio |
| [[../agents/bkend-expert|bkend-expert]] | bkend, BaaS, login, signup, database, fullstack, backend |
| [[../agents/enterprise-expert|enterprise-expert]] | CTO, AI Native, microservices, architecture decision |
| [[../agents/infra-architect|infra-architect]] | AWS, Kubernetes, Terraform, CI/CD, EKS, RDS, cloud |
| [[../agents/pipeline-guide|pipeline-guide]] | development pipeline, phase, where to start, how to begin |
| [[../agents/gap-detector|gap-detector]] | gap analysis, design-implementation check, compare design |
| [[../agents/design-validator|design-validator]] | design validation, document review, spec check |
| [[../agents/code-analyzer|code-analyzer]] | code analysis, quality check, security scan, code review |
| [[../agents/qa-monitor|qa-monitor]] | zero script qa, QA, testing, log analysis, docker logs |
| [[../agents/pdca-iterator|pdca-iterator]] | iterate, optimize, auto-fix, automatically fix |
| [[../agents/report-generator|report-generator]] | PDCA report, completion report, summary, progress report |

---

## Skill → Agent Connections (v1.3.0)

Each Skill is connected to specific Agents:

| Skill | Connected Agent | Note |
|-------|-----------------|------|
| `starter` | [[../agents/starter-guide|starter-guide]] | |
| `dynamic` | [[../agents/bkend-expert|bkend-expert]] | |
| `enterprise` | [[../agents/enterprise-expert|enterprise-expert]] | Includes AI Native, monorepo |
| `enterprise` | [[../agents/infra-architect|infra-architect]] | |
| `development-pipeline` | [[../agents/pipeline-guide|pipeline-guide]] | |
| `zero-script-qa` | [[../agents/qa-monitor|qa-monitor]] | |
| `phase-8-review` | [[../agents/code-analyzer|code-analyzer]] | Code quality analysis |
| `bkit-templates` | [[../agents/design-validator|design-validator]] | Document validation |
| `mobile-app` | [[../agents/pipeline-guide|pipeline-guide]] | |
| `desktop-app` | [[../agents/pipeline-guide|pipeline-guide]] | |

**Removed Connections (v1.2.0)**:
- `evaluator-optimizer` → Removed (merged into pdca-iterator agent description)
- `analysis-patterns` → Merged into phase-8-review
- `pdca-methodology` → Removed (merged into bkit-rules)
- `document-standards` → Merged into bkit-templates

---

## Related Documents

- [[priority-rules]] - Priority rules for conflicts
- [[../scenarios/scenario-write-code]] - Write/Edit scenario details
- [[../_GRAPH-INDEX]] - Full index
