---
template: analysis
version: 1.3
description: PDCA Check phase document template with Context Anchor, Clean Architecture and Convention compliance checks
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - project: Project name (from package.json or CLAUDE.md)
  - version: Project version (from package.json)
---

# {feature} Analysis Report

> **Analysis Type**: Gap Analysis / Code Quality / Performance Analysis
>
> **Project**: {project}
> **Version**: {version}
> **Analyst**: {author}
> **Date**: {date}
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

### Pipeline References (for verification)

| Phase | Document | Verification Target |
|-------|----------|---------------------|
| Phase 1 | [Schema](../01-plan/schema.md) | Terminology consistency |
| Phase 2 | [Conventions](../01-plan/conventions.md) | Convention compliance |
| Phase 4 | [API Spec](../02-design/api/{feature}.md) | API implementation match |
| Phase 8 | [Review Checklist](./phase-8-review.md) | Architecture/Convention review |

---

## Context Anchor

> Carried from Plan → Design → Analysis. Verify implementation against strategic intent.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Design Context Anchor} |
| **WHO** | {copied from Design Context Anchor} |
| **RISK** | {copied from Design Context Anchor} |
| **SUCCESS** | {copied from Design Context Anchor} |
| **SCOPE** | {copied from Design Context Anchor} |

---

## Strategic Alignment Check

> Verifies implementation against the full upstream chain: PRD → Plan → Design.

### PRD Alignment

| PRD Element | Expected | Implementation Status |
|-------------|----------|:---------------------:|
| Core Problem (WHY) | {from PRD} | ✅ Addressed / ❌ Missed |
| Target User (WHO) | {from PRD} | ✅ Addressed / ❌ Missed |
| Value Proposition | {from PRD} | ✅ Delivered / ⚠️ Partial |

### Success Criteria Status

| # | Criteria (from Plan) | Status | Evidence |
|---|---------------------|:------:|----------|
| SC-1 | {criteria text} | ✅/⚠️/❌ | {file:line or test result} |
| SC-2 | {criteria text} | ✅/⚠️/❌ | {file:line or test result} |

**Success Rate**: {X}/{Y} criteria met

### Decision Record Verification

| Source | Decision | Followed? | Deviation |
|--------|----------|:---------:|-----------|
| [PRD] | {decision} | ✅/❌ | {deviation if any} |
| [Plan] | {decision} | ✅/❌ | {deviation if any} |
| [Design] | {decision} | ✅/❌ | {deviation if any} |

---

## 1. Analysis Overview

### 1.1 Analysis Purpose

{Purpose of conducting this analysis}

### 1.2 Analysis Scope

- **Design Document**: `docs/02-design/features/{feature}.design.md`
- **Implementation Path**: `src/features/{feature}/`
- **Analysis Date**: {date}

---

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API Endpoints

| Design | Implementation | Status | Notes |
|--------|---------------|--------|-------|
| POST /api/{resource} | POST /api/{resource} | ✅ Match | |
| GET /api/{resource}/:id | GET /api/{resource}/:id | ✅ Match | |
| - | POST /api/{resource}/bulk | ⚠️ Missing in design | Added in impl |
| DELETE /api/{resource}/:id | - | ❌ Not implemented | Needs impl |

### 2.2 Data Model

| Field | Design Type | Impl Type | Status |
|-------|-------------|-----------|--------|
| id | string | string | ✅ |
| email | string | string | ✅ |
| createdAt | Date | Date | ✅ |
| metadata | - | object | ⚠️ Missing in design |

### 2.3 Component Structure

| Design Component | Implementation File | Status |
|------------------|---------------------|--------|
| {ComponentA} | src/components/{ComponentA}.tsx | ✅ Match |
| {ComponentB} | - | ❌ Not implemented |

### 2.4 Functional Depth Analysis (v2.1.0)

> Measures actual implementation completeness, not just file existence.

| File | Depth Score | Placeholder Indicators | Missing Design Elements |
|------|:----------:|----------------------|------------------------|
| {file} | {0-100} | {indicators found} | {missing elements from Page UI Checklist} |

```
Scoring: 0=empty, 20=skeleton, 40=mock data, 60=partial logic, 80=mostly complete, 100=fully implemented
Threshold: Files scoring <60 are flagged as "SHALLOW"
```

**Shallow File Count**: {N} / {total} files ({percent}%)

### 2.5 Page UI Checklist Verification (v2.1.0)

> Cross-references Design document §5.4 Page UI Checklist against implementation.

| Page | Design Elements | Implemented | Missing | Rate |
|------|:--------------:|:-----------:|:-------:|:----:|
| {page} | {N} | {N} | {N} | {percent}% |

**Functional Match Rate**: {percent}%

### 2.6 API Contract Verification (v2.2.0)

> 3-way cross-reference: Design §4 ↔ Server (route.ts) ↔ Client (fetch calls)
> Detects runtime failures that structural/functional checks miss.

