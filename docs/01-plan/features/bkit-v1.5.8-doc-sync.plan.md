# Plan: bkit v1.5.8 Document Synchronization

## Feature Information
- **Feature Name**: bkit-v1.5.8-doc-sync
- **Version**: v1.5.8
- **Date**: 2026-03-01
- **Author**: Claude (PDCA)
- **Previous**: bkit-v1.5.7-doc-sync (completed, 100%)

## Background

bkit v1.5.8 Studio Support 기능 구현이 완료되고 종합 테스트(865 TC, 100%)가 통과했으나,
88개 파일에 걸쳐 308건의 v1.5.7 참조가 잔존하여 릴리스 전 전체 문서 동기화가 필요.

### v1.5.8 핵심 변경 사항 (Studio Support)
1. **Path Registry** (`lib/core/paths.js`) - 상태 파일 경로 중앙 관리
2. **State Directory Migration** - `docs/` 분산 → `.bkit/{state,runtime,snapshots}/` 구조화
3. **Auto-Migration** - SessionStart 시 v1.5.7 → v1.5.8 자동 마이그레이션 (EXDEV fallback)
4. **Export 증가** - common.js 182 → 186 (+4 path exports)
5. **Config 변경** - `pdca.statusFile`: `docs/.pdca-status.json` → `.bkit/state/pdca-status.json`

## Objectives

1. **88개 파일의 v1.5.7 참조 → v1.5.8 일괄 동기화** (적용 대상만)
2. README.md, CHANGELOG.md, marketplace.json **공개 문서** 버전 업데이트
3. 42개 JS 파일의 `@version 1.5.7` → `@version 1.5.8` 어노테이션 업데이트
4. 10개 Agent, 7개 bkit-system 문서의 v1.5.8 Feature Guidance 추가
5. **아키텍처 수치 정합성** 검증 (186 exports, 27 skills, 16 agents, 10 hooks, 45 scripts)

## Investigation Summary (전수 조사 결과)

### 308건 v1.5.7 참조 분류

| Category | Files | Occurrences | Action |
|----------|:-----:|:-----------:|--------|
| Config/Version Files | 4 | 6 | **UPDATE** - 버전 숫자 변경 |
| README.md | 1 | 3 | **UPDATE** - 배지, Features, 수치 |
| CHANGELOG.md | 1 | - | **ADD** - v1.5.7 + v1.5.8 entries |
| session-start.js | 1 | 11 | **SELECTIVE** - 역사적 참조 유지, 사용자 노출 부분만 |
| JSDoc @version | 42 | 42 | **UPDATE** - 1.5.7 → 1.5.8 |
| Agent docs | 10 | 10 | **UPDATE** - Feature Guidance 섹션 |
| bkit-system docs | 7 | 14 | **UPDATE** - 버전 이력, 수치 |
| CUSTOMIZATION-GUIDE.md | 1 | 3 | **UPDATE** - Component Inventory |
| commands/bkit.md | 1 | 1 | **UPDATE** - Code Quality 버전 |
| Guides | 2 | 2 | **UPDATE** - 버전 참조 |
| v1.5.7 PDCA docs | 6 | 120+ | **SKIP** - 역사적 기록 |
| v1.5.8 PDCA docs | 8 | 60+ | **SKIP** - 이미 v1.5.8 참조 |
| Research docs | 11 | 40+ | **SKIP** - 조사 문서, 역사적 |

### Export/Function Count 검증 (Runtime)

| Metric | v1.5.7 | v1.5.8 | Delta |
|--------|:------:|:------:|:-----:|
| common.js exports | 182 | **186** | +4 (path exports) |
| Core module exports | 41 | **45** | +4 |
| Total lib functions | ~241 | ~245 | +4 |
| Skills | 27 | 27 | 0 |
| Agents | 16 | 16 | 0 |
| Hook Events | 10 | 10 | 0 |
| Scripts | 45 | 45 | 0 |

## Scope

### In Scope (65 files, 7 categories)

