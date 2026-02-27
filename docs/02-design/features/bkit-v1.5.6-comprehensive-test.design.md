# bkit v1.5.6 Comprehensive Test Design

> **Summary**: bkit v1.5.6 종합 테스트 실행 설계 — 769 TC의 실행 방법, 검증 기준, 병렬화 전략
>
> **Plan Reference**: docs/01-plan/features/bkit-v1.5.6-comprehensive-test.plan.md
> **Version**: 1.5.6
> **Author**: CTO Team (code-analyzer, qa-strategist, product-manager)
> **Date**: 2026-02-27
> **Status**: Draft

---

## 1. Test Architecture

### 1.1 Execution Strategy

모든 769 TC는 5개 QA 에이전트가 병렬로 실행합니다. 각 에이전트는 독립적인 TC 범위를 담당하며, 동일한 프로젝트 루트 디렉토리에서 실행합니다.

**Test Methods:**
- **Grep**: 파일 내용 패턴 매칭 (`Grep` tool)
- **Read + Parse**: 파일 읽기 후 구조 검증
- **Node Require**: `require()` 모듈 로딩 + export 검증
- **Logic Trace**: 코드 경로 분석 + 조건부 커버리지
- **File Exists**: 파일/디렉토리 존재 확인 (`Glob` tool)
- **Workflow Simulation**: PDCA 사이클, 사용자 여정 시뮬레이션 (SKIP 가능)

### 1.2 Test Categories and Methods

| Category | TC Count | Primary Method | Agent |
|----------|:--------:|----------------|:-----:|
| TC-V156 | 55 | Grep + Read | qa-v156 |
| TC-CONFIG | 25 | JSON Parse + File Exists | qa-v156 |
| TC-UNIT | 200 | Node Require + Logic Trace | qa-unit |
| TC-HOOK | 65 | Read + Grep + JSON Parse | qa-integration |
| TC-AGENT | 80 | Read + Grep (frontmatter) | qa-integration |
| TC-PDCA | 40 | File Exists + Grep + Logic Trace | qa-integration |
| TC-SKILL | 90 | Read + Grep (frontmatter + content) | qa-extended |
| TC-E2E | 60 | Workflow Simulation (SKIP 가능) | qa-e2e |
| TC-UX | 50 | Content Verification + Simulation | qa-e2e |
| TC-TEAM | 30 | Require + Logic Trace | qa-e2e |
| TC-LANG | 24 | Function Invocation | qa-extended |
| TC-EDGE | 20 | Edge Case Analysis + Logic | qa-extended |
| TC-REG | 15 | Re-verification of v1.5.4 items | qa-extended |

### 1.3 Key Design Decisions

1. **hooks.json structure**: Object keyed by event names (not flat array). 10 event keys, 13 handler entries total. `PreToolUse` has 2 matchers (`Write|Edit`, `Bash`), `PostToolUse` has 3 matchers (`Write`, `Bash`, `Skill`).
2. **Agent frontmatter format**: YAML frontmatter between `---` delimiters. Model field uses lowercase (`opus`, `sonnet`, `haiku`). Permission mode (`permissionMode`) = `plan` or `acceptEdits`.
3. **Skill frontmatter**: `user-invocable: true|false` (some skills omit field entirely, treated as not user-invocable).
4. **common.js exports**: 180 total. Bridge module re-exports from 7+ sub-modules.
5. **Session-start.js output**: JSON with `systemMessage` (string) and `hookSpecificOutput.additionalContext` (large markdown string).
6. **Stop handler priority**: Agent handlers execute first (line 193). Skill handlers execute only if no agent handler matched (line 199).
7. **copyTip vs copyHint**: `copyTip` in unified-stop.js (any active skill). `copyHint` in skill-post.js (CODE_GENERATION_SKILLS only). Different conditions, different scopes.
8. **SKILL_HANDLERS registry**: 10 entries (line 30-41). `development-pipeline` uses `null` (special echo case).
9. **AGENT_HANDLERS registry**: 6 entries (line 48-56). Not all 16 agents have stop handlers.
10. **templates directory**: 16 items (14 files + 2 subdirectories: `pipeline/`, `shared/`).

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
| 7 | phase-1-schema | Phase | false |
| 8 | phase-2-convention | Phase | false |
| 9 | phase-3-mockup | Phase | false |
| 10 | phase-4-api | Phase | false |
| 11 | phase-5-design-system | Phase | false |
| 12 | phase-6-ui-integration | Phase | false |
| 13 | phase-7-seo-security | Phase | false |
| 14 | phase-8-review | Phase | false |
| 15 | phase-9-deployment | Phase | false |
| 16 | code-review | Utility | true |
| 17 | zero-script-qa | Utility | true |
| 18 | claude-code-learning | Utility | true |
| 19 | bkit-rules | Utility | false |
| 20 | bkit-templates | Utility | false |
| 21 | mobile-app | Platform | true |
| 22 | desktop-app | Platform | true |
| 23 | bkend-auth | bkend | false |
| 24 | bkend-data | bkend | false |
| 25 | bkend-storage | bkend | false |
| 26 | bkend-quickstart | bkend | false |
| 27 | bkend-cookbook | bkend | false |

