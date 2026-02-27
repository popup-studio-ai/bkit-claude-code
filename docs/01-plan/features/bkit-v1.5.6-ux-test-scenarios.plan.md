---
template: plan
version: 1.2
description: Comprehensive UX test scenario plan for bkit v1.5.6
variables:
  - feature: bkit-v1.5.6-ux-test-scenarios
  - date: 2026-02-27
  - author: product-manager
  - project: bkit-claude-code
  - version: 1.5.6
---

# bkit v1.5.6 UX Test Scenarios Planning Document

> **Summary**: Comprehensive user experience test scenarios for bkit v1.5.6, covering all user-facing features from first-time setup through full PDCA cycles, skill invocation, agent triggering, and v1.5.6-specific improvements.
>
> **Project**: bkit-claude-code
> **Version**: 1.5.6
> **Author**: product-manager
> **Date**: 2026-02-27
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

Define complete user experience test scenarios for bkit v1.5.6 that validate every user-facing touchpoint. These scenarios serve as the source of truth for QA planning, manual testing, and future automated test coverage.

### 1.2 Background

bkit v1.5.6 introduces four ENH improvements (ENH-48 through ENH-51) built on Claude Code v2.1.59:
- ENH-48: Auto-Memory integration (Memory Systems section in SessionStart)
- ENH-49: /copy command guidance after code generation skills
- ENH-50: CTO Team Memory Management Guide
- ENH-51: Remote Control compatibility pre-check documentation

The existing Check phase verified implementation correctness (30/30 PASS), but UX test scenarios validate the end-to-end user journey from a human operator perspective. No prior dedicated UX test plan exists for bkit.

### 1.3 Related Documents

- v1.5.6 Report: `docs/04-report/features/bkit-v1.5.6-cc-v2159-enhancement.report.md`
- bkit Help: `commands/bkit.md`
- Session Hook: `hooks/session-start.js`
- Config: `bkit.config.json`

---

## 2. Scope

### 2.1 In Scope

- [ ] First-time user experience (installation, SessionStart, level detection)
- [ ] PDCA full cycle (plan → design → do → analyze → iterate → report → archive → cleanup)
- [ ] All 12 user-invocable skills via slash commands
- [ ] Phase skills (9) auto-invocation via development pipeline
- [ ] Skill auto-detection from natural language in 8 supported languages
- [ ] All 16 agents trigger by keywords
- [ ] Agent memory persistence across sessions
- [ ] CTO Team Mode (/pdca team) for Dynamic and Enterprise projects
- [ ] v1.5.6 specific UX (Memory Systems guidance, /memory, /copy, Stop event tip)
- [ ] Configuration options and customization (bkit.config.json)
- [ ] Output styles selection and setup (/output-style, /output-style-setup)
- [ ] Hook behavior (SessionStart, skill-post, unified-stop)
- [ ] Error recovery scenarios

### 2.2 Out of Scope

