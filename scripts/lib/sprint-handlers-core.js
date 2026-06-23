'use strict';
/**
 * sprint-handlers-core — sprint action handlers extracted from scripts/sprint-handler.js
 * (v2.1.22 S3a ENH-343). Handlers are mutually independent (no handler calls
 * another) and receive infra/deps as params. Shared helpers/consts imported
 * from ./sprint-handler-shared. Require paths rebased (../lib → ../../lib).
 * @module scripts/lib/sprint-handlers-core
 */

const {
  createSprintInfra,
  createGapDetector,
  createAutoFixer,
  createDataFlowValidator,
} = require('../../lib/infra/sprint');
const lifecycle = require('../../lib/application/sprint-lifecycle');
const domain = require('../../lib/domain/sprint');
const { MATRIX_TYPES } = require('../../lib/infra/sprint/sprint-paths');

const {
  normalizeTrustLevel,
  isDowngrade,
  severity,
  loadTrustScore,
  resolveActor,
  parseFlags,
  defaultContext,
  isValidReleaseVersion,
  resolveBkitVersion,
  resolveBkitCommit,
  autoDeriveDogfoodContext,
  buildFailureReporterForHandler,
  buildReportFileWriterForHandler,
  identifyCarryItems,
  runPhaseGates,
  persistAndAudit,
  parseFeaturesFlag,
  VALID_TRUST_LEVELS,
  DEFAULT_TRUST_LEVEL,
  LEVEL_RANK,
} = require('./sprint-handler-shared');

