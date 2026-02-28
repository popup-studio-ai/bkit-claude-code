# AsIs 경로 하드코딩 감사 보고서

## 요약
- 총 참조 수: **14개** (코드 파일 기준, docs/연구문서 제외)
- 변경 필요 수: **10개**
- 하드코딩 참조: **8개** (직접 `path.join`으로 경로 구성)
- 함수 경유 참조: **6개** (중앙 함수 `getPdcaStatusPath()`, `getMemoryFilePath()`, `getAgentStatePath()` 경유)
- 문자열 참조: **4개** (console.log/문자열 리터럴 내 경로명 언급)

## 분석 범위 및 방법
- 검색 대상: `lib/**/*.js`, `hooks/**/*.js`, `scripts/**/*.js`, `bkit.config.json`, `CLAUDE.md`, `.claude-plugin/plugin.json`
- 검색 패턴 10개 적용 (pdca-status, bkit-memory, pdca-snapshots, agent-state, docs/.pdca, docs/.bkit, .bkit/, getMemoryFilePath, getPdcaStatusPath, getAgentStatePath)
- Grep + Read 도구로 실제 코드 및 라인번호 검증 완료

---

## 상세 분석

### 1. pdca-status.json 참조

| # | 파일:라인 | 코드 스니펫 | 참조 유형 | 경로 구성 | 변경 필요 |
|---|-----------|------------|----------|----------|----------|
| 1 | `lib/pdca/status.js:33` | `return path.join(PROJECT_DIR, 'docs/.pdca-status.json');` | 하드코딩 (중앙 함수 내부) | `PROJECT_DIR + 'docs/.pdca-status.json'` | **YES** - Path Registry로 교체 |
| 2 | `lib/pdca/status.js:116` | `const statusPath = getPdcaStatusPath();` | 함수 경유 | `getPdcaStatusPath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 3 | `lib/pdca/status.js:138` | `const statusPath = getPdcaStatusPath();` | 함수 경유 | `getPdcaStatusPath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 4 | `lib/pdca/status.js:177` | `const statusPath = getPdcaStatusPath();` | 함수 경유 | `getPdcaStatusPath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 5 | `hooks/session-start.js:334` | `const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json');` | **하드코딩 (독립)** | `process.cwd() + 'docs/.pdca-status.json'` | **YES** - `getPdcaStatusPath()` 사용으로 변경 |
| 6 | `lib/task/tracker.js:199` | `const statusPath = path.join(PROJECT_DIR, 'docs/.pdca-status.json');` | **하드코딩 (독립)** | `PROJECT_DIR + 'docs/.pdca-status.json'` | **YES** - `getPdcaStatusPath()` 사용으로 변경 |
| 7 | `bkit.config.json:34` | `"statusFile": "docs/.pdca-status.json"` | 설정값 | 상대 경로 문자열 | **YES** - 새 경로로 업데이트 |
| 8 | `scripts/archive-feature.js:122` | `console.warn('... in .pdca-status.json')` | 문자열 리터럴 | 사용자 메시지 | NO - 표시용 문자열 (기능 무관) |
| 9 | `scripts/archive-feature.js:124` | `console.log('... in .pdca-status.json')` | 문자열 리터럴 | 사용자 메시지 | NO - 표시용 문자열 (기능 무관) |
| 10 | `scripts/archive-feature.js:131` | `console.warn('... in .pdca-status.json')` | 문자열 리터럴 | 사용자 메시지 | NO - 표시용 문자열 (기능 무관) |
| 11 | `scripts/archive-feature.js:133` | `console.log('... from .pdca-status.json')` | 문자열 리터럴 | 사용자 메시지 | NO - 표시용 문자열 (기능 무관) |

**export 체인**:
- `lib/pdca/status.js:734` → `getPdcaStatusPath` export
- `lib/pdca/index.js:45` → `getPdcaStatusPath: status.getPdcaStatusPath` re-export
- `lib/common.js:120` → `getPdcaStatusPath: pdca.getPdcaStatusPath` re-export

**소결**: 하드코딩 4개 (status.js:33, session-start.js:334, tracker.js:199, bkit.config.json:34). 중앙 함수(status.js:33) 1곳 변경 시 16+ consumer 자동 적용. 독립 하드코딩 2곳(session-start.js, tracker.js) 별도 수정 필요.

---

### 2. bkit-memory.json 참조

