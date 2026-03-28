# CC v2.1.84 영향 분석 보고서

> **Status**: ✅ Complete
>
> **Project**: bkit Vibecoding Kit
> **Version**: v2.0.6 (분석 시점)
> **Author**: CC Version Analysis Workflow
> **Completion Date**: 2026-03-26
> **PDCA Cycle**: #24

---

## Executive Summary

### 1.1 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **기능** | CC v2.1.84 (1개 릴리스) 영향 분석 |
| **시작일** | 2026-03-26 |
| **완료일** | 2026-03-26 |
| **기간** | 1회 분석 |
| **설치 CC 버전** | v2.1.84 |
| **분석 범위** | v2.1.83 → v2.1.84 |

### 1.2 성과 요약

```
┌──────────────────────────────────────────────────────┐
│  CC v2.1.84 영향 분석 결과                             │
├──────────────────────────────────────────────────────┤
│  📊 총 변경 건수:           ~43건 (CLI ~39 + VSCode 1 + 기타)│
│  🆕 신규 기능:              14건                       │
│  🔧 버그 수정:              16건                       │
│  📈 개선사항:               10건                       │
│  ⚠️  Behavior Changes:      2건                       │
│  🔴 신규 hook events:       1건 (TaskCreated)          │
│  🔴 신규 tools:             1건 (PowerShell, Windows)   │
│  📋 신규 ENH 기회:          4건 (ENH-156~159)          │
│  🔢 연속 호환 릴리스:        50개 (v2.1.34~v2.1.84)    │
│  🔢 breaking changes:       0건 (bkit 기준)            │
│  🔢 자동 수혜:              4건 (cold-start, subagent,  │
│                              MCP cache, IME/CJK)       │
└──────────────────────────────────────────────────────┘
```

### 1.3 전달된 가치

| 관점 | 내용 |
|------|------|
| **문제** | CC v2.1.84에서 TaskCreated hook event 신규 추가, paths: YAML list 지원, cold-start race fix, MCP 2KB cap 등 ~43건 변경 |
| **해결 방법** | GitHub release notes + CHANGELOG.md + npm + 이슈 트래커 + bkit 코드베이스 교차 검증 |
| **기능/UX 효과** | TaskCreated hook으로 PDCA Task 생성 시점 추적 가능, cold-start race fix로 세션 안정성 향상, IME/CJK fix로 한국어 입력 개선 |
| **핵심 가치** | 50개 연속 호환 릴리스 확인 + ENH 4건 도출(P1 1건/P2 1건/P3 2건) + 자동 수혜 4건 확인 |

---

## 2. Impact Summary

| 카테고리 | 건수 | HIGH | MEDIUM | LOW |
|----------|------|------|--------|-----|
| Breaking | 0 | 0 | 0 | 0 |
| Enhancement | 4 | 2 | 1 | 1 |
| Neutral | 10 | 2 | 7 | 1 |

**총 변경사항**: ~14건 (HIGH 4 + MEDIUM 7 + Other 3)
**bkit 코드 변경 필요**: 2건 (ENH-156, ENH-157)
**자동 수혜**: 2건 (B-84-14 cold-start fix, B-84-6 workflow subagent fix)

---

## 3. Component Mapping (CC 변경 → bkit 컴포넌트)

### 3.1 HIGH Impact Changes

