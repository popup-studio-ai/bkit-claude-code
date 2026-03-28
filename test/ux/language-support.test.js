'use strict';
/**
 * UX Tests: 8-Language Support UX (25 TC)
 * Tests detectLanguage, multi-language trigger matching for all 8 supported languages,
 * and verifies new skills have multilingual triggers.
 *
 * @module test/ux/language-support.test.js
 */

const { assert, summary } = require('../helpers/assert');

let lang;
try {
  lang = require('../../lib/intent/language');
} catch (e) {
  console.error('Module load failed:', e.message);
  process.exit(1);
}

console.log('\n=== language-support.test.js ===\n');

const { detectLanguage, matchMultiLangPattern, AGENT_TRIGGER_PATTERNS, SUPPORTED_LANGUAGES } = lang;

// --- UX-LANG-001: EN 감지 — 영어 텍스트 ---
assert('UX-LANG-001',
  detectLanguage('help me build a new feature') === 'en',
  'English text detected as "en"'
);

// --- UX-LANG-002: KO 감지 — 한국어 텍스트 ---
assert('UX-LANG-002',
  detectLanguage('새 기능을 만들어주세요') === 'ko',
  'Korean text detected as "ko"'
);

// --- UX-LANG-003: JA 감지 — 히라가나 포함 ---
assert('UX-LANG-003',
  detectLanguage('新しい機能を作ってください') === 'ja',
  'Japanese text (hiragana) detected as "ja"'
);

// --- UX-LANG-004: ZH 감지 — CJK 한자 (한국어/일본어 아님) ---
assert('UX-LANG-004',
  detectLanguage('创建新功能') === 'zh',
  'Chinese text detected as "zh"'
);

// --- UX-LANG-005: KO 갭 분석 트리거 키워드 매칭 ---
const gapPatterns = AGENT_TRIGGER_PATTERNS['gap-detector'];
assert('UX-LANG-005',
  matchMultiLangPattern('설계대로 구현이 됐어? 확인해줘', gapPatterns) === true,
  'Korean gap analysis keyword "확인" triggers gap-detector'
);

// --- UX-LANG-006: JA 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-006',
  matchMultiLangPattern('これで合ってる? 確認して', gapPatterns) === true,
  'Japanese gap analysis keyword "確認" triggers gap-detector'
);

// --- UX-LANG-007: ZH 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-007',
  matchMultiLangPattern('对吗? 对不对? 验证一下', gapPatterns) === true,
  'Chinese gap analysis keyword "验证" triggers gap-detector'
);

// --- UX-LANG-008: ES 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-008',
  matchMultiLangPattern('está bien? verificar', gapPatterns) === true,
  'Spanish gap analysis keyword "verificar" triggers gap-detector'
);

// --- UX-LANG-009: FR 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-009',
  matchMultiLangPattern("c'est correct? vérifier", gapPatterns) === true,
  'French gap analysis keyword "vérifier" triggers gap-detector'
);

// --- UX-LANG-010: DE 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-010',
  matchMultiLangPattern('ist das richtig? prüfen', gapPatterns) === true,
  'German gap analysis keyword "prüfen" triggers gap-detector'
);

// --- UX-LANG-011: IT 갭 분석 트리거 키워드 매칭 ---
assert('UX-LANG-011',
  matchMultiLangPattern('è giusto? verificare', gapPatterns) === true,
  'Italian gap analysis keyword "verificare" triggers gap-detector'
);

// --- UX-LANG-012: 지원 언어 목록이 정확히 8개 ---
assert('UX-LANG-012',
  Array.isArray(SUPPORTED_LANGUAGES) && SUPPORTED_LANGUAGES.length === 8,
  'SUPPORTED_LANGUAGES contains exactly 8 languages'
);

// --- UX-LANG-013: 모든 8개 언어가 AGENT_TRIGGER_PATTERNS에 존재 ---
const allLangCovered = SUPPORTED_LANGUAGES.every(langCode =>
  AGENT_TRIGGER_PATTERNS['gap-detector'][langCode] !== undefined
);
assert('UX-LANG-013',
  allLangCovered,
  'All 8 languages are covered in gap-detector trigger patterns'
);

// --- UX-LANG-014: null 입력 시 detectLanguage → "en" fallback ---
assert('UX-LANG-014',
  detectLanguage(null) === 'en',
  'detectLanguage returns "en" for null input (safe fallback)'
);

// --- UX-LANG-015: KO pdca-iterator 트리거 키워드 매칭 ---
const iteratorPatterns = AGENT_TRIGGER_PATTERNS['pdca-iterator'];
assert('UX-LANG-015',
  matchMultiLangPattern('이 부분 고쳐줘 개선해줘', iteratorPatterns) === true,
  'Korean improvement keyword "개선해줘" triggers pdca-iterator'
);

