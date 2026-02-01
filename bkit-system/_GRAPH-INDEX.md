# bkit Graph Index

> Obsidian graph view central hub. All components connect from this file.
>
> **v1.2.0 Refactoring**: Skills consolidated, .claude/ removed from repo, single source of truth at root level
>
> **v1.2.1 Multi-Language Support**: Extension-based file detection, 20+ language support, configurable patterns
>
> **v1.2.1 Language Tier System**: 4-tier language classification reflecting AI-Native development and Vibe Coding trends
>
> **v1.2.3 SessionStart Enhancement**: AskUserQuestion guidance with 4 options for session initialization
>
> **v1.3.0 Check-Act Iteration Loop**: Automatic gap analysis and fix cycles with pdca-iterator agent
>
> **v1.3.1 Cross-Platform**: All hooks converted from Bash (.sh) to Node.js (.js) for Windows/Mac/Linux compatibility
>
> **v1.4.0**: 80+ lib/common.js functions, 8-language Intent Detection
>
> **v1.4.1 Context Engineering**: Optimal token curation perspective for LLM reasoning, Response Report Rule
>
> **v1.5.0 Claude Code Exclusive**: Gemini CLI support removed, simplified architecture

## Philosophy (4)

### Context Engineering (NEW)

bkit is a practical implementation of **Context Engineering**:

```
┌─────────────────────────────────────────────────────────────────┐
│              bkit Context Engineering Components                 │
├─────────────────────────────────────────────────────────────────┤
│  Domain Knowledge (21 Skills)  → Structured domain knowledge     │
│  Behavioral Rules (11 Agents)  → Role-based behavioral rules     │
│  State Management (lib/common) → State management 76+ functions  │
│  5-Layer Hook System           → Context injection timing ctrl   │
│  Dynamic Injection             → Conditional context selection   │
└─────────────────────────────────────────────────────────────────┘
```

## Philosophy

Core design principles and methodology:

- [[philosophy/core-mission|core-mission]] - Core mission & 3 philosophies (Automation First, No Guessing, Docs=Code)
- [[philosophy/ai-native-principles|ai-native-principles]] - AI-Native development & 3 core competencies
- [[philosophy/pdca-methodology|pdca-methodology]] - PDCA cycle & 9-stage pipeline relationship

## Skills (21)

### Core Skills (2)
- [[../skills/bkit-rules/SKILL|bkit-rules]] - PDCA rules + auto-triggering + code quality standards
- [[../skills/bkit-templates/SKILL|bkit-templates]] - Document templates for consistent PDCA documentation

### Level Skills (3)
- [[../skills/starter/SKILL|starter]] - Starter level (static web, HTML/CSS/JS, Next.js basics)
- [[../skills/dynamic/SKILL|dynamic]] - Dynamic level (BaaS fullstack with bkend.ai)
- [[../skills/enterprise/SKILL|enterprise]] - Enterprise level (MSA/K8s/Terraform, AI Native)

### Pipeline Phase Skills (10)
- [[../skills/development-pipeline/SKILL|development-pipeline]] - 9-stage pipeline overview
- [[../skills/phase-1-schema/SKILL|phase-1-schema]] - Schema/terminology definition
- [[../skills/phase-2-convention/SKILL|phase-2-convention]] - Coding conventions
- [[../skills/phase-3-mockup/SKILL|phase-3-mockup]] - Mockup development
- [[../skills/phase-4-api/SKILL|phase-4-api]] - API design/implementation
- [[../skills/phase-5-design-system/SKILL|phase-5-design-system]] - Design system
- [[../skills/phase-6-ui-integration/SKILL|phase-6-ui-integration]] - UI implementation + API integration
- [[../skills/phase-7-seo-security/SKILL|phase-7-seo-security]] - SEO/Security
- [[../skills/phase-8-review/SKILL|phase-8-review]] - Code review + quality analysis
- [[../skills/phase-9-deployment/SKILL|phase-9-deployment]] - Deployment

### Specialized Skills (3)
- [[../skills/zero-script-qa/SKILL|zero-script-qa]] - Zero Script QA (log-based testing)
- [[../skills/mobile-app/SKILL|mobile-app]] - Mobile app development (React Native, Flutter)
- [[../skills/desktop-app/SKILL|desktop-app]] - Desktop app development (Electron, Tauri)

