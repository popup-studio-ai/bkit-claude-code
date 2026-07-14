/**
 * StateStore - Atomic File I/O with Optional Locking
 * @module lib/core/state-store
 * @version 2.1.10
 *
 * Provides atomic JSON state persistence using tmp+rename pattern
 * and optional file-based locking for concurrent access scenarios.
 *
 * Reference: lib/team/state-writer.js (atomic write pattern)
 * Design: docs/02-design/features/bkit-v200-area4-architecture.design.md Section 3
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  LOCK_TIMEOUT_MS,
  LOCK_STALE_MS,
  LOCK_MAX_RETRIES,
  LOCK_RETRY_INTERVAL_MS,
} = require('./constants');

// ============================================================
// Basic State Operations (Atomic Write, No Lock)
// ============================================================

/**
 * Read JSON state from file
 * @param {string} filePath - Absolute file path
 * @returns {Object|null} Parsed JSON object, or null if file missing/corrupt
 */
function read(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Write JSON state atomically using tmp+rename pattern.
 * Creates parent directories if they do not exist.
 *
 * @param {string} filePath - Absolute file path
 * @param {Object} data - Data to serialize as JSON
 * @throws {Error} If atomic write fails
 */
function write(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const tmpPath = filePath + '.tmp.' + process.pid;
  try {
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
    fs.renameSync(tmpPath, filePath);
  } catch (e) {
    // Clean up tmp file on failure
    try { fs.unlinkSync(tmpPath); } catch (_) { /* ignore */ }
    throw e;
  }
}

/**
 * Check if a state file exists
 * @param {string} filePath - Absolute file path
 * @returns {boolean}
 */
function exists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Remove a state file (no error if missing)
 * @param {string} filePath - Absolute file path
 */
function remove(filePath) {
  try { fs.unlinkSync(filePath); } catch (_) { /* ignore */ }
}

/**
 * Append a single JSON line to a JSONL file.
 * Creates the file and parent directories if they do not exist.
 *
 * @param {string} filePath - Absolute file path (.jsonl)
 * @param {Object} line - Object to append as a single JSON line
 */
function appendJsonl(filePath, line) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.appendFileSync(filePath, JSON.stringify(line) + '\n');
}

// ============================================================
// File Locking (for concurrent access in Team mode)
// ============================================================

/**
 * Synchronous sleep without burning CPU.
 *
 * Issue #139: lock() previously backed off with a busy-wait spin
 * (`while (Date.now() < waitUntil) {}`) that pinned a CPU core for the entire
 * retry interval. Atomics.wait blocks the thread for up to `ms` milliseconds
 * with no CPU cost, is fully synchronous (safe inside hook scripts), and needs
 * no native dependency (Node >= 8.10). A fresh, never-notified Int32Array means
 * the wait always runs to its timeout.
 *
 * @param {number} ms - Milliseconds to sleep (values <= 0 are a no-op)
 */
function sleepSync(ms) {
  if (!(ms > 0)) return;
  try {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
  } catch (_) {
    // SharedArrayBuffer unavailable (extremely old/locked-down runtime):
    // fall back to a bounded busy-wait so behavior degrades gracefully.
    const until = Date.now() + ms;
    while (Date.now() < until) { /* spin (fallback only) */ }
  }
}

/**
 * Acquire an exclusive file lock using O_EXCL atomic file creation.
 * Detects and removes stale locks from dead processes.
 *
 * @param {string} filePath - File to lock (lock file = filePath + '.lock')
 * @param {number} [timeoutMs=LOCK_TIMEOUT_MS] - Maximum wait time in ms
 * @returns {string} Lock file path (for reference)
 * @throws {Error} If lock cannot be acquired within timeout
 */
function lock(filePath, timeoutMs) {
  const timeout = timeoutMs != null ? timeoutMs : LOCK_TIMEOUT_MS;
  const lockPath = filePath + '.lock';
  const lockData = JSON.stringify({
    pid: process.pid,
    timestamp: Date.now(),
    hostname: os.hostname(),
  });

  const startTime = Date.now();
  let retries = 0;

  while (retries < LOCK_MAX_RETRIES) {
    try {
      // O_EXCL: fails atomically if file already exists
      fs.writeFileSync(lockPath, lockData, { flag: 'wx' });
      return lockPath;
    } catch (e) {
      if (e.code !== 'EEXIST') {
        throw e;
      }

      // Lock file exists — check if stale
      let existingPid = null;
      try {
        const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        existingPid = existing.pid;

        if (Date.now() - existing.timestamp > LOCK_STALE_MS) {
          // Stale lock — remove and retry immediately
          try { fs.unlinkSync(lockPath); } catch (_) { /* ignore */ }
          continue;
        }
      } catch (_) {
        // Corrupt lock file — remove and retry
        try { fs.unlinkSync(lockPath); } catch (__) { /* ignore */ }
        continue;
      }

      // Active lock — check timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(
          `Lock timeout after ${timeout}ms: ${filePath} (held by PID ${existingPid})`
        );
      }

      // Synchronous backoff without burning CPU (Issue #139). Was a busy-wait
      // spin; Atomics.wait sleeps the thread for the retry interval instead.
      sleepSync(LOCK_RETRY_INTERVAL_MS);
      retries++;
    }
  }

  throw new Error(`Lock failed after ${LOCK_MAX_RETRIES} retries: ${filePath}`);
}

/**
 * Release a file lock
 * @param {string} filePath - Original file path (not the .lock path)
 */
function unlock(filePath) {
  const lockPath = filePath + '.lock';
  try { fs.unlinkSync(lockPath); } catch (_) { /* ignore */ }
}

/**
 * Perform a locked read-modify-write operation.
 * Acquires lock, reads current data, applies modifier function,
 * writes result atomically, then releases lock.
 *
 * @param {string} filePath - Absolute file path
 * @param {function(Object|null): Object} modifier - Receives current data (or null), returns updated data
 * @param {number} [timeoutMs] - Lock timeout in ms (default: LOCK_TIMEOUT_MS)
 * @returns {Object} The modified data that was written
 */
function lockedUpdate(filePath, modifier, timeoutMs) {
  lock(filePath, timeoutMs);
  try {
    const current = read(filePath);
    const modified = modifier(current);
    write(filePath, modified);
    return modified;
  } finally {
    unlock(filePath);
  }
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  // Basic state operations (atomic write, no lock)
  read,
  write,
  exists,
  remove,
  appendJsonl,

  // Locked state operations (atomic write + file lock)
  lock,
  unlock,
  lockedUpdate,

  // Utilities
  sleepSync,
};
