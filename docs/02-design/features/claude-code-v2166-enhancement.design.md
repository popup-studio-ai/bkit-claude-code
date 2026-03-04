# claude-code-v2166-enhancement Design Document

> **Summary**: CC v2.1.64~v2.1.66 신규 기능(InstructionsLoaded hook, agent_id/agent_type, continue:false, ${CLAUDE_SKILL_DIR})을 bkit v1.5.9에 통합하는 코드 레벨 설계
>
> **Project**: bkit Vibecoding Kit
> **Version**: 1.5.8 → 1.5.9
> **Author**: CTO Team (6 agents — hook-researcher, skill-researcher, agent-researcher, session-analyzer, deps-mapper, plan-reader)
> **Date**: 2026-03-04
> **Status**: Draft
> **Planning Doc**: [claude-code-v2166-enhancement.plan.md](../../01-plan/features/claude-code-v2166-enhancement.plan.md)
> **Impact Analysis**: [claude-code-v2166-impact-analysis.report.md](../../04-report/features/claude-code-v2166-impact-analysis.report.md)

---

## 1. Overview

### 1.1 Design Goals

1. **Hook 정밀도 향상**: InstructionsLoaded 신규 이벤트 + agent_id/agent_type으로 에이전트별 차별화 처리
2. **CTO Team 효율성**: continue:false로 완료된 teammate 자동 종료, 불필요한 리소스 회수
3. **Graceful Degradation**: CC v2.1.63 이하에서도 100% 호환 (fallback chain 유지)
4. **최소 변경**: 기존 10개 hook handler 패턴 유지하면서 확장
5. **Analysis Triad**: gap-detector + design-validator + code-analyzer에 background:true + context:fork 통합

### 1.2 Design Principles

- 기존 `readStdinSync()` / `outputAllow()` / `debugLog()` 패턴 준수
- hookSpecificOutput JSON 구조 하위 호환 유지 (필드 추가만, 제거 없음)
- `continue: false` 반환 전 반드시 in_progress 태스크 보호 확인
- CC v2.1.64+ 전용 기능은 `if (hookContext.agent_id)` 가드로 조건부 활성화

---

## 2. Architecture

### 2.1 변경 영향 다이어그램

```
[CLAUDE.md / .claude/rules/*.md 로드]
     │
     ▼
[instructions-loaded-handler.js]  ← NEW: ENH-60 (bkit 상태 컨텍스트 보강)
     │
     ▼
[User Request]
     │
     ▼
[session-start.js]  ← Phase 3/5: v1.5.9 안내 + 버전 업데이트
     │
     ▼
[PDCA Workflow → CTO Team]
     │
     ├─→ [SubagentStart]  → [subagent-start-handler.js]  ← ENH-62: agent_id 우선화
     ├─→ [SubagentStop]   → [subagent-stop-handler.js]   ← ENH-62: agent_id + agent_type
     ├─→ [TeammateIdle]   → [team-idle-handler.js]       ← ENH-62+63: agent_id + continue:false
     ├─→ [TaskCompleted]  → [pdca-task-completed.js]     ← ENH-62+63: agent_id + continue:false
     │
     ▼
[Agent Frontmatter]
     ├─→ gap-detector.md       ← ENH-69: background:true (기존 fork 유지)
     ├─→ design-validator.md   ← ENH-69: background:true (기존 fork 유지)
     ├─→ code-analyzer.md      ← ENH-69+70: background:true + context:fork 신규
     ├─→ security-architect.md ← ENH-69: background:true
     └─→ report-generator.md   ← ENH-69: background:true
```

### 2.2 Hook Events 변경 (10 → 11)

```
현재 (v1.5.8, 10/18):                    변경 후 (v1.5.9, 11/18):
─────────────────────                    ─────────────────────
SessionStart          ✅                 SessionStart          ✅
UserPromptSubmit      ✅                 UserPromptSubmit      ✅
PreToolUse            ✅                 PreToolUse            ✅
PostToolUse           ✅                 PostToolUse           ✅
PostToolUseFailure    ✅                 PostToolUseFailure    ✅
Stop                  ✅                 Stop                  ✅
SubagentStart         ✅                 SubagentStart         ✅  (+ agent_id/type)
SubagentStop          ✅                 SubagentStop          ✅  (+ agent_id/type)
TeammateIdle          ✅                 TeammateIdle          ✅  (+ continue:false)
TaskCompleted         ✅                 TaskCompleted         ✅  (+ continue:false)
                                         InstructionsLoaded    ✅  ← NEW
```

