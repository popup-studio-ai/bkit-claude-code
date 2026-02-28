# ToBe: 자동 마이그레이션 상세 설계 + 회귀 방지 전략

> **작성일**: 2026-03-01
> **대상 버전**: bkit v1.5.7 → v1.5.8
> **근거 문서**: asis-path-audit.md, asis-pdca-status-consumers.md, asis-other-state-consumers.md, asis-session-start-analysis.md, tobe-path-registry-design.md, tobe-consumer-change-spec.md

---

## 1. 마이그레이션 시나리오 매트릭스

### 1.1 시나리오 정의 (5가지)

| 시나리오 | 구 경로 상태 | 신 경로 상태 | 동작 | 결과 |
|---------|:----------:|:----------:|------|------|
| **S1: 신규 설치** | 없음 | 없음 | `ensureBkitDirs()`만 실행, 마이그레이션 루프는 전부 skip | `.bkit/state/`, `.bkit/runtime/`, `.bkit/snapshots/` 디렉토리 생성. 파일 이동 없음. |
| **S2: v1.5.7→v1.5.8 업그레이드** | 존재 | 없음 | `ensureBkitDirs()` + 4개 파일/디렉토리 `renameSync()` | 구 경로 파일 제거, 신 경로에 파일 존재. `migrated: [x4]` |
| **S3: v1.5.8 재실행** | 없음 | 존재 | `ensureBkitDirs()` (idempotent) + 마이그레이션 전부 skip | 아무 변화 없음. `skipped: [x4]` |
| **S4: 부분 마이그레이션** | 일부만 | 일부만 | 구 경로가 존재하고 신 경로가 없는 파일만 이동 | 존재하는 것만 `migrated`, 나머지 `skipped` |
| **S5: 구/신 모두 존재 (충돌)** | 존재 | 존재 | **신 경로 우선** (레거시 파일 무시, 삭제하지 않음) | `skipped: ["target already exists"]`. 구 파일은 보존 (수동 정리 대상) |

### 1.2 시나리오별 상세 흐름

#### S1: 신규 설치 (처음 bkit 사용)
```
SessionStart hook 실행
├── ensureBkitDirs()
│   ├── mkdir .bkit/ (created)
│   ├── mkdir .bkit/state/ (created)
│   ├── mkdir .bkit/runtime/ (created)
│   └── mkdir .bkit/snapshots/ (created)
├── 마이그레이션 루프
│   ├── pdca-status: docs/.pdca-status.json 없음 → skip
│   ├── memory: docs/.bkit-memory.json 없음 → skip
│   ├── snapshots: docs/.pdca-snapshots/ 없음 → skip
│   └── agent-state: .bkit/agent-state.json 없음 → skip
├── debugLog: "Path migration: 0 migrated, 4 skipped"
└── initPdcaStatusIfNotExists() → .bkit/state/pdca-status.json 생성
```

#### S2: v1.5.7→v1.5.8 업그레이드 (가장 일반적)
```
SessionStart hook 실행
├── ensureBkitDirs()
│   ├── mkdir .bkit/state/ (created)
│   ├── mkdir .bkit/runtime/ (created)
│   └── mkdir .bkit/snapshots/ (created)
│   (note: .bkit/ 자체는 v1.5.7에서 이미 존재)
├── 마이그레이션 루프
│   ├── pdca-status: docs/.pdca-status.json 존재 + .bkit/state/pdca-status.json 없음
│   │   └── renameSync(docs/.pdca-status.json → .bkit/state/pdca-status.json) ✓
│   ├── memory: docs/.bkit-memory.json 존재 + .bkit/state/memory.json 없음
│   │   └── renameSync(docs/.bkit-memory.json → .bkit/state/memory.json) ✓
│   ├── snapshots: docs/.pdca-snapshots/ 존재 + .bkit/snapshots/ 비어있음(*)
│   │   └── renameSync(docs/.pdca-snapshots/ → .bkit/snapshots/) ✓
│   │   (*) ensureBkitDirs()가 빈 .bkit/snapshots/ 생성 → 충돌 처리 필요 (아래 1.3 참조)
│   └── agent-state: .bkit/agent-state.json 존재 + .bkit/runtime/agent-state.json 없음
│       └── renameSync(.bkit/agent-state.json → .bkit/runtime/agent-state.json) ✓
├── debugLog: "Path migration: 4 migrated, 0 skipped"
└── initPdcaStatusIfNotExists() → .bkit/state/pdca-status.json 이미 존재, skip
```

#### S3: v1.5.8 재실행
```
SessionStart hook 실행
├── ensureBkitDirs() → 모든 디렉토리 이미 존재 (no-op)
├── 마이그레이션 루프 → 4개 모두 "legacy not found" skip
├── debugLog: "Path migration: 0 migrated, 4 skipped"
└── initPdcaStatusIfNotExists() → 이미 존재, skip
```

#### S4: 부분 마이그레이션 (이전 세션에서 마이그레이션 도중 중단)
```
SessionStart hook 실행
├── ensureBkitDirs() → 필요한 하위 디렉토리만 생성
├── 마이그레이션 루프
│   ├── pdca-status: 이미 마이그레이션됨 (legacy 없음) → skip
│   ├── memory: docs/.bkit-memory.json 존재 → renameSync → migrated
│   ├── snapshots: docs/.pdca-snapshots/ 없음 → skip
│   └── agent-state: .bkit/agent-state.json 존재 → renameSync → migrated
├── debugLog: "Path migration: 2 migrated, 2 skipped"
└── initPdcaStatusIfNotExists() → 이미 존재, skip
```

