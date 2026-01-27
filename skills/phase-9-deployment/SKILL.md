---
name: phase-9-deployment
description: |
  Skill for deploying to production environment.
  Covers CI/CD, environment configuration, and deployment strategies.

  Use proactively when user is ready to deploy or asks about production environment setup.

  Triggers: deployment, CI/CD, production, Vercel, Kubernetes, Docker, 배포, デプロイ, 部署,
  despliegue, implementación, producción,
  déploiement, mise en production,
  Bereitstellung, Produktion,
  distribuzione, messa in produzione

  Do NOT use for: local development, design phase, or feature implementation.
imports:
  - ${PLUGIN_ROOT}/templates/pipeline/phase-9-deployment.template.md
# hooks: Managed by hooks/hooks.json (unified-bash-pre.js, unified-stop.js) - GitHub #9354 workaround
agent: bkit:infra-architect
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
next-skill: null
pdca-phase: act
task-template: "[Phase-9] {feature}"
---

# Phase 9: Deployment

> Production deployment

## Purpose

Deliver the completed application to users.

## What to Do in This Phase

1. **Prepare Deployment Environment**: Infrastructure setup
2. **Build**: Create production build
3. **Execute Deployment**: Actual deployment
4. **Verification**: Post-deployment operation check

## Deliverables

```
docs/02-design/
└── deployment-spec.md          # Deployment specification

docs/04-report/
└── deployment-report.md        # Deployment report

(Infrastructure config files)
├── vercel.json                 # Vercel configuration
├── Dockerfile                  # Docker configuration
└── k8s/                        # Kubernetes configuration
```

## PDCA Application

- **Plan**: Establish deployment plan
- **Design**: Design deployment configuration
- **Do**: Execute deployment
- **Check**: Verify deployment
- **Act**: Problem resolution and completion report

## Level-wise Application

| Level | Deployment Method |
|-------|-------------------|
| Starter | Static hosting (Netlify, GitHub Pages) |
| Dynamic | Vercel, Railway, etc. |
| Enterprise | Kubernetes, AWS ECS, etc. |

## Starter Deployment (Static Hosting)

```bash
# GitHub Pages
npm run build
# Deploy dist/ folder to gh-pages branch

# Netlify
# Configure netlify.toml then connect Git
```

## Dynamic Deployment (Vercel)

```bash
# Vercel CLI
npm i -g vercel
vercel

# Or auto-deploy via Git connection
```

## Enterprise Deployment (Kubernetes)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: app
        image: my-app:latest
```

---

## Environment Management

### Environment Configuration Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Environment Variable Flow                 │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Development                                                │
│   └── .env.local → Developer local machine                  │
│                                                              │
│   Staging                                                    │
│   └── CI/CD Secrets → Preview/Staging environment           │
│                                                              │
│   Production                                                 │
│   └── CI/CD Secrets → Production environment                │
│       └── Vault/Secrets Manager (Enterprise)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Environment Classification

| Environment | Purpose | Data | Variable Source |
|-------------|---------|------|-----------------|
| **Development** | Local development | Test data | `.env.local` |
| **Staging** | Pre-deployment verification | Test data | CI/CD Secrets |
| **Production** | Live service | Real data | CI/CD Secrets + Vault |

---

## CI/CD Environment Variable Configuration

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main, staging]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set environment
        run: |
          if [ "${{ github.ref }}" == "refs/heads/main" ]; then
            echo "DEPLOY_ENV=production" >> $GITHUB_ENV
          else
            echo "DEPLOY_ENV=staging" >> $GITHUB_ENV
          fi

      - name: Build
        env:
          # General environment variables (can be exposed)
          NEXT_PUBLIC_APP_URL: ${{ vars.APP_URL }}
          NEXT_PUBLIC_API_URL: ${{ vars.API_URL }}

          # Secrets (sensitive info)
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          API_STRIPE_SECRET: ${{ secrets.API_STRIPE_SECRET }}
        run: npm run build

      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: |
          npx vercel --prod --token=$VERCEL_TOKEN
```

### GitHub Secrets Configuration Guide

```
Repository Settings → Secrets and variables → Actions

1. Repository secrets (sensitive info)
   ├── DATABASE_URL
   ├── AUTH_SECRET
   ├── API_STRIPE_SECRET
   └── VERCEL_TOKEN

2. Repository variables (general settings)
   ├── APP_URL
   ├── API_URL
   └── NODE_ENV

3. Environment-specific secrets
   ├── production/
   │   ├── DATABASE_URL (production DB)
   │   └── API_STRIPE_SECRET (live key)
   └── staging/
       ├── DATABASE_URL (staging DB)
       └── API_STRIPE_SECRET (test key)
```

### Vercel Environment Variable Configuration

