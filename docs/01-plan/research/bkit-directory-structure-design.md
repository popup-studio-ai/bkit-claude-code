# .bkit/ Directory Structure Design

**Date**: 2026-03-01
**Analyst**: codebase-analyst (Task #4)
**Based on**: Task #3 Codebase State Analysis
**Purpose**: Design the consolidated `.bkit/` directory structure for bkit v1.5.8

---

## 1. Design Principles

1. **Separation of Concerns**: Runtime state vs persistent state vs user content
2. **Minimal Migration Risk**: Backward compatible with auto-migration
3. **No Conflict with `.claude/`**: Clear boundary between Claude Code's directory and bkit's
4. **Git-Tracking Strategy**: Runtime files gitignored, lifecycle state tracked
5. **Single Source of Truth**: One centralized path registry module

---

## 2. Proposed .bkit/ Directory Structure

```
.bkit/                              # bkit state directory (SINGLE LOCATION)
├── memory.json                     # (MIGRATED from docs/.bkit-memory.json)
│                                   # Cross-session persistent state
│                                   # Git: TRACKED
│
├── pdca-status.json                # (MIGRATED from docs/.pdca-status.json)
│                                   # PDCA lifecycle state (v2.0 schema)
│                                   # Git: TRACKED
│
├── agent-state.json                # (EXISTING, no change)
│                                   # Team runtime state for Studio IPC
│                                   # Git: IGNORED (runtime-only)
│
├── snapshots/                      # (MIGRATED from docs/.pdca-snapshots/)
│   └── snapshot-{timestamp}.json   # Context compaction backups (max 10)
│                                   # Git: IGNORED (backups)
│
└── .gitignore                      # Selective gitignore within .bkit/
```

### 2.1 Proposed `.bkit/.gitignore`

```gitignore
# Runtime state (session-scoped, not for version control)
agent-state.json
agent-state.json.tmp

# Backup snapshots (auto-generated, recoverable)
snapshots/
```

This approach uses a **nested .gitignore** inside `.bkit/` which:
- Allows `memory.json` and `pdca-status.json` to be git-tracked
- Ignores runtime-only files (agent-state, snapshots)
- Replaces the blanket `.bkit/` entry in the root `.gitignore`

### 2.2 Root `.gitignore` Change

```diff
- # bkit runtime state (agent-state.json)
- .bkit/
+ # bkit state directory (selective tracking via .bkit/.gitignore)
+ # memory.json and pdca-status.json are tracked
+ # agent-state.json and snapshots/ are ignored via .bkit/.gitignore
```

---

## 3. File-by-File Migration Plan

### 3.1 `docs/.bkit-memory.json` -> `.bkit/memory.json`

**Current Path References** (3 modules):

| Module | Line | Current Path | Change Required |
|--------|------|-------------|-----------------|
| `lib/memory-store.js:28` | `getMemoryFilePath()` | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` | Use centralized path |
| `lib/pdca/status.js:705,724` | `readBkitMemory()`, `writeBkitMemory()` | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` | Use centralized path |
| `hooks/session-start.js:609` | Context string | Hardcoded display text | Update string only |

**Migration Logic** (in SessionStart hook):
```javascript
// Auto-migration: old path -> new path
const oldPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
const newPath = path.join(PROJECT_DIR, '.bkit', 'memory.json');
if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  fs.renameSync(oldPath, newPath);
}
```

### 3.2 `docs/.pdca-status.json` -> `.bkit/pdca-status.json`

**Current Path References** (4 modules):

| Module | Line | Current Path | Change Required |
|--------|------|-------------|-----------------|
| `lib/pdca/status.js:33` | `getPdcaStatusPath()` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | **Central change** (covers 16+ consumers) |
| `hooks/session-start.js:334` | `detectPdcaPhase()` | `path.join(process.cwd(), 'docs/.pdca-status.json')` | Refactor to use `getPdcaStatusPath()` |
| `lib/task/tracker.js:199` | `findPdcaStatus()` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | Refactor to use `getPdcaStatusPath()` |
| `bkit.config.json:34` | Config key | `"statusFile": "docs/.pdca-status.json"` | Update to `.bkit/pdca-status.json` |

**Key Insight**: Changing `getPdcaStatusPath()` in `lib/pdca/status.js` automatically updates ALL 16+ consumer scripts that read/write via `getPdcaStatusFull()`, `savePdcaStatus()`, etc. Only 2 independent path constructions need separate fixes.

### 3.3 `docs/.pdca-snapshots/` -> `.bkit/snapshots/`

**Current Path References** (1 module):

| Module | Line | Current Path |
|--------|------|-------------|
| `scripts/context-compaction.js:46` | `snapshotDir` | `path.join(PROJECT_DIR, 'docs', '.pdca-snapshots')` |

**Trivial change**: Single line update. Already gitignored. No backward compatibility needed.

### 3.4 `.bkit/agent-state.json` — No Change

Already in the correct location. `lib/team/state-writer.js:72` already uses `path.join(PROJECT_DIR, '.bkit', 'agent-state.json')`.

---

## 4. Centralized Path Registry Design

### 4.1 New Module: `lib/core/paths.js`

```javascript
/**
 * Centralized Path Registry
 * @module lib/core/paths
 * @version 1.5.8
 *
 * Single source of truth for all bkit state file paths.
 * Migration-friendly: change paths here, all consumers update.
 */

const path = require('path');
const fs = require('fs');

let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('./platform'); }
  return _platform;
}

// State files (in .bkit/)
const STATE_PATHS = {
  /** PDCA lifecycle status */
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'pdca-status.json'),

  /** Cross-session memory store */
  memory: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'memory.json'),

  /** Agent Teams runtime state */
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'agent-state.json'),

  /** Context compaction snapshots directory */
  snapshots: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),

  /** .bkit directory root */
  root: () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
};

// Legacy paths (for backward compatibility migration)
const LEGACY_PATHS = {
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-status.json'),
  memory: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.bkit-memory.json'),
  snapshots: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-snapshots'),
};

// Config files (immovable)
const CONFIG_PATHS = {
  bkitConfig: () => path.join(getPlatform().PROJECT_DIR, 'bkit.config.json'),
  pluginConfig: () => path.join(getPlatform().PLUGIN_ROOT, 'bkit.config.json'),
  pluginJson: () => path.join(getPlatform().PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson: () => path.join(getPlatform().PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

// PDCA document paths (user content, stays in docs/)
const DOC_PATHS = {
  plan: (feature) => [
    `docs/01-plan/features/${feature}.plan.md`,
    `docs/01-plan/${feature}.plan.md`
  ],
  design: (feature) => [
    `docs/02-design/features/${feature}.design.md`,
    `docs/02-design/${feature}.design.md`
  ],
  analysis: (feature) => [
    `docs/03-analysis/features/${feature}.analysis.md`,
    `docs/03-analysis/${feature}.analysis.md`
  ],
  report: (feature) => [
    `docs/04-report/features/${feature}.report.md`,
    `docs/04-report/${feature}.report.md`
  ],
  archive: (feature) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return `docs/archive/${dateStr}/${feature}`;
  }
};

/**
 * Ensure .bkit/ directory exists
 */
function ensureBkitDir() {
  const bkitDir = STATE_PATHS.root();
  if (!fs.existsSync(bkitDir)) {
    fs.mkdirSync(bkitDir, { recursive: true });
  }
}

/**
 * Auto-migrate legacy state files to .bkit/
 * Called once during SessionStart
 * @returns {{ migrated: string[], errors: string[] }}
 */
function migrateStatFiles() {
  const migrated = [];
  const errors = [];

  ensureBkitDir();

  // Migrate each state file
  for (const key of ['pdcaStatus', 'memory']) {
    const oldPath = LEGACY_PATHS[key]();
    const newPath = STATE_PATHS[key]();

    if (fs.existsSync(oldPath) && !fs.existsSync(newPath)) {
      try {
        // Ensure parent directory exists
        fs.mkdirSync(path.dirname(newPath), { recursive: true });
        // Move file (atomic on same filesystem)
        fs.renameSync(oldPath, newPath);
        migrated.push(key);
      } catch (e) {
        // Fallback: copy + delete
        try {
          fs.copyFileSync(oldPath, newPath);
          fs.unlinkSync(oldPath);
          migrated.push(key);
        } catch (e2) {
          errors.push(`${key}: ${e2.message}`);
        }
      }
    }
  }

  // Migrate snapshots directory
  const oldSnapDir = LEGACY_PATHS.snapshots();
  const newSnapDir = STATE_PATHS.snapshots();
  if (fs.existsSync(oldSnapDir) && !fs.existsSync(newSnapDir)) {
    try {
      fs.renameSync(oldSnapDir, newSnapDir);
      migrated.push('snapshots');
    } catch (e) {
      errors.push(`snapshots: ${e.message}`);
    }
  }

  return { migrated, errors };
}

module.exports = {
  STATE_PATHS,
  LEGACY_PATHS,
  CONFIG_PATHS,
  DOC_PATHS,
  ensureBkitDir,
  migrateStatFiles,
};
```

### 4.2 Integration Points

| Current Module | Current Function | Change |
|---------------|-----------------|--------|
| `lib/pdca/status.js:33` | `getPdcaStatusPath()` | Return `STATE_PATHS.pdcaStatus()` |
| `lib/memory-store.js:28` | `getMemoryFilePath()` | Return `STATE_PATHS.memory()` |
| `lib/team/state-writer.js:72` | `getAgentStatePath()` | Return `STATE_PATHS.agentState()` |
| `scripts/context-compaction.js:46` | inline path | Use `STATE_PATHS.snapshots()` |
| `hooks/session-start.js:334` | `detectPdcaPhase()` | Use `getPdcaStatusPath()` instead of inline |
| `lib/task/tracker.js:199` | `findPdcaStatus()` | Use `getPdcaStatusPath()` instead of inline |
| `lib/pdca/phase.js:143-160` | `checkPhaseDeliverables()` | Use `DOC_PATHS.*()` |
| `scripts/archive-feature.js:47-52` | inline paths | Use `DOC_PATHS.*()` |

---

## 5. Relationship with `.claude/` Directory

### 5.1 Current `.claude/` Contents (Claude Code owned)

| Path | Purpose | bkit Interaction |
|------|---------|-----------------|
| `.claude/settings.json` | Project permissions | Read-only by bkit |
| `.claude/settings.local.json` | Local user settings | Not accessed by bkit |
| `.claude/agent-memory/` | Agent long-term memory | Written by CC agent memory system |
| `.claude/agents/` | Agent definitions | Read by CC |
| `.claude/skills/` | Skill definitions | Read by CC |
| `.claude/commands/` | Custom commands | Read by CC |
| `.claude/bkit-debug.log` | Debug log output | Written by bkit `debugLog()` |

### 5.2 Boundary Rules

| Concern | `.claude/` | `.bkit/` |
|---------|-----------|---------|
| **Owner** | Claude Code platform | bkit plugin |
| **Purpose** | AI platform config, agent memory | Plugin state, PDCA lifecycle |
| **Git tracking** | `.claude/` is gitignored (root .gitignore) | Selective (memory + status tracked) |
| **Session scope** | Platform-managed | Plugin-managed |
| **External access** | Claude Code only | Studio IPC (agent-state.json) |

### 5.3 No Conflict Zones

- `.claude/agent-memory/` contains agent memory (MEMORY.md per agent) -- this is Claude Code's auto-memory feature, completely separate from `.bkit/memory.json` (bkit's session/PDCA state)
- `.claude/bkit-debug.log` is the ONLY bkit-written file in `.claude/` -- could optionally move to `.bkit/debug.log` but low priority
- No name collisions exist between the two directories

