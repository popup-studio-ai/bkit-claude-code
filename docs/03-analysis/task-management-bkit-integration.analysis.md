# Task Management System + bkit 연동 분석 보고서

> **Feature**: v1.4.7-task-bkit-integration
> **Version**: 1.0.0
> **Date**: 2026-01-28
> **PDCA Phase**: Check (Analysis)
> **Analyst**: Claude Opus 4.5

---

## Executive Summary

bkit v1.4.6에서 Task Management System(TaskCreate, TaskUpdate, TaskList, TaskGet)은 **PDCA 워크플로우의 핵심 추적 시스템**으로 통합되어 있습니다. 본 분석은 코드베이스 전체(agents/, commands/, hooks/, lib/, scripts/, skills/, templates/)를 완전히 조사하여 Task System의 연동 포인트, 데이터 흐름, 현재 한계점을 문서화합니다.

### 주요 발견

| 항목 | 수량 | 설명 |
|------|------|------|
| **Task 관련 함수 (lib/common.js)** | 7개 | Task 생성, 업데이트, 메타데이터 관리 |
| **Task 사용 스크립트** | 3개 | gap-detector-stop, iterator-stop, pdca-skill-stop |
| **task-template 적용 Skills** | 15개 | PDCA, Phase 1-9, Starter/Dynamic/Enterprise 등 |
| **Task tools 허용 Skills** | 1개 | pdca (TaskCreate, TaskUpdate, TaskList 허용) |
| **Task 미지원 플랫폼** | Gemini CLI | TaskCreate/Update 미지원 |

---

## 1. 아키텍처 개요

### 1.1 Task System 연동 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Task Management System 연동 흐름                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────────┐                                               │
│  │  User Request    │                                               │
│  │  /pdca plan X    │                                               │
│  └────────┬─────────┘                                               │
│           │                                                         │
│           ▼                                                         │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │  Skill Loader    │─────▶│ skill-orchestrator│                    │
│  │  (pdca/SKILL.md) │      │ parseSkillFrontmatter()               │
│  └──────────────────┘      │ task-template 추출                     │
│                            └────────┬─────────┘                    │
│                                     │                               │
│                                     ▼                               │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                    lib/common.js                          │      │
│  │  ┌────────────────────────────────────────────────────┐  │      │
│  │  │  autoCreatePdcaTask()                              │  │      │
│  │  │  ├── generatePdcaTaskSubject()                     │  │      │
│  │  │  ├── generatePdcaTaskDescription()                 │  │      │
│  │  │  ├── getPdcaTaskMetadata()                         │  │      │
│  │  │  └── getPreviousPdcaPhase() → blockedBy 설정       │  │      │
│  │  └────────────────────────────────────────────────────┘  │      │
│  └────────────────────────────┬─────────────────────────────┘      │
│                               │                                     │
│                               ▼                                     │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │   Hook Scripts   │      │  Claude Code     │                    │
│  │  (Stop hooks)    │─────▶│  TaskCreate API  │                    │
│  │  - gap-detector  │      │  TaskUpdate API  │                    │
│  │  - iterator      │      │  TaskList API    │                    │
│  │  - pdca-skill    │      └──────────────────┘                    │
│  └──────────────────┘                                               │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 컴포넌트별 역할

| 컴포넌트 | 파일 | Task 관련 역할 |
|----------|------|----------------|
| **lib/common.js** | 3,240줄 | Task 생성/업데이트 핵심 함수 7개 |
| **lib/skill-orchestrator.js** | 489줄 | task-template 파싱, taskInfo 준비 |
| **scripts/gap-detector-stop.js** | 358줄 | Check Phase Task 자동 생성 |
| **scripts/iterator-stop.js** | 350줄 | Act Phase Task 자동 생성 |
| **scripts/pdca-skill-stop.js** | 365줄 | PDCA Phase 전환 시 Task 생성 |
| **skills/pdca/SKILL.md** | 295줄 | Task tools 허용, Task Integration 문서화 |
| **hooks/session-start.js** | 650줄 | Task System 사용 보고 가이드 |

---

## 2. lib/common.js Task 함수 상세 분석

### 2.1 함수 목록 및 위치

| 함수명 | 라인 | 역할 |
|--------|------|------|
| `generatePdcaTaskSubject(phase, feature)` | 843-847 | `[Phase] feature` 형식 제목 생성 |
| `generatePdcaTaskDescription(phase, feature, docPath)` | 856-866 | Phase별 설명 텍스트 생성 |
| `generateTaskGuidance(phase, feature, blockedByPhase)` | 875-892 | Hook additionalContext용 가이던스 |
| `getPreviousPdcaPhase(currentPhase)` | 899-908 | 이전 Phase 조회 (blockedBy용) |
| `getPdcaTaskMetadata(phase, feature, options)` | (implied) | Task 메타데이터 객체 생성 |
| `autoCreatePdcaTask(featureOrConfig, phase, options)` | 1122-1205 | **핵심 함수** - Task 자동 생성 |
| `updatePdcaTaskStatus(phase, feature, options)` | (v1.4.4) | Task 상태 업데이트 |

