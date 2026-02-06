---
name: bkit-rules
description: |
  Core rules for bkit plugin. PDCA methodology, level detection, agent auto-triggering, and code quality standards.
  These rules are automatically applied to ensure consistent AI-native development.

  Use proactively when user requests feature development, code changes, or implementation tasks.

  Triggers: bkit, PDCA, develop, implement, feature, bug, code, design, document,
  개발, 기능, 버그, 코드, 설계, 문서, 開発, 機能, バグ, 开发, 功能, 代码,
  desarrollar, función, error, código, diseño, documento,
  développer, fonctionnalité, bogue, code, conception, document,
  entwickeln, Funktion, Fehler, Code, Design, Dokument,
  sviluppare, funzionalità, bug, codice, design, documento

  Do NOT use for: documentation-only tasks, research, or exploration without code changes.
imports:
  - ${PLUGIN_ROOT}/templates/shared/naming-conventions.md
# hooks: Managed by hooks/hooks.json (pre-write.js, unified-write-post.js) - GitHub #9354 workaround
---

# bkit Core Rules

> Automatically applied rules that don't require user commands.

## 1. PDCA Auto-Apply Rules

**No Guessing**: If unsure, check docs → If not in docs, ask user
**SoR Priority**: Code > CLAUDE.md > docs/ design documents

| Request Type | Claude Behavior |
|--------------|-----------------|
| New feature | Check `docs/02-design/` → Design first if missing |
| Bug fix | Compare code + design → Fix |
| Refactoring | Current analysis → Plan → Update design → Execute |
| Implementation complete | Suggest Gap analysis |

### Template References

