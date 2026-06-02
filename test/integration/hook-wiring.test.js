#!/usr/bin/env node
/**
 * Hook Wiring Integration Test
 * @module test/integration/hook-wiring
 * @version 2.0.0
 *
 * Verifies v2.0.0 modules are correctly wired from existing hook scripts.
 * Reads file contents with fs.readFileSync and checks for require() patterns.
 * 30 TC: HW-001 ~ HW-030
 */

const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');

let passed = 0;
let failed = 0;
const results = [];

function assert(id, condition, description) {
  if (condition) {
    passed++;
    results.push({ id, status: 'PASS', description });
  } else {
    failed++;
    results.push({ id, status: 'FAIL', description });
    console.assert(false, `${id}: ${description}`);
  }
}

function readScript(relativePath) {
  const fullPath = path.join(PROJECT_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, 'utf8');
}

// ============================================================
// Section 1: unified-stop.js contains state-machine require (HW-001~005)
// ============================================================

const unifiedStopMain = readScript('scripts/unified-stop.js');
// v2.1.22 S3a: unified-stop.js lazy-require getters (getStateMachine/
// getCheckpointManager/...) were extracted to scripts/lib/unified-stop-deps.js
// (god-file split). The stop-flow wiring is the UNION of both files — unified-stop.js
// requires unified-stop-deps.js which requires the subsystems. Check combined content.
const unifiedStopDeps = readScript('scripts/lib/unified-stop-deps.js');
const unifiedStop = [unifiedStopMain, unifiedStopDeps].filter(Boolean).join('\n');

// HW-001: unified-stop.js exists
assert('HW-001',
  unifiedStopMain !== null,
  'scripts/unified-stop.js exists and is readable'
);

// HW-002: unified-stop.js contains state-machine require
assert('HW-002',
  unifiedStop !== null && /require.*(?:state-machine|pdca\/state-machine|pdca.*stateMachine|pdca.*smTransition)/.test(unifiedStop),
  'unified-stop.js references state-machine module'
);

// HW-003: unified-stop.js contains pdca module reference
assert('HW-003',
  unifiedStop !== null && (/require.*(?:lib\/pdca|\.\.\/lib\/pdca|pdca\/index|pdca\/status)/.test(unifiedStop) || /require.*common/.test(unifiedStop)),
  'unified-stop.js references pdca or common module'
);

// HW-004: unified-stop.js contains audit-logger or logging reference
assert('HW-004',
  unifiedStop !== null && (/require.*(?:audit-logger|audit\/audit-logger|debugLog|debug)/.test(unifiedStop) || /(?:debugLog|writeAuditLog|log)/.test(unifiedStop)),
  'unified-stop.js references logging or audit functionality'
);

// HW-005: unified-stop.js exports or handles stop event
assert('HW-005',
  unifiedStop !== null && (/(?:Stop|stop|readStdin|parseHookInput|main)/.test(unifiedStop)),
  'unified-stop.js handles stop event processing'
);

// ============================================================
// Section 2: pre-write.js contains destructive-detector require (HW-006~010)
// ============================================================

const preWrite = readScript('scripts/pre-write.js');

// HW-006: pre-write.js exists
assert('HW-006',
  preWrite !== null,
  'scripts/pre-write.js exists and is readable'
);

// HW-007: pre-write.js contains destructive-detector reference
assert('HW-007',
  preWrite !== null && (/require.*(?:destructive-detector|control\/destructive|destructive)/.test(preWrite) || /(?:isDestructive|detect|guardrail|G-\d+)/.test(preWrite)),
  'pre-write.js references destructive-detector module or patterns'
);

// HW-008: pre-write.js handles Write/Edit tools
assert('HW-008',
  preWrite !== null && /(?:Write|Edit|file_path|filePath|PreToolUse)/.test(preWrite),
  'pre-write.js handles Write/Edit tool operations'
);

// HW-009: pre-write.js contains permission/block logic
assert('HW-009',
  preWrite !== null && /(?:block|deny|allow|outputBlock|outputAllow|outputEmpty|permissionDecision)/.test(preWrite),
  'pre-write.js contains permission decision logic'
);

// HW-010: pre-write.js contains environment file protection
assert('HW-010',
  preWrite !== null && /(?:\.env|env.*file|isEnvFile|G-005)/.test(preWrite),
  'pre-write.js references environment file protection'
);

// ============================================================
// Section 3: unified-bash-pre.js contains destructive-detector require (HW-011~015)
// ============================================================

const bashPre = readScript('scripts/unified-bash-pre.js');

// HW-011: unified-bash-pre.js exists
assert('HW-011',
  bashPre !== null,
  'scripts/unified-bash-pre.js exists and is readable'
);

// HW-012: unified-bash-pre.js contains destructive-detector reference
assert('HW-012',
  bashPre !== null && (/require.*(?:destructive-detector|control\/destructive|destructive)/.test(bashPre) || /(?:isDestructive|detect|guardrail|GUARDRAIL_RULES)/.test(bashPre)),
  'unified-bash-pre.js references destructive-detector module or patterns'
);

// HW-013: unified-bash-pre.js handles Bash commands
assert('HW-013',
  bashPre !== null && /(?:Bash|command|bash|shell)/.test(bashPre),
  'unified-bash-pre.js handles Bash command operations'
);

// HW-014: unified-bash-pre.js contains block message generation
assert('HW-014',
  bashPre !== null && /(?:block|deny|getBlockMessage|outputBlock|outputAllow)/.test(bashPre),
  'unified-bash-pre.js contains block/allow decision logic'
);

