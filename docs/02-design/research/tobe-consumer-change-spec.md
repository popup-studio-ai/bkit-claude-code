# ToBe: Consumer별 변경 명세 (AsIs → ToBe)

> **작성일**: 2026-03-01
> **대상 버전**: bkit v1.5.7 → v1.5.8
> **참조**: asis-path-audit.md, asis-pdca-status-consumers.md, asis-other-state-consumers.md, asis-session-start-analysis.md
> **계획 문서**: bkit-v1.5.8-studio-support.plan.md

---

## 요약

- **변경 파일 수**: 10개 (9 수정 + 1 신규)
- **총 변경 라인 수 (예상)**: 약 120줄 (신규 paths.js ~80줄 + 기존 파일 수정 ~40줄)
- **하드코딩 제거**: 9개 → 0개
- **신규 상태 파일**: 0개 (이동만)
- **사용자 영향**: 없음 (auto-migration으로 무중단 전환)

---

## 1. lib/core/paths.js (신규)

### 1-1. 파일 생성

**AsIs:**
파일 미존재

**ToBe:**
```javascript
/**
 * Path Registry Module
 * @module lib/core/paths
 * @version 1.5.8
 *
 * 모든 bkit 상태 파일 경로를 중앙 관리.
 * 하드코딩 경로 제거, 마이그레이션 유틸리티 제공.
 */

const fs = require('fs');
const path = require('path');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('./platform'); }
  return _platform;
}

// ============================================================
// STATE_PATHS: .bkit/ 내 상태 파일 경로 (Option B: Category-Based)
// ============================================================
const STATE_PATHS = {
  root:       () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
  state:      () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};

// ============================================================
// LEGACY_PATHS: 마이그레이션용 구 경로 (v1.6.0에서 제거 예정)
// ============================================================
const LEGACY_PATHS = {
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, 'docs', '.bkit-memory.json'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-snapshots'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'agent-state.json'),
};

// ============================================================
// CONFIG_PATHS: 이동 불가 설정 파일
// ============================================================
const CONFIG_PATHS = {
  bkitConfig: () => path.join(getPlatform().PROJECT_DIR, 'bkit.config.json'),
  pluginJson: () => path.join(getPlatform().PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson:  () => path.join(getPlatform().PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

/**
 * .bkit/ 하위 디렉토리 구조 보장
 * state/, runtime/, snapshots/ 디렉토리 생성
 */
function ensureBkitDirs() {
  const dirs = [
    STATE_PATHS.root(),
    STATE_PATHS.state(),
    STATE_PATHS.runtime(),
    STATE_PATHS.snapshots(),
  ];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = {
  STATE_PATHS,
  LEGACY_PATHS,
  CONFIG_PATHS,
  ensureBkitDirs,
};
```

**변경 이유**: 11+ 곳의 하드코딩 경로를 단일 모듈로 중앙화. 마이그레이션 전/후 경로를 모두 제공.
**사용자 영향**: 없음 (내부 모듈, 외부 API 변경 없음)

---

## 2. lib/pdca/status.js

### 2-1. getPdcaStatusPath() (라인 31-34)

**AsIs:**
```javascript
function getPdcaStatusPath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, 'docs/.pdca-status.json');
}
```

**ToBe:**
```javascript
function getPdcaStatusPath() {
  const { STATE_PATHS } = require('../core/paths');
  return STATE_PATHS.pdcaStatus();
}
```

**변경 이유**: 하드코딩 경로 → Path Registry 중앙화. `docs/.pdca-status.json` → `.bkit/state/pdca-status.json`
**사용자 영향**: 없음. 이 함수의 16+ consumer가 자동으로 신규 경로를 사용하게 됨.
**자동 적용 consumer**: `initPdcaStatusIfNotExists()`, `getPdcaStatusFull()`, `loadPdcaStatus()`, `savePdcaStatus()`, `getFeatureStatus()`, `updatePdcaStatus()`, `addPdcaHistory()`, `completePdcaFeature()`, `setActiveFeature()`, `addActiveFeature()`, `removeActiveFeature()`, `deleteFeatureFromStatus()`, `enforceFeatureLimit()`, `getActiveFeatures()`, `switchFeatureContext()`, `extractFeatureFromContext()`

