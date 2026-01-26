# Gemini CLI Agents 디렉토리 호환성 심층 분석

> **Project**: bkit-claude-code
> **Feature**: gemini-cli-agents-directory-compatibility
> **Analysis Date**: 2026-01-26
> **Analyzer**: Task Management System + gap-detector
> **Version**: v1.4.3

---

## 1. 분석 배경

### 1.1 문제 현상

`gemini extensions list` 명령 실행 시 다음 에러 발생:

```
[ExtensionManager] Error loading agent from bkit: Failed to load agent from
/Users/popup-kay/.gemini/extensions/bkit/agents/gap-detector.md: Validation failed: Agent Definition:
tools.0: Invalid tool name
tools.1: Invalid tool name
...
: Unrecognized key(s) in object: 'imports', 'context', 'mergeResult', 'permissionMode', 'disallowedTools', 'skills', 'hooks'
```

**영향받는 Agent 파일**: 11개 전체
- bkend-expert.md, code-analyzer.md, design-validator.md, enterprise-expert.md
- gap-detector.md, infra-architect.md, pdca-iterator.md, pipeline-guide.md
- qa-monitor.md, report-generator.md, starter-guide.md

### 1.2 기존 설계 결정과의 차이

**기존 설계 문서** (gemini-agent-schema-compatibility.design.md Section 3.2):
> "Claude Code 형식을 유지하기로 결정. Gemini CLI에서 `tools` 등 미지원 필드가 있어도 agent 로딩은 성공하며..."

**실제 동작**:
- Agent 로딩 **실패** (Validation failed)
- 에러 로그 출력 (Error level, Debug level 아님)
- Extension 자체는 로드되지만 agents 기능 비활성화

---

## 2. 원인 분석

### 2.1 Gemini CLI Agent 스키마 (v0.25.2)

**소스 위치**: `@google/gemini-cli-core/dist/src/agents/agentLoader.js`

```javascript
const localAgentSchema = z
    .object({
        kind: z.literal('local').optional().default('local'),
        name: nameSchema,
        description: z.string().min(1),
        display_name: z.string().optional(),
        tools: z.array(z.string().refine((val) => isValidToolName(val), {
            message: 'Invalid tool name',
        })).optional(),
        model: z.string().optional(),
        temperature: z.number().optional(),
        max_turns: z.number().int().positive().optional(),
        timeout_mins: z.number().int().positive().optional(),
    })
    .strict();  // ← 허용되지 않은 키 거부
```

**핵심**: `.strict()` 스키마 사용으로 정의되지 않은 키는 **즉시 거부**

### 2.2 도구 이름 불일치

**소스 위치**: `@google/gemini-cli-core/dist/src/tools/tool-names.js`

| bkit (Claude Code) | Gemini CLI | 유효 여부 |
|-------------------|------------|:--------:|
| `Read` | `read_file` | ❌ |
| `Glob` | `glob` | ❌ |
| `Grep` | `search_file_content` | ❌ |
| `Task` | `delegate_to_agent` | ❌ |
| `Write` | `write_file` | ❌ |
| `Edit` | `replace` | ❌ |
| `Bash` | `run_shell_command` | ❌ |
| `WebSearch` | `google_web_search` | ❌ |
| `WebFetch` | `web_fetch` | ❌ |
| `TodoWrite` | `write_todos` | ❌ |
| `LSP` | (미지원) | ❌ |

### 2.3 허용되지 않는 YAML 키

**Gemini CLI 허용 키** (localAgentSchema):
```yaml
name, description, display_name, kind, tools, model,
temperature, max_turns, timeout_mins
```

**bkit에서 사용 중인 Claude Code 전용 키**:

| 키 | 용도 | Gemini 지원 |
|----|------|:-----------:|
| `permissionMode` | 권한 모드 (plan/bypassPermissions) | ❌ |
| `skills` | 자동 활성화 스킬 목록 | ❌ |
| `imports` | 외부 파일 임포트 | ❌ |
| `hooks` | Agent 라이프사이클 훅 | ❌ |
| `context` | 컨텍스트 모드 (fork/inherit) | ❌ |
| `mergeResult` | 결과 병합 옵션 | ❌ |
| `disallowedTools` | 금지 도구 목록 | ❌ |
| `when_to_use` | 사용 조건 설명 | ❌ |
| `color` | UI 표시 색상 | ❌ |

---

## 3. 현재 디렉토리 구조 분석

### 3.1 commands/ 패턴 (성공 사례)

```
commands/
├── archive.md           ← Claude Code 형식 (Markdown)
├── pdca-status.md
├── ...
└── gemini/              ← Gemini 전용 (TOML)
    ├── archive.toml
    ├── pdca-status.toml
    └── ...
```

**결과**: ✅ 양 플랫폼에서 정상 작동

### 3.2 agents/ 패턴 (문제 발생)

