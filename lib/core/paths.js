/**
 * Path Registry - Centralized state file path management
 * @module lib/core/paths
 * @version 2.0.0
 */
const path = require('path');
const fs = require('fs');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) { _platform = require('./platform'); }
  return _platform;
}

// Helper accessors for directory paths
function getBkitRoot() { return path.join(getPlatform().PROJECT_DIR, '.bkit'); }
function getStateDir() { return path.join(getBkitRoot(), 'state'); }
function getRuntimeDir() { return path.join(getBkitRoot(), 'runtime'); }

const STATE_PATHS = {
  root:       () => getBkitRoot(),
  state:      () => getStateDir(),
  runtime:    () => getRuntimeDir(),
  snapshots:  () => path.join(getBkitRoot(), 'snapshots'),
  pdcaStatus: () => path.join(getStateDir(), 'pdca-status.json'),
  memory:     () => path.join(getStateDir(), 'memory.json'),
  agentState: () => path.join(getRuntimeDir(), 'agent-state.json'),
  // v1.6.2: ${CLAUDE_PLUGIN_DATA} persistent backup (ENH-119)
  pluginData: () => process.env.CLAUDE_PLUGIN_DATA || null,
  pluginDataBackup: () => {
    const pd = process.env.CLAUDE_PLUGIN_DATA;
    return pd ? path.join(pd, 'backup') : null;
  },

  // v2.0.0 Quality
  qualityMetrics:  () => path.join(getStateDir(), 'quality-metrics.json'),
  qualityHistory:  () => path.join(getStateDir(), 'quality-history.json'),
  regressionRules: () => path.join(getStateDir(), 'regression-rules.json'),
  trustProfile:    () => path.join(getStateDir(), 'trust-profile.json'),

  // v2.0.0 Resume & Workflow State
  resumeDir:        () => path.join(getStateDir(), 'resume'),
  workflowStateDir: () => path.join(getStateDir(), 'workflows'),

  // v2.0.0 Runtime
  agentEvents:  () => path.join(getRuntimeDir(), 'agent-events.jsonl'),
  controlState: () => path.join(getRuntimeDir(), 'control-state.json'),

  // v2.0.0 Audit & Decisions
  auditDir:     () => path.join(getBkitRoot(), 'audit'),
  decisionsDir: () => path.join(getBkitRoot(), 'decisions'),

  // v2.0.0 Checkpoints
  checkpointsDir:   () => path.join(getBkitRoot(), 'checkpoints'),
  checkpointIndex:  () => path.join(getBkitRoot(), 'checkpoints', 'index.json'),

  // v2.0.0 Workflows
  workflowsDir: () => path.join(getBkitRoot(), 'workflows'),

  // v2.0.0 PLUGIN_DATA extended
  pluginDataLearnings:  () => { const pd = process.env.CLAUDE_PLUGIN_DATA; return pd ? path.join(pd, 'learnings') : null; },
  pluginDataProfiles:   () => { const pd = process.env.CLAUDE_PLUGIN_DATA; return pd ? path.join(pd, 'profiles') : null; },
  pluginDataRegression: () => { const pd = process.env.CLAUDE_PLUGIN_DATA; return pd ? path.join(pd, 'regression') : null; },
  pluginDataAudit:      () => { const pd = process.env.CLAUDE_PLUGIN_DATA; return pd ? path.join(pd, 'audit') : null; },
  pluginDataMeta:       () => { const pd = process.env.CLAUDE_PLUGIN_DATA; return pd ? path.join(pd, 'meta.json') : null; },
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
  const dirs = [
    STATE_PATHS.root(), STATE_PATHS.state(), STATE_PATHS.runtime(),
    // v2.0.0: new directories
    STATE_PATHS.resumeDir(), STATE_PATHS.workflowStateDir(),
    STATE_PATHS.auditDir(), STATE_PATHS.decisionsDir(),
    STATE_PATHS.checkpointsDir(), STATE_PATHS.workflowsDir(),
  ];
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
  pm: [
    'docs/00-pm/features/{feature}.prd.md',
    'docs/00-pm/{feature}.prd.md',
  ],
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
    pm: getConfig('pdca.docPaths.pm', DEFAULT_DOC_PATHS.pm),
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

/**
 * Backup critical state files to ${CLAUDE_PLUGIN_DATA}
 * Called after every savePdcaStatus() and saveMemory()
 * @returns {{ backed: string[], skipped: string[] }}
 */
function backupToPluginData() {
  const backupDir = STATE_PATHS.pluginDataBackup();
  if (!backupDir) return { backed: [], skipped: ['no CLAUDE_PLUGIN_DATA'] };

  try {
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
  } catch (e) {
    return { backed: [], skipped: [e.message] };
  }

  const targets = [
    { src: STATE_PATHS.pdcaStatus, name: 'pdca-status.backup.json' },
    { src: STATE_PATHS.memory, name: 'memory.backup.json' },
  ];

  const backed = [];
  const skipped = [];

  for (const t of targets) {
    try {
      const srcPath = t.src();
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, path.join(backupDir, t.name));
        backed.push(t.name);
      }
    } catch (e) {
      skipped.push(`${t.name}: ${e.message}`);
    }
  }

  // Track backup timestamps
  try {
    const historyPath = path.join(backupDir, 'version-history.json');
    let history = [];
    if (fs.existsSync(historyPath)) {
      history = JSON.parse(fs.readFileSync(historyPath, 'utf8'));
    }
    history.push({ timestamp: new Date().toISOString(), bkitVersion: '2.0.3', backed });
    if (history.length > 50) history = history.slice(-50);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  } catch (e) { /* version-history is non-critical */ }

  // v2.0.1: Write project identity for cross-project restore guard (#48)
  try {
    const metaPath = path.join(backupDir, 'meta.json');
    const meta = {
      projectDir: getPlatform().PROJECT_DIR,
      timestamp: new Date().toISOString(),
      bkitVersion: '2.0.3',
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2));
  } catch (_) { /* meta.json is non-critical */ }

  return { backed, skipped };
}

