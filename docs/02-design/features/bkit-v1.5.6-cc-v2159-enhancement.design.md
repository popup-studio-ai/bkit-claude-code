# bkit v1.5.6 CC v2.1.59 Enhancement Design Document

> **Feature**: bkit-v1.5.6-cc-v2159-enhancement
> **Project**: bkit (Claude Code Plugin)
> **Version**: v1.5.6
> **Author**: CTO Lead (cto-lead, opus)
> **Date**: 2026-02-26
> **Status**: Draft
> **Planning Doc**: [bkit-v1.5.6-cc-v2159-enhancement.plan.md](../01-plan/features/bkit-v1.5.6-cc-v2159-enhancement.plan.md)
> **Impact Analysis**: [claude-code-v2.1.59-impact-analysis.md](../03-analysis/claude-code-v2.1.59-impact-analysis.md)
> **Team**: CTO Lead + code-analyzer + product-manager + frontend-architect + qa-strategist + gap-detector

---

## 1. Overview

### 1.1 Design Goals

1. CC v2.1.59 auto-memory 기능을 bkit SessionStart hook에 자연스럽게 통합
2. `/copy` 명령 안내를 코드 생성 skill 완료 시 노출하여 UX 개선
3. CTO Team 패턴의 multi-agent 메모리 관리 best practice 문서화
4. Remote Control 호환성을 사전 점검하여 향후 대응 준비
5. 기존 bkit 코딩 컨벤션과 hook 아키텍처를 100% 유지

### 1.2 Design Principles

- **Minimal Invasion**: 기존 코드 구조 변경 최소화, 함수 추가/확장만 수행
- **Token Efficiency**: SessionStart 출력 크기 증가를 5줄 이내로 제한
- **Graceful Degradation**: auto-memory 미지원 CC 버전에서도 기존 기능 정상 동작
- **Convention First**: camelCase 함수, kebab-case 파일, Korean 주석, debugLog 패턴 준수

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         bkit Plugin v1.5.6                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  hooks/                     scripts/                  commands/     │
│  ┌──────────────────┐      ┌──────────────────┐     ┌───────────┐  │
│  │ session-start.js │      │ skill-post.js    │     │ bkit.md   │  │
│  │ [ENH-48: auto-   │      │ [ENH-49: /copy   │     │ [ENH-48:  │  │
│  │  memory 안내]     │      │  안내 추가]       │     │  /memory  │  │
│  └────────┬─────────┘      └────────┬─────────┘     │  참조]    │  │
│           │                         │                └───────────┘  │
│           ▼                         ▼                               │
│  lib/                      scripts/                                 │
│  ┌──────────────────┐      ┌──────────────────┐                    │
│  │ common.js (180)  │      │ unified-stop.js  │                    │
│  │ memory-store.js  │      │ [ENH-49: /copy   │                    │
│  │ team/coordinator │      │  세션 요약 안내]  │                    │
│  └──────────────────┘      └──────────────────┘                    │
│                                                                     │
│  docs/guides/ (신규)                                                │
│  ┌──────────────────────────────────┐                               │
│  │ cto-team-memory-guide.md [ENH-50]│                               │
│  │ remote-control-compatibility.md   │                               │
│  │ [ENH-51]                          │                               │
│  └──────────────────────────────────┘                               │
│                                                                     │
│  config/                                                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ plugin.json      │  │ bkit.config.json │  │ CHANGELOG.md     │  │
│  │ [version bump]   │  │ [version bump]   │  │ [v1.5.6 entry]   │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow

#### ENH-48: Auto-Memory Integration

```
SessionStart Hook 실행
    │
    ├── detectLevel() -- 프로젝트 레벨 감지
    ├── enhancedOnboarding() -- 기존 온보딩 로직
    ├── [NEW] detectAutoMemoryStatus() -- auto-memory 감지
    │       │
    │       ├── ~/.claude/projects/{path}/memory/ 경로 확인
    │       ├── MEMORY.md 파일 존재 여부
    │       └── return { available, fileExists, lineCount }
    │
    └── additionalContext 출력 생성
            │
            ├── 기존: "## Agent Memory (Auto-Active)"
            └── [UPDATED]: auto-memory 상태 + /memory 안내 추가
```

#### ENH-49: /copy Command Guidance

