#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v2.0.0)
 *
 * Thin orchestrator that delegates to startup modules:
 *   1. migration   - Legacy path migration (docs/ -> .bkit/)
 *   2. restore     - PLUGIN_DATA backup restoration
 *   3. contextInit - Context Hierarchy, Memory Store, Import Resolver, Fork cleanup, ensureBkitDirs
 *   4. onboarding  - Onboarding message generation, env vars, trigger table
 *   5. sessionCtx  - additionalContext string building for hook output
 *   6. dashboard   - PDCA progress bar rendering (prepended to additionalContext)
 *   7. workflowMap - v2.0.0 Workflow map rendering (PDCA phase visualization)
 *   8. controlPanel- v2.0.0 Control panel rendering (automation level display)
 *   9. staleDetect - v2.0.0 Stale feature detection (lifecycle.js)
 */

const { BKIT_PLATFORM } = require('../lib/core/platform');
const { debugLog } = require('../lib/core/debug');

// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// --- 1. Migration: Legacy path migration ---
const migration = require('./startup/migration');
try {
  migration.run();
} catch (e) {
  debugLog('SessionStart', 'Migration module failed', { error: e.message });
}

// --- 2. Restore: PLUGIN_DATA backup restoration ---
const restore = require('./startup/restore');
try {
  restore.run();
} catch (e) {
  debugLog('SessionStart', 'Restore module failed', { error: e.message });
}

// --- 3. Context Init: Hierarchy, Memory, Imports, Forks ---
const contextInit = require('./startup/context-init');
try {
  contextInit.run();
} catch (e) {
  debugLog('SessionStart', 'Context init module failed', { error: e.message });
}

// --- 4. Onboarding: Messages, env vars, trigger table ---
const onboarding = require('./startup/onboarding');
let onboardingContext = { onboardingData: { type: 'new_user', hasExistingWork: false }, triggerTable: '' };
try {
  onboardingContext = onboarding.run();
} catch (e) {
  debugLog('SessionStart', 'Onboarding module failed', { error: e.message });
}

// --- 5. Session Context: Build additionalContext string ---
const sessionContext = require('./startup/session-context');
let additionalContext = '';
try {
  additionalContext = sessionContext.build(null, onboardingContext);
} catch (e) {
  debugLog('SessionStart', 'Session context module failed', { error: e.message });
}

// --- v2.1.1 UI-02: Build dashboard sections in correct display order ---
// Order: Session Context → Progress Bar → Workflow Map → Impact View → Agent Panel → Control Panel
const dashboardSections = [];

// Session Context is already in additionalContext (base content)
// It will be placed first in the final output

let pdcaStatus = null;
let agentState = null;

// Load shared state once
try {
  const { getPdcaStatusFull } = require('../lib/pdca/status');
  pdcaStatus = getPdcaStatusFull();
} catch (_) {}

try {
  const fs = require('fs');
  const agentStatePath = require('path').resolve(process.cwd(), '.bkit/runtime/agent-state.json');
  if (fs.existsSync(agentStatePath)) {
    agentState = JSON.parse(fs.readFileSync(agentStatePath, 'utf-8'));
  }
} catch (_) { /* non-critical */ }

