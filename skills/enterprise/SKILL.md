---
name: enterprise
description: |
  Enterprise-grade system development with microservices, Kubernetes, and Terraform.
  Handles high traffic, high availability, and complex architecture requirements.

  Triggers: microservices, kubernetes, terraform, k8s, AWS, 마이크로서비스, マイクロサービス, 微服务
agent: infra-architect
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
user-invocable: false
---

# 고급 (Enterprise) 스킬

## 대상

- 시니어 개발자
- CTO / 아키텍트
- 대규모 시스템 운영자

## 기술 스택

```
Frontend:
- Next.js 14+ (Turborepo 모노레포)
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand

Backend:
- Python FastAPI (마이크로서비스)
- PostgreSQL (스키마 분리)
- Redis (캐시, Pub/Sub)
- RabbitMQ / SQS (메시지 큐)

Infrastructure:
- AWS (EKS, RDS, S3, CloudFront)
- Kubernetes (Kustomize)
- Terraform (IaC)
- ArgoCD (GitOps)

CI/CD:
- GitHub Actions
- Docker
```

## 프로젝트 구조

```
프로젝트/
├── apps/                        # 프론트엔드 앱 (Turborepo)
│   ├── web/                    # 메인 웹앱
│   ├── admin/                  # 관리자
│   └── docs/                   # 문서 사이트
│
├── packages/                    # 공유 패키지
│   ├── ui/                     # UI 컴포넌트
│   ├── api-client/             # API 클라이언트
│   └── config/                 # 공유 설정
│
├── services/                    # 백엔드 마이크로서비스
│   ├── auth/                   # 인증 서비스
│   ├── user/                   # 사용자 서비스
│   ├── {domain}/               # 도메인별 서비스
│   └── shared/                 # 공유 모듈
│
├── infra/                       # 인프라 코드
│   ├── terraform/
│   │   ├── modules/            # 재사용 모듈
│   │   └── environments/       # 환경별 설정
│   └── k8s/
│       ├── base/               # 공통 매니페스트
│       └── overlays/           # 환경별 패치
│
├── docs/                        # PDCA 문서
│   ├── 00-requirement/
│   ├── 01-development/         # 설계 문서 (다수)
│   ├── 02-scenario/
│   ├── 03-refactoring/
│   └── 04-operation/
│
├── scripts/                     # 유틸리티 스크립트
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
│  - 인증/인가 미들웨어                                      │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                       │
│  - Service 클래스                                        │
│  - Use Case 구현                                         │
│  - 트랜잭션 관리                                          │
├─────────────────────────────────────────────────────────┤
│                    Domain Layer                          │
│  - Entity 클래스 (순수 Python)                           │
│  - Repository 인터페이스 (ABC)                           │
│  - 비즈니스 규칙                                          │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                     │
│  - Repository 구현체 (SQLAlchemy)                        │
│  - 외부 API 클라이언트                                    │
│  - 캐시, 메시징                                          │
└─────────────────────────────────────────────────────────┘

의존성 방향: 위 → 아래
Domain Layer는 아무것도 의존하지 않음
```

## 핵심 패턴

### Repository 패턴

```python
# domain/repositories/user_repository.py (인터페이스)
from abc import ABC, abstractmethod

class UserRepository(ABC):
    @abstractmethod
    async def find_by_id(self, id: str) -> User | None:
        pass

    @abstractmethod
    async def save(self, user: User) -> User:
        pass

# infrastructure/repositories/user_repository_impl.py (구현)
class UserRepositoryImpl(UserRepository):
    def __init__(self, db: AsyncSession):
        self.db = db

    async def find_by_id(self, id: str) -> User | None:
        result = await self.db.execute(
            select(UserModel).where(UserModel.id == id)
        )
        return result.scalar_one_or_none()
```

### 서비스 간 통신

```python
# 동기 (Internal API)
async def get_user_info(user_id: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{USER_SERVICE_URL}/internal/users/{user_id}",
            headers={"X-Internal-Token": INTERNAL_TOKEN}
        )
        return response.json()

# 비동기 (메시지 큐)
await message_queue.publish(
    topic="user.created",
    message={"user_id": user.id, "email": user.email}
)
```

### Terraform 모듈

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

## 환경 구성

| 환경 | 인프라 | 배포 방식 |
|------|--------|----------|
| Local | Docker Compose | 수동 |
| Staging | EKS | ArgoCD Auto Sync |
| Production | EKS | ArgoCD Manual Sync |

## 보안 규칙

```
✅ 허용
- Secrets Manager에서 시크릿 조회
- IAM 역할 기반 접근
- VPC 내부 통신
- mTLS (서비스 간)

❌ 금지
- 하드코딩된 시크릿
- 퍼블릭 서브넷에 DB
- root 계정 사용
- 과도한 IAM 권한
```

## CI/CD 파이프라인

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

## SoR 우선순위

```
1순위: 코드베이스
  - scripts/init-db.sql (DB 스키마의 진실)
  - services/{service}/app/ (각 서비스 구현)

2순위: CLAUDE.md / 컨벤션 문서
  - services/CLAUDE.md
  - frontend/CLAUDE.md
  - infra/CLAUDE.md

3순위: docs/ 설계 문서
  - 설계 의도 파악용
  - 코드와 다르면 코드가 정답
```
