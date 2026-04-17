---
template: design-enterprise
version: 1.0
description: Detailed design document for Enterprise level projects
variables:
  - feature: Feature name
  - date: Creation date (YYYY-MM-DD)
  - author: Author
  - version: Document version
  - reviewers: Reviewers list
level: Enterprise
---

# {feature} Detailed Design Document

> **Version**: {version}
> **Created**: {date}
> **Author**: {author}
> **Status**: Draft
> **Reviewers**: {reviewers}
> **Planning Doc**: [{feature}.plan.md](../01-plan/features/{feature}.plan.md)

---

## 1. Executive Summary

### 1.1 Purpose

{High-level purpose of this feature}

### 1.2 Scope

{What is included and excluded from this design}

### 1.3 Goals

- {Goal 1}
- {Goal 2}
- {Goal 3}

---

## 1.5 Architecture Options (v1.7.0)

Three candidate architectures are evaluated before detailed design. User selects one via Checkpoint 3, and the remaining sections flesh out the chosen option.

| Criteria | Option A: Minimal | Option B: Clean | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | Least change, reuse shared services | Full hexagonal / Clean Architecture | Balanced boundaries, selective DDD |
| **New Services** | {N} | {N} | {N} |
| **Modified Services** | {N} | {N} | {N} |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **Effort** | Low | High | Medium |
| **Risk** | Low (coupled) | Low (clean) | Low (balanced) |
| **NFR Fit** | Meets SLA at current scale | Future-proofs 10× scale | Clears SLA + leaves room |
| **Recommendation** | Hotfix / compliance patch | Greenfield, long-lived | **Default choice** |

**Selected**: {Option A/B/C} — **Rationale**: {enterprise-specific rationale — regulatory, scale, team skills, blast radius}

> Sections 2–10 below describe the **selected** architecture option in full detail.

---

## 2. Non-Functional Requirements

### 2.1 Performance

| Metric | Target | Rationale |
|--------|--------|-----------|
| Response time (P95) | < 200ms | User experience |
| Throughput | > 1000 RPS | Peak load |
| Database query time | < 50ms | Backend performance |

### 2.2 Scalability

- Horizontal scaling capability
- Expected growth: {X}% per month
- Auto-scaling thresholds

### 2.3 Availability

- Target SLA: 99.9%
- Recovery Time Objective (RTO): < 1 hour
- Recovery Point Objective (RPO): < 5 minutes

---

## 3. System Architecture

### 3.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Load Balancer (ALB)                       │
└──────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Service A     │ │   Service B     │ │   Service C     │
│   (API)         │ │   (Worker)      │ │   (Gateway)     │
└─────────────────┘ └─────────────────┘ └─────────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    Data Layer                                 │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │PostgreSQL│  │  Redis  │  │   S3    │  │ ElasticSearch│   │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
└──────────────────────────────────────────────────────────────┘
```

### 3.2 Microservices Structure

| Service | Responsibility | Stack | Replicas |
|---------|---------------|-------|----------|
| {service-a} | {role} | {tech} | 3 |
| {service-b} | {role} | {tech} | 2 |

### 3.3 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│                 (Controllers, DTOs, Mappers)                 │
├─────────────────────────────────────────────────────────────┤
│                    Application Layer                         │
│               (Use Cases, Services, Handlers)                │
├─────────────────────────────────────────────────────────────┤
│                      Domain Layer                            │
│            (Entities, Value Objects, Interfaces)             │
├─────────────────────────────────────────────────────────────┤
│                   Infrastructure Layer                       │
│        (Repositories, External APIs, Database)               │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Inter-Service Communication

| From | To | Protocol | Pattern |
|------|-----|----------|---------|
| API Gateway | Service A | gRPC | Request/Response |
| Service A | Service B | Message Queue | Event-driven |

---

## 4. Data Model

### 4.1 Entity Definitions

```typescript
// {Entity}
interface {Entity} {
  id: string;
  version: number;          // Optimistic locking
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  // Fields...
}
```

### 4.2 Database Schema

```sql
CREATE TABLE {table} (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  -- Fields...
);

