# bkit v1.5.8 Comprehensive Test Design

> **Summary**: bkit v1.5.8 comprehensive test execution design — 920 TC execution methods, verification criteria, migration scenario matrices, parallelization strategy
>
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.8-comprehensive-test.plan.md
> **Version**: 1.5.8
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager)
> **Date**: 2026-03-01
> **Status**: Draft

---

## 1. Test Architecture

### 1.1 Execution Strategy

All 920 TC are executed in parallel by 5 QA agents. Each agent has an independent TC scope and runs from the same project root directory. v1.5.8 adds 100 TC over v1.5.7 (820 → 920), primarily covering Path Registry, auto-migration scenarios, consumer refactoring audit, and bridge extension.

**Test Methods:**
- **Grep**: File content pattern matching (`Grep` tool)
- **Read + Parse**: File reading + structure verification
- **Node Require**: `require()` module loading + export verification
- **Logic Trace**: Code path analysis + conditional coverage
- **File Exists**: File/directory existence check (`Glob` tool)
- **Path Validation**: Absolute path resolution, cross-module consistency
- **Migration Simulation**: Pre/post state comparison, scenario execution
- **Workflow Simulation**: PDCA cycle, user journey simulation (SKIP possible)

### 1.2 Test Categories and Methods

| Category | TC Count | Primary Method | Agent |
|----------|:--------:|----------------|:-----:|
| TC-V158 | 75 | Grep + Node Require + Path Validation | qa-v158 |
| TC-MIG | 30 | Migration Simulation + File System | qa-v158 |
| TC-CONFIG | 25 | JSON Parse + File Exists | qa-v158 |
| TC-REG | 20 | Re-verification + Hardcoding Audit | qa-v158 |
| TC-UNIT | 210 | Node Require + Logic Trace | qa-unit |
| TC-HOOK | 65 | Read + Grep + JSON Parse | qa-integration |
| TC-AGENT | 80 | Read + Grep (frontmatter) | qa-integration |
| TC-PDCA | 40 | File Exists + Grep + Logic Trace | qa-integration |
| TC-SKILL | 90 | Read + Grep (frontmatter + content) | qa-extended |
| TC-LANG | 32 | Function Invocation + Regex | qa-extended |
| TC-EDGE | 28 | Edge Case Analysis + Logic | qa-extended |
| TC-SEC | 20 | Security Pattern Analysis | qa-extended |
| TC-E2E | 60 | Workflow Simulation (SKIP possible) | qa-e2e |
| TC-UX | 60 | Content Verification + Simulation | qa-e2e |
| TC-TEAM | 30 | Require + Logic Trace | qa-e2e |

### 1.3 Key Design Decisions

1. **Path Registry centralization**: All state file paths flow through `lib/core/paths.js`. Zero hardcoded paths allowed in `lib/`, `hooks/`, `scripts/`.
2. **Auto-migration**: SessionStart hook handles v1.5.7→v1.5.8 transition atomically. EXDEV fallback for cross-filesystem scenarios. Each file migration is independent (error isolation).
3. **Consumer refactoring**: 7 files updated to use `STATE_PATHS.*()` getters instead of inline `path.join()`. No functional logic changes, only path references.
4. **Bridge extension**: common.js grows from 180 → 184 exports. 4 new exports: STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs.
5. **Lazy require pattern**: `lib/core/paths.js` uses lazy require for `platform.js` to avoid circular dependencies.
6. **State directory structure**: `.bkit/state/` (persistent), `.bkit/runtime/` (session-scoped), `.bkit/snapshots/` (created on demand).
7. **Version strings**: 3 files updated to "1.5.8" (plugin.json, bkit.config.json, session-start.js header).

### 1.4 SKIP Categories

| SKIP Reason | Estimated Count | Examples |
|-------------|:--------------:|---------|
| Runtime-only (requires live Claude Code session) | ~30 | E2E workflows, PDCA phase transitions |
| Environment dependency (Agent Teams env var) | ~10 | TEAM-01~30 subset |
| External service (bkend MCP) | ~5 | bkend skill live tests |
| Runtime timeout verification | ~3 | EDGE-01~04 subset |
| Cross-filesystem migration (requires Docker/VM) | ~2 | EDGE-21~24 subset |
| **Estimated Total SKIP** | **~50** | |

---

## 2. Reference Tables

### 2.1 Agent Reference (16 agents)

