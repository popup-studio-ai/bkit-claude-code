# Claude Code 2.1.17 버전 대응 고도화 설계서

> **Summary**: bkit 플러그인 크로스플랫폼 전환 및 Task System 통합 상세 설계
>
> **Project**: bkit-claude-code
> **Version**: v1.3.0 → v1.3.1
> **Author**: Claude Code
> **Date**: 2026-01-23
> **Status**: Draft (Review Required)
> **Plan Reference**: `docs/01-plan/features/claude-code-2.1.17-upgrade.plan.md`

---

## 1. Executive Summary

### 1.1 설계 범위

| 영역 | 현재 상태 | 목표 상태 |
|------|----------|----------|
| **Hooks 스크립트** | 21개 .sh (bash) | 21개 .js (Node.js) |
| **공통 라이브러리** | lib/common.sh (25함수) | lib/common.js (25함수) |
| **외부 의존성** | jq, bash, wc, sed, grep | Node.js만 (의존성 제거) |
| **플랫폼 지원** | macOS, Linux, WSL | + Windows Native |
| **Task System** | 미사용 | PDCA 워크플로우 통합 |

### 1.2 핵심 변경 사항

```
변경 전 (v1.3.0)                    변경 후 (v1.3.1)
─────────────────────────────────────────────────────────
scripts/
├── pre-write.sh          →        ├── pre-write.js
├── pdca-post-write.sh    →        ├── pdca-post-write.js
├── ... (21개 .sh)        →        ├── ... (21개 .js)
│
lib/
├── common.sh             →        ├── common.js
│
skills/
├── bkit-rules/SKILL.md            ├── bkit-rules/SKILL.md
│   (scripts/*.sh 참조)    →       │   (scripts/*.js 참조)
└── ... (8개 파일 수정)            └── ...
```

---

## 2. 현재 코드베이스 분석 결과

### 2.1 Scripts 디렉토리 분석 (21개 파일)

#### 2.1.1 복잡도별 분류

| 복잡도 | 파일 수 | 파일 목록 |
|:------:|:------:|----------|
| **High** | 3 | `pre-write.sh`, `validate-plugin.sh`, `sync-folders.sh` |
| **Medium** | 8 | `pdca-post-write.sh`, `gap-detector-stop.sh`, `iterator-stop.sh`, `select-template.sh`, `archive-feature.sh`, `qa-pre-bash.sh`, `pdca-pre-write.sh`, `phase5-design-post.sh` |
| **Low** | 10 | `analysis-stop.sh`, `design-validator-pre.sh`, `gap-detector-post.sh`, `phase2-convention-pre.sh`, `phase4-api-stop.sh`, `phase6-ui-post.sh`, `phase8-review-stop.sh`, `phase9-deploy-pre.sh`, `qa-monitor-post.sh`, `qa-stop.sh` |

#### 2.1.2 외부 의존성 분석

| 의존성 | 사용 파일 수 | Node.js 대체 방안 |
|--------|:-----------:|------------------|
| **jq** | 15개 | `JSON.parse()` 네이티브 |
| **cat** | 13개 | `fs.readFileSync()` |
| **grep** | 8개 | `String.includes()`, RegExp |
| **sed** | 6개 | `String.replace()`, RegExp |
| **wc** | 2개 | `String.split('\n').length` |
| **tr** | 4개 | `String.replace()` |
| **awk** | 2개 | `String.split()`, RegExp |
| **find** | 2개 | `fs.readdirSync()` recursive |
| **python3** | 1개 | Node.js native 또는 제거 |
| **diff** | 1개 | 문자열 비교 또는 npm 패키지 |

#### 2.1.3 Hook 유형별 분류

| Hook 유형 | 파일 수 | 입력 형식 | 출력 형식 |
|----------|:------:|----------|----------|
| **PreToolUse** | 5개 | JSON (stdin) | JSON (decision) |
| **PostToolUse** | 6개 | JSON (stdin) | JSON (additionalContext) |
| **Stop** | 6개 | 대화 컨텍스트 | JSON (additionalContext) |
| **Utility** | 4개 | CLI args | 텍스트/파일 |

### 2.2 lib/common.sh 분석 (25개 함수)

#### 2.2.1 함수 카테고리별 정리

