#!/usr/bin/env node
/**
 * plan-plus-stop.js - Plan Plus Skill Stop Hook (v1.5.9)
 *
 * On Plan Plus completion:
 * 1. Output Executive Summary via systemMessage
 * 2. Present Next Action via AskUserQuestion (with preview)
 *
 * @version 1.6.0
 * @module scripts/plan-plus-stop
 */

const { readStdinSync, outputAllow } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull, updatePdcaStatus, extractFeatureFromContext } = require('../lib/pdca/status');
const { buildNextActionQuestion, formatAskUserQuestion } = require('../lib/pdca/automation');
const { generateExecutiveSummary, formatExecutiveSummary } = require('../lib/pdca/executive-summary');
const { createPdcaTaskChain } = require('../lib/task/creator');

debugLog('Skill:plan-plus:Stop', 'Hook started');

let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('Skill:plan-plus:Stop', 'stdin read failed', { error: e.message });
  process.exit(0);
}

const inputText = typeof input === 'string' ? input : JSON.stringify(input);
const currentStatus = getPdcaStatusFull();
const feature = extractFeatureFromContext({ agentOutput: inputText, currentStatus });

if (!feature) {
  outputAllow('Plan Plus completed.', 'Skill:plan-plus:Stop');
  process.exit(0);
}

debugLog('Skill:plan-plus:Stop', 'Feature detected', { feature });

// Update PDCA status
updatePdcaStatus(feature, 'plan', {
  lastAction: 'plan-plus',
  timestamp: new Date().toISOString()
});

// Create Task chain if needed
try {
  const chain = createPdcaTaskChain(feature, { skipIfExists: true });
  if (chain) {
    debugLog('Skill:plan-plus:Stop', 'Task chain created', {
      feature,
      taskCount: chain.entries.length
    });
  }
} catch (e) {
  debugLog('Skill:plan-plus:Stop', 'Task chain creation failed', { error: e.message });
}

// Generate Executive Summary
const summary = generateExecutiveSummary(feature, 'plan-plus');
const summaryText = formatExecutiveSummary(summary, 'full');

// AskUserQuestion (with preview)
const questionPayload = buildNextActionQuestion('plan-plus', feature);
const formatted = formatAskUserQuestion(questionPayload);

// ENH-227 (Issue #77 Phase A): single-source generator
const { generateSessionTitle } = require('../lib/pdca/session-title');
const sessionTitle = generateSessionTitle({ action: 'PLAN', feature });

// Claude Code: JSON output conforming to CC hook output schema
const response = {
  decision: 'allow',
  hookSpecificOutput: {
    hookEventName: 'Skill:plan-plus:Stop',
    additionalContext: [
      `## Plan Plus Completed: ${feature}`,
      '',
      summaryText,
      '',
      `---`,
      '',
      `Plan document has been generated.`,
      `Please select next step.`
    ].join('\n'),
    sessionTitle,
    userPrompt: JSON.stringify(formatted),
  },
};

console.log(JSON.stringify(response));
process.exit(0);
