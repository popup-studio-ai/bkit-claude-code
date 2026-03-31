#!/usr/bin/env node
/**
 * Destructive Operation Detector (FR-10)
 * Detects destructive operations before execution using 8 guardrail rules.
 *
 * Rules G-001 to G-008 cover recursive delete, force push, hard reset,
 * protected branch modification, env file modification, secret key access,
 * mass file deletion, and root directory operations.
 *
 * @version 2.0.0
 * @module lib/control/destructive-detector
 *
 * Design Ref: ENH-168 — CC v2.1.87 native isDestructive() API
 * CC Tool.isDestructive() can supplement regex-based detection.
 * Current approach: bkit regex rules (G-001~G-008) as PRIMARY
 * Future: CC native API as SECONDARY fast-path check
 * Migration path: When CC exposes isDestructive() to plugins,
 * add: if (tool.isDestructive?.()) return { action: 'deny' }
 * before regex evaluation for O(1) check.
 */

/**
 * @typedef {Object} GuardrailRule
 * @property {string} id - Rule identifier (G-001 to G-008)
 * @property {string} name - Human-readable rule name
 * @property {RegExp} pattern - Detection pattern
 * @property {'critical'|'high'|'medium'} severity - Rule severity
 * @property {'deny'|'ask'|'allow'} defaultAction - Default action when triggered
 */

/**
 * @typedef {Object} DetectionResult
 * @property {boolean} detected - Whether a destructive operation was detected
 * @property {Array<{id: string, name: string, severity: string, pattern: string}>} rules - Matched rules
 * @property {number} confidence - Detection confidence 0-1
 */

/**
 * Guardrail rules for destructive operation detection
 * @type {GuardrailRule[]}
 */
const GUARDRAIL_RULES = [
  {
    id: 'G-001',
    name: 'Recursive delete',
    pattern: /\b(rm\s+-(r|rf|fr)\b|rm\s+--recursive|rimraf|shutil\.rmtree|Remove-Item\s+-Recurse)/i,
    severity: 'critical',
    defaultAction: 'deny'
  },
  {
    id: 'G-002',
    name: 'Force push',
    pattern: /\bgit\s+push\s+.*(-f|--force|--force-with-lease)\b/i,
    severity: 'critical',
    defaultAction: 'deny'
  },
  {
    id: 'G-003',
    name: 'Hard reset',
    pattern: /\bgit\s+reset\s+--hard\b/i,
    severity: 'high',
    defaultAction: 'ask'
  },
  {
    id: 'G-004',
    name: 'Protected branch modification',
    pattern: /\bgit\s+(commit|merge|rebase|push)\b.*\b(main|master|release|production)\b/i,
    severity: 'high',
    defaultAction: 'ask'
  },
  {
    id: 'G-005',
    name: 'Environment file modification',
    pattern: /\b(\.env|\.env\.\w+)\b/i,
    severity: 'high',
    defaultAction: 'ask'
  },
  {
    id: 'G-006',
    name: 'Secret key access',
    pattern: /\b[\w/.-]+(\.key|\.pem|\.p12|\.pfx|\.jks|\.keystore)\b/i,
    severity: 'high',
    defaultAction: 'ask'
  },
  {
    id: 'G-007',
    name: 'Mass file deletion',
    pattern: /\b(rm|del|delete|remove)\b.*(\s+\S+){5,}/i,
    severity: 'medium',
    defaultAction: 'ask'
  },
  {
    id: 'G-008',
    name: 'Root directory operations',
    pattern: /\b(rm|mv|cp|chmod|chown)\s+.*\s+\/\s*$/,
    severity: 'critical',
    defaultAction: 'deny'
  }
];

/**
 * Detect destructive operations in a tool invocation
 * @param {string} toolName - Name of the tool being invoked
 * @param {string} toolInput - Tool input or command string
 * @returns {DetectionResult}
 */