```javascript
// lib/common.js 구조 설계

module.exports = {
  // 1. Configuration Management (2개)
  getConfig,           // bkit.config.json에서 값 조회
  getConfigArray,      // 배열 형태로 조회

  // 2. File Detection (4개)
  isSourceFile,        // 소스 파일 여부
  isCodeFile,          // 코드 파일 여부 (확장자 기반)
  isUiFile,            // UI 컴포넌트 파일 여부
  isEnvFile,           // 환경 설정 파일 여부

  // 3. Tier Detection (6개)
  getLanguageTier,     // 언어 티어 분류 (1~4, experimental)
  getTierDescription,  // 티어 설명
  getTierPdcaGuidance, // 티어별 PDCA 가이드
  isTier1, isTier2, isTier3, isTier4, isExperimentalTier,

  // 4. Feature Detection (1개)
  extractFeature,      // 파일 경로에서 기능명 추출

  // 5. PDCA Document Detection (2개)
  findDesignDoc,       // 설계 문서 경로 찾기
  findPlanDoc,         // 계획 문서 경로 찾기

  // 6. Task Classification (5개)
  classifyTask,        // 문자 수 기반 분류 (legacy)
  classifyTaskByLines, // 라인 수 기반 분류 (v1.3.0)
  getPdcaLevel,        // 분류 → PDCA 레벨 변환
  getPdcaGuidance,     // 분류별 가이드 메시지
  getPdcaGuidanceByLevel, // 레벨별 상세 가이드

  // 7. JSON Output Helpers (3개)
  outputAllow,         // allow 결정 JSON 출력
  outputBlock,         // block 결정 JSON 출력 (exit 2)
  outputEmpty,         // 빈 JSON 출력

  // 8. Level Detection (1개)
  detectLevel,         // 프로젝트 레벨 감지 (Starter/Dynamic/Enterprise)

  // 9. Input Helpers (신규)
  readStdin,           // stdin에서 JSON 읽기
  parseHookInput,      // Hook 입력 파싱
};
```

#### 2.2.2 Bash → Node.js 변환 패턴

| Bash 패턴 | Node.js 대체 |
|----------|-------------|
| `${file##*.}` (확장자 추출) | `path.extname(file).slice(1)` |
| `${#content}` (문자열 길이) | `content.length` |
| `[[ "$a" == *"b"* ]]` (포함 검사) | `a.includes('b')` |
| `[ -f "$path" ]` (파일 존재) | `fs.existsSync(path)` |
| `[ -d "$dir" ]` (디렉토리 존재) | `fs.existsSync(dir) && fs.statSync(dir).isDirectory()` |
| `echo "$x" \| wc -l` (라인 수) | `x.split('\n').length` |
| `sed 's/a/b/g'` (치환) | `str.replace(/a/g, 'b')` |
| `case $x in ... esac` | `switch(x) { ... }` 또는 객체 맵 |
| `cat << EOF ... EOF` (heredoc) | 템플릿 리터럴 또는 `JSON.stringify()` |
| `$(command)` (명령 치환) | 순수 JS 로직으로 대체 |

### 2.3 Skills 참조 분석 (8개 파일)

| Skill 파일 | 참조하는 스크립트 | Hook 유형 |
|-----------|-----------------|----------|
| `bkit-rules/SKILL.md` | `pre-write.sh`, `pdca-post-write.sh` | PreToolUse, PostToolUse |
| `phase-8-review/SKILL.md` | `phase8-review-stop.sh` | Stop |
| `zero-script-qa/SKILL.md` | `qa-pre-bash.sh`, `qa-stop.sh` | PreToolUse, Stop |
| `phase-4-api/SKILL.md` | `phase4-api-stop.sh` | Stop |
| `phase-6-ui-integration/SKILL.md` | `phase6-ui-post.sh` | PostToolUse |
| `phase-5-design-system/SKILL.md` | `phase5-design-post.sh` | PostToolUse |
| `phase-9-deployment/SKILL.md` | `phase9-deploy-pre.sh` | PreToolUse |
| `phase-2-convention/SKILL.md` | (병합됨, 참조만) | - |

---

## 3. 상세 설계

### 3.1 디렉토리 구조 변경

```
bkit-claude-code/
├── lib/
│   ├── common.sh          # 삭제 예정
│   └── common.js          # 신규 (25개 함수)
│
├── scripts/
│   ├── pre-write.sh       # 삭제 예정
│   ├── pre-write.js       # 신규
│   ├── pdca-post-write.sh # 삭제 예정
│   ├── pdca-post-write.js # 신규
│   └── ... (모든 .sh → .js)
│
└── skills/
    └── */SKILL.md         # .sh → .js 참조 변경
```

### 3.2 lib/common.js 상세 설계

