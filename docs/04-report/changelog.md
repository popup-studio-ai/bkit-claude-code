# Changelog

All notable changes and reports are documented here.

## [2026-03-18] - bkit v1.6.2 Test Completion - 1,186 TC, 99.7% Pass Rate, Zero Failures

### Added
- **Test Coverage Expansion** (+161 TC, +15.7%)
  - 6 new test files: post-compaction.test.js (15 TC), stop-failure.test.js (15 TC), plugin-data.test.js (20 TC), agents-effort.test.js (29 TC), session-restore.test.js (10 TC), plugin-data-perf.test.js (6 TC)
  - Updated 6 existing test files: hooks-12.test.js (+2 TC), agents-29.test.js (+16 TC), other-modules.test.js (+2 TC), export-compat.test.js (+4 TC), agent-frontmatter.test.js (+5 TC), cc-compat.test.js (+4 TC)
  - 100% coverage of v1.6.2 changes: PostCompact hook, StopFailure hook, PLUGIN_DATA backup/restore, effort/maxTurns frontmatter

- **Hook Events Coverage** (12/12 ✅)
  - HK-11: PostCompact hook validation
  - HK-12: StopFailure hook validation
  - All 12 hooks.json events verified

- **Agent Expansion Coverage** (29/29 ✅)
  - AG-22~AG-29: 8 new agents (pdca-eval-plan, pdca-eval-design, pdca-eval-do, pdca-eval-check, pdca-eval-act, pdca-eval-pm, skill-needs-extractor, pm-lead-skill-patch)
  - Effort/maxTurns validation for all 29 agents
  - Tier-based consistency checks (Tier 1/2/3 agent rules)

- **PLUGIN_DATA Functions** (2/2 ✅)
  - backupToPluginData: PD-03~PD-10 (8 TC)
  - restoreFromPluginData: PD-11~PD-18 (8 TC)
  - Performance benchmarks: PP-01~PP-06 (6 TC, <100ms baseline)

- **Hook Scripts Functional** (30 TC)
  - post-compaction.js: PC-01~PC-15 (PDCA status snapshot validation)
  - stop-failure-handler.js: SF-01~SF-15 (error classification + recovery)
  - SessionStart → restore integration: SR-01~SR-10

- **ENH Items Coverage** (14/14 ✅)
  - Agent model parameter restoration
  - ExitWorktree tool support
  - Skill hooks verification
  - Effort/maxTurns agent frontmatter
  - + 10 additional enhancement items

### Changed
- **File Renames** (backward compatible)
  - regression/hooks-10.test.js → regression/hooks-12.test.js
  - regression/agents-21.test.js → regression/agents-29.test.js
  - test/run-all.js: Updated file references, TC expectations

- **Version Updates**
  - plugin.json: 1.6.1 → 1.6.2
  - bkit.config.json: 1.6.1 → 1.6.2
  - CC compatibility: 44 consecutive releases (v2.1.29 ~ v2.1.72+)

### Test Results
- **Overall**: 1,186 TC, 1,182 PASS, 0 FAIL, 4 SKIP (99.7% pass rate)
- **Category Breakdown**:
  - Unit: 555/555 (100.0%)
  - Integration: 134/134 (100.0%)
  - Security: 85/85 (100.0%)
  - Regression: 192/192 (100.0%)
  - Performance: 72/76 (94.7%, 4 pre-existing SKIP)
  - Philosophy: 58/58 (100.0%)
  - UX: 60/60 (100.0%)
  - E2E: 26/26 (100.0%)

- **v1.6.1 Comparison**:
  - v1.6.1: 1,025 TC, 99.6% pass rate
  - v1.6.2: 1,186 TC, 99.7% pass rate (+161 TC, +0.1% improvement)
  - Regression: 0 failures from migration

### Files Modified
- Test files: 15 (6 updated, 6 new, 1 runner updated)
- Total test code: ~2,500 LOC added/modified
- All changes backward compatible (existing TC IDs preserved)

### Verification
- **Design Match Rate**: 100% (all plan items implemented)
- **Hook Events Verified**: 12/12 ✅
- **Agents Verified**: 29/29 ✅
- **Exports Verified**: 210+ ✅
- **Frontmatter Fields**: effort (29/29) + maxTurns (29/29) ✅
- **ENH Item Coverage**: 14/14 ✅
- **CC Compatibility**: 44+ consecutive releases, ZERO breaking changes ✅

### Documentation
- Completion report: `docs/04-report/features/bkit-v162-test.report.md`
- Plan doc: `docs/01-plan/features/bkit-v162-test.plan.md`
- Design doc: `docs/02-design/features/bkit-v162-test.design.md`

### Quality Metrics
- Automation First: 100% (0 manual tests)
- No Guessing: assert-based verification throughout
- Docs=Code: Test IDs = Specification

### Verdict
**ALL TESTS PASSED** - bkit v1.6.2 is ready for release with 99.7% pass rate and 100% change coverage.

---

## [2026-03-08] - bkit v1.6.1 Enhancement - CC v2.1.69+ Compatibility + Skills 2.0 Quality + CE Level 5

