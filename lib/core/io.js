/**
 * I/O Utilities
 * @module lib/core/io
 * @version 2.1.10
 *
 * Claude Code 전용 플러그인으로 단순화 (v1.5.0). Tag synced to 2.0.0 per ENH-263 (2026-04-21).
 */

const fs = require('fs');
const { STDIN_READ_TIMEOUT_MS } = require('./constants');

// Lazy require to avoid a circular dependency (debug.js -> platform.js is a
// separate chain; io.js -> debug.js is one-way). Needed so H5 can surface
// stdin parse failures via debugLog instead of swallowing them silently.
let _debug = null;
function getDebug() {
  if (!_debug) {
    _debug = require('./debug');
  }
  return _debug;
}

const MAX_CONTEXT_LENGTH = 500;

// Read buffer size for the incremental stdin reader (64 KiB — hook payloads are
// far smaller, but a generous chunk keeps large/multi-chunk payloads to one or
// two reads).
const STDIN_CHUNK_SIZE = 65536;

/**
 * 컨텍스트 문자열 자르기
 * @param {string} context
 * @param {number} [maxLength=MAX_CONTEXT_LENGTH]
 * @returns {string}
 */
function truncateContext(context, maxLength = MAX_CONTEXT_LENGTH) {
  if (!context || context.length <= maxLength) return context || '';
  return context.slice(0, maxLength) + '... (truncated)';
}

/**
 * stdin에서 JSON 동기적 읽기 (유계 parse-early 리더)
 *
 * Issue #139: the previous `fs.readFileSync(0, 'utf8')` blocks until stdin EOF
 * with NO timeout. A hook therefore stalls for as long as Claude Code keeps the
 * stdin write-end open (observed up to ~15.5 min, far past the hook's own 10 s
 * timeout). This reader reads fd 0 incrementally and returns the instant the
 * accumulated buffer holds a complete JSON value — it never waits for EOF, which
 * is precisely the source of the stall. Used by every bkit hook script, so the
 * fix is central: all hook events are protected, not just Stop.
 *
 * The raw-fd `fs.readSync` path creates no libuv stream handle, so the process
 * exits promptly after this returns even when the pipe is still held open.
 *
 * H5 fix (audit) preserved: a malformed/truncated JSON-RPC envelope used to be
 * indistinguishable from a valid empty object (silently returned {}). Every
 * parse failure is recorded via debugLog, and BKIT_STRICT_STDIN=1 rethrows so a
 * debugging session sees the real error instead of a fabricated empty input.
 *
 * Residual (accepted): the deadline is best-effort — it is only checked between
 * blocking `readSync` calls, so a truly empty-but-held-open pipe can still block
 * inside a single read until EOF. Callers that must be hard-bounded even then
 * (the turn-gating Stop hook) use `readStdinBounded` instead.
 *
 * @returns {*}
 */
function readStdinSync() {
  const deadline = Date.now() + STDIN_READ_TIMEOUT_MS;
  const tmp = Buffer.alloc(STDIN_CHUNK_SIZE);
  let buf = Buffer.alloc(0);
  try {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      // parse-early: return as soon as the buffer holds a complete JSON value.
      if (buf.length > 0) {
        try {
          return JSON.parse(buf.toString('utf8'));
        } catch (_) {
          /* incomplete — read more */
        }
      }
      if (Date.now() > deadline) break; // best-effort bound between reads
      let n = 0;
      try {
        n = fs.readSync(0, tmp, 0, STDIN_CHUNK_SIZE, null);
      } catch (e) {
        if (e.code === 'EAGAIN') continue; // non-blocking fd, no data yet
        if (e.code === 'EOF') { n = 0; } // some platforms surface EOF as a throw
        else throw e;
      }
      if (n === 0) break; // real EOF
      buf = Buffer.concat([buf, tmp.slice(0, n)]);
    }
    return JSON.parse(buf.toString('utf8')); // final attempt (empty → throws → {})
  } catch (e) {
    getDebug().debugLog('io', 'readStdinSync parse failure', {
      error: e && e.message,
      strict: process.env.BKIT_STRICT_STDIN === '1',
    });
    if (process.env.BKIT_STRICT_STDIN === '1') {
      throw e; /* surface the real error in strict/debug mode */
    }
    return {};
  }
}

/**
 * stdin에서 JSON 읽기 — parse-early + hard timeout으로 완전 유계화 (Issue #139).
 *
 * The async, event-based counterpart to readStdinSync for hooks that MUST never
 * exceed a wall-clock budget even when stdin carries no data / a truncated
 * payload while the pipe is held open (cases the sync reader cannot hard-bound,
 * because its deadline can only be checked between blocking `readSync` calls).
 *
 * Two guarantees:
 *  1. parse-early — resolves the instant the accumulated data is valid JSON,
 *     without waiting for EOF.
 *  2. hard timeout — a `setTimeout` resolves with the best available value once
 *     `timeoutMs` elapses, so the read can never block longer than that.
 *
 * Critically, it destroys `process.stdin` on resolve. Without that, the open
 * stdin handle keeps the event loop alive until EOF and the PROCESS lingers even
 * though the payload was already parsed — reintroducing the very stall we fix.
 *
 * @param {number} [timeoutMs=STDIN_READ_TIMEOUT_MS] - Hard wall-clock budget (ms)
 * @returns {Promise<*>} Parsed payload, or {} on timeout/parse-failure
 */
