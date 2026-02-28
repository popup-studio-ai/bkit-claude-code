# bkit v1.5.7 Comprehensive Test Design

> **Summary**: bkit v1.5.7 comprehensive test execution design — 860 TC execution methods, verification criteria, parallelization strategy
>
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.7-comprehensive-test.plan.md
> **Version**: 1.5.7
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager)
> **Date**: 2026-02-28
> **Status**: Draft

---

## 1. Test Architecture

### 1.1 Execution Strategy

All 860 TC are executed in parallel by 5 QA agents. Each agent has an independent TC scope and runs from the same project root directory. v1.5.7 adds 106 TC over v1.5.6 (754 → 860), primarily covering /simplify integration, English conversion, and CC_COMMAND_PATTERNS.

**Test Methods:**
- **Grep**: File content pattern matching (`Grep` tool)
- **Read + Parse**: File reading + structure verification
- **Node Require**: `require()` module loading + export verification
- **Logic Trace**: Code path analysis + conditional coverage
- **File Exists**: File/directory existence check (`Glob` tool)
- **Regex Validation**: CC_COMMAND_PATTERNS, matchRate extraction patterns
- **Workflow Simulation**: PDCA cycle, user journey simulation (SKIP possible)

### 1.2 Test Categories and Methods

| Category | TC Count | Primary Method | Agent |
|----------|:--------:|----------------|:-----:|
| TC-V157 | 80 | Grep + Read + Regex Validation | qa-v157 |
| TC-CONFIG | 25 | JSON Parse + File Exists | qa-v157 |
| TC-REG | 18 | Re-verification + Cross-check | qa-v157 |
| TC-UNIT | 200 | Node Require + Logic Trace | qa-unit |
| TC-HOOK | 65 | Read + Grep + JSON Parse | qa-integration |
| TC-AGENT | 80 | Read + Grep (frontmatter) | qa-integration |
| TC-PDCA | 40 | File Exists + Grep + Logic Trace | qa-integration |
| TC-SKILL | 90 | Read + Grep (frontmatter + content) | qa-extended |
| TC-LANG | 32 | Function Invocation + Regex | qa-extended |
| TC-EDGE | 24 | Edge Case Analysis + Logic | qa-extended |
| TC-SEC | 16 | Security Pattern Analysis | qa-extended |
| TC-E2E | 60 | Workflow Simulation (SKIP possible) | qa-e2e |
| TC-UX | 60 | Content Verification + Simulation | qa-e2e |
| TC-TEAM | 30 | Require + Logic Trace | qa-e2e |

### 1.3 Key Design Decisions

1. **English compliance rule**: All code/scripts must be English except: (a) 8-language regex trigger keywords, (b) docs/ subdirectory documents. v1.5.7 converted ~150 lines of Korean→English in 3 hook stop scripts.
2. **CC_COMMAND_PATTERNS**: New constant in language.js with `simplify` and `batch` keys, each containing 8-language trigger arrays. Used by user-prompt-handler.js for CC built-in command detection.
3. **/simplify integration**: Added as 2nd option (index 1) in AskUserQuestion options for gap-detector-stop.js and iterator-stop.js. Added as text reference in code-review-stop.js suggestions.
4. **automation.js expansion**: Two new exported functions (generateBatchTrigger, shouldSuggestBatch) bridged through common.js.
5. **hooks.json structure**: Unchanged from v1.5.6 — Object keyed by event names, 10 event keys, 13 handler entries. `PreToolUse` has 2 matchers, `PostToolUse` has 3 matchers.
6. **Version strings**: 4 files updated to "1.5.7" (plugin.json, bkit.config.json, session-start.js header, session-start.js context header).

### 1.4 SKIP Categories

| SKIP Reason | Estimated Count | Examples |
|-------------|:--------------:|---------|
| Runtime-only (requires live Claude Code session) | ~30 | E2E workflows, PDCA phase transitions |
| Environment dependency (Agent Teams env var) | ~10 | TEAM-01~30 subset |
| External service (bkend MCP) | ~5 | bkend skill live tests |
| Runtime timeout verification | ~3 | EDGE-01~04 subset |
| **Estimated Total SKIP** | **~48** | |

---

## 2. Reference Tables

### 2.1 Agent Reference (16 agents)

