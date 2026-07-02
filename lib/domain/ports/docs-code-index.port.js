/**
 * DocsCodeIndexPort — Type-only Port for Docs=Code invariant enforcement.
 *
 * Design Ref: bkit-v2110-integrated-enhancement.design.md §8
 * Plan SC: ENH-241 Docs=Code cross-check (skills=39, agents=36, hooks=21events/24blocks).
 *
 * @module lib/domain/ports/docs-code-index.port
 *
 * @version 2.1.12
 */

/**
 * @typedef {Object} InventoryMeasurement
 * @property {number} skills
 * @property {number} agents
 * @property {number} hookEvents - unique event names (22)
 * @property {number} hookBlocks - matcher-separated blocks (25)
 * @property {number} mcpTools - total tools across servers (19)
 * @property {number} libModules
 * @property {number} scripts
 */

/**
 * @typedef {Object} Discrepancy
 * @property {string} docPath - Path of doc with discrepancy
 * @property {string} field - Field name (e.g. "skills")
 * @property {number} declared
 * @property {number} actual
 */

/**
 * @typedef {Object} DocsCodeIndexPort
 * @property {() => Promise<InventoryMeasurement>} measure
 * @property {(docPath: string) => Promise<Discrepancy[]>} crossCheck
 */

module.exports = {};
