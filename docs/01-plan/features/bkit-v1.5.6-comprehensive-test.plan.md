# bkit v1.5.6 Comprehensive Test Plan

> **Summary**: bkit v1.5.6 comprehensive test — Unit, Integration, E2E, and User Experience tests covering all features and v1.5.6 changes (ENH-48~51)
>
> **Project**: bkit-claude-code
> **Version**: 1.5.6
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager, gap-detector, security-architect)
> **Date**: 2026-02-27
> **Status**: Final (3 Research Agents Complete)
> **Previous Test**: v1.5.4 (708 TC, 705 PASS, 0 FAIL, 3 SKIP, 100%)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, Claude Code v2.1.59
> **Branch**: feature/bkit-v1.5.6-cc-v2159-update

---

## 1. Background

### 1.1 Test Necessity

bkit v1.5.6 includes 4 enhancements (ENH-48~51) responding to Claude Code v2.1.56~v2.1.59 updates, plus a version bump. This test plan covers:

1. **v1.5.6 new changes** (ENH-48~51: auto-memory, /copy guidance, CTO guide, RC pre-check)
2. **Full bkit feature inventory** (27 skills, 16 agents, 10 hooks, 45 scripts, 180 common.js exports)
3. **Unit tests** for all testable functions
4. **E2E tests** for complete user workflows
5. **UX tests** for user experience quality

| Change Category | v1.5.6 Delta from v1.5.5 |
|----------------|--------------------------|
| Skills count | 27 (unchanged from v1.5.5) |
| Agents count | 16 (unchanged) |
| Hook events | 10 (unchanged) |
| Scripts | 45 (unchanged) |
| common.js exports | 180 (unchanged) |
| Templates | 16 (unchanged) |
| Output Styles | 4 (unchanged) |
| Config files | 2 (version bump) |
| Code changes | 3 scripts + 1 command + 2 configs + 1 changelog = 7 files modified |
| Docs changes | 2 new guides |

### 1.2 Previous Test Results (v1.5.4)

| Metric | Value |
|--------|:-----:|
| Total TC | 708 |
| Executed | 708 |
| PASS | 705 |
| FAIL | 0 |
| SKIP | 3 (runtime-only, environment-dependent) |
| Pass Rate (excl. SKIP) | 100.0% |

### 1.3 v1.5.6 Component Inventory

| Component | Count | Location | Delta from v1.5.5 |
|-----------|:-----:|----------|:------------------:|
| Skills | 27 (22 core + 5 bkend) | `skills/*/SKILL.md` | 0 |
| Agents | 16 | `agents/*.md` | 0 |
| Hook Events | 10 | `hooks/hooks.json` | 0 |
| Scripts | 45 | `scripts/*.js` | 0 (2 modified: skill-post.js, unified-stop.js) |
| Library Exports (common.js) | 180 | `lib/` → `lib/common.js` | 0 |
| Templates | 16 | `templates/` | 0 |
| Output Styles | 4 | `output-styles/` | 0 |
| Config Files | 2 | `plugin.json`, `bkit.config.json` | 0 (2 version bumps) |
| Guides (NEW) | 2 | `docs/guides/` | +2 |
| Commands | 1 | `commands/bkit.md` | 0 (1 section added) |

### 1.4 v1.5.6 Changed Files

| File | Change Type | ENH | Lines Changed |
|------|:-----------:|:---:|:------------:|
| `hooks/session-start.js` | Modified | 48 | +15/-5 |
| `scripts/skill-post.js` | Modified | 49 | +20/-0 |
| `scripts/unified-stop.js` | Modified | 49 | +3/-1 |
| `commands/bkit.md` | Modified | 48 | +4/-0 |
| `.claude-plugin/plugin.json` | Modified | - | +1/-1 |
| `bkit.config.json` | Modified | - | +1/-1 |
| `CHANGELOG.md` | Modified | - | +32/-0 |
| `docs/guides/cto-team-memory-guide.md` | **New** | 50 | +117 |
| `docs/guides/remote-control-compatibility.md` | **New** | 51 | +60 |

### 1.5 CTO Team Composition

