# bkit v1.5.8 Comprehensive Test Plan

> **Summary**: bkit v1.5.8 comprehensive test — Unit, Integration, E2E, UX, Security, Migration, and Regression tests covering all features and v1.5.8 changes (Path Registry, auto-migration, state file restructuring)
>
> **Project**: bkit-claude-code
> **Version**: 1.5.8
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager, gap-detector, security-architect)
> **Date**: 2026-03-01
> **Status**: Draft
> **Previous Test**: v1.5.7 (820 TC executed, 763 PASS, 0 FAIL, 57 SKIP, 100%)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, Claude Code v2.1.63+
> **Branch**: feature/bkit-v1.5.8-studio-support

---

## 1. Background

### 1.1 Test Necessity

bkit v1.5.8 introduces a **Path Registry** pattern (`lib/core/paths.js`) and **auto-migration** system to centralize distributed state files from `docs/` and `.bkit/` root into a structured `.bkit/{state,runtime,snapshots}/` hierarchy. This is a cross-cutting infrastructure change that touches 11 files, affects all state file I/O paths, and requires thorough verification across every component. This test plan covers:

1. **v1.5.8 new changes** (Path Registry, auto-migration, state file restructuring, 6 FRs)
2. **Migration scenarios** (5 upgrade paths: fresh install, v1.5.7→v1.5.8, re-execution, partial, collision)
3. **Full bkit feature inventory** (27 skills, 16 agents, 10 hooks, 45 scripts, 184 common.js exports)
4. **Unit tests** for all testable functions and library modules
5. **E2E tests** for complete user workflows
6. **UX tests** for user experience quality across all user personas
7. **Security and performance** edge case verification
8. **Regression** against v1.5.7 baseline

| Change Category | v1.5.8 Delta from v1.5.7 |
|----------------|--------------------------|
| Skills count | 27 (unchanged from v1.5.7) |
| Agents count | 16 (unchanged) |
| Hook events | 10 (unchanged) |
| Scripts | 45 (unchanged, 1 modified: session-start.js) |
| common.js exports | **184** (+4 from 180: STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs) |
| Library modules | 38 → **39** (+1 new: lib/core/paths.js) |
| Templates | 16 (unchanged) |
| Output Styles | 4 (unchanged) |
| Config files | 2 (version bump + statusFile path change) |
| Code changes | 11 files (1 new + 10 modified), ~+151 lines |
| Key additions | STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs(), auto-migration block |
| State file locations | 4 files migrated to `.bkit/{state,runtime,snapshots}/` |

### 1.2 Previous Test Results (v1.5.7)

| Metric | Value |
|--------|:-----:|
| Total TC | 820 (of 860 planned) |
| Executed | 820 |
| PASS | 763 |
| FAIL | 0 (after 1 iteration) |
| SKIP | 57 (runtime-only, environment-dependent) |
| Pass Rate (excl. SKIP) | 100.0% |
| Supplemental Runtime TC | 79 (78 PASS, 1 spec issue) |

### 1.3 v1.5.8 Component Inventory

| Component | Count | Location | Delta from v1.5.7 |
|-----------|:-----:|----------|:------------------:|
| Skills | 27 (22 core + 5 bkend) | `skills/*/SKILL.md` | 0 |
| Agents | 16 | `agents/*.md` | 0 |
| Hook Events | 10 | `hooks/hooks.json` | 0 |
| Scripts | 45 | `scripts/*.js` | 0 (session-start.js +45 lines migration) |
| Library Modules | 39 | `lib/**/*.js` | **+1** (lib/core/paths.js) |
| Library Exports (common.js) | **184** | `lib/` → `lib/common.js` | **+4** (path exports) |
| Templates | 16 | `templates/` | 0 |
| Output Styles | 4 | `output-styles/` | 0 |
| Config Files | 2 | `plugin.json`, `bkit.config.json` | 0 (2 version bumps + statusFile path) |
| State File Locations | 4 | `.bkit/{state,runtime,snapshots}/` | **4 migrated** from legacy paths |

### 1.4 v1.5.8 Changed Files (11 files, ~+151 lines)

| # | File | Change Type | FR | Lines Changed |
|---|------|:-----------:|:--:|:------------:|
| 1 | `lib/core/paths.js` | **New** | FR-1 | +51 (Path Registry: STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs) |
| 2 | `lib/core/index.js` | Modified | FR-1 | +4 (4 new re-exports from paths.js) |
| 3 | `lib/common.js` | Modified | FR-5 | +5 (4 path exports, version comment) |
| 4 | `lib/pdca/status.js` | Modified | FR-3 | +6/-6 (getPdcaStatusPath, readBkitMemory, writeBkitMemory → STATE_PATHS) |
| 5 | `lib/memory-store.js` | Modified | FR-3 | +3/-3 (getMemoryFilePath → STATE_PATHS.memory) |
| 6 | `lib/task/tracker.js` | Modified | FR-3 | +3/-3 (findPdcaStatus → getPdcaStatusPath) |
| 7 | `lib/team/state-writer.js` | Modified | FR-3 | +3/-3 (getAgentStatePath → STATE_PATHS.agentState) |
| 8 | `scripts/context-compaction.js` | Modified | FR-3 | +2/-2 (snapshotDir → STATE_PATHS.snapshots) |
| 9 | `hooks/session-start.js` | Modified | FR-3,4 | +50/-5 (auto-migration block + CONFIG_PATHS + getPdcaStatusFull) |
| 10 | `bkit.config.json` | Modified | FR-6 | +2/-2 (version 1.5.8, statusFile path) |
| 11 | `.claude-plugin/plugin.json` | Modified | FR-6 | +1/-1 (version 1.5.8) |

### 1.5 v1.5.8 FR Summary (6 FRs)

| FR | Description | File(s) | Priority |
|----|-------------|---------|:--------:|
| FR-1 | Path Registry creation (STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs) | lib/core/paths.js, lib/core/index.js | Critical |
| FR-2 | State files migrated to `.bkit/{state,runtime,snapshots}/` | 4 state files | Critical |
| FR-3 | 7 consumer files refactored to use Path Registry | status.js, memory-store.js, tracker.js, state-writer.js, context-compaction.js, session-start.js, common.js | Critical |
| FR-4 | SessionStart auto-migration (5 scenarios: S1-S5) | hooks/session-start.js | Critical |
| FR-5 | common.js bridge extension (180 → 184 exports) | lib/common.js | High |
| FR-6 | Config version sync to 1.5.8 | plugin.json, bkit.config.json | High |

### 1.6 v1.5.8 State File Migration Map

