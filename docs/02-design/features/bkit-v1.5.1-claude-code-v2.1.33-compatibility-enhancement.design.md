# bkit v1.5.1 + Claude Code v2.1.33 Compatibility Enhancement Design Document

> **Summary**: Claude Code v2.1.32~v2.1.33 신기능(Agent Teams, Output Styles, Memory Frontmatter, 새 Hook Events, Sub-agent 제한)을 bkit v1.5.1에 통합하기 위한 상세 설계서
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: bkit Team
> **Date**: 2026-02-06
> **Status**: Draft
> **Planning Doc**: [bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.plan.md](../../01-plan/features/bkit-v1.5.1-claude-code-v2.1.33-compatibility-enhancement.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **호환성 보장**: 기존 bkit v1.5.0의 모든 기능이 Claude Code v2.1.33에서 정상 작동
2. **Agent Teams 통합**: PDCA 워크플로우와 Agent Teams를 연계하는 새로운 Team Mode 구현
3. **Output Styles 개발**: bkit 전용 커스텀 Output Style 3종 개발
4. **Memory System 활용**: 11개 Agent에 memory frontmatter 적용으로 세션 간 학습
5. **새 Hook Events 활용**: TaskCompleted/TeammateIdle hook으로 PDCA 자동화 강화
6. **Sub-agent 제한**: Agent 보안/제어 강화를 위한 Task(agent_type) 적용

### 1.2 Design Principles

- **Backward Compatibility**: 기존 v1.5.0 코드의 동작 변경 최소화
- **Feature Flag Pattern**: 새 기능은 bkit.config.json으로 선택적 활성화
- **Modular Architecture**: 새 모듈은 기존 lib/ 구조를 따라 독립적으로 구현
- **Graceful Degradation**: Agent Teams 미활성화 시에도 기존 워크플로우 정상 동작

---

## 2. Architecture

### 2.1 전체 아키텍처 변경 개요

```
bkit v1.5.0 (Current)                    bkit v1.5.1 (Target)
┌──────────────────────┐                 ┌──────────────────────────────┐
│ Skills (21)          │                 │ Skills (21 + 1 new)          │
│ Agents (11)          │                 │ Agents (11, enhanced)        │
│ Hooks (6 events)     │                 │ Hooks (6 + 2 new events)     │
│ Scripts (39)         │                 │ Scripts (39 + 2 new)         │
│ Lib (4 modules)      │                 │ Lib (4 + 1 new module)       │
│                      │                 │ Output Styles (0 → 3 new)    │
└──────────────────────┘                 └──────────────────────────────┘
```

### 2.2 모듈 의존성 다이어그램

```
┌────────────────────────────────────────────────────────────────────────┐
│                         bkit v1.5.1 Module Map                         │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐                 │
│  │ lib/core/   │   │ lib/pdca/   │   │ lib/intent/ │                 │
│  │ (37 exports)│   │ (50 exports)│   │ (19 exports)│                 │
│  │ platform    │   │ status      │◄──│ language    │                 │
│  │ cache       │   │ phase       │   │ trigger     │                 │
│  │ io          │   │ level       │   │ ambiguity   │                 │
│  │ debug       │   │ tier        │   └─────────────┘                 │
│  │ config      │   │ automation  │                                    │
│  │ file        │   └──────┬──────┘   ┌─────────────┐                 │
│  └──────┬──────┘          │          │ lib/task/   │                 │
│         │                 │          │ (26 exports)│                 │
│         │                 ▼          │ classify    │                 │
│         │          ┌──────────────┐  │ context     │                 │
│         └─────────►│ lib/common.js│◄─│ creator     │                 │
│                    │ (bridge, 132)│  │ tracker     │                 │
│                    └──────────────┘  └─────────────┘                 │
│                                                                        │
│  ┌──────────────────────────────────────────────────────┐  [NEW]      │
│  │ lib/team/                                             │             │
│  │ ├── index.js        (entry point, 6 exports)         │             │
│  │ ├── coordinator.js  (team lifecycle management)       │             │
│  │ ├── strategy.js     (level-based team configuration)  │             │
│  │ └── hooks.js        (TaskCompleted/TeammateIdle)      │             │
│  └──────────────────────────────────────────────────────┘             │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.3 파일 변경 총괄

| 구분 | 파일 | 변경 유형 | Phase |
|------|------|----------|-------|
| **신규 파일** | | | |
| | `lib/team/index.js` | 신규 | 2 |
| | `lib/team/coordinator.js` | 신규 | 2 |
| | `lib/team/strategy.js` | 신규 | 2 |
| | `lib/team/hooks.js` | 신규 | 5 |
| | `output-styles/bkit-pdca-guide.md` | 신규 | 3 |
| | `output-styles/bkit-learning.md` | 신규 | 3 |
| | `output-styles/bkit-enterprise.md` | 신규 | 3 |
| | `scripts/pdca-task-completed.js` | 신규 | 5 |
| | `scripts/team-idle-handler.js` | 신규 | 5 |
| | `scripts/team-stop.js` | 신규 | 2 |
| **수정 파일** | | | |
| | `hooks/hooks.json` | 수정 | 5 |
| | `bkit.config.json` | 수정 | 1,2,3 |
| | `.claude-plugin/plugin.json` | 수정 | 1 |
| | `lib/common.js` | 수정 | 2 |
| | `lib/pdca/automation.js` | 수정 | 5 |
| | `hooks/session-start.js` | 수정 | 2 |
| | `scripts/unified-stop.js` | 수정 | 2 |
| | `agents/gap-detector.md` | 수정 | 4,6 |
| | `agents/pdca-iterator.md` | 수정 | 4,6 |
| | `agents/code-analyzer.md` | 수정 | 4,6 |
| | `agents/report-generator.md` | 수정 | 4,6 |
| | `agents/starter-guide.md` | 수정 | 4 |
| | `agents/bkend-expert.md` | 수정 | 4 |
| | `agents/enterprise-expert.md` | 수정 | 4,6 |
| | `agents/design-validator.md` | 수정 | 4 |
| | `agents/qa-monitor.md` | 수정 | 4,6 |
| | `agents/pipeline-guide.md` | 수정 | 4 |
| | `agents/infra-architect.md` | 수정 | 4 |

---

## 3. Phase 1: 호환성 검증 설계

### 3.1 테스트 구조

188개 테스트 케이스를 7개 카테고리로 분류하여 수동 검증합니다.

```
docs/03-analysis/
└── bkit-v1.5.1-v2.1.33-compatibility/
    ├── TC-01-skills.md          (63 TC)
    ├── TC-02-agents.md          (33 TC)
    ├── TC-03-hooks.md           (24 TC)
    ├── TC-04-library.md         (28 TC)
    ├── TC-05-pdca-workflow.md   (12 TC)
    ├── TC-06-v2133-specific.md  (20 TC)
    ├── TC-07-multilang.md       (8 TC)
    └── SUMMARY.md               (종합 결과)
```

### 3.2 v2.1.33 고유 테스트 상세

| TC-ID | 테스트 대상 | 검증 방법 | 통과 기준 |
|-------|-----------|----------|----------|
| V1-01 | Opus 4.6 모델 호환 | Agent 호출 시 `model: opus` → 실제 opus 4.6 사용 | Agent 정상 실행 |
| V1-02 | Skill Plugin name | `/bkit` 실행 → skill description 확인 | "bkit:" 접두사 표시 |
| V1-03 | Skill Budget Scaling | 긴 description skill 로드 | 잘림 없이 전체 표시 |
| V1-04 | TaskUpdate delete | `TaskUpdate(status: "deleted")` 호출 | Task 삭제 성공 |
| V1-05 | Bash heredoc fix | JS template literal 포함 bash 실행 | "Bad substitution" 없음 |
| V1-06 | --add-dir skills 자동 로딩 | 추가 디렉토리의 skill 파일 | 자동 감지 및 로딩 |
| V1-07 | TeammateIdle hook 공존 | hooks.json에 TeammateIdle 추가 | 기존 hook 정상 동작 |
| V1-08 | TaskCompleted hook 공존 | hooks.json에 TaskCompleted 추가 | 기존 hook 정상 동작 |
| V1-09 | Memory frontmatter 공존 | Agent에 memory 필드 추가 | 기존 agent 정상 동작 |
| V1-10 | Sub-agent 제한 구문 | Agent tools에 Task(type) 추가 | 기존 Task 호출 정상 |

### 3.3 호환성 리스크 검증 포인트

#### 3.3.1 `--resume` 시 `--agent` 자동 재사용 (v2.1.32)

- **영향 파일**: 없음 (bkit은 --resume 직접 사용하지 않음)
- **검증**: 사용자가 수동으로 --resume 사용 시 정상 동작 확인

#### 3.3.2 자동 메모리 기록 (v2.1.32)

- **영향 파일**: `hooks/session-start.js` (memory-store.js 통합 부분)
- **검증**: bkit의 .bkit-memory.json과 Claude Code의 auto memory 충돌 없음 확인
- **설계 결정**: bkit의 memory-store.js는 독립적인 .bkit-memory.json 사용으로 충돌 없음

#### 3.3.3 PreToolUse hook decision/reason 필드 deprecation

- **영향 파일**: `scripts/pre-write.js`, `scripts/unified-bash-pre.js`
- **현재 상태 확인 필요**: 현재 코드가 `decision`/`reason` 사용 시 `hookSpecificOutput.permissionDecision`으로 마이그레이션
- **검증**: PreToolUse hook 응답 형식 호환성

---

## 4. Phase 2: Agent Teams PDCA 통합 설계

### 4.1 개요

Agent Teams와 bkit PDCA 워크플로우를 연계하는 **Team Mode**를 구현합니다.

### 4.2 lib/team 모듈 설계

#### 4.2.1 lib/team/index.js

```javascript
/**
 * Team Module Entry Point
 * @module lib/team
 * @version 1.5.1
 */
module.exports = {
  // Coordinator (4 exports)
  isTeamModeAvailable,    // Agent Teams 사용 가능 여부 확인
  getTeamConfig,          // Team 설정 로드
  generateTeamStrategy,   // 레벨별 Team 전략 생성
  formatTeamStatus,       // Team 상태 포맷팅

  // Strategy (2 exports)
  TEAM_STRATEGIES,        // 레벨별 전략 상수
  getTeammateRoles,       // 역할별 teammate 정의
};
```

#### 4.2.2 lib/team/coordinator.js 상세 설계

```javascript
/**
 * Team Coordinator Module
 * @module lib/team/coordinator
 * @version 1.5.1
 *
 * Agent Teams 가용성 확인 및 Team 설정 관리
 */

/**
 * Agent Teams 사용 가능 여부 확인
 * - CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 환경변수 체크
 * - Claude Code 버전 v2.1.32+ 확인
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
  const { getConfig } = require('../core');
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
  const strategies = require('./strategy');
  return strategies.TEAM_STRATEGIES[level] || strategies.TEAM_STRATEGIES.Dynamic;
}

/**
 * Team 상태 포맷팅 (PDCA 상태와 통합)
 * @param {Object} teamInfo
 * @param {Object} pdcaStatus
 * @returns {string} formatted status
 */
function formatTeamStatus(teamInfo, pdcaStatus) {
  // Team 정보와 PDCA 진행 상태를 통합 포맷팅
}
```

#### 4.2.3 lib/team/strategy.js 상세 설계

```javascript
/**
 * Team Strategy Module
 * @module lib/team/strategy
 * @version 1.5.1
 *
 * 레벨별 Agent Teams 전략 정의
 */

const TEAM_STRATEGIES = {
  Starter: null,  // Team Mode 미지원 (단일 세션으로 충분)

  Dynamic: {
    teammates: 2,
    roles: [
      {
        name: 'developer',
        description: 'Implementation and coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act']
      },
      {
        name: 'qa',
        description: 'Testing and gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check']
      }
    ],
    phaseStrategy: {
      plan: 'single',      // 리드만 작업
      design: 'single',    // 리드만 작업
      do: 'parallel',      // developer teammate
      check: 'parallel',   // qa teammate
      act: 'parallel'      // developer + qa 병렬
    }
  },

  Enterprise: {
    teammates: 4,
    roles: [
      {
        name: 'architect',
        description: 'Design documents, API specs',
        agents: ['enterprise-expert', 'infra-architect'],
        phases: ['design']
      },
      {
        name: 'developer',
        description: 'Implementation, coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act']
      },
      {
        name: 'qa',
        description: 'Testing, gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check']
      },
      {
        name: 'reviewer',
        description: 'Code review, security check',
        agents: ['code-analyzer', 'design-validator'],
        phases: ['check', 'act']
      }
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'parallel',   // architect + reviewer
      do: 'parallel',       // developer teammates (모듈별 분리)
      check: 'parallel',    // qa + reviewer 동시
      act: 'parallel'       // developer + qa 병렬
    }
  }
};

