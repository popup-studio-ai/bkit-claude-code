# 설계 — 런타임 phase 인지 스킬 guidance (이슈 #135, v2.1.28)

> 기능: `skill-guidance-runtime-phase` · 선택 접근: 런타임 phase 해소(근본,
> SSoT 통합) · 신규 코드 영어, guidance 문자열 언어 인지(EN/KO).

## 1. 아키텍처 결정

`orchestrateSkillPost()`는 **순수 frontmatter 해소기**(문서화된 역할)로 유지한다.
런타임 상태 해소는 한 tier 위, 오케스트레이터 글루
`lib/orchestrator/skill-invocation-effects.js#runSkillInvocationEffects`에
추가한다 — 두 호출 경로가 이미 공유하는 단일 지점이며 `getPdcaStatusFull`을
이미 import한다. 이슈의 제안 수정 #1이 정확히 이 위치를 가리킨다.

```
runSkillInvocationEffects (effects.js)
  ├─ orchestrateSkillPost(name, {}, {args})  → suggestions (frontmatter)   [불변]
  ├─ suggestions가 비었고 name이 guidance 적격 라우터면:
  │     suggestions = resolveRuntimeGuidance(name, args)   ← 신규          [런타임]
  └─ formatGuidance(suggestions) → stdout                                   [불변]
```

**왜 `orchestrateSkillPost` 내부가 아닌가**: 이 모듈은 live PDCA/Sprint 상태에
의존하지 않는 저-tier frontmatter 로더다. `lib/pdca/automation` + status를
끌어들이면 계층이 역전되고 require 순환 위험이 있다. 상태 인지 보강은
오케스트레이터 tier가 올바른 자리다.

## 2. 신규 모듈: `lib/orchestrator/runtime-guidance.js`

단일 export `resolveRuntimeGuidance(skillName, args)` → `suggestions` 객체
(제안 없으면 `{}`). 기존 SSoT 위의 순수 조합; fail-open.

### 2.1 guidance 적격 집합

```js
const GUIDANCE_ELIGIBLE = new Set(['pdca', 'sprint']);
```

bkit의 두 대표 오케스트레이터만. 나머지 9개 both-null 라우터 스킬
(`audit, control, rollback, bkit-evals, bkit-explore, claude-code-learning,
pdca-batch, pdca-fast-track, pdca-watch`)은 선형 "다음 PDCA 단계"가 없는 순수
유틸 — 그 침묵은 버그가 아니라 정상(문서화).

### 2.2 PDCA 해소 (수동 `/pdca next` SSoT 재사용)

```
phase =
  args.action ∈ {pm,plan,design,do,check,act,qa,report}  → args.action
  args.action ∈ {next,status,iterate,analyze} 또는 없음   → live status phase
feature = args.feature || getPdcaStatusFull().currentFeature
next   = getNextPdcaActionAfterCompletion(phase, feature)   // automation.js SSoT
         → { nextPhase, command }                            // 예: "/pdca design login"
suggestions.nextSkill      = { name: strip('/', command), message: L(nextPhase) }
suggestions.suggestedAgent = AGENT_BY_PHASE[phase]           // 기존의 상위집합
```

`getNextPdcaActionAfterCompletion`은 live status 대비 조건 분기
(`matchRate ≥ 100`이면 `check → qa` 아니면 `act`; `qaPassRate ≥ 95`이면
`qa → report` 아니면 `act`)를 이미 내장 — 그대로 재사용, 중복 없음.

`AGENT_BY_PHASE`는 기존 하드코딩 쌍을 바꾸지 않고 확장:
`{ do: 'gap-detector', check: 'pdca-iterator' }`(불변) `+ { design:
'design-validator', qa: 'qa-lead' }`(가산, 에이전트가 실제 도움이 되는 곳만).
없는 phase → 에이전트 없음(guidance는 `nextSkill`만으로도 유효).

### 2.3 Sprint 해소

Sprint SSoT(`lib/sprint` phase 순서 / `sprint-status.json`)에서 현재 sprint
phase를 해소해 다음 phase의 `/sprint <phase>` 명령을 제안한다. 활성 sprint가
없거나 다음 phase가 없으면 `{}`(fail-open).

### 2.4 언어 인지 문자열

```js
const lang = safeReadLanguage();           // lib/i18n/detector.readLanguage(), 'en' 기본
const L = (phaseKey) => GUIDANCE_MSG[lang]?.[phaseKey] ?? GUIDANCE_MSG.en[phaseKey];
```

`GUIDANCE_MSG`는 병치된 `{ en: {...}, ko: {...} }` 맵(영어 우선 작성). 에러 전용
`assets/error-dict.*.json`을 오염시키지 않고 "신규 영어 + 기존 언어 인지"를 충족.

## 3. 변경 지점

| 파일 | 변경 |
|---|---|
| `lib/orchestrator/runtime-guidance.js` | **신규** — `resolveRuntimeGuidance` + 맵 |
| `lib/orchestrator/skill-invocation-effects.js` | 115행 뒤, 빈 `suggestions`를 runtime-guidance로 보강(가드, fail-open) |
| `lib/skill-orchestrator.js` | **불변**(frontmatter 역할 유지) |
| `lib/pdca/automation.js`, `lib/pdca/phase.js` | **재사용**, 미수정 |
| 기존 한국어 문자열(`getNextStepMessage`, `suggestedMessage`) | 동일 `GUIDANCE_MSG`/detector로 언어 인지 마이그레이션(관련 영역 sweep, Task #4) |

## 4. 불변식 / 비회귀

1. `orchestrateSkillPost` 동작은 모든 frontmatter 해소 스킬
   (deploy/code-review/plan-plus/cc-version-analysis/dynamic/...)에 대해 바이트 동일.
2. 런타임 경로는 frontmatter가 아무것도 못 낸 경우(`suggestions` 빔) **그리고**
   skill ∈ `GUIDANCE_ELIGIBLE`일 때**만** 실행.
3. 해소 중 에러 → catch → `{}` → guidance 없음(두 hook 핸들러의 fail-open 계약 유지).
4. 신규 phase-order/전이 테이블 없음 — SSoT 재사용만.
5. `runSkillInvocationEffects`의 dedup 키가 MODEL+SLASH 이중 발화 계속 방어.

## 5. 테스트 계획 (Check 단계)

- 단위: `resolveRuntimeGuidance('pdca', {action:'plan',feature:'x'})` → nextSkill이
  design 지시; `check`는 matchRate 분기; `sprint` 다음 phase; 유틸 스킬 → `{}`;
  status 부재 → `{}`.
- 통합: `runSkillInvocationEffects('pdca', {action:'plan'}, ...)`가 non-empty
  suggestions 반환; `deploy` 불변.
- 회귀: 전체 `test/run-all.js` green.
- 언어: EN 기본, 지속 언어가 `ko`면 KO.
