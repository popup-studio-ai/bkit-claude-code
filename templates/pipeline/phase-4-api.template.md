# API Design Specification

> Phase 4 Deliverable: API endpoint definition

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. API Overview

**Base URL**: `{{base_url}}`
**Authentication**: Bearer Token / Session

---

## 2. Common Standards

### 2.1 RESTful Principles
- URL: Resource-based (nouns, plural) - `/users`, `/products`
- HTTP Methods: GET(read), POST(create), PUT(full update), PATCH(partial update), DELETE(delete)
- Status Codes: 2xx(success), 4xx(client error), 5xx(server error)

### 2.2 Response Format (Standard)
```json
// Success Response
{
  "data": { ... },
  "meta": {
    "timestamp": "2026-01-08T10:00:00Z"
  }
}

// Error Response
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly message",
    "details": [
      { "field": "email", "message": "Please enter a valid email" }
    ]
  }
}

// Pagination Response
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

### 2.3 Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Validation failed |
| UNAUTHORIZED | 401 | Authentication required |
| FORBIDDEN | 403 | Permission denied |
| NOT_FOUND | 404 | Resource not found |
| CONFLICT | 409 | Conflict (duplicate, etc.) |
| INTERNAL_ERROR | 500 | Internal server error |

---

## 3. Endpoints

### 3.1 Authentication API

#### POST /api/auth/login
Login

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200 OK):
```json
{
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "name": "User"
    },
    "token": "jwt_token",
    "expiresAt": "2026-01-09T10:00:00Z"
  }
}
```

---

### 3.2 {{Resource}} API

#### GET /api/{{resources}}
List all

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | number | N | Page number (default: 1) |
| limit | number | N | Items per page (default: 20) |

**Response** (200 OK):
```json
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

#### GET /api/{{resources}}/:id
Get detail

#### POST /api/{{resources}}
Create

#### PUT /api/{{resources}}/:id
Update

#### DELETE /api/{{resources}}/:id
Delete

---

## 4. Validation Checklist

- [ ] All required endpoints defined
- [ ] Request/Response formats are clear
- [ ] Error handling is defined
- [ ] Authentication/Authorization policies are clear

---

## 5. Next Steps

Proceed to Phase 5: Design System
