# bkit v1.5.1 Comprehensive Test - Hook & Script Integration Test Design

> **Summary**: hooks.json 8개 Hook Event(11개 핸들러) + 43개 Scripts 실제 실행 통합 테스트
>
> **Project**: bkit-claude-code
> **Version**: 1.5.1
> **Author**: qa-hooks (bkit Comprehensive Test Team)
> **Date**: 2026-02-06
> **Status**: Executed (87.8% Pass Rate)

---

## 1. 테스트 범위

### 1.1 hooks.json 정의 이벤트 (8 Events, 11 Handlers)

| # | Event | Matcher | Script | Timeout |
|---|-------|---------|--------|---------|
| 1 | SessionStart | (once: true) | hooks/session-start.js | 5000ms |
| 2 | PreToolUse | Write\|Edit | scripts/pre-write.js | 5000ms |
| 3 | PreToolUse | Bash | scripts/unified-bash-pre.js | 5000ms |
| 4 | PostToolUse | Write | scripts/unified-write-post.js | 5000ms |
| 5 | PostToolUse | Bash | scripts/unified-bash-post.js | 5000ms |
| 6 | PostToolUse | Skill | scripts/skill-post.js | 5000ms |
| 7 | Stop | (global) | scripts/unified-stop.js | 10000ms |
| 8 | UserPromptSubmit | (global) | scripts/user-prompt-handler.js | 3000ms |
| 9 | PreCompact | auto\|manual | scripts/context-compaction.js | 5000ms |
| 10 | TaskCompleted | (global) | scripts/pdca-task-completed.js | 5000ms |
| 11 | TeammateIdle | (global) | scripts/team-idle-handler.js | 5000ms |

### 1.2 추가 Scripts (Phase/Agent 전용, 32개)

**Phase Stop Scripts (9개)**:
phase1-schema-stop.js, phase2-convention-stop.js, phase3-mockup-stop.js, phase4-api-stop.js, phase5-design-stop.js, phase6-ui-stop.js, phase7-seo-stop.js, phase8-review-stop.js, phase9-deploy-stop.js

**Phase Pre/Post Scripts (5개)**:
phase2-convention-pre.js, phase5-design-post.js, phase6-ui-post.js, phase9-deploy-pre.js, code-analyzer-pre.js

**Agent Stop Scripts (7개)**:
gap-detector-stop.js, iterator-stop.js, code-review-stop.js, analysis-stop.js, learning-stop.js, qa-stop.js, pdca-skill-stop.js

**Agent Pre/Post Scripts (3개)**:
design-validator-pre.js, gap-detector-post.js, qa-monitor-post.js

**Team Scripts (2개)**:
team-stop.js, cto-stop.js

**QA Scripts (1개)**:
qa-pre-bash.js

**Utility Scripts (5개)**:
archive-feature.js, phase-transition.js, select-template.js, sync-folders.js, validate-plugin.js

---

## 2. 테스트 방법론

### 2.1 실행 환경
```
CLAUDE_PLUGIN_ROOT=/Users/popup-kay/Documents/GitHub/popup/bkit-claude-code
Node.js v22.21.1
Platform: darwin (macOS)
```

### 2.2 실행 방식
```bash
echo '<JSON_INPUT>' | node <script_path> 2>&1
```
- stdin으로 JSON 입력 전달
- stdout + stderr 캡처
- exit code 확인

### 2.3 출력 함수 스펙 (lib/core/io.js)

| 함수 | SessionStart/UserPromptSubmit | PreToolUse/PostToolUse/Stop |
|------|------|------|
| outputAllow(msg, event) | `{"success":true,"message":"..."}` (JSON) | plain text 출력 |
| outputBlock(reason) | `{"decision":"block","reason":"..."}` (JSON) | `{"decision":"block","reason":"..."}` (JSON) |
| outputEmpty() | 출력 없음 | 출력 없음 |

### 2.4 검증 기준
1. Exit code 0 (정상 종료)
2. 출력 형식이 해당 이벤트 스펙에 맞는지
3. hookSpecificOutput 또는 적절한 메시지 포함 여부
4. 에러 없이 실행 완료

---

## 3. 테스트 케이스 상세

### 3.1 hooks.json Events (TC-H01 ~ TC-H11)

#### TC-H01: SessionStart
```
Input: {}
Expected: JSON with hookEventName:"SessionStart", onboardingType, hasExistingWork
```

#### TC-H02: PreToolUse(Write) - Non-source file
```
Input: {"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js","content":"const x = 1;"}}
Expected: outputEmpty (빈 출력) - /tmp 경로는 source file 아님
```

#### TC-H02b: PreToolUse(Write) - Source file (30+ lines)
```
Input: {"tool_name":"Write","tool_input":{"file_path":"src/components/Login.tsx","content":"...(31 lines)"}}
Expected: PDCA context 또는 빈 출력 (feature 미감지 시)
```

#### TC-H03: PreToolUse(Bash) - Safe command
```
Input: {"tool_name":"Bash","tool_input":{"command":"ls -la"}}
Expected: "Bash command validated." (plain text)
```

