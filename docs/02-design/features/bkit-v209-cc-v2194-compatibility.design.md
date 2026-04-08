# bkit v2.0.9 — CC v2.1.94 호환성 + 25건 이슈 해결 설계서

> **Status**: 📐 Design Complete
> **Feature**: bkit-v209-cc-v2194-compatibility
> **Created**: 2026-04-08
> **Plan Reference**: [Plan](../../01-plan/features/bkit-v209-cc-v2194-compatibility.plan.md)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | CC v2.1.94 frontmatter hooks 정상화로 bkit 중복 실행 위험 + 25건 무결성 이슈 |
| **WHO** | bkit 전체 사용자 |
| **RISK** | PDCA 상태 머신 이중 전환 |
| **SUCCESS** | 25건 → 0건, CC v2.1.94 100% 호환 |
| **SCOPE** | ~40 files 수정 (frontmatter only, 로직 변경 최소) |

---

## 1. 아키텍처 설계

### 1.1 현재 아키텍처 (v2.0.8)

```
Stop 이벤트 발생
  ├── hooks.json → unified-stop.js (글로벌, 항상 실행)
  │     ├── detectActiveAgent() → AGENT_HANDLERS 매핑
  │     ├── detectActiveSkill() → SKILL_HANDLERS 매핑
  │     └── v2.0.0 모듈 10개 (상태 머신, 체크포인트, audit...)
  │
  └── [CC v2.1.94 신규] frontmatter hooks → 개별 스크립트 (중복 실행!)
        ├── skill: pdca → pdca-skill-stop.js  ← 이미 위에서 실행됨
        ├── agent: gap-detector → gap-detector-stop.js ← 이미 위에서 실행됨
        └── ... (24개 중복)
```

### 1.2 목표 아키텍처 (v2.0.9)

```
Stop 이벤트 발생
  └── hooks.json → unified-stop.js (유일한 Stop 핸들러)
        ├── detectActiveAgent() → AGENT_HANDLERS (7개)
        ├── detectActiveSkill() → SKILL_HANDLERS (12개)
        └── v2.0.0 모듈 10개 (상태 머신, 체크포인트, audit...)

  * frontmatter hooks: 제거됨 (중복 경로 차단)
  * unified-stop.js가 Single Source of Truth
```

### 1.3 설계 원칙

1. **Single Stop Handler**: unified-stop.js만이 Stop 이벤트를 처리
2. **Frontmatter = 메타데이터**: hooks 로직은 hooks.json, frontmatter는 name/description/model/effort/tools만 담당
3. **최소 변경**: body(마크다운 본문)는 건드리지 않음, frontmatter만 수정
4. **표준화**: 모든 skill/agent frontmatter가 동일 스키마를 따르도록 정비

---

## 2. 상세 수정 명세

### 2.1 C-1: Frontmatter Hooks 제거 (24 files)

#### Skills (11 files)

각 SKILL.md에서 `hooks:` 블록 전체를 제거합니다.

| # | 파일 | 제거할 블록 |
|---|------|-----------|
| 1 | `skills/cc-version-analysis/SKILL.md` | `hooks:\n  Stop:\n    - type: command\n      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js"\n      timeout: 10000` |
| 2 | `skills/claude-code-learning/SKILL.md` | `hooks:\n  Stop:\n    - type: command\n      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/learning-stop.js"\n      timeout: 10000` |
| 3 | `skills/code-review/SKILL.md` | `hooks:\n  Stop:\n    - type: command\n      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/code-review-stop.js"\n      timeout: 10000` |
| 4 | `skills/pdca/SKILL.md` | `hooks:\n  Stop:\n    - type: command\n      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pdca-skill-stop.js"\n      timeout: 10000` |
| 5 | `skills/phase-4-api/SKILL.md` | `hooks:\n  Stop:\n    ... phase4-api-stop.js ...` |
| 6 | `skills/phase-5-design-system/SKILL.md` | `hooks:\n  Stop:\n    ... phase5-design-stop.js ...` |
| 7 | `skills/phase-6-ui-integration/SKILL.md` | `hooks:\n  Stop:\n    ... phase6-ui-stop.js ...` |
| 8 | `skills/phase-8-review/SKILL.md` | `hooks:\n  Stop:\n    ... phase8-review-stop.js ...` |
| 9 | `skills/phase-9-deployment/SKILL.md` | `hooks:\n  Stop:\n    ... phase9-deploy-stop.js ...` |
| 10 | `skills/plan-plus/SKILL.md` | `hooks:\n  Stop:\n    ... plan-plus-stop.js ...` |
| 11 | `skills/zero-script-qa/SKILL.md` | `hooks:\n  Stop:\n    ... qa-stop.js ...` |

