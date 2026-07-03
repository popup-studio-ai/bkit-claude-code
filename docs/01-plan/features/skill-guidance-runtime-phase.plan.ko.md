# 계획 — 런타임 phase 인지 스킬 guidance (이슈 #135, v2.1.28)

> 기능: `skill-guidance-runtime-phase` · 대상: bkit v2.1.28 · 브랜치: `feat/v2.1.28-issue-135`
> 보고자: @hslee-cmyk (외부 dogfooder) · 선행: #132 (v2.1.27)

## 1. 문제 (추측 아님, 확정)

#132(v2.1.27) 수정은 `UserPromptExpansion` 메커니즘의 `skill_invoked` audit /
task-tagging 절반을 네이티브 slash 명령에서 도달 가능하게 만들었다. 그러나
**같은 메커니즘의 "다음 단계 guidance 텍스트" 절반**은 multi-action 라우터
스킬에서 전혀 발화하지 않는다. `orchestrateSkillPost()`
(`lib/skill-orchestrator.js:472-506`)가 `suggestions`를 정적 SKILL.md
frontmatter 2필드(`next-skill:`, `pdca-phase:`)에서**만** 도출하는데, 11개
라우터 스킬은 설계상 둘 다 `null`로 선언하기 때문이다(이 스킬들의 phase는
스킬 이름이 아니라 런타임 `action` 인자에 따라 달라진다).

### 검증된 근거

- **코드**: `orchestrateSkillPost`는 `config['next-skill']` / `config['pdca-phase']`
  만 읽는다. 런타임 `context.args.action`은 전달되지만 무시된다.
- **frontmatter 전수 조사(both-null 11개, 보고서와 정확히 일치)**:
  `audit, bkit-evals, bkit-explore, claude-code-learning, control, pdca-batch,
  pdca-fast-track, pdca-watch, pdca, rollback, sprint`.
- **런타임 재현**: `orchestrateSkillPost('pdca', {}, {args:{action:'plan'}})` →
  `{}` 반환 → `formatGuidance()`가 `''` 반환 → stdout에 아무것도 안 씀.
  `deploy` / `code-review` / `plan-plus` / `cc-version-analysis`는 정상 해소.
- **양 호출 경로**(`skill-post.js:167` MODEL, `user-prompt-expansion-handler.js:78`
  SLASH)가 `runSkillInvocationEffects`를 공유하며, 이것이 `orchestrateSkillPost`를
  1회 호출(effects.js:114) → 한 곳 수정으로 둘 다 커버.

### 영향

`pdca`와 `sprint` — bkit의 두 대표 오케스트레이터이자 "다음에 뭘 실행할지"
guidance가 가장 값진 스킬 — 이 구조적으로 배제된다. 에러도 로그 신호도 없어
"지금은 제안할 게 없음"과 구분되지 않는다.

## 2. 목표

런타임 phase(=`args.action` + live PDCA/Sprint 상태)를 해소하고 bkit의 기존
phase 전이 SSoT를 재사용하여, multi-action 라우터 스킬에서 passive 다음 단계
guidance가 도달 가능하게 한다 — 병렬 bolt-on이 **아니다**. 이는 이슈가 지적한
"passive guidance 경로와 수동 `/pdca next` 경로가 분리되어 있다"는 더 깊은
문제까지 해소한다.

## 3. 범위

**포함**
- `orchestrateSkillPost` → `runSkillInvocationEffects` guidance 경로에서 `pdca`
  (및 SSoT가 있는 `sprint`)에 대한 런타임 phase 해소.
- `lib/pdca/automation.js#getNextPdcaActionAfterCompletion`(수동 `/pdca next`
  SSoT) + `lib/pdca/phase.js#getNextPdcaPhase` 재사용 — phase 테이블 중복 금지.
- `lib/i18n/detector.readLanguage()` 기반 언어 인지 guidance 문자열(EN 기본 / KO);
  신규 코드는 CLAUDE.md대로 영어 우선.
- 판단 적용: 순수 유틸 스킬(`audit`, `control`, `rollback`, `bkit-evals`,
  `bkit-explore`, `claude-code-learning`)은 의미 있는 다음 단계가 있을 때만
  guidance. 그 외의 침묵은 버그가 아니라 정상.
- 양 경로 회귀 테스트 + 단일 목적 스킬 비회귀.

**제외**
- error-dict i18n 시스템 재작성(에러 전용). guidance는 detector + 병치된
  bilingual 맵 사용.
- frontmatter 스키마 변경(옵션 2 기각 — `pdca next`/`pdca status` 같은
  live-status 케이스를 표현 불가).

## 4. 접근법 (Design 체크포인트에서 선택)

**런타임 phase 해소 (근본, SSoT 통합).** `pdca-phase` frontmatter가 `null`인
라우터 스킬은 호출 `action`을 live `.bkit/state/pdca-status.json`과 교차 참조해
유효 phase를 해소한 뒤, 기존 수동 경로 해소기를 통해 guidance를 생성하여 두
시스템이 하나의 SSoT를 공유하도록 한다.

## 5. 수용 기준

1. `/bkit:pdca plan <feat>`(및 기타 phase action)이 slash 경로에서 다음 단계
   guidance를 출력한다.
2. `sprint`는 sprint SSoT가 다음 단계를 제공하는 경우 phase 인지 guidance 출력.
3. `deploy`, `code-review`, `plan-plus`, `cc-version-analysis` guidance 불변.
4. phase 전이 테이블 중복 도입 없음. `getNextPdcaActionAfterCompletion` /
   `getNextPdcaPhase` 재사용.
5. guidance 문자열 언어 인지(EN/KO), 신규 코드 영어.
6. fail-open 유지: 해소 에러 시 guidance 없음, 절대 block/throw 금지.
7. 전체 테스트 green; 신규 회귀 테스트가 multi-action + 양 경로 커버.

## 6. 리스크

- **유틸 스킬 과잉 발화** → guidance 적격 라우터 스킬 allow-set(pdca, sprint) +
  null-반환 기본값으로 완화.
- **live-status 부재**(feature 미등록) → guidance 없음으로 fail-open.
- **MODEL+SLASH 이중 발화** → `runSkillInvocationEffects`의 dedup 키로 이미 방어.
