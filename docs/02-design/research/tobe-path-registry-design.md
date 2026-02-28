# ToBe: Path Registry 상세 설계 (lib/core/paths.js)

> **작성일**: 2026-03-01
> **버전**: v1.5.8
> **근거 문서**: asis-path-audit.md, asis-pdca-status-consumers.md, asis-other-state-consumers.md
> **계획 문서**: bkit-v1.5.8-studio-support.plan.md (Section 5.3 Phase 1)

---

## 1. 모듈 개요

### 1.1 목적

`lib/core/paths.js`는 bkit의 **모든 상태 파일 경로를 중앙 관리**하는 Path Registry 모듈이다.

현재 11+ 곳에 하드코딩된 경로(`docs/.pdca-status.json`, `docs/.bkit-memory.json`, `docs/.pdca-snapshots/`, `.bkit/agent-state.json`)를 단일 모듈로 통합하여:

1. **경로 변경 시 1곳만 수정**하면 모든 consumer에 자동 적용
2. **마이그레이션 로직을 표준화**하여 v1.5.7 -> v1.5.8 업그레이드를 안전하게 처리
3. **디렉토리 구조를 코드로 문서화**하여 향후 Studio 연동 대비

### 1.2 설계 원칙

| 원칙 | 설명 |
|------|------|
| **Lazy Evaluation** | 모든 경로를 함수(`() => ...`)로 제공. 모듈 로드 시점에 `PROJECT_DIR`이 결정되지 않을 수 있음 |
| **Idempotent** | `ensureBkitDir()`은 여러 번 호출해도 동일 결과 |
| **Independent Migration** | `migrateStateFiles()`에서 각 파일은 독립적으로 이동 (하나 실패해도 나머지 계속) |
| **No Side Effects on Import** | `require('paths')`만으로 파일 I/O 발생하지 않음 |
| **Deprecation Window** | `LEGACY_PATHS`는 v1.6.0에서 제거 예정 (주석 명시) |

### 1.3 의존성

```
lib/core/paths.js
├── node:path (built-in)
├── node:fs (built-in)
└── ./platform.js (PROJECT_DIR, PLUGIN_ROOT)
```

- 외부 라이브러리 의존성 **없음**
- `lib/core/platform.js`에서 `PROJECT_DIR`과 `PLUGIN_ROOT`만 참조
- 순환 참조 방지: `getCore()` lazy require 패턴 사용하지 않고 `platform.js`를 직접 import

---

## 2. 상수 정의

### 2.1 STATE_PATHS

`.bkit/` 하위의 **신규 상태 파일 경로**를 정의한다. Option B (Category-Based) 구조를 따른다.

```
.bkit/                          # 전체 gitignored
├── state/                      # 영속 상태 (PDCA 상태, 메모리)
│   ├── pdca-status.json        # PDCA 피쳐 상태 관리
│   └── memory.json             # bkit 메모리 스토어
├── runtime/                    # 런타임 상태 (에이전트)
│   └── agent-state.json        # Agent Teams 실시간 상태
└── snapshots/                  # 백업 (compaction snapshots)
    └── snapshot-{timestamp}.json
```

| 키 | 반환 경로 | 용도 | 접근 빈도 |
|-----|----------|------|:---------:|
| `root()` | `{PROJECT_DIR}/.bkit` | .bkit 루트 디렉토리 | 낮음 |
| `stateDir()` | `{PROJECT_DIR}/.bkit/state` | 영속 상태 디렉토리 | 낮음 |
| `runtimeDir()` | `{PROJECT_DIR}/.bkit/runtime` | 런타임 상태 디렉토리 | 낮음 |
| `snapshotsDir()` | `{PROJECT_DIR}/.bkit/snapshots` | 백업 디렉토리 | 낮음 |
| `pdcaStatus()` | `{PROJECT_DIR}/.bkit/state/pdca-status.json` | PDCA 피쳐 상태 | 높음 (28+ consumers) |
| `memory()` | `{PROJECT_DIR}/.bkit/state/memory.json` | bkit 메모리 스토어 | 중간 (9 consumers) |
| `agentState()` | `{PROJECT_DIR}/.bkit/runtime/agent-state.json` | Agent Teams 상태 | 중간 (6+ consumers) |

### 2.2 LEGACY_PATHS

마이그레이션 소스 경로. **v1.6.0에서 제거 예정**.

