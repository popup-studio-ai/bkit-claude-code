# bkit Graph Index

> Obsidian graph view central hub. All components connect from this file.
>
> **v1.2.0 Refactoring**: Skills consolidated, .claude/ removed from repo, single source of truth at root level

## Skills (18)

### Core Skills (2)
- [[components/skills/bkit-rules]] - PDCA rules + auto-triggering + code quality standards
- [[components/skills/bkit-templates]] - Document templates for consistent PDCA documentation

### Level Skills (3)
- [[components/skills/starter]] - Starter level (static web, HTML/CSS/JS, Next.js basics)
- [[components/skills/dynamic]] - Dynamic level (BaaS fullstack with bkend.ai)
- [[components/skills/enterprise]] - Enterprise level (MSA/K8s/Terraform, AI Native)

### Pipeline Phase Skills (10)
- [[components/skills/development-pipeline]] - 9-stage pipeline overview
- [[components/skills/phase-1-schema]] - Schema/terminology definition
- [[components/skills/phase-2-convention]] - Coding conventions
- [[components/skills/phase-3-mockup]] - Mockup development
- [[components/skills/phase-4-api]] - API design/implementation
- [[components/skills/phase-5-design-system]] - Design system
- [[components/skills/phase-6-ui-integration]] - UI implementation + API integration
- [[components/skills/phase-7-seo-security]] - SEO/Security
- [[components/skills/phase-8-review]] - Code review + quality analysis
- [[components/skills/phase-9-deployment]] - Deployment

### Specialized Skills (3)
- [[components/skills/zero-script-qa]] - Zero Script QA (log-based testing)
- [[components/skills/mobile-app]] - Mobile app development (React Native, Flutter)
- [[components/skills/desktop-app]] - Desktop app development (Electron, Tauri)

### Removed Skills (v1.2.0)
The following skills were consolidated:
- ~~task-classification~~ → `lib/common.sh`
- ~~level-detection~~ → `lib/common.sh`
- ~~pdca-methodology~~ → `bkit-rules`
- ~~document-standards~~ → `bkit-templates`
- ~~evaluator-optimizer~~ → `/pdca-iterate` command
- ~~analysis-patterns~~ → `bkit-templates`
- ~~ai-native-development~~ → `enterprise`
- ~~monorepo-architecture~~ → `enterprise`

## Agents (11)

### Level-Based Agents
- [[components/agents/starter-guide]] - Starter level guide (beginners)
- [[components/agents/bkend-expert]] - Dynamic level (BaaS expert)
- [[components/agents/enterprise-expert]] - Enterprise level (CTO-level advisor)
- [[components/agents/infra-architect]] - Infrastructure architect (AWS/K8s/Terraform)

### Task-Based Agents
- [[components/agents/pipeline-guide]] - Pipeline guide (9-phase development)
- [[components/agents/gap-detector]] - Gap analysis (design vs implementation)
- [[components/agents/design-validator]] - Design validation
- [[components/agents/code-analyzer]] - Code quality analysis
- [[components/agents/qa-monitor]] - QA monitoring (Zero Script QA)
- [[components/agents/pdca-iterator]] - Iteration optimizer (Evaluator-Optimizer pattern)
- [[components/agents/report-generator]] - Report generation

## Commands (18)

### Initialization
- `/init-starter` - Initialize Starter level project
- `/init-dynamic` - Initialize Dynamic level project
- `/init-enterprise` - Initialize Enterprise level project

### PDCA Workflow
- `/pdca-plan` - Create plan document
- `/pdca-design` - Create design document
- `/pdca-analyze` - Run gap analysis
- `/pdca-iterate` - Auto-fix with Evaluator-Optimizer
- `/pdca-report` - Generate completion report
- `/pdca-status` - Show PDCA dashboard
- `/pdca-next` - Guide next PDCA step

### Pipeline
- `/pipeline-start` - Start pipeline guide
- `/pipeline-next` - Next pipeline phase
- `/pipeline-status` - Pipeline progress

### Utilities
- `/zero-script-qa` - Run Zero Script QA
- `/learn-claude-code` - Learning curriculum
- `/setup-claude-code` - Generate project settings
- `/upgrade-claude-code` - Upgrade settings
- `/upgrade-level` - Upgrade project level

## Hooks (3 events)

Defined in `hooks/hooks.json`:

- [[components/hooks/SessionStart]] - Plugin initialization on session start
- [[components/hooks/PreToolUse]] - Before Write/Edit operations
- [[components/hooks/PostToolUse]] - After Write operations

## Scripts (19)

### Core Scripts
- [[components/scripts/pre-write]] - Unified PreToolUse hook (PDCA + classification + convention)
- [[components/scripts/pdca-post-write]] - PostToolUse guidance after Write
- [[components/scripts/task-classify]] - Task classification (Quick Fix → Major Feature)
- [[components/scripts/select-template]] - Template selection by level

### Phase Scripts
- [[components/scripts/phase2-convention-pre]] - Convention check before write
- [[components/scripts/phase4-api-stop]] - Zero Script QA after API implementation
- [[components/scripts/phase5-design-post]] - Design token verification
- [[components/scripts/phase6-ui-post]] - Layer separation verification
- [[components/scripts/phase8-review-stop]] - Review completion guidance
- [[components/scripts/phase9-deploy-pre]] - Deployment environment validation

### QA Scripts
- [[components/scripts/qa-pre-bash]] - QA setup before Bash
- [[components/scripts/qa-monitor-post]] - QA completion guidance
- [[components/scripts/qa-stop]] - QA session cleanup

### Agent Scripts
- [[components/scripts/design-validator-pre]] - Design document validation
- [[components/scripts/gap-detector-post]] - Gap analysis guidance
- [[components/scripts/analysis-stop]] - Analysis completion guidance

### Utility Scripts
- [[components/scripts/pdca-pre-write]] - Legacy (merged into pre-write.sh)
- [[components/scripts/sync-folders]] - Folder synchronization
- [[components/scripts/validate-plugin]] - Plugin validation

## Infrastructure

### Shared Library
- `lib/common.sh` - Shared utility functions
  - `get_config()` - Read from bkit.config.json
  - `is_source_file()` - Check if path is source code
  - `extract_feature()` - Extract feature name from path
  - `classify_task()` - Task size classification
  - `detect_level()` - Project level detection

### Configuration
- `bkit.config.json` - Centralized configuration
  - Task classification thresholds
  - Level detection rules
  - PDCA document paths
  - Naming conventions

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
