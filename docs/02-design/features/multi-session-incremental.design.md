# Multi-Session Incremental Design Document

> **Summary**: PDCA 세션 분리 + Context Anchor로 핸드오프 컨텍스트 손실 30-40% → 70-80% 개선
>
> **Project**: bkit
> **Version**: 2.0.4
> **Author**: Claude
> **Date**: 2026-03-23
> **Status**: Draft
> **Planning Doc**: [multi-session-incremental.plan.md](../01-plan/features/multi-session-incremental.plan.md)

### Pipeline References (if applicable)

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | Schema Definition | N/A |
| Phase 2 | Coding Conventions | N/A |
| Phase 3 | Mockup | N/A |
| Phase 4 | API Spec | N/A |

> bkit 플러그인 내부 개선이므로 Pipeline 해당 없음.

---

## 1. Overview

### 1.1 Design Goals

1. Do 페이즈에서 Design 문서 전문을 재로드하여 컨텍스트 손실 최소화
2. Plan→Design→Do→Analysis 문서에 Context Anchor(5줄 전략 요약)를 관통 embed
3. Design 구조 기반 모듈 자동 분석 + 세션 분리 가이드 제공
4. `--scope module-N` 파라미터로 모듈별 점진적 구현 지원
5. 기존 워크플로우 breaking change 없음

### 1.2 Design Principles

- **Backward Compatible**: --scope 없이 기존과 동일 동작
- **Template Extension Only**: 기존 템플릿 섹션 삭제 없이 추가만
- **Single Module**: session-guide.js 1개에 모든 로직 통합 (over-engineering 방지)

---

## 2. Architecture Options (v1.7.0)

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | SKILL.md만 수정 | 템플릿 4개 + lib 2개 | 템플릿 3개 + lib 1개 |
| **New Files** | 0 | 2 | 1 |
| **Modified Files** | 1 | 5 | 4 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low | Medium (범위 초과) | Low |
| **Recommendation** | 급한 hotfix | 장기 프로젝트 | **Default choice** |

**Selected**: Option C — **Rationale**: Plan의 5파일 제한을 준수하면서 Context Anchor 영구 저장 + 자동 모듈 분석 모두 달성. session-guide.js 1개 모듈로 단순성 유지.

> The detailed design below follows the selected architecture option.

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│  skills/pdca/SKILL.md (수정)                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                   │
│  │  Plan     │→ │  Design  │→ │  Do      │                   │
│  │  +Anchor  │  │  +Anchor │  │  +Scope  │                   │
│  │  생성     │  │  +Module │  │  +Reload │                   │
│  └──────────┘  └──────────┘  └──────────┘                   │
└─────────────────────┬───────────────────────────────────────┘
                      │ calls
┌─────────────────────▼───────────────────────────────────────┐
│  lib/pdca/session-guide.js (신규)                             │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │ extractContext     │  │ analyzeModules    │               │
│  │ Anchor(planDoc)    │  │ (designDoc)       │               │
│  └───────────────────┘  └───────────────────┘               │
│  ┌───────────────────┐  ┌───────────────────┐               │
│  │ suggestSessions   │  │ filterByScope     │               │
│  │ (modules)         │  │ (doTemplate,scope)│               │
│  └───────────────────┘  └───────────────────┘               │
└─────────────────────────────────────────────────────────────┘
                      │ uses
┌─────────────────────▼───────────────────────────────────────┐
│  templates/ (수정)                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│  │ plan.template│ │design.template│ │ do.template  │        │
│  │ +Anchor 섹션  │ │+Anchor embed │ │+Anchor embed │        │
│  │              │ │+Session Guide│ │+Session Scope│        │
│  └──────────────┘ └──────────────┘ └──────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

