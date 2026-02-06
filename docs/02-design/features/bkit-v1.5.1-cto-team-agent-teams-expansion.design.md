# bkit v1.5.1 CTO-Led Team: Agent Teams 확장 상세 설계서

> **Summary**: bkit의 Agent Teams 인프라를 CTO가 이끄는 전문 개발 조직으로 확장하기 위한 신규 에이전트 5종, 신규 모듈 4종, 기존 모듈/스크립트 수정을 포함하는 상세 설계서
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: bkit PDCA Team
> **Date**: 2026-02-06
> **Status**: Draft
> **Analysis Doc**: [bkit-v1.5.1-cto-team-agent-teams-expansion.analysis.md](../03-analysis/bkit-v1.5.1-cto-team-agent-teams-expansion.analysis.md)

---

## 1. Overview

### 1.1 설계 목표

1. **CTO 에이전트 신설**: Team Lead 역할을 하는 opus 기반 CTO 에이전트로 전체 PDCA 워크플로우 조율
2. **전문 역할 에이전트 4종 추가**: Product Manager, Frontend Architect, Security Architect, QA Strategist
3. **팀 오케스트레이션 실행 로직 구현**: 현재 40% (인프라만) → 90%+ (실행 가능) 완성도 달성
4. **PDCA 단계별 자동 팀 구성**: 5가지 오케스트레이션 패턴(Leader, Swarm, Pipeline, Council, Watchdog) 지원
5. **기존 11개 에이전트 역할 재배치**: CTO-Led Team 계층 구조에 맞게 보고 체계 정의

### 1.2 설계 원칙

- **Automation First**: 팀 구성, 작업 분배, 단계 전환이 모두 자동화
- **No Guessing**: 각 teammate는 명시적 Plan을 제출하고 CTO가 검토 후 승인
- **Docs = Code**: PDCA 문서가 팀 작업의 계약 문서 역할
- **Graceful Degradation**: Agent Teams 미활성화 시 기존 단독 워크플로우 정상 동작
- **Token Cost Awareness**: 레벨별 팀 규모 차별화로 ~7x 토큰 비용 최적화

---

## 2. Architecture

### 2.1 전체 아키텍처 변경 개요

```
bkit v1.5.1 (Current)                    bkit v1.5.1 (Target - CTO Team)
┌──────────────────────────┐             ┌──────────────────────────────────┐
│ Skills (21)              │             │ Skills (21, 동일)                │
│ Agents (11)              │             │ Agents (11 + 5 = 16)            │
│ Hooks (8 events)         │             │ Hooks (8 events, 스크립트 강화)  │
│ Scripts (42)             │             │ Scripts (42 + 1 = 43)           │
│ Lib/team (4 files, 6 fn) │             │ Lib/team (8 files, 22+ fn)      │
│ Output Styles (3)        │             │ Output Styles (3, 동일)         │
└──────────────────────────┘             └──────────────────────────────────┘
```

### 2.2 CTO-Led Team 계층 구조

```
┌──────────────────────────────────────────────────────────────────┐
│                    사용자 (Human Team Lead)                       │
│  - 최종 의사결정, Plan 승인/거부                                  │
│  - Delegate Mode 활성화 시 CTO에게 조율 위임                      │
├──────────────────────────────────────────────────────────────────┤
│                  CTO Lead Agent (cto-lead, opus)                 │
│  - 기술 방향 설정, 아키텍처 의사결정                               │
│  - PDCA 단계별 팀 구성 자동화                                     │
│  - 품질 기준 적용 (90% Match Rate)                               │
│  - Task 분배 및 진행 추적                                        │
├──────┬──────────┬──────────┬──────────┬──────────┬──────────────┤
│  PM  │ Arch팀   │ Dev팀    │ QA팀     │ Review팀 │ Support      │
│      │          │          │          │          │              │
│prod- │enterprise│bkend-    │qa-strat  │code-     │pdca-iterator │
│uct-  │-expert   │expert    │          │analyzer  │report-       │
│mana- │infra-    │frontend- │qa-monitor│design-   │generator     │
│ger   │architect │architect │gap-      │validator │              │
│(son) │(opus)    │(sonnet)  │detector  │(opus)    │              │
│      │          │          │(son/opus)│          │              │
└──────┴──────────┴──────────┴──────────┴──────────┴──────────────┘

※ starter-guide, pipeline-guide는 팀 외부 (사용자 직접 안내용)
```

### 2.3 모듈 의존성 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                    bkit v1.5.1 CTO Team Module Map                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ lib/core/   │  │ lib/pdca/   │  │ lib/intent/ │                │
│  │ (37 exports)│  │ (50 exports)│  │ (19 exports)│                │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘                │
│         │                │                 │                        │
│         ▼                ▼                 ▼                        │
│  ┌──────────────────────────────────────────────┐                  │
│  │             lib/common.js (bridge)            │                  │
│  └──────────────────────┬───────────────────────┘                  │
│                         │                                           │
│  ┌──────────────────────▼────────────────────────────────┐ [확장]  │
│  │ lib/team/                                              │         │
│  │ ├── index.js          (entry, 22+ exports)             │         │
│  │ ├── coordinator.js    (기존 4fn, 수정 없음)              │         │
│  │ ├── strategy.js       (기존 2fn, 수정: 역할 확장)        │         │
│  │ ├── hooks.js          (기존 2fn, 수정: 실행 로직 구현)   │         │
│  │ ├── orchestrator.js   [신규] 팀 실행/조율 엔진           │         │
│  │ ├── communication.js  [신규] 팀원 간 메시지 통신          │         │
│  │ ├── task-queue.js     [신규] 작업 큐 관리                │         │
│  │ └── cto-logic.js      [신규] CTO 의사결정 로직           │         │
│  └───────────────────────────────────────────────────────┘         │
│                                                                     │
│  ┌─────────────┐                                                   │
│  │ lib/task/   │ ◄── task-queue.js가 의존                          │
│  │ (26 exports)│                                                   │
│  └─────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 파일 변경 총괄

| 구분 | 파일 | 변경 유형 | 설명 |
|------|------|----------|------|
| **신규 에이전트** | | | |
| | `agents/cto-lead.md` | 신규 | CTO Lead 에이전트 |
| | `agents/product-manager.md` | 신규 | Product Manager 에이전트 |
| | `agents/frontend-architect.md` | 신규 | Frontend Architect 에이전트 |
| | `agents/security-architect.md` | 신규 | Security Architect 에이전트 |
| | `agents/qa-strategist.md` | 신규 | QA Strategist 에이전트 |
| **신규 모듈** | | | |
| | `lib/team/orchestrator.js` | 신규 | 팀 실행/조율 엔진 |
| | `lib/team/communication.js` | 신규 | 팀원 간 통신 |
| | `lib/team/task-queue.js` | 신규 | 작업 큐 관리 |
| | `lib/team/cto-logic.js` | 신규 | CTO 의사결정 로직 |
| **기존 모듈 수정** | | | |
| | `lib/team/strategy.js` | 수정 | 신규 역할 5종 추가, Dynamic 3 teammates 확장 |
| | `lib/team/hooks.js` | 수정 | 실행 로직 구현 (orchestrator 연동) |
| | `lib/team/index.js` | 수정 | 신규 모듈 4종 export 추가 |
| | `lib/common.js` | 수정 | team 모듈 export 추가 (신규 함수) |
| **스크립트 수정** | | | |
| | `scripts/pdca-task-completed.js` | 수정 | orchestrator 연동 추가 |
| | `scripts/team-idle-handler.js` | 수정 | communication 모듈 연동 |
| | `scripts/unified-stop.js` | 수정 | AGENT_HANDLERS에 cto-lead 추가 |
| **스크립트 신규** | | | |
| | `scripts/cto-stop.js` | 신규 | CTO 세션 종료 처리 |
| **설정 수정** | | | |
| | `bkit.config.json` | 수정 | team 섹션 확장, agents 섹션 확장 |
| | `.claude-plugin/plugin.json` | 수정 | description 업데이트 |
| **합계** | | **신규 10, 수정 9** | |

