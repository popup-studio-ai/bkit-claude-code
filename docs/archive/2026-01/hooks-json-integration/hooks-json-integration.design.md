# hooks-json-integration Design Document

> **Summary**: Skills/Agents의 `${CLAUDE_PLUGIN_ROOT}` hooks를 hooks.json으로 통합하는 상세 설계
>
> **Project**: bkit-claude-code
> **Version**: 1.4.4
> **Author**: Claude
> **Date**: 2026-01-27
> **Status**: Draft
> **Plan Reference**: `docs/01-plan/features/hooks-json-integration.plan.md`

---

## 1. Architecture Overview

### 1.1 Current State Analysis

```
현재 구조:
┌─────────────────────────────────────────────────────────────┐
│ hooks/hooks.json (✅ 정상 작동)                              │
│   - SessionStart, PreToolUse, PostToolUse, UserPromptSubmit │
│   - PreCompact                                               │
└─────────────────────────────────────────────────────────────┘
                              +
┌─────────────────────────────────────────────────────────────┐
│ skills/*/SKILL.md (❌ ${CLAUDE_PLUGIN_ROOT} 미작동)         │
│   - 11개 파일에서 hooks frontmatter 사용                    │
│   - PreToolUse, PostToolUse, Stop 이벤트                    │
└─────────────────────────────────────────────────────────────┘
                              +
┌─────────────────────────────────────────────────────────────┐
│ agents/*.md (❌ ${CLAUDE_PLUGIN_ROOT} 미작동)               │
│   - 5개 파일에서 hooks frontmatter 사용                     │
│   - PreToolUse, PostToolUse, Stop 이벤트                    │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Target Architecture (Option A)

```
목표 구조:
┌─────────────────────────────────────────────────────────────┐
│ hooks/hooks.json (통합 - 모든 hooks 관리)                    │
│                                                              │
│   SessionStart → session-start.js (기존)                    │
│   PreToolUse:                                                │
│     - Write|Edit → pre-write.js (기존)                      │
│     - Bash → unified-bash-pre.js (NEW)                      │
│   PostToolUse:                                               │
│     - Write → unified-write-post.js (NEW)                   │
│     - Bash → unified-bash-post.js (NEW)                     │
│     - Skill → skill-post.js (기존)                          │
│   Stop → unified-stop.js (NEW)                              │
│   UserPromptSubmit → user-prompt-handler.js (기존)          │
│   PreCompact → context-compaction.js (기존)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│ 통합 스크립트 (조건부 분기)                                   │
│                                                              │
│   unified-stop.js                                            │
│     ├── getCurrentSkillOrAgent() 호출                       │
│     ├── SKILL_HANDLERS[skillName]?.run()                    │
│     └── AGENT_HANDLERS[agentName]?.run()                    │
│                                                              │
│   unified-bash-pre.js                                        │
│     ├── getCurrentSkill() 호출                               │
│     └── SKILL_BASH_PRE_HANDLERS[skillName]?.run()           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Component Design

### 2.1 hooks.json 최종 구조

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "description": "bkit Vibecoding Kit v1.4.4 - Unified hooks (GitHub #9354 workaround)",
  "hooks": {
    "SessionStart": [
      {
        "once": true,
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/hooks/session-start.js",
          "timeout": 5000
        }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-bash-pre.js",
          "timeout": 5000
        }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-write-post.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Bash",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-bash-post.js",
          "timeout": 5000
        }]
      },
      {
        "matcher": "Skill",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/skill-post.js",
          "timeout": 5000
        }]
      }
    ],
    "Stop": [
      {
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js",
          "timeout": 10000
        }]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-handler.js",
          "timeout": 3000
        }]
      }
    ],
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [{
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js",
          "timeout": 5000
        }]
      }
    ]
  }
}
```

---

## 3. New Scripts Design

### 3.1 unified-stop.js

**Purpose**: Stop 이벤트 통합 핸들러 - Skill/Agent 종료 시 적절한 핸들러 실행

**Location**: `scripts/unified-stop.js`

**Algorithm**:
```
1. stdin에서 hook context 읽기
2. context에서 현재 활성 skill/agent 식별
   - hook_data.skill_name 확인
   - hook_data.agent_name 확인
   - context에서 추출 (conversation 분석)