**Distribution**: 22 core + 5 bkend | 12 user-invocable / 13 false / 2 unspecified

### 2.3 Hook Registry Reference (10 events, 13 entries)

| # | Event | Matcher | Script | Timeout | Once |
|:-:|-------|---------|--------|:-------:|:----:|
| 1 | SessionStart | — | hooks/session-start.js | 5000ms | true |
| 2 | PreToolUse | `Write\|Edit` | scripts/pre-write.js | 5000ms | — |
| 3 | PreToolUse | `Bash` | scripts/unified-bash-pre.js | 5000ms | — |
| 4 | PostToolUse | `Write` | scripts/unified-write-post.js | 5000ms | — |
| 5 | PostToolUse | `Bash` | scripts/unified-bash-post.js | 5000ms | — |
| 6 | PostToolUse | `Skill` | scripts/skill-post.js | 5000ms | — |
| 7 | Stop | — | scripts/unified-stop.js | 10000ms | — |
| 8 | UserPromptSubmit | — | scripts/user-prompt-handler.js | 3000ms | — |
| 9 | PreCompact | `auto\|manual` | scripts/context-compaction.js | 5000ms | — |
| 10 | TaskCompleted | — | scripts/pdca-task-completed.js | 5000ms | — |
| 11 | SubagentStart | — | scripts/subagent-start-handler.js | 5000ms | — |
| 12 | SubagentStop | — | scripts/subagent-stop-handler.js | 5000ms | — |
| 13 | TeammateIdle | — | scripts/team-idle-handler.js | 5000ms | — |

**Note**: Stop hook has 10000ms timeout (others 5000ms except UserPromptSubmit 3000ms)

### 2.4 Template Reference (16 items)

| # | Template | Type |
|:-:|----------|:----:|
| 1 | plan.template.md | File |
| 2 | plan-plus.template.md | File |
| 3 | design.template.md | File |
| 4 | design-starter.template.md | File |
| 5 | design-enterprise.template.md | File |
| 6 | do.template.md | File |
| 7 | analysis.template.md | File |
| 8 | report.template.md | File |
| 9 | iteration-report.template.md | File |
| 10 | convention.template.md | File |
| 11 | schema.template.md | File |
| 12 | CLAUDE.template.md | File |
| 13 | _INDEX.template.md | File |
| 14 | TEMPLATE-GUIDE.md | File |
| 15 | pipeline/ | Directory |
| 16 | shared/ | Directory |

### 2.5 Output Style Reference (4 styles)

| # | Style | File |
|:-:|-------|------|
| 1 | bkit-enterprise | bkit-enterprise.md |
| 2 | bkit-learning | bkit-learning.md |
| 3 | bkit-pdca-enterprise | bkit-pdca-enterprise.md |
| 4 | bkit-pdca-guide | bkit-pdca-guide.md |

---

## 3. TC-V156: v1.5.6 New Changes Test Design (55 TC)

### 3.1 TC-V156-ENH48: Auto-Memory Integration (20 TC)

#### Verification Anchors (session-start.js)

| Line | Content | Grep Pattern |
|:----:|---------|-------------|
| 577 | Comment: Memory Systems ENH-48 | `Memory Systems.*ENH-48` |
| 578 | Section header | `Memory Systems \\(v1\\.5\\.6\\)` |
| 579 | bkit Agent Memory heading | `bkit Agent Memory \\(Auto-Active\\)` |
| 580 | Agent count | `14 agents use project scope` |
| 582 | CC Auto-Memory heading | `Claude Code Auto-Memory` |
| 584 | /memory command | `/memory.*command` |
| 585 | No collision message | `no collision` |
| 586 | PDCA completion tip | `save key learnings` |

#### Verification Anchors (commands/bkit.md)

| Line | Content | Grep Pattern |
|:----:|---------|-------------|
| 63 | Section header | `Memory & Clipboard \\(v1\\.5\\.6\\)` |
| 64 | /memory entry | `/memory.*Manage Claude auto-memory` |
| 65 | /copy entry | `/copy.*Copy code blocks to clipboard` |

#### Execution Method

```
V156-01~09: Grep session-start.js for exact patterns (lines 577-586)
V156-10~13: Grep commands/bkit.md for section and entries (lines 63-65)
V156-14~20: Grep session-start.js for version strings (lines 3, 6, 507, 571, 633, 689)
```

**Negative Tests (Grep absent)**:
- V156-05: `9 agents use project scope` must NOT appear
- V156-06: `All bkit agents remember` must NOT appear

### 3.2 TC-V156-ENH49: /copy Command Guidance (20 TC)

#### Verification Anchors (scripts/skill-post.js)