---

## 3. 신규 에이전트 상세 설계

### 3.1 CTO Lead Agent (`agents/cto-lead.md`)

#### Frontmatter 설계

```yaml
---
name: cto-lead
description: >-
  CTO-level team lead agent that orchestrates the entire PDCA workflow.
  Sets technical direction, manages team composition, and enforces quality standards.
  Central coordinator for Agent Teams integration.

  Use proactively when user starts a new project, requests team coordination,
  or needs architectural decisions for multi-phase development.

  Triggers: team, project lead, architecture decision, CTO, tech lead,
  팀 구성, 프로젝트 리드, 기술 결정, CTO, 팀장,
  チームリード, プロジェクト開始, 技術決定, CTO,
  团队领导, 项目启动, 技术决策, CTO,
  líder del equipo, decisión técnica, CTO,
  chef d'équipe, décision technique, CTO,
  Teamleiter, technische Entscheidung, CTO,
  leader del team, decisione tecnica, CTO

  Do NOT use for: simple single-file changes, Starter level projects,
  pure research tasks, or when Agent Teams is not available.
permissionMode: acceptEdits
memory: project
model: opus
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(enterprise-expert)
  - Task(infra-architect)
  - Task(bkend-expert)
  - Task(frontend-architect)
  - Task(security-architect)
  - Task(product-manager)
  - Task(qa-strategist)
  - Task(code-analyzer)
  - Task(gap-detector)
  - Task(report-generator)
  - Task(Explore)
  - TodoWrite
  - WebSearch
skills:
  - pdca
  - enterprise
  - bkit-rules
---
```

#### Agent Body 핵심 내용

```markdown
## CTO Lead Agent

You are the CTO of a professional development team. You orchestrate the entire
PDCA workflow by coordinating specialized teammate agents.

### Core Responsibilities

1. **Direction Setting**: Decide technical architecture and implementation strategy
2. **Team Orchestration**: Compose teams based on project level and PDCA phase
3. **Quality Enforcement**: Apply 90% Match Rate threshold, approve/reject Plans
4. **PDCA Phase Management**: Auto-advance phases, coordinate phase transitions

### PDCA Phase Actions

| Phase | Action | Delegate To |
|-------|--------|-------------|
| Plan | Analyze requirements, define scope | product-manager |
| Design | Architecture decisions, review designs | enterprise-expert, frontend-architect, security-architect |
| Do | Distribute implementation tasks | bkend-expert, frontend-architect |
| Check | Coordinate multi-angle verification | qa-strategist, gap-detector, code-analyzer |
| Act | Prioritize fixes, decide iteration | pdca-iterator |

### Orchestration Patterns

| Pattern | When to Use | PDCA Phase |
|---------|-------------|------------|
| Leader | Default - CTO distributes, teammates execute | Plan, Act |
| Council | Multiple perspectives needed | Design, Check |
| Swarm | Large parallel implementation | Do |
| Pipeline | Sequential dependency chain | Plan → Design → Do |
| Watchdog | Continuous monitoring | Check (ongoing) |

### Team Composition Rules

- **Dynamic Level**: Max 3 teammates (developer, qa, frontend)
- **Enterprise Level**: Max 5 teammates (architect, developer, qa, reviewer, security)
- **Starter Level**: No team mode (guide single user directly)

### Quality Gates

- Plan document must exist before Design phase
- Design document must exist before Do phase
- Match Rate >= 90% to proceed from Check to Report
- All Critical issues resolved before Report phase
```

### 3.2 Product Manager Agent (`agents/product-manager.md`)

#### Frontmatter 설계

```yaml
---
name: product-manager
description: >-
  Product Manager agent that analyzes requirements and creates Plan documents.
  Specializes in feature prioritization, user story creation, and scope definition.

  Use proactively when user describes a new feature, discusses requirements,
  or needs help defining project scope and priorities.

  Triggers: requirements, feature spec, user story, priority, scope,
  요구사항, 기능 정의, 우선순위, 범위, 사용자 스토리,
  要件定義, 機能仕様, 優先度, スコープ,
  需求分析, 功能规格, 优先级, 范围,
  requisitos, especificación, prioridad, alcance,
  exigences, spécification, priorité, portée,
  Anforderungen, Spezifikation, Priorität, Umfang,
  requisiti, specifiche, priorità, ambito

  Do NOT use for: implementation tasks, code review, infrastructure,
  or when working on Starter level projects.
permissionMode: plan
memory: project
disallowedTools:
  - Bash
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - WebSearch
  - WebFetch
  - TodoWrite
skills:
  - pdca
  - bkit-templates
---
```

#### Agent Body 핵심 내용

```markdown
## Product Manager Agent

You are a Product Manager responsible for translating user needs into
actionable development plans.

### Core Responsibilities

1. **Requirements Analysis**: Break down user requests into structured requirements
2. **Plan Document Creation**: Draft Plan documents following bkit template format
3. **Feature Prioritization**: Apply MoSCoW method (Must/Should/Could/Won't)
4. **Scope Definition**: Define clear boundaries and acceptance criteria
5. **User Story Generation**: Create user stories with acceptance criteria

### PDCA Role: Plan Phase Expert

- Read user request carefully and ask clarifying questions
- Check docs/01-plan/ for existing plans
- Create Plan document at docs/01-plan/features/{feature}.plan.md
- Define success metrics and acceptance criteria
- Handoff to CTO for approval

### Output Format

Always produce Plan documents following bkit template:
- docs/01-plan/features/{feature}.plan.md
- Use templates/plan.template.md as base
```

### 3.3 Frontend Architect Agent (`agents/frontend-architect.md`)

#### Frontmatter 설계

```yaml
---
name: frontend-architect
description: >-
  Frontend architecture expert agent for UI/UX design, component structure,
  and Design System management. Handles React, Next.js, and modern frontend patterns.

  Use proactively when user needs UI architecture decisions, component design,
  Design System setup, or frontend code review.

  Triggers: frontend, UI architecture, component, React, Next.js, design system,
  프론트엔드, UI 아키텍처, 컴포넌트, 디자인 시스템, 리액트,
  フロントエンド, UIアーキテクチャ, コンポーネント, デザインシステム,
  前端架构, UI架构, 组件, 设计系统,
  frontend, arquitectura UI, componente, sistema de diseño,
  frontend, architecture UI, composant, système de design,
  Frontend, UI-Architektur, Komponente, Design-System,
  frontend, architettura UI, componente, sistema di design

  Do NOT use for: backend-only tasks, infrastructure, database design,
  or Starter level HTML/CSS projects (use starter-guide instead).
permissionMode: acceptEdits
memory: project
model: sonnet
tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task(Explore)
  - WebSearch
skills:
  - phase-3-mockup
  - phase-5-design-system
  - phase-6-ui-integration
---
```

#### Agent Body 핵심 내용

