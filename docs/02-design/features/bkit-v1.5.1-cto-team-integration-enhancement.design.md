# bkit v1.5.1 CTO Team Integration Enhancement 상세 설계서

> **Summary**: Skills-Agents 연동, 자동 팀 활성화, 철학 문서 동기화를 위한 상세 설계
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: CTO Team (bkit PDCA)
> **Date**: 2026-02-06
> **Status**: Completed (100% Match Rate)
> **Plan Doc**: [bkit-v1.5.1-cto-team-integration-enhancement.plan.md](../../01-plan/features/bkit-v1.5.1-cto-team-integration-enhancement.plan.md)

---

## 1. Overview

### 1.1 설계 목표

CTO-Led Team 구현(100% 완료) 후 발견된 3가지 Gap을 해소한다:

1. **Skills-Agents 바인딩**: 7개 skill에 신규 에이전트 5종 연동
2. **자동 팀 제안**: Automation First 철학에 맞게 Major Feature 감지 시 자동 팀 모드 제안
3. **문서 동기화**: 철학 문서 4개 + PDCA skill 1개 + session-start 1개를 CTO Team 구조로 업데이트

### 1.2 설계 원칙

- **Automation First**: 사용자가 `/pdca team`을 모르더라도 자연스럽게 팀 모드가 제안됨
- **하위 호환성**: 기존 `agent:` 단일 바인딩을 `agents:` 다중 바인딩으로 변경 시 `default` 키 유지
- **최소 변경**: 기존 동작을 깨지 않는 범위에서 추가만 수행

---

## 2. 파일 변경 총괄

| 구분 | 파일 | 변경 유형 | 설명 |
|------|------|----------|------|
| **Skills 수정** | | | |
| | `skills/pdca/SKILL.md` | 수정 | agents 필드에 `team: bkit:cto-lead` 추가, team 섹션 CTO-Led 업데이트 |
| | `skills/enterprise/SKILL.md` | 수정 | agents 필드에 `security: bkit:security-architect`, `team: bkit:cto-lead` 추가 |
| | `skills/phase-7-seo-security/SKILL.md` | 수정 | `agent:` → `agents:` 변환, security-architect 추가 |
| | `skills/phase-8-review/SKILL.md` | 수정 | agents 필드에 `qa: bkit:qa-strategist`, `team: bkit:cto-lead` 추가 |
| | `skills/phase-3-mockup/SKILL.md` | 수정 | `agent:` → `agents:` 변환, frontend-architect 추가 |
| | `skills/phase-5-design-system/SKILL.md` | 수정 | `agent:` → `agents:` 변환, frontend-architect 추가 |
| | `skills/phase-6-ui-integration/SKILL.md` | 수정 | `agent:` → `agents:` 변환, frontend-architect 추가 |
| **자동 팀 제안** | | | |
| | `lib/intent/language.js` | 수정 | AGENT_TRIGGER_PATTERNS에 cto-lead 8개국어 패턴 추가 |
| | `lib/team/coordinator.js` | 수정 | `suggestTeamMode()` 함수 추가 |
| | `scripts/user-prompt-handler.js` | 수정 | 팀 모드 자동 제안 로직 추가 |
| | `hooks/session-start.js` | 수정 | CTO-Led 팀 정보로 업데이트 |
| **철학 문서** | | | |
| | `bkit-system/philosophy/core-mission.md` | 수정 | v1.5.1 컴포넌트 수 + CTO Team 반영 |
| | `bkit-system/philosophy/ai-native-principles.md` | 수정 | CTO Team 역할 + 팀 구성 업데이트 |
| | `bkit-system/philosophy/pdca-methodology.md` | 수정 | CTO-Led 팀 패턴 + 업데이트된 teammate 수 |
| | `bkit-system/philosophy/context-engineering.md` | 수정 | Agent 16개, lib/team 모듈 구조 반영 |
| **합계** | | **수정 15개** | |

---

## 3. Skills 수정 상세 설계

### 3.1 `skills/pdca/SKILL.md` 수정

#### Frontmatter agents 필드 변경

