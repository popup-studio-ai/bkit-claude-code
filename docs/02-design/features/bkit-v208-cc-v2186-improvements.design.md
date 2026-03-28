# bkit v2.0.8 — CC v2.1.86 대응 개선 설계

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Target Version**: v2.0.8
> **Author**: Design Workflow
> **Created**: 2026-03-28
> **Plan Reference**: docs/01-plan/features/bkit-v208-cc-v2186-improvements.plan.md

---

## Executive Summary

### 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | bkit v2.0.8 — Skills Description 250자 최적화 + Hook `if` 필드 문서화 |
| **변경 파일** | 38개 (34 skills + context-engineering.md + 3 config files) |
| **핵심 설계 결정** | description은 핵심 1줄 + Triggers 키워드만. 8개국어/Use/DoNOT은 본문 유지 |

### 전달될 가치

| 관점 | 내용 |
|------|------|
| **문제** | /skills 목록에서 34/36 skills description 잘림 (CC v2.1.86 250자 cap) |
| **해결 방법** | description 필드를 250자 이내로 최적화. 핵심 정보만 남기고 상세는 본문에 유지 |
| **기능/UX 효과** | /skills에서 모든 skill 목적이 한눈에 파악 가능 |
| **핵심 가치** | skill discoverability 대폭 개선 + CC v2.1.86 완전 대응 |

---

## 1. ENH-162: Skills Description 250자 최적화

### 1.1 설계 규칙

```
description 작성 규칙:
1. 핵심 목적 1~2문장 (영문)
2. 주요 Triggers 키워드 (영문 + 한국어만, 나머지 6개국어는 본문에 유지)
3. 총 250자 이내 엄수
4. "Use proactively", "Do NOT use for", "Project initialization" 문구 → 본문에만 유지
5. YAML multiline `|` 형식 유지
6. SKILL.md 본문의 trigger/instruction 내용은 일체 변경 없음
```

### 1.2 전체 Skills 신규 Description 설계 (34건)

#### 1.2.1 PDCA Core Skills

**pdca** (현재 789자 → 목표 ≤250자)
```yaml
description: |
  Unified PDCA cycle management — plan, design, do, analyze, iterate, report.
  Triggers: pdca, plan, design, analyze, report, status, next, iterate, 계획, 설계, 분석, 보고서.
```

**pdca-batch** (현재 773자 → 목표 ≤250자)
```yaml
description: |
  Manage multiple PDCA features and batch operations.
  Triggers: pdca-batch, batch, multiple features, 다중 기능, 배치, バッチ.
```

**plan-plus** (현재 1033자 → 목표 ≤250자)
```yaml
description: |
  Brainstorming-enhanced PDCA planning with intent discovery and YAGNI review.
  Triggers: plan-plus, brainstorm, plan plus, intent, 브레인스토밍, 플랜플러스.
```

#### 1.2.2 Level Skills

**starter** (현재 983자 → 목표 ≤250자)
```yaml
description: |
  Static web development for beginners — HTML/CSS/JS and Next.js App Router.
  Triggers: static website, portfolio, landing page, beginner, 정적 웹, 초보자, init starter.
```

**dynamic** (현재 1031자 → 목표 ≤250자)
```yaml
description: |
  Fullstack development with bkend.ai BaaS — authentication, database, API integration.
  Triggers: fullstack, BaaS, login, signup, database, web app, 풀스택, 인증, init dynamic.
```

**enterprise** (현재 1003자 → 목표 ≤250자)
```yaml
description: |
  Enterprise-grade systems with microservices, Kubernetes, Terraform, and AI Native methodology.
  Triggers: microservices, k8s, terraform, monorepo, AI native, 마이크로서비스, init enterprise.
```

#### 1.2.3 Pipeline Phase Skills

**phase-1-schema** (현재 576자 → 목표 ≤250자)
```yaml
description: |
  Define project terminology, data structures, entities, and relationships.
  Triggers: schema, data model, entity, terminology, 스키마, 데이터 모델, 용어.
```

**phase-2-convention** (현재 598자 → 목표 ≤250자)
```yaml
description: |
  Define coding rules, conventions, and standards for AI collaboration.
  Triggers: convention, coding style, lint, rules, 코딩 규칙, 컨벤션.
```

**phase-3-mockup** (현재 519자 → 목표 ≤250자)
```yaml
description: |
  Create UI/UX mockups and HTML/CSS/JS prototypes without a designer.
  Triggers: mockup, prototype, wireframe, UI design, 목업, 프로토타입.
```

**phase-4-api** (현재 537자 → 목표 ≤250자)
```yaml
description: |
  Design and implement backend APIs with Zero Script QA validation.
  Triggers: API design, REST API, backend, endpoint, 백엔드 API, API 설계.
```

**phase-5-design-system** (현재 662자 → 목표 ≤250자)
```yaml
description: |
  Build platform-independent design systems and consistent component libraries.
  Triggers: design system, component library, design tokens, 디자인 시스템, 컴포넌트.
```

