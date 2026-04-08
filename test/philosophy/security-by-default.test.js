'use strict';
/**
 * Philosophy Tests: Security-by-Default Principle (10 TC)
 * Tests that bkit enforces security by default:
 * - acceptEdits agents have disallowedTools
 * - Starter level blocks Team Mode
 * - Destructive commands are blocked by default
 *
 * @module test/philosophy/security-by-default.test.js
 */

const fs = require('fs');
const path = require('path');
const { assert, summary } = require('../helpers/assert');

const PROJECT_ROOT = path.resolve(__dirname, '../..');

let coordinator;
try {
  coordinator = require('../../lib/team/coordinator');
} catch (e) {
  console.error('coordinator module load failed:', e.message);
  process.exit(1);
}

console.log('\n=== security-by-default.test.js ===\n');

const agentsDir = path.join(PROJECT_ROOT, 'agents');
const configPath = path.join(PROJECT_ROOT, 'bkit.config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

/**
 * Parse agent frontmatter from markdown
 * @param {string} content
 * @returns {Object}
 */
function parseAgentFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const yaml = match[1];
  return {
    permissionMode: (yaml.match(/permissionMode:\s*(.+)/) || [])[1]?.trim(),
    hasDisallowedTools: yaml.includes('disallowedTools:'),
    raw: yaml,
  };
}

// --- PHI-SEC-001: bkit.config.json에서 파괴적 Bash 명령 deny 확인 ---
assert('PHI-SEC-001',
  config.permissions['Bash(rm -rf*)'] === 'deny',
  'Bash(rm -rf*) is denied by default in bkit.config.json'
);

// --- PHI-SEC-002: git force push deny 확인 ---
assert('PHI-SEC-002',
  config.permissions['Bash(git push --force*)'] === 'deny',
  'Bash(git push --force*) is denied by default in bkit.config.json'
);

// --- PHI-SEC-003: git reset --hard는 ask (실행 전 확인) ---
assert('PHI-SEC-003',
  config.permissions['Bash(git reset --hard*)'] === 'ask',
  'Bash(git reset --hard*) requires user confirmation (ask) by default'
);

// --- PHI-SEC-004: Starter 레벨은 Team Mode 완전 차단 ---
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '1';
const starterResult = coordinator.suggestTeamMode('a'.repeat(2000), { level: 'Starter', messageLength: 2000 });
assert('PHI-SEC-004',
  starterResult === null,
  'Starter level is completely blocked from Team Mode (Security-by-Default)'
);

// --- PHI-SEC-005: cto-lead.md has disallowedTools (v2.1.0: permissionMode removed per CC policy) ---
const ctoContent = fs.readFileSync(path.join(agentsDir, 'cto-lead.md'), 'utf-8');
const cto = parseAgentFrontmatter(ctoContent);
assert('PHI-SEC-005',
  cto.hasDisallowedTools && ctoContent.includes('# permissionMode: acceptEdits'),
  'cto-lead has disallowedTools + documented permissionMode intent (Security-by-Default)'
);

// --- PHI-SEC-006: cto-lead.md rm -rf 차단 확인 ---
assert('PHI-SEC-006',
  ctoContent.includes('Bash(rm -rf*)'),
  'cto-lead.md explicitly blocks Bash(rm -rf*)'
);

// --- PHI-SEC-007: gap-detector.md → documented plan intent + Write in tools (v2.1.0: permissionMode removed) ---
const gapContent = fs.readFileSync(path.join(agentsDir, 'gap-detector.md'), 'utf-8');
assert('PHI-SEC-007',
  gapContent.includes('# permissionMode: plan') && gapContent.includes('Write'),
  'gap-detector has documented plan intent + Write tool access (CC manages permissions)'
);

// --- PHI-SEC-008: v2.1.1 — No agents reference invalid tool names in disallowedTools ---
const agentFiles = fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'));
const invalidDisallowed = agentFiles.filter(f => {
  const content = fs.readFileSync(path.join(agentsDir, f), 'utf-8');
  return content.includes('disallowedTools:') && content.includes('  - Agent');
});
assert('PHI-SEC-008',
  invalidDisallowed.length === 0,
  `No agents have invalid disallowedTools entries${invalidDisallowed.length ? ' INVALID: ' + invalidDisallowed.join(', ') : ''}`
);

// --- PHI-SEC-009: isTeamModeAvailable — 환경 변수 없으면 false ---
process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS = '0';
assert('PHI-SEC-009',
  coordinator.isTeamModeAvailable() === false,
  'isTeamModeAvailable returns false when env var is not "1" (safe default)'
);

// --- PHI-SEC-010: rm -r* (recursive) → ask (실행 전 확인) ---
assert('PHI-SEC-010',
  config.permissions['Bash(rm -r*)'] === 'ask',
  'Bash(rm -r*) requires confirmation (ask) — not silently allowed'
);

// 환경 변수 정리
delete process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS;

summary('security-by-default.test.js');
process.exit(0);