#### TC-H04: PostToolUse(Write)
```
Input: {"tool_name":"Write","tool_input":{"file_path":"/tmp/test.js"},"tool_output":"success"}
Expected: outputAllow 빈 (PostToolUse는 blocking 불가)
```

#### TC-H05: PostToolUse(Bash)
```
Input: {"tool_name":"Bash","tool_input":{"command":"npm test"},"tool_output":"all tests passed"}
Expected: outputAllow 빈 (qa-monitor context 없음)
```

#### TC-H06: PostToolUse(Skill)
```
Input: {"tool_input":{"skill":"pdca","args":"plan test-feature"}}
Expected: JSON with skill info 또는 skip (async stdin 파싱)
```

#### TC-H07: Stop (no context)
```
Input: {}
Expected: "Stop event processed." (default handler)
```

#### TC-H08: UserPromptSubmit
```
Input: {"prompt":"코드 리뷰 해줘"}
Expected: outputEmpty 또는 JSON with triggers
```

#### TC-H09: PreCompact
```
Input: {"reason":"auto"}
Expected: JSON with hookEventName:"PreCompact", additionalContext (PDCA state)
```

#### TC-H10: TaskCompleted
```
Input: {"task_subject":"[Plan] test-feature"}
Expected: PDCA phase 감지 + auto-advance 또는 완료 메시지
```

#### TC-H11: TeammateIdle
```
Input: {"teammate_id":"qa-agent"}
Expected: JSON with hookEventName:"TeammateIdle", teammateId, nextTask
```

### 3.2 Phase Scripts (TC-H12 ~ TC-H23)

| TC | Script | Input | Expected |
|---|---|---|---|
| H12 | phase1-schema-stop.js | `{}` | Phase 1 완료 안내 |
| H13 | phase2-convention-stop.js | `{}` | Phase 2 완료 안내 |
| H14 | phase3-mockup-stop.js | `{}` | Phase 3 완료 안내 |
| H15 | phase4-api-stop.js | `{}` | API Phase 완료 안내 |
| H16 | phase5-design-stop.js | `{}` | JSON with phase=5, nextPhase |
| H17 | phase5-design-post.js | Write components/Button.tsx | Design token 검사 또는 빈 출력 |
| H18 | phase6-ui-stop.js | `{}` | JSON with phase=6, qualityCheck |
| H19 | phase6-ui-post.js | Write pages/index.tsx | UI Layer Check 메시지 |
| H20 | phase7-seo-stop.js | `{}` | Phase 7 완료 안내 |
| H21 | phase8-review-stop.js | `{}` | Code Review 완료 안내 |
| H22 | phase9-deploy-stop.js | `{}` | JSON with phase=9, pipelineComplete |
| H23 | phase9-deploy-pre.js | Bash docker build | 빈 출력 (안전한 명령) |

### 3.3 Agent Scripts (TC-H24 ~ TC-H32, H37)

| TC | Script | Input | Expected |
|---|---|---|---|
| H24 | code-analyzer-pre.js | any | `{"decision":"block","reason":"read-only"}` |
| H25 | code-review-stop.js | `{}` | 코드 리뷰 완료 안내 |
| H26 | design-validator-pre.js | Write src/Button.tsx | 빈 출력 (design doc 아님) |
| H27 | gap-detector-post.js | Write .analysis.md | Gap Analysis 완료 메시지 |
| H28 | gap-detector-stop.js | matchRate 85% | JSON with matchRate=85, nextStep |
| H29 | qa-monitor-post.js | Write QA report | QA Report saved 메시지 |
| H30 | qa-pre-bash.js | safe command | Allow 메시지 |
| H31 | qa-pre-bash.js | `rm -rf` | `{"decision":"block"}` |
| H32 | qa-stop.js | `{}` | QA Session 완료 메시지 |
| H37 | iterator-stop.js | matchRate 92% | JSON with iteration result |

### 3.4 PDCA/Utility Scripts (TC-H33 ~ TC-H49)

| TC | Script | Input | Expected |
|---|---|---|---|
| H33 | learning-stop.js | args "learn 3" | JSON with level, suggestions |
| H34 | analysis-stop.js | `{}` | Gap Analysis 완료 안내 |
| H35 | pdca-skill-stop.js | pdca plan | JSON with hookEventName |
| H36 | pdca-post-write.js | Write src/lib/utils.ts | 빈 출력 (design doc 없음) |
| H38 | team-stop.js | run({}) | "Team session ended." |
| H39 | cto-stop.js | run({}) | "CTO session ended." |
| H40 | phase-transition.js | phase 1 | Phase 전환 안내 |
| H41 | select-template.js | 인자 없음 | Usage 출력 (exit 1) |
| H42 | sync-folders.js | 인자 없음 | Sync 완료 메시지 |
| H43 | validate-plugin.js | 인자 없음 | Validation 결과 |
| H44 | archive-feature.js | 인자 없음 | Usage 출력 (exit 1) |
| H45 | phase2-convention-pre.js | Write src/test.js | Convention Check 메시지 |
| H46 | user-prompt-handler.js | Korean "로그인 기능" | JSON with skill trigger |
| H47 | user-prompt-handler.js | English "analyze code" | Agent trigger 또는 빈 출력 |
| H48 | pdca-task-completed.js | [Design] login-feature | PDCA phase 감지 메시지 |
| H49 | unified-bash-pre.js | kubectl delete | Allow (skill context 없음) |

