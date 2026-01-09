---
description: Claude Code learning guide
---

# Claude Code 학습 가이드

사용자에게 Claude Code 설정 방법을 교육합니다. **어떤 프로젝트, 어떤 언어에서든** 동일하게 작동합니다.

## 사용법

```
/learn-claude-code [레벨]
```

- 레벨 생략 시: 현재 설정 분석 후 적합한 레벨 추천
- 레벨 지정: 1 (기초), 2 (자동화), 3 (전문화), 4 (팀 최적화)

## 왜 이 커맨드가 필요한가?

```
문제: 새 세션마다 Claude Code 사용법을 다시 설명해야 함
해결: 이 커맨드로 일관된 교육 제공
```

## 수행 작업

### 1단계: 마스터 가이드 참조

**반드시** 다음 문서를 먼저 읽어야 합니다:

```
.claude/docs/CLAUDE-CODE-MASTERY.md          # 목차 및 핵심 개념
.claude/docs/mastery/04-curriculum.md        # 교육 커리큘럼
.claude/docs/mastery/02-language-templates.md # 언어별 템플릿
.claude/docs/mastery/03-project-structures.md # 프로젝트 구조별 가이드
```

필요한 내용에 따라 해당 파일을 참조합니다.

### 2단계: 현재 설정 분석

프로젝트의 Claude Code 설정 현황을 분석합니다:

```bash
# 확인할 파일/폴더
- CLAUDE.md (루트)
- .claude/settings.local.json
- .claude/commands/
- .claude/agents/
- .claude/skills/
- .mcp.json
- .github/workflows/claude-docs-update.yml
```

#### 기본 제공 파일 제외 (중요!)

다음 파일/폴더는 **이 학습 시스템의 기본 제공 파일**이므로 레벨 판단 시 **제외**해야 합니다:

```bash
# 제외할 파일/폴더 (사용자 설정으로 카운트하지 않음)
- .claude/commands/learn-claude-code.md      # 학습 커맨드
- .claude/commands/setup-claude-code.md      # 설정 생성 커맨드
- .claude/commands/upgrade-claude-code.md    # 업그레이드 커맨드
- .claude/docs/                              # 마스터 가이드 문서 전체
```

**예시**:
- `.claude/commands/`에 위 3개 파일만 있으면 → "Commands 없음"으로 판단
- `.claude/commands/commit.md`가 추가로 있으면 → "Commands 있음"으로 판단

### 3단계: 사용자 레벨 결정

| 레벨 | 조건 | 학습 내용 |
|------|------|----------|
| 1 | CLAUDE.md 없음 | 기초: CLAUDE.md 작성법, Plan Mode |
| 2 | CLAUDE.md만 있음 | 자동화: Commands, Hooks, 권한 관리 |
| 3 | Commands/Hooks 있음 | 전문화: Agents, Skills, MCP |
| 4 | 대부분 설정 완료 | 팀 최적화: GitHub Action, 팀 규칙 |

### 4단계: 교육 콘텐츠 제공

선택된 레벨에 맞는 교육을 제공합니다:

#### 레벨 1: 기초 (15분)

```markdown
## CLAUDE.md란?

팀의 공용 지식 저장소입니다. Claude가 실수할 때마다 규칙을 추가하면,
같은 실수를 반복하지 않습니다.

## 작성 예시

# Development Workflow

## 패키지 관리
- **항상 `pnpm` 사용** (`npm`, `yarn` 금지)

## 코딩 컨벤션
- `type` 선호, `interface` 자제
- **`enum` 절대 금지** → 문자열 리터럴 유니온 사용

## 금지 사항
- ❌ console.log 사용 (logger 사용)
- ❌ any 타입

## 실습

지금 바로 CLAUDE.md를 생성해보세요!
```

#### 레벨 2: 자동화 (30분)