```
BEFORE (v1.5.7):                        AFTER (v1.5.8):
════════════════════════════════════    ════════════════════════════════════
docs/.pdca-status.json                → .bkit/state/pdca-status.json
docs/.bkit-memory.json                → .bkit/state/memory.json
.bkit/agent-state.json                → .bkit/runtime/agent-state.json
docs/.pdca-snapshots/                 → .bkit/snapshots/
```

### 1.7 CTO Team Composition

| Role | Agent | Model | Responsibility |
|------|-------|:-----:|---------------|
| **CTO Lead** | cto-lead | opus | Overall coordination, quality gates |
| Code Analyzer | code-analyzer | opus | Static analysis, path audit, function coverage |
| QA Strategist | qa-strategist | sonnet | Test design, migration scenario coverage |
| Product Manager | product-manager | sonnet | UX scenarios, user journeys |
| Gap Detector | gap-detector | opus | Design-implementation verification |
| Security Architect | security-architect | opus | Security test review, migration safety |

---

## 2. Goals

### 2.1 Must (P0)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-01 | v1.5.8 New Changes Test | 6 FRs: Path Registry, migration, consumer refactoring, bridge, version | 75 |
| G-02 | Migration Scenario Test | 5 scenarios (S1-S5): fresh, upgrade, re-exec, partial, collision + EXDEV | 30 |
| G-03 | Script Unit Test | 45 scripts, exported functions, logic paths (including new paths.js) | 210 |
| G-04 | Hook Integration Test | 10 hook events, chain validation, state propagation via new paths | 65 |
| G-05 | Agent Functional Test | 16 agents: trigger, tools, model, memory scope | 80 |
| G-06 | Skill Functional Test | 27 skills: load, trigger, content, imports | 90 |
| G-07 | PDCA Workflow Test | Plan-Design-Do-Check-Act-Report-Archive-Cleanup with new paths | 40 |

### 2.2 Should (P1)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-08 | E2E Workflow Test | 6 complete user workflows including migration E2E | 60 |
| G-09 | UX Experience Test | 6 user journeys (Beginner/Dev/QA/Team/v1.5.8/Multilingual) | 60 |
| G-10 | Config & Template Test | bkit.config.json, 16 templates, output-styles | 25 |
| G-11 | CTO Team Orchestration Test | Team composition, patterns, delegation, state-writer new path | 30 |

### 2.3 Could (P2)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-12 | Multi-Language Test | 8-language triggers + CC_COMMAND_PATTERNS + ambiguity detection | 32 |
| G-13 | Edge Case & Performance | Hook timeout, caching, error handling, EXDEV fallback, migration edge | 28 |
| G-14 | Security Test | Path traversal, migration safety, input validation, data integrity | 20 |
| G-15 | Regression Test | v1.5.7 baseline + hardcoding audit + known issues re-check | 20 |

### 2.4 TC Summary

| Priority | TC Count | Ratio |
|:--------:|:--------:|:-----:|
| P0 (Must) | 590 | 64.1% |
| P1 (Should) | 175 | 19.0% |
| P2 (Could) | 100 | 10.9% |
| Regression | 20 | 2.2% |
| Buffer (new discovery) | 35 | 3.8% |
| **Grand Total** | **920** | **100%** |

---

## 3. Test Categories

### 3.1 TC-V158: v1.5.8 New Changes (75 TC)

#### TC-V158-FR01: Path Registry (lib/core/paths.js) (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V158-01 | `lib/core/paths.js` file exists | lib/core/paths.js | File exists | P0 |
| V158-02 | Module version JSDoc is `@version 1.5.8` | paths.js:4 | Grep `@version 1.5.8` | P0 |
| V158-03 | STATE_PATHS object has 7 keys (root, state, runtime, snapshots, pdcaStatus, memory, agentState) | paths.js | Object.keys count | P0 |
| V158-04 | STATE_PATHS.root() returns path ending with `.bkit` | paths.js | Function call | P0 |
| V158-05 | STATE_PATHS.state() returns path ending with `.bkit/state` | paths.js | Function call | P0 |
| V158-06 | STATE_PATHS.runtime() returns path ending with `.bkit/runtime` | paths.js | Function call | P0 |
| V158-07 | STATE_PATHS.snapshots() returns path ending with `.bkit/snapshots` | paths.js | Function call | P0 |
| V158-08 | STATE_PATHS.pdcaStatus() returns `.bkit/state/pdca-status.json` | paths.js | Function call | P0 |
| V158-09 | STATE_PATHS.memory() returns `.bkit/state/memory.json` | paths.js | Function call | P0 |
| V158-10 | STATE_PATHS.agentState() returns `.bkit/runtime/agent-state.json` | paths.js | Function call | P0 |
| V158-11 | LEGACY_PATHS object has 4 keys (pdcaStatus, memory, snapshots, agentState) | paths.js | Object.keys count | P0 |
| V158-12 | LEGACY_PATHS.pdcaStatus() returns `docs/.pdca-status.json` | paths.js | Function call | P0 |
| V158-13 | LEGACY_PATHS.memory() returns `docs/.bkit-memory.json` | paths.js | Function call | P0 |
| V158-14 | LEGACY_PATHS.snapshots() returns `docs/.pdca-snapshots` | paths.js | Function call | P0 |
| V158-15 | LEGACY_PATHS.agentState() returns `.bkit/agent-state.json` | paths.js | Function call | P0 |
| V158-16 | CONFIG_PATHS object has 3 keys (bkitConfig, pluginJson, hooksJson) | paths.js | Object.keys count | P0 |
| V158-17 | CONFIG_PATHS.bkitConfig() returns `bkit.config.json` path | paths.js | Function call | P0 |
| V158-18 | ensureBkitDirs() function exists and is callable | paths.js | typeof check | P0 |
| V158-19 | ensureBkitDirs() creates .bkit/state and .bkit/runtime but NOT .bkit/snapshots | paths.js | Directory check | P0 |
| V158-20 | Lazy require of platform.js avoids circular dependency | paths.js:10-13 | Grep `_platform` pattern | P0 |