### 2-2. readBkitMemory() (라인 703-715)

**AsIs:**
```javascript
function readBkitMemory() {
  const { PROJECT_DIR, safeJsonParse } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  try {
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf8');
      return safeJsonParse(content);
    }
  } catch (e) {
    // Silently fail
  }
  return null;
}
```

**ToBe:**
```javascript
function readBkitMemory() {
  const { safeJsonParse } = getCore();
  const { STATE_PATHS } = require('../core/paths');
  const memoryPath = STATE_PATHS.memory();
  try {
    if (fs.existsSync(memoryPath)) {
      const content = fs.readFileSync(memoryPath, 'utf8');
      return safeJsonParse(content);
    }
  } catch (e) {
    // Silently fail
  }
  return null;
}
```

**변경 이유**: 독립 하드코딩 제거. `memory-store.js`의 `getMemoryFilePath()`와 이중 경로 구성 문제 해소.
**사용자 영향**: 없음 (기능 동일, 경로만 변경)

### 2-3. writeBkitMemory() (라인 722-731)

**AsIs:**
```javascript
function writeBkitMemory(memory) {
  const { PROJECT_DIR } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2) + '\n', 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}
```

**ToBe:**
```javascript
function writeBkitMemory(memory) {
  const { STATE_PATHS } = require('../core/paths');
  const memoryPath = STATE_PATHS.memory();
  try {
    fs.writeFileSync(memoryPath, JSON.stringify(memory, null, 2) + '\n', 'utf8');
    return true;
  } catch (e) {
    return false;
  }
}
```

**변경 이유**: 독립 하드코딩 제거. `readBkitMemory()`와 동일한 Path Registry 경유로 통일.
**사용자 영향**: 없음 (기능 동일, 경로만 변경)

### 2-4. JSDoc 업데이트 (라인 700, 718)

**AsIs:**
```javascript
/**
 * Read bkit memory state from docs/.bkit-memory.json
```
```javascript
/**
 * Write bkit memory state to docs/.bkit-memory.json
```

**ToBe:**
```javascript
/**
 * Read bkit memory state from .bkit/state/memory.json
```
```javascript
/**
 * Write bkit memory state to .bkit/state/memory.json
```

**변경 이유**: JSDoc 경로가 실제 경로와 일치해야 함
**사용자 영향**: 없음 (코멘트만 변경)

---

## 3. lib/memory-store.js

### 3-1. getMemoryFilePath() (라인 26-29)

**AsIs:**
```javascript
function getMemoryFilePath() {
  const common = getCommon();
  return path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json');
}
```

**ToBe:**
```javascript
function getMemoryFilePath() {
  const { STATE_PATHS } = require('./core/paths');
  return STATE_PATHS.memory();
}
```

**변경 이유**: 하드코딩 경로 → Path Registry 중앙화. `docs/.bkit-memory.json` → `.bkit/state/memory.json`
**사용자 영향**: 없음. 이 함수의 consumer(`loadMemory()`, `saveMemory()`, `getMemoryPath()`)가 자동으로 신규 경로를 사용하게 됨.

---

## 4. hooks/session-start.js

### 4-1. auto-migration 코드 삽입 (라인 152-154 사이)

**AsIs:**
```javascript
// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// Initialize PDCA status file if not exists
initPdcaStatusIfNotExists();
```