**phase-6-ui-integration** (현재 632자 → 목표 ≤250자)
```yaml
description: |
  Implement frontend UI and integrate with backend APIs — state management and API clients.
  Triggers: UI integration, frontend-backend, API client, 프론트엔드 통합, UI 구현.
```

**phase-7-seo-security** (현재 627자 → 목표 ≤250자)
```yaml
description: |
  Enhance SEO (meta tags, semantic HTML) and security (vulnerability checks, hardening).
  Triggers: SEO, security, meta tags, vulnerability, 검색 최적화, 보안.
```

**phase-8-review** (현재 909자 → 목표 ≤250자)
```yaml
description: |
  Verify codebase quality — architecture consistency, convention compliance, gap analysis.
  Triggers: code review, architecture check, quality, gap analysis, 코드 리뷰, 품질 검증.
```

**phase-9-deployment** (현재 523자 → 목표 ≤250자)
```yaml
description: |
  Deploy to production — CI/CD pipelines, environment config, deployment strategies.
  Triggers: deployment, CI/CD, production, Vercel, 배포, 프로덕션.
```

**development-pipeline** (현재 968자 → 목표 ≤250자)
```yaml
description: |
  Complete 9-phase development pipeline guide — from schema to deployment.
  Triggers: development pipeline, where to start, phase, 개발 파이프라인, 순서, 시작.
```

#### 1.2.4 bkend Skills

**bkend-auth** (현재 874자 → 목표 ≤250자)
```yaml
description: |
  bkend.ai authentication — email/social login, JWT tokens, RBAC, session management.
  Triggers: bkend auth, login, signup, JWT, RBAC, 인증, 로그인, 회원가입.
```

**bkend-cookbook** (현재 863자 → 목표 ≤250자)
```yaml
description: |
  bkend.ai project tutorials (todo to SaaS) and common error troubleshooting.
  Triggers: bkend tutorial, cookbook, troubleshooting, 튜토리얼, 에러 해결.
```

**bkend-data** (현재 828자 → 목표 ≤250자)
```yaml
description: |
  bkend.ai database — CRUD, column types, filtering, sorting, relations, indexing.
  Triggers: bkend table, CRUD, column, filter, sort, relation, 테이블, 데이터.
```

**bkend-quickstart** (현재 736자 → 목표 ≤250자)
```yaml
description: |
  bkend.ai onboarding — MCP setup, resource hierarchy, tenant/user model, first project.
  Triggers: bkend quickstart, onboarding, setup, MCP, 시작하기, 온보딩.
```

**bkend-storage** (현재 774자 → 목표 ≤250자)
```yaml
description: |
  bkend.ai file storage — upload (presigned URL), download (CDN), visibility levels, buckets.
  Triggers: bkend file, upload, download, presigned URL, storage, 파일 업로드, 스토리지.
```

#### 1.2.5 bkit Utility Skills

**bkit-rules** (현재 797자 → 목표 ≤250자)
```yaml
description: |
  Core rules for bkit — PDCA methodology, level detection, agent triggering, quality standards.
  Triggers: bkit rules, core rules, methodology, 핵심 규칙, PDCA 규칙.
```

**bkit-templates** (현재 804자 → 목표 ≤250자)
```yaml
description: |
  PDCA document templates — Plan, Design, Analysis, Report with consistent structure.
  Triggers: template, plan document, design template, 템플릿, 문서 양식.
```

**audit** (현재 822자 → 목표 ≤250자)
```yaml
description: |
  View audit logs, decision traces, and session history for AI transparency.
  Triggers: audit, log, decision trace, history, 감사 로그, 결정 추적.
```

**control** (현재 816자 → 목표 ≤250자)
```yaml
description: |
  Control bkit automation level (L0-L4), view trust score, and manage guardrails.
  Triggers: control, automation level, trust score, guardrail, 자동화 레벨, 제어.
```

**rollback** (현재 890자 → 목표 ≤250자)
```yaml
description: |
  Manage PDCA checkpoints and rollback — create, list, restore for safe recovery.
  Triggers: rollback, checkpoint, restore, undo, 롤백, 체크포인트, 복원.
```

**cc-version-analysis** (현재 941자 → 목표 ≤250자)
```yaml
description: |
  CC CLI version upgrade impact analysis — research changes, analyze bkit impact, generate report.
  Triggers: cc-version-analysis, CC upgrade, version analysis, CC 버전 분석, 버전 영향.
```

**claude-code-learning** (현재 855자 → 목표 ≤250자)
```yaml
description: |
  Claude Code learning — configure and optimize Claude Code settings, tips, and workflows.
  Triggers: learn, setup, claude code, optimize, 학습, 설정, 최적화.
```

**code-review** (현재 742자 → 목표 ≤250자)
```yaml
description: |
  Code review — analyze quality, detect bugs, ensure best practices with actionable feedback.
  Triggers: code review, quality check, bug detection, 코드 리뷰, 품질 검사.
```

