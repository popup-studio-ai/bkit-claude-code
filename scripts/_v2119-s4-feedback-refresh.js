#!/usr/bin/env node
'use strict';

/**
 * scripts/_v2119-s4-feedback-refresh.js — v2.1.19 S4 F4-2 CLI runner
 *
 * Manual refresh of external dogfooder feedback tracker. Queries GitHub API
 * via lib/control/external-feedback-tracker, persists JSON state, emits audit.
 *
 * Usage: node scripts/_v2119-s4-feedback-refresh.js [--window-days N] [--dry-run]
 */

const path = require('path');
const fs = require('fs');

const ROOT = process.cwd();
const tracker = require(path.join(ROOT, 'lib/control/external-feedback-tracker.js'));
let auditLogger;
try { auditLogger = require(path.join(ROOT, 'lib/audit/audit-logger.js')); }
catch (_) { auditLogger = { writeAuditLog: () => {} }; }

function parseArgs(argv) {
  const out = { windowDays: tracker.DEFAULT_WINDOW_DAYS, dryRun: false, owner: 'popup-studio-ai', repo: 'bkit-claude-code' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--window-days') {
      const n = parseInt(argv[++i], 10);
      if (Number.isFinite(n) && n > 0) out.windowDays = n;
    } else if (argv[i] === '--dry-run') {
      out.dryRun = true;
    } else if (argv[i] === '--owner') {
      out.owner = argv[++i];
    } else if (argv[i] === '--repo') {
      out.repo = argv[++i];
    }
  }
  return out;
}

(async () => {
  const args = parseArgs(process.argv.slice(2));
  const result = tracker.refresh({
    owner: args.owner,
    repo: args.repo,
    windowDays: args.windowDays,
  });

  if (args.dryRun) {
    console.log('--- DRY RUN — no file write, no audit emit ---');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  }

  const stateFile = path.join(ROOT, '.bkit/state/external-feedback-tracker.json');
  tracker.persistToFile(result, stateFile);

  auditLogger.writeAuditLog({
    actor: 'system',
    actorId: 's4-feedback-refresh',
    action: 'external_feedback_tracked',
    category: 'sprint',
    target: 'external-feedback-tracker',
    targetType: 'feature',
    details: {
      dogfooders: result.dogfooders,
      windowDays: result.windowDays,
      value: result.value,
      raw: result.raw && {
        closed: result.raw.closed,
        within24h: result.raw.within24h,
        openInWindow: result.raw.openInWindow,
      },
      apiErrors: result.warnings && result.warnings.length > 0 ? result.warnings : null,
      schemaVersion: result.schemaVersion,
    },
    result: 'success',
    destructiveOperation: false,
  });

  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
})().catch(err => {
  console.error('REFRESH_FAIL:', err && err.stack || err);
  process.exit(2);
});
