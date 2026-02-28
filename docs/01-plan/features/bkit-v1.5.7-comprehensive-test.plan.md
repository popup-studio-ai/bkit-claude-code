# bkit v1.5.7 Comprehensive Test Plan

> **Summary**: bkit v1.5.7 comprehensive test — Unit, Integration, E2E, UX, Security, and Regression tests covering all features and v1.5.7 changes (ENH-52~55, English conversion, 13 memory leak fixes)
>
> **Project**: bkit-claude-code
> **Version**: 1.5.7
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager, gap-detector, security-architect)
> **Date**: 2026-02-28
> **Status**: Draft
> **Previous Test**: v1.5.6 (754 TC, 748 PASS, 0 FAIL, 6 SKIP, 100%)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, Claude Code v2.1.63
> **Branch**: feature/bkit-v1.5.7-cc-v2163-enhancement

---

## 1. Background

### 1.1 Test Necessity

bkit v1.5.7 integrates Claude Code v2.1.63 features (/simplify, /batch, HTTP hooks) into the PDCA workflow with 11 FRs across 12 files. Additionally, 3 hook stop scripts underwent full Korean→English conversion (~150 lines). This test plan covers:

1. **v1.5.7 new changes** (ENH-52~55: /simplify PDCA integration, /batch multi-feature, HTTP hooks awareness, CC command triggers)
2. **English conversion verification** (3 hook stop scripts: gap-detector-stop.js, iterator-stop.js, code-review-stop.js)
3. **Full bkit feature inventory** (27 skills, 16 agents, 10 hooks, 45 scripts, 180 common.js exports)
4. **Unit tests** for all testable functions and library modules
5. **E2E tests** for complete user workflows
6. **UX tests** for user experience quality across all user personas
7. **Security and performance** edge case verification

| Change Category | v1.5.7 Delta from v1.5.6 |
|----------------|--------------------------|
| Skills count | 27 (unchanged from v1.5.6) |
| Agents count | 16 (unchanged) |
| Hook events | 10 (unchanged) |
| Scripts | 45 (unchanged, 4 modified) |
| common.js exports | 180 (unchanged) |
| Library modules | 38 (2 modified: automation.js, language.js) |
| Templates | 16 (unchanged) |
| Output Styles | 4 (unchanged, 2 modified) |
| Config files | 2 (version bump) |
| Code changes | 12 files modified, +595/-167 lines |
| Key additions | CC_COMMAND_PATTERNS, generateBatchTrigger(), shouldSuggestBatch() |

### 1.2 Previous Test Results (v1.5.6)

| Metric | Value |
|--------|:-----:|
| Total TC | 754 |
| Executed | 754 |
| PASS | 748 |
| FAIL | 0 |
| SKIP | 6 (runtime-only, environment-dependent) |
| Pass Rate (excl. SKIP) | 100.0% |

### 1.3 v1.5.7 Component Inventory

| Component | Count | Location | Delta from v1.5.6 |
|-----------|:-----:|----------|:------------------:|
| Skills | 27 (22 core + 5 bkend) | `skills/*/SKILL.md` | 0 |
| Agents | 16 | `agents/*.md` | 0 |
| Hook Events | 10 | `hooks/hooks.json` | 0 |
| Scripts | 45 | `scripts/*.js` | 0 (4 modified) |
| Library Exports (common.js) | 180 | `lib/` → `lib/common.js` | 0 (2 lib files modified) |
| Templates | 16 | `templates/` | 0 |
| Output Styles | 4 | `output-styles/` | 0 (2 modified) |
| Config Files | 2 | `plugin.json`, `bkit.config.json` | 0 (2 version bumps) |
| Guides | 2 | `docs/guides/` | 0 (unchanged from v1.5.6) |

### 1.4 v1.5.7 Changed Files (12 files, +595/-167 lines)

| # | File | Change Type | Phase | Lines Changed |
|---|------|:-----------:|:-----:|:------------:|
| 1 | `scripts/gap-detector-stop.js` | Modified | 1 | +55/-58 (English conversion + /simplify option) |
| 2 | `scripts/iterator-stop.js` | Modified | 1 | +52/-53 (English conversion + /simplify option) |
| 3 | `scripts/code-review-stop.js` | Modified | 1 | +20/-15 (English conversion + /simplify action) |
| 4 | `hooks/session-start.js` | Modified | 1,2,3 | +50/-8 (Core Rules + CC table + batch + version) |
| 5 | `lib/intent/language.js` | Modified | 1,2 | +25/-0 (CC_COMMAND_PATTERNS 8 languages) |
| 6 | `lib/task/classification.js` | Modified | 1 | +2/-2 (feature/major /simplify guide) |
| 7 | `lib/pdca/automation.js` | Modified | 2 | +44/-0 (generateBatchTrigger, shouldSuggestBatch) |
| 8 | `scripts/user-prompt-handler.js` | Modified | 2 | +19/-0 (CC command detection block) |
| 9 | `output-styles/bkit-learning.md` | Modified | 3 | +5/-0 (/simplify learning point) |
| 10 | `output-styles/bkit-pdca-guide.md` | Modified | 3 | +9/-0 (/batch progress + /simplify guidance) |
| 11 | `.claude-plugin/plugin.json` | Modified | Common | +1/-1 (version 1.5.7) |
| 12 | `bkit.config.json` | Modified | Common | +1/-1 (version 1.5.7) |

