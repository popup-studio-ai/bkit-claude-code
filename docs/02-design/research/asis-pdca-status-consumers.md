# AsIs: pdca-status.json 소비자 전수 분석

> **분석일**: 2026-03-01
> **분석 대상**: `docs/.pdca-status.json`
> **분석 범위**: bkit v1.5.7 코드베이스 전체 (lib/, scripts/, hooks/)

## 요약

| 항목 | 수치 |
|------|------|
| 총 consumer 수 | **28개** (고유 호출 지점 기준) |
| 읽기(Read) consumer | **22개** |
| 쓰기(Write) consumer | **14개** |
| 존재확인(Exists) consumer | **2개** |
| 직접 경로 구성 | **3개** (위험) |
| 함수 경유 접근 | **25개** (안전) |
| 관련 소스 파일 수 | **19개** |

> **참고**: 일부 consumer는 Read+Write 양쪽을 수행하므로 Read+Write+Exists 합계가 총 consumer보다 큼

---

## getPdcaStatusPath() 함수 분석

### 함수 정의

```javascript
// lib/pdca/status.js:31-34
function getPdcaStatusPath() {
  const { PROJECT_DIR } = getCore();
  return path.join(PROJECT_DIR, 'docs/.pdca-status.json');
}
```

### 반환값
- `{PROJECT_DIR}/docs/.pdca-status.json` (절대 경로)
- `PROJECT_DIR`은 `lib/core.js`의 상수로, 프로젝트 루트 디렉토리

### 호출 흐름

```
getPdcaStatusPath()
├── initPdcaStatusIfNotExists() → fs.existsSync + fs.writeFileSync
├── getPdcaStatusFull() → fs.existsSync + fs.readFileSync
│   ├── loadPdcaStatus() (alias)
│   ├── getFeatureStatus()
│   ├── updatePdcaStatus() → savePdcaStatus()
│   ├── addPdcaHistory() → savePdcaStatus()
│   ├── completePdcaFeature() → updatePdcaStatus()
│   ├── setActiveFeature() → savePdcaStatus()
│   ├── addActiveFeature() → savePdcaStatus()
│   ├── removeActiveFeature() → savePdcaStatus()
│   ├── deleteFeatureFromStatus() → savePdcaStatus()
│   ├── enforceFeatureLimit() → savePdcaStatus()
│   ├── getArchivedFeatures()
│   ├── cleanupArchivedFeatures() → savePdcaStatus()
│   ├── archiveFeatureToSummary() → savePdcaStatus()
│   ├── getActiveFeatures()
│   ├── switchFeatureContext() → savePdcaStatus()
│   └── extractFeatureFromContext()
└── savePdcaStatus() → fs.writeFileSync
```

### Export 경로
```
lib/pdca/status.js → module.exports (734행)
  └── lib/pdca/index.js → re-export (45행)
      └── lib/common.js → re-export (120행)
```

---

## Consumer 전체 목록

### Read Consumers (읽기)

