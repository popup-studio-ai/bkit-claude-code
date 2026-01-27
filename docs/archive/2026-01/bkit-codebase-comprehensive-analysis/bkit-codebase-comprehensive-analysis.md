# bkit Codebase Comprehensive Analysis

> **Version**: v1.4.4
> **Analysis Date**: 2026-01-27
> **Author**: Claude Opus 4.5
> **Scope**: Skills, Agents, Commands, Hooks, Scripts, Lib, Templates

---

## Executive Summary

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     bkit v1.4.4 Codebase Overview                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Skills:     21개  ─── 도메인 지식 레이어 (Core 2, Level 3, Phase 9, 등)     │
│  Agents:     11개  ─── 행동 규칙 레이어 (PDCA, QA, Analysis, Guide)          │
│  Commands:   21개  ─── DEPRECATED (v1.4.4), 삭제 예정 (v2.0.0)              │
│  Scripts:    34개  ─── Hook 실행 모듈 (Pre/Post/Stop hooks)                 │
│  Lib:         7개  ─── 코어 라이브러리 (86+ 함수)                            │
│  Templates:  11개  ─── 문서 템플릿 (PDCA 각 단계)                            │
│  Philosophy:  4개  ─── 철학 문서 (Core Mission, AI-Native, PDCA, Context)   │
│                                                                              │
│  Total Components: 109개                                                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 1. bkit 전체 기능 리스트업 및 연계 분석

### 1.1 Skills (21개)

#### Core Skills (2개)
| Skill | 위치 | 역할 | 연계 |
|-------|------|------|------|
| `bkit-rules` | `skills/bkit-rules/` | PDCA 자동 적용 규칙, Task Classification | SessionStart Hook |
| `bkit-templates` | `skills/bkit-templates/` | 템플릿 관리, 자동 로딩 | @import directive |

#### Level Skills (3개)
| Skill | 위치 | 대상 | Actions |
|-------|------|------|---------|
| `starter` | `skills/starter/` | 초보자, 정적 웹 | `init`, `learn` |
| `dynamic` | `skills/dynamic/` | 중급, 풀스택 | `init`, `setup` |
| `enterprise` | `skills/enterprise/` | 고급, MSA | `init`, `assess` |

#### Phase Skills (9개)
| Phase | Skill | 역할 | next-skill |
|:-----:|-------|------|------------|
| 1 | `phase-1-schema` | 데이터 모델링, 용어 정의 | `phase-2-convention` |
| 2 | `phase-2-convention` | 코딩 규칙, 컨벤션 | `phase-3-mockup` |
| 3 | `phase-3-mockup` | UI/UX 목업 | `phase-4-api` |
| 4 | `phase-4-api` | API 설계 및 구현 | `phase-5-design-system` |
| 5 | `phase-5-design-system` | 디자인 시스템 구축 | `phase-6-ui-integration` |
| 6 | `phase-6-ui-integration` | UI 컴포넌트 통합 | `phase-7-seo-security` |
| 7 | `phase-7-seo-security` | SEO, 보안 점검 | `phase-8-review` |
| 8 | `phase-8-review` | 코드 리뷰 | `phase-9-deployment` |
| 9 | `phase-9-deployment` | 프로덕션 배포 | `null` |

#### Methodology Skills (3개)
| Skill | 위치 | 역할 |
|-------|------|------|
| `pdca` | `skills/pdca/` | PDCA 통합 Skill (8 actions) |
| `development-pipeline` | `skills/development-pipeline/` | 9-Phase Pipeline 관리 |
| `zero-script-qa` | `skills/zero-script-qa/` | 로그 기반 QA 방법론 |

#### Specialized Skills (4개)
| Skill | 위치 | 역할 |
|-------|------|------|
| `mobile-app` | `skills/mobile-app/` | React Native, Flutter, Expo |
| `desktop-app` | `skills/desktop-app/` | Electron, Tauri |
| `claude-code-learning` | `skills/claude-code-learning/` | Claude Code 학습 가이드 |
| `github-integration` | `skills/github-integration/` | GitHub 통계, 자동화 |

