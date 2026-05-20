#!/usr/bin/env node
/**
 * sprint-handler.js — Sprint skill action dispatcher (v2.1.13 Sprint 4).
 *
 * Wires the user-facing /sprint slash command into the Sprint 1 (Domain)
 * + Sprint 2 (Application) + Sprint 3 (Infrastructure) layers without
 * requiring those layers to know anything about user-facing concerns.
 *
 * This script is the entry point for skills/sprint/SKILL.md handlers and
 * the sprint-orchestrator agent. It builds a fresh SprintInfra adapter
 * bundle per invocation, then routes the action to the matching Sprint 2
 * use case via Sprint 3 adapter injection.
 *
 * Cross-sprint integration (user-mandated):
 *   USER → skill → sprint-handler → createSprintInfra (S3) → startSprint (S2) → createSprint (S1)
 *
 * Pure JavaScript module — no shell I/O of its own (callers provide
 * argv parsing). Errors are returned as { ok: false, error } instead of
 * thrown, so callers can render them as user-facing messages.
 *
 * @module scripts/sprint-handler
 * @version 2.1.13
 * @since 2.1.13
 */

'use strict';

const {
  createSprintInfra,
  createGapDetector,
  createAutoFixer,
  createDataFlowValidator,
} = require('../lib/infra/sprint');
const lifecycle = require('../lib/application/sprint-lifecycle');
const domain = require('../lib/domain/sprint');

/**
 * The 15 sub-actions supported by the /sprint slash command.
 * @type {ReadonlyArray<string>}
 */
const VALID_ACTIONS = Object.freeze([
  'init', 'start', 'status', 'watch', 'phase',
  'iterate', 'qa', 'report', 'archive', 'list',
  'feature', 'pause', 'resume', 'fork', 'help',
  'master-plan', // S2-UX v2.1.13 — 16th action
  'measure',     // F3 v2.1.16 (Issue #94) — 17th action
]);

/**
 * Valid trust levels (L0-L4) per Master Plan §11.2 SPRINT_AUTORUN_SCOPE.
 * @type {ReadonlyArray<'L0'|'L1'|'L2'|'L3'|'L4'>}
 */
const VALID_TRUST_LEVELS = Object.freeze(['L0', 'L1', 'L2', 'L3', 'L4']);

/** @type {'L3'} */
const DEFAULT_TRUST_LEVEL = 'L3';

/**
 * Normalize trust level from 3 user input forms to a single internal key.
 *
 * Precedence: trustLevel > trust > trustLevelAtStart > default.
 * Case-insensitive (toUpperCase normalization). Invalid values fall back
 * to DEFAULT_TRUST_LEVEL.
 *
 * @param {Object} args
 * @returns {('L0'|'L1'|'L2'|'L3'|'L4')}
 */
function normalizeTrustLevel(args) {
  if (!args) return DEFAULT_TRUST_LEVEL;
  const raw = args.trustLevel || args.trust || args.trustLevelAtStart;
  if (typeof raw !== 'string') return DEFAULT_TRUST_LEVEL;
  const upper = raw.toUpperCase();
  return VALID_TRUST_LEVELS.includes(upper) ? upper : DEFAULT_TRUST_LEVEL;
}

/**
 * Parse `--key value` and `--key=value` flag patterns from an argv slice.
 *
 * Boolean flags: `--key` followed by another `--flag` or end of argv → true.
 *
 * @param {string[]} argv
 * @returns {Object}
 */
function parseFlags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i];
    if (typeof tok !== 'string' || !tok.startsWith('--')) continue;
    const eq = tok.indexOf('=');
    if (eq !== -1) {
      out[tok.slice(2, eq)] = tok.slice(eq + 1);
      continue;
    }
    const key = tok.slice(2);
    const next = argv[i + 1];
    if (next === undefined || (typeof next === 'string' && next.startsWith('--'))) {
      out[key] = true;
    } else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

/**
 * Build a fresh SprintInfra bundle bound to the given (or current) project
 * root. Resolves OTEL + agent attribution from environment unless overridden.
 *
 * @param {{ projectRoot?: string, otelEndpoint?: string, otelServiceName?: string, agentId?: string, parentAgentId?: string }} [opts]
 * @returns {import('../lib/infra/sprint').SprintInfra}
 */