| # | Agent | Model | Mode | Memory Scope | Tools |
|:-:|-------|:-----:|:----:|:------------:|:-----:|
| 1 | cto-lead | opus | acceptEdits | project | Task, Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebSearch |
| 2 | code-analyzer | opus | plan | project | Read, Glob, Grep, Task, LSP, Write, Edit |
| 3 | design-validator | opus | plan | project | Read, Glob, Grep, Write, Edit |
| 4 | gap-detector | opus | plan | project | Read, Glob, Grep, Task(Explore), Write, Edit |
| 5 | enterprise-expert | opus | acceptEdits | project | Read, Write, Edit, Glob, Grep, Task, WebSearch |
| 6 | infra-architect | opus | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task |
| 7 | security-architect | opus | plan | project | Read, Glob, Grep, Task, WebSearch, Write, Edit |
| 8 | bkend-expert | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, WebFetch |
| 9 | frontend-architect | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task(Explore), WebSearch |
| 10 | pdca-iterator | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, LSP |
| 11 | pipeline-guide | sonnet | plan | user | Read, Glob, Grep, TodoWrite, Write, Edit |
| 12 | product-manager | sonnet | plan | project | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, TodoWrite |
| 13 | qa-strategist | sonnet | plan | project | Read, Glob, Grep, Task, TodoWrite, Write, Edit |
| 14 | starter-guide | sonnet | acceptEdits | user | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch |
| 15 | report-generator | haiku | acceptEdits | project | Read, Write, Glob, Grep, Edit |
| 16 | qa-monitor | haiku | acceptEdits | project | Bash, Read, Write, Glob, Grep, Task(Explore), Edit |

**Distribution**: 7 opus / 7 sonnet / 2 haiku
**Permission Modes**: 9 acceptEdits / 7 plan
**Memory Scopes**: 14 project / 2 user (starter-guide, pipeline-guide)

### 2.2 Skill Reference (27 skills)

| # | Skill | Category | User-Invocable |
|:-:|-------|----------|:--------------:|
| 1 | pdca | PDCA | true |
| 2 | plan-plus | PDCA | true |
| 3 | starter | Level | true |
| 4 | dynamic | Level | true |
| 5 | enterprise | Level | true |
| 6 | development-pipeline | Pipeline | true |
| 7~15 | phase-1 ~ phase-9 | Phase | false |
| 16 | code-review | Utility | true |
| 17 | zero-script-qa | Utility | true |
| 18 | claude-code-learning | Utility | true |
| 19 | bkit-rules | Utility | false |
| 20 | bkit-templates | Utility | false |
| 21 | mobile-app | Platform | true |
| 22 | desktop-app | Platform | true |
| 23~27 | bkend-* (5) | bkend | false |

**Distribution**: 22 core + 5 bkend | 12 user-invocable / 15 not user-invocable

### 2.3 Hook Registry Reference (10 events, 13 entries)

| # | Event | Matcher | Script | Timeout |
|:-:|-------|---------|--------|:-------:|
| 1 | SessionStart | — | hooks/session-start.js | 5000ms |
| 2 | PreToolUse | `Write\|Edit` | scripts/pre-write.js | 5000ms |
| 3 | PreToolUse | `Bash` | scripts/unified-bash-pre.js | 5000ms |
| 4 | PostToolUse | `Write` | scripts/unified-write-post.js | 5000ms |
| 5 | PostToolUse | `Bash` | scripts/unified-bash-post.js | 5000ms |
| 6 | PostToolUse | `Skill` | scripts/skill-post.js | 5000ms |
| 7 | Stop | — | scripts/unified-stop.js | 10000ms |
| 8 | UserPromptSubmit | — | scripts/user-prompt-handler.js | 3000ms |
| 9 | PreCompact | `auto\|manual` | scripts/context-compaction.js | 5000ms |
| 10 | TaskCompleted | — | scripts/pdca-task-completed.js | 5000ms |
| 11 | SubagentStart | — | scripts/subagent-start-handler.js | 5000ms |
| 12 | SubagentStop | — | scripts/subagent-stop-handler.js | 5000ms |
| 13 | TeammateIdle | — | scripts/team-idle-handler.js | 5000ms |

### 2.4 State File Path Reference (v1.5.8)

| State File | Legacy Path (v1.5.7) | New Path (v1.5.8) | Category |
|-----------|---------------------|-------------------|----------|
| PDCA Status | `docs/.pdca-status.json` | `.bkit/state/pdca-status.json` | Persistent |
| bkit Memory | `docs/.bkit-memory.json` | `.bkit/state/memory.json` | Persistent |
| Agent State | `.bkit/agent-state.json` | `.bkit/runtime/agent-state.json` | Runtime |
| Snapshots | `docs/.pdca-snapshots/` | `.bkit/snapshots/` | On-demand |

### 2.5 common.js Bridge Export Inventory (184 exports)

