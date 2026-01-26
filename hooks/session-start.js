#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v1.4.3)
 * Cross-platform Node.js implementation
 * Supports: Claude Code, Gemini CLI
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
let {
  BKIT_PLATFORM,
  detectLevel,
  isGeminiCli,
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
  // v1.4.3: XML Safety for Gemini CLI v0.26+ (FR-1.1)
  xmlSafeOutput
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

// Force-detect Gemini if gemini-extension.json exists (Fix for stale BKIT_PLATFORM)
try {
  const extensionJsonPath = path.join(__dirname, '../gemini-extension.json');
  if (BKIT_PLATFORM !== 'gemini' && fs.existsSync(extensionJsonPath) && !process.env.CLAUDE_PROJECT_DIR) {
    const oldPlatform = BKIT_PLATFORM;
    BKIT_PLATFORM = 'gemini';
    isGeminiCli = () => true;
    debugLog('SessionStart', 'Platform override', { from: oldPlatform, to: 'gemini' });
  }
} catch (e) {
  // Ignore detection errors
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
      'plan': 'Plan (계획)',
      'design': 'Design (설계)',
      'do': 'Do (구현)',
      'check': 'Check (검증)',
      'act': 'Act (개선)',
      'completed': 'Completed (완료)'
    };

    return {
      type: 'resume',
      hasExistingWork: true,
      primaryFeature: primary,
      phase: phase,
      matchRate: matchRate,
      prompt: emitUserPrompt({
        questions: [{
          question: `이전 작업이 있습니다. 어떻게 할까요?\n현재: "${primary}" - ${phaseDisplay[phase] || phase}${matchRate ? ` (${matchRate}%)` : ''}`,
          header: 'Resume',
          options: [
            { label: `${primary} 계속`, description: `${phaseDisplay[phase] || phase} 단계 이어하기` },
            { label: '새 작업 시작', description: '다른 기능 개발' },
            { label: '상태 확인', description: 'PDCA 현황 보기 (/pdca-status)' }
          ],
          multiSelect: false
        }]
      }),
      suggestedAction: matchRate && matchRate < 90 ? '/pdca-iterate' : '/pdca-status'
    };
  }

  // 2. New user onboarding
  return {
    type: 'new_user',
    hasExistingWork: false,
    level: level,
    prompt: emitUserPrompt({
      questions: [{
        question: '무엇을 도와드릴까요?',
        header: 'Help Type',
        options: [
          { label: 'bkit 학습', description: '소개 및 9단계 파이프라인' },
          { label: 'Claude Code 학습', description: '설정 및 사용법' },
          { label: '새 프로젝트 시작', description: '프로젝트 초기화' },
          { label: '자유롭게 시작', description: '가이드 없이 진행' }
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
            { label: '네, 그렇습니다', description: '이 해석이 맞습니다' },
            { label: '아니요', description: '다르게 해석해주세요' },
            { label: '상세 설명', description: '더 자세히 설명하겠습니다' }
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
## 🎯 v1.4.0 자동 트리거 키워드 (8개 언어 지원)

### Agent 트리거
| 키워드 | Agent | 동작 |
|--------|-------|------|
| 검증, verify, 確認, 验证 | gap-detector | Gap 분석 실행 |
| 개선, improve, 改善, 改进 | pdca-iterator | 자동 개선 반복 |
| 분석, analyze, 分析, 品質 | code-analyzer | 코드 품질 분석 |
| 보고서, report, 報告, 报告 | report-generator | 완료 보고서 생성 |
| 도움, help, 助けて, 帮助 | starter-guide | 초보자 가이드 |

### Skill 트리거 (자동 감지)
| 키워드 | Skill | 레벨 |
|--------|-------|------|
| 정적 웹, static site | starter | Starter |
| 로그인, fullstack | dynamic | Dynamic |
| 마이크로서비스, k8s | enterprise | Enterprise |
| 모바일 앱, React Native | mobile-app | All |

💡 자연어로 말하면 자동으로 적절한 도구가 활성화됩니다.
`;
}

// Persist environment variables (cross-platform)
// Claude Code: CLAUDE_ENV_FILE, Gemini CLI: GEMINI_ENV_FILE
const envFile = process.env.CLAUDE_ENV_FILE || process.env.GEMINI_ENV_FILE;
if (envFile) {
  const detectedLevel = detectLevel(); // Uses common.js logic
  const detectedPhase = detectPdcaPhase();

  try {
    fs.appendFileSync(envFile, `export BKIT_LEVEL=${detectedLevel}\n`);
    fs.appendFileSync(envFile, `export BKIT_PDCA_PHASE=${detectedPhase}\n`);
    fs.appendFileSync(envFile, `export BKIT_PLATFORM=${BKIT_PLATFORM}\n`);
  } catch (e) {
    // Ignore write errors
  }
}

// ============================================================
// Output Response (Dual Platform) - v1.4.0 Enhanced
// ============================================================

// Get enhanced onboarding data
const onboardingData = enhancedOnboarding();
const triggerTable = getTriggerKeywordTable();

if (isGeminiCli()) {
  // ------------------------------------------------------------
  // Gemini CLI Output: Plain Text with ANSI Colors
  // ------------------------------------------------------------

  let output = `
\x1b[36m🤖 bkit Vibecoding Kit v1.4.3 (Gemini Edition)\x1b[0m
====================================================
PDCA Cycle & AI-Native Development Environment
`;

  if (onboardingData.hasExistingWork) {
    // Resume existing work
    // v1.4.3: Apply xmlSafeOutput for Gemini CLI v0.26+ compatibility
    const safeFeatureName = xmlSafeOutput(onboardingData.primaryFeature);
    const safePhase = xmlSafeOutput(onboardingData.phase);
    output += `
\x1b[33m[📋 이전 작업 감지됨]\x1b[0m
• 기능: \x1b[1m${safeFeatureName}\x1b[0m
• 단계: ${safePhase}${onboardingData.matchRate ? ` (${onboardingData.matchRate}%)` : ''}

\x1b[33m[권장 명령]\x1b[0m
1. 🔄 이전 작업 계속: \x1b[1m/pdca-status\x1b[0m
2. ✅ Gap 분석 실행: \x1b[1m/pdca-analyze ${safeFeatureName}\x1b[0m
3. 🆕 새 작업 시작: \x1b[1m/pdca-plan [기능명]\x1b[0m
`;
  } else {
    // New user onboarding
    output += `
\x1b[33m[권장 시작 명령]\x1b[0m
1. 📚 bkit 학습 (9단계 파이프라인): \x1b[1m/pipeline-start\x1b[0m
2. 🤖 Claude Code 학습 (설정 가이드): \x1b[1m/learn-claude-code\x1b[0m
3. 🆕 새 프로젝트 시작 (초기화): \x1b[1m/init-starter\x1b[0m
`;
  }

  output += `
\x1b[32m💡 Tip: "검증해줘", "개선해줘" 등 자연어로 요청하면 자동으로 적절한 Agent가 실행됩니다.\x1b[0m
\x1b[32m   (8개 언어 지원: EN, KO, JA, ZH, ES, FR, DE, IT)\x1b[0m
`;

  console.log(output);
  process.exit(0);

} else {
  // ------------------------------------------------------------
  // Claude Code Output: JSON with Tool Call Prompt
  // ------------------------------------------------------------

  // Build context based on onboarding type
  let additionalContext = `# bkit Vibecoding Kit v1.4.3 - Session Startup\n\n`;

  if (onboardingData.hasExistingWork) {
    additionalContext += `## 🔄 이전 작업 감지됨\n\n`;
    additionalContext += `- **기능**: ${onboardingData.primaryFeature}\n`;
    additionalContext += `- **현재 단계**: ${onboardingData.phase}\n`;
    if (onboardingData.matchRate) {
      additionalContext += `- **매치율**: ${onboardingData.matchRate}%\n`;
    }
    additionalContext += `\n### 🚨 MANDATORY: 사용자 첫 메시지에 AskUserQuestion 호출\n\n`;
    additionalContext += `${onboardingData.prompt}\n\n`;
    additionalContext += `### 선택별 동작:\n`;
    additionalContext += `- **${onboardingData.primaryFeature} 계속** → /pdca-status 실행 후 다음 단계 안내\n`;
    additionalContext += `- **새 작업 시작** → 새 기능명 질문 후 /pdca-plan 실행\n`;
    additionalContext += `- **상태 확인** → /pdca-status 실행\n\n`;
  } else {
    additionalContext += `## 🚨 MANDATORY: Session Start Action\n\n`;
    additionalContext += `사용자 첫 메시지에 **AskUserQuestion tool** 호출 필수.\n\n`;
    additionalContext += `${onboardingData.prompt}\n\n`;
    additionalContext += `### 선택별 동작:\n`;
    additionalContext += `- **bkit 학습** → /pipeline-start 실행\n`;
    additionalContext += `- **Claude Code 학습** → /learn-claude-code 실행\n`;
    additionalContext += `- **새 프로젝트 시작** → 레벨 선택 후 /init-starter, /init-dynamic, /init-enterprise 실행\n`;
    additionalContext += `- **자유롭게 시작** → 일반 대화 모드\n\n`;
  }

  additionalContext += `## PDCA Core Rules (Always Apply)\n`;
  additionalContext += `- 새 기능 요청 → Plan/Design 문서 먼저 확인/생성\n`;
  additionalContext += `- 구현 후 → Gap 분석 제안\n`;
  additionalContext += `- Gap Analysis < 90% → pdca-iterator로 자동 개선\n`;
  additionalContext += `- Gap Analysis >= 90% → report-generator로 완료 보고서\n\n`;

  additionalContext += triggerTable;
  additionalContext += `\n\n## v1.4.0 자동화 기능\n`;
  additionalContext += `- 🎯 8개 언어 자동 감지: EN, KO, JA, ZH, ES, FR, DE, IT\n`;
  additionalContext += `- 🤖 암시적 Agent/Skill 트리거\n`;
  additionalContext += `- 📊 모호성 감지 및 명확화 질문 생성\n`;
  additionalContext += `- 🔄 PDCA 자동 페이즈 진행\n\n`;
  additionalContext += `💡 Important: AI Agent is not perfect. Always verify important decisions.`;

  // ============================================================
  // v1.4.1: bkit 기능 현황 보고 규칙 (Response Report Rule)
  // ============================================================
  additionalContext += `

## 📊 bkit 기능 현황 보고 (v1.4.3 - 모든 답변 필수)

**규칙: 모든 답변 끝에 아래 형식으로 bkit 기능 사용 현황을 보고합니다.**

\`\`\`
─────────────────────────────────────────────────
📊 bkit 기능 사용 현황
─────────────────────────────────────────────────
✅ 사용: [이번 답변에서 사용한 bkit 기능들]
⏭️ 미사용: [주요 미사용 기능] (이유)
💡 추천: [다음 작업에 적합한 기능]
─────────────────────────────────────────────────
\`\`\`

### 보고 대상 bkit 기능 목록:

**1. PDCA Commands (우선 표시):**
/pdca-plan, /pdca-design, /pdca-analyze, /pdca-report, /pdca-next, /pdca-status, /pdca-iterate

**2. Task System (우선 표시):**
TaskCreate, TaskUpdate, TaskList, TaskGet

**3. Agents (우선 표시):**
gap-detector, pdca-iterator, code-analyzer, report-generator, starter-guide, design-validator, qa-monitor, pipeline-guide, bkend-expert, enterprise-expert, infra-architect

**4. Skills (사용 시 표시):**
bkit-rules, development-pipeline, starter, dynamic, enterprise, mobile-app, desktop-app, phase-1~9, zero-script-qa, bkit-templates

**5. 기타 Commands (사용 시 표시):**
/pipeline-start, /pipeline-next, /pipeline-status, /init-starter, /init-dynamic, /init-enterprise, /archive, /zero-script-qa, /learn-claude-code, /setup-claude-code, /upgrade-claude-code, /upgrade-level, /github-stats

**6. 도구 (관련 시 표시):**
AskUserQuestion, SessionStart Hook

### 보고 규칙:

1. **필수**: 모든 답변 끝에 보고 (보고 없으면 불완전한 답변)
2. **사용 기능**: 이번 답변에서 실제로 사용한 bkit 기능 나열
3. **미사용 설명**: 주요 기능을 사용하지 않은 이유 간단히 설명
4. **추천**: 현재 PDCA 단계에 맞는 다음 기능 제안

### PDCA 단계별 추천:

| 현재 상태 | 추천 |
|----------|------|
| PDCA 없음 | "기능 개발 시 /pdca-plan으로 시작" |
| Plan 완료 | "/pdca-design으로 설계 단계 진행" |
| Design 완료 | "구현 시작 또는 /pdca-next로 가이드" |
| Do 완료 | "/pdca-analyze로 Gap 분석" |
| Check < 90% | "/pdca-iterate로 자동 개선" |
| Check ≥ 90% | "/pdca-report로 완료 보고서" |

`;

  const response = {
    systemMessage: `bkit Vibecoding Kit v1.4.3 activated (Claude Code)`,
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
}