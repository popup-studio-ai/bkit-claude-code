# claude-code-v2166-enhancement Planning Document

> **Summary**: CC v2.1.64~v2.1.66 신규 기능을 bkit PDCA 워크플로우에 통합하여 v1.5.9로 릴리스
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: v1.5.8 → v1.5.9
> **Author**: bkit CTO Team
> **Date**: 2026-03-04
> **Status**: Draft
> **Based on**: claude-code-v2166-impact-analysis.report.md (12 ENH, 47 changes)

---

## 1. Overview

### 1.1 Purpose

Claude Code v2.1.64의 역대 최대급 릴리스(46건)에서 추가된 신규 기능을 bkit 플러그인에 통합하여 CTO Team 오케스트레이션, Hook 시스템, 스킬 인프라를 강화한다.

### 1.2 Background

- CC v2.1.64: 21 Features + 22 Bug Fixes (CHANGELOG 의도적 삭제, 코드 레벨 변경은 모두 활성)
- CC v2.1.66: 시스템 프롬프트 실험적 기능 롤백 (코드 변경 유지)
- bkit v1.5.8: CC v2.1.66과 100% 호환, 코드 변경 없이도 동작
- **고도화 목적**: 신규 API를 활용하여 CTO Team 효율성, Hook 정밀도, 스킬 유지보수성 향상

### 1.3 Related Documents

- Impact Analysis: `docs/04-report/features/claude-code-v2166-impact-analysis.report.md`
- Previous Enhancement: `docs/archive/2026-02/cc-v2163-enhancement/cc-v2163-enhancement.report.md`
- bkit Config: `bkit.config.json` (v1.5.8)

---

## 2. Scope

### 2.1 In Scope

- [x] ENH-60: `InstructionsLoaded` hook event 활용 (신규 hook handler)
- [x] ENH-61: `${CLAUDE_SKILL_DIR}` 변수 스킬 전반 적용
- [x] ENH-62: hook event `agent_id`/`agent_type` 필드 활용
- [x] ENH-63: `TeammateIdle`/`TaskCompleted` `continue: false` 활용
- [x] ENH-64: `/reload-plugins` 개발 워크플로우 문서화
- [x] ENH-65: `includeGitInstructions` PDCA 최적화 인지
- [x] ENH-66: `CLAUDE_CODE_AUTO_MEMORY_PATH` 활용 가이드
- [x] ENH-67: `#30586` PostToolUse 출력 중복 모니터링
- [x] ENH-68: 공식 문서 URL 업데이트 (docs.anthropic.com → code.claude.com)
- [x] ENH-69: Agent `background: true` CTO Team 활용
- [x] ENH-70: Skill `context: fork` 독립 실행 활용 (검토)
- [x] ENH-71: `WorktreeCreate`/`WorktreeRemove` 플러그인 hook 활용 (검토)

### 2.2 Out of Scope

- CC 시스템 프롬프트 실험적 기능 통합 (Verification Specialist, Output Efficiency, Ultraplan — v2.1.66에서 롤백됨)
- `claude server` / `claude remote-control server` 관련 기능 (F-01~F-03)
- OAuth, Enterprise, Voice STT 관련 변경 (F-16~F-21)
- 신규 스킬 생성 (기존 스킬 내에서 처리)
- bkit.config.json 스키마 변경 (v1.5.8 필드 유지)

---

## 3. Requirements

### 3.1 Functional Requirements

#### Phase 1: Hook System Enhancement (HIGH Priority)

