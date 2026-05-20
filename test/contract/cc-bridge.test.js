#!/usr/bin/env node
/*
 * L2 — CC Bridge Adapter Test (Sprint 6 NEW 6-3)
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.4.3
 * Plan SC: G-W2 — Port↔Adapter 매핑 6종 완결 검증
 */

const path = require('path');
const cc = require(path.resolve(__dirname, '..', '..', 'lib', 'infra', 'cc-bridge'));

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('=== CC Bridge Adapter Test (v2.1.10 Sprint 6 NEW 6-3) ===');

// 1. parseHookInput
assert(cc.parseHookInput(null) === null, 'parseHookInput(null) returns null');
assert(cc.parseHookInput('') === null, 'parseHookInput("") returns null');
assert(cc.parseHookInput('not-json') === null, 'parseHookInput malformed returns null');
assert(cc.parseHookInput('[1,2]') === null, 'parseHookInput non-object JSON returns null');
const p1 = cc.parseHookInput('{"tool_name":"Write","session_id":"s1"}');
assert(p1 && p1.tool_name === 'Write', 'parseHookInput valid object works');

// 2. getSessionId
assert(cc.getSessionId(null) === null || typeof cc.getSessionId(null) === 'string', 'getSessionId(null) returns null or env fallback');
assert(cc.getSessionId({ session_id: 'abc' }) === 'abc', 'getSessionId session_id');
assert(cc.getSessionId({ sessionId: 'camel' }) === 'camel', 'getSessionId sessionId camelCase fallback');
assert(cc.getSessionId({}) === (process.env.CLAUDE_SESSION_ID || null), 'getSessionId env fallback');

// 3. isBypassMode
const original = process.env.BKIT_CC_REGRESSION_BYPASS;
delete process.env.BKIT_CC_REGRESSION_BYPASS;
assert(cc.isBypassMode() === false, 'isBypassMode() false by default');
process.env.BKIT_CC_REGRESSION_BYPASS = '1';
assert(cc.isBypassMode() === true, 'isBypassMode() true for "1"');
process.env.BKIT_CC_REGRESSION_BYPASS = 'true';
assert(cc.isBypassMode() === true, 'isBypassMode() true for "true"');
process.env.BKIT_CC_REGRESSION_BYPASS = 'no';
assert(cc.isBypassMode() === false, 'isBypassMode() false for "no"');
if (original !== undefined) process.env.BKIT_CC_REGRESSION_BYPASS = original;
else delete process.env.BKIT_CC_REGRESSION_BYPASS;

// 4. getToolName
assert(cc.getToolName(null) === null, 'getToolName(null) returns null');
assert(cc.getToolName({ tool_name: 'Bash' }) === 'Bash', 'getToolName extracts tool_name');
assert(cc.getToolName({}) === null, 'getToolName missing returns null');

// 5. getPermissionFlags
const pf1 = cc.getPermissionFlags(null);
assert(pf1.bypassPermissions === false && pf1.dangerouslyDisableSandbox === false, 'getPermissionFlags(null) defaults to false');
const pf2 = cc.getPermissionFlags({ permissions: { bypassPermissions: true } });
assert(pf2.bypassPermissions === true, 'getPermissionFlags bypassPermissions true');
const pf3 = cc.getPermissionFlags({ permissions: { dangerouslyDisableSandbox: true } });
assert(pf3.dangerouslyDisableSandbox === true, 'getPermissionFlags dangerouslyDisableSandbox true');

// 6. getHookEventName
assert(cc.getHookEventName({ hook_event_name: 'SessionStart' }) === 'SessionStart', 'getHookEventName extracts');
assert(cc.getHookEventName(null) === null, 'getHookEventName null input');
assert(cc.getHookEventName({}) === null, 'getHookEventName missing field');

// 7. detectCCVersion env
const originalV = process.env.CLAUDE_CODE_VERSION;
process.env.CLAUDE_CODE_VERSION = '2.1.117';
assert(cc.detectCCVersion() === '2.1.117', 'detectCCVersion from env');
process.env.CLAUDE_CODE_VERSION = 'not-a-version';
const fallback = cc.detectCCVersion();
assert(fallback === null || typeof fallback === 'string', 'detectCCVersion malformed env → null or fallback');
if (originalV !== undefined) process.env.CLAUDE_CODE_VERSION = originalV;
else delete process.env.CLAUDE_CODE_VERSION;

// Summary
const total = pass + fail;
console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
process.exit(fail > 0 ? 1 : 0);
