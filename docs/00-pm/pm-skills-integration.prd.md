# bkit × pm-skills Integration — Product Requirements Document

> **Date**: 2026-03-21
> **Author**: pm-skills frameworks applied
> **Method**: pm-skills `/discover` + `/market-scan` + `/value-proposition` + `/strategy` chain
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | AI 코딩 도구들이 "코드 생성"에만 집중하고 "무엇을 왜 만들지"에 대한 제품 의사결정은 사용자에게 떠넘김. bkit은 PM 분석을 시도하지만 9개 프레임워크로 피상적 수준 |
| **Solution** | pm-skills의 65개 검증된 PM 프레임워크를 bkit의 PDCA 에이전트 시스템에 통합하여, AI가 제품 전략→실행→검증까지 일관된 PM 지원 제공 |
| **Target User** | 1인 개발자, 소규모 스타트업 PM, 사이드 프로젝트 빌더 — PM 전문성 없이 제품을 만드는 사람들 |
| **Core Value** | "코드를 짜기 전에 생각하게 만드는 AI" — 제품 실패율을 줄이는 구조화된 의사결정 시스템 |

---

# Part 1: Discovery (`/discover` chain)

## 1.1 Discovery Context

- **Product Stage**: Existing (bkit v1.6.2, 이미 PM Agent Team 운영 중)
- **Discovery Question**: pm-skills를 어떻게 통합해야 사용자의 제품 의사결정 품질이 가장 크게 향상되는가?
- **Prior Knowledge**: bkit 9개 프레임워크 vs pm-skills 65개 스킬, MIT 라이선스 확인 완료
- **Decision to Inform**: 통합 범위, 우선순위, 아키텍처 결정

## 1.2 Brainstormed Ideas (PM × Designer × Engineer)

### Product Manager Perspective (비즈니스 가치)

| # | Idea | Rationale | Impact |
|---|------|-----------|--------|
| PM-1 | **Discovery Chain 내장** — brainstorm→assumptions→prioritize→experiments 5단계 체인을 pm-discovery 에이전트에 통합 | 현재 Discovery가 가장 약한 링크. OST만으로는 "왜 이걸 만드는지" 검증 부족 | Very High |
| PM-2 | **Pre-mortem 기본 탑재** — 모든 PRD에 "12개월 후 실패 시나리오" 자동 생성 | PRD 품질의 가장 큰 갭. 성공만 가정하는 PRD는 위험 | High |
| PM-3 | **User Stories + Test Scenarios 자동 도출** — PRD→스토리→테스트케이스 체인 | Plan→Do 전환 시 가장 많이 누락되는 부분. PDCA Check에 직결 | High |
| PM-4 | **Market Scan 원클릭** — SWOT+PESTLE+Porter's 한번에 실행 | B2B/Enterprise 프로젝트에서 시장 환경 분석 수요 높음 | Medium |
| PM-5 | **Pricing Strategy 모듈** — 수익화 전략 가이드 | SaaS MVP 빌더들의 핵심 고민이지만 bkit에 전혀 없음 | Medium |

### Designer Perspective (사용자 경험)

| # | Idea | Rationale | Impact |
|---|------|-----------|--------|
| DE-1 | **인터랙티브 체크포인트** — pm-skills의 "Pick 3-5 ideas to carry forward" 대화형 패턴 적용 | pm-skills의 핵심 UX 차별점. 분석을 일방적으로 쏟아내지 않고 사용자가 선택 | Very High |
| DE-2 | **Customer Journey Map 시각화** — Emoji 감정선 + 터치포인트 맵 | 사용자가 고객 경험을 "느끼게" 하는 강력한 도구 | Medium |
| DE-3 | **Battlecard 비교표** — "우리 vs 경쟁사" 한눈에 보이는 형식 | 경쟁 분석 결과를 실무에서 즉시 사용 가능한 형태로 | Medium |
| DE-4 | **프레임워크 선택 가이드** — "당신의 상황에 맞는 분석은..." 자동 추천 | 65개 중 뭘 써야 할지 모르는 초보자를 위한 네비게이션 | High |
| DE-5 | **Executive Summary 원페이저** — 전체 PM 분석을 1페이지로 압축 | 의사결정자용 요약. 긴 PRD를 읽을 시간이 없는 사용자 | Medium |

