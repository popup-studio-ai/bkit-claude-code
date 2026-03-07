# CTO Lead Restructure Planning Document

> **Summary**: CC v2.1.69 중첩 서브에이전트 차단 대응 — CTO/PM Lead 아키텍처 재구성
>
> **Project**: bkit
> **Version**: 1.6.1
> **Author**: Claude (AI)
> **Date**: 2026-03-07
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | CC v2.1.69의 중첩 서브에이전트 차단 정책으로 CTO/PM Lead의 Task() 호출이 전면 차단되어 `/pdca team`, `/pdca pm` 기능이 완전 비작동 (GitHub Issue #41) |
| **Solution** | A안: 메인 세션 스킬 오케스트레이션 전환 / B안: 진짜 CC Agent Teams(TeamCreate) 마이그레이션 — 두 안의 트레이드오프 비교 후 확정 |
| **Function/UX Effect** | 사용자 명령어 인터페이스 변경 없이 (`/pdca team`, `/pdca pm`) 동일한 팀 오케스트레이션 결과 제공 |
| **Core Value** | CC v2.1.69+ 공식 설계와 완전 호환하면서 21개 에이전트 메모리 및 기존 축적 데이터 보존 |

---

## 1. Overview

### 1.1 Purpose

Claude Code v2.1.69에서 도입된 "서브에이전트는 다른 서브에이전트를 생성할 수 없다" 정책으로 인해 bkit의 CTO-Led Agent Teams와 PM Agent Team이 완전히 작동 불가 상태이다. 이 문제를 해결하여 CC v2.1.69+ 환경에서 팀 오케스트레이션 기능을 정상 복구한다.

### 1.2 Background

- **GitHub Issue**: [#41](https://github.com/popup-studio-ai/bkit-claude-code/issues/41) — CTO Lead Agent Teams broken by CC v2.1.69
- **CC v2.1.69 변경**: "Fixed teammates accidentally spawning nested teammates via the Agent tool's name parameter"
- **CC 공식 문서**: "Subagents cannot spawn other subagents. Agent(agent_type) has no effect in subagent definitions."
- **근본 원인**: bkit의 CTO/PM "Teams"는 이름만 Agent Teams이며, 실제로는 Task() 서브에이전트 중첩 호출을 사용. `TeamCreate`는 코드베이스에서 **0회** 사용.
- v2.1.69 이전에는 중첩 호출이 "실수로 허용"되어 작동했으나, 이제 공식 차단됨
- CC v2.1.71 (현재 최신)까지 이 제한에 대한 변경/완화 없음

### 1.3 Related Documents

- GitHub Issue: #41 ([Bug] CTO Lead Agent Teams broken by Claude Code v2.1.69)
- CC 공식 문서 (Sub-agents): https://code.claude.com/docs/en/sub-agents
- CC 공식 문서 (Agent Teams): https://code.claude.com/docs/en/agent-teams
- bkit v2.1.69 영향 분석: `docs/01-plan/features/claude-code-v2169-impact-analysis.plan.md`

### 1.4 현재 아키텍처 문제 분석

#### 영향받는 에이전트 및 위임 경로

| 에이전트 | Task() 수 | 호출 방식 | 영향 |
|----------|:---------:|----------|------|
| **cto-lead** | 11 | pdca skill `agents: team:` → 서브에이전트 | **전체 Task() 차단** |
| **pm-lead** | 5 | pdca skill `agents: pm:` → 서브에이전트 | **전체 Task() 차단** |
| qa-strategist | 4 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| enterprise-expert | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| security-architect | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |
| pdca-iterator | 2 | cto-lead에서 호출 시 2단계 | 차단 (CTO 모드 시) |

#### 차단되는 3단계 위임 체인 (6개 경로)

```
Main → cto-lead(subagent) → qa-strategist(Task=❌) → gap-detector(Task=❌❌)
Main → cto-lead(subagent) → qa-strategist(Task=❌) → code-analyzer(Task=❌❌)
Main → cto-lead(subagent) → qa-strategist(Task=❌) → qa-monitor(Task=❌❌)
Main → cto-lead(subagent) → enterprise-expert(Task=❌) → infra-architect(Task=❌❌)
Main → cto-lead(subagent) → security-architect(Task=❌) → code-analyzer(Task=❌❌)
Main → cto-lead(subagent) → pdca-iterator(Task=❌) → gap-detector(Task=❌❌)
```

#### 에이전트 메모리 현황 (보존 필수)

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

---

## 2. Scope

### 2.1 In Scope

- [ ] CTO Lead의 중첩 서브에이전트 호출 문제 해결
- [ ] PM Lead의 중첩 서브에이전트 호출 문제 해결
- [ ] 2단계 위임 에이전트의 Task() 호출 경로 검증
- [ ] pdca SKILL.md의 `agents:` 매핑 수정 (team/pm 액션)
- [ ] lib/team/ 관련 코드 업데이트
- [ ] 에이전트 메모리 호환성 보장 (기존 8개 축적 메모리 유지)
- [ ] GitHub Issue #41 해결 및 클로즈
- [ ] bkit 버전 1.6.0 → 1.6.1 업데이트

### 2.2 Out of Scope

- CC 측 중첩 제한 완화 요청 (공식 설계이므로 변경 가능성 낮음)
- 에이전트 수 변경 (21개 유지)
- 새로운 에이전트 추가 (오케스트레이터 스킬은 추가 가능)
- 위임 구조 평탄화 (C안 — 3단계 체인 제거는 기능 저하이므로 제외)

---

## 3. Solution Alternatives

### 3.1 A안: 메인 세션 스킬 오케스트레이션

CTO/PM Lead의 프롬프트를 **스킬**로 전환하여, 메인 세션이 직접 오케스트레이터 역할을 수행한다.

#### 아키텍처

```
[A안] 메인 세션 오케스트레이션
─────────────────────────────────────────────────────────
Main Session (CTO 오케스트레이터 스킬 활성)
  ├── Agent(enterprise-expert) ← 1단계 서브에이전트 ✅
  │     └── Task(infra-architect) ← 2단계 (서브→서브) ✅? ❌?
  ├── Agent(qa-strategist) ← 1단계 서브에이전트 ✅
  │     ├── Task(gap-detector) ← 2단계 ❌ (서브→서브 여전히 차단)
  │     ├── Task(code-analyzer) ← 2단계 ❌
  │     └── Task(qa-monitor) ← 2단계 ❌
  ├── Agent(frontend-architect) ← 1단계 서브에이전트 ✅
  └── Agent(security-architect) ← 1단계 서브에이전트 ✅
        └── Task(code-analyzer) ← 2단계 ❌
```

> **주의**: A안은 CTO Lead의 직접 Task()는 해결하지만, qa-strategist 등 2단계 위임 에이전트의 Task() 호출은 **여전히 중첩 서브에이전트**이므로 차단됨. 이를 해결하려면 2단계 위임도 평탄화해야 함.

#### A안 + 평탄화 (A' 변형)

```
[A'안] 메인 세션 오케스트레이션 + 2단계 평탄화
─────────────────────────────────────────────────────────
Main Session (CTO 오케스트레이터 스킬 활성)
  ├── Agent(enterprise-expert) ← 1단계 ✅ (Task(infra-architect) 제거)
  ├── Agent(infra-architect) ← 1단계 ✅ (직접 호출)
  ├── Agent(qa-strategist) ← 1단계 ✅ (Task() 모두 제거, 조율만)
  ├── Agent(gap-detector) ← 1단계 ✅ (직접 호출)
  ├── Agent(code-analyzer) ← 1단계 ✅ (직접 호출)
  ├── Agent(qa-monitor) ← 1단계 ✅ (직접 호출)
  ├── Agent(frontend-architect) ← 1단계 ✅ (Task(Explore) 제거)
  └── Agent(security-architect) ← 1단계 ✅ (Task() 제거)
```

#### A안 변경 대상

| # | File | Change |
|---|------|--------|
| 1 | `skills/cto-orchestrate/SKILL.md` (NEW) | CTO Lead 프롬프트를 스킬로 전환 |
| 2 | `skills/pm-orchestrate/SKILL.md` (NEW) | PM Lead 프롬프트를 스킬로 전환 |
| 3 | `skills/pdca/SKILL.md` | `agents: team/pm` → 스킬 기반으로 변경 |
| 4 | `agents/cto-lead.md` | Task() 유지하되 "독립 호출 전용" 주석 |
| 5 | `agents/pm-lead.md` | Task() 유지하되 "독립 호출 전용" 주석 |
| 6 | `agents/qa-strategist.md` | (A'시) Task() 제거, Read-only 조율 역할 |
| 7 | `agents/enterprise-expert.md` | (A'시) Task(infra-architect) 제거 |
| 8 | `agents/security-architect.md` | (A'시) Task(code-analyzer) 제거 |
| 9 | `lib/team/orchestrator.js` | 메인 세션용 Agent() 호출 데이터 생성 |
| 10 | `lib/team/coordinator.js` | 팀 모드 로직 업데이트 |

#### A안 장단점

| 장점 | 단점 |
|------|------|
| CC GA 기능만 사용 (안정적) | 메인 세션 컨텍스트 윈도우 부담 증가 |
| 에이전트 메모리 100% 호환 | A'변형 시 2단계 위임 에이전트 기능 저하 |
| 구현 복잡도 낮음 | 팀원 간 직접 소통 불가 (서브에이전트 한계) |
| 하위 호환 용이 | 오케스트레이션 품질이 스킬 프롬프트에 의존 |

---

### 3.2 B안: CC Agent Teams(TeamCreate) 마이그레이션

실제 CC Agent Teams API를 사용하여 독립 세션 기반 팀으로 전환한다.

#### 아키텍처

```
[B안] CC Agent Teams (TeamCreate)
─────────────────────────────────────────────────────────
Main Session (Team Lead)
  ├── Teammate: enterprise-expert (독립 세션) ✅
  │     └── Agent(infra-architect) ← 1단계 서브에이전트 ✅
  ├── Teammate: qa-strategist (독립 세션) ✅
  │     ├── Agent(gap-detector) ← 1단계 서브에이전트 ✅
  │     ├── Agent(code-analyzer) ← 1단계 서브에이전트 ✅
  │     └── Agent(qa-monitor) ← 1단계 서브에이전트 ✅
  ├── Teammate: frontend-architect (독립 세션) ✅
  │     └── Agent(Explore) ← 1단계 서브에이전트 ✅
  └── Teammate: security-architect (독립 세션) ✅
        └── Agent(code-analyzer) ← 1단계 서브에이전트 ✅

Shared: Task List + Mailbox (teammate 간 직접 소통)
```

> **핵심 이점**: 각 teammate가 **독립 Claude Code 세션**이므로, 해당 세션 내에서 Agent() 호출은 1단계 서브에이전트가 됨. 따라서 기존 2단계/3단계 위임 체인이 **평탄화 없이 그대로 동작**.

#### B안 변경 대상

| # | File | Change |
|---|------|--------|
| 1 | `skills/pdca/SKILL.md` | `agents: team/pm` → TeamCreate 기반 오케스트레이션 |
| 2 | `lib/team/orchestrator.js` | `generateSpawnTeamCommand()` → 실제 TeamCreate 호출 |
| 3 | `lib/team/coordinator.js` | Agent Teams API 통합 (TeamCreate, TeamDelete) |
| 4 | `lib/team/strategy.js` | teammate 생성 데이터 구조 업데이트 |
| 5 | `agents/cto-lead.md` | team lead 역할로 변경 (또는 메인 세션이 lead) |
| 6 | `agents/pm-lead.md` | team lead 역할로 변경 |
| 7 | `hooks/session-start.js` | Agent Teams 상태 표시 업데이트 |

#### B안 장단점

| 장점 | 단점 |
|------|------|
| **중첩 문제 완전 해결** (2단계 위임 평탄화 불필요) | **실험적 기능** ("experimental and disabled by default") |
| teammate 간 직접 소통 가능 (Mailbox) | **에이전트 메모리 호환성 미검증** (문서에 미언급) |
| 공유 Task List로 자율 조율 | 토큰 비용 선형 증가 (각 teammate = 독립 컨텍스트) |
| CC의 공식 팀 기능 사용 (향후 안정화 기대) | 세션 재개 불가 ("/resume does not restore teammates") |
| 기존 에이전트 정의(.md) 변경 최소화 | "No nested teams" 제한 (teammate가 팀 생성 불가) |
| | "One team per session" 제한 |

#### B안 메모리 호환성 위험 상세

| 항목 | 서브에이전트 (현재) | Agent Teams teammate |
|------|:---:|:---:|
| `memory` frontmatter 지원 | ✅ 공식 지원 | ❌ **문서에 미언급** |
| `.claude/agent-memory/` 자동 로딩 | ✅ | ❓ 검증 필요 |
| agent .md 파일 설정 적용 | ✅ 완전 적용 | ❓ agentType 매핑 불분명 |
| CLAUDE.md 로딩 | ✅ | ✅ (문서 확인) |
| Skills 로딩 | ✅ | ✅ (문서 확인) |
| MCP servers 로딩 | ✅ | ✅ (문서 확인) |

CC 공식 문서에서 Agent Teams teammate 컨텍스트:
> "teammates load the same project context as a regular session: **CLAUDE.md, MCP servers, and skills**"

`memory` frontmatter에 대한 언급이 없어 축적된 8개 에이전트 메모리의 로딩 여부가 불확실함.

---

### 3.3 비교 매트릭스

| 평가 항목 | A안 (스킬 전환) | A'안 (스킬+평탄화) | B안 (Agent Teams) |
|-----------|:---:|:---:|:---:|
| 중첩 문제 해결 | ⚠️ 1단계만 | ✅ 완전 | ✅ 완전 |
| 에이전트 메모리 호환 | ✅ 100% | ✅ 100% | ❓ 미검증 |
| CC 공식 설계 부합 | ✅ GA 기능 | ✅ GA 기능 | ⚠️ 실험적 |
| 구현 복잡도 | 낮음 | 중간 | 높음 |
| 팀원 간 소통 | ❌ | ❌ | ✅ Mailbox |
| 토큰 효율 | ✅ 효율적 | ✅ 효율적 | ⚠️ 비용 증가 |
| 2단계 위임 보존 | ❌ 차단됨 | ❌ 제거 | ✅ 보존 |
| 하위 호환 (CC <v2.1.69) | ✅ 용이 | ⚠️ 기능 저하 | ❌ Agent Teams 필수 |
| 향후 확장성 | 중간 | 중간 | ✅ CC 로드맵 부합 |

---

## 4. Requirements

### 4.1 Functional Requirements

| ID | Requirement | Priority | A안 | B안 |
|----|-------------|----------|:---:|:---:|
| FR-01 | `/pdca team {feature}` CC v2.1.69+에서 정상 동작 | High | ✅ | ✅ |
| FR-02 | `/pdca pm {feature}` CC v2.1.69+에서 정상 동작 | High | ✅ | ✅ |
| FR-03 | 사용자 명령어 인터페이스 변경 없음 | High | ✅ | ✅ |
| FR-04 | 에이전트 메모리 축적 데이터 무손실 | High | ✅ | ❓ |
| FR-05 | 2단계 위임 (qa-strategist→gap-detector) 정상 동작 | High | ⚠️ A'필요 | ✅ |
| FR-06 | 오케스트레이션 패턴 유지 (Leader/Council/Swarm) | Medium | ✅ | ✅ |
| FR-07 | 기존 에이전트 정의(.md) 최소 변경 | Medium | ⚠️ A'시 변경 | ✅ |
| FR-08 | lib/team/ 코드 업데이트 | Medium | ✅ | ✅ |
| FR-09 | validate-plugin.js 통과 | Low | ✅ | ✅ |
| FR-10 | bkit 버전 1.6.0 → 1.6.1 업데이트 | Low | ✅ | ✅ |

### 4.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 호환성 | CC v2.1.69+ 에서 중첩 없이 정상 동작 | CC v2.1.71 환경 수동 테스트 |
| 메모리 보존 | 기존 8개 에이전트 메모리 파일 무손실 | `.claude/agent-memory/` 파일 비교 |
| 성능 | 팀 오케스트레이션 응답 시간 기존 대비 동등 이하 | 체감 비교 |
| 안정성 | 2시간+ 장시간 세션에서 안정 동작 | CTO Team 세션 테스트 |

---

## 5. Success Criteria

### 5.1 Definition of Done

- [ ] `/pdca team {feature}` CC v2.1.71에서 팀 오케스트레이션 정상 동작
- [ ] `/pdca pm {feature}` CC v2.1.71에서 PM 팀 4개 에이전트 정상 동작
- [ ] 에이전트 메모리 8개 파일 무손실 확인
- [ ] GitHub Issue #41 재현 시나리오 통과
- [ ] Gap Analysis Match Rate >= 90%
- [ ] 기존 PDCA 단일 세션 모드 영향 없음

### 5.2 Quality Criteria

- [ ] validate-plugin.js 통과
- [ ] 21개 에이전트 정의 파일 무결성
- [ ] CHANGELOG.md v1.6.1 항목 작성

---

## 6. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| (공통) CC 향후 버전에서 추가 제한 도입 | High | Low | CC changelog 지속 모니터링, 영향 분석 프로세스 유지 |
| (A안) 메인 세션 컨텍스트 과부하 | Medium | Medium | 팀원을 백그라운드 에이전트로 실행, 결과 요약만 수신 |
| (A'안) 2단계 위임 제거로 qa-strategist 조율 품질 저하 | Medium | Medium | 스킬 프롬프트에 조율 로직 상세 포함 |
| (B안) Agent Teams 메모리 미지원 시 축적 데이터 접근 불가 | High | Medium | 사전 검증: 실제 TeamCreate로 teammate 생성 후 메모리 로딩 테스트 |
| (B안) 실험적 기능 안정성 문제 | Medium | Medium | CC v2.1.71 기준 안정성 테스트, 폴백 경로(A안) 준비 |
| (B안) 토큰 비용 증가로 사용자 부담 | Low | High | 문서에 비용 가이드 제공, 팀 크기 권장사항 명시 |

---

## 7. Decision Required

### 최종 아키텍처 결정 필요

| 질문 | 결정 필요 |
|------|-----------|
| A안 vs B안 중 어느 것을 1차 구현 대상으로 할 것인가? | **미확정** |
| A안 선택 시, A'(평탄화) 포함 여부? | **미확정** |
| B안 선택 시, 메모리 호환성 사전 검증을 별도 스파이크로 진행할 것인가? | **미확정** |
| 두 안 모두 구현하여 조건부 분기할 것인가? | **미확정** |

### 결정을 위한 권장 사전 검증

1. **B안 메모리 검증 (스파이크)**: 실제 Agent Teams 환경에서 `memory: project` 에이전트의 메모리 로딩 여부 테스트
2. **A안 2단계 위임 검증**: 메인 세션에서 Agent()로 qa-strategist를 호출했을 때, qa-strategist 내부 Task(gap-detector)가 작동하는지 확인 (1단계 서브에이전트의 Task() 허용 여부)

> **검증 결과에 따른 권장**:
> - 2단계 Task() 허용됨 + B안 메모리 작동 → **B안 우선** (완전 해결)
> - 2단계 Task() 허용됨 + B안 메모리 미작동 → **A안** (평탄화 불필요)
> - 2단계 Task() 차단됨 + B안 메모리 작동 → **B안 우선** (유일한 완전 해결)
> - 2단계 Task() 차단됨 + B안 메모리 미작동 → **A'안** (평탄화 필수)

---

## 8. Next Steps

1. [ ] **사전 검증 스파이크** 실행 (2단계 Task() 허용 여부 + B안 메모리 테스트)
2. [ ] 검증 결과 기반 최종 아키텍처 확정
3. [ ] Design 문서 작성 (`cto-lead-restructure.design.md`)
4. [ ] 구현 (선택된 안 기준)
5. [ ] Gap Analysis 실행
6. [ ] GitHub Issue #41 해결 확인 및 클로즈
7. [ ] v1.6.1 릴리즈

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-07 | Initial draft (A안 only) | Claude (AI) |
| 0.2 | 2026-03-07 | A안 + B안 비교 분석 추가, 사전 검증 스파이크 제안 | Claude (AI) |