if (pdcaStatus && pdcaStatus.primaryFeature) {
  // 6. Progress Bar
  try {
    const { renderPdcaProgressBar } = require('../lib/ui/progress-bar');
    const dashboardBar = renderPdcaProgressBar(pdcaStatus, { compact: false });
    if (dashboardBar) dashboardSections.push(dashboardBar);
  } catch (e) {
    debugLog('SessionStart', 'PDCA dashboard rendering failed', { error: e.message });
  }

  // 7. Workflow Map
  try {
    const { renderWorkflowMap } = require('../lib/ui/workflow-map');
    const workflowMap = renderWorkflowMap(pdcaStatus, agentState, {
      feature: pdcaStatus.primaryFeature,
      showIteration: false,
      showBranch: false
    });
    if (workflowMap) dashboardSections.push(workflowMap);
  } catch (e) {
    debugLog('SessionStart', 'v2.0.0 workflow map rendering failed', { error: e.message });
  }

  // 7.1 v2.1.1 UI-01: Impact View
  try {
    const { renderImpactView } = require('../lib/ui/impact-view');
    const impactView = renderImpactView(pdcaStatus, null, {});
    if (impactView) dashboardSections.push(impactView);
  } catch (e) {
    debugLog('SessionStart', 'v2.1.1 impact view rendering failed', { error: e.message });
  }

  // 7.2 v2.1.1 UI-01: Agent Panel (skip when inactive to save ~300 tokens)
  if (agentState && agentState.enabled) {
    try {
      const { renderAgentPanel } = require('../lib/ui/agent-panel');
      const agentPanel = renderAgentPanel(agentState, {});
      if (agentPanel) dashboardSections.push(agentPanel);
    } catch (e) {
      debugLog('SessionStart', 'v2.1.1 agent panel rendering failed', { error: e.message });
    }
  }

  // 8. Control Panel (last in dashboard)
  try {
    const { renderControlPanel } = require('../lib/ui/control-panel');
    let controlState = null;
    try {
      const fs = require('fs');
      const controlStatePath = require('path').resolve(process.cwd(), '.bkit/runtime/control-state.json');
      if (fs.existsSync(controlStatePath)) {
        controlState = JSON.parse(fs.readFileSync(controlStatePath, 'utf-8'));
      }
    } catch (_) { /* non-critical */ }

    const controlPanel = renderControlPanel(controlState, null, {
      showShortcuts: false,
      showApprovals: true
    });
    if (controlPanel) dashboardSections.push(controlPanel);
  } catch (e) {
    debugLog('SessionStart', 'v2.0.0 control panel rendering failed', { error: e.message });
  }
}

// v2.1.1 UI-02: Combine in correct order (dashboard above session context)
if (dashboardSections.length > 0) {
  additionalContext = dashboardSections.join('\n\n') + '\n\n' + additionalContext;
}

// --- 9. v2.0.0 Stale Feature Detection: Warn about idle features ---
try {
  const { detectStaleFeatures } = require('../lib/pdca/lifecycle');
  const staleFeatures = detectStaleFeatures();
  if (staleFeatures.length > 0) {
    let staleWarning = '\n## Stale Feature Warning\n\n';
    staleWarning += 'The following features have been idle and may need attention:\n\n';
    for (const stale of staleFeatures) {
      staleWarning += `- **${stale.feature}**: idle ${stale.daysIdle} days (phase: ${stale.phase}, last activity: ${stale.lastActivity})\n`;
    }
    staleWarning += '\nConsider resuming, archiving, or cleaning up stale features with `/pdca status`.\n';
    additionalContext += staleWarning;
  }
} catch (e) {
  debugLog('SessionStart', 'v2.0.0 stale feature detection failed', { error: e.message });
}

// --- Output Response ---
// v2.1.1 QM-04: sessionTitle with PDCA phase context
const primaryFeature = onboardingContext.onboardingData.primaryFeature || pdcaStatus?.primaryFeature || null;
const currentPhase = onboardingContext.onboardingData.phase || pdcaStatus?.currentPhase || null;
const sessionTitle = primaryFeature
  ? (currentPhase ? `[bkit] ${currentPhase.toUpperCase()} ${primaryFeature}` : `[bkit] ${primaryFeature}`)
  : undefined;

const response = {
  systemMessage: `bkit Vibecoding Kit v2.1.3 activated (Claude Code)`,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    onboardingType: onboardingContext.onboardingData.type,
    hasExistingWork: onboardingContext.onboardingData.hasExistingWork,
    primaryFeature: primaryFeature,
    currentPhase: currentPhase,
    matchRate: onboardingContext.onboardingData.matchRate || null,
    additionalContext: additionalContext,
    sessionTitle,
    // v2.1.1 H-01: Pass AskUserQuestion payload from onboarding
    userPrompt: onboardingContext.onboardingData.userPrompt || undefined,
  }
};

console.log(JSON.stringify(response));
process.exit(0);