| ID | Requirement | Priority | ENH | Status |
|----|-------------|----------|-----|--------|
| FR-01 | `InstructionsLoaded` hook handler 신규 등록. CLAUDE.md 또는 `.claude/rules/*.md` 로드 시 bkit 컨텍스트 보강 메시지 주입 | High | ENH-60 | Pending |
| FR-02 | `hooks.json`에 `InstructionsLoaded` 이벤트 등록 (bkit hook events 10→11) | High | ENH-60 | Pending |
| FR-03 | 모든 hook handler에서 `agent_id`/`agent_type` 필드를 직접 활용하도록 리팩터링 (현재: fallback chain으로 간접 사용) | High | ENH-62 | Pending |
| FR-04 | `subagent-start-handler.js`에서 `hookContext.agent_id` 직접 사용 (기존: `agent_name \|\| agent_id \|\| tool_input?.name` fallback) | High | ENH-62 | Pending |
| FR-05 | `subagent-stop-handler.js`에서 `hookContext.agent_id` 직접 사용 (기존: `agent_name \|\| agent_id` fallback) | High | ENH-62 | Pending |
| FR-06 | `team-idle-handler.js`에서 `hookContext.agent_id`/`agent_type` 활용 + `continue: false` 반환 기능 추가 | High | ENH-62, ENH-63 | Pending |
| FR-07 | `pdca-task-completed.js`에서 `hookContext.agent_id`/`agent_type` 활용 + `continue: false` 반환 기능 추가 | High | ENH-62, ENH-63 | Pending |
| FR-08 | CTO Team 자동 종료 조건 정의: 모든 태스크 완료 시 `TeammateIdle` hook에서 `continue: false` 반환하여 teammate 자동 종료 | High | ENH-63 | Pending |

#### Phase 2: Skill Infrastructure Enhancement (HIGH Priority)

| ID | Requirement | Priority | ENH | Status |
|----|-------------|----------|-----|--------|
| FR-09 | 27개 스킬의 SKILL.md에서 supporting 파일 참조 시 `${CLAUDE_SKILL_DIR}` 변수 활용 패턴 도입 | High | ENH-61 | Pending |
| FR-10 | 기존 `${PLUGIN_ROOT}` imports는 유지하면서, 스킬 자체 디렉토리 내 파일 참조에 `${CLAUDE_SKILL_DIR}` 추가 | High | ENH-61 | Pending |

#### Phase 3: Documentation & Awareness (MEDIUM Priority)

| ID | Requirement | Priority | ENH | Status |
|----|-------------|----------|-----|--------|
| FR-11 | `session-start.js`에 v1.5.9 Enhancements 섹션 추가 (CC v2.1.64 hook/skill 신기능 안내) | Medium | ENH-64~68 | Pending |
| FR-12 | `/reload-plugins` 명령어 개발 워크플로우 문서화 (세션 재시작 없이 플러그인 변경 반영) | Medium | ENH-64 | Pending |
| FR-13 | `includeGitInstructions` 설정 존재 인지 (bkit PDCA commit 워크플로우 최적화 옵션) | Medium | ENH-65 | Pending |
| FR-14 | `CLAUDE_CODE_AUTO_MEMORY_PATH` env var 안내 (bkit memory와 CC auto-memory 경로 관리) | Medium | ENH-66 | Pending |
| FR-15 | CC 공식 문서 URL 변경 반영 (docs.anthropic.com → code.claude.com) | Medium | ENH-68 | Pending |
| FR-16 | `#30586` PostToolUse 출력 중복 이슈 모니터링 코멘트 추가 | Medium | ENH-67 | Pending |

#### Phase 4: Agent Enhancement (LOW Priority — 검토 후 선택적 구현)

| ID | Requirement | Priority | ENH | Status |
|----|-------------|----------|-----|--------|
| FR-17 | CTO Team 리서치 에이전트에 `background: true` frontmatter 옵션 검토 및 적용 | Low | ENH-69 | Pending |
| FR-18 | `gap-detector`, `code-analyzer` 외 추가 에이전트에 `context: fork` 적용 검토 | Low | ENH-70 | Pending |
| FR-19 | `WorktreeCreate`/`WorktreeRemove` hook handler 검토 (v2.1.64에서 플러그인 hook 수정 확인됨) | Low | ENH-71 | Pending |

#### Phase 5: Version & Release

