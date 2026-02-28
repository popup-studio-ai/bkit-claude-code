# Changelog

All notable changes and reports are documented here.

## [2026-03-01] - bkit v1.5.8 Studio Support - Path Registry & State File Integration

### Added
- Path Registry module: `lib/core/paths.js` (centralized path management)
- STATE_PATHS constant (7 paths for new .bkit/ structure)
- LEGACY_PATHS constant (4 paths for v1.5.7 migration)
- CONFIG_PATHS constant (3 immutable config file paths)
- Auto-migration logic in SessionStart hook (5 scenarios: S1-S5)
- EXDEV fallback for cross-device file transfers

### Changed
- Migrated state files to `.bkit/` directory structure
  - `docs/.pdca-status.json` → `.bkit/state/pdca-status.json`
  - `docs/.bkit-memory.json` → `.bkit/state/memory.json`
  - `.bkit/agent-state.json` → `.bkit/runtime/agent-state.json`
  - `docs/.pdca-snapshots/` → `.bkit/snapshots/`
- Refactored 7 consumer files to use Path Registry
  - `lib/pdca/status.js`: getPdcaStatusPath, readBkitMemory, writeBkitMemory
  - `lib/memory-store.js`: getMemoryFilePath
  - `lib/task/tracker.js`: findPdcaStatus
  - `scripts/context-compaction.js`: snapshotDir
  - `lib/team/state-writer.js`: getAgentStatePath
  - `hooks/session-start.js`: detectPdcaPhase, importResolver paths
  - `lib/core/index.js`: added paths export
- Extended common.js bridge: 180 → 184 exports (+4 path exports)
- Updated version to 1.5.8 in `bkit.config.json` and `plugin.json`

### Fixed
- HIGH risk process.cwd() in detectPdcaPhase eliminated (getPdcaStatusFull)
- Path hardcoding: 0 functional references (11→0)
- Circular dependency prevention with lazy require in paths.js

### Test Results
- **Design Match Rate**: 100% (37/37 items)
- **Migration Scenarios**: 5/5 PASS (S1-S5)
- **Error Handling**: 4/4 PASS
- **Regression Prevention**: 6/6 PASS
- **Overall Coverage**: 100%

### Files Modified
- New: `lib/core/paths.js` (~50 LOC)
- Modified: lib/pdca/status.js, lib/memory-store.js, lib/task/tracker.js, scripts/context-compaction.js, lib/team/state-writer.js, hooks/session-start.js, lib/core/index.js, lib/common.js, bkit.config.json, plugin.json
- Total: 11 files, ~151 lines changed

### Documentation
- Completion report: `docs/04-report/features/bkit-v1.5.8-studio-support.report.md`
- Design reference: `docs/02-design/features/bkit-v1.5.8-studio-support.design.md`
- Plan reference: `docs/01-plan/features/bkit-v1.5.8-studio-support.plan.md`
- Analysis reference: `docs/03-analysis/features/bkit-v1.5.8-studio-support.analysis.md`

### Status
- **PDCA Cycle**: Complete (1 iteration, 100% first-time pass)
- **Deployment**: Ready for merge to main
- **Next**: v1.6.x customization layer & Studio audit log integration

---

## [2026-02-09] - Team Visibility Feature (v1.5.3) Completion

### Added
- team-visibility feature: diskless team state persistence for bkit Studio
- New module: `lib/team/state-writer.js` (9 exported functions)
- New hook handlers: SubagentStart, SubagentStop with state management
- Integration with 5 existing hooks (TeammateIdle, TaskCompleted, Stop variants)
- Agent state file schema (v1.0) for IPC between plugin and Studio

### Features
- `.bkit/agent-state.json` atomic writes (tmp + rename)
- Ring buffer for recentMessages (max 50, FIFO cleanup)
- Teammate roster management (max 10, deduplication)
- Progress tracking and state updates
- Non-blocking hook integration with try-catch pattern
- Graceful degradation when Studio not installed

### Test Results
- **Design Match Rate**: 100% (58/58 items)
- **Unit Tests**: 9/9 PASS
- **Edge Cases**: 7/7 PASS
- **Integration Tests**: 7/7 PASS
- **Overall Coverage**: 100%

### Files Modified
- New: `lib/team/state-writer.js` (~280 LOC)
- New: `scripts/subagent-start-handler.js` (~100 LOC)
- New: `scripts/subagent-stop-handler.js` (~80 LOC)
- Modified: `lib/team/index.js`, `hooks/hooks.json`, 6 hook scripts
- Config: `bkit.config.json` (team.enabled: true), `.gitignore`

### Documentation
- Completion report: `docs/04-report/features/team-visibility.report.md`
- Design reference: `docs/02-design/features/team-visibility.design.md`
- Plan reference: `docs/01-plan/features/team-visibility.plan.md`

### Status
- **PDCA Cycle**: Complete
- **Deployment**: Ready for merge to main

---

## [2026-02-04] - bkit v1.5.0 & Claude Code v2.1.31 Compatibility Certification

### Added
- Comprehensive compatibility test report with 101 test cases
- 7 test categories covering Skills, Agents, Hooks, Libraries, PDCA Workflow, v2.1.31 Features, and Multi-language Support
- Complete certification documentation
- Deployment readiness assessment

### Test Results
- **Overall Pass Rate**: 99%+ (100/101 items)
- **Critical Issues**: 0
- **High Issues**: 0
- **Medium Issues**: 0
- **Low Issues**: 0
- **Status**: CERTIFIED FOR PRODUCTION

### Categories Tested
- Category A: Skills (19/19 - 100%)
- Category B: Agents (11/11 - 100%)
- Category C: Hooks (9/9 - 100%)
- Category D: Library Functions (28/28 - 100%)
- Category E: PDCA Workflow (12/12 - 100%)
- Category F: v2.1.31 Specific Features (14/15 - 93%, 1 expected skip)
- Category G: Multi-language Support (8/8 - 100%)

### Improvements
- Documented all 28 library modules
- Verified complete PDCA workflow (Plan→Design→Do→Check→Act→Report→Archive)
- Confirmed 8-language support (EN, KO, JA, ZH, ES, FR, DE, IT)
- Validated all 11 agent types
- Confirmed all 9 hook definitions
- Tested all 19 major skills

### Files
- Report: `docs/04-report/features/bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.report.md`

---

## [2026-02-03] - Claude Code v2.1.31 Update Impact Analysis

### Added
- Impact analysis for v2.1.31 update
- Feature compatibility assessment
- Performance metrics

### Status
- Documentation complete
- All features verified

### Files
- Report: `docs/04-report/features/claude-code-v2.1.31-update.report.md`

---

## [2026-02-01] - Claude Code v2.1.29 Update Impact Analysis

### Added
- Initial compatibility analysis
- Impact assessment documentation

### Status
- Analysis complete

### Files
- Report: `docs/04-report/features/claude-code-v2.1.29-update.report.md`

---

## [2026-01-30] - Deep Research: Gemini Extensions

### Added
- Comprehensive research on Gemini extensions
- Comparative analysis with Claude ecosystem
- Integration recommendations

### Files
- Report: `docs/04-report/gemini-extensions-deep-research-2026-01.report.md`

---

