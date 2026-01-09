---
description: Upgrade project level (Starter→Dynamic→Enterprise)
allowed-tools: ["Read", "Write", "Bash", "Glob", "Grep"]
---

# 프로젝트 레벨 업그레이드

$ARGUMENTS를 기반으로 업그레이드 수행 (예: /upgrade-level dynamic)

## 업그레이드 경로

```
┌──────────┐      ┌──────────┐      ┌─────────────┐
│ Starter  │ ───▶ │ Dynamic  │ ───▶ │ Enterprise  │
│ (정적)   │      │ (BaaS)   │      │ (MSA/K8s)   │
└──────────┘      └──────────┘      └─────────────┘
```

## Starter → Dynamic 업그레이드

### 필요 조건
- React 또는 Next.js 설치
- bkend.ai 계정 및 프로젝트

### 추가되는 것
1. **문서 구조 확장**
   - docs/02-design/data-model.md
   - docs/02-design/api-spec.md

2. **설정 파일**
   - .mcp.json (bkend.ai MCP 서버)
   - .env.local 템플릿

3. **코드 구조**
   - src/lib/bkend.ts
   - src/hooks/useAuth.ts

## Dynamic → Enterprise 업그레이드

### 필요 조건
- 자체 백엔드 필요성
- 인프라 제어 필요
- 대규모 트래픽 예상

### 추가되는 것
1. **문서 구조 확장**
   - docs/00-requirement/
   - docs/02-scenario/
   - docs/04-operation/

2. **도메인별 CLAUDE.md**
   - services/CLAUDE.md
   - frontend/CLAUDE.md
   - infra/CLAUDE.md

3. **인프라 템플릿**
   - infra/terraform/ 구조
   - infra/k8s/ 구조
   - docker-compose.yml

## 수행 작업

1. **현재 레벨 확인**
   - 프로젝트 구조 분석
   - 기존 문서 확인

2. **업그레이드 실행**
   - 새 폴더/파일 생성 (기존 것은 유지)
   - 마이그레이션 가이드 제공

3. **완료 안내**
   - 변경 사항 요약
   - 다음 단계 안내

## 사용 예시

```
/upgrade-level dynamic    # Starter → Dynamic
/upgrade-level enterprise # Dynamic → Enterprise
```