**ToBe:**
```javascript
// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// v1.5.8: Auto-migration from docs/ flat paths to .bkit/ structured paths
try {
  const { STATE_PATHS, LEGACY_PATHS, ensureBkitDirs } = require('../lib/core/paths');
  ensureBkitDirs();

  const migrations = [
    { from: LEGACY_PATHS.pdcaStatus(), to: STATE_PATHS.pdcaStatus(), name: 'pdca-status' },
    { from: LEGACY_PATHS.memory(), to: STATE_PATHS.memory(), name: 'memory' },
    { from: LEGACY_PATHS.snapshots(), to: STATE_PATHS.snapshots(), name: 'snapshots' },
    { from: LEGACY_PATHS.agentState(), to: STATE_PATHS.agentState(), name: 'agent-state' },
  ];

  for (const m of migrations) {
    if (fs.existsSync(m.from) && !fs.existsSync(m.to)) {
      try {
        fs.renameSync(m.from, m.to);
        debugLog('SessionStart', `Migrated ${m.name}`, { from: m.from, to: m.to });
      } catch (renameErr) {
        // Cross-device fallback: copy + delete
        try {
          if (fs.statSync(m.from).isDirectory()) {
            fs.cpSync(m.from, m.to, { recursive: true });
          } else {
            fs.copyFileSync(m.from, m.to);
          }
          fs.rmSync(m.from, { recursive: true, force: true });
          debugLog('SessionStart', `Migrated ${m.name} (copy fallback)`, { from: m.from, to: m.to });
        } catch (copyErr) {
          debugLog('SessionStart', `Migration failed for ${m.name}`, { error: copyErr.message });
        }
      }
    }
  }
} catch (e) {
  debugLog('SessionStart', 'Path migration skipped', { error: e.message });
}

// Initialize PDCA status file if not exists
initPdcaStatusIfNotExists();
```

**변경 이유**: 기존 설치 환경(`docs/` 경로)에서 신규 경로(`.bkit/`)로 자동 마이그레이션. `initPdcaStatusIfNotExists()` 호출 전에 실행되어야 함.
**사용자 영향**: 최초 1회 마이그레이션 시 `debugLog`에 기록. 사용자에게 표시되는 동작 변화 없음.

### 4-2. detectPdcaPhase() (라인 333-349)

**AsIs:**
```javascript
function detectPdcaPhase() {
  const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json');

  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, 'utf8');
      const match = content.match(/"currentPhase"\s*:\s*(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  return '1';
}
```

**ToBe:**
```javascript
function detectPdcaPhase() {
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus && pdcaStatus.pipeline && pdcaStatus.pipeline.currentPhase) {
    return String(pdcaStatus.pipeline.currentPhase);
  }
  return '1';
}
```

**변경 이유**:
1. `process.cwd()` 직접 하드코딩 제거 (HIGH 위험 해소)
2. 정규식 파싱 → `getPdcaStatusFull()` 사용으로 일관성 확보 (이미 enhancedOnboarding에서 getPdcaStatusFull 호출하므로 캐시 활용)
3. `getPdcaStatusFull()`이 내부적으로 `getPdcaStatusPath()`를 사용하므로 Path Registry를 경유
**사용자 영향**: 없음 (반환값 동일: `'1'` ~ `'9'` 문자열)

### 4-3. importResolver 컨텍스트 경로 (라인 213)

**AsIs:**
```javascript
      const { content, errors } = importResolver.resolveImports(
        { imports: startupImports },
        path.join(process.cwd(), 'bkit.config.json')
      );
```

**ToBe:**
```javascript
      const { CONFIG_PATHS } = require('../lib/core/paths');
      const { content, errors } = importResolver.resolveImports(
        { imports: startupImports },
        CONFIG_PATHS.bkitConfig()
      );
```

**변경 이유**: `process.cwd()` + 하드코딩 문자열 → Path Registry 경유. `process.cwd()`와 `PROJECT_DIR` 불일치 시 버그 방지.
**사용자 영향**: 없음 (동일 경로 반환)

### 4-4. 컨텍스트 문자열 (라인 609)

