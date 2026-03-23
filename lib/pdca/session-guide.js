/**
 * Session Guide Module
 * @module lib/pdca/session-guide
 * @version 1.0.0
 *
 * Context Anchor extraction + module analysis + session split guide.
 * Part of multi-session-incremental feature to reduce handoff context loss.
 */

const path = require('path');

// Lazy require
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

/**
 * Extract Context Anchor (5-line strategic summary) from Plan document.
 * @param {string} planContent - Full Plan document content
 * @returns {{ why: string, who: string, risk: string, success: string, scope: string }}
 */
function extractContextAnchor(planContent) {
  const anchor = { why: '', who: '', risk: '', success: '', scope: '' };

  // WHY: from Executive Summary → Problem row
  const whyMatch = planContent.match(
    /\|\s*\*\*Problem\*\*\s*\|\s*(.+?)\s*\|/
  );
  if (whyMatch) anchor.why = whyMatch[1].trim();

  // WHO: from Target Users table (first data row after header)
  const whoMatch = planContent.match(
    /Target Users[\s\S]*?\|[-\s|]+\|\n\|\s*([^|]+?)\s*\|/
  );
  if (whoMatch) anchor.who = whoMatch[1].trim();

  // RISK: from Risks table (first data row)
  const riskMatch = planContent.match(
    /Risks?\s+and\s+Mitigation[\s\S]*?\|[-\s|]+\|\n\|\s*([^|]+?)\s*\|/
  );
  if (riskMatch) anchor.risk = riskMatch[1].trim();

  // SUCCESS: from Success Criteria (first checkbox item)
  const successMatch = planContent.match(
    /Success Criteria[\s\S]*?- \[.\]\s*(.+?)(?:\n|$)/
  );
  if (successMatch) anchor.success = successMatch[1].trim();

  // SCOPE: from In Scope (first checkbox item)
  const scopeMatch = planContent.match(
    /In Scope[\s\S]*?- \[.\]\s*(.+?)(?:\n|$)/
  );
  if (scopeMatch) anchor.scope = scopeMatch[1].trim();

  return anchor;
}

/**
 * Format Context Anchor as markdown table.
 * @param {{ why: string, who: string, risk: string, success: string, scope: string }} anchor
 * @returns {string} Markdown table
 */
function formatContextAnchor(anchor) {
  return [
    '## Context Anchor',
    '',
    '> Auto-generated from Plan document. Propagated to Design/Do documents.',
    '',
    '| Key | Value |',
    '|-----|-------|',
    `| **WHY** | ${anchor.why || 'N/A'} |`,
    `| **WHO** | ${anchor.who || 'N/A'} |`,
    `| **RISK** | ${anchor.risk || 'N/A'} |`,
    `| **SUCCESS** | ${anchor.success || 'N/A'} |`,
    `| **SCOPE** | ${anchor.scope || 'N/A'} |`,
  ].join('\n');
}

/**
 * Analyze modules from Design document's Implementation Guide.
 * Parses ### Phase N headings or existing Session Guide Module Map.
 * @param {string} designContent - Full Design document content
 * @returns {Array<{ name: string, scopeKey: string, description: string, estimatedTurns: number }>}
 */
