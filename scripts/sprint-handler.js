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

/**
 * Valid trust levels (L0-L4) per Master Plan §11.2 SPRINT_AUTORUN_SCOPE.
 * @type {ReadonlyArray<'L0'|'L1'|'L2'|'L3'|'L4'>}
 */
const VALID_TRUST_LEVELS = Object.freeze(['L0', 'L1', 'L2', 'L3', 'L4']);

/**
 * @type {'L2'}
 *
 * v2.1.19 S1 F1-4 (CTO M-1): default lowered from L3 to L2 per Safe Defaults
 * principle (master plan §3.2). Aligns with entity.js createSprint default
 * (eliminates the v2.1.16~v2.1.18 drift between handler default L3 and
 * entity default L2). User-explicit --trust L1 emits sprint_trust_warning
 * audit + stderr warning re: preview-mode lockout (Issue #101 follow-up).
 */
const DEFAULT_TRUST_LEVEL = 'L2';

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

// ============================================================
// v2.1.18 (Issue #101, F2) — Trust mutation helpers
// ============================================================

/** Numeric rank for trust level comparison (downgrade/severity calc). */
const LEVEL_RANK = Object.freeze({ L0: 0, L1: 1, L2: 2, L3: 3, L4: 4 });

/**
 * Check if a trust-level transition is a downgrade.
 * @param {string} from
 * @param {string} to
 * @returns {boolean}
 */
function isDowngrade(from, to) {
  return LEVEL_RANK[to] < LEVEL_RANK[from];
}

/**
 * Classify trust-level transition severity.
 * @param {string} from
 * @param {string} to
 * @returns {'upgrade'|'minor'|'major'} 'major' for ≥2-level downgrade.
 */
function severity(from, to) {
  const diff = LEVEL_RANK[from] - LEVEL_RANK[to];
  if (diff <= 0) return 'upgrade';     // L1 → L3
  if (diff === 1) return 'minor';      // L3 → L2
  return 'major';                       // L4 → L1 (or larger)
}

/**
 * Load trust score from .bkit/state/trust-profile.json (0-100, 6-component
 * weighted sum). Returns deps.trustScore when injected (for testing) or 0
 * when trust-profile is absent/unreadable.
 *
 * @param {{ trustScore?: number }} [deps]
 * @returns {Promise<number>}
 */
async function loadTrustScore(deps) {
  if (deps && typeof deps.trustScore === 'number') return deps.trustScore;
  try {
    const fsp = require('fs').promises;
    const path = require('path');
    const projectRoot = process.cwd();
    const tp = await fsp.readFile(
      path.join(projectRoot, '.bkit', 'state', 'trust-profile.json'),
      'utf8'
    );
    const parsed = JSON.parse(tp);
    if (typeof parsed.trustScore === 'number') return parsed.trustScore;
  } catch (_) {
    // trust-profile missing or unreadable — fall back to 0 (most restrictive)
  }
  return 0;
}

/**
 * Resolve effective actor for audit (CTO §E6 spoofing mitigation).
 * Priority: explicit args.actor (if valid) > env CLAUDE_AGENT_ID → 'agent' >
 * default 'user'.
 *
 * @param {Object} args
 * @returns {'user'|'agent'|'system'}
 */
