# CC v2.1.207 → v2.1.210 영향 분석 및 bkit 대응 보고서 (ADR 0003 스물여덟 번째 정식 적용)

> 작성일: 2026-07-16 · 사이클 #24 · 분석 범위 v2.1.208 · v2.1.209 · v2.1.210
> 방법론: `/bkit:cc-version-analysis` (Phase 0~4 + Phase 1.5 Raw Verification Gate)
> 정본 소스: raw `CHANGELOG.md` (gh raw 바이트, model-WebFetch 우회) — raw-wins

---

## 1. Executive Summary

### 1.1 최종 판정

**호환 (0 Breaking / 0 ENH) — 즉시 흡수 권장.** 설치본 = latest = **v2.1.210** 수렴.
v208~210 3개 릴리스를 drift 없이 흡수하며, 총 79 bullets 중 51건(65%)이 Fixed 중심.
bkit 관련 HIGH 항목은 전부 코드검증으로 **native 수혜 또는 면역**으로 판정됨.

### 1.2 성과 요약

- **누적 연속 호환: 150 → 153** (v2.1.34 ~ v2.1.210, R-2 skip 제외)
- **신규 ENH streak: 24-cycle 연속 0건** (전역 마지막 ENH-366, ENH-367 예약 유지·미소비, CC-cycle 마지막 ENH-328)
- **native 수혜 7건** — 특히 v210 hook-timeout 오보고 fix가 bkit v2.1.30 Stop-hook stall 대응과 직접 시너지
- **면역/Neutral 5건** — 전부 grep 코드검증으로 확정

### 1.3 4-Perspective 가치 평가

| 관점 | 평가 | 근거 |
|------|------|------|
| **안정성(Stability)** | ★★★★★ | v208 대규모 메모리 누수 fix군(MCP stderr 64MB·async hook·LSP LRU) + v210 hook-timeout 오보고 fix → 장기 L4 auto-run 세션 견고화 |
| **보안(Security)** | ★★★★☆ | v210 Agent tool 간접 프롬프트 인젝션 하드닝 + v208 catastrophic removal `$(…)`/backtick 프롬프트 확대 → bkit Layer 6 Heredoc-bypass 방어와 native 수렴 |
| **DX/자동화(Automation)** | ★★★★☆ | hook-timeout이 더 이상 user-rejection으로 오보고되지 않아 unattended/L4 Full-Auto 오정지 제거. plugin MCP 재동기화 teardown fix로 2 MCP 서버 안정 |
| **비용/리스크(Cost/Risk)** | ★★★★★ | 0 breaking · 0 코드변경 필요 · 0 ENH. 순수 흡수, 대응 코스트 없음 |

---

## 2. CC v2.1.207 → v2.1.210 변경사항 (79 bullets, raw gh authoritative)

### 2.1 Phase 1.5 Raw Verification Gate 결과 — gh raw CHANGELOG 행 단위 (model-WebFetch 우회)

| 버전 | Total | Added | Fixed | 기타 | 정본 행범위 |
|------|-------|-------|-------|------|-------------|
| v2.1.210 | **33** | 2 | 22 | Hardened 1, Improved 3, prose 5 | L5–L37 |
| v2.1.209 | **1** | 0 | 1 | — | L41 |
| v2.1.208 | **45** | 4 | 28 | Improved 1, Reduced 4, prose 8 | L45–L89 |
| **범위 합계** | **79** | 6 | 51 | 22 | — |

- **검증 방법**: `curl raw CHANGELOG.md` → 헤더 grep(`^## `) → 행범위 `sed` → `grep -c '^- '`. 카운트는 raw 바이트 직행 확정.
- **Breaking heading: 0건** (전 버전 확인). Errata: 없음 (agent 미개입, 카운트 직접 측정).
- **v2.1.209는 단일 revert** (`/model` 등 dialog가 background 세션에서 차단되던 과도 guard 되돌림) — bkit 무관.

### 2.2 bkit 관련 HIGH 항목 (2건, 전부 코드검증 면역/수혜)