---

## 3. Phase 1: Hook System Enhancement (6 files)

### 3.1 scripts/instructions-loaded-handler.js (NEW — ENH-60, FR-01)

**신규 파일 생성**

```javascript
#!/usr/bin/env node
/**
 * instructions-loaded-handler.js - InstructionsLoaded Hook Handler
 * @version 1.5.9
 * @description CLAUDE.md 로드 시 bkit 현재 PDCA 상태 컨텍스트 보강 주입
 *              .claude/rules/*.md 로드 시 pass-through (추가 주입 없음)
 * @hook InstructionsLoaded (CC v2.1.64+)
 * @enh ENH-60
 */

const {
  readStdinSync,
  debugLog,
  outputAllow,
  getPdcaStatusFull,
} = require('../lib/common.js');

function main() {
  debugLog('InstructionsLoaded', 'Hook started');

  let hookContext = {};
  try {
    const input = readStdinSync();
    hookContext = typeof input === 'string' ? JSON.parse(input) : input;
  } catch (e) {
    debugLog('InstructionsLoaded', 'Failed to parse context', { error: e.message });
    outputAllow('', 'InstructionsLoaded');
    return;
  }

  const filePath = hookContext.file_path || '';
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;

  // CLAUDE.md만 보강, .claude/rules/*.md는 pass-through
  const isCLAUDEMD = filePath.endsWith('/CLAUDE.md') || filePath.endsWith('\\CLAUDE.md');

  if (!isCLAUDEMD) {
    debugLog('InstructionsLoaded', 'Non-CLAUDE.md, pass-through', { filePath });
    outputAllow('', 'InstructionsLoaded');
    return;
  }

  // bkit 현재 상태 조회
  let additionalContext = '';
  try {
    const pdcaStatus = getPdcaStatusFull();
    const primaryFeature = pdcaStatus?.primaryFeature || null;
    const featureData = primaryFeature ? pdcaStatus?.features?.[primaryFeature] : null;
    const currentPhase = featureData?.phase || null;
    const matchRate = featureData?.matchRate || null;
    const activeCount = pdcaStatus?.activeFeatures?.length || 0;

    additionalContext += `\n## bkit Context (InstructionsLoaded)\n`;
    additionalContext += `- bkit v1.5.9 active\n`;

    if (primaryFeature) {
      additionalContext += `- Primary Feature: ${primaryFeature}\n`;
      additionalContext += `- PDCA Phase: ${currentPhase || 'unknown'}\n`;
      if (matchRate !== null) {
        additionalContext += `- Match Rate: ${matchRate}%\n`;
      }
    }

    if (activeCount > 1) {
      additionalContext += `- Active Features: ${activeCount}\n`;
    }

    if (agentId) {
      additionalContext += `- Agent: ${agentId} (${agentType || 'unknown'})\n`;
    }
  } catch (e) {
    debugLog('InstructionsLoaded', 'PDCA status read failed', { error: e.message });
    additionalContext = '\n## bkit v1.5.9 active\n';
  }

  const response = {
    systemMessage: additionalContext,
    hookSpecificOutput: {
      hookEventName: 'InstructionsLoaded',
      filePath,
      agentId,
      agentType,
    }
  };

  console.log(JSON.stringify(response));
  process.exit(0);
}

main();
```

### 3.2 hooks/hooks.json (ENH-60, FR-02)

**변경 위치**: line 148 (TeammateIdle 블록 닫는 `]` 다음, 최종 `}` 직전)

**현재 코드** (lines 147-149):
```json
    ]
  }
}
```

**변경 후**:
```json
    ],
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
  }
}
```

**추가**: line 3 description 버전 업데이트
```json
"description": "bkit Vibecoding Kit v1.5.9 - Claude Code",
```

### 3.3 scripts/subagent-start-handler.js (ENH-62, FR-04)

**변경 위치**: lines 49-55 (agent 식별 로직)

**현재 코드** (lines 49-55):
```javascript
  const agentName = hookContext.agent_name
    || hookContext.agent_id
    || hookContext.tool_input?.name
    || 'unknown';
  const agentType = hookContext.agent_type
    || hookContext.tool_input?.subagent_type
    || 'agent';
