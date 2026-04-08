# bkit v3.0.0 — Clean Architecture Enhancement Design

> **Status**: 📐 Design Complete
> **Feature**: bkit-v300-clean-architecture-enhancement
> **Created**: 2026-04-08
> **Plan**: [Plan Plus](../../01-plan/features/bkit-v300-clean-architecture-enhancement.plan.md)
> **Architecture**: Option C — Pragmatic Balance (selective wiring + delete)

---

## Context Anchor

| Item | Content |
|------|---------|
| **WHY** | 51% dead code in lib/, 3 PARTIAL features unwired, CC plugin GAP 13 P0/P1 items, test behavioral coverage 35% |
| **WHO** | All bkit users + contributors |
| **RISK** | Dead code maintenance cost, PARTIAL features misleading users, CC feature gap reducing competitiveness |
| **SUCCESS** | Dead code <5%, PARTIAL→FULL 3/3, CC GAP P0/P1 ≤3, behavioral tests ≥70% |
| **SCOPE** | ~120+ files modified/deleted, 3 phases over 3-4 weeks |

---

## 1. Architecture Decision: Option C — Pragmatic Balance

Selected over Option A (delete all) and Option B (archive) because:
- context/ and control/ modules have **completed code** worth wiring
- team/ modules are **redundant** (hooks call lib functions directly) → delete
- pdca/ dead modules are **abandoned approaches** → delete
- This delivers feature activation + cleanup simultaneously

---

## 2. Tier 0: Dead Code Cleanup

### 2.1 DC-1: lib/context/ — Wire, Don't Delete

**Decision**: Keep context/ modules but wire them into existing hooks.

**Files to KEEP** (wire into hooks):
```
lib/context/context-loader.js    (527 LOC) → wire into session-start.js
lib/context/self-healing.js      (302 LOC) → wire into stop-failure-handler.js
lib/context/invariant-checker.js (132 LOC) → called by self-healing.js
lib/context/scenario-runner.js   (204 LOC) → called by self-healing.js
```

**Files to DELETE** (truly unused):
```
lib/context/impact-analyzer.js   (206 LOC) → blast-radius.js used instead
lib/context/ops-metrics.js       (151 LOC) → zero callers, no wiring target
lib/context/index.js             (12 LOC)  → barrel export, never imported
```

**Net**: -369 LOC deleted, 1,165 LOC wired

### 2.2 DC-2: lib/team/ — Delete All

**Rationale**: Hook scripts (subagent-start-handler.js, subagent-stop-handler.js, team-idle-handler.js) call lib functions directly via `require('../lib/team/coordinator')` etc. BUT lib-usage-auditor found 0 imports. The hooks may reference these modules, so verify first.

**Pre-delete verification**:
```bash
grep -r "lib/team" scripts/ hooks/ --include="*.js" | grep -v node_modules
```

**If 0 results**: Delete all 9 modules (-2,023 LOC)
**If imports found**: Keep imported modules, delete rest

### 2.3 DC-3: lib/pdca/ Dead Modules — Delete

**Files to DELETE** (12 modules, -4,441 LOC):
```
lib/pdca/batch-orchestrator.js   (501 LOC)
lib/pdca/feature-manager.js      (507 LOC)
lib/pdca/full-auto-do.js         (488 LOC)
lib/pdca/workflow-parser.js      (456 LOC)
lib/pdca/commit-context.js       (189 LOC)
lib/pdca/decision-record.js      (205 LOC)
lib/pdca/deploy-gate.js          (178 LOC)
lib/pdca/deploy-state-machine.js (312 LOC)
lib/pdca/do-detector.js          (187 LOC)
lib/pdca/resume.js               (265 LOC)
lib/pdca/tier.js                 (156 LOC)
lib/pdca/index.js                (97 LOC)
```

**Pre-delete**: Verify each with `grep -r "require.*<module>" --include="*.js"` excluding test/

