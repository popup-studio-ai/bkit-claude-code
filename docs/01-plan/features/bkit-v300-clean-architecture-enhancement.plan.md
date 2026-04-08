# bkit v3.0.0 — 클린아키텍처 + 기능완성도 + CC호환성 고도화 계획

> **Status**: 📋 Plan Complete (Plan Plus)
> **Feature**: bkit-v300-clean-architecture-enhancement
> **Created**: 2026-04-08
> **Method**: Plan Plus (10-Agent Team 병렬 분석 → 의도 탐색 → 대안 비교 → YAGNI 검증)
> **Agent Team**: 10 agents (CC외부 4 + bkit내부 6)

---

## Context Anchor

| 항목 | 내용 |
|------|------|
| **WHY** | bkit lib/의 51%가 Dead Code, 3개 핵심 기능(Living Context, L0-L4 Write, Rollback)이 코드는 완성되어있지만 통합 0건, 테스트 행동 검증 35%, CC Plugin 기능 GAP 23건 |
| **WHO** | bkit 모든 사용자 + 플러그인 기여자 |
| **RISK** | Dead Code 유지비용, PARTIAL 기능이 사용자 혼란 유발, CC 기능 미활용으로 경쟁력 저하 |
| **SUCCESS** | Dead Code 51%→0%, PARTIAL→FULLY_IMPLEMENTED 3건, CC GAP P0/P1 13건 해결, 테스트 행동 검증 35%→70% |
| **SCOPE** | 아키텍처 정비 + 기능 통합 + CC 호환 강화 + 테스트 고도화 |
| **CC Version** | v2.1.96+ (v2.1.95 스킵, v2.1.96 = Bedrock 핫픽스, bkit 무관) — 61번째 연속 호환. v2.1.94 SP +2,000 tokens 확인 (Piebald-AI). 스킵 버전 누적 3개(v2.1.82/93/95) |

---

## Executive Summary

| 관점 | 내용 |
|------|------|
| **문제** | 10개 에이전트 심층 분석 결과: (1) lib/ 51% dead code(11,617 LOC), (2) 3대 기능 코드 완성-통합 0건, (3) CC plugin 기능 활용률 58%, (4) 테스트 행동 검증 35% |
| **해결 방법** | 3-Phase 접근: Dead Code 정리 → 미통합 기능 와이어링 → CC 기능 GAP 해소 + 테스트 고도화 |
| **기능/UX 효과** | 코드베이스 절반 정리(-11K LOC), 3대 기능 활성화(Living Context, Rollback, L0-L4 제어), CC 최신 기능 활용, 테스트 신뢰도 2배 |
| **핵심 가치** | bkit v3.0 — **진짜 작동하는 코드만 남기고, 선언된 모든 기능이 실제로 작동하는 상태** 달성 |

---

## 1. Plan Plus 브레인스토밍

### 1.1 의도 탐색 (Intent Discovery)

**Q1: 이 작업에서 bkit이 얻을 수 있는 최대 가치는?**
- "기능이 있다"에서 "기능이 작동한다"로의 전환. 현재 bkit은 구조적으로는 인상적이지만(37 Skills, 32 Agents, 92 Lib Modules), 실제 작동하는 부분은 그 절반.
- Dead Code 제거만으로 유지보수 부담 50% 감소, 신규 기여자 온보딩 시간 단축.
- CC Plugin 기능 GAP 해소로 Skill paths, $ARGUMENTS, prompt hooks 등 차세대 기능 활성화.

**Q2: 놓치면 안 되는 critical change는?**
- **lib/context/ 7모듈 전체 Dead**: Self-Healing이 bkit의 핵심 차별점 중 하나인데, 코드만 있고 한 번도 호출된 적 없음.
- **lib/team/ 9모듈 전체 Dead**: Agent Teams 기능이 bkit-system에서 대대적으로 홍보되지만, lib/team의 실제 함수들이 호출되지 않음.
- **Rollback 호출 0건 + 버그**: `deleteCheckpoint()`에 `getCheckpointDir()` undefined 버그 → 실행 시 crash.

**Q3: 기존 workaround를 대체할 수 있는 native 기능은?**
- CC v2.1.94의 `type: "prompt"` hook → bkit의 코드 품질 검증을 LLM에게 위임 가능 (현재 regex 기반)
- CC의 `$ARGUMENTS` + `!`command` ` → bkit Skills의 동적 컨텍스트 주입 (현재 정적 프롬프트)
- CC의 `paths` glob → 불필요한 Skill 로딩 방지 (현재 description-only 매칭)

