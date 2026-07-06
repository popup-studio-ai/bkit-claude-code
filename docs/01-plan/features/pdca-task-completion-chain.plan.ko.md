# 계획 — PDCA 선행-Task 완료 체인 (issue #137, v2.1.29)

## Executive Summary

| 관점 | 요약 |
|---|---|
| **문제** | `pdca` 스킬은 phase Task를 `blockedBy` 체인(`[Plan]→[Design]→[Do]→[Check]→…`)으로 생성만 할 뿐, 다음 phase로 넘어갈 때 **선행 Task를 `completed`로 마킹하라는 지시가 없음**. 선행 Task가 `in_progress`로 남아, Claude Code 네이티브 task 목록이 매 턴 prompt context에 stale phase(예: "design")를 노출 — 올바른 `.bkit/state/pdca-status.json`의 `phase`와 불일치. |
| **해결** | 각 `pdca` phase action이 다음 phase Task를 생성하기 **직전**에 "선행 phase Task 완료" 지시를 추가하고, `## Task Integration` 섹션에 Phase Transition Rule을 명문화. 결정론적·모델 실행·dead code 없음. |
| **기능/UX 효과** | CC task 목록과 `pdca-status.json`이 항상 일치. phase 전환 후 stale 신호가 사라짐. |
| **핵심 가치** | 일치해야 할 두 진실 소스가 실제로 일치하게 되어, 기능 위험 0으로 혼란스러운 정보 불일치를 제거. |

## Context Anchor

| 키 | 값 |
|---|---|
| **WHY** | stale `in_progress` 선행 Task가 오래된 phase를 ambient prompt context에 노출, `pdca-status.json`과 모순. |
| **WHO** | `pdca` 스킬을 2개 이상 phase에 걸쳐 쓰는 모든 bkit 사용자(= 실제 PDCA 사용 전부). |
| **RISK** | 매우 낮음 — 스킬 파일 1개 prose + 회귀 테스트 1개. lib/hook 동작 변경 없음. |
| **SUCCESS** | `skills/pdca/SKILL.md`의 각 phase 전환이 선행 Task 완료를 지시; 회귀 테스트가 강제; 라이브 플러그인 로드 정상. |
| **SCOPE** | `skills/pdca/SKILL.md` 한정. 다단계 체인이 없는 plan-plus(단일 `[Plan]`), cc-version-analysis(단일 task), sprint(per-feature task)는 범위 외. |

## 1. 배경 / 재현

- 보고자: @hslee-cmyk (bkit v2.1.28, CC v2.1.199). **low / cosmetic** 등급 — 심각도는 유지자 판단 위임.
- 소스 내 재현: `skills/pdca/SKILL.md` grep 결과, 모든 action에 `Create Task: [X] {feature}`(스텝: pm=6, plan=8, design=12, do=14, analyze=12, qa=5, iterate=5, report=9) 있으나 선행 phase Task 완료 지시는 **없음**. "completed" 언급은 `pdca-status.json` phase 쓰기와 archive 게이팅뿐 — Task 완료는 전무.
- CC 공식문서(hooks guide + todo-tracking) 확인: `TaskCreated`/`TaskCompleted`는 실제 발화 훅이나 **훅은 Task 상태를 mutate 불가**(stdout/exit-code/additionalContext만; `TaskUpdate`는 모델만 호출).

## 2. 요구사항

- R1: 체인을 진행하는 각 `pdca` phase action은 새 phase Task 생성 전에 선행 phase Task(들)를 `completed`로 마킹하도록 지시해야 함.
- R2: `## Task Integration` 섹션은 Phase Transition Rule(왜+어떻게)을 문서화해 완료 의미를 암묵이 아닌 명시로.
- R3: 각 phase 전환에 완료 지시가 존재함을 assert하는 회귀 테스트로 누락 재발 방지.
- R4: lib/hook 런타임 동작 변경 없음; 아키텍처 카운트(스킬 44 / 에이전트 34 / 훅 이벤트 22 / lib 195) 불변.
- R5: 영어 전용 구현(SKILL.md, test); `docs/` 하위는 bilingual.

## 3. 성공 기준

- [ ] SC1: `design`, `do`, `analyze`, `iterate`, `qa`, `report`, `archive` action 각각이 Create-Task 스텝 전에 "선행 Task 완료" 스텝 포함(archive는 종단 `[Report]` Task 완료).
- [ ] SC2: `## Task Integration`이 두 진실 소스 근거와 함께 Phase Transition Rule 문서화.
- [ ] SC3: 신규 회귀 테스트 통과, 지시 제거 시 실패.
- [ ] SC4: `check-skill-frontmatter`, `docs-code-sync`, `check-deadcode`, `validate-plugin --strict`, Contract L1/L4/L5 게이트 green 유지.
- [ ] SC5: 라이브 QA(`claude -p "/bkit:pdca status" --plugin-dir .`) 스킬 로드 0 에러.

## 4. 범위 외

- 이슈의 Option 2(훅이 선행 Task 자동완료) — 기술적 불가능: CC 훅은 `TaskUpdate` 호출 불가. 설계에서 기각 대안으로 문서화.
- `plan-plus`, `cc-version-analysis`, `sprint` task 패턴 변경(다단계 `blockedBy` 체인 없음).
- `pdca-task-completed.js`의 auto-advance 동작(영향 없음, 보고된 갭과 무관).

## 5. 접근

이슈 Option 1(SKILL.md prose) 채택. CC 훅 제약상 Option 2가 불가능하고, 어떤 훅 방식도 결국 모델이 `TaskUpdate`를 수행해야 하므로 명시적 스킬 스텝보다 결정론적이지 않고 노이즈만 크기 때문.