| Role | Agent | Model | Responsibility |
|------|-------|:-----:|---------------|
| **CTO Lead** | cto-lead | opus | Overall coordination, quality gates |
| Code Analyzer | code-analyzer | opus | Static analysis, function coverage |
| QA Strategist | qa-strategist | sonnet | Test design, coverage metrics |
| Product Manager | product-manager | sonnet | UX scenarios, user journeys |
| Gap Detector | gap-detector | opus | Design-implementation verification |
| Security Architect | security-architect | opus | Security test review |

---

## 2. Goals

### 2.1 Must (P0)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-01 | v1.5.6 New Changes Test | ENH-48~51: auto-memory, /copy, guides, version | 55 |
| G-02 | Script Unit Test | 45 scripts, exported functions, logic paths | 200 |
| G-03 | Hook Integration Test | 10 hook events, chain validation, state propagation | 65 |
| G-04 | Agent Functional Test | 16 agents: trigger, tools, model, memory | 80 |
| G-05 | Skill Functional Test | 27 skills: load, trigger, content, imports | 90 |
| G-06 | PDCA Workflow Test | Plan-Design-Do-Check-Act-Report-Archive-Cleanup | 40 |

### 2.2 Should (P1)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-07 | E2E Workflow Test | 6 complete user workflows across components | 60 |
| G-08 | UX Experience Test | 5 user journeys (Beginner/Dev/QA/Team/Completion) | 50 |
| G-09 | Config & Template Test | bkit.config.json, 16 templates, output-styles | 25 |
| G-10 | CTO Team Orchestration Test | Team composition, patterns, delegation, cleanup | 30 |

### 2.3 Could (P2)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-11 | Multi-Language Test | 8-language triggers + ambiguity detection | 24 |
| G-12 | Edge Case & Performance | Hook timeout, caching, error handling | 20 |
| G-13 | Regression Test | v1.5.4 baseline + known issues re-check | 15 |

### 2.4 TC Summary

| Priority | TC Count | Ratio |
|:--------:|:--------:|:-----:|
| P0 (Must) | 530 | 66.3% |
| P1 (Should) | 165 | 20.6% |
| P2 (Could) | 59 | 7.4% |
| Regression | 15 | 1.9% |
| **Grand Total** | **769** | **100%** |

---

## 3. Test Categories

### 3.1 TC-V156: v1.5.6 New Changes (55 TC)

#### TC-V156-ENH48: Auto-Memory Integration (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V156-01 | SessionStart output contains `## Memory Systems (v1.5.6)` | session-start.js | Grep string | P0 |
| V156-02 | `### bkit Agent Memory (Auto-Active)` sub-heading present | session-start.js | Grep string | P0 |
| V156-03 | `### Claude Code Auto-Memory` sub-heading present | session-start.js | Grep string | P0 |
| V156-04 | Agent count corrected to "14 agents use project scope" | session-start.js | Grep "14 agents" | P0 |
| V156-05 | Old "9 agents use project scope" text removed | session-start.js | Grep absent | P0 |
| V156-06 | Old "All bkit agents remember" text removed | session-start.js | Grep absent | P0 |
| V156-07 | `/memory` command reference in auto-memory guidance | session-start.js | Grep `/memory` | P0 |
| V156-08 | "no collision" message between memory systems | session-start.js | Grep "no collision" | P0 |
| V156-09 | PDCA completion tip for /memory | session-start.js | Grep "save key learnings" | P0 |
| V156-10 | `commands/bkit.md` has "Memory & Clipboard" section | bkit.md | Grep "Memory & Clipboard" | P0 |
| V156-11 | `/memory` entry in bkit help | bkit.md | Grep "/memory" | P0 |
| V156-12 | `/copy` entry in bkit help | bkit.md | Grep "/copy" | P0 |
| V156-13 | Memory & Clipboard between Learning and Output Styles | bkit.md | Line order check | P0 |
| V156-14 | JSDoc header version `v1.5.6` | session-start.js:3 | Grep `v1.5.6` | P0 |
| V156-15 | JSDoc v1.5.6 Changes block present | session-start.js:6 | Grep "v1.5.6 Changes" | P0 |
| V156-16 | JSDoc has "CC recommended version: v2.1.42 -> v2.1.59" | session-start.js:11 | Grep exact line | P0 |
| V156-17 | additionalContext header `v1.5.6` | session-start.js | Grep "Vibecoding Kit v1.5.6" | P0 |
| V156-18 | Output Styles section `v1.5.6` | session-start.js | Grep "Output Styles (v1.5.6)" | P0 |
| V156-19 | systemMessage `v1.5.6` | session-start.js | Grep "v1.5.6 activated" | P0 |
| V156-20 | Feature Usage Report `v1.5.6` | session-start.js | Grep "v1.5.6 - Required" | P0 |

