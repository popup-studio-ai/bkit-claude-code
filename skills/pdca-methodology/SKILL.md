---
name: pdca-methodology
description: |
  PDCA (Plan-Do-Check-Act) methodology knowledge.
  Covers documentation-first development, design-implementation sync, continuous improvement.

  Triggers: PDCA, plan, design, check, act, 계획, 설계, 検証, 改善
agent: design-validator
allowed-tools:
  - Read
  - Write
  - Grep
  - Glob
user-invocable: true
---

# PDCA 방법론 스킬

## PDCA 사이클 개요

```
┌─────────────────────────────────────────────────────────┐
│                      PDCA Cycle                          │
├──────────────┬──────────────────────────────────────────┤
│ Plan         │ 계획 수립 및 문서화                        │
│              │ → docs/01-plan/에 기록                    │
├──────────────┼──────────────────────────────────────────┤
│ Do           │ 설계 기반 구현                            │
│              │ → 설계 문서 참조하며 코딩                  │
├──────────────┼──────────────────────────────────────────┤
│ Check        │ 설계 vs 구현 분석                         │
│              │ → docs/03-analysis/에 결과 기록           │
├──────────────┼──────────────────────────────────────────┤
│ Act          │ 학습 및 개선                              │
│              │ → docs/04-report/에 보고서 작성           │
└──────────────┴──────────────────────────────────────────┘
```

## 각 단계 상세

### Plan (계획)

**목적**: 무엇을, 왜, 어떻게 할지 문서화

```markdown
# {기능명} 계획서

## 목표
- 무엇을 달성할 것인가?

## 배경
- 왜 필요한가?

## 범위
- 포함되는 것
- 제외되는 것

## 성공 기준
- 어떻게 완료를 판단하나?

## 일정 (선택)
- 예상 기간
```

### Design (설계)

**목적**: 구현 전 상세 설계 문서화

```markdown
# {기능명} 설계서

## 아키텍처
- 컴포넌트 구조
- 데이터 흐름

## 데이터 모델
- 엔티티 정의
- 관계

## API 명세
- 엔드포인트
- 요청/응답

## UI/UX (해당 시)
- 화면 구성
- 사용자 흐름
```

### Do (실행)

**목적**: 설계를 기반으로 구현

```
규칙:
1. 설계 문서를 먼저 읽기
2. TodoWrite로 작업 추적
3. 설계와 다르게 구현해야 하면 먼저 설계 업데이트
4. 완료 후 Check 단계로
```

### Check (분석)

**목적**: 설계와 구현의 차이 분석

```markdown
# {기능명} 분석 결과

## 설계 일치율
- N%

## 차이점
- 설계에는 있지만 구현에 없는 것
- 구현에는 있지만 설계에 없는 것
- 설계와 다르게 구현된 것

## 이슈
- 발견된 문제점
- 원인 분석

## 권장 조치
- 구현 수정 / 설계 업데이트
```

### Act (개선)

**목적**: 학습 내용 정리 및 다음 사이클 준비

```markdown
# {기능명} 완료 보고서

## 결과 요약
- 완료된 항목
- 미완료 항목

## 학습
- 잘한 점
- 개선할 점

## 다음 단계
- 후속 작업
- 다음 사이클 계획
```

## 문서 폴더 구조

```
docs/
├── 01-plan/                    # [P] 계획
│   ├── _INDEX.md              # 목록 및 상태
│   ├── requirements.md        # 전체 요구사항
│   └── features/
│       └── {feature}.plan.md  # 기능별 계획
│
├── 02-design/                  # [D] 설계
│   ├── _INDEX.md
│   ├── architecture.md        # 전체 아키텍처
│   ├── data-model.md          # 데이터 모델
│   ├── api-spec.md            # API 명세
│   └── features/
│       └── {feature}.design.md
│
├── 03-analysis/                # [C] 분석
│   ├── _INDEX.md
│   ├── gap-analysis/          # 설계-구현 차이
│   └── issues/                # 이슈 분석
│
└── 04-report/                  # [A] 보고
    ├── _INDEX.md
    ├── changelog.md           # 변경 이력
    └── features/
        └── {feature}.report.md
```

## PDCA 적용 규칙

### 새 기능 요청 시

```
1. docs/02-design/ 확인
2. 설계 없으면 → 먼저 설계 문서 작성
3. 설계 있으면 → 설계 기반 구현
4. 구현 완료 후 → Check 제안
```

### 버그 수정 요청 시

```
1. docs/03-analysis/issues/ 확인
2. 원인 분석 후 문서화
3. 수정 구현
4. 분석 문서 업데이트
```

### 리팩토링 시

```
1. 현재 상태 분석 (Check)
2. 개선 계획 수립 (Plan)
3. 설계 문서 업데이트 (Design)
4. 리팩토링 구현 (Do)
5. 결과 분석 및 보고 (Check, Act)
```

## PDCA 성숙도 수준

| 수준 | 설명 | 문서화 수준 |
|------|------|------------|
| Level 1 | 기본 | README만 있음 |
| Level 2 | 계획 | 요구사항 문서화 |
| Level 3 | 설계 | 설계 문서화 |
| Level 4 | 분석 | 설계-구현 동기화 |
| Level 5 | 지속 개선 | 전체 PDCA 사이클 운영 |

## 핵심 원칙

```
1. 문서가 먼저 (Documentation First)
   - 코드 전에 설계
   - 구현 중 설계 참조
   - 변경 시 문서 업데이트

2. 추측 금지 (No Guessing)
   - 모르면 문서 확인
   - 문서에 없으면 질문
   - 가정하지 말고 기록

3. 지속적 동기화 (Continuous Sync)
   - 설계와 구현은 항상 일치
   - 차이 발견 시 즉시 조치
   - 주기적 검증

4. 학습과 개선 (Learn & Improve)
   - 매 사이클에서 배우기
   - 프로세스 개선
   - 팀 지식 축적
```

## Development Pipeline과의 관계

### Pipeline과 PDCA는 별개가 아님

```
❌ 잘못된 이해:
Pipeline 전체를 PDCA에 매핑
(Plan=Phase1-3, Do=Phase4-6, Check=Phase7-8, Act=Phase9)

✅ 올바른 이해:
각 Phase마다 PDCA 사이클을 돈다

Phase N
├── Plan: 이번 Phase에서 할 일 계획
├── Design: 구체적 설계
├── Do: 실행/구현
├── Check: 검증/리뷰
└── Act: 확정 후 다음 Phase로
```

### 시각적 표현

```
┌─────────────────────────────────────────────────────────────────┐
│                    Development Pipeline                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Phase 1 ──→ Phase 2 ──→ Phase 3 ──→ ... ──→ Phase 9           │
│    │           │           │                    │                │
│  [PDCA]      [PDCA]      [PDCA]              [PDCA]             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 적용 범위

| 상황 | PDCA | Pipeline |
|------|------|----------|
| 새 프로젝트 개발 (비개발자) | ✅ | ✅ |
| 새 프로젝트 개발 (숙련자) | ✅ | 선택 |
| 기능 추가/수정 | ✅ | ❌ |
| 버그 수정 | ✅ | ❌ |
| 비개발 AI 작업 | ✅ | ❌ |

**핵심**: 
- PDCA는 **모든 작업**에 적용
- Pipeline은 **새 프로젝트 개발**에만, **선택적** 적용

### 참조 스킬

- `development-pipeline/`: Pipeline 전체 지식
- `phase-1-schema/` ~ `phase-9-deployment/`: Phase별 가이드