| # | 파일:라인 | 코드 스니펫 | 참조 유형 | 경로 구성 | 변경 필요 |
|---|-----------|------------|----------|----------|----------|
| 1 | `lib/memory-store.js:28` | `return path.join(common.PROJECT_DIR, 'docs', '.bkit-memory.json');` | 하드코딩 (중앙 함수 내부) | `PROJECT_DIR + 'docs' + '.bkit-memory.json'` | **YES** - Path Registry로 교체 |
| 2 | `lib/memory-store.js:44` | `const MEMORY_FILE = getMemoryFilePath();` | 함수 경유 | `getMemoryFilePath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 3 | `lib/memory-store.js:64` | `const MEMORY_FILE = getMemoryFilePath();` | 함수 경유 | `getMemoryFilePath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 4 | `lib/memory-store.js:167` | `return getMemoryFilePath();` | 함수 경유 (getMemoryPath) | `getMemoryFilePath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 5 | `lib/pdca/status.js:705` | `const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');` | **하드코딩 (독립)** | `PROJECT_DIR + 'docs' + '.bkit-memory.json'` | **YES** - `getMemoryFilePath()` 사용으로 변경 |
| 6 | `lib/pdca/status.js:724` | `const memoryPath = path.join(PROJECT_DIR, 'docs', '.bkit-memory.json');` | **하드코딩 (독립)** | `PROJECT_DIR + 'docs' + '.bkit-memory.json'` | **YES** - `getMemoryFilePath()` 사용으로 변경 |
| 7 | `hooks/session-start.js:609` | `` `docs/.bkit-memory.json` `` (문자열 내) | 문자열 리터럴 | 사용자 안내 메시지 | NO - 표시용 문자열 (기능 무관, 단 경로 변경 시 업데이트 권장) |

**export 체인**:
- `lib/memory-store.js:26` → `getMemoryFilePath()` 내부 함수 (모듈 외부 미노출)
- `lib/memory-store.js:166` → `getMemoryPath()` 외부 노출용 래퍼

**소결**: 하드코딩 3개 (memory-store.js:28, status.js:705, status.js:724). 중앙 함수(memory-store.js:28) 1곳 변경 시 `loadMemory()`, `saveMemory()`, `getMemoryPath()` 자동 적용. `status.js`의 `readBkitMemory()`, `writeBkitMemory()`는 독립 경로 구성으로 별도 수정 필요.

---

### 3. pdca-snapshots 참조

| # | 파일:라인 | 코드 스니펫 | 참조 유형 | 경로 구성 | 변경 필요 |
|---|-----------|------------|----------|----------|----------|
| 1 | `scripts/context-compaction.js:46` | `const snapshotDir = path.join(PROJECT_DIR, 'docs', '.pdca-snapshots');` | **하드코딩 (유일)** | `PROJECT_DIR + 'docs' + '.pdca-snapshots'` | **YES** - Path Registry로 교체 |

**소결**: 하드코딩 1개. 유일한 writer이며 reader 0개. 변경 난이도 최저.

---

### 4. agent-state.json 참조

| # | 파일:라인 | 코드 스니펫 | 참조 유형 | 경로 구성 | 변경 필요 |
|---|-----------|------------|----------|----------|----------|
| 1 | `lib/team/state-writer.js:72` | `return path.join(PROJECT_DIR, '.bkit', 'agent-state.json');` | 하드코딩 (중앙 함수 내부) | `PROJECT_DIR + '.bkit' + 'agent-state.json'` | **YES** - Path Registry로 교체 |
| 2 | `lib/team/state-writer.js:81` | `const statePath = getAgentStatePath();` | 함수 경유 | `getAgentStatePath()` | NO - 중앙 함수 변경 시 자동 적용 |
| 3 | `lib/team/state-writer.js:99` | `const statePath = getAgentStatePath();` | 함수 경유 | `getAgentStatePath()` | NO - 중앙 함수 변경 시 자동 적용 |

**export 체인**:
- `lib/team/state-writer.js:354` → `getAgentStatePath` export
- `lib/team/index.js:72` → `getAgentStatePath: stateWriter.getAgentStatePath` re-export
- `lib/common.js:279` → `getAgentStatePath: team.getAgentStatePath` re-export

**소결**: 하드코딩 1개 (state-writer.js:72). 이미 `.bkit/` 디렉토리에 위치하며 중앙 함수 패턴을 따름. 모범 사례. Path Registry 전환 시 함수 내부만 변경하면 3+ consumer 자동 적용.

---

## 5. 통계

### 5.1 파일별 하드코딩 참조 수

| 파일 | pdca-status | bkit-memory | pdca-snapshots | agent-state | 합계 |
|------|:-----------:|:-----------:|:--------------:|:-----------:|:----:|
| `lib/pdca/status.js` | 1 (중앙) | 2 (독립) | - | - | **3** |
| `lib/memory-store.js` | - | 1 (중앙) | - | - | **1** |
| `lib/task/tracker.js` | 1 (독립) | - | - | - | **1** |
| `lib/team/state-writer.js` | - | - | - | 1 (중앙) | **1** |
| `hooks/session-start.js` | 1 (독립) | - | - | - | **1** |
| `scripts/context-compaction.js` | - | - | 1 (유일) | - | **1** |
| `bkit.config.json` | 1 (설정값) | - | - | - | **1** |
| **합계** | **4** | **3** | **1** | **1** | **9** |

