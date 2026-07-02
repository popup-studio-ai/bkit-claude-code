# bkit Graph Index

> Obsidian graph view central hub. All components connect from this file. **Current release: v2.1.13 GA (Sprint Management major feature + tech debt cleanup on top of v2.1.11 4 Sprints × 20 FRs foundation; v2.1.12 hotfix between)**.
>
> **Version history is maintained in [CHANGELOG.md](../CHANGELOG.md) (single source of truth).** This file focuses on the current component graph; do not embed historical release notes here.
>
> Current release highlights:
> - **Sprint Management (v2.1.13 GA)** — 8-phase meta-container (prd→plan→design→do→iterate→qa→report→archived), 16 sub-actions, 4 Auto-Pause Triggers (QUALITY_GATE_FAIL/ITERATION_EXHAUSTED/BUDGET_EXCEEDED/PHASE_TIMEOUT), Trust Level scope L0-L4 via `SPRINT_AUTORUN_SCOPE`, 7-Layer S1 dataFlowIntegrity QA via `sprint-qa-flow` agent
> - **Tech Debt Cleanup (v2.1.13)** — net −2,333 LOC (7 legacy `templates/infra/*` removed: argocd/deploy-{dynamic,enterprise,staging-eks-ondemand}/observability x3/security/terraform)
> - 4 Sprints × 20 FRs (α Onboarding, β Discoverability, γ Trust Foundation, δ Port + Governance)
> - Clean Architecture 4-Layer with 7 Port↔Adapter pairs (Domain ports 7 + guards 4, 0 forbidden imports CI-enforced)
> - Defense-in-Depth 4-Layer (CC Built-in → bkit PreToolUse → audit-logger → Token Ledger)
> - Invocation Contract L1~L5 (226 CI-gated assertions + L2 smoke + L3 MCP stdio + L5 E2E shell + 8 v2.1.13 contract SC-01~08)
> - 3-Layer Orchestration (`lib/orchestrator/` 5 modules) + Sprint orchestration (Sequential dispatch ENH-292 pattern)
> - One-Liner SSoT 5/5 (`lib/infra/branding.js`)
> - Quality Gates M1-M10 catalog + invariant + Sprint S1 (dataFlow integrity)
> - i18n KO/EN full + 6-lang fallback
> - BKIT_VERSION 5-location invariant (`bkit.config.json` SSoT — F9-120 closure 9-streak PASS)

## Philosophy (4)

### Context Engineering (NEW)

bkit is a practical implementation of **Context Engineering**:

```
┌─────────────────────────────────────────────────────────────────┐
│              bkit Context Engineering Components                 │
├─────────────────────────────────────────────────────────────────┤
│  Domain Knowledge (44 Skills)  → Structured domain knowledge     │
│  Behavioral Rules (34 Agents)  → Role-based behavioral rules     │
│  State Management (lib/)       → 190 modules, 22 subdirectories  │
│  6-Layer Hook System           → 22 events, 25 blocks            │
│  Clean Architecture 4-Layer    → Domain / App / Infra / Pres     │
│  Dynamic Injection             → Conditional context selection   │
└─────────────────────────────────────────────────────────────────┘
```

## Philosophy

Core design principles and methodology:

- [[philosophy/core-mission|core-mission]] - Core mission & 3 philosophies (Automation First, No Guessing, Docs=Code)
- [[philosophy/ai-native-principles|ai-native-principles]] - AI-Native development & 3 core competencies
- [[philosophy/pdca-methodology|pdca-methodology]] - PDCA cycle & 9-stage pipeline relationship

## Skills (44)

### PDCA Skills (2)
- [[../skills/pdca/SKILL|pdca]] - Unified PDCA cycle management (8 actions) [Workflow]
- [[../skills/plan-plus/SKILL|plan-plus]] - Brainstorming-enhanced PDCA planning (v1.5.5) [Workflow + Hybrid]

### Sprint Skill (1) (v2.1.13)
- [[../skills/sprint/SKILL|sprint]] - Sprint Management meta-container (8-phase, 16 sub-actions, 4 auto-pause triggers, Trust Level scope L0-L4) [Workflow]

### PM Skill (1) (v1.6.0)
- [[../skills/pm-discovery/SKILL|pm-discovery]] - Product discovery and market research [Workflow]

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

## Agents (34)

### Sprint Agents (4) (v2.1.13)
- [[../agents/sprint-master-planner|sprint-master-planner]] - Sprint Master Plan + PRD + Plan + Design generation specialist (Context-Anchor-driven)
- [[../agents/sprint-orchestrator|sprint-orchestrator]] - Sprint full-lifecycle orchestrator (Sequential dispatch ENH-292 pattern for sub-agent caching mitigation)
- [[../agents/sprint-qa-flow|sprint-qa-flow]] - 7-Layer S1 dataFlowIntegrity verification (UI→Client→API→Validation→DB→Response→Client→UI hop traversal)
- [[../agents/sprint-report-writer|sprint-report-writer]] - phaseHistory + iterateHistory + featureMap + kpi + autoPause.pauseHistory aggregation → markdown report

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