---

## 6. Rejected Alternatives

### 6.1 Rejected: `.bkit/config.json` (merge with `bkit.config.json`)

**Reason**: `bkit.config.json` serves dual purpose:
1. Plugin default config (in PLUGIN_ROOT) -- read by Claude Code plugin system
2. Project override config (in PROJECT_DIR) -- read by project

Moving it to `.bkit/config.json` would:
- Break the plugin config discovery (PLUGIN_ROOT location)
- Add confusion about which config takes precedence
- Not align with Claude Code conventions (other plugins use root-level config)

**Decision**: Keep `bkit.config.json` at project root. Keep as-is.

### 6.2 Rejected: `.bkit/hooks-state.json` (new hook lifecycle tracking)

**Reason**: Hooks are stateless by design. Each hook execution is:
1. Triggered by Claude Code event
2. Reads stdin (event data)
3. Processes (reads state files if needed)
4. Writes stdout (response)
5. Exits

Adding hook execution state tracking would:
- Add write I/O to every hook execution (3-5 hooks per user prompt)
- Create a new state file that needs lifecycle management
- Provide minimal value (debug log already tracks hook execution)

**Decision**: No new state file. Use existing `debugLog()` for hook tracking.

### 6.3 Rejected: `.bkit/session.json` (new session state)

