# ADR 0012 — Sprint Stop Hook Output Enforcement

> Status: **Accepted**
> Date: 2026-05-29
> Sprint: `v2121-issue-response` (#113, F4~F8)
> Related: ADR 0007 (Sprint as meta-container), ADR 0008 (Sprint phase enum), #93 (gate_fail human-readable report, v2.1.16 precedent), #113 (Sprint screen-output enforcement gap), #77/#111 (session-title isolation), CC #57317 (plugin-hook drop / skill_post missing)
> Trigger: 외부 dogfooder @rohwonseok-ops 이슈 #113 — "Sprint success/intermediate/status/watch/report 경로가 raw JSON 만 반환 → 100% LLM narration 의존. PDCA 는 `pdca-skill-stop.js` 로 Executive Summary 를 강제하나 Sprint 는 동등 장치 0개."

---

## Context

### 1. The Gap (verified 사실)

PDCA 는 `/pdca plan|design|report` 완료 시 Executive Summary + AskUserQuestion + sessionTitle 을 화면에 강제 출력한다(설계 의도). Sprint 는 동등한 장치가 전무했다 — 실측 결과:

| 항목 | PDCA | Sprint (v2.1.20 이전) |
|------|------|------------------------|
| Exec Summary 모듈 | `lib/pdca/executive-summary.js` ✅ | ❌ 없음 (`lib/sprint/` 디렉터리 부재) |
| Stop handler | `scripts/pdca-skill-stop.js` ✅ | ❌ 없음 (`scripts/sprint-skill-stop.js` 부재) |
| SKILL_HANDLERS 등록 | `'pdca'` ✅ | ❌ `'sprint'` 엔트리 없음 |
| phase 전이 summary | — | ❌ advancePhase success payload 에 없음 |
| status/watch 화면 | — | ❌ raw JSON dump |

### 2. Discovery — bare-require self-exec 경로의 결함 (실측 검증)

#113 reporter 는 "SKILL_HANDLERS 에 sprint 등록" 을 제안했다. 그러나 구현 중 실측으로 다음을 발견했다:

- `scripts/unified-stop.js` 의 `executeHandler(handlerPath)` 는 `require(handlerPath)` 후 `handler.run` 이 있으면 호출, 없으면 "self-executing (require triggers execution)" 으로 간주하고 `handled=true` 반환.
- 그러나 `pdca-skill-stop.js` 등은 v2.1.12 #10 에서 **bare-require guard** (`if (require.main !== module) { module.exports = {}; return; }`) 가 추가됨 → unified-stop 이 `require()` 하면 **`{}` 반환 + 본문 미실행** = no-op.
- 경험적 확인: `echo '{"skill_name":"pdca",...}' | node scripts/unified-stop.js` → **빈 출력** (Exec Summary 미발생).

즉 SKILL_HANDLERS → executeHandler → require 경로는 bare-require-guarded handler 에 대해 **죽은 경로**다. 정상 동작하는 handler(`cto-stop.js`, `team-stop.js`)는 모두 `module.exports = { run }` (run-export) 패턴을 쓴다.

### 3. Discovery — dispatch 자체가 production 에서 발동 안 함 (실 런타임 검증)

run-export 로 고쳐도 **부족했다**. 실제 `claude -p --plugin-dir .` 세션(CC v2.1.156)에서 `/sprint status` 실행 후 Stop hook debug 로그:

```
[UnifiedStop] Context received :: { hasSkillName: false, hasToolInput: false }
[UnifiedStop] Detection result :: { activeSkill: null }
[UnifiedStop] No handler matched, using default output
[UnifiedStop] Hook completed :: { handled: false }
```

`detectActiveSkill()` 의 4개 경로가 **전부 실패**:
- (1) `hookContext.skill_name` — CC 가 Stop payload 에 미포함 (`hasSkillName:false` 실측)
- (2) `tool_input.skill` — Stop payload 에 tool_input 없음
- (3) `lib/task/context.getActiveSkill()` — **in-memory `_activeSkill` 변수**를 읽음. hook 마다 별도 process 라 cross-process 전파 불가 + skill-post.js 자체가 CC #57317 로 drop
- (4) PDCA status `session.lastSkill` — sprint 와 무관

→ **production 에서 어떤 skill Stop handler 도 발동하지 않는다** (PDCA exec summary 포함, 동일 systemic 결함). 합성 payload(`{skill_name:'sprint'}`)로만 통과하던 초기 TC-U1 은 이 사실을 가렸다 — 실 런타임(`claude -p`) 검증으로 발견.

---

## Decision

### D1. sprint-skill-stop 은 run-export 패턴을 채택한다

`scripts/sprint-skill-stop.js` 는 `module.exports = { run, buildResponse, ... }` 를 export 하고, 직접 entrypoint 실행(`require.main === module`)도 동시 지원한다. 이로써 unified-stop `executeHandler` 가 `handler.run(hookContext)` 를 호출 → 실제로 Exec Summary 가 stdout 으로 출력된다 (bare-require-`{}` no-op 회피).

**근거**: bare-require 패턴을 답습하면 #113 이 의도한 출력 강제가 production 에서 발동하지 않는다. run-export 는 `cto-stop`/`team-stop` 의 검증된 동작 패턴이다. (단, run-export 는 **필요조건일 뿐 충분조건이 아니다** — Discovery §3 의 detectActiveSkill 해결이 선행되어야 executeHandler 가 호출된다. D5 참고.)

### D5. cross-process active-skill 마커로 dispatch detection 을 확보한다 (핵심)

`detectActiveSkill()` 4경로 전멸(Discovery §3)을 우회하기 위해, sprint 의 단일 진입점인 `scripts/sprint-handler.js` 가 매 호출 시 `.bkit/runtime/active-skill.json` 마커(`{skill, action, id, phase, ts}`)를 기록한다(`lib/core/active-skill-marker.js`). `unified-stop.detectActiveSkill()` 는 (3) 다음 단계로 이 마커를 **peek**(삭제 안 함)하여 `activeSkill='sprint'` 를 해결한다. `sprint-skill-stop.run()` 은 마커에서 action/id 를 읽어 응답을 구성한 뒤 마커를 **consume(삭제)** 한다 — TTL 10분 + consume-once 로 다음(비-sprint) Stop 의 re-fire 를 방지한다.

**근거**:
- file-based → hook 간 process 경계를 넘는다 (in-memory `getActiveSkill` 의 결함 해소).
- sprint-handler 는 `/sprint` 가 **항상** 경유하는 Bash subprocess 이므로 신뢰할 수 있는 기록 지점이다 (skill_post #57317 drop 과 무관).
- CC 의 Stop payload 형태 변화(skill_name 제공 여부)에 의존하지 않는다.
- **검증**: 실 `claude -p --plugin-dir .` 세션에서 `Detection result :: activeSkill: "sprint"` → `Executing skill handler` → `handled: true` + 마커 consume 확인. 회귀 TC-U2(skill_name 없는 realistic payload + 마커 → dispatch) / TC-U3(마커·skill_name 모두 없음 → 미발동, 오발동 방지).

### D2. Sprint Executive Summary 는 PDCA 와 별도 shape 으로 둔다

`lib/sprint/executive-summary.js` 는 신규 모듈로, Sprint shape(Mission / Result / matchRate / Cross-Sprint Integration / Invariant / `claude plugin validate`)를 생성한다. PDCA shape(Problem / Solution / Function UX Effect / Core Value)와 **공유하지 않는다**.

**근거**: 두 shape 은 의미가 다르다(`templates/sprint/report.template.md §1` vs PDCA per-feature). 억지 추상화는 두 도메인을 모두 왜곡한다. Sprint 는 multi-feature 진행률 + cross-sprint 통합이 1급 관심사다.

### D3. usecase 순수성은 dependency-injection 으로 보존한다

`advance-phase.usecase.js` 의 `phaseTransitionSummary` 는 caller-injected `deps.transitionSummaryBuilder` 로 생성한다. usecase 는 fs write 도, `lib/sprint` import 도 하지 않는다 — handler(`sprint-handler.js handlePhase`)가 builder 를 주입한다.

**근거**: #93 의 `failureReporter` DI 규율을 그대로 계승. Application layer 의 순수성(ADR 0005 pilot)을 유지하고, Presentation layer(Sprint 4)가 cross-cutting 출력/표시를 담당하는 레이어 분리를 보존한다. best-effort — builder throw 시 `phaseTransitionSummary=null`, 전이는 차단되지 않는다.

### D4. skill_post drop(#57317) 내성은 skill_name 우선 의존으로 확보한다

sprint-skill-stop 의 dispatch 는 unified-stop `detectActiveSkill()` 의 1순위 경로(`hookContext.skill_name`, CC 제공)에 의존한다. `getActiveSkill()`(skill_post.js 가 채우는 session context)은 #57317 로 drop 될 수 있으므로 2순위 fallback 으로만 사용한다.

---

## Consequences

### 긍정

- Sprint success/phase/iterate/qa/report 완료 시 결정적(deterministic) Exec Summary 화면 출력 → "controllable AI" 약속을 Sprint 에도 확장.
- `/sprint status`·`watch` 가 raw JSON 대신 human-readable per-feature 표(`display` 필드) 제공.
- 병렬 세션 sessionTitle 격리(#111)와 결합 → Sprint 세션도 `[bkit] SPRINT-<phase> <id> ·<tag>` 로 창 구분.

### 부정 / 비용

- **PDCA 계열 latent issue 노출**: pdca-skill-stop 등 bare-require-guarded handler 는 unified-stop 경유 시 no-op 라는 사실이 드러남. 본 ADR 은 sprint 만 run-export 로 해결했고, PDCA 계열 동일 전환은 **후속 carry**(별도 검증 필요 — 직접 entrypoint 호출 경로가 따로 존재하는지 재확인 후 결정).
- run-export + 직접 entrypoint 이중 지원으로 sprint-skill-stop 구조가 약간 복잡(상호 배타 분기).

### 검증

- `test/unit/sprint-skill-stop.test.js` TC-U1 — unified-stop end-to-end dispatch → Exec Summary stdout.
- `test/contract/sprint-skill-handler-registration.test.js` — SKILL_HANDLERS sprint 엔트리 + run-export invariant.
- `test/unit/sprint-lifecycle/advance-phase-transition-summary.test.js` — usecase 순수성(fs/lib-sprint import 부재) contract.
- `claude plugin validate .` ✔ + `claude -p --plugin-dir .` 실 런타임 F8 display 렌더 확인.

---

## Follow-up (carry)

- **CARRY-#113-1**: PDCA 계열 stop handler(pdca-skill-stop / gap-detector-stop / iterator-stop / plan-plus-stop)의 unified-stop dispatch 경로 재검증 — bare-require no-op 가 실제 production 에서 Exec Summary 미발생을 의미하는지, 아니면 별도 직접 invoke 경로가 있는지 확인 후 run-export 전환 여부 결정.
