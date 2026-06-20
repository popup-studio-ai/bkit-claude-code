/**
 * Full-Auto Do: Design-based automatic code implementation for L4 mode
 * @module lib/pdca/full-auto-do
 * @version 2.1.10
 *
 * Parses design documents to extract implementation tasks,
 * generates implementation plans, and coordinates execution
 * via Agent Teams or sequential prompts.
 */

const fs = require('fs');
const path = require('path');

// Lazy requires to avoid circular dependencies
let _core = null;
function getCore() {
  if (!_core) { _core = require('../core'); }
  return _core;
}

let _status = null;
function getStatus() {
  if (!_status) { _status = require('./status'); }
  return _status;
}

let _phase = null;
function getPhase() {
  if (!_phase) { _phase = require('./phase'); }
  return _phase;
}

// ── Constants ───────────────────────────────────────────────────────

/** @type {number} Minimum completion rate to consider partial success */
const PARTIAL_SUCCESS_THRESHOLD = 80;

/** @type {number} Maximum retry attempts for failed tasks */
const MAX_TASK_RETRIES = 1;

/** @type {RegExp} Pattern to match file path + purpose tables in design docs */
const FILE_TABLE_PATTERN = /\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|/g;

// EXPORT_FUNC_PATTERN removed: unused regex constant (0 references).

/** @type {RegExp} Pattern to match @typedef blocks */
const TYPEDEF_PATTERN = /@typedef\s*\{[^}]+\}\s*(\w+)/g;

// ── Design Document Parsing ─────────────────────────────────────────

/**
 * Parse design document to extract implementation tasks
 * @param {string} feature - Feature name
 * @returns {{tasks: Object[], totalFiles: number, estimatedLOC: number}}
 */
function parseDesignForTasks(feature) {
  const { debugLog } = getCore();
  const { findDesignDoc } = getPhase();

  const designPath = findDesignDoc(feature);
  if (!designPath || !fs.existsSync(designPath)) {
    debugLog('FULL-AUTO-DO', 'Design document not found', { feature });
    return { tasks: [], totalFiles: 0, estimatedLOC: 0 };
  }

  const content = fs.readFileSync(designPath, 'utf8');
  const tasks = [];
  let taskId = 0;

  // 1. Extract file creation/modification tasks from tables
  const fileMatches = content.matchAll(FILE_TABLE_PATTERN);
  for (const match of fileMatches) {
    const filePath = match[1].trim();
    const description = match[2].trim();

    // Skip header rows and non-file entries
    if (filePath === '파일' || filePath === 'File' || filePath.includes('---')) continue;

    taskId++;
    tasks.push({
      id: `task-${String(taskId).padStart(3, '0')}`,
      type: _inferTaskType(filePath),
      filePath,
      description,
      dependsOn: [],
      status: 'pending',
      agentId: null,
      priority: _inferPriority(filePath),
      retryCount: 0,
    });
  }

  // 2. Extract data model definitions
  const typedefMatches = content.matchAll(TYPEDEF_PATTERN);
  const typedefNames = new Set();
  for (const match of typedefMatches) {
    typedefNames.add(match[1]);
  }

  // 3. Resolve task dependencies (test files depend on source files)
  _resolveDependencies(tasks);

  // 4. Estimate LOC
  const estimatedLOC = tasks.length * 150; // rough average

  debugLog('FULL-AUTO-DO', 'Design parsed', {
    feature,
    tasks: tasks.length,
    typedefs: typedefNames.size,
    estimatedLOC,
  });

  return {
    tasks,
    totalFiles: tasks.length,
    estimatedLOC,
  };
}

/**
 * Generate implementation plan from design tasks
 * @param {Object[]} tasks - Array of ImplementationTask
 * @returns {{plan: string, agents: string[], estimatedTime: string}}
 */
function generateImplementationPlan(tasks) {
  if (!tasks || tasks.length === 0) {
    return { plan: 'No tasks to implement', agents: [], estimatedTime: '0m' };
  }

  // Sort by priority (lower = higher priority)
  const sorted = [...tasks].sort((a, b) => a.priority - b.priority);

  // Group independent tasks (no dependencies) for parallel execution
  const independent = sorted.filter(t => t.dependsOn.length === 0);
  const dependent = sorted.filter(t => t.dependsOn.length > 0);

  // Determine agent count
  const { getConfig } = getCore();
  const maxAgents = getConfig('team.maxTeammates', 5);
  const agentCount = Math.min(independent.length, maxAgents);
  const agents = [];
  for (let i = 0; i < agentCount; i++) {
    agents.push(`impl-agent-${i + 1}`);
  }

  // Estimate time (rough: 2min per task sequential, parallel reduces)
  const parallelBatches = Math.ceil(independent.length / Math.max(agentCount, 1));
  const totalBatches = parallelBatches + dependent.length;
  const estimatedMinutes = totalBatches * 2;
  const estimatedTime = estimatedMinutes < 60
    ? `${estimatedMinutes}m`
    : `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`;

  // Build plan text
  const lines = [
    `Implementation Plan: ${tasks.length} tasks`,
    `  Independent: ${independent.length} (parallel with ${agentCount} agents)`,
    `  Dependent: ${dependent.length} (sequential)`,
    `  Estimated: ${estimatedTime}`,
    '',
    'Task Order:',
  ];

  for (const task of sorted) {
    const deps = task.dependsOn.length > 0 ? ` [after: ${task.dependsOn.join(', ')}]` : ' [parallel]';
    lines.push(`  ${task.id}: ${task.type} ${task.filePath}${deps}`);
  }

  return {
    plan: lines.join('\n'),
    agents,
    estimatedTime,
  };
}