3. 해당 핸들러 실행 (조건부)
4. 결과 출력 (platform별 포맷)
```

**Code Structure**:
```javascript
#!/usr/bin/env node
/**
 * unified-stop.js - Unified Stop Event Handler (v1.4.4)
 *
 * GitHub Issue #9354 Workaround:
 * ${CLAUDE_PLUGIN_ROOT} doesn't expand in markdown files,
 * so all skill/agent stop hooks are consolidated here.
 */

const path = require('path');
const {
  readStdinSync,
  debugLog,
  isGeminiCli,
  outputAllow,
  getPdcaStatusFull
} = require('../lib/common.js');

// ============================================================
// Handler Registry
// ============================================================

/**
 * Skill Stop Handlers
 * Key: skill name (from SKILL.md frontmatter)
 * Value: handler module path
 */
const SKILL_HANDLERS = {
  'pdca': './pdca-skill-stop.js',
  'code-review': './code-review-stop.js',
  'phase-8-review': './phase8-review-stop.js',
  'claude-code-learning': './learning-stop.js',
  'phase-9-deployment': './phase9-deploy-stop.js',
  'phase-6-ui-integration': './phase6-ui-stop.js',
  'phase-5-design-system': './phase5-design-stop.js',
  'phase-4-api': './phase4-api-stop.js',
  'zero-script-qa': './qa-stop.js',
  'development-pipeline': null  // echo 명령어였음, 특별 처리
};

/**
 * Agent Stop Handlers
 * Key: agent name (from agent.md frontmatter)
 * Value: handler module path
 */
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js'
  // design-validator: PreToolUse only, no Stop handler
};

// ============================================================
// Context Detection
// ============================================================

/**
 * Detect active skill from hook context
 * @param {Object} hookContext - Hook input context
 * @returns {string|null} Skill name or null
 */
function detectActiveSkill(hookContext) {
  // 1. Direct skill_name in context
  if (hookContext.skill_name) {
    return hookContext.skill_name;
  }

  // 2. From tool_input (if Stop follows Skill tool)
  if (hookContext.tool_input?.skill) {
    return hookContext.tool_input.skill;
  }

  // 3. From conversation context (last skill invocation)
  // This requires parsing the conversation, which may be in hookContext.conversation
  const conversation = hookContext.conversation || '';
  const skillMatch = conversation.match(/\/(\w+[-\w]*)\s+/);
  if (skillMatch && SKILL_HANDLERS[skillMatch[1]]) {
    return skillMatch[1];
  }

  // 4. From PDCA status (last active skill)
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus?.session?.lastSkill) {
    return pdcaStatus.session.lastSkill;
  }

  return null;
}

/**
 * Detect active agent from hook context
 * @param {Object} hookContext - Hook input context
 * @returns {string|null} Agent name or null
 */
function detectActiveAgent(hookContext) {
  // 1. Direct agent_name in context
  if (hookContext.agent_name) {
    return hookContext.agent_name;
  }

  // 2. From Task tool invocation
  if (hookContext.tool_input?.subagent_type) {
    return hookContext.tool_input.subagent_type;
  }

  // 3. From PDCA status (last active agent)
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus?.session?.lastAgent) {
    return pdcaStatus.session.lastAgent;
  }

  return null;
}

// ============================================================
// Handler Execution
// ============================================================

/**
 * Execute handler if exists
 * @param {string} handlerPath - Relative path to handler
 * @param {Object} context - Hook context to pass
 * @returns {boolean} True if handler executed
 */
function executeHandler(handlerPath, context) {
  if (!handlerPath) return false;

  try {
    const fullPath = path.join(__dirname, handlerPath);
    const handler = require(fullPath);

    // Check if handler exports a run function
    if (typeof handler.run === 'function') {
      handler.run(context);
      return true;
    }

    // Handler is self-executing (reads stdin itself)
    // In this case, we've already required it which triggers execution
    return true;
  } catch (e) {
    debugLog('UnifiedStop', 'Handler execution failed', {
      handler: handlerPath,
      error: e.message
    });
    return false;
  }
}

