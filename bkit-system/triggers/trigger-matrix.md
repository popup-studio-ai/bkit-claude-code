# Trigger Matrix

> Core matrix showing which components trigger on each event (v1.2.3)

## Hook Event Matrix

### hooks.json (Global Hooks)

These hooks are defined in `hooks/hooks.json` and apply to all sessions:

| Event        | Matcher | Script             | Action                                                       |
| ------------ | ------- | ------------------ | ------------------------------------------------------------ |
| SessionStart | -       | `session-start.sh` | Initialize session, detect level, guide user via AskUserQuestion |

> **Note**: Only SessionStart is in global hooks.json. PreToolUse/PostToolUse hooks are defined in skill frontmatter for contextual activation.

### Skill Frontmatter Hooks (PreToolUse/PostToolUse)

These hooks are defined in skill YAML frontmatter:

#### PreToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[../agents/design-validator|design-validator]] | `design-validator-pre.sh` | Design document checklist |
| `Write\|Edit` | [[../agents/code-analyzer|code-analyzer]] | (block) | Code analyzer is read-only |
| `Bash` | [[../../skills/zero-script-qa/SKILL|zero-script-qa]] | `qa-pre-bash.sh` | Block destructive commands |
| `Bash` | [[../../skills/phase-9-deployment/SKILL|phase-9-deployment]] | `phase9-deploy-pre.sh` | Environment validation |

#### PostToolUse

| Tool | Skill/Agent | Script | Action |
|------|-------------|--------|--------|
| `Write` | [[../../skills/phase-5-design-system/SKILL|phase-5-design-system]] | `phase5-design-post.sh` | Design token verification |
| `Write` | [[../../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] | `phase6-ui-post.sh` | UI layer separation check |
| `Write` | [[../agents/gap-detector|gap-detector]] | `gap-detector-post.sh` | Post-analysis iteration guidance |
| `Write` | [[../agents/qa-monitor|qa-monitor]] | `qa-monitor-post.sh` | Critical issue notification |

#### Stop

| Skill | Script | Action |
|-------|--------|--------|
| [[../../skills/phase-4-api/SKILL|phase-4-api]] | `phase4-api-stop.sh` | Zero Script QA guidance |
| [[../../skills/phase-8-review/SKILL|phase-8-review]] | `phase8-review-stop.sh` | Review summary + gap analysis |
| [[../../skills/zero-script-qa/SKILL|zero-script-qa]] | `qa-stop.sh` | QA session cleanup |
| [[../../skills/development-pipeline/SKILL|development-pipeline]] | `echo` | Pipeline completion |

---

## Write/Edit Flow (v1.2.3)

When user writes/edits source code files:

```
1. PreToolUse Stage (Skill Frontmatter)
   └── pre-write.sh ← Unified hook
       ├── 1. Task classification (Quick Fix → Major Feature)
       ├── 2. PDCA document check (design doc exists?)
       └── 3. Convention hints (by file type)

2. Actual Write/Edit Execution

3. PostToolUse Stage (Skill Frontmatter)
   ├── pdca-post-write.sh
   │   └── Suggest gap analysis (if design doc exists)
   ├── phase-5-design-system (phase5-design-post.sh)
   │   └── Verify design tokens (if UI file: .tsx, .jsx, .vue, .svelte)
   └── phase-6-ui-integration (phase6-ui-post.sh)
       └── Verify layer separation (if UI file or pages/components/features path)
```

**v1.2.0 Improvement**: 3 separate PreToolUse hooks merged into 1 unified hook for better performance.

**v1.2.1 Improvement**: Extension-based file detection replaces path-based detection for multi-language support.

**v1.2.3 Improvement**: SessionStart hook now guides users with AskUserQuestion (4 options).

---

## Skill Description Triggers (Keyword-Based)

Skills and Agents are activated by "Triggers:" keywords in their description.

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

## Agent Auto-Trigger (Keyword-Based)

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

## Skill → Agent Connections (v1.2.0)

Each Skill is connected to specific Agents:

| Skill | Connected Agent | Note |
|-------|-----------------|------|
| `starter` | [[../agents/starter-guide|starter-guide]] | |
| `dynamic` | [[../agents/bkend-expert|bkend-expert]] | |
| `enterprise` | [[../agents/enterprise-expert|enterprise-expert]] | Includes AI Native, monorepo |
| `enterprise` | [[../agents/infra-architect|infra-architect]] | |
| `development-pipeline` | [[../agents/pipeline-guide|pipeline-guide]] | |
| `zero-script-qa` | [[../agents/qa-monitor|qa-monitor]] | |
| `phase-8-review` | [[../agents/code-analyzer|code-analyzer]] | analysis-patterns merged |
| `bkit-templates` | [[../agents/design-validator|design-validator]] | document-standards merged |
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