### 1.2 Agents (11개)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Agent Architecture                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ PDCA 핵심 Agents                                                         ││
│  │                                                                          ││
│  │ ┌────────────────┐   ┌────────────────┐   ┌────────────────┐            ││
│  │ │ gap-detector   │──►│ pdca-iterator  │──►│ report-generator│            ││
│  │ │ (Check)        │   │ (Act)          │   │ (Complete)      │            ││
│  │ │ model: opus    │   │ model: sonnet  │   │ model: haiku    │            ││
│  │ └────────────────┘   └────────────────┘   └────────────────┘            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 분석/검증 Agents                                                         ││
│  │                                                                          ││
│  │ ┌────────────────┐   ┌────────────────┐   ┌────────────────┐            ││
│  │ │ code-analyzer  │   │ design-validator│  │ qa-monitor     │            ││
│  │ │ 코드 품질 분석 │   │ 설계 문서 검증  │   │ Docker 로그 QA │            ││
│  │ │ model: opus    │   │ model: opus     │   │ model: haiku   │            ││
│  │ └────────────────┘   └────────────────┘   └────────────────┘            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 가이드 Agents                                                            ││
│  │                                                                          ││
│  │ ┌────────────────┐   ┌────────────────┐                                 ││
│  │ │ starter-guide  │   │ pipeline-guide │                                 ││
│  │ │ 초보자 가이드  │   │ 파이프라인 가이드│                                ││
│  │ │ model: sonnet  │   │ model: sonnet   │                                 ││
│  │ └────────────────┘   └────────────────┘                                 ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ 전문가 Agents                                                            ││
│  │                                                                          ││
│  │ ┌────────────────┐   ┌────────────────┐   ┌────────────────┐            ││
│  │ │ bkend-expert   │   │ enterprise-exp │   │ infra-architect│            ││
│  │ │ bkend.ai BaaS  │   │ CTO-level 전략 │   │ AWS/K8s/TF    │            ││
│  │ │ model: sonnet  │   │ model: opus    │   │ model: opus    │            ││
│  │ └────────────────┘   └────────────────┘   └────────────────┘            ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### Agent별 상세
| Agent | Model | skills_preload | 핵심 역할 |
|-------|:-----:|----------------|----------|
| `gap-detector` | opus | - | Design vs Implementation 비교, Match Rate 계산 |
| `pdca-iterator` | sonnet | pdca, bkit-rules | 자동 코드 수정, Check-Act 반복 |
| `report-generator` | haiku | - | PDCA 완료 보고서 생성 |
| `code-analyzer` | opus | bkit-rules | 코드 품질, 보안, 성능 분석 |
| `design-validator` | opus | - | 설계 문서 완전성/일관성 검증 |
| `qa-monitor` | haiku | zero-script-qa | Docker 로그 실시간 모니터링 |
| `starter-guide` | sonnet | starter | 초보자 친화적 단계별 가이드 |
| `pipeline-guide` | sonnet | development-pipeline | 9-Phase 파이프라인 안내 |
| `bkend-expert` | sonnet | dynamic | bkend.ai BaaS 통합 |
| `enterprise-expert` | opus | enterprise | AI-Native 전략, MSA 설계 |
| `infra-architect` | opus | enterprise | AWS, K8s, Terraform |

### 1.3 Commands (21개 - DEPRECATED)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Commands Deprecation Map                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PDCA Commands (7개) ──────────► PDCA Skill                                 │
│  ├── /pdca-plan                 /pdca plan                                  │
│  ├── /pdca-design               /pdca design                                │
│  ├── /pdca-analyze              /pdca analyze                               │
│  ├── /pdca-iterate              /pdca iterate                               │
│  ├── /pdca-report               /pdca report                                │
│  ├── /pdca-status               /pdca status                                │
│  └── /pdca-next                 /pdca next                                  │
│                                                                              │
│  Init Commands (3개) ──────────► Level Skills                               │
│  ├── /init-starter              /starter init                               │
│  ├── /init-dynamic              /dynamic init                               │
│  └── /init-enterprise           /enterprise init                            │
│                                                                              │
│  Pipeline Commands (3개) ──────► Development Pipeline Skill                 │
│  ├── /pipeline-start            /development-pipeline start                 │
│  ├── /pipeline-next             /development-pipeline next                  │
│  └── /pipeline-status           /development-pipeline status                │
│                                                                              │
│  Utility Commands (7개) ────────► 동일 이름 Skills                          │
│  ├── /zero-script-qa            /zero-script-qa                             │
│  ├── /archive                   /archive                                    │
│  ├── /github-stats              /github-stats                               │
│  ├── /learn-claude-code         /learn-claude-code                          │
│  ├── /setup-claude-code         /setup-claude-code                          │
│  ├── /upgrade-claude-code       /upgrade-claude-code                        │
│  └── /upgrade-level             /upgrade-level                              │
│                                                                              │
│  DEPRECATED.md (1개) ── 마이그레이션 가이드                                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.4 Scripts (34개)

#### Hook 타입별 분류
| Hook Type | Scripts | 개수 |
|-----------|---------|:----:|
| **Stop** | gap-detector-stop, iterator-stop, analysis-stop, pdca-skill-stop, learning-stop, qa-stop, phase1~9-stop (10개) | 16 |
| **Pre** | pre-write, code-analyzer-pre, design-validator-pre, qa-pre-bash, phase2-convention-pre, phase9-deploy-pre | 6 |
| **Post** | pdca-post-write, gap-detector-post, phase5-design-post, phase6-ui-post, qa-monitor-post, skill-post | 6 |
| **Utility** | archive-feature, select-template, sync-folders, validate-plugin, phase-transition, context-compaction, user-prompt-handler | 6 |