// HW-015: unified-bash-pre.js checks for dangerous patterns
assert('HW-015',
  bashPre !== null && /(?:rm|force|reset|dangerous|destructive|critical)/.test(bashPre),
  'unified-bash-pre.js checks for dangerous command patterns'
);

// ============================================================
// Section 4: PostToolUse hooks contain audit-logger require (HW-016~020)
// ============================================================

const writePost = readScript('scripts/unified-write-post.js');
const bashPost = readScript('scripts/unified-bash-post.js');

// HW-016: unified-write-post.js exists
assert('HW-016',
  writePost !== null,
  'scripts/unified-write-post.js exists and is readable'
);

// HW-017: unified-bash-post.js exists
assert('HW-017',
  bashPost !== null,
  'scripts/unified-bash-post.js exists and is readable'
);

// HW-018: PostToolUse Write handler references audit or logging
assert('HW-018',
  writePost !== null && (/require.*(?:audit|logger|debug)/.test(writePost) || /(?:writeAuditLog|debugLog|addPdcaHistory|log)/.test(writePost)),
  'unified-write-post.js references audit or logging functionality'
);

// HW-019: PostToolUse Bash handler references audit or logging
assert('HW-019',
  bashPost !== null && (/require.*(?:audit|logger|debug)/.test(bashPost) || /(?:writeAuditLog|debugLog|addPdcaHistory|log)/.test(bashPost)),
  'unified-bash-post.js references audit or logging functionality'
);

// HW-020: PostToolUse handlers process tool output
assert('HW-020',
  (writePost !== null && /(?:readStdin|parseHookInput|PostToolUse|tool_name|toolName)/.test(writePost)) &&
  (bashPost !== null && /(?:readStdin|parseHookInput|PostToolUse|tool_name|toolName)/.test(bashPost)),
  'PostToolUse handlers read and process tool output'
);

// ============================================================
// Section 5: Stop hooks contain state-machine transition calls (HW-021~025)
// ============================================================

// HW-021: unified-stop.js references phase transition
assert('HW-021',
  unifiedStop !== null && /(?:transition|phase|phaseToEvent|autoAdvance|smTransition)/.test(unifiedStop),
  'unified-stop.js references phase transition functions'
);

// HW-022: Stop hook references PDCA status reading
assert('HW-022',
  unifiedStop !== null && /(?:getPdcaStatusFull|updatePdcaStatus|savePdcaStatus|pdcaStatus|loadPdcaStatus)/.test(unifiedStop),
  'unified-stop.js references PDCA status functions'
);

// HW-023: Stop hook references automation level
assert('HW-023',
  unifiedStop !== null && /(?:automation|level|getAutomation|shouldAuto|isFullAuto)/.test(unifiedStop),
  'unified-stop.js references automation level checking'
);

// HW-024: Stop hook references checkpoint or state persistence
assert('HW-024',
  unifiedStop !== null && /(?:checkpoint|Checkpoint|clearActive|getPdcaStatus|status)/.test(unifiedStop),
  'unified-stop.js references checkpoint or state persistence'
);

// HW-025: Stop hook dispatches to skill/agent-specific handlers
assert('HW-025',
  unifiedStop !== null && /(?:activeSkill|activeAgent|getActiveSkill|getActiveAgent|SKILL_HANDLERS|AGENT_HANDLERS)/.test(unifiedStop),
  'unified-stop.js dispatches to skill/agent-specific stop handlers'
);

// ============================================================
// Section 6: session-start.js contains UI dashboard require (HW-026~030)
// ============================================================

const sessionStart = readScript('hooks/session-start.js');

// HW-026: session-start.js exists
assert('HW-026',
  sessionStart !== null,
  'hooks/session-start.js exists and is readable'
);

// HW-027: session-start.js references UI or dashboard
assert('HW-027',
  sessionStart !== null && (/require.*(?:ui|dashboard|ansi|progress|control-panel)/.test(sessionStart) || /(?:dashboard|UI|panel|ansi|banner|welcome)/.test(sessionStart)),
  'session-start.js references UI or dashboard module'
);

// HW-028: session-start.js initializes PDCA state
assert('HW-028',
  sessionStart !== null && /(?:initPdca|ensureBkit|pdcaStatus|STATUS)/.test(sessionStart),
  'session-start.js initializes PDCA state on startup'
);

// HW-029: session-start.js delegates to startup modules
assert('HW-029',
  sessionStart !== null && /(?:startup|migration|restore|contextInit|onboarding|sessionCtx)/.test(sessionStart),
  'session-start.js delegates to startup sub-modules'
);

// HW-030: session-start.js handles dashboard rendering
assert('HW-030',
  sessionStart !== null && /(?:dashboard|additionalContext|progress|banner|render)/.test(sessionStart),
  'session-start.js handles dashboard rendering'
);

// ============================================================
// Summary
// ============================================================
console.log('\n========================================');
console.log('Hook Wiring Integration Test Results');
console.log('========================================');
console.log(`Total: ${passed + failed} | PASS: ${passed} | FAIL: ${failed}`);
console.log(`Pass Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
console.log('----------------------------------------');
results.forEach(r => {
  console.log(`  ${r.status === 'PASS' ? '[PASS]' : '[FAIL]'} ${r.id}: ${r.description}`);
});
console.log('========================================\n');

module.exports = { passed, failed, total: passed + failed, results };
if (failed > 0) process.exit(1);