// ============================================================
// Main Execution
// ============================================================

debugLog('UnifiedStop', 'Hook started');

// Read hook context
const hookContext = readStdinSync();
const inputText = typeof hookContext === 'string'
  ? hookContext
  : JSON.stringify(hookContext);

debugLog('UnifiedStop', 'Context received', {
  inputLength: inputText.length,
  hasSkillName: !!hookContext.skill_name,
  hasAgentName: !!hookContext.agent_name
});

// Detect active skill/agent
const activeSkill = detectActiveSkill(hookContext);
const activeAgent = detectActiveAgent(hookContext);

debugLog('UnifiedStop', 'Detection result', {
  activeSkill,
  activeAgent
});

// Execute appropriate handler
let handled = false;

if (activeAgent && AGENT_HANDLERS[activeAgent]) {
  debugLog('UnifiedStop', 'Executing agent handler', { agent: activeAgent });
  handled = executeHandler(AGENT_HANDLERS[activeAgent], hookContext);
}

if (!handled && activeSkill && SKILL_HANDLERS[activeSkill]) {
  debugLog('UnifiedStop', 'Executing skill handler', { skill: activeSkill });

  // Special case: development-pipeline uses echo
  if (activeSkill === 'development-pipeline') {
    console.log(JSON.stringify({ continue: false }));
    handled = true;
  } else {
    handled = executeHandler(SKILL_HANDLERS[activeSkill], hookContext);
  }
}

// Default output if no handler matched
if (!handled) {
  debugLog('UnifiedStop', 'No handler matched, using default output');
  outputAllow('Stop event processed.', 'Stop');
}

debugLog('UnifiedStop', 'Hook completed', {
  handled,
  activeSkill,
  activeAgent
});
```

### 3.2 unified-bash-pre.js

**Purpose**: Bash PreToolUse 통합 핸들러 - phase-9, zero-script-qa, qa-monitor 조건부 실행

**Location**: `scripts/unified-bash-pre.js`

**Code Structure**:
```javascript
#!/usr/bin/env node
/**
 * unified-bash-pre.js - Unified Bash PreToolUse Handler (v1.4.4)
 *
 * Consolidates Bash PreToolUse hooks from:
 * - phase-9-deployment: phase9-deploy-pre.js
 * - zero-script-qa: qa-pre-bash.js
 * - qa-monitor: qa-pre-bash.js (same as zero-script-qa)
 */

const {
  readStdinSync,
  parseHookInput,
  outputAllow,
  outputBlock,
  debugLog,
  getPdcaStatusFull
} = require('../lib/common.js');

// Skill/Agent detection
function getCurrentContext() {
  const pdcaStatus = getPdcaStatusFull();
  return {
    activeSkill: pdcaStatus?.session?.lastSkill || null,
    activeAgent: pdcaStatus?.session?.lastAgent || null
  };
}

// Handler: phase9-deploy-pre
function handlePhase9DeployPre(input) {
  const { command } = parseHookInput(input);

  // Phase 9 specific validations (e.g., deployment safety checks)
  const dangerousPatterns = [
    'kubectl delete',
    'terraform destroy',
    'aws ec2 terminate'
  ];

  for (const pattern of dangerousPatterns) {
    if (command.includes(pattern)) {
      outputBlock(`Deployment safety: '${pattern}' requires manual confirmation.`);
      return true;
    }
  }

  return false;
}

// Handler: qa-pre-bash (shared by zero-script-qa and qa-monitor)
function handleQaPreBash(input) {
  const { command } = parseHookInput(input);

  const DESTRUCTIVE_PATTERNS = [
    'rm -rf', 'rm -r', 'DROP TABLE', 'DROP DATABASE',
    'DELETE FROM', 'TRUNCATE', '> /dev/', 'mkfs', 'dd if='
  ];

  for (const pattern of DESTRUCTIVE_PATTERNS) {
    if (command.includes(pattern)) {
      outputBlock(`Destructive command detected: '${pattern}'. QA testing should not include destructive operations.`);
      return true;
    }
  }

  return false;
}

// Main
debugLog('UnifiedBashPre', 'Hook started');

const input = readStdinSync();
const { activeSkill, activeAgent } = getCurrentContext();