| Module | Section | Count | Delta |
|--------|---------|:-----:|:-----:|
| Core - Platform | detectPlatform, BKIT_PLATFORM, ... | 9 | 0 |
| Core - Cache | get, set, invalidate, ... | 7 | 0 |
| Core - I/O | truncateContext, readStdinSync, ... | 9 | 0 |
| Core - Debug | debugLog, DEBUG_LOG_PATHS, ... | 3 | 0 |
| Core - Config | loadConfig, getConfig, ... | 5 | 0 |
| Core - File | isSourceFile, isCodeFile, ... | 8 | 0 |
| **Core - Paths** | **STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs** | **4** | **+4 NEW** |
| PDCA - Tier | getLanguageTier, isTier1, ... | 8 | 0 |
| PDCA - Level | detectLevel, canSkipPhase, ... | 7 | 0 |
| PDCA - Phase | PDCA_PHASES, getPhaseNumber, ... | 9 | 0 |
| PDCA - Status | getPdcaStatusPath, readBkitMemory, ... | 19 | 0 |
| PDCA - Automation | getAutomationLevel, generateBatchTrigger, ... | 13 | 0 |
| Intent - Language | SUPPORTED_LANGUAGES, detectLanguage, ... | 6 | 0 |
| Intent - Trigger | matchImplicitAgentTrigger, ... | 5 | 0 |
| Intent - Ambiguity | calculateAmbiguityScore, ... | 8 | 0 |
| Task - Classification | classifyTask, getPdcaLevel, ... | 6 | 0 |
| Task - Context | setActiveSkill, getActiveContext, ... | 7 | 0 |
| Task - Creator | generatePdcaTaskSubject, ... | 6 | 0 |
| Task - Tracker | savePdcaTaskId, findPdcaStatus, ... | 7 | 0 |
| Team - Coordinator | isTeamModeAvailable, ... | 5 | 0 |
| Team - Strategy | TEAM_STRATEGIES, getTeammateRoles | 2 | 0 |
| Team - Hooks | assignNextTeammateWork, handleTeammateIdle | 2 | 0 |
| Team - Orchestrator | selectOrchestrationPattern, ... | 6 | 0 |
| Team - Communication | createMessage, createBroadcast, ... | 6 | 0 |
| Team - Task Queue | createTeamTasks, assignTaskToRole, ... | 5 | 0 |
| Team - CTO Logic | decidePdcaPhase, evaluateDocument, ... | 5 | 0 |
| Team - State Writer | initAgentState, getAgentStatePath, ... | 9 | 0 |
| **Total** | | **184** | **+4** |

---

## 3. TC-V158: v1.5.8 New Changes Test Design (75 TC)

### 3.1 TC-V158-FR01: Path Registry (20 TC)

#### Verification Anchors

| TC | Content | Verification Method | Target |
|----|---------|-------------------|--------|
| V158-01 | paths.js exists | `Glob('lib/core/paths.js')` | File found |
| V158-02 | JSDoc @version | `Grep '@version 1.5.8'` in paths.js | Match |
| V158-03 | STATE_PATHS 7 keys | `Object.keys(STATE_PATHS).length === 7` | 7 |
| V158-04~10 | STATE_PATHS getters | `STATE_PATHS.*()`path validation | Correct suffixes |
| V158-11 | LEGACY_PATHS 4 keys | `Object.keys(LEGACY_PATHS).length === 4` | 4 |
| V158-12~15 | LEGACY_PATHS getters | `LEGACY_PATHS.*()`path validation | Legacy suffixes |
| V158-16 | CONFIG_PATHS 3 keys | `Object.keys(CONFIG_PATHS).length === 3` | 3 |
| V158-17 | CONFIG_PATHS.bkitConfig | Path ends with `bkit.config.json` | Match |
| V158-18 | ensureBkitDirs callable | `typeof ensureBkitDirs === 'function'` | true |
| V158-19 | ensureBkitDirs skips snapshots | Check only state + runtime created | No snapshots/ |
| V158-20 | Lazy require pattern | `Grep '_platform'` in paths.js | Lazy init found |

#### Execution Scripts

