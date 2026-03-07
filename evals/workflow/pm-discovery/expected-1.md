# PM Discovery Expected Output - Process Steps

## Step 1: Trigger Detection and Prerequisites
1. Detect trigger keywords: "market analysis", "opportunity discovery", "SaaS feature"
2. Activate pm-discovery skill and invoke pm-lead agent as orchestrator
3. Verify Agent Teams is enabled (CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1)
4. Verify project level is Dynamic or Enterprise (Starter not supported)
5. Confirm no existing PRD at docs/00-pm/team-collaboration.prd.md

## Step 2: Phase 1 - Context Collection
6. pm-lead agent collects project context: repository info, existing docs, git history
7. Identify the feature scope: team-collaboration for SaaS application
8. Gather any existing user research, feedback, or feature requests
9. Establish the analysis framework parameters for all sub-agents

## Step 3: Phase 2 - Parallel Analysis (3 Agents)
10. Launch pm-discovery agent: generate Opportunity Solution Tree (Teresa Torres framework)
11. Launch pm-strategy agent: create Value Proposition using JTBD 6-Part format
12. Launch pm-strategy agent: create Lean Canvas (Ash Maurya framework)
13. Launch pm-research agent: develop 3 User Personas using JTBD methodology
14. Launch pm-research agent: perform Competitor Analysis (5 competitors, strategic positioning)
15. Launch pm-research agent: calculate Market Sizing using TAM/SAM/SOM dual-method

## Step 4: Phase 3 - PRD Synthesis
16. pm-prd agent synthesizes all analysis outputs into unified PRD
17. Define Beachhead Segment using Geoffrey Moore's framework
18. Create GTM Strategy based on Product Compass methodology
19. Generate 8-section PRD document with Executive Summary (4-perspective table)
20. Include all framework outputs: OST, Value Prop, Lean Canvas, Personas, Competitors, Market Size

## Step 5: Output and PDCA Integration
21. Save PRD document to docs/00-pm/team-collaboration.prd.md
22. Create Task: [PM] team-collaboration
23. Update .bkit-memory.json: set phase = "pm" for feature team-collaboration
24. Guide user to next step: /pdca plan team-collaboration (PRD auto-referenced in Plan)
25. Explain that Plan document quality will be significantly improved with PM-backed data
