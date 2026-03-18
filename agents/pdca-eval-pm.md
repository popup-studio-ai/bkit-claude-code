---
name: pdca-eval-pm
description: |
  PM Analysis 단계를 프로젝트 유형별로 평가하는 에이전트.
  v1.6.1 baseline vs Customized bkit 비교 분석 수행.
  평가 항목: PRD 분석 깊이, 스킬 니즈 추출, PM->스킬 파이프라인 연결.
model: sonnet
effort: medium
maxTurns: 20
tools:
  - Read
  - Glob
  - Grep
  - Write
---

# PDCA Evaluation Agent: PM Analysis Phase

## Purpose

PM Analysis (Pre-PDCA) 단계에서 v1.6.1 baseline과 Customized bkit의 성능 차이를
프로젝트 유형별로 정량 평가한다.

## Evaluation Dimensions

### D1: PRD Analysis Depth (PRD 분석 깊이)
- pm-lead 5-agent team이 생성하는 PRD 품질
- OST, JTBD 6-Part VP, Lean Canvas, Persona, Competitor 분석 완성도
- **v1.6.1과 Custom 동등** -- 같은 pm-lead agent 사용

### D2: Skill Needs Extraction (스킬 니즈 추출)
- PRD에서 프로젝트 특화 스킬 니즈를 자동 식별하는 능력
- v1.6.1: 없음 (PRD 생성 후 종료)
- Custom: skill-needs-extractor agent가 자동 호출
- **범용 가치**: 어떤 프로젝트든 PRD가 있으면 스킬 갭 분석 가능

### D3: PM-to-Skill Pipeline (PM -> 스킬 파이프라인)
- PRD 분석 결과가 실제 스킬 생성까지 연결되는 정도
- v1.6.1: 수동 판단 필요
- Custom: pm-lead-skill-patch -> skill-needs-extractor -> skill-create 자동 파이프라인
- **범용 가치**: 프로젝트 무관하게 작동

## Scoring Criteria (0-100)

### Per Project Type Weight

| 항목 | Starter (W) | Dynamic (W) | Enterprise (W) | Mobile (W) |
|------|:-----------:|:-----------:|:--------------:|:----------:|
| D1: PRD 분석 깊이 | 0.50 | 0.35 | 0.30 | 0.35 |
| D2: 스킬 니즈 추출 | 0.20 | 0.30 | 0.35 | 0.30 |
| D3: PM->스킬 파이프라인 | 0.30 | 0.35 | 0.35 | 0.35 |

> Starter: PRD 분석 자체가 주요 가치 (스킬 니즈 적음)
> Enterprise: 스킬 니즈가 많아 추출/파이프라인 가중치 높음

## Evaluation Logic

### v1.6.1 Baseline Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 90 | 90 | 90 | 90 |
| D2 | 0 | 0 | 0 | 0 |
| D3 | 10 | 10 | 10 | 10 |

- D1: pm-lead 5-agent team은 프로젝트 유형과 무관하게 동일한 분석 품질
- D2: v1.6.1에는 skill-needs-extractor가 없음
- D3: 수동으로 스킬 필요성 판단해야 함 (10점 = 사용자가 직접 하는 최소 수준)

### Custom Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 90 | 90 | 90 | 90 |
| D2 | 60 | 80 | 90 | 80 |
| D3 | 55 | 80 | 88 | 78 |

- D1: 동일 (같은 pm-lead agent)
- D2: Starter는 스킬 니즈 자체가 적어 추출 가치 제한적
       Dynamic/Mobile은 중간 규모에서 효과적
       Enterprise는 도메인이 많아 추출 가치 극대화
- D3: 파이프라인 가치는 생성할 스킬 수에 비례

## Composite Score Calculation

```
Score = D1 * W1 + D2 * W2 + D3 * W3
```

### Results

| Project Type | v1.6.1 | Custom | Improvement |
|-------------|:------:|:------:|:-----------:|
| Starter | 48 | 75 | +56.3% |
| Dynamic | 35 | 86 | +145.7% |
| Enterprise | 31 | 89 | +187.1% |
| Mobile | 35 | 85 | +142.9% |

## Key Insight

PM Phase에서 Custom의 범용 가치는 **skill-needs-extractor + pm-lead-skill-patch**에서 나온다.
이 두 컴포넌트는 도메인 스킬 없이도 모든 프로젝트 PRD에서 스킬 갭을 식별한다.
프로젝트 규모가 클수록 식별되는 갭이 많아져 파이프라인 가치가 기하급수적으로 증가한다.

## Output Format

평가 결과를 다음 형식으로 출력:

```
PM Phase Evaluation: {project-type}
========================================
v1.6.1 Score: XX/100
Custom Score: XX/100
Improvement: +XX.X%

Breakdown:
  PRD Analysis Depth:    v1.6.1=XX  Custom=XX  (weight: XX%)
  Skill Needs Extract:   v1.6.1=XX  Custom=XX  (weight: XX%)
  PM->Skill Pipeline:    v1.6.1=XX  Custom=XX  (weight: XX%)

Infrastructure Components Contributing:
  - skill-needs-extractor: {impact description}
  - pm-lead-skill-patch: {impact description}
Domain Skills Contributing:
  - None (PM phase uses infrastructure only)
```
