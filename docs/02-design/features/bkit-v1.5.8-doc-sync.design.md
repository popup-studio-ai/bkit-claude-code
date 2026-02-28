# Design: bkit v1.5.8 Document Synchronization

## Feature Information
- **Feature Name**: bkit-v1.5.8-doc-sync
- **Version**: v1.5.8
- **Date**: 2026-03-01
- **Author**: Claude (PDCA)
- **Plan Reference**: docs/01-plan/features/bkit-v1.5.8-doc-sync.plan.md

## Change Summary

| Category | Files | Key Changes |
|----------|:-----:|------------|
| Config/Version | 4 | Version 1.5.7 → 1.5.8, CHANGELOG 추가 |
| JSDoc @version | 40 | @version 1.5.7 → 1.5.8 |
| Agent Docs | 10 | Feature Guidance v1.5.7 → v1.5.8 |
| bkit-system Docs | 7 | Version history, 182→186 exports |
| Guides | 2 | Version reference update |
| Commands | 1 | Version reference update |
| Session Start | 1 | User-facing section headers |
| **Total** | **65** | |

## Architecture Numbers (v1.5.8 Verified)

| Metric | Old (v1.5.7) | New (v1.5.8) | Verification |
|--------|:------------:|:------------:|:------------|
| common.js exports | 182 | **186** | `node -e "console.log(Object.keys(require('./lib/common')).length)"` |
| Core module exports | 41 | **45** | +4 path exports |
| CC recommended | v2.1.59 | **v2.1.63** | hooks/session-start.js |
| Skills | 27 | 27 | No change |
| Agents | 16 | 16 | No change |
| Hook Events | 10 | 10 | No change |
| Scripts | 45 | 45 | No change |

---

## Phase 1: Config/Version Files (4 files)

### 1.1 README.md

**Change 1: Version Badge (line 5)**
```
OLD: [![Version](https://img.shields.io/badge/Version-1.5.7-green.svg)](CHANGELOG.md)
NEW: [![Version](https://img.shields.io/badge/Version-1.5.8-green.svg)](CHANGELOG.md)
```

**Change 2: CC Version Badge (line 4)**
```
OLD: [![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.59+-purple.svg)]
NEW: [![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.63+-purple.svg)]
```

**Change 3: Features List - Add v1.5.8 entry (after line 63)**
```markdown
- **Studio Support & Path Registry (v1.5.8)** - Centralized state file path management (lib/core/paths.js), state directory migration to `.bkit/{state,runtime,snapshots}/`, auto-migration with EXDEV fallback, 186 exports
```

**Change 4: Export Count (line 64)**
```
OLD: ENH-48~51 enhancements, 182 exports
NEW: ENH-48~51 enhancements, 186 exports
```

**Change 5: CC Requirements (line 113)**
```
OLD: | **Claude Code** | **v2.1.59+** | Required (v2.1.63+ recommended).
NEW: | **Claude Code** | **v2.1.63+** | Required. bkit uses hook events (`TeammateIdle`, `TaskCompleted`) introduced in v2.1.33, auto-memory (v2.1.59), and benefits from 13 memory leak fixes (v2.1.63). |
```

### 1.2 CHANGELOG.md

**Add [1.5.8] entry before [1.5.6] (after line 7)**