### 2.4 DC-4: lib/core/ Dead Modules — Delete

```
lib/core/backup-scheduler.js  (183 LOC) — verify not used by hooks
lib/core/cache.js             (156 LOC)
lib/core/constants.js         (89 LOC)
lib/core/errors.js            (201 LOC)
lib/core/index.js             (105 LOC)
lib/core/state-store.js       (274 LOC)
```

### 2.5 DC-5: lib/ui/ Dead Modules — Delete

```
lib/ui/ansi.js         (265 LOC)
lib/ui/agent-panel.js  (185 LOC)
lib/ui/impact-view.js  (264 LOC)
lib/ui/index.js        (21 LOC)
```

### 2.6 DC-6: lib/ Root Dead Modules — Delete

```
lib/common.js            (316 LOC)
lib/context-fork.js      (233 LOC)
lib/context-hierarchy.js (278 LOC)
lib/memory-store.js      (189 LOC)
```

### 2.7 DC-7: Barrel Exports — Delete

All `index.js` barrel exports in lib/ subdirectories (7 files) are never imported:
```
lib/core/index.js, lib/pdca/index.js, lib/team/index.js,
lib/context/index.js, lib/intent/index.js, lib/task/index.js, lib/ui/index.js
```

---

## 3. Tier 1: Feature Wiring (PARTIAL → FULLY_IMPLEMENTED)

### 3.1 FW-1: Living Context Self-Healing Wiring

**Current state**: `lib/context/self-healing.js` has `createHealSession()`, `loadHealContext()`, `verifyFix()`, `recordIncident()` — zero callers.

**Wiring point**: `scripts/stop-failure-handler.js`

```javascript
// In stop-failure-handler.js, after error classification:
const selfHealing = require('../lib/context/self-healing');

// Only attempt self-healing for recoverable errors
if (errorType === 'tool_failure' || errorType === 'timeout') {
  try {
    const session = selfHealing.createHealSession(feature, errorContext);
    const context = selfHealing.loadHealContext(session);
    // Record incident for learning
    selfHealing.recordIncident(session, errorContext);
    // Add self-healing guidance to output
    additionalContext += `\nSelf-healing context loaded: ${context.layerCount} layers`;
  } catch (e) {
    debugLog('StopFailure', 'Self-healing wiring failed', { error: e.message });
  }
}
```

### 3.2 FW-2: Rollback Wiring + Bug Fix

**Bug fix** in `lib/control/checkpoint-manager.js`:
```javascript
// Line ~316: Fix undefined getCheckpointDir()
function deleteCheckpoint(checkpointId) {
  const dir = ensureDir('checkpoints'); // was: getCheckpointDir()
```

**Wiring point**: `skills/rollback/SKILL.md` already exists. Wire into the skill's execution path by adding rollback logic to `scripts/unified-stop.js` or creating a dedicated `scripts/rollback-handler.js`.

```javascript
// scripts/rollback-handler.js (new, ~40 LOC)
const { rollbackToCheckpoint, listCheckpoints } = require('../lib/control/checkpoint-manager');

// Expose via rollback skill execution
function handleRollback(checkpointId) {
  if (!checkpointId) {
    return listCheckpoints().map(cp => ({
      id: cp.id, phase: cp.phase, matchRate: cp.matchRate, created: cp.timestamp
    }));
  }
  return rollbackToCheckpoint(checkpointId);
}
```

### 3.3 FW-3: L0-L4 Write Wiring

**Current state**: `getCurrentLevel()` works (called in 2 hooks). `setLevel()`, `emergencyStop()`, `emergencyResume()` have 0 callers.

**Wiring point**: `skills/control/SKILL.md` already exists.

```javascript
// In control skill handler (scripts/ or inline):
const { setLevel, emergencyStop, emergencyResume } = require('../lib/control/automation-controller');

// /control set <level> → setLevel(level)
// /control stop → emergencyStop()
// /control resume → emergencyResume()
```

