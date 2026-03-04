# bkit v1.5.9 Comprehensive Test Design

> **Summary**: bkit v1.5.9 comprehensive test execution design — 989 TC execution methods, verification criteria, CTO Team parallelization, InstructionsLoaded/agent_id/continue:false verification matrices
>
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.9-comprehensive-test.plan.md
> **Version**: 1.5.9
> **Author**: CTO Team
> **Date**: 2026-03-04
> **Status**: Draft

---

## 1. Test Architecture

### 1.1 Execution Strategy

All 989 TC are executed in parallel by 5 QA agents under CTO Lead coordination. Each agent has an independent TC scope and runs from the same project root directory. v1.5.9 adds 69 TC over v1.5.8 (920 → 989), primarily covering InstructionsLoaded handler, agent_id/agent_type field prioritization, continue:false CTO Team auto-termination, and Analysis Triad agent frontmatter.

**Test Methods:**
- **Grep**: File content pattern matching (`Grep` tool)
- **Read + Parse**: File reading + structure verification
- **Node Require**: `require()` module loading + export verification
- **Logic Trace**: Code path analysis + conditional coverage
- **File Exists**: File/directory existence check (`Glob` tool)
- **JSON Validate**: `JSON.parse()` + schema verification
- **Syntax Check**: `node -c` pass verification
- **Frontmatter Parse**: YAML frontmatter extraction + field check
- **Workflow Simulation**: PDCA cycle, user journey simulation (SKIP possible)

### 1.2 Test Categories and Agent Assignment

| Category | TC Count | Primary Method | Agent |
|----------|:--------:|----------------|:-----:|
| TC-V159 (v1.5.9 Changes) | 90 | Grep + Logic Trace + Syntax Check | qa-hooks |
| TC-CC (CC Compatibility) | 25 | Grep + JSON Validate | qa-hooks |
| TC-UNIT-HOOKS (Hook Scripts) | 30 | Node Require + Logic Trace | qa-hooks |
| TC-AG (Agent Functional) | 85 | Read + Frontmatter Parse | qa-agents |
| TC-V159-AF (Agent Frontmatter) | 15 | Frontmatter Parse + Grep | qa-agents |
| TC-UNIT-LIB (Library Modules) | 120 | Node Require + Logic Trace | qa-integration |
| TC-HK (Hook Integration) | 70 | Read + Grep + JSON Parse | qa-integration |
| TC-PDCA (PDCA Workflow) | 40 | File Exists + Grep + Logic Trace | qa-integration |
| TC-E2E (End-to-End) | 65 | Workflow Simulation (SKIP possible) | qa-integration |
| TC-SK (Skill Functional) | 90 | Read + Grep (frontmatter + content) | qa-ux |
| TC-UX (UX Experience) | 65 | Content Verification + Simulation | qa-ux |
| TC-LANG (Multi-Language) | 35 | Function Invocation + Regex | qa-ux |
| TC-UNIT-SCRIPTS (Remaining) | 65 | Node Require + Logic Trace | qa-ux |
| TC-CFG (Config & Template) | 25 | JSON Parse + File Exists | qa-regression |
| TC-TEAM (CTO Team) | 35 | Require + Logic Trace | qa-regression |
| TC-EDGE (Edge Case) | 30 | Edge Case Analysis + Logic | qa-regression |
| TC-SEC (Security) | 20 | Security Pattern Analysis | qa-regression |
| TC-REG (Regression) | 25 | Re-verification + Audit | qa-regression |
| Buffer | 49 | Various (reserved for discovered TC) | Any |

### 1.3 Key Design Decisions

1. **InstructionsLoaded handler**: Static code analysis only (handler never fires without CC v2.1.64+ dispatching the event). Verification via Grep, Syntax Check, Logic Trace.
2. **agent_id priority chain**: Verify line order in 4 handlers — `agent_id` must appear before existing fallback. No runtime execution needed.
3. **continue:false safety**: Verify both conditions (primary completed + all features completed) AND the safety guard (shouldContinue=true on exception).
4. **Agent frontmatter**: Parse YAML between `---` delimiters, verify exact field presence and values. background:true is boolean, not string.
5. **Export count verification**: Automated Grep for exact comment strings "PDCA Module (56 exports)", "Status (19 exports)", "Automation (13 exports)".
6. **Version sync**: 5 locations must show "1.5.9": bkit.config.json, plugin.json, hooks.json description, session-start.js header, session-start.js systemMessage.
7. **Backward compatibility**: All v1.5.9 features must degrade gracefully on CC v2.1.63 — agent_id=undefined falls back, continue:false ignored, InstructionsLoaded never fires.