```javascript
#!/usr/bin/env node
/**
 * bkit Common Library (v1.3.1)
 * Cross-platform utility functions for bkit hooks
 *
 * Converted from: lib/common.sh
 * Platform: Windows, macOS, Linux
 * Dependencies: Node.js only (no external tools)
 */

const fs = require('fs');
const path = require('path');

// ============================================================
// Environment & Configuration
// ============================================================

const PLUGIN_ROOT = process.env.CLAUDE_PLUGIN_ROOT || __dirname.replace('/lib', '');
const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();

// Default patterns (configurable via bkit.config.json)
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next',
  '__pycache__', '.venv', 'venv', 'coverage',
  '.pytest_cache', 'target', '.cargo', 'vendor'
];

const DEFAULT_FEATURE_PATTERNS = [
  'features', 'modules', 'packages', 'apps', 'services', 'domains'
];

// Language Tier System (v1.2.1)
const TIER_EXTENSIONS = {
  1: ['py', 'pyx', 'pyi', 'ts', 'tsx', 'js', 'jsx', 'mjs', 'cjs'],
  2: ['go', 'rs', 'dart', 'astro', 'vue', 'svelte', 'mdx'],
  3: ['java', 'kt', 'kts', 'swift', 'c', 'cpp', 'cc', 'h', 'hpp', 'sh', 'bash'],
  4: ['php', 'rb', 'erb', 'cs', 'scala', 'ex', 'exs'],
  experimental: ['mojo', 'zig', 'v']
};

// ============================================================
// 1. Configuration Management
// ============================================================

/**
 * Load bkit.config.json
 * @returns {Object} Configuration object or empty object
 */
function loadConfig() {
  const configPath = path.join(PROJECT_DIR, 'bkit.config.json');
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (e) { /* ignore */ }
  return {};
}

/**
 * Get configuration value by path
 * @param {string} keyPath - Dot-separated path (e.g., "pdca.thresholds.quickFix")
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Configuration value or default
 */
function getConfig(keyPath, defaultValue = null) {
  const config = loadConfig();
  const keys = keyPath.replace(/^\./, '').split('.');
  let value = config;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  return value ?? defaultValue;
}

/**
 * Get configuration array as space-separated string (for compatibility)
 * @param {string} keyPath - Configuration path
 * @param {string} defaultValue - Default space-separated string
 * @returns {string} Space-separated values
 */
function getConfigArray(keyPath, defaultValue = '') {
  const value = getConfig(keyPath, null);
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return defaultValue;
}

// ============================================================
// 2. File Detection Functions
// ============================================================

/**
 * Check if file is a source code file
 * @param {string} filePath - File path to check
 * @returns {boolean} True if source file
 */
function isSourceFile(filePath) {
  if (!filePath) return false;

  // Exclude patterns
  const excludePatterns = getConfig('excludePatterns', DEFAULT_EXCLUDE_PATTERNS);
  for (const pattern of excludePatterns) {
    if (filePath.includes(pattern)) return false;
  }

  // Exclude documentation and config files
  const excludeExtensions = ['.md', '.json', '.yaml', '.yml', '.lock', '.txt', '.log'];
  const ext = path.extname(filePath).toLowerCase();
  if (excludeExtensions.includes(ext)) return false;

  // Exclude hidden files
  const basename = path.basename(filePath);
  if (basename.startsWith('.')) return false;

  return isCodeFile(filePath);
}

/**
 * Check if file has recognized code extension
 * @param {string} filePath - File path to check
 * @returns {boolean} True if code file
 */
function isCodeFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  if (!ext) return false;

  for (const tier of Object.values(TIER_EXTENSIONS)) {
    if (tier.includes(ext)) return true;
  }
  return false;
}

/**
 * Check if file is a UI component file
 * @param {string} filePath - File path
 * @returns {boolean} True if UI file
 */
function isUiFile(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();
  return ['tsx', 'jsx', 'vue', 'svelte', 'astro'].includes(ext);
}

/**
 * Check if file is an environment file
 * @param {string} filePath - File path
 * @returns {boolean} True if env file
 */
function isEnvFile(filePath) {
  const basename = path.basename(filePath);
  return basename.includes('.env') || basename.startsWith('.env');
}

// ============================================================
// 3. Tier Detection Functions
// ============================================================

/**
 * Get language tier for file
 * @param {string} filePath - File path
 * @returns {string} Tier: "1"|"2"|"3"|"4"|"experimental"|"unknown"
 */
function getLanguageTier(filePath) {
  const ext = path.extname(filePath).slice(1).toLowerCase();

  for (const [tier, extensions] of Object.entries(TIER_EXTENSIONS)) {
    if (extensions.includes(ext)) return String(tier);
  }
  return 'unknown';
}

/**
 * Get tier description
 * @param {string} tier - Tier number or name
 * @returns {string} Description
 */
function getTierDescription(tier) {
  const descriptions = {
    '1': 'AI-Native Essential',
    '2': 'Mainstream Recommended',
    '3': 'Domain Specific',
    '4': 'Legacy/Niche',
    'experimental': 'Experimental'
  };
  return descriptions[tier] || 'Unknown';
}

/**
 * Get PDCA guidance for tier
 * @param {string} tier - Tier
 * @returns {string} Guidance message
 */
function getTierPdcaGuidance(tier) {
  const guidance = {
    '1': 'Tier 1 (AI-Native): Full PDCA support. Vibe coding optimized.',
    '2': 'Tier 2 (Mainstream): Good PDCA support. Most features available.',
    '3': 'Tier 3 (Domain): Basic PDCA support. Some limitations may apply.',
    '4': 'Tier 4 (Legacy): Limited PDCA support. Consider migration.',
    'experimental': 'Experimental: PDCA support varies. Use with caution.'
  };
  return guidance[tier] || '';
}

// Convenience tier check functions
const isTier1 = (filePath) => getLanguageTier(filePath) === '1';
const isTier2 = (filePath) => getLanguageTier(filePath) === '2';
const isTier3 = (filePath) => getLanguageTier(filePath) === '3';
const isTier4 = (filePath) => getLanguageTier(filePath) === '4';
const isExperimentalTier = (filePath) => getLanguageTier(filePath) === 'experimental';

// ============================================================
// 4. Feature Detection
// ============================================================

/**
 * Extract feature name from file path
 * @param {string} filePath - File path
 * @returns {string} Feature name or empty string
 */
function extractFeature(filePath) {
  if (!filePath) return '';

  const featurePatterns = getConfig('featurePatterns', DEFAULT_FEATURE_PATTERNS);
  const genericNames = [
    'src', 'lib', 'app', 'components', 'pages', 'utils', 'hooks',
    'types', 'internal', 'cmd', 'pkg', 'models', 'views',
    'routers', 'controllers', 'services'
  ];

  // Try configured feature patterns
  for (const pattern of featurePatterns) {
    const regex = new RegExp(`${pattern}/([^/]+)`);
    const match = filePath.match(regex);
    if (match && match[1] && !genericNames.includes(match[1])) {
      return match[1];
    }
  }

  // Fallback: extract from parent directory
  const parts = filePath.split('/').filter(Boolean);
  for (let i = parts.length - 2; i >= 0; i--) {
    if (!genericNames.includes(parts[i])) {
      return parts[i];
    }
  }

  return '';
}

// ============================================================
// 5. PDCA Document Detection
// ============================================================

/**
 * Find design document for feature
 * @param {string} feature - Feature name
 * @returns {string} Path to design doc or empty string
 */
function findDesignDoc(feature) {
  if (!feature) return '';

  const paths = [
    path.join(PROJECT_DIR, `docs/02-design/features/${feature}.design.md`),
    path.join(PROJECT_DIR, `docs/02-design/${feature}.design.md`),
    path.join(PROJECT_DIR, `docs/design/${feature}.md`)
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

/**
 * Find plan document for feature
 * @param {string} feature - Feature name
 * @returns {string} Path to plan doc or empty string
 */
function findPlanDoc(feature) {
  if (!feature) return '';

  const paths = [
    path.join(PROJECT_DIR, `docs/01-plan/features/${feature}.plan.md`),
    path.join(PROJECT_DIR, `docs/01-plan/${feature}.plan.md`),
    path.join(PROJECT_DIR, `docs/plan/${feature}.md`)
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) return p;
  }
  return '';
}

// ============================================================
// 6. Task Classification
// ============================================================

/**
 * Classify task by content length (legacy, character-based)
 * @param {string} content - Content to classify
 * @returns {string} Classification
 */
function classifyTask(content) {
  const length = (content || '').length;

  const quickFix = getConfig('taskClassification.thresholds.quickFix', 50);
  const minorChange = getConfig('taskClassification.thresholds.minorChange', 200);
  const feature = getConfig('taskClassification.thresholds.feature', 1000);

  if (length < quickFix) return 'quick_fix';
  if (length < minorChange) return 'minor_change';
  if (length < feature) return 'feature';
  return 'major_feature';
}

/**
 * Classify task by line count (v1.3.0, more accurate)
 * @param {string} content - Content to classify
 * @returns {string} Classification
 */
function classifyTaskByLines(content) {
  const lineCount = (content || '').split('\n').length;

  const quickFix = getConfig('taskClassification.lines.quickFix', 10);
  const minorChange = getConfig('taskClassification.lines.minorChange', 50);
  const feature = getConfig('taskClassification.lines.feature', 200);

  if (lineCount < quickFix) return 'quick_fix';
  if (lineCount < minorChange) return 'minor_change';
  if (lineCount < feature) return 'feature';
  return 'major_feature';
}

/**
 * Get PDCA level from classification
 * @param {string} classification - Task classification
 * @returns {string} PDCA level
 */
function getPdcaLevel(classification) {
  const levels = {
    'quick_fix': 'none',
    'minor_change': 'light',
    'feature': 'recommended',
    'major_feature': 'required'
  };
  return levels[classification] || 'none';
}

/**
 * Get PDCA guidance message
 * @param {string} classification - Task classification
 * @returns {string} Guidance message
 */
function getPdcaGuidance(classification) {
  const guidance = {
    'quick_fix': '',
    'minor_change': 'Minor change. PDCA optional.',
    'feature': 'Feature-level change. Design doc recommended. Run /pdca-design.',
    'major_feature': 'Major feature. Design doc strongly recommended. Run /pdca-plan first.'
  };
  return guidance[classification] || '';
}

/**
 * Get contextual PDCA guidance by level
 * @param {string} level - PDCA level
 * @param {string} feature - Feature name
 * @param {number} lineCount - Line count
 * @returns {string} Guidance message
 */
function getPdcaGuidanceByLevel(level, feature = '', lineCount = 0) {
  const lineInfo = lineCount > 0 ? ` (${lineCount} lines)` : '';
  const featureInfo = feature ? ` for '${feature}'` : '';

  switch (level) {
    case 'none':
      return '';
    case 'light':
      return `Minor change${lineInfo}. PDCA optional.`;
    case 'recommended':
      return `Feature${lineInfo}. Design doc recommended${featureInfo}.`;
    case 'required':
      return `Major feature${lineInfo}. Design doc strongly recommended${featureInfo}.`;
    default:
      return '';
  }
}

// ============================================================
// 7. JSON Output Helpers
// ============================================================

/**
 * Output allow decision with context
 * @param {string} context - Additional context
 */
function outputAllow(context = '') {
  if (context) {
    console.log(JSON.stringify({
      decision: 'allow',
      hookSpecificOutput: { additionalContext: context }
    }));
  } else {
    console.log('{}');
  }
}

/**
 * Output block decision with reason and exit
 * @param {string} reason - Block reason
 */
function outputBlock(reason) {
  console.log(JSON.stringify({
    decision: 'block',
    reason: reason
  }));
  process.exit(2);
}

/**
 * Output empty JSON
 */
function outputEmpty() {
  console.log('{}');
}

// ============================================================
// 8. Level Detection
// ============================================================

/**
 * Detect project level from CLAUDE.md or structure
 * @returns {string} "Starter" | "Dynamic" | "Enterprise"
 */
function detectLevel() {
  // 1. Check CLAUDE.md for explicit declaration
  const claudeMd = path.join(PROJECT_DIR, 'CLAUDE.md');
  if (fs.existsSync(claudeMd)) {
    const content = fs.readFileSync(claudeMd, 'utf8');
    const match = content.match(/^level:\s*(\w+)/im);
    if (match) {
      const level = match[1].toLowerCase();
      if (['starter', 'dynamic', 'enterprise'].includes(level)) {
        return level.charAt(0).toUpperCase() + level.slice(1);
      }
    }
  }

  // 2. Check for Enterprise indicators
  const enterpriseDirs = ['kubernetes', 'terraform', 'k8s', 'infra'];
  for (const dir of enterpriseDirs) {
    if (fs.existsSync(path.join(PROJECT_DIR, dir))) {
      return 'Enterprise';
    }
  }

  // 3. Check for Dynamic indicators
  const mcpJson = path.join(PROJECT_DIR, '.mcp.json');
  if (fs.existsSync(mcpJson)) {
    const content = fs.readFileSync(mcpJson, 'utf8');
    if (content.includes('bkend')) return 'Dynamic';
  }

  const dynamicIndicators = [
    'lib/bkend', 'supabase', 'docker-compose.yml', 'api', 'backend'
  ];
  for (const indicator of dynamicIndicators) {
    if (fs.existsSync(path.join(PROJECT_DIR, indicator))) {
      return 'Dynamic';
    }
  }

  // 4. Default to Starter
  return 'Starter';
}

// ============================================================
// 9. Input Helpers (New)
// ============================================================

/**
 * Read JSON from stdin
 * @returns {Promise<Object>} Parsed JSON
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('readable', () => {
      let chunk;
      while ((chunk = process.stdin.read()) !== null) {
        data += chunk;
      }
    });
    process.stdin.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        resolve({});
      }
    });
    process.stdin.on('error', reject);
  });
}

/**
 * Synchronous stdin read (for simple hooks)
 * @returns {Object} Parsed JSON
 */
function readStdinSync() {
  try {
    const data = fs.readFileSync(0, 'utf8');
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

/**
 * Parse hook input and extract common fields
 * @param {Object} input - Raw hook input
 * @returns {Object} Parsed fields
 */
function parseHookInput(input) {
  return {
    toolName: input.tool_name || '',
    filePath: input.tool_input?.file_path || input.tool_input?.path || '',
    content: input.tool_input?.content || input.tool_input?.new_string || '',
    command: input.tool_input?.command || ''
  };
}

// ============================================================
// Exports
// ============================================================

module.exports = {
  // Configuration
  getConfig,
  getConfigArray,
  loadConfig,

  // File Detection
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,

  // Tier Detection
  getLanguageTier,
  getTierDescription,
  getTierPdcaGuidance,
  isTier1,
  isTier2,
  isTier3,
  isTier4,
  isExperimentalTier,

  // Feature Detection
  extractFeature,

  // PDCA Document Detection
  findDesignDoc,
  findPlanDoc,

  // Task Classification
  classifyTask,
  classifyTaskByLines,
  getPdcaLevel,
  getPdcaGuidance,
  getPdcaGuidanceByLevel,

  // JSON Output
  outputAllow,
  outputBlock,
  outputEmpty,

  // Level Detection
  detectLevel,

  // Input Helpers
  readStdin,
  readStdinSync,
  parseHookInput,

  // Constants
  PLUGIN_ROOT,
  PROJECT_DIR,
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS
};
```

