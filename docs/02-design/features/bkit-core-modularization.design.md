# Unit 1: bkit Core Modularization - 상세설계서

> **Feature**: bkit-core-modularization
> **Version**: 2.0.0 (Revised for Plugin Architecture)
> **Date**: 2026-01-29
> **Author**: Claude Opus 4.5
> **PDCA Phase**: Design
> **Dependencies**: None (Foundation)
> **Reference**: [Unit 1 Plan](../../.claude/docs/enterprise/unit-1-core-modularization.plan.md)

---

## ⚠️ v2.0 주요 변경사항

> **Claude Code 플러그인 아키텍처 조사 결과, 원래 설계(npm 패키지)가 지원되지 않음을 확인.**
> 본 문서는 플러그인 호환 아키텍처로 수정된 버전입니다.

| 항목 | v1.0 (원래) | v2.0 (수정됨) |
|------|------------|--------------|
| 모듈 형식 | npm 패키지 (@bkit/core 등) | JavaScript 모듈 (lib/core/ 등) |
| 언어 | TypeScript | JavaScript (JSDoc 타입) |
| 빌드 | tsup 번들링 | 빌드 없음 (직접 실행) |
| 패키지 매니저 | pnpm 모노레포 | 표준 require() |

**근거**:
- [Claude Code Plugin Docs](https://code.claude.com/docs/en/plugins)
- [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)

---

## 1. Executive Summary

lib/common.js (3,722줄, 110+ 함수)를 **4개 모듈 디렉토리**로 분리하여 테스트 가능성, 유지보수성, 재사용성을 확보합니다.

### 현재 상태 → 목표 상태

| 항목 | 현재 (As-Is) | 목표 (To-Be) |
|------|-------------|--------------|
| 파일 수 | 1개 (common.js) | 4개 디렉토리 (16+ 모듈) |
| 총 라인 수 | 3,722줄 | ~3,800줄 (모듈별 분산) |
| Export 수 | 110+ (단일 파일) | 모듈별 분리 |
| 테스트 커버리지 | 0% | 80%+ (Jest) |
| 타입 지원 | 없음 | JSDoc 타입 주석 |
| 순환 의존성 | 다수 | 0개 |

---

## 2. 현재 상태 분석 (As-Is)

### 2.1 lib/common.js 구조 분석

**파일 정보**:
- 경로: `lib/common.js`
- 크기: 117,446 bytes
- 라인 수: 3,722줄
- Export 수: 110+ 함수/상수

### 2.2 함수 분류 (19개 카테고리, 110개 함수)

#### Category 1: Configuration (3개)
| 함수명 | 라인 | 설명 |
|--------|------|------|
| `loadConfig()` | 155-167 | bkit.config.json 로드 |
| `getConfig(keyPath, defaultValue)` | 175-188 | 설정값 조회 |
| `getConfigArray(keyPath, defaultValue)` | 196-202 | 배열 설정값 조회 |

#### Category 2: File Detection (4개)
| 함수명 | 라인 | 설명 |
|--------|------|------|
| `isSourceFile(filePath)` | 213-232 | 소스 파일 여부 |
| `isCodeFile(filePath)` | 239-247 | 코드 파일 여부 |
| `isUiFile(filePath)` | 254-257 | UI 컴포넌트 파일 여부 |
| `isEnvFile(filePath)` | 264-267 | 환경설정 파일 여부 |

#### Category 3: Tier Detection (8개)
| 함수명 | 라인 | 설명 |
|--------|------|------|
| `getLanguageTier(filePath)` | 278-285 | 언어 Tier 반환 |
| `getTierDescription(tier)` | 292-301 | Tier 설명 |
| `getTierPdcaGuidance(tier)` | 308-317 | Tier별 PDCA 가이드 |
| `isTier1(filePath)` | 320 | Tier 1 확인 |
| `isTier2(filePath)` | 321 | Tier 2 확인 |
| `isTier3(filePath)` | 322 | Tier 3 확인 |
| `isTier4(filePath)` | 323 | Tier 4 확인 |
| `isExperimentalTier(filePath)` | 324 | Experimental Tier 확인 |

#### Category 4-19: (나머지 97개 함수)
*상세 목록은 Appendix A 참조*

### 2.3 common.js 참조 파일 분석

#### lib 모듈 (6개)
| 파일 | 참조 방식 | 의존 함수 |
|------|----------|-----------|
| `lib/skill-orchestrator.js` | Lazy require | debugLog, PROJECT_DIR, PLUGIN_ROOT |
| `lib/context-hierarchy.js` | Lazy require | BKIT_PLATFORM, PLUGIN_ROOT, PROJECT_DIR, debugLog |
| `lib/import-resolver.js` | Lazy require | PLUGIN_ROOT, PROJECT_DIR, debugLog |
| `lib/memory-store.js` | Lazy require | PROJECT_DIR, debugLog, _cache |
| `lib/permission-manager.js` | Lazy require | debugLog, getPdcaStatusFull |
| `lib/context-fork.js` | Lazy require | PROJECT_DIR, debugLog |

#### Scripts (39개)
| 파일 | 주요 의존 함수 |
|------|---------------|
| `hooks/session-start.js` | detectLevel, updatePdcaStatus, getPdcaStatusFull, ... |
| `scripts/unified-stop.js` | outputAllow, getActiveSkill, getActiveAgent, ... |
| `scripts/pdca-skill-stop.js` | createPdcaTaskChain, savePdcaTaskId, shouldAutoAdvance, ... |
| `scripts/gap-detector-stop.js` | triggerNextPdcaAction, autoCreatePdcaTask, ... |
| `scripts/iterator-stop.js` | triggerNextPdcaAction, savePdcaTaskId, ... |
| *... 34개 추가* | |

---

## 3. 목표 상태 설계 (To-Be)

### 3.1 디렉토리 구조

```
lib/
├── common.js              # Migration Bridge (모든 모듈 re-export)
│
├── core/                  # 기반 모듈 (의존성 없음)
│   ├── index.js           # 메인 진입점
│   ├── platform.js        # Platform Detection (8개 함수)
│   ├── cache.js           # Cache System (4개 함수)
│   ├── io.js              # I/O Helpers (8개 함수)
│   ├── debug.js           # Debug Logging (3개 함수)
│   ├── config.js          # Configuration (3개 함수)
│   └── file.js            # File Detection (4개 함수)
│
├── pdca/                  # PDCA 관리 모듈 (core 의존)
│   ├── index.js           # 메인 진입점
│   ├── status.js          # Status Management (15개 함수)
│   ├── phase.js           # Phase Control (10개 함수)
│   ├── level.js           # Level Detection (7개 함수)
│   ├── tier.js            # Tier System (8개 함수)
│   └── automation.js      # PDCA Automation (7개 함수)
│
├── intent/                # 의도 분석 모듈 (core 의존)
│   ├── index.js           # 메인 진입점
│   ├── trigger.js         # Trigger Matching (3개 함수)
│   ├── language.js        # Multi-language (8개 언어 지원)
│   └── ambiguity.js       # Ambiguity Analysis (9개 함수)
│
├── task/                  # Task 관리 모듈 (core, pdca 의존)
│   ├── index.js           # 메인 진입점
│   ├── creator.js         # Task Creation (6개 함수)
│   ├── tracker.js         # Task Tracking (6개 함수)
│   ├── context.js         # Context Management (5개 함수)
│   └── classification.js  # Task Classification (5개 함수)
│
├── skill-orchestrator.js  # 기존 유지
├── context-hierarchy.js   # 기존 유지
├── import-resolver.js     # 기존 유지
├── memory-store.js        # 기존 유지
├── permission-manager.js  # 기존 유지
└── context-fork.js        # 기존 유지
```

### 3.2 의존성 그래프

```
                    ┌─────────────────────────────────────────┐
                    │               lib/core/                  │
                    │  (platform, cache, io, debug, config)   │
                    │           의존성 없음                    │
                    └────────────────────┬────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    │
            ┌──────────────┐    ┌──────────────┐              │
            │  lib/pdca/   │    │ lib/intent/  │              │
            │   (status,   │    │  (trigger,   │              │
            │    phase,    │    │  language,   │              │
            │    level)    │    │  ambiguity)  │              │
            └──────┬───────┘    └──────────────┘              │
                   │                                          │
                   └──────────────────────────────────────────┘
                                         │
                                         ▼
                                 ┌──────────────┐
                                 │  lib/task/   │
                                 │  (creator,   │
                                 │  tracker,    │
                                 │  context)    │
                                 └──────────────┘

단방향 의존성 규칙:
- lib/core/    → Node.js 내장 모듈만
- lib/pdca/    → lib/core/ 만 의존
- lib/intent/  → lib/core/ 만 의존
- lib/task/    → lib/core/, lib/pdca/ 의존
```

### 3.3 Migration Bridge 전략

**lib/common.js** - 하위 호환성 유지:

```javascript
/**
 * Migration Bridge - 하위 호환성 레이어
 * 모든 기존 스크립트가 동일한 방식으로 common.js를 require할 수 있음
 *
 * @example
 * // 기존 방식 (계속 동작)
 * const { debugLog, updatePdcaStatus } = require('../lib/common');
 *
 * // 새로운 방식 (권장)
 * const { debugLog } = require('../lib/core');
 * const { updatePdcaStatus } = require('../lib/pdca');
 */

// Core 모듈
const core = require('./core');
const pdca = require('./pdca');
const intent = require('./intent');
const task = require('./task');

// 모든 함수를 flat하게 re-export
module.exports = {
  // Core
  ...core,

  // PDCA
  ...pdca,

  // Intent
  ...intent,

  // Task
  ...task,

  // 레거시 상수 (호환성)
  BKIT_PLATFORM: core.BKIT_PLATFORM,
  PLUGIN_ROOT: core.PLUGIN_ROOT,
  PROJECT_DIR: core.PROJECT_DIR,

  // 캐시 객체 (레거시)
  _cache: core.globalCache,
};
```

---

## 4. 상세 설계

### 4.1 lib/core/ 모듈

#### 4.1.1 platform.js

```javascript
/**
 * Platform Detection Module
 * @module lib/core/platform
 */

const path = require('path');

/**
 * @typedef {'claude' | 'gemini' | 'unknown'} Platform
 */

/**
 * 현재 플랫폼 감지
 * @returns {Platform}
 */
function detectPlatform() {
  if (process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY) {
    return 'gemini';
  }
  if (process.env.CLAUDE_PROJECT_DIR || process.env.ANTHROPIC_API_KEY) {
    return 'claude';
  }
  return 'unknown';
}

/** @type {Platform} */
const BKIT_PLATFORM = detectPlatform();

/**
 * Gemini CLI 여부
 * @returns {boolean}
 */
function isGeminiCli() {
  return BKIT_PLATFORM === 'gemini';
}

/**
 * Claude Code 여부
 * @returns {boolean}
 */
function isClaudeCode() {
  return BKIT_PLATFORM === 'claude';
}

/**
 * 플러그인 루트 경로
 * @type {string}
 */
const PLUGIN_ROOT = isGeminiCli()
  ? process.env.GEMINI_PLUGIN_ROOT || path.resolve(__dirname, '../..')
  : process.env.CLAUDE_PLUGIN_ROOT || path.resolve(__dirname, '../..');

/**
 * 프로젝트 디렉토리 경로
 * @type {string}
 */
const PROJECT_DIR = isGeminiCli()
  ? process.env.GEMINI_PROJECT_DIR || process.cwd()
  : process.env.CLAUDE_PROJECT_DIR || process.cwd();

/**
 * 플러그인 내 상대 경로 해결
 * @param {string} relativePath
 * @returns {string}
 */
function getPluginPath(relativePath) {
  return path.join(PLUGIN_ROOT, relativePath);
}

/**
 * 프로젝트 내 상대 경로 해결
 * @param {string} relativePath
 * @returns {string}
 */
function getProjectPath(relativePath) {
  return path.join(PROJECT_DIR, relativePath);
}

/**
 * 템플릿 파일 경로 반환
 * @param {string} templateName
 * @returns {string}
 */
function getTemplatePath(templateName) {
  return getPluginPath(`templates/${templateName}`);
}

module.exports = {
  detectPlatform,
  BKIT_PLATFORM,
  isGeminiCli,
  isClaudeCode,
  PLUGIN_ROOT,
  PROJECT_DIR,
  getPluginPath,
  getProjectPath,
  getTemplatePath,
};
```

#### 4.1.2 cache.js

```javascript
/**
 * In-Memory Cache with TTL
 * @module lib/core/cache
 */

/**
 * @typedef {Object} CacheEntry
 * @property {*} value
 * @property {number} timestamp
 */

/** @type {Map<string, CacheEntry>} */
const _store = new Map();

/** @type {number} */
const DEFAULT_TTL = 5000;

/**
 * 캐시에서 값 조회
 * @param {string} key
 * @param {number} [ttl=DEFAULT_TTL]
 * @returns {*|null}
 */
function get(key, ttl = DEFAULT_TTL) {
  const entry = _store.get(key);
  if (!entry) return null;

  if (Date.now() - entry.timestamp > ttl) {
    _store.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * 캐시에 값 저장
 * @param {string} key
 * @param {*} value
 */
function set(key, value) {
  _store.set(key, {
    value,
    timestamp: Date.now(),
  });
}

/**
 * 캐시 무효화
 * @param {string|RegExp} keyOrPattern
 */
function invalidate(keyOrPattern) {
  if (typeof keyOrPattern === 'string') {
    _store.delete(keyOrPattern);
  } else if (keyOrPattern instanceof RegExp) {
    for (const key of _store.keys()) {
      if (keyOrPattern.test(key)) {
        _store.delete(key);
      }
    }
  }
}

/**
 * 캐시 전체 삭제
 */
function clear() {
  _store.clear();
}

/**
 * 글로벌 캐시 인스턴스
 */
const globalCache = { get, set, invalidate, clear };

module.exports = {
  get,
  set,
  invalidate,
  clear,
  globalCache,
  // 레거시 호환
  _cache: globalCache,
};
```

#### 4.1.3 io.js

```javascript
/**
 * I/O Utilities
 * @module lib/core/io
 */

const fs = require('fs');
const { BKIT_PLATFORM } = require('./platform');

const MAX_CONTEXT_LENGTH = 500;

/**
 * 컨텍스트 문자열 자르기
 * @param {string} context
 * @param {number} [maxLength=MAX_CONTEXT_LENGTH]
 * @returns {string}
 */
function truncateContext(context, maxLength = MAX_CONTEXT_LENGTH) {
  if (!context || context.length <= maxLength) return context || '';
  return context.slice(0, maxLength) + '... (truncated)';
}

/**
 * stdin에서 JSON 동기적 읽기
 * @returns {*}
 */
function readStdinSync() {
  try {
    const input = fs.readFileSync(0, 'utf8');
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

/**
 * stdin에서 JSON 비동기 읽기
 * @returns {Promise<*>}
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
  });
}

/**
 * Hook 입력 파싱
 * @param {*} input
 * @returns {{toolName: string, filePath: string, content: string, command: string, oldString: string}}
 */
function parseHookInput(input) {
  return {
    toolName: input?.tool_name || input?.toolName || '',
    filePath: input?.tool_input?.file_path || input?.tool_input?.filePath || '',
    content: input?.tool_input?.content || '',
    command: input?.tool_input?.command || '',
    oldString: input?.tool_input?.old_string || '',
  };
}

/**
 * 허용 결정 출력 (플랫폼별 포맷)
 * @param {string} [context]
 * @param {string} [hookEvent]
 */
function outputAllow(context, hookEvent) {
  const truncated = truncateContext(context);

  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({
      status: 'allow',
      message: truncated || undefined,
    }));
  } else {
    if (hookEvent === 'SessionStart' || hookEvent === 'UserPromptSubmit') {
      console.log(JSON.stringify({
        success: true,
        message: truncated || undefined,
      }));
    } else {
      if (truncated) {
        console.log(truncated);
      }
    }
  }
}

/**
 * 차단 결정 출력 (플랫폼별 포맷)
 * @param {string} reason
 */
function outputBlock(reason) {
  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({
      status: 'block',
      message: reason,
    }));
  } else {
    console.log(JSON.stringify({
      decision: 'block',
      reason: reason,
    }));
  }
  process.exit(0);
}

/**
 * 빈 출력
 */
function outputEmpty() {
  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({ status: 'allow' }));
  }
}

/**
 * XML 특수문자 이스케이프
 * @param {string} content
 * @returns {string}
 */
function xmlSafeOutput(content) {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  MAX_CONTEXT_LENGTH,
  truncateContext,
  readStdinSync,
  readStdin,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputEmpty,
  xmlSafeOutput,
};
```

#### 4.1.4 debug.js

```javascript
/**
 * Debug Logging System
 * @module lib/core/debug
 */

const fs = require('fs');
const path = require('path');
const { BKIT_PLATFORM, PROJECT_DIR } = require('./platform');

/**
 * 플랫폼별 로그 파일 경로
 */
const DEBUG_LOG_PATHS = {
  claude: path.join(PROJECT_DIR, '.claude', 'bkit-debug.log'),
  gemini: path.join(PROJECT_DIR, '.gemini', 'bkit-debug.log'),
  unknown: path.join(PROJECT_DIR, 'bkit-debug.log'),
};

/**
 * 디버그 로그 파일 경로 반환
 * @returns {string}
 */
function getDebugLogPath() {
  return DEBUG_LOG_PATHS[BKIT_PLATFORM] || DEBUG_LOG_PATHS.unknown;
}

/**
 * 디버그 로그 기록
 * @param {string} category
 * @param {string} message
 * @param {Object} [data]
 */
function debugLog(category, message, data) {
  if (process.env.BKIT_DEBUG !== 'true') return;

  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    category,
    message,
    data,
  };

  try {
    const logPath = getDebugLogPath();
    const dir = path.dirname(logPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    // 로그 실패 시 무시
  }
}

module.exports = {
  DEBUG_LOG_PATHS,
  getDebugLogPath,
  debugLog,
};
```

#### 4.1.5 config.js

```javascript
/**
 * Configuration Management
 * @module lib/core/config
 */

const fs = require('fs');
const path = require('path');
const { PLUGIN_ROOT, PROJECT_DIR } = require('./platform');
const { globalCache } = require('./cache');

/**
 * bkit.config.json 로드
 * @returns {Object}
 */
function loadConfig() {
  const cached = globalCache.get('bkit-config');
  if (cached) return cached;

  const configPaths = [
    path.join(PROJECT_DIR, 'bkit.config.json'),
    path.join(PLUGIN_ROOT, 'bkit.config.json'),
  ];

  for (const configPath of configPaths) {
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        globalCache.set('bkit-config', config);
        return config;
      } catch (e) {
        // 파싱 실패 시 다음 경로 시도
      }
    }
  }

  return {};
}

/**
 * 설정값 조회 (dot notation)
 * @param {string} keyPath
 * @param {*} [defaultValue]
 * @returns {*}
 */
function getConfig(keyPath, defaultValue) {
  const config = loadConfig();
  const keys = keyPath.split('.');

  let value = config;
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }

  return value !== undefined ? value : defaultValue;
}

/**
 * 배열 설정값을 공백 구분 문자열로 조회
 * @param {string} keyPath
 * @param {string} [defaultValue='']
 * @returns {string}
 */
function getConfigArray(keyPath, defaultValue = '') {
  const value = getConfig(keyPath);
  if (Array.isArray(value)) {
    return value.join(' ');
  }
  return defaultValue;
}

module.exports = {
  loadConfig,
  getConfig,
  getConfigArray,
};
```

#### 4.1.6 file.js

```javascript
/**
 * File Type Detection
 * @module lib/core/file
 */

const path = require('path');
const { getConfig } = require('./config');

/**
 * Tier별 확장자 매핑
 */
const TIER_EXTENSIONS = {
  1: ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.kt'],
  2: ['.vue', '.svelte', '.astro', '.php', '.rb', '.swift', '.scala'],
  3: ['.c', '.cpp', '.h', '.hpp', '.cs', '.m', '.mm'],
  4: ['.sh', '.bash', '.zsh', '.ps1', '.bat', '.cmd'],
  experimental: ['.zig', '.nim', '.v', '.odin', '.jai'],
};

/**
 * 기본 제외 패턴
 */
const DEFAULT_EXCLUDE_PATTERNS = [
  'node_modules', '.git', 'dist', 'build', '.next', '__pycache__',
  'vendor', 'target', '.cache', '.turbo', 'coverage',
];

/**
 * 소스 파일 여부
 * @param {string} filePath
 * @returns {boolean}
 */
function isSourceFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const allExts = [
    ...TIER_EXTENSIONS[1],
    ...TIER_EXTENSIONS[2],
    ...TIER_EXTENSIONS[3],
    ...TIER_EXTENSIONS[4],
    ...TIER_EXTENSIONS.experimental,
  ];

  const customExts = getConfig('fileDetection.sourceExtensions', []);
  const excludePatterns = getConfig('fileDetection.excludePatterns', DEFAULT_EXCLUDE_PATTERNS);

  // 제외 패턴 체크
  for (const pattern of excludePatterns) {
    if (filePath.includes(pattern)) return false;
  }

  return allExts.includes(ext) || customExts.includes(ext);
}

/**
 * 코드 파일 여부
 * @param {string} filePath
 * @returns {boolean}
 */
function isCodeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const codeExts = ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java'];
  return codeExts.includes(ext);
}

/**
 * UI 컴포넌트 파일 여부
 * @param {string} filePath
 * @returns {boolean}
 */
function isUiFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const uiExts = ['.tsx', '.jsx', '.vue', '.svelte', '.astro'];
  return uiExts.includes(ext) || filePath.includes('/components/');
}

/**
 * 환경설정 파일 여부
 * @param {string} filePath
 * @returns {boolean}
 */
function isEnvFile(filePath) {
  const basename = path.basename(filePath);
  return basename.startsWith('.env') || basename.endsWith('.env');
}

module.exports = {
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,
};
```

#### 4.1.7 index.js (Core Entry Point)

```javascript
/**
 * @bkit/core - Core Module Entry Point
 * @module lib/core
 */

const platform = require('./platform');
const cache = require('./cache');
const io = require('./io');
const debug = require('./debug');
const config = require('./config');
const file = require('./file');

module.exports = {
  // Platform
  ...platform,

  // Cache
  ...cache,

  // I/O
  ...io,

  // Debug
  ...debug,

  // Config
  ...config,

  // File
  ...file,
};
```

---

### 4.2 lib/pdca/ 모듈

#### 4.2.1 status.js (15개 함수 - 주요 함수만 표시)

```javascript
/**
 * PDCA Status Management
 * @module lib/pdca/status
 */

const fs = require('fs');
const path = require('path');
const { PROJECT_DIR, debugLog, globalCache } = require('../core');

const PDCA_STATUS_PATH = path.join(PROJECT_DIR, 'docs', '.pdca-status.json');

/**
 * 초기 상태 v2.0 생성
 * @returns {Object}
 */
function createInitialStatusV2() {
  return {
    version: '2.0',
    lastUpdated: new Date().toISOString(),
    activeFeatures: [],
    primaryFeature: null,
    features: {},
    pipeline: { currentPhase: 1, level: 'Starter', phaseHistory: [] },
    session: { startedAt: new Date().toISOString(), onboardingCompleted: false },
    history: [],
  };
}

/**
 * 전체 상태 조회
 * @param {boolean} [forceRefresh=false]
 * @returns {Object}
 */
function getPdcaStatusFull(forceRefresh = false) {
  if (!forceRefresh) {
    const cached = globalCache.get('pdca-status-full', 3000);
    if (cached) return cached;
  }

  try {
    if (fs.existsSync(PDCA_STATUS_PATH)) {
      const status = JSON.parse(fs.readFileSync(PDCA_STATUS_PATH, 'utf8'));
      globalCache.set('pdca-status-full', status);
      return status;
    }
  } catch (e) {
    debugLog('pdca-status', 'Failed to load status', { error: e.message });
  }

  return createInitialStatusV2();
}

/**
 * 상태 저장
 * @param {Object} status
 */
function savePdcaStatus(status) {
  status.lastUpdated = new Date().toISOString();

  const dir = path.dirname(PDCA_STATUS_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(PDCA_STATUS_PATH, JSON.stringify(status, null, 2));
  globalCache.invalidate('pdca-status-full');
}

/**
 * Feature 상태 조회
 * @param {string} feature
 * @returns {Object|null}
 */
function getFeatureStatus(feature) {
  const status = getPdcaStatusFull();
  return status.features?.[feature] || null;
}

/**
 * 상태 업데이트
 * @param {string} feature
 * @param {string} phase
 * @param {Object} [data={}]
 */
function updatePdcaStatus(feature, phase, data = {}) {
  const status = getPdcaStatusFull(true);

  if (!status.features[feature]) {
    status.features[feature] = {
      phase: phase,
      phaseNumber: getPhaseNumber(phase),
      matchRate: null,
      iterationCount: 0,
      requirements: [],
      documents: {},
      timestamps: { started: new Date().toISOString() },
    };
  }

  Object.assign(status.features[feature], {
    phase,
    phaseNumber: getPhaseNumber(phase),
    ...data,
    timestamps: {
      ...status.features[feature].timestamps,
      lastUpdated: new Date().toISOString(),
    },
  });

  status.history.push({
    timestamp: new Date().toISOString(),
    feature,
    phase,
    action: 'updated',
  });

  savePdcaStatus(status);
}

// ... (나머지 함수들)

module.exports = {
  createInitialStatusV2,
  getPdcaStatusFull,
  savePdcaStatus,
  getFeatureStatus,
  updatePdcaStatus,
  // ... 기타 exports
};
```

*나머지 모듈 설계는 동일한 패턴으로 진행*

---

## 5. 구현 순서

### Phase 1: Core 모듈 (Week 1)

| 순서 | 파일 | 함수 수 | 의존성 |
|:----:|------|:------:|--------|
| 1 | lib/core/platform.js | 8 | Node.js 내장 |
| 2 | lib/core/cache.js | 4 | 없음 |
| 3 | lib/core/debug.js | 3 | platform |
| 4 | lib/core/config.js | 3 | platform, cache |
| 5 | lib/core/io.js | 8 | platform |
| 6 | lib/core/file.js | 4 | config |
| 7 | lib/core/index.js | - | 모두 통합 |

### Phase 2: PDCA 모듈 (Week 2)

| 순서 | 파일 | 함수 수 | 의존성 |
|:----:|------|:------:|--------|
| 1 | lib/pdca/tier.js | 8 | core |
| 2 | lib/pdca/level.js | 7 | core |
| 3 | lib/pdca/phase.js | 10 | core |
| 4 | lib/pdca/status.js | 15 | core |
| 5 | lib/pdca/automation.js | 7 | core, status |
| 6 | lib/pdca/index.js | - | 모두 통합 |

### Phase 3: Intent 모듈 (Week 3)

| 순서 | 파일 | 함수 수 | 의존성 |
|:----:|------|:------:|--------|
| 1 | lib/intent/language.js | 8 | core |
| 2 | lib/intent/trigger.js | 3 | core, language |
| 3 | lib/intent/ambiguity.js | 9 | core |
| 4 | lib/intent/index.js | - | 모두 통합 |

### Phase 4: Task 모듈 (Week 4)

| 순서 | 파일 | 함수 수 | 의존성 |
|:----:|------|:------:|--------|
| 1 | lib/task/classification.js | 5 | core |
| 2 | lib/task/context.js | 5 | core |
| 3 | lib/task/creator.js | 6 | core, pdca |
| 4 | lib/task/tracker.js | 6 | core, pdca |
| 5 | lib/task/index.js | - | 모두 통합 |

### Phase 5: Migration Bridge (Week 4)

| 순서 | 작업 |
|:----:|------|
| 1 | lib/common.js를 Migration Bridge로 변환 |
| 2 | 모든 스크립트 테스트 (39개) |
| 3 | 기존 lib 모듈 업데이트 (6개) |

---

## 6. 테스트 전략

### 6.1 단위 테스트 (Jest)

```javascript
// tests/lib/core/platform.test.js
const { detectPlatform, isClaudeCode, isGeminiCli } = require('../../../lib/core/platform');

describe('Platform Detection', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('detects Claude Code when CLAUDE_PROJECT_DIR is set', () => {
    process.env.CLAUDE_PROJECT_DIR = '/some/path';
    expect(detectPlatform()).toBe('claude');
  });

  test('detects Gemini CLI when GEMINI_API_KEY is set', () => {
    process.env.GEMINI_API_KEY = 'some-key';
    expect(detectPlatform()).toBe('gemini');
  });

  test('returns unknown when no env vars set', () => {
    expect(detectPlatform()).toBe('unknown');
  });
});
```

### 6.2 통합 테스트

```javascript
// tests/integration/migration-bridge.test.js
const common = require('../../lib/common');
const core = require('../../lib/core');

describe('Migration Bridge', () => {
  test('all core exports are available from common', () => {
    expect(common.debugLog).toBe(core.debugLog);
    expect(common.BKIT_PLATFORM).toBe(core.BKIT_PLATFORM);
    expect(common.outputAllow).toBe(core.outputAllow);
  });

  test('legacy _cache is available', () => {
    expect(common._cache).toBeDefined();
    expect(common._cache.get).toBeInstanceOf(Function);
  });
});
```

---

## 7. 검증 기준 (Acceptance Criteria)

### 7.1 필수 (P0)

| ID | 검증 항목 | 통과 기준 |
|----|----------|----------|
| AC-01 | 순환 의존성 | madge 검사 0개 |
| AC-02 | 하위 호환성 | 모든 39개 스크립트 정상 동작 |
| AC-03 | 테스트 커버리지 | 80% 이상 |
| AC-04 | 런타임 오류 | 0개 |

### 7.2 권장 (P1)

| ID | 검증 항목 | 통과 기준 |
|----|----------|----------|
| AC-05 | 모듈 크기 | 각 파일 500줄 이하 |
| AC-06 | 함수 크기 | 각 함수 50줄 이하 |
| AC-07 | JSDoc 커버리지 | 모든 public 함수 |

---

## 8. 리스크 및 완화

| 리스크 | 영향 | 완화 전략 |
|--------|------|----------|
| 하위 호환성 깨짐 | 높음 | Migration Bridge로 100% 호환 유지 |
| 순환 의존성 발생 | 중간 | 단방향 의존성 규칙 엄격 적용 |
| 테스트 미비 | 중간 | TDD 방식으로 모듈별 테스트 먼저 작성 |

---

## Appendix A: 전체 함수 목록 (110개)

*기존 설계서의 Category 1-19 함수 목록 참조*

---

## Appendix B: 스크립트별 의존성 맵

| 스크립트 | Core | PDCA | Intent | Task |
|----------|:----:|:----:|:------:|:----:|
| hooks/session-start.js | ✓ | ✓ | ✓ | - |
| scripts/unified-stop.js | ✓ | - | - | ✓ |
| scripts/pdca-skill-stop.js | ✓ | ✓ | - | ✓ |
| scripts/gap-detector-stop.js | ✓ | ✓ | - | ✓ |
| scripts/iterator-stop.js | ✓ | ✓ | - | ✓ |
| scripts/user-prompt-handler.js | ✓ | - | ✓ | - |
| *... 33개 추가* | | | | |

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0.0 | 2026-01-29 | 초기 설계 (npm 패키지 기반) |
| 2.0.0 | 2026-01-29 | Claude Code 플러그인 호환 아키텍처로 수정 |