### 1.4 SKIP Categories

| SKIP Reason | Estimated Count | Examples |
|-------------|:--------------:|---------|
| Runtime-only (requires live Claude Code session) | ~35 | E2E workflows, PDCA phase transitions |
| Environment dependency (Agent Teams env var) | ~12 | TEAM-17~22 subset |
| External service (bkend MCP) | ~5 | bkend skill live tests |
| Runtime timeout verification | ~3 | EDGE-01~06 subset |
| CC version-specific (requires v2.1.63 instance) | ~5 | CC-01, CC-07 |
| **Estimated Total SKIP** | **~60** | |

---

## 2. Reference Tables

### 2.1 Agent Reference (16 agents) — v1.5.9 Updated

| # | Agent | Model | Mode | Memory | background | context | mergeResult |
|:-:|-------|:-----:|:----:|:------:|:----------:|:-------:|:-----------:|
| 1 | cto-lead | opus | acceptEdits | project | — | — | — |
| 2 | code-analyzer | opus | plan | project | **true** | **fork** | **false** |
| 3 | design-validator | opus | plan | project | **true** | fork | false |
| 4 | gap-detector | opus | plan | project | **true** | fork | false |
| 5 | enterprise-expert | opus | acceptEdits | project | — | — | — |
| 6 | infra-architect | opus | acceptEdits | project | — | — | — |
| 7 | security-architect | opus | plan | project | **true** | — | — |
| 8 | bkend-expert | sonnet | acceptEdits | project | — | — | — |
| 9 | frontend-architect | sonnet | acceptEdits | project | — | — | — |
| 10 | pdca-iterator | sonnet | acceptEdits | project | — | — | — |
| 11 | pipeline-guide | sonnet | plan | user | — | — | — |
| 12 | product-manager | sonnet | plan | project | — | — | — |
| 13 | qa-strategist | sonnet | plan | project | — | — | — |
| 14 | starter-guide | sonnet | acceptEdits | user | — | — | — |
| 15 | report-generator | haiku | acceptEdits | project | **true** | — | — |
| 16 | qa-monitor | haiku | acceptEdits | project | — | — | — |

**Distribution**: 7 opus / 7 sonnet / 2 haiku
**v1.5.9 Changes**: 5 agents with `background: true`, 1 agent (code-analyzer) with `context: fork` + `mergeResult: false` added
**Analysis Triad**: gap-detector + design-validator + code-analyzer (all 3 now have background + fork + mergeResult)

### 2.2 Hook Registry Reference (11 events, 14 entries) — v1.5.9

| # | Event | Matcher | Script | Timeout | Delta |
|:-:|-------|---------|--------|:-------:|:-----:|
| 1 | SessionStart | — | hooks/session-start.js | 5000ms | — |
| 2 | **InstructionsLoaded** | — | **scripts/instructions-loaded-handler.js** | **3000ms** | **NEW** |
| 3 | PreToolUse | `Write\|Edit` | scripts/pre-write.js | 5000ms | — |
| 4 | PreToolUse | `Bash` | scripts/unified-bash-pre.js | 5000ms | — |
| 5 | PostToolUse | `Write` | scripts/unified-write-post.js | 5000ms | — |
| 6 | PostToolUse | `Bash` | scripts/unified-bash-post.js | 5000ms | — |
| 7 | PostToolUse | `Skill` | scripts/skill-post.js | 5000ms | — |
| 8 | Stop | — | scripts/unified-stop.js | 10000ms | — |
| 9 | UserPromptSubmit | — | scripts/user-prompt-handler.js | 3000ms | — |
| 10 | PreCompact | `auto\|manual` | scripts/context-compaction.js | 5000ms | — |
| 11 | TaskCompleted | — | scripts/pdca-task-completed.js | 5000ms | — |
| 12 | SubagentStart | — | scripts/subagent-start-handler.js | 5000ms | — |
| 13 | SubagentStop | — | scripts/subagent-stop-handler.js | 5000ms | — |
| 14 | TeammateIdle | — | scripts/team-idle-handler.js | 5000ms | — |

