/**
 * CC Regression Event Recorder — Application Layer
 *
 * Records hook-level events to NDJSON log for attribution analysis and
 * MON-CC-* lifecycle observability.
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.3.2 + §5.1
 * Plan SC: G-W1 (hook attribution 확장 3곳 기반 Application 레이어)
 *
 * Safety:
 *   - fail-silent: 파일 쓰기 실패해도 hook 크래시 금지
 *   - NDJSON append-only: 동시 쓰기 안전
 *   - 30일 rotate: 파일 크기 통제
 *
 * @module lib/cc-regression/event-recorder
 *
 * @version 2.1.12
 */

const fs = require('fs');
const path = require('path');

const EVENT_LOG_RELATIVE = path.join('.bkit', 'runtime', 'cc-event-log.ndjson');
const ARCHIVE_DIR_RELATIVE = path.join('.bkit', 'runtime', 'archive');
const ROTATE_THRESHOLD_BYTES = 5 * 1024 * 1024; // 5 MB

function getProjectRoot() {
  return process.env.CLAUDE_PROJECT_DIR || process.cwd();
}

function getEventLogPath() {
  return path.join(getProjectRoot(), EVENT_LOG_RELATIVE);
}

/**
 * Record a CC-regression-attributable hook event.
 *
 * @param {object} event
 * @param {string} event.hookEvent  e.g. 'Stop', 'SessionEnd', 'SubagentStop'
 * @param {string} event.ccVersion  e.g. '2.1.117'
 * @param {string|null} event.sessionId
 * @param {string} event.timestamp  ISO 8601
 * @param {object} [event.context]  optional non-sensitive context
 * @returns {void}
 */
function recordEvent(event) {
  try {
    if (!event || typeof event !== 'object') return;
    if (!event.hookEvent || !event.ccVersion) return;

    const logPath = getEventLogPath();
    const dir = path.dirname(logPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Rotate if log exceeds threshold
    maybeRotate(logPath);

    const line = JSON.stringify({
      hookEvent: String(event.hookEvent),
      ccVersion: String(event.ccVersion),
      sessionId: event.sessionId || null,
      timestamp: event.timestamp || new Date().toISOString(),
      context: sanitizeContext(event.context),
    }) + '\n';

    fs.appendFileSync(logPath, line, 'utf8');
  } catch (_e) {
    // fail-silent — attribution 실패로 hook을 죽이지 않는다
  }
}

function sanitizeContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return undefined;
  const BLOCK = new Set([
    'text', 'content', 'prompt', 'message', 'api_key', 'token', 'password', 'secret',
  ]);
  const out = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (BLOCK.has(String(k).toLowerCase())) continue;
    if (typeof v === 'string' && v.length > 200) {
      out[k] = v.slice(0, 200) + '...<truncated>';
    } else if (typeof v === 'object' && v !== null) {
      // shallow 제한
      continue;
    } else {
      out[k] = v;
    }
  }
  return out;
}

function maybeRotate(logPath) {
  try {
    if (!fs.existsSync(logPath)) return;
    const st = fs.statSync(logPath);
    if (st.size < ROTATE_THRESHOLD_BYTES) return;

    const archiveDir = path.join(getProjectRoot(), ARCHIVE_DIR_RELATIVE);
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir, { recursive: true });
    }

    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    const archivePath = path.join(archiveDir, `cc-event-log-${ts}.ndjson`);
    fs.renameSync(logPath, archivePath);
  } catch (_e) { /* fail-silent */ }
}

/**
 * Read event log tail for debugging.
 * @param {number} [limit=20]
 * @returns {object[]}
 */
function readTail(limit = 20) {
  try {
    const logPath = getEventLogPath();
    if (!fs.existsSync(logPath)) return [];
    const lines = fs.readFileSync(logPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);
    const tail = lines.slice(-limit);
    return tail.map((l) => {
      try { return JSON.parse(l); } catch { return null; }
    }).filter(Boolean);
  } catch (_e) {
    return [];
  }
}

module.exports = { recordEvent, readTail, getEventLogPath };