| # | Agent | Model | Mode | Memory Scope | Tools |
|:-:|-------|:-----:|:----:|:------------:|:-----:|
| 1 | cto-lead | opus | acceptEdits | project | Task, Read, Write, Edit, Glob, Grep, Bash, TodoWrite, WebSearch |
| 2 | code-analyzer | opus | plan | project | Read, Glob, Grep, Task, LSP, Write, Edit |
| 3 | design-validator | opus | plan | project | Read, Glob, Grep, Write, Edit |
| 4 | gap-detector | opus | plan | project | Read, Glob, Grep, Task(Explore), Write, Edit |
| 5 | enterprise-expert | opus | acceptEdits | project | Read, Write, Edit, Glob, Grep, Task, WebSearch |
| 6 | infra-architect | opus | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task |
| 7 | security-architect | opus | plan | project | Read, Glob, Grep, Task, WebSearch, Write, Edit |
| 8 | bkend-expert | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, WebFetch |
| 9 | frontend-architect | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task(Explore), WebSearch |
| 10 | pdca-iterator | sonnet | acceptEdits | project | Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, LSP |
| 11 | pipeline-guide | sonnet | plan | user | Read, Glob, Grep, TodoWrite, Write, Edit |
| 12 | product-manager | sonnet | plan | project | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch, TodoWrite |
| 13 | qa-strategist | sonnet | plan | project | Read, Glob, Grep, Task, TodoWrite, Write, Edit |
| 14 | starter-guide | sonnet | acceptEdits | user | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch |
| 15 | report-generator | haiku | acceptEdits | project | Read, Write, Glob, Grep, Edit |
| 16 | qa-monitor | haiku | acceptEdits | project | Bash, Read, Write, Glob, Grep, Task(Explore), Edit |

**Distribution**: 7 opus / 7 sonnet / 2 haiku
**Permission Modes**: 9 acceptEdits / 7 plan
**Memory Scopes**: 14 project / 2 user (starter-guide, pipeline-guide)

### 2.2 Skill Reference (27 skills)

| # | Skill | Category | User-Invocable |
|:-:|-------|----------|:--------------:|
| 1 | pdca | PDCA | true |
| 2 | plan-plus | PDCA | true |
| 3 | starter | Level | true |
| 4 | dynamic | Level | true |
| 5 | enterprise | Level | true |
| 6 | development-pipeline | Pipeline | true |
| 7~15 | phase-1 ~ phase-9 | Phase | false |
| 16 | code-review | Utility | true |
| 17 | zero-script-qa | Utility | true |
| 18 | claude-code-learning | Utility | true |
| 19 | bkit-rules | Utility | false |
| 20 | bkit-templates | Utility | false |
| 21 | mobile-app | Platform | true |
| 22 | desktop-app | Platform | true |
| 23~27 | bkend-* (5) | bkend | false |

**Distribution**: 22 core + 5 bkend | 12 user-invocable / 15 not user-invocable

### 2.3 Hook Registry Reference (10 events, 13 entries)

| # | Event | Matcher | Script | Timeout |
|:-:|-------|---------|--------|:-------:|
| 1 | SessionStart | — | hooks/session-start.js | 5000ms |
| 2 | PreToolUse | `Write\|Edit` | scripts/pre-write.js | 5000ms |
| 3 | PreToolUse | `Bash` | scripts/unified-bash-pre.js | 5000ms |
| 4 | PostToolUse | `Write` | scripts/unified-write-post.js | 5000ms |
| 5 | PostToolUse | `Bash` | scripts/unified-bash-post.js | 5000ms |
| 6 | PostToolUse | `Skill` | scripts/skill-post.js | 5000ms |
| 7 | Stop | — | scripts/unified-stop.js | 10000ms |
| 8 | UserPromptSubmit | — | scripts/user-prompt-handler.js | 3000ms |
| 9 | PreCompact | `auto\|manual` | scripts/context-compaction.js | 5000ms |
| 10 | TaskCompleted | — | scripts/pdca-task-completed.js | 5000ms |
| 11 | SubagentStart | — | scripts/subagent-start-handler.js | 5000ms |
| 12 | SubagentStop | — | scripts/subagent-stop-handler.js | 5000ms |
| 13 | TeammateIdle | — | scripts/team-idle-handler.js | 5000ms |

---

## 3. TC-V157: v1.5.7 New Changes Test Design (80 TC)

### 3.1 TC-V157-FR01: gap-detector-stop.js (10 TC)

#### Verification Anchors

| TC | Content | Grep Pattern | Line |
|----|---------|-------------|:----:|
| V157-01 | 4 options in ≥threshold block | Count `label:` in questions[0].options | ~137-148 |
| V157-02 | /simplify label | `'/simplify code cleanup'` | ~143 |
| V157-03 | /simplify description | `'Improve code quality then generate report'` | ~143 |
| V157-04 | systemMessage /simplify | `/simplify code cleanup` in systemMessage | ~365-372 |
| V157-05 | No Korean in guidance | `[가-힣]` absent in guidance blocks | ~126-234 |
| V157-06 | No Korean in options | `[가-힣]` absent in options arrays | ~137-234 |
| V157-07 | ≥70% English text | `Auto-improve` | ~184 |
| V157-08 | <70% English text | `Significant design-implementation gap` | ~212 |
| V157-09 | Max iterations English | `Maximum iterations` | ~154 |
| V157-10 | Korean in regex only | `매치율\|일치율` in matchRatePattern line only | ~57 |

#### Execution Method

```bash
# V157-01: Count options in ≥threshold block
grep -c "label:" scripts/gap-detector-stop.js  # Should find multiple

# V157-05: Verify no Korean in guidance blocks (excluding regex patterns)
grep -n '[가-힣]' scripts/gap-detector-stop.js | grep -v 'Pattern\|pattern\|매치율\|일치율'
# Expected: 0 matches (empty output)

# V157-10: Korean only in regex pattern line
grep -n '[가-힣]' scripts/gap-detector-stop.js
# Expected: Only line ~57 (matchRatePattern) and ~61-64 (featurePattern comments if any)
```

