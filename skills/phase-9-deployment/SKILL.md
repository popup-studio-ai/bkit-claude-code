---
name: phase-9-deployment
description: |
  Skill for deploying to production environment.
  Covers CI/CD, environment configuration, and deployment strategies.

  Triggers: deployment, CI/CD, production, Vercel, Kubernetes, Docker, 배포, デプロイ, 部署
agent: infra-architect
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
user-invocable: false
---

# Phase 9: 배포

> 프로덕션 배포

## 목적

완성된 애플리케이션을 사용자에게 전달합니다.

## 이 Phase에서 하는 것

1. **배포 환경 준비**: 인프라 설정
2. **빌드**: 프로덕션 빌드 생성
3. **배포 실행**: 실제 배포
4. **검증**: 배포 후 동작 확인

## 산출물

```
docs/02-design/
└── deployment-spec.md          # 배포 명세

docs/04-report/
└── deployment-report.md        # 배포 보고서

(인프라 설정 파일들)
├── vercel.json                 # Vercel 설정
├── Dockerfile                  # Docker 설정
└── k8s/                        # Kubernetes 설정
```

## PDCA 적용

- **Plan**: 배포 계획 수립
- **Design**: 배포 구성 설계
- **Do**: 배포 실행
- **Check**: 배포 검증
- **Act**: 문제 해결 및 완료 보고

## 레벨별 적용

| 레벨 | 배포 방식 |
|------|----------|
| Starter | 정적 호스팅 (Netlify, GitHub Pages) |
| Dynamic | Vercel, Railway 등 |
| Enterprise | Kubernetes, AWS ECS 등 |

## Starter 배포 (정적 호스팅)

```bash
# GitHub Pages
npm run build
# dist/ 폴더를 gh-pages 브랜치에 배포

# Netlify
# netlify.toml 설정 후 Git 연결
```

## Dynamic 배포 (Vercel)

```bash
# Vercel CLI
npm i -g vercel
vercel

# 또는 Git 연결로 자동 배포
```

## Enterprise 배포 (Kubernetes)

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

## 환경 변수 관리 (Environment Management)

### 환경별 구성 개요

```
┌─────────────────────────────────────────────────────────────┐
│                     환경별 변수 흐름                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   개발 (Development)                                         │
│   └── .env.local → 개발자 로컬 머신                          │
│                                                              │
│   스테이징 (Staging)                                         │
│   └── CI/CD Secrets → Preview/Staging 환경                  │
│                                                              │
│   프로덕션 (Production)                                      │
│   └── CI/CD Secrets → Production 환경                       │
│       └── Vault/Secrets Manager (Enterprise)                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 환경 분류

| 환경 | 용도 | 데이터 | 변수 소스 |
|------|------|--------|----------|
| **Development** | 로컬 개발 | 테스트 데이터 | `.env.local` |
| **Staging** | 배포 전 검증 | 테스트 데이터 | CI/CD Secrets |
| **Production** | 실제 서비스 | 실제 데이터 | CI/CD Secrets + Vault |

---

## CI/CD 환경 변수 설정

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
          # 일반 환경 변수 (노출 가능)
          NEXT_PUBLIC_APP_URL: ${{ vars.APP_URL }}
          NEXT_PUBLIC_API_URL: ${{ vars.API_URL }}

          # Secrets (민감 정보)
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

### GitHub Secrets 설정 가이드

```
Repository Settings → Secrets and variables → Actions

1. Repository secrets (민감 정보)
   ├── DATABASE_URL
   ├── AUTH_SECRET
   ├── API_STRIPE_SECRET
   └── VERCEL_TOKEN

2. Repository variables (일반 설정)
   ├── APP_URL
   ├── API_URL
   └── NODE_ENV

3. Environment-specific secrets
   ├── production/
   │   ├── DATABASE_URL (프로덕션 DB)
   │   └── API_STRIPE_SECRET (라이브 키)
   └── staging/
       ├── DATABASE_URL (스테이징 DB)
       └── API_STRIPE_SECRET (테스트 키)
```

### Vercel 환경 변수 설정

```
Project Settings → Environment Variables

