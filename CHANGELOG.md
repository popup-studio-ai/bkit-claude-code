# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2026-03-22

### Fixed — Documentation & Architecture Sync

**Version Alignment**
- Synced `bkit.config.json` version from stale 2.0.0 to match `plugin.json` 2.0.3
- Updated hardcoded version strings in `lib/audit/audit-logger.js` (BKIT_VERSION), `hooks/session-start.js` (systemMessage), `lib/core/paths.js` (meta.json), MCP server packages
- Fixed test expectations for version checks (config-sync, v200-wiring, config-permissions, agents-effort)

**Documentation Sync with v2.0.2 Architecture**
- Updated skill classification across all docs: 9W/25C/2H → **17 Workflow / 18 Capability / 1 Hybrid** (7 new skills classified)
- Updated eval count: 28 → **29** (cc-version-analysis added)
- Updated export count: ~465 → **~580+** (v2.0.0 modules not counted)
- Updated script count in docs: 49 → **54** (5 new hook scripts)
- Updated lib subdirectory references to include `adapters`
- Synced team composition names with cto-lead.md implementation
- Added PR #51 (Impact Analysis section) to v2.0.2 changelog entry

**Test Runner**
- Aligned `test/run-all.js` expected TC counts with actual: Unit 1120→1403, Integration 360→479, Security 130→205, Regression 335→416, Performance 126→160, Philosophy 140→138, UX 150→160, E2E 55→61
- Updated pm-discovery/pm-prd maxTurns expectations: 20→25

### Changed
- Total Test Cases: 3,202 TC (0 failures, 12 skips, 99.6% pass rate)
- CC recommended version: v2.1.81+ (was v2.1.78+)
- PDCA documents: docs/01-plan/ through docs/04-report/

## [2.0.2] - 2026-03-22

