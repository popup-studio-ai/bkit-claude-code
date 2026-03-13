---
name: skill-create
classification: workflow
classification-reason: "Interactive skill creation workflow with user prompts, file generation, and eval scaffolding. Multi-step process requiring user decisions."
deprecation-risk: none
description: |
  Interactive skill creation workflow for project-local skills.
  Generates SKILL.md + eval files based on project context.
  Triggers: /skill-create, skill create, 스킬 생성, 스킬 만들기
  Keywords: skill-create, create skill, generate skill, 스킬 생성
argument-hint: "/skill-create [name] | /skill-create from-btw {btw-id}"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# skill-create - Interactive Skill Creation Workflow

프로젝트 컨텍스트를 분석하여 project-local 스킬을 생성하는 워크플로우.

## Workflow Steps

### Step 1: Gather Information

If `/skill-create` (no args):
1. Ask user for skill name (kebab-case)
2. Ask user for skill purpose/description
3. Ask user for classification: workflow or capability

If `/skill-create {name}`:
1. Use provided name
2. Analyze project context to infer purpose
3. Ask user to confirm/modify

If `/skill-create from-btw {btw-id}`:
1. Read btw suggestion from `.bkit/btw-suggestions.json`
2. Use suggestion text as seed for skill description
3. Use suggestion context for project context

### Step 2: Analyze Project Context

1. Read `CLAUDE.md` for project conventions
2. Scan project structure:
   - Identify tech stack (Java/Spring, Next.js, Python, etc.)
   - Find relevant patterns in source code
   - Check existing project-local skills for overlap
3. Determine appropriate:
   - Allowed tools for the skill
   - Trigger keywords (Korean + English)
   - Related files/patterns to reference

### Step 3: Generate SKILL.md

Create `.claude/skills/project/{name}/SKILL.md` with:

```yaml
---
name: {name}
classification: {workflow|capability}
classification-reason: "{reason based on analysis}"
deprecation-risk: none
description: |
  {Generated description}
  Triggers: {trigger commands}
  Keywords: {keywords in Korean and English}
argument-hint: "{usage hint}"
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---
```

Body content includes:
- Purpose and when to use
- Step-by-step instructions for workflow skills
- Pattern reference for capability skills
- Code examples from actual project files
- Integration points with other skills

### Step 4: Generate Eval Files (optional)

Create `evals/{name}/` directory with:

```
evals/{name}/
  eval.yaml        - Test configuration
  prompt.txt       - Test prompt
  expected.txt     - Expected behavior description
```

**eval.yaml format:**
```yaml
name: "{name} skill eval"
skill: ".claude/skills/project/{name}/SKILL.md"
tests:
  - name: "basic trigger"
    prompt: "{trigger command}"
    expected:
      - "{expected behavior 1}"
      - "{expected behavior 2}"
  - name: "edge case"
    prompt: "{edge case prompt}"
    expected:
      - "{expected behavior}"
```

### Step 5: Confirm and Report

1. Show generated file paths
2. Show skill summary (name, classification, triggers)
3. Suggest: "Test with `/{name}` or review at `.claude/skills/project/{name}/SKILL.md`"

## Project-Local Skill Location

All generated skills go to: `.claude/skills/project/{name}/SKILL.md`

This location:
- Is git-trackable for team sharing
- Takes precedence over bkit core skills (2-layer architecture)
- Is auto-loaded by Claude Code's skill discovery

## Naming Conventions

| Pattern | Example | Use When |
|---------|---------|----------|
| `{project}-{domain}` | `hunikflow-model` | Domain-specific capability |
| `{action}-{target}` | `validate-entity` | Action-oriented workflow |
| `{tool}-{purpose}` | `proxy-guide` | Tool/pattern guide |

## From-BTW Integration

When creating from a /btw suggestion:
1. Read the suggestion's `context.file` to understand what code was being worked on
2. Read the suggestion's `context.feature` to understand the PDCA feature context
3. Use suggestion text as the primary description seed
4. After creation, update the btw suggestion's `promotedTo` field with the new skill name