```bash
# V158-01~03: Path Registry module validation
node -e "
  const p = require('./lib/core/paths');
  const sk = Object.keys(p.STATE_PATHS);
  const lk = Object.keys(p.LEGACY_PATHS);
  const ck = Object.keys(p.CONFIG_PATHS);
  console.log('STATE_PATHS keys:', sk.length, sk);
  console.log('LEGACY_PATHS keys:', lk.length, lk);
  console.log('CONFIG_PATHS keys:', ck.length, ck);
  console.log('ensureBkitDirs:', typeof p.ensureBkitDirs);
"
# Expected:
# STATE_PATHS keys: 7 ['root','state','runtime','snapshots','pdcaStatus','memory','agentState']
# LEGACY_PATHS keys: 4 ['pdcaStatus','memory','snapshots','agentState']
# CONFIG_PATHS keys: 3 ['bkitConfig','pluginJson','hooksJson']
# ensureBkitDirs: function

# V158-04~10: Path suffix validation
node -e "
  const p = require('./lib/core/paths');
  console.log('root:', p.STATE_PATHS.root().endsWith('.bkit'));
  console.log('state:', p.STATE_PATHS.state().endsWith('.bkit/state'));
  console.log('runtime:', p.STATE_PATHS.runtime().endsWith('.bkit/runtime'));
  console.log('snapshots:', p.STATE_PATHS.snapshots().endsWith('.bkit/snapshots'));
  console.log('pdcaStatus:', p.STATE_PATHS.pdcaStatus().endsWith('.bkit/state/pdca-status.json'));
  console.log('memory:', p.STATE_PATHS.memory().endsWith('.bkit/state/memory.json'));
  console.log('agentState:', p.STATE_PATHS.agentState().endsWith('.bkit/runtime/agent-state.json'));
"
# Expected: all true

# V158-12~15: Legacy path suffix validation
node -e "
  const p = require('./lib/core/paths');
  console.log('legacy pdcaStatus:', p.LEGACY_PATHS.pdcaStatus().includes('docs/.pdca-status.json'));
  console.log('legacy memory:', p.LEGACY_PATHS.memory().includes('docs/.bkit-memory.json'));
  console.log('legacy snapshots:', p.LEGACY_PATHS.snapshots().includes('docs/.pdca-snapshots'));
  console.log('legacy agentState:', p.LEGACY_PATHS.agentState().includes('.bkit/agent-state.json'));
"
# Expected: all true

# V158-20: Lazy require verification
grep -n '_platform' lib/core/paths.js
# Expected: let _platform = null; function getPlatform() { if (!_platform) ... }
```

### 3.2 TC-V158-FR03: Consumer Refactoring (25 TC)

#### Hardcoding Audit Scripts

```bash
# V158-33~36: Zero hardcoded legacy paths
# Each must return 0 matches

# Audit 1: docs/.pdca-status (MUST be 0 in functional code)
grep -rn 'docs/\.pdca-status' lib/ hooks/ scripts/ --include='*.js' | grep -v '// legacy\|// deprecated\|LEGACY_PATHS'
# Expected: 0 matches

# Audit 2: docs/.bkit-memory (MUST be 0 in functional code)
grep -rn 'docs/.*\.bkit-memory' lib/ hooks/ scripts/ --include='*.js' | grep -v '// legacy\|// deprecated\|LEGACY_PATHS'
# Expected: 0 matches

# Audit 3: docs/.pdca-snapshots (MUST be 0 in functional code)
grep -rn 'docs/.*\.pdca-snapshots' lib/ hooks/ scripts/ --include='*.js' | grep -v '// legacy\|// deprecated\|LEGACY_PATHS'
# Expected: 0 matches

# Audit 4: .bkit/agent-state.json (flat, not in runtime/)
grep -rn '\.bkit/agent-state\.json' lib/ hooks/ scripts/ --include='*.js' | grep -v 'runtime\|LEGACY_PATHS'
# Expected: 0 matches
```

#### Cross-Module Path Consistency

```bash
# V158-44: All modules return identical pdcaStatus path
node -e "
  const status = require('./lib/pdca/status');
  const tracker = require('./lib/task/tracker');
  const common = require('./lib/common');
  const p1 = status.getPdcaStatusPath();
  const p2 = tracker.findPdcaStatus ? 'via getPdcaStatusPath' : 'N/A';
  const p3 = common.getPdcaStatusPath();
  console.log('status.getPdcaStatusPath():', p1);
  console.log('common.getPdcaStatusPath():', p3);
  console.log('Match:', p1 === p3);
"
# Expected: Match: true

# V158-45: Memory path consistency
node -e "
  const mem = require('./lib/memory-store');
  const common = require('./lib/common');
  const p1 = mem.getMemoryPath ? mem.getMemoryPath() : 'N/A';
  const p2 = common.STATE_PATHS.memory();
  console.log('memory-store path:', p1);
  console.log('STATE_PATHS.memory():', p2);
"
```

### 3.3 TC-V158-FR04: Auto-Migration (15 TC)

#### Migration Code Structure