```
/pdca plan feature
  │
  ├─ Plan 문서 생성
  ├─ extractContextAnchor() → Context Anchor 5줄 테이블 생성
  └─ Plan 문서 상단에 Context Anchor 섹션 작성
       │
       ▼
/pdca design feature
  │
  ├─ Plan 문서 읽기 → Context Anchor 추출
  ├─ Design 문서 상단에 Context Anchor embed (복사)
  ├─ Design 구조 설계
  └─ ## Session Guide: 모듈별 세션 분리 맵 작성
       │
       ▼
/pdca do feature [--scope module-N]
  │
  ├─ Design 문서 전문 읽기 (현재: status summary → 변경: 전문)
  ├─ Context Anchor 표시 (WHY 확인)
  ├─ scope 없음: analyzeModules() → suggestSessions() → 모듈 분리 안내
  ├─ scope 있음: filterByScope() → 해당 모듈만 구현 안내
  └─ Do 문서에 Context Anchor + Session Scope 작성
       │
       ▼
/pdca analyze feature
  │
  ├─ gap-detector가 Design 문서 읽기 (기존 동작)
  └─ Context Anchor는 Design 문서에 이미 embed되어 있으므로 자동 참조
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| session-guide.js | lib/pdca/phase.js | 페이즈 정보 참조 |
| session-guide.js | lib/core (paths) | 문서 경로 resolve |
| SKILL.md (Do) | session-guide.js | 모듈 분석 + 세션 제안 |
| SKILL.md (Plan) | session-guide.js | Context Anchor 추출 |

---

## 3. Detailed Design

### 3.1 Context Anchor 구조

Plan 문서에서 자동 생성되어 모든 downstream 문서에 embed되는 5줄 전략 요약.

```markdown
## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | {이 피처가 해결하는 핵심 문제 — 1줄} |
| **WHO** | {주요 대상 사용자 — 1줄} |
| **RISK** | {가장 큰 리스크 — 1줄} |
| **SUCCESS** | {측정 가능한 성공 기준 — 1줄} |
| **SCOPE** | {단계별 범위 요약 — 1줄} |
```

**생성 시점**: `/pdca plan` 또는 `/plan-plus` 실행 시
**추출 소스**: Executive Summary + Requirements 섹션
**embed 위치**: Design 문서 상단 (## 1. Overview 전), Do 문서 상단

### 3.2 Session Guide 모듈맵 구조

Design 문서의 `## 11. Implementation Guide` 내에 추가되는 세션 분리 가이드.

```markdown
## Session Guide

> Design 구조 기반 자동 생성. 세션 분리는 권장사항이며 강제가 아닙니다.

### Module Map

| Module | Scope Key | Description | Estimated Turns | Session |
|--------|-----------|-------------|:---------------:|:-------:|
| Data Layer | `module-1` | 타입 정의 + 데이터 모델 | 15-20 | Session 2 |
| Business Logic | `module-2` | 서비스 + 훅 + 상태관리 | 20-25 | Session 2-3 |
| UI Components | `module-3` | 컴포넌트 + 페이지 | 20-30 | Session 3 |
| Integration | `module-4` | API 연결 + 에러처리 | 10-15 | Session 3-4 |

### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 30-35 |
| Session 2 | Do | `--scope module-1,module-2` | 40-50 |
| Session 3 | Do | `--scope module-3,module-4` | 40-50 |
| Session 4 | Check + Report | 전체 | 30-40 |
```

### 3.3 --scope 파라미터 설계

```
/pdca do feature --scope module-1
/pdca do feature --scope module-1,module-2
/pdca do feature              (scope 없음 = 전체, 세션 분리 가이드 표시)
```

**파싱 로직** (SKILL.md에서 처리):
1. arguments에서 `--scope` 뒤의 값 추출
2. 쉼표로 분리하여 배열 생성
3. Design 문서의 Session Guide Module Map과 매칭
4. 매칭된 모듈의 구현 항목만 Do 가이드에 포함

**Backward Compatibility**:
- `--scope` 없으면 기존 Do 페이즈와 동일하게 전체 구현 안내
- 추가로 "세션 분리를 권장합니다" 가이드 표시 (강제 아님)

---

## 4. File-Level Changes

### 4.1 `skills/pdca/SKILL.md` (수정)

#### Plan 페이즈 변경

```diff
### plan (Plan Phase)

 0. **PRD Auto-Reference**: Check if `docs/00-pm/{feature}.prd.md` exists
+0.5. **Context Anchor Generation**: After generating Plan document,
+     extract Context Anchor (WHY/WHO/RISK/SUCCESS/SCOPE) from
+     Executive Summary and Requirements sections.
+     Write as `## Context Anchor` table in Plan document
+     (between Executive Summary and Section 1).
 1. Check if `docs/01-plan/features/{feature}.plan.md` exists
```

#### Design 페이즈 변경

```diff
### design (Design Phase)

 1. Verify Plan document exists
 2. Read Plan document to understand requirements and scope