```yaml
# 변경 전 (현재 line 21-25)
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  default: null

# 변경 후
agents:
  analyze: bkit:gap-detector
  iterate: bkit:pdca-iterator
  report: bkit:report-generator
  team: bkit:cto-lead
  default: null
```

#### team 섹션 본문 변경 (line 142~192)

```markdown
# 변경 전 (line 152-153)
4. Generate team strategy via `generateTeamStrategy(level)`:
   - Dynamic: 2 teammates (developer, qa)
   - Enterprise: 4 teammates (architect, developer, qa, reviewer)

# 변경 후
4. Generate team strategy via `generateTeamStrategy(level)`:
   - Dynamic: 3 teammates (developer, frontend, qa) — CTO Lead orchestrates
   - Enterprise: 5 teammates (architect, developer, qa, reviewer, security) — CTO Lead orchestrates
5. CTO Lead (cto-lead agent, opus) automatically:
   - Sets technical direction and selects orchestration pattern
   - Distributes tasks to teammates based on PDCA phase
   - Enforces quality gates (90% Match Rate threshold)
```

```markdown
# 변경 전 (line 187-192)
**Level Requirements**:
| Level | Available | Teammates |
|-------|:---------:|:---------:|
| Starter | No | - |
| Dynamic | Yes | 2 |
| Enterprise | Yes | 4 |

# 변경 후
**Level Requirements**:
| Level | Available | Teammates | CTO Lead |
|-------|:---------:|:---------:|:--------:|
| Starter | No | - | - |
| Dynamic | Yes | 3 | cto-lead (opus) |
| Enterprise | Yes | 5 | cto-lead (opus) |
```

#### Agent Teams Integration 섹션 변경 (line 430~443)

```markdown
# 변경 전 (line 440-443)
Suggest Agent Teams when:
- Feature is classified as Major Feature (>= 1000 chars)
- Match Rate < 70% (parallel iteration can speed up fixes)
- Project level is Dynamic or Enterprise

# 변경 후
Suggest Agent Teams when:
- Feature is classified as Major Feature (>= 1000 chars)
- Match Rate < 70% (parallel iteration can speed up fixes)
- Project level is Dynamic or Enterprise

CTO-Led Team Orchestration Patterns:
| Level | Plan | Design | Do | Check | Act |
|-------|------|--------|-----|-------|-----|
| Dynamic | leader | leader | swarm | council | leader |
| Enterprise | leader | council | swarm | council | watchdog |
```

### 3.2 `skills/enterprise/SKILL.md` 수정

#### Frontmatter agents 필드 변경

```yaml
# 변경 전 (현재 line 23-26)
agents:
  default: bkit:enterprise-expert
  infra: bkit:infra-architect
  architecture: bkit:enterprise-expert

# 변경 후
agents:
  default: bkit:enterprise-expert
  infra: bkit:infra-architect
  architecture: bkit:enterprise-expert
  security: bkit:security-architect
  team: bkit:cto-lead
```

### 3.3 `skills/phase-7-seo-security/SKILL.md` 수정

#### Frontmatter agent → agents 변환

```yaml
# 변경 전 (현재 line 17)
agent: bkit:code-analyzer

# 변경 후 (agent: 라인을 agents: 블록으로 교체)
agents:
  default: bkit:code-analyzer
  security: bkit:security-architect
```

### 3.4 `skills/phase-8-review/SKILL.md` 수정

#### Frontmatter agents 필드 추가

```yaml
# 변경 전 (현재 line 22-25)
agents:
  default: bkit:code-analyzer
  validate: bkit:design-validator
  gap: bkit:gap-detector

# 변경 후
agents:
  default: bkit:code-analyzer
  validate: bkit:design-validator
  gap: bkit:gap-detector
  qa: bkit:qa-strategist
  team: bkit:cto-lead
```

### 3.5 `skills/phase-3-mockup/SKILL.md` 수정

#### Frontmatter agent → agents 변환

```yaml
# 변경 전 (현재 line 14)
agent: bkit:pipeline-guide

# 변경 후
agents:
  default: bkit:pipeline-guide
  frontend: bkit:frontend-architect
```

