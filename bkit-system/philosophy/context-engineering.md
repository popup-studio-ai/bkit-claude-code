# Context Engineering Principles

> Optimal token curation for LLM inference - bkit's core design principle
>
> **v1.4.1**: Analyzing bkit architecture from Context Engineering perspective
>
> **v1.4.2**: Complete Context Engineering implementation with 8 functional requirements (FR-01~FR-08)
>
> **v1.4.4**: Skills-Agents multi-binding architecture, PDCA Skill integration (8 actions)
>
> **v1.4.5**: `/pdca archive` action, 8-language trigger completion, internationalization (KO→EN)
>
> **v1.5.0**: Claude Code Exclusive - simplified architecture

## What is Context Engineering?

Context Engineering is **the practice of optimally curating context tokens for LLM inference**.

```
Traditional Prompt Engineering:
  "The art of writing good prompts"

Context Engineering:
  "The art of designing systems that integrate prompts, tools, and state
   to provide LLMs with optimal context for inference"
```

bkit is a **practical implementation of Context Engineering**, providing a systematic context management system for Claude Code.

---

## v1.4.2 Context Engineering Architecture

v1.4.2 implements 8 functional requirements (FR-01~FR-08) for comprehensive context management:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    bkit v1.4.2 Context Engineering Architecture              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                 Multi-Level Context Hierarchy (FR-01)                   │ │
│  │                                                                         │ │
│  │  L1: Plugin Policy ──→ L2: User Config ──→ L3: Project ──→ L4: Session │ │
│  │     (bkit defaults)     (~/.claude/bkit/)   (.pdca-status)   (runtime)  │ │
│  │                                                                         │ │
│  │  Priority: L4 > L3 > L2 > L1 (later levels override earlier)           │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ @import Directive│  │ context:fork     │  │ Permission       │          │
│  │ (FR-02)          │  │ (FR-03)          │  │ Hierarchy (FR-05)│          │
│  │                  │  │                  │  │                  │          │
│  │ • SKILL.md loads │  │ • Isolated exec  │  │ • deny: block    │          │
│  │ • Variable subst │  │ • Deep clone     │  │ • ask: confirm   │          │
│  │ • Circular detect│  │ • Merge-back opt │  │ • allow: permit  │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │                     │                      │                    │
│           └─────────────────────┼──────────────────────┘                    │
│                                 ▼                                            │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                       5-Layer Hook System + New Events                  │ │
│  │                                                                         │ │
│  │  L1: hooks.json ─→ SessionStart, UserPromptSubmit (FR-04), PreCompact  │ │
│  │  L2: Skill YAML ─→ PreToolUse, PostToolUse, Stop                       │ │
│  │  L3: Agent YAML ─→ PreToolUse, PostToolUse                             │ │
│  │  L4: Triggers   ─→ 8-language keyword detection                        │ │
│  │  L5: Scripts    ─→ 28 Node.js modules                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                 │                                            │
│                                 ▼                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │ Task Dependency  │  │ Context Compaction│ │ MEMORY Variable  │          │
│  │ Chain (FR-06)    │  │ Hook (FR-07)      │  │ (FR-08)          │          │
│  │                  │  │                  │  │                  │          │
│  │ • PDCA blocking  │  │ • State snapshot │  │ • Session persist│          │
│  │ • blockedBy meta │  │ • Auto-cleanup   │  │ • Key-value store│          │
│  │ • Non-blocking   │  │ • 10 recent kept │  │ • .bkit-memory   │          │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Library Modules (6 modules, 86+ functions)

| Module | FR | Purpose | Key Functions |
|--------|:--:|---------|---------------|
| `lib/context-hierarchy.js` | FR-01 | Multi-level context management | `getContextHierarchy()`, `mergeContextLevels()`, `setSessionContext()` |
| `lib/import-resolver.js` | FR-02 | @import directive processing | `resolveImports()`, `resolveVariables()`, `detectCircularImport()` |
| `lib/context-fork.js` | FR-03 | Context isolation | `forkContext()`, `mergeForkedContext()`, `discardFork()` |
| `lib/permission-manager.js` | FR-05 | Permission hierarchy | `checkPermission()`, `getToolPermission()` |
| `lib/memory-store.js` | FR-08 | Session persistence | `setMemory()`, `getMemory()`, `deleteMemory()` |
| `lib/common.js` | All | Core utilities | 76+ functions for PDCA, intent, caching |

