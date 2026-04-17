---
template: design-starter
version: 1.0
description: Simplified design document for Starter level projects
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
level: Starter
---

# {feature} Design

> **Created**: {date}

---

## Goal

{What this feature does in simple terms}

---

## Architecture Options (v1.7.0)

Pick one of three approaches before detailed design. Even Starter projects benefit from an explicit tradeoff decision.

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | Single HTML file, inline styles | Separate HTML/CSS/JS files | Componentized partials |
| **New Files** | {N} | {N} | {N} |
| **Complexity** | Low | Medium | Medium |
| **Maintainability** | Low | High | High |
| **Effort** | Low | Medium | Medium |
| **Recommendation** | Tiny one-pager | Portfolio/landing | **Default choice** |

**Selected**: {Option A/B/C} — **Rationale**: {why}

---

## How It Works

{Simple explanation of how the feature works}

```
User Action → What Happens → Result
```

---

## What We Need to Build

### Files to Create

| File | Purpose |
|------|---------|
| `pages/{feature}.html` | Main page |
| `css/{feature}.css` | Styles |
| `js/{feature}.js` | Interactivity |

### Layout

```
┌─────────────────────────────┐
│  Header                     │
├─────────────────────────────┤
│                             │
│  Main Content               │
│                             │
├─────────────────────────────┤
│  Footer                     │
└─────────────────────────────┘
```

---

## Completion Checklist

- [ ] Feature works as expected
- [ ] Looks good on desktop
- [ ] Looks good on mobile
- [ ] Tested in browser

---

## Notes

{Any important notes or things to remember}
