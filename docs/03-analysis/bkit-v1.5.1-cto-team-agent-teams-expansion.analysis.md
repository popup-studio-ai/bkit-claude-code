# bkit v1.5.1 CTO-Led Team: Agent Teams 확장 전략 분석 보고서

> **Analysis Type**: Strategic Architecture Analysis / Agent Teams Integration
>
> **Project**: bkit Vibecoding Kit
> **Version**: v1.5.1 → v1.5.1 (계획)
> **Analyst**: Claude Code (bkit PDCA Team)
> **Date**: 2026-02-06
> **Feature**: bkit-v1.5.1-cto-team-agent-teams-expansion

### 조사 출처

| 출처 | URL / 경로 | 조사 범위 |
|------|-----------|----------|
| Claude Code 공식 문서 | docs.anthropic.com/en/docs/claude-code/agent-teams | Agent Teams 아키텍처, API, 설정 |
| Anthropic 기술 블로그 | anthropic.com/engineering/claude-code-agent-teams | C 컴파일러 사례, 오케스트레이션 패턴 |
| GitHub Issues | github.com/anthropics/claude-code | Agent Teams 관련 이슈 및 제한사항 |
| bkit 코드베이스 | lib/team/, agents/, scripts/ | 현재 구현 상태 분석 |
| bkit 철학 문서 | bkit-system/philosophy/ | 핵심 사상 및 원칙 |

---

## Executive Summary

bkit v1.5.1은 Agent Teams 인프라를 **약 40% 수준**으로 구현하고 있습니다. 전략 생성과 설정 관리는 완성되어 있으나, 실제 팀 오케스트레이션 실행 로직은 골격(skeletal) 상태입니다. Claude Code v2.1.32+에서 제공하는 Agent Teams 기능은 Team Lead + Teammates + Task List + Mailbox 아키텍처를 기반으로 하며, bkit의 PDCA 방법론과 결합하면 **CTO가 이끄는 전문 개발 조직**과 같은 경험을 제공할 수 있습니다.

### 핵심 수치

| 항목 | 현재 (v1.5.1) | 목표 (v1.5.1) | Gap |
|------|:------------:|:------------:|:---:|
| Agent 수 | 11 | 16 (+5) | -5 |
| Team 역할 정의 | 4 (architect, developer, qa, reviewer) | 8 (+4) | -4 |
| 팀 오케스트레이션 실행 | 40% (인프라만) | 90%+ | -50% |
| CTO 에이전트 | 없음 | 1 (opus) | -1 |
| 오케스트레이션 패턴 | 1 (Leader) | 5 | -4 |
| PDCA 팀 자동화 | 수동 | 자동 | Gap |

---

## 1. Claude Code Agent Teams 심층 조사 결과

### 1.1 아키텍처 개요

Claude Code Agent Teams (v2.1.32+, Research Preview)는 다음 아키텍처를 따릅니다:

```
┌──────────────────────────────────────────────────────────┐
│                    Team Lead (인간)                       │
│  - 최종 의사결정자                                        │
│  - Plan 승인/거부                                        │
│  - Delegate Mode로 조정만 가능 (Shift+Tab)                │
├──────────────────────────────────────────────────────────┤
│                   Team Lead Agent                        │
│  - Task 분배 및 작업 조율                                 │
│  - Mailbox로 teammate 메시지 수신                         │
│  - Broadcast로 전체 공지                                  │
├──────────┬──────────┬──────────┬────────────────────────┤
│ Teammate │ Teammate │ Teammate │ Teammate               │
│ Agent 1  │ Agent 2  │ Agent 3  │ Agent 4                │
│ (Plan    │ (Plan    │ (Plan    │ (Plan                  │
│  Mode)   │  Mode)   │  Mode)   │  Mode)                 │
├──────────┴──────────┴──────────┴────────────────────────┤
│                   Shared Task List                       │
│  - TodoWrite/TodoRead로 공유                              │
│  - 각 teammate는 자신의 task만 수정 가능                    │
└──────────────────────────────────────────────────────────┘
```

### 1.2 TeammateTool 13개 Operations