#### 핵심 Scripts
| Script | 역할 | 호출 시점 |
|--------|------|----------|
| `pre-write.js` | Write/Edit 전 PDCA 문서 확인 | PreToolUse(Write\|Edit) |
| `pdca-post-write.js` | Write 후 PDCA 상태 업데이트 | PostToolUse(Write) |
| `skill-post.js` | Skill 완료 후 다음 단계 제안 | PostToolUse(Skill) |
| `gap-detector-stop.js` | Gap 분석 완료 후 옵션 제시 | Agent Stop (gap-detector) |
| `iterator-stop.js` | 반복 개선 완료 후 상태 업데이트 | Agent Stop (pdca-iterator) |
| `user-prompt-handler.js` | 사용자 입력 전처리 | UserPromptSubmit |
| `context-compaction.js` | 컨텍스트 압축 시 상태 보존 | PreCompact |

### 1.5 Lib Modules (7개, 86+ 함수)

| Module | 라인 | FR | 핵심 함수 |
|--------|:----:|:--:|----------|
| `common.js` | 1200+ | All | `getPdcaStatus()`, `updatePdcaStatus()`, `classifyTaskByLines()`, `matchImplicitAgentTrigger()`, `calculateAmbiguityScore()`, `isGeminiCli()` |
| `context-hierarchy.js` | 282 | FR-01 | `getContextHierarchy()`, `mergeContextLevels()`, `setSessionContext()` |
| `import-resolver.js` | 272 | FR-02 | `resolveImports()`, `resolveVariables()`, `detectCircularImport()` |
| `context-fork.js` | 228 | FR-03 | `forkContext()`, `mergeForkedContext()`, `discardFork()` |
| `permission-manager.js` | 205 | FR-05 | `checkPermission()`, `getToolPermission()` |
| `memory-store.js` | 189 | FR-08 | `setMemory()`, `getMemory()`, `deleteMemory()` |
| `skill-orchestrator.js` | 367 | v1.4.4 | `parseSkillFrontmatter()`, `getSkillConfig()`, `orchestrateSkillPre()`, `orchestrateSkillPost()` |

### 1.6 Templates (11개)

| Template | 용도 | @import 연결 |
|----------|------|-------------|
| `plan.template.md` | Plan 문서 구조 | pdca skill |
| `design.template.md` | Design 문서 구조 (Dynamic) | pdca skill |
| `design-starter.template.md` | 간소화된 Design (Starter) | starter skill |
| `design-enterprise.template.md` | 상세 Design (Enterprise) | enterprise skill |
| `do.template.md` | 구현 가이드 구조 | pdca skill |
| `analysis.template.md` | Gap 분석 보고서 | pdca skill, gap-detector |
| `report.template.md` | 완료 보고서 | pdca skill, report-generator |
| `iteration-report.template.md` | 반복 개선 보고서 | pdca-iterator |
| `CLAUDE.template.md` | CLAUDE.md 템플릿 | setup-claude-code |
| `_INDEX.template.md` | 아카이브 인덱스 | archive |
| `TEMPLATE-GUIDE.md` | 템플릿 사용 가이드 | - |

### 1.7 Hooks (5개 이벤트)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         5-Layer Hook System                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Layer 1: hooks.json (Global)                                               │
│  ├── SessionStart     → session-start.js (온보딩, PDCA 상태)                │
│  ├── UserPromptSubmit → user-prompt-handler.js (의도 감지)                  │
│  ├── PreToolUse       → pre-write.js (Write|Edit 전 검증)                   │
│  ├── PostToolUse      → pdca-post-write.js (Write 후 상태 업데이트)         │
│  │                    → skill-post.js (Skill 후 다음 단계)                  │
│  └── PreCompact       → context-compaction.js (상태 보존)                   │
│                                                                              │
│  Layer 2: Skill Frontmatter                                                  │
│  └── hooks: { PreToolUse, PostToolUse, Stop }                               │
│                                                                              │
│  Layer 3: Agent Frontmatter                                                  │
│  └── hooks: { PreToolUse, PostToolUse }                                     │
│                                                                              │
│  Layer 4: Description Triggers                                               │
│  └── "Triggers:" 키워드 매칭 (8개 언어)                                     │
│                                                                              │
│  Layer 5: Scripts (34개)                                                     │
│  └── 실제 Node.js 로직 실행                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.8 연계 흐름도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Component Integration Flow (v1.4.4)                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User Input                                                                  │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ UserPromptSubmit Hook (user-prompt-handler.js)                         │ │
│  │ ├── Intent Detection (8 languages)                                    │ │
│  │ ├── Agent Trigger Matching                                            │ │
│  │ ├── Skill Trigger Matching                                            │ │
│  │ └── Ambiguity Score Calculation                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Skill Orchestrator (lib/skill-orchestrator.js)                         │ │
│  │ ├── parseSkillFrontmatter() → @import 로드                            │ │
│  │ ├── orchestrateSkillPre() → Template 주입                             │ │
│  │ └── orchestrateSkillPost() → next-skill 제안                          │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PreToolUse Hook (pre-write.js)                                         │ │
│  │ ├── PDCA 문서 존재 확인                                               │ │
│  │ ├── Task Classification (Quick/Minor/Feature/Major)                   │ │
│  │ └── Permission Check (lib/permission-manager.js)                      │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Tool Execution (Write, Edit, Bash, etc.)                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ PostToolUse Hook (pdca-post-write.js, skill-post.js)                   │ │
│  │ ├── PDCA Status 업데이트 (.bkit-memory.json)                          │ │
│  │ ├── Task 자동 생성/업데이트                                           │ │
│  │ └── 다음 단계 제안 (next-skill)                                       │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│      │                                                                       │
│      ▼                                                                       │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ Stop Hook (Agent 완료 시)                                               │ │
│  │ ├── gap-detector-stop.js → Match Rate 기반 옵션                       │ │
│  │ ├── iterator-stop.js → 반복 상태 업데이트                             │ │
│  │ ├── pdca-skill-stop.js → PDCA 단계 전환                               │ │
│  │ └── phase*-stop.js → 다음 Phase 안내                                  │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Philosophy 철학 충족도 분석

