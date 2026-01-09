---
name: bkit-templates
description: |
  PDCA document templates for consistent documentation.
  Plan, Design, Analysis, and Report templates with proper structure.
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