| Line | Content | Verification |
|:----:|---------|-------------|
| 96 | Array declaration | `const CODE_GENERATION_SKILLS = \\[` |
| 97 | phase-4-api | `'phase-4-api'` in array |
| 98 | phase-5-design-system | `'phase-5-design-system'` in array |
| 99 | phase-6-ui-integration | `'phase-6-ui-integration'` in array |
| 100 | code-review | `'code-review'` in array |
| 101 | starter | `'starter'` in array |
| 102 | dynamic | `'dynamic'` in array |
| 103 | enterprise | `'enterprise'` in array |
| 104 | mobile-app | `'mobile-app'` in array |
| 105 | desktop-app | `'desktop-app'` in array |
| 108 | Function declaration | `function shouldSuggestCopy` |
| 109 | Implementation | `CODE_GENERATION_SKILLS.includes(skillName)` |
| 135-136 | copyHint conditional | `shouldSuggestCopy(skillName)` + `output.copyHint` |
| 136 | copyHint value | `Use /copy to select and copy code blocks to clipboard` |

#### Verification Anchors (scripts/unified-stop.js)

| Line | Content | Verification |
|:----:|---------|-------------|
| 231 | Comment | `v1.5.6.*Conditionally add /copy tip` |
| 232 | copyTip ternary | `const copyTip = activeSkill \\?` |
| 232 | Tip text | `Use /copy to copy code blocks from this session` |

#### Array Count Verification (V156-31)

```javascript
// Expected: CODE_GENERATION_SKILLS has exactly 9 elements
// Method: Count lines between '[' and ']' in array block (lines 97-105)
// Each line contains one skill name = 9 lines
```

#### Logic Verification (V156-34, V156-35)

```
V156-34: shouldSuggestCopy('phase-6-ui-integration')
  → CODE_GENERATION_SKILLS.includes('phase-6-ui-integration')
  → 'phase-6-ui-integration' is in array (line 99)
  → Result: true ✓

V156-35: shouldSuggestCopy('pdca')
  → CODE_GENERATION_SKILLS.includes('pdca')
  → 'pdca' is NOT in array
  → Result: false ✓
```

#### Design Note: copyTip vs copyHint Scope Difference

| Property | File | Condition | Scope |
|----------|------|-----------|-------|
| `copyHint` | skill-post.js:136 | `shouldSuggestCopy(skillName)` | 9 code generation skills only |
| `copyTip` | unified-stop.js:232 | `activeSkill ? ...` | Any active skill (truthy check) |

This is intentional: skill-post suggests `/copy` only for code-generating skills, while unified-stop shows the tip whenever any skill was active in the session.

### 3.3 TC-V156-DOC: Guide Documents (5 TC)

#### cto-team-memory-guide.md Verification

| TC | Verification | Method |
|----|-------------|--------|
| V156-41 | File exists | `Glob docs/guides/cto-team-memory-guide.md` |
| V156-42 | 3 memory systems | Grep: `CC auto-memory`, `bkit memory-store`, `bkit agent-memory` |
| V156-43 | Version references | Grep: `v2.1.50`, `v2.1.59` |

#### remote-control-compatibility.md Verification

| TC | Verification | Method |
|----|-------------|--------|
| V156-44 | File exists | `Glob docs/guides/remote-control-compatibility.md` |
| V156-45 | 12 skills in matrix | Count table rows with `Pending` status |

**Expected 12 skills in RC matrix**: pdca, plan-plus, starter, dynamic, enterprise, development-pipeline, code-review, zero-script-qa, claude-code-learning, mobile-app, desktop-app, bkit-rules

### 3.4 TC-V156-VER: Version Bump (10 TC)

#### Version String Anchors

| TC | File | Pattern | Expected |
|----|------|---------|----------|
| V156-46 | .claude-plugin/plugin.json | `"version": "1.5.6"` | Exact match |
| V156-47 | bkit.config.json | `"version": "1.5.6"` | Exact match |
| V156-48 | CHANGELOG.md | `## [1.5.6]` | Header exists |
| V156-49 | CHANGELOG.md | `### Added` (after [1.5.6]) | Section exists |
| V156-50 | CHANGELOG.md | `### Changed` (after [1.5.6]) | Section exists |
| V156-51 | CHANGELOG.md | `### Compatibility` (after [1.5.6]) | Section exists |
| V156-52 | CHANGELOG.md | `Recommended v2.1.59` | Exact match |
| V156-53 | CHANGELOG.md | No Korean characters in v1.5.6 block | Regex `[\uAC00-\uD7AF]` absent |
| V156-54 | session-start.js | Count `v1.5.5` occurrences | ≤ 1 (changelog reference only) |
| V156-55 | Cross-file | `1.5.6` in all 4 config files | Consistent |

#### session-start.js Version String Map (6 locations)