#### S5: 구/신 모두 존재 (수동 복구 등으로 인한 충돌)
```
SessionStart hook 실행
├── ensureBkitDirs() → 모든 디렉토리 이미 존재 (no-op)
├── 마이그레이션 루프
│   ├── pdca-status: 양쪽 존재 → skip ("target already exists")
│   ├── memory: 양쪽 존재 → skip ("target already exists")
│   ├── snapshots: 양쪽 존재 → skip ("target already exists")
│   └── agent-state: 양쪽 존재 → skip ("target already exists")
├── debugLog: "Path migration: 0 migrated, 4 skipped (target exists)"
└── initPdcaStatusIfNotExists() → 이미 존재, skip

⚠️ 구 경로 파일은 보존됨 (orphan). 사용자에게 수동 삭제 안내 불필요 (기능 영향 없음).
```

### 1.3 snapshots 디렉토리 충돌 처리

`ensureBkitDirs()`가 `.bkit/snapshots/`를 빈 디렉토리로 먼저 생성하므로, S2 시나리오에서 `docs/.pdca-snapshots/` → `.bkit/snapshots/` 마이그레이션 시 충돌이 발생한다.

**해결 전략**: snapshots 마이그레이션은 `fs.existsSync(target)` 대신 **디렉토리 내 파일 존재 여부**로 판단한다.

```javascript
// snapshots 특수 처리
if (migration.type === 'directory') {
  const targetHasFiles = fs.existsSync(migration.target) &&
    fs.readdirSync(migration.target).length > 0;
  if (targetHasFiles) {
    result.skipped.push(`${migration.name}: target directory not empty`);
    continue;
  }
  // 빈 target 디렉토리가 있으면 삭제 후 rename
  if (fs.existsSync(migration.target)) {
    fs.rmdirSync(migration.target);
  }
}
```

**대안 (더 간단)**: `ensureBkitDirs()`에서 `snapshots/` 디렉토리를 생성하지 않고, 마이그레이션 또는 `context-compaction.js`에서 필요 시 생성하도록 한다. `context-compaction.js:48-49`에 이미 `fs.mkdirSync(snapshotDir, { recursive: true })`가 있으므로 이 방식이 더 안전하다.

**채택 결정**: `ensureBkitDirs()`에서 `snapshots/` 디렉토리를 **제외**한다 (3개 디렉토리만 생성: root, state, runtime). snapshots는 마이그레이션 시 rename으로 이동되거나, context-compaction.js에서 최초 사용 시 생성된다.

---

## 2. 마이그레이션 실행 상세

### 2.1 호출 위치

**파일**: `hooks/session-start.js`
**위치**: 라인 152 (debugLog 완료 후) ~ 라인 153 (initPdcaStatusIfNotExists() 직전)

```javascript
// 라인 148-151: debugLog 초기화 완료
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// >>> 마이그레이션 코드 삽입 (라인 152-153 사이) <<<

// 라인 154: 기존 PDCA 초기화 (마이그레이션 완료 후 실행 필수)
initPdcaStatusIfNotExists();
```

**삽입 이유**:
1. `debugLog`가 초기화된 상태 → 마이그레이션 결과를 로깅 가능
2. 모든 `require()` import 완료 후 → paths.js 모듈 사용 가능
3. `initPdcaStatusIfNotExists()` 호출 전 → 신규 경로에 파일이 있어야 초기화가 정상 동작
4. `contextHierarchy.clearSessionContext()` 전 → 세션 컨텍스트보다 파일 경로가 먼저 확정

### 2.2 마이그레이션 순서

파일 이동 순서는 **의존성 기반**으로 결정:

| 순서 | 파일 | 이유 |
|:----:|------|------|
| 1 | `pdca-status.json` | 가장 많은 consumer (28+). `initPdcaStatusIfNotExists()`가 바로 뒤에 호출되므로 최우선 |
| 2 | `memory.json` (bkit-memory) | 9 consumers. pdca-status 다음으로 중요 |
| 3 | `agent-state.json` | 6+ consumers. `.bkit/` 내부 이동 (같은 볼륨, renameSync 확실) |
| 4 | `snapshots/` (디렉토리) | 0 readers. 순수 백업 용도. 실패해도 기능 영향 없음 |

**근거**: 높은 consumer 수 순서로 먼저 이동하여, 중간에 실패해도 가장 중요한 파일은 이미 이동 완료 상태를 보장한다.

### 2.3 마이그레이션 실행 코드

