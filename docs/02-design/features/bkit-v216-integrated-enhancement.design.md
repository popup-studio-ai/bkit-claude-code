# bkit v2.1.6 통합 고도화 설계 문서

> **작성일**: 2026-04-15
> **대상 버전**: bkit v2.1.6 (v2.1.5 기반)
> **선행 문서**: `docs/01-plan/features/bkit-v216-integrated-enhancement.plan.md` (18 ENH, ~36h)
> **선택 아키텍처**: **Option C — Pragmatic Balance**
> **베이스 CC 버전**: v2.1.108 (69개 연속 호환)

---

## 1. Overview

### 1.1 설계 범위

본 Design 문서는 v2.1.6 통합 plan의 18 ENH 중 **신규 인터페이스/모듈 변경이 발생하는 8건**의 상세 설계를 다룬다. 기존 ENH(refactor 중심)는 Plan §3 참조로 갈음.

| 카테고리 | 상세 설계 범위 (본 문서) | Plan 참조 |
|---------|--------------------------|----------|
| **🆕 Issue #77 Phase A (4건)** | ENH-226/227/228/229 — §2~§7 | — |
| **CC 통합** | ENH-203 PreCompact decision:block 인터페이스 — §8 | Plan §3 |
| **DX** | ENH-202 context:fork READONLY 5 skills — §9 | Plan §3 |
| **CC 회귀 방어** | ENH-214 audit-output-styles.js spec — §10 | Plan §4 |
| **유기적 연동** | ENH-188 unified-stop deprecated 제거 spec — §11 | Plan §3 |
| **기타 13건** | 단순 refactor — Plan 참조만 | Plan §3 |

### 1.2 Architecture Decision Record (ADR)

