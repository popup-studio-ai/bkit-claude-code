# Claude Code v2.1.73~v2.1.78 bkit v1.6.2 상세 설계서

> **Summary**: CC v2.1.73~v2.1.78 영향 분석 기반 bkit v1.6.2 전면 활용형 업그레이드 상세 설계
>
> **Project**: bkit Vibecoding Kit
> **Version**: v1.6.1 -> v1.6.2
> **Author**: CTO Team (8 Agents)
> **Date**: 2026-03-18
> **Status**: Draft
> **Planning Doc**: [claude-code-v2178-impact-analysis.plan.md](../01-plan/features/claude-code-v2178-impact-analysis.plan.md)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Plan 문서의 14개 ENH를 구현하려면 파일별 변경 명세, 함수 시그니처, 데이터 구조, hooks.json 변경, agent frontmatter 표준 등 구현 수준의 상세 설계가 필요 |
| **Solution** | 8개 전문 에이전트 병렬 분석으로 코드 변경 8파일 + 신규 스크립트 2파일 + agent frontmatter 29파일 + 문서 16파일의 정밀 설계 완성 |
| **Function/UX Effect** | Hook events 10->14, Agent frontmatter effort/maxTurns 네이티브 지원, ${CLAUDE_PLUGIN_DATA} 영구 상태 저장소, exports 208->213 |
| **Core Value** | bkit 3대 철학(Automation First, No Guessing, Docs=Code) 준수 + 44 연속 호환 릴리스 기반 제로 리스크 업그레이드 |

---

## 1. 설계 개요

### 1.1 설계 목표

1. Plan 문서의 14개 ENH 전체에 대한 구현 수준 상세 설계
2. 파일별 before/after diff 수준의 변경 명세
3. 신규 스크립트의 전체 구조 설계
4. 29개 agent frontmatter 변경 표준
5. 호환성 검증 TC 설계
6. bkit 3대 철학 준수 검증

### 1.2 설계 원칙

- **Automation First**: 수동 개입 최소화, hook 기반 자동화
- **No Guessing**: 모든 설정 명시적 선언, 추측 금지
- **Docs=Code**: 문서와 코드의 동기화 보장

### 1.3 변경 범위 요약

| Category | Files | New Files | LOC Change |
|----------|-------|-----------|------------|
| lib/ 코드 | 4 | 0 | +80 |
| scripts/ | 0 | 2 | +200 |
| hooks/ | 1 | 0 | +20 |
| agents/ | 29 | 0 | +87 (3 lines x 29) |
| bkit-system/ | 4 | 0 | +120 |
| docs/ | 0 | 0 | 본 문서 |
| plugin.json | 1 | 0 | +1 |
| **Total** | **39** | **2** | **~508** |

---

## 2. P0: 핵심 기반 상세 설계 (3건)

### 2.1 ENH-119: ${CLAUDE_PLUGIN_DATA} 영구 상태 저장소 활용

#### 2.1.1 배경

CC v2.1.78에서 `${CLAUDE_PLUGIN_DATA}` 환경 변수가 추가되었다. 이 경로는 플러그인 업데이트/재설치 시에도 보존되는 영구 저장소를 가리킨다. 현재 bkit의 `.bkit/state/` 디렉토리는 플러그인 디렉토리 외부(프로젝트 루트)에 있어 직접적인 데이터 손실 위험은 낮지만, `${CLAUDE_PLUGIN_DATA}`를 백업 저장소로 활용하면 추가 안전망을 확보할 수 있다.

#### 2.1.2 lib/core/paths.js 변경

**Before** (line 16-24):
```javascript
const STATE_PATHS = {
  root:       () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
  state:      () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};
```

**After**:
```javascript
const STATE_PATHS = {
  root:       () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
  state:      () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
  // v1.6.2: ${CLAUDE_PLUGIN_DATA} persistent backup (ENH-119)
  pluginData: () => process.env.CLAUDE_PLUGIN_DATA || null,
  pluginDataBackup: () => {
    const pd = process.env.CLAUDE_PLUGIN_DATA;
    return pd ? path.join(pd, 'backup') : null;
  },
};
```

**새로운 함수 추가** (module.exports 앞):

```javascript
/**
 * Backup critical state files to ${CLAUDE_PLUGIN_DATA}
 * Called after every savePdcaStatus() and saveMemory()
 * @returns {{ backed: string[], skipped: string[] }}
 */
function backupToPluginData() {
  const backupDir = STATE_PATHS.pluginDataBackup();
  if (!backupDir) return { backed: [], skipped: ['no CLAUDE_PLUGIN_DATA'] };

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  } catch (e) {
    return { backed: [], skipped: [e.message] };
  }

  const targets = [
    { src: STATE_PATHS.pdcaStatus, name: 'pdca-status.backup.json' },
    { src: STATE_PATHS.memory, name: 'memory.backup.json' },
  ];

  const backed = [];
  const skipped = [];

  for (const t of targets) {
    try {
      const srcPath = t.src();
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(backupDir, t.name));
        backed.push(t.name);
      }
    } catch (e) {
      skipped.push(`${t.name}: ${e.message}`);
    }
  }

  // version-history.json: track backup timestamps
  try {
    const historyPath = path.join(backupDir, 'version-history.json');
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    history.push({
      timestamp: new Date().toISOString(),
      bkitVersion: '1.6.2',
      backed,
    });
    // Keep last 50 entries
    if (history.length > 50) history = history.slice(-50);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  } catch (e) {
    // version-history is non-critical
  }

  return { backed, skipped };
}

/**
 * Restore state files from ${CLAUDE_PLUGIN_DATA} backup
 * Called during SessionStart when primary state files are missing/corrupted
 * @returns {{ restored: string[], skipped: string[] }}
 */
function restoreFromPluginData() {
  const backupDir = STATE_PATHS.pluginDataBackup();
  if (!backupDir || !fs.existsSync(backupDir)) {
    return { restored: [], skipped: ['no backup directory'] };
  }

  const targets = [
    { backup: 'pdca-status.backup.json', dest: STATE_PATHS.pdcaStatus, name: 'pdca-status' },
    { backup: 'memory.backup.json', dest: STATE_PATHS.memory, name: 'memory' },
  ];

  const restored = [];
  const skipped = [];

  for (const t of targets) {
    const destPath = t.dest();
    const backupPath = path.join(backupDir, t.backup);

    // Only restore if destination is missing AND backup exists
    if (!fs.existsSync(destPath) && fs.existsSync(backupPath)) {
      try {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(backupPath, destPath);
        restored.push(t.name);
      } catch (e) {
        skipped.push(`${t.name}: ${e.message}`);
      }
    }
  }

  return { restored, skipped };
}
```

