# v2.1.3 Issue Fixes — Iterate (Gap 분석)

**상위 문서**: `docs/02-design/features/v213-issue-fixes.design.md`
**Iteration**: 1/5

## 설계 vs 구현 Gap 체크리스트

| # | Design 요구 | 구현 상태 | Gap | 비고 |
|---|---|---|---|---|
| 1 | `pdca-skill-stop.js:147` actionPattern 에 `qa` 추가 | ✅ | - | line 147 |
| 2 | `nextStepMap` 에 `qa` 엔트리 추가 (report 앞) | ✅ | - | iterate 뒤 / report 앞 |
| 3 | Full-Auto `phaseMap` 에 `qa` 추가 | ✅ | - | line 254~262 |
| 4 | 2번째 (로컬) `phaseMap` + whitelist 에 `qa` 추가 | ✅ | - | line 293~302 |
| 5 | `SKILL.md` Action Details 에 `### qa` 핸들러 블록 | ✅ | - | iterate 앞 삽입 |
| 6 | `SKILL.md` Slash Invoke Pattern 에 `/pdca qa` 라인 | ✅ | - | iterate 와 report 사이 |
| 7 | `permission-manager.js checkPermission` null guard (hierarchy) | ✅ | - | ternary + comment |
| 8 | `common.debugLog` null guard | ✅ | - | `if (common)` |
| 9 | `permission-manager.js getToolPermissions` null guard | ✅ | - | ternary |
| 10 | `permission-manager.js getAllPermissions` null guard | ✅ | - | ternary |
| 11 | MCP `loadBkitConfig` + cache 추가 | ✅ | - | mtime 기반 |
| 12 | MCP `getPhaseTemplates` 헬퍼 (array/string/fallback) | ✅ | - | array + string + fallback |
| 13 | MCP `docsPath` templates 순회 + findDoc 등가 | ✅ | - | accessSync 체크 |
| 14 | MCP `FALLBACK_DOC_PATHS` 상수 정의 | ✅ | - | analysis 2경로 포함 |
| 15 | Version sync 4개 manifest | ✅ | - | bkit.config/plugin/marketplace/hooks |

## 단위 검증 결과 (Phase Do 중 수행)

| 이슈 | 검증 | 결과 |
|---|---|---|
| #65 | regex match on `pdca qa v213-issue-fixes` | `qa` capture PASS |
| #66 | checkPermission `Bash rm -rf /tmp/x` | `deny` PASS, no TypeError |
| #66 | checkPermission `Bash git push --force` | `deny` PASS |
| #66 | getAllPermissions keys | 8 keys PASS |
| #67 | default config `bkit_plan_read v213-issue-fixes` | resolved PASS |
| #67 | custom config `docPaths.report` = `docs/custom/...` | resolved to custom PASS |
| All | Node syntax check (3 files) | OK |
| All | Jest full suite | 2 suites / 6 tests PASS |
| Plugin | `claude -p --plugin-dir .` smoke | is_error=false, no permission_denials |

## Match Rate

- **15 / 15 = 100%** 설계서 항목 모두 구현 완료
- **9 / 9** 단위 검증 모두 통과
- **Match Rate: 100%** (threshold 95% 초과)

## Gap 결론

0 gaps detected. 추가 iteration 불필요. Phase QA → Report 로 진행.