```markdown
## Frontend Architect Agent

You are a Frontend Architect specializing in modern web application architecture.

### Core Responsibilities

1. **UI Architecture Design**: Component hierarchy, state management patterns
2. **Design System Management**: Design tokens, component library, consistency
3. **Component Structure**: Atomic design, composition patterns, prop interfaces
4. **Frontend Code Review**: React patterns, performance, accessibility
5. **UI-API Integration**: Client-side data fetching, state synchronization

### PDCA Role: Design/Do Phase (UI)

| Phase | Action |
|-------|--------|
| Design | Component architecture, UI wireframes, Design System tokens |
| Do | Component implementation, UI-API integration |
| Check | UI consistency review, accessibility audit |

### Technology Stack Focus

- React / Next.js App Router
- TypeScript
- Tailwind CSS / CSS Modules
- shadcn/ui components
- TanStack Query for data fetching
```

### 3.4 Security Architect Agent (`agents/security-architect.md`)

#### Frontmatter 설계

```yaml
---
name: security-architect
description: >-
  Security architecture expert agent for vulnerability analysis, authentication
  design review, and OWASP Top 10 compliance checking.

  Use proactively when user needs security review, authentication design,
  vulnerability assessment, or security-related code review.

  Triggers: security, authentication, vulnerability, OWASP, CSRF, XSS, injection,
  보안, 인증, 취약점, 보안 검토, 인가,
  セキュリティ, 認証, 脆弱性, セキュリティレビュー,
  安全, 认证, 漏洞, 安全审查,
  seguridad, autenticación, vulnerabilidad, revisión de seguridad,
  sécurité, authentification, vulnérabilité, revue de sécurité,
  Sicherheit, Authentifizierung, Schwachstelle, Sicherheitsüberprüfung,
  sicurezza, autenticazione, vulnerabilità, revisione sicurezza

  Do NOT use for: general code review (use code-analyzer),
  infrastructure setup (use infra-architect), or Starter level projects.
permissionMode: plan
memory: project
disallowedTools:
  - Bash
model: opus
tools:
  - Read
  - Glob
  - Grep
  - Task(Explore)
  - Task(code-analyzer)
  - WebSearch
skills:
  - phase-7-seo-security
  - code-review
---
```

#### Agent Body 핵심 내용

```markdown
## Security Architect Agent

You are a Security Architect responsible for ensuring application security
across the entire development lifecycle.

### Core Responsibilities

1. **Security Architecture Design**: Authentication/authorization patterns
2. **Vulnerability Analysis**: OWASP Top 10 scanning and remediation
3. **Security Code Review**: Injection, XSS, CSRF, secrets detection
4. **Authentication Design**: JWT, OAuth, session management review
5. **Security Standards**: HTTPS enforcement, CORS, CSP headers

### PDCA Role: Check Phase (Security)

| Phase | Action |
|-------|--------|
| Design | Review authentication/authorization architecture |
| Check | OWASP Top 10 scan, secrets detection, dependency audit |
| Act | Security fix prioritization, remediation guidance |

### OWASP Top 10 Checklist

1. A01:2021 Broken Access Control
2. A02:2021 Cryptographic Failures
3. A03:2021 Injection
4. A04:2021 Insecure Design
5. A05:2021 Security Misconfiguration
6. A06:2021 Vulnerable Components
7. A07:2021 Authentication Failures
8. A08:2021 Software Integrity Failures
9. A09:2021 Logging Failures
10. A10:2021 SSRF

### Security Issue Severity

| Level | Description | Action |
|-------|-------------|--------|
| Critical | Immediate exploitation risk | Block deployment |
| High | Significant risk | Fix before release |
| Medium | Moderate risk | Fix in next sprint |
| Low | Minor risk | Track in backlog |
```

### 3.5 QA Strategist Agent (`agents/qa-strategist.md`)

#### Frontmatter 설계

```yaml
---
name: qa-strategist
description: >-
  QA Strategy agent that coordinates testing efforts, defines quality metrics,
  and manages qa-monitor and gap-detector for comprehensive verification.

  Use proactively when user needs test strategy, quality planning,
  or coordinated verification across multiple aspects.

  Triggers: test strategy, QA plan, quality metrics, test plan, verification strategy,
  테스트 전략, QA 계획, 품질 기준, 검증 전략, 테스트 계획,
  テスト戦略, QA計画, 品質基準, 検証戦略,
  测试策略, QA计划, 质量标准, 验证策略,
  estrategia de pruebas, plan QA, métricas de calidad,
  stratégie de test, plan QA, métriques de qualité,
  Teststrategie, QA-Plan, Qualitätsmetriken,
  strategia di test, piano QA, metriche di qualità

  Do NOT use for: actual code implementation, infrastructure tasks,
  or simple single-file verification (use gap-detector directly).
permissionMode: plan
memory: project
disallowedTools:
  - Write
  - Edit
  - Bash
model: sonnet
tools:
  - Read
  - Glob
  - Grep
  - Task(qa-monitor)
  - Task(gap-detector)
  - Task(code-analyzer)
  - Task(Explore)
  - TodoWrite
skills:
  - pdca
  - zero-script-qa
  - phase-8-review
---
```

#### Agent Body 핵심 내용

```markdown
## QA Strategist Agent

You are a QA Strategist responsible for coordinating all verification and
quality assurance efforts across the team.

### Core Responsibilities

1. **Test Strategy**: Define what to test, how to test, and acceptance criteria
2. **QA Coordination**: Orchestrate qa-monitor, gap-detector, code-analyzer
3. **Quality Metrics**: Define and track Match Rate, code quality score, coverage
4. **Verification Planning**: Create test plans for each PDCA phase
5. **Risk Assessment**: Identify testing gaps and coverage risks

### PDCA Role: Check/Act Phase Strategist

| Phase | Action |
|-------|--------|
| Check | Coordinate gap-detector + code-analyzer + qa-monitor in parallel |
| Act | Analyze results, prioritize fixes, recommend iteration strategy |

### Quality Thresholds

| Metric | Threshold | Action if Below |
|--------|-----------|-----------------|
| Match Rate | 90% | Trigger pdca-iterator |
| Critical Issues | 0 | Block Report phase |
| Code Quality Score | 70/100 | Recommend refactoring |

### Delegation Patterns

- **gap-detector**: Design vs implementation gap analysis
- **code-analyzer**: Code quality, security, architecture compliance
- **qa-monitor**: Docker log-based runtime verification
```

---

## 4. lib/team/ 모듈 확장 상세 설계

### 4.1 신규 모듈: `lib/team/orchestrator.js`

팀 실행/조율의 핵심 엔진. PDCA 단계별로 적절한 오케스트레이션 패턴을 선택하고 팀을 구성한다.

#### 함수 시그니처

