#!/usr/bin/env node
/**
 * gap-detector-stop.js - Parse gap analysis result and guide next steps (v1.4.0)
 *
 * Purpose: Parse match rate and provide guidance for Check-Act iteration
 * Hook: Stop for gap-detector agent
 * Core component of Check-Act iteration loop
 *
 * v1.4.0 Changes:
 * - Added debug logging for hook verification
 * - Added PDCA status update with match rate
 * - Added dynamic feature extraction from multiple sources
 *
 * Converted from: scripts/gap-detector-stop.sh
 */

const { readStdinSync, outputAllow } = require('../lib/core/hook-io');
const { debugLog } = require('../lib/core/debug');
const { getBkitConfig } = require('../lib/core/config');
const {
  updatePdcaStatus,
  extractFeatureFromContext,
  getPdcaStatusFull,
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
// v1.4.0 P2: Requirement Fulfillment Integration (stubs - not yet implemented)
const extractRequirementsFromPlan = () => null;
const calculateRequirementFulfillment = () => null;
const { generateTaskGuidance } = require('../lib/task/creator');
// v1.4.4 FR-07: Task Status Update
// v1.4.7 FR-04, FR-05, FR-06: Check↔Act Iteration
const {
  updatePdcaTaskStatus,
  triggerNextPdcaAction,
  savePdcaTaskId,
} = require('../lib/task/tracker');

// Log execution start
debugLog('Agent:gap-detector:Stop', 'Hook started');

// Read conversation context from stdin
const input = readStdinSync();
const inputText = typeof input === 'string' ? input : JSON.stringify(input);

debugLog('Agent:gap-detector:Stop', 'Input received', {
  inputLength: inputText.length,
  inputPreview: inputText.substring(0, 200)
});

// Try to extract match rate from the agent's output
// Patterns: "Overall Match Rate: XX%", "매치율: XX%", "Match Rate: XX%", "일치율: XX%"
const matchRatePattern = /(Overall|Match Rate|매치율|일치율|Design Match)[^0-9]*(\d+)/i;
const match = inputText.match(matchRatePattern);
let matchRate = match ? parseInt(match[2], 10) : 0;

// Extract feature name from multiple sources
const featurePattern = /feature[:\s]+['"]?(\w[\w-]*)['"]?/i;
const analysisPattern = /analyzing\s+['"]?(\w[\w-]*)['"]?/i;
const featureMatch = inputText.match(featurePattern) || inputText.match(analysisPattern);
const currentStatus = getPdcaStatusFull();

const feature = extractFeatureFromContext({
  agentOutput: inputText,
  currentStatus
});

debugLog('Agent:gap-detector:Stop', 'Data extracted', {
  matchRate,
  feature: feature || 'unknown',
  hadFeatureInOutput: !!featureMatch
});

// v1.4.0 P2: Calculate requirement fulfillment if plan exists
let fulfillmentResult = null;
const planDocPath = `docs/01-plan/features/${feature}.plan.md`;
const fs = require('fs');
if (feature && fs.existsSync(planDocPath)) {
  try {
    fulfillmentResult = calculateRequirementFulfillment(planDocPath, {
      matchRate,
      analysisDoc: `docs/03-analysis/${feature}.analysis.md`
    });
    debugLog('Agent:gap-detector:Stop', 'Requirement fulfillment calculated', {
      score: fulfillmentResult.score,
      fulfilled: fulfillmentResult.fulfilled,
      total: fulfillmentResult.total
    });
  } catch (e) {
    debugLog('Agent:gap-detector:Stop', 'Fulfillment calculation failed', { error: e.message });
  }
}

// Update PDCA status with match rate and fulfillment
if (feature) {
  updatePdcaStatus(feature, 'check', {
    matchRate,
    analysisDoc: `docs/03-analysis/${feature}.analysis.md`,
    fulfillment: fulfillmentResult ? {
      score: fulfillmentResult.score,
      fulfilled: fulfillmentResult.fulfilled,
      total: fulfillmentResult.total
    } : null
  });
}

// v2.0.5: Collect quality metrics (M1, M4)
try {
  const mc = require('../lib/quality/metrics-collector');
  const f = feature || 'unknown';
  // M1: Match Rate (primary metric from gap analysis)
  mc.collectMetric('M1', f, matchRate, 'gap-detector');

  // M4: API Compliance Rate — extract from output if present
  const apiPattern = /(API|api)\s*(Compliance|compliance|일치율|준수율)[^0-9]*(\d+)/i;
  const apiMatch = inputText.match(apiPattern);
  if (apiMatch) {
    mc.collectMetric('M4', f, parseInt(apiMatch[3], 10), 'gap-detector');
  } else {
    // Estimate: use matchRate as proxy when no explicit API compliance data
    mc.collectMetric('M4', f, matchRate, 'gap-detector');
  }
  debugLog('Agent:gap-detector:Stop', 'Quality metrics collected', { M1: matchRate });
} catch (e) {
  debugLog('Agent:gap-detector:Stop', 'Metrics collection failed', { error: e.message });
}

// v1.4.0: Get configuration and check iteration limits
const config = getBkitConfig();
const threshold = config.pdca?.matchRateThreshold || 90;
const maxIterations = config.pdca?.maxIterations || 5;
const featureStatus = currentStatus.features?.[feature];
const iterCount = featureStatus?.iterationCount || 0;

// Generate guidance based on match rate thresholds
let guidance = '';
let nextStep = '';
let userPrompt = null;

if (matchRate >= threshold) {
  // >= threshold: Suggest completion
  nextStep = 'pdca-report';
  guidance = `✅ Gap Analysis complete: ${matchRate}% match

Design-implementation alignment is good.

Next steps:
1. Generate completion report with /pdca-report ${feature || ''}
2. Archive available (move to docs/archive/)

🎉 PDCA Check phase passed!`;

  // v1.4.0: Generate AskUserQuestion prompt for completion
  userPrompt = emitUserPrompt({
    questions: [{
      question: `Match rate ${matchRate}%. Generate completion report?`,
      header: 'Complete',
      options: [
        {
          label: 'Generate report (Recommended)',
          description: `Run /pdca-report ${feature || ''}`,
          preview: [
            '## Completion Report',
            '',
            `**Command**: \`/pdca report ${feature || ''}\``,
            `**Current Match Rate**: ${matchRate}%`,
            '',
            '**Output**: report.md (Plan/Design/Implementation/Analysis integrated)'
          ].join('\n')
        },
        {
          label: '/simplify code cleanup',
          description: 'Improve code quality then generate report',
          preview: [
            '## /simplify Code Cleanup',
            '',
            '**Command**: `/simplify`',
            '',
            'Improve code quality then proceed to report generation'
          ].join('\n')
        },
        {
          label: 'Continue improving',
          description: `Run /pdca-iterate ${feature || ''}`,
          preview: [
            '## Continue Improvement',
            '',
            `**Command**: \`/pdca iterate ${feature || ''}\``,
            '',
            'Start new iteration (re-analyze gaps after fixes)'
          ].join('\n')
        },
        {
          label: 'Later',
          description: 'Keep current state',
          preview: [
            '## Defer',
            '',
            `Current state (${matchRate}%) saved to .pdca-status.json`,
            'Resume with `/pdca status` later'
          ].join('\n')
        }
      ],
      multiSelect: false
    }]
  });

} else if (iterCount >= maxIterations) {
  // v1.4.0: Max iterations reached
  nextStep = 'manual';
  guidance = `⚠️ Gap Analysis complete: ${matchRate}% match

Maximum iterations (${maxIterations}) reached.
Manual review required.

Current state:
- Iterations: ${iterCount}/${maxIterations}
- Match rate: ${matchRate}%

Recommended actions:
1. Manually review and fix code
2. Review design document updates
3. Document intentional differences`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `Maximum iterations reached. How to proceed?`,
      header: 'Max Iterations',
      options: [
        {
          label: 'Manual fix',
          description: 'Review and fix code manually',
          preview: [
            '## Manual Review',
            '',
            `**Max iterations reached**: ${iterCount}/${maxIterations}`,
            `**Current Match Rate**: ${matchRate}%`,
            '',
            'Review gaps manually and apply targeted fixes before re-analyzing'
          ].join('\n')
        },
        {
          label: 'Complete as-is',
          description: 'Generate report with warning',
          preview: [
            '## Complete with Warning',
            '',
            `**Command**: \`/pdca report ${feature || ''}\``,
            `**Match Rate**: ${matchRate}% (below ${threshold}% threshold)`,
            '',
            'Generate completion report documenting unresolved gaps'
          ].join('\n')
        },
        {
          label: 'Update design',
          description: 'Update design to match implementation',
          preview: [
            '## Update Design Document',
            '',
            `**Target**: docs/02-design/features/${feature || 'feature'}.design.md`,
            '',
            'Align design spec with current implementation to reflect intentional differences'
          ].join('\n')
        }
      ],
      multiSelect: false
    }]
  });

} else if (matchRate >= 70) {
  // 70-89%: Suggest auto-improvement
  nextStep = 'pdca-iterate';
  guidance = `⚠️ Gap Analysis complete: ${matchRate}% match

Some differences found.

Options:
1. Auto-improve (Recommended): /pdca-iterate ${feature || ''}
2. Manual fix: Fix differences manually
3. Update design: Update design document to match implementation

💡 Completion report available when reaching ${threshold}%+
📊 Iterations: ${iterCount}/${maxIterations}`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `Match rate ${matchRate}%. Auto-improve?`,
      header: 'Auto-Fix',
      options: [
        {
          label: 'Auto-improve (Recommended)',
          description: `Run /pdca-iterate (${iterCount + 1}/${maxIterations})`,
          preview: [
            '## Auto-Fix Iteration',
            '',
            `**Command**: \`/pdca iterate ${feature || ''}\``,
            `**Iteration**: ${iterCount + 1}/${maxIterations}`,
            `**Current Match Rate**: ${matchRate}% → target ${threshold}%`,
            '',
            'Automatically detect and fix implementation gaps against design'
          ].join('\n')
        },
        {
          label: 'Manual fix',
          description: 'Fix code manually then re-analyze',
          preview: [
            '## Manual Fix',
            '',
            `**Current Match Rate**: ${matchRate}%`,
            '',
            'Apply targeted fixes manually, then run `/pdca check` to re-analyze'
          ].join('\n')
        },
        {
          label: 'Complete as-is',
          description: 'Proceed with warning',
          preview: [
            '## Complete with Warning',
            '',
            `**Command**: \`/pdca report ${feature || ''}\``,
            `**Match Rate**: ${matchRate}% (below ${threshold}% threshold)`,
            '',
            'Generate report with gap warning — recommended only if gaps are intentional'
          ].join('\n')
        }
      ],
      multiSelect: false
    }]
  });

} else {
  // Below 70%: Strongly recommend improvement
  nextStep = 'pdca-iterate';
  guidance = `🔴 Gap Analysis complete: ${matchRate}% match

Significant design-implementation gap detected.

Recommended actions:
1. Run /pdca-iterate ${feature || ''} for auto-improvement (Strongly recommended)
2. Or fully update design document to match current implementation

⚠️ Check-Act iteration required. Repeat until reaching ${threshold}%+.
📊 Iterations: ${iterCount}/${maxIterations}`;

  userPrompt = emitUserPrompt({
    questions: [{
      question: `Match rate ${matchRate}% is low. Proceed with auto-improvement?`,
      header: 'Low Match',
      options: [
        {
          label: 'Auto-improve (Strongly recommended)',
          description: `Run /pdca-iterate (${iterCount + 1}/${maxIterations})`,
          preview: [
            '## Auto-Fix Iteration',
            '',
            `**Command**: \`/pdca iterate ${feature || ''}\``,
            `**Iteration**: ${iterCount + 1}/${maxIterations}`,
            `**Current Match Rate**: ${matchRate}% — significant gaps detected`,
            '',
            'Automatically resolve major implementation gaps against design spec'
          ].join('\n')
        },
        {
          label: 'Full design update',
          description: 'Rewrite design to match implementation',
          preview: [
            '## Full Design Rewrite',
            '',
            `**Target**: docs/02-design/features/${feature || 'feature'}.design.md`,
            `**Current Match Rate**: ${matchRate}%`,
            '',
            'Rewrite design document to align with current implementation (significant effort)'
          ].join('\n')
        },
        {
          label: 'Manual fix',
          description: 'Fix code manually',
          preview: [
            '## Manual Intervention',
            '',
            `**Current Match Rate**: ${matchRate}% — manual review strongly recommended`,
            '',
            'Review gap analysis report and apply targeted fixes before re-running check'
          ].join('\n')
        }
      ],
      multiSelect: false
    }]
  });
}

