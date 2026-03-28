/**
 * Quality Metrics Collector - 10 Quality Metrics (M1-M10)
 * @module lib/quality/metrics-collector
 * @version 2.0.0
 *
 * Collects, stores, and analyzes quality metrics across PDCA cycles.
 * Supports snapshot storage and time-series history with trend analysis.
 *
 * Design: docs/02-design/features/bkit-v200-enhancement.design.md Section 2.8
 * Plan: docs/01-plan/features/bkit-v200-enhancement.plan.md Section 11
 */

const path = require('path');
const stateStore = require('../core/state-store');
const { STATE_PATHS } = require('../core/paths');
const { MAX_QUALITY_HISTORY } = require('../core/constants');

// ============================================================
// Metric Specifications (M1-M10)
// ============================================================

/**
 * @typedef {Object} MetricSpec
 * @property {string} id - Metric identifier (M1-M10)
 * @property {string} name - Human-readable metric name
 * @property {string} collector - Agent/source that collects this metric
 * @property {string} unit - Unit of measurement (%, count, 0-100, ms, hours, %p/iteration)
 * @property {'higher'|'lower'} direction - Whether higher or lower is better
 */

/** @type {Record<string, MetricSpec>} */
const METRIC_SPECS = {
  M1: { id: 'M1', name: 'Match Rate', collector: 'gap-detector', unit: '%', direction: 'higher' },
  M2: { id: 'M2', name: 'Code Quality Score', collector: 'code-analyzer', unit: '0-100', direction: 'higher' },
  M3: { id: 'M3', name: 'Critical Issue Count', collector: 'code-analyzer', unit: 'count', direction: 'lower' },
  M4: { id: 'M4', name: 'API Compliance Rate', collector: 'gap-detector', unit: '%', direction: 'higher' },
  M5: { id: 'M5', name: 'Runtime Error Rate', collector: 'qa-monitor', unit: '%', direction: 'lower' },
  M6: { id: 'M6', name: 'P95 Response Time', collector: 'qa-monitor', unit: 'ms', direction: 'lower' },
  M7: { id: 'M7', name: 'Convention Compliance', collector: 'code-analyzer', unit: '%', direction: 'higher' },
  M8: { id: 'M8', name: 'Design Completeness', collector: 'design-validator', unit: '0-100', direction: 'higher' },
  M9: { id: 'M9', name: 'Iteration Efficiency', collector: 'pdca-iterator', unit: '%p/iteration', direction: 'higher' },
  M10: { id: 'M10', name: 'PDCA Cycle Time', collector: 'computed', unit: 'hours', direction: 'lower' },
};

// ============================================================
// Schema Bridge: M-ID ↔ Gate-Manager friendly names
// ============================================================

/**
 * Mapping from metric ID (M1-M10) to gate-manager metric names.
 * gate-manager uses these keys in GATE_DEFINITIONS conditions.
 * @type {Record<string, string>}
 */
const METRIC_ID_TO_GATE_NAME = {
  M1: 'matchRate',
  M2: 'codeQualityScore',
  M3: 'criticalIssueCount',
  M4: 'apiComplianceRate',
  M5: 'runtimeErrorRate',
  M6: 'p95ResponseTime',
  M7: 'conventionCompliance',
  M8: 'designCompleteness',
  M9: 'iterationEfficiency',
  M10: 'pdcaCycleTimeHours',
};

/** @type {Record<string, string>} */
const GATE_NAME_TO_METRIC_ID = Object.fromEntries(
  Object.entries(METRIC_ID_TO_GATE_NAME).map(([k, v]) => [v, k])
);

/**
 * Convert collected metrics (keyed by M1-M10) to gate-manager format
 * (keyed by friendly names like matchRate, codeQualityScore).
 *
 * @param {string} feature - Feature name
 * @returns {Record<string, number>|null} Flat object for gate-manager, or null
 */
