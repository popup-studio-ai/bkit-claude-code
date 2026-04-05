# Skill Evolution Planning Document

> **Summary**: PDCA 사이클 데이터로부터 스킬을 자동 생성/진화시키는 Auditable Skill Evolution 시스템
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: 2.0.9
> **Author**: Claude (PM Agent Team)
> **Date**: 2026-04-04
> **Status**: Draft
> **PRD Reference**: `docs/00-pm/skill-evolution.prd.md`

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | bkit의 37개 스킬은 정적이며, PDCA 사이클에서 수집되는 반복 패턴/메트릭 하락/사용자 제안 데이터가 스킬 개선에 활용되지 않아 사용자가 동일한 문제를 반복적으로 수동 해결해야 함 |
| **Solution** | Pattern Miner(3종 패턴 감지) + Skill Synthesizer(기존 generator.js 활용 자동 생성) + Evolution Tracker(생애주기 + 효과 측정)로 구성된 3-모듈 시스템. `/pdca evolve` 서브커맨드로 PDCA 워크플로우에 통합 |
| **Function/UX Effect** | Report 완료 시 자동 패턴 마이닝 → 근거와 함께 스킬 후보 제안 → `/pdca evolve approve`로 승인 → 다음 사이클부터 자동 적용. 3사이클 후 효과 측정 |
| **Core Value** | Auditable Skill Evolution — Hermes의 블랙박스와 달리 모든 제안에 추적 가능한 근거 + 인간 승인 게이트 + eval 검증 + 감사 로그. AI가 똑똑해지되, 인간이 통제 유지 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | PDCA 사이클의 풍부한 데이터(btw, M1-M10, gap 분석)가 스킬 개선에 활용되지 않아, 사용자가 반복 문제를 수동으로 해결하는 비효율 발생 |
| **WHO** | bkit power users — 동일 프로젝트에서 3+ PDCA 사이클을 실행하는 개발자/팀 리드 (Dynamic/Enterprise 레벨) |
| **RISK** | R1: 저품질 제안이 신뢰를 훼손 (완화: confidence >= 0.7 초기 임계값 + 승인율 모니터링). R2: Cold start — 대부분 사용자가 3 사이클 미만 (완화: 수동 `/pdca evolve mine` + 데이터 부족 시 graceful degradation) |
| **SUCCESS** | SC-1: 3+사이클 프로젝트의 60%에서 1+ 스킬 제안 생성. SC-2: 제안 승인율 50%+. SC-3: 배포된 스킬이 M1에 +2%p 개선. SC-4: 모든 진화 액션 감사 로그 100% 기록 |
| **SCOPE** | Phase 1(P0): Pattern Miner + Skill Synthesizer + 기본 Tracker + `/pdca evolve` 통합. Phase 2(P1): 효과 측정 + 자동 deprecation + btw 임계값 트리거. Phase 3(P2): 크로스 프로젝트 학습 |

---

## 1. Overview

### 1.1 Purpose

PDCA 사이클 실행 중 자연스럽게 수집되는 3가지 데이터 소스(gap 분석 결과, M1-M10 품질 메트릭 히스토리, btw 개선 제안)로부터 반복 패턴을 자동 감지하고, 기존 skill-create 파이프라인(generator.js + validator.js + eval framework)을 활용해 스킬 후보를 자동 생성하는 시스템.

Hermes Agent의 "자기학습" 컨셉에서 영감을 받되, bkit 철학(투명성, 검증, 인간 거버넌스)에 맞게 **Auditable Skill Evolution**으로 재설계.

### 1.2 Background

- bkit는 37개 Skills + 32개 Agents로 구성된 정적 스킬셋을 보유
- PDCA 사이클에서 `.bkit/btw-suggestions.json`, `.bkit/state/quality-history.json`, `docs/03-analysis/*.analysis.md` 등 풍부한 데이터를 수집하지만 스킬 개선에 활용하지 않음
- 기존 `/btw analyze`는 수동 실행 필요 + 스킬 생성까지 연결되지 않음
- Hermes Agent, Windsurf Memories 등 경쟁 제품이 자기학습 기능을 제공하지만 투명성/감사 가능성이 없음
- bkit에는 이미 skill-create 파이프라인(generator.js, validator.js)과 2-layer skill loader가 있어 인프라 80%가 준비됨