```
hooks/session-start.js lines ~153-197:
┌─────────────────────────────────────────────────────────────┐
│ try {                                                         │
│   const { STATE_PATHS, LEGACY_PATHS, ensureBkitDirs } = ...  │
│   ensureBkitDirs();                    // Create dirs first   │
│                                                               │
│   const migrations = [                                        │
│     { from: LEGACY.pdcaStatus, to: STATE.pdcaStatus, ... },  │
│     { from: LEGACY.memory,     to: STATE.memory,     ... },  │
│     { from: LEGACY.agentState, to: STATE.agentState, ... },  │
│     { from: LEGACY.snapshots,  to: STATE.snapshots,  ... },  │
│   ];                                                          │
│                                                               │
│   for (const m of migrations) {                               │
│     try {                              // Error isolation     │
│       if (!fs.existsSync(m.from)) continue;  // Skip missing │
│       if (fs.existsSync(m.to)) continue;     // Skip done    │
│       fs.renameSync(m.from, m.to);           // Atomic move  │
│     } catch (renameErr) {                                     │
│       if (renameErr.code === 'EXDEV') {      // Cross-fs     │
│         fs.copyFileSync(m.from, m.to);                        │
│         fs.rmSync(m.from, ...);                               │
│       }                                                       │
│     }                                                         │
│     debugLog('Migrated', m.name);                             │
│   }                                                           │
│ } catch (e) { debugLog('skipped'); }                          │
└─────────────────────────────────────────────────────────────┘
```

#### Verification Anchors

| TC | Content | Grep Pattern |
|----|---------|-------------|
| V158-46 | Migration block exists | `Auto-migration` |
| V158-47 | ensureBkitDirs before migrations | Line of `ensureBkitDirs()` < line of `migrations` |
| V158-48 | 4 migration entries | Count `{ from:` occurrences in migration block = 4 |
| V158-49 | Migration properties | `from:.*to:.*name:.*type:` in each entry |
| V158-50 | renameSync primary | `fs.renameSync(m.from, m.to)` |
| V158-51 | EXDEV copyFileSync | `EXDEV.*copyFileSync` |
| V158-52 | EXDEV cpSync recursive | `cpSync.*recursive` |
| V158-53 | rmSync after copy | `rmSync.*force` |
| V158-54 | Individual try-catch | Inner `try {` within `for (const m` |
| V158-55 | Outer try-catch | `} catch (e) {.*Path migration skipped` |
| V158-56 | Success debug log | `Migrated \${m.name}` |
| V158-57 | Failure debug log | `Migration failed` |
| V158-58 | Skip if source missing | `existsSync(m.from).*continue` |
| V158-59 | Skip if target exists | `existsSync(m.to).*continue` |
| V158-60 | Dir non-empty skip | `readdirSync.*length.*continue` |

### 3.4 TC-V158-FR05: Bridge Extension (10 TC)

#### Verification Script

```bash
# V158-61~65: Bridge export validation
node -e "
  const c = require('./lib/common');
  const keys = Object.keys(c);
  console.log('Total exports:', keys.length);
  console.log('STATE_PATHS:', !!c.STATE_PATHS);
  console.log('LEGACY_PATHS:', !!c.LEGACY_PATHS);
  console.log('CONFIG_PATHS:', !!c.CONFIG_PATHS);
  console.log('ensureBkitDirs:', typeof c.ensureBkitDirs);
  console.log('STATE_PATHS.pdcaStatus:', typeof c.STATE_PATHS?.pdcaStatus);
"
# Expected:
# Total exports: 184
# STATE_PATHS: true
# LEGACY_PATHS: true
# CONFIG_PATHS: true
# ensureBkitDirs: function
# STATE_PATHS.pdcaStatus: function

# V158-66: Version comment present
grep -n 'v1.5.8 Path Registry' lib/common.js
# Expected: Line ~85
```

### 3.5 TC-V158-FR06: Version Sync (5 TC)

```bash
# V158-71~75: Version consistency
grep -n '"1.5.8"' .claude-plugin/plugin.json bkit.config.json
# Expected: 2 matches

grep 'v1.5.8' hooks/session-start.js | head -3
# Expected: JSDoc header line

grep 'statusFile.*\.bkit/state/pdca-status' bkit.config.json
# Expected: 1 match
```

---

## 4. TC-MIG: Migration Scenario Test Design (30 TC)

### 4.1 Scenario Matrix

| Scenario | Pre-condition | Action | Expected Result | TC Count |
|----------|--------------|--------|----------------|:--------:|
| S1: Fresh Install | No legacy files, no .bkit/ dirs | SessionStart | Dirs created, no migration | 6 |
| S2: Full Upgrade | All 4 legacy files exist | SessionStart | All 4 migrated atomically | 6 |
| S3: Re-execution | Already migrated (files at new paths) | SessionStart again | No changes, idempotent | 6 |
| S4: Partial State | Some files migrated, some not | SessionStart | Only unmigrated files move | 6 |
| S5: Collision/Edge | Both old and new exist, edge cases | SessionStart | New authoritative, no overwrite | 6 |

### 4.2 Migration Pre/Post State Tables

#### S2: Full Upgrade State

