---
template: design
version: 1.0
description: PDCA Design phase document template (between Plan and Do)
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
---

# {feature} Design Document

> **Summary**: {One-line description}
>
> **Author**: {author}
> **Date**: {date}
> **Status**: Draft
> **Planning Doc**: [{feature}.plan.md](../01-plan/features/{feature}.plan.md)

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

---

## 4. API Specification

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

## 9. Implementation Guide

### 9.1 File Structure

```
src/
├── features/{feature}/
│   ├── components/
│   ├── hooks/
│   ├── api/
│   └── types/
```

### 9.2 Implementation Order

1. [ ] Define data model
2. [ ] Implement API
3. [ ] Implement UI components
4. [ ] Integration and testing

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | {date} | Initial draft | {author} |
