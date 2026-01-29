/**
 * Configuration Management
 * @module lib/core/config
 * @version 1.4.7
 */

const fs = require('fs');
const path = require('path');

// Lazy require to avoid circular dependency
let _platform = null;
let _cache = null;

function getPlatform() {
  if (!_platform) {
    _platform = require('./platform');
  }
  return _platform;
}

function getCache() {
  if (!_cache) {
    _cache = require('./cache');
  }
  return _cache;
}

/**
 * bkit.config.json 로드
 * @returns {Object}
 */
function loadConfig() {
  const { globalCache } = getCache();
  const cached = globalCache.get('bkit-config');
  if (cached) return cached;

  const { PLUGIN_ROOT, PROJECT_DIR } = getPlatform();
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

/**
 * 전체 bkit 설정 조회 (환경변수 오버라이드 포함)
 * @param {boolean} [forceRefresh=false]
 * @returns {Object}
 */
function getBkitConfig(forceRefresh = false) {
  const { globalCache } = getCache();

  if (!forceRefresh) {
    const cached = globalCache.get('bkit-full-config', 10000);
    if (cached) return cached;
  }

  const baseConfig = loadConfig();

  const config = {
    pdca: {
      matchRateThreshold: getConfig('pdca.matchRateThreshold', 90),
      maxIterations: getConfig('pdca.maxIterations', 5),
      autoIterate: getConfig('pdca.autoIterate', true),
      requireDesignDoc: getConfig('pdca.requireDesignDoc', true),
      automationLevel: process.env.BKIT_PDCA_AUTOMATION || getConfig('pdca.automationLevel', 'semi-auto'),
      fullAuto: {
        reviewCheckpoints: getConfig('pdca.fullAuto.reviewCheckpoints', ['design']),
      },
    },
    triggers: {
      implicitEnabled: getConfig('triggers.implicitEnabled', true),
      confidenceThreshold: getConfig('triggers.confidenceThreshold', 0.7),
      clarifyAmbiguity: getConfig('triggers.clarifyAmbiguity', true),
    },
    pipeline: {
      autoTransition: getConfig('pipeline.autoTransition', false),
      skipConfirmation: getConfig('pipeline.skipConfirmation', false),
    },
    multiFeature: {
      maxActiveFeatures: getConfig('multiFeature.maxActiveFeatures', 5),
      autoSwitch: getConfig('multiFeature.autoSwitch', true),
    },
    cache: {
      enabled: getConfig('cache.enabled', true),
      ttl: getConfig('cache.ttl', 5000),
    },
    ...baseConfig,
  };

  globalCache.set('bkit-full-config', config);
  return config;
}

/**
 * 안전한 JSON 파싱
 * @param {string} str
 * @param {*} [fallback=null]
 * @returns {*}
 */
function safeJsonParse(str, fallback = null) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return fallback;
  }
}

module.exports = {
  loadConfig,
  getConfig,
  getConfigArray,
  getBkitConfig,
  safeJsonParse,
};