### 1.3 Related Documents

- PRD: `docs/00-pm/skill-evolution.prd.md`
- 기존 인프라: `skill-creator/generator.js`, `skill-creator/validator.js`
- btw 스킬: `skills/btw/SKILL.md`
- 메트릭 수집기: `lib/quality/metrics-collector.js`
- 감사 로거: `lib/audit/audit-logger.js`

---

## 2. Scope

### 2.1 In Scope

- [x] Phase 1 (P0): Pattern Miner — gap 반복, 메트릭 하락, btw 클러스터 3종 패턴 감지
- [x] Phase 1 (P0): Skill Synthesizer — 패턴 → SKILL.md + eval.yaml 자동 생성 (staging area)
- [x] Phase 1 (P0): Evolution Tracker — 기본 생애주기 상태 관리 (proposed → approved → deployed)
- [x] Phase 1 (P0): `/pdca evolve` 서브커맨드 (mine, status, approve, reject)
- [x] Phase 1 (P0): Report 완료 시 자동 트리거
- [x] Phase 1 (P0): 전체 감사 로그 통합
- [ ] Phase 2 (P1): 효과 측정 (before/after 3사이클 메트릭 비교)
- [ ] Phase 2 (P1): 자동 deprecation 플래깅 (<2%p 개선 시)
- [ ] Phase 2 (P1): btw 20개 초과 시 마이닝 제안 트리거
- [ ] Phase 3 (P2): 크로스 프로젝트 패턴 집계
- [ ] Phase 3 (P2): 마켓플레이스 스킬 공유

### 2.2 Out of Scope