```markdown
## [1.5.8] - 2026-03-01

### Added
- **Studio Support: Path Registry** (`lib/core/paths.js`)
  - Centralized state file path management replacing 11+ hardcoded path references
  - STATE_PATHS (7 keys): root, state, runtime, snapshots, pdcaStatus, memory, agentState
  - LEGACY_PATHS (4 keys): pdcaStatus, memory, snapshots, agentState (deprecated, v1.6.0 removal)
  - CONFIG_PATHS (3 keys): bkitConfig, pluginJson, hooksJson
  - `ensureBkitDirs()` for recursive directory creation
- **State Directory Migration**
  - `docs/.pdca-status.json` → `.bkit/state/pdca-status.json`
  - `docs/.bkit-memory.json` → `.bkit/state/memory.json`
  - `.bkit/agent-state.json` → `.bkit/runtime/agent-state.json`
  - `docs/.pdca-snapshots/` → `.bkit/snapshots/`
- **Auto-Migration on SessionStart**
  - Automatic v1.5.7 → v1.5.8 state file migration
  - EXDEV cross-filesystem fallback (copy + delete)
  - Per-file try-catch isolation for resilience
  - Idempotent operation (safe to re-run)

### Changed
- **lib/core/index.js**: Added paths module (+4 exports: STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs)
- **lib/common.js**: Bridge updated (182 → 186 exports, +4 path re-exports)
- **lib/pdca/status.js**: `getPdcaStatusPath()`, `readBkitMemory()`, `writeBkitMemory()` use STATE_PATHS
- **lib/memory-store.js**: `getMemoryFilePath()` uses STATE_PATHS.memory()
- **lib/task/tracker.js**: `findPdcaStatus()` uses getPdcaStatusPath() via lazy require
- **lib/team/state-writer.js**: `getAgentStatePath()` uses STATE_PATHS.agentState()
- **scripts/context-compaction.js**: snapshotDir uses STATE_PATHS.snapshots()
- **hooks/session-start.js**: Auto-migration logic (+45 lines), v1.5.8 context sections
- **bkit.config.json**: `pdca.statusFile` updated to `.bkit/state/pdca-status.json`

### Quality
- Comprehensive Test: 865 TC, 815 PASS, 0 FAIL, 50 SKIP (100%)
- 5 QA agents parallel execution, 1 iteration (hooks.json version fix)
- Design match rate: 100% (37/37 items)

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.63
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.7] - 2026-02-28

### Added
- **/simplify + /batch PDCA Integration** (ENH-52~55)
  - CC built-in /simplify command integrated into PDCA Check→Report flow
  - /batch multi-feature PDCA for Enterprise parallel processing
  - CC_COMMAND_PATTERNS: 8-language CC command awareness
  - HTTP Hooks documentation and guidance (type "http" in hooks config)
- **English Conversion**
  - 3 stop scripts converted to English output (code-review-stop, learning-stop, pdca-skill-stop)

### Changed
- **CC recommended version**: v2.1.59 → v2.1.63
- **Version**: 1.5.6 → 1.5.7
  - `plugin.json`, `bkit.config.json`, `hooks.json`, `session-start.js`

### Quality
- Comprehensive Test: 754 TC, 100% pass rate
- Doc-sync: 42 JS files + 5 doc files synchronized

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.63
- Node.js: Minimum v18.0.0
```

### 1.3 marketplace.json

**Change 1: Root version (line 4)**
```
OLD: "version": "1.5.7",
NEW: "version": "1.5.8",
```

**Change 2: bkit plugin version (line 37)**
```
OLD: "version": "1.5.7",
NEW: "version": "1.5.8",
```

### 1.4 CUSTOMIZATION-GUIDE.md

**Change 1: Component Inventory header (line 131)**
```
OLD: ### Component Inventory (v1.5.7)
NEW: ### Component Inventory (v1.5.8)
```

**Change 2: Version description (line 201)**
```
OLD: > **v1.5.7**: Claude Code Exclusive with CTO-Led Agent Teams...
NEW: > **v1.5.8**: Claude Code Exclusive with CTO-Led Agent Teams (16 agents), Plan Plus skill, bkend MCP Accuracy Fix (28+ tools), Output Styles, Agent Memory, Team Visibility, /simplify + /batch PDCA integration, auto-memory support, HTTP hooks awareness, Studio Support (Path Registry, state directory migration)
```

**Change 3: Plugin Structure header (line 733)**
```
OLD: ### bkit Plugin Structure Example (v1.5.7 - Claude Code Exclusive)
NEW: ### bkit Plugin Structure Example (v1.5.8 - Claude Code Exclusive)
```

---

## Phase 2: JSDoc @version Bulk Update (40 files)

### Method
`Edit` with `replace_all: true` per file: `@version 1.5.7` → `@version 1.5.8`