### 2.3 v1.5.9 Changed Files Map

| File | TC Coverage | Agent |
|------|:----------:|:-----:|
| scripts/instructions-loaded-handler.js | V159-01~20, UNIT-HK-01~05 | qa-hooks |
| hooks/hooks.json | V159-21~30 | qa-hooks |
| scripts/subagent-start-handler.js | V159-31~35, UNIT-HK-06~10 | qa-hooks |
| scripts/subagent-stop-handler.js | V159-36~40, UNIT-HK-11~14 | qa-hooks |
| scripts/team-idle-handler.js | V159-41~45, V159-51~58, UNIT-HK-15~19 | qa-hooks |
| scripts/pdca-task-completed.js | V159-46~48, V159-59~70, UNIT-HK-20~24 | qa-hooks |
| hooks/session-start.js | CC-15~23 | qa-hooks |
| README.md | CC-13~14 | qa-hooks |
| scripts/unified-write-post.js | CC-24 | qa-hooks |
| agents/gap-detector.md | V159-71~73 | qa-agents |
| agents/design-validator.md | V159-74~76 | qa-agents |
| agents/code-analyzer.md | V159-77~79 | qa-agents |
| agents/security-architect.md | V159-80 | qa-agents |
| agents/report-generator.md | V159-81 | qa-agents |
| bkit.config.json | V159-86 | qa-regression |
| .claude-plugin/plugin.json | V159-87 | qa-regression |
| lib/common.js | CC-25 | qa-integration |
| lib/pdca/index.js | CC-25 | qa-integration |

---

## 3. Detailed Verification Specifications

### 3.1 TC-V159: v1.5.9 New Changes (90 TC)

#### 3.1.1 InstructionsLoaded Handler (V159-01~20)

**Verification Method**: Grep + Read + node -c

```
V159-01: Glob("scripts/instructions-loaded-handler.js") → file exists
V159-02: Bash("node -c scripts/instructions-loaded-handler.js") → exit 0
V159-03: Grep("require.*common\\.js", path="scripts/instructions-loaded-handler.js") → match readStdinSync, debugLog, outputAllow, getPdcaStatusFull
V159-04: Grep("endsWith.*CLAUDE\\.md", path="scripts/instructions-loaded-handler.js") → match '/'
V159-05: Grep("endsWith.*CLAUDE\\.md", path="scripts/instructions-loaded-handler.js") → match '\\'
V159-06: Read(instructions-loaded-handler.js) → outputAllow called when !isCLAUDEMD
V159-07: Logic: filePath ending .claude/rules/foo.md → isCLAUDEMD=false → pass through
V159-08: Logic: filePath ending CLAUDE.md → PDCA status injection block
V159-09: Grep("bkit v1\\.5\\.9 active", path="scripts/instructions-loaded-handler.js") → match
V159-10: Grep("primaryFeature", path="scripts/instructions-loaded-handler.js") → extracted from pdcaStatus
V159-11: Logic: primaryFeature exists → currentPhase included in additionalContext
V159-12: Logic: matchRate !== null check before inclusion
V159-13: Logic: activeCount > 1 → feature count in additionalContext
V159-14: Grep("agent_id", path="scripts/instructions-loaded-handler.js") → agentId extracted
V159-15: Logic: hookContext.agent_id absent → agentId=null (no crash)
V159-16: Logic: getPdcaStatusFull throw → catch → fallback context "bkit v1.5.9 active"
V159-17: Grep("InstructionsLoaded", path="scripts/instructions-loaded-handler.js") → in hookSpecificOutput
V159-18: Grep("hookSpecificOutput", path="scripts/instructions-loaded-handler.js") → has filePath, agentId, agentType
V159-19: Grep("JSON\\.stringify", path="scripts/instructions-loaded-handler.js") → console.log output
V159-20: Grep("process\\.exit\\(0\\)", path="scripts/instructions-loaded-handler.js") → present
```