```javascript
/**
 * Team Orchestration Engine
 * @module lib/team/orchestrator
 * @version 1.5.1
 */

const { isTeamModeAvailable, getTeamConfig } = require('./coordinator');
const { TEAM_STRATEGIES, getTeammateRoles } = require('./strategy');
const { debugLog } = require('../core/debug');
const { getPdcaStatusFull } = require('../pdca/status');

/**
 * PDCA 단계에 맞는 오케스트레이션 패턴 결정
 * @param {string} phase - 현재 PDCA 단계 ('plan'|'design'|'do'|'check'|'act')
 * @param {string} level - 프로젝트 레벨 ('Starter'|'Dynamic'|'Enterprise')
 * @returns {'leader'|'council'|'swarm'|'pipeline'|'watchdog'}
 */
function selectOrchestrationPattern(phase, level) {
  // phase-pattern 매핑 테이블 사용
}

/**
 * PDCA 단계에 맞는 팀 구성 생성
 * @param {string} phase - PDCA 단계
 * @param {string} level - 프로젝트 레벨
 * @param {string} feature - Feature 이름
 * @returns {Object} { pattern, teammates: [{name, agentType, task, planModeRequired}], phaseStrategy }
 */
function composeTeamForPhase(phase, level, feature) {
  // strategy.js의 TEAM_STRATEGIES 기반 팀 구성
  // phase에 해당하는 역할만 필터링
  // 각 teammate에 task 설명 할당
}

/**
 * 팀 실행 명령 생성 (spawnTeam 호출 데이터)
 * @param {string} phase - PDCA 단계
 * @param {string} level - 프로젝트 레벨
 * @param {string} feature - Feature 이름
 * @returns {Object|null} spawnTeam 호출 데이터 또는 null (Starter/팀 미지원)
 */
function generateSpawnTeamCommand(phase, level, feature) {
  // isTeamModeAvailable() 확인
  // composeTeamForPhase() 호출
  // spawnTeam JSON 구조 생성
}

/**
 * 팀 단계 실행 컨텍스트 생성
 * @param {string} phase - PDCA 단계
 * @param {string} feature - Feature 이름
 * @param {Object} [options] - 추가 옵션
 * @param {string} [options.pattern] - 강제 패턴 지정
 * @returns {Object} { phase, feature, pattern, team, tasks, context }
 */
function createPhaseContext(phase, feature, options = {}) {
  // 전체 실행 컨텍스트 조합
}

/**
 * 단계 전환 시 팀 재구성 필요 여부 판단
 * @param {string} currentPhase - 현재 단계
 * @param {string} nextPhase - 다음 단계
 * @param {string} level - 프로젝트 레벨
 * @returns {boolean}
 */
function shouldRecomposeTeam(currentPhase, nextPhase, level) {
  // 팀 구성이 변경되는 단계 전환인지 판단
}

module.exports = {
  selectOrchestrationPattern,
  composeTeamForPhase,
  generateSpawnTeamCommand,
  createPhaseContext,
  shouldRecomposeTeam,
};
```

#### 오케스트레이션 패턴 매핑 상수

```javascript
/**
 * PDCA 단계별 오케스트레이션 패턴
 * @type {Object<string, Object<string, string>>}
 */
const PHASE_PATTERN_MAP = {
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
```

### 4.2 신규 모듈: `lib/team/communication.js`

팀원 간 메시지 통신을 위한 데이터 구조 생성 모듈. 실제 통신은 Claude Code의 TeammateTool이 수행하며, 이 모듈은 메시지 포맷과 라우팅 로직을 담당한다.

#### 함수 시그니처

```javascript
/**
 * Team Communication Module
 * @module lib/team/communication
 * @version 1.5.1
 */

const { debugLog } = require('../core/debug');

/**
 * Teammate에게 보낼 메시지 구조 생성
 * @param {string} fromRole - 보내는 역할 (예: 'cto')
 * @param {string} toRole - 받는 역할 (예: 'developer')
 * @param {string} messageType - 메시지 유형 ('task_assignment'|'review_request'|'approval'|'rejection'|'info')
 * @param {Object} payload - 메시지 내용
 * @param {string} payload.subject - 메시지 제목
 * @param {string} payload.body - 메시지 본문
 * @param {string} [payload.feature] - 관련 Feature
 * @param {string} [payload.phase] - 관련 PDCA 단계
 * @returns {Object} { from, to, type, payload, timestamp }
 */
function createMessage(fromRole, toRole, messageType, payload) {
  // 메시지 구조 생성 + 검증
}

/**
 * 전체 팀 브로드캐스트 메시지 생성
 * @param {string} fromRole - 보내는 역할
 * @param {string} messageType - 메시지 유형
 * @param {Object} payload - 메시지 내용
 * @returns {Object} { from, to: 'all', type, payload, timestamp }
 */
function createBroadcast(fromRole, messageType, payload) {
  // 브로드캐스트 메시지 생성
}

/**
 * PDCA 단계 전환 알림 메시지 생성
 * @param {string} feature - Feature 이름
 * @param {string} fromPhase - 이전 단계
 * @param {string} toPhase - 다음 단계
 * @param {Object} [context] - 추가 컨텍스트 (matchRate, issues 등)
 * @returns {Object} 브로드캐스트 메시지
 */
function createPhaseTransitionNotice(feature, fromPhase, toPhase, context = {}) {
  // 단계 전환 공지 생성
}

/**
 * Plan 승인/거부 메시지 생성
 * @param {string} teammateRole - Plan을 제출한 역할
 * @param {boolean} approved - 승인 여부
 * @param {string} [feedback] - 피드백 메시지
 * @returns {Object} 승인/거부 메시지
 */
function createPlanDecision(teammateRole, approved, feedback) {
  // Plan 결정 메시지 생성
}

/**
 * CTO 지시 메시지 포맷 생성
 * @param {string} toRole - 대상 역할
 * @param {string} directive - 지시 내용
 * @param {Object} [context] - 관련 문서, 참조 등
 * @returns {Object} 지시 메시지
 */
function createDirective(toRole, directive, context = {}) {
  // CTO 지시 포맷
}

module.exports = {
  createMessage,
  createBroadcast,
  createPhaseTransitionNotice,
  createPlanDecision,
  createDirective,
};
```

### 4.3 신규 모듈: `lib/team/task-queue.js`

PDCA 단계별 팀 작업을 Task System과 연동하여 관리하는 모듈.

#### 함수 시그니처

```javascript
/**
 * Team Task Queue Module
 * @module lib/team/task-queue
 * @version 1.5.1
 */

const { generatePdcaTaskSubject, generatePdcaTaskDescription, getPdcaTaskMetadata } = require('../task/creator');
const { savePdcaTaskId } = require('../task/tracker');
const { debugLog } = require('../core/debug');

/**
 * PDCA 단계별 팀 작업 목록 생성
 * @param {string} phase - PDCA 단계
 * @param {string} feature - Feature 이름
 * @param {Array<Object>} teammates - composeTeamForPhase()의 teammates 배열
 * @returns {Array<Object>} 각 teammate별 task 정의
 *   [{role, subject, description, metadata, dependencies}]
 */
function createTeamTasks(phase, feature, teammates) {
  // 각 teammate에 대한 task 생성
  // Task Subject 포맷: "[Phase] feature - role task"
}

/**
 * Task를 특정 역할에 할당
 * @param {string} taskId - Task ID
 * @param {string} role - 할당 대상 역할
 * @param {string} feature - Feature 이름
 * @param {string} phase - PDCA 단계
 * @returns {Object} { taskId, role, feature, phase, assignedAt }
 */
function assignTaskToRole(taskId, role, feature, phase) {
  // task-role 매핑 저장
}

/**
 * 팀 전체 진행 상태 추적
 * @param {string} feature - Feature 이름
 * @param {string} phase - PDCA 단계
 * @returns {Object} { total, completed, inProgress, pending, completionRate }
 */
function getTeamProgress(feature, phase) {
  // 팀 전체 진행률 계산
}

/**
 * 다음 가용 작업 찾기 (idle teammate용)
 * @param {string} role - Idle 상태인 역할
 * @param {string} feature - Feature 이름
 * @returns {Object|null} 다음 작업 또는 null
 */
function findNextAvailableTask(role, feature) {
  // role에 할당 가능한 pending 작업 검색
}

/**
 * 단계 완료 여부 확인
 * @param {string} feature - Feature 이름
 * @param {string} phase - PDCA 단계
 * @returns {boolean}
 */
function isPhaseComplete(feature, phase) {
  // 해당 단계의 모든 task가 completed인지 확인
}

module.exports = {
  createTeamTasks,
  assignTaskToRole,
  getTeamProgress,
  findNextAvailableTask,
  isPhaseComplete,
};
```