```javascript
// v1.5.8: Auto-migration from docs/ flat paths to .bkit/ structured paths
try {
  const { STATE_PATHS, LEGACY_PATHS, ensureBkitDirs } = require('../lib/core/paths');
  ensureBkitDirs();

  const migrations = [
    { from: LEGACY_PATHS.pdcaStatus(), to: STATE_PATHS.pdcaStatus(), name: 'pdca-status', type: 'file' },
    { from: LEGACY_PATHS.memory(), to: STATE_PATHS.memory(), name: 'memory', type: 'file' },
    { from: LEGACY_PATHS.agentState(), to: STATE_PATHS.agentState(), name: 'agent-state', type: 'file' },
    { from: LEGACY_PATHS.snapshots(), to: STATE_PATHS.snapshotsDir(), name: 'snapshots', type: 'directory' },
  ];

  const migrated = [];
  const skipped = [];

  for (const m of migrations) {
    try {
      if (!fs.existsSync(m.from)) {
        skipped.push(`${m.name}: legacy not found`);
        continue;
      }

      // 디렉토리 마이그레이션: target이 빈 디렉토리일 수 있음 (ensureBkitDirs 미생성이나 edge case)
      if (m.type === 'directory' && fs.existsSync(m.to)) {
        const targetFiles = fs.readdirSync(m.to);
        if (targetFiles.length > 0) {
          skipped.push(`${m.name}: target not empty`);
          continue;
        }
        // 빈 디렉토리 제거 후 rename
        fs.rmdirSync(m.to);
      } else if (fs.existsSync(m.to)) {
        skipped.push(`${m.name}: target already exists`);
        continue;
      }

      // 이동 시도
      try {
        fs.renameSync(m.from, m.to);
      } catch (renameErr) {
        if (renameErr.code === 'EXDEV') {
          // Cross-device fallback
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
      migrated.push(m.name);
    } catch (fileErr) {
      debugLog('SessionStart', `Migration failed: ${m.name}`, { error: fileErr.message });
      // 개별 파일 실패 시 다음 파일로 계속 진행
    }
  }

  if (migrated.length > 0 || skipped.length > 0) {
    debugLog('SessionStart', 'Path migration completed', {
      migrated,
      skipped,
      total: migrations.length
    });
  }
} catch (e) {
  debugLog('SessionStart', 'Path migration skipped', { error: e.message });
}
```

### 2.4 에러 핸들링 전략

| 에러 유형 | 발생 시점 | 처리 방식 | 영향 |
|----------|----------|----------|------|
| `ENOENT` (파일 없음) | `fs.existsSync()` 검사로 사전 차단 | skip (정상 흐름) | 없음 |
| `EACCES` (권한 오류) | `renameSync()` / `copyFileSync()` | catch → debugLog → 다음 파일 계속 | 해당 파일만 구 경로에 남음 |
| `EXDEV` (크로스 디바이스) | `renameSync()` | copy + delete fallback | 정상 이동 |
| `ENOSPC` (디스크 부족) | `copyFileSync()` | catch → debugLog → 다음 파일 계속 | 해당 파일만 구 경로에 남음 |
| `EPERM` (OS 레벨 권한) | `renameSync()` / `unlinkSync()` | catch → debugLog → 다음 파일 계속 | 해당 파일만 구 경로에 남음 |
| `require()` 실패 | paths.js 로드 시 | 외부 try-catch → "migration skipped" 로그 | 전체 마이그레이션 스킵, 구 경로 유지 |

**핵심 원칙**:
- **롤백하지 않는다** — 부분 마이그레이션 상태는 다음 세션의 S4 시나리오로 자연 복구된다.
- **하나 실패해도 나머지 계속** — 파일별 독립 try-catch로 격리한다.
- **구 경로 파일은 마이그레이션 성공 시에만 삭제** — `renameSync()`는 원자적, copy fallback은 copy 완료 후 delete.

### 2.5 로깅 (debugLog)

| 로그 메시지 | 조건 | 내용 |
|-----------|------|------|
| `"Path migration completed"` | 마이그레이션 루프 완료 시 | `{ migrated: [...], skipped: [...], total: 4 }` |
| `"Migration failed: {name}"` | 개별 파일 이동 실패 시 | `{ error: "EACCES: permission denied..." }` |
| `"Path migration skipped"` | paths.js require 자체 실패 시 | `{ error: "Cannot find module..." }` |

**로그 레벨**: `debugLog('SessionStart', ...)` — bkit 디버그 모드에서만 표시. 사용자에게 마이그레이션은 투명(transparent)하게 동작.

### 2.6 성능 분석

| 작업 | 소요 시간 (예상) | 비고 |
|------|:--------------:|------|
| `ensureBkitDirs()` — 3개 `mkdirSync` | < 1ms | `recursive: true`, 이미 존재 시 no-op |
| `fs.existsSync()` x 8 (from + to x 4) | < 1ms | 파일 시스템 stat 호출 |
| `fs.renameSync()` x 4 (최대) | < 1ms | 같은 볼륨 내 inode 이동 (데이터 복사 없음) |
| **총 마이그레이션 시간** | **< 3ms** | SessionStart 지연 무시 가능 |

- **S1/S3 시나리오** (신규/재실행): `existsSync()` 체크만 → < 1ms
- **S2 시나리오** (업그레이드): 최대 4개 `renameSync()` → < 3ms (같은 볼륨)
- **EXDEV fallback**: `copyFileSync()` 사용 시 pdca-status.json (수 KB) 복사 → < 5ms

**결론**: 동기 I/O이지만 SessionStart 지연에 미치는 영향은 무시 가능 (< 5ms). 비동기 변환 불필요.

---

## 3. AsIs 삭제 전략

### 3.1 마이그레이션 시 즉시 삭제 (Rename 방식)