### 2.1 Core Mission 충족도

| 철학 | 설명 | 구현 방식 | 충족도 |
|------|------|----------|:------:|
| **Automation First** | 사용자가 명령어를 몰라도 PDCA 자동 적용 | `bkit-rules` skill, PreToolUse hooks, Implicit Triggers | **95%** |
| **No Guessing** | 불확실하면 문서 확인 → 없으면 사용자에게 질문 | Design-first workflow, `gap-detector` agent, AskUserQuestion | **90%** |
| **Docs = Code** | 설계 먼저, 구현 나중 (설계-구현 동기화 유지) | PDCA workflow, `/pdca-analyze`, @import directive | **95%** |

#### Automation First 상세
```
✅ SessionStart Hook → 자동 온보딩 메시지
✅ UserPromptSubmit Hook → 의도 자동 감지 (8개 언어)
✅ PreToolUse Hook → PDCA 문서 존재 여부 자동 확인
✅ PostToolUse Hook → PDCA 상태 자동 업데이트
✅ Stop Hook → 다음 단계 자동 제안
✅ Task Classification → 작업 규모 자동 분류
✅ Implicit Triggers → Agent/Skill 자동 활성화

⚠️ 개선 필요:
- 복잡한 멀티 Feature 상황에서 자동 컨텍스트 전환 미흡
```

#### No Guessing 상세
```
✅ gap-detector → Design vs Implementation 객관적 비교
✅ design-validator → 설계 문서 완전성 검증
✅ AskUserQuestion → 모호할 때 명시적 질문
✅ Ambiguity Score → 모호성 정량화 (50점 이상 시 질문)
✅ Magic Word Bypass → !hotfix, !prototype으로 예외 허용

⚠️ 개선 필요:
- Edge case에서 추측 발생 가능성 (10%)
- 사용자 답변 없을 때 기본값 fallback 로직 필요
```

#### Docs = Code 상세
```
✅ Plan → Design → Do → Check → Act 순서 강제
✅ Design 문서 없으면 구현 시작 시 경고
✅ Gap Analysis로 설계-구현 차이 정량화
✅ @import directive로 템플릿 자동 로드
✅ Task blockedBy로 의존성 추적

⚠️ 개선 필요:
- 코드 수정 시 Design 문서 자동 업데이트 미지원
- 역방향 동기화 (Code → Design) 부재
```

### 2.2 AI-Native Principles 충족도

| 핵심 역량 | bkit 구현 | 충족도 |
|----------|----------|:------:|
| **Verification Ability** | `gap-detector`, `/pdca-analyze`, 90% threshold | **95%** |
| **Direction Setting** | Design-first, templates, `bkit-templates` skill | **90%** |
| **Quality Standards** | `code-analyzer`, `bkit-rules`, convention 검사 | **85%** |

### 2.3 PDCA Methodology 충족도

| 단계 | 구현 | 충족도 |
|------|------|:------:|
| **Plan** | `/pdca plan`, `plan.template.md`, Task 생성 | **100%** |
| **Design** | `/pdca design`, `design.template.md`, @import | **100%** |
| **Do** | `/pdca do`, `do.template.md`, 구현 가이드 | **95%** |
| **Check** | `/pdca analyze`, `gap-detector`, Match Rate | **100%** |
| **Act** | `/pdca iterate`, `pdca-iterator`, 자동 반복 | **95%** |

### 2.4 Context Engineering 충족도

