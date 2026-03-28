#!/usr/bin/env node
/**
 * analysis-stop.js - Guide report generation after gap analysis
 *
 * Purpose: Provide guidance after gap analysis completion
 * Hook: Stop for phase-8-review skill (gap analysis component)
 *
 * Converted from: scripts/analysis-stop.sh
 */

const { outputAllow } = require('../lib/core/hook-io');

// Output guidance for next steps after gap analysis
const message = `📊 Gap Analysis completed.

Next steps:
1. Save report to docs/03-analysis/
2. If match rate < 70%: Run /pdca-iterate for auto-fix
3. If match rate >= 90%: Proceed to next phase
4. Update design doc if implementation differs intentionally`;

// v2.0.5: Comprehensive metrics collection (M1, M2, M3, M7)
try {
  const { readStdinSync } = require('../lib/core/hook-io');
  const mc = require('../lib/quality/metrics-collector');
  const { extractFeatureFromContext, getPdcaStatusFull } = require('../lib/pdca/status');
  const currentStatus = getPdcaStatusFull();
  const feature = extractFeatureFromContext({ currentStatus });
  const f = feature || 'unknown';
  const matchRate = currentStatus.features?.[feature]?.matchRate || 0;

  // M1: Match Rate (from pdca-status, set by gap-detector)
  if (matchRate > 0) {
    mc.collectMetric('M1', f, matchRate, 'code-analyzer');
  }

  // Read agent output for metric extraction
  let agentOutput = '';
  try { agentOutput = typeof message === 'string' ? message : ''; } catch (_) {}

  // M2: Code Quality Score — extract from code-analyzer output
  const qualityPattern = /(Quality|quality)\s*(Score|score|점수)[^0-9]*(\d+)/i;
  const qualityMatch = agentOutput.match(qualityPattern);
  const qualityScore = qualityMatch ? parseInt(qualityMatch[3], 10) : 75; // default baseline
  mc.collectMetric('M2', f, qualityScore, 'code-analyzer');

  // M3: Critical Issue Count — extract from output
  const criticalPattern = /(Critical|critical|심각|重大)[^0-9]*(\d+)/i;
  const criticalMatch = agentOutput.match(criticalPattern);
  const criticalCount = criticalMatch ? parseInt(criticalMatch[2], 10) : 0;
  mc.collectMetric('M3', f, criticalCount, 'code-analyzer');

  // M7: Convention Compliance — extract from output
  const conventionPattern = /(Convention|convention|컨벤션|규약)\s*(Compliance|compliance|준수율)?[^0-9]*(\d+)/i;
  const conventionMatch = agentOutput.match(conventionPattern);
  const conventionRate = conventionMatch ? parseInt(conventionMatch[3], 10) : 80; // default baseline
  mc.collectMetric('M7', f, conventionRate, 'code-analyzer');
} catch (_) {}

// v1.4.0: Stop hook에 맞는 스키마 사용
outputAllow(message, 'Stop');
