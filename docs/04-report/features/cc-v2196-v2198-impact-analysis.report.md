# CC v2.1.196 → v2.1.198 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물다섯 번째 정식 적용)

> 분석 범위: CC v2.1.197 ~ v2.1.198 (baseline v2.1.196 제외)
> 사이클 #21 · 2026-07-03 · 분석 전용 (구현 금지)
> 설치 CC: v2.1.198 (npm next/latest) · 이전 baseline: v2.1.196

---

## 1. Executive Summary

### 1.1 최종 판정

- **신규 ENH: 0건.** → **21-cycle 연속 0-ENH** streak 갱신. ENH-367 예약 유지(미소비).
- **누적 연속 호환: 139 → 141** (v2.1.197·v2.1.198 모두 호환, R-2 skip 없음).
- **판정: neutral/auto.** 이번 범위 최대 변경(Sonnet 5 **기본 모델화**, v2.1.197)은 bkit v2.1.25 model-alignment에서 **선제 대응 완료** 상태 — 추가 작업 불요.
- **carry item 해소: MF-1 CLOSED.** `lib/infra/cc-version-checker.js` `RECOMMENDED_VERSION`이 이미 `'2.1.198'`로 bump 완료(메모리상 stale `2.1.118` 기록은 만료됨). 6-cycle carry 종료.
- **신규 모니터 1건 (P3):** Notification hook 확장(`agent_needs_input`/`agent_completed`) — bkit matcher 미포함. YAGNI 상 즉시 구현 불요, 모니터 등재.

### 1.2 성과 요약

