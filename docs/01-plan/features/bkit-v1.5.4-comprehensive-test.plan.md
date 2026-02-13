# bkit v1.5.4 Comprehensive Test Plan

> **Summary**: bkit v1.5.4 comprehensive test covering all features: Unit tests, Integration tests, and Philosophy-aligned UX Scenario tests
>
> **Project**: bkit-claude-code
> **Version**: 1.5.4
> **Author**: CTO Team (qa-library, qa-hooks, qa-philosophy, qa-bkend-v154)
> **Date**: 2026-02-14
> **Status**: Final (4 Research Agents Complete)
> **Previous Test**: v1.5.3 (688 TC planned, 685 executed, 646 PASS, 0 FAIL, 39 SKIP, 100%)
> **Environment**: CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1, claude --plugin-dir .
> **Branch**: feature/v1.5.4-bkend-mcp-accuracy-fix

---

## 1. Background

### 1.1 Test Necessity

bkit v1.5.4 includes the bkend MCP accuracy fix (10 GAPs resolved, 8 files modified) on top of the v1.5.3 baseline. This test plan covers:

1. **v1.5.4 new changes** (bkend MCP accuracy fix)
2. **Full bkit feature inventory** (26 skills, 16 agents, 10 hooks, 45 scripts, 180 common.js exports)
3. **Philosophy-aligned UX scenarios** (NEW: tests grounded in bkit-system/philosophy/)

| Change Category | v1.5.4 Delta from v1.5.3 |
|----------------|--------------------------|
| Skills content | 5 bkend skills updated (data, auth, storage, quickstart, cookbook) |
| Agent content | bkend-expert.md rewritten (MCP 19→28+ tools) |
| Templates | bkend-patterns.md expanded (85→140 lines, SSOT) |
| Hooks | session-start.js line 567 (Dynamic → Dynamic \|\| Enterprise) |
| Skills count | 26 (unchanged) |
| Agents count | 16 (unchanged) |
| Hook events | 10 (unchanged) |
| Scripts | 45 (unchanged) |
| common.js exports | 180 (unchanged) |

### 1.2 Previous Test Results (v1.5.3)

| Metric | Value |
|--------|:-----:|
| Total TC | 688 |
| Executed | 685 |
| PASS | 646 |
| FAIL | 0 (after Act Iteration 1) |
| SKIP | 39 (runtime-only, environment-dependent) |
| Pass Rate (excl. SKIP) | 100.0% |
| GAP-01 | common.js bridge missing state-writer 9 exports (FIXED) |

### 1.3 v1.5.4 Component Inventory

| Component | Count | Location | Delta from v1.5.3 |
|-----------|:-----:|----------|:------------------:|
| Skills | 26 (21 core + 5 bkend) | `skills/*/SKILL.md` | 0 (5 content updates) |
| Agents | 16 | `agents/*.md` | 0 (1 content update) |
| Hook Events | 10 | `hooks/hooks.json` | 0 (1 logic change) |
| Scripts | 45 | `scripts/*.js` | 0 |
| Library Exports (common.js) | 180 | `lib/` → `lib/common.js` | 0 |
| Templates | 27 + 1 shared | `templates/` | 0 (1 content update) |
| Output Styles | 4 | `output-styles/` | 0 |
| Config Files | 2 | `bkit.config.json`, `.bkit-memory.json` | 0 |

### 1.4 Philosophy Documents (Test Foundation)

| Document | Key Principles | Test Category |
|----------|---------------|:-------------:|
| `core-mission.md` | Automation First, No Guessing, Docs = Code | TC-PHIL-AF, TC-PHIL-NG, TC-PHIL-DC |
| `ai-native-principles.md` | Verification Ability, Direction Setting, Quality Standards | TC-PHIL-VA, TC-PHIL-DS, TC-PHIL-QS |
| `context-engineering.md` | FR-01~FR-08, 5-Layer Hook System, Dynamic Injection | TC-PHIL-CE |
| `pdca-methodology.md` | PDCA Cycle, 9-Stage Pipeline, Check-Act Iteration | TC-PHIL-PM |

---

## 2. Goals

### 2.1 Must (P0)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-01 | v1.5.4 New Changes Test | bkend MCP accuracy fix: 10 GAPs, 8 files, SSOT | 55 |
| G-02 | Script Unit Test | 45 scripts, exported functions, logic paths | 195 |
| G-03 | Hook Integration Test | 10 hook events, chain validation, state propagation | 60 |
| G-04 | Agent Functional Test | 16 agents: trigger, tools, delegation, model, memory | 70 |
| G-05 | Skill Functional Test | 26 skills: load, trigger, content, imports, agent-binding | 85 |
| G-06 | PDCA Workflow Test | Plan-Design-Do-Check-Act-Report-Archive full cycle | 35 |

### 2.2 Should (P1)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-07 | Philosophy Compliance Test | 4 philosophy docs → UX scenario validation | 50 |
| G-08 | User Experience Scenario Test | 4 user journeys (Beginner/Dev/QA/Completion) | 40 |
| G-09 | Config & Template Test | bkit.config.json, 28 templates, output-styles | 25 |
| G-10 | CTO Team Orchestration Test | Team composition, patterns, task queue, delegation | 30 |

### 2.3 Could (P2)

| ID | Goal | Description | TC |
|:--:|------|-------------|:--:|
| G-11 | Multi-Language Test | 8-language triggers + ambiguity detection | 24 |
| G-12 | Edge Case & Performance | Hook timeout, caching, error handling, boundaries | 20 |
| G-13 | Regression Test | v1.5.3 baseline verification + known issues | 15 |

### 2.4 TC Summary

| Priority | TC Count | Ratio |
|:--------:|:--------:|:-----:|
| P0 (Must) | 500 | 65.4% |
| P1 (Should) | 145 | 19.0% |
| P2 (Could) | 59 | 7.7% |
| Regression | 15 | 2.0% |
| **Grand Total** | **719** | **100%** |

---

## 3. Test Categories

### 3.1 TC-V154: v1.5.4 New Changes (55 TC)

#### TC-V154-GAP: 10 GAP Resolution Verification (30 TC)

