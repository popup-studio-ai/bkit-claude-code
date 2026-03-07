## Process Compliance Criteria (Workflow)

### 1. Phase 0: Context Exploration
- Reads project files (CLAUDE.md, package.json) to understand the existing stack
- Checks recent git commits for current work direction
- Reviews existing docs/01-plan/ documents to prevent duplicate planning
- Checks .bkit-memory.json for ongoing PDCA status
- Shares a brief summary of exploration results before proceeding

### 2. Phase 1: Intent Discovery via AskUserQuestion
- Asks questions one at a time using the AskUserQuestion tool
- Covers core purpose (Q1): what problem real-time chat solves for the team platform
- Covers target users (Q2): identifies who will use the chat feature
- Provides multiple-choice options inferred from project context with custom input option
- Minimizes total questions (2-4 max), does not over-interrogate

### 3. Phase 2: Alternatives Exploration
- Presents 2-3 distinct implementation approaches with trade-offs
- Includes at least: WebSocket-based, SSE-based, and third-party service options
- Lists pros, cons, and best-for scenarios for each approach
- Marks one approach as recommended with clear reasoning
- Uses AskUserQuestion to let the user choose their preferred approach

### 4. Phase 3: YAGNI Review
- Uses AskUserQuestion with multiSelect to verify essential features
- Lists all proposed features and lets user select only first-version requirements
- Moves unselected items to explicit Out of Scope section
- Applies the principle: do not abstract what can be done in 3 lines
- Avoids designing for hypothetical future requirements

### 5. Phase 4: Incremental Design Validation
- Presents architecture overview and asks for confirmation
- Presents key components/modules and asks for confirmation
- Presents data flow and asks for confirmation
- Revises only rejected sections without restarting the entire process
- Does not proceed to document generation until all sections are approved

## Output Quality Criteria (Plan Document)

### 6. Phase 5: Plan Document Generation
- Generates the plan document at docs/01-plan/features/{feature}.plan.md
- Includes Executive Summary with 4 perspectives (Problem/Solution/Function UX Effect/Core Value)
- Includes User Intent Discovery section with results from Phase 1
- Includes Alternatives Explored section with comparison from Phase 2
- Includes YAGNI Review section with included/deferred/removed items from Phase 3
- Includes Brainstorming Log capturing key decisions from all phases

### 7. HARD-GATE Compliance
- Does NOT write any code or scaffold any project during the entire process
- Does NOT invoke any implementation skill before plan approval
- Maintains the planning-only boundary even for features that seem simple
- Ends with clear next step guidance pointing to /pdca design {feature}
- Updates PDCA status in .bkit-memory.json with phase set to plan