---

## bkit's Context Engineering Structure

### 1. Domain Knowledge Layer (21 Skills)

Skills provide **structured domain knowledge**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Domain Knowledge Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Core (2)    │  │ Level (3)   │  │ Pipeline(10)│             │
│  │             │  │             │  │             │             │
│  │ bkit-rules  │  │ starter     │  │ phase-1~9   │             │
│  │ bkit-templ  │  │ dynamic     │  │ development │             │
│  │             │  │ enterprise  │  │ -pipeline   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Specialized (3)                         │   │
│  │  zero-script-qa │ mobile-app │ desktop-app              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Context Engineering Techniques**:

| Technique | Application | Effect |
|-----------|-------------|--------|
| **Hierarchical Tables** | Level/Phase-specific methods | Conditional knowledge selection |
| **ASCII Diagrams** | Architecture visualization | Structural understanding |
| **Checklists** | Clear completion criteria | Enables automation |
| **Code Examples** | Ready-to-apply references | Consistent implementation |

### 2. Behavioral Rules Layer (11 Agents)

Agents define **role-based behavioral rules**.

```
┌─────────────────────────────────────────────────────────────────┐
│                    Behavioral Rules Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Role Definition Pattern                     │   │
│  │                                                         │   │
│  │  1. Specify expertise (Expert in X)                     │   │
│  │  2. Define responsibility scope (responsible for X)     │   │
│  │  3. Specify level (CTO-level, beginner-friendly)        │   │
│  │  4. Reference real cases (bkamp.ai case study)          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Constraint Specification                    │   │
│  │                                                         │   │
│  │  • Permission Mode: plan | acceptEdits                  │   │
│  │  • Allowed/Disallowed Tools                             │   │
│  │  • Score Thresholds (70/90%)                            │   │
│  │  • Workflow Rules (docs first, step-by-step)            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Model Selection Strategy by Agent**:

| Model | Agents | Characteristics |
|-------|--------|-----------------|
| **opus** | code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect | Complex analysis, strategic judgment |
| **sonnet** | bkend-expert, pdca-iterator, pipeline-guide, starter-guide | Execution, guidance, iteration |
| **haiku** | qa-monitor, report-generator | Fast monitoring, document generation |

### 3. State Management Layer (lib/common.js)

A **state management system** composed of 86+ functions across 6 library modules.

```
┌─────────────────────────────────────────────────────────────────┐
│                    State Management Layer                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   PDCA Status v2.0   │  │   Multi-Feature      │            │
│  │                      │  │   Context            │            │
│  │  • activeFeatures[]  │  │                      │            │
│  │  • primaryFeature    │  │  • setActiveFeature  │            │
│  │  • features {}       │  │  • switchContext     │            │
│  │  • pipeline {}       │  │  • getFeatureContext │            │
│  │  • session {}        │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   Intent Detection   │  │   Ambiguity          │            │
│  │   (8 Languages)      │  │   Detection          │            │
│  │                      │  │                      │            │
│  │  EN, KO, JA, ZH      │  │  • Score calculation │            │
│  │  ES, FR, DE, IT      │  │  • Generate questions│            │
│  │                      │  │  • Magic Word Bypass │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    TTL-based Caching                      │  │
│  │                                                          │  │
│  │  _cache = { data: Map, timestamps: Map, defaultTTL: 5s } │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5-Layer Hook System

bkit's context injection occurs at **5 layers**.

