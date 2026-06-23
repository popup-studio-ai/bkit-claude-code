/**
 * I/O Utilities
 * @module lib/core/io
 * @version 2.1.10
 *
 * Claude Code 전용 플러그인으로 단순화 (v1.5.0). Tag synced to 2.0.0 per ENH-263 (2026-04-21).
 */

const fs = require('fs');

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
 * stdin에서 JSON 동기적 읽기
 *
 * H5 fix (audit): a malformed/truncated JSON-RPC envelope used to be
 * indistinguishable from a valid empty object (silently returned {}). That
 * masked the exact failure mode that bit skill-post.js. Now every parse
 * failure is recorded via debugLog, and BKIT_STRICT_STDIN=1 rethrows so a
 * debugging session sees the real error instead of a fabricated empty input.
 *
 * @returns {*}
 */
function readStdinSync() {
  try {
    const input = fs.readFileSync(0, 'utf8');
    return JSON.parse(input);
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
