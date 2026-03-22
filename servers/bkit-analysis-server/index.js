#!/usr/bin/env node
'use strict';

/**
 * bkit-analysis-server: Code analysis, gap detection, checkpoints, and audit MCP server.
 *
 * Lightweight JSON-RPC 2.0 over stdio — no external dependencies.
 * Reads .bkit/ state, checkpoints, and audit files.
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

function statePath(filename) {
  return path.join(BKIT_DIR, 'state', filename);
}

function auditDir() {
  return path.join(BKIT_DIR, 'audit');
}

function checkpointsDir() {
  return path.join(BKIT_DIR, 'checkpoints');
}

function readJsonOrNull(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Read a single JSONL file and return array of parsed objects.
 */
function readJsonLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    return fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .filter(Boolean)
      .map(line => { try { return JSON.parse(line); } catch { return null; } })
      .filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Read all JSONL files in a directory, sorted by filename (date order).
 */
function readAllJsonLines(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  try {
    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.jsonl')).sort();
    return files.flatMap(f => readJsonLines(path.join(dirPath, f)));
  } catch {
    return [];
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
    name: 'bkit_code_quality',
    description: 'Read code quality analysis results from quality-metrics.json. Optionally filter by feature.',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Filter results for a specific feature.' },
        includeIssues: { type: 'boolean', default: true, description: 'Include individual issue list.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_gap_analysis',
    description: 'Read latest gap analysis results (design-implementation mismatches).',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Filter by feature name.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 10, description: 'Max gap items to return.' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_regression_rules',
    description: 'List or add regression prevention rules. action=list to query, action=add to add a new rule.',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['list', 'add'], default: 'list' },
        category: { type: 'string', description: 'Filter rules by category (list mode).' },
        rule: {
          type: 'object',
          description: 'Rule definition (required for action=add).',
          properties: {
            id: { type: 'string' },
            category: { type: 'string' },
            description: { type: 'string' },
            pattern: { type: 'string', description: 'Violation detection pattern (regex or natural language).' },
            severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
          },
          required: ['id', 'category', 'description', 'severity'],
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_checkpoint_list',
    description: 'List saved checkpoints. Optionally filter by feature.',
    inputSchema: {
      type: 'object',
      properties: {
        feature: { type: 'string', description: 'Filter checkpoints by feature.' },
        limit: { type: 'integer', minimum: 1, maximum: 50, default: 20 },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_checkpoint_detail',
    description: 'Get detailed information for a specific checkpoint.',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Checkpoint ID (cp-{timestamp}).' },
      },
      required: ['id'],
      additionalProperties: false,
    },
  },
  {
    name: 'bkit_audit_search',
    description: 'Search audit logs by date range, feature, action type, or full-text query.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Full-text search (case-insensitive).' },
        feature: { type: 'string', description: 'Filter by feature name.' },
        action: { type: 'string', description: 'Filter by action type (e.g., tool_call, phase_transition, decision).' },
        dateFrom: { type: 'string', description: 'YYYY-MM-DD. Only logs on or after this date.' },
        dateTo: { type: 'string', description: 'YYYY-MM-DD. Only logs on or before this date.' },
        limit: { type: 'integer', minimum: 1, maximum: 200, default: 50 },
      },
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Tool handlers
// ---------------------------------------------------------------------------

function handleCodeQuality(args) {
  const { feature, includeIssues = true } = args || {};
  const data = readJsonOrNull(statePath('quality-metrics.json'));
  if (!data) {
    return okResponse({ analyzedAt: null, feature: feature || null, overallScore: null, summary: { critical: 0, warning: 0, info: 0 }, issues: [] });
  }

  let overallScore = (data.metrics && data.metrics.codeQualityScore) || null;
  if (feature && data.byFeature) {
    const fm = data.byFeature[feature];
    if (!fm) return errResponse('NOT_FOUND', `No metrics for feature: ${feature}`);
    overallScore = fm.codeQualityScore || null;
  }

  const result = {
    analyzedAt: data.collectedAt || null,
    feature: feature || null,
    overallScore,
    summary: data.issueSummary || { critical: 0, warning: 0, info: 0 },
    issues: [],
  };

  if (includeIssues) {
    if (feature && data.issuesByFeature) {
      result.issues = data.issuesByFeature[feature] || [];
    } else {
      result.issues = data.issues || [];
    }
  }

  return okResponse(result);
}

function handleGapAnalysis(args) {
  const { feature, limit = 10 } = args || {};
  const data = readJsonOrNull(statePath('gap-analysis.json'));
  if (!data) {
    return okResponse({ feature: feature || null, analyzedAt: null, matchRate: null, totalGaps: 0, gaps: [] });
  }

  let gaps;
  let matchRate;
  if (feature && data.byFeature) {
    const fd = data.byFeature[feature];
    gaps = (fd && fd.gaps) || [];
    matchRate = (fd && fd.matchRate) != null ? fd.matchRate : null;
  } else {
    gaps = data.gaps || [];
    matchRate = data.matchRate != null ? data.matchRate : null;
  }

  return okResponse({
    feature: feature || null,
    analyzedAt: data.analyzedAt || null,
    matchRate,
    totalGaps: gaps.length,
    gaps: gaps.slice(0, limit),
  });
}

function handleRegressionRules(args) {
  const { action = 'list', category, rule } = args || {};
  const rulesPath = statePath('regression-rules.json');
  const data = readJsonOrNull(rulesPath) || { version: '2.0', rules: [] };

  if (action === 'add') {
    if (!rule) return errResponse('INVALID_ARGS', 'rule object is required for action=add');
    if (!rule.id || !rule.category || !rule.description || !rule.severity) {
      return errResponse('INVALID_ARGS', 'rule must have id, category, description, and severity');
    }
    const exists = data.rules.find(r => r.id === rule.id);
    if (exists) return errResponse('INVALID_ARGS', `Rule already exists: ${rule.id}`);

    data.rules.push({
      id: rule.id,
      category: rule.category,
      description: rule.description,
      pattern: rule.pattern || null,
      severity: rule.severity,
      addedAt: new Date().toISOString(),
      violationCount: 0,
    });

    // Ensure state directory exists before writing
    const stateDir = path.join(BKIT_DIR, 'state');
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    fs.writeFileSync(rulesPath, JSON.stringify(data, null, 2));
    return okResponse({ added: true, rule: data.rules[data.rules.length - 1] });
  }

  // action === 'list'
  let rules = data.rules;
  if (category) rules = rules.filter(r => r.category === category);
  return okResponse({ total: rules.length, rules });
}

function handleCheckpointList(args) {
  const { feature, limit = 20 } = args || {};
  const cpDir = checkpointsDir();
  if (!fs.existsSync(cpDir)) {
    return okResponse({ total: 0, checkpoints: [] });
  }

  let files;
  try {
    files = fs.readdirSync(cpDir).filter(f => f.endsWith('.json')).sort().reverse();
  } catch {
    return okResponse({ total: 0, checkpoints: [] });
  }

  let checkpoints = files.map(f => {
    try {
      const meta = JSON.parse(fs.readFileSync(path.join(cpDir, f), 'utf8'));
      return {
        id: meta.id,
        feature: meta.feature,
        phase: meta.phase,
        type: meta.type,
        createdAt: meta.createdAt,
        description: meta.description || '',
        filesCount: (meta.files || []).length,
      };
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (feature) checkpoints = checkpoints.filter(c => c.feature === feature);
  checkpoints = checkpoints.slice(0, limit);
  return okResponse({ total: checkpoints.length, checkpoints });
}

function handleCheckpointDetail(args) {
  const { id } = args || {};
  if (!id) return errResponse('INVALID_ARGS', 'id is required');

  const cpPath = path.join(checkpointsDir(), `${id}.json`);
  if (!fs.existsSync(cpPath)) {
    return errResponse('NOT_FOUND', `Checkpoint not found: ${id}`);
  }

  try {
    const data = JSON.parse(fs.readFileSync(cpPath, 'utf8'));
    return okResponse(data);
  } catch (err) {
    return errResponse('PARSE_ERROR', `Failed to parse checkpoint: ${err.message}`);
  }
}

function handleAuditSearch(args) {
  const { query, feature, action, dateFrom, dateTo, limit = 50 } = args || {};
  const dir = auditDir();
  let entries = readAllJsonLines(dir);

  if (feature) entries = entries.filter(e => e.feature === feature);
  if (action) entries = entries.filter(e => e.action === action);
  if (dateFrom) entries = entries.filter(e => e.timestamp >= dateFrom);
  if (dateTo) entries = entries.filter(e => e.timestamp <= dateTo + 'T23:59:59Z');
  if (query) {
    const q = query.toLowerCase();
    entries = entries.filter(e => JSON.stringify(e).toLowerCase().includes(q));
  }

  const total = entries.length;
  const returned = Math.min(total, limit);
  return okResponse({ total, returned, entries: entries.slice(-limit) });
}

// ---------------------------------------------------------------------------
// Tool dispatch
// ---------------------------------------------------------------------------

const TOOL_HANDLERS = {
  bkit_code_quality: handleCodeQuality,
  bkit_gap_analysis: handleGapAnalysis,
  bkit_regression_rules: handleRegressionRules,
  bkit_checkpoint_list: handleCheckpointList,
  bkit_checkpoint_detail: handleCheckpointDetail,
  bkit_audit_search: handleAuditSearch,
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
        serverInfo: { name: 'bkit-analysis-server', version: '2.0.3' },
        capabilities: { tools: {} },
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

process.stderr.write('[bkit-analysis-server] Started (pid=' + process.pid + ')\n');