```
Layer 1: hooks.json (Global)
         └── SessionStart only (AskUserQuestion guidance)

Layer 2: Skill Frontmatter
         └── hooks: { PreToolUse, PostToolUse, Stop }

Layer 3: Agent Frontmatter
         └── hooks: { PreToolUse, PostToolUse }

Layer 4: Description Triggers
         └── "Triggers:" keyword matching (8 languages)

Layer 5: Scripts (39 modules)
         └── Actual Node.js logic execution
```

**Context Injection by Hook Event**:

| Event | Timing | Injection Type |
|-------|--------|----------------|
| **SessionStart** | Session start | Onboarding, PDCA status, trigger table |
| **PreToolUse** | Before tool execution | Validation checklist, convention hints |
| **PostToolUse** | After tool execution | Next step guide, analysis suggestion |
| **Stop** | Agent termination | State transition, user choice prompt |

---

## Dynamic Context Injection Patterns

### Pattern 1: Task Size → PDCA Level

```javascript
// lib/common.js: classifyTaskByLines()
const classification = {
  quick_fix: lines < 10,      // PDCA: None
  minor_change: lines < 50,   // PDCA: Light mention
  feature: lines < 200,       // PDCA: Recommended
  major_feature: lines >= 200 // PDCA: Required
};
```

### Pattern 2: User Intent → Agent/Skill Auto-Trigger

```javascript
// lib/common.js: matchImplicitAgentTrigger()
const implicitPatterns = {
  'gap-detector': {
    patterns: [/맞아\??/, /이거 괜찮아\??/, /is this right\?/i],
    contextRequired: ['design', 'implementation']
  },
  'pdca-iterator': {
    patterns: [/고쳐/, /개선해줘/, /make.*better/i],
    contextRequired: ['check', 'act']
  }
};
```

### Pattern 3: Ambiguity Score → Clarifying Questions

```javascript
// lib/common.js: calculateAmbiguityScore()
// Score >= 50 → Trigger AskUserQuestion

// Addition factors
- No specific nouns: +20
- Undefined scope: +20
- Multiple interpretations possible: +30
- Context conflict: +30

// Subtraction factors
- Contains file path: -30
- Contains technical terms: -20

// Magic Word Bypass
!hotfix, !prototype, !bypass → Score = 0
```

### Pattern 4: Match Rate → Check-Act Iteration

```
gap-detector (Check) → Calculate Match Rate
    ├── >= 90% → report-generator (Complete)
    ├── 70-89% → AskUserQuestion (manual/auto choice)
    └── < 70%  → Strongly recommend pdca-iterator
                      ↓
                 Re-run gap-detector
                      ↓
                 Repeat (max 5 iterations)
```

---

## Response Report Rule (v1.4.1)

Reports bkit feature usage status at the end of every response.

```markdown
─────────────────────────────────────────────────
📊 bkit Feature Usage Report
─────────────────────────────────────────────────
✅ Used: [bkit features used in this response]
⏭️ Not Used: [Major unused features] (reason)
💡 Recommended: [Features suitable for next task]
─────────────────────────────────────────────────
```

**Recommendations by PDCA Stage**:

| Current Status | Recommendation |
|----------------|----------------|
| No PDCA | Start with `/pdca plan` |
| Plan complete | Design with `/pdca design` |
| Design complete | Implement or `/pdca next` |
| Do complete | Gap analysis with `/pdca analyze` |
| Check < 90% | Auto-improve with `/pdca iterate` |
| Check >= 90% | Complete with `/pdca report` |

---

## Component Architecture (v1.5.0)

> **Note**: As of v1.5.0, bkit is Claude Code exclusive.

| Component | Location | Count |
|-----------|----------|:-----:|
| Skills | `skills/*/SKILL.md` | 22 |
| Agents | `agents/*.md` | 11 |
| Scripts | `scripts/*.js` | 39 |
| Templates | `templates/*.md` | 23 |
| lib/ modules | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/` | 132 functions |
| Context File | `CLAUDE.md` | 1 |
| Manifest | `.claude-plugin/plugin.json` | 1 |

---

## Functional Requirements (v1.4.2)

### FR-01: Multi-Level Context Hierarchy

A 4-level context hierarchy with priority-based merging.

```
L1: Plugin Policy (${PLUGIN_ROOT}/bkit.config.json)
    ↓ override
