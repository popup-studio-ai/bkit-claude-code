# bkit v1.6.1 Enhancement Technical Design

> **Summary**: CTO/PM 오케스트레이션 재설계 — Agent Teams (Issue #41) + P0 버그 3건 수정 + Evals 28/28 실구현 + Config-Code 동기화 + Agent Security 강화
>
> **Project**: bkit
> **Version**: 1.6.0 -> 1.6.1
> **Author**: CTO Lead (10-agent parallel analysis)
> **Date**: 2026-03-07
> **Status**: Draft
> **Planning Doc**: [bkit-v161-enhancement.plan.md](../01-plan/features/bkit-v161-enhancement.plan.md)
> **PRD**: [bkit-v161-enhancement.prd.md](../00-pm/bkit-v161-enhancement.prd.md)

---

## 1. Overview

### 1.1 Design Goals

0. CTO 오케스트레이션 재설계 — CC v2.1.69+ nested spawn 제한 대응 (Issue #41)
1. P0 버그 3건 즉시 수정 — 핵심 철학(No Guessing, Automation First, Docs=Code) 위반 해소
2. Skill Evals 28/28 실구현 — stub에서 실행 가능한 평가 프레임워크로 전환
3. Config→Code 단방향 동기화 — `bkit.config.json`이 Single Source of Truth
4. Agent Security 일관성 — acceptEdits 에이전트 9개 중 8개의 보안 설정 보완

### 1.2 Design Principles

- **Surgical Fix**: 최소 변경으로 최대 효과 (마이너 릴리스 범위)
- **Single Source of Truth**: Config에서 코드로 단방향 흐름
- **Backward Compatible**: 기존 API 시그니처 변경 없음
- **No External Dependencies**: js-yaml 등 외부 패키지 추가 없음

---

## 2. Architecture

### 2.1 변경 영향 범위

```
bkit-claude-code/
├── lib/team/coordinator.js     ← M-08: Agent Teams 통합 (CTO+PM TeamCreate)
├── lib/team/orchestrator.js    ← M-08 + GAP-02: TeamCreate 호환 + Config-Code 동기화
├── skills/pdca/SKILL.md        ← M-08: team/pm 액션 Agent Teams 기반 재작성
├── agents/cto-lead.md          ← M-08: CC v2.1.69+ Architecture Note 추가
├── agents/pm-lead.md           ← M-08: CC v2.1.69+ Architecture Note 추가
├── scripts/user-prompt-handler.js ← M-08: Team Mode 제안 메시지 업데이트
├── lib/intent/ambiguity.js     ← BUG-01: shouldClarify 추가
├── lib/intent/trigger.js       ← BUG-03: hardcoded 0.8 제거
├── lib/task/creator.js         ← BUG-02: savePdcaTaskId import 수정 + GAP-04: phases 통일
├── evals/runner.js             ← GAP-01: runEval() 실구현
├── evals/reporter.js           ← GAP-01: 리포트 강화
├── evals/{category}/{skill}/   ← GAP-01: 28×2 = 56 prompt/expected 파일
│   ├── prompt-1.md
│   └── expected-1.md
└── agents/*.md (8 files)       ← GAP-03: disallowedTools 추가
```

### 2.2 의존성 그래프 (구현 순서)

```
Layer 0: CTO/PM Orchestration Redesign (P0)      ── Week 1, Day 1-3    [B안 - Agent Teams]
├── Phase 0-A: 사전 검증 스파이크                  ── Day 1
│   ├── TeamCreate 동작 검증
│   ├── Teammate memory 지원 검증
│   └── Teammate → Agent() 2단계 위임 검증
├── Phase 0-B: 구현                               ── Day 2-3
│   ├── M-08: coordinator.js — buildAgentTeamPlan() (CTO+PM)
│   ├── M-08: orchestrator.js — TeamCreate 호환
│   ├── M-08: skills/pdca/SKILL.md — team/pm Agent Teams 재작성
│   ├── M-08: agents/cto-lead.md — Architecture Note
│   └── M-08: agents/pm-lead.md — Architecture Note

Layer 1: Bug Fix (독립, 병렬 가능)              ── Week 1, Day 2-3
├── M-01: shouldClarify (ambiguity.js)           ─┐
├── M-03: confidenceThreshold (trigger.js)        ├── 동시 수정
├── M-02: savePdcaTaskId import (creator.js)     ─┘
└── M-06: phases 배열 통일 (creator.js)          ── M-02와 동일 파일

Layer 2: Config-Code Sync (M-06 이후)           ── Week 1, Day 3
└── M-05: orchestrationPatterns 동기화

Layer 3: Agent Security (독립)                   ── Week 1, Day 3
└── M-07: 8개 에이전트 disallowedTools

Layer 4: Evals Implementation (독립)             ── Week 1, Day 3 ~ Week 2
├── runner.js YAML 파서 + 실행 로직              ─┐
├── reporter.js 강화                              │ 순차
├── 28 × prompt-1.md 실컨텐츠                    ├── 카테고리별 병렬
├── 28 × expected-1.md 실컨텐츠                   │
└── 통합 benchmark 검증                          ─┘
```

---

## 3. Layer 0: CTO/PM Orchestration Redesign — 상세 설계 (B안: CC Agent Teams)

### 3.0 M-08: CTO/PM 오케스트레이션 아키텍처 재설계 (Issue #41)

**근본 원인**: CC v2.1.69에서 `Subagents cannot spawn other subagents` 하드 제한 도입. bkit의 CTO Lead와 PM Lead는 subagent로 spawn된 후 내부에서 `Task()`로 팀원을 spawn하는 **nested spawn 패턴**을 사용하여 **전면 차단**됨.

**영향 범위**:

| 에이전트 | Task() 수 | 호출 경로 | 영향 |
|----------|:---------:|----------|------|
| **cto-lead** | 11 | pdca skill `agents: team:` → subagent | **전체 Task() 차단** |
| **pm-lead** | 5 | pdca skill `agents: pm:` → subagent | **전체 Task() 차단** |
| qa-strategist | 4 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| enterprise-expert | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| security-architect | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| pdca-iterator | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |

**차단되는 위임 체인 (6개 경로)**:

```
Main → cto-lead(subagent) → qa-strategist(Task=❌) → gap-detector(Task=❌❌)
Main → cto-lead(subagent) → qa-strategist(Task=❌) → code-analyzer(Task=❌❌)
Main → cto-lead(subagent) → qa-strategist(Task=❌) → qa-monitor(Task=❌❌)
Main → cto-lead(subagent) → enterprise-expert(Task=❌) → infra-architect(Task=❌❌)
Main → cto-lead(subagent) → security-architect(Task=❌) → code-analyzer(Task=❌❌)
Main → cto-lead(subagent) → pdca-iterator(Task=❌) → gap-detector(Task=❌❌)

Main → pm-lead(subagent) → pm-discovery(Task=❌)
Main → pm-lead(subagent) → pm-strategy(Task=❌)
Main → pm-lead(subagent) → pm-research(Task=❌)
Main → pm-lead(subagent) → pm-prd(Task=❌)
```

---

### 3.1 해결 전략: CC Agent Teams (TeamCreate) 마이그레이션

**핵심 인사이트**: CC Agent Teams의 각 teammate는 **독립 Claude Code 세션**이다. 따라서 teammate 내에서의 Agent() 호출은 해당 세션의 1단계 서브에이전트가 되어 **2단계/3단계 위임 체인이 평탄화 없이 그대로 동작**한다.

```
Before (v1.6.0, BROKEN on CC v2.1.69+):
  Main Session
    └── Agent(cto-lead)                    ← subagent
          ├── Task(enterprise-expert)       ← BLOCKED (nested spawn)
          │     └── Task(infra-architect)   ← BLOCKED (3-level)
          ├── Task(qa-strategist)           ← BLOCKED
          │     ├── Task(gap-detector)      ← BLOCKED (3-level)
          │     └── Task(code-analyzer)     ← BLOCKED (3-level)
          └── Task(bkend-expert)            ← BLOCKED

After (v1.6.1, B안 — CC Agent Teams):
  Main Session (Team Lead)
    ├── Teammate: enterprise-expert (독립 세션) ✅
    │     └── Agent(infra-architect)    ← 1단계 서브에이전트 of teammate ✅
    ├── Teammate: qa-strategist (독립 세션) ✅
    │     ├── Agent(gap-detector)       ← 1단계 서브에이전트 of teammate ✅
    │     ├── Agent(code-analyzer)      ← 1단계 서브에이전트 of teammate ✅
    │     └── Agent(qa-monitor)         ← 1단계 서브에이전트 of teammate ✅
    ├── Teammate: frontend-architect (독립 세션) ✅
    ├── Teammate: security-architect (독립 세션) ✅
    │     └── Agent(code-analyzer)      ← 1단계 서브에이전트 of teammate ✅
    └── Shared: Task List + Mailbox (teammate 간 직접 소통)

  PM Team (동일 패턴):
  Main Session (Team Lead)
    ├── Teammate: pm-discovery (독립 세션) ✅
    ├── Teammate: pm-strategy (독립 세션) ✅
    ├── Teammate: pm-research (독립 세션) ✅
    └── Teammate: pm-prd (독립 세션) ✅
```

**CC 공식 문서 확인 (2026-03-07)**:

| 항목 | 공식 문서 확인 내용 |
|------|-------------------|
| Teammate는 독립 세션 | "Separate Claude Code instances that each work on assigned tasks" |
| Teammate 컨텍스트 로딩 | "loads the same project context as a regular session: **CLAUDE.md, MCP servers, and skills**" |
| Teammate 간 소통 | "Shared task list + Mailbox (message, broadcast)" |
| 중첩 제한 | "**No nested teams**: teammates cannot spawn their own teams" (but CAN spawn subagents) |
| 팀 크기 권장 | "3-5 teammates, 5-6 tasks per teammate" |
| Teammate permissions | "start with the lead's permission settings" |
| `memory` frontmatter | **문서에 미언급** — 사전 검증 필요 |
| `skills`/`hooks` in teammates | CC #30703 미해결 — teammate가 agent .md의 skills/hooks를 무시할 수 있음 |

---

### 3.2 `skills/pdca/SKILL.md` — CTO/PM Team 액션 재설계

**현재 상태**:
```yaml
# line 28-29
agents:
  team: bkit:cto-lead    # ← nested spawn으로 차단됨
  pm: bkit:pm-lead        # ← nested spawn으로 차단됨
```

**수정 방안**: `agents.team`과 `agents.pm`을 모두 `null`로 변경. Main Session이 Team Lead로서 CC Agent Teams(TeamCreate)를 직접 사용.

```yaml
# 수정 후
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  team: null              # ← Main Session이 Team Lead, TeamCreate로 팀 생성
  pm: null                # ← Main Session이 Team Lead, TeamCreate로 PM팀 생성
  default: null
```

#### SKILL.md `### team` 섹션 전면 재작성 (line 187-241):

```markdown
### team (Team Mode) - v1.6.1

Start PDCA Team Mode using CC Agent Teams. Main Session acts as Team Lead,
creating teammates as independent Claude Code sessions via TeamCreate.

**Architecture**: Each teammate is an independent Claude Code session.
Teammates can spawn their own subagents (1-level), preserving the full
delegation chain without flattening.

#### team [feature] - Start CTO Team

1. Verify Agent Teams is enabled: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
2. Detect project level via `detectLevel()` — Starter cannot use Team Mode
3. Determine team composition from `lib/team/strategy.js`:
   - Dynamic: 3 teammates (developer, frontend, qa)
   - Enterprise: 5-6 teammates (architect, developer, qa, reviewer, security)
4. **Create Agent Team** using TeamCreate:
   - Team name: `bkit-cto-{feature}`
   - Each teammate gets a rich spawn prompt with:
     - Role description from `agents/{name}.md`
     - PDCA phase context and orchestration pattern
     - File ownership boundaries
     - Quality gate requirements
5. Confirm team composition with AskUserQuestion before creation
6. Create shared tasks in Task List based on PDCA phase:
   - 5-6 tasks per teammate (CC best practice)
   - Task dependencies: Plan → Design → Do → Check → Act
7. Monitor progress, synthesize teammate outputs, enforce quality gates

#### Orchestration via Agent Teams

| Pattern | Agent Teams Execution |
|---------|----------------------|
| Leader | Team Lead assigns tasks sequentially, reviews each output |
| Council | 2-3 teammates work in parallel, Team Lead synthesizes |
| Swarm | All teammates work simultaneously on independent tasks |
| Watchdog | Dedicated qa-monitor teammate runs continuously |

#### Teammate Spawn Prompt Template

Each teammate receives this context at creation:

    ## Role: {role_name} — {role_description}
    ## Feature: {feature_name}
    ## PDCA Phase: {current_phase}
    ## Project Level: {level}

    ## File Ownership (work within these boundaries):
    {file_list}

    ## Your Subagents (you can spawn these as needed):
    {list of Agent() types this teammate can use}

    ## Communication:
    - Use the shared Task List to claim and complete tasks
    - Message the Team Lead when you need decisions or approvals
    - Message other teammates when you need their input
    - Mark tasks complete when finished

    ## Quality Gates:
    - Match Rate >= 90% for Check phase approval
    - All files must follow bkit conventions (English code, Korean docs/)
    - Do NOT modify files outside your ownership scope

#### team status - Show Team Status

1. Read team config from `~/.claude/teams/bkit-cto-{feature}/config.json`
2. Read shared task list from `~/.claude/tasks/bkit-cto-{feature}/`
3. Display: teammate names, current tasks, completion status

#### team cleanup - Cleanup Team Resources

1. Request all teammates to shut down gracefully
2. Wait for confirmation (teammates finish current work)
3. Run team cleanup to remove shared resources
4. Record `team_session_ended` in PDCA history
5. Display: "Team cleaned up, returning to single-session mode"

**Level Requirements**:
| Level | Available | Teammates | 2-Level Delegation |
|-------|:---------:|:---------:|:------------------:|
| Starter | No | - | - |
| Dynamic | Yes | 3 | ✅ (each teammate = independent session) |
| Enterprise | Yes | 5-6 | ✅ (each teammate = independent session) |
```

#### SKILL.md `### pm` 섹션 수정 (line 85-100):

```markdown
### pm (PM Analysis Phase) - v1.6.1

Run PM Agent Team for product discovery using CC Agent Teams.

1. Verify Agent Teams is enabled
2. **Create PM Agent Team** using TeamCreate:
   - Team name: `bkit-pm-{feature}`
   - 4 teammates: pm-discovery, pm-strategy, pm-research, pm-prd
3. Team Lead (Main Session) orchestrates:
   - Phase 1: Context Collection (Team Lead does this directly)
   - Phase 2: Parallel Analysis — 3 teammates (pm-discovery, pm-strategy, pm-research) work simultaneously
   - Phase 3: Wait for Phase 2 completion, then assign pm-prd to synthesize PRD
   - Phase 4: Verify PRD at `docs/00-pm/{feature}.prd.md`
4. Clean up PM team after PRD delivery
5. Guide user to `/pdca plan {feature}`
```

---

### 3.3 `lib/team/coordinator.js` — Agent Teams 통합

**현재 상태**: 5개 함수 export, Agent Teams API 미사용 (TeamCreate 0회 호출).

**추가 함수**:

```javascript
/**
 * Build Agent Teams creation plan for CTO orchestration
 * Returns teammate definitions for TeamCreate tool usage.
 *
 * @param {string} teamType - 'cto' | 'pm'
 * @param {string} feature - Feature name
 * @param {Object} [options] - { phase, level }
 * @returns {Object|null} { teamName, teammates: [{name, prompt, agentType}], taskPlan }
 */
function buildAgentTeamPlan(teamType, feature, options = {}) {
  if (!isTeamModeAvailable()) return null;

  let level = options.level;
  if (!level) {
    try {
      const { detectLevel } = require('../pdca/level');
      level = detectLevel();
    } catch (e) {
      level = 'Dynamic';
    }
  }
  if (level === 'Starter') return null;

  const teamName = `bkit-${teamType}-${feature}`;

  if (teamType === 'pm') {
    return buildPmTeamPlan(teamName, feature);
  }

  return buildCtoTeamPlan(teamName, feature, options.phase || 'plan', level);
}

/**
 * Build CTO Agent Team plan
 */
function buildCtoTeamPlan(teamName, feature, phase, level) {
  const { TEAM_STRATEGIES } = require('./strategy');
  const { selectOrchestrationPattern } = require('./orchestrator');
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return null;

  const pattern = selectOrchestrationPattern(phase, level);

  // Filter roles for this phase
  const phaseRoles = strategy.roles.filter(r => r.phases.includes(phase));
  if (phaseRoles.length === 0) return null;

  const teammates = phaseRoles.map(role => ({
    name: role.name,
    agentType: role.agents[0],
    allAgents: role.agents,
    description: role.description,
    files: getFileOwnership(phase, role.name, feature),
    prompt: generateTeammatePrompt(role, phase, feature, level, pattern),
  }));

  // Generate task plan (5-6 tasks per teammate, CC best practice)
  const taskPlan = generateTaskPlan(phase, feature, teammates);

  return {
    teamName,
    feature,
    phase,
    level,
    pattern,
    teammates,
    taskPlan,
    ctoAgent: strategy.ctoAgent,
  };
}

/**
 * Build PM Agent Team plan
 */
function buildPmTeamPlan(teamName, feature) {
  const pmRoles = [
    { name: 'pm-discovery', description: 'Opportunity Solution Tree analysis', agents: ['pm-discovery'] },
    { name: 'pm-strategy', description: 'Value Proposition + Lean Canvas', agents: ['pm-strategy'] },
    { name: 'pm-research', description: 'Personas + Competitors + Market Sizing', agents: ['pm-research'] },
    { name: 'pm-prd', description: 'PRD synthesis from analysis results', agents: ['pm-prd'] },
  ];

  const teammates = pmRoles.map(role => ({
    name: role.name,
    agentType: role.agents[0],
    description: role.description,
    files: [`docs/00-pm/${feature}.prd.md`],
    prompt: generatePmTeammatePrompt(role, feature),
  }));

  const taskPlan = [
    { name: 'context-collection', assignee: null, description: 'Team Lead collects project context' },
    { name: 'opportunity-analysis', assignee: 'pm-discovery', dependsOn: ['context-collection'] },
    { name: 'value-strategy', assignee: 'pm-strategy', dependsOn: ['context-collection'] },
    { name: 'market-research', assignee: 'pm-research', dependsOn: ['context-collection'] },
    { name: 'prd-synthesis', assignee: 'pm-prd', dependsOn: ['opportunity-analysis', 'value-strategy', 'market-research'] },
    { name: 'prd-review', assignee: null, description: 'Team Lead reviews and delivers PRD' },
  ];

  return { teamName, feature, phase: 'pm', level: 'Dynamic', pattern: 'council', teammates, taskPlan };
}

/**
 * Generate rich spawn prompt for a CTO teammate
 */
function generateTeammatePrompt(role, phase, feature, level, pattern) {
  const fileList = getFileOwnership(phase, role.name, feature);
  const subagentList = role.agents.length > 1
    ? role.agents.slice(1).map(a => `- Agent(${a})`).join('\n')
    : '- (none — work independently)';

  return [
    `## Role: ${role.name} — ${role.description}`,
    `## Feature: ${feature}`,
    `## PDCA Phase: ${phase}`,
    `## Project Level: ${level}`,
    `## Orchestration Pattern: ${pattern}`,
    ``,
    `## File Ownership:`,
    ...fileList.map(f => `- ${f}`),
    ``,
    `## Your Subagents (spawn as needed):`,
    subagentList,
    ``,
    `## Communication:`,
    `- Use shared Task List to claim and complete tasks`,
    `- Message Team Lead for decisions or approvals`,
    `- Message other teammates for cross-domain input`,
    `- Mark tasks complete when finished`,
    ``,
    `## Quality Gates:`,
    `- Follow bkit conventions (English code, Korean docs/)`,
    `- Do NOT modify files outside your ownership scope`,
    `- Report blockers clearly rather than guessing`,
  ].join('\n');
}

