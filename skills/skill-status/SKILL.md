---
name: skill-status
classification: workflow
classification-reason: "Reports loaded skill inventory across core and project layers. Read-only status check workflow."
deprecation-risk: none
description: |
  Shows loaded skill inventory: bkit core skills vs project-local skills.
  Detects conflicts, overrides, and coverage gaps.
  Triggers: /skill-status, skill status, 스킬 상태, 스킬 목록
  Keywords: skill-status, skill list, skills loaded, 스킬 상태, 스킬 목록
argument-hint: "/skill-status [--detail] [--conflicts]"
user-invocable: true
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---

# skill-status - Skill Inventory Report

로드된 스킬 목록을 core(bkit 기본)와 project-local로 구분하여 표시.

## Command: `/skill-status`

### Step 1: Scan Core Skills

1. Read bkit core skills directory:
   `~/.claude/plugins/cache/bkit-marketplace/bkit/*/skills/`
2. For each skill directory, read SKILL.md frontmatter:
   - name, classification, description (first line)
3. Count total core skills

### Step 2: Scan Project-Local Skills

1. Read project skills directory:
   `.claude/skills/project/*/SKILL.md`
2. For each skill, read frontmatter
3. Count total project skills

### Step 3: Detect Conflicts

1. Compare skill names between core and project
2. If same name exists in both: mark as "override" (project wins)
3. If project skill triggers overlap with core: mark as "shadow"

### Step 4: Display Report

```
Skill Status Report
====================

Layer: bkit Core (v1.6.2)
  Skills: 28 loaded
  -----------------------------------------------
  Name                | Type       | Classification
  --------------------|------------|---------------
  pdca                | workflow   | PDCA lifecycle
  enterprise          | workflow   | Enterprise init
  bkit-rules          | capability | Auto-apply rules
  code-review         | workflow   | Code analysis
  ... (truncated)

Layer: Project-Local (hunikflow)
  Skills: 8 loaded
  -----------------------------------------------
  Name                | Type       | Classification
  --------------------|------------|---------------
  btw                 | workflow   | BTW suggestions
  skill-create        | workflow   | Skill generator
  skill-status        | workflow   | This report
  hunikflow-model     | capability | @Flow patterns
  hunikflow-proxy     | capability | DataProxy patterns
  hunikflow-domain    | capability | ERP domain logic
  hunikflow-i18n      | capability | i18n CSV guide
  hunikflow-dynamic-api| capability | Dynamic API guide

Conflicts: 0 overrides, 0 shadows

Summary: 36 total skills (28 core + 8 project)
```

### Options

**`/skill-status --detail`**: Show full descriptions and trigger keywords for each skill.

**`/skill-status --conflicts`**: Show only skills with naming conflicts or trigger overlaps.

## Skill Layer Priority

```
Priority (high to low):
1. .claude/skills/project/   (project-local, git-tracked)
2. ~/.claude/plugins/.../skills/  (bkit core, plugin-managed)
3. ~/.claude/skills/          (user global, if any)
```

When a project skill has the same name as a core skill, the project skill takes precedence.
This is the "2-layer override" pattern.