#### TC-V158-FR03: Consumer Refactoring (25 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V158-21 | `getPdcaStatusPath()` returns STATE_PATHS.pdcaStatus() | lib/pdca/status.js | Function call comparison | P0 |
| V158-22 | `readBkitMemory()` reads from STATE_PATHS.memory() | lib/pdca/status.js | Grep STATE_PATHS.memory | P0 |
| V158-23 | `writeBkitMemory()` writes to STATE_PATHS.memory() | lib/pdca/status.js | Grep STATE_PATHS.memory | P0 |
| V158-24 | `getMemoryFilePath()` returns STATE_PATHS.memory() | lib/memory-store.js | Function call comparison | P0 |
| V158-25 | `loadMemory()` reads from new path | lib/memory-store.js | Logic trace | P0 |
| V158-26 | `saveMemory()` writes to new path | lib/memory-store.js | Logic trace | P0 |
| V158-27 | `findPdcaStatus()` uses getPdcaStatusPath() | lib/task/tracker.js | Grep getPdcaStatusPath | P0 |
| V158-28 | `getAgentStatePath()` returns STATE_PATHS.agentState() | lib/team/state-writer.js | Function call comparison | P0 |
| V158-29 | `initAgentState()` writes to `.bkit/runtime/agent-state.json` | lib/team/state-writer.js | Logic trace | P0 |
| V158-30 | Context compaction snapshotDir uses STATE_PATHS.snapshots() | scripts/context-compaction.js | Grep STATE_PATHS.snapshots | P0 |
| V158-31 | session-start.js importResolver uses CONFIG_PATHS.bkitConfig() | hooks/session-start.js | Grep CONFIG_PATHS | P0 |
| V158-32 | session-start.js detectPdcaPhase() uses getPdcaStatusFull() | hooks/session-start.js | Grep getPdcaStatusFull | P0 |
| V158-33 | No hardcoded `docs/.pdca-status` in lib/ | lib/**/*.js | Grep absent | P0 |
| V158-34 | No hardcoded `docs/.bkit-memory` in lib/ | lib/**/*.js | Grep absent | P0 |
| V158-35 | No hardcoded `docs/.pdca-snapshots` in lib/ or scripts/ | lib/, scripts/ | Grep absent | P0 |
| V158-36 | No hardcoded `.bkit/agent-state.json` (flat) in lib/ | lib/**/*.js | Grep filter | P0 |
| V158-37 | session-start.js context string references `.bkit/state/memory.json` | hooks/session-start.js | Grep new path | P0 |
| V158-38 | All 7 consumer files import from `./core/paths` or use bridge | 7 files | Grep import chain | P0 |
| V158-39 | pdca/status.js: getPdcaStatusPath returns absolute path | lib/pdca/status.js | path.isAbsolute check | P0 |
| V158-40 | memory-store.js: getMemoryPath() returns absolute path | lib/memory-store.js | path.isAbsolute check | P0 |
| V158-41 | state-writer.js: getAgentStatePath() returns absolute path | lib/team/state-writer.js | path.isAbsolute check | P0 |
| V158-42 | context-compaction.js: snapshots dir path is absolute | scripts/context-compaction.js | Logic trace | P0 |
| V158-43 | session-start.js: no more process.cwd() in detectPdcaPhase | hooks/session-start.js | Grep absent `process.cwd()` in detectPdcaPhase | P0 |
| V158-44 | getPdcaStatusPath() called from 3 modules returns identical path | status.js, tracker.js, common.js | Cross-compare | P0 |
| V158-45 | getMemoryFilePath() and readBkitMemory() use same path | memory-store.js, status.js | Cross-compare | P0 |

#### TC-V158-FR04: Auto-Migration (15 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V158-46 | Auto-migration block exists at lines ~153-197 | hooks/session-start.js | Grep `Auto-migration` | P0 |
| V158-47 | ensureBkitDirs() called before migration | session-start.js | Line order check | P0 |
| V158-48 | 4 migration entries defined (pdca-status, memory, agent-state, snapshots) | session-start.js | Count migrations array | P0 |
| V158-49 | Each migration has `from`, `to`, `name`, `type` properties | session-start.js | Grep property names | P0 |
| V158-50 | File migration uses fs.renameSync as primary | session-start.js | Grep renameSync | P0 |
| V158-51 | EXDEV fallback uses fs.copyFileSync for files | session-start.js | Grep EXDEV + copyFileSync | P0 |
| V158-52 | EXDEV fallback uses fs.cpSync({recursive:true}) for directories | session-start.js | Grep cpSync | P0 |
| V158-53 | After EXDEV copy, source removed with fs.rmSync | session-start.js | Grep rmSync | P0 |
| V158-54 | Each file migration wrapped in individual try-catch | session-start.js | Count try-catch nesting | P0 |
| V158-55 | Outer block wrapped in top-level try-catch | session-start.js | Grep outer catch | P0 |
| V158-56 | debugLog called on successful migration | session-start.js | Grep `Migrated ${m.name}` | P0 |
| V158-57 | debugLog called on migration failure | session-start.js | Grep `Migration failed` | P0 |
| V158-58 | Skip if `m.from` doesn't exist (existsSync check) | session-start.js | Grep existsSync(m.from) | P0 |
| V158-59 | Skip if `m.to` already exists for files | session-start.js | Grep existsSync(m.to) | P0 |
| V158-60 | Directory migration handles non-empty target (skip) | session-start.js | Grep readdirSync + length | P0 |

#### TC-V158-FR05: Bridge Extension (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V158-61 | common.js exports STATE_PATHS | lib/common.js | `require('./lib/common').STATE_PATHS` truthy | P0 |
| V158-62 | common.js exports LEGACY_PATHS | lib/common.js | `require('./lib/common').LEGACY_PATHS` truthy | P0 |
| V158-63 | common.js exports CONFIG_PATHS | lib/common.js | `require('./lib/common').CONFIG_PATHS` truthy | P0 |
| V158-64 | common.js exports ensureBkitDirs | lib/common.js | typeof === 'function' | P0 |
| V158-65 | common.js total export count is 184 | lib/common.js | Object.keys().length | P0 |
| V158-66 | "Paths (4 exports - v1.5.8 Path Registry)" comment present | lib/common.js | Grep comment | P0 |
| V158-67 | core/index.js exports STATE_PATHS | lib/core/index.js | Grep re-export | P0 |
| V158-68 | core/index.js exports LEGACY_PATHS | lib/core/index.js | Grep re-export | P0 |
| V158-69 | core/index.js exports CONFIG_PATHS | lib/core/index.js | Grep re-export | P0 |
| V158-70 | core/index.js exports ensureBkitDirs | lib/core/index.js | Grep re-export | P0 |

#### TC-V158-FR06: Version Sync (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V158-71 | plugin.json version = "1.5.8" | .claude-plugin/plugin.json | Grep version | P0 |
| V158-72 | bkit.config.json version = "1.5.8" | bkit.config.json:3 | Grep version | P0 |
| V158-73 | bkit.config.json pdca.statusFile = ".bkit/state/pdca-status.json" | bkit.config.json:34 | Grep statusFile | P0 |
| V158-74 | session-start.js JSDoc version header contains 1.5.8 | hooks/session-start.js:3 | Grep `v1.5.8` | P0 |
| V158-75 | All v1.5.8 version strings consistent across 3 files | 3 files | Cross-check | P0 |

### 3.2 TC-MIG: Migration Scenario Tests (30 TC)

#### TC-MIG-S1: Fresh Installation (6 TC)

