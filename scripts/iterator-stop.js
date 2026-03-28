#!/usr/bin/env node
/**
 * iterator-stop.js - Guide next iteration or completion after pdca-iterator (v1.4.0)
 *
 * Purpose: Detect completion status and provide next step guidance
 * Hook: Stop for pdca-iterator agent
 * Core component of Check-Act iteration loop
 *
 * v1.4.0 Changes:
 * - Added debug logging for hook verification
 * - Added PDCA status update with iteration count
 * - Added dynamic feature extraction
 *
 * Converted from: scripts/iterator-stop.sh
 */

const { readStdinSync, outputAllow } = require('../lib/core/hook-io');
const { debugLog } = require('../lib/core/debug');
const { getBkitConfig } = require('../lib/core/config');
const {
  updatePdcaStatus,
  extractFeatureFromContext,
  getPdcaStatusFull,
  getFeatureStatus,
  completePdcaFeature,
} = require('../lib/pdca/status');
// v1.4.0 Automation Functions
const {
  emitUserPrompt,
  autoAdvancePdcaPhase,
  // v1.4.7 Full-Auto Mode
  isFullAutoMode,
  shouldAutoAdvance,
  getAutomationLevel,
} = require('../lib/pdca/automation');
const { generateTaskGuidance } = require('../lib/task/creator');
// v1.4.4 FR-07: Task Status Update
// v1.4.7 FR-04, FR-05, FR-06: Check↔Act Iteration
const {
  updatePdcaTaskStatus,
  triggerNextPdcaAction,
  savePdcaTaskId,
} = require('../lib/task/tracker');

// Log execution start
debugLog('Agent:pdca-iterator:Stop', 'Hook started');

// Read conversation context from stdin
const input = readStdinSync();
const inputText = typeof input === 'string' ? input : JSON.stringify(input);

debugLog('Agent:pdca-iterator:Stop', 'Input received', {
  inputLength: inputText.length,
  inputPreview: inputText.substring(0, 200)
});

// Extract feature name from multiple sources
const currentStatus = getPdcaStatusFull();
const feature = extractFeatureFromContext({
  agentOutput: inputText,
  currentStatus
});

// Get current iteration count
const featureStatus = feature ? getFeatureStatus(feature) : null;
const currentIteration = (featureStatus?.iterationCount || 0) + 1;

// Try to extract match rate from output (if re-analyzed)
const matchRatePattern = /(Overall|Match Rate|매치율|일치율|Design Match)[^0-9]*(\d+)/i;
const matchMatch = inputText.match(matchRatePattern);
const matchRate = matchMatch ? parseInt(matchMatch[2], 10) : (featureStatus?.matchRate || 0);

debugLog('Agent:pdca-iterator:Stop', 'Data extracted', {
  feature: feature || 'unknown',
  iteration: currentIteration,
  matchRate
});

// v1.4.0: Get configuration
const config = getBkitConfig();
const threshold = config.pdca?.matchRateThreshold || 90;
const maxIterations = config.pdca?.maxIterations || 5;

// Patterns for detection
const completionPattern = /(완료|Complete|Completed|>= 90%|매치율.*9[0-9]%|Match Rate.*9[0-9]%|passed|성공|Successfully)/i;
const maxIterationPattern = /(max.*iteration|최대.*반복|5\/5|limit reached)/i;
const improvedPattern = /(improved|개선|수정.*완료|fixed|changes.*made|파일.*수정)/i;
const changesPattern = /(\d+)\s*(files?|파일)/i;

// Extract number of changed files
const changesMatch = inputText.match(changesPattern);
const changedFiles = changesMatch ? parseInt(changesMatch[1], 10) : 0;

let guidance = '';
let status = 'in_progress';
let userPrompt = null;