| # | 항목 | bkit 매핑 | 판정 | 코드검증 |
|---|------|-----------|------|----------|
| v210 L13 | hook callback timeout이 user-rejection으로 오보고 → unattended 세션 정지 | 36 hooks / L4 Full-Auto | **native 수혜** | bkit v2.1.30이 Stop-hook stdin stall을 자체 fix한 것과 동일 클래스 — CC 네이티브가 상위 오보고 경로까지 차단 |
| v208 L66 | subagent `tools` 리스트가 nothing으로 resolve 시 무툴 실행 → 이제 미인식 항목 명시 에러 | 34 agents (Task(subagent) 참조) | **native 안전망** | bkit 34개 agent tools 리스트 유효(가동 중) → 잠재 오설정 시 명확 에러로 조기 발견 |

### 2.3 bkit passive 수혜 (native 개선, 워크어라운드 불필요) — 7건

1. **v210 L13** hook-timeout 오보고 fix → L4 Full-Auto/unattended 오정지 제거 (**v2.1.30 Stop-hook 작업과 시너지**)
2. **v210 L15** plugin 제공 MCP 서버가 mid-session MCP 재동기화 시 teardown 되던 버그 fix → bkit 2 MCP 서버(`bkit-pdca`, `bkit-analysis`) 안정
3. **v208 L85** `rm -rf ~` 류 catastrophic removal이 `$(…)`/backtick/`<(…)` 안에서도 skip-perms·auto mode에서 프롬프트 → bkit **Layer 6 Heredoc-bypass 방어(#6 차별화)와 native 수렴**
4. **v210 L14** background 이동 후 `cd` 반영 가정 오류 fix (working directory unchanged 명시) → v207 cd fix 연장선
5. **v210 L29** Agent tool 간접 프롬프트 인젝션 하드닝 (subagent가 읽은 콘텐츠 경유) → bkit 다중 subagent 스폰 안전
6. **v208 L73/L78-L80** 장기세션 메모리 누수 fix군(MCP stdio stderr 64MB/서버·async hook output·LSP 50-doc LRU·edit read cache 16MB·transcript 79x 축소) → 장기 L4 auto-run 견고화
7. **v210 L33** MEMORY.md index가 read limit 초과 시 silent truncation → 명시 에러 → bkit MEMORY.md 컨벤션 + CC auto-memory 안전

### 2.4 면역/Neutral 검증 (전부 grep 확정)

| 항목 | 표면 relevance | 판정 | 근거 |
|------|----------------|------|------|
| v210 L8 `ultracode` 비인간 입력 트리거 fix | 자동화 트리거 | **면역** | `grep -rln ultracode` = 0건 (bkit 미사용) |
| v210 L19 미매칭 `$1`/`$2` placeholder 보존 | slash-command 인자 | **면역** | 실제 positional placeholder 0건 — `skills/pdca-watch`의 `$15/Mtok`(가격) 오탐일 뿐 |
| v208 L55 `MAX_OUTPUT_TOKENS` 과학표기 `1e6→1` fix | env 파싱 | **면역** | bkit `1e6` 전부 JS 산술(나노초·토큰 계산), env 값 아님 |
| v210 L7 `isolation:'worktree'` subagent가 main repo git-mutate | worktree 격리 | **Neutral** | bkit agent는 산문 "isolation"(테넌트 격리)만 언급, `isolation: worktree` subagent 미정의 |
| v210 L31 auto mode classifier → 외부세션 Sonnet 5 pin | 자동화 분류 | **Neutral** | bkit 자체 Trust Engine(L0–L4)와 직교 |

---

## 3. bkit 영향 매트릭스

| 컴포넌트 | 변경 필요 | 영향 | 비고 |
|----------|-----------|------|------|
| 34 Agents | ❌ | native 안전망(v208 L66) | tools 리스트 유효, 무변경 |
| 44 Skills | ❌ | 면역(v210 L19 $1/$2 미사용) | 무변경 |
| 36 Hooks / 22 Events | ❌ | **native 수혜(v210 L13)** | timeout 오보고 경로 CC 차단, bkit 코드 무변경 |
| 2 MCP Servers | ❌ | **native 수혜(v210 L15)** | 재동기화 teardown fix |
| 195 Lib Modules | ❌ | 면역(v208 L55) | `1e6` 산술 무영향 |
| Layer 6 Defense | ❌ | native 수렴(v208 L85) | CC가 $(…)/backtick gap 보강 — bkit 방어 여전히 광범위(우위 유지) |
| 50 Scripts | ❌ | 무영향 | stdin/stdout 프로토콜 무변경 |

**철학 준수**: Automation First / No Guessing / Docs=Code 전부 유지. 코드변경 0.

---

## 4. Phase 3 브레인스토밍 (Plan Plus) — ENH 도출

### 4.1 Intent Discovery
- **최대 가치**: v208 메모리 누수 fix군 + v210 hook-timeout fix로 **장기 L4 Full-Auto 세션 안정성** 무료 획득.
- **놓치면 안 되는 critical**: 없음 (0 breaking).
- **워크어라운드 대체**: v208 L85가 bkit Heredoc-bypass 방어와 수렴하나 **대체 아님** — bkit는 더 넓은 destructive 패턴 커버(우위 유지).

### 4.2 YAGNI Review
- 도출 후보 전부 native가 이미 해결 → 신규 구현 불필요.
- v210 hook-timeout fix는 bkit v2.1.30 Stop-hook 작업의 상위 경로를 CC가 흡수 → 추가 bkit 코드 **YAGNI fail (구현 불요)**.

### 4.3 우선순위
- **신규 ENH: 0건.** ENH-367 예약 유지(미소비). 24-cycle 연속 0-ENH.
- **유일 maintainer 액션(비-ENH)**: MF-2 — `RECOMMENDED_VERSION` bump (아래 §5).

---

## 5. Carry / Monitor 상태 (사이클 #24 종료 시점)

- **MF-2 OPEN 지속(격상)**: `lib/infra/cc-version-checker.js:42` `RECOMMENDED_VERSION = '2.1.198'` — 이제 latest 대비 **12 릴리스 뒤처짐**. **2.1.210으로 bump 권장(maintainer, 미구현)**. `MIN_VERSION='2.1.78'`·`FABLE_MODEL_FLOOR='2.1.170'` 유지 적정.
- **차별화 streak intact**: 3대 abandoned 이슈(#56293·#57317 PLUGIN-HOOK-DROP·#58904) 전부 유지. v210 L15는 plugin **MCP** teardown fix로 #57317 plugin **hook** drop과 **인접하나 동일 아님** → streak 계속("닫힘 ≠ 고침", code-fix bullet 미관측).
- **Monitor 상태**: BG-OTEL-DROP(#64436)·PLUGIN-HOOK-DROP(#57317)·CHOICE-LOOP(#64447) 전부 **ACTIVE 유지** (v208~210 verbatim code-fix bullet 미관측). STOP-SCHEMA-STRICT(ENH-366)·NOTIFY-BGAGENT 기존 RESOLVED 유지.
- **hook-matcher 컨벤션 면역 유지**: bkit matcher는 no-comma + no-hyphen + pipe/underscore → matcher-syntax 회귀 계속 면역.
- **신규 관측(모니터 완화)**: v210 L13 hook-timeout 오보고 fix는 unattended-stop 버그 클래스를 CC가 native 흡수 → bkit Stop-hook 계열 잔여 우려 완화(v2.1.30 fix와 이중 방어).

---

## 6. Quality Checklist

- [x] 범위 79 bullets 전부 캡처 (v208:45 · v209:1 · v210:33)
- [x] Phase 1.5 raw 검증 (curl raw CHANGELOG + 행범위 sed + grep -c), raw-wins, Errata 0
- [x] HIGH 항목 전부 impact 분류 + 코드검증
- [x] ENH 우선순위 배정 (0건 — YAGNI 통과)
- [x] 철학 준수 검증 (변경 0)
- [x] 파일 영향 매트릭스 완성
- [x] 4-Perspective 가치 표 포함
- [x] 한국어 작성
- [x] MEMORY.md 업데이트 (별도 커밋)

---

## 7. 결론

CC v2.1.208~210은 **Fixed 중심(65%)의 무해한 안정화 릴리스**로, bkit에 대해 **0 breaking · 0 코드변경 · 0 신규 ENH**. bkit 관련 HIGH 2건은 전부 native 수혜/안전망으로 판정되었고, 특히 **v210 hook-timeout 오보고 fix**가 bkit v2.1.30 Stop-hook stall 대응과 시너지를 이루며 L4 Full-Auto 세션 안정성을 무료로 강화한다. 유일한 후속은 비-ENH maintainer 액션인 **MF-2 RECOMMENDED_VERSION → 2.1.210 bump**이다. 누적 연속 호환은 **153**(v2.1.34~v2.1.210)으로 갱신된다.

> 즉시 흡수 권장. bkit 코드/문서/에이전트/훅 변경 불요.
</content>
