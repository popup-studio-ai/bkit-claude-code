'use strict';
/**
 * Regression Test: 29 Agents Full Verification (58 TC)
 * Each agent: (1) frontmatter parseable (2) trigger keywords exist
 *
 * @version bkit v1.6.2
 */
const fs = require('fs');
const path = require('path');

const BASE_DIR = path.resolve(__dirname, '../..');
const AGENTS_DIR = path.join(BASE_DIR, 'agents');

let passed = 0, failed = 0, total = 0;

function assert(id, condition, message) {
  total++;
  if (condition) { passed++; console.log(`  PASS: ${id} - ${message}`); }
  else { failed++; console.error(`  FAIL: ${id} - ${message}`); }
}

function skip(id, message) {
  total++;
  passed++;
  console.log(`  SKIP: ${id} - ${message}`);
}

/**
 * Parse YAML frontmatter from markdown file
 * Returns {frontmatter, body} or null on failure
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const raw = match[1];
  const result = {};

  // Simple YAML key extraction (top-level scalar fields)
  const lines = raw.split('\n');
  let currentKey = null;
  let currentValue = '';
  let inMultiline = false;

  for (const line of lines) {
    // Top-level key (not indented or list item)
    const keyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
    if (keyMatch && !inMultiline) {
      if (currentKey) {
        result[currentKey] = currentValue.trim();
      }
      currentKey = keyMatch[1];
      const val = keyMatch[2].trim();
      if (val === '|' || val === '>') {
        inMultiline = true;
        currentValue = '';
      } else {
        inMultiline = false;
        currentValue = val;
      }
    } else if (inMultiline && currentKey) {
      if (line.match(/^\S/) && !line.startsWith(' ') && !line.startsWith('\t')) {
        // New top-level key starts
        result[currentKey] = currentValue.trim();
        const newKeyMatch = line.match(/^(\w[\w-]*)\s*:\s*(.*)/);
        if (newKeyMatch) {
          currentKey = newKeyMatch[1];
          const val = newKeyMatch[2].trim();
          if (val === '|' || val === '>') {
            inMultiline = true;
            currentValue = '';
          } else {
            inMultiline = false;
            currentValue = val;
          }
        }
      } else {
        currentValue += '\n' + line;
      }
    }
  }
  if (currentKey) {
    result[currentKey] = currentValue.trim();
  }

  return result;
}

console.log('\n=== agents-29.test.js (58 TC) ===\n');

// --- Agent definitions (29 agents) ---
const ALL_AGENTS = [
  'cto-lead',
  'pm-lead',
  'bkend-expert',
  'enterprise-expert',
  'frontend-architect',
  'infra-architect',
  'code-analyzer',
  'design-validator',
  'gap-detector',
  'pdca-iterator',
  'pipeline-guide',
  'pm-discovery',
  'pm-prd',
  'pm-research',
  'pm-strategy',
  'product-manager',
  'qa-monitor',
  'qa-strategist',
  'report-generator',
  'security-architect',
  'starter-guide',
  // v1.6.2 additions (8 agents)
  'pdca-eval-plan',
  'pdca-eval-design',
  'pdca-eval-do',
  'pdca-eval-check',
  'pdca-eval-act',
  'pdca-eval-pm',
  'skill-needs-extractor',
  'pm-lead-skill-patch',
];

// --- Valid model values ---
// v2.1.25: 'fable' added (Claude 5 model alignment)
const VALID_MODELS = ['opus', 'sonnet', 'haiku', 'fable'];

// --- Expected model assignments ---
// v2.1.25: synced to the claude-model-alignment matrix (fable/opus/sonnet/haiku)
const EXPECTED_MODELS = {
  'cto-lead': 'fable',
  'pm-lead': 'fable',
  'enterprise-expert': 'opus',
  'infra-architect': 'opus',
  'code-analyzer': 'opus',
  'design-validator': 'fable',
  'gap-detector': 'fable',
  'security-architect': 'opus',
  'bkend-expert': 'sonnet',
  'frontend-architect': 'sonnet',
  'pdca-iterator': 'fable',
  'pipeline-guide': 'sonnet',
  'pm-discovery': 'sonnet',
  'pm-prd': 'sonnet',
  'pm-research': 'sonnet',
  'pm-strategy': 'sonnet',
  'product-manager': 'sonnet',
  'qa-strategist': 'sonnet',
  'starter-guide': 'sonnet',
  'qa-monitor': 'haiku',
  'report-generator': 'haiku',
  // v1.6.2 additions (pdca-eval-* are deprecated tombstones — haiku since v2.1.25)
  'pdca-eval-plan': 'haiku',
  'pdca-eval-design': 'haiku',
  'pdca-eval-do': 'haiku',
  'pdca-eval-check': 'haiku',
  'pdca-eval-act': 'haiku',
  'pdca-eval-pm': 'haiku',
  'skill-needs-extractor': 'sonnet',
  'pm-lead-skill-patch': 'sonnet',
};

// ============================================================
// Test each agent
// ============================================================

ALL_AGENTS.forEach((agent, index) => {
  const num = String(index + 1).padStart(2, '0');
  const agentPath = path.join(AGENTS_DIR, `${agent}.md`);

  // TC1: Frontmatter parseable
  let frontmatter = null;
  let content = '';
  let parseSuccess = false;

  if (fs.existsSync(agentPath)) {
    content = fs.readFileSync(agentPath, 'utf-8');
    frontmatter = parseFrontmatter(content);
    parseSuccess = frontmatter !== null && typeof frontmatter.name === 'string';
  }

  assert(`AG-${num}-FM`, parseSuccess,
    `${agent}: frontmatter parseable with name="${frontmatter?.name || 'N/A'}"`);

  // TC2: Trigger keywords exist in description (internal-only agents exempt)
  const INTERNAL_AGENTS = [
    'pdca-eval-plan', 'pdca-eval-design', 'pdca-eval-do', 'pdca-eval-check',
    'pdca-eval-act', 'pdca-eval-pm', 'skill-needs-extractor', 'pm-lead-skill-patch'
  ];
  if (INTERNAL_AGENTS.includes(agent)) {
    skip(`AG-${num}-TRIG`, `${agent}: internal-only agent, trigger keywords not required`);
  } else {
    let hasTriggers = false;
    if (frontmatter && frontmatter.description) {
      hasTriggers = frontmatter.description.includes('Triggers:') ||
                    frontmatter.description.includes('triggers:');
    }
    assert(`AG-${num}-TRIG`, hasTriggers,
      `${agent}: description contains trigger keywords`);
  }
});

// ============================================================
// Summary
// ============================================================
console.log(`\n=== Results: ${passed}/${total} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
