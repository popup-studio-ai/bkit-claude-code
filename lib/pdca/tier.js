/**
 * Tier System Module
 * @module lib/pdca/tier
 * @version 1.4.7
 */

const path = require('path');

// Import TIER_EXTENSIONS from core
const { TIER_EXTENSIONS } = require('../core/file');

/**
 * Get language tier for file
 * @param {string} filePath - File path
 * @returns {string} Tier: "1"|"2"|"3"|"4"|"experimental"|"unknown"
 */
function getLanguageTier(filePath) {
  // Get extension with dot (e.g., '.ts')
  const ext = path.extname(filePath).toLowerCase();
  if (!ext) return 'unknown';

  for (const [tier, extensions] of Object.entries(TIER_EXTENSIONS)) {
    // TIER_EXTENSIONS stores extensions with dot (e.g., '.ts', '.js')
    if (extensions.includes(ext)) return String(tier);
  }
  return 'unknown';
}

/**
 * Get tier description
 * @param {string} tier - Tier number or name
 * @returns {string} Description
 */
function getTierDescription(tier) {
  const descriptions = {
    '1': 'AI-Native Essential',
    '2': 'Mainstream Recommended',
    '3': 'Domain Specific',
    '4': 'Legacy/Niche',
    'experimental': 'Experimental'
  };
  return descriptions[tier] || 'Unknown';
}

/**
 * Get PDCA guidance for tier
 * @param {string} tier - Tier
 * @returns {string} Guidance message
 */
function getTierPdcaGuidance(tier) {
  const guidance = {
    '1': 'Tier 1 (AI-Native): Full PDCA support. Vibe coding optimized.',
    '2': 'Tier 2 (Mainstream): Good PDCA support. Most features available.',
    '3': 'Tier 3 (Domain): Basic PDCA support. Some limitations may apply.',
    '4': 'Tier 4 (Legacy): Limited PDCA support. Consider migration.',
    'experimental': 'Experimental: PDCA support varies. Use with caution.'
  };
  return guidance[tier] || '';
}

// Convenience tier check functions
const isTier1 = (filePath) => getLanguageTier(filePath) === '1';
const isTier2 = (filePath) => getLanguageTier(filePath) === '2';
const isTier3 = (filePath) => getLanguageTier(filePath) === '3';
const isTier4 = (filePath) => getLanguageTier(filePath) === '4';
const isExperimentalTier = (filePath) => getLanguageTier(filePath) === 'experimental';

module.exports = {
  getLanguageTier,
  getTierDescription,
  getTierPdcaGuidance,
  isTier1,
  isTier2,
  isTier3,
  isTier4,
  isExperimentalTier,
};
