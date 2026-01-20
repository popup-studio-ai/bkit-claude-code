# bkit 종합 개선 계획 (v1.2.1)

> **목적**: 04-HOOKS-AND-COMPONENTS-GUIDE 기반 구현 완성도 검증 및 자동화 강화
> **작성일**: 2026-01-20
> **기반 문서**:
> - docs/04-HOOKS-AND-COMPONENTS-GUIDE.md
> - docs/01-plan/01-HOOKS-REFACTOR-PLAN.md
> - docs/01-plan/02-BKIT-AUTOMATION-IMPROVEMENT-PLAN.md
> **상태**: Plan Phase

---

## 1. Executive Summary

### 1.1 핵심 문제

사용자의 핵심 피드백:
> "사용자가 지시를 하지 않는 이상 문서 및 설계서 기반으로 코드베이스 구현을 자동으로 완벽하게 하지 않는것 같아"

**현재 상태 진단:**

| 영역 | 설계 의도 | 현재 구현 | Gap |
|------|----------|----------|-----|
| **Hooks** | 6개 이벤트 활용 | 3개만 활성화 (SessionStart, PreToolUse, PostToolUse) | 50% |
| **자동 설계 확인** | Write 전 설계 문서 자동 확인 | 구현됨 (pre-write.sh) | ✅ |
| **Gap Analysis 제안** | Write 후 자동 제안 | 구현됨 (pdca-post-write.sh) | ✅ |
| **Agent 자동 호출** | Semantic matching 기반 | 부분 동작 (description 개선 필요) | 60% |
| **PDCA 강제 적용** | Major Feature에 설계 필수 | 경고만 (block 없음) | 70% |
| **Phase별 Hooks** | 9단계별 검증 | 스크립트만 존재 (미연결) | 30% |

### 1.2 개선 목표