### 3.3 Hook 스크립트 전환 설계

#### 3.3.1 pre-write.js (High 복잡도)

```javascript
#!/usr/bin/env node
/**
 * pre-write.js - Unified PreToolUse hook for Write|Edit operations (v1.3.1)
 *
 * Purpose: PDCA check, task classification, convention hints
 * Hook: PreToolUse (Write|Edit)
 * Philosophy: Automation First - Guide, don't block
 *
 * Converted from: scripts/pre-write.sh
 */

const {
  readStdinSync,
  parseHookInput,
  isSourceFile,
  isCodeFile,
  isEnvFile,
  extractFeature,
  findDesignDoc,
  findPlanDoc,
  classifyTaskByLines,
  getPdcaLevel,
  outputAllow,
  outputEmpty
} = require('../lib/common.js');

// Read input
const input = readStdinSync();
const { filePath, content, toolName } = parseHookInput(input);

// Skip if no file path
if (!filePath) {
  outputEmpty();
  process.exit(0);
}

// Collect context messages
const contextParts = [];

// 1. Task Classification (v1.3.0 - Line-based)
let classification = 'quick_fix';
let pdcaLevel = 'none';
let lineCount = 0;

if (content) {
  lineCount = content.split('\n').length;
  classification = classifyTaskByLines(content);
  pdcaLevel = getPdcaLevel(classification);
}

// 2. PDCA Document Check (for source files)
let feature = '';
let designDoc = '';
let planDoc = '';

if (isSourceFile(filePath)) {
  feature = extractFeature(filePath);

  if (feature) {
    designDoc = findDesignDoc(feature);
    planDoc = findPlanDoc(feature);
  }
}

// 3. Generate PDCA Guidance
switch (pdcaLevel) {
  case 'none':
    // Quick Fix - no guidance needed
    break;
  case 'light':
    contextParts.push(`Minor change (${lineCount} lines). PDCA optional.`);
    break;
  case 'recommended':
    if (designDoc) {
      contextParts.push(`Feature (${lineCount} lines). Design doc exists: ${designDoc}`);
    } else if (feature) {
      contextParts.push(`Feature (${lineCount} lines). Design doc recommended for '${feature}'. Consider /pdca-design ${feature}`);
    } else {
      contextParts.push(`Feature-level change (${lineCount} lines). Design doc recommended.`);
    }
    break;
  case 'required':
    if (designDoc) {
      contextParts.push(`Major feature (${lineCount} lines). Design doc exists: ${designDoc}. Refer during implementation.`);
    } else if (feature) {
      contextParts.push(`⚠️ Major feature (${lineCount} lines) without design doc. Strongly recommend /pdca-design ${feature} first.`);
    } else {
      contextParts.push(`⚠️ Major feature (${lineCount} lines). Design doc strongly recommended before implementation.`);
    }
    break;
}

// Add reference to existing PDCA docs
if (planDoc && !designDoc && pdcaLevel !== 'none' && pdcaLevel !== 'light') {
  contextParts.push(`Plan exists at ${planDoc}. Design doc not yet created.`);
}

// 4. Convention Hints (for code files)
if (isCodeFile(filePath)) {
  if (pdcaLevel === 'recommended' || pdcaLevel === 'required') {
    contextParts.push('Conventions: Components=PascalCase, Functions=camelCase, Constants=UPPER_SNAKE_CASE');
  }
} else if (isEnvFile(filePath)) {
  contextParts.push('Env naming: NEXT_PUBLIC_* (client), DB_* (database), API_* (external), AUTH_* (auth)');
}

// Output
if (contextParts.length > 0) {
  outputAllow(contextParts.join(' | '));
} else {
  outputEmpty();
}
```

