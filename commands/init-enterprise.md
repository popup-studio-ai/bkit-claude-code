---
description: Initialize Enterprise level project (MSA, K8s, Terraform)
allowed-tools: ["Read", "Write", "Bash", "Glob"]
---

# Enterprise 프로젝트 초기화

## 수행 작업

1. **프로젝트 구조 분석**
   - 모노레포 구조 확인 (turbo.json, pnpm-workspace.yaml)
   - 백엔드 서비스 구조 확인 (services/)
   - 인프라 코드 확인 (infra/)

2. **PDCA 문서 폴더 생성**
   ```
   docs/
   ├── 00-requirement/           # 요구사항 원문
   │   └── _INDEX.md
   ├── 01-development/           # 설계 문서 (다수)
   │   ├── _INDEX.md
   │   ├── 01_architecture.md
   │   ├── 02_data-model.md
   │   ├── 03_api-spec.md
   │   └── features/
   ├── 02-scenario/              # 시나리오, 유스케이스
   │   └── _INDEX.md
   ├── 03-refactoring/           # 분석 및 리팩토링
   │   ├── _INDEX.md
   │   ├── gap-analysis/
   │   └── issues/
   └── 04-operation/             # 운영 문서
       ├── _INDEX.md
       ├── runbook.md
       └── changelog.md
   ```

3. **도메인별 CLAUDE.md 생성**
   - services/CLAUDE.md (백엔드 컨벤션)
   - frontend/CLAUDE.md (프론트엔드 컨벤션)
   - infra/CLAUDE.md (인프라 컨벤션)

4. **CI/CD 확인**
   - .github/workflows/ 확인
   - ArgoCD 설정 확인 (해당 시)

## 실행 조건

- 마이크로서비스 또는 모노레포 구조
- Kubernetes 또는 Docker 필수
- Terraform 권장

## 다음 단계 안내

```
✅ Enterprise 프로젝트가 초기화되었습니다!

다음 단계:
1. docs/01-development/01_architecture.md 검토
2. services/CLAUDE.md에 백엔드 컨벤션 정의
3. /pdca-plan [서비스명] - 서비스 계획 작성

⚠️ SoR 우선순위: 코드 > CLAUDE.md > 설계 문서
   항상 코드베이스를 먼저 확인하세요.
```