```
┌─────────────────────────────────────────────────────────────────┐
│                    v1.2.1 개선 목표                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  현재 상태:                                                      │
│  ├─ Core Hooks (3개) 동작 중 ✅                                 │
│  ├─ Phase Scripts (6개) 미연결 ⚠️                               │
│  ├─ Agent Hooks (3개) 부분 구현 ⚠️                              │
│  └─ Semantic Matching 60% 정확도                                │
│                                                                 │
│  목표 상태:                                                      │
│  ├─ Core Hooks + Phase Hooks 통합 (Skill frontmatter 활용)     │
│  ├─ Agent Hooks 전면 활성화 (Stop hook 안정화)                  │
│  ├─ Semantic Matching 90%+ 정확도 (Trigger 키워드 확장)         │
│  └─ Major Feature → 설계 미작성 시 block (선택적)               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. 현재 구현 상태 분석

### 2.1 컴포넌트 현황

| 컴포넌트 | 개수 | 상태 | 활용도 |
|---------|------|------|--------|
| **Skills** | 18개 | ✅ 정상 | 높음 |
| **Agents** | 11개 | ⚠️ hooks 미활용 | 중간 |
| **Commands** | 18개 | ✅ 정상 | 높음 |
| **Scripts** | 18개 (legacy 포함) | ⚠️ 일부 미연결 | 중간 |
| **Templates** | 15개 | ✅ 정상 | 높음 |
| **Hooks** | 3개 이벤트 | ⚠️ 부족 | 중간 |

### 2.2 Hooks 구현 상태

**hooks/hooks.json 현재 상태:**

```json
{
  "SessionStart": [{ "once": true, "command": "session-start.sh" }],
  "PreToolUse": [{ "matcher": "Write|Edit", "command": "pre-write.sh" }],
  "PostToolUse": [{ "matcher": "Write", "command": "pdca-post-write.sh" }]
}
```

**미활용 스크립트 (연결 대기):**

| 스크립트 | 목적 | Hook Event | 조건 |
|---------|------|------------|------|
| phase2-convention-pre.sh | Convention 검증 | PreToolUse | Phase 2 작업 시 |
| phase4-api-stop.sh | Zero Script QA | Stop | API 구현 완료 시 |
| phase5-design-post.sh | Design Token 검증 | PostToolUse | UI 컴포넌트 작성 시 |
| phase6-ui-post.sh | Layer 분리 검증 | PostToolUse | UI 통합 시 |
| phase8-review-stop.sh | 리뷰 요약 | Stop | 코드 리뷰 완료 시 |
| phase9-deploy-pre.sh | 배포 검증 | PreToolUse | 배포 명령 시 |
| qa-pre-bash.sh | 위험 명령 차단 | PreToolUse | QA 중 Bash 실행 시 |

### 2.3 Skills Frontmatter Hooks 상태

**bkit-rules/SKILL.md:**
- ✅ PreToolUse (Write|Edit) hooks 정의됨
- ✅ PostToolUse (Write) hooks 정의됨
- ⚠️ hooks/hooks.json과 중복 정의 (우선순위 불명확)

**개선 필요:**
- hooks/hooks.json 단순화 → Skill frontmatter로 이전
- Phase별 Skills에 해당 hooks 추가

### 2.4 Agents Frontmatter Hooks 상태

**현재 Agent hooks 활용:**

| Agent | hooks 정의 | 상태 |
|-------|-----------|------|
| gap-detector | PostToolUse (Write) | ⚠️ 정의됨, 효과 불명 |
| design-validator | PreToolUse | ❌ 없음 |
| code-analyzer | Stop | ❌ 없음 |
| qa-monitor | Stop | ❌ 없음 |
| pdca-iterator | Stop | ❌ 없음 |

---

## 3. 개선 계획

### 3.1 Phase 1: Hooks 아키텍처 통합 (P0)

**목표:** hooks/hooks.json → Skill/Agent frontmatter로 분산

**현재 문제:**
```
hooks/hooks.json과 skills/bkit-rules/SKILL.md에 동일 hook 중복 정의
→ 우선순위 불명확, 유지보수 어려움
```

**해결 방안:**

```yaml
# 개선 후 아키텍처
┌─────────────────────────────────────────────────────────────────┐
│                     Hooks 계층 구조                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  hooks/hooks.json (전역 - 최소화)                               │
│  └─ SessionStart (세션 시작 웰컴)                               │
│                                                                 │
│  skills/bkit-rules/SKILL.md (개발 작업 시)                      │
│  ├─ PreToolUse (Write|Edit): 설계 확인                          │
│  └─ PostToolUse (Write): Gap Analysis 제안                      │
│                                                                 │
│  skills/phase-5-design-system/SKILL.md (UI 작업 시)            │
│  └─ PostToolUse (Write): Design Token 검증                      │
│                                                                 │
│  agents/gap-detector.md (Gap 분석 시)                          │
│  └─ Stop: 분석 완료 후 Iteration 제안                           │
│                                                                 │
│  agents/qa-monitor.md (QA 작업 시)                             │
│  ├─ PreToolUse (Bash): 위험 명령 차단                           │
│  └─ Stop: QA 세션 정리                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**구현 체크리스트:**

```
□ hooks/hooks.json 최소화 (SessionStart만 유지)
□ skills/bkit-rules/SKILL.md hooks 유지 (이미 정의됨)
□ skills/phase-5-design-system/SKILL.md에 hooks 추가
□ skills/zero-script-qa/SKILL.md에 hooks 추가
□ agents/gap-detector.md Stop hook 추가
□ agents/qa-monitor.md hooks 추가
□ agents/code-analyzer.md Stop hook 추가
```

### 3.2 Phase 2: 스크립트 연결 및 안정화 (P0)

**목표:** 미연결 스크립트를 Skill frontmatter hooks로 연결

#### A. phase-5-design-system Skill 개선

```yaml
# skills/phase-5-design-system/SKILL.md frontmatter
---
name: phase-5-design-system
description: |
  Design System 구축 가이드. 플랫폼 독립적 컴포넌트 라이브러리 개발.
  UI 컴포넌트 작성 시 자동 적용.

  Triggers: design system, component library, design tokens, shadcn,
  디자인 시스템, 컴포넌트, デザインシステム, 设计系统

  Do NOT use for: backend, API, infrastructure
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/phase5-design-post.sh"
          timeout: 5000
---
```

