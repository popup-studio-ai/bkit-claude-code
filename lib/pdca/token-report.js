/**
 * token-report.js — `/pdca token-report` aggregator (FR-δ4).
 *
 * Pure-data helpers that read `.bkit/runtime/token-ledger.ndjson`,
 * aggregate by feature / phase / model / session / stop_reason /
 * tool, and render markdown or JSON output.
 *
 * Read-only. Bounded tail. Supports `--since` time filter and
 * `--all` (include archived features).
 *
 * v2.1.11 CAND-004 (CC v2.1.121 I4-121 + v2.1.119 F8-119/I6-119):
 * three OTEL attributes accumulate as optional aggregates:
 *   - byStopReason   ← I4-121 stop_reason
 *   - byFinishReason ← I4-121 gen_ai.response.finish_reasons
 *   - byTool         ← I6-119 tool_use_id + tool_input_size_bytes
 *                       + F8-119 PostToolUse duration_ms
 *
 * @module lib/pdca/token-report
 * @version 2.1.11
 * @since 2.1.11
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = process.env.CLAUDE_PROJECT_DIR ||
  path.resolve(__dirname, '..', '..');
const LEDGER_PATH = path.join(PROJECT_ROOT, '.bkit', 'runtime', 'token-ledger.ndjson');
const MAX_TAIL_LINES = 100_000; // Hard ceiling against pathological growth

const PRICING_PER_MTOK = Object.freeze({
  // Default Sonnet-class — caller can override via opts.pricing
  'sonnet':  { input: 3.0,   output: 15.0  },
  'opus':    { input: 15.0,  output: 75.0  },
  'haiku':   { input: 0.25,  output: 1.25  },
  'unknown': { input: 3.0,   output: 15.0  },
});

function _readLedger(opts = {}) {
  const target = opts.ledgerPath || LEDGER_PATH;
  if (!fs.existsSync(target)) return [];
  let raw;
  try { raw = fs.readFileSync(target, 'utf8'); } catch { return []; }
  const lines = raw.split(/\r?\n/).filter((l) => l.trim()).slice(-MAX_TAIL_LINES);
  const out = [];
  for (const line of lines) {
    try { out.push(JSON.parse(line)); } catch { /* skip malformed */ }
  }
  return out;
}

function _modelClass(modelId) {
  if (!modelId || typeof modelId !== 'string') return 'unknown';
  if (modelId.includes('opus')) return 'opus';
  if (modelId.includes('sonnet')) return 'sonnet';
  if (modelId.includes('haiku')) return 'haiku';
  return 'unknown';
}

function _costForEntry(entry, pricing) {
  const cls = _modelClass(entry.model);
  const rate = pricing[cls] || pricing.unknown;
  const inP = (Number(entry.inputTokens) || 0) / 1e6 * rate.input;
  const outP = (Number(entry.outputTokens) || 0) / 1e6 * rate.output;
  return inP + outP;
}

function _parseSince(spec) {
  // Accept "7d" / "24h" / "30m" / ISO-8601 / millis-from-epoch
  if (!spec) return null;
  if (/^\d+d$/.test(spec)) return Date.now() - parseInt(spec, 10) * 24 * 60 * 60 * 1000;
  if (/^\d+h$/.test(spec)) return Date.now() - parseInt(spec, 10) * 60 * 60 * 1000;
  if (/^\d+m$/.test(spec)) return Date.now() - parseInt(spec, 10) * 60 * 1000;
  const t = Date.parse(spec);
  if (!Number.isNaN(t)) return t;
  return null;
}

function _filterEntries(entries, opts) {
  let out = entries;
  if (opts.feature) {
    out = out.filter((e) => e.feature === opts.feature);
  }
  if (opts.since) {
    const cutoff = _parseSince(opts.since);
    if (cutoff !== null) {
      out = out.filter((e) => e.ts && Date.parse(e.ts) >= cutoff);
    }
  }
  if (!opts.all) {
    // Default: exclude entries marked archived
    out = out.filter((e) => !e.archived);
  }
  return out;
}

/**
 * Aggregate the ledger into a summary object.
 *
 * @param {{
 *   feature?: string,
 *   all?: boolean,
 *   since?: string,
 *   ledgerPath?: string,
 *   pricing?: object,
 * }} [opts]
 * @returns {object}
 */