/**
 * Generate spawn prompt for a PM teammate
 */
function generatePmTeammatePrompt(role, feature) {
  return [
    `## Role: ${role.name} — ${role.description}`,
    `## Feature: ${feature}`,
    `## Phase: PM Analysis (pre-Plan)`,
    ``,
    `## Your Task:`,
    `Analyze the feature "${feature}" from your specialized perspective.`,
    `Read project context (package.json, CLAUDE.md, git history) to understand the project.`,
    ``,
    `## Output:`,
    `Write your analysis results clearly. The pm-prd teammate will synthesize all analyses into a PRD.`,
    ``,
    `## Communication:`,
    `- Message the Team Lead when your analysis is complete`,
    `- Mark your assigned task as complete`,
  ].join('\n');
}

/**
 * Generate task plan for CTO team (5-6 tasks per teammate)
 */
function generateTaskPlan(phase, feature, teammates) {
  const tasks = [];
  for (const tm of teammates) {
    tasks.push({
      name: `${phase}-${tm.name}-analysis`,
      assignee: tm.name,
      description: `${tm.description} for ${feature}`,
    });
  }
  // Add synthesis task for Team Lead
  tasks.push({
    name: `${phase}-synthesis`,
    assignee: null,
    description: `Synthesize ${phase} phase outputs from all teammates`,
    dependsOn: tasks.map(t => t.name),
  });
  return tasks;
}