| # | Line | Context | Grep Pattern |
|:-:|:----:|---------|-------------|
| 1 | 3 | JSDoc header | `SessionStart Hook \\(v1\\.5\\.6\\)` |
| 2 | 507 | additionalContext header | `bkit Vibecoding Kit v1\\.5\\.6 - Session Startup` |
| 3 | 571 | Output Styles section | `Output Styles \\(v1\\.5\\.6\\)` |
| 4 | 578 | Memory Systems section | `Memory Systems \\(v1\\.5\\.6\\)` |
| 5 | 633 | Feature Usage Report | `v1\\.5\\.6 - Required` |
| 6 | 689 | systemMessage | `v1\\.5\\.6 activated` |

---

## 4. TC-UNIT: Script Unit Tests Design (200 TC)

### 4.1 TC-UNIT-SS: session-start.js (35 TC)

#### Functions to Test

| Function | Lines | Parameters | Returns | TC |
|----------|:-----:|------------|---------|:--:|
| `checkUserPromptSubmitBug()` | — | none | `string\|null` | 2 |
| `scanSkillsForForkConfig()` | — | none | `Array<{name,mergeResult}>` | 3 |
| `preloadCommonImports()` | — | none | `void` | 2 |
| `detectPdcaPhase()` | — | none | `string` | 5 |
| `enhancedOnboarding()` | — | none | `{type,hasExistingWork,...}` | 5 |
| `analyzeRequestAmbiguity(userRequest, context)` | — | `(string,object)` | `object\|null` | 3 |
| `getTriggerKeywordTable()` | — | none | `string` | 2 |
| additionalContext assembly | 507-640 | — | markdown string | 8 |
| JSON output structure | 685-700 | — | `{systemMessage, hookSpecificOutput}` | 5 |

#### Key Assertions

```
UNIT-SS-01: detectPdcaPhase() with no .pdca-status.json → returns "1"
UNIT-SS-02: detectPdcaPhase() with phase "plan" → returns "1"
UNIT-SS-03: detectPdcaPhase() with phase "design" → returns "2"
UNIT-SS-04: detectPdcaPhase() with phase "do" → returns "3"
UNIT-SS-05: detectPdcaPhase() with phase "check" → returns "4"

UNIT-SS-06: enhancedOnboarding() no PDCA → type: "new_user"
UNIT-SS-07: enhancedOnboarding() existing PDCA → type: "resume"
UNIT-SS-08: enhancedOnboarding() with active features → hasExistingWork: true
UNIT-SS-09: enhancedOnboarding() primary feature extraction
UNIT-SS-10: enhancedOnboarding() matchRate propagation

UNIT-SS-21: additionalContext contains "## Memory Systems (v1.5.6)"
UNIT-SS-22: additionalContext contains "## Output Styles (v1.5.6)"
UNIT-SS-23: additionalContext contains "## CTO-Led Agent Teams"
UNIT-SS-24: additionalContext contains trigger keyword tables
UNIT-SS-25: additionalContext contains "📊 bkit Feature Usage Report"

UNIT-SS-31: JSON output has hookSpecificOutput.hookEventName = "SessionStart"
UNIT-SS-32: JSON output has systemMessage containing "v1.5.6"
UNIT-SS-33: JSON output has hookSpecificOutput.additionalContext (non-empty)
UNIT-SS-34: JSON output has hookSpecificOutput.onboardingType
UNIT-SS-35: JSON output has hookSpecificOutput.hasExistingWork (boolean)
```

### 4.2 TC-UNIT-SP: skill-post.js (25 TC)

#### Functions to Test

| Function | Lines | Parameters | Returns | TC |
|----------|:-----:|------------|---------|:--:|
| `parseSkillInvocation(toolInput)` | 37-58 | `Object` | `{skillName, args}` | 5 |
| `formatNextStepMessage(suggestions, skillName)` | 66-88 | `(Object, string)` | `string` | 5 |
| `shouldSuggestCopy(skillName)` | 108-110 | `string` | `boolean` | 5 |
| `generateJsonOutput(suggestions, skillName)` | 118-140 | `(Object, string)` | `Object` | 5 |
| `main()` flow | 145-215 | — | — | 5 |

#### Key Assertions

```
UNIT-SP-01: parseSkillInvocation({skill:'pdca', args:'plan my-feature'})
  → {skillName:'pdca', args:{action:'plan', feature:'my-feature'}}
UNIT-SP-02: parseSkillInvocation({}) → {skillName:'', args:{}}
UNIT-SP-03: parseSkillInvocation(null) → {skillName:'', args:{}}
UNIT-SP-04: parseSkillInvocation({skill:'starter'}) → {skillName:'starter', args:{}}
UNIT-SP-05: parseSkillInvocation({skill:'dynamic', args:'init'}) → {action:'init'}

UNIT-SP-11: shouldSuggestCopy('phase-4-api') → true
UNIT-SP-12: shouldSuggestCopy('starter') → true
UNIT-SP-13: shouldSuggestCopy('pdca') → false
UNIT-SP-14: shouldSuggestCopy('bkit-rules') → false
UNIT-SP-15: shouldSuggestCopy('') → false

UNIT-SP-16: generateJsonOutput({}, 'phase-6-ui-integration').copyHint exists
UNIT-SP-17: generateJsonOutput({}, 'pdca').copyHint === undefined
UNIT-SP-18: generateJsonOutput({nextSkill:{name:'design',message:'Next'}}, 'starter')
  → has nextSkill, nextSkillMessage, copyHint
UNIT-SP-19: generateJsonOutput({}, 'code-review').copyHint = 'Use /copy...'
UNIT-SP-20: generateJsonOutput({}, 'zero-script-qa').copyHint === undefined
```