| # | Endpoint | Design | Server | Client | Contract |
|---|----------|:------:|:------:|:------:|:--------:|
| {N} | {endpoint} | ✅/❌ | ✅/❌ | ✅/❌ | PASS/FAIL |

**Contract Failures:**

| Endpoint | Layer | Issue | Fix Required |
|----------|-------|-------|-------------|
| {endpoint} | {Server/Client} | {mismatch description} | {fix} |

**Contract Match Rate**: {M}/{N} endpoints = {percent}%

### 2.7 Runtime Verification Results (v2.3.0)

> Actual execution results — not code reading, real HTTP calls and browser tests.

#### L1: API Endpoint Tests (curl)

| # | Test | Status | Expected | Actual | Pass |
|---|------|:------:|----------|--------|:----:|
| {N} | {description} | {status code} | {expected} | {actual response} | ✅/❌ |

**L1 Score**: {pass}/{total} = {percent}%

#### L2: UI Action Tests (Playwright)

| # | Page | Action | Expected Result | Pass |
|---|------|--------|----------------|:----:|
| {N} | {page} | {action} | {result} | ✅/❌ |

**L2 Score**: {pass}/{total} = {percent}%

#### L3: E2E Scenario Tests (Playwright)

| # | Scenario | Steps | Result | Pass |
|---|----------|:-----:|--------|:----:|
| {N} | {scenario name} | {step count} | {pass/fail + details} | ✅/❌ |

**L3 Score**: {pass}/{total} = {percent}%

**Runtime Match Rate**: (L1 × 0.4 + L2 × 0.3 + L3 × 0.3) = {percent}%