// =====================================================================
// LS-001~005 (UX-LANG-016~020): 8 languages in trigger keywords
// =====================================================================

// --- LS-001: SUPPORTED_LANGUAGES includes all 8 codes ---
const expectedLangs = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];
const allPresent = expectedLangs.every(l => SUPPORTED_LANGUAGES.includes(l));
assert('LS-001',
  allPresent,
  'SUPPORTED_LANGUAGES includes EN, KO, JA, ZH, ES, FR, DE, IT'
);

// --- LS-002: code-analyzer has trigger patterns for 8 languages ---
const codeAnalyzerPatterns = AGENT_TRIGGER_PATTERNS['code-analyzer'];
const caLangs = codeAnalyzerPatterns ? Object.keys(codeAnalyzerPatterns) : [];
assert('LS-002',
  caLangs.length >= 8,
  `code-analyzer trigger patterns cover ${caLangs.length} languages (need >= 8)`
);

// --- LS-003: report-generator has trigger patterns for 8 languages ---
const reportPatterns = AGENT_TRIGGER_PATTERNS['report-generator'];
const rgLangs = reportPatterns ? Object.keys(reportPatterns) : [];
assert('LS-003',
  rgLangs.length >= 8,
  `report-generator trigger patterns cover ${rgLangs.length} languages (need >= 8)`
);

// --- LS-004: cto-lead has trigger patterns for 8 languages ---
const ctoPatterns = AGENT_TRIGGER_PATTERNS['cto-lead'];
const ctoLangs = ctoPatterns ? Object.keys(ctoPatterns) : [];
assert('LS-004',
  ctoLangs.length >= 8,
  `cto-lead trigger patterns cover ${ctoLangs.length} languages (need >= 8)`
);

// --- LS-005: starter-guide has trigger patterns for 8 languages ---
const starterPatterns = AGENT_TRIGGER_PATTERNS['starter-guide'];
const sgLangs = starterPatterns ? Object.keys(starterPatterns) : [];
assert('LS-005',
  sgLangs.length >= 8,
  `starter-guide trigger patterns cover ${sgLangs.length} languages (need >= 8)`
);

// =====================================================================
// LS-006~010 (UX-LANG-021~025): New skills have multilingual triggers
// =====================================================================

const fs = require('fs');
const path = require('path');
const SKILLS_DIR = path.join(__dirname, '../../skills');

// --- LS-006: /control SKILL.md has EN+KO trigger keywords (v2.0.8: JA/ZH moved to agents) ---
const controlSkill = fs.readFileSync(path.join(SKILLS_DIR, 'control', 'SKILL.md'), 'utf-8');
const controlHasLang = controlSkill.includes('control') && controlSkill.includes('제어');
assert('LS-006',
  controlHasLang,
  '/control SKILL.md has EN+KO trigger keywords (v2.0.8: 8-lang via agents)'
);

// --- LS-007: /audit SKILL.md has EN+KO trigger keywords (v2.0.8) ---
const auditSkill = fs.readFileSync(path.join(SKILLS_DIR, 'audit', 'SKILL.md'), 'utf-8');
const auditHasLang = auditSkill.includes('audit') && auditSkill.includes('감사');
assert('LS-007',
  auditHasLang,
  '/audit SKILL.md has EN+KO trigger keywords (v2.0.8: 8-lang via agents)'
);

// --- LS-008: /rollback SKILL.md has EN+KO trigger keywords (v2.0.8) ---
const rollbackSkill = fs.readFileSync(path.join(SKILLS_DIR, 'rollback', 'SKILL.md'), 'utf-8');
const rollbackHasLang = rollbackSkill.includes('rollback') && rollbackSkill.includes('롤백');
assert('LS-008',
  rollbackHasLang,
  '/rollback SKILL.md has EN+KO trigger keywords (v2.0.8: 8-lang via agents)'
);

// --- LS-009: /pdca-batch SKILL.md has EN+KO trigger keywords (v2.0.8) ---
const batchSkill = fs.readFileSync(path.join(SKILLS_DIR, 'pdca-batch', 'SKILL.md'), 'utf-8');
const batchHasLang = batchSkill.includes('batch') && batchSkill.includes('배치');
assert('LS-009',
  batchHasLang,
  '/pdca-batch SKILL.md has EN+KO trigger keywords (v2.0.8: 8-lang via agents)'
);

// --- LS-010: bkend-expert has trigger patterns for 8 languages ---
const bkendPatterns = AGENT_TRIGGER_PATTERNS['bkend-expert'];
const bkLangs = bkendPatterns ? Object.keys(bkendPatterns) : [];
assert('LS-010',
  bkLangs.length >= 8,
  `bkend-expert trigger patterns cover ${bkLangs.length} languages (need >= 8)`
);

summary('language-support.test.js');
process.exit(0);
