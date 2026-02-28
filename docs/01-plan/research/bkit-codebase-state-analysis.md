# bkit Codebase & State File Analysis

**Date**: 2026-03-01
**Analyst**: codebase-analyst (Task #3)
**Purpose**: Complete inventory of all state files, dependency mapping, and .bkit/ migration impact assessment
**bkit Version**: v1.5.7

---

## 1. Complete State File Inventory

### 1.1 State Files Summary Table

| # | File Path | Type | Size | Git Tracked | Lifecycle | Risk Level |
|---|-----------|------|------|-------------|-----------|------------|
| 1 | `docs/.bkit-memory.json` | Persistent state | ~1.4KB | Yes (committed) | Cross-session | HIGH |
| 2 | `docs/.pdca-status.json` | Persistent state | ~4.7KB | Yes (committed) | Cross-session | HIGH |
| 3 | `docs/.pdca-snapshots/*.json` | Backup snapshots | ~10 files | No (.gitignore) | Per-compaction | LOW |
| 4 | `.bkit/agent-state.json` | Runtime state | ~0.7KB | No (.gitignore) | Per-session | LOW |
| 5 | `bkit.config.json` | Configuration | ~5.5KB | Yes (committed) | Static | CRITICAL |
| 6 | `.claude-plugin/plugin.json` | Plugin manifest | ~0.6KB | Yes (committed) | Static | CRITICAL |
| 7 | `hooks/hooks.json` | Hook definitions | ~3.5KB | Yes (committed) | Static | CRITICAL |
| 8 | `~/.claude/bkit/user-config.json` | User config | N/A (not created) | N/A | User-level | MEDIUM |

### 1.2 Additional State Sources (In-Memory Only)

| Source | Module | Persistence | Description |
|--------|--------|-------------|-------------|
| `_sessionContext` | `lib/context-hierarchy.js` | In-memory only | Session-level context (cleared on start) |
| `_memoryCache` | `lib/memory-store.js` | In-memory + disk | In-memory cache of `.bkit-memory.json` |
| `_store (Map)` | `lib/core/cache.js` | In-memory only | Global TTL cache (5s default) |
| `_hierarchyCache` | `lib/context-hierarchy.js` | In-memory only | Context hierarchy cache (5s TTL) |
| Context Forks | `lib/context-fork.js` | In-memory only | Skill context fork state |

---

## 2. Detailed File Analysis

### 2.1 `docs/.bkit-memory.json` — bkit Memory Store

**Schema (v1.5.7)**:
```json
{
  "sessionCount": 202,
  "lastSession": { "startedAt": "ISO", "platform": "claude", "level": "Starter" },
  "lastReport": { "feature": "...", "date": "YYYY-MM-DD", "path": "..." },
  "previousPDCA": { "feature": "...", "phase": "completed", "matchRate": 100, ... },
  "currentPDCA": { "feature": "...", "phase": "do", ... },
  "versionNote": "...",
  "pipelineStatus": { "currentPhase": null, "completedPhases": [1-9], ... }
}
```

**Readers (5 files)**:
| File | Function | Usage |
|------|----------|-------|
| `lib/memory-store.js:38` | `loadMemory()` | Primary read via `getMemoryFilePath()` |
| `lib/pdca/status.js:703` | `readBkitMemory()` | Direct read via `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` |
| `hooks/session-start.js:182-201` | via `memoryStore.getMemory()` | Session count tracking on startup |
| `scripts/phase5-design-stop.js:79` | via `lib.readBkitMemory()` | Update after design phase |
| `scripts/phase9-deploy-stop.js:88` | via `lib.readBkitMemory()` | Update after deployment phase |

**Writers (5 files)**:
| File | Function | Usage |
|------|----------|-------|
| `lib/memory-store.js:62` | `saveMemory()` | Primary write |
| `lib/pdca/status.js:722` | `writeBkitMemory()` | Direct write |
| `hooks/session-start.js:185-192` | via `memoryStore.setMemory()` | Update session count + last session |
| `scripts/phase5-design-stop.js:91` | via `lib.writeBkitMemory()` | Save design phase result |
| `scripts/phase6-ui-stop.js:102` | via `lib.writeBkitMemory()` | Save UI phase result |
| `scripts/phase9-deploy-stop.js:113` | via `lib.writeBkitMemory()` | Save deployment result |

**Path Construction**:
- `lib/memory-store.js:28`: `path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json')`
- `lib/pdca/status.js:705`: `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')`
- `hooks/session-start.js:609`: Hardcoded string reference in context output

**Key Observations**:
- Two independent access paths exist: `memory-store.js` (higher-level API with caching) and `pdca/status.js` (direct read/write)
- Both construct the path identically using `PROJECT_DIR + 'docs' + '.bkit-memory.json'`
- The `memory-store.js` module has its own in-memory cache (`_memoryCache`) separate from `globalCache`
- No config-based path lookup; path is hardcoded in 2 modules

---

### 2.2 `docs/.pdca-status.json` — PDCA Status (Central State)

**Schema (v2.0)**:
```json
{
  "version": "2.0",
  "lastUpdated": "ISO",
  "activeFeatures": ["feature-name"],
  "primaryFeature": "feature-name",
  "features": {
    "feature-name": {
      "phase": "plan|design|do|check|act|completed|archived",
      "phaseNumber": 1-6,
      "matchRate": 0-100,
      "iterationCount": 0,
      "requirements": [],
      "documents": { "plan": "path", "design": "path", ... },
      "timestamps": { "started": "ISO", "lastUpdated": "ISO" }
    }
  },
  "pipeline": { "currentPhase": 1-9, "level": "Dynamic", "phaseHistory": [] },
  "session": { "startedAt": "ISO", "onboardingCompleted": false, "lastActivity": "ISO" },
  "history": [{ "timestamp": "ISO", "feature": "", "phase": "", "action": "" }]
}
```

**Central Path Function**: `lib/pdca/status.js:31-34`
```javascript
function getPdcaStatusPath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, 'docs/.pdca-status.json');
}
```

**Readers (16+ files)** — This is the most heavily referenced state file:
| File | Function | Usage |
|------|----------|-------|
| `lib/pdca/status.js` | `getPdcaStatusFull()` | Primary read with cache + auto-migration |
| `lib/pdca/status.js` | `loadPdcaStatus()` | Alias for getPdcaStatusFull |
| `lib/task/tracker.js:199` | `findPdcaStatus()` | Direct path check |
| `hooks/session-start.js:334` | `detectPdcaPhase()` | Regex parse for currentPhase |
| `hooks/session-start.js:163` | via `getPdcaStatusFull()` | Onboarding check |
| `scripts/iterator-stop.js:55` | via `getPdcaStatusFull()` | Post-iteration status |
| `scripts/gap-detector-stop.js:65` | via `getPdcaStatusFull()` | Gap analysis result |
| `scripts/cto-stop.js:21` | via `getPdcaStatusFull()` | CTO team stop cleanup |
| `scripts/team-stop.js:22` | via `getPdcaStatusFull()` | Team session stop |
| `scripts/team-idle-handler.js:45` | via `getPdcaStatusFull()` | Idle team guidance |
| `scripts/pdca-task-completed.js:79` | via `getPdcaStatusFull()` | Task completion check |
| `scripts/unified-stop.js:85,116` | via `getPdcaStatusFull()` | Stop hook processing |
| `scripts/context-compaction.js:35` | via `getPdcaStatusFull(true)` | Snapshot creation |
| `scripts/code-review-stop.js:26` | via `common.getPdcaStatusFull()` | Code review context |
| `scripts/pdca-skill-stop.js:153` | via `getPdcaStatusFull()` | Skill completion |
| `scripts/subagent-start-handler.js:72` | via `getPdcaStatusFull()` | Agent init context |
| `scripts/phase3-mockup-stop.js:15` | via `loadPdcaStatus()` | Phase 3 check |
| `scripts/phase-transition.js:95` | via `loadPdcaStatus()` | Pipeline phase transition |

**Writers (5 files)**:
| File | Function | Usage |
|------|----------|-------|
| `lib/pdca/status.js:175` | `savePdcaStatus()` | Central save function |
| `lib/pdca/status.js:114` | `initPdcaStatusIfNotExists()` | Initial creation |
| `scripts/phase-transition.js:151` | via `savePdcaStatus()` | Pipeline phase updates |
| `scripts/archive-feature.js:111` | via `updatePdcaStatus()` | Archive status |
| (All callers of `updatePdcaStatus`, `addPdcaHistory`, etc.) | via `savePdcaStatus()` | Indirect writes |

**Path References Total**: 6 distinct files reference the path `docs/.pdca-status.json`

**Key Observations**:
- Most frequently accessed state file in the entire codebase (16+ readers)
- All reads go through `getPdcaStatusFull()` which has 3-second TTL caching via `globalCache`
- Schema migration from v1.0 to v2.0 is built-in
- `hooks/session-start.js:334` has an independent path construction: `path.join(process.cwd(), 'docs/.pdca-status.json')` (uses `process.cwd()` instead of `PROJECT_DIR`)
- `lib/task/tracker.js:199` also has an independent path: `path.join(PROJECT_DIR, 'docs/.pdca-status.json')`
- History is capped at 100 entries
- Feature limit enforced at 50 features

---

### 2.3 `docs/.pdca-snapshots/` — Context Compaction Snapshots

**Schema**: Each snapshot is a full copy of `.pdca-status.json` wrapped in metadata:
```json
{
  "timestamp": "ISO",
  "reason": "compaction|auto|manual",
  "status": { /* full pdca-status.json content */ }
}
```

**Creator**: `scripts/context-compaction.js:46-69` (single writer)
- Path: `path.join(PROJECT_DIR, 'docs', '.pdca-snapshots')`
- Filename pattern: `snapshot-{Date.now()}.json`
- Retention: Last 10 snapshots (older ones auto-deleted)

**Reader**: None programmatically. Snapshots are for manual recovery only.

**Git Status**: Listed in `.gitignore` (`docs/.pdca-snapshots/`)

**Key Observations**:
- Pure backup mechanism, no code reads these files
- Already in `docs/` subdirectory, could easily move to `.bkit/snapshots/`
- 10-file rotation limit keeps disk usage controlled

---

### 2.4 `.bkit/agent-state.json` — Agent Teams Runtime State

**Schema (v1.0)**:
```json
{
  "version": "1.0",
  "enabled": false,
  "teamName": "",
  "feature": "...",
  "pdcaPhase": "plan|design|do|check|act",
  "orchestrationPattern": "leader|council|swarm|watchdog",
  "ctoAgent": "opus",
  "startedAt": "ISO",
  "lastUpdated": "ISO",
  "teammates": [{ "name": "", "role": "", "model": "", "status": "", ... }],
  "progress": { "totalTasks": 0, "completedTasks": 0, ... },
  "recentMessages": [{ "from": "", "to": "", "content": "", "timestamp": "" }],
  "sessionId": ""
}
```

**Path Function**: `lib/team/state-writer.js:70-73`
```javascript
function getAgentStatePath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'agent-state.json');
}
```

**Readers (3 files)**:
| File | Function |
|------|----------|
| `lib/team/state-writer.js:79` | `readAgentState()` |
| `scripts/subagent-start-handler.js:70` | via `stateWriter.readAgentState()` |
| `scripts/subagent-stop-handler.js:59` | via `teamModule.readAgentState()` |
| `scripts/unified-stop.js:218` | via `teamModule.readAgentState()` |

**Writers**: `lib/team/state-writer.js:97` `writeAgentState()` — single writer with atomic write (tmp + rename)

**Git Status**: `.bkit/` directory is in `.gitignore`

**Key Observations**:
- Already lives in `.bkit/` directory (the only state file that does)
- Uses atomic write pattern (write to `.tmp`, then `rename`)
- Max 10 teammates, max 50 messages (ring buffer)
- Cleaned up on session end (`cleanupAgentState()` sets `enabled: false`, clears teammates)
- Designed for Studio IPC (external tool integration)

---

### 2.5 `bkit.config.json` — Main Configuration

**Location**: Project root (`/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json`)

**Config Loading Strategy** (2 fallback paths):
```
1. PROJECT_DIR/bkit.config.json (project override)
2. PLUGIN_ROOT/bkit.config.json (plugin default)
```

**Readers (4 files)**:
| File | Function | Path Used |
|------|----------|-----------|
| `lib/core/config.js:39-40` | `loadConfig()` | Both PROJECT_DIR + PLUGIN_ROOT |
| `lib/context-hierarchy.js:61,97` | `loadContextLevel()` | PLUGIN_ROOT (plugin level) + PROJECT_DIR (project level) |
| `lib/team/coordinator.js:30` | `getTeamConfig()` | via `getConfig()` |
| `hooks/session-start.js:213` | Direct check | `path.join(process.cwd(), 'bkit.config.json')` |

**Key PDCA Path Configurations**:
```json
{
  "pdca": {
    "statusFile": "docs/.pdca-status.json",
    "designDocPaths": ["docs/02-design/features/{feature}.design.md", ...],
    "planDocPaths": ["docs/01-plan/features/{feature}.plan.md", ...]
  }
}
```

**Important**: The `pdca.statusFile` config key exists but is **NOT used by code**. The actual path is hardcoded in `lib/pdca/status.js:33`. This is a dormant config field.

---

### 2.6 `.claude-plugin/plugin.json` — Plugin Manifest

```json
{
  "name": "bkit",
  "version": "1.5.7",
  "description": "Vibecoding Kit - PDCA methodology + CTO-Led Agent Teams + ...",
  "author": { "name": "POPUP STUDIO PTE. LTD.", ... },
  "outputStyles": "./output-styles/"
}
```

**Reader**: Claude Code plugin system (external). Not read by bkit code directly.
**Migration Impact**: Cannot move — Claude Code expects this at `.claude-plugin/plugin.json`.

---

### 2.7 `hooks/hooks.json` — Hook Definitions

**Reader**: Claude Code hook system (external) + `hooks/session-start.js:248` (self-check for UserPromptSubmit bug)
**Migration Impact**: Cannot move — Claude Code discovers this via plugin system path.

---

## 3. Dependency Graph

```
                     ┌──────────────────────────────────────────┐
                     │          Claude Code Runtime             │
                     │  (reads plugin.json, hooks.json)         │
                     └────────┬─────────────┬───────────────────┘
                              │             │
                    ┌─────────▼──────┐  ┌───▼────────────┐
                    │ .claude-plugin/│  │ hooks/          │
                    │ plugin.json    │  │ hooks.json      │
                    │ (IMMOVABLE)    │  │ (IMMOVABLE)     │
                    └────────────────┘  └───┬────────────┘
                                            │
                              ┌─────────────▼──────────────────────┐
                              │    Hook Scripts (10 events)         │
                              │  session-start.js                   │
                              │  user-prompt-handler.js             │
                              │  context-compaction.js              │
                              │  unified-stop.js, etc.              │
                              └─────┬──────────┬───────────────────┘
                                    │          │
                    ┌───────────────▼┐    ┌────▼────────────────┐
                    │ bkit.config.json│    │ lib/common.js       │
                    │ (config source) │    │ (180 exports bridge)│
                    └───────┬────────┘    └────┬────────────────┘
                            │                  │
                   ┌────────▼──────┐    ┌──────▼──────────────────┐
                   │lib/core/      │    │lib/pdca/                │
                   │ config.js     │    │ status.js (CENTRAL HUB) │
                   │ cache.js      │    │ phase.js                │
                   │ platform.js   │    │ automation.js           │
                   └───────────────┘    └───┬──────┬──────────────┘
                                            │      │
                      ┌─────────────────────▼┐  ┌──▼───────────────────┐
                      │ docs/.pdca-status.json│  │docs/.bkit-memory.json│
                      │ (16+ readers)         │  │(5 readers, 5 writers)│
                      │ (MOST REFERENCED)     │  │                      │
                      └──────────┬────────────┘  └──────────────────────┘
                                 │
                      ┌──────────▼────────────┐
                      │docs/.pdca-snapshots/  │
                      │(backup, no readers)   │
                      └───────────────────────┘

                      ┌───────────────────────┐
                      │.bkit/agent-state.json │
                      │(team runtime state)   │
                      │(ALREADY IN .bkit/)    │
                      └───────────────────────┘
```

---

## 4. Path Reference Count Analysis

| State File | Hardcoded Path Refs | Config-Based Refs | Total Refs |
|------------|--------------------:|------------------:|-----------:|
| `docs/.pdca-status.json` | 4 (status.js, session-start.js, tracker.js, bkit.config.json) | 0 (config key exists but unused) | 4 |
| `docs/.bkit-memory.json` | 3 (memory-store.js, status.js, session-start.js) | 0 | 3 |
| `docs/.pdca-snapshots/` | 1 (context-compaction.js) | 0 | 1 |
| `.bkit/agent-state.json` | 1 (state-writer.js) | 0 | 1 |
| `bkit.config.json` | 3 (config.js, context-hierarchy.js, session-start.js) | 0 | 3 |
| `docs/01-plan/features/` | 3 (phase.js, archive-feature.js, gap-detector-stop.js) | 1 (bkit.config.json) | 4 |
| `docs/02-design/features/` | 4 (phase.js, archive-feature.js, pdca-post-write.js, design-validator-pre.js) | 1 (bkit.config.json) | 5 |
| `docs/03-analysis/` | 5 (phase.js, archive-feature.js, gap-detector-stop.js, analysis-stop.js, qa-monitor-post.js) | 0 | 5 |
| `docs/04-report/` | 3 (phase.js, archive-feature.js) | 0 | 3 |
| `docs/archive/` | 1 (archive-feature.js) | 0 | 1 |

---

## 5. .bkit/ Migration Impact Assessment

### 5.1 Migration Candidates

| File | Current Path | Proposed .bkit/ Path | Files to Update | Risk |
|------|-------------|---------------------|----------------:|------|
| bkit-memory.json | `docs/.bkit-memory.json` | `.bkit/memory.json` | 3 modules | MEDIUM |
| pdca-status.json | `docs/.pdca-status.json` | `.bkit/pdca-status.json` | 4 modules | HIGH |
| pdca-snapshots/ | `docs/.pdca-snapshots/` | `.bkit/snapshots/` | 1 module | LOW |
| agent-state.json | `.bkit/agent-state.json` | `.bkit/agent-state.json` | 0 (already there) | NONE |

### 5.2 IMMOVABLE Files (Claude Code Dependency)

| File | Reason | Notes |
|------|--------|-------|
| `.claude-plugin/plugin.json` | Claude Code plugin discovery mechanism | Fixed path, cannot change |
| `hooks/hooks.json` | Claude Code hook discovery mechanism | Fixed path, cannot change |
| `bkit.config.json` | Used by both plugin and project contexts | Could add .bkit/ as fallback path |

### 5.3 Detailed Migration Risk: `docs/.bkit-memory.json` -> `.bkit/memory.json`

**Files requiring update** (3):
1. `lib/memory-store.js:28` — Change `path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json')` to `.bkit/memory.json`
2. `lib/pdca/status.js:705,724` — Change both `readBkitMemory()` and `writeBkitMemory()` paths
3. `hooks/session-start.js:609` — Update hardcoded string in context output

**Migration Strategy**:
- Create a single `getMemoryPath()` function that all modules use
- Add backward compatibility: check `.bkit/memory.json` first, fall back to `docs/.bkit-memory.json`
- One-time auto-migration: if old path exists and new doesn't, copy and delete old

**Breaking Changes**: None if backward compatibility is maintained. Existing committed `docs/.bkit-memory.json` in git history would need migration.

### 5.4 Detailed Migration Risk: `docs/.pdca-status.json` -> `.bkit/pdca-status.json`

**Files requiring update** (4):
1. `lib/pdca/status.js:33` — Central `getPdcaStatusPath()` function (ONE CHANGE covers most readers/writers)
2. `hooks/session-start.js:334` — Independent `path.join(process.cwd(), 'docs/.pdca-status.json')` (must update separately)
3. `lib/task/tracker.js:199` — Independent `path.join(PROJECT_DIR, 'docs/.pdca-status.json')`
4. `bkit.config.json:34` — Config key `pdca.statusFile` (currently unused but should match)

**Migration Strategy**:
- Update `getPdcaStatusPath()` in `lib/pdca/status.js` — this covers 16+ consumers automatically
- Fix 2 independent path constructions in `session-start.js` and `tracker.js` to use `getPdcaStatusPath()`
- Update `bkit.config.json` to match new path
- Add auto-migration: check new path first, fall back to `docs/.pdca-status.json`

**Breaking Changes**: HIGH — This file is git-tracked and committed. Moving it changes the repo structure. External tools or user scripts referencing this path would break.

### 5.5 Detailed Migration Risk: `docs/.pdca-snapshots/` -> `.bkit/snapshots/`

**Files requiring update** (1):
1. `scripts/context-compaction.js:46` — Change snapshot directory path

**Migration Strategy**: Simple path change. Already in `.gitignore`. No backward compatibility needed.

**Breaking Changes**: None.

---

## 6. PDCA Document Structure Analysis

### 6.1 Document Tree
```
docs/
├── .bkit-memory.json          # bkit state (cross-session)
├── .pdca-status.json          # PDCA lifecycle state
├── .pdca-snapshots/           # Compaction backups (gitignored)
├── 01-plan/
│   ├── features/              # Per-feature plan docs
│   │   ├── {feature}.plan.md
│   │   └── ...
│   └── research/              # Research documents (new for v1.5.8)
├── 02-design/
│   └── features/
│       └── {feature}.design.md
├── 03-analysis/
│   ├── {feature}.analysis.md  # Direct path (legacy)
│   └── features/
│       └── {feature}.analysis.md  # Nested path (newer)
├── 04-report/
│   ├── {feature}.report.md    # Direct path
│   └── features/
│       └── {feature}.report.md
├── archive/
│   └── YYYY-MM/
│       └── {feature}/
│           └── *.md
└── guides/
```

### 6.2 Path Resolution Pattern
All PDCA deliverable paths support 2 lookup patterns (see `lib/pdca/phase.js:143-160`):
1. `docs/{phase}/features/{feature}.{phase}.md` (preferred)
2. `docs/{phase}/{feature}.{phase}.md` (legacy fallback)

These are also configurable in `bkit.config.json` under `pdca.designDocPaths` and `pdca.planDocPaths`, but the config is only used for plan/design. Check and report phases use hardcoded paths in `lib/pdca/phase.js`.

---

## 7. Hooks Lifecycle State Analysis

### 7.1 Hook Events Used (10/17)

| Event | Script | State Read | State Write |
|-------|--------|------------|-------------|
| SessionStart | `hooks/session-start.js` | pdca-status, bkit-memory | bkit-memory (session count) |
| UserPromptSubmit | `scripts/user-prompt-handler.js` | None (pure analysis) | None |
| PreToolUse (Write/Edit) | `scripts/pre-write.js` | None | None |
| PreToolUse (Bash) | `scripts/unified-bash-pre.js` | None | None |
| PostToolUse (Write) | `scripts/unified-write-post.js` | pdca-status (indirect) | None |
| PostToolUse (Bash) | `scripts/unified-bash-post.js` | None | None |
| PostToolUse (Skill) | `scripts/skill-post.js` | pdca-status | pdca-status |
| Stop | `scripts/unified-stop.js` | pdca-status, agent-state | pdca-status, agent-state |
| PreCompact | `scripts/context-compaction.js` | pdca-status | pdca-snapshots |
| TaskCompleted | `scripts/pdca-task-completed.js` | pdca-status | pdca-status |
| SubagentStart | `scripts/subagent-start-handler.js` | pdca-status, agent-state | agent-state |
| SubagentStop | `scripts/subagent-stop-handler.js` | agent-state | agent-state |
| TeammateIdle | `scripts/team-idle-handler.js` | pdca-status | None |

### 7.2 Hook Execution State
- No persistent state file tracks hook execution
- Hook state is purely transient (stdin -> process -> stdout)
- No hook execution log beyond `debugLog()` writes
- Each hook script is stateless; all state comes from reading `.pdca-status.json` or `.bkit-memory.json`

---

## 8. Path Centralization Assessment

### 8.1 Current State: Path Construction Patterns

| Pattern | Count | Example |
|---------|------:|---------|
| Via `getPdcaStatusPath()` | 12+ | Most scripts via `getPdcaStatusFull()` |
| Independent `path.join(process.cwd(), ...)` | 2 | `session-start.js:334`, `session-start.js:213` |
| Independent `path.join(PROJECT_DIR, ...)` | 2 | `tracker.js:199`, hardcoded in status.js |
| Via `getMemoryFilePath()` | 2 | `memory-store.js` module |
| Via `getAgentStatePath()` | 3 | `state-writer.js` module |

### 8.2 Recommendation: Centralized Path Registry

A single path registry in `lib/core/paths.js` would centralize all state file paths:

```javascript
// Proposed: lib/core/paths.js
const PATHS = {
  PDCA_STATUS: () => path.join(PROJECT_DIR, '.bkit', 'pdca-status.json'),
  BKIT_MEMORY: () => path.join(PROJECT_DIR, '.bkit', 'memory.json'),
  AGENT_STATE: () => path.join(PROJECT_DIR, '.bkit', 'agent-state.json'),
  PDCA_SNAPSHOTS: () => path.join(PROJECT_DIR, '.bkit', 'snapshots'),
  // Config paths (immovable)
  BKIT_CONFIG: () => path.join(PROJECT_DIR, 'bkit.config.json'),
  PLUGIN_JSON: () => path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  HOOKS_JSON: () => path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'),
  // PDCA docs (user content, should stay in docs/)
  PLAN_DOCS: (feature) => `docs/01-plan/features/${feature}.plan.md`,
  DESIGN_DOCS: (feature) => `docs/02-design/features/${feature}.design.md`,
  ANALYSIS_DOCS: (feature) => `docs/03-analysis/features/${feature}.analysis.md`,
  REPORT_DOCS: (feature) => `docs/04-report/features/${feature}.report.md`,
};
```

This change would:
- Reduce hardcoded paths from 11+ locations to 1
- Make `.bkit/` migration a single-line change per path
- Enable the `bkit.config.json` `pdca.statusFile` config to actually work

---

## 9. Recommended Migration Order

| Order | File | Difficulty | Reason |
|------:|------|-----------|--------|
| 0 | `.bkit/agent-state.json` | NONE | Already in place |
| 1 | `docs/.pdca-snapshots/` | TRIVIAL | 1 file to update, gitignored, no readers |
| 2 | `docs/.bkit-memory.json` | EASY | 3 files to update, well-contained API |
| 3 | `docs/.pdca-status.json` | MEDIUM | 4 files to update but `getPdcaStatusPath()` covers 16+ consumers |
| 4 | Path registry creation | MEDIUM | New module, all path references need refactoring |
| -- | PDCA docs (01-plan, etc.) | NOT RECOMMENDED | User content, should stay in docs/ |
| -- | plugin.json, hooks.json | IMPOSSIBLE | Claude Code enforced paths |

---

## 10. Breaking Change Analysis

### 10.1 Git-Tracked State Files
Both `.bkit-memory.json` and `.pdca-status.json` are git-tracked (committed). Moving them:
- Changes the repo structure in a PR
- Existing clones will have files in old locations
- Need auto-migration logic in `SessionStart` hook

### 10.2 External Tool Dependencies
- **bkit Studio IPC**: Reads `.bkit/agent-state.json` (already in `.bkit/`, no change needed)
- **User scripts**: Unknown. Users may have scripts referencing `docs/.pdca-status.json`
- **CI/CD**: No known CI integration, but possible

### 10.3 Backward Compatibility Strategy
For each moved file:
1. **SessionStart hook**: Check if old path exists + new path doesn't exist -> auto-migrate
2. **Read functions**: Check new path first, fall back to old path
3. **Write functions**: Always write to new path
4. **Deprecation period**: 1 release cycle (v1.5.8 migrates, v1.6.0 removes old path support)

### 10.4 `.gitignore` Changes Required
```diff
- # bkit runtime state (agent-state.json)
- .bkit/
+ # bkit state directory (runtime + persistent state)
+ # Individual files tracked selectively:
+ # .bkit/agent-state.json - gitignored (runtime)
+ # .bkit/snapshots/ - gitignored (backups)
+ # .bkit/memory.json - git-tracked (cross-session)
+ # .bkit/pdca-status.json - git-tracked (PDCA lifecycle)
+ .bkit/agent-state.json
+ .bkit/snapshots/
```

This requires removing the blanket `.bkit/` gitignore and selectively ignoring runtime-only files.

---

## 11. Key Findings Summary

1. **5 state files** exist across 3 locations (`docs/`, `.bkit/`, project root)
2. **`docs/.pdca-status.json`** is the most critical file with 16+ readers across the codebase
3. **Path centralization is poor**: 3 independent path constructions for pdca-status, 2 for bkit-memory
4. **`bkit.config.json` has a dormant `pdca.statusFile` config** that is never used by code
5. **`.bkit/agent-state.json` already follows the target pattern** and can serve as the model
6. **Migration is feasible** with the recommended order: snapshots -> memory -> status -> path registry
7. **Backward compatibility** requires auto-migration in SessionStart hook
8. **`.gitignore` strategy must change** from blanket `.bkit/` ignore to selective file ignoring
9. **PDCA document paths (docs/01-plan, etc.) should NOT move to `.bkit/`** — they are user content
10. **Plugin-external files (plugin.json, hooks.json) cannot move** — enforced by Claude Code