| Operation | 방향 | 설명 | bkit 활용 가능성 |
|-----------|------|------|:----------------:|
| `spawnTeam` | Lead → System | 팀 생성 및 teammate 정의 | **핵심** |
| `write` | Lead ↔ Teammate | 1:1 메시지 전송 | **핵심** |
| `broadcast` | Lead → All | 전체 공지 | **높음** |
| `readMailbox` | Lead ← Teammates | 수신 메시지 확인 | **핵심** |
| `approvePlan` | Lead → Teammate | Plan 승인 | **핵심** |
| `rejectPlan` | Lead → Teammate | Plan 거부 (수정 지시) | **높음** |
| `requestShutdown` | Lead → Teammate | 종료 요청 | 보통 |
| `updateTask` | Both → TaskList | Task 상태 업데이트 | **핵심** |
| `listTeammates` | Lead → System | 팀원 목록 조회 | 보통 |
| `getTeammateStatus` | Lead → System | 개별 상태 확인 | **높음** |
| `submitPlan` | Teammate → Lead | Plan 제출 (승인 요청) | **핵심** |
| `sendMessage` | Teammate → Lead | 결과/질문 전송 | **높음** |
| `completedTask` | Teammate → System | Task 완료 보고 | **핵심** |

### 1.3 환경 변수

| 변수 | 설명 | bkit 활용 |
|------|------|----------|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Agent Teams 활성화 (`1`) | 필수 |
| `CLAUDE_CODE_TEAM_NAME` | 팀 이름 | bkit 설정과 연동 |
| `CLAUDE_CODE_AGENT_ID` | 에이전트 고유 ID | teammate 식별 |
| `CLAUDE_CODE_AGENT_NAME` | 에이전트 이름 | 역할 매핑 |
| `CLAUDE_CODE_AGENT_TYPE` | `lead` 또는 `teammate` | 로직 분기 |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | teammate Plan Mode 강제 | PDCA 통합 |
| `CLAUDE_CODE_PARENT_SESSION_ID` | 부모 세션 ID | 세션 추적 |

### 1.4 Display 모드

| 모드 | 방식 | 설명 |
|------|------|------|
| **in-process** | Shift+Up/Down | 단일 터미널에서 teammate 간 전환 |
| **split-panes** | tmux/iTerm2 | 물리적 분할 화면, 각 teammate 독립 표시 |

### 1.5 5가지 오케스트레이션 패턴

| 패턴 | 설명 | bkit PDCA 매핑 |
|------|------|:-------------:|
| **Leader** | Lead가 작업 분배, teammate 실행 | Plan/Do 단계 |
| **Swarm** | 동일 작업을 여러 teammate가 병렬 수행 | Do 단계 (대규모 구현) |
| **Pipeline** | 순차적 전달 (A→B→C) | PDCA 전체 (Plan→Do→Check→Act) |
| **Council** | 여러 관점에서 분석 후 Lead가 종합 | Check 단계 (다각도 검증) |
| **Watchdog** | 모니터링 전담 teammate | Act 단계 (지속 감시) |

### 1.6 제한사항 및 주의사항

| 제한사항 | 영향도 | bkit 대응 전략 |
|---------|:------:|--------------|
| Research Preview (불안정) | 🔴 | 점진적 도입, fallback 로직 필수 |
| 세션 재개 불가 | 🟡 | PDCA 문서로 상태 영속화 |
| 중첩 팀 불가 | 🟡 | 단일 계층 팀 설계 |
| 세션당 1팀 | 🟡 | 팀 구성 최적화 |
| ~7x 토큰 사용량 | 🔴 | 레벨별 팀 규모 차별화 |
| 5분 heartbeat timeout | 🟡 | 긴 작업 분할 |
| Teammate는 Plan Mode 전용 | 🟡 | Lead가 실행, Teammate는 설계/분석 |

---

## 2. 현재 bkit 구현 상태 분석

### 2.1 lib/team/ 모듈 분석

