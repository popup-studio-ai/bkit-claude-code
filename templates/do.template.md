---
template: do
version: 1.0
description: PDCA Do phase implementation guide template
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - project: Project name
  - version: Project version
---

# {feature} Implementation Guide

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **Status**: In Progress
> **Design Doc**: [{feature}.design.md](../02-design/features/{feature}.design.md)

---

## 1. Pre-Implementation Checklist

### 1.1 Documents Verified

- [ ] Plan document reviewed: `docs/01-plan/features/{feature}.plan.md`
- [ ] Design document reviewed: `docs/02-design/features/{feature}.design.md`
- [ ] Conventions understood: `CONVENTIONS.md` or `docs/01-plan/conventions.md`

### 1.2 Environment Ready

- [ ] Dependencies installed
- [ ] Development server running
- [ ] Test environment configured
- [ ] Required environment variables set

---

## 2. Implementation Order

> Follow this order based on Design document specifications.

### 2.1 Phase 1: Data Layer

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 1 | Define types/interfaces | `src/types/{feature}.ts` | ☐ |
| 2 | Create data models | `src/domain/{feature}/` | ☐ |
| 3 | Set up API client | `src/lib/api/{feature}.ts` | ☐ |

### 2.2 Phase 2: Business Logic

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 4 | Implement services | `src/services/{feature}.ts` | ☐ |
| 5 | Create custom hooks | `src/hooks/use{Feature}.ts` | ☐ |
| 6 | Add state management | `src/stores/{feature}.ts` | ☐ |

### 2.3 Phase 3: UI Components

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 7 | Create base components | `src/components/{feature}/` | ☐ |
| 8 | Implement pages/routes | `src/app/{feature}/` | ☐ |
| 9 | Add error handling UI | `src/components/error/` | ☐ |

### 2.4 Phase 4: Integration

| Priority | Task | File/Location | Status |
|:--------:|------|---------------|:------:|
| 10 | Connect API to UI | Component integration | ☐ |
| 11 | Add loading states | All async components | ☐ |
| 12 | Implement error handling | Try-catch, error boundaries | ☐ |

---

## 3. Key Files to Create/Modify

### 3.1 New Files

| File Path | Purpose | Template |
|-----------|---------|----------|
| `src/types/{feature}.ts` | Type definitions | Interface definitions |
| `src/services/{feature}.ts` | Business logic | Service class/functions |
| `src/hooks/use{Feature}.ts` | React hooks | Custom hook pattern |
| `src/components/{feature}/index.tsx` | Main component | Component template |

### 3.2 Files to Modify

| File Path | Changes | Reason |
|-----------|---------|--------|
| `src/app/layout.tsx` | Add provider/context | Global state setup |
| `src/lib/api/client.ts` | Add endpoints | API integration |
| `src/types/index.ts` | Export new types | Type organization |

---

## 4. Dependencies

### 4.1 Required Packages

```bash
# Add any new dependencies here
npm install {package1} {package2}
# or
pnpm add {package1} {package2}
```

### 4.2 Dev Dependencies

```bash
npm install -D {dev-package1} {dev-package2}
```

---

## 5. Implementation Notes

### 5.1 Design Decisions Reference

> Key decisions from Design document to follow during implementation.

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State Management | {choice} | {reason} |
| API Pattern | {choice} | {reason} |
| Error Handling | {choice} | {reason} |

### 5.2 Code Patterns to Follow

```typescript
// Example pattern from conventions
// Add specific patterns here based on project conventions
```

### 5.3 Things to Avoid

- [ ] Hardcoded values (use constants/config)
- [ ] Direct DOM manipulation (use React patterns)
- [ ] Inline styles (use Tailwind/CSS modules)
- [ ] Console.log in production code

### 5.4 Architecture Checklist (Phase 2 Based)

> Verify Clean Architecture compliance

- [ ] **Layer Structure** - Follow layer structure matching level
  - Starter: components, lib, types
  - Dynamic: components, features, services, types, lib/api
  - Enterprise: presentation, application, domain, infrastructure
- [ ] **Dependency Direction** - Follow dependency direction rules
  - Presentation → Application, Domain (not Infrastructure)
  - Application → Domain, Infrastructure
  - Domain → none (independent)
  - Infrastructure → Domain only
- [ ] **Import Rules** - Follow import rules
  - No direct @/lib/api imports from components
  - No UI imports from services

### 5.5 Convention Checklist (Phase 2 Based)

> Verify coding convention compliance

- [ ] **Naming Convention**
  - Components: PascalCase (UserProfile.tsx)
  - Functions: camelCase (getUserById)
  - Constants: UPPER_SNAKE_CASE (MAX_RETRY_COUNT)
  - Files (component): PascalCase.tsx
  - Files (utility): camelCase.ts
  - Folders: kebab-case
- [ ] **Import Order**
  1. External libraries (react, next)
  2. Internal absolute imports (@/...)
  3. Relative imports (./...)
  4. Type imports (import type)
  5. Styles

### 5.6 Security Checklist (Phase 7 Based)

> Verify security vulnerabilities

- [ ] **Input Validation**
  - Validate all user input
  - SQL Injection prevention (parameterized queries)
  - XSS prevention (output escaping)
- [ ] **Auth**
  - Store auth tokens securely (httpOnly cookie)
  - Use CSRF tokens
  - Encrypt sensitive data

### 5.7 API Checklist (Phase 4 Based)

> Verify API standards compliance

- [ ] **Response Format** - Use standard response format
  - Success: `{ data, meta? }`
  - Error: `{ error: { code, message, details? } }`
  - Pagination: `{ data, pagination }`
- [ ] **Error Codes** - Use standard error codes
  - VALIDATION_ERROR, UNAUTHORIZED, NOT_FOUND, etc.
- [ ] **HTTP Methods** - Follow RESTful rules
  - GET (read), POST (create), PUT/PATCH (update), DELETE (delete)

---

## 6. Testing Checklist

### 6.1 Manual Testing

- [ ] Happy path works correctly
- [ ] Error states handled properly
- [ ] Loading states displayed
- [ ] Edge cases covered

### 6.2 Code Quality

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Follows naming conventions
- [ ] Proper error handling

---

## 7. Progress Tracking

### 7.1 Daily Progress

| Date | Tasks Completed | Notes |
|------|-----------------|-------|
| {date} | Started implementation | Initial setup |

### 7.2 Blockers

| Issue | Impact | Resolution |
|-------|--------|------------|
| {blocker} | {impact} | {how resolved} |

---

## 8. Post-Implementation

### 8.1 Self-Review Checklist

- [ ] All design requirements implemented
- [ ] Code follows conventions
- [ ] No hardcoded values
- [ ] Error handling complete
- [ ] Types properly defined

### 8.2 Ready for Check Phase

When all items above are complete:

```bash
# Run Gap Analysis
/pdca analyze {feature}
```

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial implementation start | {author} |
