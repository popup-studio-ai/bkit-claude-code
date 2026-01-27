---
name: enterprise
description: |
  Enterprise-grade system development with microservices, Kubernetes, and Terraform.
  Includes AI Native methodology and Monorepo architecture patterns.
  Handles high traffic, high availability, and complex architecture requirements.

  Project initialization with "init enterprise" or "enterprise init".

  Use proactively when user needs high traffic, microservices, custom infrastructure,
  or AI-native development patterns.

  Triggers: microservices, kubernetes, terraform, k8s, AWS, monorepo, AI native, 10-day,
  init enterprise, enterprise init,
  마이크로서비스, 모노레포, マイクロサービス, モノレポ, 微服务, 单仓库,
  microservicios, estrategia empresarial, arquitectura, CTO, nativo de IA,
  microservices, stratégie d'entreprise, architecture, CTO, natif IA,
  Microservices, Unternehmensstrategie, Architektur, CTO, KI-nativ,
  microservizi, strategia aziendale, architettura, CTO, AI nativo

  Do NOT use for: simple websites, MVPs, or projects without infrastructure requirements.
argument-hint: "[init|guide|help]"
agents:
  default: bkit:enterprise-expert
  infra: bkit:infra-architect
  architecture: bkit:enterprise-expert
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - WebSearch
user-invocable: true
imports:
  - ${PLUGIN_ROOT}/templates/design-enterprise.template.md
next-skill: phase-1-schema
pdca-phase: plan
task-template: "[Init-Enterprise] {feature}"
---

# Advanced (Enterprise) Skill

## Actions

| Action | Description | Example |
|--------|-------------|---------|
| `init` | Project initialization (/init-enterprise feature) | `/enterprise init my-platform` |
| `guide` | Display development guide | `/enterprise guide` |
| `help` | MSA/Infrastructure help | `/enterprise help` |

### init (Project Initialization)
1. Create Turborepo monorepo structure
2. apps/, packages/, services/, infra/ folder structure
3. Create CLAUDE.md (Level: Enterprise specified)
4. docs/ 5-category structure
5. infra/terraform/, infra/k8s/ base templates
6. Initialize .bkit-memory.json

### guide (Development Guide)
- AI Native 10-Day development cycle
- Microservices architecture patterns
- Phase 1-9 full Pipeline (Enterprise version)

### help (Infrastructure Help)
- Kubernetes basic concepts
- Terraform IaC patterns
- AWS EKS, RDS configuration guide

## Target Audience

- Senior developers
- CTOs / Architects
- Large-scale system operators

## Tech Stack

```
Frontend:
- Next.js 14+ (Turborepo monorepo)
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand

Backend:
- Python FastAPI (microservices)
- PostgreSQL (schema separation)
- Redis (cache, Pub/Sub)
- RabbitMQ / SQS (message queue)

Infrastructure:
- AWS (EKS, RDS, S3, CloudFront)
- Kubernetes (Kustomize)
- Terraform (IaC)
- ArgoCD (GitOps)

CI/CD:
- GitHub Actions
- Docker
```

### Language Tier Guidance (v1.3.0)

> **Supported**: All Tiers
>
> Enterprise level handles complex requirements including legacy system integration.

| Tier | Usage | Guidance |
|------|-------|----------|
| Tier 1 | Primary services | New development, core features |
| Tier 2 | System/Cloud | Go (K8s), Rust (performance critical) |
| Tier 3 | Platform native | iOS (Swift), Android (Kotlin), legacy Java |
| Tier 4 | Legacy integration | Migration plan required |

**Migration Path**:
- PHP → TypeScript (Next.js API routes)
- Ruby → Python (FastAPI)
- Java → Kotlin or Go

## Project Structure

```
project/
├── apps/                        # Frontend apps (Turborepo)
│   ├── web/                    # Main web app
│   ├── admin/                  # Admin
│   └── docs/                   # Documentation site
│
├── packages/                    # Shared packages
│   ├── ui/                     # UI components
│   ├── api-client/             # API client
│   └── config/                 # Shared config
│
├── services/                    # Backend microservices
│   ├── auth/                   # Auth service
│   ├── user/                   # User service
│   ├── {domain}/               # Domain-specific services
│   └── shared/                 # Shared modules
│
├── infra/                       # Infrastructure code
│   ├── terraform/
│   │   ├── modules/            # Reusable modules
│   │   └── environments/       # Environment-specific config
│   └── k8s/
│       ├── base/               # Common manifests
│       └── overlays/           # Environment-specific patches
│
├── docs/                        # PDCA documents
│   ├── 00-requirement/
│   ├── 01-development/         # Design documents (multiple)
│   ├── 02-scenario/
│   ├── 03-refactoring/
│   └── 04-operation/
│
├── scripts/                     # Utility scripts
├── .github/workflows/           # CI/CD
├── docker-compose.yml
├── turbo.json
└── pnpm-workspace.yaml
```

