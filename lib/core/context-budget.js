/**
 * Context Budget Guard (ENH-240, Issue #81 Phase B)
 *
 * CC hooks 공식 10,000자 cap(code.claude.com/docs/en/hooks)에 대응하는
 * 선제적 하드 캡 + priority-preserved 축약.
 *
 * 공식 문서 인용:
 *   "Hook output is capped at 10,000 characters. Output exceeding this limit
 *    is saved to a file and replaced with a preview and file path."
 *
 * bkit 기본값 8,000 = 10,000 - 2,000 안전 마진.
 */

const { debugLog } = require('./debug');
const { stripAnsi } = require('../ui/ansi');

const DEFAULT_MAX_CHARS = 8000;
const DEFAULT_PRIORITY_KEYS = [
  'MANDATORY',
  'Previous Work Detected',
  'Previous Work',
  'AskUserQuestion',
];
const TRUNCATION_NOTICE = '\n\n⚠️ bkit: additionalContext truncated (ENH-240 budget guard).\n';

/**
 * Enforce a character budget on a string, preserving priority sections.
 *
 * @param {string} input - The additionalContext string to guard.
 * @param {object} [opts] - Options.
 * @param {number} [opts.maxChars=8000] - Max chars (stripAnsi basis).
 * @param {string[]} [opts.priorityPreserve] - Keywords marking priority sections.
 * @returns {string} possibly truncated context.
 */
function applyBudget(input, opts) {
  const options = opts || {};
  const maxChars = Number.isFinite(options.maxChars) ? options.maxChars : DEFAULT_MAX_CHARS;
  const priorityKeys = Array.isArray(options.priorityPreserve)
    ? options.priorityPreserve
    : DEFAULT_PRIORITY_KEYS;

  const original = String(input == null ? '' : input);
  const strippedLen = stripAnsi(original).length;

  if (strippedLen <= maxChars) return original;

  debugLog('ContextBudget', 'ENH-240 cap exceeded', {
    original: strippedLen,
    cap: maxChars,
    overshoot: strippedLen - maxChars,
  });

  // 섹션 단위 분할 (빈 줄 기준 — builder 대부분 이 형태)
  const sections = original.split(/\n\n+/);

  // priority 섹션 인덱스 수집 (순서 보존)
  const priorityIdx = new Set();
  sections.forEach((s, i) => {
    if (priorityKeys.some((k) => s.includes(k))) priorityIdx.add(i);
  });

  const kept = new Array(sections.length).fill(false);
  let budget = maxChars - stripAnsi(TRUNCATION_NOTICE).length;

  // 1) priority 섹션 먼저 확보
  for (const i of priorityIdx) {
    const segLen = stripAnsi(sections[i]).length + 2; // '\n\n' 구분자
    if (budget - segLen >= 0) {
      kept[i] = true;
      budget -= segLen;
    }
  }

  // 2) 앞쪽 섹션부터 남은 예산 내 추가 (헤더/온보딩 우선 보존)
  for (let i = 0; i < sections.length; i++) {
    if (kept[i]) continue;
    const segLen = stripAnsi(sections[i]).length + 2;
    if (budget - segLen >= 0) {
      kept[i] = true;
      budget -= segLen;
    } else {
      break;
    }
  }

  const out = sections.filter((_, i) => kept[i]).join('\n\n') + TRUNCATION_NOTICE;
  return out;
}

module.exports = {
  applyBudget,
  DEFAULT_MAX_CHARS,
  DEFAULT_PRIORITY_KEYS,
};
