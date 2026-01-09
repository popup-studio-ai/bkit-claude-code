# Coding Conventions

> Phase 2 Deliverable: Code writing rules definition

**Project**: {{project_name}}
**Date**: {{date}}
**Version**: 1.0

---

## 1. Naming Conventions

### 1.1 Files/Folders
| Target | Rule | Example |
|--------|------|---------|
| Component files | PascalCase | `UserProfile.tsx` |
| Utility files | camelCase | `formatDate.ts` |
| Folders | kebab-case | `user-profile/` |
| Constant files | UPPER_SNAKE_CASE | `API_ENDPOINTS.ts` |

### 1.2 Code
| Target | Rule | Example |
|--------|------|---------|
| Components | PascalCase | `UserProfile` |
| Functions | camelCase | `getUserById` |
| Variables | camelCase | `userName` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Types/Interfaces | PascalCase | `UserProfile` |
| Enum | PascalCase | `UserRole` |

---

## 2. Folder Structure

```
src/
├── components/         # Reusable components
│   ├── ui/            # Basic UI components
│   └── common/        # Common components
├── features/          # Feature-based modules
│   └── {{feature}}/
│       ├── components/
│       ├── hooks/
│       └── types.ts
├── hooks/             # Common custom hooks
├── utils/             # Utility functions
├── types/             # Global type definitions
├── constants/         # Constants
└── styles/            # Global styles
```

---

## 3. Code Style

### 3.1 General
- Indentation: 2 spaces
- Quotes: Single quotes (')
- Semicolons: None

### 3.2 Functions
```typescript
// Preferred: Arrow functions
const handleClick = () => {
  // ...
}

// Components: function declaration
function UserProfile({ user }: Props) {
  return <div>{user.name}</div>
}
```

### 3.3 Import Order
```typescript
// 1. External libraries
import { useState } from 'react'

// 2. Internal modules (absolute paths)
import { Button } from '@/components/ui'

// 3. Relative paths
import { useUser } from './hooks'

// 4. Types
import type { User } from '@/types'

// 5. Styles
import './styles.css'
```

---

## 4. Component Rules

### 4.1 Structure
```typescript
// 1. Import
// 2. Type definition
// 3. Constants
// 4. Component
// 5. Export
```

### 4.2 Props
```typescript
interface Props {
  user: User
  onSelect?: (user: User) => void
}
```

---

## 5. Environment Variable Conventions

### 5.1 Naming Rules
| Prefix | Purpose | Exposure |
|--------|---------|----------|
| `NEXT_PUBLIC_` | Client-side accessible | Browser |
| `DB_` | Database | Server only |
| `API_` | External API keys | Server only |
| `AUTH_` | Authentication | Server only |

### 5.2 .env File Structure
```
project-root/
├── .env.example        # Template (included in Git)
├── .env.local          # Local development (Git ignored)
├── .env.development    # Development environment
├── .env.staging        # Staging environment
└── .env.production     # Production (no sensitive info)
```

### 5.3 Environment Variable List
| Variable | Purpose | Exposed | Secrets |
|----------|---------|:-------:|:-------:|
| `NEXT_PUBLIC_APP_URL` | App URL | ✅ | |
| `DATABASE_URL` | DB connection | | ✅ |
| `AUTH_SECRET` | Auth secret | | ✅ |
| | | | |

---

## 6. Clean Architecture

### 6.1 Layer Structure (Level: {{level}})

**Starter**:
```
src/
├── components/     # UI
├── lib/            # Utilities
└── types/          # Types
```

**Dynamic**:
```
src/
├── components/     # Presentation
├── features/       # Application + Presentation
├── services/       # Application
├── types/          # Domain
└── lib/api/        # Infrastructure
```

**Enterprise**:
```
src/
├── presentation/   # UI, hooks
├── application/    # services, use-cases
├── domain/         # entities, types
└── infrastructure/ # api, db
```

### 6.2 Dependency Rules
| Layer | Can Depend On | Cannot Depend On |
|-------|---------------|------------------|
| Presentation | Application, Domain | Infrastructure directly |
| Application | Domain, Infrastructure | Presentation |
| Domain | None (independent) | All external layers |
| Infrastructure | Domain | Presentation |

---

## 7. Validation Checklist

### Naming/Structure
- [ ] Naming rules are clear
- [ ] Folder structure is defined
- [ ] Code style is consistent
- [ ] Matches ESLint/Prettier config

### Environment Variables
- [ ] .env.example completed
- [ ] Environment variable naming rules followed
- [ ] Secrets list organized (for Phase 9 deployment)

### Architecture
- [ ] Layer structure decided (matching level)
- [ ] Dependency direction rules defined

---

## 8. Next Steps

Proceed to Phase 3: Mockup Development
