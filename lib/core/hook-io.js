/**
 * Hook I/O — Compatibility shim
 * @module lib/core/hook-io
 * @version 2.1.1
 *
 * v2.1.1: Merged into lib/core/io. This file re-exports io for backward compatibility.
 * New code should import from lib/core/io directly.
 */

module.exports = require('./io');