**AsIs:**
```javascript
  additionalContext += `- bkit memory (\`docs/.bkit-memory.json\`) and CC auto-memory are separate systems with no collision\n`;
```

**ToBe:**
```javascript
  additionalContext += `- bkit memory (\`.bkit/state/memory.json\`) and CC auto-memory are separate systems with no collision\n`;
```

**변경 이유**: 사용자 안내 문구의 경로가 실제 파일 위치와 일치해야 함
**사용자 영향**: 사용자에게 표시되는 경로 문자열 변경 (기능 영향 없음). 사용자가 이 경로로 직접 파일을 찾는 경우에 올바른 위치를 안내받게 됨.

---

## 5. lib/task/tracker.js

### 5-1. findPdcaStatus() (라인 194-201)

**AsIs:**
```javascript
function findPdcaStatus() {
  const { PROJECT_DIR } = getCore();
  const fs = require('fs');
  const path = require('path');

  const statusPath = path.join(PROJECT_DIR, 'docs/.pdca-status.json');
  return fs.existsSync(statusPath) ? statusPath : null;
}
```

**ToBe:**
```javascript
function findPdcaStatus() {
  const fs = require('fs');
  const { getPdcaStatusPath } = getPdca();

  const statusPath = getPdcaStatusPath();
  return fs.existsSync(statusPath) ? statusPath : null;
}
```

**변경 이유**: 독립 하드코딩 경로 → 중앙 함수 `getPdcaStatusPath()` 사용. 이미 `getPdca()` lazy require가 있으므로 추가 import 불필요.
**사용자 영향**: 없음 (기능 동일, 반환값 타입 동일: `string|null`)

---

## 6. scripts/context-compaction.js

### 6-1. snapshotDir (라인 46)

**AsIs:**
```javascript
  const snapshotDir = path.join(PROJECT_DIR, 'docs', '.pdca-snapshots');
```

**ToBe:**
```javascript
  const { STATE_PATHS } = require('../lib/core/paths');
  const snapshotDir = STATE_PATHS.snapshots();
```

**변경 이유**: 하드코딩 경로 → Path Registry 중앙화. `docs/.pdca-snapshots/` → `.bkit/snapshots/`
**사용자 영향**: 없음 (스냅샷은 git에 추적되지 않는 런타임 백업이며, 사용자가 직접 접근하지 않음)

---

## 7. lib/team/state-writer.js

### 7-1. getAgentStatePath() (라인 70-73)

**AsIs:**
```javascript
function getAgentStatePath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'agent-state.json');
}
```

**ToBe:**
```javascript
function getAgentStatePath() {
  const { STATE_PATHS } = require('../core/paths');
  return STATE_PATHS.agentState();
}
```

**변경 이유**: 하드코딩 경로 → Path Registry 중앙화. `.bkit/agent-state.json` → `.bkit/runtime/agent-state.json` (runtime 카테고리로 분류)
**사용자 영향**: 없음. 이 함수의 consumer(`readAgentState()`, `writeAgentState()`, `initAgentState()`, `addTeammate()`, `updateTeammateStatus()`, `removeTeammate()`, `updateProgress()`, `addRecentMessage()`, `cleanupAgentState()`)가 자동으로 신규 경로를 사용하게 됨. agent-state.json은 `.bkit/` 하위 gitignore 대상이므로 경로 변경이 git history에 영향 없음.

---

## 8. bkit.config.json

### 8-1. version (라인 3)

**AsIs:**
```json
  "version": "1.5.7",
```

**ToBe:**
```json
  "version": "1.5.8",
```

**변경 이유**: 릴리스 버전 범프
**사용자 영향**: 없음 (내부 식별용)

### 8-2. statusFile (라인 34)

**AsIs:**
```json
    "statusFile": "docs/.pdca-status.json",
```

**ToBe:**
```json
    "statusFile": ".bkit/state/pdca-status.json",
```

**변경 이유**: 설정값이 실제 파일 위치와 일치해야 함. 현재 코드에서 미사용(dead config)이지만, 문서화/일관성을 위해 업데이트.
**사용자 영향**: 없음 (코드에서 이 설정값을 읽지 않으므로 기능 변화 없음)

---

## 9. lib/common.js

### 9-1. paths 모듈 re-export 추가 (라인 20-24 부근)

**AsIs:**
```javascript
// Import all modules
const core = require('./core');
const pdca = require('./pdca');
const intent = require('./intent');
const task = require('./task');
const team = require('./team');
```

**ToBe:**
```javascript
// Import all modules
const core = require('./core');
const pdca = require('./pdca');
const intent = require('./intent');
const task = require('./task');
const team = require('./team');
const paths = require('./core/paths');
```

### 9-2. module.exports에 paths 추가 (라인 281 직전)

**AsIs:**
```javascript
  getAgentStatePath: team.getAgentStatePath,
  readAgentState: team.readAgentState,
};
```

**ToBe:**
```javascript
  getAgentStatePath: team.getAgentStatePath,
  readAgentState: team.readAgentState,

  // Paths (4 exports) - v1.5.8: Path Registry
  STATE_PATHS: paths.STATE_PATHS,
  LEGACY_PATHS: paths.LEGACY_PATHS,
  CONFIG_PATHS: paths.CONFIG_PATHS,
  ensureBkitDirs: paths.ensureBkitDirs,
};
```

**변경 이유**: common.js bridge 패턴에 paths 모듈 추가. 기존 consumer가 `common.STATE_PATHS` 등으로 접근 가능.
**사용자 영향**: 없음 (기존 export 변경 없이 추가만)

---

## 10. .claude-plugin/plugin.json

### 10-1. version (라인 3)

**AsIs:**
```json
  "version": "1.5.7",
