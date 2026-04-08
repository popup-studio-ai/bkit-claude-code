#!/usr/bin/env node
'use strict';

/**
 * Language Detection Full Coverage Tests
 * Source: lib/intent/language.js
 * Tests detectLanguage for all 8 supported languages: EN, KO, JA, ZH, ES, FR, DE, IT.
 */

const assert = require('assert');

let passed = 0, failed = 0, total = 0;
function test(id, desc, fn) {
  total++;
  try { fn(); passed++; } catch (e) { failed++; console.error(`  FAIL ${id}: ${desc}\n    ${e.message}`); }
}

console.log('\n=== Language Detection Full Coverage Tests ===\n');

const { detectLanguage, SUPPORTED_LANGUAGES } = require('../../lib/intent/language');

// --- All 8 languages ---

test('LD-01', 'detectLanguage: English (default fallback)', () => {
  const result = detectLanguage('show pdca status');
  assert.strictEqual(result, 'en', `Expected "en", got "${result}"`);
});

test('LD-02', 'detectLanguage: Korean (한국어)', () => {
  const result = detectLanguage('PDCA 상태 보여줘');
  assert.strictEqual(result, 'ko', `Expected "ko", got "${result}"`);
});

test('LD-03', 'detectLanguage: Japanese (日本語)', () => {
  const result = detectLanguage('PDCAのステータスを表示して');
  assert.strictEqual(result, 'ja', `Expected "ja", got "${result}"`);
});

test('LD-04', 'detectLanguage: Chinese (中文)', () => {
  const result = detectLanguage('显示当前状态');
  assert.strictEqual(result, 'zh', `Expected "zh", got "${result}"`);
});

test('LD-05', 'detectLanguage: Spanish — falls back to en (no script detection)', () => {
  // detectLanguage only detects by script (CJK chars), not by vocabulary
  // Spanish uses Latin script, so it falls back to 'en'
  const result = detectLanguage('mostrar el estado del proyecto');
  assert.strictEqual(result, 'en', `Expected "en" (Latin script fallback), got "${result}"`);
});

test('LD-06', 'detectLanguage: French — falls back to en (Latin script)', () => {
  const result = detectLanguage("afficher l'état du projet");
  assert.strictEqual(result, 'en', `Expected "en" (Latin script fallback), got "${result}"`);
});

test('LD-07', 'detectLanguage: German — falls back to en (Latin script)', () => {
  const result = detectLanguage('Projektstatus anzeigen');
  assert.strictEqual(result, 'en', `Expected "en" (Latin script fallback), got "${result}"`);
});

test('LD-08', 'detectLanguage: Italian — falls back to en (Latin script)', () => {
  const result = detectLanguage('mostrare lo stato del progetto');
  assert.strictEqual(result, 'en', `Expected "en" (Latin script fallback), got "${result}"`);
});

// --- Edge cases ---

test('LD-09', 'detectLanguage: empty string returns en', () => {
  const result = detectLanguage('');
  assert.strictEqual(result, 'en', `Expected "en" for empty string, got "${result}"`);
});

test('LD-10', 'detectLanguage: null/undefined returns en', () => {
  const result1 = detectLanguage(null);
  const result2 = detectLanguage(undefined);
  assert.strictEqual(result1, 'en', `Expected "en" for null, got "${result1}"`);
  assert.strictEqual(result2, 'en', `Expected "en" for undefined, got "${result2}"`);
});

test('LD-11', 'SUPPORTED_LANGUAGES includes all 8 languages', () => {
  const expected = ['en', 'ko', 'ja', 'zh', 'es', 'fr', 'de', 'it'];
  for (const lang of expected) {
    assert.ok(SUPPORTED_LANGUAGES.includes(lang),
      `SUPPORTED_LANGUAGES should include "${lang}"`);
  }
  assert.strictEqual(SUPPORTED_LANGUAGES.length, 8,
    `Expected 8 supported languages, got ${SUPPORTED_LANGUAGES.length}`);
});

console.log(`\n--- Results: ${passed}/${total} passed, ${failed} failed ---`);
if (failed > 0) process.exit(1);
