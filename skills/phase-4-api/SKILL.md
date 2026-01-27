---
name: phase-4-api
description: |
  Skill for designing and implementing backend APIs.
  Includes Zero Script QA methodology for validating APIs without test scripts.

  Use proactively when user needs to design or implement backend APIs.

  Triggers: API design, REST API, backend, endpoint, API 설계, API設計, API设计,
  diseño de API, diseño API, diseño de backend, conception API, conception d'API, backend,
  API-Design, API-Entwurf, Backend, progettazione API, design API, backend

  Do NOT use for: frontend-only projects, static websites, or Starter level projects.
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-4-api.template.md
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
  - ${PLUGIN_ROOT}/templates/shared/error-handling-patterns.md
# hooks: Managed by hooks/hooks.json (unified-stop.js) - GitHub #9354 workaround
agent: bkit:qa-monitor
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
next-skill: phase-5-design-system
pdca-phase: do
task-template: "[Phase-4] {feature}"
---

# Phase 4: API Design/Implementation + Zero Script QA

> Backend API implementation and script-free QA

## Purpose

Implement backend APIs that can store and retrieve data. Validate with structured logs instead of test scripts.

## What to Do in This Phase

1. **API Design**: Define endpoints, requests/responses
2. **API Implementation**: Write actual backend code
3. **Zero Script QA**: Log-based validation

## Deliverables

```
docs/02-design/
└── api-spec.md             # API specification

src/api/                    # API implementation
├── routes/
├── controllers/
└── services/

docs/03-analysis/
└── api-qa.md               # QA results
```

## PDCA Application

- **Plan**: Define required API list
- **Design**: Design endpoints, requests/responses
- **Do**: Implement APIs
- **Check**: Validate with Zero Script QA
- **Act**: Fix bugs and proceed to Phase 5

## Level-wise Application

| Level | Application Method |
|-------|-------------------|
| Starter | Skip this Phase (no API) |
| Dynamic | Use bkend.ai BaaS |
| Enterprise | Implement APIs directly |

## What is Zero Script QA?

```
Instead of writing test scripts, validate with structured debug logs

[API] POST /api/users
[INPUT] { "email": "test@test.com", "name": "Test" }
[PROCESS] Email duplicate check → Passed
[PROCESS] Password hash → Complete
[PROCESS] DB save → Success
[OUTPUT] { "id": 1, "email": "test@test.com" }
[RESULT] ✅ Success

Advantages:
- Save test code writing time
- See actual behavior with your eyes
- Easy debugging
```

## RESTful API Principles

### What is REST?

**RE**presentational **S**tate **T**ransfer - an architecture style for designing web services.

### 6 Core Principles

| Principle | Description | Example |
|-----------|-------------|---------|
| **1. Client-Server** | Separation of concerns between client and server | UI ↔ Data storage separated |
| **2. Stateless** | Each request is independent, server doesn't store client state | Auth token included with each request |
| **3. Cacheable** | Responses must indicate if cacheable | `Cache-Control` header |
| **4. Uniform Interface** | Interact through consistent interface | Detailed below |
| **5. Layered System** | Allow layered system architecture | Load balancer, proxy |
| **6. Code on Demand** | (Optional) Server can send code to client | JavaScript delivery |

### Uniform Interface Details

The core of RESTful APIs is a **uniform interface**.

#### 1. Resource-Based URLs

```
✅ Good (nouns, plural)
GET    /users          # User list
GET    /users/123      # Specific user
POST   /users          # Create user
PUT    /users/123      # Update user
DELETE /users/123      # Delete user

❌ Bad (using verbs)
GET    /getUsers
POST   /createUser
POST   /deleteUser/123
```

#### 2. HTTP Method Meanings

| Method | Purpose | Idempotent | Safe |
|--------|---------|:----------:|:----:|
| `GET` | Read | ✅ | ✅ |
| `POST` | Create | ❌ | ❌ |
| `PUT` | Full update | ✅ | ❌ |
| `PATCH` | Partial update | ❌ | ❌ |
| `DELETE` | Delete | ✅ | ❌ |

> **Idempotent**: Same result even if requested multiple times
> **Safe**: Doesn't change server state

#### 3. HTTP Status Codes

```
2xx Success
├── 200 OK              # Success (read, update)
├── 201 Created         # Creation success
└── 204 No Content      # Success but no response body (delete)

4xx Client Error
├── 400 Bad Request     # Invalid request (validation failure)
├── 401 Unauthorized    # Authentication required
├── 403 Forbidden       # No permission
├── 404 Not Found       # Resource not found
└── 409 Conflict        # Conflict (duplicate, etc.)

5xx Server Error
├── 500 Internal Error  # Internal server error
└── 503 Service Unavailable  # Service unavailable
```

#### 4. Consistent Response Format

```json
// Success response
{
  "data": {
    "id": 123,
    "email": "user@example.com",
    "name": "John Doe"
  },
  "meta": {
    "timestamp": "2026-01-08T10:00:00Z"
  }
}

// Error response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Email format is invalid.",
    "details": [
      { "field": "email", "message": "Please enter a valid email" }
    ]
  }
}

// List response (pagination)
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### URL Design Rules

```
1. Use lowercase
   ✅ /users/123/orders
   ❌ /Users/123/Orders

2. Use hyphens (-), avoid underscores (_)
   ✅ /user-profiles
   ❌ /user_profiles

3. Express hierarchical relationships
   ✅ /users/123/orders/456

4. Filtering via query parameters
   ✅ /users?status=active&sort=created_at
   ❌ /users/active/sort/created_at

5. Version management
   ✅ /api/v1/users
   ✅ Header: Accept: application/vnd.api+json;version=1
```

### API Documentation Tools

| Tool | Features |
|------|----------|
| **OpenAPI (Swagger)** | Industry standard, auto documentation |
| **Postman** | Testing + documentation |
| **Insomnia** | Lightweight API client |

---

## API Design Checklist

- [ ] **RESTful Principles Compliance**
  - [ ] Resource-based URLs (nouns, plural)
  - [ ] Appropriate HTTP methods
  - [ ] Correct status codes
- [ ] Unified error response format
- [ ] Authentication/authorization method defined
- [ ] Pagination method defined
- [ ] Versioning method (optional)

## Templates

- `templates/pipeline/phase-4-api.template.md`
- `templates/pipeline/zero-script-qa.template.md`

## Next Phase

Phase 5: Design System → APIs are ready, now build UI components