### Engineer Perspective (기술적 가능성)

| # | Idea | Rationale | Impact |
|---|------|-----------|--------|
| EN-1 | **에이전트 프롬프트 직접 확장** — 기존 .md 파일에 프레임워크 지식 추가 | 가장 단순, 배포 즉시 반영, 사이드 이펙트 최소 | Very High |
| EN-2 | **컨텍스트 기반 조건부 로딩** — "When to run" 가이드로 토큰 절약 | 항상 8개 프레임워크 실행하면 토큰 낭비. 조건부 실행이 핵심 | High |
| EN-3 | **pm-skills를 별도 CC 플러그인으로 설치** — bkit과 독립적으로 운영 | 유지보수 분리, 하지만 PDCA 연결이 끊어짐 | Low |
| EN-4 | **Knowledge file 분리** — 프레임워크 상세를 별도 .md로 분리하고 필요 시 Read | 프롬프트 크기 관리에 유리하지만 에이전트 턴 소모 | Medium |
| EN-5 | **Test Scenarios → qa-strategist 자동 연결** — PRD 테스트케이스를 PDCA Check에 주입 | PDCA 사이클 완결성. PRD에서 뽑은 시나리오로 검증 | High |

### Top 5 Ideas (Cross-Perspective)

| Rank | ID | Idea | Why Selected |
|:----:|:--:|------|-------------|
| 1 | PM-1 | **Discovery 5단계 Chain** | 현재 가장 약한 링크, 제품 실패의 근본 원인 해결 |
| 2 | DE-1 | **인터랙티브 체크포인트** | pm-skills의 핵심 UX 차별점, 사용자 참여도 극적 향상 |
| 3 | PM-3 | **Stories + Test Scenarios 자동 도출** | PDCA 사이클 완결, Plan→Do→Check 직결 |
| 4 | EN-2 | **컨텍스트 기반 조건부 로딩** | 토큰 효율성 없이는 전체 통합 불가능 |
| 5 | PM-2 | **Pre-mortem 기본 탑재** | 가장 적은 노력으로 가장 큰 PRD 품질 향상 |

## 1.3 Assumptions Identified (Devil's Advocate)

### Value Assumptions

| # | Assumption | What Could Go Wrong | Confidence | Test Method |
|---|-----------|-------------------|:----------:|------------|
| V-1 | 사용자가 코드 전에 PM 분석을 원한다 | 대부분의 개발자는 바로 코딩하고 싶어한다. PM 분석을 "귀찮은 단계"로 인식할 수 있음 | **Low** | 현재 `/pdca pm` 사용률 측정 |
| V-2 | 더 많은 프레임워크 = 더 나은 의사결정 | 프레임워크 과부하로 오히려 결정이 느려질 수 있음. "Analysis Paralysis" | **Medium** | A/B: 3개 vs 8개 프레임워크 PRD 품질 비교 |
| V-3 | AI가 생성한 PM 분석이 실제로 제품 방향에 영향을 미친다 | 사용자가 PRD를 읽기만 하고 무시할 수 있음. "생성은 했지만 활용은 안 함" | **Low** | PRD→Plan→Do 전환율 추적 |
| V-4 | Discovery Chain이 단일 OST보다 더 나은 통찰을 제공한다 | 5단계 체인이 사용자 인내심을 초과할 수 있음. 긴 프로세스 = 높은 이탈 | **Medium** | 체인 완료율 vs 단일 OST 완료율 |

### Usability Assumptions

| # | Assumption | What Could Go Wrong | Confidence | Test Method |
|---|-----------|-------------------|:----------:|------------|
| U-1 | 조건부 프레임워크 선택이 직관적이다 | 사용자가 "PESTLE을 언제 쓰는지" 모를 수 있음. 자동 선택이 틀릴 수 있음 | **Medium** | 자동 선택 정확도 측정 |
| U-2 | 인터랙티브 체크포인트가 방해가 아닌 도움이 된다 | 중간에 질문받는 것을 싫어하는 사용자도 있음 | **Medium** | 체크포인트 스킵률 측정 |
| U-3 | 확장된 PRD (13개 섹션)가 읽을만하다 | 너무 길어서 아무도 안 읽을 수 있음 | **Low** | PRD 읽기 시간 + 섹션별 참조율 |