### 3.2 TC-V157-FR02: iterator-stop.js (10 TC)

#### Verification Anchors

| TC | Content | Grep Pattern | Line |
|----|---------|-------------|:----:|
| V157-11 | 4 options in completed block | Count `label:` in completed options | ~119-127 |
| V157-12 | /simplify label | `'/simplify code cleanup'` | ~121 |
| V157-13 | /simplify description | `'Improve code quality then generate report'` | ~121 |
| V157-14 | systemMessage /simplify | `/simplify code cleanup` in systemMessage | ~338-347 |
| V157-15 | No Korean in guidance | `[가-힣]` absent in guidance blocks | ~96-211 |
| V157-16 | No Korean in options | `[가-힣]` absent in options arrays | ~115-211 |
| V157-17 | Improved block English | `Improvement complete` | ~161 |
| V157-18 | Max iterations English | `Maximum iterations reached` | ~132 |
| V157-19 | Default block English | `Modifications complete` | ~189 |
| V157-20 | Korean in regex only | `완료\|성공\|개선\|수정\|파일\|반복\|최대` in pattern lines | ~82-85 |

#### Korean Compliance Validation

```bash
# Lines that SHOULD contain Korean (regex trigger patterns):
# Line ~66: matchRatePattern with 매치율, 일치율
# Line ~82: completionPattern with 완료, 성공
# Line ~84: improvedPattern with 개선, 수정, 파일
# Line ~85: changesPattern with 파일

# Lines that MUST NOT contain Korean:
# All guidance strings (lines 96~211)
# All AskUserQuestion options (lines 115~211)
# All systemMessage content (lines 338~347)
```

### 3.3 TC-V157-FR03: code-review-stop.js (10 TC)

#### Verification Anchors

| TC | Content | Grep Pattern | Line |
|----|---------|-------------|:----:|
| V157-21 | @version 1.5.7 | `@version 1.5.7` | 7 |
| V157-22 | English JSDoc | `Post code review next step guidance` | 3 |
| V157-23 | do phase /simplify | `/simplify for automatic code quality improvement` | ~42 |
| V157-24 | check phase order | `≥90%.*first.*<90%` (≥90% before <90%) | ~55-57 |
| V157-25 | check ≥90% text | `/simplify code cleanup then /pdca report` | ~56 |
| V157-26 | check <90% text | `/pdca iterate` | ~57 |
| V157-27 | else English | `Code review has been completed` | ~64 |
| V157-28 | No Korean | `[가-힣]` absent in entire file | all |
| V157-29 | 3 separator blocks | Count `─────` ≥ 6 (3 blocks × 2 lines) | all |
| V157-30 | PDCA commands | `/pdca analyze\|/pdca iterate\|/pdca report` | all |

#### Check Phase Order Verification (V157-24)

```javascript
// Design spec requires:
// ≥90% listed FIRST, <90% listed SECOND
//
// Correct:
//   - ≥90%: /simplify code cleanup then /pdca report
//   - <90%: /pdca iterate
//
// Wrong (was the bug before iteration fix):
//   - <90%: /pdca iterate
//   - ≥90%: /simplify code cleanup then /pdca report

// Method: Read file, find check phase block, verify ≥90% line number < <90% line number
```

#### Full English Compliance (V157-28)

```bash
# code-review-stop.js should contain ZERO Korean characters
grep -n '[가-힣]' scripts/code-review-stop.js
# Expected: 0 matches
# Note: Unlike gap-detector-stop.js and iterator-stop.js,
# code-review-stop.js has NO regex patterns that need Korean
```

### 3.4 TC-V157-FR04: PDCA Core Rules (5 TC)

#### Verification Anchors (session-start.js)

| TC | Content | Grep Pattern |
|----|---------|-------------|
| V157-31 | /simplify suggest rule | `Suggest /simplify for code cleanup` |
| V157-32 | /simplify → report rule | `After /simplify.*Completion report` |
| V157-33 | Rule positioning | Line of /simplify rule > line of "Gap Analysis >= 90%" |
| V157-34 | Total rules count | 5 bullet points in Core Rules section |
| V157-35 | Section header | `PDCA Core Rules` |

#### Core Rules Expected Content (5 rules)

```markdown
## PDCA Core Rules (Always Apply)
- New feature request → Check/create Plan/Design documents first
- After implementation → Suggest Gap analysis
- Gap Analysis < 90% → Auto-improvement with pdca-iterator
- Gap Analysis >= 90% → Suggest /simplify for code cleanup, then completion report
- After /simplify → Completion report with report-generator
```

### 3.5 TC-V157-FR05: CC_COMMAND_PATTERNS (10 TC)

#### Verification Anchors (lib/intent/language.js)

