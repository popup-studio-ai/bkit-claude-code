# v2.1.3 Issue Fixes — Plan

**Feature**: `v213-issue-fixes`
**버전**: 2.1.2 → 2.1.3
**작성일**: 2026-04-12
**목표**: bkit 자체 GitHub OPEN 이슈 3건(#65, #66, #67)을 L4 Full-Auto 로 일괄 해결

## 배경

v2.1.1/v2.1.2 릴리스 이후 reporter 가 제출한 버그 리포트 3건이 미해결 상태로 남아 있음.
세 이슈 모두 코드 라인/파일 경로가 본문에 명시되어 있어 재현 비용이 낮고, 영향 범위가 특정 모듈로 국한됨.

## Requirements

### REQ-1 (#65) `/pdca qa` 서브커맨드 완전 통합
- **재현**: `claude -p "/pdca qa <feature>"` 호출 시, `scripts/pdca-skill-stop.js:147` actionPattern 이 `qa` 를 파싱하지 못해 `action = null` 로 전락. PDCA state 미전환. `skills/pdca/SKILL.md` 에 `### qa` 핸들러 블록 부재.
- **근본 원인**:
  1. `actionPattern` 정규식에 `qa` alternation 누락
  2. state transition whitelist (`['plan','design','do','analyze','iterate','report']`) 에 `qa` 누락
  3. `nextStepMap` 에 `qa` 엔트리 부재 → `nextStep` undefined
  4. `phaseMap` 에 `qa` 누락 → Full-Auto trigger 불가
  5. SKILL.md Action Details 에 `### qa` 핸들러 문서 부재
  6. SKILL.md Slash Invoke Pattern 에 `/pdca qa` 라인 부재
- **변경 범위**: `scripts/pdca-skill-stop.js`, `skills/pdca/SKILL.md` (2 files)
- **검증**:
  - Unit: `node -e "const p=/pdca\\s+(...)/i; console.log('pdca qa foo'.match(p))"` 비null
  - Smoke: `claude -p --plugin-dir . --permission-mode bypassPermissions "/bkit:pdca qa v213-issue-fixes"` → is_error=false
- **리스크**: SKILL.md 의 `### qa` 블록이 기존 qa-phase skill 과 책임 중복되지 않도록 주의. `/pdca qa` 는 라우터 역할만 하고 실제 실행은 qa-phase skill 위임 패턴.

### REQ-2 (#66) permission-manager.js TypeError 제거
- **재현**: `node -e "require('./lib/permission-manager.js').checkPermission('Edit','')"` → `TypeError: Cannot read properties of null (reading 'getHierarchicalConfig')`
- **근본 원인**: 2026-04-08 commit `21d35d6` 에서 `lib/context-hierarchy.js`, `lib/common.js` 삭제. 그러나 `lib/permission-manager.js` 의 lazy require(14~26행) 는 null 폴백만 설정, 62/105/151행에서 null 체크 없이 method 호출.
- **선택된 옵션**: Option 1 (minimal null guard) — 이슈 본문 "Option 1" 방식.
  - 이유: 권한 check layer 자체를 완전 제거(Option 2)하면 `DEFAULT_PERMISSIONS` 정책 (`Bash(rm -rf*): deny`) 까지 사라져 사용자 기대와 다름. 이슈 본문에도 "최소 diff, 기본 정책 복구"가 최우선 설계 의도로 명시됨.
  - `hierarchy && hierarchy.getHierarchicalConfig(...)` ternary 로 3개 호출 지점(62, 105, 151) 수정. `common.debugLog` 호출도 동일 가드.
- **변경 범위**: `lib/permission-manager.js` (1 file)
- **검증**:
  - Unit: `node -e "const m=require('./lib/permission-manager.js'); console.log(m.checkPermission('Bash','rm -rf /tmp/x'))"` → `'deny'` 반환, TypeError 없음
  - Unit: `node -e "require('./scripts/pre-write.js')"` 경로 로드 에러 없음
- **리스크**: hierarchy config 우선 정책이 사라지지만, 해당 기능은 이미 v2.1.0 부터 non-functional (이슈 본문). 정책 복구는 별도 이슈.

### REQ-3 (#67) MCP bkit_report_read 가 docPaths 준수
- **재현**: `bkit.config.json` 의 `pdca.docPaths.report` 를 변경해도 `servers/bkit-pdca-server/index.js:38-46` 의 하드코딩 `PHASE_MAP` 이 `docs/04-report/features/{feature}.report.md` 만 검색.
- **근본 원인**: MCP 서버가 `lib/core/paths.js` 의 `resolveDocPaths()` / `findDoc()` 을 import 하지 않고 독자적인 하드코딩 경로 생성 로직 사용. `bkit_plan_read`, `bkit_design_read`, `bkit_analysis_read`, `bkit_report_read` 4개 tool 이 동일하게 영향.
- **설계 방침**:
  - MCP 서버는 외부 의존 없는 lightweight stdio 서버라는 기존 원칙 유지 → `lib/core/paths.js` 전체 import 는 과함.
  - 대신 `bkit.config.json` 을 직접 읽어 `pdca.docPaths[phase]` 템플릿 배열을 resolve 하는 로컬 헬퍼를 추가. 기존 `PHASE_MAP` 기반 경로는 config 가 없거나 파싱 실패할 때 폴백.
  - 여러 템플릿 경로 중 **존재하는 첫 번째 파일** 반환 (`findDoc` 동등).
- **변경 범위**: `servers/bkit-pdca-server/index.js` (1 file)
- **검증**:
  - Unit: `bkit.config.json` 을 임시 수정(`report: ["docs/custom/{feature}.md"]`), MCP `tools/call bkit_report_read {feature:"x"}` 가 해당 경로를 탐색하는지 JSON-RPC mock 으로 확인
  - Regression: 기본 `bkit.config.json` 상태에서 기존 경로(`docs/04-report/features/...`) 여전히 정상 동작
- **리스크**: 폴백 체인이 config 키 누락/잘못된 타입에 대해 graceful 이어야 함. 테스트에 malformed config 케이스 포함.

### REQ-4 버전 동기화
- `bkit.config.json`, `.claude-plugin/plugin.json`, `.claude-plugin/marketplace.json` (line 37), `hooks/hooks.json` description 을 `2.1.2 → 2.1.3` 으로 업데이트.

## 비-요구사항 (Out of Scope)

- ENH-138 ~ ENH-194 대부분 개선 — 본 사이클은 버그 픽스 전용.
- Permission hierarchy config feature 재구현 (#66 Option 3).
- MCP 서버의 `lib/core/paths.js` 전면 사용 (#67 의 "깔끔한" 대안).
- v2.1.3 릴리스 노트 외 추가 문서 리팩터.

## Success Criteria

1. `claude -p --plugin-dir . "/bkit:pdca qa <feature>"` 실행 후 is_error=false, pdca-status.json 이 `qa` phase 를 기록.
2. `node -e "require('./lib/permission-manager.js').checkPermission('Bash','rm -rf x')"` → `'deny'`, TypeError 0건.
3. MCP `bkit_report_read` 가 custom `docPaths.report` 설정을 준수하며, 기본 설정에서도 회귀 없음.
4. Jest suite 전체 통과 (0 failure).
5. PR 머지 → v2.1.3 tag+release → issue #65/#66/#67 자동 close 확인.
6. Match Rate ≥ 95%.

## Verification Strategy

- **Phase Do**: 각 수정 직후 단위 Node one-liner 로 즉시 확인.
- **Phase QA (L1)**: 3개 issue 별 재현 시나리오 역검증.
- **Phase QA (L2)**: Jest 전체.
- **Phase QA (L3)**: `claude -p` smoke (1~2 시나리오) — plugin load + skill invocation.

## Risks / Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Plugin cache (~/.claude/plugins/cache) 로 인해 로컬 변경이 `claude -p` smoke 에 반영 안 됨 | H | `--plugin-dir .` 로 현재 ckpt 사용, 필요 시 `~/.claude/plugins/cache/bkit-claude-code/bkit/2.1.1/` 경로 회피 |
| `pre-write.js` 의 permission manager 의존 코드가 다른 hook 에서도 호출 | M | grep 으로 caller 확인, null 가드 하나로 모든 caller 수용 |
| MCP 서버 fallback 경로가 과도하게 관대하여 기존 동작 변경 | L | 폴백은 "config 없음" 케이스만, 기존 `PHASE_MAP` 은 default 값으로 보존 |
