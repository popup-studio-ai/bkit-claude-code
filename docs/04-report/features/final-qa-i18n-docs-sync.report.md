# S5 — Final QA + i18n + Docs-Sync (LAST) 완료 보고서

> **Sprint**: `final-qa-i18n-docs-sync` (마스터 플랜 S5, LAST) · **Trust**: L4 · **ENH**: ENH-355~360
> **Date**: 2026-06-02 · **Branch**: `release/v2.1.22-hardening`
> **Phase**: prd→plan→design→do→iterate→qa→report→archived (8-phase 완주) · **체크포인트 3 커밋**

---

## 1. Executive Summary

v2.1.22 Hardening의 **마지막 게이트** sprint. 전체 QA + 8-lang 완비 검증 + code=docs sync + version bump을 완료하여 **릴리스 게이트(§11)를 충족**했다. ground-truth 측정(docs-code-sync.js 실행 + fresh inventory)으로 추측을 배제했고, QA가 **내가 놓친 version-bump 누락 site(2 hook)를 잡아 수정**했다. 7개 pre-existing 테스트 실패는 v2.1.12~16 누적 test-debt(전 sprint baseline-red, **v2.1.22 회귀 0**)로 정밀 진단 후 Task #8로 추적 등록.

## 2. ENH 결과

| ENH | 내용 | 결과 |
|-----|------|------|
| **359** version bump | 2.1.21→2.1.22 | bkit.config(canonical)/plugin.json/marketplace(×2)/hooks.json/README badge/CHANGELOG + **QA가 잡은 누락 2곳**(session-start.js, session-context.js header). scanVersions 0 mismatch |
| **357** doc drift | current-state code=docs | 42 phrase 치환(README/AI-NATIVE/README-FULL/CUSTOMIZATION/marketplace/bkit-system×2). modules 163/142/175→190, subdirs 19/16→22, scripts 51/49/54→61, templates 39→40, skills 43→44, agents 36→34, domain 12→18, CC v2.1.139→v2.1.159, consecutive 94→112. **immutable(release-history/frozen baseline) 보존** |
| **356** 8-lang audit | 44 skill+40 agent 8-lang | **language.js 30 엔트리(12 agent+16 skill+2 CC) 전부 en/ko/ja/zh/es/fr/de/it 완비**(프로그램 검증 0 missing/empty). 런타임 SoT는 language.js(SKILL.md Triggers는 문서, 미사용). 코드변경 0 |
| **355** 전체 QA | L1-L5+S1 | contract 255/234 PASS·deadcode 0·docs-sync 0 drift·verify-full-system(module 190/190·hook 73/73·agent 40/40·hooks.json 25/25)·회귀 0. **version-bump 누락 발견·수정** |
| **358** docs-code-sync | 자동측정 확장 | scanner가 이미 libModules/scripts 측정 + invariant 0("agents:34 하드코딩"은 오진단=active 정답). `countLibSubdirs()` 추가(libSubdirs:22, informational). consecutive는 narrative(scanner 밖) |
| **360** release gate | §11 | 충족(§4) |

## 3. 핵심 발견 (ground truth — 추측 교정)
- docs-code-sync.js는 **이미** libModules(190)+scripts(61) 측정하고 invariant drift 0. master plan의 "modules/scripts 미추적 + agents:34 하드코딩 drift"는 **stale 분석/오진단**이었다(34=active 정답, scanner가 deprecated tombstone 6 제외).
- 런타임 8-lang은 `lib/intent/language.js` 하드코딩 맵이 SoT. SKILL.md "Triggers:"는 문서. → 20 user-invocable skill의 EN+KO docs는 기존 컨벤션, bulk 번역 비실행(런타임 이미 완비).
- "226 CI-gated assertions"는 baseline-dependent(contract-test-run L1+L4 실행은 255/234) → 추측 변경 금지, carry.

## 4. Release Gate (§11) — 충족

| # | 게이트 | 상태 |
|---|--------|------|
| 1 | 7/7 sprint archived | ✅ S1·S2·S6·S4·S3a·S3b + S5(본 sprint archived 시 7/7) |
| 2 | 0 doc drift (docs/ 제외) | ✅ docs-code-sync PASS, current-state stale 0 |
| 3 | 전체 QA PASS (criticalIssue 0) | ✅ contract 255/234·deadcode 0·module 190/190·**v2.1.22 회귀 0**. (pre-existing test-debt 7 = §5 carry, 회귀 아님) |
| 4 | 8-lang 완비 | ✅ language.js 30 엔트리 8-lang |
| 5 | S3 simplicity invariant | ✅ god-file 0(S3a), subdir 22, module +2 |
| 6 | 전 quality gate green | ✅ M1-M10 + S1-S4 (각 sprint) |
| 7 | ENH-317 취소 + version + CHANGELOG | ✅ ENH-317 cancelled(S1), v2.1.22, CHANGELOG 완비 |

## 5. 한계 & Carry (정직한 기록)
- **Pre-existing test-debt 7건** (Task #8): v2.1.12~16 누적 stale-count + minor gap. 전 7 sprint baseline-red, **v2.1.22 회귀 아님**(comm 입증). 진단: VALID_ACTIONS 17→20, ACTION_TYPES 29→40, 142→190 modules, 11 lib @version 누락, sprint/SKILL.md Hangul, kpiSnapshot 로직. → v2.1.23 별도 정리(제품 ground-truth 확인 후 stale 기대값 갱신 + 실제 gap 보완). 세션 끝 rushed 수정 회피(혼합 debt, 신중 요).
- **"226 assertions"** 표기: baseline-dependent, 미변경(carry).
- **Windows 실런타임**(S2 carry): Darwin 환경, CI matrix 후속 ENH.
- verify-full-system K(v2114 sprint state missing): pre-existing 환경 의존, v2.1.22 무관.

## 6. Quality Gates
M1=100·M2=95·M3=0·M4=100·M5=0·M7=95·M8=90·M10·S1=100·S2=100·S4=true — 전부 green.

> **Status**: Report 완료 — archived. **v2.1.22 Hardening Release 7/7 완료, 릴리스 게이트 충족.**