L2: User Config (~/.claude/bkit/user-config.json)
    ↓ override
L3: Project Config (${PROJECT_DIR}/bkit.config.json)
    ↓ override
L4: Session Context (in-memory runtime state)
```

**Implementation**: `lib/context-hierarchy.js` (282 lines)

**Key Functions**:
- `getContextHierarchy()`: Load and merge all 4 levels
- `getHierarchicalConfig(keyPath)`: Access config by dot-notation path
- `setSessionContext(key, value)`: Set runtime session values
- `getUserConfigDir()`: Platform-specific user config directory

**Usage**:
```javascript
const { getHierarchicalConfig } = require('./lib/context-hierarchy.js');

// Get merged value from hierarchy (L4 > L3 > L2 > L1)
const threshold = getHierarchicalConfig('pdca.matchThreshold'); // e.g., 90
```

### FR-02: @import Directive

External context file loading with variable substitution.

**Supported Variables**:
- `${PLUGIN_ROOT}` - bkit plugin installation directory
- `${PROJECT}` - Current project directory
- `${USER_CONFIG}` - User config directory

**Syntax in SKILL.md/Agent.md frontmatter**:
```yaml
---
name: my-skill
imports:
  - ./shared/api-patterns.md
  - ${PLUGIN_ROOT}/templates/error-handling.md
  - ${PROJECT}/conventions.md
---
```

**Implementation**: `lib/import-resolver.js` (272 lines)

**Features**:
- Relative and absolute path resolution
- Variable substitution
- Circular dependency detection
- TTL-based caching

**Shared Context Files** (`templates/shared/`):
| File | Purpose |
|------|---------|
| `api-patterns.md` | RESTful API design patterns |
| `error-handling-patterns.md` | Error handling best practices |
| `naming-conventions.md` | Naming convention standards |

### FR-03: Context Fork Isolation

Skills/Agents can execute in isolated context copies.

**Frontmatter Extension**:
```yaml
---
name: gap-detector
context: fork      # fork | shared (default)
mergeResult: false # merge result back to parent
---
```

**Implementation**: `lib/context-fork.js` (228 lines)

**Key Functions**:
- `forkContext(skillName, options)`: Create isolated deep clone
- `mergeForkedContext(forkId)`: Merge results back (arrays dedupe, objects merge)
- `discardFork(forkId)`: Discard without merging
- `getActiveForks()`: List active fork contexts

**Usage**:
```javascript
const { forkContext, mergeForkedContext, discardFork } = require('./lib/context-fork.js');

