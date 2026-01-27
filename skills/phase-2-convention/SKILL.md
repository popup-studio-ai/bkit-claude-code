---
name: phase-2-convention
description: |
  Skill for defining coding rules and conventions.
  Ensures consistent code style and specifies coding standards for AI collaboration.

  Use proactively when starting a new project or when coding standards are needed.

  Triggers: convention, coding style, naming rules, 컨벤션, コンベンション, 编码风格,
  convención, estilo de código, reglas de nombrado, convention, style de codage, règles de nommage,
  Konvention, Coding-Stil, Namensregeln, convenzione, stile di codice, regole di denominazione

  Do NOT use for: existing projects with established conventions, deployment, or testing.
agent: bkit:pipeline-guide
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
user-invocable: false
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-2-convention.template.md
  - ${PLUGIN_ROOT}/templates/shared/naming-conventions.md
next-skill: phase-3-mockup
pdca-phase: plan
task-template: "[Phase-2] {feature}"
---

# Phase 2: Coding Convention

> Define code writing rules

## Purpose

Maintain consistent code style. Especially important when collaborating with AI - clarify what style AI should use when writing code.

## What to Do in This Phase

1. **Naming Rules**: Variables, functions, files, folder names
2. **Code Style**: Indentation, quotes, semicolons, etc.
3. **Structure Rules**: Folder structure, file separation criteria
4. **Pattern Definition**: Frequently used code patterns

## Deliverables

```
Project Root/
├── CONVENTIONS.md          # Full conventions
└── docs/01-plan/
    ├── naming.md           # Naming rules
    └── structure.md        # Structure rules
```

## PDCA Application

- **Plan**: Identify necessary convention items
- **Design**: Design detailed rules
- **Do**: Write convention documents
- **Check**: Review consistency/practicality
- **Act**: Finalize and proceed to Phase 3

## Level-wise Application

| Level | Application Level |
|-------|------------------|
| Starter | Basic (essential rules only) |
| Dynamic | Extended (including API, state management) |
| Enterprise | Extended (per-service rules) |

## Core Convention Items

### Naming
- Components: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case or PascalCase

### Folder Structure
```
src/
├── components/     # Reusable components
├── features/       # Feature modules
├── hooks/          # Custom hooks
├── utils/          # Utilities
└── types/          # Type definitions
```

---

## Environment Variable Convention

### Why Define at Design Stage?

```
❌ Organizing env vars just before deployment
   → Missing variables, naming inconsistency, deployment delays

✅ Establish convention at design stage
   → Consistent naming, clear categorization, fast deployment
```

### Environment Variable Naming Rules

| Prefix | Purpose | Exposure Scope | Example |
|--------|---------|----------------|---------|
| `NEXT_PUBLIC_` | Client-exposed | Browser | `NEXT_PUBLIC_API_URL` |
| `DB_` | Database | Server only | `DB_HOST`, `DB_PASSWORD` |
| `API_` | External API keys | Server only | `API_STRIPE_SECRET` |
| `AUTH_` | Authentication | Server only | `AUTH_SECRET`, `AUTH_GOOGLE_ID` |
| `SMTP_` | Email service | Server only | `SMTP_HOST`, `SMTP_PASSWORD` |
| `STORAGE_` | File storage | Server only | `STORAGE_S3_BUCKET` |

```
⚠️ Security Principles
- Never expose anything except NEXT_PUBLIC_* to client
- API keys and passwords must be server-only variables
- Never commit sensitive info in .env files
```

### .env File Structure

```
Project Root/
├── .env.example        # Template (in Git, values empty)
├── .env.local          # Local development (Git ignored)
├── .env.development    # Development env defaults
├── .env.staging        # Staging env defaults
├── .env.production     # Production defaults (no sensitive info)
└── .env.test           # Test environment
```

### .env.example Template

```bash
# .env.example - This file is included in Git
# Set actual values in .env.local

# ===== App Settings =====
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ===== Database =====
DB_HOST=
DB_PORT=5432
DB_NAME=
DB_USER=
DB_PASSWORD=

# ===== Authentication =====
AUTH_SECRET=                    # openssl rand -base64 32
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

# ===== External Services =====
NEXT_PUBLIC_API_URL=
API_STRIPE_SECRET=
SMTP_HOST=
SMTP_USER=
SMTP_PASSWORD=
```

### Environment-wise Value Classification

| Variable Type | .env.example | .env.local | CI/CD Secrets |
|---------------|:------------:|:----------:|:-------------:|
| App URL | Template | Local value | Per-env value |
| API endpoints | Template | Local/dev | Per-env value |
| DB password | Empty | Local value | ✅ Secrets |
| API keys | Empty | Test key | ✅ Secrets |
| JWT Secret | Empty | Local value | ✅ Secrets |

### Environment Variable Validation

