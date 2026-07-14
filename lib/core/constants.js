/**
 * bkit Central Constants
 * @module lib/core/constants
 * @version 2.1.10
 *
 * All magic numbers extracted from codebase.
 * Categories: PDCA, TEAM, CACHE, IO, QA, CLASSIFICATION
 */

// ============================================================
// PDCA Constants
// ============================================================

/** Match rate threshold for PDCA phase transition (check -> report) */
const MATCH_RATE_THRESHOLD = 90;

/** Match rate below which a warning is issued */
const MATCH_RATE_WARNING = 70;

/** Maximum history entries in pdca-status.json */
const MAX_HISTORY_ENTRIES = 100;

/** Threshold for auto-starting PDCA (char count) */
const AUTO_START_THRESHOLD = 100;

/** Maximum concurrent features tracked */
const MAX_FEATURES = 50;

/** Ambiguity score above which clarifying questions are generated */
const AMBIGUITY_THRESHOLD = 50;

/** Maximum PDCA iterations before circuit breaker */
const MAX_PDCA_ITERATIONS = 10;

/** PDCA phase names in order */
const PDCA_PHASES = ['pm', 'plan', 'design', 'do', 'check', 'act', 'report'];

/** Automation levels (L0: manual, L1: guide, L2: semi-auto, L3: auto, L4: full-auto) */
const AUTOMATION_LEVELS = {
  L0_MANUAL: 0,
  L1_GUIDE: 1,
  L2_SEMI_AUTO: 2,
  L3_AUTO: 3,
  L4_FULL_AUTO: 4,
};

// ============================================================
// Team Constants
// ============================================================

/** Maximum simultaneous teammates in Team Mode */
const MAX_TEAMMATES = 10;

/** Maximum recent messages in agent-state.json ring buffer */
const MAX_TEAM_MESSAGES = 50;

/** Maximum version history entries in PLUGIN_DATA backup */
const MAX_VERSION_HISTORY = 50;

// ============================================================
// Cache TTL Constants (milliseconds)
// ============================================================

/** Default cache TTL */
const DEFAULT_CACHE_TTL = 5000;

/** Tool search result cache TTL */
const TOOLSEARCH_CACHE_TTL = 60000;

/** Import resolver cache TTL */
const IMPORT_CACHE_TTL = 30000;

/** Skill orchestrator/loader cache TTL */
const SKILL_CACHE_TTL = 30000;

/** PDCA status cache TTL */
const PDCA_STATUS_CACHE_TTL = 3000;

/** Context hierarchy cache TTL */
const CONTEXT_CACHE_TTL = 5000;

/** bkit.config.json cache TTL */
const BKIT_CONFIG_CACHE_TTL = 10000;

// ============================================================
// I/O Constants
// ============================================================

/** Maximum context length for hook output truncation */
const MAX_CONTEXT_LENGTH = 500;

/** Hook script execution timeout (ms) */
const HOOK_TIMEOUT_MS = 5000;

/**
 * Bounded stdin read timeout (ms) — env override: BKIT_STDIN_TIMEOUT_MS.
 *
 * Issue #139: fs.readFileSync(0) blocks until stdin EOF with no timeout, so a
 * hook stalls for as long as Claude Code keeps the stdin write-end open (observed
 * up to ~15.5 min). This bound is the wall-clock budget for reading the payload;
 * parse-early returns well before it for normal payloads. 2000 ms is ~2.5x the
 * observed healthy average (~0.8 s) yet well under HOOK_TIMEOUT_MS (5000) and CC's
 * Stop-hook timeout (10000), so bkit bounds the read before either outer timeout.
 */
const STDIN_READ_TIMEOUT_MS = Number(process.env.BKIT_STDIN_TIMEOUT_MS) > 0
  ? Number(process.env.BKIT_STDIN_TIMEOUT_MS)
  : 2000;

// ============================================================
// QA / Quality Constants
// ============================================================

/** Maximum quality history entries */
const MAX_QUALITY_HISTORY = 100;

