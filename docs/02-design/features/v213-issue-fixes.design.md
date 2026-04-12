# v2.1.3 Issue Fixes — Design

**Feature**: `v213-issue-fixes`
**상위 문서**: `docs/01-plan/features/v213-issue-fixes.plan.md`

## 변경 파일 요약

| # | 파일 | 이슈 | 변경 라인 수(추정) |
|---|---|---|---|
| 1 | `scripts/pdca-skill-stop.js` | #65 | ~15 |
| 2 | `skills/pdca/SKILL.md` | #65 | ~30 |
| 3 | `lib/permission-manager.js` | #66 | ~10 |
| 4 | `servers/bkit-pdca-server/index.js` | #67 | ~50 |
| 5 | `bkit.config.json` | Version | 1 |
| 6 | `.claude-plugin/plugin.json` | Version | 1 |
| 7 | `.claude-plugin/marketplace.json` | Version | 1 |
| 8 | `hooks/hooks.json` | Version | 1 |
| 9 | `CHANGELOG.md` | Release notes | ~25 |

---

## #65 — `/pdca qa` 통합 설계

### 1. `scripts/pdca-skill-stop.js` patch

**Line 147** actionPattern 에 `qa` 추가:
```diff
- const actionPattern = /pdca\s+(pm|plan|design|do|analyze|iterate|report|status|next)/i;
+ const actionPattern = /pdca\s+(pm|plan|design|do|analyze|iterate|qa|report|status|next)/i;
```

**Line 165~242** `nextStepMap` 에 `qa` 엔트리 추가 (analyze 와 동등한 위치, iterate 앞):
```javascript
qa: {
  nextAction: 'report',
  message: 'QA phase (L1-L5 tests) completed.',
  question: 'Proceed to completion report?',
  options: [
    { label: 'Generate Report (Recommended)', description: `/pdca report ${feature || '[feature]'}` },
    { label: 'Re-run QA', description: `/pdca qa ${feature || '[feature]'}` },
    { label: 'Later', description: 'Keep current state' }
  ]
},
```

**Line 254~261** Full-Auto `phaseMap` 에 `qa` 추가:
```diff
  const phaseMap = {
    plan: 'plan',
    design: 'design',
    do: 'do',
    analyze: 'check',
    iterate: 'act',
+   qa: 'qa',
    report: 'completed'
  };
```

**Line 293~301** state-transition whitelist + 내부 phaseMap 에 `qa` 추가:
```diff
- if (action && feature && ['plan', 'design', 'do', 'analyze', 'iterate', 'report'].includes(action)) {
+ if (action && feature && ['plan', 'design', 'do', 'analyze', 'iterate', 'qa', 'report'].includes(action)) {
    const phaseMap = {
      plan: 'plan',
      design: 'design',
      do: 'do',
      analyze: 'check',
      iterate: 'act',
+     qa: 'qa',
      report: 'completed'
    };
```

### 2. `skills/pdca/SKILL.md` patch

**A. 새 핸들러 블록 추가** (line 279 `### iterate` 앞에 삽입, 아니면 `### report` 앞도 가능 — PDCA 순서상 iterate→qa→report 로 qa 를 iterate 뒤/report 앞에 배치):

```markdown
### qa (QA Phase)

1. Verify Iterate completion (Match Rate ≥ target or max iterations reached)
2. **Delegate to qa-phase skill**: Invoke the standalone `/qa-phase {feature}` skill,
   which owns L1-L5 test planning, generation, execution, and reporting.
3. The qa-phase skill:
   - Reads Design doc §8 Test Plan
   - Calls `qa-test-planner` to refine L1-L5 test specs
   - Calls `qa-test-generator` to emit runnable test files
   - Executes L1 (API) / L2 (UI actions) / L3 (E2E) tests via Chrome MCP
   - Optional L4 (perf) / L5 (security) for Enterprise level
4. Emit one of:
   - `QA_PASS` → auto-advance to `report` phase
   - `QA_FAIL` → fall back to `iterate` phase
   - `QA_SKIP` → mark qa as skipped, proceed to `report`
5. Create Task: `[QA] {feature}`
6. Update .bkit/state/pdca-status.json: phase = "qa", qaStatus = <PASS|FAIL|SKIP>

**Output Path**: `docs/05-qa/{feature}.qa-report.md`

**Agent**: `bkit:qa-lead` (mapped via frontmatter `agents.qa`)
```

**B. Slash Invoke Pattern 섹션 (line 645~652) 에 한 줄 추가**:
```diff
- `/pdca iterate [feature]` — Auto-improvement (Act phase)
+ `/pdca qa [feature]` — Run QA phase (L1-L5 tests)
- `/pdca report [feature]` — Completion report
```

---

## #66 — permission-manager null guard

### `lib/permission-manager.js` patch

**Line 57~96** `checkPermission()` 함수: hierarchy/common null 가드 적용.

```diff
 function checkPermission(toolName, toolInput = '') {
   const hierarchy = getHierarchy();
   const common = getCommon();

-  // Get permissions from hierarchical config, falling back to defaults
-  const permissions = hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);
+  // v2.1.3 (#66): hierarchy module was deleted in commit 21d35d6 — fall back
+  // to DEFAULT_PERMISSIONS when the lazy require returned null.
+  const permissions = hierarchy
+    ? hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS)
+    : DEFAULT_PERMISSIONS;
   ...
   for (const pattern of patterns) {
     ...
     if (matcher.test(toolInput)) {
-      common.debugLog('Permission', 'Pattern matched', { pattern, toolInput, permission: permissions[pattern] });
+      if (common) {
+        common.debugLog('Permission', 'Pattern matched', { pattern, toolInput, permission: permissions[pattern] });
+      }
       return permissions[pattern];
     }
   }
```

