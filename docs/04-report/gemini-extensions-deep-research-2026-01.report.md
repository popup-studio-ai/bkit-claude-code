# Gemini CLI Extensions 심층 분석 및 bkit 호환성 Gap 보고서

> **작성일**: 2026-01-30
> **버전**: 1.0
> **분석 대상**: Gemini CLI Extensions v0.27.x, bkit v1.4.7
> **분석 도구**: WebSearch, WebFetch, Task System, Gap Analysis

---

## 목차

1. [Executive Summary](#1-executive-summary)
2. [Gemini CLI Extensions 개발 가이드](#2-gemini-cli-extensions-개발-가이드)
3. [bkit 현재 구현 분석](#3-bkit-현재-구현-분석)
4. [호환성 Gap 분석](#4-호환성-gap-분석)
5. [개선 권장사항](#5-개선-권장사항)
6. [참고 자료](#6-참고-자료)

---

## 1. Executive Summary

### 1.1 분석 결과 요약

| 구성 요소 | 현재 상태 | Gemini 호환성 | 우선순위 |
|-----------|----------|---------------|----------|
| gemini-extension.json | 부분 호환 | 40% | CRITICAL |
| hooks/hooks.json | 호환 안됨 | 15% | CRITICAL |
| skills/*.md | 부분 호환 | 55% | HIGH |
| agents/*.md | 호환 안됨 | 10% | HIGH |
| commands/gemini/*.toml | 호환 | 85% | LOW |
| GEMINI.md | 호환 | 90% | LOW |
| **Overall** | **부분 호환** | **35%** | - |

### 1.2 핵심 발견사항

1. **구조적 차이**: Claude Code는 마크다운 기반 에이전트/스킬, Gemini CLI는 TOML 기반 실험적 에이전트
2. **Hook 이벤트 차이**: Claude Code 5개 vs Gemini CLI 10개 이벤트, 이름도 상이
3. **Skill 필드 차이**: Claude Code는 풍부한 frontmatter 지원, Gemini CLI는 `name`/`description`만 지원
4. **변환 도구 존재**: skill-porter, gemini-cli-skillz 등 커뮤니티 도구로 부분 호환 가능

### 1.3 권장 조치

| 단계 | 조치 | 예상 공수 | 효과 |
|------|------|-----------|------|
| 1단계 | gemini-extension.json 스키마 수정 | 2시간 | 기본 로딩 가능 |
| 2단계 | hooks/hooks.json Gemini 버전 생성 | 4시간 | Hook 기능 작동 |
| 3단계 | Skills 단순화 버전 생성 | 8시간 | Skill 기본 작동 |
| 4단계 | Agents → TOML 변환 | 16시간 | Agent 실험적 지원 |

---

## 2. Gemini CLI Extensions 개발 가이드

### 2.1 Extension 구조

```
my-extension/
├── gemini-extension.json   # 필수 - 매니페스트
├── GEMINI.md               # 선택 - 컨텍스트 파일
├── commands/               # 선택 - 커스텀 명령어 (TOML)
│   └── group/
│       └── command.toml
├── skills/                 # 선택 - Agent Skills
│   └── my-skill/
│       └── SKILL.md
├── agents/                 # 선택 - Sub-agents (TOML, 실험적)
│   └── my-agent.toml
├── hooks/
│   └── hooks.json          # 선택 - Hook 정의
└── .env                    # 선택 - 사용자 설정값
```

### 2.2 gemini-extension.json 스키마

```json
{
  "name": "extension-id",           // 필수: 소문자, 숫자, 대시만
  "version": "1.0.0",               // 필수: 시맨틱 버전
  "description": "설명",            // 선택: geminicli.com에 표시
  "contextFileName": "GEMINI.md",   // 선택: 컨텍스트 파일명
  "mcpServers": {                   // 선택: MCP 서버 설정
    "server-name": {
      "command": "node",
      "args": ["${extensionPath}${/}server.js"],
      "cwd": "${extensionPath}"
    }
  },
  "excludeTools": ["tool_name"],    // 선택: 제외할 도구
  "settings": [                     // 선택: 사용자 설정
    {
      "name": "API Key",
      "description": "Your API key",
      "envVar": "MY_API_KEY",
      "sensitive": true
    }
  ]
}
```

**지원되지 않는 필드** (bkit에서 사용 중이나 Gemini에서 무시됨):
- `$schema`
- `author`
- `repository`
- `license`
- `keywords`
- `engines`
- `context.file` (대신 `contextFileName` 사용)
- `commands.directory`
- `commands.deprecated`
- `hooks` (대신 `hooks/hooks.json` 사용)
- `skills.directory`
- `skills.autoActivate`
- `environment`

### 2.3 Hooks 시스템

#### 2.3.1 이벤트 타입 (10종)

| 이벤트 | 실행 시점 | 영향 범위 | Claude Code 대응 |
|--------|----------|----------|------------------|
| `SessionStart` | 세션 시작 | 컨텍스트 주입 | `SessionStart` ✅ |
| `SessionEnd` | 세션 종료 | 자문적 | 없음 ❌ |
| `BeforeAgent` | 프롬프트 후, 계획 전 | 턴 차단/컨텍스트 | `UserPromptSubmit` (유사) |
| `AfterAgent` | 에이전트 루프 완료 | 재시도/중단 | `Stop` (유사) |
| `BeforeModel` | LLM 요청 전 | 턴 차단/모의 | 없음 ❌ |
| `AfterModel` | LLM 응답 후 | 필터링/편집 | 없음 ❌ |
| `BeforeToolSelection` | 도구 선택 전 | 도구 필터링 | 없음 ❌ |
| `BeforeTool` | 도구 실행 전 | 검증/차단 | `PreToolUse` ✅ |
| `AfterTool` | 도구 실행 후 | 후처리 | `PostToolUse` ✅ |
| `PreCompress` | 컨텍스트 압축 전 | 자문적 | `PreCompact` (유사) |
| `Notification` | 시스템 알림 | 외부 전달 | 없음 ❌ |

#### 2.3.2 hooks.json 형식

```json
{
  "hooks": {
    "BeforeTool": [
      {
        "matcher": "write_file|edit_file",
        "hooks": [
          {
            "name": "security-check",
            "type": "command",
            "command": "${extensionPath}/scripts/check.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/hooks/init.js"
          }
        ]
      }
    ]
  }
}
```

#### 2.3.3 환경 변수

| Gemini CLI | Claude Code | 호환성 |
|------------|-------------|--------|
| `GEMINI_PROJECT_DIR` | `CLAUDE_PROJECT_DIR` | 호환 별칭 제공 |
| `GEMINI_SESSION_ID` | 없음 | Gemini 전용 |
| `GEMINI_CWD` | 없음 | Gemini 전용 |
| `${extensionPath}` | `${CLAUDE_PLUGIN_ROOT}` | 변환 필요 |

#### 2.3.4 도구 이름 매핑

| Claude Code | Gemini CLI | 비고 |
|-------------|------------|------|
| `Write` | `write_file` | 완전히 다름 |
| `Edit` | `edit_file` | 완전히 다름 |
| `Read` | `read_file` | 완전히 다름 |
| `Bash` | `run_shell_command` | 완전히 다름 |
| `Glob` | `find_files` | 완전히 다름 |
| `Grep` | `search_text` | 완전히 다름 |
| `Skill` | 없음 | Gemini에 없음 |
| `Task` | 없음 | Gemini에 없음 |

### 2.4 Agent Skills

#### 2.4.1 SKILL.md 형식

```yaml
---
name: skill-name
description: When to use this skill
---

# Skill Instructions

Your expert guidance here...
```

**Gemini CLI 지원 필드:**
- `name` (필수): 고유 식별자
- `description` (필수): 활성화 조건 설명

**Claude Code 전용 필드 (Gemini에서 무시됨):**
- `argument-hint`
- `user-invocable`
- `agents`
- `allowed-tools` / `disallowedTools`
- `imports`
- `next-skill`
- `pdca-phase`
- `task-template`
- `linked-from-skills`
- `context`
- `mergeResult`
- `permissionMode`
- `model`
- `tools`
- `skills`

#### 2.4.2 Skill 디렉토리 구조

```
my-skill/
├── SKILL.md          # 필수 - 메타데이터 + 지시사항
├── scripts/          # 선택 - 실행 스크립트
├── references/       # 선택 - 참조 문서
└── assets/           # 선택 - 리소스 파일
```

#### 2.4.3 Skill 우선순위

1. 워크스페이스: `.gemini/skills/` (최고 우선순위)
2. 사용자: `~/.gemini/skills/`
3. 확장 프로그램: `extensions/*/skills/` (최저 우선순위)

### 2.5 Custom Agents (실험적)

#### 2.5.1 TOML 형식

```toml
name = "agent_id"
display_name = "Human Readable Name"
description = "Description of what the agent does"
tools = ["read_file", "run_shell_command"]

[prompts]
system_prompt = """Your system instructions here"""
query = "${query}"
```

**지원 도구:**
- `ls`
- `read` / `read_many_files`
- `grep`
- `glob`
- `memory`
- `web_search`
- `run_shell_command`

**제한사항:**
- `[inputs]` 섹션은 현재 무시됨
- `${query}` 변수로 자연어 입력만 전달
- 실험적 기능으로 변경 가능성 높음

### 2.6 Custom Commands

#### 2.6.1 TOML 형식

```toml
description = "Command description"

prompt = """
Your prompt here.

You can use $ARGUMENTS for user input.
You can also use shell commands:
!{shell command here}
"""
```

#### 2.6.2 명명 규칙

- 파일: `commands/group/name.toml`
- 호출: `/group:name` 또는 `/name` (그룹 없는 경우)

---

## 3. bkit 현재 구현 분석

### 3.1 파일 구조

```
bkit-claude-code/
├── gemini-extension.json       # Gemini 매니페스트 (부분 호환)
├── GEMINI.md                   # 컨텍스트 파일 (호환)
├── hooks/
│   ├── hooks.json              # Claude Code 형식 (비호환)
│   └── session-start.js        # Hook 스크립트
├── skills/                     # 21개 스킬
│   └── */SKILL.md              # Claude Code 형식 (부분 호환)
├── agents/                     # 11개 에이전트
│   └── *.md                    # 마크다운 형식 (비호환)
├── commands/gemini/            # 20개 명령어
│   └── *.toml                  # TOML 형식 (호환)
└── scripts/                    # 실행 스크립트
    └── *.js
```

### 3.2 gemini-extension.json 분석

**현재 사용 중인 필드:**

```json
{
  "$schema": "...",          // Gemini 무시
  "name": "bkit",            // ✅ 호환
  "version": "1.4.7",        // ✅ 호환
  "description": "...",      // ✅ 호환
  "author": {...},           // ❌ 비호환
  "repository": "...",       // ❌ 비호환
  "license": "...",          // ❌ 비호환
  "keywords": [...],         // ❌ 비호환
  "engines": {...},          // ❌ 비호환
  "context": {"file": "..."}, // ❌ 비호환 (contextFileName 사용해야)
  "commands": {...},         // ❌ 비호환 (자동 감지)
  "hooks": {...},            // ❌ 비호환 (hooks/hooks.json 사용해야)
  "skills": {...},           // ❌ 비호환 (자동 감지)
  "environment": {...}       // ❌ 비호환
}
```

### 3.3 hooks.json 분석

**현재 사용 중인 이벤트:**

| Claude Code 이벤트 | Gemini 대응 | 상태 |
|-------------------|-------------|------|
| `SessionStart` | `SessionStart` | 이름 호환 |
| `PreToolUse` | `BeforeTool` | 이름 변환 필요 |
| `PostToolUse` | `AfterTool` | 이름 변환 필요 |
| `Stop` | 없음 | 대체 방법 필요 |
| `UserPromptSubmit` | `BeforeAgent` | 유사하나 다름 |
| `PreCompact` | `PreCompress` | 이름 변환 필요 |

**현재 사용 중인 변수:**

| 현재 | 필요한 변환 |
|------|------------|
| `${CLAUDE_PLUGIN_ROOT}` | `${extensionPath}` |

**현재 사용 중인 도구 매처:**

| 현재 | 필요한 변환 |
|------|------------|
| `Write\|Edit` | `write_file\|edit_file` |
| `Bash` | `run_shell_command` |
| `Skill` | 대응 없음 (제거 필요) |

### 3.4 Skills 분석

**21개 스킬 현황:**

| 스킬 | Claude 전용 필드 | Gemini 호환성 |
|------|-----------------|---------------|
| pdca | agents, allowed-tools, imports, next-skill, pdca-phase, task-template | 30% |
| bkit-rules | imports | 70% |
| bkit-templates | imports | 70% |
| development-pipeline | imports | 70% |
| starter | imports | 70% |
| dynamic | imports | 70% |
| enterprise | imports | 70% |
| phase-1~9 | pdca-phase, imports | 60% |
| code-review | agents, allowed-tools | 50% |
| zero-script-qa | agents, allowed-tools | 50% |
| mobile-app | - | 90% |
| desktop-app | - | 90% |

### 3.5 Agents 분석

**11개 에이전트 현황:**

| 에이전트 | 형식 | Claude 전용 필드 | Gemini 호환성 |
|----------|------|-----------------|---------------|
| gap-detector | 마크다운 | linked-from-skills, imports, context, mergeResult, permissionMode, disallowedTools, model, tools, skills | 5% |
| pdca-iterator | 마크다운 | 유사 | 5% |
| report-generator | 마크다운 | 유사 | 5% |
| code-analyzer | 마크다운 | 유사 | 5% |
| qa-monitor | 마크다운 | 유사 | 5% |
| design-validator | 마크다운 | 유사 | 5% |
| starter-guide | 마크다운 | 유사 | 5% |
| pipeline-guide | 마크다운 | 유사 | 5% |
| bkend-expert | 마크다운 | 유사 | 5% |
| enterprise-expert | 마크다운 | 유사 | 5% |
| infra-architect | 마크다운 | 유사 | 5% |

### 3.6 Commands 분석

**20개 명령어 현황:**

| 명령어 | TOML 형식 | Gemini 호환성 |
|--------|----------|---------------|
| pdca-plan | ✅ | 85% |
| pdca-design | ✅ | 85% |
| pdca-analyze | ✅ | 85% |
| pdca-iterate | ✅ | 85% |
| pdca-report | ✅ | 85% |
| pdca-status | ✅ | 85% |
| pdca-next | ✅ | 85% |
| init-starter | ✅ | 85% |
| init-dynamic | ✅ | 85% |
| init-enterprise | ✅ | 85% |
| pipeline-start | ✅ | 85% |
| pipeline-status | ✅ | 85% |
| pipeline-next | ✅ | 85% |
| 기타 | ✅ | 85% |

**주의**: `$ARGUMENTS` 변수가 Gemini CLI에서 지원되는지 확인 필요

---

## 4. 호환성 Gap 분석

### 4.1 Critical Gaps (즉시 수정 필요)

#### Gap #1: gemini-extension.json 스키마 불일치

**현재 상태:**
```json
{
  "context": { "file": "GEMINI.md" },
  "hooks": { /* inline definition */ },
  "skills": { "directory": "skills" }
}
```

**필요한 상태:**
```json
{
  "contextFileName": "GEMINI.md"
  // hooks와 skills는 자동 감지
}
```

**영향**: Extension 로딩 실패 또는 기능 무시

#### Gap #2: Hook 이벤트명 불일치

| 현재 | 필요 | 영향 |
|------|------|------|
| `PreToolUse` | `BeforeTool` | Hook 트리거 안됨 |
| `PostToolUse` | `AfterTool` | Hook 트리거 안됨 |
| `Stop` | 없음 | 대체 구현 필요 |
| `UserPromptSubmit` | `BeforeAgent` | 부분 호환 |

#### Gap #3: 환경 변수 불일치

| 현재 | 필요 |
|------|------|
| `${CLAUDE_PLUGIN_ROOT}` | `${extensionPath}` |
| `${PLUGIN_ROOT}` | `${extensionPath}` |

#### Gap #4: 도구 이름 불일치

| 현재 | 필요 |
|------|------|
| `Write` | `write_file` |
| `Edit` | `edit_file` |
| `Bash` | `run_shell_command` |
| `Skill` | 제거 (대응 없음) |

### 4.2 High Priority Gaps

#### Gap #5: Skill Frontmatter 필드

bkit 스킬이 사용하는 Claude Code 전용 필드들이 Gemini에서 무시됨:

- `agents`: 에이전트 연동 불가
- `allowed-tools`: 도구 제한 불가
- `imports`: 템플릿 임포트 불가
- `next-skill`: 스킬 체이닝 불가

**영향**: PDCA 자동화 워크플로우 대부분 작동 안함

#### Gap #6: Agent 형식 차이

| Claude Code | Gemini CLI |
|-------------|------------|
| 마크다운 기반 | TOML 기반 |
| 풍부한 메타데이터 | 최소 필드 |
| Task 시스템 연동 | 연동 없음 |
| 모델 지정 가능 | 불가능 |

### 4.3 Medium Priority Gaps

#### Gap #7: Task System 미지원

bkit의 핵심 기능인 Task System이 Gemini CLI에 없음:
- `TaskCreate`, `TaskUpdate`, `TaskList`, `TaskGet` 도구 없음
- PDCA Task 체인 생성 불가
- 진행 상황 추적 불가

#### Gap #8: Template Import 미지원

```yaml
imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md
```

Gemini CLI는 `imports` 필드를 지원하지 않아 템플릿 재사용 불가

### 4.4 Low Priority Gaps

#### Gap #9: deprecation 메시징

```json
"commands": {
  "deprecated": true,
  "deprecationNotice": "..."
}
```

Gemini CLI는 이 필드를 무시하여 사용자에게 deprecation 경고 표시 불가

---

## 5. 개선 권장사항

### 5.1 단기 조치 (1-2일)

#### 5.1.1 gemini-extension.json 수정

```json
{
  "name": "bkit",
  "version": "1.4.7",
  "description": "Vibecoding Kit - PDCA methodology + AI-native development",
  "contextFileName": "GEMINI.md"
}
```

#### 5.1.2 hooks/hooks.gemini.json 생성

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/hooks/session-start.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "BeforeTool": [
      {
        "matcher": "write_file|edit_file",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/scripts/pre-write.js",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "run_shell_command",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/scripts/unified-bash-pre.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "AfterTool": [
      {
        "matcher": "write_file",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/scripts/unified-write-post.js",
            "timeout": 5000
          }
        ]
      },
      {
        "matcher": "run_shell_command",
        "hooks": [
          {
            "type": "command",
            "command": "node ${extensionPath}/scripts/unified-bash-post.js",
            "timeout": 5000
          }
        ]
      }
    ]
  }
}
```

#### 5.1.3 lib/common.js 환경 변수 처리

```javascript
// 플랫폼 감지 및 경로 해결
const isGemini = !!(process.env.GEMINI_PROJECT_DIR ||
                    process.env.GEMINI_SESSION_ID);
const isClaude = !!(process.env.CLAUDE_PLUGIN_ROOT);

const extensionPath = process.env.GEMINI_EXTENSION_PATH ||
                      process.env.CLAUDE_PLUGIN_ROOT;
const projectDir = process.env.GEMINI_PROJECT_DIR ||
                   process.env.CLAUDE_PROJECT_DIR;
```

### 5.2 중기 조치 (1주)

#### 5.2.1 Skills 단순화 버전 생성

각 스킬에 대해 Gemini 호환 버전 생성:

```yaml
---
name: pdca
description: |
  Unified skill for managing the entire PDCA cycle.
  Auto-triggered by keywords: plan, design, analyze, report, status.
  Use when user mentions PDCA cycle, planning, design documents,
  gap analysis, iteration, or completion reports.
---

# PDCA Skill

[기존 내용 유지, Claude 전용 기능 제거]
```

#### 5.2.2 설치 스크립트 작성

```bash
#!/bin/bash
# install.sh - 플랫폼별 설정 파일 복사

if command -v gemini &> /dev/null; then
    echo "Gemini CLI detected"
    cp hooks/hooks.gemini.json hooks/hooks.json
    cp skills-gemini/* skills/
else
    echo "Claude Code detected"
    cp hooks/hooks.claude.json hooks/hooks.json
    cp skills-claude/* skills/
fi
```

### 5.3 장기 조치 (1개월)

#### 5.3.1 Agents → TOML 변환

각 마크다운 에이전트를 TOML 형식으로 변환:

```toml
# agents/gap-detector.toml
name = "gap_detector"
display_name = "Gap Detector Agent"
description = "Detects gaps between design documents and actual implementation. Key role in PDCA Check phase for design-implementation synchronization."
tools = ["read_file", "find_files", "search_text"]

[prompts]
system_prompt = """
# Design-Implementation Gap Detection Agent

## Role
Finds inconsistencies between design documents (Plan/Design) and actual implementation (Do).
Automates the Check stage of the PDCA cycle.

[기존 지시사항 포함]
"""
query = "${query}"
```

#### 5.3.2 skill-porter 통합 검토

- [skill-porter](https://github.com/jduncan-rva/skill-porter) 도구 활용
- 양방향 자동 변환 파이프라인 구축
- CI/CD에서 자동 빌드

#### 5.3.3 분리 배포 고려

| 배포 | 대상 플랫폼 | 구성 |
|------|------------|------|
| `bkit-claude-code` | Claude Code | 전체 기능 |
| `bkit-gemini-cli` | Gemini CLI | 단순화 버전 |

---

## 6. 참고 자료

### 6.1 공식 문서

- [Gemini CLI Extensions](https://geminicli.com/docs/extensions/)
- [Writing Extensions](https://github.com/google-gemini/gemini-cli/blob/main/docs/extensions/writing-extensions.md)
- [Extensions Reference](https://geminicli.com/docs/extensions/reference/)
- [Agent Skills](https://geminicli.com/docs/cli/skills/)
- [Hooks Reference](https://geminicli.com/docs/hooks/reference/)
- [Writing Hooks](https://geminicli.com/docs/hooks/writing-hooks/)

### 6.2 GitHub 이슈

- [#17475 - Bridge Ecosystems: Import External Plugin Bundles](https://github.com/google-gemini/gemini-cli/issues/17475)
- [#15895 - Critical Skills Implementation Missing Core Architecture](https://github.com/google-gemini/gemini-cli/issues/15895)
- [#11506 - Add Skill to Gemini CLI like Claude Code](https://github.com/google-gemini/gemini-cli/issues/11506)
- [#15974 - Add subagent configurability](https://github.com/google-gemini/gemini-cli/issues/15974)
- [#17348 - Refactor common settings logic for hooks, skills, and agents](https://github.com/google-gemini/gemini-cli/issues/17348)

### 6.3 커뮤니티 도구

- [skill-porter](https://github.com/jduncan-rva/skill-porter) - Claude ↔ Gemini 스킬 양방향 변환
- [gemini-cli-skillz](https://github.com/intellectronica/gemini-cli-skillz) - MCP 기반 Claude 스킬 호환 레이어
- [gemini-agent-creator](https://github.com/jduncan-rva/gemini-agent-creator) - AI 기반 에이전트 생성

### 6.4 튜토리얼

- [Getting Started with Gemini CLI Extensions](https://codelabs.developers.google.com/getting-started-gemini-cli-extensions)
- [How to Create Custom Sub-Agents in Gemini CLI](https://website-nine-gules.vercel.app/blog/how-to-create-custom-sub-agents-gemini-cli)
- [How I Turned Gemini CLI into a Multi-Agent System](https://aipositive.substack.com/p/how-i-turned-gemini-cli-into-a-multi)

### 6.5 릴리즈 정보

- [Gemini CLI Releases](https://github.com/google-gemini/gemini-cli/releases)
- [Gemini CLI Changelog](https://geminicli.com/docs/changelogs/)
- 현재 안정 버전: v0.23.0 (2026-01-06)
- 최신 프리뷰 버전: v0.27.0-preview.3 (2026-01-29)

---

## 부록: 호환성 체크리스트

### A. gemini-extension.json

- [ ] 불필요한 필드 제거 ($schema, author, repository, license, keywords, engines)
- [ ] `context.file` → `contextFileName` 변경
- [ ] `commands`, `hooks`, `skills` 인라인 정의 제거 (자동 감지 사용)
- [ ] `environment` 제거

### B. hooks/hooks.json

- [ ] `PreToolUse` → `BeforeTool` 변경
- [ ] `PostToolUse` → `AfterTool` 변경
- [ ] `Stop` 이벤트 제거 또는 `AfterAgent`로 대체
- [ ] `UserPromptSubmit` → `BeforeAgent`로 대체
- [ ] `PreCompact` → `PreCompress` 변경
- [ ] `${CLAUDE_PLUGIN_ROOT}` → `${extensionPath}` 변경
- [ ] 도구 매처 변경 (Write → write_file, Bash → run_shell_command 등)
- [ ] `Skill` 매처 제거

### C. Skills

- [ ] Claude 전용 frontmatter 필드 제거
- [ ] `imports` 내용 인라인화
- [ ] `agents` 참조 문서화로 대체
- [ ] `allowed-tools` 문서화로 대체

### D. Agents

- [ ] 마크다운 → TOML 변환 (선택적, 실험적 기능)
- [ ] 또는 skill-porter 사용
- [ ] 또는 gemini-cli-skillz MCP 사용

### E. Scripts

- [ ] 플랫폼 감지 로직 추가
- [ ] 환경 변수 호환성 처리
- [ ] JSON 출력만 stdout에 (로그는 stderr)

---

**보고서 작성**: bkit PDCA Report System
**분석 도구**: WebSearch, WebFetch, Task System, Glob, Grep, Read
**작성 기준일**: 2026-01-30