| TC | Content | Grep Pattern |
|----|---------|-------------|
| V157-36 | Constant defined | `const CC_COMMAND_PATTERNS` or `CC_COMMAND_PATTERNS =` |
| V157-37 | simplify key | `simplify:` or `'simplify':` |
| V157-38 | Korean trigger | `간소화` |
| V157-39 | Japanese trigger | `簡素化` |
| V157-40 | Chinese trigger | `简化` |
| V157-41 | batch key | `batch:` or `'batch':` |
| V157-42 | Korean batch | `일괄` |
| V157-43 | Export check | `CC_COMMAND_PATTERNS` in module.exports |
| V157-44 | matchMultiLangPattern usage | Logic trace |
| V157-45 | 8 languages covered | Count unique language entries |

#### Expected Structure

```javascript
const CC_COMMAND_PATTERNS = {
  simplify: ['simplify', '간소화', '簡素化', '简化', 'simplificar', 'simplifier', 'vereinfachen', 'semplificare'],
  batch: ['batch', '일괄', 'バッチ', '批量', 'lote', 'lot', 'Stapel', 'lotto']
};
```

#### Module Export Verification

```bash
# Verify CC_COMMAND_PATTERNS accessible via require
node -e "
  const lang = require('./lib/intent/language.js');
  console.log('CC_COMMAND_PATTERNS exists:', !!lang.CC_COMMAND_PATTERNS);
  console.log('simplify keys:', lang.CC_COMMAND_PATTERNS.simplify?.length || 0);
  console.log('batch keys:', lang.CC_COMMAND_PATTERNS.batch?.length || 0);
"
# Expected:
# CC_COMMAND_PATTERNS exists: true
# simplify keys: 8
# batch keys: 8
```

### 3.6 TC-V157-FR06: automation.js Batch Functions (8 TC)

#### Verification Anchors (lib/pdca/automation.js)

| TC | Content | Verification |
|----|---------|-------------|
| V157-46 | generateBatchTrigger defined | `function generateBatchTrigger` |
| V157-47 | shouldSuggestBatch defined | `function shouldSuggestBatch` |
| V157-48 | generateBatchTrigger return type | Returns object with `batchCommand` property |
| V157-49 | shouldSuggestBatch return type | Returns boolean |
| V157-50 | Both exported | Both names in module.exports |
| V157-51 | Empty features edge case | `generateBatchTrigger([])` does not throw |
| V157-52 | Enterprise level check | `shouldSuggestBatch` checks level or feature count |
| V157-53 | common.js bridge | `require('./lib/common.js').generateBatchTrigger` is function |

#### Function Signature Verification

```bash
# Verify function existence and exports
node -e "
  const auto = require('./lib/pdca/automation.js');
  console.log('generateBatchTrigger:', typeof auto.generateBatchTrigger);
  console.log('shouldSuggestBatch:', typeof auto.shouldSuggestBatch);
"
# Expected: function, function

# Verify common.js bridge
node -e "
  const common = require('./lib/common.js');
  console.log('bridge generateBatchTrigger:', typeof common.generateBatchTrigger);
  console.log('bridge shouldSuggestBatch:', typeof common.shouldSuggestBatch);
"
# Expected: function, function
```

### 3.7 TC-V157-FR07: classification.js (4 TC)

#### Verification Anchors

| TC | Line | Expected Text |
|----|:----:|---------------|
| V157-54 | 73 | `'After implementation, use /simplify for code quality.'` |
| V157-55 | 74 | `'Use /simplify after Check phase for code cleanup.'` |
| V157-56 | 71 | `'Trivial change. No PDCA needed.'` (unchanged) |
| V157-57 | 72 | `'Minor change. Consider brief documentation.'` (unchanged) |

#### Exact Text Match

```bash
# These must be EXACT matches (design-implementation alignment from iteration 1 fix)
grep -n "After implementation, use /simplify for code quality" lib/task/classification.js
# Expected: line 73

grep -n "Use /simplify after Check phase for code cleanup" lib/task/classification.js
# Expected: line 74
```

### 3.8 TC-V157-FR08: user-prompt-handler.js CC Detection (6 TC)

#### Verification Anchors

| TC | Content | Grep Pattern |
|----|---------|-------------|
| V157-58 | CC_COMMAND_PATTERNS import | `CC_COMMAND_PATTERNS` in require statement |
| V157-59 | simplify detection | `matchMultiLangPattern.*simplify` or `CC_COMMAND_PATTERNS.simplify` |
| V157-60 | batch detection | `matchMultiLangPattern.*batch` or `CC_COMMAND_PATTERNS.batch` |
| V157-61 | matchMultiLangPattern call | `matchMultiLangPattern(` |
| V157-62 | Position after existing | CC block lines > existing intent block lines |
| V157-63 | No flow break | No `return` or `process.exit` in CC detection block |

### 3.9 TC-V157-FR09: session-start.js Extended (7 TC)

#### Verification Anchors

| TC | Content | Grep Pattern |
|----|---------|-------------|
| V157-64 | CC Commands table | `CC Built-in Command Integration` |
| V157-65 | /simplify in table | `/simplify.*Check.*Report` |
| V157-66 | /batch in table | `/batch.*Enterprise` |
| V157-67 | Enterprise batch | `batch` guidance in Enterprise-only section |
| V157-68 | v1.5.7 Enhancements | `v1.5.7 Enhancements` |
| V157-69 | HTTP hooks mention | `HTTP hooks` |
| V157-70 | Memory leak fixes | `memory leak` |

