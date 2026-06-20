#!/usr/bin/env node
/**
 * Loop Breaker (FR-12)
 * Prevents infinite loops in PDCA automation using 4 detection rules.
 *
 * Rules LB-001 to LB-004 cover PDCA iteration loops, same-file edit loops,
 * agent recursion, and error retry loops.
 *
 * H3 fix (audit): each Claude Code hook fire is a SEPARATE node process, so the
 * previous "in-memory Map" counters reset to empty on every fire — LB-001..LB-004
 * could never accumulate across the separate hook invocations that characterize
 * real runaway loops (the guardrail was effectively disabled in production).
 * The 3 counters (LB-001 pdca iteration, LB-002 file edit, LB-004 error retry) are
 * now persisted to .bkit/runtime/loop-counters.json via the canonical state-store
 * (locked RMW so concurrent hook fires never lose an increment), with a per-entry
 * TTL window that restores the original "reset on session start" decay intent.
 *
 * LB-003 (agent recursion, A→B→A) is INTENTIONALLY left in-memory only: it detects
 * recursion depth WITHIN a single tool/agent call chain. There is no meaningful
 * "deeper in the recursion" across separate processes — persisting the stack would
 * invent a false cross-process history and trip false positives. The stack is
 * therefore process-local by design, not an oversight.
 *
 * @version 2.1.22
 * @module lib/control/loop-breaker
 */

/**
 * @typedef {Object} LoopCheckResult
 * @property {boolean} detected - Whether a loop was detected
 * @property {string|null} rule - Rule ID that triggered (e.g., 'LB-001')
 * @property {number} count - Current count for the triggering rule
 * @property {'warn'|'pause'|'abort'} action - Recommended action
 */

/**
 * Loop detection rule definitions
 * @type {Object<string, {name: string, maxCount: number, warnAt: number, action: 'warn'|'pause'|'abort'}>}
 */
const LOOP_RULES = {
  'LB-001': {
    name: 'PDCA iteration loop',
    description: 'check→act→check pattern repeating',
    maxCount: 5,
    warnAt: 3,
    action: 'abort'
  },
  'LB-002': {
    name: 'Same file edit loop',
    description: 'Same file modified repeatedly',
    maxCount: 10,
    warnAt: 7,
    action: 'pause'
  },
  'LB-003': {
    name: 'Agent recursion',
    description: 'A→B→A agent call pattern',
    maxCount: 3,
    warnAt: 2,
    action: 'abort'
  },
  'LB-004': {
    name: 'Error retry loop',
    description: 'Same error occurring repeatedly',
    maxCount: 3,
    warnAt: 2,
    action: 'pause'
  }
};

// ============================================================
// H3 fix (audit): cross-process persisted counters.
// ============================================================
// Each hook fire is a separate node process; module-level Maps do not survive
// across processes, so counters are persisted to .bkit/runtime/loop-counters.json
// via the canonical state-store. Entries carry an ISO timestamp and are pruned
// once they exceed TTL_WINDOW_MS — restoring the original "reset on session
// start" decay intent (a file edited 10x over 3 days must not trip LB-002).
const path = require('path');
const { lockedUpdate } = require('../core/state-store');

// Counter TTL window (mirrors a single working session). Entries older than this
// are pruned on load and dropped before the threshold check fires — so a stale
// counter from a prior session can't trip a false-positive loop alarm.
const TTL_WINDOW_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Resolve the persisted-counter file path under the active project's .bkit/runtime.
 * Falls back to process.cwd() when the platform module is unavailable.
 * @returns {string}
 */
function _counterFilePath() {
  let root = process.cwd();
  try { root = require('../core/platform').PROJECT_DIR || root; } catch (_) { /* graceful */ }
  return path.join(root, '.bkit', 'runtime', 'loop-counters.json');
}

/**
 * Increment a persisted counter key within a counter bucket, pruning entries
 * older than TTL_WINDOW_MS before returning the post-increment count.
 *
 * @param {'pdcaIterations'|'fileEditCounts'|'errorCounts'} bucket - Counter bucket
 * @param {string} key - Target key (feature / file path / error signature)
 * @returns {number} New count for `key` after increment + prune
 */
