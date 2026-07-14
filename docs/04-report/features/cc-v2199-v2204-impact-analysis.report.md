# CC v2.1.198 → v2.1.204 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물여섯 번째 정식 적용)

> 분석 사이클 #22 · baseline CC v2.1.198 → 설치본 v2.1.204 (v2.1.199~v2.1.204, 6개 릴리스, 98 bullets)
> 분석일: 2026-07-08 · bkit plugin v2.1.29 · 분석 전용(analysis-only), ENH 미구현

---

## 1. Executive Summary

### 1.1 최종 판정

**호환성 판정: FULLY COMPATIBLE (breaking 0건) · 신규 ENH 0건 → 22-cycle 연속 0-ENH streak.**

v2.1.199~v2.1.204 범위 98개 bullet 전량을 raw CHANGELOG 바이트에서 직접 검증한 결과, bkit plugin 아키텍처(44 Skills / 34 Agents / 22 Hook Events / 195 Lib Modules)에 대한 **breaking change는 0건**이다. 동작 변경(behavior-change)에 해당하는 4개 항목(v200 Manual 기본 permission, v200 AskUserQuestion auto-continue 제거, v201 Sonnet 5 system-role reminder 제거, v199 hook exit-2 stderr 노출)은 모두 코드 측 직접 검증을 통해 bkit에 **neutral 또는 positive**로 확정했다.

### 1.2 성과 요약

- **누적 연속 호환**: 141 → **147** (+6, v2.1.34~v2.1.204, R-2 skip 제외)
- **신규 ENH streak**: **22-cycle 연속 0건**. 전역 마지막 ENH-366, ENH-367 예약 유지(미소비). CC-cycle 마지막 ENH-328.
- **native 개선의 passive 수혜**: bkit가 워크어라운드 없이 이득을 보는 CC 네이티브 개선 5건 식별 (skill 재호출 중복 제거, effortLevel fix 등)
- **신규 carry MF-2**: `cc-version-checker.js` `RECOMMENDED_VERSION` stale(2.1.198) → maintainer bump 권장 (분석 전용, 미구현)

### 1.3 4-Perspective 가치 평가