| ID | Requirement | Priority | ENH | Status |
|----|-------------|----------|-----|--------|
| FR-20 | `bkit.config.json` version 1.5.8 → 1.5.9 업데이트 | High | - | Pending |
| FR-21 | `.claude-plugin/plugin.json` version 1.5.8 → 1.5.9 업데이트 | High | - | Pending |
| FR-22 | `hooks.json` description 버전 업데이트 | High | - | Pending |
| FR-23 | `session-start.js` JSDoc 헤더에 v1.5.9 Changes 추가 | High | - | Pending |
| FR-24 | CC 권장 버전 v2.1.63 → v2.1.66 업데이트 | High | - | Pending |
| FR-25 | `lib/common.js` 코멘트 export 카운트 업데이트 (현재 코멘트 staleness 수정) | Medium | - | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Backward Compatibility | v1.5.8 대비 breaking change 0건 | Gap Analysis |
| CC Compatibility | CC v2.1.64~v2.1.66 모두 호환 | 기능 테스트 |
| Performance | Hook handler 추가로 인한 지연 < 100ms | timeout 설정 확인 |
| Code Quality | 잔여 하드코딩 경로 증가 0건 | grep 확인 |

---

## 4. Implementation Design

### 4.1 Phase 1: Hook System Enhancement

#### 4.1.1 InstructionsLoaded Hook (ENH-60, FR-01~02)

**신규 파일**: `scripts/instructions-loaded-handler.js`

```
용도: CLAUDE.md 또는 .claude/rules/*.md가 컨텍스트에 로드될 때 bkit 보강 정보 주입
트리거 시점: CC가 instruction 파일을 context window에 추가할 때

hookContext 제공 필드 (CC v2.1.64):
  - file_path: 로드된 instruction 파일 경로
  - (agent_id, agent_type: v2.1.64 추가 필드)

출력:
  - systemMessage: bkit 컨텍스트 보강 (현재 PDCA 상태, 활성 피처 등)
  - 조건부: CLAUDE.md 로드 시에만 보강, rules 파일은 pass-through
```

**hooks.json 변경**:
```json
"InstructionsLoaded": [
  {
    "hooks": [
      {
        "type": "command",
        "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/instructions-loaded-handler.js",
        "timeout": 3000
      }
    ]
  }
]
```

**변경 파일**: 2개
- `scripts/instructions-loaded-handler.js` (신규)
- `hooks/hooks.json` (InstructionsLoaded 이벤트 추가)

#### 4.1.2 agent_id/agent_type 활용 (ENH-62, FR-03~05)

**대상 파일 4개**:

| 파일 | 현재 패턴 | 변경 후 |
|------|----------|---------|
| `scripts/subagent-start-handler.js` | `agent_name \|\| agent_id \|\| tool_input?.name` (L49-52) | `agent_id` 직접 사용 + `agent_name` fallback |
| `scripts/subagent-stop-handler.js` | `agent_name \|\| agent_id` (L40-42) | `agent_id` 직접 사용 + `agent_name` fallback |
| `scripts/team-idle-handler.js` | `teammate_id \|\| agent_id \|\| 'unknown'` (L44) | `agent_id` 우선 + `agent_type` 활용 |
| `scripts/pdca-task-completed.js` | `agent_id` 미사용 | `agent_id`/`agent_type` 필드 추가 활용 |

**변경 원칙**:
- CC v2.1.64에서 모든 hook event에 `agent_id`/`agent_type`이 **공식 필드**로 추가됨
- 기존 fallback chain은 **호환성을 위해 유지**하되, `agent_id`를 **우선 순위 최상위**로 이동
- `agent_type`을 새로 활용하여 에이전트 종류별 차별화 처리 (예: CTO 에이전트와 일반 에이전트 구분)

**hookSpecificOutput에 추가되는 필드**:
```javascript
hookSpecificOutput: {
  // 기존 필드 유지
  hookEventName: "SubagentStart",
  agentName: "...",
  // 신규 필드
  agentId: hookContext.agent_id || null,
  agentType: hookContext.agent_type || null,
}
```

#### 4.1.3 continue: false 활용 (ENH-63, FR-06~08)

**대상 파일 2개**:

**`scripts/team-idle-handler.js`** 변경:
```
현재: hookSpecificOutput 반환 후 process.exit(0)
변경: 조건부로 hookSpecificOutput.continue = false 설정

자동 종료 조건:
1. 해당 teammate에 할당된 태스크가 모두 completed 상태
2. 대기 중인 unblocked 태스크가 없음
3. CTO Team 종료 시그널이 활성화된 경우

구현:
- pdca-status.json에서 현재 피처의 PDCA phase 확인
- phase가 "completed" 또는 "archived"이면 continue: false
- 모든 active tasks가 completed이면 continue: false
```

**`scripts/pdca-task-completed.js`** 변경:
```
현재: 다음 PDCA phase 안내만 제공
변경: 마지막 태스크 완료 시 continue: false 옵션 추가

자동 종료 조건:
1. 해당 teammate의 모든 할당 태스크 완료
2. 남은 PDCA phase가 없는 경우 (report 완료 후)
```

**중요**: `continue: false`는 **hookSpecificOutput** 내에 위치하며, CC v2.1.64의 `TeammateIdle`/`TaskCompleted` hook에서만 동작.

### 4.2 Phase 2: Skill Infrastructure Enhancement

#### 4.2.1 ${CLAUDE_SKILL_DIR} 활용 (ENH-61, FR-09~10)

**현황 분석**:
- 27개 스킬 중 `imports:` frontmatter에서 `${PLUGIN_ROOT}` 사용
- `${PLUGIN_ROOT}`: 플러그인 루트 디렉토리 (bkit-claude-code/)
- `${CLAUDE_SKILL_DIR}`: 해당 스킬의 SKILL.md가 위치한 디렉토리 (신규, CC v2.1.64)

**적용 전략**:
```
기존 (유지): 공유 템플릿, 공유 라이브러리 참조
  imports:
    - ${PLUGIN_ROOT}/templates/plan.template.md     # 공유 리소스

신규 (추가): 스킬 로컬 파일 참조가 필요한 경우
  imports:
    - ${CLAUDE_SKILL_DIR}/local-patterns.md          # 스킬 전용 리소스
```

**영향 분석**:
- 현재 27개 스킬 중 `${CLAUDE_SKILL_DIR}`이 **즉시 필요한 스킬**: 0개 (모든 imports가 공유 템플릿)
- **활용 가능한 패턴**: 향후 스킬별 로컬 패턴 파일 분리 시 사용
- **v1.5.9 범위**: SessionStart 안내문에 `${CLAUDE_SKILL_DIR}` 사용법 문서화 + 1~2개 파일럿 스킬에 적용 검토

**파일럿 대상 스킬**:
| 스킬 | 현재 상태 | ${CLAUDE_SKILL_DIR} 활용 |
|------|----------|--------------------------|
| `skills/pdca/` | 5개 template imports (${PLUGIN_ROOT}) | SKILL.md 내 가이드 텍스트에서 자기 디렉토리 참조 |
| `skills/bkit-templates/` | body에 ${CLAUDE_PLUGIN_ROOT} 경로 문서화 | ${CLAUDE_SKILL_DIR} 로 간결화 가능 |

### 4.3 Phase 3: Documentation & Awareness

#### 4.3.1 session-start.js 업데이트 (FR-11~16)

**추가 위치**: `hooks/session-start.js` — v1.5.8 Enhancements 섹션 상단

```javascript
// v1.5.9: CC v2.1.64~v2.1.66 Enhancement Integration
additionalContext += `\n## v1.5.9 Enhancements (CC v2.1.66 Integration)\n`;
additionalContext += `- InstructionsLoaded hook: CLAUDE.md 로드 시 bkit 컨텍스트 자동 보강\n`;
additionalContext += `- Hook agent_id/agent_type: 모든 hook에서 에이전트 식별 가능\n`;
additionalContext += `- TeammateIdle/TaskCompleted continue:false: CTO Team 자동 종료 제어\n`;
additionalContext += `- ${CLAUDE_SKILL_DIR}: 스킬 내 자기 디렉토리 참조 (CC v2.1.64+)\n`;
additionalContext += `- /reload-plugins: 세션 재시작 없이 플러그인 변경 반영 (CC v2.1.64+)\n`;
additionalContext += `- CC recommended version: v2.1.63 -> v2.1.66\n`;
additionalContext += `\n`;
```

#### 4.3.2 개별 문서화 항목

| ENH | 위치 | 변경 내용 |
|-----|------|----------|
| ENH-64 | `session-start.js` | `/reload-plugins` 사용법 안내 추가 (bkit 개발자 대상) |
| ENH-65 | `session-start.js` | `includeGitInstructions` 설정 인지 (참고 정보) |
| ENH-66 | `session-start.js` | `CLAUDE_CODE_AUTO_MEMORY_PATH` env var 안내 |
| ENH-67 | `scripts/unified-write-post.js` 또는 관련 PostToolUse handler | `#30586` 이슈 모니터링 코멘트 |
| ENH-68 | `skills/claude-code-learning/SKILL.md`, `docs/` 내 참조 | URL docs.anthropic.com → code.claude.com 치환 |