/**
 * Get file ownership hints for a role in a phase
 * @param {string} phase
 * @param {string} roleName
 * @param {string} feature
 * @returns {string[]}
 */
function getFileOwnership(phase, roleName, feature) {
  const ownershipMap = {
    pm: {
      default: [`docs/00-pm/${feature}.prd.md`],
    },
    plan: {
      pm: [`docs/00-pm/${feature}.prd.md`],
      architect: [`docs/01-plan/features/${feature}.plan.md`],
      default: [`docs/01-plan/features/${feature}.plan.md`],
    },
    design: {
      architect: [`docs/02-design/features/${feature}.design.md`],
      frontend: [`docs/02-design/features/${feature}.design.md`],
      security: [`docs/02-design/features/${feature}.design.md`],
      default: [`docs/02-design/features/${feature}.design.md`],
    },
    do: {
      developer: ['lib/**/*.js', 'scripts/**/*.js'],
      frontend: ['components/**/*', 'pages/**/*', 'app/**/*'],
      default: ['lib/**/*.js'],
    },
    check: {
      qa: [`docs/03-analysis/${feature}.analysis.md`],
      reviewer: ['lib/**/*.js', 'agents/*.md'],
      security: ['lib/**/*.js', 'hooks/**/*'],
      default: [`docs/03-analysis/${feature}.analysis.md`],
    },
    act: {
      developer: ['lib/**/*.js'],
      reviewer: ['lib/**/*.js'],
      default: ['lib/**/*.js'],
    },
  };

  const phaseMap = ownershipMap[phase] || ownershipMap.do;
  return phaseMap[roleName] || phaseMap.default || [];
}
```

**module.exports 수정**:
```javascript
module.exports = {
  isTeamModeAvailable,
  getTeamConfig,
  generateTeamStrategy,
  formatTeamStatus,
  suggestTeamMode,
  buildAgentTeamPlan,       // NEW: v1.6.1
  getFileOwnership,         // NEW: v1.6.1
};
```

---

### 3.4 `lib/team/orchestrator.js` — `generateSpawnTeamCommand()` 실구현

**현재 상태**: `generateSpawnTeamCommand()`는 `spawnTeam` 데이터를 생성하지만, 실제 CC TeamCreate API와 연결되지 않음. `composeTeamForPhase()`는 그대로 유효.

**수정**: 기존 함수 구조 유지하되, `generateSpawnTeamCommand()`의 반환값을 실제 TeamCreate에 사용 가능하도록 보강.

```javascript
/**
 * Generate TeamCreate-compatible command data
 * Updated for CC Agent Teams integration (v1.6.1)
 *
 * @param {string} phase - PDCA phase
 * @param {string} level - Project level
 * @param {string} feature - Feature name
 * @returns {Object|null} TeamCreate-compatible data
 */
function generateSpawnTeamCommand(phase, level, feature) {
  if (!isTeamModeAvailable()) return null;

  const team = composeTeamForPhase(phase, level, feature);
  if (!team || !team.teammates || team.teammates.length === 0) return null;

  const command = {
    operation: 'TeamCreate',           // Changed from 'spawnTeam'
    teamName: `bkit-cto-${feature}`,
    teammates: team.teammates.map(t => ({
      name: t.name,
      agentType: t.agentType,
      prompt: t.task,                   // Spawn prompt for teammate
      planModeRequired: t.planModeRequired,
    })),
    metadata: {
      feature,
      phase,
      level,
      pattern: team.pattern,
      ctoAgent: team.ctoAgent,
    },
  };

  debugLog('Orchestrator', 'TeamCreate command generated', {
    phase, level, feature,
    teammateCount: command.teammates.length,
  });

  return command;
}
```

기존 `generateSubagentSpawnPrompt()`도 유지 (A안 fallback용):

```javascript
/**
 * Generate spawn prompt for subagent (A안 fallback)
 * Used when Agent Teams is not available and single-session CTO is needed.
 */
function generateSubagentSpawnPrompt(agentInfo, context) {
  const { feature, phase, level, pattern, previousOutput } = context;
  const fileList = agentInfo.files && agentInfo.files.length > 0
    ? agentInfo.files.map(f => `- ${f}`).join('\n')
    : '- (no specific file restriction)';
  const previousContext = previousOutput
    ? `\n## Previous Phase Output:\n${previousOutput}\n` : '';

  return [
    `## Task: ${phase} phase — ${agentInfo.description}`,
    `## Feature: ${feature}`,
    `## Project Level: ${level}`,
    `## Orchestration Pattern: ${pattern}`,
    ``, `## File Ownership:`, fileList, previousContext,
    `## Constraints:`,
    `- Follow bkit conventions (English code, Korean docs/)`,
    `- Do NOT modify files outside your ownership scope`,
    `- Output must be actionable`,
    ``, `## Specific Task:`, agentInfo.task,
  ].join('\n');
}
```

**module.exports**:
```javascript
module.exports = {
  PHASE_PATTERN_MAP: DEFAULT_PHASE_PATTERN_MAP,
  DEFAULT_PHASE_PATTERN_MAP,
  selectOrchestrationPattern,
  composeTeamForPhase,
  generateSpawnTeamCommand,
  generateSubagentSpawnPrompt,   // NEW: A안 fallback
  createPhaseContext,
  shouldRecomposeTeam,
};
```

---

### 3.5 `agents/cto-lead.md` + `agents/pm-lead.md` — 역할 전환 문서화

**cto-lead.md**: Task() 항목을 유지하되, Agent Teams에서 teammate로 사용될 때의 안내 추가.

```markdown
## CC v2.1.69+ Architecture Note

### As Teammate (via `/pdca team`)
When spawned as an Agent Teams teammate, this agent operates as an independent
Claude Code session. The Task() tools below work as 1-level subagents within
this session (NOT nested spawn).

### As Standalone Subagent (via `@cto-lead`)
When invoked as a subagent, Task() tools are blocked by CC's nested spawn
restriction. Use `/pdca team {feature}` for full team orchestration instead.
```

**pm-lead.md**: 동일한 패턴으로 업데이트.

```markdown
## CC v2.1.69+ Architecture Note

### As Teammate (via `/pdca pm`)
When spawned as an Agent Teams teammate, this agent operates as an independent
session. Task(pm-discovery), Task(pm-strategy) etc. work as 1-level subagents.

### As Standalone Subagent (via `@pm-lead`)
Task() tools are blocked. Use `/pdca pm {feature}` for PM team analysis.
```

**설계 결정**: Agent .md 파일의 `tools:` 섹션은 변경하지 않음 — Agent Teams teammate로 사용될 때 Task()가 정상 동작하므로 기존 정의를 그대로 활용.

---

### 3.6 `scripts/user-prompt-handler.js` — Team Mode 제안 메시지 업데이트

**변경**: 제안 메시지를 Agent Teams 기반으로 업데이트 (optional, 동작 변경 없음).

```javascript
// Line 184-186
contextParts.push(
  `CTO Agent Team recommended for ${teamSuggestion.level} level. ` +
  `Use \`/pdca team {feature}\` for parallel PDCA with Agent Teams orchestration.`
);
```

---

### 3.7 에이전트 메모리 호환성 (사전 검증 필요)

**위험**: CC 공식 문서는 teammate 컨텍스트에 대해 "CLAUDE.md, MCP servers, and skills"만 명시. `memory` frontmatter 지원 여부가 불확실.

**현재 축적된 에이전트 메모리** (보존 필수):
```
.claude/agent-memory/
├── bkit-cto-lead/MEMORY.md                    ← 축적됨
├── bkit-cto-lead/cc-compatibility-v2.1.34-v2.1.37.md
├── bkit-qa-strategist/MEMORY.md               ← 축적됨
├── bkit-gap-detector/MEMORY.md                ← 축적됨
├── bkit-frontend-architect/MEMORY.md          ← 축적됨
├── bkit-product-manager/MEMORY.md             ← 축적됨
├── bkit-bkend-expert/MEMORY.md                ← 축적됨
├── bkit-pm-discovery/MEMORY.md                ← 축적됨
└── (21개 에이전트 × memory: project/user 설정)
```

**검증 매트릭스**:

| 항목 | Subagent (현재) | Agent Teams Teammate |
|------|:---:|:---:|
| `memory` frontmatter | ✅ 공식 지원 | ❓ 검증 필요 |
| `.claude/agent-memory/` 자동 로딩 | ✅ | ❓ |
| agent .md 파일 설정 적용 | ✅ 완전 | ❓ agentType 매핑 |
| CLAUDE.md 로딩 | ✅ | ✅ (문서 확인) |
| Skills 로딩 | ✅ | ✅ (문서 확인, #30703 주의) |
| MCP servers 로딩 | ✅ | ✅ (문서 확인) |

**사전 검증 스파이크** (구현 전 필수):

1. `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경에서 TeamCreate 실행
2. `memory: project` 설정된 agent를 teammate로 spawn
3. 해당 teammate가 `.claude/agent-memory/{name}/MEMORY.md`를 읽을 수 있는지 확인
4. 읽기 가능 → B안 확정, 읽기 불가 → A'안(평탄화) fallback