+2.5. **Context Anchor Embed**: Copy Plan's Context Anchor table
+     to Design document top (between header and ## 1. Overview).
 3. Generate 3 Architecture Options
...
 6. Create design document
+6.5. **Session Guide Generation**: Analyze Design's implementation
+     structure (## 11. Implementation Guide) to generate Module Map
+     and Recommended Session Plan. Add as ## Session Guide section.
```

#### Do 페이즈 변경

```diff
### do (Do Phase)

 1. Verify Design document exists
-2. Read Design document and summarize implementation scope
+2. **Read Design document FULLY** (not summary — read entire document)
+2.5. **Parse --scope parameter**: If arguments contain --scope,
+     extract module list. Filter implementation guide to show
+     only matching modules from Session Guide Module Map.
+2.6. **Display Context Anchor**: Show the Context Anchor table from
+     Design document so the user sees WHY/WHO/RISK/SUCCESS/SCOPE.
+2.7. **Session Guide**: If no --scope provided, show Module Map
+     and suggest session split. If --scope provided, show only
+     the selected modules' implementation items.
 3. Checkpoint 4 — Implementation Approval
```

### 4.2 `templates/plan.template.md` (수정)

Executive Summary 바로 아래에 Context Anchor 섹션 추가.

```markdown
## Context Anchor

> Auto-generated from Executive Summary. Propagated to Design/Do documents.

| Key | Value |
|-----|-------|
| **WHY** | {Core problem — extracted from Executive Summary Problem} |
| **WHO** | {Target users — extracted from Requirements or Scope} |
| **RISK** | {Top risk — extracted from Risks section} |
| **SUCCESS** | {Measurable criteria — extracted from Success Criteria} |
| **SCOPE** | {Phase breakdown — extracted from Scope section} |
```

### 4.3 `templates/design.template.md` (수정)

#### Context Anchor embed (헤더 아래, Overview 전)

```markdown
## Context Anchor

> Copied from Plan document. Ensures strategic context survives handoff.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Plan} |
| **WHO** | {copied from Plan} |
| **RISK** | {copied from Plan} |
| **SUCCESS** | {copied from Plan} |
| **SCOPE** | {copied from Plan} |
```

#### Session Guide (## 11. Implementation Guide 내 추가)

```markdown
### 11.3 Session Guide

> Auto-generated from Design structure. Session split is recommended, not required.

#### Module Map

| Module | Scope Key | Description | Estimated Turns | Session |
|--------|-----------|-------------|:---------------:|:-------:|
| {module} | `module-N` | {description} | {turns} | Session {N} |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 30-35 |
| Session N | Do | `--scope module-N` | 40-50 |
| Session N+1 | Check + Report | 전체 | 30-40 |
```

### 4.4 `templates/do.template.md` (수정)

#### Context Anchor embed (Pre-Implementation Checklist 전)

```markdown
## Context Anchor

> Carried from Plan → Design → Do. Review before implementation.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Design} |
| **WHO** | {copied from Design} |
| **RISK** | {copied from Design} |
| **SUCCESS** | {copied from Design} |
| **SCOPE** | {copied from Design} |
```

#### Session Scope 섹션 (## 2. Implementation Order 전)

```markdown
## Session Scope

> Scope: {--scope value or "전체 (all modules)"}

### Current Session Modules

| Module | Scope Key | Status |
|--------|-----------|:------:|
| {module} | `module-N` | ☐ In this session / ☐ Other session |

> Tip: 다른 세션에서 구현할 모듈은 건너뛰세요.
> 다음 세션: `/pdca do {feature} --scope module-N`
```

### 4.5 `templates/analysis.template.md` (수정)

#### Context Anchor embed (Analysis Overview 전)

```markdown
## Context Anchor

> Carried from Plan → Design → Analysis. Verify implementation against strategic intent.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Design Context Anchor} |
| **WHO** | {copied from Design Context Anchor} |
| **RISK** | {copied from Design Context Anchor} |
| **SUCCESS** | {copied from Design Context Anchor} |
| **SCOPE** | {copied from Design Context Anchor} |
```

### 4.6 `lib/pdca/session-guide.js` (신규 ~200줄)

**Exported Functions (8)**:

| Function | Signature | Purpose |
|----------|-----------|---------|
| `extractContextAnchor` | `(planContent: string) → { why, who, risk, success, scope }` | Plan 문서에서 Context Anchor 5줄 추출 |
| `formatContextAnchor` | `(anchor: object) → string` | Anchor를 markdown 테이블로 포맷 |
| `analyzeModules` | `(designContent: string) → Array<Module>` | Design 문서에서 모듈 분석 (3단계 fallback) |
| `suggestSessions` | `(modules: Array, maxTurns?: number) → Array<Session>` | 모듈 목록으로 세션 계획 생성 |
| `formatSessionPlan` | `(sessions: Array) → string` | 세션 계획을 markdown 테이블로 포맷 |
| `formatModuleMap` | `(modules: Array) → string` | 모듈 맵을 markdown 테이블로 포맷 |
| `filterByScope` | `(modules: Array, scopeParam: string) → { filtered: Array, notFound: string[] }` | scope key로 필터링 + 잘못된 키 감지 |
| `parseDoArgs` | `(args: string) → { feature: string, scope: string\|null }` | --scope 파라미터 파싱 |

```javascript
/**
 * Session Guide Module
 * @module lib/pdca/session-guide
 * @version 1.0.0
 *
 * Context Anchor 추출 + 모듈 분석 + 세션 분리 가이드
 */