#### 3.3.2 Hook 스크립트 전환 목록

| 원본 파일 | 전환 파일 | 복잡도 | 주요 변환 포인트 |
|----------|----------|:------:|-----------------|
| `pre-write.sh` | `pre-write.js` | High | lib/common 전체 활용 |
| `pdca-post-write.sh` | `pdca-post-write.js` | Medium | feature 추출, gap analysis 제안 |
| `gap-detector-stop.sh` | `gap-detector-stop.js` | Medium | match rate 파싱, 다국어 |
| `iterator-stop.sh` | `iterator-stop.js` | Medium | 완료 패턴 감지, 다국어 |
| `validate-plugin.sh` | `validate-plugin.js` | High | YAML 파싱, 파일 스캔 |
| `sync-folders.sh` | `sync-folders.js` | High | 파일 비교, 복사 |
| `select-template.sh` | `select-template.js` | Medium | 템플릿 선택 로직 |
| `archive-feature.sh` | `archive-feature.js` | Medium | 파일 이동, 날짜 처리 |
| `qa-pre-bash.sh` | `qa-pre-bash.js` | Medium | 명령어 검증 |
| 기타 10개 | 동일 패턴 | Low | 단순 context 출력 |

### 3.4 Skills 파일 수정 설계

#### 3.4.1 수정 패턴

