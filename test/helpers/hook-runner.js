/**
 * Hook Runner — Execute hook scripts as child processes for behavioral testing
 * @module test/helpers/hook-runner
 *
 * Design Ref: §3.2.1 — hook-runner.js
 * Spawns hook scripts with JSON stdin and captures JSON stdout for assertion.
 */
'use strict';

const { execSync, execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '../..');

/**
 * Run a hook script with stdin JSON payload
 * @param {string} scriptPath - Relative path from project root (e.g., 'scripts/unified-stop.js')
 * @param {Object} stdinPayload - Object to pipe as JSON to stdin
 * @param {Object} [options]
 * @param {Object} [options.env] - Extra env vars (merged with process.env)
 * @param {number} [options.timeout=5000] - Timeout in ms
 * @returns {{ exitCode: number, stdout: any, stderr: string, duration: number }}
 */
function runHook(scriptPath, stdinPayload = {}, options = {}) {
  const fullPath = path.resolve(ROOT, scriptPath);
  const timeout = options.timeout || 5000;
  const env = {
    ...process.env,
    CLAUDE_PLUGIN_ROOT: ROOT,
    BKIT_ROOT: ROOT,
    ...(options.env || {}),
  };

  const input = JSON.stringify(stdinPayload);
  const start = Date.now();
  let stdout, stderr, exitCode;

  try {
    stdout = execFileSync(process.execPath, [fullPath], {
      input,
      timeout,
      env,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || ROOT,
    });
    exitCode = 0;
    stderr = '';
  } catch (err) {
    exitCode = err.status || 1;
    stdout = err.stdout || '';
    stderr = err.stderr || '';
  }

  const duration = Date.now() - start;

  // Try to parse stdout as JSON
  let parsed;
  try {
    parsed = JSON.parse(stdout.trim());
  } catch (_) {
    parsed = stdout.trim();
  }

  return { exitCode, stdout: parsed, stderr, duration };
}

/**
 * Run a hook script and expect specific exit code
 * @param {string} scriptPath
 * @param {Object} stdinPayload
 * @param {number} expectedExit
 * @param {Object} [options]
 * @returns {{ exitCode: number, stdout: any, stderr: string, duration: number }}
 */
function runHookExpect(scriptPath, stdinPayload, expectedExit, options = {}) {
  const result = runHook(scriptPath, stdinPayload, options);
  if (result.exitCode !== expectedExit) {
    throw new Error(
      `Hook ${scriptPath}: expected exit ${expectedExit}, got ${result.exitCode}` +
      `\nstdout: ${JSON.stringify(result.stdout).slice(0, 200)}` +
      `\nstderr: ${result.stderr.slice(0, 200)}`
    );
  }
  return result;
}

module.exports = { runHook, runHookExpect, ROOT };
