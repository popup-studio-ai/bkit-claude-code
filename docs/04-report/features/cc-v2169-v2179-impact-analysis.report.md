# CC v2.1.169 → v2.1.179 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물한 번째 정식 적용)

> **Status**: ✅ Final (실증 기반, ADR 0003 21번째 정식 적용 ✦, 신규 ENH(implement) 0건 **17-cycle 연속**, **128 consecutive compatible milestone ✦**, **10-version delta (102 bullets, raw gh-API authoritative)**, Breaking 0건 / Breaking-equivalent 0건, auto-benefit 4건(헤드라인 hook `if` 수정 포함), 차별화 6/6 streak 갱신 (#56293→22 / #57317→16 / #58904→12), **monitor 4건 전부 유지(BG-OTEL-DROP/PLUGIN-HOOK-DROP/CHOICE-LOOP ACTIVE, STOP-SCHEMA-STRICT RESOLVED)**, Phase 1.5 게이트 model-WebFetch under/over-count 회피 (gh-API base64 디코딩 102 확정), R-2 skip +2건(v171/v177), MF-1 3-cycle carry-forward)
>
> **Project**: bkit (bkit-claude-code)
> **bkit Version**: v2.1.22 (plugin.json 실측 일치)
> **Author**: kay kim (POPUP STUDIO PTE. LTD.) + cc-version-researcher + bkit-impact-analyst
> **Date**: 2026-06-17
> **PDCA Cycle**: cc-version-analysis (v2.1.169 → v2.1.179, **10-version delta**)
> **CC Range**: v2.1.169 (baseline) → **v2.1.179** (npm latest=installed, dist-tags stable=2.1.169 / latest=2.1.179 / next=2.1.179)
> **Verdict**: **크리티컬 회귀 0건 / Breaking 0건 / Breaking-equivalent 0건 / 신규 ENH(implement) 0건 17-cycle 연속 / auto-benefit 4건 / 헤드라인 v2.1.176 hook `if` 매칭 수정 = auto-benefit MEDIUM / 차별화 6/6 streak 갱신 / 128 consecutive milestone / monitor 4건 전부 유지 / 권장 CC v2.1.179 즉시 격상 / MF-1 3-cycle carry-forward(미해결)**

---

## 1. Executive Summary

### 1.1 최종 판정

| 항목 | 값 |
|------|----|
| 크리티컬 회귀 건수 | **0건** (bkit v2.1.22 무수정 작동) |
| Breaking Changes (changelog 명시) | **0건** (102 bullets, 8 present 버전 전체 Added/Fixed/Improved/Changed — 제거/API 파괴 0건) |
| **Breaking-equivalent** | **0건** — 동작 변경 후보(v178 `Tool(param:value)` 권한 문법, v178 nested `.claude/` precedence, v178 workflow 키워드 트리거 변경)는 **bkit 부착점 0건 실측 확인** |
| **bkit-friendly (auto-benefit)** | **4건** — **[헤드라인] v2.1.176 hook `if` Read/Edit/Write 경로 매칭 수정(MEDIUM)** / v2.1.179 plugin 로딩 성능 개선(remote, LOW) / v2.1.178 subagent transcript·메시지·backgrounding 수정(DX, LOW) / v2.1.178 auto-mode subagent classifier 사전평가(security governance, LOW) |
| **Neutral (무영향)** | 대부분 — model picker/Fable 5/Bedrock/Remote Control/background-session/Windows·WSL/VSCode/터미널 UI fix 및 managed-settings(v175 `enforceAvailableModels`, v176 `footerLinksRegexes`)는 bkit settings.json 미배포로 부착점 0 |
| **헤드라인 (v2.1.176)** | **auto-benefit MEDIUM** — bkit는 `if:` 게이트 훅을 **실제 2건 사용**(`hooks.json:30` `Write(skills/**/SKILL.md)`, `hooks.json:275` `Write|Edit(docs/**/*.md)`). 수정된 문법을 이미 사용 중이고 핸들러가 경로를 **자체 가드** → silent-gap 신뢰성 위험 제거의 순수 이득, breakage·조치 불필요 |
| **신규 ENH(implement) 후보** | **0건 (17-cycle 연속)** — 모든 후보 YAGNI 탈락(DROP/P3) |
| 마지막 ENH 번호 | ENH-328 (CC-cycle 기준 변동 없음) / 전역 카운터는 내부 v2.1.22 하드닝으로 ENH-366 소비 → **ENH-367 예약(미소비)** |
| **차별화 6/6 streak 갱신** | **#56293 21→22 (ENH-292 P0) / #57317 15→16 (ENH-303 P1) / #58904 11→12 (ENH-310 P1)** — 102 bullets 중 3대 이슈 root cause 직접 해결 0건 |
| **메모리 정정** | 없음 — bkit baseline 재측정 일치 (v2.1.22 / agents 40 / skills 44 / lib 190 modules 22 subdirs) |
| bkit v2.1.22 hotfix 필요성 | **불필요** (128 consecutive milestone 입증) |
| **유지보수 발견 (MF-1, carry-forward)** | ⚠️ `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION = '2.1.118'` — 현 latest 2.1.179 대비 ~61릴리스 stale. **3-cycle 연속 미해결 carry-forward**. 분석 전용 스킬이므로 미수정, 팀 결정 필요(No Guessing) |
| **연속 호환 릴리스** | **128 milestone ✦** (v2.1.34 → v2.1.179, 120 → 128, +8 present — R-2 skip v134/135/151/155/164/**171/177** 제외) |
| ADR 0003 적용 | **YES (21번째 정식 적용 ✦)** |
| **권장 CC 버전** | **v2.1.179 즉시 격상 권고** (auto-benefit 4건, Breaking 0). **stable 2.1.169 drift +10 CRITICAL band** (직전 +16에서 개선 — stable이 2.1.153→2.1.169로 따라잡음) |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────────┐
│  v2.1.169 → v2.1.179 영향 분석 (ADR 0003 21번째 ✦)      │
│  ★ 10-version delta (102 bullets, gh-API authoritative)  │
├──────────────────────────────────────────────────────────┤
│  📊 CC 변경 수집: 102 bullets (8 present 버전)           │
│      v170(2) v172(30) v173(2) v174(13) v175(1)          │
│      v176(22) v178(23) v179(9)                           │
│      R-2 skip: v171, v177 (changelog floor 132 위 = 진성)│
│  🔍 Phase 1.5 게이트: model-WebFetch under/over-count    │
│      • 모델 WebFetch: 179=11 178=16 176=13 174=11 172=27 │
│      • gh-API base64 디코딩(ground truth): 179=9 178=23  │
│        176=22 174=13 172=30 → Total 102 확정             │
│  🔴 실증된 크리티컬 회귀: 0건 (bkit v2.1.22)             │
│  🟢 Breaking: 0건 / Breaking-equivalent: 0건             │
│  🟢 auto-benefit 4건                                     │
│      • [헤드라인] v176 hook `if` 매칭 수정 (MEDIUM)      │
│        bkit 2건 if-gated 훅 신뢰성↑, 조치 불필요         │
│      • v179 plugin 로딩 성능(remote) / v178 subagent DX  │
│      • v178 auto-mode classifier 사전평가(security)      │
│  🆕 신규 ENH(implement): 0건 (17-cycle 연속)            │
│      • ENH-367 예약(미소비)                              │
│  ⚠️ MF-1 carry-forward: RECOMMENDED_VERSION 2.1.118     │
│      ~61릴리스 stale (3-cycle 미해결, 팀 결정 필요)     │
│  📈 차별화: #56293→22 #57317→16 #58904→12               │
│  ✅ 연속 호환: 128 milestone ✦ (v2.1.34~v2.1.179)       │
└──────────────────────────────────────────────────────────┘
```

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **사용자(User)** | ⬆ 개선 | Fable 5 도입(#v170), mid-stream 연결 끊김 시 부분응답 보존(v179), `/model` 피커 model family 표시 수정(v174), subagent transcript 라이브 진행 표시(v178), WSL2 마우스휠 스크롤 수정(v179) |
| **개발자(Dev/bkit)** | ⟷ 무영향 (소폭 ⬆) | bkit 소스 변경 0건, hook/agent/skill 스키마 변경 없음, 17-cycle 연속 무수정. **단 v176 hook `if` 매칭 수정으로 bkit 2건 if-gated 훅의 silent-gap 위험 제거(auto-benefit)**. MF-1만 별도 carry-forward |
| **보안(Security)** | ⬆ 개선 | v178 auto-mode subagent spawn이 launch 前 classifier 평가(차단 우회 갭 차단), v172 `availableModels`가 subagent model override에도 적용, v178 MCP server-level spec이 subagent `disallowedTools`에서 무시되던 버그 fix → CC governance 자동 강화 |
| **운영(Ops)** | ⬆ 개선 | v179 remote plugin 로딩 성능, v172 long-conversation 성능 + idle CPU 감소, v178 compaction `--fallback-model` honor, background-session 안정성 다수 fix |

---

## 2. CC v2.1.170~v2.1.179 변경사항 (102 bullets, raw gh-API authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — model-WebFetch under/over-count 회피

| 버전 | model-WebFetch | gh-API raw (authoritative) | Source | Verdict |
|------|:---:|:---:|------|:---:|
| 2.1.179 | 11 | **9** | gh-API base64 디코딩 | errata (모델 과다) |
| 2.1.178 | 16 | **23** | gh-API base64 디코딩 | errata (모델 과소) |
| 2.1.176 | 13 | **22** | gh-API base64 디코딩 | errata (모델 과소) |
| 2.1.175 | 1 | 1 | gh-API base64 디코딩 | match |
| 2.1.174 | 11 | **13** | gh-API base64 디코딩 | errata (모델 과소) |
| 2.1.173 | 2 | 2 | gh-API base64 디코딩 | match |
| 2.1.172 | 27 | **30** | gh-API base64 디코딩 | errata (모델 과소) |
| 2.1.170 | 2 | 2 | gh-API base64 디코딩 | match |
| **Total bullets** | (불일치) | **102 (행 단위 직접 열거)** | gh-API `contents/CHANGELOG.md \| base64 -d` | **확정** |

- **핵심 학습 (errata learning)**: 1차 model-processed WebFetch는 긴 fix 리스트를 truncate해 대부분 **과소카운트**(178: 16 vs 23, 176: 13 vs 22, 172: 27 vs 30), v179는 역으로 **과다카운트**(11 vs 9). → 게이트 정답은 model 응답이 아니라 **`gh api .../CHANGELOG.md --jq .content | base64 -d`로 디코딩한 raw 파일을 행 단위 직접 열거**하는 것. 본 cycle은 gh-API 디코딩 소스를 ground truth로 채택.
- **spot-check 3건 verbatim 일치**: v176 `"Fixed hook if conditions for Read/Edit/Write tool paths..."` / v172 `"Sub-agents can now spawn their own sub-agents (up to 5 levels deep)"` / v178 `"Added Tool(param:value) syntax for permission rules..."`.
- **CHANGELOG floor 구조 발견 (cc-version-researcher)**: rolling `CHANGELOG.md@main`의 하한이 **v2.1.132**. v2.1.69~v2.1.131은 prune(존재했으나 changelog에서 제거)이며 R-2 skip과 구별됨. **본 cycle 범위(v170~v179)는 floor 위라 전부 retained → R-2 판정 신뢰 가능**.

### 2.2 버전별 bullet 인벤토리 + R-2 skip

| 버전 | present | bullets | 핵심 |
|------|:---:|:---:|------|
| 2.1.179 | ✓ | 9 | mid-stream 연결끊김 부분응답 보존, WSL2 스크롤, sandbox glob 비대화 fix, **plugin 로딩 성능(remote)** |
| 2.1.178 | ✓ | 23 | **`Tool(param:value)` 권한 문법**, nested `.claude/skills` 로딩, nested `.claude/` precedence, **auto-mode subagent classifier 사전평가**, subagent transcript/메시지/backgrounding 수정, **MCP server-level spec subagent `disallowedTools` 무시 fix** |
| **2.1.177** | ✗ | — | **R-2 true skip** (floor 위 retained 범위 내 부재 = 진성 semver skip) |
| 2.1.176 | ✓ | 22 | **hook `if` Read/Edit/Write 경로 매칭 fix**, `footerLinksRegexes` 설정, `availableModels` enforcement, session title 언어화 |
| 2.1.175 | ✓ | 1 | `enforceAvailableModels` managed setting |
| 2.1.174 | ✓ | 13 | `wheelScrollAccelerationEnabled`, `/model` 피커 family/label fix, background-session ANTHROPIC_* env 격리 fix |
| 2.1.173 | ✓ | 2 | Fable 5 `[1m]` suffix 정규화, Windows sandbox 경고 fix |
| 2.1.172 | ✓ | 30 | **Sub-agents 5단계 중첩**, `model` attr OTEL `lines_of_code.count`, `availableModels` subagent override 적용 fix, `WebFetch(domain:*.x)` 와일드카드 fix, long-conversation 성능 |
| **2.1.171** | ✗ | — | **R-2 true skip** (floor 위 retained 범위 내 부재 = 진성 semver skip) |
| 2.1.170 | ✓ | 2 | **Claude Fable 5 도입**, VS Code 터미널 transcript 미저장 fix |

→ present 8버전, R-2 skip 2건(v171/v177). **Breaking 0 / Breaking-equivalent 0.**

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 직접 재측정 (Numeric Correction Protocol)

| 항목 | 측정값 | 측정 명령 | 이전 메모리 | 판정 |
|------|:---:|------|:---:|:---:|
| bkit version | 2.1.22 | `grep version plugin.json` | 2.1.22 | 일치 |
| agents | 40 | `ls agents/*.md \| wc -l` | 40 | 일치 |
| skills | 44 | `ls -d skills/*/ \| wc -l` | 44 | 일치 |
| lib modules | 190 | `find lib -name '*.js' \| wc -l` | 190 | 일치 |
| lib subdirs | 22 | `find lib -mindepth 1 -maxdepth 1 -type d \| wc -l` | 22 | 일치 |

→ **메인 세션 + 분석가 양측 재측정 일치. 정정 제안 없음.** (SessionStart preflight "34 agents/174 lib" stale 표기 — 채택하지 않음.)

### 3.1 헤드라인 심층 검증 — v2.1.176 hook `if` 매칭 수정

| 항목 | 내용 |
|------|------|
| **CC bullet (verbatim)** | "Fixed hook `if` conditions for Read/Edit/Write tool paths: documented patterns like `Edit(src/**)`, `Read(~/.ssh/**)`, and `Read(.env)` now match correctly" |
| **bkit 부착점 (실측)** | `hooks/hooks.json:30` → `"if": "Write(skills/**/SKILL.md)"` / `hooks/hooks.json:275` → `"if": "Write\|Edit(docs/**/*.md)"` — bkit는 if-gated 훅을 **실제 2건** 사용 |
| **분석 판정** | **auto-benefit MEDIUM** — bkit의 두 패턴은 이미 수정된 "documented syntax"(glob `**` + 파일명)를 사용. 두 핸들러는 발화 후 **경로를 자체적으로 재검증(self-guard)** 하므로, pre-2.1.176의 매칭 갭에서도 오발화/누락이 무해했음. 2.1.176은 silent-gap 신뢰성 위험을 제거하는 **순수 이득** — breakage·조치 불필요 |
| **테스트 영향** | 없음 — 핸들러 self-guard로 contract test 추가 불요(YAGNI). 회귀 위험 0 |

### 3.2 bkit-relevant 플래그 독립 검증

| Bullet | 검증 방법 | 결과 |
|--------|-----------|------|
| **v176** hook `if` Read/Edit/Write 매칭 fix | `hooks/hooks.json` 2개 `if:` 블록 정독 + 핸들러 self-guard 확인 | **auto-benefit MEDIUM** (§3.1) |
| **v172** sub-agents 5단계 중첩 | `lib/orchestrator/sub-agent-dispatcher.js` + `team-protocol.js` + `cache-cost-analyzer.js` 검토 | bkit sequential-first-then-parallel dispatch(ENH-292 Diff#3)는 **자체 오케스트레이션** — CC 중첩 깊이와 직교. #56293 caching mitigation 무영향. Neutral |
| **v172** `availableModels` subagent override 적용 fix | settings.json 배포 여부 | bkit **settings.json 미배포** → 부착점 0. Neutral (governance) |
| **v178** `Tool(param:value)` 권한 문법 (`Agent(model:opus)`) | 방어 계층 검토 | bkit 방어는 **hook 기반**(settings 권한 룰 아님). 신규 문법 채택 부착점 0 → Neutral. 향후 옵션이나 YAGNI |
| **v178** nested `.claude/skills` 로딩 + `.claude/` precedence | bkit skills/output-styles 제공 방식 | bkit 44 skills + 4 output-styles는 **plugin-provided**(`.claude/skills` 아님) → 사용자 nested `.claude/` 우선순위 변경은 plugin 기본값에 무영향. Neutral (사용자 override 가능성 note) |
| **v178** subagent transcript/메시지/backgrounding fix | bkit subagent 다용 패턴 | bkit이 Task로 spawn하는 subagent의 관찰성/안정성 향상 → DX auto-benefit LOW |
| **v178** MCP server-level spec subagent `disallowedTools` 무시 fix | bkit agents frontmatter `disallowedTools` MCP 패턴 grep | bkit agents는 `disallowedTools`에 `mcp__*` 패턴 **미사용** → Neutral |
| **v178** auto-mode subagent classifier 사전평가 | auto-mode 사용 시 | spawn 전 차단 평가 → security governance auto-benefit LOW |
| **v172** `model` attr OTEL `lines_of_code.count` | MON-CC-NEW-BG-OTEL-DROP 관련성 | OTEL **추가** 속성(additive)으로 shutdown-flush metric-drop(#64436)과 별개 → 모니터 미해결 |
| **v175/v176** `enforceAvailableModels`/`footerLinksRegexes` managed setting | settings.json 배포 여부 | bkit settings.json 미배포 → Neutral (no-settings-json-defense 일관) |
| **v179** plugin 로딩 성능(remote) | bkit=plugin runtime | remote 세션 로딩 가속 → auto-benefit LOW |

**Hook 스키마 변경: 없음** (additionalContext=v163, terminalSequence=v141, background_tasks=v145 — 전부 baseline v169 이하). **PreToolUse/PostToolUse/Stop/SubagentStop 이벤트 입출력 스키마 변경: 본 범위 0건.** Agent/Skill frontmatter 스키마: 변경 없음. → contract test 갱신 불필요.

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

신규 ENH(implement) **0건 (17-cycle 연속)**. ENH-367 예약(미소비).

### 4.1 Intent Discovery
- **최대 가치**: v2.1.176 hook `if` 매칭 수정이 bkit의 2건 if-gated 훅(`Write(skills/**/SKILL.md)`, `Write|Edit(docs/**/*.md)`)의 silent-gap 신뢰성 위험을 **무수정으로** 제거. bkit이 별도 작업 없이 자동 수혜.
- **놓치면 안 되는 critical change**: 없음(Breaking 0). v172 sub-agent 5단계 중첩은 bkit sequential dispatch와 직교임을 확인.
- **workaround 대체 native 기능**: 없음. bkit의 6/6 차별화(#56293/#57317/#58904 mitigation)는 본 범위에서 native 대체 미발생 — 3 streak 전부 연장.

### 4.2 후보 평가 (YAGNI)

| 후보 | 출처 | 판정 | 사유 (철학 체크) |
|------|------|------|------------------|
| if-condition 발화 contract test 추가 | v176 | **DROP** | 핸들러 self-guard로 오발화 무해 → 회귀 위험 0. 추가 테스트는 YAGNI |
| `Tool(param:value)` `Agent(model:opus)` 가드레일 (settings 룰) | v178 | **DROP** | bkit 방어는 hook 기반, settings.json 미배포 정책. 도입 시 정책 충돌 → No Guessing |
| sub-agent 5단계 중첩 대응 로직 (dispatcher) | v172 | **DROP** | sequential dispatch 자체 오케스트레이션, CC 중첩과 직교 → 작업 대상 0 |
| nested `.claude/` precedence 사용자 안내 | v178 | **P3 DEFER (번호 미소비)** | 사용자가 plugin 컴포넌트를 nested `.claude/`로 shadow 가능성 — 현 혼란 보고 0건. 향후 docs/06-guide FAQ 1-liner면 충분 |
| managed-settings(enforceAvailableModels 등) 채택 | v175/v176 | **DROP** | bkit settings.json 미배포 → auto-benefit으로 충분 |

→ 17-cycle 연속 무변경 = 성숙 아키텍처 신호. 추측성 ENH 거부가 No Guessing 철학에 부합.

### 4.3 ⚠️ 유지보수 발견 (MF-1, carry-forward) — ENH와 별개

| 항목 | 내용 |
|------|------|
| **위치** | `lib/infra/cc-version-checker.js:40` |
| **현 값** | `const RECOMMENDED_VERSION = '2.1.118';` (직전 2개 cycle 이후 **변동 없음**) |
| **문제** | 현 latest 2.1.179 대비 ~61릴리스 stale. MEMORY 권장선(보수 2.1.123 / 균형 2.1.140)과도 불일치 |
| **본 cycle 조치** | **flag 유지 (미수정)** — 분석 전용 스킬(HARD-GATE) + 임의 bump은 No Guessing 위반 |
| **권고** | 별도 유지보수 작업으로 정책 갱신. 분기 로직 정상. **3-cycle 연속 carry-forward** — 다음 일반 PDCA에서 우선 처리 권고 |

---

## 5. 차별화 6/6 streak 갱신

v170~v179 bullet 중 #56293/#57317/#58904 root cause 직접 해결 **없음** → 카운터 +1:

| Issue | ENH | 이전 | 갱신 | 비고 |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292 (P0) | 21 | **22** | v172 sub-agent 5단계 중첩은 **depth 기능**으로 parallel-spawn cache invalidation 미해결(오히려 cache-cost 표면 확대). bkit Diff#3 유일 mitigation 유지 |
| #57317 PostToolUse drop | ENH-303 (P1) | 15 | **16** | v178 MCP spec subagent `disallowedTools` 무시 fix는 **인접 표면**(hook drop 아님). skill_post plugin-hook-drop reachability 미해결 |
| #58904 heredoc bypass | ENH-310 (P1) | 11 | **12** | 102 bullets 중 heredoc 언급 **0건**. v178 `Tool(param:value)`는 권한 문법 확장으로 heredoc-body 맹점과 무관. bkit Diff#6 독립 면역 유지 |

surface 3/3 code-active: sub-agent-dispatcher.js / unified-bash-post.js / heredoc-detector.js

---

## 6. R-Series Regression Tracker + Release Drift

| 패턴 | 본 delta 증감 | 비고 |
|------|:---:|------|
| R-1 silent npm publish | +0 | 전 present 버전 full CHANGELOG entry 존재 |
| R-2 true semver skip | **+2** | **v171, v177** (changelog floor v132 위 retained 범위 내 부재 = 진성 skip). 누적: v134/135/151/155/164/**171/177** |
| R-3 hotfix chain | +0 | 회귀 연쇄 징후 없음 (v179 mid-stream fix는 단발) |

- **release_drift_score (ENH-309)**: stable=2.1.169 / latest=2.1.179 → **drift = 10 패치 (CRITICAL band ≥8)**. 단 직전 cycle +16(stable 2.1.153 정체)에서 **개선** — stable이 2.1.153→2.1.169로 16릴리스 따라잡음. latest 즉시 격상 안전.

---

## 7. Monitor 상태 (4건 전부 유지)

| Monitor | Issue/근거 | v170~179 처리 | 판정 |
|---------|-------|-----------|------|
| MON-CC-NEW-BG-OTEL-DROP | #64436 | v172 OTEL bullet은 `lines_of_code.count`에 `model` attr **추가**(additive)로 shutdown-flush metric-drop과 별개 | **STAYS ACTIVE** (expectedFix: null) |
| MON-CC-NEW-PLUGIN-HOOK-DROP | #57317 (skill_post) | v178 plugin/subagent fix는 disallowedTools·transcript 표면뿐, hook reachability 미터치 | **STAYS ACTIVE** |
| MON-CC-NEW-CHOICE-LOOP | (registry 등재) | 본 범위 관련 bullet 0건 | **STAYS ACTIVE** |
| MON-CC-NEW-STOP-SCHEMA-STRICT | ENH-366 (P0) | 본 범위 Stop hook 출력 스키마 변경 0건 | **STAYS RESOLVED** |

---

## 8. 최종 평결 및 권장 조치

| 항목 | 값 |
|------|----|
| Critical regressions | **0건** |
| Breaking / Breaking-equivalent | **0건 / 0건** |
| bkit 소스 변경 필요 | **N** (17-cycle 연속 무수정) — MF-1 별도 유지보수 권고(3-cycle carry-forward) |
| Consecutive compatible | **120 → 128 ✦** (v2.1.34~v2.1.179, +8 present, R-2 skip 7건 제외) |
| 신규 ENH(implement) | **0건** (17-cycle 연속, ENH-367 예약 미소비) |
| 권장 CC 액션 | **v2.1.179 즉시 격상 (ADOPT)** — auto-benefit 4건, Breaking 0. stable(2.1.169) drift +10 CRITICAL advisory(직전 +16 대비 개선) |
| ⚠️ 유지보수 권고 | **MF-1 (3-cycle carry-forward)**: RECOMMENDED_VERSION 갱신 — 별도 작업, 팀이 지원 floor 결정 |

### 8.1 메모리 갱신 사항 (반영 완료)
- New-ENH(implement)-zero streak: 16 → **17**
- Consecutive compatible: 120 → **128 ✦** (+8 present)
- Differentiation: #56293=**22**, #57317=**16**, #58904=**12**
- R-2 skip 누적: +2 (v171/v177) → v134/135/151/155/164/171/177
- Architecture baseline: 재측정 일치, 정정 없음 (40/44/190/22)
- 마지막 ENH 번호: ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 미소비**
- Monitor: BG-OTEL-DROP / PLUGIN-HOOK-DROP / CHOICE-LOOP STAYS ACTIVE, STOP-SCHEMA-STRICT STAYS RESOLVED
- MF-1: RECOMMENDED_VERSION stale **3-cycle carry-forward**
- 다음 baseline: **v2.1.179** (다음 분석 v2.1.180부터)

---

## 9. Quality Checklist

- [x] 모든 CC 변경(102 bullets, 8 present 버전) 수집 및 분류
- [x] 각 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] Phase 1.5 raw gate 통과 (model-WebFetch under/over-count 회피, gh-API base64 디코딩 102 확정)
- [x] gh-API `contents/CHANGELOG.md \| base64 -d` 행 단위 직접 열거 (authoritative)
- [x] bullet count cross-verify (model WebFetch vs gh-API raw, 불일치 5버전 errata 기록)
- [x] ≥3 spot-check (v176/v172/v178) verbatim 확인
- [x] 헤드라인(v176 hook `if`) 부착점 실측 + 핸들러 self-guard 정독 검증
- [x] 아키텍처 재측정 (정정 없음, 40/44/190/22)
- [x] ENH 우선순위 (implement 0건, DROP/P3 DEFER 사유 기록)
- [x] 철학 준수 검증 (No Guessing / Docs=Code / Automation First)
- [x] 파일 영향 매트릭스 + 테스트 영향(0건)
- [x] 차별화 3 streak 갱신 (22/16/12)
- [x] R-2 skip 판정 (v171/v177, changelog floor 근거)
- [x] Monitor 4건 상태 명시
- [x] 한국어 보고서 + memory 파일
- [x] Executive Summary 4-perspective 가치 테이블
