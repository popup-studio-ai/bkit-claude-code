# Scripts Overview

> 39 Node.js Scripts used by bkit hooks (v1.4.7)
>
> **v1.5.0**: Claude Code Exclusive - Gemini CLI support removed, simplified architecture
> **v1.4.7**: Core Modularization - lib/ split into 4 modules (132 functions), Task Management Integration
> **v1.4.6**: Sub-agent call stability with `bkit:` prefix
> **v1.4.5**: `/pdca archive` action, 8-language trigger completion
> **v1.4.4**: hooks-json-integration, unified handlers (unified-stop.js, unified-bash-pre.js, etc.)
> **v1.4.2**: Added UserPromptSubmit + PreCompact hooks, Context Engineering library modules
> **v1.4.1**: Added Context Engineering perspective - State Management Layer via lib/common.js
> **v1.3.1**: All scripts converted from Bash (.sh) to Node.js (.js) for cross-platform support
> **v1.3.0**: session-start.js enhanced with AskUserQuestion guidance (see [[../hooks/_hooks-overview]])

## What are Scripts?

Scripts are **the actual logic executed by Hooks**.
- Referenced from hooks/hooks.json and skill frontmatter
- Receive JSON input via stdin, output JSON via stdout
- Provide allow/block decisions and additionalContext
- **Cross-platform**: Windows (Native), macOS, Linux

## Context Engineering Perspective (v1.4.1)

Scripts and `lib/common.js` form bkit's **State Management Layer**, implementing dynamic context injection according to [[../../philosophy/context-engineering|Context Engineering]] principles.

### Dynamic Context Injection Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│                    State Management Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │   PDCA Status v2.0   │  │   Multi-Feature      │             │
│  │                      │  │   Context            │             │
│  │  • activeFeatures[]  │  │                      │             │
│  │  • primaryFeature    │  │  • setActiveFeature  │             │
│  │  • features {}       │  │  • switchContext     │             │
│  │  • pipeline {}       │  │  • getFeatureContext │             │
│  │  • session {}        │  │                      │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐             │
│  │   Intent Detection   │  │   Ambiguity          │             │
│  │   (8 Languages)      │  │   Detection          │             │
│  │                      │  │                      │             │
│  │  EN, KO, JA, ZH      │  │  • Score calculation │             │
│  │  ES, FR, DE, IT      │  │  • Clarifying Qs     │             │
│  │                      │  │  • Magic Word Bypass │             │
│  └──────────────────────┘  └──────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Injection Patterns

| Pattern | Implementation | Purpose |
|---------|----------------|---------|
| **Task Size → PDCA Level** | `classifyTaskByLines()` | Determine PDCA application level by task size |
| **User Intent → Agent Trigger** | `matchImplicitAgentTrigger()` | Match implicit agent from natural language |
| **Ambiguity Score → Questions** | `calculateAmbiguityScore()` | Generate clarifying questions for ambiguous requests |
| **Match Rate → Iteration** | Gap Analysis → Check-Act | Auto-improvement loop when below 90% |

## Source Location

All scripts are at root level (not in .claude/):

