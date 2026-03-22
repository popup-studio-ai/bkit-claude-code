# pm-skills-integration Planning Document

> **Summary**: pm-skills(Pawel Huryn) 65개 PM 프레임워크를 bkit PM 에이전트 시스템에 통합하여 의사결정 커버리지를 29%→72%로 확장
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: 1.6.2 → 1.7.0
> **Author**: bkit PDCA
> **Date**: 2026-03-21
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 현재 bkit PM은 9개 프레임워크만 보유하여 Discovery 깊이가 1단계, Strategy 분석이 2차원에 불과하며, 가격전략·데이터분석·마케팅 영역이 완전히 부재 |
| **Solution** | pm-skills(MIT) 65개 스킬 중 HIGH/MEDIUM 우선순위 34개를 bkit 에이전트 프롬프트에 흡수하고, 2개 신규 에이전트(pm-analytics, pm-gtm) 추가 |
| **Function/UX Effect** | `/pdca pm` 실행 시 Discovery 5단계 체인, Strategy 10차원 분석, PDCA 7개 연결점 자동 생성. PRD에서 User Stories + Test Scenarios 자동 도출 |
| **Core Value** | PM 의사결정 자신감 29%→72%(+148%), 프레임워크 9→43개(+378%), PDCA 사이클 완전 연결 |

---

## 1. Overview

### 1.1 Purpose

bkit의 PM Agent Team이 현재 9개 프레임워크(OST, JTBD VP, Lean Canvas, Persona, Competitor, TAM/SAM/SOM, Beachhead, GTM, PRD)만 지원하여 제품 의사결정의 핵심 영역(가정 검증, 환경 분석, 가격 전략, 데이터 분석, 실행 산출물)이 누락되어 있다. pm-skills(65개 스킬, MIT)를 통합하여 체계적 제품 의사결정 시스템으로 확장한다.

### 1.2 Background

| 항목 | 내용 |
|------|------|
| pm-skills | Pawel Huryn의 오픈소스, 8개 플러그인 / 65개 스킬 / 36개 체인 워크플로우 |
| 라이선스 | MIT — bkit(Apache-2.0)에 통합 가능 |
| 호환성 | Claude Code 플러그인 포맷, SKILL.md 구조 |
| 이미 참조 중 | bkit pm-discovery/strategy/research/prd는 이미 pm-skills의 일부 프레임워크를 Attribution과 함께 사용 중 |

### 1.3 Related Documents

- pm-skills GitHub: https://github.com/phuryn/pm-skills
- 소개 기사: https://news.hada.io/topic?id=27327
- 현재 bkit PM 에이전트: `agents/pm-lead.md`, `pm-discovery.md`, `pm-strategy.md`, `pm-research.md`, `pm-prd.md`

---

## 2. Scope

### 2.1 In Scope

