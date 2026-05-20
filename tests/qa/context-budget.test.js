#!/usr/bin/env node
/**
 * TC-B8~B10: ENH-240 PersistedOutputGuard (context budget) unit tests.
 * Run: node tests/qa/context-budget.test.js
 */

const assert = require('assert');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const { applyBudget, DEFAULT_MAX_CHARS, DEFAULT_PRIORITY_KEYS } = require(
  path.join(PROJECT_ROOT, 'lib/core/context-budget')
);

let pass = 0;
let fail = 0;
function tc(id, fn) {
  try {
    fn();
    console.log(`✅ ${id} PASS`);
    pass++;
  } catch (e) {
    console.error(`❌ ${id} FAIL — ${e.message}`);
    fail++;
  }
}

// TC-B8: input ≤ cap → 원본 통과
tc('TC-B8', () => {
  const small = 'a'.repeat(7999);
  const out = applyBudget(small);
  assert.strictEqual(out, small, 'TC-B8 small input should pass through unchanged');
});

// TC-B9: input > cap + MANDATORY priority → priority preserved, 전체 ≤ cap + notice
tc('TC-B9', () => {
  const mandatory = 'MANDATORY: call /pdca plan before implementation';
  const filler = 'x'.repeat(9000);
  const mixed = `# Header\n\n${mandatory}\n\n${filler}\n\ntrailer content here`;
  const trimmed = applyBudget(mixed);
  assert(trimmed.includes('MANDATORY'), 'TC-B9 priority section preserved');
  assert(trimmed.includes('budget guard'), 'TC-B9 truncation notice appended');
  // stripped 기준으로 cap + notice(~90 chars) 이내
  const { stripAnsi } = require(path.join(PROJECT_ROOT, 'lib/ui/ansi'));
  assert(
    stripAnsi(trimmed).length <= DEFAULT_MAX_CHARS + 100,
    `TC-B9 expected ≤ ${DEFAULT_MAX_CHARS + 100}, got ${stripAnsi(trimmed).length}`
  );
});

// TC-B10: ANSI escape 포함 → stripAnsi 기준 측정 (ANSI 자체는 count 제외)
tc('TC-B10', () => {
  const ansi = '\x1b[36m' + 'a'.repeat(7990) + '\x1b[0m';
  const out = applyBudget(ansi);
  // ANSI-stripped length = 7990, < 8000 → 원본 통과
  assert.strictEqual(out, ansi, 'TC-B10 ANSI-wrapped input under cap stays intact');
});

// TC-B10b: custom maxChars + priorityPreserve override
tc('TC-B10b', () => {
  const input = 'CUSTOM_KEY: keep\n\n' + 'y'.repeat(500);
  const out = applyBudget(input, { maxChars: 100, priorityPreserve: ['CUSTOM_KEY'] });
  assert(out.includes('CUSTOM_KEY'), 'TC-B10b custom priorityPreserve preserved');
});

// TC-B10c: null/undefined input → empty string handling
tc('TC-B10c', () => {
  assert.strictEqual(applyBudget(null), '', 'null input → empty string');
  assert.strictEqual(applyBudget(undefined), '', 'undefined input → empty string');
});

// TC-B10d: DEFAULT_PRIORITY_KEYS export 검증
tc('TC-B10d', () => {
  assert(Array.isArray(DEFAULT_PRIORITY_KEYS), 'DEFAULT_PRIORITY_KEYS exported');
  assert(DEFAULT_PRIORITY_KEYS.includes('MANDATORY'), 'MANDATORY in defaults');
});

console.log(`\n[context-budget.test] ${pass} PASS / ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