function getInfra(opts) {
  const o = opts || {};
  // v2.1.14 ENH-281+293: prefer OTEL_EXPORTER_OTLP_ENDPOINT (standard) over the
  // legacy OTEL_ENDPOINT, and hydrate from .bkit/runtime/otel-env.json when the
  // hook-subprocess env was stripped at the CC plugin boundary.
  let otelEndpoint = o.otelEndpoint;
  try {
    if (!otelEndpoint) {
      const capturer = require('../lib/infra/otel-env-capturer');
      capturer.hydrateEnv({ overwrite: false });
      otelEndpoint = capturer.resolveOtelEndpoint(process.env);
    }
  } catch (_) {
    otelEndpoint = otelEndpoint || process.env.OTEL_ENDPOINT;
  }
  return createSprintInfra({
    projectRoot: o.projectRoot || process.cwd(),
    otelEndpoint,
    otelServiceName: o.otelServiceName || process.env.OTEL_SERVICE_NAME,
    agentId: o.agentId || process.env.CLAUDE_AGENT_ID,
    parentAgentId: o.parentAgentId || process.env.CLAUDE_PARENT_AGENT_ID,
  });
}

function defaultContext() {
  return { WHY: '', WHO: '', RISK: '', SUCCESS: '', SCOPE: '' };
}

/**
 * Sprint 5 V#3 — Auto-wire 3 production scaffold adapters when agentTaskRunner
 * is injected. This converts no-op baseline behavior to real agent invocations
 * via Claude Code's Task tool (gap-detector / pdca-iterator agents + chrome-qa MCP).
 *
 * Caller pattern (interactive Claude Code session):
 *   handleSprintAction('iterate', { id }, {
 *     agentTaskRunner: async ({ subagent_type, prompt }) => {
 *       const result = await invokeTaskTool({ subagent_type, prompt });
 *       return { output: result.text };
 *     },
 *     mcpClient: { callTool: async (req) => browserBatch(req) },
 *   });
 *
 * Behavior:
 * - If `deps.agentTaskRunner` provided: auto-create gapDetector + autoFixer
 *   from createGapDetector/AutoFixer, inject into deps.iterateDeps.
 * - If `deps.mcpClient` provided: auto-create dataFlowValidator (Tier 3 live probe),
 *   inject into deps.qaDeps.
 * - If `deps.staticMatrix === true` (and no mcpClient): create Tier 2 static
 *   heuristic validator, inject into deps.qaDeps.
 * - Existing deps.iterateDeps / deps.qaDeps explicit injections take precedence
 *   (override auto-wired adapters).
 *
 * @param {object} deps - raw deps from caller
 * @returns {object} deps with auto-wired adapters merged
 */
function wireAgentAdapters(deps) {
  if (!deps || (!deps.agentTaskRunner && !deps.mcpClient && deps.staticMatrix !== true)) {
    return deps; // no auto-wiring needed
  }

  const wired = { ...deps };

  if (deps.agentTaskRunner && (!deps.iterateDeps || (!deps.iterateDeps.gapDetector && !deps.iterateDeps.autoFixer))) {
    const gapDetector = createGapDetector({ agentTaskRunner: deps.agentTaskRunner });
    const autoFixer = createAutoFixer({ agentTaskRunner: deps.agentTaskRunner });
    wired.iterateDeps = Object.assign({ gapDetector, autoFixer }, deps.iterateDeps || {});
  }

  if ((deps.mcpClient || deps.staticMatrix === true) && (!deps.qaDeps || !deps.qaDeps.dataFlowValidator)) {
    const dataFlowValidator = createDataFlowValidator({
      mcpClient: deps.mcpClient,
      staticMatrix: deps.staticMatrix === true,
    });
    wired.qaDeps = Object.assign({ dataFlowValidator }, deps.qaDeps || {});
  }

  return wired;
}

/**
 * Main dispatcher. Routes the requested action to its handler, after
 * acquiring a fresh SprintInfra (unless one is injected via `deps.infra`
 * for testing).
 *
 * @param {string} action - one of VALID_ACTIONS
 * @param {Object} [args]
 * @param {{ infra?: object, lifecycleDeps?: object, iterateDeps?: object, qaDeps?: object, reportDeps?: object }} [deps]
 * @returns {Promise<{ ok: boolean, [k: string]: any }>}
 */
async function handleSprintAction(action, args, deps) {
  if (!VALID_ACTIONS.includes(action)) {
    return { ok: false, error: 'Unknown action: ' + action, validActions: [...VALID_ACTIONS] };
  }
  const a = args || {};
  const d = wireAgentAdapters(deps || {});
  const infra = d.infra || getInfra(a);
  switch (action) {
    case 'init':    return handleInit(a, infra);
    case 'start':   return handleStart(a, infra, d);
    case 'status':  return handleStatus(a, infra);
    case 'list':    return handleList(a, infra);
    case 'phase':   return handlePhase(a, infra, d);
    case 'iterate': return handleIterate(a, infra, d);
    case 'qa':      return handleQA(a, infra, d);
    case 'report':  return handleReport(a, infra, d);
    case 'archive': return handleArchive(a, infra);
    case 'pause':   return handlePause(a, infra);
    case 'resume':  return handleResume(a, infra);
    case 'fork':    return handleFork(a, infra);
    case 'feature': return handleFeature(a, infra);
    case 'watch':   return handleWatch(a, infra);
    case 'help':    return handleHelp();
    case 'master-plan': return handleMasterPlan(a, infra, d);
    case 'measure': return handleMeasure(a, infra, d);
    default:        return { ok: false, error: 'Unreachable action: ' + action };
  }
}