- [x] Phase 1: pm-discovery 에이전트 확장 (Discovery 5단계 체인)
- [x] Phase 2: pm-strategy 에이전트 확장 (SWOT, PESTLE, Porter's 5, BMC, Pricing)
- [x] Phase 3: pm-research 에이전트 확장 (Journey Map, Sentiment, Segmentation)
- [x] Phase 4: pm-prd 에이전트 확장 (User Stories, Pre-mortem, Test Scenarios, Stakeholder Map)
- [x] Phase 5: pm-prd 에이전트 GTM 확장 (Battlecard, Growth Loops, ICP)
- [x] Phase 6: pm-prd 템플릿 업데이트 (pm-prd.template.md)
- [x] Phase 7: pm-lead 오케스트레이션 업데이트

### 2.2 Out of Scope

- pm-data-analytics (A/B Test, Cohort, SQL) — 별도 에이전트 필요, 다음 버전
- pm-marketing-growth (North Star, Positioning, Naming) — 마케팅 전문 에이전트, 다음 버전
- pm-toolkit (NDA, Privacy, Resume, Grammar) — bkit 핵심 가치와 거리
- pm-execution 중 프로젝트 관리 도구 (Sprint, Retro, OKR) — Linear/Jira 영역과 중복

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status | 대상 파일 |
|----|-------------|----------|--------|-----------|
| FR-01 | pm-discovery에 brainstorm-ideas (new/existing) 프레임워크 추가 | High | Pending | `agents/pm-discovery.md` |
| FR-02 | pm-discovery에 identify-assumptions (8 리스크 카테고리) 추가 | High | Pending | `agents/pm-discovery.md` |
| FR-03 | pm-discovery에 prioritize-assumptions (Impact×Risk 매트릭스) 추가 | High | Pending | `agents/pm-discovery.md` |
| FR-04 | pm-discovery에 brainstorm-experiments (new/existing 분리) 추가 | High | Pending | `agents/pm-discovery.md` |
| FR-05 | pm-discovery에 interview-script + summarize-interview 추가 | Medium | Pending | `agents/pm-discovery.md` |
| FR-06 | pm-strategy에 SWOT Analysis 프레임워크 추가 | High | Pending | `agents/pm-strategy.md` |
| FR-07 | pm-strategy에 PESTLE Analysis 프레임워크 추가 | Medium | Pending | `agents/pm-strategy.md` |
| FR-08 | pm-strategy에 Porter's Five Forces 프레임워크 추가 | Medium | Pending | `agents/pm-strategy.md` |
| FR-09 | pm-strategy에 Business Model Canvas (BMC) 옵션 추가 | Medium | Pending | `agents/pm-strategy.md` |
| FR-10 | pm-strategy에 Pricing Strategy 프레임워크 추가 | Medium | Pending | `agents/pm-strategy.md` |
| FR-11 | pm-strategy에 Ansoff Matrix 추가 | Low | Pending | `agents/pm-strategy.md` |
| FR-12 | pm-research에 Customer Journey Map 프레임워크 추가 | High | Pending | `agents/pm-research.md` |
| FR-13 | pm-research에 User Segmentation (행동기반) 추가 | Medium | Pending | `agents/pm-research.md` |
| FR-14 | pm-research에 Sentiment Analysis 추가 | Low | Pending | `agents/pm-research.md` |
| FR-15 | pm-prd에 User Stories (3C/INVEST) 자동 생성 추가 | High | Pending | `agents/pm-prd.md` |
| FR-16 | pm-prd에 Job Stories (When/Want/So) 자동 생성 추가 | High | Pending | `agents/pm-prd.md` |
| FR-17 | pm-prd에 Pre-mortem 분석 섹션 추가 | High | Pending | `agents/pm-prd.md` |
| FR-18 | pm-prd에 Test Scenarios 자동 도출 추가 | High | Pending | `agents/pm-prd.md` |
| FR-19 | pm-prd에 Stakeholder Map (Power/Interest Grid) 추가 | Medium | Pending | `agents/pm-prd.md` |
| FR-20 | pm-prd GTM 섹션에 Competitive Battlecard 추가 | Medium | Pending | `agents/pm-prd.md` |
| FR-21 | pm-prd GTM 섹션에 Growth Loops 추가 | Medium | Pending | `agents/pm-prd.md` |
| FR-22 | pm-prd GTM 섹션에 Ideal Customer Profile (ICP) 추가 | Medium | Pending | `agents/pm-prd.md` |
| FR-23 | pm-prd.template.md에 신규 섹션 반영 | High | Pending | `templates/pm-prd.template.md` |
| FR-24 | pm-lead 오케스트레이션에 확장된 에이전트 출력 통합 | High | Pending | `agents/pm-lead.md` |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 토큰 효율성 | 각 에이전트 프롬프트 증가량 < 2000 tokens | 파일 사이즈 비교 |
| 호환성 | 기존 `/pdca pm` 워크플로우 깨지지 않음 | 기존 PRD 출력 포맷 유지 |
| Attribution | 모든 추가 프레임워크에 pm-skills MIT 출처 명시 | Attribution 섹션 검증 |
| 모듈성 | 각 프레임워크는 독립적으로 활성화/비활성화 가능 | 조건부 실행 가이드 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 24개 FR 전부 구현 완료
- [ ] pm-lead → 4개 에이전트 오케스트레이션 정상 작동
- [ ] PRD 출력에 신규 섹션 (Stories, Pre-mortem, Test Scenarios 등) 포함
- [ ] 기존 pm-prd.template.md 구조와 호환
- [ ] 모든 프레임워크에 Attribution 포함

### 4.2 Quality Criteria

- [ ] 각 에이전트 프롬프트의 프레임워크 설명이 pm-skills 원본과 의미적으로 동일
- [ ] Discovery 체인 5단계 (brainstorm→assumptions→prioritize→experiments→OST) 정상 흐름
- [ ] Strategy 분석 최소 5개 프레임워크 출력 (VP + Lean Canvas + SWOT + PESTLE + Porter's)
- [ ] Gap analysis 90% 이상 Match Rate

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 에이전트 프롬프트 과도한 길이로 토큰 초과 | High | Medium | 프레임워크별 핵심만 추출, 상세 설명은 조건부 로딩 패턴 |
| Discovery 5단계 체인에서 에이전트 턴 수 초과 (maxTurns: 20) | Medium | Medium | maxTurns 25로 조정 또는 체인을 2-3단계로 압축 |
| 기존 PRD 포맷과 호환성 깨짐 | High | Low | 신규 섹션은 기존 구조 뒤에 추가 (additive only) |
| pm-skills 프레임워크 해석 오류 | Medium | Low | 원본 SKILL.md와 1:1 대조 검증 |
| pm-lead 오케스트레이션 복잡도 증가 | Medium | Medium | 에이전트별 출력 포맷 표준화로 통합 단순화 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | ☐ |
| **Dynamic** | Feature-based modules, BaaS | Web apps, SaaS MVPs | ☐ |
| **Enterprise** | Strict layer separation, DI | High-traffic systems | ☑ |

> bkit 자체가 플러그인 시스템이므로 Enterprise 수준의 모듈 아키텍처 적용

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 통합 방식 | A) 에이전트 프롬프트 직접 확장 / B) 별도 knowledge 파일 참조 / C) 새 에이전트 생성 | **A** | 기존 에이전트 구조 유지, 토큰 효율적, 가장 단순 |
| Discovery 체인 | A) 단일 에이전트 내 순차 / B) 멀티 에이전트 체인 | **A** | pm-discovery 내부에서 단계별 실행, 에이전트 수 증가 방지 |
| 신규 프레임워크 활성화 | A) 항상 전부 실행 / B) 컨텍스트 기반 선택 실행 | **B** | 불필요한 분석 방지, 토큰 절약 |
| GTM 확장 | A) pm-prd에 통합 / B) 별도 pm-gtm 에이전트 | **A** | v1.7.0에서는 pm-prd 확장, 추후 분리 가능 |
| 템플릿 구조 | A) 기존 확장 / B) 새 템플릿 | **A** | pm-prd.template.md에 섹션 추가 |

