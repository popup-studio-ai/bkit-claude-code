# PDCA Expected Output - Process Steps for Plan Phase

## Step 1: Action Parsing and Phase Detection
1. Parse the invocation arguments: action = "plan", feature = "user-auth"
2. Detect the target PDCA phase as Plan based on the "plan" keyword
3. Route to the Plan phase handler (not design, analyze, iterate, or report)
4. Verify this is a valid transition from current phase "pm"

## Step 2: PRD Auto-Reference Check
5. Check if docs/00-pm/user-auth.prd.md exists (PRD from PM analysis)
6. PRD file found: read the PRD document content
7. Use PRD content as context to improve Plan document quality
8. Reference Opportunity Solution Tree, Value Proposition, and market data from PRD

## Step 3: Plan Document Generation
9. Check if docs/01-plan/features/user-auth.plan.md already exists
10. Document does not exist: create new Plan document from plan.template.md
11. Apply template structure with PRD-informed content
12. Write Executive Summary section with 4-perspective table (Problem/Solution/Function UX Effect/Core Value)
13. Each perspective entry should be 1-2 sentences

## Step 4: Task Integration
14. Create Task with title: [Plan] user-auth
15. Set task dependencies based on PDCA flow (blockedBy: PM task if exists)
16. Update .bkit-memory.json: set phase = "plan" for feature user-auth

## Step 5: Output and Next Phase Guidance
17. Write document to docs/01-plan/features/user-auth.plan.md
18. Output the Executive Summary table directly in the response for immediate visibility
19. Suggest next phase: /pdca design user-auth
20. Mention Plan Plus alternative: /plan-plus user-auth for higher-quality plans
