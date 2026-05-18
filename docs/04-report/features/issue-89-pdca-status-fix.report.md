# Issue #89: .pdca-status.json 무한 오염 fix (v2.1.15) 완료 보고서

> **Status**: ✅ Implementation Complete (48/48 단위 테스트 PASS, 6-Layer Defense deploy 완료)
> **Issue**: [#89](https://github.com/popup-studio-ai/bkit-claude-code/issues/89) by @doing27 (2026-05-15)
> **Branch**: `feature/v2115-issue-89-pdca-status-fix`
> **Version**: v2.1.14 → **v2.1.15** (patch fix)
> **Plan Ref**: `docs/01-plan/features/issue-89-pdca-status-fix.plan.md`
> **Design Ref**: `docs/02-design/features/issue-89-pdca-status-fix.design.md`
> **Date**: 2026-05-18

---

## 1. Executive Summary

| 항목 | 값 |
|------|----|
| 핵심 문제 | `.pdca-status.json` 무한 오염 (실측 294KB, features 147중 138 garbage, history 1669중 1661 garbage) |
| Root Cause | `extractFeature` 오추출 + `updatePdcaStatus` 검증 부재 + `pre-write.js` schema 오류 |
| 부가 root cause 발견 | v2.1.7 "Issue #79 P4" fix가 schema 명명 불일치(`currentFeature` vs `primaryFeature`)로 false-negative 작동했던 잠재 버그 동시 해결 |
| 적용 방식 | **6-Layer Defense** — L1~L6 독립 layer 동시 적용 (defense-in-depth) |
| 변경 파일 | **3 코드 파일 + 3 테스트 파일 + 6 메타 파일** (= 12 파일) |
| 단위 테스트 | **48 TC 추가, 48/48 PASS** (회귀 방지) |
| Breaking 변경 | **0건** (기존 16개 호출자 default behavior 통과) |
| 마이그레이션 | 불요 (기존 garbage cleanup은 사용자 자율) |
| 버전 sync | 5 핵심 위치 (`bkit.config.json` + `.claude-plugin/plugin.json` + `.claude-plugin/marketplace.json` + `hooks/hooks.json` + `scripts/unified-bash-post.js`) + CHANGELOG entry |

---

## 2. PDCA 4-Phase 실행 결과

### Phase 1: 코드베이스 심층 분석 ✅

이슈 본문 외 **추가 버그 3건** 발견:

1. **`scripts/pre-write.js:101` schema 오류**: `currentStatus?.currentFeature` — v2/v3 schema에 `currentFeature` 필드 부재 (`status-migration.js:31,74`에서 normalize됨). 본 repo 검증 결과 `pdca-status.json` v3.0 schema는 `currentFeature: undefined`, `primaryFeature: 'bkit-v209-cc-v2194-compatibility'`. v2.1.7 fix가 **false-negative로 항상 phantom skipped 분기**.
2. **`lib/pdca/status-core.js:320` DRY 위반**: `extractFeatureFromContext`가 `extractFeature`와 거의 동일한 패턴 매칭 코드를 중복.
3. **`lib/pdca/status-core.js:210` history limit 부재**: `updatePdcaStatus`의 `history.push`에는 `addPdcaHistory`와 달리 limit/dedup 없음.

**호출 surface 매핑**:
- `extractFeature` 호출자 3건 (`scripts/pre-write.js` + `lib/core/index.js` + `lib/core/file.js`)
- `updatePdcaStatus` 호출자 16건 (광범위: hook scripts 7 + lib/pdca 6 + lib/task 1 + facade 2)

### Phase 2: 설계 ✅

`docs/01-plan/features/issue-89-pdca-status-fix.plan.md` + `docs/02-design/features/issue-89-pdca-status-fix.design.md` 작성.

**6-Layer Defense 아키텍처**:
```
편집 이벤트
   ↓
[L1] extractFeature        → 패턴 매칭 + 파일/디렉토리 검증 + GENERIC_NAMES 확장
   ↓ (정당한 feature 후보)
[L2] extractFeatureFromContext → L1 위임 (DRY)
   ↓
[L4] scripts/pre-write.js  → primaryFeature 필드 정정 + 게이트
   ↓
[L3] updatePdcaStatus      → plan/design 문서 존재 게이트 (default ON)
   ↓
[L5] history limit + dedup → consecutive 동일 entry dedup + 100 ring buffer
   ↓
[L6] 단위 테스트            → 회귀 방지 + 6 layer 모두 cover
```

### Phase 3: 구현 + 테스트 ✅

#### 3.1 코드 변경 (3 파일)

**1) `lib/core/file.js`** — Layer 1
- `GENERIC_NAMES` 19 → **65** 디렉토리 확장 (일반 백엔드/프론트 layout + 버전 + Next.js 라우트 그룹)
- 패턴 매칭 시 확장자 보유 캡처값 skip
- Fallback opt-in (`opts.allowFallback` default false)
- 함수 시그니처 backward-compat: `extractFeature(filePath, opts = {})`
- `module.exports`에 `GENERIC_NAMES` 추가