CREATE INDEX idx_{table}_created_at ON {table}(created_at);
```

### 4.3 Event Schema (Event-driven)

```typescript
interface {Feature}Event {
  eventId: string;
  eventType: '{feature}.created' | '{feature}.updated';
  timestamp: string;
  payload: {
    // Event data
  };
}
```

---

## 5. API Specification

### 5.1 Endpoint List

| Method | Path | Description | Rate Limit |
|--------|------|-------------|------------|
| GET | /api/v1/{resource} | List | 100/min |
| POST | /api/v1/{resource} | Create | 10/min |
| PUT | /api/v1/{resource}/:id | Update | 30/min |
| DELETE | /api/v1/{resource}/:id | Delete | 5/min |

### 5.2 Response Format (Standard)

```json
// Success
{
  "data": { ... },
  "meta": {
    "requestId": "req_xxx",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}

// Error
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly message",
    "details": [ ... ]
  }
}

// Pagination
{
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "hasMore": true
  }
}
```

---

## 6. Infrastructure

### 6.1 Kubernetes Resources

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {service}
spec:
  replicas: 3
  template:
    spec:
      containers:
        - name: {service}
          resources:
            requests:
              cpu: "100m"
              memory: "256Mi"
            limits:
              cpu: "500m"
              memory: "512Mi"
```

### 6.2 Environment Variables

| Variable | Description | Scope |
|----------|-------------|-------|
| DB_HOST | Database host | Server |
| REDIS_URL | Redis connection | Server |
| NEXT_PUBLIC_API_URL | API base URL | Client |

---

## 7. Security

### 7.1 Authentication & Authorization

- Authentication: JWT with refresh tokens
- Authorization: RBAC with permissions
- Token expiry: Access 15min, Refresh 7days

### 7.2 Security Checklist

- [ ] Input validation (all endpoints)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (output encoding)
- [ ] CSRF protection (tokens)
- [ ] Rate limiting (per endpoint)
- [ ] Audit logging (sensitive operations)
- [ ] Secrets management (no hardcoded secrets)

---

## 8. Monitoring & Observability

### 8.1 Monitoring Stack

| Component | Tool | Role |
|-----------|------|------|
| Error Tracking | **Sentry** | Error grouping, regression detection, session replay |
| Metrics | Prometheus | Counter/Gauge/Histogram, 15s scrape interval |
| Dashboards | Grafana | Unified view (Prometheus + Loki + Tempo + Sentry) |
| Logs | Loki + Promtail | JSON structured log aggregation, 30d retention |
| Tracing | Tempo + OpenTelemetry | Distributed tracing, 10% sampling (prod) |
| Alerting | Alertmanager | Route: Critical→PagerDuty, Warning→Slack |

### 8.2 Metrics & SLOs

| Metric | Type | SLO/Threshold | Alert |
|--------|------|---------------|-------|
| request_latency_seconds | Histogram | P95 < 200ms, P99 < 500ms | Warning > 500ms, Critical > 1s |
| error_rate | Counter | < 0.1% (SLO 99.9%) | Warning > 1%, Critical > 5% |
| cpu_usage | Gauge | < 70% (HPA target) | Warning > 80%, Critical > 95% |
| memory_usage | Gauge | < 80% (HPA target) | Warning > 85%, Critical > 95% |
| sentry_unresolved_issues | Gauge | < 5 critical | Warning > 5, Critical > 10 |

### 8.3 Logging

- Format: JSON structured
- Required fields: `timestamp, level, service, request_id, trace_id, user_id, message`
- Retention: 30 days
- Error logs: Sentry SDK가 자동 캡처 (breadcrumbs 포함)

### 8.4 Error Tracking (Sentry)

```
Frontend (Next.js):
- @sentry/nextjs SDK
- Error Boundary 자동 연동
- Session Replay (에러 시 100%)
- Performance Monitoring (10% sampling)

Backend (FastAPI):
- sentry-sdk[fastapi]
- ASGI middleware 자동 캡처
- SQLAlchemy integration (slow query 추적)
- Custom context: user_id, request_id, service_name
```