### 2.8 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Structural Match Rate:  {percent}%          │
│  Functional Match Rate:  {percent}%          │
│  Contract Match Rate:    {percent}%          │
│  Runtime Match Rate:     {percent}%   (NEW)  │
│  ─────────────────────────────────────────── │
│  Overall Match Rate:     {percent}%          │
│  = (Structural × 0.15) + (Functional × 0.25)│
│    + (Contract × 0.25) + (Runtime × 0.35)   │
├─────────────────────────────────────────────┤
│  ✅ Match:          {N} items ({percent}%)   │
│  ⚠️ Shallow:        {N} items ({percent}%)   │
│  ❌ Not implemented: {N} items ({percent}%)   │
└─────────────────────────────────────────────┘
```

---

## 3. Code Quality Analysis

### 3.1 Complexity Analysis

| File | Function | Complexity | Status | Recommendation |
|------|----------|------------|--------|----------------|
| {service}.ts | processData | 15 | ⚠️ High | Split function |
| utils.ts | formatDate | 3 | ✅ Good | - |

### 3.2 Code Smells

| Type | File | Location | Description | Severity |
|------|------|----------|-------------|----------|
| Long function | api.ts | L45-120 | 75 lines (recommended: <50) | 🟡 |
| Duplicate code | helpers.ts | L10, L45 | Same logic repeated | 🟡 |
| Magic number | config.ts | L23 | Hardcoded number | 🟢 |

### 3.3 Security Issues

| Severity | File | Location | Issue | Recommendation |
|----------|------|----------|-------|----------------|
| 🔴 Critical | auth.ts | L42 | Hardcoded secret | Move to env var |
| 🟡 Warning | api.ts | L15 | Missing input validation | Add validation |
| 🟢 Info | - | - | - | - |

---

## 4. Performance Analysis (if applicable)

### 4.1 Response Time

| Endpoint | Measured | Target | Status |
|----------|----------|--------|--------|
| GET /api/{resource} | 150ms | 200ms | ✅ |
| POST /api/{resource} | 350ms | 200ms | ❌ |

### 4.2 Bottlenecks

| Location | Problem | Impact | Recommendation |
|----------|---------|--------|----------------|
| Repository.findAll() | N+1 query | Increased response time | Eager Loading |
| ImageProcessor | Sync processing | Blocking | Async processing |

---

## 5. Test Coverage

### 5.1 Coverage Status

| Area | Current | Target | Status |
|------|---------|--------|--------|
| Statements | 72% | 80% | ❌ |
| Branches | 65% | 75% | ❌ |
| Functions | 80% | 80% | ✅ |
| Lines | 73% | 80% | ❌ |

### 5.2 Uncovered Areas

- `src/features/{feature}/handlers/errorHandler.ts`
- `src/features/{feature}/utils/parser.ts`

---

## 6. Clean Architecture Compliance

> Reference: `docs/02-design/{feature}.design.md` Section 9 (Clean Architecture)

### 6.1 Layer Dependency Verification

| Layer | Expected Dependencies | Actual Dependencies | Status |
|-------|----------------------|---------------------|--------|
| Presentation | Application, Domain | {actual imports} | ✅/❌ |
| Application | Domain, Infrastructure | {actual imports} | ✅/❌ |
| Domain | None (independent) | {actual imports} | ✅/❌ |
| Infrastructure | Domain only | {actual imports} | ✅/❌ |

### 6.2 Dependency Violations

| File | Layer | Violation | Recommendation |
|------|-------|-----------|----------------|
| `components/UserList.tsx` | Presentation | Imports `@/lib/api` directly | Use service hook instead |
| `services/user.ts` | Application | Imports `@/components/Button` | Remove UI dependency |
| - | - | - | - |

### 6.3 Layer Assignment Verification

| Component | Designed Layer | Actual Location | Status |
|-----------|---------------|-----------------|--------|
| {ComponentA} | Presentation | `src/components/{feature}/` | ✅ |
| {ServiceA} | Application | `src/services/{feature}.ts` | ✅ |
| {TypeA} | Domain | `src/types/{feature}.ts` | ✅ |
| {ApiClient} | Infrastructure | `src/lib/api/{feature}.ts` | ✅ |

### 6.4 Architecture Score

```
┌─────────────────────────────────────────────┐
│  Architecture Compliance: 85%                │
├─────────────────────────────────────────────┤
│  ✅ Correct layer placement: 17/20 files     │
│  ⚠️ Dependency violations:   2 files         │
│  ❌ Wrong layer:              1 file         │
└─────────────────────────────────────────────┘
```

---

## 7. Convention Compliance

> Reference: `docs/01-plan/conventions.md` or Phase 2 Pipeline output

### 7.1 Naming Convention Check

| Category | Convention | Files Checked | Compliance | Violations |
|----------|-----------|:-------------:|:----------:|------------|
| Components | PascalCase | 15 | 100% | - |
| Functions | camelCase | 42 | 98% | `GetUser` → `getUser` |
| Constants | UPPER_SNAKE_CASE | 8 | 100% | - |
| Files (component) | PascalCase.tsx | 15 | 93% | `userProfile.tsx` → `UserProfile.tsx` |
| Files (utility) | camelCase.ts | 12 | 100% | - |
| Folders | kebab-case | 10 | 90% | `userProfile/` → `user-profile/` |

### 7.2 Folder Structure Check

| Expected Path | Exists | Contents Correct | Notes |
|---------------|:------:|:----------------:|-------|
| `src/components/` | ✅ | ✅ | |
| `src/features/{feature}/` | ✅ | ✅ | |
| `src/services/` | ✅ | ⚠️ | Some services in features/ |
| `src/types/` | ✅ | ✅ | |
| `src/lib/` | ✅ | ✅ | |

### 7.3 Import Order Check

- [x] External libraries first
- [x] Internal absolute imports second (`@/...`)
- [ ] Relative imports third (`./...`)
- [x] Type imports fourth (`import type`)
- [x] Styles last

**Violations Found:**
| File | Issue | Line |
|------|-------|------|
| `components/Header.tsx` | Type import before relative import | L5-6 |

### 7.4 Environment Variable Check

| Variable | Convention | Actual | Status |
|----------|-----------|--------|--------|
| API URL | `NEXT_PUBLIC_API_URL` | `NEXT_PUBLIC_API_URL` | ✅ |
| DB Host | `DB_HOST` | `DATABASE_HOST` | ⚠️ Non-standard |
| Auth Secret | `AUTH_SECRET` | `AUTH_SECRET` | ✅ |

### 7.5 Convention Score

```
┌─────────────────────────────────────────────┐
│  Convention Compliance: 92%                  │
├─────────────────────────────────────────────┤
│  Naming:          95%                        │
│  Folder Structure: 90%                       │
│  Import Order:     88%                       │
│  Env Variables:    95%                       │
└─────────────────────────────────────────────┘
```

---

## 8. Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Score: 78/100                       │
├─────────────────────────────────────────────┤
│  Design Match:        75 points              │
│  Code Quality:        70 points              │
│  Security:            65 points              │
│  Testing:             70 points              │
│  Performance:         80 points              │
│  Architecture:        85 points (New)        │
│  Convention:          92 points (New)        │
└─────────────────────────────────────────────┘
```

---

## 9. Recommended Actions

### 9.1 Immediate (within 24 hours)

| Priority | Item | File | Assignee |
|----------|------|------|----------|
| 🔴 1 | Remove hardcoded secret | auth.ts:42 | - |
| 🔴 2 | Add input validation | api.ts:15 | - |

### 9.2 Short-term (within 1 week)

| Priority | Item | File | Expected Impact |
|----------|------|------|-----------------|
| 🟡 1 | Fix N+1 query | repository.ts | 60% response time reduction |
| 🟡 2 | Split function | service.ts | Improved maintainability |

### 9.3 Long-term (backlog)

| Item | File | Notes |
|------|------|-------|
| Refactoring | utils/ | Clean up duplicate code |
| Documentation | - | Add JSDoc |

---

## 10. Design Document Updates Needed

The following items require design document updates to match implementation:

- [ ] Add POST /api/{resource}/bulk endpoint
- [ ] Add metadata field to data model
- [ ] Update error code list

---

## 11. Next Steps

- [ ] Fix Critical issues
- [ ] Update design document
- [ ] Write completion report (`{feature}.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial analysis | {author} |
