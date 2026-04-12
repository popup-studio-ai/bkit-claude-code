# v2.1.3 Issue Fixes — Simplify Review

**Feature**: `v213-issue-fixes`

## 변경 코드 검토 체크리스트

| 항목 | 파일 | 판정 | 비고 |
|---|---|---|---|
| 중복 제거 | pdca-skill-stop.js | HOLD | phaseMap 이 3곳에 중복 존재 (이번 변경 이전부터). 본 패치는 기존 패턴을 그대로 따름. 리팩터는 별도 이슈 — YAGNI |
| Dead code | permission-manager.js | NONE | lazy require 는 여전히 필요 (미래 hierarchy 재구현 가능성). 삭제 시 Option 2 로 전환되어 스코프 변경됨 |
| Dead code | bkit-pdca-server/index.js | REMOVED | 기존 `PHASE_MAP` / `DOCS_DIR` 상수 제거 검토 → `DOCS_DIR` 는 본 패치에서 참조 제거했으나, 다른 잠재적 confusion 방지 위해 완전 제거. `PHASE_MAP` 도 제거 |
| 과잉 주석 | 모두 | OK | WHY 주석만 남김. 각 변경 지점에 이슈 번호 + 원인 설명 |
| 불필요 추상화 | bkit-pdca-server/index.js | OK | 3개 작은 함수(`loadBkitConfig`/`getPhaseTemplates`/`docsPath`) — 각각 단일 책임, 과도하지 않음 |

## Simplify 액션

### bkit-pdca-server/index.js — dead constants 제거

`PHASE_MAP` 과 `DOCS_DIR` 은 새 `docsPath()` 에서 참조되지 않음. `DOCS_DIR` 은 파일 내 다른 곳에서도 미사용 (grep 결과 0건). `PHASE_MAP` 도 동일. 제거하여 혼란 방지.
