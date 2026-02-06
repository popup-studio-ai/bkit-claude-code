---
template: design
version: 1.2
description: PDCA Design phase document template (between Plan and Do) with Clean Architecture and Convention support
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

## 1. Overview

### 1.1 Design Goals

{Technical goals this design aims to achieve}

### 1.2 Design Principles

- {Principle 1: e.g., Single Responsibility Principle}
- {Principle 2: e.g., Extensible architecture}
- {Principle 3}

---

## 2. Architecture

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

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool |
|------|--------|------|
| Unit Test | Business logic | Jest/Vitest |
| Integration Test | API endpoints | Supertest |
| E2E Test | User scenarios | Playwright |

### 8.2 Test Cases (Key)

- [ ] Happy path: {description}
- [ ] Error scenario: {description}
- [ ] Edge case: {description}

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

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
