# Developer Experience & Non-developer Accessibility Brainstorm

> **Date**: 2026-03-01
> **Architect**: Architecture Designer (bkit v1.5.8 CTO Team, Task #6)
> **Dependency**: Task #5 (Customization Abstraction Layer — Hybrid Layered 패턴 채택)
> **Purpose**: bkit 커스터마이징의 개발자/비개발자 경험 설계

---

## 1. 현재 상태 진단

### 1.1 기존 bkit DX 현황

| 항목 | 현재 상태 | 문제점 |
|------|----------|--------|
| **스킬 수** | 27개 | `/` 메뉴에 모두 노출, 초보자에게 압도적 |
| **에이전트 수** | 16개 | 자동 트리거 기반, 사용자 제어 어려움 |
| **설정 파일** | bkit.config.json 1개 | 계층화 없음, 조직/개인 분리 불가 |
| **온보딩** | SessionStart에서 세션 카운트 기반 분기 | 일회성, 지속적 가이드 부재 |
| **커스터마이징** | 직접 파일 수정만 가능 | CLI 도구, 위저드, 검증 없음 |
| **비개발자 지원** | starter-guide 에이전트 + starter 스킬 | Starter 레벨로 고정, 역할별 분화 없음 |
| **문서** | PDCA 가이드, 학습 스타일 | 커스터마이징 가이드 부재 |

### 1.2 사용자 페르소나

| 페르소나 | 설명 | 현재 경험 | 목표 경험 |
|----------|------|----------|----------|
| **P1: 팀 리드 (개발자)** | bkit을 팀에 도입, 커스터마이징 담당 | config.json 직접 수정, 시행착오 | CLI 도구 + schema validation + 가이드 |
| **P2: 팀원 (개발자)** | 설정된 bkit 사용 | 기본 워크플로우 따름 | 팀 표준 자동 적용, 개인 선호 커스텀 |
| **P3: PM/기획자** | 기획서 작성, 요구사항 관리 | 사용 불가 (복잡도 장벽) | 자연어로 PDCA plan 단계 활용 |
| **P4: 디자이너** | 디자인 리뷰, 스펙 확인 | 사용 불가 | 디자인 관련 스킬만 노출 |
| **P5: QA 엔지니어** | 테스트 전략, 품질 확인 | 일부 스킬 사용 | QA 관련 워크플로우 최적화 |
| **P6: 조직 관리자** | 전사 표준 수립, 정책 배포 | 지원 없음 | 조직 템플릿 + 정책 배포 도구 |

---

## 2. 개발자 커스터마이징 경험 (P1, P2)

### 2.1 커스터마이징 진입점

3가지 진입 경로를 제공:

```
경로 A: CLI 스킬 (추천, 가장 빠름)
  /bkit-config                    → 현재 설정 확인/변경
  /bkit-config mode expert        → 모드 변경
  /bkit-config team.maxTeammates 5 → 특정 설정 변경
  /bkit-config --reset            → 기본값으로 초기화

경로 B: 파일 직접 편집 (유연함)
  bkit.config.json                → 프로젝트 설정
  .bkit/local.config.json         → 개인 설정 (gitignored)

경로 C: 템플릿 초기화 (새 프로젝트)
  /bkit-init                      → 대화형 위저드
  /bkit-init --template startup   → 템플릿 지정
```

### 2.2 /bkit-config 스킬 설계

```yaml
---
name: bkit-config
description: |
  bkit 설정을 조회하고 변경합니다.
  현재 4-layer 설정 상태를 보여주고, 프로젝트/개인 설정을 수정합니다.

  Triggers: bkit 설정, config, 설정 변경, 설정 확인, 구성 변경,
  bkit設定, 配置, configuración, configuration, Konfiguration, configurazione

argument-hint: "[key] [value] | --show | --reset | --validate"
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
---

## /bkit-config 사용법

### 설정 조회
- `/bkit-config` — 전체 설정 요약 (merged 결과)
- `/bkit-config --show layers` — 4-layer 소스별 설정 표시
- `/bkit-config pdca` — PDCA 관련 설정만 조회

### 설정 변경
- `/bkit-config mode expert` — 모드 변경 (guide/expert/auto)
- `/bkit-config pdca.matchRateThreshold 95` — 특정 값 변경
- `/bkit-config team.maxTeammates 5` — 팀 설정 변경

### 검증 및 초기화
- `/bkit-config --validate` — 현재 설정 유효성 검증
- `/bkit-config --reset` — 기본값으로 초기화
- `/bkit-config --diff` — 기본값 대비 변경 사항

### 설정 대상 파일
변경은 다음 파일에 저장됩니다:
- 프로젝트 설정 → `bkit.config.json` (git 추적)
- 개인 설정 → `.bkit/local.config.json` (gitignored)
- `--personal` 플래그로 개인 설정에 저장 강제
```

### 2.3 /bkit-init 스킬 설계

```yaml
---
name: bkit-init
description: |
  프로젝트에 bkit 커스터마이징을 초기화합니다.
  대화형 위저드 또는 템플릿 기반으로 설정 파일을 생성합니다.

  Triggers: bkit 초기화, init, 프로젝트 설정, 셋업, setup, initialize,
  bkit初期化, 初始化, inicializar, initialiser, initialisieren, inizializzare

argument-hint: "[--template name] | [--wizard]"
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
---

## /bkit-init 워크플로우

### Step 1: 환경 감지
- 기존 bkit.config.json 존재 여부 확인
- 프로젝트 타입 감지 (package.json, requirements.txt 등)
- CC 버전 확인

### Step 2: 사용자 선택 (대화형)
1. **팀 규모**: 개인 / 소규모 (2-5) / 중규모 (5-10) / 대규모 (10+)
2. **주요 역할**: 개발자 / PM+개발자 / 풀스택팀 / 비개발 포함
3. **PDCA 강도**: 간소화 / 표준 / 엄격
4. **언어**: 한국어 / English / 日本語 / 中文 / 기타
5. **모드**: guide / expert / auto

### Step 3: 파일 생성
- `bkit.config.json` (프로젝트 설정)
- `.bkit/local.config.json` (개인 설정 템플릿)
- `.claude/rules/bkit-*.md` (PDCA 단계별 규칙, 선택적)
- `.gitignore` 업데이트 (.bkit/local.config.json 추가)

### 사전 정의 템플릿
- `--template startup`: 소규모, PDCA 간소화, guide 모드
- `--template enterprise`: 대규모, PDCA 엄격, expert 모드, CTO Team
- `--template solo`: 개인, PDCA 최소, auto 모드
- `--template fullstack`: 풀스택팀, Dynamic 레벨, CTO Team
```

### 2.4 Config Schema Validation

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "properties": {
    "extends": {
      "type": "string",
      "description": "상위 계층 설정 파일 경로"
    },
    "version": {
      "type": "string",
      "pattern": "^\\d+\\.\\d+\\.\\d+$"
    },
    "customization": {
      "type": "object",
      "properties": {
        "mode": {
          "enum": ["guide", "expert", "auto"],
          "default": "auto"
        },
        "skills": {
          "type": "object",
          "properties": {
            "disable": {
              "type": "array",
              "items": { "type": "string" }
            }
          }
        },
        "agents": {
          "type": "object",
          "properties": {
            "overrides": {
              "type": "object",
              "additionalProperties": {
                "type": "object",
                "properties": {
                  "model": { "enum": ["opus", "sonnet", "haiku", "inherit"] },
                  "permissionMode": { "enum": ["default", "acceptEdits", "dontAsk", "plan"] }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

`/bkit-config --validate` 실행 시:
```
bkit Configuration Validation
==============================
Layer 0 (bkit-defaults): OK
Layer 1 (org):           Not configured
Layer 2 (project):       OK (bkit.config.json)
  - pdca.matchRateThreshold: 90 (valid, range: 0-100)
  - team.maxTeammates: 5 (valid, range: 1-10)
  - customization.mode: "expert" (valid)
Layer 3 (personal):      Not configured

Merged Result: VALID
Warnings:
  - 27 skills active (budget: ~15,200 / 16,000 chars).
    Consider disabling unused skills.
```

---

## 3. 비개발자 경험 (P3, P4, P5)

### 3.1 역할 기반 프리셋 (Role Presets)

`customization.mode` 외에 `customization.role` 필드를 추가하여, 역할에 따라 노출되는 스킬과 에이전트를 자동 필터링:

```json
{
  "customization": {
    "mode": "guide",
    "role": "pm"
  }
}
```

| Role | 노출 스킬 | 숨김 스킬 | 기본 에이전트 | 출력 스타일 |
|------|----------|----------|-------------|------------|
| **developer** (기본) | 전체 27개 | 없음 | auto (레벨 기반) | auto |
| **pm** | pdca, plan-plus, code-review, bkit-rules | pipeline phases, bkend-*, desktop/mobile-app | product-manager | bkit-learning |
| **designer** | pdca (design), bkit-templates, code-review | bkend-*, pipeline phases, zero-script-qa | design-validator | bkit-learning |
| **qa** | zero-script-qa, code-review, pdca (check) | bkend-*, starter, desktop/mobile-app | qa-strategist | bkit-pdca-guide |
| **lead** | 전체 | 없음 | cto-lead | bkit-pdca-guide |

**구현 방식**:
- SessionStart 훅에서 `customization.role` 확인
- 해당 역할의 숨김 스킬 목록을 context에 주입
- "다음 스킬은 현재 역할에서 사용하지 않습니다: ..."
- 사용자가 명시적으로 요청하면 숨김 스킬도 사용 가능 (soft hide)

### 3.2 자연어 워크플로우 매핑 (비개발자용)

기존 의도 분류 엔진 (`lib/intent/language.js`)을 확장하여 비개발자 자연어 패턴 추가:

```
PM 자연어 패턴:
  "기획서 작성해줘" → /pdca plan
  "요구사항 정리" → /pdca plan
  "스프린트 리뷰 준비해줘" → /pdca check
  "이번 주 진행 상황 보고서" → /pdca report
  "설계 리뷰 요청" → /pdca design → design-validator 에이전트
  "QA 요청" → /zero-script-qa

디자이너 자연어 패턴:
  "UI 스펙 확인" → /pdca design
  "디자인 가이드라인 만들어줘" → /bkit-templates design
  "컴포넌트 목록 정리" → /pdca design

QA 자연어 패턴:
  "테스트 케이스 작성" → /zero-script-qa
  "코드 리뷰" → /code-review
  "버그 리포트 정리" → /pdca check
```

### 3.3 가이드 모드 UX 상세 설계

`mode: "guide"` 활성화 시의 차별화된 경험:

#### 3.3.1 진입 경험 (첫 세션)

```
안녕하세요! bkit Vibecoding Kit입니다.

현재 [guide] 모드로 설정되어 있어요.
역할: [PM]

주요 할 수 있는 것들:
  /pdca plan    — 기획서/요구사항 정리
  /pdca design  — 설계 문서 작성
  /pdca check   — 진행 상황 확인
  /pdca report  — 보고서 생성
  /bkit-config  — 설정 변경

자연어로 바로 요청하셔도 됩니다:
  "이 프로젝트의 기획서를 작성해줘"
  "현재 진행 상황을 정리해줘"

도움이 필요하면 "도움말" 또는 "/bkit-help"를 입력하세요.
```

#### 3.3.2 단계별 안내 패턴

guide 모드에서 PDCA 실행 시:

```
Step 1/4: 기획 (Plan)
========================
현재 프로젝트의 기획서를 작성합니다.

필요한 정보:
  1. 프로젝트/기능 이름: [사용자 입력 대기]
  2. 주요 목표: [사용자 입력 대기]
  3. 대상 사용자: [사용자 입력 대기]

입력해주시면 기획서 초안을 작성해 드릴게요.
"건너뛰기"를 입력하면 자동으로 작성합니다.
```

expert 모드에서 동일 작업:
```
PDCA Plan phase initiated. Feature name?
```

#### 3.3.3 컨텍스트 주입량 조절

| 항목 | guide 모드 | expert 모드 |
|------|-----------|------------|
| SessionStart 안내문 | 상세 (15-20줄) | 최소 (3-5줄) |
| 스킬 실행 전 설명 | 단계별 안내 | 즉시 실행 |
| 에러 발생 시 | 원인 + 해결방법 + 예시 | 에러 코드 + 간단 설명 |
| PDCA 전환 안내 | 다음 단계 설명 + 선택지 | 자동 전환 |
| 스킬 추천 | 현재 상황 기반 3개 추천 | 추천 없음 |

### 3.4 /bkit-help 스킬 설계

```yaml
---
name: bkit-help
description: |
  현재 모드와 역할에 맞는 bkit 도움말을 표시합니다.
  사용 가능한 스킬, 워크플로우, 자주 묻는 질문을 안내합니다.

  Triggers: 도움말, help, 사용법, 어떻게, how to, 뭐 할 수 있어,
  ヘルプ, 使い方, 帮助, 怎么用, ayuda, aide, Hilfe, aiuto

argument-hint: "[topic]"
user-invocable: true
disable-model-invocation: false
---

## 도움말 제공 방식

현재 설정을 확인하고 맞춤 도움말을 제공합니다:

1. bkit.config.json의 mode와 role 확인
2. 해당 역할에서 사용 가능한 스킬 목록 표시
3. 자주 사용되는 워크플로우 예시 제시
4. 주제별 상세 도움말: `/bkit-help pdca`, `/bkit-help skills`, `/bkit-help team`
```

---

## 4. 스킬 작성 경험 (Skill Authoring DX)

### 4.1 커스텀 스킬 작성 가이드

개발자가 조직/프로젝트용 커스텀 스킬을 작성하는 경험:

#### Step 1: 스킬 생성

```
/bkit-new-skill deploy-check

→ 생성되는 파일:
  .claude/skills/deploy-check/SKILL.md
```

#### Step 2: SKILL.md 템플릿 (자동 생성)

```yaml
---
name: deploy-check
description: |
  [이 스킬이 하는 일을 설명하세요]

  Triggers: [이 스킬을 트리거하는 키워드들]

  Do NOT use for: [이 스킬을 사용하지 말아야 할 상황]

argument-hint: "[arguments]"
user-invocable: true
# disable-model-invocation: true  # Claude 자동 호출 비활성화
# context: fork                    # 별도 컨텍스트에서 실행
# agent: bkit:code-analyzer        # 특정 에이전트로 위임
allowed-tools:
  - Read
  - Write
  - Edit
---

## Instructions

[스킬 실행 시 Claude가 따를 지침을 작성하세요]

### Input
$ARGUMENTS

### Steps
1. [첫 번째 단계]
2. [두 번째 단계]
3. [세 번째 단계]

### Output
[기대하는 출력 형식]
```

### 4.2 /bkit-new-skill 스킬 설계

```yaml
---
name: bkit-new-skill
description: |
  커스텀 스킬을 생성합니다.
  SKILL.md 템플릿과 디렉토리 구조를 자동으로 만들어줍니다.

  Triggers: 새 스킬, new skill, 스킬 만들기, create skill,
  新しいスキル, 新技能, nueva habilidad, nouvelle compétence,
  neuer Skill, nuova competenza

argument-hint: "[skill-name]"
user-invocable: true
disable-model-invocation: true
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

## 스킬 생성 워크플로우

### 매개변수
- `$1`: 스킬 이름 (kebab-case)
- `--scope`: personal | project (기본: project)
- `--template`: basic | advanced | agent-delegating

### 생성 경로
- `--scope personal` → `~/.claude/skills/$1/SKILL.md`
- `--scope project` → `.claude/skills/$1/SKILL.md`

### 생성 후 안내
1. SKILL.md 편집 안내
2. `/skill-name` 으로 테스트 안내
3. 팀 공유 방법 안내 (git commit → push)
```

### 4.3 스킬 테스트 경험

```
로컬 테스트 (CC 네이티브):
  1. .claude/skills/my-skill/SKILL.md 저장
  2. CC가 자동 감지 (hot reload)
  3. /my-skill 실행으로 즉시 테스트
  4. SKILL.md 수정 → 다음 호출 시 자동 반영

검증 항목 (bkit-config --validate에 포함):
  - frontmatter YAML 문법 검증
  - name 필드 형식 (lowercase, hyphens)
  - description 길이 경고 (>500 chars)
  - allowed-tools 유효성
  - agent 참조 유효성 (존재하는 에이전트인지)
```

### 4.4 스킬 공유 경험

```
팀 내 공유 (프로젝트 스킬):
  .claude/skills/my-skill/SKILL.md → git commit → git push
  → 팀원이 pull하면 자동 적용

조직 내 공유 (개인 스킬 → 조직):
  방법 1: ~/.claude/skills/에 symlink 생성
  방법 2: 조직 bkit extension plugin으로 패키징
  방법 3: CC Marketplace에 등록 (향후)

스킬 패키징 가이드:
  /bkit-config --export skills  → 프로젝트 스킬을 zip으로 내보내기
  /bkit-config --import skills <path>  → 스킬 패키지 가져오기
```

---

## 5. 에이전트 커스터마이징 경험

### 5.1 에이전트 오버라이드

bkit.config.json에서 에이전트 속성 변경:

```json
{
  "customization": {
    "agents": {
      "overrides": {
        "code-analyzer": {
          "model": "sonnet",
          "permissionMode": "plan"
        },
        "cto-lead": {
          "model": "opus",
          "maxTurns": 30
        }
      }
    }
  }
}
```

**구현 방식**:
- bkit은 `bkit.config.json`의 overrides를 읽음
- 해당 에이전트의 `.md` 파일을 프로젝트 `.claude/agents/`에 복사 + 수정
- CC의 "project > plugin" 우선순위에 의해 오버라이드 자동 적용
- `/bkit-config agents --sync` 명령으로 명시적 동기화

### 5.2 커스텀 에이전트 추가

```
/bkit-new-agent api-reviewer

→ 생성: .claude/agents/api-reviewer.md
```

에이전트 템플릿:
```yaml
---
name: api-reviewer
description: |
  [이 에이전트가 담당하는 역할을 설명하세요]

  Triggers: [이 에이전트를 트리거하는 키워드들]

  Do NOT use for: [이 에이전트를 사용하지 말아야 할 상황]
permissionMode: plan
model: sonnet
memory: project
tools:
  - Read
  - Grep
  - Glob
---

## System Prompt

[에이전트의 전문 분야, 행동 지침, 품질 기준 등]
```

### 5.3 에이전트 모델 비용 최적화 가이드

| 에이전트 | 기본 모델 | 비용 절감 옵션 | 품질 영향 |
|---------|----------|--------------|----------|
| cto-lead | opus | sonnet (-70% 비용) | 오케스트레이션 품질 저하 위험 |
| code-analyzer | sonnet | haiku (-80% 비용) | 복잡한 코드 분석 정확도 저하 |
| starter-guide | sonnet | haiku (-60% 비용) | 초보자 설명 품질 약간 저하 |
| gap-detector | sonnet | haiku (-60% 비용) | 세밀한 갭 탐지 정확도 저하 |
| qa-strategist | sonnet | haiku (-60% 비용) | TC 생성 품질 저하 |
| report-generator | sonnet | haiku (-60% 비용) | 보고서 품질 유지 (구조화된 작업) |

**비용 프로필 프리셋**:
```json
{
  "customization": {
    "costProfile": "balanced"
  }
}
```

| 프로필 | 설명 | opus 에이전트 | sonnet 에이전트 | haiku 에이전트 |
|--------|------|:---:|:---:|:---:|
| **quality** | 최고 품질 | 7 | 7 | 2 |
| **balanced** (기본) | 균형 | 3 | 9 | 4 |
| **economy** | 비용 절감 | 1 (cto-lead만) | 5 | 10 |

### 5.4 에이전트 메모리 관리

현재 bkit의 16개 에이전트 중 메모리 활용 현황:

| 에이전트 | 현재 memory | 추천 scope | 근거 |
|---------|:---:|:---:|------|
| cto-lead | project | project | 프로젝트 전반 학습 공유 |
| starter-guide | user | user | 사용자 학습 수준 기억 |
| code-analyzer | 없음 | project | 코드베이스 패턴 학습 |
| gap-detector | 없음 | project | 이전 갭 분석 결과 참조 |
| qa-strategist | 없음 | project | TC 패턴 누적 |
| 나머지 11개 | 없음 | 필요 시 | 비용/성능 트레이드오프 |

**에이전트 메모리 config**:
```json
{
  "customization": {
    "agentMemory": {
      "enable": ["cto-lead", "code-analyzer", "qa-strategist"],
      "scope": "project",
      "maxSize": "50KB"
    }
  }
}
```

---

## 6. 조직 템플릿 라이브러리

### 6.1 사전 정의 템플릿

| 템플릿 이름 | 대상 조직 | 주요 설정 |
|------------|----------|----------|
| **solo** | 1인 개발자 | mode: auto, PDCA 최소, team 비활성화 |
| **startup** | 스타트업 (2-5명) | mode: guide, PDCA 간소화, team 3명 |
| **fullstack** | 풀스택 팀 | mode: auto, Dynamic 레벨, CTO Team |
| **enterprise** | 대규모 조직 | mode: expert, PDCA 엄격, team 5명, 보안 훅 |
| **pm-team** | PM/기획 팀 | mode: guide, role: pm, PDCA plan+check만 |
| **design-team** | 디자인 팀 | mode: guide, role: designer, design phase 강화 |
| **qa-team** | QA 팀 | mode: guide, role: qa, check phase 강화 |

### 6.2 템플릿 구조

각 템플릿은 다음 파일을 포함:

```
templates/startup/
├── bkit.config.json           # 프리셋 설정
├── .claude/
│   ├── CLAUDE.md              # 프로젝트 가이드
│   ├── rules/
│   │   └── bkit-workflow.md   # PDCA 워크플로우 규칙
│   └── skills/                # 추가 커스텀 스킬 (선택적)
├── .bkit/
│   └── local.config.json.example  # 개인 설정 예시
└── README.md                  # 템플릿 사용 가이드
```

### 6.3 조직 템플릿 생성 경험

```
/bkit-init --create-template my-org

→ 현재 프로젝트의 설정을 템플릿으로 내보내기:
  1. bkit.config.json 추출
  2. .claude/rules/ 추출
  3. 커스텀 skills/agents 추출
  4. 개인 정보 제거 (gitignored 파일 제외)
  5. templates/my-org/ 디렉토리에 저장

→ 조직 내 배포:
  방법 1: git 저장소로 공유 → /bkit-init --template git@github.com:acme/bkit-template.git
  방법 2: npm 패키지로 배포 → /bkit-init --template @acme/bkit-template
  방법 3: 로컬 경로 → /bkit-init --template ~/templates/my-org
```

---

## 7. 문서 체계 설계

### 7.1 커스터마이징 가이드 구조

```
docs/guides/
├── customization/
│   ├── 01-quickstart.md           # 5분 시작 가이드
│   ├── 02-config-reference.md     # bkit.config.json 전체 레퍼런스
│   ├── 03-skills-authoring.md     # 커스텀 스킬 작성법
│   ├── 04-agents-customization.md # 에이전트 커스터마이징
│   ├── 05-templates.md            # 템플릿 라이브러리 사용법
│   ├── 06-org-setup.md            # 조직 수준 셋업 가이드
│   └── 07-troubleshooting.md      # 문제 해결
├── roles/
│   ├── for-developers.md          # 개발자용 가이드
│   ├── for-pms.md                 # PM/기획자용 가이드
│   ├── for-designers.md           # 디자이너용 가이드
│   └── for-qa.md                  # QA 엔지니어용 가이드
└── examples/
    ├── startup-config.json        # 스타트업 설정 예시
    ├── enterprise-config.json     # 엔터프라이즈 설정 예시
    └── custom-skill-example/      # 커스텀 스킬 예시
        └── SKILL.md
```

### 7.2 5분 시작 가이드 (01-quickstart.md) 개요

```markdown
# bkit 커스터마이징 5분 시작 가이드

## 1. 현재 설정 확인 (30초)
/bkit-config

## 2. 모드 선택 (30초)
/bkit-config mode guide     # 초보자/비개발자
/bkit-config mode expert    # 숙련 개발자
/bkit-config mode auto      # 자동 판단

## 3. 역할 설정 (30초, 선택적)
/bkit-config role pm        # PM/기획자
/bkit-config role designer  # 디자이너
/bkit-config role qa        # QA 엔지니어
/bkit-config role developer # 개발자 (기본)

## 4. 팀 설정 (1분, 선택적)
/bkit-config team.maxTeammates 3
/bkit-config team.enabled true

## 5. 시작! (2분)
원하는 작업을 자연어로 요청하세요:
  "새 기능 기획서 작성해줘"
  "코드 리뷰 해줘"
  "테스트 전략 짜줘"
```

### 7.3 인라인 도움말 시스템

모든 스킬에 `--help` 지원:
```
/pdca --help             → PDCA 스킬 사용법
/code-review --help      → 코드 리뷰 스킬 사용법
/bkit-config --help      → 설정 스킬 사용법
```

**구현**: 각 SKILL.md에 `## Help` 섹션 추가, `$ARGUMENTS`에 `--help` 감지 시 해당 섹션만 출력.

---

## 8. 구현 우선순위 및 로드맵

### 8.1 Phase 1: 핵심 DX (v1.5.8 MVP)

| 항목 | 파일 수 | 기간 |
|------|--------:|------|
| `customization.mode` (guide/expert/auto) 지원 | 3-4 files | 2일 |
| `customization.role` (developer/pm/designer/qa/lead) 지원 | 2-3 files | 1일 |
| SessionStart 안내문 모드별 분기 | 1 file | 0.5일 |
| **Total Phase 1** | **6-8 files** | **3.5일** |

### 8.2 Phase 2: CLI 스킬 (v1.5.8 완전판)

| 항목 | 파일 수 | 기간 |
|------|--------:|------|
| `/bkit-config` 스킬 | 1 skill dir | 2일 |
| `/bkit-init` 스킬 + 4종 템플릿 | 1 skill dir + templates | 2일 |
| `/bkit-help` 스킬 | 1 skill dir | 1일 |
| **Total Phase 2** | **3 skills + templates** | **5일** |

### 8.3 Phase 3: 스킬/에이전트 Authoring (v1.6.x)

| 항목 | 파일 수 | 기간 |
|------|--------:|------|
| `/bkit-new-skill` 스킬 | 1 skill dir | 1일 |
| `/bkit-new-agent` 스킬 | 1 skill dir | 1일 |
| Config schema validation 구현 | 1-2 files | 1일 |
| 에이전트 override → .claude/agents/ 동기화 로직 | 2-3 files | 2일 |
| **Total Phase 3** | **5-7 files** | **5일** |

### 8.4 Phase 4: 문서 및 템플릿 (v1.6.x)

| 항목 | 파일 수 | 기간 |
|------|--------:|------|
| 커스터마이징 가이드 7문서 | 7 docs | 3일 |
| 역할별 가이드 4문서 | 4 docs | 2일 |
| 예시 설정 파일 3종 | 3 files | 0.5일 |
| 템플릿 라이브러리 7종 | 7 dirs | 3일 |
| **Total Phase 4** | **21 files** | **8.5일** |

### 8.5 전체 요약

| Phase | 기간 | 누적 | v1.5.8 범위 |
|-------|------|------|:-----------:|
| Phase 1 (핵심 DX) | 3.5일 | 3.5일 | YES |
| Phase 2 (CLI 스킬) | 5일 | 8.5일 | YES |
| Phase 3 (Authoring) | 5일 | 13.5일 | NO (v1.6.x) |
| Phase 4 (문서) | 8.5일 | 22일 | NO (v1.6.x) |

**v1.5.8 MVP 범위: Phase 1 + Phase 2 = 8.5일**

---

## 9. 신규 스킬 예산 영향 분석

### 9.1 현재 스킬 예산 사용량

27 skills × 평균 description ~500 chars = ~13,500 chars / 16,000 budget (84.4%)

### 9.2 신규 스킬 추가 시

| 신규 스킬 | description 예상 | 용도 |
|----------|----------------:|------|
| bkit-config | ~300 chars | 설정 관리 |
| bkit-init | ~300 chars | 프로젝트 초기화 |
| bkit-help | ~250 chars | 도움말 |
| bkit-new-skill | ~250 chars | 스킬 작성 (Phase 3) |
| bkit-new-agent | ~250 chars | 에이전트 작성 (Phase 3) |

Phase 2까지: +850 chars → 14,350 / 16,000 (89.7%)
Phase 3까지: +1,350 chars → 14,850 / 16,000 (92.8%)

### 9.3 예산 최적화 전략

Phase 1-2에서 안전하게 추가 가능. Phase 3부터는 최적화 필요:

1. **disable-model-invocation: true** — bkit-config, bkit-init, bkit-new-skill, bkit-new-agent에 적용 (사용자 명시적 호출만)
   → description이 컨텍스트에 로드되지 않음
   → 예산 절약: ~1,100 chars

2. **기존 스킬 description 압축** — 27개 스킬의 description에서 Do NOT use for 절 제거 가능
   → 예산 절약: ~2,000-3,000 chars

3. **역할 기반 필터링** — `customization.role`에 따라 불필요한 스킬의 `disable-model-invocation: true` 동적 설정
   → PM 역할 시 bkend-* 5개 스킬 description 비로드 (~2,500 chars 절약)

**결론**: 신규 스킬을 모두 `disable-model-invocation: true`로 설정하면, 예산 영향 없이 추가 가능.

---

## 10. 핵심 설계 결정 요약

| 결정 사항 | 선택 | 근거 |
|-----------|------|------|
| 커스터마이징 진입점 | CLI 스킬 (/bkit-config) + 파일 편집 + 템플릿 | 3가지 경로로 다양한 숙련도 지원 |
| 비개발자 접근 | role 기반 스킬 필터링 + guide 모드 | 기존 스킬 재사용, 노출만 제어 |
| 스킬 작성 DX | /bkit-new-skill + 템플릿 자동 생성 | CC 네이티브 hot reload 활용 |
| 에이전트 오버라이드 | config → .claude/agents/ 복사 | CC "project > plugin" 우선순위 활용 |
| 비용 최적화 | costProfile 프리셋 (quality/balanced/economy) | 간단한 선택으로 16 에이전트 모델 일괄 변경 |
| 문서 체계 | 커스터마이징 가이드 + 역할별 가이드 + 인라인 help | 계층적 도움말 시스템 |
| 스킬 예산 관리 | 신규 스킬 전부 disable-model-invocation: true | 예산 영향 0 |
| 템플릿 시스템 | 7종 사전 정의 + 사용자 정의 내보내기 | 빠른 셋업 + 조직 표준 배포 |

---

## Sources

- Task #5 결과: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/customization-abstraction-brainstorm.md`
- bkit.config.json: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/bkit.config.json`
- Skills 구조: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/skills/` (27 skills)
- Agents 구조: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/agents/` (16 agents)
- Config 로직: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/lib/core/config.js`
- CC Context Engineering: `/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code/docs/01-plan/research/cc-context-engineering-deep-dive.md`
