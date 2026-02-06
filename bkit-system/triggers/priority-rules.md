# Priority Rules

> Priority and conflict resolution rules when multiple triggers fire simultaneously

## Hook Execution Order

Claude Code **executes all hooks** when multiple hooks match simultaneously.
Order follows definition order (alphabetical file order or frontmatter definition order).

### PreToolUse Execution Order (Write|Edit)

```
1. bkit-rules → pre-write.js (PDCA check + task classification)
2. phase-2-convention → phase2-convention-pre.js
3. (When specific agent is active) design-validator, code-analyzer
```

**Result Merging**: Each hook's `additionalContext` is passed to Claude.

### Block Priority

When `"decision": "block"` is returned, execution **stops immediately**.

| Script | Block Condition |
|--------|-----------------|
| `qa-pre-bash.js` | Destructive commands (rm -rf, DROP TABLE, etc.) |
| `code-analyzer` agent | Write/Edit attempt (read-only agent) |

---

## Skill Activation Priority

### Auto-Activation Conditions

Skills are activated under these conditions:

1. **Explicit invocation**: `/skill-name` or Skill tool usage
2. **Keyword matching**: User message contains Triggers keywords
3. **File context**: Working file path is related to skill

### Priority on Conflict

When multiple skills match simultaneously:

```
1. Explicit invocation > Keyword matching > File context
2. More specific skill > General skill
   Example: phase-4-api > bkit-rules (during API work)
3. Level skill always applies
   One of starter/dynamic/enterprise is always active
```

---

## Agent Auto-Invoke Rules

### Invoke Conditions (auto-trigger-agents.md)

| Condition | Agent Invoked |
|-----------|---------------|
| Level = Starter + coding task | starter-guide |
| Level = Dynamic + backend task | bkend-expert |
| Level = Enterprise + architecture decision | enterprise-expert |
| Level = Enterprise + infrastructure task | infra-architect |
| Keywords "code review", "security scan" | code-analyzer |
| Keyword "gap analysis" | gap-detector |
| Keywords "QA", "test", "log analysis" | qa-monitor |
| Keywords "report", "summary" | report-generator |

### Do Not Invoke Conditions

- User explicitly refuses
- Task is trivial (single file modification, minor fix)
- Agent already invoked for same task

---

## Skills vs Hooks

| Aspect | Skills | Hooks |
|--------|--------|-------|
| Location | skills/*/SKILL.md | skill/agent frontmatter or hooks.json |
| Application | Claude reads and judges | System auto-executes |
| Enforcement | Soft (Claude's discretion) | Hard (always executes) |
| Priority | Lower than Hooks | Higher than Skills |

### Recommended Usage

- **Skills**: General guidelines, style rules, domain knowledge
- **Hooks**: Validations, blocks, notifications that must execute

---

## Conflict Resolution Examples

### Example 1: Write + Multiple Hooks

```
Situation: Write to src/features/auth/login.ts file

Fired:
1. pre-write.js → "Check design doc for auth feature" + "Feature size, PDCA recommended"
2. phase-2-convention → "TypeScript convention reminder"

Result: Both additionalContext messages passed to Claude
Claude synthesizes and guides user
```

### Example 2: Block Occurs

```
Situation: Execute rm -rf /tmp/* command (during QA)

Fired:
1. qa-pre-bash.js → Detects destructive pattern
2. Returns "decision": "block"

Result: Command execution blocked, reason provided
```

### Example 3: Skill + Agent Simultaneous Activation

```
Situation: "Design the API"

Fired:
1. phase-4-api skill activates (keyword: "API design")
2. Skill's agent: qa-monitor connected
3. (Based on Level) bkend-expert or infra-architect may be added

Result: phase-4-api skill context + appropriate agent combination
```

---

## Recommendations

### When Adding New Hooks

1. Record in [[trigger-matrix]] first
2. Check for conflicts with existing hooks
3. Default to `decision: "allow"`, minimize blocks
4. Provide guidance via `additionalContext`

### When Adding New Skills

1. Verify Triggers keywords don't overlap with existing skills
2. Specify connected Agent
3. Update [[trigger-matrix]] when defining hooks

---

## Related Documents

- [[trigger-matrix]] - Full trigger matrix
- [[../components/hooks/_hooks-overview]] - Hook event details
- [[../_GRAPH-INDEX]] - Full index

---

## v1.5.1 Feature Priority

### Output Style Priority

Output styles are suggestions, not requirements:
- Level-based auto-suggestion is a recommendation
- User can override with `/output-style` at any time
- Explicit user choice > Auto-suggestion

### Agent Teams Priority

Agent Teams is opt-in:
- Requires explicit environment variable
- Requires explicit `/pdca team` command
- Never auto-activates without user consent

### Agent Memory Priority

Agent Memory is always-on:
- No opt-out mechanism (by design)
- Memory scopes determined by agent configuration
- Project scope > User scope for overlapping data
