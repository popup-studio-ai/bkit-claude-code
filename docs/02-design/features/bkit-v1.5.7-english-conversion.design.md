# Design: bkit v1.5.7 Codebase English Conversion

> Feature: bkit-v1.5.7-english-conversion
> Created: 2026-02-28
> Status: Draft
> Depends On: [Plan](../../01-plan/features/bkit-v1.5.7-english-conversion.plan.md)

---

## 1. Architecture Overview

```
Conversion Pipeline (4 Phases, 55 files, ~2,856 Korean lines)
═══════════════════════════════════════════════════════════════

Phase 1: JS lib/ (12 files, ~130 lines)
  └── JSDoc annotations + inline comments → English translation
  └── Verification: require('./lib/common.js') + grep

Phase 2: JS scripts/ (19 files, ~120 lines)
  └── String literals (UI messages, labels) → English translation
  └── JSDoc + inline comments → English translation
  └── Scattered version comments → English translation
  └── Verification: grep + functional review

Phase 3: Documentation (19 files, ~2,564 lines)
  ├── 3A: Operational docs (7 files, ~320 lines) → Full translation
  ├── 3B: Research/Strategy docs (2 files, ~650 lines) → Full translation
  └── 3C: Enterprise planning docs (10 files, ~1,594 lines) → Full translation
  └── Verification: grep comprehensive scan

Phase 4: Templates, Agent, Config (5 files, ~42 lines)
  └── Template example data + descriptions → English translation
  └── Agent description blocks → English translation
  └── JSON/memory fields → English translation
  └── Verification: final comprehensive scan

═══════════════════════════════════════════════════════════════
Exclusion Guards (applied throughout all phases):
  ✗ docs/archive/** (historical records)
  ✗ 8-language trigger keywords (Triggers: lines in agents/skills/output-styles)
  ✗ ko: arrays in lib/intent/language.js (functional Korean triggers)
  ✗ Korean regex in gap-detector-stop.js, iterator-stop.js (functional patterns)
  ✗ Korean regex in trigger.js line 115 (functional pattern)
  ✗ Korean in session-start.js trigger tables (8-lang reference)
  ✗ Korean in code examples documenting runtime triggers
  ✗ Korean references in test case descriptions (quoting Korean patterns)
```

## 2. Exclusion Guard — No-Touch List

These locations MUST NOT be modified. Any conversion pass must verify these remain unchanged.

### 2.1 Functional Korean (Runtime Code)

| File | Lines | Content | Why Excluded |
|------|:-----:|---------|:------------:|
| `lib/intent/language.js` | 18,28,38,48,58,68,78,92,102,118,128,138,148 | `ko: [...]` arrays (13 total) | Korean intent detection |
| `lib/intent/trigger.js` | 115 | `이름이?` regex | Korean name pattern matching |
| `scripts/gap-detector-stop.js` | 56-57 | `매치율\|일치율` regex | Parses Korean agent output |
| `scripts/iterator-stop.js` | 66,82-85 | `완료\|성공\|개선\|수정\|파일\|반복\|최대\|매치율\|일치율` regex | Parses Korean agent output |

### 2.2 8-Language Trigger Keywords

| Location | Count | Pattern |
|----------|:-----:|---------|
| `agents/*.md` Triggers: lines | 16 files | Korean alongside JP/ZH/ES/FR/DE/IT |
| `skills/*/SKILL.md` Triggers: lines | 27 files | Korean alongside JP/ZH/ES/FR/DE/IT |
| `output-styles/*.md` trigger lines | 4 files | Korean alongside JP in frontmatter |
| `commands/bkit.md` line 10 | 1 | Korean alongside JP/ZH |
| `commands/output-style-setup.md` line 8 | 1 | Korean alongside JP |
| `hooks/session-start.js` lines 481-494 | ~14 lines | Korean in 8-lang trigger table |
| `README.md` line 390 | 1 | Korean language row |
| `CUSTOMIZATION-GUIDE.md` line 800 | 1 | Multi-lang example |
| `_skills-overview.md` line 153 | 1 | Trigger template example |
| `_agents-overview.md` line 146 | 1 | Trigger template example |

### 2.3 Korean in Code Examples (Documenting Runtime Behavior)

