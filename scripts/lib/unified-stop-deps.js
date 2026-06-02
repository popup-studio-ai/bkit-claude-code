'use strict';
/**
 * unified-stop-deps.js — lazy module loaders for unified-stop.js.
 *
 * Extracted from scripts/unified-stop.js (v2.1.22 S3a ENH-346 god-file split).
 * Behavior-preserving: identical lazy-singleton getters; require paths rebased
 * one directory deeper (scripts/ → scripts/lib/, so `../lib/...` → `../../lib/...`).
 * Each getter swallows require errors (returns null) exactly as the original,
 * preserving the defensive optional-dependency contract.
 *
 * @module scripts/lib/unified-stop-deps
 */

let _stateMachine = null;
function getStateMachine() {
  if (!_stateMachine) try { _stateMachine = require('../../lib/pdca/state-machine'); } catch (_) {}
  return _stateMachine;
}

let _checkpointManager = null;
function getCheckpointManager() {
  if (!_checkpointManager) try { _checkpointManager = require('../../lib/control/checkpoint-manager'); } catch (_) {}
  return _checkpointManager;
}

let _auditLogger = null;
function getAuditLogger() {
  if (!_auditLogger) try { _auditLogger = require('../../lib/audit/audit-logger'); } catch (_) {}
  return _auditLogger;
}

let _gateManager = null;
function getGateManager() {
  if (!_gateManager) try { _gateManager = require('../../lib/quality/gate-manager'); } catch (_) {}
  return _gateManager;
}

let _metricsCollector = null;
function getMetricsCollector() {
  if (!_metricsCollector) try { _metricsCollector = require('../../lib/quality/metrics-collector'); } catch (_) {}
  return _metricsCollector;
}

let _workflowEngine = null;
function getWorkflowEngine() {
  if (!_workflowEngine) try { _workflowEngine = require('../../lib/pdca/workflow-engine'); } catch (_) {}
  return _workflowEngine;
}

let _circuitBreaker = null;
function getCircuitBreaker() {
  if (!_circuitBreaker) try { _circuitBreaker = require('../../lib/pdca/circuit-breaker'); } catch (_) {}
  return _circuitBreaker;
}

let _trustEngine = null;
function getTrustEngine() {
  if (!_trustEngine) try { _trustEngine = require('../../lib/control/trust-engine'); } catch (_) {}
  return _trustEngine;
}

let _explanationGenerator = null;
function getExplanationGenerator() {
  if (!_explanationGenerator) try { _explanationGenerator = require('../../lib/audit/explanation-generator'); } catch (_) {}
  return _explanationGenerator;
}

let _decisionTracer = null;
function getDecisionTracer() {
  if (!_decisionTracer) try { _decisionTracer = require('../../lib/audit/decision-tracer'); } catch (_) {}
  return _decisionTracer;
}

module.exports = {
  getStateMachine,
  getCheckpointManager,
  getAuditLogger,
  getGateManager,
  getMetricsCollector,
  getWorkflowEngine,
  getCircuitBreaker,
  getTrustEngine,
  getExplanationGenerator,
  getDecisionTracer,
};
