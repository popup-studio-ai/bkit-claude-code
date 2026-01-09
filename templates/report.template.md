---
template: report
version: 1.0
description: PDCA Act phase document template (completion report)
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
---

# {feature} Completion Report

> **Status**: Complete / Partial / Cancelled
>
> **Author**: {author}
> **Completion Date**: {date}
> **PDCA Cycle**: #{cycle_number}

---

## 1. Summary

### 1.1 Project Overview

| Item | Content |
|------|---------|
| Feature | {feature} |
| Start Date | {start_date} |
| End Date | {date} |
| Duration | {duration} |

### 1.2 Results Summary

```
┌─────────────────────────────────────────────┐
│  Completion Rate: 95%                        │
├─────────────────────────────────────────────┤
│  ✅ Complete:     19 / 20 items              │
│  ⏳ In Progress:   1 / 20 items              │
│  ❌ Cancelled:     0 / 20 items              │
└─────────────────────────────────────────────┘
```

---

## 2. Related Documents

| Phase | Document | Status |
|-------|----------|--------|
| Plan | [{feature}.plan.md](../01-plan/features/{feature}.plan.md) | ✅ Finalized |
| Design | [{feature}.design.md](../02-design/features/{feature}.design.md) | ✅ Finalized |
| Check | [{feature}.analysis.md](../03-analysis/{feature}.analysis.md) | ✅ Complete |
| Act | Current document | 🔄 Writing |

---

## 3. Completed Items

### 3.1 Functional Requirements

| ID | Requirement | Status | Notes |
|----|-------------|--------|-------|
| FR-01 | {Requirement 1} | ✅ Complete | |
| FR-02 | {Requirement 2} | ✅ Complete | |
| FR-03 | {Requirement 3} | ✅ Complete | Scope reduced |
| FR-04 | {Requirement 4} | ⏳ Next cycle | Time constraint |

### 3.2 Non-Functional Requirements

| Item | Target | Achieved | Status |
|------|--------|----------|--------|
| Performance | < 200ms | 150ms | ✅ |
| Test Coverage | 80% | 82% | ✅ |
| Accessibility | WCAG 2.1 AA | AA compliant | ✅ |

### 3.3 Deliverables

| Deliverable | Location | Status |
|-------------|----------|--------|
| Components | src/features/{feature}/components/ | ✅ |
| API | src/features/{feature}/api/ | ✅ |
| Tests | src/features/{feature}/__tests__/ | ✅ |
| Documentation | docs/ | ✅ |

---

## 4. Incomplete Items

### 4.1 Carried Over to Next Cycle

| Item | Reason | Priority | Estimated Effort |
|------|--------|----------|------------------|
| FR-04 | Time constraint | High | 2 days |
| Performance optimization | Out of scope | Medium | 1 day |

### 4.2 Cancelled/On Hold Items

| Item | Reason | Alternative |
|------|--------|-------------|
| - | - | - |

---

## 5. Quality Metrics

### 5.1 Final Analysis Results

| Metric | Target | Final | Change |
|--------|--------|-------|--------|
| Design Match Rate | 90% | 95% | +20% |
| Code Quality Score | 70 | 85 | +15 |
| Test Coverage | 80% | 82% | +12% |
| Security Issues | 0 Critical | 0 | ✅ |

### 5.2 Resolved Issues

| Issue | Resolution | Result |
|-------|------------|--------|
| Hardcoded secret | Moved to env var | ✅ Resolved |
| N+1 query | Eager Loading | ✅ Resolved |
| Missing input validation | Added Zod schema | ✅ Resolved |

---

## 6. Lessons Learned & Retrospective

### 6.1 What Went Well (Keep)

- {Positive 1: e.g., Design documentation improved implementation efficiency}
- {Positive 2: e.g., Early code review caught bugs proactively}
- {Positive 3}

### 6.2 What Needs Improvement (Problem)

- {Improvement 1: e.g., Initial scope estimation was inaccurate}
- {Improvement 2: e.g., Test cases written too late}
- {Improvement 3}

### 6.3 What to Try Next (Try)

- {Try 1: e.g., Adopt TDD approach}
- {Try 2: e.g., Smaller PR units}
- {Try 3}

---

## 7. Process Improvement Suggestions

### 7.1 PDCA Process

| Phase | Current | Improvement Suggestion |
|-------|---------|------------------------|
| Plan | Insufficient requirement gathering | Add user interviews |
| Design | - | - |
| Do | Poor design reference | Introduce design checklist |
| Check | Manual analysis | Introduce automation tools |

### 7.2 Tools/Environment

| Area | Improvement Suggestion | Expected Benefit |
|------|------------------------|------------------|
| CI/CD | Auto deployment | Reduced deployment time |
| Testing | Add E2E tests | Quality improvement |

---

## 8. Next Steps

### 8.1 Immediate

- [ ] Production deployment
- [ ] Monitoring setup
- [ ] User guide creation

### 8.2 Next PDCA Cycle

| Item | Priority | Expected Start |
|------|----------|----------------|
| {Next feature 1} | High | {date} |
| {Next feature 2} | Medium | {date} |

---

## 9. Changelog

### v1.0.0 ({date})

**Added:**
- {Added feature 1}
- {Added feature 2}

**Changed:**
- {Changed item}

**Fixed:**
- {Fixed bug}

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | {date} | Completion report created | {author} |