function analyzeModules(designContent) {
  const modules = [];

  // Try existing Module Map table first
  const moduleMapMatch = designContent.match(
    /Module Map[\s\S]*?\|[-\s|]+\|([\s\S]*?)(?=\n####|\n##[^#]|\n$)/
  );

  if (moduleMapMatch) {
    const rows = moduleMapMatch[1].split('\n').filter(r => r.includes('|') && !r.match(/^\s*\|[-\s|]+\|/));
    for (const row of rows) {
      const cols = row.split('|').map(c => c.trim()).filter(Boolean);
      // Only accept rows where scope key matches module-N pattern
      if (cols.length >= 4 && /module-\d+/.test(cols[1])) {
        modules.push({
          name: cols[0],
          scopeKey: cols[1].replace(/`/g, ''),
          description: cols[2],
          estimatedTurns: parseInt(cols[3]) || 20
        });
      }
    }
    if (modules.length > 0) return modules;
  }

  // Fallback: parse Implementation Order phases
  const phaseRegex = /###\s+\d+\.\d+\s+Phase\s+\d+:\s*(.+)/g;
  let match;
  let idx = 0;
  while ((match = phaseRegex.exec(designContent)) !== null) {
    idx++;
    modules.push({
      name: match[1].trim(),
      scopeKey: `module-${idx}`,
      description: match[1].trim(),
      estimatedTurns: 20
    });
  }

  // Fallback 2: parse Implementation Order numbered items
  if (modules.length === 0) {
    const orderRegex = /Implementation Order[\s\S]*?(\d+\.\s+\[.\]\s+.+)/g;
    const orderMatch = designContent.match(/Implementation Order[\s\S]*?((?:\d+\.\s+\[.\]\s+.+\n?)+)/);
    if (orderMatch) {
      const items = orderMatch[1].match(/\d+\.\s+\[.\]\s+(.+)/g);
      if (items) {
        items.forEach((item, i) => {
          const name = item.replace(/\d+\.\s+\[.\]\s+/, '').trim();
          modules.push({
            name,
            scopeKey: `module-${i + 1}`,
            description: name,
            estimatedTurns: 20
          });
        });
      }
    }
  }

  return modules;
}

/**
 * Generate session plan from module list.
 * @param {Array<{ name: string, scopeKey: string, estimatedTurns: number }>} modules
 * @param {number} [maxTurnsPerSession=50] - Max turns per session
 * @returns {Array<{ session: number, phase: string, scope: string, turns: number }>}
 */
function suggestSessions(modules, maxTurnsPerSession = 50) {
  const sessions = [
    { session: 1, phase: 'Plan + Design', scope: '전체', turns: 35 }
  ];

  let currentSession = 2;
  let currentTurns = 0;
  let currentScopes = [];

  for (const mod of modules) {
    if (currentTurns + mod.estimatedTurns > maxTurnsPerSession && currentScopes.length > 0) {
      sessions.push({
        session: currentSession,
        phase: 'Do',
        scope: `--scope ${currentScopes.join(',')}`,
        turns: currentTurns
      });
      currentSession++;
      currentTurns = 0;
      currentScopes = [];
    }
    currentScopes.push(mod.scopeKey);
    currentTurns += mod.estimatedTurns;
  }

  if (currentScopes.length > 0) {
    sessions.push({
      session: currentSession,
      phase: 'Do',
      scope: `--scope ${currentScopes.join(',')}`,
      turns: currentTurns
    });
    currentSession++;
  }

  sessions.push({
    session: currentSession,
    phase: 'Check + Report',
    scope: '전체',
    turns: 35
  });

  return sessions;
}

/**
 * Format session plan as markdown table.
 * @param {Array} sessions - suggestSessions() result
 * @returns {string} Markdown table
 */
function formatSessionPlan(sessions) {
  const lines = [
    '#### Recommended Session Plan',
    '',
    '| Session | Phase | Scope | Turns |',
    '|---------|-------|-------|:-----:|',
  ];
  for (const s of sessions) {
    lines.push(`| Session ${s.session} | ${s.phase} | ${s.scope} | ${s.turns} |`);
  }
  return lines.join('\n');
}

/**
 * Format module map as markdown table.
 * @param {Array} modules - analyzeModules() result
 * @returns {string} Markdown table
 */
function formatModuleMap(modules) {
  const lines = [
    '#### Module Map',
    '',
    '| Module | Scope Key | Description | Estimated Turns |',
    '|--------|-----------|-------------|:---------------:|',
  ];
  for (const m of modules) {
    lines.push(`| ${m.name} | \`${m.scopeKey}\` | ${m.description} | ${m.estimatedTurns} |`);
  }
  return lines.join('\n');
}

/**
 * Filter modules by --scope parameter.
 * @param {Array} modules - analyzeModules() result
 * @param {string|null} scopeParam - Comma-separated scope keys (e.g., "module-1,module-2")
 * @returns {{ filtered: Array, notFound: string[] }}
 */
function filterByScope(modules, scopeParam) {
  if (!scopeParam) return { filtered: modules, notFound: [] };

  const scopeKeys = scopeParam.split(',').map(s => s.trim());
  const allKeys = modules.map(m => m.scopeKey);
  const notFound = scopeKeys.filter(k => !allKeys.includes(k));
  const filtered = modules.filter(m => scopeKeys.includes(m.scopeKey));

  return { filtered, notFound };
}

/**
 * Parse --scope value from PDCA arguments string.
 * @param {string} args - Raw arguments (e.g., "feature-name --scope module-1,module-2")
 * @returns {{ feature: string, scope: string|null }}
 */
function parseDoArgs(args) {
  if (!args) return { feature: '', scope: null };

  const scopeMatch = args.match(/--scope\s+([^\s]+)/);
  const scope = scopeMatch ? scopeMatch[1] : null;
  const feature = args.replace(/--scope\s+[^\s]+/, '').trim();

  return { feature, scope };
}

module.exports = {
  extractContextAnchor,
  formatContextAnchor,
  analyzeModules,
  suggestSessions,
  formatSessionPlan,
  formatModuleMap,
  filterByScope,
  parseDoArgs
};