### Feasibility Assumptions

| # | Assumption | What Could Go Wrong | Confidence | Test Method |
|---|-----------|-------------------|:----------:|------------|
| F-1 | 에이전트 프롬프트 확장이 토큰 한도 내에서 가능하다 | 각 에이전트 +120줄 추가 시 Sonnet의 출력 품질 저하 가능 | **High** | 확장 전/후 출력 품질 비교 |
| F-2 | maxTurns 25로 5단계 체인이 완료 가능하다 | WebSearch 포함 시 턴 부족할 수 있음 | **Medium** | 실제 체인 실행 시 턴 소모 측정 |
| F-3 | 기존 pm-lead 오케스트레이션이 확장된 출력을 처리할 수 있다 | 3개 에이전트 병렬 결과가 너무 커서 pm-prd 컨텍스트 초과 | **Medium** | 실제 통합 테스트 |

### Viability Assumptions

| # | Assumption | What Could Go Wrong | Confidence | Test Method |
|---|-----------|-------------------|:----------:|------------|
| B-1 | MIT→Apache-2.0 라이선스 통합에 법적 문제가 없다 | MIT는 Apache-2.0에 포함 가능하지만, Attribution 누락 시 문제 | **High** | 법률 검토 (이미 확인됨) |
| B-2 | pm-skills 원본이 업데이트되면 bkit도 따라가야 한다 | 의존성 관리 부담. pm-skills가 Breaking Change를 할 수 있음 | **Medium** | 프레임워크 지식은 스냅샷, 원본 의존 없음 |

## 1.4 Assumption Prioritization (Impact × Risk Matrix)

| # | Assumption | Impact (1-5) | Risk (1-5) | Score | Category | Action |
|---|-----------|:------------:|:----------:|:-----:|----------|--------|
| **V-1** | 사용자가 코드 전에 PM 분석을 원한다 | 5 | 4 | **20** | Test Now | `/pdca pm` 사용률 + 사용자 인터뷰 |
| **V-3** | AI PM 분석이 실제 제품 방향에 영향을 미침 | 5 | 4 | **20** | Test Now | PRD→Plan 전환율 추적 |
| **U-3** | 확장된 PRD가 읽을만하다 | 4 | 4 | **16** | Test Soon | Executive Summary 원페이저 먼저 제공 |
| **V-2** | 더 많은 프레임워크 = 더 나은 의사결정 | 4 | 3 | **12** | Monitor | 3개 vs 8개 A/B 테스트 |
| **V-4** | Discovery Chain > 단일 OST | 4 | 3 | **12** | Monitor | 체인 완료율 비교 |
| **F-3** | pm-lead가 확장된 출력 처리 가능 | 3 | 3 | **9** | Accept | 통합 테스트로 검증 |
| **F-1** | 토큰 한도 내 프롬프트 확장 가능 | 3 | 2 | **6** | Accept | 1M context에서 충분 |
| **B-1** | 라이선스 통합 문제 없음 | 2 | 1 | **2** | Accept | 이미 확인됨 |

### Leap of Faith Assumptions (Score ≥ 20)

1. **V-1**: 사용자가 코드 전에 PM 분석을 원한다 — 이것이 거짓이면 전체 통합이 무의미
2. **V-3**: AI PM 분석이 실제 제품 방향에 영향을 미침 — 생성만 하고 무시하면 가치 없음

## 1.5 Recommended Experiments

| # | Tests | Method | Type | Duration | Success Criteria | Effort |
|---|-------|--------|------|:--------:|-----------------|:------:|
| E-1 | V-1: PM 분석 수요 | 현재 `/pdca pm` 사용률 분석 + 사용자 5명 인터뷰 "코딩 전에 PM 분석 했나?" | Data + Interview | 1주 | 사용률 > 15% 또는 인터뷰 3/5 긍정 | Low |
| E-2 | V-3: PRD 활용도 | PRD→Plan 전환율 추적. PRD가 있는 Plan vs 없는 Plan의 quality score 비교 | Data Analysis | 2주 | 전환율 > 50%, quality +20% | Low |
| E-3 | U-3: PRD 가독성 | Concierge Test — 확장된 PRD를 5명에게 보여주고 "어떤 섹션이 유용했나?" | Hallway Test | 3일 | 신규 섹션 중 3개 이상 "유용" 평가 | Low |
| E-4 | V-2: 프레임워크 수 적정선 | Painted Door — pm-strategy에 "SWOT도 분석할까요?" 버튼 추가, 클릭률 측정 | Fake Door | 1주 | 클릭률 > 30% | Low |