```
agents/
├── gap-detector.md      ← Claude Code 형식
├── code-analyzer.md
├── ...
└── (gemini/ 디렉토리 없음)
```

**결과**: ❌ Gemini CLI에서 에러 발생

### 3.3 Gemini CLI 확장 프로그램 디렉토리 스캔 규칙

| 디렉토리 | 자동 스캔 | 형식 |
|----------|:--------:|------|
| `commands/` | ✅ | Markdown (.md) |
| `commands/gemini/` | ✅ | TOML (.toml) - 우선 적용 |
| `skills/` | ✅ | SKILL.md |
| `agents/` | ✅ | Markdown (.md) 또는 TOML (.toml) |
| `hooks/` | ✅ | hooks.json |

---

## 4. 대응 방안 비교

### 4.1 옵션 A: commands/ 패턴 적용 (권장)

**구조**:
```
agents/                    ← Claude Code 전용 (유지)
├── gap-detector.md
└── ...
agents/gemini/             ← Gemini 전용 (신규)
├── gap-detector.toml
└── ...
```

**장점**:
- 기존 commands/ 패턴과 일관성
- 플랫폼별 최적화 가능
- 기존 Claude Code agents 수정 불필요

**단점**:
- 중복 관리 필요 (11개 × 2 = 22개 파일)
- 동기화 부담

**구현 난이도**: ⭐⭐ (낮음)

### 4.2 옵션 B: agents 디렉토리 이름 변경

**구조**:
```
claude-agents/             ← Claude Code 전용 (이름 변경)
├── gap-detector.md
└── ...
agents/                    ← Gemini 전용
├── gap-detector.toml
└── ...
```

**장점**:
- Gemini CLI 에러 해소
- 명확한 플랫폼 구분

**단점**:
- Claude Code plugin.json 수정 필요
- 기존 문서/스크립트 경로 업데이트

**구현 난이도**: ⭐⭐⭐ (중간)

### 4.3 옵션 C: Gemini 호환 포맷으로 통합

**구조**:
```
agents/
├── gap-detector.md       ← 최소 공통 포맷
└── ...
```

**포맷**:
```yaml
---
name: gap-detector
description: |
  Agent that detects gaps between design and implementation.
tools:
  - read_file
  - glob
  - search_file_content
model: gemini-2.0-flash
---
# System Prompt...
```

**장점**:
- 단일 소스 관리
- 양 플랫폼 호환

**단점**:
- Claude Code 고급 기능 손실 (permissionMode, skills, hooks 등)
- 기존 agents 전면 재작성 필요

**구현 난이도**: ⭐⭐⭐⭐⭐ (높음)

### 4.4 옵션 D: gemini-extension.json에서 agents 비활성화

**방법**: 현재 Gemini CLI v0.25.2에서는 agents 디렉토리 비활성화 옵션 없음

**가능한 대안**:
```json
{
  "agents": {
    "directory": "agents/gemini"  // 존재하지 않는 경로 또는 빈 폴더
  }
}
```

**장점**:
- 기존 코드 수정 최소화

**단점**:
- gemini-extension.json에 agents 설정이 없으면 자동 스캔됨
- 공식 지원 방법 아님 (문서화 안됨)

**구현 난이도**: ⭐ (매우 낮음, 단 비공식)

---

## 5. GitHub 이슈 조사 결과

### 5.1 관련 이슈 및 PR