### 1.2 대안 비교

#### Dead Code 처리: 3가지 방안

| 방안 | 설명 | 장점 | 단점 |
|------|------|------|------|
| **A: 전체 삭제** | 45 dead modules 즉시 삭제 | 깔끔, -11,617 LOC | 향후 필요 시 재작성 필요 |
| **B: archive 이동** | `lib/_archived/`로 이동 | 참조 가능, git history 유지 | 코드베이스에 여전히 존재 |
| **C: 선별적 와이어링** | Dead 중 가치 있는 것만 통합, 나머지 삭제 | 기능 활성화 + 정리 동시 | 복잡, 긴 시간 |

**선택: 방안 C** — context/(Living Context)와 control/(L0-L4 Write, Rollback)은 가치 있으므로 와이어링. team/은 hooks에서 이미 직접 호출하므로 lib/team 삭제 가능. 나머지 pure dead code는 삭제.

#### 테스트 고도화: 2가지 방안

| 방안 | 설명 |
|------|------|
| **A: Jest 마이그레이션** | 전체 테스트를 Jest로 전환, 스냅샷 테스트 도입 |
| **B: 기존 프레임워크에 행동 테스트 추가** | 현재 custom assert 유지, 행동 테스트만 추가 |

**선택: 방안 B** — Jest 마이그레이션은 거대한 작업. 기존 프레임워크에 행동 테스트(Hook I/O, PDCA 전환, MCP 응답)를 추가하는 것이 ROI 최고.

### 1.3 YAGNI 검증

| # | 후보 | YAGNI 판정 | 근거 |
|---|------|-----------|------|
| 1 | Dead Code 삭제 | ✅ PASS | 유지비용 > 재작성 비용. 51% dead는 기술부채 |
| 2 | Living Context 와이어링 | ✅ PASS | 자가치유는 핵심 차별점. 코드 완성 → 와이어링만 |
| 3 | Rollback 와이어링 | ✅ PASS | Checkpoint 생성은 이미 작동. Rollback만 연결 |
| 4 | L0-L4 Write 와이어링 | ✅ PASS | `/control set L3` 명령 지원 → 사용자 제어 확보 |
| 5 | Skill effort frontmatter | ✅ PASS | ENH-134 (P0), 오래된 미구현. 35/37 skills 누락 |
| 6 | Skill paths glob | ✅ PASS | 37 skills 전부 paths 미설정 → 불필요 로딩 |
| 7 | MCP _meta maxResultSizeChars | ✅ PASS | ENH-176 (P1), 대형 응답 잘림 방지 |
| 8 | Hook `if` 필드 실적용 | ⚠️ 보류 | 문서화만 완료. 실제 적용은 데이터 수집 후 |
| 9 | Hook type: prompt | ⚠️ 보류 | CC가 실제 어떻게 처리하는지 검증 필요 |
| 10 | Skill $ARGUMENTS | ✅ PASS | 동적 인자가 없으면 skill이 정적 프롬프트에 불과 |
| 11 | settings.json (plugin) | ✅ PASS | cto-lead 기본 agent + 기본 설정 |
| 12 | userConfig | ❌ YAGNI | 현재 사용자 규모에서 자동 설정 프롬프트 불필요 |
| 13 | channels | ❌ YAGNI | Slack/Discord 통합은 시기상조 |
| 14 | bin/ directory | ❌ YAGNI | CLI 도구 노출 필요성 없음 |
| 15 | Jest 마이그레이션 | ❌ YAGNI | 기존 프레임워크로 충분 |

---

## 2. 개선 항목 총 목록 (32건)

### 2.1 Tier 0: Dead Code 정리 (기반 작업)

| # | ID | 항목 | 파일 수 | LOC 영향 |
|---|-----|------|--------|---------|
| 1 | DC-1 | lib/context/ 제거 또는 와이어링 분기 | 7 | -1,534 or +50 (와이어링) |
| 2 | DC-2 | lib/team/ dead modules 제거 (hooks에서 직접 호출하므로 불필요) | 9 | -2,023 |
| 3 | DC-3 | lib/pdca/ dead modules 제거 (batch-orchestrator, feature-manager, full-auto-do, workflow-parser 등 12개) | 12 | -4,441 |
| 4 | DC-4 | lib/core/ dead modules 제거 (backup-scheduler, cache, constants, errors, index, state-store) | 6 | -1,008 |
| 5 | DC-5 | lib/ui/ dead modules 제거 (ansi, agent-panel, impact-view, index) | 4 | -735 |
| 6 | DC-6 | lib/ root dead modules 제거 (common, context-fork, context-hierarchy, memory-store) | 4 | -1,016 |
| 7 | DC-7 | Barrel export (index.js) 7개 제거 | 7 | -297 |