**Reason**: Session state is already tracked in multiple places:
- `_sessionContext` in `lib/context-hierarchy.js` (in-memory, fast)
- `lastSession` in `.bkit/memory.json` (persisted)
- `session` object in `.bkit/pdca-status.json` (persisted)

Adding a dedicated session file would:
- Duplicate existing data
- Add another file to manage
- Not provide new capabilities

**Decision**: No new session state file. Existing mechanisms are sufficient.

---

## 7. Implementation Order

### Phase 1: Path Registry (No file moves)
1. Create `lib/core/paths.js` with `STATE_PATHS`, `LEGACY_PATHS`, `CONFIG_PATHS`, `DOC_PATHS`
2. Update `lib/core/index.js` to export paths module
3. Update `lib/common.js` bridge to re-export path functions
4. **Zero behavioral change** -- all paths still point to current locations

### Phase 2: Consumer Refactoring (No file moves)
1. Update `lib/pdca/status.js:33` `getPdcaStatusPath()` -> use `STATE_PATHS.pdcaStatus()`
2. Update `lib/memory-store.js:28` `getMemoryFilePath()` -> use `STATE_PATHS.memory()`
3. Fix `hooks/session-start.js:334` to use `getPdcaStatusPath()` instead of inline path
4. Fix `lib/task/tracker.js:199` to use `getPdcaStatusPath()` instead of inline path
5. **Zero behavioral change** -- paths still resolve to same locations

