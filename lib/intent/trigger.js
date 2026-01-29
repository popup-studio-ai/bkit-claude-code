/**
 * Trigger Matching Module
 * @module lib/intent/trigger
 * @version 1.4.7
 */

const { AGENT_TRIGGER_PATTERNS, SKILL_TRIGGER_PATTERNS, matchMultiLangPattern } = require('./language');

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

/**
 * Feature detection patterns (8 languages)
 */
const NEW_FEATURE_PATTERNS = {
  en: ['new feature', 'add feature', 'create feature', 'implement', 'build'],
  ko: ['새 기능', '기능 추가', '기능 만들기', '구현', '개발'],
  ja: ['新機能', '機能追加', '機能を作る', '実装', '開発'],
  zh: ['新功能', '添加功能', '创建功能', '实现', '开发'],
  es: ['nueva función', 'agregar función', 'crear función', 'implementar'],
  fr: ['nouvelle fonction', 'ajouter fonction', 'créer fonction', 'implémenter'],
  de: ['neue Funktion', 'Funktion hinzufügen', 'Funktion erstellen', 'implementieren'],
  it: ['nuova funzione', 'aggiungere funzione', 'creare funzione', 'implementare']
};

/**
 * Match implicit agent trigger from user message
 * @param {string} userMessage
 * @returns {{agent: string, confidence: number} | null}
 */
function matchImplicitAgentTrigger(userMessage) {
  const { debugLog, getConfig } = getCore();

  if (!userMessage) return null;

  const lowerMessage = userMessage.toLowerCase();
  const confidenceThreshold = getConfig('triggers.confidenceThreshold', 0.7);

  // Check each agent's patterns
  for (const [agent, patterns] of Object.entries(AGENT_TRIGGER_PATTERNS)) {
    if (matchMultiLangPattern(userMessage, patterns)) {
      const result = { agent: `bkit:${agent}`, confidence: 0.8 };
      debugLog('intent', 'Matched agent trigger', result);
      return result;
    }
  }

  return null;
}

/**
 * Match implicit skill trigger from user message
 * @param {string} userMessage
 * @returns {{skill: string, level: string, confidence: number} | null}
 */
function matchImplicitSkillTrigger(userMessage) {
  const { debugLog, getConfig } = getCore();

  if (!userMessage) return null;

  const confidenceThreshold = getConfig('triggers.confidenceThreshold', 0.7);

  // Check each skill's patterns
  for (const [skill, patterns] of Object.entries(SKILL_TRIGGER_PATTERNS)) {
    if (matchMultiLangPattern(userMessage, patterns)) {
      const levelMap = {
        starter: 'Starter',
        dynamic: 'Dynamic',
        enterprise: 'Enterprise',
        'mobile-app': 'Dynamic'
      };

      const result = {
        skill: `bkit:${skill}`,
        level: levelMap[skill] || 'Dynamic',
        confidence: 0.8
      };
      debugLog('intent', 'Matched skill trigger', result);
      return result;
    }
  }

  return null;
}

/**
 * Detect new feature intent from user message
 * @param {string} userMessage
 * @returns {{isNewFeature: boolean, featureName: string | null, confidence: number}}
 */
function detectNewFeatureIntent(userMessage) {
  const { debugLog } = getCore();

  if (!userMessage) {
    return { isNewFeature: false, featureName: null, confidence: 0 };
  }

  // Check for new feature patterns
  const isNewFeature = matchMultiLangPattern(userMessage, NEW_FEATURE_PATTERNS);

  if (!isNewFeature) {
    return { isNewFeature: false, featureName: null, confidence: 0 };
  }

  // Try to extract feature name
  let featureName = null;

  // Pattern: "feature called X" or "feature named X"
  const namedMatch = userMessage.match(/(?:called|named|이름이?)\s+["']?(\w[\w-]*)["']?/i);
  if (namedMatch) {
    featureName = namedMatch[1];
  }

  // Pattern: quoted name
  const quotedMatch = userMessage.match(/["'](\w[\w-]*)["']/);
  if (!featureName && quotedMatch) {
    featureName = quotedMatch[1];
  }

  const result = {
    isNewFeature: true,
    featureName,
    confidence: featureName ? 0.9 : 0.7
  };

  debugLog('intent', 'Detected new feature intent', result);
  return result;
}

/**
 * Extract feature name from request
 * @param {string} request
 * @returns {string | null}
 */
function extractFeatureNameFromRequest(request) {
  if (!request) return null;

  // Try various extraction patterns
  const patterns = [
    /feature\s+["']?(\w[\w-]*)["']?/i,
    /(?:called|named)\s+["']?(\w[\w-]*)["']?/i,
    /["'](\w[\w-]*)["']/,
    /implement\s+(\w[\w-]*)/i,
    /build\s+(\w[\w-]*)/i
  ];

  for (const pattern of patterns) {
    const match = request.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

module.exports = {
  NEW_FEATURE_PATTERNS,
  matchImplicitAgentTrigger,
  matchImplicitSkillTrigger,
  detectNewFeatureIntent,
  extractFeatureNameFromRequest,
};