### 1.5 v1.5.7 FR Summary (11 FRs)

| FR | Description | File(s) | Priority |
|----|-------------|---------|:--------:|
| FR-01 | gap-detector Check ≥90% /simplify option | gap-detector-stop.js | High |
| FR-02 | iterator completion /simplify suggestion | iterator-stop.js | High |
| FR-03 | code-review completion /simplify action | code-review-stop.js | Medium |
| FR-04 | PDCA Core Rules /simplify awareness | session-start.js | High |
| FR-05 | CC_COMMAND_PATTERNS 8-language triggers | language.js | Medium |
| FR-06 | automation.js batch functions | automation.js | Medium |
| FR-07 | classification.js /simplify guide | classification.js | Low |
| FR-08 | user-prompt-handler.js intent detection | user-prompt-handler.js | Medium |
| FR-09 | session-start.js HTTP hooks + batch guidance | session-start.js | Low |
| FR-10 | output-styles update | bkit-learning.md, bkit-pdca-guide.md | Low |
| FR-11 | v1.5.7 version sync | plugin.json, bkit.config.json, session-start.js | High |

### 1.6 CTO Team Composition

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
| G-01 | v1.5.7 New Changes Test | 11 FRs + English conversion: /simplify, /batch, CC_COMMAND_PATTERNS, version | 80 |
| G-02 | Script Unit Test | 45 scripts, exported functions, logic paths | 200 |
| G-03 | Hook Integration Test | 10 hook events, chain validation, state propagation | 65 |
| G-04 | Agent Functional Test | 16 agents: trigger, tools, model, memory | 80 |
| G-05 | Skill Functional Test | 27 skills: load, trigger, content, imports | 90 |
| G-06 | PDCA Workflow Test | Plan-Design-Do-Check-Act-Report-Archive-Cleanup | 40 |

### 2.2 Should (P1)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-07 | E2E Workflow Test | 6 complete user workflows across components | 60 |
| G-08 | UX Experience Test | 6 user journeys (Beginner/Dev/QA/Team/v1.5.7/Multilingual) | 60 |
| G-09 | Config & Template Test | bkit.config.json, 16 templates, output-styles | 25 |
| G-10 | CTO Team Orchestration Test | Team composition, patterns, delegation, cleanup | 30 |

### 2.3 Could (P2)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-11 | Multi-Language Test | 8-language triggers + CC_COMMAND_PATTERNS + ambiguity detection | 32 |
| G-12 | Edge Case & Performance | Hook timeout, caching, error handling, memory leaks | 24 |
| G-13 | Security Test | Input validation, command injection, data integrity | 16 |
| G-14 | Regression Test | v1.5.6 baseline + known issues re-check | 18 |

### 2.4 TC Summary

| Priority | TC Count | Ratio |
|:--------:|:--------:|:-----:|
| P0 (Must) | 555 | 64.5% |
| P1 (Should) | 175 | 20.3% |
| P2 (Could) | 90 | 10.5% |
| Regression | 18 | 2.1% |
| Buffer (new discovery) | 22 | 2.6% |
| **Grand Total** | **860** | **100%** |

---

## 3. Test Categories

### 3.1 TC-V157: v1.5.7 New Changes (80 TC)

#### TC-V157-FR01: gap-detector-stop.js /simplify Option (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-01 | AskUserQuestion ≥threshold has 4 options (not 3) | gap-detector-stop.js | Count options array | P0 |
| V157-02 | Option 2 label is '/simplify code cleanup' | gap-detector-stop.js:143 | Grep exact label | P0 |
| V157-03 | Option 2 description is 'Improve code quality then generate report' | gap-detector-stop.js:143 | Grep exact text | P0 |
| V157-04 | systemMessage includes '/simplify code cleanup' action | gap-detector-stop.js | Grep systemMessage | P0 |
| V157-05 | All guidance blocks in English (no Korean except regex patterns) | gap-detector-stop.js | Grep Hangul absence in guidance | P0 |
| V157-06 | All AskUserQuestion labels in English | gap-detector-stop.js | Grep Hangul absence in options | P0 |
| V157-07 | ≥70% block guidance in English | gap-detector-stop.js | Grep 'Auto-improve' | P0 |
| V157-08 | <70% block guidance in English | gap-detector-stop.js | Grep 'Significant design-implementation gap' | P0 |
| V157-09 | Max iterations block guidance in English | gap-detector-stop.js | Grep 'Maximum iterations' | P0 |
| V157-10 | Regex patterns still contain Korean keywords (매치율, 일치율) | gap-detector-stop.js | Grep Korean in regex only | P0 |