| Document Type | Template Path |
|---------------|---------------|
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` |

---

## 2. Level Auto-Detection

### Detection Order

1. Check CLAUDE.md for explicit Level declaration
2. File structure based detection

### Enterprise (2+ conditions met)

- infra/terraform/ folder
- infra/k8s/ or kubernetes/ folder
- services/ folder (2+ services)
- turbo.json or pnpm-workspace.yaml
- docker-compose.yml
- .github/workflows/ (CI/CD)

### Dynamic (1+ conditions met)

- bkend settings in .mcp.json
- lib/bkend/ or src/lib/bkend/
- supabase/ folder
- firebase.json

### Starter

None of the above conditions met.

### Level-specific Behavior

| Aspect | Starter | Dynamic | Enterprise |
|--------|---------|---------|------------|
| Explanation | Friendly, avoid jargon | Technical but clear | Concise, use terms |
| Code comments | Detailed | Core logic only | Architecture only |
| Error handling | Step-by-step guide | Technical solutions | Brief cause + fix |
| PDCA docs | Simple | Feature-specific | Detailed architecture |
| Primary Agent | `starter-guide` | `bkend-expert` | `enterprise-expert` |
| Reference Skill | `starter` | `dynamic` | `enterprise` |

### Level Upgrade Signals

- Starter → Dynamic: "Add login", "Save data", "Admin page"
- Dynamic → Enterprise: "High traffic", "Microservices", "Own server"

### Hierarchical CLAUDE.md Rules

```
project/
├── CLAUDE.md                 # Project-wide (always reference)
├── services/CLAUDE.md        # Backend work context
├── frontend/CLAUDE.md        # Frontend work context
└── infra/CLAUDE.md           # Infrastructure context
```

Rule: Area-specific rules > Project-wide rules

---

## 3. Agent Auto-Trigger Rules

### Level-Based Selection

When user requests feature development:
1. Detect project level
2. Invoke appropriate agent automatically

### Task-Based Selection

| User Intent | Auto-Invoke Agent |
|-------------|-------------------|
| "code review", "security scan" | `bkit:code-analyzer` |
| "design review", "spec check" | `bkit:design-validator` |
| "gap analysis" | `bkit:gap-detector` |
| "report", "summary" | `bkit:report-generator` |
| "QA", "log analysis" | `bkit:qa-monitor` |
| "pipeline", "which phase" | `bkit:pipeline-guide` |

### Proactive Suggestions

After completing major tasks, suggest relevant agents.

### Do NOT Auto-Invoke When

- User explicitly declines
- Task is trivial
- User wants to understand process
- Agent already invoked for same task

---

## 4. Code Quality Standards

### Pre-coding Checks

1. Does similar functionality exist? Search first
2. Check utils/, hooks/, components/ui/
3. Reuse if exists; create if not

### Core Principles

**DRY**: Extract to common function on 2nd use
**SRP**: One function, one responsibility
**No Hardcoding**: Use meaningful constants
**Extensibility**: Write in generalized patterns

### Self-Check After Coding

- Same logic exists elsewhere?
- Can function be reused?
- Hardcoded values present?
- Function does only one thing?

### When to Refactor

- Same code appears 2nd time
- Function exceeds 20 lines
- if-else nests 3+ levels
- Same parameters passed to multiple functions

---

## 5. Task Classification

Classify tasks to apply appropriate PDCA level:

| Classification | Content Size | PDCA Level | Action |
|----------------|--------------|------------|--------|
| Quick Fix | < 50 chars | None | Execute immediately |
| Minor Change | 50-200 chars | Lite | Show summary, proceed |
| Feature | 200-1000 chars | Standard | Check/create design doc |
| Major Feature | > 1000 chars | Strict | Require design, user confirmation |

### Classification Keywords

**Quick Fix**: fix, typo, correct, adjust, tweak
**Minor Change**: improve, refactor, enhance, optimize, update
**Feature**: add, create, implement, build, new feature
**Major Feature**: redesign, migrate, architecture, overhaul, rewrite

---

## 6. Output Style Auto-Selection (v1.5.1)

When project level is detected, automatically suggest the matching output style:

| Level | Suggested Style | Trigger Condition |
|-------|-----------------|-------------------|
| Starter | `bkit-learning` | Level detected as Starter |
| Dynamic | `bkit-pdca-guide` | Level detected as Dynamic |
| Enterprise | `bkit-enterprise` | Level detected as Enterprise |

### Auto-Selection Rules

- On session start: Suggest output style matching detected level
- On `/starter init`, `/dynamic init`, `/enterprise init`: Auto-suggest style for that level
- On PDCA phase transitions: Suggest `bkit-pdca-guide` if not already active
- User can override with `/output-style` at any time

### Available Output Styles

| Style | Best For | Key Features |
|-------|----------|-------------|
| `bkit-learning` | Beginners, learning | Learning points, TODO(learner) markers, concept explanations |
| `bkit-pdca-guide` | PDCA workflows | Status badges, checklists, phase progress, gap analysis suggestions |
| `bkit-enterprise` | Architecture decisions | Tradeoff analysis, cost impact, deployment strategy, SOLID compliance |

---

## 7. Agent Teams Auto-Suggestion (v1.5.1)

Suggest Agent Teams when conditions are met:

### Suggestion Triggers

| Condition | Suggestion |
|-----------|-----------|
| Major Feature (>= 1000 chars) AND Dynamic/Enterprise level | "Agent Teams can parallelize PDCA phases. Try `/pdca team {feature}`" |
| Match Rate < 70% AND Dynamic/Enterprise level | "Consider Agent Teams for faster parallel Check-Act iteration" |
| Enterprise project init | "Your project supports 4-teammate Agent Teams mode" |
| Dynamic project init | "Your project supports 2-teammate Agent Teams mode" |

### Team Availability

| Level | Available | Teammates | Roles |
|-------|:---------:|:---------:|-------|
| Starter | No | - | - |
| Dynamic | Yes | 2 | developer, qa |
| Enterprise | Yes | 4 | architect, developer, qa, reviewer |

### Requirements

- Environment: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
- If env var not set: Suggest setting it when team mode would be beneficial
- Command: `/pdca team {feature}` to start team mode

---

## 8. Agent Memory Awareness (v1.5.1)

Agent Memory is automatically active for all bkit agents. No user action required.

### How It Works

- Agents remember project context across sessions via `memory: project` scope
- Some agents (`starter-guide`, `pipeline-guide`) use `memory: user` for cross-project learning
- Memory persists in `.claude/agent-memory/` (project) or `~/.claude/agent-memory/` (user)

### Memory Scopes

| Scope | Agents Using | Persistence |
|-------|-------------|-------------|
| `project` | 9 agents (code-analyzer, gap-detector, pdca-iterator, etc.) | Per-project, across sessions |
| `user` | 2 agents (starter-guide, pipeline-guide) | Global, across all projects |

### Proactive Mention

- On session start: "Agent Memory is active — agents remember context across sessions"
- When agent is invoked: Agent may reference previous session context
- No configuration needed — fully automatic