### Removed Skills (v1.2.0)
The following skills were consolidated:
- ~~task-classification~~ → `lib/common.js`
- ~~level-detection~~ → `lib/common.js`
- ~~pdca-methodology~~ → `bkit-rules`
- ~~document-standards~~ → `bkit-templates`
- ~~evaluator-optimizer~~ → `/pdca-iterate` command
- ~~analysis-patterns~~ → `bkit-templates`
- ~~ai-native-development~~ → `enterprise`
- ~~monorepo-architecture~~ → `enterprise`

## Agents (11)

### Level-Based Agents
- [[../agents/starter-guide|starter-guide]] - Starter level guide (beginners)
- [[../agents/bkend-expert|bkend-expert]] - Dynamic level (BaaS expert)
- [[../agents/enterprise-expert|enterprise-expert]] - Enterprise level (CTO-level advisor)
- [[../agents/infra-architect|infra-architect]] - Infrastructure architect (AWS/K8s/Terraform)

### Task-Based Agents
- [[../agents/pipeline-guide|pipeline-guide]] - Pipeline guide (9-phase development)
- [[../agents/gap-detector|gap-detector]] - Gap analysis (design vs implementation)
- [[../agents/design-validator|design-validator]] - Design validation
- [[../agents/code-analyzer|code-analyzer]] - Code quality analysis
- [[../agents/qa-monitor|qa-monitor]] - QA monitoring (Zero Script QA)
- [[../agents/pdca-iterator|pdca-iterator]] - Iteration optimizer (Evaluator-Optimizer pattern)
- [[../agents/report-generator|report-generator]] - Report generation

## Skills - User Invocable (v1.4.5)

> **Note**: Commands deprecated in v1.4.4+. Use Skills instead.

### PDCA Skill (Unified)
- `/pdca plan` - Create plan document
- `/pdca design` - Create design document
- `/pdca do` - Implementation guide
- `/pdca analyze` - Run gap analysis
- `/pdca iterate` - Auto-fix with Evaluator-Optimizer
- `/pdca report` - Generate completion report
- `/pdca status` - Show PDCA dashboard
- `/pdca next` - Guide next PDCA step

### Level Skills
- `/starter` - Starter level project guidance
- `/dynamic` - Dynamic level project guidance
- `/enterprise` - Enterprise level project guidance

### Pipeline Skills
- `/development-pipeline start` - Start pipeline guide
- `/development-pipeline next` - Next pipeline phase
- `/development-pipeline status` - Pipeline progress

### Utility Skills
- `/zero-script-qa` - Run Zero Script QA
- `/claude-code-learning` - Learning curriculum
- `/code-review` - Code review and quality analysis

## Hooks (3 events)

### Global Hooks (hooks/hooks.json)
- [[components/hooks/_hooks-overview|SessionStart]] - Plugin initialization with AskUserQuestion guidance

### Skill Frontmatter Hooks
- [[components/hooks/_hooks-overview|PreToolUse]] - Before Write/Edit operations (defined in SKILL.md)
- [[components/hooks/_hooks-overview|PostToolUse]] - After Write operations (defined in SKILL.md)

## Scripts (26)

> **Note**: All scripts converted to Node.js (.js) in v1.3.1 for cross-platform compatibility
>
> **v1.4.0**: Added 5 new phase completion handlers

### Core Scripts (3)
- `scripts/pre-write.js` - Unified PreToolUse hook (PDCA + classification + convention)
- `scripts/pdca-post-write.js` - PostToolUse guidance after Write
- `scripts/select-template.js` - Template selection by level

### Phase Scripts (11)
- `scripts/phase-transition.js` - PDCA phase transition validation (v1.4.0)
- `scripts/phase1-schema-stop.js` - Schema phase completion (v1.4.0)
- `scripts/phase2-convention-pre.js` - Convention check before write
- `scripts/phase2-convention-stop.js` - Convention phase completion (v1.4.0)
- `scripts/phase3-mockup-stop.js` - Mockup phase completion (v1.4.0)
- `scripts/phase4-api-stop.js` - Zero Script QA after API implementation
- `scripts/phase5-design-post.js` - Design token verification
- `scripts/phase6-ui-post.js` - Layer separation verification
- `scripts/phase7-seo-stop.js` - SEO/Security phase completion (v1.4.0)
- `scripts/phase8-review-stop.js` - Review completion guidance
- `scripts/phase9-deploy-pre.js` - Deployment environment validation