#### TC-V157-FR02: iterator-stop.js /simplify Option (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-11 | Completed block AskUserQuestion has 4 options | iterator-stop.js | Count options array | P0 |
| V157-12 | Option 2 label is '/simplify code cleanup' | iterator-stop.js:121 | Grep exact label | P0 |
| V157-13 | Option 2 description is 'Improve code quality then generate report' | iterator-stop.js:121 | Grep exact text | P0 |
| V157-14 | systemMessage includes '/simplify code cleanup' action | iterator-stop.js | Grep systemMessage | P0 |
| V157-15 | All guidance blocks in English | iterator-stop.js | Grep Hangul absence in guidance | P0 |
| V157-16 | All AskUserQuestion labels in English | iterator-stop.js | Grep Hangul absence in options | P0 |
| V157-17 | Improved block guidance in English | iterator-stop.js | Grep 'Improvement complete' | P0 |
| V157-18 | Max iterations block guidance in English | iterator-stop.js | Grep 'Maximum iterations reached' | P0 |
| V157-19 | Default block guidance in English | iterator-stop.js | Grep 'Modifications complete' | P0 |
| V157-20 | Regex patterns still contain Korean keywords (완료, 성공, 개선, 수정) | iterator-stop.js | Grep Korean in regex only | P0 |

#### TC-V157-FR03: code-review-stop.js /simplify Action (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-21 | JSDoc `@version 1.5.7` | code-review-stop.js:7 | Grep exact version | P0 |
| V157-22 | JSDoc description in English | code-review-stop.js:3 | Grep 'Post code review next step guidance' | P0 |
| V157-23 | do phase: '/simplify for automatic code quality improvement' present | code-review-stop.js | Grep exact text | P0 |
| V157-24 | check phase: ≥90% listed first, <90% second | code-review-stop.js | Line order validation | P0 |
| V157-25 | check phase: '/simplify code cleanup then /pdca report' | code-review-stop.js | Grep exact text | P0 |
| V157-26 | check phase: '/pdca iterate' for <90% | code-review-stop.js | Grep text | P0 |
| V157-27 | else block: English guidance text | code-review-stop.js | Grep 'Code review has been completed' | P0 |
| V157-28 | No Korean text in any suggestion block | code-review-stop.js | Grep Hangul absence | P0 |
| V157-29 | All 3 suggestion blocks have header/footer separators | code-review-stop.js | Count '─────' occurrences | P0 |
| V157-30 | Suggestion blocks reference correct PDCA commands | code-review-stop.js | Grep /pdca commands | P0 |

#### TC-V157-FR04: PDCA Core Rules /simplify Awareness (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-31 | Core Rules contains 'Suggest /simplify for code cleanup' | session-start.js | Grep exact text | P0 |
| V157-32 | Core Rules contains 'After /simplify → Completion report' | session-start.js | Grep exact text | P0 |
| V157-33 | /simplify rule positioned after 'Gap Analysis >= 90%' rule | session-start.js | Line order | P0 |
| V157-34 | Core Rules section has 5 rules total (was 4 in v1.5.6) | session-start.js | Count rules | P0 |
| V157-35 | Core Rules section in PDCA Core Rules block | session-start.js | Grep section header | P0 |

#### TC-V157-FR05: CC_COMMAND_PATTERNS 8-Language (10 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-36 | CC_COMMAND_PATTERNS constant defined | language.js | Grep constant name | P0 |
| V157-37 | 'simplify' key exists with 8-language array | language.js | Grep 'simplify:' | P0 |
| V157-38 | simplify array contains '간소화' (Korean) | language.js | Grep Korean trigger | P0 |
| V157-39 | simplify array contains '簡素化' (Japanese) | language.js | Grep Japanese trigger | P0 |
| V157-40 | simplify array contains '简化' (Chinese) | language.js | Grep Chinese trigger | P0 |
| V157-41 | 'batch' key exists with 8-language array | language.js | Grep 'batch:' | P0 |
| V157-42 | batch array contains '일괄' (Korean) | language.js | Grep Korean trigger | P0 |
| V157-43 | CC_COMMAND_PATTERNS exported in module.exports | language.js | Grep module.exports | P0 |
| V157-44 | matchMultiLangPattern function works with CC_COMMAND_PATTERNS | language.js | Logic trace | P0 |
| V157-45 | 8 languages covered: EN, KO, JA, ZH, ES, FR, DE, IT | language.js | Count unique languages | P0 |