### 4.4 신규 모듈: `lib/team/cto-logic.js`

CTO 에이전트의 의사결정 로직을 담당하는 모듈. 에이전트 body에서 참조하는 핵심 판단 기준을 코드로 구현한다.

#### 함수 시그니처

```javascript
/**
 * CTO Decision Logic Module
 * @module lib/team/cto-logic
 * @version 1.5.1
 */

const { getPdcaStatusFull, getFeatureStatus } = require('../pdca/status');
const { getNextPdcaPhase, validatePdcaTransition, findDesignDoc, findPlanDoc } = require('../pdca/phase');
const { detectLevel } = require('../pdca/level');
const { debugLog } = require('../core/debug');

/**
 * 현재 상태 기반 다음 PDCA 단계 결정
 * @param {string} feature - Feature 이름
 * @returns {Object} { currentPhase, nextPhase, readyToAdvance, blockers: string[] }
 */
function decidePdcaPhase(feature) {
  // 현재 단계 확인
  // 단계 전환 가능 조건 검증 (deliverables 존재 여부)
  // blocker 목록 반환
}

/**
 * Plan/Design 문서 품질 평가
 * @param {string} feature - Feature 이름
 * @param {string} docType - 'plan' | 'design'
 * @returns {Object} { exists, path, hasRequiredSections, score, issues: string[] }
 */
function evaluateDocument(feature, docType) {
  // 문서 존재 확인
  // 필수 섹션 존재 확인 (간이 검증)
}

/**
 * Check 단계 결과 기반 진행 방향 결정
 * @param {number} matchRate - Match Rate (0-100)
 * @param {number} criticalIssues - Critical 이슈 수
 * @param {number} qualityScore - 코드 품질 점수 (0-100)
 * @returns {Object} { decision: 'report'|'iterate'|'redesign', reason, nextAction }
 */
function evaluateCheckResults(matchRate, criticalIssues, qualityScore) {
  // matchRate >= 90 && criticalIssues === 0 → report
  // matchRate >= 70 → iterate
  // matchRate < 70 → redesign
}

/**
 * 팀원별 적절한 에이전트 선택
 * @param {string} role - 역할명
 * @param {string} phase - PDCA 단계
 * @param {string} level - 프로젝트 레벨
 * @returns {string[]} 해당 역할에 매핑된 에이전트 이름 배열
 */
function selectAgentsForRole(role, phase, level) {
  // strategy.js의 roles 기반 에이전트 매핑
}

/**
 * 팀 구성 권고안 생성
 * @param {string} feature - Feature 이름
 * @param {string} phase - PDCA 단계
 * @returns {Object} { level, pattern, teammates: [], reasoning }
 */
function recommendTeamComposition(feature, phase) {
  // 자동 레벨 감지 + 단계별 패턴 적용
  // 권고 이유 포함
}

module.exports = {
  decidePdcaPhase,
  evaluateDocument,
  evaluateCheckResults,
  selectAgentsForRole,
  recommendTeamComposition,
};
```

---

## 5. 기존 모듈 수정 상세 설계

### 5.1 `lib/team/strategy.js` 수정

#### 변경 전 (현재)

```javascript
const TEAM_STRATEGIES = {
  Starter: null,
  Dynamic: {
    teammates: 2,
    roles: [
      { name: 'developer', agents: ['bkend-expert'], phases: ['do', 'act'] },
      { name: 'qa', agents: ['qa-monitor', 'gap-detector'], phases: ['check'] },
    ],
    phaseStrategy: { plan: 'single', design: 'single', do: 'parallel', check: 'parallel', act: 'parallel' },
  },
  Enterprise: {
    teammates: 4,
    roles: [
      { name: 'architect', agents: ['enterprise-expert', 'infra-architect'], phases: ['design'] },
      { name: 'developer', agents: ['bkend-expert'], phases: ['do', 'act'] },
      { name: 'qa', agents: ['qa-monitor', 'gap-detector'], phases: ['check'] },
      { name: 'reviewer', agents: ['code-analyzer', 'design-validator'], phases: ['check', 'act'] },
    ],
    phaseStrategy: { plan: 'single', design: 'parallel', do: 'parallel', check: 'parallel', act: 'parallel' },
  },
};
```

#### 변경 후 (목표)

```javascript
const TEAM_STRATEGIES = {
  Starter: null,

  Dynamic: {
    teammates: 3,
    ctoAgent: 'cto-lead',
    roles: [
      {
        name: 'developer',
        description: 'Backend implementation and coding',
        agents: ['bkend-expert'],
        phases: ['do', 'act'],
      },
      {
        name: 'frontend',
        description: 'UI architecture and component implementation',
        agents: ['frontend-architect'],
        phases: ['design', 'do'],
      },
      {
        name: 'qa',
        description: 'Testing and gap analysis',
        agents: ['qa-monitor', 'gap-detector'],
        phases: ['check'],
      },
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'single',
      do: 'parallel',
      check: 'parallel',
      act: 'parallel',
    },
  },

  Enterprise: {
    teammates: 5,
    ctoAgent: 'cto-lead',
    roles: [
      {
        name: 'architect',
        description: 'System architecture and infrastructure design',
        agents: ['enterprise-expert', 'infra-architect'],
        phases: ['design'],
      },
      {
        name: 'developer',
        description: 'Backend and frontend implementation',
        agents: ['bkend-expert', 'frontend-architect'],
        phases: ['do', 'act'],
      },
      {
        name: 'qa',
        description: 'Quality strategy and verification',
        agents: ['qa-strategist', 'qa-monitor', 'gap-detector'],
        phases: ['check'],
      },
      {
        name: 'reviewer',
        description: 'Code review and design validation',
        agents: ['code-analyzer', 'design-validator'],
        phases: ['check', 'act'],
      },
      {
        name: 'security',
        description: 'Security architecture and vulnerability analysis',
        agents: ['security-architect'],
        phases: ['design', 'check'],
      },
    ],
    phaseStrategy: {
      plan: 'single',
      design: 'council',
      do: 'swarm',
      check: 'council',
      act: 'watchdog',
    },
  },
};
```

#### 변경 요약

| 항목 | 변경 전 | 변경 후 |
|------|--------|--------|
| Dynamic.teammates | 2 | 3 |
| Dynamic.roles | developer, qa | developer, frontend, qa |
| Dynamic.ctoAgent | 없음 | `'cto-lead'` |
| Enterprise.teammates | 4 | 5 |
| Enterprise.roles | 4개 | 5개 (+security) |
| Enterprise.ctoAgent | 없음 | `'cto-lead'` |
| Enterprise.phaseStrategy | 모두 single/parallel | council, swarm, watchdog 패턴 추가 |
| Enterprise.developer.agents | `['bkend-expert']` | `['bkend-expert', 'frontend-architect']` |
| Enterprise.qa.agents | `['qa-monitor', 'gap-detector']` | `['qa-strategist', 'qa-monitor', 'gap-detector']` |

### 5.2 `lib/team/hooks.js` 수정

#### `assignNextTeammateWork()` 변경