const { forkId, context } = forkContext('my-skill', { mergeResult: true });
// ... isolated operations on context ...
mergeForkedContext(forkId);  // or discardFork(forkId)
```

**Agents Using Fork**:
- `gap-detector.md` - context: fork, mergeResult: false
- `design-validator.md` - context: fork, mergeResult: false

### FR-04: UserPromptSubmit Hook

User input preprocessing before AI processing.

**Hook Registration** (`hooks/hooks.json`):
```json
{
  "UserPromptSubmit": [{
    "hooks": [{
      "type": "command",
      "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-handler.js",
      "timeout": 3000
    }]
  }]
}
```

**Implementation**: `scripts/user-prompt-handler.js` (110 lines)

**Processing Flow**:
1. Feature Intent Detection - Detect new feature requests
2. Agent Trigger Detection - Match implicit agent triggers (8 languages)
3. Skill Trigger Detection - Match implicit skill triggers
4. Ambiguity Detection - Calculate ambiguity score

**Output**:
```json
{
  "hookSpecificOutput": {
    "hookEventName": "UserPromptSubmit",
    "additionalContext": "Detected intent: new feature 'auth-system'"
  }
}
```

### FR-05: Permission Hierarchy

Three-level permission system for tool access control.

**Permission Levels**:
| Level | Value | Behavior |
|-------|:-----:|----------|
| `deny` | 0 | Block tool execution (exit code 2) |
| `ask` | 1 | Add confirmation context |
| `allow` | 2 | Permit execution (default) |

**Configuration** (`bkit.config.json`):
```json
{
  "permissions": {
    "Write": "allow",
    "Bash(rm -rf*)": "deny",
    "Bash(git push --force*)": "deny",
    "Bash(docker system prune*)": "ask"
  }
}
```

**Implementation**: `lib/permission-manager.js` (205 lines)

**Key Functions**:
- `checkPermission(toolName, toolInput)`: Check permission level
- `getToolPermission(toolName)`: Get configured permission
- Pattern matching with glob-style wildcards

### FR-06: Task Dependency Chain

PDCA phase-based task blocking using Claude Code Task System.

**Task Classification Behavior**:
| Classification | Lines | Task Created | blockedBy |
|---------------|:-----:|:------------:|:---------:|
| quick_fix | <10 | ❌ Skip | N/A |
| minor_change | <50 | ❌ Skip | N/A |
| feature | <200 | ✅ Yes | Optional |
| major_feature | ≥200 | ✅ Yes | Auto-set |

**Non-Blocking PDCA**: `blockedBy` is dependency tracking metadata, not a hard block.

**Implementation**: `lib/common.js` - `autoCreatePdcaTask()` function

### FR-07: Context Compaction Hook

Preserve PDCA state during context compaction.

**Hook Registration** (`hooks/hooks.json`):
```json
{
  "PreCompact": [{
    "matcher": "auto|manual",
    "hooks": [{
      "type": "command",
      "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js",
      "timeout": 5000
    }]
  }]
}
```

**Implementation**: `scripts/context-compaction.js` (96 lines)

**Features**:
- PDCA state snapshot to `docs/.pdca-snapshots/`
- Automatic cleanup (keeps 10 most recent)
- State summary in output for context restoration

### FR-08: MEMORY Variable Support

Session-persistent key-value storage.

**Storage Location**: `docs/.bkit-memory.json`

**Implementation**: `lib/memory-store.js` (189 lines)

**API**:
```javascript
const { setMemory, getMemory, deleteMemory, getAllMemory, clearMemory } = require('./lib/memory-store.js');

setMemory('lastFeature', 'auth-system');
const feature = getMemory('lastFeature', 'default');
deleteMemory('lastFeature');
const all = getAllMemory();
clearMemory();
```

**Use Cases**:
- Session counter tracking
- Last active feature persistence
- User preference storage
- Cross-session state

---

## Module Integration Map

All new modules are integrated through the following call paths:

| Module | Called From | Trigger |
|--------|-------------|---------|
| `context-hierarchy.js` | `hooks/session-start.js` | SessionStart |
| `import-resolver.js` | `hooks/session-start.js`, `user-prompt-handler.js` | SessionStart, UserPromptSubmit |
| `context-fork.js` | `hooks/session-start.js` | SessionStart (stale fork cleanup) |
| `permission-manager.js` | `scripts/pre-write.js` | PreToolUse (Write\|Edit) |
| `memory-store.js` | `hooks/session-start.js` | SessionStart |

---

## v1.4.4 Architecture Diagrams

### Component Diagram (5-Layer Architecture)

```mermaid
flowchart TB
    subgraph UserLayer["User Request"]
        UR[User Input]
    end

    subgraph SkillLayer["Skill Layer (Entry Point)"]
        PDCA["/pdca<br/>agents:<br/>analyze: gap-detector<br/>iterate: pdca-iterator"]
        ENT["/enterprise<br/>agents:<br/>init: enterprise-expert<br/>infra: infra-architect"]
        P8["/phase-8<br/>agents:<br/>design: design-validator<br/>code: code-analyzer"]
    end

    subgraph Orchestrator["skill-orchestrator.js (Enhanced)"]
        PAF["parseAgentsField()"]
        GAA["getAgentForAction()"]
        OSPre["orchestrateSkillPre()"]
        OSPost["orchestrateSkillPost()"]
    end

    subgraph AgentLayer["Agent Layer"]
        GD["gap-detector<br/>Stop Hook: gap-detector-stop.js"]
        PI["pdca-iterator<br/>Stop Hook: iterator-stop.js"]
        RG["report-generator<br/>Skills: bkit-templates, pdca"]
    end

    subgraph StopHooks["Stop Hooks Layer (Enhanced)"]
        GDS["gap-detector-stop.js<br/>• Match Rate branching<br/>• Task auto-creation<br/>• AskUserQuestion prompt"]
        ITS["iterator-stop.js<br/>• Iteration result branching<br/>• Auto re-analyze trigger<br/>• Task status update"]
    end

    subgraph StateLayer["State Management Layer"]
        PDS[".pdca-status.json<br/>matchRate, iterationCount, phase"]
        MEM[".bkit-memory<br/>activePdca, pdcaHistory, sessionCount"]
        TASK["Task System<br/>[Plan]→[Design]→[Do]→[Check]→[Act]→[Report]"]
    end

    UR --> SkillLayer
    PDCA --> Orchestrator
    ENT --> Orchestrator
    P8 --> Orchestrator
    Orchestrator --> AgentLayer
    GD --> StopHooks
    PI --> StopHooks
    StopHooks --> StateLayer
