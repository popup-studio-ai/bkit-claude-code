/**
 * @module lib/pdca/workflow-parser
 * @version 2.1.12
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ── Constants ──────────────────────────────────────────────────────────────

const REQUIRED_WORKFLOW_FIELDS = ['id', 'name', 'version', 'description', 'steps', 'defaults'];
const REQUIRED_STEP_FIELDS = ['phase', 'type'];
const VALID_STEP_TYPES = ['sequential', 'parallel', 'gate'];
const VALID_APPROVAL_TYPES = ['user', 'auto', 'conditional'];
const VALID_MERGE_STRATEGIES = ['all', 'any', 'majority'];
const VALID_PHASES = ['idle', 'pm', 'plan', 'design', 'do', 'check', 'act', 'report', 'archived'];
const VALID_AUTOMATION_LEVELS = ['guide', 'semi-auto', 'full-auto'];

const WORKFLOW_DIR_PROJECT = '.bkit/workflows';
const WORKFLOW_DIR_BUNDLE = 'lib/pdca/workflows';

// ── Lightweight YAML Parser ────────────────────────────────────────────────

/**
 * Parse a simple YAML string into a JavaScript object.
 * Handles the subset used by workflow files:
 * - Key-value pairs
 * - Arrays (- item)
 * - Nested objects (indentation-based)
 * - String values (with/without quotes)
 * - Number and boolean values
 * - Comments (#)
 *
 * Does NOT support: anchors, aliases, multi-line strings (|, >), tags, complex types.
 *
 * @param {string} yamlString - YAML content to parse
 * @returns {Object} Parsed JavaScript object
 */
function parseWorkflowYaml(yamlString) {
  if (!yamlString || typeof yamlString !== 'string') {
    throw new Error('parseWorkflowYaml: input must be a non-empty string');
  }

  const lines = yamlString.split(/\r?\n/);
  const root = {};
  const stack = [{ indent: -1, obj: root, isArray: false }];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;

    // Remove comments (but not inside quoted strings)
    const line = removeComment(rawLine);

    // Skip empty lines
    if (line.trim() === '') continue;

    const indent = getIndent(line);
    const content = line.trim();

    // Pop stack to find correct parent
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1];

    // Array item: "- value" or "- key: value"
    if (content.startsWith('- ')) {
      const itemContent = content.substring(2).trim();

      // Ensure parent has an array to push into
      if (!parent.arrayKey) {
        throw new Error(`Line ${lineNum}: Array item without array context`);
      }

      const targetArray = parent.obj[parent.arrayKey];

      // "- key: value" (object in array)
      if (itemContent.includes(':')) {
        const colonIdx = itemContent.indexOf(':');
        const key = itemContent.substring(0, colonIdx).trim();
        const val = itemContent.substring(colonIdx + 1).trim();

        if (val === '') {
          // Object start inside array
          const newObj = {};
          newObj[key] = {};
          targetArray.push(newObj);
          stack.push({ indent, obj: newObj[key], isArray: false });
        } else {
          const newObj = {};
          newObj[key] = parseValue(val);
          targetArray.push(newObj);
          stack.push({ indent, obj: newObj, isArray: false });
        }
      } else {
        // Simple array item: "- value"
        targetArray.push(parseValue(itemContent));
      }
      continue;
    }

    // Key-value pair: "key: value" or "key:"
    const colonIdx = content.indexOf(':');
    if (colonIdx === -1) {
      // Continuation or invalid line — skip
      continue;
    }

    const key = content.substring(0, colonIdx).trim();
    const rawVal = content.substring(colonIdx + 1).trim();

    if (rawVal === '') {
      // Could be a nested object or array
      // Peek at next non-empty line to determine
      const nextContent = peekNextContent(lines, i + 1);

      if (nextContent && nextContent.trim().startsWith('- ')) {
        // It's an array
        parent.obj[key] = [];
        stack.push({ indent, obj: parent.obj, isArray: true, arrayKey: key });
      } else {
        // It's a nested object
        parent.obj[key] = {};
        stack.push({ indent, obj: parent.obj[key], isArray: false });
      }
    } else {
      // Simple key-value
      parent.obj[key] = parseValue(rawVal);
    }
  }

  return root;
}

/**
 * Remove inline comments from a line, respecting quoted strings.
 * @param {string} line
 * @returns {string}
 */
function removeComment(line) {
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDoubleQuote) inSingleQuote = !inSingleQuote;
    else if (ch === '"' && !inSingleQuote) inDoubleQuote = !inDoubleQuote;
    else if (ch === '#' && !inSingleQuote && !inDoubleQuote) {
      // Check if preceded by space or is at start of content
      if (i === 0 || line[i - 1] === ' ') {
        return line.substring(0, i);
      }
    }
  }
  return line;
}

