# CC 버전업 + GitHub 이슈 대응 플랜

> **Feature**: cc-version-issue-response
> **작성일**: 2026-04-12
> **작성자**: bkit CC Version Response Workflow
> **현재 bkit 버전**: v2.1.1 (master), v2.0.8 (최근 릴리스 기준)
> **현재 CC 버전**: v2.1.98 (63개 연속 호환, v2.1.34~v2.1.98)
> **데이터 소스**: `gh issue list` 실시간 조회 성공 + 메모리/최근 리포트 교차 검증

---

## 1. Executive Summary

- **호환성 리스크**: 현재 bkit는 CC v2.1.98과 100% 호환(breaking 0건). 그러나 CC 신규 기능 중 **미구현 ENH 15건**이 누적되어 "자동 수혜만으로는 해결 불가"한 항목이 P0/P1에 포진.
- **운영 리스크**: GitHub 오픈 이슈 18건(모니터 대상) 중 **14건이 여전히 OPEN**이며, 특히 `#37520`(병렬 agent 401), `#40502`(bg agent write 불가), `#44971`(SubagentStop 미발화)는 CTO Team·Agent Team 실사용에 직접 영향.
- **즉시 행동**: P0 1건(ENH-193 MCP `_meta` 방어적 수정), P1 6건(ENH-134/138/139/143/148/188)을 2주 내 착수. 이슈 클러스터(Hook/Permission/Agent/LongSession) 단위로 묶어 중복 작업 회피.

---

## 2. GitHub 오픈 이슈 현황

> `gh issue list --repo anthropics/claude-code --state open --limit 100` + 개별 `gh issue view` 교차 확인 (2026-04-12 기준)

### 2.1 메모리 트래킹 이슈 상태 실사

| # | 제목(요약) | 영향도 | bkit 영향 | 상태(실사) | 대응 전략 |
|---|---|---|---|---|---|
| #29423 | Task subagents 가 CLAUDE.md 무시 | HIGH | 직접 | **OPEN** | CTO Team 프리롤 workaround 유지, CC 수정 대기 |
| #34197 | Claude Code 가 CLAUDE.md 지속 무시 | HIGH | 직접(핵심) | **OPEN** | bkit 규칙 재주입 (user-prompt-handler) 경로 강화 |
| #36059 | PreToolUse permissionDecision 이 ask 규칙 오버라이드 안 됨 | MED | 간접 | **OPEN** | bkit 미영향 확인, 문서만 업데이트 |
| #37520 | v2.1.81+ 병렬 agent 401 | HIGH | 직접(CTO Team) | **OPEN** | ENH-143: 병렬 spawn 지연 workaround 구현 |
| #37745 | --skip-permissions + PreToolUse mid-session 리셋 | HIGH | 간접 | **OPEN** | bkit headless 모드에서만 발생, ENH-138 번들 |
| #40506 | PreToolUse hook `-p` 모드 미작동 | HIGH | 직접 | **OPEN** | ENH-138(--bare CI/CD 가이드) 선행 필요 |
| #40502 | Background agents write 불가 | HIGH | 직접(CTO Team) | **OPEN** | agent-state fallback 로직 추가 |
| #41930 | 광범위 사용량 비정상 소진 (v2.1.89+) | HIGH | 직접(비용) | **OPEN** | 사용량 모니터링 hook, `/cost` per-model 활용 (v2.1.92) |
| #33656 | PostToolUse non-zero exit 오보고 | MED | 미영향 | **OPEN** | 모니터링만 |
| #35296 | 1M context 광고 기능 실제 미작동 | MED | 간접 | **OPEN** | Opus 4.6 1M context 자동 사용, 영향 없음 |
| #37729 | SessionStart env /clear 미정리 | MED | 직접 | **OPEN** | ENH-148: SessionStart env 방어 레이어 |
| #37730 | Subagent permission 미상속 | MED | 직접 | **OPEN** | bkit allowlist 이중 선언 패턴화 |
| #40519 | VSCode auto-compact plan mode 크래시 | MED | 미영향 | **OPEN** | 문서 경고만 |
| #41788 | Max 20 plan rate-limit 70분 소진 | MED | 간접(비용) | **OPEN** | 사용자 가이드 문서화 |
| #44925 | FileChanged hook 이 Bash 수정 미감지 | MED | 직접 | **OPEN** | ENH-150 구현 시 우회 로직 포함 |
| #44958 | PreToolUse:Write 오탐 | MED | 직접 | **OPEN** | bkit PreToolUse Write hook 조건 재검토 |
| #44971 | SubagentStop 미발화(팀 shutdown) | MED | 직접(Agent Team) | **OPEN** (v2.1.97 부분 수정) | fallback cleanup on SessionEnd |
| #44968 | 병렬 agent 무단 spawn 토큰 과소모 | MED | 직접 | **OPEN** | maxTurns + disallowedTools 강제, #37520 클러스터와 통합 |
| #34629 | prompt-cache regression (--print --resume) | — | — | **CLOSED** (v2.1.89) | 자동 수혜 완료 |
| #38651 | Stop hook print 모드 빈 결과 | LOW | 미영향 | **OPEN** (메모리는 CLOSED로 잘못 기록) | 메모리 정정 필요 |