async function handleInit(args, infra) {
  if (!args || !args.id || !args.name) {
    return { ok: false, error: 'init requires { id, name }' };
  }
  const v = domain.validateSprintInput({
    id: args.id, name: args.name,
    phase: args.phase, context: args.context, features: args.features,
  });
  if (!v.ok) return { ok: false, error: 'invalid_input', errors: v.errors };
  const sprint = domain.createSprint({
    id: args.id,
    name: args.name,
    phase: args.phase || 'prd',
    context: { ...defaultContext(), ...(args.context || {}) },
    features: Array.isArray(args.features) ? args.features : [],
    trustLevelAtStart: normalizeTrustLevel(args),
  });
  await infra.stateStore.save(sprint);
  infra.eventEmitter.emit(domain.SprintEvents.SprintCreated({
    sprintId: sprint.id, name: sprint.name, phase: sprint.phase,
  }));
  return { ok: true, sprint, sprintId: sprint.id };
}

async function handleStart(args, infra, deps) {
  if (!args || !args.id) {
    return { ok: false, error: 'start requires { id }' };
  }
  // Deep-QA fix: when started after init, hydrate name/context/features
  // from existing state so users don't have to re-supply them.
  // Idempotent semantics — startSprint UC internally distinguishes resume vs create.
  let resolvedName = args.name;
  let resolvedContext = args.context;
  let resolvedFeatures = args.features;
  const existing = await infra.stateStore.load(args.id);
  if (existing) {
    if (!resolvedName) resolvedName = existing.name;
    if (!resolvedContext) resolvedContext = existing.context;
    if (!Array.isArray(resolvedFeatures)) resolvedFeatures = existing.features;
  }
  if (!resolvedName) {
    return { ok: false, error: 'start requires { id, name } (sprint not yet initialized)' };
  }
  // Only pass context if caller explicitly provided one OR existing has non-empty
  // values; otherwise omit so validateSprintInput skips context check (existing
  // init flow already permits empty default context — see handleInit).
  const passContext = (function () {
    if (args.context && typeof args.context === 'object') return args.context;
    if (existing && existing.context && Object.values(existing.context).some(v => typeof v === 'string' && v.trim().length > 0)) {
      return existing.context;
    }
    return undefined;
  })();
  const lifecycleDeps = Object.assign({
    stateStore: infra.stateStore,
    eventEmitter: infra.eventEmitter.emit,
  }, deps.lifecycleDeps || {});
  return lifecycle.startSprint({
    id: args.id,
    name: resolvedName,
    trustLevel: normalizeTrustLevel(args),
    phase: args.phase,
    context: passContext,
    features: Array.isArray(resolvedFeatures) ? resolvedFeatures : [],
  }, lifecycleDeps);
}