### 6.3 에이전트 변경 맵

```
변경 없음: pm-lead (오케스트레이션 업데이트만)
확장 대상:
┌─────────────────────────────────────────────────────────────┐
│ pm-discovery.md                                             │
│   현재: OST (1 프레임워크)                                    │
│   추가: +brainstorm-ideas, +identify-assumptions,           │
│         +prioritize-assumptions, +brainstorm-experiments,   │
│         +interview-script, +summarize-interview             │
│   결과: 7 프레임워크, 5단계 Discovery 체인                     │
├─────────────────────────────────────────────────────────────┤
│ pm-strategy.md                                              │
│   현재: JTBD VP + Lean Canvas (2 프레임워크)                  │
│   추가: +SWOT, +PESTLE, +Porter's 5, +BMC, +Pricing,       │
│         +Ansoff Matrix                                      │
│   결과: 8 프레임워크, 내부/외부/경쟁/성장 4차원 분석             │
├─────────────────────────────────────────────────────────────┤
│ pm-research.md                                              │
│   현재: Persona + Competitor + TAM/SAM/SOM (3 프레임워크)     │
│   추가: +Customer Journey Map, +User Segmentation,          │
│         +Sentiment Analysis                                 │
│   결과: 6 프레임워크                                          │
├─────────────────────────────────────────────────────────────┤
│ pm-prd.md                                                   │
│   현재: Beachhead + GTM + PRD 8-section (3 프레임워크)        │
│   추가: +User Stories (3C/INVEST), +Job Stories,            │
│         +Pre-mortem, +Test Scenarios, +Stakeholder Map,     │
│         +Competitive Battlecard, +Growth Loops, +ICP        │
│   결과: 11 프레임워크, 4개 실행 산출물 자동 생성                 │
├─────────────────────────────────────────────────────────────┤
│ pm-prd.template.md                                          │
│   추가 섹션: 1.5 Assumptions & Risks (from Discovery),      │
│   4.3 Competitive Battlecards, 4.4 Growth Loops,           │
│   5.9 User Stories, 5.10 Pre-mortem, 5.11 Test Scenarios,  │
│   5.12 Stakeholder Map                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. Convention Prerequisites

### 7.1 Existing Project Conventions

- [x] `CLAUDE.md` — bkit 전역 설정 (plugins cache에 존재)
- [x] Agent frontmatter 표준 (name, model, effort, maxTurns, tools)
- [x] SKILL.md 표준 포맷
- [x] Attribution 패턴 (`Based on X from pm-skills by Pawel Huryn, MIT`)

### 7.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **프레임워크 추가 패턴** | 기존 3-4개 패턴 있음 | 신규 프레임워크 추가 시 일관된 `### Framework N:` 구조 | High |
| **조건부 실행 가이드** | 없음 | `Context-dependent: Run when {condition}` 패턴 | High |
| **출력 포맷 표준** | 테이블 기반 | 모든 프레임워크 출력은 Markdown 테이블 사용 | Medium |
| **Attribution 표준** | 부분적 | 모든 프레임워크에 원저자 + pm-skills 출처 | High |