#### 3.1.2 hooks.json Registration (V159-21~30)

**Verification Method**: JSON Parse + Grep

```
V159-21: Bash("node -e \"JSON.parse(require('fs').readFileSync('hooks/hooks.json'))\"") → exit 0
V159-22: Grep("InstructionsLoaded", path="hooks/hooks.json") → key exists
V159-23: Grep("\"type\".*\"command\"", path="hooks/hooks.json") → in InstructionsLoaded block
V159-24: Grep("instructions-loaded-handler\\.js", path="hooks/hooks.json") → command path
V159-25: Grep("\"timeout\".*3000", path="hooks/hooks.json") → InstructionsLoaded timeout
V159-26: Read(hooks.json) + count top-level keys → 11 events
V159-27: Grep("v1\\.5\\.9", path="hooks/hooks.json") → in description
V159-28: Read(hooks.json) → all 14 command paths end with .js file
V159-29: Grep("CLAUDE_PLUGIN_ROOT", path="hooks/hooks.json") → all commands use ${CLAUDE_PLUGIN_ROOT}
V159-30: Read(hooks.json) → all timeout values are positive integers
```

#### 3.1.3 agent_id/agent_type Refactoring (V159-31~50)

**Verification Method**: Grep + Logic Trace

```
V159-31: Grep("agent_id.*null", path="scripts/subagent-start-handler.js") → match
V159-32: Read(subagent-start-handler.js) → agentId line BEFORE agent_name fallback
V159-33: Grep("agent_name|tool_input\\.name|unknown", path="scripts/subagent-start-handler.js") → fallback chain
V159-34: Grep("hookSpecificOutput.*agentId", path="scripts/subagent-start-handler.js") → present
V159-35: Logic: hookContext without agent_id → agentId=null, agentName from fallback
V159-36: Grep("agent_id.*null", path="scripts/subagent-stop-handler.js") → match
V159-37: Grep("agent_type.*null", path="scripts/subagent-stop-handler.js") → match
V159-38: Read(subagent-stop-handler.js) → agentId before existing agentName logic
V159-39: Grep("hookSpecificOutput.*agentId.*agentType", path="scripts/subagent-stop-handler.js", multiline) → both
V159-40: Grep("agent_name|unknown", path="scripts/subagent-stop-handler.js") → fallback preserved
V159-41: Grep("agent_id.*null", path="scripts/team-idle-handler.js") → match
V159-42: Grep("agent_type.*null", path="scripts/team-idle-handler.js") → match
V159-43: Read(team-idle-handler.js) → agentId used as first priority for teammateId
V159-44: Grep("hookSpecificOutput.*agentId.*agentType", path="scripts/team-idle-handler.js", multiline) → both
V159-45: Grep("teammate_id|unknown", path="scripts/team-idle-handler.js") → fallback preserved
V159-46: Grep("agent_id.*null", path="scripts/pdca-task-completed.js") → match
V159-47: Grep("agent_type.*null", path="scripts/pdca-task-completed.js") → match
V159-48: Grep("hookSpecificOutput.*agentId.*agentType", path="scripts/pdca-task-completed.js", multiline) → both
V159-49: Read(all 4 files) → agent_id extraction before existing logic (line order)
V159-50: Grep("v1\\.5\\.9|1\\.5\\.9", path=each of 4 files) → version reference present
```

#### 3.1.4 continue:false Logic (V159-51~70)

**Verification Method**: Logic Trace + Grep