### 4.3 TC-UNIT-US: unified-stop.js (20 TC)

#### Functions to Test

| Function | Lines | Parameters | Returns | TC |
|----------|:-----:|------------|---------|:--:|
| `detectActiveSkill(hookContext)` | 67-91 | `Object` | `string\|null` | 5 |
| `detectActiveAgent(hookContext)` | 98-122 | `Object` | `string\|null` | 5 |
| `executeHandler(handlerPath, context)` | 134-157 | `(string, Object)` | `boolean` | 5 |
| Main flow | 163-240 | — | — | 5 |

#### Detection Priority Order

```
detectActiveSkill (4-tier fallback):
  1. hookContext.skill_name          → direct
  2. hookContext.tool_input.skill    → from Skill tool
  3. getActiveSkill()                → session context
  4. pdcaStatus.session.lastSkill    → PDCA legacy

detectActiveAgent (4-tier fallback):
  1. hookContext.agent_name          → direct
  2. hookContext.tool_input.subagent_type → from Task tool
  3. getActiveAgent()                → session context
  4. pdcaStatus.session.lastAgent    → PDCA legacy
```

#### Key Assertions

```
UNIT-US-01: detectActiveSkill({skill_name:'pdca'}) → 'pdca' (tier 1)
UNIT-US-02: detectActiveSkill({tool_input:{skill:'code-review'}}) → 'code-review' (tier 2)
UNIT-US-03: detectActiveSkill({}) → null (no active skill)
UNIT-US-04: detectActiveAgent({agent_name:'gap-detector'}) → 'gap-detector' (tier 1)
UNIT-US-05: detectActiveAgent({tool_input:{subagent_type:'code-analyzer'}}) → 'code-analyzer' (tier 2)

UNIT-US-11: executeHandler(null, {}) → false
UNIT-US-12: executeHandler('./nonexistent.js', {}) → false (caught)
UNIT-US-13: SKILL_HANDLERS has 10 entries
UNIT-US-14: AGENT_HANDLERS has 6 entries
UNIT-US-15: SKILL_HANDLERS['development-pipeline'] === null

UNIT-US-16: activeAgent matched → agent handler executes first
UNIT-US-17: activeSkill='development-pipeline' → console.log({continue:false})
UNIT-US-18: No handler matched + activeSkill truthy → copyTip present
UNIT-US-19: No handler matched + activeSkill null → copyTip empty
UNIT-US-20: clearActiveContext() always called
```

### 4.4 TC-UNIT-BPR: unified-bash-pre.js (15 TC)

#### Dangerous Patterns

**Phase 9 Deployment (6 patterns)**:
`kubectl delete`, `terraform destroy`, `aws ec2 terminate`, `helm uninstall`, `--force`, `production`

**QA Testing (9 patterns)**:
`rm -rf`, `rm -r`, `DROP TABLE`, `DROP DATABASE`, `DELETE FROM`, `TRUNCATE`, `> /dev/`, `mkfs`, `dd if=`

```
UNIT-BPR-01: handlePhase9DeployPre({command:'kubectl delete pod'}) → blocked
UNIT-BPR-02: handlePhase9DeployPre({command:'kubectl get pods'}) → allowed
UNIT-BPR-03: handlePhase9DeployPre({command:'terraform destroy'}) → blocked
UNIT-BPR-04: handleQaPreBash({command:'rm -rf /tmp'}) → blocked
UNIT-BPR-05: handleQaPreBash({command:'npm test'}) → allowed
UNIT-BPR-06: handleQaPreBash({command:'DROP TABLE users'}) → blocked
```

### 4.5 TC-UNIT-Remaining Scripts (75 TC)

| Script | TC | Key Areas |
|--------|:--:|-----------|
| unified-bash-post.js | 15 | QA monitor logging, command truncation |
| unified-write-post.js + pre-write.js | 15 | File tracking, PDCA tracking, convention hints |
| user-prompt-handler.js | 15 | Intent detection, trigger matching, ambiguity |
| context-compaction.js | 10 | Snapshot creation, cleanup (keep 10), PDCA summary |
| pdca-task-completed.js | 10 | PDCA pattern matching, phase advancement |
| subagent-start/stop/idle handlers | 10 | Agent state, teammate status |

### 4.6 TC-UNIT-LIB: Library Functions (40 TC)