| 키 | 반환 경로 | 마이그레이션 대상 |
|-----|----------|:----------------:|
| `pdcaStatus()` | `{PROJECT_DIR}/docs/.pdca-status.json` | `STATE_PATHS.pdcaStatus()` |
| `memory()` | `{PROJECT_DIR}/docs/.bkit-memory.json` | `STATE_PATHS.memory()` |
| `snapshots()` | `{PROJECT_DIR}/docs/.pdca-snapshots` | `STATE_PATHS.snapshotsDir()` |
| `agentState()` | `{PROJECT_DIR}/.bkit/agent-state.json` | `STATE_PATHS.agentState()` |

> **주의**: `agentState()`는 이미 `.bkit/` 하위에 있으나, `.bkit/runtime/` 서브디렉토리로 이동한다.

### 2.3 CONFIG_PATHS

이동 **불가**한 설정 파일. Claude Code의 플러그인 발견 메커니즘에 의존하므로 위치 고정.

| 키 | 반환 경로 | 이동 불가 사유 |
|-----|----------|--------------|
| `bkitConfig()` | `{PROJECT_DIR}/bkit.config.json` | bkit 내부 코드가 `loadConfig()`로 참조. 위치 변경 시 전체 config 로딩 로직 수정 필요 |
| `pluginJson()` | `{PLUGIN_ROOT}/.claude-plugin/plugin.json` | CC 플러그인 발견 규격 (`.claude-plugin/plugin.json` 고정) |
| `hooksJson()` | `{PLUGIN_ROOT}/hooks/hooks.json` | CC 훅 발견 규격 (`hooks/hooks.json` 고정) |

---

## 3. 함수 설계

### 3.1 ensureBkitDir()

`.bkit/` 및 하위 디렉토리(`state/`, `runtime/`, `snapshots/`)를 생성한다.

**시그니처**:
```javascript
function ensureBkitDir()
```

**반환값**: `{ created: string[], errors: string[] }`
- `created`: 새로 생성된 디렉토리 경로 배열
- `errors`: 생성 실패한 경로 + 에러 메시지 배열

**동작**:
1. `STATE_PATHS`에서 디렉토리 경로 4개를 순회 (`root`, `stateDir`, `runtimeDir`, `snapshotsDir`)
2. 각 디렉토리에 대해 `fs.mkdirSync(dir, { recursive: true })` 실행
3. `recursive: true` 덕분에 이미 존재해도 에러 없음 (idempotent)
4. 실패 시 에러를 수집하되 다른 디렉토리 생성을 계속 진행

**에러 케이스**:
| 케이스 | 동작 | 결과 |
|--------|------|------|
| 디렉토리 이미 존재 | `recursive: true`로 무시 | `created`에 포함되지 않음 |
| 권한 오류 (EACCES) | catch → `errors`에 추가 | 다른 디렉토리 생성 계속 |
| 읽기전용 파일시스템 (EROFS) | catch → `errors`에 추가 | 다른 디렉토리 생성 계속 |

### 3.2 migrateStateFiles()

구 경로에서 신 경로로 상태 파일을 마이그레이션한다.

**시그니처**:
```javascript
function migrateStateFiles()
```

**반환값**: `{ migrated: string[], skipped: string[], errors: string[] }`
- `migrated`: 성공적으로 이동된 파일/디렉토리 설명 배열 (예: `"pdca-status.json: docs/ -> .bkit/state/"`)
- `skipped`: 스킵된 이유 배열 (예: `"memory.json: legacy not found"`, `"pdca-status.json: target already exists"`)
- `errors`: 실패한 이동 + 에러 메시지 배열

**동작**:
1. `ensureBkitDir()` 호출하여 대상 디렉토리 사전 생성
2. 마이그레이션 매핑 4개를 순회:
   - `LEGACY_PATHS.pdcaStatus()` → `STATE_PATHS.pdcaStatus()`
   - `LEGACY_PATHS.memory()` → `STATE_PATHS.memory()`
   - `LEGACY_PATHS.snapshots()` → `STATE_PATHS.snapshotsDir()`
   - `LEGACY_PATHS.agentState()` → `STATE_PATHS.agentState()`
3. 각 파일에 대해 독립적으로 마이그레이션 실행 (하나 실패해도 나머지 계속)