### 3.10 TC-V157-FR10: Output Styles (5 TC)

#### Verification Anchors

| TC | File | Content |
|----|------|---------|
| V157-71 | bkit-learning.md | `/simplify` text present |
| V157-72 | bkit-learning.md | English text (no Korean in added lines) |
| V157-73 | bkit-pdca-guide.md | `/batch` text present |
| V157-74 | bkit-pdca-guide.md | `/simplify` text present |
| V157-75 | Both files | Valid YAML frontmatter (starts with `---`) |

### 3.11 TC-V157-FR11: Version Sync (5 TC)

#### Version String Map (v1.5.7)

| TC | File | Pattern | Expected |
|----|------|---------|----------|
| V157-76 | plugin.json | `"version": "1.5.7"` | Exact match |
| V157-77 | bkit.config.json | `"version": "1.5.7"` | Exact match |
| V157-78 | session-start.js | `v1.5.7` in JSDoc header | Present |
| V157-79 | session-start.js | `v1.5.7` in additionalContext | Present |
| V157-80 | Cross-file | All 4 files consistent | `1.5.7` in all |

#### Cross-File Verification

```bash
grep -rn '"1.5.7"' .claude-plugin/plugin.json bkit.config.json
grep -n 'v1\.5\.7' hooks/session-start.js | head -5
# Expected: Multiple matches in session-start.js (JSDoc, additionalContext, etc.)
```

---

## 4. TC-UNIT: Script Unit Tests Design (200 TC)

### 4.1 TC-UNIT-SS: session-start.js (35 TC)

#### Functions to Test

| Function | Parameters | Returns | TC |
|----------|------------|---------|:--:|
| `detectLevel()` | none | `string` | 5 |
| `enhancedOnboarding()` | none | `object` | 5 |
| `detectPdcaPhase()` | none | `string` | 5 |
| bkend MCP detection | none | `boolean` | 5 |
| additionalContext assembly | — | markdown | 5 |
| Trigger tables (including CC Commands NEW) | — | markdown | 5 |
| JSON output structure | — | object | 5 |

#### v1.5.7 Specific Assertions

```
UNIT-SS-21: additionalContext contains "## PDCA Core Rules"
UNIT-SS-22: additionalContext contains "Suggest /simplify for code cleanup" (NEW)
UNIT-SS-23: additionalContext contains "CC Built-in Command Integration" (NEW)
UNIT-SS-24: additionalContext contains "/simplify" in CC Commands table (NEW)
UNIT-SS-25: additionalContext contains "/batch" in CC Commands table (NEW)
UNIT-SS-26: additionalContext contains "v1.5.7 Enhancements" (NEW)
UNIT-SS-27: additionalContext contains "HTTP hooks" (NEW)
UNIT-SS-28: additionalContext contains "memory leak" (NEW)
```

### 4.2 TC-UNIT-GDS: gap-detector-stop.js (20 TC)

#### Functions to Test

| Area | TC | Key Logic |
|------|:--:|-----------|
| Match rate extraction | 5 | matchRatePattern regex parsing |
| Feature extraction | 5 | extractFeatureFromContext multi-source |
| Guidance generation | 5 | 4 branches: ≥threshold, max iterations, 70-89%, <70% |
| JSON output | 5 | analysisResult, autoTrigger, userPrompt |

#### v1.5.7 Specific Assertions

```
UNIT-GDS-01: matchRatePattern matches "Overall Match Rate: 85%"
UNIT-GDS-02: matchRatePattern matches "매치율: 92%" (Korean regex trigger)
UNIT-GDS-03: matchRatePattern matches "Match Rate: 100%"
UNIT-GDS-04: ≥threshold guidance starts with "✅ Gap Analysis complete:" (English)
UNIT-GDS-05: ≥threshold options[1].label === '/simplify code cleanup' (NEW)

UNIT-GDS-06: 70-89% guidance starts with "⚠️ Gap Analysis complete:" (English)
UNIT-GDS-07: 70-89% options[0].label contains 'Auto-improve' (English)
UNIT-GDS-08: <70% guidance starts with "🔴 Gap Analysis complete:" (English)
UNIT-GDS-09: max iterations guidance starts with "⚠️ Gap Analysis complete:" (English)
UNIT-GDS-10: All guidance blocks contain English-only text

UNIT-GDS-11: JSON output has decision: 'allow'
UNIT-GDS-12: JSON output has hookEventName: 'Agent:gap-detector:Stop'
UNIT-GDS-13: JSON output has analysisResult.matchRate (number)
UNIT-GDS-14: JSON output has userPrompt (string)
UNIT-GDS-15: JSON output has autoTrigger (object or null)

UNIT-GDS-16: fulfillmentResult calculated when plan exists
UNIT-GDS-17: autoCreatePdcaTask creates Check task
UNIT-GDS-18: autoCreatePdcaTask creates Report task when ≥threshold
UNIT-GDS-19: autoCreatePdcaTask creates Act task when <threshold
UNIT-GDS-20: triggerNextPdcaAction generates autoTrigger
```

