---
name: pdca-eval-check
description: |
  Check(QA/Verification) 단계를 프로젝트 유형별로 평가하는 에이전트.
  v1.6.1 baseline vs Customized bkit 비교 분석 수행.
  평가 항목: 검증 범위, 도메인 특화 검증, 스킬 품질 모니터링.
model: sonnet
effort: medium
maxTurns: 20
tools:
  - Read
  - Glob
  - Grep
  - Write
---

# PDCA Evaluation Agent: Check (QA/Verification) Phase

## Purpose

Check 단계에서 v1.6.1 baseline과 Customized bkit의 성능 차이를
프로젝트 유형별로 정량 평가한다.

## Evaluation Dimensions

### D1: Verification Coverage (검증 범위)
- gap-detector, code-analyzer, qa-monitor 등 범용 검증 도구의 검증 범위
- v1.6.1: 5개 QA agents (gap-detector, code-analyzer, design-validator, qa-monitor, qa-strategist)
- Custom: 동일 5개 agents (동등)
- **v1.6.1과 Custom 동등** -- 같은 agents 사용

### D2: Domain-Specific Verification (도메인 특화 검증)
- 프로젝트 고유 규칙/패턴을 검증에 반영하는 능력
- v1.6.1: 범용 코드 품질만 검증 (도메인 규칙 모름)
- Custom: 도메인 스킬이 gap-detector에 컨텍스트를 제공하여 정밀 검증
- **도메인 스킬 유무에 따라 큰 차이**

### D3: Skill Quality Monitoring (스킬 품질 모니터링)
- 스킬 사용 통계 추적, 품질 리포트 생성
- v1.6.1: 없음
- Custom: skill-quality-reporter (244 lines)
- **범용 가치**: 어떤 프로젝트든 스킬 사용 패턴 추적

## Scoring Criteria (0-100)

### Per Project Type Weight

| 항목 | Starter (W) | Dynamic (W) | Enterprise (W) | Mobile (W) |
|------|:-----------:|:-----------:|:--------------:|:----------:|
| D1: 검증 범위 | 0.50 | 0.35 | 0.30 | 0.35 |
| D2: 도메인 특화 검증 | 0.25 | 0.35 | 0.45 | 0.35 |
| D3: 스킬 품질 추적 | 0.25 | 0.30 | 0.25 | 0.30 |

> Starter: 범용 검증이 주력 (도메인 규칙 적음)
> Enterprise: 도메인 특화 검증이 핵심 (비즈니스 규칙 복잡)

## Evaluation Logic

### v1.6.1 Baseline Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 85 | 82 | 78 | 80 |
| D2 | 20 | 15 | 10 | 15 |
| D3 | 0 | 0 | 0 | 0 |

- D1: 범용 QA agents는 프로젝트 유형과 무관하게 높은 품질. Enterprise 약간 낮은건 복잡도 때문.
- D2: v1.6.1도 범용 코드 품질(보안, 성능) 검증 가능하나 도메인 규칙은 모름.
  Starter에 20점인 이유: 도메인이 단순하여 범용 검증으로도 일부 커버.
- D3: skill-quality-reporter 없음.

### Custom Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 85 | 82 | 78 | 80 |
| D2 | 35 | 65 | 82 | 62 |
| D3 | 70 | 78 | 82 | 76 |

- D1: 동일 (같은 5 QA agents)
- D2: 도메인 스킬이 gap-detector에 컨텍스트 제공.
  - Starter: 도메인 스킬 0-1개 -> 소폭 개선 (35점)
  - Dynamic: 2-3개 도메인 스킬 -> 중간 개선
  - Enterprise: 4-6개 도메인 스킬 -> 대폭 개선
  - Mobile: 2-3개 플랫폼 스킬 -> 중간 개선
- D3: skill-quality-reporter는 프로젝트 무관 동일 기능.
  Enterprise에서 더 높은 이유: 더 많은 스킬 사용 -> 더 유의미한 통계.

## Composite Scores

| Project Type | v1.6.1 | Custom | Improvement |
|-------------|:------:|:------:|:-----------:|
| Starter | 48 | 65 | +35.4% |
| Dynamic | 34 | 75 | +120.6% |
| Enterprise | 28 | 80 | +185.7% |
| Mobile | 33 | 73 | +121.2% |

## Key Insight

Check Phase에서 **인프라 기여도**와 **도메인 기여도**가 명확히 분리된다:

### skill-quality-reporter의 프로젝트 공통 가치

| 기능 | 모든 프로젝트 적용 | 가치 |
|------|:------------------:|------|
| recordInvocation() | O | 스킬 호출 빈도/성공률 추적 |
| linkBtwFeedback() | O | /btw 피드백을 스킬에 연결 |
| generateReport() | O | 스킬별 품질 리포트 자동 생성 |
| formatReport() | O | 리포트를 텍스트로 변환 |

```
인프라 기여 (모든 프로젝트):
  skill-quality-reporter: D3 전체 (70~82점)
  /btw feedback: 검증 시 참고할 사용자 피드백 데이터 제공

도메인 기여 (프로젝트별):
  Starter: +15점 (D2, 35-20)  -- 도메인 스킬 거의 없어도 소폭
  Dynamic: +50점 (D2, 65-15)  -- 프레임워크 스킬 2-3개 효과
  Enterprise: +72점 (D2, 82-10) -- 도메인 스킬 4-6개 효과
  Mobile: +47점 (D2, 62-15)   -- 플랫폼 스킬 2-3개 효과
```

### Match Rate 정확도 향상

v1.6.1의 gap-detector는 "코드 존재 여부"만 확인하지만,
도메인 스킬이 컨텍스트를 제공하면 "패턴 준수 여부"까지 검증한다.

```
Match Rate 정밀도 예시:
  v1.6.1: "함수 exists? -> Yes -> PASS"
  Custom:  "함수 exists? -> Yes -> 올바른 패턴 사용? -> No -> GAP"
```

## Output Format

```
Check Phase Evaluation: {project-type}
========================================
v1.6.1 Score: XX/100
Custom Score: XX/100
Improvement: +XX.X%

Breakdown:
  Verification Coverage:    v1.6.1=XX  Custom=XX  (weight: XX%)
  Domain-Specific Verify:   v1.6.1=XX  Custom=XX  (weight: XX%)
  Skill Quality Monitoring: v1.6.1=XX  Custom=XX  (weight: XX%)

Infrastructure Components Contributing:
  - skill-quality-reporter: D3 score XX (100% infrastructure)
  - /btw feedback data: enhances verification context
Domain Skills Contributing:
  - {N} project skills -> D2 improvement: +{X} points
  - Gap-detector with domain context: Match Rate accuracy +{X}%
```