debugLog('UnifiedBashPre', 'Context', { activeSkill, activeAgent });

let blocked = false;

// Phase 9 deployment checks
if (activeSkill === 'phase-9-deployment') {
  blocked = handlePhase9DeployPre(input);
}

// QA checks (zero-script-qa skill or qa-monitor agent)
if (!blocked && (activeSkill === 'zero-script-qa' || activeAgent === 'qa-monitor')) {
  blocked = handleQaPreBash(input);
}

// Allow if not blocked
if (!blocked) {
  const contextMsg = activeSkill || activeAgent
    ? `Bash command validated for ${activeSkill || activeAgent}.`
    : 'Bash command validated.';
  outputAllow(contextMsg, 'PreToolUse');
}

debugLog('UnifiedBashPre', 'Hook completed', { blocked });
```

### 3.3 unified-write-post.js

**Purpose**: Write PostToolUse 통합 핸들러 - pdca, phase-5, phase-6, qa-monitor 조건부 실행

**Location**: `scripts/unified-write-post.js`

**Code Structure**:
```javascript
#!/usr/bin/env node
/**
 * unified-write-post.js - Unified Write PostToolUse Handler (v1.4.4)
 *
 * Consolidates Write PostToolUse hooks from:
 * - bkit-rules: pdca-post-write.js (always runs)
 * - phase-5-design-system: phase5-design-post.js
 * - phase-6-ui-integration: phase6-ui-post.js
 * - qa-monitor: qa-monitor-post.js
 */

const {
  readStdinSync,
  parseHookInput,
  debugLog,
  getPdcaStatusFull,
  outputAllow
} = require('../lib/common.js');

// Context detection
function getCurrentContext() {
  const pdcaStatus = getPdcaStatusFull();
  return {
    activeSkill: pdcaStatus?.session?.lastSkill || null,
    activeAgent: pdcaStatus?.session?.lastAgent || null
  };
}

// Handler: pdca-post-write (always runs)
function handlePdcaPostWrite(input) {
  // This is the default handler from bkit-rules
  // Already implemented in pdca-post-write.js
  try {
    require('./pdca-post-write.js');
    return true;
  } catch (e) {
    debugLog('UnifiedWritePost', 'pdca-post-write failed', { error: e.message });
    return false;
  }
}

// Handler: phase5-design-post
function handlePhase5DesignPost(input, filePath) {
  // Component file tracking for design system
  if (filePath.includes('components/')) {
    debugLog('UnifiedWritePost', 'Design system component written', { filePath });
    // Additional phase-5 specific logic
  }
  return true;
}

// Handler: phase6-ui-post
function handlePhase6UiPost(input, filePath) {
  // UI integration tracking
  if (filePath.includes('pages/') || filePath.includes('app/')) {
    debugLog('UnifiedWritePost', 'UI page written', { filePath });
    // Additional phase-6 specific logic
  }
  return true;
}

// Handler: qa-monitor-post
function handleQaMonitorPost(input, filePath) {
  // QA log analysis after write
  debugLog('UnifiedWritePost', 'QA monitor: file written', { filePath });
  return true;
}

// Main
debugLog('UnifiedWritePost', 'Hook started');

const input = readStdinSync();
const { filePath } = parseHookInput(input);
const { activeSkill, activeAgent } = getCurrentContext();

debugLog('UnifiedWritePost', 'Context', { activeSkill, activeAgent, filePath });

// Always run PDCA post-write (core bkit-rules functionality)
handlePdcaPostWrite(input);

// Conditional handlers based on active skill/agent
if (activeSkill === 'phase-5-design-system') {
  handlePhase5DesignPost(input, filePath);
}

if (activeSkill === 'phase-6-ui-integration') {
  handlePhase6UiPost(input, filePath);
}

if (activeAgent === 'qa-monitor') {
  handleQaMonitorPost(input, filePath);
}

debugLog('UnifiedWritePost', 'Hook completed');
```

### 3.4 unified-bash-post.js

**Purpose**: Bash PostToolUse 통합 핸들러 - qa-monitor 조건부 실행

**Location**: `scripts/unified-bash-post.js`

**Code Structure**:
```javascript
#!/usr/bin/env node
/**
 * unified-bash-post.js - Unified Bash PostToolUse Handler (v1.4.4)
 *
 * Consolidates Bash PostToolUse hooks from:
 * - qa-monitor: qa-monitor-post.js
 */