// ... (see implementation in lib/pdca/session-guide.js for full code)

/**
 * Plan 문서에서 Context Anchor 5줄 테이블을 추출
 * @param {string} planContent - Plan 문서 전문
 * @returns {{ why: string, who: string, risk: string, success: string, scope: string }}
 */
function extractContextAnchor(planContent) {
    /Target Users[\s\S]*?\|\s*(\S[^|]+?)\s*\|/
  );
  if (userMatch) anchor.who = userMatch[1].trim();

  // Scope - In Scope에서 요약
  const scopeMatch = planContent.match(
    /In Scope[\s\S]*?- \[.\]\s*(.+?)(?:\n|$)/
  );
  if (scopeMatch) anchor.scope = scopeMatch[1].trim();

  return anchor;
}

  // ... (see lib/pdca/session-guide.js for full implementation)
}

module.exports = {
  extractContextAnchor, formatContextAnchor,
  analyzeModules, suggestSessions, formatSessionPlan, formatModuleMap,
  filterByScope, parseDoArgs
};
```

---

## 5. SKILL.md Detailed Changes

### 5.1 Plan Phase (Step 0.5 추가)

```
0.5. **Context Anchor Generation**:
     After generating Plan document content, extract Context Anchor:
     - WHY: from Executive Summary → Problem
     - WHO: from Target Users table (first row)
     - RISK: from Risks table (first row, mitigation column)
     - SUCCESS: from Success Criteria (first checkbox item)
     - SCOPE: from In Scope (first checkbox item)
     Write as `## Context Anchor` table between Executive Summary and Section 1.
```

### 5.2 Design Phase (Steps 2.5, 6.5 추가)

```
2.5. **Context Anchor Embed**:
     Read Plan document's ## Context Anchor section.
     Copy the entire table to Design document between header metadata
     and ## 1. Overview.

6.5. **Session Guide Generation**:
     Analyze Design's ## 11. Implementation Guide structure.
     For each ### Phase subsection, create a module entry.
     Generate Module Map table + Recommended Session Plan.
     Add as ### 11.3 Session Guide within Implementation Guide.
```

### 5.3 Do Phase (Steps 2, 2.5-2.7 변경)

```
2. **Read Design document FULLY**:
   Read the entire Design document (not just summary).
   This is the critical change — full context reload per session.

2.5. **Parse --scope parameter**:
     If arguments contain `--scope <value>`:
     - Extract scope value (comma-separated module keys)
     - Match against Design's Session Guide Module Map
     - Filter Implementation Order to show only matching modules
     If no --scope:
     - Show all modules (backward compatible)
     - Display Session Guide recommendation

2.6. **Display Context Anchor**:
     Show the Context Anchor table from Design document.
     Format: "📌 Context Anchor" + 5-row table.
     Purpose: Remind user WHY we're building this.

2.7. **Session Guide Display**:
     If no --scope: Show full Module Map + "세션 분리를 권장합니다" message
     If --scope: Show filtered modules + "이 세션 범위" summary
