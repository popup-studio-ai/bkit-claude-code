#!/usr/bin/env node
/**
 * phase9-deploy-pre.js - Validate environment before deployment
 *
 * Purpose: Check for required files before deployment commands
 * Hook: PreToolUse (Bash) for phase-9-deployment skill
 *
 * Converted from: scripts/phase9-deploy-pre.sh
 */

const fs = require('fs');
const path = require('path');
const { readStdinSync, parseHookInput, outputAllow, outputEmpty } = require('../lib/core/io');
const { PROJECT_DIR } = require('../lib/core/platform');

// Read input from stdin
const input = readStdinSync();
const { command } = parseHookInput(input);

// Check if this is a deployment command
const deployPatterns = ['vercel', 'deploy', 'kubectl apply'];
const isDeployCommand = deployPatterns.some(pattern => command.includes(pattern));

if (isDeployCommand) {
  // Check for .env.example
  const envExamplePath = path.join(PROJECT_DIR, '.env.example');
  const hasEnvExample = fs.existsSync(envExamplePath);

  if (!hasEnvExample) {
    const message = `⚠️ Pre-deployment Check:
- Missing .env.example file
- Ensure all required environment variables are documented
- Verify CI/CD secrets are configured`;

    // v1.4.0: PreToolUse hook에 맞는 스키마 사용
    outputAllow(message, 'PreToolUse');
  } else {
    const message = `✅ Pre-deployment Check:
- .env.example found
- Verify CI/CD secrets match .env.example
- Run scripts/check-env.sh if available`;

    // v1.4.0: PreToolUse hook에 맞는 스키마 사용
    outputAllow(message, 'PreToolUse');
  }
} else {
  outputEmpty();
}