#### Agents (13 files)

각 agent .md에서 `hooks:` 블록 전체를 제거합니다.

| # | 파일 | 제거할 블록 |
|---|------|-----------|
| 1 | `agents/bkit-impact-analyst.md` | `hooks:\n  Stop:\n    ... subagent-stop-handler.js ...` |
| 2 | `agents/cc-version-researcher.md` | 위와 동일 |
| 3 | `agents/code-analyzer.md` | `hooks:\n  Stop:\n    ... analysis-stop.js ...` |
| 4 | `agents/cto-lead.md` | `hooks:\n  Stop:\n    ... cto-stop.js ...` |
| 5 | `agents/gap-detector.md` | `hooks:\n  Stop:\n    ... gap-detector-stop.js ...` |
| 6 | `agents/pdca-iterator.md` | `hooks:\n  Stop:\n    ... iterator-stop.js ...` |
| 7 | `agents/pm-discovery.md` | `hooks:\n  Stop:\n    ... pdca-skill-stop.js ...` |
| 8 | `agents/pm-lead.md` | 위와 동일 |
| 9 | `agents/pm-prd.md` | 위와 동일 |
| 10 | `agents/pm-research.md` | 위와 동일 |
| 11 | `agents/pm-strategy.md` | 위와 동일 |
| 12 | `agents/qa-monitor.md` | `hooks:\n  Stop:\n    ... qa-stop.js ...` |
| 13 | `agents/self-healing.md` | `hooks:\n  Stop:\n    ... heal-hook.js ...` |

**안전성 검증**: unified-stop.js의 AGENT_HANDLERS에 gap-detector, pdca-iterator, code-analyzer, qa-monitor, cto-lead, pm-lead (7개) 등록 확인. SKILL_HANDLERS에 11개 스킬 모두 등록 확인. bkit-impact-analyst, cc-version-researcher는 SubagentStop hook(hooks.json)에서 처리.

---

### 2.2 C-2: deploy SKILL.md 재작성

**Before** (비표준):
```yaml
---
name: deploy
description: Deploy feature to target environment (dev/staging/prod) with level-based strategy
version: 3.0.0
category: workflow
agent: bkit:infra-architect
pdca_phase: do
triggers:
  - deploy
  - /pdca deploy
  - 배포
  - デプロイ
  - 部署
---
```

**After** (bkit 표준):
```yaml
---
name: deploy
classification: workflow
classification-reason: Deployment execution independent of model capability
deprecation-risk: none
description: |
  Deploy feature to target environment (dev/staging/prod) with level-based strategy.
  Triggers: deploy, /pdca deploy, 배포, デプロイ, 部署, desplegar, déployer, bereitstellen, distribuire.
argument-hint: "[feature] [--env dev|staging|prod]"
user-invocable: true
agents:
  orchestrator: bkit:infra-architect
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
pdca-phase: do
task-template: "[Deploy] {feature}"
---
```

**변경 사항**: 9개 필드 추가, 2개 변경, 3개 제거 (version, category, triggers)

---

### 2.3 C-3: TodoWrite 제거 (1 skill + 12 agents = 13 files)

TodoWrite는 CC에서 레거시(deprecated) 도구. 1 skill + 12 agents에서 발견됨.

**Skills (1 file)**:
- `skills/development-pipeline/SKILL.md`

**Agents (12 files)**:
- `agents/pm-strategy.md`, `agents/pm-research.md`, `agents/pm-prd.md`
- `agents/pm-lead.md`, `agents/pm-discovery.md`, `agents/cto-lead.md`
- `agents/pdca-iterator.md`, `agents/bkit-impact-analyst.md`
- `agents/cc-version-researcher.md`, `agents/qa-strategist.md`
- `agents/product-manager.md`, `agents/pipeline-guide.md`

**수정**: 각 파일의 `tools:` 목록에서 `TodoWrite` 라인 제거.