function _incrementPersistedCounter(bucket, key) {
  const file = _counterFilePath();
  const now = Date.now();
  const cutoff = now - TTL_WINDOW_MS;
  const count = lockedUpdate(file, (raw) => {
    const next = raw && typeof raw === 'object' ? raw : {};
    const map = next[bucket] && typeof next[bucket] === 'object' ? next[bucket] : {};
    // Prune stale entries across all buckets while we hold the lock.
    for (const b of Object.keys(next)) {
      const bucketMap = next[b];
      if (bucketMap && typeof bucketMap === 'object' && b !== 'agentCallStack') {
        for (const [k, v] of Object.entries(bucketMap)) {
          const ts = (v && typeof v === 'object' && typeof v.ts === 'number') ? v.ts : now;
          if (ts < cutoff) delete bucketMap[k];
        }
      }
    }
    const existing = map[key] && typeof map[key] === 'object' ? map[key] : { count: 0 };
    const newCount = (typeof existing.count === 'number' ? existing.count : 0) + 1;
    map[key] = { count: newCount, ts: now };
    next[bucket] = map;
    return next;
  });
  const entry = count && count[bucket] && count[bucket][key];
  return entry && typeof entry.count === 'number' ? entry.count : 1;
}

/**
 * Read a persisted counter bucket into a Map<string, number>, pruning stale
 * entries. Used by checkLoop/getCounters/reset so all read paths see the same
 * post-TTL-prune view as the increment path.
 * @param {'pdcaIterations'|'fileEditCounts'|'errorCounts'} bucket
 * @returns {Map<string, number>}
 */
function _readPersistedBucket(bucket) {
  const file = _counterFilePath();
  const cutoff = Date.now() - TTL_WINDOW_MS;
  let raw = null;
  try { raw = lockedUpdate(file, (s) => s); /* read under lock */ } catch (_) { /* missing file */ }
  if (!raw || typeof raw !== 'object') return new Map();
  const map = raw[bucket] && typeof raw[bucket] === 'object' ? raw[bucket] : {};
  const result = new Map();
  for (const [k, v] of Object.entries(map)) {
    const ts = (v && typeof v === 'object' && typeof v.ts === 'number') ? v.ts : Date.now();
    if (ts >= cutoff) {
      const c = (v && typeof v === 'object' && typeof v.count === 'number') ? v.count : 0;
      result.set(k, c);
    }
  }
  return result;
}

// In-memory counters
// H3: the three counters below are MIRRORS of the persisted buckets, hydrated on
// first read via the persisted helpers. They are kept for getCounters()/reset()
// compatibility and for the LB-003 stack (which is intentionally process-local).
/** @type {Map<string, number>} PDCA iteration counter per feature (persisted, H3) */
const pdcaIterations = new Map();

/** @type {Map<string, number>} File edit counter per file path (persisted, H3) */
const fileEditCounts = new Map();

/** @type {string[]} Agent call stack for recursion detection (process-local by design, H3) */
const agentCallStack = [];

/** @type {Map<string, number>} Error counter per error signature (persisted, H3) */
const errorCounts = new Map();

/**
 * Record an action for loop detection tracking
 * @param {'pdca_iteration'|'file_edit'|'agent_call'|'error'} actionType - Type of action
 * @param {string} target - Target identifier (feature name, file path, agent name, or error message)
 */