| 파일 | 삭제 시점 | 삭제 방식 | 비고 |
|------|----------|----------|------|
| `docs/.pdca-status.json` | 마이그레이션 시 즉시 | `fs.renameSync()` (원자적 이동 = 소스 자동 삭제) | rename은 move이므로 별도 delete 불필요 |
| `docs/.bkit-memory.json` | 마이그레이션 시 즉시 | `fs.renameSync()` | 동일 |
| `docs/.pdca-snapshots/` | 마이그레이션 시 즉시 | `fs.renameSync()` (디렉토리 이동) | 동일 |
| `.bkit/agent-state.json` | 마이그레이션 시 즉시 | `fs.renameSync()` | `.bkit/` 내부 이동 |

**핵심**: `fs.renameSync(src, dest)`는 소스 파일을 삭제하면서 대상에 생성하는 원자적 연산이다. 별도의 삭제 단계가 필요 없다.

### 3.2 EXDEV Fallback 시 삭제

크로스 디바이스 시나리오에서는 copy 후 명시적 삭제:
```javascript
fs.copyFileSync(src, dest);  // 또는 fs.cpSync(src, dest, { recursive: true })
fs.rmSync(src, { recursive: true, force: true });  // 복사 완료 후 삭제
```

삭제 실패 시: `debugLog`에 기록하고 구 파일을 orphan으로 방치. 기능 영향 없음 (신 경로가 우선).

### 3.3 삭제 실패 시 orphan 파일 처리

| 상황 | 결과 | 조치 |
|------|------|------|
| rename 성공 | 구 파일 자동 제거 | 없음 |
| copy 성공 + delete 실패 | 구 파일 orphan으로 남음 | S5 시나리오로 다음 세션에서 skip 처리. 기능 영향 없음. |
| copy 실패 | 구 파일 유지, 신 파일 없음 | S2 시나리오로 다음 세션에서 재시도 |

**orphan 파일 위험성**: 없음. 코드가 신 경로(`STATE_PATHS`)를 사용하므로 구 경로의 orphan 파일은 참조되지 않는다. 디스크 공간 낭비만 발생 (수 KB 수준).

### 3.4 docs/ 디렉토리 상태

마이그레이션 후 `docs/` 디렉토리에 dotfile이 남지 않는지 확인:

| 파일 | 마이그레이션 전 | 마이그레이션 후 | docs/ 잔여 |
|------|:------------:|:------------:|:---------:|
| `docs/.pdca-status.json` | 존재 (git tracked) | 삭제됨 | 없음 |
| `docs/.bkit-memory.json` | 존재 (git tracked) | 삭제됨 | 없음 |
| `docs/.pdca-snapshots/` | 존재 (gitignored) | 삭제됨 | 없음 |

**결론**: 마이그레이션 완료 후 `docs/` 하위에 bkit dotfile이 남지 않는다.

### 3.5 git에서 docs/ dotfile 삭제

`docs/.pdca-status.json`과 `docs/.bkit-memory.json`은 현재 **git tracked** 상태이다 (staged changes로 표시).

**git 삭제 전략**:

1. **v1.5.8 릴리스 커밋에서 `git rm` 실행**:
   ```bash
   git rm docs/.pdca-status.json
   git rm docs/.bkit-memory.json
   ```

2. **`.gitignore` 업데이트** (이미 `.bkit/`이 gitignore되어 있으므로 추가 변경 불필요):
   ```
   # 기존 (변경 없음)
   .bkit/
   docs/.pdca-snapshots/
   ```

   `.bkit/state/`, `.bkit/runtime/`, `.bkit/snapshots/`는 `.bkit/` blanket rule에 의해 자동으로 gitignore된다.

3. **docs/.pdca-snapshots/ 관련**: 이미 `.gitignore`에 `docs/.pdca-snapshots/`가 등록되어 있으므로 `git rm` 불필요. 마이그레이션 후 이 gitignore 규칙은 dead rule이 되지만, 하위 호환성을 위해 v1.6.0까지 유지한다.

4. **커밋 순서**:
   ```
   # Phase 3 구현 완료 후
   git add lib/core/paths.js                    # 신규 모듈
   git add lib/pdca/status.js                   # 경로 변경
   git add lib/memory-store.js                  # 경로 변경
   git add lib/task/tracker.js                  # 경로 변경
   git add lib/team/state-writer.js             # 경로 변경
   git add scripts/context-compaction.js        # 경로 변경
   git add hooks/session-start.js               # 마이그레이션 코드 + 경로 변경
   git add lib/common.js                        # bridge 추가
   git add bkit.config.json                     # 설정값 + 버전
   git add .claude-plugin/plugin.json           # 버전
   git rm docs/.pdca-status.json                # 구 경로 파일 제거
   git rm docs/.bkit-memory.json                # 구 경로 파일 제거
   git commit -m "feat: migrate state files from docs/ to .bkit/ (v1.5.8)"
   ```

---

## 4. 회귀 방지 전략

### 4.1 기존 테스트 관련

**현황**: bkit 프로젝트에 자동 테스트 파일이 없다 (`test/`, `tests/`, `test-scripts/`는 `.gitignore`에 등록되어 있으며, `*.test.js` 파일도 존재하지 않음).

**분석**: 파일 시스템 경로를 직접 참조하는 기존 TC가 없으므로, 경로 변경에 의한 기존 TC 깨짐 위험은 **0**이다.

**권장**: v1.5.8 릴리스 시 포괄 테스트에서 경로 관련 TC를 추가할 것 (아래 4.2, 4.3 참조).

### 4.2 수동 검증 시나리오 (7개)

마이그레이션 전/후 동일 동작을 검증하는 수동 시나리오:

