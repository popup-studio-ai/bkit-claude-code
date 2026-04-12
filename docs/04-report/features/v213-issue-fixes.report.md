# v2.1.3 Issue Fixes — Completion Report

**Feature**: `v213-issue-fixes`
**Version**: 2.1.2 → **2.1.3**
**Released**: 2026-04-12
**Automation Level**: L4 Full-Auto
**Match Rate**: 100%

## Executive Summary

bkit v2.1.3 는 GitHub OPEN 이슈 3건 (#65 `/pdca qa` 미완성, #66 permission-manager.js TypeError, #67 MCP docPaths 무시) 을 일괄 해결하는 버그 픽스 릴리스입니다. 총 4개 코드 파일 + 4개 manifest + 5개 문서, 추가 리팩터 없이 버그 픽스만 수행 (YAGNI).

## 변경 파일 표

| 파일 | 변경 유형 | 이슈 | Lines Δ(추정) |
|---|---|---|---|
| `scripts/pdca-skill-stop.js` | Fix | #65 | +15 |
| `skills/pdca/SKILL.md` | Fix + Docs | #65 | +22 |
| `lib/permission-manager.js` | Fix | #66 | +12 -4 |
| `servers/bkit-pdca-server/index.js` | Fix | #67 | +45 -15 |
| `bkit.config.json` | Version | - | ±1 |
| `.claude-plugin/plugin.json` | Version | - | ±1 |
| `.claude-plugin/marketplace.json` | Version | - | ±1 |
| `hooks/hooks.json` | Version | - | ±1 |
| `CHANGELOG.md` | Release notes | - | +25 |
| `docs/01-plan/features/v213-issue-fixes.plan.md` | PDCA | - | new |
| `docs/02-design/features/v213-issue-fixes.design.md` | PDCA | - | new |
| `docs/03-analysis/features/v213-issue-fixes.iterate.md` | PDCA | - | new |
| `docs/04-report/features/v213-issue-fixes.qa.md` | PDCA | - | new |
| `docs/04-report/features/v213-issue-fixes.report.md` | PDCA | - | new |
| `docs/03-analysis/features/v213-issue-fixes.simplify.md` | PDCA | - | new |

## 이슈별 해결

### #65 — `/pdca qa` subcommand complete integration

**Symptom**: `/pdca qa <feature>` 호출 시 `actionPattern` 정규식이 `qa` 를 파싱하지 못해 `action = null`, state machine 이 전환되지 않음. SKILL.md 에 `### qa` 핸들러 블록 부재로 Claude 가 절차를 알 수 없었음.

**Fix** (`scripts/pdca-skill-stop.js`):
- `actionPattern` 에 `qa` alternation 추가
- `nextStepMap.qa` 엔트리 추가 (next: `report`, fallback: `iterate`)
- Full-Auto `phaseMap` + state transition 내부 `phaseMap` 양쪽에 `qa: 'qa'` 추가
- whitelist 에 `'qa'` 포함

**Fix** (`skills/pdca/SKILL.md`):
- `### qa (QA Phase)` Action Details 블록 추가 — `qa-phase` skill 에 위임하는 라우터 패턴, `QA_PASS`/`QA_FAIL`/`QA_SKIP` 이벤트 명시
- Slash Invoke Pattern 섹션에 `/pdca qa [feature]` 라인 추가

**Verification**: regex capture `'qa'` 성공. state transition whitelist 통과.

### #66 — permission-manager.js TypeError

**Symptom**: 모든 Edit/Write 툴 호출마다 `TypeError: Cannot read properties of null (reading 'getHierarchicalConfig')` 비-차단 에러 발생. 원인은 2026-04-08 commit `21d35d6` 에서 `context-hierarchy.js` / `common.js` 삭제했으나 `permission-manager.js` 가 미갱신.

**Fix** (`lib/permission-manager.js`):
- `checkPermission()`, `getToolPermissions()`, `getAllPermissions()` 3개 함수의 `hierarchy.getHierarchicalConfig(...)` 호출을 ternary null guard 로 교체
- `common.debugLog(...)` 호출을 `if (common)` 가드로 감싸기
- 결과: hierarchy/common 모듈 부재 시 `DEFAULT_PERMISSIONS` 로 fallback, `Bash(rm -rf*): deny` 등 기본 정책 복구

**Verification**: `checkPermission('Bash', 'rm -rf /tmp/x') → 'deny'` (TypeError 0건). Jest suite + plugin load smoke 모두 통과.

### #67 — MCP bkit_report_read ignores bkit.config.json docPaths

**Symptom**: `bkit.config.json` 의 `pdca.docPaths.report` 를 변경해도 MCP `bkit_report_read` 가 하드코딩된 `docs/04-report/features/{feature}.report.md` 만 검색. 동일 버그가 `plan/design/analysis` 읽기 tool 에도 영향.

**Fix** (`servers/bkit-pdca-server/index.js`):
- `loadBkitConfig()` 헬퍼 추가 — `bkit.config.json` 읽기 + mtime 기반 캐시
- `getPhaseTemplates(phase)` 헬퍼 추가 — config 의 `pdca.docPaths[phase]` (array/string 모두 지원) → `FALLBACK_DOC_PATHS` 순으로 resolve
- `docsPath()` 재작성 — templates 전체 순회, 존재하는 첫 파일 반환 (없으면 첫 candidate 반환 → NOT_FOUND 메시지 정보성 유지)
- 기존 호출자 4개 tool (`bkit_plan_read`, `bkit_design_read`, `bkit_analysis_read`, `bkit_report_read`) 시그니처 변경 없음 → 인터페이스 호환

**Verification**:
- Case A (기본 config): plan 파일 정상 resolve → 회귀 없음
- Case B (custom `docPaths.report = ["docs/custom/{feature}.report.md"]`): custom 경로 resolve 확인

## 검증 결과

- 단위 재현 검증: **3/3 PASS**
- Node syntax check: **3/3 PASS**
- Jest full suite: **2 suites, 6 tests, 0 failure**
- `claude -p --plugin-dir .` plugin smoke: **is_error=false, permission_denials=[]**
- 설계 vs 구현 Gap: **0 gaps (100% Match Rate)**

## Key Decisions & Outcomes

| Decision | Outcome |
|---|---|
| #66 은 Option 1 (minimal null guard) 채택 | 이슈 본문의 설계 의도 준수, DEFAULT_PERMISSIONS 정책 복구. Option 2 (파일 삭제) 는 정책 손실, Option 3 (재구현) 은 본 사이클 YAGNI |
| #67 은 MCP 서버에 `lib/core/paths.js` import 대신 로컬 헬퍼 추가 | 기존 "lightweight stdio 서버, 외부 의존 없음" 원칙 유지. 향후 SSOT 리팩터는 별도 이슈로 분리 가능 |
| `/pdca qa` 는 라우터, 실제 실행은 기존 `qa-phase` skill 위임 | 책임 중복 방지, `skills/qa-phase/` 재사용 극대화 |

## 잔존 리스크

1. **Permission hierarchy config feature 는 여전히 미구현**. `DEFAULT_PERMISSIONS` 정책만 작동. 차후 이슈로 재구현 검토.
2. **Plugin cache**: 이미 `~/.claude/plugins/cache/bkit-claude-code/bkit/2.1.1/` 등 과거 버전 cache 를 가진 사용자는 `claude plugin update` 또는 cache clear 필요. Upgrade guide 에 명시.
3. **MCP 서버 SSOT**: `lib/core/paths.js` 의 `FALLBACK_DOC_PATHS` 와 MCP 서버 내부 `FALLBACK_DOC_PATHS` 가 동일 내용을 별도 유지. 드리프트 위험 존재. 차후 이슈로 통합 가능.

## Compatibility

- Claude Code: v2.1.34 ~ v2.1.98+ (63 consecutive releases compatible, v2.1.98 권장)
- bkit upgrade path: v2.1.2 → v2.1.3 (zero-config, drop-in)
- Breaking changes: **none**

## Next Steps

1. Commit + PR + merge to main
2. Tag v2.1.3 + release publish
3. Auto-close #65 #66 #67 via PR body `Closes` trailers
4. 별도 이슈화 고려: permission hierarchy 재구현, MCP paths SSOT 통합