/**
 * 역할별 teammate 정의 반환
 * @param {string} level
 * @returns {Array} roles
 */
function getTeammateRoles(level) {
  const strategy = TEAM_STRATEGIES[level];
  return strategy?.roles || [];
}
```

### 4.3 PDCA Skill 확장: `/pdca team` 하위 명령

기존 `/pdca` skill (skills/pdca/SKILL.md)에 `team` 하위 명령을 추가합니다.

#### 4.3.1 설계 결정: 별도 Skill vs 기존 Skill 확장

**결정: 기존 PDCA Skill 확장** (별도 Skill 생성하지 않음)

이유:
- `/pdca team`은 PDCA 워크플로우의 확장이므로 동일 Skill 내에서 관리
- 사용자 경험 일관성 유지 (/pdca 명령 체계 통일)
- Agent Teams는 Research Preview이므로 별도 Skill보다 기존 확장이 관리 용이

#### 4.3.2 PDCA Skill SKILL.md 수정 사항

skills/pdca/SKILL.md의 Arguments 테이블에 추가:

```markdown
| `team [feature]` | PDCA Team Mode 시작 (Agent Teams 필요) | `/pdca team user-auth` |
| `team status` | Team 상태 확인 | `/pdca team status` |
| `team cleanup` | Team 리소스 정리 | `/pdca team cleanup` |
```

#### 4.3.2.1 `/pdca team cleanup` 명령 처리

```
/pdca team cleanup
  │
  ├── 1. isTeamModeAvailable() 확인
  │     └── false → "Team Mode가 활성화되지 않았습니다" 안내
  │
  ├── 2. 현재 Team 세션 확인 (~/.claude/teams/)
  │     └── 없음 → "정리할 Team 세션이 없습니다" 안내
  │
  ├── 3. Team 정리 실행
  │     ├── 모든 teammate 종료 요청
  │     ├── Task List 최종 상태 저장
  │     └── Team 설정 파일 정리
  │
  └── 4. 결과 표시
        ├── 정리된 리소스 목록
        └── PDCA 단일 세션 모드 전환 안내