#### TC-V157-FR06: automation.js Batch Functions (8 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-46 | generateBatchTrigger() function defined | automation.js | Grep function name | P0 |
| V157-47 | shouldSuggestBatch() function defined | automation.js | Grep function name | P0 |
| V157-48 | generateBatchTrigger returns object with batchCommand | automation.js | Logic trace | P0 |
| V157-49 | shouldSuggestBatch returns boolean | automation.js | Logic trace | P0 |
| V157-50 | Both functions exported in module.exports | automation.js | Grep exports | P0 |
| V157-51 | generateBatchTrigger handles empty features array | automation.js | Edge case | P0 |
| V157-52 | shouldSuggestBatch checks Enterprise level | automation.js | Logic trace | P0 |
| V157-53 | Functions accessible via common.js bridge | common.js | Require check | P0 |

#### TC-V157-FR07: classification.js /simplify Guide (4 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-54 | feature guidance: 'After implementation, use /simplify for code quality.' | classification.js:73 | Grep exact text | P0 |
| V157-55 | major guidance: 'Use /simplify after Check phase for code cleanup.' | classification.js:74 | Grep exact text | P0 |
| V157-56 | trivial guidance unchanged | classification.js:71 | Grep 'Trivial change' | P0 |
| V157-57 | minor guidance unchanged | classification.js:72 | Grep 'Minor change' | P0 |

#### TC-V157-FR08: user-prompt-handler.js CC Command Detection (6 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-58 | CC_COMMAND_PATTERNS imported from language.js | user-prompt-handler.js | Grep import | P0 |
| V157-59 | simplify intent detection block exists | user-prompt-handler.js | Grep 'simplify' matching | P0 |
| V157-60 | batch intent detection block exists | user-prompt-handler.js | Grep 'batch' matching | P0 |
| V157-61 | matchMultiLangPattern used for CC commands | user-prompt-handler.js | Grep function call | P0 |
| V157-62 | CC command detection positioned after existing intent blocks | user-prompt-handler.js | Line order | P0 |
| V157-63 | Detection does not break existing intent flow | user-prompt-handler.js | Logic trace | P0 |

#### TC-V157-FR09: session-start.js HTTP Hooks + Batch (7 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-64 | CC Built-in Command Integration table exists | session-start.js | Grep 'CC Built-in Command' | P0 |
| V157-65 | /simplify entry in CC Commands table | session-start.js | Grep '/simplify' in table | P0 |
| V157-66 | /batch entry in CC Commands table | session-start.js | Grep '/batch' in table | P0 |
| V157-67 | Enterprise batch guidance block present | session-start.js | Grep 'batch' | P0 |
| V157-68 | v1.5.7 Enhancements section present | session-start.js | Grep 'v1.5.7 Enhancements' | P0 |
| V157-69 | HTTP hooks mention in Enhancements | session-start.js | Grep 'HTTP hooks' | P0 |
| V157-70 | 13 memory leak fixes mentioned | session-start.js | Grep 'memory leak' | P0 |

#### TC-V157-FR10: Output Styles Update (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-71 | bkit-learning.md has /simplify learning point | bkit-learning.md | Grep '/simplify' | P0 |
| V157-72 | /simplify learning point is in English | bkit-learning.md | Grep English text | P0 |
| V157-73 | bkit-pdca-guide.md has /batch progress section | bkit-pdca-guide.md | Grep '/batch' | P0 |
| V157-74 | bkit-pdca-guide.md has /simplify guidance | bkit-pdca-guide.md | Grep '/simplify' | P0 |
| V157-75 | Output styles maintain valid YAML frontmatter | both files | YAML parse | P0 |

#### TC-V157-FR11: Version Sync (5 TC)

| ID | Test Case | File | Verification | Priority |
|----|-----------|------|-------------|:--------:|
| V157-76 | plugin.json version = "1.5.7" | plugin.json:3 | Grep version | P0 |
| V157-77 | bkit.config.json version = "1.5.7" | bkit.config.json:3 | Grep version | P0 |
| V157-78 | session-start.js JSDoc version contains 1.5.7 | session-start.js:3 | Grep version | P0 |
| V157-79 | session-start.js additionalContext header v1.5.7 | session-start.js | Grep 'v1.5.7' | P0 |
| V157-80 | All v1.5.7 version strings consistent across files | 4 files | Cross-check | P0 |

### 3.2 TC-UNIT: Script Unit Tests (200 TC)

