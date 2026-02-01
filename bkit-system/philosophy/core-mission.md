# bkit Core Mission & Philosophy

> Core mission and 3 philosophies of bkit

## Core Mission

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         bkit's Core Mission                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   "Enable all developers using Claude Code to naturally adopt           │
│    'document-driven development' and 'continuous improvement'           │
│    even without knowing commands or PDCA methodology"                   │
│                                                                         │
│   In essence: AI guides humans toward good development practices        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Three Core Philosophies

| Philosophy | Description | Implementation |
|------------|-------------|----------------|
| **Automation First** | Claude automatically applies PDCA even if user doesn't know commands | `bkit-rules` skill + PreToolUse hooks |
| **No Guessing** | If unsure, check docs → If not in docs, ask user (never guess) | Design-first workflow, gap-detector agent |
| **Docs = Code** | Design first, implement later (maintain design-implementation sync) | PDCA workflow + `/pdca-analyze` command |

---

## User Journey

### Stage 1: Session Start

SessionStart Hook automatically displays welcome message:

```
User Options:
1. First Project → /first-claude-code
2. Learn Claude Code → /learn-claude-code
3. Project Setup → /setup-claude-code
4. Upgrade Settings → /upgrade-claude-code
```

### Stage 2: Level Detection

Claude analyzes the project and automatically detects the level:

| Level | Detection Conditions | Target Users |
|-------|---------------------|--------------|
| **Starter** | Only index.html, simple structure | Beginners, static web |
| **Dynamic** | Next.js + .mcp.json, BaaS integration | Intermediate, fullstack apps |
| **Enterprise** | services/ + infra/ folders, K8s | Advanced, MSA architecture |

### Stage 3: PDCA Auto-Apply

When user requests "create a feature":

```
1. Check Plan → Does docs/01-plan/features/{feature}.plan.md exist?
2. Check Design → Does docs/02-design/features/{feature}.design.md exist?
3. If not exists → Suggest creation | If exists → Reference and implement
4. After implementation → Suggest Gap Analysis
```

### Stage 4: Continuous Improvement

Based on Gap Analysis results:

| Match Rate | Next Action |
|------------|-------------|
| >= 90% | "PDCA complete, shall I generate a report?" |
| < 70% | "Shall I run auto-fix (iterate)?" |

---

## Value by Level

### Starter Level (Beginners)

```
Before: "I don't know where to start"
After:  4 options at session start → Natural beginning

Before: "Just write code, docs later..."
After:  Auto-generate simple plan/design docs → Habit formation

Before: "I keep making the same mistakes"
After:  Rules accumulate in CLAUDE.md → Cross-session learning
```

### Dynamic Level (Intermediate)

```
Before: "Setting up config files is tedious"
After:  /setup-claude-code → Auto-generation

Before: "Writing design docs is annoying"
After:  Templates + auto-generation → Design doc in 5 minutes

Before: "Code and docs don't match"
After:  /pdca-analyze → Auto gap analysis and sync suggestions
```

### Enterprise Level (Advanced)

```
Before: "Each team member uses Claude differently"
After:  Share plugin → Standardize entire team

Before: "Knowledge is volatile"
After:  PDCA docs + Git management → Permanent accumulation

Before: "Onboarding takes too long"
After:  /learn-claude-code → Systematic training
```

---

## Current Implementation (v1.5.0)

> **v1.5.0**: Claude Code Exclusive - Gemini CLI support removed

### Component Counts

| Component | Count | Location |
|-----------|-------|----------|
| Skills | 22 | `skills/*/SKILL.md` |
| Agents | 11 | `agents/*.md` |
| Commands | DEPRECATED | Migrated to Skills |
| Scripts | 39 | `scripts/*.js` |
| Templates | 23 | `templates/*.md` |
| lib/ | 4 modules (132 functions) | `lib/core/`, `lib/pdca/`, `lib/intent/`, `lib/task/` |

### Key Features

- **Language Tier System**: 4-tier classification (AI-Native, Mainstream, Domain, Legacy)
- **Unified Hook System**: PreToolUse/PostToolUse hooks in skill frontmatter
- **Task Classification**: Quick Fix/Minor Change/Feature/Major Feature
- **Multi-Language Support**: 30+ file extensions supported

---

## Related Documents

- [[ai-native-principles]] - AI-Native core competencies
- [[pdca-methodology]] - PDCA methodology details
- [[../README]] - System overview
- [[../_GRAPH-INDEX]] - Obsidian graph hub