```

#### 4.3.3 team 명령 처리 흐름

```
/pdca team {feature}
  │
  ├── 1. isTeamModeAvailable() 확인
  │     └── false → "Agent Teams가 활성화되지 않았습니다" 안내
  │               → CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 설정 가이드
  │
  ├── 2. detectLevel() → 레벨 확인
  │     └── Starter → "Team Mode는 Dynamic/Enterprise에서 사용 가능합니다" 안내
  │
  ├── 3. generateTeamStrategy(level, feature) → 전략 생성
  │
  ├── 4. AskUserQuestion으로 전략 확인
  │     ├── "Team Mode로 진행 (N teammates)"
  │     ├── "단일 세션으로 진행"
  │     └── "취소"
  │
  └── 5. 전략 표시 (ASCII 다이어그램)
        ├── Teammate 역할 배정
        ├── PDCA Phase별 활용 전략
        └── 주의사항 (비용, 제한사항)
```

### 4.4 bkit.config.json 확장

현재 bkit.config.json에 team 섹션 추가:

```json
{
  "team": {
    "enabled": false,
    "displayMode": "in-process",
    "maxTeammates": 4,
    "delegateMode": false,
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 2 },
      "Enterprise": { "maxTeammates": 4 }
    }
  }
}
```

### 4.5 hooks/session-start.js 수정

Session 시작 시 Agent Teams 가용성 감지 및 안내 추가:

```javascript
// v1.5.1: Agent Teams detection
const { isTeamModeAvailable } = require('../lib/team');

