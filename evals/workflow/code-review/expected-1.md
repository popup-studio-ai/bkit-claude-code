# Code Review Expected Output - Process Steps

## Step 1: Trigger Detection and Review Scope
1. Detect trigger keywords: "review", "PR", "security issues", "bugs"
2. Activate code-review skill for comprehensive code analysis
3. Invoke code-analyzer agent with the PR scope (4 changed files)
4. Load phase-8-review.template.md for review structure reference
5. Create Task: [Code-Review] with PR reference

## Step 2: Security Review (Priority - User Requested)
6. Analyze src/lib/auth.ts for authentication logic vulnerabilities
7. Check for XSS vulnerability patterns in user input handling
8. Check for CSRF protection on state-changing API endpoints
9. Check src/api/users/route.ts for SQL injection patterns in query construction
10. Verify sensitive information is not exposed in API responses (passwords, tokens, secrets)
11. Verify authentication/authorization middleware is properly applied to the new endpoint

## Step 3: Bug Detection Analysis
12. Check for potential null/undefined handling issues in auth logic
13. Verify error handling covers all failure paths (try/catch, error boundaries)
14. Check boundary conditions: empty inputs, invalid tokens, expired sessions
15. Verify type safety: no implicit any types, proper TypeScript strict mode compliance
16. Check for race conditions in async authentication flows

## Step 4: Code Quality Assessment
17. Check for duplicate code between auth.ts and existing authentication utilities
18. Verify naming conventions match CONVENTIONS.md rules
19. Assess function complexity: flag functions exceeding 20 lines
20. Verify single responsibility principle: each function has one clear purpose
21. Check import structure follows project dependency direction rules

## Step 5: Review Report Generation
22. Generate Code Review Report with summary: files reviewed, issues found, score
23. Categorize issues by severity: Critical, Major, Minor
24. Apply confidence-based filtering: show High (90%+) always, Medium (70-89%) selectively
25. Provide actionable fix suggestions for each identified issue
26. Output report to docs/03-analysis/code-review-{date}.md