### QA Scripts (3)
- `scripts/qa-pre-bash.js` - QA setup before Bash
- `scripts/qa-monitor-post.js` - QA completion guidance
- `scripts/qa-stop.js` - QA session cleanup

### Agent Scripts (5)
- `scripts/design-validator-pre.js` - Design document validation
- `scripts/gap-detector-post.js` - Gap analysis guidance
- `scripts/gap-detector-stop.js` - Gap detector completion
- `scripts/iterator-stop.js` - Iterator completion
- `scripts/analysis-stop.js` - Analysis completion guidance

### Utility Scripts (4)
- `scripts/pdca-pre-write.js` - PDCA pre-write checks
- `scripts/archive-feature.js` - Feature archiving
- `scripts/sync-folders.js` - Folder synchronization
- `scripts/validate-plugin.js` - Plugin validation

## Infrastructure

### Shared Library
- `lib/common.js` - Shared utility functions (v1.4.0 Node.js, **80+ functions**)

#### Platform Detection (v1.5.0 - Claude Code Exclusive)
  - `isClaudeCode()` - Check if running in Claude Code
  - `getPluginPath()` - Get plugin root path
  - `getBkitConfig()` - Load bkit.config.json with caching

#### Caching System (v1.4.0)
  - `_cache` - In-memory TTL-based cache object
  - TTL-based invalidation for config, status, and feature data

#### Debug Logging (v1.5.0)
  - `debugLog()` - Debug logging
  - Writes to `~/.claude/bkit-debug.log`

#### PDCA Status v2.0 (v1.4.0)
  - `createInitialStatusV2()` - Create PDCA Status v2.0 schema
  - `migrateStatusToV2()` - Auto-migrate from v1.0 schema
  - `getDefaultFeatureStatus()` - Get default status object for a feature

#### Multi-Feature Management (v1.4.0)
  - `setActiveFeature()` - Set current working feature
  - `addActiveFeature()` - Add new feature to tracking
  - `getActiveFeatures()` - Get all tracked features
  - `switchFeatureContext()` - Switch between feature contexts
  - `getFeatureContext()` - Get context for specific feature

#### Intent Detection (v1.4.0)
  - `detectNewFeatureIntent()` - Detect new feature request from user message
  - `matchImplicitAgentTrigger()` - Match message to agent trigger keywords
  - `matchImplicitSkillTrigger()` - Match message to skill trigger keywords
  - **8-language support**: EN, KO, JA, ZH, ES, FR, DE, IT

#### Ambiguity Detection (v1.4.0)
  - `calculateAmbiguityScore()` - Calculate ambiguity in user request
  - `generateClarifyingQuestions()` - Generate AskUserQuestion options
  - `detectAmbiguousTerms()` - Find unclear terms in message

#### Requirement Tracking (v1.4.0)
  - `extractRequirementsFromPlan()` - Parse requirements from plan document
  - `calculateRequirementFulfillment()` - Calculate completion percentage
  - `getUnfulfilledRequirements()` - List incomplete requirements

#### Phase Validation (v1.4.0)
  - `checkPhaseDeliverables()` - Check required deliverables for phase
  - `validatePdcaTransition()` - Validate phase transition is allowed
  - `getPhaseRequirements()` - Get requirements for specific phase

#### Configuration (existing)
  - `getConfig()` - Read from bkit.config.json
  - `getConfigArray()` - Get array value from config

#### File Classification (existing)
  - `isSourceFile()` - Negative pattern + extension detection (30+ extensions)
  - `isCodeFile()` - Tier-based code file detection
  - `isUiFile()` - UI component files (.tsx, .jsx, .vue, .svelte, .astro)
  - `isEnvFile()` - Environment file detection

#### Language Tier System (existing)
  - `getLanguageTier()` - Get tier (1-4, experimental, unknown) for file
  - `getTierDescription()` - Get tier description (AI-Native, Mainstream, etc.)
  - `getTierPdcaGuidance()` - Get PDCA guidance based on tier
  - `isTier1()`, `isTier2()`, `isTier3()`, `isTier4()` - Tier check helpers