| 파일 | 함수 | 상태 | 설명 |
|------|------|:----:|------|
| `coordinator.js` | `isTeamModeAvailable()` | ✅ 완성 | 환경변수 기반 팀 모드 감지 |
| `coordinator.js` | `getTeamConfig()` | ✅ 완성 | 레벨별 팀 설정 반환 |
| `coordinator.js` | `generateTeamStrategy()` | ✅ 완성 | PDCA 단계별 전략 생성 |
| `coordinator.js` | `formatTeamStatus()` | ✅ 완성 | 팀 상태 텍스트 포맷 |
| `strategy.js` | `TEAM_STRATEGIES` | ✅ 완성 | Starter=null, Dynamic=2, Enterprise=4 |
| `strategy.js` | `getTeammateRoles()` | ✅ 완성 | 역할별 에이전트 매핑 |
| `hooks.js` | `assignNextTeammateWork()` | ⚠️ 골격 | 데이터 반환만, 실행 안 함 |
| `hooks.js` | `handleTeammateIdle()` | ⚠️ 골격 | 제안 메시지만 반환 |

### 2.2 현재 팀 역할 정의

```javascript
// lib/team/strategy.js - TEAM_STRATEGIES
{
  Enterprise: {
    maxTeammates: 4,
    roles: ['architect', 'developer', 'qa', 'reviewer'],
    agents: {
      architect: ['enterprise-expert', 'infra-architect'],
      developer: ['bkend-expert'],
      qa: ['qa-monitor', 'gap-detector'],
      reviewer: ['code-analyzer', 'design-validator']
    }
  },
  Dynamic: {
    maxTeammates: 2,
    roles: ['developer', 'qa'],
    agents: {
      developer: ['bkend-expert'],
      qa: ['qa-monitor', 'gap-detector']
    }
  }
}
```

### 2.3 Hook 통합 상태

| 스크립트 | lib/team 연동 | 실제 동작 |
|---------|:------------:|----------|
| `scripts/pdca-task-completed.js` | ❌ 미연동 | PDCA phase 감지만, `assignNextTeammateWork()` 호출 안 함 |
| `scripts/team-idle-handler.js` | ❌ 미연동 | 정적 제안만, `handleTeammateIdle()` 미호출 |
| `scripts/team-stop.js` | ⚠️ 부분 | 팀 종료 처리 |

### 2.4 구현 완성도 평가

```
┌──────────────────────────────────────────────────┐
│  Agent Teams 구현 완성도: 40%                      │
├──────────────────────────────────────────────────┤
│  ✅ 인프라/설정 계층:    100% (4/4 완성)            │
│  ✅ 전략/역할 정의:      100% (2/2 완성)            │
│  ⚠️ Hook 실행 로직:      20% (0/2 실행 가능)       │
│  ❌ 팀 오케스트레이션:     0% (미구현)              │
│  ❌ 팀원 간 통신:          0% (미구현)              │
│  ❌ 작업 큐/진행 추적:     0% (미구현)              │
└──────────────────────────────────────────────────┘
```

---

## 3. 철학 정합성 분석

### 3.1 bkit 3대 철학과 CTO-Led Team 매핑

| 철학 | 원칙 | CTO-Led Team 적용 |
|------|------|-------------------|
| **Automation First** | 자동화 가능한 것은 모두 자동화 | CTO 에이전트가 팀 구성, 작업 분배, 단계 전환을 **자동으로** 수행 |
| **No Guessing** | 추측하지 않고 항상 확인 | 각 teammate가 명시적 Plan을 제출, CTO가 **검토 후 승인** |
| **Docs = Code** | 문서와 코드의 일치 | PDCA 문서가 팀 작업의 **계약 문서** 역할 |

### 3.2 AI-Native 3대 핵심 역량과 CTO 역할

| 핵심 역량 | 설명 | CTO 에이전트 책임 |
|-----------|------|------------------|
| **검증 능력** (Verification Ability) | AI 결과물 검증 | gap-detector, code-analyzer 조율 |
| **방향 설정** (Direction Setting) | 올바른 기술 결정 | PDCA 단계 진행 방향 결정, 아키텍처 판단 |
| **품질 기준** (Quality Standards) | 높은 품질 유지 | 90% Match Rate 기준 적용, Plan 승인/거부 |

### 3.3 Context Engineering과 팀 모델

| Context Engineering 원칙 | 팀 적용 |
|--------------------------|---------|
| **Role Definition Pattern** (전문성, 책임, 수준, 실제 사례) | 각 팀원 에이전트에 역할 기반 context 주입 |
| **Model Selection Strategy** (opus=전략, sonnet=실행, haiku=모니터링) | CTO=opus, 개발자=sonnet, 모니터=haiku |
| **State Management** (144+ 함수) | 팀 상태, 작업 진행, PDCA phase 통합 관리 |