const {
  readStdinSync,
  parseHookInput,
  debugLog,
  getPdcaStatusFull,
  outputAllow
} = require('../lib/common.js');

// Context detection
function getCurrentContext() {
  const pdcaStatus = getPdcaStatusFull();
  return {
    activeSkill: pdcaStatus?.session?.lastSkill || null,
    activeAgent: pdcaStatus?.session?.lastAgent || null
  };
}

// Handler: qa-monitor-post (Bash)
function handleQaMonitorBashPost(input) {
  const { command } = parseHookInput(input);

  // Log docker/curl commands for QA analysis
  if (command.includes('docker') || command.includes('curl')) {
    debugLog('UnifiedBashPost', 'QA relevant command executed', {
      command: command.substring(0, 100)
    });
  }

  return true;
}

// Main
debugLog('UnifiedBashPost', 'Hook started');

const input = readStdinSync();
const { activeSkill, activeAgent } = getCurrentContext();

debugLog('UnifiedBashPost', 'Context', { activeSkill, activeAgent });

// Only qa-monitor has Bash PostToolUse handler
if (activeAgent === 'qa-monitor') {
  handleQaMonitorBashPost(input);
}

outputAllow('', 'PostToolUse');

debugLog('UnifiedBashPost', 'Hook completed');
```

---

## 4. lib/common.js Enhancements

### 4.1 Session Context for Skill/Agent Tracking

Add to `lib/common.js`:

```javascript
// ============================================================
// v1.4.4: Active Skill/Agent Tracking for Unified Hooks
// ============================================================

/**
 * Set the currently active skill in session context
 * Called when a skill is invoked
 * @param {string} skillName - Name of the skill
 */
function setActiveSkill(skillName) {
  const status = getPdcaStatusFull() || createInitialStatusV2();
  if (!status.session) status.session = {};
  status.session.lastSkill = skillName;
  status.session.lastSkillTime = new Date().toISOString();
  savePdcaStatus(status);
  debugLog('Session', 'Active skill set', { skillName });
}

/**
 * Set the currently active agent in session context
 * Called when an agent is invoked
 * @param {string} agentName - Name of the agent
 */
function setActiveAgent(agentName) {
  const status = getPdcaStatusFull() || createInitialStatusV2();
  if (!status.session) status.session = {};
  status.session.lastAgent = agentName;
  status.session.lastAgentTime = new Date().toISOString();
  savePdcaStatus(status);
  debugLog('Session', 'Active agent set', { agentName });
}

/**
 * Clear active skill/agent from session
 * Called after Stop event completes
 */
function clearActiveContext() {
  const status = getPdcaStatusFull();
  if (!status || !status.session) return;

  delete status.session.lastSkill;
  delete status.session.lastSkillTime;
  delete status.session.lastAgent;
  delete status.session.lastAgentTime;

  savePdcaStatus(status);
  debugLog('Session', 'Active context cleared');
}

/**
 * Get current active skill name
 * @returns {string|null}
 */
function getActiveSkill() {
  const status = getPdcaStatusFull();
  return status?.session?.lastSkill || null;
}

/**
 * Get current active agent name
 * @returns {string|null}
 */
function getActiveAgent() {
  const status = getPdcaStatusFull();
  return status?.session?.lastAgent || null;
}