**시나리오별 동작**:

| 시나리오 | 레거시 파일 | 신규 파일 | 동작 | 결과 |
|----------|:---------:|:---------:|------|------|
| **신규 설치** | 없음 | 없음 | `ensureBkitDir()`만 실행 | `skipped`에 "legacy not found" |
| **v1.5.7→v1.5.8 업그레이드** | 있음 | 없음 | `fs.renameSync()` 시도. 실패 시 `fs.copyFileSync()` + `fs.unlinkSync()` fallback | `migrated`에 추가 |
| **재실행 (이미 마이그레이션됨)** | 없음 | 있음 | 스킵 | `skipped`에 "legacy not found" |
| **충돌 (양쪽 존재)** | 있음 | 있음 | 신 경로 우선 (레거시 파일 무시) | `skipped`에 "target already exists" |
| **레거시 디렉토리 (snapshots)** | 디렉토리 | 없음 | `fs.renameSync()` (디렉토리 이동) | `migrated`에 추가 |

**에러 핸들링**:
| 케이스 | 동작 |
|--------|------|
| `fs.renameSync()` 실패 (크로스 디바이스 EXDEV) | `fs.copyFileSync()` + `fs.unlinkSync()` fallback |
| `fs.renameSync()` 실패 (디렉토리, EXDEV) | 스킵 + `errors`에 기록 (크로스 디바이스 디렉토리 이동은 복잡하므로 수동 안내) |
| 권한 오류 (EACCES) | `errors`에 추가, 다음 파일 계속 |
| 부분 마이그레이션 (일부 성공/일부 실패) | 성공한 파일은 유지, 실패한 파일은 레거시 위치에 남음. `errors`에 상세 기록 |

---

## 4. Export 계획

```javascript
module.exports = {
  // 경로 상수 (3개)
  STATE_PATHS,
  LEGACY_PATHS,
  CONFIG_PATHS,

  // 유틸리티 함수 (2개)
  ensureBkitDir,
  migrateStateFiles,
};
```

**총 5개 export**. 의도적으로 작게 유지하여 API surface를 최소화한다.

---

## 5. lib/core/index.js 변경

현재 `lib/core/index.js`는 6개 서브모듈(platform, cache, io, debug, config, file)을 re-export한다.
`paths` 모듈을 추가하여 **7번째 서브모듈**로 등록한다.

**변경 내용**:
```javascript
// 추가할 require
const paths = require('./paths');

// module.exports에 추가 (총 5개 추가)
module.exports = {
  // ... 기존 41 exports ...

  // Paths (5 exports) - v1.5.8: Path Registry
  STATE_PATHS: paths.STATE_PATHS,
  LEGACY_PATHS: paths.LEGACY_PATHS,
  CONFIG_PATHS: paths.CONFIG_PATHS,
  ensureBkitDir: paths.ensureBkitDir,
  migrateStateFiles: paths.migrateStateFiles,
};
```

**core export 수**: 41 → 46 (+5)

---

## 6. lib/common.js bridge 변경

현재 `lib/common.js`는 180개를 re-export한다. Path Registry 모듈 추가로 5개가 추가된다.

**추가할 export**:
```javascript
module.exports = {
  // ... 기존 180 exports ...

  // Paths (5 exports) - v1.5.8: Path Registry
  STATE_PATHS: core.STATE_PATHS,
  LEGACY_PATHS: core.LEGACY_PATHS,
  CONFIG_PATHS: core.CONFIG_PATHS,
  ensureBkitDir: core.ensureBkitDir,
  migrateStateFiles: core.migrateStateFiles,
};
```

**common.js export 수**: 180 → 185 (+5)

---

## 7. 실제 JavaScript 코드