### PM Team Agents (5) (v1.6.0)
- [[../agents/pm-lead|pm-lead]] - PM Team orchestrator
- [[../agents/pm-discovery|pm-discovery]] - Market and user research
- [[../agents/pm-strategy|pm-strategy]] - Product strategy and positioning
- [[../agents/pm-research|pm-research]] - Competitive analysis and data gathering
- [[../agents/pm-prd|pm-prd]] - PRD document generation

## v1.5.1 Features

### Output Styles (4)
- [[../output-styles/bkit-learning|bkit-learning]] - Learning-focused response formatting
- [[../output-styles/bkit-pdca-guide|bkit-pdca-guide]] - PDCA workflow response formatting
- [[../output-styles/bkit-enterprise|bkit-enterprise]] - Enterprise architecture response formatting
- [[../output-styles/bkit-pdca-enterprise|bkit-pdca-enterprise]] - Enterprise PDCA response formatting (v1.5.3)

### Agent Teams
- [[../lib/team/index|team module]] - Team coordination (Dynamic: 3, Enterprise: 5 teammates)
- [[../lib/team/strategy|team strategy]] - Level-based team composition patterns
- [[../lib/team/coordinator|team coordinator]] - Team availability and configuration
- [[../lib/team/hooks|team hooks]] - TaskCompleted and TeammateIdle handlers

### Agent Memory
- All 34 agents configured with `memory:` frontmatter
- 9 agents: `project` scope, 2 agents: `user` scope
- Automatic cross-session context persistence

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

## Hooks (22 events)

### Global Hooks (hooks/hooks.json)
- [[components/hooks/_hooks-overview|SessionStart]] - Plugin initialization with AskUserQuestion guidance

### Skill Frontmatter Hooks
- [[components/hooks/_hooks-overview|PreToolUse]] - Before Write/Edit operations (defined in SKILL.md)
- [[components/hooks/_hooks-overview|PostToolUse]] - After Write operations (defined in SKILL.md)

## Scripts (49)

> **Note**: All scripts converted to Node.js (.js) in v1.3.1 for cross-platform compatibility
>
> **v2.1.11**: Sprint α/β/γ/δ additions (check-trust-score-reconcile, check-quality-gates-m1-m10, release-plugin-tag.sh)

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
- `lib/common.js` - Shared utility functions (v2.0.3, **~620+ exports** via bridge)

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

**Components (v2.1.13 GA, 2026-05-12)**:
- `skills/` - 44 skills (v2.1.13 added sprint; v2.1.11 added bkit-evals, bkit-explore, pdca-watch, pdca-fast-track)
- `agents/` - 34 agents (v2.1.13 added sprint-master-planner / sprint-orchestrator / sprint-qa-flow / sprint-report-writer)
- `scripts/` - 61 scripts (Node.js) — v2.1.13 added sprint-handler.js (660 LOC) + sprint-memory-writer.js (138 LOC)
- `lib/` - 22 subdirectories, 190 modules — Clean Architecture 4-Layer with 7 Port↔Adapter pairs (v2.1.13 added `lib/application/sprint-lifecycle/` 13 modules + `lib/infra/sprint/` 9 modules)
- `templates/` - 40 templates (v2.1.13 added 7 sprint templates: master-plan/prd/plan/design/iterate/qa/report)
- `output-styles/` - 4 styles
- `servers/` - 2 MCP servers (bkit-pdca: 13 tools, bkit-analysis: 6 tools = **19 tools total**, registered via `lib/infra/mcp-port-registry.js`. v2.1.13 added bkit_sprint_list / bkit_sprint_status / bkit_master_plan_read)
- Test files - 118+ (qa-aggregate scope), 4,000+ TC (3,762 baseline + 261 v2.1.11 + 8 v2.1.13 contract SC-01~08)
- BKIT_VERSION - 2.1.13 (`bkit.config.json` SSoT; 5-location invariant; F9-120 closure 9-streak PASS)
- One-Liner - `lib/infra/branding.js` SSoT; 5-location invariant
- ACTION_TYPES - 20 (v2.1.13 added sprint_paused / sprint_resumed / master_plan_created / task_created)
- CATEGORIES - 11 (v2.1.13 added 'sprint')

## Templates (39)

### Sprint Templates (7) (v2.1.13)
- `sprint/master-plan.template.md` - Sprint master plan template (Context Anchor + 9-feature breakdown pattern)
- `sprint/prd.template.md` - Sprint-level PRD template
- `sprint/plan.template.md` - Sprint feature plan template
- `sprint/design.template.md` - Sprint design template (exact edit hunks pattern)
- `sprint/iterate.template.md` - Sprint iterate report template
- `sprint/qa.template.md` - Sprint QA report template (7-Layer S1 dataFlow)
- `sprint/report.template.md` - Sprint final report template (KPI + lessons learned)

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