### Experiment Sequence

```
Week 1: E-1 (수요 검증) + E-4 (프레임워크 수요)
Week 2: E-2 (활용도) + E-3 (가독성)
Week 3: 결과 분석 → Go/No-Go 결정
```

### Decision Framework

- E-1 성공 + E-2 성공 → **Full integration proceed** (Phase 1-5 전체)
- E-1 성공 + E-2 실패 → **Lite integration** (Discovery Chain + Pre-mortem만, 나머지 보류)
- E-1 실패 → **Pivot** — PM 분석을 선택적 옵션으로 제공, 기본 워크플로우에서 제외

---

# Part 2: Market Scan (`/market-scan` chain)

## 2.1 SWOT Analysis

### Strengths (Internal, Positive)

| # | Strength | Evidence |
|---|----------|---------|
| S-1 | **이미 작동하는 PM Agent Team** | 5개 에이전트, pm-lead 오케스트레이션, /pdca pm 워크플로우 완성 |
| S-2 | **PDCA 사이클 완전 통합** | PM→Plan→Design→Do→Check→Act 전체 루프, 다른 도구에 없는 고유 가치 |
| S-3 | **pm-skills 이미 부분 적용** | Attribution 포함, OST/VP/Lean Canvas/Persona 등 핵심 뼈대 작동 중 |
| S-4 | **MIT 라이선스 확보** | pm-skills 전체를 자유롭게 통합·수정·배포 가능 |
| S-5 | **1M context window** | Opus 4.6 1M context로 확장된 에이전트 프롬프트 충분히 수용 |
| S-6 | **다국어 지원** | 8개 언어 자동 감지, pm-skills는 영어 전용 → bkit이 글로벌 접근성에서 우위 |

### Weaknesses (Internal, Negative)

| # | Weakness | Impact |
|---|----------|--------|
| W-1 | **Discovery 깊이 부족** | 1단계(OST만)으로 가정 검증 체계 없음 |
| W-2 | **전략 분석 2차원 한정** | JTBD VP + Lean Canvas만. SWOT, 경쟁 구조 분석 부재 |
| W-3 | **PRD→실행 연결 끊김** | User Stories, Test Scenarios 자동 생성 없음 |
| W-4 | **인터랙티브 요소 부재** | 분석을 일방적으로 쏟아내기만 함, 사용자 참여 유도 약함 |
| W-5 | **데이터 분석 완전 부재** | A/B test, cohort, SQL 지원 없음 |
| W-6 | **가격전략 지원 없음** | SaaS 빌더의 핵심 고민에 무응답 |

### Opportunities (External, Positive)

| # | Opportunity | Evidence |
|---|------------|---------|
| O-1 | **AI PM 도구 시장 급성장** | Claude Code 플러그인 생태계 확장, PM 자동화 트렌드 |
| O-2 | **1인 창업자/소규모 팀 폭발적 증가** | No-code, AI 기반 개발로 비개발자의 제품 제작 증가 |
| O-3 | **pm-skills가 검증한 프레임워크** | Pawel Huryn의 Product Compass 커뮤니티 10만+ 구독자가 검증 |
| O-4 | **경쟁 도구의 PM 기능 빈약** | Cursor, Windsurf, Copilot 등 코드 생성에만 집중, PM 분석 없음 |
| O-5 | **PDCA + PM의 유일한 조합** | Plan→Do→Check→Act에 PM Discovery를 연결한 도구는 bkit이 유일 |

### Threats (External, Negative)

| # | Threat | Probability | Impact |
|---|--------|:-----------:|:------:|
| T-1 | **사용자가 PM 분석을 건너뜀** | High | High |
| T-2 | **pm-skills가 독립 CC 플러그인으로 더 인기** | Medium | Medium |
| T-3 | **Claude가 내장 PM 기능 추가** | Low | Very High |
| T-4 | **프레임워크 과부하로 사용자 이탈** | Medium | High |
| T-5 | **토큰 비용 증가로 운영 부담** | Low | Medium |