| ID | Test Case | Pre-condition | Expected | Priority |
|----|-----------|--------------|----------|:--------:|
| MIG-01 | No legacy files exist | Fresh .bkit/ | Migration skipped entirely | P0 |
| MIG-02 | ensureBkitDirs creates .bkit/state/ | No .bkit/ dir | Directory created | P0 |
| MIG-03 | ensureBkitDirs creates .bkit/runtime/ | No .bkit/ dir | Directory created | P0 |
| MIG-04 | .bkit/snapshots/ NOT created by ensureBkitDirs | Fresh install | Dir absent (YAGNI) | P0 |
| MIG-05 | initPdcaStatusIfNotExists creates pdca-status at new path | No pdca-status | File at .bkit/state/ | P0 |
| MIG-06 | No debugLog migration entries on fresh install | No legacy files | Grep debugLog absent | P0 |

#### TC-MIG-S2: v1.5.7 → v1.5.8 Upgrade (6 TC)

| ID | Test Case | Pre-condition | Expected | Priority |
|----|-----------|--------------|----------|:--------:|
| MIG-07 | docs/.pdca-status.json migrated to .bkit/state/ | Legacy file exists | File moved, content intact | P0 |
| MIG-08 | docs/.bkit-memory.json migrated to .bkit/state/ | Legacy file exists | File moved, content intact | P0 |
| MIG-09 | .bkit/agent-state.json migrated to .bkit/runtime/ | Legacy file exists | File moved, content intact | P0 |
| MIG-10 | docs/.pdca-snapshots/ migrated to .bkit/snapshots/ | Legacy dir exists | Dir moved, files intact | P0 |
| MIG-11 | Legacy files no longer exist after migration | Post-migration | fs.existsSync returns false | P0 |
| MIG-12 | JSON content intact after migration (round-trip) | Post-migration | JSON.parse succeeds, fields match | P0 |

#### TC-MIG-S3: Re-execution Idempotency (6 TC)

| ID | Test Case | Pre-condition | Expected | Priority |
|----|-----------|--------------|----------|:--------:|
| MIG-13 | Second SessionStart skips all migrations | Already migrated | No migration debugLog entries | P0 |
| MIG-14 | Files at new paths unchanged after re-run | Already migrated | Content identical | P0 |
| MIG-15 | ensureBkitDirs is idempotent (no error on existing) | Dirs exist | No exception | P0 |
| MIG-16 | Third, fourth run also idempotent | Multiple runs | Consistent state | P0 |
| MIG-17 | No file duplication after multiple runs | Multiple runs | Only one copy at new path | P0 |
| MIG-18 | Performance: re-execution < 50ms overhead | Multiple runs | Timing check | P1 |

#### TC-MIG-S4: Partial Migration (6 TC)

| ID | Test Case | Pre-condition | Expected | Priority |
|----|-----------|--------------|----------|:--------:|
| MIG-19 | pdca-status migrated but memory.json still in docs/ | Partial state | Memory migrates, pdca-status skips | P0 |
| MIG-20 | agent-state migrated but snapshots still in docs/ | Partial state | Snapshots migrate, agent-state skips | P0 |
| MIG-21 | Only 1 of 4 files needs migration | 3 already migrated | Only 1 moves | P0 |
| MIG-22 | Migration failure of 1 file doesn't block others | Simulated failure | Other 3 succeed | P0 |
| MIG-23 | Each migration independent (no shared state) | Partial | No cross-dependency | P0 |
| MIG-24 | Post-partial state: all 4 at new paths | After 2 partial runs | Complete migration | P0 |

#### TC-MIG-S5: Collision & Edge Cases (6 TC)

| ID | Test Case | Pre-condition | Expected | Priority |
|----|-----------|--------------|----------|:--------:|
| MIG-25 | Both old and new pdca-status exist | Collision | New path is authoritative, old untouched | P0 |
| MIG-26 | Both old and new memory.json exist | Collision | New path is authoritative, old untouched | P0 |
| MIG-27 | Empty target directory for snapshots | Empty .bkit/snapshots/ | rmdir then rename succeeds | P0 |
| MIG-28 | Non-empty target directory for snapshots | Files in both | Skip migration, log debug | P0 |
| MIG-29 | Source file is 0 bytes | Edge case | Still migrated (valid empty file) | P1 |
| MIG-30 | Source file has invalid JSON | Edge case | Migrated as-is (no parsing during migration) | P1 |

### 3.3 TC-UNIT: Script Unit Tests (210 TC)

#### TC-UNIT-PATH: paths.js Functions (15 TC, NEW)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-PATH-01~05 | STATE_PATHS getters | 5 | All 7 path getters return correct paths |
| UNIT-PATH-06~08 | LEGACY_PATHS getters | 3 | All 4 deprecated paths correct |
| UNIT-PATH-09~11 | CONFIG_PATHS getters | 3 | All 3 config paths correct |
| UNIT-PATH-12~14 | ensureBkitDirs() | 3 | Creates dirs, idempotent, skips snapshots |
| UNIT-PATH-15 | Lazy require pattern | 1 | No circular dependency on load |

#### TC-UNIT-SS: session-start.js Functions (40 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-SS-01~05 | detectLevel() | 5 | Starter/Dynamic/Enterprise detection, edge cases |
| UNIT-SS-06~10 | enhancedOnboarding() | 5 | Previous work detection, action suggestion |
| UNIT-SS-11~15 | detectPdcaPhase() (v1.5.8 refactored) | 5 | Uses getPdcaStatusFull(), no process.cwd() |
| UNIT-SS-16~20 | bkend MCP detection | 5 | Dynamic/Enterprise MCP check |
| UNIT-SS-21~25 | additionalContext assembly | 5 | Memory Systems, Output Styles, Feature Report, v1.5.8 Enhancements |
| UNIT-SS-26~30 | Trigger tables | 5 | Agent/Skill/CC command trigger output |
| UNIT-SS-31~35 | JSON output structure | 5 | hookEventName, systemMessage, additionalContext |
| UNIT-SS-36~40 | Auto-migration logic (NEW) | 5 | Migration array, try-catch, EXDEV fallback, logging |

#### TC-UNIT-SP: skill-post.js Functions (25 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-SP-01~05 | parseSkillInvocation() | 5 | Skill name, args parsing, empty input |
| UNIT-SP-06~10 | formatNextStepMessage() | 5 | Next skill, agent suggestion, completion |
| UNIT-SP-11~15 | shouldSuggestCopy() | 5 | Each code gen skill, non-code skill, edge |
| UNIT-SP-16~20 | generateJsonOutput() | 5 | copyHint presence/absence, field structure |
| UNIT-SP-21~25 | main() flow | 5 | Hook input parsing, orchestration, PDCA update |

