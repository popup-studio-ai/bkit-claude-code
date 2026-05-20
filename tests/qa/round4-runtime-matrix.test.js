#!/usr/bin/env node
/**
 * Round 4 Runtime Matrix Regression Tests
 *
 * Pins fixes for three issues discovered in the bkit v2.1.8 Round 4
 * parallel-agent verification matrix (2026-04-17):
 *   - L1: detectLanguage() must handle ES/FR/DE/IT, not just CJK.
 *   - P2: design-enterprise/starter templates must declare 3 architecture
 *         options (Option A/B/C) like the default design template.
 *   - M8: templates must use single-brace lowercase snake_case variables,
 *         since the substitution engine in lib/core/paths.js only recognizes
 *         that form. Handlebars-style {{#if X}} blocks remain allowed.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const { detectLanguage } = require(path.join(ROOT, 'lib/intent/language.js'));

let pass = 0;
let fail = 0;
const failures = [];

function assert(label, cond, detail) {
  if (cond) {
    pass++;
  } else {
    fail++;
    failures.push(label + (detail ? ' — ' + detail : ''));
  }
}

// L1: 8-language detection
const L1 = [
  ['en', 'Please help me debug this code'],
  ['ko', '이 코드를 디버깅해주세요'],
  ['ja', 'このコードをデバッグしてください'],
  ['zh', '请帮我调试这段代码'],
  ['es', 'Por favor ayúdame a depurar este código'],
  ['fr', "S'il vous plaît aidez-moi à déboguer ce code"],
  ['de', 'Bitte hilf mir diesen Code zu debuggen'],
  ['it', 'Per favore aiutami a eseguire il debug di questo codice'],
];
for (const [expected, sample] of L1) {
  const got = detectLanguage(sample);
  assert(`L1 detectLanguage(${expected})`, got === expected, `got=${got}`);
}

// L1 false-positive guardrails
assert('L1 code → en', detectLanguage('const x = 1;') === 'en');
assert('L1 URL → en', detectLanguage('https://example.com') === 'en');
assert('L1 emoji → en', detectLanguage('😀😀😀') === 'en');
assert('L1 mixed EN+KO → ko (script precedence)', detectLanguage('Hello 안녕') === 'ko');

// P2: design templates must enumerate 3 architecture options
for (const tpl of ['design.template.md', 'design-starter.template.md', 'design-enterprise.template.md']) {
  const body = fs.readFileSync(path.join(ROOT, 'templates', tpl), 'utf8');
  const hasOptionA = /Option A/.test(body);
  const hasOptionB = /Option B/.test(body);
  const hasOptionC = /Option C/.test(body);
  assert(`P2 ${tpl} has Option A/B/C`, hasOptionA && hasOptionB && hasOptionC);
}

// M8: templates must not contain broken UPPER_SNAKE_CASE compound variables.
// Descriptive PascalCase/CamelCase placeholders and single-letter {N}/{M} are
// intentional human-fill hints and are allowed. The specific bug class Round 4
// caught was compound UPPER_SNAKE_CASE that looks intended as runtime variables
// but isn't recognised by the single-brace lowercase substitution engine.
const BAD_UPPER_SNAKE = /\{[A-Z][A-Z0-9]*_[A-Z0-9_]+\}/;
const TEMPLATE_FILES = fs.readdirSync(path.join(ROOT, 'templates'))
  .filter((f) => f.endsWith('.template.md'))
  .map((f) => path.join(ROOT, 'templates', f));

for (const file of TEMPLATE_FILES) {
  const body = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);

  // TEMPLATE-GUIDE.md documents the bad pattern as an example; skip it.
  if (rel.endsWith('TEMPLATE-GUIDE.md')) continue;

  const m = body.match(BAD_UPPER_SNAKE);
  assert(`M8 ${rel} has no broken UPPER_SNAKE_CASE vars`, !m, m ? m[0] : '');
}

// M8: double-brace {{var}} must only be Handlebars blocks (#if/each/etc.)
const HANDLEBARS_OK = /\{\{\s*(\/|#|\^|\/?each|\/?if|>|!)/;
for (const file of TEMPLATE_FILES) {
  const body = fs.readFileSync(file, 'utf8');
  const rel = path.relative(ROOT, file);
  if (rel.endsWith('TEMPLATE-GUIDE.md')) continue;
  const all = body.match(/\{\{[^{}]{1,60}\}\}/g) || [];
  const nonHandlebars = all.filter((x) => !HANDLEBARS_OK.test(x));
  assert(`M8 ${rel} double-brace limited to Handlebars`, nonHandlebars.length === 0, nonHandlebars.slice(0, 3).join(', '));
}

// Summary
console.log(`[round4-runtime-matrix.test] ${pass} PASS / ${fail} FAIL`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log('  - ' + f);
  process.exit(1);
}
process.exit(0);