### SWOT Cross-Reference

| Strategy | Content |
|----------|---------|
| **SO (강점×기회)** | S-2 PDCA 통합 + O-5 유일한 조합 → "코딩 전 생각하게 만드는 유일한 AI 도구"로 포지셔닝 |
| **WO (약점×기회)** | W-1 Discovery 부족 + O-3 pm-skills 검증됨 → Discovery Chain 통합이 최우선 |
| **ST (강점×위협)** | S-6 다국어 + T-2 pm-skills 독립 인기 → 다국어 PM 분석은 bkit만 가능한 차별점 |
| **WT (약점×위협)** | W-4 인터랙티브 부재 + T-1 PM 건너뜀 → **체크포인트 도입이 핵심** — 강제가 아닌 유도 |

## 2.2 Porter's Five Forces

| Force | Intensity | Key Drivers | Implication |
|-------|:---------:|-------------|-------------|
| **Competitive Rivalry** | **Low** | AI PM 전용 도구 거의 없음. Cursor/Copilot은 PM 비대상 | 시장 선점 기회. 빠른 기능 확장이 유리 |
| **Supplier Power** | **High** | Anthropic(Claude API)에 100% 의존 | API 가격/정책 변경 리스크. 멀티모델 지원 필요성 |
| **Buyer Power** | **High** | 무료 대안 풍부 (ChatGPT 직접 사용, pm-skills 독립 설치) | 통합 편의성이 유일한 구매 이유. "한곳에서 PM+코딩" 가치 강조 |
| **Threat of Substitutes** | **Medium** | ChatGPT/Claude 직접 PM 프롬프트, 노션 AI, 수동 PM | 구조화된 프레임워크 + PDCA 연결은 대체 어려움 |
| **Threat of New Entrants** | **High** | CC 플러그인 만들기 쉬움, pm-skills MIT | 실행 속도가 핵심. 프레임워크 깊이 + PDCA 통합이 진입장벽 |

**Industry Attractiveness**: **Medium-High** — 경쟁 낮지만 대체재 존재, 빠른 실행이 핵심

## 2.3 Ansoff Matrix

| Strategy | Opportunity | Risk | Priority |
|----------|-----------|:----:|:--------:|
| **Market Penetration** | 기존 bkit 사용자에게 PM 기능 인지도 향상. `/pdca pm` 사용률 15%→50% | Low | **1순위** |
| **Product Development** | pm-skills 65개 → bkit 43개 프레임워크 확장 | Low-Med | **2순위** |
| **Market Development** | 비개발자(PM, 디자이너)를 bkit 사용자로 확장 | Medium | 3순위 |
| **Diversification** | Standalone PM 분석 도구 (CC 외부) | High | Out of Scope |

## 2.4 Cross-Framework Synthesis

| Signal | Source | Implication |
|--------|--------|-------------|
| **"PM 건너뜀" 리스크가 가장 크다** | SWOT T-1, Assumption V-1, Porter's Buyer Power | 핵심 과제: PM 분석을 "하고 싶게" 만들기 (강제 아닌 유도) |
| **Discovery Chain이 최대 가치** | SWOT WO, Brainstorm PM-1, Porter's low rivalry | Phase 1 집중: Discovery 5단계가 가장 ROI 높음 |
| **인터랙티브가 핵심 차별점** | SWOT WT, Brainstorm DE-1, pm-skills의 Checkpoint 패턴 | pm-skills의 "Pick 3-5 to carry forward" 패턴 반드시 적용 |
| **Market Penetration 최우선** | Ansoff, Porter's Buyer Power | 새 사용자보다 기존 사용자 활성화 먼저 |

---

# Part 3: Value Proposition (`/value-proposition`)

## 3.1 JTBD Value Proposition (6-Part)

### For: 1인 개발자 / 소규모 스타트업 빌더