#### TC-UNIT-SS: session-start.js Functions (35 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-SS-01~05 | detectLevel() | 5 | Starter/Dynamic/Enterprise detection, edge cases |
| UNIT-SS-06~10 | enhancedOnboarding() | 5 | Previous work detection, action suggestion |
| UNIT-SS-11~15 | detectPdcaPhase() | 5 | Each PDCA phase detection |
| UNIT-SS-16~20 | bkend MCP detection | 5 | Dynamic/Enterprise MCP check |
| UNIT-SS-21~25 | additionalContext assembly | 5 | Memory Systems, Output Styles, Feature Report, CC Commands |
| UNIT-SS-26~30 | Trigger tables | 5 | Agent/Skill/CC command trigger output |
| UNIT-SS-31~35 | JSON output structure | 5 | hookEventName, systemMessage, additionalContext |

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
| UNIT-GDS-11~15 | Guidance generation | 5 | 4 branches (≥threshold, max, 70-89%, <70%) |
| UNIT-GDS-16~20 | JSON output structure | 5 | analysisResult, autoCreatedTasks, autoTrigger |

#### TC-UNIT-ITS: iterator-stop.js Functions (20 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-ITS-01~05 | Status detection | 5 | completed, max_iterations, improved, unknown |
| UNIT-ITS-06~10 | Iteration tracking | 5 | currentIteration, maxIterations, matchRate |
| UNIT-ITS-11~15 | Guidance generation | 5 | 4 status-based blocks |
| UNIT-ITS-16~20 | Auto-task creation | 5 | autoCreatePdcaTask for act, report |

#### TC-UNIT-CRS: code-review-stop.js Functions (10 TC)

| ID | Area | TC Count | Key Functions |
|----|------|:--------:|---------------|
| UNIT-CRS-01~05 | Phase detection | 5 | do, check, else branches |
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
| UNIT-UPH-11~15 | CC command detection (NEW) | 5 | simplify/batch intent, CC_COMMAND_PATTERNS |

#### TC-UNIT-LIB: Library Functions (55 TC)

| ID | Module | TC Count | Key Exports |
|----|--------|:--------:|-------------|
| UNIT-LIB-01~08 | lib/core/ | 8 | debugLog, outputAllow, readStdinSync |
| UNIT-LIB-09~18 | lib/pdca/ | 10 | getPdcaStatusFull, updatePdcaStatus, addPdcaHistory |
| UNIT-LIB-19~24 | lib/intent/ | 6 | detectIntent, classifyLevel, scoreConfidence |
| UNIT-LIB-25~28 | lib/intent/language.js (NEW) | 4 | CC_COMMAND_PATTERNS, matchMultiLangPattern |
| UNIT-LIB-29~34 | lib/task/ | 6 | createTask, updateTask, addBlockedBy, classification |
| UNIT-LIB-35~40 | lib/team/ | 6 | isTeamModeAvailable, generateTeamStrategy, formatTeamStatus |
| UNIT-LIB-41~44 | lib/skill-orchestrator.js | 4 | orchestrateSkillPost, getSkillConfig |
| UNIT-LIB-45~50 | lib/pdca/automation.js (NEW) | 6 | generateBatchTrigger, shouldSuggestBatch |
| UNIT-LIB-51~55 | lib/common.js bridge | 5 | 180 exports integrity, new function bridge |

### 3.3 TC-HOOK: Hook Integration Tests (65 TC)

| ID | Hook Event | TC Count | Verification |
|----|-----------|:--------:|-------------|
| HOOK-01~08 | SessionStart | 8 | JSON output, additionalContext, systemMessage, CC Commands table |
| HOOK-09~14 | PreToolUse(Write\|Edit) | 6 | Convention check, PDCA tracking |
| HOOK-15~20 | PreToolUse(Bash) | 6 | Command detection, security |
| HOOK-21~26 | PostToolUse(Write) | 6 | File tracking, state update |
| HOOK-27~32 | PostToolUse(Bash) | 6 | Result parsing, state |
| HOOK-33~38 | PostToolUse(Skill) | 6 | Skill post-execution, copyHint |
| HOOK-39~44 | Stop | 6 | Handler dispatch, /copy tip, cleanup |
| HOOK-45~50 | UserPromptSubmit | 6 | Intent detection, CC command trigger |
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
| PDCA-19~24 | Check Phase | 6 | gap analysis, match rate, /simplify option (NEW) |
| PDCA-25~28 | Act Phase | 4 | iteration, re-check, max iterations, /simplify suggestion (NEW) |
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
| E2E-31~40 | PDCA Full Cycle | 10 | plan → design → do → check → /simplify → report → archive |
| E2E-41~50 | CTO Team PDCA | 10 | /pdca team → parallel agents → quality gates → cleanup |
| E2E-51~60 | /simplify Integration Flow | 10 | code-review → gap-check → /simplify → report (NEW) |

### 3.8 TC-UX: User Experience Tests (60 TC)

