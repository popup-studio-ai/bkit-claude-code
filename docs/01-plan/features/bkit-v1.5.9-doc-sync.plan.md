# bkit v1.5.9 Doc Sync Planning Document

> **Summary**: v1.5.9 버전 업데이트에 따른 전체 코드베이스 문서/버전 동기화
>
> **Project**: bkit (Vibecoding Kit)
> **Version**: v1.5.9
> **Author**: bkit CTO Team
> **Date**: 2026-03-04
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

claude-code-v2166-enhancement (v1.5.8→v1.5.9) 구현이 완료되었으나, 버전 번호(`@version` JSDoc), 문서 메트릭(hook events 10→11, exports 186→190), CHANGELOG, README 기능 목록, bkit-system 참조 문서 등이 아직 v1.5.8 기준으로 남아 있다. 이를 v1.5.9 기준으로 일괄 동기화한다.

### 1.2 Background

- v1.5.9 코드 변경: 18개 파일, 25 FR, 100% match rate (완료)
- v1.5.9 종합 테스트: 936 TC, 926 PASS, 99.5% (완료)
- **미완료**: 버전 어노테이션, CHANGELOG, README, bkit-system 참조 문서 동기화

### 1.3 Scope Definition

**동기화 대상**: 코드 기능은 변경하지 않음. JSDoc `@version`, 문서 내 메트릭 수치, 기능 설명 텍스트만 업데이트.

**비대상**:
- `docs/archive/` 내 아카이브 문서 (역사적 기록, 수정 불가)
- `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/`, `docs/04-report/features/` 내 PDCA 산출물 (해당 버전의 기록)
- `.claude/agent-memory/` (에이전트가 자체 관리)

---

## 2. Requirements

### Phase 1: @version JSDoc 일괄 업데이트 (49 files)

| ID | Requirement | Files | Priority |
|----|-------------|:-----:|:--------:|
| FR-01 | `lib/` 디렉토리 39개 JS 파일의 `@version 1.5.8` → `@version 1.5.9` | 39 | High |
| FR-02 | `scripts/` 디렉토리 9개 JS 파일의 `@version 1.5.8` → `@version 1.5.9` | 9 | High |
| FR-03 | `scripts/instructions-loaded-handler.js`는 이미 `@version 1.5.9` — 확인만 | 1 | Low |

**lib/ 39개 파일 목록**:
- `lib/common.js`
- `lib/context-fork.js`, `lib/context-hierarchy.js`, `lib/import-resolver.js`
- `lib/memory-store.js`, `lib/permission-manager.js`, `lib/skill-orchestrator.js`
- `lib/core/` (8): index, paths, platform, config, cache, debug, io, file
- `lib/pdca/` (6): index, tier, level, phase, status, automation
- `lib/intent/` (4): index, language, trigger, ambiguity
- `lib/task/` (5): index, tracker, context, creator, classification
- `lib/team/` (9): index, coordinator, strategy, orchestrator, task-queue, communication, state-writer, hooks, cto-logic

**scripts/ 9개 파일 목록**:
- code-review-stop, context-compaction, learning-stop, pdca-skill-stop
- phase5-design-stop, phase6-ui-stop, phase9-deploy-stop
- skill-post, user-prompt-handler

### Phase 2: 설정 파일 버전 동기화 (1 file)

| ID | Requirement | File | Priority |
|----|-------------|------|:--------:|
| FR-04 | `marketplace.json` version "1.5.8" → "1.5.9" (line 4) | `.claude-plugin/marketplace.json` | High |
| FR-05 | `marketplace.json` bkit plugin version "1.5.8" → "1.5.9" (line 37) | `.claude-plugin/marketplace.json` | High |
| FR-06 | `marketplace.json` bkit description "10 hook events" → "11 hook events" (line 36) | `.claude-plugin/marketplace.json` | High |
| FR-07 | `marketplace.json` scripts count "45 scripts" → "46 scripts" (line 36) — instructions-loaded-handler.js 추가 | `.claude-plugin/marketplace.json` | Medium |

### Phase 3: CHANGELOG 작성 (2 files)

| ID | Requirement | File | Priority |
|----|-------------|------|:--------:|
| FR-08 | CHANGELOG.md에 `## [1.5.9]` 섹션 추가 (v1.5.8 위에) | `CHANGELOG.md` | High |
| FR-09 | docs/04-report/changelog.md에 v1.5.9 엔트리 추가 | `docs/04-report/changelog.md` | Medium |

**CHANGELOG 내용**:
- Added: InstructionsLoaded hook handler, agent_id/agent_type in hook handlers, continue:false for CTO Team auto-termination, background:true for 5 analysis agents, context:fork for code-analyzer
- Changed: Hook events 10→11, common.js exports 186→190, CC recommended v2.1.63→v2.1.66, docs URL code.claude.com
- Quality: 936 TC, 926 PASS, 5 FAIL (edge case), 5 SKIP (by design), 99.5%
- Compatibility: CC minimum v2.1.33, recommended v2.1.66

### Phase 4: README.md 업데이트 (1 file)

| ID | Requirement | Line | Priority |
|----|-------------|:----:|:--------:|
| FR-10 | Features 목록에 v1.5.9 항목 추가 (line 63 위에) | 63 | High |
| FR-11 | "10 hook events total" → "11 hook events total" (line 69) | 69 | High |
| FR-12 | "241 Utility Functions" → 정확한 수치 업데이트 (line 87) — 실제 common.js 190 exports 기준 | 87 | Medium |
| FR-13 | Requirements 테이블 CC 버전: "v2.1.63+" 유지하되, Notes에 "Recommended v2.1.66" 추가 (line 114) | 114 | Medium |