```javascript
/**
 * Path Registry - bkit 상태 파일 경로 중앙 관리
 * @module lib/core/paths
 * @version 1.5.8
 *
 * 모든 상태 파일 경로를 중앙에서 관리하여:
 * - 경로 변경 시 1곳만 수정하면 전체 적용
 * - 마이그레이션 로직 표준화
 * - Studio IPC 연동 대비 디렉토리 구조 문서화
 */

const path = require('path');
const fs = require('fs');

// platform.js를 직접 import하여 순환 참조 방지
// (getCore() lazy require 패턴 대신)
const { PROJECT_DIR, PLUGIN_ROOT } = require('./platform');

// ============================================
// 경로 상수
// ============================================

/**
 * 신규 상태 파일 경로 (v1.5.8 Option B: Category-Based)
 *
 * .bkit/
 * ├── state/          영속 상태
 * │   ├── pdca-status.json
 * │   └── memory.json
 * ├── runtime/        런타임 상태
 * │   └── agent-state.json
 * └── snapshots/      백업
 *     └── snapshot-{timestamp}.json
 */
const STATE_PATHS = {
  /** .bkit 루트 디렉토리 */
  root:         () => path.join(PROJECT_DIR, '.bkit'),
  /** 영속 상태 디렉토리 (.bkit/state/) */
  stateDir:     () => path.join(PROJECT_DIR, '.bkit', 'state'),
  /** 런타임 상태 디렉토리 (.bkit/runtime/) */
  runtimeDir:   () => path.join(PROJECT_DIR, '.bkit', 'runtime'),
  /** 백업 디렉토리 (.bkit/snapshots/) */
  snapshotsDir: () => path.join(PROJECT_DIR, '.bkit', 'snapshots'),
  /** PDCA 피쳐 상태 파일 */
  pdcaStatus:   () => path.join(PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  /** bkit 메모리 스토어 */
  memory:       () => path.join(PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  /** Agent Teams 실시간 상태 */
  agentState:   () => path.join(PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};

/**
 * 레거시 경로 (마이그레이션 소스)
 * @deprecated v1.6.0에서 제거 예정
 */
const LEGACY_PATHS = {
  /** 구 PDCA 상태 파일 위치 (docs/.pdca-status.json) */
  pdcaStatus:  () => path.join(PROJECT_DIR, 'docs', '.pdca-status.json'),
  /** 구 메모리 파일 위치 (docs/.bkit-memory.json) */
  memory:      () => path.join(PROJECT_DIR, 'docs', '.bkit-memory.json'),
  /** 구 스냅샷 디렉토리 위치 (docs/.pdca-snapshots/) */
  snapshots:   () => path.join(PROJECT_DIR, 'docs', '.pdca-snapshots'),
  /** 구 에이전트 상태 파일 위치 (.bkit/agent-state.json) */
  agentState:  () => path.join(PROJECT_DIR, '.bkit', 'agent-state.json'),
};

/**
 * 설정 파일 경로 (이동 불가)
 * CC 플러그인 발견 메커니즘에 의존하므로 위치 고정
 */
const CONFIG_PATHS = {
  /** bkit 설정 파일 (프로젝트 루트) */
  bkitConfig: () => path.join(PROJECT_DIR, 'bkit.config.json'),
  /** CC 플러그인 매니페스트 (PLUGIN_ROOT 기준) */
  pluginJson: () => path.join(PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  /** CC 훅 설정 (PLUGIN_ROOT 기준) */
  hooksJson:  () => path.join(PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * .bkit/ 및 하위 디렉토리 생성 (idempotent)
 *
 * 생성 대상:
 * - .bkit/
 * - .bkit/state/
 * - .bkit/runtime/
 * - .bkit/snapshots/
 *
 * @returns {{ created: string[], errors: string[] }}
 */
function ensureBkitDir() {
  const dirs = [
    STATE_PATHS.root(),
    STATE_PATHS.stateDir(),
    STATE_PATHS.runtimeDir(),
    STATE_PATHS.snapshotsDir(),
  ];

  const result = { created: [], errors: [] };

  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        result.created.push(dir);
      }
    } catch (e) {
      result.errors.push(`${dir}: ${e.message}`);
    }
  }

  return result;
}

/**
 * 구 경로에서 신 경로로 상태 파일 마이그레이션
 *
 * 동작:
 * 1. ensureBkitDir()로 대상 디렉토리 사전 생성
 * 2. 4개 마이그레이션 매핑을 독립적으로 실행
 * 3. 각 파일 실패해도 나머지 계속 진행
 *
 * 시나리오:
 * - 신규 설치: ensureBkitDir()만 실행, 마이그레이션 스킵
 * - v1.5.7→v1.5.8 업그레이드: 파일 이동
 * - 재실행: 스킵 (이미 마이그레이션됨)
 * - 충돌 (양쪽 존재): 신 경로 우선 (레거시 무시)
 *
 * @returns {{ migrated: string[], skipped: string[], errors: string[] }}
 */
function migrateStateFiles() {
  const result = { migrated: [], skipped: [], errors: [] };

  // 1. 대상 디렉토리 생성
  const dirResult = ensureBkitDir();
  if (dirResult.errors.length > 0) {
    result.errors.push(...dirResult.errors.map(e => `[dir] ${e}`));
  }

  // 2. 마이그레이션 매핑 정의
  const migrations = [
    {
      name: 'pdca-status.json',
      legacy: LEGACY_PATHS.pdcaStatus(),
      target: STATE_PATHS.pdcaStatus(),
      type: 'file',
    },
    {
      name: 'memory.json',
      legacy: LEGACY_PATHS.memory(),
      target: STATE_PATHS.memory(),
      type: 'file',
    },
    {
      name: 'snapshots/',
      legacy: LEGACY_PATHS.snapshots(),
      target: STATE_PATHS.snapshotsDir(),
      type: 'directory',
    },
    {
      name: 'agent-state.json',
      legacy: LEGACY_PATHS.agentState(),
      target: STATE_PATHS.agentState(),
      type: 'file',
    },
  ];

  // 3. 각 파일 독립적으로 마이그레이션
  for (const migration of migrations) {
    try {
      const legacyExists = fs.existsSync(migration.legacy);
      const targetExists = fs.existsSync(migration.target);

      // 레거시 파일 없음 -> 스킵 (신규 설치 또는 이미 마이그레이션됨)
      if (!legacyExists) {
        result.skipped.push(`${migration.name}: legacy not found`);
        continue;
      }

      // 신 경로에 이미 존재 -> 스킵 (충돌 시 신 경로 우선)
      if (targetExists) {
        result.skipped.push(`${migration.name}: target already exists`);
        continue;
      }

      // 파일 이동 시도
      if (migration.type === 'file') {
        migrateFile(migration.legacy, migration.target);
      } else {
        migrateDirectory(migration.legacy, migration.target);
      }

      result.migrated.push(`${migration.name}: ${path.dirname(migration.legacy)} -> ${path.dirname(migration.target)}`);
    } catch (e) {
      result.errors.push(`${migration.name}: ${e.message}`);
    }
  }

  return result;
}

/**
 * 단일 파일 마이그레이션 (rename 우선, copyFile+unlink fallback)
 * @param {string} src - 소스 경로
 * @param {string} dest - 대상 경로
 * @private
 */
function migrateFile(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (renameErr) {
    // EXDEV (크로스 디바이스) 등의 경우 copy+delete fallback
    if (renameErr.code === 'EXDEV') {
      fs.copyFileSync(src, dest);
      fs.unlinkSync(src);
    } else {
      throw renameErr;
    }
  }
}

/**
 * 디렉토리 마이그레이션 (rename 우선, 실패 시 에러)
 * @param {string} src - 소스 디렉토리 경로
 * @param {string} dest - 대상 디렉토리 경로
 * @private
 */
function migrateDirectory(src, dest) {
  try {
    fs.renameSync(src, dest);
  } catch (renameErr) {
    if (renameErr.code === 'EXDEV') {
      // 크로스 디바이스 디렉토리 이동: 파일 단위로 복사
      copyDirSync(src, dest);
      fs.rmSync(src, { recursive: true, force: true });
    } else {
      throw renameErr;
    }
  }
}

/**
 * 디렉토리 재귀 복사 (EXDEV fallback용)
 * @param {string} src - 소스 디렉토리
 * @param {string} dest - 대상 디렉토리
 * @private
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================
// Module Exports
// ============================================

module.exports = {
  // 경로 상수 (3개)
  STATE_PATHS,
  LEGACY_PATHS,
  CONFIG_PATHS,

  // 유틸리티 함수 (2개)
  ensureBkitDir,
  migrateStateFiles,
};
```