### 4.4 Phase 4: Agent Enhancement (선택적)

#### 4.4.1 background: true (ENH-69, FR-17)

**검토 대상 에이전트**:
| 에이전트 | 현재 | 변경 검토 |
|----------|------|----------|
| 리서치 전용 에이전트 (CTO Team 내) | background 미설정 | `background: true` 추가 시 병렬성 향상 |

**주의사항**: `background: true`는 v2.1.49에서 도입된 agent frontmatter 기능. CTO Team 에이전트들은 Agent tool의 `run_in_background` 파라미터로 이미 제어 가능하므로, frontmatter 레벨 설정의 **추가 가치** 확인 필요.

**판정**: 실제 테스트 후 결정. frontmatter `background: true`가 `run_in_background` 파라미터와 동일 효과라면 중복이므로 **SKIP**.

#### 4.4.2 context: fork 확장 (ENH-70, FR-18)

**현재 context: fork 에이전트**: gap-detector, design-validator (2개)

**확장 검토 대상**:
| 에이전트 | 현재 mode | fork 적합성 | 판정 |
|----------|----------|------------|------|
| code-analyzer | plan | 적합 (읽기 전용 분석) | 검토 |
| report-generator | plan | 부적합 (파일 생성 필요) | SKIP |
| qa-monitor | acceptEdits | 부적합 (Bash 사용) | SKIP |

**판정**: code-analyzer에 `context: fork` 추가 검토. 나머지는 현재 mode 유지.

#### 4.4.3 WorktreeCreate/WorktreeRemove (ENH-71, FR-19)

**현황**: CC v2.1.64에서 플러그인 hook으로 정상 동작 확인됨 (B-10 수정)
**bkit 현재**: 미사용 (worktree 기반 PDCA 미구현)
**판정**: v1.5.9에서는 **인지만** (session-start.js에 사용 가능 안내). 실제 hook handler 등록은 worktree PDCA 수요 발생 시.

### 4.5 Phase 5: Version & Release

| 파일 | 변경 |
|------|------|
| `bkit.config.json` | version: "1.5.8" → "1.5.9" |
| `.claude-plugin/plugin.json` | version: "1.5.8" → "1.5.9" |
| `hooks/hooks.json` | description: v1.5.8 → v1.5.9, InstructionsLoaded 추가 |
| `hooks/session-start.js` | JSDoc header v1.5.9 Changes, CC 권장 버전 v2.1.66 |
| `lib/common.js` | export 카운트 코멘트 정정 |

---

## 5. File Change Summary

### 5.1 Phase별 파일 변경

