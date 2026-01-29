/**
 * Ambiguity Analysis Module
 * @module lib/intent/ambiguity
 * @version 1.4.7
 */

// Lazy require
let _core = null;
function getCore() {
  if (!_core) {
    _core = require('../core');
  }
  return _core;
}

/**
 * Check if text contains file path
 * @param {string} text
 * @returns {boolean}
 */
function containsFilePath(text) {
  if (!text) return false;

  const filePathPatterns = [
    /\/[\w.-]+\/[\w.-]+/,           // Unix paths
    /[A-Z]:\\[\w.-]+\\[\w.-]+/,     // Windows paths
    /\.\/[\w.-]+/,                   // Relative paths
    /\.(js|ts|py|go|rs|java|tsx|jsx|vue|svelte|md|json|yaml|yml)$/i
  ];

  return filePathPatterns.some(p => p.test(text));
}

/**
 * Check if text contains technical terms
 * @param {string} text
 * @returns {boolean}
 */
function containsTechnicalTerms(text) {
  if (!text) return false;

  const technicalTerms = [
    'api', 'database', 'server', 'client', 'component', 'module',
    'function', 'class', 'interface', 'type', 'schema', 'endpoint',
    'authentication', 'authorization', 'middleware', 'controller',
    'service', 'repository', 'model', 'view', 'hook', 'context'
  ];

  const lowerText = text.toLowerCase();
  return technicalTerms.some(term => lowerText.includes(term));
}

/**
 * Check if text has specific nouns (feature names, etc)
 * @param {string} text
 * @returns {boolean}
 */
function hasSpecificNouns(text) {
  if (!text) return false;

  // Check for quoted strings or PascalCase/camelCase identifiers
  return /"[^"]+"/.test(text) ||
         /'[^']+'/.test(text) ||
         /[A-Z][a-z]+[A-Z][a-z]+/.test(text) ||
         /[a-z]+[A-Z][a-z]+/.test(text);
}

/**
 * Check if text has scope definition
 * @param {string} text
 * @returns {boolean}
 */
function hasScopeDefinition(text) {
  if (!text) return false;

  const scopePatterns = [
    /only|just|specifically|exactly/i,
    /all|every|entire|whole/i,
    /from\s+\w+\s+to\s+\w+/i,
    /in\s+the\s+\w+\s+(?:file|folder|directory|module)/i
  ];

  return scopePatterns.some(p => p.test(text));
}

/**
 * Check if text has multiple interpretations
 * @param {string} text
 * @returns {boolean}
 */
function hasMultipleInterpretations(text) {
  if (!text) return false;

  const ambiguousPatterns = [
    /maybe|perhaps|or|either/i,
    /it|this|that|those|these/i,       // Pronouns without context
    /stuff|things|something/i,          // Vague nouns
    /fix|update|change|modify/i         // Vague verbs
  ];

  const pronounCount = (text.match(/\b(it|this|that)\b/gi) || []).length;

  return pronounCount >= 2 || ambiguousPatterns.some(p => p.test(text));
}

/**
 * Detect context conflicts
 * @param {string} request
 * @param {Object} context
 * @returns {string[]}
 */
function detectContextConflicts(request, context = {}) {
  const conflicts = [];

  // Check for phase mismatch
  if (context.currentPhase && request) {
    const phaseKeywords = {
      plan: ['implement', 'code', 'build', 'deploy'],
      design: ['deploy', 'test', 'release'],
      do: ['plan', 'design', 'architecture']
    };

    const currentKeywords = phaseKeywords[context.currentPhase] || [];
    const lowerRequest = request.toLowerCase();

    for (const keyword of currentKeywords) {
      if (lowerRequest.includes(keyword)) {
        conflicts.push(`Request mentions "${keyword}" but current phase is "${context.currentPhase}"`);
      }
    }
  }

  return conflicts;
}

/**
 * Calculate ambiguity score for user request
 * @param {string} userRequest
 * @param {Object} context
 * @returns {{score: number, factors: string[]}}
 */
function calculateAmbiguityScore(userRequest, context = {}) {
  const { getConfig } = getCore();

  const factors = [];
  let score = 0;

  // Factor 1: No file path (higher ambiguity)
  if (!containsFilePath(userRequest)) {
    factors.push('no_file_path');
    score += 0.15;
  }

  // Factor 2: No technical terms
  if (!containsTechnicalTerms(userRequest)) {
    factors.push('no_technical_terms');
    score += 0.1;
  }

  // Factor 3: No specific nouns
  if (!hasSpecificNouns(userRequest)) {
    factors.push('no_specific_nouns');
    score += 0.15;
  }

  // Factor 4: No scope definition
  if (!hasScopeDefinition(userRequest)) {
    factors.push('no_scope');
    score += 0.1;
  }

  // Factor 5: Multiple interpretations possible
  if (hasMultipleInterpretations(userRequest)) {
    factors.push('multiple_interpretations');
    score += 0.2;
  }

  // Factor 6: Context conflicts
  const conflicts = detectContextConflicts(userRequest, context);
  if (conflicts.length > 0) {
    factors.push('context_conflict');
    score += 0.15 * conflicts.length;
  }

  // Factor 7: Short request (less context)
  if (userRequest.length < 30) {
    factors.push('short_request');
    score += 0.15;
  }

  // Clamp score to 0-1 range
  score = Math.min(1, Math.max(0, score));

  return { score, factors };
}

/**
 * Generate clarifying questions based on ambiguity
 * @param {string} userRequest
 * @param {string[]} factors
 * @returns {Object[]}
 */
function generateClarifyingQuestions(userRequest, factors = []) {
  const questions = [];

  if (factors.includes('no_file_path')) {
    questions.push({
      question: 'Which file or directory should I focus on?',
      header: 'Location',
      options: [
        { label: 'Current file', description: 'The file we\'re currently working on' },
        { label: 'Entire project', description: 'Search the whole codebase' },
        { label: 'Specific path', description: 'I\'ll provide the path' }
      ],
      multiSelect: false
    });
  }

  if (factors.includes('no_scope')) {
    questions.push({
      question: 'What is the scope of this change?',
      header: 'Scope',
      options: [
        { label: 'Single file', description: 'Change only one file' },
        { label: 'Multiple files', description: 'May affect several files' },
        { label: 'Full feature', description: 'Complete feature implementation' }
      ],
      multiSelect: false
    });
  }

  if (factors.includes('multiple_interpretations')) {
    questions.push({
      question: 'Could you be more specific about what you need?',
      header: 'Clarification',
      options: [
        { label: 'Add new code', description: 'Create new functionality' },
        { label: 'Modify existing', description: 'Change current implementation' },
        { label: 'Fix a bug', description: 'Resolve an issue' },
        { label: 'Refactor', description: 'Improve without changing behavior' }
      ],
      multiSelect: false
    });
  }

  return questions;
}

module.exports = {
  containsFilePath,
  containsTechnicalTerms,
  hasSpecificNouns,
  hasScopeDefinition,
  hasMultipleInterpretations,
  detectContextConflicts,
  calculateAmbiguityScore,
  generateClarifyingQuestions,
};
