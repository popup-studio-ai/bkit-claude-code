#!/usr/bin/env node
'use strict';
/**
 * MCP Server Behavioral Tests (10 TC)
 * Tests MCP response structure and ENH-176 _meta compliance.
 *
 * MB-001~010
 * @version bkit v2.1.0
 */

const fs = require('fs');
const path = require('path');
const { assert, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');

console.log('=== MCP Server Behavioral Tests (10 TC) ===\n');

const pdcaPath = path.join(BASE_DIR, 'servers/bkit-pdca-server/index.js');
const analysisPath = path.join(BASE_DIR, 'servers/bkit-analysis-server/index.js');

const pdcaContent = fs.readFileSync(pdcaPath, 'utf8');
const analysisContent = fs.readFileSync(analysisPath, 'utf8');

// MB-001: PDCA server _meta 500K
assert('MB-001', pdcaContent.includes('maxResultSizeChars: 500000'),
  'PDCA server has _meta.maxResultSizeChars = 500000 (ENH-176)');

// MB-002: Analysis server _meta 500K
assert('MB-002', analysisContent.includes('maxResultSizeChars: 500000'),
  'Analysis server has _meta.maxResultSizeChars = 500000 (ENH-176)');

// MB-003: PDCA server has okResponse with _meta
assert('MB-003', pdcaContent.includes('_meta') && pdcaContent.includes('okResponse'),
  'PDCA server okResponse includes _meta field');

// MB-004: Analysis server has okResponse with _meta
assert('MB-004', analysisContent.includes('_meta') && analysisContent.includes('okResponse'),
  'Analysis server okResponse includes _meta field');

// MB-005: PDCA server uses stdio transport
assert('MB-005', pdcaContent.includes('readline') || pdcaContent.includes('stdin'),
  'PDCA server uses stdio transport (readline/stdin)');

// MB-006: Analysis server uses stdio transport
assert('MB-006', analysisContent.includes('readline') || analysisContent.includes('stdin'),
  'Analysis server uses stdio transport');

// MB-007: PDCA server version
assert('MB-007', pdcaContent.includes('2.0.4') || pdcaContent.includes('2.1.0'),
  'PDCA server has version identifier');

// MB-008: Both servers handle initialize method
assert('MB-008',
  pdcaContent.includes('initialize') && analysisContent.includes('initialize'),
  'Both servers handle initialize JSON-RPC method');

// MB-009: Both servers handle tools/list
assert('MB-009',
  pdcaContent.includes('tools/list') && analysisContent.includes('tools/list'),
  'Both servers handle tools/list method');

// MB-010: Both servers handle tools/call
assert('MB-010',
  pdcaContent.includes('tools/call') && analysisContent.includes('tools/call'),
  'Both servers handle tools/call method');

summary('MCP Server Behavioral Tests');