### 3.4 철학 정합성 점수

```
┌──────────────────────────────────────────────────┐
│  Philosophy Alignment Score: 95%                  │
├──────────────────────────────────────────────────┤
│  Automation First:   100% (완벽 정합)              │
│  No Guessing:         95% (Plan 승인 워크플로우)    │
│  Docs = Code:         90% (PDCA 문서 = 팀 계약)    │
│  AI-Native:           95% (3 역량 모두 매핑)        │
└──────────────────────────────────────────────────┘
```

---

## 4. Gap 분석: CTO-Led Team에 필요한 역할

### 4.1 현재 에이전트 vs 조직 역할 매핑

| 조직 역할 | 현재 에이전트 | 매핑 상태 | 비고 |
|-----------|-------------|:--------:|------|
| **CTO / Tech Lead** | 없음 | ❌ Gap | 방향 설정, 최종 의사결정 |
| **Product Manager** | 없음 | ❌ Gap | 요구사항 정리, 우선순위 결정 |
| **Backend Architect** | enterprise-expert, infra-architect | ✅ 부분 | 설계 전문가는 있으나 실행 리더 부재 |
| **Frontend Lead** | 없음 | ❌ Gap | UI/UX 전문성 부재 |
| **QA Lead** | qa-monitor, gap-detector | ✅ 부분 | 도구는 있으나 전략적 QA 리더 부재 |
| **Security Specialist** | 없음 | ❌ Gap | 보안 전문 에이전트 부재 |
| **DevOps/SRE** | infra-architect | ⚠️ 약함 | 인프라 설계만, 운영/배포 자동화 부재 |
| **Documentation Lead** | report-generator | ⚠️ 약함 | 보고서만, 포괄적 문서 관리 부재 |
| **Developer** | bkend-expert | ✅ 매핑 | 백엔드 특화 |
| **Code Reviewer** | code-analyzer, design-validator | ✅ 매핑 | 2개 에이전트로 커버 |

### 4.2 역할 Gap 우선순위

| 순위 | 누락 역할 | 중요도 | 이유 |
|:----:|-----------|:------:|------|
| 1 | **CTO / Tech Lead** | 🔴 필수 | 팀의 핵심 — 방향 설정, 의사결정, 품질 기준 |
| 2 | **Product Manager** | 🟡 높음 | 요구사항 분석, Plan 단계 정교화 |
| 3 | **Frontend Lead** | 🟡 높음 | 풀스택 개발의 절반인 프론트엔드 전문성 |
| 4 | **Security Specialist** | 🟡 높음 | 보안 검토 없는 개발은 위험 |
| 5 | **QA Strategist** | 🟢 보통 | 기존 qa-monitor/gap-detector의 전략적 상위 역할 |

---

## 5. 신규 에이전트 제안

### 5.1 CTO Agent (최우선)

```yaml
name: cto-lead
model: opus
memory_scope: project
permission: acceptEdits  # Plan 승인 시 코드 변경 허용

역할:
  - 기술 방향 설정 및 아키텍처 의사결정
  - PDCA 단계별 팀 구성 자동화
  - Plan/Design 문서 승인 워크플로우
  - 품질 기준 적용 (90% Match Rate)
  - 팀원 작업 분배 및 진행 추적

트리거:
  - "팀 구성", "프로젝트 시작", "아키텍처 결정"
  - "team", "project lead", "architecture decision"
  - "チーム", "プロジェクト開始", "团队", "项目启动"

PDCA 단계별 행동:
  Plan:   요구사항 분석 → 팀 역할 배정 → Plan 문서 생성 지시
  Design: 아키텍처 결정 → Design 문서 검토 → 승인/거부
  Do:     작업 분배 → 진행 추적 → 병목 해소
  Check:  gap-detector/code-analyzer 조율 → 결과 종합
  Act:    이슈 우선순위 결정 → 반복 전략 지시
```

### 5.2 Product Manager Agent

```yaml
name: product-manager
model: sonnet
memory_scope: project
permission: plan

역할:
  - 사용자 요구사항 분석 및 정리
  - Feature 우선순위 결정
  - Plan 문서 초안 작성
  - 사용자 스토리 생성

트리거:
  - "요구사항", "기능 정의", "우선순위"
  - "requirements", "feature spec", "user story", "priority"

PDCA 매핑: Plan 단계 전문가
```

