# Phase 8 Review Expected Output - Process Steps

## Step 1: Trigger Detection and Scope Definition
1. Detect trigger keywords: "code review", "completed feature", "before deployment"
2. Activate phase-8-review skill for full codebase quality verification
3. Invoke code-analyzer agent as default review agent
4. Define review scope: architecture, convention, code quality, cross-phase consistency
5. Confirm Dynamic-level review requirements (required, not optional)

## Step 2: Cross-Phase Consistency Verification
6. Phase 1 check: Verify glossary terms from docs/01-plan/terminology.md are used consistently in code
7. Phase 2 check: Verify CONVENTIONS.md naming rules (PascalCase, camelCase, UPPER_SNAKE_CASE) compliance
8. Phase 2 check: Verify environment variable naming (NEXT_PUBLIC_*, DB_*, API_*) compliance
9. Phase 4 check: Verify API endpoints follow RESTful principles (resource-based URLs, correct HTTP methods)
10. Phase 5 check: Verify design tokens used in components (no hardcoded colors or sizes)
11. Phase 6 check: Verify UI-API integration follows layered architecture (components -> hooks -> services)
12. Phase 7 check: Verify security measures applied (authentication middleware, input validation, XSS/CSRF defense)

## Step 3: Architecture Review Checklist
13. Verify folder structure matches CONVENTIONS.md definitions
14. Verify separation of concerns across presentation/application/domain/infrastructure layers
15. Verify dependency direction: outer layers depend on inner layers only
16. Check for unnecessary abstraction or missing encapsulation
17. Detect circular dependencies between modules

## Step 4: Code Quality Analysis
18. Detect duplicate code across the codebase using pattern matching
19. Identify functions exceeding 20 lines or files exceeding 200 lines
20. Check for deeply nested conditionals (3+ levels)
21. Verify error handling consistency across API routes and services
22. Assess type safety: no implicit any, proper null/undefined handling

## Step 5: Gap Analysis and Report Generation
23. Compare docs/02-design/features/e-commerce.design.md against implementation
24. Calculate Match Rate: total items vs implemented items
25. Generate review report at docs/03-analysis/architecture-review.md
26. Assign refactoring priority: Urgent / High / Medium / Low for each finding
27. Suggest next phase: Phase 9 Deployment after review issues are resolved