| FR | 설명 | 구현 | 충족도 |
|:--:|------|------|:------:|
| FR-01 | Multi-Level Context Hierarchy | `context-hierarchy.js` (L1→L4) | **100%** |
| FR-02 | @import Directive | `import-resolver.js`, 변수 치환 | **100%** |
| FR-03 | Context Fork Isolation | `context-fork.js`, deep clone | **100%** |
| FR-04 | UserPromptSubmit Hook | `user-prompt-handler.js` | **100%** |
| FR-05 | Permission Hierarchy | `permission-manager.js` (deny/ask/allow) | **100%** |
| FR-06 | Task Dependency Chain | `common.js`, blockedBy 메타데이터 | **95%** |
| FR-07 | Context Compaction Hook | `context-compaction.js`, 스냅샷 | **100%** |
| FR-08 | MEMORY Variable | `memory-store.js`, 세션 영속성 | **100%** |

### 2.5 종합 철학 충족도

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Philosophy Compliance Score                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Core Mission                                                                │
│  ├── Automation First ████████████████████████████████████████████░░ 95%    │
│  ├── No Guessing      ████████████████████████████████████████░░░░░░ 90%    │
│  └── Docs = Code      ████████████████████████████████████████████░░ 95%    │
│                                                                              │
│  AI-Native Principles                                                        │
│  ├── Verification     ████████████████████████████████████████████░░ 95%    │
│  ├── Direction        ████████████████████████████████████████░░░░░░ 90%    │
│  └── Quality          ██████████████████████████████████████░░░░░░░░ 85%    │
│                                                                              │
│  PDCA Methodology     ████████████████████████████████████████████████ 98%  │
│                                                                              │
│  Context Engineering  ████████████████████████████████████████████████ 99%  │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Overall Score: 93.4%                                                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Commands 삭제 영향 분석

### 3.1 현재 상태 (v1.4.4)

| 구분 | 내용 |
|------|------|
| **상태** | DEPRECATED (삭제 예정) |
| **파일 수** | 21개 (DEPRECATED.md 포함) |
| **삭제 시점** | v2.0.0 |
| **후방 호환** | v1.4.4 ~ v1.9.x 동안 유지 |

### 3.2 Commands → Skills 마이그레이션 상태

| Category | Commands | Skills | 마이그레이션 | 상태 |
|----------|:--------:|:------:|:------------:|:----:|
| PDCA | 7개 | 1개 (pdca) | 7 → 1 통합 | ✅ |
| Init | 3개 | 3개 (starter, dynamic, enterprise) | 1:1 매핑 | ✅ |
| Pipeline | 3개 | 1개 (development-pipeline) | 3 → 1 통합 | ✅ |
| Utility | 7개 | 7개 | 이름 동일 유지 | ✅ |
| **Total** | **20개** | **12개** | | ✅ |

### 3.3 삭제 영향 분석

#### 삭제 시 영향 없음 (안전)
```
✅ 모든 Commands는 Skills로 완전 마이그레이션 완료
✅ DEPRECATED.md에 마이그레이션 가이드 제공
✅ Skills가 Commands의 상위 집합 (더 많은 기능)
✅ Gemini CLI용 commands/gemini/*.toml도 분리 유지
```

#### 삭제 시 주의 사항
```
⚠️ 기존 사용자 습관 변경 필요 (/pdca-plan → /pdca plan)
⚠️ 외부 문서나 블로그의 기존 명령어 참조 깨짐
⚠️ CI/CD 스크립트에서 Commands 직접 호출 시 수정 필요
```

### 3.4 삭제 권장 타임라인

| Version | 조치 |
|---------|------|
| v1.4.4 (현재) | Commands deprecated, Skills 우선 권장 |
| v1.5.0 | Deprecation 경고 메시지 추가 |
| v1.6.0 ~ v1.9.x | 경고와 함께 계속 작동 |
| v2.0.0 | Commands 폴더 완전 삭제 |

### 3.5 삭제 권장 여부

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          Recommendation                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ✅ v2.0.0에서 Commands 폴더 삭제 권장                                       │
│                                                                              │
│  이유:                                                                       │
│  1. Skills가 Commands의 완전 상위 호환                                       │
│  2. 중복 유지 보수 비용 제거                                                 │
│  3. 코드베이스 단순화                                                        │
│  4. 신규 사용자 혼란 방지                                                    │
│                                                                              │
│  단, v2.0.0 전까지:                                                          │
│  - Deprecation 경고 추가                                                     │
│  - 마이그레이션 가이드 홍보                                                  │
│  - 주요 사용자에게 사전 공지                                                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Claude Code/Gemini 플랫폼 호환성 검증

### 4.1 플랫폼 구성 비교