---

## 8. lib/core/index.js 변경 상세

### 현재 (v1.5.7)

```javascript
const platform = require('./platform');
const cache = require('./cache');
const io = require('./io');
const debug = require('./debug');
const config = require('./config');
const file = require('./file');

module.exports = {
  // Platform (9), Cache (7), I/O (9), Debug (3), Config (5), File (8)
  // 총 41 exports
};
```

### 변경 후 (v1.5.8)

```javascript
const platform = require('./platform');
const cache = require('./cache');
const io = require('./io');
const debug = require('./debug');
const config = require('./config');
const file = require('./file');
const paths = require('./paths');   // 추가

module.exports = {
  // ... 기존 41 exports 유지 ...

  // Paths (5 exports) - v1.5.8: Path Registry
  STATE_PATHS: paths.STATE_PATHS,
  LEGACY_PATHS: paths.LEGACY_PATHS,
  CONFIG_PATHS: paths.CONFIG_PATHS,
  ensureBkitDir: paths.ensureBkitDir,
  migrateStateFiles: paths.migrateStateFiles,
};
```

**변경 범위**: require 1줄 추가 + export 5줄 추가 = **6줄 추가**

---

## 9. lib/common.js bridge 변경 상세

### 추가 위치

`lib/common.js`의 Core Module 섹션 끝 (File exports 다음)에 추가:

```javascript
module.exports = {
  // ============================================
  // Core Module (46 exports, was 41)
  // ============================================

  // ... 기존 Platform(9), Cache(7), I/O(9), Debug(3), Config(5), File(8) ...

  // Paths (5 exports) - v1.5.8: Path Registry
  STATE_PATHS: core.STATE_PATHS,
  LEGACY_PATHS: core.LEGACY_PATHS,
  CONFIG_PATHS: core.CONFIG_PATHS,
  ensureBkitDir: core.ensureBkitDir,
  migrateStateFiles: core.migrateStateFiles,

  // ============================================
  // PDCA Module (54 exports) - 변경 없음
  // ============================================
  // ...
};
```

**변경 범위**: export 5줄 추가, 주석 1줄 수정 = **6줄 변경**
**common.js export 수**: 180 → 185

---

## 10. 마이그레이션 시퀀스 다이어그램

```
SessionStart hook 실행
│
├── [1] migrateStateFiles() 호출
│   │
│   ├── [1.1] ensureBkitDir()
│   │   ├── mkdir .bkit/
│   │   ├── mkdir .bkit/state/
│   │   ├── mkdir .bkit/runtime/
│   │   └── mkdir .bkit/snapshots/
│   │
│   ├── [1.2] pdca-status.json 마이그레이션
│   │   ├── docs/.pdca-status.json 존재? → YES
│   │   ├── .bkit/state/pdca-status.json 존재? → NO
│   │   └── rename docs/.pdca-status.json → .bkit/state/pdca-status.json
│   │
│   ├── [1.3] memory.json 마이그레이션
│   │   ├── docs/.bkit-memory.json 존재? → YES
│   │   ├── .bkit/state/memory.json 존재? → NO
│   │   └── rename docs/.bkit-memory.json → .bkit/state/memory.json
│   │
│   ├── [1.4] snapshots/ 마이그레이션
│   │   ├── docs/.pdca-snapshots/ 존재? → YES
│   │   ├── .bkit/snapshots/ 내 파일 존재? → NO
│   │   └── rename docs/.pdca-snapshots/ → .bkit/snapshots/
│   │
│   └── [1.5] agent-state.json 마이그레이션
│       ├── .bkit/agent-state.json 존재? → YES
│       ├── .bkit/runtime/agent-state.json 존재? → NO
│       └── rename .bkit/agent-state.json → .bkit/runtime/agent-state.json
│
├── [2] 결과 로깅
│   └── debugLog('PathMigration', result)
│
└── [3] 기존 SessionStart 로직 계속 실행
```

---

## 11. 테스트 시나리오

### 11.1 ensureBkitDir()

| # | 시나리오 | 입력 상태 | 기대 결과 |
|---|----------|----------|----------|
| T1 | 신규 설치 (.bkit/ 없음) | 디렉토리 없음 | 4개 디렉토리 생성, `created: [root, state, runtime, snapshots]` |
| T2 | 재실행 (.bkit/ 존재) | 디렉토리 존재 | `created: []`, `errors: []` |
| T3 | 부분 존재 (.bkit/만 있음) | root만 존재 | 3개 하위 디렉토리 생성 |
| T4 | 권한 오류 | 읽기전용 파일시스템 | `errors`에 에러 메시지 기록 |

### 11.2 migrateStateFiles()

