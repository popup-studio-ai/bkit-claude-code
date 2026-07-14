# CC v2.1.204 → v2.1.207 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물일곱 번째 정식 적용)

> 분석 사이클 #23 · baseline CC v2.1.204 → 설치본 v2.1.207 (v2.1.205~v2.1.207, 3개 릴리스, 74 bullets)
> 분석일: 2026-07-13 · bkit plugin v2.1.29 · 분석 전용(analysis-only), ENH 미구현

---

## 1. Executive Summary

### 1.1 최종 판정

**호환성 판정: FULLY COMPATIBLE (breaking 0건) · 신규 ENH 0건 → 23-cycle 연속 0-ENH streak.**

v2.1.205~v2.1.207 범위 74개 bullet 전량을 raw CHANGELOG 바이트에서 직접 검증한 결과, bkit plugin 아키텍처(44 Skills / 34 Agents / 22 Hook Events / 195 Lib Modules)에 대한 **breaking change는 0건**이다. 이번 사이클의 유일한 잠재 리스크였던 **플러그인 계층 2건**(v207 `${user_config.*}` shell-form 거부, v207 pluginConfigs project-settings 미로드)은 코드 측 직접 grep 검증으로 bkit **완전 면역**을 확정했다 — bkit hook 21개는 전부 `${CLAUDE_PLUGIN_ROOT}`만 사용하고 configurable plugin option을 일절 쓰지 않기 때문이다.

### 1.2 성과 요약

- **누적 연속 호환**: 147 → **150** (+3, v2.1.34~v2.1.207, R-2 skip 제외)
- **신규 ENH streak**: **23-cycle 연속 0건**. 전역 마지막 ENH-366, ENH-367 예약 유지(미소비). CC-cycle 마지막 ENH-328.
- **native 개선의 passive 수혜**: bkit가 워크어라운드 없이 이득을 보는 CC 네이티브 개선 6건 식별 (bg-task notification 정직성, prompt-injection 오탐 감소, 스트리밍 프리즈 fix 등)
- **모니터 1건 RESOLVED**: v205 bg-task notification 정직성 fix → **NOTIFY-BGAGENT (P3) 해소**
- **carry MF-2 지속**: `cc-version-checker.js` `RECOMMENDED_VERSION` stale(2.1.198) → 이제 9개 릴리스 뒤처짐, maintainer bump 2.1.207 권장 (분석 전용, 미구현)

### 1.3 4-Perspective 가치 평가