| 이슈/PR | 제목 | 상태 | 관련성 |
|---------|------|------|--------|
| [#14308](https://github.com/google-gemini/gemini-cli/issues/14308) | Agent TOML Parser & Validator | Closed (병합) | ⭐⭐⭐ |
| [#14371](https://github.com/google-gemini/gemini-cli/pull/14371) | Add enableAgents experimental flag | Merged | ⭐⭐ |
| [#15112](https://github.com/google-gemini/gemini-cli/pull/15112) | feat: add agent toml parser | Merged | ⭐⭐⭐ |
| [#12938](https://github.com/google-gemini/gemini-cli/issues/12938) | Agent tool invocation fails with underscores | Open | ⭐ |

### 5.2 주요 발견

1. **TOML 형식 지원 추가** (PR #15112, 2025-12-18):
   ```toml
   name = "my-agent"
   description = "Agent description"
   tools = ["read_file", "glob"]

   [prompts]
   system_prompt = "..."

   [models]
   model = "gemini-2.5-flash"
   temp = 0.7
   ```

2. **실험적 기능 플래그** (PR #14371):
   - `experimental.enableAgents` 설정으로 agents 활성화/비활성화 가능

3. **도구 이름 kebab-case 표준화** (Issue #12938):
   - Gemini CLI 내부에서 도구 이름은 snake_case (예: `read_file`)
   - Claude Code는 PascalCase (예: `Read`)

---

## 6. 권장 해결책

### 6.1 단기 (v1.4.3)

**옵션 A 채택: agents/gemini/ 디렉토리 생성**

```
agents/
├── gap-detector.md          # Claude Code (기존 유지)
├── code-analyzer.md
└── ...
agents/gemini/               # Gemini (신규)
├── gap-detector.toml
├── code-analyzer.toml
└── ...
```

**이유**:
1. commands/ 패턴과 일관성 유지
2. 기존 Claude Code 기능 손실 없음
3. 플랫폼별 최적화 가능
4. 빠른 구현 가능

### 6.2 Gemini TOML Agent 예시

```toml
# agents/gemini/gap-detector.toml
name = "gap-detector"
description = """
Agent that detects gaps between design documents and actual implementation.
Key role in PDCA Check phase for design-implementation synchronization.

Use when user requests comparison, verification, or gap analysis between
design documents and implementation code.
"""
display_name = "Gap Detector"
tools = [
    "read_file",
    "glob",
    "search_file_content",
    "delegate_to_agent"
]

[models]
model = "gemini-2.0-flash"
temp = 0.7

[prompts]
system_prompt = """
# Design-Implementation Gap Detection Agent

## Role
Finds inconsistencies between design documents (Plan/Design) and actual implementation (Do).
Automates the Check stage of the PDCA cycle.

## Comparison Items
...
"""
```

### 6.3 장기 (v1.5.0+)

1. **빌드 스크립트 구현**: Claude Code agents → Gemini TOML 자동 변환
2. **공통 스키마 정의**: 플랫폼 중립적 agent 정의 포맷 개발
3. **Gemini CLI 기능 모니터링**: 추가 속성 지원 시 활용

---

## 7. 구현 계획

### 7.1 작업 목록

| # | 작업 | 우선순위 | 예상 파일 수 |
|---|------|:--------:|:------------:|
| 1 | `agents/gemini/` 디렉토리 생성 | High | 1 |
| 2 | 11개 agent TOML 파일 작성 | High | 11 |
| 3 | gemini-extension.json agents 설정 추가 (선택) | Medium | 1 |
| 4 | 변환 스크립트 작성 (선택) | Low | 1 |
| 5 | 문서 업데이트 | Medium | 2 |

### 7.2 파일 매핑

| Claude Code Agent | Gemini Agent |
|-------------------|--------------|
| agents/gap-detector.md | agents/gemini/gap-detector.toml |
| agents/code-analyzer.md | agents/gemini/code-analyzer.toml |
| agents/pdca-iterator.md | agents/gemini/pdca-iterator.toml |
| agents/design-validator.md | agents/gemini/design-validator.toml |
| agents/report-generator.md | agents/gemini/report-generator.toml |
| agents/starter-guide.md | agents/gemini/starter-guide.toml |
| agents/pipeline-guide.md | agents/gemini/pipeline-guide.toml |
| agents/bkend-expert.md | agents/gemini/bkend-expert.toml |
| agents/enterprise-expert.md | agents/gemini/enterprise-expert.toml |
| agents/infra-architect.md | agents/gemini/infra-architect.toml |
| agents/qa-monitor.md | agents/gemini/qa-monitor.toml |

---

## 8. 결론

### 8.1 분석 요약

| 항목 | 결과 |
|------|------|
| 문제 원인 | Gemini CLI `.strict()` 스키마 + 도구 이름 불일치 |
| 기존 설계 오류 | "agent 로딩 성공" 가정이 틀림 |
| 권장 해결책 | **옵션 A: agents/gemini/ 디렉토리 패턴** |
| 구현 난이도 | ⭐⭐ (낮음) |

### 8.2 다음 단계

1. `/pdca-plan gemini-agents-compatibility` 실행하여 구현 계획 수립
2. agents/gemini/ 디렉토리 및 TOML 파일 생성
3. Gemini CLI에서 에러 해소 확인
4. 문서 업데이트

---

## 9. 참고 자료

### Sources

- [Gemini CLI GitHub](https://github.com/google-gemini/gemini-cli)
- [Gemini CLI Extensions Documentation](https://geminicli.com/docs/extensions/)
- [Agent Skills Documentation](https://geminicli.com/docs/cli/skills/)
- [Issue #14308: Agent TOML Parser](https://github.com/google-gemini/gemini-cli/issues/14308)
- [PR #15112: Agent TOML Parser Implementation](https://github.com/google-gemini/gemini-cli/pull/15112)
- [PR #14371: enableAgents Experimental Flag](https://github.com/google-gemini/gemini-cli/pull/14371)

---

## 10. 분석 메타데이터

```json
{
  "pdcaPhase": "check",
  "feature": "gemini-cli-agents-directory-compatibility",
  "matchRate": 0,
  "gaps": {
    "missing": 11,
    "added": 0,
    "changed": 0
  },
  "recommendation": "implement-agents-gemini-directory",
  "blockedBy": "design-decision-required"
}
```

---

**Analysis Generated By**: bkit Task Management System + gap-detector
**Co-Authored-By**: Claude Opus 4.5 <noreply@anthropic.com>
