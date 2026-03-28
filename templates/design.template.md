---
template: design
version: 1.3
description: PDCA Design phase document template with Context Anchor, Session Guide, and Clean Architecture support
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - project: Project name (from package.json or CLAUDE.md)
  - version: Project version (from package.json)
---

# {feature} Design Document

> **Summary**: {One-line description}
>
> **Project**: {project}
> **Version**: {version}
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Planning Doc**: [{feature}.plan.md](../01-plan/features/{feature}.plan.md)

### Pipeline References (if applicable)

| Phase | Document | Status |
|-------|----------|--------|
| Phase 1 | [Schema Definition](../01-plan/schema.md) | ✅/❌/N/A |
| Phase 2 | [Coding Conventions](../01-plan/conventions.md) | ✅/❌/N/A |
| Phase 3 | [Mockup](../02-design/mockup/{feature}.md) | ✅/❌/N/A |
| Phase 4 | [API Spec](../02-design/api/{feature}.md) | ✅/❌/N/A |

> **Note**: If Pipeline documents exist, reference them in the relevant sections below.

---

## Context Anchor

> Copied from Plan document. Ensures strategic context survives Design→Do handoff.

| Key | Value |
|-----|-------|
| **WHY** | {copied from Plan Context Anchor} |
| **WHO** | {copied from Plan Context Anchor} |
| **RISK** | {copied from Plan Context Anchor} |
| **SUCCESS** | {copied from Plan Context Anchor} |
| **SCOPE** | {copied from Plan Context Anchor} |

---

## Design Anchor (if Pencil MCP used)

> Locked design tokens from initial concept pages. Enforced on every new page.
> Capture with: `/design-anchor capture {feature}`
> File: `docs/02-design/styles/{feature}.design-anchor.md`

| Category | Tokens |
|----------|--------|
| **Colors** | primary: `{value}`, bg: `{value}`, text: `{value}` |
| **Typography** | {font-family}, sizes: {scale} |
| **Spacing** | {base-unit} grid, card: {value}, section: {value} |
| **Radius** | default: `{value}` |
| **Tone** | {design tone description} |
| **Layout** | {layout pattern description} |

> Remove this section if not using Pencil MCP for this feature.

---

## 1. Overview

### 1.1 Design Goals

{Technical goals this design aims to achieve}

### 1.2 Design Principles

- {Principle 1: e.g., Single Responsibility Principle}
- {Principle 2: e.g., Extensible architecture}
- {Principle 3}

---

## 2. Architecture Options (v1.7.0)

### 2.0 Architecture Comparison

Three architecture options are evaluated before detailed design. User selects one via Checkpoint 3.

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | Least change, max reuse | Best separation, most maintainable | Good boundaries, balanced |
| **New Files** | {N} | {N} | {N} |
| **Modified Files** | {N} | {N} | {N} |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low (coupled) | Low (clean) | Low (balanced) |
| **Recommendation** | Quick wins, hotfixes | Long-term projects | **Default choice** |

**Selected**: {Option A/B/C} — **Rationale**: {why this was chosen}

> The detailed design below follows the selected architecture option.

### 2.1 Component Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Server    │────▶│  Database   │
│  (Browser)  │     │   (API)     │     │ (Storage)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### BaaS Architecture (Dynamic Level)

```
Client (Next.js) -> bkend.ai Service API (REST) -> MongoDB
                 <-> MCP (schema management)
              Claude Code
```

### 2.2 Data Flow

```
User Input → Validation → Business Logic → Data Storage → Response
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| {Component A} | {Component B} | {Purpose} |

---

## 3. Data Model

### 3.1 Entity Definition

```typescript
// {Entity name}
interface {Entity} {
  id: string;           // Unique identifier
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last update timestamp
  // Additional fields...
}
```

### 3.2 Entity Relationships

```
[User] 1 ──── N [Post]
   │
   └── 1 ──── N [Comment]
```

### 3.3 Database Schema (if applicable)

```sql
CREATE TABLE {table_name} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### MongoDB Collection Schema (Dynamic Level - bkend.ai)

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| _id | ObjectId | auto | auto | System generated |
| createdBy | String | auto | - | Creator user ID |
| createdAt | Date | auto | - | Creation timestamp |
| updatedAt | Date | auto | - | Update timestamp |

---

## 4. API Specification

### BaaS API (Dynamic Level)

Dynamic level uses bkend.ai auto-generated REST API.
CRUD endpoints are auto-generated when tables are created (no separate API implementation needed).
Reference: MCP tool `4_howto_implement_data_crud`

### 4.1 Endpoint List

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | /api/{resource} | List all | Required |
| GET | /api/{resource}/:id | Get detail | Required |
| POST | /api/{resource} | Create | Required |
| PUT | /api/{resource}/:id | Update | Required |
| DELETE | /api/{resource}/:id | Delete | Required |

### 4.2 Detailed Specification

