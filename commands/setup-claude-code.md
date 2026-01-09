---
description: Claude Code project setup generation
---

# Claude Code 프로젝트 설정 생성

**어떤 프로젝트, 어떤 언어에서든** Claude Code 설정을 자동으로 생성합니다.

지원 언어: TypeScript, JavaScript, Python, Go, Rust, Java, C#, Ruby, PHP 등

## 사용법

```
/setup-claude-code [옵션]
```

옵션:
- `minimal`: 최소 설정 (CLAUDE.md + 훅)
- `standard`: 표준 설정 (+ Commands, Agents)
- `full`: 전체 설정 (+ Skills, MCP, GitHub Action)
- 생략 시: 프로젝트 분석 후 자동 결정

## 왜 이 커맨드가 필요한가?

```
문제: 새 프로젝트마다 Claude Code 설정을 처음부터 수동으로 해야 함
해결: 프로젝트 분석 → 언어/구조에 맞는 설정 자동 생성
```

## 수행 작업

### 1단계: 마스터 가이드 참조

**반드시** 다음 문서를 먼저 읽습니다:

```
.claude/docs/CLAUDE-CODE-MASTERY.md           # 목차 및 핵심 개념
.claude/docs/mastery/01-settings-guide.md     # 설정 요소별 상세 가이드
.claude/docs/mastery/02-language-templates.md # 언어별 설정 템플릿
.claude/docs/mastery/03-project-structures.md # 프로젝트 구조별 가이드
```

필요한 내용에 따라 해당 파일을 참조합니다.

### 2단계: 프로젝트 분석

```bash
# 분석 대상
1. package.json → 패키지 매니저, 스크립트 확인
2. 폴더 구조 → 모노레포 여부, 모듈 구조
3. 기존 .claude/ → 이미 설정된 항목 확인
4. tsconfig.json → TypeScript 설정
5. .eslintrc / biome.json → 린트 설정
6. .prettierrc → 포맷터 설정
```

### 3단계: 기술 스택 파악

| 항목 | 확인 방법 |
|------|----------|
| 패키지 매니저 | lockfile 확인 (pnpm-lock.yaml, package-lock.json, bun.lockb) |
| 언어 | tsconfig.json 유무, 파일 확장자 |
| 프레임워크 | package.json dependencies |
| 모노레포 | pnpm-workspace.yaml, turbo.json, lerna.json |
| 테스트 도구 | vitest, jest, mocha 등 |

### 4단계: 설정 규모 결정

```markdown
## 규모 결정 기준

### Minimal (소규모, 1-3명)
- 단일 패키지
- 간단한 프로젝트

### Standard (중규모, 4-10명)
- 모노레포 또는 복잡한 단일 패키지
- 여러 개발자 협업

### Full (대규모, 10명+)
- 대규모 모노레포
- 여러 도메인
- 외부 시스템 연동 필요
```

### 5단계: 파일 생성

#### 5.1 CLAUDE.md 생성 (항상)

**템플릿 참조**: `.claude/templates/CLAUDE.template.md`

**변수 치환 목록**:

| 변수 | 감지 방법 | 예시 |
|------|----------|------|
| `{{PROJECT_NAME}}` | package.json name 또는 폴더명 | `my-saas-app` |
| `{{PROJECT_DESCRIPTION}}` | package.json description 또는 사용자 입력 | `AI-powered SaaS` |
| `{{LANGUAGE}}` | tsconfig.json 유무, 파일 확장자 | `TypeScript` |
| `{{FRAMEWORK}}` | package.json dependencies | `Next.js 14` |
| `{{PACKAGE_MANAGER}}` | lockfile 확인 | `pnpm` |
| `{{LEVEL}}` | 프로젝트 구조 분석 | `Dynamic` |
| `{{TYPECHECK_COMMAND}}` | package.json scripts | `pnpm typecheck` |
| `{{TEST_COMMAND}}` | package.json scripts | `pnpm test` |
| `{{LINT_COMMAND}}` | package.json scripts | `pnpm lint` |
| `{{BUILD_COMMAND}}` | package.json scripts | `pnpm build` |
| `{{CONVENTIONS}}` | 기존 설정 파일 분석 또는 기본값 | (아래 참조) |
| `{{FOLDER_STRUCTURE}}` | 실제 폴더 구조 분석 | (아래 참조) |