function toGateFormat(feature) {
  const snapshot = readCurrentMetrics(feature);
  if (!snapshot || !snapshot.metrics) return null;

  const result = {};
  for (const [metricId, gateName] of Object.entries(METRIC_ID_TO_GATE_NAME)) {
    const entry = snapshot.metrics[metricId];
    if (entry && entry.value != null) {
      result[gateName] = entry.value;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Convert collected metrics to pdca-status.json metrics sub-object format.
 *
 * @param {string} feature - Feature name
 * @returns {Object|null} Object matching pdca-status feat.metrics shape
 */
function toPdcaStatusFormat(feature) {
  const gateMetrics = toGateFormat(feature);
  if (!gateMetrics) return null;

  return {
    qualityScore: gateMetrics.codeQualityScore ?? null,
    conventionCompliance: gateMetrics.conventionCompliance ?? null,
    apiCompliance: gateMetrics.apiComplianceRate ?? null,
    cycleTimeMs: gateMetrics.pdcaCycleTimeHours != null
      ? Math.round(gateMetrics.pdcaCycleTimeHours * 3600000)
      : null,
    iterationEfficiency: gateMetrics.iterationEfficiency ?? null,
  };
}

// ============================================================
// Storage Paths
// ============================================================

/**
 * Get path to quality metrics snapshot file.
 * @returns {string}
 */
function _metricsPath() {
  return path.join(STATE_PATHS.state(), 'quality-metrics.json');
}

/**
 * Get path to quality history time-series file.
 * @returns {string}
 */
function _historyPath() {
  return path.join(STATE_PATHS.state(), 'quality-history.json');
}

// ============================================================
// Metric Collection
// ============================================================

/**
 * @typedef {Object} QualityMetrics
 * @property {string} feature - Feature name
 * @property {string} phase - PDCA phase when collected
 * @property {string} projectLevel - Project level
 * @property {string} timestamp - ISO 8601 timestamp
 * @property {Record<string, {value: number, collector: string, collectedAt: string}>} metrics - Metric values
 */

/**
 * Collect a single metric value.
 * Updates the current metrics snapshot for the feature.
 *
 * @param {string} metricId - Metric identifier (M1-M10)
 * @param {string} feature - Feature name
 * @param {number} value - Measured value
 * @param {string} [collector] - Override collector name (defaults to spec)
 */
function collectMetric(metricId, feature, value, collector) {
  const spec = METRIC_SPECS[metricId];
  if (!spec) return;

  const filePath = _metricsPath();
  const current = stateStore.read(filePath) || {};

  if (!current[feature]) {
    current[feature] = {
      feature,
      phase: null,
      projectLevel: null,
      timestamp: new Date().toISOString(),
      metrics: {},
    };
  }

  current[feature].metrics[metricId] = {
    value,
    collector: collector || spec.collector,
    collectedAt: new Date().toISOString(),
  };
  current[feature].timestamp = new Date().toISOString();

  stateStore.write(filePath, current);
}

/**
 * Collect all available metrics for a PDCA phase.
 * This is typically called by check/act agents after analysis completes.
 *
 * @param {string} phase - PDCA phase name
 * @param {string} feature - Feature name
 * @param {string} [projectLevel='Dynamic'] - Project level
 * @returns {QualityMetrics|null} Current metrics snapshot for the feature, or null
 */
function collectPhaseMetrics(phase, feature, projectLevel) {
  const filePath = _metricsPath();
  const current = stateStore.read(filePath) || {};

  if (!current[feature]) {
    return null;
  }

  current[feature].phase = phase;
  current[feature].projectLevel = projectLevel || 'Dynamic';
  current[feature].timestamp = new Date().toISOString();

  stateStore.write(filePath, current);
  return current[feature];
}

// ============================================================
// Storage Operations
// ============================================================

/**
 * Save a complete metrics snapshot (overwrite for feature).
 * @param {QualityMetrics} metrics - Full metrics object to save
 */
function saveMetrics(metrics) {
  if (!metrics || !metrics.feature) return;

  const filePath = _metricsPath();
  const current = stateStore.read(filePath) || {};
  current[metrics.feature] = metrics;
  stateStore.write(filePath, current);
}

/**
 * Append a data point to quality history (time series).
 * Enforces FIFO with MAX_QUALITY_HISTORY limit (100 points).
 *
 * @param {Object} dataPoint - Data point to append
 * @param {string} dataPoint.feature - Feature name
 * @param {string} dataPoint.phase - PDCA phase
 * @param {number} dataPoint.cycle - PDCA iteration number
 * @param {string} dataPoint.timestamp - ISO 8601 timestamp
 * @param {Record<string, number>} dataPoint.values - Metric values keyed by metric ID
 */
function appendHistory(dataPoint) {
  const filePath = _historyPath();
  const history = stateStore.read(filePath) || { points: [] };

  history.points.push(dataPoint);

  // FIFO: keep last MAX_QUALITY_HISTORY entries
  if (history.points.length > MAX_QUALITY_HISTORY) {
    history.points = history.points.slice(-MAX_QUALITY_HISTORY);
  }

  history.lastUpdated = new Date().toISOString();
  stateStore.write(filePath, history);
}

/**
 * Read current metrics snapshot for a feature.
 * @param {string} feature - Feature name
 * @returns {QualityMetrics|null}
 */
function readCurrentMetrics(feature) {
  const filePath = _metricsPath();
  const current = stateStore.read(filePath);
  if (!current || !current[feature]) return null;
  return current[feature];
}

/**
 * Read recent history data points, optionally filtered by feature.
 * @param {number} [cycles=10] - Number of recent cycles to retrieve
 * @param {string} [feature] - Filter by feature name (null = all features)
 * @returns {Object[]} Array of QualityDataPoint objects
 */
function readRecentHistory(cycles, feature) {
  const filePath = _historyPath();
  const history = stateStore.read(filePath);
  if (!history || !history.points) return [];

  let points = history.points;
  if (feature) {
    points = points.filter(p => p.feature === feature);
  }

  const limit = cycles || 10;
  return points.slice(-limit);
}

// ============================================================
// Trend Analysis
// ============================================================

/**
 * @typedef {Object} AlarmCondition
 * @property {string} type - Alarm type identifier
 * @property {string} message - Human-readable alarm message
 * @property {string} recommendation - Recommended action
 */

/**
 * @typedef {Object} TrendAnalysis
 * @property {number} cycles - Number of cycles analyzed
 * @property {Record<string, number>} movingAverages - 3-cycle moving averages per metric
 * @property {'improving'|'stable'|'declining'} trend - Overall quality trend
 * @property {AlarmCondition[]} alarms - Triggered alarm conditions
 */

/**
 * Analyze quality trends for a feature based on history.
 * Checks 6 alarm conditions for early warning.
 *
 * @param {string} feature - Feature name
 * @returns {TrendAnalysis}
 */
function analyzeTrend(feature) {
  const points = readRecentHistory(20, feature);

  const result = {
    cycles: points.length,
    movingAverages: {},
    trend: /** @type {'improving'|'stable'|'declining'} */ ('stable'),
    alarms: [],
  };

  if (points.length < 2) return result;

  // Compute 3-cycle moving averages for key metrics
  const metricIds = ['M1', 'M2', 'M3', 'M7', 'M9', 'M10'];
  for (const mid of metricIds) {
    const values = points
      .filter(p => p.values && p.values[mid] != null)
      .map(p => p.values[mid]);
    if (values.length >= 3) {
      const last3 = values.slice(-3);
      result.movingAverages[mid] = Math.round((last3[0] + last3[1] + last3[2]) / 3 * 100) / 100;
    }
  }

  // Determine overall trend from matchRate (M1)
  const matchRates = points
    .filter(p => p.values && p.values.M1 != null)
    .map(p => p.values.M1);

  if (matchRates.length >= 3) {
    const recent = matchRates.slice(-3);
    const earlier = matchRates.slice(-6, -3);
    if (earlier.length >= 3) {
      const recentAvg = (recent[0] + recent[1] + recent[2]) / 3;
      const earlierAvg = (earlier[0] + earlier[1] + earlier[2]) / 3;
      if (recentAvg > earlierAvg + 2) {
        result.trend = 'improving';
      } else if (recentAvg < earlierAvg - 2) {
        result.trend = 'declining';
      }
    }
  }

  // ---- 6 Alarm Conditions ----

  // Alarm 1: 3-cycle consecutive matchRate decline
  if (matchRates.length >= 3) {
    const last3 = matchRates.slice(-3);
    if (last3[2] < last3[1] && last3[1] < last3[0]) {
      result.alarms.push({
        type: 'matchRate_consecutive_decline',
        message: 'Match rate declined for 3 consecutive cycles',
        recommendation: 'Architecture review recommended. Check if design docs are diverging from implementation.',
      });
    }
  }

  // Alarm 2: Critical issues 2+ consecutive cycles
  const criticalCounts = points
    .filter(p => p.values && p.values.M3 != null)
    .map(p => p.values.M3);
  if (criticalCounts.length >= 2) {
    const last2 = criticalCounts.slice(-2);
    if (last2[0] > 0 && last2[1] > 0) {
      result.alarms.push({
        type: 'critical_issues_persistent',
        message: 'Critical issues present in 2+ consecutive cycles',
        recommendation: 'Regression alert: investigate root cause of persistent critical issues.',
      });
    }
  }

  // Alarm 3: Quality Score moving avg < 75
  if (result.movingAverages.M2 != null && result.movingAverages.M2 < 75) {
    result.alarms.push({
      type: 'quality_score_low',
      message: `Code quality score moving average is ${result.movingAverages.M2} (< 75)`,
      recommendation: 'Refactoring recommended. Focus on code structure and best practices.',
    });
  }

  // Alarm 4: Iteration efficiency < 3%p
  if (result.movingAverages.M9 != null && result.movingAverages.M9 < 3) {
    result.alarms.push({
      type: 'iteration_efficiency_low',
      message: `Iteration efficiency is ${result.movingAverages.M9}%p (< 3%p)`,
      recommendation: 'Strategy review needed. Each iteration should improve matchRate by at least 3%p.',
    });
  }

  // Alarm 5: Cycle time > 150% budget
  // Budget heuristic: 4 hours for standard feature
  const cycleTimes = points
    .filter(p => p.values && p.values.M10 != null)
    .map(p => p.values.M10);
  if (cycleTimes.length >= 1) {
    const lastCycleTime = cycleTimes[cycleTimes.length - 1];
    const budgetHours = 4;
    if (lastCycleTime > budgetHours * 1.5) {
      result.alarms.push({
        type: 'cycle_time_exceeded',
        message: `Cycle time ${lastCycleTime}h exceeds 150% of ${budgetHours}h budget`,
        recommendation: 'Consider splitting the task into smaller features for faster iteration.',
      });
    }
  }

  // Alarm 6: Convention compliance -10%p drop
  const conventions = points
    .filter(p => p.values && p.values.M7 != null)
    .map(p => p.values.M7);
  if (conventions.length >= 2) {
    const prev = conventions[conventions.length - 2];
    const curr = conventions[conventions.length - 1];
    if (prev - curr >= 10) {
      result.alarms.push({
        type: 'convention_compliance_drop',
        message: `Convention compliance dropped by ${prev - curr}%p (from ${prev}% to ${curr}%)`,
        recommendation: 'Run linter check. New code may be violating established conventions.',
      });
    }
  }

  return result;
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  METRIC_SPECS,
  METRIC_ID_TO_GATE_NAME,
  GATE_NAME_TO_METRIC_ID,
  collectMetric,
  collectPhaseMetrics,
  saveMetrics,
  appendHistory,
  readCurrentMetrics,
  readRecentHistory,
  analyzeTrend,
  toGateFormat,
  toPdcaStatusFormat,
};