```
V159-51: Grep("shouldContinue.*=.*true", path="scripts/team-idle-handler.js") → initial value
V159-52: Logic: primaryFeature phase=completed → shouldContinue=false (Grep "completed")
V159-53: Logic: primaryFeature phase=archived → shouldContinue=false (Grep "archived")
V159-54: Logic: all activeFeatures completed + no nextTask → shouldContinue=false
V159-55: Logic: feature phase=do → shouldContinue remains true
V159-56: Grep("catch|shouldContinue.*=.*true", path="scripts/team-idle-handler.js") → safety guard
V159-57: Grep("continue.*shouldContinue", path="scripts/team-idle-handler.js") → in hookSpecificOutput
V159-58: Grep("debugLog.*continue.*false", path="scripts/team-idle-handler.js") → log on false
V159-59: Grep("shouldContinue.*=.*true", path="scripts/pdca-task-completed.js") → initial value
V159-60: Logic: report phase detected → shouldContinue=false (Grep "report")
V159-61: Logic: feature phase=completed → shouldContinue=false
V159-62: Logic: feature phase=archived → shouldContinue=false
V159-63: Logic: phase=do → shouldContinue remains true
V159-64: Grep("catch|shouldContinue.*=.*true", path="scripts/pdca-task-completed.js") → safety guard
V159-65: Grep("continue.*shouldContinue", path="scripts/pdca-task-completed.js") → in hookSpecificOutput
V159-66: Read(pdca-task-completed.js) → continue:false only within autoAdvance block
V159-67: Logic: CC v2.1.63 → continue field in output simply ignored (no schema error)
V159-68: Logic: shouldContinue=true → existing behavior unchanged
V159-69: Read(team-idle-handler.js) → Condition 2 only runs when shouldContinue still true (if check)
V159-70: Read(pdca-task-completed.js) → Condition 2 only runs when shouldContinue still true
```

#### 3.1.5 Agent Frontmatter (V159-71~85)

**Verification Method**: Read + Frontmatter Parse

```
V159-71: Grep("background: true", path="agents/gap-detector.md") → match
V159-72: Grep("context: fork", path="agents/gap-detector.md") → match
V159-73: Grep("mergeResult: false", path="agents/gap-detector.md") → match
V159-74: Grep("background: true", path="agents/design-validator.md") → match
V159-75: Grep("context: fork", path="agents/design-validator.md") → match
V159-76: Grep("mergeResult: false", path="agents/design-validator.md") → match
V159-77: Grep("background: true", path="agents/code-analyzer.md") → match
V159-78: Grep("context: fork", path="agents/code-analyzer.md") → match
V159-79: Grep("mergeResult: false", path="agents/code-analyzer.md") → match
V159-80: Grep("background: true", path="agents/security-architect.md") → match
V159-81: Grep("background: true", path="agents/report-generator.md") → match
V159-82: Grep("background: true", path=11 other agents) → NO match (verify unchanged)
V159-83: Read(all 16 agents/*.md) → each starts/ends YAML frontmatter with "---"
V159-84: Grep("model: (opus|sonnet|haiku)", path="agents/*.md") → all 16 match
V159-85: Read(5 updated agents) → background: true positioned in YAML frontmatter block
```

#### 3.1.6 Version Sync (V159-86~90)

**Verification Method**: Grep

```
V159-86: Grep("\"version\".*\"1\\.5\\.9\"", path="bkit.config.json") → match
V159-87: Grep("\"version\".*\"1\\.5\\.9\"", path=".claude-plugin/plugin.json") → match
V159-88: Grep("v1\\.5\\.9", path="hooks/hooks.json") → in description
V159-89: Grep("v1\\.5\\.9|1\\.5\\.9", path="hooks/session-start.js") → in JSDoc header
V159-90: Grep("v1\\.5\\.9", path="hooks/session-start.js") → in systemMessage body
```

### 3.2 TC-CC: CC Compatibility (25 TC)

**Verification Method**: Grep + Logic Trace

All CC compatibility tests verify that v1.5.9 features degrade gracefully when CC v2.1.64+ features are not available.

