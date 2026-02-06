#!/usr/bin/env node
/**
 * team-stop.js - Team Mode Stop Handler (v1.5.1)
 *
 * Team coordinator 종료 시 리소스 정리:
 * 1. PDCA 상태 업데이트 (team mode 종료 기록)
 * 2. bkit-memory.json에 team 세션 정보 저장
 * 3. Team 정리 안내 메시지 출력
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  addPdcaHistory,
} = require('../lib/common.js');

function run(context) {
  debugLog('TeamStop', 'Team cleanup started');

  const pdcaStatus = getPdcaStatusFull();
  const feature = pdcaStatus?.primaryFeature;

  if (feature) {
    addPdcaHistory({
      action: 'team_session_ended',
      feature: feature,
      phase: pdcaStatus?.features?.[feature]?.phase
    });
  }

  outputAllow('Team session ended. Returning to single-session mode.', 'Stop');
  debugLog('TeamStop', 'Team cleanup completed');
}

module.exports = { run };