```
bkit-claude-code/
├── lib/                       # Modular Library (v1.4.7, 132 functions)
│   ├── common.js              # Migration Bridge (re-exports all modules)
│   ├── core/                  # Core utilities (7 files, 40 exports)
│   │   ├── index.js           # Entry point
│   │   ├── platform.js        # Platform detection (Claude/Gemini)
│   │   ├── cache.js           # In-memory TTL cache
│   │   ├── debug.js           # Debug logging
│   │   ├── config.js          # Configuration management
│   │   ├── io.js              # I/O utilities
│   │   └── file.js            # File type detection
│   ├── pdca/                  # PDCA management (6 files, 50 exports)
│   │   ├── index.js
│   │   ├── tier.js            # Language tier system
│   │   ├── level.js           # Project level detection
│   │   ├── phase.js           # PDCA phase management
│   │   ├── status.js          # Status file operations
│   │   └── automation.js      # Full-auto mode (v1.4.7)
│   ├── intent/                # Intent analysis (4 files, 19 exports)
│   │   ├── index.js
│   │   ├── language.js        # Multi-language detection
│   │   ├── trigger.js         # Agent/Skill triggers
│   │   └── ambiguity.js       # Ambiguity scoring
│   └── task/                  # Task management (5 files, 26 exports)
│       ├── index.js
│       ├── classification.js  # Task size classification
│       ├── context.js         # Context tracking
│       ├── creator.js         # Task chain creation (v1.4.7)
│       └── tracker.js         # Task ID persistence (v1.4.7)
├── hooks/
│   └── session-start.js       # SessionStart hook
├── scripts/
│   ├── pre-write.js           # Core: Unified PreToolUse hook (includes task classification)
│   ├── pdca-post-write.js     # Core: PostToolUse guidance
│   ├── select-template.js     # Core: Template selection
│   │
│   ├── phase-transition.js        # Phase: PDCA phase transition validation (v1.4.0)
│   ├── phase1-schema-stop.js      # Phase: Schema completion (v1.4.0)
│   ├── phase2-convention-pre.js   # Phase: Convention check
│   ├── phase2-convention-stop.js  # Phase: Convention completion (v1.4.0)
│   ├── phase3-mockup-stop.js      # Phase: Mockup completion (v1.4.0)
│   ├── phase4-api-stop.js         # Phase: Zero Script QA
│   ├── phase5-design-post.js      # Phase: Design token verify
│   ├── phase6-ui-post.js          # Phase: Layer separation
│   ├── phase7-seo-stop.js         # Phase: SEO/Security completion (v1.4.0)
│   ├── phase8-review-stop.js      # Phase: Review summary
│   ├── phase9-deploy-pre.js       # Phase: Deploy validation
│   │
│   ├── qa-pre-bash.js             # QA: Bash setup
│   ├── qa-monitor-post.js         # QA: Completion guidance
│   ├── qa-stop.js                 # QA: Session cleanup
│   │
│   ├── design-validator-pre.js    # Agent: Design validation
│   ├── gap-detector-post.js       # Agent: Gap analysis guidance
│   ├── gap-detector-stop.js       # Agent: Gap detector completion (v1.3.0)
│   ├── iterator-stop.js           # Agent: Iterator completion (v1.3.0)
│   ├── analysis-stop.js           # Agent: Analysis completion
│   ├── code-analyzer-pre.js       # Agent: Code analyzer read-only block (v1.4.2)
│   │
│   ├── archive-feature.js         # Utility: Feature archiving
│   ├── sync-folders.js            # Utility: Folder sync
│   ├── validate-plugin.js         # Utility: Plugin validation
│   │
│   ├── user-prompt-handler.js     # Hook: UserPromptSubmit (v1.4.2)
│   └── context-compaction.js      # Hook: PreCompact (v1.4.2)
└── bkit.config.json           # Centralized configuration
```

## Script Categories

### Core Scripts (3)

| Script | Hook | Purpose |
|--------|------|---------|
| **pre-write.js** | PreToolUse (Write\|Edit) | Unified hook: PDCA check + task classification + convention hints |
| **pdca-post-write.js** | PostToolUse (Write) | Guide next steps, suggest gap analysis |
| **select-template.js** | - | Select template based on level and document type |

> **Note**: Task classification logic is integrated into pre-write.js via lib/common.js

### Phase Scripts (11)

**Active Phase Scripts** (Connected to SKILL.md frontmatter):

| Script | Hook | Phase | Purpose |
|--------|------|-------|---------|
| phase-transition.js | - | All | PDCA phase transition validation (v1.4.0) |
| phase2-convention-pre.js | PreToolUse | Phase 2 | Convention check before write |
| phase4-api-stop.js | Stop | Phase 4 | Zero Script QA guidance after API |
| phase5-design-post.js | PostToolUse | Phase 5 | Design token verification |
| phase6-ui-post.js | PostToolUse | Phase 6 | UI layer separation check |
| phase8-review-stop.js | Stop | Phase 8 | Review completion summary |
| phase9-deploy-pre.js | PreToolUse | Phase 9 | Deployment environment validation |