```
Project Settings → Environment Variables

┌─────────────────┬─────────────┬─────────────┬─────────────┐
│ Variable Name   │ Development │ Preview     │ Production  │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ DATABASE_URL    │ dev-db      │ staging-db  │ prod-db     │
│ AUTH_SECRET     │ dev-secret  │ stg-secret  │ prod-secret │
│ API_STRIPE_*    │ test key    │ test key    │ live key    │
└─────────────────┴─────────────┴─────────────┴─────────────┘

Configuration steps:
1. Project Settings → Environment Variables
2. Add New Variable
3. Select environment (Development / Preview / Production)
4. Check Sensitive (if sensitive info)
```

---

## Secrets Management Strategy

### Level-wise Secrets Management

| Level | Secrets Management Method | Tools |
|-------|--------------------------|-------|
| **Starter** | CI/CD platform Secrets | GitHub Secrets, Vercel |
| **Dynamic** | CI/CD + environment separation | GitHub Environments |
| **Enterprise** | Dedicated Secrets Manager | Vault, AWS Secrets Manager |

### Starter/Dynamic: CI/CD Secrets

```yaml
# Usage in GitHub Actions
- name: Deploy
  env:
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

### Enterprise: HashiCorp Vault

```yaml
# Fetch Secrets from Vault
- name: Import Secrets from Vault
  uses: hashicorp/vault-action@v2
  with:
    url: https://vault.company.com
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/myapp/production db_password | DB_PASSWORD ;
      secret/data/myapp/production api_key | API_KEY
```

### Enterprise: AWS Secrets Manager

```typescript
// lib/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "ap-northeast-2" });

export async function getSecret(secretName: string): Promise<Record<string, string>> {
  const command = new GetSecretValueCommand({ SecretId: secretName });
  const response = await client.send(command);

  if (response.SecretString) {
    return JSON.parse(response.SecretString);
  }
  throw new Error(`Secret ${secretName} not found`);
}

// Usage
const dbSecrets = await getSecret("myapp/production/database");
// { host: "...", password: "...", ... }
```

---

## Environment-specific Build Configuration

### Next.js Environment Configuration

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Environment-specific settings
  env: {
    NEXT_PUBLIC_ENV: process.env.NODE_ENV,
  },

  // Environment-specific redirects
  async redirects() {
    if (process.env.NODE_ENV === 'production') {
      return [
        { source: '/debug', destination: '/', permanent: false },
      ];
    }
    return [];
  },
};

module.exports = nextConfig;
```

### Environment-specific API Endpoints

```typescript
// lib/config.ts
const config = {
  development: {
    apiUrl: 'http://localhost:3001',
    debug: true,
  },
  staging: {
    apiUrl: 'https://api-staging.myapp.com',
    debug: true,
  },
  production: {
    apiUrl: 'https://api.myapp.com',
    debug: false,
  },
} as const;

type Environment = keyof typeof config;

const env = (process.env.NODE_ENV || 'development') as Environment;
export const appConfig = config[env];
```

---

## Environment Variable Validation (Pre-deployment)

### Required Variable Check Script

```javascript
#!/usr/bin/env node
// scripts/check-env.js

const REQUIRED_VARS = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_APP_URL'
];

const missing = REQUIRED_VARS.filter(v => !process.env[v]);

if (missing.length > 0) {
  console.error('❌ Missing required environment variables:');
  missing.forEach(v => console.error(`  - ${v}`));
  process.exit(1);
}

console.log('✅ All required environment variables are set');
```

### Validation in CI/CD

```yaml
# GitHub Actions
- name: Validate Environment
  run: node scripts/check-env.js
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
    NEXT_PUBLIC_APP_URL: ${{ vars.APP_URL }}
```

---

## Environment Variable Management Checklist

### Pre-deployment

- [ ] **Secrets Registration**
  - [ ] DATABASE_URL (per environment)
  - [ ] AUTH_SECRET (per environment)
  - [ ] External API keys (per environment)

- [ ] **Environment Separation**
  - [ ] Development / Staging / Production distinction
  - [ ] Per-environment database separation
  - [ ] Per-environment external service key separation (test/live)

- [ ] **Validation**
  - [ ] Run required variable check script
  - [ ] Build test

### Post-deployment

- [ ] **Operation Check**
  - [ ] Verify environment variables are injected correctly
  - [ ] External service integration test

- [ ] **Security Check**
  - [ ] Verify no sensitive info in logs
  - [ ] Verify no server-only variables exposed to client

---

## Deployment Checklist

### Preparation
- [ ] Environment variable configuration (see checklist above)
- [ ] Domain connection
- [ ] SSL certificate

### Deployment
- [ ] Build successful
- [ ] Deployment complete
- [ ] Health check passed

### Verification
- [ ] Major feature operation check
- [ ] Error log review
- [ ] Performance monitoring

## Rollback Plan

```
If problems occur:
1. Immediately rollback to previous version
2. Analyze root cause
3. Fix and redeploy
```

## Template

See `templates/pipeline/phase-9-deployment.template.md`

## After Completion

Project complete! Start new feature development cycle from Phase 1 as needed
