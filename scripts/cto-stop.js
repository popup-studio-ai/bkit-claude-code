#!/usr/bin/env node
/**
 * cto-stop.js - CTO Lead Agent Stop Handler (v1.5.1)
 *
 * CTO agent session cleanup:
 * 1. Save current team state
 * 2. Record incomplete tasks
 * 3. Add CTO session end to PDCA history
 */

const {
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  addPdcaHistory,
} = require('../lib/common.js');

function run(context) {
  debugLog('CTOStop', 'CTO session cleanup started');

  const pdcaStatus = getPdcaStatusFull();
  const feature = pdcaStatus?.primaryFeature;

  if (feature) {
    let teamModule = null;
    try {
      teamModule = require('../lib/team');
    } catch (e) {
      // Graceful degradation
    }

    if (teamModule) {
      const featureData = pdcaStatus.features?.[feature];
      const progress = teamModule.getTeamProgress(feature, featureData?.phase);
      addPdcaHistory({
        action: 'cto_session_ended',
        feature,
        phase: featureData?.phase,
        teamProgress: progress,
      });

      debugLog('CTOStop', 'Team state saved', {
        feature,
        phase: featureData?.phase,
        progress,
      });
    }
  }

  outputAllow('CTO session ended. Team state saved for next session.', 'CTOStop');
  debugLog('CTOStop', 'CTO session cleanup completed');
}

module.exports = { run };
