---
name: phase-6-ui-integration
description: |
  Skill for implementing actual UI and integrating with APIs.
  Covers frontend-backend integration, state management, and API client architecture.

  Use proactively when user needs to connect frontend with backend APIs.

  Triggers: UI implementation, API integration, state management, UI 구현, API連携, 状态管理,
  implementación UI, integración API, gestión de estado,
  implémentation UI, intégration API, gestion d'état,
  UI-Implementierung, API-Integration, Zustandsverwaltung,
  implementazione UI, integrazione API, gestione dello stato

  Do NOT use for: mockup creation, backend-only development, or design system setup.
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-6-ui.template.md
# hooks: Managed by hooks/hooks.json (unified-write-post.js, unified-stop.js) - GitHub #9354 workaround
agent: bkit:pipeline-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
next-skill: phase-7-seo-security
pdca-phase: do
task-template: "[Phase-6] {feature}"
---

# Phase 6: UI Implementation + API Integration

> Actual UI implementation and API integration

## Purpose

Implement actual screens using design system components and integrate with APIs.

## What to Do in This Phase

1. **Page Implementation**: Develop each screen
2. **State Management**: Handle client state
3. **API Integration**: Call backend APIs
4. **Error Handling**: Handle loading and error states

## Deliverables

```
src/
├── pages/              # Page components
│   ├── index.tsx
│   ├── login.tsx
│   └── ...
├── features/           # Feature-specific components
│   ├── auth/
│   ├── product/
│   └── ...
└── hooks/              # API call hooks
    ├── useAuth.ts
    └── useProducts.ts

docs/03-analysis/
└── ui-qa.md            # QA results
```

## PDCA Application

- **Plan**: Define screens/features to implement
- **Design**: Component structure, state management design
- **Do**: UI implementation + API integration
- **Check**: Zero Script QA
- **Act**: Fix bugs and proceed to Phase 7

## Level-wise Application

| Level | Application Method |
|-------|-------------------|
| Starter | Static UI only (no API integration) |
| Dynamic | Full integration |
| Enterprise | Full integration + optimization |

## API Client Architecture

### Why is a Centralized API Client Needed?

| Problem (Scattered API Calls) | Solution (Centralized Client) |
|------------------------------|------------------------------|
| Duplicate error handling logic | Common error handler |
| Distributed auth token handling | Automatic token injection |
| Inconsistent response formats | Standardized response types |
| Multiple changes when endpoint changes | Single point of management |
| Difficult testing/mocking | Easy mock replacement |

### 3-Layer API Client Structure

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│              (pages, features, hooks)                    │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│         (Domain-specific API call functions)             │
│    authService, productService, orderService, ...        │
├─────────────────────────────────────────────────────────┤
│                    API Client Layer                      │
│         (Common settings, interceptors, error handling)  │
│              apiClient (axios/fetch wrapper)             │
└─────────────────────────────────────────────────────────┘
```

### Folder Structure

```
src/
├── lib/
│   └── api/
│       ├── client.ts           # API client (axios/fetch wrapper)
│       ├── interceptors.ts     # Request/response interceptors
│       └── error-handler.ts    # Error handling logic
├── services/
│   ├── auth.service.ts         # Auth-related APIs
│   ├── product.service.ts      # Product-related APIs
│   └── order.service.ts        # Order-related APIs
├── types/
│   ├── api.types.ts            # Common API types
│   ├── auth.types.ts           # Auth domain types
│   └── product.types.ts        # Product domain types
└── hooks/
    ├── useAuth.ts              # Hooks using Service
    └── useProducts.ts
```

---

## API Client Implementation

### 1. Basic API Client (lib/api/client.ts)

```typescript
// lib/api/client.ts
import { ApiError, ApiResponse } from '@/types/api.types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

interface RequestConfig extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...init } = config;

    // URL parameter handling
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // Default header settings
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // Automatic auth token injection
    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const response = await fetch(url.toString(), {
        ...init,
        headers,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      throw this.handleNetworkError(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error?.code || 'UNKNOWN_ERROR',
        data.error?.message || 'An error occurred',
        response.status,
        data.error?.details
      );
    }

    return data as ApiResponse<T>;
  }

  private handleNetworkError(error: unknown): ApiError {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return new ApiError('NETWORK_ERROR', 'Please check your network connection.', 0);
    }
    return new ApiError('UNKNOWN_ERROR', 'An unknown error occurred.', 0);
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // HTTP method wrappers
  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(BASE_URL);