if (isTeamModeAvailable()) {
  additionalContext += `\n## Agent Teams Detected\n`;
  additionalContext += `- Team Mode 사용 가능: /pdca team {feature}\n`;
  additionalContext += `- 현재 모드: ${getTeamConfig().displayMode}\n`;
}
```

### 4.6 scripts/unified-stop.js 수정

Team Mode 관련 정리 처리 추가:

```javascript
// v1.5.1: Team cleanup on stop
const AGENT_HANDLERS = {
  // ... 기존 handlers
  'team-coordinator': './team-stop.js',  // 추가
};
```

### 4.7.1 scripts/team-stop.js 설계

```javascript
#!/usr/bin/env node
/**
 * team-stop.js - Team Mode Stop Handler (v1.5.1)
 *
 * Team coordinator 종료 시 리소스 정리:
 * 1. PDCA 상태 업데이트 (team mode 종료 기록)
 * 2. bkit-memory.json에 team 세션 정보 저장
 * 3. Team 정리 안내 메시지 출력
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  addPdcaHistory,
} = require('../lib/common.js');

function run(context) {
  debugLog('TeamStop', 'Team cleanup started');

  const pdcaStatus = getPdcaStatusFull();
  const feature = pdcaStatus?.primaryFeature;

  if (feature) {
    addPdcaHistory({
      action: 'team_session_ended',
      feature: feature,
      phase: pdcaStatus?.features?.[feature]?.phase
    });
  }

  outputAllow('Team session ended. Returning to single-session mode.', 'Stop');
  debugLog('TeamStop', 'Team cleanup completed');
}

module.exports = { run };
```

### 4.7 lib/common.js 확장

lib/team 모듈을 common.js bridge에 추가:

```javascript
// v1.5.1: Team module
const team = require('./team');

module.exports = {
  // ... 기존 132 exports

  // Team Module (6 exports)
  isTeamModeAvailable: team.isTeamModeAvailable,
  getTeamConfig: team.getTeamConfig,
  generateTeamStrategy: team.generateTeamStrategy,
  formatTeamStatus: team.formatTeamStatus,
  TEAM_STRATEGIES: team.TEAM_STRATEGIES,
  getTeammateRoles: team.getTeammateRoles,
};
```

---

## 5. Phase 3: bkit Output Styles 설계

### 5.1 저장 위치

Output Style 파일은 **프로젝트 레벨**에 배치합니다:

```
bkit-claude-code/
└── output-styles/           # 프로젝트 레벨 (.claude/ 하위가 아닌 루트)
    ├── bkit-pdca-guide.md
    ├── bkit-learning.md
    └── bkit-enterprise.md
```

**설계 결정**: `.claude/output-styles/`가 아닌 `output-styles/`에 배치

이유:
- bkit은 플러그인이므로 `.claude/` 디렉토리는 사용자 프로젝트 설정 영역
- 플러그인 파일은 루트 레벨에 배치하는 bkit 컨벤션 준수 (agents/, skills/과 동일 패턴)
- 사용자가 플러그인 설치 시 자동으로 output-styles/ 디렉토리 사용 가능

### 5.2 Style 1: bkit-pdca-guide.md

```markdown
---
name: bkit-pdca-guide
description: |
  PDCA 워크플로우 가이드 최적화 스타일.
  각 단계별 체크리스트와 진행 상황을 자동 표시합니다.
  bkit 플러그인과 함께 사용하면 최적의 효과를 얻습니다.
keep-coding-instructions: true
---

# bkit PDCA Guide Style

## Response Rules

1. 모든 응답 시작에 현재 PDCA 상태 배지를 포함합니다:
   [Plan] → [Design] → [Do] → [Check] → [Act] (현재 단계 강조)

2. 코드 변경 시 Gap 분석 필요성을 자동으로 판단하여 제안합니다.

3. 각 단계 완료 시 다음 단계 가이드를 명확하게 제공합니다:
   - 완료된 작업 체크리스트 표시
   - 다음 단계 /pdca 명령어 안내
   - 예상 산출물 목록

4. 문서 작성 시 bkit 템플릿을 자동으로 적용합니다.

5. 응답 끝에 bkit Feature Usage Report를 포함합니다.

## Formatting

- 구조화된 표와 체크리스트 활용
- PDCA 진행률 시각화
- 단계별 색상 코드: Plan(blue), Design(purple), Do(green), Check(orange), Act(red)
```

### 5.3 Style 2: bkit-learning.md

```markdown
---
name: bkit-learning
description: |
  bkit 9-Phase Pipeline과 PDCA를 배우면서 개발하는 교육용 스타일.
  각 작업 후 학습 포인트를 제공합니다.
keep-coding-instructions: true
---

# bkit Learning Style

## Response Rules

1. 각 작업 후 "Learning Point" 섹션을 제공합니다:
   > **Learning Point**: 이 작업에서 PDCA의 Check 단계를 수행했습니다.
   > Gap Analysis는 설계와 구현의 차이를 찾아 품질을 보장하는 핵심 활동입니다.

2. PDCA 각 단계의 이유와 효과를 설명합니다:
   - Plan: 왜 계획이 필요한가
   - Design: 설계 문서가 구현 품질에 미치는 영향
   - Do: 설계 기반 구현의 장점
   - Check: Gap Analysis의 가치
   - Act: 반복 개선의 효과

3. 9-Phase Pipeline의 현재 위치와 목적을 알려줍니다.

4. TODO(learner) 마커로 사용자 참여를 유도합니다:
   ```
   // TODO(learner): 이 함수의 에러 처리를 직접 작성해보세요
   // Hint: try-catch와 적절한 에러 메시지를 사용합니다
   ```

5. 난이도별 설명 수준을 조절합니다:
   - Starter: 모든 개념을 상세히 설명
   - Dynamic: 핵심 개념 중심 설명
   - Enterprise: 아키텍처 결정 근거 설명
```

### 5.4 Style 3: bkit-enterprise.md

```markdown
---
name: bkit-enterprise
description: |
  Enterprise 레벨 개발에 최적화된 CTO 관점 스타일.
  아키텍처 결정, 성능, 보안, 확장성 관점을 포함합니다.
keep-coding-instructions: true
---

# bkit Enterprise Style

## Response Rules

1. 아키텍처 결정 시 트레이드오프를 분석합니다:
   | Option | Pros | Cons | Recommendation |
   |--------|------|------|----------------|

2. 성능, 보안, 확장성 관점을 항상 포함합니다:
   - Performance: 예상 TPS, 레이턴시, 리소스 사용량
   - Security: OWASP Top 10 체크, 인증/인가 검증
   - Scalability: 수평/수직 확장 가능성

3. 인프라 변경 시 비용 영향을 고려합니다:
   - 예상 월간 비용 범위
   - 비용 최적화 포인트

4. 코드 리뷰 관점을 포함합니다:
   - Clean Architecture 레이어 준수
   - SOLID 원칙 적용 여부
   - 테스트 커버리지 권장

5. 배포 전략을 포함합니다:
   - Blue/Green, Canary, Rolling 중 권장
   - Rollback 계획
```

### 5.5 bkit.config.json 확장

```json
{
  "outputStyles": {
    "directory": "output-styles",
    "available": [
      "bkit-pdca-guide",
      "bkit-learning",
      "bkit-enterprise"
    ],
    "levelDefaults": {
      "Starter": "bkit-learning",
      "Dynamic": "bkit-pdca-guide",
      "Enterprise": "bkit-enterprise"
    }
  }
}
```

---

## 6. Phase 4: Memory System 통합 설계

### 6.1 Memory Frontmatter 적용 계획

모든 11개 Agent의 frontmatter에 `memory` 필드를 추가합니다.

| Agent | Memory Scope | 이유 | 저장 위치 |
|-------|-------------|------|----------|
| gap-detector | project | 프로젝트별 Gap 패턴 학습 | `.claude/agent-memory/gap-detector/` |
| pdca-iterator | project | 반복 개선 히스토리 기억 | `.claude/agent-memory/pdca-iterator/` |
| code-analyzer | project | 프로젝트 코드 패턴 학습 | `.claude/agent-memory/code-analyzer/` |
| report-generator | project | 보고서 스타일 일관성 유지 | `.claude/agent-memory/report-generator/` |
| starter-guide | user | 사용자 레벨/선호 기억 (전체 프로젝트) | `~/.claude/agent-memory/starter-guide/` |
| bkend-expert | project | BaaS 설정/스키마 기억 | `.claude/agent-memory/bkend-expert/` |
| enterprise-expert | project | 아키텍처 결정 히스토리 기억 | `.claude/agent-memory/enterprise-expert/` |
| design-validator | project | 설계 패턴/컨벤션 기억 | `.claude/agent-memory/design-validator/` |
| qa-monitor | project | QA 이슈 패턴 학습 | `.claude/agent-memory/qa-monitor/` |
| pipeline-guide | user | 사용자 진행 상황 기억 (전체 프로젝트) | `~/.claude/agent-memory/pipeline-guide/` |
| infra-architect | project | 인프라 설정 기억 | `.claude/agent-memory/infra-architect/` |

### 6.2 Agent Frontmatter 수정 예시

#### 6.2.1 gap-detector.md 수정

현재 frontmatter:
```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents and actual implementation.
  ...
linked-from-skills:
  - pdca: analyze
  - phase-8-review: gap
imports:
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
context: fork
mergeResult: false
permissionMode: plan
disallowedTools:
  - Write
  - Edit
model: opus
tools:
  - Read
  - Glob
  - Grep
  - Task
skills:
  - bkit-templates
  - phase-2-convention
  - pdca
---
```

수정 후 (memory 추가):
```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design documents and actual implementation.
  ...
linked-from-skills:
  - pdca: analyze
  - phase-8-review: gap
imports:
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
context: fork
mergeResult: false
permissionMode: plan
memory: project
disallowedTools:
  - Write
  - Edit
model: opus
tools:
  - Read
  - Glob
  - Grep
  - Task
skills:
  - bkit-templates
  - phase-2-convention
  - pdca
---
```

### 6.3 Memory와 기존 .bkit-memory.json 관계

**설계 결정**: 독립 공존

- **Claude Code Memory** (`agent-memory/`): Agent별 세션 간 학습 데이터 (Claude Code 자동 관리)
- **bkit Memory** (`.bkit-memory.json`): PDCA 상태, 세션 정보, 기능 추적 (bkit hook 관리)
- 두 시스템은 독립적으로 작동하며 서로 간섭하지 않음

### 6.4 Memory Scope 선택 근거

```
┌─────────────────────────────────────────────────────────────────┐
│                    Memory Scope Decision Tree                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Agent가 사용자 선호/레벨을 기억해야 하는가?                      │
│    ├── Yes → user scope (모든 프로젝트에서 공유)                 │
│    │         예: starter-guide, pipeline-guide                   │
│    │                                                             │
│    └── No → 프로젝트별 코드/설계 패턴을 기억해야 하는가?          │
│          ├── Yes → project scope (VCS 공유 가능)                │
│          │         예: gap-detector, code-analyzer 등 9개        │
│          │                                                       │
│          └── No → local scope (로컬 전용, gitignored)           │
│                    현재 해당하는 Agent 없음                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Phase 5: 새 Hook Events 활용 설계

### 7.1 hooks/hooks.json 수정

현재 6개 이벤트에 2개 추가:

```json
{
  "hooks": {
    "SessionStart": [ /* 기존 유지 */ ],
    "PreToolUse": [ /* 기존 유지 */ ],
    "PostToolUse": [ /* 기존 유지 */ ],
    "Stop": [ /* 기존 유지 */ ],
    "UserPromptSubmit": [ /* 기존 유지 */ ],
    "PreCompact": [ /* 기존 유지 */ ],

    "TaskCompleted": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-task-completed.js",
            "timeout": 5000
          }
        ]
      }
    ],

    "TeammateIdle": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/team-idle-handler.js",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