### 2.2 autoCreatePdcaTask() 상세

```javascript
/**
 * PDCA Task 자동 생성 (v1.4.4)
 *
 * @param {Object|string} featureOrConfig - Feature 이름 또는 설정 객체
 *   - Object: { phase, feature, metadata, iteration }
 *   - string: feature name (deprecated positional)
 * @param {string} phase - PDCA phase ('plan', 'design', 'do', 'check', 'act')
 * @param {Object} options - 추가 옵션
 *   - classification: 'quick_fix' | 'minor_change' | 'feature' | 'major_feature'
 *   - skipTask: boolean - true면 Task 생성 안 함
 *   - blockedBy: string - 선행 Task ID
 *   - metadata: Object - 추가 메타데이터
 *   - iteration: number - Act phase 반복 횟수
 *
 * @returns {Object|null} Task 가이던스 객체 또는 null
 *   {
 *     action: 'TaskCreate',
 *     taskId: string,
 *     subject: string,      // "[Phase] feature"
 *     description: string,
 *     metadata: Object,
 *     blockedBy: string[],
 *     activeForm: string    // 진행 중 표시 텍스트
 *   }
 */
```

### 2.3 Task 생성 조건

| 조건 | 결과 | 설명 |
|------|------|------|
| `classification = 'quick_fix'` | **Skip** | 작은 수정은 Task 불필요 |
| `classification = 'minor_change'` | **Skip** | 작은 변경은 Task 불필요 |
| `classification = 'feature'` | **Create** | blockedBy 없음 |
| `classification = 'major_feature'` | **Create** | blockedBy 자동 설정 |
| `skipTask = true` | **Skip** | 명시적 스킵 |

### 2.4 blockedBy 자동 설정 로직

```
Phase Order: plan → design → do → check → act

blockedBy 규칙:
- [Design] feature → blockedBy: [Plan] feature
- [Do] feature → blockedBy: [Design] feature
- [Check] feature → blockedBy: [Do] feature
- [Act-N] feature → blockedBy: [Check] feature

조건: classification = 'major_feature' 인 경우에만 적용
```

---

## 3. Scripts Task 연동 분석

### 3.1 gap-detector-stop.js

**역할**: Gap Analysis 완료 후 Check Task 생성, 조건부 Act/Report Task 생성

```javascript
// Task 생성 로직 (line 233-300)
const { autoCreatePdcaTask } = require('../lib/common.js');

// 1. Check Task 상태 업데이트
updatePdcaTaskStatus('check', feature, {
  matchRate,
  status: matchRate >= threshold ? 'completed' : 'in_progress',
  fulfillment: fulfillmentResult
});

// 2. [Check] Task 자동 생성
const checkTask = autoCreatePdcaTask({
  phase: 'check',
  feature,
  metadata: { matchRate, fulfillment, analysisDoc }
});

// 3. 조건부 다음 Task 생성
if (matchRate >= threshold) {
  // [Report] Task 생성
  autoCreatePdcaTask({ phase: 'report', feature, ... });
} else if (iterCount < maxIterations) {
  // [Act] Task 생성
  autoCreatePdcaTask({ phase: 'act', feature, iteration: iterCount + 1, ... });
}
```

### 3.2 iterator-stop.js

**역할**: Auto-improve 완료 후 Act Task 생성, 조건부 Report Task 생성

```javascript
// Task 생성 로직 (line 210-277)
const { autoCreatePdcaTask } = require('../lib/common.js');

// 1. Act Task 상태 업데이트
updatePdcaTaskStatus('act', feature, {
  iteration: currentIteration,
  matchRate,
  status: status === 'completed' ? 'completed' : 'in_progress',
  changedFiles
});

// 2. [Act-N] Task 자동 생성
const actTask = autoCreatePdcaTask({
  phase: 'act',
  feature,
  iteration: currentIteration,
  metadata: { matchRateBefore, matchRateAfter, changedFiles, status }
});

// 3. 완료 시 [Report] Task 생성
if (status === 'completed' && matchRate >= threshold) {
  autoCreatePdcaTask({ phase: 'report', feature, ... });
}

// 4. 자동 재분석 트리거 (개선됐지만 미완료 시)
if (status === 'improved' && matchRate < threshold) {
  autoTrigger = { agent: 'gap-detector', ... };
}
```

### 3.3 pdca-skill-stop.js

