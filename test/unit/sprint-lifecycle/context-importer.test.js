#!/usr/bin/env node
/** L1 — context-importer (F3-2 v2.1.19 S3, 10 TC, closes #104) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const ci = require(path.join(PROJECT_ROOT, 'lib/application/sprint-lifecycle/context-importer.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }
async function asyncTest(name, fn) {
  try { await fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); }
}

console.log('L1 F3-2 context-importer tests');

test('TC-F3-2-I1: REQUIRED_ANCHOR_KEYS = 5 fields', () => {
  assert.deepEqual(ci.REQUIRED_ANCHOR_KEYS, ['WHY', 'WHO', 'RISK', 'SUCCESS', 'SCOPE']);
});

test('TC-F3-2-I2: deriveCandidateProjectIds — s1-foundation', () => {
  assert.deepEqual(ci.deriveCandidateProjectIds('s1-foundation'), ['s1-foundation', 's1']);
});

test('TC-F3-2-I3: deriveCandidateProjectIds — v2119-bkit-quality-maturation', () => {
  const c = ci.deriveCandidateProjectIds('v2119-bkit-quality-maturation');
  assert.equal(c[0], 'v2119-bkit-quality-maturation');
  assert.ok(c.includes('v2119'));
});

test('TC-F3-2-I4: parseContextAnchor — sprint-master-planner table format', () => {
  const md = `## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | sample why text |
| **WHO** | sample who text |
| **RISK** | sample risk text |
| **SUCCESS** | sample success text |
| **SCOPE** | sample scope text |
`;
  const r = ci.parseContextAnchor(md);
  assert.ok(r, 'null result');
  assert.equal(r.WHY, 'sample why text');
  assert.equal(r.SCOPE, 'sample scope text');
});

test('TC-F3-2-I5: parseContextAnchor — code blocks ignored (CO-S2-1 stripCodeBlocks)', () => {
  const md = `## Context Anchor

\`\`\`
| **WHY** | fake from code block |
\`\`\`

| **WHO** | real who text |
`;
  const r = ci.parseContextAnchor(md);
  assert.ok(r);
  assert.notEqual(r.WHY, 'fake from code block', 'code block leaked through');
  assert.equal(r.WHO, 'real who text');
});

test('TC-F3-2-I6: parseContextAnchor — no anchor table → null', () => {
  const md = 'No anchor table here\n\nJust prose.';
  assert.equal(ci.parseContextAnchor(md), null);
});

test('TC-F3-2-I7: parseContextAnchor — empty content → null', () => {
  assert.equal(ci.parseContextAnchor(''), null);
  assert.equal(ci.parseContextAnchor(null), null);
});

test('TC-F3-2-I8: defaultContext — 5 empty fields', () => {
  const d = ci.defaultContext();
  assert.deepEqual(Object.keys(d), ['WHY', 'WHO', 'RISK', 'SUCCESS', 'SCOPE']);
  for (const k of Object.keys(d)) assert.equal(d[k], '');
});

asyncTest('TC-F3-2-I9: resolveContext — master-plan exists (live v2119)', async () => {
  const r = await ci.resolveContext('v2119-bkit-quality-maturation', { projectRoot: PROJECT_ROOT });
  assert.equal(r.source, 'master-plan');
  assert.ok(r.filePath.includes('master-plan.md'));
  assert.ok(r.context.WHY.length > 0);
});

asyncTest('TC-F3-2-I10: resolveContext — neither exists → default', async () => {
  const r = await ci.resolveContext('totally-nonexistent-sprint-xyz', { projectRoot: PROJECT_ROOT });
  assert.equal(r.source, 'default');
  assert.equal(r.context.WHY, '');
});

(async () => {
  // wait for async tests to complete (sequential ordering above is correct)
  await new Promise(r => setTimeout(r, 100));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
})();