```

**변경 후**:
```javascript
  // v1.5.9: agent_id 우선 (CC v2.1.64+ 공식 필드), fallback chain 유지
  const agentId = hookContext.agent_id || null;
  const agentName = agentId
    || hookContext.agent_name
    || hookContext.tool_input?.name
    || 'unknown';
  const agentType = hookContext.agent_type
    || hookContext.tool_input?.subagent_type
    || 'agent';
```

**hookSpecificOutput 변경** (response 객체 내):
```javascript
  hookSpecificOutput: {
    hookEventName: "SubagentStart",
    agentName,
    agentType,
    teamName,
    agentId,    // NEW: CC v2.1.64+
  }
```

### 3.4 scripts/subagent-stop-handler.js (ENH-62, FR-05)

**변경 위치**: lines 40-42 (agent 식별 로직)

**현재 코드** (lines 40-42):
```javascript
  const agentName = hookContext.agent_name
    || hookContext.agent_id
    || 'unknown';
```

**변경 후**:
```javascript
  // v1.5.9: agent_id 우선 (CC v2.1.64+ 공식 필드), fallback chain 유지
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;
  const agentName = agentId
    || hookContext.agent_name
    || 'unknown';
```

**hookSpecificOutput 변경** (response 객체 내):
```javascript
  hookSpecificOutput: {
    hookEventName: "SubagentStop",
    agentName,
    agentType,    // NEW
    status,
    agentId,      // NEW: CC v2.1.64+
  }
```

### 3.5 scripts/team-idle-handler.js (ENH-62+63, FR-06+08)

**변경 위치 1**: line 44 (teammate 식별 로직)

**현재 코드** (line 44):
```javascript
  const teammateId = hookContext.teammate_id || hookContext.agent_id || 'unknown';
```

**변경 후**:
```javascript
  // v1.5.9: agent_id 우선 (CC v2.1.64+), teammate_id fallback
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;
  const teammateId = agentId || hookContext.teammate_id || 'unknown';
```

**변경 위치 2**: response 생성 직전 (continue:false 로직 추가)

**추가 코드**:
```javascript
  // v1.5.9: continue:false — teammate 자동 종료 판단 (ENH-63)
  // CC v2.1.64+에서만 동작. v2.1.63 이하에서는 필드 무시.
  let shouldContinue = true;

  try {
    const pdcaStatus = getPdcaStatusFull();
    if (pdcaStatus) {
      const primaryFeature = pdcaStatus.primaryFeature;
      const featureData = primaryFeature ? pdcaStatus.features?.[primaryFeature] : null;

      // 조건 1: 현재 피처가 completed/archived
      if (featureData && (featureData.phase === 'completed' || featureData.phase === 'archived')) {
        shouldContinue = false;
        debugLog('TeammateIdle', 'Feature completed, setting continue:false', { feature: primaryFeature });
      }

      // 조건 2: 모든 active features가 completed/archived
      if (shouldContinue && !idleResult?.nextTask) {
        const allCompleted = pdcaStatus.activeFeatures?.every(f => {
          const fd = pdcaStatus.features?.[f];
          return fd && (fd.phase === 'completed' || fd.phase === 'archived');
        });
        if (allCompleted && pdcaStatus.activeFeatures?.length > 0) {
          shouldContinue = false;
          debugLog('TeammateIdle', 'All features completed, setting continue:false');
        }
      }
    }
  } catch (e) {
    shouldContinue = true; // Safety: 확인 실패 시 종료하지 않음
    debugLog('TeammateIdle', 'continue check failed, keeping true', { error: e.message });
  }
```

**hookSpecificOutput 변경**:
```javascript
  hookSpecificOutput: {
    hookEventName: "TeammateIdle",
    teammateId,
    agentId,          // NEW: CC v2.1.64+
    agentType,        // NEW: CC v2.1.64+
    nextTask: idleResult?.nextTask || null,
    continue: shouldContinue,  // NEW: ENH-63
    additionalContext: /* ... existing ... */
  }
```

### 3.6 scripts/pdca-task-completed.js (ENH-62+63, FR-07+08)

**변경 위치 1**: line 46 직후 (hookContext 파싱 후)

**추가 코드**:
```javascript
  // v1.5.9: agent_id/agent_type (CC v2.1.64+)
  const agentId = hookContext.agent_id || null;
  const agentType = hookContext.agent_type || null;