**module.exports 변경**:

```javascript
// Before
module.exports = {
  STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs,
  getDocPaths, resolveDocPaths, findDoc, getArchivePath,
};

// After
module.exports = {
  STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs,
  getDocPaths, resolveDocPaths, findDoc, getArchivePath,
  // v1.6.2: ${CLAUDE_PLUGIN_DATA} backup/restore (ENH-119)
  backupToPluginData, restoreFromPluginData,
};
```

**LOC 변경**: 158 -> ~238 (+80)
**Exports 변경**: 8 -> 10 (+2)

#### 2.1.3 lib/pdca/status.js 변경

**savePdcaStatus() 함수 내부에 백업 호출 추가**:

```javascript
// Before (line 190)
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    globalCache.set('pdca-status', status);
    debugLog('PDCA', 'Status saved', { version: status.version });

// After
    fs.writeFileSync(statusPath, JSON.stringify(status, null, 2));
    globalCache.set('pdca-status', status);
    debugLog('PDCA', 'Status saved', { version: status.version });

    // v1.6.2: Backup to ${CLAUDE_PLUGIN_DATA} (ENH-119)
    try {
      const { backupToPluginData } = require('../core/paths');
      backupToPluginData();
    } catch (e) {
      // Non-critical: backup failure should not block status save
    }
```

**LOC 변경**: +7

#### 2.1.4 lib/memory-store.js 변경

**saveMemory() 함수 내부에 백업 호출 추가**:

```javascript
// Before (line 71-72)
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(_memoryCache, null, 2));
    common.debugLog('MemoryStore', 'Memory saved');

// After
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(_memoryCache, null, 2));
    common.debugLog('MemoryStore', 'Memory saved');

    // v1.6.2: Backup to ${CLAUDE_PLUGIN_DATA} (ENH-119)
    try {
      const { backupToPluginData } = require('./core/paths');
      backupToPluginData();
    } catch (e) {
      // Non-critical
    }
```

**LOC 변경**: +6

#### 2.1.5 hooks/session-start.js 변경

**Legacy migration 블록 직후(line 111)에 PLUGIN_DATA 복구 로직 추가**:

```javascript
// v1.6.2: Restore from ${CLAUDE_PLUGIN_DATA} if primary state files missing (ENH-119)
try {
  const { restoreFromPluginData } = require('../lib/core/paths');
  const restoreResult = restoreFromPluginData();
  if (restoreResult.restored.length > 0) {
    debugLog('SessionStart', 'Restored from PLUGIN_DATA backup', {
      restored: restoreResult.restored
    });
  }
} catch (e) {
  debugLog('SessionStart', 'PLUGIN_DATA restore skipped', { error: e.message });
}
```

**LOC 변경**: +10

#### 2.1.6 lib/core/index.js 변경

```javascript
// Before (Paths exports)
  // Paths (8 exports - v1.5.8 Path Registry + Doc Path Registry)

// After
  // Paths (10 exports - v1.6.2 + PLUGIN_DATA backup/restore)
  STATE_PATHS: paths.STATE_PATHS,
  LEGACY_PATHS: paths.LEGACY_PATHS,
  CONFIG_PATHS: paths.CONFIG_PATHS,
  ensureBkitDirs: paths.ensureBkitDirs,
  getDocPaths: paths.getDocPaths,
  resolveDocPaths: paths.resolveDocPaths,
  findDoc: paths.findDoc,
  getArchivePath: paths.getArchivePath,
  backupToPluginData: paths.backupToPluginData,
  restoreFromPluginData: paths.restoreFromPluginData,
```

#### 2.1.7 lib/common.js 변경

```javascript
// Before (Paths section)
  // Paths (8 exports - v1.5.8 Path Registry + Doc Path Registry)

// After
  // Paths (10 exports - v1.6.2 + PLUGIN_DATA backup/restore ENH-119)
  STATE_PATHS: core.STATE_PATHS,
  LEGACY_PATHS: core.LEGACY_PATHS,
  CONFIG_PATHS: core.CONFIG_PATHS,
  ensureBkitDirs: core.ensureBkitDirs,
  getDocPaths: core.getDocPaths,
  resolveDocPaths: core.resolveDocPaths,
  findDoc: core.findDoc,
  getArchivePath: core.getArchivePath,
  backupToPluginData: core.backupToPluginData,
  restoreFromPluginData: core.restoreFromPluginData,
```

**common.js exports 변경**: 208 -> 210 (+2)

#### 2.1.8 데이터 구조

```
${CLAUDE_PLUGIN_DATA}/           # CC가 관리하는 영구 저장소
  backup/
    pdca-status.backup.json      # .bkit/state/pdca-status.json 미러
    memory.backup.json           # .bkit/state/memory.json 미러
    version-history.json         # 백업 이력 추적
```

**version-history.json 스키마**:
```json
[
  {
    "timestamp": "2026-03-18T10:00:00.000Z",
    "bkitVersion": "1.6.2",
    "backed": ["pdca-status.backup.json", "memory.backup.json"]
  }
]
```

---

### 2.2 ENH-120: Plugin Agent Frontmatter 확장

#### 2.2.1 배경

CC v2.1.78에서 플러그인 에이전트의 frontmatter에 `effort`, `maxTurns`, `disallowedTools`를 네이티브로 지원한다. 현재 29개 agent 중 `disallowedTools`만 일부 사용 중이며, `effort`와 `maxTurns`는 미사용 상태다.

#### 2.2.2 Agent Frontmatter 표준 (v1.6.2)

```yaml
---
name: {agent-name}
description: |
  {description}
model: opus|sonnet|haiku
effort: high|medium|low            # NEW (v1.6.2, ENH-120)
maxTurns: {number}                  # NEW (v1.6.2, ENH-120)
permissionMode: acceptEdits|plan
memory: project|user|session
disallowedTools:                    # NATIVE support confirmed (v2.1.78)
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
---
```

#### 2.2.3 29개 Agent 변경 명세

##### Opus Agents (7개) - effort: high, maxTurns: 50/30

