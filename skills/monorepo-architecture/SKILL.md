---
name: monorepo-architecture
description: |
  Monorepo architecture patterns for AI context control.
  Covers structure design, shared modules, and CLAUDE.md hierarchy.

  Triggers: monorepo, context control, shared modules, 모노레포, モノレポ, 单仓库
agent: enterprise-expert
allowed-tools:
  - Read
  - Glob
  - Grep
  - Task
user-invocable: false
---

# Monorepo Architecture for AI Context Control

> Structure your codebase so AI can understand the entire system at once.
> Key insight: AI works best when all context is accessible in one repository.

---

## Why Monorepo for AI Collaboration

### Multi-repo Problems

```
Multi-repo:
├─ frontend-repo ──────┐
├─ backend-repo ───────┤  AI reads partially
├─ infra-repo ─────────┤  Context fragmented
└─ shared-repo ────────┘

Issues:
❌ AI cannot see full picture
❌ API contract drift between repos
❌ Inconsistent patterns across teams
❌ Complex cross-repo changes
```

### Monorepo Advantages

```
Mono-repo:
└─ project/
    ├─ frontend/ ──────┐
    ├─ services/ ──────┤  AI reads completely
    ├─ infra/ ─────────┤  Context unified
    └─ packages/ ──────┘

Benefits:
✅ AI understands full context
✅ Single source of truth for types
✅ Atomic commits across layers
✅ Consistent patterns enforced
```

---

## Recommended Structure

### Enterprise Level (MSA)

```
project/
├── CLAUDE.md                 # Project-wide context
│
├── frontend/                 # Turborepo monorepo
│   ├── CLAUDE.md            # Frontend conventions
│   ├── portal/              # Main app
│   ├── admin/               # Admin dashboard
│   └── packages/
│       ├── ui/              # Shared components
│       ├── api-client/      # Type-safe API client
│       ├── config/          # Shared config
│       └── editor/          # Rich text editor
│
├── services/                 # Backend microservices
│   ├── CLAUDE.md            # Backend conventions
│   ├── shared/              # Shared modules (CRITICAL)
│   │   ├── auth/           # JWT management
│   │   ├── database/       # ORM setup
│   │   ├── errors/         # Error codes
│   │   ├── schemas/        # Base schemas
│   │   └── logging/        # Structured logging
│   ├── auth/                # Auth service
│   ├── user/                # User service
│   ├── {business}/          # Business services
│   └── {support}/           # Support services
│
├── infra/                    # Infrastructure
│   ├── CLAUDE.md            # Infra conventions
│   ├── terraform/           # IaC modules
│   ├── k8s/                 # Kubernetes manifests
│   └── docker/              # Dockerfiles
│
├── docs/                     # Design documents
│   ├── 00-requirement/
│   ├── 01-development/
│   ├── 02-scenario/
│   └── 03-refactoring/
│
├── scripts/                  # Utility scripts
├── docker-compose.yml        # Local development
└── .github/workflows/        # CI/CD
```

### Dynamic Level (BaaS Fullstack)

```
project/
├── CLAUDE.md
├── app/                      # Next.js App Router
├── components/               # React components
├── lib/
│   └── bkend/               # BaaS client
├── hooks/                    # Custom hooks
├── docs/                     # Design docs
└── .mcp.json                 # BaaS config
```

### Starter Level (Static)

```
project/
├── CLAUDE.md
├── app/                      # Next.js App Router
├── components/               # Simple components
├── public/                   # Static assets
└── docs/                     # Simple docs
```

---

## CLAUDE.md Hierarchy

### Structure

```
project/
├── CLAUDE.md                 # L0: Project-wide (always read)
│
├── services/
│   ├── CLAUDE.md            # L1: All services
│   └── auth/
│       └── CLAUDE.md        # L2: Specific service (rare)
│
├── frontend/
│   └── CLAUDE.md            # L1: All frontend
│
└── infra/
    └── CLAUDE.md            # L1: All infrastructure
```

### Conflict Resolution

```
More specific CLAUDE.md takes precedence.

Example:
  Root says: "Use snake_case"
  services/ says: "Use camelCase for API responses"

  Result: services/ uses camelCase for responses
```

### CLAUDE.md Template

```markdown
# {Area} Conventions

## Overview
{Brief description of this area's responsibility}

## Directory Structure
```
{key folders and their purpose}
```

## Coding Standards

### Naming
- Files: {convention}
- Functions: {convention}
- Classes: {convention}

### Patterns
{common patterns used here}

## API Conventions (if applicable)
{request/response formats}

## Do's and Don'ts
✅ Do: {correct approach}
❌ Don't: {incorrect approach}

## Related Documents
- {link to relevant docs}
```