| File | Lines | Content |
|------|:-----:|---------|
| `bkit-system/philosophy/context-engineering.md` | 319, 323 | Regex examples: `맞아?`, `개선해줘` |
| `bkit-system/components/scripts/_scripts-overview.md` | 300-301 | API call examples with Korean input |

### 2.4 Test Case References (Quoting Korean Patterns)

| File | Lines | Content |
|------|:-----:|---------|
| `docs/01-plan/features/bkit-v1.5.7-comprehensive-test.plan.md` | 176,191,224,228,507,703 | Test cases referencing Korean regex |
| `docs/02-design/features/bkit-v1.5.7-comprehensive-test.design.md` | 149,163,192-195,291-292,474,519-627 | Test designs referencing Korean triggers |
| `docs/03-analysis/features/bkit-v1.5.7-comprehensive-test.analysis.md` | 174-175 | Analysis results citing Korean regex |
| `docs/04-report/features/bkit-v1.5.7-comprehensive-test.report.md` | 87-88 | Report citing Korean regex |

## 3. Phase 1: JS lib/ Files (12 files, ~130 lines)

All changes in this phase are JSDoc annotations and inline comments. No string literals or runtime behavior affected.

### 3.1 lib/core/cache.js (6 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 20 | `* 캐시에서 값 조회` | `* Retrieve value from cache` |
| 38 | `* 캐시에 값 저장` | `* Store value in cache` |
| 50 | `* 캐시 무효화` | `* Invalidate cache entry` |
| 66 | `* 캐시 전체 삭제` | `* Clear entire cache` |
| 73 | `* 글로벌 캐시 인스턴스` | `* Global cache instance` |
| 84 | `// 레거시 호환` | `// Legacy compatibility` |

### 3.2 lib/core/config.js (6 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 29 | `* bkit.config.json 로드` | `* Load bkit.config.json` |
| 50 | `// 파싱 실패 시 다음 경로 시도` | `// Try next path on parse failure` |
| 59 | `* 설정값 조회 (dot notation)` | `* Retrieve config value (dot notation)` |
| 81 | `* 배열 설정값을 공백 구분 문자열로 조회` | `* Retrieve array config value as space-separated string` |
| 95 | `* 전체 bkit 설정 조회 (환경변수 오버라이드 포함)` | `* Retrieve full bkit config (including env var overrides)` |
| 145 | `* 안전한 JSON 파싱` | `* Safe JSON parsing` |

### 3.3 lib/core/debug.js (6 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* Claude Code 전용 플러그인으로 단순화 (v1.5.0)` | `* Simplified as Claude Code exclusive plugin (v1.5.0)` |
| 22 | `* 로그 파일 경로` | `* Log file path` |
| 34 | `* 디버그 로그 파일 경로 반환` | `* Return debug log file path` |
| 44 | `* 디버그 로그 기록` | `* Write debug log entry` |
| 68 | `// 로그 실패 시 무시` | `// Ignore log write failures` |
| 72 | `// 레거시 호환: DEBUG_LOG_PATHS 상수` | `// Legacy compatibility: DEBUG_LOG_PATHS constant` |

### 3.4 lib/core/file.js (12 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 19 | `* Tier별 확장자 매핑` | `* File extension mapping by tier` |
| 30 | `* 기본 제외 패턴` | `* Default exclusion patterns` |
| 38 | `* 기본 Feature 패턴` | `* Default feature patterns` |
| 39 | `* Feature 추출 시 사용되는 디렉토리 패턴` | `* Directory patterns used for feature extraction` |
| 46 | `* 소스 파일 여부` | `* Check if source file` |
| 64 | `// 제외 패턴 체크` | `// Check exclusion patterns` |
| 73 | `* 코드 파일 여부` | `* Check if code file` |
| 84 | `* UI 컴포넌트 파일 여부` | `* Check if UI component file` |
| 95 | `* 환경설정 파일 여부` | `* Check if configuration file` |
| 105 | `* 파일 경로에서 Feature 이름 추출` | `* Extract feature name from file path` |
| 106 | `* @param {string} filePath - 파일 경로` | `* @param {string} filePath - File path` |
| 107 | `* @returns {string} Feature 이름 또는 빈 문자열` | `* @returns {string} Feature name or empty string` |