// Add to exports
module.exports = {
  // ... existing exports ...
  setActiveSkill,
  setActiveAgent,
  clearActiveContext,
  getActiveSkill,
  getActiveAgent
};
```

---

## 5. SKILL.md and agents/*.md Updates

### 5.1 Skills to Update (Remove hooks frontmatter)

| Skill | Current hooks | Action |
|-------|---------------|--------|
| pdca | Stop | Remove hooks section |
| code-review | Stop | Remove hooks section |
| phase-8-review | Stop | Remove hooks section |
| claude-code-learning | Stop | Remove hooks section |
| phase-9-deployment | PreToolUse, Stop | Remove hooks section |
| phase-6-ui-integration | PostToolUse, Stop | Remove hooks section |
| phase-5-design-system | PostToolUse, Stop | Remove hooks section |
| phase-4-api | Stop | Remove hooks section |
| bkit-rules | PreToolUse, PostToolUse | Remove hooks section (already in hooks.json) |
| zero-script-qa | PreToolUse, Stop | Remove hooks section |
| development-pipeline | Stop | Remove hooks section |

### 5.2 Agents to Update (Remove hooks frontmatter)

| Agent | Current hooks | Action |
|-------|---------------|--------|
| gap-detector | Stop | Remove hooks section |
| pdca-iterator | Stop | Remove hooks section |
| code-analyzer | PreToolUse, Stop | Remove hooks section |
| design-validator | PreToolUse | Remove hooks section |
| qa-monitor | PreToolUse, PostToolUse, Stop | Remove hooks section |

### 5.3 Sample SKILL.md Update

**Before**:
```yaml
---
name: pdca
hooks:
  Stop:
    - matcher: ".*"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js"
          timeout: 10000
---
```

**After**:
```yaml
---
name: pdca
# hooks: Managed by hooks/hooks.json (unified-stop.js)
---
```

---

## 6. Existing Script Modifications

### 6.1 Scripts Requiring Export Function

기존 스크립트들이 `require()`로 호출될 수 있도록 run() 함수 내보내기 필요:

| Script | Current Pattern | Change Required |
|--------|-----------------|-----------------|
| pdca-skill-stop.js | Self-executing | Add `module.exports.run` wrapper |
| gap-detector-stop.js | Self-executing | Add `module.exports.run` wrapper |
| iterator-stop.js | Self-executing | Add `module.exports.run` wrapper |
| code-review-stop.js | Self-executing | Add `module.exports.run` wrapper |
| qa-stop.js | Self-executing | Add `module.exports.run` wrapper |
| phase9-deploy-pre.js | Self-executing | Add `module.exports.run` wrapper |
| qa-pre-bash.js | Self-executing | Add `module.exports.run` wrapper |

### 6.2 Script Wrapper Pattern

```javascript
// At the bottom of each existing script, add:

// Export for unified handler usage
module.exports = {
  /**
   * Run handler with provided context
   * @param {Object} context - Hook context (optional, uses stdin if not provided)
   */
  run: function(context) {
    // If context provided, use it; otherwise the script already read from stdin
    if (context && Object.keys(context).length > 0) {
      // Re-process with provided context
      // ... (handler-specific logic)
    }
  }
};

// For backwards compatibility, the script still self-executes when run directly
if (require.main === module) {
  // Current self-executing logic remains unchanged
}
```

---

## 7. Implementation Order

### Phase 1: Core Infrastructure (Priority: High)

1. **lib/common.js 업데이트**
   - `setActiveSkill()`, `setActiveAgent()` 추가
   - `getActiveSkill()`, `getActiveAgent()` 추가
   - `clearActiveContext()` 추가

2. **unified-stop.js 생성**
   - Handler registry 구현
   - Context detection 구현
   - 기존 stop 스크립트 호출 로직

3. **hooks.json 업데이트**
   - Stop 이벤트에 unified-stop.js 등록

### Phase 2: PreToolUse/PostToolUse Integration (Priority: Medium)

4. **unified-bash-pre.js 생성**
   - phase-9, zero-script-qa, qa-monitor 통합

5. **unified-write-post.js 생성**
   - pdca, phase-5, phase-6, qa-monitor 통합

6. **unified-bash-post.js 생성**
   - qa-monitor 통합

7. **hooks.json 업데이트**
   - Bash PreToolUse, Write/Bash PostToolUse 등록

### Phase 3: Cleanup (Priority: Low)

8. **기존 스크립트 수정**
   - `module.exports.run` 래퍼 추가 (기존 동작 유지)

9. **SKILL.md 정리**
   - hooks frontmatter 제거 (주석으로 설명 추가)

10. **agents/*.md 정리**
    - hooks frontmatter 제거 (주석으로 설명 추가)

---

## 8. Testing Strategy

### 8.1 Unit Tests

| Test Case | Expected Result |
|-----------|-----------------|
| unified-stop.js with gap-detector context | gap-detector-stop.js executed |
| unified-stop.js with pdca skill context | pdca-skill-stop.js executed |
| unified-stop.js with no context | Default output |
| unified-bash-pre.js with qa-monitor | qa-pre-bash logic executed |
| unified-write-post.js always runs pdca | pdca-post-write.js executed |

### 8.2 Integration Tests

| Test Case | Steps | Expected |
|-----------|-------|----------|
| Full PDCA cycle | plan → design → do → analyze → iterate → report | All hooks trigger correctly |
| QA workflow | Start zero-script-qa → Execute commands → Stop | Bash pre/post, Stop all work |
| Phase transition | phase-5 → phase-6 → phase-9 | Correct handlers for each |

### 8.3 Verification Commands

```bash
# Enable debug logging
export BKIT_DEBUG=true