| 관점 | 이번 사이클 가치 | 근거 |
|------|-----------------|------|
| **사용자(User)** | ★★★☆☆ | v202 skill 재호출 중복 제거 → /pdca·/sprint 반복 호출 시 컨텍스트 부풀림 해소(실사용 이득). v199 hook stderr 노출 → bkit hook 오류 가시성 향상 |
| **개발자(maintainer)** | ★★☆☆☆ | 코드 변경 불필요(0 breaking). 유지보수 발견 1건(MF-2 RECOMMENDED_VERSION bump 권장) |
| **아키텍처(Architecture)** | ★★☆☆☆ | 22-cycle 무결. hook-matcher 컨벤션 면역·effort-aware(diff #4)·Sequential Dispatch(diff #3) 정합성 유지 |
| **비즈니스(Business)** | ★★☆☆☆ | v203 background-agent 대량 안정화 → 향후 Agent Teams/bg-agent 채택 시 de-risk(현재 gated·YAGNI) |

---

## 2. CC v2.1.198 → v2.1.204 변경사항 (98 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

메모리 교훈(model-WebFetch cross-section 복제 환각, v2.1.145·v2.1.196 재현)에 따라 `curl raw CHANGELOG` + 헤더 grep + 카테고리 prefix 카운트로 직행 확정. **raw-wins, model-WebFetch 생략.**

| 버전 | Total | Added | Fixed | Improved | Changed | Removed | 기타 | 판정 |
|------|-------|-------|-------|----------|---------|---------|------|------|
| v2.1.204 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | match |
| v2.1.203 | 37 | 3 | 26 | 2 | 2 | 2 | 2(VSCode 1) | match |
| v2.1.202 | 18 | 2 | 13 | 2 | 1 | 0 | 0 | match |
| v2.1.201 | 1 | 0 | 0 | 0 | 0 | 0 | 1 | match |
| v2.1.200 | 17 | 0 | 13 | 2 | 2 | 0 | 0 | match |
| v2.1.199 | 24 | 0 | 20 | 0 | 0 | 0 | 4 | match |
| **합계** | **98** | **5** | **73** | **6** | **5** | **4** | **7** | **all-match** |

- 출처: `https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md` (main 브랜치 authoritative)
- 카운트 방식: `^## 2\.1\.N` 헤더 행범위 내 `^- ` 접두 기계 카운트. 헤딩 없는 flat bullet 구조이므로 카테고리는 첫 단어(Added/Fixed/Improved/Changed/Removed) 기준 분류
- 스팟체크(≥3): v199 "Stacked slash-skill invocations…up to 5" / v200 "Changed the default permission mode to Manual" / v202 "Fixed re-invoking an already-loaded skill appending a duplicate copy" — 3건 모두 raw 원문 verbatim 일치

### 2.2 헤드라인 후보 (bkit relevance)

| # | 버전 | 변경 | bkit relevance | impact |
|---|------|------|----------------|--------|
| H1 | v199 | Stacked slash-skill `/skill-a /skill-b` 최대 5개 leading skill 로드 | 네임스페이스 스킬(/pdca /qa 등) | MEDIUM(feature) |
| H2 | v199 | SessionStart/Setup/SubagentStart hook exit code 2 시 stderr 노출 | bkit SessionStart hook | MEDIUM(debuggability) |
| H3 | v200 | default permission mode → "Manual" (`default`도 계속 허용) | bkit Trust L0-L4 / control panel | LOW(neutral) |
| H4 | v200 | AskUserQuestion auto-continue 기본 비활성(config로 opt-in) | bkit SessionStart AskUserQuestion 강제 | LOW(neutral) |
| H5 | v201 | Sonnet 5 세션 mid-conversation system-role harness reminder 미사용 | bkit hook additionalContext 주입 | LOW(unaffected) |
| H6 | v202 | 이미 로드된 skill 재호출 시 instruction 중복 append 수정 | bkit /pdca·/sprint 반복 호출 | MEDIUM(positive) |
| H7 | v202 | workflow `run_id`/`name` OTel 속성 추가 | bkit OTEL 모니터 계열 | LOW |
| H8 | v203 | background session effortLevel 변경 무시 수정 | bkit effort-aware(diff #4) | LOW(positive) |
| H9 | v203 | subagent 전체 재위임(re-delegate) 감소 개선 | bkit Sequential Dispatch(diff #3) | LOW(positive) |
| H10 | v203 | LSP-only plugin disuse 오탐 수정 | bkit는 plugin | LOW |

---

## 3. bkit 영향 분석

### 3.0 아키텍처 베이스라인 재측정 (Numeric Correction Protocol — 메인 세션 직접 측정)

| 항목 | 측정값 | 명령 |
|------|--------|------|
| Skills | **44** | `ls -1 skills/ \| wc -l` |
| Agents | **34** | `ls -1 agents/ \| wc -l` |
| plugin.json version | **2.1.29** | `grep '"version"' .claude-plugin/plugin.json` |

메모리(44/34)와 일치. 수치 정정 불필요.

### 3.1 H1·H6 — 스킬 시스템 변경 (feature + positive, 코드 변경 불필요)

- **H1 (stacked slash-skill, up to 5)**: bkit는 네임스페이스 스킬(`/pdca`, `/sprint`, `/qa-phase` 등)을 다수 보유. 이 기능은 `/skill-a /skill-b` 형태 다중 로드를 활성화하나, bkit 워크플로우는 오케스트레이터가 순차 dispatch하는 구조라 **자동 이득만 있고 요구 변경 없음**. YAGNI로 ENH 승격 보류.
- **H6 (skill 재호출 중복 제거)**: bkit는 `/pdca`를 phase마다 반복 호출하고 `/sprint` 액션을 반복 invoke하는 패턴이 잦다. 기존에는 재호출 시 instruction이 컨텍스트에 중복 append됐으나 v202에서 수정 → **bkit 세션 컨텍스트 절약이라는 실질 이득**. 코드 변경 불필요, positive.

### 3.2 H2 — hook exit-2 stderr 노출 (부정적 영향 0, 검증 완료)

```
grep -rnE "exit\(2\)|process\.exit\(2\)|exitCode\s*=\s*2" hooks/ lib/   → 0건
```

bkit hook 중 **code 2로 종료하는 hook은 없다**. 따라서 v199의 "exit 2 시 stderr 노출" 변경은 bkit에 부정적 회귀를 유발하지 않는다. 오히려 향후 bkit hook이 exit 2를 쓰게 될 경우 stderr가 transcript에 노출되어 디버깅성이 향상되는 **잠재적 positive**.

### 3.3 H3·H4 — permission/AskUserQuestion 동작 변경 (neutral, 검증 완료)

- **H3 (Manual 기본 permission)**: CLI 기본 permission mode가 "Manual"로 변경됐으나 `--permission-mode default` / `"defaultMode": "default"`는 계속 허용된다(changelog 명시). bkit의 L0-L4 Trust 추상화는 CC permission-mode 기본값에 결합되지 않은 독립 계층 → **neutral, monitor 불요**.
- **H4 (AskUserQuestion auto-continue 제거)**: `grep -rniE "auto.?continue|idle.?timeout" hooks/ lib/ skills/` → **0건**. bkit는 auto-continue/idle-timeout에 의존하지 않으며, SessionStart hook은 사용자의 명시적 응답을 요구하는 설계이므로 오히려 정합적 → **neutral(arguably positive)**.

### 3.4 H5·H7~H10 — 나머지 flag 독립 검증

| # | 판정 | 근거 |
|---|------|------|
| H5 | unaffected | bkit는 UserPromptSubmit additionalContext(user role) 주입 사용. 변경은 Sonnet 5 mid-conversation **system role** reminder 대상 → bkit 메커니즘 무관 |
| H7 | neutral | OTel workflow 속성 추가는 gain-only. bkit OTEL 모니터(BG-OTEL-DROP #64436)는 별개 이슈 |
| H8 | positive | effortLevel 무시 수정 → bkit effort-aware(diff #4) 신뢰성 향상. bg-session 한정이라 즉시 영향은 미미 |
| H9 | positive | subagent 재위임 감소 → bkit Sequential Dispatch(diff #3) 철학과 동일 방향 |
| H10 | neutral | LSP-only plugin disuse 오탐 수정. bkit는 LSP-only 아님 → 직접 영향 없음 |

---

## 4. ENH 기회 식별 (Phase 3 Plan Plus + YAGNI)

### 4.1 Intent Discovery
- **이 업그레이드에서 bkit의 최대 가치는?** → v202 skill 재호출 중복 제거로 인한 컨텍스트 절약(자동 수혜). 별도 구현 불필요.
- **놓치면 안 되는 critical change는?** → 없음. 0 breaking.
- **기존 workaround를 대체할 native 기능은?** → 없음(bkit는 skill 중복 관련 workaround를 두지 않았으므로 대체 대상 없음).

### 4.2 후보 평가 (YAGNI)

| 후보 | YAGNI 판정 | 결정 |
|------|-----------|------|
| H1 stacked-skill 활용한 다중 스킬 체이닝 | 현재 오케스트레이터 순차 dispatch로 충분, 실수요 없음 | ❌ 보류(P3) |
| H4 대응 AskUserQuestion idle-timeout opt-in | bkit는 명시적 응답 요구 설계, 불필요 | ❌ 제거 |
| H8 effort-aware를 bg-session까지 확장 | Agent Teams gated·bg-agent 미채택 | ❌ YAGNI 보류 |

→ **신규 ENH 0건. 22-cycle 연속 0-ENH 확정.**

### 4.3 유지보수 발견 — MF-2 (신규 carry)

| 항목 | 현재 | 권장 | 상태 |
|------|------|------|------|
| `lib/infra/cc-version-checker.js` `RECOMMENDED_VERSION` | `'2.1.198'` | `'2.1.204'` | **MF-2 OPEN** (maintainer bump 권장) |
| `MIN_VERSION` | `'2.1.78'` | 유지 | OK |
| `FABLE_MODEL_FLOOR` | `'2.1.170'` | 유지 | OK |

> ⚠️ 분석 전용 원칙(HARD-GATE) 및 CLAUDE.md 버전 정책에 따라 **본 사이클에서는 미구현**. maintainer가 릴리스 시점에 RECOMMENDED_VERSION을 2.1.204로 bump할 것을 권장(설치본=latest=2.1.204). 구 MF-1(2.1.118→2.1.198)은 사이클 #21에서 CLOSED된 바 있어, 동일 성격의 신규 carry.

---

## 5. 차별화 streak 갱신

3대 CC-abandoned 이슈(`not_planned`)를 참조하는 code-fix bullet이 v199~v204 98개 중 **관측되지 않음** → 3대 streak 전부 intact(break 없음). "닫힘 ≠ 고침" 원칙상 code-fix bullet 부재 = streak 유지.

| 이슈 | 성격 | streak 상태 |
|------|------|-------------|
| #56293 | (차별화 #1 계열) | intact — code-fix bullet 미관측 |
| #57317 | PLUGIN-HOOK-DROP | intact — code-fix bullet 미관측 |
| #58904 | (차별화 계열) | intact — code-fix bullet 미관측 |

---

## 6. Release Drift + R-Series

- **dist-tags**: 설치본 = latest = **2.1.204**로 수렴. baseline 대비 6개 릴리스 연속(199~204) drift 없이 흡수.
- **R-Series**: 이번 범위 내 R-2 skip 해당 릴리스 없음. 6개 전량 정상 카운트.

---

## 7. Monitor 상태

| Monitor | 상태 | 이번 사이클 변화 |
|---------|------|------------------|
| NOTIFY-BGAGENT (#v198 Notification hook 확장, P3) | ACTIVE(YAGNI 보류) | v199~204 관련 변경 없음 → 유지. Agent Teams 실험 gated·bg-agent 미채택으로 matcher 확장 계속 보류 |
| BG-OTEL-DROP (#64436) | ACTIVE | v202 OTel workflow 속성 추가는 별개 → 유지 |
| PLUGIN-HOOK-DROP (#57317) | ACTIVE | 변화 없음 |
| CHOICE-LOOP (#64447) | ACTIVE | 변화 없음 |
| STOP-SCHEMA-STRICT (ENH-366) | RESOLVED | 변화 없음 |
| **MF-2 RECOMMENDED_VERSION stale** | **신규 OPEN** | 2.1.198 → 2.1.204 bump 권장(maintainer, 미구현) |
| MF-1 (구 RECOMMENDED_VERSION carry) | CLOSED | 사이클 #21에서 종료 유지 |
| hook-matcher 컨벤션 면역 | 유효 | no-comma + no-hyphen + pipe/underscore → matcher-syntax 회귀 계속 면역 |

**신규 관찰(monitor 불요, 정보성)**: v200 permission Manual 기본화 — bkit L0-L4가 독립 계층이므로 결합 없음. 향후 CC가 `default` alias를 제거할 경우에만 재평가.

---

## 8. 최종 평결 및 권장 조치

**평결: bkit v2.1.29는 CC v2.1.204에서 FULLY COMPATIBLE. 코드 변경 0건, 신규 ENH 0건(22-cycle streak). 권장 CC = latest v2.1.204 허용/권장.**

### 8.1 메모리 갱신 사항 (cc-version-analysis-state)
- 마지막 분석 baseline: v2.1.198 → **v2.1.204** (다음 분석은 v2.1.205부터). 설치 CC=2.1.204.
- 신규 ENH streak: 21 → **22-cycle 연속 0건**. ENH-367 예약 유지.
- 누적 연속 호환: 141 → **147** (+6).
- 권장 CC: latest **v2.1.204** 허용/권장.
- 신규 carry **MF-2 OPEN**: `cc-version-checker.js` RECOMMENDED_VERSION 2.1.198 → 2.1.204 bump 권장(미구현).
- NOTIFY-BGAGENT P3 ACTIVE 유지, 3대 차별화 streak intact.

---

## 9. Quality Checklist

- [x] 범위 내 전체 CC 변경 캡처 (98 bullets)
- [x] 모든 변경 impact 분류 (HIGH/MEDIUM/LOW)
- [x] 모든 후보 ENH 우선순위 부여 (전부 YAGNI 보류/제거 → 0건)
- [x] 철학 준수 검증 (Automation First / No Guessing / Docs=Code)
- [x] 파일 영향 매트릭스 (§3)
- [x] Test impact — 코드 변경 0건이므로 TC 영향 없음
- [x] 한국어 보고서
- [x] Executive Summary 4-Perspective 가치 표 포함
- [x] **Raw GitHub CHANGELOG fetch** (raw.githubusercontent.com)
- [x] **Bullet count cross-verified** (raw 직행, 98건, all-match)
- [x] **≥3 스팟체크** verbatim 확인
- [x] **§2.1 Verification table** 포함 (6-row per-version + 합계)
- [x] Errata 없음 (raw 직행으로 model-WebFetch 환각 원천 차단)
- [x] MEMORY.md 갱신 예정 (§8.1)