```javascript
// 변경 전: 데이터만 반환
function assignNextTeammateWork(completedPhase, feature, level) {
  if (!isTeamModeAvailable()) return null;
  // ... 데이터 반환만
  return { nextPhase, mode, roles, feature };
}

// 변경 후: orchestrator 연동하여 실행 컨텍스트 생성
function assignNextTeammateWork(completedPhase, feature, level) {
  if (!isTeamModeAvailable()) return null;

  const { shouldRecomposeTeam, composeTeamForPhase, createPhaseContext } = require('./orchestrator');
  const { createPhaseTransitionNotice } = require('./communication');
  const { createTeamTasks } = require('./task-queue');

  const nextPhaseMap = { plan: 'design', design: 'do', do: 'check', check: 'act', act: 'check' };
  const nextPhase = nextPhaseMap[completedPhase];
  if (!nextPhase) return null;

  const needsRecompose = shouldRecomposeTeam(completedPhase, nextPhase, level);
  const team = composeTeamForPhase(nextPhase, level, feature);
  if (!team || !team.teammates || team.teammates.length === 0) return null;

  const tasks = createTeamTasks(nextPhase, feature, team.teammates);
  const notice = createPhaseTransitionNotice(feature, completedPhase, nextPhase);
  const context = createPhaseContext(nextPhase, feature);

  return {
    nextPhase,
    team,
    tasks,
    notice,
    context,
    needsRecompose,
  };
}
```

#### `handleTeammateIdle()` 변경

```javascript
// 변경 전: 정적 제안만
function handleTeammateIdle(teammateId, pdcaStatus) {
  // ... 정적 메시지 반환
  return { teammateId, suggestion: "Check TaskList..." };
}

// 변경 후: task-queue에서 실제 다음 작업 검색
function handleTeammateIdle(teammateId, pdcaStatus) {
  if (!isTeamModeAvailable()) return null;
  if (!pdcaStatus?.primaryFeature) return null;

  const { findNextAvailableTask } = require('./task-queue');
  const feature = pdcaStatus.primaryFeature;
  const featureData = pdcaStatus.features?.[feature];
  if (!featureData) return null;

  const nextTask = findNextAvailableTask(teammateId, feature);

  return {
    teammateId,
    feature,
    currentPhase: featureData.phase,
    nextTask,
    suggestion: nextTask
      ? `Assigned task: ${nextTask.subject}`
      : `No pending tasks. Wait for phase transition or check TaskList.`,
  };
}
```

### 5.3 `lib/team/index.js` 수정

```javascript
// 변경 후: 신규 모듈 4종 export 추가
const coordinator = require('./coordinator');
const strategy = require('./strategy');
const hooks = require('./hooks');
const orchestrator = require('./orchestrator');
const communication = require('./communication');
const taskQueue = require('./task-queue');
const ctoLogic = require('./cto-logic');

module.exports = {
  // coordinator (기존 4)
  isTeamModeAvailable: coordinator.isTeamModeAvailable,
  getTeamConfig: coordinator.getTeamConfig,
  generateTeamStrategy: coordinator.generateTeamStrategy,
  formatTeamStatus: coordinator.formatTeamStatus,

  // strategy (기존 2)
  TEAM_STRATEGIES: strategy.TEAM_STRATEGIES,
  getTeammateRoles: strategy.getTeammateRoles,

  // hooks (기존 2)
  assignNextTeammateWork: hooks.assignNextTeammateWork,
  handleTeammateIdle: hooks.handleTeammateIdle,

  // orchestrator (신규 5)
  selectOrchestrationPattern: orchestrator.selectOrchestrationPattern,
  composeTeamForPhase: orchestrator.composeTeamForPhase,
  generateSpawnTeamCommand: orchestrator.generateSpawnTeamCommand,
  createPhaseContext: orchestrator.createPhaseContext,
  shouldRecomposeTeam: orchestrator.shouldRecomposeTeam,

  // communication (신규 5)
  createMessage: communication.createMessage,
  createBroadcast: communication.createBroadcast,
  createPhaseTransitionNotice: communication.createPhaseTransitionNotice,
  createPlanDecision: communication.createPlanDecision,
  createDirective: communication.createDirective,

  // task-queue (신규 5)
  createTeamTasks: taskQueue.createTeamTasks,
  assignTaskToRole: taskQueue.assignTaskToRole,
  getTeamProgress: taskQueue.getTeamProgress,
  findNextAvailableTask: taskQueue.findNextAvailableTask,
  isPhaseComplete: taskQueue.isPhaseComplete,

  // cto-logic (신규 5)
  decidePdcaPhase: ctoLogic.decidePdcaPhase,
  evaluateDocument: ctoLogic.evaluateDocument,
  evaluateCheckResults: ctoLogic.evaluateCheckResults,
  selectAgentsForRole: ctoLogic.selectAgentsForRole,
  recommendTeamComposition: ctoLogic.recommendTeamComposition,
};
```

**Export 수 변경**: 6 → 28 (+22)

---

## 6. 스크립트 수정 상세 설계

### 6.1 `scripts/pdca-task-completed.js` 수정

#### 변경 내용

현재 `autoAdvancePdcaPhase()`만 호출하는 로직에 orchestrator 연동을 추가한다.

```javascript
// 추가되는 로직 (기존 autoAdvancePdcaPhase 호출 이후)

// Team Mode에서 단계 전환 시 팀 재구성
let teamModule = null;
try {
  teamModule = require('../lib/team');
} catch (e) {
  // Graceful degradation
}

if (teamModule && teamModule.isTeamModeAvailable()) {
  const assignment = teamModule.assignNextTeammateWork(detectedPhase, featureName, level);
  if (assignment) {
    debugLog('TaskCompleted', 'Team assignment generated', {
      nextPhase: assignment.nextPhase,
      teammateCount: assignment.team?.teammates?.length || 0,
      needsRecompose: assignment.needsRecompose,
    });

    // hookSpecificOutput에 팀 컨텍스트 추가
    response.hookSpecificOutput.teamAssignment = {
      nextPhase: assignment.nextPhase,
      pattern: assignment.team?.pattern,
      teammates: assignment.team?.teammates?.map(t => t.name) || [],
      notice: assignment.notice,
    };
  }
}
```

### 6.2 `scripts/team-idle-handler.js` 수정

#### 변경 내용

정적 제안 대신 `handleTeammateIdle()`의 실제 결과를 사용한다.

```javascript
// 변경 전: 정적 메시지
const response = {
  hookSpecificOutput: {
    hookEventName: 'TeammateIdle',
    teammateId: teammateId,
    additionalContext: '## Teammate Idle\nCheck TaskList...\n',
  },
};

// 변경 후: task-queue 연동
const idleResult = teamModule.handleTeammateIdle(teammateId, pdcaStatus);

const response = {
  hookSpecificOutput: {
    hookEventName: 'TeammateIdle',
    teammateId: teammateId,
    nextTask: idleResult?.nextTask || null,
    additionalContext: idleResult?.nextTask
      ? `## Teammate Work Assignment\nAssigned: ${idleResult.nextTask.subject}\nFeature: ${idleResult.feature}\nPhase: ${idleResult.currentPhase}\n`
      : `## Teammate Idle\nNo pending tasks for ${teammateId}.\nWaiting for phase transition.\n`,
  },
};
```

### 6.3 `scripts/unified-stop.js` 수정

#### AGENT_HANDLERS에 cto-lead 추가

```javascript
// 변경 전
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js',
  'team-coordinator': './team-stop.js',
};