| Module | TC | Key Exports |
|--------|:--:|-------------|
| lib/core/ | 8 | `debugLog`, `outputAllow`, `outputBlock`, `outputEmpty`, `readStdinSync`, `parseHookInput`, `truncateContext` |
| lib/pdca/ | 10 | `getPdcaStatusFull`, `updatePdcaStatus`, `addPdcaHistory`, `autoAdvancePdcaPhase`, `shouldAutoAdvance`, `getAutomationLevel`, `initPdcaStatusIfNotExists` |
| lib/intent/ | 6 | `detectNewFeatureIntent`, `matchImplicitAgentTrigger`, `matchImplicitSkillTrigger`, `calculateAmbiguityScore`, `generateClarifyingQuestions` |
| lib/task/ | 6 | `getActiveSkill`, `setActiveSkill`, `getActiveAgent`, `setActiveAgent`, `clearActiveContext` |
| lib/team/ | 6 | `isTeamModeAvailable`, `generateTeamStrategy`, `formatTeamStatus`, `assignNextTeammateWork`, `readAgentState`, `cleanupAgentState` |
| lib/skill-orchestrator.js | 4 | `orchestrateSkillPost`, `getSkillConfig` |

---

## 5. TC-HOOK: Hook Integration Tests Design (65 TC)

### 5.1 Per-Hook Verification Design

| Hook Event | Verification Points | TC |
|-----------|-------------------|:--:|
| SessionStart | JSON output: `systemMessage` + `hookSpecificOutput.hookEventName="SessionStart"` + `additionalContext` length > 1000 | 8 |
| PreToolUse(Write\|Edit) | Block for `decision:deny`, allow with context parts, PDCA tracking for source files | 6 |
| PreToolUse(Bash) | Block for dangerous patterns (6 deployment + 9 QA), allow safe commands | 6 |
| PostToolUse(Write) | PDCA post-write always runs, phase-5/6/QA conditional handlers | 6 |
| PostToolUse(Bash) | QA monitor logging, non-QA context passthrough | 6 |
| PostToolUse(Skill) | Orchestration suggestions, copyHint for code skills, setActiveSkill | 6 |
| Stop | Handler dispatch (agent→skill priority), copyTip conditional, clearActiveContext | 6 |
| UserPromptSubmit | Intent detection, agent/skill trigger, ambiguity check, truncation | 6 |
| PreCompact | Snapshot creation, old snapshot cleanup (keep 10), PDCA state summary | 5 |
| TaskCompleted | PDCA pattern matching, phase auto-advancement, team assignment | 5 |

### 5.2 Hook Chain Integration (5 TC)

```
HOOK-61: SessionStart → additionalContext consumed by subsequent hooks (state file)
HOOK-62: PreToolUse(Write) → PostToolUse(Write) state propagation via .pdca-status.json
HOOK-63: PostToolUse(Skill) → Stop: activeSkill set by setActiveSkill, consumed by detectActiveSkill
HOOK-64: TaskCompleted → phase auto-advance → next hook receives updated pdca status
HOOK-65: SubagentStart → SubagentStop → TeammateIdle: agent-state.json propagation
```

**Note**: Hooks run as separate Node.js processes. State propagation only through filesystem (.pdca-status.json, agent-state.json, .bkit-memory.json). In-memory state (getActiveSkill/Agent) is per-process only.

---

## 6. TC-AGENT: Agent Functional Tests Design (80 TC)

### 6.1 Per-Agent Verification (5 TC × 16 agents)

Each agent verified for:

| # | Check | Method | Source |
|:-:|-------|--------|--------|
| 1 | Frontmatter `model` field | Grep agent .md | Section 2.1 reference |
| 2 | Frontmatter `permissionMode` field | Grep agent .md | Section 2.1 reference |
| 3 | Tool list in frontmatter | Grep `tools:` block | Per-agent spec |
| 4 | Trigger keywords in system prompt description | Grep description block | Plugin system prompt |
| 5 | Memory scope (agent-memory frontmatter) | Grep `scope:` | project vs user |

### 6.2 Agent Model Distribution Verification

```
Expected: 7 opus + 7 sonnet + 2 haiku = 16 total

opus (7): cto-lead, code-analyzer, design-validator, gap-detector,
          enterprise-expert, infra-architect, security-architect
sonnet (7): bkend-expert, frontend-architect, pdca-iterator, pipeline-guide,
            product-manager, qa-strategist, starter-guide
haiku (2): report-generator, qa-monitor
```

---

## 7. TC-SKILL: Skill Functional Tests Design (90 TC)

### 7.1 Per-Skill Verification (3~4 TC per skill)

| # | Check | Method |
|:-:|-------|--------|
| 1 | SKILL.md exists at `skills/{name}/SKILL.md` | File exists |
| 2 | YAML frontmatter valid (has `---` delimiters) | Read + parse |
| 3 | `description` field non-empty | Grep frontmatter |
| 4 | Trigger keywords present (for user-invocable skills) | Grep description |

### 7.2 Category-Specific Checks