// v1.4.0: Get auto phase advance suggestion
const phaseAdvance = autoAdvancePdcaPhase(feature, 'check', { matchRate });

// v1.4.4 FR-06/FR-07: Auto-create PDCA Tasks and Update Task Status
let autoCreatedTasks = [];
try {
  const { autoCreatePdcaTask } = require('../lib/task/creator');

  // v1.4.4 FR-07: Update Check Task status
  if (feature) {
    updatePdcaTaskStatus('check', feature, {
      matchRate,
      status: matchRate >= threshold ? 'completed' : 'in_progress',
      fulfillment: fulfillmentResult
    });
    debugLog('Agent:gap-detector:Stop', 'Check Task status updated', {
      feature, matchRate, threshold
    });
  }

  // Auto-create [Check] Task
  const checkTask = autoCreatePdcaTask({
    phase: 'check',
    feature: feature || 'unknown',
    metadata: {
      matchRate,
      fulfillment: fulfillmentResult,
      analysisDoc: `docs/03-analysis/${feature}.analysis.md`
    }
  });
  if (checkTask) {
    autoCreatedTasks.push(checkTask);
    debugLog('Agent:gap-detector:Stop', 'Check Task auto-created', { taskId: checkTask.taskId });
  }

  // v1.4.4 FR-07: Auto-create [Report] Task if matchRate >= threshold
  if (matchRate >= threshold) {
    const reportTask = autoCreatePdcaTask({
      phase: 'report',
      feature: feature || 'unknown',
      metadata: {
        finalMatchRate: matchRate,
        completedAt: new Date().toISOString(),
        blockedBy: checkTask?.taskId
      }
    });
    if (reportTask) {
      autoCreatedTasks.push(reportTask);
      debugLog('Agent:gap-detector:Stop', 'Report Task auto-created', { taskId: reportTask.taskId });
    }
  }
  // Auto-create [Act] Task if matchRate < threshold
  else if (iterCount < maxIterations) {
    const actTask = autoCreatePdcaTask({
      phase: 'act',
      feature: feature || 'unknown',
      iteration: iterCount + 1,
      metadata: {
        matchRateBefore: matchRate,
        requiredMatchRate: threshold,
        blockedBy: checkTask?.taskId
      }
    });
    if (actTask) {
      autoCreatedTasks.push(actTask);
      debugLog('Agent:gap-detector:Stop', 'Act Task auto-created', { taskId: actTask.taskId });
    }
  }
} catch (e) {
  debugLog('Agent:gap-detector:Stop', 'Auto-task creation skipped', { error: e.message });
}

