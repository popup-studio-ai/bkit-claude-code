# 상세 설계서: bkit v1.5.8 Studio Support

> Feature: bkit-v1.5.8-studio-support
> Phase: Design (PDCA)
> Created: 2026-03-01
> Input: Plan-Plus 문서 + CTO Team 분석 7건

---

## 1. 개요

### 1.1 목표

분산된 bkit 상태 파일을 `.bkit/` 디렉토리로 통합하고, 중앙 Path Registry를 도입하여 코드 유지보수성을 향상시킨다.

- 11+ 곳에 하드코딩된 경로를 **단일 모듈(lib/core/paths.js)**로 중앙화
- 상태 파일 4개를 `docs/` 및 `.bkit/` flat에서 **`.bkit/{state,runtime,snapshots}/`** 카테고리 구조로 이동
- SessionStart hook에서 **자동 마이그레이션** 실행으로 기존 환경 무중단 전환

### 1.2 범위 (10파일, ~151줄)

| 유형 | 파일 수 | 예상 변경 줄 |
|------|:------:|:-----------:|
| 신규 | 1 (paths.js) | ~80 |
| 수정 | 9 | ~71 |
| **합계** | **10** | **~151** |

### 1.3 제약사항

| 제약 | 설명 |
|------|------|
| 동기 I/O | session-start.js 전체가 동기 실행, 마이그레이션도 동기 필수 |
| `.bkit/` gitignore | 기존 blanket ignore 유지, 신규 `.gitignore` 생성 불가 |
| 이동 불가 파일 3개 | `plugin.json`, `hooks.json`, `bkit.config.json` (CC 발견 규격) |
| CC 이슈 독립성 | #29548(ExitPlanMode), #29547(AskUserQuestion)과 무관한 변경 |

### 1.4 선행조건

- bkit v1.5.7 코드베이스 안정 (754 TC, 100% pass)
- `.bkit/` 디렉토리 blanket gitignore 확인 완료

---

## 2. AsIs 현황 요약

### 2.1 현재 경로 맵

| 상태 파일 | 현재 위치 | 하드코딩 수 | 중앙 함수 | 함수 경유 consumer |
|----------|----------|:----------:|----------|:------------------:|
| pdca-status.json | `docs/.pdca-status.json` | 4 | `getPdcaStatusPath()` (status.js:33) | 25+ |
| bkit-memory.json | `docs/.bkit-memory.json` | 3 | `getMemoryFilePath()` (memory-store.js:28) | 5+ |
| pdca-snapshots/ | `docs/.pdca-snapshots/` | 1 | 없음 (변수 1개) | 0 |
| agent-state.json | `.bkit/agent-state.json` | 1 | `getAgentStatePath()` (state-writer.js:72) | 3+ |

### 2.2 위험 지점 요약

| 위험도 | 위치 | 문제 |
|:------:|------|------|
| **HIGH** | `session-start.js:334` | `process.cwd()` 직접 하드코딩 (PROJECT_DIR 불일치 가능) |
| **HIGH** | `tracker.js:199` | 독립 `path.join` 하드코딩 (중앙 함수 미사용) |
| **MEDIUM** | `status.js:705,724` | `readBkitMemory`/`writeBkitMemory` 독립 경로 (memory-store.js와 이중 구성) |
| **LOW** | `bkit.config.json:34` | `statusFile` dead config (코드에서 미참조) |

### 2.3 핵심 수치

| 항목 | 값 |
|------|:---:|
| pdca-status.json 총 consumer | 28 (R22 + W14 + E2) |
| bkit-memory.json 총 consumer | 9 (경로2 + 호출7) |
| agent-state.json 총 consumer | 13 (직접6 + 간접7) |
| 하드코딩 참조 | 9개 |
| 함수 경유 참조 | 33+ |
| 변경 필요 지점 | 10개 |

---

## 3. ToBe 설계

### 3.1 디렉토리 구조 (Option B: Category-Based)

```
.bkit/                          # 전체 gitignored
├── state/                      # 영속 상태
│   ├── pdca-status.json        # [MIGRATE] docs/.pdca-status.json
│   └── memory.json             # [MIGRATE] docs/.bkit-memory.json
├── runtime/                    # 런타임 상태
│   └── agent-state.json        # [MIGRATE] .bkit/agent-state.json
└── snapshots/                  # 백업
    └── snapshot-{timestamp}.json  # [MIGRATE] docs/.pdca-snapshots/
```