---

## Shared Module Design

### Why Shared Modules are Critical

```
Without shared/:
  Service A → Own auth logic
  Service B → Own auth logic (different)
  Service C → Own auth logic (another version)

  Result: Inconsistency, bugs, maintenance nightmare

With shared/:
  shared/ → Single auth logic
  Service A → uses shared/
  Service B → uses shared/
  Service C → uses shared/

  Result: Consistency, single source of truth
```

### Shared Module Structure

```python
services/shared/
├── __init__.py
│
├── auth/                     # Authentication
│   ├── __init__.py
│   ├── jwt.py               # Token create/verify
│   ├── dependencies.py      # FastAPI deps
│   └── models.py            # Auth models
│
├── database/                 # Database
│   ├── __init__.py
│   ├── session.py           # Async session
│   └── base.py              # Base model class
│
├── errors/                   # Errors
│   ├── __init__.py
│   ├── codes.py             # Error codes
│   ├── exceptions.py        # Custom exceptions
│   └── handlers.py          # Global handlers
│
├── schemas/                  # Schemas
│   ├── __init__.py
│   ├── response.py          # CamelCaseModel
│   ├── request.py           # CamelCaseRequestModel
│   └── pagination.py        # Page response
│
├── logging/                  # Logging
│   ├── __init__.py
│   └── structured.py        # JSON logging
│
└── utils/                    # Utilities
    ├── __init__.py
    └── helpers.py
```

### Using Shared Modules

```python
# In any service
from shared.auth import verify_token, get_current_user
from shared.database import get_db, Base
from shared.errors import NotFoundException, ErrorCodes
from shared.schemas import CamelCaseModel
from shared.logging import logger
```

---

## Service Layering Pattern

### Standard Service Structure

```
services/{service}/
├── app/
│   ├── api/
│   │   ├── deps.py           # Dependencies
│   │   └── v1/endpoints/
│   │       ├── __init__.py
│   │       ├── {resource}.py # REST endpoints
│   │       ├── internal.py   # Internal APIs
│   │       └── health.py     # Health check
│   │
│   ├── services/
│   │   └── {resource}_service.py
│   │
│   ├── domain/
│   │   ├── entities/
│   │   └── repositories/     # Interfaces
│   │
│   ├── infrastructure/
│   │   ├── database/models.py
│   │   └── repositories/     # Implementations
│   │
│   ├── schemas/
│   │   ├── request/
│   │   └── response/
│   │
│   ├── core/
│   │   └── config.py
│   │
│   └── main.py
│
├── pyproject.toml
├── Dockerfile
└── .env.example
```

### Layer Responsibilities

| Layer | Responsibility |
|-------|----------------|
| **api/** | HTTP handling, validation, routing |
| **services/** | Business logic orchestration |
| **domain/** | Business entities, repository interfaces |
| **infrastructure/** | Database models, external APIs |
| **schemas/** | Request/Response data shapes |

---

## Docker Compose Integration

### Service Naming Convention

```yaml
# Pattern: {layer}-{service}

services:
  # Data layer
  data-postgres:
  data-redis:
  data-opensearch:

  # Platform layer
  platform-gateway:

  # Core layer
  core-auth:
  core-user:

  # Business layer
  business-project:
  business-recipe:

  # Support layer
  support-media:
  support-search:

  # Realtime layer
  realtime-chat:

  # Frontend layer
  frontend-portal:
```

### Shared Module Mounting

```yaml
services:
  core-auth:
    volumes:
      - ./services/auth:/app
      - ./services/shared:/app/shared  # CRITICAL
```

---

## Single Source of Truth

### Priority Order

```
1st: Codebase (always current)
     ├─ services/shared/ → definitive patterns
     └─ Working code → how it actually works

2nd: CLAUDE.md files
     └─ Conventions and rules

3rd: docs/ documents (may be outdated)
     └─ Design intent, history

When in conflict: CODE WINS
```

### Reading Strategy for AI

```
When asked about a feature:
1. Read shared/ first → understand patterns
2. Read relevant service code → actual implementation
3. Reference CLAUDE.md → conventions
4. Check docs/ only if needed → design context
```

---

## Related Skills

- `ai-native-development` - Development methodology
- `enterprise` - MSA/K8s/Terraform patterns
- `development-pipeline` - 9-phase process
