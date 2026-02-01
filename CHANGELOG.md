# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
