---
name: cc-version-history-v2181-v2191
description: CC v2.1.181 → v2.1.191 영향 분석 history (ADR 0003 23번째 정식 적용 ✦, 6 문서화 버전 present 93 bullets[183:17/185:1/186:33/187:21/190:1/191:20], v182 R-1 silent publish / v184·188·189 R-2 진성 skip, Breaking changelog 0 / CC Breaking-equivalent 2건[respondToBashCommands·MAX_RETRIES cap]이나 bkit 노출 0건, 헤드라인=comma-matcher hook fix v191 bkit 구조적 면역[pipe 컨벤션 100%], 실질 auto-benefit 헤드라인=v183 WebSearch-empty-in-subagents fix MEDIUM[cc-version-researcher/pm-research 직접 수혜], auto-benefit 5건, 신규 ENH implement 0건 19-cycle 연속 ENH-367 예약 유지[destructive-detector 확장 후보 Deferred], 차별화 streak #56293→24 #57317→18 #58904→14 3대 이슈 전부 CC-abandoned[#58904 OPEN→not_planned 전환 = moat 영구화], monitor 4건 전부 유지[CHOICE-LOOP=#64447 closed-as-dup이나 liveness 미수정 STAYS ACTIVE], R-1 silent +1[v182] R-2 skip +3[v184/188/189] 누적11 R-3 hotfix #7[v187 2.7s 회귀], 136 consecutive milestone, dist-tags stable2.1.179/latest2.1.191 drift+12 CRITICAL, Numeric Correction Protocol 적용[analyst stale stable2.1.170/drift+21/~135 → 메인 직접측정 stable2.1.179/drift12/136 raw-wins], MF-1 RECOMMENDED_VERSION 2.1.118 5-cycle carry)
metadata:
  type: project
---

# CC v2.1.181 → v2.1.191 영향 분석 history

## 1. 메타데이터

- **분석 일자**: 2026-06-26
- **분석 대상**: CC v2.1.181 → v2.1.191 (**6 문서화 버전 present**: 183/185/186/187/190/191, 총 **93 bullets**)
- **baseline**: v2.1.181
- **R-1 silent publish**: **+1건 (v182)** — npm 존재 / changelog 미문서
- **R-2 true skip**: **+3건 (v184/188/189)** — npm E404 + changelog 부재. 누적: v134/135/151/155/164/171/177/180 + v184/188/189 = **11건**
- **dist-tags**: latest=next=2.1.191 / stable=2.1.179 / installed=2.1.191
- **ADR 0003 적용**: **23번째 정식 적용 ✦**
- **누적 연속 호환**: 129 → **136 ✦** (v2.1.34 ~ v2.1.191, +7 present[v182,183,185,186,187,190,191], R-2 skip 11건 미포함)

## 2. 최종 판정

- **크리티컬 회귀**: 0건 (bkit v2.1.22 무수정)
- **Breaking(changelog)**: 0건 / **CC-level Breaking-equivalent**: **2건** (v186 respondToBashCommands 기본값 변경 HIGH / v186 CLAUDE_CODE_MAX_RETRIES 15 cap MED) — **단 bkit attachment surface 노출 0건** (실증: bkit `!` prefix 미사용, MAX_RETRIES 미설정)
- **auto-benefit**: 5건 — **[실질 헤드라인] v183 WebSearch-empty-in-subagents fix(MEDIUM, cc-version-researcher/pm-research 직접 수혜)** / v191 comma-matcher fix(bkit 면역 검증) / v186 Agent(type) 강제 복원(LOW, #1/#4) / v186 skill frontmatter case+malformed YAML 관용(LOW) / v183 auto-mode destructive-git block(LOW, Defense Layer 6 수렴)
- **Neutral**: ~85건
- **신규 ENH(implement)**: 0건 (**19-cycle 연속**) — ENH-367(destructive-detector 확장) Deferred, 모든 후보 YAGNI 탈락
- **마지막 ENH 번호**: ENH-328(CC-cycle) / 전역 ENH-366, **ENH-367 예약 유지(미소비)**
- **권장 CC**: **stable v2.1.179 pin** (latest 2.1.191 허용 가능, Breaking 0이나 v186 2-Breaking-equiv + runtime churn). drift +12 CRITICAL

## 3. 헤드라인 — comma-matcher hook fix (v191) bkit 구조적 면역

- **v191 verbatim**: "Fixed hooks with comma-separated matchers (e.g. `\"Bash,PowerShell\"`) silently never firing"
- **bkit 실측 (메인 세션 직접)**: `hooks/hooks.json` 전수 grep → comma-separated matcher **0건**. 다중-tool matcher 6건 전부 pipe(`|`): `Write|Edit`(L19) / `auto|manual`(L112) / `Bash|Write|Edit`(L190) / `project_settings|skills`(L213) / `Write|Edit|Bash`(L225) / `permission_prompt|idle_prompt`(L237)
- **판정**: **bkit 구조적 면역** — v191 버그(comma matcher silently-never-firing)는 bkit hook을 한 번도 침범 못함. bkit의 일관된 pipe 컨벤션 결과. auto-benefit = convention validation (silent bkit 버그 fix 아님). → **`hook-matcher-pipe-convention` 메모리화: 차기 cycle matcher-syntax 질문 즉시 Neutral resolve**
- **실질 positive 헤드라인**: v183 WebSearch-empty-in-subagents fix가 bkit 리서치 에이전트(cc-version-researcher/pm-research)에 직접 수혜 → auto-benefit MEDIUM. 본 cycle Phase 1 리서치 신뢰성에도 직결

## 4. CC Breaking-equivalent 2건 — bkit 노출 0건 (실증)

| Breaking-equiv | 성격 | bkit 노출 실측 | 판정 |
|----------------|------|---------------|------|
| v186 respondToBashCommands 기본값(true) | `!` bash 출력 자동 응답 | `!` prefix bkit 미사용(유일 매치 release-plugin-tag.sh:67 = shell 부정 연산자) | Neutral (user-UX 노트만) |
| v186 CLAUDE_CODE_MAX_RETRIES 15 cap | >15 silently cap | `grep CLAUDE_CODE_MAX_RETRIES` → 0건 | Neutral (미설정) |

→ 직전 cycle "Breaking-equivalent 0건"에서 변화. **CC 차원 2건이나 bkit attachment surface 0건** → 19-cycle 무수정 streak 유지.

## 5. Phase 1.5 게이트 — gh-API base64 직행

- `gh api repos/anthropics/claude-code/contents/CHANGELOG.md --jq '.content' | base64 -d` 행 단위 열거 → **93 bullets 확정**, count 불일치 0
- v182 R-1 silent: npm `2.1.182` 존재 / changelog 미문서
- v184/188/189 R-2 진성 skip: npm E404 + changelog 부재 이중 확인
- spot-check 3건: v191 comma-matcher / v186 respondToBashCommands / v183 destructive-git verbatim

## 6. 차별화 streak 갱신 + ⚠️ 3대 이슈 전부 CC-abandoned

| Issue | ENH | 이전 | 갱신 | 이슈 상태 (본 cycle) |
|-------|-----|:---:|:---:|------|
| #56293 caching 10x | ENH-292(P0) | 23 | **24** | CLOSED not_planned |
| #57317 PostToolUse drop | ENH-303(P1) | 17 | **18** | CLOSED not_planned |
| #58904 heredoc bypass | ENH-310(P1) | 13 | **14** | **OPEN → CLOSED not_planned ✦** |

- **⚠️ 신규 패턴**: 직전 cycle까지 #58904만 OPEN(security label)이었으나 본 cycle `not_planned` 종료 → **3대 차별화 이슈 전부 CC 수정 포기**(#56293·#57317·#58904 not_planned, #64447 duplicate). streak break 아님("닫힘≠고침"). Anthropic 미수정 의사 확정 → bkit workaround **가치 영구화(moat 최대 강화)**. 향후 streak break 판정은 code-fix bullet에만 의존.
- surface 3/3 code-active: sub-agent-dispatcher.js / destructive-detector·layer-6-audit / heredoc-detector.js

## 7. R-Series + Monitor + MF

- **R-1 silent**: +1 (v182)
- **R-2 skip**: +3 (v184/188/189) → 누적 11
- **R-3 hotfix**: #7 (v187 "Remote sessions ~2.7s longer after agent proxy CA install" 회귀)
- **release_drift**: stable 2.1.179 / latest 2.1.191 = **12 (CRITICAL ≥8)**
- **Numeric Correction Protocol 적용 사례**: analyst가 stale stable=2.1.170/drift+21/~135 보고하며 dist-tags 미확보 flag → 메인 세션 `npm view ... dist-tags` 직접 측정 → stable=2.1.179/drift=12/consecutive=136 채택(raw wins). v2.1.16 errata 학습 절차 정상 작동.
- **Monitor 4건**: BG-OTEL-DROP(#64436) / PLUGIN-HOOK-DROP(#57317 not_planned) / CHOICE-LOOP(#64447 closed-as-dup이나 liveness 미수정) **전부 STAYS ACTIVE**, STOP-SCHEMA-STRICT(ENH-366) STAYS RESOLVED. 신규 등재 0건(#68417 AskUserQuestion Windows ConPTY OPEN = P3 defer)
- **MF-1 carry-forward**: `lib/infra/cc-version-checker.js:40` RECOMMENDED_VERSION='2.1.118' (MIN='2.1.78':34) — stable 2.1.179 대비 ~61릴리스 stale, **5-cycle 연속 carry**. 다음 하드닝에서 floor ≥2.1.170 bump 권고(팀 결정, No Guessing)

## 8. 메모리 갱신 요약

- New-ENH(implement)-zero streak: 18 → **19**
- Consecutive compatible: 129 → **136 ✦** (+7 present)
- Differentiation: #56293=**24** / #57317=**18** / #58904=**14** (3대 전부 CC-abandoned)
- Architecture baseline: 재측정 일치, 정정 없음 (v2.1.22 / agents 40 / skills 44 / lib 190 / subdirs 22 / MCP 2)
- 다음 baseline: **v2.1.191** (다음 분석 v2.1.192부터)