### lib/ Files (32 files)

| # | File | Line |
|---|------|:----:|
| 1 | lib/core/cache.js | 4 |
| 2 | lib/core/config.js | 4 |
| 3 | lib/core/debug.js | 4 |
| 4 | lib/core/file.js | 4 |
| 5 | lib/core/io.js | 4 |
| 6 | lib/core/platform.js | 4 |
| 7 | lib/pdca/automation.js | 4 |
| 8 | lib/pdca/index.js | 4 |
| 9 | lib/pdca/level.js | 4 |
| 10 | lib/pdca/phase.js | 4 |
| 11 | lib/pdca/tier.js | 4 |
| 12 | lib/intent/ambiguity.js | 4 |
| 13 | lib/intent/index.js | 4 |
| 14 | lib/intent/language.js | 4 |
| 15 | lib/intent/trigger.js | 4 |
| 16 | lib/task/classification.js | 4 |
| 17 | lib/task/context.js | 4 |
| 18 | lib/task/creator.js | 4 |
| 19 | lib/task/index.js | 4 |
| 20 | lib/team/communication.js | 4 |
| 21 | lib/team/coordinator.js | 4 |
| 22 | lib/team/cto-logic.js | 4 |
| 23 | lib/team/hooks.js | 4 |
| 24 | lib/team/index.js | 4 |
| 25 | lib/team/orchestrator.js | 4 |
| 26 | lib/team/strategy.js | 4 |
| 27 | lib/team/task-queue.js | 4 |
| 28 | lib/context-fork.js | 6 |
| 29 | lib/context-hierarchy.js | 6 |
| 30 | lib/import-resolver.js | 6 |
| 31 | lib/permission-manager.js | 6 |
| 32 | lib/skill-orchestrator.js | 12 |

### scripts/ Files (8 files)

| # | File | Line |
|---|------|:----:|
| 33 | scripts/skill-post.js | 8 |
| 34 | scripts/user-prompt-handler.js | 6 |
| 35 | scripts/learning-stop.js | 7 |
| 36 | scripts/pdca-skill-stop.js | 9 |
| 37 | scripts/phase5-design-stop.js | 8 |
| 38 | scripts/phase6-ui-stop.js | 11 |
| 39 | scripts/phase9-deploy-stop.js | 10 |
| 40 | scripts/code-review-stop.js | 7 |

### Excluded (already v1.5.8 or intentionally v1.4.0)
- lib/common.js (already v1.5.8)
- lib/core/index.js (already v1.5.8)
- lib/core/paths.js (already v1.5.8)
- lib/pdca/status.js (already v1.5.8)
- lib/memory-store.js (already v1.5.8)
- lib/task/tracker.js (already v1.5.8)
- lib/team/state-writer.js (already v1.5.8)
- scripts/context-compaction.js (already v1.5.8)
- scripts/gap-detector-stop.js (@version 1.4.0, intentional)
- scripts/iterator-stop.js (@version 1.4.0, intentional)

---

## Phase 3: Documentation Update (20 files)

### 3.1 Agent Documentation (10 files)

**Pattern**: Replace section header + add v1.5.8 content

```
OLD: ## v1.5.7 Feature Guidance
NEW: ## v1.5.8 Feature Guidance
```

Add after header:
```markdown
- **v1.5.8 Studio Support**: Path Registry centralizes state file paths. State files moved to `.bkit/{state,runtime,snapshots}/`. Auto-migration handles v1.5.7 → v1.5.8 transition.
```

| # | File | Line |
|---|------|:----:|
| 1 | agents/starter-guide.md | 115 |
| 2 | agents/pipeline-guide.md | 136 |
| 3 | agents/gap-detector.md | 317 |
| 4 | agents/enterprise-expert.md | 235 |
| 5 | agents/pdca-iterator.md | 344 |
| 6 | agents/design-validator.md | 208 |
| 7 | agents/qa-monitor.md | 328 |
| 8 | agents/infra-architect.md | 170 |
| 9 | agents/code-analyzer.md | 354 |
| 10 | agents/report-generator.md | 240 |

