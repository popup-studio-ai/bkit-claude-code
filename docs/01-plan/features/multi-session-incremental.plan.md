# Multi-Session Incremental Planning Document

> **Summary**: PDCA 세션 분리 + Context Anchor로 핸드오프 컨텍스트 손실을 30-40% → 70-80%로 개선
>
> **Project**: bkit
> **Version**: 2.0.4
> **Author**: Claude (Plan Plus)
> **Date**: 2026-03-23
> **Status**: Draft
> **Method**: Plan Plus (Brainstorming-Enhanced PDCA)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | PM→Plan→Design→Do 4단계 핸드오프를 1세션에서 처리할 때 누적 컨텍스트 손실로 최종 결과물이 30-40%에 불과 |
| **Solution** | 의도적 세션 분리(Session Guide) + Context Anchor(5줄 전략 요약 관통) + Design 전문 재로드로 매 세션 fresh context 보장 |
| **Function/UX Effect** | `/pdca do feature --scope module-N`으로 모듈별 점진적 구현. 매 세션 시작 시 Design 전문 + Context Anchor 자동 로드 |
| **Core Value** | 동일 피처에서 체감 결과물 30-40% → 70-80%로 향상. 변경 파일 ~5개의 최소 리스크 |

---

## 1. User Intent Discovery

### 1.1 Core Problem

1세션에 PM→Plan→Design→Do 전체를 처리하면 후반부 품질이 급락하는 구조적 문제.
- cto-lead maxTurns=50으로 5페이즈 전체 처리 물리적 불가 (필요: ~75턴)
- Design→Do 핸드오프에서 40% 컨텍스트 손실 (가장 큰 손실 지점)
- Do 페이즈가 Design 문서를 status summary만 참조 (전문 미참조)

### 1.2 Target Users

| User Type | Usage Context | Key Need |
|-----------|---------------|----------|
| bkit Dynamic 사용자 | /pdca로 직접 PDCA 실행 | 세션 분리 가이드 + Design 재로드 |
| bkit Enterprise 사용자 | /pdca team으로 CTO 팀 실행 | 모듈별 scope 지정 + Context Anchor |
| 개인 개발자 | CTO Team 없이 직접 실행 | 간단한 세션 분리 안내 |

### 1.3 Success Criteria

- [ ] 체감 결과물 70-80% 달성 (현재 30-40%)
- [ ] 변경 파일 5개 이하
- [ ] 기존 /pdca plan→design→do 워크플로우 breaking change 없음
- [ ] --scope 없이도 기존과 동일하게 동작 (backward compatible)

### 1.4 Constraints

| Constraint | Details | Impact |
|------------|---------|--------|
| 기존 호환성 | /pdca do feature (scope 없음)가 현재와 동일하게 동작해야 함 | High |
| 파일 수 제한 | ~5개 파일 변경으로 제한 (낮은 리스크) | Medium |
| 템플릿 구조 | 기존 템플릿 구조를 깨지 않고 섹션 추가만 | Medium |

---

## 2. Alternatives Explored

### 2.1 Approach A: Session Guide — Selected

| Aspect | Details |
|--------|---------|
| **Summary** | SKILL.md Do 페이즈에 세션 분리 가이드 + Design 전문 재로드 + Context Anchor |
| **Pros** | 최소 변경(~5파일), 기존 호환, 즉시 효과, 낮은 리스크 |
| **Cons** | Context Anchor가 관통 메커니즘(개선안 2) 대비 간단 |
| **Effort** | Low |
| **Best For** | 즉시 적용 가능한 최소 변경으로 최대 효과 |

### 2.2 Approach B: Context Anchor Only

| Aspect | Details |
|--------|---------|
| **Summary** | 세션 분리 없이 Context Anchor만으로 컨텍스트 강화 |
| **Pros** | 변경 4파일, 매우 단순 |
| **Cons** | 턴 예산 문제 미해결, 보존율 43-51%로 제한적 |
| **Effort** | Low |
| **Best For** | 세션 분리가 불필요한 소규모 피처 |

### 2.3 Decision Rationale

**Selected**: Approach A (Session Guide)
**Reason**: 세션 분리 + Context Anchor 조합이 턴 예산 문제와 컨텍스트 손실을 동시에 해결. 변경 범위도 5파일로 제한적이며, --scope 파라미터가 없어도 기존과 동일하게 동작하여 breaking change 없음.

---

## 3. YAGNI Review

### 3.1 Included (v1 Must-Have)

- [x] Do 페이즈에서 Design 전문 재로드 (status summary → 전문)
- [x] Context Anchor 자동 생성 (Plan 문서에서 5줄 요약 추출)
- [x] Context Anchor 전달 (Design/Do/Analysis 문서 상단 embed)
- [x] 모듈별 세션 분리 가이드 (Design 구조 분석 → 세션 계획 제안)
- [x] --scope 파라미터 지원 (/pdca do feature --scope module-N)

