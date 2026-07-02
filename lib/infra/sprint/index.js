/**
 * index.js — Sprint Infrastructure Layer barrel + composite factory (v2.1.13 Sprint 3).
 *
 * Public surface for Sprint 4 Presentation. One `createSprintInfra({...})`
 * call returns a bag of adapters matching the Sprint 2 `deps` interface:
 *   { stateStore, eventEmitter, docScanner, matrixSync }
 *
 * Sprint 4 skill handler usage:
 *
 *   const infra = require('lib/infra/sprint').createSprintInfra({
 *     projectRoot: process.cwd(),
 *     otelEndpoint: process.env.OTEL_ENDPOINT,
 *     agentId: process.env.CLAUDE_AGENT_ID,
 *   });
 *   const lifecycle = require('lib/application/sprint-lifecycle');
 *   await lifecycle.startSprint(input, {
 *     stateStore: infra.stateStore,
 *     eventEmitter: infra.eventEmitter.emit,
 *   });
 *
 * Design Ref: docs/02-design/features/v2113-sprint-3-infrastructure.design.md §8
 *
 * @module lib/infra/sprint
 * @version 2.1.13
 * @since 2.1.13
 */

const paths = require('./sprint-paths');
const { createStateStore } = require('./sprint-state-store.adapter');
const { createEventEmitter } = require('./sprint-telemetry.adapter');
const { createDocScanner } = require('./sprint-doc-scanner.adapter');
const { createMatrixSync } = require('./matrix-sync.adapter');
// Sprint 5 production scaffolds — match Sprint 2 deps interface (gapDetector/autoFixer/dataFlowValidator)
const { createGapDetector } = require('./gap-detector.adapter');
const { createAutoFixer } = require('./auto-fixer.adapter');
const { createDataFlowValidator } = require('./data-flow-validator.adapter');

/**
 * @typedef {Object} SprintInfra
 * @property {import('./sprint-state-store.adapter').StateStore} stateStore
 * @property {import('./sprint-telemetry.adapter').EventEmitterAdapter} eventEmitter
 * @property {import('./sprint-doc-scanner.adapter').DocScanner} docScanner
 * @property {import('./matrix-sync.adapter').MatrixSync} matrixSync
 * @property {string} projectRoot - resolved root the adapters are bound to
 * @property {string|null} injectedProjectRoot - non-null only when the caller
 *   EXPLICITLY injected a root (v2.1.26 I-11/I-12 test isolation); handlers
 *   use it to redirect direct audit-logger writes. null = default runtime.
 */

/**
 * Compose the four Sprint Infrastructure adapters bound to one project root.
 *
 * @param {{ projectRoot: string, injectedProjectRoot?: string|null, otelEndpoint?: string, otelServiceName?: string, agentId?: string, parentAgentId?: string, bkitVersion?: string, clock?: () => string }} opts
 * @returns {SprintInfra}
 */
function createSprintInfra(opts) {
  if (!opts || typeof opts.projectRoot !== 'string' || opts.projectRoot.length === 0) {
    throw new TypeError('createSprintInfra: projectRoot must be a non-empty string');
  }
  const injectedProjectRoot =
    (typeof opts.injectedProjectRoot === 'string' && opts.injectedProjectRoot.length > 0)
      ? opts.injectedProjectRoot
      : null;
  return {
    stateStore: createStateStore(opts),
    eventEmitter: createEventEmitter(opts),
    docScanner: createDocScanner(opts),
    matrixSync: createMatrixSync(opts),
    // v2.1.26 (I-11/I-12): expose roots so Presentation handlers can thread
    // the injected root into cross-cutting writes (audit-logger, markers).
    projectRoot: opts.projectRoot,
    injectedProjectRoot,
  };
}

module.exports = {
  // Composite factory (most callers want this)
  createSprintInfra,
  // Individual factories — Sprint 3 baseline (4 adapters)
  createStateStore,
  createEventEmitter,
  createDocScanner,
  createMatrixSync,
  // Sprint 5 production scaffolds (3 adapters matching Sprint 2 deps interface)
  createGapDetector,
  createAutoFixer,
  createDataFlowValidator,
  // Path helpers (re-export sprint-paths.js)
  MATRIX_TYPES: paths.MATRIX_TYPES,
  getSprintStateDir: paths.getSprintStateDir,
  getSprintStateFile: paths.getSprintStateFile,
  getSprintIndexFile: paths.getSprintIndexFile,
  getSprintFeatureMapFile: paths.getSprintFeatureMapFile,
  getSprintMatrixDir: paths.getSprintMatrixDir,
  getSprintMatrixFile: paths.getSprintMatrixFile,
  getSprintPhaseDocAbsPath: paths.getSprintPhaseDocAbsPath,
};
