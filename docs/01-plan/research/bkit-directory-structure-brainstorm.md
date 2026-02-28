# .bkit/ Directory Structure Brainstorm

**Date**: 2026-03-01
**Designer**: infra-designer (Task #4)
**Purpose**: Design .bkit/ directory structure for bkit v1.5.8 Studio IPC readiness
**bkit Version**: v1.5.7 -> v1.5.8 (target)

---

## 1. Current State Analysis Summary

### 1.1 State File Distribution (from codebase-analyst's research)

현재 bkit의 상태 파일은 3곳에 분산되어 있음:

| Location | Files | Git Tracked | Purpose |
|----------|-------|-------------|---------|
| `docs/` | `.bkit-memory.json`, `.pdca-status.json`, `.pdca-snapshots/` | Yes (memory, status) / No (snapshots) | Persistent PDCA state |
| `.bkit/` | `agent-state.json` | No | Runtime team state |
| Project root | `bkit.config.json` | Yes | Configuration |

### 1.2 Key Metrics

- **`docs/.pdca-status.json`**: 16+ readers, 5 writers, 4 hardcoded path refs -- **가장 많이 참조되는 파일**
- **`docs/.bkit-memory.json`**: 5 readers, 5 writers, 3 hardcoded path refs
- **`docs/.pdca-snapshots/`**: 1 writer, 0 readers (backup only)
- **`.bkit/agent-state.json`**: 3 readers, 1 writer -- **이미 .bkit/에 위치**
- Path 중앙화 부족: `getPdcaStatusPath()`로 12+개 참조가 1곳을 거치지만, 3개의 독립적 path.join이 별도 존재

### 1.3 Immovable Files (Claude Code 고정 경로)

- `.claude-plugin/plugin.json` -- Claude Code plugin discovery
- `hooks/hooks.json` -- Claude Code hook discovery
- `bkit.config.json` -- 프로젝트 루트 + 플러그인 루트 양쪽에서 참조 (이동 불가)

### 1.4 .gitignore 현황

현재 `.bkit/` 전체가 gitignore 처리됨. 상태 파일 이동 시 선택적 ignore로 변경 필요.

---

## 2. Directory Structure Alternatives

### Option A: Flat Structure (모든 파일이 .bkit/ 루트)

```
.bkit/
├── memory.json              # docs/.bkit-memory.json에서 이동
├── pdca-status.json         # docs/.pdca-status.json에서 이동
├── agent-state.json         # 기존 위치 유지
├── session.json             # NEW: 현재 세션 메타데이터
├── hook-log.json            # NEW: 훅 실행 이력 (최근 N건)
├── snapshots/               # docs/.pdca-snapshots/에서 이동
│   └── snapshot-{ts}.json
└── .lock                    # NEW: 동시 접근 제어 (Studio IPC)
```

**Pros:**
- 구현 최소 난이도 -- 모든 파일이 한 디렉토리에 모여 있어 코드 변경 최소
- Studio IPC 구현 간편 -- `fs.watch('.bkit/')` 단일 watcher로 모든 변경 감지
- 파일 수가 적어(5~6개) flat 구조로도 관리 가능
- 기존 `agent-state.json` 경로 변경 없음

**Cons:**
- 파일 수 증가 시 혼잡해질 수 있음 (확장성 제한)
- config와 state, cache의 구분이 파일명에만 의존
- Git tracked/untracked 파일이 같은 디렉토리에 혼재 -- `.gitignore` 관리 복잡

---

### Option B: Category-Based Subdirectories (용도별 분류)

```
.bkit/
├── state/                   # Persistent state (git-tracked)
│   ├── memory.json          # docs/.bkit-memory.json에서 이동
│   └── pdca-status.json     # docs/.pdca-status.json에서 이동
├── runtime/                 # Runtime state (gitignored)
│   ├── agent-state.json     # .bkit/agent-state.json에서 이동
│   ├── session.json         # NEW: 현재 세션 메타데이터
│   └── .lock                # NEW: 동시 접근 제어
├── cache/                   # Temporary cache (gitignored)
│   ├── snapshots/           # docs/.pdca-snapshots/에서 이동
│   │   └── snapshot-{ts}.json
│   └── hook-log.json        # NEW: 훅 실행 이력
└── meta.json                # NEW: .bkit/ 디렉토리 메타 (schema version, migration info)
```

**Pros:**
- 명확한 논리적 분류 (state/runtime/cache)
- Git tracked vs untracked 경계가 디렉토리 레벨로 분리 -- `.gitignore` 깔끔
- 확장성 우수 -- 새 카테고리 추가 시 기존 구조 영향 없음
- Studio IPC: `state/`만 watch하면 중요 상태 변경 감지 가능

**Cons:**
- 디렉토리 depth 증가 -- path가 길어짐 (`.bkit/state/pdca-status.json`)
- `agent-state.json` 경로 변경 필요 (`.bkit/` -> `.bkit/runtime/`)
- 파일 접근마다 상위 디렉토리 존재 확인 필요
- 과도한 구조화 위험 -- 현재 파일 수(5~6개)에 비해 디렉토리가 많음 (YAGNI)

---

### Option C: Domain-Based Subdirectories (도메인별 분류)

```
.bkit/
├── pdca/                    # PDCA 관련 상태
│   ├── status.json          # docs/.pdca-status.json에서 이동
│   └── snapshots/           # docs/.pdca-snapshots/에서 이동
│       └── snapshot-{ts}.json
├── team/                    # Agent Teams 관련 상태
│   ├── agent-state.json     # .bkit/agent-state.json에서 이동
│   └── session.json         # NEW: 팀 세션 이력
├── memory.json              # docs/.bkit-memory.json에서 이동 (cross-domain)
├── hook-log.json            # NEW: 훅 실행 이력
├── meta.json                # NEW: 디렉토리 메타
└── .lock                    # NEW: 동시 접근 제어
```

**Pros:**
- 도메인 전문가가 자기 영역만 관리 가능 (PDCA 개발자 → `pdca/`, 팀 개발자 → `team/`)
- PDCA 관련 파일이 함께 모여 있어 논리적으로 직관적
- Studio에서 도메인별 패널 매핑이 자연스러움

**Cons:**
- `memory.json`은 PDCA/Team 양쪽에서 접근 -- 어디 놓을지 애매 (cross-domain)
- `agent-state.json` 경로 변경 필요
- 도메인 경계가 유동적 -- 새 도메인 추가 시 기존 파일 재분류 리스크
- 도메인 수가 적어(2개: PDCA, Team) 디렉토리 오버헤드

---

### Option D: Hybrid Flat + Namespace (추천안)

```
.bkit/
├── memory.json              # docs/.bkit-memory.json에서 이동 (git-tracked)
├── pdca-status.json         # docs/.pdca-status.json에서 이동 (git-tracked)
├── agent-state.json         # 기존 위치 유지 (gitignored)
├── session.json             # NEW: 세션 메타데이터 (gitignored)
├── snapshots/               # docs/.pdca-snapshots/에서 이동 (gitignored)
│   └── snapshot-{ts}.json
└── .lock                    # NEW: Studio IPC lock (gitignored)
```

**특징:**
- **Flat root**: 핵심 상태 파일 3개는 `.bkit/` 루트에 flat 배치
- **Subdirectory**: 다수 파일 생성되는 snapshots만 하위 디렉토리
- **No unnecessary hierarchy**: 현재 파일 수(5~6개)에 맞는 적절한 깊이
- **기존 agent-state.json 경로 변경 없음**: 이미 `.bkit/agent-state.json`에 위치

**Pros:**
- 구현 난이도 최저 -- `agent-state.json` 경로 변경 불필요
- 파일 수에 적합한 구조 -- 과도한 디렉토리 없음 (YAGNI 준수)
- Studio IPC: `fs.watch('.bkit/')` 단일 watcher, depth 1로 충분
- Git 관리 명확: `.gitignore`에 개별 파일/디렉토리만 추가
- 미래 확장: 파일 수가 10개 이상 되면 그때 카테고리 도입

**Cons:**
- Option B보다 확장성 약간 열등 (하지만 현재 규모에서 문제 없음)
- state/runtime 구분이 파일명이 아닌 `.gitignore`에만 의존

---

## 3. Comparison Matrix

| Criteria | Weight | A: Flat | B: Category | C: Domain | D: Hybrid (추천) |
|----------|-------:|--------:|------------:|----------:|---------:|
| **구현 단순성** | 25% | 9 | 5 | 6 | **10** |
| **Studio IPC 가독성** | 25% | 8 | 7 | 7 | **9** |
| **Migration 복잡도** (낮을수록 좋음) | 20% | 8 | 5 | 5 | **9** |
| **미래 확장성** | 15% | 5 | **9** | 7 | 7 |
| **File Watch 효율** | 10% | **9** | 6 | 7 | **9** |
| **Git 관리 명확성** | 5% | 5 | **9** | 6 | 7 |
| **가중 합계** | 100% | **7.55** | **6.45** | **6.35** | **8.80** |

---

## 4. Recommended: Option D (Hybrid Flat + Namespace)

### 4.1 최종 디렉토리 레이아웃

```
.bkit/
├── memory.json              # [MIGRATE] docs/.bkit-memory.json
│                            #   Git tracked, cross-session persistent
│                            #   Schema: { sessionCount, lastSession, currentPDCA, ... }
│
├── pdca-status.json         # [MIGRATE] docs/.pdca-status.json
│                            #   Git tracked, PDCA lifecycle state
│                            #   Schema v2.0: { version, features, pipeline, history, ... }
│
├── agent-state.json         # [EXISTING] 변경 없음
│                            #   Gitignored, runtime team state
│                            #   Schema v1.0: { enabled, teammates, progress, ... }
│
├── session.json             # [NEW] 현재 세션 메타데이터
│                            #   Gitignored, session-scoped
│                            #   Schema: { sessionId, startedAt, hooks, platform }
│
├── snapshots/               # [MIGRATE] docs/.pdca-snapshots/
│   └── snapshot-{ts}.json   #   Gitignored, compaction backups
│                            #   Retention: last 10 files
│
└── .lock                    # [NEW] Studio IPC lock file
                             #   Gitignored, flock-based
                             #   PID + timestamp for stale lock detection
```

### 4.2 Each File's Schema Additions

#### memory.json (migrated from docs/.bkit-memory.json)
```json
{
  "_schema": "bkit-memory",
  "_version": "1.1",
  "sessionCount": 202,
  "lastSession": { ... },
  "lastReport": { ... },
  "previousPDCA": { ... },
  "currentPDCA": { ... },
  "versionNote": "...",
  "pipelineStatus": { ... }
}
```
- `_schema`, `_version` 필드 추가로 schema evolution 지원
- 기존 데이터 100% 호환

#### pdca-status.json (migrated from docs/.pdca-status.json)
```json
{
  "version": "2.1",
  "lastUpdated": "ISO",
  "activeFeatures": [...],
  ...
}
```
- `version` 2.0 -> 2.1로 minor bump (migration tracking용)
- 기존 구조 변경 없음, version만 업데이트

#### session.json (NEW)
```json
{
  "_schema": "bkit-session",
  "_version": "1.0",
  "sessionId": "uuid",
  "startedAt": "ISO",
  "platform": "claude",
  "level": "Dynamic",
  "pluginVersion": "1.5.8",
  "ccVersion": "2.1.63",
  "hookEvents": {
    "SessionStart": { "lastRun": "ISO", "count": 1 },
    "Stop": { "lastRun": null, "count": 0 }
  },
  "activeFeature": "feature-name",
  "errors": []
}
```
- 현재 `_sessionContext` (in-memory only)의 디스크 영속화 버전
- Studio가 현재 세션 상태를 실시간 확인 가능
- hook 실행 이력을 세션 단위로 추적

#### .lock (NEW)
```json
{
  "pid": 12345,
  "holder": "cli",
  "acquiredAt": "ISO",
  "ttl": 5000
}
```
- Advisory lock for Studio IPC concurrent access
- TTL 기반 stale lock 자동 해제 (5초)
- `holder`: "cli" | "studio" | "hook"

### 4.3 .gitignore 변경

```diff
- # bkit runtime state (agent-state.json)
- .bkit/
+ # bkit state directory
+ # Tracked: .bkit/memory.json, .bkit/pdca-status.json
+ # Ignored: runtime, cache, lock
+ .bkit/agent-state.json
+ .bkit/agent-state.json.tmp
+ .bkit/session.json
+ .bkit/snapshots/
+ .bkit/.lock
```

---

## 5. Migration Plan

### 5.1 Phase 1: Path Registry Module (선행 작업)

**새 파일**: `lib/core/paths.js`

```javascript
const path = require('path');

let _projectDir = null;
function getProjectDir() {
  if (!_projectDir) {
    _projectDir = require('./index').PROJECT_DIR;
  }
  return _projectDir;
}

// State files (new .bkit/ paths)
const BKIT_DIR = () => path.join(getProjectDir(), '.bkit');
const MEMORY_PATH = () => path.join(BKIT_DIR(), 'memory.json');
const PDCA_STATUS_PATH = () => path.join(BKIT_DIR(), 'pdca-status.json');
const AGENT_STATE_PATH = () => path.join(BKIT_DIR(), 'agent-state.json');
const SNAPSHOTS_DIR = () => path.join(BKIT_DIR(), 'snapshots');
const SESSION_PATH = () => path.join(BKIT_DIR(), 'session.json');
const LOCK_PATH = () => path.join(BKIT_DIR(), '.lock');

// Legacy paths (for backward compatibility migration)
const LEGACY_MEMORY_PATH = () => path.join(getProjectDir(), 'docs', '.bkit-memory.json');
const LEGACY_PDCA_STATUS_PATH = () => path.join(getProjectDir(), 'docs', '.pdca-status.json');
const LEGACY_SNAPSHOTS_DIR = () => path.join(getProjectDir(), 'docs', '.pdca-snapshots');

// Immovable config paths
const BKIT_CONFIG_PATH = () => path.join(getProjectDir(), 'bkit.config.json');

module.exports = {
  BKIT_DIR, MEMORY_PATH, PDCA_STATUS_PATH, AGENT_STATE_PATH,
  SNAPSHOTS_DIR, SESSION_PATH, LOCK_PATH,
  LEGACY_MEMORY_PATH, LEGACY_PDCA_STATUS_PATH, LEGACY_SNAPSHOTS_DIR,
  BKIT_CONFIG_PATH,
};
```

### 5.2 Phase 2: Auto-Migration Logic (SessionStart hook)

```javascript
// hooks/session-start.js에 추가
function migrateToNewBkitDir() {
  const paths = require('../lib/core/paths');
  const bkitDir = paths.BKIT_DIR();

  // .bkit/ 디렉토리 생성
  if (!fs.existsSync(bkitDir)) {
    fs.mkdirSync(bkitDir, { recursive: true });
  }

  // memory.json 마이그레이션
  const legacyMemory = paths.LEGACY_MEMORY_PATH();
  const newMemory = paths.MEMORY_PATH();
  if (fs.existsSync(legacyMemory) && !fs.existsSync(newMemory)) {
    const data = JSON.parse(fs.readFileSync(legacyMemory, 'utf8'));
    data._schema = 'bkit-memory';
    data._version = '1.1';
    fs.writeFileSync(newMemory, JSON.stringify(data, null, 2));
    // 구 파일은 삭제하지 않음 (deprecation period)
  }

  // pdca-status.json 마이그레이션
  const legacyStatus = paths.LEGACY_PDCA_STATUS_PATH();
  const newStatus = paths.PDCA_STATUS_PATH();
  if (fs.existsSync(legacyStatus) && !fs.existsSync(newStatus)) {
    const data = JSON.parse(fs.readFileSync(legacyStatus, 'utf8'));
    data.version = '2.1'; // minor bump
    fs.writeFileSync(newStatus, JSON.stringify(data, null, 2));
  }

  // snapshots 마이그레이션
  const legacySnaps = paths.LEGACY_SNAPSHOTS_DIR();
  const newSnaps = paths.SNAPSHOTS_DIR();
  if (fs.existsSync(legacySnaps) && !fs.existsSync(newSnaps)) {
    fs.cpSync(legacySnaps, newSnaps, { recursive: true });
  }
}
```

### 5.3 Phase 3: Path Reference Updates (코드 변경)

#### 필수 변경 파일 목록

| # | File | Current Path | Change Required |
|---|------|-------------|-----------------|
| 1 | `lib/memory-store.js:28` | `path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json')` | `paths.MEMORY_PATH()` 사용 |
| 2 | `lib/pdca/status.js:33` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | `paths.PDCA_STATUS_PATH()` 사용 |
| 3 | `lib/pdca/status.js:705,724` | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` | `paths.MEMORY_PATH()` 사용 |
| 4 | `hooks/session-start.js:334` | `path.join(process.cwd(), 'docs/.pdca-status.json')` | `paths.PDCA_STATUS_PATH()` 사용 |
| 5 | `hooks/session-start.js:609` | Hardcoded string `docs/.bkit-memory.json` | 문자열 업데이트 |
| 6 | `lib/task/tracker.js:199` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | `paths.PDCA_STATUS_PATH()` 사용 |
| 7 | `scripts/context-compaction.js:46` | `path.join(PROJECT_DIR, 'docs', '.pdca-snapshots')` | `paths.SNAPSHOTS_DIR()` 사용 |
| 8 | `lib/team/state-writer.js:72` | `path.join(PROJECT_DIR, '.bkit', 'agent-state.json')` | `paths.AGENT_STATE_PATH()` 사용 (경로 동일, 중앙화만) |
| 9 | `bkit.config.json:34` | `"statusFile": "docs/.pdca-status.json"` | `".bkit/pdca-status.json"` |
| 10 | `.gitignore` | `.bkit/` (전체 ignore) | 선택적 ignore로 변경 |

#### 변경 불필요 파일

- `getPdcaStatusFull()` 호출 16+ 곳: `getPdcaStatusPath()` 중앙 함수를 통하므로 #2만 변경하면 자동 적용
- `readBkitMemory()`/`writeBkitMemory()` 호출 곳: #3만 변경하면 자동 적용
- `readAgentState()` 호출 3곳: `getAgentStatePath()` 중앙 함수를 통하므로 #8만 변경하면 자동 적용

### 5.4 Phase 4: Backward Compatibility (1 릴리스 주기)

```
v1.5.8 (이번 릴리스):
  - SessionStart에서 auto-migration 실행
  - Read: .bkit/ 우선, docs/ fallback
  - Write: .bkit/에만 쓰기
  - docs/ 구 파일 유지 (삭제하지 않음)

v1.6.0 (다음 메이저):
  - docs/ fallback 제거
  - auto-migration에서 구 파일 삭제 로직 추가
  - Legacy path constants 제거
```

### 5.5 Migration Execution Order

```
1. lib/core/paths.js 생성 (Path Registry)
2. .gitignore 변경
3. lib/pdca/status.js:33 수정 (getPdcaStatusPath)     -- 16+ consumers 자동 적용
4. lib/memory-store.js:28 수정 (getMemoryFilePath)     -- 5 consumers 자동 적용
5. lib/pdca/status.js:705,724 수정 (readBkitMemory/writeBkitMemory)
6. hooks/session-start.js:334,609 수정
7. lib/task/tracker.js:199 수정
8. scripts/context-compaction.js:46 수정
9. lib/team/state-writer.js:72 수정 (중앙화만, 경로 동일)
10. bkit.config.json:34 수정
11. hooks/session-start.js에 migrateToNewBkitDir() 추가
12. docs/에서 구 파일 제거 (git rm --cached)
```

---

## 6. Studio IPC Design Considerations

### 6.1 File Watching Pattern

```
Studio watches:
  .bkit/                     # depth 1, recursive: false
    ├── memory.json          # 세션 정보 변경 감지
    ├── pdca-status.json     # PDCA 단계 변경 감지 (가장 빈번)
    ├── agent-state.json     # 팀 상태 실시간 감지 (초당 여러 번 가능)
    └── session.json         # 세션 시작/종료 감지
```

- `fs.watch('.bkit/', { recursive: false })` -- macOS에서 depth 1 watcher 사용
- 변경 빈도: `agent-state.json` (초 단위) > `pdca-status.json` (분 단위) > `memory.json` (세션 단위)
- `snapshots/`는 watch 불필요 (backup 전용)

### 6.2 Concurrent Access Protocol

```
CLI (writer) ──── .bkit/.lock ──── Studio (reader)

1. CLI writes: atomic write (tmp + rename) -- agent-state.json 패턴 재사용
2. Studio reads: retry on ENOENT (tmp rename 중 순간적 부재)
3. .lock: advisory only, 강제 lock 없음
4. 충돌 해결: Last-write-wins (CLI가 authority, Studio는 read-only)
```

### 6.3 Studio Read-Only Guarantee

- Studio는 `.bkit/` 내 파일을 **읽기 전용**으로만 접근
- 쓰기 권한은 CLI(hooks, scripts)만 보유
- `.lock`은 Studio가 "현재 읽는 중" 표시용 (write blocking 아님)

---

## 7. New State Files Justification

### 7.1 session.json -- 채택

**Why needed:**
- 현재 `_sessionContext`는 메모리에만 존재 -- Studio에서 현재 세션 정보 조회 불가
- hook 실행 이력이 어디에도 영속화되지 않음 -- 디버깅 어려움
- 세션 시작 시 `SessionStart` hook에서 생성, `Stop` hook에서 cleanup
- 경량: ~500 bytes

### 7.2 hook-log.json -- 보류 (YAGNI)

**Why deferred:**
- session.json의 `hookEvents` 필드로 기본 추적 가능
- 상세 로그는 `debugLog()`로 이미 처리됨
- 별도 파일로 분리할 정당한 사용 사례가 아직 없음
- v1.6.0에서 필요 시 추가

### 7.3 .lock -- 채택 (경량)

**Why needed:**
- Studio IPC에서 concurrent read 안전성 보장
- 구현 비용 극히 낮음 (JSON 파일 1개, ~50 bytes)
- stale lock은 TTL(5초) + PID 체크로 자동 해제

### 7.4 meta.json -- 보류 (YAGNI)

**Why deferred:**
- 각 상태 파일에 `_schema`, `_version` 필드가 있으면 별도 메타 파일 불필요
- 디렉토리 수준 메타데이터가 필요해지면 그때 추가

---

## 8. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Auto-migration 실패 (파일 권한 등) | Low | HIGH | try/catch + 구 경로 fallback 유지 |
| Git history 혼란 (파일 이동) | Medium | LOW | `git mv` 사용, 커밋 메시지에 명시 |
| 외부 스크립트가 docs/ 경로 참조 | Low | MEDIUM | CHANGELOG에 breaking change 명시 |
| Studio IPC race condition | Medium | LOW | atomic write + advisory lock |
| `.bkit/` 디렉토리 미생성 | Low | HIGH | `mkdirSync({ recursive: true })` 보장 |

---

## 9. Decision Summary

**추천안: Option D (Hybrid Flat + Namespace)**

선정 근거:
1. **YAGNI 원칙 준수** -- 현재 파일 수(5~6개)에 적합한 flat 구조, 불필요한 하위 디렉토리 없음
2. **Migration 비용 최저** -- `agent-state.json` 경로 변경 불필요 (이미 `.bkit/`에 위치)
3. **Studio IPC 최적** -- 단일 디렉토리 watch로 모든 상태 변경 감지
4. **Backward compatibility 자연스러움** -- auto-migration + fallback으로 기존 환경 보호
5. **Path Registry 도입** -- `lib/core/paths.js`로 11+ hardcoded 경로를 1곳에 중앙화
6. **미래 확장 가능** -- 파일 수가 10개 이상 되면 Category-based(Option B) 전환 가능

변경 영향도:
- 코드 변경: **10개 파일** (대부분 1줄 path 변경)
- 신규 파일: **2개** (`lib/core/paths.js`, `.bkit/session.json`)
- 기존 `agent-state.json`: 경로 **변경 없음**
- 16+ PDCA readers: `getPdcaStatusPath()` 1곳 변경으로 **자동 적용**