| File | Before | After | Verification |
|------|--------|-------|-------------|
| pdca-status | `docs/.pdca-status.json` (exists) | `.bkit/state/pdca-status.json` | `!exists(old) && exists(new)` |
| memory | `docs/.bkit-memory.json` (exists) | `.bkit/state/memory.json` | `!exists(old) && exists(new)` |
| agent-state | `.bkit/agent-state.json` (exists) | `.bkit/runtime/agent-state.json` | `!exists(old) && exists(new)` |
| snapshots | `docs/.pdca-snapshots/` (exists) | `.bkit/snapshots/` | `!exists(old) && exists(new)` |

#### S5: Collision Resolution

| Condition | Old Path | New Path | Action | Rationale |
|-----------|----------|----------|--------|-----------|
| Both exist (file) | exists | exists | Skip (new is authoritative) | Data at new path is more recent |
| Both exist (dir, new non-empty) | exists | exists+files | Skip | Non-empty target = already migrated |
| Both exist (dir, new empty) | exists | exists(empty) | rmdir(new) + rename(old→new) | Empty new = likely just mkdir |
| Old missing | not exists | any | Skip | Nothing to migrate |
| Old exists, new missing | exists | not exists | Rename (or copy+delete) | Standard migration |

### 4.3 EXDEV Fallback Flow

```
renameSync(old, new)
   ↓ success? → done
   ↓ EXDEV error?
     ↓ type === 'directory'?
     │   → cpSync(old, new, {recursive: true})
     │   → rmSync(old, {recursive: true, force: true})
     │
     ↓ type === 'file'?
         → copyFileSync(old, new)
         → rmSync(old, {recursive: true, force: true})
```

### 4.4 Migration Simulation Scripts

```bash
# Simulate S2: Full Upgrade
# Setup legacy state (for testing, then verify migration)
node -e "
  const fs = require('fs');
  const p = require('./lib/core/paths');

  // Check if migration already happened
  const newExists = fs.existsSync(p.STATE_PATHS.pdcaStatus());
  const oldExists = fs.existsSync(p.LEGACY_PATHS.pdcaStatus());
  console.log('pdcaStatus at new path:', newExists);
  console.log('pdcaStatus at old path:', oldExists);
  console.log('memory at new path:', fs.existsSync(p.STATE_PATHS.memory()));
  console.log('agentState at new path:', fs.existsSync(p.STATE_PATHS.agentState()));
"
```

---

## 5. TC-UNIT: Unit Test Design (210 TC)

### 5.1 TC-UNIT-PATH: paths.js Functions (15 TC, NEW)

#### Verification Script

```bash
# All 15 TC for paths.js
node -e "
  const p = require('./lib/core/paths');
  const path = require('path');
  let pass = 0, fail = 0;

  // UNIT-PATH-01~05: STATE_PATHS getters
  const sp = p.STATE_PATHS;
  const checks = [
    [sp.root().endsWith('.bkit'), 'root ends with .bkit'],
    [sp.state().endsWith(path.join('.bkit','state')), 'state path'],
    [sp.runtime().endsWith(path.join('.bkit','runtime')), 'runtime path'],
    [sp.snapshots().endsWith(path.join('.bkit','snapshots')), 'snapshots path'],
    [sp.pdcaStatus().endsWith(path.join('.bkit','state','pdca-status.json')), 'pdcaStatus'],
    [sp.memory().endsWith(path.join('.bkit','state','memory.json')), 'memory'],
    [sp.agentState().endsWith(path.join('.bkit','runtime','agent-state.json')), 'agentState'],
  ];

  // UNIT-PATH-06~08: LEGACY_PATHS getters
  const lp = p.LEGACY_PATHS;
  checks.push(
    [lp.pdcaStatus().includes('docs'), 'legacy pdcaStatus in docs/'],
    [lp.memory().includes('docs'), 'legacy memory in docs/'],
    [lp.agentState().includes('.bkit'), 'legacy agentState in .bkit/'],
  );

  // UNIT-PATH-09~11: CONFIG_PATHS getters
  const cp = p.CONFIG_PATHS;
  checks.push(
    [cp.bkitConfig().endsWith('bkit.config.json'), 'config path'],
    [typeof cp.pluginJson === 'function', 'pluginJson is function'],
    [typeof cp.hooksJson === 'function', 'hooksJson is function'],
  );

  // UNIT-PATH-12~14: ensureBkitDirs
  checks.push(
    [typeof p.ensureBkitDirs === 'function', 'ensureBkitDirs is function'],
    [Object.keys(sp).length === 7, 'STATE_PATHS has 7 keys'],
  );

  checks.forEach(([result, label]) => {
    if (result) { pass++; console.log('[PASS]', label); }
    else { fail++; console.log('[FAIL]', label); }
  });

  console.log('\\nResult:', pass, 'PASS,', fail, 'FAIL');
"
```

### 5.2 TC-UNIT-SS: session-start.js (40 TC)

