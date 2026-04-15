#!/usr/bin/env node
/**
 * context-compaction.js - Context Compaction Hook (FR-07)
 * Preserves PDCA state before context compression
 *
 * @version 1.6.0
 * @module scripts/context-compaction
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync, outputEmpty } = require('../lib/core/io');
const { debugLog } = require('../lib/core/debug');
const { getPdcaStatusFull } = require('../lib/pdca/status');
const { PROJECT_DIR } = require('../lib/core/platform');

// Read compaction event from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('ContextCompaction', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

debugLog('ContextCompaction', 'Hook started', {
  reason: input.reason || 'unknown'
});

// Get current PDCA status
const pdcaStatus = getPdcaStatusFull(true);

// ENH-203 (CC v2.1.105 PreCompact blocking, Plan §3): Critical phase 진행 중 'manual' compaction 차단
// - 'auto' compaction은 차단하지 않음 (사용자 의도 없는 자동 호출은 snapshot만)
// - 'manual' compaction은 do/check/act 진행 중 차단하여 컨텍스트 손실 방지
try {
  const reason = (input && input.reason) ? String(input.reason) : 'unknown';
  const isManual = reason === 'manual';
  const criticalPhase = pdcaStatus
    && pdcaStatus.primaryFeature
    && ['do', 'check', 'act'].includes(pdcaStatus.currentPhase);

  if (isManual && criticalPhase) {
    const blockMsg =
      `[bkit] PDCA ${String(pdcaStatus.currentPhase).toUpperCase()} phase 진행 중 (${pdcaStatus.primaryFeature}). ` +
      `Manual compaction은 컨텍스트 손실 위험이 있어 차단됨. ` +
      `먼저 \`/pdca status\`로 진행 상황을 확인하거나, \`/pdca report\` 후 진행하세요.`;
    console.log(JSON.stringify({
      decision: 'block',
      reason: blockMsg,
      hookSpecificOutput: { hookEventName: 'PreCompact', additionalContext: blockMsg },
    }));
    debugLog('ContextCompaction', 'PreCompact blocked', { reason, phase: pdcaStatus.currentPhase, feature: pdcaStatus.primaryFeature });
    process.exit(2); // CC: exit 2 == block
  }
} catch (_e) {
  // Block 로직 실패는 silent (기존 snapshot 경로 진행)
}

if (pdcaStatus) {
  // Create compaction snapshot
  const snapshot = {
    timestamp: new Date().toISOString(),
    reason: input.reason || 'compaction',
    status: pdcaStatus
  };

  // Save snapshot
  const { STATE_PATHS } = require('../lib/core/paths');
  const snapshotDir = STATE_PATHS.snapshots();
  try {
    if (!fs.existsSync(snapshotDir)) {
      fs.mkdirSync(snapshotDir, { recursive: true });
    }

    const snapshotPath = path.join(
      snapshotDir,
      `snapshot-${Date.now()}.json`
    );

    fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2));

    debugLog('ContextCompaction', 'Snapshot saved', { path: snapshotPath });

    // Clean up old snapshots (keep last 10)
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (let i = 10; i < files.length; i++) {
      fs.unlinkSync(path.join(snapshotDir, files[i]));
    }
  } catch (e) {
    debugLog('ContextCompaction', 'Failed to save snapshot', { error: e.message });
  }

  // Output summary for context restoration
  const summary = {
    activeFeatures: pdcaStatus.activeFeatures || [],
    primaryFeature: pdcaStatus.primaryFeature,
    currentPhases: Object.entries(pdcaStatus.features || {}).map(([name, data]) => ({
      feature: name,
      phase: data.phase,
      matchRate: data.matchRate
    }))
  };

  const additionalContext = `PDCA State preserved. Active: ${summary.activeFeatures.join(', ') || 'none'}. Primary: ${summary.primaryFeature || 'none'}.`;

  // v1.4.2: hookEventName 추가 (ISSUE-006 수정)
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreCompact',
      additionalContext
    }
  }));
} else {
  debugLog('ContextCompaction', 'No PDCA status to preserve');
  outputEmpty();
}