# Run test skill
claude "/pdca status"

# Check debug log
cat /tmp/bkit-hook-debug.log | grep -E "(UnifiedStop|UnifiedBashPre|UnifiedWritePost)"
```

---

## 9. Rollback Plan

### 9.1 Immediate Rollback

1. Restore `hooks/hooks.json` from git
2. Re-add hooks frontmatter to SKILL.md/agents/*.md files

### 9.2 Partial Rollback

Keep unified-stop.js but disable specific handlers:

```javascript
const SKILL_HANDLERS = {
  // Temporarily disable problematic handler
  // 'pdca': './pdca-skill-stop.js',
  'pdca': null,  // Disabled
  // ...
};
```

---

## 10. Files to Create/Modify

### 10.1 New Files

| File | Size (est.) | Description |
|------|-------------|-------------|
| `scripts/unified-stop.js` | ~200 lines | Stop event hub |
| `scripts/unified-bash-pre.js` | ~80 lines | Bash PreToolUse hub |
| `scripts/unified-write-post.js` | ~100 lines | Write PostToolUse hub |
| `scripts/unified-bash-post.js` | ~50 lines | Bash PostToolUse hub |

### 10.2 Modified Files

| File | Changes |
|------|---------|
| `hooks/hooks.json` | Add Stop, update PreToolUse/PostToolUse |
| `lib/common.js` | Add skill/agent tracking functions |
| `scripts/*.js` (10 files) | Add `module.exports.run` wrapper |
| `skills/*/SKILL.md` (11 files) | Remove hooks frontmatter |
| `agents/*.md` (5 files) | Remove hooks frontmatter |

---

## 11. Gemini CLI Compatibility

### 11.1 gemini-extension.json Updates

`gemini-extension.json`도 동일한 통합 구조로 업데이트:

```json
{
  "hooks": {
    "SessionStart": { ... },
    "BeforeTool": [
      {
        "matcher": "write_file|replace",
        "command": "node ${extensionPath}/scripts/pre-write.js"
      },
      {
        "matcher": "run_shell_command",
        "command": "node ${extensionPath}/scripts/unified-bash-pre.js"
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_file",
        "command": "node ${extensionPath}/scripts/unified-write-post.js"
      },
      {
        "matcher": "run_shell_command",
        "command": "node ${extensionPath}/scripts/unified-bash-post.js"
      }
    ],
    "AgentStop": [
      {
        "matcher": ".*",
        "command": "node ${extensionPath}/scripts/unified-stop.js"
      }
    ]
  }
}
```

---

## 12. Success Criteria

### 12.1 Functional

- [ ] 모든 기존 Stop hooks 정상 작동
- [ ] 모든 기존 PreToolUse hooks 정상 작동
- [ ] 모든 기존 PostToolUse hooks 정상 작동
- [ ] PDCA 전체 사이클 정상 작동
- [ ] Gemini CLI 호환성 유지

### 12.2 Quality

- [ ] 중복 hook 실행 없음
- [ ] 오류 시 graceful degradation
- [ ] Debug 로그로 실행 추적 가능
- [ ] 기존 테스트 모두 통과

### 12.3 Performance

- [ ] Hook 실행 시간 < 5초
- [ ] 메모리 증가 최소화

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-27 | Initial design | Claude |
