---
template: plan-plus
version: 1.0
description: Brainstorming-enhanced PDCA Plan template with User Intent, Alternatives, and YAGNI sections
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - project: Project name (from package.json or CLAUDE.md)
  - version: Project version (from package.json)
---

# {feature} Planning Document

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Method**: Plan Plus (Brainstorming-Enhanced PDCA)

---

## 1. User Intent Discovery

### 1.1 Core Problem

{The core problem this feature solves — discovered through brainstorming Q1}

### 1.2 Target Users

| User Type | Usage Context | Key Need |
|-----------|---------------|----------|
| {User type} | {Context} | {Key need} |

### 1.3 Success Criteria

- [ ] {Measurable success criterion 1}
- [ ] {Measurable success criterion 2}

### 1.4 Constraints

| Constraint | Details | Impact |
|------------|---------|--------|
| {Constraint} | {Details} | High/Medium/Low |

---

## 2. Alternatives Explored

### 2.1 Approach A: {name} {Mark "— Selected" if chosen}

| Aspect | Details |
|--------|---------|
| **Summary** | {One-line description} |
| **Pros** | {Advantages} |
| **Cons** | {Disadvantages} |
| **Effort** | {Estimated complexity: Low/Medium/High} |
| **Best For** | {When this approach is most suitable} |

### 2.2 Approach B: {name}

| Aspect | Details |
|--------|---------|
| **Summary** | {One-line description} |
| **Pros** | {Advantages} |
| **Cons** | {Disadvantages} |
| **Effort** | {Estimated complexity} |
| **Best For** | {When this approach is most suitable} |

### 2.3 Decision Rationale

**Selected**: Approach {A/B}
**Reason**: {Selection reason — based on specific trade-offs}

---

## 3. YAGNI Review

### 3.1 Included (v1 Must-Have)

- [ ] {Essential feature 1}
- [ ] {Essential feature 2}
- [ ] {Essential feature 3}

### 3.2 Deferred (v2+ Maybe)

| Feature | Reason for Deferral | Revisit When |
|---------|---------------------|--------------|
| {Feature} | {Why not needed now} | {When to reconsider} |

### 3.3 Removed (Won't Do)

| Feature | Reason for Removal |
|---------|-------------------|
| {Feature} | {Removal reason} |

---

## 4. Scope

### 4.1 In Scope

- [ ] {Included item 1}
- [ ] {Included item 2}
- [ ] {Included item 3}

### 4.2 Out of Scope

- {Excluded item 1} — (from YAGNI Review)
- {Excluded item 2}

---

## 5. Requirements

### 5.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | {Requirement description} | High/Medium/Low | Pending |
| FR-02 | {Requirement description} | High/Medium/Low | Pending |

### 5.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | {e.g., Response time < 200ms} | {Tool/Method} |
| Security | {e.g., OWASP Top 10 compliance} | {Verification method} |

---

## 6. Success Criteria

### 6.1 Definition of Done

- [ ] All functional requirements implemented
- [ ] Unit tests written and passing
- [ ] Code review completed
- [ ] Documentation completed

### 6.2 Quality Criteria

- [ ] Test coverage above 80%
- [ ] Zero lint errors
- [ ] Build succeeds

---

## 7. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| {Risk 1} | High/Medium/Low | High/Medium/Low | {Mitigation plan} |
| {Risk 2} | High/Medium/Low | High/Medium/Low | {Mitigation plan} |

---

## 8. Architecture Considerations

### 8.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure (`components/`, `lib/`, `types/`) | Static sites, portfolios, landing pages | |
| **Dynamic** | Feature-based modules, BaaS integration (bkend.ai) | Web apps with backend, SaaS MVPs, fullstack apps | |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems, complex architectures | |

### 8.2 Key Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| {Decision} | {Option list} | {Selected} | {Rationale} |

### 8.3 Component Overview

```
{Component structure diagram}
```

### 8.4 Data Flow

```
{Data flow diagram}
```

---

## 9. Convention Prerequisites

### 9.1 Applicable Conventions

- [ ] Existing project conventions verified
- [ ] Naming rules confirmed
- [ ] Folder structure rules confirmed

---

## 10. Next Steps

1. [ ] Write design document (`/pdca design {feature}`)
2. [ ] Team review and approval
3. [ ] Start implementation (`/pdca do {feature}`)

---

## Appendix: Brainstorming Log

> Key decisions from Plan Plus Phases 1-4.

| Phase | Question | Answer | Decision |
|-------|----------|--------|----------|
| Intent | {Question summary} | {Answer summary} | {Decision} |
| Alternatives | {Compared items} | {Selection} | {Rationale} |
| YAGNI | {Reviewed items} | {Include/Exclude} | {Reason} |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft (Plan Plus) | {author} |