```

### 2. Common Type Definitions (types/api.types.ts)

```typescript
// types/api.types.ts

// ===== Standard API Response Format (matches Phase 4) =====

/** Success response */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/** Paginated response */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Error response */
export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{
      field: string;
      message: string;
    }>;
  };
}

// ===== Error Class =====

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Check if validation error */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' && !!this.details;
  }

  /** Check if auth error */
  isAuthError(): boolean {
    return this.status === 401 || this.code === 'UNAUTHORIZED';
  }

  /** Check if forbidden error */
  isForbiddenError(): boolean {
    return this.status === 403 || this.code === 'FORBIDDEN';
  }

  /** Check if not found error */
  isNotFoundError(): boolean {
    return this.status === 404 || this.code === 'NOT_FOUND';
  }
}

// ===== Common Error Codes =====

export const ERROR_CODES = {
  // Client errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // Server errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

---

## Service Layer Pattern

### Domain-specific Service Separation

```typescript
// services/auth.service.ts
import { apiClient } from '@/lib/api/client';
import { User, LoginRequest, LoginResponse, SignupRequest } from '@/types/auth.types';

export const authService = {
  /** Login */
  login(credentials: LoginRequest) {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  /** Signup */
  signup(data: SignupRequest) {
    return apiClient.post<User>('/auth/signup', data);
  },

  /** Logout */
  logout() {
    return apiClient.post<void>('/auth/logout');
  },

  /** Get current user info */
  getMe() {
    return apiClient.get<User>('/auth/me');
  },

  /** Refresh token */
  refreshToken() {
    return apiClient.post<LoginResponse>('/auth/refresh');
  },
};

// services/product.service.ts
import { apiClient } from '@/lib/api/client';
import { Product, ProductFilter, CreateProductRequest } from '@/types/product.types';
import { PaginatedResponse } from '@/types/api.types';

export const productService = {
  /** Get product list */
  getList(filter?: ProductFilter) {
    const params = filter ? {
      page: String(filter.page || 1),
      limit: String(filter.limit || 20),
      ...(filter.category && { category: filter.category }),
      ...(filter.search && { search: filter.search }),
    } : undefined;

    return apiClient.get<PaginatedResponse<Product>>('/products', params);
  },

  /** Get product details */
  getById(id: string) {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /** Create product */
  create(data: CreateProductRequest) {
    return apiClient.post<Product>('/products', data);
  },

  /** Update product */
  update(id: string, data: Partial<CreateProductRequest>) {
    return apiClient.patch<Product>(`/products/${id}`, data);
  },

  /** Delete product */
  delete(id: string) {
    return apiClient.delete<void>(`/products/${id}`);
  },
};
```

---

## Error Handling Pattern

### Global Error Handler

```typescript
// lib/api/error-handler.ts
import { ApiError, ERROR_CODES } from '@/types/api.types';
import { toast } from 'sonner'; // or another toast library

interface ErrorHandlerOptions {
  showToast?: boolean;
  redirectOnAuth?: boolean;
  customMessages?: Record<string, string>;
}

export function handleApiError(
  error: unknown,
  options: ErrorHandlerOptions = {}
): void {
  const { showToast = true, redirectOnAuth = true, customMessages = {} } = options;

  if (!(error instanceof ApiError)) {
    console.error('Unexpected error:', error);
    if (showToast) {
      toast.error('An unknown error occurred.');
    }
    return;
  }

  // Use custom message if available
  const message = customMessages[error.code] || error.message;

  // Handle by error type
  switch (error.code) {
    case ERROR_CODES.UNAUTHORIZED:
      if (redirectOnAuth && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      break;

    case ERROR_CODES.FORBIDDEN:
      if (showToast) toast.error('You do not have permission.');
      break;

    case ERROR_CODES.NOT_FOUND:
      if (showToast) toast.error('The requested resource was not found.');
      break;

    case ERROR_CODES.VALIDATION_ERROR:
      // Validation errors are handled by form
      break;

    case ERROR_CODES.NETWORK_ERROR:
      if (showToast) toast.error('Please check your network connection.');
      break;

    default:
      if (showToast) toast.error(message);
  }

  // Error logging (development environment)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error] ${error.code}:`, {
      message: error.message,
      status: error.status,
      details: error.details,
    });
  }
}
```

### Error Handling in Hooks

```typescript
// hooks/useProducts.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/product.service';
import { handleApiError } from '@/lib/api/error-handler';
import { ProductFilter } from '@/types/product.types';

