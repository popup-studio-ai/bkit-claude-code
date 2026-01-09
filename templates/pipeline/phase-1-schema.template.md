# Schema Definition

> Phase 1 Deliverable: Project data structure definition

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. Terminology Definition

| Term | Definition | Original Term | Notes |
|------|------------|---------------|-------|
| | | | |

---

## 2. Entity List

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| | | |

---

## 3. Entity Details

### 3.1 {{Entity1}}

**Description**:

**Attributes**:
| Attribute | Type | Required | Description |
|-----------|------|----------|-------------|
| id | string | Y | Unique identifier |
| | | | |

**Relationships**:
- 1:N → {{RelatedEntity}}

---

## 4. Entity Relationship Diagram

```
[Entity1] 1 ─── N [Entity2]
    │
    └── 1 ─── N [Entity3]
```

---

## 5. Validation Checklist

- [ ] All core entities defined
- [ ] Terms are clear and consistent
- [ ] Entity relationships are clear
- [ ] No missing attributes

---

## 6. Next Steps

Proceed to Phase 2: Coding Convention Definition
