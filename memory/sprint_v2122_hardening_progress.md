---
name: sprint-v2122-hardening-progress
description: bkit v2.1.22 Hardening Release 멀티 세션 진행 이력 SoT — 6 sprint(S1 CC v2.1.159 / S2 크로스플랫폼 / S4 데드코드 / S3a god-file분할 / S3b 레이어통합 / S5 최종QA+docs-sync), Kahn order S1→S2→S4→S3a→S3b→S5, 모든 개발 완료 후 릴리즈. 세션 재개 시 본 파일 + master-plan state JSON + /sprint list + Task Management 확인.
metadata:
  type: project
---

# bkit v2.1.22 Hardening Release — 진행 이력 (멀티 세션 SoT)

## 메타
- **브랜치**: `release/v2.1.22-hardening` (main 에서 생성, 2026-06-01)
- **마스터 플랜**: `docs/01-plan/features/v2.1.22-hardening.master-plan.md`
- **State JSON**: `.bkit/state/master-plans/v2.1.22-hardening.json`
- **릴리스 정책**: 6개 sprint **모든 개발/보완/보강 완료 후** v2.1.22 릴리스 (sprint별 부분 릴리스 안 함)
- **Trust**: 대부분 L3, S3a/S3b는 L2(최고위험)
- **ENH 예약**: ENH-324 ~ ENH-360

## 🚨 사용자 품질 지침 (전 sprint·전 세션 불변 원칙 — 2026-06-01)
**절대 토큰/시간 비용 절약을 이유로 빠르게/허투루 작업하지 말 것.** 모든 sprint는 완전한 /pdca 사이클로:
1. **문서 작성 → 문서 내용 반복 검증** (design-validator 등) → 완벽할 때만 구현 진입
2. **구현 완료 → 문서대로 구현됐는지 반복 검증·개선** (gap-detector matchRate 100 목표, < 90 시 pdca-iterator)
3. **구현 100% → /pdca qa 로 실제 동작 검증**: 본 세션은 `--plugin-dir .` 로 실행됨 → 이 세션 또는 `-p` 옵션으로 실제 런타임 동작을 꼼꼼히 검증 (정적 분석만으로 끝내지 말 것)
- 자동화 레벨: **전역 L4 Full-Auto** (단 S3a/S3b는 플랜대로 L2 수동 게이트 유지 — 고위험)

## 세션 재개 프로토콜 (NEXT SESSION 필독)
1. 본 파일 읽기 → 위 품질 지침 + 아래 "진행 현황" 표 확인
2. `.bkit/state/master-plans/v2.1.22-hardening.json` 읽기
3. `/sprint list` + Task Management(`TaskList`)로 다음 unblocked sprint 확인
4. 해당 sprint 작업 (`/sprint start <id>` 또는 phase 진행) — **위 품질 지침 준수**
5. **종료 시 반드시**: sprint state 갱신 + 본 파일 "진행 현황" 표 갱신 + master-plan JSON sprints[].status 갱신

## Sprint 의존성 (Kahn order) — S6 추가 2026-06-01
```
S1 (독립) ─┐
S2 (독립) ─┤
S6 (독립) ─┤  ← 신규 P0 (CC Stop hook schema 위반, 활성 breakage)
S4 (독립) ─┼─→ S3a(S4) ─→ S3b(S3a) ─┐
          └──────────────────────────┴─→ S5 (S1+S2+S6+S3b+S4) [LAST]
```
Kahn 실행 순서: **S1→S2→S6→S4→S3a→S3b→S5** (S6는 활성 P0라 S4보다 우선).
Task 매핑(세션 2, 2026-06-01): S1=#1 / S2=#2 / S4=#3 / S3a=#4 / S3b=#5 / S5=#6 / **S6=#7**
- 의존: #4 blockedBy #3 / #5 blockedBy #4 / #6(S5) blockedBy #1,#2,#7,#5,#3
- ⚠️ Task Management 는 세션 휘발성 → 세션마다 본 매핑 재생성 가능. master-plan state JSON 의 dependencyGraph 가 기계 판독 SoT.

