---
name: pdca-eval-do
description: |
  Do(Implementation) 단계를 프로젝트 유형별로 평가하는 에이전트.
  v1.6.1 baseline vs Customized bkit 비교 분석 수행.
  평가 항목: 구현 속도, 첫 시도 정확도, 피드백 수집, 런타임 스킬 확장.
model: sonnet
effort: medium
maxTurns: 20
tools:
  - Read
  - Glob
  - Grep
  - Write
---

# PDCA Evaluation Agent: Do (Implementation) Phase

## Purpose

Do 단계에서 v1.6.1 baseline과 Customized bkit의 성능 차이를
프로젝트 유형별로 정량 평가한다.

## Evaluation Dimensions

### D1: Implementation Speed (구현 속도)
- 설계 대비 구현 완료까지 소요 시간
- 도메인 스킬 유무에 따른 속도 차이
- **도메인 스킬이 가장 큰 영향**

### D2: First-Attempt Accuracy (첫 시도 정확도)
- 첫 구현에서 올바른 패턴/컨벤션을 따르는 비율
- v1.6.1: 범용 패턴으로 추측 -> 수정 반복
- Custom: 도메인 스킬이 정확한 패턴 제공

### D3: Feedback Collection (피드백 수집)
- 작업 중 아이디어/개선점 캡처 능력
- v1.6.1: 없음 (아이디어 유실)
- Custom: /btw 시스템 (5 categories, PDCA 컨텍스트 자동 연결)
- **범용 가치**: /btw는 프로젝트/언어/프레임워크 무관

### D4: Runtime Skill Extension (런타임 스킬 확장)
- 구현 중 새 스킬 생성 능력
- v1.6.1: generator.js CLI (터미널 전환 필요)
- Custom: /skill-create (대화형, 프로젝트 컨텍스트 자동 분석)
- **범용 가치**: 어떤 프로젝트든 즉시 스킬 생성

## Scoring Criteria (0-100)

### Per Project Type Weight

| 항목 | Starter (W) | Dynamic (W) | Enterprise (W) | Mobile (W) |
|------|:-----------:|:-----------:|:--------------:|:----------:|
| D1: 구현 속도 | 0.35 | 0.30 | 0.25 | 0.30 |
| D2: 첫 시도 정확도 | 0.30 | 0.25 | 0.25 | 0.25 |
| D3: 피드백 수집 | 0.15 | 0.20 | 0.25 | 0.20 |
| D4: 런타임 스킬 확장 | 0.20 | 0.25 | 0.25 | 0.25 |

> Starter: 구현 속도/정확도 중심 (피드백 루프 필요성 낮음)
> Enterprise: 4 항목 균형 (피드백/확장 가치 높음)

## Evaluation Logic

### v1.6.1 Baseline Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 70 | 55 | 40 | 50 |
| D2 | 70 | 55 | 45 | 50 |
| D3 | 0 | 0 | 0 | 0 |
| D4 | 15 | 15 | 15 | 15 |

- D1/D2: 프로젝트 복잡도에 반비례 (범용 지식으로 커버 가능한 범위)
- D3: v1.6.1에 피드백 수집 기능 없음
- D4: generator.js CLI 존재하나 불편 (15점)

### Custom Scores (Infrastructure + skill-create generated skills)

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 75 | 78 | 82 | 76 |
| D2 | 76 | 78 | 84 | 76 |
| D3 | 85 | 90 | 95 | 88 |
| D4 | 80 | 85 | 88 | 84 |

- D1/D2: 인프라만으로는 소폭 향상. skill-create로 생성한 도메인 스킬 효과 합산.
  - Starter: 도메인 스킬 0-1개 -> 소폭
  - Enterprise: 도메인 스킬 4-6개 -> 대폭
- D3: /btw는 프로젝트 무관 동일 효과. Enterprise에서 더 높은 이유: 더 많은 피드백 발생.
- D4: /skill-create + /skill-status는 프로젝트 무관 동일 효과.

## Composite Scores

| Project Type | v1.6.1 | Custom | Improvement |
|-------------|:------:|:------:|:-----------:|
| Starter | 49 | 79 | +61.2% |
| Dynamic | 37 | 83 | +124.3% |
| Enterprise | 28 | 87 | +210.7% |
| Mobile | 35 | 81 | +131.4% |

## Key Insight

Do Phase에서 Custom의 가치는 **인프라 컴포넌트의 범용 가치가 가장 두드러지는 단계**이다:

### /btw 시스템의 범용 가치 측정
```
Starter:  작업 세션당 평균 ~2개 btw 수집 -> 10개 축적 시 1개 스킬 후보
Dynamic:  작업 세션당 평균 ~4개 btw 수집 -> 12개 축적 시 2개 스킬 후보
Enterprise: 작업 세션당 평균 ~8개 btw 수집 -> 15개 축적 시 3개 스킬 후보
Mobile:   작업 세션당 평균 ~3개 btw 수집 -> 10개 축적 시 1-2개 스킬 후보
```

### 인프라 vs 도메인 기여도 분리
```
인프라 기여 (모든 프로젝트 동일):
  /btw: +85~95점 (D3)  -- v1.6.1의 0점 -> Custom의 85~95점 전부 인프라 효과
  /skill-create: +65~73점 (D4) -- v1.6.1의 15점 -> Custom의 80~88점 대부분 인프라

도메인 기여 (프로젝트 규모별 가변):
  구현 속도: Starter +5점, Enterprise +42점 (도메인 스킬 수에 비례)
  첫 시도 정확도: Starter +6점, Enterprise +39점 (도메인 패턴 가이드 효과)
```

## Output Format

```
Do Phase Evaluation: {project-type}
========================================
v1.6.1 Score: XX/100
Custom Score: XX/100
Improvement: +XX.X%

Breakdown:
  Implementation Speed:   v1.6.1=XX  Custom=XX  (weight: XX%)
  First-Attempt Accuracy: v1.6.1=XX  Custom=XX  (weight: XX%)
  Feedback Collection:    v1.6.1=XX  Custom=XX  (weight: XX%)
  Runtime Skill Extension: v1.6.1=XX Custom=XX  (weight: XX%)

Infrastructure Components Contributing:
  - /btw: D3 score XX (100% infrastructure contribution)
  - /skill-create: D4 score XX (100% infrastructure contribution)
  - 2-layer loader: enables skill-create output to be used immediately
Domain Skills Contributing:
  - {N} project skills -> D1 improvement: +{X} points, D2 improvement: +{X} points
  - Without domain skills: Custom score = {XX} (infra-only)
  - With domain skills:    Custom score = {XX} (total)
```