### Added
- **CTO/PM Orchestration Redesign** (Issue #41 fix)
  - Main Session as CTO pattern to bypass CC v2.1.69+ nested spawn restriction
  - `lib/team/coordinator.js`: 7 new exports (buildAgentTeamPlan, getFileOwnership, generateTeammatePrompt, generateTaskPlan, etc.)
  - Agent Teams TeamCreate integration for CTO/PM team composition
  - Architecture Notes in `agents/cto-lead.md` and `agents/pm-lead.md`

- **Skill Evals 28/28 Full Implementation**
  - `evals/runner.js`: parseEvalYaml(), evaluateAgainstCriteria(), runEval() (real evaluation engine)
  - `evals/reporter.js`: formatDetailedReport() with skill category breakdown
  - 56 content files: 28 × prompt-1.md + 28 × expected-1.md (workflow/capability/hybrid categories)
  - `node evals/runner.js --benchmark` achieves 28/28 PASS (100% coverage)

- **Agent Security Hardening**
  - 3-Tier Security Model for 9 acceptEdits agents
  - Tier 1 (Starter Guide): disallowedTools [Bash]
  - Tier 2 (5 Expert Agents): disallowedTools [Bash(rm -rf), Bash(git push), Bash(git reset --hard)]
  - Tier 3 (QA/Iterator): unchanged (Bash required)

### Changed
- **P0 Bug Fixes** (4 items: No Guessing, Automation First, Config Sync, Security)
  - M-01: `ambiguity.js` — shouldClarify property added for automatic clarification detection
  - M-03: `trigger.js` — confidenceThreshold hardcoded 0.8 removed, now reads from config
  - M-02/M-06: `creator.js` — PDCA phases array unified (includes act phase), imports fixed
  - M-07: Agent `disallowedTools` settings applied to 6 experts + 1 guide

- **Config-Code Synchronization** (M-05)
  - `lib/team/orchestrator.js`: PHASE_PATTERN_MAP now loads from bkit.config.json at runtime
  - Config-first pattern: bkit.config.json is Single Source of Truth
  - selectOrchestrationPattern() with config fallback logic

- **Skills PDCA Enhancement**
  - `skills/pdca/SKILL.md`: agents.team = null, agents.pm = null (Main Session as Team Lead)
  - Team action: Agent Teams orchestration (not nested subagent)
  - PM action: PM Agent Team orchestration (4 sub-agent pattern)

### Fixed
- **Critical Issue #41**: CC v2.1.69+ nested subagent spawn restriction
  - `/pdca team` CTO mode was completely broken
  - Now works via Main Session CTO orchestration pattern
  - Maintains 37 consecutive compatible releases streak

- **Config Read Failure**: confidenceThreshold not reflected in trigger decisions
- **Array Inconsistency**: PDCA phases missing 'act' phase in task creation
- **Security Gaps**: 8 acceptEdits agents without explicit tool restrictions
- **Stub System**: Evals always returned true (non-functional quality validation)

### Test Results
- **Design Match Rate**: 100% (26/26 items) ✅
- **Gap Analysis**: 1 iteration (GAP-01 fixed: SKILL.md agents.team/pm null)
- **Evals Coverage**: 28/28 PASS (100%)
  - Workflow Skills: 10/10
  - Capability Skills: 16/16
  - Hybrid Skills: 2/2
- **E2E Testing**: `/pdca team` verified on CC v2.1.71
- **Overall**: 100% completion, 0 open gaps

### Files Modified
- New: 56 content files (evals/)
- Core: lib/team/coordinator.js (7 new exports), lib/team/orchestrator.js (M-05 config sync)
- Bugfixes: lib/intent/ambiguity.js (M-01), lib/intent/trigger.js (M-03), lib/task/creator.js (M-02/M-06)
- Agents: agents/cto-lead.md, agents/pm-lead.md, agents/starter-guide.md, agents/enterprise-expert.md, agents/frontend-architect.md, agents/infra-architect.md, agents/bkend-expert.md (M-07 security)
- Skills: skills/pdca/SKILL.md (agents.team/pm null, M-08)
- Other: scripts/user-prompt-handler.js (Team Mode message), evals/runner.js, evals/reporter.js
- **Total**: 72 files, ~1,400 LOC changed

### Metrics Improvement
| Metric | Before | After | Change |
|--------|:------:|:-----:|:------:|
| CTO Team Status | ❌ Broken | ✅ Working | Critical fix |
| P0 Bugs | 4 | 0 | -100% |
| Evals Coverage | 4% (1/28) | 100% (28/28) | +96% |
| Config-Code Alignment | ~60% | 95%+ | +35% |
| Agent Security | 1/9 (11%) | 9/9 (100%) | +89% |
| CE Score | 80.8 (L4) | 90+ (L5) | Level up |

### Context Engineering Best Practices
- Rich Context in Spawn Prompts: Full project context + file ownership
- 5-6 Tasks per Agent: Optimized teammate productivity
- File Ownership Boundaries: Prevent concurrent edits
- Context Window Management: ~60% utilization (prevent context rot)

### Breaking Changes
- None (backward compatible, minor version)

### Documentation
- Completion report: `docs/04-report/features/bkit-v161-enhancement.report.md`
- Analysis report: `docs/03-analysis/bkit-v161-enhancement.analysis.md`
- Design doc: `docs/02-design/features/bkit-v161-enhancement.design.md`
- Plan doc: `docs/01-plan/features/bkit-v161-enhancement.plan.md`

### CC Compatibility
- Tested: v2.1.69, v2.1.70, v2.1.71
- Fixed for: CC v2.1.69+ nested spawn restriction
- Maintains: 37 consecutive compatible releases (v2.1.34~v2.1.71)

---

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

