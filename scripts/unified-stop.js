#!/usr/bin/env node
/**
 * unified-stop.js - Unified Stop Event Handler (v2.0.0)
 *
 * GitHub Issue #9354 Workaround:
 * ${CLAUDE_PLUGIN_ROOT} doesn't expand in markdown files,
 * so all skill/agent stop hooks are consolidated here.
 *
 * v2.0.0: Wired workflow-engine, circuit-breaker, trust-engine,
 * explanation-generator for full PDCA lifecycle integration.
 */

const path = require('path');
const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');
const { getActiveSkill, getActiveAgent, clearActiveContext } = require('../lib/task/context');

// ============================================================
// v2.0.0 Lazy Module Loaders
// ============================================================

let _stateMachine = null;
function getStateMachine() {
  if (!_stateMachine) try { _stateMachine = require('../lib/pdca/state-machine'); } catch (_) {}
  return _stateMachine;
}

let _checkpointManager = null;
function getCheckpointManager() {
  if (!_checkpointManager) try { _checkpointManager = require('../lib/control/checkpoint-manager'); } catch (_) {}
  return _checkpointManager;
}

let _auditLogger = null;
function getAuditLogger() {
  if (!_auditLogger) try { _auditLogger = require('../lib/audit/audit-logger'); } catch (_) {}
  return _auditLogger;
}

let _gateManager = null;
function getGateManager() {
  if (!_gateManager) try { _gateManager = require('../lib/quality/gate-manager'); } catch (_) {}
  return _gateManager;
}

let _metricsCollector = null;
function getMetricsCollector() {
  if (!_metricsCollector) try { _metricsCollector = require('../lib/quality/metrics-collector'); } catch (_) {}
  return _metricsCollector;
}

let _workflowEngine = null;
function getWorkflowEngine() {
  if (!_workflowEngine) try { _workflowEngine = require('../lib/pdca/workflow-engine'); } catch (_) {}
  return _workflowEngine;
}

let _circuitBreaker = null;
function getCircuitBreaker() {
  if (!_circuitBreaker) try { _circuitBreaker = require('../lib/pdca/circuit-breaker'); } catch (_) {}
  return _circuitBreaker;
}

let _trustEngine = null;
function getTrustEngine() {
  if (!_trustEngine) try { _trustEngine = require('../lib/control/trust-engine'); } catch (_) {}
  return _trustEngine;
}

let _explanationGenerator = null;
function getExplanationGenerator() {
  if (!_explanationGenerator) try { _explanationGenerator = require('../lib/audit/explanation-generator'); } catch (_) {}
  return _explanationGenerator;
}

let _decisionTracer = null;
function getDecisionTracer() {
  if (!_decisionTracer) try { _decisionTracer = require('../lib/audit/decision-tracer'); } catch (_) {}
  return _decisionTracer;
}

// ============================================================
// Handler Registry
// ============================================================

/**
 * Skill Stop Handlers
 * Key: skill name (from SKILL.md frontmatter)
 * Value: handler module path (relative to scripts/)
 *
 * @deprecated v1.6.0 - Skill Stop handlers migrated to skill frontmatter hooks (ENH-86).
 * This registry is retained as fallback for backward compatibility.
 */
const SKILL_HANDLERS = {
  'pdca': './pdca-skill-stop.js',
  'pm-discovery': './pdca-skill-stop.js',  // v1.6.0: PM uses same PDCA stop handler
  'plan-plus': './plan-plus-stop.js',  // v1.5.9: Executive Summary + AskUserQuestion
  'code-review': './code-review-stop.js',
  'phase-8-review': './phase8-review-stop.js',
  'claude-code-learning': './learning-stop.js',
  'phase-9-deployment': './phase9-deploy-stop.js',
  'phase-6-ui-integration': './phase6-ui-stop.js',
  'phase-5-design-system': './phase5-design-stop.js',
  'phase-4-api': './phase4-api-stop.js',
  'zero-script-qa': './qa-stop.js',
  'development-pipeline': null  // Special case: echo command
};