function resolveActor(args) {
  if (args && typeof args.actor === 'string') {
    if (['user', 'agent', 'system'].includes(args.actor)) return args.actor;
  }
  if (process.env.CLAUDE_AGENT_ID) return 'agent';
  return 'user';
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
    case 'trust':   return handleTrust(a, infra, d);
    case 'dogfood': return handleDogfood(a, infra, d);   // F1-2 v2.1.19 S1
    case 'annotate':return handleAnnotate(a, infra);      // F1-5 v2.1.19 S1
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
      require('../lib/audit/audit-logger').writeAuditLog({
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
      const ctxImporter = require('../lib/application/sprint-lifecycle/context-importer');
      const resolution = await ctxImporter.resolveContext(args.id, { projectRoot: process.cwd() });
      resolvedContext = resolution.context;
      contextSource = resolution.source;
      contextFilePath = resolution.filePath;
      // Audit emit on successful import (skip 'default' — no surprise to user)
      if (resolution.source !== 'default') {
        try {
          require('../lib/audit/audit-logger').writeAuditLog({
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

/**
 * v2.1.18 (Issue #101, F2) — /sprint trust mutation command.
 *
 * Mutates sprint.autoRun.trustLevelAtStart with downgrade guardrail (major
 * downgrade = ≥2-level diff blocked unless trustScore >= 80 OR --force) and
 * audit emission (always, including idempotent from===to noop path — CTO §C3).
 *
 * Recovers @pruge dandi-village-ledger s1-foundation L1 lockout scenario
 * (Plan §1.2, PRD US-101 + US-RECOVERY).
 *
 * @param {Object} args
 * @param {string} args.id              - sprint id (required)
 * @param {string} args.to              - target level 'L0'..'L4' (required, case-insensitive)
 * @param {string} [args.reason]        - mutation reason (audit trail, recommended)
 * @param {boolean} [args.force]        - bypass downgrade guardrail
 * @param {'user'|'agent'|'system'} [args.actor]  - explicit actor override
 * @param {Object} infra                - SprintInfra (stateStore)
 * @param {{ trustScore?: number, currentLevel?: number }} [deps] - DI for tests
 * @returns {Promise<Object>}
 */
async function handleTrust(args, infra, deps) {
  if (!args || !args.id) {
    return { ok: false, blockReason: 'sprint_not_found', error: 'trust requires { id }' };
  }
  if (!args.to || typeof args.to !== 'string') {
    return { ok: false, blockReason: 'missing_to', error: 'trust requires --to <L0|L1|L2|L3|L4>' };
  }
  const to = args.to.toUpperCase();
  if (!VALID_TRUST_LEVELS.includes(to)) {
    return {
      ok: false,
      blockReason: 'invalid_level',
      error: `--to must be one of ${VALID_TRUST_LEVELS.join('|')} (got: ${args.to})`,
    };
  }

  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) {
    return { ok: false, blockReason: 'sprint_not_found', error: 'Sprint not found: ' + args.id };
  }

  const from = (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || DEFAULT_TRUST_LEVEL;
  const actor = resolveActor(args);
  const now = new Date().toISOString();
  const audit = require('../lib/audit/audit-logger');

  // Idempotent path — emit audit with noop:true (CTO §C3 모니터링 사각지대 차단)
  if (from === to) {
    try {
      await audit.writeAuditLog({
        action: 'sprint_trust_changed',
        category: 'sprint',
        actor: actor,
        result: 'success',
        target: args.id,
        targetType: 'feature',
        blastRadius: 'low',
        details: {
          sprintId: args.id,
          from,
          to,
          reason: args.reason || null,
          trustScoreAtMutation: null,
          forced: !!args.force,
          noop: true,
          actor,
          timestamp: now,
        },
      });
    } catch (_) { /* audit failure is non-fatal for no-op path */ }
    return {
      ok: true,
      sprintId: args.id,
      from,
      to,
      noop: true,
      actor,
      reason: args.reason || null,
    };
  }

  // Downgrade guardrail — major (≥2 levels) downgrade requires trustScore >= 80
  // OR --force (CTO §A5 redline: trust-profile.json 'trustScore' field, 0-100)
  let trustScore = null;
  if (isDowngrade(from, to) && severity(from, to) === 'major') {
    trustScore = await loadTrustScore(deps);
    if (trustScore < 80 && !args.force) {
      return {
        ok: false,
        blockReason: 'guardrail_blocked',
        sprintId: args.id,
        from,
        to,
        trustScoreAtMutation: trustScore,
        error: `Major downgrade ${from} → ${to} requires trustScore >= 80 (current: ${trustScore}) or --force`,
      };
    }
  }

  // Mutation
  sprint.autoRun = sprint.autoRun || {};
  sprint.autoRun.trustLevelAtStart = to;
  await infra.stateStore.save(sprint);

  // Audit — --force OR major downgrade → blastRadius 'high' (Defense Layer 6 alarm)
  const blastRadius = args.force ? 'high' :
    (severity(from, to) === 'major' ? 'high' : 'low');

  let auditEntryId = null;
  try {
    const entry = await audit.writeAuditLog({
      action: 'sprint_trust_changed',
      category: 'sprint',
      actor: actor,
      result: 'success',
      target: args.id,
      targetType: 'feature',
      blastRadius,
      details: {
        sprintId: args.id,
        from,
        to,
        reason: args.reason || null,
        trustScoreAtMutation: trustScore,
        forced: !!args.force,
        noop: false,
        actor,
        timestamp: now,
      },
    });
    auditEntryId = (entry && entry.id) || null;
  } catch (_) { /* audit failure does not roll back mutation (decision: persistence priority) */ }

  return {
    ok: true,
    sprintId: args.id,
    from,
    to,
    reason: args.reason || null,
    actor,
    forced: !!args.force,
    trustScoreAtMutation: trustScore,
    blastRadius,
    auditEntryId,
  };
}

// ============================================================
// v2.1.19 S1 (F1-2) — /sprint dogfood — bkit self-dogfood sprint container
// ============================================================

/**
 * Validate a release version string against semver-lite (no build metadata).
 * Accepts: 2.1.20, v2.1.20, 2.1.20-rc.0, v2.1.20-beta.1
 * Rejects: 2.1, 2.1.20+build.1
 *
 * @param {string} v
 * @returns {boolean}
 */
function isValidReleaseVersion(v) {
  return typeof v === 'string' && /^v?\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(v);
}

/**
 * Resolve current bkit version from bkit.config.json (cached read).
 * Returns 'unknown' on filesystem error.
 *
 * @returns {string}
 */
function resolveBkitVersion() {
  try { return require('../bkit.config.json').version; }
  catch (_) { return 'unknown'; }
}

/**
 * Resolve current git HEAD commit hash. Returns 'unknown' on git failure
 * (e.g., when running outside a git work tree or on a detached process).
 *
 * @returns {string}
 */
function resolveBkitCommit() {
  try {
    return require('child_process').execSync('git rev-parse HEAD', {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch (_) { return 'unknown'; }
}

/**
 * Auto-derive Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) for a self-dogfood
 * sprint. Templated from release tag — NOT user-customizable in dogfood mode
 * (anti-mission: closed enum, no general primitive).
 *
 * @param {string} releaseVersion
 * @param {string} releaseTag
 * @returns {{ WHY: string, WHO: string, RISK: string, SUCCESS: string, SCOPE: string }}
 */
function autoDeriveDogfoodContext(releaseVersion, releaseTag) {
  return {
    WHY: `bkit self-dogfood of ${releaseVersion} — verify sprint container can run own release per master plan §19 Self-Dogfooding CI Gate.`,
    WHO: `bkit core team + CI workflow (release tag ${releaseTag})`,
    RISK: `If self-dogfood sprint fails or skips phases: release tag blocked by scripts/check-self-dogfood.sh (use --bootstrap-mode for first-cycle Exception per master plan §19.5).`,
    SUCCESS: `Sprint phase=archived + Quality Gates section present in report + audit sprint_dogfood_started emitted.`,
    SCOPE: `Single feature 'release-${releaseVersion}' — bkit release artifact verification + sprint state archive.`,
  };
}

/**
 * /sprint dogfood — initialize a bkit self-dogfood sprint container for a
 * release verification cycle. Idempotent on same sprint id.
 *
 * Signature: { releaseVersion: string, 'release-tag': string,
 *              dryRun?: boolean, id?: string, actor?: string }
 *
 * Master plan §19 (Self-Dogfooding CI Gate callee). Audit emits
 * sprint_dogfood_started on actual run; --dry-run is silent.
 *
 * @param {Object} args
 * @param {Object} infra
 * @param {Object} [deps]
 * @returns {Promise<{ok: boolean, sprintId?: string, dryRun?: boolean, skipped?: boolean, preview?: object, error?: string}>}
 */
async function handleDogfood(args, infra, deps) {
  if (!args || !args.releaseVersion || !args['release-tag']) {
    return { ok: false, error: 'dogfood requires { releaseVersion (positional), --release-tag <tag> }' };
  }
  const releaseVersion = args.releaseVersion;
  const releaseTag = args['release-tag'];
  if (!isValidReleaseVersion(releaseVersion)) {
    return { ok: false, error: `releaseVersion must be semver-lite (e.g. 2.1.20 or v2.1.20-rc.0). Got: ${releaseVersion}` };
  }
  const sprintId = args.id || ('self-dogfood-' + releaseTag.replace(/^v/, ''));
  const sprintName = `bkit self-dogfood ${releaseVersion}`;
  const context = autoDeriveDogfoodContext(releaseVersion, releaseTag);
  // v-prefix stripped for naming consistency (sprintId already strips v).
  const features = [`release-${releaseVersion.replace(/^v/, '')}`];
  const featureNamesNote = features[0]; // kept for reference; no logic dependency

  if (args.dryRun || args['dry-run']) {
    return {
      ok: true,
      dryRun: true,
      preview: { sprintId, sprintName, features, context, releaseVersion, releaseTag, trustLevelAtStart: 'L4' },
    };
  }

  // Idempotency: existing sprint with same id → graceful skip + warning audit.
  const existing = await infra.stateStore.load(sprintId);
  if (existing) {
    return {
      ok: true,
      skipped: true,
      reason: 'sprint with same id already exists',
      sprintId,
      existingPhase: existing.phase,
    };
  }

  const sprint = domain.createSprint({
    id: sprintId,
    name: sprintName,
    phase: 'prd',
    context,
    features,
    trustLevelAtStart: 'L4', // dogfood always L4 (CI-suitable full-auto)
  });
  await infra.stateStore.save(sprint);
  infra.eventEmitter.emit(domain.SprintEvents.SprintCreated({
    sprintId: sprint.id, name: sprint.name, phase: sprint.phase,
  }));

  // Audit emit sprint_dogfood_started — F1-2 invariant
  try {
    require('../lib/audit/audit-logger').writeAuditLog({
      actor: (deps && deps.actor) || 'user',
      actorId: process.env.CLAUDE_AGENT_ID || 'bkit-self-dogfood-cli',
      action: 'sprint_dogfood_started',
      category: 'sprint',
      target: sprintId,
      targetType: 'feature',
      details: {
        sprintId,
        releaseVersion,
        releaseTag,
        bkitVersion: resolveBkitVersion(),
        bkitCommit: resolveBkitCommit(),
      },
      result: 'success',
      destructiveOperation: false,
    });
  } catch (_) { /* audit failures must NOT block dogfood init */ }

  return { ok: true, sprintId, releaseVersion, releaseTag };
}

// ============================================================
// v2.1.19 S1 (F1-5) — /sprint annotate — post-hoc archived-state annotation
// ============================================================

/**
 * /sprint annotate — append a post-hoc note to a sprint (any phase, including
 * archived). Forward-only invariant: phase NOT mutated.
 *
 * Signature: { id: string, reason: string }
 *
 * Anti-mission compliance: closed enum (--reason only). No general field
 * mutation API (CTO B-2 rescope from v2.1.19 master plan — general
 * /sprint amend deferred to v2.1.20+ CO-E).
 *
 * @param {Object} args
 * @param {Object} infra
 * @returns {Promise<{ok: boolean, sprintId?: string, annotation?: object, totalAnnotations?: number, error?: string}>}
 */
async function handleAnnotate(args, infra) {
  if (!args || !args.id || !args.reason) {
    return { ok: false, error: 'annotate requires { id, --reason "<text>" }' };
  }
  const sprint = await infra.stateStore.load(args.id);
  if (!sprint) {
    return { ok: false, error: `sprint not found: ${args.id}` };
  }
  // Defensive: pre-v2.1.19 sprint state files may lack `annotations` field
  if (!Array.isArray(sprint.annotations)) sprint.annotations = [];

  const entry = {
    at: new Date().toISOString(),
    reason: args.reason,
    addedBy: process.env.CLAUDE_AGENT_ID ? 'agent' : 'user',
  };
  sprint.annotations.push(entry);
  await infra.stateStore.save(sprint);

  try {
    require('../lib/audit/audit-logger').writeAuditLog({
      actor: entry.addedBy,
      actorId: process.env.CLAUDE_AGENT_ID || 'sprint-annotate-cli',
      action: 'sprint_annotated',
      category: 'sprint',
      target: args.id,
      targetType: 'feature',
      details: {
        sprintId: args.id,
        annotationIndex: sprint.annotations.length - 1,
        reason: args.reason,
        at: entry.at,
      },
      result: 'success',
      destructiveOperation: false,
    });
  } catch (_) { /* audit failures must NOT block annotate */ }

  return {
    ok: true,
    sprintId: args.id,
    annotation: entry,
    totalAnnotations: sprint.annotations.length,
    phase: sprint.phase, // preserved — forward-only invariant
  };
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
      'Actions (20):',
      '  init     /sprint init <id> --name <name> [--trust L0-L4]',
      '             v2.1.19 S1 F1-4: default L2 (was L3 — Safe Defaults principle).',
      '             --trust L1 emits stderr warning + audit sprint_trust_warning',
      '             re: preview-mode lockout (v2.1.18 #101 follow-up).',
      '  start    /sprint start <id> [--trust L0-L4]',
      '  status   /sprint status <id>',
      '  list     /sprint list',
      '  phase    /sprint phase <id> --to <phase> [--approve] [--reason "<text>"]',
      '             --approve: single-use Trust Level scope-boundary escape hatch (v2.1.16 #95).',
      '             v2.1.19 S1 (CO-S0-6 clarification):',
      '               --approve ONLY bypasses Trust Level stopAfter scope boundary',
      '               (e.g., L3 stopAfter=qa, advance to report requires --approve).',
      '               --approve does NOT bypass Quality Gate failures (M*/S*).',
      '               For gate fail, use /sprint measure <id> --gate <key> first.',
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
      '  trust    /sprint trust <id> --to <L0-L4> [--reason "<text>"] [--force]',
      '             v2.1.18 (Issue #101): mutate sprint trust level in place',
      '             without re-init. audit: sprint_trust_changed.',
      '  dogfood  /sprint dogfood <release-version> --release-tag <tag> [--dry-run] [--id <custom>]',
      '             v2.1.19 S1 F1-2: bkit self-dogfood sprint container for release verification.',
      '             releaseVersion: semver (e.g. 2.1.20 or v2.1.20-rc.0).',
      '             Auto-creates sprint id "self-dogfood-<release>" + context anchor templated.',
      '             trustLevelAtStart=L4 (CI-suitable). Idempotent — graceful skip on dup.',
      '             audit: sprint_dogfood_started.',
      '  annotate /sprint annotate <id> --reason "<text>"',
      '             v2.1.19 S1 F1-5: post-hoc annotation on any sprint (incl. archived).',
      '             Append-only to sprint.annotations[]. Forward-only — phase preserved.',
      '             Closed enum (only --reason). audit: sprint_annotated.',
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

  // v2.1.18 (Issue #102, F3): normalize via normalizeTrustLevel (chain:
  //   args.trustLevel > args.trust > args.trustLevelAtStart) — previously this
  //   path checked args.trustLevel only, silently ignoring --trust per skill
  //   docs §10.2. Falls back to sprint state when all args.* absent.
  let trustLevel = normalizeTrustLevel(args);
  if (!args.trustLevel && !args.trust && !args.trustLevelAtStart) {
    trustLevel = (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || trustLevel;
  }
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
  // v2.1.18 (Issue #102, F3): normalize via normalizeTrustLevel — see handleMeasure for rationale.
  let trustLevel = normalizeTrustLevel(args);
  if (!args.trustLevel && !args.trust && !args.trustLevelAtStart) {
    trustLevel = (sprint.autoRun && sprint.autoRun.trustLevelAtStart) || trustLevel;
  }
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
};
