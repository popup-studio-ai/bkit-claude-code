# skill-post-slash-reach 기획 문서

> **요약**: bkit의 4개 오케스트레이터 부수효과(next-skill 안내, phase 자동갱신, decision-trace, audit)를 **네이티브 slash-command 경로**(bkit 문서가 가르치는 유일한 호출 형태)에서 복원한다. CC 전용 이벤트 `UserPromptExpansion`(실측 확정)에 공용 effects 모듈을 기존 `PostToolUse:Skill` 경로와 함께 dual-wire. GitHub 이슈 #132 대응.
>
> **프로젝트**: bkit Vibecoding Kit (bkit-claude-code)
> **버전**: 2.1.27 (잠정 — 최종 버전은 릴리스 시 메인테이너가 확정)
> **작성자**: PDCA 파이프라인 (pm-lead PRD → plan)
> **날짜**: 2026-07-02
> **상태**: Draft
> **PRD**: [skill-post-slash-reach.prd.ko.md](../../00-pm/skill-post-slash-reach.prd.ko.md)

---

## Executive Summary

| 관점 | 내용 |
|-------------|---------|
| **문제** | bkit의 4개 부수효과 — next-skill/`suggestedAgent` 안내, `updatePdcaStatus()` phase 자동갱신, decision-tracer `phase_transition`, audit-logger `skill_executed` — 가 오직 `PostToolUse matcher:"Skill"`에만 배선되어 있고, 이 이벤트는 네이티브 slash-command(`/bkit:pdca ...`, bkit 문서가 가르치는 유일한 형태; CC는 이를 명령 확장으로 처리하여 `Skill` tool_use를 발생시키지 않음)에서 발화하지 않는다. 따라서 사실상 모든 실사용에서 광고된 AI-투명성 감사 추적이 비어 있고, decision-trace에 `phase_transition` 기록이 없으며, 오케스트레이터 안내가 나타나지 않는다. #125/#126과 동일 근본원인 계열; #126은 오탐 경고만 고치고 기능은 dead로 남김. 2개 잠재 결함이 가중: `user-prompt-handler.js`의 IntentRouter 통합이 100% dead(미정의 `onboardingContext` ReferenceError), active-skill-marker가 slash 경로에서 미기록(sprint 외 모든 slash-skill의 Stop 디스패치 파손). |
| **해법** | `skill-post.js`의 부수효과 글루를 source-agnostic 공용 모듈 `lib/orchestrator/skill-invocation-effects.js`로 추출한 뒤 **dual-wire**: 모델 호출 경로는 `PostToolUse:Skill` 유지 + slash 경로용 신규 `UserPromptExpansion` 훅(CC slash-command 확장 전용 이벤트 — v2.1.198에서 `command_name`/`command_args`/`command_source:"plugin"`로 발화 실측 확정) 추가로 동일 effects를 발화, bkit 자체 플러그인 명령으로 필터, dedup, fail-open. L5 훅-카운트 불변식을 lockstep 갱신(21→22). slash 경로는 신규 `skill_invoked` audit action(pre-exec 의미)으로 기록. 무료 부수 수정 2건 포함. |
| **기능/UX 효과** | `/bkit:pdca do login`(네이티브 slash)이 이제 `skill_invoked` audit 엔트리 + `phase_transition` decision-trace 기록 + 훅 수준 phase 자동갱신(docs-gated) + 인-컨텍스트 next-skill/agent 안내를 생성. IntentRouter 구조화 제안이 다시 채워지고, sprint 외 slash-skill의 Stop 디스패치가 발화. `Skill`-도구 경로 무변경; 구버전 CC는 신규 훅을 inert로 처리(무회귀). |
| **핵심 가치** | 광고된 audit/decision-trace/안내를 실사용 방식에서 동작하게 하고, 훅 기반 집행(차별화 #1 Memory Enforcer / #2 Defense Layer 6이 실경로 훅 발화에 의존)을 강화하며, 2개 잠재 dead-code 결함을 상환 — dual-wire, dedup, fail-open, CI-green, docs=code, 버전 무변경 릴리스로. |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 주 문서화 사용 경로(네이티브 slash)가 모든 오케스트레이터 부수효과를 조용히 우회; bkit이 광고하는 "AI 투명성" 감사 추적이 실사용에서 비어 있음. |
| **WHO** | `/bkit:<skill>`(문서화 형태)로 스킬을 호출하는 모든 bkit 사용자; 연속 기여자 @hslee-cmyk(#125/#126); `/audit`·decision-trace에 의존하는 메인테이너. |
| **RISK** | 훅 이벤트 추가 → L5 카운트 불변식(21 이벤트)을 정확히 22로 lockstep 갱신하지 않으면 CI red; `UserPromptExpansion`은 확장을 차단할 수 있음 → fail-open 필수; slash-타이핑+Skill-도구 동시 호출 시 이중 발화 → dedup 필요. |
| **SUCCESS** | 수정 후 네이티브 `/bkit:pdca <action> <feature>`(`claude -p --plugin-dir .`로 재현)가 `skill_invoked` audit 엔트리 + `phase_transition` decision + next-skill 안내 생성; 무료 수정 2건 검증; 신규 CI 실패 0; L5 불변식 22 이벤트 green. |
| **SCOPE** | 신규 `lib/orchestrator/skill-invocation-effects.js` · 신규 `UserPromptExpansion` 훅+핸들러 · `skill-post.js` 공용모듈 호출 리팩토링 · `user-prompt-handler.js` onboardingContext 수정 + slash 감지 · active-skill-marker slash 복원 · hooks.json + L5 SoT(21→22) · 테스트 · 문서 + CHANGELOG. |

---

## 1. 개요

### 1.1 목적

v2.1.27을 출하하여 bkit의 오케스트레이터 부수효과(안내, phase 갱신, decision-trace, audit)가 주 문서화 사용 경로인 네이티브 slash-command에서 CC 전용 `UserPromptExpansion` 이벤트를 통해 발화하도록 한다. 기존 `Skill`-도구 경로 무회귀, 버전 무변경.

### 1.2 배경

- **근본원인 (3중 확정, `.bkit/research/issue-132-diagnosis.md`)**: `skill_executed`는 `skill-post.js:192`에서만 기록; `orchestrateSkillPost`는 `skill-post.js:179`에서만 호출; `recordDecision(phase_transition)`은 skill-post.js에서만; 전부 `PostToolUse matcher:"Skill"`(`hooks.json:67`)에 배선. CC 네이티브 slash 명령은 `Skill` tool_use 미발생(문서화; 본 세션 시스템 프롬프트도 `<command-name>`=이미 로드됨 확인).
- **수정 기반 (실측, `.bkit/research/issue-132-reproduction-log.md` R2, CC v2.1.198)**: `UserPromptExpansion`이 `/bkit:pdca status`에 발화 → `command_name:"bkit:pdca"`(네임스페이스형), `command_args:"status"`(문자열), `command_source:"plugin"`(bkit 자체 필터); 평문은 미발화(오탐 0). `UserPromptSubmit`도 raw 프롬프트를 보지만 구조화 필드 없음(slash에 대해 미문서화 → 미사용).
- **변경 표면 (`.bkit/research/issue-132-codebase-audit.md`)**: 4+1 부수효과 전부 확장 시점의 `(skillName, args)`만으로 계산 가능(`orchestrateSkillPost`의 result 인자는 no-op `{}`); 프리미티브 이미 lib 수준; 글루는 `skill-post.js:175-230`에만. 훅 이벤트 추가는 L5 카운트 불변식(SoT `docs-code-invariants.js:22` + `EXPECTED_HOOK_EVENT_NAMES`) 파손. 무료 수정 2건: `user-prompt-handler.js:296` `onboardingContext` ReferenceError(IntentRouter dead); `writeActiveSkill` slash에서 dead → Stop `SKILL_HANDLERS` 디스패치가 sprint 외 slash-skill에서 실패.
- **사용자 결정 (2026-07-02)**: 머지 전까지 완전 자동; dual-wire(근본 대응, 기술부채 없음); slash/pre-exec 경로 audit action = **`skill_invoked`**(의미 정확); **fail-open 엄격**(확장 절대 차단 안 함); 나머지 내부 결정(모듈 위치, 필터, canary 키)은 기술부채 없는 방향으로 설계에 위임.

### 1.3 관련 문서

- PRD: `docs/00-pm/skill-post-slash-reach.prd.{en,ko}.md`
- 리서치: `.bkit/research/issue-132-{diagnosis,web-research,codebase-audit,reproduction-log}.md`
- 계열: #125/#126 (v2.1.24 네임스페이스 + hook-reachability); 메모리 `issue-125-126-response`

---

## 2. 범위

### 2.1 포함 (In Scope)

- [ ] FR-01 신규 `lib/orchestrator/skill-invocation-effects.js` — `runSkillInvocationEffects(skillName, args, {source})`, `skill-post.js:175-230`에서 추출(source-agnostic; `{suggestions}` 반환)
- [ ] FR-02 신규 `UserPromptExpansion` 훅+핸들러 스크립트, slash 경로에서 공용 effects 발화, `command_source==='plugin'` + `getSkillConfig(normalizeSkillName(command_name))` 해석 가능 필터; fail-open(어떤 에러든 exit 0, 절대 차단 안 함)
- [ ] FR-03 `skill-post.js`를 공용 모듈 호출로 리팩토링(PostToolUse:Skill 경로 보존); 한 턴에 slash-타이핑+Skill-도구 동시 호출 시 이중 기록 방지 dedup
- [ ] FR-04 L5 훅-카운트 불변식 lockstep: `hooks.json` +1 이벤트/블록; `lib/domain/rules/docs-code-invariants.js` hookEvents 21→22(+ hookBlocks) + `EXPECTED_HOOK_EVENT_NAMES` += `UserPromptExpansion`; `invocation-inventory.test.js` 카운트 단언
- [ ] FR-05 `user-prompt-handler.js:296` `onboardingContext` ReferenceError 수정(IntentRouter 구조화 제안 복원)
- [ ] FR-06 slash 경로 `writeActiveSkill` 복원(sprint 외 slash-skill의 Stop `SKILL_HANDLERS` 디스패치 복원)
- [ ] FR-07 slash/pre-exec 경로 audit action = 신규 `skill_invoked`(필요 시 audit 액션 taxonomy/CATEGORIES 추가); Skill-도구 경로는 `skill_executed` 유지
- [ ] FR-08 reachability canary: 신규 경로에서 `skill_post` 키 재사용 금지(#57317/#126 모니터 보존); 신규 키 vs 없음은 설계 결정(방향: 실질 관측성 없으면 신규 키 미추가)
- [ ] FR-09 테스트: 공용모듈 단위; UserPromptExpansion 핸들러 단위(비-plugin/평문 미발화, fail-open 포함); dedup; 무료 수정 2건 회귀; L5 카운트 갱신
- [ ] FR-10 문서: README/CUSTOMIZATION-GUIDE에 slash 경로 오케스트레이션/audit 동작 명시; 신규 `docs/` 파일은 이중언어 쌍
- [ ] FR-11 버전 플로어 / graceful degradation: UPE는 2.1.198 확정; 이벤트 없는 CC에선 훅 inert = 무회귀; 신규 훅 명령 HPQ 경로 인용
- [ ] FR-12 CHANGELOG 잠정 `[Unreleased — v2.1.27]` 엔트리(ENH 번호 = 다음 빈 번호)

### 2.2 제외 (Out of Scope)

- 버전 필드 변경(릴리스 시 메인테이너 결정)
- `Skill`-도구 경로 수정(이미 동작 — slash 경로만 dead)
- 전용 CC `SlashCommand` 도구 이벤트 추가(CC #29607 closed-as-dup: 존재하지 않음)
- 모든 SKILL.md를 부수효과 프로즈로 재작성(기각된 폴백 — 비결정적; 훅 기반이 CC의 sanctioned 결정적 패턴)
- CC 설치 플로어 인상(구버전 graceful degradation, 하드 요구 없음)

---

## 3. 요구사항

### 3.1 기능 요구사항

| ID | 요구사항 | 우선순위 | 상태 |
|----|-------------|----------|--------|
| FR-01 | 부수효과 추출 → `lib/orchestrator/skill-invocation-effects.js`(source-agnostic) | High | Pending |
| FR-02 | 신규 UserPromptExpansion 훅+핸들러, slash 경로 effects 발화, `command_source==='plugin'`+해석가능-스킬 필터, fail-open | High | Pending |
| FR-03 | 공용 모듈로 PostToolUse:Skill 경로 보존 + dedup | High | Pending |
| FR-04 | L5 훅-카운트 불변식 lockstep 21→22 (hooks.json + SoT + EXPECTED_HOOK_EVENT_NAMES + L5 단언) | High | Pending |
| FR-05 | onboardingContext ReferenceError 수정(IntentRouter 복원) | High | Pending |
| FR-06 | slash 경로 active-skill-marker 복원(Stop 디스패치 복원) | High | Pending |
| FR-07 | slash/pre-exec는 신규 `skill_invoked`; Skill-도구는 `skill_executed` 유지 | Medium | Pending |
| FR-08 | reachability canary: 신규 경로에서 `skill_post` 키 재사용 금지 | Medium | Pending |
| FR-09 | 테스트: 공용모듈 + UPE 핸들러 + dedup + 무료수정 2건 + L5 카운트 | High | Pending |
| FR-10 | 문서 노트(slash 경로 오케스트레이션 동작) + CHANGELOG | Medium | Pending |
| FR-11 | 구버전 CC graceful degradation + 신규 훅 HPQ 경로 인용 | Medium | Pending |
| FR-12 | CHANGELOG 잠정 엔트리(다음 빈 ENH) | Medium | Pending |

### 3.2 비기능 요구사항

| 범주 | 기준 | 측정 방법 |
|----------|----------|-------------------|
| 무회귀 (Skill-도구) | PostToolUse:Skill 부수효과 무변경 | l2-smoke + 기존 skill-orchestrator/audit 테스트 |
| CI 무결성 | 갱신된 L5 불변식(22 이벤트) 포함 전체 게이트 green | 로컬 전체 실행 + push 시 Actions |
| Fail-open | 어떤 핸들러 에러든 exit 0, 확장 절대 차단 안 함 | throw 주입 단위 테스트 |
| 이중발화 방지 | 논리적 1회 호출 → audit/decision 기록 1회 | dedup 단위 테스트(한 턴에 두 이벤트) |
| 경로 인용 | 신규 훅 명령 `${CLAUDE_PLUGIN_ROOT}` 이중 인용 | HPQ-001..011 |
| Docs=Code | 훅 카운트 SoT 포함 drift 0 | docs-code-sync + bkit-full-system |
| Canary 무결성 | `skill_post` 키가 신규 경로에서 미기록 | hook-reachability 테스트 |
| 라이브 수용 | 네이티브 slash가 skill_invoked+phase_transition+안내 생성 | `claude -p --plugin-dir .` probe (QA) |
| 이중언어 | 신규 docs/ 파일 `.en.md`+`.ko.md` 동기화 | 리뷰 |

---

## 4. 성공 기준

### 4.1 완료 정의 (DoD)

- [ ] SC-1: `claude -p "/bkit:pdca do <feature>" --plugin-dir .`(네이티브 slash) → `skill_invoked` audit 엔트리 기록(`bkit_audit_search`/audit 파일로 검증) + `phase_transition` decision-trace 기록 + 주입 컨텍스트에 next-skill 안내 출현
- [ ] SC-2: 무료 수정 A — slash 명령에 대해 IntentRouter 구조화 제안 비어있지 않음(onboardingContext ReferenceError 제거)
- [ ] SC-3: 무료 수정 B — sprint 외 slash-호출 스킬에 대해 Stop `SKILL_HANDLERS` 디스패치 발화(slash 경로 active-skill 마커 기록)
- [ ] SC-4: Skill-도구 경로 무변경 — raw `Skill` 도구 호출이 여전히 `skill_executed` 기록 + 모든 effects 발화(무회귀); 두 경로 동시 발생 시 이중 기록 없음
- [ ] SC-5: Fail-open — 핸들러 throw가 명령을 차단하지 않음(exit 0)
- [ ] SC-6: L5 invocation-inventory가 22 훅 이벤트/갱신된 블록에서 green; 전체 CI-미러 스위트 green; qa-aggregate main 대비 신규 실패 0
- [ ] SC-7: 갭 분석 ≥ 90%(목표 100%); QA_PASS
- [ ] SC-8: docs=code drift 0; CHANGELOG 잠정 엔트리; PR 오픈; 머지는 사용자 승인 대기 → 이후 태그 v2.1.27 + GitHub Release(영문)

### 4.2 품질 기준

- [ ] 신규 데드 코드 없음; 도메인 순수성 green; 영어 전용 구현(docs/ 이중언어 예외)
- [ ] 계약 베이스라인 바이트 동일(이번 릴리스 에이전트/모델 변경 없음)

---

## 5. 리스크와 완화

| 리스크 | 영향 | 가능성 | 완화 |
|------|--------|------------|------------|
| L5 카운트 불변식을 hooks.json과 정확히 lockstep 갱신 안 함 | High | 누락 시 확실 | FR-04 명시; push 전 invocation-inventory + docs-code-sync 실행 |
| 핸들러 버그로 UserPromptExpansion이 명령 차단 | High | Low | Fail-open 엄격(FR-11): 전 로직 래핑, 어떤 에러든 exit 0, `decision:"block"` 절대 미발행 |
| 이중발화(slash-타이핑 스킬이 한 턴에 Skill-도구 호출도) | Medium | Low | 공용 모듈에서 `prompt_id`/세션 dedup(FR-03) |
| 구버전 CC에 UserPromptExpansion 없음 → 수정 inert | Low(무회귀) | Medium | Graceful: 훅 미발화 = 현행 동작; 문서화(FR-11); 플로어 무인상 |
| 신규 `skill_invoked` action이 known-action 단언 audit 소비자/테스트 파손 | Medium | Low | audit 액션 taxonomy/CATEGORIES 추가; action-enum 단언 테스트 grep(연관+유사 스윕) |
| Reachability canary 혼재로 #57317 모니터 약화 | Medium | Low | FR-08: `skill_post` 키 재사용 금지 |
| GitHub Actions 무료 티어 소진 | Low | Medium | 단일 마일스톤 push |

---

## 6. 영향 분석

### 6.1 변경 리소스

| 리소스 | 유형 | 변경 |
|----------|------|--------|
| `lib/orchestrator/skill-invocation-effects.js` | 신규 lib | 공용 부수효과 러너 |
| `scripts/user-prompt-expansion-handler.js`(명칭은 설계) | 신규 훅 스크립트 | slash 경로 트리거, fail-open |
| `scripts/skill-post.js` | 리팩토링 | 공용 모듈 호출; PostToolUse:Skill 트리거 + skill_post canary ping 유지 |
| `scripts/user-prompt-handler.js` | 수정 | onboardingContext ReferenceError |
| `hooks/hooks.json` | 훅 배선 | + UserPromptExpansion 이벤트/블록 |
| `lib/domain/rules/docs-code-invariants.js` | SoT | hookEvents 21→22(+블록) + EXPECTED_HOOK_EVENT_NAMES |
| `lib/audit/audit-logger.js`(CATEGORIES/action) | audit taxonomy | + `skill_invoked` |
| slash 경로 active-skill-marker 호출 | 동작 | slash에서 writeActiveSkill |
| `test/contract/invocation-inventory.test.js` 외 | 테스트 | 카운트 21→22 + 신규 단위 |
| README / CUSTOMIZATION-GUIDE / CHANGELOG / bkit-system | 문서 | slash 경로 노트 + 훅 카운트 |

### 6.2 현재 소비자

| 리소스 | 연산 | 코드 경로 | 영향 |
|----------|-----------|-----------|--------|
| skill-post 부수효과 | FIRE | PostToolUse:Skill → skill-post.js | 공용 모듈로 리팩토링(동작 보존) |
| 훅 카운트 | ASSERT | invocation-inventory L5 vs docs-code-invariants SoT | lockstep 없으면 Breaking(FR-04) |
| `${CLAUDE_PLUGIN_ROOT}` 명령 | ASSERT | HPQ 경로 인용 | 신규 훅 명령 이중 인용 필수 |
| audit action enum | READ/ASSERT | bkit_audit_search, /audit, 테스트 | 신규 `skill_invoked` 등록 필수 |
| skill_post reachability | STAMP | hook-reachability canary | 신규 경로에서 미기록해야 함(FR-08) |
| IntentRouter route() | CALL | user-prompt-handler.js:296 | ReferenceError 수정 → 제안이 이제 채워짐 |
| Stop SKILL_HANDLERS | DISPATCH | unified-stop.js via active-skill 마커 | 이제 sprint 외 slash-skill에서 발화 |

### 6.3 검증

- [ ] Do 단계 연관+유사 스윕: 모든 `matcher:"Skill"` 배선, 모든 `writeActiveSkill` 호출자, audit action-enum 단언, 훅-카운트 단언 grep
- [ ] 인증/권한 표면 없음; 버전 무변경; 계약 베이스라인 무접촉(에이전트/모델 변경 없음)

---

## 7. 아키텍처 고려사항

### 7.1 프로젝트 레벨 선택

bkit 플러그인 내부 — Enterprise급 저장소 컨벤션(lib/ Clean Architecture, 계약 게이트 L1–L5).

### 7.2 핵심 아키텍처 결정 (확정)

| 결정 | 선택 | 근거 |
|----------|--------|-----------|
| 배선 위상 | **Dual-wire**(UserPromptExpansion slash 경로 + PostToolUse:Skill 모델 경로 유지) | 두 호출 경로를 모두 커버하는 근본 수정; 기술부채 없음(사용자 지시) |
| slash 트리거 이벤트 | **UserPromptExpansion** | CC 전용, 실측 확정 구조화 신호 + 자기-필터링; UserPromptSubmit은 slash에 미문서화 |
| audit action(slash) | **`skill_invoked`**(신규) | pre-exec 의미; Skill-도구 경로엔 `skill_executed` 정확 유지(사용자 결정) |
| 훅 안전성 | **Fail-open 엄격** | 핸들러 버그로 사용자 명령을 절대 차단 안 함(사용자 결정) |
| bkit-자체 필터 | `command_source==='plugin'` + 해석가능-스킬 | 실측 확정값; `/simplify` 등에 발화 방지 |
| 공용 모듈 위치 | `lib/orchestrator/skill-invocation-effects.js` | 이미 lib/orchestrator에 있는 intent-router + next-action-engine과 응집 |
| Reachability 키 | `skill_post` 재사용 금지; 실질 관측성 있을 때만 신규 키 | #57317/#126 모니터 보존; gold-plating 회피(설계에서 확정) |
| hooks.json 변경 | 필요(+1 이벤트) → L5 SoT lockstep | 문서화된 전용 이벤트는 불변식 갱신 가치 있음 |

### 7.3 Clean Architecture 접근

신규 공용 모듈은 기존 lib 프리미티브(audit, decision-tracer, pdca status, skill-orchestrator, core marker)를 조합하는 애플리케이션/오케스트레이터 레이어 함수. 훅/스크립트는 어댑터. check-domain-purity green 유지; domain→outer 의존 추가 없음.

---

## 8. 컨벤션 전제조건

- [x] 영어 구현; docs/ 이중언어 쌍; 버전 무변경(CLAUDE.md)
- [x] 훅 경로 인용(HPQ) + 훅-카운트 SoT(`docs-code-invariants.js`)
- [x] ENH 번호: 다음 빈 번호(ENH-370 이후) — Do 단계에서 CHANGELOG 확인
- [x] 계약 베이스라인: 에이전트/모델 변경 없음 → 바이트 동일 유지 필수

---

## 9. 다음 단계

1. [ ] 설계 문서(`docs/02-design/features/skill-post-slash-reach.design.{en,ko}.md`) — 3안 + 전체 I-리스트 + 검증 체크리스트(아키텍처는 §7.2에서 확정; 설계는 모듈 API, dedup 키, canary 결정, 정확한 hooks.json 형태 확정)
2. [ ] 이후 완전 자동: Do(팀) → analyze/iterate(100%) → QA(라이브 `claude -p --plugin-dir .` slash probe) → 문서 동기화 → 단일 push → CI → PR → 사용자 승인 → 머지 → 태그 v2.1.27 → GitHub Release

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | PRD + 리서치 4종 + 사용자 결정(dual-wire, skill_invoked, fail-open)으로부터 초안 | PDCA 파이프라인 |