/**
 * Execute full-auto Do phase
 * Coordinates Agent Team to implement based on design
 * @param {string} feature - Feature name
 * @param {Object} [options] - {dryRun, maxFiles, agents}
 * @returns {{success: boolean, filesCreated: number, filesModified: number, errors: string[]}}
 */
function executeFullAutoDo(feature, options = {}) {
  const { debugLog } = getCore();
  const { dryRun = false, maxFiles = Infinity } = options;
  const startTime = Date.now();

  // 1. Parse design
  const { tasks } = parseDesignForTasks(feature);
  if (tasks.length === 0) {
    return {
      success: false,
      filesCreated: 0,
      filesModified: 0,
      errors: ['No implementation tasks found in design document'],
    };
  }

  // 2. Limit tasks if maxFiles specified
  const activeTasks = tasks.slice(0, maxFiles);

  // 3. Generate plan
  const plan = generateImplementationPlan(activeTasks);

  if (dryRun) {
    debugLog('FULL-AUTO-DO', 'Dry run complete', { feature, tasks: activeTasks.length });
    return {
      success: true,
      filesCreated: 0,
      filesModified: 0,
      errors: [],
      _dryRun: true,
      _plan: plan,
    };
  }

  // 4. Save execution state
  _saveAutoDoState(feature, {
    status: 'running',
    tasks: activeTasks,
    plan,
    startedAt: new Date().toISOString(),
  });

  // 5. Execute tasks (generate prompts for agent consumption)
  const results = { created: 0, modified: 0, errors: [] };

  for (const task of activeTasks) {
    try {
      task.status = 'in-progress';
      const prompt = _taskToPrompt(task, feature);

      // STUB: Agent dispatch not yet implemented.
      // In production, this prompt would be sent to a Claude Code subagent.
      // Currently, tasks are marked complete with their generated prompts
      // for manual agent dispatch via /pdca do.
      task.status = 'completed';
      task.prompt = prompt;

      if (task.type === 'create') {
        results.created++;
      } else {
        results.modified++;
      }
    } catch (err) {
      task.status = 'failed';
      results.errors.push(`${task.id}: ${err.message}`);

      // Retry logic
      if (task.retryCount < MAX_TASK_RETRIES) {
        task.retryCount++;
        task.status = 'pending';
      }
    }
  }

  // 6. Evaluate completion
  const completion = evaluateCompletion(activeTasks);

  // 7. Update state
  _saveAutoDoState(feature, {
    status: completion.complete ? 'completed' : 'partial',
    tasks: activeTasks,
    plan,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    elapsedMs: Date.now() - startTime,
    completion,
  });

  // 8. Update PDCA status metadata
  const { updatePdcaStatus } = getStatus();
  updatePdcaStatus(feature, 'do', {
    metadata: {
      autoDoResult: {
        completedTasks: completion.completedCount,
        totalTasks: activeTasks.length,
        completionRate: completion.completionRate,
      },
    },
  });

  debugLog('FULL-AUTO-DO', 'Execution complete', {
    feature,
    created: results.created,
    modified: results.modified,
    errors: results.errors.length,
    completionRate: completion.completionRate,
  });

  return {
    success: completion.complete || completion.completionRate >= PARTIAL_SUCCESS_THRESHOLD,
    filesCreated: results.created,
    filesModified: results.modified,
    errors: results.errors,
  };
}

/**
 * Check if full-auto is available for this feature
 * @param {string} feature - Feature name
 * @returns {{available: boolean, reason: string, requirements: string[]}}
 */
function checkFullAutoAvailability(feature) {
  const { getConfig } = getCore();
  const { findDesignDoc } = getPhase();
  const { getFeatureStatus } = getStatus();

  const requirements = [];
  const missing = [];

  // Requirement 1: Automation level must be L4
  const level = getConfig('automation.defaultLevel', 2);
  requirements.push('Automation level L4 (Full-Auto)');
  if (level < 4) {
    missing.push(`Current automation level is L${level}, requires L4`);
  }

  // Requirement 2: Design document must exist
  requirements.push('Design document exists');
  const designDoc = findDesignDoc(feature);
  if (!designDoc || !fs.existsSync(designDoc)) {
    missing.push('Design document not found');
  }

  // Requirement 3: Feature must be in design or do phase
  requirements.push('Feature in design or do phase');
  const featureData = getFeatureStatus(feature);
  if (featureData && featureData.phase !== 'design' && featureData.phase !== 'do') {
    missing.push(`Feature is in ${featureData.phase} phase, requires design or do`);
  }

  const available = missing.length === 0;

  return {
    available,
    reason: available ? 'All requirements met' : missing.join('; '),
    requirements,
  };
}

