# bkit-rules Expected Output - Process Steps

## Step 1: PDCA Auto-Apply Rules Activation
1. The skill triggers automatically on the keyword "implement" and "feature"
2. Classify the task as "Feature" (200-1000 chars) with Standard PDCA level
3. Check docs/02-design/ for existing design document for user-auth
4. If design is missing, prompt to create design document first before implementation

## Step 2: Level Auto-Detection
5. Check CLAUDE.md for explicit Level declaration (none found)
6. Scan file structure for Enterprise indicators (infra/terraform/, services/, etc.)
7. Scan for Dynamic indicators (bkend settings, supabase/, firebase.json)
8. Determine project level as Starter (no Enterprise or Dynamic conditions met)
9. Apply Starter-level behavior: friendly explanation, detailed code comments

## Step 3: Agent Auto-Trigger Rules
10. Detect user intent as feature development
11. Select appropriate agent based on detected Starter level
12. Auto-invoke starter-guide agent for Starter-level projects
13. Do not invoke enterprise-expert or bkend-expert agents

## Step 4: Code Quality Standards Enforcement
14. Search for existing similar functionality in utils/, hooks/, components/ui/
15. Apply DRY principle: extract to common function on 2nd use
16. Apply SRP principle: one function, one responsibility
17. Ensure no hardcoded values; use meaningful constants
18. Self-check: verify no duplicate logic, all functions reusable

## Step 5: Task Classification and PDCA Level Assignment
19. Classify request content size against thresholds (Quick Fix / Minor / Feature / Major)
20. Assign Standard PDCA level for Feature-class tasks
21. Check/create design doc before proceeding with implementation
22. Suggest gap analysis upon implementation completion
