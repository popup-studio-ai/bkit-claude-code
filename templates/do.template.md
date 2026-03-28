---
template: do
version: 1.1
description: PDCA Do phase implementation guide template with Context Anchor and Session Scope
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

## Context Anchor

> Carried from Plan → Design → Do. Review WHY before implementation.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Design Context Anchor} |
| **WHO** | {copied from Design Context Anchor} |
| **RISK** | {copied from Design Context Anchor} |
| **SUCCESS** | {copied from Design Context Anchor} |
| **SCOPE** | {copied from Design Context Anchor} |

---

## Design Anchor (UI Implementation Guide)

> If Design Anchor exists, UI implementation MUST follow these locked tokens.
> Source: `docs/02-design/styles/{feature}.design-anchor.md`

| Category | Token | Value |
|----------|-------|-------|
| Primary Color | `--primary` | `{value}` |
| Background | `--bg` | `{value}` |
| Font | `font-family` | `{value}` |
| Radius | `border-radius` | `{value}` |
| Tone | — | {description} |

> shadcn/ui components must be styled to match these tokens. Design Anchor decides, code follows.
> Run `/design-anchor verify {feature}` after UI implementation to check consistency.

---

## Session Scope

> Scope: {--scope value or "전체 (all modules)"}

### Current Session Modules

| Module | Scope Key | Status |
|--------|-----------|:------:|
| {module} | `module-N` | ☐ This session |
| {module} | `module-N` | — Other session |

> Tip: Use `/pdca do {feature} --scope module-N` to focus on specific modules.

---

## Upstream Context Chain

> Full upstream documents loaded for implementation context continuity.

### Documents Loaded

| Document | Path | Key Context |
|----------|------|-------------|
| PRD | `docs/00-pm/{feature}.prd.md` | {WHY — core problem and value proposition} |
| Plan | `docs/01-plan/features/{feature}.plan.md` | {SUCCESS — criteria to meet} |
| Design | `docs/02-design/features/{feature}.design.md` | {HOW — architecture and data model} |

### Decision Record Chain

> Key decisions from PRD→Plan→Design that guide implementation.

| Source | Decision | Rationale |
|--------|----------|-----------|
| [PRD] | {decision} | {rationale} |
| [Plan] | {decision} | {rationale} |
| [Design] | {decision} | {rationale} |

### Success Criteria Tracking

> From Plan document. Each criterion must be addressed during implementation.

| # | Criteria | Scope Module | Status |
|---|---------|:------------:|:------:|
| SC-1 | {criteria text} | module-N | ☐ |
| SC-2 | {criteria text} | module-N | ☐ |

---

## 1. Pre-Implementation Checklist

### 1.1 Documents Verified

- [ ] PRD reviewed: `docs/00-pm/{feature}.prd.md`
- [ ] Plan document reviewed: `docs/01-plan/features/{feature}.plan.md`
- [ ] Design document reviewed: `docs/02-design/features/{feature}.design.md`
- [ ] Conventions understood: `CONVENTIONS.md` or `docs/01-plan/conventions.md`

### 1.2 Environment Ready

- [ ] Dependencies installed
- [ ] Development server running
- [ ] Test environment configured
- [ ] Required environment variables set

---

## 2. Implementation Strategy: Depth-First (v2.1.0)

> **CRITICAL RULE**: Implement DEEP, not WIDE.
>
> **Anti-pattern** (causes ~40% functional fidelity):
> Create 20+ files as skeletons → each file 30% complete → structural match 90% but functionally hollow
>
> **Correct pattern** (targets 80%+ functional fidelity):
> Implement 3-5 files fully → verify each file against Page UI Checklist → then next batch
>
> **Quality Gate**: Each file must score ≥60 on Functional Depth before creating next file.
> - No `// TODO` placeholders left behind
> - No `[1, 2, 3].map` skeleton arrays
> - No empty event handlers (`console.log` stubs)
> - All design-specified form fields present
> - Real data fetching, not hardcoded mock

### 2.0 Depth-First Rules (v2.3.0)

```
1. Maximum 3-5 files per implementation batch
2. Each batch follows: API route → Hook → Component → Page → TEST (bottom-up)
3. Code + Test = 1 set. No batch is "done" without tests passing.
4. Page UI Checklist items for current batch = 100% before next batch
5. curl/render verification after each batch
6. If session turn budget runs low, STOP and save progress
   (5 files × 100% >> 20 files × 30%)

Implementation cycle per batch:
  ① API route.ts       — implement endpoint
  ② Test L1            — curl test for that endpoint (status + response shape)
  ③ Hook + Component   — implement UI
  ④ Test L2            — Playwright test for that page (elements + data display)
  ⑤ Page integration   — connect everything
  ⑥ Verify             — run tests, all green → next batch

Test files location: tests/e2e/{feature}.spec.ts
Test scenarios come from: Design §8 Test Plan (L1/L2/L3 scenarios)
```

### 2.1 Sub-Module Splitting (v2.1.0)

> If Design Session Guide has modules with >20 estimated turns,
> split into sub-modules of 3-5 files each.

| Sub-Module | Files | Turns | Quality Gate |
|------------|:-----:|:-----:|-------------|
| {module-Na} | 3-5 | 10-15 | All files functional, Page UI Checklist items met |
| {module-Nb} | 3-5 | 10-15 | All files functional, Page UI Checklist items met |

> **Turn Budget Reality Check**:
> - New file (skeleton): ~1 turn
> - File full implementation: ~3-5 turns
> - API + Hook + Component + Page set: ~12-15 turns
> - Overestimating turn count leads to shallow breadth-first implementation

### 2.2 Implementation Order (Bottom-Up per Batch)

| Step | Layer | Task | Files | Status |
|:----:|-------|------|:-----:|:------:|
| 1 | Data | Types + Validation schemas | 1-2 | ☐ |
| 2 | API | API route with Zod + Auth | 1 | ☐ |
| 3 | Logic | Hook with real fetch + state | 1 | ☐ |
| 4 | UI | Component with ALL design fields | 1-2 | ☐ |
| 5 | Page | Page composing components | 1 | ☐ |
| **Gate** | **Verify** | **curl 200 + UI Checklist 100%** | — | ☐ |

### 2.3 Functional Completeness Checklist (per file)

Before marking a file as "done", verify:

- [ ] No `// TODO` or `// placeholder` comments remaining
- [ ] No `console.log()` stub handlers (must have real logic or proper state updates)
- [ ] No hardcoded mock arrays (`[1,2,3].map` → must use real data or empty state)
- [ ] All form fields from Page UI Checklist present
- [ ] All interactive elements (buttons, toggles, dropdowns) have real handlers
- [ ] Loading state implemented (not just permanent skeleton)
- [ ] Error state implemented (not just silent catch)
- [ ] Data fetching connected (useEffect + hook, or SSR fetch)

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

### 5.3 Code-to-Design Traceability (Phase 3)

> Add these comment patterns to create traceable links from code to design decisions.

```typescript
// At module/file level — link to Design section
// Design Ref: §3.1 Data Model — MongoDB with embedded documents for performance

// At critical business logic — link to Success Criteria
// Plan SC: Response time < 200ms for search queries

// At architecture decision points — link to Decision Record
// Decision: [Design] State Mgmt: Zustand — lightweight, no boilerplate
```

**Rules:**
- Add `// Design Ref:` at the top of files that implement a specific Design section
- Add `// Plan SC:` before code that directly addresses a Success Criteria
- Add `// Decision:` before code that implements a key architectural decision
- Keep comments concise (1 line) — they're pointers, not documentation

### 5.4 Things to Avoid

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