---

## 4. 실행 결과 요약

### 4.1 카테고리별 성공률

| 카테고리 | 총 TC | PASS | FAIL | 성공률 |
|---|---|---|---|---|
| hooks.json Events (11개 핸들러) | 11 | 11 | 0 | **100%** |
| Phase Scripts (12개) | 12 | 8 | 4 | **67%** |
| Agent Scripts (10개) | 10 | 9 | 1 | **90%** |
| PDCA/Utility Scripts (16개) | 16 | 15 | 1 | **94%** |
| **합계** | **49** | **43** | **6** | **87.8%** |

### 4.2 FAIL 상세

#### BUG-H01: checkPhaseDeliverables 시그니처 불일치 (Critical)
- **영향 스크립트**: phase1-schema-stop.js, phase2-convention-stop.js, phase3-mockup-stop.js, phase7-seo-stop.js, phase-transition.js
- **원인**: `lib/pdca/phase.js:133`의 `checkPhaseDeliverables(phase, feature)` 함수는 두 인자 필요하나, 호출측에서 `checkPhaseDeliverables(1)` 처럼 숫자 하나만 전달
- **에러**: `TypeError: Cannot read properties of undefined (reading 'map')` - 반환값 `{exists:false, path:null}`에 `.items` 프로퍼티 없음
- **심각도**: 해당 Phase의 Stop 이벤트 발생 시 크래시 (하지만 unified-stop.js가 try-catch로 감싸므로 전체 시스템 장애는 아님)

#### BUG-H02: iterator-stop.js phaseAdvance null 체크 누락 (Medium)
- **위치**: `scripts/iterator-stop.js:312`
- **원인**: `autoAdvancePdcaPhase()` 반환값이 null일 때 `.nextPhase` 접근에서 TypeError
- **심각도**: pdca-iterator agent Stop 시 크래시

#### BUG-H03: readBkitMemory 함수 미존재 (Low)
- **영향**: phase5-design-stop.js, phase6-ui-stop.js, phase9-deploy-stop.js
- **에러**: `lib.readBkitMemory is not a function` (try-catch 처리됨, non-fatal)
- **심각도**: 메인 로직 정상 동작하나 Memory 연동 비활성

---

## 5. 아키텍처 분석

### 5.1 출력 패턴 분류

```
[SessionStart/UserPromptSubmit] → JSON 출력 (outputAllow가 JSON 생성)
[PreToolUse]                    → plain text 또는 JSON block
[PostToolUse]                   → plain text (non-blocking)
[Stop]                          → plain text 또는 JSON (스크립트에 따라)
[PreCompact]                    → JSON with hookSpecificOutput
[TaskCompleted]                 → plain text 또는 JSON with hookSpecificOutput
[TeammateIdle]                  → JSON with hookSpecificOutput
```

### 5.2 Unified Handler 패턴

```
unified-stop.js      ← 모든 Stop 이벤트 → skill/agent 감지 후 개별 핸들러 위임
unified-write-post.js ← Write PostToolUse → pdca-post-write + phase5/6/qa-monitor
unified-bash-pre.js  ← Bash PreToolUse    → phase9-deploy-pre + qa-pre-bash
unified-bash-post.js ← Bash PostToolUse   → qa-monitor 전용
```

### 5.3 module.exports 패턴

| 패턴 | 스크립트 | 호출 방식 |
|---|---|---|
| 자체 실행 (stdin 직접 읽기) | session-start.js, gap-detector-stop.js, iterator-stop.js 등 | `node script.js` |
| `module.exports = { run }` | team-stop.js, cto-stop.js, pdca-post-write.js | `require(path).run(context)` |
| async main() | skill-post.js, learning-stop.js | `node script.js` (내부 async) |

---

## 6. 사전/사후 조건

### 6.1 사전 조건
- `CLAUDE_PLUGIN_ROOT` 환경변수 설정 필수
- `docs/.pdca-status.json` 파일 존재 (SessionStart에서 자동 생성)
- `bkit.config.json` 파일 존재

### 6.2 사후 처리
- context-compaction.js가 `docs/.pdca-snapshots/` 디렉토리에 스냅샷 생성
- pdca-task-completed.js, gap-detector-stop.js 등이 `.pdca-status.json` 수정
- archive-feature.js가 문서를 `docs/archive/`로 이동

### 6.3 데이터 보호
- 테스트 전 `.pdca-status.json`, `.bkit-memory.json` 백업 필수
- 테스트 후 복원 필수
