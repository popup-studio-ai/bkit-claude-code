# AsIs: bkit-memory / snapshots / agent-state 소비자 분석

> **분석 기준**: bkit v1.5.7 코드베이스 (2026-03-01)
> **분석 범위**: `docs/.bkit-memory.json`, `docs/.pdca-snapshots/`, `.bkit/agent-state.json`의 모든 소비자 전수 조사

---

## 1. bkit-memory.json 분석

### 요약
- **파일 경로**: `docs/.bkit-memory.json`
- **총 consumer 수**: 7개 (경로 정의 2곳 + 직접 호출 5곳)
- **경로 정의 위치**: 2곳 (독립적으로 중복 구성)
  - `lib/memory-store.js:28` — `getMemoryFilePath()`
  - `lib/pdca/status.js:705,724` — `readBkitMemory()`, `writeBkitMemory()` 내부
- **Re-export 체인**: `status.js` → `pdca/index.js:62-63` → `common.js:137-138`

### 경로 구성 상세

**경로 1: `lib/memory-store.js:26-28` — `getMemoryFilePath()`**
```javascript
function getMemoryFilePath() {
  const common = getCommon();
  return path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json');
}
```
- 이 함수를 통해 `loadMemory()` (line 44), `saveMemory()` (line 64), `getMemoryPath()` (line 167) 가 경유

**경로 2: `lib/pdca/status.js:705` — `readBkitMemory()` 내부 하드코딩**
```javascript
function readBkitMemory() {
  const { PROJECT_DIR, safeJsonParse } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  // ...
}
```

**경로 3: `lib/pdca/status.js:724` — `writeBkitMemory()` 내부 하드코딩**
```javascript
function writeBkitMemory(memory) {
  const { PROJECT_DIR } = getCore();
  const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');
  // ...
}
```