#### TC-V156-ENH49: /copy Command Guidance (20 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V156-21 | `CODE_GENERATION_SKILLS` array defined | skill-post.js | Grep constant name | P0 |
| V156-22 | Array contains `phase-4-api` | skill-post.js | Grep value | P0 |
| V156-23 | Array contains `phase-5-design-system` | skill-post.js | Grep value | P0 |
| V156-24 | Array contains `phase-6-ui-integration` | skill-post.js | Grep value | P0 |
| V156-25 | Array contains `code-review` | skill-post.js | Grep value | P0 |
| V156-26 | Array contains `starter` | skill-post.js | Grep value | P0 |
| V156-27 | Array contains `dynamic` | skill-post.js | Grep value | P0 |
| V156-28 | Array contains `enterprise` | skill-post.js | Grep value | P0 |
| V156-29 | Array contains `mobile-app` | skill-post.js | Grep value | P0 |
| V156-30 | Array contains `desktop-app` | skill-post.js | Grep value | P0 |
| V156-31 | Array has exactly 9 elements | skill-post.js | Count elements | P0 |
| V156-32 | `pdca` NOT in CODE_GENERATION_SKILLS | skill-post.js | Grep absent in array | P0 |
| V156-33 | `shouldSuggestCopy()` function exists | skill-post.js | Grep function name | P0 |
| V156-34 | `shouldSuggestCopy('phase-6-ui-integration')` returns true | skill-post.js | Logic check | P0 |
| V156-35 | `shouldSuggestCopy('pdca')` returns false | skill-post.js | Logic check | P0 |
| V156-36 | `generateJsonOutput` adds `copyHint` for code skills | skill-post.js | Grep "copyHint" | P0 |
| V156-37 | `copyHint` value is English string | skill-post.js | Grep "Use /copy" | P0 |
| V156-38 | unified-stop.js has conditional /copy tip | unified-stop.js | Grep "copyTip" | P0 |
| V156-39 | /copy tip shown when activeSkill exists | unified-stop.js | Ternary logic check | P0 |
| V156-40 | /copy tip empty when activeSkill is null | unified-stop.js | Ternary logic check | P0 |

#### TC-V156-DOC: Guide Documents (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V156-41 | cto-team-memory-guide.md exists | docs/guides/ | File exists | P0 |
| V156-42 | Guide mentions 3 memory systems | cto-team-memory-guide.md | Grep "CC auto-memory", "bkit memory-store", "bkit agent-memory" | P0 |
| V156-43 | Guide mentions v2.1.50 and v2.1.59 | cto-team-memory-guide.md | Grep both versions | P0 |
| V156-44 | remote-control-compatibility.md exists | docs/guides/ | File exists | P0 |
| V156-45 | RC doc has 12 skills in matrix | remote-control-compatibility.md | Count table rows | P0 |

#### TC-V156-VER: Version Bump (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V156-46 | plugin.json version = "1.5.6" | plugin.json | Grep version | P0 |
| V156-47 | bkit.config.json version = "1.5.6" | bkit.config.json | Grep version | P0 |
| V156-48 | CHANGELOG has `## [1.5.6]` header | CHANGELOG.md | Grep header | P0 |
| V156-49 | CHANGELOG has Added section | CHANGELOG.md | Grep "### Added" after 1.5.6 | P0 |
| V156-50 | CHANGELOG has Changed section | CHANGELOG.md | Grep "### Changed" after 1.5.6 | P0 |
| V156-51 | CHANGELOG has Compatibility section | CHANGELOG.md | Grep "### Compatibility" | P0 |
| V156-52 | CHANGELOG Recommended v2.1.59 | CHANGELOG.md | Grep "Recommended v2.1.59" | P0 |
| V156-53 | CHANGELOG entries in English (no Korean) | CHANGELOG.md | Grep no Hangul in v1.5.6 block | P0 |
| V156-54 | No remaining v1.5.5 in session-start.js (except changelog) | session-start.js | Count "v1.5.5" ≤ 1 | P0 |
| V156-55 | All v1.5.6 version strings consistent | all 4 files | Cross-check | P0 |

