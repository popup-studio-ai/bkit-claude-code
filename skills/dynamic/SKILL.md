---
name: dynamic
description: |
  Fullstack development skill using bkend.ai BaaS platform.
  Covers authentication, data storage, API integration for dynamic web apps.

  Triggers: fullstack, BaaS, bkend, authentication, 풀스택, 인증, フルスタック, 全栈
agent: bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - mcp__bkend__*
user-invocable: false
---

# 중급 (Dynamic) 스킬

## 대상

- 프론트엔드 개발자
- 1인 창업자
- 풀스택 서비스를 빠르게 만들고 싶은 분

## 기술 스택

```
Frontend:
- React / Next.js 14+
- TypeScript
- Tailwind CSS
- TanStack Query (데이터 페칭)
- Zustand (상태 관리)

Backend (BaaS):
- bkend.ai
  - 자동 REST API
  - MongoDB 데이터베이스
  - 내장 인증 (JWT)
  - 실시간 기능 (WebSocket)

Deployment:
- Vercel (프론트엔드)
- bkend.ai (백엔드)
```

## 프로젝트 구조

```
프로젝트/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 라우트
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # 메인 라우트
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/             # UI 컴포넌트
│   │   ├── ui/                # 기본 UI (Button, Input...)
│   │   └── features/          # 기능별 컴포넌트
│   │
│   ├── hooks/                  # 커스텀 훅
│   │   ├── useAuth.ts
│   │   └── useQuery.ts
│   │
│   ├── lib/                    # 유틸리티
│   │   ├── bkend.ts           # bkend.ai 클라이언트
│   │   └── utils.ts
│   │
│   ├── stores/                 # 상태 관리 (Zustand)
│   │   └── auth-store.ts
│   │
│   └── types/                  # TypeScript 타입
│       └── index.ts
│
├── docs/                       # PDCA 문서
│   ├── 01-plan/
│   ├── 02-design/
│   │   ├── data-model.md      # 데이터 모델
│   │   └── api-spec.md        # API 명세
│   ├── 03-analysis/
│   └── 04-report/
│
├── .mcp.json                   # bkend.ai MCP 설정
├── .env.local                  # 환경변수
├── package.json
└── README.md
```

## 핵심 패턴

### bkend.ai 클라이언트 설정

```typescript
// lib/bkend.ts
import { createClient } from '@bkend/client';

export const bkend = createClient({
  apiKey: process.env.NEXT_PUBLIC_BKEND_API_KEY!,
  projectId: process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
});
```

### 인증 훅

```typescript
// hooks/useAuth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { bkend } from '@/lib/bkend';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const { user, token } = await bkend.auth.login({ email, password });
        set({ user, isLoading: false });
      },

      logout: () => {
        bkend.auth.logout();
        set({ user: null });
      },
    }),
    { name: 'auth-storage' }
  )
);
```

### 데이터 페칭 (TanStack Query)

```typescript
// 목록 조회
const { data, isLoading, error } = useQuery({
  queryKey: ['items', filters],
  queryFn: () => bkend.collection('items').find(filters),
});

// 단일 조회
const { data: item } = useQuery({
  queryKey: ['items', id],
  queryFn: () => bkend.collection('items').findById(id),
  enabled: !!id,
});

// 생성/수정 (Mutation)
const mutation = useMutation({
  mutationFn: (newItem) => bkend.collection('items').create(newItem),
  onSuccess: () => {
    queryClient.invalidateQueries(['items']);
  },
});
```

### 보호된 라우트

```typescript
// components/ProtectedRoute.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { redirect } from 'next/navigation';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingSpinner />;
  if (!user) redirect('/login');

  return <>{children}</>;
}
```

## 데이터 모델 설계 원칙

```typescript
// 기본 필드 (자동 생성)
interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 사용자 참조
interface Post extends BaseDocument {
  userId: string;        // 작성자 ID (참조)
  title: string;
  content: string;
  tags: string[];        // 배열 필드
  metadata: {            // 임베딩된 객체
    viewCount: number;
    likeCount: number;
  };
}
```

## MCP 연동 (.mcp.json)

```json
{
  "mcpServers": {
    "bkend": {
      "command": "npx",
      "args": ["@bkend/mcp-server"],
      "env": {
        "BKEND_API_KEY": "${BKEND_API_KEY}",
        "BKEND_PROJECT_ID": "${BKEND_PROJECT_ID}"
      }
    }
  }
}
```

## 제한사항

```
❌ 복잡한 백엔드 로직 (서버리스 함수 제한)
❌ 대규모 트래픽 (BaaS 한도 내)
❌ 커스텀 인프라 제어
❌ 마이크로서비스 아키텍처
```

## 업그레이드 시점

다음이 필요하면 **Enterprise 레벨**로:

```
→ "트래픽이 많아질 것 같아요"
→ "마이크로서비스로 분리하고 싶어요"
→ "자체 서버/인프라가 필요해요"
→ "복잡한 백엔드 로직이 필요해요"
```

## 자주 하는 실수

| 실수 | 해결책 |
|------|--------|
| CORS 에러 | bkend.ai 콘솔에서 도메인 등록 |
| 401 Unauthorized | 토큰 만료, 재로그인 또는 토큰 갱신 |
| 데이터 안 보임 | 컬렉션 이름, 쿼리 조건 확인 |
| 타입 에러 | TypeScript 타입 정의와 스키마 동기화 |