```yaml
# Before (SKILL.md)
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.sh"
          timeout: 5000

# After (SKILL.md)
hooks:
  PreToolUse:
    - matcher: "Write|Edit"
      hooks:
        - type: command
          command: "node ${CLAUDE_PLUGIN_ROOT}/scripts/pre-write.js"
          timeout: 5000
```

#### 3.4.2 수정 대상 파일 목록

| 파일 | 수정할 스크립트 참조 |
|-----|-------------------|
| `skills/bkit-rules/SKILL.md` | `pre-write.sh` → `pre-write.js`, `pdca-post-write.sh` → `pdca-post-write.js` |
| `skills/phase-8-review/SKILL.md` | `phase8-review-stop.sh` → `phase8-review-stop.js` |
| `skills/zero-script-qa/SKILL.md` | `qa-pre-bash.sh` → `qa-pre-bash.js`, `qa-stop.sh` → `qa-stop.js` |
| `skills/phase-4-api/SKILL.md` | `phase4-api-stop.sh` → `phase4-api-stop.js` |
| `skills/phase-6-ui-integration/SKILL.md` | `phase6-ui-post.sh` → `phase6-ui-post.js` |
| `skills/phase-5-design-system/SKILL.md` | `phase5-design-post.sh` → `phase5-design-post.js` |
| `skills/phase-9-deployment/SKILL.md` | `phase9-deploy-pre.sh` → `phase9-deploy-pre.js` |