/**
 * Agent Stop Handlers
 * Key: agent name (from agent.md frontmatter)
 * Value: handler module path (relative to scripts/)
 *
 * @deprecated v1.6.0 - Agent Stop handlers migrated to agent frontmatter hooks (ENH-86).
 * This registry is retained as fallback for backward compatibility.
 */
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js',
  'team-coordinator': './team-stop.js',  // v1.5.1: Team cleanup on stop
  'cto-lead': './cto-stop.js',           // v1.5.1: CTO session cleanup
  'pm-lead': './pdca-skill-stop.js',    // v1.6.0: PM lead uses PDCA stop handler
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

  // 3. From session context (stored by skill-post.js)
  const sessionSkill = getActiveSkill();
  if (sessionSkill) {
    return sessionSkill;
  }

  // 4. From PDCA status (legacy fallback)
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

  // v1.5.9: ENH-74 use agent_id as detection source
  if (hookContext.agent_id) {
    return hookContext.agent_id;
  }

  // 3. From session context
  const sessionAgent = getActiveAgent();
  if (sessionAgent) {
    return sessionAgent;
  }

  // 4. From PDCA status (legacy fallback)
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
 * @returns {boolean} True if handler executed successfully
 */
function executeHandler(handlerPath, context) {
  if (!handlerPath) return false;

  try {
    const fullPath = path.join(__dirname, handlerPath);
    const handler = require(fullPath);

    // Check if handler exports a run function (v1.4.4 pattern)
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
let hookContext = {};
try {
  const input = readStdinSync();
  hookContext = typeof input === 'string' ? JSON.parse(input) : input;
} catch (e) {
  debugLog('UnifiedStop', 'Failed to parse context', { error: e.message });
}

// v1.5.9: ENH-74 agent_id/agent_type extraction
const agentId = hookContext.agent_id || null;
const agentType = hookContext.agent_type || null;

debugLog('UnifiedStop', 'Context received', {
  hasSkillName: !!hookContext.skill_name,
  hasAgentName: !!hookContext.agent_name,
  hasToolInput: !!hookContext.tool_input,
  agentId,
  agentType
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

// Priority: Agent handlers first (more specific)
if (activeAgent && AGENT_HANDLERS[activeAgent]) {
  debugLog('UnifiedStop', 'Executing agent handler', { agent: activeAgent });
  handled = executeHandler(AGENT_HANDLERS[activeAgent], hookContext);
}

// Then skill handlers
if (!handled && activeSkill && SKILL_HANDLERS[activeSkill]) {
  debugLog('UnifiedStop', 'Executing skill handler', { skill: activeSkill });

  // Special case: development-pipeline uses simple echo
  if (activeSkill === 'development-pipeline') {
    console.log(JSON.stringify({ continue: false }));
    handled = true;
  } else {
    handled = executeHandler(SKILL_HANDLERS[activeSkill], hookContext);
  }
}

// ============================================================
// v2.0.0 Module Integrations
// ============================================================

// Extract PDCA context for v2.0.0 modules
const pdcaStatus = getPdcaStatusFull();
const feature = pdcaStatus?.feature || pdcaStatus?.session?.feature || null;
const currentPhase = pdcaStatus?.currentPhase || pdcaStatus?.session?.currentPhase || null;
const nextPhase = pdcaStatus?.session?.nextPhase || null;
const matchRate = pdcaStatus?.session?.matchRate || null;
const level = pdcaStatus?.projectLevel || null;
const agentName = activeAgent || activeSkill || null;

// v2.0.0: Checkpoint creation before phase transitions
if (feature && currentPhase && nextPhase) {
  try {
    const cp = getCheckpointManager();
    if (cp) {
      cp.createCheckpoint(feature, currentPhase, 'phase_transition', `${currentPhase} → ${nextPhase}`);
      debugLog('UnifiedStop', 'v2.0.0 checkpoint created', { feature, currentPhase, nextPhase });
    }
  } catch (_) {}
}

// v2.0.5: Quality gate check with schema bridge + result persistence + transition control
let gateVerdict = null;
if (feature && currentPhase) {
  try {
    const gates = getGateManager();
    const metrics = getMetricsCollector();
    if (gates && metrics) {
      // Use schema bridge: convert M1-M10 → gate-friendly names
      const gateMetrics = metrics.toGateFormat(feature);
      if (gateMetrics) {
        const phase = currentPhase.toLowerCase();
        const gateResult = gates.checkGate(phase, {
          feature,
          projectLevel: level || 'Dynamic',
          metrics: gateMetrics
        });
        gateVerdict = gateResult.verdict;

        // Persist gate result for audit trail
        gates.recordGateResult(phase, gateResult, feature);

        // Write gate result to pdca-status for visibility
        const { updatePdcaStatus: updateStatus } = require('../lib/pdca/status');
        updateStatus(feature, currentPhase, {
          lastGateResult: {
            verdict: gateResult.verdict,
            score: gateResult.score,
            blockers: gateResult.blockers,
            timestamp: new Date().toISOString()
          }
        });

        debugLog('UnifiedStop', 'v2.0.5 quality gate evaluated', {
          feature, phase, verdict: gateResult.verdict,
          score: gateResult.score, blockers: gateResult.blockers.length
        });
      }
    }
  } catch (e) {
    debugLog('UnifiedStop', 'Quality gate check failed', { error: e.message });
  }
}

// v2.0.5: State machine transition — gate verdict controls the event
let transitionSuccess = false;
if (feature && currentPhase) {
  try {
    const sm = getStateMachine();
    if (sm) {
      const ctx = sm.createContext(feature);

      // Determine FSM event based on gate verdict + phase
      let event = null;
      const phase = currentPhase.toLowerCase();

      if (phase === 'check' && gateVerdict) {
        // Gate verdict drives check→report or check→act
        if (gateVerdict === 'pass') {
          event = 'MATCH_PASS';
        } else if (gateVerdict === 'retry') {
          event = 'ITERATE';
        }
        // 'fail' = blocked, no transition
      } else if (phase === 'pm') {
        event = 'PM_DONE';
      } else if (phase === 'plan') {
        event = 'PLAN_DONE';
      } else if (phase === 'design') {
        event = 'DESIGN_DONE';
      } else if (phase === 'do') {
        event = 'DO_COMPLETE';
      } else if (phase === 'act') {
        event = 'ANALYZE_DONE';
      } else if (phase === 'report') {
        event = 'REPORT_DONE';
      }

      if (event) {
        sm.transition(phase, event, ctx);
        transitionSuccess = true;
        debugLog('UnifiedStop', 'v2.0.5 state machine transition', { feature, phase, event, gateVerdict });
      } else if (gateVerdict === 'fail') {
        debugLog('UnifiedStop', 'v2.0.5 transition BLOCKED by gate', { feature, phase, gateVerdict });
      }
    }
  } catch (e) {
    debugLog('UnifiedStop', 'State machine transition failed', { error: e.message });
  }
}

// v2.0.0: Workflow-engine advancement after state transitions
if (feature && currentPhase && transitionSuccess) {
  try {
    const wfe = getWorkflowEngine();
    if (wfe) {
      const execution = wfe.loadWorkflowState(feature);
      if (execution && execution.status === 'running') {
        // Update workflow context with current match rate
        if (matchRate != null) {
          execution.context.matchRate = matchRate;
        }
        // Load workflow definition to advance
        const workflowDef = wfe.selectWorkflow(feature, level);
        if (workflowDef) {
          const result = wfe.advanceWorkflow(execution, workflowDef);
          debugLog('UnifiedStop', 'v2.0.0 workflow advanced', {
            feature,
            nextPhase: result.nextPhase,
            action: result.action,
            completed: result.completed
          });
        }
      }
    }
  } catch (_) { /* non-critical */ }
}

// v2.0.0: Circuit breaker recording based on transition result
if (feature) {
  try {
    const cb = getCircuitBreaker();
    if (cb) {
      if (transitionSuccess) {
        cb.recordSuccess(feature);
      } else if (currentPhase) {
        // Only record failure if a transition was attempted but failed
        cb.recordFailure(feature, 'State machine transition failed');
      }
      debugLog('UnifiedStop', 'v2.0.0 circuit breaker updated', {
        feature,
        success: transitionSuccess
      });
    }
  } catch (_) { /* non-critical */ }
}

// v2.0.0: Trust engine event recording for completed transitions
if (feature && transitionSuccess) {
  try {
    const te = getTrustEngine();
    if (te) {
      // Record PDCA cycle completion when transitioning to report/completed
      if (nextPhase === 'report' || nextPhase === 'completed' || nextPhase === 'archived') {
        te.recordEvent('pdca_complete', { feature, from: currentPhase, to: nextPhase });
      }
      // Record gate pass/fail based on quality gate results
      if (currentPhase && currentPhase.toLowerCase() === 'check') {
        const gateEventType = matchRate >= 90 ? 'gate_pass' : 'gate_fail';
        te.recordEvent(gateEventType, { feature, matchRate });
      }
      debugLog('UnifiedStop', 'v2.0.0 trust engine event recorded', { feature, currentPhase, nextPhase });
    }
  } catch (_) { /* non-critical */ }
}

// v2.0.0: Audit logging for stop events (with explanation-generator for decision traces)
if (handled || feature) {
  try {
    const audit = getAuditLogger();
    if (audit) {
      audit.writeAuditLog({
        actor: 'system',
        actorId: agentName || 'unified-stop',
        action: feature && nextPhase ? 'phase_transition' : 'stop_event',
        category: 'pdca',
        target: feature || activeSkill || activeAgent || 'unknown',
        targetType: 'feature',
        details: {
          from: currentPhase,
          to: nextPhase,
          matchRate,
          activeSkill,
          activeAgent,
          handled
        },
        result: 'success',
        destructiveOperation: false
      });
      debugLog('UnifiedStop', 'v2.0.0 audit log written', { action: feature && nextPhase ? 'phase_transition' : 'stop_event' });
    }
  } catch (_) {}

  // v2.0.0: Generate human-readable explanation from recent decision traces
  try {
    const eg = getExplanationGenerator();
    const dt = getDecisionTracer();
    if (eg && dt && feature) {
      const recentTraces = dt.readDecisions({ feature, limit: 5 });
      if (recentTraces.length > 0) {
        const latestTrace = recentTraces[recentTraces.length - 1];
        const explanation = eg.generateExplanation(latestTrace, 'brief');
        if (explanation) {
          debugLog('UnifiedStop', 'v2.0.0 decision explanation generated', { explanation });
        }
      }
    }
  } catch (_) { /* non-critical */ }
}

// Clear active context after stop
clearActiveContext();

// Fallback: agent state cleanup if no handler did it (v1.5.3 Team Visibility)
if (!handled) {
  try {
    const teamModule = require('../lib/team');
    const state = teamModule.readAgentState ? teamModule.readAgentState() : null;
    if (state && state.enabled) {
      teamModule.cleanupAgentState();
      debugLog('UnifiedStop', 'Fallback agent state cleanup executed');
    }
  } catch (e) {
    // Silent - not all stops need agent state cleanup
  }
}

// Default output if no handler matched
if (!handled) {
  debugLog('UnifiedStop', 'No handler matched, using default output');

  // v2.0.0: Include trust score in stop output when control skill is active
  let trustInfo = '';
  if (activeSkill === 'control') {
    try {
      const te = getTrustEngine();
      if (te) {
        const profile = te.loadTrustProfile();
        const score = te.calculateScore(profile);
        trustInfo = `\nTrust Score: ${score}/100 (L${profile.currentLevel})`;
      }
    } catch (_) { /* non-critical */ }
  }

  // v2.0.0: Include decision summary in stop output when audit skill is active
  let auditInfo = '';
  if (activeSkill === 'audit' && feature) {
    try {
      const eg = getExplanationGenerator();
      const dt = getDecisionTracer();
      if (eg && dt) {
        const recentTraces = dt.readDecisions({ feature, limit: 10 });
        if (recentTraces.length > 0) {
          auditInfo = '\n' + eg.summarizeDecisionHistory(recentTraces);
        }
      }
    } catch (_) { /* non-critical */ }
  }

  // v1.5.6: Conditionally add /copy tip (when session was a code generation skill)
  const copyTip = activeSkill ? '\nTip: Use /copy to copy code blocks from this session.' : '';
  outputAllow(`Stop event processed.${trustInfo}${auditInfo}${copyTip}`, 'Stop');
}

debugLog('UnifiedStop', 'Hook completed', {
  handled,
  activeSkill,
  activeAgent
});