| # | 시나리오 | 입력 상태 | 기대 결과 |
|---|----------|----------|----------|
| T5 | 신규 설치 | 레거시 파일 없음 | `migrated: []`, `skipped: [x4]` |
| T6 | v1.5.7 업그레이드 | 레거시 파일 4개 존재 | `migrated: [x4]`, 레거시 위치에 파일 없음 |
| T7 | 재실행 | 레거시 없음, 신규 존재 | `skipped: [x4]` |
| T8 | 충돌 (양쪽 존재) | 레거시 + 신규 모두 존재 | `skipped: [x4]` (신 경로 우선) |
| T9 | 부분 마이그레이션 | 일부만 레거시 존재 | 존재하는 것만 `migrated`, 나머지 `skipped` |
| T10 | 파일 이동 실패 | 권한 오류 | `errors`에 기록, 다른 파일 계속 |

### 11.3 STATE_PATHS

| # | 시나리오 | 기대 결과 |
|---|----------|----------|
| T11 | `STATE_PATHS.pdcaStatus()` 호출 | `{PROJECT_DIR}/.bkit/state/pdca-status.json` 반환 |
| T12 | `STATE_PATHS.memory()` 호출 | `{PROJECT_DIR}/.bkit/state/memory.json` 반환 |
| T13 | `STATE_PATHS.agentState()` 호출 | `{PROJECT_DIR}/.bkit/runtime/agent-state.json` 반환 |
| T14 | `STATE_PATHS.snapshotsDir()` 호출 | `{PROJECT_DIR}/.bkit/snapshots` 반환 |

---

## 12. Consumer 변경 요약 (Phase 2 참조)

Path Registry 생성 후, Phase 2에서 각 consumer가 이 모듈을 참조하도록 변경한다.

| Consumer 파일 | 현재 코드 | 변경 후 | 영향 범위 |
|----------------|----------|---------|:---------:|
| `lib/pdca/status.js:33` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | `STATE_PATHS.pdcaStatus()` | 28+ consumers 자동 적용 |
| `lib/memory-store.js:28` | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` | `STATE_PATHS.memory()` | 5+ consumers 자동 적용 |
| `lib/pdca/status.js:705,724` | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` | `STATE_PATHS.memory()` | 6+ consumers 자동 적용 |
| `lib/team/state-writer.js:72` | `path.join(PROJECT_DIR, '.bkit', 'agent-state.json')` | `STATE_PATHS.agentState()` | 6+ consumers 자동 적용 |
| `scripts/context-compaction.js:46` | `path.join(PROJECT_DIR, 'docs', '.pdca-snapshots')` | `STATE_PATHS.snapshotsDir()` | 단일 사용처 |
| `hooks/session-start.js:334` | `path.join(process.cwd(), 'docs/.pdca-status.json')` | `getPdcaStatusPath()` 경유 | 독립 하드코딩 제거 + process.cwd() 버그 수정 |
| `lib/task/tracker.js:199` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | `getPdcaStatusPath()` 경유 | 독립 하드코딩 제거 |

---

## 13. 설계 검증

### 13.1 순환 참조 검증

```
paths.js → platform.js (직접 import)
paths.js는 core/index.js에서 export
core/index.js → paths.js (새로 추가)
```

- `paths.js`는 `platform.js`만 직접 import (순환 없음)
- `paths.js`는 `getCore()` lazy require 패턴을 사용하지 않음 (순환 원인 제거)
- 기존 모듈들(`status.js`, `memory-store.js` 등)은 `getCore()` 경유로 `STATE_PATHS`에 접근

### 13.2 하위 호환성

| 항목 | 호환성 |
|------|:------:|
| 기존 180개 common.js export | **유지** (변경 없음) |
| `getPdcaStatusPath()` API | **유지** (내부 구현만 변경) |
| `getMemoryFilePath()` API | **유지** (내부 구현만 변경) |
| `getAgentStatePath()` API | **유지** (내부 구현만 변경) |
| `getMemoryPath()` API | **유지** (getMemoryFilePath() 경유) |
| `readBkitMemory()` / `writeBkitMemory()` API | **유지** (내부 경로만 변경) |

### 13.3 성능 영향

- `STATE_PATHS.pdcaStatus()` 호출 비용: `path.join()` 1회 (마이크로초 단위)
- 기존 대비 추가 오버헤드: **무시 가능** (함수 호출 1회 추가)
- `ensureBkitDir()`의 `fs.existsSync()`: SessionStart에서 1회만 호출
