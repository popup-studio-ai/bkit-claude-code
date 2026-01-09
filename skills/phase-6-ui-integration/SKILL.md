---
name: phase-6-ui-integration
description: |
  Skill for implementing actual UI and integrating with APIs.
  Covers frontend-backend integration, state management, and API client architecture.

  Triggers: UI implementation, API integration, state management, UI 구현, API連携, 状态管理
agent: pipeline-guide
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
---

# Phase 6: UI 구현 + API 연동

> 실제 UI 구현 및 API 연동

## 목적

디자인 시스템의 컴포넌트를 사용해 실제 화면을 구현하고, API와 연동합니다.

## 이 Phase에서 하는 것

1. **페이지 구현**: 각 화면 개발
2. **상태 관리**: 클라이언트 상태 처리
3. **API 연동**: 백엔드 API 호출
4. **에러 처리**: 로딩, 에러 상태 처리

## 산출물

```
src/
├── pages/              # 페이지 컴포넌트
│   ├── index.tsx
│   ├── login.tsx
│   └── ...
├── features/           # 기능별 컴포넌트
│   ├── auth/
│   ├── product/
│   └── ...
└── hooks/              # API 호출 훅
    ├── useAuth.ts
    └── useProducts.ts

docs/03-analysis/
└── ui-qa.md            # QA 결과
```

## PDCA 적용

- **Plan**: 구현할 화면/기능 정의
- **Design**: 컴포넌트 구조, 상태 관리 설계
- **Do**: UI 구현 + API 연동
- **Check**: Zero Script QA
- **Act**: 버그 수정 후 Phase 7로

## 레벨별 적용

| 레벨 | 적용 방식 |
|------|----------|
| Starter | 정적 UI만 (API 연동 없음) |
| Dynamic | 전체 연동 |
| Enterprise | 전체 연동 + 최적화 |

## API 클라이언트 아키텍처

### 왜 중앙화된 API 클라이언트가 필요한가?

| 문제 (흩어진 API 호출) | 해결 (중앙화된 클라이언트) |
|----------------------|-------------------------|
| 에러 처리 로직 중복 | 공통 에러 핸들러 |
| 인증 토큰 처리 분산 | 자동 토큰 주입 |
| 응답 형식 불일치 | 표준화된 응답 타입 |
| 엔드포인트 변경 시 다중 수정 | 한 곳에서 관리 |
| 테스트/모킹 어려움 | 쉬운 목(mock) 교체 |

### 3계층 API 클라이언트 구조

```
┌─────────────────────────────────────────────────────────┐
│                    UI Components                         │
│              (pages, features, hooks)                    │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│         (도메인별 API 호출 함수 모음)                      │
│    authService, productService, orderService, ...        │
├─────────────────────────────────────────────────────────┤
│                    API Client Layer                      │
│         (공통 설정, 인터셉터, 에러 핸들링)                  │
│              apiClient (axios/fetch wrapper)             │
└─────────────────────────────────────────────────────────┘
```

### 폴더 구조

```
src/
├── lib/
│   └── api/
│       ├── client.ts           # API 클라이언트 (axios/fetch 래퍼)
│       ├── interceptors.ts     # 요청/응답 인터셉터
│       └── error-handler.ts    # 에러 핸들링 로직
├── services/
│   ├── auth.service.ts         # 인증 관련 API
│   ├── product.service.ts      # 상품 관련 API
│   └── order.service.ts        # 주문 관련 API
├── types/
│   ├── api.types.ts            # 공통 API 타입
│   ├── auth.types.ts           # 인증 도메인 타입
│   └── product.types.ts        # 상품 도메인 타입
└── hooks/
    ├── useAuth.ts              # Service를 사용하는 훅
    └── useProducts.ts
```

---

## API Client 구현

### 1. 기본 API 클라이언트 (lib/api/client.ts)

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

    // URL 파라미터 처리
    const url = new URL(`${this.baseUrl}${endpoint}`);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    // 기본 헤더 설정
    const headers = new Headers(init.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    // 인증 토큰 자동 주입
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
      return new ApiError('NETWORK_ERROR', '네트워크 연결을 확인해주세요.', 0);
    }
    return new ApiError('UNKNOWN_ERROR', '알 수 없는 오류가 발생했습니다.', 0);
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  // HTTP 메서드 래퍼
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