Same structure as v1.5.7 (35 TC) plus 5 new TC for migration logic:

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-SS-01~05 | detectLevel() | 5 |
| UNIT-SS-06~10 | enhancedOnboarding() | 5 |
| UNIT-SS-11~15 | detectPdcaPhase() (uses getPdcaStatusFull) | 5 |
| UNIT-SS-16~20 | bkend MCP detection | 5 |
| UNIT-SS-21~25 | additionalContext assembly | 5 |
| UNIT-SS-26~30 | Trigger tables | 5 |
| UNIT-SS-31~35 | JSON output structure | 5 |
| UNIT-SS-36~40 | Auto-migration logic (NEW) | 5 |

### 5.3 TC-UNIT-LIB: Library Functions (45 TC)

| ID | Module | TC Count | Key Focus |
|----|--------|:--------:|-----------|
| UNIT-LIB-01~10 | lib/core/ (incl. paths.js) | 10 | STATE_PATHS, ensureBkitDirs, debugLog |
| UNIT-LIB-11~20 | lib/pdca/ | 10 | getPdcaStatusPath (new path), readBkitMemory, writeBkitMemory |
| UNIT-LIB-21~26 | lib/intent/ | 6 | detectIntent, CC_COMMAND_PATTERNS |
| UNIT-LIB-27~32 | lib/task/ | 6 | findPdcaStatus (new path), classification |
| UNIT-LIB-33~38 | lib/team/ | 6 | getAgentStatePath (new path), initAgentState |
| UNIT-LIB-39~42 | lib/skill-orchestrator.js | 4 | orchestrateSkillPost |
| UNIT-LIB-43~45 | lib/common.js bridge | 3 | 184 exports, 4 new path exports |

---

## 6. TC-HOOK: Hook Integration Test Design (65 TC)

### 6.1 SessionStart Hook (10 TC, expanded from 8)

v1.5.8 adds 2 TC for migration integration:

| TC | Content | Verification |
|----|---------|-------------|
| HOOK-01 | JSON output has hookEventName | `"hookEventName": "SessionStart"` |
| HOOK-02 | systemMessage contains version | `v1.5.8` in systemMessage |
| HOOK-03 | additionalContext present | Non-empty string |
| HOOK-04 | Session context initialized | `sessionStartedAt` set |
| HOOK-05 | PDCA status loaded from new path | getPdcaStatusFull reads from .bkit/state/ |
| HOOK-06 | v1.5.8 Enhancements section | `v1.5.8 Enhancements` in context |
| HOOK-07 | Path Registry mentioned | `Path Registry` in context |
| HOOK-08 | Migration path mentioned | `.bkit/{state,runtime,snapshots}/` in context |
| HOOK-09 | Auto-migration block executes before initPdcaStatus | Line order check |
| HOOK-10 | debugLog records migration events | Migration entries in debug log |

### 6.2 PreCompact Hook (5 TC)

| TC | Content | Verification |
|----|---------|-------------|
| HOOK-53 | Snapshot saved to new path | `.bkit/snapshots/snapshot-*.json` |
| HOOK-54 | PDCA state preserved in snapshot | pdcaStatus from .bkit/state/ included |
| HOOK-55 | Snapshot retention (max 10) | Oldest deleted when > 10 |
| HOOK-56 | snapshotDir uses STATE_PATHS.snapshots() | Grep in context-compaction.js |
| HOOK-57 | Snapshot dir created on demand | Dir created if not exists |

---

## 7. TC-SEC: Security Test Design (20 TC)

### 7.1 Path Traversal Prevention (4 TC)

| TC | Attack Vector | Verification |
|----|--------------|-------------|
| SEC-05 | STATE_PATHS returns absolute path (no ../.. possible) | path.isAbsolute() check |
| SEC-06 | Feature name with `../../etc/passwd` | Path stays within .bkit/ |
| SEC-07 | LEGACY_PATHS.pdcaStatus with malicious PROJECT_DIR | Path normalized |
| SEC-08 | CONFIG_PATHS.bkitConfig with symlink | Follows expected path only |

### 7.2 Migration Safety (4 TC)

| TC | Risk | Verification |
|----|------|-------------|
| SEC-09 | Migration doesn't overwrite user files | existsSync check before move |
| SEC-10 | Symlink source not followed blindly | renameSync on symlinks |
| SEC-11 | Migration target always within .bkit/ | All `m.to` paths start with .bkit/ |
| SEC-12 | Partial copy doesn't leave corrupt state | rmSync only after successful copy |

---

## 8. TC-EDGE: Edge Case Design (28 TC)

### 8.1 Migration Edge Cases (8 TC, NEW)

