# AsIs: hooks/session-start.js 영향 분석

## 파일 개요
- **파일 경로**: `hooks/session-start.js`
- **총 라인 수**: 753
- **함수 수**: 8개 (named function 6 + 인라인 로직 블록 2)
- **경로 참조 수**: 12개 (path.join 7 + 문자열 리터럴 5)
- **버전**: v1.5.7
- **역할**: SessionStart 훅 — 세션 시작 시 PDCA 상태 확인, 온보딩, 환경변수 설정, 컨텍스트 주입

---

## 함수 구조 맵

| # | 함수명 | 라인 범위 | 용도 | 경로 참조 |
|---|--------|-----------|------|-----------|
| 1 | (모듈 import/초기화) | 92-151 | require, debugLog, 초기화 | `__dirname` (간접) |
| 2 | (contextHierarchy 초기화) | 157-178 | 세션 컨텍스트 초기화, PDCA 상태 로드 | 없음 (getPdcaStatusFull 간접) |
| 3 | (memoryStore 초기화) | 180-202 | 세션 카운트 추적, 메모리 스토어 | 없음 |
| 4 | (importResolver 초기화) | 204-230 | 시작 임포트 로드 | `process.cwd()` + `bkit.config.json` (L213) |
| 5 | (contextFork 정리) | 232-243 | 이전 세션 포크 클리어 | 없음 |
| 6 | `checkUserPromptSubmitBug()` | 246-261 | UserPromptSubmit 플러그인 버그 감지 (#20659) | `__dirname` + `hooks.json` (L248) |
| 7 | `scanSkillsForForkConfig()` | 264-297 | 스킬 fork 설정 스캔 | `__dirname` + `../skills` (L265) |
| 8 | `preloadCommonImports()` | 300-322 | 공통 임포트 프리로드 | `__dirname` + `..` (L311) |
| 9 | `detectPdcaPhase()` | 333-349 | PDCA 현재 단계 감지 | **`process.cwd()` + `docs/.pdca-status.json`** (L334) |
| 10 | `enhancedOnboarding()` | 356-425 | 온보딩 데이터 생성 (기존 작업 확인) | 없음 (getPdcaStatusFull 간접) |
| 11 | `analyzeRequestAmbiguity()` | 433-468 | 사용자 요청 모호성 분석 | 없음 |
| 12 | `getTriggerKeywordTable()` | 474-504 | 트리거 키워드 테이블 생성 | 없음 |
| 13 | (환경변수 persist) | 506-519 | CLAUDE_ENV_FILE에 환경변수 기록 | 없음 |
| 14 | (출력 응답 빌드) | 521-753 | additionalContext JSON 응답 빌드 | `process.cwd()` + `.mcp.json` (L615) |

---

## pdca-status.json 참조 상세

| # | 라인 | 함수 | 현재 코드 | 경로 구성 방식 | 용도 |
|---|------|------|-----------|----------------|------|
| 1 | 98 | (import) | `initPdcaStatusIfNotExists` | lib/common.js → lib/pdca/status.js 위임 (내부: `PROJECT_DIR + 'docs/.pdca-status.json'`) | 초기화 함수 임포트 |
| 2 | 99 | (import) | `getPdcaStatusFull` | lib/common.js → lib/pdca/status.js 위임 (내부: `PROJECT_DIR + 'docs/.pdca-status.json'`) | 전체 상태 읽기 함수 임포트 |
| 3 | 154 | (초기화) | `initPdcaStatusIfNotExists()` | lib/pdca/status.js 내부 경로 사용 | pdca-status.json 없으면 생성 |
| 4 | 163 | (contextHierarchy 초기화) | `const pdcaStatus = getPdcaStatusFull()` | lib/pdca/status.js 내부 경로 사용 | 세션 컨텍스트에 primaryFeature 설정 |
| 5 | **334** | `detectPdcaPhase()` | **`const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json')`** | **직접 하드코딩 (process.cwd() + 문자열)** | currentPhase 추출 (정규식 파싱) |
| 6 | 357 | `enhancedOnboarding()` | `const pdcaStatus = getPdcaStatusFull()` | lib/pdca/status.js 내부 경로 사용 | 기존 작업 감지 및 온보딩 타입 결정 |
| 7 | 641 | (출력 빌드) | `const pdcaStatusForBatch = getPdcaStatusFull()` | lib/pdca/status.js 내부 경로 사용 | Enterprise 다중 기능 batch 제안 |

### 핵심 발견
- **직접 하드코딩**: 라인 334의 `detectPdcaPhase()` 함수만 `process.cwd()` + `'docs/.pdca-status.json'` 직접 경로를 사용
- **간접 참조 (5곳)**: 나머지 5곳은 `getPdcaStatusFull()` / `initPdcaStatusIfNotExists()` 통해 간접 접근 (lib/pdca/status.js 내부 경로 사용)
- **이중 경로 구성 문제**: `detectPdcaPhase()`는 `process.cwd()` 기반, lib/pdca/status.js는 `PROJECT_DIR` 기반 → 경로 불일치 가능성

---

## bkit-memory.json 참조 상세

| # | 라인 | 함수 | 현재 코드 | 경로 구성 방식 | 용도 |
|---|------|------|-----------|----------------|------|
| 1 | 609 | (출력 빌드) | `` additionalContext += `- bkit memory (\`docs/.bkit-memory.json\`) and CC auto-memory are separate systems with no collision\n` `` | **문자열 리터럴 (사용자 표시용)** | 사용자에게 bkit memory 경로 안내 |

### 핵심 발견
- session-start.js는 bkit-memory.json을 **직접 읽거나 쓰지 않음**
- 유일한 참조는 라인 609의 **사용자 안내 문자열** 내 경로 표시
- 실제 bkit-memory.json 접근은 `lib/memory-store.js`와 `lib/pdca/status.js`의 `readBkitMemory/writeBkitMemory`가 담당

---

## process.cwd() 사용 위치

| # | 라인 | 함수/블록 | 현재 코드 | paths.js 전환 대상 |
|---|------|-----------|-----------|---------------------|
| 1 | 149 | (debugLog 초기화) | `cwd: process.cwd()` | 로깅 목적 — 전환 불필요 (디버그 정보) |
| 2 | **213** | (importResolver 초기화) | `path.join(process.cwd(), 'bkit.config.json')` | `paths.CONFIG_PATH` 또는 `paths.getConfigPath()` |
| 3 | **334** | `detectPdcaPhase()` | `path.join(process.cwd(), 'docs/.pdca-status.json')` | `paths.PDCA_STATUS_PATH` 또는 `paths.getPdcaStatusPath()` |
| 4 | **615** | (출력 빌드 — bkend MCP 체크) | `path.join(process.cwd(), '.mcp.json')` | `paths.getMcpConfigPath()` 또는 유지 (.mcp.json은 사용자 프로젝트 파일) |

### 핵심 발견
- **전환 필수 (2곳)**: 라인 213, 334 — bkit 내부 파일 경로이므로 paths.js로 전환 필요
- **전환 선택 (1곳)**: 라인 615 — `.mcp.json`은 사용자 프로젝트 루트 파일로, `process.cwd()` 사용이 적절할 수 있음
- **전환 불필요 (1곳)**: 라인 149 — 디버그 로깅용 현재 디렉토리 표시

---

## __dirname 사용 위치

| # | 라인 | 함수/블록 | 현재 코드 | 비고 |
|---|------|-----------|-----------|------|
| 1 | 248 | `checkUserPromptSubmitBug()` | `path.join(__dirname, 'hooks.json')` | 플러그인 내부 파일 — __dirname 사용 적절 |
| 2 | 265 | `scanSkillsForForkConfig()` | `path.join(__dirname, '../skills')` | 플러그인 내부 파일 — __dirname 사용 적절 |
| 3 | 311 | `preloadCommonImports()` | `importPath.replace('${PLUGIN_ROOT}', path.join(__dirname, '..'))` | PLUGIN_ROOT 치환 — __dirname 사용 적절 |

### 핵심 발견
- `__dirname` 3곳 모두 **플러그인 내부 파일** 접근이므로 전환 불필요
- paths.js 전환 대상이 아님 (플러그인 구조 경로)

---

## 사용자 표시 경로 문자열

session-start.js가 additionalContext에 포함하여 사용자에게 표시하는 경로:

| # | 라인 | 현재 문자열 | 용도 | 변경 필요 여부 |
|---|------|-------------|------|----------------|
| 1 | 607 | `~/.claude/projects/*/memory/MEMORY.md` | CC auto-memory 경로 안내 | 아니오 (CC 경로) |
| 2 | 609 | `docs/.bkit-memory.json` | bkit memory 경로 안내 | **예** — 경로가 변경되면 이 안내 문자열도 업데이트 필요 |
| 3 | 630 | `claude mcp add bkend --transport http https://api.bkend.ai/mcp` | bkend MCP 설정 명령 | 아니오 (CLI 명령) |

---

## auto-migration 삽입 위치 제안

### 삽입 위치: 라인 154 (`initPdcaStatusIfNotExists()`) 직전, 라인 152 직후

```javascript
// 라인 152: debugLog 완료 후
// >>> 여기에 auto-migration 삽입 <<<

// 기존 라인 154:
// initPdcaStatusIfNotExists();
```

### 이유
1. **migration은 모든 파일 접근보다 먼저 실행되어야 함**: `initPdcaStatusIfNotExists()`가 pdca-status.json을 처음 읽는 시점이므로, 그 전에 경로 migration이 완료되어야 함
2. **debugLog 초기화 후**: 라인 148-151의 debugLog 초기화가 완료된 상태이므로 migration 로그를 남길 수 있음
3. **모듈 import 완료 후**: 라인 92-145의 모든 require/try-catch가 완료된 상태
4. **contextHierarchy/memoryStore 사용 전**: 라인 157-202의 contextHierarchy/memoryStore 초기화 전에 경로가 확정되어야 함

### 제약조건
- migration 함수는 **동기적(synchronous)**이어야 함 — session-start.js 전체가 동기 실행
- migration 실패 시에도 **기존 경로로 fallback** 가능해야 함 (graceful degradation)
- migration 로그는 `debugLog('SessionStart', 'Migration ...', ...)` 형식 사용

### 제안 코드 구조

```javascript
// v1.5.8: Auto-migration from docs/ flat paths to structured paths
try {
  const { migrateIfNeeded } = require('../lib/core/paths.js');
  const migrationResult = migrateIfNeeded();
  if (migrationResult.migrated) {
    debugLog('SessionStart', 'Path migration completed', {
      migratedFiles: migrationResult.files,
      from: migrationResult.from,
      to: migrationResult.to
    });
  }
} catch (e) {
  debugLog('SessionStart', 'Path migration skipped', { error: e.message });
}
```

---

## 변경 필요 위치 전체 리스트

| # | 라인 | 현재 코드 | 변경 후 코드 (예상) | 변경 이유 |
|---|------|-----------|---------------------|-----------|
| 1 | 152-153 | (빈 줄) | auto-migration 코드 삽입 | 경로 migration은 모든 파일 접근 전에 실행 필요 |
| 2 | 213 | `path.join(process.cwd(), 'bkit.config.json')` | `paths.getConfigPath()` 또는 `require('../lib/core/paths').CONFIG_PATH` | bkit 내부 파일 경로 중앙화 |
| 3 | 334 | `const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json')` | `const statusPath = paths.getPdcaStatusPath()` | pdca-status.json 경로 중앙화 (**직접 하드코딩 제거**) |
| 4 | 609 | `` `docs/.bkit-memory.json` `` (문자열 내) | 새 경로 문자열로 업데이트 | 사용자 안내 문구의 경로가 실제 경로와 일치해야 함 |
| 5 | 615 | `path.join(process.cwd(), '.mcp.json')` | 유지 또는 `paths.getUserProjectPath('.mcp.json')` | .mcp.json은 사용자 프로젝트 파일 — 선택적 전환 |
| 6 | 94-109 | `require('../lib/common.js')` import 목록 | paths.js 관련 import 추가 | paths 모듈 사용을 위한 import |

---

## 추가 발견: detectPdcaPhase() 함수 이중성 문제

`detectPdcaPhase()` 함수 (라인 333-349)는 `getPdcaStatusFull()`과 **동일한 파일을 다른 방식으로** 읽고 있음:

| 비교 항목 | `detectPdcaPhase()` (L334) | `getPdcaStatusFull()` (lib/pdca/status.js) |
|-----------|---------------------------|------------------------------------------|
| 경로 구성 | `process.cwd() + 'docs/.pdca-status.json'` | `PROJECT_DIR + 'docs/.pdca-status.json'` |
| 파싱 방식 | 정규식 `/"currentPhase"\s*:\s*(\d+)/` | `JSON.parse()` 전체 파싱 |
| 반환값 | 문자열 `'1'` ~ `'9'` | 전체 객체 |

**리팩토링 제안**: `detectPdcaPhase()`를 `getPdcaStatusFull().currentPhase`로 대체 가능 (이미 enhancedOnboarding에서 getPdcaStatusFull을 호출하므로 중복)

---

## 요약

### 위험도별 분류

**HIGH (즉시 변경 필요)**
- 라인 334: `process.cwd()` 직접 하드코딩으로 pdca-status.json 접근 → paths.js 전환 필수

**MEDIUM (paths.js 전환 시 함께 변경)**
- 라인 213: `process.cwd()` + `bkit.config.json` → paths.js 전환
- 라인 609: 사용자 안내 문자열 내 경로 → 새 경로로 업데이트
- 라인 152-153: auto-migration 코드 삽입 위치

**LOW (선택적 변경)**
- 라인 615: `.mcp.json` 경로 — 사용자 프로젝트 파일이므로 process.cwd() 유지 가능
- `detectPdcaPhase()` 함수: getPdcaStatusFull() 사용으로 리팩토링 가능 (선택)