| Agent | effort | maxTurns | 근거 |
|-------|--------|----------|------|
| cto-lead | high | 50 | CTO 오케스트레이션, 장기 세션 허용 |
| code-analyzer | high | 30 | 심층 코드 분석 |
| enterprise-expert | high | 30 | 아키텍처 설계 |
| gap-detector | high | 30 | 설계-구현 비교 |
| infra-architect | high | 30 | 인프라 설계 |
| security-architect | high | 30 | 보안 분석 |
| pdca-iterator | high | 30 | 반복 개선 |

**cto-lead.md frontmatter diff**:

```yaml
# Before
---
name: cto-lead
description: |
  CTO-level team lead agent...
permissionMode: acceptEdits
memory: project
model: opus
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
---

# After
---
name: cto-lead
description: |
  CTO-level team lead agent...
model: opus
effort: high
maxTurns: 50
permissionMode: acceptEdits
memory: project
disallowedTools:
  - "Bash(rm -rf*)"
  - "Bash(git push*)"
  - "Bash(git reset --hard*)"
---
```

**gap-detector.md frontmatter diff** (permissionMode: plan agent 예시):

```yaml
# Before
---
name: gap-detector
description: |
  Agent that detects gaps...
linked-from-skills:
  - pdca: analyze
  - phase-8-review: gap
imports:
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
context: fork
mergeResult: false
permissionMode: plan
memory: project
disallowedTools:
  - Write
  - Edit
model: opus
---

# After
---
name: gap-detector
description: |
  Agent that detects gaps...
model: opus
effort: high
maxTurns: 30
linked-from-skills:
  - pdca: analyze
  - phase-8-review: gap
imports:
  - ${PLUGIN_ROOT}/templates/shared/api-patterns.md
context: fork
mergeResult: false
permissionMode: plan
memory: project
disallowedTools:
  - Write
  - Edit
---
```

> **Note**: `model` 필드를 frontmatter 상단으로 이동하여 `effort`, `maxTurns`와 그룹화. CC는 frontmatter 필드 순서에 의존하지 않으므로 안전.

##### Sonnet Agents (20개) - effort: medium, maxTurns: 20

| Agent | effort | maxTurns | 비고 |
|-------|--------|----------|------|
| bkend-expert | medium | 20 | |
| design-validator | medium | 20 | |
| frontend-architect | medium | 20 | |
| pipeline-guide | medium | 20 | memory: user |
| pm-discovery | medium | 20 | |
| pm-lead | medium | 20 | |
| pm-prd | medium | 20 | |
| pm-research | medium | 20 | |
| pm-strategy | medium | 20 | |
| product-manager | medium | 20 | |
| qa-strategist | medium | 20 | |
| starter-guide | medium | 20 | memory: user |
| pdca-eval-act | medium | 20 | |
| pdca-eval-check | medium | 20 | |
| pdca-eval-design | medium | 20 | |
| pdca-eval-do | medium | 20 | |
| pdca-eval-plan | medium | 20 | |
| pdca-eval-pm | medium | 20 | |
| pm-lead-skill-patch | medium | 20 | |
| skill-needs-extractor | medium | 20 | |

**starter-guide.md frontmatter diff**:

```yaml
# Before
---
name: starter-guide
description: |
  Friendly guide agent...
permissionMode: acceptEdits
memory: user
model: sonnet
disallowedTools:
  - Bash
---

# After
---
name: starter-guide
description: |
  Friendly guide agent...
model: sonnet
effort: medium
maxTurns: 20
permissionMode: acceptEdits
memory: user
disallowedTools:
  - Bash
---
```

##### Haiku Agents (2개) - effort: low, maxTurns: 15

| Agent | effort | maxTurns | 비고 |
|-------|--------|----------|------|
| qa-monitor | low | 15 | 빠른 로그 분석 |
| report-generator | low | 15 | 빠른 보고서 생성 |

**qa-monitor.md frontmatter diff**:

```yaml
# Before
---
name: qa-monitor
description: |
  Agent that monitors Docker logs...
imports:
  - ${PLUGIN_ROOT}/templates/shared/error-handling-patterns.md
permissionMode: acceptEdits
memory: project
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.js"
      timeout: 10000
model: haiku
---

# After
---
name: qa-monitor
description: |
  Agent that monitors Docker logs...
model: haiku
effort: low
maxTurns: 15
imports:
  - ${PLUGIN_ROOT}/templates/shared/error-handling-patterns.md
permissionMode: acceptEdits
memory: project
hooks:
  Stop:
    - type: command
      command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/qa-stop.js"
      timeout: 10000
---
```

#### 2.2.4 effort 설정 근거

| Model | CC v2.1.76 기본값 | bkit 설정 | 근거 |
|-------|------------------|----------|------|
| opus | medium | **high** | CTO Team 깊은 사고 필요. medium 기본으로 인한 사고 깊이 저하 방지 |
| sonnet | medium | medium | 기본값 유지, 적절한 균형 |
| haiku | medium | **low** | 빠른 응답 우선, 단순 태스크 전용 |

#### 2.2.5 maxTurns 설정 근거

| Role | maxTurns | 근거 |
|------|----------|------|
| cto-lead | 50 | 전체 PDCA 오케스트레이션, 장기 세션 |
| opus experts | 30 | 심층 분석/설계, 중간 세션 |
| sonnet workers | 20 | 실행 중심, 짧은 세션 |
| haiku assistants | 15 | 빠른 보고, 최소 세션 |

---

### 2.3 ENH-127: 1M Context 기본화 문서

#### 2.3.1 bkit-system/philosophy/context-engineering.md 변경

**추가 섹션**:

```markdown
## 1M Context Window 기본화 (v1.6.2)

### CC v2.1.75 변경사항
- Opus 4.6 모델: 1M context window가 Max/Team/Enterprise 플랜에서 기본 활성화
- 기존: extra usage 별도 요금 필요
- 현재: 플랜 포함 (추가 비용 없음)

### bkit 영향
- 7개 opus agents (cto-lead, code-analyzer, enterprise-expert, gap-detector, infra-architect, security-architect, pdca-iterator)가 1M context 혜택
- 장시간 CTO Team 세션에서 컨텍스트 유실 없이 전체 PDCA 사이클 수행 가능
- 대규모 코드베이스 분석 시 전체 파일 동시 로드 가능

### Context Engineering Level 6 기준
- Level 5: 200K context 활용 (v1.6.1)
- Level 6: 1M context 기본화 + PostCompact 자동 복구 (v1.6.2)
```

