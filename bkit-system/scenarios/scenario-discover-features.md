# Scenario: Natural Feature Discovery (v1.5.1)

> How users naturally discover Output Styles, Agent Teams, and Agent Memory

## Scenario 1: Output Style Discovery

### Trigger
User starts a session with a Starter-level project.

### Flow
1. **SessionStart hook fires**
   - Level detected as Starter
   - Output: "Recommended for Starter level: `bkit-learning`"
2. **User runs `/starter init my-portfolio`**
   - Skill displays: "For the best learning experience, try `/output-style bkit-learning`"
3. **User activates style**
   - Response formatting changes to include learning points
   - User naturally benefits from guided experience

### Expected Outcome
User discovers and activates output style without needing to know the feature exists beforehand.

---

## Scenario 2: Agent Teams Discovery

### Trigger
User creates a Dynamic-level fullstack project and requests a major feature.

### Flow
1. **SessionStart hook fires**
   - Level detected as Dynamic
   - If env var set: "Agent Teams: Dynamic mode available (2 teammates)"
   - If env var not set: "Your Dynamic project supports Agent Teams. To enable: set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`"
2. **User requests major feature** (>= 1000 chars)
   - bkit-rules: "This is a major feature. Agent Teams can parallelize PDCA phases."
3. **User starts team mode**: `/pdca team user-auth`
   - 2 teammates assigned (developer, qa)
4. **Parallel execution**: developer implements while qa prepares check

### Expected Outcome
User discovers Agent Teams through contextual suggestion at the right moment.

---

## Scenario 3: Agent Memory Awareness

### Trigger
User starts a second session for the same project.

### Flow
1. **SessionStart hook fires**
   - Output: "Agent Memory auto-active — agents remember context across sessions"
2. **User invokes gap-detector**
   - Agent references patterns from previous session's analysis
3. **User notices improved context**
   - Agent provides more relevant suggestions based on accumulated knowledge

### Expected Outcome
User becomes aware that agents are learning and improving over time.

---

## Discovery Matrix

| Feature | Session Start | Project Init | PDCA Flow | Agent Invocation |
|---------|:------------:|:------------:|:---------:|:----------------:|
| Output Styles | Suggested | Suggested | Suggested | Recommended |
| Agent Teams | Announced | Announced | Suggested | N/A |
| Agent Memory | Mentioned | N/A | N/A | Active |