| # | 파일 | 변경 유형 | Phase | ENH |
|---|------|----------|:-----:|-----|
| 1 | `scripts/instructions-loaded-handler.js` | **신규** | 1 | ENH-60 |
| 2 | `hooks/hooks.json` | 수정 (InstructionsLoaded 추가 + 버전) | 1, 5 | ENH-60 |
| 3 | `scripts/subagent-start-handler.js` | 수정 (agent_id/agent_type 우선화) | 1 | ENH-62 |
| 4 | `scripts/subagent-stop-handler.js` | 수정 (agent_id/agent_type 우선화) | 1 | ENH-62 |
| 5 | `scripts/team-idle-handler.js` | 수정 (agent_id/agent_type + continue:false) | 1 | ENH-62, 63 |
| 6 | `scripts/pdca-task-completed.js` | 수정 (agent_id/agent_type + continue:false) | 1 | ENH-62, 63 |
| 7 | `hooks/session-start.js` | 수정 (v1.5.9 안내 + JSDoc + CC 권장 버전) | 3, 5 | ENH-64~68 |
| 8 | `skills/claude-code-learning/SKILL.md` | 수정 (URL 업데이트) | 3 | ENH-68 |
| 9 | `bkit.config.json` | 수정 (version bump) | 5 | - |
| 10 | `.claude-plugin/plugin.json` | 수정 (version bump) | 5 | - |
| 11 | `lib/common.js` | 수정 (코멘트 staleness 수정) | 5 | - |

### 5.2 선택적 변경 (Phase 4 — 검토 후 결정)

| # | 파일 | 변경 유형 | Phase | ENH |
|---|------|----------|:-----:|-----|
| 12 | `skills/pdca/SKILL.md` | 수정 (${CLAUDE_SKILL_DIR} 파일럿) | 2 | ENH-61 |
| 13 | `skills/bkit-templates/SKILL.md` | 수정 (${CLAUDE_SKILL_DIR} 경로 간결화) | 2 | ENH-61 |
| 14 | `.claude/agents/code-analyzer.md` | 수정 (context: fork 검토) | 4 | ENH-70 |

### 5.3 변경 요약

| 구분 | 파일 수 |
|------|--------:|
| **확정 변경** | 11개 (신규 1 + 수정 10) |
| **선택적 변경** | 최대 3개 |
| **총 최대** | 14개 |

---

## 6. Implementation Phases & CTO Team Strategy

### 6.1 구현 순서

```
Phase 1: Hook System Enhancement (HIGH — 핵심)
  ├── P1-A: InstructionsLoaded handler 신규 (FR-01~02)
  ├── P1-B: agent_id/agent_type 리팩터링 (FR-03~05)
  └── P1-C: continue:false 구현 (FR-06~08)

Phase 2: Skill Infrastructure (HIGH — 검토 후 선택적)
  └── P2-A: ${CLAUDE_SKILL_DIR} 파일럿 (FR-09~10)

Phase 3: Documentation & Awareness (MEDIUM)
  ├── P3-A: session-start.js v1.5.9 안내 (FR-11~14)
  ├── P3-B: URL 업데이트 (FR-15)
  └── P3-C: #30586 모니터링 코멘트 (FR-16)

Phase 4: Agent Enhancement (LOW — 선택적)
  ├── P4-A: background:true 검토 (FR-17)
  ├── P4-B: context:fork 확장 검토 (FR-18)
  └── P4-C: WorktreeCreate/Remove 인지 (FR-19)

Phase 5: Version & Release (필수)
  ├── P5-A: version bump (FR-20~22)
  ├── P5-B: JSDoc + CC 권장 버전 (FR-23~24)
  └── P5-C: common.js 코멘트 수정 (FR-25)
```

### 6.2 CTO Team 구성 (Dynamic Level — 3 teammates)

| 역할 | 담당 Phase | 파일 | 모델 |
|------|-----------|------|------|
| **hook-enhancer** | Phase 1 (P1-A, P1-B, P1-C) | 6 files | sonnet |
| **doc-updater** | Phase 2, 3 (P2-A, P3-A~C) | 4 files | sonnet |
| **release-manager** | Phase 4, 5 (P4-A~C, P5-A~C) | 4 files | sonnet |
| **team-lead** | 전체 조율 + Gap Analysis | - | opus |

### 6.3 의존 관계

```
P1-A (InstructionsLoaded) ─────────────┐
P1-B (agent_id/agent_type) ────────────┤── P5-A (version bump)
P1-C (continue:false) ─────────────────┤
P2-A (${CLAUDE_SKILL_DIR}) ────────────┤
P3-A (session-start docs) ─────────────┤
P3-B (URL update) ─────────────────────┤
P3-C (#30586 monitor) ─────────────────┤
P4-A~C (agent review) ─────────────────┘
```

