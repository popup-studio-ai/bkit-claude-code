---
template: pm-prd
version: 1.0
description: PM PRD 단계 문서 — Context Anchor + 8섹션 PRD (bkit v2.1.27 skill-post-slash-reach, 이슈 #132)
variables:
  - feature: skill-post-slash-reach
  - date: 2026-07-02
  - author: kay kim (bkit 메인테이너)
  - targetRelease: v2.1.26 → v2.1.27
---

# skill-post-slash-reach PRD

> **기능**: `skill-post-slash-reach`
> **이슈**: [#132](https://github.com/popup-studio-ai/bkit-claude-code/issues/132) (제보자: @hslee-cmyk; #125/#126과 동일한 슬래시-경로 커버리지 계열)
> **단계**: PM / PRD (Plan 이전)
> **날짜**: 2026-07-02
> **작성자**: kay kim (bkit 메인테이너)
> **목표 릴리스**: v2.1.26 → v2.1.27
> **규모**: 내부 개발도구 정합성(correctness) 릴리스 (bkit 플러그인). PM 프레임워크는 의도적으로 축소 적용 — 소비자 대상 GTM 없음.
> **리서치 근거**: `.bkit/research/issue-132-diagnosis.md` (3중 확인된 근본 원인), `.bkit/research/issue-132-web-research.md` (CC `UserPromptExpansion` 스펙 + 순위화된 해결안), `.bkit/research/issue-132-reproduction-log.md` (CC v2.1.198 실증 R2), `.bkit/research/issue-132-codebase-audit.md` (변경 표면 + 2개의 무료 개선). 본 PRD는 종합(synthesis)만 담으며, 네 개의 리서치 파일이 권위 있는 출처이고 여기서 재도출하지 않는다.

---

## 0. Context Anchor (보존 — 모든 하위 단계로 복사)

| 키 | 값 |
|-----|-----|
| **WHY** | `scripts/skill-post.js`는 오직 `PostToolUse` `matcher: "Skill"`에만 배선되어 있어(`hooks.json:67`), 그 4개의 오케스트레이터 부수효과 — (1) `orchestrateSkillPost`를 통한 next-skill / suggested-agent 가이드, (2) `updatePdcaStatus` 훅 레벨 phase 자동 진행, (3) decision-tracer `phase_transition` 기록, (4) audit-logger `skill_executed` 항목 — 는 bkit 스킬이 raw `Skill` tool_use로 호출될 때에만 발동한다. 그러나 네이티브 슬래시 명령(`/bkit:pdca …` — bkit 문서가 가르치는 유일한 호출 형태)은 CLI 레이어에서 확장되며 **어떤** `Skill` tool_use도 방출하지 않는다 → 4개 부수효과 모두가 주(primary)·문서화된 사용 경로에서 죽어(DEAD) 있다. 광고된 "AI 투명성" 감사 추적(audit trail)은 실제 사용에서 비어 있고; decision-trace와 next-skill 가이드는 발동하지 않으며; 훅 레벨 phase 진행 안전망은 절대 돌지 않는다. 이는 #125/#126과 동일한 근본 원인 계열(슬래시-명령-경로 커버리지)이다 — #126은 눈에 보이는 *경고*를 억제했지만 *기능*은 죽은 채로 남겼다(그 Option-1은 구현된 적이 없다). 실증적으로 CC v2.1.198은 네이티브 슬래시 경로에서 실제로 발동하는 전용 `UserPromptExpansion` 이벤트를 탑재하며, 구조화된 `command_name="bkit:pdca"` / `command_args="status"` / `command_source="plugin"`을 제공한다(R2, 일반 텍스트에는 오탐 0) — 확정된 수정 기반이다. |
| **WHO** | (1) **슬래시 명령으로 스킬을 호출하는 모든 bkit 사용자** — 즉 문서화된 주 경로 — 이 현재 audit trail, decision-trace, next-skill 가이드, 훅 레벨 phase 자동 진행을 조용히 하나도 받지 못한다. (2) **반복 제보자 @hslee-cmyk** (#125/#126도 제보) — 슬래시-경로 정합성을 가장 밀착 추적하는 컨트리뷰터. (3) **본 에이전트 / 모델 호출 경로** — 스킬을 raw `Skill` 도구로 호출(비문서 경로)하므로 세션 안에서는 부수효과가 동작하는 것처럼 보였고, 이것이 버그를 가렸다. (4) **메인테이너 (kay kim)** — 새 훅 이벤트가 강제하는 L5 훅-카운트 불변식을 소유. 이해관계자 / 의사결정자: kay kim (bkit 메인테이너). |
| **RISK** | (a) **L5 훅-카운트 불변식 lockstep은 정확해야** — `hooks.json`에 `UserPromptExpansion` 추가는 `hookEvents`를 21→22로 옮기고 `EXPECTED_HOOK_EVENT_NAMES` + `docs-code-invariants` SoT를 건드린다; 불일치 시 CI 레드. (b) 한 턴에서 스킬이 슬래시-타입이자 `Skill`-도구 호출이면 **이중 발동** → `prompt_id`/세션 기준 dedup 필수. (c) **`UserPromptExpansion`은 확장을 차단할 수 있다** — 훅은 반드시 fail-open(어떤 오류든 exit 0, 차단 없음)이어야 버그가 사용자 명령을 삼키지 않는다. (d) **구버전 CC graceful degradation** — `UserPromptExpansion`은 2.1.198에서 확인됐으나 bkit 설치 하한은 더 낮다; 이벤트가 없는 CC에서는 훅이 조용히 무동작 = 오늘의 죽은 상태 = 회귀 없음, 다만 문서화 필요하며 버전 하한을 하드 범프하면 안 된다. (e) **카나리 혼동** — 새 경로에서 `skill_post` 훅-도달성 키를 재사용하면 #57317/#126 드롭 감지 모니터가 약해진다. |
| **SUCCESS** | 수정 후, 네이티브 `/bkit:pdca <action> <feature>`(`claude -p --plugin-dir .`로 재현)가 `skill_invoked`/`skill_executed` audit 항목 + `phase_transition` decision-trace 기록 + next-skill 가이드를 생성한다 — `Skill`-도구 경로가 아니라 **슬래시** 경로에서. 번들된 2개의 무료 개선이 검증된다: (a) `onboardingContext` `ReferenceError`가 고쳐져 IntentRouter 제안이 비어있지 않고; (b) 슬래시 경로에서 `active-skill-marker`가 기록되어 non-sprint 슬래시 스킬에 대해 Stop 핸들러 디스패치가 발동한다. `Skill`-도구 경로 및 모든 기존 훅에 회귀 0; 두 이벤트가 함께 발동할 때 이중 발동 없음; L5 카운트 불변식이 **22 이벤트**에서 그린; 모든 CI 게이트 그린; docs = code; 메인테이너 승인 전 버전 범프 없음; 단일 브랜치 최소 푸시 전달. |
| **SCOPE** | **In**: `skill-post.js:175-230` 부수효과를 소스 무관(source-agnostic) 공유 lib 모듈로 추출(권장 `lib/orchestrator/skill-invocation-effects.js`); 슬래시 경로에서 그 부수효과를 발동하는 NEW `UserPromptExpansion` 훅 추가, `command_source === 'plugin'` + 해석 가능한 bkit 스킬로 필터; 기존 `PostToolUse:Skill` 경로 유지(dedup); L5 훅-카운트 불변식 lockstep(21→22 이벤트 + SoT + `EXPECTED_HOOK_EVENT_NAMES`); `onboardingContext` `ReferenceError` 수정(무료); 슬래시 경로 `active-skill-marker` 복구(무료); 새 훅 명령의 HPQ 경로 인용; 버전 하한 / graceful degradation 처리; 새 유닛 + 회귀 테스트; README / CUSTOMIZATION-GUIDE 노트(`docs/` 하위는 이중언어); CHANGELOG. **Out**: 부수효과를 44개 SKILL.md 프로즈로 이관(기각 — 훅 강제력 상실, 거대 표면); 슬래시 문자열 파싱에 `UserPromptSubmit` 의존(기각 — 슬래시 경로 미문서, non-bkit 명령 필터 불가); 새 경로에서 `skill_post` 카나리 키 재사용(기각 — #57317 모니터 약화); CC 버전 하한 하드 범프(기각 — graceful degradation로 대체); 프로젝트 버전 범프(메인테이너 결정). |

---

## 1. Executive Summary

| 관점 | 요약 |
|-------------|---------|
| **문제 (Problem)** | bkit의 4개 오케스트레이터 부수효과(next-skill/agent 가이드, phase 자동 진행, `phase_transition` decision-trace, `skill_executed` audit)는 오직 `PostToolUse:Skill`에만 배선돼 있는데, 이는 bkit 문서가 가르치는 유일한 호출 형태인 네이티브 슬래시 명령에서는 절대 발동하지 않는다. 그래서 모든 실제 사용자에게 광고된 "AI 투명성" audit trail은 비어 있고, decision-trace와 next-skill 가이드는 돌지 않으며, 훅 기반 강제(bkit 차별점 #1 Memory Enforcer / #2 Defense Layer 6)가 주 경로에서 죽어 있다. #125/#126과 동일한 근본 원인 계열; #126은 오탐 경고는 고쳤으나 기능은 죽은 채로 남겼다. |
| **해결 (Solution)** | 부수효과를 소스 무관 공유 lib 모듈로 추출한 뒤 이중 배선(dual-wire): 모델 호출 경로용 `PostToolUse:Skill`을 유지하면서, 슬래시 경로에서 동일 효과를 발동하는 NEW `UserPromptExpansion` 훅(CC 전용 슬래시 이벤트, v2.1.198에서 실증 확인)을 추가하되 `command_source==='plugin'` + 해석 가능한 bkit 스킬로 필터하고 두 이벤트가 이중 발동하지 않도록 dedup한다. L5 훅-카운트 불변식을 lockstep으로 갱신(21→22). 감사에서 드러난 2개의 무료 개선을 번들: `onboardingContext` `ReferenceError` 수정(IntentRouter 복구) 및 슬래시 경로 `active-skill-marker` 복구(Stop 디스패치 복구). |
| **기능 / UX 효과** | 사용자가 `/bkit:pdca do login`을 실행하면, 그 순간부터 슬래시 경로가 audit 항목, `phase_transition` 기록, 그리고 맥락 내 next-skill 가이드를 생성한다 — 모델 호출 스킬이 이미 받던 동일 오케스트레이션이 이제 실제 사용에도 적용된다. 이면에서는 IntentRouter 제안이 다시 비어있지 않고 non-sprint 슬래시 스킬에 대해 Stop 디스패치가 발동한다. `Skill`-도구 경로는 무변경; 구버전 CC는 새 훅을 그저 무동작으로 본다(회귀 없음). |
| **핵심 가치 (Core value)** | 사람들이 실제로 bkit을 쓰는 방식에 대해 광고된 AI-투명성 audit trail + 오케스트레이터 가이드를 복원하고, 훅 기반 강제(차별점 #1/#2는 훅이 실제 경로에서 발동해야 성립)를 강화한다 — 이중 배선·dedup·CI 그린·docs=code·버전 범프 없음 릴리스로 전달하며, 잠복 데드코드 결함 2개도 무료로 상환한다. |

---

## 2. 문제 / 기회 (Problem / Opportunity)

### 2.1 현재 상태 vs 원하는 상태

| 영역 | 현재 (v2.1.26) | 원하는 (v2.1.27) |
|------|-------------------|-------------------|
| 슬래시-경로 오케스트레이션 | `/bkit:pdca …`는 `Skill` tool_use 방출 안 함 → `skill-post.js` 미실행 → 문서화 경로에서 4개 중 0개 발동 | `UserPromptExpansion`이 슬래시 경로에서 동일 4개 부수효과 발동 |
| Audit trail (`skill_executed`) | 유일 기록자 `skill-post.js:192`; 모든 실제(슬래시) 사용에서 비어 있음; `/audit`·`bkit_audit_search`에 스킬 기록 없음 | 슬래시 호출이 `skill_invoked`/`skill_executed` audit 항목 생성(의미론은 Design에서 결정) |
| Decision-trace (`phase_transition`) | `recordDecision`은 `skill-post.js`에서만 호출; 슬래시 경로에 항목 없음 | 스킬에 `pdca-phase`가 있으면 슬래시 호출이 `phase_transition` 기록 |
| Next-skill / suggested-agent 가이드 | `orchestrateSkillPost`는 `Skill` 도구로만 도달; 슬래시 스킬 이후 가이드 없음 | 슬래시 경로에서 STDOUT으로 가이드 방출(사전 실행, 동일 턴) |
| 훅 레벨 phase 자동 진행 | `updatePdcaStatus(feature,phase)` 슬래시에서 죽음(SKILL.md 프로즈가 자체 갱신하므로 추적은 대체로 생존) | 훅 레벨 안전망이 슬래시 경로에서 실행(`requireDocs` 게이트로 자기 보호) |
| 부수효과 위치 | `skill-post.js:175-230`의 인라인 글루(단일 소스, `Skill`-도구 전용) | 소스 무관 공유 lib 모듈로 추출; 두 경로가 하나의 구현 호출 |
| L5 훅-카운트 불변식 | `hookEvents: 21`; `EXPECTED_HOOK_EVENT_NAMES`에 `UserPromptExpansion` 없음 | `hookEvents: 22`; SoT + `EXPECTED_HOOK_EVENT_NAMES` lockstep 갱신; CI 그린 |
| IntentRouter 통합 | `user-prompt-handler.js:296`이 미정의 `onboardingContext` 전달 → `ReferenceError` → catch → `structuredSuggestions` 항상 `[]` → 100% 데드코드 | `ReferenceError` 수정; IntentRouter 제안 비어있지 않음 |
| 슬래시의 `active-skill-marker` | `writeActiveSkill` 슬래시에서 죽음 → `unified-stop.js` `SKILL_HANDLERS`가 모든 non-sprint 슬래시 스킬에 대해 조용히 실패 | 슬래시 경로에서 마커 기록 → Stop 디스패치 발동 |
| CC-버전 처리 | 해당 없음 | `UserPromptExpansion` 2.1.198 확인; 구버전 CC에서는 훅 무동작(회귀 없음); graceful degradation 문서화 |

### 2.2 기회 프레이밍

- **버그가 실제 사용 100%를 조용히 강타한다.** bkit은 슬래시 형태만 가르치며, 부수효과가 동작하는 모델 호출 `Skill`-도구 경로는 본 에이전트가 세션 안에서 쓰는 방식이라 바로 그 이유로 결함이 가려졌다. 슬래시 경로 수정은 엣지 케이스가 아니라 전체 사용자 기반에 광고된 동작을 복원하는 일이다.
- **이것은 두 핵심 차별점을 강화하는 정합성 수정이다.** bkit #1(Memory Enforcer)과 #2(Defense Layer 6)는 *결정적 훅 기반 강제*로 팔린다; 강제 훅이 사용자가 실제 택하는 경로에서 절대 발동하지 않는다면 그 차별점은 속 빈 것이다. 이 수정은 bkit이 경쟁하는 바로 그 주장을 강화한다 — 중립/강화이며 ENH 후보가 아니다.
- **파일이 이미 열려 있으니 무료 개선 2개를 취한다.** 코드베이스 감사가 동일 슬래시 경로에서 2개의 독립 데드코드 결함을 드러냈다: `onboardingContext` `ReferenceError`(IntentRouter 100% 죽음)와 `active-skill-marker` → Stop-디스패치 회귀(non-sprint 슬래시 스킬의 Stop 핸들러가 조용히 실패). 둘 다 저렴하고 같은 "슬래시에서 죽음" 계열이며, 코드가 현미경 아래 있을 때 함께 상환한다.
- **실증 기반이 이미 깔려 있다.** R2가 모든 "출하 전 검증" 미지수를 제거했다: 이벤트는 2.1.198에서 발동하고, `command_source==='plugin'`은 깨끗한 bkit-자체 필터를 주며, `command_name`은 네임스페이스화됐고, `command_args`는 기존 `parseSkillInvocation` split이 재사용 가능한 평범한 문자열이다. 남은 일은 발견이 아니라 엔지니어링 규율(추출, 이중 배선, dedup, 불변식 lockstep)이다.

---

## 3. 사용자 & 세그먼트 (Users & Segments)

각 집단이 죽은 부수효과와 그 수정을 어떻게 경험하는지로 세분화.

| 세그먼트 | 오늘의 경험 | 이번 릴리스 |
|---------|------------------|--------------|
| **S1 — 모든 bkit 사용자 (슬래시 경로)** | 배운 대로 `/bkit:pdca …` 사용; audit trail·decision-trace·next-skill 가이드·훅 레벨 phase-advance를 조용히 하나도 못 받음 | 슬래시 호출이 이제 audit + decision-trace + 가이드 + phase-advance 생성 |
| **S2 — @hslee-cmyk (반복 제보자)** | #125/#126 이후 #132 제보; 네이티브 `/bkit:pdca report`에서 `skill_post` 동결, raw `Skill` 호출은 갱신됨을 관찰 | #126이 미룬 기능 수정(Option-1)이 마침내 구현; 슬래시 경로 완전 배선 |
| **S3 — 모델 호출 / 본-에이전트 경로** | `Skill` 도구로 스킬 호출 → 부수효과 이미 동작 → 버그 은폐 | 무변경(NFR-1); dedup이 한 턴에 두 이벤트가 발동해도 이중 발동 없음을 보장 |
| **S4 — 메인테이너 (kay kim, CI/거버넌스)** | L5 불변식·SoT·EXPECTED_HOOK_EVENT_NAMES·#57317 카나리 모니터 소유 | 불변식 22로 lockstep 갱신; 카나리 무결성 유지(`skill_post` 키 재사용 없음) |

---

## 4. 가치 제안 (Value Proposition)

**대상(For)** 스킬을 문서화된 방식 — 네이티브 슬래시 명령(`/bkit:pdca …`) — 으로 호출하는 모든 bkit 사용자
**그들은(who)** 그 부수효과가 비문서 `Skill`-도구 경로에서만 발동하는 탓에 bkit이 광고한 오케스트레이션(audit trail·decision-trace·next-skill 가이드·훅 레벨 phase-advance)을 조용히 하나도 받지 못한다,
**이(the)** skill-post-slash-reach 릴리스는 **정합성 / 강화(correctness / hardening) 릴리스로서**,
**부수효과를(that)** 소스 무관 공유 모듈로 추출하고 CC 전용 `UserPromptExpansion` 이벤트를 통해 슬래시 경로에서 발동한다(기존 `Skill`-도구 경로와 dedup),
**불(unlike)** #126 — 오해 소지 경고는 억제했으나 기능은 죽인 채 둠 — 이나 로직을 44개 SKILL.md 프로즈로 이관(결정적 훅 강제 포기)과 달리,
**우리 릴리스는(our release)** 실제 사용에 대해 AI-투명성 audit trail과 오케스트레이터 가이드를 복원하고 bkit 차별점 #1/#2가 의존하는 훅 기반 강제를 강화하며, **`Skill`-도구 경로와 구버전 CC에 회귀 0을 보장**하고 메인테이너 승인 전 버전 범프를 요구하지 않는다.

| VP 구성요소 | bkit 특화 내용 |
|--------------|-----------------------|
| Gain creators | `/audit`·`bkit_audit_search`의 실제 audit trail; 슬래시 경로 `phase_transition` decision-trace; 동일 턴 맥락 내 next-skill 가이드; 훅 레벨 phase-advance 안전망; IntentRouter 제안 부활; non-sprint 슬래시 스킬 Stop 디스패치 발동 |
| Pain relievers | 실제 사용의 조용히 빈 audit 종식; 훅 강제가 돈다는 잘못된 확신 제거; 잔존 데드코드 결함 2개 제거; L5 불변식 예기치 못한 레드 없음(lockstep 갱신); 이중 발동 없음; 구버전 CC 회귀 없음 |
| Products/services | 공유 `skill-invocation-effects` 모듈, 새 `UserPromptExpansion` 훅(plugin 필터·dedup·fail-open), 유지된 `PostToolUse:Skill` 경로, L5 lockstep 갱신, `onboardingContext` 수정, `active-skill-marker` 슬래시 복구, 카나리-키 결정, 새 유닛 + 회귀 테스트, README/CUSTOMIZATION-GUIDE 노트, CHANGELOG |

---

## 5. 요구사항 (Requirements)

> FR = 기능(릴리스가 반드시 전달할 것). NFR = 비기능(품질 기준). FR-2/FR-7/FR-8 내부의 최종 *선택*은 §6에서 프레이밍되어 Design에서 확정된다; FR은 릴리스가 그것을 해결하도록 명령한다. 근본 원인과 변경 표면 사실은 네 개의 리서치 파일에서 유래하며 여기서 재도출하지 않는다.

### 5.1 기능 요구사항 (Functional Requirements)

| ID | 요구사항 | 주 표면 (감사에서) |
|----|-------------|------------------------------|
| **FR-1** | **부수효과를 소스 무관 공유 lib 모듈로 추출.** `skill-post.js:175-230`(writeActiveSkill, orchestrateSkillPost, writeAuditLog, recordDecision, updatePdcaStatus)를 `Skill`-도구 경로와 슬래시 경로 양쪽에서 호출 가능한 단일 재사용 `runSkillInvocationEffects(name, args, { source })` 구현으로 들어올린다. 모든 프리미티브는 이미 lib 레벨 재사용 가능; `orchestrateSkillPost`의 2번째 `result` 인자는 no-op `{}`이므로 모든 효과가 `(skillName, args)`만으로 계산 가능. | NEW `lib/orchestrator/skill-invocation-effects.js` (권장 §6-c); 이를 호출하도록 리팩터된 `scripts/skill-post.js` |
| **FR-2** | **슬래시 경로의 NEW `UserPromptExpansion` 훅.** 공유 부수효과를 발동하는 `UserPromptExpansion` 훅 추가, `command_source === 'plugin'` AND 해석 가능한 bkit 스킬(`getSkillConfig(normalizeSkillName(command_name))`)로 필터. 이 경로에서 평범한 문자열인 `command_args`를 기존 `parseSkillInvocation` split으로 파싱 → `{action, feature}`. next-skill 가이드는 평문 STDOUT(이 이벤트의 승인된 주입 채널)로 방출. 반드시 fail-open(NFR-3 참조). | `hooks.json` (+1 이벤트/블록), NEW 핸들러 스크립트(또는 `user-prompt-handler.js` 확장) |
| **FR-3** | **`PostToolUse:Skill` 경로 유지(모델 호출, dedup).** 기존 `Skill`-도구 경로는 공유 효과를 무변경으로 계속 발동; 한 턴이 `UserPromptExpansion`과 `PostToolUse:Skill`을 모두 트리거해도 각 효과가 최대 1회 기록되도록 dedup 추가(`prompt_id`/세션 dedup 키). | `scripts/skill-post.js`, 공유 모듈의 dedup 가드 |
| **FR-4** | **L5 훅-카운트 불변식 lockstep.** `UserPromptExpansion` 추가는 `hookEvents`를 21→22로 옮긴다; SoT(`docs-code-invariants.js` `hookEvents` + 블록 카운트), `EXPECTED_HOOK_EVENT_NAMES`(+`UserPromptExpansion`), invocation-inventory L5 단언을 동일 changeset에서 갱신하여 CI가 부분 상태를 보지 않도록 한다. | `docs-code-invariants.js:22,98-104`, invocation-inventory L5 게이트 |
| **FR-5** | **`onboardingContext` `ReferenceError` 수정(무료).** `user-prompt-handler.js:296`이 미정의 `onboardingContext`를 참조 → `ReferenceError` → catch → `structuredSuggestions` 항상 `[]`(IntentRouter 100% 죽음). IntentRouter 제안이 비어있지 않도록 수정. | `scripts/user-prompt-handler.js:296` |
| **FR-6** | **슬래시 경로 `active-skill-marker` 복구(무료).** `writeActiveSkill`이 슬래시에서 죽음 → `unified-stop.js` `SKILL_HANDLERS`가 모든 non-sprint 슬래시 스킬에 대해 조용히 실패. 슬래시 경로에서 마커를 기록해 Stop 디스패치가 발동하도록. (FR-1의 공유 모듈 — `writeActiveSkill` 포함 — 을 슬래시 경로에서 호출하면 자연히 충족.) | 공유 모듈 경유 `active-skill-marker.js`; `unified-stop.js` 디스패치로 검증 |
| **FR-7** | **Audit 액션 의미론 — Design 결정 사항.** `UserPromptExpansion`은 사전 실행(pre-execution)으로 발동하므로 슬래시 경로 audit 액션은 기존 사후 `skill_executed` 대신 `skill_invoked`(사전)일 수 있다. Design이 일관된 하나의 체계를 결정(§6-b). | `lib/audit/audit-logger.js`; audit 액션 상수 |
| **FR-8** | **도달성 카나리 키 — Design 결정 사항.** 새 경로에서 `skill_post` 훅-도달성 키를 재사용하지 말 것(로더 혼동, #57317/#126 드롭 감지 모니터 약화). Design이 별도 키 또는 무(none)를 선택(§6-e). | `hook-reachability.js:36-39`, `hook-reachability.test.js` HR-010 |
| **FR-9** | **테스트.** 추가: (a) 공유 `runSkillInvocationEffects` 모듈 새 유닛 테스트(양쪽 `source` 값); (b) `UserPromptExpansion` 핸들러 테스트(plugin 필터·arg 파싱·fail-open·가이드 STDOUT); (c) 2개 무료 개선 회귀 테스트(IntentRouter 제안 비어있지 않음; non-sprint 슬래시 스킬 Stop 디스패치 발동); (d) dedup 테스트(두 이벤트, 단일 기록). | `test/**` 신규 + 갱신 픽스처 |
| **FR-10** | **문서.** 슬래시-경로 오케스트레이션/audit이 이제 동작함을 README + CUSTOMIZATION-GUIDE에 노트; 파일이 `docs/` 하위면 이중언어(`.en.md` + `.ko.md`). | README, CUSTOMIZATION-GUIDE, `docs/` 이중언어 쌍 |
| **FR-11** | **버전 하한 / graceful-degradation 처리.** `UserPromptExpansion`은 2.1.198에서 확인; 구버전 CC에서는 훅 무동작 = 오늘의 죽은 상태 = 회귀 없음. CC 버전 하한을 하드 범프하지 말 것; graceful degradation과 확인 가능하면 정확한 도입 버전 문서화. | 문서 노트; 하한 범프 없음 |
| **FR-12** | **CHANGELOG.** 슬래시-경로 부수효과 복원, 이중 배선 + dedup, L5 lockstep, 2개 무료 개선을 다루는 CHANGELOG 항목 추가. 버전 헤딩은 리포 규칙에 따라 잠정/미출시. | `CHANGELOG.md`, PR 설명 |

### 5.2 비기능 요구사항 (Non-Functional Requirements)

| ID | 요구사항 | 검증 |
|----|-------------|--------------|
| **NFR-1** | **`Skill`-도구 경로 + 모든 기존 훅에 회귀 0** — 모델 호출 스킬 호출이 이전과 정확히 동일하게 모든 부수효과 발동. | `PostToolUse:Skill` 경로 스모크; 기존 훅 스위트 그린 |
| **NFR-2** | **갱신된 L5 카운트 불변식 포함 모든 CI 게이트 그린** — invocation-inventory L5가 22 이벤트에서 통과; 레드로 남는 baseline/불변식 없음. | GitHub Actions 그린; L5가 22 단언 |
| **NFR-3** | **새 훅 fail-open** — `UserPromptExpansion` 핸들러의 어떤 오류든 exit 0으로 나가고 사용자 명령 확장을 절대 차단하지 않음. | 핸들러 오류 주입 테스트 → exit 0, `decision:"block"` 없음 |
| **NFR-4** | **두 이벤트 발동 시 이중 발동 없음** — `UserPromptExpansion`과 `PostToolUse:Skill`을 모두 트리거하는 단일 턴이 각 효과를 최대 1회 기록. | `prompt_id`/세션 dedup 테스트 |
| **NFR-5** | **새 훅 명령의 HPQ 경로 인용 준수** — 새 `hooks.json` 명령의 모든 `${CLAUDE_PLUGIN_ROOT}`가 이중 인용(HPQ-001..011). | HPQ 게이트; 새 명령 grep 감사 |
| **NFR-6** | **docs = code, 드리프트 0** — README/CUSTOMIZATION-GUIDE 노트, SoT, `EXPECTED_HOOK_EVENT_NAMES`가 출하된 hooks.json과 일치. | 수동 + grep 감사 vs 출하 파일 |
| **NFR-7** | **메인테이너 승인 전 버전 범프 없음** — `plugin.json` 버전 무변경; CHANGELOG 헤딩 잠정/미출시. | Diff 검토 — 버전 필드 무변경 |
| **NFR-8** | **단일 브랜치, 최소 푸시 전달** — 모든 변경 하나의 브랜치; hooks.json 이벤트 추가 + SoT + `EXPECTED_HOOK_EVENT_NAMES` + L5 단언이 하나의 원자적 changeset으로 착지해 CI가 부분 상태를 보지 않음. | 브랜치/PR 구조 검토 |
| **NFR-9** | **카나리 무결성 유지** — #57317/#126 `skill_post` 드롭 감지 키가 새 경로에서 스탬프되지 않음. | `hook-reachability.test.js` HR-010 기대집합이 `skill_post`에 대해 무변경 |
| **NFR-10** | **이중언어 문서 완비** — 신규/편집된 모든 `docs/` 파일이 짝지어진 `.en.md` + `.ko.md` 형제로 동기 출하. | 형제-쌍 존재 + 내용 동등성 검토 |

---

## 6. Design에서 내릴 핵심 결정 (Key Decisions)

> PRD는 최종 선택을 의도적으로 Design에 남긴다; 각 결정은 프레이밍된 옵션 + 결정적 긴장을 나열한다. 모두 네 개의 리서치 파일에 근거한다.

**(a) 배선 토폴로지 — `UserPromptExpansion`-단독 vs 이중 배선.**
- 옵션 A1 (리서치 1순위, PRIMARY): `UserPromptExpansion` 단독.
- 옵션 A2 (리서치 2순위, 완전성 위해 RECOMMENDED): 이중 배선 — 슬래시 경로용 `UserPromptExpansion` AND 모델 호출 경로용 `PostToolUse:Skill` 유지, `prompt_id`/세션 dedup.
- 결정적 긴장: 단일 이벤트 단순성(A1) vs 양쪽 호출 형태 완전 커버(A2). A2 권장: 모델 호출 사용(본-에이전트 경로)은 실재하며 계속 동작해야 하고, dedup이 안전하게 만든다.

**(b) Audit 액션명 — `skill_invoked` vs `skill_executed`.**
- 옵션 B1: 사전 실행 슬래시 경로에 `skill_invoked` 방출(의미상 정확; 웹 리서치 §Q5 권장), 사후 `Skill`-도구 경로에는 `skill_executed` 유지.
- 옵션 B2: 단일 검색 가능 액션명을 위해 두 경로를 `skill_executed`로 통일(더 단순한 `/audit` 쿼리; 사전/사후 구분은 약간 상실).
- 결정적 긴장: 의미 정밀도(B1) vs audit-쿼리 단순성(B2). FR-3 dedup과 일관되어 이중 발동 턴이 한 호출에 두 이름을 방출하지 않도록.

**(c) 공유 모듈 위치 — `lib/orchestrator/skill-invocation-effects.js` vs 대안.**
- 옵션 C1 (권장): NEW `lib/orchestrator/skill-invocation-effects.js`, `runSkillInvocationEffects(name, args, { source })` export.
- 옵션 C2: 기존 모듈에 병치(예: `lib/skill-orchestrator.js` 확장).
- 결정적 긴장: 전용·명확한 소스 무관 모듈(C1) vs 신규 파일 최소화(C2). 발견성·단일 책임 위해 C1 권장.

**(d) bkit-자체 명령 필터 — `command_source==='plugin'` + 네임스페이스 vs config-해석.**
- 옵션 D1: `command_source === 'plugin'` AND `command_name`이 bkit 네임스페이스로 시작하는지 필터.
- 옵션 D2: `command_source === 'plugin'` AND `getSkillConfig(normalizeSkillName(command_name))`이 해석되는지 필터(실제 bkit 스킬이 아닌 plugin 명령 거부).
- 결정적 긴장: 저렴한 접두사 검사(D1) vs 권위 있는 해석(D2). D2(또는 D1∧D2) 권장 — bkit 스킬 config가 없는 plugin 명령에는 효과를 발동하지 않도록.

**(e) 도달성 카나리 키 — 별도 키 vs 없음.**
- 옵션 E1: `UserPromptExpansion` 경로용 NEW 별도 도달성 키 도입.
- 옵션 E2: 새 경로에서 카나리 스탬프 없음.
- 결정적 긴장: 새 경로 건강도 모니터링(E1) vs 최소 표면 + `skill_post` #57317 모니터 위험 0(E2). 어느 쪽이든 하드 제약: `skill_post` 키 재사용 금지(NFR-9).

---

## 7. 리스크 & 완화 (Risks & Mitigations)

| # | 리스크 | 심각도 | 완화 |
|---|------|----------|------------|
| R1 | **L5 불변식 lockstep은 정확해야** — SoT + `EXPECTED_HOOK_EVENT_NAMES` + L5 단언 갱신 없이 `UserPromptExpansion`(21→22) 추가 시 CI 레드 | High | FR-4 + NFR-8: hooks.json 이벤트 + SoT + 이름 + L5 단언을 하나의 원자적 changeset으로 착지; 병합 전 invocation-inventory가 22 단언하는지 검증 |
| R2 | **이중 발동** — 한 턴에 스킬이 슬래시-타입이자 `Skill`-도구 호출일 때 | Med | FR-3 / NFR-4 `prompt_id`/세션 dedup; 두-이벤트 케이스를 다루는 dedup 유닛 테스트 |
| R3 | **`UserPromptExpansion` 확장 차단** — 핸들러 버그가 사용자 명령을 삼킬 수 있음 | High | NFR-3 fail-open: 어떤 오류든 → exit 0, `decision:"block"` 절대 방출 안 함; 오류 주입 테스트 |
| R4 | **구버전 CC 회귀** — 도입 버전 미만 CC에 이벤트 부재 | Low | FR-11 graceful degradation: 이벤트 부재 = 무동작 훅 = 오늘의 죽은 상태 = 회귀 없음; 문서화, 하드 하한 범프 없음 |
| R5 | **카나리 혼동** — 새 경로에서 `skill_post` 스탬프 시 #57317/#126 드롭 감지 약화 | Med | FR-8 / NFR-9: 별도 키 또는 없음; `skill_post`에 대한 HR-010 기대집합 무변경 |
| R6 | **Audit-액션 불일치** — `skill_invoked`/`skill_executed` 혼용이 `/audit` 쿼리를 분절 | Low | FR-7 / §6-b: Design에서 하나의 일관 체계 선택; dedup과 정렬해 한 호출 → 한 액션명 |
| R7 | **HPQ 미준수** — 새 훅 명령의 `${CLAUDE_PLUGIN_ROOT}` 미인용 → 공백 포함 경로 실패 | Low | NFR-5: 모든 `${CLAUDE_PLUGIN_ROOT}` 이중 인용; HPQ 게이트 |
| R8 | **무료-개선 스코프 크립** — FR-5/FR-6 번들이 변경을 부풀림 | Low | 둘 다 동일 슬래시-죽음 계열이고 작으며 FR-1 공유 모듈(FR-6) / 한 줄 수정(FR-5)로 자연 충족; 각각 회귀 테스트(FR-9) 확보 |
| R9 | **이중언어 드리프트** — README/GUIDE 노트가 한 언어로 출하되거나 드리프트 | Low | NFR-10 형제-쌍 + 내용 동등성 검토 병합 전 |

---

## 8. 성공 기준 & 릴리스 노트 계획 (Success Criteria & Release-Notes Plan)

### 8.1 측정 가능한 성공 기준

| SC | 기준 | 측정 |
|----|-----------|---------|
| SC-1 | 슬래시-경로 부수효과 발동 | 네이티브 슬래시로 `/bkit:pdca <action> <feature>`(`claude -p --plugin-dir .`로 재현)가 `skill_invoked`/`skill_executed` audit 항목 AND `phase_transition` decision-trace 기록 AND next-skill 가이드 생성 |
| SC-2 | 무료 개선 #1 — IntentRouter 부활 | `onboardingContext` 수정 후 IntentRouter `structuredSuggestions`가 비어있지 않음(회귀 테스트) |
| SC-3 | 무료 개선 #2 — Stop 디스패치 | `unified-stop.js` `SKILL_HANDLERS` 디스패치가 non-sprint 슬래시 스킬에 발동(슬래시 경로에 마커 기록됨) |
| SC-4 | `Skill`-도구 경로 무변경 | 모델 호출 스킬 호출이 여전히 모든 부수효과 발동; 한 턴에 두 이벤트 트리거 시 이중 발동 없음 |
| SC-5 | L5 카운트 불변식 22에서 그린 | invocation-inventory L5가 `hookEvents: 22`로 통과; SoT + `EXPECTED_HOOK_EVENT_NAMES` 일치 |
| SC-6 | Fail-open 검증 | `UserPromptExpansion` 핸들러에 오류 주입 → exit 0, `decision:"block"` 없음, 명령 여전히 확장 |
| SC-7 | 신규 CI 실패 없음 | qa-aggregate / GitHub Actions가 릴리스 이전 baseline 대비 신규 실패 0; HPQ 그린 |
| SC-8 | 카나리 무결성 | `skill_post` 도달성 키가 새 경로에서 스탬프되지 않음; HR-010 기대집합 무변경 |
| SC-9 | docs = code, 드리프트 0 | README/CUSTOMIZATION-GUIDE 노트 존재(`docs/` 하위는 이중언어); 버전 필드 무변경; CHANGELOG 항목 존재 |

### 8.2 릴리스 노트 계획 (내부 개발도구 정합성 범위)

- **채널**: CHANGELOG.md 항목 + PR 설명. 외부 마케팅 없음(내부 정합성 릴리스).
- **공지 내용**: 슬래시-경로 부수효과가 왜 죽었는지(`PostToolUse:Skill`이 네이티브 슬래시에서 절대 발동 안 함), `UserPromptExpansion`이 어떻게 복원하는지, 이중 배선 + dedup 설계, L5 lockstep(21→22), 2개 무료 개선(IntentRouter, Stop 디스패치). 구버전 CC의 graceful degradation과 이것이 #126이 미룬 기능 수정을 완성함을 명시.
- **롤아웃**: 단일 브랜치, 최소 푸시; hooks.json 이벤트 + SoT + `EXPECTED_HOOK_EVENT_NAMES` + L5 단언이 하나의 원자적 단위로 착지해 CI가 부분 상태를 보지 않음; 버전 번호는 리포 규칙에 따라 메인테이너에게 위임.
- **릴리스 후 감시**: 실제(슬래시) 사용이 이제 audit + decision-trace 항목을 생성하는지 확인; 이중 발동 제보 없음 확인; #57317 `skill_post` 모니터가 여전히 진짜 드롭을 감지하는지 확인; cc-version-analysis 롤링 상태가 정확한 `UserPromptExpansion` 도입 버전 vs 설치 하한을 계속 추적.

---

## 부록 — 출처 표기 (Attribution)

PM 프레임워크 골격(Context Anchor, JTBD 방식 VP, 세그먼테이션)은 Pawel Huryn의 [pm-skills](https://github.com/phuryn/pm-skills)(MIT License) 패턴을 통합하며, 내부 개발도구 정합성 릴리스에 맞춰 축소 적용했다. 모든 기술적 사실은 헤더에 인용된 네 개의 리서치 파일(`issue-132-diagnosis.md`, `issue-132-web-research.md`, `issue-132-reproduction-log.md`, `issue-132-codebase-audit.md`)에서 유래하며, 본 PRD에서 재도출하지 않는다.

**다음 단계**: `/pdca plan skill-post-slash-reach` (이 PRD는 Plan 단계에서 자동 참조됨).