### 3.2 Path Registry API (lib/core/paths.js)

**STATE_PATHS** -- 신규 경로

| 키 | 반환 경로 | 용도 |
|-----|----------|------|
| `root()` | `{PROJECT_DIR}/.bkit` | 루트 디렉토리 |
| `state()` | `{PROJECT_DIR}/.bkit/state` | 영속 상태 디렉토리 |
| `runtime()` | `{PROJECT_DIR}/.bkit/runtime` | 런타임 상태 디렉토리 |
| `snapshots()` | `{PROJECT_DIR}/.bkit/snapshots` | 백업 디렉토리 |
| `pdcaStatus()` | `{PROJECT_DIR}/.bkit/state/pdca-status.json` | PDCA 상태 |
| `memory()` | `{PROJECT_DIR}/.bkit/state/memory.json` | bkit 메모리 |
| `agentState()` | `{PROJECT_DIR}/.bkit/runtime/agent-state.json` | Agent Teams 상태 |

**LEGACY_PATHS** -- 마이그레이션 소스 (v1.6.0 제거 예정)

| 키 | 반환 경로 |
|-----|----------|
| `pdcaStatus()` | `{PROJECT_DIR}/docs/.pdca-status.json` |
| `memory()` | `{PROJECT_DIR}/docs/.bkit-memory.json` |
| `snapshots()` | `{PROJECT_DIR}/docs/.pdca-snapshots` |
| `agentState()` | `{PROJECT_DIR}/.bkit/agent-state.json` |

**CONFIG_PATHS** -- 이동 불가 설정 파일

| 키 | 반환 경로 | 고정 사유 |
|-----|----------|----------|
| `bkitConfig()` | `{PROJECT_DIR}/bkit.config.json` | loadConfig() 참조 |
| `pluginJson()` | `{PLUGIN_ROOT}/.claude-plugin/plugin.json` | CC 플러그인 규격 |
| `hooksJson()` | `{PLUGIN_ROOT}/hooks/hooks.json` | CC 훅 규격 |

**함수 시그니처**

```javascript
function ensureBkitDirs()
// .bkit/, .bkit/state/, .bkit/runtime/ 생성 (snapshots는 제외 -- 최초 사용 시 생성)
// 반환: void (idempotent, recursive: true)

function migrateStateFiles()
// 구 경로 → 신 경로 자동 마이그레이션
// 반환: { migrated: string[], skipped: string[], errors: string[] }
```

### 3.3 Export 변경

**lib/core/index.js**: paths 모듈 추가 (41 -> 46 exports, +5)

```javascript
const paths = require('./paths');
// + STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs, migrateStateFiles
```

**lib/common.js bridge**: paths re-export 추가 (180 -> 185 exports, +5)

```javascript
STATE_PATHS: core.STATE_PATHS,
LEGACY_PATHS: core.LEGACY_PATHS,
CONFIG_PATHS: core.CONFIG_PATHS,
ensureBkitDirs: core.ensureBkitDirs,
migrateStateFiles: core.migrateStateFiles,
```

---

## 4. 변경 명세 (파일별 AsIs -> ToBe)

### 4.1 Phase 1: Path Registry 생성

#### lib/core/paths.js (신규)

```javascript
/**
 * Path Registry - bkit 상태 파일 경로 중앙 관리
 * @module lib/core/paths
 * @version 1.5.8
 */
const path = require('path');
const fs = require('fs');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('./platform'); }
  return _platform;
}

const STATE_PATHS = {
  root:       () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
  state:      () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};

/** @deprecated v1.6.0에서 제거 예정 */
const LEGACY_PATHS = {
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, 'docs', '.bkit-memory.json'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-snapshots'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'agent-state.json'),
};

const CONFIG_PATHS = {
  bkitConfig: () => path.join(getPlatform().PROJECT_DIR, 'bkit.config.json'),
  pluginJson: () => path.join(getPlatform().PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson:  () => path.join(getPlatform().PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

function ensureBkitDirs() {
  const dirs = [STATE_PATHS.root(), STATE_PATHS.state(), STATE_PATHS.runtime()];
  // snapshots는 제외 -- context-compaction.js에서 최초 사용 시 생성
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

module.exports = { STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs };
```