**Prepared Scripts** (Script exists, hook not connected in SKILL.md):

| Script | Hook | Phase | Status |
|--------|------|-------|--------|
| phase1-schema-stop.js | Stop | Phase 1 | Script ready, hook not connected |
| phase2-convention-stop.js | Stop | Phase 2 | Script ready, hook not connected |
| phase3-mockup-stop.js | Stop | Phase 3 | Script ready, hook not connected |
| phase7-seo-stop.js | Stop | Phase 7 | Script ready, hook not connected |

> **Note**: Scripts added in v1.4.0, but hooks frontmatter not yet added to corresponding SKILL.md files.

### QA Scripts (3)

| Script | Hook | Purpose |
|--------|------|---------|
| qa-pre-bash.js | PreToolUse (Bash) | Block destructive commands during QA |
| qa-monitor-post.js | PostToolUse | Critical issue notification |
| qa-stop.js | Stop | QA session cleanup |

### Agent Scripts (7)

| Script | Hook | Agent(s) | Purpose |
|--------|------|----------|---------|
| design-validator-pre.js | PreToolUse | design-validator | Design document checklist |
| gap-detector-stop.js | Stop | gap-detector | Check-Act iteration: triggerNextPdcaAction (v1.4.7) |
| iterator-stop.js | Stop | pdca-iterator | Check-Act iteration: triggerNextPdcaAction (v1.4.7) |
| pdca-skill-stop.js | Stop | pdca skill | Task Chain Auto-Creation (v1.4.7) |
| analysis-stop.js | Stop | code-analyzer | Analysis completion guidance |
| qa-pre-bash.js | PreToolUse | qa-monitor | Block destructive commands during QA |
| qa-monitor-post.js | PostToolUse | qa-monitor | Critical issue notification |

> **Note (v1.4.7)**: `gap-detector-stop.js` and `iterator-stop.js` now use `triggerNextPdcaAction()` for automatic next phase triggering. `pdca-skill-stop.js` creates Task Chain on `/pdca plan`.

### Utility Scripts (3)

| Script | Purpose | Usage |
|--------|---------|-------|
| archive-feature.js | Feature archiving | `/archive` command |
| sync-folders.js | Folder synchronization | Manual maintenance |
| validate-plugin.js | Plugin validation | CI/CD or manual |

### Global Hook Scripts (2) - v1.4.2

| Script | Hook Event | Purpose |
|--------|------------|---------|
| user-prompt-handler.js | UserPromptSubmit | User input preprocessing, agent suggestion |
| context-compaction.js | PreCompact | PDCA state preservation during context compaction |

> **Note**: pdca-pre-write.js was deprecated and deleted in v1.4.2. Its functionality is integrated into pre-write.js.

## Shared Library: lib/ (v1.4.7)

> **v1.4.7**: Core Modularization - 4 module directories with 132 functions total
> **v1.4.2**: 6 library modules with 86+ functions total
> **v1.4.0**: Expanded from 38 to 80+ functions with dual platform support

### Library Modules (v1.4.7)

| Module | Files | Exports | Purpose |
|--------|:-----:|:-------:|---------|
| `lib/core/` | 7 | 40 | Platform detection, caching, debugging, configuration |
| `lib/pdca/` | 6 | 50 | PDCA phase, status, automation, tier system |
| `lib/intent/` | 4 | 19 | Language detection, triggers, ambiguity scoring |
| `lib/task/` | 5 | 26 | Task classification, context, creation, tracking |
| `lib/common.js` | 1 | 132 | Migration Bridge (re-exports all modules) |

### Import Options

```javascript
// Recommended: Import from specific modules
const { debugLog, getConfig } = require('./lib/core');
const { getPdcaStatusFull, updatePdcaStatus } = require('./lib/pdca');
const { matchImplicitAgentTrigger } = require('./lib/intent');
const { classifyTask, createPdcaTaskChain } = require('./lib/task');

// Legacy: Still supported via Migration Bridge
const common = require('./lib/common');
```

All scripts can require common utilities:

