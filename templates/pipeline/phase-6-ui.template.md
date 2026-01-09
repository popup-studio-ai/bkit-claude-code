# UI Implementation Specification

> Phase 6 Deliverable: Screen implementation and API integration

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. Page List

| Page | Route | File | Status |
|------|-------|------|--------|
| Home | `/` | `app/page.tsx` | ⬜ |
| Login | `/login` | `app/login/page.tsx` | ⬜ |
| | | | |

---

## 2. Page Details

### 2.1 {{PageName}}

**Route**: `{{path}}`
**File**: `{{file}}`

**Layout**:
```
┌─────────────────────────────────┐
│           Header                │
├─────────────────────────────────┤
│                                 │
│           Content               │
│                                 │
└─────────────────────────────────┘
```

**Components Used**:
- `Header`
- `Card`
- `Button`

**API Integration**:
| API | Purpose | Hook |
|-----|---------|------|
| GET /api/users | User list | `useUsers()` |

**State Management**:
- `isLoading`: Loading state
- `error`: Error state
- `data`: Data

---

## 3. Custom Hooks

### 3.1 useAuth
```typescript
function useAuth() {
  // Authentication state management
  return { user, login, logout, isLoading }
}
```

### 3.2 use{{Resource}}
```typescript
function use{{Resource}}() {
  // {{Resource}} CRUD
  return { data, isLoading, error, create, update, remove }
}
```

---

## 4. State Management Architecture

```
Server State: React Query / SWR
├── useQuery: Read operations
├── useMutation: Create/Update/Delete
└── Cache invalidation

Client State: useState / Zustand
├── UI state (modals, toggles, etc.)
└── Form state

Global State: Context / Zustand
├── Authentication info
└── Theme settings
```

---

## 5. API Client Architecture

### 5.1 3-Layer Structure
```
UI Components
     ↓
Service Layer (business logic)
     ↓
API Client Layer (HTTP communication)
```

### 5.2 API Client Configuration
```typescript
// lib/api/client.ts
class ApiClient {
  private baseUrl: string

  async request<T>(endpoint: string, config = {}): Promise<ApiResponse<T>> {
    const headers = new Headers(config.headers)
    headers.set('Content-Type', 'application/json')

    // Auto-inject token
    const token = this.getToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)

    // Execute request and handle errors
    // ...
  }
}

export const apiClient = new ApiClient()
```

### 5.3 Service Layer Pattern
```typescript
// services/{{resource}}Service.ts
export const {{resource}}Service = {
  getList(filter?: Filter) {
    return apiClient.get<PaginatedResponse<Item>>('/{{resources}}', params)
  },
  getById(id: string) {
    return apiClient.get<Item>(`/{{resources}}/${id}`)
  },
  create(data: CreateInput) {
    return apiClient.post<Item>('/{{resources}}', data)
  },
  update(id: string, data: UpdateInput) {
    return apiClient.put<Item>(`/{{resources}}/${id}`, data)
  },
  delete(id: string) {
    return apiClient.delete<void>(`/{{resources}}/${id}`)
  },
}
```

---

## 6. Error Handling

### 6.1 Error Type Definition
```typescript
// types/api.ts
interface ApiError {
  code: string
  message: string
  details?: Array<{ field: string; message: string }>
}

// Error code constants
const ERROR_CODES = {
  VALIDATION_ERROR: 'Please check your input',
  UNAUTHORIZED: 'Login required',
  FORBIDDEN: 'Permission denied',
  NOT_FOUND: 'Resource not found',
  INTERNAL_ERROR: 'Server error occurred',
} as const
```

### 6.2 Error Boundary
```typescript
<ErrorBoundary fallback={<ErrorPage />}>
  <App />
</ErrorBoundary>
```

### 6.3 API Error Handling
```typescript
// In custom hook
if (error) {
  const message = ERROR_CODES[error.code] || error.message
  return <Alert variant="destructive">{message}</Alert>
}
```

---

## 7. Client-Side Security

### 7.1 Security Checklist
- [ ] XSS prevention (escape user input)
- [ ] CSRF token included (in API requests)
- [ ] No sensitive info stored on client
- [ ] httpOnly cookies used (auth tokens)

### 7.2 Token Management
```typescript
// Recommended: httpOnly cookies (server-side setting)
// Fallback: localStorage (aware of XSS risk)
localStorage.setItem('auth_token', token)

// Prohibited: Storing passwords, card numbers, etc.
```

---

## 8. Validation Checklist

### 8.1 UI Implementation
- [ ] All pages implemented
- [ ] Responsive design applied
- [ ] Design system (Phase 5) followed

### 8.2 API Integration
- [ ] API client 3-layer structure applied
- [ ] Service layer separated
- [ ] API response format (Phase 4) followed

### 8.3 State Management
- [ ] Loading state handled
- [ ] Error state handled
- [ ] User-friendly error messages per error code

### 8.4 Security (Phase 7 prep)
- [ ] XSS prevention applied
- [ ] No sensitive data exposed

---

## 9. Next Steps

Proceed to Phase 7: SEO/Security