- Internal library unit tests (lib/common.js, lib/pdca/, lib/task/, etc.)
- Hook event JSON schema validation
- Agent-memory file format verification
- bkend MCP tool accuracy (covered by bkend-mcp-accuracy-fix PDCA)
- Remote Control compatibility (blocked by #28379, covered by ENH-51 docs)
- Windows-specific behavior differences

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Document test scenarios for first-time user installation and SessionStart output | High | Pending |
| FR-02 | Document test scenarios for all 3 project level detections (Starter/Dynamic/Enterprise) | High | Pending |
| FR-03 | Document PDCA full cycle scenarios including error cases (missing prerequisites) | High | Pending |
| FR-04 | Document scenarios for all 12 user-invocable skills | High | Pending |
| FR-05 | Document scenarios for 9 phase skills auto-invocation | Medium | Pending |
| FR-06 | Document natural language trigger scenarios in all 8 supported languages | Medium | Pending |
| FR-07 | Document all 16 agent keyword trigger scenarios | High | Pending |
| FR-08 | Document agent memory persistence verification scenarios | Medium | Pending |
| FR-09 | Document CTO Team Mode scenarios for Dynamic and Enterprise levels | Medium | Pending |
| FR-10 | Document v1.5.6 specific UX scenarios (Memory Systems, /memory, /copy tip) | High | Pending |
| FR-11 | Document output style selection and setup scenarios | Medium | Pending |
| FR-12 | Document error recovery scenarios (invalid command, missing deps, session interruption) | High | Pending |
| FR-13 | Assign P0/P1/P2 priority and manual/automated classification to each scenario | High | Pending |
| FR-14 | Define preconditions, steps, and expected results for each scenario | High | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Completeness | All 7 UX domain areas covered with at least one scenario each | Manual checklist review |
| Traceability | Each scenario maps to a specific feature, hook, or skill | Scenario metadata |
| Reproducibility | Preconditions are specific enough that any tester can set up the state | Peer review |
| Maintainability | Scenarios use feature names, not hardcoded version strings where possible | Review |

---

## 4. UX Test Scenario Domains

### Domain 1: First-Time User Experience

**Coverage Goal**: Validate the experience from zero state through initial orientation.

---

#### TC-FTU-01: Plugin Installation Confirmation

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: bkit installed via Claude Code plugin marketplace or locally. New project directory with no prior bkit state.
- **Steps**:
  1. Open Claude Code in project directory.
  2. Observe session startup output.
- **Expected Result**: SessionStart hook fires. Output contains "bkit Vibecoding Kit v1.5.6 - Session Startup" header. No error messages appear. AskUserQuestion is called on first message.
- **Pass Criteria**: Version string matches installed version. Hook output is structured and readable.

---

#### TC-FTU-02: New User Onboarding AskUserQuestion

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Project has no `.bkit-memory.json` or `docs/01-plan/` directory. No existing PDCA work.
- **Steps**:
  1. Start Claude Code session.
  2. Send any first message (e.g., "hello").
- **Expected Result**: Claude calls AskUserQuestion with options: "Learn bkit", "Learn Claude Code", "Start new project", "Start freely". User sees the four options clearly.
- **Pass Criteria**: AskUserQuestion is invoked before any other response. Options are present and navigable.

---

#### TC-FTU-03: Returning User Resume Prompt

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: `.bkit-memory.json` exists with a current PDCA feature in progress (e.g., phase = "design").
- **Steps**:
  1. Start Claude Code session in the same project directory.
  2. Send first message.
- **Expected Result**: SessionStart output includes "Previous Work Detected" section showing feature name, current phase, and match rate (if applicable). AskUserQuestion offers: "Continue {feature}", "Start new task", "Check status".
- **Pass Criteria**: Feature name and phase are accurately reflected from `.bkit-memory.json`.

---

#### TC-FTU-04: Starter Level Detection

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Project directory has no `kubernetes/`, `terraform/`, `k8s/`, `infra/`, `lib/bkend/`, `supabase/`, `api/`, `backend/` directories, no `.mcp.json`, no `docker-compose.yml`.
- **Steps**:
  1. Start Claude Code session.
  2. Observe the Output Styles section in SessionStart output.
- **Expected Result**: Output shows "Recommended for Starter level: `bkit-learning`". No CTO Team section appears (Starter does not support Team Mode).
- **Pass Criteria**: Level detected as "Starter". Suggested output style is `bkit-learning`.

---

#### TC-FTU-05: Dynamic Level Detection

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Project directory contains `.mcp.json` or `docker-compose.yml` or a `backend/` directory.
- **Steps**:
  1. Start Claude Code session.
  2. Observe SessionStart output.
- **Expected Result**: Output shows "Recommended for Dynamic level: `bkit-pdca-guide`". CTO Team section appears with Dynamic configuration (3 teammates: developer, frontend, qa).
- **Pass Criteria**: Level detected as "Dynamic". bkend MCP section appears if `.mcp.json` contains bkend config.

---

#### TC-FTU-06: Enterprise Level Detection

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Project directory contains a `kubernetes/`, `terraform/`, `k8s/`, or `infra/` directory.
- **Steps**:
  1. Start Claude Code session.
  2. Observe SessionStart output.
- **Expected Result**: Output shows "Recommended for Enterprise level: `bkit-enterprise`". CTO Team section shows Enterprise configuration (5 teammates: architect, developer, qa, reviewer, security) with patterns "leader → council → swarm → council → watchdog".
- **Pass Criteria**: Level detected as "Enterprise". All five teammate roles are listed.

---

#### TC-FTU-07: Memory Systems Guidance in SessionStart (v1.5.6 ENH-48)

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Any project state.
- **Steps**:
  1. Start Claude Code session.
  2. Locate the "Memory Systems (v1.5.6)" section in the SessionStart output.
- **Expected Result**: Section contains two subsections: "bkit Agent Memory (Auto-Active)" and "Claude Code Auto-Memory". The CC auto-memory subsection mentions `~/.claude/projects/*/memory/MEMORY.md`, the `/memory` command, and the separation from `docs/.bkit-memory.json`. Tip about using `/memory` after PDCA completion is present.
- **Pass Criteria**: All four memory system facts are present. No collision claim is present and accurate (bkit uses JSON, CC auto-memory uses Markdown at different path).

---

#### TC-FTU-08: Output Style Recommendation

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any project. Observe level-based style suggestion in SessionStart.
- **Steps**:
  1. Note the suggested style in SessionStart output.
  2. Run `/output-style`.
  3. Select the suggested style.
- **Expected Result**: Subsequent Claude responses adopt the selected style formatting (PDCA badges for bkit-pdca-guide, educational notes for bkit-learning, architecture focus for bkit-enterprise).
- **Pass Criteria**: Style change is visible in response format. No error on style selection.

---

### Domain 2: PDCA Workflow (Full Cycle)

**Coverage Goal**: Validate the complete Plan → Design → Do → Analyze → Iterate → Report → Archive → Cleanup flow including error gates.

---

#### TC-PDCA-01: /pdca plan Creates Plan Document

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: No existing plan for the test feature.
- **Steps**:
  1. Run `/pdca plan test-feature`.
- **Expected Result**: File created at `docs/01-plan/features/test-feature.plan.md`. File follows plan.template.md structure (sections: Overview, Scope, Requirements, Success Criteria, Risks, Architecture Considerations, Convention Prerequisites, Next Steps). `.bkit-memory.json` updated with phase = "plan".
- **Pass Criteria**: File exists. All required sections present. Memory updated.

---

#### TC-PDCA-02: /pdca plan Detects Existing Plan

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: `docs/01-plan/features/test-feature.plan.md` already exists.
- **Steps**:
  1. Run `/pdca plan test-feature`.
- **Expected Result**: Claude displays the existing plan content and suggests modifications rather than overwriting. User is informed the plan already exists.
- **Pass Criteria**: File is not overwritten. Existing content is surfaced.

---

#### TC-PDCA-03: /pdca design Blocked Without Plan

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: No plan document exists for the test feature.
- **Steps**:
  1. Run `/pdca design test-feature`.
- **Expected Result**: Claude informs user that a plan document is required before design. Suggests running `/pdca plan test-feature` first.
- **Pass Criteria**: Design document is not created. Guidance message is clear and actionable.

---

#### TC-PDCA-04: /pdca design Creates Design Document

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: `docs/01-plan/features/test-feature.plan.md` exists.
- **Steps**:
  1. Run `/pdca design test-feature`.
- **Expected Result**: File created at `docs/02-design/features/test-feature.design.md`. Design references Plan content. `.bkit-memory.json` updated with phase = "design". Task "[Design] test-feature" created with blockedBy reference to Plan task.
- **Pass Criteria**: File exists with proper structure. Memory phase updated.

---

#### TC-PDCA-05: /pdca do Blocked Without Design

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Plan exists but no design document.
- **Steps**:
  1. Run `/pdca do test-feature`.
- **Expected Result**: Claude informs user that a design document is required. Suggests running `/pdca design test-feature` first.
- **Pass Criteria**: No implementation guide provided without design. Error message is actionable.

---

#### TC-PDCA-06: /pdca do Provides Implementation Guide

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Both plan and design documents exist.
- **Steps**:
  1. Run `/pdca do test-feature`.
- **Expected Result**: Claude provides implementation guide based on do.template.md. Includes implementation order checklist, key files/components list, dependency installation commands. `.bkit-memory.json` updated with phase = "do".
- **Pass Criteria**: Guide is actionable and references design document content. Memory phase updated.

---

#### TC-PDCA-07: /pdca analyze Invokes gap-detector Agent

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Plan, design documents exist. Some implementation code present.
- **Steps**:
  1. Run `/pdca analyze test-feature`.
- **Expected Result**: gap-detector agent is invoked. Analysis document created at `docs/03-analysis/test-feature.analysis.md` (or `docs/03-analysis/features/test-feature.analysis.md`). Match rate calculated and displayed. `.bkit-memory.json` updated with phase = "check" and matchRate.
- **Pass Criteria**: Analysis document exists. Match rate is a numeric percentage. Memory updated.

---

#### TC-PDCA-08: /pdca iterate Triggers When Match Rate Below 90%

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Analysis completed with matchRate < 90%.
- **Steps**:
  1. Run `/pdca iterate test-feature`.
- **Expected Result**: pdca-iterator agent invoked. Code improvements applied based on Gap list. Check re-run automatically. Iteration count incremented in memory. Process repeats until matchRate >= 90% or maxIterations (5) reached.
- **Pass Criteria**: At least one improvement cycle executes. Iteration count tracked in `.bkit-memory.json`.

---

#### TC-PDCA-09: /pdca iterate Stops at Max Iterations

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: matchRate < 90% after 5 iterations.
- **Steps**:
  1. Configure a scenario where convergence is intentionally slow.
  2. Run `/pdca iterate test-feature` to reach the iteration limit.
- **Expected Result**: After 5 iterations, process stops with a summary. User is informed of the limit and the final match rate. No further auto-iteration.
- **Pass Criteria**: Stops at exactly maxIterations = 5. Summary shown. User not left in indefinite loop.

---

#### TC-PDCA-10: /pdca report Invokes report-generator Agent

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Check phase completed with matchRate >= 90%.
- **Steps**:
  1. Run `/pdca report test-feature`.
- **Expected Result**: report-generator agent (haiku model) invoked. Report created at `docs/04-report/test-feature.report.md`. Integrates Plan, Design, Implementation, Analysis content. `.bkit-memory.json` updated with phase = "completed".
- **Pass Criteria**: Report exists. Phase updated to "completed".

---

#### TC-PDCA-11: /pdca report Warns When Match Rate Below 90%

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Check phase completed with matchRate < 90%.
- **Steps**:
  1. Run `/pdca report test-feature`.
- **Expected Result**: Claude warns user that match rate is below threshold. Asks for confirmation before generating report. Report can still be generated if user confirms.
- **Pass Criteria**: Warning is shown. User gets a choice. Report is not silently blocked.

---

#### TC-PDCA-12: /pdca status at Each Phase

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Run at plan, design, do, check, and completed phases separately.
- **Steps**:
  1. After each PDCA phase transition, run `/pdca status`.
- **Expected Result**: Status shows current feature name, PDCA phase, match rate (when applicable), iteration count (when applicable), and visual progress bar (e.g., "[Plan] -> [Design] -> [Do] -> [Check] -> [Act]"). Each phase shows the correct emoji indicators.
- **Pass Criteria**: Status output is accurate for each phase. Progress visualization is correct.

---

#### TC-PDCA-13: /pdca next Suggests Correct Next Phase

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Various PDCA phases (plan complete, design complete, etc.).
- **Steps**:
  1. After each phase, run `/pdca next`.
- **Expected Result**: Suggests the correct next command based on current phase and match rate. Confirms with AskUserQuestion before acting.
  - After plan: suggests `/pdca design {feature}`
  - After design: suggests starting implementation
  - After do: suggests `/pdca analyze {feature}`
  - After check < 90%: suggests `/pdca iterate {feature}`
  - After check >= 90%: suggests `/pdca report {feature}`
  - After report: suggests `/pdca archive {feature}`
- **Pass Criteria**: All 6 phase transitions produce correct suggestions.

---

#### TC-PDCA-14: /pdca archive Moves All PDCA Documents

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: PDCA cycle complete (phase = "completed" or matchRate >= 90%). All four documents exist (plan, design, analysis, report).
- **Steps**:
  1. Run `/pdca archive test-feature`.
- **Expected Result**: All four documents moved to `docs/archive/YYYY-MM/test-feature/`. Original locations are empty. Archive index (`docs/archive/YYYY-MM/_INDEX.md`) updated. `.pdca-status.json` updated with phase = "archived" and archivedTo path.
- **Pass Criteria**: All four documents exist only in archive path. Index file reflects the archived feature.

---

#### TC-PDCA-15: /pdca archive with --summary Preserves Metrics

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: PDCA cycle complete.
- **Steps**:
  1. Run `/pdca archive test-feature --summary`.
- **Expected Result**: Documents moved to archive. Feature data in `.pdca-status.json` converted to lightweight summary format (phase, matchRate, iterationCount, startedAt, archivedAt, archivedTo) instead of full deletion.
- **Pass Criteria**: Summary JSON format is present. Size is reduced compared to full status entry. Documents still moved.

---

#### TC-PDCA-16: /pdca cleanup Interactive Mode

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: At least one archived feature in `.pdca-status.json`.
- **Steps**:
  1. Run `/pdca cleanup`.
- **Expected Result**: List of archived features displayed with timestamps and archive paths. AskUserQuestion prompts for selection: "All archived features", "Select specific features", "Cancel".
- **Pass Criteria**: Interactive list is accurate. Selection results in deletion from `.pdca-status.json` only (not from archive documents).

---

#### TC-PDCA-17: /pdca archive Blocked Before Report

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Feature in "do" phase (report not yet generated).
- **Steps**:
  1. Run `/pdca archive test-feature`.
- **Expected Result**: Claude informs user that archive requires report completion. Archive is not executed.
- **Pass Criteria**: No documents moved. Clear error message with guidance.

---

### Domain 3: Skill Invocation

**Coverage Goal**: Verify all 12 user-invocable skills respond correctly to slash commands.

---

#### TC-SKILL-01: /bkit Shows Complete Help Menu

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: bkit installed.
- **Steps**:
  1. Run `/bkit`.
- **Expected Result**: Help menu displayed with all sections: PDCA commands, Project Initialization, Development Pipeline, Quality Management, Learning, Memory & Clipboard (v1.5.6 label), Output Styles. All 12 user-invocable skills listed. Note about no autocomplete is shown.
- **Pass Criteria**: All sections present. /memory and /copy appear under "Memory & Clipboard (v1.5.6)".

---

#### TC-SKILL-02: /starter init Creates Static Project

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Empty project directory.
- **Steps**:
  1. Run `/starter init my-site`.
- **Expected Result**: Starter project scaffolded (HTML/CSS/Next.js structure). Claude guides through project setup. Level detected as Starter going forward.
- **Pass Criteria**: Project structure created. No errors.

---

#### TC-SKILL-03: /dynamic init Creates Fullstack Project

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Empty project directory with bkend.ai access configured.
- **Steps**:
  1. Run `/dynamic init my-app`.
- **Expected Result**: Dynamic project scaffolded (bkend.ai BaaS integration structure). `.mcp.json` created or updated. Level detected as Dynamic.
- **Pass Criteria**: Fullstack structure present. bkend expert agent activates for follow-up questions.

---

#### TC-SKILL-04: /enterprise init Creates Enterprise Project

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Empty project directory.
- **Steps**:
  1. Run `/enterprise init my-platform`.
- **Expected Result**: Enterprise project scaffolded (K8s/Terraform structure). `kubernetes/` or `infra/` directory created. Level detected as Enterprise.
- **Pass Criteria**: Enterprise structure present. Enterprise-level agents activate.

---

#### TC-SKILL-05: /development-pipeline start Begins 9-Phase Pipeline

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Project with some codebase.
- **Steps**:
  1. Run `/development-pipeline start`.
- **Expected Result**: Phase 1 (Schema definition) begins. Pipeline status initialized. User guided through terminology and data structure definition.
- **Pass Criteria**: Phase 1 is active. Pipeline status command works after start.

---

#### TC-SKILL-06: /code-review Triggers code-analyzer Agent

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Source code exists in project.
- **Steps**:
  1. Run `/code-review src/components/`.
- **Expected Result**: code-analyzer agent (opus model) invoked. Analysis report generated covering quality, issues, and recommendations.
- **Pass Criteria**: code-analyzer agent is used. Analysis is structured and actionable.

---

#### TC-SKILL-07: /zero-script-qa Starts Log-Based QA

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Docker or application logs available.
- **Steps**:
  1. Run `/zero-script-qa`.
- **Expected Result**: qa-monitor agent (haiku model) invoked. Guided QA process begins using logs as input. No script execution required.
- **Pass Criteria**: qa-monitor activates. Guidance is clear without requiring script files.

---

#### TC-SKILL-08: /claude-code-learning Provides Learning Guide

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any project state.
- **Steps**:
  1. Run `/claude-code-learning`.
- **Expected Result**: starter-guide agent (sonnet model) activates. Educational content about Claude Code features provided. Setup analysis available via `/claude-code-learning setup`.
- **Pass Criteria**: Learning content is relevant and structured. Setup analysis examines actual project.

---

#### TC-SKILL-09: /mobile-app Guides Mobile Development

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. Run `/mobile-app`.
- **Expected Result**: Mobile development guidance provided for React Native/Flutter/Expo. Platform selection offered.
- **Pass Criteria**: Skill responds without error. Framework choices are presented.

---

#### TC-SKILL-10: /desktop-app Guides Desktop Development

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. Run `/desktop-app`.
- **Expected Result**: Desktop development guidance for Electron/Tauri provided. Platform and framework selection offered.
- **Pass Criteria**: Skill responds without error.

---

#### TC-SKILL-11: /output-style Lists and Applies Styles

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. Run `/output-style`.
  2. Select `bkit-pdca-guide`.
  3. Run any PDCA command.
  4. Observe response formatting.
- **Expected Result**: Style list shows 4 available styles. After selection, subsequent PDCA responses include phase status badges and checklist formatting.
- **Pass Criteria**: 4 styles listed. Selection changes response format.

---

#### TC-SKILL-12: /output-style-setup Installs Styles to .claude/

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: `.claude/output-styles/` directory does not exist or is empty.
- **Steps**:
  1. Run `/output-style-setup`.
- **Expected Result**: bkit output styles installed to `.claude/output-styles/`. Confirmation message shown. Styles appear in subsequent `/output-style` menu.
- **Pass Criteria**: Directory and style files created. No error during installation.

---

#### TC-SKILL-13: /plan-plus Adds Brainstorming Phase

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: No existing plan for test feature.
- **Steps**:
  1. Run `/plan-plus ambiguous-feature`.
- **Expected Result**: Brainstorming phases executed before plan document generation: intent discovery, alternatives exploration, YAGNI review. Final plan document is more detailed than standard `/pdca plan` output.
- **Pass Criteria**: Brainstorming sections are visible. Plan document created at `docs/01-plan/features/ambiguous-feature.plan.md`.

---

### Domain 4: Phase Skills Auto-Invocation

**Coverage Goal**: Verify 9 phase skills activate correctly through the development pipeline.

---

#### TC-PHASE-01: Pipeline Advances Through All 9 Phases Sequentially

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: `/development-pipeline start` executed.
- **Steps**:
  1. Complete Phase 1 work.
  2. Run `/development-pipeline next`.
  3. Repeat through all 9 phases.
- **Expected Result**: Each `/development-pipeline next` invokes the correct phase skill: phase-1-schema → phase-2-convention → phase-3-mockup → phase-4-api → phase-5-design-system → phase-6-ui-integration → phase-7-seo-security → phase-8-review → phase-9-deployment.
- **Pass Criteria**: All 9 phase skills invoked in sequence. Pipeline status reflects current phase.

---

#### TC-PHASE-02: /phase-8-review Performs Code Review and Gap Analysis

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Implementation complete (phases 1-7 done).
- **Steps**:
  1. Run `/development-pipeline next` from phase 7.
- **Expected Result**: phase-8-review skill invoked. code-analyzer and gap-detector agents triggered. Analysis covers both review and gap detection against design specs.
- **Pass Criteria**: Review output is comprehensive. Gap analysis match rate calculated.

---

#### TC-PHASE-03: /phase-9-deployment Provides CI/CD Guidance

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: Phase 8 complete.
- **Steps**:
  1. Run `/development-pipeline next` from phase 8.
- **Expected Result**: phase-9-deployment skill invoked. CI/CD pipeline setup guidance provided. Docker/K8s deployment steps included based on detected project level.
- **Pass Criteria**: Deployment guidance matches project level (Starter vs Enterprise differ).

---

### Domain 5: Natural Language Skill Detection (8 Languages)

**Coverage Goal**: Verify intent detection triggers correct skills across all 8 supported languages.

---

#### TC-LANG-01: English Natural Language Triggers Correct Skill

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: bkit session active.
- **Steps**:
  1. Type: "I want to build a login feature"
  2. Type: "verify the implementation against the design"
  3. Type: "generate a summary report for user-auth"
- **Expected Result**:
  - "build" → triggers "do" guidance or bkend-expert
  - "verify" → triggers gap-detector agent
  - "summary report" → triggers report-generator agent (haiku)
- **Pass Criteria**: Intent detection activates correct agent or skill suggestion each time.

---

#### TC-LANG-02: Korean Natural Language Triggers Correct Skill

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: bkit session active.
- **Steps**:
  1. Type: "로그인 기능 만들기"
  2. Type: "처음부터 시작하고 싶어"
  3. Type: "검증해줘"
- **Expected Result**:
  - "만들기" → triggers appropriate construction skill or agent
  - "처음부터 시작" → triggers new project flow
  - "검증" → triggers gap-detector or analyze flow
- **Pass Criteria**: Korean triggers activate correct behavior per `triggerPatterns` in session-start.js.

---

#### TC-LANG-03: Japanese/Chinese Natural Language Triggers Correct Skill

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit session active.
- **Steps**:
  1. Type: "作成してください" (Japanese: "please create")
  2. Type: "创建新功能" (Chinese: "create new feature")
- **Expected Result**: Creation-related skills or agents triggered. Response provided in the user's language or English based on Claude's language detection.
- **Pass Criteria**: No error. Appropriate skill activates.

---

#### TC-LANG-04: European Languages Natural Language Detection

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit session active.
- **Steps**:
  1. Type: "crear una nueva función" (Spanish)
  2. Type: "créer une fonctionnalité" (French)
  3. Type: "erstellen Sie eine neue Funktion" (German)
  4. Type: "creare una nuova funzione" (Italian)
- **Expected Result**: Each triggers appropriate construction/creation workflow.
- **Pass Criteria**: All four European language patterns recognized without error.

---

### Domain 6: Agent Triggering

**Coverage Goal**: Verify all 16 agents trigger correctly by keyword and maintain memory across sessions.

---

#### TC-AGENT-01: gap-detector Triggered by "verify"

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Design document and implementation code exist.
- **Steps**:
  1. Type: "verify the implementation matches the design".
- **Expected Result**: gap-detector agent (opus) invoked. Analysis document produced. Match rate calculated.
- **Pass Criteria**: gap-detector specifically activated, not a generic response.

---

#### TC-AGENT-02: code-analyzer Triggered by "analyze code quality"

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Source code exists.
- **Steps**:
  1. Type: "analyze the code quality of the authentication module".
- **Expected Result**: code-analyzer agent (opus) invoked. Structured quality analysis returned.
- **Pass Criteria**: code-analyzer activated with opus model.

---

#### TC-AGENT-03: bkend-expert Triggered by "login" or "auth"

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Dynamic-level project with bkend MCP configured.
- **Steps**:
  1. Type: "help me implement login with bkend".
- **Expected Result**: bkend-expert agent (sonnet) invoked. bkend-specific guidance provided referencing live bkend.ai documentation.
- **Pass Criteria**: bkend-expert activates. MCP tools used for documentation lookup.

---

#### TC-AGENT-04: enterprise-expert Triggered by "microservices"

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Enterprise-level project.
- **Steps**:
  1. Type: "design the microservices architecture for our platform".
- **Expected Result**: enterprise-expert agent (opus) invoked. Enterprise architecture guidance provided including K8s, service mesh, and observability considerations.
- **Pass Criteria**: enterprise-expert with opus model activated.

---

#### TC-AGENT-05: cto-lead Triggered by "team" Keyword

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Agent Teams enabled (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`). Dynamic or Enterprise project.
- **Steps**:
  1. Type: "I need the team to review this feature plan".
- **Expected Result**: cto-lead agent (opus) activated. Team orchestration initiated.
- **Pass Criteria**: cto-lead specifically invoked. Team composition based on project level.

---

#### TC-AGENT-06: All 11 Core Agents Have Unique Trigger Keywords

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. For each of the 11 core agents, type a message containing the primary trigger keyword.
- **Expected Result**: Each agent activates for its designated keyword. No keyword collision causes wrong agent activation.
  - "beginner" → starter-guide (sonnet)
  - "QA" → qa-monitor (haiku)
  - "pipeline" → pipeline-guide (sonnet)
  - "AWS" → infra-architect (opus)
  - "validate design" → design-validator (opus)
  - "report" → report-generator (haiku)
  - "improve" → pdca-iterator (sonnet)
  - "requirements" → product-manager (sonnet)
  - "frontend" → frontend-architect (sonnet)
  - "test strategy" → qa-strategist (sonnet)
  - "security" → security-architect (opus)
- **Pass Criteria**: Correct agent activates for each keyword. Model matches specification (opus/sonnet/haiku as defined).

---

#### TC-AGENT-07: Agent Memory Persists Across Sessions

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: At least one agent has been invoked in a prior session.
- **Steps**:
  1. Start a new Claude Code session.
  2. Invoke the same agent (e.g., gap-detector).
  3. Observe if agent references prior context.
- **Expected Result**: Agent recalls relevant prior context from `.claude/agent-memory/{agent-name}/MEMORY.md`. Context is referenced without re-asking for already-known information.
- **Pass Criteria**: At least one piece of prior session context is utilized by the agent.

---

#### TC-AGENT-08: Project-Scope vs User-Scope Agent Memory

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: starter-guide or pipeline-guide invoked in project A. Switch to project B.
- **Steps**:
  1. Invoke starter-guide in project A. Note any memory written.
  2. Open Claude Code in project B.
  3. Invoke starter-guide.
- **Expected Result**: starter-guide and pipeline-guide use user scope (`~/.claude/agent-memory/`), so their memory persists across projects. All 14 other agents use project scope and memory does not carry over to project B.
- **Pass Criteria**: User-scope agents show cross-project memory. Project-scope agents do not.

---

### Domain 7: CTO Team Mode

**Coverage Goal**: Verify CTO Team Mode orchestration for Dynamic and Enterprise projects.

---

#### TC-TEAM-01: /pdca team Blocked for Starter Projects

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Starter-level project. Agent Teams enabled.
- **Steps**:
  1. Run `/pdca team test-feature`.
- **Expected Result**: Claude informs user that Starter projects cannot use Team Mode. No team is started.
- **Pass Criteria**: Team Mode not activated. Error message is clear.

---

#### TC-TEAM-02: /pdca team Requires CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Dynamic project. Agent Teams NOT enabled (env var not set).
- **Steps**:
  1. Run `/pdca team test-feature`.
- **Expected Result**: Claude displays message: "Agent Teams is not enabled. Set `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` to enable."
- **Pass Criteria**: Clear activation instruction shown. No partial team start.

---

#### TC-TEAM-03: Dynamic Project Team Has 3 Teammates

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Dynamic project. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set.
- **Steps**:
  1. Run `/pdca team test-feature`.
  2. Confirm team strategy when prompted.
- **Expected Result**: Team strategy shown: CTO Lead (opus) + 3 teammates (developer, frontend, qa). Strategy confirmed via AskUserQuestion before starting. Orchestration pattern for Dynamic: leader → leader → swarm → council → leader.
- **Pass Criteria**: Exactly 3 teammates. CTO Lead identified as cto-lead (opus).

---

#### TC-TEAM-04: Enterprise Project Team Has 5 Teammates

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Enterprise project. Agent Teams enabled.
- **Steps**:
  1. Run `/pdca team test-feature`.
  2. Confirm team strategy.
- **Expected Result**: 5 teammates (architect, developer, qa, reviewer, security). Enterprise orchestration pattern: leader → council → swarm → council → watchdog.
- **Pass Criteria**: Exactly 5 teammates. All roles listed correctly.

---

#### TC-TEAM-05: /pdca team status Shows Active Team State

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Team Mode active with at least one teammate working.
- **Steps**:
  1. Run `/pdca team status`.
- **Expected Result**: Status output shows: Agent Teams availability, display mode (in-process), teammate count, current PDCA feature, and per-teammate progress (idle/in-progress/waiting).
- **Pass Criteria**: All status fields populated. Per-teammate progress is accurate.

---

#### TC-TEAM-06: /pdca team cleanup Returns to Single-Session Mode

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Team Mode active.
- **Steps**:
  1. Run `/pdca team cleanup`.
- **Expected Result**: All active teammates stopped. `team_session_ended` recorded in PDCA history. Message "Returning to single-session mode" shown. Subsequent PDCA commands work in single-session mode.
- **Pass Criteria**: No teammates active after cleanup. PDCA history updated.

---

### Domain 8: v1.5.6 Specific UX

**Coverage Goal**: Validate all four ENH-48 through ENH-51 improvements from a user perspective.

---

#### TC-V156-01: /memory Command Available (ENH-48)

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Claude Code v2.1.59+. bkit v1.5.6.
- **Steps**:
  1. Run `/memory`.
- **Expected Result**: Claude Code's native `/memory` command activates. User can view, edit, and delete auto-memory entries stored in `~/.claude/projects/*/memory/MEMORY.md`.
- **Pass Criteria**: `/memory` command works. Not blocked or confused with bkit memory commands.

---

#### TC-V156-02: /memory Listed in /bkit Help (ENH-48)

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Any session.
- **Steps**:
  1. Run `/bkit`.
  2. Locate the "Memory & Clipboard (v1.5.6)" section.
- **Expected Result**: Section lists `/memory` with description "Manage Claude auto-memory (view/edit entries)" and `/copy` with description "Copy code blocks to clipboard (interactive picker)".
- **Pass Criteria**: Both commands present in help. Version label "(v1.5.6)" visible.

---

#### TC-V156-03: /copy Suggested After Code Generation Skill (ENH-49)

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. Run `/phase-4-api` (or any of the 9 code generation skills: phase-4-api, phase-5-design-system, phase-6-ui-integration, code-review, starter, dynamic, enterprise, mobile-app, desktop-app).
  2. Observe skill completion output.
- **Expected Result**: After skill completes, output includes `copyHint` field: "Use /copy to select and copy code blocks to clipboard". This appears in the skill-post.js output, not as a separate message.
- **Pass Criteria**: Copy hint present for all 9 code generation skills. Not present for PDCA skill.

---

#### TC-V156-04: /copy NOT Suggested After PDCA Skill (ENH-49)

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any project.
- **Steps**:
  1. Run any `/pdca` command (e.g., `/pdca plan test`).
  2. Observe completion output.
- **Expected Result**: No copy hint in output. PDCA skill excluded from CODE_GENERATION_SKILLS array.
- **Pass Criteria**: No `copyHint` field in pdca skill-post output.

---

#### TC-V156-05: /copy Tip on Stop Event When Skill Active (ENH-49)

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: A code generation skill has been run in the session. Use Ctrl+C or natural session stop.
- **Steps**:
  1. Run `/starter init test-project`.
  2. Press Ctrl+C to stop the operation.
- **Expected Result**: Stop event output includes tip: "Tip: Use /copy to copy code blocks from this session."
- **Pass Criteria**: Tip present when activeSkill is truthy. Not present in pure conversation sessions.

---

#### TC-V156-06: /copy Tip NOT Shown When No Active Skill (ENH-49)

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: Pure conversation session (no skill invoked).
- **Steps**:
  1. Have a conversation without invoking any skill.
  2. Let session end or press stop.
- **Expected Result**: Stop event output does NOT include the /copy tip.
- **Pass Criteria**: `copyTip` is empty string when `activeSkill` is falsy.

---

#### TC-V156-07: CTO Team Memory Guide Accessible (ENH-50)

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit v1.5.6 installed.
- **Steps**:
  1. Ask Claude: "How do I manage memory for CTO Team sessions?"
  2. Or directly read `docs/guides/cto-team-memory-guide.md`.
- **Expected Result**: Guide covers 3 memory systems comparison, 16-agent distribution, v2.1.59 subagent task state release, v2.1.50 memory fixes, best practices, and known issues.
- **Pass Criteria**: Guide is readable and complete. All major sections present.

---

#### TC-V156-08: Remote Control Compatibility Doc Accessible (ENH-51)

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit v1.5.6 installed.
- **Steps**:
  1. Ask Claude: "Are bkit skills compatible with Claude Code Remote Control?"
  2. Or directly read `docs/guides/remote-control-compatibility.md`.
- **Expected Result**: Document explains current RC status, that slash commands are not yet supported (#28379), the skills/agents RC readiness matrix, and timeline expectations (Q1-Q2 2026).
- **Pass Criteria**: Document accurately reflects current #28379 open status.

---

### Domain 9: Configuration and Customization

**Coverage Goal**: Verify bkit.config.json options work as documented.

---

#### TC-CFG-01: matchRateThreshold Configurable

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit.config.json accessible.
- **Steps**:
  1. Change `pdca.matchRateThreshold` from 90 to 80.
  2. Run `/pdca analyze test-feature` on an implementation with 85% match.
  3. Observe iterate behavior.
- **Expected Result**: With threshold = 80, a match rate of 85% does NOT trigger iteration. Claude proceeds to report phase.
- **Pass Criteria**: Threshold change is respected. No hardcoded 90% in logic.

---

#### TC-CFG-02: maxIterations Configurable

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: bkit.config.json accessible.
- **Steps**:
  1. Change `pdca.maxIterations` from 5 to 2.
  2. Run a scenario where match rate doesn't converge.
- **Expected Result**: Iteration stops after 2 cycles instead of 5.
- **Pass Criteria**: maxIterations = 2 is respected.

---

#### TC-CFG-03: Permission Defaults Block Dangerous Operations

- **Priority**: P0
- **Type**: Manual
- **Preconditions**: Default bkit.config.json (no modifications).
- **Steps**:
  1. Ask Claude to run `rm -rf node_modules`.
  2. Ask Claude to run `git push --force`.
  3. Ask Claude to run `git reset --hard HEAD~5`.
- **Expected Result**:
  - `rm -rf*` → denied automatically.
  - `git push --force*` → denied automatically.
  - `rm -r*` and `git reset --hard*` → ask for confirmation.
- **Pass Criteria**: Destructive operations blocked or gated per config. No silent execution.

---

#### TC-CFG-04: Level Detection Directories Work

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Control the project directory structure.
- **Steps**:
  1. Create `kubernetes/` in project root.
  2. Start session. Observe level.
  3. Remove `kubernetes/`, add `.mcp.json`.
  4. Start session. Observe level.
  5. Remove `.mcp.json`.
  6. Start session. Observe level.
- **Expected Result**: Step 2 detects Enterprise. Step 4 detects Dynamic. Step 6 detects Starter.
- **Pass Criteria**: Level changes correctly with directory/file structure changes.

---

### Domain 10: Error Recovery

**Coverage Goal**: Verify bkit fails gracefully and provides recovery guidance.

---

#### TC-ERR-01: Invalid /pdca Sub-Command

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Any session.
- **Steps**:
  1. Run `/pdca invalidcommand test`.
- **Expected Result**: Claude responds with a list of valid pdca sub-commands. Does not crash. Does not execute unexpected behavior.
- **Pass Criteria**: Error message is friendly. Valid command list shown.

---

#### TC-ERR-02: bkend MCP Not Configured for Dynamic Project

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Dynamic-level project (has `.mcp.json` but without bkend config).
- **Steps**:
  1. Start session.
  2. Observe SessionStart bkend MCP section.
- **Expected Result**: SessionStart output mentions bkend MCP is not connected and provides setup instructions.
- **Pass Criteria**: Clear setup guidance shown. No error thrown. Session still usable.

---

#### TC-ERR-03: Session Interruption and Resume

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: PDCA in progress (phase = "design").
- **Steps**:
  1. Close Claude Code session mid-PDCA.
  2. Reopen Claude Code.
  3. Observe SessionStart.
- **Expected Result**: "Previous Work Detected" section shows last known phase ("design"). User offered "Continue" option. Memory state is intact.
- **Pass Criteria**: No data loss. Resume path is clear.

---

#### TC-ERR-04: Agent Teams Enabled But Claude Code Too Old

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Claude Code version < v2.1.32. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` set.
- **Steps**:
  1. Run `/pdca team test-feature`.
- **Expected Result**: isTeamModeAvailable() returns false. Clear message that Agent Teams is not available.
- **Pass Criteria**: Graceful degradation. No crash. Single-session PDCA still works.

---

#### TC-ERR-05: .bkit-memory.json Corrupted or Missing

- **Priority**: P1
- **Type**: Manual
- **Preconditions**: Manually corrupt or delete `docs/.bkit-memory.json`.
- **Steps**:
  1. Delete or corrupt `docs/.bkit-memory.json`.
  2. Start Claude Code session.
  3. Run `/pdca status`.
- **Expected Result**: Session starts without error. Status shows no current feature (treats as fresh state). New memory file created on first PDCA operation.
- **Pass Criteria**: No crash on corrupted/missing memory. Recovery is automatic.

---

#### TC-ERR-06: Hook Timeout Handling

- **Priority**: P2
- **Type**: Manual
- **Preconditions**: Simulate slow hook execution (userPromptSubmit timeout = 3000ms).
- **Steps**:
  1. Inject artificial delay into user-prompt-handler.js (test environment only).
  2. Submit user message.
- **Expected Result**: Hook times out after 3000ms. Claude session continues normally. User does not see hook error in main conversation.
- **Pass Criteria**: Timeout is respected. Session not blocked indefinitely.

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] All 10 UX domain areas covered with documented scenarios
- [ ] Every scenario has: Priority (P0/P1/P2), Type (Manual/Automated), Preconditions, Steps, Expected Result, Pass Criteria
- [ ] All P0 scenarios reviewed by CTO for completeness
- [ ] Plan document approved by CTO before QA execution begins

### 5.2 Quality Criteria

- [ ] Total test scenarios: 50+ (target 55-65)
- [ ] P0 scenarios: 15+ (critical path coverage)
- [ ] P1 scenarios: 25+ (standard coverage)
- [ ] P2 scenarios: 10+ (edge cases and nice-to-have)
- [ ] All 12 user-invocable skills have at least one scenario
- [ ] All 16 agents referenced in at least one scenario
- [ ] v1.5.6 specific features (ENH-48 to 51) each have at least 2 scenarios

### 5.3 Scenario Count Summary

| Domain | P0 | P1 | P2 | Total |
|--------|:--:|:--:|:--:|:-----:|
| 1. First-Time User Experience | 3 | 4 | 1 | 8 |
| 2. PDCA Full Cycle | 8 | 7 | 2 | 17 |
| 3. Skill Invocation | 3 | 8 | 2 | 13 |
| 4. Phase Skills | 0 | 2 | 1 | 3 |
| 5. Natural Language (8 langs) | 0 | 2 | 2 | 4 |
| 6. Agent Triggering | 2 | 5 | 1 | 8 |
| 7. CTO Team Mode | 2 | 4 | 0 | 6 |
| 8. v1.5.6 Specific UX | 3 | 2 | 3 | 8 |
| 9. Configuration | 1 | 1 | 2 | 4 |
| 10. Error Recovery | 0 | 4 | 2 | 6 |
| **TOTAL** | **22** | **39** | **16** | **77** |

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Agent Teams not available in test env | High | Medium | Mark TC-TEAM-* as conditional; test in env with CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 |
| bkend MCP requires live bkend.ai access | Medium | High | Mock bkend MCP or run TC-AGENT-03 with live credentials in separate environment |
| Level detection depends on directory structure | Medium | Low | Use isolated test directories for each level detection scenario |
| v1.5.6 ENH-49 output is hook JSON (not visible in Claude UI) | High | Medium | Verify copyHint in hook debug output or log inspection |
| Remote Control scenarios blocked by #28379 | Low | High | Keep TC-V156-07/08 as document-only verification, not interactive RC test |
| Natural language tests require specific CC version for optimal intent detection | Medium | Medium | Document minimum CC version (v2.1.59) for language trigger tests |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

The UX test plan is applicable to all three project levels:

| Level | Impact | Test Approach |
|-------|--------|---------------|
| **Starter** | Baseline UX, no Team Mode | Majority of scenarios use Starter |
| **Dynamic** | Team Mode (3 teammates), bkend MCP | TC-TEAM-* and TC-AGENT-03 require Dynamic |
| **Enterprise** | Team Mode (5 teammates), infra agents | TC-TEAM-04 and TC-AGENT-04 require Enterprise |

### 7.2 Hook Architecture Dependency

Several UX scenarios depend on hook output:
- SessionStart hook (TC-FTU-01, 02, 03, 07): `hooks/session-start.js`
- skill-post hook (TC-V156-03, 04): `scripts/skill-post.js`
- unified-stop hook (TC-V156-05, 06): `scripts/unified-stop.js`

Hook output is JSON consumed by Claude Code. The user experience of hook results depends on how Claude Code renders that JSON. Manual testing is the primary verification method.

---

## 8. Timeline

| Milestone | Owner | Target |
|-----------|-------|--------|
| Plan document review | CTO Lead | 2026-02-28 |
| Design document (execution framework) | QA Strategist | 2026-03-01 |
| P0 scenario execution (22 scenarios) | QA team | 2026-03-03 |
| P1 scenario execution (39 scenarios) | QA team | 2026-03-05 |
| P2 scenario execution (16 scenarios) | QA team | 2026-03-07 |
| Results report | Report Generator | 2026-03-08 |

---

## 9. Next Steps

1. [ ] Submit this Plan to CTO Lead for approval
2. [ ] Create Design document: execution framework, test environment setup, data fixtures
3. [ ] Assign P0 scenarios to qa-strategist for immediate execution
4. [ ] Set up test environments for each project level (Starter, Dynamic, Enterprise)
5. [ ] Confirm bkend.ai live access for TC-AGENT-03

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-27 | Initial draft - 77 UX test scenarios across 10 domains | product-manager |