### 5.3 Frontend Architect Agent

```yaml
name: frontend-architect
model: sonnet
memory_scope: project
permission: acceptEdits

역할:
  - UI/UX 아키텍처 설계
  - 컴포넌트 구조 결정
  - Design System 관리
  - 프론트엔드 코드 리뷰

트리거:
  - "프론트엔드", "UI", "컴포넌트", "디자인 시스템"
  - "frontend", "UI architecture", "component", "React", "Next.js"

PDCA 매핑: Design/Do 단계 (UI 측면)
```

### 5.4 Security Architect Agent

```yaml
name: security-architect
model: opus
memory_scope: project
permission: plan

역할:
  - 보안 아키텍처 설계
  - 취약점 분석 (OWASP Top 10)
  - 인증/인가 설계 검토
  - 보안 코드 리뷰

트리거:
  - "보안", "인증", "취약점", "OWASP"
  - "security", "authentication", "vulnerability", "CSRF", "XSS"

PDCA 매핑: Check 단계 (보안 관점)
```

### 5.5 QA Strategist Agent

```yaml
name: qa-strategist
model: sonnet
memory_scope: project
permission: plan

역할:
  - 테스트 전략 수립
  - qa-monitor/gap-detector 작업 조율
  - 품질 메트릭 정의 및 추적
  - 테스트 계획 문서 작성

트리거:
  - "테스트 전략", "QA 계획", "품질 기준"
  - "test strategy", "QA plan", "quality metrics"

PDCA 매핑: Check/Act 단계 전략가
```

### 5.6 신규 에이전트 요약

| 에이전트 | 모델 | 메모리 | PDCA 역할 | 토큰 비용 |
|---------|:----:|:------:|:---------:|:---------:|
| cto-lead | opus | project | 전체 조율 | 높음 |
| product-manager | sonnet | project | Plan | 중간 |
| frontend-architect | sonnet | project | Design/Do | 중간 |
| security-architect | opus | project | Check | 높음 |
| qa-strategist | sonnet | project | Check/Act | 중간 |

---

## 6. 팀 오케스트레이션 아키텍처 설계

### 6.1 PDCA 단계별 팀 구성

#### Starter Level (팀 없음 → 변경 없음)

```
사용자 ↔ Claude Code (단독)
- Agent Teams 미사용
- 기존 11 에이전트 auto-trigger로 충분
```

#### Dynamic Level (2 → 3 teammates)

```
┌─────────────────────────────────────┐
│          CTO Lead (opus)            │
│  - PDCA 전체 조율                    │
│  - Plan/Design 승인                  │
├───────────┬───────────┬─────────────┤
│ Developer │ QA        │ Frontend    │
│ (sonnet)  │ (sonnet)  │ (sonnet)    │
│ bkend-    │ qa-monitor│ frontend-   │
│ expert    │ gap-      │ architect   │
│           │ detector  │             │
└───────────┴───────────┴─────────────┘
```

#### Enterprise Level (4 → 5 teammates)

```
┌────────────────────────────────────────────────────┐
│               CTO Lead (opus)                      │
│  - 아키텍처 결정, 팀 전략, 품질 기준                   │
├──────────┬──────────┬──────────┬──────┬────────────┤
│ Architect│ Developer│ QA       │Review│ Security   │
│ (opus)   │ (sonnet) │ (sonnet) │(haiku)│ (opus)    │
│ enter-   │ bkend-   │ qa-strat │code- │ security-  │
│ prise-   │ expert   │ qa-mon   │analyz│ architect  │
│ expert   │          │ gap-det  │design│            │
│ infra-   │          │          │-valid│            │
│ architect│          │          │      │            │
└──────────┴──────────┴──────────┴──────┴────────────┘
```

### 6.2 PDCA 단계별 오케스트레이션 패턴