**zero-script-qa** (현재 663자 → 목표 ≤250자)
```yaml
description: |
  Zero Script QA — test without scripts using structured JSON logging and Docker monitoring.
  Triggers: zero-script-qa, log testing, docker logs, QA, 제로 스크립트 QA.
```

**pm-discovery** (현재 741자 → 목표 ≤250자)
```yaml
description: |
  PM Agent Team — automated product discovery, strategy, and PRD generation with 4 PM agents.
  Triggers: pm, PRD, product discovery, PM 분석, 제품 기획, PM analysis.
```

#### 1.2.6 App Skills

**desktop-app** (현재 554자 → 목표 ≤250자)
```yaml
description: |
  Desktop app development guide — Electron and Tauri for cross-platform apps.
  Triggers: desktop app, Electron, Tauri, mac app, windows app, 데스크톱 앱.
```

**mobile-app** (현재 582자 → 목표 ≤250자)
```yaml
description: |
  Mobile app development guide — React Native, Flutter, Expo for cross-platform.
  Triggers: mobile app, React Native, Flutter, Expo, iOS, Android, 모바일 앱.
```

#### 1.2.7 Already Near Limit (250~280자)

**skill-create** (현재 261자 → 목표 ≤250자)
```yaml
description: |
  Interactive skill creation workflow for project-local skills.
  Triggers: skill-create, create skill, 스킬 생성, 스킬 만들기.
```

**skill-status** (현재 271자 → 목표 ≤250자)
```yaml
description: |
  Show loaded skill inventory — bkit core vs project-local, conflicts, coverage gaps.
  Triggers: skill-status, skill list, 스킬 상태, 스킬 목록.
```

---

## 2. ENH-160: Hook `if` 필드 문서화

### 2.1 추가 위치

`bkit-system/philosophy/context-engineering.md` 의 "18-Event Hook System" 섹션 하단에 추가.

### 2.2 추가 내용

```markdown
### Hook `if` Conditional Field (CC v2.1.85+)

CC v2.1.85부터 hook 정의에 `if` 필드를 사용하여 특정 tool 호출 패턴에서만
hook을 실행할 수 있습니다. Permission rule syntax를 사용합니다.

**지원 events**: PreToolUse, PostToolUse, PostToolUseFailure, PermissionRequest

**Syntax 예시**:
```json
{
  "matcher": "Bash",
  "hooks": [{
    "type": "command",
    "command": "node my-hook.js",
    "if": "Bash(git *)"
  }]
}
```

**bkit 현재 상태**: bkit hooks는 `if` 필드를 사용하지 않습니다.
- unified-bash-pre.js: 모든 Bash 명령에 대해 내부적으로 패턴 분기 처리
- `if` 필드로 필터링하면 destructive detector, scope limiter 등 다른 검사가 누락됨
- **권장**: 새로운 단일 목적 hook 추가 시 `if` 필드 활용 (기존 hook은 변경 불필요)
```

### 2.3 ENH-164: Org Policy 주의사항

같은 파일의 "Plugin Installation" 또는 관련 섹션에 추가:

```markdown
### Enterprise Org Policy (CC v2.1.85+)

CC v2.1.85부터 `managed-settings.json` org policy로 특정 plugin의
설치/활성화를 차단할 수 있습니다. Enterprise 환경에서 bkit 설치 시
org admin의 정책 확인이 필요할 수 있습니다.
```

---

## 3. 버전업 설계

| 파일 | 필드 | Before | After |
|------|------|--------|-------|
| bkit.config.json | version | "2.0.6" | "2.0.8" |
| .claude-plugin/plugin.json | version | "2.0.6" | "2.0.8" |
| hooks/hooks.json | description | "bkit Vibecoding Kit v2.0.6 - Claude Code" | "bkit Vibecoding Kit v2.0.8 - Claude Code" |

---

## 4. 검증 계획

### 4.1 자동 검증 스크립트

```bash
# 모든 skills description 250자 이내 확인
for f in skills/*/SKILL.md; do
  desc=$(awk '/^description:/{flag=1; next} flag && /^[a-z_-]+:/{exit} flag{sub(/^  /,""); print}' "$f" | tr '\n' ' ')
  len=${#desc}
  name=$(basename $(dirname "$f"))
  if [ "$len" -gt 250 ]; then
    echo "FAIL: $name ($len chars)"
  fi
done
```

### 4.2 수동 검증

- `/skills` 실행하여 모든 skill이 목록에서 읽기 좋은지 확인
- context-engineering.md의 Hook `if` 섹션이 기존 내용과 일관성 있는지 확인
- 버전 번호가 3개 파일에서 일치하는지 확인

---

## 5. 구현 순서

```
Step 1: 34 skills description 수정 (병렬 가능 — 파일 독립)
Step 2: context-engineering.md 수정 (ENH-160 + ENH-164)
Step 3: 버전업 (3 config files)
Step 4: 검증 스크립트 실행
Step 5: Gap Analysis
```