```

**변경 위치 2**: line 83 직후 (autoAdvancePdcaPhase 결과 후), response 생성 직전

**추가 코드**:
```javascript
  // v1.5.9: continue:false — teammate 자동 종료 판단 (ENH-63)
  let shouldContinue = true;

  // 조건 1: Report phase 완료 (마지막 PDCA 단계)
  if (detectedPhase === 'report') {
    shouldContinue = false;
    debugLog('TaskCompleted', 'Report phase completed, setting continue:false');
  }

  // 조건 2: Feature가 completed/archived
  if (shouldContinue) {
    try {
      const currentStatus = getPdcaStatusFull();
      const featureData = currentStatus?.features?.[featureName];
      if (featureData && (featureData.phase === 'completed' || featureData.phase === 'archived')) {
        shouldContinue = false;
        debugLog('TaskCompleted', 'Feature completed, setting continue:false');
      }
    } catch (e) {
      shouldContinue = true; // Safety
    }
  }
```

**hookSpecificOutput 변경**:
```javascript
  hookSpecificOutput: {
    hookEventName: "TaskCompleted",
    pdcaPhase: detectedPhase,
    nextPhase: result?.phase || null,
    feature: featureName,
    autoAdvanced: true,
    agentId,           // NEW: CC v2.1.64+
    agentType,         // NEW: CC v2.1.64+
    continue: shouldContinue,  // NEW: ENH-63
    additionalContext: /* ... existing ... */
  }
```

---

## 4. Phase 2: Skill Infrastructure Enhancement (DOCUMENT — ENH-61, FR-09~10)

### 4.1 ${CLAUDE_SKILL_DIR} 적용 분석 (skill-researcher 27개 전수 조사)

**현황**: 27개 스킬 전수 조사 결과:
- **imports 사용 스킬**: 22개 (총 30개 import 항목), 모두 `${PLUGIN_ROOT}/templates/` 참조
- **imports 미사용 스킬**: 5개 (development-pipeline, zero-script-qa, desktop-app, mobile-app, bkit-templates)
- **`${CLAUDE_PLUGIN_ROOT}` body 참조**: 2개 스킬 (bkit-templates: 8회, bkit-rules: 4회) — **의미적으로 정확** (플러그인 루트 참조)
- 스킬 자체 디렉토리에 SKILL.md 외 supporting 파일이 있는 스킬: **0개**
- `${CLAUDE_SKILL_DIR}` 즉시 필요한 스킬: **0개**

### 4.2 변경하지 않는 이유

**bkit-templates** body text의 `${CLAUDE_PLUGIN_ROOT}/templates/plan.template.md`:
- `${CLAUDE_PLUGIN_ROOT}` → 플러그인 루트(`bkit-claude-code/`) 해석 — **정확함**
- `${CLAUDE_SKILL_DIR}` → 스킬 디렉토리(`skills/bkit-templates/`) 해석 — **의미적으로 틀림**
- `${PLUGIN_ROOT}` → imports 전용 변수, body text에서의 치환 보장 없음
- **결론**: 기존 `${CLAUDE_PLUGIN_ROOT}` 유지가 의미적으로 가장 정확

**하위 호환 리스크**: `${CLAUDE_SKILL_DIR}`을 imports에 사용하면 CC v2.1.63 이하에서 미치환 → import 실패. bkit은 CC v2.1.34+ 지원이므로 BREAKING 리스크.

### 4.3 v1.5.9 범위 판정

| 항목 | 판정 | 이유 |
|------|------|------|
| 27개 스킬 imports 변경 | **SKIP** | 모두 공유 리소스 참조, ${PLUGIN_ROOT} 유지 |
| body text `${CLAUDE_PLUGIN_ROOT}` 변경 | **SKIP** | 의미적으로 정확, 변경 시 오류 발생 |
| session-start.js에 ${CLAUDE_SKILL_DIR} 안내 | **DOCUMENT** | v1.5.9 Enhancements에 사용법 안내 |
| **스킬 파일 변경 합계** | **0건** | Documentation only |

### 4.4 v1.6.0+ 미래 패턴 (참고)

CC v2.1.64+가 최소 지원 버전이 될 때 스킬 로컬 리소스 패턴 도입 가능:
```yaml
# 스킬이 자체 리소스를 가질 때
skills/pdca/
├── SKILL.md
└── pdca-workflow.md           # skill-local resource