```
CC-01: Logic: InstructionsLoaded event not dispatched on v2.1.63 → handler never fires → SKIP (runtime)
CC-02: Read(session-start.js) → additionalContext provides full bkit context independently
CC-03: Read(subagent-start-handler.js) → agent_id=undefined → || null → agentName from agent_name fallback
CC-04: Read(subagent-stop-handler.js) → agent_id=undefined → || null → agentName from agent_name fallback
CC-05: Read(team-idle-handler.js) → agent_id=undefined → || null → teammateId from teammate_id fallback
CC-06: Logic: agent_type=undefined → || null → null stored (no TypeError)
CC-07: Logic: continue field in hookSpecificOutput → CC v2.1.63 ignores unknown fields → SKIP (runtime)
CC-08: Read(all 4 handlers) → hookSpecificOutput only adds new fields, no removal
CC-09: Logic: background:true supported since v2.1.49 → 15+ releases of stability
CC-10: Logic: context:fork supported since v2.1.49 → 15+ releases of stability
CC-11: Grep("CLAUDE_PLUGIN_ROOT", path="hooks/hooks.json") → all commands use variable
CC-12: Grep("CLAUDE_SKILL_DIR", path="skills/*/SKILL.md") → 0 matches in imports
CC-13: Grep("v2\\.1\\.66", path="README.md") → CC badge version
CC-14: Grep("code\\.claude\\.com", path="README.md") → documentation URL
CC-15: Grep("v1\\.5\\.9 Enhancements", path="hooks/session-start.js") → section title
CC-16: Grep("InstructionsLoaded", path="hooks/session-start.js") → in v1.5.9 section
CC-17: Grep("agent_id.*agent_type", path="hooks/session-start.js") → in v1.5.9 section
CC-18: Grep("continue.*false", path="hooks/session-start.js") → in v1.5.9 section
CC-19: Grep("CLAUDE_SKILL_DIR", path="hooks/session-start.js") → in v1.5.9 section
CC-20: Grep("reload-plugins", path="hooks/session-start.js") → in v1.5.9 section
CC-21: Grep("code\\.claude\\.com", path="hooks/session-start.js") → in v1.5.9 section
CC-22: Grep("v1\\.5\\.8 Enhancements", path="hooks/session-start.js") → still present
CC-23: Grep("v1\\.5\\.7 Enhancements", path="hooks/session-start.js") → still present
CC-24: Grep("#30586", path="scripts/unified-write-post.js") → monitoring comment
CC-25: Grep("56 exports|19 exports|13 exports", path="lib/common.js") → all 3 match
```

### 3.3 TC-UNIT: Script Unit Tests (215 TC)

#### Execution Method

Each script is loaded via `require()` where possible, or analyzed via Read + Grep for non-exportable scripts. Hook handler scripts that only run via stdin pipe are verified through static analysis.

**TC-UNIT-HOOKS (30 TC)**: See plan Section 3.3 for TC breakdown per handler.
**TC-UNIT-LIB (120 TC)**: Each library module export verified via:
```javascript
const module = require('./lib/{module}');
assert(typeof module.{export} === 'function' || typeof module.{export} === 'object');
```
**TC-UNIT-SCRIPTS (65 TC)**: Remaining scripts verified via Syntax Check + Grep.

### 3.4 TC-HK: Hook Integration (70 TC)

Each hook event verified for:
1. hooks.json registration (event key, matcher, script path, timeout)
2. Script file existence and valid syntax
3. Input parsing (stdin JSON)
4. Output format (JSON to stdout with required fields)
5. Error handling (malformed input → graceful degradation)
6. hookSpecificOutput fields match hook event contract

### 3.5 TC-AG: Agent Functional (85 TC)

Each of 16 agents verified for:
1. File existence at `agents/{name}.md`
2. Valid YAML frontmatter (--- delimiters, required fields)
3. model field (opus/sonnet/haiku)
4. mode field (acceptEdits/plan)
5. Memory scope (project/user)
6. v1.5.9 frontmatter additions (background, context, mergeResult) where applicable
7. Tools list consistency with agent description

### 3.6 TC-SK: Skill Functional (90 TC)

Each of 27 skills verified for:
1. SKILL.md file existence at `skills/{name}/SKILL.md`
2. Valid frontmatter (name, description, imports)
3. User-invocable flag consistency
4. Imports resolve to valid paths
5. No use of ${CLAUDE_SKILL_DIR} in imports (backward compat)

### 3.7 TC-PDCA, TC-E2E, TC-UX, TC-CFG, TC-TEAM, TC-LANG, TC-EDGE, TC-SEC, TC-REG

Detailed TC specifications per plan Section 3.7~3.15. Each follows the same pattern:
- Static verification (Grep, Read, JSON Parse) where possible
- SKIP for runtime-dependent scenarios
- Logic Trace for conditional code paths

---

## 4. CTO Team Specification

### 4.1 Team Composition