### 4.3 TC-UNIT-ITS: iterator-stop.js (20 TC)

#### Status Detection Logic

```javascript
// 4 status branches (priority order):
// 1. completionPattern.test(input) || matchRate >= threshold → 'completed'
// 2. maxIterationPattern.test(input) || currentIteration >= maxIterations → 'max_iterations'
// 3. improvedPattern.test(input) || changedFiles > 0 → 'improved'
// 4. else → 'unknown'
```

#### v1.5.7 Specific Assertions

```
UNIT-ITS-01: completed status guidance starts with "✅ pdca-iterator complete!" (English)
UNIT-ITS-02: completed options[1].label === '/simplify code cleanup' (NEW)
UNIT-ITS-03: max_iterations guidance starts with "⚠️ pdca-iterator:" (English)
UNIT-ITS-04: improved guidance starts with "✅ Improvement complete:" (English)
UNIT-ITS-05: unknown guidance starts with "🔄 pdca-iterator work complete" (English)

UNIT-ITS-06: completionPattern matches "완료" (Korean regex)
UNIT-ITS-07: completionPattern matches "Complete" (English regex)
UNIT-ITS-08: improvedPattern matches "개선" (Korean regex)
UNIT-ITS-09: changesPattern matches "3 files" (English regex)
UNIT-ITS-10: All options labels in English

UNIT-ITS-11~20: JSON output, auto-tasks, status update (same pattern as GDS)
```

### 4.4 TC-UNIT-CRS: code-review-stop.js (10 TC)

#### Phase Detection Logic

```javascript
// 3 branches:
// 1. currentPhase === 'do' → /simplify + gap analysis suggestion
// 2. currentPhase === 'check' → ≥90% /simplify, <90% /pdca iterate
// 3. else → generic completion message
```

#### Assertions

```
UNIT-CRS-01: do phase contains "/simplify for automatic code quality improvement"
UNIT-CRS-02: check phase ≥90% line comes before <90% line
UNIT-CRS-03: check phase ≥90% text is "/simplify code cleanup then /pdca report"
UNIT-CRS-04: else block contains "Code review has been completed"
UNIT-CRS-05: else block contains "Review discovered issues"
UNIT-CRS-06: All 3 blocks have "─────" header/footer
UNIT-CRS-07: @version is "1.5.7"
UNIT-CRS-08: JSDoc description is English
UNIT-CRS-09: Zero Korean characters in file
UNIT-CRS-10: All 3 blocks reference PDCA commands correctly
```

### 4.5 TC-UNIT-UPH: user-prompt-handler.js CC Commands (15 TC)

#### v1.5.7 Addition

```
UNIT-UPH-11: CC_COMMAND_PATTERNS imported from language.js
UNIT-UPH-12: simplify keyword detection using matchMultiLangPattern
UNIT-UPH-13: batch keyword detection using matchMultiLangPattern
UNIT-UPH-14: CC detection block does not break existing flow (no early return)
UNIT-UPH-15: CC detection positioned after existing intent blocks
```

### 4.6 TC-UNIT-LIB: Library Functions (55 TC)

| Module | TC | Key Exports |
|--------|:--:|-------------|
| lib/core/ | 8 | debugLog, outputAllow, readStdinSync |
| lib/pdca/ | 10 | getPdcaStatusFull, updatePdcaStatus, addPdcaHistory |
| lib/intent/ | 6 | detectIntent, classifyLevel, scoreConfidence |
| lib/intent/language.js (NEW) | 4 | CC_COMMAND_PATTERNS, matchMultiLangPattern |
| lib/task/ | 6 | createTask, classification functions |
| lib/team/ | 6 | isTeamModeAvailable, generateTeamStrategy |
| lib/skill-orchestrator.js | 4 | orchestrateSkillPost, getSkillConfig |
| lib/pdca/automation.js (NEW) | 6 | generateBatchTrigger, shouldSuggestBatch |
| lib/common.js bridge | 5 | 180 exports integrity, new function bridge |

#### v1.5.7 Specific Library Tests

```
UNIT-LIB-25: CC_COMMAND_PATTERNS.simplify is array with 8 elements
UNIT-LIB-26: CC_COMMAND_PATTERNS.batch is array with 8 elements
UNIT-LIB-27: matchMultiLangPattern('간소화 해줘', CC_COMMAND_PATTERNS.simplify) returns truthy
UNIT-LIB-28: matchMultiLangPattern('batch 처리', CC_COMMAND_PATTERNS.batch) returns truthy

UNIT-LIB-45: generateBatchTrigger({features:['f1','f2']}) returns object
UNIT-LIB-46: generateBatchTrigger({features:[]}) handles gracefully
UNIT-LIB-47: shouldSuggestBatch({level:'enterprise', features:['f1','f2']}) returns true
UNIT-LIB-48: shouldSuggestBatch({level:'starter', features:['f1']}) returns false
UNIT-LIB-49: shouldSuggestBatch with single feature returns false
UNIT-LIB-50: Both functions accessible via common.js bridge

UNIT-LIB-51: Object.keys(require('lib/common.js')).length === 180
UNIT-LIB-52: common.js.generateBatchTrigger === automation.generateBatchTrigger
UNIT-LIB-53: common.js.shouldSuggestBatch === automation.shouldSuggestBatch
UNIT-LIB-54: common.js.CC_COMMAND_PATTERNS exists (if bridged)
UNIT-LIB-55: No circular dependency in new imports
```