#### 2.3.2 hooks/session-start.js 변경

**v1.6.0 Enhancements 섹션 업데이트** (line 635 부근):

```javascript
// Before
additionalContext += `## v1.6.0 Enhancements (Skills 2.0 Integration)\n`;
additionalContext += `- CC recommended version: v2.1.71 (stdin freeze fix, background agent recovery)\n`;

// After
additionalContext += `## v1.6.2 Enhancements\n`;
additionalContext += `- CC recommended version: v2.1.78 (${CLAUDE_PLUGIN_DATA}, plugin agent frontmatter, StopFailure hook)\n`;
additionalContext += `- 1M context window default for Opus 4.6 (Max/Team/Enterprise plans, CC v2.1.75+)\n`;
additionalContext += `- Agent frontmatter: effort/maxTurns native support (CC v2.1.78+)\n`;
additionalContext += `- ${CLAUDE_PLUGIN_DATA} persistent backup for state files\n`;
additionalContext += `- Hook events: 10 -> 14 (PostCompact, StopFailure + 문서화 2)\n`;
additionalContext += `- Output token: Opus 64K default, 128K upper limit (CC v2.1.77+)\n`;
```

**version 번호 업데이트**:

```javascript
// Before (line 484)
let additionalContext = `# bkit Vibecoding Kit v1.6.1 - Session Startup\n\n`;

// After
let additionalContext = `# bkit Vibecoding Kit v1.6.2 - Session Startup\n\n`;
```

```javascript
// Before (line 750)
  systemMessage: `bkit Vibecoding Kit v1.6.1 activated (Claude Code)`,

// After
  systemMessage: `bkit Vibecoding Kit v1.6.2 activated (Claude Code)`,
```

---

## 3. P1: 핵심 활용 상세 설계 (4건)

### 3.1 ENH-117: PostCompact Hook 활용

#### 3.1.1 hooks/hooks.json 변경

**Before** (PreCompact 섹션 이후):

```json
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js",
            "timeout": 5000
          }
        ]
      }
    ],
```

**After** (PreCompact 직후에 PostCompact 추가):

```json
    "PreCompact": [
      {
        "matcher": "auto|manual",
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/context-compaction.js",
            "timeout": 5000
          }
        ]
      }
    ],
    "PostCompact": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/post-compaction.js",
            "timeout": 5000
          }
        ]
      }
    ],
```

#### 3.1.2 scripts/post-compaction.js (신규)

```javascript
#!/usr/bin/env node
/**
 * post-compaction.js - PostCompact Hook Handler (ENH-117)
 * Validates PDCA state integrity after context compaction
 *
 * @version 1.6.2
 * @module scripts/post-compaction
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  outputEmpty
} = require('../lib/common.js');

// Read PostCompact event from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('PostCompaction', 'Failed to read stdin', { error: e.message });
  outputEmpty();
  process.exit(0);
}

debugLog('PostCompaction', 'Hook started', {
  transcript_length: input.transcript_length || 'unknown'
});

// Step 1: Verify PDCA status file integrity
const pdcaStatus = getPdcaStatusFull(true); // force refresh from disk

if (!pdcaStatus) {
  debugLog('PostCompaction', 'PDCA status missing after compaction');

  // Attempt restore from PLUGIN_DATA backup
  try {
    const { restoreFromPluginData } = require('../lib/core/paths');
    const restoreResult = restoreFromPluginData();
    if (restoreResult.restored.length > 0) {
      debugLog('PostCompaction', 'Restored from backup', {
        restored: restoreResult.restored
      });
      // Output restoration notice
      console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PostCompact',
          additionalContext: `PDCA state restored from backup after compaction. Restored: ${restoreResult.restored.join(', ')}.`
        }
      }));
      process.exit(0);
    }
  } catch (e) {
    debugLog('PostCompaction', 'Backup restore failed', { error: e.message });
  }

  outputEmpty();
  process.exit(0);
}

// Step 2: Validate status structure
const validationErrors = [];

if (!pdcaStatus.version) {
  validationErrors.push('Missing version field');
}
if (!pdcaStatus.features || typeof pdcaStatus.features !== 'object') {
  validationErrors.push('Missing or invalid features object');
}
if (!Array.isArray(pdcaStatus.activeFeatures)) {
  validationErrors.push('Missing or invalid activeFeatures array');
}

// Step 3: Check snapshot consistency (compare with PreCompact snapshot)
const { STATE_PATHS } = require('../lib/core/paths');
const snapshotDir = STATE_PATHS.snapshots();
let snapshotDelta = null;

try {
  if (fs.existsSync(snapshotDir)) {
    const files = fs.readdirSync(snapshotDir)
      .filter(f => f.startsWith('snapshot-') && f.endsWith('.json'))
      .sort()
      .reverse();

    if (files.length > 0) {
      const latestSnapshot = JSON.parse(
        fs.readFileSync(path.join(snapshotDir, files[0]), 'utf8')
      );
      const snapshotStatus = latestSnapshot.status;

      // Compare feature count
      const snapshotFeatureCount = Object.keys(snapshotStatus.features || {}).length;
      const currentFeatureCount = Object.keys(pdcaStatus.features || {}).length;

      if (snapshotFeatureCount !== currentFeatureCount) {
        snapshotDelta = {
          before: snapshotFeatureCount,
          after: currentFeatureCount,
          diff: currentFeatureCount - snapshotFeatureCount
        };
      }
    }
  }
} catch (e) {
  debugLog('PostCompaction', 'Snapshot comparison skipped', { error: e.message });
}

// Step 4: Generate output
const summary = {
  activeFeatures: pdcaStatus.activeFeatures || [],
  primaryFeature: pdcaStatus.primaryFeature,
  featureCount: Object.keys(pdcaStatus.features || {}).length,
  validationErrors,
  snapshotDelta,
};

let additionalContext = `PDCA state verified after compaction. `;
additionalContext += `Active: ${summary.activeFeatures.join(', ') || 'none'}. `;
additionalContext += `Primary: ${summary.primaryFeature || 'none'}. `;
additionalContext += `Features: ${summary.featureCount}.`;

if (validationErrors.length > 0) {
  additionalContext += ` WARNINGS: ${validationErrors.join('; ')}.`;
}

if (snapshotDelta) {
  additionalContext += ` Feature count changed: ${snapshotDelta.before} -> ${snapshotDelta.after}.`;
}

console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: 'PostCompact',
    additionalContext
  }
}));

debugLog('PostCompaction', 'Hook completed', summary);
```

**LOC**: ~120

---

### 3.2 ENH-118: StopFailure Hook 활용

#### 3.2.1 hooks/hooks.json 변경

**Stop 섹션 직후에 StopFailure 추가**:

```json
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/unified-stop.js",
            "timeout": 10000
          }
        ]
      }
    ],
    "StopFailure": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node ${CLAUDE_PLUGIN_ROOT}/scripts/stop-failure-handler.js",
            "timeout": 5000
          }
        ]
      }
    ],
```

#### 3.2.2 scripts/stop-failure-handler.js (신규)

```javascript
#!/usr/bin/env node
/**
 * stop-failure-handler.js - StopFailure Hook Handler (ENH-118)
 * Handles API errors (rate limit, auth failure, server error) that cause turn termination
 *
 * @version 1.6.2
 * @module scripts/stop-failure-handler
 */