async function handleInit(args, infra) {
  if (!args || !args.id || !args.name) {
    return { ok: false, error: 'init requires { id, name }' };
  }
  const v = domain.validateSprintInput({
    id: args.id, name: args.name,
    phase: args.phase, context: args.context, features: args.features,
  });
  if (!v.ok) return { ok: false, error: 'invalid_input', errors: v.errors };
  // F1-4 v2.1.19 S1 — L1 explicit warning + audit emit.
  // Only warn when L1 was *explicitly* requested (args.trust or args.trustLevel
  // === 'L1' raw). Defensive `trustLevelAtStart` from re-init paths is NOT
  // a user-explicit choice, so no warning emitted on that path.
  const userExplicitL1 = (args.trust === 'L1' || args.trustLevel === 'L1');
  if (userExplicitL1) {
    process.stderr.write(
      `[WARN] /sprint init ${args.id} --trust L1: L1 sprints may enter ` +
      `preview-mode lockout. Consider \`/sprint trust ${args.id} --to L3\` ` +
      `to escalate when ready to record measurements (v2.1.18 #101 follow-up).\n`
    );
    try {
      require('../../lib/audit/audit-logger').writeAuditLog({
        actor: 'user',
        actorId: process.env.CLAUDE_AGENT_ID || 'sprint-init-cli',
        action: 'sprint_trust_warning',
        category: 'sprint',
        target: args.id,
        targetType: 'feature',
        details: {
          sprintId: args.id,
          attemptedLevel: 'L1',
          recommendedAction: `/sprint trust ${args.id} --to L3`,
          warningMessage: 'L1 sprints may enter preview-mode lockout',
        },
        result: 'success',
        destructiveOperation: false,
      });
    } catch (_) { /* audit log failures must NOT block init */ }
  }
  // v2.1.19 S3 F3-2 (closes #104): context auto-import fallback chain.
  //   args.context (explicit) > master-plan.md > PRD.md > defaultContext()
  // The chain only activates when caller omits args.context (or supplies
  // empty context) — explicit override still wins.
  let resolvedContext = args.context;
  let contextSource = 'explicit';
  let contextFilePath = null;
  const ctxHasContent = args.context && Object.values(args.context).some(v => typeof v === 'string' && v.trim().length > 0);
  if (!ctxHasContent) {
    try {
      const ctxImporter = require('../../lib/application/sprint-lifecycle/context-importer');
      const resolution = await ctxImporter.resolveContext(args.id, { projectRoot: process.cwd() });
      resolvedContext = resolution.context;
      contextSource = resolution.source;
      contextFilePath = resolution.filePath;
      // Audit emit on successful import (skip 'default' — no surprise to user)
      if (resolution.source !== 'default') {
        try {
          require('../../lib/audit/audit-logger').writeAuditLog({
            actor: 'system',
            actorId: process.env.CLAUDE_AGENT_ID || 'sprint-init-cli',
            action: 'sprint_context_imported',
            category: 'sprint',
            target: args.id,
            targetType: 'feature',
            details: {
              sprintId: args.id,
              source: resolution.source,
              filePath: resolution.filePath,
              populatedFields: Object.keys(resolution.context).filter(k => resolution.context[k] && resolution.context[k].length > 0),
            },
            result: 'success',
            destructiveOperation: false,
          });
        } catch (_) { /* audit failure non-blocking */ }
      }
    } catch (_) {
      // context-importer failure → fall back to defaultContext
      resolvedContext = undefined;
    }
  }

  const sprint = domain.createSprint({
    id: args.id,
    name: args.name,
    phase: args.phase || 'prd',
    context: { ...defaultContext(), ...(resolvedContext || {}) },
    features: Array.isArray(args.features) ? args.features : [],
    trustLevelAtStart: normalizeTrustLevel(args),
  });
  await infra.stateStore.save(sprint);
  infra.eventEmitter.emit(domain.SprintEvents.SprintCreated({
    sprintId: sprint.id, name: sprint.name, phase: sprint.phase,
  }));
  return { ok: true, sprint, sprintId: sprint.id, contextSource, contextFilePath };
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
  // v2.1.21 (Issue #113, F8): attach human-readable screen so the status is
  // self-explanatory instead of 100%-LLM-narrated raw JSON.
  let display = null;
  try {
    const { formatStatusScreen } = require('../../lib/sprint/executive-summary');
    display = formatStatusScreen(sprint);
  } catch (_e) { display = null; }
  return { ok: true, sprint, display };
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
  // v2.1.21 (Issue #113, F7): inject transitionSummaryBuilder so advancePhase
  // attaches a human-readable Sprint Executive Summary to the success payload.
  // Builder is pure (lib/sprint/executive-summary — no I/O); handler owns the
  // wiring, advancePhase stays free of the lib/sprint import (layer discipline).
  let transitionSummaryBuilder = null;
  try {
    const { generateSprintExecutiveSummary } = require('../../lib/sprint/executive-summary');
    transitionSummaryBuilder = (s, opts) => generateSprintExecutiveSummary(s, opts || {});
  } catch (_e) { transitionSummaryBuilder = null; }
  const advanceDeps = Object.assign({
    eventEmitter: infra.eventEmitter.emit,
    approve: args.approve === true || args.approve === 'true',
    reason: typeof args.reason === 'string' ? args.reason : null,
    failureReporter: failureReporter,
    transitionSummaryBuilder: transitionSummaryBuilder,
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
    audit = require('../../lib/audit/audit-logger');
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
    // Slice 2 (Cluster F): persist the computed s1Score to the S1 gate slot so
    // advancePhase sees a measured value instead of null/not_measured. Without
    // this, the S1 slot stayed null forever and advancePhase always reported
    // not_measured even after a successful qa.
    sprint.qualityGates.S1_dataFlowIntegrity = {
      current: result.s1Score,
      threshold: 100,
      passed: result.s1Score >= 100,
    };
    // Slice 3 (Task 3.4): mark the feature as qa-passed and fully complete so
    // the S2 computed gate (count of featureMap entries with completion >= 100)
    // has populated data. qa-pass is the ONLY path that grants completion=100.
    // Defensive: only update if the feature exists in featureMap (older sprints
    // created before featureMap population, or features added via legacy paths,
    // may be absent — skip silently rather than crash, but still persist S1 and
    // succeed). Copy-construct the entry rather than mutate-then-rely-on-aliasing.
    if (sprint.featureMap && sprint.featureMap[args.featureName]) {
      sprint.featureMap[args.featureName] = {
        ...sprint.featureMap[args.featureName],
        qa: 'pass',
        completion: 100,
      };
    }
    // Slice 4 (Task 4.2): record per-hop results to sprint.dataFlow[feature].
    // Tier-2 static validator (data-flow-validator.adapter validatorStatic)
    // reads sprint.dataFlow[feature][hopId].status === 'pass' with .evidence,
    // so this recording is what makes a subsequent staticMatrix QA replayable
    // (re-validate from the recorded matrix instead of re-probing) and works
    // for archived sprints where live probing is impossible. Defensive on
    // missing dataFlow (copy-construct, supports legacy sprints) and missing
    // hopResults (skip gracefully — everything else still persists).
    if (Array.isArray(result.hopResults)) {
      sprint.dataFlow = { ...(sprint.dataFlow || {}) };
      const dataFlowFeature = {};
      for (const hop of result.hopResults) {
        dataFlowFeature[hop.hopId] = {
          status: hop.passed ? 'pass' : 'fail',
          evidence: hop.evidence || null,
          reason: hop.reason || null,
          from: hop.from,
          to: hop.to,
        };
      }
      sprint.dataFlow[args.featureName] = dataFlowFeature;
    }
    await infra.stateStore.save(sprint);
    result.s1Persisted = true;
  }
  return result;
}

async function handleReport(args, infra, deps) {
  if (!args || !args.id) return { ok: false, error: 'report requires { id }' };
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };
  // Slice 3 (Task 3.5): construct the default fileWriter so the report is
  // actually written to disk. Caller-supplied deps.reportDeps.fileWriter
  // still wins (test-injection path) because Object.assign merges the
  // built-in writer FIRST and caller overrides SECOND.
  const fileWriter = buildReportFileWriterForHandler();
  const reportDeps = Object.assign({ fileWriter }, deps.reportDeps || {});
  const result = await lifecycle.generateReport(sprint, reportDeps);
  // Persist sprint.docs.report on a real write so the S4 archiveReadiness
  // gate (computeArchiveReadiness requires sprint.docs.report truthy) can
  // fire. Reload fresh state and copy-construct the nested docs object to
  // avoid mutating the in-memory sprint passed to generateReport.
  // IMPORTANT: check the MERGED reportDeps.fileWriter (the value
  // generateReport actually used), NOT the local built-in fileWriter const.
  // A caller override of fileWriter:null means generateReport wrote nothing,
  // so we must not persist a phantom docs.report path (S4 archiveReadiness
  // only checks truthiness, not file existence on disk).
  if (result.ok && reportDeps.fileWriter && result.reportPath) {
    const fresh = await infra.stateStore.load(args.id);
    if (fresh) {
      fresh.docs = { ...(fresh.docs || {}), report: result.reportPath };
      await infra.stateStore.save(fresh);
      result.docsReportPersisted = true;
    }
  }
  return result;
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
  // Module-level `domain` import (../../lib/domain/sprint) is used below.
  // NOTE: a prior LOCAL require(path.join(__dirname,'..','lib/domain/sprint'))
  // here resolved to the nonexistent scripts/lib/domain/sprint and would throw
  // MODULE_NOT_FOUND on every fork — same bug class as handleWatch (Task 4.4)
  // and handleFeature (Task 3.2). Removed; relies on the module-level import.
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

async function handleFeature(args, infra) {
  if (!args || !args.id || !args.action) {
    return { ok: false, error: 'feature requires { id, action: list|add|remove [, featureName] }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) return { ok: false, error: 'Sprint not found: ' + args.id };

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
      // Keep featureMap in lockstep with features[] (twin sources of truth).
      // Re-add is idempotent: do NOT overwrite an existing entry's progress.
      const featureMap = Object.assign({}, sprint.featureMap || {});
      if (!featureMap[args.featureName]) {
        featureMap[args.featureName] = {
          pdcaPhase: 'pm',
          matchRate: null,
          qa: 'pending',
          completion: 0,
        };
      }
      const updated = domain.cloneSprint(sprint, { features: features, featureMap: featureMap });
      await infra.stateStore.save(updated);
      return { ok: true, sprint: updated };
    }
    case 'remove': {
      if (!args.featureName) return { ok: false, error: 'remove requires featureName' };
      const features = (sprint.features || []).filter(function (f) { return f !== args.featureName; });
      // Keep featureMap in lockstep with features[] (twin sources of truth).
      const featureMap = Object.assign({}, sprint.featureMap || {});
      delete featureMap[args.featureName];
      const updated = domain.cloneSprint(sprint, { features: features, featureMap: featureMap });
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
      // Read only real matrix types (data-flow/api-contract/test-coverage). The
      // prior 'cumulative-state'/'feature-phase' were ghost types with no
      // producer, no persisted matrix file, and no design-doc backing.
      const mods = MATRIX_TYPES.slice();
      for (let i = 0; i < mods.length; i++) {
        try {
          matrices[mods[i]] = await infra.matrixSync.read(args.id, mods[i]);
        } catch (_e) {
          matrices[mods[i]] = null;
        }
      }
    }
  } catch (_e) { /* matrices optional */ }

  // v2.1.21 (Issue #113, F8): human-readable watch screen (includes fired triggers).
  let display = null;
  try {
    const { formatStatusScreen } = require('../../lib/sprint/executive-summary');
    display = formatStatusScreen(sprint, { triggers });
  } catch (_e) { display = null; }

  return {
    ok: true,
    snapshot: sprint,
    triggers: triggers,
    matrices: matrices,
    phase: sprint.phase,
    display,
    timestamp: new Date().toISOString(),
  };
}


module.exports = {
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
};