function recordAction(actionType, target) {
  if (!target || typeof target !== 'string') return;

  switch (actionType) {
    case 'pdca_iteration': {
      // H3: persist across processes so LB-001 can reach maxCount across the
      // separate hook fires that make up a real runaway PDCA iteration loop.
      const next = _incrementPersistedCounter('pdcaIterations', target);
      pdcaIterations.set(target, next);
      break;
    }
    case 'file_edit': {
      const next = _incrementPersistedCounter('fileEditCounts', target);
      fileEditCounts.set(target, next);
      break;
    }
    case 'agent_call': {
      agentCallStack.push(target);
      // Keep stack bounded
      if (agentCallStack.length > 100) {
        agentCallStack.splice(0, agentCallStack.length - 50);
      }
      break;
    }
    case 'error': {
      // Normalize error signature (first 200 chars)
      const signature = target.substring(0, 200);
      const next = _incrementPersistedCounter('errorCounts', signature);
      errorCounts.set(signature, next);
      break;
    }
  }
}

/**
 * Check all loop rules against current counters
 * @returns {LoopCheckResult}
 */
function checkLoop() {
  // H3: read the persisted (TTL-pruned) buckets so detection observes counts
  // accumulated across separate hook processes, not just this process's mirror.
  const pdca = _readPersistedBucket('pdcaIterations');
  const edits = _readPersistedBucket('fileEditCounts');
  const errs = _readPersistedBucket('errorCounts');

  // LB-001: PDCA iteration loop (key elided: only count is threshold-checked)
  for (const [, count] of pdca) {
    if (count >= LOOP_RULES['LB-001'].maxCount) {
      return { detected: true, rule: 'LB-001', count, action: 'abort' };
    }
    if (count >= LOOP_RULES['LB-001'].warnAt) {
      return { detected: true, rule: 'LB-001', count, action: 'warn' };
    }
  }

  // LB-002: Same file edit loop (key elided: only count is threshold-checked)
  for (const [, count] of edits) {
    if (count >= LOOP_RULES['LB-002'].maxCount) {
      return { detected: true, rule: 'LB-002', count, action: 'pause' };
    }
    if (count >= LOOP_RULES['LB-002'].warnAt) {
      return { detected: true, rule: 'LB-002', count, action: 'warn' };
    }
  }

  // LB-003: Agent recursion (A→B→A pattern)
  if (agentCallStack.length >= 3) {
    const len = agentCallStack.length;
    // Check for A→B→A pattern in the most recent calls
    for (let i = len - 1; i >= 2; i--) {
      if (agentCallStack[i] === agentCallStack[i - 2] && agentCallStack[i] !== agentCallStack[i - 1]) {
        // Count consecutive A→B→A occurrences
        let recursionCount = 1;
        for (let j = i - 2; j >= 2; j -= 2) {
          if (agentCallStack[j] === agentCallStack[i] && agentCallStack[j + 1] === agentCallStack[i - 1]) {
            recursionCount++;
          } else {
            break;
          }
        }
        if (recursionCount >= LOOP_RULES['LB-003'].maxCount) {
          return { detected: true, rule: 'LB-003', count: recursionCount, action: 'abort' };
        }
        if (recursionCount >= LOOP_RULES['LB-003'].warnAt) {
          return { detected: true, rule: 'LB-003', count: recursionCount, action: 'warn' };
        }
      }
    }
  }

  // LB-004: Error retry loop (key elided: only count is threshold-checked)
  for (const [, count] of errs) {
    if (count >= LOOP_RULES['LB-004'].maxCount) {
      return { detected: true, rule: 'LB-004', count, action: 'pause' };
    }
    if (count >= LOOP_RULES['LB-004'].warnAt) {
      return { detected: true, rule: 'LB-004', count, action: 'warn' };
    }
  }

  return { detected: false, rule: null, count: 0, action: 'warn' };
}

/**
 * Reset loop detection counters
 * @param {'all'|'feature'|'session'} scope - Scope of reset
 * @param {string} [target] - Target identifier (required for 'feature' scope)
 */
