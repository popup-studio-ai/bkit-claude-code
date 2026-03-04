#!/usr/bin/env node
/**
 * instructions-loaded-handler.js - InstructionsLoaded Hook Handler
 * @version 1.5.9
 * @description CLAUDE.md load triggers bkit PDCA status context injection.
 *              .claude/rules/*.md files pass through without injection.
 * @hook InstructionsLoaded (CC v2.1.64+)
 * @enh ENH-60
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
} = require('../lib/common.js');

function main() {
  debugLog('InstructionsLoaded', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('InstructionsLoaded', 'Failed to parse context', { error: e.message });
    outputAllow('', 'InstructionsLoaded');
    return;
  }

  const filePath = hookContext.file_path || '';
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;

  // Only augment CLAUDE.md; pass through .claude/rules/*.md
  const isCLAUDEMD = filePath.endsWith('/CLAUDE.md') || filePath.endsWith('\\CLAUDE.md');

  if (!isCLAUDEMD) {
    debugLog('InstructionsLoaded', 'Non-CLAUDE.md, pass-through', { filePath });
    outputAllow('', 'InstructionsLoaded');
    return;
  }

  // Read bkit current status
  let additionalContext = '';
  try {
    const pdcaStatus = getPdcaStatusFull();
    const primaryFeature = pdcaStatus?.primaryFeature || null;
    const featureData = primaryFeature ? pdcaStatus?.features?.[primaryFeature] : null;
    const currentPhase = featureData?.phase || null;
    const matchRate = featureData?.matchRate || null;
    const activeCount = pdcaStatus?.activeFeatures?.length || 0;

    additionalContext += `\n## bkit Context (InstructionsLoaded)\n`;
    additionalContext += `- bkit v1.5.9 active\n`;

    if (primaryFeature) {
      additionalContext += `- Primary Feature: ${primaryFeature}\n`;
      additionalContext += `- PDCA Phase: ${currentPhase || 'unknown'}\n`;
      if (matchRate !== null) {
        additionalContext += `- Match Rate: ${matchRate}%\n`;
      }
    }

    if (activeCount > 1) {
      additionalContext += `- Active Features: ${activeCount}\n`;
    }

    if (agentId) {
      additionalContext += `- Agent: ${agentId} (${agentType || 'unknown'})\n`;
    }
  } catch (e) {
    debugLog('InstructionsLoaded', 'PDCA status read failed', { error: e.message });
    additionalContext = '\n## bkit v1.5.9 active\n';
  }

  const response = {
    systemMessage: additionalContext,
    hookSpecificOutput: {
      hookEventName: 'InstructionsLoaded',
      filePath,
      agentId,
      agentType,
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
