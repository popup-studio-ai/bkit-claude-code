'use strict';
/**
 * Contract Test — Sprint Stop handler registration (Issue #113 F6 — v2.1.21)
 *
 * Structural invariant guard: scripts/unified-stop.js SKILL_HANDLERS must map
 * 'sprint' → './sprint-skill-stop.js', and the handler must follow the
 * run-export pattern (so executeHandler can invoke handler.run(context) —
 * the bare-require-{} pattern is a no-op via unified-stop).
 *
 * Pattern: console.assert based (matches existing test/contract/*.test.js).
 */

const fs = require('fs');
const path = require('path');

let passed = 0, failed = 0, total = 0;
function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

const root = path.resolve(__dirname, '../..');
const unifiedSrc = fs.readFileSync(path.join(root, 'scripts/unified-stop.js'), 'utf8');

// =============== SC-SPRINT-STOP-1: registry entry ===============
assert('SC-SPRINT-STOP-1',
  /'sprint':\s*'\.\/sprint-skill-stop\.js'/.test(unifiedSrc),
  "SKILL_HANDLERS 에 'sprint' → './sprint-skill-stop.js' 매핑 존재");

// =============== SC-SPRINT-STOP-2: handler file exists ===============
const handlerPath = path.join(root, 'scripts/sprint-skill-stop.js');
assert('SC-SPRINT-STOP-2', fs.existsSync(handlerPath), 'scripts/sprint-skill-stop.js 존재');

// =============== SC-SPRINT-STOP-3: run-export pattern ===============
const mod = require(handlerPath);  // require.main !== module → module.exports = { run, ... }
assert('SC-SPRINT-STOP-3a', mod && typeof mod.run === 'function',
  'handler.run 함수 export (executeHandler run 패턴 호환)');
assert('SC-SPRINT-STOP-3b', typeof mod.buildResponse === 'function',
  'buildResponse 순수 빌더 export (테스트/재사용)');

// =============== SC-SPRINT-STOP-4: lib/sprint module exists ===============
const esPath = path.join(root, 'lib/sprint/executive-summary.js');
assert('SC-SPRINT-STOP-4', fs.existsSync(esPath), 'lib/sprint/executive-summary.js 존재 (#113 §D sprint shape)');

// --- Results ---
console.log(`\n=== Results: ${passed}/${total} passed (${failed} failed) ===`);
process.exit(failed > 0 ? 1 : 0);