| Part | Content |
|------|---------|
| **Who** | PM 없이 혼자 또는 2-3명이 제품을 만드는 개발자. Claude Code를 이미 사용 중. 코딩은 잘하지만 "무엇을 왜 만들지"에 대한 체계적 사고 방법을 모름 |
| **Why** | 제품 실패의 42%는 "시장 니즈 없음"이 원인 (CB Insights). 코드를 짜기 전에 가정을 검증하고, 경쟁 환경을 이해하고, 가치 제안을 명확히 하고 싶지만, PM 프레임워크를 배울 시간이 없음 |
| **What Before** | ChatGPT에 "PRD 만들어줘"라고 요청 → 구조 없는 일반적 문서. 또는 PM 분석을 건너뛰고 바로 코딩 → "아무도 안 쓰는 제품" 완성. PM 컨설턴트 고용은 비용적으로 불가 |
| **How** | `/pdca pm {feature}` 한 줄 명령으로 5단계 Discovery Chain(brainstorm→가정→우선순위→실험→OST) + 전략 분석(VP+Lean Canvas+SWOT) + 시장 조사(Persona+경쟁+시장규모) + 실행 계획(PRD+스토리+테스트시나리오)을 자동 생성. 각 단계에서 체크포인트로 사용자가 방향을 선택 |
| **What After** | 코딩 전에 "이게 왜 필요한지, 누구를 위한 것인지, 경쟁자 대비 뭐가 다른지, 어떻게 검증할지"를 알고 시작. PRD→Plan→Design→Do→Check까지 일관된 맥락 유지. 사이드 프로젝트도 "프로의 사고 프로세스"로 진행 |
| **Alternatives** | (1) ChatGPT/Claude 직접 사용 — 구조 없음, PDCA 미연결 (2) pm-skills 독립 설치 — 코딩과 분리됨 (3) Notion AI — PM 프레임워크 깊이 부족 (4) 수동 PM — 시간 부족 |

### Value Proposition Statement

> **For** 1인 개발자와 소규모 팀 **who** 코딩 전에 제품 방향을 검증하고 싶지만 PM 전문성이 없는,
> **bkit PM Agent Team** is a **AI PM 컨설턴트** that **65개 검증된 PM 프레임워크로 5단계 체계적 제품 분석을 자동 실행하고 PDCA 사이클에 직결시킨다**.
> Unlike **ChatGPT나 독립 PM 도구**, we **코드 생성과 PM 분석을 하나의 워크플로우로 연결하여 "생각→만들기→검증" 전체를 지원한다**.

---

# Part 4: Strategy (`/strategy` canvas)

## 4.1 Vision

**"모든 사이드 프로젝트에 프로 PM의 사고 프로세스를"**

코딩 능력의 민주화(AI 코딩 도구)는 이미 일어났다. 다음은 제품 사고의 민주화 — 전문 PM이 없어도 AI가 구조화된 의사결정을 가이드하여, 더 많은 제품이 "만들 가치가 있는 것"을 만들게 한다.

## 4.2 Target Segments

| Segment | Size | Pain Level | Current Alternative | Priority |
|---------|:----:|:----------:|-------------------|:--------:|
| 1인 개발자 (사이드 프로젝트) | Very Large | High | 건너뜀 / ChatGPT | **Primary** |
| 스타트업 PM (시드~시리즈A) | Large | Medium | 수동 PM / Notion | Secondary |
| 부트캠프 졸업생 (포트폴리오) | Medium | Medium | 없음 | Tertiary |

**Explicitly not serving**: 대기업 PM팀 (자체 PM 프로세스 보유), 순수 마케터 (코딩 무관)

## 4.3 Strategic Trade-offs

| We Choose | Over | Because |
|-----------|------|---------|
| **PDCA 통합 깊이** | 독립 PM 도구 범용성 | 코딩과 분리된 PM 분석은 무시됨 |
| **프레임워크 정확성** | 자체 프레임워크 개발 | pm-skills는 10만+ 커뮤니티가 검증함 |
| **인터랙티브 체크포인트** | 완전 자동화 | 사용자가 "선택"해야 주인의식이 생김 |
| **조건부 실행** | 항상 전체 실행 | 토큰 절약 + "필요한 것만" 제공 |
| **기존 에이전트 확장** | 신규 에이전트 추가 | 에이전트 수 증가는 오케스트레이션 복잡도 폭증 |

## 4.4 Key Metrics