**경로 4: `hooks/session-start.js:609` — 문자열 리터럴 (docs/guidance 용)**
```javascript
additionalContext += `- bkit memory (\`docs/.bkit-memory.json\`) and CC auto-memory are separate systems with no collision\n`;
```

### Consumer 목록

| # | 파일:라인 | 함수명 | 접근유형 | 경로구성 | 코드 스니펫 |
|---|-----------|--------|----------|----------|-------------|
| 1 | `lib/memory-store.js:28` | `getMemoryFilePath()` | 경로 정의 | 함수 정의 | `path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json')` |
| 2 | `lib/memory-store.js:44` | `loadMemory()` | **read** | `getMemoryFilePath()` 경유 | `fs.readFileSync(MEMORY_FILE, 'utf8')` |
| 3 | `lib/memory-store.js:64` | `saveMemory()` | **write** | `getMemoryFilePath()` 경유 | `fs.writeFileSync(MEMORY_FILE, ...)` |
| 4 | `lib/pdca/status.js:703-714` | `readBkitMemory()` | **read** | 하드코딩 | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` + `fs.readFileSync` |
| 5 | `lib/pdca/status.js:722-731` | `writeBkitMemory()` | **write** | 하드코딩 | `path.join(PROJECT_DIR, 'docs', '.bkit-memory.json')` + `fs.writeFileSync` |
| 6 | `hooks/session-start.js:609` | (인라인) | **문자열 참조** | 문자열 리터럴 | `` `docs/.bkit-memory.json` `` (사용자 안내 컨텍스트) |
| 7 | `scripts/phase5-design-stop.js:79,91` | via `lib.readBkitMemory()`/`lib.writeBkitMemory()` | **read+write** | 함수 경유 | `lib.readBkitMemory()` → `lib.writeBkitMemory(memory)` |
| 8 | `scripts/phase6-ui-stop.js:91,102` | via `lib.readBkitMemory()`/`lib.writeBkitMemory()` | **read+write** | 함수 경유 | `lib.readBkitMemory()` → `lib.writeBkitMemory(memory)` |
| 9 | `scripts/phase9-deploy-stop.js:88,113` | via `lib.readBkitMemory()`/`lib.writeBkitMemory()` | **read+write** | 함수 경유 | `lib.readBkitMemory()` → `lib.writeBkitMemory(memory)` |

### Re-export 체인 (경로 접근 없음, API 노출만)

| # | 파일:라인 | 역할 | 코드 |
|---|-----------|------|------|
| R1 | `lib/pdca/status.js:759-760` | 원본 export | `readBkitMemory, writeBkitMemory` |
| R2 | `lib/pdca/index.js:62-63` | 중계 re-export | `readBkitMemory: status.readBkitMemory` |
| R3 | `lib/common.js:137-138` | 최종 bridge export | `readBkitMemory: pdca.readBkitMemory` |

### 접근 유형 분류
- **경로 정의**: 2곳 (memory-store.js, pdca/status.js — **독립 중복**)
- **Read**: memory-store.js `loadMemory()`, status.js `readBkitMemory()`, phase5/6/9 scripts (경유)
- **Write**: memory-store.js `saveMemory()`, status.js `writeBkitMemory()`, phase5/6/9 scripts (경유)
- **문자열 참조**: session-start.js (사용자 안내용, 실제 I/O 없음)

### 호출 시점
- `loadMemory()` / `saveMemory()`: 스킬 실행 중 `getMemory()`, `setMemory()` 등 호출 시
- `readBkitMemory()` / `writeBkitMemory()`: Phase 완료 Stop hook에서 파이프라인 상태 업데이트
- session-start.js: SessionStart hook에서 사용자 안내 컨텍스트 구성 시

### 핵심 위험: 이중 경로 구성
`memory-store.js`의 `getMemoryFilePath()`와 `pdca/status.js`의 `readBkitMemory()`/`writeBkitMemory()`가 **동일한 경로를 독립적으로 구성**하고 있어, 경로 변경 시 **양쪽 모두 수정 필요**. 현재 두 시스템은 서로를 인식하지 못함 (캐시 불일치 가능).

---

## 2. pdca-snapshots 분석

### 요약
- **디렉토리 경로**: `docs/.pdca-snapshots/`
- **총 consumer 수**: 1개 (단일 모듈)
- **경로 정의 위치**: `scripts/context-compaction.js:46` (하드코딩)
- **Git 상태**: `.gitignore`에 등록 (커밋 안 됨)
- **트리거**: PreCompact hook 이벤트

### Consumer 목록

| # | 파일:라인 | 함수명 | 접근유형 | 경로구성 | 코드 스니펫 |
|---|-----------|--------|----------|----------|-------------|
| 1 | `scripts/context-compaction.js:46` | (인라인) | 경로 정의 | 하드코딩 | `path.join(PROJECT_DIR, 'docs', '.pdca-snapshots')` |
| 2 | `scripts/context-compaction.js:48-49` | (인라인) | **exists+mkdir** | #1 경유 | `fs.existsSync(snapshotDir)` → `fs.mkdirSync(snapshotDir, { recursive: true })` |
| 3 | `scripts/context-compaction.js:52-57` | (인라인) | **write** | #1 경유 | `fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2))` |
| 4 | `scripts/context-compaction.js:62-68` | (인라인) | **read+delete** | #1 경유 | `fs.readdirSync(snapshotDir)` + `fs.unlinkSync(...)` (10개 초과 시 정리) |

### 경로 구성 상세

```javascript
// scripts/context-compaction.js:46
const snapshotDir = path.join(PROJECT_DIR, 'docs', '.pdca-snapshots');
```

모든 접근이 이 단일 변수 `snapshotDir`를 통해 이루어짐. 함수로 캡슐화되어 있지 않음.

### 접근 유형 분류
- **경로 정의**: 1곳 (context-compaction.js:46)
- **exists+mkdir**: line 48-49 (디렉토리 생성)
- **write**: line 52-57 (스냅샷 JSON 파일 쓰기)
- **read+delete**: line 62-68 (오래된 스냅샷 정리, 10개 유지)

### 호출 시점
- PreCompact hook 이벤트 발생 시 (Claude Code 컨텍스트 컴팩션 직전)

### 핵심 특성
- **Reader 없음**: 순수 백업 용도. 스냅샷을 읽는 코드가 없음
- **단일 모듈**: `context-compaction.js`만 접근하므로 변경 영향도 최소
- **Gitignored**: 런타임 데이터로 git에 추적되지 않음

---

## 3. agent-state.json 분석

### 요약
- **파일 경로**: `.bkit/agent-state.json`
- **총 consumer 수**: 6개 (직접 호출 기준)
- **경로 정의 위치**: `lib/team/state-writer.js:70-72` — `getAgentStatePath()` (중앙 관리, **모범 사례**)
- **Re-export 체인**: `state-writer.js` → `team/index.js:72` → `common.js:279`

### 경로 구성 상세

**유일한 경로 정의: `lib/team/state-writer.js:70-72` — `getAgentStatePath()`**
```javascript
function getAgentStatePath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, '.bkit', 'agent-state.json');
}
```

모든 파일 I/O가 이 함수를 경유:
- `readAgentState()` (line 81): `getAgentStatePath()` 호출
- `writeAgentState()` (line 99): `getAgentStatePath()` 호출

### Consumer 목록

| # | 파일:라인 | 함수명 | 접근유형 | 경로구성 | 코드 스니펫 |
|---|-----------|--------|----------|----------|-------------|
| 1 | `lib/team/state-writer.js:70-72` | `getAgentStatePath()` | 경로 정의 | 함수 정의 (중앙) | `path.join(PROJECT_DIR, '.bkit', 'agent-state.json')` |
| 2 | `lib/team/state-writer.js:79-90` | `readAgentState()` | **read** | `getAgentStatePath()` 경유 | `fs.readFileSync(statePath, 'utf8')` + `JSON.parse` |
| 3 | `lib/team/state-writer.js:97-129` | `writeAgentState()` | **write** | `getAgentStatePath()` 경유 | `fs.writeFileSync(tmpPath, ...)` → `fs.renameSync(tmpPath, statePath)` (원자적) |
| 4 | `scripts/subagent-start-handler.js:70` | via `stateWriter.readAgentState()` | **read** | 함수 경유 | `stateWriter.readAgentState()` (상태 확인 후 `initAgentState()` 호출 결정) |
| 5 | `scripts/subagent-stop-handler.js:59` | via `teamModule.readAgentState()` | **read** | 함수 경유 | `teamModule.readAgentState()` (진행률 업데이트용) |
| 6 | `scripts/unified-stop.js:218` | via `teamModule.readAgentState()` | **read** | 함수 경유 | `teamModule.readAgentState()` (fallback cleanup 판단용) |

### 간접 Consumer (writeAgentState를 내부 호출하는 Public API)

`writeAgentState()`는 private이지만, 다음 Public API 함수들이 내부에서 호출:

| # | 파일:라인 | 함수명 | 접근유형 | 사용처 |
|---|-----------|--------|----------|--------|
| W1 | `state-writer.js:145-165` | `initAgentState()` | write | `subagent-start-handler.js:76` |
| W2 | `state-writer.js:176-213` | `addTeammate()` | read+write | `subagent-start-handler.js:86` |
| W3 | `state-writer.js:223-246` | `updateTeammateStatus()` | read+write | `subagent-stop-handler.js:52` |
| W4 | `state-writer.js:252-264` | `removeTeammate()` | read+write | (현재 직접 호출 없음, API만 노출) |
| W5 | `state-writer.js:275-288` | `updateProgress()` | read+write | `subagent-stop-handler.js:62`, `pdca-task-completed.js:132` |
| W6 | `state-writer.js:297-316` | `addRecentMessage()` | read+write | `pdca-task-completed.js:136` |
| W7 | `state-writer.js:325-340` | `cleanupAgentState()` | read+write | `team-stop.js:37`, `cto-stop.js:52`, `unified-stop.js:220` |

### Re-export 체인 (경로 접근 없음, API 노출만)

| # | 파일:라인 | 역할 | 코드 |
|---|-----------|------|------|
| R1 | `lib/team/state-writer.js:354` | 원본 export | `getAgentStatePath, readAgentState` + 7개 API |
| R2 | `lib/team/index.js:64-73` | 중계 re-export | 9개 함수 re-export |
| R3 | `lib/common.js:279-280` | 최종 bridge export | `getAgentStatePath, readAgentState` |

### 접근 유형 분류
- **경로 정의**: 1곳 (`getAgentStatePath()` — 중앙 관리)
- **Read**: `readAgentState()` 1곳 정의, 3곳 호출 (subagent-start/stop, unified-stop)
- **Write**: `writeAgentState()` 1곳 정의 (private), 7개 Public API를 통해 간접 호출
- **원자적 쓰기**: tmp + rename 패턴 사용 (line 101-114)

### 호출 시점
- `initAgentState()`: SubagentStart hook — 팀 세션 최초 시작 시
- `addTeammate()`: SubagentStart hook — 새 에이전트 spawn 시
- `updateTeammateStatus()`: SubagentStop hook — 에이전트 종료 시
- `updateProgress()`: SubagentStop, TaskCompleted hook — 진행률 갱신
- `addRecentMessage()`: TaskCompleted hook — Phase 전환 메시지 기록
- `cleanupAgentState()`: Stop hook (team-stop, cto-stop, unified-stop) — 세션 종료 시

### 핵심 강점
`getAgentStatePath()` 중앙 함수로 경로가 **1곳에서만 정의**되어, 경로 변경 시 이 함수만 수정하면 모든 consumer에 자동 적용. **bkit-memory.json의 이중 경로 문제와 대비되는 모범 사례**.

---

## 4. 통합 위험도 매트릭스

| 파일 | Consumer 수 | 하드코딩 | 함수 경유 | 문자열 참조 | 변경 위험도 |
|------|------------|---------|----------|------------|-----------|
| `docs/.bkit-memory.json` | 9 (경로3+호출6) | **2곳** (memory-store.js, pdca/status.js) | 6곳 (scripts/*) | 1곳 (session-start.js) | **MEDIUM** |
| `docs/.pdca-snapshots/` | 1 (단일 모듈) | **1곳** (context-compaction.js) | 0곳 | 0곳 | **LOW** |
| `.bkit/agent-state.json` | 6+7 (read3+write7) | **0곳** | 전부 (13곳) | 0곳 | **LOW** |

### 변경 난이도 상세

| 파일 | 변경 시 수정 필요 파일 수 | 변경 전략 | 비고 |
|------|------------------------|----------|------|
| `bkit-memory.json` | **3개** (memory-store.js, pdca/status.js, session-start.js) | 경로 중앙화 필수 (2곳 독립 구성 해소) | 가장 복잡: 이중 경로 + 캐시 불일치 잠재 위험 |
| `pdca-snapshots/` | **1개** (context-compaction.js:46) | 변수 1개만 변경 | 가장 간단: reader 없음, gitignored |
| `agent-state.json` | **1개** (state-writer.js:72) | `getAgentStatePath()` 수정만으로 전체 적용 | 이미 중앙화됨, 모범 사례 |

### 변경 우선순위 권장

1. **pdca-snapshots** (TRIVIAL): 1파일 1변수 변경, reader 없음
2. **agent-state.json** (EASY): 이미 중앙화, 1함수 수정으로 완료
3. **bkit-memory.json** (MEDIUM): 경로 중앙화 선행 필요, 2개 독립 경로를 통합해야 함

---

## 5. SKILL.md 내 문자열 참조 (코드 비영향)

SKILL.md 파일에서 `.bkit-memory.json`을 **가이드/지시문**으로 참조하는 곳 (실제 코드 I/O 없음):

| 파일 | 라인 | 내용 |
|------|------|------|
| `skills/starter/SKILL.md` | 54 | "Initialize .bkit-memory.json" |
| `skills/plan-plus/SKILL.md` | 97, 186 | "Check .bkit-memory.json", "Update .bkit-memory.json" |
| `skills/pdca/SKILL.md` | 82, 96, 106, 120, 143, 304 | Phase별 "Update .bkit-memory.json" 지시 |
| `skills/dynamic/SKILL.md` | 55 | "Initialize .bkit-memory.json" |
| `skills/enterprise/SKILL.md` | 62 | "Initialize .bkit-memory.json" |

이 참조들은 Claude가 스킬 실행 시 `readBkitMemory()`/`writeBkitMemory()` API를 호출하도록 유도하는 프롬프트이므로, **경로 변경 시 파일명 업데이트 필요** (기능에는 무영향).