---

## 4. Task System 통합 설계

### 4.1 PDCA-Task 매핑

```javascript
/**
 * PDCA 단계별 Task 생성 설계
 */

// /pdca-plan 실행 시
const planTask = {
  subject: `[Plan] ${featureName} 기능 계획`,
  description: `Feature: ${featureName}\nPlan document: docs/01-plan/features/${featureName}.plan.md`,
  status: 'pending',
  metadata: { pdcaPhase: 'plan', feature: featureName }
};

// /pdca-design 실행 시 (planTask에 의존)
const designTask = {
  subject: `[Design] ${featureName} 기능 설계`,
  description: `Feature: ${featureName}\nDesign document: docs/02-design/features/${featureName}.design.md`,
  status: 'pending',
  blockedBy: [planTask.id],
  metadata: { pdcaPhase: 'design', feature: featureName }
};

// 구현 완료 후 gap-detector 실행 시
const checkTask = {
  subject: `[Check] ${featureName} Gap Analysis`,
  description: `Run gap analysis for ${featureName}`,
  status: 'pending',
  blockedBy: [implementationTaskId],
  metadata: { pdcaPhase: 'check', feature: featureName }
};
```

### 4.2 워크플로우 다이어그램

```
User Request
     │
     ▼
┌─────────────────────────────────────────────────────────┐
│                    Task System                           │
├─────────────────────────────────────────────────────────┤
│  Task 1: Plan                                           │
│  ├─ status: completed ✓                                 │
│  └─ output: docs/01-plan/features/auth.plan.md         │
│                                                          │
│  Task 2: Design (blockedBy: Task 1)                     │
│  ├─ status: completed ✓                                 │
│  └─ output: docs/02-design/features/auth.design.md     │
│                                                          │
│  Task 3: Implementation (blockedBy: Task 2)             │
│  ├─ status: in_progress ◐                               │
│  └─ files: src/features/auth/*                         │
│                                                          │
│  Task 4: Gap Analysis (blockedBy: Task 3)               │
│  ├─ status: pending ○                                   │
│  └─ expected: docs/03-analysis/auth.analysis.md        │
│                                                          │
│  Task 5: Iteration (blockedBy: Task 4, if needed)       │
│  └─ status: pending ○                                   │
└─────────────────────────────────────────────────────────┘
```

