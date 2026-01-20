# bkit 종합 개선 상세 설계서 (v1.2.1)

> **목적**: 08-COMPREHENSIVE-IMPROVEMENT-PLAN 기반 상세 설계 및 구현 명세
> **작성일**: 2026-01-20
> **기반 문서**: docs/01-plan/08-COMPREHENSIVE-IMPROVEMENT-PLAN.md
> **상태**: Design Phase

---

## 1. 현재 구현 분석

### 1.1 코드베이스 구조 현황

```
bkit-claude-code/
├── hooks/
│   ├── hooks.json              # 전역 Hooks 설정 (3개 이벤트)
│   └── session-start.sh        # SessionStart hook 스크립트
├── scripts/
│   ├── pre-write.sh            # Core: PreToolUse (Write|Edit) - 활성
│   ├── pdca-post-write.sh      # Core: PostToolUse (Write) - 활성
│   ├── phase5-design-post.sh   # Phase 5: Design Token 검증 - 미연결
│   ├── phase6-ui-post.sh       # Phase 6: Layer 분리 검증 - 미연결
│   ├── qa-pre-bash.sh          # QA: Bash 위험 명령 차단 - 부분 연결
│   ├── qa-stop.sh              # QA: 세션 정리 - 미연결
│   ├── gap-detector-post.sh    # Agent: Gap 분석 후 안내 - 비효과적
│   ├── analysis-stop.sh        # Agent: 분석 완료 안내 - 미연결
│   └── ... (기타 스크립트)
├── lib/
│   └── common.sh               # 공유 유틸리티 라이브러리
├── agents/
│   ├── gap-detector.md         # Gap 분석 Agent
│   ├── code-analyzer.md        # 코드 분석 Agent
│   ├── qa-monitor.md           # QA 모니터링 Agent
│   ├── design-validator.md     # 설계 검증 Agent
│   ├── pdca-iterator.md        # PDCA 반복 Agent
│   └── ... (11개 Agent)
└── skills/
    ├── bkit-rules/SKILL.md     # 핵심 규칙 Skill (hooks 정의됨)
    ├── phase-5-design-system/SKILL.md
    ├── zero-script-qa/SKILL.md
    └── ... (18개 Skill)
```

### 1.2 현재 Hooks 구현 상태

#### 1.2.1 hooks/hooks.json (현재)

```json
{
  "SessionStart": [{
    "once": true,
    "hooks": [{
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh"
    }]
  }],
  "PreToolUse": [{
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
    }]
  }],
  "PostToolUse": [{
    "matcher": "Write",
    "hooks": [{
      "type": "command",
      "command": "${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh"
    }]
  }]
}
```

#### 1.2.2 skills/bkit-rules/SKILL.md hooks (현재)

```yaml
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/pdca-post-write.sh"
```

**문제점**: hooks/hooks.json과 동일한 hooks가 중복 정의됨

#### 1.2.3 스크립트 연결 상태 매트릭스

| 스크립트 | 위치 | hooks.json | Skill/Agent | 상태 |
|---------|------|------------|-------------|------|
| session-start.sh | hooks/ | ✅ | - | 정상 |
| pre-write.sh | scripts/ | ✅ | bkit-rules | **중복** |
| pdca-post-write.sh | scripts/ | ✅ | bkit-rules | **중복** |
| phase5-design-post.sh | scripts/ | ❌ | phase-5-design-system | Skill에만 |
| phase6-ui-post.sh | scripts/ | ❌ | ❌ | **미연결** |
| qa-pre-bash.sh | scripts/ | ❌ | zero-script-qa | Skill에만 |
| qa-stop.sh | scripts/ | ❌ | zero-script-qa | Skill에만 |
| gap-detector-post.sh | scripts/ | ❌ | gap-detector | **비효과적** |
| analysis-stop.sh | scripts/ | ❌ | ❌ | **미연결** |

### 1.3 핵심 문제점 상세 분석

#### 1.3.1 output_block() 함수 문제

**파일**: `lib/common.sh:337-342`

```bash
# 현재 구현
output_block() {
    local reason="$1"
    cat << EOF
{"decision": "block", "hookSpecificOutput": {"reason": "$reason"}}
EOF
}
```

