# bkit v1.5.1 + Claude Code v2.1.33 Compatibility Enhancement Plan

> **Summary**: Claude Code v2.1.31 이후 v2.1.33까지의 변경사항 영향도 분석, 호환성 검증, 그리고 Agent Teams/Swarm/Output Styles 기능을 bkit에 통합하는 고도화 계획서
>
> **Project**: bkit-claude-code
> **Target Version**: bkit v1.5.1
> **Author**: bkit Team
> **Date**: 2026-02-06
> **Status**: Draft
> **Claude Code Version**: v2.1.33 (from v2.1.31)

---

## 1. Overview

### 1.1 Purpose

Claude Code CLI가 v2.1.31에서 v2.1.33으로 업데이트되면서 도입된 **Agent Teams (Research Preview)**, **Memory System**, **Output Styles**, **새로운 Hook Events** 등의 주요 기능을 bkit v1.5.1에 통합하여 고도화하는 종합 계획서입니다.

### 1.2 Background

**Claude Code v2.1.32 주요 변경사항** (2026-02-05):
- **Claude Opus 4.6** 모델 지원
- **Agent Teams Research Preview** 도입 (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
- **자동 메모리 기록** (Automatic Memory Recording)
- **부분 대화 요약** ("Summarize from here" 기능)
- **자동 Skill 로딩** (--add-dir에서 .claude/skills/ 자동 로드)
- **Skill Character Budget Scaling** (컨텍스트 윈도우의 2%로 확장)
- Bash heredoc 템플릿 리터럴 오류 수정
- --resume 시 --agent 값 재사용

**Claude Code v2.1.33 주요 변경사항** (2026-02-06):
- **Agent teammate tmux 세션** 수정
- **Memory frontmatter** 필드 (user/project/local scope)
- **Sub-agent 제한** (Task(agent_type) 구문으로 spawn 가능 에이전트 제한)
- **TeammateIdle/TaskCompleted Hook Events** 추가
- **Plugin name in skill descriptions** 추가
- Extended thinking 중단 수정
- VSCode Remote Sessions 지원
- API proxy 404 streaming fallback 수정
- Proxy settings 적용 수정 (Node.js build)

### 1.3 Scope Summary

| 영역 | 내용 | 우선순위 |
|------|------|---------|
| 호환성 검증 | v2.1.32~v2.1.33 변경에 대한 기존 기능 호환성 | Critical |
| Agent Teams 통합 | Agent Teams 기능을 bkit PDCA 워크플로우에 통합 | High |
| Output Styles 통합 | bkit 전용 Output Style 개발 | Medium |
| Memory System 활용 | Agent memory frontmatter를 bkit agents에 적용 | High |
| 새 Hook Events 활용 | TeammateIdle/TaskCompleted를 bkit에 통합 | High |
| Skill System 개선 | Plugin name 표시, Budget Scaling 활용 | Medium |

### 1.4 Related Documents

- Previous Test Plan: `docs/01-plan/features/bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.plan.md`
- Previous Report: `docs/04-report/features/bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.report.md`
- bkit Config: `bkit.config.json`
- Claude Code CHANGELOG: https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md
- Agent Teams Docs: https://code.claude.com/docs/en/agent-teams
- Output Styles Docs: https://code.claude.com/docs/en/output-styles
- Sub-agents Docs: https://code.claude.com/docs/en/sub-agents

---

## 2. Claude Code v2.1.32~v2.1.33 심층 분석

### 2.1 Agent Teams (Research Preview)

#### 2.1.1 개요

Agent Teams는 v2.1.32에서 도입된 **다중 Claude Code 인스턴스 협업 시스템**으로, 기존 subagent(Task tool)와 달리 각 teammate가 독립적인 컨텍스트 윈도우를 가지고 **직접 소통**할 수 있습니다.

#### 2.1.2 아키텍처

```
┌─────────────────────────────────────────────┐
│                  Agent Team                  │
├─────────────────────────────────────────────┤
│  Team Lead (Main Session)                   │
│    ├── Teammate A (Independent Context)     │
│    ├── Teammate B (Independent Context)     │
│    └── Teammate C (Independent Context)     │
│                                              │
│  Shared Components:                          │
│    ├── Task List (file-locked)              │
│    ├── Mailbox (message system)             │
│    └── Team Config (config.json)            │
└─────────────────────────────────────────────┘
```

#### 2.1.3 Subagent vs Agent Team 비교

| 속성 | Subagent (Task tool) | Agent Team |
|------|---------------------|------------|
| **컨텍스트** | 독립 윈도우, 결과만 caller에 반환 | 독립 윈도우, 완전 독립 |
| **통신** | 메인 에이전트에만 결과 반환 | Teammate 간 직접 메시지 |
| **조정** | 메인 에이전트가 모든 작업 관리 | 공유 Task List로 자기 조정 |
| **적합한 용도** | 결과만 중요한 집중 작업 | 토론/협업이 필요한 복잡 작업 |
| **토큰 비용** | 낮음 (결과 요약) | 높음 (각 teammate가 별도 인스턴스) |

#### 2.1.4 활성화 방법

```json
// settings.json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

#### 2.1.5 Display Modes

- **In-process**: 메인 터미널에서 모든 teammate 실행, Shift+Up/Down으로 선택
- **Split panes**: tmux 또는 iTerm2에서 각 teammate 별도 pane

#### 2.1.6 핵심 기능

- **Delegate Mode**: Shift+Tab으로 리드를 조정 전용으로 제한
- **Plan Approval**: teammate가 plan mode에서 작업 후 리드 승인 필요
- **Task Self-claim**: file locking으로 경합 방지, teammate가 자동으로 다음 task claim
- **Broadcast**: 모든 teammate에게 동시 메시지 (비용 주의)
- **Graceful Shutdown**: teammate별 종료 요청/승인 메커니즘

#### 2.1.7 저장 구조

```
~/.claude/teams/{team-name}/config.json     # Team 설정
~/.claude/teams/{team-name}/messages/       # 메시지 시스템
~/.claude/tasks/{team-name}/                # Team 스코프 Task
```

#### 2.1.8 환경 변수

```
CLAUDE_CODE_TEAM_NAME       # Team 이름
CLAUDE_CODE_AGENT_ID        # Agent ID
CLAUDE_CODE_AGENT_TYPE      # Agent 유형
```

#### 2.1.9 현재 제한사항

- In-process teammate는 `/resume`, `/rewind` 불가
- Task 상태 동기화 지연 가능
- 세션당 1개 팀만 가능
- 중첩 팀 불가 (teammate는 팀 생성 불가)
- 리드 변경 불가
- Split pane은 tmux/iTerm2 필요 (VSCode 터미널 미지원)

### 2.2 Swarm Mode

#### 2.2.1 개요

"Swarm"은 **커뮤니티에서 Agent Teams 패턴을 지칭하는 비공식 용어**입니다. Anthropic 공식 CHANGELOG에는 "swarm"이라는 용어가 등장하지 않으며, 실체는 Agent Teams + Git Worktree 패턴입니다.

#### 2.2.2 Swarm 패턴 구현

```
Team Lead (Coordinator)
  ├── Frontend Agent → Git Worktree A
  ├── Backend Agent  → Git Worktree B
  ├── Testing Agent  → Git Worktree C
  └── Docs Agent     → Git Worktree D
```

- 각 에이전트가 독립 Git Worktree에서 작업하여 파일 충돌 방지
- TeammateTool로 13개 orchestration 작업 수행
- 대규모 프로젝트에서 5-10x 개발 효율 향상 (Anthropic C compiler 사례: 16개 병렬 인스턴스, 100,000줄 컴파일러 생성)

### 2.3 Output Styles

#### 2.3.1 개요

Output Styles는 Claude Code의 **시스템 프롬프트를 직접 수정**하여 응답 스타일을 변경하는 기능입니다.

#### 2.3.2 버전 히스토리

| 버전 | 변경 |
|------|------|
| ~v1.x | 최초 도입 (Explanatory, Learning 스타일) |
| v2.0.30 | Deprecated (CLAUDE.md/plugins 권장) |
| v2.0.32 | **Un-deprecated** (커뮤니티 피드백으로 복원) |
| v2.1.33 | 현재 안정 상태, keep-coding-instructions frontmatter 추가 |

#### 2.3.3 Built-in Styles

| Style | 설명 |
|-------|------|
| **Default** | 소프트웨어 엔지니어링 작업 최적화 |
| **Explanatory** | 교육적 "Insights" 제공, 구현 선택/패턴 설명 |
| **Learning** | 협업 학습 모드, TODO(human) 마커로 사용자 참여 유도 |

#### 2.3.4 Custom Style 구조

```markdown
---
name: My Custom Style
description: 스타일 설명
keep-coding-instructions: true|false
---

# Custom Style Instructions
커스텀 시스템 프롬프트 내용
```

#### 2.3.5 저장 위치

- User level: `~/.claude/output-styles/`
- Project level: `.claude/output-styles/`

#### 2.3.6 작동 방식

- 모든 output style은 효율적 출력 지시(간결한 응답 등)를 **제외**
- Custom style은 코딩 지시도 제외 (keep-coding-instructions: true로 유지 가능)
- 시스템 프롬프트 끝에 커스텀 지시 추가
- 대화 중 스타일 준수 리마인더 발동

#### 2.3.7 관련 기능 비교

| 기능 | 시스템 프롬프트 수정 | 용도 |
|------|---------------------|------|
| Output Styles | 직접 대체 | 에이전트 성격/톤 변경 |
| CLAUDE.md | user message로 추가 | 프로젝트별 가이드 |
| --append-system-prompt | 끝에 추가 | 시스템 프롬프트 확장 |
| Skills | 별도 프롬프트 | 작업별 재사용 워크플로우 |
| Agents (Subagents) | 별도 설정 | 특정 작업 위임 |

### 2.4 Memory System (v2.1.32~v2.1.33)

#### 2.4.1 Automatic Memory Recording (v2.1.32)

Claude가 작업 중 자동으로 메모리를 기록하고 회상합니다.

#### 2.4.2 Memory Frontmatter (v2.1.33)

Agent 정의에 `memory` frontmatter 필드를 추가하여 영구 메모리를 활성화할 수 있습니다.

```markdown
---
name: my-agent
memory: project    # user | project | local
---
```

| Scope | 범위 | 저장 위치 |
|-------|------|----------|
| user | 모든 프로젝트 | `~/.claude/agent-memory/<name>/` |
| project | 현재 프로젝트 (VCS 공유 가능) | `.claude/agent-memory/<name>/` |
| local | 로컬 전용 (gitignored) | `.claude/agent-memory-local/<name>/` |

활성화 시: MEMORY.md 첫 200줄이 시스템 프롬프트에 포함되며, Read/Write/Edit 도구가 자동 활성화됩니다.

### 2.5 새로운 Hook Events (v2.1.33)

#### 2.5.1 TeammateIdle

Teammate가 작업 완료 후 idle 상태가 되면 발동됩니다.

#### 2.5.2 TaskCompleted

Task가 완료되면 발동됩니다. bkit의 PDCA 워크플로우 자동화에 활용 가능합니다.

### 2.6 Sub-agent 제한 (v2.1.33)

Agent frontmatter의 `tools`에서 `Task(agent_type)` 구문으로 spawn 가능한 sub-agent 유형을 제한할 수 있습니다.

```markdown
---
tools: Read, Grep, Task(Explore), Task(code-reviewer)
---
```

### 2.7 기타 변경사항

| 변경 | 버전 | bkit 영향 |
|------|------|----------|
| Skill Plugin name 표시 | v2.1.33 | bkit skill 식별성 향상 |
| Skill Budget Scaling (2% context) | v2.1.32 | 더 큰 skill description 가능 |
| --add-dir skills 자동 로딩 | v2.1.32 | 플러그인 배포 간소화 |
| TaskUpdate로 task 삭제 가능 | v2.1.33 | Task 관리 유연성 증가 |
| Bash heredoc 템플릿 리터럴 수정 | v2.1.32 | QA hook 안정성 향상 |

---

## 3. bkit v1.5.0 현황 분석

### 3.1 기능 현황

| 카테고리 | 수량 | 상세 |
|----------|------|------|
| Skills | 21개 | pdca, starter, dynamic, enterprise, phase-1~9, code-review, zero-script-qa, claude-code-learning, mobile-app, desktop-app, development-pipeline, bkit-templates, bkit-rules |
| Agents | 11개 | gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect |
| Hook Events | 6개 | SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit, PreCompact |
| Library Functions | 141개 | core(cache, config, debug, file, io, platform), pdca(status, phase, level, tier, automation), intent(language, trigger, ambiguity), task(classification, context, creator, tracker) |
| 다국어 지원 | 8개 | EN, KO, JA, ZH, ES, FR, DE, IT |

### 3.2 Claude Code 기능 의존성 매핑

| bkit 기능 | 의존하는 Claude Code 기능 | 영향 여부 |
|-----------|--------------------------|----------|
| 11 Agents | Task tool (subagent_type) | **영향 있음** - Task(agent_type) 제한 구문 도입 |
| 21 Skills | Skill system, /skill 명령 | **영향 있음** - Plugin name 표시, Budget Scaling |
| PDCA System | Task Management, Hooks | **영향 있음** - TaskCompleted hook, Task delete |
| SessionStart Hook | Hooks system | 영향 없음 |
| Memory System | .bkit-memory.json | **기회** - Memory frontmatter 활용 가능 |
| Auto Triggers | UserPromptSubmit hook | 영향 없음 |

---

## 4. 영향도 분석

### 4.1 Breaking Changes

**공식 Breaking Change 없음** - 단, 다음 행동 변경에 주의가 필요합니다:

- `--resume` 시 `--agent` 값 자동 재사용 (v2.1.32): 자동화 스크립트에서 예상치 못한 동작 가능
- 자동 메모리 기록 (v2.1.32): 컨텍스트 내용의 예측 가능성에 영향
- `PreToolUse` hook의 `decision`/`reason` 필드 deprecated → `hookSpecificOutput.permissionDecision`/`hookSpecificOutput.permissionDecisionReason` 사용 권장 (v2.1.31 이전부터)

### 4.1.1 v2.1.32 알려진 이슈

| 이슈 | 영향 | GitHub Issue |
|------|------|-------------|
| Windows 신규 탭 EBUSY lock 오류 | Windows 사용자 차단 | [#23445](https://github.com/anthropics/claude-code/issues/23445) |
| Opus 4.6 thinking lever 미표시 | /model에서 thinking 슬라이더 없음 | [#23413](https://github.com/anthropics/claude-code/issues/23413) |

### 4.2 호환성 리스크

| 리스크 | 영향도 | 가능성 | 설명 |
|--------|--------|--------|------|
| Agent Teams hook 충돌 | Medium | Low | TeammateIdle/TaskCompleted가 기존 hook과 충돌 가능성 |
| Skill Budget 변경 | Low | Low | 2% scaling으로 description 표시 방식 변경 가능 |
| Task delete API | Low | Low | TaskUpdate에 delete 상태 추가로 기존 로직 검증 필요 |
| Bash heredoc 수정 | Low | Low | QA hook의 bash 명령 호환성 검증 필요 |

### 4.3 기회 분석

| 기회 | 가치 | 구현 난이도 | 설명 |
|------|------|-----------|------|
| **Agent Teams + PDCA** | Very High | High | PDCA 각 단계를 병렬 teammate로 실행 |
| **bkit Output Style** | High | Low | PDCA 가이드 최적화 커스텀 스타일 |
| **Memory Frontmatter** | High | Medium | Agent별 영구 메모리로 학습 효과 |
| **TaskCompleted Hook** | High | Low | PDCA 자동 진행 강화 |
| **TeammateIdle Hook** | Medium | Medium | Team 워크플로우 자동화 |
| **Sub-agent 제한** | Medium | Low | Agent 보안/제어 강화 |

---

## 5. 고도화 계획

### 5.1 Phase 1: 호환성 검증 (Priority: Critical)

기존 bkit v1.5.0의 모든 기능이 Claude Code v2.1.33에서 정상 작동하는지 검증합니다.

#### 5.1.1 검증 대상

| 카테고리 | 테스트 케이스 | 추가 항목 (vs v2.1.31) |
|----------|-------------|----------------------|
| Skills (21) | 63 TC | Skill Budget Scaling, Plugin name 표시 |
| Agents (11) | 33 TC | Task(agent_type) 구문, Memory frontmatter |
| Hooks (6) | 24 TC | TeammateIdle, TaskCompleted 이벤트 공존성 |
| Library (141) | 28 TC | 변경 없음 |
| PDCA Workflow | 12 TC | TaskUpdate delete 상태 |
| v2.1.33 Specific | 20 TC | Agent Teams, Memory, New Hooks |
| Multi-language | 8 TC | 변경 없음 |
| **Total** | **188 TC** | **+5 TC (vs v2.1.31)** |

#### 5.1.2 v2.1.32~v2.1.33 고유 테스트

| TC-ID | 테스트 | 입력 | 기대 결과 | 우선순위 |
|-------|--------|------|----------|---------|
| V1-01 | Opus 4.6 모델 호환 | Agent 호출 시 opus 모델 | 정상 작동 | Critical |
| V1-02 | Skill Plugin name | /bkit 호출 | bkit plugin name 표시 | High |
| V1-03 | Skill Budget Scaling | 긴 description skill | 잘림 없이 표시 | Medium |
| V1-04 | TaskUpdate delete | TaskUpdate(status: deleted) | Task 삭제 성공 | High |
| V1-05 | Bash heredoc fix | JS template literal 포함 | "Bad substitution" 없음 | High |
| V1-06 | --add-dir skills | 추가 디렉토리 skill | 자동 로딩 확인 | Medium |
| V1-07 | TeammateIdle hook 공존 | 기존 hook + TeammateIdle | 충돌 없음 | High |
| V1-08 | TaskCompleted hook 공존 | 기존 hook + TaskCompleted | 충돌 없음 | High |
| V1-09 | Memory frontmatter | Agent에 memory 필드 | 기존 agent 정상 작동 | High |
| V1-10 | Sub-agent 제한 구문 | Task(agent_type) | 기존 Task 호출 정상 | High |

### 5.2 Phase 2: Agent Teams PDCA 통합 (Priority: High)

#### 5.2.1 개념: PDCA Team Mode

bkit의 PDCA 워크플로우를 Agent Teams와 통합하여 **병렬 개발 팀**을 구성합니다.

```
┌──────────────────────────────────────────────────────────────────┐
│                    bkit PDCA Team Mode                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Team Lead (bkit Coordinator)                                    │
│    ├── Architect Teammate    → Design documents, API specs       │
│    ├── Developer Teammate    → Implementation, coding            │
│    ├── QA Teammate           → Testing, gap analysis             │
│    └── Reviewer Teammate     → Code review, security check       │
│                                                                   │
│  Shared Resources:                                                │
│    ├── PDCA Task Board (integrated with bkit Task system)        │
│    ├── Design Documents (docs/02-design/)                        │
│    └── .bkit-memory.json (PDCA state)                            │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 구현 방안

**A. 새로운 Skill: /pdca team**

```
/pdca team {feature}           # PDCA Team Mode 시작
/pdca team status              # Team 상태 확인
/pdca team cleanup             # Team 정리
```

**B. Team 구성 전략 (레벨별)**

| 레벨 | Teammate 구성 | 설명 |
|------|-------------|------|
| Starter | 미지원 | 단일 세션으로 충분 |
| Dynamic | 2 Teammates | Developer + QA |
| Enterprise | 4 Teammates | Architect + Developer + QA + Reviewer |

**C. PDCA Phase별 Team 활용**

| Phase | Team 활용 방안 |
|-------|-------------|
| Plan | 단일 리드 (병렬화 불필요) |
| Design | Architect teammate가 설계, Reviewer가 검토 |
| Do | Developer teammates가 모듈별 병렬 구현 |
| Check | QA teammate가 gap analysis, Reviewer가 code review |
| Act | Developer가 수정, QA가 재검증 (병렬) |

**D. 통합 지점**

1. **bkit hooks → Team hooks**: `TaskCompleted` hook으로 PDCA 자동 진행
2. **bkit agents → Team teammates**: gap-detector, pdca-iterator를 teammate로 실행
3. **bkit Task system → Team Task list**: 공유 Task 보드로 통합

#### 5.2.3 구현 파일

| 파일 | 용도 | 신규/수정 |
|------|------|----------|
| `.claude/skills/pdca-team.md` | /pdca team skill 정의 | 신규 |
| `lib/team/coordinator.js` | Team 생성/관리 로직 | 신규 |
| `lib/team/strategy.js` | 레벨별 Team 전략 | 신규 |
| `lib/pdca/automation.js` | TaskCompleted hook 통합 | 수정 |
| `hooks/stop/pdca-team-stop.sh` | Team 정리 hook | 신규 |

### 5.3 Phase 3: bkit Output Style 개발 (Priority: Medium)

#### 5.3.1 개념: bkit Custom Output Styles

bkit 워크플로우에 최적화된 커스텀 Output Style을 개발합니다.

#### 5.3.2 개발할 스타일

**A. bkit-pdca-guide Style**

```markdown
---
name: bkit-pdca-guide
description: PDCA 워크플로우 가이드 최적화 스타일. 각 단계별 체크리스트와 진행 상황을 자동 표시합니다.
keep-coding-instructions: true
---

# bkit PDCA Guide Style

모든 응답에 현재 PDCA 상태를 포함합니다.
코드 변경 시 Gap 분석을 자동으로 제안합니다.
각 단계 완료 시 다음 단계를 명확하게 안내합니다.
문서 작성 시 bkit 템플릿을 자동으로 적용합니다.
```

**B. bkit-learning Style**

```markdown
---
name: bkit-learning
description: bkit 9-Phase Pipeline과 PDCA를 배우면서 개발하는 교육용 스타일
keep-coding-instructions: true
---

# bkit Learning Style

각 작업 후 "학습 포인트"를 제공합니다.
PDCA 각 단계의 이유와 효과를 설명합니다.
9-Phase Pipeline의 현재 위치와 목적을 알려줍니다.
TODO(learner) 마커로 사용자 참여를 유도합니다.
```

**C. bkit-enterprise Style**

```markdown
---
name: bkit-enterprise
description: Enterprise 레벨 개발에 최적화된 CTO 관점 스타일
keep-coding-instructions: true
---

# bkit Enterprise Style

아키텍처 결정 시 트레이드오프를 분석합니다.
성능, 보안, 확장성 관점을 항상 포함합니다.
인프라 변경 시 비용 영향을 고려합니다.
```

#### 5.3.3 구현 파일

| 파일 | 용도 | 저장 위치 |
|------|------|----------|
| `bkit-pdca-guide.md` | PDCA 가이드 스타일 | `.claude/output-styles/` |
| `bkit-learning.md` | 교육용 스타일 | `.claude/output-styles/` |
| `bkit-enterprise.md` | Enterprise 스타일 | `.claude/output-styles/` |

### 5.4 Phase 4: Memory System 통합 (Priority: High)

#### 5.4.1 Agent Memory Frontmatter 적용

bkit의 11개 Agent에 `memory` frontmatter를 추가하여 세션 간 학습을 가능하게 합니다.

| Agent | Memory Scope | 이유 |
|-------|-------------|------|
| gap-detector | project | 프로젝트별 Gap 패턴 학습 |
| pdca-iterator | project | 반복 개선 히스토리 기억 |
| code-analyzer | project | 프로젝트 코드 패턴 학습 |
| report-generator | project | 보고서 스타일 일관성 유지 |
| starter-guide | user | 사용자 레벨/선호 기억 |
| bkend-expert | project | BaaS 설정/스키마 기억 |
| enterprise-expert | project | 아키텍처 결정 히스토리 기억 |
| design-validator | project | 설계 패턴/컨벤션 기억 |
| qa-monitor | project | QA 이슈 패턴 학습 |
| pipeline-guide | user | 사용자 진행 상황 기억 |
| infra-architect | project | 인프라 설정 기억 |

#### 5.4.2 구현

각 Agent markdown 파일의 frontmatter에 `memory` 필드 추가:

```markdown
---
name: gap-detector
description: ...
tools: Read, Glob, Grep, Task
memory: project
---
```

### 5.5 Phase 5: 새 Hook Events 활용 (Priority: High)

#### 5.5.1 TaskCompleted Hook 활용

```json
{
  "hooks": {
    "TaskCompleted": [
      {
        "matcher": "\\[Plan\\]",
        "hooks": [
          { "type": "command", "command": "./hooks/pdca-auto-advance.sh plan" }
        ]
      },
      {
        "matcher": "\\[Design\\]",
        "hooks": [
          { "type": "command", "command": "./hooks/pdca-auto-advance.sh design" }
        ]
      },
      {
        "matcher": "\\[Check\\]",
        "hooks": [
          { "type": "command", "command": "./hooks/pdca-auto-advance.sh check" }
        ]
      }
    ]
  }
}
```

#### 5.5.2 TeammateIdle Hook 활용 (Team Mode 전용)

```json
{
  "hooks": {
    "TeammateIdle": [
      {
        "hooks": [
          { "type": "command", "command": "./hooks/team-idle-handler.sh" }
        ]
      }
    ]
  }
}
```

#### 5.5.3 구현 파일

| 파일 | 용도 |
|------|------|
| `hooks/pdca-auto-advance.sh` | PDCA Task 완료 시 자동 진행 |
| `hooks/team-idle-handler.sh` | Teammate idle 시 다음 작업 할당 |

### 5.6 Phase 6: Sub-agent 제한 강화 (Priority: Medium)

bkit Agent들의 `tools` 필드에 `Task(agent_type)` 구문을 적용하여 보안과 제어를 강화합니다. 이 구문은 agent frontmatter의 `tools` 필드, `permissions.deny` 배열, `--disallowedTools` CLI 플래그에서도 사용 가능합니다.

| Agent | 허용 Sub-agent | 이유 |
|-------|---------------|------|
| gap-detector | Task(Explore) | 코드 탐색만 필요 |
| pdca-iterator | Task(Explore), Task(gap-detector) | 분석 후 재검증 |
| enterprise-expert | Task(infra-architect), Task(Explore) | 인프라 설계 위임 |
| qa-monitor | Task(Explore) | 로그 탐색만 필요 |

---

## 6. 구현 우선순위 및 로드맵

### 6.1 전체 로드맵

```
Phase 1: 호환성 검증          ──── Critical ────
  └─ 188 TC 실행, 리포트 작성

Phase 2: Agent Teams 통합     ──── High ────────
  ├─ /pdca team skill 개발
  ├─ Team 전략 모듈 개발
  └─ TaskCompleted hook 통합

Phase 3: Output Styles 개발   ──── Medium ──────
  ├─ bkit-pdca-guide style
  ├─ bkit-learning style
  └─ bkit-enterprise style

Phase 4: Memory System 통합   ──── High ────────
  └─ 11개 Agent에 memory frontmatter 추가

Phase 5: Hook Events 활용     ──── High ────────
  ├─ TaskCompleted auto-advance
  └─ TeammateIdle handler

Phase 6: Sub-agent 제한       ──── Medium ──────
  └─ Agent tools에 Task(type) 제한 추가
```

### 6.2 Phase별 산출물

| Phase | 산출물 | 파일 |
|-------|--------|------|
| 1 | 호환성 테스트 리포트 | `docs/04-report/features/bkit-v1.5.1-v2.1.33-compatibility.report.md` |
| 2 | PDCA Team Skill | `.claude/skills/pdca-team.md`, `lib/team/*.js` |
| 3 | Output Styles (3개) | `.claude/output-styles/*.md` |
| 4 | Updated Agents (11개) | `.claude/agents/*.md` (memory 추가) |
| 5 | Hook scripts (2개) | `hooks/pdca-auto-advance.sh`, `hooks/team-idle-handler.sh` |
| 6 | Updated Agent tools | `.claude/agents/*.md` (Task 제한 추가) |

---

## 7. 리스크 및 완화

| 리스크 | 영향 | 가능성 | 완화 전략 |
|--------|------|--------|----------|
| Agent Teams가 실험적 기능 | High | Medium | Feature flag로 선택적 활성화, 기존 기능과 독립 |
| Token 비용 증가 | Medium | High | Team Mode를 Enterprise 레벨로 제한, 비용 경고 표시 |
| Teammate 간 파일 충돌 | High | Medium | Git Worktree 패턴 권장, 모듈별 작업 분리 |
| Memory scope 충돌 | Medium | Low | project scope 기본값, scope 가이드 문서화 |
| v2.1.33 추가 패치 | Low | High | Semantic versioning 준수 시 patch는 호환 |
| Output Style + CLAUDE.md 충돌 | Low | Medium | keep-coding-instructions: true 기본 설정 |

---

## 8. 성공 기준

### 8.1 Phase 1 (호환성)

- [ ] 모든 Critical TC 통과 (100%)
- [ ] High TC 통과 (95%+)
- [ ] 기존 기능 회귀 없음
- [ ] v2.1.33 고유 기능 공존성 확인

### 8.2 Phase 2~6 (고도화)

- [ ] /pdca team skill 정상 작동
- [ ] 3개 Output Styles 정상 적용
- [ ] 11개 Agent memory 기능 작동
- [ ] TaskCompleted hook으로 PDCA 자동 진행 작동
- [ ] Sub-agent 제한이 기존 기능에 영향 없음

### 8.3 전체

| 지표 | 목표 |
|------|------|
| 호환성 Pass Rate | 95%+ |
| 회귀 버그 | 0개 |
| 새 기능 동작률 | 90%+ |
| bkit.config.json 버전 | 1.5.1 |

---

## 9. 참고 자료

### 9.1 공식 문서

- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
- [Agent Teams Documentation](https://code.claude.com/docs/en/agent-teams)
- [Output Styles Documentation](https://code.claude.com/docs/en/output-styles)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)

### 9.2 참고 자료

- [Building a C compiler with parallel Claudes](https://www.anthropic.com/engineering/building-c-compiler)
- [Introducing Claude Opus 4.6](https://www.anthropic.com/news/claude-opus-4-6)
- [Claude Code Swarm Orchestration Skill](https://gist.github.com/kieranklaassen/4f2aba89594a4aea4ad64d753984b2ea)
- [Claude Code's Hidden Multi-Agent System](https://paddo.dev/blog/claude-code-hidden-swarm/)

### 9.3 기존 bkit 문서

- [bkit v1.5.0 + Claude Code v2.1.31 Compatibility Test Plan](../bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.plan.md)
- [bkit v1.5.0 + Claude Code v2.1.31 Compatibility Test Report](../../04-report/features/bkit-v1.5.0-claude-code-v2.1.31-compatibility-test.report.md)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-06 | Initial draft - comprehensive research & plan | bkit Team |

---

*Generated by bkit PDCA Skill | 2026-02-06*