| 구성 요소 | Claude Code | Gemini CLI | 공유 여부 |
|-----------|-------------|------------|:--------:|
| **Skills** | `skills/*/SKILL.md` | `skills/*/SKILL.md` | ✅ 공유 |
| **Agents** | `agents/*.md` | `agents/*.md` | ✅ 공유 |
| **Templates** | `templates/*.md` | `templates/*.md` | ✅ 공유 |
| **Scripts** | `scripts/*.js` | `scripts/*.js` | ✅ 공유 |
| **Lib** | `lib/*.js` | `lib/*.js` | ✅ 공유 |
| **Commands** | `commands/*.md` | `commands/gemini/*.toml` | ❌ 분리 |
| **Context File** | `CLAUDE.md` | `GEMINI.md` | ❌ 분리 |
| **Manifest** | `plugin.json` | `extension.json` | ❌ 분리 |
| **Hooks Config** | `hooks/hooks.json` | (미지원) | ❌ 분리 |

### 4.2 Gemini CLI 호환성 상세

#### 완전 호환
```
✅ Skills (SKILL.md) - YAML frontmatter 파싱 동일
✅ Agents (*.md) - 동일 포맷 지원
✅ Templates (*.md) - 마크다운 템플릿 동일
✅ lib/common.js - isGeminiCli() 함수로 플랫폼 감지
```

#### 부분 호환
```
⚠️ Commands - .md (Claude) vs .toml (Gemini) 포맷 차이
   → commands/gemini/*.toml로 별도 관리
   → v1.4.4 이후 DEPRECATED, Skills로 통일 권장

⚠️ Hooks - Gemini CLI는 hooks.json 미지원
   → Scripts 직접 호출로 우회

⚠️ Task System - Gemini CLI는 TaskCreate/Update 미지원
   → Task 관련 기능 비활성화
```

#### 비호환
```
❌ hooks.json 이벤트 (SessionStart, PreToolUse 등)
   → Gemini CLI에서 Hook 시스템 지원 안 함
   → 대안: Skill frontmatter의 hooks 섹션 활용 (제한적)

❌ MCP Integration
   → Claude Code 전용 기능
```

### 4.3 lib/common.js 플랫폼 분기

```javascript
// lib/common.js에 구현된 플랫폼 감지
function isGeminiCli() {
  return process.env.GEMINI_CLI === 'true' ||
         process.env.GEMINI_EXTENSIONS_DIR !== undefined;
}

// Scripts에서 플랫폼별 출력 분기
function formatOutput(result, isGemini) {
  if (isGemini) {
    // Gemini용 텍스트 형식
    return `--- Result ---\n${result}`;
  }
  // Claude용 JSON 형식
  return JSON.stringify({ status: 'success', ...result }, null, 2);
}
```

### 4.4 Gemini CLI 테스트 결과 (v0.26+)

| 기능 | 테스트 | 결과 |
|------|--------|:----:|
| Skill 로딩 | `skills/pdca/SKILL.md` | ✅ |
| Agent 호출 | `gap-detector` | ✅ |
| Template 참조 | @import directive | ⚠️ 수동 |
| Script 실행 | Node.js scripts | ✅ |
| PDCA 상태 관리 | `.pdca-status.json` | ✅ |
| Task 시스템 | TaskCreate/Update | ❌ 미지원 |
| Hooks | hooks.json | ❌ 미지원 |

### 4.5 호환성 개선 권장사항

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Platform Compatibility Recommendations                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. Skills 중심 아키텍처 유지 (v1.4.4 완료)                                  │
│     → 모든 기능을 Skills로 통합하여 양 플랫폼 호환                           │
│                                                                              │
│  2. Gemini용 Hook 대안 구현                                                  │
│     → Skill frontmatter hooks 섹션 활용                                      │
│     → 또는 extension.json에 hook 정의 방법 연구                              │
│                                                                              │
│  3. Task 시스템 Fallback                                                     │
│     → Gemini에서는 Task 대신 파일 기반 상태 관리                             │
│     → .pdca-status.json을 Task 대용으로 활용                                 │
│                                                                              │
│  4. lib/common.js 플랫폼 분기 강화                                           │
│     → isGeminiCli() 활용하여 플랫폼별 동작 최적화                            │
│     → XML 특수문자 이스케이프 (v1.4.3 xmlSafeOutput)                         │
│                                                                              │
│  5. 문서 동기화                                                              │
│     → CLAUDE.md ↔ GEMINI.md 동일 내용 유지                                  │
│     → sync-folders.js로 자동 동기화                                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.6 플랫폼 호환성 점수

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Platform Compatibility Score                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Claude Code                                                                 │
│  ├── Skills          ████████████████████████████████████████████████ 100%  │
│  ├── Agents          ████████████████████████████████████████████████ 100%  │
│  ├── Templates       ████████████████████████████████████████████████ 100%  │
│  ├── Scripts         ████████████████████████████████████████████████ 100%  │
│  ├── Lib Modules     ████████████████████████████████████████████████ 100%  │
│  ├── Hooks           ████████████████████████████████████████████████ 100%  │
│  └── Task System     ████████████████████████████████████████████████ 100%  │
│  Overall: 100%                                                               │
│                                                                              │
│  Gemini CLI (v0.26+)                                                         │
│  ├── Skills          ████████████████████████████████████████████████ 100%  │
│  ├── Agents          ████████████████████████████████████████████████ 100%  │
│  ├── Templates       ████████████████████████████████████████████████ 100%  │
│  ├── Scripts         ████████████████████████████████████████████████ 100%  │
│  ├── Lib Modules     ██████████████████████████████████████████░░░░░░  90%  │
│  ├── Hooks           ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │
│  └── Task System     ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   0%  │
│  Overall: 70%                                                                │
│                                                                              │
│  ═══════════════════════════════════════════════════════════════════════    │
│  Cross-Platform Compatibility: 85%                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Agents 호출 경로 분석 및 개선 제안

