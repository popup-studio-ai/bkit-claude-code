---
name: bkit-templates
description: |
  PDCA document templates for consistent documentation.
  Plan, Design, Analysis, and Report templates with proper structure.

  Use proactively when generating PDCA documents to ensure consistent format.

  Triggers: template, plan document, design document, analysis document, report,
  템플릿, 계획서, 설계서, 분석서, 보고서, テンプレート, 計画書, 設計書, 模板, 计划书, 设计书,
  plantilla, documento de plan, documento de diseño, documento de análisis, informe,
  modèle, document de plan, document de conception, document d'analyse, rapport,
  Vorlage, Plandokument, Designdokument, Analysedokument, Bericht,
  modello, documento di piano, documento di progettazione, documento di analisi, rapporto

  Do NOT use for: code implementation, deployment, or non-documentation tasks.
---

# bkit Document Templates

> Use these templates when generating PDCA documents.

## Available Templates

| Template | Path | Purpose |
|----------|------|---------|
| Plan | `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md` | Feature planning |
| Design | `${CLAUDE_PLUGIN_ROOT}/templates/design.template.md` | Technical design |
| Analysis | `${CLAUDE_PLUGIN_ROOT}/templates/analysis.template.md` | Gap analysis |
| Report | `${CLAUDE_PLUGIN_ROOT}/templates/report.template.md` | Completion report |
| Index | `${CLAUDE_PLUGIN_ROOT}/templates/_INDEX.template.md` | Document index |
| CLAUDE | `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.template.md` | CLAUDE.md template |

## Template Usage

### Plan Template
For **P**lan phase - feature planning before design.

Key sections:
- Overview & Purpose
- Scope (In/Out)
- Requirements (Functional/Non-Functional)
- Success Criteria
- Risks & Mitigation

### Design Template
For **D**o phase - technical design before implementation.

Key sections:
- Architecture (diagrams, data flow)
- Data Model (entities, relationships)
- API Specification (endpoints, request/response)
- UI/UX Design (layouts, components)
- Error Handling
- Security Considerations
- Test Plan
- Implementation Guide

### Analysis Template
For **C**heck phase - gap analysis between design and implementation.

Key sections:
- Design vs Implementation comparison
- Missing features
- Inconsistencies
- Quality metrics
- Recommendations

### Report Template
For **A**ct phase - completion report and lessons learned.

Key sections:
- Summary of completed work
- Metrics (LOC, test coverage, etc.)
- Issues encountered
- Lessons learned
- Future improvements

## Document Output Paths

```
docs/
├── 01-plan/
│   └── features/
│       └── {feature}.plan.md
├── 02-design/
│   └── features/
│       └── {feature}.design.md
├── 03-analysis/
│   └── features/
│       └── {feature}.analysis.md
└── 04-report/
    └── features/
        └── {feature}.report.md
```

## Variable Substitution

Templates use `{variable}` syntax:
- `{feature}`: Feature name
- `{date}`: Creation date (YYYY-MM-DD)
- `{author}`: Document author

## Pipeline Templates

Additional templates for Development Pipeline phases:
- `${CLAUDE_PLUGIN_ROOT}/templates/pipeline/` directory

---

## Document Standards

### File Naming Rules

```
{number}_{english_name}.md      # 01_system_architecture.md
{number}-{english_name}.md      # 01-system-architecture.md
{feature}.{type}.md             # login.design.md
```

### Common Header

All documents should include:

```markdown
# {Document Title}

> **Summary**: {One-line description}
>
> **Author**: {Name}
> **Created**: {YYYY-MM-DD}
> **Last Modified**: {YYYY-MM-DD}
> **Status**: {Draft | Review | Approved | Deprecated}

---
```

### Version Control

Track changes within documents:

```markdown
## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-01 | Initial draft | Kay |
| 1.1 | 2024-12-05 | Added API spec | Kay |
```

### Cross-References

Link related documents:

```markdown
## Related Documents
- Plan: [login.plan.md](../01-plan/features/login.plan.md)
- Design: [login.design.md](../02-design/features/login.design.md)
- Analysis: [login.analysis.md](../03-analysis/features/login.analysis.md)
```

### Status Tracking

Use _INDEX.md in each folder:

| Status | Meaning | Claude Behavior |
|--------|---------|-----------------|
| ✅ Approved | Use as reference | Follow as-is |
| 🔄 In Progress | Being written | Notify of changes |
| ⏸️ On Hold | Temporarily paused | Request confirmation |
| ❌ Deprecated | No longer valid | Ignore |

### Conflict Resolution

- **Code vs Design mismatch**: Code is truth, suggest document update
- **Multiple versions**: Reference only the latest version
