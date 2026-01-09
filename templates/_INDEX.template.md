---
template: index
version: 1.0
description: Folder document index template
variables:
  - folder: Folder name
  - phase: PDCA phase (Plan/Design/Check/Act)
---

# {folder} Index

> **PDCA Phase**: {phase}
> **Last Updated**: {date}

---

## Document List

| Document | Status | Last Modified | Owner | Description |
|----------|--------|---------------|-------|-------------|
| [example.md](./example.md) | ✅ Approved | YYYY-MM-DD | - | Description |

---

## Status Legend

| Status | Meaning | Description |
|--------|---------|-------------|
| ✅ Approved | Finalized | Review complete, reference baseline |
| 🔄 In Progress | Working | Currently being written |
| 👀 In Review | Pending Review | Awaiting review |
| ⏸️ On Hold | Paused | Temporarily stopped |
| ❌ Deprecated | Obsolete | No longer valid |

---

## PDCA Status

```
Current Phase: [{phase}] ← You are here

┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
│  Plan  │───▶│ Design │───▶│   Do   │───▶│ Check  │
│        │    │        │    │ (Impl) │    │(Analyze)│
└────────┘    └────────┘    └────────┘    └────────┘
                                               │
                                               ▼
                                         ┌────────┐
                                         │  Act   │
                                         │(Improve)│
                                         └────────┘
```

---

## Folder Structure

```
{folder}/
├── _INDEX.md          ← Current file
├── {category1}/
│   └── ...
└── {category2}/
    └── ...
```

---

## Related Links

| Phase | Folder | Description |
|-------|--------|-------------|
| Plan | [01-plan/](../01-plan/_INDEX.md) | Planning documents |
| Design | [02-design/](../02-design/_INDEX.md) | Design documents |
| Analysis | [03-analysis/](../03-analysis/_INDEX.md) | Analysis results |
| Report | [04-report/](../04-report/_INDEX.md) | Completion reports |

---

## Notes

{Additional notes or considerations about this folder}

---

## Update History

| Date | Changes |
|------|---------|
| {date} | Index created |
