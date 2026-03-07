/**
 * Team Coordinator Module
 * @module lib/team/coordinator
 * @version 1.6.0
 *
 * Agent Teams 가용성 확인 및 Team 설정 관리
 */

/**
 * Agent Teams 사용 가능 여부 확인
 * - CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 환경변수 체크
 * @returns {boolean}
 */
function isTeamModeAvailable() {
  return process.env.CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS === '1';
}

/**
 * Team 설정 로드
 * bkit.config.json의 team 섹션에서 설정 로드
 * @returns {Object} teamConfig
 * @property {boolean} enabled - Team Mode 활성화 여부
 * @property {string} displayMode - 'in-process' | 'split-pane'
 * @property {number} maxTeammates - 최대 teammate 수 (기본: 4)
 * @property {boolean} delegateMode - Delegate Mode 사용 여부
 */
function getTeamConfig() {
  let getConfig;
  try {
    getConfig = require('../core').getConfig;
  } catch (e) {
    return {
      enabled: false,
      displayMode: 'in-process',
      maxTeammates: 4,
      delegateMode: false,
    };
  }

  return {
    enabled: getConfig('team.enabled', false),
    displayMode: getConfig('team.displayMode', 'in-process'),
    maxTeammates: getConfig('team.maxTeammates', 4),
    delegateMode: getConfig('team.delegateMode', false),
  };
}

/**
 * 레벨별 Team 전략 생성
 * @param {string} level - 'Starter' | 'Dynamic' | 'Enterprise'
 * @param {string} feature - Feature name
 * @returns {Object} strategy
 */
function generateTeamStrategy(level, feature) {
  const { TEAM_STRATEGIES } = require('./strategy');
  return TEAM_STRATEGIES[level] || TEAM_STRATEGIES.Dynamic;
}

/**
 * Team 상태 포맷팅 (PDCA 상태와 통합)
 * @param {Object} teamInfo
 * @param {Object} pdcaStatus
 * @returns {string} formatted status
 */
function formatTeamStatus(teamInfo, pdcaStatus) {
  const available = isTeamModeAvailable();
  const config = getTeamConfig();

  let output = '';
  output += `## Agent Teams Status\n`;
  output += `- Available: ${available ? 'Yes' : 'No'}\n`;
  output += `- Enabled: ${config.enabled ? 'Yes' : 'No'}\n`;
  output += `- Display Mode: ${config.displayMode}\n`;
  output += `- Max Teammates: ${config.maxTeammates}\n`;

  if (pdcaStatus?.primaryFeature) {
    output += `\n### PDCA Integration\n`;
    output += `- Feature: ${pdcaStatus.primaryFeature}\n`;
    const featureData = pdcaStatus.features?.[pdcaStatus.primaryFeature];
    if (featureData) {
      output += `- Phase: ${featureData.phase}\n`;
      if (featureData.matchRate != null) {
        output += `- Match Rate: ${featureData.matchRate}%\n`;
      }
    }
  }

  return output;
}

/**
 * 팀 모드 자동 제안 여부 판단
 * Automation First: Major Feature + Dynamic/Enterprise 레벨 감지 시 자동 제안
 * @param {string} userMessage - 사용자 입력
 * @param {Object} options - 추가 옵션
 * @param {string} [options.level] - 프로젝트 레벨
 * @param {number} [options.messageLength] - 메시지 길이
 * @returns {Object|null} { suggest: boolean, reason: string, level: string }
 */
function suggestTeamMode(userMessage, options = {}) {
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

  const messageLength = options.messageLength || (userMessage ? userMessage.length : 0);

  if (messageLength >= 1000) {
    return {
      suggest: true,
      reason: 'Major feature detected (message length >= 1000 chars)',
      level,
    };
  }

  try {
    const { matchMultiLangPattern, AGENT_TRIGGER_PATTERNS } = require('../intent/language');
    if (AGENT_TRIGGER_PATTERNS['cto-lead']) {
      if (matchMultiLangPattern(userMessage, AGENT_TRIGGER_PATTERNS['cto-lead'])) {
        return {
          suggest: true,
          reason: 'Team-related keywords detected in user message',
          level,
        };
      }
    }
  } catch (e) {
    // Graceful degradation
  }

  return null;
}

/**
 * Build Agent Teams creation plan for CTO or PM orchestration.
 * Returns teammate definitions for TeamCreate tool usage.
 * @param {string} teamType - 'cto' | 'pm'
 * @param {string} feature - Feature name
 * @param {Object} [options] - { phase, level }
 * @returns {Object|null} { teamName, teammates, taskPlan } or null
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
 * @param {string} teamName
 * @param {string} feature
 * @param {string} phase
 * @param {string} level
 * @returns {Object|null}
 */
function buildCtoTeamPlan(teamName, feature, phase, level) {
  const { TEAM_STRATEGIES } = require('./strategy');
  const { selectOrchestrationPattern } = require('./orchestrator');
  const strategy = TEAM_STRATEGIES[level];
  if (!strategy) return null;

  const pattern = selectOrchestrationPattern(phase, level);

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
 * @param {string} teamName
 * @param {string} feature
 * @returns {Object}
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
 * @param {Object} role
 * @param {string} phase
 * @param {string} feature
 * @param {string} level
 * @param {string} pattern
 * @returns {string}
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
 * @param {Object} role
 * @param {string} feature
 * @returns {string}
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
 * @param {string} phase
 * @param {string} feature
 * @param {Array} teammates
 * @returns {Array}
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

module.exports = {
  isTeamModeAvailable,
  getTeamConfig,
  generateTeamStrategy,
  formatTeamStatus,
  suggestTeamMode,
  buildAgentTeamPlan,
  getFileOwnership,
};