#### `POST /api/{resource}`

**Request:**
```json
{
  "field1": "string",
  "field2": "number"
}
```

**Response (201 Created):**
```json
{
  "id": "string",
  "field1": "string",
  "field2": "number",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Input validation failed
- `401 Unauthorized`: Authentication required
- `409 Conflict`: Duplicate data

---

## 5. UI/UX Design (if applicable)

### 5.1 Screen Layout

```
┌────────────────────────────────────┐
│  Header                            │
├────────────────────────────────────┤
│                                    │
│  Main Content Area                 │
│                                    │
├────────────────────────────────────┤
│  Footer                            │
└────────────────────────────────────┘
```

### 5.2 User Flow

```
Home → Login → Dashboard → Use Feature → View Results
```

### 5.3 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| {ComponentA} | src/components/ | {Role} |

### 5.4 Page UI Checklist (v2.1.0)

> **CRITICAL**: List EVERY required UI element per page. Gap Detector verifies each item.
> Without this checklist, gap analysis only checks file existence (structural), not content (functional).
>
> **How to fill**: For each page, list all interactive elements (forms, buttons, filters, dropdowns,
> badges, toggles) and data display elements (cards, lists, scores, charts) that MUST be present.
> Include specific field names, option values, and data types.

#### {Page Name 1}

- [ ] {Element type}: {Description} ({specific details: options, fields, values})
- [ ] {Element type}: {Description}

#### {Page Name 2}

- [ ] {Element type}: {Description}

> **Example** (remove in actual document):
> #### Search Page
> - [ ] Filter: Property Type dropdown (6 options: Officetel, Apartment, House, Share House, Serviced Apt, Hotel)
> - [ ] Filter: Price range slider (weekly rent, min/max KRW inputs)
> - [ ] Filter: ARC Registration Available checkbox
> - [ ] Filter: Pet Allowed checkbox
> - [ ] Button: Save Search
> - [ ] Card: Weekly rent display (₩{amount}/week)
> - [ ] Card: Area display ({N}평)
> - [ ] Card: ARC badge (green, conditional)
> - [ ] Card: Pet badge (conditional)
> - [ ] Toggle: List / Map view
> - [ ] Sort: Recommended, Price ASC, Price DESC, Newest

---

## 6. Error Handling

### 6.1 Error Code Definition

| Code | Message | Cause | Handling |
|------|---------|-------|----------|
| 400 | Invalid input | Input error | Request re-entry from client |
| 401 | Unauthorized | Auth failure | Redirect to login page |
| 404 | Not found | Resource missing | Show 404 page |
| 500 | Internal error | Server error | Log error and notify user |

### 6.2 Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": {}
  }
}
```

---

## 7. Security Considerations

- [ ] Input validation (XSS, SQL Injection prevention)
- [ ] Authentication/Authorization handling
- [ ] Sensitive data encryption
- [ ] HTTPS enforcement
- [ ] Rate Limiting

---

## 8. Test Plan (v2.3.0)

> **CRITICAL**: Define WHAT to test here. Test CODE is written during Do phase alongside implementation.
> Do phase rule: code + test = 1 set. No module is "done" without its tests passing.
> Check phase: runs all tests, doesn't create new ones.

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| L1: API Tests | Endpoints — status, params, response shape | curl / Playwright request | Do |
| L2: UI Action Tests | Page elements — forms, buttons, data display | Playwright | Do |
| L3: E2E Scenario Tests | User journeys — multi-page flows | Playwright | Do |

### 8.2 L1: API Test Scenarios

> Define expected behavior for each endpoint. Do phase writes the actual test code.

| # | Endpoint | Method | Test Description | Expected Status | Expected Response |
|---|----------|--------|-----------------|:--------------:|-------------------|
| 1 | /api/{resource} | GET | Returns list with data | 200 | `.data` is array, `.pagination.total` > 0 |
| 2 | /api/{resource}/:id | GET | Returns detail with relations | 200 | `.data.id` exists, nested relations loaded |
| 3 | /api/{resource} | POST | Creates with valid data | 201 | `.data.id` exists |
| 4 | /api/{resource} | POST | Rejects invalid data | 400 | `.error.code` = "VALIDATION_ERROR", `.error.details.fieldErrors` present |
| 5 | /api/{protected} | GET | Blocks unauthenticated | 401 | `.error.code` = "UNAUTHORIZED" |
| 6 | /api/{resource}?filter=X | GET | Filter reduces results | 200 | `filtered.data.length` < `all.data.length` |

### 8.3 L2: UI Action Test Scenarios

> Define per-page: what action → what result. Reference §5.4 Page UI Checklist.

| # | Page | Action | Expected Result | Data Verification |
|---|------|--------|----------------|-------------------|
| 1 | {page} | Load page | All §5.4 checklist elements visible | DB data renders (not skeleton) |
| 2 | {page} | Click filter | Results change | Count decreases |
| 3 | {page} | Submit form | Success state shown | API returns 201 |
| 4 | {page} | Invalid submit | Error message shown | Validation errors display |