**문제점**:
1. `exit 2`가 없어서 PreToolUse에서 실제 block이 동작하지 않을 수 있음
2. JSON 형식이 `hookSpecificOutput.reason`인데, Claude Code 명세상 `reason`이 최상위에 있어야 함

**pre-write.sh의 block 처리** (scripts/pre-write.sh:93-100):

```bash
if [ "$SHOULD_BLOCK" = true ]; then
    ESCAPED_REASON=$(echo -e "$BLOCK_REASON" | sed 's/"/\\"/g' | tr '\n' ' ')
    cat << EOF
{"decision": "block", "reason": "$ESCAPED_REASON"}
EOF
    exit 0  # ← exit 0이 아닌 exit 2가 필요할 수 있음
fi
```

pre-write.sh는 올바른 JSON 형식(`"reason"` 최상위)을 사용하지만, exit code가 0임

#### 1.3.2 gap-detector PostToolUse Hook 비효과적

**파일**: `agents/gap-detector.md`

gap-detector Agent는 `permissionMode: plan`으로 설정되어 Write 도구 사용이 불가:
- PostToolUse (Write) hook이 정의되어 있어도 트리거되지 않음
- 분석 결과는 conversation에 출력되지, Write로 파일을 만들지 않음

**해결**: Stop hook으로 변경하여 Agent 종료 시 트리거

#### 1.3.3 Skill Frontmatter Hooks 중복

hooks/hooks.json과 skills/bkit-rules/SKILL.md에 동일한 hooks가 중복 정의:

```
hooks/hooks.json → PreToolUse (Write|Edit) → pre-write.sh
skills/bkit-rules/SKILL.md → PreToolUse (Write|Edit) → pre-write.sh
```

**결과**: 동일 스크립트가 2번 실행될 가능성 (실제 동작은 Claude Code 내부 로직에 따라 다름)

---

## 2. 상세 설계

### 2.1 Hooks 아키텍처 통합 설계