## 진행 현황 (세션마다 갱신)
| Sprint | Task | 의존 | Trust | 상태 | 비고 |
|--------|------|------|-------|------|------|
| S1 CC v2.1.159 Response | #1 | — | L4 | ✅ archived (2026-06-01) | ENH-324~328 완료, QA 3/3 PASS, registry 22→24, report 작성 |
| S2 Cross-Platform | #2 | — | L4 | ✅ archived (2026-06-01 세션2) | ENH-329~335 완료. CRLF fence 정규식 6 + split 34/19파일 + path-sep 2. 런타임 QA 8/8, 회귀 0. 8-phase 완주, 11 gate green. report 작성 |
| S6 CC Stop Hook Schema | #7 | — | L4 | ✅ archived (2026-06-01 세션2) | ENH-361~366 완료. port typedef 정정 + 5 emitter compliant(`decision:'block'`/`{}`) + io 공유헬퍼 + contract test + monitor. 런타임 QA 31/31, unit 20/20, 회귀 0. 8-phase 완주 |
| S4 Tech-Debt/Dead-Code | #3 | — | L4 | ✅ archived (2026-06-02 세션3) | ENH-336~342. 전수 실측: dead code **0건**(추정 과대집계). pdca-eval 6 stub 영구유지 확정(L4 거버넌스 lock 주석). skip 0/TODO 1/dead module 0/orphan 0. 회귀 0 |
| S3a God-File Split | #4 | S4 | L4 | 🔵 in_progress 3/4 (2026-06-02 세션3) | god-file(>700) **4개→1개**. ✅ unified-stop 751→693(2c49218)/automation 770→451(e43bb0f)/state-machine 985→406(43d47a2). ⏳ 남은 1: **sprint-handler.js 1509**(최고위험, 새 세션 full-context 권장). 각 분할 contract 255 PASS·deadcode 0·회귀 0·subdir 22·module 188→190 |
| S3b Layer Consolidation | #5 | S3a | L2 | 🔒 blocked | 22 subdirs/8-layer 통합 |
| S5 Final QA+i18n+Docs-Sync | #6 | S1,S2,S3b,S4 | L3 | 🔒 blocked | 전체 QA(L1-L5+S1) + 8-lang trigger(44skill+40agent) + code=docs(README/hooks/bkit.config.json/.claude-plugin/bkit-system/CHANGELOG/AI-NATIVE/CUSTOMIZATION/README-FULL, docs/ 제외) |