function reset(scope, target) {
  switch (scope) {
    case 'all':
    case 'session':
      // H3: clear the persisted buckets AND the local mirrors so a session
      // reset actually zeroes the cross-process counters.
      try {
        lockedUpdate(_counterFilePath(), (raw) => {
          const next = raw && typeof raw === 'object' ? raw : {};
          delete next.pdcaIterations;
          delete next.fileEditCounts;
          delete next.errorCounts;
          // agentCallStack stays process-local (H3) — untouched here.
          return next;
        });
      } catch (_) { /* no persisted state to clear — graceful */ }
      pdcaIterations.clear();
      fileEditCounts.clear();
      agentCallStack.length = 0;
      errorCounts.clear();
      break;
    case 'feature':
      if (target) {
        pdcaIterations.delete(target);
      }
      break;
  }
}

/**
 * Get current counter state for debugging/monitoring
 * @returns {Object}
 */
function getCounters() {
  // H3: report the persisted (TTL-pruned) buckets for LB-001/002/004 so
  // monitoring observes cross-process accumulation; LB-003 stays process-local.
  return {
    pdcaIterations: Object.fromEntries(_readPersistedBucket('pdcaIterations')),
    fileEditCounts: Object.fromEntries(_readPersistedBucket('fileEditCounts')),
    agentCallStack: [...agentCallStack],
    errorCounts: Object.fromEntries(_readPersistedBucket('errorCounts'))
  };
}

/**
 * Reset a specific counter for a rule/target combination
 * @param {string} ruleId - Rule ID (e.g., 'LB-001')
 * @param {string} [key] - Target key to reset
 */
function resetCounter(ruleId, key) {
  // H3: clear persisted buckets so reset takes effect across processes.
  const _bucketFor = (id) => ({ 'LB-001': 'pdcaIterations', 'LB-002': 'fileEditCounts', 'LB-004': 'errorCounts' }[id]);
  const bucket = _bucketFor(ruleId);
  if (bucket) {
    try {
      lockedUpdate(_counterFilePath(), (raw) => {
        const next = raw && typeof raw === 'object' ? raw : {};
        if (key) {
          if (next[bucket] && typeof next[bucket] === 'object') delete next[bucket][key];
        } else {
          delete next[bucket];
        }
        return next;
      });
    } catch (_) { /* no persisted state — graceful */ }
  }
  switch (ruleId) {
    case 'LB-001': key ? pdcaIterations.delete(key) : pdcaIterations.clear(); break;
    case 'LB-002': key ? fileEditCounts.delete(key) : fileEditCounts.clear(); break;
    case 'LB-003': agentCallStack.length = 0; break; // process-local by design (H3)
    case 'LB-004': key ? errorCounts.delete(key) : errorCounts.clear(); break;
  }
}

/**
 * Reset all counters for a specific rule
 * @param {string} ruleId - Rule ID to reset
 */
function resetRule(ruleId) {
  resetCounter(ruleId);
}

/**
 * Override the threshold for a specific rule at runtime
 * @param {string} ruleId - Rule ID
 * @param {number} newThreshold - New threshold value
 * @returns {boolean} True if rule was found and updated
 */
function setThreshold(ruleId, newThreshold) {
  // v2.1.8 fix B1 (Q1 rework): LOOP_RULES is an object (direct key access) AND rules
  // store thresholds under `maxCount` / `warnAt` keys (not `threshold`). Writing to
  // `rule.threshold` was a dead write — checkLoop reads `rule.maxCount` / `rule.warnAt`.
  // This rework writes to `maxCount` and scales `warnAt` proportionally if present.
  const rule = LOOP_RULES[ruleId];
  if (!rule) throw new Error(`Unknown loop rule: ${ruleId}`);
  if (typeof newThreshold !== 'number' || newThreshold <= 0) return false;
  // Preserve warnAt:maxCount ratio when both exist (e.g. warn at 60%).
  if (typeof rule.maxCount === 'number' && rule.maxCount > 0 && typeof rule.warnAt === 'number') {
    const ratio = rule.warnAt / rule.maxCount;
    rule.warnAt = Math.max(1, Math.round(newThreshold * ratio));
  }
  rule.maxCount = newThreshold;
  return true;
}

module.exports = {
  recordAction,
  checkLoop,
  reset,
  getCounters,
  resetCounter,
  resetRule,
  setThreshold,
  LOOP_RULES
};