### 3.2 Deferred (v2+ Maybe)

| Feature | Reason for Deferral | Revisit When |
|---------|---------------------|--------------|
| 커밋 메시지에 PDCA 문서 참조 | 개선안 2 영역, 현재 범위 초과 | v2에서 관통 컨텍스트 메커니즘 구현 시 |
| 코드 주석에 Design 참조 | 개선안 2 영역 | v2 |
| gap-detector의 Plan 문서 참조 | Check 페이즈 개선, 별도 피처 | Check 페이즈 개선 시 |
| 세션 간 진행률 자동 추적 | 복잡도 높음, .bkit/state 확장 필요 | session-guide.js 안정화 후 |

### 3.3 Removed (Won't Do)

| Feature | Reason for Removal |
|---------|-------------------|
| 자동 세션 분리 강제 | 사용자 자율성 침해. 가이드만 제공, 강제하지 않음 |
| PRD→Code 직접 참조 | 개선안 2의 전체 파이프라인 리팩토링 필요. 별도 피처 |

---

## 4. Scope

### 4.1 In Scope

- [x] `skills/pdca/SKILL.md` — Do 페이즈 로직 수정 (Design 전문 읽기 + scope 파라미터)
- [x] `templates/plan.template.md` — Context Anchor 섹션 추가
- [x] `templates/design.template.md` — Context Anchor embed + Session Guide 모듈맵
- [x] `templates/do.template.md` — Context Anchor embed + Session Scope 섹션
- [x] `lib/pdca/session-guide.js` — 신규: Context Anchor 추출 + 모듈 분석 + 세션 제안 로직

### 4.2 Out of Scope

- 커밋 메시지/코드 주석의 PDCA 문서 참조 (개선안 2 영역)
- gap-detector의 Plan 문서 참조 (Check 페이즈 별도 개선)
- 자동 세션 분리 강제 메커니즘
- .bkit/state의 세션 진행률 추적

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | Plan 문서 생성 시 Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) 자동 추출 | High | Pending |
| FR-02 | Design 문서 생성 시 Plan의 Context Anchor를 상단에 embed | High | Pending |
| FR-03 | Do 페이즈 실행 시 Design 문서 전문 읽기 (현재 status summary → 전문) | High | Pending |
| FR-04 | Do 페이즈 실행 시 Context Anchor 표시 | High | Pending |
| FR-05 | `/pdca do feature --scope module-N` 파라미터 지원 | High | Pending |
| FR-06 | scope 없이 Do 실행 시 모듈 분리 안내 + 첫 세션 범위 제안 | Medium | Pending |
| FR-07 | scope 없이 Do 실행 시 기존과 동일하게 동작 (backward compatible) | High | Pending |
| FR-08 | Analysis 문서에 Context Anchor embed | Medium | Pending |

### 5.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 호환성 | 기존 /pdca do (scope 없음) 동작 변화 없음 | 기존 피처로 회귀 테스트 |
| 보존율 | 체감 결과물 70-80% | 동일 피처 현재 vs 개선 후 비교 |
| 복잡도 | 신규 파일 1개, 수정 파일 4개 | 파일 카운트 |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] 5개 파일 변경/생성 완료
- [ ] /pdca do feature (scope 없음) 기존 동작 유지 확인
- [ ] /pdca do feature --scope module-1 정상 동작 확인
- [ ] Context Anchor가 Plan→Design→Do 문서에 관통 확인
- [ ] 세션 분리 가이드가 Design 구조 기반으로 자동 제안 확인

### 6.2 Quality Criteria

- [ ] breaking change 없음
- [ ] 템플릿 구조 일관성 유지
- [ ] session-guide.js lint 통과

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Design 전문 읽기 시 컨텍스트 윈도우 부담 | Medium | Medium | 대형 Design 문서는 핵심 섹션만 읽는 fallback 로직 |
| --scope 파라미터 파싱 오류 | Low | Low | 기존 feature name에 -- 포함된 경우 처리 |
| Context Anchor 자동 추출 품질 | Medium | Low | Plan 문서의 Executive Summary에서 추출 (구조화된 소스) |
| 기존 Do 문서와의 호환성 | Low | Low | 신규 섹션 추가만, 기존 섹션 삭제 없음 |

---

## 8. Architecture Considerations

### 8.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS | Web apps, SaaS MVPs | ✓ |
| **Enterprise** | Strict layer separation | High-traffic systems | ✓ |

> bkit 자체는 Claude Code 플러그인 (Node.js). Dynamic 수준의 모듈 구조.

