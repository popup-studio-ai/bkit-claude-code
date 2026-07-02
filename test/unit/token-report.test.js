/**
 * token-report.test.js — Unit tests for FR-δ4 + CAND-004 OTEL accumulation.
 *
 * Maps to Sprint δ Plan SC-04 + Design §4.1 / §4.1.1 / §6 E-δ4-01..02.
 *
 * @module test/unit/token-report.test
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const tr = require('../../lib/pdca/token-report');
const telemetry = require('../../lib/infra/telemetry');

function withFakeLedger(entries, fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-tr-'));
  const ledger = path.join(dir, 'ledger.ndjson');
  fs.writeFileSync(ledger, entries.map((e) => JSON.stringify(e)).join('\n'));
  try { return fn(ledger); }
  finally { try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} }
}

// ── 1. aggregate: empty + missing ledger ─────────────────────────────────
test('aggregate: missing ledger returns empty summary (E-δ4-01)', () => {
  const r = tr.aggregate({ ledgerPath: '/nonexistent/ledger.ndjson' });
  assert.equal(r.summary.totalTokensIn, 0);
  assert.equal(r.summary.totalTokensOut, 0);
  assert.equal(r.summary.totalCost, 0);
  assert.equal(r.summary.sessionCount, 0);
});

test('aggregate: malformed lines skipped, valid ones counted', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bkit-tr-'));
  const ledger = path.join(dir, 'ledger.ndjson');
  try {
    fs.writeFileSync(ledger, [
      '{not json}',
      JSON.stringify({ inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' }),
      'garbage',
      JSON.stringify({ inputTokens: 200, outputTokens: 80, model: 'claude-sonnet-4-6' }),
    ].join('\n'));
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.summary.totalTokensIn, 300);
    assert.equal(r.summary.totalTokensOut, 130);
  } finally {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

// ── 2. aggregate: cost calculation per model class ───────────────────────
test('aggregate: Sonnet pricing $3 in / $15 out per Mtok', () => {
  withFakeLedger([
    { inputTokens: 1_000_000, outputTokens: 1_000_000, model: 'claude-sonnet-4-6' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.ok(Math.abs(r.summary.totalCost - 18.0) < 0.01);
  });
});

test('aggregate: Opus pricing $5 in / $25 out per Mtok', () => {
  withFakeLedger([
    { inputTokens: 1_000_000, outputTokens: 1_000_000, model: 'claude-opus-4-8' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.ok(Math.abs(r.summary.totalCost - 30.0) < 0.01);
  });
});

test('aggregate: Haiku pricing $1 in / $5 out per Mtok', () => {
  withFakeLedger([
    { inputTokens: 1_000_000, outputTokens: 1_000_000, model: 'claude-haiku-4-5' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.ok(Math.abs(r.summary.totalCost - 6.0) < 0.01);
  });
});

test('aggregate: Fable pricing $10 in / $50 out per Mtok', () => {
  withFakeLedger([
    { inputTokens: 1_000_000, outputTokens: 1_000_000, model: 'claude-fable-5' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.ok(Math.abs(r.summary.totalCost - 60.0) < 0.01);
  });
});

test('aggregate: unknown model class falls back to default (Sonnet) pricing', () => {
  withFakeLedger([
    { inputTokens: 1_000_000, outputTokens: 0, model: 'mystery-model' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.ok(Math.abs(r.summary.totalCost - 3.0) < 0.01);
  });
});

// ── 3. byPhase / byModel grouping ────────────────────────────────────────
test('aggregate: groups by phase', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'sonnet', phase: 'do' },
    { inputTokens: 200, outputTokens: 80, model: 'sonnet', phase: 'do' },
    { inputTokens: 50, outputTokens: 20, model: 'sonnet', phase: 'check' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.byPhase.do.tokensIn, 300);
    assert.equal(r.byPhase.do.tokensOut, 130);
    assert.equal(r.byPhase.check.tokensIn, 50);
  });
});

test('aggregate: groups by model class (sonnet / opus / haiku / unknown)', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'claude-sonnet-4-6' },
    { inputTokens: 200, outputTokens: 80, model: 'claude-opus-4-7' },
    { inputTokens: 30, outputTokens: 10, model: 'claude-haiku-4-5' },
    { inputTokens: 15, outputTokens: 5, model: 'unknown-model' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.byModel.sonnet.tokensIn, 100);
    assert.equal(r.byModel.opus.tokensIn, 200);
    assert.equal(r.byModel.haiku.tokensIn, 30);
    assert.equal(r.byModel.unknown.tokensIn, 15);
  });
});

test('aggregate: Claude 5 family IDs class correctly (fable / sonnet / opus)', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'claude-fable-5' },
    { inputTokens: 200, outputTokens: 80, model: 'claude-sonnet-5' },
    { inputTokens: 30, outputTokens: 10, model: 'claude-opus-4-8' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.byModel.fable.tokensIn, 100);
    assert.equal(r.byModel.sonnet.tokensIn, 200);
    assert.equal(r.byModel.opus.tokensIn, 30);
  });
});

// ── 4. session counting + Top 5 costliest ────────────────────────────────
test('aggregate: distinct sessions counted', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, sessionHash: 's01', model: 'sonnet' },
    { inputTokens: 200, outputTokens: 80, sessionHash: 's01', model: 'sonnet' },
    { inputTokens: 50, outputTokens: 20, sessionHash: 's02', model: 'sonnet' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.summary.sessionCount, 2);
    assert.equal(r.summary.turnCount, 3);
  });
});

test('aggregate: Top 5 costliest sessions sorted by cost', () => {
  const entries = [];
  for (let i = 1; i <= 7; i++) {
    entries.push({ inputTokens: i * 100_000, outputTokens: i * 30_000,
                   sessionHash: `s0${i}`, model: 'sonnet', phase: 'do' });
  }
  withFakeLedger(entries, (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.top5Costliest.length, 5);
    // Highest first — s07
    assert.equal(r.top5Costliest[0].sessionHash, 's07');
    assert.ok(r.top5Costliest[0].cost > r.top5Costliest[4].cost);
  });
});

// ── 5. CAND-004 OTEL accumulation: byStopReason ──────────────────────────
test('aggregate: byStopReason counts I4-121 stop_reason', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'sonnet', stop_reason: 'end_turn' },
    { inputTokens: 100, outputTokens: 50, model: 'sonnet', stop_reason: 'end_turn' },
    { inputTokens: 100, outputTokens: 50, model: 'sonnet', stop_reason: 'tool_use' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.byStopReason.end_turn, 2);
    assert.equal(r.byStopReason.tool_use, 1);
  });
});

// ── 6. CAND-004 OTEL accumulation: byTool (I6-119 + F8-119) ──────────────
test('aggregate: byTool aggregates I6-119 + F8-119 fields', () => {
  withFakeLedger([
    { inputTokens: 0, outputTokens: 0, model: 'sonnet',
      tool_name: 'Bash', duration_ms: 1000, tool_input_size_bytes: 5000 },
    { inputTokens: 0, outputTokens: 0, model: 'sonnet',
      tool_name: 'Bash', duration_ms: 2000, tool_input_size_bytes: 7000 },
    { inputTokens: 0, outputTokens: 0, model: 'sonnet',
      tool_name: 'Read', duration_ms: 500, tool_input_size_bytes: 100 },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    assert.equal(r.byTool.Bash.calls, 2);
    assert.equal(r.byTool.Bash.avgDurationMs, 1500);
    assert.equal(r.byTool.Bash.totalInputBytes, 12000);
    assert.equal(r.byTool.Read.calls, 1);
    assert.equal(r.byTool.Read.avgDurationMs, 500);
  });
});

// ── 7. since filter ──────────────────────────────────────────────────────
test('aggregate: --since 7d filters older entries', () => {
  const now = Date.now();
  const eightDaysAgo = new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString();
  const recent = new Date(now - 60 * 60 * 1000).toISOString(); // 1h ago
  withFakeLedger([
    { ts: eightDaysAgo, inputTokens: 999, outputTokens: 0, model: 'sonnet' },
    { ts: recent, inputTokens: 100, outputTokens: 50, model: 'sonnet' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger, since: '7d' });
    assert.equal(r.summary.totalTokensIn, 100); // 8-day-old excluded
  });
});

test('aggregate: feature filter narrows by feature name', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'sonnet', feature: 'a' },
    { inputTokens: 200, outputTokens: 80, model: 'sonnet', feature: 'b' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger, feature: 'a' });
    assert.equal(r.summary.totalTokensIn, 100);
  });
});

// ── 8. renderMarkdown smoke ──────────────────────────────────────────────
test('renderMarkdown: includes Summary table and totals', () => {
  withFakeLedger([
    { inputTokens: 1000, outputTokens: 500, model: 'sonnet', phase: 'do', sessionHash: 's01' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    const md = tr.renderMarkdown(r);
    assert.match(md, /# Token Report/);
    assert.match(md, /\| Total Tokens In \| 1,000 \|/);
    assert.match(md, /\| Total Cost \(USD\) \| \$0\.\d+ \|/);
  });
});

test('renderMarkdown: omits OTEL sections when no data', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'sonnet' },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    const md = tr.renderMarkdown(r);
    // No I4-121 / I6-119 sections when those fields absent
    assert.ok(!md.includes('I4-121') || !md.includes('Stop Reason'));
  });
});

test('renderMarkdown: includes OTEL sections when stop_reason + tool data present', () => {
  withFakeLedger([
    { inputTokens: 100, outputTokens: 50, model: 'sonnet',
      stop_reason: 'end_turn', tool_name: 'Bash', duration_ms: 100 },
  ], (ledger) => {
    const r = tr.aggregate({ ledgerPath: ledger });
    const md = tr.renderMarkdown(r);
    assert.match(md, /By Stop Reason.*I4-121/);
    assert.match(md, /By Tool.*I6-119.*F8-119/);
  });
});

// ── 9. sanitizeForOtel 2-gate (CAND-004 v2.1.121 I4-121) ─────────────────
test('sanitizeForOtel: gate 1 OTEL_REDACT=1 strips user_system_prompt', () => {
  const event = { meta: { user_system_prompt: 'secret', tool_name: 'Bash' } };
  const out = telemetry.sanitizeForOtel(event, { OTEL_REDACT: '1' });
  assert.equal(out.meta.user_system_prompt, undefined);
  assert.equal(out.meta.tool_name, '[redacted]');
});

test('sanitizeForOtel: gate 2 default (CC OTEL_LOG_USER_PROMPTS unset) strips user_system_prompt', () => {
  const event = { meta: { user_system_prompt: 'visible' } };
  const out = telemetry.sanitizeForOtel(event, {});
  assert.equal(out.meta.user_system_prompt, undefined);
});

test('sanitizeForOtel: both gates open keeps user_system_prompt', () => {
  const event = { meta: { user_system_prompt: 'visible' } };
  const out = telemetry.sanitizeForOtel(event,
    { OTEL_LOG_USER_PROMPTS: '1' });
  assert.equal(out.meta.user_system_prompt, 'visible');
});

test('sanitizeForOtel: gate 1 strict + gate 2 open still strips (gate 1 wins)', () => {
  const event = { meta: { user_system_prompt: 'should be stripped' } };
  const out = telemetry.sanitizeForOtel(event,
    { OTEL_REDACT: '1', OTEL_LOG_USER_PROMPTS: '1' });
  assert.equal(out.meta.user_system_prompt, undefined);
});

test('sanitizeForOtel: pass-through when no gates set + no sensitive keys', () => {
  const event = { meta: { duration_ms: 1000, tool_input_size_bytes: 500 } };
  const out = telemetry.sanitizeForOtel(event, {});
  assert.equal(out.meta.duration_ms, 1000);
  assert.equal(out.meta.tool_input_size_bytes, 500);
});