### 3.5 lib/core/index.js (1 line)

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* Claude Code 전용 플러그인으로 단순화 (v1.5.0)` | `* Simplified as Claude Code exclusive plugin (v1.5.0)` |

### 3.6 lib/core/io.js (11 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* Claude Code 전용 플러그인으로 단순화 (v1.5.0)` | `* Simplified as Claude Code exclusive plugin (v1.5.0)` |
| 14 | `* 컨텍스트 문자열 자르기` | `* Truncate context string` |
| 25 | `* stdin에서 JSON 동기적 읽기` | `* Read JSON synchronously from stdin` |
| 38 | `* stdin에서 JSON 비동기 읽기` | `* Read JSON asynchronously from stdin` |
| 57 | `* Hook 입력 파싱` | `* Parse hook input` |
| 72 | `* 허용 결정 출력 (Claude Code 전용)` | `* Output allow decision (Claude Code only)` |
| 92 | `* 차단 결정 출력 (Claude Code 전용)` | `* Output block decision (Claude Code only)` |
| 104 | `* 빈 출력 (Claude Code는 아무것도 출력하지 않음)` | `* Empty output (Claude Code outputs nothing)` |
| 107 | `// Claude Code는 빈 출력 시 아무것도 출력하지 않음` | `// Claude Code outputs nothing on empty output` |
| 111 | `* XML 특수문자 이스케이프` | `* Escape XML special characters` |

### 3.7 lib/core/platform.js (9 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* Claude Code 전용 플러그인으로 단순화 (v1.5.0)` | `* Simplified as Claude Code exclusive plugin (v1.5.0)` |
| 16 | `* 현재 플랫폼 감지` | `* Detect current platform` |
| 30 | `* Claude Code 여부` | `* Check if Claude Code` |
| 38 | `* 플러그인 루트 경로` | `* Plugin root path` |
| 44 | `* 프로젝트 디렉토리 경로` | `* Project directory path` |
| 50 | `* 레거시 호환 상수` | `* Legacy compatibility constants` |
| 56 | `* 플러그인 내 상대 경로 해결` | `* Resolve relative path within plugin` |
| 65 | `* 프로젝트 내 상대 경로 해결` | `* Resolve relative path within project` |
| 74 | `* 템플릿 파일 경로 반환` | `* Return template file path` |

### 3.8 lib/pdca/automation.js (4 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 260 | `* v1.5.1: TaskCompleted 이벤트에서 PDCA phase 감지` | `* v1.5.1: Detect PDCA phase from TaskCompleted event` |
| 261 | `* @param {string} taskSubject - 완료된 Task의 subject` | `* @param {string} taskSubject - Subject of the completed task` |
| 287 | `* v1.5.1: TaskCompleted 후 다음 PDCA 액션 결정` | `* v1.5.1: Determine next PDCA action after TaskCompleted` |
| 288 | `* @param {string} phase - 완료된 phase` | `* @param {string} phase - Completed phase` |

### 3.9 lib/pdca/status.js (32 lines)

All inline comments — step annotations and validation logic:

| Line | Korean | English |
|:----:|--------|---------|
| 361 | `// Validation 1: Status 존재 확인` | `// Validation 1: Verify status exists` |
| 366 | `// Validation 2: Feature 존재 확인` | `// Validation 2: Verify feature exists` |
| 371 | `// Validation 3: 활성 feature 삭제 방지 (archived/completed가 아닌 경우)` | `// Validation 3: Prevent deleting active features (non-archived/completed)` |
| 379 | `// Step 1: features 객체에서 삭제` | `// Step 1: Delete from features object` |
| 382 | `// Step 2: activeFeatures 배열에서 제거` | `// Step 2: Remove from activeFeatures array` |
| 385 | `// Step 3: primaryFeature 업데이트` | `// Step 3: Update primaryFeature` |
| 390 | `// Step 4: History 기록` | `// Step 4: Record history` |
| 397 | `// Step 5: History 제한 적용 (100개)` | `// Step 5: Apply history limit (100 entries)` |
| 402 | `// Step 6: 저장` | `// Step 6: Save` |
| 425 | `// 제한 이내면 아무것도 하지 않음` | `// No action if within limit` |
| 430 | `// Archived/completed features만 필터링하고 날짜순 정렬 (오래된 순)` | `// Filter archived/completed features and sort by date (oldest first)` |
| 436 | `return dateA - dateB;  // 오래된 것이 앞으로` | `return dateA - dateB;  // Oldest first` |
| 439 | `// 삭제할 개수 계산` | `// Calculate number to delete` |
| 443 | `// 오래된 archived부터 삭제` | `// Delete oldest archived first` |
| 448 | `// activeFeatures에서도 제거 (혹시 남아있다면)` | `// Also remove from activeFeatures (if still present)` |
| 454 | `// 삭제 결과 없으면 (archived feature가 부족)` | `// If no deletions made (insufficient archived features)` |
| 465 | `// History 기록` | `// Record history` |
| 473 | `// History 제한 적용` | `// Apply history limit` |
| 478 | `// primaryFeature 업데이트` | `// Update primaryFeature` |
| 520 | `// 삭제 대상 결정` | `// Determine deletion targets` |
| 527 | `// Archived/Completed가 아니면 스킵` | `// Skip if not archived/completed` |
| 547 | `// History 기록` | `// Record history` |
| 555 | `// History 제한` | `// Apply history limit` |
| 560 | `// primaryFeature 업데이트` | `// Update primaryFeature` |
| 586 | `// Validation 1: Status 존재 확인` | `// Validation 1: Verify status exists` |
| 591 | `// Validation 2: Feature 존재 확인` | `// Validation 2: Verify feature exists` |
| 598 | `// Validation 3: archived 또는 completed 상태만 변환 가능` | `// Validation 3: Only archived or completed status can be converted` |
| 603 | `// 요약 정보로 변환 (70% 크기 감소)` | `// Convert to summary (70% size reduction)` |
| 613 | `// activeFeatures에서 제거 (혹시 남아있다면)` | `// Remove from activeFeatures (if still present)` |
| 616 | `// primaryFeature 업데이트` | `// Update primaryFeature` |
| 621 | `// History 기록` | `// Record history` |
| 628 | `// History 제한 적용 (100개)` | `// Apply history limit (100 entries)` |

### 3.10 lib/skill-orchestrator.js — JSDoc only (5 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 3 | `* Skill Orchestrator - Skills 유기적 동작 관리 (v1.4.4)` | `* Skill Orchestrator - Organic skill behavior management (v1.4.4)` |
| 5 | `* 역할:` | `* Responsibilities:` |
| 6 | `* 1. Skill frontmatter 파싱 및 확장 필드 처리` | `* 1. Parse skill frontmatter and handle extension fields` |
| 7-10 | (4 more JSDoc lines) | (See Phase 2 for string literals in same file) |

### 3.11 lib/team/coordinator.js (12 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* Agent Teams 가용성 확인 및 Team 설정 관리` | `* Check Agent Teams availability and manage team configuration` |
| 10 | `* Agent Teams 사용 가능 여부 확인` | `* Check if Agent Teams is available` |
| 11 | `* - CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 환경변수 체크` | `* - Check CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1 env var` |
| 19 | `* Team 설정 로드` | `* Load team configuration` |
| 20 | `* bkit.config.json의 team 섹션에서 설정 로드` | `* Load configuration from team section of bkit.config.json` |
| 22 | `* @property {boolean} enabled - Team Mode 활성화 여부` | `* @property {boolean} enabled - Whether Team Mode is enabled` |
| 24 | `* @property {number} maxTeammates - 최대 teammate 수 (기본: 4)` | `* @property {number} maxTeammates - Maximum teammate count (default: 4)` |
| 25 | `* @property {boolean} delegateMode - Delegate Mode 사용 여부` | `* @property {boolean} delegateMode - Whether to use Delegate Mode` |
| 49 | `* 레벨별 Team 전략 생성` | `* Generate team strategy by level` |
| 60 | `* Team 상태 포맷팅 (PDCA 상태와 통합)` | `* Format team status (integrated with PDCA status)` |
| 92-97 | (6 JSDoc lines for shouldSuggestTeamMode) | `* Determine whether to auto-suggest team mode` ... |

### 3.12 lib/team/state-writer.js (33 lines)

All JSDoc and inline comments for state persistence module. Key translations:

| Line | Korean | English |
|:----:|--------|---------|
| 6 | `* bkit Studio와 공유하기 위한 팀 상태 디스크 영속화 모듈.` | `* Team state disk persistence module for sharing with bkit Studio.` |
| 7 | `* .bkit/agent-state.json에 팀 런타임 상태를 원자적으로 기록.` | `* Atomically writes team runtime state to .bkit/agent-state.json.` |
| 67-68 | `* agent-state.json 파일 경로 반환` / `* @returns {string} 절대 경로` | `* Return agent-state.json file path` / `* @returns {string} Absolute path` |
| 76-77 | `* 디스크에서 현재 agent state 읽기` / `* @returns ... 또는 null (파일 미존재 시)` | `* Read current agent state from disk` / `* @returns ... or null (if file not found)` |
| 93-94 | `* agent state를 디스크에 원자적으로 기록` / `* @param {Object} state - AgentState 객체` | `* Atomically write agent state to disk` / `* @param {Object} state - AgentState object` |
| 104-142 | (20 more JSDoc/comment lines for addTeammate, updateTeammateStatus, etc.) | (Full English translations — teammate management, ring buffer, session cleanup) |
| 168-323 | (Remaining JSDoc for addTeammate through cleanupSession) | All `@param` descriptions and inline comments |

## 4. Phase 2: JS scripts/ Files (19 files, ~120 lines)

### 4.1 lib/skill-orchestrator.js — String Literals (10 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 377 | `` `${subject} 진행 중` `` | `` `${subject} in progress` `` |
| 424 | `'구현이 완료되면 Gap 분석을 실행하세요.'` | `'Run Gap analysis when implementation is complete.'` |
| 427 | `'매치율이 90% 미만이면 자동 개선을 실행하세요.'` | `'Run auto-improvement if match rate is below 90%.'` |
| 443 | `'스키마/용어 정의를 시작하세요.'` | `'Start defining schema/terminology.'` |
| 444 | `'코딩 컨벤션을 정의하세요.'` | `'Define coding conventions.'` |
| 445 | `'목업을 작성하세요.'` | `'Create mockups.'` |
| 446 | `'API를 설계하세요.'` | `'Design the API.'` |
| 447 | `'디자인 시스템을 구축하세요.'` | `'Build the design system.'` |
| 448 | `'UI를 구현하세요.'` | `'Implement the UI.'` |
| 449 | `'SEO/보안을 점검하세요.'` | `'Review SEO/security.'` |
| 450 | `'코드 리뷰를 진행하세요.'` | `'Proceed with code review.'` |
| 451 | `'배포를 준비하세요.'` | `'Prepare for deployment.'` |
| 454 | `` `다음 단계: ${nextSkillName}` `` | `` `Next step: ${nextSkillName}` `` |

### 4.2 scripts/pdca-skill-stop.js (~40 lines)

Complete PDCA phase transition UI — all `message:`, `question:`, `label:`, `description:` fields:

| Lines | Korean Pattern | English Pattern |
|:-----:|---------------|----------------|
| 51 | `'Plan 완료. Design 단계로 진행하세요.'` | `'Plan complete. Proceed to Design phase.'` |
| 56 | `skill: null,  // 구현은 수동` | `skill: null,  // Implementation is manual` |
| 57 | `'Design 완료. 구현을 시작하세요.'` | `'Design complete. Start implementation.'` |
| 63 | `'구현 완료. Gap 분석을 실행하세요.'` | `'Implementation complete. Run Gap analysis.'` |
| 67 | `// 조건부 전환` | `// Conditional transition` |
| 73 | `'Check 통과! 완료 보고서를 생성하세요.'` | `'Check passed! Generate completion report.'` |
| 80 | `'Check 미달. 자동 개선을 실행하세요.'` | `'Check failed. Run auto-improvement.'` |
| 88 | `'Act 완료. 재검증을 실행하세요.'` | `'Act complete. Run re-verification.'` |
| 103 | `// 조건부 전환 처리` | `// Handle conditional transition` |
| 118 | `// 일반 전환` | `// Standard transition` |
| 169-219 | (All phase guidance messages and AskUserQuestion options) | (Full English translations) |
| 268 | `` `자동 진행: ${autoTrigger.skill}` `` | `` `Auto-advancing: ${autoTrigger.skill}` `` |
| 307 | `` `PDCA Task Chain 생성됨 (${chain.entries.length}개 Task)` `` | `` `PDCA Task Chain created (${chain.entries.length} tasks)` `` |
| 391-394 | AskUserQuestion mandatory prompt | Convert all Korean instruction text to English |