**소계: -11,054 LOC (DC-1이 와이어링인 경우)**

### 2.2 Tier 1: 미통합 기능 와이어링 (3대 PARTIAL → FULLY_IMPLEMENTED)

| # | ID | 항목 | 설명 |
|---|-----|------|------|
| 8 | FW-1 | Living Context self-healing 와이어링 | StopFailure hook → self-healing 연동 |
| 9 | FW-2 | Rollback 와이어링 + 버그 수정 | `/pdca rollback` 스킬 → rollbackToCheckpoint() 연결, deleteCheckpoint() 버그 수정 |
| 10 | FW-3 | L0-L4 Write 와이어링 | `/control set <level>` 스킬 → setLevel() 연결, emergencyStop() 와이어링 |

### 2.3 Tier 2: CC Plugin 기능 GAP 해소 (P0/P1)

| # | ID | 항목 | CC 기능 | 영향 |
|---|-----|------|--------|------|
| 11 | CC-0a | **Agent permissionMode 제거** | CC 공식 미지원 (#17272) | 30/32 agents |
| 12 | CC-0b | **engines 필드 제거** | CC 공식 거부 (Not Planned) | plugin.json |
| 13 | CC-1 | **Skill effort frontmatter** | effort 필드 | 35/37 skills |
| 12 | CC-2 | **Skill paths glob** | paths 필드 | 37 skills |
| 13 | CC-3 | **Skill $ARGUMENTS 활용** | $ARGUMENTS | 10+ skills |
| 14 | CC-4 | **MCP _meta maxResultSizeChars** | _meta 응답 | 2 MCP servers |
| 15 | CC-5 | **settings.json 생성** | plugin settings | 1 file 신규 |
| 16 | CC-6 | **CwdChanged hook** | hook event | 1 script 신규 |
| 17 | CC-7 | **TaskCreated hook** | hook event | 1 script 신규 |
| 18 | CC-8 | **Hook if 필드 실적용** | conditional hooks | hooks.json 수정 |

### 2.4 Tier 3: 테스트 고도화

| # | ID | 항목 | 설명 | TC 추가 |
|---|-----|------|------|--------|
| 19 | TQ-1 | Hook I/O 행동 테스트 | pre-write.js 실제 차단 검증 | +20 TC |
| 20 | TQ-2 | PDCA 상태 전환 테스트 | plan→design→do→check 전이 검증 | +15 TC |
| 21 | TQ-3 | MCP 서버 응답 테스트 | tool 응답 구조/에러 검증 | +10 TC |
| 22 | TQ-4 | Error Recovery 테스트 | checkpoint rollback 정합성 | +10 TC |
| 23 | TQ-5 | Agent Coordination 테스트 | team handoff, task 체이닝 | +15 TC |
| 24 | TQ-6 | Untested Module 커버리지 | 11 lib + 30 scripts 테스트 추가 | +50 TC |

### 2.5 Tier 4: UX/DX 개선

| # | ID | 항목 | 설명 |
|---|-----|------|------|
| 25 | UX-1 | `/bkit debug on/off/tail` 명령 | 디버그 접근성 개선 (3/5 → 4/5) |
| 26 | UX-2 | Output profiles (quiet/normal/verbose) | 출력 커스터마이징 |
| 27 | UX-3 | `/skills search <keyword>` 검색 | 스킬 디스커버리 개선 |
| 28 | UX-4 | Checkpoint 자동 설명 | "cp-1234..." → "Design phase, matchRate 85%" |

### 2.6 Tier 5: 업계 Best Practice 정합성

| # | ID | 항목 | 설명 |
|---|-----|------|------|
| 29 | BP-1 | --bare CI/CD 가이드 | ENH-138 (P1 미구현) |
| 30 | BP-2 | BKIT_VERSION 중앙화 | ENH-167 (audit-logger 하드코딩) |
| 31 | BP-3 | statusLine 커스텀 | PDCA 상태 + 자동화 레벨 표시 |
| 32 | BP-4 | God Module 분할 | pdca/status(872L) → 3개, state-machine(818L) → 2개 |

---

## 3. 우선순위 로드맵

### Phase 1: Dead Code 정리 + 즉시 와이어링 (Week 1)

```
DC-1~7: Dead code 삭제/정리 (-11K LOC)
FW-2:   Rollback 버그 수정 + 와이어링
FW-3:   L0-L4 Write 와이어링
CC-1:   Skill effort frontmatter (35 skills)
CC-4:   MCP _meta maxResultSizeChars
```

**예상 효과**: -11K LOC, 2 PARTIAL→FULLY_IMPLEMENTED, 1 P0 ENH 해결

### Phase 2: CC 기능 GAP + 테스트 (Week 2)

```
CC-2:   Skill paths glob (37 skills)
CC-3:   Skill $ARGUMENTS (10+ skills)
CC-5:   settings.json 생성
CC-6~7: CwdChanged + TaskCreated hooks
TQ-1~4: 행동 테스트 추가 (+55 TC)
```

**예상 효과**: CC GAP 7건 해소, 테스트 행동 검증 35%→55%

### Phase 3: Living Context + UX + 테스트 (Week 3-4)

```
FW-1:   Living Context self-healing 와이어링
TQ-5~6: Agent/Module 테스트 (+65 TC)
UX-1~4: 디버그/출력/검색/체크포인트 UX
BP-1~4: Best Practice 정합성
CC-8:   Hook if 필드 실적용
BP-4:   God Module 분할
```

**예상 효과**: 3/3 PARTIAL→FULLY_IMPLEMENTED, 테스트 55%→70%+, UX 3.8→4.2/5

---

## 4. 성공 기준

| 메트릭 | Before (v2.0.9) | Target (v3.0.0) |
|--------|:----------------:|:----------------:|
| lib/ Dead Code | 51% (11,617 LOC) | **<5%** |
| PARTIAL 기능 | 3건 | **0건** |
| CC Plugin GAP (P0/P1) | 11건 | **≤3건** |
| 테스트 행동 검증 | 35% | **≥70%** |
| UX 평균 | 3.8/5 | **≥4.2/5** |
| 클린아키텍처 | 3.5/5 | **≥4.0/5** |
| Best Practice 준수 | 76% | **≥85%** |
| 연속 CC 호환 | 60 릴리스 | 유지 |

---

## 5. 리스크

| 리스크 | 심각도 | 완화 방안 |
|--------|--------|----------|
| Dead Code 삭제 시 의도치 않은 의존성 파괴 | HIGH | 삭제 전 import count 재확인, 단계적 삭제 |
| Living Context 와이어링이 기존 PDCA 흐름과 충돌 | MEDIUM | StopFailure hook에만 연결 (기존 흐름 미변경) |
| Skill paths 추가 시 기존 매칭 behavior 변경 | MEDIUM | 넓은 glob부터 시작 (e.g., `"**/*"`) |
| God Module 분할 시 import 경로 변경 → 대규모 수정 | HIGH | 분할 시 기존 경로에서 re-export |

---

## 6. 10개 에이전트 분석 참조

| Agent | 핵심 발견 | 반영된 항목 |
|-------|----------|------------|
| cc-docs-analyzer | P0 1건(effort), P1 10건(paths, $ARGUMENTS, MCP _meta 등) | CC-1~8 |
| cc-issues-painpoints | #6235 AGENTS.md +3,511, 토큰 절약 +1,165 | 시장 포지셔닝 확인 |
| cc-bestpractices | 76% BP 준수, P1: --bare CI/CD | BP-1~4 |
| clean-arch-auditor | 3.5/5, God Modules 2건 | BP-4, DC 전체 |
| feature-completeness | FULLY 5/8, PARTIAL 3/8, 버그 1건 | FW-1~3 |
| ux-dx-auditor | 3.8/5, Debug 3/5 최약점 | UX-1~4 |
| test-quality-auditor | C+ (행동 35%), 41 모듈 미테스트 | TQ-1~6 |
| hooks-completeness | 8 미구현 (P1: TaskCreated, CwdChanged) | CC-6~7 |
| lib-usage-auditor | 51% dead, context/ team/ 100% dead | DC-1~7 |
| sysprompt-analyzer | P0 2건: permissionMode CC 미지원(30 agents), engines CC 거부 | CC-0a, CC-0b 추가 |

---

## 7. 참고 문서

- [RTK×bkit 고도화 분석](../04-report/features/rtk-inspired-bkit-enhancement-analysis.report.md)
- [CC v2.1.94 영향 분석](../04-report/features/cc-v2193-v2194-impact-analysis.report.md)
- [bkit v2.0.9 릴리스 보고서](../04-report/features/bkit-v209-cc-v2194-compatibility.report.md)
- [bkit 아키텍처 분석 (2026-03-29)](../../memory/bkit_architecture_analysis_20260329.md)
