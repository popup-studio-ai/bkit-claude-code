# Task Management System + bkit PDCA 연동 강화 상세설계서

> **Summary**: Claude Code Task System과 bkit PDCA 워크플로우의 완전한 통합 - Task 영속성, 자동 체인, Check↔Act 반복 사이클 구현
>
> **Project**: bkit-claude-code
> **Version**: 1.4.7
> **Author**: Claude Opus 4.5
> **Date**: 2026-01-29
> **Status**: Draft
> **Planning Doc**: [task-bkit-integration.plan.md](../01-plan/features/task-bkit-integration.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. **Task 영속성 확보**: 세션 간 Task ID 연결 유지 (.pdca-status.json 확장)
2. **자동 Task 체인**: PDCA 시작 시 전체 Task 체인 사전 생성
3. **Check↔Act 자동 반복**: matchRate < 90% 시 자동 개선 사이클 (최대 5회)
4. **통합 Task 추적**: 모든 Skills/Agents에서 일관된 Task 생성/관리

### 1.2 Design Principles

- **Single Source of Truth**: .pdca-status.json을 Task 상태의 중앙 저장소로 사용
- **Backward Compatibility**: 기존 autoCreatePdcaTask() API 유지
- **Fail-Safe**: Task 생성 실패 시에도 워크플로우 계속 진행
- **Idempotency**: 동일 요청에 대해 중복 Task 생성 방지

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         Task + bkit Integration Architecture                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                         User Layer                                      │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │ │
│  │  │ /pdca plan  │  │/pdca design │  │ /pdca do    │  │/pdca analyze│   │ │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │ │
│  └─────────┼────────────────┼────────────────┼────────────────┼──────────┘ │
│            │                │                │                │            │
│  ┌─────────▼────────────────▼────────────────▼────────────────▼──────────┐ │
│  │                      Skill Orchestration Layer                         │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │              lib/skill-orchestrator.js                          │   │ │
│  │  │  ┌─────────────────────┐  ┌─────────────────────────────────┐  │   │ │
│  │  │  │ parseSkillFrontmatter│  │ prepareTaskInfo() [NEW]         │  │   │ │
│  │  │  │ (task-template 추출) │  │ - blockedBy 자동 계산           │  │   │ │
│  │  │  └─────────────────────┘  │ - Task ID lookup                │  │   │ │
│  │  │                            └─────────────────────────────────┘  │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐ │
│  │                        Core Function Layer                             │ │
│  │  ┌────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    lib/common.js                                │   │ │
│  │  │                                                                  │   │ │
│  │  │  ┌─────────────────────────────────────────────────────────┐   │   │ │
│  │  │  │            Task Management Functions                     │   │   │ │
│  │  │  │  ┌──────────────────┐  ┌──────────────────────────────┐ │   │   │ │
│  │  │  │  │autoCreatePdcaTask│  │createPdcaTaskChain() [NEW]   │ │   │   │ │
│  │  │  │  │  (기존, 확장)    │  │ - 전체 체인 사전 생성        │ │   │   │ │
│  │  │  │  └────────┬─────────┘  └──────────────────────────────┘ │   │   │ │
│  │  │  │           │                                              │   │   │ │
│  │  │  │  ┌────────▼─────────┐  ┌──────────────────────────────┐ │   │   │ │
│  │  │  │  │savePdcaTaskId()  │  │getPdcaTaskId() [NEW]         │ │   │   │ │
│  │  │  │  │  [NEW]           │  │ - 세션 간 Task ID 복원       │ │   │   │ │
│  │  │  │  └──────────────────┘  └──────────────────────────────┘ │   │   │ │
│  │  │  │                                                          │   │   │ │
│  │  │  │  ┌──────────────────┐  ┌──────────────────────────────┐ │   │   │ │
│  │  │  │  │updatePdcaTask    │  │triggerNextPdcaAction() [NEW] │ │   │   │ │
│  │  │  │  │Status() (확장)   │  │ - Check↔Act 자동 전환        │ │   │   │ │
│  │  │  │  └──────────────────┘  └──────────────────────────────┘ │   │   │ │
│  │  │  └─────────────────────────────────────────────────────────┘   │   │ │
│  │  └────────────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────────────┘ │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐ │
│  │                         Hook Layer                                     │ │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐   │ │
│  │  │gap-detector    │  │iterator        │  │pdca-skill              │   │ │
│  │  │-stop.js        │  │-stop.js        │  │-stop.js                │   │ │
│  │  │                │  │                │  │                        │   │ │
│  │  │• Check Task    │  │• Act-N Task    │  │• Phase 전환 Task       │   │ │
│  │  │• matchRate 저장│  │• 자동 재분석   │  │• 다음 Phase 생성       │   │ │
│  │  │• Act/Report    │  │• Report 생성   │  │                        │   │ │
│  │  │  분기 결정     │  │                │  │                        │   │ │
│  │  └───────┬────────┘  └───────┬────────┘  └───────────┬────────────┘   │ │
│  │          │                   │                       │                 │ │
│  │          └───────────────────┼───────────────────────┘                 │ │
│  │                              │                                         │ │
│  └──────────────────────────────┼─────────────────────────────────────────┘ │
│                                 │                                          │
│  ┌──────────────────────────────▼──────────────────────────────────────────┐│
│  │                        Storage Layer                                     ││
│  │  ┌─────────────────────────────────────────────────────────────────┐    ││
│  │  │                    .pdca-status.json (확장)                      │    ││
│  │  │  {                                                               │    ││
│  │  │    "features": {                                                 │    ││
│  │  │      "{feature}": {                                              │    ││
│  │  │        "phase": "check",                                         │    ││
│  │  │        "tasks": {           // [NEW] Task ID 영속 저장           │    ││
│  │  │          "plan": "plan-auth-1706500000000",                      │    ││
│  │  │          "design": "design-auth-1706500001000",                  │    ││
│  │  │          "do": "do-auth-1706500002000",                          │    ││
│  │  │          "check": "check-auth-1706500003000",                    │    ││
│  │  │          "act": ["act-1-auth-...", "act-2-auth-..."],            │    ││
│  │  │          "report": null                                          │    ││
│  │  │        },                                                        │    ││
│  │  │        "taskChainCreated": true  // [NEW] 체인 생성 여부         │    ││
│  │  │      }                                                           │    ││
│  │  │    }                                                             │    ││
│  │  │  }                                                               │    ││
│  │  └─────────────────────────────────────────────────────────────────┘    ││
│  └─────────────────────────────────────────────────────────────────────────┘│
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Check↔Act 반복 사이클 Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Check↔Act Iteration Cycle Flow                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  [Do Phase 완료]                                                            │
│       │                                                                      │
│       ▼                                                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ /pdca analyze {feature}                                                 │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │ gap-detector Agent 실행                                                 │ │
│  │     │                                                                   │ │
│  │     ▼                                                                   │ │
│  │ gap-detector-stop.js                                                    │ │
│  │     │                                                                   │ │
│  │     ├──────────────────────────────────────────────────────────────┐   │ │
│  │     │                    matchRate 확인                             │   │ │
│  │     └──────────────────────────────────────────────────────────────┘   │ │
│  │                              │                                          │ │
│  │           ┌──────────────────┼──────────────────┐                      │ │
│  │           ▼                  ▼                  ▼                      │ │
│  │     matchRate >= 90%   70% <= rate < 90%   rate < 70%                  │ │
│  │           │                  │                  │                      │ │
│  │           ▼                  ▼                  ▼                      │ │
│  │     ┌──────────┐       ┌──────────┐       ┌──────────┐                │ │
│  │     │ [Report] │       │ [Act-N]  │       │ [Act-N]  │                │ │
│  │     │ Task생성 │       │ Task생성 │       │ Task생성 │                │ │
│  │     └────┬─────┘       └────┬─────┘       │ (강력권장)│                │ │
│  │          │                  │             └────┬─────┘                │ │
│  │          ▼                  │                  │                      │ │
│  │     ┌──────────┐            └──────────────────┘                      │ │
│  │     │ /pdca    │                    │                                 │ │
│  │     │ report   │                    ▼                                 │ │
│  │     └──────────┘            iterationCount < 5?                       │ │
│  │                                     │                                 │ │
│  │                        Yes ─────────┼───────── No                     │ │
│  │                         │           │           │                     │ │
│  │                         ▼           │           ▼                     │ │
│  │                  ┌──────────────┐   │   ┌──────────────────┐         │ │
│  │                  │ pdca-iterator│   │   │ Manual Review    │         │ │
│  │                  │ Agent 실행   │   │   │ Required         │         │ │
│  │                  └──────┬───────┘   │   └──────────────────┘         │ │
│  │                         │           │                                 │ │
│  │                         ▼           │                                 │ │
│  │                  iterator-stop.js   │                                 │ │
│  │                         │           │                                 │ │
│  │           ┌─────────────┼───────────┼─────────────┐                  │ │
│  │           ▼             ▼           ▼             ▼                  │ │
│  │     status=completed status=improved status=max status=unknown       │ │
│  │           │             │           │             │                  │ │
│  │           ▼             ▼           ▼             ▼                  │ │
│  │     ┌──────────┐  ┌──────────┐ ┌─────────┐  ┌──────────┐            │ │
│  │     │ [Report] │  │autoTrigger│ │ Manual  │  │ Re-run   │            │ │
│  │     │ Task생성 │  │gap-detect│ │ Review  │  │ analyze  │            │ │
│  │     └──────────┘  └────┬─────┘ └─────────┘  └──────────┘            │ │
│  │                        │                                             │ │
│  │                        └─────────────────────────────────────────────┼─┘ │
│  │                                      (자동 재분석으로 돌아감)          │   │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| skill-orchestrator.js | lib/common.js | Task 함수 호출 |
| gap-detector-stop.js | lib/common.js | autoCreatePdcaTask, savePdcaTaskId |
| iterator-stop.js | lib/common.js | autoCreatePdcaTask, triggerNextPdcaAction |
| pdca-skill-stop.js | lib/common.js | 전체 Task chain 관리 |
| .pdca-status.json | - | Task ID 영속 저장소 |

---

## 3. Data Model

### 3.1 .pdca-status.json 스키마 확장

```typescript
// 기존 스키마 + 확장
interface PdcaStatusExtended {
  version: "2.1";  // 버전 업그레이드
  features: {
    [featureName: string]: {
      // 기존 필드
      phase: PdcaPhase;
      phaseNumber: number;
      matchRate: number | null;
      iterationCount: number;
      requirements: string[];
      documents: Record<string, string>;
      timestamps: {
        started: string;
        lastUpdated: string;
        completed?: string;
      };

      // [NEW] Task 영속화 필드
      tasks: {
        plan: string | null;      // Task ID
        design: string | null;
        do: string | null;
        check: string | null;
        act: string[];            // 반복 Act Task IDs
        report: string | null;
      };
      taskChainCreated: boolean;  // 체인 생성 완료 여부
      currentTaskId: string | null; // 현재 활성 Task
    };
  };
}

type PdcaPhase = 'plan' | 'design' | 'do' | 'check' | 'act' | 'report' | 'archived';
```

### 3.2 Task ID 형식

```typescript
// Task ID Convention
type TaskIdFormat = `${phase}-${feature}-${timestamp}`;

// Examples:
// plan-user-auth-1706500000000
// design-user-auth-1706500001000
// act-1-user-auth-1706500004000  (iteration 포함)
// act-2-user-auth-1706500005000
```

### 3.3 Task Chain 데이터 구조

```typescript
interface TaskChainEntry {
  id: string;           // Task ID
  phase: PdcaPhase;
  subject: string;      // "[Phase] feature"
  description: string;
  status: TaskStatus;
  blockedBy: string[];  // Task IDs
  metadata: {
    pdcaPhase: string;
    pdcaOrder: number;
    feature: string;
    createdAt: string;
    iteration?: number;
    matchRate?: number;
  };
}

type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked' | 'failed';

interface TaskChain {
  feature: string;
  entries: TaskChainEntry[];
  createdAt: string;
}
```

---

## 4. API Specification

### 4.1 New Functions in lib/common.js

#### 4.1.1 `createPdcaTaskChain(feature, options)`

```typescript
/**
 * PDCA 전체 Task 체인 생성 (P0)
 *
 * @param feature - Feature 이름
 * @param options - 옵션
 *   - skipIfExists: boolean - 기존 체인 있으면 스킵 (default: true)
 *   - includeReport: boolean - Report Task 포함 (default: true)
 *
 * @returns TaskChain 객체 또는 null (이미 존재 시)
 */
function createPdcaTaskChain(
  feature: string,
  options?: { skipIfExists?: boolean; includeReport?: boolean }
): TaskChain | null;
```

**구현 로직:**
```javascript
function createPdcaTaskChain(feature, options = {}) {
  const { skipIfExists = true, includeReport = true } = options;

  // 1. 기존 체인 확인
  const pdcaStatus = getPdcaStatusFull();
  if (skipIfExists && pdcaStatus?.features?.[feature]?.taskChainCreated) {
    debugLog('TaskChain', 'Chain already exists, skipping', { feature });
    return null;
  }

  // 2. Task 체인 생성
  const timestamp = Date.now();
  const phases = ['plan', 'design', 'do', 'check'];
  if (includeReport) phases.push('report');

  const entries = phases.map((phase, index) => ({
    id: `${phase}-${feature}-${timestamp + index}`,
    phase,
    subject: generatePdcaTaskSubject(phase, feature),
    description: generatePdcaTaskDescription(phase, feature),
    status: index === 0 ? 'in_progress' : 'pending',
    blockedBy: index > 0 ? [entries[index - 1].id] : [],
    metadata: getPdcaTaskMetadata(phase, feature)
  }));

  // 3. .pdca-status.json에 저장
  savePdcaTaskChain(feature, entries);

  // 4. 결과 반환
  return { feature, entries, createdAt: new Date().toISOString() };
}
```

#### 4.1.2 `savePdcaTaskId(feature, phase, taskId)`

```typescript
/**
 * Task ID를 .pdca-status.json에 저장 (P0)
 *
 * @param feature - Feature 이름
 * @param phase - PDCA phase
 * @param taskId - 저장할 Task ID
 * @param options - 옵션
 *   - iteration: number - Act phase 반복 횟수
 *
 * @returns boolean - 저장 성공 여부
 */
function savePdcaTaskId(
  feature: string,
  phase: PdcaPhase,
  taskId: string,
  options?: { iteration?: number }
): boolean;
```

**구현 로직:**
```javascript
function savePdcaTaskId(feature, phase, taskId, options = {}) {
  try {
    const pdcaStatus = getPdcaStatusFull();

    // 1. Feature 초기화
    if (!pdcaStatus.features[feature]) {
      pdcaStatus.features[feature] = {
        phase: phase,
        tasks: { plan: null, design: null, do: null, check: null, act: [], report: null }
      };
    }
    if (!pdcaStatus.features[feature].tasks) {
      pdcaStatus.features[feature].tasks = {
        plan: null, design: null, do: null, check: null, act: [], report: null
      };
    }

    // 2. Task ID 저장
    if (phase === 'act') {
      // Act는 배열로 관리 (반복)
      pdcaStatus.features[feature].tasks.act.push(taskId);
    } else {
      pdcaStatus.features[feature].tasks[phase] = taskId;
    }

    // 3. 현재 Task 업데이트
    pdcaStatus.features[feature].currentTaskId = taskId;

    // 4. 저장
    savePdcaStatus(pdcaStatus);
    debugLog('TaskPersistence', 'Task ID saved', { feature, phase, taskId });
    return true;
  } catch (e) {
    debugLog('TaskPersistence', 'Failed to save Task ID', { error: e.message });
    return false;
  }
}
```

#### 4.1.3 `getPdcaTaskId(feature, phase)`

```typescript
/**
 * 저장된 Task ID 조회 (P0)
 *
 * @param feature - Feature 이름
 * @param phase - PDCA phase
 * @param options - 옵션
 *   - iteration: number - Act phase 특정 반복 조회
 *   - latest: boolean - Act phase 최신 Task (default: true)
 *
 * @returns Task ID 또는 null
 */
function getPdcaTaskId(
  feature: string,
  phase: PdcaPhase,
  options?: { iteration?: number; latest?: boolean }
): string | null;
```

#### 4.1.4 `triggerNextPdcaAction(feature, currentPhase, context)`

```typescript
/**
 * Check↔Act 자동 반복 트리거 (P0)
 *
 * @param feature - Feature 이름
 * @param currentPhase - 현재 완료된 phase
 * @param context - 컨텍스트
 *   - matchRate: number - Check 결과 matchRate
 *   - iterationCount: number - 현재 반복 횟수
 *   - maxIterations: number - 최대 반복 (default: 5)
 *   - threshold: number - 완료 기준 matchRate (default: 90)
 *
 * @returns { nextAction, taskId, autoTrigger } 또는 null
 */
function triggerNextPdcaAction(
  feature: string,
  currentPhase: PdcaPhase,
  context: {
    matchRate?: number;
    iterationCount?: number;
    maxIterations?: number;
    threshold?: number;
  }
): TriggerResult | null;
```

**구현 로직:**
```javascript
function triggerNextPdcaAction(feature, currentPhase, context = {}) {
  const {
    matchRate = 0,
    iterationCount = 0,
    maxIterations = 5,
    threshold = 90
  } = context;

  // Check phase 완료 후 분기
  if (currentPhase === 'check') {
    if (matchRate >= threshold) {
      // Report로 진행
      const taskId = autoCreatePdcaTask({ phase: 'report', feature });
      return {
        nextAction: 'report',
        taskId: taskId?.taskId,
        autoTrigger: null,
        message: `Match rate ${matchRate}% >= ${threshold}%. Ready for report.`
      };
    } else if (iterationCount < maxIterations) {
      // Act로 진행
      const taskId = autoCreatePdcaTask({
        phase: 'act',
        feature,
        iteration: iterationCount + 1
      });
      return {
        nextAction: 'act',
        taskId: taskId?.taskId,
        autoTrigger: { agent: 'pdca-iterator', skill: '/pdca iterate' },
        message: `Match rate ${matchRate}% < ${threshold}%. Starting iteration ${iterationCount + 1}.`
      };
    } else {
      // 최대 반복 도달
      return {
        nextAction: 'manual',
        taskId: null,
        autoTrigger: null,
        message: `Max iterations (${maxIterations}) reached. Manual review required.`
      };
    }
  }

  // Act phase 완료 후
  if (currentPhase === 'act') {
    // Check로 돌아가기 (재분석)
    return {
      nextAction: 'check',
      taskId: getPdcaTaskId(feature, 'check'),
      autoTrigger: { agent: 'gap-detector', skill: '/pdca analyze' },
      message: 'Iteration complete. Re-running gap analysis.'
    };
  }

  return null;
}
```

### 4.2 Modified Functions

#### 4.2.1 `autoCreatePdcaTask()` 확장

```javascript
// 기존 시그니처 유지
function autoCreatePdcaTask(featureOrConfig, phase, options = {}) {
  // ... 기존 로직 ...

  // [NEW] Task ID 영속화
  const taskId = `${actualPhase}-${actualFeature}-${Date.now()}`;

  // [NEW] Task ID 저장
  savePdcaTaskId(actualFeature, actualPhase, taskId, {
    iteration: actualOptions.iteration
  });

  // [NEW] blockedBy를 Task ID로 변환
  let resolvedBlockedBy = [];
  if (blockedBy.length === 0 && classification === 'major_feature') {
    const prevPhase = getPreviousPdcaPhase(actualPhase);
    if (prevPhase) {
      const prevTaskId = getPdcaTaskId(actualFeature, prevPhase);
      if (prevTaskId) {
        resolvedBlockedBy.push(prevTaskId);
      }
    }
  }

  return {
    action: 'TaskCreate',
    taskId,
    subject,
    description,
    metadata: finalMetadata,
    blockedBy: resolvedBlockedBy,  // Task ID 기반
    activeForm
  };
}
```

---

## 5. Implementation Guide

### 5.1 File Structure

```
.claude/
├── lib/
│   ├── common.js                 # [MODIFY] Task 함수 추가/확장
│   └── skill-orchestrator.js     # [MODIFY] Task chain 통합
├── scripts/
│   ├── gap-detector-stop.js      # [MODIFY] Task ID 저장, 자동 반복
│   ├── iterator-stop.js          # [MODIFY] Task ID 저장, 자동 재분석
│   ├── pdca-skill-stop.js        # [MODIFY] Task chain 생성 통합
│   └── unified-stop.js           # [NO CHANGE]
├── skills/
│   └── pdca/
│       └── SKILL.md              # [MODIFY] Task 체인 문서화
└── docs/
    └── .pdca-status.json         # [MODIFY] tasks 필드 추가
```

### 5.2 Implementation Order

```
Phase 1: Task ID 영속화 (P0)
────────────────────────────────────────────────────────────────
Step 1.1: lib/common.js - savePdcaTaskId() 함수 추가
Step 1.2: lib/common.js - getPdcaTaskId() 함수 추가
Step 1.3: lib/common.js - autoCreatePdcaTask() 수정 (Task ID 저장 호출)
Step 1.4: scripts/gap-detector-stop.js - savePdcaTaskId 호출 추가
Step 1.5: scripts/iterator-stop.js - savePdcaTaskId 호출 추가
Step 1.6: scripts/pdca-skill-stop.js - savePdcaTaskId 호출 추가
────────────────────────────────────────────────────────────────

Phase 2: Task Chain 자동 생성 (P0)
────────────────────────────────────────────────────────────────
Step 2.1: lib/common.js - createPdcaTaskChain() 함수 추가
Step 2.2: lib/common.js - savePdcaTaskChain() 헬퍼 추가
Step 2.3: scripts/pdca-skill-stop.js - plan 시작 시 체인 생성 호출
Step 2.4: skills/pdca/SKILL.md - Task 체인 문서 업데이트
────────────────────────────────────────────────────────────────

Phase 3: Check↔Act 자동 반복 (P0)
────────────────────────────────────────────────────────────────
Step 3.1: lib/common.js - triggerNextPdcaAction() 함수 추가
Step 3.2: scripts/gap-detector-stop.js - 자동 Act 트리거 강화
Step 3.3: scripts/iterator-stop.js - 자동 Check 재실행 강화
Step 3.4: 반복 횟수 제한 검증 로직 추가
────────────────────────────────────────────────────────────────

Phase 4: blockedBy ID 기반 변경 (P1)
────────────────────────────────────────────────────────────────
Step 4.1: lib/common.js - autoCreatePdcaTask() blockedBy 로직 수정
Step 4.2: lib/skill-orchestrator.js - blockedBy 계산 로직 수정
Step 4.3: 세션 복원 시 blockedBy 재연결 로직
────────────────────────────────────────────────────────────────

Phase 5: Skills/Agents Task 확장 (P1-P2)
────────────────────────────────────────────────────────────────
Step 5.1: Phase Skills stop hooks 추가 (phase-1~9)
Step 5.2: Analysis Agents stop hooks 확장
Step 5.3: Expert Agents stop hooks 확장
────────────────────────────────────────────────────────────────
```

---

## 6. Detailed Function Specifications

### 6.1 savePdcaTaskId() 상세

```javascript
/**
 * lib/common.js에 추가
 * 위치: line ~1210 (updatePdcaTaskStatus 다음)
 */
function savePdcaTaskId(feature, phase, taskId, options = {}) {
  const { iteration } = options;

  try {
    // 1. 현재 상태 로드
    const pdcaStatus = getPdcaStatusFull();

    // 2. Feature 구조 초기화
    if (!pdcaStatus.features) {
      pdcaStatus.features = {};
    }
    if (!pdcaStatus.features[feature]) {
      pdcaStatus.features[feature] = {
        phase: phase,
        phaseNumber: PDCA_PHASES[phase]?.order || 0,
        tasks: {
          plan: null,
          design: null,
          do: null,
          check: null,
          act: [],
          report: null
        },
        taskChainCreated: false,
        currentTaskId: null,
        timestamps: {
          started: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        }
      };
    }

    // 3. tasks 구조 초기화 (마이그레이션)
    if (!pdcaStatus.features[feature].tasks) {
      pdcaStatus.features[feature].tasks = {
        plan: null, design: null, do: null,
        check: null, act: [], report: null
      };
    }

    // 4. Task ID 저장
    const tasks = pdcaStatus.features[feature].tasks;

    if (phase === 'act') {
      // Act는 배열 (반복 지원)
      if (!Array.isArray(tasks.act)) {
        tasks.act = [];
      }
      // 중복 방지
      if (!tasks.act.includes(taskId)) {
        tasks.act.push(taskId);
      }
    } else {
      // 다른 phase는 단일 값
      tasks[phase] = taskId;
    }

    // 5. 현재 활성 Task 업데이트
    pdcaStatus.features[feature].currentTaskId = taskId;
    pdcaStatus.features[feature].timestamps.lastUpdated = new Date().toISOString();

    // 6. 저장
    savePdcaStatus(pdcaStatus);

    debugLog('TaskPersistence', 'Task ID saved successfully', {
      feature, phase, taskId, iteration
    });

    return true;
  } catch (error) {
    debugLog('TaskPersistence', 'Failed to save Task ID', {
      feature, phase, taskId, error: error.message
    });
    return false;
  }
}

// Export 추가
module.exports = {
  // ... 기존 exports ...
  savePdcaTaskId,
  getPdcaTaskId,
  createPdcaTaskChain,
  triggerNextPdcaAction
};
```

### 6.2 gap-detector-stop.js 수정 상세

```javascript
/**
 * 수정 위치: line ~233-300 (Task 생성 로직)
 */

// 1. Import 추가
const {
  autoCreatePdcaTask,
  updatePdcaTaskStatus,
  savePdcaTaskId,       // [NEW]
  triggerNextPdcaAction // [NEW]
} = require('../lib/common.js');

// 2. Check Task 생성 시 ID 저장
const checkTask = autoCreatePdcaTask({
  phase: 'check',
  feature: feature || 'unknown',
  metadata: {
    matchRate,
    fulfillment: fulfillmentResult,
    analysisDoc: `docs/03-analysis/${feature}.analysis.md`
  }
});

// [NEW] Task ID 영속화
if (checkTask?.taskId) {
  savePdcaTaskId(feature, 'check', checkTask.taskId);
}

// 3. 다음 Action 자동 결정 [NEW]
const nextAction = triggerNextPdcaAction(feature, 'check', {
  matchRate,
  iterationCount: context.iterationCount || 0,
  maxIterations: config.pdca?.maxIterations || 5,
  threshold: config.pdca?.matchRateThreshold || 90
});

// 4. Hook Output에 autoTrigger 포함
output = {
  decision: 'allow',
  hookEventName: 'Agent:gap-detector:Stop',
  analysisResult: {
    matchRate,
    feature,
    iterationCount: context.iterationCount,
    autoCreatedTasks: [checkTask?.taskId, nextAction?.taskId].filter(Boolean)
  },
  // [NEW] 자동 트리거 정보
  autoTrigger: nextAction?.autoTrigger,
  nextAction: nextAction?.nextAction,
  guidance: nextAction?.message
};
```

### 6.3 iterator-stop.js 수정 상세

```javascript
/**
 * 수정 위치: line ~210-277 (Task 생성 로직)
 */

// 1. Import 추가
const {
  autoCreatePdcaTask,
  updatePdcaTaskStatus,
  savePdcaTaskId,        // [NEW]
  triggerNextPdcaAction  // [NEW]
} = require('../lib/common.js');

// 2. Act Task 생성 시 ID 저장
const actTask = autoCreatePdcaTask({
  phase: 'act',
  feature: feature || 'unknown',
  iteration: currentIteration,
  metadata: {
    matchRateBefore: featureStatus?.matchRate || 0,
    matchRateAfter: matchRate,
    changedFiles,
    status
  }
});

// [NEW] Task ID 영속화
if (actTask?.taskId) {
  savePdcaTaskId(feature, 'act', actTask.taskId, {
    iteration: currentIteration
  });
}

// 3. 자동 재분석 트리거 [강화]
if (status === 'improved' && matchRate < threshold) {
  const nextAction = triggerNextPdcaAction(feature, 'act', {
    matchRate,
    iterationCount: currentIteration,
    maxIterations: config.pdca?.maxIterations || 5,
    threshold: config.pdca?.matchRateThreshold || 90
  });

  output.autoTrigger = nextAction?.autoTrigger;
}

// 4. 완료 시 Report Task 생성
if (status === 'completed' || matchRate >= threshold) {
  const reportTask = autoCreatePdcaTask({
    phase: 'report',
    feature,
    metadata: { finalMatchRate: matchRate, totalIterations: currentIteration }
  });

  if (reportTask?.taskId) {
    savePdcaTaskId(feature, 'report', reportTask.taskId);
  }
}
```

---

## 7. Error Handling

### 7.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| TASK_SAVE_FAILED | Task ID 저장 실패 | 파일 I/O 오류 | 로깅 후 계속 진행 |
| CHAIN_EXISTS | Task 체인 이미 존재 | 중복 생성 시도 | 스킵하고 기존 체인 반환 |
| INVALID_PHASE | 유효하지 않은 Phase | 잘못된 phase 입력 | 기본값(do) 사용 |
| MAX_ITERATIONS | 최대 반복 도달 | 5회 반복 초과 | 수동 개입 요청 |
| BLOCKED_TASK | Task가 차단됨 | blockedBy 미완료 | 선행 Task 완료 안내 |

### 7.2 Fail-Safe 전략

```javascript
// Task 생성 실패 시에도 워크플로우 계속
try {
  const task = autoCreatePdcaTask({ phase, feature, metadata });
  if (task?.taskId) {
    savePdcaTaskId(feature, phase, task.taskId);
  }
} catch (error) {
  debugLog('TaskError', 'Task creation failed, continuing workflow', {
    phase, feature, error: error.message
  });
  // 워크플로우는 계속 진행
}
```

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | Task 함수들 | Node.js assert |
| Integration Test | Hook → Task 연동 | 실제 Hook 실행 |
| E2E Test | 전체 PDCA 사이클 | /pdca 명령 실행 |

### 8.2 Test Cases (Key)

| ID | 시나리오 | 예상 결과 |
|----|----------|----------|
| TC-01 | `/pdca plan feature` 실행 | Task 체인 5개 생성, .pdca-status.json에 저장 |
| TC-02 | 세션 재시작 후 `/pdca status` | 기존 Task ID 복원, 연결 유지 |
| TC-03 | matchRate 75% → Act → 88% → Act → 92% | 2회 반복 후 Report 생성 |
| TC-04 | 5회 반복 후 matchRate 85% | 수동 개입 메시지 |
| TC-05 | blockedBy Task 미완료 상태에서 다음 phase 시도 | 차단 메시지 |

### 8.3 E2E Test Scenario

```bash
# Scenario: Full PDCA Cycle with Iterations

# 1. Plan 시작
/pdca plan user-auth
# Expected: Task chain created, [Plan] user-auth in_progress

# 2. Design
/pdca design user-auth
# Expected: [Plan] completed, [Design] in_progress

# 3. Do (구현)
# ... 코드 작성 ...

# 4. Check
/pdca analyze user-auth
# Expected: matchRate 75%, [Act-1] user-auth created

# 5. Iterate
/pdca iterate user-auth
# Expected: 자동 개선, 자동 재분석 트리거

# 6. Check (자동)
# Expected: matchRate 88%, [Act-2] created

# 7. Iterate (자동)
# Expected: 추가 개선

# 8. Check (자동)
# Expected: matchRate 92%, [Report] created

# 9. Report
/pdca report user-auth
# Expected: 완료 보고서 생성
```

---

## 9. Migration Strategy

### 9.1 기존 데이터 마이그레이션

```javascript
/**
 * .pdca-status.json v2.0 → v2.1 마이그레이션
 */
function migratePdcaStatus() {
  const status = getPdcaStatusFull();

  if (status.version === '2.0') {
    // 각 feature에 tasks 필드 추가
    for (const [feature, data] of Object.entries(status.features || {})) {
      if (!data.tasks) {
        data.tasks = {
          plan: null, design: null, do: null,
          check: null, act: [], report: null
        };
      }
      if (data.taskChainCreated === undefined) {
        data.taskChainCreated = false;
      }
      if (data.currentTaskId === undefined) {
        data.currentTaskId = null;
      }
    }

    status.version = '2.1';
    savePdcaStatus(status);
  }
}
```

### 9.2 Backward Compatibility

- 기존 `autoCreatePdcaTask()` API 시그니처 유지
- 기존 Hook output 형식 유지 (추가 필드만)
- 기존 .pdca-status.json 구조 확장 (덮어쓰기 아님)

---

## 10. Appendix

### 10.1 PDCA_PHASES 확장

```javascript
const PDCA_PHASES = {
  plan:   { order: 1, name: 'Plan',   emoji: '📋' },
  design: { order: 2, name: 'Design', emoji: '📐' },
  do:     { order: 3, name: 'Do',     emoji: '🔨' },
  check:  { order: 4, name: 'Check',  emoji: '🔍' },
  act:    { order: 5, name: 'Act',    emoji: '🔄' },
  report: { order: 6, name: 'Report', emoji: '📊' }  // [NEW]
};
```

### 10.2 Config 설정

```javascript
// bkit.config.json (또는 .bkit-memory.json)
{
  "pdca": {
    "matchRateThreshold": 90,
    "maxIterations": 5,
    "autoCreateTaskChain": true,
    "persistTaskIds": true,
    // [NEW] 완전 자동화 설정 - 섹션 11 참조
    "automationLevel": "semi-auto"
  }
}
```

### 10.3 분석 결과 요약 참조

**lib/common.js Task 함수 분석 결과:**
- `autoCreatePdcaTask()`: line 1122-1205, classification 버그 발견
- `savePdcaTaskId()`: 신규 추가 필요
- `getPdcaTaskId()`: 신규 추가 필요
- `createPdcaTaskChain()`: 신규 추가 필요
- `triggerNextPdcaAction()`: 신규 추가 필요

**scripts/ Hook 분석 결과:**
- `gap-detector-stop.js`: Check Task 처리, Act/Report 분기
- `iterator-stop.js`: Act Task 처리, autoTrigger 지원
- `pdca-skill-stop.js`: Phase 전환, PDCA_PHASE_TRANSITIONS 맵

**skills/ Task 연동 분석 결과:**
- pdca, phase-8, enterprise: Task tools 사용
- 나머지 skills: task-template만 사용 (직접 생성 안 함)

---

## 11. 완전 자동화 설계 (Full-Auto Mode)

> **목표**: 사용자 개입 없이 PDCA 전체 사이클 자동 실행 옵션 제공

### 11.1 Automation Level 개념

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Automation Levels                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 1: manual (기본값)                                                   │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • 모든 Phase에서 사용자 확인 필요                                          │
│  • AskUserQuestion으로 다음 단계 선택                                       │
│  • 사용자가 각 단계를 검토하고 승인                                         │
│                                                                              │
│  Plan ──[사용자]──▶ Design ──[사용자]──▶ Do ──[사용자]──▶ Check            │
│                                                            │                │
│                                               [사용자] ◀───┘                │
│                                                   │                         │
│                                                   ▼                         │
│                                           Act ◀──[사용자]──▶ Report         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 2: semi-auto (현재 설계)                                             │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • Plan/Design/Do는 사용자 확인                                             │
│  • Check↔Act 반복은 자동                                                    │
│  • matchRate >= threshold 도달 시 자동 완료                                 │
│                                                                              │
│  Plan ──[사용자]──▶ Design ──[사용자]──▶ Do ──[사용자]──▶ Check            │
│                                                            │                │
│                                               [자동] ◀─────┘                │
│                                                   │                         │
│                                                   ▼                         │
│                                           Act ──[자동]──▶ Report            │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Level 3: full-auto (신규)                                                  │
│  ─────────────────────────────────────────────────────────────────────────  │
│  • 모든 Phase 자동 진행                                                     │
│  • 사용자 개입 없이 Plan→Design→Do→Check↔Act→Report                        │
│  • 오류 발생 시에만 중단                                                    │
│                                                                              │
│  Plan ──[자동]──▶ Design ──[자동]──▶ Do ──[자동]──▶ Check                  │
│                                                        │                    │
│                                           [자동] ◀─────┘                    │
│                                               │                             │
│                                               ▼                             │
│                                       Act ──[자동]──▶ Report                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Config 스키마 확장

```typescript
interface PdcaAutomationConfig {
  // 기존 설정
  matchRateThreshold: number;     // 90
  maxIterations: number;          // 5

  // [NEW] 자동화 레벨
  automationLevel: 'manual' | 'semi-auto' | 'full-auto';

  // [NEW] full-auto 모드 세부 설정
  fullAuto?: {
    // Plan/Design 자동 생성 여부
    autoGeneratePlan: boolean;      // true: 기본 Plan 템플릿 자동 생성
    autoGenerateDesign: boolean;    // true: Plan 기반 Design 자동 생성

    // Do Phase 처리
    doPhaseMode: 'wait' | 'skip' | 'guided';
    // wait: 구현 완료 대기 (기본)
    // skip: Do 스킵하고 Check로 (기존 코드 분석)
    // guided: 구현 가이드 제공 후 대기

    // 에러 처리
    stopOnError: boolean;           // true: 에러 시 중단
    notifyOnComplete: boolean;      // true: 완료 시 알림

    // 리뷰 포인트 (full-auto에서도 멈추는 지점)
    reviewCheckpoints: PdcaPhase[]; // 예: ['design'] - Design만 리뷰
  };
}
```

### 11.3 lib/common.js 신규 함수

#### 11.3.1 `getAutomationLevel()`

```javascript
/**
 * 현재 자동화 레벨 조회
 * @returns {'manual' | 'semi-auto' | 'full-auto'}
 */
function getAutomationLevel() {
  const config = getBkitConfig();
  return config.pdca?.automationLevel || 'manual';
}
```

#### 11.3.2 `isFullAutoMode()`

```javascript
/**
 * full-auto 모드 여부 확인
 * @returns {boolean}
 */
function isFullAutoMode() {
  return getAutomationLevel() === 'full-auto';
}
```

#### 11.3.3 `shouldAutoAdvance(phase)`

```javascript
/**
 * 해당 Phase에서 자동 진행해야 하는지 확인
 * @param {string} phase - 현재 Phase
 * @returns {boolean}
 */
function shouldAutoAdvance(phase) {
  const level = getAutomationLevel();
  const config = getBkitConfig();

  // manual: 항상 false
  if (level === 'manual') return false;

  // semi-auto: Check/Act만 자동
  if (level === 'semi-auto') {
    return ['check', 'act'].includes(phase);
  }

  // full-auto: reviewCheckpoints 확인
  if (level === 'full-auto') {
    const checkpoints = config.pdca?.fullAuto?.reviewCheckpoints || [];
    return !checkpoints.includes(phase);
  }

  return false;
}
```

#### 11.3.4 `generateAutoTrigger(currentPhase, context)`

```javascript
/**
 * 다음 Phase 자동 트리거 생성
 * @param {string} currentPhase - 현재 완료된 Phase
 * @param {Object} context - { feature, matchRate, iterationCount }
 * @returns {Object|null} autoTrigger 객체
 */
function generateAutoTrigger(currentPhase, context) {
  if (!shouldAutoAdvance(currentPhase)) return null;

  const transition = PDCA_PHASE_TRANSITIONS[currentPhase];
  if (!transition) return null;

  // 조건부 전환 처리 (check phase)
  let nextPhase, skill;
  if (transition.conditions) {
    for (const condition of transition.conditions) {
      if (condition.when(context)) {
        nextPhase = condition.next;
        skill = condition.skill;
        break;
      }
    }
  } else {
    nextPhase = transition.next;
    skill = transition.skill;
  }

  if (!nextPhase || !skill) return null;

  return {
    phase: nextPhase,
    skill: skill,
    feature: context.feature,
    reason: `Auto-advance from ${currentPhase} (automationLevel: ${getAutomationLevel()})`,
    delay: 0
  };
}
```

### 11.4 Hook 수정 사항

#### 11.4.1 pdca-skill-stop.js 수정

```javascript
// 기존 코드 (line 236-248)
if (nextStep && nextStep.message) {
  guidance = `✅ ${nextStep.message}`;

  if (nextStep.question && nextStep.options) {
    userPrompt = emitUserPrompt({ ... });
  }
}

// 수정 후
const { isFullAutoMode, shouldAutoAdvance, generateAutoTrigger } = require('../lib/common.js');

if (nextStep && nextStep.message) {
  guidance = `✅ ${nextStep.message}`;

  // [NEW] full-auto 모드 처리
  if (isFullAutoMode() && shouldAutoAdvance(action)) {
    // AskUserQuestion 스킵, 자동 트리거 생성
    autoTrigger = generateAutoTrigger(phaseMap[action], {
      feature,
      matchRate: featureStatus?.matchRate || 0,
      iterationCount: featureStatus?.iterationCount || 0
    });

    guidance += `\n\n🤖 [Full-Auto Mode] 자동으로 다음 단계 진행: ${autoTrigger?.skill}`;
  } else if (nextStep.question && nextStep.options) {
    // 기존: 사용자 확인 요청
    userPrompt = emitUserPrompt({ ... });
  }
}
```

#### 11.4.2 gap-detector-stop.js 수정

```javascript
// 기존 코드 (line 117-142) - userPrompt 생성 부분

// 수정 후
const { isFullAutoMode, shouldAutoAdvance } = require('../lib/common.js');

let autoTrigger = null;

if (matchRate >= threshold) {
  // 완료 케이스
  if (isFullAutoMode() && shouldAutoAdvance('check')) {
    // 자동으로 Report 진행
    autoTrigger = {
      phase: 'report',
      skill: '/pdca report',
      feature,
      reason: 'Auto-advance to report (full-auto mode)',
      delay: 0
    };
    guidance += `\n\n🤖 [Full-Auto Mode] 자동으로 보고서 생성 진행`;
  } else {
    // 사용자 확인
    userPrompt = emitUserPrompt({ ... });
  }
} else if (iterCount < maxIterations) {
  // Act 필요 케이스
  if (isFullAutoMode() || shouldAutoAdvance('check')) {
    // semi-auto/full-auto: 자동으로 Act 진행
    autoTrigger = {
      phase: 'act',
      skill: '/pdca iterate',
      feature,
      reason: `Auto-iterate (matchRate: ${matchRate}%, target: ${threshold}%)`,
      delay: 0
    };
    guidance += `\n\n🤖 [Auto Mode] 자동 개선 진행 (${iterCount + 1}/${maxIterations})`;
  } else {
    userPrompt = emitUserPrompt({ ... });
  }
}
```

#### 11.4.3 iterator-stop.js 수정

```javascript
// 기존 코드 (line 265-274) - autoTrigger 생성 부분

// 수정 후 (자동화 레벨 반영)
const { isFullAutoMode, shouldAutoAdvance } = require('../lib/common.js');

// 자동 재분석 트리거 (semi-auto, full-auto 공통)
if (status === 'improved' && matchRate < threshold && currentIteration < maxIterations) {
  if (shouldAutoAdvance('act')) {
    autoTrigger = {
      agent: 'gap-detector',
      skill: '/pdca analyze',
      feature: feature,
      reason: `Auto re-analyze after iteration (${getAutomationLevel()} mode)`,
      delay: 0
    };
  }
}

// 완료 시 Report 자동 진행 (full-auto만)
if (status === 'completed' && matchRate >= threshold && isFullAutoMode()) {
  autoTrigger = {
    phase: 'report',
    skill: '/pdca report',
    feature,
    reason: 'Auto-advance to report (full-auto mode)',
    delay: 0
  };
}
```

### 11.5 Hook Output 확장

```typescript
// autoTrigger 필드 표준화
interface AutoTrigger {
  phase?: string;           // 다음 PDCA phase
  agent?: string;           // 실행할 Agent (예: 'gap-detector')
  skill?: string;           // 실행할 Skill (예: '/pdca report')
  feature: string;          // 대상 Feature
  reason: string;           // 트리거 이유
  delay: number;            // 지연 시간 (ms), 0 = 즉시
}

// Hook Output에 포함
interface HookOutput {
  decision: 'allow';
  hookEventName: string;
  // ... 기존 필드 ...

  // [NEW] 자동화 관련
  autoTrigger?: AutoTrigger;           // 다음 자동 실행
  automationLevel?: string;            // 현재 자동화 레벨
  skippedUserPrompt?: boolean;         // full-auto로 인한 스킵 여부
}
```

### 11.6 Full-Auto 실행 흐름

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     Full-Auto PDCA Execution Flow                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  User: /pdca plan my-feature --auto                                         │
│        │                                                                     │
│        ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 1: Plan 생성                                                       ││
│  │   • Plan 템플릿 자동 생성 (autoGeneratePlan: true)                      ││
│  │   • [Plan] Task 생성 및 완료                                            ││
│  │   • autoTrigger: { skill: '/pdca design', ... }                         ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
│                                     │ 자동                                  │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 2: Design 생성                                                     ││
│  │   • Plan 기반 Design 자동 생성 (autoGenerateDesign: true)               ││
│  │   • [Design] Task 생성 및 완료                                          ││
│  │   • autoTrigger: { skill: '/pdca do', ... }                             ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
│                                     │ 자동                                  │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 3: Do Phase                                                        ││
│  │   • doPhaseMode에 따라 처리:                                            ││
│  │     - 'wait': 구현 완료 대기 (사용자 "/pdca do done" 입력)              ││
│  │     - 'skip': 기존 코드 있으면 바로 Check                               ││
│  │     - 'guided': 구현 가이드 제공 후 대기                                ││
│  │   • [Do] Task 생성                                                      ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
│                                     │ (구현 완료 후)                        │
│                                     ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────────────┐│
│  │ Step 4: Check (Gap Analysis)                                            ││
│  │   • gap-detector Agent 실행                                             ││
│  │   • matchRate 계산                                                      ││
│  │   • autoTrigger: matchRate < 90% ? '/pdca iterate' : '/pdca report'     ││
│  └──────────────────────────────────┬──────────────────────────────────────┘│
│                                     │ 자동                                  │
│                           ┌─────────┴─────────┐                             │
│                           ▼                   ▼                             │
│                    matchRate < 90%     matchRate >= 90%                     │
│                           │                   │                             │
│  ┌────────────────────────▼───────┐  ┌───────▼────────────────────────────┐│
│  │ Step 5a: Act (Iteration)       │  │ Step 5b: Report                    ││
│  │   • pdca-iterator Agent 실행   │  │   • report-generator Agent 실행   ││
│  │   • 코드 자동 수정             │  │   • 완료 보고서 생성              ││
│  │   • autoTrigger: gap-detector  │  │   • PDCA 사이클 완료              ││
│  └────────────────────────┬───────┘  └────────────────────────────────────┘│
│                           │                                                 │
│                           └──────────────────┐                              │
│                                              │ 자동 (최대 5회)              │
│                                              ▼                              │
│                                      [Step 4로 돌아감]                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 11.7 사용 예시

#### 11.7.1 수동 모드 (기본)

```bash
# 각 단계마다 사용자 확인 필요
/pdca plan my-feature
# → AskUserQuestion: "Design 진행할까요?"
# 사용자: "Design 진행"
/pdca design my-feature
# → AskUserQuestion: "구현 시작할까요?"
# ... (계속 사용자 확인)
```

#### 11.7.2 반자동 모드

```bash
# Check↔Act만 자동
BKIT_PDCA_AUTOMATION=semi-auto /pdca plan my-feature

# 또는 config 설정
# .bkit-memory.json: { "pdca": { "automationLevel": "semi-auto" } }
```

#### 11.7.3 완전 자동 모드

```bash
# 전체 사이클 자동 실행
/pdca plan my-feature --auto

# 또는 환경변수
BKIT_PDCA_AUTOMATION=full-auto /pdca plan my-feature

# 또는 config 설정
# .bkit-memory.json: { "pdca": { "automationLevel": "full-auto" } }
```

#### 11.7.4 리뷰 체크포인트 설정

```javascript
// Design만 리뷰하고 나머지는 자동
{
  "pdca": {
    "automationLevel": "full-auto",
    "fullAuto": {
      "reviewCheckpoints": ["design"]
    }
  }
}
```

### 11.8 Implementation Checklist

```
Phase 1: Config 및 헬퍼 함수 (lib/common.js)
────────────────────────────────────────────────────────────────
[ ] getBkitConfig() 확장 - automationLevel 지원
[ ] getAutomationLevel() 함수 추가
[ ] isFullAutoMode() 함수 추가
[ ] shouldAutoAdvance(phase) 함수 추가
[ ] generateAutoTrigger(currentPhase, context) 함수 추가
────────────────────────────────────────────────────────────────

Phase 2: Hook 수정
────────────────────────────────────────────────────────────────
[ ] pdca-skill-stop.js - autoTrigger 로직 추가
[ ] gap-detector-stop.js - 자동화 레벨 분기
[ ] iterator-stop.js - 자동화 레벨 분기
────────────────────────────────────────────────────────────────

Phase 3: PDCA Skill 확장
────────────────────────────────────────────────────────────────
[ ] /pdca plan --auto 플래그 지원
[ ] autoTrigger 처리 로직
[ ] full-auto 모드 안내 메시지
────────────────────────────────────────────────────────────────
```

### 11.9 호환성 및 안전장치

| 항목 | 설명 |
|------|------|
| **기본값** | `automationLevel: 'manual'` - 기존 동작 유지 |
| **환경변수 오버라이드** | `BKIT_PDCA_AUTOMATION` 환경변수로 임시 변경 가능 |
| **에러 시 중단** | `fullAuto.stopOnError: true` 기본값 |
| **최대 반복 제한** | `maxIterations: 5` 유지 (무한 루프 방지) |
| **리뷰 체크포인트** | 특정 Phase에서 반드시 사용자 확인 가능 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-29 | 초기 작성 - 코드베이스 분석 기반 상세 설계 | Claude Opus 4.5 |
| 0.2 | 2026-01-29 | 완전 자동화 설계 추가 (섹션 11) | Claude Opus 4.5 |
