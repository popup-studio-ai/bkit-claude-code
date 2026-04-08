/**
 * bkit Vibecoding Kit - SessionStart: Onboarding Module (v2.0.0)
 *
 * Handles onboarding message generation, level detection,
 * output style suggestion, first-time user detection, and startup import loading.
 */

const fs = require('fs');
const { detectLevel } = require('../../lib/pdca/level');
const { debugLog } = require('../../lib/core/debug');
const { getPdcaStatusFull } = require('../../lib/pdca/status');
const { formatAskUserQuestion } = require('../../lib/pdca/automation');
const { calculateAmbiguityScore } = require('../../lib/intent/ambiguity');
const { getBkitConfig } = require('../../lib/core/config');

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
 * Enhanced onboarding with PDCA status check.
 * Checks for existing work and generates appropriate prompts.
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

  // Check for existing work
  if (pdcaStatus.activeFeatures && pdcaStatus.activeFeatures.length > 0) {
    const primary = pdcaStatus.primaryFeature;
    const featureData = pdcaStatus.features?.[primary];
    const phase = featureData?.phase || 'plan';
    const matchRate = featureData?.matchRate;

    const phaseDisplay = {
      'pm': 'PM Discovery',
      'plan': 'Plan',
      'design': 'Design',
      'do': 'Implementation',
      'check': 'Verification',
      'act': 'Improvement',
      'completed': 'Completed'
    };

    // v2.1.1 H-01: Use formatAskUserQuestion for proper AskUserQuestion output
    const askPayload = formatAskUserQuestion({
      question: `Previous work detected. How would you like to proceed?\nCurrent: "${primary}" - ${phaseDisplay[phase] || phase}${matchRate ? ` (${matchRate}%)` : ''}`,
      header: 'Resume',
      options: [
        { label: `Continue ${primary}`, description: `Resume ${phaseDisplay[phase] || phase} phase` },
        { label: 'Start new task', description: 'Develop a different feature' },
        { label: 'Check status', description: 'View PDCA status (/pdca status)' }
      ],
      multiSelect: false
    });

    return {
      type: 'resume',
      hasExistingWork: true,
      primaryFeature: primary,
      phase: phase,
      matchRate: matchRate,
      userPrompt: JSON.stringify(askPayload),
      suggestedAction: matchRate && matchRate < 90 ? '/pdca iterate' : '/pdca status'
    };
  }

  // v2.1.1 H-01: New user onboarding with proper AskUserQuestion
  const newUserPayload = formatAskUserQuestion({
    question: 'How can I help you?',
    header: 'Help Type',
    options: [
      { label: 'Learn bkit', description: 'Introduction and 9-phase pipeline' },
      { label: 'Learn Claude Code', description: 'Settings and usage' },
      { label: 'Start new project', description: 'Project initialization' },
      { label: 'Start freely', description: 'Proceed without guide' }
    ],
    multiSelect: false
  });

  return {
    type: 'new_user',
    hasExistingWork: false,
    level: level,
    userPrompt: JSON.stringify(newUserPayload),
  };
}

/**
 * Analyze user request for ambiguity and generate clarifying questions.
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
      // v2.1.1 H-01: Use formatAskUserQuestion for ambiguity clarification
      userPrompt: JSON.stringify(formatAskUserQuestion({
        question: ambiguityResult.clarifyingQuestions[0],
        header: 'Clarify',
        options: [
          { label: 'Yes, correct', description: 'This interpretation is correct' },
          { label: 'No', description: 'Please interpret differently' },
          { label: 'More details', description: 'I will explain in more detail' }
        ],
        multiSelect: false
      }))
    };
  }

  return null;
}

/**
 * Generate trigger keyword reference table.
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

/**
 * Persist environment variables to CLAUDE_ENV_FILE.
 */
function persistEnvVars() {
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
}

/**
 * Run onboarding phase.
 * Generates onboarding data, trigger table, and persists env vars.
 * @param {object} _input - Hook input (unused, reserved for future use)
 * @returns {{ onboardingData: object, triggerTable: string }}
 */
function run(_input) {
  persistEnvVars();

  const onboardingData = enhancedOnboarding();
  const triggerTable = getTriggerKeywordTable();

  return {
    onboardingData,
    triggerTable
  };
}

module.exports = { run, analyzeRequestAmbiguity, detectPdcaPhase };