| ID | Journey | TC Count | Description |
|----|---------|:--------:|-------------|
| UX-01~10 | First-Time User | 10 | Plugin install, SessionStart output, level detection, help |
| UX-11~20 | Developer Workflow | 10 | Natural language triggers, skill auto-detection, PDCA flow |
| UX-21~30 | QA Engineer | 10 | /code-review, /zero-script-qa, gap analysis, iteration |
| UX-31~40 | Team Lead | 10 | /pdca team, CTO orchestration, teammate monitoring |
| UX-41~50 | v1.5.7 UX | 10 | /simplify in AskUserQuestion, CC Commands, /batch, English output |
| UX-51~60 | Multilingual UX | 10 | 8-language trigger discovery, CC_COMMAND_PATTERNS, ambiguity |

#### TC-UX-V157: v1.5.7 Specific UX (detailed)

| ID | Scenario | Steps | Expected | Priority |
|----|----------|-------|----------|:--------:|
| UX-41 | /simplify option after Check ≥90% | Complete gap analysis with 95% | '/simplify code cleanup' in AskUserQuestion | P1 |
| UX-42 | /simplify option after iteration complete | Complete pdca-iterator with success | '/simplify code cleanup' in options | P1 |
| UX-43 | /simplify action in code review (do phase) | Complete code review during do phase | '/simplify for automatic code quality improvement' shown | P1 |
| UX-44 | /simplify action in code review (check phase) | Complete code review during check phase | '/simplify code cleanup then /pdca report' shown first | P1 |
| UX-45 | CC Commands table visible | Start new session | 'CC Built-in Command Integration' in output | P1 |
| UX-46 | /batch guidance for Enterprise | Start Enterprise session | /batch workflow guidance shown | P1 |
| UX-47 | v1.5.7 Enhancements section visible | Start new session | 'v1.5.7 Enhancements' in output | P1 |
| UX-48 | English output in gap-detector-stop | Trigger gap-detector stop | All guidance text in English | P1 |
| UX-49 | English output in iterator-stop | Trigger iterator stop | All guidance text in English | P1 |
| UX-50 | English output in code-review-stop | Trigger code-review stop | All suggestion text in English | P1 |

### 3.9 TC-CONFIG: Config & Template Tests (25 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| CONFIG-01~05 | bkit.config.json | 5 | Schema, version 1.5.7, team, defaults |
| CONFIG-06~10 | plugin.json | 5 | Name, version 1.5.7, outputStyles, keywords |
| CONFIG-11~15 | hooks.json | 5 | 10 entries, paths, timeouts |
| CONFIG-16~20 | Templates | 5 | 16 templates exist, structure valid |
| CONFIG-21~25 | Output Styles | 5 | 4 styles exist, YAML frontmatter, /simplify content |

### 3.10 TC-TEAM: CTO Team Orchestration Tests (30 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| TEAM-01~05 | Team availability | 5 | isTeamModeAvailable, env var check |
| TEAM-06~10 | Team composition | 5 | Dynamic (3), Enterprise (5), Starter (blocked) |
| TEAM-11~15 | Orchestration patterns | 5 | leader, swarm, council, watchdog |
| TEAM-16~20 | Task delegation | 5 | assignNextTeammateWork, task queue |
| TEAM-21~25 | Team status | 5 | formatTeamStatus, teammate progress |
| TEAM-26~30 | Team cleanup | 5 | Stop teammates, session end, memory clear |

### 3.11 TC-LANG: Multi-Language Tests (32 TC)

| ID | Language | TC Count | Trigger Keywords |
|----|----------|:--------:|-----------------|
| LANG-01~04 | Korean | 4 | 검증, 개선, 분석, 간소화(NEW) |
| LANG-05~08 | Japanese | 4 | 確認, 改善, 分析, 簡素化(NEW) |
| LANG-09~12 | Chinese | 4 | 验证, 改进, 分析, 简化(NEW) |
| LANG-13~16 | Spanish | 4 | verificar, mejorar, analizar, simplificar(NEW) |
| LANG-17~20 | French | 4 | vérifier, améliorer, analyser, simplifier(NEW) |
| LANG-21~24 | German | 4 | prüfen, verbessern, analysieren, vereinfachen(NEW) |
| LANG-25~28 | Italian | 4 | verificare, migliorare, analizzare, semplificare(NEW) |
| LANG-29~32 | English | 4 | verify, improve, analyze, simplify(NEW) |