### 5.2 참조 유형별 분류

| 유형 | 수량 | 설명 |
|------|:----:|------|
| 하드코딩 - 중앙 함수 내부 | 3 | `getPdcaStatusPath()`, `getMemoryFilePath()`, `getAgentStatePath()` |
| 하드코딩 - 독립 경로 구성 | 4 | session-start.js:334, tracker.js:199, status.js:705, status.js:724 |
| 하드코딩 - 설정 파일 | 1 | bkit.config.json:34 |
| 하드코딩 - 스크립트 유일 경로 | 1 | context-compaction.js:46 |
| 함수 경유 | 6 | 중앙 함수 호출 (자동 적용 대상) |
| 문자열 리터럴 | 5 | console.log/사용자 메시지 (기능 무관) |
| **합계** | **20** | |

### 5.3 변경 영향 매트릭스

| 중앙 함수 변경 | 변경 파일 수 | 자동 적용 consumer 수 | 독립 수정 필요 수 |
|--------------|:----------:|:-------------------:|:---------------:|
| `getPdcaStatusPath()` (status.js:33) | 1 | 16+ | 2 (session-start.js, tracker.js) |
| `getMemoryFilePath()` (memory-store.js:28) | 1 | 5+ | 2 (status.js:705, status.js:724) |
| `getAgentStatePath()` (state-writer.js:72) | 1 | 3+ | 0 |
| snapshots 경로 (직접) | 1 | 0 | 0 |
| bkit.config.json 설정값 | 1 | 0 | 0 |

### 5.4 변경 필요 목록 (실행 순서)

| 우선순위 | 파일:라인 | 현재 경로 | 변경 내용 | 영향 범위 |
|:--------:|-----------|----------|----------|----------|
| 1 | `lib/pdca/status.js:33` | `docs/.pdca-status.json` | Path Registry 경유로 변경 | 16+ consumer 자동 적용 |
| 2 | `lib/memory-store.js:28` | `docs/.bkit-memory.json` | Path Registry 경유로 변경 | 5+ consumer 자동 적용 |
| 3 | `lib/team/state-writer.js:72` | `.bkit/agent-state.json` | Path Registry 경유로 변경 | 3+ consumer 자동 적용 |
| 4 | `scripts/context-compaction.js:46` | `docs/.pdca-snapshots` | Path Registry 경유로 변경 | 단일 사용처 |
| 5 | `hooks/session-start.js:334` | `docs/.pdca-status.json` | `getPdcaStatusPath()` 호출로 변경 | 독립 하드코딩 제거 |
| 6 | `lib/task/tracker.js:199` | `docs/.pdca-status.json` | `getPdcaStatusPath()` 호출로 변경 | 독립 하드코딩 제거 |
| 7 | `lib/pdca/status.js:705` | `docs/.bkit-memory.json` | `getMemoryFilePath()` 호출로 변경 | 독립 하드코딩 제거 |
| 8 | `lib/pdca/status.js:724` | `docs/.bkit-memory.json` | `getMemoryFilePath()` 호출로 변경 | 독립 하드코딩 제거 |
| 9 | `bkit.config.json:34` | `docs/.pdca-status.json` | 새 경로로 업데이트 | 설정값 동기화 |
| 10 | `hooks/session-start.js:609` | `docs/.bkit-memory.json` (문자열) | 새 경로명으로 업데이트 | 사용자 안내 메시지 |

### 5.5 위험도 분석

| 위험 항목 | 심각도 | 설명 |
|----------|:------:|------|
| `session-start.js:334`의 `process.cwd()` 사용 | **HIGH** | `PROJECT_DIR` 대신 `process.cwd()` 사용 -- 워킹 디렉토리가 다를 경우 잘못된 경로 참조 가능. 기존 버그 가능성 |
| `status.js`의 `readBkitMemory/writeBkitMemory` 독립 경로 | **MEDIUM** | `memory-store.js`의 중앙 함수를 사용하지 않고 독립 path.join -- 경로 변경 시 누락 위험 |
| `bkit.config.json` 설정값 미사용 | **LOW** | `statusFile` 키가 존재하지만 코드에서 실제로 읽어 사용하는 곳이 확인되지 않음 -- dead config 가능성 |
| `archive-feature.js` 문자열 참조 | **LOW** | 경로 변경 시 사용자에게 표시되는 파일명이 틀려짐 -- 기능 영향 없음 |
