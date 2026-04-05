# Skill Evolution Design Document

> **Summary**: PDCA 데이터 기반 Auditable Skill Evolution — 3모듈 시스템 (Pattern Miner + Skill Synthesizer + Evolution Tracker)
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: 2.0.9
> **Author**: Claude
> **Date**: 2026-04-04
> **Status**: Draft
> **Planning Doc**: [skill-evolution.plan.md](../01-plan/features/skill-evolution.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PDCA 사이클의 풍부한 데이터(btw, M1-M10, gap 분석)가 스킬 개선에 활용되지 않아, 사용자가 반복 문제를 수동으로 해결하는 비효율 발생 |
| **WHO** | bkit power users — 동일 프로젝트에서 3+ PDCA 사이클을 실행하는 개발자/팀 리드 (Dynamic/Enterprise 레벨) |
| **RISK** | R1: 저품질 제안이 신뢰를 훼손 (완화: confidence >= 0.7 초기 임계값 + 승인율 모니터링). R2: Cold start — 대부분 사용자가 3 사이클 미만 |
| **SUCCESS** | SC-1: 60% 프로젝트 스킬 제안 생성. SC-2: 승인율 50%+. SC-3: M1 +2%p 개선. SC-4: 감사 로그 100% |
| **SCOPE** | P0: Pattern Miner + Skill Synthesizer + 기본 Tracker + `/pdca evolve` + Report 트리거 |

---

## 1. Overview

### 1.1 Design Goals

- 기존 bkit lib/ 모듈 패턴(stateStore, writeAuditLog, index.js 재수출)을 정확히 따름
- 3개 독립 모듈이 각자 단일 책임을 가지며 index.js로 통합
- 기존 generator.js/validator.js를 수정 없이 호출 (얇은 래퍼)
- 모든 데이터 소스를 읽기 전용으로 접근 (원본 무변경)

### 1.2 Design Principles

- **Read-Only Data Access**: btw-suggestions, quality-history, analysis docs는 읽기만 함
- **Staging Before Deploy**: 모든 스킬은 staging area를 거쳐야 함 (직접 skills/ 배치 금지)
- **Evidence-First**: 근거 없는 제안 생성 불가 (confidence 임계값 필수)
- **Audit Everything**: 모든 상태 전이를 JSONL로 기록

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **New Files** | 1 | 7 | 4 |
| **Modified Files** | 2 | 2 | 2 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | ~400 LOC | ~1200 LOC | ~700 LOC |
| **Risk** | 단일 파일 비대화 | 기존 패턴 불일치 | Low |

**Selected**: Option C — Pragmatic — **Rationale**: Plan 구조와 정확히 일치 (3파일 + index.js). 기존 bkit 모듈 패턴(함수 기반, 클래스 안 씀) 준수. 적절한 관심사 분리 + 빠른 구현.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ PDCA Report Hook (trigger)                                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/evolution/pattern-miner.js                                   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ mineGap      │  │ mineMetric   │  │ mineBtw      │          │
│  │ Patterns()   │  │ Patterns()   │  │ Patterns()   │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         └──────────────────┼──────────────────┘                  │
│                            ▼                                     │
│                    scorePattern() → filter(conf >= 0.6)          │
│                    → top 5 by confidence                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │ Pattern[]
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/evolution/skill-synthesizer.js                               │
│                                                                  │
│  classifyPattern() → synthesizeSkill() → generateEval()          │
│       │                    │                    │                │
│       ▼                    ▼                    ▼                │
│  workflow/capability  generator.js call    eval.yaml from        │
│  auto-detection       + validator.js       pattern evidence      │
│                                                                  │
│  → stageSkill() → .bkit/evolution/staging/{name}/               │
└──────────────────────┬──────────────────────────────────────────┘
                       │ StagedSkill[]
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│ lib/evolution/tracker.js                                         │
│                                                                  │
│  propose() → [User: /pdca evolve approve] → approve()            │
│                                              │                   │
│              staging/ → .claude/skills/project/{name}/           │
│                                              │                   │
│  writeAuditLog({ category: 'evolution' })    │                   │
│  history.json (FIFO 200)                     │                   │
│                                              ▼                   │
│                                    2-layer skill loader          │
│                                    (auto-discovers)              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
1. /pdca report 완료 (또는 /pdca evolve mine 수동)
   │
2. pattern-miner.mineAll()
   ├── .bkit/btw-suggestions.json       → mineBtwPatterns()
   ├── .bkit/state/quality-history.json  → mineMetricPatterns()
   └── docs/03-analysis/*.analysis.md    → mineGapPatterns()
   │
3. patterns.filter(p => p.confidence >= threshold)
   │                                     └── top 5
4. skill-synthesizer.synthesizeAll(patterns)
   ├── classifyPattern(pattern) → workflow | capability
   ├── generator.generateSkill({ name, classification, description })
   ├── generateEvalFromPattern(pattern) → eval.yaml
   ├── validator.validateSkill(name) → { valid, errors }
   └── stageSkill(name) → .bkit/evolution/staging/{name}/
   │
5. tracker.propose(stagedSkills)
   ├── proposals.json 업데이트
   ├── writeAuditLog({ action: 'evolution_proposed', category: 'evolution' })
   └── 사용자 알림: "N개 스킬 제안 생성됨"
   │
6. 사용자: /pdca evolve approve {name}
   ├── tracker.approve(name)
   │   ├── staging/{name}/ → .claude/skills/project/{name}/
   │   ├── history.json 추가
   │   └── writeAuditLog({ action: 'evolution_approved' })
   │
7. 다음 PDCA 사이클에서 2-layer loader가 자동 인식
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| pattern-miner.js | `lib/core/state-store` | quality-history.json 읽기 |
| pattern-miner.js | `lib/core/paths` | STATE_PATHS로 파일 경로 |
| pattern-miner.js | `fs`, `path`, `glob` | analysis docs 읽기 |
| skill-synthesizer.js | `skill-creator/generator` | 스킬 스캐폴딩 |
| skill-synthesizer.js | `skill-creator/validator` | 스킬 구조 검증 |
| tracker.js | `lib/core/state-store` | history.json, proposals.json |
| tracker.js | `lib/audit/audit-logger` | writeAuditLog() |
| tracker.js | `fs` | staging → skills 파일 이동 |
| index.js | 위 3개 모듈 | 재수출 |

---

## 3. Data Model

### 3.1 Pattern (pattern-miner 출력)

```javascript
/**
 * @typedef {Object} Pattern
 * @property {string} id              - 패턴 고유 ID (예: 'gap-missing-error-handling')
 * @property {'gap_frequency'|'metric_degradation'|'btw_cluster'} type
 * @property {string} name            - 사람이 읽을 수 있는 패턴명
 * @property {string} description     - 패턴 설명
 * @property {number} occurrences     - 발생 횟수
 * @property {number} confidence      - 0.0~1.0 (occurrences * evidence_strength * recency_weight)
 * @property {Evidence[]} evidence    - 근거 배열
 * @property {string} suggestedSkillName - 제안 스킬명
 * @property {string} detectedAt      - ISO 8601 타임스탬프
 */

/**
 * @typedef {Object} Evidence
 * @property {string} source          - 데이터 소스 (예: 'analysis/feature-a.analysis.md')
 * @property {string} excerpt         - 관련 발췌문
 * @property {string} timestamp       - 발생 시점
 */
```

### 3.2 StagedSkill (skill-synthesizer 출력)

```javascript
/**
 * @typedef {Object} StagedSkill
 * @property {string} name            - 스킬명 (kebab-case)
 * @property {'workflow'|'capability'} classification
 * @property {string} description     - 스킬 설명
 * @property {Pattern} sourcePattern  - 원본 패턴 참조
 * @property {string} stagingPath     - .bkit/evolution/staging/{name}/
 * @property {boolean} valid          - validator.js 검증 결과
 * @property {string[]} validationErrors - 검증 오류 (있으면)
 * @property {string} createdAt       - ISO 8601
 */
```

### 3.3 EvolutionEntry (tracker 이력)

```javascript
/**
 * @typedef {Object} EvolutionEntry
 * @property {string} id              - UUID
 * @property {string} skillName       - 스킬명
 * @property {'proposed'|'approved'|'rejected'|'deployed'|'measured'|'deprecated'} status
 * @property {Pattern} sourcePattern  - 원본 패턴
 * @property {string} proposedAt      - ISO 8601
 * @property {string|null} resolvedAt - 승인/거부 시점
 * @property {string|null} reason     - 거부 사유 (reject 시)
 * @property {Object|null} metrics    - 효과 측정 결과 (P1)
 */
```

### 3.4 File Structures

#### `.bkit/evolution/proposals.json`
```json
{
  "version": "1.0",
  "lastMined": "2026-04-04T10:00:00Z",
  "proposals": [
    {
      "name": "convention-guard",
      "classification": "capability",
      "sourcePattern": { "type": "metric_degradation", "confidence": 0.82 },
      "status": "proposed",
      "proposedAt": "2026-04-04T10:00:00Z"
    }
  ]
}
```

#### `.bkit/evolution/history.json`
```json
{
  "version": "1.0",
  "maxEntries": 200,
  "entries": [
    {
      "id": "uuid",
      "skillName": "convention-guard",
      "status": "approved",
      "proposedAt": "2026-04-04T10:00:00Z",
      "resolvedAt": "2026-04-04T10:05:00Z"
    }
  ]
}
```

#### `bkit.config.json` evolution 섹션
```json
{
  "evolution": {
    "enabled": true,
    "minConfidence": 0.6,
    "initialConfidence": 0.7,
    "maxProposals": 5,
    "maxHistoryEntries": 200,
    "minOccurrences": 3,
    "btwSimilarityThreshold": 0.7,
    "autoTriggerOnReport": true,
    "measureAfterCycles": 3,
    "deprecationThreshold": 0.02
  }
}
```

---

## 4. API Specification (Module Public API)

### 4.1 pattern-miner.js

| Function | Signature | Description |
|----------|-----------|-------------|
| `mineGapPatterns` | `(analysisDir?: string) → Pattern[]` | gap 분석 문서에서 반복 gap 유형 감지 |
| `mineMetricPatterns` | `(historyPath?: string) → Pattern[]` | quality-history에서 phase별 메트릭 하락 감지 |
| `mineBtwPatterns` | `(btwPath?: string) → Pattern[]` | btw 제안 키워드 기반 Jaccard 클러스터링 |
| `scorePattern` | `(pattern: RawPattern) → Pattern` | confidence 점수 산출 |
| `mineAll` | `(options?: MineOptions) → Pattern[]` | 3종 통합 마이닝 + 필터 + 상위 N개 |

### 4.2 skill-synthesizer.js

| Function | Signature | Description |
|----------|-----------|-------------|
| `classifyPattern` | `(pattern: Pattern) → 'workflow' \| 'capability'` | 패턴 유형 → 스킬 분류 |
| `synthesizeSkill` | `(pattern: Pattern) → StagedSkill` | 단일 패턴 → 스킬 생성 + staging |
| `generateEvalFromPattern` | `(pattern: Pattern, skillDir: string) → void` | 패턴 근거 → eval.yaml 작성 |
| `synthesizeAll` | `(patterns: Pattern[]) → StagedSkill[]` | 전체 패턴 배치 합성 |

### 4.3 tracker.js

| Function | Signature | Description |
|----------|-----------|-------------|
| `propose` | `(skills: StagedSkill[]) → void` | proposals.json에 제안 기록 + 감사 로그 |
| `approve` | `(skillName: string) → { success, path }` | staging → skills/ 이동 + 감사 로그 |
| `reject` | `(skillName: string, reason: string) → void` | 거부 기록 + 감사 로그 |
| `getStatus` | `() → EvolutionStatus` | 현재 proposals + history 요약 |
| `getHistory` | `(limit?: number) → EvolutionEntry[]` | 이력 조회 |

### 4.4 index.js (공개 API)

```javascript
// Pattern Miner (5 exports)
mineGapPatterns,
mineMetricPatterns,
mineBtwPatterns,
scorePattern,
mineAll,

// Skill Synthesizer (4 exports)
classifyPattern,
synthesizeSkill,
generateEvalFromPattern,
synthesizeAll,

// Tracker (5 exports)
propose,
approve,
reject,
getStatus,
getHistory,
```

---

## 5. CLI Specification (`/pdca evolve`)

### 5.1 서브커맨드

```
/pdca evolve mine              수동 패턴 마이닝 실행
/pdca evolve status            현재 진화 상태 (제안/배포/효과)
/pdca evolve approve <name>    제안 승인 → skills/로 배포
/pdca evolve reject <name>     제안 거부 (사유 입력)
/pdca evolve history           진화 이력 조회
```

### 5.2 출력 형식

#### `/pdca evolve mine` 출력
```
🧬 Skill Evolution — Pattern Mining
────────────────────────────────────
Data Sources:
  btw-suggestions: 23 entries
  quality-history: 8 data points (4 features)
  gap analysis: 5 documents

Patterns Detected: 3 (filtered from 7, confidence >= 0.7)

┌─────┬──────────────────────┬──────────┬────────┬──────────┐
│  #  │ Pattern              │ Type     │ Conf.  │ Evidence │
├─────┼──────────────────────┼──────────┼────────┼──────────┤
│  1  │ convention-guard     │ metric ↓ │  0.85  │ 4 points │
│  2  │ error-handling-check │ gap ×3   │  0.78  │ 3 docs   │
│  3  │ type-safety-reminder │ btw ×5   │  0.72  │ 5 items  │
└─────┴──────────────────────┴──────────┴────────┴──────────┘

Skills synthesized → .bkit/evolution/staging/
Run `/pdca evolve status` to review proposals.
```

#### `/pdca evolve status` 출력
```
🧬 Skill Evolution Status
────────────────────────────────────
Proposals:  3 pending
Deployed:   2 skills (from prior cycles)
Measured:   1 skill (+3.2%p M1)

Pending Proposals:
  1. convention-guard (capability) — M7 drops 15%+ at Do phase [conf: 0.85]
  2. error-handling-check (workflow) — "missing-error-handling" gap in 3/5 features [conf: 0.78]
  3. type-safety-reminder (capability) — 5 btw suggestions about TypeScript strict [conf: 0.72]

Commands:
  /pdca evolve approve convention-guard
  /pdca evolve reject type-safety-reminder
```

---

## 6. Error Handling

| Scenario | Handling | User Message |
|----------|----------|-------------|
| 데이터 소스 없음 (cold start) | 빈 배열 반환, 에러 없음 | "데이터가 부족합니다. N 사이클 더 실행 후 다시 시도하세요." |
| btw-suggestions.json 없음 | mineBtwPatterns → `[]` | (무시, 다른 소스로 진행) |
| quality-history.json 없음 | mineMetricPatterns → `[]` | (무시, 다른 소스로 진행) |
| analysis docs 없음 | mineGapPatterns → `[]` | (무시, 다른 소스로 진행) |
| 모든 패턴 confidence < threshold | 빈 제안 목록 | "현재 감지된 패턴이 없습니다." |
| generator.js 호출 실패 | 해당 패턴 건너뜀, 로그 기록 | "1개 스킬 생성 실패 (이유: ...)" |
| validator.js 검증 실패 | staging에 배치하지 않음 | "검증 실패: {errors}" |
| 이미 승인된 스킬 재승인 시도 | 무시 + 안내 | "이미 배포된 스킬입니다." |
| staging에 없는 스킬 승인 시도 | 에러 | "'{name}' 제안을 찾을 수 없습니다." |
| history.json FIFO 초과 | 가장 오래된 항목 삭제 | (자동, 메시지 없음) |

---

## 7. Security Considerations

- [x] 데이터 소스 읽기 전용 (원본 무변경)
- [x] staging area를 통한 격리 (직접 skills/ 배치 금지)
- [x] 인간 승인 게이트 필수 (자동 배포 없음)
- [x] 감사 로그로 모든 액션 추적
- [x] 외부 API 호출 없음 (100% 로컬)
- [x] 설정 가능한 임계값으로 false positive 억제

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| Unit | pattern-miner 각 함수 | Node.js assert | Do |
| Unit | skill-synthesizer 각 함수 | Node.js assert | Do |
| Unit | tracker 각 함수 | Node.js assert | Do |
| Integration | mineAll → synthesizeAll → propose 파이프라인 | Node.js | Do |
| E2E | /pdca evolve mine → approve 전체 흐름 | Manual CLI | Check |

### 8.2 Unit Test Scenarios

| # | Module | Test | Expected |
|---|--------|------|----------|
| 1 | pattern-miner | 3개 analysis doc에 동일 gap → mineGapPatterns() | Pattern with occurrences: 3, confidence >= 0.6 |
| 2 | pattern-miner | M7이 Do phase에서 3회 하락 → mineMetricPatterns() | Pattern type: 'metric_degradation', metric: 'M7' |
| 3 | pattern-miner | 5개 유사 btw (similarity >= 0.7) → mineBtwPatterns() | Pattern type: 'btw_cluster', suggestions: 5 |
| 4 | pattern-miner | 모든 confidence < threshold → mineAll() | 빈 배열, 에러 없음 |
| 5 | pattern-miner | 데이터 소스 없음 → mineAll() | 빈 배열, 에러 없음 |
| 6 | synthesizer | gap pattern → classifyPattern() | 'workflow' |
| 7 | synthesizer | metric pattern → classifyPattern() | 'capability' |
| 8 | synthesizer | Pattern → synthesizeSkill() | StagedSkill with valid SKILL.md |
| 9 | tracker | propose() → proposals.json 확인 | 제안 기록 + 감사 로그 |
| 10 | tracker | approve() → skills/ 이동 확인 | 파일 이동 + history 추가 + 감사 로그 |
| 11 | tracker | reject() → 사유 기록 확인 | 거부 기록 + 감사 로그 |
| 12 | tracker | history FIFO 200건 초과 | 가장 오래된 항목 삭제 |

### 8.3 Jaccard Similarity Test

| # | Input A | Input B | Expected Similarity | Result |
|---|---------|---------|:-------------------:|--------|
| 1 | "add typescript strict mode" | "enable typescript strict" | >= 0.5 | Match |
| 2 | "fix api error handling" | "add error handling to api" | >= 0.5 | Match |
| 3 | "update readme" | "add typescript strict mode" | < 0.3 | No match |

---

## 9. Clean Architecture (bkit Plugin Context)

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **CLI/Trigger** | 사용자 명령 + Report 훅 | `skills/pdca/SKILL.md` (evolve 섹션) |
| **Orchestration** | 모듈 조합 + 흐름 제어 | `lib/evolution/index.js` |
| **Domain** | 패턴 감지, 스킬 합성, 생애주기 | `lib/evolution/*.js` |
| **Infrastructure** | 파일 I/O, 감사 로그, 스킬 생성기 | `lib/core/state-store`, `lib/audit/`, `skill-creator/` |

### 9.2 Dependency Rules

```
skills/pdca/SKILL.md (trigger)
       │
       ▼
lib/evolution/index.js (orchestration)
       │
       ├── lib/evolution/pattern-miner.js (domain)
       │        └── lib/core/state-store (infra - read)
       │        └── lib/core/paths (infra - paths)
       │
       ├── lib/evolution/skill-synthesizer.js (domain)
       │        └── skill-creator/generator.js (infra - create)
       │        └── skill-creator/validator.js (infra - validate)
       │
       └── lib/evolution/tracker.js (domain)
                └── lib/core/state-store (infra - read/write)
                └── lib/audit/audit-logger.js (infra - audit)
```

---

## 10. Coding Convention Reference

### 10.1 bkit lib/ Conventions (from exploration)

| Target | Convention |
|--------|-----------|
| Module entry | `index.js` with named re-exports + count comments |
| Functions | `camelCase`, named exports |
| Constants | `UPPER_SNAKE_CASE` in-module or `lib/core/constants.js` |
| File paths | `lib/core/paths.js` STATE_PATHS에 등록 |
| State I/O | `stateStore.read()` / `stateStore.write()` (atomic) |
| Concurrent access | `stateStore.lockedUpdate()` |
| Audit logging | `writeAuditLog({ action, category, target, details, result })` |
| Error handling | 데이터 없으면 빈 결과 반환 (throw 금지) |

### 10.2 This Feature's Conventions

| Item | Convention |
|------|-----------|
| Module naming | `lib/evolution/` — 기존 lib 하위 디렉토리 패턴 |
| State dir | `.bkit/evolution/` — 코어 state와 격리 |
| Config | `bkit.config.json` evolution 섹션 |
| Audit category | `'evolution'` |
| Skill staging | `.bkit/evolution/staging/{name}/` |
| Skill deploy | `.claude/skills/project/{name}/` |

---

## 11. Implementation Guide

### 11.1 File Structure

```
lib/evolution/                    ← 신규 디렉토리
├── index.js                      ← 공개 API (14 exports)
├── pattern-miner.js              ← ~250 LOC
├── skill-synthesizer.js          ← ~200 LOC
└── tracker.js                    ← ~250 LOC

.bkit/evolution/                  ← 런타임 데이터 (자동 생성)
├── staging/
├── proposals.json
└── history.json

수정 파일:
├── skills/pdca/SKILL.md          ← evolve 서브커맨드 추가
└── bkit.config.json              ← evolution 섹션 추가
```

### 11.2 Implementation Order

1. [ ] **M1: Pattern Miner** — 3종 패턴 감지 엔진
   - `mineGapPatterns()` — analysis docs glob + gap 유형 추출 + 빈도 계산
   - `mineMetricPatterns()` — quality-history.json 읽기 + phase별 하락 감지
   - `mineBtwPatterns()` — btw-suggestions.json 읽기 + Jaccard 클러스터링
   - `scorePattern()` — confidence = occurrences * evidence_strength * recency_weight
   - `mineAll()` — 통합 + 필터 + 상위 5개

2. [ ] **M2: Skill Synthesizer** — 패턴 → 스킬 변환
   - `classifyPattern()` — gap→workflow, metric→capability, btw→빈도 기반
   - `synthesizeSkill()` — generator.js 호출 + staging area 배치
   - `generateEvalFromPattern()` — 패턴 근거 → eval.yaml 변환
   - `synthesizeAll()` — 배치 합성 + validator.js 검증

3. [ ] **M3: Tracker + Integration** — 생애주기 + CLI + 트리거
   - `propose()` / `approve()` / `reject()` — 상태 전이 + 감사 로그
   - `getStatus()` / `getHistory()` — 조회 API
   - index.js — 14개 함수 재수출
   - PDCA SKILL.md — evolve 서브커맨드 추가
   - bkit.config.json — evolution 섹션
   - Report 완료 훅 연동

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated LOC |
|--------|-----------|-------------|:-------------:|
| Pattern Miner | `module-1` | 3종 패턴 감지 (gap, metric, btw) + confidence 산출 | ~250 |
| Skill Synthesizer | `module-2` | 패턴 → 스킬 변환 + eval 생성 + staging | ~200 |
| Tracker + Integration | `module-3` | 생애주기 + CLI + 트리거 + index.js | ~250 |

#### Recommended Session Plan

| Session | Phase | Scope | Description |
|---------|-------|-------|-------------|
| Session 1 | Plan + Design | 전체 | 이 문서 (완료) |
| Session 2 | Do | `--scope module-1` | Pattern Miner 구현 |
| Session 3 | Do | `--scope module-2,module-3` | Synthesizer + Tracker + Integration |
| Session 4 | Check + Report | 전체 | Gap 분석 + 완료 보고 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft — Option C (Pragmatic) selected | Claude |