/**
 * Restore state files from ${CLAUDE_PLUGIN_DATA} backup
 * Called during SessionStart when primary state files are missing
 * @returns {{ restored: string[], skipped: string[] }}
 */
function restoreFromPluginData() {
  const backupDir = STATE_PATHS.pluginDataBackup();
  if (!backupDir || !fs.existsSync(backupDir)) {
    return { restored: [], skipped: ['no backup directory'] };
  }

  // v2.0.1: Project identity guard — prevent cross-project restore (#48)
  const metaPath = path.join(backupDir, 'meta.json');
  try {
    if (!fs.existsSync(metaPath)) {
      return { restored: [], skipped: ['no meta.json — legacy backup, skipping for safety'] };
    }
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    if (!meta.projectDir) {
      return { restored: [], skipped: ['meta.json missing projectDir'] };
    }
    const currentDir = getPlatform().PROJECT_DIR;

    // Normalize paths to handle symlinks
    let metaResolved = meta.projectDir;
    let currentResolved = currentDir;
    try {
      metaResolved = fs.realpathSync(meta.projectDir);
      currentResolved = fs.realpathSync(currentDir);
    } catch (_) { /* realpathSync fails if path doesn't exist */ }

    if (metaResolved !== currentResolved) {
      return {
        restored: [],
        skipped: [`backup belongs to different project: ${meta.projectDir}`],
      };
    }
  } catch (e) {
    return { restored: [], skipped: [`meta.json parse error: ${e.message}`] };
  }

  const targets = [
    { backup: 'pdca-status.backup.json', dest: STATE_PATHS.pdcaStatus, name: 'pdca-status' },
    { backup: 'memory.backup.json', dest: STATE_PATHS.memory, name: 'memory' },
  ];

  const restored = [];
  const skipped = [];

  for (const t of targets) {
    const destPath = t.dest();
    const backupPath = path.join(backupDir, t.backup);

    if (!fs.existsSync(destPath) && fs.existsSync(backupPath)) {
      try {
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        fs.copyFileSync(backupPath, destPath);
        restored.push(t.name);
      } catch (e) {
        skipped.push(`${t.name}: ${e.message}`);
      }
    }
  }

  return { restored, skipped };
}

module.exports = {
  STATE_PATHS, LEGACY_PATHS, CONFIG_PATHS, ensureBkitDirs,
  getDocPaths, resolveDocPaths, findDoc, getArchivePath,
  // v1.6.2: ${CLAUDE_PLUGIN_DATA} backup/restore (ENH-119)
  backupToPluginData, restoreFromPluginData,
};