---

## 5. TC-LANG: Multi-Language Tests Design (32 TC)

### 5.1 v1.5.7 Addition: CC_COMMAND_PATTERNS (8 TC extra)

In addition to the 24 existing language trigger tests, v1.5.7 adds 8 TC for CC_COMMAND_PATTERNS:

| Language | simplify Trigger | batch Trigger | TC |
|----------|-----------------|---------------|:--:|
| English | 'simplify' | 'batch' | 2 |
| Korean | '간소화' | '일괄' | 2 |
| Japanese | '簡素化' | 'バッチ' | 2 |
| Chinese | '简化' | '批量' | 2 |
| Spanish | 'simplificar' | 'lote' | 2 (in existing) |
| French | 'simplifier' | 'lot' | 2 (in existing) |
| German | 'vereinfachen' | 'Stapel' | 2 (in existing) |
| Italian | 'semplificare' | 'lotto' | 2 (in existing) |

### 5.2 Trigger Mapping Verification

```
LANG-01: matchMultiLangPattern('검증해줘', agentTriggers.verify) → gap-detector
LANG-02: matchMultiLangPattern('개선해줘', agentTriggers.improve) → pdca-iterator
LANG-03: matchMultiLangPattern('분석해줘', agentTriggers.analyze) → code-analyzer
LANG-04: matchMultiLangPattern('간소화 해줘', CC_COMMAND_PATTERNS.simplify) → truthy (NEW)

LANG-05~08: Same pattern for Japanese (確認, 改善, 分析, 簡素化)
LANG-09~12: Same pattern for Chinese (验证, 改进, 分析, 简化)
...
LANG-29: matchMultiLangPattern('verify this', agentTriggers.verify) → gap-detector
LANG-30: matchMultiLangPattern('improve code', agentTriggers.improve) → pdca-iterator
LANG-31: matchMultiLangPattern('analyze quality', agentTriggers.analyze) → code-analyzer
LANG-32: matchMultiLangPattern('simplify code', CC_COMMAND_PATTERNS.simplify) → truthy (NEW)
```

---

## 6. TC-SEC: Security Tests Design (16 TC)

### 6.1 Input Sanitization (4 TC)

```
SEC-01: matchRatePattern with malicious input "Match Rate: 999999%" → parseInt caps at valid range
SEC-02: feature extraction with path traversal "../../../etc/passwd" → sanitized
SEC-03: inputText with embedded JSON injection → string-escaped
SEC-04: Empty/null input handling → graceful defaults
```

### 6.2 Command Injection (4 TC)

```
SEC-05: Bash pre-hook blocks "rm -rf /" patterns
SEC-06: Bash pre-hook blocks "DROP TABLE" patterns
SEC-07: File path in PDCA status does not allow traversal
SEC-08: Hook output JSON does not execute embedded scripts
```

### 6.3 Data Integrity (4 TC)

```
SEC-09: PDCA status JSON is valid after concurrent writes
SEC-10: Task IDs are unique across features
SEC-11: Match rate stored as integer (no floating point artifacts)
SEC-12: Feature names sanitized (no special characters in file paths)
```

### 6.4 Output Safety (4 TC)

```
SEC-13: Guidance text does not contain raw user input (injection-safe)
SEC-14: JSON output properly escaped (no unescaped quotes in strings)
SEC-15: systemMessage does not contain executable JavaScript
SEC-16: AskUserQuestion options have bounded length (no overflow)
```

---

## 7. TC-EDGE: Edge Case Tests Design (24 TC)

### 7.1 Hook Timeout (4 TC)

```
EDGE-01: gap-detector-stop.js completes in <5000ms (static analysis of sync operations)
EDGE-02: iterator-stop.js completes in <5000ms
EDGE-03: code-review-stop.js completes in <5000ms
EDGE-04: session-start.js completes in <5000ms
```

### 7.2 Memory Stability (4 TC — NEW for v1.5.7)

```
EDGE-21: No unbounded array growth in stop scripts (check for push without cleanup)
EDGE-22: autoCreatedTasks array bounded (max 2-3 per execution)
EDGE-23: debugLog does not accumulate in long sessions
EDGE-24: triggerNextPdcaAction does not create circular references
```

---

## 8. Parallelization Design

### 8.1 Agent Assignment

