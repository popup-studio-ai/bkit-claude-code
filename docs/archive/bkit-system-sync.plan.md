# Plan: bkit-system 문서 동기화

## Feature Overview
| 항목 | 내용 |
|------|------|
| Feature Name | bkit-system-sync |
| Level | Dynamic |
| Created | 2026-01-23 |
| Version | v1.3.1 |

## 목표
bkit-system/ 폴더의 모든 문서를 실제 구현된 코드베이스와 동기화하여, 옵시디안 그래프 뷰에서 정확한 정보를 표시하도록 함.

## 현황 분석

### 실제 구현 현황
| Component | Count | Location |
|-----------|-------|----------|
| Skills | 18 | skills/*/SKILL.md |
| Agents | 11 | agents/*.md |
| Commands | **20** | commands/*.md |
| Scripts | 21 | scripts/*.js |
| Hooks | 3 events | hooks/hooks.json |
| Lib | 1 | lib/common.js |

### 문서 현황 (bkit-system/)
| Document | 현재 버전 | 주요 불일치 |
|----------|----------|------------|
| _GRAPH-INDEX.md | v1.3.1 | Commands 18개 → 20개 |
| _agents-overview.md | v1.2.x | Agent hooks 정보 outdated |
| _skills-overview.md | v1.2.0 | 버전 업데이트 필요 |
| _scripts-overview.md | v1.3.1 | Task System 함수 미반영 |
| _hooks-overview.md | v1.3.1 | hooks.json 설명 불일치 |
| trigger-matrix.md | v1.3.0 | hooks.json 구조 정확함 |
| README.md | - | Commands 20개 반영됨 |

## 발견된 Gap

### 1. Commands 개수 불일치
- **문서**: 18개
- **실제**: 20개
- **누락된 Commands**: `/archive`, `/github-stats`

### 2. hooks.json 설명 불일치
- **_hooks-overview.md**: "Only SessionStart is defined globally"
- **실제 hooks.json**: SessionStart + PreToolUse + PostToolUse 모두 정의됨

### 3. lib/common.js Task System 함수 미반영
- _scripts-overview.md에 다음 함수들 추가 필요:
  - `PDCA_PHASES`
  - `getPdcaTaskMetadata()`
  - `generatePdcaTaskSubject()`
  - `generatePdcaTaskDescription()`
  - `generateTaskGuidance()`
  - `getPreviousPdcaPhase()`
  - `findPdcaStatus()`
  - `getCurrentPdcaPhase()`

### 4. 버전 표기 통일
- 현재 버전: v1.3.1 (Cross-Platform)
- 일부 문서는 v1.3.0, v1.2.x로 표기됨

## 수정 계획

### Phase 1: _GRAPH-INDEX.md 업데이트
1. Commands 섹션에 `/archive`, `/github-stats` 추가
2. Commands 개수 18 → 20으로 수정
3. lib/common.js 함수 목록 업데이트

### Phase 2: _hooks-overview.md 수정
1. hooks.json 설명을 실제와 일치시킴
2. Global Hooks Configuration 섹션 업데이트
3. PreToolUse/PostToolUse가 hooks.json에도 정의됨을 명시

### Phase 3: _scripts-overview.md 업데이트
1. lib/common.js Task System 함수들 추가
2. v1.3.1 버전 정보 추가

### Phase 4: 기타 문서 버전 통일
1. _skills-overview.md 버전 업데이트
2. _agents-overview.md 버전 업데이트

## 예상 변경 파일
1. `bkit-system/_GRAPH-INDEX.md`
2. `bkit-system/components/hooks/_hooks-overview.md`
3. `bkit-system/components/scripts/_scripts-overview.md`
4. `bkit-system/components/skills/_skills-overview.md`
5. `bkit-system/components/agents/_agents-overview.md`

## 리스크
- 옵시디안 링크 깨짐 가능성 → 기존 링크 구조 유지하며 수정

## 다음 단계
1. Design 문서 작성 → 각 파일별 수정 내용 상세화
2. 구현 (Do)
3. Gap Analysis (Check)
4. 완료 보고서 (Act)