```yaml
# Before:
  - TodoWrite    # ← 삭제 (13 files)
```

---

### 2.4 C-4: LSP 도구 검증

**파일**: `skills/code-review/SKILL.md`, `skills/phase-8-review/SKILL.md`

**판정**: LSP는 CC의 deferred tool로 실제 존재 (language server protocol 기능). 현재 세션의 ToolSearch에서도 `LSP`가 사용 가능한 것을 확인.

**수정**: **변경 없음** — LSP는 유효한 CC 도구. Critical에서 제외하여 이슈 수 24건으로 수정.

---

### 2.5 I-1 + W-6: self-healing agent 수정

**파일**: `agents/self-healing.md`

**수정 사항**:
1. `reasoningEffort: high` 제거 (effort: high와 중복, 비표준 필드)
2. `permissionMode: code` → `permissionMode: acceptEdits` (code는 미정의 값)
3. `triggers:` 블록 → `description:` 내부로 이동
4. `hooks:` 블록 제거 (C-1에서 처리)

```yaml
# Before (문제 있는 부분만):
effort: high
reasoningEffort: high       # ← 제거
permissionMode: code        # ← acceptEdits로 변경

triggers:                    # ← description으로 이동
  - self-healing
  - ...

hooks:                       # ← 제거 (C-1)
  Stop:
    - command: ...

# After:
effort: high
permissionMode: acceptEdits
# triggers는 description 블록 안으로 이동
# hooks 제거
```

---

### 2.6 I-2: PDCA eval agents permissionMode 추가 (6 files)

**파일**: `agents/pdca-eval-{act,check,design,do,plan,pm}.md`

**수정**: 각 파일의 frontmatter에 `permissionMode: plan` 추가.

```yaml
# Before:
tools:
  - Read
  - Glob
  - Grep
  - Write

# After:
permissionMode: plan
tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
```

`Edit` 추가 이유: 평가 결과를 기존 상태 파일에 업데이트하는 데 Edit이 적합.

---

### 2.7 I-3: claude-code-learning agent 참조 수정

**파일**: `skills/claude-code-learning/SKILL.md`

**발견**: `agent: claude-code-guide`가 참조하는 agent 파일(`agents/claude-code-guide.md`)이 **존재하지 않음**. 다른 모든 skills는 `bkit:` prefix를 사용하며 실제 존재하는 agent를 참조.

**수정**: CC 시스템에 내장된 `claude-code-guide` subagent_type을 참조하므로, bkit: prefix를 추가하지 않고 CC 내장 agent를 직접 참조하는 패턴으로 유지. 단, 이 사실을 주석으로 명시.

```yaml
# Before:
agent: claude-code-guide

# After (CC 내장 agent를 명시적으로 참조):
agent: claude-code-guide  # CC built-in subagent_type (not a bkit agent)
```

**참고**: `claude-code-guide`는 CC의 내장 subagent_type이므로 `bkit:` prefix 불필요. 파일은 존재하지 않지만 이는 CC에서 제공하는 agent이기 때문.

---

### 2.8 I-4: cc-version-analysis null agents 제거

**파일**: `skills/cc-version-analysis/SKILL.md`

```yaml
# Before:
agents:
  research: bkit:cc-version-researcher
  analysis: bkit:bkit-impact-analyst
  brainstorm: null
  default: null

# After:
agents:
  research: bkit:cc-version-researcher
  analysis: bkit:bkit-impact-analyst
```

---

### 2.9 I-5~8: user-invocable 누락 추가 (4 files)

**파일**: `skills/phase-{4-api,5-design-system,7-seo-security,9-deployment}/SKILL.md`

**수정**: 각 파일에 `user-invocable: false` 추가 (개발 파이프라인 내부 스킬).

---

### 2.10 I-9~11: PM agents disallowedTools 정리 (3 files)

**파일**: `agents/pm-{discovery,research,strategy}.md`

**수정**: `disallowedTools`에서 `Write` 제거 (이미 `tools`에 없으므로 중복).

```yaml
# Before:
disallowedTools:
  - Bash
  - Write    # ← 제거 (tools에 없으므로 무의미)

# After:
disallowedTools:
  - Bash
```

---

### 2.11 I-12~13: allowed-tools 누락 추가 (2 files)

**파일**: `skills/bkit-rules/SKILL.md`, `skills/bkit-templates/SKILL.md`