**기본 컨벤션 (TypeScript)**:
```markdown
- Prefer `type` over `interface`
- **Never use `enum`** → Use string literal unions
- Define types with Zod schemas
- No `console.log` → Use logger
- No `any` type
```

**폴더 구조 생성 규칙**:
- 최대 3레벨 깊이까지만 표시
- node_modules, .git, dist 등 제외
- 주요 폴더에 주석 추가

#### 5.2 settings.local.json 생성 (항상)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "{format_command} || true"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Bash({package_manager}:*)",
      "Bash({package_manager} build:*)",
      "Bash({package_manager} test:*)",
      "Bash({package_manager} lint:*)",
      "Bash({package_manager} typecheck:*)"
    ],
    "deny": [],
    "ask": []
  }
}
```

#### 5.3 Commands 생성 (Standard, Full)

`.claude/commands/` 폴더에 다음 파일 생성:

1. `commit-push-pr.md` - 커밋 → 푸시 → PR
2. `typecheck-all.md` - 전체 타입체크
3. `test-module.md` - 모듈별 테스트
4. `lint-fix.md` - 린트 자동 수정
5. `build-all.md` - 전체 빌드

#### 5.4 Agents 생성 (Standard, Full)

`.claude/agents/` 폴더에 다음 파일 생성:

1. `build-validator.md` - 빌드 검증
2. `code-reviewer.md` - 코드 리뷰
3. `test-runner.md` - 테스트 실행 분석
4. `api-doc-generator.md` - API 문서 생성

#### 5.5 Skills 생성 (Standard, Full) - 하이브리드 방식

`.claude/skills/` 폴더에 **3단계**로 스킬을 생성합니다.

##### 1단계: 공통 스킬 (항상 생성)

| 스킬 | 용도 |
|------|------|
| `{project}-architecture` | 전체 아키텍처, 폴더 구조, 의존성 방향 |
| `{project}-testing` | 테스트 패턴, 단위/통합 테스트, 실행 방법 |

##### 2단계: 프로젝트 유형 감지

```bash
# 프로젝트 구조 분석
if modules/ or domains/ exist → Hexagonal/DDD
if packages/ or apps/ exist → Monorepo
if components/ or pages/ exist → Frontend
if controllers/ or routes/ exist → MVC Backend
if services/ exist → Microservices
if src/ only → Library/Simple
```

##### 3단계: 유형별 스킬 제안 (사용자 확인)

**Hexagonal/DDD 프로젝트**:

| 감지 | 제안 스킬 |
|------|----------|
| `modules/{name}/` | `{project}-{name}` (도메인별) |
| MongoDB 사용 | `{project}-database` |
| Fastify/Express | `{project}-api-conventions` |
| Zod 사용 | `{project}-validation` |

**모노레포**:

| 감지 | 제안 스킬 |
|------|----------|
| `packages/{name}/` | `{project}-{name}` (패키지별) |
| `apps/{name}/` | `{project}-{name}-app` |
| 공통 설정 | `{project}-shared` |

**프론트엔드**:

| 감지 | 제안 스킬 |
|------|----------|
| `components/` | `{project}-components` |
| `pages/` or `routes/` | `{project}-routing` |
| `hooks/` | `{project}-hooks` |
| `stores/` or `context/` | `{project}-state` |

**MVC 백엔드**:

| 감지 | 제안 스킬 |
|------|----------|
| `controllers/` | `{project}-controllers` |
| `models/` | `{project}-models` |
| `routes/` | `{project}-api-conventions` |
| `middleware/` | `{project}-middleware` |

**마이크로서비스**:

| 감지 | 제안 스킬 |
|------|----------|
| `services/{name}/` | `{project}-{name}` (서비스별) |
| Docker 사용 | `{project}-deployment` |
| 메시지 큐 | `{project}-messaging` |

**라이브러리**:

| 감지 | 제안 스킬 |
|------|----------|
| `src/` | `{project}-api` |
| `examples/` | `{project}-examples` |

##### 사용자 확인 (AskUserQuestion)

```
프로젝트 유형: Hexagonal/DDD (modules/ 감지)