#### B. zero-script-qa Skill 개선

```yaml
# skills/zero-script-qa/SKILL.md frontmatter
---
name: zero-script-qa
description: |
  Zero Script QA 방법론. Docker 로그 기반 품질 검증.
  QA 세션 중 자동 적용.

  Triggers: zero script qa, log-based testing, docker logs, QA, testing,
  제로 스크립트, 로그 분석, ゼロスクリプトQA, 零脚本QA

  Do NOT use for: unit testing, frontend-only testing
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
          timeout: 5000
---
```

#### C. 스크립트 안정화

**현재 이슈:** `output_block()` 함수가 block 대신 additionalContext 출력

```bash
# lib/common.sh 현재 구현
output_block() {
    local reason="$1"
    cat << EOF
{"decision": "block", "hookSpecificOutput": {"reason": "$reason"}}
EOF
}
```

**수정 필요:**
```bash
# lib/common.sh 수정 후 (exit code 2 추가)
output_block() {
    local reason="$1"
    cat << EOF
{"decision": "block", "reason": "$reason"}
EOF
    exit 2  # PreToolUse에서 실제 block 동작
}
```

### 3.3 Phase 3: Agent Hooks 활성화 (P1)

**목표:** 핵심 Agent에 Stop hook 추가하여 작업 완료 품질 보장

#### A. gap-detector Agent 개선

```yaml
# agents/gap-detector.md 개선
---
name: gap-detector
description: |
  설계-구현 Gap 분석 전문가.
  Use proactively when user requests gap analysis or verification.

  Triggers: gap analysis, design-implementation check, verify implementation,
  갭 분석, 설계-구현 비교, 검증, ギャップ分析, 差距分析
hooks:
  PostToolUse:
    - matcher: "Write"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/gap-detector-post.sh"
  Stop:
    - hooks:
      - type: command
        command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
---
```

#### B. code-analyzer Agent 개선

```yaml
# agents/code-analyzer.md 개선
---
name: code-analyzer
description: |
  코드 품질 및 아키텍처 분석 전문가.
  Use proactively when user requests code review or security scan.

  Triggers: code analysis, quality check, security scan, code review,
  코드 분석, 품질 검사, 보안 스캔, コード分析, 代码分析
hooks:
  Stop:
    - hooks:
      - type: command
        command: "${CLAUDE_PLUGIN_ROOT}/scripts/analysis-stop.sh"
---
```

#### C. qa-monitor Agent 개선

```yaml
# agents/qa-monitor.md 개선
---
name: qa-monitor
description: |
  Docker 로그 실시간 모니터링 및 이슈 감지.
  Use proactively when user requests QA or log analysis.

  Triggers: zero script qa, log monitoring, docker logs, QA,
  제로 스크립트 QA, 로그 분석, ゼロスクリプトQA
hooks:
  PreToolUse:
    - matcher: "Bash"
      hooks:
        - type: command
          command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-pre-bash.sh"
  Stop:
    - hooks:
      - type: command
        command: "${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.sh"
---
```

### 3.4 Phase 4: Semantic Matching 강화 (P1)

**목표:** Agent/Skill 자동 활성화 정확도 90%+ 달성

#### A. Description 패턴 표준화

**현재 문제:** description 형식 불일치로 Claude 선택 정확도 저하

**표준 패턴:**
```yaml
description: |
  [역할 한 줄 요약]
  [상세 설명 2-3문장]
  Use proactively when [조건].

  Triggers: [영어 키워드], [한국어], [일본어], [중국어]

  Do NOT use for: [제외 조건]
```

#### B. Trigger 키워드 확장