**Key translations for UI labels:**

| Korean | English |
|--------|---------|
| `'Design 진행 (권장)'` | `'Proceed to Design (Recommended)'` |
| `'나중에'` | `'Later'` |
| `'현재 상태 유지'` | `'Keep current status'` |
| `'구현 시작 (권장)'` | `'Start implementation (Recommended)'` |
| `'Gap 분석 실행'` | `'Run Gap analysis'` |
| `'계속 구현'` | `'Continue implementation'` |
| `'구현 계속 진행'` | `'Continue with implementation'` |
| `'자동 개선'` | `'Auto-improvement'` |
| `'완료 보고서'` | `'Completion report'` |
| `'수동 수정'` | `'Manual fix'` |
| `'직접 코드 수정 후 재분석'` | `'Fix code manually then re-analyze'` |
| `'재분석 (권장)'` | `'Re-analyze (Recommended)'` |
| `'아카이브'` | `'Archive'` |
| `'/archive 명령으로 문서 정리'` | `'Organize documents with /archive command'` |
| `'새 기능 시작'` | `'Start new feature'` |

### 4.3 scripts/phase5-design-stop.js (10 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 31 | `'UI 컴포넌트 라이브러리 구축'` | `'Build UI component library'` |
| 32 | `'디자인 토큰 정의 (colors, spacing, typography)'` | `'Define design tokens (colors, spacing, typography)'` |
| 33 | `'컴포넌트 문서화'` | `'Document components'` |
| 34 | `'Storybook 설정 (선택)'` | `'Configure Storybook (optional)'` |
| 40 | `description: 'UI 구현 및 API 연동'` | `description: 'UI implementation and API integration'` |
| 43 | `question: 'Design System 구축이 완료되었습니다...'` | `question: 'Design System is complete...'` |
| 45 | `{ label: '예, Phase 6 진행', value: 'proceed' }` | `{ label: 'Yes, proceed to Phase 6', value: 'proceed' }` |
| 46 | `{ label: '추가 컴포넌트 작업', value: 'continue' }` | `{ label: 'Additional component work', value: 'continue' }` |
| 47 | `{ label: '리뷰 후 진행', value: 'review' }` | `{ label: 'Review before proceeding', value: 'review' }` |

### 4.4 scripts/phase6-ui-stop.js (10 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 34-38 | Checklist items | `'UI components implemented'`, `'API integration complete'`, `'State management applied'`, `'Error handling implemented'`, `'Loading states handled'` |
| 43-44 | Suggestion descriptions | `'Design-Implementation Gap analysis'`, `'Docker log-based QA'` |
| 51 | `description: 'SEO 최적화 및 보안 점검'` | `description: 'SEO optimization and security review'` |
| 54-59 | Question and option labels | Full English translations |

### 4.5 scripts/phase9-deploy-stop.js (10 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 33-37 | Checklist items | `'CI/CD pipeline configured'`, `'Environment config complete (staging/production)'`, `'Deploy scripts written'`, `'Monitoring configured'`, `'Rollback procedures documented'` |
| 46-48 | Suggestion descriptions | `'Generate PDCA completion report'`, `'Archive completed documents'`, `'Start new feature development'` |
| 51-56 | Question and option labels | Full English translations |

### 4.6 scripts/learning-stop.js (3 lines)

| Line | Korean | English |
|:----:|--------|---------|
| 28 | `` `Level ${nextLevel} 학습 계속` `` | `` `Continue Level ${nextLevel} learning` `` |
| 32 | `'설정 자동 생성'` | `'Auto-generate configuration'` |
| 36 | `'PDCA 방법론으로 개발 시작'` | `'Start development with PDCA methodology'` |

### 4.7 scripts/archive-feature.js (1 line)

| Line | Korean | English |
|:----:|--------|---------|
| 94 | `완료된 PDCA 문서 아카이브입니다.` | `Archive of completed PDCA documents.` |