imports:
  - ${PLUGIN_ROOT}/templates/plan.template.md      # 공유 템플릿
  - ${CLAUDE_SKILL_DIR}/pdca-workflow.md            # 스킬 로컬 리소스
```

---

## 5. Phase 3: Documentation & Awareness (ENH-64~68, FR-11~16)

### 5.1 hooks/session-start.js — v1.5.9 Enhancements (FR-11~14)

**변경 위치 1**: JSDoc header (line 3 이후 추가)

**추가 코드**:
```javascript
 * v1.5.9 Changes:
 * - ENH-60: InstructionsLoaded hook handler (bkit context injection)
 * - ENH-62: agent_id/agent_type in all hook handlers
 * - ENH-63: continue:false in TeammateIdle/TaskCompleted hooks
 * - ENH-64: /reload-plugins workflow documentation
 * - ENH-65: includeGitInstructions setting awareness
 * - ENH-66: CLAUDE_CODE_AUTO_MEMORY_PATH env var documentation
 * - ENH-68: Official docs URL update (code.claude.com)
 * - ENH-69: background:true for 5 analysis agents
 * - ENH-70: context:fork for code-analyzer
 * - CC recommended version: v2.1.63 -> v2.1.66
 *
```

**변경 위치 2**: additionalContext v1.5.9 섹션 (line 706 직전, v1.5.8 Enhancements 앞에 삽입)

**추가 코드**:
```javascript
  // v1.5.9: CC v2.1.66 Enhancement Integration
  additionalContext += `\n## v1.5.9 Enhancements (CC v2.1.66)\n`;
  additionalContext += `- InstructionsLoaded hook: CLAUDE.md 로드 시 bkit 컨텍스트 자동 보강\n`;
  additionalContext += `- Hook agent_id/agent_type: 모든 hook에서 에이전트 식별 가능 (CC v2.1.64+)\n`;
  additionalContext += `- TeammateIdle/TaskCompleted continue:false: CTO Team 자동 종료 제어\n`;
  additionalContext += `- \${CLAUDE_SKILL_DIR}: 스킬 내 자기 디렉토리 참조 (CC v2.1.64+)\n`;
  additionalContext += `- /reload-plugins: 세션 재시작 없이 플러그인 변경 반영 (CC v2.1.64+)\n`;
  additionalContext += `- includeGitInstructions: git 지시문 포함 여부 설정 가능\n`;
  additionalContext += `- CLAUDE_CODE_AUTO_MEMORY_PATH: auto-memory 경로 env var로 커스터마이징\n`;
  additionalContext += `- Official docs: code.claude.com (docs.anthropic.com 자동 리다이렉트)\n`;
  additionalContext += `- CC recommended version: v2.1.63 -> v2.1.66\n`;
  additionalContext += `\n`;
