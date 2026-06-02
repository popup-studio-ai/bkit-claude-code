/**
 * bkit Vibecoding Kit - SessionStart: Context Initialization Module
 *
 * Initializes session-level context that survives only within this process:
 *   1. ensureBkitDirs — audit/, checkpoints/, decisions/, workflows/, etc.
 *   2. git worktree guard (#46808) — flag linked worktrees where hooks may not fire
 *   3. PDCA status init + v2→v3 schema auto-migration
 *   4. Import Resolver — preload startup imports from bkit.config.json
 *   5. UserPromptSubmit bug detection (GitHub #20659)
 *   6. Fork-enabled skill scan (context: fork frontmatter)
 *   7. Import preload availability check
 *
 * v2.1.13 cleanup (관점 1-2 B2): Removed safeRequire calls + dependent blocks
 * for three modules deleted in commit 21d35d6 (2026-04-08, v2.1.1 S1 cleanup):
 *   - lib/context-hierarchy.js   → session context blob; never reintroduced.
 *   - lib/memory-store.js        → simple key-value memory; never reintroduced.
 *   - lib/context-fork.js        → fork lifecycle manager; agent system replaced it.
 * The previous lazy safeRequire pattern silently swallowed null returns, leaving
 * three `if (mod) { ... }` blocks as permanently dead code. The fork-enabled
 * skill scan (FIX-04) still runs since it only collected metadata; it no longer
 * persists to a missing context store.
 *
 * @module hooks/startup/context-init
 * @version 2.1.13
 */

const fs = require('fs');
const path = require('path');
const { BKIT_PLATFORM } = require('../../lib/core/platform');
const { detectLevel } = require('../../lib/pdca/level');
const { debugLog } = require('../../lib/core/debug');
const { initPdcaStatusIfNotExists, getPdcaStatusFull } = require('../../lib/pdca/status');
const { getBkitConfig } = require('../../lib/core/config');

/**
 * Lazy-load optional modules with graceful fallback.
 * Retained for `lib/import-resolver.js` which is the only optional dependency
 * remaining after the v2.1.1 S1 cleanup (commit 21d35d6).
 */
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (e) {
    return null;
  }
}

/**
 * Run context initialization.
 * @param {object} _input - Hook input (unused, reserved for future use)
 * @returns {{
 *   importResolver: object|null,
 *   forkEnabledSkills: Array<{name:string, mergeResult:boolean}>,
 *   userPromptBugWarning: string|null
 * }}
 */
function run(_input) {
  const importResolver = safeRequire('../../lib/import-resolver.js');

  // Ensure all bkit directories exist (audit/, checkpoints/, decisions/, workflows/, etc.)
  try {
    const { ensureBkitDirs } = require('../../lib/core/paths');
    ensureBkitDirs();
  } catch (e) {
    debugLog('SessionStart', 'ensureBkitDirs failed', { error: e.message });
  }

  // #46808: git worktree guard — detect linked worktrees where CC hooks may
  // not fire and surface a warning + flag file for downstream tooling.
  try {
    const { detectAndWarn } = require('../../lib/core/worktree-detector');
    const info = detectAndWarn();
    if (info && info.isWorktree) {
      debugLog('SessionStart', 'git worktree detected (#46808)', {
        gitDir: info.gitDir,
        gitCommonDir: info.gitCommonDir,
      });
    }
  } catch (e) {
    debugLog('SessionStart', 'worktree-detector failed', { error: e.message });
  }

  // Initialize PDCA status file if not exists
  initPdcaStatusIfNotExists();

  // Trigger pdca-status auto-migration (v2 → v3 schema) if needed
  try {
    getPdcaStatusFull();
  } catch (e) {
    debugLog('SessionStart', 'PDCA status migration check failed', { error: e.message });
  }

  // Import Resolver — Load startup context (FR-02)
  if (importResolver) {
    try {
      const config = getBkitConfig();
      const startupImports = config.startupImports || [];
      if (startupImports.length > 0) {
        const { CONFIG_PATHS } = require('../../lib/core/paths');
        const { content, errors } = importResolver.resolveImports(
          { imports: startupImports },
          CONFIG_PATHS.bkitConfig()
        );
        if (errors.length > 0) {
          debugLog('SessionStart', 'Startup import errors', { errors });
        }
        if (content) {
          debugLog('SessionStart', 'Startup imports loaded', {
            importCount: startupImports.length,
            contentLength: content.length
          });
        }
      }
    } catch (e) {
      debugLog('SessionStart', 'Failed to load startup imports', { error: e.message });
    }
  }

  // UserPromptSubmit bug detection (FIX-03, GitHub #20659)
  let userPromptBugWarning = null;
  try {
    const hooksJsonPath = path.join(__dirname, '..', 'hooks.json');
    if (fs.existsSync(hooksJsonPath)) {
      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      if (hooksConfig.hooks?.UserPromptSubmit) {
        userPromptBugWarning = 'Warning: UserPromptSubmit hook in plugins may not trigger (GitHub #20659). Workaround: Add to ~/.claude/settings.json. See docs/TROUBLESHOOTING.md';
      }
    }
  } catch (e) {
    debugLog('SessionStart', 'UserPromptSubmit bug check failed', { error: e.message });
  }

  // Scan skills for context:fork configuration (FIX-04)
  // Collected for downstream tooling (debug logging + future consumers).
  // Prior to v2.1.13, this list was persisted to lib/context-hierarchy.js
  // (deleted in v2.1.1 S1 cleanup). It is now returned to caller only.
  const forkEnabledSkills = [];
  try {
    const skillsDir = path.join(__dirname, '../../skills');
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir);
      for (const skill of skills) {
        const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          const content = fs.readFileSync(skillMdPath, 'utf8');
          const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
          if (frontmatterMatch) {
            const frontmatter = frontmatterMatch[1];
            if (frontmatter.includes('context: fork') || frontmatter.includes('context:fork')) {
              const mergeResult = !frontmatter.includes('mergeResult: false');
              forkEnabledSkills.push({ name: skill, mergeResult });
            }
          }
        }
      }
    }
    if (forkEnabledSkills.length > 0) {
      debugLog('SessionStart', 'Fork-enabled skills detected', { skills: forkEnabledSkills });
    }
  } catch (e) {
    debugLog('SessionStart', 'Skill fork scan failed', { error: e.message });
  }

  // Preload common imports (FIX-05) — availability check only
  if (importResolver) {
    const commonImports = [
      '${PLUGIN_ROOT}/templates/shared/api-patterns.md',
      '${PLUGIN_ROOT}/templates/shared/error-handling.md'
    ];
    let loadedCount = 0;
    for (const importPath of commonImports) {
      try {
        const resolved = importPath.replace('${PLUGIN_ROOT}', path.join(__dirname, '../..'));
        if (fs.existsSync(resolved)) {
          loadedCount++;
        }
      } catch (e) {
        // Ignore individual import errors
      }
    }
    debugLog('SessionStart', 'Import preload check', { available: loadedCount, total: commonImports.length });
  }

  return {
    importResolver,
    forkEnabledSkills,
    userPromptBugWarning
  };
}

module.exports = { run };