**역할**: PDCA Skill 완료 후 Phase 전환 및 다음 Task 생성

```javascript
// Phase 전환 맵 (line 40-84)
const PDCA_PHASE_TRANSITIONS = {
  'plan': { next: 'design', skill: '/pdca design', taskTemplate: '[Design] {feature}' },
  'design': { next: 'do', skill: null, taskTemplate: '[Do] {feature}' },
  'do': { next: 'check', skill: '/pdca analyze', taskTemplate: '[Check] {feature}' },
  'check': {
    conditions: [
      { when: ctx => ctx.matchRate >= 90, next: 'report', ... },
      { when: ctx => ctx.matchRate < 90, next: 'act', ... }
    ]
  },
  'act': { next: 'check', skill: '/pdca analyze', taskTemplate: '[Check] {feature}' }
};

// Task 생성 로직 (line 276-315)
const transition = determinePdcaTransition(currentPhase, context);

if (transition && transition.next !== 'completed') {
  // 1. 현재 Phase Task 완료 처리
  updatePdcaTaskStatus(currentPhase, feature, { status: 'completed', ... });

  // 2. 다음 Phase Task 생성
  autoCreatePdcaTask({
    phase: transition.next,
    feature,
    metadata: { previousPhase, suggestedSkill, blockedBy }
  });
}
```

---

## 4. Skills Task 연동 분석

### 4.1 task-template 사용 Skills (15개)

| Skill | task-template | pdca-phase | next-skill |
|-------|---------------|------------|------------|
| **pdca** | `[PDCA] {feature}` | null | null |
| **starter** | `[Init-Starter] {feature}` | plan | phase-1-schema |
| **dynamic** | `[Init-Dynamic] {feature}` | plan | phase-1-schema |
| **enterprise** | `[Init-Enterprise] {feature}` | plan | phase-1-schema |
| **phase-1-schema** | `[Phase-1] {feature}` | plan | phase-2-convention |
| **phase-2-convention** | `[Phase-2] {feature}` | plan | phase-3-mockup |
| **phase-3-mockup** | `[Phase-3] {feature}` | design | phase-4-api |
| **phase-4-api** | `[Phase-4] {feature}` | do | phase-5-design-system |
| **phase-5-design-system** | `[Phase-5] {feature}` | do | phase-6-ui-integration |
| **phase-6-ui-integration** | `[Phase-6] {feature}` | do | phase-7-seo-security |
| **phase-7-seo-security** | `[Phase-7] {feature}` | do | phase-8-review |
| **phase-8-review** | `[Phase-8] {feature}` | check | phase-9-deployment |
| **phase-9-deployment** | `[Phase-9] {feature}` | act | null |
| **code-review** | `[Code-Review] {feature}` | check | null |
| **claude-code-learning** | `[Learn] Claude Code {level}` | null | null |

### 4.2 Task Tools 허용 Skills

**오직 `pdca` skill만 Task tools 직접 사용 가능**:

```yaml
# skills/pdca/SKILL.md
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task          # Task tool (subagent)
  - TaskCreate    # Task 생성
  - TaskUpdate    # Task 업데이트
  - TaskList      # Task 목록 조회
  - AskUserQuestion
```

**다른 Skills는 Task tools 미허용** - Hook scripts를 통해 간접적으로 Task 생성

### 4.3 Skill-Agent 연결과 Task

```yaml
# skills/pdca/SKILL.md
agents:
  analyze: bkit:gap-detector    # → gap-detector-stop.js → Task 생성
  iterate: bkit:pdca-iterator   # → iterator-stop.js → Task 생성
  report: bkit:report-generator # → unified-stop.js
  default: null
```

---

## 5. skill-orchestrator.js Task 처리

### 5.1 task-template 파싱 (line 291)

```javascript
const config = {
  // ... other fields
  'task-template': frontmatter['task-template'] || null,
  // ...
};
```

### 5.2 Task 정보 준비 (orchestrateSkillPre, line 349-381)

```javascript
// task-template이 있고 feature가 있으면 Task 정보 준비
if (config['task-template'] && args.feature) {
  const template = config['task-template'];
  const subject = template.replace('{feature}', args.feature);

  // blockedBy 자동 계산 (PDCA phase 기반)
  const phaseOrder = ['plan', 'design', 'do', 'check', 'act'];
  const currentPhase = config['pdca-phase'];
  const currentIndex = phaseOrder.indexOf(currentPhase);

  let blockedBy = [];
  if (currentIndex > 0) {
    const pdcaStatus = common.getPdcaStatusFull();
    const featureStatus = pdcaStatus?.features?.[args.feature];
    if (featureStatus?.tasks) {
      const previousPhase = phaseOrder[currentIndex - 1];
      const previousTaskId = featureStatus.tasks[previousPhase];
      if (previousTaskId) {
        blockedBy.push(previousTaskId);
      }
    }
  }

  taskInfo = {
    subject,
    description: `PDCA ${currentPhase || 'task'} for ${args.feature}`,
    activeForm: `${subject} 진행 중`,
    blockedBy,
    pdcaPhase: currentPhase
  };
}
```

