---
name: development-pipeline
description: |
  9-phase Development Pipeline complete knowledge.
  Use when user doesn't know development order or starts a new project from scratch.

  Use proactively when user asks about development order, phases, what to do first,
  or starts a new project without clear direction.

  Triggers: development pipeline, phase, development order, where to start, what to do first,
  how to begin, new project, 개발 파이프라인, 뭐부터, 어디서부터, 순서, 시작,
  開発パイプライン, 何から, どこから, 开发流程, 从哪里开始,
  pipeline de desarrollo, fase, orden de desarrollo, por dónde empezar, qué hacer primero,
  pipeline de développement, phase, ordre de développement, par où commencer, que faire d'abord,
  Entwicklungspipeline, Phase, Entwicklungsreihenfolge, wo anfangen, was zuerst tun,
  pipeline di sviluppo, fase, ordine di sviluppo, da dove iniziare, cosa fare prima

  Do NOT use for: ongoing implementation, existing feature work, or bug fixes.
agent: bkit:pipeline-guide
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - TodoWrite
user-invocable: true
# hooks: Managed by hooks/hooks.json (unified-stop.js handles development-pipeline) - GitHub #9354 workaround
---

# Development Pipeline Skill

> Complete knowledge of the 9-phase development pipeline

## When to Use

- When user says "I have little development experience"
- When using `/pipeline-*` commands
- When asked "How do I start development?", "What's the order?"
- When starting a new project from scratch

## Optional Application Principle

```
This skill is optional, not mandatory.

Activation conditions:
- When non-developers/beginner developers start development
- When user explicitly requests guidance
- When /pipeline-start command is used

Deactivation conditions:
- When experienced developers want to "proceed freely"
- For non-development AI work (documentation, analysis, etc.)
- For existing project maintenance/bug fixes
```

## 9-Phase Pipeline Overview

```
Phase 1: Schema/Terminology ──→ Define data structures and domain terms
Phase 2: Coding Convention ────→ Define code writing rules
Phase 3: Mockup Development ───→ Feature validation with HTML/CSS/JS + JSON
Phase 4: API Design/Impl ──────→ Backend API + Zero Script QA
Phase 5: Design System ────────→ Build component system
Phase 6: UI Implementation ────→ Actual UI implementation and API integration
Phase 7: SEO/Security ─────────→ Search optimization and security hardening
Phase 8: Review ───────────────→ Architecture/convention quality verification
Phase 9: Deployment ───────────→ Production deployment
```

## Relationship with PDCA (Key Concept)

```
❌ Wrong understanding: Mapping entire Pipeline to PDCA
❌ (Plan=Phase1-3, Do=Phase4-6, Check=Phase7-8, Act=Phase9)

✅ Correct understanding: Run PDCA cycle within each Phase

Phase N
├── Plan: Plan what to do in this Phase
├── Design: Detailed design
├── Do: Execute/implement
├── Check: Verify/review
└── Act: Confirm and move to next Phase
```

## Phase Application by Level

| Phase | Starter | Dynamic | Enterprise |
|-------|---------|---------|------------|
| 1. Schema/Terms | Simple | Detailed | Detailed |
| 2. Convention | Basic | Extended | Extended |
| 3. Mockup | O | O | O |
| 4. API | - | bkend.ai | Direct impl |
| 5. Design System | Optional | O | O |
| 6. UI + API | Static UI | Integration | Integration |
| 7. SEO/Security | SEO only | O | O |
| 8. Review | - | O | O |
| 9. Deployment | Static hosting | Vercel etc. | K8s |

### Starter Level Flow
```
Phase 1 → 2 → 3 → 5(optional) → 6(static) → 7(SEO) → 9
```

### Dynamic Level Flow
```
Phase 1 → 2 → 3 → 4(bkend.ai) → 5 → 6 → 7 → 8 → 9
```

### Enterprise Level Flow
```
Phase 1 → 2 → 3 → 4(direct impl) → 5 → 6 → 7 → 8 → 9
```

## Phase Deliverables Summary

| Phase | Key Deliverables |
|-------|-----------------|
| 1 | `docs/01-plan/schema.md`, `terminology.md` |
| 2 | `CONVENTIONS.md`, `docs/01-plan/naming.md` |
| 3 | `mockup/` folder, `docs/02-design/mockup-spec.md` |
| 4 | `docs/02-design/api-spec.md`, `src/api/` |
| 5 | `components/ui/`, `docs/02-design/design-system.md` |
| 6 | `src/pages/`, `src/features/` |
| 7 | `docs/02-design/seo-spec.md`, `security-spec.md` |
| 8 | `docs/03-analysis/architecture-review.md` |
| 9 | `docs/04-report/deployment-report.md` |

## Related Skills

- `phase-1-schema/` ~ `phase-9-deployment/`: Detailed guides per Phase
- `pdca-methodology/`: How to apply PDCA
- `starter/`, `dynamic/`, `enterprise/`: Level-specific knowledge