```javascript
#!/usr/bin/env node
const common = require('../lib/common.js');

// ═══════════════════════════════════════════════════════════════════
// Platform Detection (v1.5.0 - Claude Code Exclusive)
// ═══════════════════════════════════════════════════════════════════
common.isClaudeCode();                            // true if Claude Code
const pluginPath = common.getPluginPath();        // Plugin root path

// ═══════════════════════════════════════════════════════════════════
// Debug Logging (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
common.debugLog('message', { data: 'value' });    // Writes to ~/.claude/bkit-debug.log

// ═══════════════════════════════════════════════════════════════════
// Input Helpers
// ═══════════════════════════════════════════════════════════════════
const input = common.readStdinSync();             // Synchronous JSON from stdin
const { toolName, filePath } = common.parseHookInput(input);

// ═══════════════════════════════════════════════════════════════════
// Configuration (with caching)
// ═══════════════════════════════════════════════════════════════════
const config = common.getBkitConfig();            // Load bkit.config.json (cached)
const quickFix = common.getConfig('.pdca.thresholds.quickFix', 50);
const sourceDirs = common.getConfigArray('.sourceDirectories');

// ═══════════════════════════════════════════════════════════════════
// PDCA Status v2.0 (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
const status = common.createInitialStatusV2();    // Create v2.0 schema
common.migrateStatusToV2(oldStatus);              // Auto-migrate from v1.0
common.getDefaultFeatureStatus();                 // Default status for feature

// ═══════════════════════════════════════════════════════════════════
// Multi-Feature Management (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
common.setActiveFeature('auth');                  // Set current feature
common.addActiveFeature('payment');               // Add new feature
const features = common.getActiveFeatures();      // Get all features
common.switchFeatureContext('auth', 'payment');   // Switch context
const ctx = common.getFeatureContext('auth');     // Get feature context

// ═══════════════════════════════════════════════════════════════════
// Intent Detection (v1.4.0 - 8 languages)
// ═══════════════════════════════════════════════════════════════════
common.detectNewFeatureIntent('새 로그인 기능 만들어줘');  // { feature, confidence }
common.matchImplicitAgentTrigger('검증해줘');     // 'gap-detector'
common.matchImplicitSkillTrigger('fullstack app'); // 'dynamic'

// ═══════════════════════════════════════════════════════════════════
// Ambiguity Detection (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
const score = common.calculateAmbiguityScore('make it better');  // 0.0-1.0
const questions = common.generateClarifyingQuestions(message);   // AskUserQuestion options
const terms = common.detectAmbiguousTerms(message);              // Unclear terms list

// ═══════════════════════════════════════════════════════════════════
// Requirement Tracking (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
const reqs = common.extractRequirementsFromPlan(planContent);
const fulfillment = common.calculateRequirementFulfillment(reqs, code);  // 0-100%
const unfulfilled = common.getUnfulfilledRequirements(reqs, code);

// ═══════════════════════════════════════════════════════════════════
// Phase Validation (v1.4.0)
// ═══════════════════════════════════════════════════════════════════
common.checkPhaseDeliverables('design', 'auth');  // Check deliverables
common.validatePdcaTransition('plan', 'do');      // Validate transition
common.getPhaseRequirements('check');             // Get requirements

// ═══════════════════════════════════════════════════════════════════
// File Classification (Multi-Language Support)
// ═══════════════════════════════════════════════════════════════════
common.isSourceFile('/path/to/file');             // Negative pattern + extension detection
common.isCodeFile('/path/to/file.ts');            // Check 30+ language extensions
common.isUiFile('/path/to/Component.tsx');        // Check UI component (.tsx, .jsx, .vue, .svelte, .astro)
common.isEnvFile('/path/to/.env.local');          // Check env file

// ═══════════════════════════════════════════════════════════════════
// Feature Detection (Multi-Language Support)
// ═══════════════════════════════════════════════════════════════════
common.extractFeature('/src/features/auth/login.ts');  // Next.js features/
common.extractFeature('/internal/auth/handler.go');    // Go internal/
common.extractFeature('/app/routers/users.py');        // Python routers/
common.findDesignDoc('auth');                          // Find design document
common.findPlanDoc('auth');                            // Find plan document

// ═══════════════════════════════════════════════════════════════════
// Task Classification
// ═══════════════════════════════════════════════════════════════════
common.classifyTask(content);                     // Classify by size
common.getPdcaGuidance('feature');                // Get PDCA guidance

// ═══════════════════════════════════════════════════════════════════
// Level Detection
// ═══════════════════════════════════════════════════════════════════
common.detectLevel();                             // Starter/Dynamic/Enterprise

// ═══════════════════════════════════════════════════════════════════
// Language Tier System
// ═══════════════════════════════════════════════════════════════════
const tier = common.getLanguageTier('file.ts');   // 1-4, 'experimental', 'unknown'
const desc = common.getTierDescription(tier);     // 'AI-Native Essential', etc.
common.getTierPdcaGuidance(tier);                 // Get PDCA guidance for tier

// ═══════════════════════════════════════════════════════════════════
// JSON Output Helpers
// ═══════════════════════════════════════════════════════════════════
common.outputAllow('context message');            // Allow with context
common.outputBlock('block reason');               // Block with reason
common.outputEmpty();                             // Empty response {}

// ═══════════════════════════════════════════════════════════════════
// Text Safety
// ═══════════════════════════════════════════════════════════════════
common.xmlSafeOutput('<content>');                // Escape special chars
// Escapes: & → &amp;, < → &lt;, > → &gt;, " → &quot;, ' → &#39;

// ═══════════════════════════════════════════════════════════════════
// Task System Integration (v1.4.7)
// ═══════════════════════════════════════════════════════════════════
const { PDCA_PHASES } = common;                   // Phase definitions
common.getPdcaTaskMetadata('design', 'login');    // { pdcaPhase, pdcaOrder, feature, ... }
common.generatePdcaTaskSubject('design', 'login');  // "[Design] login"
common.generatePdcaTaskDescription('design', 'login'); // Full description
common.generateTaskGuidance('design', 'login');   // Guidance for additionalContext
common.getPreviousPdcaPhase('check');             // → 'do'
common.findPdcaStatus();                          // Read docs/.pdca-status.json
common.getCurrentPdcaPhase('login');              // Get current phase

// v1.4.7 Task Chain Functions
common.savePdcaTaskId('login', 'plan', 'task-123'); // Save Task ID
common.getPdcaTaskId('login', 'plan');              // Get Task ID
common.createPdcaTaskChain('login');                // Create Plan→Design→Do→Check→Report chain
common.getTaskChainStatus('login');                 // Get Task chain status
common.triggerNextPdcaAction('login', 'check', { matchRate: 85 }); // Trigger next action

// v1.4.7 Full-Auto Mode
common.getAutomationLevel();                        // 'manual' | 'semi-auto' | 'full-auto'
common.isFullAutoMode();                            // true if full-auto
common.shouldAutoAdvance('check');                  // Check if auto-advance allowed
common.generateAutoTrigger('check', { matchRate: 95 }); // Generate auto-trigger
```

