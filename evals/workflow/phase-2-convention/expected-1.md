# Phase 2 Convention Expected Output - Process Steps

## Step 1: Trigger Detection and Phase Validation
1. Detect keyword "coding conventions" matching the phase-2-convention skill triggers
2. Validate that Phase 1 (Schema/Terminology) is completed before proceeding
3. Reference Phase 1 glossary at docs/01-plan/terminology.md for naming consistency
4. Invoke pipeline-guide agent for convention guidance
5. Apply Dynamic-level convention scope (extended, including API and state management)

## Step 2: Naming Convention Definition
6. Define component naming: PascalCase (e.g., ProductCard, CartSummary)
7. Define function naming: camelCase (e.g., calculateTotal, formatPrice)
8. Define constants naming: UPPER_SNAKE_CASE (e.g., MAX_CART_ITEMS, API_BASE_URL)
9. Define file naming: kebab-case for utilities, PascalCase for components
10. Cross-reference naming with Phase 1 terminology for domain term consistency

## Step 3: Folder Structure and Architecture Rules
11. Define Dynamic-level folder structure with feature-based organization:
    - src/components/ui/ (reusable UI components)
    - src/features/ (feature modules: auth/, product/, cart/)
    - src/hooks/ (custom React hooks)
    - src/services/ (application layer / API service wrappers)
    - src/types/ (domain types and interfaces)
    - src/lib/ (infrastructure: API client, utilities)
12. Define dependency direction rules: Presentation -> Application -> Domain
13. Prohibit direct infrastructure imports from presentation layer

## Step 4: Environment Variable and Code Style Convention
14. Define environment variable naming: NEXT_PUBLIC_* for client, DB_*/API_*/AUTH_* for server
15. Create .env.example template with categorized sections
16. Define code style rules: indentation, quotes, semicolons for React/TypeScript
17. Define import ordering rules and path alias conventions (@/ prefix)

## Step 5: Deliverable Generation
18. Generate CONVENTIONS.md at project root with all convention rules
19. Generate docs/01-plan/naming.md with detailed naming reference
20. Generate docs/01-plan/structure.md with folder structure documentation
21. Create Task: [Phase-2] with reference to convention documents
22. Suggest next phase: Phase 3 Mockup Development