| ID | GAP | Test Case | File | Verification | Priority |
|----|:---:|-----------|------|-------------|:--------:|
| V154-01 | 01 | `backend_data_list` tool present in bkend-data SKILL.md | bkend-data/SKILL.md | Grep `backend_data_list` | P0 |
| V154-02 | 01 | `backend_data_get` tool present | bkend-data/SKILL.md | Grep `backend_data_get` | P0 |
| V154-03 | 01 | `backend_data_create` tool present | bkend-data/SKILL.md | Grep `backend_data_create` | P0 |
| V154-04 | 01 | `backend_data_update` tool present | bkend-data/SKILL.md | Grep `backend_data_update` | P0 |
| V154-05 | 01 | `backend_data_delete` tool present | bkend-data/SKILL.md | Grep `backend_data_delete` | P0 |
| V154-06 | 02 | `backend_schema_version_apply` replaces `rollback` | bkend-data/SKILL.md | Grep confirms `version_apply`, no `rollback` | P0 |
| V154-07 | 02 | `backend_table_update` removed | bkend-data/SKILL.md | Grep confirms absence | P0 |
| V154-08 | 02 | `backend_index_rollback` removed | bkend-data/SKILL.md | Grep confirms absence | P0 |
| V154-09 | 03 | 9 Project/Env tools in bkend-quickstart | bkend-quickstart/SKILL.md | Grep `backend_org_list` etc. | P0 |
| V154-10 | 03 | 9 Project/Env tools in bkend-expert | bkend-expert.md | Grep all 9 tool names | P0 |
| V154-11 | 04 | search_docs workflow in bkend-auth | bkend-auth/SKILL.md | Grep `search_docs` | P0 |
| V154-12 | 04 | search_docs workflow in bkend-storage | bkend-storage/SKILL.md | Grep `search_docs` | P0 |
| V154-13 | 04 | "bkend MCP does NOT have dedicated auth tools" present | bkend-auth/SKILL.md | Grep exact phrase | P0 |
| V154-14 | 04 | "bkend MCP does NOT have dedicated storage tools" present | bkend-storage/SKILL.md | Grep exact phrase | P0 |
| V154-15 | 05 | Fixed Tools section (3 tools) in bkend-expert | bkend-expert.md | Grep `get_context`, `search_docs`, `get_operation_schema` | P0 |
| V154-16 | 05 | Searchable Docs section (6 doc IDs) in bkend-expert | bkend-expert.md | Grep `1_concepts` through `7_code_examples_data` | P0 |
| V154-17 | 05 | Fixed Tools in bkend-quickstart | bkend-quickstart/SKILL.md | Grep 3 Fixed Tool names | P0 |
| V154-18 | 06 | 4 MCP Resources (bkend://) in bkend-expert | bkend-expert.md | Grep `bkend://orgs` | P0 |
| V154-19 | 06 | MCP Resources in bkend-quickstart | bkend-quickstart/SKILL.md | Grep `bkend://` URIs | P0 |
| V154-20 | 06 | MCP Resources in bkend-patterns.md | bkend-patterns.md | Grep `bkend://` URIs | P0 |
| V154-21 | 07 | All URLs use `en/` prefix (bkend-expert) | bkend-expert.md | Grep `src/` absent, `en/` present | P0 |
| V154-22 | 07 | All URLs use `en/` prefix (bkend-data) | bkend-data/SKILL.md | Same check | P0 |
| V154-23 | 07 | All URLs use `en/` prefix (bkend-auth) | bkend-auth/SKILL.md | Same check | P0 |
| V154-24 | 07 | All URLs use `en/` prefix (bkend-storage) | bkend-storage/SKILL.md | Same check | P0 |
| V154-25 | 07 | All URLs use `en/` prefix (bkend-quickstart) | bkend-quickstart/SKILL.md | Same check | P0 |
| V154-26 | 07 | All URLs use `en/` prefix (bkend-cookbook) | bkend-cookbook/SKILL.md | Same check | P0 |
| V154-27 | 08 | Dynamic Base URL via get_context in bkend-patterns | bkend-patterns.md | Grep `get_context` | P0 |
| V154-28 | 08 | "Do NOT hardcode" instruction present | bkend-expert.md | Grep `Do NOT hardcode` | P0 |
| V154-29 | 09 | ID field uses `id` not `_id` | bkend-patterns.md | Grep `id` present, `_id` absent in ID context | P0 |
| V154-30 | 10 | Enterprise MCP detection in session-start.js | session-start.js:567 | Grep `Enterprise` in MCP detection block | P0 |

#### TC-V154-SSOT: bkend-patterns.md SSOT Verification (15 TC)

| ID | Test Case | Verification | Priority |
|----|-----------|-------------|:--------:|
| V154-31 | bkend-patterns.md has Fixed Tools section | Grep `Fixed Tools` | P0 |
| V154-32 | bkend-patterns.md has MCP Resources section | Grep `MCP Resources` | P0 |
| V154-33 | bkend-patterns.md has dynamic Base URL section | Grep `Base URL` + `get_context` | P0 |
| V154-34 | bkend-patterns.md has Response Format section | Grep `Response Format` | P0 |
| V154-35 | bkend-patterns.md has Filter Operators (8) | Grep `eq`, `ne`, `gt`, `lt` etc. | P0 |
| V154-36 | bkend-patterns.md has Presigned URL section | Grep `Presigned URL` | P0 |
| V154-37 | bkend-data @imports bkend-patterns | bkend-data/SKILL.md | Grep `bkend-patterns.md` in imports | P0 |
| V154-38 | bkend-auth @imports bkend-patterns | bkend-auth/SKILL.md | Same check | P0 |
| V154-39 | bkend-storage @imports bkend-patterns | bkend-storage/SKILL.md | Same check | P0 |
| V154-40 | bkend-quickstart @imports bkend-patterns | bkend-quickstart/SKILL.md | Same check | P0 |
| V154-41 | bkend-cookbook @imports bkend-patterns | bkend-cookbook/SKILL.md | Same check | P0 |
| V154-42 | YAML frontmatter preserved (bkend-data) | bkend-data/SKILL.md | Parse YAML, verify name/description/agent | P0 |
| V154-43 | YAML frontmatter preserved (bkend-auth) | bkend-auth/SKILL.md | Same check | P0 |
| V154-44 | YAML frontmatter preserved (bkend-storage) | bkend-storage/SKILL.md | Same check | P0 |
| V154-45 | YAML frontmatter preserved (bkend-expert) | bkend-expert.md | Parse YAML, verify model: sonnet | P0 |

#### TC-V154-MCP: MCP Tool Coverage (10 TC)

| ID | Test Case | Verification | Priority |
|----|-----------|-------------|:--------:|
| V154-46 | bkend-expert has 28+ MCP tools | bkend-expert.md | Count unique `backend_*` tool names >= 28 | P0 |
| V154-47 | Table Management has 11 tools | bkend-expert.md | Count table tools = 11 | P0 |
| V154-48 | Data CRUD has 5 tools | bkend-expert.md | Count data tools = 5 | P0 |
| V154-49 | Project Management has 9 tools | bkend-expert.md | Count project tools = 9 | P0 |
| V154-50 | Fixed Tools has 3 tools | bkend-expert.md | Count fixed tools = 3 | P0 |
| V154-51 | Auth endpoints correct (no authorize/social) | bkend-expert.md | Grep absence of `authorize`, `social/link` | P0 |
| V154-52 | Storage multipart 4 endpoints | bkend-storage/SKILL.md | Grep `multipart/init`, `presigned-url`, `complete`, `abort` | P0 |
| V154-53 | download-url is POST not GET | bkend-storage/SKILL.md | Grep `POST.*download-url` | P0 |
| V154-54 | Searchable Docs 6 IDs in bkend-expert | bkend-expert.md | Count doc IDs = 6 | P0 |
| V154-55 | bkend-expert RBAC section intact | bkend-expert.md | Grep `admin`, `user`, `self`, `guest` | P0 |

---

### 3.2 TC-LIB: Script Unit Tests (195 TC)

#### TC-LIB-HOOKS: Hook Scripts (25 TC)

| ID | Script | Key Functions | TC | Priority |
|----|--------|---------------|:--:|:--------:|
| LIB-01~05 | session-start.js | detectLevel, formatWelcome, checkPDCA, MCP detection, level routing | 5 | P0 |
| LIB-06~08 | user-prompt-handler.js | detectFeatureIntent, matchImplicitAgentTrigger, calculateAmbiguityScore | 3 | P0 |
| LIB-09~10 | context-compaction.js | snapshotPDCA, cleanupOldSnapshots | 2 | P0 |
| LIB-11~12 | pre-write.js | checkDesignDoc, validatePermission | 2 | P0 |
| LIB-13~15 | unified-bash-pre.js | validateCommand, checkPermission, sanitizeInput | 3 | P0 |
| LIB-16~18 | unified-write-post.js | trackChangedFiles, suggestGapAnalysis, updatePDCA | 3 | P0 |
| LIB-19~20 | unified-bash-post.js | trackExecution, suggestNextStep | 2 | P0 |
| LIB-21~23 | skill-post.js | detectSkillUsage, updateFeatureUsage, reportSkill | 3 | P0 |
| LIB-24~25 | unified-stop.js | handleAgentStop, routeToSpecificStop | 2 | P0 |

#### TC-LIB-AGENT: Agent Stop Scripts (30 TC)

| ID | Script | Key Functions | TC | Priority |
|----|--------|---------------|:--:|:--------:|
| LIB-26~29 | gap-detector-stop.js | parseMatchRate, createTaskByRate, suggestNextAction, AskUserQuestion | 4 | P0 |
| LIB-30~33 | iterator-stop.js | parseIterationResult, updateTaskStatus, checkMaxIterations, triggerReAnalyze | 4 | P0 |
| LIB-34~35 | cto-stop.js | handleTeamShutdown, recordTeamSession | 2 | P0 |
| LIB-36~37 | team-stop.js | cleanupTeam, notifyTeamLead | 2 | P0 |
| LIB-38~39 | gap-detector-post.js | updateAnalysisDoc, persistMatchRate | 2 | P0 |
| LIB-40~41 | code-review-stop.js | formatReviewResult, updateTaskStatus | 2 | P0 |
| LIB-42~43 | learning-stop.js | trackLearningProgress, suggestNextLesson | 2 | P0 |
| LIB-44~45 | pdca-skill-stop.js | routePDCAAction, updatePDCAPhase | 2 | P0 |
| LIB-46~47 | qa-stop.js | formatQAResult, createBugReport | 2 | P0 |
| LIB-48~49 | analysis-stop.js | parseAnalysisResult, updateAnalysisStatus | 2 | P0 |
| LIB-50~55 | phase*-stop.js (6) | phaseTransition, checkDeliverables, suggestNextPhase | 6 | P0 |

#### TC-LIB-PHASE: Phase Pre/Post Scripts (20 TC)

| ID | Script | Key Functions | TC | Priority |
|----|--------|---------------|:--:|:--------:|
| LIB-56~58 | phase-transition.js | calculatePhase, validateDeliverables, transitionPhase | 3 | P0 |
| LIB-59~60 | design-validator-pre.js | checkDesignExists, loadDesignContext | 2 | P0 |
| LIB-61~62 | phase2-convention-pre.js | checkConventionExists, loadConventions | 2 | P0 |
| LIB-63~64 | phase5-design-post.js | updateDesignSystemStatus, trackComponents | 2 | P1 |
| LIB-65~66 | phase6-ui-post.js | trackUIIntegration, suggestQA | 2 | P1 |
| LIB-67~68 | phase9-deploy-pre.js | checkPreDeployRequirements, validateConfig | 2 | P1 |
| LIB-69~70 | qa-pre-bash.js | validateBashCommand, checkSafeExecution | 2 | P0 |
| LIB-71~73 | code-analyzer-pre.js | prepareAnalysisContext, loadCodeMetrics | 3 | P0 |
| LIB-74~75 | qa-monitor-post.js | parseLogOutput, detectAnomalies | 2 | P0 |

#### TC-LIB-TEAM: Team Scripts (20 TC)

| ID | Script | Key Functions | TC | Priority |
|----|--------|---------------|:--:|:--------:|
| LIB-76~79 | subagent-start-handler.js | initAgentState, addTeammate, trackSpawn | 4 | P0 |
| LIB-80~83 | subagent-stop-handler.js | updateTeammateStatus, removeTeammate, cleanupState | 4 | P0 |
| LIB-84~87 | team-idle-handler.js | detectIdleState, updateProgress, notifyLead | 4 | P0 |
| LIB-88~91 | pdca-task-completed.js | handleTaskCompletion, advancePDCA, updateProgress | 4 | P0 |
| LIB-92~95 | select-template.js | matchTemplate, resolveLevel, substituteVars | 4 | P1 |

#### TC-LIB-UTIL: Utility Scripts (10 TC)

| ID | Script | Key Functions | TC | Priority |
|----|--------|---------------|:--:|:--------:|
| LIB-96~98 | sync-folders.js | syncStructure, validatePaths, reportChanges | 3 | P1 |
| LIB-99~101 | validate-plugin.js | validateManifest, checkDependencies, verifyStructure | 3 | P1 |
| LIB-102~103 | archive-feature.js | moveDocuments, updateIndex, cleanupStatus | 2 | P0 |
| LIB-104~105 | pdca-post-write.js | trackPDCAWrite, updateFeatureStatus | 2 | P0 |

#### TC-LIB-COMMON: common.js Bridge Exports (90 TC)

| ID | Module | Export Count | TC | Priority |
|----|--------|:-----------:|:--:|:--------:|
| LIB-106~125 | PDCA (lib/pdca/) | 20 | 20 | P0 |
| LIB-126~145 | Intent (lib/intent/) | 20 | 20 | P0 |
| LIB-146~165 | Core (lib/core/) | 20 | 20 | P0 |
| LIB-166~180 | Task (lib/task/) | 15 | 15 | P0 |
| LIB-181~195 | Team (lib/team/) including state-writer 9 | 15 | 15 | P0 |

---

### 3.3 TC-HK: Hook Integration Tests (60 TC)

| ID | Event | Test Case | Trigger | Expected | Priority |
|----|-------|-----------|---------|----------|:--------:|
| HK-01 | SessionStart | Welcome message displayed | Session begin | AskUserQuestion with 4 options | P0 |
| HK-02 | SessionStart | Level detection (Starter) | No BaaS/K8s files | Level = Starter | P0 |
| HK-03 | SessionStart | Level detection (Dynamic) | .mcp.json present | Level = Dynamic | P0 |
| HK-04 | SessionStart | Level detection (Enterprise) | kubernetes/ dir | Level = Enterprise | P0 |
| HK-05 | SessionStart | PDCA status loaded | .bkit-memory.json exists | Previous PDCA shown | P0 |
| HK-06 | SessionStart | MCP detection (Dynamic) | Level = Dynamic | bkend MCP suggestion | P0 |
| HK-07 | SessionStart | MCP detection (Enterprise) | Level = Enterprise | bkend MCP suggestion (v1.5.4) | P0 |
| HK-08 | SessionStart | Output style suggestion | Level detected | Appropriate style suggested | P1 |
| HK-09 | SessionStart | Agent Teams availability check | AGENT_TEAMS env | Team mode shown/hidden | P1 |
| HK-10 | SessionStart | Session counter increment | Each start | sessionCount +1 | P0 |
| HK-11~15 | PreToolUse(Write) | Design doc check on Write | Write tool called | Warn if no design doc | P0 |
| HK-16~20 | PreToolUse(Bash) | Permission check on Bash | Bash tool called | Block rm -rf, warn rm -r | P0 |
| HK-21~25 | PostToolUse(Write) | PDCA state update on Write | Write completes | Feature file tracked | P0 |
| HK-26~30 | PostToolUse(Bash) | Command tracking on Bash | Bash completes | Execution logged | P0 |
| HK-31~33 | PostToolUse(Skill) | Skill usage tracking | Skill completes | Feature usage reported | P0 |
| HK-34~36 | UserPromptSubmit | Feature intent detection | User types message | Intent detected or not | P0 |
| HK-37~39 | UserPromptSubmit | Agent trigger matching | Implicit agent keyword | Correct agent suggested | P0 |
| HK-40~42 | UserPromptSubmit | Ambiguity detection | Ambiguous input | AskUserQuestion generated | P0 |
| HK-43~44 | PreCompact | PDCA snapshot creation | Context compaction | Snapshot saved to .pdca-snapshots/ | P0 |
| HK-45~46 | PreCompact | Old snapshot cleanup | >10 snapshots | Oldest deleted, 10 kept | P1 |
| HK-47~49 | Stop | Agent-specific stop routing | Agent stops | Correct stop script called | P0 |
| HK-50~51 | Stop | PDCA state persistence | Session ends | State saved to disk | P0 |
| HK-52~53 | TaskCompleted | PDCA auto-advance | Task marked done | Next PDCA phase suggested | P0 |
| HK-54~55 | TaskCompleted | Progress tracking | Task done | .bkit/agent-state.json updated | P1 |
| HK-56~57 | SubagentStart | Teammate state init | Agent spawned | addTeammate() called | P0 |
| HK-58 | SubagentStop | Teammate state cleanup | Agent stops | removeTeammate() called | P0 |
| HK-59~60 | TeammateIdle | Idle state tracking | Agent goes idle | updateTeammateStatus(idle) | P0 |

---

### 3.4 TC-AG: Agent Functional Tests (70 TC)

| ID | Agent | Model | Tests | Priority |
|----|-------|:-----:|:-----:|:--------:|
| AG-01~05 | cto-lead | opus | YAML frontmatter, tools, team orchestration, PDCA coordination, task assignment | P0 |
| AG-06~10 | gap-detector | opus | YAML, design-vs-impl comparison, match rate calculation, fork context, Stop hook | P0 |
| AG-11~14 | code-analyzer | opus | YAML, code quality analysis, security scan, performance check | P0 |
| AG-15~18 | design-validator | opus | YAML, doc completeness check, consistency validation, fork context | P0 |
| AG-19~22 | enterprise-expert | opus | YAML, MSA strategy, AI-native methodology, delegation | P0 |
| AG-23~26 | infra-architect | opus | YAML, AWS/K8s/Terraform, CI/CD pipeline design | P0 |
| AG-27~30 | security-architect | opus | YAML, vulnerability analysis, OWASP compliance, auth design | P0 |
| AG-31~34 | bkend-expert | sonnet | YAML, MCP tools (28+), skills_preload (3), skill binding (5) | P0 |
| AG-35~38 | pdca-iterator | sonnet | YAML, auto-fix iteration, max 5 iterations, re-analyze trigger | P0 |
| AG-39~41 | pipeline-guide | sonnet | YAML, 9-phase guide, level-specific flow, memory: user | P0 |
| AG-42~44 | starter-guide | sonnet | YAML, beginner-friendly, step-by-step, memory: user | P0 |
| AG-45~48 | product-manager | sonnet | YAML, requirements analysis, feature prioritization | P0 |
| AG-49~52 | frontend-architect | sonnet | YAML, React/Next.js, design system, component structure | P0 |
| AG-53~56 | qa-strategist | sonnet | YAML, test strategy, quality metrics, team coordination | P0 |
| AG-57~60 | qa-monitor | haiku | YAML, Docker log monitoring, real-time analysis, issue detection | P0 |
| AG-61~64 | report-generator | haiku | YAML, PDCA report synthesis, metrics aggregation | P0 |
| AG-65~70 | Cross-agent | - | Delegation chain (6 paths), model selection strategy, permission modes | P0 |

---

### 3.5 TC-SK: Skill Functional Tests (85 TC)

#### TC-SK-CORE: Core Skills (10 TC)

| ID | Skill | Tests | Priority |
|----|-------|:-----:|:--------:|
| SK-01~05 | bkit-rules | YAML, auto-PDCA application, task classification, design-first check, convention hints | P0 |
| SK-06~10 | bkit-templates | YAML, 7 template types, variable substitution, level variants | P0 |

#### TC-SK-LEVEL: Level Skills (12 TC)

| ID | Skill | Tests | Priority |
|----|-------|:-----:|:--------:|
| SK-11~14 | starter | YAML, HTML/CSS/JS guide, init command, beginner content | P0 |
| SK-15~18 | dynamic | YAML, bkend BaaS integration, fullstack guide, init command | P0 |
| SK-19~22 | enterprise | YAML, MSA/K8s/Terraform, AI-native methodology, init command | P0 |

#### TC-SK-PIPELINE: Pipeline Skills (22 TC)

| ID | Skill | Tests | Priority |
|----|-------|:-----:|:--------:|
| SK-23~24 | development-pipeline | YAML, 9-phase flow, level-specific routing | P0 |
| SK-25~26 | phase-1-schema | YAML, data modeling guide, terminology | P0 |
| SK-27~28 | phase-2-convention | YAML, coding convention definition | P0 |
| SK-29~30 | phase-3-mockup | YAML, UI/UX prototype guide | P0 |
| SK-31~32 | phase-4-api | YAML, REST API design + Zero Script QA | P0 |
| SK-33~34 | phase-5-design-system | YAML, component library, design tokens | P0 |
| SK-35~36 | phase-6-ui-integration | YAML, frontend-backend integration | P0 |
| SK-37~38 | phase-7-seo-security | YAML, SEO meta tags, security checks | P0 |
| SK-39~40 | phase-8-review | YAML, architecture review, gap analysis | P0 |
| SK-41~42 | phase-9-deployment | YAML, CI/CD, production deployment | P0 |
| SK-43~44 | pdca | YAML, 8 actions, agents multi-binding, template refs | P0 |

#### TC-SK-SPECIAL: Specialized Skills (6 TC)

| ID | Skill | Tests | Priority |
|----|-------|:-----:|:--------:|
| SK-45~46 | zero-script-qa | YAML, log-based QA methodology, Docker integration | P0 |
| SK-47~48 | code-review | YAML, code quality analysis, bug detection | P0 |
| SK-49~50 | claude-code-learning | YAML, learning/setup modes, configuration guide | P0 |
| SK-51~52 | mobile-app | YAML, React Native/Flutter/Expo guide | P1 |
| SK-53~54 | desktop-app | YAML, Electron/Tauri guide | P1 |

#### TC-SK-BKEND: bkend Skills (20 TC) — v1.5.4 Enhanced

| ID | Skill | Tests | Priority |
|----|-------|:-----:|:--------:|
| SK-55~58 | bkend-quickstart | YAML, MCP setup, resource hierarchy, Fixed Tools 3, Project Tools 9, Resources 4 | P0 |
| SK-59~62 | bkend-data | YAML, Data CRUD 5 tools, Filter Operators 8, tool names correct, @import | P0 |
| SK-63~66 | bkend-auth | YAML, search_docs workflow, REST endpoints correct, social login callback | P0 |
| SK-67~70 | bkend-storage | YAML, search_docs workflow, Presigned URL, multipart 4 endpoints, download-url POST | P0 |
| SK-71~74 | bkend-cookbook | YAML, 10 project guides, 4 full guides, troubleshooting, URL fixes | P0 |

#### TC-SK-CROSS: Cross-Skill Tests (5 TC)

| ID | Test Case | Priority |
|----|-----------|:--------:|
| SK-75 | All 26 skills have valid YAML frontmatter | P0 |
| SK-76 | All skills with `agent:` field reference existing agents | P0 |
| SK-77 | All skills with `imports:` reference existing files | P0 |
| SK-78 | No duplicate skill names | P0 |
| SK-79~85 | 8-language triggers present in all level/bkend skills | P0 |

---

### 3.6 TC-PDCA: PDCA Workflow Tests (35 TC)

| ID | Test Case | Phase | Priority |
|----|-----------|:-----:|:--------:|
| PDCA-01 | /pdca plan creates plan document | Plan | P0 |
| PDCA-02 | /pdca plan uses plan.template.md | Plan | P0 |
| PDCA-03 | Plan document has required sections | Plan | P0 |
| PDCA-04 | .bkit-memory.json updates phase to "plan" | Plan | P0 |
| PDCA-05 | /pdca design requires plan doc first | Design | P0 |
| PDCA-06 | /pdca design creates design document | Design | P0 |
| PDCA-07 | Design doc references plan content | Design | P0 |
| PDCA-08 | .bkit-memory.json updates phase to "design" | Design | P0 |
| PDCA-09 | /pdca do provides implementation guide | Do | P0 |
| PDCA-10 | Do phase references design document | Do | P0 |
| PDCA-11 | .bkit-memory.json updates phase to "do" | Do | P0 |
| PDCA-12 | /pdca analyze calls gap-detector agent | Check | P0 |
| PDCA-13 | Analysis creates docs/03-analysis/ document | Check | P0 |
| PDCA-14 | Match rate calculated and stored | Check | P0 |
| PDCA-15 | Match rate >= 90% suggests report | Check | P0 |
| PDCA-16 | Match rate < 90% suggests iterate | Check | P0 |
| PDCA-17 | /pdca iterate calls pdca-iterator agent | Act | P0 |
| PDCA-18 | Max 5 iterations enforced | Act | P0 |
| PDCA-19 | Auto re-analyze after fix | Act | P0 |
| PDCA-20 | .bkit-memory.json tracks iterationCount | Act | P0 |
| PDCA-21 | /pdca report calls report-generator | Report | P0 |
| PDCA-22 | Report document created in docs/04-report/ | Report | P0 |
| PDCA-23 | Report references all PDCA phases | Report | P0 |
| PDCA-24 | .bkit-memory.json updates phase to "completed" | Report | P0 |
| PDCA-25 | /pdca archive moves documents | Archive | P0 |
| PDCA-26 | Archive creates docs/archive/YYYY-MM/ folder | Archive | P0 |
| PDCA-27 | Archive --summary preserves metrics | Archive | P1 |
| PDCA-28 | /pdca cleanup removes archived features | Cleanup | P1 |
| PDCA-29 | /pdca status shows current state | Status | P0 |
| PDCA-30 | /pdca next suggests correct next phase | Next | P0 |
| PDCA-31 | Task chain: Plan→Design→Do→Check blockedBy | Tasks | P0 |
| PDCA-32 | Task auto-creation for features | Tasks | P0 |
| PDCA-33 | Quick fix (<10 lines) skips PDCA | Tasks | P0 |
| PDCA-34 | Major feature (>=200 lines) requires PDCA | Tasks | P0 |
| PDCA-35 | /pdca team starts CTO team mode | Team | P1 |

---

### 3.7 TC-PHIL: Philosophy Compliance Tests (50 TC) — NEW

#### TC-PHIL-AF: Automation First (12 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-01 | Session auto-detection | User opens bkit session | Level auto-detected without user input | Automation First |
| PHIL-02 | PDCA auto-suggestion | User implements code without plan | pre-write.js suggests creating plan/design | Automation First |
| PHIL-03 | Gap analysis auto-suggest | After feature implementation | unified-write-post.js suggests /pdca analyze | Automation First |
| PHIL-04 | Output style auto-match | Level detected as Dynamic | bkit-pdca-guide suggested automatically | Automation First |
| PHIL-05 | Agent Teams auto-suggest | Major feature detected (>= 200 lines) | CTO team suggested automatically | Automation First |
| PHIL-06 | Task auto-creation | Feature classification = feature/major | Task created automatically with blockedBy | Automation First |
| PHIL-07 | Check-Act auto-iteration | Match rate < 70% | pdca-iterator strongly recommended | Automation First |
| PHIL-08 | Report auto-suggest | Match rate >= 90% | report-generator suggested | Automation First |
| PHIL-09 | Agent trigger auto-detect | User says "이거 맞아?" | gap-detector triggered implicitly | Automation First |
| PHIL-10 | Skill trigger auto-detect | User mentions "login feature" | dynamic skill triggered | Automation First |
| PHIL-11 | Session counter auto-increment | Each session start | sessionCount++ in .bkit-memory.json | Automation First |
| PHIL-12 | PDCA status auto-load | Previous session had active PDCA | Status shown at session start | Automation First |

#### TC-PHIL-NG: No Guessing (10 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-13 | Design doc check | Write without design doc | pre-write.js warns about missing design | No Guessing |
| PHIL-14 | Ambiguous input detection | "make it better" (no context) | Ambiguity score >= 50, AskUserQuestion | No Guessing |
| PHIL-15 | Feature intent clarification | "add a feature" (no specifics) | AskUserQuestion to clarify scope | No Guessing |
| PHIL-16 | Design-first workflow | User requests implementation | Check plan/design first, suggest if missing | No Guessing |
| PHIL-17 | Permission confirmation | Dangerous bash command | pre-bash asks for confirmation | No Guessing |
| PHIL-18 | Match rate threshold | gap-detector result < 90% | Explicit suggestion instead of silent pass | No Guessing |
| PHIL-19 | Unknown level handling | Cannot determine level | Default to Starter, not guess | No Guessing |
| PHIL-20 | Agent delegation clarity | Task outside agent scope | Explicit delegation to correct agent | No Guessing |
| PHIL-21 | Magic word bypass | User types "!hotfix" | Ambiguity score = 0, skip confirmation | No Guessing |
| PHIL-22 | bkend MCP not configured | No .mcp.json for bkend | Suggest MCP setup guide, not guess endpoint | No Guessing |

#### TC-PHIL-DC: Docs = Code (8 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-23 | Plan before design | /pdca design without plan | Error: "Plan document required first" | Docs = Code |
| PHIL-24 | Design before implement | Start coding without design | Suggest creating design doc | Docs = Code |
| PHIL-25 | Gap analysis detects drift | Implementation differs from design | Match rate < 100%, gaps listed | Docs = Code |
| PHIL-26 | Template consistency | Create plan doc | Uses plan.template.md format | Docs = Code |
| PHIL-27 | PDCA doc chain integrity | Full PDCA cycle | All 4 docs exist in correct locations | Docs = Code |
| PHIL-28 | Archive preserves docs | /pdca archive feature | Documents moved, not deleted | Docs = Code |
| PHIL-29 | bkend-patterns SSOT | 5 bkend skills | All @import same patterns file | Docs = Code |
| PHIL-30 | v1.5.4 MCP accuracy | bkend skills vs official docs | 100% match (10/10 GAPs resolved) | Docs = Code |

#### TC-PHIL-VA: Verification Ability (5 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-31 | gap-detector agent exists | /pdca analyze | gap-detector invoked, design-impl comparison | Verification |
| PHIL-32 | code-analyzer agent exists | Code review request | code-analyzer invoked, quality report | Verification |
| PHIL-33 | design-validator agent exists | Design review request | design-validator invoked, completeness check | Verification |
| PHIL-34 | Match rate quantification | After gap analysis | Numeric match rate (0-100%) reported | Verification |
| PHIL-35 | Quality gate enforcement | Match rate < 90% | Block report generation, suggest iteration | Verification |

#### TC-PHIL-DS: Direction Setting (5 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-36 | PDCA plan structure | /pdca plan feature | Goals, scope, success criteria defined | Direction |
| PHIL-37 | Level-specific guidance | Starter user starts | starter-guide provides step-by-step | Direction |
| PHIL-38 | Pipeline phase guidance | /development-pipeline start | 9-phase roadmap with level filtering | Direction |
| PHIL-39 | CTO orchestration | /pdca team feature | CTO-lead sets direction for all agents | Direction |
| PHIL-40 | Template-driven docs | Create any PDCA doc | Consistent template structure | Direction |

#### TC-PHIL-QS: Quality Standards (5 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-41 | bkit-rules auto-apply | Any code change | Convention hints, PDCA suggestions | Quality |
| PHIL-42 | Code quality metrics | code-analyzer invoked | Quality score, issues list | Quality |
| PHIL-43 | Security check | phase-7-seo-security | OWASP compliance, vulnerability scan | Quality |
| PHIL-44 | Consistent naming | Code review | PascalCase/camelCase/kebab-case enforced | Quality |
| PHIL-45 | Zero Script QA | Phase 4 completion | Log-based QA methodology available | Quality |

#### TC-PHIL-CE: Context Engineering (5 TC)

| ID | Scenario | User Action | Expected bkit Behavior | Verifies |
|----|----------|-------------|----------------------|----------|
| PHIL-46 | FR-01: 4-level hierarchy | Config resolution | L4 > L3 > L2 > L1 priority | Context Engineering |
| PHIL-47 | FR-02: @import directive | Skill loads template | Variable substitution works | Context Engineering |
| PHIL-48 | FR-04: UserPromptSubmit | User types message | Intent/trigger/ambiguity detected | Context Engineering |
| PHIL-49 | FR-05: Permission hierarchy | Write/Bash tool use | deny/ask/allow enforced | Context Engineering |
| PHIL-50 | FR-07: PreCompact | Context compaction | PDCA state snapshot preserved | Context Engineering |

---

### 3.8 TC-UX: User Experience Scenario Tests (40 TC)

#### TC-UX-BEG: Beginner Journey (10 TC)

| ID | Scenario | Priority |
|----|----------|:--------:|
| UX-01 | First session → 4 options displayed → User selects "First Project" | P1 |
| UX-02 | /starter → HTML/CSS project initialized | P1 |
| UX-03 | /development-pipeline start → Phase 1 guide shown | P1 |
| UX-04 | Write HTML file → No PDCA pressure (Starter-level) | P1 |
| UX-05 | Error encountered → starter-guide provides friendly help | P1 |
| UX-06 | Session end → Progress saved in .bkit-memory.json | P1 |
| UX-07 | Next session → Previous work recognized | P1 |
| UX-08 | /claude-code-learning → Setup guide shown | P1 |
| UX-09 | Output style auto-set to bkit-learning | P1 |
| UX-10 | /bkit → Help command shows all available functions | P1 |

#### TC-UX-DEV: Developer Journey (15 TC)

| ID | Scenario | Priority |
|----|----------|:--------:|
| UX-11 | Dynamic project → /pdca plan user-auth | P1 |
| UX-12 | Plan created → /pdca design user-auth | P1 |
| UX-13 | Design created → /pdca do user-auth | P1 |
| UX-14 | Implementation → pre-write checks design doc | P1 |
| UX-15 | Code complete → /pdca analyze user-auth | P1 |
| UX-16 | Match rate 75% → pdca-iterator suggested | P1 |
| UX-17 | Iteration complete → Re-analyze at 95% | P1 |
| UX-18 | Match rate 95% → /pdca report user-auth | P1 |
| UX-19 | Report generated → /pdca archive user-auth | P1 |
| UX-20 | /pdca status → Full progress visualization | P1 |
| UX-21 | bkend-data skill → Data CRUD with MCP tools | P1 |
| UX-22 | bkend-auth skill → Auth with search_docs workflow | P1 |
| UX-23 | bkend-storage skill → File upload with Presigned URL | P1 |
| UX-24 | /code-review → Quality analysis report | P1 |
| UX-25 | Multi-language: Korean input → Correct agent triggered | P1 |

#### TC-UX-TEAM: CTO Team Journey (10 TC)

| ID | Scenario | Priority |
|----|----------|:--------:|
| UX-26 | /pdca team user-auth → CTO team proposed | P1 |
| UX-27 | Team composition → Level-appropriate agents | P1 |
| UX-28 | CTO-lead orchestrates → Tasks assigned to teammates | P1 |
| UX-29 | Teammate completes task → Progress tracked | P1 |
| UX-30 | /pdca team status → All teammate statuses shown | P1 |
| UX-31 | Quality gate → Match rate checked by council | P1 |
| UX-32 | Team shutdown → Graceful cleanup | P1 |
| UX-33 | /pdca team cleanup → Resources released | P1 |
| UX-34 | Enterprise 5-member team → All roles active | P1 |
| UX-35 | Dynamic 3-member team → Correct subset | P1 |

#### TC-UX-ENT: Enterprise Journey (5 TC)

| ID | Scenario | Priority |
|----|----------|:--------:|
| UX-36 | Enterprise init → MSA structure created | P1 |
| UX-37 | /phase-7-seo-security → Security audit complete | P1 |
| UX-38 | /phase-9-deployment → K8s/Terraform guide | P1 |
| UX-39 | Output style bkit-enterprise → CTO-level analysis | P1 |
| UX-40 | Full 9-phase pipeline → All phases available | P1 |

---

### 3.9 TC-CFG: Config & Template Tests (25 TC)

| ID | Test Case | Priority |
|----|-----------|:--------:|
| CFG-01 | bkit.config.json valid JSON schema | P0 |
| CFG-02 | 26 level detection directories configured | P0 |
| CFG-03 | 8 code extensions configured | P0 |
| CFG-04 | PDCA matchRateThreshold = 90 | P0 |
| CFG-05 | maxIterations = 5 | P0 |
| CFG-06 | 4 permission rules (Write/Edit/Bash/rm) | P0 |
| CFG-07 | 8 supported languages listed | P0 |
| CFG-08 | 4 output styles available | P0 |
| CFG-09 | team.enabled = true | P0 |
| CFG-10 | team.maxTeammates = 5 | P0 |
| CFG-11~17 | 7 template files exist and valid | P0 |
| CFG-18~20 | 3 shared templates exist (api, error, naming) | P0 |
| CFG-21 | hooks.json has 10 event types | P0 |
| CFG-22 | hooks.json has 11 entries | P0 |
| CFG-23 | plugin.json valid manifest | P0 |
| CFG-24 | Output style files exist (4 files) | P1 |
| CFG-25 | bkit.config.schema.json exists | P1 |

---

### 3.10 TC-TEAM: CTO Team Orchestration Tests (30 TC)

| ID | Test Case | Priority |
|----|-----------|:--------:|
| TEAM-01 | Dynamic: 3 teammates (developer, frontend, qa) | P0 |
| TEAM-02 | Enterprise: 5 teammates (architect, developer, qa, reviewer, security) | P0 |
| TEAM-03 | CTO-lead is always opus model | P0 |
| TEAM-04 | Plan phase: leader pattern | P0 |
| TEAM-05 | Design phase (Dynamic): leader pattern | P0 |
| TEAM-06 | Design phase (Enterprise): council pattern | P0 |
| TEAM-07 | Do phase: swarm pattern (both levels) | P0 |
| TEAM-08 | Check phase: council pattern (both levels) | P0 |
| TEAM-09 | Act phase (Dynamic): leader pattern | P0 |
| TEAM-10 | Act phase (Enterprise): watchdog pattern | P0 |
| TEAM-11 | state-writer: initAgentState() creates file | P0 |
| TEAM-12 | state-writer: addTeammate() appends roster | P0 |
| TEAM-13 | state-writer: updateTeammateStatus() changes state | P0 |
| TEAM-14 | state-writer: removeTeammate() removes by name | P0 |
| TEAM-15 | state-writer: updateProgress() writes data | P0 |
| TEAM-16 | state-writer: addRecentMessage() ring buffer | P0 |
| TEAM-17 | state-writer: cleanupAgentState() cleanup | P0 |
| TEAM-18 | state-writer: MAX_TEAMMATES=10 enforcement | P0 |
| TEAM-19 | state-writer: ring buffer limit 50 messages | P0 |
| TEAM-20 | state-writer: atomic write (tmp + rename) | P1 |
| TEAM-21 | SubagentStart → addTeammate() called | P0 |
| TEAM-22 | SubagentStop → removeTeammate() called | P0 |
| TEAM-23 | TeammateIdle → updateTeammateStatus(idle) | P0 |
| TEAM-24 | TaskCompleted → updateProgress() called | P0 |
| TEAM-25 | Team shutdown → all agents confirmed | P0 |
| TEAM-26 | Team cleanup → resources released | P0 |
| TEAM-27 | .bkit/agent-state.json schema v1.0 | P0 |
| TEAM-28 | common.js exports 39 team functions | P0 |
| TEAM-29 | Starter level cannot use team mode | P0 |
| TEAM-30 | AGENT_TEAMS env not set → graceful fallback | P0 |

---

### 3.11 TC-ML: Multi-Language Tests (24 TC)

| ID | Language | Test Case | Priority |
|----|:--------:|-----------|:--------:|
| ML-01~03 | EN | Agent trigger, skill trigger, ambiguity detection | P2 |
| ML-04~06 | KO | Agent trigger (검증, 개선), skill trigger (로그인), ambiguity | P2 |
| ML-07~09 | JA | Agent trigger (確認, 改善), skill trigger (ログイン), ambiguity | P2 |
| ML-10~12 | ZH | Agent trigger (验证, 改进), skill trigger (登录), ambiguity | P2 |
| ML-13~15 | ES | Agent trigger (verificar, mejorar), skill trigger (inicio de sesion), ambiguity | P2 |
| ML-16~18 | FR | Agent trigger (vérifier, améliorer), skill trigger (connexion), ambiguity | P2 |
| ML-19~21 | DE | Agent trigger (prüfen, verbessern), skill trigger (Anmeldung), ambiguity | P2 |
| ML-22~24 | IT | Agent trigger (verificare, migliorare), skill trigger (accesso), ambiguity | P2 |

---

### 3.12 TC-EDGE: Edge Case Tests (20 TC)

| ID | Test Case | Priority |
|----|-----------|:--------:|
| EDGE-01 | Hook timeout (> 5000ms) → graceful degradation | P2 |
| EDGE-02 | Invalid JSON in .bkit-memory.json → no crash | P2 |
| EDGE-03 | Missing .pdca-status.json → created fresh | P2 |
| EDGE-04 | Concurrent PDCA features → correct isolation | P2 |
| EDGE-05 | Empty skill YAML frontmatter → no crash | P2 |
| EDGE-06 | Circular @import → detected and blocked | P2 |
| EDGE-07 | TTL cache expiry → stale data refreshed | P2 |
| EDGE-08 | Max iterations (5) reached → stops cleanly | P2 |
| EDGE-09 | 51st message in ring buffer → oldest removed | P2 |
| EDGE-10 | 11th teammate → MAX_TEAMMATES enforcement | P2 |
| EDGE-11 | Context compaction with >10 snapshots → cleanup | P2 |
| EDGE-12 | Session counter overflow → handles large numbers | P2 |
| EDGE-13 | Very long feature name → no path issues | P2 |
| EDGE-14 | Unicode in feature name → correct handling | P2 |
| EDGE-15 | Git conflict state → PDCA status preserved | P2 |
| EDGE-16 | Empty design doc → gap-detector reports 0% | P2 |
| EDGE-17 | All tasks completed → no orphan tasks | P2 |
| EDGE-18 | Plugin dir not found → graceful error | P2 |
| EDGE-19 | Multiple skills with same trigger → priority resolution | P2 |
| EDGE-20 | Agent memory file corrupted → reset gracefully | P2 |

---

### 3.13 TC-REG: Regression Tests (15 TC)

| ID | Test Case | Baseline | Priority |
|----|-----------|----------|:--------:|
| REG-01 | BUG-01 confidence >= 0.8 (not > 0.8) | v1.5.2 fix | P2 |
| REG-02 | 10 hook event types intact | v1.5.3 | P2 |
| REG-03 | 16 agents intact | v1.5.3 | P2 |
| REG-04 | 26 skills intact | v1.5.3 | P2 |
| REG-05 | common.js 180 exports | v1.5.3 | P2 |
| REG-06 | state-writer 9 functions accessible via common.js | v1.5.3 GAP-01 fix | P2 |
| REG-07 | SubagentStart hook registered | v1.5.3 | P2 |
| REG-08 | SubagentStop hook registered | v1.5.3 | P2 |
| REG-09 | TeammateIdle hook registered | v1.5.3 | P2 |
| REG-10 | team.enabled = true default | v1.5.3 | P2 |
| REG-11 | .bkit/agent-state.json schema v1.0 | v1.5.3 | P2 |
| REG-12 | PDCA archive --summary flag works | v1.4.8 | P2 |
| REG-13 | PDCA cleanup removes archived features | v1.4.8 | P2 |
| REG-14 | 8-language triggers in all level skills | v1.4.5 | P2 |
| REG-15 | @import variable substitution ($PLUGIN_ROOT) | v1.4.2 | P2 |

---

## 4. CTO Team Composition

### 4.1 Team Strategy

| Phase | Pattern | Team |
|-------|:-------:|------|
| Plan | Leader | CTO Lead writes plan (this document) |
| Design | Council | qa-strategist + code-analyzer + gap-detector |
| Do | Swarm | 4 parallel execution agents |
| Check | Council | qa-strategist + code-analyzer review results |
| Act | Leader | CTO Lead fixes issues |

### 4.2 Execution Agents (Do Phase)

| Agent | Name | Model | TC Range | Files |
|-------|------|:-----:|:--------:|-------|
| qa-unit | qa-unit | sonnet | TC-LIB (195 TC) | 45 scripts, lib modules |
| qa-hooks-int | qa-hooks-int | sonnet | TC-HK + TC-TEAM (90 TC) | hooks, scripts, agents |
| qa-skills-agents | qa-skills-agents | sonnet | TC-AG + TC-SK (155 TC) | 16 agents, 26 skills |
| qa-philosophy-ux | qa-philosophy-ux | opus | TC-PHIL + TC-UX (90 TC) | philosophy docs, scenarios |

### 4.3 Supplementary Agents

| Agent | Role | TC Range |
|-------|------|:--------:|
| CTO Lead | TC-V154, TC-CFG, TC-ML, TC-EDGE, TC-REG | 139 TC |

---

## 5. Execution Strategy

### 5.1 Test Method

Node.js test runner executed from project root directory, same as v1.5.3:

```bash
node /tmp/bkit-v154-test-{category}.js
```

Each test script:
1. Reads target files using `fs.readFileSync()`
2. Parses YAML frontmatter for skills/agents
3. Greps for expected patterns using regex
4. Reports PASS/FAIL/SKIP with reasons
5. Outputs JSON summary

### 5.2 Execution Order

```
Phase 1: TC-V154 (55 TC) — v1.5.4 changes first
Phase 2: TC-LIB (195 TC) — Unit tests
Phase 3: TC-HK + TC-TEAM (90 TC) — Integration tests
Phase 4: TC-AG + TC-SK (155 TC) — Functional tests
Phase 5: TC-PDCA (35 TC) — Workflow tests
Phase 6: TC-PHIL + TC-UX (90 TC) — Philosophy + UX scenarios
Phase 7: TC-CFG + TC-ML + TC-EDGE + TC-REG (84 TC) — Supplementary
```

### 5.3 SKIP Criteria

| Criteria | Expected SKIP | Reason |
|----------|:------------:|--------|
| Runtime-only (Agent Teams) | ~20 | Requires live Claude Code session |
| Environment-dependent | ~10 | Requires bkend MCP connection |
| Live URL verification | ~8 | Requires WebFetch to external URLs |
| Interactive UX flows | ~15 | Requires human interaction |
| **Total Expected SKIP** | **~53** | |

---

## 6. Success Criteria

### 6.1 Definition of Done

| Criteria | Target |
|----------|:------:|
| Pass Rate (excluding SKIP) | >= 99.5% |
| FAIL count | 0 (after Act iterations) |
| v1.5.4 changes verified | 55/55 TC PASS |
| Philosophy compliance verified | 50/50 TC PASS |
| No regression from v1.5.3 | 15/15 TC PASS |
| Max Act iterations | <= 2 |

### 6.2 Quality Gates

```
Gate 1: TC-V154 100% PASS → Proceed to Unit tests
Gate 2: TC-LIB >= 99% PASS → Proceed to Integration tests
Gate 3: TC-HK + TC-TEAM >= 99% PASS → Proceed to Functional tests
Gate 4: TC-AG + TC-SK >= 99% PASS → Proceed to PDCA/Philosophy tests
Gate 5: TC-PHIL 100% PASS → Philosophy compliance certified
Gate 6: Overall >= 99.5% → Release approved
```

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|:------:|:----------:|------------|
| Context window limit during test execution | High | Medium | Split into 7 execution phases, separate test scripts |
| Agent Teams unavailability | Medium | Low | Fallback to single-session sequential execution |
| v1.5.4 files not committed | Low | Low | Test from working tree (git diff verifiable) |
| Philosophy tests too subjective | Medium | Medium | Ground each TC in specific code behavior, not opinion |
| SKIP count exceeds estimate | Low | Medium | Accept up to 60 SKIPs, document reasons |

---

## 8. Schedule

```
Plan Phase:    CTO Lead + 4 research agents (completed: this document)
Design Phase:  Test architecture document (if needed, or proceed directly)
Do Phase:      4 execution agents parallel (estimated: 1 session)
Check Phase:   CTO Lead + council review (estimated: inline)
Act Phase:     Fix issues, re-run failing categories (estimated: 0-1 iterations)
Report Phase:  Completion report
```

---

## 9. Philosophy Alignment Summary

This test plan embodies bkit's own principles:

| Philosophy | How This Plan Complies |
|------------|----------------------|
| **Automation First** | Test scripts auto-execute, auto-report, auto-categorize |
| **No Guessing** | Every TC has specific verification method (Grep, parse, count) |
| **Docs = Code** | Plan document drives test execution (this doc = test design) |
| **Verification Ability** | 719 TC verify 100% of bkit capabilities |
| **Direction Setting** | Clear P0/P1/P2 priority, phased execution order |
| **Quality Standards** | 99.5% pass rate target, quality gates per phase |
| **Context Engineering** | Test categories mirror bkit's own architecture layers |
| **PDCA Methodology** | Plan (this) → Do (execute) → Check (verify) → Act (fix) |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-14 | Initial comprehensive test plan | CTO Team |
| 1.1 | 2026-02-14 | Agent research integrated: qa-library (138 TC scripts detail), qa-hooks (74 TC hook chain), qa-philosophy (48 UX scenarios), qa-bkend-v154 (60 TC line-level verification) | CTO Team |

---

## Appendix A: Research Agent Findings Summary

### A.1 qa-library: Scripts Analysis (45 files)

- **Unit-Testable Functions**: 34 (across 45 scripts)
- **Only 3 scripts export `run()`**: pdca-post-write.js, cto-stop.js, team-stop.js
- **Top 10 Highly Testable**: validate-plugin/parseFrontmatter (~15 TC), phase-transition/getNextPhase (~12 TC), unified-bash-pre handlers (~12 TC), pdca-skill-stop/determinePdcaTransition (~10 TC)
- **Unified Handler Pattern**: 4 consolidated handlers (bash-pre, write-post, bash-post, stop) - highest test ROI
- **Stop Hooks**: 19 scripts (largest category), most are simple outputAllow wrappers
- **Estimated TC**: ~93 unit + ~45 integration = ~138 TC

### A.2 qa-hooks: Hook Chain Analysis (10 events, 16 agents, 26 skills)

- **13 Hook Entries**: SessionStart(12 TC), PreToolUse/Write(8), PreToolUse/Bash(6), PostToolUse/Write(5), PostToolUse/Bash(3), PostToolUse/Skill(5), Stop(8), UserPromptSubmit(7), PreCompact(3), TaskCompleted(6), SubagentStart(4), SubagentStop(4), TeammateIdle(3)
- **Key Integration Chain**: SessionStart→UserPromptSubmit→PreToolUse→PostToolUse→Stop→TaskCompleted
- **Agent Teams Lifecycle**: SubagentStart→SubagentStop→TeammateIdle (full lifecycle)
- **Model Distribution**: 5 opus, 7 sonnet, 2 haiku, 1 external
- **Memory Scopes**: 14 project-scoped, 2 user-scoped (pipeline-guide, starter-guide)
- **Estimated TC**: 74 TC

### A.3 qa-philosophy: Philosophy-Aligned UX Scenarios (48 TC)

- **8 Philosophy Categories**: Automation First(6), No Guessing(6), Docs=Code(6), Verification(6), Direction(6), Quality(6), Context Engineering(8), PDCA Methodology(9)
- **Cross-Level Scenarios**: 3 (Starter/Dynamic/Enterprise journeys)
- **Negative Cases**: 3 (principle violation prevention)
- **All scenarios grounded in**: hooks.json events, bkit.config.json settings, scripts/*.js logic branches
- **Key verification scripts**: session-start.js, pre-write.js, user-prompt-handler.js, gap-detector-stop.js, iterator-stop.js

### A.4 qa-bkend-v154: v1.5.4 Changes (60 TC)

- **Per-GAP verification**: 48 TC covering all 10 GAPs with exact line numbers
- **SSOT verification**: 6 TC (patterns-expert-quickstart cross-consistency)
- **URL Structure**: 4 TC (en/ prefix, no src/ prefix)
- **Structural**: 2 TC (line count verification)
- **Priority Split**: P0=40, P1=17, P2=3
- **Key findings**: Zero old tool names remaining, all 5 bkend skills correctly @import bkend-patterns.md, dynamic/SKILL.md line 289 has `_id` in TypeScript example (out of scope, worth noting)
