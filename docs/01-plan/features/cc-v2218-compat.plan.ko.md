# Plan — CC v2.1.218 호환 대응 (bkit v2.1.31)

> **Feature**: cc-v2218-compat · **타깃 버전**: v2.1.31 · **브랜치**: `feat/v2.1.31-cc218-fork-bg-compat`
> **PDCA phase**: plan · **작성일**: 2026-07-23 · **근거 보고서**: `docs/04-report/features/cc-v2218-impact-analysis.report.ko.md` (cycle #29)

## 1. 배경 (근거 확정)

Claude Code v2.1.218 CHANGELOG:
> "Changed skills with `context: fork` to run in the background by default; opt out per skill with `background: false`."

bkit는 **9개 스킬**이 `context: fork`를 사용(phase-1-schema, phase-2-convention, phase-3-mockup, phase-4-api, phase-5-design-system, phase-8-review, qa-phase, zero-script-qa, skill-status). 어느 스킬도 `background:` 미선언 → CC≥218에서 **실행 모드가 무통보로 백그라운드 전환**.

### 근거조사로 확정된 사실 (추측 아님)
1. **스케줄링 회귀(218 신규)**: `background: false`가 foreground 복원. **safe·backward-compat** (CC<218은 미지 키 무시, 218 boolean 파서가 견고 파싱). 엣지: `CLAUDE_CODE_FORK_SUBAGENT=1`이 `background:false` 무효화.
2. **AskUserQuestion×fork 봉인(218 이전부터, 별개)**: GitHub 이슈 **#19751·#34592·#46654·#54892**(gh 직접검증, #54892는 regression 재발·has-repro) — fork 스킬에서 AskUserQuestion·deferred-tool 봉인. `background:false`로 **해결 안 됨**.
3. **그러나 활성 파손 아님**: 9개 fork 스킬 전원 **본문에서 AskUserQuestion 실제 호출 0건**(grep). qa-phase는 allowed-tools에 선언만(미사용). → fork 봉인은 **dead declaration**(잠재), bkit의 실제 기능 파손 아님.
4. **bkit 오케스트레이터는 `context:fork`로 dispatch 안 함**(`lib/skill-orchestrator.js`가 `context` 미surface). 오직 `hooks/startup/context-init.js:149`(debug-log) + `enh-254` 가드만 읽음 → blast 낮음.

## 2. 목표

218 스케줄링 회귀를 **명시적 의도(No Guessing)**로 복원하고, 관련 위생 항목을 정리한다. 근본 아키텍처 재설계(fork 내 대화형)는 **범위 외**(사용자 확정 A+위생).

## 3. 범위 (사용자 확정: A+위생)

| ID | 항목 | 우선순위 | 근거 |
|----|------|:--:|------|
| T1 | 9개 fork 스킬에 `background: false` 명시 | P1 | 218 회귀 직접 대응, backward-safe |
| T2 | qa-phase allowed-tools에서 미사용·fork불가 `AskUserQuestion` 제거 + 금지 주석 | P2 | #46654/#54892 봉인, 미래 silent break 예방 |
| T3 | `lib/cc-regression/registry.js:93` "sole fork user" stale 주석 → 9스킬 반영 | P2 | 정확성 |
| T4 | `lib/infra/cc-version-checker.js:42` RECOMMENDED_VERSION '2.1.198'→'2.1.218' (MF-2 CRITICAL) | P2 | 20-release stale drift 해소 |
| T5 | 회귀 테스트: 9 fork 스킬 `background:false` 존재 assert + qa-phase allowed-tools 스냅샷 갱신 | P1 | 회귀 잠금 |
| T6 | 버전 bump 2.1.30→2.1.31 (11파일) + CHANGELOG | P1 | 릴리스 |
| T7 | Code=docs 동기화 (README, CUSTOMIZATION-GUIDE, AI-NATIVE-DEVELOPMENT, bkit.config.json, .claude-plugin/, hooks/, bkit-system/) | P1 | 요구사항 #8 |

**범위 외 (watch)**: fork 내 AskUserQuestion/interactive 아키텍처 재설계(옵션 B/C). 218 유발 아님, 활성 파손 아님. 향후 별도 사이클.

## 4. 리스크 & 완화

| 리스크 | 완화 |
|--------|------|
| `background:false`가 일부 스킬(zero-script-qa 라이브 로그)에서 원치 않는 동작 | 전 스킬 foreground가 218 이전 동작과 동일 — 회귀 없음이 안전한 기본. QA에서 실측 |
| contract 테스트 `invocation-inventory.test.js`(9 fork셋 deepStrictEqual) 파손 | `background:false`는 fork셋 불변 → green. qa-phase allowed-tools 변경은 baseline 스냅샷 갱신 필요 |
| CC<218 사용자 영향 | `background` 미지 키 무시 → 무영향 |
| 버전 bump 누락 | Explore가 11파일 전수 식별, SSoT=bkit.config.json |

## 5. 완료 기준 (DoD)

- [ ] 9개 스킬 `background: false` 존재, 회귀 테스트 green
- [ ] qa-phase AskUserQuestion 선언 정리 + 주석, baseline 갱신
- [ ] MF-2·registry·버전 bump 완료
- [ ] `--plugin-dir .` 전체 QA 통과, 전 contract/regression 테스트 green
- [ ] Code=docs 8표면 동기화 (0 drift)
- [ ] PR 사용자 승인 → merge + GitTag v2.1.31 + Release노트(영어)

## 6. 다음 단계
→ Phase 2 Design: 정확한 변경 스펙(파일별 diff 의도, 테스트 계획, docs-sync 계획) 작성.