| 컴포넌트 | 현재 Triggers | 추가 Triggers |
|---------|--------------|---------------|
| starter-guide | beginner, 초보자 | 처음, 간단한, simple, first time, 入門 |
| bkend-expert | bkend, auth | 로그인, 회원가입, firebase, supabase, 認証 |
| gap-detector | gap analysis | 비교해, 확인해, 검증해, 일치하는지, 検証 |
| pipeline-guide | pipeline | 순서, 뭘 먼저, 어디서부터, where to start, 手順 |
| design-validator | design validation | 설계 검토, 문서 확인, spec check, 仕様確認 |

#### C. Do NOT Use 조건 명확화

각 Agent/Skill에 제외 조건 명시:

```yaml
# 예시: starter-guide
Do NOT use for: experienced developers, enterprise-level projects,
backend development, microservices architecture
```

### 3.5 Phase 5: PDCA 강제 적용 강화 (P2)

**목표:** Major Feature에 설계 문서 필수화 (선택적 block)

**현재 동작:**
- pre-write.sh: 설계 문서 없으면 **경고만** (additionalContext)
- 사용자가 무시하고 진행 가능

**개선 옵션:**

| 옵션 | 설명 | 장점 | 단점 |
|------|------|------|------|
| A. 현상 유지 | 경고만 표시 | UX 방해 없음 | PDCA 강제 불가 |
| B. 선택적 Block | Major Feature만 block | 균형 잡힌 UX | 분류 정확도 의존 |
| C. 엄격 Block | 모든 Feature block | PDCA 완전 강제 | UX 저하 |

**권장: 옵션 B (선택적 Block)**

```bash
# pre-write.sh 개선
TASK_CLASS=$(classify_task "$CONTENT")

if [ "$TASK_CLASS" = "major_feature" ]; then
    if [ -z "$DESIGN_DOC" ]; then
        output_block "Major Feature는 설계 문서가 필수입니다. /pdca-design 명령으로 먼저 설계 문서를 작성하세요."
    fi
elif [ "$TASK_CLASS" = "feature" ]; then
    if [ -z "$DESIGN_DOC" ]; then
        output_allow "⚠️ Feature 작업에는 설계 문서 작성을 권장합니다."
    fi
else
    output_allow ""  # Quick Fix, Minor Change는 통과
fi
```

---

## 4. 우선순위 및 일정

### 4.1 우선순위 매트릭스

| Phase | 우선순위 | 영향도 | 난이도 | 예상 기간 |
|-------|---------|--------|--------|----------|
| Phase 1: Hooks 아키텍처 통합 | P0 | High | Medium | 2일 |
| Phase 2: 스크립트 연결 | P0 | High | Low | 1일 |
| Phase 3: Agent Hooks | P1 | Medium | Medium | 2일 |
| Phase 4: Semantic Matching | P1 | Medium | Low | 1일 |
| Phase 5: PDCA 강제 | P2 | Low | Low | 1일 |

### 4.2 구현 순서

```
Week 1:
├── Day 1-2: Phase 1 (Hooks 아키텍처 통합)
├── Day 3: Phase 2 (스크립트 연결)
└── Day 4-5: Phase 3 (Agent Hooks)

Week 2:
├── Day 1: Phase 4 (Semantic Matching)
├── Day 2: Phase 5 (PDCA 강제)
└── Day 3-5: 테스트 및 문서 업데이트
```

---

## 5. 상세 수정 파일 목록

### 5.1 즉시 수정 (P0)

| 파일 | 수정 내용 |
|------|----------|
| `hooks/hooks.json` | SessionStart만 유지, 나머지 제거 |
| `lib/common.sh` | `output_block()` 함수 수정 (exit 2 추가) |
| `scripts/pre-write.sh` | Task classification 기반 block 로직 추가 |
| `skills/phase-5-design-system/SKILL.md` | hooks 섹션 추가 |
| `skills/zero-script-qa/SKILL.md` | hooks 섹션 추가 |

### 5.2 우선 수정 (P1)

| 파일 | 수정 내용 |
|------|----------|
| `agents/gap-detector.md` | Stop hook 추가 |
| `agents/code-analyzer.md` | Stop hook 추가 |
| `agents/qa-monitor.md` | PreToolUse + Stop hooks 추가 |
| `agents/design-validator.md` | PreToolUse hook 추가 |
| `agents/pdca-iterator.md` | Stop hook 추가 |