#### Feature Detection (existing)
  - `extractFeature()` - Multi-language feature extraction
  - `findDesignDoc()` - Find design document for feature
  - `findPlanDoc()` - Find plan document for feature

#### Task Classification (existing)
  - `classifyTask()`, `classifyTaskByLines()` - Task size classification
  - `detectLevel()` - Project level detection (Starter/Dynamic/Enterprise)
  - `getPdcaGuidance()` - Get PDCA guidance for task size

#### JSON Output Helpers (existing)
  - `outputAllow()`, `outputBlock()`, `outputEmpty()` - Hook response helpers
  - `readStdinSync()`, `parseHookInput()` - Hook input helpers

#### PDCA Task System (existing)
  - `PDCA_PHASES` - PDCA phase definitions constant
  - `getPdcaTaskMetadata()` - Generate task metadata
  - `generatePdcaTaskSubject()` - Generate task subject
  - `generatePdcaTaskDescription()` - Generate task description
  - `generateTaskGuidance()` - Generate task creation guidance
  - `getPreviousPdcaPhase()` - Get previous PDCA phase
  - `findPdcaStatus()` - Read docs/.pdca-status.json
  - `getCurrentPdcaPhase()` - Get current PDCA phase for feature

### Language Tier System (v1.2.1)

bkit supports languages and frameworks organized by tier:

| Tier | Category | Languages/Frameworks |
|------|----------|---------------------|
| **Tier 1** | AI-Native Essential | Python, TypeScript, JavaScript, React/Next.js, Svelte |
| **Tier 2** | Mainstream Recommended | Go, Rust, Dart, Vue, Astro, Flutter, Tauri |
| **Tier 3** | Domain Specific | Java, Kotlin, Swift, C/C++, Angular, Electron |
| **Tier 4** | Legacy/Niche | PHP, Ruby, C#, Scala, Elixir |
| **Experimental** | Future Consideration | Mojo, Zig, V |

**Tier Selection Criteria**:
- AI tool ecosystem compatibility (Copilot, Claude, Cursor)
- Vibe Coding optimization
- Market share (IEEE Spectrum 2025)
- Training data availability

### Configurable Patterns (v1.2.1)
- `BKIT_EXCLUDE_PATTERNS` - Exclude directories (node_modules, __pycache__, .git, etc.)
- `BKIT_FEATURE_PATTERNS` - Feature directory patterns (features, modules, packages, etc.)

### Configuration
- `bkit.config.json` - Centralized configuration
  - Task classification thresholds
  - Level detection rules
  - PDCA document paths
  - Naming conventions

### Platform Note (v1.5.0)

> **v1.5.0**: bkit is now Claude Code exclusive. Gemini CLI support was removed for simplified architecture.

**Components**:
- `skills/` - 22 skills
- `agents/` - 11 agents
- `scripts/` - 39 scripts (Node.js)
- `lib/` - 4 modules (132 functions)
- `templates/` - 23 templates

## Templates (20)

### PDCA Templates
- `plan.template.md` - Plan phase
- `design.template.md` - Design phase
- `design-starter.template.md` - Starter-level design
- `design-enterprise.template.md` - Enterprise-level design
- `analysis.template.md` - Gap analysis
- `report.template.md` - Completion report
- `iteration-report.template.md` - Iteration report

### Pipeline Templates (10)
- `pipeline/phase-1-schema.template.md`
- `pipeline/phase-2-convention.template.md`
- `pipeline/phase-3-mockup.template.md`
- `pipeline/phase-4-api.template.md`
- `pipeline/phase-5-design-system.template.md`
- `pipeline/phase-6-ui.template.md`
- `pipeline/phase-7-seo-security.template.md`
- `pipeline/phase-8-review.template.md`
- `pipeline/phase-9-deployment.template.md`
- `pipeline/zero-script-qa.template.md`

### Other Templates
- `CLAUDE.template.md` - Project conventions
- `_INDEX.template.md` - Document index

## Triggers

- [[triggers/trigger-matrix]] - Event-based trigger matrix
- [[triggers/priority-rules]] - Priority and conflict rules

## Scenarios

- [[scenarios/scenario-write-code]] - Code write flow
- [[scenarios/scenario-new-feature]] - New feature request
- [[scenarios/scenario-qa]] - QA execution

## Testing

- [[testing/test-checklist]] - Test checklist
