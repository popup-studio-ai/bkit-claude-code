/**
 * bkit Vibecoding Kit - SessionStart: Context Initialization Module (v2.0.0)
 *
 * Handles Context Hierarchy, Memory Store, Import Resolver initialization,
 * and Context Fork cleanup (stale forks).
 */

const fs = require('fs');
const path = require('path');
const { BKIT_PLATFORM } = require('../../lib/core/platform');
const { detectLevel } = require('../../lib/pdca/level');
const { debugLog } = require('../../lib/core/debug');
const { initPdcaStatusIfNotExists, getPdcaStatusFull } = require('../../lib/pdca/status');
const { getBkitConfig } = require('../../lib/core/config');

// Lazy-load optional modules with graceful fallback
function safeRequire(modulePath) {
  try {
    return require(modulePath);
  } catch (e) {
    return null;
  }
}

/**
 * Run context initialization.
 * Initializes Context Hierarchy, Memory Store, Import Resolver,
 * and cleans up stale Context Forks.
 * @param {object} _input - Hook input (unused, reserved for future use)
 * @returns {{ contextHierarchy: object|null, memoryStore: object|null, importResolver: object|null, contextFork: object|null, forkEnabledSkills: Array }}
 */
function run(_input) {
  const contextHierarchy = safeRequire('../../lib/context-hierarchy.js');
  const memoryStore = safeRequire('../../lib/memory-store.js');
  const importResolver = safeRequire('../../lib/import-resolver.js');
  const contextFork = safeRequire('../../lib/context-fork.js');

  // v2.0.0: Ensure all bkit directories exist (audit/, checkpoints/, decisions/, workflows/, etc.)
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

  // v2.0.0: Trigger pdca-status auto-migration (v2 → v3 schema) if needed
  try {
    getPdcaStatusFull();
  } catch (e) {
    debugLog('SessionStart', 'PDCA status migration check failed', { error: e.message });
  }

  // Context Hierarchy initialization (FR-01)
  if (contextHierarchy) {
    try {
      contextHierarchy.clearSessionContext();
      const pdcaStatus = getPdcaStatusFull();
      contextHierarchy.setSessionContext('sessionStartedAt', new Date().toISOString());
      contextHierarchy.setSessionContext('platform', BKIT_PLATFORM);
      contextHierarchy.setSessionContext('level', detectLevel());
      if (pdcaStatus && pdcaStatus.primaryFeature) {
        contextHierarchy.setSessionContext('primaryFeature', pdcaStatus.primaryFeature);
      }
      debugLog('SessionStart', 'Session context initialized', {
        platform: BKIT_PLATFORM,
        level: detectLevel()
      });
    } catch (e) {
      debugLog('SessionStart', 'Failed to initialize session context', { error: e.message });
    }
  }

  // Memory Store initialization (FR-08)
  if (memoryStore) {
    try {
      const sessionCount = memoryStore.getMemory('sessionCount', 0);
      memoryStore.setMemory('sessionCount', sessionCount + 1);
      const previousSession = memoryStore.getMemory('lastSession', null);
      memoryStore.setMemory('lastSession', {
        startedAt: new Date().toISOString(),
        platform: BKIT_PLATFORM,
        level: detectLevel()
      });
      debugLog('SessionStart', 'Memory store initialized', {
        sessionCount: sessionCount + 1,
        hasPreviousSession: !!previousSession
      });
    } catch (e) {
      debugLog('SessionStart', 'Failed to initialize memory store', { error: e.message });
    }
  }

  // Import Resolver - Load startup context (FR-02)
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

  // Context Fork cleanup - Clear stale forks from previous session (FR-03)
  if (contextFork) {
    try {
      const activeForks = contextFork.getActiveForks();
      if (activeForks.length > 0) {
        contextFork.clearAllForks();
        debugLog('SessionStart', 'Cleared stale forks', { count: activeForks.length });
      }
    } catch (e) {
      debugLog('SessionStart', 'Failed to clear stale forks', { error: e.message });
    }
  }

  // UserPromptSubmit bug detection (FIX-03)
  let userPromptBugWarning = null;
  try {
    const hooksJsonPath = path.join(__dirname, '..', 'hooks.json');
    if (fs.existsSync(hooksJsonPath)) {
      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      if (hooksConfig.hooks?.UserPromptSubmit) {
        userPromptBugWarning = `Warning: UserPromptSubmit hook in plugins may not trigger (GitHub #20659). Workaround: Add to ~/.claude/settings.json. See docs/TROUBLESHOOTING.md`;
      }
    }
  } catch (e) {
    debugLog('SessionStart', 'UserPromptSubmit bug check failed', { error: e.message });
  }

  // Scan skills for context:fork configuration (FIX-04)
  const forkEnabledSkills = [];
  try {
    const skillsDir = path.join(__dirname, '../../skills');
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir);
      for (const skill of skills) {
        const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          const content = fs.readFileSync(skillMdPath, 'utf8');
          const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
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
    if (forkEnabledSkills.length > 0 && contextHierarchy) {
      contextHierarchy.setSessionContext('forkEnabledSkills', forkEnabledSkills);
      debugLog('SessionStart', 'Fork-enabled skills detected', { skills: forkEnabledSkills });
    }
  } catch (e) {
    debugLog('SessionStart', 'Skill fork scan failed', { error: e.message });
  }

  // Preload common imports (FIX-05)
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
    contextHierarchy,
    memoryStore,
    importResolver,
    contextFork,
    forkEnabledSkills,
    userPromptBugWarning
  };
}

module.exports = { run };
