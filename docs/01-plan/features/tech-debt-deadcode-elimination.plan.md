# S4 — Tech-Debt & Dead-Code Elimination 계획서 (PRD + Plan)

> **Sprint**: `tech-debt-deadcode-elimination` (마스터 플랜 S4) · **Branch**: `release/v2.1.22-hardening`
> **Trust**: L4 · **Scope**: P1 · **ENH**: ENH-336 ~ ENH-342
> **dependsOn**: — (독립, S3a 전 완료) · **estTokens**: ~50K
> **Date**: 2026-06-01 · **Author**: kay kim
> **입력 근거**: 마스터 플랜 §10 S4 + 본 세션 전수 실측(2026-06-01)

---

## 1. Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | bkit가 빠르게 성장하며 데드코드(pdca-eval-* 6 stub, test skip, dead export, orphan script, stale state)가 누적되었다고 마스터 플랜이 추정. S4는 이를 제거해 유지보수성을 높인다. **단, 실측 결과 추정은 raw-match 과대집계였고 bkit는 이미 청결하다(§2).** |
| **WHO** | bkit 컨트리뷰터(유지보수자), 외부 dogfooder(코드베이스 신뢰). |
| **WHAT** | ENH-336 pdca-eval governance 확정 / ENH-337 test skip triage / ENH-338 TODO triage / ENH-339 dead lib module / ENH-340 orphan script·stale state / ENH-341 removal manifest. |
| **WHAT NOT** | 226 contract assertion baseline 축소 · immutable 역사 baseline(v2.1.9/v2.1.16) 훼손 · 동작하는 tested 도구 제거 · pdca-eval stub 제거(L4 계약 위반). |
| **RISK** | (a) **pdca-eval stub 제거 시 contract baseline v2.1.9 L4 governance 위반** — design에서 contract 확인 필수(확인 완료: 제거 불가). (b) 데드코드 오판(동적 require/hook dispatch/test 의존이 live) — bkit 자체 detector + 전수 ref 교차검증으로 완화. |
| **SUCCESS** | pdca-eval governance 확정(유지 결정 + 사유 lock) · 226 assertion 보존 · 전 test green · removal manifest(항목별 safety justification) 완성 · 회귀 0. |
| **SCOPE** | ENH-336~342, ~50K. gate M3(=0), M7. |

---

## 2. 전수 실측 (2026-06-01) — 추정 교정

> **원칙(S2 교훈 계승)**: raw-match 추정 맹신 금지, 실측 우선. "삭제할 코드 vs 지킬 코드"를 도구·계약·테스트 근거로 확정.

| ENH | 마스터 플랜 추정 | **실측 (도구/근거)** | 판정 |
|-----|----------------|---------------------|------|
| 336 pdca-eval 6 stub | 제거 가능 여부 결정 | v2.1.9 + v2.1.16 baseline 모두 6 등재 + L4 규칙 `Active+Deprecated===agents+6` + stub `deprecatedIn:v2.1.13` 보유. 현재 L4 PASS(exit 0). | **제거 불가 — 유지(거버넌스 lock)** |
| 337 test skip | 19파일 / 491 raw | `\b(it\|describe\|test\|context\|suite)\.skip\b` = **0**, `.only` = 0, `xit(`=0(412는 `process.exit(` substring 오매칭). 커스텀 `skip()` 헬퍼는 조건부 skip 인프라(legitimate). | **dead disabled test 0** |
| 338 TODO/FIXME | 5건 | lib/scripts/hooks 전체 **1건**(registry.js:185, S6서 추가한 의도적 reconcile-pin forward-TODO). | **유지(의도적)** |
| 339 dead lib module | 검토 | `node scripts/check-deadcode.js` → **Dead(NEW)=0** (188 모듈: 141 live / 47 exempt[type-only port·facade·dynamic] / 0 legacy debt). | **dead module 0** |
| 340 orphan script | 검토 | 7 미참조 후보 전수 검증: check-deadcode/check-guards/check-test-tracking → `.github/workflows/contract-check.yml`(CI), verify-full-system → docs+self CLI, audit-output-styles/sprint-memory-writer → docs+CLI, sync-folders → `tests/qa/v2112-deep-qa-fixes.test.js`(test 의존)+bkit-system 카탈로그. | **진짜 orphan 0** |
| 340 stale state | 검토 | `.bkit/state/*.json` 11개 = **gitignored 로컬 전용**(릴리스 artifact 아님). `sc05-test.json`은 로컬 scratch. | **릴리스 무관** |

### 2.1 핵심 결론
**bkit는 제거할 dead code가 없다.** 모든 후보가 live다(계약 요구 / CI 호출 / test 의존 / CLI 진입점 / 문서화 도구). 마스터 플랜의 "6 stub / 19 skip / 5 TODO / dead module / orphan" 추정은 모두 raw-match 과대집계였다. S4의 가치는 **삭제가 아니라 (1) pdca-eval 거버넌스 결정(영구 유지) (2) 청결성 검증 (3) 향후 오삭제 방지 lock**이다.

---

## 3. ENH 상세 (실측 기반 재정의)

- **ENH-336 (P0 governance)**: pdca-eval-* 6 stub **유지 확정**. 근거: v2.1.9·v2.1.16 immutable baseline 등재 + `contract-test-run.js` L4 규칙(baselined agent 부재 시 `deprecatedIn` stub 필수). 제거하려면 역사 baseline 2개 훼손 필요 → 금지. **산출물**: `docs-code-invariants.js`의 `EXPECTED_DEPRECATED_AGENT_NAMES`에 거버넌스 lock 주석 추가(향후 오삭제 방지) + ADR.
- **ENH-337**: test skip triage 완료 — dead disabled test **0**(실측). 커스텀 `skip()` 헬퍼는 legitimate. 제거 없음.
- **ENH-338**: TODO triage — **1건 유지**(의도적 forward-TODO). 제거 없음.
- **ENH-339**: dead lib module — **0**(check-deadcode 확인). 제거 없음.
- **ENH-340**: orphan script **0**(전수 ref 검증) / stale state는 gitignored 로컬. 제거 없음.
- **ENH-341**: removal manifest — **0 removals** + 후보별 "왜 live인가" safety justification 문서화.
- **ENH-342**: 청결성 검증 게이트 — check-deadcode + L4 contract + 전 test green 확인.

---

## 4. Phase 로드맵 / 위험은 §1 RISK + 분석 인라인 참조.

> **Status**: Plan 완료 — design phase.
