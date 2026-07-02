#!/usr/bin/env node
/**
 * Claude Code Learning Stop Hook (v1.4.4)
 *
 * 학습 완료 후 다음 단계 제안
 *
 * @version 2.1.10
 * @module scripts/learning-stop
 */

// #130: read hook input via the shared, reliable reader (lib/core/io) —
// same pattern as scripts/skill-post.js (fixed in #125/#126).
const { readStdinSync } = require('../lib/core/io');

function generateLearningCompletion(level) {
  const nextLevel = level < 5 ? level + 1 : null;

  return {
    completedLevel: level,
    nextLevel,
    suggestions: [
      nextLevel ? {
        action: `/claude-code-learning learn ${nextLevel}`,
        description: `Level ${nextLevel} 학습 계속`
      } : null,
      {
        action: '/claude-code-learning setup',
        description: '설정 자동 생성'
      },
      {
        action: '/pdca plan',
        description: 'PDCA 방법론으로 개발 시작'
      }
    ].filter(Boolean)
  };
}

function formatOutput(result) {
  return JSON.stringify({ status: 'success', ...result }, null, 2);
}

async function main() {
  try {
    // Read hook input from stdin via the shared, reliable reader (lib/core/io).
    // Do NOT hand-roll a `process.stdin.isTTY === false` guard: Node sets isTTY
    // to `undefined` (not `false`) for piped stdin, so that guard silently skips
    // the read, leaving the hook context empty and level always 1 (#130). This is
    // the same readStdinSync() every sibling hook (skill-post, unified-*) uses.
    const context = readStdinSync();

    let level = 1;
    const args = String(context?.tool_input?.args || '');
    const match = args.match(/\d+/);
    if (match) level = parseInt(match[0], 10);

    const result = generateLearningCompletion(level);

    console.log(formatOutput(result));
  } catch (e) {
    console.log(JSON.stringify({ status: 'error', error: e.message }));
  }
}

main().catch(e => {
  console.error('learning-stop.js error:', e.message);
  process.exit(1);
});