### Configurable Patterns

```javascript
// Override via environment variable
process.env.BKIT_EXCLUDE_PATTERNS = 'node_modules .git dist build __pycache__ .venv target vendor';
process.env.BKIT_FEATURE_PATTERNS = 'features modules packages apps services domains';
```

### Supported Languages by Tier

#### Tier 1: AI-Native Essential
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| Python | `.py`, `.pyx`, `.pyi` | ⭐⭐⭐ Full |
| TypeScript | `.ts`, `.tsx` | ⭐⭐⭐ Full |
| JavaScript | `.js`, `.jsx`, `.mjs`, `.cjs` | ⭐⭐⭐ Full |

#### Tier 2: Mainstream Recommended
| Language/Framework | Extensions | AI Compatibility |
|--------------------|------------|------------------|
| Go | `.go` | ⭐⭐ Good |
| Rust | `.rs` | ⭐⭐ Good |
| Dart/Flutter | `.dart` | ⭐⭐ Good |
| Vue | `.vue` | ⭐⭐ Good |
| Svelte | `.svelte` | ⭐⭐ Good |
| Astro | `.astro` | ⭐⭐ Good |
| MDX | `.mdx` | ⭐⭐ Good |

#### Tier 3: Domain Specific
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| Java | `.java` | ⭐ Moderate |
| Kotlin | `.kt`, `.kts` | ⭐ Moderate |
| Swift | `.swift` | ⭐ Moderate |
| C/C++ | `.c`, `.cpp`, `.cc`, `.h`, `.hpp` | ⭐ Moderate |
| Shell | `.sh`, `.bash` | ⭐ Moderate |

