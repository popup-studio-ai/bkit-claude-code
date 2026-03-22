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

// --- 6. PDCA Dashboard: Render progress bar into additionalContext ---
let pdcaStatus = null;
try {
  const { renderPdcaProgressBar } = require('../lib/ui/progress-bar');
  const { getPdcaStatusFull } = require('../lib/pdca/status');
  pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus && pdcaStatus.primaryFeature) {
    const dashboardBar = renderPdcaProgressBar(pdcaStatus, { compact: false });
    if (dashboardBar) {
      additionalContext = dashboardBar + '\n\n' + additionalContext;
    }
  }
} catch (e) {
  debugLog('SessionStart', 'PDCA dashboard rendering failed', { error: e.message });
}

// --- 7. v2.0.0 Workflow Map: Render PDCA phase visualization ---
try {
  const { renderWorkflowMap } = require('../lib/ui/workflow-map');
  if (!pdcaStatus) {
    const { getPdcaStatusFull } = require('../lib/pdca/status');
    pdcaStatus = getPdcaStatusFull();
  }
  if (pdcaStatus && pdcaStatus.primaryFeature) {
    let agentState = null;
    try {
      const fs = require('fs');
      const agentStatePath = require('path').resolve(process.cwd(), '.bkit/runtime/agent-state.json');
      if (fs.existsSync(agentStatePath)) {
        agentState = JSON.parse(fs.readFileSync(agentStatePath, 'utf-8'));
      }
    } catch (_) { /* non-critical */ }

    const workflowMap = renderWorkflowMap(pdcaStatus, agentState, {
      feature: pdcaStatus.primaryFeature,
      showIteration: true,
      showBranch: true
    });
    if (workflowMap) {
      additionalContext = workflowMap + '\n\n' + additionalContext;
    }
  }
} catch (e) {
  debugLog('SessionStart', 'v2.0.0 workflow map rendering failed', { error: e.message });
}

// --- 8. v2.0.0 Control Panel: Render automation level display ---
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

  // Only render control panel if there is an active PDCA feature
  if (pdcaStatus && pdcaStatus.primaryFeature) {
    const controlPanel = renderControlPanel(controlState, null, {
      showShortcuts: false,
      showApprovals: true
    });
    if (controlPanel) {
      additionalContext = controlPanel + '\n\n' + additionalContext;
    }
  }
} catch (e) {
  debugLog('SessionStart', 'v2.0.0 control panel rendering failed', { error: e.message });
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
const response = {
  systemMessage: `bkit Vibecoding Kit v2.0.3 activated (Claude Code)`,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    onboardingType: onboardingContext.onboardingData.type,
    hasExistingWork: onboardingContext.onboardingData.hasExistingWork,
    primaryFeature: onboardingContext.onboardingData.primaryFeature || null,
    currentPhase: onboardingContext.onboardingData.phase || null,
    matchRate: onboardingContext.onboardingData.matchRate || null,
    additionalContext: additionalContext
  }
};

console.log(JSON.stringify(response));
process.exit(0);