```
Skill 실행 완료 (PostToolUse(Skill))
    │
    ├── skill-post.js main()
    │       │
    │       ├── parseSkillInvocation(toolInput)
    │       ├── orchestrateSkillPost(skillName, ...)
    │       ├── generateJsonOutput(suggestions, skillName)
    │       │       │
    │       │       └── [NEW] shouldSuggestCopy(skillName) 호출
    │       │               │
    │       │               ├── 코드 생성 skill 목록 확인
    │       │               │   (phase-4-api, phase-6-ui-integration,
    │       │               │    code-review, pdca do phase)
    │       │               └── return boolean
    │       │
    │       └── output.copyHint = "/copy 로 코드 블록 복사 가능"
    │
    ▼
Stop Event (unified-stop.js)
    │
    └── [NEW] 기존 fallback output에 /copy 안내 조건부 추가
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| `session-start.js` (ENH-48) | `lib/common.js`, `lib/memory-store.js` | auto-memory 감지 및 안내 |
| `skill-post.js` (ENH-49) | `lib/common.js`, `lib/skill-orchestrator.js` | /copy 안내 조건 판단 |
| `unified-stop.js` (ENH-49) | `lib/common.js` | Stop 시 /copy 조건부 안내 |
| `commands/bkit.md` (ENH-48) | None | 정적 Markdown |
| Version bump files | None | 정적 설정 |

---

## 3. ENH-48: Auto-Memory Integration (Detailed Design)

### 3.1 Current Code: `hooks/session-start.js` (lines 570-574)

```javascript
// 현재 코드 (v1.5.5)
  // Agent Memory awareness
  additionalContext += `## Agent Memory (Auto-Active)\n`;
  additionalContext += `- All bkit agents remember context across sessions automatically\n`;
  additionalContext += `- 9 agents use project scope, 2 agents (starter-guide, pipeline-guide) use user scope\n`;
  additionalContext += `- No configuration needed\n\n`;
```

### 3.2 Proposed Change: `hooks/session-start.js`

```diff
  // Agent Memory awareness