**설계 결정**:
- `getPlatform()` lazy require로 순환 참조 방지
- `ensureBkitDirs()`에서 `snapshots/` 제외 -- `context-compaction.js:48-49`에 이미 `mkdirSync`가 있으므로 충돌 방지
- 모든 경로를 함수(`() => ...`)로 제공 -- 모듈 로드 시점에 `PROJECT_DIR`이 미결정될 수 있음

### 4.2 Phase 2: Consumer 리팩토링

#### lib/pdca/status.js (3곳)

**변경 1: getPdcaStatusPath() (라인 31-34)**

AsIs:
```javascript
function getPdcaStatusPath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, 'docs/.pdca-status.json');
}
```

ToBe:
```javascript
function getPdcaStatusPath() {
  const { STATE_PATHS } = require('../core/paths');
  return STATE_PATHS.pdcaStatus();
}
```

이유: 중앙 함수 내부를 Path Registry로 교체. **25+ consumer 자동 적용**.

**변경 2: readBkitMemory() (라인 703-715)**

AsIs:
```javascript
function readBkitMemory() {
  const { PROJECT_DIR, safeJsonParse } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  // ...
}
```

ToBe:
```javascript
function readBkitMemory() {
  const { safeJsonParse } = getCore();
  const { STATE_PATHS } = require('../core/paths');
  const memoryPath = STATE_PATHS.memory();
  // ...
}
```

이유: 독립 하드코딩 제거. `memory-store.js`와 이중 경로 구성 해소.

**변경 3: writeBkitMemory() (라인 722-731)**

AsIs:
```javascript
function writeBkitMemory(memory) {
  const { PROJECT_DIR } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  // ...
}
```

ToBe:
```javascript
function writeBkitMemory(memory) {
  const { STATE_PATHS } = require('../core/paths');
  const memoryPath = STATE_PATHS.memory();
  // ...
}
```

이유: `readBkitMemory()`와 동일 Path Registry 경유로 통일.

#### lib/memory-store.js (1곳)

**변경: getMemoryFilePath() (라인 26-29)**

AsIs:
```javascript
function getMemoryFilePath() {
  const common = getCommon();
  return path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json');
}
```

ToBe:
```javascript
function getMemoryFilePath() {
  const { STATE_PATHS } = require('./core/paths');
  return STATE_PATHS.memory();
}
```

이유: 하드코딩 -> Path Registry. `loadMemory()`, `saveMemory()`, `getMemoryPath()` 자동 적용.

#### hooks/session-start.js (4곳 + migration 삽입)

**변경 1: detectPdcaPhase() (라인 333-349)**

AsIs:
```javascript
function detectPdcaPhase() {
  const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json');
  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, 'utf8');
      const match = content.match(/"currentPhase"\s*:\s*(\d+)/);
      if (match && match[1]) { return match[1]; }
    } catch (e) { /* ignore */ }
  }
  return '1';
}
```

ToBe:
```javascript
function detectPdcaPhase() {
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus && pdcaStatus.pipeline && pdcaStatus.pipeline.currentPhase) {
    return String(pdcaStatus.pipeline.currentPhase);
  }
  return '1';
}
```

이유: (1) `process.cwd()` HIGH 위험 제거, (2) 정규식 -> `getPdcaStatusFull()` 캐시 활용, (3) Path Registry 자동 경유.

**변경 2: importResolver 경로 (라인 213)**

AsIs:
```javascript
const { content, errors } = importResolver.resolveImports(
  { imports: startupImports },
  path.join(process.cwd(), 'bkit.config.json')
);
```

ToBe:
```javascript
const { CONFIG_PATHS } = require('../lib/core/paths');
const { content, errors } = importResolver.resolveImports(
  { imports: startupImports },
  CONFIG_PATHS.bkitConfig()
);
```

이유: `process.cwd()` 하드코딩 -> Path Registry.

**변경 3: 컨텍스트 문자열 (라인 609)**