### 2.2 신규 관측 이슈 (2026-04-11 이후)

| # | 제목 | 영향도 | bkit 영향 | 대응 |
|---|---|---|---|---|
| #46808 | Hooks not triggered in git worktree | HIGH | **직접** | worktree 환경에서 bkit hook 전부 실리적 무효화 — **Phase 1 편입** |
| #46809 | Write deny rules not enforced via managed settings | MED | 간접 | 엔터프라이즈 사용자 경고만 |
| #46807 | 20 audit agents 가 user instructions 무시 | MED | 직접(bkit-analysis MCP) | CTO Team 프리롤 강화 |

**메모리 정정 필요**: #38651 은 여전히 OPEN (v2.1.84 에서 "수정 확인"이라 기록했으나 실제 상태는 OPEN).

---

## 3. CC 버전별 미대응 항목 (ENH 기준)

### 3.1 P0 — 즉시 조치 필요

| ENH | 출처 | 원인 | 영향 범위 | 난이도 | 해결 방법 |
|---|---|---|---|---|---|
| **ENH-193** | v2.1.98 | MCP `_meta` persist bypass 보안 수정으로 bkit `maxResultSizeChars=500K` 오버라이드가 지속 적용되지 않을 수 있음 | 2개 MCP 서버 (`bkit-pdca`, `bkit-analysis`) `okResponse()` | ★☆☆ (소) | 두 서버의 `okResponse()` 에서 `_meta.claudecode/maxResultSizeChars` 를 매 응답마다 양쪽 키(신/구 규격)로 재설정 |
| **ENH-134** | v2.1.80 | Skills `effort` frontmatter 미적용으로 기본 `high` 사용 → 토큰 과소모 | 37개 skills SKILL.md | ★☆☆ (소) | 각 skill 에 `effort: low/medium/high` 명시 추가 (분류 기준: UX 스킬 low, PDCA medium, 분석 high) |

### 3.2 P1 — 2~3주 내 완료

