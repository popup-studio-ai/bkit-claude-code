#!/usr/bin/env node
/*
 * L2 — Hook Attribution Test (Sprint 5.5)
 *
 * Verifies cc-regression.recordEvent + PreCompact counter wiring.
 *   - recordEvent writes NDJSON lines without recursion
 *   - PreCompact counter correctly aggregates blocked vs sampled events
 *   - Fail-silent behavior when inputs are malformed
 *
 * Design Ref: bkit-v2110-gap-closure.design.md §3.3.2
 * Plan SC: G-W1 (hook attribution 3곳 확장)
 */

const path = require('path');
const fs = require('fs');

// Isolate runtime files from real project state
const tmpRoot = fs.mkdtempSync(path.join(require('os').tmpdir(), 'bkit-l2-attr-'));
process.env.CLAUDE_PROJECT_DIR = tmpRoot;

const cc = require(path.resolve(__dirname, '..', '..', 'lib', 'cc-regression'));

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('=== L2 Hook Attribution Test (v2.1.10 Sprint 5.5) ===');

// 1. recordEvent creates NDJSON line
cc.recordEvent({
  hookEvent: 'Stop',
  ccVersion: '2.1.117',
  sessionId: 'test-session-1',
  timestamp: new Date().toISOString(),
});

const logPath = cc.getEventLogPath();
assert(fs.existsSync(logPath), 'event log created on first recordEvent');

const tail = cc.readEventTail(5);
assert(tail.length >= 1, 'readEventTail returns at least 1 event');
assert(tail[tail.length - 1].hookEvent === 'Stop', 'last event hookEvent == "Stop"');
assert(tail[tail.length - 1].ccVersion === '2.1.117', 'ccVersion preserved');

// 2. multiple events append correctly
for (let i = 0; i < 3; i++) {
  cc.recordEvent({
    hookEvent: i % 2 === 0 ? 'SessionEnd' : 'SubagentStop',
    ccVersion: '2.1.117',
    sessionId: `test-session-${i + 2}`,
    timestamp: new Date().toISOString(),
  });
}
const tail2 = cc.readEventTail(10);
assert(tail2.length === 4, 'NDJSON append preserves all events');

// 3. PII-like context fields are filtered
cc.recordEvent({
  hookEvent: 'Stop',
  ccVersion: '2.1.117',
  sessionId: 'test-pii',
  timestamp: new Date().toISOString(),
  context: {
    agent: 'pm-lead',
    api_key: 'sk_SHOULD_BE_STRIPPED',
    text: 'long prompt content',
    skill: 'pdca',
  },
});
const tail3 = cc.readEventTail(1)[0];
assert(tail3 && tail3.context && !('api_key' in tail3.context), 'api_key stripped from context');
assert(tail3 && tail3.context && !('text' in tail3.context), 'text stripped from context');
assert(tail3 && tail3.context && tail3.context.agent === 'pm-lead', 'safe field agent preserved');

// 4. Malformed input is silently ignored
cc.recordEvent(null);
cc.recordEvent({});
cc.recordEvent({ hookEvent: 'Stop' });  // missing ccVersion
const tail4 = cc.readEventTail(10);
assert(tail4.length === 5, 'malformed inputs silently rejected (count unchanged: 4 + 1 PII = 5)');

// 5. PreCompact counter
cc.recordPrecompactEvent({ blocked: true, reason: 'manual', ccVersion: '2.1.117', phase: 'do' });
cc.recordPrecompactEvent({ blocked: false, reason: 'auto', ccVersion: '2.1.117' });
cc.recordPrecompactEvent({ blocked: false, reason: 'auto', ccVersion: '2.1.117' });
const summary = cc.getPrecompactSummary();
assert(summary.sampleCount === 3, 'precompact sampleCount == 3');
assert(summary.blockCount === 1, 'precompact blockCount == 1');
assert(Math.abs(summary.blockRate - 1 / 3) < 0.01, `blockRate ~= 0.333 (got ${summary.blockRate.toFixed(3)})`);

// 6. Recursion defense — recordEvent must not call anything that calls recordEvent back
const beforeCount = cc.readEventTail(100).length;
// Simulate repeated call; if internal recursion existed, log file would explode
for (let i = 0; i < 5; i++) {
  cc.recordEvent({ hookEvent: 'Stop', ccVersion: '2.1.117' });
}
const afterCount = cc.readEventTail(100).length;
assert(afterCount - beforeCount === 5, `no recursion (expected +5, actual +${afterCount - beforeCount})`);

// Cleanup
try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}

// Summary
const total = pass + fail;
console.log(`\nTests: ${pass}/${total} PASSED, ${fail} FAILED, 0 SKIPPED`);
process.exit(fail > 0 ? 1 : 0);