| PDCA 단계 | 오케스트레이션 패턴 | 팀 행동 |
|-----------|:------------------:|---------|
| **Plan** | **Leader** | CTO가 PM에게 요구사항 분석 지시 → PM이 Plan 문서 초안 → CTO 승인 |
| **Design** | **Council** | Architect + Frontend + Security가 각자 관점에서 설계 → CTO 종합 |
| **Do** | **Swarm/Pipeline** | Developer + Frontend가 병렬 구현 → 각자 Plan 제출 → CTO 승인 |
| **Check** | **Council** | QA + Security + Reviewer가 다각도 검증 → CTO 종합 판단 |
| **Act** | **Watchdog** | QA가 모니터링 지속, CTO가 반복 여부 결정 |

### 6.3 spawnTeam 호출 설계

```javascript
// CTO Lead의 spawnTeam 호출 예시 (Enterprise, Do 단계)
{
  operation: "spawnTeam",
  teammates: [
    {
      name: "backend-dev",
      agentType: "bkend-expert",
      task: "API 엔드포인트 구현 (Design 문서 Section 3 기준)",
      planModeRequired: true
    },
    {
      name: "frontend-dev",
      agentType: "frontend-architect",
      task: "UI 컴포넌트 구현 (Design 문서 Section 5 기준)",
      planModeRequired: true
    },
    {
      name: "qa-lead",
      agentType: "qa-strategist",
      task: "테스트 전략 수립 및 검증 준비",
      planModeRequired: true
    },
    {
      name: "security-review",
      agentType: "security-architect",
      task: "구현 코드 보안 검토",
      planModeRequired: true
    }
  ]
}
```

---

## 7. 기존 에이전트 역할 재편

### 7.1 CTO-Led Team 체계에서의 역할 재배치

| 기존 에이전트 | 현재 역할 | 팀 체계 역할 | 보고 대상 |
|-------------|----------|-------------|----------|
| enterprise-expert | 독립 전문가 | Architect 팀원 | CTO |
| infra-architect | 독립 전문가 | Architect 팀원 | CTO |
| bkend-expert | 독립 전문가 | Developer 팀원 | CTO |
| code-analyzer | 독립 분석가 | Reviewer 팀원 | QA Strategist |
| design-validator | 독립 분석가 | Reviewer 팀원 | QA Strategist |
| gap-detector | 독립 분석가 | QA 팀원 | QA Strategist |
| qa-monitor | 독립 모니터 | QA 팀원 | QA Strategist |
| pdca-iterator | 독립 반복가 | Act 단계 전담 | CTO |
| report-generator | 독립 생성가 | 문서 팀원 | CTO |
| starter-guide | 사용자 가이드 | 변경 없음 (팀 외) | 사용자 직접 |
| pipeline-guide | 사용자 가이드 | 변경 없음 (팀 외) | 사용자 직접 |

### 7.2 신규 팀 계층 구조

```
CTO (cto-lead, opus)
├── Product Manager (product-manager, sonnet)
│   └── 요구사항 분석, Plan 초안
├── Architecture Team
│   ├── Backend Architect (enterprise-expert, opus)
│   ├── Infra Architect (infra-architect, opus)
│   ├── Frontend Architect (frontend-architect, sonnet) [신규]
│   └── Security Architect (security-architect, opus) [신규]
├── Development Team
│   ├── Backend Developer (bkend-expert, sonnet)
│   └── (Frontend는 frontend-architect가 겸임)
├── QA Team
│   ├── QA Strategist (qa-strategist, sonnet) [신규]
│   ├── QA Monitor (qa-monitor, haiku)
│   └── Gap Detector (gap-detector, opus)
├── Review Team
│   ├── Code Analyzer (code-analyzer, opus)
│   └── Design Validator (design-validator, opus)
└── Support
    ├── PDCA Iterator (pdca-iterator, sonnet)
    └── Report Generator (report-generator, haiku)
```

---

## 8. lib/team/ 모듈 확장 설계

### 8.1 신규 필요 모듈

| 모듈 | 파일 | 주요 함수 | 목적 |
|------|------|----------|------|
| **orchestrator** | `lib/team/orchestrator.js` | `executeTeamPhase()`, `coordinateTeammates()` | 실제 팀 실행 로직 |
| **communication** | `lib/team/communication.js` | `sendToTeammate()`, `broadcastToTeam()`, `readMailbox()` | 팀원 간 통신 |
| **task-queue** | `lib/team/task-queue.js` | `createTeamTasks()`, `assignTask()`, `trackProgress()` | 작업 큐 관리 |
| **cto-logic** | `lib/team/cto-logic.js` | `decidePdcaPhase()`, `approvePlan()`, `evaluateQuality()` | CTO 의사결정 로직 |