### 3.2 TC-UNIT: Script Unit Tests (200 TC)

#### TC-UNIT-SS: session-start.js Functions (35 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-SS-01~05 | detectLevel() | 5 | Starter/Dynamic/Enterprise detection, edge cases |
| UNIT-SS-06~10 | enhancedOnboarding() | 5 | Previous work detection, action suggestion |
| UNIT-SS-11~15 | detectPdcaPhase() | 5 | Each PDCA phase detection |
| UNIT-SS-16~20 | bkend MCP detection | 5 | Dynamic/Enterprise MCP check |
| UNIT-SS-21~25 | additionalContext assembly | 5 | Memory Systems, Output Styles, Feature Report |
| UNIT-SS-26~30 | Trigger tables | 5 | Agent/Skill trigger output |
| UNIT-SS-31~35 | JSON output structure | 5 | hookEventName, systemMessage, additionalContext |

#### TC-UNIT-SP: skill-post.js Functions (25 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-SP-01~05 | parseSkillInvocation() | 5 | Skill name, args parsing, empty input |
| UNIT-SP-06~10 | formatNextStepMessage() | 5 | Next skill, agent suggestion, completion |
| UNIT-SP-11~15 | shouldSuggestCopy() | 5 | Each code gen skill, non-code skill, edge |
| UNIT-SP-16~20 | generateJsonOutput() | 5 | copyHint presence/absence, field structure |
| UNIT-SP-21~25 | main() flow | 5 | Hook input parsing, orchestration, PDCA update |

#### TC-UNIT-US: unified-stop.js Functions (20 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-US-01~05 | detectActiveSkill() | 5 | 4 detection methods, priority order |
| UNIT-US-06~10 | detectActiveAgent() | 5 | 4 detection methods, priority order |
| UNIT-US-11~15 | executeHandler() | 5 | Handler loading, run(), error handling |
| UNIT-US-16~20 | Main flow | 5 | Handler registry, priority, fallback, /copy tip |

#### TC-UNIT-BPR: unified-bash-pre.js (15 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-BPR-01~05 | Command detection | 5 |
| UNIT-BPR-06~10 | Security checks | 5 |
| UNIT-BPR-11~15 | Output formatting | 5 |

#### TC-UNIT-BPS: unified-bash-post.js (15 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-BPS-01~05 | Result parsing | 5 |
| UNIT-BPS-06~10 | State updates | 5 |
| UNIT-BPS-11~15 | Error handling | 5 |

#### TC-UNIT-WR: unified-write-post.js + pre-write.js (15 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-WR-01~05 | File path detection | 5 |
| UNIT-WR-06~10 | PDCA document tracking | 5 |
| UNIT-WR-11~15 | Convention validation | 5 |

#### TC-UNIT-UPH: user-prompt-handler.js (15 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-UPH-01~05 | Intent detection | 5 |
| UNIT-UPH-06~10 | Agent/Skill trigger | 5 |
| UNIT-UPH-11~15 | Ambiguity detection | 5 |

#### TC-UNIT-CC: context-compaction.js (10 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-CC-01~05 | Context preservation | 5 |
| UNIT-CC-06~10 | PDCA state compaction | 5 |

#### TC-UNIT-TC: pdca-task-completed.js (10 TC)

| ID | Area | TC Count |
|----|------|:--------:|
| UNIT-TC-01~05 | Task completion detection | 5 |
| UNIT-TC-06~10 | Phase advancement | 5 |

#### TC-UNIT-LIB: Library Functions (40 TC)

| ID | Module | TC Count | Key Exports |
|----|--------|:--------:|-------------|
| UNIT-LIB-01~08 | lib/core/ | 8 | debugLog, outputAllow, readStdinSync |
| UNIT-LIB-09~18 | lib/pdca/ | 10 | getPdcaStatusFull, updatePdcaStatus, addPdcaHistory |
| UNIT-LIB-19~24 | lib/intent/ | 6 | detectIntent, classifyLevel, scoreConfidence |
| UNIT-LIB-25~30 | lib/task/ | 6 | createTask, updateTask, addBlockedBy |
| UNIT-LIB-31~36 | lib/team/ | 6 | isTeamModeAvailable, generateTeamStrategy, formatTeamStatus |
| UNIT-LIB-37~40 | lib/skill-orchestrator.js | 4 | orchestrateSkillPost, getSkillConfig |

