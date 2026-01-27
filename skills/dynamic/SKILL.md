---
name: dynamic
description: |
  Fullstack development skill using bkend.ai BaaS platform.
  Covers authentication, data storage, API integration for dynamic web apps.

  Project initialization with "init dynamic" or "dynamic init".

  Use proactively when user needs login, database, or backend features without managing servers.

  Triggers: fullstack, BaaS, bkend, authentication, login feature, signup, database,
  web app, SaaS, MVP, init dynamic, dynamic init,
  풀스택, 인증, 로그인 기능, 회원가입, 데이터베이스, 웹앱,
  フルスタック, 認証, ログイン機能, データベース, 全栈, 身份验证, 登录功能,
  autenticación, inicio de sesión, registro, base de datos, fullstack, aplicación web,
  authentification, connexion, inscription, base de données, fullstack, application web,
  Authentifizierung, Anmeldung, Registrierung, Datenbank, Fullstack, Web-App,
  autenticazione, accesso, registrazione, database, fullstack, applicazione web

  Do NOT use for: static websites, Enterprise-grade systems requiring custom infrastructure.
argument-hint: "[init|guide|help]"
agent: bkit:bkend-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - mcp__bkend__*
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/design.template.md
next-skill: phase-1-schema
pdca-phase: plan
task-template: "[Init-Dynamic] {feature}"
---

# Intermediate (Dynamic) Skill

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization (/init-dynamic feature) | `/dynamic init my-saas` |
| `guide` | Display development guide | `/dynamic guide` |
| `help` | BaaS integration help | `/dynamic help` |

### init (Project Initialization)
1. Create Next.js + Tailwind project structure
2. Configure bkend.ai MCP (.mcp.json)
3. Create CLAUDE.md (Level: Dynamic specified)
4. Create docs/ folder structure
5. src/lib/bkend.ts client template
6. Initialize .bkit-memory.json

### guide (Development Guide)
- bkend.ai auth/data configuration guide
- Phase 1-9 full Pipeline guide
- API integration patterns

### help (BaaS Help)
- Explain bkend.ai basic concepts
- Auth, database, file storage usage
- MCP integration methods

## Target Audience

- Frontend developers
- Solo entrepreneurs
- Those who want to build fullstack services quickly

## Tech Stack

```
Frontend:
- React / Next.js 14+
- TypeScript
- Tailwind CSS
- TanStack Query (data fetching)
- Zustand (state management)

Backend (BaaS):
- bkend.ai
  - Auto REST API
  - MongoDB database
  - Built-in authentication (JWT)
  - Real-time features (WebSocket)

Deployment:
- Vercel (frontend)
- bkend.ai (backend)
```

### Language Tier Guidance (v1.3.0)

> **Recommended**: Tier 1-2 languages
>
> Dynamic level supports full-stack development with strong AI compatibility.

| Tier | Allowed | Reason |
|------|---------|--------|
| Tier 1 | ✅ Primary | Full AI support |
| Tier 2 | ✅ Yes | Mobile (Flutter/RN), Modern web (Vue, Astro) |
| Tier 3 | ⚠️ Limited | Platform-specific needs only |
| Tier 4 | ❌ No | Migration recommended |

**Mobile Development**:
- React Native (Tier 1 via TypeScript) - Recommended
- Flutter (Tier 2 via Dart) - Supported

## Project Structure

```
project/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth-related routes
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (main)/            # Main routes
│   │   │   ├── dashboard/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/             # UI components
│   │   ├── ui/                # Basic UI (Button, Input...)
│   │   └── features/          # Feature-specific components
│   │
│   ├── hooks/                  # Custom hooks
│   │   ├── useAuth.ts
│   │   └── useQuery.ts
│   │
│   ├── lib/                    # Utilities
│   │   ├── bkend.ts           # bkend.ai client
│   │   └── utils.ts
│   │
│   ├── stores/                 # State management (Zustand)
│   │   └── auth-store.ts
│   │
│   └── types/                  # TypeScript types
│       └── index.ts
│
├── docs/                       # PDCA documents
│   ├── 01-plan/
│   ├── 02-design/
│   │   ├── data-model.md      # Data model
│   │   └── api-spec.md        # API specification
│   ├── 03-analysis/
│   └── 04-report/
│
├── .mcp.json                   # bkend.ai MCP config
├── .env.local                  # Environment variables
├── package.json
└── README.md
```

## Core Patterns

### bkend.ai Client Setup

```typescript
// lib/bkend.ts
import { createClient } from '@bkend/client';

export const bkend = createClient({
  apiKey: process.env.NEXT_PUBLIC_BKEND_API_KEY!,
  projectId: process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
});
```

### Authentication Hook

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

### Data Fetching (TanStack Query)

```typescript
// List query
const { data, isLoading, error } = useQuery({
  queryKey: ['items', filters],
  queryFn: () => bkend.collection('items').find(filters),
});

// Single item query
const { data: item } = useQuery({
  queryKey: ['items', id],
  queryFn: () => bkend.collection('items').findById(id),
  enabled: !!id,
});

// Create/Update (Mutation)
const mutation = useMutation({
  mutationFn: (newItem) => bkend.collection('items').create(newItem),
  onSuccess: () => {
    queryClient.invalidateQueries(['items']);
  },
});
```

### Protected Route

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

## Data Model Design Principles

```typescript
// Base fields (auto-generated)
interface BaseDocument {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User reference
interface Post extends BaseDocument {
  userId: string;        // Author ID (reference)
  title: string;
  content: string;
  tags: string[];        // Array field
  metadata: {            // Embedded object
    viewCount: number;
    likeCount: number;
  };
}
```

## MCP Integration (.mcp.json)

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

## Limitations

```
❌ Complex backend logic (serverless function limits)
❌ Large-scale traffic (within BaaS limits)
❌ Custom infrastructure control
❌ Microservices architecture
```

## When to Upgrade

Move to **Enterprise Level** if you need:

```
→ "Traffic will increase significantly"
→ "I want to split into microservices"
→ "I need my own server/infrastructure"
→ "I need complex backend logic"
```

## Common Mistakes

| Mistake | Solution |
|---------|----------|
| CORS error | Register domain in bkend.ai console |
| 401 Unauthorized | Token expired, re-login or refresh token |
| Data not showing | Check collection name, query conditions |
| Type error | Sync TypeScript type definitions with schema |
