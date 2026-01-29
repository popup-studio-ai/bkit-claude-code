/**
 * Task Classification Module
 * @module lib/task/classification
 * @version 1.4.7
 */

/**
 * Classification thresholds
 */
const CLASSIFICATION_THRESHOLDS = {
  trivial: { maxChars: 200, maxLines: 10 },
  minor: { maxChars: 1000, maxLines: 50 },
  feature: { maxChars: 5000, maxLines: 200 },
  major: { maxChars: Infinity, maxLines: Infinity }
};

/**
 * Classify task by character count
 * @param {string} content
 * @returns {'trivial' | 'minor' | 'feature' | 'major'}
 */
function classifyTask(content) {
  if (!content) return 'trivial';

  const charCount = content.length;

  if (charCount <= CLASSIFICATION_THRESHOLDS.trivial.maxChars) return 'trivial';
  if (charCount <= CLASSIFICATION_THRESHOLDS.minor.maxChars) return 'minor';
  if (charCount <= CLASSIFICATION_THRESHOLDS.feature.maxChars) return 'feature';
  return 'major';
}

/**
 * Classify task by line count
 * @param {string} content
 * @returns {'trivial' | 'minor' | 'feature' | 'major'}
 */
function classifyTaskByLines(content) {
  if (!content) return 'trivial';

  const lineCount = content.split('\n').length;

  if (lineCount <= CLASSIFICATION_THRESHOLDS.trivial.maxLines) return 'trivial';
  if (lineCount <= CLASSIFICATION_THRESHOLDS.minor.maxLines) return 'minor';
  if (lineCount <= CLASSIFICATION_THRESHOLDS.feature.maxLines) return 'feature';
  return 'major';
}

/**
 * Get PDCA level for classification
 * @param {string} classification
 * @returns {'none' | 'light' | 'standard' | 'full'}
 */
function getPdcaLevel(classification) {
  const levels = {
    trivial: 'none',
    minor: 'light',
    feature: 'standard',
    major: 'full'
  };
  return levels[classification] || 'light';
}

/**
 * Get PDCA guidance message for classification
 * @param {string} classification
 * @returns {string}
 */
function getPdcaGuidance(classification) {
  const guidance = {
    trivial: 'Trivial change. No PDCA needed.',
    minor: 'Minor change. Consider brief documentation.',
    feature: 'Feature-level change. Design doc recommended.',
    major: 'Major change. Full PDCA cycle strongly recommended.'
  };
  return guidance[classification] || '';
}

/**
 * Get detailed PDCA guidance by level
 * @param {string} level - PDCA level
 * @param {string} feature - Feature name
 * @param {number} lineCount - Number of lines
 * @returns {string}
 */
function getPdcaGuidanceByLevel(level, feature, lineCount) {
  const guidance = {
    none: `Minor change (${lineCount} lines). PDCA optional.`,
    light: `Moderate change (${lineCount} lines). Design doc recommended for '${feature}'.`,
    standard: `Feature (${lineCount} lines). Design doc recommended for '${feature}'. Consider /pdca-design ${feature}`,
    full: `Major feature (${lineCount} lines) without design doc. Strongly recommend /pdca-design ${feature} first.`
  };
  return guidance[level] || '';
}

module.exports = {
  CLASSIFICATION_THRESHOLDS,
  classifyTask,
  classifyTaskByLines,
  getPdcaLevel,
  getPdcaGuidance,
  getPdcaGuidanceByLevel,
};
