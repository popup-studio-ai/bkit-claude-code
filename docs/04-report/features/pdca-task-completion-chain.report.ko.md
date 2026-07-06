# 완료 리포트 — PDCA 선행-Task 완료 체인 (issue #137, v2.1.29)

## Executive Summary

| 관점 | 전달 가치 |
|---|---|
| **문제** | `pdca`가 `blockedBy` Task 체인을 생성만 하고 선행을 완료하지 않음 → stale phase가 prompt context에 노출, `pdca-status.json`과 모순. |
| **해결** | 결정론적 SKILL.md prose fix: 각 phase action이 다음 생성 전 선행 Task 완료; Phase Transition Rule 중앙화; 회귀 테스트 보호. |
| **기능/UX 효과** | CC task 목록과 `pdca-status.json` 일치; 전환 후 stale 신호 없음. |
| **핵심 가치** | 기능/아키텍처 위험 0으로 혼란스러운 두 진실 소스 불일치 제거. |

## 변경 사항

- `skills/pdca/SKILL.md` — `plan`/`design`/`do`/`analyze`/`iterate`/`qa`/`report`에 완료 스텝 추가, `archive`에 종단 완료; `## Task Integration` 하위 `### Phase Transition Rule (task completion)` 신설.
- `test/regression/issue-137-predecessor-task-completion.test.js` — 25 assertion 가드.
- 버전 bump 2.1.28 → 2.1.29 (bkit.config.json canonical, plugin.json, marketplace.json ×2 + 설명, hooks.json, session-start.js, session-context.js, README badge + latest-release) + CHANGELOG `## [2.1.29]`.
- Bilingual PDCA 문서(plan, design, analysis, report).

## 핵심 결정 & 결과

| 결정 | 근거 | 결과 |
|---|---|---|
| Option 1(SKILL.md prose), Option 2(훅 자동완료) X | CC 훅은 Task 상태 mutate 불가(stdout/exit-code/additionalContext만; `TaskUpdate`는 모델만) — CC 공식 hooks guide로 확인. 어떤 훅 방식도 결국 모델이 수행해야 하므로 더 결정론적이지 않고 노이즈만 큼. | 결정론적 fix, 신규 런타임 표면·dead code 없음. |
| "모든 선행 in_progress phase Task 완료" 일반 문구 | 9-phase의 분기부(`qa`/`act`)에도 robust. | 단일 규칙이 모든 전환 커버. |
| 범위 `pdca` 한정 | 연관 스킬에 다단계 `blockedBy` 체인 없음(plan-plus 단일 Task, cc-version-analysis 서브태스크, sprint per-feature). | 부수 변경 없음. |

## 검증

- 모든 정적 + contract 게이트 green; `main` 대비 신규 회귀 0(실패 파일 집합 동일).
- 신선한 `claude -p --plugin-dir .` 라이브 QA가 fix 로드·모델 판독 확인.

## 성공 기준 — 최종 상태

- SC1 각 진행 action의 선행 완료 스텝: ✅ 충족
- SC2 Phase Transition Rule 문서화: ✅ 충족
- SC3 회귀 테스트 통과/가드: ✅ 충족(25/25)
- SC4 CI 게이트 green: ✅ 충족
- SC5 라이브 플러그인 로드 0 에러: ✅ 충족

**종합: 5/5 충족.**

## 교훈

- 보고자가 제안한 훅 기반 fix 채택 전 훅 능력을 공식 문서로 검증 — 여기서 Option 2를 곧바로 실격시키고 "더 저렴한" Option 1을 명백히 우월한 선택으로 만듦.
- 모델 대면 스킬 prose는 정당하고 테스트 가능한 fix 표면: SKILL.md 대상 contract형 회귀 테스트가 prose fix의 조용한 재발을 막음.