## Clean Architecture (4-Layer)

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  - FastAPI routers                                       │
│  - Request/Response DTOs                                 │
│  - Auth/authz middleware                                 │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  - Service classes                                       │
│  - Use Case implementation                               │
│  - Transaction management                                │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│  - Entity classes (pure Python)                          │
│  - Repository interfaces (ABC)                           │
│  - Business rules                                        │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│  - Repository implementations (SQLAlchemy)               │
│  - External API clients                                  │
│  - Cache, messaging                                      │
└─────────────────────────────────────────────────────────┘

Dependency direction: Top → Bottom
Domain Layer depends on nothing
```

## Core Patterns

### Repository Pattern

```python
# domain/repositories/user_repository.py (interface)
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, id: str) -> User | None:
        pass

    @abstractmethod
    async def save(self, user: User) -> User:
        pass

# infrastructure/repositories/user_repository_impl.py (implementation)
class UserRepositoryImpl(UserRepository):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, id: str) -> User | None:
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == id)
        )
        return result.scalar_one_or_none()
```

### Inter-service Communication

```python
# Synchronous (Internal API)
async def get_user_info(user_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{USER_SERVICE_URL}/internal/users/{user_id}",
            headers={"X-Internal-Token": INTERNAL_TOKEN}
        )
        return response.json()

# Asynchronous (message queue)
await message_queue.publish(
    topic="user.created",
    message={"user_id": user.id, "email": user.email}
)
```

### Terraform Module

```hcl
# modules/eks/main.tf
resource "aws_eks_cluster" "this" {
  name     = "${var.environment}-${var.project_name}-eks"
  role_arn = aws_iam_role.cluster.arn
  version  = var.kubernetes_version

  vpc_config {
    subnet_ids = var.subnet_ids
  }

  tags = merge(var.tags, {
    Environment = var.environment
  })
}
```

### Kubernetes Deployment

```yaml
# k8s/base/backend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: user-service
          image: ${ECR_REGISTRY}/user-service:${TAG}
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
          livenessProbe:
            httpGet:
              path: /health
              port: 8000
```

## Environment Configuration

| Environment | Infrastructure | Deployment Method |
|-------------|---------------|-------------------|
| Local | Docker Compose | Manual |
| Staging | EKS | ArgoCD Auto Sync |
| Production | EKS | ArgoCD Manual Sync |

## Security Rules

```
✅ Allowed
- Retrieve secrets from Secrets Manager
- IAM role-based access
- VPC internal communication
- mTLS (inter-service)

❌ Prohibited
- Hardcoded secrets
- DB in public subnet
- Using root account
- Excessive IAM permissions
```

## CI/CD Pipeline

```
Push to feature/*
    ↓
GitHub Actions (CI)
    - Lint
    - Test
    - Build Docker image
    - Push to ECR
    ↓
PR to staging
    ↓
ArgoCD Auto Sync (Staging)
    ↓
PR to main
    ↓
ArgoCD Manual Sync (Production)
```

## SoR Priority

```
1st Priority: Codebase
  - scripts/init-db.sql (source of truth for DB schema)
  - services/{service}/app/ (each service implementation)

2nd Priority: CLAUDE.md / Convention docs
  - services/CLAUDE.md
  - frontend/CLAUDE.md
  - infra/CLAUDE.md

3rd Priority: docs/ design documents
  - For understanding design intent
  - If different from code, code is correct
```

---

## AI Native Development

### 3 Core Principles

1. **Document-First Design**: Write design docs BEFORE code
2. **Monorepo Context Control**: All code in one repo for AI context
3. **PR-Based Collaboration**: Every change through PR

### 10-Day Development Pattern

| Day | Focus | Output |
|-----|-------|--------|
| 1 | Architecture | Market analysis + System architecture |
| 2-3 | Core | Auth, User + Business services |
| 4-5 | UX | PO feedback → Documentation → Implementation |
| 6-7 | QA | Zero Script QA + bug fixes |
| 8 | Infra | Terraform + GitOps |
| 9-10 | Production | Security review + Deployment |

---

## Monorepo Benefits for AI

```
Mono-repo:
└─ project/
    ├─ frontend/ ──────┐
    ├─ services/ ──────┤  AI reads completely
    ├─ infra/ ─────────┤  Context unified
    └─ packages/ ──────┘

✅ AI understands full context
✅ Single source of truth for types
✅ Atomic commits across layers
✅ Consistent patterns enforced
```

### CLAUDE.md Hierarchy

```
project/
├── CLAUDE.md           # Project-wide context
├── frontend/CLAUDE.md  # Frontend conventions
├── services/CLAUDE.md  # Backend conventions
└── infra/CLAUDE.md     # Infra conventions
```

Rule: Area-specific CLAUDE.md overrides project-level rules