### 3.3 TC-HOOK: Hook Integration Tests (65 TC)

| ID | Hook Event | TC Count | Verification |
|----|-----------|:--------:|-------------|
| HOOK-01~08 | SessionStart | 8 | JSON output structure, additionalContext, systemMessage |
| HOOK-09~14 | PreToolUse(Write\|Edit) | 6 | Convention check, PDCA tracking |
| HOOK-15~20 | PreToolUse(Bash) | 6 | Command detection, security |
| HOOK-21~26 | PostToolUse(Write) | 6 | File tracking, state update |
| HOOK-27~32 | PostToolUse(Bash) | 6 | Result parsing, state |
| HOOK-33~38 | PostToolUse(Skill) | 6 | Skill post-execution, copyHint |
| HOOK-39~44 | Stop | 6 | Handler dispatch, /copy tip, cleanup |
| HOOK-45~50 | UserPromptSubmit | 6 | Intent detection, trigger |
| HOOK-51~55 | PreCompact | 5 | Context preservation |
| HOOK-56~60 | TaskCompleted | 5 | Phase advancement |
| HOOK-61~65 | Hook Chain | 5 | Cross-hook state propagation |

### 3.4 TC-AGENT: Agent Functional Tests (80 TC)

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

### 3.5 TC-SKILL: Skill Functional Tests (90 TC)

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

### 3.6 TC-PDCA: PDCA Workflow Tests (40 TC)

| ID | Workflow | TC Count | Scope |
|----|----------|:--------:|-------|
| PDCA-01~06 | Plan Phase | 6 | plan creation, template, task creation, status update |
| PDCA-07~12 | Design Phase | 6 | design creation, plan dependency, template |
| PDCA-13~18 | Do Phase | 6 | implementation guide, design dependency |
| PDCA-19~24 | Check Phase | 6 | gap analysis, match rate, agent call |
| PDCA-25~28 | Act Phase | 4 | iteration, re-check, max iterations |
| PDCA-29~32 | Report Phase | 4 | report generation, completion status |
| PDCA-33~36 | Archive Phase | 4 | document move, index update, cleanup |
| PDCA-37~38 | Status & Next | 2 | phase display, next suggestion |
| PDCA-39~40 | Error Handling | 2 | missing plan, missing design |

### 3.7 TC-E2E: End-to-End Workflow Tests (60 TC)

| ID | Workflow | TC Count | Description |
|----|----------|:--------:|-------------|
| E2E-01~10 | Beginner Journey | 10 | /starter init → phase-1~3 → deploy |
| E2E-11~20 | Fullstack Journey | 10 | /dynamic init → bkend auth → API → UI → QA |
| E2E-21~30 | Enterprise Journey | 10 | /enterprise init → K8s → microservices → security |
| E2E-31~40 | PDCA Full Cycle | 10 | plan → design → do → analyze → iterate → report → archive |
| E2E-41~50 | CTO Team PDCA | 10 | /pdca team → parallel agents → quality gates → cleanup |
| E2E-51~60 | Code Review Flow | 10 | code-review → gap analysis → iteration → report |

### 3.8 TC-UX: User Experience Tests (50 TC)

| ID | Journey | TC Count | Description |
|----|---------|:--------:|-------------|
| UX-01~10 | First-Time User | 10 | Plugin install, SessionStart output, level detection, help |
| UX-11~20 | Developer Workflow | 10 | Natural language triggers, skill auto-detection, PDCA flow |
| UX-21~30 | QA Engineer | 10 | /code-review, /zero-script-qa, gap analysis, iteration |
| UX-31~40 | Team Lead | 10 | /pdca team, CTO orchestration, teammate monitoring |
| UX-41~50 | v1.5.6 UX | 10 | Memory Systems, /memory, /copy after skills, Stop tip |

#### TC-UX-V156: v1.5.6 Specific UX (detailed)

