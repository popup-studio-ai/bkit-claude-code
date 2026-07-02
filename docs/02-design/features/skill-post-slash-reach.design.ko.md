# skill-post-slash-reach 설계 문서

> **요약**: bkit의 오케스트레이터 부수효과를 `PostToolUse:Skill`(모델 경로)에 더해 CC의 `UserPromptExpansion` 이벤트(slash 경로)에 dual-wire. 공용 모듈 `lib/orchestrator/skill-invocation-effects.js` 경유. slash 경로는 신규 `skill_invoked` audit action 기록, fail-open, `command_source==='plugin'` 필터. 무료 부수 수정 2건(onboardingContext ReferenceError, active-skill-marker Stop 복원) 포함. L5 훅-카운트 불변식 21→22 이벤트 / 24→25 블록 lockstep. 이슈 #132 대응.
>
> **프로젝트**: bkit Vibecoding Kit · **버전**: 2.1.27 (잠정) · **작성자**: PDCA 파이프라인 · **날짜**: 2026-07-02
> **상태**: 승인됨 (아키텍처는 Plan §7.2에서 확정; 사용자 결정: dual-wire / skill_invoked / fail-open, 2026-07-02)
> **기획 문서**: [skill-post-slash-reach.plan.ko.md](../../01-plan/features/skill-post-slash-reach.plan.ko.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 주 문서화 사용 경로(네이티브 slash)가 모든 오케스트레이터 부수효과를 조용히 우회; bkit이 광고하는 감사 추적이 실사용에서 비어 있음. |
| **WHO** | `/bkit:<skill>` 호출 모든 bkit 사용자; 보고자 @hslee-cmyk(#125/#126 계열); `/audit` 의존 메인테이너. |
| **RISK** | L5 카운트 불변식(21 이벤트)을 정확히 22로 lockstep; UserPromptExpansion은 확장 차단 가능 → fail-open 필수; 이중발화 dedup. |
| **SUCCESS** | 네이티브 slash가 `skill_invoked` audit + `phase_transition` decision + next-skill 안내 생성; 무료 수정 2건 검증; L5 22 이벤트 green; 신규 CI 실패 0. |
| **SCOPE** | 신규 effects 모듈 + 신규 UserPromptExpansion 핸들러 + skill-post 리팩토링 + onboardingContext 수정 + active-skill slash 복원 + hooks.json/SoT 21→22 + audit skill_invoked + 테스트 + 문서. |

---

## 1. 개요

### 1.1 설계 목표

1. bkit의 4개 오케스트레이터 부수효과가 네이티브 slash-command 경로(문서화된 주 사용)에서 CC 전용·실측 확정 `UserPromptExpansion` 이벤트로 발화.
2. 기존 `Skill`-도구(`PostToolUse:Skill`) 경로 무회귀; 공용 구현 1개, 어댑터 2개.
3. Fail-open: 핸들러 버그가 사용자의 slash 명령을 절대 차단하면 안 됨.
4. 2개 잠재 결함 무료 상환(IntentRouter ReferenceError, Stop 디스패치 active-skill 회귀).
5. 모든 의존 표면(훅-카운트 SoT, audit taxonomy, 테스트, 문서) lockstep 이동; 버전 무변경.

### 1.2 설계 원칙

- **No Guessing**: 수정은 R2 실측 재현(UserPromptExpansion이 v2.1.198에서 `command_source:"plugin"`, `command_name:"bkit:pdca"`, `command_args:"status"`로 발화)에 근거. Do 에이전트는 추출 전 `skill-post.js`를 전체 재독 필수.
- **동작 보존 추출**: `skill-post.js:175-230`을 공용 모듈로 그대로 이동; Skill-도구 경로가 동일 호출.
- **Fail-open + 자기-필터링**: 신규 핸들러는 `command_source==='plugin'` + 해석가능 bkit 스킬에만 작동; 어떤 에러든 exit 0, `decision:"block"` 절대 금지.

---

## 2. 아키텍처 옵션

### 2.0 비교

| 기준 | A: 문서만 | B: SKILL.md 프로즈(LLM 수행) | **C: Dual-wire UserPromptExpansion (선택)** |
|----------|:-:|:-:|:-:|
| 기능 수정 | 아니오 | 부분(비결정적) | **예(결정적)** |
| 집행 | 없음 | LLM-준수 | **훅 수준** |
| 접촉 파일 | ~2 | ~44 SKILL.md | ~13 |
| CC-sanctioned | — | 폴백만 | **전용 이벤트** |
| 기술부채 | 버그 잔존 | 프로즈 drift ×44 | **없음** |

**선택: C** — CC 문서가 훅을 결정적 집행 메커니즘으로 명시("스킬이 영향을 멈추면… 훅 사용"). Dual-wire가 두 호출 경로 커버. (사용자 지시: 기술부채 없음, 근본 수정.)

### 2.1 컴포넌트 다이어그램

```
네이티브 SLASH:  사용자가 /bkit:pdca do login 타이핑
  → CC UserPromptExpansion 이벤트 { command_name:"bkit:pdca", command_args:"do login", command_source:"plugin", prompt }
    → scripts/user-prompt-expansion-handler.js  (신규; fail-open)
        필터: command_source==='plugin' && getSkillConfig(normalizeSkillName(command_name)) 존재
        → runSkillInvocationEffects("pdca", {action:"do",feature:"login"}, {source:'slash-command', dedupeKey:prompt_id})
        → next-skill 안내를 STDOUT 출력 (exit 0)

모델 호출: Claude가 Skill 도구 호출
  → CC PostToolUse(Skill) 이벤트 { tool_input:{skill,args} }
    → scripts/skill-post.js  (리팩토링)
        → runSkillInvocationEffects("pdca", {...}, {source:'skill-tool', dedupeKey:...})  ← 동일 모듈
        + skill_post reachability canary ping (여기서만 유지)

공용:  lib/orchestrator/skill-invocation-effects.js
  runSkillInvocationEffects(skillName, args, {source, dedupeKey}):
    1. dedup 가드 (이 세션에서 dedupeKey 이미 처리 시 skip)
    2. writeActiveSkill({skill:skillName})                          ← Stop 디스패치 복원 (무료 수정 B)
    3. orchestrateSkillPost(skillName,{},{args}) → suggestions
    4. audit.writeAuditLog({action: source==='slash-command' ? 'skill_invoked' : 'skill_executed', ...})
    5. if getSkillConfig(skillName)['pdca-phase']:
         recordDecision(phase_transition) + updatePdcaStatus(feature,phase)  (requireDocs-gated)
    return { suggestions }
```

### 2.2 데이터 흐름 — 필터링 & dedup

```
UserPromptExpansion payload → command_source==='plugin'? ──아니오→ exit 0 (bkit 것 아님; 예 /simplify)
                                     │예
  skillName = normalizeSkillName(command_name)   // "bkit:pdca" → "pdca"
  getSkillConfig(skillName) 존재? ──아니오→ exit 0 (미지 스킬)
                                     │예
  args = parseInvocationArgs(command_args)        // "do login" → {action:"do", feature:"login"}
  dedupeKey = prompt_id
  dedup 이미 봄? ──예→ exit 0 (방어적; slash & Skill-도구는 통상 상호배타)
                  │아니오 → runSkillInvocationEffects(...) → stdout 안내
```

### 2.3 의존성

| 컴포넌트 | 의존 | 비고 |
|---|---|---|
| skill-invocation-effects.js | orchestrateSkillPost/getSkillConfig, audit-logger, decision-tracer, pdca status-core, active-skill-marker, skill-name | 모두 기존 lib 프리미티브 |
| UserPromptExpansion 핸들러 | 공용 모듈 + readStdinSync (lib/core/io) | fail-open 래퍼 |
| L5 테스트 | docs-code-invariants SoT | 21→22 / 24→25 lockstep |

---

## 3. 데이터 모델 — audit `skill_invoked`

pre-execution slash 경로용 신규 audit action:
```
{ actor:'system', actorId:'skill-invocation', action:'skill_invoked', category:'skill'(→audit-logger 정규화로 control),
  target:skillName, targetType:'skill', result:'success', destructiveOperation:false, meta:{ source:'slash-command', action, feature } }
```
`skill_executed`는 Skill-도구 경로에 그대로 유지. `skill_invoked`를 audit 액션 taxonomy(audit-logger.js known-actions / enum)에 추가하여 `bkit_audit_search`와 action-단언 테스트가 수용하도록.

---

## 4. 인터페이스 변경 (I-리스트 — 갭 분석 기준)

| # | 파일 | 변경 |
|---|---|---|
| I-1 | `lib/orchestrator/skill-invocation-effects.js` (신규) | `runSkillInvocationEffects(skillName, args, {source, dedupeKey})` — `skill-post.js:175-230` 글루 이전: dedup 가드 → writeActiveSkill → orchestrateSkillPost → writeAuditLog(source별 action) → (pdca-phase 시) recordDecision + updatePdcaStatus. `{suggestions}` 반환. 기존 lib 프리미티브 순수 조합; domain→outer 위반 없음. |
| I-2 | `scripts/skill-post.js` | 인라인 `:175-230`을 I-1 호출로 대체(`source:'skill-tool'`, payload 세션/tool_use id로 dedupeKey). `skill_post` reachability canary ping은 여기서만 유지(신규 경로로 이동 금지). Skill-도구 경로 동작 보존. |
| I-3 | `scripts/user-prompt-expansion-handler.js` (신규) | UserPromptExpansion 훅 스크립트: `readStdinSync`; **fail-open**(전체 본문 try/catch → 어떤 에러든 `process.exit(0)`, `decision:"block"` 절대 미발행); 필터 `input.command_source==='plugin'` AND `getSkillConfig(normalizeSkillName(input.command_name))` truthy; `input.command_args`(문자열)를 공용 `parseInvocationArgs`로 → `{action,feature}`; I-1 호출(`source:'slash-command'`, `dedupeKey:input.prompt_id`); 반환된 next-skill 안내를 STDOUT 출력(UserPromptExpansion 컨텍스트-주입 계약 — additionalContext 아님); exit 0. |
| I-4 | `hooks/hooks.json` | `UserPromptExpansion` 이벤트 1블록 1훅 추가: `node "${CLAUDE_PLUGIN_ROOT}/scripts/user-prompt-expansion-handler.js"` (HPQ 이중 인용). matcher 없음(모든 확장에 발화; 핸들러가 자기-필터). |
| I-5 | `lib/domain/rules/docs-code-invariants.js` | `hookEvents` 21→**22**; `hookBlocks` 24→**25**; `EXPECTED_HOOK_EVENT_NAMES` += `'UserPromptExpansion'` (:98 배열). 블록-카운트 주석(:23) 갱신. |
| I-6 | `test/contract/invocation-inventory.test.js` | 훅-카운트 단언: 이벤트 21→22, 블록 24→25(PostToolUse 3 유지, PreToolUse 2 유지, +1 rest). 이벤트명 나열 TC += UserPromptExpansion. |
| I-7 | `lib/audit/audit-logger.js` | `skill_invoked`는 audit-logger의 **pass-through action 경로**로 기록 — `skill_executed`가 오늘 사용하는 것과 동일 메커니즘(검증: `skill_executed`는 `ACTION_TYPES`에 없음; :381 정규화기가 임의 `entry.action` 수용, :382에서 미지 category를 `'control'`로 매핑). **따라서 `skill_invoked`를 `ACTION_TYPES`에 추가하지 말 것**(이 enum은 기존 불일치 길이 단언 존재 — AL-007은 29, NG-006은 16 기대 — 건드리는 것은 #132 범위 밖). 검증/검색에 `audit-logger.js` 코드 변경 불필요; action 문자열이 통과. Do 에이전트는 의존 전 :375-385 읽고 pass-through 확인. |
| I-8 | `scripts/user-prompt-handler.js` + `lib/orchestrator/intent-router.js` | 무료 수정 A(2부분): (a) ~:296 `onboardingContext` ReferenceError 수정(정의 — `const onboardingContext=''` 또는 의도된 온보딩 문자열, `route()` 시그니처에 맞춤)하여 IntentRouter `structuredSuggestions`가 항상 `[]` 대신 채워지도록; Do 에이전트가 함수 전독하여 올바른 값 공급(No Guessing). (b) **intent-router slash 정규식 확대** `intent-router.js:55`의 `/^\s*\/([\w-]+)(?:\s+(.+))?$/`를 `:` 네임스페이스도 수용하도록(예 `[\w:-]+`) 확대하여 bkit 자체 네임스페이스 명령 `/bkit:pdca do login`이 command 브랜치에서 인식되도록(현재 제외). command-브랜치 처리 전독 먼저 — 확대가 비-bkit 명령을 오라우팅하지 않는지 검증. 이로써 네임스페이스형에 대해 SC-2 충족 가능; I-12 SC-2 회귀를 `/bkit:pdca`로 고정. |
| I-9 | (I-1 내) active-skill 마커 | 무료 수정 B: `writeActiveSkill({skill:skillName})`가 I-1 내부 실행 → 두 경로 모두 기록 → sprint 외 slash 스킬의 Stop `SKILL_HANDLERS` 디스패치 복원. (skill-post.js가 현재 :175에서 기록; I-1로 이동하면 Skill-도구 경로 유지 + slash 경로 추가.) |
| I-10 | (I-1 내) dedup | **양쪽 payload에서 계산 가능한 콘텐츠-도출 dedup 키**(`prompt_id` 아님 — UserPromptExpansion payload에만 존재; prompt_id 키는 경로 간 매치 불가). `dedupeKey = session_id + ':' + skillName + ':' + action + ':' + feature` 사용(session_id는 UserPromptExpansion·PostToolUse 양쪽에 존재; skillName/action/feature는 양쪽에서 동일 도출). 마지막 처리 키를 `.bkit/runtime/` last-invocation-key 파일에 기록; 동일 세션 내 동일 시 skip. 주로 방어적: 네이티브 slash 호출은 UserPromptExpansion만, 모델 호출은 PostToolUse:Skill만 발화(논리적 호출당 상호배타)이므로 진짜 cross-path 이중발화는 드묾 — 하지만 콘텐츠-도출 키가 SC-4/NFR-4("두 경로 동시 발생 시 이중 기록 없음")를 same-path만이 아니라 실제로 집행 가능하게 함. 각 호출자(skill-post.js, UPE 핸들러)가 도출 키 전달; 공용 모듈이 비교+저장 소유. |
| I-11 | reachability canary | 신규 경로에서 `skill_post` 미기록(#57317/#126 모니터 보존). 결정: 이번 릴리스 신규 reachability 키 미추가(slash 경로 effects는 직접 테스트 검증 가능; 키 추가는 hook-reachability 분류기 + HR-010 확장, 한계 가치). `lib/core/hook-reachability.js` 무변경. |
| I-12 | 테스트 (신규/편집) | `test/unit/skill-invocation-effects.test.js`(I-1: 4+1 effects, source별 skill_invoked vs skill_executed, dedup, pdca-phase 게이팅); `test/unit/user-prompt-expansion-handler.test.js`(plugin-필터, 비-plugin 미발화, 평문 미발화, throw 시 fail-open, args 파싱, stdout 안내); I-8(IntentRouter 제안 비어있지 않음) + I-9(slash에서 active-skill 기록) 회귀; L5 카운트 갱신(I-6). issue-NNN/standalone 컨벤션 준수; `check-test-tracking` green. |
| I-13 | 문서 | README/CUSTOMIZATION-GUIDE: slash 경로 스킬이 이제 audit/decision-trace/안내 발화(훅 기반, 두 경로) 명시. bkit-system 훅-카운트 참조 21→22(있는 곳). CHANGELOG `[Unreleased — v2.1.27]` + **ENH-371**. AI-NATIVE-DEVELOPMENT 훅-카운트 참조(있으면). 신규 docs/ 가이드 파일 예상 없음(추가 시에만 이중언어 쌍). |

### 4.1 명시적 무변경 (회귀 가드)

- 계약 베이스라인(양쪽) — 에이전트/모델 변경 없음 → 바이트 동일.
- `Skill`-도구 경로 동작 — I-2는 동작 보존; l2-smoke + skill-orchestrator/audit 테스트 green 유지.
- 버전 필드 — 무접촉(릴리스 시 메인테이너).
- `skill_post` reachability 키 — 재사용 안 함(I-11).
- `PostToolUse:3` / `PreToolUse:2` 블록 서브카운트 — 무변경(신규 블록은 "rest" 이벤트).

---

## 5. 검증 체크리스트 (gap-detector 대상)

### 5.1 핵심 수정
- [ ] I-1 공용 모듈 존재, 5개 effects 조합, `{suggestions}` 반환; source='slash-command'는 `skill_invoked`, 'skill-tool'은 `skill_executed`
- [ ] I-2 skill-post.js가 I-1 호출; skill_post canary ping 유지; Skill-도구 경로 동작 동일
- [ ] I-3 UserPromptExpansion 핸들러: fail-open(try/catch → exit 0), plugin-필터 + 해석가능-스킬 필터, arg 파싱, stdout 안내
- [ ] I-4 hooks.json UserPromptExpansion 블록 존재, HPQ 인용
- [ ] I-5 SoT hookEvents 22, hookBlocks 25, EXPECTED_HOOK_EVENT_NAMES += UserPromptExpansion
- [ ] I-6 invocation-inventory 22/25 green
- [ ] I-7 skill_invoked audit taxonomy 등록
### 5.2 무료 수정 + 가드
- [ ] I-8 (a) onboardingContext 정의(IntentRouter throw 안 함); (b) intent-router 정규식 `:` 수용 확대 → `/bkit:pdca` 인식; SC-2 회귀가 `/bkit:pdca` 사용하여 제안 비어있지 않음
- [ ] I-9 slash 경로 writeActiveSkill; sprint 외 slash 스킬에 Stop 디스패치 발화
- [ ] I-10 dedup 가드; 이중 기록 없음
- [ ] I-11 skill_post 키 신규 경로에서 미기록; hook-reachability 무변경
### 5.3 테스트 + 문서 + 전역
- [ ] I-12 신규 단위 + 회귀 green; check-test-tracking green
- [ ] I-13 문서 동기화(README/CUSTOMIZATION-GUIDE/bkit-system 훅 카운트/CHANGELOG ENH-371)
- [ ] 전체 CI-미러 스위트 green(contract L1/L4 양쪽 바이트 동일, l2-smoke, l2-hook-attribution, l3, L5 22/25, security, units, docs-code-sync, check-deadcode, domain-purity, HPQ, bkit-full-system, validate-plugin, qa-aggregate 신규 실패 0)
- [ ] 연관+유사 스윕 클린: 모든 `matcher:"Skill"` 배선, 모든 `writeActiveSkill` 호출자, audit action-enum 단언, 훅-카운트 단언

---

## 6. 에러 처리

| 조건 | 동작 |
|---|---|
| UserPromptExpansion 핸들러 throw | try/catch → `process.exit(0)`; 확장 진행; 명령 절대 미차단(fail-open) |
| command_source !== 'plugin' | no-op exit 0 (bkit 명령 아님 — 예 `/simplify`) |
| getSkillConfig로 스킬 해석 불가 | no-op exit 0 (미지/로컬 명령) |
| 동일 prompt_id 이미 처리 | dedup skip (이중 기록 없음) |
| 구버전 CC에 UserPromptExpansion 없음 | 훅 미발화 = 현행 동작 = 무회귀 |
| docs 없이 updatePdcaStatus | 기존 requireDocs 게이트가 조기 전진 차단(자기 보호) |

---

## 7. 보안 고려사항

- 신규 훅은 fail-open이며 프롬프트에 대해 읽기 전용; `.bkit/` audit/state에만 기록(기존 핸들러와 동일). 권한/인증 표면 없음. HPQ 경로 인용 집행(I-4). 버전/매니페스트 키 변경 없음.

---

## 8. 테스트 계획

| 레이어 | 대상 | 도구 |
|---|---|---|
| L1 | contract L1/L4 양쪽 베이스라인(바이트 동일), security, units(I-12) | node 러너 |
| L2 | l2-smoke(skill-post 리팩토링), l2-hook-attribution | node |
| L3 | l3-mcp(무영향 — 회귀만) | node |
| L5 | invocation-inventory 22/25(I-6) | node |
| 라이브(QA) | `claude -p "/bkit:pdca do <f>" --plugin-dir .` → skill_invoked audit + phase_transition + 안내(SC-1); 비-plugin `/simplify` bkit audit 없음(필터); Skill-도구 경로 여전히 skill_executed(SC-4); fail-open probe | claude CLI |
| 릴리스 게이트 | docs-code-sync, bkit-full-system, validate-plugin, check-deadcode, domain-purity, HPQ, qa-aggregate main 대비 diff | scripts |

---

## 9. Clean Architecture

| 컴포넌트 | 레이어 | 위치 |
|---|---|---|
| runSkillInvocationEffects | 애플리케이션/오케스트레이터 | lib/orchestrator/skill-invocation-effects.js |
| UserPromptExpansion 핸들러 | 어댑터(훅 스크립트) | scripts/user-prompt-expansion-handler.js |
| skill-post 리팩토링 | 어댑터(훅 스크립트) | scripts/skill-post.js |
| 훅-카운트 SoT | 도메인 규칙 | lib/domain/rules/docs-code-invariants.js |
| audit taxonomy | 인프라 | lib/audit/audit-logger.js |

의존 규칙: 신규 오케스트레이터 모듈은 기존 lib 프리미티브(audit/decision/status/core)를 조합 — 동일 레이어 또는 내향. check-domain-purity green 유지.

---

## 10. 코딩 컨벤션 참조

- 영어 전용; 버전 무변경; ENH-371(다음 빈 번호 검증됨).
- HPQ: 신규 훅 명령 `node "${CLAUDE_PLUGIN_ROOT}/scripts/…"` 이중 인용.
- 신규 테스트 파일 check-test-tracking 통과(게이트 전 git add).
- Do 에이전트는 편집 전 skill-post.js + user-prompt-handler.js + orchestrateSkillPost 전독 필수(No Guessing; 특히 onboardingContext 의도값 + updatePdcaStatus feature/phase 도출).

---

## 11. 구현 가이드

### 11.1 모듈 맵

| 모듈 | 스코프 키 | 설명 | 턴 |
|--------|-----------|-------------|:-----:|
| 공용 effects + skill-post 리팩토링 | `module-1` | I-1, I-2, I-10(dedup), I-9(모듈 내 active-skill) | 10-15 |
| UserPromptExpansion 핸들러 + 배선 | `module-2` | I-3, I-4, I-5, I-6(hooks.json + SoT + L5 lockstep) | 10-15 |
| Audit taxonomy + 무료 수정 A | `module-3` | I-7(skill_invoked), I-8(onboardingContext) | 5-8 |
| 테스트 | `module-4` | I-12(단위 + 회귀 + L5) | 12-18 |
| 문서 + 마무리 | `module-5` | I-13, 전체 게이트, 라이브 QA probe, 갭 분석 | 10-15 |

### 11.2 권장 세션 플랜

`/pdca do`로 단일 세션 팀 분할(module-1/2/3은 공용 모듈 결합 → 준-순차; module-4/5는 이후). 컨텍스트 부족 시 module-2 이후 분할(상태는 Task Management + 메모리 + 본 문서).

---

## 버전 이력

| 버전 | 날짜 | 변경 | 작성자 |
|---------|------|---------|--------|
| 0.1 | 2026-07-02 | 초안 — dual-wire UserPromptExpansion (아키텍처 Plan §7.2 확정 + 사용자 결정) | PDCA 파이프라인 |
