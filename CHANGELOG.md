# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **New Tier Detection Functions** in `lib/common.sh`:
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
- **Shared Utilities**: Added `lib/common.sh` with reusable functions
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
- **New Shell Scripts**: Added automation scripts
  - `pre-write.sh`: Unified pre-write hook combining PDCA and task classification
  - `select-template.sh`: Template selection based on document type and level
  - `task-classify.sh`: Task size classification for PDCA guidance

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
  - `level-detection` → moved to `lib/common.sh`
  - `monorepo-architecture` → merged into `enterprise`
  - `pdca-methodology` → merged into `bkit-rules`
  - `task-classification` → moved to `lib/common.sh`
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