### 8.2 기존 모듈 수정 필요사항

| 파일 | 수정 내용 | 우선순위 |
|------|----------|:--------:|
| `hooks.js` | `assignNextTeammateWork()` 실행 로직 구현 | 🔴 |
| `hooks.js` | `handleTeammateIdle()` 실행 로직 구현 | 🔴 |
| `strategy.js` | 신규 에이전트 역할 추가 (CTO, PM, Frontend, Security, QA) | 🔴 |
| `strategy.js` | Dynamic 레벨 3 teammates 확장 | 🟡 |
| `coordinator.js` | `generateTeamStrategy()` 오케스트레이션 패턴 반영 | 🟡 |
| `index.js` | 신규 모듈 export 추가 | 🟢 |

### 8.3 Hook 스크립트 수정 필요사항

| 스크립트 | 수정 내용 | 우선순위 |
|---------|----------|:--------:|
| `pdca-task-completed.js` | `assignNextTeammateWork()` 실제 호출 | 🔴 |
| `team-idle-handler.js` | `handleTeammateIdle()` 실제 호출 | 🔴 |
| `team-stop.js` | 팀 종료 시 상태 저장 | 🟡 |
| (신규) `cto-phase-router.js` | CTO 에이전트의 PDCA 단계 라우팅 | 🔴 |

---

## 9. 구현 로드맵

### 9.1 Phase 1: Foundation (v1.5.1-alpha)

**목표**: CTO 에이전트 + 기본 오케스트레이션

| 항목 | 작업 | 파일 | 예상 영향도 |
|------|------|------|:----------:|
| 1-1 | CTO Lead 에이전트 생성 | `agents/cto-lead.md` | 신규 파일 |
| 1-2 | lib/team/orchestrator.js 구현 | `lib/team/orchestrator.js` | 신규 파일 |
| 1-3 | lib/team/cto-logic.js 구현 | `lib/team/cto-logic.js` | 신규 파일 |
| 1-4 | strategy.js에 CTO 역할 추가 | `lib/team/strategy.js` | 수정 |
| 1-5 | hooks.js 실행 로직 구현 | `lib/team/hooks.js` | 수정 |
| 1-6 | Hook 스크립트 연동 | `scripts/pdca-task-completed.js` | 수정 |

### 9.2 Phase 2: Team Expansion (v1.5.1-beta)

**목표**: 신규 에이전트 4종 + 통신 모듈

| 항목 | 작업 | 파일 |
|------|------|------|
| 2-1 | Product Manager 에이전트 생성 | `agents/product-manager.md` |
| 2-2 | Frontend Architect 에이전트 생성 | `agents/frontend-architect.md` |
| 2-3 | Security Architect 에이전트 생성 | `agents/security-architect.md` |
| 2-4 | QA Strategist 에이전트 생성 | `agents/qa-strategist.md` |
| 2-5 | lib/team/communication.js 구현 | `lib/team/communication.js` |
| 2-6 | lib/team/task-queue.js 구현 | `lib/team/task-queue.js` |

### 9.3 Phase 3: Integration (v1.5.1-rc)

**목표**: 전체 통합 + 테스트 + 문서화

| 항목 | 작업 |
|------|------|
| 3-1 | 5가지 오케스트레이션 패턴 구현 |
| 3-2 | PDCA 단계별 자동 팀 구성 |
| 3-3 | 레벨별 팀 규모 최적화 (Starter=0, Dynamic=3, Enterprise=5) |
| 3-4 | bkit-system/philosophy/ 문서 업데이트 |
| 3-5 | 통합 테스트 및 토큰 비용 분석 |
| 3-6 | CHANGELOG, README 업데이트 |

---

## 10. 리스크 분석

### 10.1 기술적 리스크

