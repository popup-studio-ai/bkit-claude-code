---
template: plan
version: 1.0
description: PDCA Plan phase document template
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
---

# {feature} Planning Document

> **Summary**: {One-line description}
>
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

{The problem this feature solves or the goal it achieves}

### 1.2 Background

{Why this feature is needed, business context}

### 1.3 Related Documents

- Requirements: {link}
- References: {link}

---

## 2. Scope

### 2.1 In Scope

- [ ] {Included item 1}
- [ ] {Included item 2}
- [ ] {Included item 3}

### 2.2 Out of Scope

- {Excluded item 1}
- {Excluded item 2}

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | {Requirement description} | High/Medium/Low | Pending |
| FR-02 | {Requirement description} | High/Medium/Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | {e.g., Response time < 200ms} | {Tool/Method} |
| Security | {e.g., OWASP Top 10 compliance} | {Verification method} |
| Accessibility | {e.g., WCAG 2.1 AA} | {Verification method} |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] All functional requirements implemented
- [ ] Unit tests written and passing
- [ ] Code review completed
- [ ] Documentation completed

### 4.2 Quality Criteria

- [ ] Test coverage above 80%
- [ ] Zero lint errors
- [ ] Build succeeds

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| {Risk 1} | High/Medium/Low | High/Medium/Low | {Mitigation plan} |
| {Risk 2} | High/Medium/Low | High/Medium/Low | {Mitigation plan} |

---

## 6. Next Steps

1. [ ] Write design document (`{feature}.design.md`)
2. [ ] Team review and approval
3. [ ] Start implementation

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