### 3.6 `skills/phase-5-design-system/SKILL.md` 수정

#### Frontmatter agent → agents 변환

```yaml
# 변경 전 (현재 line 20)
agent: bkit:pipeline-guide

# 변경 후
agents:
  default: bkit:pipeline-guide
  frontend: bkit:frontend-architect
```

### 3.7 `skills/phase-6-ui-integration/SKILL.md` 수정

#### Frontmatter agent → agents 변환

```yaml
# 변경 전 (현재 line 19)
agent: bkit:pipeline-guide

# 변경 후
agents:
  default: bkit:pipeline-guide
  frontend: bkit:frontend-architect
```

---

## 4. 자동 팀 제안 상세 설계

### 4.1 `lib/intent/language.js` 수정

#### AGENT_TRIGGER_PATTERNS에 cto-lead 추가

```javascript
// 기존 AGENT_TRIGGER_PATTERNS 객체 (line 15-66) 맨 뒤에 추가
// 'starter-guide' 다음에 추가:

'cto-lead': {
  en: ['team', 'project lead', 'CTO', 'team mode', 'coordinate team'],
  ko: ['팀', '팀장', '프로젝트 리드', 'CTO', '팀 구성', '팀 모드'],
  ja: ['チーム', 'チームリード', 'プロジェクトリード', 'CTO', 'チーム編成'],
  zh: ['团队', '团队领导', '项目负责人', 'CTO', '团队模式'],
  es: ['equipo', 'líder del equipo', 'CTO', 'modo equipo'],
  fr: ['équipe', "chef d'équipe", 'CTO', 'mode équipe'],
  de: ['Team', 'Teamleiter', 'CTO', 'Team-Modus'],
  it: ['team', 'leader del team', 'CTO', 'modalità team']
}
```

### 4.2 `lib/team/coordinator.js` 수정

#### `suggestTeamMode()` 함수 추가

기존 `module.exports` 직전 (line 91) 에 함수 추가:

```javascript
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
  // Agent Teams 환경변수 없으면 제안 안함
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

  // Starter는 팀 모드 불가
  if (level === 'Starter') return null;

  const messageLength = options.messageLength || (userMessage ? userMessage.length : 0);

  // Major Feature 크기 (1000자 이상) 감지
  if (messageLength >= 1000) {
    return {
      suggest: true,
      reason: 'Major feature detected (message length >= 1000 chars)',
      level,
    };
  }

  // 팀 관련 키워드 감지
  let teamModule = null;
  try {
    const { matchMultiLangPattern } = require('../intent/language');
    const { AGENT_TRIGGER_PATTERNS } = require('../intent/language');
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
```

#### module.exports 수정

```javascript
// 변경 전 (현재 line 91-96)
module.exports = {
  isTeamModeAvailable,
  getTeamConfig,
  generateTeamStrategy,
  formatTeamStatus,
};

// 변경 후
module.exports = {
  isTeamModeAvailable,
  getTeamConfig,
  generateTeamStrategy,
  formatTeamStatus,
  suggestTeamMode,
};
```

### 4.3 `lib/team/index.js` 수정

#### coordinator 섹션에 suggestTeamMode 추가

```javascript
// 변경 전 (현재 line 18-22)
  // Coordinator (4 exports)
  isTeamModeAvailable: coordinator.isTeamModeAvailable,
  getTeamConfig: coordinator.getTeamConfig,
  generateTeamStrategy: coordinator.generateTeamStrategy,
  formatTeamStatus: coordinator.formatTeamStatus,

// 변경 후
  // Coordinator (5 exports)
  isTeamModeAvailable: coordinator.isTeamModeAvailable,
  getTeamConfig: coordinator.getTeamConfig,
  generateTeamStrategy: coordinator.generateTeamStrategy,
  formatTeamStatus: coordinator.formatTeamStatus,
  suggestTeamMode: coordinator.suggestTeamMode,
```

### 4.4 `lib/common.js` 수정

#### team bridge에 suggestTeamMode 추가