### Phase 3: File Migration (Actual moves)
1. Update `STATE_PATHS` in `lib/core/paths.js` to point to `.bkit/` locations
2. Add `migrateStatFiles()` call to `hooks/session-start.js`
3. Create `.bkit/.gitignore` with selective ignoring
4. Update root `.gitignore` to remove blanket `.bkit/` ignore
5. Update `bkit.config.json` `pdca.statusFile` to match new path
6. **Behavioral change**: Files physically move on first session after update

### Phase 4: Cleanup (Next release)
1. Remove `LEGACY_PATHS` backward compatibility
2. Remove migration logic from SessionStart
3. Remove old path fallback from read functions
4. Update documentation and MEMORY.md

---

## 8. Testing Checklist

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| TC-01 | Fresh install (no state files) | `.bkit/` created with empty state files |
| TC-02 | Existing install (files in docs/) | Auto-migrated to `.bkit/` on first session |
| TC-03 | Partial migration (some files moved) | Only unmigrated files are moved |
| TC-04 | Both old and new paths exist | New path takes precedence |
| TC-05 | Read PDCA status after migration | All 16+ consumers work correctly |
| TC-06 | Write PDCA status after migration | Written to `.bkit/pdca-status.json` |
| TC-07 | Agent Teams with new paths | `agent-state.json` unchanged |
| TC-08 | Context compaction | Snapshots saved to `.bkit/snapshots/` |
| TC-09 | Archive feature | PDCA docs stay in docs/, status updated in .bkit/ |
| TC-10 | Git status after migration | memory.json and pdca-status.json tracked, agent-state ignored |
| TC-11 | Studio IPC | agent-state.json path unchanged |
| TC-12 | Debug log | No regression in `.claude/bkit-debug.log` |

---

## 9. Summary

| Aspect | Current State | Proposed State |
|--------|--------------|----------------|
| State file locations | 3 directories (docs/, .bkit/, root) | 1 directory (.bkit/) |
| Path management | 11+ hardcoded paths | 1 centralized registry (lib/core/paths.js) |
| Git tracking | Blanket .bkit/ ignore | Selective (.gitignore inside .bkit/) |
| Migration risk | N/A | LOW (auto-migration + backward compat) |
| Files to update | N/A | Phase 1: 3 files, Phase 2: 4 files, Phase 3: 4 files |
| Breaking changes | N/A | None (backward compatible for 1 release cycle) |
