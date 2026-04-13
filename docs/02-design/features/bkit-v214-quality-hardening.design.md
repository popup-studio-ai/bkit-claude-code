# bkit v2.1.4 Quality Hardening — Design

> **Feature**: bkit-v214-quality-hardening
> **Architecture**: Option B — Clean Architecture
> **Plan Reference**: docs/01-plan/features/bkit-v214-quality-hardening.plan.md
> **작성일**: 2026-04-13
> **상태**: Draft

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | QA 프로세스 근본 개선 — "테스트했는데 이슈 나옴" 문제 해결 |
| **WHO** | bkit 개발자 (자신), bkit 사용자 (plugin 사용자) |
| **RISK** | ENH P1 범위 초과로 일정 지연, 스캐너 false positive |
| **SUCCESS** | 배포 후 1주 이슈 0건 + 스캐너 4개 동작 + pre-release QA 통합 |
| **SCOPE** | #71 fix + ENH P0-P1 12건 + Scanner 4개 + CC v2.1.104 compat |

---

## 1. Overview

### 1.1 아키텍처 선택 근거

**Option B — Clean Architecture** 선택 이유:

| 기준 | A: Script-Only | **B: Clean Architecture** | C: Monolith Scanner |
|------|:-:|:-:|:-:|
| **접근법** | scripts/qa/*.sh | lib/qa/ 모듈 + scanner-base | 단일 pre-release-check.js |
| **신규 파일** | ~5 (shell only) | **~15 (module + tests)** | ~3 |
| **재사용성** | Low (shell 고정) | **High (JS API + CLI)** | Medium |
| **테스트 가능성** | Low (shell 테스트 어려움) | **High (Jest 단위 테스트)** | Medium |
| **v3.0.0 이전 가능성** | 재작성 필요 | **그대로 이전** | 부분 재작성 |
| **리스크** | Low | **Medium** | Low |
| **추천** | 임시 도구 | **현재 상황 최적** | 소규모 프로젝트 |

**선택**: Option B — **Clean Architecture**
**근거**: (1) 기존 `lib/qa/`가 이미 존재(test-runner, report-generator 등)하므로 같은 모듈 내 확장이 자연스러움. (2) Node.js 기반이면 Jest 단위 테스트 가능. (3) `lib/qa/index.js`의 public API에 `runAllScanners()` 추가만으로 기존 qa-phase 스킬과 통합. (4) v3.0.0 Clean Architecture 이전 시 모듈 경계가 명확하여 그대로 이동 가능.

### 1.2 핵심 설계 결정

| # | 결정 | 근거 |
|---|------|------|
| D1 | 기존 `lib/qa/` 모듈에 스캐너 추가 (별도 모듈 X) | 관련 기능 응집도 유지, import path 일관성 |
| D2 | ScannerBase 클래스로 4개 스캐너 통일 인터페이스 | 일관된 scan/report 패턴, 신규 스캐너 추가 용이 |
| D3 | 심각도 3단계 (CRITICAL/WARNING/INFO) | CRITICAL만 릴리스 차단, WARNING/INFO는 권고 |
| D4 | `pre-release-check.sh`는 thin wrapper | Node.js 로직은 lib/qa에 집중, shell은 호출만 |
| D5 | Hook handler는 기존 패턴 준수 | hooks.json의 CwdChanged/TaskCreated/FileChanged 이미 선언됨 |
| D6 | ENH 각 건은 독립 PR 가능 | 범위 초과 시 일부를 v2.1.5로 강등 가능 |

### 1.3 파일 구조 Overview

```
lib/qa/                          # 기존 모듈 확장
├── index.js                     # [MODIFY] Public API에 scanner exports 추가
├── scanner-base.js              # [CREATE] Base class: ScannerBase
├── scanners/
│   ├── dead-code.js             # [CREATE] stale require/import 탐지
│   ├── config-audit.js          # [CREATE] config ↔ 코드 불일치 탐지
│   ├── completeness.js          # [CREATE] SKILL.md ↔ 구현 갭 탐지
│   └── shell-escape.js          # [CREATE] $N 치환 충돌 탐지
├── reporter.js                  # [CREATE] 스캔 결과 포매팅 (JSON/markdown/console)
├── utils/
│   ├── file-resolver.js         # [CREATE] require/import 경로 해석
│   └── pattern-matcher.js       # [CREATE] 정규식 패턴 유틸리티
├── test-runner.js               # [EXISTING] 기존 유지
├── chrome-bridge.js             # [EXISTING] 기존 유지
├── report-generator.js          # [EXISTING] 기존 유지
└── test-plan-builder.js         # [EXISTING] 기존 유지

scripts/qa/
└── pre-release-check.sh         # [CREATE] 4개 스캐너 통합 실행 shell wrapper

tests/qa/
├── scanner-base.test.js         # [CREATE] Base class 테스트
├── dead-code.test.js            # [CREATE] Dead code scanner 테스트
├── config-audit.test.js         # [CREATE] Config audit scanner 테스트
├── completeness.test.js         # [CREATE] Completeness checker 테스트
└── shell-escape.test.js         # [CREATE] Shell escape validator 테스트
```

---

## 2. Module Architecture — lib/qa/

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                    lib/qa/ Module (v2.1.4 확장)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌── 기존 모듈 (변경 없음) ──────────────────────────────────────┐  │
│  │  test-runner.js │ chrome-bridge.js │ report-generator.js       │  │
│  │  test-plan-builder.js                                          │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌── 신규: Scanner Framework ─────────────────────────────────────┐ │
│  │                                                                 │ │
│  │  scanner-base.js ◄─── 4개 스캐너가 상속                        │ │
│  │    ├ scan()          // abstract — 각 스캐너 구현               │ │
│  │    ├ formatReport()  // 공통 포맷                               │ │
│  │    └ severity levels // CRITICAL, WARNING, INFO                │ │
│  │                                                                 │ │
│  │  scanners/                                                      │ │
│  │    ├ dead-code.js       ── require/import 존재 확인             │ │
│  │    ├ config-audit.js    ── config 키 참조 확인                  │ │
│  │    ├ completeness.js    ── SKILL.md ↔ 구현 갭                  │ │
│  │    └ shell-escape.js    ── $N 치환 충돌                        │ │
│  │                                                                 │ │
│  │  reporter.js    ── JSON/markdown/console 출력                  │ │
│  │  utils/                                                         │ │
│  │    ├ file-resolver.js   ── 경로 해석 유틸리티                   │ │
│  │    └ pattern-matcher.js ── 정규식 유틸리티                      │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  index.js ── Public API                                             │
│    ├ 기존: runTests, runTestLevel, checkChromeAvailable, ...        │
│    └ 신규: runAllScanners(), runScanner(name), getScannerNames()    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터 흐름

```
pre-release-check.sh
  └→ node -e "require('./lib/qa').runAllScanners()"
       ├→ ScannerBase.scan() × 4
       │    ├→ dead-code.scan()      → Issue[]
       │    ├→ config-audit.scan()   → Issue[]
       │    ├→ completeness.scan()   → Issue[]
       │    └→ shell-escape.scan()   → Issue[]
       ├→ reporter.format(allIssues, 'console')
       │    └→ stdout: 요약 출력
       ├→ reporter.format(allIssues, 'json')
       │    └→ .bkit/qa-scan-results.json 저장
       └→ exit code: CRITICAL 있으면 1, 없으면 0

qa-phase Skill
  └→ Step: "pre-release 스캐너 실행"
       └→ Bash: scripts/qa/pre-release-check.sh
            └→ 스캔 결과를 QA 보고서에 포함
```

### 2.3 의존성 관계

| 모듈 | 의존 대상 | 목적 |
|------|----------|------|
| scanner-base.js | utils/file-resolver.js | 파일 경로 해석 공통 로직 |
| scanner-base.js | utils/pattern-matcher.js | 정규식 매칭 공통 로직 |
| dead-code.js | scanner-base.js | 기반 클래스 상속 |
| dead-code.js | utils/file-resolver.js | require/import 대상 파일 존재 확인 |
| config-audit.js | scanner-base.js | 기반 클래스 상속 |
| completeness.js | scanner-base.js | 기반 클래스 상속 |
| shell-escape.js | scanner-base.js | 기반 클래스 상속 |
| reporter.js | (없음) | 순수 포맷팅, 외부 의존 없음 |
| index.js | scanner-base.js, scanners/*.js, reporter.js | 통합 API |
| pre-release-check.sh | lib/qa/index.js | Node.js 호출 |

---

## 3. Scanner Details

### 3.1 Dead Code Scanner (`dead-code.js`)

#### 입력

| 항목 | 값 |
|------|---|
| 스캔 대상 | `lib/**/*.js`, `hooks/**/*.js`, `scripts/**/*.js` |
| 제외 대상 | `node_modules/`, `tests/`, `*.test.js` |
| 예방 이슈 | #66 (삭제된 context-hierarchy.js, common.js 참조) |

#### 알고리즘

```
Phase 1: require/import 존재 확인
  FOR each .js file in scan targets:
    EXTRACT all require('path') and import 'path' statements
    RESOLVE path relative to file location
    IF resolved path does not exist as .js or directory/index.js:
      EMIT Issue(CRITICAL, file, line, "require target not found: ${path}")