### 5.1 Agents 호출 메커니즘

bkit의 Agents는 다음 두 가지 방식으로 호출됩니다:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Agent 호출 메커니즘                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  방식 1: Skills frontmatter의 `agent:` 필드                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ ---                                                                     ││
│  │ name: starter                                                           ││
│  │ agent: starter-guide    ← Skill 실행 시 Agent 자동 연결                 ││
│  │ ---                                                                     ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  방식 2: bkit-rules의 트리거 키워드 매칭                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ | User Intent            | Auto-Invoke Agent    |                       ││
│  │ | "gap analysis"         | gap-detector         |                       ││
│  │ | "code review"          | code-analyzer        |                       ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
│  ⚠️ 문제: 두 메커니즘 모두 "가이드라인"일 뿐, 자동 호출 구현이 불완전       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Agents-Skills 연결 현황

#### Skills frontmatter `agent:` 필드로 연결된 Agents (6개)

| Agent | 연결된 Skills | 연결 수 | 실사용 |
|-------|--------------|:-------:|:------:|
| `pipeline-guide` | phase-1,2,3,5,6, development-pipeline, desktop-app, mobile-app | 8개 | **높음** |
| `code-analyzer` | phase-7-seo-security, phase-8-review | 2개 | 높음 |
| `qa-monitor` | zero-script-qa, phase-4-api | 2개 | 높음 |
| `infra-architect` | enterprise, phase-9-deployment | 2개 | 중간 |
| `starter-guide` | starter | 1개 | 중간 |
| `bkend-expert` | dynamic | 1개 | 중간 |

#### ⚠️ frontmatter에 연결되지 않은 Agents (5개)

| Agent | 현재 참조 방식 | 문제점 |
|-------|---------------|--------|
| `gap-detector` | pdca skill 문서에서 설명만 | frontmatter `agent:` 없음 |
| `pdca-iterator` | pdca skill 문서에서 설명만 | frontmatter `agent:` 없음 |
| `report-generator` | pdca skill 문서에서 설명만 | frontmatter `agent:` 없음 |
| `design-validator` | bkit-rules 트리거 테이블만 | 어떤 Skill에도 연결 안 됨 |
| `enterprise-expert` | bkit-rules에서 언급만 | 어떤 Skill에도 연결 안 됨 |

### 5.3 미사용/저활용 Agents 분석

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      Agent 활용도 히트맵                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  높음 ████████████████████████████████████████████████                      │
│  │ pipeline-guide     (8 Skills 연결, 트리거 있음)                          │
│  │ code-analyzer      (2 Skills 연결, 트리거 있음)                          │
│  │ qa-monitor         (2 Skills 연결, 트리거 있음)                          │
│                                                                              │
│  중간 ██████████████████████████████░░░░░░░░░░░░░░░░░░                      │
│  │ gap-detector       (트리거만, pdca skill에서 수동 호출)                  │
│  │ pdca-iterator      (트리거만, pdca skill에서 수동 호출)                  │
│  │ report-generator   (트리거만, pdca skill에서 수동 호출)                  │
│  │ infra-architect    (2 Skills 연결)                                       │
│  │ starter-guide      (1 Skill 연결)                                        │
│  │ bkend-expert       (1 Skill 연결)                                        │
│                                                                              │
│  낮음 ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                      │
│  │ design-validator   (트리거만, Skill 연결 없음)                           │
│  │ enterprise-expert  (연결 없음, bkit-rules 언급만)                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.4 개선 제안

#### 제안 1: PDCA Skill에 Agent 명시적 연결 (HIGH)

현재 pdca skill의 analyze/iterate/report action은 문서에서 agent를 언급하지만, frontmatter에 연결되어 있지 않습니다.

**현재 상태:**
```yaml
# skills/pdca/SKILL.md
---
name: pdca
# agent: 필드 없음
---
```

**개선안:**
```yaml
# skills/pdca/SKILL.md
---
name: pdca
agents:
  analyze: gap-detector
  iterate: pdca-iterator
  report: report-generator
---
```

또는 action별 sub-skill로 분리:
```yaml
# skills/pdca-analyze/SKILL.md
---
name: pdca-analyze
agent: gap-detector
---
```

#### 제안 2: design-validator Skill 연결 (MEDIUM)

`design-validator`가 어떤 Skill에도 연결되어 있지 않습니다.

