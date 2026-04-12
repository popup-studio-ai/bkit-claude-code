/**
 * bkit - git worktree guard (#46808)
 *
 * Claude Code hooks may not fire in linked git worktrees because hook paths
 * resolve relative to the primary `.git` directory. This module detects
 * worktree context at session start, emits a stderr warning, and writes a
 * flag file that downstream bkit tooling can surface to the user.
 *
 * Linked worktree heuristic: `git rev-parse --git-dir` differs from
 * `git rev-parse --git-common-dir` (both resolved absolute).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function safeGit(args, cwd) {
  try {
    return execSync(`git ${args}`, {
      cwd,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

/**
 * Inspect the current git context.
 * @param {string} [cwd]
 * @returns {{ isWorktree: boolean, toplevel: string|null, gitDir: string|null, gitCommonDir: string|null }}
 */
function inspectWorktree(cwd = process.cwd()) {
  const toplevel = safeGit('rev-parse --show-toplevel', cwd);
  const gitDir = safeGit('rev-parse --git-dir', cwd);
  const gitCommonDir = safeGit('rev-parse --git-common-dir', cwd);
  if (!toplevel || !gitDir || !gitCommonDir) {
    return { isWorktree: false, toplevel, gitDir, gitCommonDir };
  }
  const absGitDir = path.resolve(toplevel, gitDir);
  const absCommon = path.resolve(toplevel, gitCommonDir);
  return {
    isWorktree: absGitDir !== absCommon,
    toplevel,
    gitDir: absGitDir,
    gitCommonDir: absCommon,
  };
}

/**
 * Detect + warn + write flag file. Idempotent, never throws.
 * @param {string} [cwd]
 * @returns {{ isWorktree: boolean, flagPath?: string }}
 */
function detectAndWarn(cwd = process.cwd()) {
  const info = inspectWorktree(cwd);
  if (!info.isWorktree) return info;

  const flagPath = path.join(cwd, '.bkit', 'runtime', 'worktree-warning.flag');
  const payload = {
    detectedAt: new Date().toISOString(),
    toplevel: info.toplevel,
    gitDir: info.gitDir,
    gitCommonDir: info.gitCommonDir,
    issue: 'https://github.com/anthropics/claude-code/issues/46808',
    message:
      'git worktree detected — Claude Code hooks may not fire (issue #46808). ' +
      'Run bkit from the primary repository if hook-driven automation is required.',
  };
  try {
    fs.mkdirSync(path.dirname(flagPath), { recursive: true });
    fs.writeFileSync(flagPath, JSON.stringify(payload, null, 2));
    process.stderr.write(
      `\n[bkit] WARNING: git worktree detected (#46808) — hooks may not fire. See ${flagPath}\n`,
    );
  } catch {
    // Non-fatal: flag file is advisory.
  }

  return { ...info, flagPath };
}

module.exports = { inspectWorktree, detectAndWarn };