```javascript
// team coordinator 섹션에 추가
suggestTeamMode: team.suggestTeamMode,
```

### 4.5 `scripts/user-prompt-handler.js` 수정

#### 기존 4단계 처리 후 5단계 팀 제안 추가

```javascript
// 기존 "4. Ambiguity Detection" (line 97-109) 이후, "5. v1.4.2: Resolve Skill/Agent imports" (line 111) 이전에 추가:

// 5. Team Mode Auto-Suggestion (Automation First)
try {
  let teamModule = null;
  try {
    teamModule = require('../lib/team');
  } catch (e) {
    // Team module not available
  }

  if (teamModule && teamModule.suggestTeamMode) {
    const teamSuggestion = teamModule.suggestTeamMode(userPrompt, {
      messageLength: userPrompt.length,
    });
    if (teamSuggestion && teamSuggestion.suggest) {
      contextParts.push(
        `CTO Team Mode recommended for ${teamSuggestion.level} level. ` +
        `Use \`/pdca team {feature}\` for parallel PDCA with CTO-Led orchestration.`
      );
      debugLog('UserPrompt', 'Team mode suggested', {
        level: teamSuggestion.level,
        reason: teamSuggestion.reason,
      });
    }
  }
} catch (e) {
  debugLog('UserPrompt', 'Team suggestion failed', { error: e.message });
}

// 기존 6. (이전 5.) v1.4.2: Resolve Skill/Agent imports 코드 유지
```

### 4.6 `hooks/session-start.js` 수정

#### Agent Teams 정보를 CTO-Led 구조로 업데이트 (line 514-531)

```javascript
// 변경 전 (현재 line 514-531)
    const { isTeamModeAvailable, getTeamConfig } = require('../lib/team');
    if (isTeamModeAvailable()) {
      const teamConfig = getTeamConfig();
      additionalContext += `## Agent Teams (Active)\n`;
      additionalContext += `- Team Mode available: \`/pdca team {feature}\`\n`;
      additionalContext += `- Display mode: ${teamConfig.displayMode}\n`;
      if (detectedLevel === 'Enterprise') {
        additionalContext += `- Enterprise: 4 teammates (architect, developer, qa, reviewer)\n`;
      } else if (detectedLevel === 'Dynamic') {
        additionalContext += `- Dynamic: 2 teammates (developer, qa)\n`;
      }
      additionalContext += `\n`;
    } else if (detectedLevel !== 'Starter') {
      additionalContext += `## Agent Teams (Not Enabled)\n`;
      additionalContext += `- Your ${detectedLevel} project supports Agent Teams for parallel PDCA execution\n`;
      additionalContext += `- To enable: set \`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\` environment variable\n`;
      additionalContext += `- Then use: \`/pdca team {feature}\`\n\n`;
    }

// 변경 후
    const { isTeamModeAvailable, getTeamConfig } = require('../lib/team');
    if (isTeamModeAvailable()) {
      const teamConfig = getTeamConfig();
      additionalContext += `## CTO-Led Agent Teams (Active)\n`;
      additionalContext += `- CTO Lead: cto-lead (opus) orchestrates PDCA workflow\n`;
      additionalContext += `- Start: \`/pdca team {feature}\`\n`;
      additionalContext += `- Display mode: ${teamConfig.displayMode}\n`;
      if (detectedLevel === 'Enterprise') {
        additionalContext += `- Enterprise: 5 teammates (architect, developer, qa, reviewer, security)\n`;
        additionalContext += `- Patterns: leader → council → swarm → council → watchdog\n`;
      } else if (detectedLevel === 'Dynamic') {
        additionalContext += `- Dynamic: 3 teammates (developer, frontend, qa)\n`;
        additionalContext += `- Patterns: leader → leader → swarm → council → leader\n`;
      }
      additionalContext += `\n`;
    } else if (detectedLevel !== 'Starter') {
      additionalContext += `## CTO-Led Agent Teams (Not Enabled)\n`;
      additionalContext += `- Your ${detectedLevel} project supports CTO-Led Agent Teams\n`;
      additionalContext += `- CTO Lead (opus) orchestrates specialized teammates for parallel PDCA\n`;
      additionalContext += `- To enable: set \`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\` environment variable\n`;
      additionalContext += `- Then use: \`/pdca team {feature}\`\n\n`;
    }
