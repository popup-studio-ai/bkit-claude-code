/**
 * Invariant Checker — Detects invariant violations in modified code
 * @module lib/context/invariant-checker
 * @version 3.0.0
 *
 * Checks if code changes violate critical business rules.
 * Critical violations block Self-Healing fixes → escalation to human.
 */
const fs = require('fs');

let _loader = null;
function getLoader() {
  if (!_loader) { _loader = require('./context-loader'); }
  return _loader;
}

/**
 * Check invariants for a given file
 * @param {string} filePath - Modified file path
 * @param {string} changedCode - New code content (optional, for static analysis)
 * @returns {CheckResult}
 */
async function checkInvariants(filePath, changedCode = '') {
  const invariants = await getLoader().loadInvariants(filePath);

  if (invariants.length === 0) {
    return { violations: [], hasCritical: false, hasWarning: false, summary: 'No invariants defined for this file.' };
  }

  const violations = [];

  for (const inv of invariants) {
    const violation = analyzeViolation(inv, changedCode, filePath);
    if (violation) {
      violations.push({
        invariant_id: inv.id,
        rule: inv.rule,
        severity: inv.severity,
        category: inv.category || 'unknown',
        detail: violation.detail,
        check: inv.check,
      });
    }
  }

  const hasCritical = violations.some(v => v.severity === 'critical');
  const hasWarning = violations.some(v => v.severity === 'warning');

  return {
    violations,
    hasCritical,
    hasWarning,
    summary: formatCheckSummary(violations, hasCritical, hasWarning),
  };
}

/**
 * Analyze if a specific invariant might be violated
 * Uses heuristic pattern matching on the changed code
 */
function analyzeViolation(invariant, changedCode, filePath) {
  if (!changedCode) return null;

  const check = (invariant.check || '').toLowerCase();
  const code = changedCode.toLowerCase();

  // Pattern-based heuristic checks
  // These are conservative — flag potential issues for human review

  // Check for negative balance patterns
  if (check.includes('balance') && check.includes('>= 0')) {
    if (code.includes('balance -') || code.includes('balance -=') || code.includes('-= balance')) {
      // v2.1.8 fix B16: word boundary prevents substring match (gift/diff/lifetime)
      const hasIfStatement = /\bif\b/.test(code);
      // v2.1.8 fix B16: word-boundary guards for balance comparisons (avoid e.g. `oldbalance >= `)
      const hasBalanceGte = /\bbalance\s*>=\s*/.test(code);
      const hasBalanceGt = /\bbalance\s*>\s*/.test(code);
      // v2.1.8 fix B10: explicit parens document precedence (&& binds tighter than ||).
      // Intent: flag violation when guard is absent. A proper guard requires both
      // an `if` statement AND at least one of `balance >= ` / `balance > ` comparisons.
      // Equivalent to: !(hasIf && (hasGte || hasGt)).
      if (!hasIfStatement || (!hasBalanceGte && !hasBalanceGt)) {
        return { detail: 'Balance modification detected without guard check. Verify balance >= 0 is enforced.' };
      }
    }
  }

  // Check for state machine ordering
  if (check.includes('stateindex') || check.includes('state') && check.includes('index')) {
    if (code.includes('state =') || code.includes('setstatus') || code.includes('setstate')) {
      return { detail: 'State transition detected. Verify ordering constraint is maintained.' };
    }
  }

  // Check for response time constraints
  if (check.includes('responsetime') || check.includes('timeout')) {
    if (code.includes('settimeout') || code.includes('delay') || code.includes('sleep')) {
      return { detail: 'Delay/timeout pattern detected. Verify performance constraint is met.' };
    }
  }

  return null;
}

/**
 * Check if any result has critical violations (blocks Self-Healing)
 */
function isCriticalViolation(result) {
  return result && result.hasCritical === true;
}

/**
 * Format check results into summary string
 */
function formatCheckSummary(violations, hasCritical, hasWarning) {
  if (violations.length === 0) return 'All invariants passed.';

  const parts = [];
  if (hasCritical) {
    parts.push(`CRITICAL VIOLATIONS (${violations.filter(v => v.severity === 'critical').length}):`);
    for (const v of violations.filter(v => v.severity === 'critical')) {
      parts.push(`  [BLOCK] ${v.invariant_id}: ${v.rule}`);
      parts.push(`          ${v.detail}`);
    }
  }
  if (hasWarning) {
    parts.push(`Warnings (${violations.filter(v => v.severity === 'warning').length}):`);
    for (const v of violations.filter(v => v.severity === 'warning')) {
      parts.push(`  [WARN] ${v.invariant_id}: ${v.rule}`);
    }
  }
  return parts.join('\n');
}

module.exports = {
  checkInvariants,
  isCriticalViolation,
  analyzeViolation,
  formatCheckSummary,
};