```

---

## 6. Error Handling

### 6.1 Edge Cases

| Scenario | Handling |
|----------|----------|
| Plan 문서에 Context Anchor 없음 (레거시 문서) | Context Anchor 섹션 생략, 경고 없음 |
| Design 문서에 Session Guide 없음 | 모든 모듈을 단일 세션으로 안내 |
| --scope에 존재하지 않는 module key | 경고 메시지 + 사용 가능한 scope key 목록 표시 |
| Design 문서가 너무 클 때 (>500줄) | 전문 읽기 유지 (세션 시작이므로 context 여유) |
| 기존 /pdca do (scope 없음) | 기존과 동일 동작 + 세션 가이드 추가 표시 |

---

## 7. Security Considerations

- [x] 파일 경로 처리 시 path.join 사용 (path traversal 방지)
- [x] --scope 파라미터 값 검증 (허용된 module key만)
- [x] 문서 읽기만 수행, 외부 네트워크 접근 없음

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| 수동 검증 | Context Anchor 생성/전달 | Plan→Design→Do 실행 후 확인 |
| 수동 검증 | --scope 파라미터 | `/pdca do feature --scope module-1` 실행 |
| 수동 검증 | Backward compatibility | `/pdca do feature` (scope 없음) 기존 동작 확인 |
| Gap Analysis | 설계-구현 일치 | `/pdca analyze multi-session-incremental` |

### 8.2 Test Cases (Key)

- [ ] Happy path: `/pdca plan` → Context Anchor 생성됨
- [ ] Happy path: `/pdca design` → Context Anchor embed + Session Guide 생성됨
- [ ] Happy path: `/pdca do feature` → Design 전문 읽기 + 세션 가이드 표시
- [ ] Happy path: `/pdca do feature --scope module-1` → module-1만 필터링
- [ ] Backward: `/pdca do feature` (scope 없음) → 기존과 동일 + 가이드 추가
- [ ] Edge: 레거시 Plan (Context Anchor 없음) → 정상 동작, Anchor 생략
- [ ] Edge: 잘못된 scope key → 경고 + 사용 가능한 키 목록

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Skill** (Presentation) | 사용자 인터페이스, 프롬프트 로직 | `skills/pdca/SKILL.md` |
| **Template** (Presentation) | 문서 구조 정의 | `templates/*.template.md` |
| **Library** (Application) | Context Anchor 추출, 모듈 분석, 세션 제안 | `lib/pdca/session-guide.js` |

### 9.2 Dependency Rules

```
SKILL.md → session-guide.js → lib/core (paths)
                             → lib/pdca/phase.js
Templates ← SKILL.md fills them
```

---

## 10. Coding Convention Reference

### 10.1 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| 모듈 패턴 | `module.exports = { fn1, fn2 }` (기존 lib/pdca 패턴) |
| Lazy require | `let _core = null; function getCore() { ... }` 패턴 |
| JSDoc | 모든 exported 함수에 JSDoc 작성 |
| 네이밍 | camelCase 함수명 (extractContextAnchor, analyzeModules) |
| 경로 처리 | path.join() 사용 |

---

## 11. Implementation Guide

### 11.1 File Structure

```
skills/pdca/SKILL.md              (수정: Plan/Design/Do/Analyze 페이즈 로직)
templates/plan.template.md        (수정: +Context Anchor 섹션)
templates/design.template.md      (수정: +Context Anchor, +Session Guide)
templates/do.template.md          (수정: +Context Anchor, +Session Scope)
templates/analysis.template.md    (수정: +Context Anchor embed)
lib/pdca/session-guide.js         (신규: 8개 함수)
```

### 11.2 Implementation Order

1. [x] `lib/pdca/session-guide.js` 생성 — 핵심 로직 (8개 함수)
2. [x] `templates/plan.template.md` 수정 — Context Anchor 섹션 추가
3. [x] `templates/design.template.md` 수정 — Context Anchor embed + Session Guide
4. [x] `templates/do.template.md` 수정 — Context Anchor embed + Session Scope
5. [x] `templates/analysis.template.md` 수정 — Context Anchor embed
6. [x] `skills/pdca/SKILL.md` 수정 — Plan/Design/Do/Analyze 페이즈 로직 변경

### 11.3 Session Guide

> 이 피처 자체의 세션 분리 가이드

#### Module Map

| Module | Scope Key | Description | Estimated Turns | Session |
|--------|-----------|-------------|:---------------:|:-------:|
| Core Logic | `module-1` | session-guide.js 4개 함수 | 15 | Session 2 |
| Templates | `module-2` | plan/design/do 템플릿 수정 | 15 | Session 2 |
| SKILL.md | `module-3` | Plan/Design/Do 페이즈 로직 변경 | 20 | Session 2-3 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 (현재 세션) | 35 |
| Session 2 | Do | `--scope module-1,module-2,module-3` | 50 |
| Session 3 | Check + Report | 전체 | 35 |

> 이 피처는 5파일/~200줄 변경으로 소규모이므로 Do를 1세션에 완료 가능.

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-23 | Initial draft (Option C: Pragmatic Balance) | Claude |