| TC | Scenario | Expected |
|----|----------|----------|
| EDGE-17 | Permission denied on source file | debugLog error, skip to next |
| EDGE-18 | Read-only filesystem for target | debugLog error, skip |
| EDGE-19 | Symlink as source file | rename resolves symlink |
| EDGE-20 | Very large snapshot directory (100+ files) | renameSync is atomic O(1) |
| EDGE-21 | Cross-filesystem (EXDEV) for single file | copyFileSync + rmSync |
| EDGE-22 | Cross-filesystem (EXDEV) for directory | cpSync({recursive}) + rmSync |
| EDGE-23 | Partial copy failure in EXDEV | Source preserved (rmSync not reached) |
| EDGE-24 | concurrent migration (2 sessions) | First wins, second skips (existsSync) |

### 8.2 Path Resolution Edge Cases (4 TC, NEW)

| TC | Scenario | Expected |
|----|----------|----------|
| EDGE-25 | PROJECT_DIR with spaces | path.join handles correctly |
| EDGE-26 | PROJECT_DIR with unicode characters | path.join handles correctly |
| EDGE-27 | Very long PROJECT_DIR path (200+ chars) | No truncation |
| EDGE-28 | Relative require from different cwd | Lazy require resolves correctly |

---

## 9. QA Agent Assignment

### 9.1 Agent Task Distribution

```
qa-v158 (opus) — 150 TC
├── TC-V158 (75 TC): Path Registry, consumer refactoring, bridge, version
├── TC-MIG (30 TC): 5 migration scenarios, EXDEV, edge cases
├── TC-CONFIG (25 TC): configs, templates, output styles
└── TC-REG (20 TC): regression, hardcoding audit, .gitignore

qa-unit (opus) — 210 TC
├── TC-UNIT-PATH (15 TC): NEW paths.js module
├── TC-UNIT-SS (40 TC): session-start.js including migration
├── TC-UNIT-SP (25 TC): skill-post.js
├── TC-UNIT-GDS (20 TC): gap-detector-stop.js
├── TC-UNIT-ITS (20 TC): iterator-stop.js
├── TC-UNIT-CRS (10 TC): code-review-stop.js
├── TC-UNIT-US (20 TC): unified-stop.js
├── TC-UNIT-UPH (15 TC): user-prompt-handler.js
└── TC-UNIT-LIB (45 TC): library functions

qa-integration (opus) — 185 TC
├── TC-HOOK (65 TC): 10 hooks + migration hook integration
├── TC-PDCA (40 TC): PDCA workflow at new paths
└── TC-AGENT (80 TC): 16 agents × 5 TC

qa-e2e (sonnet) — 150 TC
├── TC-E2E (60 TC): 6 workflows including migration flow
├── TC-UX (60 TC): 6 personas including transparent migration UX
└── TC-TEAM (30 TC): CTO Team with agent-state at runtime/

qa-extended (sonnet) — 170 TC
├── TC-SKILL (90 TC): 27 skills × 3-4 TC
├── TC-LANG (32 TC): 8 languages × 4 triggers
├── TC-EDGE (28 TC): edge cases + migration edge + path resolution
└── TC-SEC (20 TC): security + path traversal + migration safety
```

### 9.2 Execution Timeline

```
Phase 1 (Static):    ████████████░░░░░░░░  ~35% (190 TC)
Phase 2 (Unit):      ████████████████░░░░  ~67% (290 TC)
Phase 3 (Integ+Mig): ████████████████████  ~81% (135 TC)
Phase 4 (E2E/UX):    ████████████████████  ~98% (150 TC)
Phase 5 (Extended):   ████████████████████  100% (100 TC)
Buffer:                                     +35 TC
```

---

## 10. Quality Metrics

### 10.1 Coverage Analysis

| Coverage Type | Target | Measurement |
|--------------|:------:|-------------|
| File Coverage | 100% of changed files | 11/11 files covered by TC-V158 |
| Function Coverage | 100% of new/modified exports | 4 new + 7 modified = 11 functions |
| Path Coverage | 100% of state paths | 4/4 STATE_PATHS verified |
| Migration Coverage | 100% of scenarios | 5/5 scenarios (S1-S5) + EXDEV |
| Export Coverage | 100% of bridge | 184/184 exports verified |
| Agent Coverage | 100% of agents | 16/16 agents verified |
| Skill Coverage | 100% of skills | 27/27 skills verified |
| Hook Coverage | 100% of hooks | 10/10 events verified |

### 10.2 Pass Rate Targets

| Category | Target | Minimum | Weight |
|----------|:------:|:-------:|:------:|
| P0 (Must) | 100% | 100% | 64.1% |
| P1 (Should) | 100% | 95% | 19.0% |
| P2 (Could) | 100% | 90% | 10.9% |
| Regression | 100% | 100% | 2.2% |
| Overall | 100% | 99% | 100% |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-01 | Initial draft — 920 TC design, 5 QA agents, migration scenario matrices | CTO Lead (cto-lead, opus) |