| ID | Scenario | Steps | Expected | Priority |
|----|----------|-------|----------|:--------:|
| UX-41 | SessionStart Memory Systems | Start new session | "Memory Systems (v1.5.6)" visible | P1 |
| UX-42 | /memory command discovery | Read SessionStart output | "/memory" command referenced | P1 |
| UX-43 | /copy after phase-6 skill | Complete /phase-6 skill | copyHint in JSON output | P1 |
| UX-44 | /copy NOT after pdca skill | Complete /pdca skill | No copyHint in output | P1 |
| UX-45 | /copy tip on Stop | Trigger Stop event after skill | "Tip: Use /copy" in output | P1 |
| UX-46 | No /copy tip without skill | Trigger Stop without skill | No /copy tip | P1 |
| UX-47 | Memory Systems role clarity | Read Memory Systems section | 3 systems clearly separated | P1 |
| UX-48 | Agent count accuracy | Read Memory Systems | "14 agents use project scope" | P1 |
| UX-49 | CTO Team guide accessible | Navigate to docs/guides/ | cto-team-memory-guide.md found | P1 |
| UX-50 | RC pre-check accessible | Navigate to docs/guides/ | remote-control-compatibility.md found | P1 |

### 3.9 TC-CONFIG: Config & Template Tests (25 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| CONFIG-01~05 | bkit.config.json | 5 | Schema, version, team, defaults |
| CONFIG-06~10 | plugin.json | 5 | Name, version, outputStyles, keywords |
| CONFIG-11~15 | hooks.json | 5 | 10 entries, paths, timeouts |
| CONFIG-16~20 | Templates | 5 | 16 templates exist, structure valid |
| CONFIG-21~25 | Output Styles | 5 | 4 styles exist, YAML frontmatter |

### 3.10 TC-TEAM: CTO Team Orchestration Tests (30 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| TEAM-01~05 | Team availability | 5 | isTeamModeAvailable, env var check |
| TEAM-06~10 | Team composition | 5 | Dynamic (3), Enterprise (5), Starter (blocked) |
| TEAM-11~15 | Orchestration patterns | 5 | leader, swarm, council, watchdog |
| TEAM-16~20 | Task delegation | 5 | assignNextTeammateWork, task queue |
| TEAM-21~25 | Team status | 5 | formatTeamStatus, teammate progress |
| TEAM-26~30 | Team cleanup | 5 | Stop teammates, session end, memory clear |

### 3.11 TC-LANG: Multi-Language Tests (24 TC)

| ID | Language | TC Count | Trigger Keywords |
|----|----------|:--------:|-----------------|
| LANG-01~03 | Korean | 3 | 검증, 개선, 분석 |
| LANG-04~06 | Japanese | 3 | 確認, 改善, 分析 |
| LANG-07~09 | Chinese | 3 | 验证, 改进, 分析 |
| LANG-10~12 | Spanish | 3 | verificar, mejorar, analizar |
| LANG-13~15 | French | 3 | vérifier, améliorer, analyser |
| LANG-16~18 | German | 3 | prüfen, verbessern, analysieren |
| LANG-19~21 | Italian | 3 | verificare, migliorare, analizzare |
| LANG-22~24 | English | 3 | verify, improve, analyze |

### 3.12 TC-EDGE: Edge Case & Performance Tests (20 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| EDGE-01~04 | Hook timeout (5000ms) | 4 | No timeout violations |
| EDGE-05~08 | Large context handling | 4 | PreCompact preserves PDCA state |
| EDGE-09~12 | Error recovery | 4 | Invalid JSON input, missing files |
| EDGE-13~16 | Concurrent access | 4 | Memory store read/write safety |
| EDGE-17~20 | Language compliance | 4 | English code comments, 8-lang triggers |

### 3.13 TC-REG: Regression Tests (15 TC)

| ID | Area | TC Count | Source |
|----|------|:--------:|--------|
| REG-01~03 | v1.5.4 SKIP items | 3 | Runtime-only TCs re-check |
| REG-04~06 | common.js 180 exports | 3 | Bridge integrity |
| REG-07~09 | Hook chain stability | 3 | 10 hooks sequential execution |
| REG-10~12 | Agent model assignment | 3 | 7 opus / 7 sonnet / 2 haiku |
| REG-13~15 | Known issues | 3 | #25131, #24044, #28379 status |

---

## 4. Test Execution Strategy

### 4.1 Execution Order