#### VS-1: SessionStart → PDCA status 읽기 → 올바른 phase 표시

| 항목 | 내용 |
|------|------|
| **전제조건** | v1.5.8 마이그레이션 완료 상태 |
| **실행** | Claude Code 세션 시작 |
| **검증 포인트** | 1) `initPdcaStatusIfNotExists()` 에러 없이 실행 2) `getPdcaStatusFull()` 정상 반환 3) `detectPdcaPhase()` 올바른 phase 반환 4) 온보딩 메시지에 현재 feature 표시 |
| **예상 결과** | 기존과 동일한 세션 시작 경험. 마이그레이션 관련 사용자 메시지 없음 |
| **관련 Consumer** | R1, R6, R7, R8, E1, W1 |

#### VS-2: /pdca status → 현재 feature 정보 표시

| 항목 | 내용 |
|------|------|
| **전제조건** | 활성 PDCA feature 존재 |
| **실행** | `/pdca status` 명령 실행 |
| **검증 포인트** | 1) currentFeature 정보 표시 2) pipeline phase 표시 3) history 내역 표시 |
| **예상 결과** | v1.5.7과 동일한 상태 정보 출력 |
| **관련 Consumer** | R1, R3, R4 |

#### VS-3: /pdca plan → 새 plan 생성 → pdca-status.json 업데이트

| 항목 | 내용 |
|------|------|
| **전제조건** | 새 feature 이름 준비 |
| **실행** | `/pdca plan <feature-name>` 실행 |
| **검증 포인트** | 1) `.bkit/state/pdca-status.json` 파일에 feature 추가 확인 2) `docs/.pdca-status.json`에는 파일 생성되지 않음 확인 3) plan 문서가 `docs/01-plan/` 에 정상 생성 |
| **예상 결과** | 신 경로에 상태 저장, 구 경로에는 흔적 없음 |
| **관련 Consumer** | W3, W5, W6 |

#### VS-4: /pdca analyze → gap-detector 실행 → 분석 결과 저장

| 항목 | 내용 |
|------|------|
| **전제조건** | plan phase 완료된 feature |
| **실행** | `/pdca analyze <feature-name>` 또는 gap-detector 에이전트 실행 |
| **검증 포인트** | 1) gap-detector-stop.js의 `getPdcaStatusFull()` 정상 작동 2) `updatePdcaStatus()` 호출 시 `.bkit/state/pdca-status.json` 업데이트 확인 3) 분석 문서가 `docs/03-analysis/` 에 정상 생성 |
| **예상 결과** | 분석 결과가 신 경로에 저장, PDCA 상태 정상 업데이트 |
| **관련 Consumer** | R12, W15 |

#### VS-5: CTO Team → agent-state.json 업데이트 → 상태 표시

| 항목 | 내용 |
|------|------|
| **전제조건** | `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 환경변수 |
| **실행** | CTO Team 세션 시작 (에이전트 spawn) |
| **검증 포인트** | 1) `initAgentState()` 시 `.bkit/runtime/agent-state.json` 생성 확인 2) `addTeammate()` 호출 시 에이전트 등록 확인 3) `.bkit/agent-state.json` (구 경로)에는 파일 생성되지 않음 |
| **예상 결과** | agent-state가 `.bkit/runtime/` 하위에 정상 관리 |
| **관련 Consumer** | state-writer 전체 (W1~W7) |

#### VS-6: context-compaction → 스냅샷 저장 → 복구

| 항목 | 내용 |
|------|------|
| **전제조건** | 긴 세션으로 PreCompact 이벤트 트리거 |
| **실행** | Claude Code 컨텍스트 컴팩션 자동 실행 |
| **검증 포인트** | 1) `.bkit/snapshots/` 디렉토리에 스냅샷 파일 생성 확인 2) `docs/.pdca-snapshots/`에는 파일 생성되지 않음 확인 3) 10개 초과 시 오래된 스냅샷 정상 정리 |
| **예상 결과** | 스냅샷이 신 경로에 저장 |
| **관련 Consumer** | context-compaction.js 전체 |

#### VS-7: readBkitMemory/writeBkitMemory → 메모리 읽기/쓰기

| 항목 | 내용 |
|------|------|
| **전제조건** | Phase 완료 시점 (Stop hook 트리거) |
| **실행** | phase5-design-stop.js 또는 phase6-ui-stop.js 실행 |
| **검증 포인트** | 1) `readBkitMemory()` 시 `.bkit/state/memory.json` 읽기 확인 2) `writeBkitMemory()` 시 `.bkit/state/memory.json` 쓰기 확인 3) `docs/.bkit-memory.json`에는 접근하지 않음 확인 |
| **예상 결과** | 메모리 읽기/쓰기가 신 경로에서 정상 동작 |
| **관련 Consumer** | status.js readBkitMemory/writeBkitMemory + memory-store.js |

### 4.3 자동 검증 (CLI 명령)

마이그레이션 및 코드 변경 완료 후 다음 자동 검증을 실행:

#### AV-1: 하드코딩 경로 잔존 검사

```bash
# pdca-status 구 경로 참조 (0개여야 함)
grep -rn "docs/\.pdca-status" --include="*.js" lib/ hooks/ scripts/
# 기대 결과: 0 matches

# bkit-memory 구 경로 참조 (0개여야 함)
grep -rn "docs/.*\.bkit-memory" --include="*.js" lib/ hooks/ scripts/
# 기대 결과: 0 matches