async function handleStatus(args, infra) {
  if (!args || !args.id) return { ok: false, error: 'status requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  return { ok: true, sprint };
}

async function handleList(_args, infra) {
  const fromState = await infra.stateStore.list();
  const fromDocs = await infra.docScanner.findAllSprints();
  const seen = new Set();
  const merged = [];
  for (const e of fromState) {
    merged.push({ source: 'state', id: e.id, name: e.name, phase: e.phase, status: e.status, updatedAt: e.updatedAt });
    seen.add(e.id);
  }
  for (const d of fromDocs) {
    if (seen.has(d.id)) continue;
    merged.push({ source: 'docs', id: d.id, masterPlanPath: d.masterPlanPath });
  }
  return { ok: true, sprints: merged, count: merged.length };
}

async function handlePhase(args, infra, deps) {
  if (!args || !args.id || !args.to) {
    return { ok: false, error: 'phase requires { id, to }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  // v2.1.16 (Issue #95, F2): forward --approve / --reason to advancePhase Step 2.
  // approve is single-use; the handler does NOT persist it into sprint.autoRun.scope.
  // v2.1.16 (Issue #93, F4): inject failureReporter so advancePhase auto-generates
  // a markdown report under docs/03-analysis/ when gate_fail occurs. The reporter
  // owns the FS write via the handler-provided fileWriter (advance-phase stays pure).
  const failureReporter = buildFailureReporterForHandler();
  const advanceDeps = Object.assign({
    eventEmitter: infra.eventEmitter.emit,
    approve: args.approve === true || args.approve === 'true',
    reason: typeof args.reason === 'string' ? args.reason : null,
    failureReporter: failureReporter,
  }, deps.lifecycleDeps || {});
  const result = await lifecycle.advancePhase(sprint, args.to, advanceDeps);
  // v2.1.16 (Issue #95, F2): record scope_boundary_approved when the
  // single-use --approve actually bypassed the Trust Level scope. Direct
  // writeAuditLog call (audit-logger internally mirrors to OTEL since
  // Sprint 4.5 — no double-write risk). Layer split preserved: the
  // application use case stays pure; the handler (Presentation/Sprint 4)
  // owns the cross-cutting audit emission.
  let audit = null;
  try {
    audit = require('../lib/audit/audit-logger');
  } catch (_e) { audit = null; }
  if (audit && result.ok && result.approvalRecord) {
    try {
      audit.writeAuditLog({
        actor: 'user',
        action: 'scope_boundary_approved',
        category: 'sprint',
        target: result.approvalRecord.sprintId,
        targetType: 'feature',
        details: result.approvalRecord,
        result: 'success',
        reason: result.approvalRecord.reason || 'user-approved scope boundary',
      });
    } catch (_e) { /* audit best-effort */ }
  }
  // v2.1.16 (Issue #93, F4): persist lastGateFailure even on gate_fail so the
  // failure state is durable for /sprint status surfacing and audit cross-reference.
  if (result.sprint && (result.ok || result.reason === 'gate_fail')) {
    try { await infra.stateStore.save(result.sprint); } catch (_e) { /* save best-effort on gate_fail */ }
  }
  // v2.1.16 (Issue #93, F4): emit gate_failed audit entry with expanded details
  // schema (reportPath + failedGates summary). Pre-v2.1.16 details shapes from
  // tool-failure-handler / gap-detector-stop remain unchanged — audit details
  // is pass-through sanitized.
  if (audit && !result.ok && result.reason === 'gate_fail') {
    try {
      const failedGates = [];
      const resultsMap = (result.gateResults && result.gateResults.results) || {};
      for (const [gateKey, r] of Object.entries(resultsMap)) {
        if (r && !r.passed) {
          failedGates.push({
            gateKey: gateKey,
            current: r.current,
            threshold: r.threshold,
            reason: r.reason || null,
          });
        }
      }
      audit.writeAuditLog({
        actor: 'system',
        action: 'gate_failed',
        category: 'sprint',
        target: args.id,
        targetType: 'feature',
        details: {
          sprintId: args.id,
          phase: sprint.phase,
          targetPhase: args.to,
          failedGates: failedGates,
          reportPath: result.reportPath || null,
        },
        result: 'failure',
        reason: 'Quality gate(s) failed at ' + sprint.phase + ' exit',
      });
    } catch (_e) { /* audit best-effort */ }
  }
  return result;
}

/**
 * Build the failure-reporter function passed to advancePhase deps. Owns the
 * FS write (mkdirSync + writeFileSync) so the advance-phase use case stays
 * Application-layer pure (Master Plan §1 RISK invariant for Sprint 2).
 *
 * @returns {function|null}
 */
function buildFailureReporterForHandler() {
  try {
    const fr = require('../lib/application/quality-gates/failure-reporter');
    const fsLocal = require('fs');
    const pathLocal = require('path');
    return fr.createFailureReporter({
      projectRoot: process.cwd(),
      fileWriter: function (absPath, content) {
        const dir = pathLocal.dirname(absPath);
        if (!fsLocal.existsSync(dir)) fsLocal.mkdirSync(dir, { recursive: true });
        fsLocal.writeFileSync(absPath, content, 'utf8');
      },
    });
  } catch (_e) { return null; }
}

async function handleIterate(args, infra, deps) {
  if (!args || !args.id) return { ok: false, error: 'iterate requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const result = await lifecycle.iterateSprint(sprint, Object.assign({
    eventEmitter: infra.eventEmitter.emit,
  }, deps.iterateDeps || {}));
  if (result.ok && result.sprint) await infra.stateStore.save(result.sprint);
  return result;
}

async function handleQA(args, infra, deps) {
  if (!args || !args.id || !args.featureName) {
    return { ok: false, error: 'qa requires { id, featureName }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const result = await lifecycle.verifyDataFlow(sprint, args.featureName, deps.qaDeps || {});
  if (result.ok) {
    await infra.matrixSync.syncDataFlow(args.id, args.featureName, result.hopResults);
  }
  return result;
}

async function handleReport(args, infra, deps) {
  if (!args || !args.id) return { ok: false, error: 'report requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  return lifecycle.generateReport(sprint, deps.reportDeps || {});
}

async function handleArchive(args, infra) {
  if (!args || !args.id) return { ok: false, error: 'archive requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const result = await lifecycle.archiveSprint(sprint, {
    eventEmitter: infra.eventEmitter.emit,
  });
  if (result.ok && result.sprint) {
    await infra.stateStore.save(result.sprint);
    // V#4 — best-effort MEMORY.md auto-update (non-blocking, isolated failure)
    try {
      const writer = require('./sprint-memory-writer');
      const projectRoot = (args && args.projectRoot) || process.cwd();
      const memResult = await writer.appendSprintToMemory(result.sprint, { projectRoot: projectRoot });
      result.memoryUpdated = memResult.ok && memResult.appended;
      if (memResult.ok && !memResult.appended) {
        result.memoryReason = memResult.reason; // already_logged
      } else if (!memResult.ok) {
        result.memoryReason = memResult.reason; // non-fatal
      }
    } catch (e) {
      result.memoryUpdated = false;
      result.memoryReason = 'writer_error: ' + (e && e.message ? e.message : String(e));
    }
  }
  return result;
}

async function handlePause(args, infra) {
  if (!args || !args.id) return { ok: false, error: 'pause requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const triggers = [{
    triggerId: args.triggerId || 'USER_REQUEST',
    severity: args.severity || 'MEDIUM',
    message: args.message || 'User-requested pause',
    userActions: [],
  }];
  const result = lifecycle.pauseSprint(sprint, triggers, {
    eventEmitter: infra.eventEmitter.emit,
  });
  if (result.ok && result.sprint) await infra.stateStore.save(result.sprint);
  return result;
}

async function handleResume(args, infra) {
  if (!args || !args.id) return { ok: false, error: 'resume requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const result = lifecycle.resumeSprint(sprint, {
    eventEmitter: infra.eventEmitter.emit,
  });
  if (result.ok && result.sprint) await infra.stateStore.save(result.sprint);
  return result;
}

// Sprint 5 real impl — fork: clone source sprint, carry over incomplete features
async function handleFork(args, infra) {
  if (!args || !args.id || !args.newId) {
    return { ok: false, error: 'fork requires { id, newId }' };
  }
  const source = await infra.stateStore.load(args.id);
  if (!source) return { ok: false, error: 'Sprint not found: ' + args.id };
  const carryItems = identifyCarryItems(source);
  const domain = require(require('path').join(__dirname, '..', 'lib/domain/sprint'));
  const trustLevel = source.autoRun && source.autoRun.trustLevelAtStart ? source.autoRun.trustLevelAtStart : 'L0';
  const newSprint = domain.createSprint({
    id: args.newId,
    name: (source.name || args.id) + ' (fork)',
    features: carryItems.map(function (c) { return c.featureName; }),
    context: source.context || {},
    trustLevelAtStart: trustLevel,
  });
  await infra.stateStore.save(newSprint);
  return { ok: true, sourceId: args.id, newSprint: newSprint, carryItems: carryItems };
}

function identifyCarryItems(sprint) {
  const items = [];
  const fm = sprint && sprint.featureMap;
  if (!fm) return items;
  const keys = Object.keys(fm);
  for (let i = 0; i < keys.length; i++) {
    const featureName = keys[i];
    const fp = fm[featureName];
    const phase = fp && fp.phase;
    if (phase === 'do' || phase === 'iterate') {
      items.push({ featureName: featureName, phase: phase, reason: 'phase_' + phase + '_not_complete' });
    }
  }
  return items;
}

// Sprint 5 real impl — feature: list/add/remove feature within a sprint
async function handleFeature(args, infra) {
  if (!args || !args.id || !args.action) {
    return { ok: false, error: 'feature requires { id, action: list|add|remove [, featureName] }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const domain = require(require('path').join(__dirname, '..', 'lib/domain/sprint'));

  switch (args.action) {
    case 'list':
      return {
        ok: true,
        features: sprint.features || [],
        featureMapKeys: Object.keys(sprint.featureMap || {}),
      };
    case 'add': {
      if (!args.featureName) return { ok: false, error: 'add requires featureName' };
      const features = (sprint.features || []).slice();
      if (features.indexOf(args.featureName) === -1) features.push(args.featureName);
      const updated = domain.cloneSprint(sprint, { features: features });
      await infra.stateStore.save(updated);
      return { ok: true, sprint: updated };
    }
    case 'remove': {
      if (!args.featureName) return { ok: false, error: 'remove requires featureName' };
      const features = (sprint.features || []).filter(function (f) { return f !== args.featureName; });
      const updated = domain.cloneSprint(sprint, { features: features });
      await infra.stateStore.save(updated);
      return { ok: true, sprint: updated };
    }
    default:
      return { ok: false, error: 'feature action must be list|add|remove, got: ' + args.action };
  }
}

// Sprint 5 enhanced — watch: live snapshot with auto-pause triggers + matrix snapshots
async function handleWatch(args, infra) {
  if (!args || !args.id) return { ok: false, error: 'watch requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  const lifecycle = require(require('path').join(__dirname, '..', 'lib/application/sprint-lifecycle'));

  // Auto-pause triggers snapshot (best-effort)
  let triggers = [];
  try {
    if (typeof lifecycle.checkAutoPauseTriggers === 'function') {
      triggers = lifecycle.checkAutoPauseTriggers(sprint) || [];
    }
  } catch (_e) { /* triggers optional */ }

  // Matrix snapshots (best-effort)
  const matrices = {};
  try {
    if (infra.matrixSync && typeof infra.matrixSync.read === 'function') {
      const mods = ['data-flow', 'cumulative-state', 'feature-phase'];
      for (let i = 0; i < mods.length; i++) {
        try {
          matrices[mods[i]] = await infra.matrixSync.read(args.id, mods[i]);
        } catch (_e) {
          matrices[mods[i]] = null;
        }
      }
    }
  } catch (_e) { /* matrices optional */ }

  return {
    ok: true,
    snapshot: sprint,
    triggers: triggers,
    matrices: matrices,
    phase: sprint.phase,
    timestamp: new Date().toISOString(),
  };
}

function handleHelp() {
  return {
    ok: true,
    helpText: [
      'bkit:sprint — Sprint Management',
      '',
      'Actions (16):',
      '  init     /sprint init <id> --name <name> [--trust L0-L4]',
      '  start    /sprint start <id> [--trust L0-L4]',
      '  status   /sprint status <id>',
      '  list     /sprint list',
      '  phase    /sprint phase <id> --to <phase> [--approve] [--reason "<text>"]',
      '             --approve: single-use Trust Level scope-boundary escape hatch (v2.1.16 #95)',
      '             --reason : optional rationale recorded under audit action scope_boundary_approved',
      '  iterate  /sprint iterate <id>',
      '  qa       /sprint qa <id> --feature <name>',
      '  report   /sprint report <id>',
      '  archive  /sprint archive <id>',
      '  pause    /sprint pause <id>',
      '  resume   /sprint resume <id>',
      '  watch    /sprint watch <id>',
      '  fork     /sprint fork <id> --new <newId>',
      '  feature  /sprint feature <id> --action list|add|remove --feature <name>',
      '  master-plan /sprint master-plan <project> --name <name> --features <a,b,c>',
      '  measure  /sprint measure <id> --gate <key> | --gates <CSV> | --phase <phase>',
      '             v2.1.16 (Issue #94 F3): partial gate measurement via measure-router',
      '             routed agents: M1/M3/M4 → gap-detector, M2/M7 → code-analyzer,',
      '                            M8 → sprint-orchestrator, S1 → sprint-qa-flow',
      '             Trust L0/L1: preview mode (no state mutation, no audit)',
      '             Trust L2+ : recorded + audit action gate_measured',
      '  help     /sprint help',
    ].join('\n'),
  };
}

// =====================================================================
// v2.1.16 (Issue #94 F3) — /sprint measure handler (17th action)
// =====================================================================

/**
 * Handle `/sprint measure <id> --gate <key> | --gates <CSV> | --phase <p>`.
 *
 * Routes per Master Plan §11.3 AC1-AC7:
 *   - Single gate    : args.gate         → measure-gate.usecase.measureGate
 *   - Multiple gates : args.gates        → measure-gate.usecase.measureGates
 *   - Phase batch    : args.phase        → measure-gate.usecase.measurePhaseGates
 *
 * Trust Level scope (Master Plan AC5): L0/L1 preview-only (sprint.qualityGates
 * unchanged, no audit), L2+ record + audit. measure-gate UC enforces this.
 *
 * Agent dispatch (Master Plan AC4): measure-router.js maps gateKey → agent.
 * agentTaskRunner is taken from `deps.agentTaskRunner` (same as
 * wireAgentAdapters). When the dispatcher (Claude Code session) does not
 * inject one, the use case returns `reason: 'no_agent_runner'` per gate.
 *
 * @param {Object} args - { id, gate? (string), gates? (CSV string|string[]), phase? (string), trustLevel?, source? ('manual'|'auto') }
 * @param {Object} infra - SprintInfra bundle (state-store)
 * @param {Object} deps  - { agentTaskRunner? }
 * @returns {Promise<{ ok: boolean, sprintId?: string, gateKeys?: string[], mode?: string, results?: Array, successCount?: number, failureCount?: number, error?: string }>}
 */
async function handleMeasure(args, infra, deps) {
  if (!args || !args.id) {
    return { ok: false, error: 'measure requires { id }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };

  // Resolve which gates to measure (mutually exclusive precedence).
  let gateKeys = [];
  let resolveSource = null;
  if (typeof args.gate === 'string' && args.gate.length > 0) {
    gateKeys = [args.gate];
    resolveSource = 'gate';
  } else if (args.gates) {
    gateKeys = Array.isArray(args.gates)
      ? args.gates.slice()
      : parseFeaturesFlag(args.gates);
    resolveSource = 'gates';
  } else if (typeof args.phase === 'string' && args.phase.length > 0) {
    // Defer to measurePhaseGates UC which knows ACTIVE_GATES_BY_PHASE.
    return runPhaseGates(sprint, args, infra, deps);
  }
  if (gateKeys.length === 0) {
    return {
      ok: false,
      error: 'measure requires one of: --gate <key> | --gates <CSV> | --phase <phase>',
      validActions: ['--gate', '--gates', '--phase'],
    };
  }

  const trustLevel = typeof args.trustLevel === 'string'
    ? args.trustLevel
    : (sprint.autoRun && sprint.autoRun.trustLevelAtStart);
  const source = (args.source === 'auto' || args.source === 'manual') ? args.source : 'manual';

  // Sequential dispatch (ENH-292) via the UC's aggregator.
  const ucDeps = {
    agentTaskRunner: deps.agentTaskRunner,
    trustLevel,
    source,
  };
  const agg = await lifecycle.measureGates(sprint, gateKeys, ucDeps);

  // Persist + audit per successful record-mode result.
  await persistAndAudit(agg, infra, args.id);

  return {
    ok: agg.ok,
    sprintId: args.id,
    resolveSource,
    gateKeys,
    trustLevel,
    successCount: agg.successCount,
    failureCount: agg.failureCount,
    results: agg.results,
  };
}

async function runPhaseGates(sprint, args, infra, deps) {
  const trustLevel = typeof args.trustLevel === 'string'
    ? args.trustLevel
    : (sprint.autoRun && sprint.autoRun.trustLevelAtStart);
  const source = (args.source === 'auto' || args.source === 'manual') ? args.source : 'manual';
  const ucDeps = {
    agentTaskRunner: deps.agentTaskRunner,
    trustLevel,
    source,
  };
  const agg = await lifecycle.measurePhaseGates(sprint, args.phase, ucDeps);
  await persistAndAudit(agg, infra, args.id);
  return {
    ok: agg.ok,
    sprintId: args.id,
    resolveSource: 'phase',
    phase: agg.phase,
    gateKeys: agg.results.map((r) => r.gateKey),
    skippedUnsupported: agg.skippedUnsupported,
    trustLevel,
    successCount: agg.successCount,
    failureCount: agg.failureCount,
    results: agg.results,
  };
}

async function persistAndAudit(agg, infra, sprintId) {
  // Single state save at the end (cumulative qualityGates from UC aggregator).
  let saved = false;
  if (agg && agg.sprint && agg.results.some((r) => r.ok && r.mode === 'record')) {
    await infra.stateStore.save(agg.sprint);
    saved = true;
  }
  // Per-gate audit emission for record-mode successes.
  try {
    const audit = require('../lib/audit/audit-logger');
    for (const r of (agg.results || [])) {
      if (r.ok && r.mode === 'record' && r.auditRecord) {
        audit.writeAuditLog({
          actor: 'user',
          action: 'gate_measured',
          category: 'sprint',
          target: sprintId,
          targetType: 'feature',
          details: r.auditRecord,
          result: r.auditRecord.passed === false ? 'failure' : 'success',
        });
      }
    }
  } catch (_e) { /* audit best-effort */ }
  return saved;
}

// =====================================================================
// S2-UX v2.1.13 — Master Plan Generator handler (16th action)
// =====================================================================

/**
 * Handle `/sprint master-plan <project>` action — delegates to
 * lib/application/sprint-lifecycle generateMasterPlan use case.
 *
 * Cross-sprint integration (PRD §JS-02): this handler does NOT spawn the
 * sprint-master-planner agent itself. The LLM dispatcher at main session
 * may inject `deps.agentSpawner` (wrapping Task tool invocation). When not
 * injected, the use case runs in dry-run mode (template substitution).
 *
 * @param {Object} args - { id (projectId), name (projectName), features?, trust?, context?, force?, duration?, projectRoot? }
 * @param {Object} infra - SprintInfra bundle (unused here, use case constructs its own paths)
 * @param {Object} deps - { agentSpawner?, fileWriter?, fileDeleter?, auditLogger?, taskCreator? }
 * @returns {Promise<{ ok: boolean, plan?, masterPlanPath?, stateFilePath?, alreadyExists?, error?, errors? }>}
 */
async function handleMasterPlan(args, infra, deps) {
  if (!args || typeof args.id !== 'string' || args.id.length === 0) {
    return { ok: false, error: 'master-plan requires { id (projectId) }' };
  }
  if (typeof args.name !== 'string' || args.name.length === 0) {
    return { ok: false, error: 'master-plan requires { name (projectName) }' };
  }
  const features = parseFeaturesFlag(args.features);
  const input = {
    projectId: args.id,
    projectName: args.name,
    features: features,
    context: Object.assign(defaultContext(), args.context || {}),
    trustLevel: normalizeTrustLevel(args),
    projectRoot: args.projectRoot || process.cwd(),
    force: args.force === true || args.force === 'true',
    duration: typeof args.duration === 'string' ? args.duration : 'TBD',
  };
  const lifecycle = require('../lib/application/sprint-lifecycle');
  const d = deps || {};
  const usecaseDeps = {
    agentSpawner: d.agentSpawner,
    fileWriter: d.fileWriter,
    fileDeleter: d.fileDeleter,
    auditLogger: d.auditLogger,
    taskCreator: d.taskCreator,
  };
  return lifecycle.generateMasterPlan(input, usecaseDeps);
}

/**
 * Parse `--features` flag value (CSV string or array) into a string array.
 *
 * @param {string|string[]|undefined} raw
 * @returns {string[]}
 */
function parseFeaturesFlag(raw) {
  if (Array.isArray(raw)) return raw.filter(function (s) { return typeof s === 'string' && s.length > 0; });
  if (typeof raw === 'string' && raw.length > 0) {
    return raw.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s.length > 0; });
  }
  return [];
}

// =====================================================================
// CLI mode (P1 §4.3) — invoked when run as `node scripts/sprint-handler.js`
//   Examples:
//     node scripts/sprint-handler.js status my-launch
//     node scripts/sprint-handler.js start my-launch --trust L4
//     node scripts/sprint-handler.js help
//   Returns: JSON.stringify(result, null, 2) on stdout. exit code 0 (ok), 1 (handler error), 2 (exception).
//   require() callers are unaffected (this block is gated by require.main check).
// =====================================================================
if (require.main === module) {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv[0] === '--help' || argv[0] === '-h' || argv[0] === 'help') {
    Promise.resolve(handleHelp()).then((r) => {
      process.stdout.write(r.helpText + '\n');
      process.exit(0);
    });
  } else {
    const action = argv[0];
    const positionalId = (argv[1] && !argv[1].startsWith('--')) ? argv[1] : undefined;
    const flags = parseFlags(argv.slice(positionalId ? 2 : 1));
    if (positionalId && !flags.id) flags.id = positionalId;
    // Deep-QA fix: normalize `--features=a,b,c` CSV → array for ALL actions
    // (previously only master-plan parsed via parseFeaturesFlag; init/fork/etc
    // received raw string → validator rejected with `invalid_features_not_array`).
    if (typeof flags.features === 'string' && flags.features.length > 0) {
      flags.features = parseFeaturesFlag(flags.features);
    }
    // Same normalization for `--newId` vs `--new` shorthand (fork action)
    if (action === 'fork' && flags.new && !flags.newId) flags.newId = flags.new;
    // Same for `--feature` vs `--featureName` shorthand (feature action)
    if ((action === 'feature' || action === 'qa') && flags.feature && !flags.featureName) {
      flags.featureName = flags.feature;
    }
    handleSprintAction(action, flags, {})
      .then((result) => {
        process.stdout.write(JSON.stringify(result, null, 2) + '\n');
        process.exit(result && result.ok ? 0 : 1);
      })
      .catch((err) => {
        process.stderr.write(JSON.stringify({
          ok: false,
          error: (err && err.message) || String(err),
        }, null, 2) + '\n');
        process.exit(2);
      });
  }
}

module.exports = {
  handleSprintAction,
  VALID_ACTIONS,
  getInfra,
};