### 3.2 bkit-system Documentation (7 files)

#### bkit-system/README.md
**Change 1 (line 29)**: Add v1.5.8 after v1.5.7 entry
```
ADD: > **v1.5.8**: Studio Support - Path Registry (lib/core/paths.js), state directory migration (.bkit/{state,runtime,snapshots}/), auto-migration with EXDEV fallback, 186 exports
```

**Change 2 (line 189)**: Update ASCII diagram version
```
OLD: bkit Trigger System (v1.5.7)
NEW: bkit Trigger System (v1.5.8)
```

#### bkit-system/_GRAPH-INDEX.md
**Change 1 (line 27)**: Fix v1.5.6 export count reference → add v1.5.7 and v1.5.8
```
After "182 exports" line, add:
> **v1.5.7 /simplify + /batch PDCA Integration**: 184 exports (+generateBatchTrigger, +shouldSuggestBatch)
> **v1.5.8 Studio Support**: Path Registry, state directory migration, 186 exports (+STATE_PATHS, +LEGACY_PATHS, +CONFIG_PATHS, +ensureBkitDirs)
```

**Change 2 (lines 36, 41)**: Update export counts 182 → 186

**Change 3 (line 242)**: Update lib version reference
```
OLD: `lib/common.js` - Shared utility functions (v1.5.3, **241 functions**)
NEW: `lib/common.js` - Shared utility functions (v1.5.8, **186 exports** via bridge)
```

#### bkit-system/components/agents/_agents-overview.md
```
OLD line 3: > List of 16 Agents defined in bkit and their roles (v1.5.7)
NEW line 3: > List of 16 Agents defined in bkit and their roles (v1.5.8)
```
```
OLD line 9: > **v1.5.7**: /simplify + /batch PDCA flow integration, English conversion for stop script outputs
ADD: > **v1.5.8**: Studio Support awareness - Path Registry, state directory migration, 186 exports
```

#### bkit-system/components/skills/_skills-overview.md
```
OLD line 3: > 27 Skills defined in bkit (v1.5.7)
NEW line 3: > 27 Skills defined in bkit (v1.5.8)
```
```
OLD line 7: > **v1.5.7**: /simplify, /batch CC command awareness in skills, CC_COMMAND_PATTERNS integration
ADD: > **v1.5.8**: Studio Support - state file path references updated in PDCA skills
```

#### bkit-system/components/scripts/_scripts-overview.md
```
OLD line 3: > 45 Node.js Scripts used by bkit hooks (v1.5.7)
NEW line 3: > 45 Node.js Scripts used by bkit hooks (v1.5.8)
```
```
OLD line 9: > **v1.5.6**: Auto-memory integration, 182 exports
ADD after line 10: > **v1.5.8**: Path Registry in lib/core/paths.js, auto-migration in session-start.js, 186 exports
```
```
OLD line 75: ├── lib/                       # Modular Library (v1.5.3, 241 functions)
NEW line 75: ├── lib/                       # Modular Library (v1.5.8, 186 exports)
```

#### bkit-system/philosophy/context-engineering.md
**Change 1 (add after line 25)**:
```
> **v1.5.8**: Path Registry (lib/core/paths.js), state directory migration (.bkit/{state,runtime,snapshots}/), 186 exports, auto-migration with EXDEV fallback
```

**Change 2 (line 114)**: Update header
```
OLD: ### Library Modules (14 modules across 5 subdirectories, 182 exports)
NEW: ### Library Modules (15 modules across 5 subdirectories, 186 exports)
```

**Change 3 (line 217)**: Update description
```
OLD: 182 exports across 5 subdirectories
NEW: 186 exports across 5 subdirectories
```

**Change 4 (line 402)**: Update table
```
OLD: | lib/ modules | ... | 5 dirs, 182 exports |
NEW: | lib/ modules | ... | 5 dirs, 186 exports |
```