- additionalContext += `## Agent Memory (Auto-Active)\n`;
- additionalContext += `- All bkit agents remember context across sessions automatically\n`;
- additionalContext += `- 9 agents use project scope, 2 agents (starter-guide, pipeline-guide) use user scope\n`;
- additionalContext += `- No configuration needed\n\n`;
+ additionalContext += `## Memory Systems (v1.5.6)\n`;
+ additionalContext += `### bkit Agent Memory (Auto-Active)\n`;
+ additionalContext += `- 14 agents use project scope, 2 agents (starter-guide, pipeline-guide) use user scope\n`;
+ additionalContext += `- No configuration needed\n`;
+ additionalContext += `### Claude Code Auto-Memory\n`;
+ additionalContext += `- Claude automatically saves useful context to \`~/.claude/projects/*/memory/MEMORY.md\`\n`;
+ additionalContext += `- Manage with \`/memory\` command (view, edit, delete entries)\n`;
+ additionalContext += `- bkit memory (\`docs/.bkit-memory.json\`) and CC auto-memory are separate systems with no collision\n`;
+ additionalContext += `- Tip: After PDCA completion, use \`/memory\` to save key learnings for future sessions\n\n`;
```

### 3.3 Version String Updates: `hooks/session-start.js`

```diff
- * bkit Vibecoding Kit - SessionStart Hook (v1.5.5)
+ * bkit Vibecoding Kit - SessionStart Hook (v1.5.6)
```

```diff
- * v1.5.5 Changes:
- * - Plan Plus skill: brainstorming-enhanced PDCA planning (community PR #34)
- * - Skills 26 -> 27, Templates 27 -> 28
- * - README duplicate Skills rows fix (community PR #33)
+ * v1.5.6 Changes:
+ * - Auto-Memory Integration: CC auto-memory status + /memory guidance (ENH-48)
+ * - /copy Command Guidance: skill completion copy hints (ENH-49)
+ * - CTO Team Memory Guide: multi-agent memory best practices (ENH-50)
+ * - Remote Control Compatibility: pre-check documentation (ENH-51)
+ * - CC recommended version: v2.1.42 -> v2.1.59
```

```diff
- let additionalContext = `# bkit Vibecoding Kit v1.5.5 - Session Startup\n\n`;
+ let additionalContext = `# bkit Vibecoding Kit v1.5.6 - Session Startup\n\n`;
```

```diff
-  additionalContext += `## Output Styles (v1.5.5)\n`;
+  additionalContext += `## Output Styles (v1.5.6)\n`;
```

```diff
-  systemMessage: `bkit Vibecoding Kit v1.5.5 activated (Claude Code)`,
+  systemMessage: `bkit Vibecoding Kit v1.5.6 activated (Claude Code)`,
```

```diff
- ## 📊 bkit Feature Usage Report (v1.5.5 - Required for all responses)
+ ## 📊 bkit Feature Usage Report (v1.5.6 - Required for all responses)
```

### 3.4 Current Code: `commands/bkit.md` (lines 56-71)

```markdown
Quality Management
  /code-review <path>        Code review
  /zero-script-qa            Start Zero Script QA

Learning
  /claude-code-learning          Learn Claude Code
  /claude-code-learning setup    Analyze current project setup

Output Styles (v1.5.3)
  /output-style              Select response style
  /output-style-setup        Install bkit styles to .claude/
  Available: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise
```

### 3.5 Proposed Change: `commands/bkit.md`

```diff
 Learning
   /claude-code-learning          Learn Claude Code
   /claude-code-learning setup    Analyze current project setup

+Memory & Clipboard
+  /memory                    Manage Claude auto-memory (view/edit entries)
+  /copy                      Copy code blocks to clipboard (interactive picker)

 Output Styles (v1.5.3)
```

### 3.6 Integration Notes (ENH-48)

- auto-memory 상태 **감지는 하지 않는다** (파일 시스템 접근은 SessionStart hook 범위 초과). 대신 안내 메시지만 추가한다.
  - 이유: `~/.claude/projects/{path}/memory/MEMORY.md` 경로의 `{path}`를 정확히 계산하려면 CC 내부 로직을 복제해야 하며, 이는 유지보수 부담이 크다.
  - 대안: "CC auto-memory가 활성화되어 있습니다" 라는 일반 안내를 제공한다. CC v2.1.59+에서는 기본 활성화이므로 항상 유효하다.
- "Agent Memory" 섹션을 "Memory Systems"로 확장하여 bkit agent-memory와 CC auto-memory를 함께 안내한다.
- Agent 수 9 -> 14로 정정 (project scope 14개가 정확).

---

## 4. ENH-49: /copy Command Guidance (Detailed Design)

### 4.1 Current Code: `scripts/skill-post.js` (lines 96-113)

```javascript
function generateJsonOutput(suggestions, skillName) {
  const output = {
    skillCompleted: skillName,
    timestamp: new Date().toISOString()
  };

  if (suggestions.nextSkill) {
    output.nextSkill = suggestions.nextSkill.name;
    output.nextSkillMessage = suggestions.nextSkill.message;
  }

  if (suggestions.suggestedAgent) {
    output.suggestedAgent = suggestions.suggestedAgent;
    output.suggestedAgentMessage = suggestions.suggestedMessage;
  }

  return output;
}
```

### 4.2 Proposed Change: `scripts/skill-post.js`

```diff
+/**
+ * v1.5.6: 코드 생성 skill 여부 판단
+ * /copy 명령 안내 대상 skill 목록
+ * @param {string} skillName - Skill name
+ * @returns {boolean}
+ */
+const CODE_GENERATION_SKILLS = [
+  'phase-4-api',
+  'phase-5-design-system',
+  'phase-6-ui-integration',
+  'code-review',
+  'starter',
+  'dynamic',
+  'enterprise',
+  'mobile-app',
+  'desktop-app'
+];
+
+function shouldSuggestCopy(skillName) {
+  return CODE_GENERATION_SKILLS.includes(skillName);
+}

 function generateJsonOutput(suggestions, skillName) {
   const output = {
     skillCompleted: skillName,
     timestamp: new Date().toISOString()
   };

   if (suggestions.nextSkill) {
     output.nextSkill = suggestions.nextSkill.name;
     output.nextSkillMessage = suggestions.nextSkill.message;
   }

   if (suggestions.suggestedAgent) {
     output.suggestedAgent = suggestions.suggestedAgent;
     output.suggestedAgentMessage = suggestions.suggestedMessage;
   }

+  // v1.5.6: /copy 명령 안내 (코드 생성 skill 완료 시)
+  if (shouldSuggestCopy(skillName)) {
+    output.copyHint = 'Use /copy to select and copy code blocks to clipboard';
+  }
+
   return output;
 }
```

### 4.3 Current Code: `scripts/unified-stop.js` (lines 228-232)

```javascript
// Default output if no handler matched
if (!handled) {
  debugLog('UnifiedStop', 'No handler matched, using default output');
  outputAllow('Stop event processed.', 'Stop');
}
```

### 4.4 Proposed Change: `scripts/unified-stop.js`

```diff
 // Default output if no handler matched
 if (!handled) {
   debugLog('UnifiedStop', 'No handler matched, using default output');
-  outputAllow('Stop event processed.', 'Stop');
+  // v1.5.6: /copy 안내 조건부 추가 (코드 생성 skill 세션이었을 때)
+  const copyTip = activeSkill ? '\nTip: Use /copy to copy code blocks from this session.' : '';
+  outputAllow(`Stop event processed.${copyTip}`, 'Stop');
 }
```

### 4.5 Integration Notes (ENH-49)

- `CODE_GENERATION_SKILLS` 배열은 코드 출력이 주요 결과물인 skill만 포함한다.
- PDCA skill (`pdca`)은 포함하지 않는다 -- PDCA는 문서 생성이 주요 결과물이므로 `/copy` 안내가 적절하지 않다.
- `copyHint` 필드는 새로운 optional 필드로, 기존 JSON output 스키마를 깨지 않는다.
- unified-stop.js에서는 `activeSkill`이 있을 때만 `/copy` 팁을 추가한다 (skill 세션이 아닌 일반 Stop에서는 표시하지 않음).

---

## 5. ENH-50: CTO Team Memory Management Guide (Detailed Design)

### 5.1 New File: `docs/guides/cto-team-memory-guide.md`

```markdown
# CTO Team Memory Management Guide

> bkit v1.5.6 | Claude Code v2.1.59+ 권장
> CTO-Led Agent Teams 패턴에서의 multi-agent 메모리 관리 best practice

---

## 1. Memory Systems Overview

bkit CTO Team 패턴은 3가지 독립된 메모리 시스템을 활용합니다:

| System | Path | Format | Writer | Purpose |
|--------|------|:------:|--------|---------|
| CC auto-memory | ~/.claude/projects/*/memory/MEMORY.md | Markdown | Claude (자동) | 세션 간 학습 컨텍스트 축적 |
| bkit memory-store | {project}/docs/.bkit-memory.json | JSON | bkit hooks (프로그래밍) | PDCA 상태, 세션 카운터 |
| bkit agent-memory | {project}/.claude/agent-memory/{agent}/MEMORY.md | Markdown | Claude agents (자동) | 에이전트별 학습 메모 |

**핵심**: 3개 시스템은 서로 다른 경로, 형식, 작성자를 가지며 **충돌 없음**.

---

## 2. CTO Team Agent Distribution

| Model | Count | Agents | Memory Scope |
|-------|:-----:|--------|:------------:|
| opus | 7 | cto-lead, code-analyzer, design-validator, gap-detector, enterprise-expert, infra-architect, security-architect | project |
| sonnet | 7 | bkend-expert, pipeline-guide, starter-guide, pdca-iterator, qa-strategist, frontend-architect, product-manager | project/user |
| haiku | 2 | report-generator, qa-monitor | project |

---

## 3. Memory Optimization (v2.1.50 + v2.1.59)

### 3.1 Subagent Task State Release (v2.1.59)

CC v2.1.59에서 **완료된 subagent의 task state가 자동 해제**됩니다:

- Plan phase agent 완료 → state 해제 → Design phase agent에 메모리 여유 확보
- Enterprise 5 teammates 중 완료된 teammate의 state가 즉시 GC
- 장시간 PDCA 사이클 (Plan→Design→Do→Check→Act)에서 누적 메모리 감소

### 3.2 Memory Leak Fixes (v2.1.50)

v2.1.50에서 수정된 9건의 메모리 누수:
1. Agent Teams task GC
2. TaskOutput buffer cleanup
3. CircularBuffer overflow
4. ChildProcess cleanup
5. LSP connection cleanup
6. File history trimming
7-9. 기타 minor leaks

---

## 4. Best Practices

### 4.1 Agent 수 권장 사항

| Level | Max Teammates | Recommended | Reason |
|-------|:------------:|:-----------:|--------|
| Dynamic | 3 | 2-3 | developer + qa + frontend |
| Enterprise | 5 | 3-5 | architect + developer + qa + reviewer + security |

**팁**: 전체 PDCA 사이클을 한 세션에서 실행할 때, 한 번에 활성 agent 수를 3개 이내로 유지하면 메모리 효율이 좋습니다.

### 4.2 장시간 세션 관리

1. **Phase별 Agent 재구성**: 동일 agent를 전 phase에 걸쳐 유지하기보다, phase 전환 시 `shouldRecomposeTeam()`으로 필요한 agent만 재구성
2. **중간 세션 정리**: `/pdca team cleanup` 후 재시작으로 메모리 초기화 가능
3. **auto-memory 활용**: 세션 간 컨텍스트는 auto-memory가 자동 보존하므로, 세션을 분리해도 학습 내용 유지

### 4.3 Agent Memory 관리

- agent-memory 파일은 200줄 제한 (system prompt에 전량 주입)
- 오래된 내용은 주기적으로 정리 필요
- `MEMORY.md` 파일 직접 편집 가능

---

## 5. Known Issues and Monitoring

| Issue | Status | Impact | Workaround |
|-------|:------:|--------|-----------|
| #25131 Agent Teams lifecycle | Open | Team 종료 시 cleanup 불완전 | `/pdca team cleanup` 수동 실행 |
| #24044 MEMORY.md 이중 로딩 | Open | System prompt 크기 증가 | 모니터링, 심각하면 auto-memory 비활성화 |
| #24130 Memory concurrency | Open | 동시 쓰기 시 데이터 손실 가능 | 서로 다른 파일에 쓰므로 bkit은 안전 |
| #27281 Agent infinite loop | Open | Agent가 무한 반복 | ctrl+f로 강제 종료 |

---

## 6. Configuration Reference

### bkit.config.json team 섹션

```json
{
  "team": {
    "enabled": true,
    "displayMode": "in-process",
    "maxTeammates": 5,
    "delegateMode": false,
    "ctoAgent": "cto-lead",
    "levelOverrides": {
      "Dynamic": { "maxTeammates": 3 },
      "Enterprise": { "maxTeammates": 5 }
    }
  }
}
```

### 환경 변수

| Variable | Purpose | Required |
|----------|---------|:--------:|
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` | Agent Teams 활성화 | Yes |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY=1` | auto-memory 비활성화 | No (기본: 활성) |
```

### 5.2 Design Notes (ENH-50)

- `docs/guides/` 디렉토리를 신규 생성한다.
- 이 가이드는 사용자 대상 문서로, bkit-system/ 내부 문서와 분리한다.
- 내용은 v2.1.50 + v2.1.59의 메모리 최적화를 종합하며, CTO Team 패턴에 특화된다.
- Known Issues 섹션은 지속적 업데이트 대상이다.

---

## 6. ENH-51: Remote Control Compatibility (Detailed Design)

### 6.1 New File: `docs/guides/remote-control-compatibility.md`

```markdown
# Remote Control Compatibility Pre-check

> bkit v1.5.6 | Claude Code v2.1.58+ (Remote Control 확대)
> #28379 해결 대비 bkit skills RC 호환성 사전 점검

---

## 1. Current Status

- Remote Control: v2.1.51 도입, v2.1.58 접근 범위 확대 (Pro/Max plans)
- bkit slash commands: RC에서 **미지원** (#28379 Open)
- 영향: `/pdca`, `/starter`, `/dynamic` 등 모든 bkit slash commands가 RC UI에서 실행 불가

---

## 2. bkit Skills RC 호환성 매트릭스

### 2.1 User-Invocable Skills (12)

| Skill | Slash Command | RC 호환성 예상 | 블로커 |
|-------|--------------|:-------------:|--------|
| pdca | /pdca plan/design/do/... | Pending | #28379 |
| plan-plus | /plan-plus {feature} | Pending | #28379 |
| starter | /starter init {name} | Pending | #28379 |
| dynamic | /dynamic init {name} | Pending | #28379 |
| enterprise | /enterprise init {name} | Pending | #28379 |
| development-pipeline | /development-pipeline start | Pending | #28379 |
| code-review | /code-review {path} | Pending | #28379 |
| zero-script-qa | /zero-script-qa | Pending | #28379 |
| claude-code-learning | /claude-code-learning | Pending | #28379 |
| mobile-app | /mobile-app | Pending | #28379 |
| desktop-app | /desktop-app | Pending | #28379 |
| bkit-rules | /bkit-rules | Pending | #28379 |

### 2.2 Phase Skills (9, auto-invoked)

Phase skills는 pipeline에 의해 자동 호출되며, RC에서는 pipeline이 직접 호출되므로 phase skills의 RC 호환성은 pipeline skill에 의존합니다.

### 2.3 Agents (16)

Agent는 Task tool을 통해 호출되며, RC에서 Task tool이 지원되면 agent도 자동으로 호환됩니다. 현재 RC에서 Task tool 지원 여부는 미확인입니다.

---

## 3. 준비 사항 (#28379 해결 시)

1. 모든 12 user-invocable skills의 RC 실행 테스트
2. Hook system (SessionStart, PostToolUse 등)의 RC 환경 동작 확인
3. AskUserQuestion tool의 RC UI 렌더링 확인
4. agent-memory의 RC 세션 간 지속성 확인
5. Output Styles의 RC 적용 여부 확인

---

## 4. Timeline

- **현재**: #28379 Open, RC에서 slash commands 미지원
- **예상 해결**: CC v2.2.x 이후 (2026 Q1~Q2)
- **bkit 대응**: #28379 해결 확인 후 별도 PDCA 피처로 진행
```

### 6.2 Design Notes (ENH-51)

- 코드 변경 없음. 문서만 작성한다.
- #28379 이슈가 해결되면 이 문서를 기반으로 RC 호환성 테스트 피처를 별도 계획한다.
- 27개 skill + 16개 agent의 RC 호환성 매트릭스를 사전에 정리한다.

---

## 7. Version Bump (Detailed Design)

### 7.1 `.claude-plugin/plugin.json`

```diff
 {
   "name": "bkit",
-  "version": "1.5.5",
+  "version": "1.5.6",
   "description": "Vibecoding Kit - PDCA methodology + CTO-Led Agent Teams + Claude Code mastery for AI-native development",
```

### 7.2 `bkit.config.json`

```diff
 {
   "$schema": "./bkit.config.schema.json",
-  "version": "1.5.5",
+  "version": "1.5.6",
```

### 7.3 `CHANGELOG.md` (새 엔트리, 파일 최상단 이후)

```markdown
## [1.5.6] - 2026-02-26

### Added
- **Auto-Memory Integration** (ENH-48)
  - SessionStart hook에 CC auto-memory 안내 추가 (Memory Systems 섹션)
  - `/memory` 명령 참조를 bkit help (`commands/bkit.md`)에 추가
  - bkit memory-store와 CC auto-memory의 역할 구분 안내
  - Agent Memory 수 정정 (9 -> 14 project scope agents)
- **CTO Team Memory Management Guide** (ENH-50)
  - `docs/guides/cto-team-memory-guide.md` 신규 작성
  - v2.1.50 + v2.1.59 multi-agent 메모리 최적화 best practice
  - Agent 수 권장 사항, 장시간 세션 관리 팁
- **Remote Control Compatibility Pre-check** (ENH-51)
  - `docs/guides/remote-control-compatibility.md` 신규 작성
  - 27 skills + 16 agents RC 호환성 매트릭스
  - #28379 해결 대비 사전 점검 문서

### Changed
- **Skill Completion /copy Guidance** (ENH-49)
  - `scripts/skill-post.js`: 코드 생성 skill 완료 시 `copyHint` 필드 추가
  - `scripts/unified-stop.js`: Stop 시 `/copy` 안내 조건부 추가
  - 대상 skills: phase-4~6, code-review, starter, dynamic, enterprise, mobile-app, desktop-app
- **Version**: 1.5.5 -> 1.5.6
  - `plugin.json`, `bkit.config.json`, `session-start.js`, `CHANGELOG.md`

### Compatibility
- Claude Code: Minimum v2.1.33, Recommended v2.1.59
- Node.js: Minimum v18.0.0
- Agent Teams: Requires Claude Code v2.1.32+ with `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
```

---

## 8. Error Handling Strategy

### 8.1 ENH-48 (SessionStart)

- auto-memory 안내는 정적 문자열이므로 에러 발생 가능성 없음
- 기존 try-catch 패턴 유지 (hook 안정성)

### 8.2 ENH-49 (skill-post.js)

| Error Scenario | Handling | Impact |
|---------------|----------|--------|
| `shouldSuggestCopy()` 에서 skillName이 null/undefined | `includes()` false 반환 | 안내 미표시 (graceful) |
| `copyHint` 필드 추가로 JSON 크기 증가 | 약 50 bytes | 무시 가능 |
| unified-stop.js에서 activeSkill이 null | 조건문 false → copyTip 빈 문자열 | 안내 미표시 (graceful) |

### 8.3 ENH-50, ENH-51 (문서)

- 코드 변경 없으므로 런타임 에러 가능성 없음
- 문서 내용의 정확성은 QA 단계에서 검증

---

## 9. Test Plan

### 9.1 ENH-48 Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-48-01 | SessionStart hook 실행 시 "Memory Systems" 섹션 존재 확인 | additionalContext에 `## Memory Systems (v1.5.6)` 포함 | Unit |
| TC-48-02 | auto-memory 안내에 `/memory` 명령 참조 포함 | `Manage with \`/memory\` command` 문자열 존재 | Unit |
| TC-48-03 | bkit help에 "/memory" 항목 존재 확인 | `commands/bkit.md`에 `/memory` 라인 존재 | Content |
| TC-48-04 | Agent scope 수 정정 확인 (14 project) | `14 agents use project scope` 문자열 존재 | Content |
| TC-48-05 | SessionStart JSON 출력 유효성 | `JSON.parse()` 성공, hookEventName="SessionStart" | Unit |

### 9.2 ENH-49 Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-49-01 | phase-6-ui-integration skill 완료 시 copyHint 존재 | output.copyHint 문자열 존재 | Unit |
| TC-49-02 | pdca skill 완료 시 copyHint 미존재 | output.copyHint === undefined | Unit |
| TC-49-03 | CODE_GENERATION_SKILLS 배열 9개 skill 포함 | 배열 length === 9, 예상 skill 전부 포함 | Unit |
| TC-49-04 | unified-stop.js에서 activeSkill 있을 때 /copy 팁 포함 | 출력에 "Tip: Use /copy" 포함 | Unit |
| TC-49-05 | unified-stop.js에서 activeSkill null일 때 /copy 팁 미포함 | 출력에 "/copy" 미포함 | Unit |

### 9.3 ENH-50 Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-50-01 | cto-team-memory-guide.md 파일 존재 | `docs/guides/cto-team-memory-guide.md` 존재 | File |
| TC-50-02 | 가이드에 3개 메모리 시스템 설명 포함 | CC auto-memory, bkit memory-store, bkit agent-memory 모두 언급 | Content |
| TC-50-03 | 가이드에 v2.1.50 + v2.1.59 최적화 내용 포함 | "v2.1.50", "v2.1.59" 키워드 존재 | Content |

### 9.4 ENH-51 Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-51-01 | remote-control-compatibility.md 파일 존재 | `docs/guides/remote-control-compatibility.md` 존재 | File |
| TC-51-02 | 12 user-invocable skills 매트릭스 포함 | 12행 skill 테이블 존재 | Content |

### 9.5 Version Bump Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-VB-01 | plugin.json 버전 확인 | `"version": "1.5.6"` | Config |
| TC-VB-02 | bkit.config.json 버전 확인 | `"version": "1.5.6"` | Config |
| TC-VB-03 | session-start.js systemMessage 버전 확인 | `v1.5.6` 문자열 포함 | Code |
| TC-VB-04 | CHANGELOG.md v1.5.6 엔트리 존재 | `## [1.5.6]` 헤더 존재 | Content |

### 9.6 Regression Test Cases

| TC-ID | Description | Expected Result | Type |
|-------|-------------|-----------------|------|
| TC-REG-01 | hooks.json 13 entries 유지 | 13개 hook entry 변경 없음 | Config |
| TC-REG-02 | lib/common.js 180 exports 유지 | export 수 변경 없음 | Code |
| TC-REG-03 | 16 agents 정상 frontmatter | 모든 agent memory/model 필드 유지 | File |
| TC-REG-04 | 27 skills 정상 frontmatter | 모든 skill user-invocable/description 유지 | File |
| TC-REG-05 | docs/.bkit-memory.json 호환성 | 기존 JSON 구조 유지, 읽기/쓰기 정상 | Runtime |

### 9.7 Test Summary

| Category | Count | Priority |
|----------|:-----:|:--------:|
| ENH-48 | 5 TC | High |
| ENH-49 | 5 TC | Medium |
| ENH-50 | 3 TC | Medium |
| ENH-51 | 2 TC | Low |
| Version Bump | 4 TC | High |
| Regression | 5 TC | High |
| **Total** | **24 TC** | |

---

## 10. Implementation Order (Dependency-Based)

```
Step 1: Version Bump (FR-08)
    │   plugin.json, bkit.config.json
    │
    ▼
Step 2: session-start.js (FR-01, FR-02, FR-09)
    │   auto-memory 안내 + 버전 문자열
    │   (FR-08에 의존: 버전 문자열)
    │
    ▼
Step 3: commands/bkit.md (FR-03)                   [병렬 가능]
    │   /memory 도움말 추가
    │
Step 4: scripts/skill-post.js (FR-04)              [병렬 가능]
    │   shouldSuggestCopy() + copyHint
    │
Step 5: scripts/unified-stop.js (FR-05)            [병렬 가능]
    │   /copy 안내 조건부 추가
    │
    ▼
Step 6: docs/guides/cto-team-memory-guide.md (FR-06) [병렬 가능]
    │   CTO Team 메모리 가이드
    │
Step 7: docs/guides/remote-control-compatibility.md (FR-07) [병렬 가능]
    │   RC 호환성 사전 점검 문서
    │
    ▼
Step 8: CHANGELOG.md (FR-08, FR-10)
    │   v1.5.6 엔트리 + 호환성 버전
    │   (모든 변경 완료 후 최종 작성)
    │
    ▼
Step 9: Gap Analysis
        Design vs Implementation 검증
```

---

## 11. Coding Convention Reference

### 11.1 bkit 프로젝트 컨벤션

| Target | Rule | Example |
|--------|------|---------|
| Functions | camelCase | `shouldSuggestCopy()`, `detectAutoMemoryStatus()` |
| Constants | UPPER_SNAKE_CASE | `CODE_GENERATION_SKILLS` |
| Files | kebab-case | `skill-post.js`, `unified-stop.js` |
| Comments | Korean | `// v1.5.6: /copy 명령 안내` |
| Debug logs | debugLog pattern | `debugLog('SkillPost', 'copy hint added', { skillName })` |
| Error handling | try-catch silent | `try { ... } catch (e) { debugLog(...) }` |
| Modules | Lazy require | `let _common = null; function getCommon() { ... }` |
| Output | JSON to stdout | `console.log(JSON.stringify(output))` |

### 11.2 이 피처의 컨벤션 적용

| Item | Convention Applied |
|------|-------------------|
| `shouldSuggestCopy()` | camelCase 함수명, JSDoc 문서화 |
| `CODE_GENERATION_SKILLS` | UPPER_SNAKE_CASE 상수, 모듈 스코프 |
| `/copy` 안내 문자열 | 영어 (기존 skill-post.js 출력 패턴) |
| auto-memory 안내 문자열 | 영어 (기존 SessionStart additionalContext 패턴) |
| 신규 가이드 문서 | Korean (bkit 문서 기본 언어), Markdown 테이블 활용 |

---

## 12. File Change Summary

| File | Change Type | Lines +/- | FR |
|------|:-----------:|:---------:|:---:|
| `hooks/session-start.js` | Modify | +15 / -5 | FR-01, FR-02, FR-09 |
| `scripts/skill-post.js` | Modify | +20 / -0 | FR-04 |
| `scripts/unified-stop.js` | Modify | +3 / -1 | FR-05 |
| `commands/bkit.md` | Modify | +5 / -0 | FR-03 |
| `.claude-plugin/plugin.json` | Modify | +1 / -1 | FR-08 |
| `bkit.config.json` | Modify | +1 / -1 | FR-08 |
| `CHANGELOG.md` | Modify | +35 / -0 | FR-08, FR-10 |
| `docs/guides/cto-team-memory-guide.md` | **New** | +120 | FR-06 |
| `docs/guides/remote-control-compatibility.md` | **New** | +80 | FR-07 |
| **Total** | 7 Modify + 2 New | **+280 / -8** | |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-02-26 | Initial draft -- CTO Team 6 agents 분석 결과 기반 | CTO Lead (cto-lead, opus) |
