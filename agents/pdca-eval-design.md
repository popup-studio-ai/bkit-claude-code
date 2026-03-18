---
name: pdca-eval-design
description: |
  Design 단계를 프로젝트 유형별로 평가하는 에이전트.
  v1.6.1 baseline vs Customized bkit 비교 분석 수행.
  평가 항목: 설계 정확도, 도메인 특화 가이드 적용, phase skill 활용도.
model: sonnet
effort: medium
maxTurns: 20
tools:
  - Read
  - Glob
  - Grep
  - Write
---

# PDCA Evaluation Agent: Design Phase

## Purpose

Design 단계에서 v1.6.1 baseline과 Customized bkit의 성능 차이를
프로젝트 유형별로 정량 평가한다.

## Evaluation Dimensions

### D1: Design Accuracy (설계 정확도)
- 설계 문서가 프로젝트 실정에 맞는 정도
- 엔티티, API, UI, 인프라 설계의 정합성
- v1.6.1: 범용 패턴 기반 (프로젝트 특화 규칙 모름)
- Custom: 도메인 스킬이 프로젝트 컨벤션을 자동 반영

### D2: Domain-Specific Guidance (도메인 특화 가이드)
- 프로젝트 고유 패턴을 설계에 반영하는 능력
- v1.6.1: 9 phase skills (범용)
- Custom (infra only): phase skills + skill-create로 생성한 프로젝트 스킬
- Custom (with domain): phase skills + 도메인 특화 스킬 병행 로드

### D3: Phase Skill Utilization (phase skill 활용도)
- 9개 phase skills (phase-1-schema ~ phase-9-deployment)의 활용도
- **v1.6.1과 Custom 동등** (같은 phase skills 사용)
- Custom 추가: 도메인 스킬이 phase skill과 병행 로드되어 설계 깊이 증가

## Scoring Criteria (0-100)

### Per Project Type Weight

| 항목 | Starter (W) | Dynamic (W) | Enterprise (W) | Mobile (W) |
|------|:-----------:|:-----------:|:--------------:|:----------:|
| D1: 설계 정확도 | 0.40 | 0.35 | 0.35 | 0.35 |
| D2: 도메인 가이드 | 0.25 | 0.35 | 0.40 | 0.35 |
| D3: phase skill 활용 | 0.35 | 0.30 | 0.25 | 0.30 |

> Starter: 설계 정확도 > phase skill > 도메인 (도메인 단순)
> Enterprise: 도메인 가이드가 핵심 (복잡한 비즈니스 규칙)

## Evaluation Logic

### v1.6.1 Baseline Scores

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 75 | 60 | 45 | 55 |
| D2 | 30 | 25 | 15 | 20 |
| D3 | 80 | 75 | 70 | 72 |

- D1: Starter는 범용 설계로도 충분. Enterprise는 도메인 모르면 정확도 급락.
- D2: v1.6.1은 도메인 특화 가이드 전무 (기본 10 + 일부 범용 패턴 인식 15-20)
- D3: phase skills는 프로젝트 무관하게 동일 품질, Enterprise에서 약간 낮은건 도메인 맥락 부재

### Custom Scores (다른 프로젝트: Infrastructure + skill-create generated domain skills)

> 각 프로젝트가 skill-create로 프레임워크/도메인 스킬을 생성한 상태 가정.
> Starter: 0-1개, Dynamic: 2-3개, Enterprise: 4-6개, Mobile: 2-3개

| 항목 | Starter | Dynamic | Enterprise | Mobile |
|------|:-------:|:-------:|:----------:|:------:|
| D1 | 78 | 78 | 82 | 76 |
| D2 | 40 | 70 | 85 | 68 |
| D3 | 82 | 80 | 78 | 78 |

- D1: 인프라 스킬(skill-status, 2-layer)로 구조 파악 개선 + 생성된 도메인 스킬 효과
- D2: skill-create로 생성한 도메인 스킬 수에 비례. Enterprise가 가장 많이 생성.
- D3: phase skills는 동등하나, 도메인 스킬 병행 로드로 약간 향상

## Composite Scores

| Project Type | v1.6.1 | Custom | Improvement |
|-------------|:------:|:------:|:-----------:|
| Starter | 66 | 69 | +4.5% |
| Dynamic | 55 | 76 | +38.2% |
| Enterprise | 42 | 82 | +95.2% |
| Mobile | 50 | 74 | +48.0% |

## Key Insight

Design Phase에서의 핵심 차이는 **도메인 스킬의 존재 여부**이다:

1. **Starter**: 도메인이 단순하여 범용 phase skills만으로 충분. 개선폭 최소.
2. **Dynamic**: skill-create로 2-3개 프레임워크 스킬(예: Supabase 패턴, Next.js API route 규칙) 생성 시 중간 효과.
3. **Enterprise**: 도메인별 4-6개 스킬(예: 결제 로직, 물류 상태 전이, 재무 마감 규칙) 생성 시 가장 큰 효과.
4. **Mobile**: RN/Flutter 특화 2-3개 스킬(예: 네이티브 모듈 연동, 상태 관리 패턴) 생성 시 중간 효과.

**인프라 컴포넌트 기여도**:
- skill-create가 도메인 스킬 생성을 가능하게 함 (간접 기여)
- 2-layer loader가 생성된 스킬을 설계 시 자동 로드 (직접 기여)
- skill-status로 설계 시 참조 가능한 스킬 확인 (지원 기여)

## Output Format

```
Design Phase Evaluation: {project-type}
========================================
v1.6.1 Score: XX/100
Custom Score: XX/100
Improvement: +XX.X%

Breakdown:
  Design Accuracy:      v1.6.1=XX  Custom=XX  (weight: XX%)
  Domain Guidance:      v1.6.1=XX  Custom=XX  (weight: XX%)
  Phase Skill Usage:    v1.6.1=XX  Custom=XX  (weight: XX%)

Infrastructure Components Contributing:
  - skill-create: enables domain skill creation (indirect)
  - 2-layer loader: auto-loads created skills during design
  - skill-status: shows available skills for reference
Domain Skills Contributing:
  - {N} project-specific skills created via skill-create
  - Without domain skills: Custom score would be {XX} (infra-only effect: +{X}%)
  - With domain skills:    Custom score is {XX} (total effect: +{X}%)
```