#### 2.1.1 목표 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Hooks 계층 구조 (v1.2.1)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Layer 1: Global Hooks (hooks/hooks.json) - 최소화                     │
│  └─ SessionStart: 세션 시작 시 1회 (레벨 감지, 웰컴 메시지)            │
│                                                                         │
│  Layer 2: Skill Hooks (skills/*/SKILL.md frontmatter)                  │
│  ├─ bkit-rules: PreToolUse/PostToolUse (PDCA 핵심 로직)               │
│  ├─ phase-5-design-system: PostToolUse (Design Token 검증)            │
│  ├─ phase-6-ui-integration: PostToolUse (Layer 분리 검증)              │
│  └─ zero-script-qa: PreToolUse (Bash)/Stop (QA 세션)                   │
│                                                                         │
│  Layer 3: Agent Hooks (agents/*.md frontmatter)                        │
│  ├─ gap-detector: Stop (분석 완료 안내)                                │
│  ├─ code-analyzer: Stop (분석 완료 안내)                               │
│  ├─ qa-monitor: PreToolUse (Bash)/PostToolUse/Stop                    │
│  ├─ design-validator: PreToolUse (검증 체크리스트)                     │
│  └─ pdca-iterator: Stop (반복 완료 안내)                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### 2.1.2 hooks/hooks.json 수정 설계

**목표**: SessionStart만 유지, 나머지는 Skill frontmatter로 이전

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "SessionStart": [
    {
      "once": true,
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
          "timeout": 5000
        }
      ]
    }
  ]
}
```

**이유**:
- SessionStart는 모든 세션에서 1회 실행되어야 하므로 전역 유지
- PreToolUse/PostToolUse는 bkit-rules Skill 로드 시에만 필요
- 중복 제거로 유지보수성 향상

### 2.2 lib/common.sh 수정 설계

#### 2.2.1 output_block() 함수 수정

**현재** (lib/common.sh:337-342):
```bash
output_block() {
    local reason="$1"
    cat << EOF
{"decision": "block", "hookSpecificOutput": {"reason": "$reason"}}
EOF
}
```

**수정 후**:
```bash
# Output block decision with reason
# Usage: output_block "Block reason"
# Note: Exits with code 2 to signal block to Claude Code
output_block() {
    local reason="$1"
    # Escape special characters for JSON
    local escaped_reason=$(echo "$reason" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' ' ')
    cat << EOF
{"decision": "block", "reason": "$escaped_reason"}
EOF
    exit 2
}
```

**변경 사항**:
1. JSON 형식: `hookSpecificOutput.reason` → `reason` (최상위)
2. `exit 2` 추가로 실제 block 동작 보장
3. 특수 문자 이스케이프 처리 추가

#### 2.2.2 output_allow() 함수 개선 (선택적)

**현재**:
```bash
output_allow() {
    local context="$1"
    if [ -n "$context" ]; then
        cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$context"}}
EOF
    else
        echo '{}'
    fi
}
```

**수정 후**:
```bash
output_allow() {
    local context="$1"
    if [ -n "$context" ]; then
        # Escape special characters for JSON
        local escaped_context=$(echo "$context" | sed 's/\\/\\\\/g' | sed 's/"/\\"/g' | tr '\n' '\\n')
        cat << EOF
{"decision": "allow", "hookSpecificOutput": {"additionalContext": "$escaped_context"}}
EOF
    else
        echo '{}'
    fi
}
```

**변경 사항**: 특수 문자 이스케이프 처리 개선

### 2.3 스크립트 수정 설계

#### 2.3.1 pre-write.sh 수정

**현재 block 처리** (scripts/pre-write.sh:93-100):
```bash
if [ "$SHOULD_BLOCK" = true ]; then
    ESCAPED_REASON=$(echo -e "$BLOCK_REASON" | sed 's/"/\\"/g' | tr '\n' ' ')
    cat << EOF
{"decision": "block", "reason": "$ESCAPED_REASON"}
EOF
    exit 0
fi
```

**수정 후**:
```bash
if [ "$SHOULD_BLOCK" = true ]; then
    output_block "$BLOCK_REASON"
    # output_block() handles exit 2
fi
```

**변경 사항**:
1. output_block() 함수 사용으로 일관성 확보
2. exit code가 2로 변경됨 (output_block 내부에서 처리)

### 2.4 Skill Hooks 연결 설계

#### 2.4.1 skills/phase-5-design-system/SKILL.md

**현재 hooks 섹션** (확인 필요):
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase5-design-post.sh"
          timeout: 5000
```

**검증 결과**: 이미 연결되어 있음 ✅

#### 2.4.2 skills/phase-6-ui-integration/SKILL.md

**현재**: hooks 없음

**추가할 hooks**:
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase6-ui-post.sh"
          timeout: 5000
```

#### 2.4.3 skills/zero-script-qa/SKILL.md

**현재 hooks 섹션** (확인 필요):
```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
          timeout: 5000
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
          timeout: 5000
```

**검증 결과**: 이미 연결되어 있음 ✅

### 2.5 Agent Hooks 활성화 설계

#### 2.5.1 agents/gap-detector.md

**현재**:
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-post.sh"
```

**문제**: Agent가 Write 도구를 사용하지 않으므로 트리거 안됨

**수정 후**:
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

#### 2.5.2 agents/code-analyzer.md

**현재**: hooks 없음

**추가할 hooks**:
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

#### 2.5.3 agents/qa-monitor.md

**현재**: hooks 없음

**추가할 hooks**:
```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
          timeout: 5000
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-monitor-post.sh"
          timeout: 5000
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
          timeout: 5000
```

#### 2.5.4 agents/design-validator.md

**현재**: hooks 없음

**추가할 hooks**:
```yaml
hooks:
  PreToolUse:
    - matcher: "Read"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/design-validator-pre.sh"
          timeout: 5000
```

#### 2.5.5 agents/pdca-iterator.md

**현재**: hooks 없음

**추가할 hooks**:
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

### 2.6 Semantic Matching 강화 설계

#### 2.6.1 Description 표준 패턴

```yaml
description: |
  [역할 한 줄 요약]
  [상세 설명 2-3문장]

  Use proactively when [조건].

  Triggers: [영어], [한국어], [일본어], [중국어]

  Do NOT use for: [제외 조건]
```

#### 2.6.2 Agent Description 개선 목록

| Agent | 현재 Triggers | 추가 Triggers |
|-------|--------------|---------------|
| gap-detector | gap analysis | 비교해, 확인해, 검증해, 일치하는지, 検証, 比较 |
| code-analyzer | code analysis | 코드 분석, 품질 검사, 보안 스캔, コード分析, 代码分析 |
| starter-guide | beginner | 처음, 간단한, simple, 入門, 简单 |
| pipeline-guide | pipeline | 순서, 뭘 먼저, 어디서부터, 手順, 从哪里开始 |
| design-validator | design validation | 설계 검토, 문서 확인, 仕様確認, 设计验证 |

---

## 3. 구현 명세

### 3.1 수정 대상 파일 목록

#### 3.1.1 P0 (즉시 수정)

| 파일 | 수정 내용 | 예상 변경량 |
|------|----------|------------|
| hooks/hooks.json | PreToolUse, PostToolUse 제거 | -15 lines |
| lib/common.sh | output_block() 수정, output_allow() 개선 | ~10 lines |
| scripts/pre-write.sh | output_block() 함수 사용으로 통일 | ~5 lines |
| skills/phase-6-ui-integration/SKILL.md | hooks 섹션 추가 | ~8 lines |

#### 3.1.2 P1 (우선 수정)

| 파일 | 수정 내용 | 예상 변경량 |
|------|----------|------------|
| agents/gap-detector.md | PostToolUse → Stop hook 변경 | ~5 lines |
| agents/code-analyzer.md | Stop hook 추가 | ~6 lines |
| agents/qa-monitor.md | PreToolUse/PostToolUse/Stop hooks 추가 | ~15 lines |
| agents/design-validator.md | PreToolUse hook 추가 | ~6 lines |
| agents/pdca-iterator.md | Stop hook 추가 | ~6 lines |

#### 3.1.3 P2 (개선 수정)

| 파일 | 수정 내용 |
|------|----------|
| agents/*.md (전체) | description Triggers 확장 |
| skills/*/SKILL.md (전체) | description Triggers 확장 |
| bkit-system/components/scripts/_scripts-overview.md | 문서 업데이트 |

### 3.2 상세 구현 코드

#### 3.2.1 hooks/hooks.json (수정 후)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-hooks.json",
  "SessionStart": [
    {
      "once": true,
      "hooks": [
        {
          "type": "command",
          "command": "${CLAUDE_PLUGIN_ROOT}/hooks/session-start.sh",
          "timeout": 5000
        }
      ]
    }
  ]
}
```

#### 3.2.2 lib/common.sh output_block() (수정 후)

```bash
# Output block decision with reason
# Usage: output_block "Block reason"
# Note: Exits with code 2 to signal block to Claude Code
# For PreToolUse hooks only - PostToolUse hooks should use output_allow()
output_block() {
    local reason="$1"
    # Escape special characters for JSON
    local escaped_reason
    escaped_reason=$(printf '%s' "$reason" | sed 's/\\/\\\\/g; s/"/\\"/g' | tr '\n' ' ' | sed 's/  */ /g')

    cat << EOF
{"decision": "block", "reason": "$escaped_reason"}
EOF
    exit 2
}
```

#### 3.2.3 scripts/pre-write.sh block 처리 (수정 후)

```bash
# ------------------------------------------------------------
# 2.5. Block if needed (with helpful guidance)
# ------------------------------------------------------------
if [ "$SHOULD_BLOCK" = true ]; then
    output_block "$BLOCK_REASON"
    # Note: output_block() calls exit 2, so code below won't execute