Phase 1/2/3/4는 **병렬 실행 가능**. Phase 5는 모든 Phase 완료 후 실행.

---

## 7. Success Criteria

### 7.1 Definition of Done

- [ ] 모든 FR (25개) 구현 또는 판정 완료 (SKIP 사유 명시)
- [ ] Gap Analysis Match Rate ≥ 90%
- [ ] Breaking changes 0건
- [ ] hooks.json에 InstructionsLoaded 이벤트 등록
- [ ] bkit hook events 10→11 (전체 18 중 11 = 61.1%)
- [ ] CC 권장 버전 v2.1.66 반영
- [ ] version 1.5.9 동기화 (bkit.config.json, plugin.json, hooks.json)

### 7.2 Quality Criteria

- [ ] 기존 기능 회귀 0건
- [ ] Hook handler 응답 시간 < timeout (3000~5000ms)
- [ ] `continue: false` 반환 시 teammate 정상 종료 확인
- [ ] `agent_id`/`agent_type` 필드가 CC v2.1.63 이하에서도 graceful fallback

---

## 8. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| `InstructionsLoaded` hook이 CC v2.1.63 이하에서 미지원 | Medium | Medium | hooks.json에 등록해도 CC가 해당 이벤트를 발생시키지 않으면 무시됨. 에러 없음 |
| `continue: false` 반환 시 teammate가 즉시 종료되어 진행 중인 작업 손실 | High | Low | 종료 전 in_progress 태스크 확인 로직 추가. 태스크가 있으면 continue: true 유지 |
| `agent_id`가 CC v2.1.63 이하에서 undefined | Low | Low | 기존 fallback chain 유지 (`agent_name \|\| agent_id \|\| 'unknown'`) |
| `${CLAUDE_SKILL_DIR}` CC v2.1.63 이하에서 미치환 | Medium | Medium | v1.5.9에서는 문서화만, 실제 스킬 imports에는 파일럿만 적용 |
| `#29548` ExitPlanMode regression 미수정 | High | High | v1.5.9 코드 변경과 무관. plan mode 에이전트 7개의 기존 동작에 영향 없음 |
| `#30586` PostToolUse 출력 중복 | Medium | Medium | bkit PostToolUse hook에서 JSON 파싱 전 중복 체크 추가 고려 |

---

## 9. ENH Opportunity Mapping

### 9.1 이전 ENH 현황

| ENH 범위 | 상태 | bkit 버전 |
|----------|------|----------|
| ENH-01 ~ ENH-31 | Historical | v1.5.0 ~ v1.5.5 |
| ENH-32 ~ ENH-51 | Implemented/Deferred | v1.5.6 ~ v1.5.7 |
| ENH-52 ~ ENH-55 | Implemented | v1.5.7 (/simplify + /batch + HTTP hooks) |
| ENH-56 ~ ENH-59 | Deferred (v2.1.63 report) | - |
| **ENH-60 ~ ENH-71** | **v1.5.9 대상** | **v1.5.9** |

### 9.2 v1.5.9 ENH 실행 계획

| ENH | 설명 | Priority | Phase | 판정 |
|-----|------|:--------:|:-----:|:----:|
| **ENH-60** | InstructionsLoaded hook 활용 | HIGH | 1 | **IMPLEMENT** |
| **ENH-61** | ${CLAUDE_SKILL_DIR} 스킬 적용 | HIGH | 2 | **PILOT** (문서화 + 파일럿 1~2개) |
| **ENH-62** | agent_id/agent_type 활용 | HIGH | 1 | **IMPLEMENT** |
| **ENH-63** | continue:false 활용 | HIGH | 1 | **IMPLEMENT** |
| **ENH-64** | /reload-plugins 문서화 | MEDIUM | 3 | **DOCUMENT** |
| **ENH-65** | includeGitInstructions 인지 | MEDIUM | 3 | **DOCUMENT** |
| **ENH-66** | AUTO_MEMORY_PATH 가이드 | MEDIUM | 3 | **DOCUMENT** |
| **ENH-67** | #30586 모니터링 | MEDIUM | 3 | **MONITOR** |
| **ENH-68** | 공식 문서 URL 업데이트 | MEDIUM | 3 | **IMPLEMENT** |
| **ENH-69** | background:true 검토 | LOW | 4 | **REVIEW** (구현 미확정) |
| **ENH-70** | context:fork 확장 검토 | LOW | 4 | **REVIEW** (구현 미확정) |
| **ENH-71** | WorktreeCreate/Remove 인지 | LOW | 4 | **DEFER** (수요 발생 시) |