| Role | Agent Name | Subagent Type | Model | TC Scope | TC Count |
|------|-----------|:------------:|:-----:|----------|:--------:|
| CTO Lead | main | — | opus | Coordination | — |
| Hook Tester | qa-hooks | code-analyzer | opus | TC-V159 + TC-CC + TC-UNIT-HOOKS | 145 |
| Agent Tester | qa-agents | qa-strategist | sonnet | TC-AG + TC-V159-AF | 100 |
| Integration Tester | qa-integration | gap-detector | opus | TC-UNIT-LIB + TC-HK + TC-PDCA + TC-E2E | 295 |
| UX Tester | qa-ux | product-manager | sonnet | TC-SK + TC-UX + TC-LANG + TC-UNIT-SCRIPTS | 255 |
| Regression Tester | qa-regression | security-architect | opus | TC-CFG + TC-TEAM + TC-EDGE + TC-SEC + TC-REG | 135 |

**Total**: 5 agents + CTO Lead = 6 participants
**TC Distribution**: 145 + 100 + 295 + 255 + 135 = 930 (+ 49 buffer + 10 allocated during execution = 989)

### 4.2 Execution Phases

```
Phase 1 (Parallel):
├── qa-hooks: TC-V159 (90) + TC-CC (25) + TC-UNIT-HOOKS (30) = 145 TC
├── qa-agents: TC-AG (85) + TC-V159-AF (15) = 100 TC
├── qa-ux: TC-SK (90) + TC-LANG (35) = 125 TC (partial)
└── qa-regression: TC-CFG (25) + TC-REG (25) = 50 TC (partial)

Phase 2 (After Phase 1 completes):
├── qa-integration: TC-UNIT-LIB (120) + TC-HK (70) = 190 TC (partial)
├── qa-ux: TC-UX (65) + TC-UNIT-SCRIPTS (65) = 130 TC (remaining)
└── qa-regression: TC-TEAM (35) + TC-EDGE (30) + TC-SEC (20) = 85 TC (remaining)

Phase 3 (Final):
├── qa-integration: TC-PDCA (40) + TC-E2E (65) = 105 TC (remaining)
└── Buffer allocation (49 TC) → distributed to agents with capacity
```

### 4.3 Quality Gates

| Gate | Condition | Action |
|------|-----------|--------|
| G1 | Phase 1 P0 pass rate ≥ 99% | Proceed to Phase 2 |
| G2 | Phase 2 P0+P1 pass rate ≥ 98% | Proceed to Phase 3 |
| G3 | Overall pass rate ≥ 97% (excl. SKIP) | PASS → Report |
| G4 | Any FAIL in TC-V159 | BLOCK → Fix → Re-test |
| G5 | Any FAIL in TC-CC | BLOCK → Fix → Re-test |

### 4.4 Result Format

Each agent reports results in this format:
```
## {Agent Name} Test Results

| Category | Total | PASS | FAIL | SKIP |
|----------|:-----:|:----:|:----:|:----:|
| TC-XXX   | N     | N    | 0    | N    |

### FAIL Details (if any)
| TC ID | Expected | Actual | Root Cause |

### SKIP Details
| TC ID | Reason |

### Summary
- Pass Rate: N/N (XX.X%)
- Critical Issues: N
```

---

## 5. Task Management

### 5.1 Task Structure

```
Task #1: [Test] Phase 1 - Hook Tester (qa-hooks) — 145 TC
Task #2: [Test] Phase 1 - Agent Tester (qa-agents) — 100 TC
Task #3: [Test] Phase 1 - UX Tester Partial (qa-ux) — 125 TC
Task #4: [Test] Phase 1 - Regression Tester Partial (qa-regression) — 50 TC
Task #5: [Test] Phase 2 - Integration Tester Partial (qa-integration) — 190 TC [blockedBy: #1, #2]
Task #6: [Test] Phase 2 - UX Tester Remaining (qa-ux) — 130 TC [blockedBy: #3]
Task #7: [Test] Phase 2 - Regression Tester Remaining (qa-regression) — 85 TC [blockedBy: #4]
Task #8: [Test] Phase 3 - Integration Tester Final (qa-integration) — 105 TC [blockedBy: #5]
Task #9: [Test] Report Consolidation — aggregate all results [blockedBy: #6, #7, #8]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-04 | Initial draft — 989 TC, 5 agents, 3-phase execution |