# pdca-snapshots 구 경로 참조 (0개여야 함)
grep -rn "docs/.*\.pdca-snapshots" --include="*.js" lib/ hooks/ scripts/
# 기대 결과: 0 matches

# agent-state 구 경로 (runtime 하위가 아닌 직접 참조, 0개여야 함)
grep -rn "\.bkit/agent-state" --include="*.js" lib/ hooks/ scripts/ | grep -v "runtime/"
# 기대 결과: LEGACY_PATHS 정의만 (paths.js 내 1곳)
```

#### AV-2: 신 경로 파일 존재 검사

```bash
# 마이그레이션 완료 후
ls -la .bkit/state/pdca-status.json    # 존재해야 함
ls -la .bkit/state/memory.json         # 존재해야 함 (또는 신규 설치 시 initPdcaStatusIfNotExists 이후)
ls -d .bkit/runtime/                    # 디렉토리 존재해야 함
ls -d .bkit/snapshots/ 2>/dev/null     # 존재할 수도, 안 할 수도 (사용 전까지 미생성 가능)
```

#### AV-3: 구 경로 파일 부재 검사

```bash
# 마이그레이션 완료 후 (docs/ 하위 dotfile 없음)
ls docs/.pdca-status.json 2>/dev/null   # "No such file" 기대
ls docs/.bkit-memory.json 2>/dev/null   # "No such file" 기대
ls -d docs/.pdca-snapshots 2>/dev/null  # "No such file" 기대
ls .bkit/agent-state.json 2>/dev/null   # "No such file" 기대
```

#### AV-4: git 상태 검사

```bash
# git에서 docs dotfile 추적 중단 확인
git ls-files docs/.pdca-status.json    # 빈 출력 기대
git ls-files docs/.bkit-memory.json    # 빈 출력 기대

# .bkit/ 하위가 git에 추적되지 않음 확인
git ls-files .bkit/                    # 빈 출력 기대
```

#### AV-5: Path Registry 무결성 검사

```bash
# node -e 로 paths.js 모듈 로드 테스트
cd /path/to/bkit-claude-code
node -e "
  const paths = require('./lib/core/paths');
  console.log('STATE_PATHS.pdcaStatus():', paths.STATE_PATHS.pdcaStatus());
  console.log('STATE_PATHS.memory():', paths.STATE_PATHS.memory());
  console.log('STATE_PATHS.agentState():', paths.STATE_PATHS.agentState());
  console.log('STATE_PATHS.snapshotsDir():', paths.STATE_PATHS.snapshotsDir());
  console.log('LEGACY_PATHS.pdcaStatus():', paths.LEGACY_PATHS.pdcaStatus());

  // 경로가 예상 패턴과 일치하는지 확인
  const assert = require('assert');
  assert(paths.STATE_PATHS.pdcaStatus().includes('.bkit/state/pdca-status.json'));
  assert(paths.STATE_PATHS.memory().includes('.bkit/state/memory.json'));
  assert(paths.STATE_PATHS.agentState().includes('.bkit/runtime/agent-state.json'));
  assert(paths.LEGACY_PATHS.pdcaStatus().includes('docs/.pdca-status.json'));
  console.log('All assertions passed');
"
```

#### AV-6: common.js bridge 검사

```bash
node -e "
  const common = require('./lib/common');
  console.log('STATE_PATHS:', typeof common.STATE_PATHS);
  console.log('LEGACY_PATHS:', typeof common.LEGACY_PATHS);
  console.log('CONFIG_PATHS:', typeof common.CONFIG_PATHS);
  console.log('ensureBkitDirs:', typeof common.ensureBkitDirs);

  // 기존 export 보존 확인
  console.log('getPdcaStatusPath:', typeof common.getPdcaStatusPath);
  console.log('getMemoryPath:', typeof common.getMemoryPath);
  console.log('getAgentStatePath:', typeof common.getAgentStatePath);
  console.log('All bridge exports verified');
