# bkit v2.0.9 — CC v2.1.94 호환성 + 25건 이슈 해결 계획

> **Status**: 📋 Plan Complete (Plan Plus)
> **Feature**: bkit-v209-cc-v2194-compatibility
> **Created**: 2026-04-08
> **PDCA Cycle**: #33
> **Method**: Plan Plus (의도 탐색 → 대안 비교 → YAGNI 검증)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | CC v2.1.94에서 plugin frontmatter hooks가 정상화되어 bkit의 hooks.json과 중복 실행 위험 발생. 동시에 전수 검증에서 25건의 frontmatter 무결성 이슈 발견. |
| **WHO** | bkit 사용자 전체 (CC v2.1.94 업그레이드 시 즉시 영향) |
| **RISK** | PDCA 상태 머신 이중 전환, audit 로그 중복, checkpoint 이중 생성 |
| **SUCCESS** | 25건 이슈 0건, CC v2.1.94 100% 호환, 59→60번째 연속 호환 릴리스 |
| **SCOPE** | 11 skills + 13 agents frontmatter + 3 config + 기타 6건 정비 |

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.94 plugin frontmatter hooks fix(#17688)로 bkit 24개 컴포넌트에서 Stop hook 중복 실행 위험. 추가로 전수 검증에서 잘못된 도구명, 비표준 필드, 누락 필드 등 25건 이슈 발견. |
| **해결 방법** | 방안 A(frontmatter hooks 제거) + frontmatter 표준화 일괄 정비 + config 버전 업데이트 |
| **기능/UX 효과** | CC v2.1.94 완전 호환, plugin 안정성 향상, 코드베이스 일관성 확보 |
| **핵심 가치** | 60번째 연속 호환 릴리스 달성 + 기술 부채 25건 청산 + 향후 CC 업그레이드 안전성 확보 |

---

## 1. Plan Plus 브레인스토밍

### 1.1 의도 탐색 (Intent Discovery)

**Q1: 이 작업에서 bkit이 얻을 수 있는 최대 가치는?**
- CC v2.1.94 완전 호환으로 CJK UTF-8 fix, plugin hooks 안정성, keep-coding-instructions 공식화 등 6건 자동 수혜를 안전하게 수령
- frontmatter 표준화로 향후 CC 업그레이드 시 regression 위험 최소화

**Q2: 놓치면 안 되는 critical change는?**
- ENH-188: frontmatter hooks 중복 실행 → PDCA 상태 머신 오작동 직접 위험
- unified-stop.js의 AGENT_HANDLERS/SKILL_HANDLERS가 deprecated이지만 여전히 active → 이 fallback이 유일한 라우팅 경로로 작동해야 함

**Q3: 기존 workaround를 대체할 수 있는 native 기능은?**
- GitHub #9354 workaround (unified-stop.js 중앙 라우팅)가 사실상 정식 아키텍처가 됨
- v2.1.94에서 frontmatter hooks가 정상 작동하지만, unified-stop.js의 v2.0.0 모듈 통합(상태 머신, 체크포인트, audit 등)이 더 풍부 → frontmatter hooks 제거가 올바른 방향

### 1.2 대안 비교 (Alternative Exploration)

#### ENH-188 해결: 3가지 방안

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A: frontmatter hooks 제거** | 11 skills + 13 agents에서 `hooks:` 블록 삭제 | 가장 안전, 기존 동작 유지, unified-stop.js의 v2.0.0 통합 보존 | frontmatter hooks 공식 기능 미활용 |
| **B: hooks.json Stop 제거** | hooks.json에서 Stop 핸들러 삭제, frontmatter hooks에 위임 | CC 공식 패턴 활용 | unified-stop.js의 10개 v2.0.0 모듈 통합(상태 머신, 체크포인트, audit, gate, 워크플로우, 서킷브레이커, 신뢰엔진, 설명생성, 메트릭, 결정추적) 누락 위험 |
| **C: 중복 감지 + 스킵** | unified-stop.js에 "이미 실행됨" 플래그 도입 | 양쪽 모두 유지 | 복잡도 증가, 경합 조건 위험, YAGNI |

**선택: 방안 A** — unified-stop.js가 10개 v2.0.0 모듈을 통합하고 있어, 이를 frontmatter hooks로 분산하는 것은 아키텍처 퇴보. 중앙 라우팅이 bkit의 설계 의도.

#### PDCA eval agents: 2가지 방안

| 방안 | 설명 |
|------|------|
| **A: Write 제거 + Edit 추가** | 평가 보고서를 Write가 아닌 Edit으로 기존 파일에 추가 (Read/Glob/Grep/Edit) |
| **B: Write 유지 + permissionMode: plan 추가** | Write를 명시하되 plan 모드로 제한 |

**선택: 방안 B** — eval agents는 평가 보고서 `.bkit/state/` 파일을 Write하므로 Write 도구가 필요. `permissionMode: plan`으로 안전성 확보. (참고: CC의 plan permissionMode는 Write를 차단하지 않고 사용자 확인을 요구하므로, 실질적으로 "확인 후 쓰기" 패턴이 됨)

### 1.3 YAGNI 검증

| # | 이슈 | YAGNI 판정 | 근거 |
|---|------|-----------|------|
| C-1 | frontmatter hooks 제거 | ✅ PASS | 중복 실행은 실제 버그. 즉시 해결 필수 |
| C-2 | deploy frontmatter 재작성 | ✅ PASS | 유일한 비표준 스킬. 자동화 도구가 파싱 실패 가능 |
| C-3 | TodoWrite 제거 | ✅ PASS | 존재하지 않는 도구. CC가 에러 출력 |
| C-4 | LSP 도구 검증 | ⚠️ 보류 | LSP는 CC의 deferred tool로 실제 존재할 수 있음. 에이전트 분석 결과 대기 |
| I-1 | self-healing 비표준 필드 | ✅ PASS | reasoningEffort 무시됨, permissionMode: code 미정의 값 |
| I-2 | eval agents permissionMode | ✅ PASS | 6개 동일 패턴, 일괄 수정 가능 |
| I-3 | agent prefix (claude-code-learning) | ⚠️ 보류 | bkit: prefix가 필수인지 에이전트 분석 결과 대기 |
| I-4~12 | 기타 Important/Warn | ✅ PASS | 일관성 개선, 낮은 비용 |
| Info-1 | $schema 미존재 | ❌ SKIP | 스키마 파일 생성은 과도. $schema 필드 제거로 충분 |
| Info-2 | engines 버전 | ✅ PASS | 단순 문자열 변경 |

---

## 2. 이슈 목록 (25건)

### 2.1 Critical (4건)

| # | ID | 대상 | 이슈 | 수정 방안 |
|---|-----|------|------|----------|
| 1 | C-1 | 11 skills + 13 agents | **ENH-188: frontmatter hooks 중복 실행** | frontmatter `hooks:` 블록 제거 |
| 2 | C-2 | `skills/deploy/SKILL.md` | 비표준 frontmatter (14개 필드 변경) | 전체 재작성 |
| 3 | C-3 | `skills/development-pipeline/SKILL.md` | `TodoWrite` 잘못된 도구명 | 제거 |
| 4 | C-4 | `skills/code-review/SKILL.md`, `skills/phase-8-review/SKILL.md` | `LSP` 도구 유효성 | 검증 후 판단 (CC deferred tool 가능) |

### 2.2 Important (13건)

| # | ID | 대상 | 이슈 | 수정 방안 |
|---|-----|------|------|----------|
| 5 | I-1 | `agents/self-healing.md` | `reasoningEffort`, `permissionMode: code`, `triggers:` 비표준 | 3개 필드 수정 |
| 6 | I-2a | `agents/pdca-eval-act.md` | permissionMode 누락 + Write 도구 | `permissionMode: plan` 추가 |
| 7 | I-2b | `agents/pdca-eval-check.md` | 위와 동일 | 위와 동일 |
| 8 | I-2c~f | `agents/pdca-eval-design/do/plan/pm.md` | 위와 동일 (4건) | 위와 동일 |
| 9 | I-3 | `skills/claude-code-learning/SKILL.md` | agent prefix `bkit:` 누락 | 패턴 확인 후 수정 |
| 10 | I-4 | `skills/cc-version-analysis/SKILL.md` | null agent 엔트리 | 제거 |
| 11 | I-5~8 | `skills/phase-4/5/7/9` | `user-invocable` 필드 누락 | `user-invocable: false` 추가 |
| 12 | I-9~11 | `agents/pm-discovery/research/strategy` | `disallowedTools` 중복 Write | 제거 (이미 tools에 없음) |
| 13 | I-12 | `skills/bkit-rules/SKILL.md` | `allowed-tools` 누락 | 추가 |
| 14 | I-13 | `skills/bkit-templates/SKILL.md` | `allowed-tools` 누락 | 추가 |

### 2.3 Warn (6건)

| # | ID | 대상 | 이슈 | 수정 방안 |
|---|-----|------|------|----------|
| 15 | W-1 | `agents/code-analyzer.md` | bare `Task` (무제한 위임) | 의도 확인 → `Task(Explore)` 명시화 또는 주석 |
| 16 | W-2 | `agents/infra-architect.md` | bare `Task` | 위와 동일 |
| 17 | W-3~5 | PM agents disallowedTools | 중복 제거 | cosmetic 정리 |
| 18 | W-6 | `agents/self-healing.md` | triggers 비표준 위치 | description으로 이동 (I-1과 통합) |

### 2.4 Info (2건)

| # | ID | 대상 | 이슈 | 수정 방안 |
|---|-----|------|------|----------|
| 19 | Info-1 | `bkit.config.json` | `$schema` 참조 파일 미존재 | `$schema` 필드 제거 |
| 20 | Info-2 | `plugin.json` | `engines.claude-code` 버전 | `>=2.1.78` → `>=2.1.94` |

### 2.5 추가 정비 (ENH-187 포함)

| # | ID | 대상 | 이슈 | 수정 방안 |
|---|-----|------|------|----------|
| 21 | ENH-187 | `scripts/user-prompt-handler.js` | sessionTitle 미활용 | PDCA feature명 기반 자동 세션 명명 (~5줄) |
| 22 | VER-1 | `plugin.json` version | v2.0.8 → v2.0.9 | 버전 범프 |
| 23 | VER-2 | `bkit.config.json` version | v2.0.8 → v2.0.9 | 버전 범프 |
| 24 | VER-3 | `hooks/hooks.json` description | v2.0.8 → v2.0.9 | 버전 범프 |
| 25 | VER-4 | `marketplace.json` version | v2.0.8 → v2.0.9 | 버전 범프 |

---

## 3. 파일 영향 매트릭스

| 디렉토리 | 수정 파일 수 | 주요 변경 |
|----------|-------------|----------|
| **skills/** | 15 | frontmatter hooks 제거(11) + deploy 재작성(1) + 도구/필드 수정(3) |
| **agents/** | 20 | frontmatter hooks 제거(13) + permissionMode 추가(6) + self-healing 수정(1) |
| **scripts/** | 1 | user-prompt-handler.js sessionTitle 추가 |
| **config** | 4 | plugin.json, bkit.config.json, hooks.json, marketplace.json 버전 |
| **합계** | **~40 files** | |

---

## 4. 실행 계획

### Session 1: Critical 수정 (C-1 ~ C-4)
- frontmatter hooks 제거 (24 files)
- deploy SKILL.md 재작성 (1 file)
- TodoWrite 제거 (1 file)
- LSP 검증 결과 반영 (2 files)

### Session 2: Important + Warn 수정 (I-1 ~ W-6)
- self-healing agent 수정 (1 file)
- pdca-eval 6 agents permissionMode 추가 (6 files)
- 기타 Important 수정 (7 files)
- Warn 수정 (3 files)

### Session 3: Config + Version + ENH-187
- plugin.json, bkit.config.json, hooks.json 버전 범프
- sessionTitle 기능 추가
- 최종 검증

---

## 5. 성공 기준

| 메트릭 | 목표 |
|--------|------|
| Critical 이슈 | 4/4 → 0 |
| Important 이슈 | 13/13 → 0 |
| Warn 이슈 | 6/6 → 0 |
| Info 이슈 | 2/2 → 0 |
| CC v2.1.94 호환 | 100% |
| 연속 호환 릴리스 | 60개 (v2.1.34~v2.1.94) |
| frontmatter 표준 준수율 | 100% (37 skills + 32 agents) |

---

## 6. 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| frontmatter hooks 제거 시 일부 스킬 Stop 미감지 | HIGH | unified-stop.js SKILL_HANDLERS에 모든 11 skills 등록 확인 (이미 완료) |
| deploy frontmatter 재작성 시 기능 변경 | MEDIUM | body(마크다운) 부분은 변경하지 않음, frontmatter만 수정 |
| LSP가 실제 유효한 CC 도구일 수 있음 | MEDIUM | CC deferred tools 목록에서 LSP 존재 여부 최종 확인 |
| pdca-eval agents에 permissionMode 추가 시 동작 변경 | LOW | plan 모드는 Write를 차단하지 않고 확인만 요구 |

---

## 7. 참고 문서

- [CC v2.1.94 영향 분석](../04-report/features/cc-v2193-v2194-impact-analysis.report.md)
- [RTK×bkit 고도화 분석](../04-report/features/rtk-inspired-bkit-enhancement-analysis.report.md)
- [bkit 아키텍처 분석 (2026-03-29)](../../memory/bkit_architecture_analysis_20260329.md)
- unified-stop.js 라우팅 분석 (AGENT_HANDLERS 7개 + SKILL_HANDLERS 12개, v2.0.0 모듈 10개)