export function useProducts(filter?: ProductFilter) {
  return useQuery({
    queryKey: ['products', filter],
    queryFn: () => productService.getList(filter),
    // Auto error handling
    throwOnError: false,
    meta: {
      errorHandler: (error: unknown) => handleApiError(error),
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productService.create,
    onSuccess: () => {
      // Invalidate cache
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      handleApiError(error, {
        customMessages: {
          CONFLICT: 'Product name already exists.',
        },
      });
    },
  });
}
```

---

## Client-Server Type Sharing

### Methods for Type Consistency

```
Method 1: Shared Package (Monorepo)
├── packages/
│   └── shared-types/       # Common types
│       ├── api.types.ts
│       ├── auth.types.ts
│       └── product.types.ts
├── apps/
│   ├── web/                # Frontend
│   └── api/                # Backend

Method 2: Auto-generate Types from API Spec
├── openapi.yaml            # OpenAPI spec
└── scripts/
    └── generate-types.ts   # Type auto-generation script

Method 3: tRPC / GraphQL CodeGen
└── Auto-infer types from schema
```

### Type Definition Example

```typescript
// types/auth.types.ts (client-server shared)

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresAt: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  termsAgreed: boolean;
}
```

---

## API Integration Patterns

### Basic Pattern (fetch)
```typescript
async function getProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}
```

### React Query Pattern
```typescript
function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
```

### SWR Pattern
```typescript
function useProducts() {
  return useSWR('/api/products', fetcher);
}
```

## State Management Guide

```
Server state (API data) → React Query / SWR
Client state (UI state) → useState / useReducer
Global state (auth, etc.) → Context / Zustand
Form state → React Hook Form
```

## Zero Script QA Application

```
Validate UI behavior with logs:

[UI] Login button clicked
[STATE] isLoading: true
[API] POST /api/auth/login
[RESPONSE] { token: "...", user: {...} }
[STATE] isLoading: false, isLoggedIn: true
[NAVIGATE] → /dashboard
[RESULT] ✅ Login successful
```

---

## API Integration Checklist

### Architecture

- [ ] **Build API client layer**
  - [ ] Centralized API client (lib/api/client.ts)
  - [ ] Automatic auth token injection
  - [ ] Common header settings

- [ ] **Service Layer separation**
  - [ ] Domain-specific service files (auth, product, order, etc.)
  - [ ] Each service uses only apiClient

- [ ] **Type consistency**
  - [ ] Common API type definitions (ApiResponse, ApiError)
  - [ ] Domain-specific type definitions (Request, Response)
  - [ ] Decide server-client type sharing method

### Error Handling

- [ ] **Error code standardization**
  - [ ] Error codes matching Phase 4 API spec
  - [ ] User messages defined per error code

- [ ] **Global error handler**
  - [ ] Redirect on auth error
  - [ ] Network error handling
  - [ ] Toast notifications

- [ ] **Form validation error handling**
  - [ ] Field-specific error message display
  - [ ] Integration with server validation errors

### Coding Conventions

- [ ] **API call rules**
  - [ ] No direct fetch in components
  - [ ] Must follow hooks → services → apiClient order
  - [ ] Prevent duplicate calls for same data (caching)

- [ ] **Naming rules**
  - [ ] Services: `{domain}.service.ts`
  - [ ] Hooks: `use{Domain}{Action}.ts`
  - [ ] Types: `{domain}.types.ts`

---

## Template

See `templates/pipeline/phase-6-ui.template.md`

## Next Phase

Phase 7: SEO/Security → Features are complete, now optimize and strengthen security