```markdown
## 슬래시 커맨드란?

매일 반복하는 작업을 `/command-name`으로 실행할 수 있습니다.

## 커맨드 생성 위치

.claude/commands/{command-name}.md

## 예시: /commit-push-pr

# 커밋, 푸시, PR 생성

## 수행 작업
1. git status 확인
2. git add -A
3. 커밋 메시지 생성 (conventional commits)
4. git push
5. gh pr create

## PostToolUse 훅

코드 수정 후 자동으로 포맷팅을 실행합니다.

// .claude/settings.local.json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Write|Edit",
      "hooks": [{
        "type": "command",
        "command": "pnpm format || true"
      }]
    }]
  }
}
```

#### 레벨 3: 전문화 (45분)

```markdown
## 서브 에이전트란?

특정 작업에 전문화된 AI 에이전트입니다.

## 예시: build-validator.md

# 빌드 검증 에이전트

빌드가 성공적으로 완료되었는지 검증합니다.

## 수행 작업
1. pnpm -r build 실행
2. 빌드 에러 확인

## 성공 기준
- 모든 모듈 빌드 성공
- dist/ 폴더 생성 확인

## Skills란?

도메인별 전문 컨텍스트입니다. Claude가 해당 영역 작업 시 자동 참조합니다.

## 스킬 생성 방식 (하이브리드)

1단계: 공통 스킬 (자동 생성)
- {project}-architecture: 전체 아키텍처
- {project}-testing: 테스트 패턴

2단계: 프로젝트 유형 감지
- modules/ → Hexagonal/DDD
- packages/ → Monorepo
- components/ → Frontend

3단계: 유형별 스킬 제안 (사용자 확인)

## MCP 연결

.mcp.json으로 외부 도구(Slack, GitHub, Jira 등)를 연결합니다.
```

#### 레벨 4: 팀 최적화 (1시간)

```markdown
## GitHub Action으로 PR 자동화

PR 코멘트에 @claude를 멘션하면 자동으로 문서를 업데이트합니다.

## 예시

bcherny: @claude CLAUDE.md에 enum 금지 규칙 추가해줘

claude (봇): CLAUDE.md에 enum 가이드라인 추가 완료!

## 설정 파일

.github/workflows/claude-docs-update.yml

## 팀 규칙 표준화

1. CLAUDE.md를 Git으로 관리
2. PR 리뷰 시 규칙 추가
3. 점진적으로 팀 지식 축적
```

### 5단계: 다음 레벨 안내

현재 레벨 완료 후 다음 레벨로 진행하도록 안내합니다.

## 결과 출력

```
📚 Claude Code 학습 완료!

**현재 레벨**: {레벨}
**학습 내용**: {요약}

🎯 다음 단계:
- /learn-claude-code {다음레벨} 로 계속 학습
- /setup-claude-code 로 설정 자동 생성
- /upgrade-claude-code 로 최신 트렌드 확인
```

## 레벨 5: PDCA 방법론 (선택)

```markdown
## PDCA란?

문서 기반 개발 방법론입니다. Claude가 자동으로 적용합니다.

Plan (계획) → Do (설계/구현) → Check (분석) → Act (개선)

## 핵심 원칙

사용자: "로그인 기능 만들어줘"
Claude: 1. docs/02-design/ 확인 → 설계 먼저
        2. 템플릿 기반 설계 문서 생성
        3. 설계 승인 후 구현
        4. 완료 후 Gap 분석 제안

## 폴더 구조

docs/
├── 01-plan/      # 계획
├── 02-design/    # 설계
├── 03-analysis/  # 분석
└── 04-report/    # 보고

## 상세 학습

- .claude/docs/pdca/overview.md
- .claude/docs/prompts/ (프롬프트 예시)
```

## 참고 문서

### Claude Code 마스터리
- .claude/docs/CLAUDE-CODE-MASTERY.md

### PDCA 방법론
- .claude/docs/pdca/overview.md
- .claude/docs/pdca/plan-guide.md
- .claude/docs/pdca/design-guide.md
- .claude/docs/pdca/check-act-guide.md

### 레벨별 가이드
- .claude/docs/levels/starter-guide.md
- .claude/docs/levels/dynamic-guide.md
- .claude/docs/levels/enterprise-guide.md