```
┌──────────────────────────────────────────────────────────────────┐
│                      CTO Lead (Coordinator)                        │
├──────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────┐ │
│  │ qa-v157     │  │ qa-unit     │  │ qa-integration           │ │
│  │ (opus)      │  │ (opus)      │  │ (opus)                   │ │
│  │             │  │             │  │                          │ │
│  │ TC-V157: 80 │  │ TC-UNIT:    │  │ TC-HOOK: 65             │ │
│  │ TC-CONFIG:  │  │ 200         │  │ TC-PDCA: 40             │ │
│  │ 25          │  │             │  │ TC-AGENT: 80            │ │
│  │ TC-REG: 18  │  │             │  │                          │ │
│  │             │  │             │  │                          │ │
│  │ Total: 123  │  │ Total: 200  │  │ Total: 185              │ │
│  └─────────────┘  └─────────────┘  └──────────────────────────┘ │
│                                                                    │
│  ┌──────────────────────────┐  ┌──────────────────────────────┐ │
│  │ qa-e2e                   │  │ qa-extended                  │ │
│  │ (sonnet)                 │  │ (sonnet)                     │ │
│  │                          │  │                              │ │
│  │ TC-E2E: 60               │  │ TC-SKILL: 90                │ │
│  │ TC-UX: 60                │  │ TC-LANG: 32                 │ │
│  │ TC-TEAM: 30              │  │ TC-EDGE: 24                 │ │
│  │                          │  │ TC-SEC: 16                  │ │
│  │                          │  │                              │ │
│  │ Total: 150               │  │ Total: 162                  │ │
│  └──────────────────────────┘  └──────────────────────────────┘ │
│                                                                    │
│  Agent Distribution: 3 opus + 2 sonnet = 5 QA agents              │
│  Total TC: 123 + 200 + 185 + 150 + 162 = 820 (+22 buffer +18 REG)│
│  Grand Total: 860 TC                                               │
└──────────────────────────────────────────────────────────────────┘
```

### 8.2 Execution Order per Agent

| Phase | Agent | TC Range | Prerequisites |
|:-----:|-------|----------|---------------|
| 1 | qa-v157 | TC-V157 (80) + TC-CONFIG (25) | None (static) |
| 1 | qa-extended | TC-SKILL (90) | None (static) |
| 2 | qa-unit | TC-UNIT (200) | None (library) |
| 2 | qa-integration | TC-AGENT (80) + TC-HOOK (65) | None (static + library) |
| 3 | qa-integration | TC-PDCA (40) | After TC-HOOK |
| 3 | qa-e2e | TC-E2E (60) + TC-UX (60) + TC-TEAM (30) | After Phase 2 |
| 4 | qa-v157 | TC-REG (18) | After Phase 2 |
| 4 | qa-extended | TC-LANG (32) + TC-EDGE (24) + TC-SEC (16) | After TC-UNIT |

---

## 9. Quality Metrics

### 9.1 Coverage Analysis

| Component | Total | Testable | Covered | Coverage |
|-----------|:-----:|:--------:|:-------:|:--------:|
| Scripts (13 modified: 4 v1.5.7) | 13 | 13 | 13 | 100% |
| Library Modules (180 + 2 new funcs) | 182 | ~162 | ~130 | ~80% |
| Agents | 16 | 16 | 16 | 100% |
| Skills | 27 | 27 | 27 | 100% |
| Hooks | 10 events | 10 | 10 | 100% |
| Configs | 3 | 3 | 3 | 100% |
| Templates | 16 | 16 | 16 | 100% |
| Output Styles | 4 | 4 | 4 | 100% |

### 9.2 v1.5.7 Delta Coverage

| Changed File | TC Count | Coverage |
|-------------|:--------:|:--------:|
| gap-detector-stop.js | 30 (V157 10 + UNIT 20) | 100% |
| iterator-stop.js | 30 (V157 10 + UNIT 20) | 100% |
| code-review-stop.js | 20 (V157 10 + UNIT 10) | 100% |
| session-start.js | 42 (V157 12 + UNIT 35 partial) | 100% |
| language.js | 14 (V157 10 + UNIT 4) | 100% |
| automation.js | 14 (V157 8 + UNIT 6) | 100% |
| classification.js | 4 (V157 4) | 100% |
| user-prompt-handler.js | 11 (V157 6 + UNIT 5) | 100% |
| bkit-learning.md | 2 (V157 2) | 100% |
| bkit-pdca-guide.md | 3 (V157 3) | 100% |
| plugin.json | 1 (V157 1) | 100% |
| bkit.config.json | 1 (V157 1) | 100% |
| **Total v1.5.7 delta** | **172 TC** | **100%** |

### 9.3 Definition of Done

- [ ] All 860 TC executed (PASS + FAIL + SKIP = 860)
- [ ] 0 FAIL in P0 category (555 TC)
- [ ] v1.5.7 changes: 80/80 PASS
- [ ] 27 skills: all verified
- [ ] 16 agents: all verified
- [ ] 10 hook events: all verified
- [ ] 180 common.js exports: count confirmed + 2 new functions bridged
- [ ] English compliance: Zero Korean in code output (regex patterns excepted)
- [ ] Security: 16/16 TC PASS
- [ ] Regression: 18/18 TC PASS or documented SKIP
- [ ] 5 QA agent reports aggregated

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-28 | Initial design — 860 TC, 14 categories, 5 QA agents | CTO Team |
