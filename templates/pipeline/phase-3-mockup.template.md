# Mockup Specification

> Phase 3 Deliverable: HTML/CSS/JS mockup definition

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. Mockup Scope

### 1.1 Screens to Implement
| Screen | File | Description | Priority |
|--------|------|-------------|----------|
| Home | `index.html` | Main page | High |
| | | | |

### 1.2 Mock Data
| Data | File | Description |
|------|------|-------------|
| Users | `data/users.json` | User list |
| | | |

---

## 2. Screen Details

### 2.1 {{PageName}}

**Path**: `mockup/pages/{{page}}.html`

**Layout**:
```
┌─────────────────────────────────┐
│           Header                │
├─────────────────────────────────┤
│                                 │
│           Content               │
│                                 │
├─────────────────────────────────┤
│           Footer                │
└─────────────────────────────────┘
```

**Key Features**:
- [ ] Feature 1
- [ ] Feature 2

**Interactions**:
- Button click → Show modal
- Form submit → Display result

---

## 3. Mock Data Structure

### 3.1 {{DataName}}

```json
// data/{{data}}.json
{
  "items": [
    {
      "id": "1",
      "name": "Sample",
      ...
    }
  ]
}
```

---

## 4. Folder Structure

```
mockup/
├── pages/
│   ├── index.html
│   └── ...
├── styles/
│   └── main.css
├── scripts/
│   └── app.js
└── data/
    └── *.json
```

---

## 5. Validation Checklist

- [ ] All main screens implemented
- [ ] Interactions are working
- [ ] Feature verification possible with mock data
- [ ] Responsive design considered

---

## 6. Next Steps

Proceed to Phase 4: API Design/Implementation (Starter skips to Phase 5)