### 7.1.1 Schema 호환성 참고

현재 hooks.json은 `$schema: "https://json.schemastore.org/claude-code-hooks.json"` 참조.
Claude Code v2.1.33에서 TaskCompleted/TeammateIdle이 공식 지원되므로 해당 스키마도 업데이트 예상.
만약 스키마 검증 경고 발생 시: `$schema` 필드를 제거하거나 로컬 스키마로 대체.

### 7.2 scripts/pdca-task-completed.js 설계

```javascript
#!/usr/bin/env node
/**
 * pdca-task-completed.js - TaskCompleted Hook Handler (v1.5.1)
 *
 * PDCA Task가 완료될 때 자동으로 다음 단계를 진행하는 hook.
 *
 * 동작:
 * 1. 완료된 Task의 subject에서 PDCA phase 감지 ([Plan], [Design], etc.)
 * 2. feature name 추출
 * 3. shouldAutoAdvance() 확인
 * 4. 자동 진행 시 다음 phase 안내 메시지 출력
 * 5. .bkit-memory.json 업데이트
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
  autoAdvancePdcaPhase,
  shouldAutoAdvance,
  getAutomationLevel,
} = require('../lib/common.js');

// PDCA Phase 감지 패턴
const PDCA_TASK_PATTERNS = {
  plan:   /\[Plan\]\s+(.+)/,
  design: /\[Design\]\s+(.+)/,
  do:     /\[Do\]\s+(.+)/,
  check:  /\[Check\]\s+(.+)/,
  act:    /\[Act(?:-\d+)?\]\s+(.+)/,
  report: /\[Report\]\s+(.+)/,
};

function main() {
  debugLog('TaskCompleted', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('TaskCompleted', 'Failed to parse context', { error: e.message });
    outputAllow('TaskCompleted processed.', 'TaskCompleted');
    return;
  }

  // Task subject에서 PDCA phase 감지
  const taskSubject = hookContext.task_subject
    || hookContext.tool_input?.subject
    || '';

  let detectedPhase = null;
  let featureName = null;

  for (const [phase, pattern] of Object.entries(PDCA_TASK_PATTERNS)) {
    const match = taskSubject.match(pattern);
    if (match) {
      detectedPhase = phase;
      featureName = match[1]?.trim();
      break;
    }
  }

  if (!detectedPhase || !featureName) {
    debugLog('TaskCompleted', 'Not a PDCA task', { subject: taskSubject });
    outputAllow('TaskCompleted processed.', 'TaskCompleted');
    return;
  }

  debugLog('TaskCompleted', 'PDCA task detected', {
    phase: detectedPhase,
    feature: featureName
  });

  // 자동 진행 확인
  const automationLevel = getAutomationLevel();
  if (shouldAutoAdvance(detectedPhase)) {
    const pdcaStatus = getPdcaStatusFull();
    const featureData = pdcaStatus?.features?.[featureName];
    const matchRate = featureData?.matchRate;

    const result = autoAdvancePdcaPhase(featureName, detectedPhase, { matchRate });

    if (result) {
      const response = {
        systemMessage: `PDCA auto-advance: ${detectedPhase} → ${result.phase}`,
        hookSpecificOutput: {
          hookEventName: "TaskCompleted",
          pdcaPhase: detectedPhase,
          nextPhase: result.phase,
          feature: featureName,
          autoAdvanced: true,
          additionalContext: `\n## PDCA Auto-Advance\n` +
            `Task [${detectedPhase.toUpperCase()}] ${featureName} completed.\n` +
            `Next phase: ${result.phase}\n` +
            (result.trigger ? `Suggested command: /pdca ${result.trigger.args}\n` : '')
        }
      };

      console.log(JSON.stringify(response));
      process.exit(0);
    }
  }

  outputAllow(`PDCA Task [${detectedPhase}] ${featureName} completed.`, 'TaskCompleted');
}

