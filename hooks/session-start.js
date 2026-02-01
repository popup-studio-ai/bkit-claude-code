#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v1.5.0)
 * Claude Code 전용 플러그인
 *
 * v1.5.0 Changes:
 * - Gemini CLI 지원 제거 (Claude Code 전용으로 단순화)
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

// v1.4.2: Context Fork (FR-03)
let contextFork;
try {
  contextFork = require('../lib/context-fork.js');
} catch (e) {
  // Fallback if module not available
  contextFork = null;
}

// Log session start
debugLog('SessionStart', 'Hook executed', {
  cwd: process.cwd(),
  platform: BKIT_PLATFORM
});

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
      const { content, errors } = importResolver.resolveImports(
        { imports: startupImports },
        path.join(process.cwd(), 'bkit.config.json')
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
  const statusPath = path.join(process.cwd(), 'docs/.pdca-status.json');

  if (fs.existsSync(statusPath)) {
    try {
      const content = fs.readFileSync(statusPath, 'utf8');
      const match = content.match(/"currentPhase"\s*:\s*(\d+)/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (e) {
      // Ignore read errors
    }
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

### Skill Triggers (Auto-detection)
| Keywords | Skill | Level |
|----------|-------|-------|
| static site, 정적 웹, sitio estático, site statique | starter | Starter |
| login, fullstack, 로그인, connexion, Anmeldung | dynamic | Dynamic |
| microservices, k8s, 마이크로서비스, microservizi | enterprise | Enterprise |
| mobile app, React Native, 모바일 앱, app mobile | mobile-app | All |

💡 Use natural language and the appropriate tool will be activated automatically.
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
let additionalContext = `# bkit Vibecoding Kit v1.5.0 - Session Startup\n\n`;

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

  additionalContext += `## PDCA Core Rules (Always Apply)\n`;
  additionalContext += `- New feature request → Check/create Plan/Design documents first\n`;
  additionalContext += `- After implementation → Suggest Gap analysis\n`;
  additionalContext += `- Gap Analysis < 90% → Auto-improvement with pdca-iterator\n`;
  additionalContext += `- Gap Analysis >= 90% → Completion report with report-generator\n\n`;

  additionalContext += triggerTable;
  additionalContext += `\n\n## v1.4.0 Automation Features\n`;
  additionalContext += `- 🎯 8-language auto-detection: EN, KO, JA, ZH, ES, FR, DE, IT\n`;
  additionalContext += `- 🤖 Implicit Agent/Skill triggers\n`;
  additionalContext += `- 📊 Ambiguity detection and clarifying question generation\n`;
  additionalContext += `- 🔄 Automatic PDCA phase progression\n\n`;
  additionalContext += `💡 Important: AI Agent is not perfect. Always verify important decisions.`;

  // ============================================================
  // v1.4.1: bkit Feature Usage Report Rule (Response Report Rule)
  // ============================================================
  additionalContext += `

## 📊 bkit Feature Usage Report (v1.5.0 - Required for all responses)

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
  systemMessage: `bkit Vibecoding Kit v1.5.0 activated (Claude Code)`,
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