#### TC-UNIT-GDS: gap-detector-stop.js Functions (20 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-GDS-01~05 | Match rate extraction | 5 | matchRatePattern regex, integer parsing |
| UNIT-GDS-06~10 | Feature extraction | 5 | extractFeatureFromContext, multiple sources |
| UNIT-GDS-11~15 | Guidance generation | 5 | 4 branches (≥threshold, max, 70-89%, <70%) + /simplify option |
| UNIT-GDS-16~20 | JSON output structure | 5 | analysisResult, autoCreatedTasks, autoTrigger |

#### TC-UNIT-ITS: iterator-stop.js Functions (20 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-ITS-01~05 | Status detection | 5 | completed, max_iterations, improved, unknown |
| UNIT-ITS-06~10 | Iteration tracking | 5 | currentIteration, maxIterations, matchRate |
| UNIT-ITS-11~15 | Guidance generation | 5 | 4 status-based blocks + /simplify |
| UNIT-ITS-16~20 | Auto-task creation | 5 | autoCreatePdcaTask for act, report |

#### TC-UNIT-CRS: code-review-stop.js Functions (10 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-CRS-01~05 | Phase detection | 5 | do, check, else branches + /simplify |
| UNIT-CRS-06~10 | Suggestion formatting | 5 | Separator lines, PDCA command references |

#### TC-UNIT-US: unified-stop.js Functions (20 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-US-01~05 | detectActiveSkill() | 5 | 4 detection methods, priority order |
| UNIT-US-06~10 | detectActiveAgent() | 5 | 4 detection methods, priority order |
| UNIT-US-11~15 | executeHandler() | 5 | Handler loading, run(), error handling |
| UNIT-US-16~20 | Main flow | 5 | Handler registry, priority, fallback, /copy tip |

#### TC-UNIT-UPH: user-prompt-handler.js (15 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-UPH-01~05 | Intent detection | 5 | PDCA, agent, skill intent recognition |
| UNIT-UPH-06~10 | Agent/Skill trigger | 5 | matchMultiLangPattern, trigger response |
| UNIT-UPH-11~15 | CC command detection | 5 | simplify/batch intent, CC_COMMAND_PATTERNS |

#### TC-UNIT-LIB: Library Functions (45 TC)

| ID | Module | TC Count | Key Exports |
|----|--------|:--------:|-------------|
| UNIT-LIB-01~08 | lib/core/ (incl. paths.js) | 8 | debugLog, outputAllow, STATE_PATHS, ensureBkitDirs |
| UNIT-LIB-09~18 | lib/pdca/ | 10 | getPdcaStatusFull, updatePdcaStatus, getPdcaStatusPath (new path) |
| UNIT-LIB-19~24 | lib/intent/ | 6 | detectIntent, classifyLevel, CC_COMMAND_PATTERNS |
| UNIT-LIB-25~30 | lib/task/ | 6 | createTask, findPdcaStatus (new path), classification |
| UNIT-LIB-31~36 | lib/team/ | 6 | isTeamModeAvailable, getAgentStatePath (new path), formatTeamStatus |
| UNIT-LIB-37~40 | lib/skill-orchestrator.js | 4 | orchestrateSkillPost, getSkillConfig |
| UNIT-LIB-41~45 | lib/common.js bridge | 5 | 184 exports integrity, 4 new path exports verified |

### 3.4 TC-HOOK: Hook Integration Tests (65 TC)

| ID | Hook Event | TC Count | Verification |
|----|-----------|:--------:|-------------|
| HOOK-01~10 | SessionStart | 10 | JSON output, migration logic, additionalContext, v1.5.8 Enhancements |
| HOOK-11~16 | PreToolUse(Write\|Edit) | 6 | Convention check, PDCA tracking via new paths |
| HOOK-17~22 | PreToolUse(Bash) | 6 | Command detection, security |
| HOOK-23~28 | PostToolUse(Write) | 6 | File tracking, state update at new paths |
| HOOK-29~34 | PostToolUse(Bash) | 6 | Result parsing, state |
| HOOK-35~40 | PostToolUse(Skill) | 6 | Skill post-execution, copyHint |
| HOOK-41~46 | Stop | 6 | Handler dispatch, /copy tip, cleanup |
| HOOK-47~52 | UserPromptSubmit | 6 | Intent detection, CC command trigger |
| HOOK-53~57 | PreCompact | 5 | Context preservation, snapshot at new path |
| HOOK-58~62 | TaskCompleted | 5 | Phase advancement |
| HOOK-63~65 | Hook Chain | 3 | Cross-hook state propagation via centralized paths |

### 3.5 TC-AGENT: Agent Functional Tests (80 TC)

Each agent verified for: frontmatter, model, mode, tools, trigger, memory scope (5 TC × 16 agents = 80)

| ID Range | Agent | Model | TC |
|----------|-------|:-----:|:--:|
| AGENT-01~05 | cto-lead | opus | 5 |
| AGENT-06~10 | code-analyzer | opus | 5 |
| AGENT-11~15 | design-validator | opus | 5 |
| AGENT-16~20 | gap-detector | opus | 5 |
| AGENT-21~25 | enterprise-expert | opus | 5 |
| AGENT-26~30 | infra-architect | opus | 5 |
| AGENT-31~35 | security-architect | opus | 5 |
| AGENT-36~40 | bkend-expert | sonnet | 5 |
| AGENT-41~45 | pipeline-guide | sonnet | 5 |
| AGENT-46~50 | starter-guide | sonnet | 5 |
| AGENT-51~55 | pdca-iterator | sonnet | 5 |
| AGENT-56~60 | qa-strategist | sonnet | 5 |
| AGENT-61~65 | frontend-architect | sonnet | 5 |
| AGENT-66~70 | product-manager | sonnet | 5 |
| AGENT-71~75 | report-generator | haiku | 5 |
| AGENT-76~80 | qa-monitor | haiku | 5 |

### 3.6 TC-SKILL: Skill Functional Tests (90 TC)

Each skill verified for: YAML frontmatter, user-invocable flag, description, imports, triggers, content (3~4 TC per skill)

| ID Range | Skill Category | Skills | TC |
|----------|---------------|--------|:--:|
| SKILL-01~12 | PDCA | pdca, plan-plus | 12 |
| SKILL-13~21 | Level | starter, dynamic, enterprise | 9 |
| SKILL-22~25 | Pipeline | development-pipeline | 4 |
| SKILL-26~52 | Phase | phase-1 ~ phase-9 | 27 |
| SKILL-53~64 | Utility | code-review, zero-script-qa, claude-code-learning, bkit-rules, bkit-templates | 12 |
| SKILL-65~72 | Platform | mobile-app, desktop-app | 8 |
| SKILL-73~90 | bkend | bkend-auth, bkend-data, bkend-storage, bkend-quickstart, bkend-cookbook | 18 |