"
```

### 4.4 SKILL.md 경로 문자열 업데이트

SKILL.md 파일들에서 `.bkit-memory.json`과 `.pdca-status.json`을 파일명으로 참조하는 곳이 15곳 있다:

| 파일 | 참조 수 | 현재 참조 | 변경 필요 여부 |
|------|:------:|----------|:------------:|
| `skills/pdca/SKILL.md` | 7 | `.bkit-memory.json`, `.pdca-status.json` | **YES** (파일명 + 설명 업데이트) |
| `skills/starter/SKILL.md` | 1 | `.bkit-memory.json` | **YES** |
| `skills/plan-plus/SKILL.md` | 2 | `.bkit-memory.json` | **YES** |
| `skills/enterprise/SKILL.md` | 1 | `.bkit-memory.json` | **YES** |
| `skills/dynamic/SKILL.md` | 1 | `.bkit-memory.json` | **YES** |

**변경 내용**:
- `.bkit-memory.json` → `memory.json` (또는 `.bkit/state/memory.json`)
- `.pdca-status.json` → `pdca-status.json` (또는 `.bkit/state/pdca-status.json`)

**영향**: SKILL.md는 Claude에게 제공되는 프롬프트이며, 실제 코드 동작은 `readBkitMemory()`/`writeBkitMemory()` API를 통해 이루어진다. 파일명이 틀려도 API 동작에는 영향 없으나, Claude가 직접 파일 경로로 접근 시도할 때 혼란을 줄 수 있으므로 업데이트 권장.

**우선순위**: LOW (기능 영향 없음, 릴리스 후 별도 커밋으로 업데이트 가능)

---

## 5. 롤백 계획

### 5.1 롤백이 필요한 상황

| 상황 | 심각도 | 발생 가능성 |
|------|:------:|:----------:|
| 마이그레이션 후 PDCA 상태 읽기 실패 | HIGH | 매우 낮음 |
| 특정 consumer에서 구 경로 참조 누락 발견 | HIGH | 낮음 |
| agent-state.json 경로 변경으로 CTO Team 오작동 | MEDIUM | 매우 낮음 |
| bkit.config.json statusFile 참조 문제 | LOW | 없음 (dead config) |

### 5.2 롤백 방법 A: 코드 롤백 (권장)

v1.5.8 배포 후 문제 발생 시 **git revert**로 코드를 v1.5.7 상태로 되돌린다:

```bash
# 1. 마이그레이션된 파일을 원래 위치로 복구
cp .bkit/state/pdca-status.json docs/.pdca-status.json 2>/dev/null
cp .bkit/state/memory.json docs/.bkit-memory.json 2>/dev/null
cp .bkit/runtime/agent-state.json .bkit/agent-state.json 2>/dev/null
# snapshots는 gitignored + reader 없으므로 복구 불필요

# 2. 코드를 v1.5.7로 revert
git revert <v1.5.8-commit-hash>

# 3. docs/ dotfile을 git에 다시 추가
git add docs/.pdca-status.json docs/.bkit-memory.json
git commit -m "revert: rollback to v1.5.7 path structure"
```

### 5.3 롤백 방법 B: 수동 파일 복구

코드 revert 없이 파일만 원래 위치로 복구:

```bash
# 파일 복사 (이동이 아닌 복사로 안전하게)
cp .bkit/state/pdca-status.json docs/.pdca-status.json
cp .bkit/state/memory.json docs/.bkit-memory.json
cp .bkit/runtime/agent-state.json .bkit/agent-state.json
```

이후 v1.5.7 코드가 구 경로를 정상 참조한다.

### 5.4 롤백 자동화 스크립트

`scripts/rollback-paths.js` (배포에는 포함하지 않음, 긴급 시 수동 실행):

```javascript
#!/usr/bin/env node
/**
 * 긴급 롤백: v1.5.8 경로 → v1.5.7 경로로 파일 복구
 * 사용: node scripts/rollback-paths.js
 */
const fs = require('fs');
const path = require('path');
const PROJECT_DIR = process.cwd();

const rollbacks = [
  { from: '.bkit/state/pdca-status.json', to: 'docs/.pdca-status.json' },
  { from: '.bkit/state/memory.json', to: 'docs/.bkit-memory.json' },
  { from: '.bkit/runtime/agent-state.json', to: '.bkit/agent-state.json' },
];