### 2. 공통 타입 정의 (types/api.types.ts)

```typescript
// types/api.types.ts

// ===== 표준 API 응답 형식 (Phase 4와 일치) =====

/** 성공 응답 */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

/** 페이지네이션 응답 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** 에러 응답 */
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

// ===== 에러 클래스 =====

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

  /** 유효성 검사 에러인지 확인 */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR' && !!this.details;
  }

  /** 인증 에러인지 확인 */
  isAuthError(): boolean {
    return this.status === 401 || this.code === 'UNAUTHORIZED';
  }

  /** 권한 에러인지 확인 */
  isForbiddenError(): boolean {
    return this.status === 403 || this.code === 'FORBIDDEN';
  }

  /** 리소스 없음 에러인지 확인 */
  isNotFoundError(): boolean {
    return this.status === 404 || this.code === 'NOT_FOUND';
  }
}

// ===== 공통 에러 코드 =====

export const ERROR_CODES = {
  // 클라이언트 에러
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',

  // 서버 에러
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 네트워크 에러
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

---

## Service Layer 패턴

### 도메인별 서비스 분리

```typescript
// services/auth.service.ts
import { apiClient } from '@/lib/api/client';
import { User, LoginRequest, LoginResponse, SignupRequest } from '@/types/auth.types';

export const authService = {
  /** 로그인 */
  login(credentials: LoginRequest) {
    return apiClient.post<LoginResponse>('/auth/login', credentials);
  },

  /** 회원가입 */
  signup(data: SignupRequest) {
    return apiClient.post<User>('/auth/signup', data);
  },

  /** 로그아웃 */
  logout() {
    return apiClient.post<void>('/auth/logout');
  },

  /** 현재 사용자 정보 */
  getMe() {
    return apiClient.get<User>('/auth/me');
  },

  /** 토큰 갱신 */
  refreshToken() {
    return apiClient.post<LoginResponse>('/auth/refresh');
  },
};

// services/product.service.ts
import { apiClient } from '@/lib/api/client';
import { Product, ProductFilter, CreateProductRequest } from '@/types/product.types';
import { PaginatedResponse } from '@/types/api.types';

export const productService = {
  /** 상품 목록 조회 */
  getList(filter?: ProductFilter) {
    const params = filter ? {
      page: String(filter.page || 1),
      limit: String(filter.limit || 20),
      ...(filter.category && { category: filter.category }),
      ...(filter.search && { search: filter.search }),
    } : undefined;

    return apiClient.get<PaginatedResponse<Product>>('/products', params);
  },

  /** 상품 상세 조회 */
  getById(id: string) {
    return apiClient.get<Product>(`/products/${id}`);
  },

  /** 상품 생성 */
  create(data: CreateProductRequest) {
    return apiClient.post<Product>('/products', data);
  },

  /** 상품 수정 */
  update(id: string, data: Partial<CreateProductRequest>) {
    return apiClient.patch<Product>(`/products/${id}`, data);
  },

  /** 상품 삭제 */
  delete(id: string) {
    return apiClient.delete<void>(`/products/${id}`);
  },
};
```

---

## 에러 핸들링 패턴

### 글로벌 에러 핸들러

```typescript
// lib/api/error-handler.ts
import { ApiError, ERROR_CODES } from '@/types/api.types';
import { toast } from 'sonner'; // 또는 다른 토스트 라이브러리

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
      toast.error('알 수 없는 오류가 발생했습니다.');
    }
    return;
  }

  // 커스텀 메시지가 있으면 사용
  const message = customMessages[error.code] || error.message;

  // 에러 유형별 처리
  switch (error.code) {
    case ERROR_CODES.UNAUTHORIZED:
      if (redirectOnAuth && typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
      break;

    case ERROR_CODES.FORBIDDEN:
      if (showToast) toast.error('권한이 없습니다.');
      break;

    case ERROR_CODES.NOT_FOUND:
      if (showToast) toast.error('요청한 리소스를 찾을 수 없습니다.');
      break;

    case ERROR_CODES.VALIDATION_ERROR:
      // 유효성 검사 에러는 폼에서 처리
      break;

    case ERROR_CODES.NETWORK_ERROR:
      if (showToast) toast.error('네트워크 연결을 확인해주세요.');
      break;

    default:
      if (showToast) toast.error(message);
  }

  // 에러 로깅 (개발 환경)
  if (process.env.NODE_ENV === 'development') {
    console.error(`[API Error] ${error.code}:`, {
      message: error.message,
      status: error.status,
      details: error.details,
    });
  }
}
```

### 훅에서 에러 처리

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
    // 에러 시 자동 처리
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
      // 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error) => {
      handleApiError(error, {
        customMessages: {
          CONFLICT: '이미 존재하는 상품명입니다.',
        },
      });
    },
  });
}
```