const fs = require('fs');
const path = require('path');
const {
  readStdinSync,
  debugLog,
  getPdcaStatusFull,
  outputAllow
} = require('../lib/common.js');

// Read StopFailure event from stdin
let input;
try {
  input = readStdinSync();
} catch (e) {
  debugLog('StopFailure', 'Failed to read stdin', { error: e.message });
  process.exit(0);
}

// Extract error information from hook context
const errorType = input.error_type || input.errorType || 'unknown';
const errorMessage = input.error_message || input.errorMessage || input.message || '';
const agentId = input.agent_id || null;
const agentType = input.agent_type || null;

debugLog('StopFailure', 'Hook started', {
  errorType,
  errorMessage: errorMessage.substring(0, 200),
  agentId,
  agentType
});

// Step 1: Classify error
function classifyError(type, message) {
  const msg = (message || '').toLowerCase();

  if (msg.includes('rate limit') || msg.includes('429') || msg.includes('too many requests')) {
    return {
      category: 'rate_limit',
      severity: 'medium',
      recovery: 'Wait 30-60 seconds and retry. Consider reducing parallel agent count.',
      automated: true
    };
  }

  if (msg.includes('auth') || msg.includes('401') || msg.includes('unauthorized') || msg.includes('api key')) {
    return {
      category: 'auth_failure',
      severity: 'high',
      recovery: 'Check API key validity. Run `claude auth status` to verify.',
      automated: false
    };
  }

  if (msg.includes('500') || msg.includes('server error') || msg.includes('internal')) {
    return {
      category: 'server_error',
      severity: 'medium',
      recovery: 'Anthropic API temporary issue. Wait 1-2 minutes and retry.',
      automated: true
    };
  }

  if (msg.includes('timeout') || msg.includes('timed out')) {
    return {
      category: 'timeout',
      severity: 'low',
      recovery: 'Request timed out. Retry with smaller context or simpler prompt.',
      automated: true
    };
  }

  if (msg.includes('context') || msg.includes('token') || msg.includes('too long')) {
    return {
      category: 'context_overflow',
      severity: 'medium',
      recovery: 'Context too large. Run /clear and reload essential context.',
      automated: false
    };
  }

  return {
    category: 'unknown',
    severity: 'low',
    recovery: 'Unexpected error. Check `claude doctor` for diagnostics.',
    automated: false
  };
}

const classification = classifyError(errorType, errorMessage);

// Step 2: Log error to runtime directory
try {
  const { STATE_PATHS } = require('../lib/core/paths');
  const runtimeDir = STATE_PATHS.runtime();

  if (!fs.existsSync(runtimeDir)) {
    fs.mkdirSync(runtimeDir, { recursive: true });
  }

  const errorLogPath = path.join(runtimeDir, 'error-log.json');
  let errorLog = [];

  if (fs.existsSync(errorLogPath)) {
    try {
      errorLog = JSON.parse(fs.readFileSync(errorLogPath, 'utf8'));
    } catch (e) {
      errorLog = [];
    }
  }

  errorLog.push({
    timestamp: new Date().toISOString(),
    errorType,
    category: classification.category,
    severity: classification.severity,
    agentId,
    agentType,
    message: errorMessage.substring(0, 500)
  });

  // Keep last 50 entries
  if (errorLog.length > 50) {
    errorLog = errorLog.slice(-50);
  }

  fs.writeFileSync(errorLogPath, JSON.stringify(errorLog, null, 2));
} catch (e) {
  debugLog('StopFailure', 'Error logging failed', { error: e.message });
}

// Step 3: Save PDCA snapshot for recovery
try {
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus) {
    const { backupToPluginData } = require('../lib/core/paths');
    backupToPluginData();
    debugLog('StopFailure', 'Emergency backup saved');
  }
} catch (e) {
  // Non-critical
}

// Step 4: Generate recovery guidance
let guidance = `API Error: ${classification.category}. `;
guidance += `${classification.recovery} `;

if (agentId) {
  guidance += `Affected agent: ${agentId}. `;
}

// CTO Team specific guidance
if (agentType === 'teammate' || agentId === 'cto-lead') {
  guidance += `CTO Team: Consider ctrl+f to stop affected agents, then /pdca team status to check progress.`;
}

outputAllow(guidance, 'StopFailure');

debugLog('StopFailure', 'Hook completed', {
  category: classification.category,
  severity: classification.severity,
  agentId
});
```

**LOC**: ~160

---

### 3.3 ENH-122: autoMemoryDirectory 활용

#### 3.3.1 설계 범위

문서화 중심. 코드 변경 없음.

#### 3.3.2 bkit-system/philosophy/context-engineering.md 추가 섹션

```markdown
## autoMemoryDirectory 설정 (v1.6.2)

### CC v2.1.74 변경사항
- `autoMemoryDirectory` 설정으로 auto-memory 저장 경로 커스터마이징 가능
- 기본값: `~/.claude/projects/{path}/memory/`

### bkit 메모리 시스템 충돌 분석
| 시스템 | 경로 | 형식 | 충돌 |
|--------|------|------|------|
| CC auto-memory | ~/.claude/projects/{path}/memory/MEMORY.md | Markdown | 없음 |
| bkit memory-store | .bkit/state/memory.json | JSON | 없음 |
| bkit agent-memory | .claude/agent-memory/{agent}/MEMORY.md | Markdown | 없음 |

