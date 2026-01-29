/**
 * I/O Utilities
 * @module lib/core/io
 * @version 1.4.7
 */

const fs = require('fs');

// Lazy require to avoid circular dependency
let _platform = null;
function getPlatform() {
  if (!_platform) {
    _platform = require('./platform');
  }
  return _platform;
}

const MAX_CONTEXT_LENGTH = 500;

/**
 * 컨텍스트 문자열 자르기
 * @param {string} context
 * @param {number} [maxLength=MAX_CONTEXT_LENGTH]
 * @returns {string}
 */
function truncateContext(context, maxLength = MAX_CONTEXT_LENGTH) {
  if (!context || context.length <= maxLength) return context || '';
  return context.slice(0, maxLength) + '... (truncated)';
}

/**
 * stdin에서 JSON 동기적 읽기
 * @returns {*}
 */
function readStdinSync() {
  try {
    const input = fs.readFileSync(0, 'utf8');
    return JSON.parse(input);
  } catch (e) {
    return {};
  }
}

/**
 * stdin에서 JSON 비동기 읽기
 * @returns {Promise<*>}
 */
async function readStdin() {
  return new Promise((resolve) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => {
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        resolve({});
      }
    });
  });
}

/**
 * Hook 입력 파싱
 * @param {*} input
 * @returns {{toolName: string, filePath: string, content: string, command: string, oldString: string}}
 */
function parseHookInput(input) {
  return {
    toolName: input?.tool_name || input?.toolName || '',
    filePath: input?.tool_input?.file_path || input?.tool_input?.filePath || '',
    content: input?.tool_input?.content || '',
    command: input?.tool_input?.command || '',
    oldString: input?.tool_input?.old_string || '',
  };
}

/**
 * 허용 결정 출력 (플랫폼별 포맷)
 * @param {string} [context]
 * @param {string} [hookEvent]
 */
function outputAllow(context, hookEvent) {
  const { BKIT_PLATFORM } = getPlatform();
  const truncated = truncateContext(context);

  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({
      status: 'allow',
      message: truncated || undefined,
    }));
  } else {
    if (hookEvent === 'SessionStart' || hookEvent === 'UserPromptSubmit') {
      console.log(JSON.stringify({
        success: true,
        message: truncated || undefined,
      }));
    } else {
      if (truncated) {
        console.log(truncated);
      }
    }
  }
}

/**
 * 차단 결정 출력 (플랫폼별 포맷)
 * @param {string} reason
 */
function outputBlock(reason) {
  const { BKIT_PLATFORM } = getPlatform();

  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({
      status: 'block',
      message: reason,
    }));
  } else {
    console.log(JSON.stringify({
      decision: 'block',
      reason: reason,
    }));
  }
  process.exit(0);
}

/**
 * 빈 출력
 */
function outputEmpty() {
  const { BKIT_PLATFORM } = getPlatform();

  if (BKIT_PLATFORM === 'gemini') {
    console.log(JSON.stringify({ status: 'allow' }));
  }
}

/**
 * XML 특수문자 이스케이프
 * @param {string} content
 * @returns {string}
 */
function xmlSafeOutput(content) {
  if (!content) return '';
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

module.exports = {
  MAX_CONTEXT_LENGTH,
  truncateContext,
  readStdinSync,
  readStdin,
  parseHookInput,
  outputAllow,
  outputBlock,
  outputEmpty,
  xmlSafeOutput,
};
