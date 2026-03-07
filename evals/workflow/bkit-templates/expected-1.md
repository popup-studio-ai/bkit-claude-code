# bkit-templates Expected Output - Process Steps

## Step 1: Template Selection
1. Detect the keyword "plan document" to trigger the bkit-templates skill
2. Identify the document type as Plan based on user request
3. Select plan.template.md from ${CLAUDE_PLUGIN_ROOT}/templates/
4. Load the template content for Plan phase structure

## Step 2: Variable Substitution
5. Replace {feature} with "shopping-cart" throughout the document
6. Replace {date} with the current date (2026-03-08)
7. Replace {author} with the document author name
8. Apply Status as "Draft" for newly created documents

## Step 3: Document Structure Compliance
9. Include common header with Summary, Author, Created, Last Modified, Status fields
10. Generate Overview and Purpose section describing the shopping-cart feature
11. Generate Scope section with In-scope and Out-of-scope items
12. Generate Requirements section with Functional and Non-Functional requirements
13. Generate Success Criteria section with measurable outcomes
14. Generate Risks and Mitigation section identifying potential blockers

## Step 4: Output Path and File Naming
15. Create document at docs/01-plan/features/shopping-cart.plan.md
16. Follow file naming convention: {feature}.{type}.md format
17. Ensure docs/01-plan/features/ directory exists before writing

## Step 5: Cross-Reference and Version Control
18. Add Version History table with initial version entry
19. Add Related Documents section linking to future design/analysis/report paths
20. Update _INDEX.md in docs/01-plan/ if it exists
21. Verify document conforms to Document Standards defined in the skill
