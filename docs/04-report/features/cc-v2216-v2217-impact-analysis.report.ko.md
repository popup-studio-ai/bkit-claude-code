# CC v2.1.215 → v2.1.217 영향 분석 보고서

- **분석 사이클**: #28
- **분석일**: 2026-07-22
- **범위**: CC v2.1.216 (40 bullets) + v2.1.217 (20 bullets) = **60 bullets**
- **설치 버전**: 2.1.217 → **latest 2.1.217**
- **dist-tags**: `latest=2.1.217`
- **결론**: **0 Breaking / 0 ENH / 전면 호환** — bkit 조치 불요. 연속 호환 **160**, 0-ENH 연속 **28사이클**

---

## 1. Executive Summary

CC v2.1.216·v2.1.217은 총 60 bullets로 **대부분 Fix 중심(216: 30 Fixed / 217: 13 Fixed)** 릴리스입니다.
신규 API·훅 이벤트·breaking change는 없으며, bkit 44 skills / 34 agents / 22 hook events 전 표면에
**호환성 무영향**입니다.

이번 사이클의 특징은 **CC가 bkit의 기존 설계·차별화를 상류에서 재확인한 두 사건**입니다:

1. **(217) 중첩 서브에이전트 기본 비활성화** — bkit은 이미 v2.1.69부터 이 제약을 문서화하고
   `/pdca team`(독립 세션, 1-level Task) 경로로 우회 설계했습니다. CC가 이를 **하드 기본값**으로
   확정 → bkit 아키텍처가 옳았음을 **상류에서 검증(vindication)**. 조치 불요.
2. **(216) 플러그인 스킬 `name:` frontmatter의 autocomplete 프리픽스 유실 수정** — bkit 44 skills
   전원이 영향권이던 문제를 CC가 **네이티브로 수정**. bkit 이슈 #125 / MF-3의 근본 원인이
   상류에서 해소 → MF-3 CLOSE 검토 권고.

### 4-관점 가치 표

| 관점 | 평가 | 근거 |
|------|------|------|
| **호환성** | ✅ 무영향 | 0 breaking. 60 bullets 전량 IMMUNE 또는 상류-해소. 변경 대상 파일 0건 |
| **기능 기회** | ➖ 없음 | bkit이 활성화해야 할 신규 native 표면 부재 (동시성 상한·중첩 spawn 모두 bkit 기존 모델과 일치) |
| **DX(간접 수혜)** | 🟢 개선 | (216) skill 프리픽스 복원 → bkit 44 skills가 `bkit:<skill>`로 정상 autocomplete / (216) 세션 중 skill 변경 hot-reload / (216) quadratic 정규화 slowdown 수정 → 장기 오케스트레이션 세션 가속 |
| **리스크** | 🟡 버전 드리프트(경미) | `RECOMMENDED_VERSION` stale 2.1.198 → latest 대비 **19-release 뒤처짐(CRITICAL)**. maintainer bump 권장 |

---

## 2. Phase 1: CC 변경사항 조사

### 2.1 분류 (216 + 217)

| 분류 | v2.1.217 | v2.1.216 | 합계 |
|------|---------|---------|------|
| Breaking | 0 | 0 | **0** |
| Added (Feature) | 3 | 1 | 4 |
| Fixed | 13 | 30 | 43 |
| Improved | 1 | 5 | 6 |
| 기타(Changed/Capped/평문) | 3 | 4 | 7 |
| **총 bullets** | **20** | **40** | **60** |

### 2.2 bkit 관련 핵심 항목 (외부 이슈 매핑 포함)