function aggregate(opts = {}) {
  const pricing = opts.pricing || PRICING_PER_MTOK;
  const entries = _filterEntries(_readLedger(opts), opts);

  const summary = {
    totalTokensIn: 0, totalTokensOut: 0, totalCost: 0,
    sessionCount: 0, turnCount: 0,
  };
  const byPhase = {};
  const byModel = {};
  const sessions = new Map(); // sessionHash → {tokensIn, tokensOut, cost, phase, feature}
  const byStopReason = {};       // I4-121
  const byFinishReason = {};     // I4-121
  const byTool = {};             // I6-119 + F8-119

  const sessionSet = new Set();

  for (const e of entries) {
    const tIn = Number(e.inputTokens) || 0;
    const tOut = Number(e.outputTokens) || 0;
    const cost = _costForEntry(e, pricing);
    summary.totalTokensIn += tIn;
    summary.totalTokensOut += tOut;
    summary.totalCost += cost;
    summary.turnCount += 1;
    if (e.sessionHash) sessionSet.add(e.sessionHash);

    if (e.phase) {
      const p = byPhase[e.phase] || (byPhase[e.phase] = { tokensIn: 0, tokensOut: 0, cost: 0 });
      p.tokensIn += tIn; p.tokensOut += tOut; p.cost += cost;
    }
    const cls = _modelClass(e.model);
    const m = byModel[cls] || (byModel[cls] = { tokensIn: 0, tokensOut: 0, cost: 0 });
    m.tokensIn += tIn; m.tokensOut += tOut; m.cost += cost;

    if (e.sessionHash) {
      const s = sessions.get(e.sessionHash) || { sessionHash: e.sessionHash, cost: 0,
        phase: e.phase, feature: e.feature };
      s.cost += cost;
      sessions.set(e.sessionHash, s);
    }

    if (e.stop_reason) byStopReason[e.stop_reason] = (byStopReason[e.stop_reason] || 0) + 1;
    if (Array.isArray(e.finish_reasons)) {
      for (const fr of e.finish_reasons) {
        byFinishReason[fr] = (byFinishReason[fr] || 0) + 1;
      }
    }
    if (e.tool_name) {
      const t = byTool[e.tool_name] || (byTool[e.tool_name] = {
        calls: 0, totalDurationMs: 0, totalInputBytes: 0,
      });
      t.calls += 1;
      if (typeof e.duration_ms === 'number') t.totalDurationMs += e.duration_ms;
      if (typeof e.tool_input_size_bytes === 'number') t.totalInputBytes += e.tool_input_size_bytes;
    }
  }

  summary.sessionCount = sessionSet.size;
  summary.totalCost = Math.round(summary.totalCost * 100) / 100;

  // Top 5 costliest
  const top5Costliest = [...sessions.values()]
    .sort((a, b) => b.cost - a.cost)
    .slice(0, 5)
    .map((s) => ({ ...s, cost: Math.round(s.cost * 100) / 100 }));

  // Per-tool averages (I6-119 + F8-119)
  for (const t of Object.keys(byTool)) {
    const e = byTool[t];
    e.avgDurationMs = e.calls > 0 ? Math.round(e.totalDurationMs / e.calls) : 0;
  }

  return {
    feature: opts.feature || null,
    generatedAt: new Date().toISOString(),
    summary,
    byPhase,
    byModel,
    top5Costliest,
    byStopReason,
    byFinishReason,
    byTool,
  };
}

/**
 * Render aggregate as markdown.
 *
 * @param {object} report
 * @returns {string}
 */
function renderMarkdown(report) {
  const lines = [];
  lines.push(`# Token Report — ${report.feature || '(all features)'}`);
  lines.push(`Generated: ${report.generatedAt}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push('| Metric | Value |');
  lines.push('|--------|-------|');
  lines.push(`| Total Tokens In | ${report.summary.totalTokensIn.toLocaleString()} |`);
  lines.push(`| Total Tokens Out | ${report.summary.totalTokensOut.toLocaleString()} |`);
  lines.push(`| Total Cost (USD) | $${report.summary.totalCost.toFixed(2)} |`);
  lines.push(`| Sessions | ${report.summary.sessionCount} |`);
  lines.push(`| Turns | ${report.summary.turnCount} |`);
  lines.push('');

  if (Object.keys(report.byPhase).length > 0) {
    lines.push('## By Phase');
    lines.push('');
    lines.push('| Phase | In | Out | Cost |');
    lines.push('|-------|------|------|------|');
    for (const p of Object.keys(report.byPhase)) {
      const r = report.byPhase[p];
      lines.push(`| ${p} | ${r.tokensIn.toLocaleString()} | ${r.tokensOut.toLocaleString()} | $${r.cost.toFixed(2)} |`);
    }
    lines.push('');
  }

  if (report.top5Costliest.length > 0) {
    lines.push('## Top 5 Costliest Sessions');
    lines.push('');
    lines.push('| # | Session | Phase | Feature | Cost |');
    lines.push('|---|---------|-------|---------|------|');
    report.top5Costliest.forEach((s, i) => {
      lines.push(`| ${i + 1} | ${(s.sessionHash || '?').slice(0, 12)} | ${s.phase || '-'} | ${s.feature || '-'} | $${s.cost.toFixed(2)} |`);
    });
    lines.push('');
  }

  // CAND-004 OTEL extensions (only render when present)
  if (Object.keys(report.byStopReason).length > 0) {
    lines.push('## By Stop Reason (CC v2.1.121 I4-121)');
    lines.push('');
    for (const [k, v] of Object.entries(report.byStopReason)) {
      lines.push(`- ${k}: ${v}`);
    }
    lines.push('');
  }
  if (Object.keys(report.byTool).length > 0) {
    lines.push('## By Tool (CC v2.1.119 I6-119 + F8-119)');
    lines.push('');
    lines.push('| Tool | Calls | Avg Duration (ms) | Total Input Bytes |');
    lines.push('|------|-------|-------------------|-------------------|');
    for (const [tool, t] of Object.entries(report.byTool)) {
      lines.push(`| ${tool} | ${t.calls} | ${t.avgDurationMs} | ${t.totalInputBytes.toLocaleString()} |`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  PRICING_PER_MTOK,
  MAX_TAIL_LINES,
  aggregate,
  renderMarkdown,
};