function readStdinBounded(timeoutMs) {
  const budget = (typeof timeoutMs === 'number' && timeoutMs > 0)
    ? timeoutMs
    : STDIN_READ_TIMEOUT_MS;
  return new Promise((resolve) => {
    let data = '';
    let done = false;
    let timer = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      try { process.stdin.pause(); } catch (_) { /* ignore */ }
      process.stdin.removeAllListeners('data');
      process.stdin.removeAllListeners('end');
      process.stdin.removeAllListeners('error');
      // Release the stdin handle so the event loop can drain and the process
      // can exit promptly even if CC keeps the write-end open.
      try { process.stdin.destroy(); } catch (_) { /* ignore */ }
    };

    const finish = (value) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(value);
    };

    const parseOrEmpty = () => {
      try {
        return JSON.parse(data);
      } catch (e) {
        getDebug().debugLog('io', 'readStdinBounded parse failure', {
          error: e && e.message,
          bytes: data.length,
        });
        return {};
      }
    };

    timer = setTimeout(() => {
      getDebug().debugLog('io', 'readStdinBounded hard timeout', {
        timeoutMs: budget,
        bytes: data.length,
      });
      finish(parseOrEmpty());
    }, budget);
    if (timer.unref) timer.unref();

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      data += chunk;
      // parse-early: resolve the moment we hold a complete JSON value.
      try {
        const parsed = JSON.parse(data);
        finish(parsed);
      } catch (_) {
        /* incomplete — keep reading */
      }
    });
    process.stdin.on('end', () => finish(parseOrEmpty()));
    process.stdin.on('error', () => finish({}));
  });
}

/**
 * stdin에서 JSON 비동기 읽기
 *
 * Mirrors the H5 fix: parse failures are debugLogged (and rethrown under
 * BKIT_STRICT_STDIN) rather than silently resolved to {}.
 *
 * @returns {Promise<*>}
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        getDebug().debugLog('io', 'readStdin parse failure', {
          error: e && e.message,
          strict: process.env.BKIT_STRICT_STDIN === '1',
        });
        if (process.env.BKIT_STRICT_STDIN === '1') {
          reject(e); /* surface the real error in strict/debug mode */
          return;
        }
        resolve({});
      }
    });
  });
}

/**
 * Hook 입력 파싱
 *
 * H4 fix (audit): absent fields now return null (not '') so callers can
 * distinguish "no value supplied" from "empty string". Returning '' for
 * absent values caused empty-vs-null branch bugs (e.g. treating "no feature"
 * as "feature named ''"). Callers branching on a field's presence should use
 * `value == null` rather than `value === ''`.
 *
 * @param {*} input
 * @returns {{toolName: ?string, filePath: ?string, content: ?string, command: ?string, oldString: ?string}}
 */