```yaml
# 추가:
allowed-tools:
  - Read
  - Glob
  - Grep
```

---

### 2.12 W-1~2: bare Task 명시화 (2 files)

**파일**: `agents/code-analyzer.md`, `agents/infra-architect.md`

**수정**: bare `Task` → 구체적 대상 명시:
- code-analyzer: `Task` → `Task(Explore)`
- infra-architect: `Task` → `Task(Explore)`

(두 에이전트 모두 범용 탐색이 주 용도이므로 Explore로 제한)

---

### 2.13 Info-1: $schema 제거

**파일**: `bkit.config.json`

```json
// Before:
{
  "$schema": "./bkit.config.schema.json",   // ← 제거

// After:
{
  // $schema 라인 삭제
```

---

### 2.14 Info-2 + VER: 버전 업데이트 (4 files)

| 파일 | 필드 | Before | After |
|------|------|--------|-------|
| `.claude-plugin/plugin.json` | version | 2.0.8 | **2.0.9** |
| `.claude-plugin/plugin.json` | engines.claude-code | >=2.1.78 | **>=2.1.94** |
| `bkit.config.json` | version | 2.0.8 | **2.0.9** |
| `hooks/hooks.json` | description | v2.0.8 | **v2.0.9** |
| `.claude-plugin/marketplace.json` | version | 2.0.8 | **2.0.9** |

---

### 2.15 ENH-187: sessionTitle PDCA 자동 세션 명명

**파일**: `scripts/user-prompt-handler.js`

**수정**: hookSpecificOutput에 sessionTitle 추가 (~5줄):

```javascript
// 기존 출력 객체에 추가:
const output = {
  // ... 기존 필드 ...
  hookSpecificOutput: {
    // ... 기존 필드 ...
    sessionTitle: feature ? `[bkit] ${feature}` : undefined
  }
};
```

**조건**: PDCA feature가 활성 상태일 때만 sessionTitle 설정. 없으면 undefined (CC가 무시).

---

## 3. 구현 순서 (Session Guide)

### Session 1: Critical 수정 (~30분)

```
1. C-1: 11 skills frontmatter hooks 제거
2. C-1: 13 agents frontmatter hooks 제거
3. C-2: deploy SKILL.md 재작성
4. C-3: development-pipeline TodoWrite 제거
5. C-4: LSP → 유효 확인, 변경 없음
```

### Session 2: Important + Warn 수정 (~20분)

```
6. I-1+W-6: self-healing agent 3개 필드 수정
7. I-2: pdca-eval 6 agents permissionMode 추가
8. I-3: claude-code-learning agent prefix 확인/수정
9. I-4: cc-version-analysis null agents 제거
10. I-5~8: phase skills user-invocable 추가
11. I-9~11: PM agents disallowedTools 정리
12. I-12~13: bkit-rules/templates allowed-tools 추가
13. W-1~2: bare Task 명시화
```

### Session 3: Config + Version + ENH-187 (~10분)

```
14. Info-1: $schema 제거
15. Info-2+VER: 4 files 버전 범프 (2.0.8→2.0.9)
16. ENH-187: sessionTitle 기능 추가
17. 최종 검증 (validate-plugin.js 실행)
```

---

## 4. 테스트 계획

| 테스트 | 방법 | 기대 결과 |
|--------|------|----------|
| frontmatter hooks 미실행 확인 | `BKIT_DEBUG=true` + skill 실행 후 로그 확인 | Stop 핸들러 1회만 실행 |
| unified-stop.js 라우팅 | 각 skill/agent 실행 후 Stop 이벤트 추적 | 올바른 핸들러 매핑 |
| deploy skill 동작 | `/deploy feature --env dev` 실행 | 정상 동작 |
| pdca-eval permissionMode | eval agent 실행 → Write 시도 | plan 모드 확인 프롬프트 |
| sessionTitle | PDCA feature 활성 상태에서 프롬프트 입력 | 세션 제목 자동 설정 |
| version 일관성 | 4 config files 버전 확인 | 모두 2.0.9 |
| validate-plugin.js | `node scripts/validate-plugin.js` | PASS |

---

## 5. 롤백 계획

모든 변경은 frontmatter 텍스트 수정이므로 `git revert` 한 번으로 완전 롤백 가능.

```bash
git revert HEAD  # 커밋 전체 되돌리기
```

