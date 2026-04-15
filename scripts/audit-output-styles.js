#!/usr/bin/env node
/**
 * Audit Output Styles (ENH-214, G8 게이트)
 *
 * CC v2.1.107 회귀 #47482 (output styles YAML frontmatter 미주입) 방어.
 * - frontmatter의 name/description 필수 검증
 * - 본문 self-contained 검증 (frontmatter 미주입돼도 동작 가능한지)
 *
 * exit 0 == pass, exit 1 == fail
 *
 * @module scripts/audit-output-styles
 */

const fs = require('fs');
const path = require('path');

const PROJECT_DIR = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const STYLES_DIR = path.join(PROJECT_DIR, 'output-styles');

function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([a-zA-Z_]+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].replace(/^["']|["']$/g, '').trim();
  }
  return fm;
}

function audit(file) {
  const content = fs.readFileSync(file, 'utf8');
  const errors = [];

  const fm = parseFrontmatter(content);
  if (!fm) {
    errors.push(`No YAML frontmatter found`);
    return errors;
  }
  if (!fm.name) errors.push(`frontmatter.name 누락`);
  if (!fm.description) errors.push(`frontmatter.description 누락`);

  // Self-contained: 본문에 'Output Style' 또는 'Response Rules' / 'Formatting' 등
  // 핵심 식별자 존재 (frontmatter 주입 실패해도 동작 가능한지)
  const body = content.replace(/^---[\s\S]*?---\n/, '');
  const hasIdentifier = /Output Style|Response Rules|Formatting|Style:|## /i.test(body);
  if (!hasIdentifier) {
    errors.push(`본문 self-contained 식별자 없음 (CC #47482 회귀 방어 필요)`);
  }

  return errors;
}

function main() {
  if (!fs.existsSync(STYLES_DIR)) {
    console.log(`[audit-output-styles] output-styles/ 디렉터리 없음 — skip (pass)`);
    process.exit(0);
  }

  const files = fs.readdirSync(STYLES_DIR)
    .filter((f) => f.endsWith('.md'))
    .map((f) => path.join(STYLES_DIR, f));

  if (files.length === 0) {
    console.log(`[audit-output-styles] *.md 파일 없음 — skip (pass)`);
    process.exit(0);
  }

  let totalErrors = 0;
  for (const file of files) {
    const errors = audit(file);
    const rel = path.relative(PROJECT_DIR, file);
    if (errors.length === 0) {
      console.log(`✓ ${rel}`);
    } else {
      totalErrors += errors.length;
      for (const err of errors) console.error(`✗ ${rel}: ${err}`);
    }
  }

  if (totalErrors > 0) {
    console.error(`\n[audit-output-styles] ${totalErrors} error(s) found — G8 게이트 FAIL`);
    process.exit(1);
  }
  console.log(`\n[audit-output-styles] ${files.length} files OK — G8 게이트 PASS`);
  process.exit(0);
}

if (require.main === module) main();
module.exports = { parseFrontmatter, audit };