| # | 파일:라인 | 함수명 | 코드 스니펫 | 경로 구성 방식 | 호출 시점 | 위험도 |
|---|-----------|--------|-------------|----------------|-----------|--------|
| R1 | `lib/pdca/status.js:138` | `getPdcaStatusFull()` | `const statusPath = getPdcaStatusPath()` | getPdcaStatusPath() 경유 | 전역 (캐시 3초 TTL) | LOW |
| R2 | `lib/pdca/status.js:167-168` | `loadPdcaStatus()` | `return getPdcaStatusFull()` | alias | 전역 | LOW |
| R3 | `lib/pdca/status.js:204` | `getFeatureStatus()` | `const status = getPdcaStatusFull()` | 경유 | feature 조회 시 | LOW |
| R4 | `lib/pdca/status.js:644` | `getActiveFeatures()` | `const status = getPdcaStatusFull()` | 경유 | active features 조회 | LOW |
| R5 | `lib/pdca/status.js:695` | `extractFeatureFromContext()` | `const status = getPdcaStatusFull()` | 경유 | feature 추출 시 | LOW |
| R6 | `hooks/session-start.js:163` | (onboarding) | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | SessionStart 훅 | LOW |
| R7 | `hooks/session-start.js:334` | `detectPdcaPhase()` | `const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json')` | **직접 path.join + process.cwd()** | PDCA phase 감지 | **HIGH** |
| R8 | `hooks/session-start.js:357` | `enhancedOnboarding()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | 온보딩 시 | LOW |
| R9 | `hooks/session-start.js:641` | (batch 추천) | `const pdcaStatusForBatch = getPdcaStatusFull()` | 경유 via common.js | Enterprise 모드 | LOW |
| R10 | `scripts/iterator-stop.js:55` | (top-level) | `const currentStatus = getPdcaStatusFull()` | 경유 via common.js | pdca-iterator Stop 훅 | LOW |
| R11 | `scripts/iterator-stop.js:62` | (top-level) | `const featureStatus = feature ? getFeatureStatus(feature) : null` | 경유 via common.js | pdca-iterator Stop 훅 | LOW |
| R12 | `scripts/gap-detector-stop.js:65` | (top-level) | `const currentStatus = getPdcaStatusFull()` | 경유 via common.js | gap-detector Stop 훅 | LOW |
| R13 | `scripts/cto-stop.js:21` | `run()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | CTO Stop 훅 | LOW |
| R14 | `scripts/team-stop.js:22` | `run()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | Team Stop 훅 | LOW |
| R15 | `scripts/team-idle-handler.js:45` | `main()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | TeammateIdle 훅 | LOW |
| R16 | `scripts/pdca-task-completed.js:79` | `main()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | TaskCompleted 훅 | LOW |
| R17 | `scripts/unified-stop.js:85` | `detectActiveSkill()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | Stop 훅 (스킬 감지) | LOW |
| R18 | `scripts/unified-stop.js:116` | `detectActiveAgent()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | Stop 훅 (에이전트 감지) | LOW |
| R19 | `scripts/context-compaction.js:35` | (top-level) | `const pdcaStatus = getPdcaStatusFull(true)` | 경유 via common.js | PreCompact 훅 | LOW |
| R20 | `scripts/code-review-stop.js:26` | `main()` | `const pdcaStatus = common.getPdcaStatusFull()` | 경유 via common.js | code-review Stop 훅 | LOW |
| R21 | `scripts/pdca-skill-stop.js:153` | (top-level) | `const currentStatus = getPdcaStatusFull()` | 경유 via common.js | pdca Skill Stop 훅 | LOW |
| R22 | `scripts/subagent-start-handler.js:72` | `main()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via common.js | SubagentStart 훅 | LOW |
| R23 | `scripts/phase3-mockup-stop.js:15` | (top-level) | `const status = loadPdcaStatus()` | 경유 via common.js | Phase 3 Stop 훅 | LOW |
| R24 | `scripts/phase-transition.js:95` | `handleTransition()` | `const status = loadPdcaStatus()` | 경유 via common.js | phase 전환 스크립트 | LOW |
| R25 | `scripts/skill-post.js:199` | (skill config) | `lib.getPdcaStatusFull()?.currentFeature` | 경유 via common.js | PostToolUse(Skill) | LOW |
| R26 | `lib/context-fork.js:36` | `forkContext()` | `const currentStatus = common.getPdcaStatusFull(true)` | 경유 via common.js | 컨텍스트 분기 | LOW |
| R27 | `lib/context-fork.js:116` | `mergeContext()` | `const currentStatus = common.getPdcaStatusFull(true)` | 경유 via common.js | 컨텍스트 병합 | LOW |
| R28 | `lib/skill-orchestrator.js:363` | (task chain) | `const pdcaStatus = common.getPdcaStatusFull()` | 경유 via common.js | Skill 오케스트레이션 | LOW |
| R29 | `lib/pdca/automation.js:122` | `shouldSuggestBatch()` | `const status = getPdcaStatusFull()` | 경유 via status.js | batch 모드 판단 | LOW |
| R30 | `lib/pdca/automation.js:139` | `shouldAutoStartPdca()` | `const status = getPdcaStatusFull()` | 경유 via status.js | 자동 PDCA 시작 판단 | LOW |
| R31 | `lib/pdca/automation.js:298` | `getNextPdcaActionAfterCompletion()` | `const pdcaStatus = getPdcaStatusFull()` | 경유 via status.js | 다음 phase 결정 | LOW |
| R32 | `lib/team/cto-logic.js:59` | `decidePdcaPhase()` | `const status = pdca.getPdcaStatusFull ? pdca.getPdcaStatusFull() : null` | 경유 via pdca module | CTO 의사결정 | LOW |
| R33 | `lib/task/tracker.js:35` | `savePdcaTaskId()` | `const status = getPdcaStatusFull(true)` | 경유 via pdca module | Task ID 저장 | LOW |
| R34 | `lib/task/tracker.js:66` | `getPdcaTaskId()` | `const status = getPdcaStatusFull()` | 경유 via pdca module | Task ID 조회 | LOW |
| R35 | `lib/task/tracker.js:80` | `getTaskChainStatus()` | `const status = getPdcaStatusFull()` | 경유 via pdca module | Task chain 상태 | LOW |
| R36 | `lib/task/tracker.js:118` | `updatePdcaTaskStatus()` | `const status = getPdcaStatusFull(true)` | 경유 via pdca module | Task 상태 업데이트 | LOW |
| R37 | `lib/task/tracker.js:199` | `findPdcaStatus()` | `const statusPath = path.join(PROJECT_DIR, 'docs/.pdca-status.json')` | **직접 path.join + PROJECT_DIR** | PDCA 파일 위치 확인 | **HIGH** |
| R38 | `lib/task/tracker.js:211` | `getCurrentPdcaPhase()` | `const status = getPdcaStatusFull()` | 경유 via pdca module | 현재 phase 조회 | LOW |

