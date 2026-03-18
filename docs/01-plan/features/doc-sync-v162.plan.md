# Plan: bkit v1.6.2 문서 동기화 (Doc-Sync)

## Executive Summary

| 관점 | 설명 |
|------|------|
| **Problem** | v1.6.2 구현 완료 후 문서가 v1.6.1 기준으로 남아있어 코드-문서 불일치 발생 (hooks 10→12, agents 21→29, skills 28→31, exports 208→210 등) |
| **Solution** | 17개 문서 파일의 버전, 수치, 컴포넌트 카운트, CC 권장 버전을 일괄 동기화 |
| **Function & UX Effect** | README 방문자가 정확한 최신 정보 확인 가능, CHANGELOG에서 v1.6.2 변경사항 추적 가능 |
| **Core Value** | "Docs = Code" 철학 실현 - 구현과 문서의 100% 일치 보장 |

---

## 1. 목표

v1.6.2 구현 완료 사항을 모든 문서에 정확히 반영하여 코드-문서 일치율 100%를 달성한다.

## 2. 범위

### 2.1 변경 대상 파일 (17개)

#### A. 루트 문서 (3개, 필수)

| # | 파일 | 변경 유형 | 우선순위 |
|---|------|-----------|----------|
| 1 | `README.md` | 버전 배지, 컴포넌트 수, CC 버전, features, architecture | P0 |
| 2 | `CHANGELOG.md` | v1.6.2 항목 신규 추가 | P0 |
| 3 | `CUSTOMIZATION-GUIDE.md` | 컴포넌트 수, 아키텍처 다이어그램, exports | P1 |

#### B. bkit-system/ 문서 (11개, 필수)

| # | 파일 | 변경 유형 | 우선순위 |
|---|------|-----------|----------|
| 4 | `bkit-system/README.md` | 컴포넌트 수, CC 버전, exports, 버전 라벨 | P0 |
| 5 | `bkit-system/_GRAPH-INDEX.md` | agents/skills/scripts/exports 수, 버전 이력 | P1 |
| 6 | `bkit-system/philosophy/core-mission.md` | 컴포넌트 수 테이블, 버전 이력 | P1 |
| 7 | `bkit-system/philosophy/context-engineering.md` | exports 208→210, 버전 이력 | P1 |
| 8 | `bkit-system/philosophy/pdca-methodology.md` | CC 버전 참조 (간접) | P2 |
| 9 | `bkit-system/components/agents/_agents-overview.md` | 21→29 agents, 모델 분포 | P0 |
| 10 | `bkit-system/components/skills/_skills-overview.md` | 28→31 skills, 분류 수 | P0 |
| 11 | `bkit-system/components/hooks/_hooks-overview.md` | 10→12 hooks, CC 공식 18→22, 이미 부분 업데이트 확인 | P0 |
| 12 | `bkit-system/components/scripts/_scripts-overview.md` | 45→49 scripts, 208→210 exports | P1 |
| 13 | `bkit-system/triggers/trigger-matrix.md` | hook events 수, 이벤트 목록 | P1 |
| 14 | `bkit-system/testing/test-checklist.md` | exports 수, TC 수, 통합 테스트 | P2 |

#### C. 기타 (3개, 선택)

| # | 파일 | 변경 유형 | 우선순위 |
|---|------|-----------|----------|
| 15 | `skills/skill-status/SKILL.md` | v1.6.1→v1.6.2 참조 | P2 |
| 16 | `evals/README.md` | v1.6.1→v1.6.2 참조 | P2 |
| 17 | `skill-creator/README.md` | v1.6.1→v1.6.2 참조 | P2 |

### 2.2 변경하지 않는 파일

- `hooks/hooks.json` - 이미 v1.6.2 구현 완료
- `plugin.json` - 이미 업데이트됨
- `bkit.config.json` - 이미 업데이트됨
- `session-start.js` - 이미 업데이트됨
- `agents/*.md` - 이미 effort/maxTurns 추가됨
- `docs/01-plan/`, `docs/02-design/`, `docs/03-analysis/` - 이전 분석 기록이므로 변경 대상 아님

## 3. 변경 수치 매핑

| 항목 | v1.6.1 (Before) | v1.6.2 (After) |
|------|:---------------:|:--------------:|
| Version | 1.6.1 | 1.6.2 |
| Hook events (bkit) | 10 | 12 |
| CC 공식 Hook events | 18 | 22 |
| Agents | 21 (문서) / 29 (실제) | 29 |
| Skills | 28 (문서) / 31 (실제) | 31 |
| common.js exports | 208 | 210 |
| Scripts | 45 (문서) / 47 (실제) | 49 |
| CC recommended | v2.1.71 | v2.1.78 |
| CC minimum | v2.1.69+ | v2.1.69+ |
| Tests | 1,073 TC (99.6%) | 1,186 TC (99.7%) |
| Output tokens | 32K default | 64K default, 128K upper |
| Agent frontmatter | name, model, disallowedTools | +effort, +maxTurns |
| PLUGIN_DATA | - | backup/restore |

## 4. 성공 기준

| 기준 | 측정 방법 |
|------|-----------|
| 모든 17개 파일에서 v1.6.1→v1.6.2 버전 반영 | grep "v1.6.1" 결과 0건 (대상 파일 한정) |
| 컴포넌트 수치 일관성 | 21→29 agents, 28→31 skills, 45→49 scripts, 208→210 exports |
| CHANGELOG.md에 v1.6.2 항목 존재 | 섹션 확인 |
| README.md 배지 v1.6.2 반영 | 배지 URL 확인 |
| CC 권장 버전 v2.1.78 반영 | grep "v2.1.71" 결과 0건 (대상 파일 한정, 이력 제외) |

## 5. 작업 순서

1. **P0 (필수, 즉시)**: README.md, CHANGELOG.md, bkit-system/README.md, _agents-overview.md, _skills-overview.md, _hooks-overview.md
2. **P1 (필수, 후속)**: CUSTOMIZATION-GUIDE.md, _GRAPH-INDEX.md, core-mission.md, context-engineering.md, _scripts-overview.md, trigger-matrix.md
3. **P2 (선택)**: pdca-methodology.md, test-checklist.md, skill-status SKILL.md, evals/README.md, skill-creator/README.md

## 6. 리스크

| 리스크 | 대응 |
|--------|------|
| 수치 불일치 (문서 간 다른 값) | Design 문서에서 파일별 before/after 명세 후 일괄 적용 |
| 이미 업데이트된 파일 재수정 | 변경 전 현재 상태 확인 후 스킵 판단 |
| v1.6.1 이력 참조 삭제 위험 | 이력 섹션의 v1.6.1 참조는 유지, 현재 상태 섹션만 v1.6.2로 업데이트 |
