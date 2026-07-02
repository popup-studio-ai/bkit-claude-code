'use strict';
/**
 * sprint-handlers-admin — sprint action handlers extracted from scripts/sprint-handler.js
 * (v2.1.22 S3a ENH-343). Handlers are mutually independent (no handler calls
 * another) and receive infra/deps as params. Shared helpers/consts imported
 * from ./sprint-handler-shared. Require paths rebased (../lib → ../../lib).
 * @module scripts/lib/sprint-handlers-admin
 */

const {
  createSprintInfra,
  createGapDetector,
  createAutoFixer,
  createDataFlowValidator,
} = require('../../lib/infra/sprint');
const lifecycle = require('../../lib/application/sprint-lifecycle');
const domain = require('../../lib/domain/sprint');

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
  identifyCarryItems,
  runPhaseGates,
  persistAndAudit,
  parseFeaturesFlag,
  VALID_TRUST_LEVELS,
  DEFAULT_TRUST_LEVEL,
  LEVEL_RANK,
} = require('./sprint-handler-shared');

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
  const audit = require('../../lib/audit/audit-logger');

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
      }, { projectRoot: infra && infra.injectedProjectRoot }); // v2.1.26 I-12
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
    }, { projectRoot: infra && infra.injectedProjectRoot }); // v2.1.26 I-12
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
    require('../../lib/audit/audit-logger').writeAuditLog({
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
    }, { projectRoot: infra && infra.injectedProjectRoot }); // v2.1.26 I-12
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
    require('../../lib/audit/audit-logger').writeAuditLog({
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
    }, { projectRoot: infra && infra.injectedProjectRoot }); // v2.1.26 I-12
  } catch (_) { /* audit failures must NOT block annotate */ }

  return {
    ok: true,
    sprintId: args.id,
    annotation: entry,
    totalAnnotations: sprint.annotations.length,
    phase: sprint.phase, // preserved — forward-only invariant
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
  // Slice 2 (Cluster F-gates) follow-up: forward the M5 exemption signal so
  // the qa-monitor route returns not_applicable (passed) for library/static-site
  // sprints with no runtime logs. `args.logSourceAvailable` is the CLI flag
  // (--no-logs); `deps.logSourceAvailable` is the programmatic injection path.
  const logSourceAvailable = (typeof args.logSourceAvailable === 'boolean')
    ? args.logSourceAvailable
    : deps.logSourceAvailable;
  const ucDeps = {
    agentTaskRunner: deps.agentTaskRunner,
    trustLevel,
    source,
    logSourceAvailable,
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
  const lifecycle = require('../../lib/application/sprint-lifecycle');
  const d = deps || {};
  // v2.1.26 (I-12, test isolation): when a project root was explicitly
  // injected (args.projectRoot or infra.injectedProjectRoot) and no custom
  // auditLogger was supplied, bind the default audit-logger to that root so
  // master_plan_created never lands in the developer's real .bkit/audit.
  // No injection → auditLogger stays undefined → use case falls back to the
  // default module (current runtime behavior, unchanged).
  let boundAuditLogger = d.auditLogger;
  if (!boundAuditLogger) {
    const injectedRoot = (infra && infra.injectedProjectRoot) ||
      ((typeof args.projectRoot === 'string' && args.projectRoot.length > 0) ? args.projectRoot : null);
    if (injectedRoot) {
      try {
        const audit = require('../../lib/audit/audit-logger');
        boundAuditLogger = {
          writeAuditLog: function (entry) {
            return audit.writeAuditLog(entry, { projectRoot: injectedRoot });
          },
        };
      } catch (_e) { boundAuditLogger = d.auditLogger; }
    }
  }
  const usecaseDeps = {
    agentSpawner: d.agentSpawner,
    fileWriter: d.fileWriter,
    fileDeleter: d.fileDeleter,
    auditLogger: boundAuditLogger,
    taskCreator: d.taskCreator,
  };
  return lifecycle.generateMasterPlan(input, usecaseDeps);
}


module.exports = {
  handleTrust,
  handleDogfood,
  handleAnnotate,
  handleHelp,
  handleMeasure,
  handleMasterPlan,
};