- ML/NLP 의존성 (외부 모델, 임베딩 서버 등)
- 외부 API 호출 (모든 패턴 마이닝은 로컬)
- Starter 레벨 지원 (데이터 볼륨 부족)
- UI 대시보드 구현 (bkit-app은 읽기 전용 모니터 — 데이터 export만 제공)
- 자동 승인 (인간 승인 게이트 필수)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | **Pattern Miner**: gap 분석 문서에서 3회 이상 반복되는 gap 유형 감지 (Pattern A) | P0 | Pending |
| FR-02 | **Pattern Miner**: quality-history.json에서 특정 PDCA phase에 반복 하락하는 M1-M10 메트릭 감지 (Pattern B) | P0 | Pending |
| FR-03 | **Pattern Miner**: btw 제안을 키워드 기반 Jaccard 유사도로 클러스터링 (similarity >= 0.7) (Pattern C) | P0 | Pending |
| FR-04 | **Pattern Miner**: 패턴별 confidence 점수 산출 (occurrences * evidence_strength * recency_weight) | P0 | Pending |
| FR-05 | **Pattern Miner**: confidence < 0.6 패턴 자동 억제 | P0 | Pending |
| FR-06 | **Pattern Miner**: 설정 가능한 임계값 (bkit.config.json) | P1 | Pending |
| FR-07 | **Skill Synthesizer**: Pattern Miner 출력 → generator.js 호출 → SKILL.md 생성 | P0 | Pending |
| FR-08 | **Skill Synthesizer**: 패턴 유형별 자동 분류 (gap→workflow, metric→capability, btw→빈도 기반) | P0 | Pending |
| FR-09 | **Skill Synthesizer**: 패턴 근거에서 eval.yaml 자동 생성 | P0 | Pending |
| FR-10 | **Skill Synthesizer**: validator.js로 생성된 스킬 구조 검증 | P0 | Pending |
| FR-11 | **Skill Synthesizer**: staging area (`.bkit/evolution/staging/`)에 스킬 배치 | P0 | Pending |
| FR-12 | **Skill Synthesizer**: 근거 요약 포함 사람이 읽을 수 있는 제안서 생성 | P0 | Pending |
| FR-13 | **Evolution Tracker**: 생애주기 상태 관리 (proposed → approved → deployed → measured → deprecated) | P0 | Pending |
| FR-14 | **Evolution Tracker**: `.bkit/evolution/history.json`에 이력 저장 (FIFO, max 200) | P0 | Pending |
| FR-15 | **Evolution Tracker**: 모든 상태 전이를 audit-logger.js로 기록 (category: 'evolution') | P0 | Pending |
| FR-16 | **Trigger**: `/pdca report` 완료 시 Pattern Miner 자동 실행 | P0 | Pending |
| FR-17 | **CLI**: `/pdca evolve mine` — 수동 패턴 마이닝 트리거 | P0 | Pending |
| FR-18 | **CLI**: `/pdca evolve status` — 현재 진화 상태 표시 | P0 | Pending |
| FR-19 | **CLI**: `/pdca evolve approve <skill>` — 제안 승인 (staging → skills/) | P0 | Pending |
| FR-20 | **CLI**: `/pdca evolve reject <skill> --reason` — 제안 거부 (사유 기록) | P1 | Pending |
| FR-21 | **Tracker**: 효과 측정 — 배포 전/후 3사이클 M1-M10 비교 | P1 | Pending |
| FR-22 | **Tracker**: 자동 deprecation 플래깅 — 5사이클 후 <2%p 개선 시 | P1 | Pending |
| FR-23 | **Trigger**: btw-suggestions.json 20개 초과 시 마이닝 제안 | P1 | Pending |
| FR-24 | **Tracker**: bkit-app용 효과 데이터 export (읽기 전용) | P2 | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 패턴 마이닝 10초 이내 (데이터 포인트 <100) | 타이머 측정 |
| Reliability | confidence < 0.6 제안 0건 (false positive 억제) | 테스트 검증 |
| Auditability | 모든 진화 액션 JSONL 감사 로그 100% 기록 | 감사 로그 검증 |
| Compatibility | 생성된 스킬이 Agent Skills standard (agentskills.io) 준수 | validator.js 검증 |
| Graceful Degradation | 3 사이클 미만 시 에러 없이 빈 결과 반환 + 안내 메시지 | Cold start 테스트 |
| Isolation | 진화 데이터 `.bkit/evolution/`에 격리 (코어 상태와 분리) | 경로 검증 |
| Dependency | 외부 API 호출 없음 — 100% 로컬 처리 | 코드 리뷰 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] Pattern Miner가 3종 패턴(gap, metric, btw) 모두 감지
- [ ] Skill Synthesizer가 유효한 SKILL.md + eval.yaml 생성
- [ ] Evolution Tracker가 생애주기 상태 관리 + 감사 로그 기록
- [ ] `/pdca evolve mine|status|approve|reject` 커맨드 동작
- [ ] `/pdca report` 완료 시 자동 트리거 동작
- [ ] Cold start (데이터 부족) 시 graceful degradation
- [ ] 10개 테스트 시나리오 (PRD TS-01~TS-10) 통과

### 4.2 Quality Criteria

- [ ] 패턴 마이닝 10초 이내 수행
- [ ] confidence < 0.6 제안 억제 동작 확인
- [ ] 모든 상태 전이 JSONL 감사 로그에 기록 확인
- [ ] 생성된 스킬이 validator.js 검증 통과
- [ ] 기존 PDCA 워크플로우에 영향 없음 (회귀 없음)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| R1: 저품질 제안이 사용자 신뢰 훼손 | Critical | High | 초기 confidence >= 0.7 보수적 임계값. 승인율 < 40% 시 자동 임계값 상향. confidence 점수 눈에 띄게 표시 |
| R2: Cold start — 대부분 사용자가 3 사이클 미만 | High | High | 수동 `/pdca evolve mine` 제공. btw 임계값을 3개로 낮춤. 데이터 부족 시 "N 사이클 더 필요" 진행 표시기 |
| R3: 구문적으로 유효하지만 의미적으로 잘못된 스킬 생성 | Critical | Medium | eval.yaml이 근거 기반 검증. 인간 승인 게이트가 안전망. 향후 shadow mode (1사이클 시험 배포) 추가 가능 |
| R4: `/pdca evolve` 서브커맨드가 기존 PDCA 스킬과 충돌 | Medium | Low | pdca SKILL.md에 evolve 서브커맨드 추가. 기존 커맨드와 네임스페이스 분리 검증 |
| R5: 대량의 패턴이 감지되어 사용자를 압도 | Medium | Medium | 상위 5개 패턴만 제안. 나머지는 `/pdca evolve status --all`로 접근 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| `skills/pdca/SKILL.md` | Skill | `evolve` 서브커맨드 (mine/status/approve/reject) 추가 |
| `lib/pdca/` | Library | report 완료 후 Pattern Miner 트리거 훅 추가 |
| `bkit.config.json` | Config | evolution 섹션 추가 (임계값, max entries 등) |
| `.bkit/evolution/` | State Dir | 신규 디렉토리 (staging/, history.json) |
| `skill-creator/generator.js` | Library | 패턴 기반 템플릿 모드 추가 (기존 인터페이스 유지) |