### 사용자 가이드
autoMemoryDirectory 변경 시에도 bkit의 3개 메모리 시스템과 충돌 없음.
bkit.config.json에 별도 설정 불필요.
```

---

### 3.4 ENH-126: 출력 128K 상한 활용

#### 3.4.1 설계 범위

문서화 중심. 코드 변경 없음.

#### 3.4.2 bkit-system/philosophy/context-engineering.md 추가 섹션

```markdown
## 출력 토큰 128K 상한 (v1.6.2)

### CC v2.1.77 변경사항
- Opus 4.6: 기본 64K, 상한 128K (기존 32K/64K)
- Sonnet 4.6: 상한 128K
- 환경변수 `CLAUDE_CODE_MAX_OUTPUT_TOKENS`으로 상한 설정 가능

### bkit 활용
- report-generator: 대규모 PDCA 보고서 완전 출력 가능 (truncation 방지)
- code-analyzer: 전체 코드 분석 결과 단일 응답 출력
- gap-detector: 상세 Gap 목록 + 수정 제안 완전 출력
- CTO Team 분석 보고서: 10,000줄+ 분석도 단일 보고서로 가능
```

---

## 4. P2: 확장 활용 상세 설계 (5건)

### 4.1 ENH-121: modelOverrides 가이드

#### 4.1.1 bkit-system/components 또는 skills/enterprise/SKILL.md 추가

```markdown
## modelOverrides (CC v2.1.73+)

Bedrock/Vertex 환경에서 모델 ID 매핑 커스터마이징:

```json
// .claude/settings.json
{
  "modelOverrides": {
    "opus": "us.anthropic.claude-opus-4-6-20250318-v1:0",
    "sonnet": "us.anthropic.claude-sonnet-4-6-20250318-v1:0",
    "haiku": "us.anthropic.claude-haiku-4-20250318-v1:0"
  }
}
```

bkit 29개 agents는 `model: opus|sonnet|haiku` 축약명을 사용하므로,
modelOverrides로 Bedrock/Vertex 실제 모델 ID와 정확히 매핑 가능.
```

---

### 4.2 ENH-123: worktree.sparsePaths 활용

#### 4.2.1 skills/enterprise/SKILL.md 추가

```markdown
## worktree.sparsePaths (CC v2.1.76+)

대규모 monorepo에서 워크트리 생성 시 sparse-checkout 적용:

```json
// .claude/settings.json
{
  "worktree": {
    "sparsePaths": [
      "services/auth/",
      "services/user/",
      "packages/shared/"
    ]
  }
}
```

Enterprise 프로젝트에서 CTO Team 병렬 워크트리 사용 시 필요한 서비스만 체크아웃하여
디스크 사용량과 워크트리 생성 시간 최소화.
```

---

### 4.3 ENH-124: /effort 가이드

#### 4.3.1 hooks/session-start.js 추가

**v1.6.2 Enhancements 섹션에 추가**:

```javascript
additionalContext += `- /effort: Set model thinking effort (low/medium/high). Opus agents default to high via frontmatter.\n`;
additionalContext += `- "ultrathink" keyword in prompts triggers extended thinking for complex analysis\n`;
```

---

### 4.4 ENH-125: allowRead sandbox

#### 4.4.1 skills/enterprise/SKILL.md 추가

```markdown
## allowRead Sandbox (CC v2.1.77+)

denyRead 영역 내에서 특정 경로만 읽기 재허용:

```json
// .claude/settings.json
{
  "permissions": {
    "denyRead": ["/etc/", "/var/"],
    "allowRead": ["/etc/ssl/certs/"]
  }
}
```

Enterprise 보안 정책에서 세밀한 파일 접근 제어 가능.
```

---

### 4.5 ENH-130: Session Name (-n) 활용

#### 4.5.1 문서화

```markdown
## Session Name (CC v2.1.76+)

CLI에서 세션 이름 지정:

```bash
# CI/CD 환경
claude -n "pdca-check-user-auth" --resume

# CTO Team 세션
claude -n "cto-team-v162-design" --print

# Cron 모니터링
claude -n "monitoring-daily" --print "/pdca status"
```

CTO Team 세션에서 기능명 기반 자동 네이밍으로 세션 관리 용이.
```

---

## 5. P3: 문서화 상세 설계 (2건)

### 5.1 ENH-128: Hook Source 표시 문서화

#### 5.1.1 bkit-system/components/hooks/_hooks-overview.md 추가

```markdown
## Hook Source 표시 (CC v2.1.75+)

Hook 권한 프롬프트에 hook의 출처(settings/plugin/skill)가 표시됨.
bkit의 모든 hooks는 `plugin` 출처로 표시됨.

사용자가 hook 승인 시 출처를 확인하여 신뢰성 판단 가능.
```

---

### 5.2 ENH-129: tmux 알림 통과 문서화

#### 5.2.1 bkit-system 문서 추가

```markdown
## tmux 알림 통과 (CC v2.1.78+)

CC가 tmux 세션 내에서 실행될 때 알림(notification)이 tmux를 통과하여
터미널 에뮬레이터까지 전달됨.

