---
name: bkit-rules
description: |
  Core rules for bkit plugin. PDCA methodology, level detection, agent auto-triggering, and code quality standards.
  These rules are automatically applied to ensure consistent AI-native development.
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
2. File structure based detection:

| Conditions | Level |
|-----------|-------|
| infra/terraform/, services/, docker-compose.yml (2+) | Enterprise |
| .mcp.json with bkend, lib/bkend/, supabase/ | Dynamic |
| None of above | Starter |

### Level-specific Behavior

| Level | Style | Agent | Skills |
|-------|-------|-------|--------|
| Starter | Friendly, detailed | `starter-guide` | `starter` |
| Dynamic | Technical, clear | `bkend-expert` | `dynamic` |
| Enterprise | Concise, expert | `enterprise-expert` | `enterprise` |

---

## 3. Agent Auto-Trigger Rules

### Level-Based Selection

When user requests feature development:
1. Detect project level
2. Invoke appropriate agent automatically

### Task-Based Selection

| User Intent | Auto-Invoke Agent |
|-------------|-------------------|
| "code review", "security scan" | `code-analyzer` |
| "design review", "spec check" | `design-validator` |
| "gap analysis" | `gap-detector` |
| "report", "summary" | `report-generator` |
| "QA", "log analysis" | `qa-monitor` |
| "pipeline", "which phase" | `pipeline-guide` |

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