### 6.2 Current Consumers

| Resource | Operation | Code Path | Impact |
|----------|-----------|-----------|--------|
| `skills/pdca/SKILL.md` | READ | pdca skill loader → 모든 /pdca 커맨드 | 영향 없음 — 신규 서브커맨드 추가만 |
| `lib/pdca/` | IMPORT | hooks/stop.js → report 완료 감지 | 트리거 훅 추가 — 기존 흐름 유지 |
| `bkit.config.json` | READ | lib/core/config.js → 설정 로드 | 신규 섹션 — 기존 설정 영향 없음 |
| `skill-creator/generator.js` | CALL | /skill-create 워크플로우 | 기존 인터페이스 유지, 신규 모드 추가만 |
| `.bkit/btw-suggestions.json` | READ | btw 스킬, Pattern Miner | 읽기만 — 변경 없음 |
| `.bkit/state/quality-history.json` | READ | metrics-collector, Pattern Miner | 읽기만 — 변경 없음 |

### 6.3 Verification

- [ ] 기존 `/pdca plan|design|do|analyze|iterate|report` 정상 동작 확인
- [ ] 기존 `/btw` 커맨드 정상 동작 확인
- [ ] 기존 `/skill-create` 워크플로우 정상 동작 확인
- [ ] bkit.config.json evolution 섹션 없어도 기본값으로 동작 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS | Web apps | |
| **Enterprise** | Strict layer separation, microservices | Complex systems | **X** |