/** Maximum sessions tracked per skill */
const MAX_SESSIONS_PER_SKILL = 10;

/** Maximum metadata entries per skill */
const MAX_METADATA_PER_SKILL = 20;

/** Health score critical threshold (%) */
const HEALTH_CRITICAL_THRESHOLD = 50;

/** Health score needs-attention threshold (%) */
const HEALTH_ATTENTION_THRESHOLD = 80;

// ============================================================
// Classification Thresholds
// ============================================================

/** Task classification thresholds by size category */
const CLASSIFICATION_THRESHOLDS = {
  trivial: { maxChars: 200, maxLines: 10 },
  minor: { maxChars: 1000, maxLines: 50 },
  feature: { maxChars: 5000, maxLines: 200 },
};

// ============================================================
// State Store / Locking Constants
// ============================================================

/** Lock file timeout (ms) */
const LOCK_TIMEOUT_MS = 5000;

/** Lock file stale threshold for orphaned lock detection (ms) */
const LOCK_STALE_MS = 10000;

/** Retry interval for lock acquisition (ms) */
const LOCK_RETRY_INTERVAL_MS = 100;

/** Maximum lock retries */
const LOCK_MAX_RETRIES = 50;

// ============================================================
// Safety Constants
// ============================================================

/** Destructive command patterns that require confirmation */
const DESTRUCTIVE_PATTERNS = [
  /rm\s+-rf?\s/,
  /git\s+push\s+.*--force/,
  /git\s+reset\s+--hard/,
  /git\s+clean\s+-[fd]/,
  /drop\s+table/i,
  /drop\s+database/i,
  /truncate\s+table/i,
];

/** Loop detection limits for recursive operations */
const LOOP_DETECT_LIMITS = {
  maxRecursionDepth: 20,
  maxIterationsPerPhase: 50,
  maxRetries: 3,
};

// ============================================================
// Exports
// ============================================================

module.exports = {
  // PDCA
  MATCH_RATE_THRESHOLD,
  MATCH_RATE_WARNING,
  MAX_HISTORY_ENTRIES,
  AUTO_START_THRESHOLD,
  MAX_FEATURES,
  AMBIGUITY_THRESHOLD,
  MAX_PDCA_ITERATIONS,
  PDCA_PHASES,
  AUTOMATION_LEVELS,

  // Team
  MAX_TEAMMATES,
  MAX_TEAM_MESSAGES,
  MAX_VERSION_HISTORY,

  // Cache TTL
  DEFAULT_CACHE_TTL,
  TOOLSEARCH_CACHE_TTL,
  IMPORT_CACHE_TTL,
  SKILL_CACHE_TTL,
  PDCA_STATUS_CACHE_TTL,
  CONTEXT_CACHE_TTL,
  BKIT_CONFIG_CACHE_TTL,

  // I/O
  MAX_CONTEXT_LENGTH,
  HOOK_TIMEOUT_MS,
  STDIN_READ_TIMEOUT_MS,

  // QA
  MAX_QUALITY_HISTORY,
  MAX_SESSIONS_PER_SKILL,
  MAX_METADATA_PER_SKILL,
  HEALTH_CRITICAL_THRESHOLD,
  HEALTH_ATTENTION_THRESHOLD,

  // Classification
  CLASSIFICATION_THRESHOLDS,

  // State Store / Locking
  LOCK_TIMEOUT_MS,
  LOCK_STALE_MS,
  LOCK_RETRY_INTERVAL_MS,
  LOCK_MAX_RETRIES,

  // Safety
  DESTRUCTIVE_PATTERNS,
  LOOP_DETECT_LIMITS,

  // Utility
  generateUUID,
};

// ============================================================
// Utility Functions
// ============================================================

/**
 * Generate a UUID v4 string.
 * Uses crypto.randomUUID() when available, falls back to manual generation.
 * @returns {string} UUID v4
 */
function generateUUID() {
  const crypto = require('crypto');
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for Node <19
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}
