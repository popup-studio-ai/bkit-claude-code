#!/usr/bin/env node
'use strict';

/**
 * bkit-pdca-server: PDCA status, documents, and metrics MCP server.
 *
 * Lightweight JSON-RPC 2.0 over stdio — no external dependencies.
 * Reads .bkit/ state files and docs/ markdown files.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

const ROOT = process.env.BKIT_ROOT || process.cwd();
const BKIT_DIR = path.join(ROOT, '.bkit');
const DOCS_DIR = path.join(ROOT, 'docs');

const PHASE_MAP = {
  plan: '01-plan',
  design: '02-design',
  analysis: '03-analysis',
  report: '04-report',
};

function statePath(filename) {
  return path.join(BKIT_DIR, 'state', filename);
}

function auditPath(filename) {
  return path.join(BKIT_DIR, 'audit', filename);
}

function docsPath(phase, feature) {
  const dir = PHASE_MAP[phase];
  if (!dir) return null;
  return path.join(DOCS_DIR, dir, 'features', `${feature}.${phase}.md`);
}

function readJsonOrNull(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function readTextOrNull(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return null;
  }
}

function okResponse(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

function errResponse(code, message, details) {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: { code, message, details: details || null } }, null, 2) }],
    isError: true,
  };
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

const TOOLS = [
  {
    name: 'bkit_pdca_status',
    description: 'Read current PDCA status. Optionally filter by feature name for detail.',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Feature name to query. Omit for full summary.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_pdca_history',
    description: 'Read PDCA history events with optional limit and since filters.',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Filter by feature name.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50, description: 'Max items to return.' },
        since: { type: 'string', description: 'ISO datetime — return events after this time.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_feature_list',
    description: 'List active, completed, or archived features.',
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['active', 'completed', 'archived', 'all'], default: 'all' },
        phase: { type: 'string', enum: ['pm', 'plan', 'design', 'do', 'check', 'act', 'report', 'completed', 'archived'] },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_feature_detail',
    description: 'Get detailed info for a single feature (phase, metrics, timestamps, documents).',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Feature name.' },
      },
      required: ['feature'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_plan_read',
    description: 'Read the Plan document (docs/01-plan/features/{feature}.plan.md).',
    inputSchema: {
      type: 'object',
      properties: { feature: { type: 'string' } },
      required: ['feature'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_design_read',
    description: 'Read the Design document (docs/02-design/features/{feature}.design.md).',
    inputSchema: {
      type: 'object',
      properties: { feature: { type: 'string' } },
      required: ['feature'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_analysis_read',
    description: 'Read the Analysis document (docs/03-analysis/{feature}.analysis.md).',
    inputSchema: {
      type: 'object',
      properties: { feature: { type: 'string' } },
      required: ['feature'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_report_read',
    description: 'Read the Report document (docs/04-report/features/{feature}.report.md).',
    inputSchema: {
      type: 'object',
      properties: { feature: { type: 'string' } },
      required: ['feature'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_metrics_get',
    description: 'Get latest quality metrics (M1-M10). Optionally filter by feature.',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Filter metrics for a specific feature.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_metrics_history',
    description: 'Get quality metrics history as a time series.',
    inputSchema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: ['matchRate', 'codeQualityScore', 'criticalIssueCount', 'apiComplianceRate',
                 'runtimeErrorRate', 'p95ResponseTime', 'conventionCompliance',
                 'designCompleteness', 'iterationEfficiency', 'pdcaCycleTimeHours'],
          description: 'Filter to a single metric. Omit for all.',
        },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 30 },
      },
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Resource definitions
// ---------------------------------------------------------------------------

const RESOURCES = [
  {
    uri: 'bkit://pdca/status',
    name: 'PDCA Current Status',
    description: 'Current PDCA status from pdca-status.json.',
    mimeType: 'application/json',
  },
  {
    uri: 'bkit://quality/metrics',
    name: 'Latest Quality Metrics',
    description: 'Latest quality metrics (M1-M10).',
    mimeType: 'application/json',
  },
  {
    uri: 'bkit://audit/latest',
    name: 'Latest Audit Log',
    description: 'Today\'s audit log entries (last 20).',
    mimeType: 'application/json',
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

const ACTIVE_PHASES = new Set(['pm', 'plan', 'design', 'do', 'check', 'act', 'report']);

function handleBkitPdcaStatus(args) {
  const { feature } = args || {};
  const status = readJsonOrNull(statePath('pdca-status.json'));
  if (!status) return okResponse({ version: null, lastUpdated: null, primaryFeature: null, activeFeatures: [], summary: { total: 0, byPhase: {} } });

  if (feature) {
    const f = (status.features || {})[feature];
    if (!f) return errResponse('NOT_FOUND', `Feature not found: ${feature}`);
    return okResponse({
      version: status.version,
      lastUpdated: status.lastUpdated,
      primaryFeature: status.primaryFeature,
      activeFeatures: status.activeFeatures || [],
      feature: { name: feature, ...f },
    });
  }

  const features = status.features || {};
  const byPhase = {};
  for (const f of Object.values(features)) {
    byPhase[f.phase] = (byPhase[f.phase] || 0) + 1;
  }
  return okResponse({
    version: status.version,
    lastUpdated: status.lastUpdated,
    primaryFeature: status.primaryFeature,
    activeFeatures: status.activeFeatures || [],
    summary: { total: Object.keys(features).length, byPhase },
  });
}

function handleBkitPdcaHistory(args) {
  const { feature, limit = 50, since } = args || {};
  const status = readJsonOrNull(statePath('pdca-status.json'));
  if (!status) return okResponse({ total: 0, filtered: 0, items: [] });

  let history = status.history || [];
  if (feature) history = history.filter(h => h.feature === feature);
  if (since) {
    const sinceMs = new Date(since).getTime();
    history = history.filter(h => new Date(h.timestamp).getTime() >= sinceMs);
  }
  const total = (status.history || []).length;
  const filtered = history.length;
  return okResponse({ total, filtered, items: history.slice(-limit) });
}

function handleBkitFeatureList(args) {
  const { status = 'all', phase } = args || {};
  const data = readJsonOrNull(statePath('pdca-status.json'));
  if (!data) return okResponse({ total: 0, features: [] });

  const features = data.features || {};
  let list = Object.entries(features).map(([name, f]) => ({
    name,
    phase: f.phase,
    matchRate: f.matchRate != null ? f.matchRate : null,
    iterationCount: f.iterationCount || 0,
    startedAt: (f.timestamps && f.timestamps.started) || null,
    lastUpdatedAt: (f.timestamps && f.timestamps.lastUpdated) || null,
  }));

  if (status === 'active') list = list.filter(f => ACTIVE_PHASES.has(f.phase));
  else if (status === 'completed') list = list.filter(f => f.phase === 'completed');
  else if (status === 'archived') list = list.filter(f => f.phase === 'archived');

  if (phase) list = list.filter(f => f.phase === phase);
  return okResponse({ total: list.length, features: list });
}

function handleBkitFeatureDetail(args) {
  const { feature } = args || {};
  if (!feature) return errResponse('INVALID_ARGS', 'feature is required');

  const data = readJsonOrNull(statePath('pdca-status.json'));
  if (!data) return errResponse('NOT_FOUND', 'pdca-status.json not found');

  const f = (data.features || {})[feature];
  if (!f) return errResponse('NOT_FOUND', `Feature not found: ${feature}`);

  return okResponse({
    name: feature,
    phase: f.phase,
    phaseNumber: f.phaseNumber != null ? f.phaseNumber : null,
    matchRate: f.matchRate != null ? f.matchRate : null,
    iterationCount: f.iterationCount || 0,
    requirements: f.requirements || [],
    documents: f.documents || {},
    timestamps: f.timestamps || {},
    metrics: f.metrics || null,
  });
}

function handleDocRead(phase, args) {
  const { feature } = args || {};
  if (!feature) return errResponse('INVALID_ARGS', 'feature is required');

  const filePath = docsPath(phase, feature);
  if (!filePath) return errResponse('INVALID_ARGS', `Unknown phase: ${phase}`);

  const content = readTextOrNull(filePath);
  if (content === null) return errResponse('NOT_FOUND', `Document not found: ${filePath}`);

  return okResponse({
    feature,
    phase,
    filePath,
    content,
    sizeBytes: Buffer.byteLength(content, 'utf8'),
  });
}

function handleBkitMetricsGet(args) {
  const { feature } = args || {};
  const data = readJsonOrNull(statePath('quality-metrics.json'));
  if (!data) {
    return okResponse({
      version: '2.0',
      collectedAt: null,
      metrics: {},
      thresholds: {
        matchRate: 90, codeQualityScore: 70, criticalIssueCount: 0,
        apiComplianceRate: 95, runtimeErrorRate: 1, p95ResponseTime: 1000,
        conventionCompliance: 90, designCompleteness: 85,
      },
    });
  }

  if (feature && data.byFeature) {
    const fm = data.byFeature[feature];
    if (!fm) return errResponse('NOT_FOUND', `No metrics for feature: ${feature}`);
    const result = Object.assign({}, data, { metrics: fm });
    delete result.byFeature;
    return okResponse(result);
  }

  return okResponse(data);
}

function handleBkitMetricsHistory(args) {
  const { metric, limit = 30 } = args || {};
  const data = readJsonOrNull(statePath('quality-history.json'));
  if (!data) return okResponse({ metric: metric || null, total: 0, items: [] });

  let items = data.history || [];
  if (metric) {
    items = items.map(entry => ({
      timestamp: entry.timestamp,
      feature: entry.feature,
      values: { [metric]: (entry.values && entry.values[metric]) != null ? entry.values[metric] : null },
    }));
  }
  return okResponse({ metric: metric || null, total: (data.history || []).length, items: items.slice(-limit) });
}

// ---------------------------------------------------------------------------
// Resource handlers
// ---------------------------------------------------------------------------

function handleResourcePdcaStatus() {
  const data = readJsonOrNull(statePath('pdca-status.json')) || {};
  return {
    contents: [{
      uri: 'bkit://pdca/status',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

function handleResourceQualityMetrics() {
  const data = readJsonOrNull(statePath('quality-metrics.json')) || { metrics: {} };
  return {
    contents: [{
      uri: 'bkit://quality/metrics',
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
}

function handleResourceAuditLatest() {
  const today = new Date().toISOString().slice(0, 10);
  const filePath = auditPath(`${today}.jsonl`);
  let entries = [];

  if (fs.existsSync(filePath)) {
    const lines = fs.readFileSync(filePath, 'utf8').split('\n').filter(Boolean);
    entries = lines.map(line => {
      try { return JSON.parse(line); } catch { return null; }
    }).filter(Boolean);
  }

  return {
    contents: [{
      uri: 'bkit://audit/latest',
      mimeType: 'application/json',
      text: JSON.stringify({ date: today, total: entries.length, entries: entries.slice(-20) }, null, 2),
    }],
  };
}

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

const TOOL_HANDLERS = {
  bkit_pdca_status: handleBkitPdcaStatus,
  bkit_pdca_history: handleBkitPdcaHistory,
  bkit_feature_list: handleBkitFeatureList,
  bkit_feature_detail: handleBkitFeatureDetail,
  bkit_plan_read: (args) => handleDocRead('plan', args),
  bkit_design_read: (args) => handleDocRead('design', args),
  bkit_analysis_read: (args) => handleDocRead('analysis', args),
  bkit_report_read: (args) => handleDocRead('report', args),
  bkit_metrics_get: handleBkitMetricsGet,
  bkit_metrics_history: handleBkitMetricsHistory,
};

const RESOURCE_HANDLERS = {
  'bkit://pdca/status': handleResourcePdcaStatus,
  'bkit://quality/metrics': handleResourceQualityMetrics,
  'bkit://audit/latest': handleResourceAuditLatest,
};

// ---------------------------------------------------------------------------
// JSON-RPC 2.0 message handling
// ---------------------------------------------------------------------------

function jsonRpcOk(id, result) {
  return { jsonrpc: '2.0', id, result };
}

function jsonRpcError(id, code, message) {
  return { jsonrpc: '2.0', id, error: { code, message } };
}

function handleMessage(msg) {
  const { id, method, params } = msg;

  // Notifications (no id) — ignore
  if (id === undefined && method === 'notifications/initialized') return null;
  if (id === undefined) return null;

  switch (method) {
    case 'initialize':
      return jsonRpcOk(id, {
        protocolVersion: '2024-11-05',
        serverInfo: { name: 'bkit-pdca-server', version: '2.0.3' },
        capabilities: { tools: {}, resources: {} },
      });

    case 'tools/list':
      return jsonRpcOk(id, { tools: TOOLS });

    case 'tools/call': {
      const { name, arguments: args } = params || {};
      const handler = TOOL_HANDLERS[name];
      if (!handler) {
        return jsonRpcOk(id, errResponse('NOT_FOUND', `Unknown tool: ${name}`));
      }
      try {
        return jsonRpcOk(id, handler(args || {}));
      } catch (err) {
        return jsonRpcOk(id, errResponse('IO_ERROR', err.message));
      }
    }

    case 'resources/list':
      return jsonRpcOk(id, { resources: RESOURCES });

    case 'resources/read': {
      const { uri } = params || {};
      const handler = RESOURCE_HANDLERS[uri];
      if (!handler) {
        return jsonRpcError(id, -32602, `Unknown resource: ${uri}`);
      }
      try {
        return jsonRpcOk(id, handler());
      } catch (err) {
        return jsonRpcError(id, -32603, err.message);
      }
    }

    default:
      return jsonRpcError(id, -32601, `Method not found: ${method}`);
  }
}

// ---------------------------------------------------------------------------
// stdio transport
// ---------------------------------------------------------------------------

const rl = readline.createInterface({ input: process.stdin, terminal: false });

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const msg = JSON.parse(line);
    const response = handleMessage(msg);
    if (response) {
      process.stdout.write(JSON.stringify(response) + '\n');
    }
  } catch {
    // Ignore malformed JSON input
  }
});

rl.on('close', () => {
  process.exit(0);
});

process.stderr.write('[bkit-pdca-server] Started (pid=' + process.pid + ')\n');