### 9.3 구현 분류 요약

| 분류 | 항목 수 | ENH |
|------|--------:|-----|
| **IMPLEMENT** (코드 구현) | 4 | ENH-60, 62, 63, 68 |
| **PILOT** (파일럿 적용) | 1 | ENH-61 |
| **DOCUMENT** (문서화) | 3 | ENH-64, 65, 66 |
| **MONITOR** (모니터링) | 1 | ENH-67 |
| **REVIEW** (검토 후 결정) | 2 | ENH-69, 70 |
| **DEFER** (보류) | 1 | ENH-71 |
| **합계** | 12 | ENH-60 ~ ENH-71 |

---

## 10. CC Compatibility Matrix

### 10.1 버전별 기능 지원

| 기능 | CC v2.1.63 | CC v2.1.64+ | bkit v1.5.9 대응 |
|------|:----------:|:-----------:|:-----------------:|
| InstructionsLoaded hook | ❌ | ✅ | 미지원 시 무시 (에러 없음) |
| agent_id/agent_type in hooks | ❌ | ✅ | fallback chain으로 graceful degradation |
| continue: false | ❌ | ✅ | 미지원 시 필드 무시 (기존 동작 유지) |
| ${CLAUDE_SKILL_DIR} | ❌ | ✅ | 미치환 시 literal string (문서화만) |
| /reload-plugins | ❌ | ✅ | 문서화만 (코드 의존 없음) |
| includeGitInstructions | ❌ | ✅ | 인지만 (코드 의존 없음) |

### 10.2 Graceful Degradation 전략

bkit v1.5.9는 CC v2.1.64+ 에서 **최적 동작**하지만, CC v2.1.63 이하에서도 **100% 호환**:

1. **InstructionsLoaded**: CC가 이벤트를 발생시키지 않으면 handler 미실행 → 기존 SessionStart 기반 초기화 유지
2. **agent_id/agent_type**: undefined 시 기존 fallback chain (`agent_name || tool_input?.name`) 동작
3. **continue: false**: CC가 이 필드를 인식하지 못하면 무시 → teammate 기존대로 동작
4. **${CLAUDE_SKILL_DIR}**: 미치환 시 literal string → imports에는 사용하지 않으므로 무해

---

## 11. Monitoring & Known Issues

### 11.1 계속 모니터링 대상

| Issue | Priority | 설명 | bkit 영향 |
|-------|:--------:|------|-----------|
| **#29548** | HIGH | ExitPlanMode regression | plan mode 에이전트 7개 |
| **#30586** | MEDIUM | PostToolUse 출력 중복 | bkit PostToolUse hook |
| **#25131** | MEDIUM | Agent Teams lifecycle | CTO Team 안정성 |
| **#29423** | MEDIUM | CLAUDE.md 서브에이전트 로딩 | 프로젝트 설정 상속 |

### 11.2 v2.1.64에서 수정된 이슈 (모니터링 종료)

| Issue | 상태 | 설명 |
|-------|------|------|
| **#29547** | CLOSED | AskUserQuestion empty in plugin skills |
| **#29520** | CLOSED | Plugin skills duplicate |
| **#29441** | CLOSED | Agent skills not preloaded for teammates |

---

## 12. Next Steps

1. [ ] Design 문서 작성 (`/pdca design claude-code-v2166-enhancement`)
2. [ ] CTO Team 구성 및 병렬 구현
3. [ ] Gap Analysis 실행
4. [ ] Completion Report 생성

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-04 | Initial draft — 12 ENH (ENH-60~71), 25 FR, 5 Phases | bkit CTO Team |