### Added — PM Skills Integration + Interactive Checkpoints
- **PM Frameworks 9→43**: Integrated [pm-skills](https://github.com/phuryn/pm-skills) (MIT License) into PM Agent Team — Brainstorm, SWOT, PESTLE, Porter's Five Forces, Pre-mortem, Growth Loops, Customer Journey Map, ICP, Battlecards, User/Job Stories, Test Scenarios, Stakeholder Map
- **PDCA Interactive Checkpoints 1~5**: AskUserQuestion-gated confirmation at Plan (requirements + clarifying questions), Design (3 architecture options selection), Do (implementation scope approval), Check (fix strategy choice: all/critical-only/skip)
- **code-analyzer Confidence-Based Filtering**: Only reports issues with confidence ≥80%, Critical/Important severity classification, filtered count summary
- **CTO Lead Interactive Checkpoints**: v1.7.0 feature-dev pattern for CTO Team sessions
- **btw CTO Team Integration**: teamContext field (isTeamSession, phase, role, pattern), Phase Transition Hook, cto-stop.js session summary with btw stats
- **Design Template Architecture Options**: 3 options comparison table (Option A: Minimal / Option B: Clean / Option C: Pragmatic)
- **pm-prd Template v2.0**: Section 6 Execution Deliverables (Pre-mortem, User Stories, Job Stories, Test Scenarios, Stakeholder Map), SWOT Analysis, Customer Journey Map, ICP, Battlecards, Growth Loops
- **Integration Test**: pm-skills-integration.test.js (50 TC, 100% pass)
- **Plan Template Impact Analysis Section** ([PR #51](https://github.com/popup-studio-ai/bkit-claude-code/pull/51)): Mandatory Section 6 requiring full inventory of existing consumers (CREATE/READ/UPDATE/DELETE) before modifying resources — prevents silent breakage of existing functionality

### Changed
- `agents/pm-discovery.md`: +167 LOC (Brainstorm, Assumption Risk frameworks)
- `agents/pm-strategy.md`: +166 LOC (SWOT, PESTLE, Growth Loops)
- `agents/pm-research.md`: +107 LOC (Customer Journey, ICP)
- `agents/pm-prd.md`: +165 LOC (Pre-mortem, User/Job Stories, Stakeholder Map)
- `agents/pm-lead.md`: +33 LOC (team orchestration improvements)
- `agents/code-analyzer.md`: +19 LOC (Confidence-Based Filtering)
- `agents/cto-lead.md`: +48 LOC (Interactive Checkpoints)
- `skills/pdca/SKILL.md`: +48 LOC (Checkpoints 1~5)
- `skills/btw/SKILL.md`: +42 LOC (CTO Team Integration)
- `scripts/cto-stop.js`: +37 LOC (btw session summary)
- `templates/design.template.md`: +21 LOC (Architecture Options)
- `templates/pm-prd.template.md`: v1.0→v2.0, +136 LOC
- `templates/plan.template.md`: +41 LOC (Section 6 Impact Analysis, section renumbering 6→7→8→9)
- CC recommended version: v2.1.78+ → v2.1.81+
- CC compatibility: v2.1.34~v2.1.81 = 47 consecutive compatible releases

## [2.0.1] - 2026-03-21

### Fixed
- **Cross-Project PDCA State Leakage** ([#48](https://github.com/popup-studio-ai/bkit-claude-code/issues/48)): `restoreFromPluginData()` now validates project identity via `meta.json` before restoring backup, preventing Project A's PDCA state from leaking into Project B
- `backupToPluginData()`: Writes `meta.json` with `projectDir` identifier on every backup
- `restoreFromPluginData()`: 5-stage validation guard (meta exists → parseable → has projectDir → realpathSync normalize → match current project)
- `globalCache`: Cache keys namespaced as `pdca-status:${PROJECT_DIR}` to prevent in-memory pollution across projects

### Added
- `test/unit/project-isolation.test.js`: 10 new test cases for cross-project restore guard
- PDCA documents: plan, design, analysis, report for globalcache-project-isolation

## [2.0.0] - 2026-03-20

### Added — AI Native Development OS
- **Workflow Automation Engine**: Declarative PDCA state machine (20 transitions, 9 guards, 15 actions), YAML workflow DSL with 3 presets (default, hotfix, enterprise), Do phase detection (3-layer), Full-Auto Do (Design→code generation), parallel feature management (max 3), circuit breaker, resume system
- **Controllable AI (L0-L4)**: 5-level automation controller with 10 gate configs, destructive operation detector (8 rules, G-001~G-008), blast radius analyzer (6 rules), checkpoint manager (SHA-256 integrity), loop breaker (4 rules), trust engine (5-component scoring), scope limiter
- **Visualization UX**: CLI dashboard with progress bar, workflow map, agent panel, impact view, control panel, ANSI styling library with NO_COLOR support
- **Architecture Refactoring**: constants.js (33 constants), errors.js (BkitError with 7 domains), state-store.js (atomic writes with file locking), hook-io.js (lightweight Hook I/O), backup-scheduler.js, session-start.js split into 5 startup modules
- **CC Feature Integration**: 6 new hook scripts (SessionEnd, PostToolUseFailure, InstructionsLoaded, ConfigChange, PermissionRequest, Notification)
- **MCP Servers**: bkit-pdca-server (10 tools + 3 resources), bkit-analysis-server (6 tools)
- **New Skills**: `/control` (automation level), `/audit` (decision transparency), `/rollback` (checkpoint management), `/pdca-batch` (parallel features)
- **Comprehensive Test Suite**: 2,717 TC across 10 categories (99.6% pass rate, 0 failures), 2 new categories (Architecture Tests, Controllable AI Tests)

### Changed
- Skills: 31 → 36 (+5: control, audit, rollback, pdca-batch, btw)
- Agents: 29 → 31 (+2: pdca-eval-design, pm-lead-skill-patch)
- Hook Events: 12 → 18 (+6 new events)
- Lib Modules: 36 → 76 (+40 new modules across 10 subdirectories)
- Hook Scripts: 49 → 21 (consolidated with unified handlers)
- Exports: 210 → ~465 (+255 new functions)
- Test Cases: 1,151 → 2,645+ (+1,494)

### Removed
- `lib/skill-loader.js` (795 LOC) — orphaned, never imported
- `lib/skill-quality-reporter.js` (479 LOC) — orphaned, never imported
- `docs/github-stats-bkit-gemini.md` — separate repository stats
- Gemini CLI references from script comments (Claude Code exclusive since v1.5.0)
- `common.js` usage in hooks/scripts (57 scripts migrated to direct imports)

### Architecture
- 7 new lib domains: `lib/audit/`, `lib/control/`, `lib/ui/`, `lib/pdca/` (expanded), `lib/core/` (expanded)
- State management: `.bkit/state/`, `.bkit/runtime/`, `.bkit/snapshots/`
- YAML workflows: `.bkit/workflows/` (3 presets)
- MCP servers: `servers/bkit-pdca-server/`, `servers/bkit-analysis-server/`

## [1.6.2] - 2026-03-18

### Added
- **CC v2.1.73~v2.1.78 Full Integration** (14 ENH items: ENH-117~130)
  - PostCompact hook event: PDCA state integrity verification after context compaction
  - StopFailure hook event: API error classification, logging, and recovery guidance
  - `${CLAUDE_PLUGIN_DATA}` persistent backup: automatic state backup/restore across plugin updates
  - Agent frontmatter `effort`/`maxTurns`: native support for all 29 agents (opus=high/30-50, sonnet=medium/20, haiku=low/15)
  - 1M context window documentation: default for Max/Team/Enterprise plans (CC v2.1.75+)
  - Output token 128K upper limit documentation (CC v2.1.77+)
  - modelOverrides guide for Bedrock/Vertex users
  - autoMemoryDirectory guide for custom memory paths
  - worktree.sparsePaths guide for large monorepo optimization
  - /effort command guide with ultrathink documentation
  - allowRead sandbox guide for fine-grained filesystem control
  - Session name (-n) guide for CI/CD automation
  - Hook source display documentation (CC v2.1.75+)
  - tmux notification passthrough documentation (CC v2.1.78+)
- **New Scripts** (2)
  - `scripts/post-compaction.js`: PostCompact hook handler (~120 LOC)
  - `scripts/stop-failure-handler.js`: StopFailure hook handler (~160 LOC)
- **Comprehensive Test Suite** (1,186 TC, 8 perspectives)
  - Unit (555), Integration (134), Security (85), Regression (192), Performance (76), Philosophy (58), UX (60), E2E (26)
  - 99.7% pass rate, 0 failures, 4 skips (pre-existing)
  - 6 new test files, 6 updated test files (+161 TC from v1.6.1)

### Changed
- **Hook Events**: 10 → 12 in hooks.json (+PostCompact, +StopFailure)
- **lib/core/paths.js**: +2 functions (backupToPluginData, restoreFromPluginData), +2 STATE_PATHS (pluginData, pluginDataBackup)
- **lib/core/index.js**: 52 → 54 exports (+2 PLUGIN_DATA functions)
- **lib/common.js**: 208 → 210 exports (+2 bridge re-exports)
- **lib/pdca/status.js**: savePdcaStatus() and writeBkitMemory() now auto-backup to PLUGIN_DATA
- **hooks/session-start.js**: PLUGIN_DATA restore on startup, v1.6.2 enhancements section, 1M context info
- **agents/*.md**: All 29 agents updated with effort/maxTurns fields (model field moved to top)
- **CC recommended version**: v2.1.71 → v2.1.78
- **CC compatibility**: v2.1.34~v2.1.78 = 44 consecutive compatible releases (0 breaking changes)
- **Version bumps**: plugin.json, bkit.config.json, hooks.json, session-start.js, marketplace.json

### Documentation
- **bkit-system/philosophy/context-engineering.md**: 12 new sections for v1.6.2 features
- **bkit-system/philosophy/core-mission.md**: v1.6.2 version record
- **bkit-system/components/hooks/_hooks-overview.md**: v1.6.2 hook events

### Compatibility
- Claude Code: Minimum v2.1.69+, Recommended v2.1.78
- Node.js: Minimum v18+
- Agent Teams: Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.6.1] - 2026-03-08

### Added
- **CTO/PM Orchestration Redesign** (Issue #41 fix)
  - Main Session as CTO pattern to bypass CC v2.1.69+ nested spawn restriction
  - `lib/team/coordinator.js`: 7 new exports (buildAgentTeamPlan, getFileOwnership, generateTeammatePrompt, etc.)
  - Agent Teams TeamCreate integration for CTO/PM team composition
- **Skill Evals 28/28 Full Implementation**
  - `evals/runner.js`: parseEvalYaml(), evaluateAgainstCriteria(), runEval() (real evaluation engine)
  - `evals/reporter.js`: formatDetailedReport() with skill category breakdown
  - 56 content files: 28 × prompt-1.md + 28 × expected-1.md
  - `node evals/runner.js --benchmark` achieves 28/28 PASS (100% coverage)
- **Agent Security Hardening**
  - 3-Tier Security Model for 9 acceptEdits agents
  - Tier 1 (Starter Guide): disallowedTools [Bash]
  - Tier 2 (5 Expert Agents): disallowedTools [Bash(rm -rf), Bash(git push), Bash(git reset --hard)]
  - Tier 3 (QA/Iterator): unchanged (Bash required)
- **Comprehensive Test Suite** (1073 TC, 8 perspectives)
  - Unit (503), Integration (120), Security (80), Regression (156), Performance (70), Philosophy (58), UX (60), E2E (26)
  - 99.6% pass rate, 0 failures, 4 skips (environment-dependent)
- **CE Level Assessment** — CE-5 Master (88/100)
  - 10-Agent CTO Team evaluation from 10 perspectives
  - 252 total components inventoried (28 Skills + 21 Agents + 41 lib + 46 Scripts + 15 Templates + 4 Styles + 56 Evals + 39 Tests)

### Changed
- **P0 Bug Fixes** (4 items)
  - `ambiguity.js`: shouldClarify property added for automatic clarification detection
  - `trigger.js`: confidenceThreshold hardcoded 0.8 removed, reads from config
  - `creator.js`: PDCA phases array unified (includes act phase), imports fixed
  - Agent `disallowedTools` settings applied to 6 experts + 1 guide
- **Config-Code Synchronization**
  - `lib/team/orchestrator.js`: PHASE_PATTERN_MAP loads from bkit.config.json at runtime
  - selectOrchestrationPattern() with config fallback logic
- **Skills PDCA Enhancement**
  - `skills/pdca/SKILL.md`: agents.team = null, agents.pm = null (Main Session as Team Lead)
- **Library Export Count**: 208 exports (corrected from v1.6.0 documented 241)

### Fixed
- **Critical Issue #41**: CC v2.1.69+ nested subagent spawn restriction broke `/pdca team`
- **Config Read Failure**: confidenceThreshold not reflected in trigger decisions
- **Array Inconsistency**: PDCA phases missing 'act' phase in task creation
- **Security Gaps**: 8 acceptEdits agents without explicit tool restrictions
- **Stub System**: Evals always returned true (non-functional quality validation)

### Test Results
- **1073 TC**: 1069 passed, 0 failed, 4 skipped (99.6%)
- **Evals Coverage**: 28/28 PASS (100%)
- **Design Match Rate**: 100% (26/26 items)

### Files Modified
- 72 files, ~1,400 LOC changed
- New: 56 content files (evals/), 35 test files (test/)
- Core: lib/team/coordinator.js, lib/team/orchestrator.js, lib/intent/ambiguity.js, lib/intent/trigger.js, lib/task/creator.js
- Agents: 7 agents updated with disallowedTools
- Skills: skills/pdca/SKILL.md

### Breaking Changes
- None (backward compatible)

---

## [1.6.0] - 2026-03-07

### Added
- **Skills 2.0 Complete Integration** (19 ENH items: ENH-85~103)
  - Skill Classification: All 28 skills classified as Workflow (10) / Capability (16) / Hybrid (2) with deprecation-risk scoring
  - Skill Evals Framework: `evals/runner.js` with benchmark mode, 28 pre-built eval definitions
  - A/B Testing: `evals/ab-tester.js` for model comparison and parity testing
  - Skill Creator: `skill-creator/generator.js` + `skill-creator/validator.js` for skill scaffolding
  - Template Validator: PostToolUse hook validation for PDCA document required sections (ENH-103)
  - Frontmatter hooks migration: hooks.json Layer 2/3 consolidation
  - context:fork deprecation: CC native context:fork replaces FR-03 custom implementation
  - Hot reload: SKILL.md changes reflect without session restart
  - Wildcard permissions: `Bash(npm *)`, `Bash(git log*)` patterns
- **PM Agent Team** (5 new agents for pre-Plan product discovery)
  - pm-lead (opus): PM Team orchestration, PRD synthesis
  - pm-discovery (sonnet): Opportunity Solution Tree analysis
  - pm-strategy (sonnet): Value Proposition, Lean Canvas
  - pm-research (sonnet): Personas, competitors, market sizing (TAM/SAM/SOM)
  - pm-prd (sonnet): PRD document generation at `docs/00-pm/{feature}.prd.md`
  - New skill: `pm-discovery` for PM workflow automation
  - New template: `pm-prd.template.md` for PRD output
  - Integration: `/pdca pm {feature}` triggers PM Team before Plan phase
- **Skill Evals Directory Structure**
  - `evals/config.json`: Global eval configuration (thresholds, classifications)
  - `evals/runner.js`: Eval execution engine (CLI + module)
  - `evals/reporter.js`: Markdown/JSON result reporting
  - `evals/ab-tester.js`: Model comparison + parity testing
  - `evals/workflow/`, `evals/capability/`, `evals/hybrid/`: Eval definitions by classification
- **CC v2.1.71 Compatibility**
  - /loop + Cron PDCA auto-monitoring
  - Background agent recovery (output file path fix)
  - stdin freeze fix for long CTO Team sessions

### Changed
- **Skills**: 27 → 28 (+1 pm-discovery)
- **Agents**: 16 → 21 (+5 PM Team: pm-lead, pm-discovery, pm-strategy, pm-research, pm-prd)
- **lib/common.js exports**: 199 → 241 (+42 from executive-summary, template-validator, PM team modules)
- **CC recommended version**: v2.1.66 → v2.1.71
- **All 28 skills**: Added `classification`, `classification-reason`, `deprecation-risk` frontmatter fields
- **Documentation**: Full v1.6.0 doc-sync across 60+ files (versions, counts, architecture descriptions)

### Quality
- Comprehensive Test: 631 TC, 100% pass rate
- PM Team Integration: 16 GAPs, 100% match rate
- Doc-sync: 60+ files synchronized

### Compatibility
- Claude Code: Minimum v2.1.63, Recommended v2.1.71
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.9] - 2026-03-05

### Added
- **Executive Summary Module** (`lib/pdca/executive-summary.js`): 3 new exports (generateExecutiveSummary, formatExecutiveSummary, generateBatchSummary)
- **AskUserQuestion Preview UX**: Rich Markdown previews in PDCA phase transitions via buildNextActionQuestion()
- **plan-plus-stop.js**: New PostToolUse hook script for Plan Plus skill
- **ENH-74**: agent_id/agent_type first-class extraction in 5 hook scripts
- **ENH-75**: continue:false teammate lifecycle control in TaskCompleted/TeammateIdle hooks

### Changed
- **lib/common.js**: 184 → 199 exports (+15 from executive-summary and automation modules)
- **lib/pdca/automation.js**: Added buildNextActionQuestion(), formatAskUserQuestion with preview support
- **templates/plan.template.md**: Added Executive Summary section
- **templates/plan-plus.template.md**: Added Executive Summary section
- **templates/report.template.md**: Added Value Delivered table
- **skills/pdca/SKILL.md**: Added Executive Summary generation guidelines
- **hooks/hooks.json**: Removed InstructionsLoaded hook event (-6 lines)

### Fixed
- No bug fixes in this release

---

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

---

## [1.5.6] - 2026-02-26

### Added
- **Auto-Memory Integration** (ENH-48)
  - Add CC auto-memory guidance to SessionStart hook (Memory Systems section)
  - Add `/memory` command reference to bkit help (`commands/bkit.md`)
  - Clarify role separation between bkit memory-store and CC auto-memory
  - Fix agent memory count (9 -> 14 project scope agents)
- **CTO Team Memory Management Guide** (ENH-50)
  - New guide: `docs/guides/cto-team-memory-guide.md`
  - v2.1.50 + v2.1.59 multi-agent memory optimization best practices
  - Agent count recommendations and long session management tips
- **Remote Control Compatibility Pre-check** (ENH-51)
  - New guide: `docs/guides/remote-control-compatibility.md`
  - 27 skills + 16 agents RC compatibility matrix
  - Pre-check document for #28379 resolution

### Changed
- **Skill Completion /copy Guidance** (ENH-49)
  - `scripts/skill-post.js`: Add `copyHint` field on code generation skill completion
  - `scripts/unified-stop.js`: Add conditional `/copy` tip on Stop event
  - Target skills: phase-4~6, code-review, starter, dynamic, enterprise, mobile-app, desktop-app
- **Version**: 1.5.5 -> 1.5.6
  - `plugin.json`, `bkit.config.json`, `session-start.js`, `CHANGELOG.md`

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.59
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.5] - 2026-02-17

### Added
- **Plan Plus Skill** (Community Contribution by @wankiKim — PR #34)
  - New skill: `skills/plan-plus/SKILL.md` — Brainstorming-enhanced PDCA planning
  - 6-phase process: Context Exploration → Intent Discovery → Alternatives Exploration → YAGNI Review → Incremental Validation → Plan Document Generation
  - HARD-GATE enforcement: No code before plan approval
  - New template: `templates/plan-plus.template.md` with User Intent, Alternatives, YAGNI sections
  - 8-language trigger support (EN, KO, JA, ZH, ES, FR, DE, IT)
  - Seamless PDCA integration: `/plan-plus {feature}` → `/pdca design {feature}`

### Changed
- **Skills count**: 26 → 27 (+1 plan-plus)
- **Templates count**: 27 → 28 (+1 plan-plus.template.md)
- **skills/pdca/SKILL.md**: Added Plan Plus tip in plan action section (PR #34)
- **README.md**: Fixed duplicate Skills rows in Customization table (Community Contribution by @sungpeo — PR #33)

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.42
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.4] - 2026-02-14

### Added
- **bkend MCP Accuracy Fix (10 GAPs)**
  - MCP tool coverage: 19 (partial) → 28+ (complete)
  - MCP Fixed Tools: `get_context`, `search_docs`, `get_operation_schema`
  - MCP Project Management Tools: 9 tools (project/environment CRUD)
  - MCP Table Management Tools: 11 tools (table/schema/index management)
  - MCP Data CRUD Tools: 5 tools (`backend_data_list/get/create/update/delete`)
  - MCP Resources: 4 URI patterns (`bkend://` scheme)
  - Searchable Docs: 8 Doc IDs (`search_docs` query support)
- **bkend-patterns.md SSOT Expansion**
  - Shared patterns document: 85 → 140 lines (+65%)
  - New sections: REST API response format, query parameters, file upload, MCP setup, OAuth 2.1
- **bkend-expert Agent Rewrite**
  - MCP tools organized into 4 categories (Fixed/Project/Table/Data CRUD)
  - Dynamic Base URL (from `get_context`, no hardcoding)
  - MCP Resources (`bkend://` URI) reference added

### Changed
- **bkend-data/SKILL.md**: ID field `_id` → `id`, Data CRUD tools added, filter operators with `$` prefix
- **bkend-auth/SKILL.md**: MCP Auth Workflow pattern, REST endpoints 18 → 12 core, social login endpoint unified
- **bkend-storage/SKILL.md**: MCP Storage Workflow, multipart upload 4 endpoints, `download-url` GET → POST
- **bkend-quickstart/SKILL.md**: Numbered tools → named tools, Project Management 9 tools + Resources 4 URIs
- **bkend-cookbook/SKILL.md**: Live Reference URLs `src/` → `en/` paths
- **session-start.js**: bkend MCP status check `Dynamic` → `Dynamic || Enterprise` (GAP-10)
- **All Live Reference URLs**: `src/` directory paths → `en/` specific file paths

### Removed
- **bkend-expert.md**: Obsolete numbered Guide Tools references (`0_get_context` ~ `7_code_examples_data`)
- **bkend-auth/SKILL.md**: Account Lifecycle section (replaced by search_docs)
- **bkend-data/SKILL.md**: `backend_table_update` tool (non-existent tool)

### Quality
- Comprehensive Test Round 1: 708 TC, 705 PASS, 0 FAIL, 3 SKIP (100%)
- Comprehensive Test Round 2: 765 TC, 764 PASS, 0 FAIL, 1 SKIP (100%)
- bkend MCP Accuracy Fix: 10/10 GAPs, 42/42 items, 100% match rate

---

## [1.5.3] - 2026-02-10

### Added
- **Team Visibility (State Writer)**
  - `lib/team/state-writer.js`: 9 new functions for Agent Teams state management
  - `initAgentState`, `updateTeammateStatus`, `addTeammate`, `removeTeammate`, `updateProgress`, `addRecentMessage`, `cleanupAgentState`, `getAgentStatePath`, `readAgentState`
  - `.bkit/agent-state.json` schema v1.0 for Studio IPC
  - Atomic write pattern (tmp + rename) for concurrent safety
  - MAX_TEAMMATES=10, MAX_MESSAGES=50 ring buffer
- **SubagentStart/SubagentStop Hooks**
  - 2 new hook event types in `hooks.json` (8 → 10 events)
  - `scripts/subagent-start.js`, `scripts/subagent-stop.js`
  - Auto-init agent state, name extraction, model validation
- **Output Styles Auto-Discovery**
  - `outputStyles` field in `plugin.json` for Claude Code auto-discovery
  - 4th output style: `bkit-pdca-enterprise` added
  - `/output-style-setup` command for menu visibility
- **bkend Documentation Enhancement**
  - Official Documentation (Live Reference) sections in 5 bkend skills + agent
  - `bkend-quickstart` MCP step-by-step guide expansion
  - Agent Memory file for bkend-expert
- **CLAUDE.md Strategy Documentation**
  - `commands/bkit.md` expanded with CLAUDE.md strategy sections
  - v1.5.3 Features table in bkit help command

### Changed
- **Hook Events**: 8 → 10 (added SubagentStart, SubagentStop)
- **Library Functions**: 232 → 241 (+9 state-writer)
- **common.js exports**: 171 → 180 (+9 state-writer bridge)
- **team/index.js exports**: 31 → 40 (+9 state-writer)
- **Output Styles**: 3 → 4 (added bkit-pdca-enterprise)
- **team.enabled**: Default changed from false to true
- **session-start.js**: 4 output styles + /output-style-setup guide

### Fixed
- **GAP-01**: common.js missing 9 state-writer re-exports (171 → 180)

### Quality
- Comprehensive Test: 685 TC, 646 PASS, 39 SKIP (100% excl. SKIP)
- Enhancement Test: 31/31 PASS (100%)
- Final QA: 736/736 PASS (100%)

---

## [1.5.2] - 2026-02-06

### Added
- **bkend.ai BaaS Expert Enhancement**
  - 5 new bkend specialist Skills (21 → 26 total):
    - `bkend-quickstart`: Platform onboarding, MCP setup, resource hierarchy
    - `bkend-data`: Database expert (table creation, CRUD, 7 column types, filtering)
    - `bkend-auth`: Authentication expert (email/social login, JWT, RBAC, RLS)
    - `bkend-storage`: File storage expert (Presigned URL, 4 visibility levels)
    - `bkend-cookbook`: Practical tutorials (10 project guides, troubleshooting)
  - Shared template: `templates/shared/bkend-patterns.md`
  - Agent-Skill binding: `bkend-expert` preloads 3 core skills (data, auth, storage)
  - MCP auto-detection in session start and prompt handler

### Changed
- **agents/bkend-expert.md**: Complete rewrite (~215 lines)
  - MCP Tools reference (19 tools: 8 guide + 11 API)
  - REST Service API endpoints (Database 5, Auth 18, Storage 12)
  - OAuth 2.1 + PKCE authentication pattern
  - Troubleshooting table (12+ scenarios)
- **skills/dynamic/SKILL.md**: MCP integration modernization
  - MCP setup: `npx @bkend/mcp-server` → `claude mcp add bkend --transport http`
  - Authentication: API Key → OAuth 2.1 + PKCE
- **skills/phase-4-api/SKILL.md**: BaaS implementation guide added
- **lib/intent/language.js**: bkend-expert 8-language trigger patterns
- **hooks/session-start.js**: bkend MCP status detection
- **templates/plan.template.md**: BaaS architectural options added
- **templates/design.template.md**: BaaS architecture patterns added

### Fixed
- **BUG-01 (Critical)**: `scripts/user-prompt-handler.js` Line 72
  - Agent trigger confidence: `> 0.8` → `>= 0.8`
  - Impact: All 16 agents' implicit triggers were broken in UserPromptSubmit hook

### Compatibility
- Claude Code: Minimum v2.1.15, Recommended v2.1.33
- Node.js: Minimum v18.0.0
- bkend.ai: MCP endpoint via OAuth 2.1 + PKCE

---

## [1.5.1] - 2026-02-06

### Added
- **CTO-Led Agent Teams**: Multi-agent parallel PDCA execution orchestrated by CTO lead agent
  - CTO lead (opus) orchestrates team composition, task assignment, and quality gates
  - 5 new team agents: `cto-lead`, `frontend-architect`, `product-manager`, `qa-strategist`, `security-architect`
  - `lib/team/` module expanded to 7 files: coordinator, strategy, hooks, index, orchestrator, communication, task-queue, cto-logic
  - Team composition: Dynamic (3 teammates), Enterprise (5 teammates)
  - New hook handlers: `pdca-task-completed.js` (TaskCompleted), `team-idle-handler.js` (TeammateIdle), `team-stop.js`, `cto-stop.js`
  - `team` configuration section in `bkit.config.json`
  - Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
  - Total agents: 16 (11 core + 5 CTO Team)

- **Output Styles System**: Level-based response formatting
  - 3 styles in `output-styles/` directory:
    - `bkit-learning` for Starter level (learning points, TODO markers)
    - `bkit-pdca-guide` for Dynamic level (status badges, checklists)
    - `bkit-enterprise` for Enterprise level (tradeoff analysis, cost impact)
  - `outputStyles` configuration in `bkit.config.json` with `levelDefaults`

- **Agent Memory Integration**: Cross-session context persistence
  - `memory: user` scope for starter-guide, pipeline-guide (cross-project learning)
  - `memory: project` scope for 14 agents (project-specific context)
  - No configuration needed — auto-active

- **Natural Feature Discovery**: Philosophy-aligned auto-trigger integration
  - `bkit-rules/SKILL.md`: 3 new sections (Output Style Auto-Selection, Agent Teams Auto-Suggestion, Agent Memory Awareness)
  - `session-start.js`: Feature awareness block (styles, teams, memory) at every session start
  - Level skills: v1.5.1 feature announcements per level (Starter/Dynamic/Enterprise)
  - All 16 agents: v1.5.1 Feature Guidance sections
  - `claude-code-learning/SKILL.md`: Level 6 (Advanced Features) curriculum
  - `pdca/SKILL.md`: Output Style + Agent Teams integration sections

- **PDCA Team Mode**: `/pdca team {feature}` for CTO-Led parallel PDCA execution
  - `/pdca team status` to monitor teammate progress
  - `/pdca team cleanup` to end team session

- **New Hook Events**: `TaskCompleted` and `TeammateIdle` support in `hooks/hooks.json`

- **bkit Memory Functions**: `readBkitMemory()` and `writeBkitMemory()` for `docs/.bkit-memory.json` CRUD

- **bkit-system Documentation**: v1.5.1 coverage across 16 system docs
  - Philosophy docs (4): v1.5.1 feature integration sections
  - Component overviews (4): Agent Memory, Teams, Styles coverage
  - Trigger docs (2): Output Style, Agent Teams, Agent Memory triggers
  - New scenario: `scenario-discover-features.md`
  - Test checklist: 19 new test cases (OS-T:7, AT-T:7, AM-T:5)

### Fixed
- **BUG-01 (Critical)**: `checkPhaseDeliverables()` now supports both number (pipeline phase 1-9) and string (PDCA phase name) input types
- **BUG-02 (Medium)**: `scripts/iterator-stop.js` - Added optional chaining (`phaseAdvance?.nextPhase`) to prevent TypeError
- **BUG-03 (Medium)**: `scripts/gap-detector-stop.js` - Added optional chaining (`phaseAdvance?.nextPhase`) to prevent TypeError
- **BUG-04 (Low)**: Added missing `readBkitMemory`/`writeBkitMemory` exports in `lib/pdca/status.js`, `lib/pdca/index.js`, and `lib/common.js`

### Changed
- **lib/common.js**: Added Team module re-exports (30 team functions, total 165 exports)
- **lib/team/**: Expanded from 4 to 7+ files (added orchestrator.js, communication.js, task-queue.js, cto-logic.js)
- **Agent count**: Increased from 11 to 16 (5 new CTO Team agents)
- **Plugin metadata**: Updated `plugin.json` version to 1.5.1
- **Claude Code compatibility**: Minimum v2.1.15, Recommended v2.1.33

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.33
- **Node.js**: Minimum v18.0.0
- **Agent Teams**: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

---

## [1.5.0] - 2026-02-01

### Breaking Changes
- **Claude Code Exclusive**: bkit is now Claude Code exclusive plugin
  - Gemini CLI support has been removed
  - All dual-platform code branches eliminated
  - Simplified codebase with single-platform focus

### Removed
- **Gemini CLI Files**:
  - `gemini-extension.json` - Gemini CLI extension manifest
  - `GEMINI.md` - Gemini CLI context file
  - `commands/gemini/` - 20 TOML command files
  - `lib/adapters/gemini/` - Gemini adapter implementations
  - `debug-platform.js` - Platform debugging utility
  - `lib/common.js.backup` - Backup file cleanup

- **Gemini CLI Code**:
  - `lib/core/platform.js`: Removed `isGeminiCli()` function and Gemini detection
  - `lib/core/io.js`: Removed Gemini output format branches from `outputAllow()`, `outputBlock()`, `outputEmpty()`
  - `lib/core/debug.js`: Removed Gemini log path from `getDebugLogPaths()`
  - `lib/context-hierarchy.js`: Removed Gemini config path from `getUserConfigDir()`
  - `hooks/session-start.js`: Removed ~70 lines of Gemini-specific code
  - 8 scripts: Removed `isGeminiCli` imports and platform branches

### Changed
- **README.md**: Removed all Gemini CLI references
  - Removed Gemini CLI badge
  - Removed "Dual Platform Support" messaging
  - Removed Gemini CLI installation section
  - Updated plugin structure documentation
- **Version**: Updated all version references to 1.5.0

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.25
- **Node.js**: Minimum v18.0.0

### Migration Guide
If you were using bkit with Gemini CLI, please note that Gemini CLI support has been discontinued.
For Gemini CLI users, consider using native Gemini CLI extensions or alternative tools.

---

## [1.4.7] - 2026-01-29

### Added
- **Task Management + PDCA Integration**: Complete integration of Claude Code Task System
  - Task Chain Auto-Creation on `/pdca plan`
  - Task ID Persistence in `.pdca-status.json`
  - Check↔Act Iteration (max 5 iterations, 90% threshold)
  - Full-Auto Mode (manual/semi-auto/full-auto)
  - 9 new functions: `savePdcaTaskId`, `createPdcaTaskChain`, `triggerNextPdcaAction`, etc.
- **Core Modularization**: lib/common.js split into 4 module directories
  - `lib/core/` - Platform detection, caching, debugging, configuration (7 files)
  - `lib/pdca/` - PDCA phase management, status tracking (6 files)
  - `lib/intent/` - Intent analysis, language detection, triggers (4 files)
  - `lib/task/` - Task classification, creation, tracking (5 files)
  - 22 new module files, 132 function exports
  - Migration Bridge for 100% backward compatibility
  - Lazy Require Pattern for circular dependency prevention

### Changed
- **lib/common.js**: Converted to Migration Bridge (3,722 → 212 lines)
- **scripts/pdca-skill-stop.js**: Task chain creation integration
- **scripts/gap-detector-stop.js**: triggerNextPdcaAction integration
- **scripts/iterator-stop.js**: triggerNextPdcaAction integration

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.22
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.6] - 2026-01-28

### Fixed
- **Plugin Agent Prefix**: All bkit plugin agents now correctly use `bkit:` prefix
  - Fixes "Agent type 'gap-detector' not found" error in Claude Code Task tool
  - Claude Code requires plugin agents to be called as `{plugin-name}:{agent-name}`
  - 11 agents updated: gap-detector, code-analyzer, pdca-iterator, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect
  - Built-in agent `claude-code-guide` correctly remains without prefix

### Changed
- **lib/common.js**: `matchImplicitAgentTrigger()` now returns `bkit:` prefixed agent names
- **18 SKILL.md files**: Updated `agent:` and `agents:` frontmatter fields with `bkit:` prefix
- **hooks/session-start.js**: Trigger keyword table updated with `bkit:` prefix
- **skills/bkit-rules/SKILL.md**: Task-Based Selection table updated with `bkit:` prefix
- **Command Renamed**: `/bkit:functions` → `/bkit:bkit`
  - File renamed: `commands/functions.md` → `commands/bkit.md`
  - More intuitive command name for plugin help
- **Test files removed from repository**: `tests/` and `test-scripts/` directories
  - Added to `.gitignore` (local testing only, not for distribution)
  - 66 test files removed from git tracking (12,502 lines)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.5] - 2026-01-27

### Added
- **`/pdca archive` Action**: Complete PDCA cycle with document archiving
  - Move completed PDCA documents to `docs/archive/YYYY-MM/{feature}/`
  - Update Archive Index automatically
  - Remove feature from activeFeatures after archiving
- **`/bkit:functions` Command**: Skills autocomplete workaround (GitHub #10246, #18949)
  - Single entry point showing all available bkit skills
  - Renamed from `/bkit:menu` for clarity
- **8-Language Trigger Completion**: Full multilingual support
  - Added ES, FR, DE, IT triggers to all 11 agents and 21 skills
  - Complete coverage: EN, KO, JA, ZH, ES, FR, DE, IT

### Changed
- **Internationalization**: Korean content translated to English
  - All skill descriptions, guides, and documentation in English
  - 8-language trigger keywords preserved for auto-activation
  - ~600 lines translated, ~100 trigger keywords added
- **`github-integration` Skill**: Made internal-only (company use)
  - Added to `.gitignore`
  - Public skill count: 21 (unchanged, was already counted)
- **Command Renaming**: `/bkit` → `/bkit:menu` → `/bkit:functions`

### Documentation
- Archived 10 completed PDCA features to `docs/archive/2026-01/`
- Added `skills-autocomplete-research-2026-01.md` research report
- Updated all version references across documentation

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.4] - 2026-01-27

### Added
- **PDCA Skill Integration**: Unified `/pdca` skill with 8 actions
  - `plan`, `design`, `do`, `analyze`, `iterate`, `report`, `status`, `next`
  - Replaces individual `/pdca-*` commands
  - Task Management System integration for tracking
- **hooks-json-integration**: Centralized hook management (GitHub #9354 workaround)
  - `scripts/unified-stop.js` (223 lines) - 14 handlers (10 skills, 4 agents)
  - `scripts/unified-bash-pre.js` (134 lines) - 2 handlers
  - `scripts/unified-write-post.js` (166 lines) - 4 handlers
  - `scripts/unified-bash-post.js` (80 lines) - 1 handler
- **skill-orchestrator.js**: New library module for skill action routing
- **New Skills** (3):
  - `pdca` - Unified PDCA cycle management
  - `code-review` - Code review and quality analysis
  - `claude-code-learning` - Claude Code learning guide

### Changed
- **Commands deprecated**: All `commands/*.md` migrated to Skills
  - See `commands/DEPRECATED.md` for migration guide
  - Commands still available via `commands/gemini/` for Gemini CLI
- **Skills count**: Increased from 18 to 21
- **Scripts count**: Increased from 28 to 39
- **Library modules**: Increased from 6 to 7 (added `skill-orchestrator.js`)
- **Hook system**: Migrated from SKILL.md frontmatter to centralized `hooks.json`
- **bkit feature report**: Updated to use Skills instead of deprecated Commands

### Deprecated
- All commands in `commands/*.md` (use Skills instead)
- SKILL.md frontmatter hooks (use `hooks.json` instead)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.20
- **Gemini CLI**: Minimum v0.25.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.3] - 2026-01-26

### Added
- **FR-1.1: Hook Context XML Wrapping Compatibility** - Safe output for Gemini CLI v0.27+ XML-wrapped hook contexts
  - New `xmlSafeOutput()` function in `lib/common.js` for XML special character escaping
  - Characters escaped: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`
  - Applied to `outputAllow()` and `outputBlock()` functions for Gemini CLI output

### Changed
- **FR-1.2: engines Version Update** - Updated Gemini CLI minimum version requirement
  - `gemini-extension.json`: `engines.gemini-cli` changed from `>=1.0.0` to `>=0.25.0`
  - Reason: Hook System enabled by default since v0.25.0

### Documentation
- **Plan Document**: `docs/01-plan/features/gemini-cli-v026-compatibility.plan.md`
  - Comprehensive compatibility analysis for Gemini CLI v0.25.0 ~ v0.27.0-nightly
  - 12 test tasks completed with Task Management System
  - Test results: beforeAgent/fireAgent not used (compatible), Hook XML wrapping conditionally compatible
- **Design Document**: `docs/02-design/features/gemini-cli-v026-compatibility.design.md`
  - Detailed implementation specification for xmlSafeOutput() function
  - Architecture diagram for Hook System with XML wrapper
  - Test plan with unit test cases and compatibility matrix

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v0.25.0 (updated from v1.0.0)
- **Node.js**: Minimum v18.0.0

---

## [1.4.2] - 2026-01-26

### Added
- **FR-01: Multi-Level Context Hierarchy** - 4-level context (Plugin → User → Project → Session)
- **FR-02: @import Directive** - External context file loading support
- **FR-03: context:fork** - Skill/Agent isolated context execution
- **FR-04: UserPromptSubmit Hook** - User input preprocessing
- **FR-05: Permission Hierarchy** - deny → ask → allow permission chain
- **FR-06: Task Dependency Chain** - PDCA phase-based task blocking
- **FR-07: Context Compaction Hook** - PDCA state preservation during compaction
- **FR-08: MEMORY Variable** - Session-persistent data storage

### Fixed
- **outputAllow() API Schema**: Removed invalid `decision: 'allow'` from UserPromptSubmit, added `hookEventName` field
- **PreCompact Hook Registration**: Registered in hooks.json to activate context-compaction.js
- **UserPromptSubmit Bug Detection**: Auto-detection for GitHub #20659 plugin bug
- **context:fork Scanning**: SessionStart scans skills for fork configuration
- **Import Preloading**: Common imports checked at session start

### New Files
- `lib/context-hierarchy.js` - Multi-level context management
- `lib/import-resolver.js` - @import directive processing
- `lib/context-fork.js` - Context isolation
- `lib/permission-manager.js` - Permission hierarchy
- `lib/memory-store.js` - Persistent memory storage
- `scripts/user-prompt-handler.js` - UserPromptSubmit hook
- `scripts/context-compaction.js` - PreCompact hook

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v1.0.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.1] - 2026-01-24

### Added
- **Response Report Rule**: AI Agent automatically reports bkit feature usage at the end of each response
  - Claude Code: Rule added to `hooks/session-start.js` additionalContext
  - Gemini CLI: Response Report Rule section added to `GEMINI.md`
  - Report format: Used features, unused reasons, PDCA phase-based recommendations
- **Claude Code 2.1.19 Compatibility**: Compatibility testing completed
  - 99 components tested and passed
  - No breaking changes confirmed
  - New features (additionalContext, Task System) documented

### Changed
- **Version references**: Updated all version references from 1.4.0 to 1.4.1
- **session-start.js**: v1.4.1 Changes comment and report rule added (+62 lines)
- **GEMINI.md**: Response Report Rule section added (+50 lines)

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.19
- **Gemini CLI**: Minimum v1.0.0
- **Node.js**: Minimum v18.0.0

---

## [1.4.0] - 2026-01-24

### Added
- ~~**Dual Platform Support**: bkit now supports both Claude Code and Gemini CLI~~ *(Removed in v1.5.0)*
  - ~~New `gemini-extension.json` manifest for Gemini CLI~~ *(Removed in v1.5.0)*
  - ~~New `GEMINI.md` context file (equivalent to CLAUDE.md)~~ *(Removed in v1.5.0)*
  - ~~New `commands/gemini/` directory with TOML-format commands (20 commands)~~ *(Removed in v1.5.0)*
  - ~~Hook mapping: `BeforeTool`/`AfterTool` for Gemini (vs `PreToolUse`/`PostToolUse` for Claude)~~ *(Removed in v1.5.0)*
- **PDCA Status v2.0 Schema**: Multi-feature context management
  - `features` object for tracking multiple features simultaneously
  - `activeFeature` for current working context
  - Auto-migration from v1.0 schema via `migrateStatusToV2()`
- **lib/common.js Expansion**: 86+ functions (up from 38)
  - **Platform Detection**: `detectPlatform()`, ~~`isGeminiCli()`~~ *(Removed in v1.5.0)*, `isClaudeCode()`, `getPluginPath()`
  - **Caching System**: In-memory TTL-based cache (`_cache` object)
  - **Debug Logging**: `debugLog()` with platform-specific paths
  - **Multi-Feature Management**: `setActiveFeature()`, `addActiveFeature()`, `getActiveFeatures()`, `switchFeatureContext()`
  - **Intent Detection**: `detectNewFeatureIntent()`, `matchImplicitAgentTrigger()`, `matchImplicitSkillTrigger()`
  - **Ambiguity Detection**: `calculateAmbiguityScore()`, `generateClarifyingQuestions()`
  - **Requirement Tracking**: `extractRequirementsFromPlan()`, `calculateRequirementFulfillment()`
  - **Phase Validation**: `checkPhaseDeliverables()`, `validatePdcaTransition()`
- **8-Language Intent Detection**: Extended multilingual support
  - EN, KO, JA, ZH (existing)
  - ES (Spanish), FR (French), DE (German), IT (Italian) (new)
  - Implicit agent/skill triggering via natural language keywords
- **New Scripts** (5):
  - `phase-transition.js`: PDCA phase transition validation
  - `phase1-schema-stop.js`: Schema phase completion handler
  - `phase2-convention-stop.js`: Convention phase completion handler
  - `phase3-mockup-stop.js`: Mockup phase completion handler
  - `phase7-seo-stop.js`: SEO/Security phase completion handler

### Changed
- **Script Count**: Increased from 21 to 26
- **hooks/hooks.json**: Updated for Gemini CLI compatibility
- **Environment Variables**:
  - `BKIT_PLATFORM`: Auto-set to "claude" or "gemini"
  - `GEMINI_PROJECT_DIR`: Gemini CLI project directory
- **Agent Descriptions**: Updated all 11 agents with multilingual triggers

### Compatibility
- **Claude Code**: Minimum v2.1.15, Recommended v2.1.17
- ~~**Gemini CLI**: Minimum v1.0.0~~ *(Removed in v1.5.0)*
- **Node.js**: Minimum v18.0.0

---

## [1.3.2] - 2026-01-23

### Fixed
- **Hook Execution Permission**: Added explicit `node` command prefix to all hook commands
  - Fixes "SessionStart:startup hook error" on plugin installation
  - No longer requires `chmod +x` for .js files
  - Pattern: `"command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/xxx.js"`
- **Cross-Platform Compatibility**: Windows users no longer need WSL for hook execution
  - Windows doesn't support shebang (`#!/usr/bin/env node`)
  - Explicit `node` command ensures consistent behavior across all platforms

### Changed
- **hooks/hooks.json**: All 3 hook commands now use `node` prefix
- **skills/*.md**: Updated 7 skill files with `node` command prefix
- **agents/*.md**: Updated 5 agent files with `node` command prefix
- **Documentation**: Updated CUSTOMIZATION-GUIDE.md and bkit-system docs

---

## [1.3.1] - 2026-01-23

### Changed
- **Cross-Platform Hooks**: All 22 hook scripts converted from Bash (.sh) to Node.js (.js)
  - Windows Native environment now fully supported
  - No external dependencies required (jq, bash, wc, grep removed)
  - Shebang: `#!/usr/bin/env node` for universal compatibility
- **lib/common.js**: New centralized library replacing lib/common.sh
  - 30 functions across 9 categories
  - Pure Node.js implementation
  - Synchronous stdin reading for hooks
- **hooks/hooks.json**: Updated all script references from .sh to .js
- **bkit-system documentation**: Updated all references from .sh to .js

### Added
- **hooks/session-start.js**: SessionStart hook converted to Node.js
- **Input Helpers**: New functions for hook input handling
  - `readStdinSync()`: Synchronous JSON input from stdin
  - `readStdin()`: Async version for complex scenarios
  - `parseHookInput()`: Extract common fields from hook input

### Removed
- **Bash Scripts**: All 21 .sh files in scripts/ directory
- **hooks/session-start.sh**: Replaced by session-start.js
- **lib/common.sh**: Replaced by lib/common.js

### Fixed
- **Windows Compatibility**: Hooks now work on Windows without WSL or Git Bash
- **Skills/Agents References**: Updated all .sh references to .js (12 files)
- **Global Hooks**: hooks/hooks.json now references .js files correctly

### Compatibility
- **Minimum Claude Code Version**: 2.1.15
- **Recommended Claude Code Version**: 2.1.17
- **Supported Platforms**: Windows (Native), macOS, Linux

---

## [1.3.0] - 2026-01-22

### Added
- **Check-Act Iteration Loop**: Automatic gap analysis and fix cycles
  - `pdca-iterator` agent orchestrates evaluation-optimization loop
  - Maximum 5 iterations per session with 90% pass threshold
  - Auto-invoked when Match Rate < 90%
- **SessionStart Enhancement**: AskUserQuestion integration for session initialization
  - 4 options: Learn bkit, Learn Claude Code, Continue Previous Work, Start New Project
- **Trigger Keyword Mapping**: Agent auto-triggering based on user keywords
  - verify → gap-detector, improve → pdca-iterator, etc.
- **Task Size Rules**: PDCA application guidance based on change size
  - Quick Fix (<10 lines): No PDCA needed
  - Minor Change (<50 lines): Light PDCA optional
  - Feature (<200 lines): PDCA recommended
  - Major Feature (>=200 lines): PDCA required
- **New Commands**: `/archive`, `/github-stats`

### Changed
- **Version references**: Updated all version references from 1.2.x to 1.3.0
- **Component counts**: Commands increased from 18 to 20

### Compatibility
- **Minimum Claude Code Version**: 2.1.12
- **Recommended Claude Code Version**: 2.1.15

---

## [1.2.3] - 2026-01-22

### Added
- **Claude Code 2.1.15 Impact Analysis**: Added version compatibility documentation
  - `docs/pdca/03-analysis/12-claude-code-2.1.15-impact-analysis.md`
  - npm installation deprecation notice (use `claude install` instead)
  - MCP stdio server timeout fix analysis
  - UI rendering performance improvements

### Changed
- **README Badge Update**: Claude Code version badge updated to v2.1.15+
  - Link updated to official getting-started documentation

### Compatibility
- **Minimum Claude Code Version**: 2.1.12
- **Recommended Claude Code Version**: 2.1.15
- All 2.1.14 improvements (98% context, parallel agents, memory fix) remain available

---

## [1.2.2] - 2026-01-21

### Changed
- **Documentation Structure Reorganization**: Clear separation of docs/ and bkit-system/ roles
  - `bkit-system/` = "What IS" (current implementation reference)
  - `docs/pdca/` = "What WE DO" (active PDCA work)
  - `docs/archive/` = "What WE DID" (completed documents)
- **New Philosophy Section**: Added `bkit-system/philosophy/` with core documentation
  - `core-mission.md`: Core mission & 3 philosophies
  - `ai-native-principles.md`: AI-Native development & Language Tier System
  - `pdca-methodology.md`: PDCA cycle & 9-stage pipeline relationship

### Fixed
- **Broken Wikilinks**: Fixed 30+ broken Obsidian wikilinks across bkit-system/ documentation
  - Updated skill/agent links to point to actual source files
  - Pattern: `[[../../skills/skill-name/SKILL|skill-name]]`

## [1.2.1] - 2026-01-20

### Added
- **Language Tier System**: 4-tier classification for AI-Native development
  - Tier 1 (AI-Native Essential): Python, TypeScript, JavaScript
  - Tier 2 (Mainstream Recommended): Go, Rust, Dart, Vue, Svelte, Astro
  - Tier 3 (Domain Specific): Java, Kotlin, Swift, C/C++
  - Tier 4 (Legacy/Niche): PHP, Ruby, C#, Scala, Elixir
  - Experimental: Mojo, Zig, V
- **New Tier Detection Functions** in `lib/common.js`:
  - `get_language_tier()`: Get tier (1-4, experimental, unknown) for file
  - `get_tier_description()`: Get tier description
  - `get_tier_pdca_guidance()`: Get PDCA guidance based on tier
  - `is_tier_1()`, `is_tier_2()`, `is_tier_3()`, `is_tier_4()`, `is_experimental_tier()`: Tier check helpers
- **New Extension Support**: `.dart`, `.astro`, `.mdx`, `.mojo`, `.zig`, `.v`
- **Tier Guidance in Skills**: Added tier recommendations to starter, dynamic, enterprise, mobile-app, desktop-app skills

### Changed
- **is_code_file()**: Refactored to use Tier constants (30+ extensions)
- **is_ui_file()**: Added `.astro` support
- **CLAUDE.template.md**: Added Tier context section
- **Documentation**: Updated all bkit-system/, docs/, skills/ with Tier system info

### Fixed
- **Environment Variables**: Fixed `CLAUDE_PROJECT_DIR` vs `CLAUDE_PLUGIN_ROOT` usage in hooks
- **Hook JSON Output**: Stabilized JSON output handling with proper exit codes

## [1.2.0] - 2026-01-20

### Added
- **Centralized Configuration**: Added `bkit.config.json` for centralized settings
  - Task classification thresholds
  - Level detection rules
  - PDCA document paths
  - Template configurations
- **Shared Utilities**: Added `lib/common.js` with reusable functions
  - `get_config()`: Read values from bkit.config.json
  - `is_source_file()`: Check if path is source code
  - `extract_feature()`: Extract feature name from file path
  - `classify_task()`: Classify task by content size
  - `detect_level()`: Detect project level
- **Customization Guide**: Added documentation for customizing plugin components
  - Copy from `~/.claude/plugins/bkit/` to project `.claude/`
  - Project-level overrides take priority over plugin defaults
- **Skills Frontmatter Hooks**: Added hooks directly in SKILL.md frontmatter for priority skills
  - `bkit-rules`: SessionStart, PreToolUse (Write|Edit), Stop hooks
  - `bkit-templates`: Template selection automation
- **New Scripts**: Added automation scripts
  - `pre-write.js`: Unified pre-write hook combining PDCA and task classification
  - `select-template.js`: Template selection based on document type and level
  - `task-classify.js`: Task size classification for PDCA guidance

### Changed
- **Repository Structure**: Removed `.claude/` folder from version control
  - Plugin elements now exist only at root level (single source of truth)
  - Local development uses symlinks from `.claude/` to root
  - Users customize by copying from `~/.claude/plugins/bkit/` to project `.claude/`
- **Zero Script QA Hooks**: Converted from `type: "prompt"` to `type: "command"`
- **Template Version**: Bumped PDCA templates from v1.0 to v1.1

### Removed
- **Deprecated Skills**: Consolidated redundant skills into core skills
  - `ai-native-development` → merged into `bkit-rules`
  - `analysis-patterns` → merged into `bkit-templates`
  - `document-standards` → merged into `bkit-templates`
  - `evaluator-optimizer` → available via `/pdca-iterate` command
  - `level-detection` → moved to `lib/common.js`
  - `monorepo-architecture` → merged into `enterprise`
  - `pdca-methodology` → merged into `bkit-rules`
  - `task-classification` → moved to `lib/common.js`
- **Instructions Folder**: Removed deprecated `.claude/instructions/`
  - Content migrated to respective skills

### Fixed
- **Single Source of Truth**: Eliminated dual maintenance between root and `.claude/` folders

## [1.1.4] - 2026-01-15

### Fixed
- Simplified hooks system and enhanced auto-trigger mechanisms
- Added Claude Code hooks analysis document (v2.1.7)

## [1.1.0] - 2026-01-09

### Added
- Initial public release of bkit
- PDCA methodology implementation
- 9-stage Development Pipeline
- Three project levels (Starter, Dynamic, Enterprise)
- 11 specialized agents
- 26 skills for various development phases
- Zero Script QA methodology
- Multilingual support (EN, KO, JA, ZH)