---

## 4. Tier 2: CC Plugin GAP Resolution

### 4.1 CC-0a: Remove permissionMode from Plugin Agents

CC docs: "For security reasons, hooks, mcpServers, and permissionMode are not supported for plugin-shipped agents."

**Action**: Remove `permissionMode:` line from 30/32 agents.

```bash
# Batch removal
for f in agents/*.md; do
  sed -i '' '/^permissionMode:/d' "$f"
done
```

**Exception**: Keep the field as a YAML comment for documentation:
```yaml
# permissionMode: acceptEdits  # CC ignores for plugin agents (security constraint)
```

### 4.2 CC-0b: Remove engines Field

CC #17272 closed as "Not Planned". The `engines` field is not recognized.

**File**: `.claude-plugin/plugin.json`
```json
// Remove:
"engines": {
  "claude-code": ">=2.1.94"
},
```

**Note**: Minimum CC version compatibility should be documented in README instead.

### 4.3 CC-1: Skill effort Frontmatter (35/37 Skills)

**Action**: Add `effort: medium` (default) to all skills missing it.

```bash
# Add effort: medium after description block in each SKILL.md
for skill in skills/*/SKILL.md; do
  if ! grep -q '^effort:' "$skill"; then
    # Add after deprecation-risk or classification-reason
    sed -i '' '/^deprecation-risk:/a\
effort: medium' "$skill"
  fi
done
```

**Exceptions**: 
- Compute-heavy skills (enterprise, cc-version-analysis) → `effort: high`
- Simple reference skills (bkit-rules, bkit-templates, skill-status) → `effort: low`

### 4.4 CC-2: Skill paths Glob

**Action**: Add `paths:` field to skills that should only trigger for specific file patterns.

```yaml
# Example for phase-1-schema:
paths:
  - "docs/01-plan/**"
  - "*.schema.*"

# Example for pdca:
paths:
  - "docs/**"
  - ".bkit/**"

# Example for code-review:
paths:
  - "**/*.{js,ts,py,go,rs}"
```

**Strategy**: Start with broad globs, narrow down based on usage data.

### 4.5 CC-3: Skill $ARGUMENTS

**Action**: Add `$ARGUMENTS` usage to skills that accept parameters.

```yaml
# In SKILL.md body (after frontmatter):
# Example for pdca skill:
When invoked as `/pdca plan my-feature`, `$ARGUMENTS` = "plan my-feature"
Parse the first word as action, rest as feature name.
```

Key skills to update: `pdca`, `control`, `rollback`, `deploy`, `btw`, `audit`, `skill-create`

### 4.6 CC-4: MCP _meta maxResultSizeChars

**Files**: `servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js`

```javascript
// In okResponse():
function okResponse(data) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify(data, null, 2),
    }],
    _meta: {
      maxResultSizeChars: 500000  // Override default 2KB cap
    }
  };
}
```

### 4.7 CC-5: Plugin settings.json

**New file**: `settings.json` (in plugin root)

```json
{
  "agent": "bkit:cto-lead",
  "permissions": {
    "allow": [
      "Read(**)",
      "Glob(**)",
      "Grep(**)"
    ]
  }
}
```

### 4.8 CC-6: CwdChanged Hook

**New file**: `scripts/cwd-changed-handler.js` (~80 LOC)

```javascript
// Detect project type change, update bkit state
const input = readStdinSync();
const newCwd = input.cwd || process.cwd();
// Detect git root, update memory, log to audit
```

**hooks.json addition**:
```json
"CwdChanged": [{
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/cwd-changed-handler.js\"",
    "timeout": 3000
  }]
}]
```

### 4.9 CC-7: TaskCreated Hook

**New file**: `scripts/task-created-handler.js` (~60 LOC)