### 5.3 개선 수정 (P2)

| 파일 | 수정 내용 |
|------|----------|
| 모든 agents/*.md | description Trigger 키워드 확장 |
| 모든 skills/*/SKILL.md | description Trigger 키워드 확장 |
| `bkit-system/components/scripts/_scripts-overview.md` | 문서 업데이트 |

---

## 6. 기존 계획과의 관계

### 6.1 01-HOOKS-REFACTOR-PLAN.md와의 관계

| 01 계획 항목 | 상태 | 본 계획과의 관계 |
|-------------|------|------------------|
| Stop Hook JSON 형식 수정 | ⚠️ 미완료 | Phase 2에서 통합 |
| prompt → command 전환 | ✅ 완료 | 유지 |
| additionalContext 활용 | ✅ 완료 | 유지 |
| skills/bkit-rules 강화 | ⚠️ 부분 완료 | Phase 1에서 완성 |

### 6.2 02-BKIT-AUTOMATION-IMPROVEMENT-PLAN.md와의 관계

| 02 계획 항목 | 상태 | 본 계획과의 관계 |
|-------------|------|------------------|
| Skills Frontmatter Hooks | ✅ bkit-rules에 구현 | Phase별 확장 |
| Agents Frontmatter Hooks | ⚠️ 미완료 | Phase 3에서 구현 |
| Semantic Matching 강화 | ⚠️ 부분 완료 | Phase 4에서 완성 |
| Instructions 통합 | ⚠️ 부분 완료 | 별도 진행 |

---

## 7. 테스트 계획

### 7.1 Hooks 동작 테스트

```bash
# 1. 디버그 모드로 실행
claude --debug --plugin-dir ./bkit-claude-code

# 2. Hooks 등록 확인
/hooks

# 3. PreToolUse 테스트 (소스 파일 작성)
"src/test.ts에 간단한 함수 작성해줘"
→ 예상: 설계 문서 없음 경고 표시

# 4. PostToolUse 테스트 (Write 완료 후)
→ 예상: Gap Analysis 제안

# 5. Skill Hooks 테스트 (bkit-rules)
→ 예상: 개발 작업 시 자동 적용
```

### 7.2 Agent 자동 활성화 테스트

```bash
# 1. gap-detector 자동 활성화
"로그인 기능 설계와 구현 비교해줘"
→ 예상: gap-detector 자동 호출

# 2. code-analyzer 자동 활성화
"코드 품질 검사해줘"
→ 예상: code-analyzer 자동 호출

# 3. starter-guide 자동 활성화
"처음 시작하는데 뭐부터 하면 돼?"
→ 예상: starter-guide 자동 호출
```

### 7.3 PDCA 강제 적용 테스트

```bash
# 1. Major Feature 테스트
"사용자 인증 시스템 전체를 새로 만들어줘"
→ 예상: block 또는 강력한 경고

# 2. Quick Fix 테스트
"typo 수정해줘"
→ 예상: 경고 없이 진행
```

---

## 8. 성공 기준

### 8.1 정량적 기준

| 지표 | 현재 | 목표 |
|------|------|------|
| Hooks 활성화 이벤트 | 3개 | 5개+ (SessionStart, PreToolUse, PostToolUse, Stop, SubagentStop) |
| 스크립트 활용률 | 33% (6/18) | 80%+ (14/18) |
| Agent Hooks 활용 | 1개 | 5개+ |
| Semantic Matching 정확도 | 60% | 90%+ |
| PDCA 문서 생성률 | 측정 불가 | 70%+ (Feature 이상) |

### 8.2 정성적 기준

- 사용자가 `/pdca-*` 명령어를 몰라도 자동으로 PDCA 단계 안내
- Feature/Major Feature 작업 시 설계 문서 작성 유도
- 구현 완료 후 자연스럽게 Gap Analysis 제안
- Phase별 작업 시 해당 검증 자동 실행

---

## 9. 위험 요소 및 완화 방안