```

**ToBe:**
```json
  "version": "1.5.8",
```

**변경 이유**: 릴리스 버전 범프. Claude Code 플러그인 매니페스트.
**사용자 영향**: 플러그인 정보에 새 버전 표시

---

## 기능 동일성 검증표

| # | 기능 | AsIs 동작 | ToBe 동작 | 동일 여부 |
|---|------|----------|----------|:---------:|
| 1 | PDCA 상태 읽기 | `getPdcaStatusFull()` → `docs/.pdca-status.json` 읽기 | `getPdcaStatusFull()` → `.bkit/state/pdca-status.json` 읽기 | **동일** (경로만 변경) |
| 2 | PDCA 상태 쓰기 | `savePdcaStatus()` → `docs/.pdca-status.json` 쓰기 | `savePdcaStatus()` → `.bkit/state/pdca-status.json` 쓰기 | **동일** (경로만 변경) |
| 3 | PDCA 상태 초기화 | `initPdcaStatusIfNotExists()` → `docs/.pdca-status.json` 생성 | `initPdcaStatusIfNotExists()` → `.bkit/state/pdca-status.json` 생성 | **동일** (경로만 변경) |
| 4 | PDCA phase 감지 | `detectPdcaPhase()` → 정규식으로 `process.cwd()/docs/.pdca-status.json` 파싱 → `'1'`~`'9'` 반환 | `detectPdcaPhase()` → `getPdcaStatusFull().pipeline.currentPhase` → `'1'`~`'9'` 반환 | **동일** (반환값 동일, 파싱 방식 개선) |
| 5 | PDCA 상태 파일 위치 확인 | `findPdcaStatus()` → `docs/.pdca-status.json` 존재 시 경로 반환, 없으면 null | `findPdcaStatus()` → `.bkit/state/pdca-status.json` 존재 시 경로 반환, 없으면 null | **동일** (반환값 타입 동일) |
| 6 | bkit 메모리 읽기 | `readBkitMemory()` → `docs/.bkit-memory.json` 읽기 | `readBkitMemory()` → `.bkit/state/memory.json` 읽기 | **동일** (경로만 변경) |
| 7 | bkit 메모리 쓰기 | `writeBkitMemory()` → `docs/.bkit-memory.json` 쓰기 | `writeBkitMemory()` → `.bkit/state/memory.json` 쓰기 | **동일** (경로만 변경) |
| 8 | 메모리 스토어 (FR-08) | `loadMemory()`/`saveMemory()` → `docs/.bkit-memory.json` | `loadMemory()`/`saveMemory()` → `.bkit/state/memory.json` | **동일** (경로만 변경) |
| 9 | 컨텍스트 스냅샷 | `context-compaction.js` → `docs/.pdca-snapshots/` 디렉토리에 스냅샷 저장, 10개 유지 | `context-compaction.js` → `.bkit/snapshots/` 디렉토리에 스냅샷 저장, 10개 유지 | **동일** (경로만 변경) |
| 10 | Agent State 읽기/쓰기 | `readAgentState()`/`writeAgentState()` → `.bkit/agent-state.json` | `readAgentState()`/`writeAgentState()` → `.bkit/runtime/agent-state.json` | **동일** (하위 경로만 변경) |
| 11 | 세션 시작 메모리 안내 | `docs/.bkit-memory.json` 경로 표시 | `.bkit/state/memory.json` 경로 표시 | **동일** (표시 경로만 변경) |
| 12 | globalCache 캐싱 | `'pdca-status'` 키로 3초 TTL 캐시 | `'pdca-status'` 키로 3초 TTL 캐시 | **동일** (캐시 키는 경로와 무관) |
| 13 | Auto-migration | 없음 | 구 경로 → 신 경로 자동 이동 (rename, 실패 시 copy+delete) | **신규** (기존 동작 보존 + 자동 전환) |
| 14 | .gitignore | `.bkit/` blanket ignore | `.bkit/` blanket ignore (변경 없음) | **동일** |
| 15 | bkit.config.json `statusFile` | `"docs/.pdca-status.json"` (미사용 설정) | `".bkit/state/pdca-status.json"` (미사용 설정) | **동일** (코드에서 읽지 않음) |

---

## 에러 메시지 / 로그 메시지 경로 검증

| # | 파일 | 메시지 유형 | AsIs 경로 포함 | ToBe 동작 | 검증 결과 |
|---|------|-----------|:------------:|----------|:---------:|
| 1 | `session-start.js:609` | 사용자 안내 문자열 | `docs/.bkit-memory.json` | `.bkit/state/memory.json`으로 업데이트 | **OK** |
| 2 | `scripts/archive-feature.js:122,124,131,133` | console.warn/log | `.pdca-status.json` | 기능 무관 표시용 → **변경 불필요** (일반 파일명, 전체 경로 아님) | **OK** (변경 안 함) |
| 3 | `lib/pdca/status.js:700,718` | JSDoc 주석 | `docs/.bkit-memory.json` | `.bkit/state/memory.json`으로 업데이트 | **OK** |
| 4 | `lib/team/state-writer.js:7` | 모듈 주석 | `.bkit/agent-state.json` | 주석이지만, 정확성을 위해 `.bkit/runtime/agent-state.json`으로 업데이트 권장 | **권장** |

---

## 변경 순서 (의존성 기반)

```
Phase 1: lib/core/paths.js 생성         (의존성 없음)
    ↓
