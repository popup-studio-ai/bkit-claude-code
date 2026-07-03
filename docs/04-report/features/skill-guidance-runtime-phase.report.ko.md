# 완료 보고서 — 런타임 phase 인지 스킬 guidance (이슈 #135, v2.1.28)

> 기능: `skill-guidance-runtime-phase` · 브랜치: `feat/v2.1.28-issue-135`
> 보고자: @hslee-cmyk · PDCA: pm → plan → design → do → check → qa → report

## 1. 무엇을 릴리스했나

#132 수정이 multi-action 라우터 스킬에서 도달 불가로 남겨둔 `UserPromptExpansion`
메커니즘의 **다음 단계 guidance 텍스트** 절반이 이제 동작한다. `pdca`와 `sprint`가
네이티브 slash 경로와 모델 Skill-tool 경로 모두에서 런타임 phase 인지 "다음에 뭘
실행할지" guidance를 출력한다 — bkit의 기존 phase 전이 SSoT 재사용(로직 중복 없음).

## 2. Root cause (추측 아님, 확정)

`orchestrateSkillPost()`가 `suggestions`를 정적 SKILL.md frontmatter
(`next-skill`, `pdca-phase`)에서만 도출. 11개 라우터 스킬은 설계상 둘 다 `null`
선언(phase가 스킬 이름이 아닌 런타임 `action`에 의존) → `suggestions = {}` →
`formatGuidance()`가 `''` 반환 → guidance 없음. 코드 + 런타임 레벨 및 main
베이스라인 회귀 diff로 검증.

## 3. 구현

| 파일 | 변경 |
|---|---|
| `lib/orchestrator/runtime-guidance.js` | **신규** — `resolveRuntimeGuidance`; PDCA는 `getNextPdcaActionAfterCompletion`, Sprint는 `buildNextActions`; fail-open; EN/KO 문자열 |
| `lib/orchestrator/skill-invocation-effects.js` | 공유 지점에서 빈 `suggestions` 보강(양 경로); 가드, fail-open |
| `lib/skill-orchestrator.js` | 기존 한국어 guidance 문자열 → i18n detector 경유 EN 기본 + KO |
| `test/regression/issue-135-multiaction-guidance.test.js` | **신규** — 23 TC |
| `test/unit/skill-orchestrator.test.js` | SO-023..028 KO→EN (46/46) |

준수한 설계 원칙: **No Guessing**(root cause 재현), **SSoT 재사용**(phase 테이블
중복 없음), **fail-open**(명령 절대 차단 안 함), **판단 범위**(pdca/sprint만 적격;
9개 유틸 의도적 침묵).

## 4. 검증

- 설계↔코드 일치: **100%** (설계 10/10 항목).
- 신규 회귀 23/23; 유닛 46/46; 비회귀 #132 7/7, effects 5/5.
- 실제 프로덕션 진입점 QA(`--plugin-dir .`): pdca/sprint에 대해 SLASH·MODEL 양
  경로에서 guidance 확인; 유틸 침묵; 단일 목적 스킬 불변(이제 영어).
- CI gate 13종 전부 green (domain-purity, deadcode 195, guards, validate-plugin
  --strict 0 err, docs-code-sync, integration-runtime 23, l2-smoke 105,
  invocation-inventory 213, docs-code-sync.test 36, bkit-full-system 36).
- main 베이스라인 회귀 diff: **회귀 0건** (40건 pre-existing·무관·비CI 실패 불변,
  있는 그대로 보고).

## 5. Docs = Code

버전 2.1.27 → **2.1.28** (gated 7파일 + CHANGELOG 엔트리 + marketplace 설명).
아키텍처 prose 195 lib 모듈로 동기화(README, README-FULL, AI-NATIVE,
CUSTOMIZATION-GUIDE, session-context). PDCA 문서 bilingual
(plan/design/analysis/qa/report `.en`+`.ko`).

## 6. 교훈

- #132 수정과 #135는 같은 메커니즘의 절반씩(audit vs guidance); 한쪽 출력만
  배선한 "수정"은 다른 쪽을 조용히 죽은 채로 남길 수 있다.
- passive guidance와 수동 `/pdca next`는 분리된 두 시스템이었다; 지속적 수정은
  세 번째 병렬 해소기 추가가 아니라 passive 경로가 수동 경로의 SSoT를
  재사용하게 만드는 것이었다.
- 로케일 독립 assertion(명령 텍스트)이 guidance 테스트를 견고하게 한다; 메시지
  텍스트는 i18n 맵 assertion 몫이다.

## 7. 후속 (범위 외)

- `run-all.js` 스위트에 stale 테스트 파일 등록으로 인한 40건 pre-existing 실패
  (`context-loader`, `impact-analyzer`, `invariant-checker`, `scenario-runner`
  등). CI gate 스위트에 미포함; 별도 정리 패스 후보.
- @hslee-cmyk(3번째 이슈: #125/#126, #132, #135)를 README 프로그램에 따라 Hall of
  Fame + external-dogfood E2E 흡수 대상으로 검토.