AsIs:
```javascript
additionalContext += `- bkit memory (\`docs/.bkit-memory.json\`) and CC auto-memory are separate systems with no collision\n`;
```

ToBe:
```javascript
additionalContext += `- bkit memory (\`.bkit/state/memory.json\`) and CC auto-memory are separate systems with no collision\n`;
```

이유: 사용자 안내 경로가 실제 파일 위치와 일치해야 함.

**변경 4: auto-migration 삽입 (라인 152-153 사이)** -- 섹션 4.3 참조.

#### lib/task/tracker.js (1곳)

**변경: findPdcaStatus() (라인 194-201)**

AsIs:
```javascript
function findPdcaStatus() {
  const { PROJECT_DIR } = getCore();
  const fs = require('fs');
  const path = require('path');
  const statusPath = path.join(PROJECT_DIR, 'docs/.pdca-status.json');
  return fs.existsSync(statusPath) ? statusPath : null;
}
```

ToBe:
```javascript
function findPdcaStatus() {
  const fs = require('fs');
  const { getPdcaStatusPath } = getPdca();
  const statusPath = getPdcaStatusPath();
  return fs.existsSync(statusPath) ? statusPath : null;
}
```

이유: 독립 하드코딩 -> 중앙 함수 `getPdcaStatusPath()` 사용. 이미 `getPdca()` lazy require 존재.

#### scripts/context-compaction.js (1곳)

**변경: snapshotDir (라인 46)**

AsIs:
```javascript
const snapshotDir = path.join(PROJECT_DIR, 'docs', '.pdca-snapshots');
```

ToBe:
```javascript
const { STATE_PATHS } = require('../lib/core/paths');
const snapshotDir = STATE_PATHS.snapshots();
```

이유: 유일한 하드코딩 -> Path Registry. Reader 0개이므로 변경 영향 최소.

#### lib/team/state-writer.js (1곳)

**변경: getAgentStatePath() (라인 70-73)**

AsIs:
```javascript
function getAgentStatePath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'agent-state.json');
}
```

ToBe:
```javascript
function getAgentStatePath() {
  const { STATE_PATHS } = require('../core/paths');
  return STATE_PATHS.agentState();
}
```

이유: `.bkit/agent-state.json` -> `.bkit/runtime/agent-state.json` (카테고리 분류). 13 consumer 자동 적용.

### 4.3 Phase 3: Migration + Git

#### migrateIfNeeded() 호출 위치: session-start.js 라인 152-153 사이

삽입 이유: `debugLog` 초기화 완료, 모든 `require()` 완료, `initPdcaStatusIfNotExists()` 호출 전.

```javascript
// v1.5.8: Auto-migration from docs/ flat paths to .bkit/ structured paths
try {
  const { STATE_PATHS, LEGACY_PATHS, ensureBkitDirs } = require('../lib/core/paths');
  ensureBkitDirs();

  const migrations = [
    { from: LEGACY_PATHS.pdcaStatus(), to: STATE_PATHS.pdcaStatus(), name: 'pdca-status', type: 'file' },
    { from: LEGACY_PATHS.memory(), to: STATE_PATHS.memory(), name: 'memory', type: 'file' },
    { from: LEGACY_PATHS.agentState(), to: STATE_PATHS.agentState(), name: 'agent-state', type: 'file' },
    { from: LEGACY_PATHS.snapshots(), to: STATE_PATHS.snapshots(), name: 'snapshots', type: 'directory' },
  ];

  for (const m of migrations) {
    try {
      if (!fs.existsSync(m.from)) continue;

      if (m.type === 'directory' && fs.existsSync(m.to)) {
        if (fs.readdirSync(m.to).length > 0) continue;
        fs.rmdirSync(m.to);
      } else if (fs.existsSync(m.to)) {
        continue;
      }

      try {
        fs.renameSync(m.from, m.to);
      } catch (renameErr) {
        if (renameErr.code === 'EXDEV') {
          if (m.type === 'directory') {
            fs.cpSync(m.from, m.to, { recursive: true });
          } else {
            fs.copyFileSync(m.from, m.to);
          }
          fs.rmSync(m.from, { recursive: true, force: true });
        } else {
          throw renameErr;
        }
      }
      debugLog('SessionStart', `Migrated ${m.name}`, { from: m.from, to: m.to });
    } catch (fileErr) {
      debugLog('SessionStart', `Migration failed: ${m.name}`, { error: fileErr.message });
    }
  }
} catch (e) {
  debugLog('SessionStart', 'Path migration skipped', { error: e.message });
}
```

마이그레이션 순서: pdca-status(28+ consumers) -> memory(9) -> agent-state(6+) -> snapshots(0 readers). 높은 consumer 순으로 먼저 이동.

#### git rm 대상

```bash
git rm docs/.pdca-status.json
git rm docs/.bkit-memory.json
```

`docs/.pdca-snapshots/`는 이미 gitignored이므로 `git rm` 불필요.

#### .gitignore 확인

기존 `.bkit/` blanket ignore가 모든 신규 경로를 커버. **변경 없음**.

### 4.4 Phase 4: 설정 업데이트

#### bkit.config.json

| 키 | AsIs | ToBe |
|-----|------|------|
| `version` (라인 3) | `"1.5.7"` | `"1.5.8"` |
| `pdca.statusFile` (라인 34) | `"docs/.pdca-status.json"` | `".bkit/state/pdca-status.json"` |
| `customization.mode` | 없음 | `"auto"` (선택적) |

#### .claude-plugin/plugin.json

| 키 | AsIs | ToBe |
|-----|------|------|
| `version` (라인 3) | `"1.5.7"` | `"1.5.8"` |

#### lib/common.js (bridge 확장)

import 추가:
```javascript
const paths = require('./core/paths');
```

exports 추가 (5개):
```javascript
STATE_PATHS: paths.STATE_PATHS,
LEGACY_PATHS: paths.LEGACY_PATHS,
CONFIG_PATHS: paths.CONFIG_PATHS,
ensureBkitDirs: paths.ensureBkitDirs,
```

Export 수: 180 -> 184 (+4). `migrateStateFiles`는 session-start.js 전용이므로 bridge 제외 가능.

---

## 5. 마이그레이션 설계

### 5.1 시나리오 매트릭스 (5가지)

| 시나리오 | 구 경로 | 신 경로 | 동작 | 결과 |
|---------|:------:|:------:|------|------|
| **S1: 신규 설치** | 없음 | 없음 | `ensureBkitDirs()`만 실행 | 디렉토리 3개 생성, 파일 이동 없음 |
| **S2: v1.5.7->v1.5.8** | 존재 | 없음 | `renameSync()` x 4 | 파일 이동 완료, 구 경로 자동 삭제 |
| **S3: v1.5.8 재실행** | 없음 | 존재 | 전부 skip | 아무 변화 없음 |
| **S4: 부분 마이그레이션** | 일부 | 일부 | 존재하는 것만 이동 | 나머지 다음 세션에서 처리 |
| **S5: 충돌 (양쪽)** | 존재 | 존재 | 신 경로 우선, 구 파일 보존 | 기능 영향 없음 (orphan) |

### 5.2 실행 순서 및 에러 핸들링

1. `ensureBkitDirs()` -> `.bkit/`, `.bkit/state/`, `.bkit/runtime/` 생성
2. 파일별 독립 try-catch로 격리 (하나 실패해도 나머지 계속)
3. `fs.renameSync()` 우선, EXDEV시 `copyFileSync()` + `rmSync()` fallback

| 에러 | 처리 | 영향 |
|------|------|------|
| ENOENT | `existsSync()` 사전 차단 -> skip | 없음 |
| EACCES | catch -> debugLog -> 다음 파일 | 해당 파일만 구 경로에 남음 |
| EXDEV | copy + delete fallback | 정상 이동 |
| require() 실패 | 외부 try-catch -> 전체 skip | 구 경로 유지 (기존 코드 동작) |

### 5.3 AsIs 삭제 전략

`fs.renameSync()`는 원자적 연산으로 소스 자동 삭제. 별도 delete 단계 불필요.
EXDEV fallback시: `copyFileSync()` 완료 후에만 `rmSync()` 실행.
삭제 실패시: orphan 파일로 방치 (기능 영향 없음, 다음 세션 S5 처리).

### 5.4 롤백 계획

**방법 A (코드 롤백)**:
```bash
cp .bkit/state/pdca-status.json docs/.pdca-status.json
cp .bkit/state/memory.json docs/.bkit-memory.json
cp .bkit/runtime/agent-state.json .bkit/agent-state.json
git revert <v1.5.8-commit-hash>
```

**방법 B (파일만 복구)**: 위 3개 cp 명령만 실행, 코드 revert 없이.

**판단 기준**: 전체 PDCA 기능 불가 -> 방법 A. 특정 consumer 1-2개 오류 -> 핫픽스.

---

## 6. 회귀 방지

### 6.1 기존 TC 영향 (0개)

bkit에 자동 테스트 파일 없음 (test/ 디렉토리 gitignored). 경로 변경에 의한 기존 TC 깨짐 위험 **0**.

### 6.2 수동 검증 시나리오 (VS-1 ~ VS-7)

| # | 시나리오 | 검증 포인트 | 관련 Consumer |
|---|---------|-----------|:------------:|
| VS-1 | SessionStart -> PDCA status 읽기 | `initPdcaStatusIfNotExists()` 정상, `detectPdcaPhase()` 올바른 반환 | R1, R6-R8, E1, W1 |
| VS-2 | `/pdca status` -> feature 정보 표시 | currentFeature, phase, history 표시 | R1, R3, R4 |
| VS-3 | `/pdca plan` -> 새 plan 생성 | `.bkit/state/pdca-status.json`에 저장, 구 경로에 미생성 | W3, W5, W6 |
| VS-4 | gap-detector 실행 -> 분석 결과 저장 | `updatePdcaStatus()` 신 경로 업데이트 | R12, W15 |
| VS-5 | CTO Team -> agent-state 업데이트 | `.bkit/runtime/agent-state.json` 생성, 구 경로에 미생성 | W1-W7 |
| VS-6 | context-compaction -> 스냅샷 저장 | `.bkit/snapshots/`에 생성, 10개 제한 정상 | compaction 전체 |
| VS-7 | readBkitMemory/writeBkitMemory | `.bkit/state/memory.json` 정상 R/W | status.js + memory-store.js |

### 6.3 자동 검증 명령 (AV-1 ~ AV-6)

**AV-1: 하드코딩 잔존 검사**
```bash
grep -rn "docs/\.pdca-status" --include="*.js" lib/ hooks/ scripts/  # 0 matches
grep -rn "docs/.*\.bkit-memory" --include="*.js" lib/ hooks/ scripts/  # 0 matches
grep -rn "docs/.*\.pdca-snapshots" --include="*.js" lib/ hooks/ scripts/  # 0 matches
```

**AV-2: 신 경로 파일 존재**
```bash
ls -la .bkit/state/pdca-status.json  # 존재
ls -la .bkit/state/memory.json       # 존재
ls -d .bkit/runtime/                  # 존재
```

**AV-3: 구 경로 파일 부재**
```bash
ls docs/.pdca-status.json 2>/dev/null  # No such file
ls docs/.bkit-memory.json 2>/dev/null  # No such file
ls .bkit/agent-state.json 2>/dev/null  # No such file
```

**AV-4: git 상태**
```bash
git ls-files docs/.pdca-status.json  # 빈 출력
git ls-files docs/.bkit-memory.json  # 빈 출력
git ls-files .bkit/                  # 빈 출력
```

**AV-5: Path Registry 무결성**
```bash
node -e "
  const p = require('./lib/core/paths');
  const assert = require('assert');
  assert(p.STATE_PATHS.pdcaStatus().includes('.bkit/state/pdca-status.json'));
  assert(p.STATE_PATHS.memory().includes('.bkit/state/memory.json'));
  assert(p.STATE_PATHS.agentState().includes('.bkit/runtime/agent-state.json'));
  assert(p.LEGACY_PATHS.pdcaStatus().includes('docs/.pdca-status.json'));
  console.log('All assertions passed');