### 8.4 L3: E2E Scenario Test Scenarios

> Define complete user journeys. Each scenario chains multiple pages.

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | Guest browsing | Home → Search(data>0) → Filter → Detail(title+host+price) | All data renders from DB |
| 2 | Auth flow | Register → Login → Access protected page | No 401 errors |
| 3 | Form submission | Navigate → Fill all fields → Submit → Verify success | Confirmation UI shown |
| 4 | i18n | Switch language → Verify text changes | UI text matches locale |
| 5 | Error handling | Wrong credentials → Error shown, Invalid form → Validation shown | User gets feedback |

### 8.5 Seed Data Requirements

> Tests need data. Define minimum seed data for tests to be meaningful.

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| {entity} | {N} | {fields that must have values} |

> Do phase: implement `src/lib/db/seed.ts` before writing tests.
> Check phase: run seed before test execution.

---

## 9. Clean Architecture

> Reference: `docs/01-plan/conventions.md` or Phase 2 Pipeline output

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | UI components, hooks, pages | `src/components/`, `src/hooks/`, `src/app/` |
| **Application** | Use cases, services, business logic orchestration | `src/services/`, `src/features/*/hooks/` |
| **Domain** | Entities, types, core business rules | `src/types/`, `src/domain/` |
| **Infrastructure** | API clients, DB, external services | `src/lib/`, `src/api/` |

### 9.2 Dependency Rules

```
┌─────────────────────────────────────────────────────────────┐
│                    Dependency Direction                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   Presentation ──→ Application ──→ Domain ←── Infrastructure│
│                          │                                  │
│                          └──→ Infrastructure                │
│                                                             │
│   Rule: Inner layers MUST NOT depend on outer layers        │
│         Domain is independent (no external dependencies)    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.3 File Import Rules

| From | Can Import | Cannot Import |
|------|-----------|---------------|
| Presentation | Application, Domain | Infrastructure directly |
| Application | Domain, Infrastructure | Presentation |
| Domain | Nothing external (pure types/logic) | All external layers |
| Infrastructure | Domain only | Application, Presentation |

### 9.4 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| {ComponentA} | Presentation | `src/components/{feature}/` |
| {ServiceA} | Application | `src/services/{feature}.ts` |
| {TypeA} | Domain | `src/types/{feature}.ts` |
| {ApiClient} | Infrastructure | `src/lib/api/{feature}.ts` |

---

## 10. Coding Convention Reference

> Reference: `docs/01-plan/conventions.md` or Phase 2 Pipeline output

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `UserProfile`, `LoginForm` |
| Functions | camelCase | `getUserById()`, `handleSubmit()` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT`, `API_BASE_URL` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Files (component) | PascalCase.tsx | `UserProfile.tsx` |
| Files (utility) | camelCase.ts | `formatDate.ts` |
| Folders | kebab-case | `user-profile/`, `auth-provider/` |

### 10.2 Import Order

```typescript
// 1. External libraries
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'

// 2. Internal absolute imports
import { Button } from '@/components/ui'
import { userService } from '@/services/user'

// 3. Relative imports
import { useLocalState } from './hooks'

// 4. Type imports
import type { User } from '@/types'

// 5. Styles
import './styles.css'
```

### 10.3 Environment Variables

| Prefix | Purpose | Scope | Example |
|--------|---------|-------|---------|
| `NEXT_PUBLIC_` | Client-side accessible | Browser | `NEXT_PUBLIC_API_URL` |
| `DB_` | Database connections | Server only | `DB_HOST`, `DB_PASSWORD` |
| `API_` | External API keys | Server only | `API_STRIPE_SECRET` |
| `AUTH_` | Authentication secrets | Server only | `AUTH_SECRET`, `AUTH_GOOGLE_ID` |

### 10.4 This Feature's Conventions

| Item | Convention Applied |
|------|-------------------|
| Component naming | {convention used} |
| File organization | {convention used} |
| State management | {convention used} |
| Error handling | {convention used} |

---

## 11. Implementation Guide

### 11.1 File Structure

```
src/
├── features/{feature}/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
```

### 11.2 Implementation Order

1. [ ] Define data model
2. [ ] Implement API
3. [ ] Implement UI components
4. [ ] Integration and testing

### 11.3 Session Guide

> Auto-generated from Design structure. Session split is recommended, not required.
> Use `/pdca do {feature} --scope module-N` to implement one module per session.

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| {module name} | `module-1` | {description} | {turns} |
| {module name} | `module-2` | {description} | {turns} |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 | 30-35 |
| Session 2 | Do | `--scope module-1` | 40-50 |
| Session 3 | Do | `--scope module-2` | 40-50 |
| Session 4 | Check + Report | 전체 | 30-40 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