#### bkit-system/philosophy/core-mission.md
**Change 1 (line 120)**:
```
OLD: ## Current Implementation (v1.5.7)
NEW: ## Current Implementation (v1.5.8)
```

**Change 2 (add after line 126)**:
```
> **v1.5.8**: Studio Support - Path Registry (centralized state paths), state directory migration, auto-migration, 186 exports
```

### 3.3 Guides (2 files)

#### docs/guides/cto-team-memory-guide.md (line 3)
```
OLD: > bkit v1.5.7 | Claude Code v2.1.59+ 권장
NEW: > bkit v1.5.8 | Claude Code v2.1.63+ 권장
```

#### docs/guides/remote-control-compatibility.md (line 3)
```
OLD: > bkit v1.5.7 | Claude Code v2.1.58+ (Remote Control 확대)
NEW: > bkit v1.5.8 | Claude Code v2.1.63+ (Remote Control 확대)
```

### 3.4 Commands (1 file)

#### commands/bkit.md (line 63)
```
OLD: Code Quality (v1.5.7)
NEW: Code Quality (v1.5.8)
```

---

## Phase 4: Session Start Selective Update (1 file)

### hooks/session-start.js

**User-facing sections only** (context output strings). Historical code comments (v1.5.7 Changes: blocks) are preserved.

**Change 1 (line 535)**:
```
OLD: ### CC Built-in Command Integration (v1.5.7)
NEW: ### CC Built-in Command Integration (v1.5.8)
```

**Change 2 (line 632)**:
```
OLD: additionalContext += `## Output Styles (v1.5.7)\n`;
NEW: additionalContext += `## Output Styles (v1.5.8)\n`;
```

**Change 3 (lines 638-639)**:
```
OLD: // Memory Systems (v1.5.7: auto-memory integration ENH-48)
     additionalContext += `## Memory Systems (v1.5.7)\n`;
NEW: // Memory Systems (v1.5.8: auto-memory integration ENH-48)
     additionalContext += `## Memory Systems (v1.5.8)\n`;
```

**Change 4 (line 681)**:
```
OLD: additionalContext += `## Multi-Feature PDCA (v1.5.7)\n`;
NEW: additionalContext += `## Multi-Feature PDCA (v1.5.8)\n`;
```

---

## Phase 5: Verification

### 5.1 JSDoc Verification
```bash
grep -r "@version 1.5.7" --include="*.js" lib/ scripts/
# Expected: 0 results
```

### 5.2 Active Document Verification
```bash
# Check no stale v1.5.7 in active docs (exclude PDCA/research/archive)
grep -r "1\.5\.7" README.md .claude-plugin/ commands/ agents/ bkit-system/ docs/guides/ CUSTOMIZATION-GUIDE.md
# Expected: Only historical references in feature descriptions (e.g., "v1.5.7 added X")
```

### 5.3 Architecture Number Verification
```bash
node -e "console.log(Object.keys(require('./lib/common')).length)"
# Expected: 186
```

### 5.4 New Path References
```bash
# Ensure no active docs reference old paths
grep -rn "docs/\.bkit-memory" README.md agents/ bkit-system/ commands/ CUSTOMIZATION-GUIDE.md
grep -rn "docs/\.pdca-status" README.md agents/ bkit-system/ commands/ CUSTOMIZATION-GUIDE.md
# Expected: 0 results in active docs
```

---

## Implementation Order

```
Phase 1 (Config)     → README, CHANGELOG, marketplace.json, CUSTOMIZATION-GUIDE
Phase 2 (JSDoc)      → 40 files replace_all
Phase 3 (Docs)       → 10 agents + 7 bkit-system + 2 guides + 1 commands
Phase 4 (Session)    → session-start.js selective
Phase 5 (Verify)     → grep verification
```

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| 역사적 참조 오염 | Phase-specific scope로 변경 대상 명확화 |
| CHANGELOG 포맷 오류 | v1.5.6 엔트리 포맷 참조 |
| @version 누락 | Phase 5 grep 검증 |
| Export count 불일치 | Runtime 검증 (node -e) |
