# bkit v1.5.9 Comprehensive Test Plan

> **Summary**: bkit v1.5.9 comprehensive test — Unit, Integration, E2E, UX, Security, and Regression tests covering all features and v1.5.9 changes (InstructionsLoaded hook, agent_id/agent_type, continue:false, agent frontmatter, CC v2.1.66 compatibility)
>
> **Project**: bkit-claude-code
> **Version**: 1.5.9
> **Author**: CTO Team
> **Date**: 2026-03-04
> **Status**: Draft
> **Previous Test**: v1.5.8 (920 TC planned)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, Claude Code v2.1.63+
> **Branch**: feature/bkit-v1.5.9-cc-v2166-enhancement

---

## 1. Background

### 1.1 Test Necessity

bkit v1.5.9 integrates CC v2.1.64~v2.1.66 features into bkit's hook system, agent infrastructure, and documentation. Key changes include the 11th hook event (InstructionsLoaded), agent_id/agent_type field prioritization across 4 hook handlers, continue:false for CTO Team auto-termination, and background:true/context:fork for the Analysis Triad agents. All changes are designed with graceful degradation for CC v2.1.63 backward compatibility. This test plan covers:

1. **v1.5.9 new changes** (18 files, 25 FRs, 12 ENH items)
2. **Hook system verification** (11 events, new InstructionsLoaded handler)
3. **Full bkit feature inventory** (27 skills, 16 agents, 11 hooks, 46 scripts, 190 common.js exports)
4. **Unit tests** for all testable functions and library modules
5. **Integration tests** for hook chains, agent pipelines, PDCA workflow
6. **E2E tests** for complete user workflows
7. **UX tests** for user experience quality across all user personas
8. **CC compatibility** backward/forward compatibility (v2.1.63 fallback, v2.1.64+ enhanced)
9. **Regression** against v1.5.8 baseline

| Change Category | v1.5.9 Delta from v1.5.8 |
|----------------|--------------------------|
| Skills count | 27 (unchanged) |
| Agents count | 16 (unchanged, 6 frontmatter updated) |
| Hook events | **11** (+1 InstructionsLoaded from 10) |
| Scripts | **46** (+1 new: instructions-loaded-handler.js) |
| common.js exports | 190 (unchanged count, 3 comment staleness fixes) |
| Templates | 16 (unchanged) |
| Output Styles | 4 (unchanged) |
| Config files | 2 (version bump only) |
| Code changes | 18 files (1 new + 17 modified), +148/-24 lines |
| Key additions | InstructionsLoaded hook, agent_id priority, continue:false, background:true×5, context:fork×1 |

### 1.2 Previous Test Baseline (v1.5.8)

| Metric | Value |
|--------|:-----:|
| Total TC Planned | 920 |
| Hook Events Tested | 10 |
| Scripts Tested | 45 |
| common.js Exports Tested | 184 |
| Agents Tested | 16 |
| Skills Tested | 27 |

### 1.3 v1.5.9 Component Inventory

| Component | Count | Location | Delta from v1.5.8 |
|-----------|:-----:|----------|:------------------:|
| Skills | 27 (22 core + 5 bkend) | `skills/*/SKILL.md` | 0 |
| Agents | 16 | `agents/*.md` | 0 (6 frontmatter changes) |
| Hook Events | **11** | `hooks/hooks.json` | **+1** (InstructionsLoaded) |
| Scripts | **46** | `scripts/*.js` | **+1** (instructions-loaded-handler.js) |
| Library Modules | 39 | `lib/**/*.js` | 0 |
| Library Exports (common.js) | **190** | `lib/common.js` | 0 count (3 comment fixes) |
| Templates | 16 | `templates/` | 0 |
| Output Styles | 4 | `output-styles/` | 0 |
| Config Files | 2 | `plugin.json`, `bkit.config.json` | 0 (2 version bumps) |

### 1.4 v1.5.9 Changed Files (18 files, +148/-24 lines)