"
```

**AV-6: common.js bridge**
```bash
node -e "
  const c = require('./lib/common');
  assert(typeof c.STATE_PATHS === 'object');
  assert(typeof c.getPdcaStatusPath === 'function');
  assert(typeof c.getAgentStatePath === 'function');
  console.log('Bridge verified');
"
```

### 6.4 SKILL.md 경로 업데이트 (후속 작업)

15곳의 SKILL.md 경로 문자열 업데이트 필요 (기능 영향 없음, API 경유이므로 릴리스 후 별도 커밋 가능):

| 스킬 | 참조 수 | 변경 |
|------|:------:|------|
| `skills/pdca/SKILL.md` | 7 | `.bkit-memory.json` -> `.bkit/state/memory.json` 등 |
| `skills/starter/SKILL.md` | 1 | 동일 |
| `skills/plan-plus/SKILL.md` | 2 | 동일 |
| `skills/enterprise/SKILL.md` | 1 | 동일 |
| `skills/dynamic/SKILL.md` | 1 | 동일 |

---

## 7. 사용자 영향 분석

### 7.1 기능별 Before/After 비교표

| # | 기능 | Before (v1.5.7) | After (v1.5.8) | 동일 |
|---|------|-----------------|----------------|:----:|
| 1 | PDCA 상태 읽기/쓰기 | `docs/.pdca-status.json` | `.bkit/state/pdca-status.json` | O |
| 2 | PDCA phase 감지 | 정규식 파싱, process.cwd() | `getPdcaStatusFull()` 경유 | O |
| 3 | bkit 메모리 R/W | `docs/.bkit-memory.json` | `.bkit/state/memory.json` | O |
| 4 | Agent State R/W | `.bkit/agent-state.json` | `.bkit/runtime/agent-state.json` | O |
| 5 | 컨텍스트 스냅샷 | `docs/.pdca-snapshots/` | `.bkit/snapshots/` | O |
| 6 | globalCache | `'pdca-status'` 키, 3초 TTL | 변경 없음 | O |
| 7 | auto-migration | 없음 | SessionStart에서 자동 실행 | 신규 |
| 8 | .gitignore | `.bkit/` blanket | 변경 없음 | O |

**모든 기능이 동일하게 동작함을 확인.** 경로만 변경되며 API 시그니처, 반환값, 에러 처리는 모두 보존.

### 7.2 사용자 인식 가능한 변경

- `session-start.js:609`의 안내 문구에서 `docs/.bkit-memory.json` -> `.bkit/state/memory.json`으로 표시 변경
- 그 외 사용자가 인식할 수 있는 동작 변화 **없음**

### 7.3 하위 호환성

v1.5.7 환경에서 v1.5.8 첫 실행 시:
1. SessionStart hook이 auto-migration 실행
2. `docs/.pdca-status.json` -> `.bkit/state/pdca-status.json` 이동 (rename, < 1ms)
3. 나머지 3개 파일도 동일하게 이동
4. `initPdcaStatusIfNotExists()`가 신 경로에서 정상 동작
5. 이후 모든 세션에서 신 경로만 사용 (S3 시나리오)

**성능**: 마이그레이션 총 소요 < 3ms (같은 볼륨 renameSync). SessionStart 지연 무시 가능.

---

## 8. 구현 순서 및 체크리스트

### 8.1 Phase별 구현 순서 (의존성 순)

```
Phase 1: Path Registry 생성         (의존성 없음)
    |