#### Tier 4: Legacy/Niche
| Language | Extensions | AI Compatibility |
|----------|------------|------------------|
| PHP | `.php` | Limited |
| Ruby | `.rb`, `.erb` | Limited |
| C# | `.cs` | Limited |
| Scala | `.scala` | Limited |
| Elixir | `.ex`, `.exs` | Limited |

#### Experimental
| Language | Extensions | Status |
|----------|------------|--------|
| Mojo | `.mojo` | Monitoring |
| Zig | `.zig` | Monitoring |
| V | `.v` | Monitoring |

## Script Input/Output

### Input (stdin)

JSON from PreToolUse/PostToolUse:

```json
{
  "tool_name": "Write",
  "tool_input": {
    "file_path": "/path/to/file.ts",
    "content": "..."
  }
}
```

### Output (stdout)

**Allow with context**:
```json
{
  "decision": "allow",
  "hookSpecificOutput": {
    "additionalContext": "Message passed to Claude"
  }
}
```

**Block**:
```json
{
  "decision": "block",
  "reason": "Block reason"
}
```

**No action**:
```json
{}
```

## Key Script Details

### pre-write.js (Unified Hook)

```
Trigger: Write|Edit on source files

Actions (3 stages):

1. Task Classification
   - Measure content size
   - Reference bkit.config.json thresholds
   - < 50 chars → Quick Fix
   - < 200 chars → Minor Change
   - < 1000 chars → Feature (PDCA recommended)
   - >= 1000 chars → Major Feature (PDCA required)

2. PDCA Document Check
   - Extract feature name from file path
   - Check for design doc existence
   - If exists → "Reference design doc" guidance
   - If only plan → "Create design first" warning

3. Convention Hints
   - Code files → "Components=PascalCase, Functions=camelCase..."
   - Env files → "NEXT_PUBLIC_* (client), DB_* (database)..."

Output: All context combined into single JSON response
```

### qa-pre-bash.js

```
Trigger: Bash commands during zero-script-qa

Actions:
1. Search for destructive patterns
   - rm -rf, DROP TABLE, DELETE FROM, etc.
2. If found → block
3. If safe → allow with "Safe in QA environment"
```

### phase5-design-post.js

```
Trigger: Write on UI component files (extension-based detection)
         Detects: .tsx, .jsx, .vue, .svelte, .astro files using isUiFile()

Actions:
1. Search for hardcoded colors in content
   - #[0-9a-fA-F]{3,6}
   - rgb(, rgba(
2. If found → "Use design tokens" warning
3. If clean → "Design tokens correctly used" confirmation
```

## Script Writing Guide (Node.js)

### Required Elements

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Source common utilities
const common = require(path.join(process.env.CLAUDE_PLUGIN_ROOT, 'lib', 'common.js'));

// Read JSON from stdin
const input = common.readStdinSync();
const { filePath } = common.parseHookInput(input);

// Logic...

// Must output JSON
common.outputAllow('Guidance message');
```

### Best Practices

1. **Early exit**: Return `{}` quickly for irrelevant files
2. **Use JSON.parse**: Parse JSON safely with try/catch
3. **Minimize blocks**: Allow is default, block only when truly dangerous
4. **Concise messages**: Keep additionalContext brief
5. **Cross-platform**: Use path.join() for file paths

## Related Documents

- [[../../philosophy/context-engineering]] - Context Engineering Principles ⭐ NEW
- [[../hooks/_hooks-overview]] - Hook event details
- [[../skills/_skills-overview]] - Skill details
- [[../agents/_agents-overview]] - Agent details
- [[../../triggers/trigger-matrix]] - Trigger matrix
