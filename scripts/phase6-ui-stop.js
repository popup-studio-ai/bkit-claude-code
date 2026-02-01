#!/usr/bin/env node
/**
 * Phase 6 UI Integration Stop Hook (v1.4.4)
 *
 * UI Integration 완료 후 다음 단계 제안
 * Phase 6 (UI Integration) → Phase 7 (SEO/Security)
 *
 * 중요: UI 구현 완료 시점은 기능 검증이 필요한 시점
 * Zero Script QA 제안 또는 gap-detector 실행 권장
 *
 * @version 1.4.4
 * @module scripts/phase6-ui-stop
 */

const path = require('path');

let common = null;
function getCommon() {
  if (!common) {
    common = require('../lib/common.js');
  }
  return common;
}

/**
 * Generate phase completion message
 * @returns {Object} Hook result
 */
function generatePhaseCompletion() {
  return {
    phase: 6,
    phaseName: 'UI Integration',
    completedItems: [
      'UI 컴포넌트 구현 완료',
      'API 연동 완료',
      '상태 관리 적용',
      '에러 핸들링 구현',
      'Loading 상태 처리'
    ],
    qualityCheck: {
      recommended: true,
      options: [
        { agent: 'gap-detector', description: 'Design-Implementation Gap 분석' },
        { skill: 'zero-script-qa', description: 'Docker 로그 기반 QA' }
      ]
    },
    nextPhase: {
      number: 7,
      name: 'SEO/Security',
      skill: 'phase-7-seo-security',
      description: 'SEO 최적화 및 보안 점검'
    },
    askUser: {
      question: 'UI Integration이 완료되었습니다. 다음 작업을 선택해주세요.',
      options: [
        { label: 'Gap 분석 실행 (권장)', value: 'gap-analysis' },
        { label: 'Zero Script QA 실행', value: 'zero-script-qa' },
        { label: 'Phase 7 SEO/Security 진행', value: 'proceed' },
        { label: '추가 UI 작업', value: 'continue' }
      ]
    }
  };
}

/**
 * Format output (Claude Code only)
 * @param {Object} result - Hook result
 * @returns {string} Formatted output
 */
function formatOutput(result) {
  return JSON.stringify({
    status: 'success',
    ...result
  }, null, 2);
}

/**
 * Main execution
 */
async function main() {
  const lib = getCommon();

  try {
    lib.debugLog('Phase6Stop', 'UI Integration phase completed');

    const result = generatePhaseCompletion();

    console.log(formatOutput(result));

    // Update pipeline status
    const memory = lib.readBkitMemory();
    if (memory) {
      if (!memory.pipelineStatus) {
        memory.pipelineStatus = {};
      }
      // Keep at phase 6 until quality check passes
      memory.pipelineStatus.phase6Completed = true;
      memory.pipelineStatus.awaitingQualityCheck = true;
      if (!memory.pipelineStatus.completedPhases) {
        memory.pipelineStatus.completedPhases = [];
      }
      lib.writeBkitMemory(memory);
    }

  } catch (e) {
    lib.debugLog('Phase6Stop', 'Error', { error: e.message });
    console.log(JSON.stringify({ status: 'error', error: e.message }));
  }
}

main().catch(e => {
  console.error('phase6-ui-stop.js error:', e.message);
  process.exit(1);
});