```
Phase 1: Static Verification (P0)
    ├── TC-V156 (55 TC) — v1.5.6 changes
    ├── TC-CONFIG (25 TC) — configs and templates
    └── TC-SKILL (90 TC) — skill frontmatter and content
    Total: 170 TC

Phase 2: Unit Tests (P0)
    ├── TC-UNIT (200 TC) — all script functions
    └── TC-AGENT (80 TC) — agent frontmatter and setup
    Total: 280 TC

Phase 3: Integration Tests (P0)
    ├── TC-HOOK (65 TC) — hook chain validation
    └── TC-PDCA (40 TC) — PDCA workflow
    Total: 105 TC

Phase 4: E2E & UX Tests (P1)
    ├── TC-E2E (60 TC) — end-to-end workflows
    ├── TC-UX (50 TC) — user experience
    └── TC-TEAM (30 TC) — CTO Team orchestration
    Total: 140 TC

Phase 5: Extended Tests (P2)
    ├── TC-LANG (24 TC) — multi-language
    ├── TC-EDGE (20 TC) — edge cases
    └── TC-REG (15 TC) — regression
    Total: 59 TC
```

### 4.2 Test Methods

| Method | Description | TC Coverage |
|--------|-------------|:-----------:|
| **Grep** | Content verification via pattern matching | ~350 TC |
| **Node Require** | Module loading, export counting, function existence | ~150 TC |
| **JSON Parse** | Configuration and output structure validation | ~80 TC |
| **Logic Trace** | Code path analysis, conditional coverage | ~100 TC |
| **File System** | File existence, directory structure | ~40 TC |
| **Workflow Simulation** | PDCA cycle, user journeys | ~50 TC |

### 4.3 Parallelization Strategy

| Agent | TC Assignment | Model |
|-------|--------------|:-----:|
| qa-v156 | TC-V156 (55) + TC-CONFIG (25) | sonnet |
| qa-unit | TC-UNIT (200) | opus |
| qa-integration | TC-HOOK (65) + TC-PDCA (40) + TC-AGENT (80) | opus |
| qa-e2e | TC-E2E (60) + TC-UX (50) + TC-TEAM (30) | sonnet |
| qa-extended | TC-LANG (24) + TC-EDGE (20) + TC-REG (15) + TC-SKILL (90) | sonnet |

---

## 5. Success Criteria

### 5.1 Pass Criteria

| Metric | Target | Minimum |
|--------|:------:|:-------:|
| Overall Pass Rate | 100% | 99% |
| P0 Pass Rate | 100% | 100% |
| P1 Pass Rate | 100% | 95% |
| FAIL count | 0 | ≤ 3 |
| v1.5.6 TC Pass Rate | 100% | 100% |

### 5.2 Definition of Done

- [ ] All 769 TC executed
- [ ] 0 FAIL in P0 category
- [ ] All v1.5.6 changes (55 TC) verified
- [ ] All 27 skills verified
- [ ] All 16 agents verified
- [ ] All 10 hooks verified
- [ ] E2E workflows pass
- [ ] UX scenarios validated
- [ ] Language compliance confirmed (English code, 8-lang triggers)
- [ ] Regression items re-verified

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Runtime-only TCs require live Claude Code | Medium | High | Mark as SKIP with clear rationale |
| Agent Teams env var not set | Low | Medium | Check CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS before team tests |
| bkend MCP server unavailable | Low | Medium | Skip bkend MCP live tests, verify content only |
| Hook timeout during test | Low | Low | Static analysis preferred over runtime |
| Large TC count (769) requires multiple agents | Medium | Low | 5-agent parallel execution strategy |

---

## 7. Test Environment

### 7.1 Prerequisites

```bash
# Required
- Claude Code v2.1.59
- Node.js v18+
- bkit plugin installed (claude --plugin-dir .)
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Branch
git checkout feature/bkit-v1.5.6-cc-v2159-update

# Verify plugin
node -e "console.log(require('./.claude-plugin/plugin.json').version)"
# Expected: 1.5.6
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

---

## 8. Previous Test Progression

| Version | TC | PASS | FAIL | SKIP | Rate |
|:-------:|:--:|:----:|:----:|:----:|:----:|
| v1.5.0 | 101 | 100 | 0 | 1 | 100% |
| v1.5.1 | 673 | 603 | 3→0 | 67 | 99.5→100% |
| v1.5.2 | 673 | 603 | 3→0 | 67 | 99.5→100% |
| v1.5.3 | 688 | 646 | 0 | 39 | 100% |
| v1.5.4 | 708 | 705 | 0 | 3 | 100% |
| **v1.5.6** | **769** | **TBD** | **TBD** | **TBD** | **TBD** |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-27 | Initial draft — CTO Team analysis | CTO Lead (cto-lead, opus) |