CTO Team 장시간 세션에서 tmux 사용 시 작업 완료/에러 알림 수신 가능.
```

---

## 6. hooks/hooks.json 변경 전후 비교

### 6.1 Before (v1.6.1 - 10 events, 13 entries)

```
SessionStart (1)
PreToolUse - Write|Edit (1)
PreToolUse - Bash (1)
PostToolUse - Write (1)
PostToolUse - Bash (1)
PostToolUse - Skill (1)
Stop (1)
UserPromptSubmit (1)
PreCompact (1)
TaskCompleted (1)
SubagentStart (1)
SubagentStop (1)
TeammateIdle (1)
```

**Event types**: SessionStart, PreToolUse, PostToolUse, Stop, UserPromptSubmit, PreCompact, TaskCompleted, SubagentStart, SubagentStop, TeammateIdle = **10**

### 6.2 After (v1.6.2 - 12 events, 15 entries)

```
SessionStart (1)
PreToolUse - Write|Edit (1)
PreToolUse - Bash (1)
PostToolUse - Write (1)
PostToolUse - Bash (1)
PostToolUse - Skill (1)
Stop (1)
StopFailure (1)          ← NEW (ENH-118)
UserPromptSubmit (1)
PreCompact (1)
PostCompact (1)          ← NEW (ENH-117)
TaskCompleted (1)
SubagentStart (1)
SubagentStop (1)
TeammateIdle (1)
```

**Event types**: +PostCompact, +StopFailure = **12**

### 6.3 CC 공식 대비 사용률

| | v1.6.1 | v1.6.2 |
|---|--------|--------|
| bkit 사용 | 10 | 12 |
| CC 공식 total | 22 | 22 |
| 사용률 | 45.5% | 54.5% |
| 미사용 (문서화) | Elicitation, ElicitationResult | 동일 |
| 미사용 (불필요) | InstructionsLoaded, ConfigChange, WorktreeCreate, WorktreeRemove, PermissionRequest, Notification, SessionEnd | 동일 |

> Note: Plan에서 hooks.json L1 기준 14개로 카운트했으나, 정확히는 Skill/Agent frontmatter의 PreToolUse/PostToolUse/Stop (L2-3)도 포함한 전체 event type 기준. hooks.json만의 고유 event type 추가는 +2 (PostCompact, StopFailure).

---

## 7. plugin.json 변경

**Before**:
```json
{
  "name": "bkit",
  "version": "1.6.1",
  ...
}
```

**After**:
```json
{
  "name": "bkit",
  "version": "1.6.2",
  ...
}
```

---

## 8. lib/common.js Exports 변경

### 8.1 Before (v1.6.1): 208 exports

```
core (49) + pdca (65) + intent (19) + task (26) + team (40) = 208 (주석 기준)
  주석과 실제 차이: task=20 -> 주석 26, team=35 -> 주석 40 등 (실제 코드의 export 수는 208)
```

### 8.2 After (v1.6.2): 210 exports (+2)

| Module | Before | After | Change |
|--------|--------|-------|--------|
| core/paths | 8 | 10 | +2 (backupToPluginData, restoreFromPluginData) |
| core total | 49 | 51 | +2 |
| **Total** | **208** | **210** | **+2** |

### 8.3 신규 Export 목록

| Export | Module | Function Signature |
|--------|--------|--------------------|
| `backupToPluginData` | core/paths | `() => { backed: string[], skipped: string[] }` |
| `restoreFromPluginData` | core/paths | `() => { restored: string[], skipped: string[] }` |

---

## 9. 호환성 검증 TC 설계

### 9.1 TC 구성

| # | Category | TC Name | Method | Expected |
|---|----------|---------|--------|----------|
| TC-01 | Agent Model | opus agent model 해석 | frontmatter 확인 | opus -> claude-opus-4-6 |
| TC-02 | Agent Model | sonnet agent model 해석 | frontmatter 확인 | sonnet -> claude-sonnet-4-6 |
| TC-03 | Agent Model | haiku agent model 해석 | frontmatter 확인 | haiku -> claude-haiku-4 |
| TC-04 | Agent Frontmatter | effort 필드 적용 | opus agent effort: high | effort=high 확인 |
| TC-05 | Agent Frontmatter | maxTurns 필드 적용 | cto-lead maxTurns: 50 | 50턴 제한 확인 |
| TC-06 | Agent Frontmatter | haiku effort: low 적용 | qa-monitor effort: low | effort=low 확인 |
| TC-07 | Hook Events | SessionStart 정상 발화 | 세션 시작 | hook 실행 |
| TC-08 | Hook Events | PreToolUse(Write) 정상 발화 | Write 도구 사용 | hook 실행 |
| TC-09 | Hook Events | PreToolUse(Bash) 정상 발화 | Bash 도구 사용 | hook 실행 |
| TC-10 | Hook Events | PostToolUse(Write) 정상 발화 | Write 완료 | hook 실행 |
| TC-11 | Hook Events | PostToolUse(Bash) 정상 발화 | Bash 완료 | hook 실행 |
| TC-12 | Hook Events | PostToolUse(Skill) 정상 발화 | Skill 완료 | hook 실행 |
| TC-13 | Hook Events | Stop 정상 발화 | 턴 종료 | hook 실행 |
| TC-14 | Hook Events | UserPromptSubmit 정상 발화 | 프롬프트 제출 | hook 실행 |
| TC-15 | Hook Events | PreCompact 정상 발화 | 컴팩션 시작 | hook 실행 |
| TC-16 | Hook Events | TaskCompleted 정상 발화 | 태스크 완료 | hook 실행 |
| TC-17 | Hook Events (NEW) | PostCompact 정상 발화 | 컴팩션 완료 | post-compaction.js 실행 |
| TC-18 | Hook Events (NEW) | StopFailure 정상 발화 | API 에러 발생 | stop-failure-handler.js 실행 |
| TC-19 | Hook Events | SubagentStart 정상 발화 | 서브에이전트 시작 | hook 실행 |
| TC-20 | Hook Events | SubagentStop 정상 발화 | 서브에이전트 종료 | hook 실행 |
| TC-21 | Hook Events | TeammateIdle 정상 발화 | 팀원 대기 | hook 실행 |
| TC-22 | Skill Loading | 31 skills 로딩 시간 | 세션 시작 | deadlock 없음, <5s |
| TC-23 | Skill Loading | 대규모 skills git pull | 31 skills 동시 | deadlock 수정(v2.1.73) 확인 |
| TC-24 | Memory | agent-memory 읽기/쓰기 | PDCA 사이클 실행 | 정상 저장/로드 |
| TC-25 | Memory | PLUGIN_DATA 백업 생성 | savePdcaStatus() 호출 | backup 파일 생성 |
| TC-26 | Memory | PLUGIN_DATA 복구 | 상태 파일 삭제 후 세션 시작 | 자동 복구 |
| TC-27 | Permission | managed policy 우선순위 | disallowedTools 설정 | policy 적용 |
| TC-28 | Permission | PreToolUse allow->deny bypass | 보안 수정(v2.1.77) | bypass 차단 |
| TC-29 | Output Token | opus 128K 상한 | 대규모 보고서 생성 | truncation 없음 |
| TC-30 | Performance | SessionStart 2중 발화 없음 | resume 시 | 1회만 발화(v2.1.73 fix) |
| TC-31 | Performance | 메모리 누수 없음 | 장시간 세션 (50+ turns) | RSS 안정 |
| TC-32 | 3대 철학 | Automation First | PostCompact 자동 검증 | 수동 개입 없이 상태 보존 |
| TC-33 | 3대 철학 | No Guessing | effort/maxTurns 명시적 선언 | 29개 agent 모두 선언 |
| TC-34 | 3대 철학 | Docs=Code | PLUGIN_DATA 백업 + 문서 동기화 | 상태 영구 보존 |
| TC-35 | Exports | common.js 210 exports | require('./lib/common.js') | 210개 export 확인 |

**Total**: 35 TC (Plan의 ~40에서 중복/불필요 제거 후 정리)

### 9.2 TC 실행 방법

```bash
# 기본 호환성 확인 (자동)
node -e "const c = require('./lib/common.js'); console.log(Object.keys(c).length);"
# Expected: 210

