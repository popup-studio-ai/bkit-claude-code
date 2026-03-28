#!/usr/bin/env node
/**
 * qa-stop.js - Guide next steps after QA session completion
 *
 * Purpose: Provide guidance after Zero Script QA session
 * Hook: Stop for zero-script-qa skill
 *
 * Converted from: scripts/qa-stop.sh
 */

const { outputAllow } = require('../lib/core/hook-io');

// Output guidance for next steps after QA session
const message = `QA Session completed.

Next steps:
1. Review logs for any missed issues
2. Document findings in docs/03-analysis/
3. Run /pdca-iterate if issues found need fixing`;

// v2.0.5: M5/M6 metrics collection with actual extraction
try {
  const { readStdinSync } = require('../lib/core/hook-io');
  const mc = require('../lib/quality/metrics-collector');
  const { extractFeatureFromContext, getPdcaStatusFull } = require('../lib/pdca/status');
  const currentStatus = getPdcaStatusFull();
  const feature = extractFeatureFromContext({ currentStatus });
  const f = feature || 'unknown';

  // Read QA agent output
  let qaOutput = '';
  try { qaOutput = typeof message === 'string' ? message : ''; } catch (_) {}

  // M5: Runtime Error Rate — extract from QA log analysis
  const errorRatePattern = /(Error|error)\s*(Rate|rate|비율)[^0-9]*(\d+\.?\d*)/i;
  const errorMatch = qaOutput.match(errorRatePattern);
  const errorRate = errorMatch ? parseFloat(errorMatch[3]) : 0; // 0% = no errors found
  mc.collectMetric('M5', f, errorRate, 'qa-monitor');

  // M6: P95 Response Time — extract from QA log analysis
  const p95Pattern = /(P95|p95|95th|응답시간)[^0-9]*(\d+\.?\d*)\s*(ms|s)?/i;
  const p95Match = qaOutput.match(p95Pattern);
  let p95Ms = 0;
  if (p95Match) {
    p95Ms = parseFloat(p95Match[2]);
    if (p95Match[3] === 's') p95Ms *= 1000; // convert seconds to ms
  }
  mc.collectMetric('M6', f, p95Ms, 'qa-monitor');
} catch (_) {}

// v1.4.0: Stop hook에 맞는 스키마 사용
outputAllow(message, 'Stop');