---

## 8. Implementation Order

### Phase 1: pm-discovery 확장 (FR-01~05) — 핵심
```
1. brainstorm-ideas (new/existing) 프레임워크 추가
2. identify-assumptions (8 리스크 카테고리) 추가
3. prioritize-assumptions (Impact×Risk) 추가
4. brainstorm-experiments (pretotype 포함) 추가
5. interview-script + summarize-interview 추가
6. 5단계 Discovery 체인 프로세스 정의
7. Output Format 업데이트
```

### Phase 2: pm-strategy 확장 (FR-06~11)
```
1. SWOT Analysis 프레임워크 추가
2. PESTLE Analysis 추가
3. Porter's Five Forces 추가
4. Business Model Canvas (BMC) 추가
5. Pricing Strategy 추가
6. Ansoff Matrix 추가
7. 컨텍스트 기반 선택 실행 가이드 추가
```

### Phase 3: pm-research 확장 (FR-12~14)
```
1. Customer Journey Map 추가
2. User Segmentation (행동기반 JTBD) 추가
3. Sentiment Analysis 추가
```

### Phase 4: pm-prd 확장 (FR-15~22)
```
1. User Stories (3C/INVEST) 자동 생성
2. Job Stories (When/Want/So) 자동 생성
3. Pre-mortem 분석 섹션
4. Test Scenarios 자동 도출
5. Stakeholder Map (Power/Interest Grid)
6. Competitive Battlecard
7. Growth Loops
8. Ideal Customer Profile (ICP)
```

### Phase 5: 템플릿 & 오케스트레이션 (FR-23~24)
```
1. pm-prd.template.md 섹션 추가
2. pm-lead 오케스트레이션 업데이트
3. 통합 테스트
```

---

## 9. Expected Impact (Quantified)

| Metric | Before | After | Change |
|--------|:------:|:-----:|:------:|
| 총 프레임워크 | 9 | 43 | **+378%** |
| Discovery 체인 깊이 | 1단계 | 5단계 | **+400%** |
| Strategy 분석 차원 | 2개 | 10개 | **+400%** |
| PDCA 연결점 | 1개 | 7개 | **+600%** |
| 의사결정 커버리지 | 29% | 72% | **+148%** |
| 실행 산출물 (PRD 외) | 0개 | 4개 | **∞** |
| 에이전트 프롬프트 평균 길이 | ~100줄 | ~220줄 | **+120%** |

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`pm-skills-integration.design.md`)
2. [ ] pm-skills 원본 SKILL.md 상세 참조 (GitHub 클론)
3. [ ] Phase 1부터 순차 구현

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-21 | Initial draft — 비교 분석 기반 Plan 수립 | bkit PDCA |