### 9.1 위험 요소

| 위험 | 가능성 | 영향 | 완화 방안 |
|------|--------|------|----------|
| Skill frontmatter hooks 버그 | 중 | 높음 | 점진적 롤아웃, hooks.json 폴백 유지 |
| Stop hook 무한 루프 | 중 | 높음 | 명시적 continue: false, 타임아웃 설정 |
| 과도한 block으로 UX 저하 | 중 | 중 | Task classification 정확도 개선 |
| Agent 자동 호출 오동작 | 낮음 | 중 | Trigger 키워드 지속 개선 |

### 9.2 폴백 전략

```
Skill frontmatter hooks 실패 시:
1. hooks/hooks.json에 동일 hook 유지 (이중화)
2. SessionStart에서 규칙 명시적 안내
3. bkit-rules Skill 내용 강화

Stop hook 무한 루프 발생 시:
1. 즉시 hook 비활성화
2. 타임아웃 5초 적용
3. {"continue": false} 응답 확인
```

---

## 10. 결론 및 다음 단계

### 10.1 핵심 결론

bkit의 현재 구현은 **기본 Hooks 인프라가 갖춰져 있으나**, Phase별 스크립트와 Agent Hooks가 미연결 상태입니다. 04-HOOKS-AND-COMPONENTS-GUIDE.md에서 파악한 **Skill/Agent frontmatter hooks 패턴**을 활용하면, hooks/hooks.json의 불안정성을 우회하면서 자동화를 강화할 수 있습니다.

### 10.2 권장 접근 방식

```
┌─────────────────────────────────────────────────────────────────┐
│                    권장 구현 전략                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. hooks/hooks.json 최소화 (SessionStart만)                   │
│  2. 핵심 로직은 Skill frontmatter hooks로 (bkit-rules 유지)    │
│  3. Phase별 검증은 해당 Skill에 hooks 추가                     │
│  4. Agent 완료 검증은 Stop hook 활용                           │
│  5. Semantic matching은 Trigger 키워드 확장으로 개선            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 10.3 다음 단계

1. **이 계획 승인 요청**
2. **Phase 1-2 즉시 구현** (P0 항목)
3. **Phase 3-4 순차 구현** (P1 항목)
4. **테스트 및 문서 업데이트**
5. **v1.2.1 릴리즈**

---

## 부록 A: 관련 문서

| 문서 | 역할 |
|------|------|
| docs/04-HOOKS-AND-COMPONENTS-GUIDE.md | 공식 문서 기반 구현 가이드 |
| docs/01-plan/01-HOOKS-REFACTOR-PLAN.md | Hooks 안정화 계획 |
| docs/01-plan/02-BKIT-AUTOMATION-IMPROVEMENT-PLAN.md | 자동화 개선 계획 |
| bkit-system/components/scripts/_scripts-overview.md | 스크립트 목록 |
| bkit-system/components/hooks/_hooks-overview.md | Hooks 이벤트 설명 |

## 부록 B: 수정 대상 파일 전체 목록

```
수정 대상:
├── hooks/hooks.json                          # SessionStart만 유지
├── lib/common.sh                             # output_block() 수정
├── scripts/pre-write.sh                      # Task classification block
├── skills/phase-5-design-system/SKILL.md     # hooks 추가
├── skills/zero-script-qa/SKILL.md            # hooks 추가
├── agents/gap-detector.md                    # Stop hook 추가
├── agents/code-analyzer.md                   # Stop hook 추가
├── agents/qa-monitor.md                      # hooks 추가
├── agents/design-validator.md                # PreToolUse hook 추가
├── agents/pdca-iterator.md                   # Stop hook 추가
└── (모든 agents, skills)                     # Trigger 키워드 확장

문서 업데이트:
├── bkit-system/components/scripts/_scripts-overview.md
├── bkit-system/components/hooks/_hooks-overview.md
└── CHANGELOG.md
```

---

*문서 버전: 1.0*
*작성일: 2026-01-20*
*작성자: Claude (with User)*
*상태: Plan Phase - 승인 대기*