### 4.8 scripts/ JSDoc & Comment files (12 files, ~36 lines total)

| File | Lines | Pattern |
|------|:-----:|---------|
| `pdca-task-completed.js` | 5-12,25,48,76,128,134 | JSDoc header + comments → English |
| `subagent-start-handler.js` | 5-7,33,48,61,69,84 | JSDoc header + comments → English |
| `subagent-stop-handler.js` | 5,7-8,44,50,57 | JSDoc header + comments → English |
| `team-idle-handler.js` | 5-8,28,55 | JSDoc header + comments → English |
| `team-stop.js` | 5-8 | JSDoc header → English |

### 4.9 scripts/ Scattered Comments (13 files, 1-2 lines each)

All follow the pattern `// v1.4.0: {Korean}` → `// v1.4.0: {English}`:

| File | Line | Korean | English |
|------|:----:|--------|---------|
| `analysis-stop.js` | 22 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `context-compaction.js` | 87 | `hookEventName 추가 (ISSUE-006 수정)` | `Add hookEventName (ISSUE-006 fix)` |
| `design-validator-pre.js` | 31 | `PreToolUse hook에 맞는 스키마 사용` | `Use PreToolUse hook schema` |
| `phase1-schema-stop.js` | 37 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase2-convention-pre.js` | 31,40 | `PreToolUse hook에 맞는 스키마 사용` | `Use PreToolUse hook schema` |
| `phase2-convention-stop.js` | 38 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase3-mockup-stop.js` | 50 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase4-api-stop.js` | 21 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase7-seo-stop.js` | 44 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase8-review-stop.js` | 23 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `pre-write.js` | 193 | `PreToolUse hook에 맞는 스키마 사용` | `Use PreToolUse hook schema` |
| `qa-pre-bash.js` | 40 | `PreToolUse hook에 맞는 스키마 사용` | `Use PreToolUse hook schema` |
| `qa-stop.js` | 21 | `Stop hook에 맞는 스키마 사용` | `Use Stop hook schema` |
| `phase9-deploy-pre.js` | 34,42 | `PreToolUse hook에 맞는 스키마 사용` | `Use PreToolUse hook schema` |
| `jest.config.js` | 12 | `기존 TestRunner 기반 테스트 제외 (Jest 미호환)` | `Exclude legacy TestRunner-based tests (Jest incompatible)` |

## 5. Phase 3: Documentation (19 files, ~2,564 lines)

### 5.1 Phase 3A: Operational Documents (7 files, ~320 lines)

#### commands/github-stats.md (~90 Korean lines)
- Full translation of GitHub traffic collection runbook
- Convert all section headers, table headers, workflow rules, algorithm descriptions
- Preserve Confluence formatting instructions and API endpoint references
- Note: `.claude/commands/github-stats.md` is a duplicate — translate once, copy to both

#### commands/output-style-setup.md (5 Korean lines)
- Lines 22, 28-31: Translate command description and output style table descriptions

#### docs/guides/cto-team-memory-guide.md (31 Korean lines)
- Translate all section descriptions, table labels, tips, configuration notes
- Keep technical terms (PDCA, GC, CTO, etc.) in English

#### docs/guides/remote-control-compatibility.md (18 Korean lines)
- Translate all analysis descriptions, status labels, timeline notes

#### docs/01-plan/features/bkit-v1.5.7-doc-sync.plan.md (21 Korean lines)
- Translate PDCA plan document content

#### docs/02-design/features/bkit-v1.5.7-doc-sync.design.md (18 Korean lines)
- Translate PDCA design document content

### 5.2 Phase 3B: Research/Strategy Documents (2 files, ~650 lines)

#### docs/04-report/research/anthropic-leadership-os-strategy-analysis.md (246 lines)
- Full translation of Anthropic leadership strategy analysis
- Preserve citation references and quote attributions

#### docs/ai-agent-security-audit-2026.report.md (401 lines)
- Full translation of AI agent security audit report
- Preserve technical security terminology

### 5.3 Phase 3C: Enterprise Planning Documents (10 files, ~1,594 lines)

#### .claude/docs/bkit-enterprise-studio.plan.md (574 lines)
- Main enterprise OS strategy plan — full translation

#### .claude/docs/bkit-enterprise-expansion-strategy.md (269 lines)
- Expansion strategy — full translation

#### .claude/docs/enterprise/_INDEX.plan.md (41 lines)
- Master plan index — full translation

#### .claude/docs/enterprise/unit-{1-7}*.plan.md (7 files, ~751 lines total)
- All 7 unit plans — full translation each

## 6. Phase 4: Templates, Agent, Config (5 files, ~42 lines)

### 6.1 templates/schema.template.md (21 lines)
- Translate example data rows (Korean entity names → English equivalents)
- Translate field descriptions and checklist items
- Example: `사용자 → User`, `이메일 (unique) → Email (unique)`, `표시 이름 → Display name`

### 6.2 templates/convention.template.md (14 lines)
- Translate directory comments and checklist items
- Example: `# UI 컴포넌트 → # UI components`, `기능별 모듈 → Feature modules`

