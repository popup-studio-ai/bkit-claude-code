/**
 * TokenMeterPort — Type-only Port for per-turn token accounting.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §3.2.3
 * Plan SC: ENH-264 #51809 Sonnet per-turn overhead measurement.
 *
 * @module lib/domain/ports/token-meter.port
 *
 * @version 2.1.12
 */

/**
 * @typedef {Object} TurnMetadata
 * @property {string} ts - ISO timestamp
 * @property {string} sessionHash - SHA-256 session identifier (no PII)
 * @property {string} agent - Agent name (no prompt body)
 * @property {string} model - Model identifier (claude-opus/sonnet/haiku/fable)
 * @property {string} ccVersion
 * @property {number} turnIndex
 * @property {number} inputTokens
 * @property {number} outputTokens
 * @property {number} [cacheReadInputTokens] - v2.1.12 Sprint A-1: Opus 4.7 1M cache-hit tokens
 * @property {number} [cacheCreationInputTokens] - v2.1.12 Sprint A-1: cache-write tokens
 * @property {number} overheadDelta - Measured overhead vs v2.1.110 baseline
 * @property {string} [parseStatus] - v2.1.12: 'ok' | 'no_payload' | 'partial' | 'unknown'
 * @property {string|null} [parseWarnings] - v2.1.12: free-form warning string when parseStatus !== 'ok'
 * @property {string[]} [ccRegressionFlags] - Known CC regression IDs touching this turn
 */

/**
 * @typedef {Object} TokenMeterPort
 * @property {(turnId: string) => number} read - Read accumulated tokens for a turn
 * @property {(turnId: string, delta: number) => void} accumulate - Add delta tokens
 * @property {(meta: TurnMetadata) => Promise<void>} recordTurn - Append turn to ledger (NDJSON)
 * @property {() => Promise<{total: number, avgOverhead: number}>} getLedgerStats
 * @property {() => Promise<void>} rotate - 30-day rolling window maintenance
 */

module.exports = {};
