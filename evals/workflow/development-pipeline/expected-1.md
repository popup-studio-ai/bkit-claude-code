# Development Pipeline Expected Output - Process Steps

## Step 1: Trigger Detection and Level Assessment
1. Detect trigger keywords: "Phase 1", "development", "start", "order"
2. Identify user intent as requesting the 9-phase development pipeline guidance
3. Detect project level as Starter (no infra/terraform/, no services/, no bkend settings)
4. Invoke the pipeline-guide agent for Starter-level guidance
5. Note the user's beginner experience level for appropriate explanation depth

## Step 2: Present 9-Phase Pipeline Overview
6. Display the complete 9-phase pipeline in sequential order:
   - Phase 1: Schema/Terminology (define data structures and domain terms)
   - Phase 2: Coding Convention (define code writing rules)
   - Phase 3: Mockup Development (feature validation with HTML/CSS/JS + JSON)
   - Phase 4: API Design/Implementation (backend API + Zero Script QA)
   - Phase 5: Design System (build component system)
   - Phase 6: UI Implementation (actual UI and API integration)
   - Phase 7: SEO/Security (search optimization and security hardening)
   - Phase 8: Review (architecture/convention quality verification)
   - Phase 9: Deployment (production deployment)

## Step 3: Apply Starter-Level Flow
7. Determine Starter-level flow: Phase 1 -> 2 -> 3 -> 5(optional) -> 6(static) -> 7(SEO) -> 9
8. Skip Phase 4 (API) and Phase 8 (Review) for Starter level
9. Mark Phase 5 (Design System) as optional for simple projects
10. Explain that each phase runs its own PDCA cycle internally

## Step 4: Phase 1 Guidance
11. Guide Phase 1 deliverables: docs/01-plan/schema.md and terminology.md
12. Explain that schema defines data structures for the e-commerce domain
13. Identify key entities: products, categories, cart, orders, users
14. Suggest PDCA within Phase 1: Plan terminology -> Design schema -> Do documentation -> Check consistency

## Step 5: Progress Tracking and Next Steps
15. Create TodoWrite entries for each applicable phase
16. Highlight that PDCA applies within each phase (not across the entire pipeline)
17. Provide the command to start Phase 1 PDCA: /pdca plan e-commerce
18. Mention that Phase 2 conventions will reference Phase 1 terminology