> bkit 자체가 Enterprise 레벨 플러그인 아키텍처. Skill Evolution은 기존 `lib/` 구조를 따름.

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 클러스터링 알고리즘 | 키워드 Jaccard / TF-IDF / 임베딩 | **키워드 Jaccard** | 외부 의존성 없음(NFR-07), 감사 가능, 충분한 정확도 |
| CLI 인터페이스 | 독립 `/evolve` / PDCA 서브커맨드 | **`/pdca evolve`** | 일관된 PDCA UX, 단일 스킬 네임스페이스 |
| 효과 측정 기간 | 3 사이클 / 5 사이클 | **3 사이클** | 빠른 피드백 루프, PRD 기준 |
| 스킬 배치 위치 | skills/ 직접 / staging area | **staging → skills/** | 인간 승인 게이트 필수 |
| 데이터 저장 | 코어 state/ / 별도 evolution/ | **`.bkit/evolution/`** | 코어 상태와 격리 (NFR-06) |
| 패턴 제안 수 | 무제한 / 상위 N개 | **상위 5개** | 사용자 압도 방지 |

### 7.3 Module Architecture

```
lib/evolution/                    ← 신규 디렉토리
├── pattern-miner.js              ← 3종 패턴 감지 엔진
│   ├── mineGapPatterns()         ← Pattern A: gap 반복 분석
│   ├── mineMetricPatterns()      ← Pattern B: 메트릭 하락 상관
│   ├── mineBtwPatterns()         ← Pattern C: btw 클러스터링
│   ├── scorePattern()            ← confidence 산출
│   └── mineAll()                 ← 통합 마이닝 + 상위 5개 필터
│
├── skill-synthesizer.js          ← 패턴 → 스킬 변환
│   ├── synthesizeSkill()         ← generator.js 호출 래퍼
│   ├── generateEvalFromPattern() ← 패턴 근거 → eval.yaml
│   ├── classifyPattern()         ← 자동 분류 (workflow/capability)
│   └── stageSkill()              ← staging area에 배치
│
├── tracker.js                    ← 생애주기 관리
│   ├── propose()                 ← proposed 상태 기록
│   ├── approve()                 ← staging → skills/ 이동
│   ├── reject()                  ← 거부 사유 기록
│   ├── measure()                 ← before/after 메트릭 비교 (P1)
│   ├── flagDeprecation()         ← 저효과 스킬 플래그 (P1)
│   └── getStatus()               ← 현재 진화 상태 조회
│
└── index.js                      ← 모듈 공개 API

.bkit/evolution/                  ← 데이터 디렉토리
├── staging/                      ← 승인 대기 스킬
│   └── {skill-name}/
│       ├── SKILL.md
│       └── evals/eval.yaml
├── history.json                  ← 진화 이력 (FIFO, max 200)
└── proposals.json                ← 현재 제안 목록
```

### 7.4 Integration Points

```
┌─────────────────────────────────────────────────────────────┐
│ PDCA Cycle                                                   │
│                                                              │
│  Plan → Design → Do → Check → Act → Report                  │
│                                                 │            │
│                                          ┌──────┴──────┐    │
│                                          │ Report Hook  │    │
│                                          │ (trigger)    │    │
│                                          └──────┬──────┘    │
│                                                 │            │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────┴──────┐    │
│  │ btw-suggest.  │  │ quality-history │  │ Pattern     │    │
│  │ .json         ├──┤ .json          ├──┤ Miner       │    │
│  │               │  │                │  │             │    │
│  └──────────────┘  └─────────────────┘  └──────┬──────┘    │
│                                                 │            │
│  ┌──────────────┐  ┌─────────────────┐  ┌──────┴──────┐    │
│  │ gap analysis  ├──┤ generator.js   ├──┤ Skill       │    │
│  │ docs          │  │ validator.js   │  │ Synthesizer │    │
│  └──────────────┘  └─────────────────┘  └──────┬──────┘    │
│                                                 │            │
│  ┌──────────────┐                       ┌──────┴──────┐    │
│  │ audit-logger ├───────────────────────┤ Evolution   │    │
│  │ .js          │                       │ Tracker     │    │
│  └──────────────┘                       └──────┬──────┘    │
│                                                 │            │
│                                          ┌──────┴──────┐    │
│                                          │ /pdca evolve│    │
│                                          │ approve     │    │
│                                          └──────┬──────┘    │
│                                                 │            │
│                                          ┌──────┴──────┐    │
│                                          │ 2-layer     │    │
│                                          │ skill loader│    │
│                                          └─────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [x] `CLAUDE.md` has coding conventions section
- [x] ESLint configuration
- [x] Consistent module structure in `lib/`

### 8.2 Conventions to Follow

| Category | Convention | Priority |
|----------|-----------|:--------:|
| **File naming** | `lib/evolution/*.js` — 기존 lib 하위 디렉토리 패턴 따름 | High |
| **Export pattern** | Named exports + index.js 재수출 — 기존 lib 모듈 패턴 | High |
| **State storage** | `.bkit/evolution/` — 기존 `.bkit/state/` 패턴과 동일한 atomic write | High |
| **Audit logging** | `writeAuditLog()` 호출 — category: 'evolution' | High |
| **Config** | `bkit.config.json`의 `evolution` 섹션 — 기존 config 패턴 | Medium |
| **Error handling** | 데이터 없음 시 빈 배열 반환 + 안내 메시지 — 기존 cold start 패턴 | Medium |

### 8.3 Environment Variables Needed

> 없음. 모든 설정은 `bkit.config.json`으로 관리.

---

## 9. Next Steps

1. [ ] Design 문서 작성 (`/pdca design skill-evolution`)
2. [ ] 3가지 아키텍처 옵션 비교 및 선택
3. [ ] 구현 시작 (`/pdca do skill-evolution`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-04 | Initial draft from PRD | Claude (PM Agent Team) |