```typescript
// lib/env.ts - Validate env vars at app startup
import { z } from 'zod';

const envSchema = z.object({
  // Required
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32),

  // Optional (with defaults)
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),

  // Client-exposed
  NEXT_PUBLIC_APP_URL: z.string().url(),
});

// Validation and type inference
export const env = envSchema.parse(process.env);

// Type-safe usage
// env.DATABASE_URL  ← autocomplete supported
```

### Environment Variable Checklist

- [ ] **Naming Consistency**
  - [ ] Follow prefix rules (NEXT_PUBLIC_, DB_, API_, etc.)
  - [ ] Use UPPER_SNAKE_CASE

- [ ] **File Structure**
  - [ ] Create .env.example (template)
  - [ ] Register .env.local in .gitignore
  - [ ] Separate .env files per environment

- [ ] **Security**
  - [ ] Classify sensitive info
  - [ ] Verify client-exposed variables
  - [ ] Organize Secrets list (for Phase 9 deployment)

---

## Clean Architecture Principles

### Why Define at Design Stage?

```
Clean Architecture = Code resilient to change

❌ Developing without architecture
   → Spaghetti code, multiple file changes for each modification

✅ Define layers at design stage
   → Separation of concerns, easy testing, easy maintenance
```

### 4-Layer Architecture (Recommended)

```
src/
├── presentation/        # or app/, pages/
│   ├── components/      # UI components
│   ├── hooks/           # State management hooks
│   └── pages/           # Page components
│
├── application/         # or services/, features/
│   ├── use-cases/       # Business use cases
│   └── services/        # API service wrappers
│
├── domain/              # or types/, entities/
│   ├── entities/        # Domain entities
│   ├── types/           # Type definitions
│   └── constants/       # Domain constants
│
└── infrastructure/      # or lib/, api/
    ├── api/             # API clients
    ├── db/              # Database connections
    └── external/        # External services
```

### Layer Responsibilities and Rules

| Layer | Responsibility | Can Depend On | Cannot Depend On |
|-------|---------------|---------------|------------------|
| **Presentation** | UI rendering, user events | Application, Domain | Infrastructure directly |
| **Application** | Business logic orchestration | Domain, Infrastructure | Presentation |
| **Domain** | Core business rules, types | Nothing (independent) | All external layers |
| **Infrastructure** | External system connections | Domain | Application, Presentation |

### Dependency Rule

```typescript
// ❌ Bad: Presentation directly calls Infrastructure
// components/UserList.tsx
import { apiClient } from '@/lib/api/client';  // Direct import forbidden!

export function UserList() {
  const users = apiClient.get('/users');  // ❌
}

// ✅ Good: Presentation → Application → Infrastructure
// hooks/useUsers.ts
import { userService } from '@/services/user.service';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: userService.getList,  // ✅ Call through Service
  });
}

// components/UserList.tsx
import { useUsers } from '@/hooks/useUsers';

export function UserList() {
  const { data: users } = useUsers();  // ✅ Call through Hook
}
```

### File Import Rules

```typescript
// ===== Allowed import directions =====

// In presentation/:
import { User } from '@/domain/types';           // ✅ Domain OK
import { useUsers } from '@/hooks/useUsers';     // ✅ Same layer OK
import { userService } from '@/services/user';   // ✅ Application OK

// In application/:
import { User } from '@/domain/types';           // ✅ Domain OK
import { apiClient } from '@/lib/api/client';    // ✅ Infrastructure OK

// In domain/:
// Minimize external imports (pure types/logic only)

// In infrastructure/:
import { User } from '@/domain/types';           // ✅ Domain OK

// ===== Forbidden imports =====

// In domain/:
import { apiClient } from '@/lib/api/client';    // ❌ Infrastructure forbidden
import { Button } from '@/components/ui/button'; // ❌ Presentation forbidden

// In infrastructure/:
import { useUsers } from '@/hooks/useUsers';     // ❌ Presentation forbidden
```

### Level-wise Application

| Level | Architecture Application |
|-------|-------------------------|
| **Starter** | Simple structure (components, lib) |
| **Dynamic** | 3-4 layer separation (recommended structure) |
| **Enterprise** | Strict layer separation + DI container |

### Starter Level Folder Structure

```
src/
├── components/     # UI components
├── lib/            # Utilities, API
└── types/          # Type definitions
```

### Dynamic Level Folder Structure

```
src/
├── components/     # Presentation
│   └── ui/
├── features/       # Feature modules (Application + Presentation)
│   ├── auth/
│   └── product/
├── hooks/          # Presentation (state management)
├── services/       # Application
├── types/          # Domain
└── lib/            # Infrastructure
    └── api/
```

### Enterprise Level Folder Structure

```
src/
├── presentation/
│   ├── components/
│   ├── hooks/
│   └── pages/
├── application/
│   ├── use-cases/
│   └── services/
├── domain/
│   ├── entities/
│   └── types/
└── infrastructure/
    ├── api/
    └── db/
```

---

## Phase Connection

Conventions defined in this Phase are verified in later Phases:

| Definition (Phase 2) | Verification (Phase 8) |
|----------------------|------------------------|
| Naming rules | Naming consistency check |
| Folder structure | Structure consistency check |
| Environment variable convention | Env var naming check |
| Clean architecture principles | Dependency direction check |

---

## Template

See `templates/pipeline/phase-2-convention.template.md`

## Next Phase

Phase 3: Mockup Development → Rules are set, now rapid prototyping

---

## 6. Reusability Principles

### 6.1 Function Design

#### Creating Generic Functions
```typescript
// ❌ Handles only specific case
function formatUserName(user: User) {
  return `${user.firstName} ${user.lastName}`
}

// ✅ Generic
function formatFullName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`
}

// Usage
formatFullName(user.firstName, user.lastName)
formatFullName(author.first, author.last)
```

#### Parameter Generalization
```typescript
// ❌ Tied to specific type
function calculateOrderTotal(order: Order) {
  return order.items.reduce((sum, item) => sum + item.price, 0)
}

// ✅ Generalized with interface
interface HasPrice { price: number }
function calculateTotal<T extends HasPrice>(items: T[]) {
  return items.reduce((sum, item) => sum + item.price, 0)
}

// Can be used in various places
calculateTotal(order.items)
calculateTotal(cart.products)
calculateTotal(invoice.lineItems)
```

### 6.2 Component Design

#### Composable Components
```tsx
// ❌ Hardcoded structure
function UserCard({ user }: { user: User }) {
  return (
    <div className="card">
      <img src={user.avatar} />
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </div>
  )
}

// ✅ Composable
function Card({ children, className }: CardProps) {
  return <div className={cn("card", className)}>{children}</div>
}

function Avatar({ src, alt }: AvatarProps) {
  return <img src={src} alt={alt} className="avatar" />
}

// Use by combining
<Card>
  <Avatar src={user.avatar} alt={user.name} />
  <h3>{user.name}</h3>
  <p>{user.email}</p>
</Card>
```

#### Props Extensibility
```tsx
// ❌ Limited props
interface ButtonProps {
  label: string
  onClick: () => void
}

// ✅ Extend HTML attributes
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

// All button attributes available
<Button type="submit" disabled={isLoading}>
  Save
</Button>
```

### 6.3 Extraction Criteria

#### When to Extract as Function
```
1. Same logic used 2+ times
2. Logic is complex enough to need a name
3. Logic that needs testing
4. Can be used in other files
```

#### When to Extract as Component
```
1. Same UI pattern repeats
2. Has independent state
3. Is a reusable unit
4. JSX over 50 lines
```

---

## 7. Extensibility Principles

### 7.1 Configuration-Based Design

```typescript
// ❌ Listing conditionals
function getStatusColor(status: string) {
  if (status === 'active') return 'green'
  if (status === 'pending') return 'yellow'
  if (status === 'error') return 'red'
  return 'gray'
}

// ✅ Configuration object
const STATUS_CONFIG = {
  active: { color: 'green', label: 'Active' },
  pending: { color: 'yellow', label: 'Pending' },
  error: { color: 'red', label: 'Error' },
} as const

function getStatusConfig(status: keyof typeof STATUS_CONFIG) {
  return STATUS_CONFIG[status] ?? { color: 'gray', label: status }
}

// Adding new status = just add config
```

### 7.2 Strategy Pattern

```typescript
// ❌ Listing switch statements
function processPayment(method: string, amount: number) {
  switch (method) {
    case 'card':
      // Card payment logic
      break
    case 'bank':
      // Bank transfer logic
      break
  }
}

// ✅ Strategy pattern
interface PaymentStrategy {
  process(amount: number): Promise<Result>
}

const paymentStrategies: Record<string, PaymentStrategy> = {
  card: new CardPayment(),
  bank: new BankTransfer(),
}

function processPayment(method: string, amount: number) {
  const strategy = paymentStrategies[method]
  if (!strategy) throw new Error(`Unknown method: ${method}`)
  return strategy.process(amount)
}

// Adding new payment method = just add strategy
```

### 7.3 Plugin Structure

```typescript
// Extensible system
interface Plugin {
  name: string
  init(): void
  execute(data: unknown): unknown
}

class PluginManager {
  private plugins: Plugin[] = []

  register(plugin: Plugin) {
    this.plugins.push(plugin)
  }

  executeAll(data: unknown) {
    return this.plugins.reduce(
      (result, plugin) => plugin.execute(result),
      data
    )
  }
}

// New feature = add plugin
```

---

## 8. Duplication Prevention Checklist

### Before Writing Code
- [ ] Is there a similar function in utils/?
- [ ] Is there a similar component in components/?
- [ ] Is there a similar hook in hooks/?
- [ ] Did you search the entire project?

### After Writing Code
- [ ] Is the same code in 2+ places? → Extract
- [ ] Can this code be used elsewhere? → Move
- [ ] Are there hardcoded values? → Make constants
- [ ] Is it tied to a specific type? → Generalize
