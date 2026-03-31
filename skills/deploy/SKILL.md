---
name: deploy
effort: medium
model: sonnet
shell: bash
description: Deploy feature to target environment (dev/staging/prod) with level-based strategy
version: 3.0.0
category: workflow
agent: bkit:infra-architect
pdca_phase: do
triggers:
  - deploy
  - /pdca deploy
  - 배포
  - デプロイ
  - 部署
---

# Deploy Skill

> Deploy code to target environment with automated CI/CD pipeline generation.
> Strategy adapts based on project level (Starter/Dynamic/Enterprise).

## Usage

```bash
/pdca deploy {feature}              # Deploy to default env (dev)
/pdca deploy {feature} --env dev    # Deploy to DEV
/pdca deploy {feature} --env staging  # Deploy to STAGING (requires DEV 90%+)
/pdca deploy {feature} --env prod   # Deploy to PROD (requires STAGING 95%+ & Human Approval)
/pdca deploy status                 # Show deploy state machine status
```

## Level-Based Strategy

| Level | Strategy | Environments | Tools |
|-------|----------|-------------|-------|
| **Starter** | Guide only | dev | GitHub Pages, Netlify, Vercel |
| **Dynamic** | Docker + GHA | dev, staging | Docker Compose, GitHub Actions |
| **Enterprise** | 6-Layer CI/CD | dev, staging, prod | Terraform, EKS, ArgoCD, Canary |

## Deploy Flow

```
/pdca deploy feature --env dev
    │
    ▼
① Level Detection (Starter/Dynamic/Enterprise)
    │
    ▼
② Generate CI/CD Files (if not exist)
    ├── .github/workflows/deploy.yml
    ├── Dockerfile (Dynamic/Enterprise)
    ├── docker-compose.yml (DEV)
    ├── k8s/ manifests (Enterprise)
    └── terraform/ (Enterprise)
    │
    ▼
③ Deploy State Machine Transition
    init → dev → verify(90%) → staging → verify(95%) → approval → prod(canary) → complete
    │
    ▼
④ Return to PDCA Check phase
```

## Environment Promotion Gates

| Gate | Condition | Action |
|------|-----------|--------|
| DEV → STAGING | Match Rate ≥ 90% | Auto-promote |
| STAGING → PROD | Match Rate ≥ 95% + Human Approval | Require `/pdca deploy --env prod` |
| PROD Canary | Error rate < threshold | Auto-rollout 10% → 25% → 50% → 100% |

## Generated Files

### Starter
- Deployment guide document only

### Dynamic
- `.github/workflows/deploy.yml` — Docker build + push + deploy
- `Dockerfile` — Multi-stage build
- `docker-compose.yml` — DEV environment
- `.env.example` — Environment variables template

### Enterprise (additional)
- `infra/terraform/` — AWS infrastructure
- `infra/k8s/` — Kubernetes manifests
- `infra/argocd/` — ArgoCD Application + Helm
- Security scan steps in CI/CD

## Rollback

```bash
/pdca deploy rollback {feature}              # Rollback current deploy
/pdca deploy rollback {feature} --env prod   # Rollback specific environment
```

Rollback triggers:
- Manual: `/pdca deploy rollback` command
- Auto: Error rate spike detected by ops-metrics (> 5% threshold)
- Canary fail: Argo Rollouts auto-rollback on metrics failure

Rollback resets deploy state machine to `idle` and restores previous version.

## Hook Events

| Event | When | Hook |
|-------|------|------|
| `deploy-start` | Deploy initiated | Pre-validation |
| `deploy-complete` | Deploy successful | Post-notification |
| `deploy-failed` | Deploy failed | Error handling + rollback suggestion |