```

**변경 위치 3**: 버전 문자열 업데이트 (8개소)

| Line (approx) | 현재 | 변경 후 |
|------|------|---------|
| 3 | `v1.5.8 Changes:` header 위에 | v1.5.9 Changes 블록 추가 |
| 535 | `(v1.5.8)` | `(v1.5.9)` |
| 568 | `v1.5.8 - Session Startup` | `v1.5.9 - Session Startup` |
| 632 | `Output Styles (v1.5.8)` | `Output Styles (v1.5.9)` |
| 639 | `Memory Systems (v1.5.8)` | `Memory Systems (v1.5.9)` |
| 681 | `Multi-Feature PDCA (v1.5.8)` | `Multi-Feature PDCA (v1.5.9)` |
| 729 | `Feature Usage Report (v1.5.8` | `Feature Usage Report (v1.5.9` |
| 785 | `v1.5.8 activated` | `v1.5.9 activated` |

### 5.2 URL 업데이트 (ENH-68, FR-15)

**대상 파일 1**: `README.md` line 4

**현재**:
```markdown
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.63+-purple.svg)](https://docs.anthropic.com/en/docs/claude-code/getting-started)
```

**변경 후**:
```markdown
[![Claude Code](https://img.shields.io/badge/Claude%20Code-v2.1.66+-purple.svg)](https://code.claude.com/docs/en/quickstart)
```

**대상 파일 2**: `README.md` version badge

**현재**:
```markdown
[![Version](https://img.shields.io/badge/Version-1.5.8-green.svg)](CHANGELOG.md)
```

**변경 후**:
```markdown
[![Version](https://img.shields.io/badge/Version-1.5.9-green.svg)](CHANGELOG.md)
```

> Note: refs/CLAUDE-CODE-OFFICIAL-SOURCES.md의 docs.anthropic.com은 Anthropic API 문서(CC 문서가 아님)이므로 변경하지 않음.

### 5.3 #30586 PostToolUse 모니터링 (ENH-67, FR-16)

**대상 파일**: `scripts/unified-write-post.js`

**추가 위치**: 파일 상단 JSDoc 블록 또는 main 함수 시작부

```javascript
// v1.5.9: Monitor #30586 PostToolUse duplication
// If this handler fires twice per single tool use, check:
// https://github.com/anthropics/claude-code/issues/30586
// Workaround: idempotency guard with invocation timestamp if needed
```

---

## 6. Phase 4: Agent Enhancement (ENH-69~71, FR-17~19)

### 6.1 background:true 적용 (ENH-69, FR-17) — 5 agents

**판정**: IMPLEMENT (5 agents)

분석 근거: 5개 에이전트 모두 Read-only 또는 document-only output으로, 파일 충돌 위험 없음. `background: true`는 default이며 스폰 시 `run_in_background: false`로 override 가능.

| Agent | 현재 frontmatter | 추가 필드 |
|-------|------------------|-----------|
| gap-detector | context: fork, mergeResult: false | **background: true** |
| design-validator | context: fork, mergeResult: false | **background: true** |
| code-analyzer | (없음) | **background: true** |
| security-architect | (없음) | **background: true** |
| report-generator | (없음) | **background: true** |

**각 .md 파일에 추가할 frontmatter**:
```yaml
background: true
```

### 6.2 context:fork 적용 (ENH-70, FR-18) — code-analyzer

**판정**: IMPLEMENT (code-analyzer 1개만)

분석 근거: code-analyzer는 read-only 분석 에이전트로, 대용량 분석 출력이 parent context를 오염시킴. gap-detector/design-validator와 동일한 Analysis Triad 패턴 적용.

**파일**: `.claude/agents/code-analyzer.md`

**추가 frontmatter**:
```yaml
context: fork
mergeResult: false
```

### 6.3 WorktreeCreate/Remove (ENH-71, FR-19) — DEFER

**판정**: DEFER (v1.6.0+)

이유:
- Worktree 기반 PDCA 격리는 Path Registry 변경 필요
- CC #27282 (worktree dir config) 미해결
- 사용자 수요 미확인

v1.5.9 범위: session-start.js에 사용 가능 인지만 포함.

---

## 7. Phase 5: Version & Release (FR-20~25)

### 7.1 Version Bump Files

| File | Field | 현재 | 변경 후 |
|------|-------|------|---------|
| `bkit.config.json` L3 | version | "1.5.8" | "1.5.9" |
| `.claude-plugin/plugin.json` L3 | version | "1.5.8" | "1.5.9" |
| `hooks/hooks.json` L3 | description | "v1.5.8" | "v1.5.9" |
| `hooks/session-start.js` L3 | JSDoc | v1.5.8 | v1.5.9 |
| `hooks/session-start.js` L568 | header | v1.5.8 | v1.5.9 |
| `hooks/session-start.js` L785 | systemMessage | v1.5.8 | v1.5.9 |

### 7.2 lib/common.js Staleness 수정 (FR-25)

| Location | 현재 코멘트 | 정확한 값 |
|----------|------------|----------|
| L96 | `PDCA Module (54 exports)` | `PDCA Module (56 exports)` |
| L129 | `Status (17 exports)` | `Status (19 exports)` |
| L150 | `Automation (11 exports)` | `Automation (13 exports)` |
| Grand Total | 188 (implicit) | **190** |

**추가**: `lib/pdca/index.js` L44 — `Status (17 exports)` → `Status (19 exports)`

### 7.3 CC 권장 버전 업데이트 (FR-24)

**session-start.js JSDoc**: CC recommended version: v2.1.63 → v2.1.66

---

## 8. Implementation Guide

### 8.1 File Structure (변경 파일)

```
bkit-claude-code/
├── agents/
│   ├── code-analyzer.md          ← background:true + context:fork
│   ├── design-validator.md       ← background:true
│   ├── gap-detector.md           ← background:true
│   ├── report-generator.md       ← background:true
│   └── security-architect.md     ← background:true
├── .claude-plugin/
│   └── plugin.json               ← version 1.5.9
├── bkit.config.json              ← version 1.5.9
├── README.md                     ← CC badge v2.1.66+, version 1.5.9, URL update
├── hooks/
│   ├── hooks.json                ← +InstructionsLoaded, version 1.5.9
│   └── session-start.js          ← v1.5.9 안내 + JSDoc + 버전
├── scripts/
│   ├── instructions-loaded-handler.js  ← NEW: ENH-60
│   ├── subagent-start-handler.js       ← agent_id 우선화
│   ├── subagent-stop-handler.js        ← agent_id + agent_type
│   ├── team-idle-handler.js            ← agent_id + continue:false
│   ├── pdca-task-completed.js          ← agent_id + continue:false
│   └── unified-write-post.js           ← #30586 모니터링 코멘트
└── lib/
    ├── common.js                       ← 코멘트 staleness 수정
    └── pdca/index.js                   ← 코멘트 staleness 수정
```

### 8.2 Implementation Order (Checklist)

```
Phase 1: Hook System Enhancement (6 files)
  [ ] P1-A: scripts/instructions-loaded-handler.js 생성 (ENH-60)
  [ ] P1-B: hooks/hooks.json에 InstructionsLoaded 등록 (ENH-60)
  [ ] P1-C: scripts/subagent-start-handler.js agent_id 우선화 (ENH-62)
  [ ] P1-D: scripts/subagent-stop-handler.js agent_id + agent_type (ENH-62)
  [ ] P1-E: scripts/team-idle-handler.js agent_id + continue:false (ENH-62+63)
  [ ] P1-F: scripts/pdca-task-completed.js agent_id + continue:false (ENH-62+63)

Phase 2: Skill Infrastructure (0 files — Documentation only)
  [ ] P2-A: session-start.js에 ${CLAUDE_SKILL_DIR} 사용법 안내 (Phase 3에서 통합)
  → 스킬 파일 변경 없음 (27개 전수 조사: 즉시 필요 0건, 하위 호환 리스크)

Phase 3: Documentation & Awareness (3 files)
  [ ] P3-A: hooks/session-start.js v1.5.9 Enhancements 섹션 추가
  [ ] P3-B: README.md URL + badge 업데이트
  [ ] P3-C: scripts/unified-write-post.js #30586 모니터링 코멘트

Phase 4: Agent Enhancement (6 files)
  [ ] P4-A: .claude/agents/gap-detector.md background:true
  [ ] P4-B: .claude/agents/design-validator.md background:true
  [ ] P4-C: .claude/agents/code-analyzer.md background:true + context:fork
  [ ] P4-D: .claude/agents/security-architect.md background:true
  [ ] P4-E: .claude/agents/report-generator.md background:true

Phase 5: Version & Release (5 files)
  [ ] P5-A: bkit.config.json version 1.5.9
  [ ] P5-B: .claude-plugin/plugin.json version 1.5.9
  [ ] P5-C: hooks/hooks.json description v1.5.9
  [ ] P5-D: hooks/session-start.js JSDoc + 버전 문자열 (8개소)
  [ ] P5-E: lib/common.js + lib/pdca/index.js 코멘트 staleness 수정
```

---

## 9. Test Plan

### 9.1 Test Scope

| Type | Target | Method |
|------|--------|--------|
| Hook 동작 | InstructionsLoaded handler | JSON 출력 검증 (CLAUDE.md vs rules) |
| 필드 검증 | agent_id/agent_type 4개 handler | hookSpecificOutput 필드 존재 확인 |
| 자동 종료 | continue:false 2개 handler | completed feature에서 continue:false 확인 |
| 호환성 | CC v2.1.63 fallback | agent_id=undefined 시 기존 동작 확인 |
| 버전 동기화 | 5개 파일 version 일치 | "1.5.9" 문자열 비교 |
| Agent frontmatter | 5+1 에이전트 | background:true + context:fork 존재 확인 |

### 9.2 Key Test Cases

- [ ] InstructionsLoaded: CLAUDE.md 로드 시 bkit context 주입 확인
- [ ] InstructionsLoaded: .claude/rules/*.md 로드 시 pass-through 확인
- [ ] subagent-start: hookContext.agent_id 존재 시 우선 사용 확인
- [ ] subagent-start: hookContext.agent_id=undefined 시 fallback chain 정상 동작
- [ ] team-idle: completed feature에서 continue:false 반환 확인
- [ ] team-idle: working teammate에서 continue:true 유지 확인
- [ ] pdca-task-completed: report phase 완료 시 continue:false 확인
- [ ] pdca-task-completed: do phase 진행 중 continue:true 유지 확인
- [ ] hooks.json: 11개 hook events 등록, JSON 구문 유효
- [ ] version: bkit.config.json, plugin.json, hooks.json, session-start.js 모두 "1.5.9"
- [ ] README.md: CC v2.1.66+ badge, code.claude.com URL
- [ ] common.js: PDCA exports 56, Status 19, Automation 13

---

## 10. CC Compatibility Matrix

| 기능 | CC v2.1.63 이하 | CC v2.1.64+ | bkit v1.5.9 대응 |
|------|:---------------:|:-----------:|:-----------------:|
| InstructionsLoaded hook | handler 미실행 | 정상 동작 | SessionStart fallback |
| agent_id/agent_type | undefined | 공식 필드 | fallback chain 유지 |
| continue:false | 필드 무시 | teammate 종료 | 기존 동작 유지 |
| ${CLAUDE_SKILL_DIR} | literal string | 디렉토리 경로 | 문서화만 (imports 미사용) |
| background:true | v2.1.49+ 지원 | 지원 | v2.1.49+ 호환 |
| context:fork | v2.1.49+ 지원 | 지원 | v2.1.49+ 호환 |

---

## 11. Session-Start.js 변경 요약

session-start.js는 Phase 3 + Phase 5에서 변경됩니다:

| 변경 항목 | Line (approx) | Phase | 내용 |
|-----------|:-------------:|:-----:|------|
| JSDoc v1.5.9 Changes | 3-14 | 5 | v1.5.9 ENH 목록 |
| additionalContext header | 568 | 5 | `v1.5.9` |
| v1.5.9 Enhancements 섹션 | ~706 (before v1.5.8) | 3 | CC v2.1.66 features 9항목 |
| CC Commands table version | 535 | 5 | `(v1.5.9)` |
| Output Styles version | 632 | 5 | `(v1.5.9)` |
| Memory Systems version | 639 | 5 | `(v1.5.9)` |
| Multi-Feature version | 681 | 5 | `(v1.5.9)` |
| Feature Usage Report version | 729 | 5 | `(v1.5.9)` |
| systemMessage version | 785 | 5 | `v1.5.9` |

---

## 12. ENH Implementation Summary

| ENH | 판정 | Phase | Files | Lines Changed |
|-----|------|:-----:|------:|:-------------:|
| **ENH-60** | IMPLEMENT | 1 | 2 (1 new + 1 mod) | ~80 new + 10 mod |
| **ENH-61** | DOCUMENT | 2→3 | 0 (session-start 안내만) | ~2 |
| **ENH-62** | IMPLEMENT | 1 | 4 | ~40 |
| **ENH-63** | IMPLEMENT | 1 | 2 | ~60 |
| **ENH-64** | DOCUMENT | 3 | 1 | ~2 |
| **ENH-65** | DOCUMENT | 3 | 1 | ~1 |
| **ENH-66** | DOCUMENT | 3 | 1 | ~1 |
| **ENH-67** | MONITOR | 3 | 1 | ~4 |
| **ENH-68** | IMPLEMENT | 3 | 1 | ~4 |
| **ENH-69** | IMPLEMENT | 4 | 5 | ~5 |
| **ENH-70** | IMPLEMENT | 4 | 1 | ~2 |
| **ENH-71** | DEFER | - | 0 | 0 |
| **합계** | | | **18 files** (1 new) | **~209 lines** |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-04 | Initial draft — 6 agents research, 25 FR, 5 Phases, 19 files | CTO Team (6 agents) |
| 0.2 | 2026-03-04 | Phase 2 보정 — skill-researcher 전수 조사 반영, bkit-templates 변경 취소 (18 files) | CTO Team |