┌─────────────────┬─────────────┬─────────────┬─────────────┐
│ Variable Name   │ Development │ Preview     │ Production  │
├─────────────────┼─────────────┼─────────────┼─────────────┤
│ DATABASE_URL    │ dev-db      │ staging-db  │ prod-db     │
│ AUTH_SECRET     │ dev-secret  │ stg-secret  │ prod-secret │
│ API_STRIPE_*    │ test key    │ test key    │ live key    │
└─────────────────┴─────────────┴─────────────┴─────────────┘

설정 방법:
1. Project Settings → Environment Variables
2. Add New Variable
3. 환경 선택 (Development / Preview / Production)
4. Sensitive 체크 (민감 정보인 경우)
```

---

## Secrets 관리 전략

### 레벨별 Secrets 관리

| 레벨 | Secrets 관리 방식 | 도구 |
|------|------------------|------|
| **Starter** | CI/CD 플랫폼 Secrets | GitHub Secrets, Vercel |
| **Dynamic** | CI/CD + 환경 분리 | GitHub Environments |
| **Enterprise** | 전용 Secrets Manager | Vault, AWS Secrets Manager |

### Starter/Dynamic: CI/CD Secrets

```yaml
# GitHub Actions에서 사용
- name: Deploy
  env:
    DB_PASSWORD: ${{ secrets.DB_PASSWORD }}
```

### Enterprise: HashiCorp Vault

```yaml
# Vault에서 Secrets 가져오기
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

// 사용
const dbSecrets = await getSecret("myapp/production/database");
// { host: "...", password: "...", ... }
```

---

## 환경별 빌드 설정

### Next.js 환경별 설정

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // 환경별 설정
  env: {
    NEXT_PUBLIC_ENV: process.env.NODE_ENV,
  },

  // 환경별 리다이렉트
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

### 환경별 API 엔드포인트

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

## 환경 변수 검증 (배포 전)

### 필수 변수 체크 스크립트

```bash
#!/bin/bash
# scripts/check-env.sh

REQUIRED_VARS=(
  "DATABASE_URL"
  "AUTH_SECRET"
  "NEXT_PUBLIC_APP_URL"
)

missing=()

for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var}" ]; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "❌ Missing required environment variables:"
  printf '  - %s\n' "${missing[@]}"
  exit 1
fi

echo "✅ All required environment variables are set"
```

### CI/CD에서 검증

```yaml
# GitHub Actions
- name: Validate Environment
  run: |
    chmod +x scripts/check-env.sh
    ./scripts/check-env.sh
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
    NEXT_PUBLIC_APP_URL: ${{ vars.APP_URL }}
```

---

## 환경 변수 관리 체크리스트

### 배포 전

- [ ] **Secrets 등록**
  - [ ] DATABASE_URL (환경별)
  - [ ] AUTH_SECRET (환경별)
  - [ ] 외부 API 키 (환경별)

- [ ] **환경 분리**
  - [ ] Development / Staging / Production 구분
  - [ ] 환경별 데이터베이스 분리
  - [ ] 환경별 외부 서비스 키 분리 (테스트/라이브)

- [ ] **검증**
  - [ ] 필수 변수 체크 스크립트 실행
  - [ ] 빌드 테스트

### 배포 후

- [ ] **동작 확인**
  - [ ] 환경 변수 올바르게 주입됐는지 확인
  - [ ] 외부 서비스 연동 테스트

- [ ] **보안 점검**
  - [ ] 민감 정보 로그 노출 없는지 확인
  - [ ] 클라이언트에 서버 전용 변수 노출 없는지 확인

---

## 배포 체크리스트

### 사전 준비
- [ ] 환경 변수 설정 (위 체크리스트 참조)
- [ ] 도메인 연결
- [ ] SSL 인증서

### 배포
- [ ] 빌드 성공
- [ ] 배포 완료
- [ ] 헬스체크 통과

### 검증
- [ ] 주요 기능 동작 확인
- [ ] 에러 로그 확인
- [ ] 성능 모니터링

## 롤백 계획

```
문제 발생 시:
1. 즉시 이전 버전으로 롤백
2. 원인 분석
3. 수정 후 재배포
```

## 템플릿

`templates/pipeline/phase-9-deployment.template.md` 참조

## 완료 후

프로젝트 완료! 필요 시 Phase 1부터 새 기능 개발 사이클 시작