main();
```

### 7.3 scripts/team-idle-handler.js 설계

```javascript
#!/usr/bin/env node
/**
 * team-idle-handler.js - TeammateIdle Hook Handler (v1.5.1)
 *
 * Teammate가 idle 상태가 되면:
 * 1. 현재 PDCA 상태 확인
 * 2. 미완료 Task가 있으면 다음 Task 안내
 * 3. 모든 Task 완료 시 Team cleanup 안내
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
} = require('../lib/common.js');

const { isTeamModeAvailable, getTeamConfig } = require('../lib/team');

function main() {
  debugLog('TeammateIdle', 'Hook started');

  // Team Mode가 아니면 무시
  if (!isTeamModeAvailable()) {
    outputAllow('TeammateIdle processed (no team mode).', 'TeammateIdle');
    return;
  }

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('TeammateIdle', 'Failed to parse context', { error: e.message });
    outputAllow('TeammateIdle processed.', 'TeammateIdle');
    return;
  }

  const teammateId = hookContext.teammate_id || hookContext.agent_id || 'unknown';
  const pdcaStatus = getPdcaStatusFull();

  debugLog('TeammateIdle', 'Teammate became idle', {
    teammateId,
    primaryFeature: pdcaStatus?.primaryFeature
  });

  // 안내 메시지 생성
  const response = {
    systemMessage: `Teammate ${teammateId} is idle`,
    hookSpecificOutput: {
      hookEventName: "TeammateIdle",
      teammateId: teammateId,
      additionalContext: `\n## Teammate Idle\n` +
        `Teammate ${teammateId} has completed its current task.\n` +
        `Check TaskList for pending tasks or assign new work.\n`
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
```

### 7.4 lib/pdca/automation.js 수정

TaskCompleted hook과 연동하는 함수 추가:

```javascript
// v1.5.1: TaskCompleted hook 관련 추가 exports

/**
 * TaskCompleted 이벤트에서 PDCA phase 감지
 * @param {string} taskSubject - 완료된 Task의 subject
 * @returns {{ phase: string, feature: string } | null}
 */
function detectPdcaFromTaskSubject(taskSubject) {
  // [Plan], [Design], [Do], [Check], [Act-N], [Report] 패턴 감지
}

/**
 * TaskCompleted 후 다음 PDCA 액션 결정
 * @param {string} phase - 완료된 phase
 * @param {string} feature - feature name
 * @returns {{ nextPhase: string, command: string, autoExecute: boolean } | null}
 */
function getNextPdcaActionAfterCompletion(phase, feature) {
  // shouldAutoAdvance 결과에 따라 자동 실행 여부 결정
}

// Module exports에 추가:
module.exports = {
  // ... 기존 9 exports
  detectPdcaFromTaskSubject,           // 신규
  getNextPdcaActionAfterCompletion,    // 신규
};
```

---

## 8. Phase 6: Sub-agent 제한 설계

### 8.1 적용 대상 Agent

현재 Agent의 `tools` 필드에서 Task를 사용하는 Agent에 대해 `Task(agent_type)` 구문으로 제한합니다.

| Agent | 현재 tools | 수정 후 tools | 허용 Sub-agent |
|-------|-----------|-------------|--------------|
| gap-detector | `Read, Glob, Grep, Task` | `Read, Glob, Grep, Task(Explore)` | Explore만 |
| pdca-iterator | `Read, Write, Edit, Glob, Grep, Bash, Task, TodoWrite, LSP` | `Read, Write, Edit, Glob, Grep, Bash, Task(Explore), Task(gap-detector), TodoWrite, LSP` | Explore, gap-detector |
| enterprise-expert | `Read, Write, Edit, Glob, Grep, Task, WebSearch` | `Read, Write, Edit, Glob, Grep, Task(infra-architect), Task(Explore), WebSearch` | infra-architect, Explore |
| qa-monitor | `Bash, Read, Write, Glob, Grep, Task` | `Bash, Read, Write, Glob, Grep, Task(Explore)` | Explore만 |

### 8.2 적용하지 않는 Agent

| Agent | 이유 |
|-------|------|
| code-analyzer | `Task` 사용하지만 Read-only agent, Task(Explore)로 제한하면 LSP 등 제약 |
| design-validator | Task 미사용 |
| report-generator | Task 미사용 |
| starter-guide | Task 미사용 |
| bkend-expert | Task 미사용 |
| pipeline-guide | Task 미사용 (TodoWrite만 사용) |
| infra-architect | Task 사용하지만 다양한 sub-agent 필요 |

### 8.3 Agent Frontmatter 수정 예시

#### gap-detector.md

```yaml
# 변경 전
tools:
  - Read
  - Glob
  - Grep
  - Task

# 변경 후
tools:
  - Read
  - Glob
  - Grep
  - Task(Explore)
```

#### pdca-iterator.md

```yaml
# 변경 전
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - LSP

# 변경 후
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(Explore)
  - Task(gap-detector)
  - TodoWrite
  - LSP