---

## 6. 변경 파일 전체 목록 (~40 files)

### Skills (15 files)

| 파일 | 변경 유형 | 이슈 |
|------|----------|------|
| `skills/cc-version-analysis/SKILL.md` | hooks 제거 + null agents 제거 | C-1, I-4 |
| `skills/claude-code-learning/SKILL.md` | hooks 제거 + agent prefix | C-1, I-3 |
| `skills/code-review/SKILL.md` | hooks 제거 | C-1 |
| `skills/pdca/SKILL.md` | hooks 제거 | C-1 |
| `skills/phase-4-api/SKILL.md` | hooks 제거 + user-invocable | C-1, I-5 |
| `skills/phase-5-design-system/SKILL.md` | hooks 제거 + user-invocable | C-1, I-6 |
| `skills/phase-6-ui-integration/SKILL.md` | hooks 제거 | C-1 |
| `skills/phase-8-review/SKILL.md` | hooks 제거 | C-1 |
| `skills/phase-9-deployment/SKILL.md` | hooks 제거 + user-invocable | C-1, I-8 |
| `skills/plan-plus/SKILL.md` | hooks 제거 | C-1 |
| `skills/zero-script-qa/SKILL.md` | hooks 제거 | C-1 |
| `skills/deploy/SKILL.md` | 전체 재작성 | C-2 |
| `skills/development-pipeline/SKILL.md` | TodoWrite 제거 | C-3 |
| `skills/bkit-rules/SKILL.md` | allowed-tools 추가 | I-12 |
| `skills/bkit-templates/SKILL.md` | allowed-tools 추가 | I-13 |
| `skills/phase-7-seo-security/SKILL.md` | user-invocable 추가 | I-7 |

### Agents (20 files)

| 파일 | 변경 유형 | 이슈 |
|------|----------|------|
| `agents/bkit-impact-analyst.md` | hooks 제거 | C-1 |
| `agents/cc-version-researcher.md` | hooks 제거 | C-1 |
| `agents/code-analyzer.md` | hooks 제거 + Task 명시화 | C-1, W-1 |
| `agents/cto-lead.md` | hooks 제거 | C-1 |
| `agents/gap-detector.md` | hooks 제거 | C-1 |
| `agents/pdca-iterator.md` | hooks 제거 | C-1 |
| `agents/pm-discovery.md` | hooks 제거 + disallowedTools 정리 | C-1, I-9 |
| `agents/pm-lead.md` | hooks 제거 | C-1 |
| `agents/pm-prd.md` | hooks 제거 | C-1 |
| `agents/pm-research.md` | hooks 제거 + disallowedTools 정리 | C-1, I-10 |
| `agents/pm-strategy.md` | hooks 제거 + disallowedTools 정리 | C-1, I-11 |
| `agents/qa-monitor.md` | hooks 제거 | C-1 |
| `agents/self-healing.md` | hooks 제거 + 3개 필드 수정 | C-1, I-1, W-6 |
| `agents/pdca-eval-act.md` | permissionMode 추가 | I-2 |
| `agents/pdca-eval-check.md` | permissionMode 추가 | I-2 |
| `agents/pdca-eval-design.md` | permissionMode 추가 | I-2 |
| `agents/pdca-eval-do.md` | permissionMode 추가 | I-2 |
| `agents/pdca-eval-plan.md` | permissionMode 추가 | I-2 |
| `agents/pdca-eval-pm.md` | permissionMode 추가 | I-2 |
| `agents/infra-architect.md` | Task 명시화 + TodoWrite 제거 | W-2, C-3 |
| `agents/pipeline-guide.md` | TodoWrite 제거 | C-3 |
| `agents/product-manager.md` | TodoWrite 제거 | C-3 |

### Scripts (1 file)

| 파일 | 변경 유형 | 이슈 |
|------|----------|------|
| `scripts/user-prompt-handler.js` | sessionTitle 추가 | ENH-187 |

### Config (4 files)

| 파일 | 변경 유형 | 이슈 |
|------|----------|------|
| `.claude-plugin/plugin.json` | version + engines | VER, Info-2 |
| `.claude-plugin/marketplace.json` | version | VER |
| `bkit.config.json` | version + $schema 제거 | VER, Info-1 |
| `hooks/hooks.json` | description version | VER |