### 3.7 TC-PDCA: PDCA Workflow Tests (40 TC)

| ID | Workflow | TC Count | Scope |
|----|----------|:--------:|-------|
| PDCA-01~06 | Plan Phase | 6 | plan creation, template, task creation, status update at new path |
| PDCA-07~12 | Design Phase | 6 | design creation, plan dependency, template |
| PDCA-13~18 | Do Phase | 6 | implementation guide, design dependency |
| PDCA-19~24 | Check Phase | 6 | gap analysis, match rate, /simplify option |
| PDCA-25~28 | Act Phase | 4 | iteration, re-check, max iterations, /simplify suggestion |
| PDCA-29~32 | Report Phase | 4 | report generation, completion status |
| PDCA-33~36 | Archive Phase | 4 | document move, index update, cleanup |
| PDCA-37~38 | Status & Next | 2 | phase display, next suggestion (reads from new path) |
| PDCA-39~40 | Error Handling | 2 | missing plan, missing design |

### 3.8 TC-E2E: End-to-End Workflow Tests (60 TC)

| ID | Workflow | TC Count | Description |
|----|----------|:--------:|-------------|
| E2E-01~10 | Beginner Journey | 10 | /starter init → phase-1~3 → deploy |
| E2E-11~20 | Fullstack Journey | 10 | /dynamic init → bkend auth → API → UI → QA |
| E2E-21~30 | Enterprise Journey | 10 | /enterprise init → K8s → microservices → security |
| E2E-31~40 | PDCA Full Cycle | 10 | plan → design → do → check → /simplify → report → archive (new paths) |
| E2E-41~50 | CTO Team PDCA | 10 | /pdca team → parallel agents → quality gates → agent-state at runtime/ |
| E2E-51~60 | Migration + PDCA Flow | 10 | v1.5.7 legacy → SessionStart migration → PDCA continue → verify paths |

### 3.9 TC-UX: User Experience Tests (60 TC)

| ID | Journey | TC Count | Description |
|----|---------|:--------:|-------------|
| UX-01~10 | First-Time User | 10 | Plugin install, SessionStart output, level detection, help |
| UX-11~20 | Developer Workflow | 10 | Natural language triggers, skill auto-detection, PDCA flow |
| UX-21~30 | QA Engineer | 10 | /code-review, /zero-script-qa, gap analysis, iteration |
| UX-31~40 | Team Lead | 10 | /pdca team, CTO orchestration, teammate monitoring, agent-state in runtime/ |
| UX-41~50 | v1.5.8 UX | 10 | Transparent migration, no user intervention, state continuity post-migration |
| UX-51~60 | Multilingual UX | 10 | 8-language trigger discovery, CC_COMMAND_PATTERNS, ambiguity |

#### TC-UX-V158: v1.5.8 Specific UX (detailed)

| ID | Scenario | Steps | Expected | Priority |
|----|----------|-------|----------|:--------:|
| UX-41 | Transparent migration (no user action needed) | Start session with v1.5.7 state files | Auto-migration completes silently | P1 |
| UX-42 | SessionStart v1.5.8 Enhancements visible | Start new session | "v1.5.8 Enhancements" section in output | P1 |
| UX-43 | Path Registry mentioned in enhancements | Read v1.5.8 section | "Path Registry" described | P1 |
| UX-44 | State files migrated description | Read v1.5.8 section | ".bkit/{state,runtime,snapshots}/" mentioned | P1 |
| UX-45 | Auto-migration mentioned | Read v1.5.8 section | "Auto-migration from v1.5.7" described | P1 |
| UX-46 | bkit memory path updated in output | Check memory path | ".bkit/state/memory.json" shown | P1 |
| UX-47 | PDCA status reads correctly after migration | Run /pdca status | Status displayed with correct data | P1 |
| UX-48 | Memory operations work post-migration | Save and read memory | Data persisted at new path | P1 |
| UX-49 | Team operations work post-migration | Agent state at runtime/ | CTO Team functional | P1 |
| UX-50 | Context compaction saves to new snapshots/ | Trigger compaction | Snapshot at .bkit/snapshots/ | P1 |

### 3.10 TC-CONFIG: Config & Template Tests (25 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| CONFIG-01~05 | bkit.config.json | 5 | Schema, version 1.5.8, statusFile new path, team, defaults |
| CONFIG-06~10 | plugin.json | 5 | Name, version 1.5.8, outputStyles, keywords |
| CONFIG-11~15 | hooks.json | 5 | 10 entries, paths, timeouts |
| CONFIG-16~20 | Templates | 5 | 16 templates exist, structure valid |
| CONFIG-21~25 | Output Styles | 5 | 4 styles exist, YAML frontmatter, /simplify content |

### 3.11 TC-TEAM: CTO Team Orchestration Tests (30 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| TEAM-01~05 | Team availability | 5 | isTeamModeAvailable, env var check |
| TEAM-06~10 | Team composition | 5 | Dynamic (3), Enterprise (5), Starter (blocked) |
| TEAM-11~15 | Orchestration patterns | 5 | leader, swarm, council, watchdog |
| TEAM-16~20 | Task delegation | 5 | assignNextTeammateWork, task queue |
| TEAM-21~25 | Team status | 5 | formatTeamStatus, teammate progress |
| TEAM-26~30 | Agent state at new path | 5 | initAgentState→.bkit/runtime/, readAgentState, cleanup |

### 3.12 TC-LANG: Multi-Language Tests (32 TC)

| ID | Language | TC Count | Trigger Keywords |
|----|----------|:--------:|-----------------|
| LANG-01~04 | Korean | 4 | 검증, 개선, 분석, 간소화 |
| LANG-05~08 | Japanese | 4 | 確認, 改善, 分析, 簡素化 |
| LANG-09~12 | Chinese | 4 | 验证, 改进, 分析, 简化 |
| LANG-13~16 | Spanish | 4 | verificar, mejorar, analizar, simplificar |
| LANG-17~20 | French | 4 | vérifier, améliorer, analyser, simplifier |
| LANG-21~24 | German | 4 | prüfen, verbessern, analysieren, vereinfachen |
| LANG-25~28 | Italian | 4 | verificare, migliorare, analizzare, semplificare |
| LANG-29~32 | English | 4 | verify, improve, analyze, simplify |

### 3.13 TC-EDGE: Edge Case & Performance Tests (28 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| EDGE-01~04 | Hook timeout (5000ms) | 4 | No timeout violations including migration overhead |
| EDGE-05~08 | Large context handling | 4 | PreCompact preserves PDCA state at new path |
| EDGE-09~12 | Error recovery | 4 | Invalid JSON input, missing files, null feature |
| EDGE-13~16 | Concurrent access | 4 | Memory store read/write safety at new path |
| EDGE-17~20 | Migration edge cases | 4 | Permission denied, read-only fs, symlink source, large snapshot dir |
| EDGE-21~24 | EXDEV cross-filesystem | 4 | Copy+delete fallback, partial copy recovery, dir copy |
| EDGE-25~28 | Path resolution edge | 4 | Spaces in PROJECT_DIR, unicode paths, very long paths, relative import |