```

### 8.4 호환성 고려사항

- `Task(agent_type)` 구문은 Claude Code v2.1.33+에서만 지원
- v2.1.31~v2.1.32에서는 해당 구문이 무시되거나 에러 발생 가능
- **완화 전략**: bkit v1.5.1은 Claude Code v2.1.33을 최소 요구 버전으로 설정
- `.claude-plugin/plugin.json`에 `minClaudeCodeVersion` 필드 추가 (지원 시)

---

## 9. 버전 관리 설계

### 9.1 수정할 버전 파일

| 파일 | 현재 | 수정 후 |
|------|------|---------|
| `bkit.config.json` → version | "1.5.0" | "1.5.1" |
| `.claude-plugin/plugin.json` → version | "1.5.0" | "1.5.1" |
| `lib/common.js` 주석 | @version 1.5.0 | @version 1.5.1 (5 directories 명시) |
| `hooks/session-start.js` 주석/출력 | v1.5.0 | v1.5.1 |
| `lib/pdca/automation.js` 주석 | @version 1.4.7 | @version 1.5.1 |

### 9.2 bkit.config.json 최종 변경 요약

```json
{
  "version": "1.5.1",              // 수정: 1.5.0 → 1.5.1

  // 기존 섹션 유지...

  "team": {                        // 신규 추가 (Phase 2)
    "enabled": false,
    "displayMode": "in-process",
    "maxTeammates": 4,
    "delegateMode": false,
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 2 },
      "Enterprise": { "maxTeammates": 4 }
    }
  },

  "outputStyles": {                // 신규 추가 (Phase 3)
    "directory": "output-styles",
    "available": [
      "bkit-pdca-guide",
      "bkit-learning",
      "bkit-enterprise"
    ],
    "levelDefaults": {
      "Starter": "bkit-learning",
      "Dynamic": "bkit-pdca-guide",
      "Enterprise": "bkit-enterprise"
    }
  },

  "hooks": {                       // 확장 (Phase 5)
    "userPromptSubmit": { /* 기존 */ },
    "contextCompaction": { /* 기존 */ },
    "taskCompleted": {             // 신규
      "enabled": true,
      "autoAdvance": true
    },
    "teammateIdle": {              // 신규
      "enabled": true
    }
  }
}
```

---

## 10. Error Handling

### 10.1 Agent Teams 미활성화 시

```
사용자: /pdca team user-auth
응답: Agent Teams가 활성화되지 않았습니다.