Phase 2: 미사용 exports 탐지
  FOR each .js file in lib/:
    EXTRACT all module.exports keys
    FOR each exported name:
      COUNT references across entire codebase (excluding self)
      IF count === 0:
        EMIT Issue(WARNING, file, line, "exported but never imported: ${name}")

Phase 3: Agent/Skill 참조 검증
  FOR each agents/*.md:
    EXTRACT referenced lib modules from content
    IF module file does not exist:
      EMIT Issue(CRITICAL, agentFile, line, "references non-existent module: ${module}")
```

#### 출력 형식

```javascript
{
  file: 'lib/permission-manager.js',
  line: 3,
  severity: 'CRITICAL',
  message: 'require target not found: ./core/context-hierarchy',
  pattern: 'stale-require',
  fix: 'Remove or update the require statement'
}
```

### 3.2 Config Audit Scanner (`config-audit.js`)

#### 입력

| 항목 | 값 |
|------|---|
| 설정 파일 | `bkit.config.json`, `.claude-plugin/plugin.json` |
| 스캔 대상 | `lib/**/*.js`, `scripts/**/*.js`, `hooks/**/*.js`, `servers/**/*.js` |
| 예방 이슈 | #67 (PHASE_MAP 하드코딩, docPaths 무시) |

#### 알고리즘

```
Phase 1: Config 키 참조 확인
  PARSE bkit.config.json → configKeys[]
  FOR each configKey:
    SEARCH codebase for references (configKey name in string literals or property access)
    IF referenceCount === 0:
      EMIT Issue(WARNING, 'bkit.config.json', keyLine, "config key never referenced: ${key}")

