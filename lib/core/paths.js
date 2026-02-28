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

module.exports = { STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs };
