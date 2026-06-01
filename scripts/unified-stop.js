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

// v2.0.0 Lazy Module Loaders — S3a ENH-346: extracted to scripts/lib/unified-stop-deps.js
const {
  getStateMachine, getCheckpointManager, getAuditLogger, getGateManager, getMetricsCollector,
  getWorkflowEngine, getCircuitBreaker, getTrustEngine, getExplanationGenerator, getDecisionTracer,
} = require('./lib/unified-stop-deps');

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
  'sprint': './sprint-skill-stop.js',  // v2.1.21 (Issue #113): Sprint Exec Summary + AskUserQuestion + sessionTitle
  'plan-plus': './plan-plus-stop.js',  // v1.5.9: Executive Summary + AskUserQuestion
  'code-review': './code-review-stop.js',
  'phase-8-review': './phase8-review-stop.js',
  'claude-code-learning': './learning-stop.js',
  'phase-9-deployment': './phase9-deploy-stop.js',
  'phase-6-ui-integration': './phase6-ui-stop.js',
  'phase-5-design-system': './phase5-design-stop.js',
  'phase-4-api': './phase4-api-stop.js',
  'zero-script-qa': './qa-stop.js',
  'qa-phase': './qa-phase-stop.js',  // v2.1.1: QA Phase stop handler
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
  'qa-lead': './qa-phase-stop.js',     // v2.1.1: QA Lead agent stop handler
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

  // 3.5 v2.1.21 (Issue #113): cross-process active-skill marker.
  // skill-post (#3 path) is in-memory only + dropped by CC #57317, and CC omits
  // skill_name (#1) / tool_input (#2) from the Stop payload — so none of the
  // above resolve a /sprint skill in production. The sprint handler writes a
  // file marker that survives across processes; peek it here (no consume — the
  // dispatched handler consumes it after emitting, so re-fire is prevented).
  try {
    const { readActiveSkill } = require('../lib/core/active-skill-marker');
    const marker = readActiveSkill();
    if (marker && marker.skill) {
      return marker.skill;
    }
  } catch (_e) { /* non-critical */ }

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
      // v2.1.1 TC-02: Track checkpoint creation in session stats
      try {
        const { incrementStat } = require('../lib/control/automation-controller');
        incrementStat('checkpointsCreated');
      } catch (_) {}
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
        // Gate verdict drives check→qa or check→act
        if (gateVerdict === 'pass') {
          event = 'MATCH_PASS';  // Now goes to 'qa' instead of 'report'
        } else if (gateVerdict === 'retry') {
          event = 'ITERATE';
        }
        // 'fail' = blocked, no transition
      } else if (phase === 'qa' && gateVerdict) {
        // v2.1.1: QA phase gate evaluation
        if (gateVerdict === 'pass') {
          event = 'QA_PASS';
        } else if (gateVerdict === 'retry' || gateVerdict === 'fail') {
          event = 'QA_FAIL';
        }
      } else if (phase === 'qa' && !gateVerdict) {
        // No gate metrics available — check if QA was skipped
        const pdcaStatus = getPdcaStatusFull();
        const featureData = pdcaStatus?.features?.[feature];
        if (featureData?.chromeAvailable === false && featureData?.qaPassRate == null) {
          event = 'QA_SKIP';
        }
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
      // v2.1.1 TC-01: Sync trust score to control-state.json
      te.syncToControlState();
      debugLog('UnifiedStop', 'v2.1.1 trust synced to control-state', { feature, currentPhase, nextPhase });
    }
  } catch (_) { /* non-critical */ }
}

// v2.1.1 TC-02: Increment session stats on phase completion
if (feature && transitionSuccess) {
  try {
    const { incrementStat } = require('../lib/control/automation-controller');
    incrementStat('phaseComplete');
    debugLog('UnifiedStop', 'v2.1.1 session stat incremented', { stat: 'phaseComplete' });
  } catch (_) { /* non-critical */ }
}

// v2.1.1 QM-02: Append quality history on every phase transition
if (feature && currentPhase && transitionSuccess) {
  try {
    const metrics = getMetricsCollector();
    if (metrics) {
      const snapshot = metrics.readCurrentMetrics(feature);
      if (snapshot && snapshot.metrics) {
        const values = {};
        for (const [mid, entry] of Object.entries(snapshot.metrics)) {
          if (entry && entry.value != null) values[mid] = entry.value;
        }
        metrics.appendHistory({
          feature,
          phase: currentPhase,
          cycle: pdcaStatus?.session?.iteration || 0,
          timestamp: new Date().toISOString(),
          values,
        });
        debugLog('UnifiedStop', 'v2.1.1 quality history appended', { feature, phase: currentPhase });
      }
    }
  } catch (_) { /* non-critical */ }
}

// v2.1.1 QM-01: Regression detection during check phase
if (feature && currentPhase && currentPhase.toLowerCase() === 'check') {
  try {
    const regression = require('../lib/quality/regression-guard');
    const metrics = getMetricsCollector();
    if (metrics) {
      const snapshot = metrics.readCurrentMetrics(feature);
      if (snapshot && snapshot.metrics) {
        const metricValues = {};
        for (const [mid, entry] of Object.entries(snapshot.metrics)) {
          if (entry && entry.value != null) metricValues[mid] = entry.value;
        }
        const result = regression.detectRegressions(metricValues, feature);
        if (result.detected) {
          const audit = getAuditLogger();
          if (audit) {
            audit.writeAuditLog({
              actor: 'system', actorId: 'unified-stop',
              action: 'regression_detected', category: 'quality',
              target: feature, targetType: 'feature',
              details: { count: result.regressions.length, rules: result.regressions.map(r => r.ruleId) },
              result: 'warning', destructiveOperation: false,
            });
          }
          debugLog('UnifiedStop', 'v2.1.1 regression detected', { feature, count: result.regressions.length });
        }
      }

      // v2.1.1 QM-02: Trend analysis in check phase
      const trendResult = metrics.analyzeTrend(feature);
      if (trendResult.alarms.length > 0) {
        const audit = getAuditLogger();
        if (audit) {
          audit.writeAuditLog({
            actor: 'system', actorId: 'unified-stop',
            action: 'trend_alarm', category: 'quality',
            target: feature, targetType: 'feature',
            details: { alarms: trendResult.alarms.map(a => a.type), trend: trendResult.trend },
            result: 'warning', destructiveOperation: false,
          });
        }
        debugLog('UnifiedStop', 'v2.1.1 trend alarms', { feature, count: trendResult.alarms.length });
      }
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

  // v2.1.10 Sprint 7c (G-J-05): Next Action suggestion on default path
  let nextActionHint = '';
  try {
    const { generateGeneric } = require('../lib/orchestrator/next-action-engine');
    const { getPdcaStatusFull: psf } = require('../lib/pdca/status');
    const pdcaStatus = (typeof psf === 'function') ? psf() : null;
    const hint = generateGeneric({ activeSkill, activeAgent, pdcaStatus });
    if (hint) nextActionHint = '\n' + hint;
  } catch (_e) { /* fail-silent */ }

  outputAllow(`Stop event processed.${trustInfo}${auditInfo}${copyTip}${nextActionHint}`, 'Stop');
}

// v2.1.12 Sprint A-1 (defect #17 fix): Record turn marker for ENH-264 per-turn
// tracking. CC v2.1.x Stop hook does NOT inject CLAUDE_* env vars — all data is
// in the stdin JSON payload (parsed into `hookContext` at line 244). Reading
// from env vars produced 472/472 zero entries (CARRY-5 P0). Switched to
// hookContext payload extraction per CC hook payload schema:
//   { session_id, message: { model, usage: { input_tokens, output_tokens,
//     cache_read_input_tokens, cache_creation_input_tokens } } }
// Best-effort — never blocks Stop flow.
try {
  const ccRegression = require('../lib/cc-regression');
  const usage = (hookContext && hookContext.message && hookContext.message.usage) || {};
  const ccVersionResolved = ccRegression.detectCCVersion() || process.env.CLAUDE_CODE_VERSION || 'unknown';
  ccRegression.recordTurn({
    // From stdin payload — fallback to env for parity with future CC versions
    sessionId: hookContext.session_id || process.env.CLAUDE_SESSION_ID || '',
    agent: activeAgent || 'main',
    model: (hookContext.message && hookContext.message.model)
      || process.env.CLAUDE_MODEL
      || 'unknown',
    ccVersion: ccVersionResolved,
    turnIndex: Number.isFinite(hookContext.turn_index)
      ? hookContext.turn_index
      : parseInt(process.env.CLAUDE_TURN_INDEX || '0', 10),
    inputTokens: Number.isFinite(usage.input_tokens) ? usage.input_tokens : 0,
    outputTokens: Number.isFinite(usage.output_tokens) ? usage.output_tokens : 0,
    cacheReadInputTokens: Number.isFinite(usage.cache_read_input_tokens) ? usage.cache_read_input_tokens : 0,
    cacheCreationInputTokens: Number.isFinite(usage.cache_creation_input_tokens) ? usage.cache_creation_input_tokens : 0,
    overheadDelta: parseInt(process.env.CLAUDE_OVERHEAD_DELTA || '0', 10),
    parseStatus: (hookContext && hookContext.message) ? 'ok' : 'no_payload',
    parseWarnings: (hookContext && hookContext.message)
      ? null
      : 'no message field in hookContext (env-fallback)',
  });

  // v2.1.10 Sprint 5.5: cc-regression attribution (NDJSON event log)
  if (ccVersionResolved && ccVersionResolved !== 'unknown') {
    ccRegression.recordEvent({
      hookEvent: 'Stop',
      ccVersion: ccVersionResolved,
      sessionId: hookContext.session_id || process.env.CLAUDE_SESSION_ID || null,
      timestamp: new Date().toISOString(),
      context: { agent: activeAgent || 'main', skill: activeSkill || null },
    });
  }
} catch (e) {
  debugLog('UnifiedStop', 'token-accountant recordTurn failed', { error: e.message });
}

debugLog('UnifiedStop', 'Hook completed', {
  handled,
  activeSkill,
  activeAgent
});
