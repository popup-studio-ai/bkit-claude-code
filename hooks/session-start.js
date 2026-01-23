#!/usr/bin/env node
/**
 * bkit Vibecoding Kit - SessionStart Hook (v1.3.1)
 * Cross-platform Node.js implementation
 *
 * Converted from: hooks/session-start.sh
 * Platform: Windows, macOS, Linux
 */

const fs = require('fs');
const path = require('path');

// Debug logging
const debugLog = (message) => {
  try {
    const logPath = process.platform === 'win32'
      ? path.join(process.env.TEMP || 'C:\\Temp', 'bkit-hook-debug.log')
      : '/tmp/bkit-hook-debug.log';
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
  } catch (e) {
    // Ignore logging errors
  }
};

debugLog(`SessionStart hook executed in ${process.cwd()}`);

/**
 * Detect project level from file structure
 * @returns {string} "starter" | "dynamic" | "enterprise"
 */
function detectProjectLevel() {
  const cwd = process.cwd();

  // Check for Enterprise level indicators
  const enterpriseIndicators = [
    'infra/terraform',
    'infra/k8s',
    'kubernetes'
  ];

  for (const indicator of enterpriseIndicators) {
    if (fs.existsSync(path.join(cwd, indicator))) {
      return 'enterprise';
    }
  }

  // Check docker-compose + services
  if (fs.existsSync(path.join(cwd, 'docker-compose.yml')) &&
    fs.existsSync(path.join(cwd, 'services'))) {
    return 'enterprise';
  }

  // Check for Dynamic level indicators
  const dynamicIndicators = [
    'src/features',
    'src/services',
    'lib/bkend',
    'supabase'
  ];

  for (const indicator of dynamicIndicators) {
    if (fs.existsSync(path.join(cwd, indicator))) {
      return 'dynamic';
    }
  }

  // Check .env files for dynamic patterns
  const envFiles = ['.env', '.env.local'];
  for (const envFile of envFiles) {
    const envPath = path.join(cwd, envFile);
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        if (/NEXT_PUBLIC_|DATABASE_|AUTH_/.test(content)) {
          return 'dynamic';
        }
      } catch (e) {
        // Ignore read errors
      }
    }
  }

  // Check package.json for dynamic dependencies
  const packagePath = path.join(cwd, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const content = fs.readFileSync(packagePath, 'utf8');
      if (/prisma|mongoose|@tanstack\/react-query/.test(content)) {
        return 'dynamic';
      }
    } catch (e) {
      // Ignore read errors
    }
  }

  return 'starter';
}

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

// Persist environment variables if CLAUDE_ENV_FILE is available
const envFile = process.env.CLAUDE_ENV_FILE;
if (envFile) {
  const detectedLevel = detectProjectLevel();
  const detectedPhase = detectPdcaPhase();

  try {
    fs.appendFileSync(envFile, `export BKIT_LEVEL=${detectedLevel}\n`);
    fs.appendFileSync(envFile, `export BKIT_PDCA_PHASE=${detectedPhase}\n`);
  } catch (e) {
    // Ignore write errors
  }
}

// Output SessionStart hook response
const response = {
  systemMessage: "bkit Vibecoding Kit v1.3.2 activated",
  hookSpecificOutput: {
    hookEventName: "SessionStart",
    additionalContext: `# bkit Vibecoding Kit v1.3.2 - Session Startup

## 🚨 MANDATORY: Session Start Action

When user sends their first message, you MUST use the **AskUserQuestion tool** to ask the following question.
Do NOT respond with plain text. You MUST invoke the AskUserQuestion tool.

### AskUserQuestion Parameters:
\`\`\`json
{
  "questions": [{
    "question": "What would you like help with?",
    "header": "Help Type",
    "options": [
      {"label": "Learn bkit", "description": "Introduction and 9-stage pipeline"},
      {"label": "Learn Claude Code", "description": "Setup and usage guide"},
      {"label": "Continue Previous Work", "description": "Resume from PDCA status"},
      {"label": "Start New Project", "description": "Initialize new project"}
    ],
    "multiSelect": false
  }]
}
\`\`\`

### Actions by Selection:
- **Learn bkit** → Explain bkit features (PDCA, Pipeline, Levels, Agents, Zero Script QA) AND teach 9-stage development process. Run /pipeline-start if user wants hands-on learning.
- **Learn Claude Code** → Run /learn-claude-code skill
- **Continue Previous Work** → Check PDCA status (docs/.pdca-status.json or scan docs/), guide next step
- **Start New Project** → Ask level selection (Starter/Dynamic/Enterprise), then run /init-starter, /init-dynamic, or /init-enterprise

## PDCA Core Rules (Always Apply)
- New feature request → Check/create design doc first
- After implementation → Suggest Gap analysis
- Gap Analysis < 90% → Suggest pdca-iterator for auto-fix
- Gap Analysis >= 90% → Suggest report-generator for completion

## 🎯 Trigger Keyword Mapping (v1.3.0)
When user mentions these keywords in conversation, consider using the corresponding agent:

| User Says | Agent to Use | Action |
|-----------|--------------|--------|
| 검증, verify, check, 확인 | gap-detector | Run Gap Analysis |
| 개선, improve, iterate, 고쳐, fix | pdca-iterator | Auto-fix iteration loop |
| 분석, analyze, quality, 품질 | code-analyzer | Code quality analysis |
| 보고서, report, summary, 요약 | report-generator | Generate completion report |
| QA, 테스트, test, 로그 | qa-monitor | Zero Script QA via logs |
| 설계, design, spec | design-validator | Validate design docs |

## 📏 Task Size Rules (Automation First - v1.3.0)
PDCA application based on change size (guide, not force):

| Size | Lines | PDCA Level | Action |
|------|-------|------------|--------|
| Quick Fix | <10 | None | No guidance needed |
| Minor Change | <50 | Light | "PDCA optional" mention |
| Feature | <200 | Recommended | Design doc recommended |
| Major Feature | >=200 | Required | Design doc strongly recommended |

## 🔄 Check-Act Iteration Loop (v1.3.0)
\`\`\`
gap-detector (Check) → Match Rate 확인
    ├── >= 90% → report-generator (완료)
    ├── 70-89% → 선택 제공 (수동/자동)
    └── < 70% → pdca-iterator 권장 (Act)
                   ↓
              수정 후 gap-detector 재실행
                   ↓
              반복 (최대 5회)
\`\`\`

💡 Important: Claude is not perfect. Always verify important decisions.`
  }
};

console.log(JSON.stringify(response));
process.exit(0);