fi
```

#### 3.2.4 skills/phase-6-ui-integration/SKILL.md hooks 추가

```yaml
---
name: phase-6-ui-integration
description: |
  UI 구현 및 API 연동 가이드.
  프론트엔드-백엔드 통합, 상태 관리, API 클라이언트 아키텍처.

  Use proactively when user needs to connect frontend with backend APIs.

  Triggers: UI implementation, API integration, state management,
  UI 구현, API 연동, 상태 관리, UI実装, API連携, UI实现, API集成

  Do NOT use for: mockup creation, backend-only development
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase6-ui-post.sh"
          timeout: 5000
---
```

#### 3.2.5 agents/gap-detector.md hooks 수정

**현재**:
```yaml
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-post.sh"
```

**수정 후**:
```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

#### 3.2.6 agents/code-analyzer.md hooks 추가

```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

#### 3.2.7 agents/qa-monitor.md hooks 추가

```yaml
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
          timeout: 5000
  PostToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-monitor-post.sh"
          timeout: 5000
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
          timeout: 5000
```

#### 3.2.8 agents/pdca-iterator.md hooks 추가

```yaml
hooks:
  Stop:
    - hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
          timeout: 5000
```

---

## 4. 의존성 및 순서

### 4.1 구현 순서 (의존성 기반)

```
Phase 1: 기반 수정 (의존성 없음)
├── Step 1.1: lib/common.sh output_block() 수정
│   └── 이유: 다른 스크립트들이 이 함수를 사용
├── Step 1.2: hooks/hooks.json 최소화
│   └── 이유: 중복 제거
└── Step 1.3: scripts/pre-write.sh 수정
    └── 의존: Step 1.1 완료 후