/**
 * Get indentation level of a line (number of leading spaces).
 * @param {string} line
 * @returns {number}
 */
function getIndent(line) {
  let count = 0;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === ' ') count++;
    else break;
  }
  return count;
}

/**
 * Peek at the next non-empty, non-comment content line.
 * @param {string[]} lines
 * @param {number} startIdx
 * @returns {string|null}
 */
function peekNextContent(lines, startIdx) {
  for (let i = startIdx; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed !== '' && !trimmed.startsWith('#')) {
      return lines[i];
    }
  }
  return null;
}

/**
 * Parse a YAML scalar value into its JavaScript equivalent.
 * @param {string} val - Raw string value
 * @returns {string|number|boolean|null}
 */
function parseValue(val) {
  if (val === '') return '';

  // Remove surrounding quotes
  if ((val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))) {
    return val.substring(1, val.length - 1);
  }

  // Boolean
  const lower = val.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  // Null
  if (lower === 'null' || lower === '~') return null;

  // Number (integer or float)
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);

  // String
  return val;
}

// ── Workflow Validation ────────────────────────────────────────────────────

/**
 * Validate a parsed workflow definition.
 * @param {Object} parsed - Parsed workflow object
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateWorkflow(parsed) {
  const errors = [];

  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, errors: ['Workflow definition must be an object'] };
  }

  // Check required top-level fields
  for (const field of REQUIRED_WORKFLOW_FIELDS) {
    if (!(field in parsed)) {
      errors.push(`Missing required field: "${field}"`);
    }
  }

  // Validate id
  if (parsed.id && typeof parsed.id !== 'string') {
    errors.push('Field "id" must be a string');
  }

  // Validate version
  if (parsed.version && typeof parsed.version !== 'string') {
    errors.push('Field "version" must be a string');
  }

  // Validate trigger
  if (parsed.trigger) {
    if (!parsed.trigger.type) {
      errors.push('Trigger must have a "type" field');
    } else if (!['manual', 'auto', 'condition'].includes(parsed.trigger.type)) {
      errors.push(`Invalid trigger type: "${parsed.trigger.type}". Must be: manual, auto, condition`);
    }
    if (parsed.trigger.type === 'condition' && !parsed.trigger.condition) {
      errors.push('Trigger type "condition" requires a "condition" field');
    }
  }

  // Validate steps
  if (parsed.steps && typeof parsed.steps === 'object') {
    const stepIds = Object.keys(parsed.steps);

    for (const stepId of stepIds) {
      const step = parsed.steps[stepId];
      const prefix = `Step "${stepId}"`;

      // Check required step fields
      for (const field of REQUIRED_STEP_FIELDS) {
        if (!(field in step)) {
          errors.push(`${prefix}: Missing required field "${field}"`);
        }
      }

      // Validate phase
      if (step.phase && !VALID_PHASES.includes(step.phase)) {
        errors.push(`${prefix}: Invalid phase "${step.phase}". Must be one of: ${VALID_PHASES.join(', ')}`);
      }

      // Validate type
      if (step.type && !VALID_STEP_TYPES.includes(step.type)) {
        errors.push(`${prefix}: Invalid type "${step.type}". Must be one of: ${VALID_STEP_TYPES.join(', ')}`);
      }

      // Validate gate config
      if (step.type === 'gate' && step.gate) {
        if (step.gate.approval && !VALID_APPROVAL_TYPES.includes(step.gate.approval)) {
          errors.push(`${prefix}: Invalid gate approval "${step.gate.approval}". Must be: ${VALID_APPROVAL_TYPES.join(', ')}`);
        }
        if (step.gate.approval === 'conditional' && !step.gate.autoCondition) {
          errors.push(`${prefix}: Gate approval "conditional" requires "autoCondition"`);
        }
      }

      // Validate parallel branches
      if (step.type === 'parallel') {
        if (!step.branches || !Array.isArray(step.branches)) {
          errors.push(`${prefix}: Parallel step requires "branches" array`);
        }
        if (step.mergeStrategy && !VALID_MERGE_STRATEGIES.includes(step.mergeStrategy)) {
          errors.push(`${prefix}: Invalid mergeStrategy "${step.mergeStrategy}". Must be: ${VALID_MERGE_STRATEGIES.join(', ')}`);
        }
      }

      // Validate next references
      if (step.next && typeof step.next === 'string' && !stepIds.includes(step.next)) {
        errors.push(`${prefix}: "next" references non-existent step "${step.next}"`);
      }

      // Validate conditions references
      if (step.conditions && Array.isArray(step.conditions)) {
        for (const cond of step.conditions) {
          if (cond.next && !stepIds.includes(cond.next)) {
            errors.push(`${prefix}: Condition "next" references non-existent step "${cond.next}"`);
          }
        }
      }
    }
  }

  // Validate defaults
  if (parsed.defaults) {
    const d = parsed.defaults;
    if (d.matchRateThreshold != null && (typeof d.matchRateThreshold !== 'number' || d.matchRateThreshold < 0 || d.matchRateThreshold > 100)) {
      errors.push('defaults.matchRateThreshold must be a number between 0 and 100');
    }
    if (d.maxIterations != null && (typeof d.maxIterations !== 'number' || d.maxIterations < 1)) {
      errors.push('defaults.maxIterations must be a positive number');
    }
    if (d.automationLevel && !VALID_AUTOMATION_LEVELS.includes(d.automationLevel)) {
      errors.push(`defaults.automationLevel must be one of: ${VALID_AUTOMATION_LEVELS.join(', ')}`);
    }
    if (d.staleTimeout != null && (typeof d.staleTimeout !== 'number' || d.staleTimeout < 0)) {
      errors.push('defaults.staleTimeout must be a non-negative number');
    }
  }

  return { valid: errors.length === 0, errors };
}

// ── File Operations ────────────────────────────────────────────────────────

/**
 * Load and parse a workflow file (YAML or JSON).
 * @param {string} filePath - Absolute or relative path to workflow file
 * @returns {Object} Parsed WorkflowDefinition
 * @throws {Error} If file not found or parsing fails
 */
