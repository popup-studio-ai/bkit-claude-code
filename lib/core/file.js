/**
 * File Type Detection
 * @module lib/core/file
 * @version 1.4.7
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
 * 파일 경로에서 Feature 이름 추출
 * @param {string} filePath - 파일 경로
 * @returns {string} Feature 이름 또는 빈 문자열
 */
function extractFeature(filePath) {
  if (!filePath) return '';

  const { getConfig } = getConfigModule();
  const featurePatterns = getConfig('featurePatterns', DEFAULT_FEATURE_PATTERNS);
  const genericNames = [
    'src', 'lib', 'app', 'components', 'pages', 'utils', 'hooks',
    'types', 'internal', 'cmd', 'pkg', 'models', 'views',
    'routers', 'controllers', 'services', 'common', 'shared'
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
  const parts = filePath.split(/[/\\]/).filter(Boolean);
  for (let i = parts.length - 2; i >= 0; i--) {
    if (!genericNames.includes(parts[i])) {
      return parts[i];
    }
  }

  return '';
}

module.exports = {
  TIER_EXTENSIONS,
  DEFAULT_EXCLUDE_PATTERNS,
  DEFAULT_FEATURE_PATTERNS,
  isSourceFile,
  isCodeFile,
  isUiFile,
  isEnvFile,
  extractFeature,
};