### 6.3 agents/pdca-iterator.md (2 lines)
- Line 10: `"자동 수정", "반복 개선"` → `"auto-fix", "iterative improvement"`
- Line 272: Same translation

### 6.4 .claude/agent-memory/bkit-bkend-expert/MEMORY.md (4 lines)
- Translate agent memory notes (lines 32-35)

### 6.5 docs/.bkit-memory.json (1 line)
- Line 19: Translate `description` field value

## 7. Verification Matrix

| Phase | Verification Command | Expected Result |
|:-----:|---------------------|-----------------|
| 1 | `grep -rn '[가-힣]' lib/core/ lib/pdca/automation.js lib/pdca/status.js lib/skill-orchestrator.js lib/team/coordinator.js lib/team/state-writer.js` | 0 results (excluding language.js ko: arrays) |
| 1 | `node -e "require('./lib/common.js')"` | No errors |
| 2 | `grep -rn '[가-힣]' scripts/ jest.config.js \| grep -v 'gap-detector-stop\|iterator-stop'` | 0 results |
| 3A | `grep -rn '[가-힣]' commands/ docs/guides/ docs/01-plan/features/bkit-v1.5.7-doc-sync* docs/02-design/features/bkit-v1.5.7-doc-sync*` | 0 results (excluding trigger keywords) |
| 3B | `grep -rn '[가-힣]' docs/04-report/research/ docs/ai-agent-security-audit*` | 0 results |
| 3C | `grep -rn '[가-힣]' .claude/docs/` | 0 results |
| 4 | `grep -rn '[가-힣]' templates/ agents/pdca-iterator.md .claude/agent-memory/bkit-bkend-expert/ docs/.bkit-memory.json` | 0 results |
| Final | `grep -rn '[가-힣]' --include='*.js' --include='*.md' --include='*.json' . \| grep -v 'docs/archive\|node_modules\|intent/language.js\|gap-detector-stop\|iterator-stop\|intent/trigger.js' \| grep -v 'Triggers:\|triggers:' \| grep -v 'session-start.js' \| grep -v 'comprehensive-test'` | 0 results |

## 8. Implementation Order

```
Phase 1 (lib/) ──→ Phase 2 (scripts/) ──→ Phase 3A (operational docs)
                                           ├── Phase 3B (research docs)   ← can run parallel
                                           └── Phase 3C (enterprise docs) ← can run parallel
                                       ──→ Phase 4 (templates/agent/config)
                                       ──→ Final Verification
```

- **Phase 1 + 2**: Sequential (code files, need import verification)
- **Phase 3A/3B/3C**: Can run in parallel (independent documents)
- **Phase 4**: After all code phases complete
- **Final Verification**: Comprehensive grep scan after all phases

## 9. File Count Summary

| Category | Files | Lines | Phase |
|----------|:-----:|:-----:|:-----:|
| JS lib/ (JSDoc + comments) | 12 | ~130 | 1 |
| JS scripts/ (string literals + comments) | 19 | ~120 | 2 |
| Operational docs | 7 | ~320 | 3A |
| Research/strategy docs | 2 | ~650 | 3B |
| Enterprise planning docs | 10 | ~1,594 | 3C |
| Templates + agent + config | 5 | ~42 | 4 |
| **Total** | **55** | **~2,856** | - |
| Exclusions (no-touch) | ~50+ locations | ~70+ lines | - |