Phase 2: 하드코딩 탐지
  DEFINE knownPatterns = [
    { config: 'docPaths.*', code: /PHASE_MAP|phase_map/i, desc: 'document path mapping' },
    { config: 'version', code: /['"]2\.\d+\.\d+['"]/, desc: 'version string' },
    { config: 'ccVersion.*', code: /['"]v2\.1\.\d+['"]/, desc: 'CC version reference' }
  ]
  FOR each pattern in knownPatterns:
    SEARCH codebase for code pattern
    FOR each match:
      IF value differs from config value:
        EMIT Issue(WARNING, file, line, "hardcoded value should use config: ${desc}")
      IF value duplicates config value exactly:
        EMIT Issue(INFO, file, line, "consider using config instead of literal: ${desc}")

Phase 3: Docs=Code 철학 위반 탐지
  COMPARE bkit.config.json paths with actual directory structure
  FOR each declared path in config:
    IF path does not exist on filesystem:
      EMIT Issue(CRITICAL, 'bkit.config.json', line, "declared path does not exist: ${path}")
```

#### 출력 형식

```javascript
{
  file: 'servers/bkit-pdca-server/index.js',
  line: 38,
  severity: 'WARNING',
  message: 'hardcoded PHASE_MAP should use bkit.config.json docPaths',
  pattern: 'hardcoded-config',
  fix: 'Read PHASE_MAP from bkit.config.json docPaths configuration'
}
```

### 3.3 Completeness Checker (`completeness.js`)

#### 입력

| 항목 | 값 |
|------|---|
| 스캔 대상 | `skills/*/SKILL.md`, `agents/*.md` |
| 참조 대상 | `scripts/**/*.js`, `lib/**/*.js`, CC tools 목록 |
| 예방 이슈 | #65 (/pdca qa subcommand 불완전) |

#### 알고리즘

```
Phase 1: Skill → Agent 참조 검증
  FOR each skills/*/SKILL.md:
    EXTRACT agentTeam/agents from frontmatter
    FOR each referenced agent:
      IF agents/${agent}.md does not exist:
        EMIT Issue(CRITICAL, skillFile, line, "references non-existent agent: ${agent}")

Phase 2: Skill → Tools 검증
  DEFINE ccTools = ['Read', 'Write', 'Edit', 'Bash', 'Glob', 'Grep',
    'Skill', 'ToolSearch', 'ScheduleWakeup', 'Monitor', ...]  // CC v2.1.104 기준 32개
  FOR each skills/*/SKILL.md:
    EXTRACT tools from frontmatter
    FOR each tool:
      IF tool NOT in ccTools AND NOT starts with 'mcp__':
        EMIT Issue(WARNING, skillFile, line, "references unknown tool: ${tool}")

Phase 3: Subcommand 핸들러 검증
  FOR each skills/*/SKILL.md:
    EXTRACT subcommands from content (e.g., "/pdca qa", "/pdca do")
    FOR each subcommand:
      SEARCH for handler logic in skill body or referenced scripts
      IF no handler found:
        EMIT Issue(WARNING, skillFile, line, "subcommand declared but no handler: ${sub}")

Phase 4: Frontmatter 일관성
  FOR each skills/*/SKILL.md:
    PARSE frontmatter
    IF missing 'effort':
      EMIT Issue(INFO, skillFile, 1, "missing effort frontmatter (ENH-134)")
    IF description.length > 250:
      EMIT Issue(WARNING, skillFile, 1, "description exceeds 250 char limit (CC v2.1.86)")
    IF missing 'description':
      EMIT Issue(CRITICAL, skillFile, 1, "missing required description frontmatter")
```

#### 출력 형식

```javascript
{
  file: 'skills/pdca/SKILL.md',
  line: 45,
  severity: 'WARNING',
  message: 'subcommand declared but no handler: /pdca qa',
  pattern: 'incomplete-subcommand',
  fix: 'Implement handler for /pdca qa subcommand'
}
```

### 3.4 Shell Escape Validator (`shell-escape.js`)

#### 입력

| 항목 | 값 |
|------|---|
| 스캔 대상 | `skills/*/SKILL.md` (shell 블록만) |
| 블록 식별 | ` ```! ` (CC skill engine shell block) |
| 예방 이슈 | #71 (awk $1 충돌), #53 (Windows 괄호) |

#### 알고리즘

```
Phase 1: Shell 블록 추출
  FOR each skills/*/SKILL.md:
    EXTRACT all ```! ... ``` code blocks
    FOR each block, record startLine

Phase 2: $N 치환 충돌 탐지
  FOR each shell block:
    SCAN for patterns: /\$[1-9]/, /\$\{[1-9]/, /\$[A-Z_]*[1-9]/
    EXCLUDE patterns inside single-quoted strings (CC doesn't substitute there)
    FOR each match:
      IF inside awk, sed, or similar command context:
        EMIT Issue(CRITICAL, file, line, "bare $N in shell block — CC skill engine will substitute")
      ELSE:
        EMIT Issue(WARNING, file, line, "$N pattern may conflict with CC skill engine substitution")

Phase 3: 이스케이프 안전성
  FOR each shell block:
    SCAN for unescaped backticks: /(?<!\\)`/
    IF found:
      EMIT Issue(WARNING, file, line, "unescaped backtick — use $(command) instead")

Phase 4: Windows 호환성
  FOR each shell block:
    SCAN for risky patterns:
      /\(.*\)/ in file paths → Issue(INFO, "parentheses in path — Windows risk")
      spaces in unquoted paths → Issue(INFO, "unquoted path with spaces")

Phase 5: Heredoc 변수 치환 위험
  FOR each shell block:
    SCAN for heredoc: /<<\s*(\w+)/ (non-quoted delimiter)
    IF heredoc body contains $N patterns:
      EMIT Issue(WARNING, file, line, "heredoc with unquoted delimiter — $N will be expanded")
    NOTE: <<'EOF' (quoted) is safe
```

#### 출력 형식

```javascript
{
  file: 'skills/pdca/SKILL.md',
  line: 127,
  severity: 'CRITICAL',
  message: 'bare $1 in awk command — CC skill engine will substitute with skill argument',
  pattern: 'dollar-n-conflict',
  fix: 'Use awk -v var=val pattern or escape as \\$1'
}
```

---

## 4. Scanner Base Class

### 4.1 인터페이스 설계

```javascript
// lib/qa/scanner-base.js

/**
 * Base class for all quality scanners
 * @abstract
 */
class ScannerBase {
  /**
   * @param {string} name — Scanner identifier (e.g., 'dead-code')
   * @param {Object} options
   * @param {string} options.rootDir — Project root directory (default: process.cwd())
   * @param {string[]} options.include — Glob patterns to include
   * @param {string[]} options.exclude — Glob patterns to exclude
   * @param {boolean} options.verbose — Enable verbose logging (default: false)
   */
  constructor(name, options = {}) {
    this.name = name;
    this.rootDir = options.rootDir || process.cwd();
    this.include = options.include || [];
    this.exclude = options.exclude || ['node_modules/**', '*.test.js'];
    this.verbose = options.verbose || false;
    this.issues = [];
  }

  /**
   * Run the scanner — must be implemented by subclasses
   * @abstract
   * @returns {Promise<Issue[]>}
   */
  async scan() {
    throw new Error(`${this.name}: scan() must be implemented`);
  }

  /**
   * Add an issue to the results
   * @param {string} severity — 'CRITICAL' | 'WARNING' | 'INFO'
   * @param {string} file — Relative file path
   * @param {number} line — Line number (0 if unknown)
   * @param {string} message — Human-readable description
   * @param {string} pattern — Issue pattern identifier
   * @param {string} [fix] — Suggested fix
   */
  addIssue(severity, file, line, message, pattern, fix) {
    this.issues.push({ file, line, severity, message, pattern, fix: fix || null });
  }

  /**
   * Get summary counts by severity
   * @returns {{ critical: number, warning: number, info: number, total: number }}
   */
  getSummary() {
    return {
      critical: this.issues.filter(i => i.severity === 'CRITICAL').length,
      warning: this.issues.filter(i => i.severity === 'WARNING').length,
      info: this.issues.filter(i => i.severity === 'INFO').length,
      total: this.issues.length
    };
  }

  /**
   * Format a report of all issues
   * @param {'console'|'json'|'markdown'} format
   * @returns {string}
   */
  formatReport(format = 'console') {
    const reporter = require('./reporter');
    return reporter.formatScannerReport(this.name, this.issues, format);
  }

  /**
   * Reset issues for re-scan
   */
  reset() {
    this.issues = [];
  }
}

module.exports = ScannerBase;
```

### 4.2 Issue 타입 정의

```javascript
/**
 * @typedef {Object} Issue
 * @property {string} file — Relative file path from project root
 * @property {number} line — Line number (1-based, 0 if unknown)
 * @property {'CRITICAL'|'WARNING'|'INFO'} severity
 * @property {string} message — Human-readable description
 * @property {string} pattern — Pattern identifier for grouping/filtering
 * @property {string|null} fix — Suggested fix or null
 */
```

### 4.3 심각도 기준

| 심각도 | 기준 | 예시 | 릴리스 영향 |
|--------|------|------|------------|
| **CRITICAL** | 런타임 에러 유발 또는 핵심 기능 장애 | stale require, 존재하지 않는 agent 참조, bare $1 in awk | **릴리스 차단** |
| **WARNING** | 잠재적 문제 또는 일관성 위반 | 미사용 export, 하드코딩, description 초과 | 수정 권장 |
| **INFO** | 개선 제안 또는 스타일 | config 사용 제안, missing effort frontmatter | 참고 |

---

## 5. Integration Points

### 5.1 Public API 확장 (`lib/qa/index.js`)

```javascript
// lib/qa/index.js — 신규 추가분

const DeadCodeScanner = require('./scanners/dead-code');
const ConfigAuditScanner = require('./scanners/config-audit');
const CompletenessScanner = require('./scanners/completeness');
const ShellEscapeScanner = require('./scanners/shell-escape');
const reporter = require('./reporter');

const SCANNERS = {
  'dead-code': DeadCodeScanner,
  'config-audit': ConfigAuditScanner,
  'completeness': CompletenessScanner,
  'shell-escape': ShellEscapeScanner
};

/**
 * Run all scanners and return aggregated results
 * @param {Object} [options] — Scanner options (rootDir, verbose)
 * @returns {Promise<{ scanners: Object, summary: Object, hasCritical: boolean }>}
 */
async function runAllScanners(options = {}) {
  const results = {};
  let totalCritical = 0;

  for (const [name, ScannerClass] of Object.entries(SCANNERS)) {
    const scanner = new ScannerClass(options);
    const issues = await scanner.scan();
    const summary = scanner.getSummary();
    results[name] = { issues, summary };
    totalCritical += summary.critical;
  }

  return {
    scanners: results,
    summary: {
      totalScanners: Object.keys(SCANNERS).length,
      totalIssues: Object.values(results).reduce((sum, r) => sum + r.issues.length, 0),
      totalCritical
    },
    hasCritical: totalCritical > 0
  };
}

/**
 * Run a single scanner by name
 * @param {string} name — Scanner name ('dead-code', 'config-audit', etc.)
 * @param {Object} [options]
 * @returns {Promise<{ issues: Issue[], summary: Object }>}
 */
async function runScanner(name, options = {}) {
  const ScannerClass = SCANNERS[name];
  if (!ScannerClass) throw new Error(`Unknown scanner: ${name}`);
  const scanner = new ScannerClass(options);
  const issues = await scanner.scan();
  return { issues, summary: scanner.getSummary() };
}

/**
 * Get available scanner names
 * @returns {string[]}
 */
function getScannerNames() {
  return Object.keys(SCANNERS);
}

// 기존 exports에 추가
module.exports = {
  // 기존 유지
  runTests, runTestLevel, getTestSummary, TEST_LEVELS,
  checkChromeAvailable, createChromeBridge,
  generateQaReport, formatQaReportMd,
  buildTestPlan, parseDesignDoc,

  // 신규 Scanner API
  runAllScanners,
  runScanner,
  getScannerNames,
  SCANNERS
};
```

### 5.2 `pre-release-check.sh`

```bash
#!/bin/bash
# scripts/qa/pre-release-check.sh
# bkit pre-release quality scanner — 4개 패턴 스캐너 통합 실행
# Usage: bash scripts/qa/pre-release-check.sh [--json] [--scanner NAME]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

FORMAT="console"
SCANNER=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --json) FORMAT="json"; shift ;;
    --scanner) SCANNER="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

if [ -n "$SCANNER" ]; then
  node -e "
    const qa = require('${PROJECT_ROOT}/lib/qa');
    qa.runScanner('${SCANNER}', { rootDir: '${PROJECT_ROOT}' })
      .then(r => {
        if ('${FORMAT}' === 'json') {
          console.log(JSON.stringify(r, null, 2));
        } else {
          console.log(qa.formatScanReport('${SCANNER}', r.issues));
        }
        process.exit(r.summary.critical > 0 ? 1 : 0);
      })
      .catch(e => { console.error(e.message); process.exit(2); });
  "
else
  node -e "
    const qa = require('${PROJECT_ROOT}/lib/qa');
    qa.runAllScanners({ rootDir: '${PROJECT_ROOT}' })
      .then(r => {
        if ('${FORMAT}' === 'json') {
          console.log(JSON.stringify(r, null, 2));
        } else {
          console.log('=== bkit Pre-Release Quality Scan ===');
          console.log('Scanners: ' + r.summary.totalScanners);
          console.log('Total Issues: ' + r.summary.totalIssues);
          console.log('Critical: ' + r.summary.totalCritical);
          console.log(r.summary.totalCritical > 0 ? 'RESULT: BLOCKED' : 'RESULT: PASS');
        }
        process.exit(r.hasCritical ? 1 : 0);
      })
      .catch(e => { console.error(e.message); process.exit(2); });
  "
fi
```

### 5.3 qa-phase Skill 연동

**수정 파일**: `skills/qa-phase/SKILL.md`

기존 QA phase 프로세스에 스캐너 단계 추가:

```
기존 L1~L5 테스트 시퀀스:
  L1 → L2 → L3 → L4 → L5

수정 후 시퀀스:
  [PRE-SCAN] → L1 → L2 → L3 → L4 → L5

PRE-SCAN 단계:
  1. Bash: scripts/qa/pre-release-check.sh
  2. CRITICAL 발견 시 → QA 중단, 수정 안내
  3. WARNING/INFO만 → QA 보고서에 포함 후 L1 진행
```

### 5.4 Hook Event 현황

hooks.json에는 CwdChanged, TaskCreated, FileChanged가 **이미 선언되어 있음** (v2.1.3에서 추가됨).

| Hook Event | 핸들러 | 상태 | v2.1.4 작업 |
|------------|--------|------|------------|
| CwdChanged | `scripts/cwd-changed-handler.js` | ✅ 존재 | ENH-149: 로직 보강 (프로젝트 전환 감지) |
| TaskCreated | `scripts/task-created-handler.js` | ✅ 존재 | ENH-156: 로직 보강 (PDCA Task audit) |
| FileChanged | `scripts/file-changed-handler.js` | ✅ 존재 | 기존 유지 (docs/ 변경 감지) |

따라서 hooks.json 수정은 **불필요**. 기존 핸들러 파일의 로직을 보강하는 것으로 충분.

---

## 6. ENH Implementation Details

### 6.1 ENH 매트릭스

| # | ENH | 분류 | 구현 방법 | 변경 파일 | 작업량 | 비고 |
|---|-----|------|----------|----------|--------|------|
| 1 | ENH-134 | P0 코드 | 37 SKILL.md에 `effort:` frontmatter 일괄 추가 | `skills/*/SKILL.md` (37개) | 3h | effort 분류: Section 6.2 참조 |
| 2 | ENH-193 | P0 검증 | v2.1.2에서 이미 구현 완료 확인 | - | 0h | 검증만 |
| 3 | ENH-196 | P1 검증 | context:fork + agent frontmatter 정상 동작 확인 | `skills/zero-script-qa/` | 1h | 수동 검증 |
| 4 | ENH-138 | P1 문서 | `docs/guides/bare-ci-cd.md` 신규 작성 | `docs/guides/` | 2h | #40506 제약 포함 |
| 5 | ENH-139+142 | P1 문서 | plugin freshness 전략 문서화 | `docs/`, `.claude-plugin/` | 2h | 통합 문서 |
| 6 | ENH-143 | P1 코드 | 순차 spawn + 지연 전략 구현 | `lib/team/coordinator.js` | 3h | #37520 workaround |
| 7 | ENH-148 | P1 코드 | SessionStart env 정리 로직 추가 | `hooks/session-start.js` | 2h | #37729 방어 |
| 8 | ENH-149 | P1 코드 | CwdChanged handler 로직 보강 | `scripts/cwd-changed-handler.js` | 3h | 기존 파일 수정 |
| 9 | ENH-151 | P1 코드 | self-healing agent frontmatter 보완 | `agents/self-healing.md` | 1h | effort/maxTurns 추가 |
| 10 | ENH-156 | P1 코드 | TaskCreated handler 로직 보강 | `scripts/task-created-handler.js` | 2h | 기존 파일 수정 |
| 11 | ENH-176 | P1 코드 | MCP okResponse에 `_meta.maxResultSizeChars` 추가 | `servers/*/index.js` (2개) | 2h | 500K 설정 |
| 12 | ENH-188 | P1 검증 | plugin frontmatter hooks 중복 실행 없음 확인 | `agents/*.md`, `skills/*/SKILL.md` | 2h | 수동 검증 |

### 6.2 ENH-134: Skills effort 분류

```yaml
# effort: high (복잡 분석, 대규모 출력)
# ~10 skills
high:
  - code-review         # 코드 분석 + 리포트
  - zero-script-qa      # Docker + 로그 분석
  - enterprise          # 마이크로서비스 아키텍처
  - cc-version-analysis # CC 변경 연구 + 영향 분석
  - phase-8-review      # 코드베이스 품질 검증
  - plan-plus           # 브레인스토밍 5단계
  - pm-discovery        # 4 PM agent 팀 운영
  - qa-phase            # L1-L5 테스트 계획/실행

# effort: medium (표준 PDCA, 일반 개발)
# ~19 skills
medium:
  - pdca                # PDCA 사이클 관리
  - dynamic             # 풀스택 개발
  - starter             # 정적 웹 개발
  - phase-1-schema      # 스키마 정의
  - phase-2-convention  # 코딩 규칙
  - phase-3-mockup      # 목업 생성
  - phase-4-api         # API 설계
  - phase-5-design-system # 디자인 시스템
  - phase-6-ui-integration # UI 통합
  - phase-7-seo-security   # SEO/보안
  - phase-9-deployment     # 배포
  - desktop-app            # 데스크톱 앱
  - mobile-app             # 모바일 앱
  - bkend-quickstart       # bkend 온보딩
  - bkend-data             # bkend CRUD
  - bkend-auth             # bkend 인증
  - bkend-storage          # bkend 스토리지
  - bkend-cookbook          # bkend 튜토리얼
  - development-pipeline   # 개발 파이프라인

# effort: low (유틸리티, 간단 조회)
# ~9 skills
low:
  - bkit                # 도움말 표시
  - bkit-rules          # 규칙 표시
  - bkit-templates      # 템플릿 표시
  - skill-create        # 스킬 생성 (대화형)
  - skill-status        # 스킬 목록 표시
  - control             # 자동화 레벨 조회/변경
  - audit               # 감사 로그 조회
  - btw                 # 개선 제안 수집
  - rollback            # 체크포인트 관리
  - deploy              # 배포 실행
  - pdca-batch          # 배치 관리
  - output-style-setup  # 스타일 설치
  - claude-code-learning # 학습 가이드
```

### 6.3 ENH-143: 병렬 Agent Spawn 지연 Workaround

**문제**: #37520 — 병렬 agent spawn 시 OAuth 401 에러 발생
**영향 파일**: `lib/team/coordinator.js` (또는 agent spawn 호출 지점)

```javascript
// 설계 의도: 순차 spawn + 지연으로 OAuth race condition 회피
// coordinator.js 내 spawnAgents() 함수 수정

async function spawnAgents(agents, options = {}) {
  const delay = options.spawnDelay || 2000; // 2초 지연
  const results = [];

  for (const agent of agents) {
    const result = await spawnSingleAgent(agent, options);
    results.push(result);

    // 마지막 agent가 아닌 경우 지연
    if (agents.indexOf(agent) < agents.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return results;
}
```

**핵심**: 병렬이 아닌 순차 spawn으로 전환. #37520이 해결되면 병렬로 복원 가능.

### 6.4 ENH-149: CwdChanged Handler 보강

**수정 파일**: `scripts/cwd-changed-handler.js`

```javascript
// CwdChanged 이벤트 발생 시:
// 1. 이전 cwd와 현재 cwd 비교
// 2. 새 디렉토리에 .bkit/ 존재 확인
// 3. 존재하면: PDCA 상태 전환 알림
// 4. 미존재: 새 프로젝트 초기화 제안

async function handleCwdChanged(input) {
  const { previousCwd, currentCwd } = input;

  // .bkit/state/pdca-status.json 확인
  const pdcaStatusPath = path.join(currentCwd, '.bkit/state/pdca-status.json');
  const hasPdca = fs.existsSync(pdcaStatusPath);

  if (hasPdca) {
    const status = JSON.parse(fs.readFileSync(pdcaStatusPath, 'utf8'));
    return {
      additionalContext: `[bkit] 프로젝트 전환 감지: ${path.basename(currentCwd)} (PDCA: ${status.phase || 'idle'})`
    };
  }

  return {
    additionalContext: `[bkit] 새 프로젝트 디렉토리: ${path.basename(currentCwd)} (.bkit/ 미존재)`
  };
}
```

### 6.5 ENH-156: TaskCreated Handler 보강

**수정 파일**: `scripts/task-created-handler.js`

```javascript
// TaskCreated 이벤트 발생 시:
// 1. 생성된 Task 정보 파싱
// 2. PDCA 진행 중이면 audit 로그 기록
// 3. Task 유형에 따라 PDCA 상태에 연동

async function handleTaskCreated(input) {
  const { taskId, taskDescription } = input;

  // audit 로그 기록
  const audit = require('../lib/audit');
  audit.writeAuditLog({
    category: 'pdca',
    action: 'task_created',
    details: { taskId, description: taskDescription }
  });

  return { additionalContext: '' };
}
```

### 6.6 ENH-176: MCP `_meta.maxResultSizeChars`

**수정 파일**: `servers/bkit-pdca-server/index.js`, `servers/bkit-analysis-server/index.js`

```javascript
// 양쪽 MCP 서버의 okResponse() 함수 수정
// 기존:
function okResponse(content) {
  return { content: [{ type: 'text', text: JSON.stringify(content) }] };
}

// 수정:
function okResponse(content) {
  return {
    content: [{ type: 'text', text: JSON.stringify(content) }],
    _meta: { maxResultSizeChars: 500000 }
  };
}
```

**주의**: v2.1.98에서 `_meta` persist bypass가 수정되었으므로, `_meta` 키를 response 최상위에 배치. v2.1.2에서 ENH-193으로 일부 수정했으나, 양쪽 키(`_meta` in content + top-level) 모두 설정하여 방어적 처리.

---

## 7. #71 Fix Design

### 7.1 문제 분석

CC 스킬 엔진은 ```` ```! ```` 블록(shell execution block) 내의 `$1`, `$2`, ..., `$9`를 스킬 호출 시 전달된 인자로 치환한다. 이는 awk 명령어 내의 `$1` (첫 번째 필드)과 충돌한다.

```bash
# 문제 코드 (skills/pdca/SKILL.md 등)
awk '{print $1}' file.txt
# CC 스킬 엔진이 $1을 스킬 인자로 치환 → awk '{print }' file.txt → 에러
```

### 7.2 해결 방안 비교

| 방안 | 구현 | 장점 | 단점 | 추천 |
|------|------|------|------|:----:|
| A: awk -v 패턴 | `awk -v col=1 '{print $col}'` | CC 치환 회피 | awk 표현력 제한 | △ |
| B: 이스케이프 | `awk '{print \$1}'` | 간단 | CC 지원 여부 미확인 | △ |
| C: 대체 명령 | `cut -d' ' -f1`, `sed` 등 | 충돌 근본 회피 | awk 고유 기능 불가 | ✅ |
| D: 싱글쿼트 보호 | CC가 싱글쿼트 내부 미치환 시 이미 안전 | 변경 최소 | CC 동작 확인 필요 | ? |

**권장 전략**: 

1. **우선 D 확인**: CC 스킬 엔진이 싱글쿼트 내부를 치환하는지 테스트
2. **D가 안전하면**: awk 사용 유지, 다만 shell-escape 스캐너에서 경고만 표시
3. **D가 안전하지 않으면**: C 적용 — awk $N을 cut/sed로 대체

**실행 계획**:
1. `skills/*/SKILL.md`에서 awk $N 사용 위치 전수 조사 (shell-escape 스캐너로 자동화)
2. CC 스킬 엔진 치환 동작 실제 테스트
3. 결과에 따라 A/B/C/D 중 최적 방안 적용
4. shell-escape 스캐너에 패턴 등록하여 향후 재발 방지

---

## 8. Test Plan

### 8.1 단위 테스트 (L1)

| # | 테스트 파일 | 대상 | 시나리오 | 성공 기준 |
|---|-----------|------|---------|----------|
| T1 | `tests/qa/scanner-base.test.js` | ScannerBase | addIssue → getSummary | severity별 카운트 정확 |
| T2 | `tests/qa/scanner-base.test.js` | ScannerBase | scan() 미구현 호출 | Error throw |
| T3 | `tests/qa/scanner-base.test.js` | ScannerBase | reset() 후 재스캔 | issues 초기화 |
| T4 | `tests/qa/dead-code.test.js` | DeadCodeScanner | 존재하지 않는 require | CRITICAL 이슈 1건 |
| T5 | `tests/qa/dead-code.test.js` | DeadCodeScanner | 정상 require | 이슈 0건 |
| T6 | `tests/qa/dead-code.test.js` | DeadCodeScanner | 미사용 export | WARNING 이슈 1건 |
| T7 | `tests/qa/config-audit.test.js` | ConfigAuditScanner | 미참조 config 키 | WARNING 이슈 1건 |
| T8 | `tests/qa/config-audit.test.js` | ConfigAuditScanner | 하드코딩 vs config 불일치 | WARNING 이슈 1건 |
| T9 | `tests/qa/completeness.test.js` | CompletenessScanner | 존재하지 않는 agent 참조 | CRITICAL 이슈 1건 |
| T10 | `tests/qa/completeness.test.js` | CompletenessScanner | description 250자 초과 | WARNING 이슈 1건 |
| T11 | `tests/qa/completeness.test.js` | CompletenessScanner | effort 누락 | INFO 이슈 1건 |
| T12 | `tests/qa/shell-escape.test.js` | ShellEscapeScanner | bare $1 in awk | CRITICAL 이슈 1건 |
| T13 | `tests/qa/shell-escape.test.js` | ShellEscapeScanner | 이스케이프된 \$1 | 이슈 0건 |
| T14 | `tests/qa/shell-escape.test.js` | ShellEscapeScanner | 언이스케이프 backtick | WARNING 이슈 1건 |

### 8.2 통합 테스트 (L2)

| # | 대상 | 시나리오 | 성공 기준 |
|---|------|---------|----------|
| T15 | `pre-release-check.sh` | bkit 자체에 실행 | exit 0 (CRITICAL 0건) |
| T16 | `pre-release-check.sh --json` | JSON 출력 | 유효한 JSON, scanners 4개 |
| T17 | `pre-release-check.sh --scanner dead-code` | 단일 스캐너 | dead-code 결과만 출력 |
| T18 | `runAllScanners()` | lib/qa API 호출 | 4개 스캐너 결과 반환 |
| T19 | CwdChanged handler | 이벤트 시뮬레이션 | additionalContext에 프로젝트 정보 |
| T20 | TaskCreated handler | 이벤트 시뮬레이션 | audit 로그 기록 확인 |

### 8.3 E2E 테스트 (L3)

| # | 대상 | 시나리오 | 성공 기준 |
|---|------|---------|----------|
| T21 | QA Phase Flow | `/pdca qa` → 스캐너 실행 포함 | PRE-SCAN 단계 동작, 결과 보고서 포함 |
| T22 | Full Cycle | 의도적 dead code → 스캐너 탐지 → 수정 → 재스캔 | CRITICAL→0건 |

---

## 9. CC v2.1.104 Compatibility Updates

### 9.1 변경 항목

| # | 항목 | 현재값 | 변경값 | 파일 |
|---|------|--------|--------|------|
| 1 | CC 권장 버전 | v2.1.98+ | v2.1.104+ | `bkit.config.json` |
| 2 | CC 호환 범위 문서 | v2.1.34~v2.1.98 (63개) | v2.1.34~v2.1.104 (66개) | `docs/` |
| 3 | CC Tools 수 | 30 | 32 (ScheduleWakeup, Snooze — SP전용) | `docs/` 참조 |
| 4 | SP 토큰 증가 | 기준 | +3,839 tokens | 모니터링 |
| 5 | bkit 버전 | v2.1.3 | v2.1.4 | `package.json`, `bkit.config.json`, `hooks/hooks.json` |

### 9.2 ENH-197~200 (v2.1.99~v2.1.104 신규)

| ENH | 내용 | 분류 | v2.1.4 대응 |
|-----|------|------|------------|
| ENH-197 | context:fork 스킬 미적용 수정 (v2.1.101) | 자동 수혜 | ENH-196 검증으로 확인 |
| ENH-198 | Subagent MCP 도구 상속 (v2.1.103) | 자동 수혜 | 문서화 |
| ENH-199 | settings.json 복원력 강화 (v2.1.104) | 자동 수혜 | 문서화 |
| ENH-200 | ScheduleWakeup/Snooze 도구 추가 (v2.1.99) | YAGNI | bkit 미사용, 무시 |

---

## 10. Risk Mitigation

| # | 리스크 | 확률 | 영향 | 완화 전략 |
|---|--------|:----:|:----:|----------|
| R1 | 스캐너 false positive 과다 | MEDIUM | QA 노이즈 증가 | 초기 버전은 WARNING/INFO만, CRITICAL은 높은 확신도만 |
| R2 | ENH P1 범위 초과 → 일정 지연 | HIGH | 릴리스 지연 | 각 ENH 독립 PR, 일부 v2.1.5 강등 가능 (ENH-138, 139+142 문서 작업 우선 연기) |
| R3 | #71 fix — CC 스킬 엔진 동작 불확실 | MEDIUM | 잘못된 fix | 실제 테스트 후 방안 결정, 다중 옵션 준비 |
| R4 | Hook handler 보강 시 기존 로직 충돌 | LOW | 세션 시작 실패 | 기존 핸들러 로직 보존, 추가 로직만 append |
| R5 | lib/qa/ 기존 모듈과 naming 충돌 | LOW | import 에러 | `scanners/` 서브디렉토리로 격리, index.js에서 명시적 re-export |
| R6 | v3.0.0 lib/qa/ 이전 시 breaking change | LOW | 재작업 | Clean Architecture 인터페이스 유지, ScannerBase 계약 고정 |

---

## 11. Implementation Guide

### 11.1 구현 순서

```
1. lib/qa/ 모듈 (scanner-base, utils, 4 scanners, reporter, index)
2. pre-release-check.sh wrapper
3. tests/qa/ 테스트 파일
4. #71 fix (shell escaping)
5. ENH P0 (effort frontmatter — ENH-134)
6. ENH P1 코드 변경 (ENH-143, 148, 149, 156, 176)
7. ENH P1 검증 (ENH-196, 188)
8. ENH P1 문서 (ENH-138, 139+142)
9. CC v2.1.104 compat 업데이트
10. qa-phase skill 연동
```

### 11.2 Module Map

| Module | 파일 | 의존성 | Session |
|--------|------|--------|---------|
| M1-scanner-core | `lib/qa/scanner-base.js`, `lib/qa/utils/file-resolver.js`, `lib/qa/utils/pattern-matcher.js` | None | Session 1 |
| M2-scanners | `lib/qa/scanners/dead-code.js`, `lib/qa/scanners/config-audit.js`, `lib/qa/scanners/completeness.js`, `lib/qa/scanners/shell-escape.js` | M1 | Session 1-2 |
| M3-integration | `lib/qa/index.js` (수정), `lib/qa/reporter.js`, `scripts/qa/pre-release-check.sh` | M1, M2 | Session 2 |
| M4-tests | `tests/qa/scanner-base.test.js`, `tests/qa/dead-code.test.js`, `tests/qa/config-audit.test.js`, `tests/qa/completeness.test.js`, `tests/qa/shell-escape.test.js` | M1, M2, M3 | Session 2 |
| M5-issue-fix | #71 — `skills/*/SKILL.md` 내 awk $N 수정 | None | Session 3 |
| M6-enh-p0 | ENH-134 — 37개 `skills/*/SKILL.md` effort frontmatter | None | Session 3 |
| M7-enh-p1-code | ENH-143 `lib/team/coordinator.js`, ENH-148 `hooks/session-start.js`, ENH-149 `scripts/cwd-changed-handler.js`, ENH-156 `scripts/task-created-handler.js`, ENH-176 `servers/*/index.js` | None | Session 4 |
| M8-enh-p1-verify | ENH-196 `skills/zero-script-qa/`, ENH-188 agents+skills 중복 검증 | None | Session 4 |
| M9-enh-p1-docs | ENH-138 `docs/guides/bare-ci-cd.md`, ENH-139+142 plugin freshness 문서 | None | Session 4 |
| M10-cc-compat | `bkit.config.json`, `package.json`, `hooks/hooks.json` 버전 업데이트 | None | Session 5 |
| M11-qa-integration | `skills/qa-phase/SKILL.md` PRE-SCAN 단계 추가 | M3 | Session 5 |

### 11.3 Session Guide

| Session | Modules | 집중 영역 | 예상 시간 |
|---------|---------|----------|----------|
| Session 1 | M1, M2 | Scanner core framework + 4개 스캐너 구현 | 8h |
| Session 2 | M3, M4 | 통합 API + pre-release-check.sh + Jest 테스트 | 6h |
| Session 3 | M5, M6 | #71 awk $N fix + 37 skills effort frontmatter | 5h |
| Session 4 | M7, M8, M9 | ENH P1 코드 변경 + 검증 + 문서 | 10h |
| Session 5 | M10, M11 | CC v2.1.104 compat + qa-phase 연동 + 최종 QA | 4h |
| **총계** | | | **~33h** |

---

## 12. File Impact Matrix

### 12.1 신규 파일 (14건)

| # | Action | File | Change Description |
|---|--------|------|--------------------|
| 1 | CREATE | `lib/qa/scanner-base.js` | Scanner 기반 클래스 — scan(), addIssue(), getSummary(), formatReport() |
| 2 | CREATE | `lib/qa/scanners/dead-code.js` | Dead Code Scanner — stale require/import, 미사용 export 탐지 |
| 3 | CREATE | `lib/qa/scanners/config-audit.js` | Config Audit Scanner — config ↔ 코드 불일치 탐지 |
| 4 | CREATE | `lib/qa/scanners/completeness.js` | Completeness Checker — SKILL.md ↔ 구현 갭 탐지 |
| 5 | CREATE | `lib/qa/scanners/shell-escape.js` | Shell Escape Validator — $N 치환 충돌 탐지 |
| 6 | CREATE | `lib/qa/reporter.js` | 스캔 결과 포매터 — JSON/markdown/console 출력 |
| 7 | CREATE | `lib/qa/utils/file-resolver.js` | require/import 경로 해석 유틸리티 |
| 8 | CREATE | `lib/qa/utils/pattern-matcher.js` | 정규식 패턴 매칭 유틸리티 |
| 9 | CREATE | `scripts/qa/pre-release-check.sh` | 4개 스캐너 통합 실행 shell wrapper |
| 10 | CREATE | `tests/qa/scanner-base.test.js` | ScannerBase 단위 테스트 |
| 11 | CREATE | `tests/qa/dead-code.test.js` | Dead Code Scanner 단위 테스트 |
| 12 | CREATE | `tests/qa/config-audit.test.js` | Config Audit Scanner 단위 테스트 |
| 13 | CREATE | `tests/qa/completeness.test.js` | Completeness Checker 단위 테스트 |
| 14 | CREATE | `tests/qa/shell-escape.test.js` | Shell Escape Validator 단위 테스트 |

### 12.2 수정 파일 (~50건)

| # | Action | File | Change Description |
|---|--------|------|--------------------|
| 15 | MODIFY | `lib/qa/index.js` | runAllScanners(), runScanner(), getScannerNames() API 추가 |
| 16 | MODIFY | `skills/qa-phase/SKILL.md` | PRE-SCAN 단계 추가 (pre-release-check.sh 호출) |
| 17-53 | MODIFY | `skills/*/SKILL.md` (37개) | effort frontmatter 추가 (ENH-134) |
| 54 | MODIFY | `scripts/cwd-changed-handler.js` | 프로젝트 전환 감지 로직 보강 (ENH-149) |
| 55 | MODIFY | `scripts/task-created-handler.js` | PDCA Task audit 로그 보강 (ENH-156) |
| 56 | MODIFY | `hooks/session-start.js` | SessionStart env 정리 로직 (ENH-148) |
| 57 | MODIFY | `lib/team/coordinator.js` | 순차 spawn + 지연 (ENH-143) |
| 58 | MODIFY | `servers/bkit-pdca-server/index.js` | okResponse에 `_meta.maxResultSizeChars: 500000` (ENH-176) |
| 59 | MODIFY | `servers/bkit-analysis-server/index.js` | okResponse에 `_meta.maxResultSizeChars: 500000` (ENH-176) |
| 60 | MODIFY | `agents/self-healing.md` | effort/maxTurns frontmatter 추가 (ENH-151) |
| 61 | MODIFY | `bkit.config.json` | CC 권장 버전 v2.1.104+, bkit 버전 v2.1.4 |
| 62 | MODIFY | `package.json` | version: "2.1.4" |
| 63 | MODIFY | `hooks/hooks.json` | description 버전 v2.1.4 |
| 64 | MODIFY | `skills/*/SKILL.md` (해당건) | #71 awk $N shell escaping fix |

### 12.3 신규 문서 (2건)

| # | Action | File | Change Description |
|---|--------|------|--------------------|
| 65 | CREATE | `docs/guides/bare-ci-cd.md` | --bare CI/CD 파이프라인 가이드 (ENH-138) |
| 66 | CREATE | `docs/guides/plugin-freshness.md` | Plugin freshness 배포 전략 (ENH-139+142) |

### 12.4 합계

| 분류 | 건수 |
|------|:----:|
| 신규 파일 (코드) | 14 |
| 신규 파일 (문서) | 2 |
| 수정 파일 | ~50 |
| 삭제 파일 | 0 |
| **총 영향 파일** | **~66** |
| **예상 LOC 추가** | **~1,500** |

---

## Meta

- **생성 방법**: PDCA Design Phase
- **Architecture**: Option B — Clean Architecture
- **Plan Reference**: docs/01-plan/features/bkit-v214-quality-hardening.plan.md
- **다음 단계**: `/pdca do bkit-v214-quality-hardening`

---

## Version History

| 버전 | 날짜 | 변경 | 작성자 |
|------|------|------|--------|
| 0.1 | 2026-04-13 | Initial draft (Clean Architecture) | Claude Opus 4.6 |