---

## 6. Hooks 및 Session 연동

### 6.1 hooks.json 구조

```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js",
          "timeout": 10000
        }
      ]
    }
  ]
}
```

**unified-stop.js가 agent/skill 종류에 따라 적절한 stop script 호출**:
- gap-detector → gap-detector-stop.js
- pdca-iterator → iterator-stop.js
- pdca skill → pdca-skill-stop.js

### 6.2 session-start.js Task 보고 가이드

```javascript
// Task System을 "Priority" 기능으로 지정 (line 600-601)
**2. Task System (Priority):**
TaskCreate, TaskUpdate, TaskList, TaskGet

// PDCA Phase별 Task 권장 (line 623-632)
| Current Status | Recommended Skill |
|----------------|-------------------|
| No PDCA | "Start with /pdca plan {feature}" |
| Plan completed | "Design with /pdca design {feature}" |
| ...
```

---

## 7. 데이터 흐름 분석

### 7.1 Task 생성 → 저장 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Task 데이터 흐름                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. Task 생성 요청                                                   │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  autoCreatePdcaTask({ phase: 'design', feature: 'auth' })      │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                      │
│                               ▼                                      │
│  2. Task 가이던스 생성 (lib/common.js)                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  {                                                              │ │
│  │    action: 'TaskCreate',                                        │ │
│  │    taskId: 'design-auth-1706441234567',                         │ │
│  │    subject: '[Design] auth',                                    │ │
│  │    description: "Feature design for 'auth'.",                   │ │
│  │    metadata: { pdcaPhase: 'design', feature: 'auth' },          │ │
│  │    blockedBy: ['[Plan] auth'],                                  │ │
│  │    activeForm: '📐 design phase for auth'                       │ │
│  │  }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                      │
│                               ▼                                      │
│  3. Hook Output (JSON)                                              │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  {                                                              │ │
│  │    decision: 'allow',                                           │ │
│  │    hookEventName: 'Agent:gap-detector:Stop',                    │ │
│  │    autoCreatedTasks: ['design-auth-1706441234567'],             │ │
│  │    systemMessage: 'Task guidance...',                           │ │
│  │    taskGuidance: 'TaskCreate: [Design] auth'                    │ │
│  │  }                                                              │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                      │
│                               ▼                                      │
│  4. Claude Code 해석 → TaskCreate API 호출                          │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Claude가 systemMessage의 taskGuidance를 읽고                   │ │
│  │  TaskCreate tool을 호출하여 실제 Task 생성                       │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                               │                                      │
│                               ▼                                      │
│  5. Task 저장 (Claude Code 내부)                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Task #N created: [Design] auth                                 │ │
│  │  - status: pending                                              │ │
│  │  - blockedBy: [Task #M]                                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 PDCA ↔ Task 상태 동기화

```
┌─────────────────────────────────────────────────────────────────────┐
│                    PDCA ↔ Task 상태 동기화                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  docs/.bkit-memory.json                  Claude Code Task System    │
│  ────────────────────────                ─────────────────────────  │
│  {                                                                   │
│    "activePdca": {                       Task #1: [Plan] auth       │
│      "feature": "auth",        ◀──────▶ status: completed          │
│      "phase": "design",                                              │
│      "matchRate": null                   Task #2: [Design] auth     │
│    }                           ◀──────▶ status: in_progress        │
│  }                                       blockedBy: [Task #1]       │
│                                                                      │
│  동기화 방식:                                                        │
│  1. PDCA phase 변경 → Hook → autoCreatePdcaTask() → Task 생성      │
│  2. Task 완료 → updatePdcaTaskStatus() → .bkit-memory.json 업데이트 │
│                                                                      │
│  ⚠️ 문제점:                                                          │
│  - Task ID가 Claude Code 내부에 저장됨                              │
│  - .bkit-memory.json에는 Task ID 미저장                             │
│  - 세션 간 Task 연속성 보장 안 됨                                    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 8. 현재 한계점 및 개선 필요사항

### 8.1 식별된 한계점

| # | 한계점 | 영향 | 심각도 |
|---|--------|------|--------|
| 1 | **Task ID 영속성 부재** | 세션 재시작 시 Task 연결 끊김 | High |
| 2 | **간접적 Task 생성** | Hook → systemMessage → Claude 해석 필요 | Medium |
| 3 | **Gemini CLI 미지원** | Task tools 없음, TodoWrite로 대체 | High |
| 4 | **Task ↔ PDCA 동기화 불완전** | .bkit-memory.json에 Task ID 미저장 | Medium |
| 5 | **Skills Task tools 제한** | pdca skill만 직접 Task 생성 가능 | Low |
| 6 | **blockedBy 문자열 기반** | Task ID 대신 subject 문자열 사용 | Medium |

### 8.2 상세 분석

#### 8.2.1 Task ID 영속성 부재

```
현재 상태:
- autoCreatePdcaTask()가 taskId 생성: 'design-auth-1706441234567'
- 이 ID는 Hook output의 autoCreatedTasks에 포함
- 하지만 .bkit-memory.json에 저장되지 않음
- 세션 재시작 시 이전 Task 참조 불가

권장 개선:
- .pdca-status.json에 tasks 섹션 추가
- 각 phase별 Task ID 저장
- 세션 복원 시 기존 Task 연결
```

#### 8.2.2 간접적 Task 생성

```
현재 흐름:
1. Hook script가 taskGuidance 생성
2. systemMessage에 Task 생성 지시 포함
3. Claude가 메시지 해석
4. Claude가 TaskCreate tool 호출

문제점:
- Claude가 지시를 무시할 수 있음
- 일관성 없는 Task 생성
- 디버깅 어려움

권장 개선:
- Hook에서 직접 TaskCreate API 호출 (가능하다면)
- 또는 Task 생성 검증 로직 추가
```

#### 8.2.3 Gemini CLI Task 미지원

```
현재 상태:
- Gemini CLI는 TaskCreate, TaskUpdate, TaskList 미지원
- TodoWrite로 대체 시도 (일부 agents)
- PDCA Task 워크플로우 동작 안 함

영향:
- Gemini CLI 사용자는 Task 추적 불가
- PDCA 자동화 기능 제한

권장 개선:
- Gemini CLI용 Task 대체 시스템 구현
- 또는 파일 기반 Task 저장소
```

### 8.3 개선 우선순위

| 우선순위 | 개선 항목 | 예상 효과 |
|----------|-----------|-----------|
| P0 | Task ID .pdca-status.json 저장 | 세션 간 연속성 확보 |
| P1 | Skills에 Task tools 허용 확대 | 직접 Task 생성 가능 |
| P2 | blockedBy Task ID 기반 변경 | 정확한 의존성 추적 |
| P3 | Gemini CLI Task 대체 시스템 | 플랫폼 호환성 향상 |

---

## 9. 코드베이스 Task 연동 매트릭스

### 9.1 전체 매트릭스

| 컴포넌트 | Task 생성 | Task 업데이트 | Task 조회 | task-template |
|----------|-----------|---------------|-----------|---------------|
| **lib/common.js** | autoCreatePdcaTask | updatePdcaTaskStatus | - | - |
| **lib/skill-orchestrator.js** | taskInfo 준비 | - | - | 파싱 |
| **scripts/gap-detector-stop.js** | Check, Act, Report | Check | - | - |
| **scripts/iterator-stop.js** | Act, Report | Act | - | - |
| **scripts/pdca-skill-stop.js** | 다음 Phase | 현재 Phase | - | - |
| **skills/pdca** | TaskCreate tool | TaskUpdate tool | TaskList tool | "[PDCA] {feature}" |
| **skills/starter** | - | - | - | "[Init-Starter] {feature}" |
| **skills/phase-1~9** | - | - | - | "[Phase-N] {feature}" |
| **hooks/session-start.js** | - | - | - | 보고 가이드 |
| **agents/pdca-iterator** | TodoWrite | - | - | - |
| **agents/pipeline-guide** | TodoWrite | - | - | - |

### 9.2 함수 호출 관계

```
┌─────────────────────────────────────────────────────────────────────┐
│                      함수 호출 관계도                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  gap-detector-stop.js                                               │
│  iterator-stop.js          ──┐                                      │
│  pdca-skill-stop.js          │                                      │
│                              ▼                                      │
│                    ┌─────────────────────┐                          │
│                    │  autoCreatePdcaTask │                          │
│                    └──────────┬──────────┘                          │
│                               │                                      │
│           ┌───────────────────┼───────────────────┐                 │
│           ▼                   ▼                   ▼                 │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │
│  │generatePdcaTask│  │generatePdcaTask│  │getPdcaTask     │        │
│  │Subject         │  │Description     │  │Metadata        │        │
│  └────────────────┘  └────────────────┘  └────────────────┘        │
│           │                   │                   │                 │
│           └───────────────────┼───────────────────┘                 │
│                               ▼                                      │
│                    ┌─────────────────────┐                          │
│                    │ getPreviousPdcaPhase │                          │
│                    │ (blockedBy 설정)     │                          │
│                    └─────────────────────┘                          │
│                                                                      │
│  skill-orchestrator.js                                              │
│          │                                                          │
│          ▼                                                          │
│  ┌────────────────────┐                                             │
│  │parseSkillFrontmatter│                                             │
│  │(task-template 추출) │                                             │
│  └──────────┬─────────┘                                             │
│             ▼                                                        │
│  ┌────────────────────┐                                             │
│  │orchestrateSkillPre │                                             │
│  │(taskInfo 준비)      │                                             │
│  └────────────────────┘                                             │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 10. 검증 결과

### 10.1 분석 범위

| 폴더 | 파일 수 | 분석 완료 | Task 연동 |
|------|---------|-----------|-----------|
| agents/ | 11 | ✅ | 2 (TodoWrite) |
| commands/ | 2+ | ✅ | 0 |
| hooks/ | 2 | ✅ | 1 (session-start) |
| lib/ | 7 | ✅ | 2 (common, skill-orchestrator) |
| scripts/ | 39 | ✅ | 3 (gap-detector, iterator, pdca-skill) |
| skills/ | 21 | ✅ | 15 (task-template), 1 (Task tools) |
| templates/ | 14 | ✅ | 0 |

### 10.2 Match Rate

```
분석 완료율: 100%
- 모든 파일 확인
- Task 관련 코드 식별
- 데이터 흐름 추적
- 한계점 도출
```

---

## 11. 결론 및 권장사항

### 11.1 현재 상태 요약

bkit v1.4.6의 Task Management System 연동은 **PDCA 워크플로우 자동화**에 중점을 두고 있습니다:

1. **lib/common.js**가 Task 생성의 핵심 로직 담당
2. **Hook scripts**가 Agent/Skill 완료 시 자동 Task 생성
3. **skill-orchestrator**가 task-template 기반 Task 정보 준비
4. **pdca skill**만 직접 Task tools 사용 가능

### 11.2 v1.4.7 개선 권장사항

| # | 개선 항목 | 설명 | 우선순위 |
|---|-----------|------|----------|
| 1 | Task ID 영속화 | .pdca-status.json에 Task ID 저장 | P0 |
| 2 | Skills Task 허용 확대 | 더 많은 Skills에서 Task tools 사용 | P1 |
| 3 | blockedBy ID 기반 | 문자열 대신 Task ID 참조 | P2 |
| 4 | Task 상태 동기화 | PDCA phase ↔ Task status 실시간 동기화 | P1 |
| 5 | 검증 로직 추가 | Task 생성 성공 여부 확인 | P2 |

---

## 12. bkit 전체 기능 Task 통합 전략

> **목표**: 간단한 수정(quick_fix, minor_change) 외 **모든 bkit 기능**에서 체계적인 Task 생성

### 12.1 bkit 전체 기능 목록

| 분류 | 개수 | 기능 목록 |
|------|------|-----------|
| **Skills** | 21개 | pdca, starter, dynamic, enterprise, phase-1~9, code-review, zero-script-qa, claude-code-learning, mobile-app, desktop-app, development-pipeline, bkit-rules, bkit-templates |
| **Agents** | 11개 | gap-detector, pdca-iterator, report-generator, code-analyzer, design-validator, qa-monitor, pipeline-guide, starter-guide, bkend-expert, enterprise-expert, infra-architect |
| **Commands** | 1개 | bkit (help) |
| **Hooks** | 4개 | session-start, unified-stop, compact, completion-compact |

### 12.2 기능별 Task 생성/관리 매트릭스

#### 12.2.1 Skills Task 매트릭스

| Skill | Task 생성 조건 | Task 명명 규칙 | blockedBy 규칙 | 관리 수명주기 |
|-------|---------------|----------------|----------------|---------------|
| **pdca** | major_feature 시 자동 | `[PDCA] {feature}` | 이전 phase Task | plan→design→do→check→act→report |
| **starter** | project init 시 | `[Init-Starter] {project}` | 없음 | init→phase-1 연결 |
| **dynamic** | project init 시 | `[Init-Dynamic] {project}` | 없음 | init→phase-1 연결 |
| **enterprise** | project init 시 | `[Init-Enterprise] {project}` | 없음 | init→phase-1 연결 |
| **phase-1-schema** | feature 시작 시 | `[Phase-1] {feature}` | Init Task | schema 완료까지 |
| **phase-2-convention** | phase-1 완료 후 | `[Phase-2] {feature}` | Phase-1 Task | convention 완료까지 |
| **phase-3-mockup** | phase-2 완료 후 | `[Phase-3] {feature}` | Phase-2 Task | mockup 완료까지 |
| **phase-4-api** | phase-3 완료 후 | `[Phase-4] {feature}` | Phase-3 Task | API 구현 완료까지 |
| **phase-5-design-system** | phase-4 완료 후 | `[Phase-5] {feature}` | Phase-4 Task | Design System 완료까지 |
| **phase-6-ui-integration** | phase-5 완료 후 | `[Phase-6] {feature}` | Phase-5 Task | UI 통합 완료까지 |
| **phase-7-seo-security** | phase-6 완료 후 | `[Phase-7] {feature}` | Phase-6 Task | SEO/보안 완료까지 |
| **phase-8-review** | phase-7 완료 후 | `[Phase-8] {feature}` | Phase-7 Task | 리뷰 완료까지 |
| **phase-9-deployment** | phase-8 완료 후 | `[Phase-9] {feature}` | Phase-8 Task | 배포 완료까지 |
| **code-review** | PR/코드 리뷰 요청 시 | `[Code-Review] {target}` | 없음 | 리뷰 완료까지 |
| **zero-script-qa** | QA 요청 시 | `[QA] {feature}` | 구현 Task | QA 완료까지 |
| **claude-code-learning** | 학습 시작 시 | `[Learn] Claude Code {level}` | 없음 | 학습 완료까지 |
| **mobile-app** | 모바일 개발 시작 시 | `[Mobile] {feature}` | 기획 Task | 개발 완료까지 |
| **desktop-app** | 데스크톱 개발 시작 시 | `[Desktop] {feature}` | 기획 Task | 개발 완료까지 |
| **development-pipeline** | 파이프라인 설정 시 | `[Pipeline] {project}` | 없음 | 설정 완료까지 |
| **bkit-rules** | 규칙 적용 시 | (자동 적용, Task 불필요) | - | - |
| **bkit-templates** | 템플릿 사용 시 | (자동 적용, Task 불필요) | - | - |

#### 12.2.2 Agents Task 매트릭스

| Agent | Task 생성 조건 | Task 명명 규칙 | blockedBy 규칙 | 관리 수명주기 |
|-------|---------------|----------------|----------------|---------------|
| **gap-detector** | 분석 시작 시 | `[Check] {feature}` | [Do] Task | 분석 완료 → Act/Report 전환 |
| **pdca-iterator** | matchRate < 90% 시 | `[Act-N] {feature}` | [Check] Task | 개선 완료 → 재분석 |
| **report-generator** | matchRate ≥ 90% 시 | `[Report] {feature}` | [Check] Task | 보고서 완료 |
| **code-analyzer** | 코드 분석 요청 시 | `[Analyze] {target}` | 없음 | 분석 완료까지 |
| **design-validator** | 설계 검증 요청 시 | `[Validate-Design] {feature}` | [Design] Task | 검증 완료까지 |
| **qa-monitor** | QA 모니터링 시 | `[QA-Monitor] {feature}` | [Do] Task | 모니터링 완료까지 |
| **pipeline-guide** | 가이드 요청 시 | `[Pipeline-Guide] {project}` | 없음 | 가이드 완료까지 |
| **starter-guide** | 초보자 가이드 요청 시 | `[Starter-Guide] {topic}` | 없음 | 가이드 완료까지 |
| **bkend-expert** | BaaS 관련 작업 시 | `[BaaS] {feature}` | 없음 | 구현 완료까지 |
| **enterprise-expert** | 엔터프라이즈 설계 시 | `[Enterprise] {feature}` | 없음 | 설계 완료까지 |
| **infra-architect** | 인프라 설계 시 | `[Infra] {feature}` | 없음 | 설계 완료까지 |

### 12.3 Task 생성 분류 기준

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Task 생성 분류 결정 트리                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User Request                                                        │
│       │                                                              │
│       ▼                                                              │
│  ┌─────────────────────────────────────────┐                        │
│  │  작업 규모 판단                          │                        │
│  └────────────────┬────────────────────────┘                        │
│                   │                                                  │
│     ┌─────────────┼─────────────┬─────────────┐                     │
│     ▼             ▼             ▼             ▼                     │
│  ┌──────┐   ┌──────────┐  ┌─────────┐  ┌─────────────┐             │
│  │quick │   │minor     │  │feature  │  │major        │             │
│  │_fix  │   │_change   │  │         │  │_feature     │             │
│  └──┬───┘   └────┬─────┘  └────┬────┘  └──────┬──────┘             │
│     │            │              │              │                     │
│     ▼            ▼              ▼              ▼                     │
│  ┌──────────────────┐   ┌──────────────┐  ┌──────────────────┐     │
│  │ Task 생성 안 함   │   │ Task 1개     │  │ Task 체인 생성    │     │
│  │ (즉시 수정)       │   │ (단일 작업)   │  │ (blockedBy 연결)  │     │
│  └──────────────────┘   └──────────────┘  └──────────────────┘     │
│                                                                      │
│  분류 기준:                                                          │
│  ─────────────────────────────────────────────────────────────────  │
│  quick_fix     : 1-3줄 수정, 오타, 단순 버그                        │
│  minor_change  : 10줄 미만 수정, 단일 파일, 단일 기능                │
│  feature       : 10-100줄, 2-5 파일, 새 기능 추가                   │
│  major_feature : 100줄+, 5+ 파일, 아키텍처 변경, PDCA 필요          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 12.4 Skill/Agent별 분류 매핑

| 기능 | 기본 분류 | Task 생성 | 비고 |
|------|-----------|-----------|------|
| **PDCA Skills** | major_feature | ✅ 자동 체인 | Plan→Design→Do→Check→Act |
| **Phase Skills** | feature | ✅ 단일+체인 | 순차 진행 시 blockedBy |
| **Init Skills** | feature | ✅ 단일 | 프로젝트 시작 |
| **Analysis Agents** | feature | ✅ 단일 | gap-detector, code-analyzer |
| **Iteration Agents** | feature | ✅ 체인 | pdca-iterator, Act-N |
| **Guide Agents** | minor_change | ❌ 선택적 | 가이드만 제공 시 불필요 |
| **Expert Agents** | feature | ✅ 단일 | 설계/구현 포함 시 |
| **Utility Skills** | minor_change | ❌ 선택적 | bkit-rules, templates |

### 12.5 Task 자동 생성 확장 계획 (v1.4.7)

#### 현재 상태 (v1.4.6)
```
Task 자동 생성 지원:
✅ pdca skill (직접 TaskCreate 가능)
✅ gap-detector-stop (Hook에서 Check/Act/Report)
✅ iterator-stop (Hook에서 Act-N)
✅ pdca-skill-stop (Hook에서 다음 Phase)
❌ 나머지 Skills/Agents (task-template만 있고 자동 생성 없음)
```

#### 확장 계획 (v1.4.7)
```
1. Phase Skills Task 자동화
   - phase-1~9 stop hook 추가
   - 각 Phase 완료 시 다음 Phase Task 자동 생성
   - blockedBy 자동 연결

2. Analysis Agents Task 확장
   - code-analyzer → [Analyze] Task 자동 생성
   - design-validator → [Validate-Design] Task 자동 생성
   - qa-monitor → [QA-Monitor] Task 자동 생성

3. Expert Agents Task 확장
   - bkend-expert → [BaaS] Task 생성 (구현 포함 시)
   - enterprise-expert → [Enterprise] Task 생성
   - infra-architect → [Infra] Task 생성

4. Guide Agents Task 선택적 생성
   - 실제 구현이 수반될 때만 Task 생성
   - 단순 가이드는 Task 생성 안 함
```

### 12.6 Task 생성 조건 요약 표

| 조건 | Task 생성 여부 | 예시 |
|------|---------------|------|
| 1-3줄 수정 (quick_fix) | ❌ | 오타 수정, 단순 버그 |
| 10줄 미만 (minor_change) | ❌ | 작은 기능 수정 |
| 10-100줄 (feature) | ✅ 단일 Task | 새 컴포넌트 추가 |
| 100줄+ (major_feature) | ✅ Task 체인 | 인증 시스템 구현 |
| PDCA 워크플로우 | ✅ 자동 체인 | /pdca plan auth |
| Phase 순차 진행 | ✅ blockedBy | phase-1 → phase-2 |
| Agent 분석 작업 | ✅ 단일 Task | gap-detector 실행 |
| Agent 반복 개선 | ✅ 체인 (Act-N) | pdca-iterator |
| 단순 가이드 조회 | ❌ | pipeline-guide, starter-guide |
| Expert 구현 작업 | ✅ 단일 Task | bkend-expert 구현 |

### 12.7 구현 우선순위

| 우선순위 | 항목 | 영향 범위 | 예상 작업량 |
|----------|------|-----------|-------------|
| **P0** | Task ID .pdca-status.json 저장 | 전체 | Medium |
| **P0** | phase-1~9 stop hook 추가 | 9 Skills | Large |
| **P1** | Analysis Agents Task 확장 | 3 Agents | Medium |
| **P1** | classification 자동 판단 로직 | lib/common.js | Medium |
| **P2** | Expert Agents Task 확장 | 3 Agents | Medium |
| **P2** | Guide Agents 조건부 Task | 2 Agents | Small |
| **P3** | Task 상태 동기화 강화 | 전체 | Large |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| 1.0.0 | 2026-01-28 | 초기 분석 보고서 작성 |
| 1.1.0 | 2026-01-28 | 12장: bkit 전체 기능 Task 통합 전략 추가 |