function parseHookInput(input) {
  const pick = (...vals) => {
    for (const v of vals) {
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return null;
  };
  return {
    toolName: pick(input?.tool_name, input?.toolName),
    filePath: pick(input?.tool_input?.file_path, input?.tool_input?.filePath),
    content: pick(input?.tool_input?.content),
    command: pick(input?.tool_input?.command),
    oldString: pick(input?.tool_input?.old_string),
  };
}

/**
 * Cursor IDE 런타임 감지 (GitHub issue #118).
 *
 * Cursor의 Claude plugin bridge는 PreToolUse hook runner에서 Claude Code와는
 * 다른 JSON 스키마를 기대한다:
 *   allow: {"permission":"allow","agent_message":...}
 *   deny:  {"permission":"deny","user_message":...,"agent_message":...}
 * CURSOR_VERSION env는 Cursor hook runtime이 주입한다. 빈 문자열("")은
 * 미설정과 동급으로 취급하여 truthy 여부로 판별한다.
 * @returns {boolean}
 */
function isCursorRuntime() {
  return !!process.env.CURSOR_VERSION;
}

/**
 * 허용 결정 출력.
 * - Cursor: {"permission":"allow","agent_message":...}
 * - Claude Code: SessionStart/UserPromptSubmit은 {success,message} JSON,
 *   그 외 PreToolUse는 plain text (값이 있을 때만).
 * @param {string} [context]
 * @param {string} [hookEvent]
 */
function outputAllow(context, hookEvent) {
  const truncated = truncateContext(context);

  if (isCursorRuntime()) {
    // Cursor IDE PreToolUse allow 스키마.
    const payload = { permission: 'allow' };
    if (truncated) {
      payload.agent_message = truncated;
    }
    console.log(JSON.stringify(payload));
    return;
  }

  if (hookEvent === 'SessionStart' || hookEvent === 'UserPromptSubmit') {
    console.log(JSON.stringify({
      success: true,
      message: truncated || undefined,
    }));
  } else {
    if (truncated) {
      console.log(truncated);
    }
  }
}

/**
 * 차단 결정 출력.
 * - Cursor: {"permission":"deny","user_message":...,"agent_message":...}
 * - Claude Code: {"decision":"block","reason":...}
 * 두 runtime 모두 graceful deny이므로 exit(0).
 * @param {string} reason
 */
function outputBlock(reason) {
  if (isCursorRuntime()) {
    // Cursor IDE PreToolUse deny 스키마. reason을 사용자/에이전트 양쪽에 노출.
    console.log(JSON.stringify({
      permission: 'deny',
      user_message: reason,
      agent_message: reason,
    }));
  } else {
    console.log(JSON.stringify({
      decision: 'block',
      reason: reason,
    }));
  }
  process.exit(0);
}

/**
 * ENH-264 (bkit v2.1.10): Block a tool use while surfacing alternatives.
 *
 * Leverages CC v2.1.110+ PreToolUse `hookSpecificOutput.additionalContext`
 * to feed Claude a structured list of safer alternatives so the agent can
 * propose a recovery path instead of simply reporting "blocked".
 *
 * @param {string} reason - Short reason shown in the block message
 * @param {string[]} [alternatives] - Array of concrete safer commands / rephrasings
 * @param {string} [hookEvent='PreToolUse'] - CC hook event name
 */
function outputBlockWithContext(reason, alternatives, hookEvent) {
  const alts = Array.isArray(alternatives) && alternatives.length
    ? alternatives
    : [];

  if (isCursorRuntime()) {
    // Cursor IDE PreToolUse deny 스키마. 대체안을 agent_message에 함께 노출하여
    // 에이전트가 더 안전한 경로를 제안받도록 한다 (CC hookSpecificOutput 대체품).
    const agentMessage = alts.length
      ? `${reason}\n\nSafer alternatives you can try instead:\n${alts.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}\n\nReformulate the command using one of the alternatives above or ask the user for an explicit confirmation.`
      : reason;
    console.log(JSON.stringify({
      permission: 'deny',
      user_message: reason,
      agent_message: agentMessage,
    }));
    process.exit(0);
    return;
  }

  const context = alts.length
    ? `Blocked: ${reason}\n\nSafer alternatives you can try instead:\n${alts.map((a, i) => `  ${i + 1}. ${a}`).join('\n')}\n\nReformulate the command using one of the alternatives above or ask the user for an explicit confirmation.`
    : `Blocked: ${reason}`;
  const payload = {
    decision: 'block',
    reason: reason,
    hookSpecificOutput: {
      hookEventName: hookEvent || 'PreToolUse',
      additionalContext: context,
    },
  };
  console.log(JSON.stringify(payload));
  process.exit(0);
}

/**
 * 빈 출력 (Claude Code는 아무것도 출력하지 않음)
 */
function outputEmpty() {
  // Claude Code는 빈 출력 시 아무것도 출력하지 않음
}

/**
 * CC Stop hook — surface content and force Claude to continue (S6, ENH-364).
 *
 * CC's current strict Stop validator rejects `decision:'allow'`,
 * `hookSpecificOutput` (no Stop variant), and any non-schema root field
 * (`skillResult`/`autoTrigger`/...). The only schema-valid way for a Stop
 * hook to feed content back to the model AND keep the turn going is
 * `{ decision: 'block', reason: <content> }`. Claude receives `reason` as the
 * next-turn instruction and renders it (executive summary + AskUserQuestion
 * next-step options serialized into the text). This preserves the v2.1.21
 * #113 Stop-output-enforcement intent in a fully CC-compliant shape.
 *
 * @param {string} reason - Executive summary + next-step options (plain text)
 */
function outputStopSurface(reason) {
  console.log(JSON.stringify({ decision: 'block', reason: String(reason || '').trim() }));
}

/**
 * CC Stop hook — allow a clean stop with no forced continuation (S6, ENH-364).
 * Emits an empty object: every Stop schema field is optional, so `{}` is the
 * canonical "no opinion, let it stop" output. Used for read-only actions and
 * error fallbacks where surfacing a summary is not warranted.
 */
function outputStopAllow() {
  console.log(JSON.stringify({}));
}

/**
 * XML 특수문자 이스케이프
 * @param {string} content
 * @returns {string}
 */
function xmlSafeOutput(content) {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  MAX_CONTEXT_LENGTH,
  truncateContext,
  isCursorRuntime,
  readStdinSync,
  readStdinBounded,
  readStdin,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputBlockWithContext,
  outputEmpty,
  outputStopSurface,
  outputStopAllow,
  xmlSafeOutput,
};
