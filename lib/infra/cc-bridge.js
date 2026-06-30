/**
 * CC Payload Bridge — Infrastructure Adapter implementing `cc-payload.port.js`.
 *
 * Centralizes CC hook stdin parsing, version detection, session_id extraction,
 * and bypass-mode flag so individual hook scripts no longer duplicate logic.
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.4.3 (Sprint 6 NEW 6-3)
 * Plan SC: G-W2 (Port↔Adapter 매핑 6종 완결)
 *
 * Safety: fail-open — parse errors return null or defaults. Hooks must tolerate.
 *
 * @module lib/infra/cc-bridge
 *
 * @version 2.1.12
 */

const fs = require('fs');
const path = require('path');

/**
 * @typedef {import('../domain/ports/cc-payload.port').HookInput} HookInput
 * @typedef {import('../domain/ports/cc-payload.port').HookOutput} HookOutput
 */

/**
 * Parse raw stdin JSON into HookInput.
 * @param {string} rawStdin
 * @returns {HookInput|null}
 */
function parseHookInput(rawStdin) {
  if (rawStdin === undefined || rawStdin === null) return null;
  const text = String(rawStdin).trim();
  if (!text) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    return null;
  } catch (_e) {
    return null;
  }
}

/**
 * Detect the current Claude Code CLI version.
 * Priority: CLAUDE_CODE_VERSION env → npm global package.json (best-effort) → null
 * @returns {string|null}
 */
function detectCCVersion() {
  const envV = process.env.CLAUDE_CODE_VERSION;
  if (envV && /^\d+\.\d+\.\d+/.test(envV)) return envV;

  // best-effort: look for `claude-code` in PATH's package.json next to binary
  try {
    const { execSync } = require('child_process');
    const out = execSync('claude --version 2>/dev/null', {
      encoding: 'utf8',
      timeout: 2000,
    });
    const m = String(out).match(/(\d+\.\d+\.\d+(?:-\S+)?)/);
    if (m) return m[1];
  } catch (_e) { /* ignore */ }

  return null;
}

/**
 * Extract session identifier from a HookInput.
 *
 * Resolution order (most authoritative first):
 *   1. input.session_id        (hook stdin payload — matches #111 Stop path)
 *   2. CLAUDE_CODE_SESSION_ID  (Claude Code's actual env var — GitHub #119)
 *   3. CLAUDE_SESSION_ID       (legacy fallback for older CC builds)
 *   4. null
 *
 * #119 root cause: Claude Code exposes CLAUDE_CODE_SESSION_ID, never
 * CLAUDE_SESSION_ID. Reading the legacy name only made sessionId null on the
 * SessionStart path, so the per-session `·a1b2` title tag from #111 never
 * applied and concurrent same-repo sessions rendered identical titles.
 *
 * @param {HookInput|null} input
 * @returns {string|null}
 */
function getSessionId(input) {
  if (input && typeof input === 'object') {
    if (typeof input.session_id === 'string' && input.session_id.length > 0) return input.session_id;
    if (typeof input.sessionId === 'string' && input.sessionId.length > 0) return input.sessionId;
  }
  return process.env.CLAUDE_CODE_SESSION_ID || process.env.CLAUDE_SESSION_ID || null;
}

/**
 * Check if bkit's CC regression defense should be bypassed.
 * Controlled by BKIT_CC_REGRESSION_BYPASS env var.
 * @returns {boolean}
 */
function isBypassMode() {
  const v = process.env.BKIT_CC_REGRESSION_BYPASS;
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Extract a best-effort "tool name" from a PreToolUse-style input.
 * @param {HookInput|null} input
 * @returns {string|null}
 */
function getToolName(input) {
  if (!input || typeof input !== 'object') return null;
  return (typeof input.tool_name === 'string' && input.tool_name) || null;
}

/**
 * Extract permissions flags (bypassPermissions, dangerouslyDisableSandbox).
 * @param {HookInput|null} input
 * @returns {{ bypassPermissions: boolean, dangerouslyDisableSandbox: boolean }}
 */
function getPermissionFlags(input) {
  const out = { bypassPermissions: false, dangerouslyDisableSandbox: false };
  if (!input || typeof input !== 'object') return out;
  const p = input.permissions || {};
  out.bypassPermissions = Boolean(p.bypassPermissions);
  out.dangerouslyDisableSandbox = Boolean(p.dangerouslyDisableSandbox);
  return out;
}

/**
 * Detect the hook event name (matches CC `hook_event_name` field).
 * @param {HookInput|null} input
 * @returns {string|null}
 */
function getHookEventName(input) {
  if (!input || typeof input !== 'object') return null;
  return (typeof input.hook_event_name === 'string' && input.hook_event_name) || null;
}

module.exports = {
  parseHookInput,
  detectCCVersion,
  getSessionId,
  isBypassMode,
  getToolName,
  getPermissionFlags,
  getHookEventName,
};
