# S4 — Tech-Debt & Dead-Code Elimination 설계서

> **Sprint**: `tech-debt-deadcode-elimination` (S4) · **Trust**: L4 · **ENH**: ENH-336~342
> **Date**: 2026-06-01 · **선행**: plan + 본 세션 전수 실측

---

## 1. 설계 원칙

1. **measure-then-act**: 모든 제거는 도구(check-deadcode)·계약(contract-test-run L4)·테스트 의존·CI/CLI ref의 4중 교차검증을 통과한 것만. 실측 결과 **통과한 제거 후보 0**.
2. **immutable baseline 불가침**: v2.1.9·v2.1.16 contract baseline은 역사 스냅샷 → 절대 수정 금지(S5 docs-sync risk와 동일 원칙).
3. **live ≠ unreferenced**: "다른 파일이 require 안 함"은 dead의 충분조건이 아님(CLI 진입점·CI·동적 dispatch·test 의존 존재).
4. **가치 전환**: 삭제 0 → 거버넌스 결정 + 청결성 검증 + 오삭제 방지 lock 으로 S4 가치 재정의.

## 2. Removal Manifest (ENH-341) — 0 removals

| 후보 | 분류 | live 근거 (safety justification) | 조치 |
|------|------|--------------------------------|------|
| `agents/pdca-eval-{act,check,design,do,plan,pm}.md` (6) | deprecated stub | v2.1.9+v2.1.16 baseline 등재 + L4 `Active+Deprecated===agents+6` + `deprecatedIn:v2.1.13`. 제거 시 L4 FAIL ×6 + 역사 baseline 훼손. | **유지 + lock 주석** |
| test `.skip/.only/xit` | 비활성 테스트 | 실측 0 (substring 오매칭). 커스텀 `skip(id,msg)` 헬퍼는 조건부 skip 인프라. | 없음 |
| TODO `registry.js:185` | 마커 | S6 의도적 reconcile-pin(CC strict-validation 도입 버전 추후 확정). | 유지 |
| lib/ 188 modules | dead module | check-deadcode: Dead(NEW)=0, 141 live + 47 exempt. | 없음 |
| `scripts/{check-deadcode,check-guards,check-test-tracking}.js` | orphan? | `.github/workflows/contract-check.yml` CI 호출. | 없음 |
| `scripts/verify-full-system.js` | orphan? | full-system verifier CLI(check-skill-frontmatter/check-domain-purity/measure-mcp-alwaysload 호출), docs 참조. | 없음 |
| `scripts/{audit-output-styles,sprint-memory-writer}.js` | orphan? | docs(report/bkit-system) 참조 CLI 도구. | 없음 |
| `scripts/sync-folders.js` | orphan? | `tests/qa/v2112-deep-qa-fixes.test.js` test 의존 + bkit-system 컴포넌트 카탈로그 + 동작하는 `.claude/`→root 동기화 도구. | 없음 |
| `.bkit/state/*.json` (11, incl. sc05-test) | stale state | gitignored 로컬 전용, 릴리스 artifact 아님. | 릴리스 무관(로컬 housekeeping은 선택) |

**총 안전 제거: 0건.** bkit 코드베이스는 이미 청결.

## 3. ENH-336 거버넌스 결정 (ADR-level)

**결정: pdca-eval-* 6 stub 영구 유지.**

근거 체인:
1. `contract-test-run.js runL4Deprecation()`: 모든 baseline agent name이 `agents/`에 없으면 `deprecatedIn` frontmatter stub 필수, 없으면 `L4 FAIL agent '<name>' missing from current without deprecatedIn declaration`.
2. v2.1.9 + v2.1.16 `_MANIFEST.json` 모두 6 pdca-eval 등재(grep 확인).
3. 6 stub은 `deprecatedIn:v2.1.13` 보유 → 현재 L4 PASS(exit 0, 양 baseline).
4. 제거하려면 역사 baseline에서 6 entry 삭제 필요 → immutable 스냅샷 훼손(불가) + `EXPECTED_DEPRECATED_AGENT_NAMES`/`docs-code-invariants` 불변식 파괴.
5. stub 비용: frontmatter + 짧은 deprecation note(수 줄) → 무시 가능.

**구현(ENH-336 산출물)**: `lib/domain/rules/docs-code-invariants.js`의 `EXPECTED_DEPRECATED_AGENT_NAMES` 위에 **거버넌스 lock 주석** 추가 — "이 6 stub은 v2.1.9/v2.1.16 immutable baseline + L4 deprecation governance가 요구하는 영구 tombstone. 삭제 금지(L4 FAIL). S4(v2.1.22)에서 제거 가능 여부 검토 → 유지 확정." 향후 유지보수자의 오삭제 방지.

## 4. 구현 범위 (do phase)

1. **ENH-336**: `docs-code-invariants.js` 거버넌스 lock 주석 (유일한 코드 변경).
2. **ENH-341**: 본 manifest(§2) = removal manifest.
3. (선택) 로컬 scratch `sc05-test.json` housekeeping — gitignored라 릴리스 무영향, manifest에 기록만.

## 5. Test Plan (L1-L5)

| Level | 항목 | 방법 |
|-------|------|------|
| L1 | 거버넌스 주석이 EXPECTED_DEPRECATED_AGENT_NAMES 값 불변(주석만) | diff 확인, require 로드 |
| L3 회귀 | 전 test suite 변경 전/후 동일 | comm 비교 (0 신규 fail) |
| L4 contract | L4 deprecation governance PASS(v2.1.9+v2.1.16) | contract-test-run exit 0 |
| L4 deadcode | check-deadcode Dead=0 유지 | exit 0 |
| L5 | docs-code-invariants 로드 + 불변식 | node require |

## 6. API Contract (M4)
유일 코드 변경은 `docs-code-invariants.js` **주석 추가**(런타임 no-op, export/값 불변). 시그니처·반환 불변. **M4 = 100**.

## 7. Self-Assessment (M8)
Context Anchor ✅ / 전수 실측 manifest ✅ / 거버넌스 결정 근거체인 ✅ / test plan ✅ / 무회귀(주석만) ✅ / 추정 교정 정직성 ✅. **M8 = 90**.

> **Status**: Design 완료 — do phase.