| Type | Metric | Target |
|------|--------|--------|
| **North Star** | PM 분석 후 Plan으로 전환된 프로젝트 수 (PRD→Plan 전환율) | > 50% |
| **Input** | `/pdca pm` 실행 횟수 / 월 | +100% (현재 대비) |
| **Input** | Discovery Chain 완료율 (5단계 전부 완주) | > 60% |
| **Input** | 체크포인트에서 사용자 선택 참여율 | > 70% |
| **Health** | 에이전트 평균 실행 시간 | < 5분 |
| **Health** | 토큰 사용량 증가 | < 35% |

## 4.5 Defensibility

| Moat Type | Status | Strength |
|-----------|:------:|:--------:|
| **PDCA 통합** | Active | **Strong** — PM→Plan→Do→Check 연결은 bkit만 가능 |
| **다국어** | Active | **Medium** — 8개 언어 자동 감지, pm-skills는 영어만 |
| **Agent Orchestration** | Active | **Strong** — pm-lead가 4개 에이전트 병렬 조율, 단순 스킬 체인과 다름 |
| **프레임워크 깊이** | Building | **Growing** — 9→43개, 지속 확장 가능 |
| **Network Effects** | None | **Weak** — 개인 도구, 네트워크 효과 없음 |

## 4.6 Strategic Risks

| # | Risk | Impact | Mitigation |
|---|------|:------:|-----------|
| 1 | 사용자가 PM 분석을 건너뜀 (T-1, V-1) | Very High | 인터랙티브 체크포인트 + "건너뛰기 가능하지만 권장" 패턴 |
| 2 | 프레임워크 과부하 (V-2, T-4) | High | 조건부 실행 (기본 3개, 전체 8개는 선택) + Executive Summary |
| 3 | pm-skills 독립 인기에 밀림 (T-2) | Medium | PDCA 통합이라는 bkit만의 가치에 집중 |

---

# Part 5: Revised Integration Strategy

## pm-skills 분석이 바꾼 것

| 이전 Plan의 결정 | pm-skills 분석 후 변경 | 이유 |
|----------------|---------------------|------|
| 34개 프레임워크 전부 Phase 1-5로 구현 | **Phase 1에 Discovery Chain + Pre-mortem만 집중** | V-1 가정 검증 우선. 전체 통합은 E-1/E-2 실험 후 |
| 모든 프레임워크 항상 실행 | **기본 3개(VP + Lean Canvas + SWOT) + 조건부 5개** | V-2 Analysis Paralysis 방지 |
| 일방적 분석 출력 | **인터랙티브 체크포인트 3개 삽입** | DE-1 핵심 UX 인사이트 |
| 13개 섹션 확장 PRD | **Executive Summary 원페이저 최상단 + 상세는 접이식** | U-3 가독성 가정 대응 |

## 수정된 Implementation Priority

| Priority | What | Why | Effort |
|:--------:|------|-----|:------:|
| **P0** | Discovery 5단계 Chain + 체크포인트 | Leap of faith V-1 검증의 핵심 실험 | High |
| **P0** | Pre-mortem 기본 탑재 | 최소 노력, 최대 PRD 품질 향상 | Low |
| **P1** | SWOT Analysis 추가 (항상 실행) | Market Scan 최소 단위, 전략 기본 | Low |
| **P1** | User Stories + Test Scenarios 자동 도출 | PDCA Check 연결점 확보 | Medium |
| **P2** | PESTLE + Porter's 5 (조건부) | B2B/Enterprise 시에만 | Low |
| **P2** | Battlecard + Growth Loops + ICP | GTM 심화 | Medium |
| **P3** | Journey Map + Segmentation + BMC + Pricing + Ansoff | 나머지 전부 | Medium |
| **Defer** | pm-data-analytics, pm-marketing-growth | E-1/E-2 실험 결과 후 결정 | - |

---

## Attribution

This PRD was generated by applying [pm-skills](https://github.com/phuryn/pm-skills) frameworks (MIT License) by Pawel Huryn.

Frameworks used:
- `/discover` chain: brainstorm-ideas-existing, identify-assumptions-existing, prioritize-assumptions, brainstorm-experiments-existing
- `/market-scan` chain: swot-analysis, porters-five-forces, ansoff-matrix
- `/value-proposition`: value-proposition (JTBD 6-Part)
- `/strategy`: product-strategy (9-section canvas)
