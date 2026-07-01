#!/usr/bin/env node
'use strict';

/**
 * Unit tests for lib/core/hook-reachability.js — evaluateReachability (Issue #126).
 * Guards the "drop vs. idle" classification so the SessionStart
 * MON-CC-NEW-PLUGIN-HOOK-DROP monitor stops false-positive-flagging skill_post
 * when skills are invoked via slash commands (no PostToolUse(Skill) event),
 * while still catching a genuine CC plugin-hook loader drop (#57317).
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;
function test(id, description, fn) {
  total++;
  try { fn(); passed++; }
  catch (err) { failed++; console.error(`  FAIL ${id}: ${description}\n    ${err.message}`); }
}

console.log('\n=== Hook Reachability Evaluator Unit Tests (#126) ===\n');

const {
  evaluateReachability,
  CANARY_KEYS,
  EVENT_DRIVEN_KEYS,
  DEFAULT_STALE_THRESHOLD_MS,
} = require('../../lib/core/hook-reachability');

const NOW = 1_800_000_000_000; // fixed reference epoch ms (deterministic)
const fresh = (ms = 1000) => ({ ts: new Date(NOW - ms).toISOString() });
const staleTs = () => ({ ts: new Date(NOW - DEFAULT_STALE_THRESHOLD_MS - 1000).toISOString() });
const ev = (state) => evaluateReachability(state, { now: NOW });

test('HR-001', '#126 repro: canaries fresh, skill_post absent → no warning (idle)', () => {
  const r = ev({ bash_post: fresh(), write_post: fresh() });
  assert.strictEqual(r.shouldWarn, false);
  assert.deepStrictEqual(r.missing, []);
  assert.deepStrictEqual(r.stale, []);
  assert.strictEqual(r.skillPostIdle, true);
  assert.strictEqual(r.canaryUnhealthy, false);
});

test('HR-002', 'all three fresh → no warning, skill_post not idle', () => {
  const r = ev({ bash_post: fresh(), write_post: fresh(), skill_post: fresh() });
  assert.strictEqual(r.shouldWarn, false);
  assert.strictEqual(r.skillPostIdle, false);
});

test('HR-003', 'real drop: everything missing → warns, skill_post surfaced with canaries', () => {
  const r = ev({});
  assert.strictEqual(r.shouldWarn, true);
  assert.strictEqual(r.canaryUnhealthy, true);
  assert.ok(r.missing.includes('bash_post'));
  assert.ok(r.missing.includes('write_post'));
  assert.ok(r.missing.includes('skill_post'), 'skill_post surfaces when canaries corroborate a drop');
});

test('HR-004', 'real drop: canaries stale + skill_post missing → warns, skill_post kept', () => {
  const r = ev({ bash_post: staleTs(), write_post: staleTs() });
  assert.strictEqual(r.shouldWarn, true);
  assert.strictEqual(r.canaryUnhealthy, true);
  assert.deepStrictEqual(r.stale.sort(), ['bash_post', 'write_post']);
  assert.ok(r.missing.includes('skill_post'));
  assert.strictEqual(r.skillPostIdle, false, 'not idle when a canary is unhealthy');
});

test('HR-005', 'partial drop: one canary missing, skill_post idle → warns for canary, keeps skill', () => {
  const r = ev({ write_post: fresh() }); // bash_post missing, skill_post absent
  assert.strictEqual(r.shouldWarn, true);
  assert.strictEqual(r.canaryUnhealthy, true);
  assert.ok(r.missing.includes('bash_post'));
  assert.ok(r.missing.includes('skill_post'));
});

test('HR-006', 'skill_post stale but canaries fresh → suppressed (idle), no warning', () => {
  const r = ev({ bash_post: fresh(), write_post: fresh(), skill_post: staleTs() });
  assert.strictEqual(r.shouldWarn, false);
  assert.strictEqual(r.skillPostIdle, true);
  assert.deepStrictEqual(r.stale, []);
});

test('HR-007', 'malformed entry (no ts) counts as missing', () => {
  const r = ev({ bash_post: fresh(), write_post: {}, skill_post: fresh() });
  assert.strictEqual(r.shouldWarn, true);
  assert.ok(r.missing.includes('write_post'));
});

test('HR-008', 'unparseable ts counts as stale', () => {
  const r = ev({ bash_post: fresh(), write_post: { ts: 'not-a-date' }, skill_post: fresh() });
  assert.strictEqual(r.shouldWarn, true);
  assert.ok(r.stale.includes('write_post'));
});

test('HR-009', 'null/non-object state → treated as empty (all missing, warns)', () => {
  const r = ev(null);
  assert.strictEqual(r.shouldWarn, true);
  assert.strictEqual(r.canaryUnhealthy, true);
});

test('HR-010', 'expected set is exactly canaries + event-driven', () => {
  const r = ev({});
  assert.deepStrictEqual(r.expected, [...CANARY_KEYS, ...EVENT_DRIVEN_KEYS]);
});

test('HR-011', 'defaults: no opts still classifies without throwing (uses Date.now)', () => {
  const r = evaluateReachability({ bash_post: { ts: new Date().toISOString() }, write_post: { ts: new Date().toISOString() } });
  assert.strictEqual(r.shouldWarn, false);
  assert.strictEqual(r.skillPostIdle, true);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
