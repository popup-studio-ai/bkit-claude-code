#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v1.6.0)
 * Dedicated plugin for Claude Code
 *
 * v1.5.7 Changes:
 * - /simplify PDCA Integration: Check ≥90% → /simplify → Report flow (ENH-52)
 * - /batch Multi-Feature PDCA: Enterprise parallel feature processing (ENH-53)
 * - HTTP Hooks Awareness: type "http" documentation and guidance (ENH-54)
 * - CC Built-in Command Triggers: simplify/batch 8-language patterns (ENH-55)
 * - CC recommended version: v2.1.59 -> v2.1.63
 *
 * v1.5.6 Changes:
 * - Auto-Memory Integration: CC auto-memory status + /memory guidance (ENH-48)
 * - /copy Command Guidance: skill completion copy hints (ENH-49)
 * - CTO Team Memory Guide: multi-agent memory best practices (ENH-50)
 * - Remote Control Compatibility: pre-check documentation (ENH-51)
 * - CC recommended version: v2.1.42 -> v2.1.59
 *
 * v1.5.5 Changes:
 * - Plan Plus skill: brainstorming-enhanced PDCA planning (community PR #34)
 * - Skills 26 -> 27, Templates 27 -> 28
 * - README duplicate Skills rows fix (community PR #33)
 *
 * v1.5.4 Changes:
 * - bkend MCP accuracy fix: 19 -> 28+ tools, accurate tool names
 * - session-start.js: bkend MCP check Dynamic -> Dynamic+Enterprise
 * - Version sync to v1.5.4 across all config files
 *
 * v1.5.7 Changes:
 * - /simplify + /batch PDCA integration (CC v2.1.63 built-in commands)
 * - CC_COMMAND_PATTERNS 8-language CC command awareness
 * - HTTP hooks awareness and documentation
 * - English conversion for 3 stop scripts
 *
 * v1.5.6 Changes:
 * - CC v2.1.59 auto-memory integration
 * - ENH-48~51 enhancements (/copy guidance, multi-agent guide)
 * - 182 exports (common.js bridge)
 *
 * v1.5.3 Changes:
 * - Output Styles plugin.json integration + output-style-setup command
 * - bkend docs live reference (WebFetch)
 * - Version sync to v1.5.3 across all config files
 *
 * v1.5.2 Changes:
 * - Agent Teams detection and Team Mode integration
 * - Claude Code v2.1.33 compatibility enhancements
 *
 * v1.5.0 Changes:
 * - Remove Gemini CLI support (simplified to Claude Code only)
 *
 * v1.4.7 Changes:
 * - Task Management + PDCA Integration (Task Chain Auto-Creation)
 * - Core Modularization: lib/common.js split into lib/core/, lib/pdca/, lib/intent/, lib/task/
 * - 22 new module files, 132 function exports
 * - Check↔Act Iteration with automatic improvement cycles
 * - Full-Auto Mode support (manual/semi-auto/full-auto)
 *
 * v1.4.7 Changes:
 * - Added /pdca archive action for PDCA cycle completion
 * - 8-language trigger completion (ES, FR, DE, IT added)
 * - Korean to English translation (internationalization)
 * - /bkit:functions command for skills discoverability
 *
 * v1.4.4 Changes:
 * - Updated bkit feature report to use Skills instead of deprecated Commands
 * - All commands migrated to Skills (see commands/DEPRECATED.md)
 *
 * v1.4.3 Changes:
 * - Applied xmlSafeOutput to dynamic content for Gemini CLI v0.26+ (ISSUE-001)
 *
 * v1.4.2 Changes:
 * - Added session context initialization (FR-01)
 * - Multi-Level Context Hierarchy support
 * - UserPromptSubmit plugin bug detection (GitHub #20659)
 * - Skill fork configuration scanning
 * - Import preloading for performance
 *
 * v1.4.1 Changes:
 * - Added bkit feature usage report rule (Response Report Rule)
 * - All responses must include feature usage summary
 *
 * v1.4.0 Changes:
 * - Added PDCA status initialization
 * - Using debugLog from common.js
 *
 * Converted from: hooks/session-start.sh
 * Platform: Windows, macOS, Linux
 */

const fs = require('fs');
const path = require('path');
const {
  BKIT_PLATFORM,
  detectLevel,
  debugLog,
  initPdcaStatusIfNotExists,
  getPdcaStatusFull,
  // v1.4.0 Automation Functions
  emitUserPrompt,
  detectNewFeatureIntent,
  matchImplicitAgentTrigger,
  matchImplicitSkillTrigger,
  getBkitConfig,
  // v1.4.0 P2: Ambiguity Detection Integration
  calculateAmbiguityScore,
  generateClarifyingQuestions,
} = require('../lib/common.js');

// v1.4.2: Context Hierarchy (FR-01)
let contextHierarchy;
try {
  contextHierarchy = require('../lib/context-hierarchy.js');
} catch (e) {
  // Fallback if module not available
  contextHierarchy = null;
}

// v1.4.2: Memory Store (FR-08)
let memoryStore;
try {
  memoryStore = require('../lib/memory-store.js');
} catch (e) {
  // Fallback if module not available
  memoryStore = null;
}

// v1.4.2: Import Resolver (FR-02)
let importResolver;
try {
  importResolver = require('../lib/import-resolver.js');
} catch (e) {
  // Fallback if module not available
  importResolver = null;
}

// v1.6.0: Context Fork (FR-03) - DEPRECATED, kept for backward compatibility
// Use CC native context:fork in agent/skill frontmatter instead (ENH-85)
let contextFork;
try {
  contextFork = require('../lib/context-fork.js');
} catch (e) {
  contextFork = null; // OK - native context:fork handles this
}

// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

// v1.5.9: Auto-migration from docs/ flat paths to .bkit/ structured paths
try {
  const { STATE_PATHS, LEGACY_PATHS, ensureBkitDirs } = require('../lib/core/paths');
  ensureBkitDirs();

  const migrations = [
    { from: LEGACY_PATHS.pdcaStatus(), to: STATE_PATHS.pdcaStatus(), name: 'pdca-status', type: 'file' },
    { from: LEGACY_PATHS.memory(), to: STATE_PATHS.memory(), name: 'memory', type: 'file' },
    { from: LEGACY_PATHS.agentState(), to: STATE_PATHS.agentState(), name: 'agent-state', type: 'file' },
    { from: LEGACY_PATHS.snapshots(), to: STATE_PATHS.snapshots(), name: 'snapshots', type: 'directory' },
  ];

  for (const m of migrations) {
    try {
      if (!fs.existsSync(m.from)) continue;

      if (m.type === 'directory' && fs.existsSync(m.to)) {
        if (fs.readdirSync(m.to).length > 0) continue;
        fs.rmdirSync(m.to);
      } else if (fs.existsSync(m.to)) {
        continue;
      }

      try {
        fs.renameSync(m.from, m.to);
      } catch (renameErr) {
        if (renameErr.code === 'EXDEV') {
          if (m.type === 'directory') {
            fs.cpSync(m.from, m.to, { recursive: true });
          } else {
            fs.copyFileSync(m.from, m.to);
          }
          fs.rmSync(m.from, { recursive: true, force: true });
        } else {
          throw renameErr;
        }
      }
      debugLog('SessionStart', `Migrated ${m.name}`, { from: m.from, to: m.to });
    } catch (fileErr) {
      debugLog('SessionStart', `Migration failed: ${m.name}`, { error: fileErr.message });
    }
  }
} catch (e) {
  debugLog('SessionStart', 'Path migration skipped', { error: e.message });
}

// Initialize PDCA status file if not exists
initPdcaStatusIfNotExists();

// v1.4.2: Initialize session context (FR-01)
if (contextHierarchy) {
  try {
    // Clear any stale session context from previous session
    contextHierarchy.clearSessionContext();

    // Set initial session values
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

// v1.4.2: Memory Store Integration (FR-08)
if (memoryStore) {
  try {
    // Track session count
    const sessionCount = memoryStore.getMemory('sessionCount', 0);
    memoryStore.setMemory('sessionCount', sessionCount + 1);

    // Store session info
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

// v1.4.2: Import Resolver Integration (FR-02) - Load startup context
if (importResolver) {
  try {
    const config = getBkitConfig();
    const startupImports = config.startupImports || [];

    if (startupImports.length > 0) {
      const { CONFIG_PATHS } = require('../lib/core/paths');
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

// v1.4.2: Context Fork Cleanup (FR-03) - Clear stale forks from previous session
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

// v1.4.2 FIX-03: UserPromptSubmit Plugin Bug Detection (GitHub #20659)
function checkUserPromptSubmitBug() {
  // Check if UserPromptSubmit is registered in plugin hooks but may not work
  const hooksJsonPath = path.join(__dirname, 'hooks.json');
  try {
    if (fs.existsSync(hooksJsonPath)) {
      const hooksConfig = JSON.parse(fs.readFileSync(hooksJsonPath, 'utf8'));
      if (hooksConfig.hooks?.UserPromptSubmit) {
        // Plugin has UserPromptSubmit - warn about potential bug
        return `⚠️ Known Issue: UserPromptSubmit hook in plugins may not trigger (GitHub #20659). Workaround: Add to ~/.claude/settings.json. See docs/TROUBLESHOOTING.md`;
      }
    }
  } catch (e) {
    debugLog('SessionStart', 'UserPromptSubmit bug check failed', { error: e.message });
  }
  return null;
}

// v1.4.2 FIX-04: Scan Skills for context:fork Configuration
function scanSkillsForForkConfig() {
  const skillsDir = path.join(__dirname, '../skills');
  const forkEnabledSkills = [];

  try {
    if (fs.existsSync(skillsDir)) {
      const skills = fs.readdirSync(skillsDir);
      for (const skill of skills) {
        const skillMdPath = path.join(skillsDir, skill, 'SKILL.md');
        if (fs.existsSync(skillMdPath)) {
          const content = fs.readFileSync(skillMdPath, 'utf8');
          // Check for context: fork in frontmatter
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

  return forkEnabledSkills;
}

// v1.4.2 FIX-05: Preload Common Imports for Performance
function preloadCommonImports() {
  if (!importResolver) return;

  const commonImports = [
    '${PLUGIN_ROOT}/templates/shared/api-patterns.md',
    '${PLUGIN_ROOT}/templates/shared/error-handling.md'
  ];

  let loadedCount = 0;
  for (const importPath of commonImports) {
    try {
      const resolved = importPath.replace('${PLUGIN_ROOT}', path.join(__dirname, '..'));
      if (fs.existsSync(resolved)) {
        // Just check existence for now - actual caching happens on first use
        loadedCount++;
      }
    } catch (e) {
      // Ignore individual import errors
    }
  }

  debugLog('SessionStart', 'Import preload check', { available: loadedCount, total: commonImports.length });
}

// Execute v1.4.2 fixes
const userPromptBugWarning = checkUserPromptSubmitBug();
const forkEnabledSkills = scanSkillsForForkConfig();
preloadCommonImports();

/**
 * Detect current PDCA phase from status file
 * @returns {string} Phase number as string
 */
function detectPdcaPhase() {
  const pdcaStatus = getPdcaStatusFull();
  if (pdcaStatus && pdcaStatus.pipeline && pdcaStatus.pipeline.currentPhase) {
    return String(pdcaStatus.pipeline.currentPhase);
  }
  return '1';
}

/**
 * v1.4.0: Enhanced Onboarding with PDCA Status Check
 * Checks for existing work and generates appropriate prompts
 * @returns {object} Onboarding response data
 */
function enhancedOnboarding() {
  const pdcaStatus = getPdcaStatusFull();
  const level = detectLevel();
  const config = getBkitConfig();

  debugLog('SessionStart', 'Enhanced onboarding', {
    hasActiveFeatures: pdcaStatus.activeFeatures?.length > 0,
    level,
    primaryFeature: pdcaStatus.primaryFeature
  });

  // 1. Check for existing work
  if (pdcaStatus.activeFeatures && pdcaStatus.activeFeatures.length > 0) {
    const primary = pdcaStatus.primaryFeature;
    const featureData = pdcaStatus.features?.[primary];
    const phase = featureData?.phase || 'plan';
    const matchRate = featureData?.matchRate;

    // Phase display mapping
    const phaseDisplay = {
      'pm': 'PM Discovery',
      'plan': 'Plan',
      'design': 'Design',
      'do': 'Implementation',
      'check': 'Verification',
      'act': 'Improvement',
      'completed': 'Completed'
    };

    return {
      type: 'resume',
      hasExistingWork: true,
      primaryFeature: primary,
      phase: phase,
      matchRate: matchRate,
      prompt: emitUserPrompt({
        questions: [{
          question: `Previous work detected. How would you like to proceed?\nCurrent: "${primary}" - ${phaseDisplay[phase] || phase}${matchRate ? ` (${matchRate}%)` : ''}`,
          header: 'Resume',
          options: [
            { label: `Continue ${primary}`, description: `Resume ${phaseDisplay[phase] || phase} phase` },
            { label: 'Start new task', description: 'Develop a different feature' },
            { label: 'Check status', description: 'View PDCA status (/pdca status)' }
          ],
          multiSelect: false
        }]
      }),
      suggestedAction: matchRate && matchRate < 90 ? '/pdca iterate' : '/pdca status'
    };
  }

  // 2. New user onboarding
  return {
    type: 'new_user',
    hasExistingWork: false,
    level: level,
    prompt: emitUserPrompt({
      questions: [{
        question: 'How can I help you?',
        header: 'Help Type',
        options: [
          { label: 'Learn bkit', description: 'Introduction and 9-phase pipeline' },
          { label: 'Learn Claude Code', description: 'Settings and usage' },
          { label: 'Start new project', description: 'Project initialization' },
          { label: 'Start freely', description: 'Proceed without guide' }
        ],
        multiSelect: false
      }]
    })
  };
}

/**
 * v1.4.0 P2: Analyze user request for ambiguity and generate clarifying questions
 * @param {string} userRequest - User's request text
 * @param {object} context - Current context (features, phase, etc.)
 * @returns {object|null} Ambiguity analysis result or null if clear
 */
function analyzeRequestAmbiguity(userRequest, context = {}) {
  if (!userRequest || userRequest.length < 10) {
    return null;
  }

  const ambiguityResult = calculateAmbiguityScore(userRequest, context);

  debugLog('SessionStart', 'Ambiguity analysis', {
    score: ambiguityResult.score,
    factorsCount: ambiguityResult.factors.length,
    needsClarification: ambiguityResult.score >= 50
  });

  if (ambiguityResult.score >= 50 && ambiguityResult.clarifyingQuestions) {
    return {
      needsClarification: true,
      score: ambiguityResult.score,
      factors: ambiguityResult.factors,
      questions: ambiguityResult.clarifyingQuestions,
      prompt: emitUserPrompt({
        questions: ambiguityResult.clarifyingQuestions.slice(0, 2).map((q, i) => ({
          question: q,
          header: `Clarify ${i + 1}`,
          options: [
            { label: 'Yes, correct', description: 'This interpretation is correct' },
            { label: 'No', description: 'Please interpret differently' },
            { label: 'More details', description: 'I will explain in more detail' }
          ],
          multiSelect: false
        }))
      })
    };
  }

  return null;
}

/**
 * v1.4.0: Generate trigger keyword reference
 * @returns {string} Formatted trigger keyword table
 */
function getTriggerKeywordTable() {
  return `
## 🎯 v1.4.0 Auto-Trigger Keywords (8 Languages Supported)

### Agent Triggers
| Keywords | Agent | Action |
|----------|-------|--------|
| verify, 검증, 確認, 验证, verificar, vérifier, prüfen, verificare | bkit:gap-detector | Run Gap analysis |
| improve, 개선, 改善, 改进, mejorar, améliorer, verbessern, migliorare | bkit:pdca-iterator | Auto-improvement iteration |
| analyze, 분석, 分析, 品質, analizar, analyser, analysieren, analizzare | bkit:code-analyzer | Code quality analysis |
| report, 보고서, 報告, 报告, informe, rapport, Bericht, rapporto | bkit:report-generator | Generate completion report |
| help, 도움, 助けて, 帮助, ayuda, aide, Hilfe, aiuto | bkit:starter-guide | Beginner guide |
| bkend, BaaS, backend service, 백엔드 서비스, バックエンドサービス, 后端服务 | bkit:bkend-expert | Backend/BaaS expert |
| pm, PRD, product discovery, PM 분석, 제품 기획, PM分析, PM-Analyse, analisi PM | bkit:pm-lead | PM Agent Team analysis |

### Skill Triggers (Auto-detection)
| Keywords | Skill | Level |
|----------|-------|-------|
| static site, 정적 웹, sitio estático, site statique | starter | Starter |
| login, fullstack, 로그인, connexion, Anmeldung | dynamic | Dynamic |
| microservices, k8s, 마이크로서비스, microservizi | enterprise | Enterprise |
| mobile app, React Native, 모바일 앱, app mobile | mobile-app | All |

💡 Use natural language and the appropriate tool will be activated automatically.

### CC Built-in Command Integration (v1.5.9)
| Command | When to Use | PDCA Phase |
|---------|-------------|------------|
| /simplify | After Check ≥90% or code review | Check → Report |
| /batch | Multiple features need processing | Any phase (Enterprise) |
`;
}

// Persist environment variables (Claude Code only)
const envFile = process.env.CLAUDE_ENV_FILE;
if (envFile) {
  const detectedLevel = detectLevel();
  const detectedPhase = detectPdcaPhase();

  try {
    fs.appendFileSync(envFile, `export BKIT_LEVEL=${detectedLevel}\n`);
    fs.appendFileSync(envFile, `export BKIT_PDCA_PHASE=${detectedPhase}\n`);
    fs.appendFileSync(envFile, `export BKIT_PLATFORM=claude\n`);
  } catch (e) {
    // Ignore write errors
  }
}

// ============================================================
// Output Response (Claude Code only) - v1.5.0
// ============================================================

// Get enhanced onboarding data
const onboardingData = enhancedOnboarding();
const triggerTable = getTriggerKeywordTable();

// Claude Code Output: JSON with Tool Call Prompt
// Build context based on onboarding type
let additionalContext = `# bkit Vibecoding Kit v1.6.0 - Session Startup\n\n`;

  if (onboardingData.hasExistingWork) {
    additionalContext += `## 🔄 Previous Work Detected\n\n`;
    additionalContext += `- **Feature**: ${onboardingData.primaryFeature}\n`;
    additionalContext += `- **Current Phase**: ${onboardingData.phase}\n`;
    if (onboardingData.matchRate) {
      additionalContext += `- **Match Rate**: ${onboardingData.matchRate}%\n`;
    }
    additionalContext += `\n### 🚨 MANDATORY: Call AskUserQuestion on user's first message\n\n`;
    additionalContext += `${onboardingData.prompt}\n\n`;
    additionalContext += `### Actions by selection:\n`;
    additionalContext += `- **Continue ${onboardingData.primaryFeature}** → Run /pdca status then guide to next phase\n`;
    additionalContext += `- **Start new task** → Ask for new feature name then run /pdca plan\n`;
    additionalContext += `- **Check status** → Run /pdca status\n\n`;
  } else {
    additionalContext += `## 🚨 MANDATORY: Session Start Action\n\n`;
    additionalContext += `**AskUserQuestion tool** call required on user's first message.\n\n`;
    additionalContext += `${onboardingData.prompt}\n\n`;
    additionalContext += `### Actions by selection:\n`;
    additionalContext += `- **Learn bkit** → Run /development-pipeline\n`;
    additionalContext += `- **Learn Claude Code** → Run /claude-code-learning\n`;
    additionalContext += `- **Start new project** → Select level then run /starter, /dynamic, or /enterprise\n`;
    additionalContext += `- **Start freely** → General conversation mode\n\n`;
  }

  // v1.5.2: Feature Awareness - Agent Teams, Output Styles, Agent Memory
  const detectedLevel = detectLevel();

  // Agent Teams detection and suggestion
  try {
    const { isTeamModeAvailable, getTeamConfig } = require('../lib/team');
    if (isTeamModeAvailable()) {
      const teamConfig = getTeamConfig();
      additionalContext += `## CTO-Led Agent Teams (Active)\n`;
      additionalContext += `- CTO Lead: cto-lead (opus) orchestrates PDCA workflow\n`;
      additionalContext += `- Start: \`/pdca team {feature}\`\n`;
      additionalContext += `- Display mode: ${teamConfig.displayMode}\n`;
      if (detectedLevel === 'Enterprise') {
        additionalContext += `- Enterprise: 5 teammates (architect, developer, qa, reviewer, security)\n`;
        additionalContext += `- Patterns: leader → council → swarm → council → watchdog\n`;
      } else if (detectedLevel === 'Dynamic') {
        additionalContext += `- Dynamic: 3 teammates (developer, frontend, qa)\n`;
        additionalContext += `- Patterns: leader → leader → swarm → council → leader\n`;
      }
      additionalContext += `### CTO Team Stability (v1.5.9)`;
      additionalContext += `\n- CC v2.1.64+ resolved 4 memory leaks in Agent Teams`;
      additionalContext += `\n- Long sessions (>2hr) benefit from periodic /clear`;
      additionalContext += `\n- Use ctrl+f to bulk-stop background agents when done\n`;
      additionalContext += `\n`;
    } else if (detectedLevel !== 'Starter') {
      additionalContext += `## CTO-Led Agent Teams (Not Enabled)\n`;
      additionalContext += `- Your ${detectedLevel} project supports CTO-Led Agent Teams\n`;
      additionalContext += `- CTO Lead (opus) orchestrates specialized teammates for parallel PDCA\n`;
      additionalContext += `- To enable: set \`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1\` environment variable\n`;
      additionalContext += `- Then use: \`/pdca team {feature}\`\n\n`;
    }
  } catch (e) {
    debugLog('SessionStart', 'Agent Teams detection skipped', { error: e.message });
  }

  // Output Styles suggestion based on level
  const levelStyleMap = {
    'Starter': 'bkit-learning',
    'Dynamic': 'bkit-pdca-guide',
    'Enterprise': 'bkit-enterprise'
  };
  const suggestedStyle = levelStyleMap[detectedLevel] || 'bkit-pdca-guide';
  additionalContext += `## Output Styles (v1.5.9)\n`;
  additionalContext += `- Recommended for ${detectedLevel} level: \`${suggestedStyle}\`\n`;
  additionalContext += `- Change anytime with \`/output-style\`\n`;
  additionalContext += `- Available: bkit-learning, bkit-pdca-guide, bkit-enterprise, bkit-pdca-enterprise\n`;
  additionalContext += `- If styles not visible in /output-style menu, run \`/output-style-setup\`\n\n`;

  // Memory Systems (v1.5.9: auto-memory integration ENH-48)
  additionalContext += `## Memory Systems (v1.5.9)\n`;
  additionalContext += `### bkit Agent Memory (Auto-Active)\n`;
  additionalContext += `- 19 agents use project scope, 2 agents (starter-guide, pipeline-guide) use user scope\n`;
  additionalContext += `- No configuration needed\n`;
  additionalContext += `### Claude Code Auto-Memory\n`;
  additionalContext += `- Claude automatically saves useful context to \`~/.claude/projects/*/memory/MEMORY.md\`\n`;
  additionalContext += `- Manage with \`/memory\` command (view, edit, delete entries)\n`;
  additionalContext += `- bkit memory (\`.bkit/state/memory.json\`) and CC auto-memory are separate systems with no collision\n`;
  additionalContext += `- Tip: After PDCA completion, use \`/memory\` to save key learnings for future sessions\n\n`;

  // bkend MCP status check (G-09)
  if (detectedLevel === 'Dynamic' || detectedLevel === 'Enterprise') {
    try {
      const mcpJsonPath = path.join(process.cwd(), '.mcp.json');
      let bkendMcpConnected = false;
      if (fs.existsSync(mcpJsonPath)) {
        const mcpContent = fs.readFileSync(mcpJsonPath, 'utf-8');
        if (mcpContent.includes('bkend') || mcpContent.includes('api.bkend.ai')) {
          bkendMcpConnected = true;
        }
      }
      if (bkendMcpConnected) {
        additionalContext += `## bkend.ai MCP Status\n`;
        additionalContext += `- Status: Connected\n`;
        additionalContext += `- Use natural language to manage backend (DB, Auth, Storage)\n\n`;
      } else {
        additionalContext += `## bkend.ai MCP Status\n`;
        additionalContext += `- Status: Not configured\n`;
        additionalContext += `- Setup: \`claude mcp add bkend --transport http https://api.bkend.ai/mcp\`\n`;
        additionalContext += `- bkend.ai provides Database, Auth, Storage as BaaS\n\n`;
      }
    } catch (e) {
      debugLog('SessionStart', 'bkend MCP check skipped', { error: e.message });
    }
  }

  // v1.5.7: Enterprise batch workflow guidance
  if (detectedLevel === 'Enterprise') {
    try {
      const pdcaStatusForBatch = getPdcaStatusFull();
      const activeFeatures = pdcaStatusForBatch?.activeFeatures || [];
      if (activeFeatures.length >= 2) {
        additionalContext += `## Multi-Feature PDCA (v1.5.9)\n`;
        additionalContext += `- Active features: ${activeFeatures.join(', ')}\n`;
        additionalContext += `- Use \`/batch\` for parallel processing of multiple features\n`;
        additionalContext += `- Enterprise batch supports concurrent Check/Act iterations\n\n`;
      }
    } catch (e) {
      debugLog('SessionStart', 'Batch suggestion skipped', { error: e.message });
    }
  }

  additionalContext += `## PDCA Core Rules (Always Apply)\n`;
  additionalContext += `- New feature request → Check/create Plan/Design documents first\n`;
  additionalContext += `- After implementation → Suggest Gap analysis\n`;
  additionalContext += `- Gap Analysis < 90% → Auto-improvement with pdca-iterator\n`;
  additionalContext += `- Gap Analysis >= 90% → Suggest /simplify for code cleanup, then completion report\n`;
  additionalContext += `- After /simplify → Completion report with report-generator\n\n`;

  additionalContext += triggerTable;
  additionalContext += `\n\n## v1.4.0 Automation Features\n`;
  additionalContext += `- 🎯 8-language auto-detection: EN, KO, JA, ZH, ES, FR, DE, IT\n`;
  additionalContext += `- 🤖 Implicit Agent/Skill triggers\n`;
  additionalContext += `- 📊 Ambiguity detection and clarifying question generation\n`;
  additionalContext += `- 🔄 Automatic PDCA phase progression\n\n`;
  additionalContext += `💡 Important: AI Agent is not perfect. Always verify important decisions.\n`;

  // v1.5.9: Studio Support enhancements
  additionalContext += `\n## v1.5.9 Enhancements (Studio Support)\n`;
  additionalContext += `- Path Registry: centralized state file path management (lib/core/paths.js)\n`;
  additionalContext += `- State files migrated to \`.bkit/{state,runtime,snapshots}/\` structured directory\n`;
  additionalContext += `- Auto-migration from v1.5.7 legacy paths on SessionStart\n`;
  additionalContext += `- bkit memory path: \`.bkit/state/memory.json\` (was \`docs/.bkit-memory.json\`)\n`;
  additionalContext += `\n`;

  // v1.6.0: Skills 2.0 Integration (ENH-85~103)
  additionalContext += `## v1.6.0 Enhancements (Skills 2.0 Integration)\n`;
  additionalContext += `- CC recommended version: v2.1.71 (stdin freeze fix, background agent recovery)\n`;
  additionalContext += `- Skills 2.0: context:fork native, frontmatter hooks, Skill Evals, Skill Classification\n`;
  additionalContext += `- 28 skills classified: 10 Workflow / 16 Capability / 2 Hybrid\n`;
  additionalContext += `- PDCA document template validation (PostToolUse hook, ENH-103)\n`;
  additionalContext += `- Skill Creator + A/B Testing framework (evals/ directory)\n`;
  additionalContext += `- /loop + Cron PDCA auto-monitoring (CC v2.1.71+)\n`;
  additionalContext += `- Hot reload: SKILL.md changes reflect without session restart\n`;
  additionalContext += `- Wildcard permissions: \`Bash(npm *)\`, \`Bash(git log*)\` patterns\n`;
  additionalContext += `- Background agent recovery: CTO Team bg agents reliable (CC v2.1.71+)\n`;
  additionalContext += `- PM Agent Team: /pdca pm {feature} for pre-Plan product discovery (5 PM agents)\n`;
  additionalContext += `- 37 consecutive CC compatible releases (v2.1.34~v2.1.71)\n`;
  additionalContext += `\n`;

  // v1.5.7: Enhancements awareness
  additionalContext += `## v1.5.7 Enhancements\n`;
  additionalContext += `- CC v2.1.63 HTTP hooks support: \`type: "http"\` in hooks config\n`;
  additionalContext += `- 13 memory leak fixes for stable long CTO Team sessions\n`;
  additionalContext += `- /simplify integration in PDCA Check→Report flow\n`;
  if (detectedLevel === 'Enterprise') {
    additionalContext += `- /batch multi-feature PDCA for Enterprise workflows\n`;
  }
  additionalContext += `\n`;

  // ============================================================
  // v1.5.9: Executive Summary Mandatory Output Rule
  // ============================================================
  additionalContext += `

## Executive Summary Output Rule (v1.6.0 - Required after PDCA document work)

**Rule: After completing PDCA document work (/pdca plan, /pdca design, /pdca report, /plan-plus), you MUST output the Executive Summary table in your response.**

### When to output:
- After /pdca plan completes (Plan document created/updated)
- After /pdca design completes (Design document created/updated)
- After /pdca report completes (Report document created/updated)
- After /plan-plus completes (Plan Plus document created)
- After any PDCA document update that includes an Executive Summary section

### What to output:
Extract and display the Executive Summary section from the document, including:
1. **Project overview table** (Feature, dates, duration)
2. **Results summary** (Match Rate, items, files, lines)
3. **Value Delivered 4-perspective table** (Problem / Solution / Function UX Effect / Core Value)

### Why:
Users should see the summary immediately in the response without having to open the file. This is the same principle as bkit Feature Usage — mandatory inline output for key information.

### Position:
- Output Executive Summary BEFORE the bkit Feature Usage report
- Both are required: Executive Summary (after document work) + Feature Usage (always)
`;

  // ============================================================
  // v1.4.1: bkit Feature Usage Report Rule (Response Report Rule)
  // ============================================================
  additionalContext += `

## 📊 bkit Feature Usage Report (v1.5.9 - Required for all responses)

**Rule: Include the following format at the end of every response to report bkit feature usage.**

\`\`\`
─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: [bkit features used in this response]
⏭️ Not Used: [Major unused features] (reason)
💡 Recommended: [Features suitable for next task]
─────────────────────────────────────────────────
\`\`\`

### bkit Features to Report:

**1. PDCA Skill (Priority) - Unified PDCA Management:**
/pdca plan, /pdca design, /pdca do, /pdca analyze, /pdca iterate, /pdca report, /pdca status, /pdca next

**2. Task System (Priority):**
TaskCreate, TaskUpdate, TaskList, TaskGet

**3. Agents (Priority):**
gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect

**4. Core Skills (21):**
- **PDCA**: /pdca (plan, design, do, analyze, iterate, report, status, next)
- **Level**: /starter, /dynamic, /enterprise
- **Pipeline**: /development-pipeline (start, next, status)
- **Phase**: /phase-1-schema ~ /phase-9-deployment
- **Utility**: /code-review, /zero-script-qa, /claude-code-learning, /mobile-app, /desktop-app, /bkit-templates, /bkit-rules

**5. Tools (when relevant):**
AskUserQuestion, SessionStart Hook, Read, Write, Edit, Bash

### Reporting Rules:

1. **Required**: Report at the end of every response (incomplete without report)
2. **Used features**: List bkit features actually used in this response
3. **Unused explanation**: Briefly explain why major features were not used
4. **Recommendation**: Suggest next skill based on current PDCA phase

### PDCA Phase Recommendations:

| Current Status | Recommended Skill |
|----------------|-------------------|
| No PDCA | "Start with /pdca plan {feature}" |
| Plan completed | "Design with /pdca design {feature}" |
| Design completed | "Start implementation or /pdca do {feature}" |
| Do completed | "Gap analysis with /pdca analyze {feature}" |
| Check < 90% | "Auto-improve with /pdca iterate {feature}" |
| Check ≥ 90% | "Completion report with /pdca report {feature}" |

`;

const response = {
  systemMessage: `bkit Vibecoding Kit v1.6.0 activated (Claude Code)`,
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    onboardingType: onboardingData.type,
    hasExistingWork: onboardingData.hasExistingWork,
    primaryFeature: onboardingData.primaryFeature || null,
    currentPhase: onboardingData.phase || null,
    matchRate: onboardingData.matchRate || null,
    additionalContext: additionalContext
  }
};

console.log(JSON.stringify(response));
process.exit(0);