| ADR | 결정 | 근거 |
|-----|------|------|
| ADR-01 | Phase A 모듈 분할: **단일 파일 `lib/pdca/session-title.js` + 보조 `lib/core/session-title-cache.js`** | 디렉터리 분할(Option B)은 v2.2.0 Phase B 영역 침범. 단일 파일은 Issue #77 phase-change-only 효과 미달성 위험 |
| ADR-02 | Cache: **file-based `.bkit/runtime/session-title-cache.json`** + 기존 `lib/concurrency/file-lock.js` 재사용 | hook은 매 호출마다 새 Node process → in-memory cache 휘발 → file이 유일한 일관성 매체 |
| ADR-03 | Config 스키마: **3-way 토글** (`ui.{sessionTitle,dashboard,contextInjection}.enabled`) + `staleTTLHours` | 사용자 요청 (Issue #77 본문 "opt-out 옵션" 명시). 단일 토글은 dashboard만 끄고 sessionTitle은 유지 같은 세분화 불가 |
| ADR-04 | 기본값 모두 `enabled: true` (호환성 우선) | 기존 PDCA 사용자 영향 0. opt-out은 사용자 명시적 선택 |
| ADR-05 | Stale TTL 기본 24h, `0`으로 비활성화 가능 | 사용자 사례("ui" feature 누적) 24h면 충분, 장기 PDCA 세션은 168h(1주) 등 조정 가능 |
| ADR-06 | Migration: 6 파일 모두 `import { generateSessionTitle } from 'lib/pdca/session-title.js'` 1줄 변경 + 기존 inline 로직 제거 | 단일 진실원, G9 게이트로 회귀 방지 |

---

## 2. ENH-226 — bkit.config.json UI Opt-out 토글 설계

### 2.1 스키마 확장 (bkit.config.json)

```jsonc
{
  "version": "2.1.6",
  "ui": {                                // 🆕 신규 섹션
    "sessionTitle": {
      "enabled": true,                   // 기본 true (호환성)
      "staleTTLHours": 24,               // 0 = TTL 비활성, ENH-229
      "format": "[bkit] {action} {feature}"  // Phase B 확장 여지 (현재 hardcoded)
    },
    "dashboard": {
      "enabled": true,
      "sections": ["progress", "workflow", "impact", "agent", "control"]
    },
    "contextInjection": {
      "enabled": true,
      "ambiguityThreshold": 0.7          // 기존 triggers.confidenceThreshold와 별개
    }
  },
  // ... 기존 필드 유지
}
```

### 2.2 Loader API (`lib/core/config.js` 확장)

```javascript
// 기존: getBkitConfig()
// 신규:
export function getUIConfig() {
  const config = getBkitConfig()
  return {
    sessionTitle: {
      enabled: config?.ui?.sessionTitle?.enabled ?? true,
      staleTTLHours: config?.ui?.sessionTitle?.staleTTLHours ?? 24,
      format: config?.ui?.sessionTitle?.format ?? '[bkit] {action} {feature}'
    },
    dashboard: {
      enabled: config?.ui?.dashboard?.enabled ?? true,
      sections: config?.ui?.dashboard?.sections ?? ['progress', 'workflow', 'impact', 'agent', 'control']
    },
    contextInjection: {
      enabled: config?.ui?.contextInjection?.enabled ?? true,
      ambiguityThreshold: config?.ui?.contextInjection?.ambiguityThreshold ?? 0.7
    }
  }
}
```

### 2.3 가드 적용 지점 (3개 영역)

| 가드 위치 | 조건 | 효과 |
|----------|------|------|
| `lib/pdca/session-title.js` 진입부 | `if (!ui.sessionTitle.enabled) return undefined` | 6개 hook 모두 sessionTitle 미발행 |
| `hooks/session-start.js` dashboard render 진입 | `if (!ui.dashboard.enabled) skipDashboardRender()` | SessionStart 박스 5종 미출력 |
| `scripts/user-prompt-handler.js` contextParts 빌드 | `if (!ui.contextInjection.enabled) return outputEmpty()` | additionalContext 비어 있음 |

---

## 3. ENH-227 — sessionTitle 단일화 (lib/pdca/session-title.js)

### 3.1 모듈 인터페이스

```javascript
// lib/pdca/session-title.js
import { getUIConfig } from '../core/config.js'
import { getPdcaStatusFull } from './status.js'
import { readCache, writeCache } from '../core/session-title-cache.js'

/**
 * sessionTitle 생성 (단일 진실원)
 *
 * @param {object} opts
 * @param {string} [opts.action]   - SKILL/AGENT 종료 시 'PLAN'/'DESIGN'/'DO' 등
 * @param {string} [opts.feature]  - 명시적 feature (생략 시 PDCA primaryFeature 사용)
 * @param {string} [opts.phase]    - 명시적 phase (생략 시 PDCA currentPhase 사용)
 * @param {string} [opts.sessionId] - CC sessionId (cache key용)
 * @returns {string|undefined} - title 문자열 or undefined (CC auto-title 보존)
 */
export function generateSessionTitle({ action, feature, phase, sessionId } = {}) {
  // 1. Config 가드 (ENH-226)
  const ui = getUIConfig()
  if (!ui.sessionTitle.enabled) return undefined

  // 2. PDCA 상태 fallback (ENH-227)
  const pdcaStatus = getPdcaStatusFull()
  const resolvedFeature = feature ?? pdcaStatus?.primaryFeature
  const resolvedPhase = phase ?? pdcaStatus?.currentPhase

  if (!resolvedFeature) return undefined  // PDCA 없음 → CC auto-title

  // 3. Stale TTL 가드 (ENH-229)
  if (isStaleFeature(pdcaStatus, resolvedFeature, ui.sessionTitle.staleTTLHours)) {
    return undefined
  }

  // 4. phase-change-only 가드 (ENH-228)
  const cache = readCache()
  if (
    cache?.sessionId === sessionId &&
    cache?.feature === resolvedFeature &&
    cache?.phase === resolvedPhase &&
    cache?.action === (action ?? null)
  ) {
    return undefined  // 동일 → 재발행 안 함
  }

  // 5. 발행 + 캐시 갱신
  const label = action ?? resolvedPhase?.toUpperCase()
  const title = label
    ? `[bkit] ${label} ${resolvedFeature}`
    : `[bkit] ${resolvedFeature}`

  writeCache({ sessionId, feature: resolvedFeature, phase: resolvedPhase, action: action ?? null })
  return title
}

function isStaleFeature(pdcaStatus, feature, ttlHours) {
  if (!ttlHours || ttlHours <= 0) return false  // TTL 비활성
  const lastUpdated = pdcaStatus?.features?.[feature]?.timestamps?.lastUpdated
  if (!lastUpdated) return false  // timestamp 없으면 통과
  const ageMs = Date.now() - new Date(lastUpdated).getTime()
  return ageMs > ttlHours * 60 * 60 * 1000
}
```

### 3.2 Migration Map — 6개 파일

| 파일:라인 | Before (현재) | After (Phase A) |
|----------|--------------|-----------------|
| `scripts/user-prompt-handler.js:252-265` | inline `feature ? (phase ? ... : ...) : undefined` 템플릿 + `console.log(JSON.stringify({...sessionTitle...}))` | `import { generateSessionTitle }` + `const sessionTitle = generateSessionTitle({ sessionId })` |
| `hooks/session-start.js:199-216` | 동일 inline 템플릿 (variable: `primaryFeature`, `currentPhase`) | `generateSessionTitle({ sessionId })` (PDCA 자동 fallback) |
| `scripts/pdca-skill-stop.js:330-348` | `feature && action ? \`[bkit] ${action.toUpperCase()} ${feature}\` : undefined` | `generateSessionTitle({ action, feature, sessionId })` |
| `scripts/pdca-skill-stop.js:363-374` | 동일 (2번째 호출) | 동일 |
| `scripts/plan-plus-stop.js:68-88` | 동일 패턴 | 동일 |
| `scripts/iterator-stop.js:324-341` | 동일 패턴 | 동일 |
| `scripts/gap-detector-stop.js:496-513` | 동일 패턴 | 동일 |

### 3.3 sessionId 획득 경로

| Hook | sessionId 획득 |
|------|---------------|
| UserPromptSubmit | hook input JSON `session_id` 필드 (CC 표준) |
| SessionStart | hook input JSON `session_id` |
| Skill/Agent Stop | hook input JSON `session_id` |

→ 모든 hook에서 `parseHookInput().session_id` 또는 `process.env.CLAUDE_SESSION_ID`로 일관 획득.

---

## 4. ENH-228 — phase-change-only Cache (lib/core/session-title-cache.js)

### 4.1 신규 모듈 spec

```javascript
// lib/core/session-title-cache.js
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { withFileLock } from '../concurrency/file-lock.js'  // 기존 패턴 재사용
import { PROJECT_DIR } from './platform.js'

const CACHE_PATH = `${PROJECT_DIR}/.bkit/runtime/session-title-cache.json`

/**
 * @returns {{sessionId, feature, phase, action, timestamp} | null}
 */
export function readCache() {
  if (!existsSync(CACHE_PATH)) return null
  try {
    return JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  } catch {
    return null  // corrupt cache → 무효화
  }
}

export function writeCache({ sessionId, feature, phase, action }) {
  withFileLock(CACHE_PATH, () => {
    mkdirSync(dirname(CACHE_PATH), { recursive: true })
    writeFileSync(
      CACHE_PATH,
      JSON.stringify({
        sessionId,
        feature,
        phase: phase ?? null,
        action: action ?? null,
        timestamp: new Date().toISOString()
      }, null, 2)
    )
  })
}

export function clearCache() {
  if (existsSync(CACHE_PATH)) writeFileSync(CACHE_PATH, '{}')
}
```

### 4.2 Cache 스키마

```json
{
  "sessionId": "abc123def456",
  "feature": "bkit-v216-integrated-enhancement",
  "phase": "design",
  "action": null,
  "timestamp": "2026-04-15T14:23:00.000Z"
}
```

### 4.3 Cache 생명주기

| 이벤트 | 동작 |
|--------|------|
| 새 sessionId 등장 | cache hit miss → 강제 새 emit + cache 갱신 |
| 동일 sessionId + 동일 phase/feature/action | cache hit → `undefined` 반환 (CC auto-title 보존) |
| phase 변경 (plan→design) | cache miss → 새 emit + cache 갱신 |
| feature 변경 | cache miss → 새 emit |
| Skill/Agent action 변경 | cache miss → 새 emit |
| `bkit.config.json`의 `ui.sessionTitle.enabled = false` | 모든 호출에서 즉시 `undefined` (cache 무관) |

### 4.4 Concurrency 처리

CTO Team 12명 병렬 emit 시 동시 write 발생 가능. `lib/concurrency/file-lock.js`의 기존 패턴(advisory lock with retry) 재사용. G4 게이트(pdca-status.json concurrent write 테스트) 동일 방식 적용.

---

## 5. ENH-229 — Stale Feature TTL (24h)

### 5.1 로직 (lib/pdca/session-title.js 내)

```javascript
function isStaleFeature(pdcaStatus, feature, ttlHours) {
  if (!ttlHours || ttlHours <= 0) return false  // 0 = TTL 비활성
  const lastUpdated = pdcaStatus?.features?.[feature]?.timestamps?.lastUpdated
  if (!lastUpdated) return false               // timestamp 없으면 통과 (방어)
  const ageMs = Date.now() - new Date(lastUpdated).getTime()
  return ageMs > ttlHours * 60 * 60 * 1000
}
```

### 5.2 사용자 사례 매핑 (Issue #77 본문)

> "ui"는 과거에 PDCA로 등록했던 feature 이름인데, 지금은 더 이상 그 작업을 하지 않는데도 여전히 표시됨

- 24h 미초과 시: 정상 동작 (현재 작업 중인 feature 반영)
- 24h 초과 시: `undefined` 반환 → CC auto-title 사용 → **사용자 사례 정확 해결**
- 사용자 명시 비활성: `staleTTLHours: 0` (장기 PDCA 세션 사용자)
- 장기 사용자 추천값: `staleTTLHours: 168` (1주)

---

## 6. Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                  CC Hook 발생 (6 entry points)                    │
│  UserPromptSubmit, SessionStart, Skill:pdca:Stop,                │
│  Skill:plan-plus:Stop, Agent:iterator:Stop, Agent:gap-detector:Stop│
└──────────────────────────────────────────────────────────────────┘
                                ↓
                ┌──────────────────────────────┐
                │  generateSessionTitle({...})  │
                │  (lib/pdca/session-title.js)  │
                └──────────────────────────────┘
                                ↓
        ┌───────────────────────┴───────────────────────┐
        ↓                       ↓                       ↓
   ┌──────────┐           ┌──────────┐           ┌──────────┐
   │ 1. Config │           │ 2. PDCA  │           │ 3. Cache │
   │ Guard     │           │ Status   │           │ Compare  │
   │ ENH-226   │           │ +Stale   │           │ ENH-228  │
   │           │           │ ENH-229  │           │          │
   └──────────┘           └──────────┘           └──────────┘
        ↓ disabled              ↓ stale                ↓ same
        ↓ → undefined           ↓ → undefined          ↓ → undefined
        │                       │                       │
        └─────── NEW EMIT ──────┴───────────────────────┘
                                ↓
                ┌──────────────────────────────┐
                │  writeCache(.bkit/runtime/    │
                │  session-title-cache.json)    │
                └──────────────────────────────┘
                                ↓
                    [bkit] DESIGN feature-name
                                ↓
                       Claude Code UI
```

---

## 7. Test Plan (Phase A — TC-A1~A6 추가)

### 7.1 신규 6 TC 상세

| ID | Level | Title | Setup | Action | Expected |
|----|-------|-------|-------|--------|----------|
| **TC-A1** | L1 | sessionTitle opt-out 가드 | `bkit.config.json`에 `ui.sessionTitle.enabled: false` | 6개 hook 각각 호출 (mock pdca-status 활성) | 모두 `sessionTitle: undefined` |
| **TC-A2** | L1 | dashboard opt-out 가드 | `ui.dashboard.enabled: false` | SessionStart hook 호출 | dashboard 5종 박스 미출력 |
| **TC-A3** | L1 | contextInjection opt-out 가드 | `ui.contextInjection.enabled: false` | UserPromptSubmit hook 호출 | `additionalContext: ""` |
| **TC-A4** | L3 | phase-change cache hit | sessionId='s1', feature='f1', phase='plan' 1회 호출 | 동일 인자로 2회차 호출 | 1차: 발행, 2차: `undefined` |
| **TC-A5** | L3 | phase 변경 시 재발행 | TC-A4 상태에서 phase='design'으로 변경 | 호출 | 새 title 발행 + cache 갱신 |
| **TC-A6** | L3 | stale feature TTL | `lastUpdated`를 25h 전으로 mock, `staleTTLHours: 24` | 호출 | `undefined` 반환 |

### 7.2 회귀 테스트 (기존 TC 영향)

| 기존 TC | 영향 | 조치 |
|--------|------|------|
| ENH-187 sessionTitle hook 기본 동작 | 6 → 1 emit 변경, 의미 동일 | 회귀 재실행, expectation 갱신 (1회만) |
| `bkit.config.json` 스키마 검증 TC | 신규 `ui.*` 필드 추가 | 스키마 validator에 ui 섹션 추가 |
| Concurrent write G4 | session-title-cache.json도 대상 | G4 dataset에 cache 파일 추가 |

### 7.3 통합 TC 합계

| 카테고리 | 기존 (Plan) | Phase A 추가 | 총계 |
|---------|:---:|:---:|:---:|
| L1 | 22 | +3 | 25 |
| L2 | 14 | 0 | 14 |
| L3 | 28+2 | +3 | 33 |
| L4 | 6+1 | 0 | 7 |
| L5 | 4+1 | 0 | 5 |
| **합계** | **78** | **+6** | **84** |

---

## 8. ENH-203 — PreCompact decision:block 인터페이스

(Plan §3 참조, 핵심 인터페이스만 명시)

```javascript
// hooks/pre-compact.js (신규)
const input = parseHookInput()
const pdcaStatus = getPdcaStatusFull()

// PDCA 진행 중이면서 critical phase(do/check/act)에서 compaction 차단
if (pdcaStatus?.primaryFeature && ['do','check','act'].includes(pdcaStatus.currentPhase)) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: `PDCA ${pdcaStatus.currentPhase} phase 진행 중. compaction 후 컨텍스트 손실 위험. /pdca status로 확인 후 수동 진행 권장.`
  }))
  process.exit(2)
}
```

---

## 9. ENH-202 — context:fork READONLY 5 skills

대상 5 skills (Plan §3 확정): qa-test-planner, gap-detector(skill), code-analyzer, audit, rollback. 각 SKILL.md frontmatter에 `context: fork` 추가. 부수 효과(상위 컨텍스트 격리) 검증 TC 1건씩.

---

## 10. ENH-214 — audit-output-styles.js spec

```javascript
// scripts/audit-output-styles.js (신규)
// 4개 output style 파일 frontmatter 무결성 + 본문 self-contained 검증
// G8 게이트: exit 0 == pass
const styleFiles = glob('output-styles/*.md')
for (const file of styleFiles) {
  const fm = parseFrontmatter(file)
  assert(fm.name && fm.description, `${file}: name/description 누락`)
  assert(/Output Style:/.test(readFile(file)), `${file}: self-contained 본문 필요 (CC #47482 회귀 방어)`)
}
```

---

## 11. ENH-188 — unified-stop deprecated 제거

scripts/unified-stop.js (677행) 폐기. 5개 specific stop handler(pdca-skill-stop, plan-plus-stop, iterator-stop, gap-detector-stop, subagent-stop)로 분기 완전 이전. hooks.json `Stop` 매핑 5개로 분리. 회귀 E2E 테스트 4h.

### 11.3 Session Guide (Implementation Module Map)

| Module | 파일 | 담당 ENH | 공수 | 의존 |
|--------|------|---------|:---:|------|
| **M1: Config Loader** | `lib/core/config.js` 확장 + `bkit.config.json` 스키마 | ENH-226 | 1h | — |
| **M2: Session Title Cache** | `lib/core/session-title-cache.js` 신설 | ENH-228 (보조) | 1h | M1 |
| **M3: Session Title Generator** | `lib/pdca/session-title.js` 신설 | ENH-227, 228, 229 | 1h | M1, M2 |
| **M4: Hook Migration** | 6 파일 inline 로직 → import 교체 | ENH-227 | 1.5h | M3 |
| **M5: PreCompact Hook** | `hooks/pre-compact.js` 신설 + hooks.json 등록 | ENH-203 | 3h | — |
| **M6: Audit Script** | `scripts/audit-output-styles.js` | ENH-214 | 30m | — |
| **M7: unified-stop 제거** | `scripts/unified-stop.js` 삭제 + 5 handler 분리 | ENH-188 | 4h | — |
| **M8: Refactor (기존)** | catch 래핑/Bash 패턴/dead code/MEMORY 정리 | ENH-201/207/208/210~213/167/206/209 | ~10h | — |
| **M9: Test Generation** | TC-A1~A6 + 기존 TC 회귀 + 신규 ENH TC | All | 9h | M3~M8 |
| **M10: Docs & CHANGELOG** | README opt-out 가이드, CHANGELOG, MON-CC-04 | ENH-226, 모니터링 | 1.5h | All |

**권장 세션 분할** (5 세션):
1. **Session 1** (Phase A 핵심, ~3h): M1 → M2 → M3 (`/pdca do {feature} --scope M1,M2,M3`)
2. **Session 2** (Migration, ~1.5h): M4 (`--scope M4`)
3. **Session 3** (CC 통합, ~3.5h): M5, M6 (`--scope M5,M6`)
4. **Session 4** (Refactor, ~14h): M7, M8 (`--scope M7,M8`) — 가장 긴 세션, 분할 가능
5. **Session 5** (QA & Docs, ~10.5h): M9, M10 (`--scope M9,M10`)

---

## 12. Risk & Mitigation

| 위험 | 확률 | 영향 | 완화 |
|------|:---:|:---:|------|
| file-lock race condition (CTO Team 12 병렬) | M | H | 기존 lib/concurrency 패턴 + G4 게이트 데이터셋 확장 (cache 파일 추가) |
| sessionId 미수신 hook 존재 | L | M | 모든 hook input JSON에 `session_id` 표준 (CC v2.1.78+ 보장), fallback `process.env.CLAUDE_SESSION_ID` |
| stale TTL이 장기 PDCA 사용자 영향 | M | L | `staleTTLHours: 0` 비활성 옵션 명시 + README 가이드 |
| 기본값 변경으로 기존 사용자 혼란 | L | H | 모두 `enabled: true` 기본 → 영향 0, opt-out은 명시적 선택만 |
| 6 파일 마이그레이션 누락 | L | H | G9 게이트: `grep -r "sessionTitle" scripts/ hooks/` 결과 검증 |
| Issue #77 사용자 만족도 미달 | L | H | v2.1.6-rc 배포 후 이슈 #77 코멘트로 PoC 검증 요청 |

---

## 13. Acceptance Criteria

### Phase A 완료 조건 (Issue #77 CLOSED 기준)

- [ ] `bkit.config.json` `ui.{sessionTitle,dashboard,contextInjection}.enabled: false` 시 각 영역 출력 0건
- [ ] `lib/pdca/session-title.js` 단일 진입점, 6 파일에서 inline 로직 0건 (G9 grep)
- [ ] 동일 phase+feature 2회 연속 호출 시 emit 1회 (TC-A4 pass)
- [ ] phase 전환 시 emit 1회 (TC-A5 pass)
- [ ] `lastUpdated > 24h` feature 시 `undefined` 반환 (TC-A6 pass)
- [ ] CTO Team 12 병렬 실행 시 cache file lock 정상 (G4 데이터셋 통과)
- [ ] README + `docs/02-design/config-schema.md`에 ui opt-out 가이드 명문화
- [ ] CHANGELOG에 "Issue #77 hotfix" 섹션 + opt-out 사용법 예시

### 통합 v2.1.6 완료 조건

- [ ] 18 ENH 모두 구현 완료
- [ ] G1~G9 게이트 9건 모두 pass
- [ ] 84 TC 모두 pass (L1: 25, L2: 14, L3: 33, L4: 7, L5: 5)
- [ ] Match Rate ≥ 95%
- [ ] CC v2.1.107 + v2.1.108 회귀 smoke 0건
- [ ] **이슈 #77 코멘트로 v2.1.6-rc 테스트 요청 발송** + 사용자 confirm

---

## 14. Implementation Order

1. **M1 → M2 → M3** (Phase A 신규 모듈 — 의존 chain)
2. **M4** (6 파일 마이그레이션 — M3 완성 전제)
3. **M6** (audit script — 독립 가능, 빠른 승리)
4. **M5** (PreCompact hook — 독립)
5. **M7** (unified-stop 제거 — refactor 영역)
6. **M8** (기존 ENH refactor — 병렬 가능)
7. **M9** (전체 TC — 모든 모듈 완성 후)
8. **M10** (Docs/CHANGELOG — 마지막)

## 15. References

- 본 Design: `docs/02-design/features/bkit-v216-integrated-enhancement.design.md`
- 선행 Plan: `docs/01-plan/features/bkit-v216-integrated-enhancement.plan.md`
- GitHub Issue #77: https://github.com/popup-studio-ai/bkit-claude-code/issues/77
- CC v2.1.108 영향 분석: `docs/04-report/features/cc-v2107-v2108-impact-analysis.report.md`
- 관련 코드:
  - `scripts/user-prompt-handler.js:252-265`
  - `hooks/session-start.js:199-216`
  - `lib/concurrency/file-lock.js` (재사용)
  - `lib/core/config.js` (확장)
