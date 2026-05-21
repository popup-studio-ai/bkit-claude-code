'use strict';

/**
 * lib/application/sprint-lifecycle/resolve-gate-fail.js — v2.1.19 S3 F3-1 (closes #103)
 *
 * Resolve a prior gate_fail when advancePhase succeeds. Applies BOTH:
 *   (A) File header prepend on sprint.lastGateFailure.reportPath
 *   (C) State field update — lastGateFailure.resolvedAt / resolvedBy / resolutionReason
 *
 * Idempotent: second call detects existing resolvedAt and emits no-op.
 *
 * pruge Issue ref: #103 (failure-reporter mark/move resolved gate-fail reports)
 * ADR ref: docs/02-design/features/s3-polish.design.md ADR S3-002 (A+C combined)
 */

const path = require('path');
const fs = require('fs');

const RESOLVED_HEADER_MARKER = '> **STATUS: RESOLVED**';

/**
 * Resolve a gate failure on successful subsequent transition.
 *
 * @param {object} sprint - sprint state with lastGateFailure populated
 * @param {object} [opts] - { resolvedBy?: string, reason?: string, fileWriter?: function, fileReader?: function, projectRoot?: string }
 * @returns {Promise<{
 *   resolved: boolean,
 *   resolvedAt: string|null,
 *   resolvedBy: string|null,
 *   resolutionReason: string|null,
 *   prependedHeader: boolean,
 *   reportPath: string|null,
 *   noop: boolean
 * }>}
 */
async function resolveOnSuccess(sprint, opts = {}) {
  // Pre-conditions
  if (!sprint || !sprint.lastGateFailure) {
    return { resolved: false, resolvedAt: null, resolvedBy: null, resolutionReason: null, prependedHeader: false, reportPath: null, noop: true };
  }
  if (sprint.lastGateFailure.resolvedAt) {
    // Idempotent — already resolved
    return {
      resolved: true,
      resolvedAt: sprint.lastGateFailure.resolvedAt,
      resolvedBy: sprint.lastGateFailure.resolvedBy || null,
      resolutionReason: sprint.lastGateFailure.resolutionReason || null,
      prependedHeader: false,
      reportPath: sprint.lastGateFailure.reportPath || null,
      noop: true,
    };
  }

  const resolvedAt = new Date().toISOString();
  const resolvedBy = opts.resolvedBy || 'auto';
  const resolutionReason = opts.reason || 'advancePhase succeeded';
  const reportPath = sprint.lastGateFailure.reportPath || null;

  // (C) State field update — caller is responsible for persisting via stateStore
  sprint.lastGateFailure.resolvedAt = resolvedAt;
  sprint.lastGateFailure.resolvedBy = resolvedBy;
  sprint.lastGateFailure.resolutionReason = resolutionReason;

  // (A) File header prepend (best-effort — never blocks resolution)
  let prependedHeader = false;
  if (reportPath) {
    const projectRoot = opts.projectRoot || process.cwd();
    const fullPath = path.resolve(projectRoot, reportPath);
    const reader = opts.fileReader || makeDefaultFileReader();
    const writer = opts.fileWriter || makeDefaultFileWriter();
    try {
      if (await reader.exists(fullPath)) {
        const content = await reader.read(fullPath);
        if (!content.startsWith(RESOLVED_HEADER_MARKER)) {
          const header = [
            `${RESOLVED_HEADER_MARKER} at ${resolvedAt}`,
            `> resolvedBy: ${resolvedBy}`,
            `> resolutionReason: ${resolutionReason}`,
            '',
            '',
          ].join('\n');
          await writer.write(fullPath, header + content);
          prependedHeader = true;
        }
      }
    } catch (_) {
      // best-effort — state field still updated, file mutation skipped
      prependedHeader = false;
    }
  }

  return {
    resolved: true,
    resolvedAt,
    resolvedBy,
    resolutionReason,
    prependedHeader,
    reportPath,
    noop: false,
  };
}

function makeDefaultFileReader() {
  return {
    async exists(absPath) {
      try { return fs.existsSync(absPath); } catch (_) { return false; }
    },
    async read(absPath) {
      try { return fs.readFileSync(absPath, 'utf8'); } catch (_) { return ''; }
    },
  };
}

function makeDefaultFileWriter() {
  return {
    async write(absPath, content) {
      // Atomic write: tempfile + rename
      const tmpPath = `${absPath}.tmp-${Date.now()}-${process.pid}`;
      fs.writeFileSync(tmpPath, content);
      fs.renameSync(tmpPath, absPath);
    },
  };
}

module.exports = {
  RESOLVED_HEADER_MARKER,
  resolveOnSuccess,
};