| Category | Additional Checks | TC |
|----------|------------------|:--:|
| PDCA (2) | `arguments` section, PDCA phase mapping | 12 |
| Level (3) | `init` command, level-specific content | 9 |
| Pipeline (1) | Phase references, `start/next/status` | 4 |
| Phase (9) | Phase number, predecessor/successor | 27 |
| Utility (5) | Specific tool references | 12 |
| Platform (2) | Framework mentions (React Native, Electron) | 8 |
| bkend (5) | MCP tool references, API patterns | 18 |

---

## 8. TC-PDCA, TC-E2E, TC-UX, TC-TEAM Design (180 TC)

### 8.1 TC-PDCA: Workflow Tests (40 TC)

| Phase | TC | Verification |
|-------|:--:|-------------|
| Plan | 6 | Template exists, doc creation path, .pdca-status.json update |
| Design | 6 | Plan dependency check, template, blockedBy |
| Do | 6 | Design dependency, implementation guide content |
| Check | 6 | gap-detector agent reference, match rate format |
| Act | 4 | pdca-iterator agent, max iterations (5), stop condition (≥90%) |
| Report | 4 | report-generator agent, completion status |
| Archive | 4 | Doc move paths, _INDEX.md, --summary option |
| Status/Next | 2 | Phase display, next suggestion logic |
| Error | 2 | Missing plan blocks design, missing design blocks do |

### 8.2 TC-E2E: End-to-End Tests (60 TC)

| Journey | TC | SKIP Risk | Key Workflows |
|---------|:--:|:---------:|---------------|
| Beginner | 10 | High | /starter init → phase skills → deploy |
| Fullstack | 10 | High | /dynamic init → bkend → API → UI |
| Enterprise | 10 | High | /enterprise init → K8s → security |
| PDCA Full | 10 | Medium | plan → design → do → analyze → iterate → report → archive |
| CTO Team | 10 | High | /pdca team → parallel agents → gates |
| Code Review | 10 | Medium | code-review → gap → iterate → report |

**Note**: E2E tests have high SKIP risk due to runtime dependency. Static path verification (file existence, content patterns) will be used as fallback.

### 8.3 TC-UX: User Experience Tests (50 TC)

| Journey | TC | Method |
|---------|:--:|--------|
| First-Time User | 10 | SessionStart output analysis |
| Developer Workflow | 10 | Trigger detection function testing |
| QA Engineer | 10 | Skill content + agent reference check |
| Team Lead | 10 | Team function existence + config |
| v1.5.6 UX | 10 | Section 3 anchors + content verification |

### 8.4 TC-TEAM: CTO Team Tests (30 TC)

| Area | TC | Method |
|------|:--:|--------|
| Availability | 5 | `require('lib/team')`, `isTeamModeAvailable()` |
| Composition | 5 | `generateTeamStrategy()` for Dynamic (3), Enterprise (5) |
| Orchestration | 5 | Pattern config: leader, swarm, council, watchdog |
| Delegation | 5 | `assignNextTeammateWork()` function exists |
| Status | 5 | `formatTeamStatus()` output format |
| Cleanup | 5 | `cleanupAgentState()`, session end |

---

## 9. TC-LANG, TC-EDGE, TC-REG Design (59 TC)

### 9.1 TC-LANG: Multi-Language Tests (24 TC)

8 languages × 3 triggers each = 24 TC

| Language | Keywords | Test Method |
|----------|----------|-------------|
| Korean | 검증, 개선, 분석 | `matchImplicitAgentTrigger(keyword)` |
| Japanese | 確認, 改善, 分析 | `matchImplicitAgentTrigger(keyword)` |
| Chinese | 验证, 改进, 分析 | `matchImplicitAgentTrigger(keyword)` |
| Spanish | verificar, mejorar, analizar | `matchImplicitAgentTrigger(keyword)` |
| French | vérifier, améliorer, analyser | `matchImplicitAgentTrigger(keyword)` |
| German | prüfen, verbessern, analysieren | `matchImplicitAgentTrigger(keyword)` |
| Italian | verificare, migliorare, analizzare | `matchImplicitAgentTrigger(keyword)` |
| English | verify, improve, analyze | `matchImplicitAgentTrigger(keyword)` |

**Expected Mapping**:
- verify/검증/確認/... → `bkit:gap-detector`
- improve/개선/改善/... → `bkit:pdca-iterator`
- analyze/분석/分析/... → `bkit:code-analyzer`

### 9.2 TC-EDGE: Edge Case Tests (20 TC)

| Area | TC | Verification |
|------|:--:|-------------|
| Hook timeout | 4 | All scripts complete within timeout (static code analysis) |
| Large context | 4 | PreCompact snapshot size, truncateContext MAX_CONTEXT_LENGTH (500 chars) |
| Error recovery | 4 | Invalid JSON stdin, missing .pdca-status.json, malformed bkit.config.json |
| Concurrent access | 4 | Memory store read/write patterns (filesystem-based, no locks) |
| Language compliance | 4 | English code comments in scripts/, 8-lang triggers preserved |

### 9.3 TC-REG: Regression Tests (15 TC)