---

## 5. 테스트 계획

### 5.1 단위 테스트

| 테스트 대상 | 테스트 케이스 |
|-----------|-------------|
| `lib/common.js` | 25개 함수 각각 테스트 |
| `isSourceFile()` | 다양한 경로 패턴 |
| `extractFeature()` | 여러 아키텍처 패턴 |
| `classifyTaskByLines()` | 경계값 테스트 |

### 5.2 통합 테스트

| 시나리오 | 검증 항목 |
|---------|----------|
| PreToolUse Write | JSON 입출력, context 생성 |
| PostToolUse Write | gap analysis 제안 |
| Stop Hook | 다국어 가이드 |

### 5.3 플랫폼 테스트

| 플랫폼 | 테스트 환경 | 검증 항목 |
|--------|-----------|----------|
| **macOS** | Terminal | 모든 hooks 동작 |
| **Linux** | Ubuntu 22.04 | 모든 hooks 동작 |
| **Windows** | PowerShell (Native) | 모든 hooks 동작 |
| **Windows** | WSL | 모든 hooks 동작 |

---

## 6. 마이그레이션 계획

### 6.1 단계별 전환

| 단계 | 작업 | 검증 |
|:---:|------|------|
| 1 | `lib/common.js` 생성 | 단위 테스트 |
| 2 | High 복잡도 3개 전환 | 기능 테스트 |
| 3 | Medium 복잡도 8개 전환 | 기능 테스트 |
| 4 | Low 복잡도 10개 전환 | 기능 테스트 |
| 5 | Skills 파일 수정 (8개) | 통합 테스트 |
| 6 | 구 .sh 파일 삭제 | 회귀 테스트 |
| 7 | Windows 테스트 | 플랫폼 테스트 |

### 6.2 롤백 계획

```
롤백 시나리오: Node.js 전환 후 문제 발생 시
─────────────────────────────────────────────
1. Skills 파일에서 .js → .sh 복원
2. scripts/*.sh 파일 복원 (git checkout)
3. lib/common.sh 복원

보험 조치:
- .sh 파일은 삭제 전 별도 브랜치에 보관
- 전환 완료 후 1주일 모니터링 후 최종 삭제
```

---

## 7. 파일 변경 요약

### 7.1 신규 생성 파일

| 파일 | 설명 |
|-----|------|
| `lib/common.js` | 공통 라이브러리 (Node.js) |
| `scripts/pre-write.js` | PreToolUse hook |
| `scripts/pdca-post-write.js` | PostToolUse hook |
| ... (21개 .js 파일) | 모든 hooks |

### 7.2 수정 파일

| 파일 | 변경 내용 |
|-----|----------|
| `skills/bkit-rules/SKILL.md` | .sh → .js 경로 변경 |
| `skills/phase-*/SKILL.md` (6개) | .sh → .js 경로 변경 |
| `skills/zero-script-qa/SKILL.md` | .sh → .js 경로 변경 |

### 7.3 삭제 예정 파일

| 파일 | 삭제 시점 |
|-----|----------|
| `lib/common.sh` | 전환 완료 후 |
| `scripts/*.sh` (21개) | 전환 완료 후 |

---

## 8. 버전 정보

| 항목 | 값 |
|-----|---|
| **Target Version** | v1.3.1 |
| **Claude Code 호환** | 2.1.15 ~ 2.1.17+ |
| **Node.js 요구** | 18.0.0+ (Claude Code 내장) |
| **지원 플랫폼** | Windows, macOS, Linux |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-01-23 | 초안 작성 - 상세 설계 완료 | Claude Code |