for (const r of rollbacks) {
  const src = path.join(PROJECT_DIR, r.from);
  const dest = path.join(PROJECT_DIR, r.to);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Restored: ${r.from} → ${r.to}`);
  } else {
    console.log(`Skipped: ${r.from} (not found)`);
  }
}
console.log('Rollback complete. Please revert code to v1.5.7.');
```

### 5.5 롤백 판단 기준

| 기준 | 롤백 결정 | 대안 |
|------|:---------:|------|
| 전체 PDCA 기능 동작 불가 | YES → 방법 A | - |
| 특정 consumer 1-2개에서 경로 오류 | NO | 핫픽스로 해당 consumer 수정 |
| SKILL.md 경로 불일치 | NO | SKILL.md만 업데이트 |
| CTO Team agent-state 오류 | YES → 방법 B (파일만) | agent-state.json만 복구 |
| 성능 저하 (SessionStart 지연) | NO | 마이그레이션 코드 최적화 |

---

## 6. 체크리스트 요약

### 6.1 구현 전 체크리스트

- [ ] lib/core/paths.js 신규 생성
- [ ] ensureBkitDirs()에서 snapshots/ 디렉토리 제외 확인
- [ ] 순환 참조 테스트 (paths.js → platform.js 직접 import)

### 6.2 마이그레이션 구현 체크리스트

- [ ] session-start.js 라인 152-153에 마이그레이션 코드 삽입
- [ ] 마이그레이션 순서: pdca-status → memory → agent-state → snapshots
- [ ] 개별 파일 실패 시 나머지 계속 진행 확인
- [ ] EXDEV fallback (copy + delete) 구현
- [ ] snapshots 빈 디렉토리 충돌 처리 구현
- [ ] debugLog 로깅 추가

### 6.3 Consumer 변경 체크리스트

- [ ] lib/pdca/status.js:33 — getPdcaStatusPath() → STATE_PATHS.pdcaStatus()
- [ ] lib/pdca/status.js:705 — readBkitMemory() 하드코딩 → STATE_PATHS.memory()
- [ ] lib/pdca/status.js:724 — writeBkitMemory() 하드코딩 → STATE_PATHS.memory()
- [ ] lib/memory-store.js:28 — getMemoryFilePath() → STATE_PATHS.memory()
- [ ] lib/task/tracker.js:199 — findPdcaStatus() → getPdcaStatusPath()
- [ ] lib/team/state-writer.js:72 — getAgentStatePath() → STATE_PATHS.agentState()
- [ ] scripts/context-compaction.js:46 — snapshotDir → STATE_PATHS.snapshotsDir()
- [ ] hooks/session-start.js:334 — detectPdcaPhase() → getPdcaStatusFull() 사용
- [ ] hooks/session-start.js:213 — importResolver 경로 → CONFIG_PATHS.bkitConfig()
- [ ] hooks/session-start.js:609 — 문자열 경로 → 신 경로 업데이트

### 6.4 설정/버전 체크리스트

- [ ] bkit.config.json version → 1.5.8
- [ ] bkit.config.json statusFile → .bkit/state/pdca-status.json
- [ ] .claude-plugin/plugin.json version → 1.5.8
- [ ] lib/common.js bridge에 paths export 5개 추가

### 6.5 Git 체크리스트

- [ ] git rm docs/.pdca-status.json
- [ ] git rm docs/.bkit-memory.json
- [ ] .gitignore에 docs/.pdca-snapshots/ 규칙 유지 (하위 호환)

### 6.6 검증 체크리스트

- [ ] AV-1: 하드코딩 경로 잔존 검사 (grep → 0 matches)
- [ ] AV-2: 신 경로 파일 존재 검사
- [ ] AV-3: 구 경로 파일 부재 검사
- [ ] AV-4: git 상태 검사
- [ ] AV-5: Path Registry 무결성 검사 (node -e)
- [ ] AV-6: common.js bridge 검사
- [ ] VS-1 ~ VS-7: 수동 검증 시나리오 7개 실행

---

## 7. SKILL.md 경로 변경 목록 (부록)

릴리스 후 별도 커밋으로 업데이트 가능한 SKILL.md 변경 사항:

| # | 파일:라인 | AsIs | ToBe |
|---|-----------|------|------|
| 1 | `skills/starter/SKILL.md:54` | `Initialize .bkit-memory.json` | `Initialize memory.json (.bkit/state/)` |
| 2 | `skills/plan-plus/SKILL.md:97` | `Check .bkit-memory.json` | `Check memory.json (.bkit/state/)` |
| 3 | `skills/plan-plus/SKILL.md:186` | `Update .bkit-memory.json: phase = "plan"` | `Update memory.json: phase = "plan"` |
| 4 | `skills/enterprise/SKILL.md:62` | `Initialize .bkit-memory.json` | `Initialize memory.json (.bkit/state/)` |
| 5 | `skills/dynamic/SKILL.md:55` | `Initialize .bkit-memory.json` | `Initialize memory.json (.bkit/state/)` |
| 6 | `skills/pdca/SKILL.md:82` | `Update .bkit-memory.json: phase = "plan"` | `Update memory.json: phase = "plan"` |
| 7 | `skills/pdca/SKILL.md:96` | `Update .bkit-memory.json: phase = "design"` | `Update memory.json: phase = "design"` |
| 8 | `skills/pdca/SKILL.md:106` | `Update .bkit-memory.json: phase = "do"` | `Update memory.json: phase = "do"` |
| 9 | `skills/pdca/SKILL.md:120` | `Update .bkit-memory.json: phase = "check"` | `Update memory.json: phase = "check"` |
| 10 | `skills/pdca/SKILL.md:143` | `Update .bkit-memory.json: phase = "completed"` | `Update memory.json: phase = "completed"` |
| 11 | `skills/pdca/SKILL.md:210` | `Update .pdca-status.json: phase = "archived"` | `Update pdca-status.json: phase = "archived"` |
| 12 | `skills/pdca/SKILL.md:229` | ``.pdca-status.json`` | `pdca-status.json (.bkit/state/)` |
| 13 | `skills/pdca/SKILL.md:260` | ``.pdca-status.json`` | `pdca-status.json (.bkit/state/)` |
| 14 | `skills/pdca/SKILL.md:262` | ``.pdca-status.json`` | `pdca-status.json (.bkit/state/)` |
| 15 | `skills/pdca/SKILL.md:304` | `Read .bkit-memory.json` | `Read memory.json (.bkit/state/)` |

---

## 8. 위험 요약 및 완화

| 위험 | 심각도 | 발생 가능성 | 완화 전략 |
|------|:------:|:----------:|----------|
| 마이그레이션 중 파일 손실 | HIGH | 매우 낮음 | `renameSync()`는 원자적. copy fallback은 복사 완료 후에만 삭제. 부분 실패 시 다음 세션에서 재시도. |
| Consumer에서 구 경로 참조 누락 | HIGH | 낮음 | AV-1 자동 검증 (grep)으로 0 matches 확인. Consumer 전수 분석 완료 (28 + 9 + 6 = 43 consumers). |
| session-start.js 마이그레이션 코드 오류 | MEDIUM | 낮음 | 외부 try-catch로 감싸서 실패 시 "migration skipped" 로그만. 기존 기능에 영향 없음. |
| SessionStart 성능 저하 | LOW | 매우 낮음 | 동기 I/O < 5ms. S3 시나리오 (재실행) < 1ms. |
| SKILL.md 경로 불일치 | LOW | 높음 (의도적 지연) | 기능 영향 없음. API 경유이므로 SKILL.md 경로 문자열은 가이드 용도. 릴리스 후 업데이트. |
| git에서 docs/ dotfile 삭제 누락 | LOW | 낮음 | 6.5 Git 체크리스트로 검증 |