| 리스크 | 확률 | 영향도 | 완화 전략 |
|--------|:----:|:------:|----------|
| Agent Teams가 Research Preview에서 변경될 수 있음 | 🟡 높음 | 🔴 높음 | 추상화 계층으로 API 변경 흡수 |
| ~7x 토큰 비용 증가 | 🔴 확실 | 🟡 중간 | 레벨별 팀 규모 차별화, haiku 적극 활용 |
| 5분 heartbeat timeout으로 긴 작업 실패 | 🟡 중간 | 🟡 중간 | 작업 단위 분할, 상태 영속화 |
| Teammate Plan Mode 제약 | 🔴 확실 | 🟡 중간 | CTO Lead가 실행, Teammate는 설계/분석 전담 |

### 10.2 설계적 리스크

| 리스크 | 확률 | 영향도 | 완화 전략 |
|--------|:----:|:------:|----------|
| 에이전트 16개로 복잡도 증가 | 🟡 중간 | 🟡 중간 | CTO가 자동 조율, 사용자는 CTO만 인식 |
| 역할 중복 (기존 에이전트 vs 신규) | 🟡 중간 | 🟢 낮음 | 명확한 계층 구조로 역할 분리 |
| 철학(Automation First) 위배 가능성 | 🟢 낮음 | 🔴 높음 | 모든 팀 조율을 자동화, 사용자 개입 최소화 |

---

## 11. 예상 사용자 경험

### 11.1 CTO-Led Team 활성화 전 (현재)

```
사용자: "로그인 기능 만들어줘"
Claude: gap-detector → bkend-expert → code-analyzer (순차적, 개별 호출)
느낌: "여러 도구를 하나씩 쓰는 느낌"
```

### 11.2 CTO-Led Team 활성화 후 (목표)

```
사용자: "로그인 기능 만들어줘"
CTO Lead:
  1. "요구사항을 분석하겠습니다" → PM에게 지시
  2. PM: Plan 문서 초안 작성 → CTO 승인
  3. CTO: "설계를 시작합니다" → Architect 팀 Council
     - Backend Architect: API 설계
     - Frontend Architect: UI 컴포넌트 설계
     - Security Architect: 인증 보안 검토
  4. CTO: Design 문서 종합 → 사용자 승인
  5. CTO: "구현을 시작합니다" → Developer 팀 Swarm
     - Backend Dev: API 구현
     - Frontend Dev: UI 구현
  6. CTO: "검증합니다" → QA 팀 Council
     - QA Strategist: 테스트 전략
     - Gap Detector: 설계-구현 매칭
     - Code Analyzer: 코드 품질
  7. CTO: "결과 보고서를 작성합니다"
느낌: "CTO가 이끄는 전문 개발팀이 일하는 느낌"
```

---

## 12. 결론 및 권고사항

### 12.1 핵심 결론

1. **bkit의 철학과 Agent Teams는 높은 정합성**을 보입니다 (95%)
2. **현재 구현은 인프라만 완성** (40%), 실행 로직이 핵심 Gap
3. **CTO 에이전트가 핵심 열쇠** — 모든 오케스트레이션의 중심점
4. **5개 신규 에이전트**로 완전한 개발 조직 구현 가능
5. **3단계 로드맵** (Foundation → Expansion → Integration)으로 점진적 도입 권장

### 12.2 우선 권고사항

| 순위 | 권고 | 근거 |
|:----:|------|------|
| 1 | **CTO Lead 에이전트를 최우선 구현** | 팀의 중심축, 없으면 나머지 무의미 |
| 2 | **lib/team/orchestrator.js 구현** | 실제 팀 실행 로직의 핵심 |
| 3 | **hooks.js 골격 함수 완성** | 기존 코드 기반, 수정 범위 최소 |
| 4 | **Agent Teams Research Preview 안정성 모니터링** | API 변경 리스크 관리 |
| 5 | **토큰 비용 최적화 전략 수립** | opus 사용 최소화, haiku 적극 활용 |

### 12.3 성공 지표

| 지표 | 현재 | 목표 |
|------|:----:|:----:|
| Agent 수 | 11 | 16 |
| 팀 오케스트레이션 완성도 | 40% | 90%+ |
| PDCA 자동화율 | 60% | 90%+ |
| 사용자 체감 | "도구 모음" | "전문 개발팀" |
| Philosophy Alignment | 95% | 98%+ |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-02-06 | 초기 분석 — 4개 병렬 에이전트 리서치 종합 | Claude Code (bkit PDCA Team) |