### 3.12 TC-EDGE: Edge Case & Performance Tests (24 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| EDGE-01~04 | Hook timeout (5000ms) | 4 | No timeout violations in modified scripts |
| EDGE-05~08 | Large context handling | 4 | PreCompact preserves PDCA state, /simplify context |
| EDGE-09~12 | Error recovery | 4 | Invalid JSON input, missing files, null feature |
| EDGE-13~16 | Concurrent access | 4 | Memory store read/write safety, batch operations |
| EDGE-17~20 | Language compliance | 4 | English code, 8-lang triggers, regex-only Korean |
| EDGE-21~24 | Memory stability | 4 | 13 memory leak fixes verification, long sessions |

### 3.13 TC-SEC: Security Tests (16 TC)

| ID | Area | TC Count | Verification |
|----|------|:--------:|-------------|
| SEC-01~04 | Input sanitization | 4 | matchRatePattern injection, feature name injection |
| SEC-05~08 | Command injection | 4 | Bash hook security, file path traversal |
| SEC-09~12 | Data integrity | 4 | PDCA status consistency, task state isolation |
| SEC-13~16 | Output safety | 4 | JSON output escaping, XSS in guidance text |

### 3.14 TC-REG: Regression Tests (18 TC)

| ID | Area | TC Count | Source |
|----|------|:--------:|--------|
| REG-01~03 | v1.5.6 SKIP items | 3 | Runtime-only TCs re-check |
| REG-04~06 | common.js 180 exports | 3 | Bridge integrity with new functions |
| REG-07~09 | Hook chain stability | 3 | 10 hooks sequential execution |
| REG-10~12 | Agent model assignment | 3 | 7 opus / 7 sonnet / 2 haiku |
| REG-13~15 | Known issues | 3 | #25131, #24044, #28379, #28552 status |
| REG-16~18 | English compliance | 3 | No new Korean introduced in code (regression from v1.5.7 conversion) |

---

## 4. Test Execution Strategy

### 4.1 Execution Order

```
Phase 1: Static Verification (P0)
    ├── TC-V157 (80 TC) — v1.5.7 changes + English conversion
    ├── TC-CONFIG (25 TC) — configs and templates
    └── TC-SKILL (90 TC) — skill frontmatter and content
    Total: 195 TC

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
    ├── TC-UX (60 TC) — user experience
    └── TC-TEAM (30 TC) — CTO Team orchestration
    Total: 150 TC

Phase 5: Extended Tests (P2)
    ├── TC-LANG (32 TC) — multi-language + CC_COMMAND_PATTERNS
    ├── TC-EDGE (24 TC) — edge cases + memory stability
    ├── TC-SEC (16 TC) — security verification
    └── TC-REG (18 TC) — regression
    Total: 90 TC

Buffer: 22 TC (new discoveries during test execution)
    └── TC-BUF (22 TC) — dynamically created during testing
```

### 4.2 Test Methods

| Method | Description | TC Coverage |
|--------|-------------|:-----------:|
| **Grep** | Content verification via pattern matching | ~350 TC |
| **Node Require** | Module loading, export counting, function existence | ~160 TC |
| **JSON Parse** | Configuration and output structure validation | ~90 TC |
| **Logic Trace** | Code path analysis, conditional coverage | ~120 TC |
| **File System** | File existence, directory structure | ~50 TC |
| **Workflow Simulation** | PDCA cycle, user journeys, /simplify flow | ~60 TC |
| **Regex Validation** | CC_COMMAND_PATTERNS, matchRatePattern | ~30 TC |

### 4.3 Parallelization Strategy

| Agent | TC Assignment | Model | TC Count |
|-------|--------------|:-----:|:--------:|
| qa-v157 | TC-V157 (80) + TC-CONFIG (25) + TC-REG (18) | opus | 123 |
| qa-unit | TC-UNIT (200) | opus | 200 |
| qa-integration | TC-HOOK (65) + TC-PDCA (40) + TC-AGENT (80) | opus | 185 |
| qa-e2e | TC-E2E (60) + TC-UX (60) + TC-TEAM (30) | sonnet | 150 |
| qa-extended | TC-LANG (32) + TC-EDGE (24) + TC-SEC (16) + TC-SKILL (90) | sonnet | 162 |

### 4.4 v1.5.7 Delta Focus Areas

The following areas require **extra attention** compared to v1.5.6 testing:

| Focus Area | Reason | TC IDs |
|-----------|--------|--------|
| English compliance | 3 scripts fully converted KO→EN | V157-05~10, V157-15~20, V157-28, EDGE-17~20, REG-16~18 |
| /simplify integration | New PDCA workflow path | V157-01~04, V157-11~14, V157-21~26, E2E-51~60, UX-41~44 |
| CC_COMMAND_PATTERNS | New 8-language trigger pattern | V157-36~45, UNIT-LIB-25~28, LANG-01~32 |
| automation.js new functions | generateBatchTrigger, shouldSuggestBatch | V157-46~53, UNIT-LIB-45~50 |
| user-prompt-handler CC detection | New intent detection block | V157-58~63, UNIT-UPH-11~15 |