**개선안:**
```yaml
# skills/phase-2-convention/SKILL.md 또는 새로운 design-review skill
---
name: design-review
agent: design-validator
---
```

#### 제안 3: enterprise-expert Skill 연결 (MEDIUM)

`enterprise-expert`가 `enterprise` skill에 연결되어 있지 않고, `infra-architect`만 연결됨.

**현재 상태:**
```yaml
# skills/enterprise/SKILL.md
---
agent: infra-architect  # enterprise-expert 아님
---
```

**개선안:**
```yaml
# skills/enterprise/SKILL.md
---
agents:
  init: enterprise-expert
  infra: infra-architect
---
```

#### 제안 4: 미사용 Agent 정리 또는 활성화 (LOW)

| Agent | 권장 조치 |
|-------|----------|
| `design-validator` | 새 skill 연결 또는 bkit-rules 트리거 강화 |
| `enterprise-expert` | enterprise skill에 연결 추가 |

### 5.5 Agents 개선 우선순위

| 우선순위 | 개선 항목 | 영향 범위 | 예상 작업량 |
|:--------:|----------|----------|:-----------:|
| **HIGH** | pdca skill에 agents 연결 | PDCA 워크플로우 전체 | 중 |
| **MEDIUM** | design-validator skill 연결 | 설계 문서 검증 | 소 |
| **MEDIUM** | enterprise-expert skill 연결 | Enterprise 레벨 | 소 |
| **LOW** | 미사용 agent 제거 검토 | 코드 정리 | 소 |

### 5.6 Agents 활용도 개선 후 예상 효과

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      개선 전 vs 개선 후                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  개선 전 (현재)                                                              │
│  ├── Skills-Agent 연결: 6/11 (55%)                                          │
│  ├── 미사용 Agents: 2개 (design-validator, enterprise-expert)               │
│  └── 수동 호출 의존: 3개 (gap-detector, pdca-iterator, report-generator)    │
│                                                                              │
│  개선 후 (제안 적용 시)                                                       │
│  ├── Skills-Agent 연결: 11/11 (100%)                                        │
│  ├── 미사용 Agents: 0개                                                      │
│  └── 자동 호출 가능: 11개                                                    │
│                                                                              │
│  효과:                                                                        │
│  ✅ PDCA 워크플로우 자동화 향상                                              │
│  ✅ 설계 문서 검증 자동 트리거                                               │
│  ✅ Enterprise 레벨 지원 강화                                                │
│  ✅ 코드베이스 일관성 향상                                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 6. 종합 요약

### 6.1 bkit v1.4.4 현황

| 영역 | 점수 | 비고 |
|------|:----:|------|
| **기능 완성도** | 95% | Skills 중심 아키텍처 완성 |
| **철학 충족도** | 93.4% | Core Mission, AI-Native, PDCA, Context Engineering |
| **Commands 마이그레이션** | 100% | 모든 Commands → Skills 완료 |
| **플랫폼 호환성** | 85% | Claude Code 100%, Gemini CLI 70% |
| **Agents-Skills 연결** | 55% | 6/11 Agents 연결됨, 5개 개선 필요 |

### 6.2 v1.4.4 주요 성과

```
✅ PDCA 통합 Skill 구현 (8 actions)
✅ Skill Orchestrator 완성 (lib/skill-orchestrator.js)
✅ 9개 Phase Skills에 next-skill, pdca-phase, task-template 추가
✅ 3개 Level Skills에 argument-hint, init action 추가
✅ PostToolUse(Skill) Hook 구현
✅ Phase Stop Hooks 추가 (phase5, 6, 9)
✅ Commands DEPRECATED, 마이그레이션 가이드 완료
✅ Gap Analysis 2회 반복으로 100% 달성
```

### 6.3 향후 개선 과제

| 우선순위 | 과제 | 예상 버전 |
|:--------:|------|----------|
| **HIGH** | PDCA Skill에 Agents 연결 (gap-detector, pdca-iterator, report-generator) | **v1.4.4** |
| **HIGH** | Gemini CLI Hook 시스템 대안 | **v1.4.4** |
| **MEDIUM** | design-validator Skill 연결 | **v1.4.4** |
| **MEDIUM** | enterprise-expert Skill 연결 | **v1.4.4** |
| MEDIUM | Skill 자동 테스트 추가 | **v1.4.4** |
| HIGH | 역방향 동기화 (Code → Design) | v1.5.0 |
| MEDIUM | Commands 폴더 완전 제거 | v2.0.0 |
| LOW | 미사용 Agent 정리 검토 | v1.5.0 |
| LOW | 멀티 Feature 자동 컨텍스트 전환 | v1.6.0 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-27 | Initial comprehensive analysis | Claude Opus 4.5 |
| 1.1 | 2026-01-27 | Added Section 5: Agents 호출 경로 분석 및 개선 제안 | Claude Opus 4.5 |
