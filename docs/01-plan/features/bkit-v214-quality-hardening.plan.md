# bkit v2.1.4 Quality Hardening — Plan

**Feature**: `bkit-v214-quality-hardening`
**버전**: 2.1.3 → 2.1.4
**작성일**: 2026-04-13
**목표**: Root Cause → Fix → Prevent 3단계 접근으로 반복 이슈 패턴 근절 + ENH P0~P1 12건 소화 + CC v2.1.104 호환
**방법**: Plan Plus (Brainstorming-Enhanced PDCA)
**상태**: Draft

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | bkit v2.1.1~v2.1.3에서 배포 후 반복적으로 GitHub 이슈 발생 (#65, #66, #67, #71). /pdca qa로 QA 수행에도 불구하고 dead code 참조, 하드코딩 vs config 불일치, 불완전 구현, shell escaping 등 구조적 패턴 이슈를 놓침. CC v2.1.99~v2.1.104에서 107건 변경, context:fork/agent frontmatter 수정 등 bkit 직접 영향 3건 |
| **해결 방법** | Root Cause → Fix → Prevent 3단계 접근. 이슈 패턴 분류(4개) → 패턴별 자동 스캐너 개발 → QA 프로세스에 내재화. ENH P0~P1 12건 소화 + CC v2.1.104 호환 업데이트 |
| **기능/UX 효과** | 배포 전 구조적 결함 자동 탐지, 이슈 재발률 80% 감소 목표, CC 66개 연속 호환 유지 |
| **핵심 가치** | QA 프로세스 근본 개선으로 "테스트했는데 이슈 나옴" 문제 해결. 패턴 스캐너가 사람이 놓치는 구조적 문제를 자동 포착 |

---

## 1. 프로젝트 개요

| 항목 | 내용 |
|------|------|
| Feature 이름 | bkit-v214-quality-hardening |
| 타깃 버전 | bkit v2.1.4 |
| 이전 버전 | bkit v2.1.3 |
| CC 호환 범위 | v2.1.34~v2.1.104 (66개 연속 호환) |
| CC 권장 버전 | v2.1.104+ |

---

## 2. 배경 및 동기

### 2.1 이슈 발생 히스토리

| Issue | Version | 패턴 | 설명 | QA가 놓친 이유 |
|-------|---------|------|------|--------------|
| #71 | v2.1.3 | Shell escaping | awk $1이 CC 스킬 엔진 $N 치환과 충돌 | QA에서 shell block 내부 변수 치환 검증 미포함 |
| #67 | v2.1.1 | Hardcoded vs config | MCP bkit_report_read가 bkit.config.json의 docPaths 무시, PHASE_MAP 하드코딩 | config 연동 검증 미포함 |
| #66 | v2.1.1 | Dead code/stale ref | permission-manager.js가 삭제된 context-hierarchy.js, common.js 참조 | dead code 스캔 미실행 |
| #65 | v2.1.1 | Incomplete impl | /pdca qa subcommand 지원 불완전 (3개 파일 누락) | 기능 완전성 검증 미포함 |
| #53 | v2.0.x | Shell escaping | Windows username에 괄호 포함 시 hook command 실패 | cross-platform 검증 미포함 |
| #48 | v2.0.1 | Stale ref/isolation | globalCache가 프로젝트별 미격리 | 상태 격리 검증 미포함 |

### 2.2 근본 원인 분석

현재 /pdca qa의 한계:
1. **기능 테스트 중심** — 구조적 정합성(dead code, stale ref) 검증 부재
2. **Happy path 중심** — shell escaping, cross-platform edge case 미검증
3. **수동 체크리스트** — 패턴 기반 자동 스캔 부재
4. **config 연동 미검증** — bkit.config.json과 실제 코드의 일치성 미확인

### 2.3 CC v2.1.99~v2.1.104 변경 영향

| 항목 | 내용 |
|------|------|
| 총 변경 | ~107건 (3개 릴리스) |
| CC Tools | 30 → 32 (ScheduleWakeup, Snooze SP전용) |
| SP 토큰 | +3,839 tokens |
| Breaking | 0건 |
| bkit 직접 영향 | 3건 (context:fork fix, subagent MCP 상속, settings.json 복원력) |

---

## 3. User Intent Discovery (Plan Plus Phase 1)

| 항목 | 사용자 응답 |
|------|-----------|
| 핵심 목표 | Open Issues 대응 우선 + 종합 품질 개선 |
| 핵심 pain point | /pdca qa를 해도 이슈가 계속 발생 — QA 프로세스 자체의 실효성 문제 |
| 성공 기준 | Issues 0건 + 테스트 커버리지 강화 + QA 프로세스 개선 종합 |
| 접근 방식 | Root Cause → Fix → Prevent (패턴별 근본 해결) |

---

## 4. Alternatives Explored (Plan Plus Phase 2)

### Approach A: Root Cause → Fix → Prevent ✅ 선택

| 관점 | 상세 |
|------|------|
| **요약** | 이슈 패턴 분류 → 패턴별 자동 스캐너 개발 → QA 프로세스 내재화 |
| **장점** | 근본 원인 해결, 재발 방지, QA 프로세스 개선 |
| **단점** | 스캐너 개발 시간 필요 |
| **적합** | 반복적 이슈 패턴이 명확한 경우 |

### Approach B: Test-First Defensive

| 관점 | 상세 |
|------|------|
| **요약** | 테스트 커버리지를 먼저 35%→70%로 올린 후 이슈 수정 |
| **장점** | 미래 이슈 예방 효과 높음 |
| **단점** | 시간 많이 소요, 즉시 이슈 해결 지연 |
| **적합** | 신규 프로젝트 |

### Approach C: Incremental Hardening

| 관점 | 상세 |
|------|------|
| **요약** | 개별 이슈만 빠르게 패치 후 배포 |
| **장점** | 빠른 배포 |
| **단점** | 근본 문제 미해결, 이슈 재발 가능 |
| **적합** | 긴급 패치 |

### 결정 근거

**선택**: Approach A (Root Cause → Fix → Prevent)
**이유**: v2.1.1~v2.1.3에서 3회 연속 이슈 발생. 패턴이 명확(4개 유형)하므로 자동 스캐너로 근본 해결이 최적. Approach C는 v2.1.3에서 이미 시도했으나 #71 재발. Approach B는 커버리지 확대가 선행되어야 하므로 v2.1.5로 분리.

---

## 5. 작업 구조 (Work Streams)

### WS1: Issue Fix & ENH 소화 (Priority 1)

#### 5.1.1 Open Issue 수정

| Task | 설명 | 파일 | 예상 작업량 |
|------|------|------|-----------|
| T1-01 | #71 awk $1 shell escaping fix — PDCA 스킬 shell 블록에서 $N 치환 충돌 방지. CC 스킬 엔진이 $1, $2 등을 인자로 치환하므로, awk 내 $N을 이스케이프 처리 필요 | skills/pdca/SKILL.md 등 | 2h |

#### 5.1.2 ENH P0 소화

| Task | ENH | 설명 | 파일 영향 | 예상 작업량 |
|------|-----|------|----------|-----------|
| T1-02 | ENH-134 | Skills effort frontmatter 추가 — 모든 skill에 `effort:` frontmatter 추가. v2.1.80에서 CC가 지원 시작했으나 bkit 미적용 | 37 skills/*/SKILL.md | 3h |
| T1-03 | ENH-193 | MCP _meta key 방어적 수정 — v2.1.2에서 완료 확인 | ✅ 검증만 | 0h |

#### 5.1.3 ENH P1 소화

| Task | ENH | 설명 | 파일 영향 | 예상 작업량 |
|------|-----|------|----------|-----------|
| T1-04 | ENH-196 | context:fork + agent frontmatter 정상화 검증 — v2.1.101에서 CC가 plugin skills context:fork 미적용 버그 수정. zero-script-qa가 fork+agent 사용 중이므로 정상 작동 검증 | skills/zero-script-qa/ | 1h |
| T1-05 | ENH-138 | --bare CI/CD 가이드 문서화 — CC --bare 플래그를 활용한 CI/CD 파이프라인 가이드 작성. PreToolUse hooks -p 모드 미작동(#40506) 제약 문서화 포함 | docs/, context-engineering.md | 2h |
| T1-06 | ENH-139+142 | Plugin freshness 배포 전략 — plugin freshness re-clone 메커니즘 문서화 + 배포 시 버전 태깅 전략 | docs/, .claude-plugin/ | 2h |
| T1-07 | ENH-143 | 병렬 agent spawn 지연 workaround — #37520 병렬 agent OAuth 401 workaround 구현. 순차 spawn + 지연 전략 문서화 | lib/agent-*, docs/ | 3h |
| T1-08 | ENH-148 | SessionStart env /clear 방어 — #37729 SessionStart hook에서 환경 변수가 /clear 후에도 정리되지 않는 문제 방어 로직 | hooks/session-start-handler.js | 2h |
| T1-09 | ENH-149 | CwdChanged hook 구현 — v2.1.83에서 추가된 CwdChanged hook event 활용. 프로젝트 전환 시 PDCA 상태 자동 전환 | hooks/, settings.json | 3h |
| T1-10 | ENH-151 | self-healing agent effort/maxTurns 보완 — self-healing agent에 effort/maxTurns frontmatter 추가 (일관성) | agents/self-healing.md | 1h |
| T1-11 | ENH-156 | TaskCreated hook 구현 — v2.1.84에서 추가된 TaskCreated hook event 활용. PDCA Task 생성 추적 + audit 로그 | hooks/, settings.json | 2h |
| T1-12 | ENH-176 | MCP _meta maxResultSizeChars 500K — 2개 MCP 서버(bkit-pdca, bkit-analysis)의 okResponse에 maxResultSizeChars: 500000 설정. v2.1.91에서 CC가 MCP _meta 지원 시작 | mcp-servers/ | 2h |
| T1-13 | ENH-188 | Plugin frontmatter hooks 정상화 검증 — v2.1.94 #17688 fix 이후 plugin frontmatter hooks가 정상 동작하는지 검증. 11 skills + 13 agents 중복 실행 여부 확인 | agents/*.md, skills/*/SKILL.md | 2h |

### WS2: Pattern Scanners 개발 (Priority 2)

#### 5.2.1 Dead Code Scanner

| 항목 | 내용 |
|------|------|
| 파일 | scripts/qa/dead-code-scanner.sh |
| 목적 | stale require/import, 삭제된 파일 참조, 미사용 exports 탐지 |
| 검증 대상 | lib/ 88모듈, hooks/ 21이벤트, scripts/ 57개 |
| 예방 이슈 | #66 (삭제된 파일 참조) |
| 예상 작업량 | 4h |
| 구현 방식 | require/import 문의 대상 파일 존재 확인, exports된 함수/변수의 사용처 확인, agent/skill 정의에서 참조하는 lib 모듈 존재 확인 |

#### 5.2.2 Config Audit Scanner

| 항목 | 내용 |
|------|------|
| 파일 | scripts/qa/config-audit.sh |
| 목적 | bkit.config.json, plugin.json과 실제 코드의 불일치 탐지 |
| 검증 대상 | bkit.config.json의 모든 설정 키 vs 코드 내 참조 |
| 예방 이슈 | #67 (hardcoded PHASE_MAP) |
| 예상 작업량 | 3h |
| 구현 방식 | config에 선언된 경로/값이 코드에서 실제 사용되는지 확인, 코드 내 하드코딩된 값이 config에 선언된 값과 일치하는지 확인, Docs=Code 철학 위반 탐지 |

#### 5.2.3 Completeness Checker

| 항목 | 내용 |
|------|------|
| 파일 | scripts/qa/completeness-checker.sh |
| 목적 | SKILL.md/agent.md 선언과 실제 구현의 갭 탐지 |
| 검증 대상 | 37 skills, 32 agents |
| 예방 이슈 | #65 (qa subcommand 불완전) |
| 예상 작업량 | 3h |
| 구현 방식 | skill이 참조하는 agent 존재 확인, skill이 사용하는 tools이 CC에서 지원되는지 확인, subcommand 선언과 실제 핸들러 매핑 확인, frontmatter 필드 일관성 검증 |

#### 5.2.4 Shell Escape Validator

| 항목 | 내용 |
|------|------|
| 파일 | scripts/qa/shell-escape-validator.sh |
| 목적 | SKILL.md shell 블록 내 CC 스킬 엔진 $N 치환 충돌 탐지 |
| 검증 대상 | 37 skills의 shell 블록 (```! 블록) |
| 예방 이슈 | #71 (awk $1 충돌), #53 (Windows 괄호) |
| 예상 작업량 | 3h |
| 구현 방식 | shell 블록 내 $1~$9, $N 패턴 스캔, backtick 사용 검증, Windows 호환성 위험 패턴 (괄호, 공백) 탐지, heredoc 내 변수 치환 위험 경고 |

#### 5.2.5 QA 프로세스 내재화

| 항목 | 내용 |
|------|------|
| 통합 파일 | scripts/qa/pre-release-check.sh |
| 목적 | 4개 스캐너를 통합 실행하고 결과 보고 |
| /pdca qa 연동 | qa-phase skill에서 pre-release-check.sh 자동 호출 |
| pre-commit 연동 | 선택적 — 커밋 시 빠른 스캔 (dead-code만) |
| 예상 작업량 | 2h |

### WS3: CC v2.1.104 Compat Update (Priority 3)

| Task | 설명 | 파일 | 예상 작업량 |
|------|------|------|-----------|
| T3-01 | CC 권장 버전 v2.1.104+ 업데이트 | bkit.config.json, plugin.json, docs/ | 1h |
| T3-02 | CC tools 30→32 문서 반영 | docs/, MEMORY.md | 0.5h |
| T3-03 | ENH-197~200 문서/모니터링 반영 | docs/ | 1h |
| T3-04 | version string v2.1.4 업데이트 | package.json, bkit.config.json 등 | 0.5h |

---

## 6. YAGNI Review (Plan Plus Phase 3)

### 6.1 포함 (v2.1.4 Must-Have)

- [x] #71 fix — open issue, 즉시 수정 필요
- [x] ENH P0 2건 — core 품질
- [x] ENH P1 10건 — 중요 기능/안정성
- [x] 패턴 스캐너 4건 — QA 근본 개선
- [x] CC v2.1.104 호환 — 문서 업데이트

### 6.2 연기 (v2.1.5+)

| 기능 | 연기 이유 | 재검토 시점 |
|------|----------|------------|
| ENH P2 9건 (ENH-141, 150, 167, 177, 187, 191, 197, 200 등) | 즉각 영향 낮음 | v2.1.5 |
| TC 35%→70% 커버리지 확대 | 별도 작업 규모 | v2.1.5 |
| bkit v3.0.0 Clean Architecture 리팩토링 | 메이저 릴리스 | v3.0.0 |
| RTK 사상 차용 ENH-R 시리즈 | 연구 단계 | v2.2.0+ |

### 6.3 제거 (YAGNI FAIL)

| 기능 | 제거 이유 |
|------|----------|
| ScheduleWakeup/Snooze bkit 활용 | bkit /loop 미사용, CC SP 전용 도구 |
| Sleep >=2s 대응 | bkit에 해당 코드 없음 |
| ENH-155 Agent initialPrompt | YAGNI FAIL (이전 판정 유지) |
| ENH-146 Programmatic Model Discovery | YAGNI FAIL (이전 판정 유지) |

---

## 7. GitHub Open Issues 대응 전략

### 7.1 bkit 직접 영향 (workaround 필요)

| Issue | 상태 | 영향 | v2.1.4 대응 |
|-------|------|------|------------|
| #29423 | OPEN (stale) | task subagents ignore CLAUDE.md | CTO Team workaround 유지, 문서화 |
| #34197 | OPEN | CLAUDE.md ignored | 모니터링 지속, bkit 핵심 의존성 |
| #37520 | OPEN (stale) | 병렬 agent OAuth 401 | ENH-143 workaround 구현 |
| #40502 | OPEN | bg agents write 불가 | bypassPermissions workaround 문서화 |
| #40506 | OPEN | PreToolUse hooks -p 모드 미작동 | ENH-138 문서에 제약사항 포함 |
| #41930 | OPEN | 비정상 사용량 소진 | 모니터링, bkit 범위 밖 |

### 7.2 bkit 이슈 (#71)

| Issue | 원인 | 수정 방안 | 검증 |
|-------|------|----------|------|
| #71 | CC 스킬 엔진이 shell 블록 내 $1을 인자로 치환 | awk 내 $N을 이스케이프 또는 다른 구문 사용 | shell-escape-validator 스캐너로 검증 |

---

## 8. 실행 계획

### 8.1 Phase 순서

| Phase | Work Stream | 예상 시간 | 산출물 |
|-------|-------------|----------|--------|
| 1 | WS1: #71 fix | 2h | PR |
| 2 | WS1: ENH P0 (T1-02, T1-03) | 3h | PR |
| 3 | WS1: ENH P1 (T1-04~T1-13) | 20h | PR(s) |
| 4 | WS2: Scanners (4개) + 통합 | 15h | scripts/qa/ |
| 5 | WS2: QA 프로세스 내재화 | 2h | qa-phase skill 수정 |
| 6 | WS3: CC v2.1.104 compat | 3h | docs/ 업데이트 |
| 7 | 자체 QA (스캐너 실행 + /pdca qa) | 3h | QA 보고서 |
| 8 | 릴리스 | 1h | v2.1.4 tag + PR |
| **총계** | | **~49h** | |

### 8.2 의존성

```
WS1-#71 fix → 독립 (즉시 시작 가능)
WS1-ENH P0 → 독립
WS1-ENH P1 → 일부 검증 항목은 CC v2.1.104 필요
WS2-Scanners → WS1 이슈 패턴 분석 완료 후
WS2-QA 내재화 → WS2 Scanners 완료 후
WS3-Compat → 독립
자체 QA → WS1 + WS2 + WS3 모두 완료 후
릴리스 → 자체 QA 통과 후
```

---

## 9. 리스크 및 완화

| 리스크 | 확률 | 영향 | 완화 전략 |
|--------|------|------|----------|
| ENH P1 범위 초과 | HIGH | 일정 지연 | 각 ENH를 개별 PR로 분리, 일부 P1을 v2.1.5로 강등 |
| 스캐너 false positive | MEDIUM | 노이즈 | 초기 버전은 경고만 표시, 차단은 v2.1.5 |
| CC #37520 미해결 | HIGH | CTO Team 제약 | ENH-143 순차 spawn workaround |
| 검증 항목 실패 | LOW | 추가 작업 | ENH-196/188은 검증만이므로 실패 시 문서화 |

---

## 10. 성공 기준 (Definition of Done)

| 기준 | 측정 방법 |
|------|----------|
| #71 해결 | GitHub issue 종료 + 회귀 테스트 |
| ENH P0 2건 완료 | 코드 리뷰 + 검증 |
| ENH P1 10건 완료/검증 | 코드 리뷰 + 검증 보고서 |
| 스캐너 4개 동작 | scripts/qa/ 실행 성공 + 결과 보고 |
| pre-release-check.sh 통합 | /pdca qa에서 자동 호출 확인 |
| CC v2.1.104 호환 확인 | 66개 연속 호환 유지 |
| 자체 QA 통과 | 스캐너 0건 critical + /pdca qa 통과 |
| 배포 후 1주 이슈 0건 | GitHub issues 모니터링 |

---

## 비-요구사항 (Out of Scope)

- TC 35%→70% 테스트 커버리지 확대 — v2.1.5 별도 릴리스
- bkit v3.0.0 Clean Architecture 전면 리팩토링
- ENH P2 이하 개선 항목 (ENH-141, 150, 167, 177, 187, 191 등)
- Enterprise 전용 기능 (PreToolUse defer headless Q&A)
- Auto Mode Research Preview 대응 (GA 대기)
- RTK 사상 차용 ENH-R 시리즈

---

## Verification Strategy

- **Phase Do**: 각 수정 직후 단위 검증 (Node one-liner, shell 실행)
- **Phase QA (L1)**: #71 재현 시나리오 역검증 + 패턴 스캐너 자체 검증
- **Phase QA (L2)**: Jest 전체 + 스캐너 4개 통합 실행
- **Phase QA (L3)**: `claude -p` smoke — plugin load + skill invocation + 스캐너 0건 critical
- **Phase QA (L4)**: pre-release-check.sh 통합 실행 → 결과 보고서 생성

---

## Brainstorming Log (Plan Plus Phase 4)

| Phase | 결정 | 근거 |
|-------|------|------|
| Phase 1 (Intent) | Open Issues 대응 + 종합 품질 | QA 해도 이슈 반복 → 근본 원인 해결 필요 |
| Phase 2 (Alternatives) | Root Cause → Fix → Prevent | 패턴 분석 → 자동화 → 내재화가 가장 지속 가능 |
| Phase 3 (YAGNI) | 전체 범위 포함 | P0+P1 소화 + 스캐너 + CC compat 종합 릴리스 |
| Phase 4 (Design) | 3 Work Stream 구조 | 의존성 최소화, 순차 실행 가능 |

---

## Next Steps

1. [ ] Plan 승인 후 Design 문서 작성 (`/pdca design bkit-v214-quality-hardening`)
2. [ ] WS1 #71 fix 즉시 착수 (독립)
3. [ ] WS1 ENH P0~P1 순차 실행 (`/pdca do`)
4. [ ] WS2 Scanners 개발 + QA 내재화
5. [ ] WS3 CC v2.1.104 호환 업데이트
6. [ ] 자체 QA → Report (`/pdca report`)

---

## Meta

- **생성 방법**: Plan Plus (Brainstorming-Enhanced PDCA Planning)
- **PDCA Phase**: Plan
- **Feature**: bkit-v214-quality-hardening
- **다음 단계**: `/pdca design bkit-v214-quality-hardening`

---

## Version History

| 버전 | 날짜 | 변경 | 작성자 |
|------|------|------|--------|
| 0.1 | 2026-04-13 | Initial draft (Plan Plus) | Claude Opus 4.6 |