---

## 5. Success Criteria

### 5.1 Pass Criteria

| Metric | Target | Minimum |
|--------|:------:|:-------:|
| Overall Pass Rate | 100% | 99% |
| P0 Pass Rate | 100% | 100% |
| P1 Pass Rate | 100% | 95% |
| FAIL count | 0 | ≤ 3 |
| v1.5.7 TC Pass Rate (80 TC) | 100% | 100% |
| English Compliance | 100% | 100% |

### 5.2 Definition of Done

- [ ] All 860 TC executed (838 core + 22 buffer)
- [ ] 0 FAIL in P0 category (555 TC)
- [ ] All v1.5.7 changes (80 TC) verified
- [ ] All 27 skills verified
- [ ] All 16 agents verified
- [ ] All 10 hooks verified
- [ ] E2E workflows pass including /simplify integration
- [ ] UX scenarios validated for all 6 personas
- [ ] Language compliance confirmed (English code, 8-lang triggers, regex-only Korean)
- [ ] Security tests pass (16 TC)
- [ ] Regression items re-verified (18 TC)
- [ ] No Korean text in code output (except regex pattern keywords)

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Runtime-only TCs require live Claude Code | Medium | High | Mark as SKIP with clear rationale |
| Agent Teams env var not set | Low | Medium | Check CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS before team tests |
| bkend MCP server unavailable | Low | Medium | Skip bkend MCP live tests, verify content only |
| Hook timeout during test | Low | Low | Static analysis preferred over runtime |
| Large TC count (860) requires multiple agents | Medium | Low | 5-agent parallel execution strategy |
| English conversion may have missed some strings | Medium | Low | Comprehensive Hangul Grep across all modified files |
| CC v2.1.63 AskUserQuestion bug (#29547) | High | Medium | Use existing emitUserPrompt pattern (verified working) |
| New CC_COMMAND_PATTERNS may conflict with existing triggers | Low | Low | Verify detection order in user-prompt-handler.js |

---

## 7. Test Environment

### 7.1 Prerequisites

```bash
# Required
- Claude Code v2.1.63
- Node.js v18+
- bkit plugin installed (claude --plugin-dir .)
- CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

# Branch
git checkout feature/bkit-v1.5.7-cc-v2163-enhancement

# Verify plugin
node -e "console.log(require('./.claude-plugin/plugin.json').version)"
# Expected: 1.5.7
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

### 7.3 v1.5.7 Specific Validation Commands

```bash
# Verify English compliance (no Korean in code output, regex patterns excepted)
grep -rn '[가-힣]' scripts/gap-detector-stop.js scripts/iterator-stop.js scripts/code-review-stop.js | grep -v 'Pattern\|pattern\|매치율\|일치율\|완료\|성공\|개선\|수정\|파일\|반복\|최대'

# Verify CC_COMMAND_PATTERNS export
node -e "const l = require('./lib/intent/language.js'); console.log(Object.keys(l.CC_COMMAND_PATTERNS))"
# Expected: ['simplify', 'batch']

# Verify automation.js new functions
node -e "const a = require('./lib/pdca/automation.js'); console.log(typeof a.generateBatchTrigger, typeof a.shouldSuggestBatch)"
# Expected: function function

# Verify common.js bridge
node -e "const c = require('./lib/common.js'); console.log(typeof c.generateBatchTrigger, typeof c.shouldSuggestBatch)"
# Expected: function function

# Verify version sync
grep -n '"1.5.7"' .claude-plugin/plugin.json bkit.config.json
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
| **v1.5.7** | **860** | **TBD** | **TBD** | **TBD** | **TBD** |

### 8.1 TC Growth Analysis

| Version | TC Added | Primary Additions |
|:-------:|:--------:|-------------------|
| v1.5.0→v1.5.1 | +572 | First comprehensive test (agent, hook, skill) |
| v1.5.1→v1.5.3 | +15 | team-visibility, state-writer |
| v1.5.3→v1.5.4 | +20 | bkend MCP accuracy |
| v1.5.4→v1.5.6 | +46 | ENH-48~51 (auto-memory, /copy, guides) |
| v1.5.6→v1.5.7 | **+106** | ENH-52~55, English conversion, CC_COMMAND_PATTERNS, security tests |

---

## 9. Design Document Reference

This test plan requires a companion test design document for detailed TC specifications:

**Test Design**: `docs/02-design/features/bkit-v1.5.7-comprehensive-test.design.md`

The design document will include:
- Detailed TC specifications with verification commands
- Agent task assignment per TC category
- Error scenario matrices
- Exact Grep patterns and expected outputs
- Cross-reference with v1.5.7 design document FRs

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Initial draft — 860 TC, 14 categories, 5 phases | CTO Lead (cto-lead, opus) |