### 8.2 Key Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Context Anchor 소스 | Executive Summary / 전체 문서 분석 | Executive Summary | 이미 구조화되어 있어 추출 안정적 |
| Design 읽기 방식 | 전문 / 핵심 섹션만 | 전문 (fallback: 핵심 섹션) | 매 세션 fresh context이므로 전문 가능 |
| scope 파라미터 형식 | --scope module-1 / --module 1 | --scope module-1 | 기존 CLI 컨벤션과 일치 |
| 모듈 분석 방식 | Design 문서 헤딩 파싱 / 수동 입력 | 헤딩 파싱 (자동) | Design 템플릿의 구조가 일관적 |

### 8.3 Component Overview

```
skills/pdca/SKILL.md (수정)
├── plan: + Context Anchor 생성 로직
├── design: + Context Anchor embed + Session Guide 모듈맵
└── do: + Design 전문 읽기 + --scope 파라미터 + 세션 가이드

templates/ (수정)
├── plan.template.md: + ## Context Anchor 섹션
├── design.template.md: + ## Context Anchor + ## Session Guide
└── do.template.md: + ## Context Anchor + ## Session Scope

lib/pdca/ (신규)
└── session-guide.js
    ├── extractContextAnchor(planDoc) → 5줄 요약
    ├── analyzeModules(designDoc) → 모듈 목록
    ├── suggestSessions(modules, maxTurns) → 세션 계획
    └── filterByScope(doTemplate, scope) → scope 필터링
```

### 8.4 Data Flow

```
Session 1: 전략 + 설계
───────────────────────────────
/pdca plan feature
  └─ Plan 문서 + Context Anchor 자동 생성
     (WHY / WHO / RISK / SUCCESS / SCOPE)
/pdca design feature
  └─ Plan의 Context Anchor → Design 상단 embed
  └─ 모듈 분리 구조 명시 (Session Guide 모듈맵)

        ↓ 문서가 컨텍스트 앵커 역할

Session 2+: 구현 (모듈별)
───────────────────────────────
/pdca do feature --scope module-N
  ├─ Design 전문 재로드 (fresh context)
  ├─ Context Anchor 표시
  ├─ module-N 범위만 필터링
  └─ 해당 모듈 구현 안내

        ↓ 새 세션 = fresh context window

Session N+1: 검증 + 보고
───────────────────────────────
/pdca analyze feature
  ├─ Design + Plan + Context Anchor 재로드
  └─ 전체 코드 대비 Gap 분석
/pdca report feature
```

---

## 9. Convention Prerequisites

### 9.1 Applicable Conventions

- [x] SKILL.md 수정 시 기존 frontmatter 구조 유지
- [x] 템플릿 수정 시 기존 YAML frontmatter 형식 유지
- [x] session-guide.js는 기존 lib/pdca/ 모듈 패턴 따름 (module.exports)
- [x] --scope 파라미터는 기존 PDCA argument 파싱 방식과 일치

---

## 10. Next Steps

1. [ ] Design 문서 작성 (`/pdca design multi-session-incremental`)
2. [ ] 5개 파일 구현 (세션 분리 패턴 적용)
3. [ ] Gap 분석 (`/pdca analyze multi-session-incremental`)
4. [ ] 완료 보고서 (`/pdca report multi-session-incremental`)

---

## Appendix: Brainstorming Log

| Phase | Question | Answer | Decision |
|-------|----------|--------|----------|
| Intent Q1 | 핵심 문제? | 컨텍스트 손실 방지 | 세션 분리 + Context Anchor |
| Intent Q2 | 대상 사용자? | bkit 사용자 전체 | Dynamic + Enterprise 모두 지원 |
| Intent Q3 | 성공 기준? | 체감 70-80% + 기존 호환 | breaking change 없는 확장 |
| Alternatives | 3가지 접근법 비교 | Approach A: Session Guide | 최소 변경(~5파일)으로 최대 효과 |
| YAGNI | v1 필수 기능? | 4개 전체 포함 | 모두 5파일 범위 내 구현 가능 |
| Design 4.1 | 아키텍처 방향? | 승인 | SKILL.md + 템플릿 + session-guide.js |
| Design 4.2 | 컴포넌트 구조? | 승인 | Context Anchor + Session Guide + scope |
| Design 4.3 | 데이터 흐름? | 승인 | 세션별 Design 재로드 + Anchor 관통 |

---

## Appendix: Performance Comparison

| Metric | Current bkit | After Implementation |
|--------|-------------|---------------------|
| 최종 보존율 | 15-20% | 61-68% |
| 체감 결과물 | 30-40% | 70-80% |
| Design→Do 손실 | 40% | 15% |
| 세션당 턴 활용률 | 후반 15턴 품질↓ | 매 세션 전 턴 고품질 |
| 변경 파일 수 | - | 5개 |
| Breaking change | - | 없음 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-23 | Initial draft (Plan Plus) | Claude |