**현재 위치**: S1 ✅, S2 ✅, S6 ✅, S4 ✅ archived (4/7). **S3a 🔵 in_progress 3/4** (god-file 4→1). 
**S3a 재개 프로토콜(다음 세션 필독)**: 남은 god-file = `scripts/sprint-handler.js`(1509, 최고위험). design manifest `docs/02-design/features/ctx-eng-godfile-split.design.md §2 ENH-343`에 분할 그룹 정의(trust 79-167/dogfood 658-812/gates 963·1331-1404 → scripts/lib/sprint-handler-*.js). ⚠️ trust 그룹은 module-const(LEVEL_RANK/DEFAULT_TRUST_LEVEL/VALID_TRUST_LEVELS)+parseFlags 의존 → 함께 이동 또는 주입 필요. 핸들러는 infra/deps 공유. **검증 프로토콜(매 분할)**: `node --check` + `node scripts/sprint-handler.js status <id>`(dispatcher 동작) + contract-test-run L1+L4(255 불변) + check-deadcode(Dead=0) + tests/qa+tests/contract 회귀 comm(baseline 7) + LOC≤700. 분할 완료 후 simplicity invariant 최종검증(god-file 0)→S3a archived→S3b unblock.
**baseline 파일**: /tmp/s3a_baseline.txt (회귀 비교 7 fail). 없으면 재생성: `for f in tests/qa/*.test.js tests/contract/*.test.js; do node "$f">/dev/null 2>&1||echo "FAIL $f"; done|sort`.
**S3a 교훈**: 분할은 **문자열 마커 기반 node 스크립트로 verbatim 이동 + re-export**가 안전(수작업 복사 오류 0). lazy-getter는 경로 rebase 주의(scripts/lib/는 ../../lib). 자기완결성(로직함수 호출 0, function 정의 0) sanity check 필수 — split#3에서 _checkChromeMcpAvailable 누락을 sanity가 잡아냄.
S3a(sprint-handler) 완료 → S3b → S5(LAST). 진행률 sprint 4/7 archived + S3a 75%.
**S4 교훈**: dead-code "추정"은 raw-match 과대집계(skip 491→실제 0, TODO 5→1, dead module 0, orphan 0). pdca-eval 6 stub은 immutable baseline(v2.1.9+v2.1.16)+L4 거버넌스가 요구하는 영구 tombstone → 제거 불가. **S3a/S3b/S5도 추정 맹신 말고 도구·계약·테스트로 검증.** S3a는 god-file 분할이 226 contract assertion 파괴 risk가 실재하므로 매 분할마다 contract-test-run L1+L4 + check-deadcode + 전 test 실행 필수.
**S6 편입 경위**: S2 완료 후 사용자가 `/sprint list` 실행 시 Stop hook 출력 검증 에러(`(root): Invalid input`) 발생 → 심층 분석 결과 5 Stop emitter 공통 systemic 버그(잘못된 decision enum + Stop 미지원 hookSpecificOutput + skillResult root field) 확인 → master plan에 S6로 정식 편입(2026-06-01). enhReserved ENH-324~366으로 확장, releaseGate 7/7.
**S2 핵심 교훈**: 마스터플랜 worst-case 추정(raw concat 14/shell 분기 확대/21 hook)은 과대 — bkit 이미 ~90% cross-platform-safe. 진짜 위험은 **CRLF 미처리 frontmatter fence 정규식**(`/^---\n/`이 `---\r\n`에서 매칭 실패→skill 로딩 깨짐). S4/S5도 추정 맹신 말고 실측 우선. ⚠️ Windows 실런타임 검증은 미수행(Darwin) → 후속 ENH(CI matrix) carry.
**Gate 측정 방식 메모**: sprint-handler CLI는 Task tool 없어 measure가 `no_agent_runner` 반환 → 메인 세션이 dispatcher로서 실측 증거 기반 gate 값을 state qualityGates에 직접 기록 후 `phase --to <p> --approve` 로 전진. M5_runtimeErrorRate 슬롯은 init state에 없어 수동 추가 필요. `--approve`는 scope만 우회, gate fail은 우회 못 함(측정 먼저).

## 핵심 분석 발견 (작업 근거)
- **docs-code-sync CI 맹점 근본원인**: `lib/domain/rules/docs-code-invariants.js`의 `EXPECTED_COUNTS`가 `agents:34` 하드코딩 + lib modules/scripts/subdirs/consecutive 미추적 → 문서 drift 미검출 (S5에서 확장)
- **확정 문서 drift**: README(34 agents/163 modules/51 scripts/94 consecutive/v2.1.139), AI-NATIVE(36 agents/43 skills/142 modules/16 subdirs), README-FULL(34/163/51/94) → 실측 **40 agents/44 skills/188 modules/22 subdirs/v2.1.159/112 consecutive**
- **ENH-317 MOOT**: CC v147 /simplify rename이 v154에서 복원 → bkit /simplify 10 surface valid, deferred 결정 정당화
- **S3 최고위험**: god-file 분할이 226 contract assertion + M1-M10 gate 파괴 risk → L2 + 매 transition 검증
- **S2 corrected**: process.platform 2사이트, raw '/' concat 14(lib), path.join 349, shell-exec ~30
- **S4 corrected**: .skip/.only 19 테스트파일(491은 raw match), pdca-eval stub 6 (contract L4 governance 확인 필요)

## Related memories
- [[cc-version-history-v2147-v2159]] — S1 근거 (CC v2.1.159 분석)