```

### Data Flow (PDCA Analyze Cycle)

```mermaid
flowchart TD
    A["User: /pdca analyze feature"] --> B["Skill: pdca<br/>Action: analyze"]
    B -->|"getAgentForAction('pdca', 'analyze')"| C["Agent: gap-detector<br/>model: opus"]
    C -->|"Design vs Implementation comparison"| D["Analysis Result<br/>matchRate: 85%"]
    D -->|"Agent Stop"| E["gap-detector-stop.js"]
    E -->|"matchRate < 90%"| F["Task Auto-Creation<br/>[Act-1] feature<br/>blockedBy: [Check]"]
    E -->|"matchRate < 90%"| G["AskUserQuestion<br/>'Auto-improve?'<br/>• Auto-improve (Recommended)<br/>• Manual fix<br/>• Complete as-is"]
    E -->|"matchRate >= 90%"| H["Task Auto-Creation<br/>[Report] feature<br/>blockedBy: [Check]"]
    E -->|"matchRate >= 90%"| I["AskUserQuestion<br/>'Generate report?'<br/>• Generate report<br/>• Continue improvement"]
```

### Component Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `skill-orchestrator.js` | `lib/common.js` | PDCA state management functions |
| `gap-detector-stop.js` | `lib/common.js` | Task creation, state update |
| `iterator-stop.js` | `lib/common.js` | Task update, phase transition |
| `pdca` skill | `templates/*.md` | Template imports |
| `agents/*.md` | `skills` | `skills_preload`, `skills` fields |

### Agents Multi-Binding

v1.4.4 introduces `agents` field for action-specific agent routing:

```yaml
# Single binding (backward compatible)
agent: starter-guide

# Multi-binding (v1.4.4)
agents:
  analyze: gap-detector      # /pdca analyze → gap-detector
  iterate: pdca-iterator     # /pdca iterate → pdca-iterator
  report: report-generator   # /pdca report → report-generator
  default: gap-detector      # fallback agent
```

**Skills with Multi-Binding**:
| Skill | Actions | Agents |
|-------|---------|--------|
| `pdca` | analyze, iterate, report | gap-detector, pdca-iterator, report-generator |
| `enterprise` | init, strategy, infra | enterprise-expert, infra-architect |
| `phase-8-review` | design, code | design-validator, code-analyzer |

---

## Related Documents

- [[core-mission]] - Three core philosophies
- [[ai-native-principles]] - AI-Native development principles
- [[pdca-methodology]] - PDCA methodology
- [[../triggers/trigger-matrix]] - Trigger matrix
- [[../components/hooks/_hooks-overview]] - Hook system details