| CC 변경 | ID | bkit 컴포넌트 | 영향 분류 | 상세 |
|---------|-----|--------------|----------|------|
| **TaskCreated hook event** | F-84-5 | hooks/hooks.json, scripts/ | Enhancement | CC hook events 24→25. bkit 현재 18 events 구현. TaskCreated 추가 시 19. PDCA Task 생성 시점 감지 가능 |
| **paths: YAML list** | F-84-11 | skills/*/SKILL.md | Enhancement | 현재 bkit 37개 skills 중 `paths:` 사용 0건. 신규 적용 가능하나 YAGNI 검토 필요 |
| **Cold-start race fix** | B-84-14 | 전체 (scripts/, hooks/) | Neutral (자동 수혜) | Edit/Write InputValidationError race condition 수정. bkit hook scripts 5초 timeout 내 cold-start 시 간헐적 실패 방지 |
| **MCP 2KB description cap** | I-84-1 | servers/ (2개 MCP 서버) | Neutral (안전) | bkit MCP tool descriptions 최대 길이 측정 결과 모두 2KB 미만. 영향 없음 |

### 3.2 MEDIUM Impact Changes

| CC 변경 | ID | bkit 컴포넌트 | 영향 분류 | 상세 |
|---------|-----|--------------|----------|------|
| ANTHROPIC_DEFAULT_*_MODEL_SUPPORTS | F-84-2 | agents/*.md | Neutral | 3P capability override. bkit은 자체 model override 미사용 |
| CLAUDE_STREAM_IDLE_TIMEOUT_MS | F-84-4 | 해당 없음 | Neutral | 90초 streaming idle watchdog. bkit 장시간 hook은 최대 10초 timeout |
| Idle-return 75min+ prompt | F-84-9 | 해당 없음 | Neutral | 장시간 방치 복귀 프롬프트. bkit 관련 없음 |
| System-prompt caching + ToolSearch | F-84-14 | 해당 없음 | Neutral (자동 수혜) | 시스템 프롬프트 캐싱 개선. bkit 성능 자동 향상 |
| Workflow subagent json-schema 400 fix | B-84-6 | agents/ (CTO Team) | Neutral (자동 수혜) | workflow subagent json-schema 400 에러 수정. CTO Team 안정성 자동 향상 |
| File attachment snippet hang fix | B-84-9 | 해당 없음 | Neutral | bkit은 file attachment 미사용 |
| MCP cache leak on reconnect fix | B-84-10 | servers/ | Neutral (자동 수혜) | MCP 서버 재연결 시 캐시 누수 수정. bkit MCP 서버 안정성 향상 |

### 3.3 Other Changes

| CC 변경 | ID | bkit 컴포넌트 | 영향 분류 |
|---------|-----|--------------|----------|
| PowerShell tool (Windows) | F-84-1 | 해당 없음 | Neutral (bkit은 macOS/Linux) |
| IME/CJK cursor tracking fix | B-84-12 | 해당 없음 | Neutral (자동 수혜, 한국어 입력 개선) |
| Bare #123 auto-link removed | BC-84-1 | 해당 없음 | Neutral (bkit docs에서 owner/repo#NNN 형식 이미 사용) |

---

## 4. 심층 코드 분석

### 4.1 TaskCreated Hook Event 분석 (F-84-5)

**현재 상태 (hooks.json)**:
- 18개 hook events 구현 중
- `TaskCompleted` 핸들러: `scripts/pdca-task-completed.js` (173 LOC)
- TaskCompleted 역할: PDCA phase 감지 → auto-advance → team assignment → executive summary

**TaskCreated 추가 가치 분석**:

```
TaskCompleted (기존)          TaskCreated (신규)
───────────────────          ──────────────────
Task 완료 후 처리              Task 생성 시점 처리
- PDCA phase auto-advance    - PDCA Task 생성 추적 (audit)
- Team assignment            - Task naming convention 검증
- Executive summary          - 중복 Task 방지
- Progress update            - PDCA phase 전환 기록
```

**결론**: TaskCreated는 **감사 로깅 및 Task 관리 강화**에 유용. PDCA Task 생성 시점을 정확히 기록하면 워크플로우 추적성이 향상됨. 다만 현재 bkit이 실질적으로 Task 생성을 직접 처리하지 않으므로 (TaskCompleted에서 후처리), 즉각적 필수성은 P1.

**TaskCreated 핸들러 예상 구현 범위**:
1. Task subject에서 PDCA phase 감지 (기존 `detectPdcaFromTaskSubject()` 재사용)
2. 감사 로그에 task_created 이벤트 기록
3. Task 명명 규칙 검증 (`[Phase] feature` 형식)
4. 중복 Task 생성 경고

### 4.2 paths: YAML List 분석 (F-84-11)

**현재 상태**: 37개 skills 중 `paths:` 사용 **0건**.

**적용 가능 Skills 분석**:

| 스킬 | 관련 디렉토리 | paths: 적용 가치 |
|------|-------------|-----------------|
| pdca | `docs/`, `templates/`, `.bkit/state/` | Medium — 3개 디렉토리에 걸쳐 동작 |
| code-review | `src/`, `lib/`, `scripts/` | Medium — 프로젝트 코드 전반 |
| deploy | `.github/`, `infra/`, `Dockerfile` | Low — 인프라 파일은 특정 위치 |
| enterprise | `infra/`, `k8s/`, `terraform/` | Low — 인프라 전용 |
| cc-version-analysis | `docs/04-report/`, `.claude/agent-memory/` | Low — 특정 경로 |
| bkit-rules | 전체 프로젝트 | N/A — 전역 룰이므로 paths 제한 불가 |
| audit | `.bkit/audit/`, `.bkit/state/` | Medium — 감사 디렉토리 한정 |

**YAGNI 검토 결과**:
- bkit skills은 **플러그인 내부 스킬** (사용자 프로젝트 구조에 독립적)
- `paths:` 는 사용자 프로젝트의 특정 경로에서만 스킬이 활성화되도록 제한하는 기능
- bkit skills은 프로젝트 전반에서 동작해야 하므로 `paths:` 제한이 오히려 방해
- **예외**: `bkit-rules` 같은 전역 스킬은 paths 적용 자체가 무의미

**결론**: paths: YAML list는 CC의 사용자 정의 스킬/규칙에 유용하나, **bkit 플러그인 내장 스킬에는 적용 필요성 낮음**. 단, `skill-create`로 생성하는 **project-local 스킬에서 paths: YAML list 지원을 문서화**하는 것은 의미 있음 (P2).

### 4.3 MCP Tool Description 2KB Cap 분석 (I-84-1)

**bkit MCP 서버 tool description 길이 측정**:

| 서버 | Tool | Description 길이 |
|------|------|-----------------|
| bkit-analysis-server | bkit_code_quality | ~83 bytes |
| bkit-analysis-server | bkit_gap_analysis | ~67 bytes |
| bkit-analysis-server | bkit_regression_rules | ~80 bytes |
| bkit-analysis-server | bkit_checkpoint_list | ~53 bytes |
| bkit-analysis-server | bkit_checkpoint_detail | ~56 bytes |
| bkit-analysis-server | bkit_audit_search | ~77 bytes |
| bkit-pdca-server | bkit_pdca_status | ~72 bytes |
| bkit-pdca-server | bkit_pdca_history | ~65 bytes |
| bkit-pdca-server | bkit_feature_list | ~48 bytes |
| bkit-pdca-server | bkit_feature_detail | ~73 bytes |
| bkit-pdca-server | bkit_plan_read | ~61 bytes |
| bkit-pdca-server | bkit_design_read | ~64 bytes |
| bkit-pdca-server | bkit_analysis_read | ~58 bytes |
| bkit-pdca-server | bkit_report_read | ~63 bytes |
| bkit-pdca-server | bkit_metrics_get | ~62 bytes |
| bkit-pdca-server | bkit_metrics_history | ~47 bytes |

**최대 description**: ~83 bytes (bkit_code_quality)
**2KB cap**: 2,048 bytes
**안전 마진**: 24x 이상

**결론**: bkit MCP 서버는 2KB cap에 **전혀 영향 없음**. 모든 tool description이 100 bytes 미만.

### 4.4 Cold-Start Race Fix 분석 (B-84-14)

**bkit 관련 시나리오**:
- bkit SessionStart hook은 `once: true` + timeout 5000ms
- CC 시작 직후 Edit/Write 호출 시 core tools deferred race condition이 있었음
- bkit의 hook scripts는 stdin JSON 파싱 → 로직 → stdout JSON 출력 패턴
- bkit 자체는 hook 내에서 Edit/Write를 호출하지 않으므로 **직접 영향 없음**
- 다만 사용자의 첫 번째 명령이 빠른 Edit/Write일 경우 CC 수준에서 수정되어 간접 수혜

---

## 5. ENH Opportunities

### ENH-156: TaskCreated Hook — PDCA Task 생성 추적 (P1)

| 항목 | 내용 |
|------|------|
| CC Feature | F-84-5: TaskCreated hook event |
| Priority | P1 (High) |
| 근거 | PDCA 워크플로우 가시성 향상, 감사 로깅 강화 |
| 기존 workaround | TaskCompleted에서만 후처리 — 생성 시점 기록 없음 |
| 구현 범위 | hooks.json에 TaskCreated event 추가 + 핸들러 스크립트 신규 |

**구현 계획**:
1. `hooks/hooks.json` — TaskCreated event 등록
2. `scripts/task-created-handler.js` — 핸들러 신규 작성 (~80 LOC)
   - `detectPdcaFromTaskSubject()` 재사용
   - audit log에 task_created 기록
   - Task naming convention 검증
3. `test/regression/hooks-22.test.js` — EXPECTED_HOOKS에 TaskCreated 추가, TC 수 조정
4. `test/integration/hook-wiring.test.js` — TaskCreated 핸들러 존재 확인 TC 추가

**추정 LOC**: +120 (script 80 + test 40)

### ENH-157: skill-create paths: YAML List 문서화 (P2)

| 항목 | 내용 |
|------|------|
| CC Feature | F-84-11: paths: YAML list in frontmatter |
| Priority | P2 (Medium) |
| 근거 | project-local 스킬 생성 시 paths: 다중 glob 지원 문서화 |
| 기존 상태 | bkit 내장 스킬은 paths: 미사용 (적용 불필요) |
| 구현 범위 | skill-create SKILL.md 문서 업데이트 + 예시 추가 |

**구현 계획**:
1. `skills/skill-create/SKILL.md` — paths: YAML list 사용 예시 추가
2. bkit 내장 37개 스킬에는 **적용하지 않음** (YAGNI)

**추정 LOC**: +15 (문서 추가)

### ENH-158: CLAUDE_STREAM_IDLE_TIMEOUT_MS 문서화 (P3)

| 항목 | 내용 |
|------|------|
| CC Feature | F-84-4: Streaming idle watchdog 90s default |
| Priority | P3 (Low) — YAGNI 경계 |
| 근거 | CTO Team 장시간 세션에서 이론적으로 관련 가능하나 실질적 필요성 낮음 |
| 현재 상태 | bkit hook timeout 최대 10초 (hooks.json) — 90초 idle timeout과 무관 |
| 판정 | Monitor only. 실제 CTO Team에서 idle timeout 이슈 보고 시 구현 |

### ENH-159: Workflow Subagent 안정성 문서화 (P3)

| 항목 | 내용 |
|------|------|
| CC Feature | B-84-6: Workflow subagent json-schema 400 fix |
| Priority | P3 (Low) — 자동 수혜 |
| 근거 | CTO Team workflow subagent 400 에러 수정. CC 업데이트만으로 자동 해결 |
| 판정 | 코드 변경 불필요. CC v2.1.84+ 권장 사항에 포함만 하면 됨 |

---

## 6. File Impact Matrix

| 파일 | 컴포넌트 | 변경 유형 | ENH | Priority | 추정 LOC |
|------|----------|----------|-----|----------|---------|
| `hooks/hooks.json` | Hook registry | MODIFY (TaskCreated 추가) | ENH-156 | P1 | +12 |
| `scripts/task-created-handler.js` | Hook script | NEW | ENH-156 | P1 | +80 |
| `test/regression/hooks-22.test.js` | Regression test | MODIFY (TC 추가) | ENH-156 | P1 | +15 |
| `test/integration/hook-wiring.test.js` | Integration test | MODIFY (TC 추가) | ENH-156 | P1 | +10 |
| `skills/skill-create/SKILL.md` | Skill docs | MODIFY (paths: 예시) | ENH-157 | P2 | +15 |
| `.claude-plugin/plugin.json` | Plugin manifest | MODIFY (engines 업데이트) | — | — | +1 |

**총 변경**: 4 files MODIFY + 1 file NEW = ~133 LOC

---

## 7. Philosophy Compliance

| ENH | Automation First | No Guessing | Docs=Code | 판정 |
|-----|-----------------|-------------|-----------|------|
| ENH-156 | PASS — TaskCreated 자동 감지로 audit 자동화 향상 | PASS — CC 공식 hook event, 동작 명확 | PASS — hooks.json이 실제 구현과 일치 | **PASS** |
| ENH-157 | PASS — skill-create 워크플로우에 자동 반영 | PASS — CC 공식 문서 기반 | PASS — SKILL.md 문서 = 실제 지원 기능 | **PASS** |
| ENH-158 | N/A — 문서 전용 | PASS | PASS | **CONDITIONAL** (monitor) |
| ENH-159 | N/A — 자동 수혜 | PASS | N/A | **CONDITIONAL** (no action) |

---

## 8. Test Impact Assessment

### ENH-156 (TaskCreated Hook)

| 테스트 카테고리 | 영향 | 상세 |
|---------------|------|------|
| regression/hooks-22.test.js | MODIFY | EXPECTED_HOOKS에 'TaskCreated' 추가. 파일명은 hooks-22로 유지하되 TC 수 +3 (총 28 TC) |
| integration/hook-wiring.test.js | MODIFY | task-created-handler.js 존재 확인 + require 패턴 검증 TC 추가 (+2 TC) |
| integration/hook-chain.test.js | VERIFY | TaskCreated → TaskCompleted 체인 검증 필요 여부 확인 |
| unit/ | NEW | task-created-handler.js 단위 테스트 (PDCA subject 감지, audit 로깅) ~5 TC |

### ENH-157 (paths: YAML List 문서화)

| 테스트 카테고리 | 영향 | 상세 |
|---------------|------|------|
| regression/skills-36.test.js | VERIFY | paths: 필드 파싱 테스트 추가 불필요 (CC가 파싱, bkit은 문서만) |
| 해당 없음 | — | 문서 변경만이므로 TC 변경 없음 |

---

## 9. Compatibility Assessment

| 항목 | 상태 |
|------|------|
| Breaking changes | **0건** |
| 연속 호환 릴리스 | **50번째** (v2.1.34 ~ v2.1.84) |
| Migration 필요 | **NO** |
| CC 권장 버전 | **v2.1.84+** |
| plugin.json engines | `">=2.1.78"` 유지 (변경 불필요) |

**v2.1.84 업그레이드 권장 이유**:
1. Cold-start race fix (B-84-14) — 세션 시작 안정성 향상
2. Workflow subagent 400 fix (B-84-6) — CTO Team 안정성 향상
3. MCP cache leak fix (B-84-10) — MCP 서버 장시간 운영 안정성
4. IME/CJK cursor fix (B-84-12) — 한국어 입력 개선
5. TaskCreated hook event — ENH-156 구현 기반

---

## 10. 기존 ENH 영향 재검토

| 기존 ENH | v2.1.84 영향 | 변경 사항 |
|----------|-------------|----------|
| ENH-134 (skills effort) | 영향 없음 | 여전히 미구현 — 37개 skills에 effort: 없음 |
| ENH-138 (--bare CI/CD) | 영향 없음 | 미구현 유지 |
| ENH-139+142 (plugin freshness) | 영향 없음 | 미구현 유지 |
| ENH-143 (병렬 agent spawn) | B-84-6으로 일부 완화 | workflow subagent 400 fix가 관련 이슈 일부 해결 가능 |
| ENH-148 (SessionStart env) | 영향 없음 | #37729 여전히 OPEN |
| ENH-149 (CwdChanged hook) | 영향 없음 | 미구현 유지 |
| ENH-150 (FileChanged hook) | 영향 없음 | 미구현 유지 |
| ENH-151 (self-healing frontmatter) | 확인 완료 | self-healing.md에 `reasoningEffort:` 사용 중 — `effort:` 아님. CC 공식은 `effort:`. 수정 필요 여부 확인 |

### ENH-151 후속 발견: self-healing.md frontmatter 불일치

self-healing.md에서 `reasoningEffort: high` 사용 중. CC 공식 agent frontmatter는 `effort:`. 이 불일치가 실제 동작에 영향을 주는지 확인 필요.

- 다른 31개 agents: 모두 `effort:` 사용 (올바름)
- self-healing.md만: `reasoningEffort: high` (CC가 인식하지 못할 가능성)
- **권장**: `reasoningEffort:` → `effort:` 로 수정 (ENH-151 범위)

---

## 11. GitHub Issues 영향 업데이트

| Issue | 상태 | v2.1.84 변경 |
|-------|------|-------------|
| #29423 (task subagents ignore CLAUDE.md) | OPEN | 영향 없음 |
| #34197 (CLAUDE.md ignored) | OPEN | 영향 없음 |
| #37520 (병렬 agent OAuth 401) | OPEN | B-84-6이 일부 관련 가능 |
| #37729 (SessionStart env /clear) | OPEN | 영향 없음 |
| #37745 (PreToolUse + skip-permissions) | OPEN | 영향 없음 |
| #38651 (Stop hook -p 모드) | OPEN | 영향 없음 |
| #38655 (fake plugin install) | OPEN | 영향 없음 |

---

## 12. 결론 및 권장 사항

### 즉시 조치 (P1)
1. **ENH-156**: TaskCreated hook 구현 — PDCA 워크플로우 추적성 강화
   - 예상 공수: ~2h
   - 파일: hooks.json, scripts/task-created-handler.js, 테스트 2개

### 단기 조치 (P2)
2. **ENH-157**: skill-create에 paths: YAML list 문서 추가
   - 예상 공수: ~30min
   - 파일: skills/skill-create/SKILL.md
3. **ENH-151 수정**: self-healing.md `reasoningEffort:` → `effort:` 변경
   - 예상 공수: ~5min

### 모니터링 (P3)
4. **ENH-158**: CLAUDE_STREAM_IDLE_TIMEOUT_MS — CTO Team 이슈 발생 시 대응
5. **ENH-159**: Workflow subagent fix — CC 업데이트로 자동 수혜

### CC 버전 권장
- **v2.1.84+** 업그레이드 권장
- plugin.json engines: `">=2.1.78"` 유지 (하위 호환성)
- 51번째 연속 호환 릴리스 확인

---

## Appendix A: ENH Summary Table

| ENH | Priority | CC Feature | bkit Impact | Affected Files | 상태 |
|-----|----------|------------|-------------|----------------|------|
| ENH-156 | P1 | TaskCreated hook event | PDCA Task 생성 추적 + audit | hooks.json, scripts/, test/ | 신규 |
| ENH-157 | P2 | paths: YAML list | skill-create 문서 업데이트 | skills/skill-create/SKILL.md | 신규 |
| ENH-158 | P3 | CLAUDE_STREAM_IDLE_TIMEOUT_MS | Monitor only | — | Monitor |
| ENH-159 | P3 | Workflow subagent fix | 자동 수혜 | — | 자동 해결 |

## Appendix B: 전체 CC v2.1.84 변경사항 bkit 영향 매핑

| # | CC 변경 | 유형 | bkit 영향 | 조치 필요 |
|---|---------|------|----------|----------|
| 1 | TaskCreated hook event | Feature | ENH-156 | YES |
| 2 | paths: YAML list | Feature | ENH-157 (문서) | YES (문서만) |
| 3 | Cold-start race fix | Bugfix | 자동 수혜 | NO |
| 4 | MCP 2KB description cap | Infra | 영향 없음 (안전) | NO |
| 5 | ANTHROPIC_DEFAULT_*_MODEL_SUPPORTS | Feature | 영향 없음 | NO |
| 6 | CLAUDE_STREAM_IDLE_TIMEOUT_MS | Feature | ENH-158 (monitor) | NO |
| 7 | Idle-return 75min+ prompt | Feature | 영향 없음 | NO |
| 8 | System-prompt caching | Feature | 자동 수혜 | NO |
| 9 | Workflow subagent 400 fix | Bugfix | ENH-159 (자동) | NO |
| 10 | File attachment hang fix | Bugfix | 영향 없음 | NO |
| 11 | MCP cache leak fix | Bugfix | 자동 수혜 | NO |
| 12 | PowerShell tool | Feature | 영향 없음 (Windows) | NO |
| 13 | IME/CJK cursor fix | Bugfix | 자동 수혜 (한국어) | NO |
| 14 | Bare #123 auto-link removed | BC | 영향 없음 | NO |