// Check if completed successfully
if (completionPattern.test(inputText) || matchRate >= threshold) {
  status = 'completed';
  guidance = `✅ pdca-iterator complete!

Design-implementation match rate reached target (${threshold}%).

Next steps:
1. Generate completion report with /pdca-report ${feature || ''}
2. Review changes and commit
3. Archive (optional)

🎉 Check-Act iteration succeeded! (${currentIteration} iterations)`;

  // Mark feature as completed if match rate >= threshold
  if (feature && matchRate >= threshold) {
    completePdcaFeature(feature);
  }

  // v1.4.0: Generate completion prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `Improvement complete! (${matchRate}%) Generate report?`,
      header: 'Completed',
      options: [
        { label: 'Generate report (Recommended)', description: `Run /pdca-report ${feature || ''}` },
        { label: '/simplify code cleanup', description: 'Improve code quality then generate report' },
        { label: 'Additional review', description: 'Code review then commit' },
        { label: 'Archive', description: 'Archive documents' }
      ],
      multiSelect: false
    }]
  });

} else if (maxIterationPattern.test(inputText) || currentIteration >= maxIterations) {
  status = 'max_iterations';
  // Max iterations reached
  guidance = `⚠️ pdca-iterator: Maximum iterations reached (${currentIteration}/${maxIterations})

Auto-improvement repeated but target not reached.
Current match rate: ${matchRate}%

Recommended actions:
1. Manually fix remaining differences
2. Or update design document to match current implementation
3. Re-check current state with /pdca-analyze ${feature || ''}

💡 Complex differences may require manual intervention.`;

  // v1.4.0: Generate max iterations prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `Maximum iterations reached (${matchRate}%). How to proceed?`,
      header: 'Max Iterations',
      options: [
        { label: 'Manual fix', description: 'Fix code manually then re-analyze' },
        { label: 'Complete as-is', description: 'Generate report with warning' },
        { label: 'Update design', description: 'Update design to match implementation' }
      ],
      multiSelect: false
    }]
  });

} else if (improvedPattern.test(inputText) || changedFiles > 0) {
  status = 'improved';
  // Improvement made but not complete
  guidance = `✅ Improvement complete: ${changedFiles > 0 ? `${changedFiles} files modified` : 'Changes applied'}

Iterations: ${currentIteration}/${maxIterations}
Current match rate: ${matchRate}%

Next steps:
1. Run re-analysis with /pdca-analyze ${feature || ''}
2. Repeat if needed after checking match rate

💡 Repeat Check-Act until reaching ${threshold}%+.`;

  // v1.4.0: Generate re-analyze prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: `${changedFiles > 0 ? `${changedFiles} files modified.` : 'Improvement complete.'} Run re-analysis?`,
      header: 'Re-Analyze',
      options: [
        { label: 'Re-analyze (Recommended)', description: `Run /pdca-analyze ${feature || ''}` },
        { label: 'Continue fixing', description: 'Continue fixing then re-analyze' },
        { label: 'Complete', description: 'Complete with current state' }
      ],
      multiSelect: false
    }]
  });

} else {
  status = 'unknown';
  // Default: suggest re-evaluation
  guidance = `🔄 pdca-iterator work complete (iteration ${currentIteration})

Modifications complete.
Current match rate: ${matchRate}%

Next steps:
1. Re-evaluate with /pdca-analyze ${feature || ''} to check match rate
2. If below ${threshold}%, re-run /pdca-iterate
3. If ${threshold}%+, generate completion report with /pdca-report`;

  // v1.4.0: Generate default prompt
  userPrompt = emitUserPrompt({
    questions: [{
      question: 'Modifications complete. Select next step.',
      header: 'Next Step',
      options: [
        { label: 'Re-analyze (Recommended)', description: `Run /pdca-analyze ${feature || ''}` },
        { label: 'Continue iterating', description: `Run /pdca-iterate ${feature || ''}` },
        { label: 'Complete', description: `Run /pdca-report ${feature || ''}` }
      ],
      multiSelect: false
    }]
  });
}

// v1.4.0: Get auto phase advance suggestion
const phaseAdvance = autoAdvancePdcaPhase(feature, 'act', { matchRate });

// v1.4.4 FR-06/FR-07: Auto-create PDCA Tasks and trigger re-analyze
let autoCreatedTasks = [];
let autoTrigger = null;

try {
  const { autoCreatePdcaTask } = require('../lib/task/creator');

  // v1.4.4 FR-07: Update Act Task status
  if (feature) {
    updatePdcaTaskStatus('act', feature, {
      iteration: currentIteration,
      matchRate,
      status: status === 'completed' ? 'completed' : 'in_progress',
      changedFiles
    });
    debugLog('Agent:pdca-iterator:Stop', 'Act Task status updated', {
      feature, iteration: currentIteration, status
    });
  }

  // Auto-create [Act-N] Task for current iteration
  const actTask = autoCreatePdcaTask({
    phase: 'act',
    feature: feature || 'unknown',
    iteration: currentIteration,
    metadata: {
      matchRateBefore: featureStatus?.matchRate || 0,
      matchRateAfter: matchRate,
      changedFiles,
      status
    }
  });
  if (actTask) {
    autoCreatedTasks.push(actTask);
    debugLog('Agent:pdca-iterator:Stop', 'Act Task auto-created', { taskId: actTask.taskId });
  }

  // Auto-create [Report] Task if completed
  if (status === 'completed' && matchRate >= threshold) {
    const reportTask = autoCreatePdcaTask({
      phase: 'report',
      feature: feature || 'unknown',
      metadata: {
        finalMatchRate: matchRate,
        totalIterations: currentIteration,
        blockedBy: actTask?.taskId
      }
    });
    if (reportTask) {
      autoCreatedTasks.push(reportTask);
      debugLog('Agent:pdca-iterator:Stop', 'Report Task auto-created', { taskId: reportTask.taskId });
    }
  }

  // v1.4.7 FR-04, FR-05, FR-06: Use triggerNextPdcaAction for Check↔Act iteration
  if (status === 'improved' || status === 'completed') {
    const triggerResult = triggerNextPdcaAction(feature, 'act', {
      matchRate,
      iterationCount: currentIteration,
      maxIterations,
      threshold
    });
    if (triggerResult && triggerResult.autoTrigger) {
      autoTrigger = triggerResult.autoTrigger;
      debugLog('Agent:pdca-iterator:Stop', 'Auto-trigger generated', {
        nextAction: triggerResult.nextAction,
        autoTrigger
      });
    }
  }
} catch (e) {
  debugLog('Agent:pdca-iterator:Stop', 'Auto-task creation skipped', { error: e.message });
}