**Category 1: Config/Version (4 files)**
- README.md: 버전 배지, Features 목록, 수치, CC 버전
- CHANGELOG.md: [1.5.7] + [1.5.8] 신규 엔트리
- `.claude-plugin/marketplace.json`: version x2
- CUSTOMIZATION-GUIDE.md: Component Inventory 버전

**Category 2: JSDoc @version (42 files)**
- `lib/core/*.js` (7 files, paths.js 제외 - 이미 v1.5.8)
- `lib/pdca/*.js` (6 files)
- `lib/intent/*.js` (4 files)
- `lib/task/*.js` (4 files)
- `lib/team/*.js` (8 files)
- `lib/*.js` (4 files: skill-orchestrator, permission-manager, import-resolver, context-fork, context-hierarchy)
- `scripts/*.js` (8 files: skill-post, user-prompt-handler, learning-stop, pdca-skill-stop, phase5/6/9-stop, code-review-stop)

**Category 3: Agent Documentation (10 files)**
- agents/: starter-guide, pipeline-guide, gap-detector, enterprise-expert, pdca-iterator, design-validator, qa-monitor, infra-architect, code-analyzer, report-generator

**Category 4: bkit-system Documentation (7 files)**
- bkit-system/README.md
- bkit-system/_GRAPH-INDEX.md
- bkit-system/components/agents/_agents-overview.md
- bkit-system/components/skills/_skills-overview.md
- bkit-system/components/scripts/_scripts-overview.md
- bkit-system/philosophy/context-engineering.md
- bkit-system/philosophy/core-mission.md

**Category 5: Guides (2 files)**
- docs/guides/cto-team-memory-guide.md
- docs/guides/remote-control-compatibility.md

**Category 6: Commands (1 file)**
- commands/bkit.md

**Category 7: Session Start (1 file - selective)**
- hooks/session-start.js: 사용자 노출 섹션만 (Output Styles, Memory Systems 헤더)

### Out of Scope
- v1.5.7 PDCA docs (역사적 기록, 6 files)
- v1.5.8 PDCA docs (이미 v1.5.8, 8 files)
- Research docs (조사 문서, 11 files)
- Templates (버전 필드 없음, 28 files)
- output-styles/ (버전 필드 없음)
- docs/archive/ (보관 문서)
- gap-detector-stop.js, iterator-stop.js (@version v1.4.0 유지, 의도적)
- hooks/session-start.js 역사적 코멘트 (v1.5.7 Changes: 블록 유지)
- Skills SKILL.md (v1.5.1 참조는 Feature 소개 시점이므로 변경 불요)

## Success Criteria

1. `grep -r "@version 1.5.7" --include="*.js" lib/ scripts/` → 결과 0개
2. README.md 버전 배지 = v1.5.8
3. marketplace.json 버전 = 1.5.8 (2곳)
4. CHANGELOG.md에 [1.5.7] 및 [1.5.8] 엔트리 존재
5. Agent docs "Feature Guidance" 섹션 = v1.5.8
6. 문서 수치 정합성: **186 exports**, 27 skills, 16 agents, 10 hooks, 45 scripts
7. 구 경로 `docs/.bkit-memory.json`, `docs/.pdca-status.json` 참조가 활성 문서에 없음

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 누락 파일 | Low | Low | grep 사후 검증 |
| 역사적 참조 오염 | Medium | Low | Out of Scope 명확화, PDCA/Research docs 제외 |
| @version 일괄 변경 오류 | Low | Very Low | replace_all + grep 검증 |
| CHANGELOG 누락 항목 | Medium | Low | v1.5.7 doc-sync plan 참조 |

## Implementation Strategy

### Phase 1: Critical Config (4 files)
README.md, CHANGELOG.md, marketplace.json, CUSTOMIZATION-GUIDE.md

### Phase 2: JSDoc Bulk Update (42 files)
`@version 1.5.7` → `@version 1.5.8` (Edit replace_all)

### Phase 3: Documentation Update (20 files)
Agent docs (10), bkit-system docs (7), guides (2), commands (1)

### Phase 4: Selective Session Start (1 file)
hooks/session-start.js 사용자 노출 섹션만

### Phase 5: Verification
grep 기반 잔존 참조 확인, 수치 정합성 검증