function loadWorkflowFile(filePath) {
  const resolvedPath = path.resolve(filePath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Workflow file not found: ${resolvedPath}`);
  }

  const content = fs.readFileSync(resolvedPath, 'utf-8');
  const ext = path.extname(resolvedPath).toLowerCase();

  let parsed;
  if (ext === '.json') {
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      throw new Error(`Failed to parse JSON workflow file: ${e.message}`);
    }
  } else {
    // YAML (.yaml or .yml)
    parsed = parseWorkflowYaml(content);
  }

  const validation = validateWorkflow(parsed);
  if (!validation.valid) {
    throw new Error(`Workflow validation failed:\n  ${validation.errors.join('\n  ')}`);
  }

  return parsed;
}

/**
 * List all available workflow files from project and bundle directories.
 * @param {string} [projectRoot] - Project root directory (defaults to cwd)
 * @returns {Array<{ name: string, description: string, path: string, source: string }>}
 */
function listAvailableWorkflows(projectRoot) {
  const root = projectRoot || process.cwd();
  const results = [];
  const seen = new Set();

  // Search directories in priority order (project overrides bundle)
  const searchDirs = [
    { dir: path.join(root, WORKFLOW_DIR_PROJECT), source: 'project' },
    { dir: path.join(root, WORKFLOW_DIR_BUNDLE), source: 'bundle' },
  ];

  for (const { dir, source } of searchDirs) {
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f =>
      f.endsWith('.workflow.yaml') || f.endsWith('.workflow.yml') || f.endsWith('.workflow.json')
    );

    for (const file of files) {
      const filePath = path.join(dir, file);
      const baseName = file.replace(/\.workflow\.(yaml|yml|json)$/, '');

      if (seen.has(baseName)) continue; // Project overrides bundle
      seen.add(baseName);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const parsed = file.endsWith('.json')
          ? JSON.parse(content)
          : parseWorkflowYaml(content);

        results.push({
          name: parsed.name || baseName,
          description: parsed.description || '',
          path: filePath,
          source,
        });
      } catch (_) {
        // Skip malformed workflow files
        results.push({
          name: baseName,
          description: '(parse error)',
          path: filePath,
          source,
        });
      }
    }
  }

  return results;
}

// ── Exports ────────────────────────────────────────────────────────────────

module.exports = {
  parseWorkflowYaml,
  validateWorkflow,
  loadWorkflowFile,
  listAvailableWorkflows,

  // Exposed for testing
  _parseValue: parseValue,
  _removeComment: removeComment,
  _getIndent: getIndent,

  // Constants
  VALID_PHASES,
  VALID_STEP_TYPES,
  VALID_AUTOMATION_LEVELS,
  WORKFLOW_DIR_PROJECT,
  WORKFLOW_DIR_BUNDLE,
};
