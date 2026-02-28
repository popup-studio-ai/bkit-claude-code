/**
 * Path Registry - bkit 상태 파일 경로 중앙 관리
 * @module lib/core/paths
 * @version 1.5.8
 */
const path = require('path');
const fs = require('fs');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('./platform'); }
  return _platform;
}

const STATE_PATHS = {
  root:       () => path.join(getPlatform().PROJECT_DIR, '.bkit'),
  state:      () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state'),
  runtime:    () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'snapshots'),
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'state', 'memory.json'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'runtime', 'agent-state.json'),
};

/** @deprecated v1.6.0에서 제거 예정 */
const LEGACY_PATHS = {
  pdcaStatus: () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-status.json'),
  memory:     () => path.join(getPlatform().PROJECT_DIR, 'docs', '.bkit-memory.json'),
  snapshots:  () => path.join(getPlatform().PROJECT_DIR, 'docs', '.pdca-snapshots'),
  agentState: () => path.join(getPlatform().PROJECT_DIR, '.bkit', 'agent-state.json'),
};

const CONFIG_PATHS = {
  bkitConfig: () => path.join(getPlatform().PROJECT_DIR, 'bkit.config.json'),
  pluginJson: () => path.join(getPlatform().PLUGIN_ROOT, '.claude-plugin', 'plugin.json'),
  hooksJson:  () => path.join(getPlatform().PLUGIN_ROOT, 'hooks', 'hooks.json'),
};

function ensureBkitDirs() {
  const dirs = [STATE_PATHS.root(), STATE_PATHS.state(), STATE_PATHS.runtime()];
  // snapshots는 제외 -- context-compaction.js에서 최초 사용 시 생성
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

// Lazy require config to avoid circular dependency
let _config = null;
function getConfigModule() {
  if (!_config) { _config = require('./config'); }
  return _config;
}

/** Default PDCA doc path templates (fallback when config has no docPaths) */
const DEFAULT_DOC_PATHS = {
  plan: [
    'docs/01-plan/features/{feature}.plan.md',
    'docs/01-plan/{feature}.plan.md',
    'docs/plan/{feature}.md',
  ],
  design: [
    'docs/02-design/features/{feature}.design.md',
    'docs/02-design/{feature}.design.md',
    'docs/design/{feature}.md',
  ],
  analysis: [
    'docs/03-analysis/{feature}.analysis.md',
    'docs/03-analysis/features/{feature}.analysis.md',
    'docs/03-analysis/{feature}.gap-analysis.md',
  ],
  report: [
    'docs/04-report/features/{feature}.report.md',
    'docs/04-report/{feature}.report.md',
    'docs/04-report/{feature}.completion-report.md',
  ],
  archive: 'docs/archive/{date}/{feature}',
};

/**
 * Get PDCA doc path templates from config (with hardcoded fallbacks)
 * @returns {Object} docPaths keyed by phase (plan/design/analysis/report/archive)
 */
function getDocPaths() {
  const { getConfig } = getConfigModule();
  return {
    plan: getConfig('pdca.docPaths.plan', DEFAULT_DOC_PATHS.plan),
    design: getConfig('pdca.docPaths.design', DEFAULT_DOC_PATHS.design),
    analysis: getConfig('pdca.docPaths.analysis', DEFAULT_DOC_PATHS.analysis),
    report: getConfig('pdca.docPaths.report', DEFAULT_DOC_PATHS.report),
    archive: getConfig('pdca.docPaths.archive', DEFAULT_DOC_PATHS.archive),
  };
}

/**
 * Resolve doc path templates to absolute paths for a given phase/feature
 * @param {string} phase - PDCA phase (plan/design/analysis/report)
 * @param {string} feature - Feature name
 * @returns {string[]} Array of absolute paths
 */
function resolveDocPaths(phase, feature) {
  if (!feature) return [];
  const docPaths = getDocPaths();
  const templates = docPaths[phase];
  if (!templates || typeof templates === 'string') return [];
  const projectDir = getPlatform().PROJECT_DIR;
  return templates.map(t =>
    path.join(projectDir, t.replace(/\{feature\}/g, feature))
  );
}

/**
 * Find first existing doc for a given phase/feature
 * @param {string} phase - PDCA phase (plan/design/analysis/report)
 * @param {string} feature - Feature name
 * @returns {string} Absolute path to found doc, or empty string
 */
function findDoc(phase, feature) {
  const candidates = resolveDocPaths(phase, feature);
  for (const p of candidates) {
    try {
      fs.accessSync(p, fs.constants.R_OK);
      return p;
    } catch (e) {
      continue;
    }
  }
  return '';
}

/**
 * Compute archive directory path for a feature
 * @param {string} feature - Feature name
 * @param {Date} [date] - Date to use (defaults to now)
 * @returns {string} Absolute path to archive directory
 */
function getArchivePath(feature, date) {
  const d = date || new Date();
  const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const docPaths = getDocPaths();
  const template = docPaths.archive || DEFAULT_DOC_PATHS.archive;
  const relPath = template
    .replace(/\{date\}/g, dateStr)
    .replace(/\{feature\}/g, feature);
  return path.join(getPlatform().PROJECT_DIR, relPath);
}

module.exports = {
  STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs,
  getDocPaths, resolveDocPaths, findDoc, getArchivePath,
};