### 3.14 TC-SEC: Security Tests (20 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| SEC-01~04 | Input sanitization | 4 | matchRatePattern injection, feature name injection |
| SEC-05~08 | Path traversal | 4 | STATE_PATHS cannot be manipulated to escape .bkit/, no ../.. in paths |
| SEC-09~12 | Migration safety | 4 | Migration doesn't overwrite user files, no symlink following, atomic operation |
| SEC-13~16 | Data integrity | 4 | PDCA status consistency, task state isolation at new path |
| SEC-17~20 | Output safety | 4 | JSON output escaping, path not leaked in user output, .gitignore coverage |

### 3.15 TC-REG: Regression Tests (20 TC)

| ID | Area | TC Count | Source |
|----|------|:--------:|--------|
| REG-01~03 | v1.5.7 SKIP items | 3 | Runtime-only TCs re-check |
| REG-04~06 | common.js 184 exports (was 180) | 3 | Bridge integrity, no lost exports |
| REG-07~09 | Hook chain stability | 3 | 10 hooks sequential execution with new path lookups |
| REG-10~12 | Agent model assignment | 3 | 7 opus / 7 sonnet / 2 haiku (unchanged) |
| REG-13~15 | Hardcoding audit | 3 | Zero functional references to legacy paths in lib/, hooks/, scripts/ |
| REG-16~18 | .gitignore coverage | 3 | All .bkit/* files ignored, no state files tracked |
| REG-19~20 | Known issues | 2 | #29548, #29547, #25131 status check |

---

## 4. Test Execution Strategy

### 4.1 Execution Order

```
Phase 1: Static Verification (P0)
    ├── TC-V158 (75 TC) — v1.5.8 changes + Path Registry + consumer refactoring
    ├── TC-CONFIG (25 TC) — configs, templates, output styles
    └── TC-SKILL (90 TC) — skill frontmatter and content
    Total: 190 TC

Phase 2: Unit Tests (P0)
    ├── TC-UNIT (210 TC) — all script functions + new paths.js
    └── TC-AGENT (80 TC) — agent frontmatter and setup
    Total: 290 TC

Phase 3: Integration & Migration Tests (P0)
    ├── TC-HOOK (65 TC) — hook chain validation with new paths
    ├── TC-PDCA (40 TC) — PDCA workflow with centralized paths
    └── TC-MIG (30 TC) — 5 migration scenarios + edge cases
    Total: 135 TC

Phase 4: E2E & UX Tests (P1)
    ├── TC-E2E (60 TC) — end-to-end workflows including migration E2E
    ├── TC-UX (60 TC) — user experience including transparent migration
    └── TC-TEAM (30 TC) — CTO Team with new agent-state path
    Total: 150 TC

Phase 5: Extended Tests (P2)
    ├── TC-LANG (32 TC) — multi-language + CC_COMMAND_PATTERNS
    ├── TC-EDGE (28 TC) — edge cases + migration edge + EXDEV
    ├── TC-SEC (20 TC) — security + path traversal + migration safety
    └── TC-REG (20 TC) — regression + hardcoding audit
    Total: 100 TC

Buffer: 35 TC (new discoveries during test execution)
    └── TC-BUF (35 TC) — dynamically created during testing
```

### 4.2 Test Methods

| Method | Description | TC Coverage |
|--------|-------------|:-----------:|
| **Grep** | Content verification via pattern matching | ~360 TC |
| **Node Require** | Module loading, export counting, function existence, path validation | ~180 TC |
| **JSON Parse** | Configuration and output structure validation | ~90 TC |
| **Logic Trace** | Code path analysis, conditional coverage, migration flow | ~130 TC |
| **File System** | File existence, directory structure, migration verification | ~70 TC |
| **Workflow Simulation** | PDCA cycle, user journeys, migration + PDCA continuity | ~60 TC |
| **Regex Validation** | CC_COMMAND_PATTERNS, matchRatePattern, path patterns | ~30 TC |

### 4.3 Parallelization Strategy

| Agent | TC Assignment | Model | TC Count |
|-------|--------------|:-----:|:--------:|
| qa-v158 | TC-V158 (75) + TC-MIG (30) + TC-CONFIG (25) + TC-REG (20) | opus | 150 |
| qa-unit | TC-UNIT (210) | opus | 210 |
| qa-integration | TC-HOOK (65) + TC-PDCA (40) + TC-AGENT (80) | opus | 185 |
| qa-e2e | TC-E2E (60) + TC-UX (60) + TC-TEAM (30) | sonnet | 150 |
| qa-extended | TC-LANG (32) + TC-EDGE (28) + TC-SEC (20) + TC-SKILL (90) | sonnet | 170 |

### 4.4 v1.5.8 Delta Focus Areas

The following areas require **extra attention** compared to v1.5.7 testing:

| Focus Area | Reason | TC IDs |
|-----------|--------|--------|
| Path Registry correctness | New centralized path module, all state I/O depends on it | V158-01~20, UNIT-PATH-01~15 |
| Consumer refactoring completeness | 7 files must use Path Registry, zero hardcoding | V158-21~45, REG-13~15 |
| Auto-migration reliability | 5 scenarios, EXDEV fallback, error isolation | V158-46~60, MIG-01~30 |
| Bridge integrity (184 exports) | 4 new exports, no lost exports from v1.5.7 | V158-61~70, REG-04~06 |
| State file continuity | All PDCA operations must work with new paths | PDCA-01~40, E2E-51~60, UX-41~50 |
| .gitignore coverage | All .bkit/ state files must be git-ignored | REG-16~18, SEC-17~20 |
| Migration + PDCA flow | v1.5.7 project upgrades seamlessly to v1.5.8 | E2E-51~60, MIG-07~12 |

---

## 5. Success Criteria

### 5.1 Pass Criteria

| Metric | Target | Minimum |
|--------|:------:|:-------:|
| Overall Pass Rate | 100% | 99% |
| P0 Pass Rate | 100% | 100% |
| P1 Pass Rate | 100% | 95% |
| FAIL count | 0 | ≤ 3 |
| v1.5.8 TC Pass Rate (75 TC) | 100% | 100% |
| Migration TC Pass Rate (30 TC) | 100% | 100% |
| Hardcoding Audit | 0 references | 0 references |
| Bridge Export Count | 184 | 184 |

### 5.2 Definition of Done

- [ ] All 920 TC executed (885 core + 35 buffer)
- [ ] 0 FAIL in P0 category (590 TC)
- [ ] All v1.5.8 changes (75 TC) verified
- [ ] All 5 migration scenarios (30 TC) verified
- [ ] All 27 skills verified
- [ ] All 16 agents verified
- [ ] All 10 hooks verified
- [ ] E2E workflows pass including migration + PDCA continuity flow
- [ ] UX scenarios validated for all 6 personas (including transparent migration)
- [ ] 0 hardcoded legacy paths in lib/, hooks/, scripts/
- [ ] common.js bridge has exactly 184 exports
- [ ] Security tests pass (20 TC) including path traversal and migration safety
- [ ] Regression items re-verified (20 TC)
- [ ] All .bkit/ state files confirmed git-ignored

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Runtime-only TCs require live Claude Code | Medium | High | Mark as SKIP with clear rationale |
| Agent Teams env var not set | Low | Medium | Check CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS before team tests |
| Migration edge cases on different OS | Medium | Low | EXDEV fallback tested, cpSync available |
| Path resolution differs across platforms | Medium | Low | All paths use path.join, PROJECT_DIR is absolute |
| Legacy path references in skill docs (non-functional) | Low | Medium | Content-only; not tested as code |
| Circular dependency from paths.js → platform.js | High | Low | Lazy require pattern verified (V158-20, UNIT-PATH-15) |
| Large snapshot directory migration performance | Low | Low | Async not needed; rename is atomic |
| CC v2.1.63 AskUserQuestion bug (#29547) | High | Medium | Use emitUserPrompt pattern (verified working) |
| .bkit/ directory may not exist on first run | Medium | Low | ensureBkitDirs called before any path access |
| pdca-status.json schema version mismatch after migration | Low | Low | Migration is content-agnostic (file-level move) |

---

## 7. Test Environment

### 7.1 Prerequisites

```bash
# Required
- Claude Code v2.1.63+
- Node.js v18+
- bkit plugin installed (claude --plugin-dir .)
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Branch
git checkout feature/bkit-v1.5.8-studio-support

# Verify plugin version
node -e "console.log(require('./.claude-plugin/plugin.json').version)"
# Expected: 1.5.8
```

### 7.2 Test Reporting

Output format for each TC:

```
[PASS|FAIL|SKIP] TC-ID: Description
  File: path/to/file
  Expected: expected value
  Actual: actual value (FAIL only)
  Reason: skip reason (SKIP only)
```

### 7.3 v1.5.8 Specific Validation Commands

```bash
# Verify Path Registry exports
node -e "
  const p = require('./lib/core/paths');
  console.log('STATE_PATHS keys:', Object.keys(p.STATE_PATHS));
  console.log('LEGACY_PATHS keys:', Object.keys(p.LEGACY_PATHS));
  console.log('CONFIG_PATHS keys:', Object.keys(p.CONFIG_PATHS));
  console.log('ensureBkitDirs:', typeof p.ensureBkitDirs);
"
# Expected: 7, 4, 3 keys + function

# Verify common.js bridge (184 exports)
node -e "console.log('Exports:', Object.keys(require('./lib/common')).length)"
# Expected: 184

# Verify no hardcoded legacy paths
grep -rn 'docs/\.pdca-status' lib/ hooks/ scripts/ || echo '✓ No matches'
grep -rn 'docs/.*\.bkit-memory' lib/ hooks/ scripts/ || echo '✓ No matches'
grep -rn 'docs/.*\.pdca-snapshots' lib/ hooks/ scripts/ || echo '✓ No matches'

# Verify state paths resolve correctly
node -e "
  const p = require('./lib/core/paths');
  console.log('pdcaStatus:', p.STATE_PATHS.pdcaStatus());
  console.log('memory:', p.STATE_PATHS.memory());
  console.log('agentState:', p.STATE_PATHS.agentState());
  console.log('snapshots:', p.STATE_PATHS.snapshots());
"

# Verify .gitignore coverage
git check-ignore .bkit/state/pdca-status.json && echo '✓ Ignored'
git check-ignore .bkit/runtime/agent-state.json && echo '✓ Ignored'
git check-ignore .bkit/state/memory.json && echo '✓ Ignored'

# Verify version sync
grep -n '"1.5.8"' .claude-plugin/plugin.json bkit.config.json

# Verify migration logic in session-start.js
grep -c 'migrations' hooks/session-start.js
grep -c 'EXDEV' hooks/session-start.js
grep -c 'Migrated' hooks/session-start.js
```

---

## 8. Previous Test Progression

| Version | TC | PASS | FAIL | SKIP | Rate |
|:-------:|:--:|:----:|:----:|:----:|:----:|
| v1.5.0 | 101 | 100 | 0 | 1 | 100% |
| v1.5.1 | 673 | 603 | 3→0 | 67 | 99.5→100% |
| v1.5.2 | 673 | 603 | 3→0 | 67 | 99.5→100% |
| v1.5.3 | 688 | 646 | 0 | 39 | 100% |
| v1.5.4 | 708 | 705 | 0 | 3 | 100% |
| v1.5.6 | 754 | 748 | 0 | 6 | 100% |
| v1.5.7 | 820 | 763 | 0 | 57 | 100% |
| **v1.5.8** | **920** | **TBD** | **TBD** | **TBD** | **TBD** |

### 8.1 TC Growth Analysis

| Version | TC Added | Primary Additions |
|:-------:|:--------:|-------------------|
| v1.5.0→v1.5.1 | +572 | First comprehensive test (agent, hook, skill) |
| v1.5.1→v1.5.3 | +15 | team-visibility, state-writer |
| v1.5.3→v1.5.4 | +20 | bkend MCP accuracy |
| v1.5.4→v1.5.6 | +46 | ENH-48~51 (auto-memory, /copy, guides) |
| v1.5.6→v1.5.7 | +106 | ENH-52~55, English conversion, security tests |
| v1.5.7→v1.5.8 | **+100** | Path Registry, auto-migration (5 scenarios), consumer refactoring, bridge extension, security tests expansion |

---

## 9. Design Document Reference

This test plan requires a companion test design document for detailed TC specifications:

**Test Design**: `docs/02-design/features/bkit-v1.5.8-comprehensive-test.design.md`

The design document will include:
- Detailed TC specifications with verification commands for each TC
- Agent task assignment per TC category
- Migration scenario test matrices with pre/post conditions
- Exact Grep patterns and expected outputs
- Node require validation scripts
- Cross-reference with v1.5.8 design document FRs
- Error scenario matrices for migration edge cases
- Path audit automation scripts

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-01 | Initial draft — 920 TC, 15 categories, 5 phases, 5 migration scenarios | CTO Lead (cto-lead, opus) |