활성화 방법:
1. ~/.claude/settings.json에 추가:
   { "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
2. Claude Code 재시작

또는 단일 세션으로 PDCA를 계속 진행하시겠습니까?
```

### 10.2 Hook Script 오류 시

```javascript
// 모든 hook script 공통 에러 처리 패턴 (기존 패턴 유지)
try {
  main();
} catch (e) {
  debugLog('ScriptName', 'Unexpected error', { error: e.message });
  outputAllow('Hook processed with error.', 'EventName');
}
```

### 10.3 Memory Frontmatter 미지원 버전

- Claude Code v2.1.33 미만에서 `memory` frontmatter가 무시됨
- 기존 Agent 동작에 영향 없음 (graceful degradation)
- 사용자에게 별도 경고 불필요

---

## 11. Test Plan

### 11.1 테스트 범위

| Phase | 테스트 유형 | 대상 | 예상 TC |
|-------|-----------|------|--------|
| 1 | 호환성 | 기존 기능 전체 | 188 TC |
| 2 | 기능 | Team Mode | 15 TC |
| 3 | 기능 | Output Styles | 9 TC |
| 4 | 기능 | Memory Frontmatter | 11 TC |
| 5 | 기능 | New Hooks | 10 TC |
| 6 | 기능 | Sub-agent Restriction | 8 TC |
| **Total** | | | **241 TC** |

### 11.2 Phase 2 테스트 케이스

| TC-ID | 테스트 | 기대 결과 |
|-------|--------|----------|
| T2-01 | /pdca team 실행 (Teams 미활성화) | 활성화 가이드 표시 |
| T2-02 | /pdca team 실행 (Teams 활성화, Starter) | 미지원 안내 |
| T2-03 | /pdca team 실행 (Teams 활성화, Dynamic) | 2 teammate 전략 표시 |
| T2-04 | /pdca team 실행 (Teams 활성화, Enterprise) | 4 teammate 전략 표시 |
| T2-05 | isTeamModeAvailable() 테스트 | 환경변수에 따라 true/false |
| T2-06 | generateTeamStrategy('Dynamic') | Dynamic 전략 객체 반환 |
| T2-07 | generateTeamStrategy('Enterprise') | Enterprise 전략 객체 반환 |
| T2-08 | generateTeamStrategy('Starter') | null 반환 |
| T2-09 | getTeamConfig() 기본값 | enabled=false, maxTeammates=4 |
| T2-10 | lib/common.js team exports | 6개 export 확인 |
| T2-11 | session-start.js Teams 감지 | Teams 활성화 시 안내 메시지 |
| T2-12 | /pdca team status | Team 상태 표시 |
| T2-13 | PDCA Skill team argument 인식 | team 명령 정상 처리 |
| T2-14 | bkit.config.json team 섹션 | 설정 로드 정상 |
| T2-15 | formatTeamStatus() 출력 형식 | ASCII 다이어그램 포함 |

### 11.3 Phase 5 테스트 케이스

| TC-ID | 테스트 | 기대 결과 |
|-------|--------|----------|
| T5-01 | TaskCompleted hook 발동 | PDCA Task 완료 시 hook 실행 |
| T5-02 | [Plan] Task 완료 | "Next: design" 안내 |
| T5-03 | [Check] Task 완료 (matchRate < 90) | "Next: act" 안내 |
| T5-04 | [Check] Task 완료 (matchRate >= 90) | "Next: report" 안내 |
| T5-05 | 비-PDCA Task 완료 | hook 실행되나 무동작 |
| T5-06 | autoAdvance=false 설정 | 안내만 표시, 자동 진행 없음 |
| T5-07 | TeammateIdle hook 발동 (Team Mode) | idle 안내 메시지 |
| T5-08 | TeammateIdle hook 발동 (비-Team Mode) | 무동작 |
| T5-09 | hooks.json 8개 이벤트 파싱 | 에러 없이 로드 |
| T5-10 | 기존 6개 hook과 새 2개 hook 공존 | 상호 간섭 없음 |

### 11.4 Phase 3 테스트 케이스 (Output Styles)

| TC-ID | 테스트 | 기대 결과 |
|-------|--------|----------|
| T3-01 | bkit-pdca-guide.md 파일 존재 | output-styles/ 디렉토리에 존재 |
| T3-02 | bkit-learning.md 파일 존재 | output-styles/ 디렉토리에 존재 |
| T3-03 | bkit-enterprise.md 파일 존재 | output-styles/ 디렉토리에 존재 |
| T3-04 | bkit-pdca-guide frontmatter 유효 | name, description, keep-coding-instructions 포함 |
| T3-05 | bkit-learning frontmatter 유효 | name, description, keep-coding-instructions 포함 |
| T3-06 | bkit-enterprise frontmatter 유효 | name, description, keep-coding-instructions 포함 |
| T3-07 | Output Style 선택 | /output-style 명령으로 bkit 스타일 선택 가능 |
| T3-08 | keep-coding-instructions 동작 | coding instructions 유지된 채 스타일 적용 |
| T3-09 | bkit.config.json outputStyles 섹션 | 설정 정상 로드 |

### 11.5 Phase 4 테스트 케이스 (Memory Frontmatter)

| TC-ID | 테스트 | 기대 결과 |
|-------|--------|----------|
| T4-01 | gap-detector memory: project | frontmatter 정상, agent 실행 정상 |
| T4-02 | pdca-iterator memory: project | frontmatter 정상, agent 실행 정상 |
| T4-03 | code-analyzer memory: project | frontmatter 정상, agent 실행 정상 |
| T4-04 | report-generator memory: project | frontmatter 정상, agent 실행 정상 |
| T4-05 | starter-guide memory: user | frontmatter 정상, agent 실행 정상 |
| T4-06 | bkend-expert memory: project | frontmatter 정상, agent 실행 정상 |
| T4-07 | enterprise-expert memory: project | frontmatter 정상, agent 실행 정상 |
| T4-08 | design-validator memory: project | frontmatter 정상, agent 실행 정상 |
| T4-09 | qa-monitor memory: project | frontmatter 정상, agent 실행 정상 |
| T4-10 | pipeline-guide memory: user | frontmatter 정상, agent 실행 정상 |
| T4-11 | infra-architect memory: project | frontmatter 정상, agent 실행 정상 |

### 11.6 Phase 6 테스트 케이스 (Sub-agent Restriction)

| TC-ID | 테스트 | 기대 결과 |
|-------|--------|----------|
| T6-01 | gap-detector Task(Explore) | Explore sub-agent 정상 호출 |
| T6-02 | gap-detector 비허용 sub-agent | 제한된 agent 호출 불가 |
| T6-03 | pdca-iterator Task(Explore) | Explore 정상 호출 |
| T6-04 | pdca-iterator Task(gap-detector) | gap-detector 정상 호출 |
| T6-05 | enterprise-expert Task(infra-architect) | infra-architect 정상 호출 |
| T6-06 | enterprise-expert Task(Explore) | Explore 정상 호출 |
| T6-07 | qa-monitor Task(Explore) | Explore 정상 호출 |
| T6-08 | 비제한 Agent의 Task | 기존처럼 모든 sub-agent 호출 가능 |

---

## 11.7 Design Decisions (Plan과의 의도적 차이)

| 항목 | Plan | Design | 이유 |
|------|------|--------|------|
| Team Skill 방식 | `.claude/skills/pdca-team.md` (별도 Skill) | 기존 PDCA Skill 확장 | 사용자 경험 일관성, PDCA 명령 체계 통일 |
| Hook Script 언어 | `.sh` (Shell) | `.js` (Node.js) | 기존 bkit 스크립트 패턴과 일관성, 크로스 플랫폼 호환 |
| Hook Script 위치 | `hooks/` 디렉토리 | `scripts/` 디렉토리 | 기존 모든 hook script가 scripts/에 위치하는 패턴 준수 |
| Output Styles 위치 | `.claude/output-styles/` | `output-styles/` (루트) | 플러그인 파일은 루트 레벨 배치 bkit 컨벤션 (agents/, skills/ 패턴) |
| TaskCompleted matcher | Phase별 개별 matcher | 단일 entry, 내부 분기 | TaskCompleted matcher 동작이 PreToolUse와 다를 수 있어 안전한 설계 |

---

## 12. Implementation Order

### 12.1 구현 순서 (권장)

```
Step 1: 버전 업데이트 (모든 Phase 공통)
  └── bkit.config.json, plugin.json 버전 1.5.0 → 1.5.1

Step 2: Phase 1 - 호환성 검증
  ├── 188 TC 테스트 실행
  ├── 이슈 발견 시 수정
  └── 호환성 리포트 작성

Step 3: Phase 4 - Memory Frontmatter (간단, 독립적)
  └── 11개 Agent .md 파일에 memory 필드 추가

Step 4: Phase 6 - Sub-agent 제한 (간단, 독립적)
  └── 4개 Agent .md 파일의 tools 필드 수정

Step 5: Phase 3 - Output Styles (독립적)
  ├── output-styles/ 디렉토리 생성
  ├── 3개 .md 파일 작성
  └── bkit.config.json outputStyles 섹션 추가

Step 6: Phase 5 - New Hook Events
  ├── scripts/pdca-task-completed.js 작성
  ├── scripts/team-idle-handler.js 작성
  ├── hooks/hooks.json 수정 (2개 이벤트 추가)
  ├── lib/pdca/automation.js 수정 (2개 함수 추가)
  └── bkit.config.json hooks 섹션 확장

Step 7: Phase 2 - Agent Teams 통합 (가장 복잡)
  ├── lib/team/ 모듈 생성 (4개 파일)
  ├── lib/common.js bridge 확장
  ├── skills/pdca/SKILL.md 수정 (team 명령 추가)
  ├── hooks/session-start.js 수정
  ├── scripts/unified-stop.js 수정
  └── bkit.config.json team 섹션 추가

Step 8: 통합 테스트
  └── 241 TC 전체 실행
```

### 12.2 구현 순서 근거

1. **Phase 4, 6 먼저**: Agent .md 파일 수정만으로 완료, 코드 변경 없음
2. **Phase 3 다음**: 독립적인 파일 생성, 기존 코드 수정 최소
3. **Phase 5 다음**: Hook script + hooks.json 수정, Phase 2에 필요한 기반
4. **Phase 2 마지막**: 가장 복잡한 모듈 생성, Phase 5의 hook 인프라 활용

---

## 13. Security Considerations

- [x] Team Mode의 환경변수(CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS)는 사용자가 명시적으로 설정해야만 활성화
- [x] Sub-agent 제한(Task(agent_type))으로 Agent의 무분별한 sub-agent 생성 방지
- [x] Memory scope 설계 시 user scope는 최소한으로 제한 (2개 Agent만)
- [x] Hook script는 기존 패턴(outputAllow/outputBlock)을 따라 안전한 출력
- [x] Output Styles의 keep-coding-instructions: true로 보안 관련 코딩 지시 유지

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-06 | Initial draft - comprehensive design for all 6 phases | bkit Team |

---

*Generated by bkit PDCA Skill | 2026-02-06*