**v1.5.9 Features 항목 내용**:
```
- **InstructionsLoaded Hook & CTO Team Enhancement (v1.5.9)** - CLAUDE.md 로드 시 bkit 컨텍스트 자동 주입 (CC v2.1.64+), hook handler agent_id/agent_type 정밀 식별, CTO Team continue:false 자동 종료, 5개 분석 에이전트 background:true 병렬화, code-analyzer context:fork Analysis Triad, 11 hook events, 190 exports
```

### Phase 5: bkit-system 참조 문서 업데이트 (5 files)

| ID | Requirement | File | Priority |
|----|-------------|------|:--------:|
| FR-14 | trigger-matrix.md: InstructionsLoaded 이벤트 추가, "10 hook events" → "11 hook events" | `bkit-system/triggers/trigger-matrix.md` | High |
| FR-15 | context-engineering.md: v1.5.9 버전 라인 추가, "10 hook events" → "11", "186 exports" → "190 exports" | `bkit-system/philosophy/context-engineering.md` | High |
| FR-16 | core-mission.md: v1.5.9 버전 라인 추가, "241 functions" 수치 확인 | `bkit-system/philosophy/core-mission.md` | Medium |
| FR-17 | _GRAPH-INDEX.md: v1.5.9 버전 라인 추가, exports 수치 업데이트 | `bkit-system/_GRAPH-INDEX.md` | Medium |
| FR-18 | _scripts-overview.md: v1.5.9 라인 추가, exports/scripts 수치 업데이트 | `bkit-system/components/scripts/_scripts-overview.md` | Medium |
| FR-19 | _agents-overview.md: v1.5.9 라인 추가 | `bkit-system/components/agents/_agents-overview.md` | Low |
| FR-20 | bkit-system/README.md: v1.5.9 라인 추가 | `bkit-system/README.md` | Low |

### Phase 6: CUSTOMIZATION-GUIDE.md 업데이트 (1 file)

| ID | Requirement | File | Priority |
|----|-------------|------|:--------:|
| FR-21 | "241 functions" 참조 업데이트 | `CUSTOMIZATION-GUIDE.md` | Low |

---

## 3. Impact Analysis

### 3.1 변경 범위

| Category | File Count | Change Type |
|----------|:---------:|-------------|
| lib/ @version | 39 | JSDoc 1줄 교체 |
| scripts/ @version | 9 | JSDoc 1줄 교체 |
| Config (marketplace.json) | 1 | 3-4줄 버전/수치 |
| CHANGELOG | 2 | 새 섹션 추가 |
| README.md | 1 | 4-5줄 수정/추가 |
| bkit-system/ 문서 | 7 | 버전 라인/수치 |
| CUSTOMIZATION-GUIDE.md | 1 | 1줄 수치 |
| **Total** | **~60 files** | **텍스트만, 코드 로직 0 변경** |

### 3.2 Risk Assessment

| Risk | Level | Mitigation |
|------|:-----:|------------|
| @version 교체 시 다른 텍스트 변경 | LOW | `replace_all: true`로 `@version 1.5.8` → `@version 1.5.9` 정확 매칭 |
| 메트릭 수치 불일치 | LOW | 테스트에서 확인된 정확한 수치만 사용 (190 exports, 11 hooks, 46 scripts) |
| CHANGELOG 형식 불일치 | LOW | 기존 v1.5.8 엔트리 형식 그대로 따름 |
| README feature 항목 중복 | LOW | 기존 항목 순서 유지, v1.5.9만 최상단 추가 |

---

## 4. Implementation Strategy

### 4.1 Execution Order

```
Phase 1 (lib/ + scripts/ @version)     ← Edit replace_all, 48 files 일괄
Phase 2 (marketplace.json)              ← 3-4줄 수정
Phase 3 (CHANGELOG)                     ← 새 섹션 작성
Phase 4 (README.md)                     ← 4-5줄 수정/추가
Phase 5 (bkit-system/ 참조)             ← 7개 파일 수치/라인 추가
Phase 6 (CUSTOMIZATION-GUIDE.md)        ← 1줄 수정
```

### 4.2 Verification

| Check | Method |
|-------|--------|
| @version 잔여 확인 | `Grep '@version 1.5.8'` → 0 결과 (docs/ 제외) |
| "10 hook events" 잔여 | `Grep '10 hook events'` → docs/archive만 |
| "186 exports" 잔여 | `Grep '186 exports'` → docs/archive만 |
| CHANGELOG 형식 | Keep a Changelog 준수 확인 |
| marketplace.json JSON 유효성 | `node -e JSON.parse()` |

---

## 5. Quality Gates

| Gate | Condition |
|------|-----------|
| G1 | `Grep '@version 1.5.8'`로 lib/, scripts/ 내 0건 |
| G2 | `Grep '10 hook events'`로 README.md, bkit-system/ 내 0건 |
| G3 | CHANGELOG.md [1.5.9] 섹션 존재 |
| G4 | marketplace.json 유효 JSON, version "1.5.9" |
| G5 | README.md v1.5.9 feature bullet 존재 |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-04 | Initial plan — 21 FR, ~60 files, 6 phases |