Phase 2: Skill Hooks 연결
├── Step 2.1: skills/phase-6-ui-integration/SKILL.md hooks 추가
└── Step 2.2: (필요시) 다른 Skill hooks 검증

Phase 3: Agent Hooks 활성화
├── Step 3.1: agents/gap-detector.md hooks 수정
├── Step 3.2: agents/code-analyzer.md hooks 추가
├── Step 3.3: agents/qa-monitor.md hooks 추가
├── Step 3.4: agents/design-validator.md hooks 추가
└── Step 3.5: agents/pdca-iterator.md hooks 추가
    └── 모든 Agent 수정은 병렬 가능

Phase 4: Semantic Matching 강화
├── Step 4.1: Agent descriptions 업데이트
└── Step 4.2: Skill descriptions 업데이트
    └── 모든 description 수정은 병렬 가능

Phase 5: 문서 업데이트
├── Step 5.1: _scripts-overview.md 업데이트
└── Step 5.2: CHANGELOG.md 업데이트
```

### 4.2 롤백 계획

```
위험 수준별 롤백 전략:

Level 1 (lib/common.sh 수정 실패):
├── 증상: 모든 block 동작 실패
├── 진단: claude --debug로 hook 출력 확인
└── 롤백: git checkout lib/common.sh

Level 2 (hooks/hooks.json 수정 실패):
├── 증상: PreToolUse/PostToolUse hook 미실행
├── 진단: /hooks 명령으로 등록 확인
└── 롤백: git checkout hooks/hooks.json
    └── 참고: bkit-rules Skill에 동일 hooks 있으므로 Skill 로드 시 동작

Level 3 (Agent hooks 실패):
├── 증상: Agent 종료 후 안내 없음
├── 진단: Agent 실행 후 Stop hook 트리거 확인
└── 롤백: 해당 Agent frontmatter에서 hooks 섹션 제거
```

---

## 5. 테스트 계획

### 5.1 단위 테스트

#### 5.1.1 lib/common.sh output_block() 테스트

```bash
# 테스트 스크립트
#!/bin/bash
source lib/common.sh

# 테스트 1: JSON 형식 검증
output=$(output_block "Test reason")
echo "$output" | jq . >/dev/null 2>&1
[ $? -eq 0 ] && echo "✅ JSON valid" || echo "❌ JSON invalid"

# 테스트 2: exit code 검증
(output_block "Test")
[ $? -eq 2 ] && echo "✅ Exit code 2" || echo "❌ Wrong exit code"

# 테스트 3: 특수 문자 이스케이프
output=$(output_block 'Test "quoted" reason')
echo "$output" | jq -r '.reason' | grep -q 'quoted'
[ $? -eq 0 ] && echo "✅ Escaping works" || echo "❌ Escaping failed"
```

### 5.2 통합 테스트

#### 5.2.1 PreToolUse Hook 테스트

```bash
# 1. Claude Code 디버그 모드 실행
claude --debug --plugin-dir ./bkit-claude-code

# 2. Major Feature 작성 시도 (설계 문서 없이)
# 사용자 입력: "src/features/newFeature/index.ts에 새로운 인증 시스템 전체를 구현해줘"
# 기대 결과: Block 메시지 + PDCA 안내

