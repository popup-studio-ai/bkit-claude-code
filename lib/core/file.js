/**
 * File Type Detection
 * @module lib/core/file
 * @version 2.1.15
 */

const path = require('path');

// Lazy require to avoid circular dependency
let _config = null;
function getConfigModule() {
  if (!_config) {
    _config = require('./config');
  }
  return _config;
}

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
 * 기본 Feature 패턴
 * Feature 추출 시 사용되는 디렉토리 패턴
 */
const DEFAULT_FEATURE_PATTERNS = [
  'features', 'modules', 'packages', 'apps', 'services', 'domains'
];

/**
 * 소스 파일 여부
 * @param {string} filePath
 * @returns {boolean}
 */
function isSourceFile(filePath) {
  const { getConfig } = getConfigModule();
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

/**
 * v2.1.15 (Issue #89): genericNames 확장 — 일반 백엔드/프론트 레이아웃 디렉토리,
 * 버전 디렉토리, Next.js 라우트 그룹 등 흔한 비-feature 디렉토리 명시.
 */
const GENERIC_NAMES = [
  // 코어 (v1.x baseline)
  'src', 'lib', 'app', 'components', 'pages', 'utils', 'hooks',
  'types', 'internal', 'cmd', 'pkg', 'models', 'views',
  'routers', 'controllers', 'services', 'common', 'shared',
  // v2.1.15 (Issue #89): 일반 백엔드/프론트 레이아웃 디렉토리
  'api', 'web', 'mobile', 'client', 'server', 'backend', 'frontend',
  'admin', 'auth', 'cms', 'database', 'db', 'config', 'core',
  'helpers', 'middleware', 'plugins', 'scripts', 'styles', 'static',
  'public', 'assets', 'tests', 'test', 'spec', 'specs', 'docs',
  'tenants', 'versions', 'tmp', 'temp', 'audit', 'dashboard',
  // 버전 디렉토리 (v1~v9)
  'v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8', 'v9',
  // Next.js 라우트 그룹
  '(dashboard)', '(auth)', '(public)', '(admin)', '(api)',
];

/**
 * 파일 경로에서 Feature 이름 추출.
 *
 * v2.1.15 (Issue #89) 변경:
 *   - 패턴 매칭 시 캡처값이 파일(확장자 보유)이면 skip
 *   - GENERIC_NAMES 대폭 확장 (일반 디렉토리 + 버전 + 라우트 그룹)
 *   - Fallback (부모 디렉토리 거슬러 올라가기)은 explicit opt-in (default OFF)
 *
 * @param {string} filePath - 파일 경로
 * @param {Object} [opts] - 옵션
 * @param {boolean} [opts.allowFallback=false] - 패턴 미매칭 시 부모 디렉토리 fallback 허용
 *        (기존 동작이 필요한 호출자는 명시적으로 true 전달)
 * @returns {string} Feature 이름 또는 빈 문자열
 */
function extractFeature(filePath, opts = {}) {
  if (!filePath || typeof filePath !== 'string') return '';

  const allowFallback = opts.allowFallback === true;
  const { getConfig } = getConfigModule();
  const featurePatterns = getConfig('featurePatterns', DEFAULT_FEATURE_PATTERNS);

  // 1) Configured feature patterns
  for (const pattern of featurePatterns) {
    const regex = new RegExp(`${pattern}/([^/]+)`);
    const match = filePath.match(regex);
    if (!match || !match[1]) continue;
    const captured = match[1];
    // v2.1.15: 파일명 오추출 방지 — 확장자 있으면 skip (정당한 feature는 디렉토리)
    if (path.extname(captured)) continue;
    if (GENERIC_NAMES.includes(captured)) continue;
    return captured;
  }

  // 2) Fallback (opt-in only): 부모 디렉토리 거슬러 올라가며 generic 아닌 첫 디렉토리
  if (allowFallback) {
    const parts = filePath.split(/[/\\]/).filter(Boolean);
    for (let i = parts.length - 2; i >= 0; i--) {
      const candidate = parts[i];
      if (GENERIC_NAMES.includes(candidate)) continue;
      if (path.extname(candidate)) continue; // 파일 확장자 가진 항목 skip
      return candidate;
    }
  }

  return '';
}

module.exports = {
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS,
  GENERIC_NAMES, // v2.1.15 (Issue #89): 테스트/외부 도구가 generic 목록 참조 가능
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,
  extractFeature,
};