| # | Bullet (verbatim, 발췌) | 영향 | GitHub 이슈 | bkit 판정 |
|---|------------------------|------|------------|-----------|
| 217 | Changed subagents to no longer spawn nested subagents by default (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to allow) | HIGH | #68110(driver), #78406(doc) | **IMMUNE / 설계 검증** — §4.2 #1 |
| 217 | Added cap on concurrently-running subagents (default 20, `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) | MEDIUM | #63938(delivered) | **IMMUNE** — bkit 최대 동시성 3 |
| 217 | Fixed CLAUDE.md/SKILL.md `paths` frontmatter many brace groups OOM-killing CLI at startup | MEDIUM | (내부) | **IMMUNE** — bkit frontmatter brace-expansion 0건 |
| 216 | Fixed plugin skills with a `name` frontmatter field losing their plugin prefix in slash-command autocomplete | **HIGH** | #22063(closed not_planned인데 수정됨) | **상류 해소** — MF-3/#125 근본원인 |
| 216 | Fixed Bash permission checking for compound statements with redirects inside `&&` lists or negations | MEDIUM | #28784, #29491, #16561 | **IMMUNE / synergy** — Layer-6 자체 훅 |
| 216 | Fixed Bash parsing of non-ASCII chars / PowerShell invisible Unicode permission | MEDIUM | — | **IMMUNE / synergy** |
| 216 | Fixed workflow/scheduled-task writes following a symlink at `.claude` + `/rewind` symlink 보호 | MEDIUM | — | **IMMUNE** — bkit `.bkit/checkpoints/` 자체 경로 |
| 216 | Fixed worktree-isolated subagents redirecting git into shared checkout | MEDIUM | — | 간접 수혜(worktree 격리 강화) |

> 나머지 저관련 bullets(emoji autocomplete, Windows auto-update, mTLS/OAuth Desktop, screen-reader,
> OTEL signal-scoping, resume TypeError, dataviz palette 등)는 bkit 표면 없음 — LOW/IMMUNE.

---

## 3. Phase 1.5: Raw Source Verification Gate

메모리 교훈(model-WebFetch cross-section 환각 위험)에 따라 **raw 바이트 직행**으로 확정했습니다.

| Field | Agent reported | Raw verified | Source | Verdict |
|-------|---------------|--------------|--------|---------|
| Added (217/216) | 3 / 1 | 3 / 1 | raw CHANGELOG | match |
| Fixed (217/216) | 13 / 30 | 13 / 30 | raw CHANGELOG | match |
| Improved (217/216) | 1 / 5 | 1 / 5 | raw CHANGELOG | match |
| Breaking | 0 | 0 | raw CHANGELOG | match |
| **Total bullets** | **60** | **60** (20+40) | raw + gh api | **match** |

**교차 검증 소스 (2종, 완전 일치)**
1. `curl raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md`
   → 헤더 grep(`3:## 2.1.217`, `26:## 2.1.216`, `69:## 2.1.215`) + 행범위 `grep -cE "^- "` → 20 / 40
2. `gh api repos/anthropics/claude-code/releases/tags/v2.1.217` 및 `.../v2.1.216`
   → release body `grep -cE "^- "` → 20 / 40 (raw와 바이트 일치)

**Spot-check**: 두 릴리스의 orchestration·permission·skill-namespace 관련 핵심 bullet(217 #18/#19,
216 name-prefix / compound-redirect) verbatim 대조 완료. **errata 0건.**

---

## 4. Phase 2: bkit 영향 분석

### 4.1 아키텍처 실측 (Glob/Read/Grep + Bash 이중 측정)

| 항목 | 실측 | 메모리 기록 | 판정 |
|------|------|------------|------|
| Agents | 34 | 34 | 일치 |
| Skills | 44 | 44 | 일치 |
| Hook events | 22 | 22 | 일치 |

> Numeric Correction 불요. 메인 세션이 `ls -1 agents/*.md`(34), `ls -1 skills/*/SKILL.md`(44),
> `hooks/hooks.json` .hooks 키 22개(SessionStart…FileChanged)로 독립 재측정하여 확정.

### 4.2 핵심 항목별 분석

#### #1 (217) 중첩 서브에이전트 기본 비활성화 — **IMMUNE / 설계 검증(vindication)**

bkit은 CC의 nested-spawn 제약을 **v2.1.69부터 명시 문서화**하고 우회 설계했습니다 (메인 세션 직접 검증):

- `agents/cto-lead.md:65-71` — "As Standalone Subagent (via `@cto-lead`): Task() tools are blocked by
  CC's nested spawn restriction. Use `/pdca team {feature}` instead." / Teammate 경로는 "independent
  Claude Code session"에서 Task()가 **1-level subagents (NOT nested spawn)** 로 동작.
- `agents/pm-lead.md:44-51` — 동일 패턴 (`/pdca pm` = 독립 세션, `@pm-lead` = Task() blocked).

grep `Task\(` 결과 21개 agent이 Task()를 선언하나, 최심 체인
(`sprint-orchestrator → sprint-master-planner → pm-lead → pm-discovery`)도 **표준 중첩 spawn이 아니라
독립 세션 순차 dispatch**(`sprint-orchestrator.md:67-69` `await completion`)로 실행됩니다.

**결론**: (a) depth≥2 표준-중첩에 의존하는 에이전트 없음, (b) 217 새 기본값이 bkit를 차단하지 않음,
(c) `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` 설정/문서화 불요. 217은 bkit의 "CC v2.1.69+ Architecture
Note"를 **상류 기본값으로 확정** → 설계 검증 사례. **ENH 없음.**

#### #2 (217) 동시 서브에이전트 상한(기본 20) — **IMMUNE**

bkit 최대 동시성 근거: `lib/pdca/feature-manager.js:33` `MAX_CONCURRENT_DO = 1`,
`:30` `MAX_CONCURRENT_FEATURES = 3`, `lib/pdca/batch-orchestrator.js:36` `DEFAULT_MAX_CONCURRENT = 3`.
최대 3 ≪ 20 → 상한 초과 fan-out 불가. (212의 per-session 200 cap과는 별개 축인 concurrent cap.) **ENH 없음.**

#### #3 (216) 플러그인 스킬 `name:` 프리픽스 유실 수정 — **HIGH / MF-3·#125 상류 해소**

grep `^name:` in `skills/**/SKILL.md`: **44개 스킬 전원**이 `name:` frontmatter 보유. 즉 bkit 전 스킬이
프리픽스-유실 버그 영향권이었고 216이 네이티브 수정. 중요: bkit은 #125에 대해 **name 필드를 변조하는
워크어라운드를 구현한 적 없음**(어떤 `name:`도 `bkit:` 하드코딩 없음, `skill-create` 템플릿도 순수
`name: {name}`) → **제거할 코드 없이** 216이 autocomplete에 `bkit:` 프리픽스 복원.

**MF-3(`/code-review` 네임스페이스 미표기)의 근본 원인이 상류에서 해소** → MF-3 "CC-native-resolved"
재검증 후 CLOSE 권고. `skills/bkit/SKILL.md:55` / `hooks/startup/session-context.js:574`의 비수식
문서 표기는 기능상 유효(모호성은 CC 프리픽스 보존으로 처리). **ENH 없음.**

#### #4 (217) `paths` frontmatter brace-group OOM 수정 — **IMMUNE**

grep 결과 bkit skills의 frontmatter에 `paths:` brace-expansion **0건** → OOM 버그 완전 면역. **ENH 없음.**

#### #5 (216) `&&`/부정 내 리다이렉트 복합문 + 비ASCII/PowerShell 유니코드 권한검사 수정 — **IMMUNE / synergy**

bkit Layer-6 방어(차별점 #6 heredoc-bypass, #58904)는 `hooks/hooks.json`의 자체 PreToolUse(Bash) 훅으로
독립 실행하며 CC 파서에 의존하지 않음. CC 강화는 defense-in-depth 시너지. **차별점 #6 INTACT** — 216은
compound-redirect + Unicode를 봉인했으나 heredoc-pipe(#58904)는 여전히 미수정(closed as not_planned) →
CC-abandoned streak **+2 릴리스 연장**. **ENH 없음.**

#### #6 (216) `.claude` 심링크 write 차단 + `/rewind` 심링크 보호 — **IMMUNE / orthogonal**

bkit rollback/checkpoint은 CC `/rewind`·`.claude` workflow가 아닌 자체 `.bkit/checkpoints/` 사용
(`skills/rollback/SKILL.md:45,86-89`). 직교. **ENH 없음.**

#### LOW / passive

| CC 변경 | 판정 |
|---------|------|
| 216 AskUserQuestion continue/wait 수정 | passive UX win (bkit AskUserQuestion 다용) |
| 216 quadratic message normalization slowdown 수정 | passive — 장기 오케스트레이션 세션 가속 |
| 216 telemetry 권한거부 오보고 수정 | 차별점 #5 continueOnBlock 인접, passive 정합 |
| 217 OTEL managed endpoint signals | orthogonal — bkit 자체 파일 원장 |
| 217 emoji autocomplete / Windows auto-update / mTLS Desktop 등 | 무관, IMMUNE |

### 4.3 파일 영향 매트릭스

| 파일 | 변경 필요 | 사유 |
|------|----------|------|
| — | **0건** | 전 항목 IMMUNE 또는 상류-해소 |

무변경 확인 근거: `agents/cto-lead.md:62-71`, `agents/pm-lead.md:44-51`(nested 문서화),
`skills/**/SKILL.md`(name 보유·워크어라운드 부재), `lib/pdca/feature-manager.js:30,33`(동시성 ≤3),
`skills/rollback/SKILL.md`(`.bkit/checkpoints/` 자체 경로).

### 4.4 테스트 영향

신규/수정 TC **0건**. 기존 회귀 스위트 영향 없음.

### 4.5 철학 준수

신규 ENH 0건 → 3원칙(Automation First / No Guessing / Docs=Code) 위배 리스크 없음.

---

## 5. Phase 3: 브레인스토밍 & YAGNI

### 5.1 의도 탐색
- **최대 가치**: 없음. bkit이 활성화할 신규 native 표면 부재. 동시성·중첩 spawn 제어는 bkit 기존 모델과 일치.
- **놓치면 안 되는 변경**: 없음(0 breaking). 단 216 name-prefix 수정으로 **MF-3 상류 해소** = 추적 항목 정리 기회.
- **workaround 대체 기회**: 없음 — bkit은 #125 관련 name 변조 워크어라운드를 애초에 두지 않았음.

### 5.2 대안 탐색
후보 개선안 2건 검토, 전량 탈락:

1. **(탈락) Agent Teams 문서에 `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` 추가 안내**
   - 탈락 사유: bkit은 nested-spawn에 의존하지 않고 독립 세션(1-level)으로 라우팅. env-var 설정은
     bkit 동작에 불필요하며, 오히려 CC의 exponential-fanout 방어(#68110)를 해제하는 안티패턴.
2. **(탈락) 문서 `/code-review` → `/bkit:code-review` 네임스페이스 명시**
   - 탈락 사유: 216이 autocomplete 프리픽스를 네이티브 복원 → 모호성이 CC 계층에서 해소됨.
     문서 표기 변경은 저가치. MF-3을 CLOSE로 정리하는 것으로 충분(#125 트랙에서 관리).

### 5.3 YAGNI 검토 결과
- 통과 ENH: **0건** — 27사이클 HIGH-bar("현재 통증을 CC 변경이 해결" 요건) 미충족.
- **신규 ENH 발행 없음 → 28사이클 연속 0-ENH**. ENH-367 예약 유지(미소비).

### 5.4 우선순위 배정
| ID | 항목 | 우선순위 |
|----|------|---------|
| — | 없음 | — |

---

## 6. 모니터 상태 갱신

| 모니터 | 이전(#27) | 현재(#28) | 비고 |
|--------|----------|----------|------|
| **MF-2** (`lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION='2.1.198'`) | OPEN, 17-release stale | **OPEN, 19-release stale (CRITICAL)** | latest 대비 217−198=19 드리프트. **2.1.217 bump 권장**(maintainer 결정, 미구현) |
| **MF-3** (`/code-review` 네임스페이스 미표기) | OPEN(신규 LOW) | **RESOLVED (CC-native)** | 216 plugin name-prefix 수정으로 근본원인 상류 해소. CLOSE 검토 |
| 차별화 streak (#56293·#57317·**#58904 heredoc**) | intact | **intact (+2 릴리스 연장)** | 216 compound-redirect/Unicode 봉인 ≠ heredoc-pipe. #58904 여전히 not_planned·미수정 |
| BG-OTEL-DROP (#64436) | OPEN | **OPEN + 감시창 확대** | 217이 background-subagent 표면 확장(concurrent cap·bg-stop·budget)으로 work-phase OTEL log-drop 창 넓힘. bkit 자체 원장이라 직접 노출 없음 |
| PLUGIN-HOOK-DROP (#57317) | ACTIVE | ACTIVE 유지 | 216 plugin 수정은 autocomplete namespace(별개 표면), hook delivery 아님 |
| STOP-SCHEMA-STRICT (ENH-366) | RESOLVED | 유지 | 변동 없음 |

**버전 상수 현황(실측)**: `MIN='2.1.78'`, `RECOMMENDED='2.1.198'`(stale), `FABLE_MODEL_FLOOR='2.1.170'`

---

## 7. 누적 지표

| 지표 | 값 |
|------|-----|
| 누적 연속 호환 릴리스 | **160** (v2.1.34 ~ v2.1.217) |
| 신규 ENH 0건 연속 사이클 | **28** |
| 전역 마지막 ENH | ENH-366 (ENH-367 예약, 미소비) |
| CC-cycle 마지막 ENH | ENH-328 (미소비) |
| 권장 CC 버전 | **v2.1.217** 허용/권장 |

---

## 8. 품질 체크리스트

- [x] 범위 내 CC 변경 전량 포착 (60/60)
- [x] 모든 변경에 영향 등급 부여 (HIGH/MEDIUM/LOW)
- [x] ENH 우선순위 부여 (0건)
- [x] 철학 준수 검증 (해당 없음)
- [x] 파일 영향 매트릭스 완결 (0건)
- [x] 테스트 영향 평가 (0건)
- [x] 한국어 작성 (`.en.md` 형제 파일 병행)
- [x] Raw 검증 게이트 통과 (2 소스, errata 0)
- [x] §3 Verification 표 포함
- [x] MEMORY 갱신