// Update PDCA status
if (feature) {
  updatePdcaStatus(feature, 'act', {
    iterationCount: currentIteration,
    matchRate,
    lastIterationStatus: status
  });
}

// v2.0.5: Collect M9 (Iteration Efficiency) metric
try {
  const mc = require('../lib/quality/metrics-collector');
  const prevMatchRate = featureStatus?.matchRate || 0;
  // Efficiency = matchRate improvement per iteration (%p/iteration)
  const improvement = matchRate - prevMatchRate;
  const efficiency = currentIteration > 0 ? Math.round((improvement / currentIteration) * 100) / 100 : 0;
  mc.collectMetric('M9', feature || 'unknown', efficiency, 'pdca-iterator');
  debugLog('Agent:pdca-iterator:Stop', 'M9 metric collected', { efficiency, prevMatchRate, matchRate });
} catch (e) {
  debugLog('Agent:pdca-iterator:Stop', 'M9 collection failed', { error: e.message });
}

// Add Task System guidance for PDCA workflow (v1.3.1 - FR-05)
const isComplete = status === 'completed';
const taskGuidance = isComplete
  ? `Task: Mark current [Act] task as completed. Proceed to /pdca-report ${feature || ''}.`
  : generateTaskGuidance('act', feature || 'feature', 'check');

// Log completion
debugLog('Agent:pdca-iterator:Stop', 'Hook completed', {
  feature: feature || 'unknown',
  iteration: currentIteration,
  matchRate,
  status,
  changedFiles,
  phaseAdvance: phaseAdvance?.nextPhase
});

// Claude Code: JSON output with AskUserQuestion prompt
const response = {
  decision: 'allow',
  hookEventName: 'Agent:pdca-iterator:Stop',
  iterationResult: {
    feature: feature || 'unknown',
    iteration: currentIteration,
    maxIterations,
    matchRate,
    threshold,
    status,
    changedFiles,
    phaseAdvance: phaseAdvance,
    // v1.4.4 FR-06: Auto-trigger flags
    autoCreatedTasks: autoCreatedTasks.map(t => t.taskId),
    autoTrigger
  },
  guidance: guidance,
  taskGuidance: taskGuidance,
  // v1.4.0: Include user prompt for AskUserQuestion
  userPrompt: userPrompt,
  // v1.4.0: Stop hooks use systemMessage instead of additionalContext (not supported)
  systemMessage: `Iterator complete. Iterations: ${currentIteration}/${maxIterations}, Match rate: ${matchRate}%\n\n` +
    `## 🚨 MANDATORY: Call AskUserQuestion\n\n` +
    `Ask the user about next steps using the AskUserQuestion parameters below:\n\n` +
    `${userPrompt}\n\n` +
    `### Actions by selection:\n` +
    (status === 'completed'
      ? `- **Generate report** → Run /pdca-report ${feature || ''}\n- **/simplify code cleanup** → Run /simplify then generate report\n- **Additional review** → Code review\n- **Archive** → Run /archive`
      : status === 'improved'
        ? `- **Re-analyze** → Run /pdca-analyze ${feature || ''}\n- **Continue fixing** → Provide guidance\n- **Complete** → Run /pdca-report`
        : `- **Re-analyze** → Run /pdca-analyze ${feature || ''}\n- **Continue iterating** → Run /pdca-iterate ${feature || ''}\n- **Complete** → Run /pdca-report`)
};

// v2.0.0: State machine integration
try {
  const sm = require('../lib/pdca/state-machine');
  const smCtx = sm.loadContext(feature) || sm.createContext(feature || 'unknown');
  sm.transition('act', 'ANALYZE_DONE', smCtx);
} catch (_) {}

// v2.0.0: Regression guard auto-rule generation
try {
  const rg = require('../lib/quality/regression-guard');
  rg.addRulesFromIteratorResult({
    feature: feature || 'unknown',
    iteration: currentIteration,
    matchRate,
    status,
    changedFiles
  }, feature || 'unknown');
} catch (_) {}

console.log(JSON.stringify(response));
process.exit(0);