### Write Consumers (쓰기)

| # | 파일:라인 | 함수명 | 코드 스니펫 | 경로 구성 방식 | 호출 시점 | 위험도 |
|---|-----------|--------|-------------|----------------|-----------|--------|
| W1 | `lib/pdca/status.js:126` | `initPdcaStatusIfNotExists()` | `fs.writeFileSync(statusPath, ...)` | getPdcaStatusPath() 경유 | 초기화 시 | LOW |
| W2 | `lib/pdca/status.js:190` | `savePdcaStatus()` | `fs.writeFileSync(statusPath, ...)` | getPdcaStatusPath() 경유 | 모든 상태 저장 | LOW |
| W3 | `lib/pdca/status.js:259` | `updatePdcaStatus()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | feature phase 업데이트 | LOW |
| W4 | `lib/pdca/status.js:281` | `addPdcaHistory()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | 히스토리 추가 | LOW |
| W5 | `lib/pdca/status.js:311` | `setActiveFeature()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | primary feature 설정 | LOW |
| W6 | `lib/pdca/status.js:332` | `addActiveFeature()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | active feature 추가 | LOW |
| W7 | `lib/pdca/status.js:349` | `removeActiveFeature()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | active feature 제거 | LOW |
| W8 | `lib/pdca/status.js:403` | `deleteFeatureFromStatus()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | feature 삭제 | LOW |
| W9 | `lib/pdca/status.js:483` | `enforceFeatureLimit()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | feature 수 제한 | LOW |
| W10 | `lib/pdca/status.js:565` | `cleanupArchivedFeatures()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | archived 정리 | LOW |
| W11 | `lib/pdca/status.js:633` | `archiveFeatureToSummary()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | summary 변환 | LOW |
| W12 | `lib/pdca/status.js:667` | `switchFeatureContext()` | `savePdcaStatus(status)` | savePdcaStatus() 경유 | feature 전환 | LOW |
| W13 | `scripts/phase-transition.js:151` | `handleTransition()` | `savePdcaStatus(status)` | 경유 via common.js | phase 전환 | LOW |
| W14 | `scripts/iterator-stop.js:293` | (top-level) | `updatePdcaStatus(feature, 'act', {...})` | 경유 via common.js | 반복 결과 저장 | LOW |
| W15 | `scripts/gap-detector-stop.js:100` | (top-level) | `updatePdcaStatus(feature, 'check', {...})` | 경유 via common.js | gap 분석 결과 저장 | LOW |
| W16 | `scripts/pdca-skill-stop.js:314` | (top-level) | `updatePdcaStatus(feature, currentPhase, {...})` | 경유 via common.js | pdca skill 결과 저장 | LOW |
| W17 | `scripts/archive-feature.js:111` | (top-level) | `updatePdcaStatus(feature, 'archived', {...})` | 경유 via lib/pdca/status | archive 상태 기록 | LOW |
| W18 | `scripts/archive-feature.js:119` | (top-level) | `archiveFeatureToSummary(feature)` | 경유 via lib/pdca/status | summary 보존 | LOW |
| W19 | `scripts/archive-feature.js:128` | (top-level) | `deleteFeatureFromStatus(feature)` | 경유 via lib/pdca/status | feature 삭제 | LOW |
| W20 | `scripts/pre-write.js:112` | (top-level) | `updatePdcaStatus(feature, 'do', {...})` | 경유 via common.js | 소스 파일 쓰기 시 | LOW |
| W21 | `scripts/team-stop.js:26` | `run()` | `addPdcaHistory({...})` | 경유 via common.js | Team 세션 종료 기록 | LOW |
| W22 | `scripts/cto-stop.js:35` | `run()` | `addPdcaHistory({...})` | 경유 via common.js | CTO 세션 종료 기록 | LOW |
| W23 | `scripts/iterator-stop.js:111` | (top-level) | `completePdcaFeature(feature)` | 경유 via common.js | feature 완료 | LOW |
| W24 | `scripts/skill-post.js:202` | (skill config) | `lib.updatePdcaStatus(phase, feature)` | 경유 via common.js | Skill pdca-phase 업데이트 | LOW |
| W25 | `lib/context-fork.js:142` | `mergeContext()` | `common.savePdcaStatus(currentStatus)` | 경유 via common.js | 컨텍스트 병합 결과 저장 | LOW |
| W26 | `lib/task/tracker.js:52` | `savePdcaTaskId()` | `savePdcaStatus(status)` | 경유 via pdca module | Task ID 저장 | LOW |
| W27 | `lib/task/tracker.js:136` | `updatePdcaTaskStatus()` | `savePdcaStatus(status)` | 경유 via pdca module | Task 상태 저장 | LOW |
| W28 | `lib/pdca/automation.js:176` | `autoAdvancePdcaPhase()` | `updatePdcaStatus(feature, nextPhase, {...})` | 경유 via status.js | 자동 phase 진행 | LOW |

### Exists Consumers (존재확인)

| # | 파일:라인 | 함수명 | 코드 스니펫 | 경로 구성 방식 | 호출 시점 | 위험도 |
|---|-----------|--------|-------------|----------------|-----------|--------|
| E1 | `lib/pdca/status.js:118` | `initPdcaStatusIfNotExists()` | `if (fs.existsSync(statusPath)) return` | getPdcaStatusPath() 경유 | 초기화 | LOW |
| E2 | `lib/task/tracker.js:200` | `findPdcaStatus()` | `return fs.existsSync(statusPath) ? statusPath : null` | **직접 path.join + PROJECT_DIR** | 파일 존재 확인 | **HIGH** |

### Config 참조

| # | 파일:라인 | 키 | 값 | 용도 | 위험도 |
|---|-----------|-----|-----|------|--------|
| C1 | `bkit.config.json:34` | `pdca.statusFile` | `"docs/.pdca-status.json"` | 설정값 (현재 코드에서 미사용) | **MEDIUM** |

---

## 위험도 분류

### HIGH (3건) - 직접 경로 구성

| # | 파일:라인 | 문제점 | 영향 |
|---|-----------|--------|------|
| 1 | `hooks/session-start.js:334` | `path.join(process.cwd(), 'docs/.pdca-status.json')` 사용. **`process.cwd()`를 사용하여 PROJECT_DIR과 불일치 가능** | PDCA phase 감지 실패 가능 |
| 2 | `lib/task/tracker.js:199` | `path.join(PROJECT_DIR, 'docs/.pdca-status.json')` 사용. getPdcaStatusPath() 미사용 | 경로 변경 시 누락 위험 |
| 3 | `lib/task/tracker.js:200` | 위와 동일 함수 `findPdcaStatus()`에서 `fs.existsSync(statusPath)` | 경로 변경 시 누락 위험 |

### MEDIUM (1건) - 설정 파일 참조

| # | 파일:라인 | 문제점 |
|---|-----------|--------|
| 1 | `bkit.config.json:34` | `"statusFile": "docs/.pdca-status.json"` 설정값이 존재하지만 코드에서 실제로 사용하지 않음 (dead config). 경로 변경 시 함께 업데이트 필요 |

### LOW (나머지 전부) - 안전한 함수 경유

- `getPdcaStatusPath()` → `getPdcaStatusFull()` / `savePdcaStatus()` 체인으로 접근
- `lib/pdca/status.js:33`의 `getPdcaStatusPath()` 1곳만 변경하면 자동 적용

---

## 경로 변경 시 영향 시나리오

### 변경 지점 요약

경로를 `docs/.pdca-status.json` → `.bkit/state/pdca-status.json` 등으로 변경할 경우:

| 변경 필요 파일 | 변경 지점 | 영향 범위 | 자동 적용 여부 |
|----------------|-----------|-----------|---------------|
| `lib/pdca/status.js:33` | `getPdcaStatusPath()` 반환값 | 25+ consumers | **자동 적용** |
| `hooks/session-start.js:334` | `detectPdcaPhase()` 내 직접 경로 | 1 consumer | **수동 변경 필요** |
| `lib/task/tracker.js:199` | `findPdcaStatus()` 내 직접 경로 | 1 consumer | **수동 변경 필요** |
| `bkit.config.json:34` | `statusFile` 설정값 | 0 (미사용) | **수동 변경 필요** |

### 사용자 시나리오별 영향

| 시나리오 | 관련 Consumer | 영향 | 리스크 |
|----------|--------------|------|--------|
| 새 세션 시작 | R6, R7, R8, R9, E1, W1 | `detectPdcaPhase()`가 이전 경로 참조 시 phase 감지 실패 → 기본값 '1' 반환 | HIGH |
| PDCA feature 생성/업데이트 | W3, W4, W5, W6 | getPdcaStatusPath() 경유이므로 자동 적용 | LOW |
| Gap 분석 완료 | R12, W15 | 자동 적용 | LOW |
| Iterator 반복 | R10, R11, W14, W23 | 자동 적용 | LOW |
| CTO/Team 세션 종료 | R13, R14, W21, W22 | 자동 적용 | LOW |
| Task ID 조회/저장 | R33~R38, W26, W27 | `findPdcaStatus()`만 직접 경로 → 파일 못 찾음 반환 | HIGH |
| 컨텍스트 압축 | R19 | 자동 적용 | LOW |
| Feature 아카이브 | W17, W18, W19 | 자동 적용 | LOW |
| 소스 파일 쓰기 | W20 | 자동 적용 | LOW |
| 컨텍스트 분기/병합 | R26, R27, W25 | 자동 적용 | LOW |

### 핵심 결론

1. **`getPdcaStatusPath()` 1곳 변경으로 25+ consumer 자동 커버** (전체의 86%)
2. **수동 변경 필수: 3곳** (`session-start.js:334`, `tracker.js:199`, `bkit.config.json:34`)
3. **`hooks/session-start.js:334`의 `process.cwd()` 사용이 가장 위험** -- `PROJECT_DIR`과 불일치 시 현재도 버그 발생 가능
4. **`bkit.config.json:34`의 `statusFile`은 dead config** -- 코드에서 미참조이나 문서화/일관성을 위해 업데이트 필요

---

## 별첨: globalCache 키

`pdca-status` 캐시 키를 사용하는 지점:

| 파일:라인 | 동작 | TTL |
|-----------|------|-----|
| `lib/pdca/status.js:127` | `globalCache.set('pdca-status', initialStatus)` | - |
| `lib/pdca/status.js:142` | `globalCache.get('pdca-status', 3000)` | 3초 |
| `lib/pdca/status.js:155` | `globalCache.set('pdca-status', status)` | - |
| `lib/pdca/status.js:191` | `globalCache.set('pdca-status', status)` | - |

캐시 키 `'pdca-status'`는 경로 변경과 무관하게 동작하므로 변경 불필요.