# 3. Quick Fix 작성 시도
# 사용자 입력: "typo 수정"
# 기대 결과: 경고 없이 진행
```

#### 5.2.2 Agent Stop Hook 테스트

```bash
# 1. gap-detector Agent 실행
# 사용자 입력: "auth 기능 설계와 구현 비교해줘"

# 2. Agent 완료 후 Stop hook 트리거 확인
# 기대 결과: analysis-stop.sh 출력 (다음 단계 안내)
```

### 5.3 회귀 테스트

```
체크리스트:

□ SessionStart hook 정상 동작 (레벨 감지, 웰컴 메시지)
□ bkit-rules Skill 로드 시 PreToolUse/PostToolUse 동작
□ Design Token 검증 (phase-5-design-system Skill)
□ QA Bash 위험 명령 차단 (zero-script-qa Skill)
□ 기존 모든 /pdca-* 명령어 정상 동작
□ Agent 자동 호출 정상 동작
```

---

## 6. 성공 기준

### 6.1 정량적 기준

| 지표 | 현재 | 목표 | 측정 방법 |
|------|------|------|----------|
| Hooks 활성화 이벤트 | 3개 | 4개+ | hooks.json + Skill/Agent frontmatter 합계 |
| 스크립트 활용률 | 33% (6/18) | 80%+ | 연결된 스크립트 / 전체 스크립트 |
| Agent Hooks 활용 | 1개 | 5개+ | hooks 섹션 있는 Agent 수 |
| Hook 중복 | 2개 | 0개 | hooks.json과 Skill 간 중복 |

### 6.2 정성적 기준

- [ ] Major Feature 작성 시 설계 문서 없으면 Block 동작
- [ ] Agent 종료 시 다음 단계 자동 안내
- [ ] UI 컴포넌트 작성 시 Design Token 검증 자동 실행
- [ ] QA 세션 중 위험 명령 자동 차단

---

## 7. 위험 요소

### 7.1 기술적 위험

| 위험 | 가능성 | 영향 | 완화 방안 |
|------|--------|------|----------|
| output_block() exit 2가 예상대로 동작하지 않음 | 중 | 높음 | --debug 모드에서 충분히 테스트 |
| Skill frontmatter hooks 미지원 버전 | 낮음 | 높음 | Claude Code 버전 확인, 폴백 유지 |
| Stop hook이 SubagentStop과 충돌 | 낮음 | 중 | 각각 별도 테스트 |

### 7.2 운영적 위험

| 위험 | 가능성 | 영향 | 완화 방안 |
|------|--------|------|----------|
| 과도한 Block으로 UX 저하 | 중 | 중 | Task classification 임계값 조정 가능 |
| Hook 실행 시간 초과 | 낮음 | 낮음 | 모든 hook에 timeout: 5000 설정 |

---

## 8. 부록

### 8.1 관련 문서

| 문서 | 역할 |
|------|------|
| docs/01-plan/08-COMPREHENSIVE-IMPROVEMENT-PLAN.md | 계획 문서 |
| docs/04-HOOKS-AND-COMPONENTS-GUIDE.md | 공식 구현 가이드 |
| bkit-system/components/scripts/_scripts-overview.md | 스크립트 목록 |
| bkit-system/components/hooks/_hooks-overview.md | Hooks 이벤트 설명 |

### 8.2 Claude Code Hook Exit Codes

| Exit Code | 의미 |
|-----------|------|
| 0 | 성공 (allow 또는 no action) |
| 2 | Block (PreToolUse에서 tool 실행 차단) |
| 기타 | 오류 (hook 실패로 처리) |

### 8.3 JSON Response 형식

**Allow with context**:
```json
{
  "decision": "allow",
  "hookSpecificOutput": {
    "additionalContext": "Context message for Claude"
  }
}
```

**Block**:
```json
{
  "decision": "block",
  "reason": "Block reason shown to user"
}
```

**No action**:
```json
{}
```

---

*문서 버전: 1.0*
*작성일: 2026-01-20*
*작성자: Claude (with User)*
*상태: Design Phase*