```javascript
// Validate PDCA task naming, log to audit
const input = readStdinSync();
const taskSubject = input.task_subject || '';
// Check naming convention: [Phase] feature
```

**hooks.json addition**:
```json
"TaskCreated": [{
  "hooks": [{
    "type": "command",
    "command": "node \"${CLAUDE_PLUGIN_ROOT}/scripts/task-created-handler.js\"",
    "timeout": 3000
  }]
}]
```

### 4.10 CC-8: Hook `if` Field (Deferred)

**Status**: Deferred to post-v3.0.0. Need usage data before applying conditional execution.

---

## 5. Tier 3: Test Enhancement

### 5.1 TQ-1: Hook I/O Behavioral Tests (+20 TC)

**New file**: `test/integration/hook-behavior.test.js`

Test scenarios:
- pre-write.js receives Write tool input → returns allow/block correctly
- unified-bash-pre.js blocks `rm -rf /` → returns `{decision: "block"}`
- unified-stop.js routes to correct handler based on active skill/agent
- session-start.js produces valid hookSpecificOutput JSON

### 5.2 TQ-2: PDCA State Machine Tests (+15 TC)

**New file**: `test/unit/pdca-state-machine.test.js`

Test scenarios:
- Valid transitions: plan→design, design→do, do→check, check→act, act→check
- Invalid transitions: plan→check (blocked), do→report (blocked)
- Guard evaluation: matchRate < 90% blocks check→report
- Event handling: MATCH_PASS, ITERATE, ROLLBACK

### 5.3 TQ-3: MCP Server Response Tests (+10 TC)

**New file**: `test/integration/mcp-server.test.js`

Test scenarios:
- bkit_pdca_status returns valid JSON structure
- bkit_feature_list returns array with expected fields
- bkit_audit_search handles date range correctly
- Error responses have correct error codes

### 5.4 TQ-4: Checkpoint/Rollback Tests (+10 TC)

**New file**: `test/unit/checkpoint-manager.test.js`

Test scenarios:
- createCheckpoint() produces valid file with SHA-256 hash
- rollbackToCheckpoint() restores pdca-status.json correctly
- deleteCheckpoint() doesn't crash (bug fix verification)
- listCheckpoints() returns sorted by date

### 5.5 TQ-5: Agent Coordination Tests (+15 TC)

**New file**: `test/integration/agent-coordination.test.js`

Test scenarios:
- Team coordinator generates correct strategy for Dynamic/Enterprise
- Task creator produces valid task IDs
- SubagentStart/Stop handlers update state correctly

### 5.6 TQ-6: Untested Module Coverage (+50 TC)

Add tests for 11 previously untested lib/ modules:
- context-loader, self-healing, invariant-checker, scenario-runner (4 modules)
- pdca/lifecycle, pdca/circuit-breaker, pdca/template-validator (3 modules)
- control/automation-controller, control/trust-engine (2 modules)
- quality/gate-manager, quality/regression-guard (2 modules)

---

## 6. Tier 4: UX/DX Improvements

### 6.1 UX-1: /bkit debug Command

**New skill**: `skills/bkit-debug/SKILL.md`

```yaml
---
name: bkit-debug
description: |
  Toggle bkit debug mode, tail logs, search audit entries.
  Triggers: bkit debug, debug, 디버그, デバッグ.
user-invocable: true
allowed-tools: [Read, Bash, Glob, Grep]
effort: low
---
```

Commands: `on`, `off`, `tail [N]`, `search <pattern>`

### 6.2 UX-2: Output Profiles

Add to `bkit.config.json`:
```json
"output": {
  "profile": "normal",  // quiet | normal | verbose
  "dashboardOnStart": true,
  "workflowMapOnStart": true
}
```

### 6.3 UX-3: Skills Search

Already partially exists via `/bkit` help. Enhance with keyword search in `skills/bkit/SKILL.md`.

### 6.4 UX-4: Checkpoint Auto-Description