// 변경 후
const AGENT_HANDLERS = {
  'gap-detector': './gap-detector-stop.js',
  'pdca-iterator': './iterator-stop.js',
  'code-analyzer': './analysis-stop.js',
  'qa-monitor': './qa-stop.js',
  'team-coordinator': './team-stop.js',
  'cto-lead': './cto-stop.js',
};
```

### 6.4 신규 스크립트: `scripts/cto-stop.js`

```javascript
/**
 * CTO Lead Agent Stop Handler
 * @module scripts/cto-stop
 * @version 1.5.1
 *
 * CTO 에이전트 세션 종료 시:
 * 1. 현재 팀 상태 저장
 * 2. 미완료 task 목록 기록
 * 3. PDCA history에 팀 세션 종료 기록
 */

const { debugLog, outputAllow, getPdcaStatusFull, addPdcaHistory } = require('../lib/common');

function run(context) {
  debugLog('CTOStop', 'CTO session cleanup started');

  const pdcaStatus = getPdcaStatusFull();
  const feature = pdcaStatus?.primaryFeature;

  if (feature) {
    // 팀 진행 상태 저장
    let teamModule = null;
    try {
      teamModule = require('../lib/team');
    } catch (e) { /* graceful */ }

    if (teamModule) {
      const progress = teamModule.getTeamProgress(feature, pdcaStatus.features?.[feature]?.phase);
      addPdcaHistory({
        action: 'cto_session_ended',
        feature,
        phase: pdcaStatus.features?.[feature]?.phase,
        teamProgress: progress,
      });
    }
  }

  outputAllow('CTO session ended. Team state saved for next session.');
  debugLog('CTOStop', 'CTO session cleanup completed');
}

module.exports = { run };
```

---

## 7. 설정 파일 수정 상세 설계

### 7.1 `bkit.config.json` 수정

#### team 섹션 변경

```json
{
  "team": {
    "enabled": false,
    "displayMode": "in-process",
    "maxTeammates": 5,
    "delegateMode": false,
    "ctoAgent": "cto-lead",
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 3 },
      "Enterprise": { "maxTeammates": 5 }
    },
    "orchestrationPatterns": {
      "Dynamic": {
        "plan": "leader",
        "design": "leader",
        "do": "swarm",
        "check": "council",
        "act": "leader"
      },
      "Enterprise": {
        "plan": "leader",
        "design": "council",
        "do": "swarm",
        "check": "council",
        "act": "watchdog"
      }
    }
  }
}
```

#### agents 섹션 변경

```json
{
  "agents": {
    "levelBased": {
      "Starter": "starter-guide",
      "Dynamic": "bkend-expert",
      "Enterprise": "enterprise-expert"
    },
    "taskBased": {
      "code review": "code-analyzer",
      "security scan": "security-architect",
      "security review": "security-architect",
      "design review": "design-validator",
      "spec check": "design-validator",
      "gap analysis": "gap-detector",
      "report": "report-generator",
      "summary": "report-generator",
      "QA": "qa-strategist",
      "test strategy": "qa-strategist",
      "log analysis": "qa-monitor",
      "pipeline": "pipeline-guide",
      "requirements": "product-manager",
      "feature spec": "product-manager",
      "frontend": "frontend-architect",
      "UI architecture": "frontend-architect",
      "team": "cto-lead",
      "project lead": "cto-lead"
    }
  }
}
```

---

## 8. PDCA 단계별 팀 동작 시나리오

### 8.1 Enterprise Level: 로그인 기능 개발 시나리오

```
[Plan 단계] pattern: leader
┌─────────────────────────────────────────────────────────────────┐
│ CTO (cto-lead, opus)                                           │
│  → "요구사항을 분석합니다"                                       │
│  → product-manager에게 Task 지시                                │
│                                                                 │
│ Product Manager (product-manager, sonnet)                       │
│  → 사용자 요구사항 분석                                          │
│  → Plan 문서 작성: docs/01-plan/features/login.plan.md          │
│  → submitPlan → CTO 승인                                       │
│                                                                 │
│ CTO 확인:                                                       │
│  → evaluateDocument('login', 'plan') → score 확인               │
│  → approvePlan 또는 rejectPlan                                  │
└─────────────────────────────────────────────────────────────────┘

[Design 단계] pattern: council
┌─────────────────────────────────────────────────────────────────┐
│ CTO: "설계를 시작합니다" → 3명에게 병렬 지시                      │
│                                                                 │
│ Architect (enterprise-expert, opus)                              │
│  → 시스템 아키텍처, API 설계                                     │
│                                                                 │
│ Frontend (frontend-architect, sonnet)                            │
│  → UI 컴포넌트 구조, 상태 관리 설계                               │
│                                                                 │
│ Security (security-architect, opus)                              │
│  → 인증 보안 아키텍처, JWT/OAuth 검토                             │
│                                                                 │
│ CTO 종합:                                                       │
│  → 3명의 설계 결과를 Design 문서로 통합                           │
│  → docs/02-design/features/login.design.md                      │
└─────────────────────────────────────────────────────────────────┘

[Do 단계] pattern: swarm
┌─────────────────────────────────────────────────────────────────┐
│ CTO: "구현을 시작합니다" → 2명에게 병렬 지시                      │
│                                                                 │
│ Developer (bkend-expert, sonnet)                                │
│  → API 엔드포인트 구현, 인증 로직                                │
│                                                                 │
│ Frontend (frontend-architect, sonnet)                            │
│  → 로그인 UI, 인증 상태 관리                                     │
│                                                                 │
│ 각 teammate → Plan 제출 → CTO 승인 → 구현 실행                   │
└─────────────────────────────────────────────────────────────────┘

[Check 단계] pattern: council
┌─────────────────────────────────────────────────────────────────┐
│ CTO: "검증합니다" → 4명에게 병렬 지시                             │
│                                                                 │
│ QA Strategist (qa-strategist, sonnet)                           │
│  → 테스트 전략 수립, 전체 검증 조율                               │
│                                                                 │
│ Gap Detector (gap-detector, opus)                               │
│  → Design 문서 vs 구현 코드 매칭 분석                             │
│                                                                 │
│ Code Analyzer (code-analyzer, opus)                              │
│  → 코드 품질, 아키텍처 준수 검증                                  │
│                                                                 │
│ Security (security-architect, opus)                              │
│  → OWASP Top 10 보안 검증                                       │
│                                                                 │
│ CTO 종합:                                                       │
│  → evaluateCheckResults(matchRate, criticalIssues, qualityScore) │
│  → 결정: report (≥90%) | iterate (<90%) | redesign (<70%)       │
└─────────────────────────────────────────────────────────────────┘