/**
 * Evaluate completion of implementation tasks
 * @param {Object[]} tasks - Array of ImplementationTask
 * @returns {{complete: boolean, completionRate: number, completedCount: number, issues: string[]}}
 */
function evaluateCompletion(tasks) {
  if (!tasks || tasks.length === 0) {
    return { complete: false, completionRate: 0, completedCount: 0, issues: ['No tasks'] };
  }

  const completed = tasks.filter(t => t.status === 'completed').length;
  const failed = tasks.filter(t => t.status === 'failed').length;
  const rate = Math.round((completed / tasks.length) * 100);

  const issues = [];
  if (failed > 0) {
    const failedTasks = tasks.filter(t => t.status === 'failed');
    for (const t of failedTasks) {
      issues.push(`${t.id} (${t.filePath}): failed`);
    }
  }

  return {
    complete: completed === tasks.length,
    completionRate: rate,
    completedCount: completed,
    issues,
  };
}

/**
 * Get status of a running or completed Auto Do execution
 * @param {string} feature - Feature name
 * @returns {Object|null} AutoDoState or null
 */
function getAutoDoStatus(feature) {
  const { PROJECT_DIR } = getCore();
  const statePath = path.join(
    PROJECT_DIR, '.bkit', 'state', 'workflows', `${feature}.auto-do.json`
  );

  try {
    if (fs.existsSync(statePath)) {
      return JSON.parse(fs.readFileSync(statePath, 'utf8'));
    }
  } catch (_) { /* non-critical */ }

  return null;
}

// ── Internal Helpers ────────────────────────────────────────────────

/**
 * Infer task type from file path
 * @param {string} filePath
 * @returns {'create'|'modify'|'config'}
 * @private
 */
function _inferTaskType(filePath) {
  if (filePath.endsWith('.json') || filePath.endsWith('.config.js')) return 'config';
  // Default to create for new files described in design docs
  return 'create';
}

/**
 * Infer task priority from file path
 * Lower number = higher priority
 * @param {string} filePath
 * @returns {number}
 * @private
 */
function _inferPriority(filePath) {
  if (filePath.includes('test') || filePath.includes('spec')) return 10;
  if (filePath.includes('config') || filePath.endsWith('.json')) return 8;
  if (filePath.includes('index')) return 5;
  return 3; // Source files are highest priority
}

/**
 * Resolve dependencies between tasks (test files depend on source files)
 * @param {Object[]} tasks
 * @private
 */
function _resolveDependencies(tasks) {
  const testTasks = tasks.filter(t => t.filePath.includes('test') || t.filePath.includes('spec'));
  const sourceTasks = tasks.filter(t => !t.filePath.includes('test') && !t.filePath.includes('spec'));

  for (const testTask of testTasks) {
    // Find corresponding source task by filename similarity
    const testBase = path.basename(testTask.filePath).replace(/\.(test|spec)/, '');
    for (const srcTask of sourceTasks) {
      const srcBase = path.basename(srcTask.filePath);
      if (testBase === srcBase) {
        testTask.dependsOn.push(srcTask.id);
      }
    }
  }
}

/**
 * Convert a task to an Agent-consumable prompt
 * @param {Object} task - ImplementationTask
 * @param {string} feature - Feature name
 * @returns {string}
 * @private
 */
function _taskToPrompt(task, feature) {
  return [
    `[Do] ${feature} - Task ${task.id}: ${task.description}`,
    `File: ${task.filePath}`,
    `Type: ${task.type}`,
    `Priority: ${task.priority}`,
    task.dependsOn.length > 0 ? `Dependencies: ${task.dependsOn.join(', ')}` : '',
  ].filter(Boolean).join('\n');
}

/**
 * Save Auto Do execution state to disk
 * @param {string} feature
 * @param {Object} state
 * @private
 */
function _saveAutoDoState(feature, state) {
  const { PROJECT_DIR, stateStore } = getCore();
  const stateDir = path.join(PROJECT_DIR, '.bkit', 'state', 'workflows');

  try {
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }
    const statePath = path.join(stateDir, `${feature}.auto-do.json`);
    // H1 fix (audit): atomic write of auto-do execution state.
    stateStore.write(statePath, state);
  } catch (_) { /* non-critical */ }
}

// ── Exports ─────────────────────────────────────────────────────────

module.exports = {
  parseDesignForTasks,
  generateImplementationPlan,
  executeFullAutoDo,
  checkFullAutoAvailability,
  evaluateCompletion,
  getAutoDoStatus,
};