| # | File | Change Type | ENH | Lines Changed |
|---|------|:-----------:|:---:|:------------:|
| 1 | `scripts/instructions-loaded-handler.js` | **New** | ENH-60 | +91 |
| 2 | `hooks/hooks.json` | Modified | ENH-60 | +13/-1 (InstructionsLoaded + v1.5.9 desc) |
| 3 | `scripts/subagent-start-handler.js` | Modified | ENH-62 | +7/-2 (agent_id priority) |
| 4 | `scripts/subagent-stop-handler.js` | Modified | ENH-62 | +9/-2 (agent_id + agent_type) |
| 5 | `scripts/team-idle-handler.js` | Modified | ENH-62+63 | +42/-2 (agent_id + continue:false) |
| 6 | `scripts/pdca-task-completed.js` | Modified | ENH-62+63 | +30 (agent_id + continue:false) |
| 7 | `hooks/session-start.js` | Modified | ENH-64~68 | +43/-8 (v1.5.9 section + version strings) |
| 8 | `README.md` | Modified | ENH-68 | +4/-2 (CC v2.1.66+ badge + URL) |
| 9 | `scripts/unified-write-post.js` | Modified | ENH-67 | +5 (#30586 monitoring comment) |
| 10 | `agents/gap-detector.md` | Modified | ENH-69 | +1 (background:true) |
| 11 | `agents/design-validator.md` | Modified | ENH-69 | +1 (background:true) |
| 12 | `agents/code-analyzer.md` | Modified | ENH-69+70 | +3 (background:true + context:fork + mergeResult:false) |
| 13 | `agents/security-architect.md` | Modified | ENH-69 | +1 (background:true) |
| 14 | `agents/report-generator.md` | Modified | ENH-69 | +1 (background:true) |
| 15 | `bkit.config.json` | Modified | — | +1/-1 (version 1.5.9) |
| 16 | `.claude-plugin/plugin.json` | Modified | — | +1/-1 (version 1.5.9) |
| 17 | `lib/common.js` | Modified | — | +3/-3 (export count comments) |
| 18 | `lib/pdca/index.js` | Modified | — | +1/-1 (export count comment) |

### 1.5 CTO Team Composition

| Role | Agent | Model | Responsibility |
|------|-------|:-----:|---------------|
| **CTO Lead** | team-lead (main) | opus | Overall coordination, quality gates |
| Hook Tester | code-analyzer | opus | Hook handler unit tests, InstructionsLoaded verification |
| Agent Tester | qa-strategist | sonnet | Agent frontmatter, background:true, context:fork |
| Integration Tester | gap-detector | opus | PDCA workflow, E2E, hook chain integration |
| UX Tester | product-manager | sonnet | UX scenarios, user journeys, multilingual |
| Regression Tester | security-architect | opus | Backward compat, CC v2.1.63 fallback, security |

---

## 2. Goals

### 2.1 Must (P0)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-01 | v1.5.9 New Changes Test | InstructionsLoaded handler, agent_id/agent_type, continue:false, frontmatter | 90 |
| G-02 | CC Compatibility Test | v2.1.63 fallback chain, v2.1.64+ enhanced behavior | 25 |
| G-03 | Script Unit Test | 46 scripts, exported functions, logic paths | 215 |
| G-04 | Hook Integration Test | 11 hook events, chain validation, InstructionsLoaded flow | 70 |
| G-05 | Agent Functional Test | 16 agents: trigger, tools, model, frontmatter, memory scope | 85 |
| G-06 | Skill Functional Test | 27 skills: load, trigger, content, imports | 90 |
| G-07 | PDCA Workflow Test | Plan-Design-Do-Check-Act-Report-Archive-Cleanup | 40 |

### 2.2 Should (P1)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-08 | E2E Workflow Test | 6 complete user workflows including CTO Team with continue:false | 65 |
| G-09 | UX Experience Test | 7 user journeys (Beginner/Dev/QA/Team/v1.5.9/Multilingual/InstructionsLoaded) | 65 |
| G-10 | Config & Template Test | bkit.config.json, 16 templates, output-styles | 25 |
| G-11 | CTO Team Orchestration Test | Team composition, continue:false auto-termination, state-writer | 35 |

### 2.3 Could (P2)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-12 | Multi-Language Test | 8-language triggers + CC_COMMAND_PATTERNS + ambiguity detection | 35 |
| G-13 | Edge Case & Performance | Hook timeout, caching, error handling, fallback chain | 30 |
| G-14 | Security Test | Input validation, hook output injection, agent_id spoofing | 20 |
| G-15 | Regression Test | v1.5.8 baseline + known issues re-check | 25 |

### 2.4 TC Summary

| Priority | TC Count | Ratio |
|:--------:|:--------:|:-----:|
| P0 (Must) | 615 | 62.2% |
| P1 (Should) | 190 | 19.2% |
| P2 (Could) | 110 | 11.1% |
| Regression | 25 | 2.5% |
| Buffer (new discovery) | 49 | 5.0% |
| **Grand Total** | **989** | **100%** |

---

## 3. Test Categories

### 3.1 TC-V159: v1.5.9 New Changes (90 TC)

#### TC-V159-IL: InstructionsLoaded Handler (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-01 | `scripts/instructions-loaded-handler.js` file exists | scripts/ | File exists | P0 |
| V159-02 | Script has valid Node.js syntax | instructions-loaded-handler.js | `node -c` pass | P0 |
| V159-03 | Imports readStdinSync, debugLog, outputAllow, getPdcaStatusFull from common.js | L12-16 | Grep require | P0 |
| V159-04 | CLAUDE.md detection: `filePath.endsWith('/CLAUDE.md')` | L39 | Grep endsWith | P0 |
| V159-05 | CLAUDE.md detection: `filePath.endsWith('\\CLAUDE.md')` (Windows) | L39 | Grep backslash | P0 |
| V159-06 | Non-CLAUDE.md files pass through with `outputAllow` | L41-44 | Logic trace | P0 |
| V159-07 | .claude/rules/*.md files pass through | — | filePath != CLAUDE.md → pass | P0 |
| V159-08 | CLAUDE.md triggers PDCA status injection | L47-68 | Logic trace | P0 |
| V159-09 | additionalContext includes `bkit v1.5.9 active` | L57 | Grep string | P0 |
| V159-10 | primaryFeature extracted from pdcaStatus | L51 | Logic trace | P0 |
| V159-11 | currentPhase included when primaryFeature exists | L53 | Logic trace | P0 |
| V159-12 | matchRate included only when not null | L54-56 | Logic trace | P0 |
| V159-13 | activeCount > 1 shows feature count | L58-60 | Logic trace | P0 |
| V159-14 | agentId included when hookContext.agent_id exists | L62-64 | Logic trace | P0 |
| V159-15 | agentId null when hookContext.agent_id absent (v2.1.63) | L35 | Fallback check | P0 |
| V159-16 | PDCA status read failure → fallback context `bkit v1.5.9 active` | L65-68 | Error path | P0 |
| V159-17 | hookSpecificOutput has hookEventName 'InstructionsLoaded' | L72 | Grep | P0 |
| V159-18 | hookSpecificOutput includes filePath, agentId, agentType | L73-75 | Grep | P0 |
| V159-19 | JSON output via console.log(JSON.stringify) | L80 | Grep | P0 |
| V159-20 | process.exit(0) at end | L81 | Grep | P0 |

#### TC-V159-HJ: hooks.json Registration (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-21 | hooks.json is valid JSON | hooks/hooks.json | JSON.parse success | P0 |
| V159-22 | InstructionsLoaded key exists | hooks.json | Grep InstructionsLoaded | P0 |
| V159-23 | InstructionsLoaded has type "command" | hooks.json | Grep type | P0 |
| V159-24 | InstructionsLoaded command points to instructions-loaded-handler.js | hooks.json | Grep command | P0 |
| V159-25 | InstructionsLoaded timeout is 3000 | hooks.json | Grep timeout | P0 |
| V159-26 | Total hook event count = 11 | hooks.json | Key count | P0 |
| V159-27 | description contains "v1.5.9" | hooks.json:3 | Grep | P0 |
| V159-28 | All 11 hook handlers have valid script paths | hooks.json | Path verification | P0 |
| V159-29 | All hook handlers use `${CLAUDE_PLUGIN_ROOT}` prefix | hooks.json | Grep variable | P0 |
| V159-30 | All hook timeouts are positive integers | hooks.json | Type check | P0 |

#### TC-V159-AID: agent_id/agent_type Refactoring (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-31 | subagent-start: `const agentId = hookContext.agent_id \|\| null` exists | subagent-start-handler.js | Grep | P0 |
| V159-32 | subagent-start: agentName uses agentId as first priority | subagent-start-handler.js | Order check | P0 |
| V159-33 | subagent-start: fallback chain preserved (agent_name → tool_input.name → 'unknown') | subagent-start-handler.js | Logic trace | P0 |
| V159-34 | subagent-start: hookSpecificOutput has agentId field | subagent-start-handler.js | Grep | P0 |
| V159-35 | subagent-start: agentId=null when hookContext.agent_id absent | — | Fallback | P0 |
| V159-36 | subagent-stop: `const agentId = hookContext.agent_id \|\| null` exists | subagent-stop-handler.js | Grep | P0 |
| V159-37 | subagent-stop: `const agentType = hookContext.agent_type \|\| null` exists | subagent-stop-handler.js | Grep | P0 |
| V159-38 | subagent-stop: agentName uses agentId as first priority | subagent-stop-handler.js | Order check | P0 |
| V159-39 | subagent-stop: hookSpecificOutput has agentId and agentType fields | subagent-stop-handler.js | Grep | P0 |
| V159-40 | subagent-stop: fallback chain preserved (agent_name → 'unknown') | subagent-stop-handler.js | Logic trace | P0 |
| V159-41 | team-idle: `const agentId = hookContext.agent_id \|\| null` exists | team-idle-handler.js | Grep | P0 |
| V159-42 | team-idle: `const agentType = hookContext.agent_type \|\| null` exists | team-idle-handler.js | Grep | P0 |
| V159-43 | team-idle: teammateId uses agentId as first priority | team-idle-handler.js | Order check | P0 |
| V159-44 | team-idle: hookSpecificOutput has agentId and agentType fields | team-idle-handler.js | Grep | P0 |
| V159-45 | team-idle: fallback chain preserved (teammate_id → 'unknown') | team-idle-handler.js | Logic trace | P0 |
| V159-46 | pdca-task-completed: `const agentId = hookContext.agent_id \|\| null` exists | pdca-task-completed.js | Grep | P0 |
| V159-47 | pdca-task-completed: `const agentType = hookContext.agent_type \|\| null` exists | pdca-task-completed.js | Grep | P0 |
| V159-48 | pdca-task-completed: hookSpecificOutput has agentId and agentType fields | pdca-task-completed.js | Grep | P0 |
| V159-49 | All 4 handlers: agentId extraction before existing logic (no logic break) | 4 files | Line order | P0 |
| V159-50 | All 4 handlers: v1.5.9 comment present | 4 files | Grep `v1.5.9` | P0 |

#### TC-V159-CF: continue:false Logic (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-51 | team-idle: `let shouldContinue = true` initial value | team-idle-handler.js | Grep | P0 |
| V159-52 | team-idle: Condition 1 — primaryFeature completed → continue:false | team-idle-handler.js | Logic trace | P0 |
| V159-53 | team-idle: Condition 1 — primaryFeature archived → continue:false | team-idle-handler.js | Logic trace | P0 |
| V159-54 | team-idle: Condition 2 — all active features completed + no nextTask → continue:false | team-idle-handler.js | Logic trace | P0 |
| V159-55 | team-idle: Working feature (phase=do) → continue:true preserved | team-idle-handler.js | Logic trace | P0 |
| V159-56 | team-idle: Exception in check → shouldContinue=true (safety) | team-idle-handler.js | Error path | P0 |
| V159-57 | team-idle: hookSpecificOutput has `continue` key | team-idle-handler.js | Grep | P0 |
| V159-58 | team-idle: debugLog called when continue:false set | team-idle-handler.js | Grep debugLog | P0 |
| V159-59 | pdca-task-completed: `let shouldContinue = true` initial value | pdca-task-completed.js | Grep | P0 |
| V159-60 | pdca-task-completed: Condition 1 — report phase → continue:false | pdca-task-completed.js | Logic trace | P0 |
| V159-61 | pdca-task-completed: Condition 2 — feature completed → continue:false | pdca-task-completed.js | Logic trace | P0 |
| V159-62 | pdca-task-completed: Condition 2 — feature archived → continue:false | pdca-task-completed.js | Logic trace | P0 |
| V159-63 | pdca-task-completed: do phase in progress → continue:true preserved | pdca-task-completed.js | Logic trace | P0 |
| V159-64 | pdca-task-completed: Exception in status check → shouldContinue=true (safety) | pdca-task-completed.js | Error path | P0 |
| V159-65 | pdca-task-completed: hookSpecificOutput has `continue` key | pdca-task-completed.js | Grep | P0 |
| V159-66 | pdca-task-completed: continue:false only in autoAdvance response block | pdca-task-completed.js | Scope check | P0 |
| V159-67 | Both handlers: continue:false ignored on CC v2.1.63 (field simply not read) | — | Backward compat | P0 |
| V159-68 | Both handlers: continue:true does not alter existing behavior | — | No regression | P0 |
| V159-69 | team-idle: Condition 2 check runs only when shouldContinue still true | team-idle-handler.js | Logic flow | P0 |
| V159-70 | pdca-task-completed: Condition 2 check runs only when shouldContinue still true | pdca-task-completed.js | Logic flow | P0 |

#### TC-V159-AF: Agent Frontmatter (15 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-71 | gap-detector.md has `background: true` | agents/gap-detector.md | Grep | P0 |
| V159-72 | gap-detector.md retains `context: fork` | agents/gap-detector.md | Grep | P0 |
| V159-73 | gap-detector.md retains `mergeResult: false` | agents/gap-detector.md | Grep | P0 |
| V159-74 | design-validator.md has `background: true` | agents/design-validator.md | Grep | P0 |
| V159-75 | design-validator.md retains `context: fork` | agents/design-validator.md | Grep | P0 |
| V159-76 | design-validator.md retains `mergeResult: false` | agents/design-validator.md | Grep | P0 |
| V159-77 | code-analyzer.md has `background: true` | agents/code-analyzer.md | Grep | P0 |
| V159-78 | code-analyzer.md has `context: fork` (NEW) | agents/code-analyzer.md | Grep | P0 |
| V159-79 | code-analyzer.md has `mergeResult: false` (NEW) | agents/code-analyzer.md | Grep | P0 |
| V159-80 | security-architect.md has `background: true` | agents/security-architect.md | Grep | P0 |
| V159-81 | report-generator.md has `background: true` | agents/report-generator.md | Grep | P0 |
| V159-82 | Other 11 agents NOT modified (no background:true) | 11 agents | Grep absent | P0 |
| V159-83 | All 16 agents have valid YAML frontmatter (--- delimiters) | agents/*.md | Parse check | P0 |
| V159-84 | All 16 agents have model field (opus/sonnet/haiku) | agents/*.md | Grep | P0 |
| V159-85 | background:true positioned before name field in frontmatter | 5 agents | Line order | P1 |

#### TC-V159-VS: Version Sync (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V159-86 | bkit.config.json version = "1.5.9" | bkit.config.json:3 | Grep | P0 |
| V159-87 | plugin.json version = "1.5.9" | .claude-plugin/plugin.json:3 | Grep | P0 |
| V159-88 | hooks.json description contains "v1.5.9" | hooks/hooks.json:3 | Grep | P0 |
| V159-89 | session-start.js JSDoc header contains "v1.5.9" | hooks/session-start.js:3 | Grep | P0 |
| V159-90 | session-start.js systemMessage contains "v1.5.9" | hooks/session-start.js | Grep | P0 |

### 3.2 TC-CC: CC Compatibility Tests (25 TC)

| ID | Test Case | Verification | Priority |
|----|-----------|-------------|:--------:|
| CC-01 | InstructionsLoaded handler: never fires on CC v2.1.63 (event not dispatched) | No handler invocation | P0 |
| CC-02 | SessionStart fallback: bkit context still provided without InstructionsLoaded | session-start.js check | P0 |
| CC-03 | agent_id=undefined on v2.1.63: fallback chain provides agentName | subagent-start logic | P0 |
| CC-04 | agent_id=undefined on v2.1.63: fallback chain provides agentName | subagent-stop logic | P0 |
| CC-05 | agent_id=undefined on v2.1.63: fallback chain provides teammateId | team-idle logic | P0 |
| CC-06 | agent_type=undefined on v2.1.63: null stored (no crash) | All 4 handlers | P0 |
| CC-07 | continue:false field ignored on v2.1.63 (field not read by CC) | hook output check | P0 |
| CC-08 | hookSpecificOutput backward compatible (new fields added, none removed) | All handlers | P0 |
| CC-09 | background:true supported since CC v2.1.49 | Agent spawn test | P0 |
| CC-10 | context:fork supported since CC v2.1.49 | Agent spawn test | P0 |
| CC-11 | ${CLAUDE_PLUGIN_ROOT} resolves correctly in hooks.json | Hook execution | P0 |
| CC-12 | No ${CLAUDE_SKILL_DIR} used in any imports (v2.1.63 compat) | Grep absent | P0 |
| CC-13 | README.md CC badge shows v2.1.66+ | README.md | Grep | P0 |
| CC-14 | README.md URL points to code.claude.com | README.md | Grep | P0 |
| CC-15 | session-start.js v1.5.9 Enhancements section exists | session-start.js | Grep | P0 |
| CC-16 | session-start.js mentions InstructionsLoaded in v1.5.9 section | session-start.js | Grep | P0 |
| CC-17 | session-start.js mentions agent_id/agent_type in v1.5.9 section | session-start.js | Grep | P0 |
| CC-18 | session-start.js mentions continue:false in v1.5.9 section | session-start.js | Grep | P0 |
| CC-19 | session-start.js mentions ${CLAUDE_SKILL_DIR} in v1.5.9 section | session-start.js | Grep | P0 |
| CC-20 | session-start.js mentions /reload-plugins in v1.5.9 section | session-start.js | Grep | P0 |
| CC-21 | session-start.js mentions code.claude.com in v1.5.9 section | session-start.js | Grep | P0 |
| CC-22 | session-start.js v1.5.8 Enhancements section still present | session-start.js | Grep | P0 |
| CC-23 | session-start.js v1.5.7 Enhancements section still present | session-start.js | Grep | P0 |
| CC-24 | unified-write-post.js #30586 monitoring comment present | unified-write-post.js | Grep #30586 | P1 |
| CC-25 | lib/common.js export counts: PDCA 56, Status 19, Automation 13 | lib/common.js | Grep | P0 |

### 3.3 TC-UNIT: Script Unit Tests (215 TC)

#### TC-UNIT-HOOKS: Hook Handler Scripts (30 TC)

| ID | Range | Scope | TC Count |
|----|-------|-------|:--------:|
| UNIT-HK-01~05 | instructions-loaded-handler.js | Main function, JSON parse, CLAUDE.md detection, output format | 5 |
| UNIT-HK-06~10 | subagent-start-handler.js | Agent info extraction, state init, teammate add, output | 5 |
| UNIT-HK-11~14 | subagent-stop-handler.js | Status determination, state update, progress update, output | 4 |
| UNIT-HK-15~19 | team-idle-handler.js | Team mode check, idle handling, continue logic, state write, output | 5 |
| UNIT-HK-20~24 | pdca-task-completed.js | Pattern matching, auto-advance, continue logic, team assign, output | 5 |
| UNIT-HK-25~26 | user-prompt-handler.js | Input parsing, intent detection | 2 |
| UNIT-HK-27~28 | context-compaction.js | Snapshot handling, path resolution | 2 |
| UNIT-HK-29~30 | unified-stop.js | Cleanup logic, state persistence | 2 |

#### TC-UNIT-LIB: Library Module Tests (120 TC)

| Module | File(s) | TC Count |
|--------|---------|:--------:|
| Core (12 exports) | lib/core/*.js | 12 |
| PDCA Tier (8) | lib/pdca/tier.js | 8 |
| PDCA Level (7) | lib/pdca/level.js | 7 |
| PDCA Phase (9) | lib/pdca/phase.js | 9 |
| PDCA Status (19) | lib/pdca/status.js | 19 |
| PDCA Automation (13) | lib/pdca/automation.js | 13 |
| Intent Language (6) | lib/intent/language.js | 6 |
| Intent Trigger (5) | lib/intent/trigger.js | 5 |
| Intent Ambiguity (8) | lib/intent/ambiguity.js | 8 |
| Memory Store | lib/memory-store.js | 5 |
| Team Module | lib/team/*.js | 15 |
| Common.js Bridge | lib/common.js | 13 |

#### TC-UNIT-SCRIPTS: Remaining Script Tests (65 TC)

| Script Category | Scripts | TC Count |
|----------------|:-------:|:--------:|
| Pre-tool hooks | 2 (pre-write, unified-bash-pre) | 8 |
| Post-tool hooks | 3 (unified-write-post, unified-bash-post, skill-post) | 10 |
| Stop scripts | 19 (unified-stop + 18 specific) | 25 |
| Validators | 5 (design-validator-pre, validate-plugin, etc.) | 10 |
| Utilities | 5 (archive-feature, sync-folders, select-template, etc.) | 12 |

### 3.4 TC-HK: Hook Integration Tests (70 TC)

| ID Range | Hook Event | TC Count | Focus |
|----------|-----------|:--------:|-------|
| HK-01~08 | SessionStart | 8 | Init flow, additionalContext, version strings |
| HK-09~14 | InstructionsLoaded | 6 | CLAUDE.md injection, rules pass-through, agent context |
| HK-15~20 | UserPromptSubmit | 6 | Intent detection, PDCA keyword matching |
| HK-21~28 | PreToolUse (Write+Bash) | 8 | PDCA validation, bash guard |
| HK-29~36 | PostToolUse (Write+Bash+Skill) | 8 | State tracking, gap suggestions |
| HK-37~42 | SubagentStart | 6 | Agent state init, teammate registration, agent_id |
| HK-43~48 | SubagentStop | 6 | Status update, progress tracking, agent_id |
| HK-49~56 | TeammateIdle | 8 | Task queue, continue:false, state write |
| HK-57~62 | TaskCompleted | 6 | PDCA auto-advance, continue:false |
| HK-63~66 | Stop | 4 | Cleanup, state persistence |
| HK-67~70 | PreCompact | 4 | Snapshot, context preservation |

### 3.5 TC-AG: Agent Functional Tests (85 TC)

| Agent | TC Count | Focus |
|-------|:--------:|-------|
| cto-lead | 8 | Team composition, delegation, quality gates |
| gap-detector | 7 | Design-impl comparison, background:true, context:fork |
| design-validator | 7 | Document validation, background:true, context:fork |
| code-analyzer | 7 | Code quality analysis, background:true, context:fork (NEW) |
| security-architect | 6 | Vulnerability scan, background:true |
| report-generator | 6 | Report generation, background:true |
| pdca-iterator | 5 | Auto-fix iteration, gap re-check |
| qa-strategist | 5 | Test strategy, quality metrics |
| qa-monitor | 5 | Log monitoring, issue detection |
| product-manager | 4 | Requirements analysis |
| frontend-architect | 4 | UI architecture |
| enterprise-expert | 4 | Enterprise strategy |
| infra-architect | 4 | Infrastructure design |
| bkend-expert | 4 | Backend MCP tools |
| starter-guide | 3 | Beginner guidance |
| pipeline-guide | 6 | 9-phase pipeline |

### 3.6 TC-SK: Skill Functional Tests (90 TC)

| Skill Group | Count | TC Count | Focus |
|------------|:-----:|:--------:|-------|
| PDCA skills (pdca, plan-plus, bkit-templates) | 3 | 15 | PDCA workflow, template loading |
| Level skills (starter, dynamic, enterprise) | 3 | 10 | Level detection, init flow |
| Phase skills (phase-1~9) | 9 | 27 | Pipeline phase execution |
| Utility skills (code-review, zero-script-qa, claude-code-learning) | 3 | 10 | Review, QA, learning |
| App skills (desktop-app, mobile-app) | 2 | 6 | Platform guidance |
| Meta skills (development-pipeline, bkit-rules) | 2 | 8 | Pipeline overview, rules |
| bkend skills (auth, data, storage, cookbook, quickstart) | 5 | 14 | Backend MCP integration |

### 3.7 TC-PDCA: PDCA Workflow Tests (40 TC)

| ID Range | Workflow | TC Count |
|----------|---------|:--------:|
| PDCA-01~06 | Plan → Design → Do → Check → Act → Report | 6 |
| PDCA-07~12 | Auto-advance between phases | 6 |
| PDCA-13~18 | Multi-feature PDCA (context switch, activeFeatures) | 6 |
| PDCA-19~24 | Archive + Cleanup (--summary, cleanup all) | 6 |
| PDCA-25~30 | Match Rate calculation + iteration threshold | 6 |
| PDCA-31~36 | Status display + next phase guidance | 6 |
| PDCA-37~40 | PDCA status.json integrity (version 2.0 format) | 4 |

### 3.8 TC-E2E: End-to-End Workflow Tests (65 TC)

| ID Range | Scenario | TC Count |
|----------|---------|:--------:|
| E2E-01~12 | New project setup (Starter → Dynamic → Enterprise) | 12 |
| E2E-13~22 | Full PDCA cycle with CTO Team | 10 |
| E2E-23~32 | CTO Team with continue:false auto-termination | 10 |
| E2E-33~42 | InstructionsLoaded + SessionStart combined flow | 10 |
| E2E-43~52 | Plugin reload + hot-config change | 10 |
| E2E-53~65 | Cross-session memory persistence | 13 |

### 3.9 TC-UX: UX Experience Tests (65 TC)

| ID Range | Journey | TC Count |
|----------|---------|:--------:|
| UX-01~10 | Beginner: first install → starter project | 10 |
| UX-11~20 | Developer: dynamic project → PDCA cycle | 10 |
| UX-21~28 | QA Engineer: analyze → iterate → report | 8 |
| UX-29~38 | Team Lead: CTO Team orchestration → auto-terminate | 10 |
| UX-39~48 | v1.5.9 Upgrader: v1.5.8→v1.5.9 experience | 10 |
| UX-49~56 | Multilingual: 8-language trigger detection | 8 |
| UX-57~65 | InstructionsLoaded: CLAUDE.md context visibility | 9 |

### 3.10 TC-CFG: Config & Template Tests (25 TC)

| ID Range | Target | TC Count |
|----------|--------|:--------:|
| CFG-01~08 | bkit.config.json schema validation | 8 |
| CFG-09~16 | 16 templates: structure, placeholders, encoding | 8 |
| CFG-17~21 | 4 output-styles: format, variables | 5 |
| CFG-22~25 | plugin.json: fields, hooks path, version | 4 |

### 3.11 TC-TEAM: CTO Team Tests (35 TC)

| ID Range | Focus | TC Count |
|----------|-------|:--------:|
| TEAM-01~08 | Team composition (Dynamic 3, Enterprise 5) | 8 |
| TEAM-09~16 | Orchestration patterns (leader, swarm, council, watchdog) | 8 |
| TEAM-17~22 | continue:false auto-termination E2E | 6 |
| TEAM-23~28 | State-writer: agent-state.json lifecycle | 6 |
| TEAM-29~35 | Team cleanup, resource recovery | 7 |

### 3.12 TC-LANG: Multi-Language Tests (35 TC)

| ID Range | Language | TC Count |
|----------|---------|:--------:|
| LANG-01~05 | English (EN) — default | 5 |
| LANG-06~09 | Korean (KO) | 4 |
| LANG-10~13 | Japanese (JA) | 4 |
| LANG-14~17 | Chinese (ZH) | 4 |
| LANG-18~21 | Spanish (ES) | 4 |
| LANG-22~25 | French (FR) | 4 |
| LANG-26~29 | German (DE) | 4 |
| LANG-30~33 | Italian (IT) | 4 |
| LANG-34~35 | Cross-language trigger overlap detection | 2 |

### 3.13 TC-EDGE: Edge Case & Performance Tests (30 TC)

| ID Range | Focus | TC Count |
|----------|-------|:--------:|
| EDGE-01~06 | Hook timeout handling (3s, 5s, 10s) | 6 |
| EDGE-07~12 | JSON parse failure recovery (all handlers) | 6 |
| EDGE-13~18 | Empty/malformed hookContext resilience | 6 |
| EDGE-19~24 | Concurrent hook execution (overlapping events) | 6 |
| EDGE-25~30 | Large PDCA status file handling (50+ features) | 6 |

### 3.14 TC-SEC: Security Tests (20 TC)

| ID Range | Focus | TC Count |
|----------|-------|:--------:|
| SEC-01~05 | Hook output injection prevention | 5 |
| SEC-06~10 | agent_id/agent_type value sanitization | 5 |
| SEC-11~15 | Path traversal in file_path (InstructionsLoaded) | 5 |
| SEC-16~20 | JSON deserialization safety (prototype pollution) | 5 |

### 3.15 TC-REG: Regression Tests (25 TC)

| ID Range | Focus | TC Count |
|----------|-------|:--------:|
| REG-01~05 | v1.5.8 Path Registry still functional | 5 |
| REG-06~10 | v1.5.7 HTTP hooks awareness still present | 5 |
| REG-11~15 | v1.5.6 auto-memory integration intact | 5 |
| REG-16~20 | Hardcoded path audit (no regression from v1.5.8 migration) | 5 |
| REG-21~25 | Known issue re-check (#30586, #29548, #29547) | 5 |

---

## 4. Test Execution Strategy

### 4.1 CTO Team Task Assignment

| Phase | Task | Agent | TC Count | Priority |
|:-----:|------|-------|:--------:|:--------:|
| 1 | v1.5.9 New Changes (TC-V159) + CC Compatibility (TC-CC) | Hook Tester | 115 | P0 |
| 2 | Agent Frontmatter (TC-V159-AF) + Agent Functional (TC-AG) | Agent Tester | 100 | P0 |
| 3 | PDCA Workflow (TC-PDCA) + Hook Integration (TC-HK) + E2E (TC-E2E) | Integration Tester | 175 | P0+P1 |
| 4 | UX (TC-UX) + Multi-Language (TC-LANG) + Skill Functional (TC-SK) | UX Tester | 190 | P0+P1+P2 |
| 5 | Security (TC-SEC) + Edge Case (TC-EDGE) + Regression (TC-REG) | Regression Tester | 75 | P2 |
| 6 | Script Unit Tests (TC-UNIT) — split across all agents | All 5 agents | 215 | P0 |
| 7 | Config & Template (TC-CFG) + CTO Team (TC-TEAM) | Integration Tester | 60 | P1 |

### 4.2 Execution Order

```
Phase 1 (Hook Tester)        ─┐
Phase 2 (Agent Tester)       ─┤ Parallel
Phase 4 (UX Tester)          ─┤
Phase 5 (Regression Tester)  ─┘
          │
          ▼
Phase 3 (Integration Tester) ── Depends on Phase 1+2 completion
Phase 6 (All agents)         ── Parallel with Phase 3
Phase 7 (Integration Tester) ── After Phase 3
```

### 4.3 Quality Gates

| Gate | Condition | Action |
|------|-----------|--------|
| G1 | P0 TC pass rate ≥ 99% | Proceed to P1 |
| G2 | P0+P1 TC pass rate ≥ 98% | Proceed to P2 |
| G3 | Overall pass rate ≥ 97% (excl. SKIP) | PASS → Report |
| G4 | Any FAIL in v1.5.9 new changes (TC-V159) | BLOCK → Fix → Re-test |
| G5 | Any FAIL in CC Compatibility (TC-CC) | BLOCK → Fix → Re-test |

### 4.4 SKIP Criteria

A test case may be marked SKIP (not counted in pass rate) when:
- Requires runtime environment not available in static analysis (e.g., actual CC v2.1.63 instance)
- Requires Docker infrastructure (Zero Script QA runtime tests)
- Requires actual Agent Teams spawning (CTO Team E2E runtime)
- Environment-dependent timing tests

---

## 5. Success Criteria

| Metric | Target |
|--------|:------:|
| P0 TC Pass Rate (excl. SKIP) | ≥ 99.5% |
| Overall Pass Rate (excl. SKIP) | ≥ 98.0% |
| v1.5.9 New Changes (TC-V159) | 100% PASS |
| CC Compatibility (TC-CC) | 100% PASS |
| FAIL Count | 0 (after Act iteration if needed) |
| Max SKIP Rate | ≤ 10% |
| Total TC Executed | ≥ 900 |

---

## 6. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|------------|
| InstructionsLoaded never fires (CC version) | Medium | Low | SessionStart fallback covers all context |
| continue:false prematurely terminates active teammate | Low | High | Safety guard (shouldContinue=true on exception) |
| background:true causes agent spawn failure on older CC | Low | Medium | Supported since v2.1.49, well-tested |
| Export count comments still stale | Low | Low | Automated grep verification |
| Hook timeout on InstructionsLoaded (3000ms) | Low | Medium | Minimal logic, fast path |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-03-04 | Initial draft — 989 TC, 15 categories, 5 CTO agents |