| 지표 | 이전(#20) | 현재(#21) | 비고 |
|------|-----------|-----------|------|
| 분석 bullet | 54 | **33** (v197:1 + v198:32) | raw gh authoritative |
| 신규 ENH | 0 | **0** | streak 20 → **21** |
| 누적 연속 호환 | 139 | **141** | +2 |
| carry item | MF-1 (6-cycle) | **0** (MF-1 해소) | RECOMMENDED bump 확인 |
| Breaking | 0 | 0 (Removed 1: `/agents` wizard, bkit 무영향) | — |

### 1.3 4-Perspective 가치 평가

| 관점 | 이번 범위 가치 | 근거 |
|------|----------------|------|
| **사용자** | 中(+) | Sonnet 5 기본화로 bkit 워크플로우 품질/1M context 향상 (bkit 이미 alias 정렬) |
| **개발자** | 低 | 코드 변경 불요. 유일 후속은 문서/모니터 업데이트 |
| **아키텍처** | 中 | Explore 모델 상속·subagent 방향성 명확화가 bkit Sequential Dispatch(#3)/Memory Enforcer(#1) 철학과 정합 |
| **운영** | 中(+) | agent-teams 사멸 teammate `failed` 보고 fix가 Agent Teams 신뢰성 강화 |

---

## 2. CC v2.1.196 → v2.1.198 변경사항 (33 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

메모리 교훈에 따라 `curl raw CHANGELOG.md` + 헤더 grep + `sed` 행범위로 직접 확정 (model-WebFetch cross-section 환각 회피).

| 버전 | Raw 확정 | 헤딩 분해 | Source |
|------|----------|-----------|--------|
| v2.1.197 | **1** | 단일(Sonnet 5 기본화) | CHANGELOG L38–41 |
| v2.1.198 | **32** | Added/behavior 7 · Fixed 18 · Improved/behavior/Removed 7 | CHANGELOG L3–37 |
| **Total** | **33** | — | sum |
| Breaking | **0** | (Removed 1 = `/agents` wizard, non-breaking) | — |

**Verdict: match.** agent 위임 없이 raw 직행 확정 → 환각 리스크 0. 스팟체크 3종 verbatim 확인:
- v198 "Fixed brief network drops mid-response aborting the turn — … ECONNRESET now retry with backoff" ✓
- v198 "The built-in Explore agent now inherits the main session's model (capped at opus) instead of running on haiku" ✓
- v198 "Removed the `/agents` wizard; ask Claude to create or manage subagents, or edit `.claude/agents/` directly" ✓

### 2.2 헤드라인 후보 (bkit relevance)

| # | 변경 (ver) | 성격 | bkit relevance |
|---|-----------|------|----------------|
| H1 | **Claude Sonnet 5 기본 모델화** (v197) — 1M context, `sonnet` alias가 CC≥2.1.197에서 Sonnet 5로 해소 | Feature | **HIGH** (model pin/floor) |
| H2 | **Notification hook 확장** (v198) — background agent가 `agent_needs_input`/`agent_completed` 발화 | Hook | **MEDIUM** |
| H3 | **Explore agent 모델 상속** (v198) — haiku → 세션 모델(opus cap) | Behavior | **MEDIUM** |
| H4 | **`/agents` wizard 제거** (v198) — subagent는 대화/`.claude/agents/` 직접 편집으로 | Removed | **LOW** |
| H5 | **agent teams 신뢰성 fix** (v198) — 사멸 teammate `failed` 보고 + stuck teammate 재기동 | Fix | **LOW(+)** |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 재측정 (Numeric Correction Protocol — 메인 세션 직접 측정)

| 항목 | 측정값 | 명령 |
|------|--------|------|
| Skills | **44** | `ls -1 skills/` |
| Agents | **34** | `ls -1 agents/*.md` |
| Hook events | **22** | `hooks.json` top-level keys |
| lib modules | **194** | `find lib -name '*.js'` |

session context(44/34/22/194)와 **완전 일치** — 수정 불요.

### 3.1 H1 심층 검증 — Sonnet 5 기본화는 이미 선제 대응 완료 (neutral/auto)

가장 큰 변경이지만 bkit v2.1.25 model-alignment에서 **선반영**됨. 저장소 직접 확인:

- `lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION = '2.1.198'` — 이미 v198 권장. (`MIN_VERSION='2.1.78'`, `FABLE_MODEL_FLOOR='2.1.170'` 유지)
- `README.md:185` "Recommended … **v2.1.198** (Claude 5 alias resolution — `sonnet` → Sonnet 5 needs ≥ v2.1.197)" 명시.
- `CHANGELOG.md` provider alias table: "Anthropic API (CC ≥ 2.1.197) → Sonnet 5", dual-floor 정책 기록.
- `evals/config.json:5` `benchmarkModel: "claude-sonnet-5"`.

→ **추가 ENH 불요.** CC v197이 문서상 전제(≥2.1.197)를 사후 충족 → bkit 권장/floor 정합성 그대로 성립.

### 3.2 H2 — Notification hook 확장 (유일 실질 기회, P3)

- 현재: `hooks/hooks.json:247` Notification matcher = `"permission_prompt|idle_prompt"` → `scripts/notification-handler.js`.
- CC v198 신규 사유 `agent_needs_input`/`agent_completed`는 **현재 matcher 미포함** → background agent 알림에 bkit 핸들러 미발화.
- 별개로 `lib/audit/audit-logger.js:43`은 bkit 자체 audit taxonomy로 `agent_completed`를 이미 보유(이름만 동일, CC hook payload와 무관).
- **YAGNI 판정: 기회지만 즉시 구현 불요** — ① Agent Teams는 실험 플래그(`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`) gated 상태(preflight 상 inactive), ② `--bg` background agent가 bkit 문서화 워크플로우에 미채택. → **모니터 등재(P3)**, ENH-367 미소비.

### 3.3 나머지 bkit-relevant 플래그 독립 검증

| CC 변경 (ver) | bkit 접점 | 측정 결과 | 판정 |
|---------------|-----------|-----------|------|
| Explore 모델 상속 (v198) | 20 agents `Task(Explore)` 사용 | 검색 품질↑, 비용↑(구 haiku) | **neutral** — CC-managed. effort-aware(#4) 비용 관찰 항목 |
| `/agents` wizard 제거 (v198) | wizard 실행 지시 skill/doc **0건** | `test/README.md:114` E2E-006 "/agents list" 문서 참조만 존재(wizard 아님) | **neutral** — 코드 무영향. E2E-006 라벨 stale 여부만 경미 |
| `.claude/rules` symlink fix (v198) | bkit는 `.claude/rules/` **미배포** (ADR 2건 언급뿐) | 실경로 없음 | **neutral** |
| agent teams `failed` 보고 fix (v198) | Sequential Dispatch(#3), cto/pm/qa-lead | 신뢰성↑ | **neutral(+)** — 차별화 보강 |
| subagent 메시지=task direction, 승인 아님 (v198) | Memory Enforcer(#1) 승인 모델 | 계약 명확화 | **neutral(+)** — never-auto-approve 정합 |
| Claude in Chrome GA (v198) | qa-lead 브라우저 도구 | GA 안정화 | **neutral(+)** |
| `/dataviz` skill 추가 (v198) | bkit 44 skills 카탈로그 | 네임스페이스 충돌 없음(CC 내장) | **neutral** |
| 잔여 UI/network/diff fix 다수 (v198) | 없음 | — | **neutral** |

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

### 4.1 Intent Discovery
- 이 업그레이드 최대 가치? → Sonnet 5 기본화의 **품질/1M context 이득** (bkit 이미 정렬 완료, 수취만).
- 놓치면 안 되는 critical change? → 없음. Breaking 0, model 전제는 사전 충족.
- native가 workaround 대체? → Notification hook 확장이 잠재 관측성 native화이나 현 미사용.

### 4.2 후보 평가 (YAGNI)

| 후보 | 필요성 | 미구현 시 문제 | 차기 CC 개선 가능성 | 판정 |
|------|--------|----------------|---------------------|------|
| Notification matcher에 `agent_needs_input\|agent_completed` 추가 | 낮음(실험 gated 미사용) | 없음(현 워크플로우 무영향) | 높음(payload 스키마 미고정 가능) | **P3 모니터, 구현 보류** |

→ **채택 ENH: 0건.** streak 21 유지, ENH-367 예약 존속.

### 4.3 유지보수 발견 — MF-1 carry 해소 확인

- 이전 6-cycle carry "MF-1: `cc-version-checker.js` `RECOMMENDED_VERSION` stale(2.1.118)"는 **해소 완료**. 현재 값 `'2.1.198'` 직접 확인. → carry 목록에서 제거.

---

## 5. 차별화 streak 갱신

3대 이슈 전부 CC-abandoned(`not_planned`) 유지 — code-fix bullet 부재로 streak 연장:

| 이슈 | 이전 | 현재 | 근거 |
|------|------|------|------|
| #56293 | 25 | **26** | v197~v198 code-fix bullet 없음 |
| #57317 (PLUGIN-HOOK-DROP) | 19 | **20** | 동일 |
| #58904 | 15 | **16** | 동일 |

hook-matcher 컨벤션 면역(no-comma·no-hyphen·pipe/underscore) 유지 — 이번 범위 matcher-syntax 회귀 없음.

---

## 6. Release Drift + R-Series

- dist-tags: stable=2.1.187 / latest=2.1.198 / next=2.1.198. **drift 개선** (이전 +11 CRITICAL → stable-latest gap 축소, latest=next 수렴).
- R-2 skip: 이번 범위 0건. 누적 연속 호환 139 → **141**.

---

## 7. Monitor 상태

| 모니터 | 상태 | 비고 |
|--------|------|------|
| BG-OTEL-DROP (#64436) | ACTIVE | 변화 없음 |
| PLUGIN-HOOK-DROP (#57317) | ACTIVE | streak 20 |
| CHOICE-LOOP (#64447) | ACTIVE | 변화 없음 |
| STOP-SCHEMA-STRICT (ENH-366) | RESOLVED | 유지 |
| **NOTIFY-BGAGENT (신규)** | **ACTIVE(P3)** | v198 Notification 확장, matcher 미포함, 구현 보류 |
| MF-1 (RECOMMENDED stale) | **CLOSED** | RECOMMENDED='2.1.198' 확인 |

---

## 8. 최종 평결 및 권장 조치

**neutral/auto — 코드 변경 불요, streak 21 갱신.** Sonnet 5 기본화는 선제 대응 완료, MF-1 carry 해소, 신규 관측성 기회 1건은 YAGNI 보류.

### 8.1 메모리 갱신 사항
- baseline: v2.1.196 → **v2.1.198** (다음 분석 v2.1.199부터)
- ENH streak: 20 → **21** cycle 0-ENH (ENH-367 예약 존속)
- 누적 연속 호환: 139 → **141**
- carry: MF-1 **CLOSED** (RECOMMENDED='2.1.198')
- 신규 모니터: **NOTIFY-BGAGENT** (P3, Notification 확장)
- 차별화 streak: #56293=26, #57317=20, #58904=16
- 권장 CC: latest **v2.1.198** 허용/권장 (Sonnet 5 alias 해소)

---

## 9. Quality Checklist

- [x] 범위 전 변경 포착 (33 bullets)
- [x] 변경별 HIGH/MEDIUM/LOW 분류
- [x] Phase 1.5 raw gate (curl raw CHANGELOG 행 단위, match)
- [x] 스팟체크 ≥3 verbatim
- [x] 아키텍처 직접 재측정 (44/34/22/194, session 일치)
- [x] 철학 정합성 (Memory Enforcer·Sequential Dispatch·effort-aware)
- [x] ENH 우선순위 (0 채택, 1 P3 보류)
- [x] MF-1 carry 해소 확인
- [x] 한국어 작성
- [x] 메모리 갱신 사항 명시