**Line 103~115** `getToolPermissions()`:
```diff
 function getToolPermissions(toolName) {
   const hierarchy = getHierarchy();
-  const permissions = hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);
+  const permissions = hierarchy
+    ? hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS)
+    : DEFAULT_PERMISSIONS;
```

**Line 149~152** `getAllPermissions()`:
```diff
 function getAllPermissions() {
   const hierarchy = getHierarchy();
-  return hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS);
+  return hierarchy
+    ? hierarchy.getHierarchicalConfig('permissions', DEFAULT_PERMISSIONS)
+    : DEFAULT_PERMISSIONS;
 }
```

---

## #67 — MCP docPaths 준수 설계

### `servers/bkit-pdca-server/index.js` patch

**Line 11~46** import + `docsPath()` 대체:

```javascript
// --- existing imports ---
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const ROOT = process.env.BKIT_ROOT || process.cwd();
const BKIT_DIR = path.join(ROOT, '.bkit');
const DOCS_DIR = path.join(ROOT, 'docs');
const CONFIG_PATH = path.join(ROOT, 'bkit.config.json');

// Fallback PHASE_MAP (used only when bkit.config.json is missing or lacks docPaths)
const PHASE_MAP = {
  plan: '01-plan',
  design: '02-design',
  analysis: '03-analysis',
  report: '04-report',
};

const FALLBACK_DOC_PATHS = {
  plan:     ['docs/01-plan/features/{feature}.plan.md'],
  design:   ['docs/02-design/features/{feature}.design.md'],
  analysis: ['docs/03-analysis/{feature}.analysis.md',
             'docs/03-analysis/features/{feature}.analysis.md'],
  report:   ['docs/04-report/features/{feature}.report.md'],
};

let _cachedConfig = null;
let _cachedConfigMtime = 0;

function loadBkitConfig() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    const stat = fs.statSync(CONFIG_PATH);
    if (_cachedConfig && stat.mtimeMs === _cachedConfigMtime) return _cachedConfig;
    _cachedConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    _cachedConfigMtime = stat.mtimeMs;
    return _cachedConfig;
  } catch {
    return null;
  }
}

function getPhaseTemplates(phase) {
  const cfg = loadBkitConfig();
  const configured = cfg && cfg.pdca && cfg.pdca.docPaths && cfg.pdca.docPaths[phase];
  if (Array.isArray(configured) && configured.length > 0) return configured;
  if (typeof configured === 'string' && configured) return [configured];
  return FALLBACK_DOC_PATHS[phase] || null;
}

// Returns the first existing resolved path, or the first candidate when none exist
// (callers then surface NOT_FOUND with that path so error messages are informative).
function docsPath(phase, feature) {
  const templates = getPhaseTemplates(phase);
  if (!templates) return null;
  const resolved = templates.map(t =>
    path.join(ROOT, t.replace(/\{feature\}/g, feature))
  );
  for (const p of resolved) {
    try {
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch { /* continue */ }
  }
  return resolved[0];
}
```

**주의**: 기존 `DOCS_DIR` 상수는 유지하되 `docsPath()` 내부에서는 사용 안 함 (templates 는 `docs/...` 접두어를 포함). 하위 호환 위해 상수 자체는 남겨둔다.

### 기존 호출자 영향

- `TOOL_HANDLERS` 의 `bkit_plan_read`, `bkit_design_read`, `bkit_analysis_read`, `bkit_report_read` 4개 tool 이 동일한 `handleDocRead(phase, args)` 경유 → `docsPath()` 시그니처 동일, 호출자 코드 변경 불필요.

---

## Version Sync

4개 manifest 모두 `2.1.2 → 2.1.3`:
- `bkit.config.json` line 2
- `.claude-plugin/plugin.json` line 3
- `.claude-plugin/marketplace.json` line 37 (bkit-claude-code plugin entry). line 4 는 marketplace spec version 이므로 건드리지 않음.
- `hooks/hooks.json` description line 3

## 테스트 설계

### 단위 테스트 (로컬, test-scripts/unit/, gitignored)

- `v213-issue-65-qa-action.test.js` — regex 와 whitelist
- `v213-issue-66-permission-manager.test.js` — TypeError 없음 + DEFAULT_PERMISSIONS fallback
- `v213-issue-67-mcp-docpaths.test.js` — config 변경 시 경로 변화, 기본 회귀

### QA 재현 검증 (Phase 5 에서 실행)

| 이슈 | 검증 명령 | 합격 조건 |
|---|---|---|
| #65 | `node -e "const re=/pdca\\s+(pm\|plan\|design\|do\|analyze\|iterate\|qa\|report\|status\|next)/i; const m='pdca qa v213'.match(re); console.log(m[1])"` | `qa` 출력 |
| #66 | `node -e "const m=require('./lib/permission-manager.js'); console.log(m.checkPermission('Bash','rm -rf /tmp/x'))"` | `deny` 출력, stack 없음 |
| #67 | 임시 config 수정 후 MCP tools/call bkit_report_read JSON-RPC 호출 | filePath 에 custom 경로 반영 |

## 위험 및 롤백

- 모든 변경이 additive. 롤백 시 `git revert <sha>` 로 즉시 원복 가능.
- permission-manager null guard 는 기존 동작의 strict superset (이전엔 throw, 이후엔 DEFAULT 사용).
- MCP 폴백은 config 누락 시 기존 PHASE_MAP 기반 경로와 동등한 결과 생성.