In `lib/control/checkpoint-manager.js` `createCheckpoint()`:
```javascript
const description = `${phase} phase, matchRate ${matchRate || 'N/A'}%, feature: ${feature}`;
checkpoint.description = description;
```

---

## 7. Tier 5: Best Practice Alignment

### 7.1 BP-1: --bare CI/CD Guide

**New file**: `docs/guides/bare-cicd-guide.md`

Document: how to use bkit with `claude --bare` for CI/CD pipelines.

### 7.2 BP-2: BKIT_VERSION Centralization

**New file**: `lib/core/version.js`
```javascript
module.exports = { BKIT_VERSION: '3.0.0' };
```

Replace all hardcoded version strings with `require('../lib/core/version').BKIT_VERSION`.

### 7.3 BP-3: StatusLine Custom

Add to `settings.json`:
```json
{
  "statusLine": {
    "left": "bkit ${phase} | L${level}",
    "right": "${matchRate}%"
  }
}
```

### 7.4 BP-4: God Module Split (Deferred)

**Deferred to post-v3.0.0**: pdca/status.js (872 LOC) and state-machine.js (818 LOC) split requires extensive import path changes. Lower ROI than other items.

---

## 8. Implementation Guide

### 8.1 Module Map

| Module | Files | LOC Change | Session |
|--------|-------|-----------|---------|
| M1: Dead Code Cleanup | ~45 delete, ~3 modify | -11,000 | Session 1 |
| M2: Feature Wiring | ~5 modify, ~2 create | +200 | Session 2 |
| M3: CC GAP P0 | ~32 modify, ~1 create | +100 | Session 3 |
| M4: CC GAP P1 | ~40 modify, ~3 create | +300 | Session 4 |
| M5: Tests | ~6 create | +800 | Session 5 |
| M6: UX + BP | ~5 create, ~3 modify | +400 | Session 6 |

### 8.2 Session Plan

| Session | Scope | Est. Time | Dependencies |
|---------|-------|-----------|-------------|
| **S1** | M1: Delete 45 dead modules | 1-2h | None |
| **S2** | M2: Wire FW-1/2/3 + fix bugs | 2h | S1 |
| **S3** | M3: CC-0a/0b/1 (permissionMode, engines, effort) | 1h | S1 |
| **S4** | M4: CC-2/3/4/5/6/7 (paths, $ARGS, MCP, hooks) | 2h | S3 |
| **S5** | M5: TQ-1~6 behavioral tests | 3h | S2, S4 |
| **S6** | M6: UX-1~4, BP-1~3, version bump | 2h | S5 |

### 8.3 Verification Plan

After each session:
1. Run `node test/run-all.js` — must pass
2. Verify `grep -r "require.*<deleted>" --include="*.js"` returns 0 hits
3. Check `.bkit/state/pdca-status.json` integrity

Final verification:
- All 34 items checked off
- `node test/run-all.js` → 0 FAIL
- `node scripts/validate-plugin.js` → PASS
- CC v2.1.96 `--plugin-dir .` session → hooks fire correctly

---

## 9. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Dead module deletion breaks hidden dependency | Pre-delete grep verification for each module |
| Self-healing wiring causes unexpected hook behavior | Wrap in try-catch, graceful degradation |
| permissionMode removal changes agent behavior | CC already ignores it for plugin agents — no behavior change |
| Skill effort/paths changes affect CC skill matching | Start with conservative values, monitor |
| Test additions slow CI | Tests are lightweight Node.js scripts, <5s each |

---

## 10. File Change Matrix (Summary)

| Operation | Count | LOC |
|-----------|-------|-----|
| **DELETE** | ~45 files | -11,054 |
| **CREATE** | ~12 files | +1,400 |
| **MODIFY** | ~65 files | +600 / -200 |
| **NET** | | **-9,254 LOC** |

Total estimated: ~120 files touched across 6 sessions.