| Area | TC | Verification |
|------|:--:|-------------|
| v1.5.4 SKIP items | 3 | Re-check 3 previously skipped TC |
| common.js 180 exports | 3 | `Object.keys(require('lib/common.js')).length === 180` |
| Hook chain stability | 3 | 10 hook events registered, all script paths valid |
| Agent model assignment | 3 | 7 opus + 7 sonnet + 2 haiku = 16 |
| Known issues | 3 | #25131 (Agent Teams), #24044 (MEMORY.md), #28379 (RC slash) status |

---

## 10. Parallelization Design

### 10.1 Agent Assignment

```
┌─────────────────────────────────────────────────────────────┐
│                    CTO Lead (Coordinator)                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────────┐ │
│  │ qa-v156    │  │ qa-unit    │  │ qa-integration         │ │
│  │ (sonnet)   │  │ (opus)     │  │ (opus)                 │ │
│  │            │  │            │  │                        │ │
│  │ TC-V156:55 │  │ TC-UNIT:   │  │ TC-HOOK: 65           │ │
│  │ TC-CONFIG: │  │ 200        │  │ TC-PDCA: 40           │ │
│  │ 25         │  │            │  │ TC-AGENT: 80          │ │
│  │            │  │            │  │                        │ │
│  │ Total: 80  │  │ Total: 200 │  │ Total: 185            │ │
│  └────────────┘  └────────────┘  └────────────────────────┘ │
│                                                               │
│  ┌────────────────────────┐  ┌────────────────────────────┐ │
│  │ qa-e2e                 │  │ qa-extended                │ │
│  │ (sonnet)               │  │ (sonnet)                   │ │
│  │                        │  │                            │ │
│  │ TC-E2E: 60             │  │ TC-SKILL: 90              │ │
│  │ TC-UX: 50              │  │ TC-LANG: 24               │ │
│  │ TC-TEAM: 30            │  │ TC-EDGE: 20               │ │
│  │                        │  │ TC-REG: 15                │ │
│  │ Total: 140             │  │ Total: 149                │ │
│  └────────────────────────┘  └────────────────────────────┘ │
│                                                               │
│  Agent Distribution: 2 opus + 3 sonnet = 5 QA agents         │
│  Total TC: 80 + 200 + 185 + 140 + 149 = 754 (+15 REG)       │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Execution Order per Agent

| Phase | Agent | TC Range | Prerequisites |
|:-----:|-------|----------|---------------|
| 1 | qa-v156 | TC-V156 + TC-CONFIG | None (static) |
| 1 | qa-extended | TC-SKILL | None (static) |
| 2 | qa-unit | TC-UNIT | None (library) |
| 2 | qa-integration | TC-AGENT + TC-HOOK | None (static + library) |
| 3 | qa-integration | TC-PDCA | After TC-HOOK |
| 3 | qa-e2e | TC-E2E + TC-UX + TC-TEAM | After Phase 2 |
| 4 | qa-extended | TC-LANG + TC-EDGE + TC-REG | After TC-UNIT |

### 10.3 Report Aggregation

Each agent produces a standardized report:

```
[PASS|FAIL|SKIP] TC-ID: Description
  File: path/to/file
  Expected: expected value
  Actual: actual value (FAIL only)
  Reason: skip reason (SKIP only)
```

CTO Lead aggregates all 5 reports into a single comprehensive report.

---

## 11. Quality Metrics

### 11.1 Coverage Analysis

| Component | Total | Testable | Covered | Coverage |
|-----------|:-----:|:--------:|:-------:|:--------:|
| Scripts (13) | 13 | 13 | 13 | 100% |
| Library Modules | 180 exports | ~160 | ~120 | ~75% |
| Agents | 16 | 16 | 16 | 100% |
| Skills | 27 | 27 | 27 | 100% |
| Hooks | 10 events | 10 | 10 | 100% |
| Configs | 3 | 3 | 3 | 100% |
| Templates | 16 | 16 | 16 | 100% |
| Output Styles | 4 | 4 | 4 | 100% |

### 11.2 Pass Rate Targets

| Metric | Target | Minimum |
|--------|:------:|:-------:|
| Overall Pass Rate | 100% | 99% |
| P0 Pass Rate | 100% | 100% |
| P1 Pass Rate | 100% | 95% |
| FAIL count | 0 | ≤ 3 |
| v1.5.6 TC (55) | 100% | 100% |
| SKIP count | ≤ 48 | ≤ 60 |

### 11.3 Definition of Done

- [ ] All 769 TC executed (PASS + FAIL + SKIP = 769)
- [ ] 0 FAIL in P0 category (530 TC)
- [ ] v1.5.6 changes: 55/55 PASS
- [ ] 27 skills: all verified
- [ ] 16 agents: all verified
- [ ] 10 hook events: all verified
- [ ] 180 common.js exports: count confirmed
- [ ] Language compliance: English code + 8-lang triggers
- [ ] 5 QA agent reports aggregated

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-27 | Initial design — Full 769 TC specification | CTO Team |