Phase 2-a: lib/pdca/status.js       (paths.js 의존)
Phase 2-b: lib/memory-store.js      (paths.js 의존)
Phase 2-c: lib/task/tracker.js      (pdca module 경유)
Phase 2-d: context-compaction.js    (paths.js 의존)
Phase 2-e: lib/team/state-writer.js (paths.js 의존)
    |
Phase 3-a: session-start.js         (paths.js + Phase 2 완료 후)
Phase 3-b: lib/common.js bridge     (paths.js 의존)
    |
Phase 4: bkit.config.json + plugin.json (의존성 없음)
Phase 4: git rm docs dotfiles       (Phase 3 완료 후)
```

### 8.2 전체 체크리스트 (39개 항목)

**Phase 1: Path Registry (4)**
- [ ] lib/core/paths.js 신규 생성
- [ ] ensureBkitDirs()에서 snapshots/ 제외 확인
- [ ] 순환 참조 테스트 (paths.js -> platform.js 직접 import)
- [ ] lib/core/index.js에 paths export 추가

**Phase 2: Consumer 리팩토링 (10)**
- [ ] lib/pdca/status.js:33 -- getPdcaStatusPath() -> STATE_PATHS.pdcaStatus()
- [ ] lib/pdca/status.js:705 -- readBkitMemory() -> STATE_PATHS.memory()
- [ ] lib/pdca/status.js:724 -- writeBkitMemory() -> STATE_PATHS.memory()
- [ ] lib/pdca/status.js JSDoc 2곳 경로 업데이트
- [ ] lib/memory-store.js:28 -- getMemoryFilePath() -> STATE_PATHS.memory()
- [ ] lib/task/tracker.js:199 -- findPdcaStatus() -> getPdcaStatusPath()
- [ ] scripts/context-compaction.js:46 -- snapshotDir -> STATE_PATHS.snapshots()
- [ ] lib/team/state-writer.js:72 -- getAgentStatePath() -> STATE_PATHS.agentState()
- [ ] lib/team/state-writer.js 모듈 주석 경로 업데이트
- [ ] hooks/session-start.js:334 -- detectPdcaPhase() -> getPdcaStatusFull()

**Phase 3: Migration + Bridge (6)**
- [ ] session-start.js:152-153 마이그레이션 코드 삽입
- [ ] 마이그레이션 순서: pdca-status -> memory -> agent-state -> snapshots
- [ ] EXDEV fallback (copy + delete) 구현
- [ ] hooks/session-start.js:213 -- importResolver -> CONFIG_PATHS
- [ ] hooks/session-start.js:609 -- 컨텍스트 문자열 경로 업데이트
- [ ] lib/common.js bridge에 paths export 추가

**Phase 4: 설정 + Git (6)**
- [ ] bkit.config.json version -> 1.5.8
- [ ] bkit.config.json statusFile -> .bkit/state/pdca-status.json
- [ ] bkit.config.json customization.mode -> "auto" (선택적)
- [ ] .claude-plugin/plugin.json version -> 1.5.8
- [ ] git rm docs/.pdca-status.json
- [ ] git rm docs/.bkit-memory.json

**검증 (13)**
- [ ] AV-1: 하드코딩 잔존 검사 (grep -> 0 matches)
- [ ] AV-2: 신 경로 파일 존재 검사
- [ ] AV-3: 구 경로 파일 부재 검사
- [ ] AV-4: git 상태 검사
- [ ] AV-5: Path Registry 무결성 (node -e)
- [ ] AV-6: common.js bridge 검사
- [ ] VS-1: SessionStart PDCA status 읽기
- [ ] VS-2: /pdca status 정보 표시
- [ ] VS-3: /pdca plan 새 feature 생성
- [ ] VS-4: gap-detector 분석 결과 저장
- [ ] VS-5: CTO Team agent-state 업데이트
- [ ] VS-6: context-compaction 스냅샷 저장
- [ ] VS-7: readBkitMemory/writeBkitMemory R/W

### 8.3 예상 소요 시간

| Phase | 항목 | 비고 |
|:-----:|------|------|
| 1 | Path Registry 생성 | paths.js ~80줄 신규 |
| 2 | Consumer 리팩토링 | 7파일 10지점, 대부분 1-2줄 변경 |
| 3 | Migration + Bridge | session-start.js 마이그레이션 코드 ~30줄 |
| 4 | 설정 + Git | config 2줄 + version bump 2곳 + git rm 2개 |

---

## 9. 성공 지표

| # | 지표 | 목표값 | 측정 방법 |
|---|------|:------:|----------|
| SM-1 | 상태 파일 `.bkit/` 위치율 | **100%** (4/4) | `ls .bkit/state/ .bkit/runtime/` |
| SM-2 | 하드코딩 경로 잔여 수 | **0개** | AV-1 grep 검사 |
| SM-3 | auto-migration 성공률 | **100%** | S1~S5 시나리오 테스트 |
| SM-4 | 기존 TC 회귀 수 | **0건** | Comprehensive Test 실행 |
| SM-5 | 코드 변경 파일 수 | **10개** | `git diff --stat` |
| SM-6 | 신규 상태 파일 수 | **0개** | YAGNI 원칙 확인 |
| SM-7 | common.js export 보존 | **180개 유지 + 4 추가** | AV-6 검사 |

---

## Appendix

### A. 참조 문서 목록 (7개)

| # | 문서 | 내용 | Task |
|---|------|------|:----:|
| 1 | `docs/02-design/research/asis-path-audit.md` | 전체 경로 감사 (20개 참조, 10개 변경) | #1 |
| 2 | `docs/02-design/research/asis-pdca-status-consumers.md` | pdca-status 28 consumers 전수 분석 | #2 |
| 3 | `docs/02-design/research/asis-other-state-consumers.md` | memory/snapshots/agent-state 소비자 | #3 |
| 4 | `docs/02-design/research/asis-session-start-analysis.md` | session-start.js 753줄 영향 분석 | #4 |
| 5 | `docs/02-design/research/tobe-path-registry-design.md` | Path Registry 설계 + JS 코드 | #5 |
| 6 | `docs/02-design/research/tobe-consumer-change-spec.md` | 10파일 16지점 변경 명세 | #6 |
| 7 | `docs/02-design/research/tobe-migration-regression-strategy.md` | 마이그레이션 + 회귀방지 | #7 |

### B. CTO Team 구성 (8명)

| 역할 | Task | 산출물 |
|------|:----:|--------|
| path-auditor | #1 | 경로 하드코딩 감사 |
| pdca-analyst | #2 | pdca-status consumer 전수 분석 |
| state-analyst | #3 | memory/snapshots/agent-state 분석 |
| session-analyst | #4 | session-start.js 영향 분석 |
| registry-designer | #5 | Path Registry 설계 + 코드 |
| change-spec-writer | #6 | Consumer 변경 명세 |
| migration-designer | #7 | 마이그레이션 + 회귀방지 전략 |
| design-compiler | #8 | 본 설계서 통합 |