**Fallback 전략**:
- 메모리 미지원 시: teammate spawn prompt에 메모리 내용을 직접 주입 (context 비용 증가, but 동작 보장)
- 또는 A'안(Main Session 스킬 오케스트레이션 + 2단계 평탄화)으로 전환

---

### 3.8 CC Architecture Constraints Reference

| Constraint | CC Version | Status | B안 영향 |
|-----------|:----------:|:------:|---------|
| Subagents cannot spawn other subagents | v2.1.69+ | Permanent | B안에서 해결됨 (teammate는 subagent 아님) |
| No nested teams | v2.1.69+ | Permanent | OK (단일 팀만 사용) |
| Team agents ignore `skills`, `hooks` frontmatter | v2.1.69+ | Open [#30703](https://github.com/anthropics/claude-code/issues/30703) | ⚠️ teammate에서 bkit skills 미로딩 가능 |
| Custom agent definitions as teammates | v2.1.64+ | Partial [#24316](https://github.com/anthropics/claude-code/issues/24316) | ⚠️ `model`, `disallowedTools` 동작, `skills`/`hooks` 미동작 |
| One team per session | v2.1.69+ | Permanent | CTO팀과 PM팀은 순차 실행 필요 |
| No session resumption for teammates | v2.1.69+ | Current | `/resume` 시 teammate 재생성 필요 |
| `memory` frontmatter for teammates | ❓ | 미확인 | 사전 검증 스파이크 필수 |
| Teammate permissions = Lead's | v2.1.69+ | Permanent | OK (acceptEdits 전파) |

**CC #30703 완화 전략**: teammate의 spawn prompt에 skill 핵심 내용을 직접 포함하여 skills frontmatter 미로딩 문제를 우회.

---

### 3.9 Test Plan (Layer 0)

| # | Test Case | Input | Expected | Verification |
|---|-----------|-------|----------|-------------|
| T-L0-01 | `/pdca team` 실행 시 Agent Teams 생성 | `/pdca team test-feature` | TeamCreate로 teammate 생성 | Manual test |
| T-L0-02 | CTO 팀 구성 (Enterprise) | `buildAgentTeamPlan('cto', 'test', {level:'Enterprise'})` | 5-6 teammates with prompts | Unit test |
| T-L0-03 | PM 팀 구성 | `buildAgentTeamPlan('pm', 'test')` | 4 teammates (discovery, strategy, research, prd) | Unit test |
| T-L0-04 | Teammate spawn prompt 품질 | `generateTeammatePrompt(role, ...)` | Role, feature, files, subagents 포함 | String assertion |
| T-L0-05 | Task plan 생성 | CTO team + check phase | 5-6 tasks per teammate + synthesis task | Unit test |
| T-L0-06 | Starter level 차단 | `buildAgentTeamPlan('cto', 'test', {level:'Starter'})` | `null` | Unit test |
| T-L0-07 | Agent Teams 미활성 시 | env 미설정 | `null` | Unit test |
| T-L0-08 | 2단계 위임 동작 | Teammate(qa-strategist) → Agent(gap-detector) | 정상 spawn | Manual test (CC v2.1.71) |
| T-L0-09 | PM 팀 병렬 분석 | `/pdca pm test-feature` | 3 teammates 동시 작업, pm-prd는 대기 | Manual test |
| T-L0-10 | 메모리 호환성 스파이크 | Teammate with `memory: project` | `.claude/agent-memory/` 접근 가능 | Spike test |
| T-L0-11 | Team cleanup | `/pdca team cleanup` | 모든 teammates 종료, 리소스 정리 | Manual test |
| T-L0-12 | One team per session 제약 | CTO팀 실행 중 PM팀 시도 | 에러 또는 CTO팀 정리 후 PM팀 시작 | Manual test |
| T-L0-13 | `getFileOwnership()` | `getFileOwnership('do', 'developer', 'test')` | `['lib/**/*.js', 'scripts/**/*.js']` | Unit test |

### 3.10 Acceptance Criteria (Layer 0)

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-L0-01 | `/pdca team {feature}` CC v2.1.69+에서 nested spawn 에러 미발생 | Agent Teams로 정상 팀 생성 |
| AC-L0-02 | CTO teammate가 자체 subagent spawn 가능 | qa-strategist → Agent(gap-detector) 동작 확인 |
| AC-L0-03 | `/pdca pm {feature}` 4개 PM teammate 정상 동작 | 병렬 분석 + PRD 생성 |
| AC-L0-04 | Teammate spawn prompt에 CE 요소 포함 | role, feature, files, subagents, communication |
| AC-L0-05 | 기존 coordinator.js API 호환 유지 | 기존 5개 함수 시그니처 변경 없음 |
| AC-L0-06 | 에이전트 메모리 접근 가능 (또는 fallback 동작) | 스파이크 검증 통과 또는 prompt 주입 우회 |
| AC-L0-07 | Task List에 5-6 tasks per teammate 생성 | CC best practice 준수 |
| AC-L0-08 | 기존 `cto-lead.md`, `pm-lead.md` standalone 동작 유지 | `@cto-lead`, `@pm-lead` 직접 호출 시 에러 없음 |

---

## 4. Layer 1: Bug Fix — 상세 설계

### 4.1 M-01: `shouldClarify` 반환값 추가 (BUG-01)

**파일**: `lib/intent/ambiguity.js`
**위치**: Line 142-195 (`calculateAmbiguityScore` 함수)

**현재 상태** (line 194):
```javascript
return { score, factors };
```

**문제**: 호출자가 clarification 필요 여부를 판단하려면 별도 로직 필요. `shouldClarify` 프로퍼티 부재로 No Guessing 철학 위반.

**수정 방안** (line 191-194 교체):
```javascript
  // Clamp score to 0-1 range
  score = Math.min(1, Math.max(0, score));

  // Determine if clarification is needed
  const confidenceThreshold = getConfig('triggers.confidenceThreshold', 0.7);
  const shouldClarify = score >= (1 - confidenceThreshold) && factors.length >= 2;

  return { score, factors, shouldClarify };
```

**설계 결정**:
- `shouldClarify` 조건: `score >= (1 - confidenceThreshold)` AND `factors.length >= 2`
- 기본 threshold 0.7이면, score >= 0.3이고 factor가 2개 이상일 때 clarification
- 새 프로퍼티 추가이므로 기존 호출자 코드 변경 불필요 (backward compatible)
- `getConfig`는 이미 line 143에서 destructuring되어 있으므로 추가 import 불필요

**영향 범위**:
- `lib/intent/ambiguity.js`: 3줄 추가
- 호출자: 변경 불필요 (optional property)

**검증**:
```javascript
// score=0.5, factors=3 → shouldClarify=true (0.5 >= 0.3 && 3 >= 2)
// score=0.1, factors=1 → shouldClarify=false (0.1 < 0.3)
// score=0.4, factors=1 → shouldClarify=false (factors < 2)
```

---

### 4.2 M-03: `confidenceThreshold` 하드코딩 제거 (BUG-03)

**파일**: `lib/intent/trigger.js`
**위치**: Line 48, Line 82-83

**현재 상태**:

Line 43에서 config를 읽지만 비교에만 사용하고, 결과값은 하드코딩:
```javascript
// Line 43
const confidenceThreshold = getConfig('triggers.confidenceThreshold', 0.7);

// Line 48 — 하드코딩 0.8
const result = { agent: `bkit:${agent}`, confidence: 0.8 };

// Line 82-83 — 하드코딩 0.8
const result = {
  skill: `bkit:${skill}`,
  level: levelMap[skill] || 'Dynamic',
  confidence: 0.8
};
```

**수정 방안**:

Line 48 교체:
```javascript
      const result = { agent: `bkit:${agent}`, confidence: Math.min(1, confidenceThreshold + 0.1) };
```

Line 79-83 교체:
```javascript
      const result = {
        skill: `bkit:${skill}`,
        level: levelMap[skill] || 'Dynamic',
        confidence: Math.min(1, confidenceThreshold + 0.1)
      };
```

**설계 결정**:
- `confidenceThreshold + 0.1`: config threshold보다 약간 높은 값으로 설정 (매칭 성공 = threshold 초과)
- `Math.min(1, ...)`: confidence가 1을 초과하지 않도록 클램프
- config 기본값 0.7 → confidence = 0.8 (기존 동작 유지, 하지만 config 변경 시 연동)

**영향 범위**:
- `lib/intent/trigger.js`: 2곳 수정
- 기존 기본값(0.7 + 0.1 = 0.8)과 동일하므로 behavioral change 없음

---

### 4.3 M-02: `savePdcaTaskId` Import 수정 (BUG-02)

**파일**: `lib/task/creator.js`
**위치**: Line 126

**현재 상태**:
```javascript
// Line 126
const { updatePdcaStatus, savePdcaTaskId } = getPdca();
```

**문제**: `getPdca()`는 `lib/pdca/index.js`를 반환. 해당 모듈은 `updatePdcaStatus`는 export하지만 `savePdcaTaskId`는 export하지 않음. 결과: `savePdcaTaskId`가 `undefined`가 되어 line 146 호출 시 `TypeError: savePdcaTaskId is not a function` 크래시 발생.

**실제 위치 확인**:
- `savePdcaTaskId`는 `lib/task/tracker.js:31`에서 정의
- `lib/task/index.js:39`에서 export
- `lib/common.js:246`에서 re-export

**수정 방안** (line 126 교체):
```javascript
  const { updatePdcaStatus } = getPdca();
  const { savePdcaTaskId } = require('./tracker');
```

**설계 결정**:
- 같은 `lib/task/` 패키지 내 모듈이므로 직접 require가 더 명확
- `getPdca()` lazy require 패턴 유지 (updatePdcaStatus만 사용)
- 순환 의존성 없음 확인: `tracker.js` → `../pdca` (단방향)

**영향 범위**:
- `lib/task/creator.js`: 1줄 → 2줄 교체
- 런타임 동작: 크래시 해소 (P0)

---

### 4.4 M-06: PDCA Phases 배열 통일 (GAP-04)

**파일**: `lib/task/creator.js`
**위치**: Line 128

**현재 상태**:
```javascript
// Line 128
const phases = ['plan', 'design', 'do', 'check', 'report'];
```

**문제**: `lib/pdca/phase.js`의 `PDCA_PHASES`는 8개 phase(`pm,plan,design,do,check,act,report,archived`)를 정의하지만, `creator.js`는 5개만 사용하여 `act` phase가 task chain에서 누락됨.

**수정 방안** (line 125-128 교체):
```javascript
  const { updatePdcaStatus } = getPdca();
  const { savePdcaTaskId } = require('./tracker');

  // Derive phases from PDCA_PHASES (Single Source of Truth)
  const { PDCA_PHASES } = getPdca();
  const phases = Object.keys(PDCA_PHASES)
    .filter(p => !['pm', 'archived'].includes(p));
  // Result: ['plan', 'design', 'do', 'check', 'act', 'report']
```

**설계 결정**:
- `PDCA_PHASES` 객체의 key 순서는 정의 순서를 따름 (ES2015+)
- `pm`과 `archived`는 task chain에 포함하지 않음 (pm은 별도 PM Team, archived는 후처리)
- 결과: 기존 5개 → 6개 (act 추가)
- `generatePdcaTaskSubject()`에 이미 `act` 아이콘 정의 (line 36) → 호환

**영향 범위**:
- `lib/task/creator.js`: line 125-128 교체 (M-02와 통합)
- 동작 변경: task chain에 `act` phase 추가 (5→6 tasks)

**통합된 M-02 + M-06 수정** (line 125-128 전체):
```javascript
  const { updatePdcaStatus, PDCA_PHASES } = getPdca();
  const { savePdcaTaskId } = require('./tracker');

  // Derive phases from PDCA_PHASES (Single Source of Truth)
  const phases = Object.keys(PDCA_PHASES)
    .filter(p => !['pm', 'archived'].includes(p));
```

---

## 5. Layer 2: Config-Code Sync — 상세 설계

### 5.1 M-05: orchestrationPatterns → PHASE_PATTERN_MAP 동기화 (GAP-02)

**파일**: `lib/team/orchestrator.js`
**위치**: Line 19-45

**현재 상태**:

`PHASE_PATTERN_MAP` (line 19-34)이 `bkit.config.json`의 `team.orchestrationPatterns`과 동일한 값을 독립적으로 하드코딩:
```javascript
// orchestrator.js line 19-34 (하드코딩)
const PHASE_PATTERN_MAP = {
  Dynamic: { plan: 'leader', design: 'leader', do: 'swarm', check: 'council', act: 'leader' },
  Enterprise: { plan: 'leader', design: 'council', do: 'swarm', check: 'council', act: 'watchdog' },
};

// bkit.config.json line 99-114 (Config)
"orchestrationPatterns": {
  "Dynamic": { "plan": "leader", "design": "leader", "do": "swarm", "check": "council", "act": "leader" },
  "Enterprise": { "plan": "leader", "design": "council", "do": "swarm", "check": "council", "act": "watchdog" }
}
```

현재 값은 동일하지만, Config 수정 시 코드가 따라가지 않음 → Docs=Code 위반.

**수정 방안**:

**Step 1**: `PHASE_PATTERN_MAP` 상수를 default fallback으로 유지하되, `selectOrchestrationPattern()`이 config를 우선 참조하도록 변경:

```javascript
// lib/team/orchestrator.js — 수정 후

/**
 * Default orchestration pattern mapping (fallback when config unavailable)
 * @type {Object<string, Object<string, string>>}
 */
const DEFAULT_PHASE_PATTERN_MAP = {
  Dynamic: {
    plan: 'leader',
    design: 'leader',
    do: 'swarm',
    check: 'council',
    act: 'leader',
  },
  Enterprise: {
    plan: 'leader',
    design: 'council',
    do: 'swarm',
    check: 'council',
    act: 'watchdog',
  },
};

/**
 * Select orchestration pattern for a PDCA phase
 * Config is Single Source of Truth; hardcoded map is fallback.
 * @param {string} phase - Current PDCA phase
 * @param {string} level - Project level
 * @returns {'leader'|'council'|'swarm'|'pipeline'|'watchdog'|'single'}
 */
function selectOrchestrationPattern(phase, level) {
  if (level === 'Starter') return 'single';

  // 1. Try config first (Single Source of Truth)
  try {
    const { getConfig } = require('../core');
    const configPattern = getConfig(`team.orchestrationPatterns.${level}.${phase}`);
    if (configPattern) return configPattern;
  } catch (e) {
    // Config unavailable — use fallback
  }

  // 2. Fallback to default map
  const map = DEFAULT_PHASE_PATTERN_MAP[level];
  if (!map) return 'single';
  return map[phase] || 'leader';
}
```

**Step 2**: `PHASE_PATTERN_MAP` export를 `DEFAULT_PHASE_PATTERN_MAP`으로 rename하고, backward compatibility를 위해 `PHASE_PATTERN_MAP` alias 유지:

```javascript
module.exports = {
  PHASE_PATTERN_MAP: DEFAULT_PHASE_PATTERN_MAP,      // backward compat
  DEFAULT_PHASE_PATTERN_MAP,
  selectOrchestrationPattern,
  composeTeamForPhase,
  generateSpawnTeamCommand,
  createPhaseContext,
  shouldRecomposeTeam,
};
```

**설계 결정**:
- Config 우선, 하드코딩 fallback 패턴 (config 파일 누락 시에도 동작)
- `getConfig()`의 dot-notation path 지원 활용 (`team.orchestrationPatterns.Dynamic.plan`)
- `require('../core')`를 함수 내 지역적으로 호출하여 모듈 로드 순서 문제 방지
- `PHASE_PATTERN_MAP` export alias로 backward compatibility 보장

**추가 확인 — strategy.js phaseStrategy와의 관계**:
- `lib/team/strategy.js`의 `phaseStrategy`는 역할 수준 전략 (single/parallel/council/swarm/watchdog)
- `orchestrator.js`의 pattern은 오케스트레이션 수준 패턴 (어떻게 팀을 조율할지)
- 두 개념은 다른 레벨에서 동작하며, 현재 `composeTeamForPhase()`가 `strategy.phaseStrategy[phase]`를 반환하면서 `selectOrchestrationPattern()`도 동시에 사용
- 현재 값이 일치하지 않는 경우: Dynamic.design = config에서 'leader'이지만, strategy에서 'single'
- 이것은 의도적 설계: config pattern은 CTO의 조율 방식, strategy는 teammate 구성 방식

**영향 범위**:
- `lib/team/orchestrator.js`: line 19-45 수정
- 외부 API 변경 없음 (함수 시그니처 동일)
- config 변경 시 런타임에 즉시 반영

---

## 6. Layer 3: Agent Security — 상세 설계

### 6.1 M-07: acceptEdits 에이전트 disallowedTools 추가 (GAP-03)

**현재 상태**:

acceptEdits 에이전트 9개 현황:

| Agent | permissionMode | disallowedTools | tools | Role |
|-------|:-:|:-:|-------|------|
| `report-generator` | acceptEdits | `[Bash]` | Read, Write, Glob, Grep | 보고서 (읽기 전용) |
| `starter-guide` | acceptEdits | **없음** | Read, Write, Edit, Glob, Grep, WebSearch, WebFetch | 가이드 |
| `qa-monitor` | acceptEdits | **없음** | Bash | 로그 모니터링 |
| `pdca-iterator` | acceptEdits | **없음** | (기본) | 코드 수정 |
| `enterprise-expert` | acceptEdits | **없음** | Read, Write, Edit, Glob, Grep | 아키텍처 |
| `frontend-architect` | acceptEdits | **없음** | Read, Write, Edit, Glob, Grep, Bash | 프론트엔드 |
| `infra-architect` | acceptEdits | **없음** | Read, Write, Edit, Glob, Grep, Bash | 인프라 |
| `bkend-expert` | acceptEdits | **없음** | Read, Write, Edit | 백엔드 |
| `cto-lead` | acceptEdits | **없음** | Read, Write, Edit, Glob, Grep | 오케스트레이터 |

non-acceptEdits 에이전트 참고 (이미 disallowedTools 설정됨):
- `design-validator`, `gap-detector`, `qa-strategist`, `product-manager` 등

**보안 정책 설계**:

에이전트 역할별 3-tier 보안 모델:

| Tier | 정책 | 대상 에이전트 | disallowedTools |
|------|------|-------------|----------------|
| **Tier 1**: Read-Only | Bash 완전 차단 | `starter-guide` | `[Bash]` |
| **Tier 2**: Safe Execution | 파괴적 명령만 차단 | `enterprise-expert`, `frontend-architect`, `infra-architect`, `bkend-expert`, `cto-lead` | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` |
| **Tier 3**: Full Access | 기존 유지 | `qa-monitor`, `pdca-iterator` | 없음 (Bash 필요) |

**설계 근거**:
- **Tier 1 (starter-guide)**: 초보자 가이드 역할이므로 Bash 불필요. 읽기/쓰기만으로 충분.
- **Tier 2 (architect/expert 5개)**: 설계/구현 에이전트이므로 `npm install`, `git log`, `node` 등은 필요하지만, `rm -rf`, `git push --force`, `git reset --hard`는 위험.
- **Tier 3 (qa-monitor, pdca-iterator)**: qa-monitor는 Docker logs 실행 필수, pdca-iterator는 테스트 실행 및 코드 수정 필수.

**수정 대상 파일 및 변경점**:

#### 6.1.1 `agents/starter-guide.md` — Tier 1
**frontmatter 추가 위치**: `model: sonnet` 아래
```yaml
disallowedTools:
  - Bash
```

#### 6.1.2 `agents/enterprise-expert.md` — Tier 2
**frontmatter 추가 위치**: `model: opus` 아래
```yaml
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

#### 6.1.3 `agents/frontend-architect.md` — Tier 2
**frontmatter 추가 위치**: `model: sonnet` 아래
```yaml
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

#### 6.1.4 `agents/infra-architect.md` — Tier 2
**frontmatter 추가 위치**: `model: opus` 아래
```yaml
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

#### 6.1.5 `agents/bkend-expert.md` — Tier 2
**frontmatter 추가 위치**: `model: sonnet` 아래

`bkend-expert`는 현재 `tools`에 Bash가 없으므로 이미 암묵적으로 Bash 차단됨. 그러나 명시적 보안을 위해 추가:
```yaml
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

#### 6.1.6 `agents/cto-lead.md` — Tier 2
**frontmatter 추가 위치**: `model: opus` 아래
```yaml
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
```

#### 6.1.7 `agents/qa-monitor.md` — Tier 3 (변경 없음)
Bash 필수 (Docker logs 실행). 기존 유지.

#### 6.1.8 `agents/pdca-iterator.md` — Tier 3 (변경 없음)
Bash 필수 (테스트 실행, 코드 수정 검증). 기존 유지.

**Agent Security Matrix (최종)**:

| Agent | permissionMode | disallowedTools | Tier | 변경 |
|-------|:-:|-------|:-:|:-:|
| `report-generator` | acceptEdits | `[Bash]` | 1 | 기존 유지 |
| `starter-guide` | acceptEdits | `[Bash]` | 1 | **추가** |
| `enterprise-expert` | acceptEdits | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` | 2 | **추가** |
| `frontend-architect` | acceptEdits | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` | 2 | **추가** |
| `infra-architect` | acceptEdits | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` | 2 | **추가** |
| `bkend-expert` | acceptEdits | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` | 2 | **추가** |
| `cto-lead` | acceptEdits | `[Bash(rm -rf*), Bash(git push*), Bash(git reset --hard*)]` | 2 | **추가** |
| `qa-monitor` | acceptEdits | 없음 | 3 | 변경 없음 |
| `pdca-iterator` | acceptEdits | 없음 | 3 | 변경 없음 |

**영향 범위**: 6개 에이전트 파일 수정 (각 3-4줄 추가)

---

## 7. Layer 4: Evals Implementation — 상세 설계

### 7.1 GAP-01 현황 분석

**현재 상태**:
- `evals/runner.js`: `runEval()` 함수가 항상 `{ pass: true, details: { status: 'eval_defined' } }` 반환 (stub)
- `evals/config.json`: 28개 스킬 분류 정의 (9 workflow + 18 capability + 1 hybrid)
- `evals/{category}/{skill}/eval.yaml`: 28개 모두 존재, 기본 구조 갖춤
- `evals/{category}/{skill}/prompt-1.md`: 27/28이 1줄 placeholder (pm-discovery만 5줄)
- `evals/{category}/{skill}/expected-1.md`: 27/28이 1줄 placeholder (pm-discovery만 13줄)
- `evals/reporter.js`: 기본 마크다운 리포트 생성 기능 동작

### 7.2 Runner.js 실구현

**현재 stub** (line 55-72):
```javascript
async function runEval(skillName, evalName) {
  const definition = loadEvalDefinition(skillName);
  if (!definition) {
    return { pass: false, details: { error: `No eval found for ${skillName}` } };
  }
  // Always returns pass: true
  return {
    pass: true,
    details: { skill: skillName, classification: definition.classification, status: 'eval_defined', ... }
  };
}
```

**수정 방안**:

```javascript
/**
 * Parse eval YAML content
 * Simple parser for bkit eval.yaml structure (no external dependency)
 * @param {string} content - YAML content string
 * @returns {Object} Parsed eval definition
 */
function parseEvalYaml(content) {
  const result = { name: '', classification: '', evals: [], parity_test: {}, benchmark: {} };
  const lines = content.split('\n');
  let currentSection = null;
  let currentItem = null;
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level key: value
    const topMatch = trimmed.match(/^(\w[\w_]*)\s*:\s*(.*)$/);
    if (topMatch && !line.startsWith('  ')) {
      const [, key, value] = topMatch;
      if (value && !value.startsWith('{') && !value.startsWith('[')) {
        result[key] = value.replace(/^["']|["']$/g, '');
      }
      currentSection = key;
      if (key === 'evals') { inList = true; currentItem = null; }
      continue;
    }

    // List item under evals:
    if (inList && currentSection === 'evals') {
      if (trimmed.startsWith('- ')) {
        if (currentItem) result.evals.push(currentItem);
        currentItem = {};
        const kvMatch = trimmed.slice(2).match(/^(\w+)\s*:\s*(.+)$/);
        if (kvMatch) currentItem[kvMatch[1]] = kvMatch[2].replace(/^["']|["']$/g, '');
      } else if (currentItem) {
        const kvMatch = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
        if (kvMatch) {
          const val = kvMatch[2].replace(/^["']|["']$/g, '');
          if (kvMatch[1] === 'criteria') {
            // criteria is typically a list
            if (!currentItem.criteria) currentItem.criteria = [];
          } else if (kvMatch[1] === 'timeout') {
            currentItem[kvMatch[1]] = parseInt(val, 10);
          } else {
            currentItem[kvMatch[1]] = val;
          }
        }
        // Criteria list items
        if (trimmed.startsWith('- "') || trimmed.startsWith("- '")) {
          if (!currentItem.criteria) currentItem.criteria = [];
          currentItem.criteria.push(trimmed.slice(2).replace(/^["']|["']$/g, ''));
        }
      }
    }

    // Nested key under parity_test or benchmark
    if (currentSection === 'parity_test' || currentSection === 'benchmark') {
      const kvMatch = trimmed.match(/^(\w+)\s*:\s*(.+)$/);
      if (kvMatch) {
        const val = kvMatch[2].replace(/^["']|["']$/g, '');
        if (!result[currentSection]) result[currentSection] = {};
        result[currentSection][kvMatch[1]] = val === 'true' ? true : val === 'false' ? false : val;
      }
    }
  }

  if (currentItem) result.evals.push(currentItem);
  return result;
}

/**
 * Evaluate prompt against expected output using criteria
 * @param {string} prompt - Eval prompt content
 * @param {string} expected - Expected output content
 * @param {string[]} criteria - Evaluation criteria
 * @returns {{ pass: boolean, matchedCriteria: string[], failedCriteria: string[], score: number }}
 */
function evaluateAgainstCriteria(prompt, expected, criteria) {
  // Validation: prompt and expected must be substantive (not placeholder)
  const isPromptPlaceholder = prompt.split('\n').length <= 1 || prompt.length < 50;
  const isExpectedPlaceholder = expected.split('\n').length <= 1 || expected.length < 50;

  if (isPromptPlaceholder || isExpectedPlaceholder) {
    return {
      pass: false,
      matchedCriteria: [],
      failedCriteria: ['Content is placeholder (< 50 chars or single line)'],
      score: 0
    };
  }

  // Check structural completeness
  const matchedCriteria = [];
  const failedCriteria = [];

  // Default criteria if none specified
  const effectiveCriteria = criteria.length > 0 ? criteria : [
    'Prompt must contain clear evaluation scenario',
    'Expected output must define pass/fail criteria'
  ];

  for (const criterion of effectiveCriteria) {
    // Structural checks based on criterion keywords
    const criterionLower = criterion.toLowerCase();

    if (criterionLower.includes('trigger') || criterionLower.includes('keyword')) {
      // Check if prompt mentions trigger/keyword testing
      const hasTriggerContent = prompt.toLowerCase().includes('trigger') ||
                                 prompt.toLowerCase().includes('keyword') ||
                                 prompt.toLowerCase().includes('intent');
      if (hasTriggerContent) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('process') || criterionLower.includes('step')) {
      // Check if expected defines process steps
      const hasSteps = expected.includes('1.') || expected.includes('Step') ||
                       expected.includes('##');
      if (hasSteps) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('output') || criterionLower.includes('produce')) {
      // Check if expected defines output format
      const hasOutput = expected.includes('Expected') || expected.includes('Output') ||
                        expected.includes('Result') || expected.includes('```');
      if (hasOutput) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else if (criterionLower.includes('pattern') || criterionLower.includes('follow')) {
      // Check if expected references patterns
      const hasPattern = expected.includes('pattern') || expected.includes('format') ||
                         expected.includes('structure') || expected.includes('template');
      if (hasPattern) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    } else {
      // Generic: check if expected has substantive content
      if (expected.length >= 100 && expected.split('\n').length >= 5) {
        matchedCriteria.push(criterion);
      } else {
        failedCriteria.push(criterion);
      }
    }
  }

  const score = effectiveCriteria.length > 0
    ? matchedCriteria.length / effectiveCriteria.length
    : 0;

  return {
    pass: failedCriteria.length === 0 && score >= 0.8,
    matchedCriteria,
    failedCriteria,
    score
  };
}

/**
 * Run eval for a single skill (실구현)
 */
async function runEval(skillName, evalName) {
  const definition = loadEvalDefinition(skillName);
  if (!definition) {
    return { pass: false, details: { error: `No eval found for ${skillName}` } };
  }

  // 1. Parse YAML
  const evalDef = parseEvalYaml(definition.content);
  if (!evalDef.evals || evalDef.evals.length === 0) {
    return { pass: false, details: { error: `No eval entries in ${skillName}/eval.yaml` } };
  }

  // 2. Select eval (by name or first)
  const evalEntry = evalName
    ? evalDef.evals.find(e => e.name === evalName)
    : evalDef.evals[0];

  if (!evalEntry) {
    return { pass: false, details: { error: `Eval "${evalName}" not found in ${skillName}` } };
  }

  // 3. Load prompt and expected files
  const evalDir = path.dirname(definition.path);
  const promptFile = evalEntry.prompt || 'prompt-1.md';
  const expectedFile = evalEntry.expected || 'expected-1.md';

  const promptPath = path.join(evalDir, promptFile);
  const expectedPath = path.join(evalDir, expectedFile);

  let prompt, expected;
  try {
    prompt = fs.readFileSync(promptPath, 'utf8');
  } catch (e) {
    return { pass: false, details: { error: `Prompt file not found: ${promptFile}` } };
  }
  try {
    expected = fs.readFileSync(expectedPath, 'utf8');
  } catch (e) {
    return { pass: false, details: { error: `Expected file not found: ${expectedFile}` } };
  }

  // 4. Extract criteria
  const criteria = evalEntry.criteria || [];

  // 5. Evaluate
  const result = evaluateAgainstCriteria(prompt, expected, criteria);

  return {
    pass: result.pass,
    details: {
      skill: skillName,
      classification: definition.classification,
      evalName: evalEntry.name,
      score: result.score,
      matchedCriteria: result.matchedCriteria,
      failedCriteria: result.failedCriteria,
      promptLength: prompt.length,
      expectedLength: expected.length
    }
  };
}
```

**핵심 설계 결정**:
1. **Custom YAML Parser**: `parseEvalYaml()` — 외부 의존성 없이 bkit eval.yaml 구조만 파싱
2. **Placeholder Detection**: 1줄 또는 50자 미만이면 자동 FAIL (현재 27/28이 여기에 해당)
3. **Criteria-Based Evaluation**: eval.yaml의 criteria 리스트를 키워드 매칭으로 구조적 검증
4. **80% Pass Threshold**: matchedCriteria / totalCriteria >= 0.8이면 pass

### 7.3 Prompt/Expected 작성 전략

**카테고리별 템플릿**:

#### Workflow Skills (9개) — Process Compliance

```markdown
<!-- prompt-1.md Template (Workflow) -->
## Eval Scenario: {skill-name} Process Compliance

### User Request
"{실제 사용자 요청 예시 — 한국어/영어 혼합}"

### Context
- Project level: {Starter|Dynamic|Enterprise}
- Current PDCA phase: {phase or none}
- Existing documents: {list}
- bkit.config.json: {relevant settings}

### Evaluation Criteria
1. Must {process step 1 — 스킬의 핵심 프로세스}
2. Must {process step 2}
3. Must {process step 3}
4. Must NOT {negative criterion — 하지 말아야 할 것}
```

```markdown
<!-- expected-1.md Template (Workflow) -->
## Expected Outputs

### Process Steps Verified
1. **Step 1**: {expected behavior description}
   - File: {expected file path if applicable}
   - Content: {key content requirements}

2. **Step 2**: {expected behavior description}

3. **Step 3**: {expected behavior description}

### Response Format
- {expected response format requirements}
- {language rules adherence}

### Pass Criteria
- All process steps satisfied = PASS
- Any step failed = FAIL with specific reason

### Negative Criteria
- Must NOT {negative behavior} → if detected = FAIL
```

#### Capability Skills (18개) — Output Quality

```markdown
<!-- prompt-1.md Template (Capability) -->
## Eval Scenario: {skill-name} Output Quality

### User Request
"{실제 사용자 요청 예시}"

### Context
- Project level: {level}
- Tech stack: {relevant stack}
- Project structure: {key directories}

### Expected Output Type
- {code|document|guide|configuration}

### Quality Criteria
1. Must produce {specific output type}
2. Output must follow {pattern/convention}
3. Must include {required element}
```

```markdown
<!-- expected-1.md Template (Capability) -->
## Expected Outputs

### Output Verification
- **Type**: {code|document|guide}
- **Format**: {expected format}
- **Content**: {key content verification points}

### Quality Metrics
1. **Accuracy**: {what must be correct}
2. **Completeness**: {what must be included}
3. **Convention**: {what conventions must be followed}

### Code Patterns (if applicable)
```{language}
// Expected pattern (not exact match, structural verification)
{code pattern}
```

### Pass Criteria
- All quality metrics satisfied = PASS
- Score >= 80% on partial criteria = PASS
- Any critical criterion failed = FAIL
```

#### Hybrid Skills (1개: plan-plus) — Process + Quality

Process Compliance + Output Quality 양쪽 기준 모두 적용.

### 7.4 28개 스킬별 Prompt/Expected 요약

| # | Skill | Category | Prompt 핵심 시나리오 | Expected 핵심 검증 |
|---|-------|----------|---------------------|-------------------|
| 1 | bkit-rules | workflow | "새 기능 user-auth 구현" | Auto-apply rules 동작 확인 |
| 2 | bkit-templates | workflow | "Plan 문서 생성" | 템플릿 구조 준수 확인 |
| 3 | pdca | workflow | "/pdca plan user-auth" | Phase transition + doc 생성 |
| 4 | development-pipeline | workflow | "Phase 1부터 시작" | 9-phase pipeline 순서 |
| 5 | phase-2-convention | workflow | "코딩 컨벤션 정리" | Convention 문서 구조 |
| 6 | phase-8-review | workflow | "코드 리뷰 실행" | Review checklist 완성도 |
| 7 | zero-script-qa | workflow | "Docker 로그로 QA" | ZeroScript 프로세스 준수 |
| 8 | code-review | workflow | "PR 리뷰 해줘" | Review criteria 적용 |
| 9 | pm-discovery | workflow | "시장 분석" | Opportunity Tree 생성 |
| 10 | starter | capability | "포트폴리오 사이트 만들기" | HTML/CSS 코드 품질 |
| 11 | dynamic | capability | "Next.js + bkend 프로젝트" | 프로젝트 구조 품질 |
| 12 | enterprise | capability | "마이크로서비스 아키텍처" | 아키텍처 문서 품질 |
| 13 | phase-1-schema | capability | "스키마 정의" | 스키마 문서 구조 |
| 14 | phase-3-mockup | capability | "목업 작성" | 목업 구조 |
| 15 | phase-4-api | capability | "API 설계" | OpenAPI 스펙 품질 |
| 16 | phase-5-design-system | capability | "디자인 시스템" | 컴포넌트 구조 |
| 17 | phase-6-ui-integration | capability | "UI 통합" | 컴포넌트 코드 품질 |
| 18 | phase-7-seo-security | capability | "SEO 최적화" | 체크리스트 완성도 |
| 19 | phase-9-deployment | capability | "배포 설정" | 배포 구성 품질 |
| 20 | mobile-app | capability | "React Native 앱" | 모바일 코드 품질 |
| 21 | desktop-app | capability | "Electron 앱" | 데스크톱 코드 품질 |
| 22 | claude-code-learning | capability | "CC 사용법 알려줘" | 학습 가이드 품질 |
| 23 | bkend-quickstart | capability | "bkend 시작하기" | 퀵스타트 가이드 |
| 24 | bkend-auth | capability | "로그인 구현" | 인증 코드 품질 |
| 25 | bkend-data | capability | "데이터 모델링" | CRUD 코드 품질 |
| 26 | bkend-cookbook | capability | "bkend 레시피" | 코드 예제 품질 |
| 27 | bkend-storage | capability | "파일 업로드" | 스토리지 코드 품질 |
| 28 | plan-plus | hybrid | "브레인스토밍 Plan" | 프로세스+문서 품질 |

### 7.5 Reporter.js 강화

현재 `reporter.js`는 기본 마크다운 리포트만 생성. 추가 기능:

```javascript
/**
 * Format eval results with detailed criteria breakdown
 * @param {Object} benchmarkResult
 * @returns {string} Enhanced markdown report
 */
function formatDetailedReport(benchmarkResult) {
  // 기존 formatMarkdownReport 확장
  // 추가:
  // - 카테고리별 합격률 요약
  // - 실패 스킬의 failedCriteria 상세
  // - Placeholder vs Real content 통계
  // - Score 분포 히스토그램
}
```

---

## 8. Test Plan

### 8.1 Layer 1: Bug Fix 검증

| # | Test Case | Input | Expected | Verification |
|---|-----------|-------|----------|-------------|
| T-01 | shouldClarify true | score=0.5, factors=3 | `shouldClarify: true` | Unit test |
| T-02 | shouldClarify false (low score) | score=0.1, factors=3 | `shouldClarify: false` | Unit test |
| T-03 | shouldClarify false (few factors) | score=0.5, factors=1 | `shouldClarify: false` | Unit test |
| T-04 | confidence uses config | config 0.6 | confidence = 0.7 | `node -e "..."` |
| T-05 | confidence default | no config | confidence = 0.8 | `node -e "..."` |
| T-06 | savePdcaTaskId import | `createPdcaTaskChain('test')` | No TypeError | `node -e "..."` |
| T-07 | phases includes act | `createPdcaTaskChain('test')` | 6 tasks (with act) | `node -e "..."` |
| T-08 | phases order correct | Check phases array | plan,design,do,check,act,report | `node -e "..."` |

### 8.2 Layer 2: Config-Code Sync 검증

| # | Test Case | Input | Expected | Verification |
|---|-----------|-------|----------|-------------|
| T-09 | Config pattern read | Dynamic, plan | 'leader' (from config) | Unit test |
| T-10 | Config override | Modify config to 'council' | 'council' returned | Runtime test |
| T-11 | Fallback on missing config | Delete orchestrationPatterns | Default map used | Unit test |
| T-12 | Starter level | Starter, any phase | 'single' | Unit test |
| T-13 | Unknown level | 'Custom', plan | 'single' | Unit test |

### 8.3 Layer 3: Agent Security 검증

| # | Test Case | Verification |
|---|-----------|-------------|
| T-14 | starter-guide has `disallowedTools: [Bash]` | `grep disallowedTools agents/starter-guide.md` |
| T-15 | Tier 2 agents have 3 deny patterns | `grep -A3 disallowedTools agents/{enterprise-expert,frontend-architect,infra-architect,bkend-expert,cto-lead}.md` |
| T-16 | qa-monitor has NO disallowedTools | `grep disallowedTools agents/qa-monitor.md` → no match |
| T-17 | pdca-iterator has NO disallowedTools | `grep disallowedTools agents/pdca-iterator.md` → no match |
| T-18 | All 9 acceptEdits agents accounted | Count: 1 existing + 6 new = 7 with disallowed, 2 without |

### 8.4 Layer 4: Evals 검증

| # | Test Case | Input | Expected | Verification |
|---|-----------|-------|----------|-------------|
| T-19 | Placeholder detection | 1-line prompt | `pass: false` | `node evals/runner.js --skill starter` |
| T-20 | Real content pass | Multi-line prompt+expected | `pass: true` | After content update |
| T-21 | Full benchmark | `--benchmark` | 28/28 pass | `node evals/runner.js --benchmark` |
| T-22 | YAML parser | pdca/eval.yaml | Correct parse | Unit test |
| T-23 | Category filter | `--classification workflow` | 9 results | CLI test |
| T-24 | Reporter output | Benchmark result | Valid markdown | Visual check |

### 8.5 Integration 검증

| # | Test Case | Verification |
|---|-----------|-------------|
| T-25 | PDCA task chain with act phase | `createPdcaTaskChain('test')` → 6 phases |
| T-26 | Ambiguity + clarification E2E | Ambiguous input → shouldClarify=true → questions generated |
| T-27 | Team composition with config pattern | `composeTeamForPhase('design', 'Enterprise')` → council pattern from config |
| T-28 | Full PDCA cycle | plan→design→do→check→act→report → all phases present |

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|:-----------:|:------:|-----------|
| Agent Teams teammate의 `memory` frontmatter 미지원 | Medium | High | 사전 검증 스파이크 필수 + prompt 주입 fallback 준비 |
| CC #30703 (skills/hooks 무시)로 teammate에서 bkit skills 미로딩 | High | Medium | Spawn prompt에 skill 핵심 내용 직접 포함하여 우회 |
| Agent Teams 실험적 기능 안정성 | Medium | Medium | A'안(평탄화) fallback 준비, CC v2.1.71 기준 테스트 |
| 토큰 비용 선형 증가 (각 teammate = 독립 세션) | High | Low | 문서에 비용 가이드 제공, 팀 크기 3-5로 제한 |
| One team per session 제한으로 CTO팀+PM팀 순차 실행 | High | Low | PM 완료 후 cleanup → CTO팀 시작 프로세스 문서화 |
| `/resume` 시 teammate 미복원 | Medium | Medium | 팀 재생성 안내 + PDCA 상태에서 재개점 복구 |
| Custom YAML parser edge cases | Medium | Low | bkit eval.yaml 구조가 단순하고 고정적 |
| Evals prompt/expected 품질 부족 | Medium | High | 카테고리별 템플릿 기반 작성 + CTO 리뷰 |
| Config 파일 누락 시 fallback 미동작 | Low | Medium | DEFAULT_PHASE_PATTERN_MAP 유지 |
| disallowedTools 과잉 제한 | Low | Low | 역할별 최소 제한 원칙 + Tier 3 유지 |
| phases 배열 변경으로 기존 task chain 영향 | Low | Medium | 기존 chain은 영향 없음 (새 chain만 6개) |
| `require('./tracker')` 순환 의존성 | None | - | tracker→pdca 단방향 확인 완료 |

---

## 10. Implementation Checklist

### Layer 0: CTO/PM Orchestration Redesign — Agent Teams (Priority: P0, 12시간)

**Phase 0-A: 사전 검증 스파이크 (2시간)**
- [ ] Agent Teams 환경에서 TeamCreate 실행 테스트
- [ ] Teammate의 `memory` frontmatter 지원 여부 검증
- [ ] Teammate 내 Agent() subagent spawn 가능 여부 확인
- [ ] 검증 결과에 따라 B안 확정 또는 A'안 fallback 결정

**Phase 0-B: 구현 (10시간)**
- [ ] `skills/pdca/SKILL.md:28-29` — `agents.team: null`, `agents.pm: null`
- [ ] `skills/pdca/SKILL.md:187-241` — `### team` 섹션 전면 재작성 (Agent Teams)
- [ ] `skills/pdca/SKILL.md:85-100` — `### pm` 섹션 Agent Teams 기반으로 재작성
- [ ] `lib/team/coordinator.js` — `buildAgentTeamPlan()` 함수 추가 (CTO+PM)
- [ ] `lib/team/coordinator.js` — `getFileOwnership()` 함수 추가
- [ ] `lib/team/coordinator.js` — `generateTeammatePrompt()`, `generatePmTeammatePrompt()` 추가
- [ ] `lib/team/coordinator.js` — `generateTaskPlan()` 추가
- [ ] `lib/team/coordinator.js` — module.exports 업데이트
- [ ] `lib/team/orchestrator.js` — `generateSpawnTeamCommand()` TeamCreate 호환 업데이트
- [ ] `lib/team/orchestrator.js` — `generateSubagentSpawnPrompt()` 추가 (A안 fallback)
- [ ] `agents/cto-lead.md` — CC v2.1.69+ Architecture Note 추가
- [ ] `agents/pm-lead.md` — CC v2.1.69+ Architecture Note 추가
- [ ] `scripts/user-prompt-handler.js:184-186` — Team Mode 제안 메시지 업데이트 (optional)

### Layer 1: Bug Fix (Priority: P0, 4시간)

- [ ] `lib/intent/ambiguity.js:191-194` — shouldClarify 프로퍼티 추가
- [ ] `lib/intent/trigger.js:48` — confidence 하드코딩 → config 기반
- [ ] `lib/intent/trigger.js:82-83` — confidence 하드코딩 → config 기반
- [ ] `lib/task/creator.js:125-128` — savePdcaTaskId import 수정 + phases 통일

### Layer 2: Config-Code Sync (Priority: P1, 8시간)

- [ ] `lib/team/orchestrator.js:19-34` — PHASE_PATTERN_MAP → DEFAULT_PHASE_PATTERN_MAP
- [ ] `lib/team/orchestrator.js:42-45` — selectOrchestrationPattern config 우선 로직

### Layer 3: Agent Security (Priority: P1, 4시간)

- [ ] `agents/starter-guide.md` — disallowedTools: [Bash]
- [ ] `agents/enterprise-expert.md` — disallowedTools: [Bash(rm -rf*), ...]
- [ ] `agents/frontend-architect.md` — disallowedTools: [Bash(rm -rf*), ...]
- [ ] `agents/infra-architect.md` — disallowedTools: [Bash(rm -rf*), ...]
- [ ] `agents/bkend-expert.md` — disallowedTools: [Bash(rm -rf*), ...]
- [ ] `agents/cto-lead.md` — disallowedTools: [Bash(rm -rf*), ...]

### Layer 4: Evals Implementation (Priority: P1, 20시간)

- [ ] `evals/runner.js` — parseEvalYaml() 구현
- [ ] `evals/runner.js` — evaluateAgainstCriteria() 구현
- [ ] `evals/runner.js` — runEval() 실구현
- [ ] `evals/reporter.js` — formatDetailedReport() 추가
- [ ] 9 workflow skills — prompt-1.md 실컨텐츠 작성
- [ ] 9 workflow skills — expected-1.md 실컨텐츠 작성
- [ ] 18 capability skills — prompt-1.md 실컨텐츠 작성
- [ ] 18 capability skills — expected-1.md 실컨텐츠 작성
- [ ] 1 hybrid skill — prompt-1.md + expected-1.md 실컨텐츠 작성
- [ ] `node evals/runner.js --benchmark` — 28/28 pass 확인

---

## 11. Acceptance Criteria

### M-08: CTO/PM Orchestration Redesign (Agent Teams)

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-L0-01 | `/pdca team {feature}` CC v2.1.69+에서 Agent Teams로 정상 팀 생성 | TeamCreate 동작 확인 |
| AC-L0-02 | CTO teammate가 자체 subagent spawn 가능 | qa-strategist → Agent(gap-detector) 동작 |
| AC-L0-03 | `/pdca pm {feature}` 4개 PM teammate 정상 동작 | 병렬 분석 + PRD 생성 |
| AC-L0-04 | Teammate spawn prompt에 CE 요소 포함 | role, feature, files, subagents, communication |
| AC-L0-05 | 기존 coordinator.js API 호환 유지 | 기존 5개 함수 시그니처 변경 없음 |
| AC-L0-06 | 에이전트 메모리 접근 가능 (또는 fallback 동작) | 스파이크 검증 통과 또는 prompt 주입 |
| AC-L0-07 | Task List에 5-6 tasks per teammate 생성 | CC best practice 준수 |
| AC-L0-08 | 기존 `cto-lead.md`, `pm-lead.md` standalone 동작 유지 | 직접 호출 시 에러 없음 |

### M-01: shouldClarify

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-01 | `calculateAmbiguityScore()` 반환값에 `shouldClarify` boolean 포함 | `typeof result.shouldClarify === 'boolean'` |
| AC-02 | 기존 `score`, `factors` 반환값 변경 없음 | Backward compatible |
| AC-03 | config threshold 0.7 기준, score >= 0.3 && factors >= 2 → true | Unit test 3건 |

### M-02: savePdcaTaskId Import

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-04 | `createPdcaTaskChain()` 호출 시 TypeError 미발생 | Runtime error 없음 |
| AC-05 | Task ID가 정상 저장됨 | Status file 확인 |

### M-03: confidenceThreshold

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-06 | `matchImplicitAgentTrigger()` confidence가 config 기반 | config 0.6 → confidence 0.7 |
| AC-07 | 기본 config(0.7)에서 기존 동작(0.8)과 동일 | Behavioral regression 없음 |

### M-04: Evals 28/28

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-08 | `node evals/runner.js --benchmark` 결과 28/28 pass | CLI 실행 |
| AC-09 | 모든 prompt-1.md가 50자 이상 & 5줄 이상 | File check |
| AC-10 | 모든 expected-1.md가 50자 이상 & 5줄 이상 | File check |
| AC-11 | YAML 파서가 eval.yaml 정상 파싱 | Unit test |

### M-05: Config-Code Sync

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-12 | config 변경 시 `selectOrchestrationPattern()` 결과 변경 | Runtime test |
| AC-13 | config 없이도 기본값으로 동작 | Fallback test |

### M-06: PDCA Phases 통일

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-14 | `createPdcaTaskChain()` 결과에 6개 phase 포함 | phases = [plan,design,do,check,act,report] |
| AC-15 | `act` phase task가 정상 생성 | Task object 확인 |

### M-07: Agent Security

| # | Criteria | Measurement |
|---|---------|-------------|
| AC-16 | 9개 acceptEdits 에이전트 중 7개에 disallowedTools 설정 | Frontmatter 검사 |
| AC-17 | qa-monitor, pdca-iterator는 Bash 제한 없음 | Frontmatter 검사 |
| AC-18 | Tier 2 에이전트가 rm -rf, git push, git reset --hard 차단 | Agent runtime 확인 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-03-07 | Initial design based on Plan-Plus + 10-agent analysis + CTO deep-dive | CTO Lead (10-agent team) |
| 1.1 | 2026-03-07 | Layer 0 A안(Main Session CTO) 상세 설계 추가 | CTO Lead |
| 1.2 | 2026-03-07 | Layer 0 → B안(CC Agent Teams/TeamCreate)으로 전면 재설계. CTO팀+PM팀 모두 포함. 2단계 위임 보존, 메모리 스파이크 검증 추가, cto-lead-restructure.plan.md 분석 반영 | CTO Lead |