[Act 단계] pattern: watchdog
┌─────────────────────────────────────────────────────────────────┐
│ matchRate < 90% → CTO 결정: iterate                             │
│                                                                 │
│ PDCA Iterator (pdca-iterator, sonnet)                           │
│  → gap-detector 결과 기반 자동 수정                               │
│  → 최대 5회 반복                                                 │
│                                                                 │
│ QA Monitor (qa-monitor, haiku)  [watchdog 역할]                  │
│  → 수정 후 실시간 로그 모니터링                                   │
│                                                                 │
│ matchRate >= 90% → CTO 결정: report                              │
│  → Report Generator (report-generator, haiku) → 완료 보고서      │
└─────────────────────────────────────────────────────────────────┘
```

### 8.2 Dynamic Level 시나리오

```
[Plan] single → CTO + product-manager
[Design] single → CTO + frontend-architect (UI 중심)
[Do] swarm → developer(bkend-expert) + frontend(frontend-architect) 병렬
[Check] council → qa(qa-monitor, gap-detector) + CTO 종합
[Act] leader → CTO 결정 → pdca-iterator 또는 report-generator
```

---

## 9. 에이전트 간 통신 프로토콜

### 9.1 메시지 타입 정의

| 타입 | 방향 | 용도 |
|------|------|------|
| `task_assignment` | CTO → Teammate | 작업 할당 |
| `review_request` | Teammate → CTO | Plan/결과물 검토 요청 |
| `approval` | CTO → Teammate | Plan 승인 |
| `rejection` | CTO → Teammate | Plan 거부 (수정 지시) |
| `phase_transition` | CTO → All (broadcast) | 단계 전환 공지 |
| `status_update` | Teammate → CTO | 진행 상태 보고 |
| `directive` | CTO → Teammate | 일반 지시 |

### 9.2 메시지 구조

```javascript
{
  from: 'cto',             // 보내는 역할
  to: 'developer',         // 받는 역할 또는 'all'
  type: 'task_assignment',  // 메시지 타입
  payload: {
    subject: 'API 엔드포인트 구현',
    body: 'Design 문서 Section 4 기반으로 인증 API 구현',
    feature: 'login',
    phase: 'do',
    references: ['docs/02-design/features/login.design.md'],
  },
  timestamp: '2026-02-06T10:00:00.000Z',
}
```

---

## 10. 구현 순서

### Phase 1: Foundation (먼저 구현)

| 순서 | 파일 | 의존성 | 설명 |
|:----:|------|--------|------|
| 1 | `lib/team/communication.js` | lib/core/debug | 의존성 없는 순수 데이터 모듈 |
| 2 | `lib/team/task-queue.js` | lib/task/creator, tracker | Task System 연동 |
| 3 | `lib/team/cto-logic.js` | lib/pdca/status, phase, level | PDCA 연동 의사결정 |
| 4 | `lib/team/orchestrator.js` | coordinator, strategy, communication, task-queue | 조율 엔진 |
| 5 | `lib/team/strategy.js` | (수정) | 신규 역할/패턴 추가 |
| 6 | `lib/team/hooks.js` | (수정) orchestrator, communication, task-queue | 실행 로직 연동 |
| 7 | `lib/team/index.js` | (수정) | 전체 export 확장 |
| 8 | `lib/common.js` | (수정) | bridge export 추가 |

### Phase 2: Agents (Foundation 이후)

| 순서 | 파일 | 설명 |
|:----:|------|------|
| 9 | `agents/cto-lead.md` | CTO Lead 에이전트 (최우선) |
| 10 | `agents/product-manager.md` | PM 에이전트 |
| 11 | `agents/frontend-architect.md` | Frontend 에이전트 |
| 12 | `agents/security-architect.md` | Security 에이전트 |
| 13 | `agents/qa-strategist.md` | QA Strategist 에이전트 |

### Phase 3: Integration (Agents 이후)

| 순서 | 파일 | 설명 |
|:----:|------|------|
| 14 | `scripts/cto-stop.js` | CTO 종료 핸들러 |
| 15 | `scripts/pdca-task-completed.js` | (수정) orchestrator 연동 |
| 16 | `scripts/team-idle-handler.js` | (수정) task-queue 연동 |
| 17 | `scripts/unified-stop.js` | (수정) cto-lead 핸들러 등록 |
| 18 | `bkit.config.json` | (수정) team/agents 섹션 확장 |
| 19 | `.claude-plugin/plugin.json` | (수정) description 업데이트 |

---

## 11. 검증 기준

### 11.1 기능 검증 체크리스트

| 번호 | 검증 항목 | 검증 방법 | 통과 기준 |
|:----:|---------|----------|----------|
| V-01 | CTO 에이전트 트리거 | "팀 구성해줘" 입력 | cto-lead 에이전트 활성화 |
| V-02 | Product Manager 트리거 | "요구사항 정리해줘" 입력 | product-manager 활성화 |
| V-03 | Frontend Architect 트리거 | "UI 아키텍처 설계해줘" 입력 | frontend-architect 활성화 |
| V-04 | Security Architect 트리거 | "보안 검토해줘" 입력 | security-architect 활성화 |
| V-05 | QA Strategist 트리거 | "테스트 전략 수립해줘" 입력 | qa-strategist 활성화 |
| V-06 | 팀 구성 (Dynamic) | Dynamic 레벨 + Team Mode | 3 teammates 생성 |
| V-07 | 팀 구성 (Enterprise) | Enterprise 레벨 + Team Mode | 5 teammates 생성 |
| V-08 | 오케스트레이션 패턴 | Enterprise Design 단계 | council 패턴 적용 |
| V-09 | 단계 전환 자동화 | Plan 완료 시 | Design 단계 자동 전환 + 팀 재구성 |
| V-10 | Idle 처리 | Teammate idle 이벤트 | 다음 작업 할당 |
| V-11 | CTO Stop | CTO 세션 종료 | 팀 상태 저장 |
| V-12 | Graceful Degradation | AGENT_TEAMS=0 | 기존 단독 모드 정상 동작 |
| V-13 | Starter 레벨 | Starter 프로젝트 | 팀 모드 비활성화, 단독 동작 |
| V-14 | strategy.js 역할 | `getTeammateRoles('Enterprise')` | 5개 역할 반환 |
| V-15 | index.js exports | `require('lib/team')` | 28개 export 확인 |
| V-16 | lib/common.js bridge | `require('lib/common')` | team 신규 함수 접근 가능 |
| V-17 | evaluateCheckResults | matchRate=85, critical=0 | decision='iterate' 반환 |
| V-18 | evaluateCheckResults | matchRate=95, critical=0 | decision='report' 반환 |
| V-19 | evaluateCheckResults | matchRate=60, critical=2 | decision='redesign' 반환 |

### 11.2 호환성 검증

| 번호 | 검증 항목 | 통과 기준 |
|:----:|---------|----------|
| C-01 | 기존 11개 에이전트 | 모든 기존 에이전트 정상 동작 |
| C-02 | 기존 21개 Skills | 모든 스킬 정상 트리거 |
| C-03 | 기존 Hook 이벤트 8종 | 모든 훅 정상 실행 |
| C-04 | PDCA 워크플로우 | 단독 모드 PDCA 사이클 정상 |
| C-05 | bkit.config.json | 기존 설정 키 호환 유지 |
| C-06 | Agent Teams 미활성화 | 모든 신규 코드 graceful skip |

---

## 12. 리스크 및 완화 전략

| 리스크 | 영향도 | 완화 전략 |
|--------|:------:|----------|
| Agent Teams Research Preview API 변경 | 🔴 | orchestrator.js에 추상화 계층으로 API 변경 흡수 |
| ~7x 토큰 비용 | 🟡 | Dynamic=3, Enterprise=5로 제한, haiku 적극 활용 |
| 5분 heartbeat timeout | 🟡 | task-queue로 작업 단위 분할, createTeamTasks()에서 적절한 크기 보장 |
| Plan Mode 제약 (teammate) | 🟡 | CTO가 실행, Teammate는 설계/분석 전담 |
| 에이전트 16개 복잡도 | 🟡 | CTO가 자동 조율, 사용자는 CTO만 인식 |
| 기존 에이전트와 역할 충돌 | 🟢 | 명확한 계층 구조 (Section 2.2) + taskBased 매핑으로 분리 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 설계 — 분석 보고서 기반 상세 설계 | bkit PDCA Team |