---

## 클라이언트-서버 타입 공유

### 타입 일관성 유지 방법

```
방법 1: 공유 패키지 (Monorepo)
├── packages/
│   └── shared-types/       # 공통 타입
│       ├── api.types.ts
│       ├── auth.types.ts
│       └── product.types.ts
├── apps/
│   ├── web/                # 프론트엔드
│   └── api/                # 백엔드

방법 2: API 스펙에서 타입 자동 생성
├── openapi.yaml            # OpenAPI 스펙
└── scripts/
    └── generate-types.ts   # 타입 자동 생성 스크립트

방법 3: tRPC / GraphQL CodeGen
└── 스키마에서 타입 자동 추론
```

### 타입 정의 예시

```typescript
// types/auth.types.ts (클라이언트-서버 공유)

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

## API 연동 패턴

### 기본 패턴 (fetch)
```typescript
async function getProducts() {
  const response = await fetch('/api/products');
  if (!response.ok) throw new Error('Failed to fetch');
  return response.json();
}
```

### React Query 패턴
```typescript
function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });
}
```

### SWR 패턴
```typescript
function useProducts() {
  return useSWR('/api/products', fetcher);
}
```

## 상태 관리 가이드

```
서버 상태 (API 데이터) → React Query / SWR
클라이언트 상태 (UI 상태) → useState / useReducer
전역 상태 (인증 등) → Context / Zustand
폼 상태 → React Hook Form
```

## Zero Script QA 적용

```
UI 동작도 로그로 검증:

[UI] 로그인 버튼 클릭
[STATE] isLoading: true
[API] POST /api/auth/login
[RESPONSE] { token: "...", user: {...} }
[STATE] isLoading: false, isLoggedIn: true
[NAVIGATE] → /dashboard
[RESULT] ✅ 로그인 성공
```

---

## API 연동 체크리스트

### 아키텍처

- [ ] **API 클라이언트 계층 구축**
  - [ ] 중앙화된 API 클라이언트 (lib/api/client.ts)
  - [ ] 인증 토큰 자동 주입
  - [ ] 공통 헤더 설정

- [ ] **Service Layer 분리**
  - [ ] 도메인별 서비스 파일 (auth, product, order 등)
  - [ ] 각 서비스는 apiClient만 사용

- [ ] **타입 일관성**
  - [ ] 공통 API 타입 정의 (ApiResponse, ApiError)
  - [ ] 도메인별 타입 정의 (Request, Response)
  - [ ] 서버-클라이언트 타입 공유 방식 결정

### 에러 핸들링

- [ ] **에러 코드 표준화**
  - [ ] Phase 4 API 스펙과 일치하는 에러 코드
  - [ ] 에러 코드별 사용자 메시지 정의

- [ ] **글로벌 에러 핸들러**
  - [ ] 인증 에러 시 리다이렉트
  - [ ] 네트워크 에러 처리
  - [ ] 토스트 알림

- [ ] **폼 유효성 에러 처리**
  - [ ] 필드별 에러 메시지 표시
  - [ ] 서버 유효성 에러와 연동

### 코딩 컨벤션

- [ ] **API 호출 규칙**
  - [ ] 컴포넌트에서 직접 fetch 금지
  - [ ] 반드시 hooks → services → apiClient 순서
  - [ ] 동일 데이터 중복 호출 방지 (캐싱)

- [ ] **네이밍 규칙**
  - [ ] 서비스: `{domain}.service.ts`
  - [ ] 훅: `use{Domain}{Action}.ts`
  - [ ] 타입: `{domain}.types.ts`

---

## 템플릿

`templates/pipeline/phase-6-ui.template.md` 참조

## 다음 Phase

Phase 7: SEO/보안 → 기능이 완성됐으니 최적화와 보안 강화
