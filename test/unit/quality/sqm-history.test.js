#!/usr/bin/env node
/** L1 — sqm-history append+load round-trip (F5-3 v2.1.19 S5, 1 TC) */
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');
const history = require(path.join(PROJECT_ROOT, 'lib/quality/sqm-history.js'));
let passed = 0, failed = 0;
function test(name, fn) { try { fn(); passed++; console.log(`  ✓ ${name}`); } catch (e) { failed++; console.log(`  ✗ ${name} — ${e.message}`); } }

console.log('L1 F5-3 sqm-history tests');

test('TC-F5-3-H1: append + load + latest round-trip', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sqm-history-'));
  const filePath = path.join(tmpDir, 'sqm-history.jsonl');
  const entry1 = { measuredAt: '2026-05-21T10:00:00Z', total: 61.25, bkitVersion: '2.1.18' };
  const entry2 = { measuredAt: '2026-05-30T10:00:00Z', total: 85.0, bkitVersion: '2.1.19' };
  const r1 = history.appendHistoryEntry(entry1, { projectRoot: '/', filePath });
  assert.equal(r1.ok, true);
  const r2 = history.appendHistoryEntry(entry2, { projectRoot: '/', filePath });
  assert.equal(r2.ok, true);
  assert.equal(r2.entryCount, 2);
  const all = history.loadHistory({ projectRoot: '/', filePath });
  assert.equal(all.length, 2);
  assert.equal(all[0].total, 61.25);
  assert.equal(all[1].total, 85.0);
  const last = history.latest({ projectRoot: '/', filePath });
  assert.equal(last.bkitVersion, '2.1.19');
  // Cleanup
  fs.unlinkSync(filePath);
  fs.rmdirSync(tmpDir);
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