다음 스킬을 생성할까요?

공통 스킬 (자동 생성):
 ✅ {project}-architecture
 ✅ {project}-testing

프로젝트별 스킬 (선택):
 [x] {project}-auth (modules/auth/)
 [x] {project}-user (modules/user/)
 [x] {project}-transaction (modules/transaction/)
 [ ] {project}-marketing (선택 해제 가능)
 [x] {project}-database (MongoDB 감지)
 [x] {project}-api-conventions (Fastify 감지)
```

##### 스킬 템플릿

```yaml
---
name: {project}-{name}
description: {name} 관련 작업 시 적용. Use when working with {keywords}.
---

# {Name} Skill

## 개요
[자동 분석된 설명]

## 핵심 파일
[해당 영역의 주요 파일 경로]

## 핵심 규칙
[코드베이스에서 추출한 패턴]

## 자주 사용하는 명령어
[관련 테스트/빌드 명령어]
```

#### 5.6 .mcp.json 생성 (Full만)

```json
{
  "mcpServers": {
    "slack": {
      "type": "http",
      "url": "https://slack.mcp.anthropic.com/mcp"
    },
    "github": {
      "type": "http",
      "url": "https://github.mcp.anthropic.com/mcp"
    }
  }
}
```

#### 5.7 GitHub Action 생성 (Full만)

`.github/workflows/claude-docs-update.yml` 생성

#### 5.8 PDCA 폴더 구조 생성 (항상)

`docs/` 폴더에 PDCA 구조 생성:

```
docs/
├── 01-plan/
│   └── _INDEX.md
├── 02-design/
│   ├── _INDEX.md
│   └── features/
├── 03-analysis/
│   ├── _INDEX.md
│   └── issues/
└── 04-report/
    └── _INDEX.md
```

**템플릿 참조**:
- `.claude/templates/plan.template.md` → docs/01-plan/ 문서용
- `.claude/templates/design.template.md` → docs/02-design/ 문서용
- `.claude/templates/analysis.template.md` → docs/03-analysis/ 문서용
- `.claude/templates/report.template.md` → docs/04-report/ 문서용
- `.claude/templates/_INDEX.template.md` → 각 폴더 인덱스용

### 6단계: 기존 설정과 병합

- 이미 존재하는 파일은 덮어쓰지 않음
- 새로운 항목만 추가하거나 사용자에게 확인 요청

## 결과 출력

```
✅ Claude Code 설정 완료!

📁 생성된 파일:
- CLAUDE.md ✅
- .claude/settings.local.json ✅
- .claude/commands/ (5개) ✅
- .claude/agents/ (4개) ✅
- .claude/skills/ (4개) ✅
- .mcp.json ✅
- .github/workflows/claude-docs-update.yml ✅

📊 설정 규모: {minimal|standard|full}
🔧 기술 스택: {detected_stack}

🎯 다음 단계:
1. CLAUDE.md 내용 확인 및 수정
2. /learn-claude-code 로 사용법 학습
3. /upgrade-claude-code 로 최신 트렌드 확인
```

## 주의사항

- 기존 파일이 있으면 백업 후 병합을 시도합니다
- package.json이 없으면 기본 npm 설정으로 생성합니다
- 커스텀 설정이 필요하면 생성 후 수동으로 수정하세요

## 참고 문서

### Claude Code 마스터리
- .claude/docs/CLAUDE-CODE-MASTERY.md
- .claude/docs/mastery/01-settings-guide.md (MCP 추천 전략 포함)

### PDCA 방법론
- .claude/docs/pdca/overview.md
- .claude/templates/ (문서 템플릿)

### 레벨별 가이드
- .claude/docs/levels/starter-guide.md
- .claude/docs/levels/dynamic-guide.md
- .claude/docs/levels/enterprise-guide.md