# hooks.json 유효성 확인
node -e "const h = require('./hooks/hooks.json'); console.log(Object.keys(h.hooks).length);"
# Expected: 12 (event types)

# agent frontmatter 확인 (29개 모두 effort/maxTurns 포함)
grep -l "^effort:" agents/*.md | wc -l
# Expected: 29

# PLUGIN_DATA 백업 테스트
CLAUDE_PLUGIN_DATA=/tmp/bkit-test node -e "
  const { backupToPluginData } = require('./lib/core/paths');
  console.log(JSON.stringify(backupToPluginData()));
"
```

---

## 10. 구현 순서 및 의존성

```
Phase 1: Core Infrastructure
├── 1.1 lib/core/paths.js (ENH-119: PLUGIN_DATA paths + backup/restore)
├── 1.2 lib/core/index.js (exports 추가)
├── 1.3 lib/common.js (exports 추가)
└── 1.4 lib/pdca/status.js (backup 호출)
     └── 1.5 lib/memory-store.js (backup 호출)

Phase 2: Hook Scripts
├── 2.1 scripts/post-compaction.js (ENH-117, depends on 1.1)
├── 2.2 scripts/stop-failure-handler.js (ENH-118, depends on 1.1)
└── 2.3 hooks/hooks.json (PostCompact + StopFailure 추가)

Phase 3: Agent Frontmatter
└── 3.1 agents/*.md x 29 (ENH-120, independent)

Phase 4: Session Integration
├── 4.1 hooks/session-start.js (ENH-119 restore + ENH-127 1M + ENH-124 effort)
└── 4.2 plugin.json (version bump)

Phase 5: Documentation
├── 5.1 bkit-system/philosophy/context-engineering.md (ENH-122, 126, 127)
├── 5.2 bkit-system/components/hooks/_hooks-overview.md (ENH-128)
├── 5.3 skills/enterprise/SKILL.md (ENH-121, 123, 125)
└── 5.4 기타 문서 (ENH-129, 130)

Phase 6: Verification
└── 6.1 35 TC 실행
```

---

## 11. 리스크 및 완화 전략

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| CLAUDE_PLUGIN_DATA 환경변수 미설정 | Low | High | null 체크로 graceful degradation. 백업 기능만 비활성화, 기존 동작 유지 |
| effort: high 비용 증가 | Low | Medium | opus agent 7개에만 적용. 전체 비용 대비 미미 |
| PostCompact hook 미발화 (CC 버전 이슈) | Low | Low | PreCompact 기존 스냅샷으로 충분한 보호. PostCompact는 추가 안전망 |
| StopFailure hook 미발화 (CC 버전 이슈) | Low | Low | 기존 동작에 영향 없음. StopFailure는 보너스 기능 |
| maxTurns 제한으로 복잡한 작업 중단 | Medium | Low | cto-lead: 50, opus: 30으로 충분. 부족 시 bkit.config.json 오버라이드 검토 |
| Agent frontmatter 필드 순서 변경 | None | Low | CC는 YAML frontmatter 필드 순서에 의존하지 않음 |

---

## 12. 3대 철학 준수 검증

### 12.1 Automation First

| ENH | 자동화 요소 |
|-----|-----------|
| ENH-117 | PostCompact hook: 컴팩션 후 PDCA 상태 자동 검증 |
| ENH-118 | StopFailure hook: API 에러 시 자동 복구 가이드 |
| ENH-119 | PLUGIN_DATA: savePdcaStatus/saveMemory 시 자동 백업, SessionStart 시 자동 복구 |

### 12.2 No Guessing

| ENH | 명시적 선언 |
|-----|-----------|
| ENH-120 | 29개 agent에 effort/maxTurns 명시적 선언 |
| ENH-121 | modelOverrides 정확한 모델 매핑 가이드 |
| ENH-124 | /effort 가이드로 effort 수준 명시적 제어 |
| ENH-127 | 1M context 기본화 정보 명시적 제공 |

### 12.3 Docs=Code

| ENH | 문서-코드 동기화 |
|-----|----------------|
| ENH-119 | PLUGIN_DATA 백업으로 상태 영구 보존 |
| ENH-126 | 128K 출력으로 보고서 truncation 방지 |
| ENH-128 | hook source 표시로 디버깅 용이 |

---

## 13. ENH 전체 매핑 표

| ENH | Priority | 변경 파일 | 코드 변경 | 문서 변경 | Status |
|-----|----------|----------|----------|----------|--------|
| ENH-117 | P1 | hooks.json, post-compaction.js (NEW) | Yes | Yes | Designed |
| ENH-118 | P1 | hooks.json, stop-failure-handler.js (NEW) | Yes | Yes | Designed |
| ENH-119 | P0 | paths.js, status.js, memory-store.js, session-start.js, index.js, common.js | Yes | No | Designed |
| ENH-120 | P0 | agents/*.md (29) | Yes | No | Designed |
| ENH-121 | P2 | - | No | Yes | Designed |
| ENH-122 | P1 | - | No | Yes | Designed |
| ENH-123 | P2 | - | No | Yes | Designed |
| ENH-124 | P2 | session-start.js | Yes (2 lines) | Yes | Designed |
| ENH-125 | P2 | - | No | Yes | Designed |
| ENH-126 | P1 | - | No | Yes | Designed |
| ENH-127 | P0 | session-start.js | Yes (6 lines) | Yes | Designed |
| ENH-128 | P3 | - | No | Yes | Designed |
| ENH-129 | P3 | - | No | Yes | Designed |
| ENH-130 | P2 | - | No | Yes | Designed |

**Summary**: 14/14 ENH Designed (100%)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-18 | Initial design document | CTO Team (8 Agents) |