### 8.5 Alerts & Escalation

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| High Error Rate | > 5% for 5min | Critical | PagerDuty page + Auto-Rollback |
| High Latency | P95 > 1s for 10min | Warning | Slack #error-alerts |
| Sentry New Issue | New unhandled exception | Warning | Self-Healing Agent trigger |
| Sentry Regression | Resolved issue re-opened | Critical | Self-Healing + PagerDuty |
| Sentry Spike | Error frequency > 10x baseline | Critical | Auto-Rollback + PagerDuty |

---

## 9. Error Handling & Self-Healing Pipeline

### 9.1 Error Flow

```
Exception 발생
  ↓
Sentry SDK 자동 캡처 (breadcrumbs + user + release)
  ↓
Sentry Alert Rule (new/regression/spike)
  ↓
Self-Healing Agent (Living Context 4-Layer)
  ↓
Auto-fix (max 5 iter) → 4중 검증 → Auto PR
  ↓
Canary Deploy (10%→25%→50%→100%)
  ↓
Post-deploy 검증 (Sentry issue resolved? error_rate 정상?)
  ↓
실패 시 → Auto-Rollback + Incident Memory 기록
```

### 9.2 Circuit Breaker

| State | Condition | Action |
|-------|-----------|--------|
| CLOSED | failures < 3 | Normal operation |
| OPEN | failures >= 3 | Block all transitions, 30s cooldown |
| HALF_OPEN | cooldown expired | 1 trial attempt → success=CLOSED, fail=OPEN |

---

## 10. Deployment

### 10.1 Load Balancer

```
Internet → CloudFront (CDN + WAF) → ALB → NGINX Ingress Controller → Services
                                                ↑
                                     CORS 처리 (annotation)
                                     Path-based routing
                                     TLS termination (ACM)
```

- **ALB + NGINX Ingress** (기본): L7, CORS annotation, path routing, WAF 연동
- **NLB** (특수): L4, gRPC/WebSocket 전용, CORS는 앱단 처리

### 10.2 CI/CD Pipeline

```
PR → Lint/Test(≥80%) → Security Scan(Semgrep+Trivy) → Build → Push ECR
  → Deploy Staging(ArgoCD) → E2E Test → Approval Gate → Canary Deploy Prod
```

### 10.3 Canary Strategy (Argo Rollouts)

```
10% traffic (2min) → metric check → 25% (2min) → 50% (5min) → 100%
                      ↓ fail
                   Auto-Rollback + Sentry alert
```

### 10.4 Rollback Strategy

1. **Auto-Rollback**: Canary metrics fail (error_rate > 1% or P95 > 200ms)
2. **Self-Healing Rollback**: 5회 fix 실패 시 자동 롤백
3. **Manual Rollback**: ArgoCD UI one-click revert
3. Database migration rollback scripts ready

---

## 10. Test Plan

### 10.1 Test Pyramid

| Type | Coverage Target | Tools |
|------|-----------------|-------|
| Unit | > 80% | Jest |
| Integration | Key paths | Supertest |
| E2E | Critical flows | Playwright |
| Load | Performance | k6 |

### 10.2 Key Test Scenarios

- [ ] Happy path: {description}
- [ ] Error handling: {description}
- [ ] Edge cases: {description}
- [ ] Concurrency: {description}
- [ ] Failover: {description}

---

## 11. Implementation Plan

### 11.1 Phases

| Phase | Scope | Duration |
|-------|-------|----------|
| 1 | Core infrastructure | 2 days |
| 2 | API implementation | 3 days |
| 3 | UI integration | 2 days |
| 4 | Testing & QA | 2 days |

### 11.2 Success Criteria

- [ ] All endpoints implemented
- [ ] Test coverage > 80%
- [ ] Zero Script QA passed
- [ ] Security scan passed
- [ ] Performance benchmarks met
- [ ] Documentation complete

---

## Document History

| Version | Date | Changes | Author | Reviewer |
|---------|------|---------|--------|----------|
| 0.1 | {date} | Initial draft | {author} | - |