function detect(toolName, toolInput) {
  const input = typeof toolInput === 'string' ? toolInput : JSON.stringify(toolInput || '');
  const matchedRules = [];

  for (const rule of GUARDRAIL_RULES) {
    if (rule.pattern.test(input)) {
      matchedRules.push({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        pattern: rule.pattern.source
      });
    }
  }

  // Also check tool-specific destructive patterns
  if (toolName === 'Write' || toolName === 'Edit') {
    // Check G-005 and G-006 for file operations
    const envMatch = GUARDRAIL_RULES.find(r => r.id === 'G-005');
    const keyMatch = GUARDRAIL_RULES.find(r => r.id === 'G-006');
    if (envMatch && envMatch.pattern.test(input) && !matchedRules.some(r => r.id === 'G-005')) {
      matchedRules.push({ id: 'G-005', name: envMatch.name, severity: envMatch.severity, pattern: envMatch.pattern.source });
    }
    if (keyMatch && keyMatch.pattern.test(input) && !matchedRules.some(r => r.id === 'G-006')) {
      matchedRules.push({ id: 'G-006', name: keyMatch.name, severity: keyMatch.severity, pattern: keyMatch.pattern.source });
    }
  }

  const confidence = matchedRules.length > 0
    ? Math.min(1, 0.5 + matchedRules.length * 0.2)
    : 0;

  return {
    detected: matchedRules.length > 0,
    rules: matchedRules,
    confidence
  };
}

/**
 * Quick check whether a Bash command is destructive
 * @param {string} command - Bash command string
 * @returns {boolean}
 */
function isDestructive(command) {
  if (!command || typeof command !== 'string') return false;
  return GUARDRAIL_RULES.some(rule => rule.pattern.test(command));
}

/**
 * Generate a human-readable block message for matched rules
 * @param {Array<{id: string, name: string, severity: string, pattern: string}>} rules - Matched rules
 * @returns {string}
 */
function getBlockMessage(rules) {
  if (!rules || rules.length === 0) {
    return 'No destructive operations detected.';
  }

  const lines = [
    '⛔ Destructive operation blocked by bkit guardrails:',
    ''
  ];

  for (const rule of rules) {
    const severityTag = rule.severity === 'critical' ? '[CRITICAL]'
      : rule.severity === 'high' ? '[HIGH]'
        : '[MEDIUM]';
    lines.push(`  ${severityTag} ${rule.id}: ${rule.name}`);
  }

  lines.push('');
  lines.push('To proceed, adjust guardrail settings in bkit.config.json or use manual override.');

  return lines.join('\n');
}

/**
 * Get the default action for a specific rule
 * @param {string} ruleId - Rule ID (e.g., 'G-001')
 * @returns {'deny'|'ask'|'allow'|null}
 */
function getRuleAction(ruleId) {
  const rule = GUARDRAIL_RULES.find(r => r.id === ruleId);
  return rule ? rule.defaultAction : null;
}

/**
 * Get all guardrail rules
 * @returns {GuardrailRule[]}
 */
function getRules() {
  return GUARDRAIL_RULES.map(r => ({
    id: r.id,
    name: r.name,
    severity: r.severity,
    defaultAction: r.defaultAction,
    pattern: r.pattern.source
  }));
}

/**
 * Add a custom guardrail rule at runtime
 * @param {{ id: string, name: string, severity: string, pattern: RegExp, defaultAction: string }} rule
 */
function addCustomRule(rule) {
  if (!rule || !rule.id || !rule.pattern) return;
  const existing = GUARDRAIL_RULES.find(r => r.id === rule.id);
  if (!existing) {
    GUARDRAIL_RULES.push(rule);
  }
}

/**
 * Disable a guardrail rule by ID
 * @param {string} ruleId - Rule ID to disable
 * @param {string} [reason] - Reason for disabling
 * @returns {boolean} True if rule was found and disabled
 */
function disableRule(ruleId, reason) {
  const rule = GUARDRAIL_RULES.find(r => r.id === ruleId);
  if (rule) {
    rule._disabled = true;
    rule._disableReason = reason || 'unknown';
    return true;
  }
  return false;
}

module.exports = {
  detect,
  isDestructive,
  getBlockMessage,
  getRuleAction,
  getRules,
  addCustomRule,
  disableRule,
  GUARDRAIL_RULES
};