```

---

## 5. 철학 문서 업데이트 상세 설계

### 5.1 `bkit-system/philosophy/core-mission.md` 수정

#### Section "Current Implementation" (line 120-141) 업데이트

```markdown
# 변경 전 (line 120-122)
## Current Implementation (v1.5.0)

> **v1.5.0**: Claude Code Exclusive - Gemini CLI support removed

# 변경 후
## Current Implementation (v1.5.1)

> **v1.5.1**: CTO-Led Agent Teams + Claude Code Exclusive
```

```markdown
# 변경 전 (line 127-133)
| Component | Count | Location |
|-----------|-------|----------|
| Skills | 22 | `skills/*/SKILL.md` |
| Agents | 11 | `agents/*.md` |
| Commands | DEPRECATED | Migrated to Skills |
| Scripts | 39 | `scripts/*.js` |
| Templates | 23 | `templates/*.md` |
| lib/ | 4 modules (132 functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/` |

# 변경 후
| Component | Count | Location |
|-----------|-------|----------|
| Skills | 22 | `skills/*/SKILL.md` |
| Agents | 16 | `agents/*.md` |
| Commands | DEPRECATED | Migrated to Skills |
| Scripts | 43 | `scripts/*.js` |
| Templates | 23 | `templates/*.md` |
| lib/ | 5 modules (160+ functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` |
```

#### v1.5.1 Features 섹션 (line 146-174) 업데이트

```markdown
# 변경 전 (line 165-168)
### Agent Teams

Parallel PDCA execution for Dynamic (2 teammates) and Enterprise (4 teammates) projects.
Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`

# 변경 후
### CTO-Led Agent Teams

CTO Lead (opus) orchestrates specialized teams for PDCA execution:
- Dynamic: 3 teammates (developer, frontend, qa) + CTO Lead
- Enterprise: 5 teammates (architect, developer, qa, reviewer, security) + CTO Lead
- 5 orchestration patterns: Leader, Council, Swarm, Pipeline, Watchdog
- Auto-suggested for Major Features (Automation First)
- Requires: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
```

#### v1.5.1 Feature table (line 151-156) 업데이트

```markdown
# 변경 전 (line 155)
| **Agent Teams** | Automation First | Suggested for major features at Dynamic/Enterprise level |

# 변경 후
| **CTO-Led Agent Teams** | Automation First | Auto-suggested for major features; CTO orchestrates PDCA phases |
```

### 5.2 `bkit-system/philosophy/ai-native-principles.md` 수정

#### Team Composition 테이블 (line 49-57) 업데이트

```markdown
# 변경 전 (line 49-57)
| Role | As-Is (10-person) | To-Be (bkit) | Change |
|------|-------------------|--------------|--------|
| **PM** | 1 | 0.5 | PDCA auto-tracking |
| **Senior Dev** | 2 | 1 | AI guides architecture |
| **Junior Dev** | 4 | 2 | 3x productivity with AI |
| **QA** | 2 | 0.5 | Zero Script QA |
| **Tech Writer** | 1 | 0 | Auto-generated docs |
| **Total** | **10** | **4** | **60% reduction** |

# 변경 후
| Role | As-Is (10-person) | To-Be (bkit) | bkit Agent | Change |
|------|-------------------|--------------|------------|--------|
| **PM** | 1 | 0.5 | product-manager | PDCA auto-tracking |
| **Senior Dev** | 2 | 1 | cto-lead (CTO) | AI guides architecture |
| **Junior Dev** | 4 | 2 | bkend-expert, frontend-architect | 3x productivity with AI |
| **QA** | 2 | 0.5 | qa-strategist, qa-monitor | Zero Script QA |
| **Security** | 1 | 0 | security-architect | AI-automated review |
| **Tech Writer** | 1 | 0 | report-generator | Auto-generated docs |
| **Total** | **11** | **4** | **16 AI agents** | **64% reduction** |
```

#### Agent Teams 섹션 (line 175-181) 업데이트

```markdown
# 변경 전 (line 175-181)
### Agent Teams in AI-Native Context

Agent Teams transform AI from "assistant" to "team member":
- Multiple AI agents work in parallel on different PDCA phases
- Reduces development time further beyond single-agent workflows
- Mirrors real team composition (architect, developer, qa, reviewer)

# 변경 후
### CTO-Led Agent Teams in AI-Native Context

Agent Teams transform AI from "assistant" to "professional development team":
- CTO Lead (opus) orchestrates the entire PDCA workflow automatically
- 5 specialized roles: PM, Architect, Developer, QA, Security
- 5 orchestration patterns adapt to PDCA phases (Leader, Council, Swarm, Pipeline, Watchdog)
- Auto-suggested for major features — users don't need to know commands (Automation First)
- Mirrors real CTO-led team structure with quality gates and Plan approval
```

### 5.3 `bkit-system/philosophy/pdca-methodology.md` 수정

#### Agent Teams for Parallel PDCA 섹션 (line 250-261) 업데이트

```markdown
# 변경 전 (line 250-261)
### Agent Teams for Parallel PDCA

PDCA phases can execute in parallel using Agent Teams:

| Role | Phase Coverage | Level |
|------|---------------|-------|
| architect | Design | Enterprise only |
| developer | Do, Act | Dynamic + Enterprise |
| qa | Check | Dynamic + Enterprise |
| reviewer | Check, Act | Enterprise only |

Command: `/pdca team {feature}`

# 변경 후
### CTO-Led Agent Teams for Parallel PDCA

CTO Lead orchestrates specialized teams for parallel PDCA execution:

| Role | Agent | Phase Coverage | Level |
|------|-------|---------------|-------|
| CTO Lead | cto-lead (opus) | All phases | Dynamic + Enterprise |
| Developer | bkend-expert | Do, Act | Dynamic + Enterprise |
| Frontend | frontend-architect | Design, Do | Dynamic + Enterprise |
| QA | qa-strategist, qa-monitor, gap-detector | Check | Dynamic + Enterprise |
| Architect | enterprise-expert, infra-architect | Design | Enterprise only |
| Reviewer | code-analyzer, design-validator | Check, Act | Enterprise only |
| Security | security-architect | Design, Check | Enterprise only |

Orchestration Patterns per PDCA Phase:
| Level | Plan | Design | Do | Check | Act |
|-------|------|--------|-----|-------|-----|
| Dynamic | leader | leader | swarm | council | leader |
| Enterprise | leader | council | swarm | council | watchdog |

Command: `/pdca team {feature}` (auto-suggested for Major Features)
```

### 5.4 `bkit-system/philosophy/context-engineering.md` 수정

#### Behavioral Rules Layer 모델 선택 테이블 (line 166-170) 업데이트

```markdown
# 변경 전 (line 166-170)
| Model | Agents | Characteristics |
|-------|--------|-----------------|
| **opus** | code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect | Complex analysis, strategic judgment |
| **sonnet** | bkend-expert, pdca-iterator, pipeline-guide, starter-guide | Execution, guidance, iteration |
| **haiku** | qa-monitor, report-generator | Fast monitoring, document generation |

# 변경 후
| Model | Agents | Characteristics |
|-------|--------|-----------------|
| **opus** | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect | Strategic leadership, complex analysis |
| **sonnet** | bkend-expert, pdca-iterator, pipeline-guide, starter-guide, product-manager, frontend-architect, qa-strategist | Execution, guidance, iteration |
| **haiku** | qa-monitor, report-generator | Fast monitoring, document generation |
```

#### Component Architecture 테이블 (line 339-347) 업데이트

```markdown
# 변경 전 (line 339-347)
| Component | Location | Count |
|-----------|----------|:-----:|
| Skills | `skills/*/SKILL.md` | 22 |
| Agents | `agents/*.md` | 11 |
| Scripts | `scripts/*.js` | 39 |
| Templates | `templates/*.md` | 23 |
| lib/ modules | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/` | 132 functions |

# 변경 후
| Component | Location | Count |
|-----------|----------|:-----:|
| Skills | `skills/*/SKILL.md` | 22 |
| Agents | `agents/*.md` | 16 |
| Scripts | `scripts/*.js` | 43 |
| Templates | `templates/*.md` | 23 |
| lib/ modules | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/`, `lib/team/` | 160+ functions |
```

#### Agent Teams as Parallel Context 섹션 (line 714-719) 업데이트

```markdown
# 변경 전 (line 714-719)
### Agent Teams as Parallel Context

Agent Teams enable parallel context management:
- Each teammate operates with its own context scope
- Phase-specific agents focus on their domain context
- Coordinator manages cross-teammate context synchronization

# 변경 후
### CTO-Led Agent Teams as Parallel Context

CTO-Led Agent Teams enable orchestrated parallel context management:
- CTO Lead (opus) coordinates all context flow across teammates
- Each teammate operates with its own context scope per PDCA phase
- Phase-specific agents focus on their domain context
- Orchestrator selects pattern (Leader/Council/Swarm/Watchdog) per phase
- Communication module manages structured team messages (7 types)
```

---

## 6. 구현 순서

| 순서 | 파일 | 의존성 | 설명 |
|:----:|------|--------|------|
| 1 | `lib/intent/language.js` | 없음 | cto-lead 트리거 패턴 추가 |
| 2 | `lib/team/coordinator.js` | language.js | suggestTeamMode() 추가 |
| 3 | `lib/team/index.js` | coordinator.js | suggestTeamMode export 추가 |
| 4 | `lib/common.js` | index.js | bridge export 추가 |
| 5 | `scripts/user-prompt-handler.js` | coordinator.js | 팀 자동 제안 로직 |
| 6 | `hooks/session-start.js` | 없음 | CTO-Led 팀 정보 |
| 7-13 | Skills 7개 | 없음 | agents 바인딩 업데이트 |
| 14-17 | 철학 문서 4개 | 없음 | CTO Team 반영 |

---

## 7. 검증 기준

### 7.1 기능 검증

| 번호 | 검증 항목 | 검증 방법 | 통과 기준 |
|:----:|---------|----------|----------|
| V-01 | pdca skill team 바인딩 | frontmatter에 `team: bkit:cto-lead` 존재 | PASS |
| V-02 | enterprise security 바인딩 | frontmatter에 `security: bkit:security-architect` 존재 | PASS |
| V-03 | phase-7 agents 변환 | `agent:` → `agents:` + security 바인딩 | PASS |
| V-04 | phase-8 qa 바인딩 | frontmatter에 `qa: bkit:qa-strategist` 존재 | PASS |
| V-05 | phase-3 frontend 바인딩 | `agent:` → `agents:` + frontend 바인딩 | PASS |
| V-06 | phase-5 frontend 바인딩 | `agent:` → `agents:` + frontend 바인딩 | PASS |
| V-07 | phase-6 frontend 바인딩 | `agent:` → `agents:` + frontend 바인딩 | PASS |
| V-08 | cto-lead 트리거 패턴 | language.js에 8개국어 cto-lead 패턴 | PASS |
| V-09 | suggestTeamMode 함수 | coordinator.js에 함수 존재 + export | PASS |
| V-10 | 자동 팀 제안 | user-prompt-handler에 팀 제안 로직 | PASS |
| V-11 | session-start CTO-Led | Enterprise=5, Dynamic=3 표시 | PASS |
| V-12 | 철학 문서 Agents 수 | 4개 문서 모두 16 agents 반영 | PASS |
| V-13 | 철학 문서 CTO Team | CTO-Led 팀 구조 설명 포함 | PASS |
| V-14 | Graceful Degradation | suggestTeamMode는 AGENT_TEAMS=0이면 null | PASS |
| V-15 | 하위 호환성 | agent→agents 변환 시 default 키 유지 | PASS |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 설계 - Plan 기반 상세 설계 | CTO Team |