Phase 2-a: lib/pdca/status.js 수정      (paths.js 의존)
Phase 2-b: lib/memory-store.js 수정     (paths.js 의존)
Phase 2-c: lib/task/tracker.js 수정     (pdca module 경유)
Phase 2-d: scripts/context-compaction.js 수정  (paths.js 의존)
Phase 2-e: lib/team/state-writer.js 수정 (paths.js 의존)
    ↓
Phase 3-a: hooks/session-start.js 수정  (paths.js + 위 모듈 변경 후)
Phase 3-b: lib/common.js bridge 추가    (paths.js 의존)
    ↓
Phase 4: bkit.config.json 업데이트      (의존성 없음)
Phase 4: .claude-plugin/plugin.json 버전 (의존성 없음)
```

---

## 변경 통계 요약

| 파일 | 변경 유형 | 변경 함수/위치 수 | 예상 변경 줄 수 |
|------|----------|:----------------:|:--------------:|
| `lib/core/paths.js` | 신규 | - | ~80 |
| `lib/pdca/status.js` | 수정 | 3개 (getPdcaStatusPath, readBkitMemory, writeBkitMemory) + JSDoc 2곳 | ~10 |
| `lib/memory-store.js` | 수정 | 1개 (getMemoryFilePath) | ~3 |
| `hooks/session-start.js` | 수정 | 4개 (migration, detectPdcaPhase, importResolver, 문자열) | ~40 |
| `lib/task/tracker.js` | 수정 | 1개 (findPdcaStatus) | ~4 |
| `scripts/context-compaction.js` | 수정 | 1개 (snapshotDir) | ~2 |
| `lib/team/state-writer.js` | 수정 | 1개 (getAgentStatePath) | ~3 |
| `bkit.config.json` | 수정 | 2개 (version, statusFile) | ~2 |
| `lib/common.js` | 수정 | 2개 (import, exports) | ~6 |
| `.claude-plugin/plugin.json` | 수정 | 1개 (version) | ~1 |
| **합계** | 9 수정 + 1 신규 | **16개 변경 지점** | **~151줄** |
