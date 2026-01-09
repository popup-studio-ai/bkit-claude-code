---
template: analysis
version: 1.0
description: PDCA Check phase document template (design-implementation analysis)
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
---

# {feature} Analysis Report

> **Analysis Type**: Gap Analysis / Code Quality / Performance Analysis
>
> **Analyst**: {author}
> **Date**: {date}
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

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

### 2.4 Match Rate Summary

```
┌─────────────────────────────────────────────┐
│  Overall Match Rate: 75%                     │
├─────────────────────────────────────────────┤
│  ✅ Match:          12 items (60%)           │
│  ⚠️ Missing design:  4 items (20%)           │
│  ❌ Not implemented:  4 items (20%)           │
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

## 6. Overall Score

```
┌─────────────────────────────────────────────┐
│  Overall Score: 72/100                       │
├─────────────────────────────────────────────┤
│  Design Match:     75 points                 │
│  Code Quality:     70 points                 │
│  Security:         65 points                 │
│  Testing:          70 points                 │
│  Performance:      80 points                 │
└─────────────────────────────────────────────┘
```

---

## 7. Recommended Actions

### 7.1 Immediate (within 24 hours)

| Priority | Item | File | Assignee |
|----------|------|------|----------|
| 🔴 1 | Remove hardcoded secret | auth.ts:42 | - |
| 🔴 2 | Add input validation | api.ts:15 | - |

### 7.2 Short-term (within 1 week)

| Priority | Item | File | Expected Impact |
|----------|------|------|-----------------|
| 🟡 1 | Fix N+1 query | repository.ts | 60% response time reduction |
| 🟡 2 | Split function | service.ts | Improved maintainability |

### 7.3 Long-term (backlog)

| Item | File | Notes |
|------|------|-------|
| Refactoring | utils/ | Clean up duplicate code |
| Documentation | - | Add JSDoc |

---

## 8. Design Document Updates Needed

The following items require design document updates to match implementation:

- [ ] Add POST /api/{resource}/bulk endpoint
- [ ] Add metadata field to data model
- [ ] Update error code list

---

## 9. Next Steps

- [ ] Fix Critical issues
- [ ] Update design document
- [ ] Write completion report (`{feature}.report.md`)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial analysis | {author} |