// v1.4.7 FR-04, FR-05, FR-06: Get autoTrigger for Check↔Act iteration
let autoTrigger = null;
try {
  const triggerResult = triggerNextPdcaAction(feature, 'check', {
    matchRate,
    iterationCount: iterCount,
    maxIterations,
    threshold
  });
  if (triggerResult) {
    autoTrigger = triggerResult.autoTrigger;
    debugLog('Agent:gap-detector:Stop', 'AutoTrigger generated', {
      nextAction: triggerResult.nextAction,
      autoTrigger
    });
  }
} catch (e) {
  debugLog('Agent:gap-detector:Stop', 'AutoTrigger generation failed', { error: e.message });
}

// Add Task System guidance for PDCA workflow (v1.3.1 - FR-04)
const taskGuidance = matchRate >= 90
  ? generateTaskGuidance('check', feature || 'feature', 'do')
  : generateTaskGuidance('act', feature || 'feature', 'check');

// Log completion
debugLog('Agent:gap-detector:Stop', 'Hook completed', {
  matchRate,
  feature: feature || 'unknown',
  nextStep,
  iterCount,
  phaseAdvance: phaseAdvance?.nextPhase
});

// Claude Code: JSON output with AskUserQuestion prompt
const response = {
  decision: 'allow',
  hookEventName: 'Agent:gap-detector:Stop',
  analysisResult: {
    matchRate,
    feature: feature || 'unknown',
    iterationCount: iterCount,
    maxIterations,
    threshold,
    nextStep,
    phaseAdvance: phaseAdvance,
    // v1.4.4 FR-06: Auto-created tasks
    autoCreatedTasks: autoCreatedTasks.map(t => t.taskId)
  },
  guidance: guidance,
  taskGuidance: taskGuidance,
  // v1.4.0: Include user prompt for AskUserQuestion
  userPrompt: userPrompt,
  // v1.4.7 FR-04, FR-05, FR-06: Auto-trigger for Check↔Act iteration
  autoTrigger: autoTrigger,
  // v1.4.0: Stop hooks use systemMessage instead of additionalContext (not supported)
  systemMessage: `Gap Analysis complete. Match rate: ${matchRate}%\n\n` +
    `## 🚨 MANDATORY: Call AskUserQuestion\n\n` +
    `Ask the user about next steps using the AskUserQuestion parameters below:\n\n` +
    `${userPrompt}\n\n` +
    `### Actions by selection:\n` +
    (matchRate >= threshold
      ? `- **Generate report** → Run /pdca-report ${feature || ''}\n- **/simplify code cleanup** → Run /simplify then generate report\n- **Continue improving** → Run /pdca-iterate ${feature || ''}\n- **Later** → Keep current state`
      : `- **Auto-improve** → Run /pdca-iterate ${feature || ''}\n- **Manual fix** → Provide guidance\n- **Complete as-is** → Run /pdca-report with warning`)
};

// v2.0.0: State machine integration
try {
  const sm = require('../lib/pdca/state-machine');
  const smCtx = sm.loadContext(feature) || sm.createContext(feature || 'unknown');
  if (matchRate >= threshold) {
    sm.transition('check', 'MATCH_PASS', { ...smCtx, matchRate });
  } else {
    sm.transition('check', 'ITERATE', { ...smCtx, matchRate });
  }
} catch (_) {}

// v2.0.0: Metrics collection
try {
  const mc = require('../lib/quality/metrics-collector');
  mc.collectMetric('M1', feature || 'unknown', matchRate, 'gap-detector');
} catch (_) {}

// v2.0.0: Audit logging
try {
  const audit = require('../lib/audit/audit-logger');
  audit.writeAuditLog({
    actor: 'agent', actorId: 'gap-detector',
    action: matchRate >= threshold ? 'gate_passed' : 'gate_failed',
    category: 'quality',
    target: feature || 'unknown', targetType: 'feature',
    details: { matchRate, threshold },
    result: matchRate >= threshold ? 'success' : 'failure'
  });
} catch (_) {}

console.log(JSON.stringify(response));
process.exit(0);