**2) `lib/pdca/status-core.js`** — Layers 2, 3, 5
- `extractFeatureFromContext` → `extractFeature` 위임 (L2)
- `shouldUpdate(feature, requireDocs, docCheckFn)` 헬퍼 신규 (L3, pure function, testability)
- `appendHistoryEntry(history, entry, limit)` 헬퍼 신규 (L5, pure function, ring buffer + dedup)
- `updatePdcaStatus`:
  - 새 옵션 `opts = { requireDocs: true, docCheckFn: ... }`
  - 게이트 통과 시에만 등록
  - history는 `appendHistoryEntry` 위임
- exports에 `shouldUpdate` + `appendHistoryEntry` 추가

**3) `scripts/pre-write.js`** — Layer 4
- `currentStatus?.currentFeature` → `currentStatus?.primaryFeature` 정정
- 주석 명시 (v2.1.7 Issue #79 P4 + v2.1.15 Issue #89 referenc)

#### 3.2 테스트 추가 (3 파일, 48 TC)

| 파일 | TC 수 | Layer | 결과 |
|------|------|-------|------|
| `tests/unit/file-extract-feature.test.js` | 20 | L1 | **20/20 PASS** |
| `tests/unit/extract-feature-from-context.test.js` | 10 | L2 | **10/10 PASS** |
| `tests/unit/pdca-status-gating.test.js` | 18 | L3 + L5 | **18/18 PASS** |
| **합계** | **48** | — | **48/48 PASS** |

검증 명령:
```bash
node --test tests/unit/file-extract-feature.test.js \
              tests/unit/extract-feature-from-context.test.js \
              tests/unit/pdca-status-gating.test.js
# tests 48 / pass 48 / fail 0
```

#### 3.3 버전 sync (6 파일)

| 파일 | 변경 |
|------|------|
| `bkit.config.json` | `version: 2.1.14 → 2.1.15` |
| `.claude-plugin/plugin.json` | `version: 2.1.14 → 2.1.15` |
| `.claude-plugin/marketplace.json` | `version: 2.1.14 → 2.1.15` |
| `hooks/hooks.json` | `description: bkit v2.1.14 → v2.1.15` |
| `scripts/unified-bash-post.js` | `state.bash_post.version: '2.1.14' → '2.1.15'` |
| `CHANGELOG.md` | v2.1.15 신규 entry (이슈 #89 details + 6-Layer Defense 명시) |

#### 3.4 PDCA 문서 (한국어)

| 파일 | 내용 |
|------|------|
| `docs/01-plan/features/issue-89-pdca-status-fix.plan.md` | 문제 정의 + Phase 1 추가 발견 + 호출 surface + 위험/완화 |
| `docs/02-design/features/issue-89-pdca-status-fix.design.md` | 6-Layer Defense 설계 + diff 형식 변경 명세 + 영향 분석 표 |
| `docs/04-report/features/issue-89-pdca-status-fix.report.md` | **본 문서** |

### Phase 4: QA + Commit + PR (진행 중)

- 단위 테스트 48/48 PASS ✅
- Smoke test: `node -e "require('./scripts/pre-write.js')"` ✅
- Smoke test: `extractFeature` 표 검증 ✅
- 본 PR 작업 진행 중

---

## 3. Component Impact Matrix

| Component | Touched | Direction |
|-----------|---------|-----------|
| `lib/core/file.js` | extractFeature 강화 + GENERIC_NAMES export | L1 강화 |
| `lib/pdca/status-core.js` | shouldUpdate + appendHistoryEntry 헬퍼 신규 + extractFeatureFromContext DRY + updatePdcaStatus 게이트 + history dedup/limit | L2 + L3 + L5 |
| `scripts/pre-write.js` | primaryFeature schema 정정 | L4 |
| `tests/unit/` | 48 TC 신규 | L6 |
| `bkit.config.json` + `.claude-plugin/*` + `hooks/hooks.json` + `scripts/unified-bash-post.js` | version 2.1.15 sync | meta |
| `CHANGELOG.md` | v2.1.15 entry | docs |
| `docs/01-plan` + `docs/02-design` + `docs/04-report` | 한국어 PDCA 문서 3건 | docs |
| **기타 16개 `updatePdcaStatus` 호출자** | 무변경, default behavior 통과 | safe |

---

## 4. Compatibility Assessment

### 4.1 Backward-Compat

| 변경 | Backward-Compat | 근거 |
|------|:---:|------|
| `extractFeature(filePath)` → `extractFeature(filePath, opts = {})` | ✅ | 두 번째 인자 없이 호출 시 `opts = {}`, `allowFallback`은 falsy → default 새 동작 |
| `updatePdcaStatus(feature, phase, data)` → `(feature, phase, data, opts = {})` | ✅ | 네 번째 인자 없이 호출 시 `opts = {}`, `requireDocs`는 default true |
| `extractFeatureFromContext` DRY 위임 | ✅ | 동일 API, 내부 구현만 위임 |
| `pre-write.js` schema 정정 | ✅ | v3 schema에 부재한 필드를 정확한 필드로 교체 |
| `history` ring buffer 100 | ✅ | 기존 `addPdcaHistory`와 동일 정책, 일관성 향상 |
| `GENERIC_NAMES` 확장 | ⚠️ Soft-breaking | `auth`/`cms`/`dashboard` 등이 이제 generic 차단. 정당한 feature 등록은 `/pdca plan <feature>` 명시로 진행 가능 (L3 게이트 안전망) |

### 4.2 fallback 영향

- 기존 fallback 동작이 자동으로 `''` 반환으로 바뀜 → 자동 등록 차단
- 정당한 feature 등록은 PDCA workflow 통해서만 (의도된 변화)
- 본 repo 검증: 본 fix 적용 후 smoke `extractFeature('app/services/broadcast_service.py')` → `''` ✅, `extractFeature('domains/billing/service.py')` → `'billing'` ✅

### 4.3 사용자 환경 영향

- 기존 garbage가 누적된 `.pdca-status.json`은 본 fix만으로는 cleanup되지 않음
- 사용자 측 cleanup 권장 사항 (별도 안내):
  ```bash
  # 백업 후 신규 init
  mv .bkit/state/pdca-status.json .bkit/state/pdca-status.json.bak
  # bkit 다음 실행 시 자동 v3 schema init
  ```
- 또는 features/activeFeatures를 명시 등록된 cycle만 남기는 수작업 cleanup

---

## 5. 위험 + 완화 (Final)

| 위험 | 완화 상태 |
|------|---------|
| 게이트 추가로 정당한 feature 등록 누락 | ✅ 16개 호출처 모두 PDCA lifecycle order 보장 — plan 문서 작성 후 진입. L3 게이트 통과 |
| extractFeature 변경으로 기존 동작 회귀 | ✅ 단위 테스트 20 TC + 통합 smoke test PASS |
| history dedup으로 정당한 다중 업데이트 누락 | ✅ consecutive만 dedup, 다른 phase/action은 정상 push (L5-TC04/05/06 검증) |
| version sync 위치 누락 | ✅ grep BKIT_VERSION 후 5+ 위치 일괄 sync + CHANGELOG entry |
| Soft-breaking `GENERIC_NAMES` 확장으로 `auth`/`cms`/`dashboard` 자동 등록 끊김 | ✅ L3 게이트 + `/pdca plan <feature>` 명시 등록 경로 보존. Trade-off 결정 명시 (false-positive 우선) |

---

## 6. Definition of Done

- [x] Phase 1 — 코드베이스 심층 분석 (호출 surface 매핑 + 추가 버그 3건 발견)
- [x] Phase 2 — 설계 문서 작성 (plan + design 한국어)
- [x] Phase 3 — 6-Layer 구현 (3 코드 파일 + 3 테스트 파일 + 6 메타 파일)
- [x] Phase 3 — 단위 테스트 48 TC 작성 + **48/48 PASS** 검증
- [x] Phase 3 — 버전 sync 5 핵심 + CHANGELOG entry
- [x] Phase 4 — Report 작성 (본 문서)
- [ ] Phase 4 — Commit (다음 단계)
- [ ] Phase 4 — Push to origin
- [ ] Phase 4 — PR open + reviewer assign

---

## 7. 참조 파일

### 변경 파일 (12)
- `lib/core/file.js`
- `lib/pdca/status-core.js`
- `scripts/pre-write.js`
- `tests/unit/file-extract-feature.test.js` (신규)
- `tests/unit/extract-feature-from-context.test.js` (신규)
- `tests/unit/pdca-status-gating.test.js` (신규)
- `bkit.config.json`
- `.claude-plugin/plugin.json`
- `.claude-plugin/marketplace.json`
- `hooks/hooks.json`
- `scripts/unified-bash-post.js`
- `CHANGELOG.md`

### PDCA 문서 (3 신규)
- `docs/01-plan/features/issue-89-pdca-status-fix.plan.md`
- `docs/02-design/features/issue-89-pdca-status-fix.design.md`
- `docs/04-report/features/issue-89-pdca-status-fix.report.md`

### 관련 자료
- [Issue #89](https://github.com/popup-studio-ai/bkit-claude-code/issues/89) by @doing27
- v2.1.7 부분 fix commit (`scripts/pre-write.js:98-117`, Issue #79 P4) — 본 fix로 잠재 false-negative 해결
- PR (Phase 4 종료 후 링크)
