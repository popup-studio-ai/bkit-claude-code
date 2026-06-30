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
  'trust',       // F2 v2.1.18 (Issue #101) — 18th action — /sprint trust mutation
  'dogfood',     // F1-2 v2.1.19 S1 — 19th action — bkit self-dogfood sprint container
  'annotate',    // F1-5 v2.1.19 S1 — 20th action — post-hoc archived-state annotation
]);


// S3a ENH-343: god-file split — helpers → lib/sprint-handler-shared,
// handlers → lib/sprint-handlers-core / lib/sprint-handlers-admin.
// Slice 1 (#1): re-export createTaskToolRunner so callers can build a runner
// from the dispatcher surface (scripts/sprint-handler) without reaching into
// the shared internals.
const { parseFlags, parseFeaturesFlag, createTaskToolRunner, createTaskCreatorForRunner } = require('./lib/sprint-handler-shared');
const {
  handleInit,
  handleStart,
  handleStatus,
  handleList,
  handlePhase,
  handleIterate,
  handleQA,
  handleReport,
  handleArchive,
  handlePause,
  handleResume,
  handleFork,
  handleFeature,
  handleWatch,
} = require('./lib/sprint-handlers-core');
const {
  handleTrust,
  handleDogfood,
  handleAnnotate,
  handleHelp,
  handleMeasure,
  handleMasterPlan,
} = require('./lib/sprint-handlers-admin');

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

  // Slice 1 (Cluster A): thread agentTaskRunner onto the measure + phase deps
  // slices so the contract is explicit per path. handleMeasure currently reads
  // the top-level `deps.agentTaskRunner` (preserved by the `{ ...deps }`
  // spread above), and handlePhase does not consume the runner (its gate
  // checks use persisted sprint.qualityGates values). Threading the runner
  // onto these named slices makes the deps self-describing for any future
  // refactor that moves a handler to read its own slice, and keeps the
  // runner reachable if a caller passes only `measureDeps`/`phaseDeps`.
  if (deps.agentTaskRunner) {
    wired.measureDeps = Object.assign({ agentTaskRunner: deps.agentTaskRunner }, deps.measureDeps || {});
    wired.phaseDeps = Object.assign({ agentTaskRunner: deps.agentTaskRunner }, deps.phaseDeps || {});
  }

  // Slice 4 (Task 4.5): wire a default taskCreator when an agentTaskRunner is
  // present. generateMasterPlan only creates tracker tasks when
  // deps.taskCreator is a function; without this wiring, master plans silently
  // skipped tracker-task creation. Caller-supplied taskCreator always wins (||).
  // The adapter is resilient: it synthesizes a stable id on runner failure and
  // never throws, so tracker-task creation stays best-effort.
  if (deps.agentTaskRunner) {
    wired.taskCreator = deps.taskCreator || createTaskCreatorForRunner(deps.agentTaskRunner);
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
  // v2.1.21 (Issue #113): write a cross-process active-skill marker so the
  // end-of-turn Stop hook (unified-stop) can dispatch sprint-skill-stop even
  // when CC omits skill_name from the Stop payload and skill_post is dropped
  // (#57317). The sprint skill ALWAYS routes through this handler, so this is a
  // reliable write point. Best-effort — never blocks the action.
  try {
    require('../lib/core/active-skill-marker').writeActiveSkill({
      skill: 'sprint',
      action,
      id: a.id || a.newId || null,
      phase: a.to || null,
    });
  } catch (_e) { /* non-critical */ }
  const d = wireAgentAdapters(deps || {});
  const infra = d.infra || getInfra(a);
  let result;
  try {
    switch (action) {
      case 'init':    result = await handleInit(a, infra); break;
      case 'start':   result = await handleStart(a, infra, d); break;
      case 'status':  result = await handleStatus(a, infra); break;
      case 'list':    result = await handleList(a, infra); break;
      case 'phase':   result = await handlePhase(a, infra, d); break;
      case 'iterate': result = await handleIterate(a, infra, d); break;
      case 'qa':      result = await handleQA(a, infra, d); break;
      case 'report':  result = await handleReport(a, infra, d); break;
      case 'archive': result = await handleArchive(a, infra); break;
      case 'pause':   result = await handlePause(a, infra); break;
      case 'resume':  result = await handleResume(a, infra); break;
      case 'fork':    result = await handleFork(a, infra); break;
      case 'feature': result = await handleFeature(a, infra); break;
      case 'watch':   result = await handleWatch(a, infra); break;
      case 'help':    result = await handleHelp(); break;
      case 'master-plan': result = await handleMasterPlan(a, infra, d); break;
      case 'measure': result = await handleMeasure(a, infra, d); break;
      case 'trust':   result = await handleTrust(a, infra, d); break;
      case 'dogfood': result = await handleDogfood(a, infra, d); break;   // F1-2 v2.1.19 S1
      case 'annotate':result = await handleAnnotate(a, infra); break;     // F1-5 v2.1.19 S1
      default:        result = { ok: false, error: 'Unreachable action: ' + action }; break;
    }
  } finally {
    // Slice 4 (Task 4.5 Defect 2): best-effort flush of the REAL infra emitter
    // (the one used during the action) before returning to the caller. This
    // guarantees buffered telemetry (audit/OTEL) is drained regardless of how
    // the caller exits — notably the CLI's `require.main` block calls
    // `process.exit()` directly, which would otherwise drop in-flight events.
    // Flushing here uses the correct emitter instance (NOT a fresh no-op one):
    // getInfra() returns a fresh bundle per call, so flushing in the CLI block
    // would be a no-op for the in-flight events. Best-effort + non-blocking —
    // a flush failure must never change the action's result. help returns a
    // bare object with no infra, so guard for that.
    try {
      if (infra && infra.eventEmitter && typeof infra.eventEmitter.flush === 'function') {
        await infra.eventEmitter.flush();
      }
    } catch (_flushErr) { /* best-effort: never surface flush failures */ }
  }
  return result;
}


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
    // v2.1.19 S1 F1-2: action-specific positional mapping.
    // Default behavior: positionalId → flags.id (sprint id semantics).
    // dogfood: positionalId → flags.releaseVersion (release version semantics);
    // --id <custom> still works as explicit override of derived sprint id.
    if (action === 'dogfood') {
      if (positionalId && !flags.releaseVersion) flags.releaseVersion = positionalId;
      // do NOT auto-assign flags.id from positional for dogfood
    } else {
      if (positionalId && !flags.id) flags.id = positionalId;
    }
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
  wireAgentAdapters,
  // Slice 1 (#1): re-export the host-adapter factory so callers can build a
  // runner from the dispatcher surface without requiring the shared module.
  createTaskToolRunner,
};
