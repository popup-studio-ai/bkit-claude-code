#!/usr/bin/env node
'use strict';
/**
 * Regression Test: 29 Agents effort/maxTurns Verification (29 TC)
 * Validates that all agent frontmatter has correct effort and maxTurns values
 *
 * @version bkit v1.6.2
 */

const path = require('path');
const fs = require('fs');
const { assert, skip, summary, reset } = require('../helpers/assert');
reset();

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');

console.log('\n=== agents-effort.test.js (29 TC) ===\n');

// Expected effort/maxTurns for each agent (verified from actual files)
const EXPECTED = {
  'bkend-expert':         { effort: 'medium', maxTurns: 20 },
  'code-analyzer':        { effort: 'high',   maxTurns: 30 },
  'cto-lead':             { effort: 'high',   maxTurns: 50 },
  'design-validator':     { effort: 'high',   maxTurns: 30 },
  'enterprise-expert':    { effort: 'high',   maxTurns: 30 },
  'frontend-architect':   { effort: 'medium', maxTurns: 20 },
  'gap-detector':         { effort: 'high',   maxTurns: 30 },
  'infra-architect':      { effort: 'high',   maxTurns: 30 },
  'pdca-eval-act':        { effort: 'medium', maxTurns: 20 },
  'pdca-eval-check':      { effort: 'medium', maxTurns: 20 },
  'pdca-eval-design':     { effort: 'medium', maxTurns: 20 },
  'pdca-eval-do':         { effort: 'medium', maxTurns: 20 },
  'pdca-eval-plan':       { effort: 'medium', maxTurns: 20 },
  'pdca-eval-pm':         { effort: 'medium', maxTurns: 20 },
  'pdca-iterator':        { effort: 'medium', maxTurns: 20 },
  'pipeline-guide':       { effort: 'medium', maxTurns: 20 },
  'pm-discovery':         { effort: 'medium', maxTurns: 25 },
  'pm-lead':              { effort: 'high',   maxTurns: 30 },
  'pm-lead-skill-patch':  { effort: 'medium', maxTurns: 20 },
  'pm-prd':               { effort: 'medium', maxTurns: 25 },
  'pm-research':          { effort: 'medium', maxTurns: 20 },
  'pm-strategy':          { effort: 'medium', maxTurns: 20 },
  'product-manager':      { effort: 'medium', maxTurns: 20 },
  'qa-monitor':           { effort: 'low',    maxTurns: 15 },
  'qa-strategist':        { effort: 'medium', maxTurns: 20 },
  'report-generator':     { effort: 'low',    maxTurns: 15 },
  'security-architect':   { effort: 'high',   maxTurns: 30 },
  'skill-needs-extractor': { effort: 'medium', maxTurns: 20 },
  'starter-guide':        { effort: 'medium', maxTurns: 20 },
};

// Test each agent
const agentNames = Object.keys(EXPECTED);
agentNames.forEach((agent, idx) => {
  const num = String(idx + 1).padStart(2, '0');
  const filePath = path.join(AGENTS_DIR, `${agent}.md`);

  if (!fs.existsSync(filePath)) {
    assert(`AE-${num}`, false, `${agent}: file not found at ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const effortMatch = content.match(/^effort:\s*(\S+)/m);
  const turnsMatch = content.match(/^maxTurns:\s*(\d+)/m);
  const effortVal = effortMatch ? effortMatch[1] : null;
  const maxTurnsVal = turnsMatch ? parseInt(turnsMatch[1]) : null;

  const expected = EXPECTED[agent];
  const effortOk = effortVal === expected.effort;
  const turnsOk = maxTurnsVal === expected.maxTurns;

  assert(`AE-${num}`,
    effortOk && turnsOk,
    `${agent}: effort=${effortVal}(expect ${expected.effort}), maxTurns=${maxTurnsVal}(expect ${expected.maxTurns})`
  );
});

summary('Agents Effort/MaxTurns Regression Tests');