| 관점 | 이번 사이클 가치 | 근거 |
|------|-----------------|------|
| **사용자(User)** | ★★★☆☆ | v207 스트리밍 프리즈 fix → bkit 대시보드(progress-bar·workflow-map·impact-view) 렌더 개선. v207 prompt-injection 오탐 감소 → bkit의 10+ context-injection hook 경고 노이즈 축소 |
| **개발자(maintainer)** | ★★☆☆☆ | 코드 변경 불필요(0 breaking). 유지보수 발견 1건(MF-2 RECOMMENDED_VERSION bump, 이제 9-release stale) |
| **아키텍처(Architecture)** | ★★★☆☆ | 23-cycle 무결. 플러그인 shell-injection 하드닝(v207)에 대해 `${CLAUDE_PLUGIN_ROOT}`-only 컨벤션이 사전 면역 입증. hook-matcher 컨벤션 면역·effort-aware(diff #4)·Sequential Dispatch(diff #3) 정합성 유지 |
| **비즈니스(Business)** | ★★☆☆☆ | v205~207 background-agent/Remote-Control 대량 안정화 → 향후 Agent Teams/bg-agent 채택 시 de-risk 지속(현재 gated·YAGNI) |

---

## 2. CC v2.1.204 → v2.1.207 변경사항 (74 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

메모리 교훈(model-WebFetch cross-section 복제 환각, v2.1.145·v2.1.196 재현)에 따라 `curl raw CHANGELOG` + 헤더 grep + 카테고리 prefix 카운트로 직행 확정. **raw-wins, model-WebFetch 생략.**

| 버전 | Total | Added/Feature | Fixed | Improved | Changed | 판정 |
|------|-------|---------------|-------|----------|---------|------|
| v2.1.207 | 24 | 3 (auto-mode 확대 + plugin hardening ×2) | 17 | 2 | 2 | raw verified |
| v2.1.206 | 27 | 6 (Added ×2 + feature ×4) | 18 | 2 | 1 | raw verified |
| v2.1.205 | 23 | 5 (Added ×1 + feature ×4) | 15 | 3 | 0 | raw verified |
| **합계** | **74** | **14** | **50** | **7** | **3** | **raw-wins** |

- 출처: `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` (432,284 bytes, 헤더 라인 v207=L3, v206=L30, v205=L60, v204=L86)
- 행 범위: v207 = L3–29, v206 = L30–59, v205 = L60–85 (baseline v204는 L86, 범위 제외)
- 성격: **74 bullet 중 50건(68%)이 Fixed** — 압도적 버그픽스 사이클. 신규 surface는 auto-mode 프로바이더 확대·`/cd` 경로 제안·`/doctor` 확장 등 minor.

### 2.2 bkit 관련 HIGH 항목 (2건, 전부 코드검증 면역)

| # | 버전 | 변경 | bkit 영향 | 검증 |
|---|------|------|-----------|------|
| H1 | v207 | Plugin hooks/monitors/MCP headersHelper: `${user_config.*}` shell-form 명령 **거부**(shell-injection fix). exec form(`args`) 또는 `$CLAUDE_PLUGIN_OPTION_<KEY>` 사용 요구 | **NEUTRAL (면역)** | `grep user_config` = 0건. bkit hook 21개 전부 `command: node "${CLAUDE_PLUGIN_ROOT}/..."` 형태로 `${CLAUDE_PLUGIN_ROOT}`만 보간(항상 허용) |
| H2 | v207 | Plugin option 값(`pluginConfigs`)이 project-level `.claude/settings.json`에서 **미로드**. user/`--settings`/managed만 인정 | **NEUTRAL (면역)** | `grep pluginConfigs` = 0건, `grep CLAUDE_PLUGIN_OPTION` = 0건. bkit는 configurable plugin option 자체를 미정의 |

> **아키텍처 시사점**: bkit의 `${CLAUDE_PLUGIN_ROOT}`-only + no-plugin-option 설계가 CC의 플러그인 shell-injection 하드닝을 **사전 면역**했다. hook-matcher 컨벤션 면역(no-comma/no-hyphen/pipe)과 같은 계열의 "설계 단순성이 회귀를 흡수" 패턴.

### 2.3 bkit passive 수혜 (native 개선, 워크어라운드 불필요) — 6건

| # | 버전 | 변경 | bkit 수혜 |
|---|------|------|-----------|
| N1 | v205 | Background task notification이 "no human input occurred"를 명시 → fabricated in-transcript approval 차단 | **NOTIFY-BGAGENT 모니터(P3) 근본 해소.** bkit subagent/team handler 경로에서 위조 승인 리스크가 CC 네이티브로 제거 |
| N2 | v207 | 양성 system-generated 대화 업데이트로 인한 **spurious prompt-injection 경고 fix** | bkit의 context-injection hook 10+개(session-start·user-prompt-expansion·pdca-task-completed·subagent-stop 등)가 유발하던 오탐 경고 노이즈 축소 |
| N3 | v207 | 긴 리스트/테이블/코드블록 스트리밍 시 **터미널 프리즈·키입력 지연 fix** | bkit 고정폭 대시보드(progress-bar·workflow-map·impact-view·agent-panel·control-panel) 렌더 안정화 |
| N4 | v207 | `cd` 복합명령이 출력을 `/dev/null`로만 리다이렉트할 때 permission 프롬프트 fix | bkit bash hook(unified-bash-pre/post)이 유발할 수 있던 잉여 프롬프트 감소 |
| N5 | v205 | project verify skill이 매 세션 rewrite되던 것 → 문서화 명령 변경 시에만 rewrite | `/verify` skill churn 제거 (bkit 저장소 verify skill 채택 시 이득) |
| N6 | v206 | MCP 서버의 per-server `request_timeout_ms`가 존중됨(기존 60s 강제 무시 버그 fix) | bkit 2개 MCP 서버(bkit-pdca 15 tools / bkit-analysis 6 tools)는 timeout 미설정 → 기본 60s 유지, 읽기 위주라 무영향(**neutral**) |

### 2.4 behavior-change 검증 (전부 neutral)

| 항목 | 변경 | bkit 판정 | 근거 |
|------|------|-----------|------|
| v207 model default | Bedrock/Vertex/Claude Platform on AWS가 **Opus 4.8 기본**으로 전환 | **NEUTRAL** | 프로바이더 레벨 default. bkit 에이전트는 frontmatter에 명시적 모델 pin → 무영향. `FABLE_MODEL_FLOOR='2.1.170'` 유지 |
| v207 auto-mode 확대 | Bedrock/Vertex/Foundry에서 `CLAUDE_CODE_ENABLE_AUTO_MODE` opt-in 없이 auto mode 가용 | **NEUTRAL** | bkit는 CC auto-mode에 의존 안 함(자체 L0–L4 automation). `disableAutoMode` 세팅으로 회피 가능 |
| v207 autoMode 소스 | auto mode가 `.claude/settings.local.json`의 `autoMode`를 더 이상 안 읽음 | **NEUTRAL** | bkit는 `autoMode` 키 미사용(grep 0건) |
| v205 json-schema strict | `--json-schema` invalid 시 무구조 출력 방지, `format` 키워드 거부 | **NEUTRAL** | bkit `--json-schema`/`"format":` 사용 0건. STOP-SCHEMA-STRICT(ENH-366)는 이미 RESOLVED, 회귀 없음 |

---

## 3. bkit 영향 매트릭스

| 컴포넌트 | 규모 | breaking | ENH | 상태 |
|----------|------|----------|-----|------|
| Skills | 44 | 0 | 0 | ✅ 무영향 |
| Agents | 34 | 0 | 0 | ✅ 무영향 (모델 pin 유지) |
| Hook Events | 22 (25 blocks) | 0 | 0 | ✅ 무영향 (`${CLAUDE_PLUGIN_ROOT}`-only 면역) |
| Lib Modules | 195 | 0 | 0 | ✅ 무영향 |
| MCP Servers | 2 (21 tools) | 0 | 0 | ✅ 무영향 (timeout 기본 60s, N6 neutral) |
| Scripts | 50 | 0 | 0 | ✅ 무영향 |

**철학 준수(Philosophy Compliance)**: Automation First / No Guessing / Docs=Code 3원칙 대비 이번 CC 변경으로 위반·기회 발생 0건. 모든 판정은 raw-byte 또는 직접 grep 근거(No Guessing 준수).

---

## 4. Phase 3 브레인스토밍 (Plan Plus) — ENH 도출

### 4.1 Intent Discovery
- **최대 가치 후보**: N1(NOTIFY-BGAGENT 네이티브 해소) → 별도 구현 없이 모니터 종료. bkit 코드 액션 불필요.
- **놓치면 안 되는 critical**: H1/H2 플러그인 하드닝 — 검증 결과 **면역**이므로 액션 불필요.
- **native가 대체하는 워크어라운드**: NOTIFY-BGAGENT 모니터가 추적하던 리스크를 CC가 흡수 → 모니터 자체를 RESOLVED 처리(코드 아님, 상태 정리).

### 4.2 YAGNI Review
- 도출 가능한 ENH 후보 전부가 (a) bkit 무영향 또는 (b) CC 네이티브 흡수 → **신규 ENH 0건**. ENH-367 예약 유지(미소비).

### 4.3 우선순위
- **P0~P3 신규 항목 없음.** 유일한 액션은 maintainer 영역 carry(MF-2)로, agent 구현 대상 아님.

---

## 5. Carry / Monitor 상태 (사이클 #23 종료 시점)

| ID | 유형 | 상태 | 비고 |
|----|------|------|------|
| **NOTIFY-BGAGENT** | Monitor (P3) | **RESOLVED** | v205 bg-task notification 정직성 fix로 네이티브 해소 |
| **MF-2** | Maintenance (maintainer) | **OPEN** | `cc-version-checker.js:42` `RECOMMENDED_VERSION='2.1.198'` → 2.1.207 bump 권장 (9-release stale). `MIN='2.1.78'`, `FABLE_MODEL_FLOOR='2.1.170'` 유지 |
| **BG-OTEL-DROP** (#64436) | Monitor | **ACTIVE** | v206 "disused plugin/LSP telemetry" fix는 별건 — OTEL background-agent metrics drop에 대한 code-fix bullet 미관측 |
| **PLUGIN-HOOK-DROP** (#57317) | Monitor | **ACTIVE** | v207 플러그인 변경은 신규 하드닝(shell-injection)이지 hook-drop fix 아님. 차별화 유지 |
| **CHOICE-LOOP** (#64447) | Monitor | **ACTIVE** | 관련 bullet 미관측 |

**차별화 streak**: 3대 abandoned 이슈(#56293·#57317·#58904) 전부 intact — v205~207에서 code-fix bullet 미관측(raw grep 0건). "닫힘 ≠ 고침" 원칙상 streak break는 code-fix bullet에만 의존.

---

## 6. Quality Checklist

- [x] 범위 전체 bullet 포착 (74건, raw-byte)
- [x] 모든 변경 영향 분류 (HIGH 2 / passive 6 / behavior 4 / 잔여 fix neutral)
- [x] ENH 우선순위 (신규 0건)
- [x] 철학 준수 검증 (3원칙 위반 0)
- [x] 파일 영향 매트릭스 (§3)
- [x] 테스트 영향 (신규 TC gap 0 — 무영향)
- [x] 한국어 작성
- [x] Executive Summary 4-perspective 표
- [x] **Raw GitHub CHANGELOG fetch** (raw.githubusercontent.com, 432KB)
- [x] **Bullet count cross-verified** (헤더 grep + 행범위 sed, model-WebFetch 우회)
- [x] **HIGH 항목 직접 코드 grep 검증** (user_config/pluginConfigs = 0건)
- [x] **아키텍처 재측정** (Skills 44 / Agents 34 = 메모리 일치, 수정 불필요)
- [x] §2.1 Verification table 포함

---

## 7. 결론

CC v2.1.205~v2.1.207은 **68% 버그픽스 중심 사이클**로, bkit plugin v2.1.29에 **breaking 0 / ENH 0**. 이번 사이클의 유일한 잠재 리스크(플러그인 shell-injection 하드닝, pluginConfigs 소스 제한)는 bkit의 `${CLAUDE_PLUGIN_ROOT}`-only·no-option 설계로 **사전 면역**이 입증되었다. NOTIFY-BGAGENT 모니터는 CC 네이티브 fix(v205)로 해소되었고, 유일한 후속은 maintainer 영역의 `RECOMMENDED_VERSION` bump(MF-2, 2.1.198→2.1.207)이다.

- **누적 연속 호환 150** (v2.1.34~v2.1.207)
- **23-cycle 연속 0-ENH streak**
- **권장 CC: v2.1.207 (latest)**
