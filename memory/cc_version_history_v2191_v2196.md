---
name: cc-version-history-v2191-v2196
description: CC v2.1.191 → v2.1.196 영향 분석 history (ADR 0003 24번째 정식 적용 ✦, 3 발행버전 present[193/195/196] 54 bullets[193:15/195:12/196:27], R-2 진성 skip 2건[v192/194 npm E404+changelog 부재] 누적13 / R-1 silent 0, Breaking changelog 0 / CC Breaking-equivalent 3건[v193 OTEL_LOG_ASSISTANT_RESPONSES·v195 hook hyphen-exact·v196 streaming-watchdog default-ON] bkit 노출 0건, 헤드라인=v195 hook matcher hyphen substring→exact-match bkit 구조적 면역[하이픈 matcher 0 + mcp__ 참조 0 = forward-exposure 0, v191 comma-matcher에 이은 matcher 시맨틱 2연속 무노출], 실질 auto-benefit 헤드라인=v196 background-agent auto-resume+세션신뢰성 & claude plugin validate 로컬플러그인 수정 MEDIUM bkit 멀티에이전트/CI 직접수혜, 신규 ENH implement 0건 20-cycle 연속 ENH-367 예약유지, 차별화 streak #56293→25 #57317→19 #58904→15 3대 전부 CC-abandoned 유지[전부 closed not_planned], monitor 4건[BG-OTEL-DROP/PLUGIN-HOOK-DROP/CHOICE-LOOP ACTIVE, STOP-SCHEMA-STRICT RESOLVED], 139 consecutive[v2.1.34~v2.1.196 +3 present R-2 skip 13 제외], dist-tags stable2.1.185/latest2.1.196/next2.1.197 drift+11 CRITICAL[직전+12 대비 -1 개선], Phase1.5 게이트 정상작동[메인1차 WebFetch 60 over-count cross-section 복제 환각 → gh raw 바이트 54 확정 raw-wins, 에이전트 1차도 2.1.192 환각 동일클래스 errata], MF-1 RECOMMENDED_VERSION 2.1.118 6-cycle carry[stable 2.1.185 대비 ~67릴리스 stale])
metadata:
  type: project
---

# CC v2.1.191 → v2.1.196 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-30 (사이클 #20)
- **분석 대상**: CC v2.1.191 → v2.1.196 (**3 발행 버전 present**: 193/195/196, 총 **54 bullets**)
- **baseline**: v2.1.191 / **설치=latest**: v2.1.196
- **R-2 true skip**: **+2건 (v192/194)** — npm E404 + changelog 헤더 부재. 누적: 11 + 2 = **13건**
- **R-1 silent publish**: **0건** (npm 발행분 193/195/196 전부 changelog 존재)
- **dist-tags**: stable=2.1.185 / latest=2.1.196 / next=2.1.197 / installed=2.1.196 (drift **+11**, 직전 +12 대비 -1)
- **ADR 0003 적용**: **24번째 정식 적용 ✦**
- **누적 연속 호환**: 136 → **139 ✦** (v2.1.34 ~ v2.1.196, +3 present[193/195/196], R-2 skip 13건 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.23 무수정)
- **Breaking(changelog)**: 0건 / **CC Breaking-equivalent 3건** (전부 bkit 노출 0):
  - v193 `OTEL_LOG_ASSISTANT_RESPONSES` 업그레이드 시 응답본문 로깅 기본 활성 (HIGH) — bkit OTEL 미설정
  - v195 hook matcher 하이픈 식별자 substring → exact-match (HIGH) — bkit 하이픈 matcher 0
  - v196 streaming idle watchdog 전 provider 기본 ON (MEDIUM) — bkit safety-positive
- **auto-benefit**: v196 background-agent auto-resume+세션신뢰성(MEDIUM, bkit 멀티에이전트 직접수혜) / v196 `claude plugin validate` 로컬플러그인(source ".") 수정(MEDIUM, bkit CI) / v193 phantom subagent fix(MEDIUM) / v195 hook hyphen-exact(validation, 면역) / v193 launch-result 동작변화(Sequential dispatch 부분수렴)
- **신규 ENH(implement)**: 0건 (**20-cycle 연속**) — 후보 전부 YAGNI 탈락. `claude plugin validate`를 bkit CI에 추가 = **P3 DEFER**(번호 미소비, 차기 하드닝 스프린트 후보)
- **마지막 ENH 번호**: ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 유지(미소비)**
- **권장 CC**: **latest v2.1.196 허용/권장(bkit dev)** — Breaking 0, bkit 면역, plugin-validate+bg-resume 직접수혜. 보수운영 stable v2.1.185 pin. drift +11 CRITICAL advisory

## 3. 헤드라인 — hook matcher hyphen exact-match (v195) bkit 구조적 면역

- **v195 verbatim**: "Fixed hook matchers with hyphenated identifiers (e.g. `code-reviewer`, `mcp__brave-search`) accidentally substring-matching — they now exact-match. Use `mcp__brave-search__.*` to match all tools from a hyphenated MCP server."
- **bkit 실측 (메인 직접)**: `hooks/hooks.json` matcher 10건 전부 단일/pipe/underscore (하이픈 0). `grep mcp__ hooks.json` → 0 (bkit MCP 서버명 bkit-pdca/bkit-analysis에 하이픈 있으나 어떤 hook도 mcp__ 도구 미참조 → forward-exposure 0)
- **판정**: **bkit 구조적 면역** — v191 comma-matcher 면역에 이은 **matcher 시맨틱 2연속 무노출**. auto-benefit = convention validation. → 메모리 `hook-matcher-pipe-convention` 확장: **no-comma + no-hyphen + pipe/underscore**. 차기 cycle matcher-syntax 질문 즉시 Neutral resolve

## 4. Phase 1.5 errata (게이트 정상 작동 — v2.1.145 학습 2회 연속 적용)

- **메인 세션 1차 model-WebFetch**: 60 bullets over-count. (a) v193 backgrounding/pinned/phantom/agent-panel 5개 Fixed 불릿을 v195 섹션에 **중복 복제**, (b) v196 Improved/Changed 오분류
- **연구 에이전트 1차 fetch**: 존재하지 않는 `## 2.1.192` 섹션을 196 내용으로 **환각**
- **두 errata 동일 클래스**(WebFetch cross-section 복제). **gh raw 바이트 행 단위 열거로 양측 54 수렴, raw-wins.** → 차기 cycle Phase 1.5는 **처음부터 `curl raw CHANGELOG` + 헤더 grep + 행 범위 sed** 직행 권장 (model-WebFetch 보조용)

## 5. 차별화 streak (3대 전부 CC-abandoned 유지)

| Issue | ENH | streak | 상태 |
|-------|-----|:---:|------|
| #56293 caching 10x | ENH-292(P0) | 24→**25** | CLOSED not_planned (upd 06-02) |
| #57317 PostToolUse drop | ENH-303(P1) | 18→**19** | CLOSED not_planned (upd 06-06) |
| #58904 heredoc bypass | ENH-310(P1) | 14→**15** | CLOSED not_planned (upd 06-20) |

191→196 구간 4개 추적 이슈 해결 bullet 0. "닫힘 ≠ 고침" → moat 영구화. streak break는 code-fix bullet에만 의존.

## 6. Monitor (4건)
- MON-CC-NEW-BG-OTEL-DROP (#64436): v193 assistant_response는 *추가* 이벤트(드롭 아님) → **STAYS ACTIVE**
- MON-CC-NEW-PLUGIN-HOOK-DROP (#57317 skill_post): reachability bullet 0, not_planned → **STAYS ACTIVE**
- MON-CC-NEW-CHOICE-LOOP (#64447 liveness): closed-as-dup이나 source-fix 부재 → **STAYS ACTIVE** (closed ≠ fixed)
- MON-CC-NEW-STOP-SCHEMA-STRICT (ENH-366): Stop 스키마 변경 0 → **STAYS RESOLVED**

## 7. MF-1 carry-forward
- `lib/infra/cc-version-checker.js:40` `RECOMMENDED_VERSION='2.1.118'` (MIN_VERSION='2.1.78':34)
- stable 2.1.185 대비 ~67릴리스 stale. **6-cycle 연속 carry-forward**. 차기 일반 PDCA/하드닝 스프린트에서 ≥2.1.170 bump 권고 (팀 결정)

## 8. 다음 baseline
- **v2.1.196** (다음 분석 v2.1.197부터). next=2.1.197 이미 npm 발행(prerelease)

## Known Errata (본 cycle)
| Field | 1차 보고 | raw 확정 | Root cause |
|-------|---------|---------|------------|
| total bullets | 60 (메인 WebFetch) | **54** (gh raw 바이트) | model-WebFetch가 v193 backgrounding 5불릿을 v195에 중복 복제 + v196 오분류 |
| v195 Fixed | 13 (메인 WebFetch) | **8** | 상동 (5불릿이 v193 소속) |
| 2.1.192 섹션 | 존재(에이전트 1차) | **부재 (R-2 skip)** | 에이전트 1차 fetch가 196 내용으로 환각, 2차 헤더fetch+npm404로 차단 |