| ENH | 출처 | 원인 | 영향 범위 | 난이도 | 해결 방법 |
|---|---|---|---|---|---|
| **ENH-138** | v2.1.81 | `--bare` flag CI/CD 가이드 부재 | docs + hook 구성 | ★★☆ (중) | `docs/` 내 CI/CD 통합 가이드 + GitHub Actions 샘플 |
| **ENH-139+142** | v2.1.81 | Plugin freshness re-clone 전략 문서 부재 | 배포 전략 | ★★☆ (중) | `claude plugin update` 동작 검증 + release 문서 업데이트 |
| **ENH-143** | 계속 | 병렬 agent spawn 401 (#37520) workaround | CTO Team `spawnParallel` | ★★★ (대) | 지연(jitter) + retry + 순차 fallback 3단계 전략 |
| **ENH-148** | v2.1.73 | SessionStart env `/clear` 미정리 (#37729) | session-start hook | ★★☆ (중) | `/clear` 감지 후 env 재주입 레이어 |
| **ENH-149** | v2.1.83 | CwdChanged hook 미사용 — 프로젝트 전환 자동 감지 기회 | hook registry | ★★☆ (중) | CwdChanged 핸들러 → bkit state 재로드 |
| **ENH-188** | v2.1.94 | Plugin frontmatter hooks 정상화(#17688) 이후 11 skills + 13 agents 중복 실행 검증 필요 | 24개 정의 | ★☆☆ (소) | 회귀 테스트 작성 + hook 실행 횟수 assertion |
| **ENH-156** | v2.1.84 | TaskCreated hook 미사용 — PDCA Task 추적 audit 기회 | audit-logger | ★★☆ (중) | TaskCreated → audit 기록 + `.bkit/state/pdca-status.json` 동기화 |

### 3.3 P2 — 1개월 내 완료

| ENH | 핵심 |
|---|---|
| ENH-147 | Security monitor 정책 문서화 |
| ENH-150 | FileChanged hook → PDCA 문서 감시 (#44925 우회 로직 포함) |
| ENH-151 | self-healing agent `effort/maxTurns` 누락 수정 |
| ENH-167 | `BKIT_VERSION` 중앙화 (하드코딩 `"2.0.6"` 제거) |
| ENH-176 | MCP `_meta` 500K 적용 검증 (ENH-193 과 짝) |
| ENH-177 | `disableSkillShellExecution` 호환성 문서 (25/37 skills 영향) |
| ENH-187 | `sessionTitle` hook output — PDCA 세션 자동 명명 |

---

## 4. 이슈 클러스터링 — 유사 이슈 동시 해결 기회

### Cluster A: Hook 실행 신뢰성
- **이슈**: #46808 (worktree), #44925 (FileChanged Bash 미감지), #44958 (PreToolUse Write 오탐), #40506 (PreToolUse `-p` 미작동), #38651 (Stop hook `-p` 빈 결과)
- **공통 원인**: Hook 실행 컨텍스트(-p, worktree, tool 유형)에 따른 발화 비일관성
- **통합 전략**:
  1. bkit 자체 `hook-health-check` 진단 스킬 신설 — 현재 세션에서 어떤 hook 가 발화 가능한지 검증
  2. worktree 감지 시 경고 메시지 + `GIT_DIR` 환경변수 fallback
  3. `-p` (bare) 모드 hook 동작을 통합 문서화 (ENH-138 과 합류)

### Cluster B: Permission 시스템
- **이슈**: #37730 (subagent 미상속), #37745 (skip-permissions 리셋), #36059 (permissionDecision 회귀), #46809 (deny rules managed settings)
- **통합 전략**:
  1. bkit 표준 allowlist 템플릿을 team agent frontmatter 에도 이중 선언
  2. `PreToolUse.defer` (v2.1.89) 활용으로 headless human-in-the-loop 경로 (ENH-172)

### Cluster C: Background / Parallel Agent
- **이슈**: #37520 (parallel 401), #40502 (bg write 불가), #44968 (무단 spawn), #44971 (SubagentStop 미발화), #46807 (audit agent instruction 무시)
- **공통 원인**: CC 의 병렬·백그라운드 agent 라이프사이클 관리 미성숙
- **통합 전략**:
  1. `spawnParallel()` 에 jitter + 순차 fallback (ENH-143)
  2. `SessionEnd` hook 에서 SubagentStop 누락분 cleanup
  3. 각 team agent 에 `maxTurns` 강제 설정 (ENH-151)

### Cluster D: Long Session 안정성 & 비용
- **이슈**: #41930 (abnormal drain), #41788 (70분 100% 소진), #44968 (token 과소모)
- **통합 전략**:
  1. `/cost` per-model breakdown (v2.1.92) 을 statusline 에 통합 — ENH-135 재활성화
  2. 세션당 토큰 상한 가드(사용자 설정) + 경고 hook
  3. RTK-inspired 30~50% 절감 ENH-R 클러스터와 연계

---

## 5. 우선순위 로드맵

### Phase 1 — 즉시 (1주 내, P0)

| # | 작업 | ENH | 예상 공수 |
|---|---|---|---|
| 1 | MCP `_meta` 양쪽 키 방어적 재설정 | ENH-193 | 2h |
| 2 | 37 skills `effort` frontmatter 추가 | ENH-134 | 4h |
| 3 | git worktree hook 미발화(#46808) 감지/경고 스킬 | Cluster A | 3h |
| 4 | 메모리 정정: #38651 OPEN 재기록 | — | 0.5h |

### Phase 2 — 2~3주 (P1 + 버전업 준비)

| # | 작업 | ENH | 예상 공수 |
|---|---|---|---|
| 5 | `--bare` CI/CD 가이드 + hook 통합 문서 | ENH-138 | 6h |
| 6 | Plugin freshness 배포 가이드 | ENH-139+142 | 4h |
| 7 | `spawnParallel` jitter + fallback | ENH-143 (#37520/#44968) | 8h |
| 8 | SessionStart env `/clear` 방어 | ENH-148 (#37729) | 3h |
| 9 | CwdChanged hook 핸들러 | ENH-149 | 4h |
| 10 | Plugin frontmatter hooks 중복 실행 회귀 테스트 | ENH-188 | 4h |
| 11 | TaskCreated hook audit 연동 | ENH-156 | 4h |
| 12 | Hook health-check 진단 스킬 | Cluster A | 6h |

### Phase 3 — 1개월 (P2 + 장기 모니터링)

| # | 작업 | ENH |
|---|---|---|
| 13 | FileChanged hook PDCA 감시 (#44925 우회) | ENH-150 |
| 14 | self-healing agent `effort/maxTurns` 일괄 검증 | ENH-151 |
| 15 | `BKIT_VERSION` 중앙화 | ENH-167 |
| 16 | `disableSkillShellExecution` 호환성 매트릭스 | ENH-177 |
| 17 | `sessionTitle` PDCA 자동 명명 | ENH-187 |
| 18 | `/cost` per-model statusline 통합 | ENH-135 재활성화 |
| 19 | Security monitor 정책 문서 | ENH-147 |

---

## 6. 각 작업별 상세 계획

### T1. ENH-193 MCP `_meta` 방어적 수정 (P0)

- **대상 파일**:
  - `mcp/bkit-pdca/src/utils/response.js` (또는 `okResponse` 정의 위치)
  - `mcp/bkit-analysis/src/utils/response.js`
- **변경 내용**:
  ```js
  // Set both old and new _meta key formats for compatibility across CC versions
  function okResponse(data) {
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      _meta: {
        "claudecode/maxResultSizeChars": 500000,
        "anthropic.maxResultSizeChars": 500000, // defensive: new key format
      },
    };
  }
  ```
- **테스트**: 응답 크기 >128KB 인 `bkit_feature_list` 호출이 truncation 없이 반환되는지 확인
- **롤백**: 파일 단위 git revert

### T2. ENH-134 Skills effort frontmatter (P0)

- **대상 파일**: `skills/*/SKILL.md` (37개)
- **분류 기준**:
  - `low` (15개): help, starter, output-style-setup, btw, skill-status, dev-pipeline, bkend-* (quickstart/cookbook), phase-*-simple
  - `medium` (15개): pdca, pdca-batch, plan-plus, qa-phase, deploy, control, rollback, skill-create, audit
  - `high` (7개): cc-version-analysis, bkit-rules, code-review, phase-8-review, pm-discovery, zero-script-qa, enterprise
- **테스트**: 전체 스킬 로드 후 `/skills` 목록 확인, effort 필드 파싱 에러 없는지 검증
- **롤백**: frontmatter 블록 단위 revert

### T3. #46808 worktree hook 우회 (P0)

- **대상 파일**: 신규 `skills/hook-worktree-guard/SKILL.md` 또는 `lib/hooks/worktree-detector.js`
- **변경 내용**: SessionStart 시 `git rev-parse --show-toplevel` 과 `process.cwd()` 비교 → 다르면 경고 + `.claude/settings.json` 경로 재해석
- **테스트**: worktree 에서 PreToolUse:Bash hook 발화 확인
- **롤백**: 훅 비활성화

### T7. ENH-143 spawnParallel 안정화 (P1)

- **대상 파일**: `lib/agents/parallel-spawner.js` (or 해당)
- **변경 내용**:
  ```js
  // Add jitter + retry + sequential fallback for #37520/#44968
  async function spawnParallel(tasks, { maxConcurrent = 3, jitterMs = 150 } = {}) {
    const results = [];
    for (let i = 0; i < tasks.length; i += maxConcurrent) {
      const batch = tasks.slice(i, i + maxConcurrent);
      await delay(i === 0 ? 0 : jitterMs);
      try {
        results.push(...(await Promise.all(batch.map(spawnOne))));
      } catch (err) {
        if (isAuth401(err)) {
          // Sequential fallback
          for (const t of batch) results.push(await spawnOne(t));
        } else throw err;
      }
    }
    return results;
  }
  ```
- **테스트**: 10 agents 병렬 spawn 으로 401 재현, fallback 동작 확인

*(이하 작업 T4~T19 는 동일 형식으로 DO 단계에서 확장)*

---

## 7. 리스크 & 완화 방안

| 리스크 | 확률 | 영향 | 완화 |
|---|---|---|---|
| CC v2.1.99+ 에서 `_meta` 키 형식 재변경 | 중 | 중 | ENH-193 에서 양쪽 키 동시 설정으로 선제 방어 |
| ENH-134 잘못된 effort 분류로 품질 저하 | 중 | 중 | Phase 1 후 1주 모니터링, `/cost` per-model 로 측정 |
| #46808 fix 가 비 worktree 환경 회귀 유발 | 낮 | 중 | worktree 감지 시에만 경고, 기본 경로 불변 |
| spawnParallel fallback 이 성능 저하(순차) | 높 | 낮 | 401 에서만 fallback, 정상 경로는 병렬 유지 |
| GitHub 이슈 대응 중 CC 가 먼저 수정 | 중 | 낮(긍정) | 주간 `gh issue view` 재확인, 중복 작업 제거 |

---

## 8. 성공 지표

| 지표 | 현재 | 목표(Phase 1) | 목표(Phase 3) |
|---|---|---|---|
| CC 연속 호환 릴리스 | 63 (v2.1.34~v2.1.98) | 64 (v2.1.99) | 68 (v2.2.x) |
| Match Rate (Docs=Code) | 85% | 90% | 95% |
| 미구현 ENH (P0+P1) | 8건 | 2건 | 0건 |
| OPEN 이슈 중 bkit 직접 영향 해결 | 0건 | 3건 (#46808, #37729, #37520 workaround) | 7건 |
| 세션당 평균 토큰 | baseline | -10% (effort 최적화) | -30% (RTK ENH-R) |
| 테스트 커버리지 | 35% | 40% | 50% |

---

## 9. 참고 자료

### 관련 bkit 리포트
- `docs/04-report/features/cc-v2197-v2198-impact-analysis.report.md` — 최신 CC 영향 분석
- `docs/04-report/features/cc-v2196-v2197-impact-analysis.report.md`
- `docs/04-report/features/cc-v2193-v2194-impact-analysis.report.md`
- `docs/04-report/features/bkit-v211-comprehensive-improvement.report.md`
- `docs/04-report/features/rtk-inspired-bkit-enhancement-analysis.report.md`

### CC GitHub Issues 링크
- https://github.com/anthropics/claude-code/issues/46808 (worktree hook)
- https://github.com/anthropics/claude-code/issues/37520 (parallel 401)
- https://github.com/anthropics/claude-code/issues/40502 (bg agent write)
- https://github.com/anthropics/claude-code/issues/44971 (SubagentStop)
- https://github.com/anthropics/claude-code/issues/41930 (usage drain)
- https://github.com/anthropics/claude-code/issues/34197 (CLAUDE.md ignored)
- https://github.com/anthropics/claude-code/issues/29423 (subagent CLAUDE.md)
- https://github.com/anthropics/claude-code/issues/37729 (SessionStart env)
- https://github.com/anthropics/claude-code/issues/44925 (FileChanged Bash)
- https://github.com/anthropics/claude-code/issues/40506 (PreToolUse -p)

### bkit 스킬
- `skills/cc-version-analysis/SKILL.md` — 버전 분석 워크플로우
- `skills/pdca/SKILL.md` — PDCA 사이클 관리

---

> **다음 단계**: 이 플랜을 `/pdca plan` 으로 확정 → `/pdca design` 에서 T1~T19 세부 설계 → `/pdca do` 에서 Phase 1 즉시 착수.
